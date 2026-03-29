"""
Model-based auto-labeler for subsequent training rounds.

Instead of using simple color heuristics (autolabeler.py), this script
uses the trained TFLite model from round 1 to pre-label new satellite tiles.
Much more accurate — you only need to review the low-confidence edge cases.

Usage:
    python modellabeler.py
    python modellabeler.py --model spot-classifier.tflite --threshold 0.7
"""

import argparse
import csv
import os
import shutil

import numpy as np
from PIL import Image

DATASET_DIR = "dataset_images"
LABELED_DIR = "labeled"
LABELS_CSV = "labels.csv"
IMG_SIZE = 256


def load_tflite_model(model_path: str):
    """Load a TFLite model for inference."""
    import tensorflow as tf
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    return interpreter


def predict_tile(interpreter, filepath: str) -> float:
    """Run inference on a single tile. Returns probability of ground_suitable."""
    import tensorflow as tf

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    img = Image.open(filepath).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    interpreter.set_tensor(input_details[0]["index"], img_array)
    interpreter.invoke()

    output = interpreter.get_tensor(output_details[0]["index"])
    return float(output[0][0])


def model_label(model_path: str, threshold: float):
    if not os.path.exists(model_path):
        print(f"Model not found: {model_path}")
        print("Train the model first with: python train.py")
        return

    # Collect all images
    images = []
    for subdir in ["positive", "negative"]:
        folder = os.path.join(DATASET_DIR, subdir)
        if not os.path.isdir(folder):
            continue
        for fname in sorted(os.listdir(folder)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                images.append((os.path.join(folder, fname), subdir))

    if not images:
        print(f"No images in {DATASET_DIR}/. Run imagedownloader.py first.")
        return

    # Check which images are already labeled (from previous rounds)
    existing_labeled = set()
    for label_dir in ["ground_suitable", "ground_unsuitable"]:
        d = os.path.join(LABELED_DIR, label_dir)
        if os.path.isdir(d):
            existing_labeled.update(os.listdir(d))

    new_images = [(p, s) for p, s in images if os.path.basename(p) not in existing_labeled]
    print(f"Total images: {len(images)}, Already labeled: {len(existing_labeled)}, New: {len(new_images)}")

    if not new_images:
        print("No new images to label.")
        return

    print(f"Loading model: {model_path}")
    interpreter = load_tflite_model(model_path)

    for label_dir in ["ground_suitable", "ground_unsuitable"]:
        os.makedirs(os.path.join(LABELED_DIR, label_dir), exist_ok=True)

    results = []
    for i, (filepath, candidate_type) in enumerate(new_images):
        try:
            score = predict_tile(interpreter, filepath)
            fname = os.path.basename(filepath)

            if score >= threshold:
                label = "ground_suitable"
                confidence = "high" if score >= 0.85 else "low"
            else:
                label = "ground_unsuitable"
                confidence = "high" if score <= 0.15 else "low"

            results.append({
                "filename": fname,
                "source_path": filepath,
                "candidate_type": candidate_type,
                "label": label,
                "confidence": confidence,
                "model_score": round(score, 4),
            })

            # Copy to labeled folder
            shutil.copy2(filepath, os.path.join(LABELED_DIR, label, fname))

            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(new_images)}")
        except Exception as e:
            print(f"  Error processing {filepath}: {e}")

    # Write labels CSV (append to existing)
    write_header = not os.path.exists(LABELS_CSV)
    with open(LABELS_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "filename", "source_path", "candidate_type", "label",
            "confidence", "model_score",
        ])
        if write_header:
            writer.writeheader()
        writer.writerows(results)

    suitable = sum(1 for r in results if r["label"] == "ground_suitable")
    unsuitable = len(results) - suitable
    low_conf = sum(1 for r in results if r["confidence"] == "low")
    print(f"\nDone. {len(results)} new images labeled.")
    print(f"  Suitable: {suitable}, Unsuitable: {unsuitable}")
    print(f"  Low confidence (review these): {low_conf}")
    print(f"\nOpen reviewer.html to review and correct labels.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Label tiles using trained model")
    parser.add_argument("--model", default="spot-classifier.tflite", help="TFLite model path")
    parser.add_argument("--threshold", type=float, default=0.5, help="Classification threshold")
    args = parser.parse_args()
    model_label(args.model, args.threshold)
