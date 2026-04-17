"""Tests for the V3 / V3.1 scoring formula (SPEC_V3 §2, §10).

V3 legacy tests verify rollback helpers still behave per SPEC_V3 §2.
V3.1 tests verify the soft ai-weight, new qualifier paths (scenic viewpoint,
water feature, forest dense), new penalty tiers (onspot quarry, building
50/100/200m, village), archetype cap, obstruction soft cap, and legal
independence.
"""

import pytest

from scoring_v3 import (
    compute_ai_gate_v4,
    compute_ai_weight,
    compute_composite,
    compute_composite_v31,
    compute_composite_v4,
    compute_landcover_penalty,
    compute_landcover_penalty_v31,
    compute_wild_bonus,
    compute_wild_bonus_v31,
    compute_wild_bonus_v4,
    passes_vision_gate,
    apply_archetype_cap,
    apply_archetype_cap_v4,
    apply_soft_obstruction_cap,
    ADJUSTMENT_CAP,
    ADJUSTMENT_CAP_V4,
    ARCHETYPE_CAP,
    NO_ARCHETYPE_CAP_V4,
    OBSTRUCTION_SOFT_CAP,
    PENALTY_CAP_V3,
    PENALTY_CAP_V31,
    STRONG_ARCHETYPE_PATHS,
    STRONG_ARCHETYPE_PATHS_V4,
    WEAK_ARCHETYPE_CAP_V4,
    WEAK_ARCHETYPE_PATHS_V4,
    WILD_BONUS_CAP,
    WILD_BONUS_CAP_V4,
)


# ---------------------------------------------------------------------------
# V3 legacy helpers (kept for rollback)
# ---------------------------------------------------------------------------


class TestVisionGateLegacy:
    def test_passes_when_all_high(self):
        assert passes_vision_gate(60.0, {"obstruction_absence": 9, "surface_quality": 8})

    def test_fails_low_obstruction(self):
        assert not passes_vision_gate(70.0, {"obstruction_absence": 7, "surface_quality": 9})

    def test_fails_low_surface(self):
        assert not passes_vision_gate(70.0, {"obstruction_absence": 9, "surface_quality": 7})

    def test_fails_low_ai(self):
        assert not passes_vision_gate(54.0, {"obstruction_absence": 9, "surface_quality": 9})

    def test_fails_none_details(self):
        assert not passes_vision_gate(80.0, None)


class TestWildBonusLegacy:
    def test_coastal_adds_20(self):
        bonus, paths = compute_wild_bonus(
            coastal_dist_m=200, marina_nearby=False, legal_status={},
            elevation=30, spot_type="dirt_parking", landcover_class="331",
            natural_fraction_500m=None, vision_van_presence=0,
        )
        assert "coastal" in paths and bonus == 20.0

    def test_national_park_legacy(self):
        bonus, paths = compute_wild_bonus(
            coastal_dist_m=None, marina_nearby=False,
            legal_status={"national_park": {"inside": True}},
            elevation=500, spot_type="dead_end", landcover_class="312",
            natural_fraction_500m=None, vision_van_presence=0,
        )
        assert "national_park" in paths and bonus == 25.0


class TestLandcoverPenaltyLegacy:
    def test_olive_grove_minus_30(self):
        assert compute_landcover_penalty(
            landcover_class="223", siose_dominant=None,
            building_dist_m=None, industrial_dist_m=None,
            parking_dist_m=None, place_dist_m=None, aeroway_dist_m=None,
        ) == 30.0

    def test_penalty_capped_at_50(self):
        assert compute_landcover_penalty(
            landcover_class="131", siose_dominant=None,
            building_dist_m=50, industrial_dist_m=None,
            parking_dist_m=20, place_dist_m=None, aeroway_dist_m=None,
        ) == PENALTY_CAP_V3


# ---------------------------------------------------------------------------
# V3.1 — AI soft weight (SPEC_V3 §10.1)
# ---------------------------------------------------------------------------


class TestAiWeight:
    def test_zero_ai_floor_05(self):
        assert compute_ai_weight(0) == 0.5

    def test_ai_40_gives_070(self):
        assert compute_ai_weight(40) == pytest.approx(0.70)

    def test_ai_100_ceiling_10(self):
        assert compute_ai_weight(100) == 1.0

    def test_ai_200_clamped_10(self):
        assert compute_ai_weight(200) == 1.0

    def test_none_ai_floor_05(self):
        assert compute_ai_weight(None) == 0.5


