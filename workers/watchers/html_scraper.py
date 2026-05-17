"""Generic HTML scraper for CCAA official gazettes.

Fetches gazette web pages, extracts entries via CSS selectors,
applies keyword gate, stores matches.

Usage:
    from watchers.html_scraper import HtmlScraper
    from watchers.html_configs import HTML_SOURCES
    scraper = HtmlScraper()
    scraper.check_and_store(HTML_SOURCES['boja_andalucia'])
"""

import hashlib
import logging
import re
import ssl
import time
from html.parser import HTMLParser

import requests
import urllib3
from requests.adapters import HTTPAdapter

from legal.source_monitor import store_legal_document
from utils import get_db_connection, setup_logging

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = setup_logging("html-scraper")

_BLOCK_TAGS = frozenset({
    "div", "p", "br", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "section", "article", "header", "footer", "dt", "dd",
    "figcaption", "details", "summary", "option",
})


class LegacyCipherAdapter(HTTPAdapter):
    """Requests adapter that enables legacy TLS ciphers for older gov servers."""

    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.set_ciphers("DEFAULT:@SECLEVEL=0")
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.minimum_version = ssl.TLSVersion.TLSv1
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)

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


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[str] = []
        self._skip = False

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag in ("script", "style"):
            self._skip = True
        elif tag in _BLOCK_TAGS:
            self._texts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style"):
            self._skip = False
        elif tag in _BLOCK_TAGS:
            self._texts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self._skip:
            text = data.strip()
            if text:
                self._texts.append(text)

    def get_text(self) -> str:
        raw = " ".join(self._texts)
        lines = [l.strip() for l in raw.split("\n")]
        return "\n".join(l for l in lines if l)


def _html_to_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    return parser.get_text()


def _clean_title(title: str) -> str:
    t = title
    # Remove leading UI components or class names that leaked
    t = re.sub(r'^(ui-button|button|span|div|a|href)\s+', '', t, flags=re.IGNORECASE)
    # Remove trailing UI links and menus
    t = re.sub(r'\s+(Ver edicto|Descargar PDF|Mapa Web|Buzón|Accesibilidad).*$', '', t, flags=re.IGNORECASE)
    # Strip excess whitespace
    t = re.sub(r'\s+', ' ', t)
    return t.strip()


_JUNK_PATTERN = re.compile(
    r"^(Turismo|Sostenibilidad|Área de|Normativa e|Urbanisme|Urbanismo|"
    r"CARRETERAS|Portal web|Economía|Medio Ambiente|Garraioak|Foru aginduak|"
    r"Registro de Turismo|MINISTERIO DE|CONSORCIO PROVINCIAL|SOCIEDAD PÚBLICA|"
    r"CONSELLERÍA DE MEDIO)",
    re.IGNORECASE,
)

_JUNK_CONTENT = re.compile(
    r"(cookies|Descubre los servicios|Patronat de Turisme|Pla estratègic|"
    r"Sede Electrónica|Transparencia|¿Que deseas|Treball i Labora)",
    re.IGNORECASE,
)

MIN_TITLE_LENGTH = 30


def _is_junk_entry(title: str) -> bool:
    """Return True if the title looks like web chrome rather than a real document."""
    if len(title) < MIN_TITLE_LENGTH:
        return True
    if _JUNK_PATTERN.search(title):
        return True
    if _JUNK_CONTENT.search(title):
        return True
    return False

