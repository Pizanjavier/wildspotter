"""AI Vision Labeler: rich satellite analysis using Claude Haiku Vision.

Replaces the binary MobileNetV2 classifier with multi-factor visual analysis.
For each satellite tile, Claude evaluates 5 sub-scores (0-10) that capture
whether a location is actually suitable for overnight van parking — not just
whether the ground is brown.

Operates on spots that already have satellite tiles downloaded (status >= ai_done).
Stores results in ai_score + ai_details JSONB. Does NOT change pipeline status.

Usage:
    python ai_vision_labeler.py --batch-size 20
    python ai_vision_labeler.py --batch-size 5 --dry-run
"""

import argparse
import base64
import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

from utils import get_db_connection, setup_logging

logger = setup_logging("ai_vision_labeler")

SATELLITE_TILE_DIR = "/data/satellite_tiles"
API_DELAY_SECONDS = 1.0
MODEL = "claude-haiku-4-5-20251001"

# Sub-score weights for computing the final ai_score
WEIGHTS: Dict[str, float] = {
    "surface_quality": 0.30,
    "vehicle_access": 0.20,
    "open_space": 0.20,
    "van_presence": 0.15,
    "obstruction_absence": 0.15,
}

EXPECTED_KEYS = set(WEIGHTS.keys())

ANALYSIS_PROMPT = (
    "Analyze this satellite image of a potential overnight van/camper parking "
    "location in Spain. Score each factor 0-10:\n\n"
    "1. surface_quality: Flat, open mineral/dirt/gravel ground suitable for "
    "parking (not dense vegetation, water, or buildings)\n"
    "2. vehicle_access: Area appears accessible by vehicle (visible tracks, "
    "roads, or clearings leading in)\n"
    "3. open_space: Enough open space for 1-3 vehicles to park comfortably\n"
    "4. van_presence: Vans, campers, or RVs visible in the image (strong "
    "positive signal — score 0 if none visible, that is fine)\n"
    "5. obstruction_absence: Free of dense trees, buildings, walls, fences, "
    "or other obstacles blocking the area\n\n"
    "Respond ONLY with JSON, no explanation: "
    '{"surface_quality":N,"vehicle_access":N,"open_space":N,'
    '"van_presence":N,"obstruction_absence":N}'
)


def encode_image_base64(image_path: str) -> Optional[str]:
    """Read and base64-encode a JPEG satellite tile."""
    try:
        with open(image_path, "rb") as f:
            return base64.standard_b64encode(f.read()).decode("utf-8")
    except Exception:
        logger.exception("Failed to read image %s", image_path)
        return None


def parse_response(text: str) -> Optional[Dict[str, int]]:
    """Parse Claude's JSON response, stripping markdown fences if present.

    Returns a dict with all 5 sub-scores (int 0-10) or None on failure.
    """
    cleaned = text.strip()

    # Strip markdown code fences: ```json ... ``` or ``` ... ```
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1)
    else:
        # Try to extract raw JSON object
        brace_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if brace_match:
            cleaned = brace_match.group(0)

    try:
        data = json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Failed to parse JSON from response: %s", text[:200])
        return None

    if not isinstance(data, dict):
        return None

    # Validate all expected keys exist and are numeric 0-10
    result: Dict[str, int] = {}
    for key in EXPECTED_KEYS:
        val = data.get(key)
        if val is None:
            logger.warning("Missing key '%s' in response", key)
            return None
        try:
            num = int(round(float(val)))
        except (TypeError, ValueError):
            logger.warning("Non-numeric value for '%s': %s", key, val)
            return None
        result[key] = max(0, min(10, num))

    return result


def compute_ai_score(details: Dict[str, int]) -> float:
    """Compute weighted ai_score (0-100) from 5 sub-scores (0-10)."""
    weighted_sum = sum(
        details[key] * weight for key, weight in WEIGHTS.items()
    )
    # weighted_sum is 0-10, scale to 0-100
    score = weighted_sum * 10.0
    return round(max(0.0, min(100.0, score)), 1)


