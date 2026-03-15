import logging
import time

from SPARQLWrapper import SPARQLWrapper, JSON

from crawler.core.models import WikidataEvent, EventType
from crawler.spiders.wikipedia.categories import (
    SPARQL_EVENT_CLASSES,
    WIKIDATA_COUNTRY_TO_CODE,
    WIKIDATA_CLASS_TO_CATEGORY,
)

logger = logging.getLogger(__name__)

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
QUERY_DELAY = 2.0  # Wikidata rate limit 준수 (초)


class WikidataSparqlClient:
    def __init__(self, min_sitelinks: int = 5):
        self.sparql = SPARQLWrapper(WIKIDATA_ENDPOINT)
        self.sparql.setReturnFormat(JSON)
        self.sparql.addCustomHttpHeader(
            "User-Agent",
            "TimelineCrawlerBot/0.1 (https://github.com/timeline-project; timeline-crawler@example.com)",
        )
        self.min_sitelinks = min_sitelinks

    def _build_query(self, event_classes: list[str], category_name: str) -> str:
        """태그별 SPARQL 쿼리 생성"""
        # P31 (instance of) 값들을 UNION으로 결합
        class_unions = " UNION ".join(
            f"{{ ?item wdt:P31 wd:{qid} }}" for qid in event_classes
        )

        return f"""
        SELECT ?item ?itemLabel ?itemDescription
               ?itemLabel_ko ?itemDescription_ko
               ?date ?datePrecision
               ?startDate ?startDatePrecision
               ?endDate ?endDatePrecision
               ?sitelinks ?location ?locationLabel ?country
        WHERE {{
            # 이벤트 타입 필터
            {class_unions}

            # 날짜 정보 (point in time 또는 start/end time)
            OPTIONAL {{
                ?item p:P585 ?dateStatement .
                ?dateStatement psv:P585 ?dateValue .
                ?dateValue wikibase:timeValue ?date .
                ?dateValue wikibase:timePrecision ?datePrecision .
            }}
            OPTIONAL {{
                ?item p:P580 ?startStatement .
                ?startStatement psv:P580 ?startValue .
                ?startValue wikibase:timeValue ?startDate .
                ?startValue wikibase:timePrecision ?startDatePrecision .
            }}
            OPTIONAL {{
                ?item p:P582 ?endStatement .
                ?endStatement psv:P582 ?endValue .
                ?endValue wikibase:timeValue ?endDate .
                ?endValue wikibase:timePrecision ?endDatePrecision .
            }}

            # 최소한 날짜가 하나는 있어야 함
            FILTER(BOUND(?date) || BOUND(?startDate))

            # 한국어 라벨 (optional)
            OPTIONAL {{ ?item rdfs:label ?itemLabel_ko FILTER(LANG(?itemLabel_ko) = "ko") }}
            OPTIONAL {{ ?item schema:description ?itemDescription_ko FILTER(LANG(?itemDescription_ko) = "ko") }}

            # 위치 (optional)
            OPTIONAL {{
                ?item wdt:P276 ?location .
            }}

            # 국가 (optional)
            OPTIONAL {{
                ?item wdt:P17 ?country .
            }}

            # sitelinks 수
            ?item wikibase:sitelinks ?sitelinks .
            FILTER(?sitelinks >= {self.min_sitelinks})

            SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }}
        }}
        ORDER BY DESC(?sitelinks)
        LIMIT 500
        """

    def _parse_date(self, date_str: str) -> tuple[int | None, int | None, int | None]:
        """ISO 8601 날짜 문자열에서 year, month, day 추출.

        Wikidata 날짜 형식: "+1392-01-01T00:00:00Z" 또는 "-0776-01-01T00:00:00Z"
        천문학적 연도: 양수 = CE, 음수 = BCE (off-by-one 없음, 0년이 1 BCE)
        """
        if not date_str:
            return None, None, None

        # "+" 또는 "-" 접두사 처리
        date_part = date_str.split("T")[0]

        # 부호 처리
        if date_part.startswith("+"):
            date_part = date_part[1:]

        parts = date_part.split("-")

        # 음수 연도 처리: "-0776-01-01" → parts = ["", "0776", "01", "01"]
        if date_str.startswith("-"):
            year = -int(parts[1])
            month = int(parts[2]) if len(parts) > 2 and parts[2] != "00" else None
            day = int(parts[3]) if len(parts) > 3 and parts[3] != "00" else None
        else:
            year = int(parts[0])
            month = int(parts[1]) if len(parts) > 1 and parts[1] != "00" else None
            day = int(parts[2]) if len(parts) > 2 and parts[2] != "00" else None

        return year, month, day

    def _parse_result(self, result: dict, category_name: str) -> WikidataEvent | None:
        """SPARQL 결과 행 → WikidataEvent 변환"""
        bindings = result

        # QID 추출
        item_uri = bindings.get("item", {}).get("value", "")
        qid = item_uri.split("/")[-1] if item_uri else None
        if not qid:
            return None

        # 날짜 처리
        date_str = bindings.get("date", {}).get("value")
        start_date_str = bindings.get("startDate", {}).get("value")
        end_date_str = bindings.get("endDate", {}).get("value")

        # precision
        precision = int(bindings.get("datePrecision", {}).get("value", "9"))
        start_precision = int(bindings.get("startDatePrecision", {}).get("value", "9"))

        # 이벤트 타입 결정
        if start_date_str and end_date_str:
            event_type = EventType.RANGE
            year, month, day = self._parse_date(start_date_str)
            end_year, end_month, end_day = self._parse_date(end_date_str)
            precision = start_precision
        elif date_str:
            event_type = EventType.POINT
            year, month, day = self._parse_date(date_str)
            end_year, end_month, end_day = None, None, None
        elif start_date_str:
            event_type = EventType.POINT
            year, month, day = self._parse_date(start_date_str)
            end_year, end_month, end_day = None, None, None
            precision = start_precision
        else:
            return None

        if year is None:
            return None

        # 국가 정보 추출
        country_uri = bindings.get("country", {}).get("value", "")
        country_qid = country_uri.split("/")[-1] if country_uri else None
        country_codes = []
        if country_qid and country_qid in WIKIDATA_COUNTRY_TO_CODE:
            country_codes = [WIKIDATA_COUNTRY_TO_CODE[country_qid]]

        return WikidataEvent(
            qid=qid,
            title_ko=bindings.get("itemLabel_ko", {}).get("value"),
            title_en=bindings.get("itemLabel", {}).get("value"),
            description_ko=bindings.get("itemDescription_ko", {}).get("value"),
            description_en=bindings.get("itemDescription", {}).get("value"),
            event_year=year,
            event_month=month,
            event_day=day,
            precision=precision,
            event_type=event_type,
            end_year=end_year,
            end_month=end_month,
            end_day=end_day,
            category_name=category_name,
            location=bindings.get("locationLabel", {}).get("value"),
            sitelinks=int(bindings.get("sitelinks", {}).get("value", "0")),
            country_codes=country_codes,
        )

    def query_by_category(
        self, category_name: str, event_classes: list[str]
    ) -> list[WikidataEvent]:
        """태그별 SPARQL 쿼리 실행"""
        query = self._build_query(event_classes, category_name)
        logger.info(
            f"Querying Wikidata for category: {category_name} ({len(event_classes)} classes)"
        )

        self.sparql.setQuery(query)

        try:
            results = self.sparql.query().convert()
            bindings = results.get("results", {}).get("bindings", [])
            logger.info(f"  -> {len(bindings)} results for {category_name}")

            events = []
            for b in bindings:
                event = self._parse_result(b, category_name)
                if event:
                    events.append(event)

            return events
        except Exception as e:
            logger.error(f"SPARQL query failed for {category_name}: {e}")
            return []

    def _build_joseon_query(self) -> str:
        """조선 시대 전용 SPARQL 쿼리 생성 (다중 전략 UNION)

        전략 1: 한국 관련 국가 엔티티 (P17) + 시기 필터 (1392-1897)
        전략 2: 조선이 주제인 항목 (P921=Q18097) + 시기 필터
        전략 3: 한국 관련 국가 + 주요 이벤트 타입 (글로벌 이벤트 제외)
        전략 4: 한국어 위키 제목에 "조선" 포함
        """
        return f"""
        SELECT DISTINCT ?item ?itemLabel ?itemDescription
               ?itemLabel_ko ?itemDescription_ko
               ?date ?datePrecision
               ?startDate ?startDatePrecision
               ?endDate ?endDatePrecision
               ?sitelinks ?location ?locationLabel ?country ?class
        WHERE {{
            # 전략 1: 한국 관련 국가 + 시기 필터
            {{
                VALUES ?koreanCountry {{ wd:Q18097 wd:Q884 wd:Q423 wd:Q61791 wd:Q28233 }}
                ?item wdt:P17 ?koreanCountry .
            }}
            UNION
            # 전략 2: 조선이 주제인 항목
            {{
                ?item wdt:P921 wd:Q18097 .
            }}
            UNION
            # 전략 3: 주요 이벤트 타입 + 한국 관련 국가 + 한국어 위키백과
            {{
                VALUES ?koreanCountry2 {{ wd:Q18097 wd:Q884 wd:Q423 wd:Q61791 wd:Q28233 wd:Q28179 wd:Q28222 wd:Q28224 }}
                ?item wdt:P17 ?koreanCountry2 .
                ?item wdt:P31 ?eventType .
                VALUES ?eventType {{
                    wd:Q178561   # battle
                    wd:Q8686     # war
                    wd:Q180684   # conflict
                    wd:Q831663   # military campaign
                    wd:Q188055   # siege
                    wd:Q13418847 # historical event
                    wd:Q3024240  # historical period
                    wd:Q35798    # revolution
                    wd:Q7188     # coup d'état
                    wd:Q622521   # treaty
                    wd:Q124757   # rebellion
                    wd:Q1347065  # military operation
                    wd:Q49773    # social movement
                    wd:Q273120   # protest
                    wd:Q12131    # famine
                    wd:Q12136    # disease
                    wd:Q12184    # pandemic
                    wd:Q11090    # epidemic
                }}
            }}
            UNION
            # 전략 4: 한국어 위키 제목에 "조선" 포함
            {{
                ?koArticle schema:about ?item ;
                           schema:isPartOf <https://ko.wikipedia.org/> ;
                           schema:name ?koTitle .
                FILTER(CONTAINS(?koTitle, "조선"))
            }}

            # P31 (instance of) — 태그 추론용
            OPTIONAL {{ ?item wdt:P31 ?class . }}

            # 날짜 정보 (point in time)
            OPTIONAL {{
                ?item p:P585 ?dateStatement .
                ?dateStatement psv:P585 ?dateValue .
                ?dateValue wikibase:timeValue ?date .
                ?dateValue wikibase:timePrecision ?datePrecision .
            }}
            # 시작 날짜
            OPTIONAL {{
                ?item p:P580 ?startStatement .
                ?startStatement psv:P580 ?startValue .
                ?startValue wikibase:timeValue ?startDate .
                ?startValue wikibase:timePrecision ?startDatePrecision .
            }}
            # 종료 날짜
            OPTIONAL {{
                ?item p:P582 ?endStatement .
                ?endStatement psv:P582 ?endValue .
                ?endValue wikibase:timeValue ?endDate .
                ?endValue wikibase:timePrecision ?endDatePrecision .
            }}

            # 최소한 날짜 하나 필요
            FILTER(BOUND(?date) || BOUND(?startDate))

            # 조선 시대 시기 필터 (1392~1897)
            BIND(IF(BOUND(?date), YEAR(?date), YEAR(?startDate)) AS ?eventYear)
            FILTER(?eventYear >= 1392 && ?eventYear <= 1897)

            # 한국어 라벨 (optional)
            OPTIONAL {{ ?item rdfs:label ?itemLabel_ko FILTER(LANG(?itemLabel_ko) = "ko") }}
            OPTIONAL {{ ?item schema:description ?itemDescription_ko FILTER(LANG(?itemDescription_ko) = "ko") }}

            # 위치 (optional)
            OPTIONAL {{ ?item wdt:P276 ?location . }}
            # 국가 (optional)
            OPTIONAL {{ ?item wdt:P17 ?country . }}

            # sitelinks 수
            ?item wikibase:sitelinks ?sitelinks .
            FILTER(?sitelinks >= {self.min_sitelinks})

            SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }}
        }}
        ORDER BY DESC(?sitelinks)
        LIMIT 2000
        """

    def _parse_joseon_result(
        self, result: dict, classes_by_qid: dict[str, list[str]], extra_tags: list[str] | None = None
    ) -> WikidataEvent | None:
        """조선 SPARQL 결과 행 → WikidataEvent 변환 (P31 기반 태그 추론 포함)"""
        bindings = result

        # QID 추출
        item_uri = bindings.get("item", {}).get("value", "")
        qid = item_uri.split("/")[-1] if item_uri else None
        if not qid:
            return None

        # 날짜 처리
        date_str = bindings.get("date", {}).get("value")
        start_date_str = bindings.get("startDate", {}).get("value")
        end_date_str = bindings.get("endDate", {}).get("value")

        # precision
        precision = int(bindings.get("datePrecision", {}).get("value", "9"))
        start_precision = int(bindings.get("startDatePrecision", {}).get("value", "9"))

        # 이벤트 타입 결정
        if start_date_str and end_date_str:
            event_type = EventType.RANGE
            year, month, day = self._parse_date(start_date_str)
            end_year, end_month, end_day = self._parse_date(end_date_str)
            precision = start_precision
        elif date_str:
            event_type = EventType.POINT
            year, month, day = self._parse_date(date_str)
            end_year, end_month, end_day = None, None, None
        elif start_date_str:
            event_type = EventType.POINT
            year, month, day = self._parse_date(start_date_str)
            end_year, end_month, end_day = None, None, None
            precision = start_precision
        else:
            return None

        if year is None:
            return None

        # P31 클래스 기반 태그 추론 (이미 수집된 classes_by_qid 활용)
        wikidata_classes = classes_by_qid.get(qid, [])
        category_name = None
        for cls_qid in wikidata_classes:
            if cls_qid in WIKIDATA_CLASS_TO_CATEGORY:
                category_name = WIKIDATA_CLASS_TO_CATEGORY[cls_qid]
                break
        # 매핑 없으면 기본값: 정치 (조선 이벤트는 대부분 정치/역사적)
        if category_name is None:
            category_name = "정치"

        # 조선 이벤트는 항상 한국(KR)
        country_codes = ["KR"]

        return WikidataEvent(
            qid=qid,
            title_ko=bindings.get("itemLabel_ko", {}).get("value"),
            title_en=bindings.get("itemLabel", {}).get("value"),
            description_ko=bindings.get("itemDescription_ko", {}).get("value"),
            description_en=bindings.get("itemDescription", {}).get("value"),
            event_year=year,
            event_month=month,
            event_day=day,
            precision=precision,
            event_type=event_type,
            end_year=end_year,
            end_month=end_month,
            end_day=end_day,
            category_name=category_name,
            location=bindings.get("locationLabel", {}).get("value"),
            sitelinks=int(bindings.get("sitelinks", {}).get("value", "0")),
            country_codes=country_codes,
            extra_categories=extra_tags or ["조선"],
        )

    def query_joseon(self, extra_tags: list[str] | None = None) -> list[WikidataEvent]:
        """조선 시대(1392~1897) 이벤트 SPARQL 쿼리 실행"""
        query = self._build_joseon_query()
        logger.info(
            f"Querying Wikidata for Joseon Dynasty events (min_sitelinks={self.min_sitelinks})"
        )

        self.sparql.setQuery(query)

        try:
            results = self.sparql.query().convert()
            bindings = results.get("results", {}).get("bindings", [])
            logger.info(f"  -> {len(bindings)} raw results for Joseon")
        except Exception as e:
            logger.error(f"SPARQL query failed for Joseon: {e}")
            return []

        # 1단계: QID별 P31 클래스 목록 수집 (중복 행 때문에 먼저 집계)
        classes_by_qid: dict[str, list[str]] = {}
        for b in bindings:
            item_uri = b.get("item", {}).get("value", "")
            qid = item_uri.split("/")[-1] if item_uri else None
            if not qid:
                continue
            class_uri = b.get("class", {}).get("value", "")
            class_qid = class_uri.split("/")[-1] if class_uri else None
            if class_qid:
                if qid not in classes_by_qid:
                    classes_by_qid[qid] = []
                if class_qid not in classes_by_qid[qid]:
                    classes_by_qid[qid].append(class_qid)

        # 2단계: QID별로 중복 제거 후 WikidataEvent 생성
        seen_qids: set[str] = set()
        events: list[WikidataEvent] = []

        for b in bindings:
            item_uri = b.get("item", {}).get("value", "")
            qid = item_uri.split("/")[-1] if item_uri else None
            if not qid or qid in seen_qids:
                continue
            seen_qids.add(qid)

            event = self._parse_joseon_result(b, classes_by_qid, extra_tags=extra_tags)
            if event:
                events.append(event)

        logger.info(f"  -> {len(events)} unique Joseon events after deduplication")
        return events

    def query_all(self) -> list[WikidataEvent]:
        """모든 태그에 대해 SPARQL 쿼리 실행"""
        all_events: list[WikidataEvent] = []
        seen_qids: set[str] = set()

        for category_name, event_classes in SPARQL_EVENT_CLASSES.items():
            events = self.query_by_category(category_name, event_classes)

            # 중복 제거 (QID 기준)
            for event in events:
                if event.qid not in seen_qids:
                    seen_qids.add(event.qid)
                    all_events.append(event)

            # Rate limit 준수
            time.sleep(QUERY_DELAY)

        logger.info(f"Total unique events: {len(all_events)}")
        return all_events
