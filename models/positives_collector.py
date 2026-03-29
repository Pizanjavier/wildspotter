"""
Collect verified positive training samples from known-good campervan spots.

Queries OpenStreetMap for tourism=caravan_site, camp_site, and motorhome
parking areas across Spain. All tiles are auto-labeled as ground_suitable
since these are community-verified spots. Zero manual labeling needed.

Usage:
    python positives_collector.py
    python positives_collector.py --target 500
"""

import argparse
import hashlib
import math
import os
import time

import requests

SATELLITE_ZOOM = 17
ARCGIS_TILE_URL = (
    "https://server.arcgisonline.com/ArcGIS/rest/services/"
    "World_Imagery/MapServer/tile/{z}/{y}/{x}"
)
OUTPUT_DIR = "dataset_images/positive_verified"
LABELED_DIR = "labeled/ground_suitable"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Spain bbox: south,west,north,east
SPAIN_BBOX = "35.5,-9.5,44.0,4.5"


def lat_lng_to_tile(lat: float, lng: float, zoom: int) -> tuple[int, int, int]:
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


def tile_key(lat: float, lng: float) -> str:
    x, y, z = lat_lng_to_tile(lat, lng, SATELLITE_ZOOM)
    return f"{z}_{x}_{y}"


def run_overpass_query(query: str, label: str) -> list[tuple[float, float, str]]:
    """Run a single Overpass query and extract coordinates."""
    try:
        resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=60)
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
        coords = []
        for el in elements:
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            if lat and lon:
                coords.append((float(lat), float(lon), label))
        return coords
    except Exception as e:
        print(f"    Query failed: {e}")
        return []


def fetch_osm_positives() -> list[tuple[float, float, str]]:
    """Fetch verified camping/caravan spots from OSM with simple sequential queries."""
    all_coords = []

    queries = [
        # (
        #     f'[out:json][timeout:30];node["tourism"="caravan_site"]({SPAIN_BBOX});out body;',
        #     "caravan_site_node",
        # ),
        # (
        #     f'[out:json][timeout:30];way["tourism"="caravan_site"]({SPAIN_BBOX});out center;',
        #     "caravan_site_way",
        # ),
        # (
        #     f'[out:json][timeout:30];node["tourism"="camp_site"]({SPAIN_BBOX});out body;',
        #     "camp_site_node",
        # ),
        (
            f'[out:json][timeout:30];way["tourism"="camp_site"]({SPAIN_BBOX});out center;',
            "camp_site_way",
        ),
        (
            f'[out:json][timeout:30];node["amenity"="parking"]["caravan"="yes"]({SPAIN_BBOX});out body;',
            "parking_caravan",
        ),
        (
            f'[out:json][timeout:30];way["amenity"="parking"]["caravan"="yes"]({SPAIN_BBOX});out center;',
            "parking_caravan_way",
        ),
        (
            f'[out:json][timeout:30];node["amenity"="parking"]["motorhome"="yes"]({SPAIN_BBOX});out body;',
            "parking_motorhome",
        ),
    ]

    for query, label in queries:
        print(f"  Querying {label}...")
        coords = run_overpass_query(query, label)
        print(f"    Found {len(coords)}")
        all_coords.extend(coords)
        time.sleep(1)  # Be nice to Overpass

    return all_coords


def download_tile(lat: float, lng: float) -> bytes | None:
    x, y, z = lat_lng_to_tile(lat, lng, SATELLITE_ZOOM)
    url = ARCGIS_TILE_URL.format(z=z, y=y, x=x)
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200 and "image" in resp.headers.get("Content-Type", ""):
            return resp.content
    except requests.RequestException:
        pass
    return None


def collect_positives(target: int):
    print("Step 1: Collecting verified positive coordinates from OSM...\n")
    all_coords = fetch_osm_positives()

    print(f"\nTotal coordinates: {len(all_coords)}")

    # Deduplicate by tile
    seen_tiles: dict[str, tuple[float, float, str]] = {}
    for lat, lng, source in all_coords:
        key = tile_key(lat, lng)
        if key not in seen_tiles:
            seen_tiles[key] = (lat, lng, source)

    print(f"Unique tiles after dedup: {len(seen_tiles)}")

    # Load existing image hashes to skip content duplicates
    existing_hashes: set[str] = set()
    for root, _, files in os.walk("dataset_images"):
        for fname in files:
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                fpath = os.path.join(root, fname)
                with open(fpath, "rb") as f:
                    existing_hashes.add(hashlib.md5(f.read()).hexdigest())

    print(f"Existing images in dataset: {len(existing_hashes)}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(LABELED_DIR, exist_ok=True)

    tiles = list(seen_tiles.values())[:target]
    print(f"\nStep 2: Downloading up to {len(tiles)} verified positive tiles...\n")

    downloaded = 0
    skipped = 0

    for i, (lat, lng, source) in enumerate(tiles):
        fname = f"verified_{i:04d}_{source}_{lat:.4f}_{lng:.4f}.jpg"
        fpath_dataset = os.path.join(OUTPUT_DIR, fname)
        fpath_labeled = os.path.join(LABELED_DIR, fname)

        if os.path.exists(fpath_dataset):
            skipped += 1
            continue

        tile_data = download_tile(lat, lng)
        if tile_data:
            content_hash = hashlib.md5(tile_data).hexdigest()
            if content_hash in existing_hashes:
                skipped += 1
                continue
            existing_hashes.add(content_hash)

            with open(fpath_dataset, "wb") as f:
                f.write(tile_data)
            with open(fpath_labeled, "wb") as f:
                f.write(tile_data)
            downloaded += 1

            if downloaded % 50 == 0:
                print(f"  Downloaded {downloaded}...")
        else:
            skipped += 1

        time.sleep(0.25)

    print(f"\nDone.")
    print(f"  Downloaded: {downloaded} new verified positive tiles")
    print(f"  Skipped: {skipped}")
    print(f"  Files in {OUTPUT_DIR}/: {len(os.listdir(OUTPUT_DIR))}")

    # Count final balance
    suitable = len([f for f in os.listdir(LABELED_DIR) if f.endswith(".jpg")])
    unsuitable_dir = "labeled/ground_unsuitable"
    unsuitable = (
        len([f for f in os.listdir(unsuitable_dir) if f.endswith(".jpg")])
        if os.path.isdir(unsuitable_dir)
        else 0
    )
    print(f"\nDataset balance:")
    print(f"  ground_suitable: {suitable}")
    print(f"  ground_unsuitable: {unsuitable}")
    print(f"\nRun: python train.py --epochs 20")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=int, default=600, help="Target positive tiles")
    args = parser.parse_args()
    collect_positives(args.target)
