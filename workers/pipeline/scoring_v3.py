"""V3 / V3.1 scoring helpers: vision gate, wild bonus, land-cover penalty.

Pure functions live in the upper half (testable without a DB). The lower half
holds the PostGIS queries that gather the per-spot signals consumed by those
functions.

V3 helpers (`compute_wild_bonus`, `compute_landcover_penalty`, `compute_composite`)
are kept for rollback. V3.1 helpers (`*_v31`, `compute_ai_weight`,
`apply_archetype_cap`, `apply_soft_obstruction_cap`, `compute_composite_v31`)
implement SPEC_V3 §10 and are what the production pipeline uses.
"""

from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CORINE_AGRICULTURAL = {"211", "212", "213", "221", "222", "223", "241", "242", "243"}
CORINE_INDUSTRIAL = {"121", "122", "123", "124", "131", "132", "133", "142"}
CORINE_URBAN = {"111", "112"}
CORINE_FOREST_SCRUB = {"311", "312", "313", "322", "323", "324"}
CORINE_FOREST_DENSE = {"311", "312"}

SIOSE_PENALTY_CODES = {"CHL", "OLI", "FRT", "EDF"}

WILD_BONUS_CAP = 40.0  # V3.2: was 65
PENALTY_CAP_V3 = 50.0
PENALTY_CAP_V31 = 60.0
ADJUSTMENT_CAP = 35.0  # V3.2: was 50
ARCHETYPE_CAP = 80.0  # V3.2: was 75
OBSTRUCTION_SOFT_CAP = 70.0

BASE_TERRAIN_W = 0.15
BASE_AI_W = 0.20
BASE_CONTEXT_W = 0.35

# V3.2 — archetype tiers. "Strong" paths are the only ones that allow
# composite > 80; "weak" paths still qualify a spot as wild but cap at 80.
STRONG_ARCHETYPE_PATHS = {
    "coastal",
    "alpine_strong",
    "water_feature_strong",
    "forest_dense_strong",
    "forest_dead_end",
}

# Kept for back-compat / tests that reference the broader "archetype" concept.
ARCHETYPE_PATHS = STRONG_ARCHETYPE_PATHS | {
    "scenic_viewpoint",
    "alpine",
    "water_feature",
    "forest_dense",
}

# ---------------------------------------------------------------------------
# V4 constants (SPEC_V3 §12). Vision-primary scoring.
# ---------------------------------------------------------------------------

BASE_TERRAIN_W_V4 = 0.10
BASE_AI_W_V4 = 0.55
BASE_CONTEXT_W_V4 = 0.15

WILD_BONUS_CAP_V4 = 30.0
ADJUSTMENT_CAP_V4 = 25.0
NO_ARCHETYPE_CAP_V4 = 60.0
WEAK_ARCHETYPE_CAP_V4 = 80.0

# V4 drops forest_dense_strong (CORINE unreliable on dehesa/olive groves).
STRONG_ARCHETYPE_PATHS_V4 = {
    "coastal",
    "alpine_strong",
    "water_feature_strong",
    "forest_dead_end",
}
WEAK_ARCHETYPE_PATHS_V4 = {
    "scenic_viewpoint",
    "alpine",
    "water_feature",
}

# AI-gate thresholds for wild_bonus application (SPEC_V3 §12.2).
AI_GATE_MIN_SURFACE = 6.0
AI_GATE_MIN_OPEN = 6.0
AI_GATE_MIN_OBSTRUCTION = 6.0
AI_GATE_FALLBACK_WEIGHT = 0.5  # MobileNetV2-only spots keep half the bonus.


# ---------------------------------------------------------------------------
# V3 legacy vision gate (kept for rollback — SPEC_V3 §2.2)
# ---------------------------------------------------------------------------

def passes_vision_gate(ai_score: Optional[float], ai_details: Optional[Dict[str, Any]]) -> bool:
    """Hard floor before wild_bonus is applied. SPEC_V3 §2.2 (legacy)."""
    if ai_score is None or ai_details is None:
        return False
    obs = float(ai_details.get("obstruction_absence", 0) or 0)
    surf = float(ai_details.get("surface_quality", 0) or 0)
    return obs >= 8.0 and surf >= 8.0 and float(ai_score) >= 55.0


