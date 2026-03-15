from enum import Enum
from pydantic import BaseModel, Field


class EventType(str, Enum):
    POINT = "POINT"
    RANGE = "RANGE"


class PrecisionLevel(str, Enum):
    BILLION_YEARS = "BILLION_YEARS"                      # 0
    HUNDRED_MILLION_YEARS = "HUNDRED_MILLION_YEARS"      # 1
    TEN_MILLION_YEARS = "TEN_MILLION_YEARS"              # 2
    MILLION_YEARS = "MILLION_YEARS"                      # 3
    HUNDRED_THOUSAND_YEARS = "HUNDRED_THOUSAND_YEARS"    # 4
    TEN_THOUSAND_YEARS = "TEN_THOUSAND_YEARS"            # 5
    MILLENNIUM = "MILLENNIUM"                            # 6
    CENTURY = "CENTURY"                                  # 7
    DECADE = "DECADE"                                    # 8
    YEAR = "YEAR"                                        # 9
    MONTH = "MONTH"                                      # 10
    DAY = "DAY"                                          # 11
    HOUR = "HOUR"                                        # 12
    MINUTE = "MINUTE"                                    # 13
    SECOND = "SECOND"                                    # 14


# Wikidata precision code (0~14) → PrecisionLevel 매핑
WIKIDATA_PRECISION_MAP: dict[int, PrecisionLevel] = {
    0: PrecisionLevel.BILLION_YEARS,
    1: PrecisionLevel.HUNDRED_MILLION_YEARS,
    2: PrecisionLevel.TEN_MILLION_YEARS,
    3: PrecisionLevel.MILLION_YEARS,
    4: PrecisionLevel.HUNDRED_THOUSAND_YEARS,
    5: PrecisionLevel.TEN_THOUSAND_YEARS,
    6: PrecisionLevel.MILLENNIUM,
    7: PrecisionLevel.CENTURY,
    8: PrecisionLevel.DECADE,
    9: PrecisionLevel.YEAR,
    10: PrecisionLevel.MONTH,
    11: PrecisionLevel.DAY,
    12: PrecisionLevel.HOUR,
    13: PrecisionLevel.MINUTE,
    14: PrecisionLevel.SECOND,
}


class TimelineRequest(BaseModel):
    """Backend API POST /api/timelines 요청 모델"""

    title: str
    description: str | None = None
    category_ids: list[int] = Field(alias="categoryIds")
    country_ids: list[int] = Field(default_factory=list, alias="countryIds")
    event_year: int = Field(alias="eventYear")
    precision_level: PrecisionLevel = Field(alias="precisionLevel")
    event_month: int | None = Field(default=None, alias="eventMonth")
    event_day: int | None = Field(default=None, alias="eventDay")
    sort_order: int = Field(default=0, alias="sortOrder")
    event_type: EventType = Field(default=EventType.POINT, alias="eventType")
    end_year: int | None = Field(default=None, alias="endYear")
    end_month: int | None = Field(default=None, alias="endMonth")
    end_day: int | None = Field(default=None, alias="endDay")
    source: str | None = None
    location: str | None = None
    uncertainty_years: int | None = Field(default=None, alias="uncertaintyYears")

    model_config = {"populate_by_name": True}


class CategoryInfo(BaseModel):
    """Backend 태그 정보"""

    id: int
    name: str
    description: str | None = None


class CountryInfo(BaseModel):
    """Backend 국가 정보"""

    id: int
    name: str
    code: str


class WikidataEvent(BaseModel):
    """Wikidata에서 추출한 원시 이벤트 데이터"""

    qid: str                           # Wikidata QID (예: Q12345)
    title_ko: str | None = None        # 한국어 라벨
    title_en: str | None = None        # 영어 라벨
    description_ko: str | None = None  # 한국어 설명
    description_en: str | None = None  # 영어 설명
    event_year: int | None = None
    event_month: int | None = None
    event_day: int | None = None
    precision: int = 9                 # Wikidata precision code (0~14)
    event_type: EventType = EventType.POINT
    end_year: int | None = None
    end_month: int | None = None
    end_day: int | None = None
    category_name: str | None = None   # 매핑된 태그 이름
    location: str | None = None
    sitelinks: int = 0                 # 위키백과 언어판 수
    wikidata_classes: list[str] = Field(default_factory=list)  # P31 값들
    country_codes: list[str] = Field(default_factory=list)  # 매핑된 국가 코드 목록
    extra_categories: list[str] = Field(default_factory=list)  # 추가 태그 태그 목록

    @property
    def title(self) -> str:
        """한국어 우선, 영어 fallback"""
        return self.title_ko or self.title_en or self.qid

    @property
    def description(self) -> str | None:
        """한국어 우선, 영어 fallback"""
        return self.description_ko or self.description_en

    @property
    def precision_level(self) -> PrecisionLevel:
        return WIKIDATA_PRECISION_MAP.get(self.precision, PrecisionLevel.YEAR)