# ---------------------------------------------------------------------------
# V3.1 — Wild bonus (SPEC_V3 §10.2, §10.3)
# ---------------------------------------------------------------------------


def _wb(**overrides):
    base = dict(
        coastal_dist_m=None,
        viewpoint_dist_m=None,
        water_feature_dist_m=None,
        water_polygon_area_m2=None,
        elevation=None,
        spot_type="dirt_parking",
        landcover_class=None,
        forest_dense_fraction_500m=None,
        natural_fraction_500m=None,
        vision_van_presence=0,
    )
    base.update(overrides)
    return compute_wild_bonus_v31(**base)


class TestWildBonusV32:
    def test_no_qualifier_returns_zero(self):
        bonus, paths = _wb(elevation=100, landcover_class="231",
                           natural_fraction_500m=0.05)
        assert bonus == 0.0 and paths == []

    def test_coastal_adds_25(self):
        bonus, paths = _wb(coastal_dist_m=200)
        assert paths == ["coastal"] and bonus == 25.0

    def test_viewpoint_300_adds_20(self):
        bonus, paths = _wb(viewpoint_dist_m=250)
        assert "scenic_viewpoint" in paths and bonus == 20.0

    def test_viewpoint_500_adds_10(self):
        bonus, paths = _wb(viewpoint_dist_m=450)
        assert "scenic_viewpoint" in paths and bonus == 10.0

    def test_viewpoint_above_500_no_bonus(self):
        bonus, paths = _wb(viewpoint_dist_m=800)
        # V3.2 removed the 1000m tier.
        assert "scenic_viewpoint" not in paths
        assert bonus == 0.0

    def test_water_strong_adds_18(self):
        # Polygon ≥ 5 ha within 200 m → strong.
        bonus, paths = _wb(water_feature_dist_m=150, water_polygon_area_m2=60000)
        assert "water_feature_strong" in paths and bonus == 18.0

    def test_water_weak_adds_10_when_far(self):
        # Polygon ≥ 5 ha but at 250 m → weak (distance tier).
        bonus, paths = _wb(water_feature_dist_m=250, water_polygon_area_m2=60000)
        assert "water_feature" in paths and bonus == 10.0

    def test_water_weak_adds_10_when_small(self):
        # Small polygon (1-5 ha) within 200 m → weak (area tier).
        bonus, paths = _wb(water_feature_dist_m=150, water_polygon_area_m2=20000)
        assert "water_feature" in paths and bonus == 10.0

    def test_alpine_strong_at_1500(self):
        bonus, paths = _wb(elevation=1600)
        assert "alpine_strong" in paths and bonus == 15.0

    def test_alpine_weak_at_1000(self):
        bonus, paths = _wb(elevation=1100)
        assert "alpine" in paths and "alpine_strong" not in paths
        assert bonus == 5.0

    def test_alpine_threshold_1000(self):
        _, below_paths = _wb(elevation=950)
        assert not any(p.startswith("alpine") for p in below_paths)
        _, above_paths = _wb(elevation=1050)
        assert "alpine" in above_paths

    def test_forest_dense_weak_25pct(self):
        bonus, paths = _wb(forest_dense_fraction_500m=0.30)
        assert "forest_dense" in paths and bonus == 8.0

    def test_forest_dense_strong_40pct(self):
        bonus, paths = _wb(forest_dense_fraction_500m=0.50)
        assert "forest_dense_strong" in paths and bonus == 15.0

    def test_forest_dead_end_requires_forest_class(self):
        _, no_paths = _wb(spot_type="dead_end", landcover_class="231")
        _, yes_paths = _wb(spot_type="dead_end", landcover_class="312")
        assert "forest_dead_end" not in no_paths
        assert "forest_dead_end" in yes_paths

    def test_natural_fraction_not_sole_qualifier(self):
        bonus, paths = _wb(natural_fraction_500m=0.60)
        assert paths == [] and bonus == 0.0

    def test_natural_fraction_supports_archetype(self):
        # alpine_weak (5) + nat-frac ≥ 40 (6) = 11
        bonus, paths = _wb(elevation=1100, natural_fraction_500m=0.50)
        assert "alpine" in paths and "natural_fraction" in paths
        assert bonus == 11.0

    def test_legal_status_not_a_parameter(self):
        bonus, paths = _wb(coastal_dist_m=100)
        assert bonus == 25.0 and paths == ["coastal"]

    def test_bonus_capped_at_40(self):
        bonus, _ = _wb(
            coastal_dist_m=100,
            viewpoint_dist_m=200,
            water_feature_dist_m=100,
            water_polygon_area_m2=80000,
            elevation=2000,
            forest_dense_fraction_500m=0.60,
            natural_fraction_500m=0.60,
            vision_van_presence=8,
        )
        # Raw: 25+20+18+15+15+6+10 = 109, capped at 40
        assert bonus == WILD_BONUS_CAP == 40.0

    def test_van_presence_5plus(self):
        bonus, _ = _wb(coastal_dist_m=100, vision_van_presence=6)
        # coastal 25 + van 10 = 35
        assert bonus == 35.0

    def test_van_presence_2_to_5(self):
        bonus, _ = _wb(coastal_dist_m=100, vision_van_presence=3)
        assert bonus == 28.0  # 25 + 3


