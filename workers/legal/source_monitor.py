"""Hash-based change detection engine for legal bulletin sources.

Core logic used by ALL watchers:
1. Fetch URL from legal_source_state
2. SHA-256 response body -> compare with content_hash
3. If match: update last_checked_at, done
4. If different: dispatch to appropriate parser, update hash + last_changed_at
5. Track failures: increment consecutive_failures, degrade health after 3/7

Usage:
    from legal.source_monitor import SourceMonitor
    monitor = SourceMonitor()
    changed_sources = monitor.check_sources(source_ids=['boe_national'])
"""

import hashlib
import logging
import time
from datetime import datetime, timezone
from typing import Any, Callable

import requests
import urllib3

from utils import get_db_connection, setup_logging

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = setup_logging("legal-source-monitor")

USER_AGENT = "WildSpotter-LegalMonitor/1.0 (+https://wildspotter.app)"
DEFAULT_TIMEOUT = 30
MIN_DELAY_SECONDS = 2
MAX_DELAY_SECONDS = 5


class SourceMonitor:
    def __init__(self) -> None:
        self._parsers: dict[str, Callable] = {}

    def register_parser(self, source_type: str, parser: Callable) -> None:
        self._parsers[source_type] = parser

    def check_source(self, source_id: str) -> dict[str, Any]:
        conn = get_db_connection()
        try:
            source = self._get_source(conn, source_id)
            if not source:
                return {"source_id": source_id, "error": "not_found"}

            if not source["url"]:
                return {"source_id": source_id, "error": "no_url"}

            try:
                response = self._fetch(source)
                content_hash = hashlib.sha256(response.content).hexdigest()
                changed = content_hash != source["content_hash"]

                self._update_success(conn, source_id, content_hash, changed)

                result: dict[str, Any] = {
                    "source_id": source_id,
                    "changed": changed,
                    "hash": content_hash,
                }

                if changed and source["source_type"] in self._parsers:
                    parser = self._parsers[source["source_type"]]
                    try:
                        documents = parser(source, response)
                        result["documents_found"] = len(documents) if documents else 0
                        result["documents"] = documents
                    except Exception as e:
                        logger.error(
                            "Parser failed for %s: %s", source_id, e, exc_info=True
                        )
                        result["parser_error"] = str(e)

                conn.commit()
                return result

            except requests.RequestException as e:
                self._update_failure(conn, source_id, str(e))
                conn.commit()
                return {"source_id": source_id, "error": str(e)}

        finally:
            conn.close()

    def check_sources(
        self, source_ids: list[str] | None = None
    ) -> list[dict[str, Any]]:
        conn = get_db_connection()
        try:
            if source_ids:
                sources = self._get_sources_by_ids(conn, source_ids)
            else:
                sources = self._get_due_sources(conn)
        finally:
            conn.close()

        results = []
        for source in sources:
            result = self.check_source(source["id"])
            results.append(result)
            delay = MIN_DELAY_SECONDS + (
                MAX_DELAY_SECONDS - MIN_DELAY_SECONDS
            ) * (hash(source["id"]) % 100 / 100)
            time.sleep(delay)

        return results

    def _fetch(self, source: dict) -> requests.Response:
        headers: dict[str, str] = {"User-Agent": USER_AGENT}

        if source.get("metadata", {}).get("etag"):
            headers["If-None-Match"] = source["metadata"]["etag"]
        if source.get("metadata", {}).get("last_modified"):
            headers["If-Modified-Since"] = source["metadata"]["last_modified"]

        backoff = min(2 ** source["consecutive_failures"], 300)
        if source["consecutive_failures"] > 0:
            logger.info(
                "Backoff %ds for %s (failures: %d)",
                backoff,
                source["id"],
                source["consecutive_failures"],
            )
            time.sleep(backoff)

        try:
            response = requests.get(
                source["url"],
                headers=headers,
                timeout=DEFAULT_TIMEOUT,
                allow_redirects=True,
            )
        except requests.exceptions.SSLError:
            logger.info("SSL error for %s, retrying without verification", source["id"])
            response = requests.get(
                source["url"],
                headers=headers,
                timeout=DEFAULT_TIMEOUT,
                allow_redirects=True,
                verify=False,
            )

        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", "60"))
            raise requests.RequestException(
                f"Rate limited (429), retry after {retry_after}s"
            )

        response.raise_for_status()
        return response

    def _get_source(self, conn, source_id: str) -> dict | None:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, source_type, region, url, poll_interval_hours,
                       content_hash, last_checked_at, consecutive_failures,
                       health, metadata
                FROM legal_source_state WHERE id = %s
                """,
                (source_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "name": row[1],
                "source_type": row[2],
                "region": row[3],
                "url": row[4],
                "poll_interval_hours": row[5],
                "content_hash": row[6],
                "last_checked_at": row[7],
                "consecutive_failures": row[8],
                "health": row[9],
                "metadata": row[10] or {},
            }

    def _get_sources_by_ids(self, conn, source_ids: list[str]) -> list[dict]:
        sources = []
        for sid in source_ids:
            s = self._get_source(conn, sid)
            if s:
                sources.append(s)
        return sources

    def _get_due_sources(self, conn) -> list[dict]:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id FROM legal_source_state
                WHERE url IS NOT NULL
                  AND (
                    last_checked_at IS NULL
                    OR last_checked_at < NOW() - (poll_interval_hours || ' hours')::INTERVAL
                  )
                ORDER BY last_checked_at ASC NULLS FIRST
                """
            )
            ids = [row[0] for row in cur.fetchall()]
        return self._get_sources_by_ids(conn, ids)

    def _update_success(
        self, conn, source_id: str, content_hash: str, changed: bool
    ) -> None:
        now = datetime.now(timezone.utc)
        with conn.cursor() as cur:
            if changed:
                cur.execute(
                    """
                    UPDATE legal_source_state
                    SET content_hash = %s, last_checked_at = %s, last_changed_at = %s,
                        consecutive_failures = 0, health = 'GREEN',
                        last_error = NULL, updated_at = %s
                    WHERE id = %s
                    """,
                    (content_hash, now, now, now, source_id),
                )
            else:
                cur.execute(
                    """
                    UPDATE legal_source_state
                    SET last_checked_at = %s, consecutive_failures = 0,
                        health = 'GREEN', last_error = NULL, updated_at = %s
                    WHERE id = %s
                    """,
                    (now, now, source_id),
                )

    def _update_failure(self, conn, source_id: str, error: str) -> None:
        now = datetime.now(timezone.utc)
        with conn.cursor() as cur:
            cur.execute(
                "SELECT consecutive_failures FROM legal_source_state WHERE id = %s",
                (source_id,),
            )
            row = cur.fetchone()
            failures = (row[0] if row else 0) + 1

            health = "GREEN"
            if failures >= 7:
                health = "RED"
            elif failures >= 3:
                health = "YELLOW"

            cur.execute(
                """
                UPDATE legal_source_state
                SET last_checked_at = %s, consecutive_failures = %s,
                    health = %s, last_error = %s, updated_at = %s
                WHERE id = %s
                """,
                (now, failures, health, error[:500], now, source_id),
            )
            logger.warning(
                "Source %s failed (%d consecutive): %s [health=%s]",
                source_id,
                failures,
                error[:200],
                health,
            )


