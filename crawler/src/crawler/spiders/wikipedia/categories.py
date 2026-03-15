"""Wikidata Q class → Timeline 태그 매핑"""

# Wikidata class QID → Timeline 태그 이름
WIKIDATA_CLASS_TO_CATEGORY: dict[str, str] = {
    # 전쟁
    "Q178561": "전쟁",     # battle
    "Q8686": "전쟁",       # war
    "Q180684": "전쟁",     # conflict
    "Q831663": "전쟁",     # military campaign
    "Q188055": "전쟁",     # siege

    # 정치
    "Q13418847": "정치",   # historical event
    "Q3024240": "정치",    # historical period
    "Q11514315": "정치",   # historical country
    "Q35798": "정치",      # revolution
    "Q7188": "정치",       # coup d'état
    "Q622521": "정치",     # treaty

    # 자연
    "Q7944": "자연",       # flood
    "Q8065": "자연",       # drought
    "Q8070": "자연",       # earthquake
    "Q8076": "자연",       # volcanic eruption
    "Q168983": "자연",     # extinction event
    "Q1190554": "자연",    # natural disaster

    # 과학
    "Q7191": "과학",       # Nobel Prize
    "Q38104": "과학",      # Nobel Prize in Physics
    "Q35637": "과학",      # Nobel Peace Prize
    "Q37922": "과학",      # Nobel Prize in Literature
    "Q16722767": "과학",   # astronomical event
    "Q3327521": "과학",    # space mission

    # 기술
    "Q39614": "기술",      # invention
    "Q40218": "기술",      # spacecraft
    "Q697175": "기술",     # launch vehicle
    "Q1775296": "기술",    # space program

    # 문화
    "Q1656682": "문화",    # event (general cultural)
    "Q2761147": "문화",    # art movement
    "Q3326717": "문화",    # literary movement
    "Q2198855": "문화",    # cultural movement

    # 경제
    "Q29642544": "경제",   # economic crisis (upper)
    "Q766349": "경제",     # economic bubble
    "Q290178": "경제",     # economic crisis
    "Q114380": "경제",     # financial crisis
    "Q176494": "경제",     # recession
    "Q1020018": "경제",    # stock market crash
    "Q692412": "경제",     # trade war
    "Q252550": "경제",     # trade agreement
    "Q3536928": "경제",    # free trade agreement

    # 종교
    "Q2393187": "종교",    # religious event
    "Q5821215": "종교",    # crusade
    "Q51645": "종교",      # ecumenical council
    "Q126287984": "종교",  # religious schism
    "Q25617461": "종교",   # Reformation
    "Q26706978": "종교",   # religious reform

    # 사회
    "Q49773": "사회",      # social movement
    "Q15052536": "사회",   # social event
    "Q48537": "사회",      # civil rights movement
    "Q273120": "사회",     # protest
    "Q49776": "사회",      # strike
    "Q120644836": "사회",  # protest movement

    # 탐험
    "Q2085381": "탐험",    # expedition
    "Q170382": "탐험",     # voyage of exploration
    "Q366301": "탐험",     # research expedition
    "Q175251": "탐험",     # circumnavigation
    "Q16634024": "탐험",   # space exploration

    # 의학
    "Q12136": "의학",      # disease
    "Q12184": "의학",      # pandemic
    "Q11090": "의학",      # epidemic
    "Q1516910": "의학",    # plague epidemic
    "Q134808": "의학",     # vaccine

    # 스포츠
    "Q16510064": "스포츠",  # sporting event
    "Q5389": "스포츠",     # Olympic Games
    "Q13406554": "스포츠",  # sports competition
    "Q500834": "스포츠",   # tournament
    "Q159821": "스포츠",   # Summer Olympic Games
    "Q82414": "스포츠",    # Winter Olympic Games
    "Q19317": "스포츠",    # FIFA World Cup

    # 조선 관련 추가 클래스
    "Q82955": "정치",      # politician (왕/관료 등 역사적 인물 이벤트)
    "Q1347065": "전쟁",    # military operation
    "Q124757": "사회",     # rebellion/revolt
    "Q7278": "정치",       # political party
    "Q1261214": "정치",    # government policy
    "Q12131": "경제",      # famine
}

