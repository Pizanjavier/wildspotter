"""Import CCAA tourism decree JSONs into legal_documents table.

Usage:
    python -m legal.decrees_seed
    python -m legal.decrees_seed --dry-run
"""

import argparse
import hashlib
import json
import logging
import os
import sys
from pathlib import Path

from utils import get_db_connection, setup_logging

logger = setup_logging("legal-decrees-seed")

DECREES_DIR = Path(__file__).parent.parent.parent / "data" / "legal" / "decrees" / "ccaa"

CCAA_SOURCE_IDS = {
    "andalucia": "decree_andalucia",
    "aragon": "decree_aragon",
    "asturias": "decree_asturias",
    "baleares": "decree_baleares",
    "canarias": "decree_canarias",
    "cantabria": "decree_cantabria",
    "castilla_la_mancha": "decree_castilla_la_mancha",
    "castilla_y_leon": "decree_castilla_y_leon",
    "cataluna": "decree_cataluna",
    "extremadura": "decree_extremadura",
    "galicia": "decree_galicia",
    "la_rioja": "decree_la_rioja",
    "madrid": "decree_madrid",
    "murcia": "decree_murcia",
    "navarra": "decree_navarra",
    "pais_vasco": "decree_pais_vasco",
    "valencia": "decree_valencia",
}


def compute_hash(data: dict) -> str:
    raw = json.dumps(data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def ensure_source_state(conn, source_id: str, ccaa: str, decree_ref: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO legal_source_state (id, name, source_type, region, poll_interval_hours)
            VALUES (%s, %s, 'api', %s, 8760)
            ON CONFLICT (id) DO NOTHING
            """,
            (source_id, f"Tourism decree: {decree_ref}", ccaa),
        )


def upsert_decree(conn, decree: dict, source_id: str) -> bool:
    content_hash = compute_hash(decree)

    needs_review = any(
        art.get("NEEDS_REVIEW", False) for art in decree.get("articles", [])
    )
    confidence_tier = decree.get("confidence_tier", "unverified")

    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM legal_documents WHERE source_id = %s AND decree_ref = %s",
            (source_id, decree["decree_ref"]),
        )
        existing = cur.fetchone()

        if existing:
            cur.execute(
                """
                UPDATE legal_documents
                SET title = %s, content_hash = %s, decree_articles = %s,
                    source_url = %s, confidence_tier = %s, effective_from = %s,
                    effective_until = %s, affected_ccaa = %s, needs_review = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (
                    decree["decree_title"],
                    content_hash,
                    json.dumps(decree["articles"], ensure_ascii=False),
                    decree.get("source_url"),
                    confidence_tier,
                    decree.get("effective_from"),
                    decree.get("effective_until"),
                    decree["ccaa"],
                    needs_review,
                    existing[0],
                ),
            )
            return False

        cur.execute(
            """
            INSERT INTO legal_documents (
                source_id, title, restriction_type, affected_ccaa,
                confidence_tier, effective_from, effective_until,
                content_hash, decree_ref, decree_articles, source_url,
                needs_review
            ) VALUES (%s, %s, 'tourism_decree', %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                source_id,
                decree["decree_title"],
                decree["ccaa"],
                confidence_tier,
                decree.get("effective_from"),
                decree.get("effective_until"),
                content_hash,
                decree["decree_ref"],
                json.dumps(decree["articles"], ensure_ascii=False),
                decree.get("source_url"),
                needs_review,
            ),
        )
        return True


def seed(dry_run: bool = False) -> None:
    json_files = sorted(DECREES_DIR.glob("*.json"))
    if not json_files:
        logger.error("No JSON files found in %s", DECREES_DIR)
        sys.exit(1)

    logger.info("Found %d decree files", len(json_files))
    inserted = 0
    updated = 0
    errors = 0

    conn = get_db_connection()
    try:
        for path in json_files:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    decree = json.load(f)

                ccaa = decree["ccaa"]
                source_id = CCAA_SOURCE_IDS.get(ccaa)
                if not source_id:
                    logger.warning("Unknown CCAA '%s' in %s, skipping", ccaa, path.name)
                    errors += 1
                    continue

                needs_review = any(
                    art.get("NEEDS_REVIEW", False) for art in decree.get("articles", [])
                )
                if needs_review:
                    logger.warning("%s has articles marked NEEDS_REVIEW", path.name)

                if dry_run:
                    logger.info("[DRY RUN] Would process %s (%s)", path.name, decree["decree_ref"])
                    continue

                ensure_source_state(conn, source_id, ccaa, decree["decree_ref"])
                is_new = upsert_decree(conn, decree, source_id)
                if is_new:
                    inserted += 1
                    logger.info("Inserted: %s — %s", ccaa, decree["decree_ref"])
                else:
                    updated += 1
                    logger.info("Updated: %s — %s", ccaa, decree["decree_ref"])

            except (json.JSONDecodeError, KeyError) as e:
                logger.error("Error parsing %s: %s", path.name, e)
                errors += 1

        if not dry_run:
            conn.commit()

        logger.info(
            "Done: %d inserted, %d updated, %d errors", inserted, updated, errors
        )
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed CCAA tourism decrees")
    parser.add_argument("--dry-run", action="store_true", help="Parse without writing to DB")
    args = parser.parse_args()
    seed(dry_run=args.dry_run)
