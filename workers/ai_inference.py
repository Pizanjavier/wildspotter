"""AI inference worker: satellite image analysis for spot validation.

Downloads satellite tiles from IGN PNOA, runs ONNX model inference
(or heuristic fallback), and updates the ai_score for each spot.

Usage:
    python ai_inference.py --batch-size 50
"""

import argparse
import io
import os
import time
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
import requests
from PIL import Image

from utils import get_db_connection, lat_lon_to_tile, setup_logging

logger = setup_logging("ai_inference")

# IGN PNOA orthophotos (25cm/pixel, free, no API key)
PNOA_TILE_URL = "https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{y}.jpeg"
SATELLITE_ZOOM = 17
SATELLITE_TILE_DIR = "/data/satellite_tiles"
MODEL_PATH_ONNX = "/models/spot-classifier.onnx"
MODEL_PATH_TFLITE = "/models/spot-classifier.tflite"
MODEL_PATH_KERAS = "/models/spot-classifier.keras"

# Rate limit between satellite tile downloads (PNOA is a public service, be respectful but 0.5s is fine)
DOWNLOAD_DELAY_SECONDS = 0.5


def ensure_tile_dir() -> None:
    """Create the satellite tile storage directory if it does not exist."""
    Path(SATELLITE_TILE_DIR).mkdir(parents=True, exist_ok=True)


def download_satellite_tile(
    lat: float, lon: float, osm_id: int
) -> Optional[str]:
    """Download a satellite tile for the given coordinate.

    Returns the file path on success, None on failure.
    """
    x, y_xyz, z = lat_lon_to_tile(lat, lon, SATELLITE_ZOOM)
    # PNOA TMS uses flipped Y axis: y_tms = (2^z - 1) - y_xyz
    y_tms = (2 ** z - 1) - y_xyz
    url = PNOA_TILE_URL.format(x=x, y=y_tms, z=z)

    file_path = os.path.join(SATELLITE_TILE_DIR, f"{osm_id}.jpg")

    # Use cached tile if it already exists
    if os.path.exists(file_path):
        logger.debug("Using cached tile for osm_id=%d", osm_id)
        return file_path

    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()

        # Verify it is a valid image
        img = Image.open(io.BytesIO(resp.content))
        img.verify()

        with open(file_path, "wb") as f:
            f.write(resp.content)

        logger.debug("Downloaded tile for osm_id=%d (%s)", osm_id, url)
        return file_path

    except requests.RequestException as exc:
        logger.warning(
            "Failed to download satellite tile for osm_id=%d: %s", osm_id, exc
        )
        return None
    except Exception as exc:
        logger.warning(
            "Invalid image for osm_id=%d: %s", osm_id, exc
        )
        return None


# Cache the loaded model to avoid reloading for every spot
_keras_model = None


def run_keras_inference(image_path: str) -> Optional[float]:
    """Run the Keras spot-classifier model on a satellite tile.

    MobileNetV2 binary classifier (ground_suitable vs not).
    Input: 256x256 RGB image normalized to [0, 1].
    Output: probability of ground_suitable (0-1), converted to 0-100 score.

    Returns ai_score (0-100) or None if model is unavailable.
    """
    global _keras_model

    if not os.path.exists(MODEL_PATH_KERAS):
        return None

    try:
        import tensorflow as tf

        if _keras_model is None:
            logger.info("Loading Keras model from %s", MODEL_PATH_KERAS)
            _keras_model = tf.keras.models.load_model(MODEL_PATH_KERAS)
            logger.info("Keras model loaded (input: %s, output: %s)",
                        _keras_model.input_shape, _keras_model.output_shape)

        img = Image.open(image_path).convert("RGB")
        img = img.resize((256, 256), Image.BILINEAR)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=0)  # [1, 256, 256, 3]

        prediction = _keras_model.predict(arr, verbose=0)
        raw_score = float(prediction.flat[0])

        # Sigmoid output: 0 = unsuitable, 1 = suitable
        score = raw_score * 100.0
        return max(0.0, min(100.0, score))

    except ImportError:
        logger.warning("TensorFlow not installed, skipping Keras inference")
        return None
    except Exception:
        logger.exception("Keras inference failed for %s", image_path)
        return None


def run_onnx_inference(image_path: str) -> Optional[float]:
    """Run the ONNX spot-classifier model on a satellite tile.

    Returns ai_score (0-100) or None if model is unavailable.
    """
    if not os.path.exists(MODEL_PATH_ONNX):
        return None

    try:
        import onnxruntime as ort

        session = ort.InferenceSession(MODEL_PATH_ONNX)
        input_meta = session.get_inputs()[0]
        input_name = input_meta.name
        input_shape = input_meta.shape

        img = Image.open(image_path).convert("RGB")

        if len(input_shape) == 4:
            if input_shape[1] == 3:
                h, w = input_shape[2], input_shape[3]
                channel_first = True
            else:
                h, w = input_shape[1], input_shape[2]
                channel_first = False
        else:
            h, w = 256, 256
            channel_first = True

        img = img.resize((w, h), Image.BILINEAR)
        arr = np.array(img, dtype=np.float32) / 255.0

        if channel_first:
            arr = arr.transpose(2, 0, 1)

        arr = np.expand_dims(arr, axis=0)

        outputs = session.run(None, {input_name: arr})
        raw_score = float(outputs[0].flat[0])

        if raw_score <= 1.0:
            score = raw_score * 100.0
        else:
            score = raw_score

        return max(0.0, min(100.0, score))

    except Exception:
        logger.exception("ONNX inference failed for %s", image_path)
        return None