# SPARQL에서 사용할 이벤트 Q class 목록 (태그별 쿼리용)
SPARQL_EVENT_CLASSES: dict[str, list[str]] = {
    "전쟁": ["Q178561", "Q8686", "Q180684", "Q831663", "Q188055"],
    "정치": ["Q13418847", "Q3024240", "Q35798", "Q7188", "Q622521"],
    "자연": ["Q7944", "Q8065", "Q8070", "Q8076", "Q168983", "Q1190554"],
    "과학": ["Q7191", "Q38104", "Q35637", "Q37922", "Q16722767", "Q3327521"],
    "기술": ["Q39614", "Q40218", "Q697175", "Q1775296"],
    "문화": ["Q1656682", "Q2761147", "Q3326717", "Q2198855"],
    "경제": ["Q29642544", "Q766349", "Q290178", "Q114380", "Q176494", "Q1020018", "Q692412", "Q252550", "Q3536928"],
    "종교": ["Q2393187", "Q5821215", "Q51645", "Q126287984", "Q25617461", "Q26706978"],
    "사회": ["Q49773", "Q15052536", "Q48537", "Q273120", "Q49776", "Q120644836"],
    "탐험": ["Q2085381", "Q170382", "Q366301", "Q175251", "Q16634024"],
    "의학": ["Q12136", "Q12184", "Q11090", "Q1516910", "Q134808"],
    "스포츠": ["Q16510064", "Q5389", "Q13406554", "Q500834", "Q159821", "Q82414", "Q19317"],
}


def resolve_category(wikidata_classes: list[str]) -> str | None:
    """Wikidata P31 값 목록에서 태그를 결정"""
    for qid in wikidata_classes:
        if qid in WIKIDATA_CLASS_TO_CATEGORY:
            return WIKIDATA_CLASS_TO_CATEGORY[qid]
    return None


# Wikidata 국가 QID → Backend 국가 코드 매핑
WIKIDATA_COUNTRY_TO_CODE: dict[str, str] = {
    # 한국
    "Q884": "KR",       # South Korea
    "Q423": "KR",       # North Korea (한반도 통합)
    "Q18097": "KR",     # Joseon
    "Q28233": "KR",     # Goryeo
    "Q28179": "KR",     # Silla
    "Q28222": "KR",     # Goguryeo
    "Q28224": "KR",     # Baekje
    "Q61791": "KR",     # Korean Empire

    # 미국
    "Q30": "US",        # United States

    # 중국
    "Q148": "CN",       # China
    "Q7462": "CN",      # Ming dynasty
    "Q8733": "CN",      # Qing dynasty
    "Q9903": "CN",      # Tang dynasty
    "Q12460": "CN",     # Han dynasty
    "Q35724": "CN",     # Song dynasty
    "Q8740": "CN",      # Yuan dynasty

    # 일본
    "Q17": "JP",        # Japan
    "Q153015": "JP",    # Empire of Japan

    # 영국
    "Q145": "GB",       # United Kingdom
    "Q174193": "GB",    # British Empire
    "Q179876": "GB",    # Kingdom of England

    # 프랑스
    "Q142": "FR",       # France
    "Q70972": "FR",     # First French Empire
    "Q71084": "FR",     # French First Republic

    # 독일
    "Q183": "DE",       # Germany
    "Q7318": "DE",      # Nazi Germany
    "Q43287": "DE",     # German Empire
    "Q16957": "DE",     # East Germany
    "Q713750": "DE",    # West Germany

    # 러시아
    "Q159": "RU",       # Russia
    "Q15180": "RU",     # Soviet Union
    "Q34266": "RU",     # Russian Empire

    # 이탈리아
    "Q38": "IT",        # Italy
    "Q2277": "IT",      # Roman Empire
    "Q1747689": "IT",   # Kingdom of Italy

    # 인도
    "Q668": "IN",       # India
    "Q6766": "IN",      # Mughal Empire

    # 이집트
    "Q79": "EG",        # Egypt
    "Q11768": "EG",     # Ancient Egypt

    # 그리스
    "Q41": "GR",        # Greece
    "Q11772": "GR",     # Ancient Greece
    "Q4436": "GR",      # Athens

    # 터키
    "Q43": "TR",        # Turkey
    "Q12560": "TR",     # Ottoman Empire
    "Q12544": "TR",     # Byzantine Empire

    # 스페인
    "Q29": "ES",        # Spain
    "Q150": "ES",       # Spanish Empire

    # 글로벌 / 기타 지역
    "Q46": "GLOBAL",    # Europe (대륙 단위는 글로벌)
    "Q48": "GLOBAL",    # Asia
    "Q15": "GLOBAL",    # Africa
    "Q18": "GLOBAL",    # South America
    "Q49": "GLOBAL",    # North America
}

