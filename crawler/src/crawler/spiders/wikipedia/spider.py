import json
import logging
from pathlib import Path

from crawler.core.api_client import TimelineApiClient
from crawler.core.models import WikidataEvent, TimelineRequest
from crawler.core.tag_analyzer import analyze_tags
from crawler.spiders.wikipedia.mediawiki import MediaWikiClient
from crawler.spiders.wikipedia.sparql import WikidataSparqlClient

logger = logging.getLogger(__name__)


class WikipediaSpider:
    """Wikipedia/Wikidata 크롤링 spider"""

    def __init__(self, min_sitelinks: int = 5):
        self.min_sitelinks = min_sitelinks

    def extract(self, output_path: str = "data/wikipedia_events.json"):
        """Phase 1: Wikidata SPARQL 추출 + MediaWiki 보강 -> JSON 저장"""
        logger.info("=== Extract Phase Start ===")

        # 1. SPARQL 쿼리
        sparql_client = WikidataSparqlClient(min_sitelinks=self.min_sitelinks)
        events = sparql_client.query_all()
        logger.info(f"SPARQL: {len(events)} events extracted")

        # 2. MediaWiki 설명 보강
        mediawiki_client = MediaWikiClient()
        events = mediawiki_client.enrich_events(events)
        mediawiki_client.close()

        # 3. JSON 파일로 저장
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        data = [event.model_dump() for event in events]
        output.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        logger.info(f"Saved {len(events)} events to {output_path}")
        logger.info("=== Extract Phase Complete ===")

    def extract_joseon(self, output_path: str = "data/joseon_events.json", extra_tags: list[str] | None = None):
        """Phase 1 (조선): Wikidata SPARQL 추출 + MediaWiki 보강 -> JSON 저장"""
        logger.info("=== Joseon Extract Phase Start ===")

        # 1. SPARQL 쿼리 (min_sitelinks 낮게 설정하여 한국어 위키 적은 항목도 포함)
        sparql_client = WikidataSparqlClient(min_sitelinks=self.min_sitelinks)
        events = sparql_client.query_joseon(extra_tags=extra_tags)
        logger.info(f"SPARQL: {len(events)} Joseon events extracted")

        # 2. MediaWiki 설명 보강
        mediawiki_client = MediaWikiClient()
        events = mediawiki_client.enrich_events(events)
        mediawiki_client.close()

        # 3. JSON 파일로 저장
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        data = [event.model_dump() for event in events]
        output.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        logger.info(f"Saved {len(events)} Joseon events to {output_path}")
        logger.info("=== Joseon Extract Phase Complete ===")

    def load(
        self,
        input_path: str = "data/wikipedia_events.json",
        api_url: str = "http://localhost:8080",
        dry_run: bool = False,
        extra_tags: list[str] | None = None,
    ):
        """Phase 2: JSON -> Backend API 적재"""
        logger.info("=== Load Phase Start ===")

        # 1. JSON 파일 로드
        input_file = Path(input_path)
        if not input_file.exists():
            logger.error(f"Input file not found: {input_path}")
            return

        data = json.loads(input_file.read_text(encoding="utf-8"))
        events = [WikidataEvent(**item) for item in data]
        logger.info(f"Loaded {len(events)} events from {input_path}")

        if dry_run:
            for event in events[:10]:
                logger.info(
                    f"  [DRY RUN] {event.title} ({event.event_year}, {event.category_name})"
                )
            logger.info(f"  ... and {len(events) - 10} more")
            return

        # 2. Backend API 연결
        with TimelineApiClient(base_url=api_url) as api:
            # 태그 매핑 조회
            category_map = api.get_category_map()
            logger.info(f"Backend categories: {list(category_map.keys())}")

            # 국가 매핑 조회
            country_map = api.get_country_map()
            logger.info(f"Backend countries: {list(country_map.keys())}")

            # 3. 이벤트 적재
            success = 0
            skipped = 0
            failed = 0

            for event in events:
                # CLI에서 전달된 추가 태그 병합
                if extra_tags:
                    for tag in extra_tags:
                        if tag not in event.extra_categories:
                            event.extra_categories.append(tag)

                # 태그 ID 결정
                cat_name = event.category_name
                if not cat_name or cat_name not in category_map:
                    logger.warning(
                        f"Unknown tag '{cat_name}' for {event.qid}, skipping"
                    )
                    skipped += 1
                    continue

                category_ids = [category_map[cat_name].id]

                # 추가 태그 (extra_categories) 처리 — 없으면 자동 생성
                for extra_cat in event.extra_categories:
                    cat_info = api.ensure_category(extra_cat)
                    if cat_info.id not in category_ids:
                        category_ids.append(cat_info.id)
                    # 캐시 갱신 (ensure가 생성했을 수 있으므로)
                    category_map = api.get_category_map()

                # 키워드 기반 태그 자동 분석
                existing_tag_names = [cat_name] + event.extra_categories
                analyzed_tags = analyze_tags(
                    event.title, event.description, existing_tag_names
                )
                for tag_name in analyzed_tags:
                    cat_info = api.ensure_category(tag_name)
                    if cat_info.id not in category_ids:
                        category_ids.append(cat_info.id)
                    category_map = api.get_category_map()

                # 국가 ID 결정
                country_ids = []
                for code in event.country_codes:
                    if code in country_map:
                        country_ids.append(country_map[code].id)

                # TimelineRequest 생성
                request = TimelineRequest(
                    title=event.title,
                    description=event.description,
                    categoryIds=category_ids,
                    countryIds=country_ids,
                    eventYear=event.event_year,
                    precisionLevel=event.precision_level,
                    eventMonth=event.event_month,
                    eventDay=event.event_day,
                    eventType=event.event_type,
                    endYear=event.end_year,
                    endMonth=event.end_month,
                    endDay=event.end_day,
                    source=f"wd:{event.qid}",
                    location=event.location,
                )

                try:
                    api.create_timeline(request)
                    success += 1
                    if success % 50 == 0:
                        logger.info(f"  Progress: {success} events created")
                except Exception as e:
                    logger.error(f"Failed to create {event.qid} ({event.title}): {e}")
                    failed += 1

            logger.info("=== Load Phase Complete ===")
            logger.info(f"  Success: {success}, Skipped: {skipped}, Failed: {failed}")
