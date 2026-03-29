"""Context scoring worker: evaluates spatial surroundings of each spot.

Queries PostGIS for road noise, urban density, scenic value, privacy,
industrial proximity, railway noise, and van community signals.
Produces a context_score (0-100) and context_details JSONB breakdown.

Pipeline stage: ai_done → context_done

Usage:
    python context_scoring.py --batch-size 100
"""

import argparse
import json
from typing import Any, Dict, List, Tuple

from utils import get_db_connection, setup_logging

logger = setup_logging("context_scoring")

# All distances are in meters. OSM data is in SRID 3857 (meters),
# spots.geom is SRID 4326, so we ST_Transform spots to 3857 for distance calcs.

# ---------------------------------------------------------------------------
# Road noise scoring
# ---------------------------------------------------------------------------
# highway class → (search_radius_m, penalty_at_0m, decay_start_m)
ROAD_NOISE_CONFIG: Dict[str, Tuple[int, int, int]] = {
    "motorway": (500, -40, 200),
    "motorway_link": (400, -30, 150),
    "trunk": (400, -30, 150),
    "trunk_link": (300, -25, 120),
    "primary": (300, -20, 100),
    "primary_link": (250, -18, 80),
    "secondary": (200, -10, 80),
    "secondary_link": (150, -8, 60),
    "tertiary": (100, -5, 50),
}

ROAD_NOISE_SQL = """
    SELECT
        l.highway,
        ST_Distance(l.way, ST_Transform(s.geom, 3857)) AS dist_m
    FROM planet_osm_line l, spots s
    WHERE s.id = %s
      AND l.highway IN (
          'motorway', 'motorway_link', 'trunk', 'trunk_link',
          'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary'
      )
      AND ST_DWithin(l.way, ST_Transform(s.geom, 3857), 500)
    ORDER BY ST_Distance(l.way, ST_Transform(s.geom, 3857))
    LIMIT 5
"""


def calc_road_noise(rows: List[Tuple[str, float]]) -> Dict[str, Any]:
    """Calculate road noise penalty from nearby road query results."""
    if not rows:
        return {"score": 0, "nearest_road": None, "distance_m": None}

    worst_penalty = 0.0
    nearest_road = None
    nearest_dist = None

    for highway, dist_m in rows:
        cfg = ROAD_NOISE_CONFIG.get(highway)
        if not cfg:
            continue
        _radius, penalty_at_0, decay_start = cfg

        if nearest_dist is None or dist_m < nearest_dist:
            nearest_dist = dist_m
            nearest_road = highway

        # Linear decay: full penalty at 0m, zero at search_radius
        if dist_m <= decay_start:
            penalty = penalty_at_0
        else:
            ratio = (dist_m - decay_start) / (_radius - decay_start)
            penalty = penalty_at_0 * max(0.0, 1.0 - ratio)

        worst_penalty = min(worst_penalty, penalty)

    return {
        "score": round(worst_penalty, 1),
        "nearest_road": nearest_road,
        "distance_m": round(nearest_dist, 0) if nearest_dist else None,
    }


# ---------------------------------------------------------------------------
# Urban density scoring
# ---------------------------------------------------------------------------
URBAN_DENSITY_SQL = """
    SELECT COUNT(*) AS building_count
    FROM planet_osm_polygon p, spots s
    WHERE s.id = %s
      AND p.building IS NOT NULL
      AND ST_DWithin(p.way, ST_Transform(s.geom, 3857), 300)
"""


def calc_urban_density(building_count: int) -> Dict[str, Any]:
    """Score based on building density within 300m."""
    if building_count == 0:
        score = 20.0
    elif building_count <= 5:
        score = 0.0
    elif building_count <= 20:
        score = -10.0
    else:
        score = -25.0

    return {"score": score, "building_count": building_count, "radius_m": 300}


