---
paths:
  - "workers/ai_inference.py"
  - "workers/ai_vision_labeler.py"
  - "workers/scoring.py"
  - "models/**/*"
---

# AI & Server-Side Inference Rules

## General Principles
- All inference runs SERVER-SIDE in the Python worker container — never on-device
- Inference is batch-processed via n8n pipelines, not triggered by user actions
- No spots are rejected — all candidates receive AI analysis

## Two AI Models

### 1. MobileNetV2 Binary Classifier (`ai_inference.py`)
- Original model: binary good/bad classification from satellite tiles
- Outputs a single `ai_score` (0-100) stored in the `ai_score` column
- Runs on spots with status `legal_done`, transitions to `ai_done`
- Known limitation: essentially a learned color histogram (brown=good, green=bad)

### 2. Claude Vision Labeler (`ai_vision_labeler.py`)
- Rich multi-factor analysis using Claude Haiku Vision (`claude-haiku-4-5-20251001`)
- Evaluates 5 sub-scores (0-10) per satellite tile:
  - `surface_quality` (30%) — flat open ground suitable for parking
  - `vehicle_access` (20%) — visible tracks/roads leading in
  - `open_space` (20%) — room for 1-3 vehicles
  - `van_presence` (15%) — vans/campers visible (strong positive signal)
  - `obstruction_absence` (15%) — free of dense trees/buildings/fences
- Results stored in `ai_score` (weighted composite 0-100) and `ai_details` (JSONB breakdown)
- Runs on spots with satellite tiles that haven't been vision-analyzed yet (`ai_details IS NULL`)
- Processes highest-scoring spots first for maximum value
- Cost: ~$0.001/spot, rate-limited to 1 request/second
- Requires `ANTHROPIC_API_KEY` in worker environment

## Composite Scoring
- `composite_score = terrain_score * 0.20 + ai_score * 0.25 + context_score * 0.55`
- Legal data is informational only — does not gate scoring
- Score tiers: 80+ (green/high), 60-79 (cyan/medium), <60 (amber/low)
- Results stored in `composite_score` column in PostGIS

## Input Pipeline
- Satellite tile from IGN Spain PNOA (primary) or Bing Maps (fallback)
- Cache tiles to `data/satellite_tiles/{osm_id}.jpg`
- MobileNetV2: resize to 256x256, normalize per model requirements
- Vision labeler: base64-encode JPEG, send to Claude API

## Rate Limiting
- 2-second delay between satellite tile downloads
- 1-second delay between Claude Vision API calls
- n8n runs vision labeler every 12 minutes, 20 spots per batch
