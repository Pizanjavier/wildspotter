"""
Step 3: Auto-label downloaded satellite tiles using color heuristics.

Mirrors the app's heuristic-classifier.ts logic to pre-sort images into
ground_suitable / ground_unsuitable folders. Creates a labels.csv with
per-image scores that can be reviewed and corrected.

After running, use the review tool (reviewer.html) to verify edge cases.

Usage:
    python autolabeler.py
    # -> creates labels.csv + sorted copies in labeled/
"""

import csv
import os

import numpy as np
from PIL import Image

DATASET_DIR = "dataset_images"
LABELED_DIR = "labeled"
LABELS_CSV = "labels.csv"

# Thresholds matching src/services/ai/heuristic-classifier.ts
GROUND_THRESHOLD = 0.15  # brown ratio above this = ground suitable
CANOPY_THRESHOLD = 0.60  # green ratio above this = dense canopy


def is_brownish(r: int, g: int, b: int) -> bool:
    """Matches the app's isBrownish function."""
    return r > 150 and g > 100 and b < 100


def is_greenish(r: int, g: int, b: int) -> bool:
    """Matches the app's isGreenish function."""
    return g > r and g > b


def analyze_tile(filepath: str) -> dict:
    """Analyze a satellite tile image and return color ratios + labels."""
    img = Image.open(filepath).convert("RGB")
    pixels = np.array(img)

    total = pixels.shape[0] * pixels.shape[1]
    r, g, b = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]

    brown_mask = (r > 150) & (g > 100) & (b < 100)
    green_mask = (g > r) & (g > b)
    # Detect grey/white tones typical of mineral ground, concrete, sand
    grey_mask = (
        (np.abs(r.astype(int) - g.astype(int)) < 30)
        & (np.abs(g.astype(int) - b.astype(int)) < 30)
        & (r > 120)
    )
    # Blue tones = water
    blue_mask = (b > r) & (b > g) & (b > 100)

    brown_ratio = float(np.sum(brown_mask)) / total
    green_ratio = float(np.sum(green_mask)) / total
    grey_ratio = float(np.sum(grey_mask)) / total
    blue_ratio = float(np.sum(blue_mask)) / total

    ground_suitable = (brown_ratio + grey_ratio * 0.5) >= GROUND_THRESHOLD
    canopy_dense = green_ratio >= CANOPY_THRESHOLD
    likely_water = blue_ratio > 0.4

    return {
        "brown_ratio": round(brown_ratio, 3),
        "green_ratio": round(green_ratio, 3),
        "grey_ratio": round(grey_ratio, 3),
        "blue_ratio": round(blue_ratio, 3),
        "ground_suitable": ground_suitable and not likely_water,
        "canopy_dense": canopy_dense,
        "likely_water": likely_water,
    }


def auto_label():
    # Collect all images from positive/ and negative/ folders
    images = []
    for subdir in ["positive", "negative"]:
        folder = os.path.join(DATASET_DIR, subdir)
        if not os.path.isdir(folder):
            continue
        for fname in sorted(os.listdir(folder)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                images.append((os.path.join(folder, fname), subdir))

    if not images:
        print(f"No images found in {DATASET_DIR}/. Run imagedownloader.py first.")
        return

    print(f"Analyzing {len(images)} images...")

    # Create labeled output dirs
    for label_dir in ["ground_suitable", "ground_unsuitable"]:
        os.makedirs(os.path.join(LABELED_DIR, label_dir), exist_ok=True)

    results = []
    for i, (filepath, candidate_type) in enumerate(images):
        try:
            analysis = analyze_tile(filepath)
            fname = os.path.basename(filepath)

            # Determine final label
            if analysis["ground_suitable"] and not analysis["canopy_dense"]:
                label = "ground_suitable"
                confidence = "high" if analysis["brown_ratio"] > 0.3 else "low"
            else:
                label = "ground_unsuitable"
                confidence = "high" if analysis["green_ratio"] > 0.5 or analysis["likely_water"] else "low"

            results.append({
                "filename": fname,
                "source_path": filepath,
                "candidate_type": candidate_type,
                "label": label,
                "confidence": confidence,
                **analysis,
            })

            # Copy to labeled folder
            img = Image.open(filepath)
            img.save(os.path.join(LABELED_DIR, label, fname))

            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(images)}")
        except Exception as e:
            print(f"  Error processing {filepath}: {e}")

    # Write labels CSV
    with open(LABELS_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "filename", "source_path", "candidate_type", "label", "confidence",
            "brown_ratio", "green_ratio", "grey_ratio", "blue_ratio",
            "ground_suitable", "canopy_dense", "likely_water",
        ])
        writer.writeheader()
        writer.writerows(results)

    suitable = sum(1 for r in results if r["label"] == "ground_suitable")
    unsuitable = len(results) - suitable
    low_conf = sum(1 for r in results if r["confidence"] == "low")
    print(f"\nDone. Labels saved to {LABELS_CSV}")
    print(f"  Ground suitable: {suitable}, Unsuitable: {unsuitable}")
    print(f"  Low confidence (review these): {low_conf}")
    print(f"\nOpen reviewer.html in your browser to review and correct labels.")


if __name__ == "__main__":
    auto_label()
