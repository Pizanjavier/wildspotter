"""Generic BOP (Boletín Oficial Provincial) scraper framework.

Handles 4 BOP groups:
  B: Web search / HTML (33 provinces) — delegates to html_scraper
  C: Daily PDF (10 provinces) — finds PDF link then runs pdf_pipeline
  D: JS-heavy / access issues (7 provinces) — Playwright fallback

Usage:
    from watchers.bop_scraper import BopScraper
    scraper = BopScraper()
    scraper.check_province("cadiz")
"""

import hashlib
import logging
import re
import time

import requests
import urllib3

from legal.source_monitor import store_legal_document
from utils import get_db_connection, setup_logging
from watchers.html_scraper import LegacyCipherAdapter

logger = setup_logging("bop-scraper")

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
USER_AGENT = "WildSpotter-LegalMonitor/1.0 (+https://wildspotter.app)"


class BopScraper:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self.session.mount("https://", LegacyCipherAdapter())

    def check_province(self, config: dict) -> int:
        group = config.get("group", "B")
        source_id = config["source_id"]

        logger.info("Checking BOP: %s (group %s)", source_id, group)

        if group == "B":
            return self._check_html(config)
        elif group == "C":
            return self._check_pdf(config)
        elif group == "D":
            return self._check_playwright(config)
        else:
            logger.warning("Unknown BOP group %s for %s", group, source_id)
            return 0

    def check_all(self, configs: list[dict], delay: float = 5.0) -> dict[str, int]:
        results = {}
        for config in configs:
            try:
                count = self.check_province(config)
                results[config["source_id"]] = count
            except Exception:
                logger.exception("Failed BOP %s", config["source_id"])
                results[config["source_id"]] = -1
            time.sleep(delay)
        return results

    def _check_html(self, config: dict) -> int:
        from watchers.html_scraper import HtmlScraper
        scraper = HtmlScraper()
        return scraper.check_and_store(config)

    def _check_pdf(self, config: dict) -> int:
        pdf_url = config.get("pdf_url")
        if not pdf_url:
            pdf_url = self._find_pdf_link(config)
        if not pdf_url:
            return 0

        from legal.pdf_pipeline import process_pdf_url
        sections = process_pdf_url(pdf_url, self.session)

        if not sections:
            return 0

        conn = get_db_connection()
        stored = 0
        try:
            for section in sections:
                doc_id = store_legal_document(
                    conn,
                    source_id=config["source_id"],
                    title=section["title"][:300],
                    restriction_type="other",
                    content_hash=section["content_hash"],
                    raw_text=section["text"],
                    confidence_tier="unverified",
                    affected_province=config.get("province"),
                    affected_ccaa=config.get("ccaa"),
                    source_url=pdf_url,
                )
                if doc_id:
                    stored += 1
            conn.commit()
        finally:
            conn.close()

        return stored

    def _find_pdf_link(self, config: dict) -> str | None:
        url = config.get("url")
        if not url:
            return None

        try:
            try:
                resp = self.session.get(url, timeout=30)
            except requests.exceptions.SSLError:
                resp = self.session.get(url, timeout=30, verify=False)
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.error("Failed to fetch BOP page %s: %s", config["source_id"], e)
            return None

        base_url = config.get("base_url", "")
        if not base_url:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"

        pdf_links = re.findall(r'href=["\']([^"\']*\.pdf[^"\']*)["\']', resp.text, re.IGNORECASE)
        if not pdf_links:
            logger.info("No PDF links found on %s", config["source_id"])
            return None

        skip_patterns = re.compile(
            r"(formulario|solicitud|instrucciones|plantilla|modelo|manual|ayuda|normativa_general|tasa)",
            re.IGNORECASE,
        )
        date_pattern = re.compile(r"\d{4}[-_/]\d{2}[-_/]\d{2}|\d{2}[-_/]\d{2}[-_/]\d{4}|\d{8}")
        bop_pattern = re.compile(r"(boletin|bop|sumario|diario|oficial)", re.IGNORECASE)

        scored: list[tuple[int, str]] = []
        for link in pdf_links:
            if skip_patterns.search(link):
                continue
            score = 0
            if date_pattern.search(link):
                score += 2
            if bop_pattern.search(link):
                score += 1
            scored.append((score, link))

        if not scored:
            scored = [(0, pdf_links[0])]

        scored.sort(key=lambda x: x[0], reverse=True)
        best = scored[0][1]
        if not best.startswith("http"):
            best = base_url.rstrip("/") + "/" + best.lstrip("/")

        logger.info("Found PDF link for %s: %s", config["source_id"], best[:120])
        return best

    def _check_playwright(self, config: dict) -> int:
        try:
            from watchers.bop_playwright import check_with_playwright
            return check_with_playwright(config, self.session)
        except ImportError:
            logger.warning("Playwright not available for %s", config["source_id"])
            return 0


def ensure_sources_registered(configs: list[dict]) -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for config in configs:
                source_type = {"A": "rss", "B": "html", "C": "pdf", "D": "html"}.get(
                    config.get("group", "B"), "html"
                )
                cur.execute(
                    """
                    INSERT INTO legal_source_state (id, name, source_type, region, url, poll_interval_hours)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET source_type = EXCLUDED.source_type
                    """,
                    (
                        config["source_id"],
                        config["name"],
                        source_type,
                        config.get("province", config.get("ccaa", "")),
                        config.get("url", ""),
                        config.get("poll_interval_hours", 24),
                    ),
                )
        conn.commit()
    finally:
        conn.close()
