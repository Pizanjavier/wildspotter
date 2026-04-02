"""Scoring worker: computes the composite score for fully evaluated spots.

Combines terrain_score (20%), ai_score (25%), and context_score (55%)
into a final composite_score and marks spots as completed.

Pipeline stage: amenities_done → completed

Usage:
    python scoring.py --batch-size 50
"""

import argparse
from typing import List, Tuple

from utils import get_db_connection, setup_logging

logger = setup_logging("scoring")

TERRAIN_WEIGHT = 0.20
AI_WEIGHT = 0.25
CONTEXT_WEIGHT = 0.55


def compute_composite_score(
    terrain_score: float, ai_score: float, context_score: float
) -> float:
    """Calculate the weighted composite score (0-100)."""
    score = (
        terrain_score * TERRAIN_WEIGHT
        + ai_score * AI_WEIGHT
        + context_score * CONTEXT_WEIGHT
    )
    return round(max(0.0, min(100.0, score)), 1)


def process_batch(batch_size: int = 50) -> int:
    """Fetch and score a batch of amenities_done spots. Returns count processed."""
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, terrain_score, ai_score, context_score
                FROM spots
                WHERE status = 'amenities_done'
                  AND terrain_score IS NOT NULL
                  AND ai_score IS NOT NULL
                  AND context_score IS NOT NULL
                ORDER BY created_at
                LIMIT %s
                """,
                (batch_size,),
            )
            rows: List[Tuple[str, int, float, float, float]] = cur.fetchall()

        if not rows:
            logger.info("No amenities_done spots ready for final scoring")
            return 0

        logger.info("Scoring %d spots", len(rows))

        for spot_id, osm_id, terrain_score, ai_score, context_score in rows:
            try:
                composite = compute_composite_score(
                    terrain_score, ai_score, context_score
                )

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET composite_score = %s,
                            status = 'completed',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (composite, spot_id),
                    )
                conn.commit()

                logger.info(
                    "Scored spot %s (osm_id=%s): "
                    "terrain=%.1f, ai=%.1f, context=%.1f → composite=%.1f",
                    spot_id, osm_id, terrain_score, ai_score,
                    context_score, composite,
                )
                processed += 1

            except Exception:
                conn.rollback()
                logger.exception(
                    "Error scoring spot %s (osm_id=%s)", spot_id, osm_id
                )

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter scoring worker")
    parser.add_argument(
        "--batch-size", type=int, default=50, help="Spots per batch (default: 50)"
    )
    args = parser.parse_args()

    logger.info("Starting scoring worker (batch_size=%d)", args.batch_size)
    logger.info(
        "Weights: terrain=%.0f%%, ai=%.0f%%, context=%.0f%%",
        TERRAIN_WEIGHT * 100,
        AI_WEIGHT * 100,
        CONTEXT_WEIGHT * 100,
    )

    total_processed = 0
    while True:
        count = process_batch(args.batch_size)
        if count == 0:
            break
        total_processed += count
        logger.info("Progress: %d spots scored so far", total_processed)

    logger.info("Scoring worker finished. Total scored: %d", total_processed)


if __name__ == "__main__":
    main()
