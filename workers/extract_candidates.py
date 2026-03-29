"""Extract spot candidates from raw OSM data imported by osm2pgsql.

Queries planet_osm_point and planet_osm_line tables for:
1. Dead ends of unpaved tracks (noexit=yes)
2. Informal dirt/gravel parkings near POIs
3. Clearings accessible by motor vehicles
4. Viewpoint-adjacent areas

Inserts candidates into the spots table with status='pending'.

Usage:
    python extract_candidates.py [--limit N] [--dry-run]
"""

import argparse
import logging

from utils import get_db_connection, setup_logging

logger = setup_logging("extract_candidates")

# SQL queries to find candidate spots from OSM data
# Each query targets a specific spot_type per SPEC_V2

# osm2pgsql default schema: common tags are direct columns (highway, surface,
# tourism, access, amenity, leisure, landuse, natural, name, etc.).
# Uncommon tags (noexit, tracktype, parking) live in the `tags` hstore.
# Geometry column `way` is SRID 3857 — must ST_Transform to 4326 for spots table.

CANDIDATE_QUERIES = [
    # 1. Dead ends of unpaved tracks (noexit=yes in tags hstore)
    {
        "spot_type": "dead_end",
        "sql": """
            INSERT INTO spots (osm_id, name, geom, spot_type, surface_type, osm_tags, status)
            SELECT
                osm_id,
                name,
                ST_Transform(way, 4326) AS geom,
                'dead_end' AS spot_type,
                COALESCE(
                    surface,
                    CASE
                        WHEN tags->'tracktype' IN ('grade3', 'grade4', 'grade5') THEN 'dirt'
                        WHEN tags->'tracktype' = 'grade2' THEN 'gravel'
                        ELSE 'unknown'
                    END
                ) AS surface_type,
                COALESCE(hstore_to_jsonb(tags), '{}'::jsonb) AS osm_tags,
                'pending' AS status
            FROM planet_osm_point
            WHERE tags->'noexit' = 'yes'
              AND highway IS NOT NULL
            ON CONFLICT (osm_id) DO NOTHING
        """,
    },
    # 2. Informal dirt/gravel parkings (amenity is a column, parking is in tags)
    {
        "spot_type": "dirt_parking",
        "sql": """
            INSERT INTO spots (osm_id, name, geom, spot_type, surface_type, osm_tags, status)
            SELECT
                osm_id,
                COALESCE(name, 'Parking') AS name,
                ST_Transform(ST_Centroid(way), 4326) AS geom,
                'dirt_parking' AS spot_type,
                COALESCE(surface, 'unknown') AS surface_type,
                COALESCE(hstore_to_jsonb(tags), '{}'::jsonb) AS osm_tags,
                'pending' AS status
            FROM planet_osm_polygon
            WHERE amenity = 'parking'
              AND (
                  surface IN ('dirt', 'gravel', 'grass', 'earth', 'ground', 'sand', 'unpaved', 'compacted', 'fine_gravel')
                  OR tags->'parking' = 'surface'
                  OR (surface IS NULL AND tags->'parking' IN ('surface', 'informal'))
              )
            ON CONFLICT (osm_id) DO NOTHING
        """,
    },
    # 3. Viewpoint-adjacent spots (tourism and natural are columns)
    {
        "spot_type": "viewpoint_adjacent",
        "sql": """
            INSERT INTO spots (osm_id, name, geom, spot_type, surface_type, osm_tags, status)
            SELECT
                osm_id,
                COALESCE(name, 'Viewpoint') AS name,
                ST_Transform(way, 4326) AS geom,
                'viewpoint_adjacent' AS spot_type,
                COALESCE(surface, 'unknown') AS surface_type,
                COALESCE(hstore_to_jsonb(tags), '{}'::jsonb) AS osm_tags,
                'pending' AS status
            FROM planet_osm_point
            WHERE tourism = 'viewpoint'
              OR ("natural" = 'peak' AND tags->'parking' IS NOT NULL)
            ON CONFLICT (osm_id) DO NOTHING
        """,
    },
    # 4. Clearings / picnic areas with vehicle access
    {
        "spot_type": "clearing",
        "sql": """
            INSERT INTO spots (osm_id, name, geom, spot_type, surface_type, osm_tags, status)
            SELECT
                osm_id,
                COALESCE(name, 'Clearing') AS name,
                ST_Transform(ST_Centroid(way), 4326) AS geom,
                'clearing' AS spot_type,
                COALESCE(surface, 'unknown') AS surface_type,
                COALESCE(hstore_to_jsonb(tags), '{}'::jsonb) AS osm_tags,
                'pending' AS status
            FROM planet_osm_polygon
            WHERE (
                leisure IN ('picnic_table', 'firepit')
                OR tourism = 'picnic_site'
                OR (landuse = 'grass' AND access IN ('yes', 'permissive'))
                OR ("natural" = 'scrub' AND access IN ('yes', 'permissive'))
            )
              AND COALESCE(access, 'yes') NOT IN ('no', 'private')
            ON CONFLICT (osm_id) DO NOTHING
        """,
    },
    # 5. Track endpoints (ways ending without connection)
    {
        "spot_type": "dead_end",
        "sql": """
            INSERT INTO spots (osm_id, name, geom, spot_type, surface_type, osm_tags, status)
            SELECT
                osm_id,
                name,
                ST_Transform(ST_EndPoint(way), 4326) AS geom,
                'dead_end' AS spot_type,
                COALESCE(
                    surface,
                    CASE
                        WHEN tags->'tracktype' IN ('grade3', 'grade4', 'grade5') THEN 'dirt'
                        WHEN tags->'tracktype' = 'grade2' THEN 'gravel'
                        ELSE 'unknown'
                    END
                ) AS surface_type,
                COALESCE(hstore_to_jsonb(tags), '{}'::jsonb) AS osm_tags,
                'pending' AS status
            FROM planet_osm_line
            WHERE highway = 'track'
              AND (
                  surface IN ('dirt', 'gravel', 'grass', 'earth', 'ground', 'sand', 'unpaved', 'compacted', 'fine_gravel')
                  OR tags->'tracktype' IN ('grade3', 'grade4', 'grade5')
              )
              AND COALESCE(access, 'yes') NOT IN ('no', 'private')
              AND NOT EXISTS (
                  SELECT 1 FROM planet_osm_line other
                  WHERE other.osm_id != planet_osm_line.osm_id
                    AND other.highway IS NOT NULL
                    AND ST_DWithin(ST_EndPoint(planet_osm_line.way), other.way, 10)
              )
            ON CONFLICT (osm_id) DO NOTHING
        """,
    },
]


