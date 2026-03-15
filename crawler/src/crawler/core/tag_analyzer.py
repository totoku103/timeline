"""이벤트 제목/설명 키워드 기반 태그 자동 분석"""

import logging

logger = logging.getLogger(__name__)

# 태그별 키워드 매핑 (태그 이름 → 키워드 리스트)
TAG_KEYWORDS: dict[str, list[str]] = {
    "전쟁": ["전투", "전쟁", "공방전", "침략", "공격", "포위", "함락", "정벌", "작전",
             "battle", "war", "siege", "campaign", "invasion", "conflict"],
    "정치": ["왕", "정치", "조약", "외교", "개혁", "정변", "즉위", "퇴위", "조정", "정권",
             "혁명", "쿠데타", "독립", "건국", "treaty", "revolution", "reform", "coup"],
    "사회": ["운동", "봉기", "민란", "항쟁", "시위", "폭동", "반란", "농민",
             "movement", "rebellion", "revolt", "protest", "uprising"],
    "문화": ["문학", "예술", "음악", "건축", "그림", "서적", "문화", "축제",
             "art", "culture", "literature", "music", "festival"],
    "경제": ["경제", "무역", "기근", "화폐", "세금", "상업",
             "economy", "trade", "famine", "commerce"],
    "과학": ["과학", "발견", "발명", "천문", "관측",
             "science", "discovery", "invention", "observatory"],
    "종교": ["종교", "불교", "유교", "기독교", "사찰", "선교",
             "religion", "buddhism", "confuci", "christian", "temple", "mission"],
    "자연": ["지진", "태풍", "홍수", "가뭄", "화산", "재해", "역병",
             "earthquake", "flood", "drought", "volcano", "disaster"],
    "의학": ["전염병", "역병", "질병", "백신", "의학", "치료",
             "plague", "epidemic", "pandemic", "disease", "vaccine", "medicine"],
    "탐험": ["탐험", "항해", "원정", "발견", "expedition", "voyage", "exploration"],
    "스포츠": ["올림픽", "경기", "대회", "스포츠", "olympic", "sport", "tournament"],
    "기술": ["기술", "발명", "기계", "인쇄", "technology", "invention", "machine"],
}


def analyze_tags(
    title: str,
    description: str | None,
    existing_categories: list[str] | None = None,
) -> list[str]:
    """이벤트 제목/설명을 분석하여 적합한 태그 목록 반환.

    Args:
        title: 이벤트 제목
        description: 이벤트 설명
        existing_categories: 이미 할당된 태그 목록 (중복 방지)

    Returns:
        추가할 태그 이름 목록 (기존 태그 제외)
    """
    existing = set(existing_categories or [])
    text = f"{title} {description or ''}".lower()

    matched_tags: list[str] = []
    for tag_name, keywords in TAG_KEYWORDS.items():
        if tag_name in existing:
            continue
        for keyword in keywords:
            if keyword.lower() in text:
                matched_tags.append(tag_name)
                break

    return matched_tags
