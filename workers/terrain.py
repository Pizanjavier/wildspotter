"""Terrain worker: evaluates elevation and slope for candidate spots.

Fetches Terrain-RGB tiles from AWS Terrarium, decodes elevation,
calculates slope from a 3x3 grid, and updates the spots table.

Usage:
    python terrain.py --batch-size 50 --limit 200
"""

import argparse
import io
import time
from typing import List, Optional, Tuple

import numpy as np
import requests
from PIL import Image

from utils import get_db_connection, lat_lon_to_tile, setup_logging, tile_bounds

logger = setup_logging("terrain")

TERRAIN_TILE_URL = (
    "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
)
TERRAIN_ZOOM = 15
# Offset in degrees for 3x3 sampling grid (~30m at z15)
SAMPLE_OFFSET_DEG = 0.0003
SLOPE_REJECT_THRESHOLD = 8.0

# In-memory LRU tile cache — nearby spots often share the same tile
from functools import lru_cache


def decode_terrarium_elevation(r: int, g: int, b: int) -> float:
    """Decode Terrarium RGB encoding to elevation in meters.

    Formula: elevation = (R * 256 + G + B / 256) - 32768
    """
    return (r * 256.0 + g + b / 256.0) - 32768.0


@lru_cache(maxsize=512)
def _fetch_terrain_tile_cached(x: int, y: int, z: int) -> Optional[bytes]:
    """Download a Terrarium terrain tile and return raw bytes (cached)."""
    url = TERRAIN_TILE_URL.format(x=x, y=y, z=z)
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        return resp.content
    except requests.RequestException as exc:
        logger.warning("Failed to fetch terrain tile %s/%s/%s: %s", z, x, y, exc)
        return None


def fetch_terrain_tile(x: int, y: int, z: int) -> Optional[Image.Image]:
    """Download a Terrarium terrain tile and return as PIL Image."""
    raw = _fetch_terrain_tile_cached(x, y, z)
    if raw is None:
        return None
    return Image.open(io.BytesIO(raw)).convert("RGB")


def get_elevation_at(
    lat: float, lon: float, zoom: int = TERRAIN_ZOOM
) -> Optional[float]:
    """Fetch the elevation at a single coordinate from Terrarium tiles."""
    tx, ty, tz = lat_lon_to_tile(lat, lon, zoom)
    tile_img = fetch_terrain_tile(tx, ty, tz)
    if tile_img is None:
        return None

    # Find pixel position within the tile
    min_lat, min_lon, max_lat, max_lon = tile_bounds(tx, ty, tz)
    w, h = tile_img.size
    px = int((lon - min_lon) / (max_lon - min_lon) * w)
    py = int((max_lat - lat) / (max_lat - min_lat) * h)
    px = max(0, min(px, w - 1))
    py = max(0, min(py, h - 1))

    r, g, b = tile_img.getpixel((px, py))
    elev = decode_terrarium_elevation(r, g, b)
    # Sentinel: R=0,G=0,B=0 decodes to -32768 (no data / ocean)
    if elev <= -32000:
        return None
    return elev


def calculate_slope(lat: float, lon: float) -> Tuple[Optional[float], Optional[float]]:
    """Calculate slope percentage from a 3x3 grid of elevation samples.

    Returns (elevation_at_center, slope_percentage) or (None, None) on failure.
    """
    offsets = [-SAMPLE_OFFSET_DEG, 0.0, SAMPLE_OFFSET_DEG]
    elevations: List[List[Optional[float]]] = []

    for dy in offsets:
        row: List[Optional[float]] = []
        for dx in offsets:
            elev = get_elevation_at(lat + dy, lon + dx)
            row.append(elev)
        elevations.append(row)

    # Check center value
    center_elev = elevations[1][1]
    if center_elev is None:
        return None, None

    # Replace None values with center elevation for robustness
    grid = np.array(
        [
            [e if e is not None else center_elev for e in row]
            for row in elevations
        ],
        dtype=np.float64,
    )

    # Cell size in meters (approximate at this latitude)
    cell_size_m = SAMPLE_OFFSET_DEG * 111320.0 * np.cos(np.radians(lat))

    # Sobel-like gradient (Horn's method)
    dz_dx = (
        (grid[0, 2] + 2 * grid[1, 2] + grid[2, 2])
        - (grid[0, 0] + 2 * grid[1, 0] + grid[2, 0])
    ) / (8.0 * cell_size_m)

    dz_dy = (
        (grid[2, 0] + 2 * grid[2, 1] + grid[2, 2])
        - (grid[0, 0] + 2 * grid[0, 1] + grid[0, 2])
    ) / (8.0 * cell_size_m)

    slope_rad = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
    slope_pct = float(np.tan(slope_rad) * 100.0)

    return float(center_elev), slope_pct


def compute_terrain_score(slope_pct: float) -> float:
    """Compute terrain suitability score (0-100) from slope percentage."""
    score = 100.0 - slope_pct * 10.0
    return max(0.0, min(100.0, score))


def process_batch(batch_size: int, limit: int) -> int:
    """Fetch and process a batch of pending spots. Returns count processed."""
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, ST_Y(geom) AS lat, ST_X(geom) AS lon
                FROM spots
                WHERE status = 'pending'
                ORDER BY created_at
                LIMIT %s
                """,
                (min(batch_size, limit),),
            )
            rows = cur.fetchall()

        if not rows:
            logger.info("No pending spots to process")
            return 0

        logger.info("Processing %d spots for terrain analysis", len(rows))

        for spot_id, osm_id, lat, lon in rows:
            try:
                elevation, slope_pct = calculate_slope(lat, lon)

                if elevation is None or slope_pct is None:
                    logger.warning(
                        "Could not compute terrain for spot %s (osm_id=%s)",
                        spot_id, osm_id,
                    )
                    with conn.cursor() as cur:
                        cur.execute(
                            "UPDATE spots SET status = 'error', updated_at = NOW() WHERE id = %s",
                            (spot_id,)
                        )
                    conn.commit()
                    continue

                terrain_score = compute_terrain_score(slope_pct)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET elevation = %s,
                            slope_pct = %s,
                            terrain_score = %s,
                            status = 'terrain_done',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (elevation, slope_pct, terrain_score, spot_id),
                    )
                conn.commit()
                logger.info(
                    "Terrain done for spot %s (osm_id=%s): "
                    "elev=%.0fm, slope=%.1f%%, score=%.0f",
                    spot_id, osm_id, elevation, slope_pct, terrain_score,
                )

                processed += 1
                # Brief pause to be kind to the tile server
                time.sleep(0.2)

            except Exception:
                conn.rollback()
                logger.exception(
                    "Error processing spot %s (osm_id=%s)", spot_id, osm_id
                )

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter terrain worker")
    parser.add_argument(
        "--batch-size", type=int, default=50, help="Spots per batch (default: 50)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Max spots to process total (0=unlimited, default: 0)",
    )
    args = parser.parse_args()

    limit = args.limit if args.limit > 0 else float("inf")
    total_processed = 0

    logger.info(
        "Starting terrain worker (batch_size=%d, limit=%s)",
        args.batch_size,
        args.limit if args.limit > 0 else "unlimited",
    )

    while total_processed < limit:
        remaining = int(limit - total_processed) if limit != float("inf") else args.batch_size
        count = process_batch(args.batch_size, remaining)
        if count == 0:
            break
        total_processed += count
        logger.info("Progress: %d spots processed so far", total_processed)

    logger.info("Terrain worker finished. Total processed: %d", total_processed)


if __name__ == "__main__":
    main()