# ---------------------------------------------------------------------------
# Scenic value scoring
# ---------------------------------------------------------------------------
SCENIC_SQL = """
    WITH spot AS (
        SELECT ST_Transform(geom, 3857) AS way3857 FROM spots WHERE id = %s
    )
    SELECT 'beach' AS feature, ST_Distance(p.way, spot.way3857) AS dist_m
    FROM planet_osm_polygon p, spot
    WHERE p."natural" IN ('beach', 'sand')
      AND ST_DWithin(p.way, spot.way3857, 1000)
    UNION ALL
    SELECT 'beach_point', ST_Distance(pt.way, spot.way3857)
    FROM planet_osm_point pt, spot
    WHERE pt."natural" IN ('beach', 'sand')
      AND ST_DWithin(pt.way, spot.way3857, 1000)
    UNION ALL
    SELECT 'viewpoint', ST_Distance(pt.way, spot.way3857)
    FROM planet_osm_point pt, spot
    WHERE pt.tourism = 'viewpoint'
      AND ST_DWithin(pt.way, spot.way3857, 2000)
    UNION ALL
    SELECT 'water', ST_Distance(p.way, spot.way3857)
    FROM planet_osm_polygon p, spot
    WHERE (p."natural" IN ('water', 'coastline') OR p.water IS NOT NULL)
      AND ST_DWithin(p.way, spot.way3857, 1000)
    UNION ALL
    SELECT 'river', ST_Distance(l.way, spot.way3857)
    FROM planet_osm_line l, spot
    WHERE l.waterway IN ('river', 'stream')
      AND ST_DWithin(l.way, spot.way3857, 1000)
    UNION ALL
    SELECT 'peak', ST_Distance(pt.way, spot.way3857)
    FROM planet_osm_point pt, spot
    WHERE pt."natural" = 'peak'
      AND ST_DWithin(pt.way, spot.way3857, 3000)
    UNION ALL
    SELECT 'cliff', ST_Distance(pt.way, spot.way3857)
    FROM planet_osm_point pt, spot
    WHERE pt."natural" = 'cliff'
      AND ST_DWithin(pt.way, spot.way3857, 1000)
    ORDER BY dist_m
"""

# feature → (max_distance_m, max_bonus)
SCENIC_BONUSES: Dict[str, Tuple[float, float]] = {
    "beach": (1000, 25),
    "beach_point": (1000, 25),
    "viewpoint": (2000, 15),
    "water": (1000, 10),
    "river": (1000, 8),
    "peak": (3000, 10),
    "cliff": (1000, 8),
}


def calc_scenic_value(rows: List[Tuple[str, float]]) -> Dict[str, Any]:
    """Score scenic value from nearby natural features."""
    total_bonus = 0.0
    features_found: List[str] = []
    seen_types: set[str] = set()

    for feature, dist_m in rows:
        # Normalize beach types
        feat_key = "beach" if feature == "beach_point" else feature
        if feat_key in seen_types:
            continue

        cfg = SCENIC_BONUSES.get(feature)
        if not cfg:
            continue

        max_dist, max_bonus = cfg
        if dist_m <= max_dist:
            # Closer = higher bonus (linear)
            ratio = 1.0 - (dist_m / max_dist)
            bonus = max_bonus * max(0.0, ratio)
            total_bonus += bonus
            features_found.append(f"{feat_key}_nearby")
            seen_types.add(feat_key)

    # Cap total scenic bonus at 35
    total_bonus = min(35.0, total_bonus)

    return {"score": round(total_bonus, 1), "features": features_found}


# ---------------------------------------------------------------------------
# Privacy scoring
# ---------------------------------------------------------------------------
PRIVACY_SQL = """
    WITH spot AS (
        SELECT ST_Transform(geom, 3857) AS way3857, spot_type
        FROM spots WHERE id = %s
    )
    SELECT
        spot.spot_type,
        (
            SELECT ST_Distance(pt.way, spot.way3857)
            FROM planet_osm_point pt
            WHERE pt.place IN ('city', 'town', 'village', 'hamlet', 'suburb')
              AND ST_DWithin(pt.way, spot.way3857, 5000)
            ORDER BY ST_Distance(pt.way, spot.way3857)
            LIMIT 1
        ) AS nearest_place_dist,
        (
            SELECT pt.place
            FROM planet_osm_point pt
            WHERE pt.place IN ('city', 'town', 'village', 'hamlet', 'suburb')
              AND ST_DWithin(pt.way, spot.way3857, 5000)
            ORDER BY ST_Distance(pt.way, spot.way3857)
            LIMIT 1
        ) AS nearest_place_type
    FROM spot
"""


