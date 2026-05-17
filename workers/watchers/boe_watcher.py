"""BOE (Boletín Oficial del Estado) API watcher.

Polls the BOE open data API for daily summaries and filters for
vanlife/camping-relevant entries using a keyword gate.

API docs: https://www.boe.es/datosabiertos/
Endpoint: https://www.boe.es/datosabiertos/api/boe/sumario/{fecha}
Format: XML

Usage:
    from watchers.boe_watcher import BoeWatcher
    watcher = BoeWatcher()
    documents = watcher.check()
"""

import hashlib
import logging
import re
import xml.etree.ElementTree as ET
from datetime import date, datetime, timezone

import requests

from legal.source_monitor import store_legal_document
from utils import get_db_connection, setup_logging

logger = setup_logging("boe-watcher")

SOURCE_ID = "boe_national"
BOE_API_URL = "https://www.boe.es/datosabiertos/api/boe/sumario"
BOE_BASE_URL = "https://www.boe.es"

KEYWORD_PATTERN = re.compile(
    r"autocaravana|pernocta|acampada|estacionamiento|camping|caravana|"
    r"aparcamiento\s*nocturno|veh[ií]culo\s*vivienda|prohibi.*aparcar|"
    r"veh[ií]culos?\s*de\s*uso\s*habitacional|acampada\s*libre|"
    r"acampada\s*difusa|estacionamiento\s*prolongado|incendios?\s*forestales|"
    r"turismo\s*rural|campamento|zona\s*de\s*acampada|"
    r"medio\s*ambiente.*protecci[oó]n|parque\s*natural|espacio\s*natural",
    re.IGNORECASE,
)


def _classify_restriction(title: str, text: str) -> str:
    combined = f"{title} {text}".lower()
    if re.search(r"incendio|fuego", combined):
        return "fire_ban"
    if re.search(r"acampada|camping|campamento", combined):
        return "camping_ban"
    if re.search(r"pernocta|nocturno", combined):
        return "overnight_ban"
    if re.search(r"aparcar|estacionamiento|aparcamiento", combined):
        return "parking_ban"
    if re.search(r"acceso|circulaci[oó]n", combined):
        return "access_restriction"
    return "other"


class BoeWatcher:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers["User-Agent"] = (
            "WildSpotter-LegalMonitor/1.0 (+https://wildspotter.app)"
        )
        self.session.headers["Accept"] = "application/xml"

    def check(self, target_date: date | None = None) -> list[dict]:
        if target_date is None:
            target_date = date.today()

        fecha = target_date.strftime("%Y%m%d")
        url = f"{BOE_API_URL}/{fecha}"

        logger.info("Fetching BOE summary for %s", fecha)

        try:
            resp = self.session.get(url, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.error("Failed to fetch BOE: %s", e)
            return []

        return self._parse_and_filter(resp.text, target_date)

    def _parse_and_filter(self, xml_text: str, target_date: date) -> list[dict]:
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as e:
            logger.error("Failed to parse BOE XML: %s", e)
            return []

        items = root.findall(".//item") or root.findall(".//{*}item")
        if not items:
            items = root.findall(".//entrada") or root.findall(".//{*}entrada")

        logger.info("Found %d items in BOE summary", len(items))
        matched = []

        for item in items:
            title_el = item.find("titulo") or item.find("{*}titulo")
            if title_el is None:
                title_el = item.find("title") or item.find("{*}title")
            title = title_el.text if title_el is not None and title_el.text else ""

            url_pdf_el = item.find("urlPdf") or item.find("{*}urlPdf")
            url_htm_el = item.find("urlHtm") or item.find("{*}urlHtm")
            id_el = item.find("identificador") or item.find("{*}identificador")

            entry_url = ""
            if url_htm_el is not None and url_htm_el.text:
                entry_url = url_htm_el.text
                if not entry_url.startswith("http"):
                    entry_url = BOE_BASE_URL + entry_url
            elif url_pdf_el is not None and url_pdf_el.text:
                entry_url = url_pdf_el.text
                if not entry_url.startswith("http"):
                    entry_url = BOE_BASE_URL + entry_url

            entry_id = ""
            if id_el is not None and id_el.text:
                entry_id = id_el.text

            if not KEYWORD_PATTERN.search(title):
                continue

            logger.info("BOE match: %s", title[:100])
            matched.append(
                {
                    "title": title,
                    "url": entry_url,
                    "external_id": entry_id,
                    "date": target_date.isoformat(),
                }
            )

        return matched

    def check_and_store(self, target_date: date | None = None) -> int:
        documents = self.check(target_date)
        if not documents:
            return 0

        conn = get_db_connection()
        stored = 0
        try:
            for doc in documents:
                content_hash = hashlib.sha256(
                    f"{doc['external_id']}:{doc['title']}".encode()
                ).hexdigest()

                restriction_type = _classify_restriction(doc["title"], "")

                doc_id = store_legal_document(
                    conn,
                    source_id=SOURCE_ID,
                    title=doc["title"],
                    restriction_type=restriction_type,
                    content_hash=content_hash,
                    confidence_tier="automated",
                    effective_from=doc["date"],
                    source_url=doc["url"],
                    external_id=doc["external_id"],
                )
                if doc_id:
                    stored += 1
                    logger.info("Stored BOE document: %s", doc["title"][:80])

            conn.commit()
        finally:
            conn.close()

        logger.info("BOE check complete: %d matched, %d new", len(documents), stored)
        return stored


def ensure_source_registered() -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO legal_source_state (id, name, source_type, region, url, poll_interval_hours)
                VALUES (%s, %s, 'api', 'national', %s, 6)
                ON CONFLICT (id) DO NOTHING
                """,
                (SOURCE_ID, "BOE - Boletín Oficial del Estado", f"{BOE_API_URL}/{{fecha}}"),
            )
        conn.commit()
    finally:
        conn.close()
