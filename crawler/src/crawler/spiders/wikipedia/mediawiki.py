import logging
import time

from crawler.core.http_client import create_http_client
from crawler.core.models import WikidataEvent

logger = logging.getLogger(__name__)

MEDIAWIKI_API = "https://ko.wikipedia.org/w/api.php"
MEDIAWIKI_API_EN = "https://en.wikipedia.org/w/api.php"
REQUEST_DELAY = 0.5  # 초


class MediaWikiClient:
    def __init__(self):
        self.client = create_http_client()

    def get_extract(self, title: str, lang: str = "ko") -> str | None:
        """위키백과 문서의 첫 단락(extract) 가져오기"""
        api_url = MEDIAWIKI_API if lang == "ko" else MEDIAWIKI_API_EN

        params = {
            "action": "query",
            "titles": title,
            "prop": "extracts",
            "exintro": True,
            "explaintext": True,
            "format": "json",
            "redirects": 1,
        }

        try:
            resp = self.client.get(api_url, params=params)
            resp.raise_for_status()
            data = resp.json()

            pages = data.get("query", {}).get("pages", {})
            for page_id, page in pages.items():
                if page_id == "-1":
                    return None
                extract = page.get("extract", "")
                # 첫 2문장만 (너무 길면)
                sentences = extract.split(". ")
                if len(sentences) > 3:
                    return ". ".join(sentences[:3]) + "."
                return extract
        except Exception as e:
            logger.debug(f"MediaWiki extract failed for '{title}': {e}")

        return None

    def enrich_events(self, events: list[WikidataEvent]) -> list[WikidataEvent]:
        """이벤트 목록의 description을 MediaWiki에서 보강"""
        enriched_count = 0

        for event in events:
            # 이미 설명이 충분히 긴 경우 스킵
            if event.description_ko and len(event.description_ko) > 50:
                continue

            # 한국어 위키백과에서 시도
            title = event.title_ko or event.title_en
            if title:
                extract = self.get_extract(title, "ko")
                if extract and len(extract) > 10:
                    event.description_ko = extract
                    enriched_count += 1
                    time.sleep(REQUEST_DELAY)
                    continue

                # 영어 fallback
                if event.title_en:
                    extract = self.get_extract(event.title_en, "en")
                    if extract and len(extract) > 10:
                        event.description_en = extract
                        enriched_count += 1
                        time.sleep(REQUEST_DELAY)

        logger.info(f"Enriched {enriched_count}/{len(events)} events with MediaWiki extracts")
        return events

    def close(self):
        self.client.close()