# 국가별 Wikidata 설정 (extract-country 명령용)
# country_qids: P17 (country) 값으로 사용할 QID 목록
# subject_qids: P921 (main subject) 값으로 사용할 QID 목록
# place_qids: P276 (location) 값으로 사용할 QID 목록
COUNTRY_CONFIGS: dict[str, dict] = {
    "US": {
        "name_ko": "미국",
        "country_qids": ["Q30"],
        "subject_qids": ["Q30"],
        "place_qids": ["Q30", "Q60", "Q65", "Q1297"],  # US, NYC, LA, Chicago
    },
    "CN": {
        "name_ko": "중국",
        "country_qids": ["Q148", "Q7462", "Q8733", "Q9903", "Q12460", "Q35724", "Q8740"],
        "subject_qids": ["Q148", "Q7462", "Q8733", "Q9903"],
        "place_qids": ["Q148", "Q956", "Q8686"],  # China, Beijing, Shanghai
    },
    "JP": {
        "name_ko": "일본",
        "country_qids": ["Q17", "Q153015"],
        "subject_qids": ["Q17", "Q153015"],
        "place_qids": ["Q17", "Q1490", "Q35765"],  # Japan, Tokyo, Osaka
    },
    "GB": {
        "name_ko": "영국",
        "country_qids": ["Q145", "Q174193", "Q179876"],
        "subject_qids": ["Q145", "Q174193"],
        "place_qids": ["Q145", "Q84"],  # UK, London
    },
    "FR": {
        "name_ko": "프랑스",
        "country_qids": ["Q142", "Q70972", "Q71084"],
        "subject_qids": ["Q142"],
        "place_qids": ["Q142", "Q90"],  # France, Paris
    },
    "DE": {
        "name_ko": "독일",
        "country_qids": ["Q183", "Q7318", "Q43287", "Q16957", "Q713750"],
        "subject_qids": ["Q183", "Q7318"],
        "place_qids": ["Q183", "Q64"],  # Germany, Berlin
    },
    "RU": {
        "name_ko": "러시아",
        "country_qids": ["Q159", "Q15180", "Q34266"],
        "subject_qids": ["Q159", "Q15180"],
        "place_qids": ["Q159", "Q649"],  # Russia, Moscow
    },
    "IT": {
        "name_ko": "이탈리아",
        "country_qids": ["Q38", "Q2277", "Q1747689"],
        "subject_qids": ["Q38", "Q2277"],
        "place_qids": ["Q38", "Q220"],  # Italy, Rome
    },
    "IN": {
        "name_ko": "인도",
        "country_qids": ["Q668", "Q6766"],
        "subject_qids": ["Q668"],
        "place_qids": ["Q668", "Q1353"],  # India, Delhi
    },
    "EG": {
        "name_ko": "이집트",
        "country_qids": ["Q79", "Q11768"],
        "subject_qids": ["Q79", "Q11768"],
        "place_qids": ["Q79", "Q85"],  # Egypt, Cairo
    },
    "GR": {
        "name_ko": "그리스",
        "country_qids": ["Q41", "Q11772", "Q4436"],
        "subject_qids": ["Q41", "Q11772"],
        "place_qids": ["Q41", "Q1524"],  # Greece, Athens
    },
    "TR": {
        "name_ko": "터키",
        "country_qids": ["Q43", "Q12560", "Q12544"],
        "subject_qids": ["Q43", "Q12560", "Q12544"],
        "place_qids": ["Q43", "Q406"],  # Turkey, Istanbul
    },
    "ES": {
        "name_ko": "스페인",
        "country_qids": ["Q29", "Q150"],
        "subject_qids": ["Q29", "Q150"],
        "place_qids": ["Q29", "Q2807"],  # Spain, Madrid
    },
}