# ---------------------------------------------------------------------------
# V3.1 AI soft weight (SPEC_V3 §10.1)
# ---------------------------------------------------------------------------

def compute_ai_weight(ai_score: Optional[float]) -> float:
    """Soft weight replacing the hard vision gate. SPEC_V3 §10.1."""
    if ai_score is None:
        return 0.5
    return max(0.5, min(1.0, 0.5 + float(ai_score) / 200.0))


# ---------------------------------------------------------------------------
# V3 legacy wild bonus (SPEC_V3 §2.3 / §2.4) — kept for rollback
# ---------------------------------------------------------------------------

def compute_wild_bonus(
    *,
    coastal_dist_m: Optional[float],
    marina_nearby: bool,
    legal_status: Optional[Dict[str, Any]],
    elevation: Optional[float],
    spot_type: Optional[str],
    landcover_class: Optional[str],
    natural_fraction_500m: Optional[float],
    vision_van_presence: Optional[float],
) -> Tuple[float, List[str]]:
    """Legacy V3 wild bonus. SPEC_V3 §2.3 + §2.4."""
    paths: List[str] = []
    bonus = 0.0

    legal_status = legal_status or {}
    in_national_park = (legal_status.get("national_park") or {}).get("inside") in (True, "true")
    in_natura2000 = (legal_status.get("natura2000") or {}).get("inside") in (True, "true")

    coastal_qualifier = (
        coastal_dist_m is not None
        and coastal_dist_m <= 1500.0
        and not marina_nearby
    )
    if coastal_qualifier:
        paths.append("coastal")
    if in_national_park:
        paths.append("national_park")
    if in_natura2000 and not in_national_park:
        paths.append("natura2000")
    if elevation is not None and elevation >= 1200.0:
        paths.append("alpine")
    if spot_type == "dead_end" and landcover_class in CORINE_FOREST_SCRUB:
        paths.append("forest_dead_end")
    if natural_fraction_500m is not None and natural_fraction_500m >= 0.15:
        paths.append("natural_fraction")

    if not paths:
        return 0.0, []

    if coastal_qualifier:
        bonus += 20.0
    if in_national_park:
        bonus += 25.0
    elif in_natura2000:
        bonus += 15.0

    if elevation is not None:
        if elevation >= 1500.0:
            bonus += 15.0
        elif elevation >= 1000.0:
            bonus += 10.0
        elif elevation >= 600.0:
            bonus += 5.0

    if natural_fraction_500m is not None:
        if natural_fraction_500m >= 0.40:
            bonus += 20.0
        elif natural_fraction_500m >= 0.20:
            bonus += 12.0
        elif natural_fraction_500m >= 0.10:
            bonus += 6.0

    if vision_van_presence is not None:
        if vision_van_presence >= 5.0:
            bonus += 15.0
        elif vision_van_presence >= 2.0:
            bonus += 5.0

    return min(bonus, WILD_BONUS_CAP), paths


# ---------------------------------------------------------------------------
# V3.1 wild bonus (SPEC_V3 §10.2 + §10.3)
# ---------------------------------------------------------------------------

