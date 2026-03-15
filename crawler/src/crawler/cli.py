import click
import logging


@click.group()
@click.option("--debug", is_flag=True, help="Enable debug logging")
def main(debug: bool):
    """Timeline Crawler - 역사 이벤트 수집기"""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


@main.command()
@click.option("--output", "-o", default="data/wikipedia_events.json", help="Output JSON file path")
@click.option("--min-sitelinks", default=5, help="Minimum sitelinks count for filtering")
def extract(output: str, min_sitelinks: int):
    """Wikidata에서 역사 이벤트를 추출하여 JSON으로 저장"""
    from crawler.spiders.wikipedia.spider import WikipediaSpider
    spider = WikipediaSpider(min_sitelinks=min_sitelinks)
    spider.extract(output_path=output)


@main.command("extract-joseon")
@click.option("--output", "-o", default="data/joseon_events.json", help="Output JSON file path")
@click.option("--min-sitelinks", default=3, help="Minimum sitelinks count")
@click.option("--tags", "-t", default="조선", help="추가 태그 (쉼표 구분, 예: 조선,임진왜란)")
def extract_joseon(output: str, min_sitelinks: int, tags: str):
    """조선 시대(1392~1897) 역사 이벤트를 Wikidata에서 추출"""
    from crawler.spiders.wikipedia.spider import WikipediaSpider
    extra_tags = [t.strip() for t in tags.split(",") if t.strip()]
    spider = WikipediaSpider(min_sitelinks=min_sitelinks)
    spider.extract_joseon(output_path=output, extra_tags=extra_tags)


@main.command("extract-korea")
@click.option("--output", "-o", default="data/korea_events.json", help="Output JSON file path")
@click.option("--min-sitelinks", default=3, help="Minimum sitelinks count")
@click.option("--tags", "-t", default=None, help="추가 태그 (쉼표 구분)")
def extract_korea(output: str, min_sitelinks: int, tags: str | None):
    """한국 전체 역사(고대~현재) 이벤트를 Wikidata에서 추출"""
    from crawler.spiders.wikipedia.spider import WikipediaSpider
    extra_tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    spider = WikipediaSpider(min_sitelinks=min_sitelinks)
    spider.extract_korea(output_path=output, extra_tags=extra_tags)


@main.command("extract-country")
@click.argument("country_code", type=click.Choice(
    ["US", "CN", "JP", "GB", "FR", "DE", "RU", "IT", "IN", "EG", "GR", "TR", "ES"],
    case_sensitive=True,
))
@click.option("--output", "-o", default=None, help="Output JSON file path (default: data/{code}_events.json)")
@click.option("--min-sitelinks", default=3, help="Minimum sitelinks count")
@click.option("--tags", "-t", default=None, help="추가 태그 (쉼표 구분)")
def extract_country(country_code: str, output: str | None, min_sitelinks: int, tags: str | None):
    """국가별 역사 이벤트를 Wikidata에서 추출 (US, CN, JP, GB, FR, DE, RU, IT, IN, EG, GR, TR, ES)"""
    from crawler.spiders.wikipedia.spider import WikipediaSpider
    if output is None:
        output = f"data/{country_code.lower()}_events.json"
    extra_tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    spider = WikipediaSpider(min_sitelinks=min_sitelinks)
    spider.extract_country(country_code=country_code, output_path=output, extra_tags=extra_tags)


@main.command()
@click.option("--input", "-i", "input_file", default="data/wikipedia_events.json", help="Input JSON file path")
@click.option("--api-url", default="http://localhost:8080", help="Backend API base URL")
@click.option("--dry-run", is_flag=True, help="Print without sending to API")
@click.option("--tags", "-t", default=None, help="추가 태그 (쉼표 구분, load 시 모든 이벤트에 적용)")
def load(input_file: str, api_url: str, dry_run: bool, tags: str | None):
    """추출된 JSON 데이터를 Backend API로 적재"""
    from crawler.spiders.wikipedia.spider import WikipediaSpider
    extra_tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    spider = WikipediaSpider()
    spider.load(input_path=input_file, api_url=api_url, dry_run=dry_run, extra_tags=extra_tags)


if __name__ == "__main__":
    main()
