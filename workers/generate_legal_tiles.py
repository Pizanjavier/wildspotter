"""Pre-generate legal zone vector tiles (MVT .pbf) for Spain at z4-z10.

Creates a materialized view of all legal zone geometries in Web Mercator
(EPSG:3857) with subdivided polygons, then iterates over every tile in
Spain's bounding box and writes non-empty tiles to disk.

Usage:
    python generate_legal_tiles.py
    python generate_legal_tiles.py --output-dir /data/legal-tiles
    python generate_legal_tiles.py --min-zoom 4 --max-zoom 10
"""

import argparse
import math
import os
import time
from typing import Tuple

from utils import get_db_connection, setup_logging

logger = setup_logging("generate_legal_tiles")

# Spain bounding box (WGS84)
SPAIN_BBOX = {
    "min_lon": -9.5,
    "max_lon": 4.5,
    "min_lat": 35.5,
    "max_lat": 44.0,
}


def lng_lat_to_tile(lng: float, lat: float, zoom: int) -> Tuple[int, int]:
    """Convert longitude/latitude to slippy map tile coordinates."""
    n = 2 ** zoom
    x = int((lng + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    y = int(
        (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi)
        / 2.0
        * n
    )
    x = max(0, min(x, n - 1))
    y = max(0, min(y, n - 1))
    return x, y


def create_materialized_view(conn) -> None:
    """Create (or refresh) the legal_zones_3857 materialized view.

    All legal zone geometries are clipped to Spain's administrative boundary
    (from OSM planet_osm_polygon, admin_level=2) so that purely marine zones
    are removed and coastal zones only show their land portion.
    """
    logger.info("Creating materialized view legal_zones_3857...")
    with conn.cursor() as cur:
        # Build Spain's land polygon (mainland + islands) as a persistent table
        # so the materialized view can reference it during creation
        logger.info("Building Spain land polygon from OSM boundary...")
        cur.execute("DROP TABLE IF EXISTS spain_land_3857 CASCADE;")
        cur.execute("""
            CREATE TABLE spain_land_3857 AS
            SELECT ST_Union(way) AS geom
            FROM planet_osm_polygon
            WHERE boundary = 'administrative'
              AND admin_level = '2'
              AND name = 'España';
        """)
        cur.execute("CREATE INDEX ON spain_land_3857 USING GIST (geom);")
        conn.commit()

        logger.info("Clipping legal zones to coastline and creating view...")
        cur.execute("DROP MATERIALIZED VIEW IF EXISTS legal_zones_3857;")
        cur.execute("""
            CREATE MATERIALIZED VIEW legal_zones_3857 AS
            WITH spain AS (SELECT geom FROM spain_land_3857)
              SELECT ST_Subdivide(
                       ST_Intersection(ST_Transform(n.geometry, 3857), spain.geom),
                       256
                     ) AS geom,
                     'natura2000' AS zone_type
              FROM natura2000 n, spain
              WHERE ST_Intersects(ST_Transform(n.geometry, 3857), spain.geom)
              UNION ALL
              SELECT ST_Subdivide(
                       ST_Intersection(ST_Transform(p.geom, 3857), spain.geom),
                       256
                     ),
                     'national_park'
              FROM national_parks p, spain
              WHERE ST_Intersects(ST_Transform(p.geom, 3857), spain.geom)
              UNION ALL
              SELECT ST_Subdivide(
                       ST_Intersection(ST_Transform(s.geom, 3857), spain.geom),
                       256
                     ),
                     'coastal_servidumbre'
              FROM servidumbre_proteccion s, spain
              WHERE ST_Intersects(ST_Transform(s.geom, 3857), spain.geom)
              UNION ALL
              SELECT ST_Subdivide(
                       ST_Intersection(ST_Transform(t.geom, 3857), spain.geom),
                       256
                     ),
                     'coastal_terrenos'
              FROM terrenos_incluidos_dpmt t, spain
              WHERE ST_Intersects(ST_Transform(t.geom, 3857), spain.geom)
              UNION ALL
              SELECT ST_Subdivide(
                       ST_Intersection(
                         ST_Buffer(ST_Transform(d.geom, 3857), 20),
                         spain.geom
                       ),
                       256
                     ),
                     'coastal_dpmt'
              FROM dpmt d, spain
              WHERE ST_Intersects(ST_Buffer(ST_Transform(d.geom, 3857), 20), spain.geom);
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_legal_zones_3857_geom
            ON legal_zones_3857 USING GIST (geom);
        """)
    conn.commit()
    logger.info("Materialized view created and indexed.")


def generate_tile(cur, z: int, x: int, y: int) -> bytes:
    """Generate a single MVT tile from the materialized view."""
    query = """
        WITH bounds AS (
          SELECT ST_TileEnvelope(%s, %s, %s) AS geom
        )
        SELECT ST_AsMVT(q, 'legal_zones') AS mvt
        FROM (
          SELECT ST_AsMVTGeom(lz.geom, bounds.geom) AS geom,
                 lz.zone_type AS layer_type
          FROM legal_zones_3857 lz, bounds
          WHERE ST_Intersects(lz.geom, bounds.geom)
            AND lz.geom IS NOT NULL
        ) q
        WHERE q.geom IS NOT NULL;
    """
    cur.execute(query, (z, x, y))
    row = cur.fetchone()
    if row and row[0]:
        return bytes(row[0])
    return b""


def estimate_tile_count(min_zoom: int, max_zoom: int) -> int:
    """Estimate total tiles across all zoom levels for Spain's bounding box."""
    total = 0
    for z in range(min_zoom, max_zoom + 1):
        x_min, y_min = lng_lat_to_tile(SPAIN_BBOX["min_lon"], SPAIN_BBOX["max_lat"], z)
        x_max, y_max = lng_lat_to_tile(SPAIN_BBOX["max_lon"], SPAIN_BBOX["min_lat"], z)
        total += (x_max - x_min + 1) * (y_max - y_min + 1)
    return total


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pre-generate legal zone MVT tiles for Spain"
    )
    parser.add_argument(
        "--output-dir",
        default="/data/legal-tiles",
        help="Output directory for .pbf tiles (default: /data/legal-tiles)",
    )
    parser.add_argument(
        "--min-zoom", type=int, default=4, help="Minimum zoom level (default: 4)"
    )
    parser.add_argument(
        "--max-zoom", type=int, default=10, help="Maximum zoom level (default: 10)"
    )
    args = parser.parse_args()

    output_dir = args.output_dir
    min_zoom = args.min_zoom
    max_zoom = args.max_zoom

    total_estimate = estimate_tile_count(min_zoom, max_zoom)
    logger.info(
        "Generating legal tiles z%d-z%d for Spain. Estimated tiles: %d",
        min_zoom,
        max_zoom,
        total_estimate,
    )

    # Clean previous tiles to avoid serving stale data
    if os.path.exists(output_dir):
        import shutil

        logger.info("Removing previous tiles from %s", output_dir)
        shutil.rmtree(output_dir)

    conn = get_db_connection()
    try:
        create_materialized_view(conn)

        processed = 0
        non_empty = 0
        total_bytes = 0
        start_time = time.time()

        with conn.cursor() as cur:
            for z in range(min_zoom, max_zoom + 1):
                x_min, y_min = lng_lat_to_tile(
                    SPAIN_BBOX["min_lon"], SPAIN_BBOX["max_lat"], z
                )
                x_max, y_max = lng_lat_to_tile(
                    SPAIN_BBOX["max_lon"], SPAIN_BBOX["min_lat"], z
                )

                zoom_tiles = (x_max - x_min + 1) * (y_max - y_min + 1)
                logger.info(
                    "Zoom %d: x=[%d,%d] y=[%d,%d] (%d tiles)",
                    z,
                    x_min,
                    x_max,
                    y_min,
                    y_max,
                    zoom_tiles,
                )

                for x in range(x_min, x_max + 1):
                    for y in range(y_min, y_max + 1):
                        mvt = generate_tile(cur, z, x, y)
                        processed += 1

                        if mvt:
                            tile_dir = os.path.join(output_dir, str(z), str(x))
                            os.makedirs(tile_dir, exist_ok=True)
                            tile_path = os.path.join(tile_dir, f"{y}.pbf")
                            with open(tile_path, "wb") as f:
                                f.write(mvt)
                            non_empty += 1
                            total_bytes += len(mvt)

                        if processed % 100 == 0:
                            elapsed = time.time() - start_time
                            rate = processed / elapsed if elapsed > 0 else 0
                            logger.info(
                                "Progress: %d/%d tiles (%.1f%%), %d non-empty, %.1f tiles/sec",
                                processed,
                                total_estimate,
                                processed / total_estimate * 100,
                                non_empty,
                                rate,
                            )

        elapsed = time.time() - start_time
        logger.info("=== Generation complete ===")
        logger.info("Total tiles checked: %d", processed)
        logger.info("Non-empty tiles written: %d", non_empty)
        logger.info("Total disk usage: %.2f MB", total_bytes / (1024 * 1024))
        logger.info("Time elapsed: %.1f seconds", elapsed)
        logger.info("Output directory: %s", output_dir)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