def compute_wild_bonus_v31(
    *,
    coastal_dist_m: Optional[float],
    viewpoint_dist_m: Optional[float],
    water_feature_dist_m: Optional[float],
    water_polygon_area_m2: Optional[float],
    elevation: Optional[float],
    spot_type: Optional[str],
    landcover_class: Optional[str],
    forest_dense_fraction_500m: Optional[float],
    natural_fraction_500m: Optional[float],
    vision_van_presence: Optional[float],
) -> Tuple[float, List[str]]:
    """V3.2 wild bonus. Returns (bonus_raw_value, qualifying_paths).

    Keeps the `_v31` name for back-compat with the scoring worker; values per
    SPEC_V3 §11.2. Legal status is excluded by design (V2/V3 §4, §10.0.4).

    Path taxonomy:
      - strong: coastal, alpine_strong, water_feature_strong,
                forest_dense_strong, forest_dead_end
      - weak:   scenic_viewpoint, alpine, water_feature, forest_dense
    Strong paths unlock composite > 80; weak paths are capped at 80 by
    `apply_archetype_cap`. SPEC_V3 §11.4.
    """
    paths: List[str] = []
    bonus = 0.0

    # Qualifier booleans
    coastal_qualifier = coastal_dist_m is not None and coastal_dist_m <= 1500.0
    viewpoint_300 = viewpoint_dist_m is not None and viewpoint_dist_m <= 300.0
    viewpoint_500 = viewpoint_dist_m is not None and viewpoint_dist_m <= 500.0

    water_dist_ok = water_feature_dist_m is not None and water_feature_dist_m <= 300.0
    water_area = water_polygon_area_m2 or 0.0
    water_strong = (
        water_dist_ok
        and water_feature_dist_m <= 200.0
        and water_area >= 50000.0  # ≥ 5 ha
    )
    water_weak = water_dist_ok and not water_strong

    alpine_strong = elevation is not None and elevation >= 1500.0
    alpine_weak = elevation is not None and 1000.0 <= elevation < 1500.0

    forest_dense_strong = (
        forest_dense_fraction_500m is not None and forest_dense_fraction_500m >= 0.40
    )
    forest_dense_weak = (
        forest_dense_fraction_500m is not None
        and 0.25 <= forest_dense_fraction_500m < 0.40
    )
    forest_dead_end_qualifier = (
        spot_type == "dead_end" and landcover_class in CORINE_FOREST_SCRUB
    )
    natural_fraction_qualifier = (
        natural_fraction_500m is not None and natural_fraction_500m >= 0.25
    )

    if coastal_qualifier:
        paths.append("coastal")
    if viewpoint_500:
        paths.append("scenic_viewpoint")
    if water_strong:
        paths.append("water_feature_strong")
    elif water_weak:
        paths.append("water_feature")
    if alpine_strong:
        paths.append("alpine_strong")
    elif alpine_weak:
        paths.append("alpine")
    if forest_dense_strong:
        paths.append("forest_dense_strong")
    elif forest_dense_weak:
        paths.append("forest_dense")
    if forest_dead_end_qualifier:
        paths.append("forest_dead_end")

    supporting_natural_fraction = natural_fraction_qualifier and bool(paths)
    if supporting_natural_fraction:
        paths.append("natural_fraction")

    if not paths:
        return 0.0, []

    # Bonus stacking (SPEC_V3 §11.2)
    if coastal_qualifier:
        bonus += 25.0
    if viewpoint_300:
        bonus += 20.0
    elif viewpoint_500:
        bonus += 10.0

    if water_strong:
        bonus += 18.0
    elif water_weak:
        bonus += 10.0

    if elevation is not None:
        if elevation >= 1500.0:
            bonus += 15.0
        elif elevation >= 1000.0:
            bonus += 5.0
        elif elevation >= 600.0:
            bonus += 2.0

    if forest_dense_fraction_500m is not None:
        if forest_dense_fraction_500m >= 0.40:
            bonus += 15.0
        elif forest_dense_fraction_500m >= 0.25:
            bonus += 8.0

    if supporting_natural_fraction and natural_fraction_500m is not None:
        if natural_fraction_500m >= 0.40:
            bonus += 6.0
        elif natural_fraction_500m >= 0.25:
            bonus += 3.0

    if vision_van_presence is not None:
        if vision_van_presence >= 5.0:
            bonus += 10.0
        elif vision_van_presence >= 2.0:
            bonus += 3.0

    return min(bonus, WILD_BONUS_CAP), paths


# ---------------------------------------------------------------------------
# V3 legacy land-cover penalty (SPEC_V3 §2.5) — kept for rollback
# ---------------------------------------------------------------------------