def heuristic_score(image_path: str) -> float:
    """Compute a heuristic AI score from satellite tile color analysis.

    Analyzes:
    - Green ratio: high green suggests dense vegetation (negative)
    - Brightness variance: high variance suggests mixed terrain (positive)
    - Brown/tan ratio: bare earth or dirt (positive for parking suitability)

    Returns a score 0-100.
    """
    try:
        img = Image.open(image_path).convert("RGB")
        img = img.resize((128, 128), Image.BILINEAR)
        pixels = np.array(img, dtype=np.float32)

        r = pixels[:, :, 0]
        g = pixels[:, :, 1]
        b = pixels[:, :, 2]

        # Brightness
        brightness = (r + g + b) / 3.0
        mean_brightness = float(np.mean(brightness))
        brightness_var = float(np.std(brightness))

        # Green dominance ratio (vegetation indicator)
        total = r + g + b + 1e-6
        green_ratio = float(np.mean(g / total))

        # Brown/earth tone detection: R > G > B pattern
        brown_mask = (r > g) & (g > b) & (r > 100)
        brown_ratio = float(np.mean(brown_mask.astype(np.float32)))

        # Very dark pixels (shadows, water)
        dark_mask = brightness < 50
        dark_ratio = float(np.mean(dark_mask.astype(np.float32)))

        # Score components
        # Moderate brightness is good (not too dark = water, not too bright = snow)
        brightness_score = 50.0
        if 80 < mean_brightness < 180:
            brightness_score = 70.0

        # Variance indicates mixed terrain (clearings with edges) - positive
        variance_score = min(brightness_var / 3.0, 30.0)

        # Low green ratio is positive (less dense vegetation)
        green_penalty = max(0.0, (green_ratio - 0.33) * 200.0)

        # Brown/earth tones are positive
        brown_bonus = brown_ratio * 40.0

        # Dark areas penalty
        dark_penalty = dark_ratio * 30.0

        score = (
            brightness_score
            + variance_score
            + brown_bonus
            - green_penalty
            - dark_penalty
        )

        return max(0.0, min(100.0, score))

    except Exception:
        logger.exception("Heuristic analysis failed for %s", image_path)
        return 50.0  # Neutral fallback


def process_batch(batch_size: int) -> int:
    """Fetch and process a batch of legal_done spots. Returns count processed."""
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, ST_Y(geom) AS lat, ST_X(geom) AS lon
                FROM spots
                WHERE status = 'legal_done'
                ORDER BY created_at
                LIMIT %s
                """,
                (batch_size,),
            )
            rows: List[Tuple[str, int, float, float]] = cur.fetchall()

        if not rows:
            logger.info("No legal_done spots to process")
            return 0

        logger.info("Processing %d spots for AI inference", len(rows))
        ensure_tile_dir()

        for spot_id, osm_id, lat, lon in rows:
            try:
                # Download satellite tile
                tile_path = download_satellite_tile(lat, lon, osm_id)
                relative_path = None

                if tile_path is None:
                    # Assign neutral score when satellite imagery unavailable
                    ai_score = 50.0
                    method = "no_tile_default"
                else:
                    # Try Keras model first, then ONNX, then heuristic
                    ai_score = run_keras_inference(tile_path)
                    method = "keras"

                    if ai_score is None:
                        ai_score = run_onnx_inference(tile_path)
                        method = "onnx"

                    if ai_score is None:
                        ai_score = heuristic_score(tile_path)
                        method = "heuristic"

                    relative_path = f"satellite_tiles/{osm_id}.jpg"

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET ai_score = %s,
                            satellite_image_path = %s,
                            status = 'ai_done',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (ai_score, relative_path, spot_id),
                    )
                conn.commit()

                logger.info(
                    "AI score for spot %s (osm_id=%s): %.1f (%s)",
                    spot_id, osm_id, ai_score, method,
                )

                processed += 1
                time.sleep(DOWNLOAD_DELAY_SECONDS)

            except Exception:
                conn.rollback()
                logger.exception(
                    "Error processing spot %s (osm_id=%s)", spot_id, osm_id
                )

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter AI inference worker")
    parser.add_argument(
        "--batch-size", type=int, default=50, help="Spots per batch (default: 50)"
    )
    args = parser.parse_args()

    logger.info("Starting AI inference worker (batch_size=%d)", args.batch_size)
    if os.path.exists(MODEL_PATH_KERAS):
        logger.info("Keras model found at %s (MobileNetV2)", MODEL_PATH_KERAS)
    elif os.path.exists(MODEL_PATH_ONNX):
        logger.info("ONNX model found at %s", MODEL_PATH_ONNX)
    else:
        logger.info("No ML model found, using heuristic fallback")

    total_processed = 0
    while True:
        count = process_batch(args.batch_size)
        if count == 0:
            break
        total_processed += count
        logger.info("Progress: %d spots processed so far", total_processed)

    logger.info("AI inference worker finished. Total processed: %d", total_processed)


if __name__ == "__main__":
    main()
