"""Legal monitoring polling scheduler.

Long-running process that reads poll_interval_hours from legal_source_state
and dispatches checks on schedule. Runs as the legal-watcher Docker service.

Usage:
    python -m legal.scheduler
    python -m legal.scheduler --once   # Single pass, then exit
"""

import argparse
import logging
import os
import signal
import sys
import time
from datetime import datetime, timezone

from utils import get_db_connection, setup_logging

logger = setup_logging("legal-scheduler")

TICK_INTERVAL = 60


class LegalScheduler:
    def __init__(self) -> None:
        self._running = True
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

    def _handle_signal(self, signum: int, frame) -> None:
        logger.info("Received signal %d, shutting down gracefully", signum)
        self._running = False

    def run(self, once: bool = False) -> None:
        logger.info("Legal scheduler starting")
        self._register_sources()

        while self._running:
            try:
                self._tick()
            except Exception:
                logger.exception("Scheduler tick failed")

            if once:
                break

            time.sleep(TICK_INTERVAL)

        logger.info("Legal scheduler stopped")

    def _register_sources(self) -> None:
        try:
            from watchers.boe_watcher import ensure_source_registered as boe_register
            boe_register()
            logger.info("Registered BOE source")
        except Exception:
            logger.exception("Failed to register BOE source")

        aemet_key = os.environ.get("AEMET_API_KEY")
        if aemet_key:
            try:
                from watchers.aemet_watcher import ensure_source_registered as aemet_register
                aemet_register()
                logger.info("Registered AEMET source")
            except Exception:
                logger.exception("Failed to register AEMET source")
        else:
            logger.info("AEMET_API_KEY not set, skipping AEMET registration")

        try:
            from watchers.rss_configs import RSS_SOURCES
            from watchers.rss_watcher import ensure_sources_registered as rss_register
            rss_register(RSS_SOURCES)
            self._sync_urls("rss", {c["source_id"]: c["url"] for c in RSS_SOURCES})
            logger.info("Registered %d RSS sources", len(RSS_SOURCES))
        except Exception:
            logger.exception("Failed to register RSS sources")

        try:
            from watchers.html_configs import HTML_SOURCES
            from watchers.html_scraper import ensure_sources_registered as html_register
            html_register(HTML_SOURCES)
            self._sync_urls("html", {c["source_id"]: c["url"] for c in HTML_SOURCES})
            logger.info("Registered %d HTML sources", len(HTML_SOURCES))
        except Exception:
            logger.exception("Failed to register HTML sources")

        try:
            from watchers.bop_configs import BOP_CONFIGS
            from watchers.bop_scraper import ensure_sources_registered as bop_register
            bop_register(BOP_CONFIGS)
            self._sync_urls("bop", {c["source_id"]: c["url"] for c in BOP_CONFIGS})
            logger.info("Registered %d BOP sources", len(BOP_CONFIGS))
        except Exception:
            logger.exception("Failed to register BOP sources")

        self._deactivate_orphans()

    def _deactivate_orphans(self) -> None:
        known_ids: set[str] = {"boe_national", "aemet_fire_risk"}
        try:
            from watchers.rss_configs import RSS_SOURCES
            known_ids.update(c["source_id"] for c in RSS_SOURCES)
        except Exception:
            pass
        try:
            from watchers.html_configs import HTML_SOURCES
            known_ids.update(c["source_id"] for c in HTML_SOURCES)
        except Exception:
            pass
        try:
            from watchers.bop_configs import BOP_CONFIGS
            known_ids.update(c["source_id"] for c in BOP_CONFIGS)
        except Exception:
            pass

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM legal_source_state WHERE url IS NOT NULL")
                all_ids = {row[0] for row in cur.fetchall()}
                orphans = all_ids - known_ids
                orphans = {sid for sid in orphans if not sid.startswith("decree_")}
                if orphans:
                    cur.execute(
                        "UPDATE legal_source_state SET url = NULL WHERE id = ANY(%s)",
                        (list(orphans),),
                    )
                    logger.info("Deactivated %d orphan sources: %s", len(orphans), ", ".join(sorted(orphans)))
            conn.commit()
        finally:
            conn.close()

    def _sync_urls(self, label: str, url_map: dict[str, str]) -> None:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                for source_id, url in url_map.items():
                    cur.execute(
                        "UPDATE legal_source_state SET url = %s WHERE id = %s AND url != %s",
                        (url, source_id, url),
                    )
                    if cur.rowcount:
                        logger.info("Updated URL for %s", source_id)
            conn.commit()
        finally:
            conn.close()

    def _tick(self) -> None:
        due_sources = self._get_due_sources()
        if not due_sources:
            return

        logger.info("Processing %d due sources", len(due_sources))

        for source in due_sources:
            if not self._running:
                break
            try:
                self._process_source(source)
            except Exception:
                logger.exception("Failed to process source %s", source["id"])

    def _get_due_sources(self) -> list[dict]:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, source_type, url
                    FROM legal_source_state
                    WHERE url IS NOT NULL
                      AND (
                        last_checked_at IS NULL
                        OR last_checked_at < NOW() - (poll_interval_hours || ' hours')::INTERVAL
                      )
                    ORDER BY last_checked_at ASC NULLS FIRST
                    LIMIT 10
                    """
                )
                return [
                    {"id": row[0], "source_type": row[1], "url": row[2]}
                    for row in cur.fetchall()
                ]
        finally:
            conn.close()

    def _process_source(self, source: dict) -> None:
        source_id = source["id"]
        source_type = source["source_type"]
        logger.info("Checking source: %s (type=%s)", source_id, source_type)

        if source_id == "boe_national":
            from watchers.boe_watcher import BoeWatcher
            watcher = BoeWatcher()
            count = watcher.check_and_store()
            logger.info("BOE: %d new documents", count)

        elif source_id == "aemet_fire_risk":
            from watchers.aemet_watcher import AemetWatcher
            watcher = AemetWatcher()
            count = watcher.check_and_store()
            logger.info("AEMET: %d new fire alerts", count)

        elif source_type == "rss":
            config = self._get_rss_config(source_id)
            if config:
                from watchers.rss_watcher import RssWatcher
                count = RssWatcher().check_and_store(config)
                logger.info("RSS %s: %d new documents", source_id, count)
            else:
                logger.warning("No RSS config for %s, falling back to hash check", source_id)
                self._hash_check(source_id)

        elif source_type == "html":
            config = self._get_html_config(source_id) or self._get_bop_config(source_id)
            if config and config.get("group") in ("C",):
                from watchers.bop_scraper import BopScraper
                count = BopScraper().check_province(config)
                logger.info("BOP-PDF %s: %d new documents", source_id, count)
            elif config and config.get("entry_pattern"):
                from watchers.html_scraper import HtmlScraper
                count = HtmlScraper().check_and_store(config)
                logger.info("HTML %s: %d new documents", source_id, count)
            elif config:
                from watchers.bop_scraper import BopScraper
                count = BopScraper().check_province(config)
                logger.info("BOP %s: %d new documents", source_id, count)
            else:
                logger.warning("No HTML/BOP config for %s, falling back to hash check", source_id)
                self._hash_check(source_id)

        elif source_type == "pdf":
            config = self._get_bop_config(source_id)
            if config:
                from watchers.bop_scraper import BopScraper
                count = BopScraper().check_province(config)
                logger.info("PDF %s: %d new documents", source_id, count)
            else:
                logger.warning("No BOP config for %s", source_id)

        else:
            self._hash_check(source_id)

        self._mark_checked(source_id)

    def _hash_check(self, source_id: str) -> None:
        from legal.source_monitor import SourceMonitor
        monitor = SourceMonitor()
        results = monitor.check_sources([source_id])
        for r in results:
            if r.get("error"):
                logger.warning("Source %s error: %s", source_id, r["error"])
            elif r.get("changed"):
                logger.info("Source %s changed (hash only)", source_id)

    def _get_rss_config(self, source_id: str) -> dict | None:
        from watchers.rss_configs import RSS_SOURCES
        for c in RSS_SOURCES:
            if c["source_id"] == source_id:
                return c
        return None

    def _get_html_config(self, source_id: str) -> dict | None:
        from watchers.html_configs import HTML_SOURCES
        for c in HTML_SOURCES:
            if c["source_id"] == source_id:
                return c
        return None

    def _get_bop_config(self, source_id: str) -> dict | None:
        from watchers.bop_configs import BOP_CONFIGS
        for c in BOP_CONFIGS:
            if c["source_id"] == source_id:
                return c
        return None

    def _mark_checked(self, source_id: str) -> None:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE legal_source_state
                    SET last_checked_at = NOW(), updated_at = NOW()
                    WHERE id = %s
                    """,
                    (source_id,),
                )
            conn.commit()
        finally:
            conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Legal monitoring scheduler")
    parser.add_argument("--once", action="store_true", help="Run one pass and exit")
    args = parser.parse_args()

    scheduler = LegalScheduler()
    scheduler.run(once=args.once)
