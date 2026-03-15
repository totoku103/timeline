import httpx

USER_AGENT = "TimelineCrawlerBot/0.1 (https://github.com/timeline-project; timeline-crawler@example.com)"


def create_http_client(timeout: float = 30.0) -> httpx.Client:
    """Wikipedia/Wikidata API용 HTTP 클라이언트 생성"""
    return httpx.Client(
        timeout=timeout,
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
    )
