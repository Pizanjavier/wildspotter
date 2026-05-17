"""Generic RSS watcher for CCAA official gazettes.

Fetches RSS feeds, applies keyword gate, stores matching entries
as legal_documents.

Usage:
    from watchers.rss_watcher import RssWatcher
    from watchers.rss_configs import RSS_SOURCES
    watcher = RssWatcher()
    watcher.check_and_store(RSS_SOURCES['boa_aragon'])
"""

import hashlib
import logging
import re
import time
from datetime import datetime, timezone
from typing import Any

import feedparser
import requests
import urllib3

from legal.source_monitor import store_legal_document
from utils import get_db_connection, setup_logging

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = setup_logging("rss-watcher")

USER_AGENT = "WildSpotter-LegalMonitor/1.0 (+https://wildspotter.app)"

KEYWORD_PATTERN = re.compile(
    r"autocaravana|pernocta|acampada|estacionamiento|camping|caravana|"
    r"aparcamiento\s*nocturno|veh[ií]culo\s*vivienda|prohibi.*aparcar|"
    r"veh[ií]culos?\s*de\s*uso\s*habitacional|acampada\s*libre|"
    r"incendios?\s*forestales|medio\s*ambient[e]?|turismo|turisme|"
    r"parque\s*natural|parc\s*natural|espacio\s*natural|espai\s*natural|"
    r"ordenanza|ordenança|urbanismo|urbanisme|"
    r"circulaci[oó]n|tr[aá]fico|tr[àa]nsit",
    re.IGNORECASE,
)


def _classify_restriction(title: str, summary: str) -> str:
    combined = f"{title} {summary}".lower()
    if re.search(r"incendio|fuego|quema", combined):
        return "fire_ban"
    if re.search(r"acampada|camping|campamento", combined):
        return "camping_ban"
    if re.search(r"pernocta|nocturno", combined):
        return "overnight_ban"
    if re.search(r"aparcar|estacionamiento|aparcamiento", combined):
        return "parking_ban"
    if re.search(r"acceso|circulaci[oó]n|restricci[oó]n.*paso", combined):
        return "access_restriction"
    if re.search(r"temporada|estacional|verano|periodo", combined):
        return "seasonal_closure"
    return "other"


class RssWatcher:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT

    def fetch_feed(self, config: dict) -> list[dict]:
        url = config["url"]
        logger.info("Fetching RSS: %s (%s)", config["name"], url)

        try:
            try:
                resp = self.session.get(url, timeout=30)
            except requests.exceptions.SSLError:
                logger.info("SSL error for %s, retrying without verification", config["source_id"])
                resp = self.session.get(url, timeout=30, verify=False)
            resp.raise_for_status()
            if config.get("fetch_as_bytes"):
                feed = feedparser.parse(resp.content)
            else:
                feed = feedparser.parse(resp.text)
        except requests.RequestException as e:
            logger.error("Failed to fetch RSS %s: %s", config["source_id"], e)
            return []

        if feed.bozo and not feed.entries:
            logger.warning("RSS parse error for %s: %s", config["source_id"], feed.bozo_exception)
            return []

        matched = []
        for entry in feed.entries:
            title = entry.get("title", "")
            summary = entry.get("summary", entry.get("description", ""))
            link = entry.get("link", "")
            entry_id = entry.get("id", link)
            published = entry.get("published", "")

            searchable = f"{title} {summary}"
            if not KEYWORD_PATTERN.search(searchable):
                continue

            logger.info("RSS match [%s]: %s", config["source_id"], title[:100])
            matched.append({
                "title": title,
                "summary": summary,
                "url": link,
                "external_id": entry_id,
                "published": published,
            })

        return matched

    def check_and_store(self, config: dict) -> int:
        entries = self.fetch_feed(config)
        if not entries:
            return 0

        conn = get_db_connection()
        stored = 0
        try:
            for entry in entries:
                content_hash = hashlib.sha256(
                    f"{entry['external_id']}:{entry['title']}".encode()
                ).hexdigest()

                restriction_type = _classify_restriction(
                    entry["title"], entry["summary"]
                )

                doc_id = store_legal_document(
                    conn,
                    source_id=config["source_id"],
                    title=entry["title"],
                    restriction_type=restriction_type,
                    content_hash=content_hash,
                    body=entry["summary"],
                    confidence_tier="automated",
                    affected_ccaa=config.get("ccaa"),
                    source_url=entry["url"],
                    external_id=entry["external_id"],
                )
                if doc_id:
                    stored += 1

            conn.commit()
        finally:
            conn.close()

        logger.info(
            "RSS %s: %d matched, %d new", config["source_id"], len(entries), stored
        )
        return stored

    def check_all(self, configs: list[dict], delay: float = 3.0) -> dict[str, int]:
        results = {}
        for config in configs:
            try:
                count = self.check_and_store(config)
                results[config["source_id"]] = count
            except Exception:
                logger.exception("Failed to process RSS source %s", config["source_id"])
                results[config["source_id"]] = -1
            time.sleep(delay)
        return results


def ensure_sources_registered(configs: list[dict]) -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for config in configs:
                cur.execute(
                    """
                    INSERT INTO legal_source_state (id, name, source_type, region, url, poll_interval_hours)
                    VALUES (%s, %s, 'rss', %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET source_type = EXCLUDED.source_type
                    """,
                    (
                        config["source_id"],
                        config["name"],
                        config.get("ccaa", "national"),
                        config["url"],
                        config.get("poll_interval_hours", 12),
                    ),
                )
        conn.commit()
    finally:
        conn.close()