def calc_privacy(
    spot_type: str,
    nearest_place_dist: float | None,
    nearest_place_type: str | None,
) -> Dict[str, Any]:
    """Score privacy based on spot type and distance from populated places."""
    score = 0.0

    # Dead-end bonus
    is_dead_end = spot_type == "dead_end"
    if is_dead_end:
        score += 15.0
    elif spot_type == "clearing":
        score += 5.0

    # Place proximity penalty
    if nearest_place_dist is not None:
        if nearest_place_type in ("city", "town"):
            if nearest_place_dist < 1000:
                score -= 15.0
            elif nearest_place_dist < 3000:
                score -= 8.0
        elif nearest_place_type in ("village", "suburb"):
            if nearest_place_dist < 500:
                score -= 10.0
            elif nearest_place_dist < 1500:
                score -= 3.0
        # Hamlet nearby is fine — rural area signal

    return {
        "score": round(score, 1),
        "is_dead_end": is_dead_end,
        "nearest_place": nearest_place_type,
        "place_distance_m": round(nearest_place_dist, 0) if nearest_place_dist else None,
    }


# ---------------------------------------------------------------------------
# Industrial/commercial penalty
# ---------------------------------------------------------------------------
INDUSTRIAL_SQL = """
    SELECT COUNT(*) > 0 AS nearby
    FROM planet_osm_polygon p, spots s
    WHERE s.id = %s
      AND p.landuse IN ('industrial', 'commercial', 'retail', 'quarry')
      AND ST_DWithin(p.way, ST_Transform(s.geom, 3857), 500)
"""


def calc_industrial(nearby: bool) -> Dict[str, Any]:
    """Penalize spots near industrial/commercial zones."""
    return {"score": -20.0 if nearby else 0.0, "nearby": nearby}


# ---------------------------------------------------------------------------
# Railway noise
# ---------------------------------------------------------------------------
RAILWAY_SQL = """
    SELECT ST_Distance(l.way, ST_Transform(s.geom, 3857)) AS dist_m
    FROM planet_osm_line l, spots s
    WHERE s.id = %s
      AND l.railway = 'rail'
      AND ST_DWithin(l.way, ST_Transform(s.geom, 3857), 500)
    ORDER BY dist_m
    LIMIT 1
"""


def calc_railway(dist_m: float | None) -> Dict[str, Any]:
    """Penalize spots near active railway lines."""
    if dist_m is None:
        return {"score": 0.0, "distance_m": None}

    if dist_m < 150:
        score = -15.0
    elif dist_m < 500:
        score = -5.0
    else:
        score = 0.0

    return {"score": score, "distance_m": round(dist_m, 0)}


# ---------------------------------------------------------------------------
# Van community signal
# ---------------------------------------------------------------------------
VAN_COMMUNITY_SQL = """
    WITH spot AS (
        SELECT ST_Transform(geom, 3857) AS way3857 FROM spots WHERE id = %s
    )
    SELECT COUNT(*) AS nearby_sites
    FROM planet_osm_point pt, spot
    WHERE (
        pt.tourism IN ('caravan_site', 'camp_site')
        OR (pt.amenity = 'parking' AND pt.tags->'parking' = 'caravan')
    )
    AND ST_DWithin(pt.way, spot.way3857, 5000)
"""


def calc_van_community(nearby_sites: int) -> Dict[str, Any]:
    """Bonus for being near existing caravan/camping infrastructure."""
    score = min(10.0, nearby_sites * 5.0) if nearby_sites > 0 else 0.0
    return {"score": score, "caravan_sites_5km": nearby_sites}


# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------

BASE_CONTEXT_SCORE = 50.0