def compute_landcover_penalty(
    *,
    landcover_class: Optional[str],
    siose_dominant: Optional[Dict[str, Any]],
    building_dist_m: Optional[float],
    industrial_dist_m: Optional[float],
    parking_dist_m: Optional[float],
    place_dist_m: Optional[float],
    aeroway_dist_m: Optional[float],
) -> float:
    """Legacy V3 penalty. SPEC_V3 §2.5."""
    penalty = 0.0

    if landcover_class in CORINE_INDUSTRIAL:
        penalty += 40.0
    elif landcover_class in CORINE_URBAN:
        penalty += 35.0
    elif landcover_class in CORINE_AGRICULTURAL:
        penalty += 30.0

    if siose_dominant:
        code = (siose_dominant.get("code") or "").upper()
        cover = siose_dominant.get("cover_pct")
        if code in SIOSE_PENALTY_CODES and cover is not None and cover >= 60:
            penalty += 25.0

    if building_dist_m is not None and building_dist_m <= 200.0:
        penalty += 15.0
    if industrial_dist_m is not None and industrial_dist_m <= 600.0:
        penalty += 20.0
    if parking_dist_m is not None and parking_dist_m <= 100.0:
        penalty += 20.0
    if place_dist_m is not None and place_dist_m <= 250.0:
        penalty += 15.0
    if aeroway_dist_m is not None and aeroway_dist_m <= 800.0:
        penalty += 20.0

    return min(penalty, PENALTY_CAP_V3)


# ---------------------------------------------------------------------------
# V3.1 land-cover penalty (SPEC_V3 §10.4)
# ---------------------------------------------------------------------------

def compute_landcover_penalty_v31(
    *,
    landcover_class: Optional[str],
    siose_dominant: Optional[Dict[str, Any]],
    onspot_quarry: bool,
    building_dist_m: Optional[float],
    industrial_dist_m: Optional[float],
    parking_dist_m: Optional[float],
    place_dist_m: Optional[float],
    village_dist_m: Optional[float],
    aeroway_dist_m: Optional[float],
) -> float:
    """V3.1 penalty. Cap 60. Building tiers do not stack (tightest wins).
    SPEC_V3 §10.4.
    """
    penalty = 0.0

    # On-spot quarry / industrial / military is a hard penalty, not proximity.
    if onspot_quarry:
        penalty += 50.0

    if landcover_class in CORINE_INDUSTRIAL:
        penalty += 40.0
    elif landcover_class in CORINE_URBAN:
        penalty += 35.0
    elif landcover_class in CORINE_AGRICULTURAL:
        penalty += 30.0

    if siose_dominant:
        code = (siose_dominant.get("code") or "").upper()
        cover = siose_dominant.get("cover_pct")
        if code in SIOSE_PENALTY_CODES and cover is not None and cover >= 60:
            penalty += 25.0

    # Building tiers — tightest matching distance only, no stacking.
    # V3.2: added 500 m soft tier to catch cortijos/fincas beyond 200 m.
    if building_dist_m is not None:
        if building_dist_m <= 50.0:
            penalty += 40.0
        elif building_dist_m <= 100.0:
            penalty += 25.0
        elif building_dist_m <= 200.0:
            penalty += 15.0
        elif building_dist_m <= 500.0:
            penalty += 8.0

    if industrial_dist_m is not None and industrial_dist_m <= 600.0:
        penalty += 20.0
    if parking_dist_m is not None and parking_dist_m <= 100.0:
        penalty += 20.0
    if place_dist_m is not None and place_dist_m <= 250.0:
        penalty += 15.0
    if village_dist_m is not None and village_dist_m <= 500.0:
        penalty += 20.0
    if aeroway_dist_m is not None and aeroway_dist_m <= 800.0:
        penalty += 20.0

    return min(penalty, PENALTY_CAP_V31)


# ---------------------------------------------------------------------------
# Archetype cap + obstruction soft cap (SPEC_V3 §10.1, §10.5)
# ---------------------------------------------------------------------------

def apply_archetype_cap(composite: float, paths: List[str]) -> float:
    """Cap composite at 80 unless at least one STRONG archetype path matched.
    SPEC_V3 §11.4 (supersedes §10.5). Weak archetypes (viewpoint, alpine 1000-
    1500, water_feature weak, forest_dense weak) let the spot qualify as wild
    but cap composite at 80.
    """
    if any(p in STRONG_ARCHETYPE_PATHS for p in paths):
        return composite
    return min(composite, ARCHETYPE_CAP)


