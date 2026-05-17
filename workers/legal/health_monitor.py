"""Circuit breaker health monitoring for legal sources.

Tracks source health, detects degradation patterns, and sends
alerts via ntfy.sh when sources fail or change format unexpectedly.

Usage:
    from legal.health_monitor import HealthMonitor
    monitor = HealthMonitor()
    monitor.check_all()
"""

import hashlib
import json
import logging
import os
from datetime import datetime, timezone

import requests

from utils import get_db_connection, setup_logging

logger = setup_logging("legal-health-monitor")

NTFY_TOPIC = os.environ.get("NTFY_TOPIC", "wildspotter-legal")
NTFY_URL = f"https://ntfy.sh/{NTFY_TOPIC}"


class HealthMonitor:
    def check_all(self) -> dict:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, name, source_type, health, consecutive_failures,
                           last_checked_at, last_changed_at, last_error
                    FROM legal_source_state
                    ORDER BY health DESC, consecutive_failures DESC
                """)
                sources = cur.fetchall()

            summary = {"GREEN": 0, "YELLOW": 0, "RED": 0, "alerts": []}

            for row in sources:
                source_id, name, source_type, health, failures, last_checked, last_changed, error = row
                summary[health] = summary.get(health, 0) + 1

                if health == "RED":
                    summary["alerts"].append({
                        "source_id": source_id,
                        "name": name,
                        "health": "RED",
                        "failures": failures,
                        "last_error": error,
                        "last_checked": last_checked.isoformat() if last_checked else None,
                    })
                elif health == "YELLOW" and failures >= 5:
                    summary["alerts"].append({
                        "source_id": source_id,
                        "name": name,
                        "health": "YELLOW",
                        "failures": failures,
                        "last_error": error,
                    })

            if summary["alerts"]:
                self._send_alert(summary)

            return summary

        finally:
            conn.close()

    def check_email_sources(self) -> list[dict]:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, name, metadata
                    FROM legal_source_state
                    WHERE source_type = 'email'
                """)
                results = []
                for row in cur.fetchall():
                    source_id, name, metadata = row
                    meta = metadata or {}
                    last_email = meta.get("last_email_received_at")

                    if last_email:
                        last_dt = datetime.fromisoformat(last_email)
                        hours_since = (
                            datetime.now(timezone.utc) - last_dt
                        ).total_seconds() / 3600

                        status = "ok"
                        if hours_since > 168:
                            status = "stale"
                        elif hours_since > 72:
                            status = "warning"

                        results.append({
                            "source_id": source_id,
                            "name": name,
                            "last_email": last_email,
                            "hours_since": round(hours_since, 1),
                            "status": status,
                        })
                    else:
                        results.append({
                            "source_id": source_id,
                            "name": name,
                            "last_email": None,
                            "status": "never_received",
                        })
                return results
        finally:
            conn.close()

    def fingerprint_email(self, source_id: str, html_body: str) -> bool:
        skeleton = _extract_dom_skeleton(html_body)
        fingerprint = hashlib.sha256(skeleton.encode()).hexdigest()[:16]

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT metadata FROM legal_source_state WHERE id = %s",
                    (source_id,),
                )
                row = cur.fetchone()
                if not row:
                    return True

                meta = row[0] or {}
                baseline = meta.get("email_fingerprint")
                mismatch_count = meta.get("fingerprint_mismatches", 0)

                if baseline is None:
                    meta["email_fingerprint"] = fingerprint
                    meta["fingerprint_mismatches"] = 0
                elif fingerprint != baseline:
                    mismatch_count += 1
                    meta["fingerprint_mismatches"] = mismatch_count

                    if mismatch_count >= 3:
                        logger.warning(
                            "Email format changed for %s (3+ mismatches)",
                            source_id,
                        )
                        self._send_format_change_alert(source_id)
                        meta["email_fingerprint"] = fingerprint
                        meta["fingerprint_mismatches"] = 0
                else:
                    meta["fingerprint_mismatches"] = 0

                meta["last_email_received_at"] = datetime.now(
                    timezone.utc
                ).isoformat()

                cur.execute(
                    "UPDATE legal_source_state SET metadata = %s WHERE id = %s",
                    (json.dumps(meta), source_id),
                )
            conn.commit()
            return fingerprint == baseline or baseline is None
        finally:
            conn.close()

    def _send_alert(self, summary: dict) -> None:
        red_count = summary.get("RED", 0)
        alerts = summary.get("alerts", [])

        title = f"WildSpotter Legal: {red_count} source(s) RED"
        body_lines = []
        for alert in alerts[:5]:
            body_lines.append(
                f"[{alert['health']}] {alert['name']}: {alert.get('last_error', 'unknown')[:100]}"
            )
        body = "\n".join(body_lines)

        self._ntfy_post(title, body, priority="high" if red_count > 0 else "default")

    def _send_format_change_alert(self, source_id: str) -> None:
        self._ntfy_post(
            f"WildSpotter: Email format changed for {source_id}",
            "3 consecutive emails had different DOM structure. Parser may need updating.",
            priority="default",
        )

    def _ntfy_post(self, title: str, body: str, priority: str = "default") -> None:
        try:
            requests.post(
                NTFY_URL,
                data=body.encode("utf-8"),
                headers={
                    "Title": title,
                    "Priority": priority,
                    "Tags": "legal,wildspotter",
                },
                timeout=10,
            )
            logger.info("Alert sent: %s", title)
        except requests.RequestException as e:
            logger.error("Failed to send ntfy alert: %s", e)


def _extract_dom_skeleton(html: str) -> str:
    import re
    tags = re.findall(r"<(/?\w+)[^>]*>", html)
    return "|".join(tags[:50])
