"""
Smart labeler v2: deduplicates tiles, trains on verified labels, re-labels the rest.

Key fix: satellite tiles at zoom 17 cover ~150m, so multiple nearby Overpass
results map to the exact same tile image. This creates duplicates with
potentially conflicting labels. This script:

1. Deduplicates images by file hash (keeps one per unique tile)
2. Builds a clean verified-only training set from your corrections
3. Trains a quick model on that clean set
4. Uses the model to label all remaining unchecked unique tiles
5. Outputs a clean labeled/ directory for final training

Usage:
    python smartlabeler.py
"""

import argparse
import csv
import hashlib
import os
import shutil

import numpy as np
from PIL import Image

IMG_SIZE = 256
DATASET_DIR = "dataset_images"
LABELED_DIR = "labeled"


def hash_file(filepath: str) -> str:
    """Fast MD5 hash of file contents."""
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def collect_all_images() -> list[tuple[str, str]]:
    """Collect all images from dataset_images/positive, negative, and positive_verified."""
    images = []
    for subdir in ["positive", "negative", "positive_verified"]:
        folder = os.path.join(DATASET_DIR, subdir)
        if not os.path.isdir(folder):
            continue
        for fname in sorted(os.listdir(folder)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                images.append((fname, os.path.join(folder, fname)))
    return images


def deduplicate(images: list[tuple[str, str]]) -> dict[str, tuple[str, str]]:
    """Deduplicate images by content hash. Returns {hash: (fname, fpath)}."""
    seen: dict[str, tuple[str, str]] = {}
    dupes = 0
    for fname, fpath in images:
        h = hash_file(fpath)
        if h not in seen:
            seen[h] = (fname, fpath)
        else:
            dupes += 1
    print(f"  Total images: {len(images)}, Unique tiles: {len(seen)}, Duplicates removed: {dupes}")
    return seen


def load_verified_labels() -> dict[str, str]:
    """Load human-verified labels from CSVs + OSM verified positives."""
    verified = {}
    for csv_file in ["labels_corrected.csv", "labels_corrected_round_2.csv"]:
        if not os.path.exists(csv_file):
            continue
        with open(csv_file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("corrected", "false").lower() == "true":
                    verified[row["filename"]] = row["label"]

    # All images from positive_verified/ are community-verified suitable spots (OSM)
    pv_dir = os.path.join(DATASET_DIR, "positive_verified")
    if os.path.isdir(pv_dir):
        pv_count = 0
        for fname in os.listdir(pv_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                verified[fname] = "ground_suitable"
                pv_count += 1
        print(f"  OSM verified positives: {pv_count}")

    return verified


def load_all_labels() -> dict[str, str]:
    """Load all labels from CSV files + OSM verified positives."""
    labels = {}
    for csv_file in ["labels_corrected.csv", "labels_corrected_round_2.csv"]:
        if not os.path.exists(csv_file):
            continue
        with open(csv_file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                labels[row["filename"]] = row["label"]

    # OSM verified positives
    pv_dir = os.path.join(DATASET_DIR, "positive_verified")
    if os.path.isdir(pv_dir):
        for fname in os.listdir(pv_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                labels[fname] = "ground_suitable"

    return labels


def resolve_label_for_hash(
    file_hash: str,
    hash_to_files: dict[str, list[str]],
    verified: dict[str, str],
    all_labels: dict[str, str],
) -> str | None:
    """For a set of duplicate files, resolve to a single label.
    Priority: human-verified > majority vote > None (unchecked)."""
    filenames = hash_to_files.get(file_hash, [])

    # Check if any duplicate has a verified label
    for fname in filenames:
        if fname in verified:
            return verified[fname]

    # Check auto-labels — if all agree, use that
    auto_labels = [all_labels[f] for f in filenames if f in all_labels]
    if auto_labels:
        if all(l == auto_labels[0] for l in auto_labels):
            return None  # Consistent auto-labels, but not verified — treat as unchecked
        return None  # Conflicting labels — needs model prediction

    return None


def prepare_training_set(
    unique_tiles: dict[str, tuple[str, str]],
    hash_to_files: dict[str, list[str]],
    verified: dict[str, str],
) -> tuple[str, int]:
    """Create a clean training directory from verified-only labels."""
    train_dir = "_smartlabel_train"
    if os.path.exists(train_dir):
        shutil.rmtree(train_dir)
    for label in ["ground_suitable", "ground_unsuitable"]:
        os.makedirs(os.path.join(train_dir, label), exist_ok=True)

    count = 0
    for file_hash, (fname, fpath) in unique_tiles.items():
        # Check all filenames that map to this hash for verified labels
        filenames = hash_to_files.get(file_hash, [fname])
        label = None
        for f in filenames:
            if f in verified:
                label = verified[f]
                break

        if label:
            shutil.copy2(fpath, os.path.join(train_dir, label, fname))
            count += 1

    return train_dir, count


def train_model(train_dir: str):
    """Train MobileNetV2 on verified labels."""
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
    import tensorflow as tf

    # Check class balance
    suitable_count = len(os.listdir(os.path.join(train_dir, "ground_suitable")))
    unsuitable_count = len(os.listdir(os.path.join(train_dir, "ground_unsuitable")))
    total = suitable_count + unsuitable_count
    print(f"  Training set: {suitable_count} suitable, {unsuitable_count} unsuitable")

    # Compute class weights to handle imbalance
    weight_suitable = total / (2 * suitable_count) if suitable_count > 0 else 1.0
    weight_unsuitable = total / (2 * unsuitable_count) if unsuitable_count > 0 else 1.0
    class_weight = {0: weight_unsuitable, 1: weight_suitable}
    print(f"  Class weights: suitable={weight_suitable:.2f}, unsuitable={weight_unsuitable:.2f}")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        labels="inferred",
        label_mode="binary",
        class_names=["ground_unsuitable", "ground_suitable"],
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=16,
        validation_split=0.15,
        subset="training",
        seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        labels="inferred",
        label_mode="binary",
        class_names=["ground_unsuitable", "ground_suitable"],
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=16,
        validation_split=0.15,
        subset="validation",
        seed=42,
    )

    normalize = tf.keras.layers.Rescaling(1.0 / 255)
    augment = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal_and_vertical"),
        tf.keras.layers.RandomRotation(0.2),
        tf.keras.layers.RandomBrightness(0.15),
        tf.keras.layers.RandomContrast(0.15),
    ])
    train_ds = train_ds.map(lambda x, y: (augment(normalize(x), training=True), y)).prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.map(lambda x, y: (normalize(x), y)).prefetch(tf.data.AUTOTUNE)

    base = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet",
    )
    # Unfreeze more layers for better feature learning
    for layer in base.layers[:-40]:
        layer.trainable = False

    model = tf.keras.Sequential([
        base,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )

    print("  Training (up to 15 epochs, early stopping on val_auc)...")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=15,
        class_weight=class_weight,
        verbose=1,
        callbacks=[
            tf.keras.callbacks.EarlyStopping(
                monitor="val_auc", patience=4, mode="max", restore_best_weights=True
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6
            ),
        ],
    )

    val_loss, val_acc, val_auc = model.evaluate(val_ds, verbose=0)
    print(f"  Model accuracy: {val_acc:.3f}, AUC: {val_auc:.3f}")

    return model


def predict_tiles(model, filepaths: list[str]) -> list[float]:
    """Batch inference."""
    images = []
    for fp in filepaths:
        img = Image.open(fp).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
        images.append(np.array(img, dtype=np.float32) / 255.0)
    batch = np.stack(images)
    preds = model.predict(batch, verbose=0)
    return [float(p[0]) for p in preds]


def smart_label(threshold: float):
    print("Step 1: Collecting and deduplicating images...")
    all_images = collect_all_images()
    unique_tiles = deduplicate(all_images)

    # Build reverse map: hash -> list of filenames
    hash_to_files: dict[str, list[str]] = {}
    for fname, fpath in all_images:
        h = hash_file(fpath)
        hash_to_files.setdefault(h, []).append(fname)

    print("\nStep 2: Loading human-verified labels...")
    verified = load_verified_labels()
    all_labels = load_all_labels()

    # Count how many unique tiles have verified labels
    verified_hashes = set()
    for file_hash, (fname, fpath) in unique_tiles.items():
        filenames = hash_to_files.get(file_hash, [])
        for f in filenames:
            if f in verified:
                verified_hashes.add(file_hash)
                break

    unchecked_hashes = set(unique_tiles.keys()) - verified_hashes
    print(f"  Verified labels: {len(verified)} files -> {len(verified_hashes)} unique tiles")
    print(f"  Unchecked unique tiles: {len(unchecked_hashes)}")

    print("\nStep 3: Training model on verified tiles only...")
    train_dir, count = prepare_training_set(unique_tiles, hash_to_files, verified)
    print(f"  Prepared {count} unique verified tiles for training")

    if count < 50:
        print("  Not enough verified tiles (need 50+). Review more images first.")
        shutil.rmtree(train_dir, ignore_errors=True)
        return

    model = train_model(train_dir)
    shutil.rmtree(train_dir, ignore_errors=True)

    print("\nStep 4: Building clean labeled/ directory...")
    # Clean slate
    if os.path.exists(LABELED_DIR):
        shutil.rmtree(LABELED_DIR)
    for label in ["ground_suitable", "ground_unsuitable"]:
        os.makedirs(os.path.join(LABELED_DIR, label), exist_ok=True)

    # Copy verified tiles
    verified_stats = {"ground_suitable": 0, "ground_unsuitable": 0}
    for file_hash in verified_hashes:
        fname, fpath = unique_tiles[file_hash]
        filenames = hash_to_files[file_hash]
        label = None
        for f in filenames:
            if f in verified:
                label = verified[f]
                break
        if label:
            shutil.copy2(fpath, os.path.join(LABELED_DIR, label, fname))
            verified_stats[label] += 1

    print(f"  Verified: {verified_stats['ground_suitable']} suitable, {verified_stats['ground_unsuitable']} unsuitable")

    # Predict unchecked tiles
    unchecked_list = [(file_hash, unique_tiles[file_hash]) for file_hash in unchecked_hashes]
    model_stats = {"ground_suitable": 0, "ground_unsuitable": 0, "low_conf": 0}

    batch_size = 32
    for i in range(0, len(unchecked_list), batch_size):
        batch = unchecked_list[i:i + batch_size]
        fpaths = [item[1][1] for item in batch]
        scores = predict_tiles(model, fpaths)

        for (file_hash, (fname, fpath)), score in zip(batch, scores):
            if score >= threshold:
                label = "ground_suitable"
            else:
                label = "ground_unsuitable"

            if 0.3 <= score <= 0.7:
                model_stats["low_conf"] += 1

            model_stats[label] += 1
            shutil.copy2(fpath, os.path.join(LABELED_DIR, label, fname))

        if (i + batch_size) % 200 < batch_size:
            print(f"  Predicted {min(i + batch_size, len(unchecked_list))}/{len(unchecked_list)}")

    total_suitable = verified_stats["ground_suitable"] + model_stats["ground_suitable"]
    total_unsuitable = verified_stats["ground_unsuitable"] + model_stats["ground_unsuitable"]
    print(f"\nDone. Clean dataset in {LABELED_DIR}/:")
    print(f"  Total unique tiles: {len(unique_tiles)}")
    print(f"  ground_suitable: {total_suitable} ({verified_stats['ground_suitable']} verified + {model_stats['ground_suitable']} predicted)")
    print(f"  ground_unsuitable: {total_unsuitable} ({verified_stats['ground_unsuitable']} verified + {model_stats['ground_unsuitable']} predicted)")
    print(f"  Low confidence predictions (0.3-0.7): {model_stats['low_conf']}")
    print(f"\nRun: python train.py --epochs 20")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--threshold", type=float, default=0.5)
    args = parser.parse_args()
    smart_label(args.threshold)
