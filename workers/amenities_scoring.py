"""Amenities scoring worker: evaluates nearby drinking water and dog friendly places.

Queries PostGIS for drinking water and dog-friendly spots within 1km and 2km.
Updates context_score and appends to context_details JSONB breakdown.

Pipeline stage: context_done → amenities_done

Usage:
    python amenities_scoring.py --batch-size 500
"""

import argparse
import json
from typing import Any, Dict, List, Tuple

from utils import get_db_connection, setup_logging

logger = setup_logging("amenities_scoring")

# ---------------------------------------------------------------------------
# Drinking Water scoring
# ---------------------------------------------------------------------------
DRINKING_WATER_SQL = """
    SELECT ST_Distance(pt.way, ST_Transform(s.geom, 3857)) AS dist_m
    FROM planet_osm_point pt, spots s
    WHERE s.id = %s
      AND (pt.amenity = 'drinking_water' OR pt.man_made = 'water_tap')
      AND ST_DWithin(pt.way, ST_Transform(s.geom, 3857), 1000)
    ORDER BY dist_m
    LIMIT 1
"""

def calc_drinking_water(dist_m: float | None) -> Dict[str, Any]:
    """Score drinking water proximity within 1000m. Max bonus +10."""
    if dist_m is None:
        return {"score": 0.0, "distance_m": None}

    # Linear decay: max at 0m, 0 at 1000m
    max_dist = 1000.0
    max_bonus = 10.0
    dist_m = float(dist_m)
    ratio = 1.0 - (dist_m / max_dist)
    score = max_bonus * max(0.0, ratio)
    
    return {"score": round(float(score), 1), "distance_m": int(round(float(dist_m)))}

# ---------------------------------------------------------------------------
# Dog Friendly scoring
# ---------------------------------------------------------------------------
# We check dog=yes or dog=leashed on points, lines, and polygons, plus dog parks.
DOG_FRIENDLY_SQL = """
    WITH spot AS (
        SELECT ST_Transform(geom, 3857) AS way3857 FROM spots WHERE id = %s
    )
    SELECT 'dog_friendly' AS feature, ST_Distance(p.way, spot.way3857) AS dist_m
    FROM planet_osm_polygon p, spot
    WHERE (p.leisure = 'dog_park' OR p.tags->'dog' IN ('yes', 'leashed'))
      AND ST_DWithin(p.way, spot.way3857, 2000)
    UNION ALL
    SELECT 'dog_friendly', ST_Distance(pt.way, spot.way3857)
    FROM planet_osm_point pt, spot
    WHERE (pt.leisure = 'dog_park' OR pt.tags->'dog' IN ('yes', 'leashed'))
      AND ST_DWithin(pt.way, spot.way3857, 2000)
    UNION ALL
    SELECT 'dog_friendly', ST_Distance(l.way, spot.way3857)
    FROM planet_osm_line l, spot
    WHERE l.tags->'dog' IN ('yes', 'leashed')
      AND ST_DWithin(l.way, spot.way3857, 2000)
    ORDER BY dist_m
    LIMIT 1
"""

def calc_dog_friendly(dist_m: float | None) -> Dict[str, Any]:
    """Score dog friendly proximity within 2000m. Max bonus +15."""
    if dist_m is None:
        return {"score": 0.0, "distance_m": None}

    # Linear decay: max at 0m, 0 at 2000m
    max_dist = 2000.0
    max_bonus = 15.0
    dist_m = float(dist_m)
    ratio = 1.0 - (dist_m / max_dist)
    score = max_bonus * max(0.0, ratio)
    
    return {"score": round(float(score), 1), "distance_m": int(round(float(dist_m)))}

# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------
def score_amenities(conn: Any, spot_id: str, current_details: Dict[str, Any], current_score: float) -> Tuple[float, Dict[str, Any]]:
    """Compute the amenities additions for a single spot."""
    with conn.cursor() as cur:
        # Drinking water
        cur.execute(DRINKING_WATER_SQL, (spot_id,))
        water_row = cur.fetchone()
        water_res = calc_drinking_water(water_row[0] if water_row else None)
        current_details["drinking_water"] = water_res

        # Dog Friendly
        cur.execute(DOG_FRIENDLY_SQL, (spot_id,))
        dog_row = cur.fetchone()
        dog_res = calc_dog_friendly(dog_row[1] if dog_row else None)
        current_details["dog_friendly"] = dog_res

    # Calculate total new score
    total_adjustment = sum(d["score"] for d in current_details.values() if isinstance(d, dict) and "score" in d)
    # the original context scoring uses BASE_CONTEXT_SCORE (50.0).
    BASE_CONTEXT_SCORE = 50.0
    new_context_score = max(0.0, min(100.0, BASE_CONTEXT_SCORE + total_adjustment))

    return round(float(new_context_score), 1), current_details

# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------
def process_batch(batch_size: int = 500) -> int:
    """Fetch and score a batch of context_done spots. Returns count processed."""
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, context_score, context_details
                FROM spots
                WHERE status = 'context_done'
                  AND context_details IS NOT NULL
                ORDER BY created_at
                LIMIT %s
                """,
                (batch_size,),
            )
            rows = cur.fetchall()

        if not rows:
            logger.info("No context_done spots to process for amenities")
            return 0

        logger.info("Amenities-scoring %d spots", len(rows))

        for spot_id, osm_id, context_score, context_details in rows:
            try:
                new_score, new_details = score_amenities(conn, spot_id, context_details, context_score)

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET context_score = %s,
                            context_details = %s,
                            status = 'amenities_done',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (new_score, json.dumps(new_details), spot_id),
                    )
                conn.commit()

                logger.info(
                    "Amenities for spot %s (osm_id=%s): Water=%.1f Dog=%.1f -> New Context=%.1f",
                    spot_id, osm_id,
                    new_details["drinking_water"]["score"],
                    new_details["dog_friendly"]["score"],
                    new_score
                )
                processed = processed + 1

            except Exception:
                conn.rollback()
                logger.exception("Error processing amenities for spot %s (osm_id=%s)", spot_id, osm_id)

    finally:
        conn.close()

    return processed

def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter amenities worker")
    parser.add_argument("--batch-size", type=int, default=500, help="Spots per batch")
    args = parser.parse_args()

    logger.info("Starting amenities worker (batch_size=%d)", args.batch_size)

    total_processed = 0
    while True:
        count = process_batch(args.batch_size)
        if count == 0:
            break
        total_processed += count
        logger.info("Progress: %d spots processed for amenities so far", total_processed)

    logger.info("Amenities worker finished. Total: %d", total_processed)

if __name__ == "__main__":
    main()