# ---------------------------------------------------------------------------
# V3.1 — Landcover penalty (SPEC_V3 §10.4)
# ---------------------------------------------------------------------------


def _pen(**overrides):
    base = dict(
        landcover_class=None,
        siose_dominant=None,
        onspot_quarry=False,
        building_dist_m=None,
        industrial_dist_m=None,
        parking_dist_m=None,
        place_dist_m=None,
        village_dist_m=None,
        aeroway_dist_m=None,
    )
    base.update(overrides)
    return compute_landcover_penalty_v31(**base)


class TestLandcoverPenaltyV31:
    def test_clean_spot_zero(self):
        assert _pen(landcover_class="312") == 0.0

    def test_onspot_quarry_hard_50(self):
        assert _pen(onspot_quarry=True) == 50.0

    def test_onspot_quarry_stacks_with_corine(self):
        # 50 (onspot) + 40 (CORINE industrial) → 60 cap
        assert _pen(onspot_quarry=True, landcover_class="131") == PENALTY_CAP_V31

    def test_building_50m_minus_40(self):
        assert _pen(building_dist_m=30) == 40.0

    def test_building_100m_minus_25(self):
        assert _pen(building_dist_m=80) == 25.0

    def test_building_200m_minus_15(self):
        assert _pen(building_dist_m=180) == 15.0

    def test_building_tiers_do_not_stack(self):
        # 30m matches all three thresholds; only tightest (−40) applies.
        assert _pen(building_dist_m=30) == 40.0

    def test_village_500m_minus_20(self):
        assert _pen(village_dist_m=400) == 20.0

    def test_village_outside_500_no_penalty(self):
        assert _pen(village_dist_m=600) == 0.0

    def test_penalty_capped_at_60(self):
        # 50 (onspot) + 40 (industrial) + 40 (building 50m) + 20 (parking) = 150
        assert _pen(
            onspot_quarry=True,
            landcover_class="131",
            building_dist_m=30,
            parking_dist_m=20,
        ) == PENALTY_CAP_V31


# ---------------------------------------------------------------------------
# V3.1 — Archetype cap (SPEC_V3 §10.5)
# ---------------------------------------------------------------------------


class TestArchetypeCap:
    """V3.2: only STRONG paths unlock composite > 80. Weak paths cap at 80."""

    def test_empty_paths_caps_at_80(self):
        assert apply_archetype_cap(90.0, []) == 80.0

    def test_natural_fraction_alone_caps_at_80(self):
        assert apply_archetype_cap(90.0, ["natural_fraction"]) == 80.0

    def test_weak_viewpoint_caps_at_80(self):
        assert apply_archetype_cap(90.0, ["scenic_viewpoint"]) == 80.0

    def test_weak_alpine_caps_at_80(self):
        assert apply_archetype_cap(90.0, ["alpine"]) == 80.0

    def test_weak_water_caps_at_80(self):
        assert apply_archetype_cap(90.0, ["water_feature"]) == 80.0

    def test_weak_forest_dense_caps_at_80(self):
        assert apply_archetype_cap(90.0, ["forest_dense"]) == 80.0

    def test_strong_coastal_keeps_90(self):
        assert apply_archetype_cap(90.0, ["coastal"]) == 90.0

    def test_strong_alpine_keeps_90(self):
        assert apply_archetype_cap(90.0, ["alpine_strong"]) == 90.0

    def test_strong_water_keeps_90(self):
        assert apply_archetype_cap(90.0, ["water_feature_strong"]) == 90.0

    def test_strong_forest_dense_keeps_90(self):
        assert apply_archetype_cap(90.0, ["forest_dense_strong"]) == 90.0

    def test_forest_dead_end_keeps_90(self):
        assert apply_archetype_cap(90.0, ["forest_dead_end"]) == 90.0

    def test_mixed_paths_strong_wins(self):
        # If any path is strong, composite stays (weak paths don't veto).
        assert apply_archetype_cap(90.0, ["scenic_viewpoint", "coastal"]) == 90.0

    def test_below_cap_unchanged(self):
        assert apply_archetype_cap(60.0, []) == 60.0