def analyze_tile(
    client: Any, image_path: str
) -> Optional[Tuple[float, Dict[str, int]]]:
    """Send a satellite tile to Claude Haiku Vision for multi-factor analysis.

    Returns (ai_score, details_dict) or None on failure.
    """
    image_b64 = encode_image_base64(image_path)
    if image_b64 is None:
        return None

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=200,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": ANALYSIS_PROMPT,
                        },
                    ],
                }
            ],
        )

        text = response.content[0].text
        details = parse_response(text)
        if details is None:
            return None

        score = compute_ai_score(details)
        return score, details

    except Exception:
        logger.exception("Claude API call failed for %s", image_path)
        return None


def process_batch(batch_size: int = 20, dry_run: bool = False) -> int:
    """Fetch and vision-score a batch of spots with satellite tiles.

    Targets spots that have satellite imagery but no ai_details yet.
    Processes highest-composite-score spots first for maximum value.
    Returns count processed.
    """
    import anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY not set — cannot run vision labeler")
        return 0

    client = anthropic.Anthropic(api_key=api_key)
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, satellite_image_path
                FROM spots
                WHERE status IN ('ai_done', 'context_done', 'completed')
                  AND satellite_image_path IS NOT NULL
                  AND ai_details IS NULL
                ORDER BY composite_score DESC NULLS LAST
                LIMIT %s
                """,
                (batch_size,),
            )
            rows: List[Tuple[str, int, str]] = cur.fetchall()

        if not rows:
            logger.info("No spots pending vision analysis")
            return 0

        logger.info(
            "Vision-analyzing %d spots (dry_run=%s)", len(rows), dry_run
        )

        for spot_id, osm_id, rel_path in rows:
            image_path = os.path.join("/data", rel_path)

            if not os.path.exists(image_path):
                logger.warning(
                    "Satellite tile missing for osm_id=%d: %s", osm_id, image_path
                )
                continue

            result = analyze_tile(client, image_path)
            if result is None:
                logger.warning(
                    "Vision analysis failed for osm_id=%d, skipping", osm_id
                )
                time.sleep(API_DELAY_SECONDS)
                continue

            ai_score, details = result

            if dry_run:
                logger.info(
                    "[DRY RUN] osm_id=%d: score=%.1f details=%s",
                    osm_id, ai_score, json.dumps(details),
                )
            else:
                try:
                    with conn.cursor() as cur:
                        # For completed spots, recompute composite_score inline
                        # using the new ai_score so the change is immediately visible.
                        cur.execute(
                            """
                            UPDATE spots
                            SET ai_score = %s,
                                ai_details = %s,
                                composite_score = CASE
                                    WHEN status = 'completed'
                                         AND terrain_score IS NOT NULL
                                         AND context_score IS NOT NULL
                                    THEN ROUND(
                                        (terrain_score * 0.20
                                         + %s * 0.25
                                         + context_score * 0.55)::numeric, 1
                                    )
                                    ELSE composite_score
                                END,
                                updated_at = NOW()
                            WHERE id = %s
                            """,
                            (ai_score, json.dumps(details), ai_score, spot_id),
                        )
                    conn.commit()
                    logger.info(
                        "Vision score for osm_id=%d: %.1f "
                        "(surface=%d access=%d space=%d vans=%d clear=%d)",
                        osm_id, ai_score,
                        details["surface_quality"],
                        details["vehicle_access"],
                        details["open_space"],
                        details["van_presence"],
                        details["obstruction_absence"],
                    )
                except Exception:
                    conn.rollback()
                    logger.exception(
                        "DB update failed for osm_id=%d", osm_id
                    )

            processed += 1
            time.sleep(API_DELAY_SECONDS)

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(
        description="WildSpotter AI Vision Labeler (Claude Haiku)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=20,
        help="Spots per batch (default: 20)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyze but do not update the database",
    )
    args = parser.parse_args()

    logger.info(
        "Starting AI Vision Labeler (model=%s, batch_size=%d, dry_run=%s)",
        MODEL, args.batch_size, args.dry_run,
    )

    total_processed = 0
    while True:
        count = process_batch(
            batch_size=args.batch_size, dry_run=args.dry_run
        )
        if count == 0:
            break
        total_processed += count
        logger.info("Progress: %d spots vision-analyzed so far", total_processed)

    logger.info(
        "AI Vision Labeler finished. Total processed: %d", total_processed
    )


if __name__ == "__main__":
    main()