def apply_soft_obstruction_cap(composite: float, ai_details: Optional[Dict[str, Any]]) -> float:
    """Cap composite at 70 if AI sub-scores suggest an obstruction/building.
    SPEC_V3 §10.1 (soft cap replacing the hard vision gate).
    """
    if not ai_details:
        return composite
    obs = ai_details.get("obstruction_absence")
    if obs is None:
        return composite
    try:
        if float(obs) < 5.0:
            return min(composite, OBSTRUCTION_SOFT_CAP)
    except (TypeError, ValueError):
        pass
    return composite


# ---------------------------------------------------------------------------
# V3 legacy composite (SPEC_V3 §2.1) — kept for rollback
# ---------------------------------------------------------------------------

def compute_composite(
    *,
    terrain_score: float,
    ai_score: float,
    context_score: float,
    wild_bonus: float,
    landcover_penalty: float,
) -> float:
    """Legacy V3 composite. SPEC_V3 §2.1."""
    base = terrain_score * BASE_TERRAIN_W + ai_score * BASE_AI_W + context_score * BASE_CONTEXT_W
    adjustment = max(-ADJUSTMENT_CAP, min(ADJUSTMENT_CAP, wild_bonus - landcover_penalty))
    return round(max(0.0, min(100.0, base + adjustment)), 1)


# ---------------------------------------------------------------------------
# V3.1 composite (SPEC_V3 §10.1, §10.5)
# ---------------------------------------------------------------------------

def compute_composite_v31(
    *,
    terrain_score: float,
    ai_score: float,
    context_score: float,
    wild_bonus_raw: float,
    wild_paths: List[str],
    landcover_penalty: float,
    ai_details: Optional[Dict[str, Any]] = None,
) -> Tuple[float, float]:
    """V3.1 composite. Applies AI soft weight, archetype cap, obstruction cap.
    Returns (composite, wild_bonus_weighted).
    SPEC_V3 §10.1 + §10.5.
    """
    ai_weight = compute_ai_weight(ai_score)
    wild_bonus_weighted = wild_bonus_raw * ai_weight
    base = terrain_score * BASE_TERRAIN_W + ai_score * BASE_AI_W + context_score * BASE_CONTEXT_W
    adjustment = max(-ADJUSTMENT_CAP, min(ADJUSTMENT_CAP, wild_bonus_weighted - landcover_penalty))
    raw = max(0.0, min(100.0, base + adjustment))
    raw = apply_archetype_cap(raw, wild_paths)
    raw = apply_soft_obstruction_cap(raw, ai_details)
    return round(raw, 1), round(wild_bonus_weighted, 2)


# ---------------------------------------------------------------------------
# V4 — Vision-primary scoring (SPEC_V3 §12)
# ---------------------------------------------------------------------------