def store_legal_document(
    conn,
    source_id: str,
    title: str,
    restriction_type: str,
    content_hash: str,
    body: str | None = None,
    raw_text: str | None = None,
    affected_ccaa: str | None = None,
    affected_province: str | None = None,
    affected_municipality: str | None = None,
    confidence_tier: str = "automated",
    effective_from: str | None = None,
    effective_until: str | None = None,
    seasonal: bool = False,
    source_url: str | None = None,
    external_id: str | None = None,
    llm_confidence: float | None = None,
) -> str | None:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM legal_documents WHERE content_hash = %s",
            (content_hash,),
        )
        if cur.fetchone():
            return None

        cur.execute(
            """
            INSERT INTO legal_documents (
                source_id, external_id, title, body, restriction_type,
                affected_ccaa, affected_province, affected_municipality,
                confidence_tier, effective_from, effective_until, seasonal,
                content_hash, raw_text, llm_confidence, source_url
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id
            """,
            (
                source_id,
                external_id,
                title,
                body,
                restriction_type,
                affected_ccaa,
                affected_province,
                affected_municipality,
                confidence_tier,
                effective_from,
                effective_until,
                seasonal,
                content_hash,
                raw_text,
                llm_confidence,
                source_url,
            ),
        )
        row = cur.fetchone()
        return str(row[0]) if row else None
