"""Playwright fallback for JS-heavy BOP sites.

Uses headless browser to render pages that require JavaScript.
Only used for Group D provinces (~12 sites).

Usage:
    from watchers.bop_playwright import check_with_playwright
    count = check_with_playwright(config, session)
"""

import hashlib
import logging
import re

from legal.source_monitor import store_legal_document
from utils import get_db_connection, setup_logging

logger = setup_logging("bop-playwright")

KEYWORD_PATTERN = re.compile(
    r"autocaravana|pernocta|acampada|estacionamiento|camping|caravana|"
    r"aparcamiento\s*nocturno|veh[ií]culo\s*vivienda|prohibi.*aparcar|"
    r"incendios?\s*forestales|medio\s*ambient[e]?|turismo|turisme|"
    r"parque\s*natural|parc\s*natural|espacio\s*natural|espai\s*natural|"
    r"ordenanza|ordenança|urbanismo|urbanisme|"
    r"circulaci[oó]n|tr[aá]fico|tr[àa]nsit",
    re.IGNORECASE,
)


def check_with_playwright(config: dict, session=None) -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.warning(
            "Playwright not installed. Install with: pip install playwright && playwright install chromium"
        )
        return 0

    url = config.get("url", "")
    source_id = config["source_id"]

    logger.info("Playwright scraping: %s", url)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_extra_http_headers({
                "User-Agent": "WildSpotter-LegalMonitor/1.0 (+https://wildspotter.app)"
            })

            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(3000)
            content = page.content()
            browser.close()

        from watchers.html_scraper import _html_to_text
        text = _html_to_text(content)

        lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 20]
        matched = [l for l in lines if KEYWORD_PATTERN.search(l)]

        if not matched:
            return 0

        conn = get_db_connection()
        stored = 0
        try:
            for line in matched[:20]:
                content_hash = hashlib.sha256(
                    f"{source_id}:{line}".encode()
                ).hexdigest()

                doc_id = store_legal_document(
                    conn,
                    source_id=source_id,
                    title=line[:300],
                    restriction_type="other",
                    content_hash=content_hash,
                    confidence_tier="unverified",
                    affected_province=config.get("province"),
                    affected_ccaa=config.get("ccaa"),
                    source_url=url,
                )
                if doc_id:
                    stored += 1
            conn.commit()
        finally:
            conn.close()

        logger.info("Playwright %s: %d matched, %d new", source_id, len(matched), stored)
        return stored

    except Exception as e:
        logger.error("Playwright failed for %s: %s", source_id, e)
        return 0