def compute_wild_bonus_v4(
    *,
    coastal_dist_m: Optional[float],
    viewpoint_dist_m: Optional[float],
    water_feature_dist_m: Optional[float],
    water_polygon_area_m2: Optional[float],
    elevation: Optional[float],
    spot_type: Optional[str],
    landcover_class: Optional[str],
    natural_fraction_500m: Optional[float],
    vision_van_presence: Optional[float],
) -> Tuple[float, List[str]]:
    """V4 wild bonus (SPEC_V3 §12.5). CORINE `forest_dense` removed as signal.

    Returns (bonus_raw, paths). Paths taxonomy:
      - strong: coastal, alpine_strong, water_feature_strong, forest_dead_end
      - weak:   scenic_viewpoint, alpine, water_feature
    Bonus gating by AI details happens in `compute_composite_v4`.
    """
    paths: List[str] = []
    bonus = 0.0

    coastal_qualifier = coastal_dist_m is not None and coastal_dist_m <= 1500.0
    viewpoint_qualifier = viewpoint_dist_m is not None and viewpoint_dist_m <= 300.0

    water_area = water_polygon_area_m2 or 0.0
    water_strong = (
        water_feature_dist_m is not None
        and water_feature_dist_m <= 200.0
        and water_area >= 50000.0  # ≥ 5 ha
    )
    water_weak = (
        water_feature_dist_m is not None
        and 200.0 < water_feature_dist_m <= 300.0
        and water_area >= 10000.0  # ≥ 1 ha
    ) or (
        water_feature_dist_m is not None
        and water_feature_dist_m <= 200.0
        and 10000.0 <= water_area < 50000.0
    )

    alpine_strong = elevation is not None and elevation >= 1500.0
    alpine_weak = elevation is not None and 1000.0 <= elevation < 1500.0
    forest_dead_end_qualifier = (
        spot_type == "dead_end" and landcover_class in CORINE_FOREST_SCRUB
    )
    natural_fraction_qualifier = (
        natural_fraction_500m is not None and natural_fraction_500m >= 0.25
    )

    if coastal_qualifier:
        paths.append("coastal")
    if viewpoint_qualifier:
        paths.append("scenic_viewpoint")
    if water_strong:
        paths.append("water_feature_strong")
    elif water_weak:
        paths.append("water_feature")
    if alpine_strong:
        paths.append("alpine_strong")
    elif alpine_weak:
        paths.append("alpine")
    if forest_dead_end_qualifier:
        paths.append("forest_dead_end")

    supporting_natural_fraction = natural_fraction_qualifier and bool(paths)
    if supporting_natural_fraction:
        paths.append("natural_fraction")

    if not paths:
        return 0.0, []

    # Bonus table — SPEC_V3 §12.5
    if coastal_qualifier:
        bonus += 20.0
    if viewpoint_qualifier:
        bonus += 12.0
    if water_strong:
        bonus += 15.0
    elif water_weak:
        bonus += 6.0
    if alpine_strong:
        bonus += 12.0
    elif alpine_weak:
        bonus += 4.0
    if elevation is not None and 600.0 <= elevation < 1000.0:
        bonus += 1.0
    if forest_dead_end_qualifier:
        bonus += 10.0

    if supporting_natural_fraction and natural_fraction_500m is not None:
        if natural_fraction_500m >= 0.40:
            bonus += 3.0
        elif natural_fraction_500m >= 0.25:
            bonus += 1.0

    if vision_van_presence is not None:
        if vision_van_presence >= 5.0:
            bonus += 8.0
        elif vision_van_presence >= 2.0:
            bonus += 2.0

    return min(bonus, WILD_BONUS_CAP_V4), paths


def compute_ai_gate_v4(ai_details: Optional[Dict[str, Any]]) -> float:
    """Return the multiplier applied to wild_bonus_raw. SPEC_V3 §12.2.

    - MobileNetV2-only spots (no ai_details): 0.5 fallback.
    - Vision-labelled spots passing surface/open/obstruction ≥ 6: 1.0.
    - Vision-labelled spots failing the gate: 0.0 (no bonus).
    """
    if not ai_details:
        return AI_GATE_FALLBACK_WEIGHT
    try:
        surf = float(ai_details.get("surface_quality") or 0)
        opens = float(ai_details.get("open_space") or 0)
        obs = float(ai_details.get("obstruction_absence") or 0)
    except (TypeError, ValueError):
        return AI_GATE_FALLBACK_WEIGHT
    if (surf >= AI_GATE_MIN_SURFACE
            and opens >= AI_GATE_MIN_OPEN
            and obs >= AI_GATE_MIN_OBSTRUCTION):
        return 1.0
    return 0.0


def apply_archetype_cap_v4(composite: float, paths: List[str]) -> float:
    """Tri-tier cap (SPEC_V3 §12.4):
      - any strong path  → no cap
      - any weak path    → cap at 80
      - no archetype     → cap at 60
    """
    if any(p in STRONG_ARCHETYPE_PATHS_V4 for p in paths):
        return composite
    if any(p in WEAK_ARCHETYPE_PATHS_V4 for p in paths):
        return min(composite, WEAK_ARCHETYPE_CAP_V4)
    return min(composite, NO_ARCHETYPE_CAP_V4)


def compute_composite_v4(
    *,
    terrain_score: float,
    ai_score: float,
    context_score: float,
    wild_bonus_raw: float,
    wild_paths: List[str],
    landcover_penalty: float,
    ai_details: Optional[Dict[str, Any]] = None,
) -> Tuple[float, float]:
    """V4 composite (SPEC_V3 §12.1). Returns (composite, wild_bonus_gated)."""
    ai_gate = compute_ai_gate_v4(ai_details)
    wild_bonus_gated = wild_bonus_raw * ai_gate
    base = (
        terrain_score * BASE_TERRAIN_W_V4
        + ai_score * BASE_AI_W_V4
        + context_score * BASE_CONTEXT_W_V4
    )
    adjustment = max(
        -ADJUSTMENT_CAP_V4,
        min(ADJUSTMENT_CAP_V4, wild_bonus_gated - landcover_penalty),
    )
    raw = max(0.0, min(100.0, base + adjustment))
    raw = apply_archetype_cap_v4(raw, wild_paths)
    return round(raw, 1), round(wild_bonus_gated, 2)


