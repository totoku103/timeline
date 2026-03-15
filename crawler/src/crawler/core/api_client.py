import httpx
import logging
from crawler.core.models import TimelineRequest, CategoryInfo, CountryInfo

logger = logging.getLogger(__name__)


class TimelineApiClient:
    """Backend REST API 클라이언트"""

    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(
            base_url=self.base_url,
            timeout=30.0,
            headers={"Content-Type": "application/json"},
        )
        self._category_cache: dict[str, CategoryInfo] | None = None
        self._country_cache: dict[str, CountryInfo] | None = None

    def get_categories(self) -> list[CategoryInfo]:
        """GET /api/categories — 전체 태그 조회"""
        resp = self.client.get("/api/categories")
        resp.raise_for_status()
        return [CategoryInfo(**c) for c in resp.json()]

    def get_category_map(self) -> dict[str, CategoryInfo]:
        """태그 이름 → CategoryInfo 매핑 (캐시)"""
        if self._category_cache is None:
            categories = self.get_categories()
            self._category_cache = {c.name: c for c in categories}
        return self._category_cache

    def get_countries(self) -> list[CountryInfo]:
        """GET /api/countries — 전체 국가 조회"""
        resp = self.client.get("/api/countries")
        resp.raise_for_status()
        return [CountryInfo(**c) for c in resp.json()]

    def get_country_map(self) -> dict[str, CountryInfo]:
        """국가 코드 → CountryInfo 매핑 (캐시)"""
        if self._country_cache is None:
            countries = self.get_countries()
            self._country_cache = {c.code: c for c in countries}
        return self._country_cache

    def create_category(self, name: str, description: str | None = None) -> CategoryInfo:
        """POST /api/categories — 태그 생성"""
        payload = {"name": name}
        if description:
            payload["description"] = description
        resp = self.client.post("/api/categories", json=payload)
        resp.raise_for_status()
        data = resp.json()
        cat = CategoryInfo(id=data["id"], name=data["name"], description=data.get("description"))
        # 캐시 갱신
        if self._category_cache is not None:
            self._category_cache[cat.name] = cat
        logger.info(f"Created new tag: '{name}' (id={cat.id})")
        return cat

    def ensure_category(self, name: str, description: str | None = None) -> CategoryInfo:
        """태그가 없으면 자동 생성, 있으면 반환"""
        cat_map = self.get_category_map()
        if name in cat_map:
            return cat_map[name]
        return self.create_category(name, description)

    def create_timeline(self, request: TimelineRequest) -> dict:
        """POST /api/timelines — 타임라인 이벤트 생성"""
        data = request.model_dump(by_alias=True, exclude_none=True)
        resp = self.client.post("/api/timelines", json=data)
        resp.raise_for_status()
        return resp.json()

    def search_by_source(self, source: str) -> list[dict]:
        """source 필드로 기존 이벤트 검색 (중복 방지)

        TODO: 현재 backend /api/timelines/search에 source 파라미터가 없음.
              backend에 source 검색 지원이 추가되면 구현 필요.
        """
        # TODO: backend에 source 검색 파라미터 추가 후 아래 구현으로 교체
        # resp = self.client.get("/api/timelines/search", params={"source": source})
        # if resp.status_code == 200:
        #     return resp.json()
        return []

    def close(self):
        self.client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
