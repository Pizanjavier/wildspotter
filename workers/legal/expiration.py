"""Legal document expiration management.

Handles:
  - Monthly: expire documents past effective_until
  - March annually: flag previous year's seasonal bans as needs_refresh
  - Seasonal activation: activate seasonal restrictions during their months

Usage:
    python -m legal.expiration
    python -m legal.expiration --dry-run
"""

import argparse
import logging
from datetime import date, datetime, timezone

from utils import get_db_connection, setup_logging

logger = setup_logging("legal-expiration")


def expire_past_documents(dry_run: bool = False) -> int:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if dry_run:
                cur.execute("""
                    SELECT COUNT(*) FROM legal_documents
                    WHERE effective_until < NOW()
                      AND status = 'active'
                      AND seasonal = false
                """)
                count = cur.fetchone()[0]
                logger.info("[DRY RUN] Would expire %d documents", count)
                return count

            cur.execute("""
                UPDATE legal_documents
                SET status = 'expired', updated_at = NOW()
                WHERE effective_until < NOW()
                  AND status = 'active'
                  AND seasonal = false
            """)
            count = cur.rowcount

        conn.commit()
        if count:
            logger.info("Expired %d documents past their effective_until", count)
        return count
    finally:
        conn.close()


def refresh_seasonal_bans(dry_run: bool = False) -> int:
    today = date.today()
    if today.month != 3:
        logger.info("Seasonal refresh only runs in March (current: month %d)", today.month)
        return 0

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if dry_run:
                cur.execute("""
                    SELECT COUNT(*) FROM legal_documents
                    WHERE seasonal = true
                      AND status = 'active'
                      AND effective_from < make_date(%s - 1, 1, 1)
                """, (today.year,))
                count = cur.fetchone()[0]
                logger.info("[DRY RUN] Would flag %d seasonal bans for refresh", count)
                return count

            cur.execute("""
                UPDATE legal_documents
                SET status = 'needs_refresh', updated_at = NOW()
                WHERE seasonal = true
                  AND status = 'active'
                  AND effective_from < make_date(%s - 1, 1, 1)
            """, (today.year,))
            count = cur.rowcount

        conn.commit()
        if count:
            logger.info("Flagged %d old seasonal bans for refresh", count)
        return count
    finally:
        conn.close()


def activate_seasonal_restrictions(dry_run: bool = False) -> int:
    current_month = date.today().month

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if dry_run:
                cur.execute("""
                    SELECT COUNT(*) FROM legal_documents
                    WHERE seasonal = true
                      AND status = 'active'
                      AND season_start_month IS NOT NULL
                      AND season_end_month IS NOT NULL
                """)
                count = cur.fetchone()[0]
                logger.info("[DRY RUN] %d seasonal restrictions exist", count)
                return count

            cur.execute("""
                SELECT id, title, season_start_month, season_end_month
                FROM legal_documents
                WHERE seasonal = true
                  AND status IN ('active', 'expired')
                  AND season_start_month IS NOT NULL
                  AND season_end_month IS NOT NULL
            """)

            activated = 0
            deactivated = 0
            for doc_id, title, start_m, end_m in cur.fetchall():
                if start_m <= end_m:
                    in_season = start_m <= current_month <= end_m
                else:
                    in_season = current_month >= start_m or current_month <= end_m

                if in_season:
                    cur.execute(
                        "UPDATE legal_documents SET status = 'active', updated_at = NOW() WHERE id = %s AND status = 'expired'",
                        (doc_id,),
                    )
                    if cur.rowcount:
                        activated += 1
                else:
                    cur.execute(
                        "UPDATE legal_documents SET status = 'expired', updated_at = NOW() WHERE id = %s AND status = 'active'",
                        (doc_id,),
                    )
                    if cur.rowcount:
                        deactivated += 1

        conn.commit()
        if activated or deactivated:
            logger.info(
                "Seasonal: %d activated, %d deactivated (month=%d)",
                activated, deactivated, current_month,
            )
        return activated + deactivated
    finally:
        conn.close()


def run_all(dry_run: bool = False) -> dict:
    results = {
        "expired": expire_past_documents(dry_run),
        "seasonal_refreshed": refresh_seasonal_bans(dry_run),
        "seasonal_toggled": activate_seasonal_restrictions(dry_run),
    }
    logger.info("Expiration run complete: %s", results)
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Legal document expiration")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run_all(dry_run=args.dry_run)
