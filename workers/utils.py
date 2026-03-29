"""Shared utilities for WildSpotter processing workers.

Provides database connection, tile math, and logging setup.
"""

import logging
import math
import os
import sys
from typing import Tuple

import psycopg2
from psycopg2.extensions import connection as PgConnection


def setup_logging(name: str, level: str = "INFO") -> logging.Logger:
    """Configure and return a logger with stdout handler."""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s [%(name)s] %(levelname)s: %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        logger.addHandler(handler)

    return logger


def get_db_connection() -> PgConnection:
    """Create a psycopg2 connection from the DATABASE_URL env var.

    Raises SystemExit if DATABASE_URL is not set.
    """
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL environment variable is not set")
    return psycopg2.connect(database_url)


def lat_lon_to_tile(lat: float, lon: float, zoom: int) -> Tuple[int, int, int]:
    """Convert latitude/longitude to TMS tile coordinates (x, y, z).

    Returns (x, y, zoom) using the standard Slippy Map / TMS scheme.
    """
    lat_rad = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    # Clamp to valid range
    x = max(0, min(x, n - 1))
    y = max(0, min(y, n - 1))
    return x, y, zoom


def tile_bounds(x: int, y: int, zoom: int) -> Tuple[float, float, float, float]:
    """Return the geographic bounds of a tile as (min_lat, min_lon, max_lat, max_lon)."""
    n = 2 ** zoom
    min_lon = x / n * 360.0 - 180.0
    max_lon = (x + 1) / n * 360.0 - 180.0
    max_lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    min_lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    return min_lat, min_lon, max_lat, max_lon


def pixel_position_in_tile(
    lat: float, lon: float, x: int, y: int, zoom: int, tile_size: int = 256
) -> Tuple[int, int]:
    """Return the pixel (px, py) within a tile for a given coordinate."""
    min_lat, min_lon, max_lat, max_lon = tile_bounds(x, y, zoom)
    px = int((lon - min_lon) / (max_lon - min_lon) * tile_size)
    py = int((max_lat - lat) / (max_lat - min_lat) * tile_size)
    px = max(0, min(px, tile_size - 1))
    py = max(0, min(py, tile_size - 1))
    return px, py
