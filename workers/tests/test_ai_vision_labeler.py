"""Tests for the AI Vision Labeler worker."""

from ai_vision_labeler import compute_ai_score, parse_response, WEIGHTS


class TestComputeAiScore:
    """Tests for the weighted score computation."""

    def test_perfect_scores_return_100(self):
        details = {k: 10 for k in WEIGHTS}
        assert compute_ai_score(details) == 100.0

    def test_zero_scores_return_0(self):
        details = {k: 0 for k in WEIGHTS}
        assert compute_ai_score(details) == 0.0

    def test_mid_scores_return_50(self):
        details = {k: 5 for k in WEIGHTS}
        assert compute_ai_score(details) == 50.0

    def test_weighted_correctly(self):
        details = {
            "surface_quality": 10,   # 10 * 0.30 = 3.0
            "vehicle_access": 0,     # 0  * 0.20 = 0.0
            "open_space": 10,        # 10 * 0.20 = 2.0
            "van_presence": 0,       # 0  * 0.15 = 0.0
            "obstruction_absence": 0, # 0 * 0.15 = 0.0
        }
        # weighted_sum = 3.0 + 0.0 + 2.0 + 0.0 + 0.0 = 5.0 → 50.0
        assert compute_ai_score(details) == 50.0

    def test_single_factor_surface(self):
        details = {
            "surface_quality": 10,
            "vehicle_access": 0,
            "open_space": 0,
            "van_presence": 0,
            "obstruction_absence": 0,
        }
        # 10 * 0.30 = 3.0 → 30.0
        assert compute_ai_score(details) == 30.0

    def test_single_factor_van_presence(self):
        details = {
            "surface_quality": 0,
            "vehicle_access": 0,
            "open_space": 0,
            "van_presence": 10,
            "obstruction_absence": 0,
        }
        # 10 * 0.15 = 1.5 → 15.0
        assert compute_ai_score(details) == 15.0

    def test_weights_sum_to_1(self):
        total = sum(WEIGHTS.values())
        assert abs(total - 1.0) < 1e-9


class TestParseResponse:
    """Tests for Claude response JSON parsing."""

    def test_valid_json(self):
        text = '{"surface_quality":8,"vehicle_access":6,"open_space":7,"van_presence":0,"obstruction_absence":9}'
        result = parse_response(text)
        assert result is not None
        assert result["surface_quality"] == 8
        assert result["vehicle_access"] == 6
        assert result["open_space"] == 7
        assert result["van_presence"] == 0
        assert result["obstruction_absence"] == 9

    def test_json_with_markdown_fences(self):
        text = '```json\n{"surface_quality":5,"vehicle_access":5,"open_space":5,"van_presence":5,"obstruction_absence":5}\n```'
        result = parse_response(text)
        assert result is not None
        assert all(v == 5 for v in result.values())

    def test_json_with_plain_fences(self):
        text = '```\n{"surface_quality":3,"vehicle_access":4,"open_space":5,"van_presence":6,"obstruction_absence":7}\n```'
        result = parse_response(text)
        assert result is not None
        assert result["surface_quality"] == 3

    def test_json_with_surrounding_text(self):
        text = 'Here is the analysis:\n{"surface_quality":8,"vehicle_access":6,"open_space":7,"van_presence":0,"obstruction_absence":9}\nHope this helps!'
        result = parse_response(text)
        assert result is not None
        assert result["surface_quality"] == 8

    def test_invalid_json_returns_none(self):
        assert parse_response("not json at all") is None

    def test_empty_string_returns_none(self):
        assert parse_response("") is None

    def test_missing_key_returns_none(self):
        text = '{"surface_quality":8,"vehicle_access":6,"open_space":7,"van_presence":0}'
        assert parse_response(text) is None

    def test_non_numeric_value_returns_none(self):
        text = '{"surface_quality":"high","vehicle_access":6,"open_space":7,"van_presence":0,"obstruction_absence":9}'
        assert parse_response(text) is None

    def test_values_clamped_to_0_10(self):
        text = '{"surface_quality":15,"vehicle_access":-3,"open_space":7,"van_presence":0,"obstruction_absence":9}'
        result = parse_response(text)
        assert result is not None
        assert result["surface_quality"] == 10  # clamped from 15
        assert result["vehicle_access"] == 0    # clamped from -3

    def test_float_values_rounded(self):
        text = '{"surface_quality":7.6,"vehicle_access":3.2,"open_space":5.5,"van_presence":0.1,"obstruction_absence":8.9}'
        result = parse_response(text)
        assert result is not None
        assert result["surface_quality"] == 8  # rounded from 7.6
        assert result["vehicle_access"] == 3   # rounded from 3.2
        assert result["open_space"] == 6       # rounded from 5.5