# ---------------------------------------------------------------------------
# V3.1 — Obstruction soft cap (SPEC_V3 §10.1)
# ---------------------------------------------------------------------------


class TestObstructionSoftCap:
    def test_low_obstruction_caps_at_70(self):
        assert apply_soft_obstruction_cap(90.0, {"obstruction_absence": 3}) == 70.0

    def test_high_obstruction_unchanged(self):
        assert apply_soft_obstruction_cap(90.0, {"obstruction_absence": 8}) == 90.0

    def test_missing_details_unchanged(self):
        assert apply_soft_obstruction_cap(90.0, None) == 90.0

    def test_below_cap_unchanged(self):
        assert apply_soft_obstruction_cap(50.0, {"obstruction_absence": 1}) == 50.0


# ---------------------------------------------------------------------------
# V3.1 — Legal independence (SPEC_V3 §10.0.4)
# ---------------------------------------------------------------------------


class TestLegalIndependence:
    """legal_status (NP, Natura 2000) MUST NOT affect composite_score."""

    def test_wild_bonus_v31_signature_excludes_legal(self):
        # Two otherwise-identical spots, one "inside" NP (not passed to scorer).
        # Since V3.1 accepts no legal parameter, both must score identically.
        b1, _ = _wb(elevation=1100)
        b2, _ = _wb(elevation=1100)
        assert b1 == b2

    def test_np_qualifier_path_removed(self):
        _, paths = _wb(elevation=1100, coastal_dist_m=100)
        assert "national_park" not in paths
        assert "natura2000" not in paths


# ---------------------------------------------------------------------------
# V3.1 — Archetype fixtures (visual-audit regression set)
# ---------------------------------------------------------------------------


