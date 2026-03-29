"""
Step 2: Download satellite tiles from ArcGIS World Imagery.

Uses the same tile source and zoom level as the app (ArcGIS zoom 17)
to eliminate domain gap between training data and production inference.

Usage:
    python imagedownloader.py
    # -> creates dataset_images/positive/ and dataset_images/negative/
"""

import csv
import math
import os
import time

import requests

INPUT_CSV = "training_coords.csv"
OUTPUT_FOLDER = "dataset_images"

# Match the app's config (src/constants/config.ts)
SATELLITE_ZOOM = 17
ARCGIS_TILE_URL = (
    "https://server.arcgisonline.com/ArcGIS/rest/services/"
    "World_Imagery/MapServer/tile/{z}/{y}/{x}"
)

# Rate limiting
REQUEST_DELAY = 0.3  # seconds between requests
MAX_RETRIES = 2


def lat_lng_to_tile(lat: float, lng: float, zoom: int) -> tuple[int, int, int]:
    """Mirrors src/services/satellite/tile-math.ts latLngToTile."""
    n = 2**zoom
    x = int(math.floor(((lng + 180) / 360) * n))
    lat_rad = lat * math.pi / 180
    y = int(
        math.floor(
            ((1 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2)
            * n
        )
    )
    return x, y, zoom


def download_tile(lat: float, lng: float) -> bytes | None:
    """Fetch a single ArcGIS satellite tile."""
    x, y, z = lat_lng_to_tile(lat, lng, SATELLITE_ZOOM)
    url = ARCGIS_TILE_URL.format(z=z, y=y, x=x)

    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                continue

            content_type = resp.headers.get("Content-Type", "")
            if "image" not in content_type:
                print(f"    Unexpected content type: {content_type}")
                return None

            return resp.content
        except requests.RequestException as e:
            if attempt == MAX_RETRIES:
                print(f"    Failed after {MAX_RETRIES + 1} attempts: {e}")
                return None
            time.sleep(1)

    return None


def download_images():
    if not os.path.exists(INPUT_CSV):
        print(f"Missing {INPUT_CSV}. Run datasetcreator.py first.")
        return

    # Create output directories
    for subdir in ["positive", "negative"]:
        os.makedirs(os.path.join(OUTPUT_FOLDER, subdir), exist_ok=True)

    with open(INPUT_CSV) as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Downloading {len(rows)} satellite tiles from ArcGIS (zoom {SATELLITE_ZOOM})...")

    stats = {"downloaded": 0, "skipped": 0, "failed": 0}

    for i, row in enumerate(rows):
        lat = float(row["lat"])
        lon = float(row["lon"])
        candidate = row["candidate"]  # "positive" or "negative"
        source_tag = row["source_tag"].replace("/", "_")

        filename = f"{candidate}/{i:04d}_{source_tag}_{lat:.4f}_{lon:.4f}.jpg"
        filepath = os.path.join(OUTPUT_FOLDER, filename)

        if os.path.exists(filepath):
            stats["skipped"] += 1
            continue

        tile_data = download_tile(lat, lon)
        if tile_data:
            with open(filepath, "wb") as img_file:
                img_file.write(tile_data)
            stats["downloaded"] += 1
            print(f"  [{i + 1}/{len(rows)}] {filename}")
        else:
            stats["failed"] += 1

        time.sleep(REQUEST_DELAY)

    print(f"\nDone. Downloaded: {stats['downloaded']}, "
          f"Skipped: {stats['skipped']}, Failed: {stats['failed']}")
    print(f"Images saved to {OUTPUT_FOLDER}/")


if __name__ == "__main__":
    download_images()