def run_extraction(limit: int = 0, dry_run: bool = False) -> int:
    """Run all candidate extraction queries. Returns total candidates inserted."""
    conn = get_db_connection()
    total = 0

    try:
        # First check if osm2pgsql tables exist
        with conn.cursor() as cur:
            cur.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'planet_osm_point'
                )
            """)
            exists = cur.fetchone()[0]

        if not exists:
            logger.error("planet_osm_point table not found. Run osm2pgsql first.")
            return 0

        for query_def in CANDIDATE_QUERIES:
            spot_type = query_def["spot_type"]
            sql = query_def["sql"]

            if limit > 0:
                # Add LIMIT to the SELECT inside the INSERT
                sql = sql.replace(
                    "ON CONFLICT",
                    f"LIMIT {limit}\n            ON CONFLICT",
                )

            try:
                if dry_run:
                    logger.info("[DRY RUN] Would run extraction for: %s", spot_type)
                    continue

                with conn.cursor() as cur:
                    cur.execute(sql)
                    count = cur.rowcount
                conn.commit()

                logger.info(
                    "Extracted %d candidates for spot_type=%s", count, spot_type
                )
                total += count

            except Exception:
                conn.rollback()
                logger.exception(
                    "Failed to extract candidates for spot_type=%s", spot_type
                )

        # Log summary
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM spots WHERE status = 'pending'")
            pending = cur.fetchone()[0]

        logger.info(
            "Extraction complete. %d new candidates. %d total pending.",
            total, pending,
        )

    finally:
        conn.close()

    return total


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract spot candidates from OSM data"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Max candidates per query (0=unlimited)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Log what would be done without executing",
    )
    args = parser.parse_args()

    logger.info("Starting candidate extraction (limit=%d, dry_run=%s)",
                args.limit, args.dry_run)
    total = run_extraction(limit=args.limit, dry_run=args.dry_run)
    logger.info("Done. Total candidates extracted: %d", total)


if __name__ == "__main__":
    main()
