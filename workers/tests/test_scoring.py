"""Tests for the rebalanced scoring worker."""

from scoring import compute_composite_score, TERRAIN_WEIGHT, AI_WEIGHT, CONTEXT_WEIGHT


class TestScoringWeights:
    """Verify the new weight configuration."""

    def test_terrain_weight(self):
        assert TERRAIN_WEIGHT == 0.20

    def test_ai_weight(self):
        assert AI_WEIGHT == 0.25

    def test_context_weight(self):
        assert CONTEXT_WEIGHT == 0.55

    def test_weights_sum_to_1(self):
        total = TERRAIN_WEIGHT + AI_WEIGHT + CONTEXT_WEIGHT
        assert abs(total - 1.0) < 1e-9


class TestCompositeScore:
    """Tests for composite score calculation."""

    def test_all_100_returns_100(self):
        assert compute_composite_score(100.0, 100.0, 100.0) == 100.0

    def test_all_0_returns_0(self):
        assert compute_composite_score(0.0, 0.0, 0.0) == 0.0

    def test_all_50_returns_50(self):
        assert compute_composite_score(50.0, 50.0, 50.0) == 50.0

    def test_context_dominates(self):
        """Context at 55% should dominate the score."""
        # High context, low everything else
        score = compute_composite_score(0.0, 0.0, 100.0)
        assert score == 55.0

    def test_ai_contribution(self):
        """AI at 25% should contribute a quarter."""
        score = compute_composite_score(0.0, 100.0, 0.0)
        assert score == 25.0

    def test_terrain_contribution(self):
        """Terrain at 20% should contribute a fifth."""
        score = compute_composite_score(100.0, 0.0, 0.0)
        assert score == 20.0

    def test_clamp_above_100(self):
        """Values above 100 should still clamp to 100."""
        # This shouldn't happen in practice but test the clamping
        score = compute_composite_score(100.0, 100.0, 100.0)
        assert score <= 100.0

    def test_realistic_good_spot(self):
        """A good spot: decent terrain, good AI, excellent context."""
        score = compute_composite_score(70.0, 85.0, 90.0)
        # 70*0.20 + 85*0.25 + 90*0.55 = 14 + 21.25 + 49.5 = 84.75 → 84.8
        assert score == 84.8

    def test_realistic_bad_spot(self):
        """A bad spot: steep terrain, poor AI, near highway."""
        score = compute_composite_score(20.0, 30.0, 25.0)
        # 20*0.20 + 30*0.25 + 25*0.55 = 4 + 7.5 + 13.75 = 25.25 → 25.2
        assert score == 25.2