class TestV31Archetypes:
    """Archetype fixtures aligned with the §10.8 vanlife archetypes, V3.2."""

    def test_coastal_wild_beach(self):
        """Sea-adjacent beach, no marina, open surroundings → strong archetype."""
        bonus, paths = _wb(coastal_dist_m=200, natural_fraction_500m=0.30)
        penalty = _pen(landcover_class="332")
        composite, _ = compute_composite_v31(
            terrain_score=75, ai_score=80, context_score=60,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=penalty,
            ai_details={"obstruction_absence": 8, "surface_quality": 7},
        )
        # raw = 25 (coastal) + 3 (nat-frac 25-40) = 28
        # ai_weight(80)=0.9; weighted=25.2; base=11.25+16+21=48.25; composite≈73.5
        assert "coastal" in paths
        assert bonus == 28.0
        # coastal is STRONG → archetype cap does not apply
        assert composite >= 70.0

    def test_inland_cliff_rejected(self):
        """No coastal + no alpine qualifier → no paths, capped at 80."""
        bonus, paths = _wb(coastal_dist_m=None, elevation=800,
                           natural_fraction_500m=0.30)
        # elevation 800 is below alpine threshold (1000) → no path qualifies
        assert paths == []
        composite, _ = compute_composite_v31(
            terrain_score=80, ai_score=70, context_score=65,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details={"obstruction_absence": 8, "surface_quality": 8},
        )
        assert composite <= ARCHETYPE_CAP

    def test_mirador_viewpoint(self):
        """Scenic mirador within 300m → weak archetype, caps at 80."""
        bonus, paths = _wb(viewpoint_dist_m=250, elevation=900,
                           natural_fraction_500m=0.35)
        composite, _ = compute_composite_v31(
            terrain_score=70, ai_score=65, context_score=55,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details={"obstruction_absence": 8, "surface_quality": 7},
        )
        assert "scenic_viewpoint" in paths
        # raw = 20 (vp≤300) + 2 (elev≥600) + 3 (nat-frac 25-40) = 25
        assert bonus == 25.0
        # Weak path → archetype cap=80 still applies, but base is below it anyway
        assert composite <= ARCHETYPE_CAP

    def test_embalse_lakeside_strong(self):
        """Large reservoir (≥5 ha) within 200m → strong water archetype."""
        bonus, paths = _wb(water_feature_dist_m=150,
                           water_polygon_area_m2=100000,
                           elevation=500,
                           natural_fraction_500m=0.30)
        composite, _ = compute_composite_v31(
            terrain_score=75, ai_score=70, context_score=60,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details={"obstruction_absence": 8, "surface_quality": 7},
        )
        assert "water_feature_strong" in paths
        # raw = 18 (water strong) + 3 (nat-frac 25-40) = 21
        assert bonus == 21.0
        # Strong archetype → cap does not apply
        assert composite >= 60.0

    def test_embalse_lakeside_weak(self):
        """Small pond (<5 ha) within 200m → weak water archetype, capped at 80."""
        bonus, paths = _wb(water_feature_dist_m=150,
                           water_polygon_area_m2=20000,
                           elevation=500)
        assert "water_feature" in paths
        assert "water_feature_strong" not in paths
        assert bonus == 10.0

    def test_forest_clearing_gets_weighted_bonus(self):
        """Forest clearing (ai~40 due to canopy) still receives 70% of bonus."""
        bonus_raw, paths = _wb(elevation=800, spot_type="dead_end",
                               landcover_class="312",
                               forest_dense_fraction_500m=0.50,
                               natural_fraction_500m=0.50)
        _, weighted = compute_composite_v31(
            terrain_score=70, ai_score=40, context_score=60,
            wild_bonus_raw=bonus_raw, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details={"obstruction_absence": 6, "surface_quality": 6},
        )
        # forest_dead_end is a STRONG path; forest_dense_strong also qualifies
        assert "forest_dead_end" in paths
        assert "forest_dense_strong" in paths
        # ai_weight(40) = 0.70
        assert weighted == pytest.approx(bonus_raw * 0.70, abs=0.1)

    def test_alpine_clearing(self):
        bonus, paths = _wb(elevation=1600, natural_fraction_500m=0.50,
                           forest_dense_fraction_500m=0.40)
        composite, _ = compute_composite_v31(
            terrain_score=80, ai_score=75, context_score=65,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details={"obstruction_absence": 8, "surface_quality": 7},
        )
        assert "alpine_strong" in paths
        assert "forest_dense_strong" in paths
        # raw = 15 (elev≥1500) + 15 (forest dense≥40) + 6 (nat-frac≥40) = 36
        assert bonus == 36.0
        # Strong archetype → cap does not apply
        assert composite >= 70.0

    def test_finca_with_pool_rejected(self):
        """Building within 50m → −40 penalty kills composite."""
        bonus, paths = _wb(coastal_dist_m=None, elevation=200,
                           natural_fraction_500m=0.30)
        penalty = _pen(building_dist_m=30, place_dist_m=200)
        composite, _ = compute_composite_v31(
            terrain_score=75, ai_score=70, context_score=60,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=penalty,
            ai_details={"obstruction_absence": 9, "surface_quality": 9},
        )
        # penalty = 40 (building 50m) + 15 (place 250m) = 55
        assert penalty == 55.0
        # No archetype match → cap at 80, and penalty cuts down hard
        assert composite <= ARCHETYPE_CAP
        assert paths == []

    def test_building_500m_penalty_applies(self):
        """V3.2: building in 200-500m range adds soft -8 penalty."""
        assert _pen(building_dist_m=350) == 8.0

    def test_onspot_quarry_rejected(self):
        """Spot sitting inside a quarry polygon → −50 hard penalty."""
        bonus, paths = _wb(elevation=500, natural_fraction_500m=0.10)
        penalty = _pen(onspot_quarry=True)
        composite, _ = compute_composite_v31(
            terrain_score=70, ai_score=75, context_score=50,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=penalty,
            ai_details={"obstruction_absence": 9, "surface_quality": 9},
        )
        assert penalty == 50.0
        # No archetype match → cap at 80, and penalty cuts down hard
        assert composite <= ARCHETYPE_CAP

    def test_olive_grove_rejected(self):
        bonus, _ = _wb(elevation=200, natural_fraction_500m=0.05,
                       landcover_class="223")
        penalty = _pen(landcover_class="223",
                       siose_dominant={"code": "OLI", "cover_pct": 90},
                       place_dist_m=150)
        assert bonus == 0.0  # no archetype
        assert penalty == PENALTY_CAP_V31  # 30+25+15=70 capped at 60

    def test_dehesa_rejected_by_archetype_cap(self):
        """Clean dehesa — no archetype match, natural_fraction doesn't qualify alone."""
        bonus, paths = _wb(natural_fraction_500m=0.30, elevation=400)
        # Paths empty (natural_fraction alone is not an archetype)
        assert paths == []
        composite, _ = compute_composite_v31(
            terrain_score=90, ai_score=85, context_score=90,
            wild_bonus_raw=bonus, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details={"obstruction_absence": 9, "surface_quality": 9},
        )
        # base = 13.5 + 17 + 31.5 = 62 ; composite = 62 (below cap anyway)
        assert composite <= ARCHETYPE_CAP


