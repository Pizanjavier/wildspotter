"""Scoring worker (V4): vision-primary composite score.

Reads spots with status = 'landcover_done', applies the V4 formula (SPEC_V3 §12),
persists composite_score plus wild_bonus_raw / wild_bonus_gated / landcover_penalty /
qualifying_paths / ai_gate / onspot_quarry in context_details JSONB, then sets
status = 'completed'.

Pipeline stage: landcover_done → completed

Usage:
    python scoring.py --batch-size 50
"""

import argparse
import json
from typing import Any, Dict

import scoring_v3
from utils import get_db_connection, setup_logging

logger = setup_logging("scoring")


def _score_one(conn: Any, spot: Dict[str, Any]) -> Dict[str, Any]:
    """Compute V4 composite for a single spot row. Returns dict for UPDATE."""
    geom_hex = bytes(spot["wkb"]).hex()
    signals = scoring_v3.query_signals(conn, geom_hex)

    van_presence = float((spot["ai_details"] or {}).get("van_presence") or 0)

    wild_bonus_raw, paths = scoring_v3.compute_wild_bonus_v4(
        coastal_dist_m=signals["coastal_dist"],
        viewpoint_dist_m=signals["viewpoint_dist"],
        water_feature_dist_m=signals["water_feature_dist"],
        water_polygon_area_m2=signals["water_polygon_area"],
        elevation=spot["elevation"],
        spot_type=spot["spot_type"],
        landcover_class=spot["landcover_class"],
        natural_fraction_500m=signals["natural_fraction"],
        vision_van_presence=van_presence,
    )

    penalty = scoring_v3.compute_landcover_penalty_v31(
        landcover_class=spot["landcover_class"],
        siose_dominant=spot["siose_dominant"],
        onspot_quarry=bool(signals.get("onspot_quarry")),
        building_dist_m=signals["building_dist"],
        industrial_dist_m=signals["industrial_dist"],
        parking_dist_m=signals["parking_dist"],
        place_dist_m=signals["place_dist"],
        village_dist_m=signals["village_dist"],
        aeroway_dist_m=signals["aeroway_dist"],
    )

    composite, wild_bonus_gated = scoring_v3.compute_composite_v4(
        terrain_score=spot["terrain_score"] or 0.0,
        ai_score=spot["ai_score"] or 0.0,
        context_score=spot["context_score"] or 50.0,
        wild_bonus_raw=wild_bonus_raw,
        wild_paths=paths,
        landcover_penalty=penalty,
        ai_details=spot["ai_details"],
    )

    ai_gate = scoring_v3.compute_ai_gate_v4(spot["ai_details"])

    details = dict(spot["context_details"] or {})
    details["wild_bonus_raw"] = round(wild_bonus_raw, 1)
    details["wild_bonus"] = round(wild_bonus_gated, 1)
    details["landcover_penalty"] = round(penalty, 1)
    details["wild_paths"] = paths
    details["ai_gate"] = round(ai_gate, 2)
    details["onspot_quarry"] = bool(signals.get("onspot_quarry"))

    return {"composite": composite, "details": details}


def process_batch(batch_size: int = 50) -> int:
    """Score a batch of landcover_done spots. Returns count processed."""
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, ST_AsEWKB(geom) AS wkb,
                       terrain_score, ai_score, context_score,
                       ai_details, context_details, legal_status,
                       elevation, spot_type, landcover_class, siose_dominant
                FROM spots
                WHERE status = 'landcover_done'
                  AND terrain_score IS NOT NULL
                  AND ai_score IS NOT NULL
                  AND context_score IS NOT NULL
                ORDER BY created_at
                LIMIT %s
                """,
                (batch_size,),
            )
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]

        if not rows:
            logger.info("No landcover_done spots ready for V3.1 scoring")
            return 0

        logger.info("V3.1-scoring %d spots", len(rows))

        for spot in rows:
            try:
                result = _score_one(conn, spot)
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET composite_score = %s,
                            context_details = %s,
                            status = 'completed',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (result["composite"], json.dumps(result["details"]), spot["id"]),
                    )
                conn.commit()

                logger.info(
                    "Spot %s (osm_id=%s): base(t=%.1f, a=%.1f, c=%.1f) "
                    "wild_raw=+%.1f gate=%.2f -> +%.1f%s pen=-%.1f -> %.1f",
                    spot["id"], spot["osm_id"],
                    spot["terrain_score"] or 0.0, spot["ai_score"] or 0.0,
                    spot["context_score"] or 0.0,
                    result["details"]["wild_bonus_raw"],
                    result["details"]["ai_gate"],
                    result["details"]["wild_bonus"],
                    f" ({','.join(result['details']['wild_paths'])})" if result["details"]["wild_paths"] else "",
                    result["details"]["landcover_penalty"],
                    result["composite"],
                )
                processed += 1

            except Exception:
                conn.rollback()
                logger.exception("Error scoring spot %s (osm_id=%s)", spot.get("id"), spot.get("osm_id"))

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter V4 scoring worker")
    parser.add_argument("--batch-size", type=int, default=50, help="Spots per batch")
    args = parser.parse_args()

    logger.info("Starting V4 scoring worker (batch_size=%d)", args.batch_size)
    logger.info(
        "Base weights: terrain=%.0f%%, ai=%.0f%%, context=%.0f%% + ai_gated(wild_bonus) - landcover_penalty "
        "(adj ±%.0f, strong uncapped, weak≤%.0f, none≤%.0f)",
        scoring_v3.BASE_TERRAIN_W_V4 * 100, scoring_v3.BASE_AI_W_V4 * 100,
        scoring_v3.BASE_CONTEXT_W_V4 * 100, scoring_v3.ADJUSTMENT_CAP_V4,
        scoring_v3.WEAK_ARCHETYPE_CAP_V4, scoring_v3.NO_ARCHETYPE_CAP_V4,
    )

    total = 0
    while True:
        count = process_batch(args.batch_size)
        if count == 0:
            break
        total += count
        logger.info("Progress: %d spots scored so far", total)

    logger.info("V4 scoring worker finished. Total: %d", total)


if __name__ == "__main__":
    main()