def score_spot(conn: Any, spot_id: str) -> Tuple[float, Dict[str, Any]]:
    """Compute the full context score for a single spot.

    Returns (context_score, context_details).
    """
    details: Dict[str, Any] = {}

    with conn.cursor() as cur:
        # Road noise
        cur.execute(ROAD_NOISE_SQL, (spot_id,))
        road_rows = cur.fetchall()
        details["road_noise"] = calc_road_noise(road_rows)

        # Urban density
        cur.execute(URBAN_DENSITY_SQL, (spot_id,))
        building_count = cur.fetchone()[0]
        details["urban_density"] = calc_urban_density(building_count)

        # Scenic value
        cur.execute(SCENIC_SQL, (spot_id,))
        scenic_rows = cur.fetchall()
        details["scenic_value"] = calc_scenic_value(scenic_rows)

        # Privacy
        cur.execute(PRIVACY_SQL, (spot_id,))
        row = cur.fetchone()
        if row:
            spot_type, place_dist, place_type = row
            details["privacy"] = calc_privacy(spot_type, place_dist, place_type)
        else:
            details["privacy"] = {"score": 0, "is_dead_end": False, "nearest_place": None, "place_distance_m": None}

        # Industrial
        cur.execute(INDUSTRIAL_SQL, (spot_id,))
        is_industrial = cur.fetchone()[0]
        details["industrial"] = calc_industrial(is_industrial)

        # Railway
        cur.execute(RAILWAY_SQL, (spot_id,))
        rail_row = cur.fetchone()
        details["railway"] = calc_railway(rail_row[0] if rail_row else None)

        # Van community
        cur.execute(VAN_COMMUNITY_SQL, (spot_id,))
        van_count = cur.fetchone()[0]
        details["van_community"] = calc_van_community(van_count)

    # Sum all sub-scores
    total_adjustment = sum(d["score"] for d in details.values())
    context_score = max(0.0, min(100.0, BASE_CONTEXT_SCORE + total_adjustment))

    return round(context_score, 1), details


# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------


def process_batch(batch_size: int = 100) -> int:
    """Fetch and context-score a batch of ai_done spots. Returns count processed."""
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id
                FROM spots
                WHERE status = 'ai_done'
                ORDER BY created_at
                LIMIT %s
                """,
                (batch_size,),
            )
            rows = cur.fetchall()

        if not rows:
            logger.info("No ai_done spots to context-score")
            return 0

        logger.info("Context-scoring %d spots", len(rows))

        for spot_id, osm_id in rows:
            try:
                context_score, context_details = score_spot(conn, spot_id)

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET context_score = %s,
                            context_details = %s,
                            status = 'context_done',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (context_score, json.dumps(context_details), spot_id),
                    )
                conn.commit()

                logger.info(
                    "Context score for spot %s (osm_id=%s): %.1f "
                    "(road=%.0f urban=%.0f scenic=%.0f priv=%.0f ind=%.0f rail=%.0f van=%.0f)",
                    spot_id, osm_id, context_score,
                    context_details["road_noise"]["score"],
                    context_details["urban_density"]["score"],
                    context_details["scenic_value"]["score"],
                    context_details["privacy"]["score"],
                    context_details["industrial"]["score"],
                    context_details["railway"]["score"],
                    context_details["van_community"]["score"],
                )
                processed += 1

            except Exception:
                conn.rollback()
                logger.exception(
                    "Error context-scoring spot %s (osm_id=%s)", spot_id, osm_id
                )

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter context scoring worker")
    parser.add_argument(
        "--batch-size", type=int, default=100, help="Spots per batch (default: 100)"
    )
    args = parser.parse_args()

    logger.info("Starting context scoring worker (batch_size=%d)", args.batch_size)

    total_processed = 0
    while True:
        count = process_batch(args.batch_size)
        if count == 0:
            break
        total_processed += count
        logger.info("Progress: %d spots context-scored so far", total_processed)

    logger.info("Context scoring worker finished. Total: %d", total_processed)


if __name__ == "__main__":
    main()