# ---------------------------------------------------------------------------
# V3 legacy clamping tests (rollback helpers still work)
# ---------------------------------------------------------------------------


class TestClampingLegacy:
    def test_composite_clamped_at_100(self):
        assert compute_composite(
            terrain_score=100, ai_score=100, context_score=100,
            wild_bonus=50, landcover_penalty=0,
        ) == 100.0

    def test_composite_clamped_at_0(self):
        assert compute_composite(
            terrain_score=0, ai_score=0, context_score=0,
            wild_bonus=0, landcover_penalty=PENALTY_CAP_V3,
        ) == 0.0

    def test_adjustment_capped_symmetrically(self):
        # V3.2: ADJUSTMENT_CAP tightened 50 → 35. Max upward swing is ADJUSTMENT_CAP.
        high = compute_composite(
            terrain_score=0, ai_score=0, context_score=0,
            wild_bonus=WILD_BONUS_CAP, landcover_penalty=0,
        )
        assert high == ADJUSTMENT_CAP


# ---------------------------------------------------------------------------
# V4 — Vision-primary scoring (SPEC_V3 §12)
# ---------------------------------------------------------------------------


def _wb4(**overrides):
    base = dict(
        coastal_dist_m=None,
        viewpoint_dist_m=None,
        water_feature_dist_m=None,
        water_polygon_area_m2=None,
        elevation=None,
        spot_type="dirt_parking",
        landcover_class=None,
        natural_fraction_500m=None,
        vision_van_presence=0,
    )
    base.update(overrides)
    return compute_wild_bonus_v4(**base)


_VISION_OK = {"surface_quality": 8, "open_space": 8, "obstruction_absence": 8}
_VISION_FAIL = {"surface_quality": 4, "open_space": 5, "obstruction_absence": 7}


class TestAiGateV4:
    def test_none_details_returns_half(self):
        assert compute_ai_gate_v4(None) == 0.5

    def test_empty_details_returns_half(self):
        assert compute_ai_gate_v4({}) == 0.5

    def test_all_pass_returns_one(self):
        assert compute_ai_gate_v4(_VISION_OK) == 1.0

    def test_surface_fail_returns_zero(self):
        assert compute_ai_gate_v4({"surface_quality": 5, "open_space": 8, "obstruction_absence": 8}) == 0.0

    def test_open_fail_returns_zero(self):
        assert compute_ai_gate_v4({"surface_quality": 8, "open_space": 5, "obstruction_absence": 8}) == 0.0

    def test_obstruction_fail_returns_zero(self):
        assert compute_ai_gate_v4({"surface_quality": 8, "open_space": 8, "obstruction_absence": 5}) == 0.0


