# AI Vision Labeler

Rich satellite image analysis using Claude Haiku Vision, replacing the binary MobileNetV2 classifier with multi-factor visual understanding.

## Why

The original `ai_inference.py` runs a MobileNetV2 binary classifier that learned "brown ground = good, green vegetation = bad" from color-heuristic-labeled training data. It answers the wrong question — "is the ground bare?" instead of "is this a good place to park a van?"

The vision labeler sends each satellite tile to Claude Haiku's vision model, which understands context: a dirt clearing by a beach vs. a gravel quarry, vehicle access paths, whether vans are already parked there.

## 5 Sub-Scores

Each satellite tile is evaluated on 5 factors (0-10):

| Factor | Weight | What it measures |
|--------|--------|-----------------|
| `surface_quality` | 30% | Flat, open mineral/dirt/gravel ground suitable for parking |
| `vehicle_access` | 20% | Visible tracks, roads, or clearings leading to the spot |
| `open_space` | 20% | Enough room for 1-3 vehicles to park comfortably |
| `van_presence` | 15% | Vans/campers/RVs visible in the image (strong positive signal) |
| `obstruction_absence` | 15% | Free of dense trees, buildings, walls, fences |

Final `ai_score` = (weighted sum / 10) * 100, clamped to 0-100.

## Data Model

Results are stored in two columns:
- `ai_score` (FLOAT) — the weighted composite, same column as the old model
- `ai_details` (JSONB) — the 5 sub-score breakdown

```json
{
  "surface_quality": 8,
  "vehicle_access": 6,
  "open_space": 7,
  "van_presence": 0,
  "obstruction_absence": 9
}
```

## Usage

### CLI (inside Docker worker container)

```bash
# Dry run — analyze 5 spots, log results, don't update DB
python ai_vision_labeler.py --batch-size 5 --dry-run

# Real run — process 20 spots per batch
python ai_vision_labeler.py --batch-size 20
```

### HTTP API

```bash
# Trigger a batch (default 20 spots)
curl -X POST http://localhost:8001/run/ai-vision

# Custom batch size + dry run
curl -X POST http://localhost:8001/run/ai-vision \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10, "dry_run": true}'

# Reset all ai_details for re-analysis
curl -X POST http://localhost:8001/reset/ai-vision
```

## Processing Order

Spots are processed in descending `composite_score` order — high-value spots first, maximizing the return on API cost.

Only spots with:
- `status` in (`ai_done`, `context_done`, `completed`)
- `satellite_image_path` is not NULL
- `ai_details` is NULL (not yet vision-analyzed)

## Cost Estimate

- Model: Claude Haiku (`claude-haiku-4-5-20251001`)
- ~1,000 input tokens per image + 100 tokens prompt
- ~$0.001 per spot
- **100,000 spots ≈ $100**
- Rate: 1 request/second → ~28 hours for 100K spots

## Environment

Requires `ANTHROPIC_API_KEY` set in the worker environment (configured in `docker-compose.yml`, actual key in `.env`).

## Re-scoring Workflow

After the vision labeler updates `ai_score`, you need to recompute `composite_score`:

```bash
# Option 1: Re-run the scoring worker (handles context_done → completed)
curl -X POST http://localhost:8001/run/scoring -d '{"batch_size": 1000}'

# Option 2: Direct SQL for already-completed spots
UPDATE spots
SET composite_score = ROUND(
  (terrain_score * 0.20 + ai_score * 0.25 + context_score * 0.55)::numeric, 1
),
updated_at = NOW()
WHERE status = 'completed'
  AND ai_details IS NOT NULL;
```

## Testing

```bash
cd workers && python3 -m pytest tests/test_ai_vision_labeler.py -v
```