# ---------------------------------------------------------------------------
# Per-spot signal queries (PostGIS) — V3.1 source of truth
# ---------------------------------------------------------------------------

_SIGNAL_QUERIES: Dict[str, str] = {
    "building_dist": """
        SELECT min(ST_Distance(p.way, ST_Transform(%s::geometry, 3857)))
        FROM planet_osm_polygon p
        WHERE p.building IS NOT NULL
          AND ST_DWithin(p.way, ST_Transform(%s::geometry, 3857), 500)
    """,
    "industrial_dist": """
        SELECT min(ST_Distance(p.way, ST_Transform(%s::geometry, 3857)))
        FROM planet_osm_polygon p
        WHERE p.landuse IN ('industrial', 'quarry', 'military')
          AND ST_DWithin(p.way, ST_Transform(%s::geometry, 3857), 600)
    """,
    "onspot_quarry": """
        SELECT 1
        FROM planet_osm_polygon
        WHERE landuse IN ('industrial', 'quarry', 'military')
          AND ST_Intersects(way, ST_Transform(%s::geometry, 3857))
        LIMIT 1
    """,
    "parking_dist": """
        SELECT min(ST_Distance(p.way, ST_Transform(%s::geometry, 3857)))
        FROM planet_osm_polygon p
        WHERE p.amenity = 'parking'
          AND ST_DWithin(p.way, ST_Transform(%s::geometry, 3857), 100)
    """,
    "place_dist": """
        SELECT min(ST_Distance(pt.way, ST_Transform(%s::geometry, 3857)))
        FROM planet_osm_point pt
        WHERE pt.place IN ('farm', 'hamlet', 'isolated_dwelling')
          AND ST_DWithin(pt.way, ST_Transform(%s::geometry, 3857), 250)
    """,
    "village_dist": """
        SELECT min(d) FROM (
            SELECT ST_Distance(way, ST_Transform(%s::geometry, 3857)) AS d
            FROM planet_osm_point
            WHERE place IN ('village', 'town')
              AND ST_DWithin(way, ST_Transform(%s::geometry, 3857), 500)
            UNION ALL
            SELECT ST_Distance(way, ST_Transform(%s::geometry, 3857)) AS d
            FROM planet_osm_polygon
            WHERE place IN ('village', 'town')
              AND ST_DWithin(way, ST_Transform(%s::geometry, 3857), 500)
        ) v
    """,
    "aeroway_dist": """
        SELECT min(d) FROM (
            SELECT ST_Distance(way, ST_Transform(%s::geometry, 3857)) AS d
            FROM planet_osm_polygon
            WHERE aeroway IN ('runway', 'aerodrome')
              AND ST_DWithin(way, ST_Transform(%s::geometry, 3857), 800)
            UNION ALL
            SELECT ST_Distance(way, ST_Transform(%s::geometry, 3857)) AS d
            FROM planet_osm_line
            WHERE aeroway IN ('runway', 'aerodrome')
              AND ST_DWithin(way, ST_Transform(%s::geometry, 3857), 800)
        ) a
    """,
    # Coastal V3.1: `natural='coastline'` OR `natural='beach'` within 500m of a
    # coastline (excludes inland cliffs / escarpments). SPEC_V3 §10.2.
    "coastal_dist": """
        WITH spot AS (SELECT ST_Transform(%s::geometry, 3857) AS g),
        coast AS (
            SELECT way FROM planet_osm_line
            WHERE "natural" = 'coastline'
              AND ST_DWithin(way, (SELECT g FROM spot), 1500)
        ),
        beach AS (
            SELECT b.way FROM planet_osm_polygon b
            WHERE b."natural" = 'beach'
              AND ST_DWithin(b.way, (SELECT g FROM spot), 1500)
              AND EXISTS (
                  SELECT 1 FROM planet_osm_line cl
                  WHERE cl."natural" = 'coastline'
                    AND ST_DWithin(cl.way, b.way, 500)
              )
        )
        SELECT min(d) FROM (
            SELECT ST_Distance(way, (SELECT g FROM spot)) AS d FROM coast
            UNION ALL
            SELECT ST_Distance(way, (SELECT g FROM spot)) AS d FROM beach
        ) c
    """,
    # V3.2: search radius tightened from 1000 m to 500 m (SPEC_V3 §11.5).
    "viewpoint_dist": """
        SELECT min(d) FROM (
            SELECT ST_Distance(way, ST_Transform(%s::geometry, 3857)) AS d
            FROM planet_osm_point
            WHERE tourism = 'viewpoint'
              AND ST_DWithin(way, ST_Transform(%s::geometry, 3857), 500)
            UNION ALL
            SELECT ST_Distance(way, ST_Transform(%s::geometry, 3857)) AS d
            FROM planet_osm_polygon
            WHERE tourism = 'viewpoint'
              AND ST_DWithin(way, ST_Transform(%s::geometry, 3857), 500)
        ) vp
    """,
    # V3.2: polygons only (waterway river/stream lines removed). Returns
    # the nearest water-polygon distance and its area; the caller tiers on
    # both (strong ≥ 5 ha within 200 m, weak ≥ 1 ha within 300 m).
    # SPEC_V3 §11.2, §11.5.
    "water_feature": """
        SELECT ST_Distance(way, ST_Transform(%s::geometry, 3857)) AS d,
               ST_Area(way) AS area_m2
        FROM planet_osm_polygon
        WHERE ("natural" = 'water' OR landuse = 'reservoir')
          AND ST_Area(way) >= 10000
          AND ST_DWithin(way, ST_Transform(%s::geometry, 3857), 300)
        ORDER BY d
        LIMIT 1
    """,
    "natural_fraction": """
        WITH buf AS (
            SELECT ST_Buffer(%s::geography, 500)::geometry AS g,
                   ST_Area(ST_Buffer(%s::geography, 500))   AS a
        ),
        inter AS (
            SELECT SUM(ST_Area(ST_Intersection(c.geom, buf.g)::geography)) AS total
            FROM landcover_corine c, buf
            WHERE c.code_18 LIKE '3%%'
              AND ST_Intersects(c.geom, buf.g)
        )
        SELECT COALESCE(inter.total, 0) / NULLIF(buf.a, 0) AS fraction
        FROM buf, inter
    """,
    "forest_dense_fraction": """
        WITH buf AS (
            SELECT ST_Buffer(%s::geography, 500)::geometry AS g,
                   ST_Area(ST_Buffer(%s::geography, 500))   AS a
        ),
        inter AS (
            SELECT SUM(ST_Area(ST_Intersection(c.geom, buf.g)::geography)) AS total
            FROM landcover_corine c, buf
            WHERE c.code_18 IN ('311', '312')
              AND ST_Intersects(c.geom, buf.g)
        )
        SELECT COALESCE(inter.total, 0) / NULLIF(buf.a, 0) AS fraction
        FROM buf, inter
    """,
}


def query_signals(conn: Any, geom_wkb_hex: str) -> Dict[str, Any]:
    """Run all spatial signal queries for a single spot. Returns a flat dict.

    Keys produced:
      - distance / fraction signals: numeric or None
      - `onspot_quarry` (bool)
      - `water_feature_dist` + `water_polygon_area` (split from composite query)
    """
    out: Dict[str, Any] = {}
    with conn.cursor() as cur:
        for name, sql in _SIGNAL_QUERIES.items():
            param_count = sql.count("%s")
            cur.execute(sql, (geom_wkb_hex,) * param_count)
            row = cur.fetchone()
            if name == "onspot_quarry":
                out[name] = row is not None
            elif name == "water_feature":
                if row and row[0] is not None:
                    out["water_feature_dist"] = row[0]
                    out["water_polygon_area"] = row[1]
                else:
                    out["water_feature_dist"] = None
                    out["water_polygon_area"] = None
            else:
                out[name] = row[0] if row and row[0] is not None else None
    return out