class TestWildBonusV4:
    def test_no_qualifier_returns_zero(self):
        bonus, paths = _wb4(elevation=400, natural_fraction_500m=0.60)
        assert paths == [] and bonus == 0.0

    def test_forest_dense_not_a_path(self):
        # V4 removes forest_dense / forest_dense_strong from paths.
        # `forest_dense_fraction_500m` is no longer a parameter.
        bonus, paths = _wb4(landcover_class="312")
        assert paths == [] and bonus == 0.0

    def test_coastal_adds_20(self):
        bonus, paths = _wb4(coastal_dist_m=200)
        assert paths == ["coastal"] and bonus == 20.0

    def test_viewpoint_300_adds_12(self):
        bonus, paths = _wb4(viewpoint_dist_m=250)
        assert "scenic_viewpoint" in paths and bonus == 12.0

    def test_viewpoint_above_300_no_bonus(self):
        _, paths = _wb4(viewpoint_dist_m=400)
        assert "scenic_viewpoint" not in paths

    def test_water_strong_adds_15(self):
        bonus, paths = _wb4(water_feature_dist_m=150, water_polygon_area_m2=80000)
        assert "water_feature_strong" in paths and bonus == 15.0

    def test_water_weak_small_within_200_adds_6(self):
        bonus, paths = _wb4(water_feature_dist_m=150, water_polygon_area_m2=20000)
        assert "water_feature" in paths and bonus == 6.0

    def test_water_weak_large_at_250_adds_6(self):
        bonus, paths = _wb4(water_feature_dist_m=250, water_polygon_area_m2=80000)
        assert "water_feature" in paths and bonus == 6.0

    def test_alpine_strong_adds_12(self):
        bonus, paths = _wb4(elevation=1600)
        assert "alpine_strong" in paths and bonus == 12.0

    def test_alpine_weak_adds_4(self):
        bonus, paths = _wb4(elevation=1100)
        assert "alpine" in paths and bonus == 4.0

    def test_mid_elevation_supports_without_path(self):
        # 800m is below alpine but above 600; nat-frac adds support only if
        # another path qualifies. Alone → no path → bonus 0.
        bonus, paths = _wb4(elevation=800, natural_fraction_500m=0.50)
        assert paths == [] and bonus == 0.0

    def test_forest_dead_end_adds_10(self):
        bonus, paths = _wb4(spot_type="dead_end", landcover_class="312")
        assert "forest_dead_end" in paths and bonus == 10.0

    def test_natural_fraction_supports_coastal(self):
        # coastal 20 + nat-frac ≥ 40 (3) = 23
        bonus, paths = _wb4(coastal_dist_m=100, natural_fraction_500m=0.50)
        assert "natural_fraction" in paths and bonus == 23.0

    def test_bonus_capped_at_30(self):
        bonus, _ = _wb4(
            coastal_dist_m=100,
            viewpoint_dist_m=200,
            water_feature_dist_m=100,
            water_polygon_area_m2=80000,
            elevation=2000,
            natural_fraction_500m=0.60,
            vision_van_presence=8,
        )
        # Raw: 20+12+15+12+3+8 = 70, capped at 30
        assert bonus == WILD_BONUS_CAP_V4 == 30.0


class TestArchetypeCapV4:
    def test_no_archetype_caps_at_60(self):
        assert apply_archetype_cap_v4(85.0, []) == 60.0

    def test_natural_fraction_alone_caps_at_60(self):
        # natural_fraction is NOT in weak_paths → treated as no-archetype.
        assert apply_archetype_cap_v4(85.0, ["natural_fraction"]) == 60.0

    def test_weak_viewpoint_caps_at_80(self):
        assert apply_archetype_cap_v4(85.0, ["scenic_viewpoint"]) == 80.0

    def test_weak_alpine_caps_at_80(self):
        assert apply_archetype_cap_v4(90.0, ["alpine"]) == 80.0

    def test_weak_water_caps_at_80(self):
        assert apply_archetype_cap_v4(90.0, ["water_feature"]) == 80.0

    def test_strong_coastal_keeps_score(self):
        assert apply_archetype_cap_v4(90.0, ["coastal"]) == 90.0

    def test_strong_alpine_keeps_score(self):
        assert apply_archetype_cap_v4(90.0, ["alpine_strong"]) == 90.0

    def test_strong_water_keeps_score(self):
        assert apply_archetype_cap_v4(95.0, ["water_feature_strong"]) == 95.0

    def test_forest_dead_end_keeps_score(self):
        assert apply_archetype_cap_v4(90.0, ["forest_dead_end"]) == 90.0

    def test_mixed_strong_wins(self):
        assert apply_archetype_cap_v4(90.0, ["scenic_viewpoint", "coastal"]) == 90.0

    def test_below_cap_unchanged(self):
        assert apply_archetype_cap_v4(45.0, []) == 45.0


