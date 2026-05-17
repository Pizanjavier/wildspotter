"""Reverse-geocode spots against municipalities table.

Sets municipality and province columns for spots that don't have them yet.
Runs as a lightweight pipeline step after extract_candidates.

Usage:
    python -m pipeline.location [--limit N] [--dry-run]
"""

import argparse
import logging

from utils import get_db_connection, setup_logging

logger = setup_logging("location")

GEOCODE_SQL = """
    UPDATE spots s
    SET
        municipality = m.nombre,
        province     = m.provincia
    FROM municipalities m
    WHERE s.municipality IS NULL
      AND m.geom IS NOT NULL
      AND ST_Contains(m.geom, s.geom)
"""

GEOCODE_SQL_LIMITED = """
    WITH batch AS (
        SELECT id FROM spots
        WHERE municipality IS NULL
        LIMIT %s
    )
    UPDATE spots s
    SET
        municipality = m.nombre,
        province     = m.provincia
    FROM municipalities m, batch b
    WHERE s.id = b.id
      AND m.geom IS NOT NULL
      AND ST_Contains(m.geom, s.geom)
"""


def run(limit: int | None = None, dry_run: bool = False) -> int:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM spots WHERE municipality IS NULL")
    pending = cur.fetchone()[0]
    logger.info("Spots without location: %d", pending)

    if pending == 0 or dry_run:
        cur.close()
        conn.close()
        return 0

    if limit:
        cur.execute(GEOCODE_SQL_LIMITED, (limit,))
    else:
        cur.execute(GEOCODE_SQL)

    updated = cur.rowcount
    conn.commit()
    logger.info("Geocoded %d spots", updated)

    cur.close()
    conn.close()
    return updated


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reverse-geocode spots")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(limit=args.limit, dry_run=args.dry_run)
