"""Legal pipeline notification system via ntfy.sh.

Sends alerts for:
  - New fire bans
  - New parking/overnight bans
  - Source health degradation (YELLOW/RED)

Uses ntfy.sh (free, no account required).

Usage:
    from legal.notifications import LegalNotifier
    notifier = LegalNotifier()
    notifier.check_and_notify()
"""

import logging
import os
from datetime import datetime, timezone

import requests

from utils import get_db_connection, setup_logging

logger = setup_logging("legal-notifications")

NTFY_TOPIC = os.environ.get("NTFY_TOPIC", "wildspotter-legal")
NTFY_URL = f"https://ntfy.sh/{NTFY_TOPIC}"


class LegalNotifier:
    def __init__(self) -> None:
        self._last_check: datetime | None = None

    def check_and_notify(self) -> dict:
        results = {
            "fire_bans": self._notify_fire_bans(),
            "new_restrictions": self._notify_new_restrictions(),
            "health_alerts": self._notify_health(),
        }
        self._last_check = datetime.now(timezone.utc)
        return results

    def _notify_fire_bans(self) -> int:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT title, affected_province, effective_from
                    FROM legal_documents
                    WHERE restriction_type = 'fire_ban'
                      AND status = 'active'
                      AND created_at > NOW() - INTERVAL '6 hours'
                    ORDER BY created_at DESC
                    LIMIT 10
                """)
                bans = cur.fetchall()
        finally:
            conn.close()

        if not bans:
            return 0

        body_lines = [f"- {b[0]}" for b in bans[:5]]
        if len(bans) > 5:
            body_lines.append(f"... and {len(bans) - 5} more")

        self._send(
            title=f"🔥 {len(bans)} new fire risk alert(s)",
            body="\n".join(body_lines),
            priority="high",
            tags="fire,warning",
        )
        return len(bans)

    def _notify_new_restrictions(self) -> int:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT title, restriction_type, affected_ccaa
                    FROM legal_documents
                    WHERE restriction_type IN ('parking_ban', 'overnight_ban', 'camping_ban')
                      AND status = 'active'
                      AND created_at > NOW() - INTERVAL '24 hours'
                    ORDER BY created_at DESC
                    LIMIT 10
                """)
                restrictions = cur.fetchall()
        finally:
            conn.close()

        if not restrictions:
            return 0

        body_lines = [f"- [{r[1]}] {r[0]} ({r[2] or 'unknown'})" for r in restrictions[:5]]

        self._send(
            title=f"⚠️ {len(restrictions)} new restriction(s) detected",
            body="\n".join(body_lines),
            priority="default",
            tags="legal,restriction",
        )
        return len(restrictions)

    def _notify_health(self) -> int:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, name, health, consecutive_failures, last_error
                    FROM legal_source_state
                    WHERE health IN ('YELLOW', 'RED')
                    ORDER BY
                        CASE health WHEN 'RED' THEN 0 ELSE 1 END,
                        consecutive_failures DESC
                    LIMIT 10
                """)
                unhealthy = cur.fetchall()
        finally:
            conn.close()

        if not unhealthy:
            return 0

        red_count = sum(1 for u in unhealthy if u[2] == "RED")
        yellow_count = len(unhealthy) - red_count

        body_lines = [
            f"- [{u[2]}] {u[1]} (fails: {u[3]})"
            for u in unhealthy[:5]
        ]

        priority = "high" if red_count > 0 else "default"
        self._send(
            title=f"Source health: {red_count} RED, {yellow_count} YELLOW",
            body="\n".join(body_lines),
            priority=priority,
            tags="health,monitoring",
        )
        return len(unhealthy)

    def _send(self, title: str, body: str, priority: str = "default", tags: str = "") -> None:
        try:
            requests.post(
                NTFY_URL,
                data=body.encode("utf-8"),
                headers={
                    "Title": title,
                    "Priority": priority,
                    "Tags": tags,
                },
                timeout=10,
            )
            logger.info("Notification sent: %s", title)
        except requests.RequestException as e:
            logger.error("Failed to send notification: %s", e)
