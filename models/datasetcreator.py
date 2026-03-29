"""
Step 1: Generate training coordinates from Overpass API.

Collects positive candidates (dirt tracks, unpaved parkings) AND negative
samples (forests, urban, water) for training a binary ground-suitability
classifier.

Usage:
    python datasetcreator.py                     # all regions
    python datasetcreator.py --round 1           # round 1 only (south/coast)
    python datasetcreator.py --round 2           # round 2 only (north/interior)
    python datasetcreator.py --output coords2.csv
"""

import argparse
import csv
import os
import random
import requests

TIMEOUT = 30
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

SURFACE_REGEX = "^(unpaved|dirt|gravel|ground|earth|mud)$"
POI_RADIUS_METERS = 500

# Format: "south,west,north,east"

# Round 1: South and Mediterranean coast (original regions)
REGIONS_ROUND_1 = {
    "costa_blanca": "37.95,-0.75,38.85,0.25",
    "cabo_de_gata": "36.70,-2.35,36.85,-2.00",
    "extremadura": "39.00,-6.50,39.50,-5.80",
    "picos_europa": "43.10,-5.10,43.30,-4.70",
    "tarifa_coast": "36.00,-5.70,36.15,-5.50",
}

# Round 2: North (Atlantic) and interior (meseta)
REGIONS_ROUND_2 = {
    # Galicia — green, rainy, eucalyptus forests, granite tracks
    "rias_baixas": "42.20,-8.95,42.45,-8.60",
    "costa_da_morte": "42.90,-9.25,43.10,-8.85",
    # Asturias — steep mountains, coastal cliffs, dense forest
    "asturias_coast": "43.40,-5.90,43.55,-5.40",
    "somiedo": "43.00,-6.30,43.15,-6.00",
    # La Rioja — vineyards, dry hills, river valleys
    "rioja_sierra": "42.10,-2.80,42.35,-2.40",
    # Castilla y León — meseta, dry plains, pine forests
    "sierra_guadarrama": "40.70,-4.10,40.90,-3.80",
    "tierra_campos": "41.80,-5.20,42.10,-4.70",
    "arribes_duero": "41.00,-6.80,41.25,-6.40",
}

ROUNDS = {
    1: REGIONS_ROUND_1,
    2: REGIONS_ROUND_2,
}


def build_positive_query(bbox: str) -> str:
    """Mirrors the app's query-builder.ts for consistency."""
    return f"""
[out:json][timeout:{TIMEOUT}];
(
  way["highway"="track"]["noexit"="yes"]({bbox});
  node["amenity"="parking"]["surface"~"{SURFACE_REGEX}"]({bbox});
  way["amenity"="parking"]["surface"~"{SURFACE_REGEX}"]({bbox});
  way["highway"="track"]["surface"~"{SURFACE_REGEX}"]({bbox});
  (
    node["tourism"="viewpoint"]({bbox});
    node["natural"="beach"]({bbox});
    way["natural"="beach"]({bbox});
  )->.pois;
  (
    way["highway"="track"](around.pois:{POI_RADIUS_METERS})({bbox});
    way["amenity"="parking"](around.pois:{POI_RADIUS_METERS})({bbox});
    node["amenity"="parking"](around.pois:{POI_RADIUS_METERS})({bbox});
  );
);
out center body;
"""


def build_negative_query(bbox: str) -> str:
    """Finds features that are clearly NOT suitable for overnight parking."""
    return f"""
[out:json][timeout:{TIMEOUT}];
(
  way["landuse"="forest"]({bbox});
  way["natural"="water"]({bbox});
  way["landuse"="residential"]({bbox});
  way["landuse"="industrial"]({bbox});
);
out center body qt 80;
"""


def extract_coords(elements: list) -> list[tuple[float, float, str]]:
    """Extract lat/lon from Overpass elements (handles both nodes and ways)."""
    coords = []
    for el in elements:
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        tags = el.get("tags", {})
        if lat and lon:
            label = (
                tags.get("surface")
                or tags.get("highway")
                or tags.get("landuse")
                or tags.get("natural")
                or "unknown"
            )
            coords.append((lat, lon, label))
    return coords


def generate_random_negatives(bbox: str, count: int = 30) -> list[tuple[float, float, str]]:
    """Generate random coordinates within a bbox for hard-negative mining."""
    south, west, north, east = [float(x.strip()) for x in bbox.split(",")]
    coords = []
    for _ in range(count):
        lat = random.uniform(south, north)
        lon = random.uniform(west, east)
        coords.append((lat, lon, "random_negative"))
    return coords


def fetch_region(region_name: str, bbox: str) -> tuple[list, list]:
    """Fetch positive and negative candidates for a single region."""
    positives = []
    negatives = []

    print(f"\n--- Region: {region_name} ({bbox}) ---")

    print("  Fetching positive candidates...")
    try:
        resp = requests.post(
            OVERPASS_URL,
            data={"data": build_positive_query(bbox)},
            timeout=TIMEOUT + 10,
        )
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
        positives = extract_coords(elements)
        print(f"  Found {len(positives)} positive candidates")
    except Exception as e:
        print(f"  Error fetching positives: {e}")

    print("  Fetching negative candidates...")
    try:
        resp = requests.post(
            OVERPASS_URL,
            data={"data": build_negative_query(bbox)},
            timeout=TIMEOUT + 10,
        )
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
        negatives = extract_coords(elements)
        print(f"  Found {len(negatives)} negative candidates")
    except Exception as e:
        print(f"  Error fetching negatives: {e}")

    randoms = generate_random_negatives(bbox)
    negatives.extend(randoms)
    print(f"  Added {len(randoms)} random negatives")

    return positives, negatives


def download_dataset_coordinates(round_num: int | None = None, output: str = "training_coords.csv"):
    # Select regions based on round
    if round_num is not None:
        if round_num not in ROUNDS:
            print(f"Unknown round {round_num}. Available: {list(ROUNDS.keys())}")
            return
        regions = ROUNDS[round_num]
        print(f"=== Round {round_num}: {len(regions)} regions ===")
    else:
        regions = {}
        for r in ROUNDS.values():
            regions.update(r)
        print(f"=== All rounds: {len(regions)} regions ===")

    all_positive = []
    all_negative = []

    for region_name, bbox in regions.items():
        pos, neg = fetch_region(region_name, bbox)
        all_positive.extend(pos)
        all_negative.extend(neg)

    # Write CSV (append if file exists and we're doing a specific round)
    mode = "w"
    write_header = True
    if round_num is not None and os.path.exists(output):
        mode = "a"
        write_header = False
        print(f"\nAppending to existing {output}")

    with open(output, mode=mode, newline="") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(["lat", "lon", "source_tag", "candidate"])
        for lat, lon, tag in all_positive:
            writer.writerow([lat, lon, tag, "positive"])
        for lat, lon, tag in all_negative:
            writer.writerow([lat, lon, tag, "negative"])

    total = len(all_positive) + len(all_negative)
    print(f"\nDone. {total} coordinates written to {output}")
    print(f"  Positive: {len(all_positive)}, Negative: {len(all_negative)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect training coordinates from Overpass")
    parser.add_argument("--round", type=int, default=None, help="Region round (1=south/coast, 2=north/interior)")
    parser.add_argument("--output", type=str, default="training_coords.csv", help="Output CSV file")
    args = parser.parse_args()
    download_dataset_coordinates(round_num=args.round, output=args.output)