def _extract_entries_by_selector(html: str, config: dict) -> list[dict]:
    entry_pattern = config.get("entry_pattern")
    title_pattern = config.get("title_pattern")
    link_pattern = config.get("link_pattern")
    base_url = config.get("base_url", "")

    entries = []

    if entry_pattern:
        blocks = re.findall(entry_pattern, html, re.DOTALL | re.IGNORECASE)
        for block in blocks:
            title_match = re.search(title_pattern, block) if title_pattern else None
            link_match = re.search(link_pattern, block) if link_pattern else None

            raw_title = _html_to_text(title_match.group(1)) if title_match else _html_to_text(block)[:200]
            title = _clean_title(raw_title)
            
            link = link_match.group(1) if link_match else ""
            if link and not link.startswith("http"):
                link = base_url + link

            entries.append({"title": title, "url": link.strip()})
    else:
        text = _html_to_text(html)
        lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 20]
        for line in lines:
            entries.append({"title": _clean_title(line[:300]), "url": config.get("url", "")})

    return entries


def _classify_restriction(title: str) -> str:
    lower = title.lower()
    if re.search(r"incendio|fuego", lower):
        return "fire_ban"
    if re.search(r"acampada|camping", lower):
        return "camping_ban"
    if re.search(r"pernocta|nocturno", lower):
        return "overnight_ban"
    if re.search(r"aparcar|estacionamiento", lower):
        return "parking_ban"
    if re.search(r"acceso|circulaci[oó]n", lower):
        return "access_restriction"
    return "other"


class HtmlScraper:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self.session.mount("https://", LegacyCipherAdapter())

    def fetch_page(self, config: dict) -> str | None:
        url = config["url"]
        logger.info("Fetching HTML: %s (%s)", config["name"], url)

        try:
            resp = self.session.get(url, timeout=30, verify=config.get("ssl_verify", True))
            resp.raise_for_status()
            resp.encoding = resp.apparent_encoding or "utf-8"
            return resp.text
        except requests.exceptions.SSLError:
            logger.info("SSL error for %s, retrying without verification", config["source_id"])
            try:
                resp = self.session.get(url, timeout=30, verify=False)
                resp.raise_for_status()
                resp.encoding = resp.apparent_encoding or "utf-8"
                return resp.text
            except requests.RequestException as e:
                logger.error("Failed to fetch %s (no-verify): %s", config["source_id"], e)
                return None
        except requests.RequestException as e:
            logger.error("Failed to fetch %s: %s", config["source_id"], e)
            return None

    def check_and_store(self, config: dict) -> int:
        html = self.fetch_page(config)
        if not html:
            return 0

        entries = _extract_entries_by_selector(html, config)
        logger.info("Found %d entries for %s", len(entries), config["source_id"])

        matched = [e for e in entries if KEYWORD_PATTERN.search(e["title"])]
        matched = [e for e in matched if not _is_junk_entry(e["title"])]
        logger.info("Keyword matched (post-filter): %d entries for %s", len(matched), config["source_id"])

        if not matched:
            return 0

        conn = get_db_connection()
        stored = 0
        try:
            for entry in matched:
                content_hash = hashlib.sha256(
                    f"{config['source_id']}:{entry['title']}".encode()
                ).hexdigest()

                doc_id = store_legal_document(
                    conn,
                    source_id=config["source_id"],
                    title=entry["title"],
                    restriction_type=_classify_restriction(entry["title"]),
                    content_hash=content_hash,
                    confidence_tier="automated",
                    affected_ccaa=config.get("ccaa"),
                    source_url=entry.get("url"),
                )
                if doc_id:
                    stored += 1

            conn.commit()
        finally:
            conn.close()

        logger.info("HTML %s: %d matched, %d new", config["source_id"], len(matched), stored)
        return stored

    def check_all(self, configs: list[dict], delay: float = 5.0) -> dict[str, int]:
        results = {}
        for config in configs:
            try:
                count = self.check_and_store(config)
                results[config["source_id"]] = count
            except Exception:
                logger.exception("Failed to scrape %s", config["source_id"])
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
                    VALUES (%s, %s, 'html', %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET source_type = EXCLUDED.source_type
                    """,
                    (
                        config["source_id"],
                        config["name"],
                        config.get("ccaa", "national"),
                        config["url"],
                        config.get("poll_interval_hours", 24),
                    ),
                )
        conn.commit()
    finally:
        conn.close()