class TestCompositeV4:
    def test_vision_passing_coastal_beach(self):
        """ai=80 vision-verified + coastal archetype → high score."""
        bonus_raw, paths = _wb4(coastal_dist_m=200, natural_fraction_500m=0.30)
        composite, gated = compute_composite_v4(
            terrain_score=75, ai_score=80, context_score=70,
            wild_bonus_raw=bonus_raw, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details=_VISION_OK,
        )
        # bonus_raw = 20 + 1 (nat-frac 25-40) = 21 (no: nat-frac 0.30 < 0.40 → +1)
        # actually 0.30 is 25-40 tier → +1
        assert bonus_raw == 21.0
        # ai_gate = 1.0; gated = 21
        assert gated == 21.0
        # base = 75*0.10 + 80*0.55 + 70*0.15 = 7.5 + 44 + 10.5 = 62
        # composite = 62 + 21 = 83; coastal is strong → no cap
        assert composite >= 80.0

    def test_dehesa_capped_at_60(self):
        """No archetype, even with good AI → cap at 60."""
        bonus_raw, paths = _wb4(natural_fraction_500m=0.30, elevation=400)
        # nat-frac alone doesn't qualify → paths=[]
        assert paths == []
        composite, _ = compute_composite_v4(
            terrain_score=90, ai_score=70, context_score=85,
            wild_bonus_raw=bonus_raw, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details=_VISION_OK,
        )
        # base = 9 + 38.5 + 12.75 = 60.25 → capped at 60
        assert composite == NO_ARCHETYPE_CAP_V4

    def test_vision_failing_kills_bonus(self):
        """AI gate fails → wild_bonus zeroed even if archetype path matches."""
        bonus_raw, paths = _wb4(coastal_dist_m=200)
        composite, gated = compute_composite_v4(
            terrain_score=75, ai_score=80, context_score=70,
            wild_bonus_raw=bonus_raw, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details=_VISION_FAIL,
        )
        assert gated == 0.0
        # base = 62; composite ≈ 62; coastal is strong → no cap
        assert composite == pytest.approx(62.0, abs=0.1)

    def test_mobilenet_only_half_bonus(self):
        """Spots without ai_details keep 50% of wild_bonus as fallback."""
        bonus_raw, paths = _wb4(coastal_dist_m=200)
        composite, gated = compute_composite_v4(
            terrain_score=75, ai_score=60, context_score=70,
            wild_bonus_raw=bonus_raw, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details=None,
        )
        assert gated == 10.0
        # base = 7.5 + 33 + 10.5 = 51; composite = 61
        assert composite == pytest.approx(61.0, abs=0.1)

    def test_weak_archetype_caps_at_80(self):
        """Scenic viewpoint only (weak) → cannot exceed 80."""
        bonus_raw, paths = _wb4(viewpoint_dist_m=200, elevation=1100,
                                natural_fraction_500m=0.50)
        composite, _ = compute_composite_v4(
            terrain_score=95, ai_score=90, context_score=95,
            wild_bonus_raw=bonus_raw, wild_paths=paths,
            landcover_penalty=0.0,
            ai_details=_VISION_OK,
        )
        # alpine weak (4) + viewpoint (12) + nat-frac 0.50 → +3 = 19
        assert bonus_raw == 19.0
        # base = 9.5 + 49.5 + 14.25 = 73.25; composite = 92.25 → capped at 80
        assert composite == WEAK_ARCHETYPE_CAP_V4 == 80.0

    def test_penalty_cuts_composite(self):
        """Building 30m → −40 penalty overwhelms bonus."""
        bonus_raw, paths = _wb4(coastal_dist_m=200)
        composite, _ = compute_composite_v4(
            terrain_score=75, ai_score=80, context_score=70,
            wild_bonus_raw=bonus_raw, wild_paths=paths,
            landcover_penalty=40.0,
            ai_details=_VISION_OK,
        )
        # bonus_raw=20, gated=20; adjustment = clamp(-25, 25, 20-40) = -20
        # base=62; composite = 42; coastal is strong → no cap
        assert composite == pytest.approx(42.0, abs=0.1)
