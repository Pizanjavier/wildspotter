# Scoring V3 — Implementation Plan

> **Target spec:** [`../SPEC_V3.md`](../SPEC_V3.md). This document is the executable roadmap to reach the V3 acceptance criteria. Read SPEC_V3 first for the *what* and *why*; this doc covers the *how* and *in what order*.

## 0. Context

Current state (2026-04-16):

- 82,970 spots in `spots` table with `status = 'completed'`.
- Composite formula: `terrain*0.20 + ai*0.25 + context*0.55` (V2).
- Visual audit of top-30: ~50 % genuine wild, ~50 % false positives (cortijos, rice paddies, olive groves, beach parkings).
- User downloading CORINE 2018 GPKG (España) + SIOSE-AR per-CCAA SHP (17 files) into `data/landcover/`.

Goal: reach ≥ 85 % genuine wild in top-30 (SPEC_V3 §8 acceptance criteria).

## 1. Phases

The work is split into 7 phases. Each phase has a single owner role (data, db, worker, scoring, ops, qa, frontend), a clear definition of done, and is independently revertible.

**Token-budget convention.** Each step is tagged **[USER]** or **[CLAUDE]**:

- **[USER]** — Javier runs the command / does the visual check / pastes back a one-line result. These are the heavy / long-running / large-output tasks (downloads, ogr2ogr imports, full pipeline runs, looking at folders of satellite tiles, watching docker logs).
- **[CLAUDE]** — Claude writes the SQL / migration / worker / formula, and interprets short results the user pastes back. Claude does **not** read large files or directories of tiles into context.

If a step has no tag, treat it as **[USER]**.

### Phase 1 — Land-cover data import (DATA)

> **2026-04-16 status:** CORINE imported (232,685 polygons, Spain extent). SIOSE-AR **deferred** due to disk constraint — only ~10 GB free after CORINE vs. ~50–80 GB needed in `pgdata` for full-Spain SIOSE-AR. Worker handles the missing table gracefully. Revisit in Phase 6 if visual-audit false positives are dominated by sub-25 ha features.

**Inputs:**
- `data/landcover/corine/U2018_CLC2018_V2020_20u1_ES.gpkg` (or whatever the user names the España extract).
- ~~`data/landcover/siose_ar/<ccaa>/*.shp` × 17.~~ Deferred.

**Steps:**
1. **[USER]** Inspect each source to confirm SRID, layer name, and field for the class code, then paste the relevant lines back to Claude:
   ```bash
   ogrinfo -so data/landcover/corine/<file>.gpkg
   ogrinfo -so data/landcover/siose_ar/<ccaa>/<file>.shp
   ```
   *Claude needs the layer name, SRID, and the name of the field that holds the CORINE / SIOSE class code — nothing else.*
2. **[USER]** Import CORINE into PostGIS table `landcover_corine`:
   ```bash
   ogr2ogr -f PostgreSQL \
     PG:"host=localhost dbname=wildspotter user=wildspotter password=..." \
     data/landcover/corine/<file>.gpkg \
     -nln landcover_corine \
     -nlt PROMOTE_TO_MULTI \
     -lco GEOMETRY_NAME=geom \
     -lco FID=id \
     -t_srs EPSG:4326 \
     -overwrite
   ```
3. **[USER]** Import each SIOSE-AR CCAA into a single table `landcover_siose` (use `-append` after the first):
   ```bash
   # First CCAA: -overwrite
   ogr2ogr -f PostgreSQL PG:"..." <first>.shp -nln landcover_siose \
     -nlt PROMOTE_TO_MULTI -lco GEOMETRY_NAME=geom \
     -t_srs EPSG:4326 -overwrite
   # Remaining 16: -append
   for f in data/landcover/siose_ar/*/*.shp; do
     ogr2ogr -f PostgreSQL PG:"..." "$f" -nln landcover_siose \
       -nlt PROMOTE_TO_MULTI -t_srs EPSG:4326 -append
   done
   ```
4. **[USER]** Build spatial indexes:
   ```sql
   CREATE INDEX idx_landcover_corine_geom ON landcover_corine USING GIST (geom);
   CREATE INDEX idx_landcover_corine_class ON landcover_corine (code_18);
   CREATE INDEX idx_landcover_siose_geom  ON landcover_siose  USING GIST (geom);
   CLUSTER landcover_corine USING idx_landcover_corine_geom;
   CLUSTER landcover_siose  USING idx_landcover_siose_geom;
   ANALYZE landcover_corine;
   ANALYZE landcover_siose;
   ```

**Definition of done [USER pastes back the three numbers/value]:**
- `SELECT count(*) FROM landcover_corine` returns the expected polygon count for Spain.
- `SELECT count(*) FROM landcover_siose` returns sum of all 17 CCAA files.
- A test spatial query (`SELECT code_18 FROM landcover_corine WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(-3.7, 40.4), 4326)) LIMIT 1;`) returns a class for Madrid.

**Rollback [USER]:** `DROP TABLE landcover_corine, landcover_siose;`

### Phase 2 — Database migration (DB)

**Owner:** [CLAUDE] writes the file. [USER] applies it.

**File:** `db/migrations/00X_landcover.sql` (next available number).

```sql
ALTER TABLE spots
  ADD COLUMN landcover_class  TEXT,
  ADD COLUMN landcover_label  TEXT,
  ADD COLUMN siose_dominant   JSONB;

CREATE INDEX idx_spots_landcover_class ON spots (landcover_class);

-- Extend status enum if it is a CHECK constraint or ENUM type.
-- If status is plain TEXT, no migration needed; just start writing the new value.
```

**Definition of done [USER reports OK / error]:**
- Migration runs cleanly on the live DB.
- `\d spots` shows the three new columns (NULL for existing rows).

**Rollback [USER]:** `ALTER TABLE spots DROP COLUMN landcover_class, DROP COLUMN landcover_label, DROP COLUMN siose_dominant;`

### Phase 3 — Land-cover worker (WORKER)

**Owner:** [CLAUDE] writes the file. [USER] runs it on a 100-spot sample and pastes back: success/fail + count of NULL `landcover_class` rows.

**File:** `workers/landcover.py` (new).

**Responsibilities:**
- Pick spots with `status = 'amenities_done'` in batches of 50 (per `.claude/rules/backend.md`).
- For each spot, run two PostGIS queries:
  ```sql
  -- CORINE class (point-in-polygon, single result)
  SELECT code_18
  FROM landcover_corine
  WHERE ST_Intersects(geom, %s::geometry)
  LIMIT 1;

  -- SIOSE dominant cover (point-in-polygon)
  SELECT codiige, descripcio  -- or whatever the actual field names are
  FROM landcover_siose
  WHERE ST_Intersects(geom, %s::geometry)
  LIMIT 1;
  ```
- Map CORINE codes to Spanish labels via a small lookup table (constant in the module). Reference: `CORINE_LABELS_ES = {"112": "Tejido urbano discontinuo", "211": "Tierras de labor en secano", "311": "Bosque de frondosas", ...}`.
- Parse SIOSE composite descriptor into dominant code + cover %.
- Write `landcover_class`, `landcover_label`, `siose_dominant`, and set `status = 'landcover_done'`.

**Conventions:** psycopg2, batch 50, `ON CONFLICT` not needed (UPDATE by primary key), log progress every batch.

**Integration:** add to `workers/run_all.py` between amenities and scoring stages.

**Definition of done [USER pastes 2 lines: exit code + NULL count]:**
- `python workers/landcover.py` runs end-to-end on a 100-spot sample without error.
- All 100 spots have non-NULL `landcover_class` (or NULL with explicit log line if the spot falls in a CORINE gap, e.g., on water).

**Rollback:** the worker is additive; reverting Phases 4–5 makes it a no-op.

### Phase 4 — Scoring formula update (SCORING)

**Owner:** [CLAUDE] edits the file and writes the unit test. [USER] runs the test and pastes back PASS/FAIL.

**File:** `workers/scoring.py` (edit).

**Steps:**
1. Add helper functions:
   - `compute_wild_bonus(spot, corine_class, natural_fraction_500m, vision_van_presence) -> float`
   - `compute_landcover_penalty(spot, corine_class, siose_dominant, building_dist, industrial_dist, ...) -> float`
   - `passes_vision_gate(ai_details, ai_score) -> bool`
2. Replace the composite calculation:
   ```python
   base = terrain * 0.15 + ai * 0.20 + context * 0.35
   bonus = compute_wild_bonus(...) if passes_vision_gate(...) else 0
   penalty = compute_landcover_penalty(...)
   adjustment = max(-50, min(50, bonus - penalty))
   composite = max(0, min(100, base + adjustment))
   ```
3. Persist `wild_bonus`, `landcover_penalty`, and the qualifying paths (list of strings, e.g., `["coastal", "natura2000"]`) into `context_details` JSONB so the UI can render the breakdown.

**Definition of done:**
- Unit test on 5 hand-picked spots (1 alpine, 1 coastal cliff, 1 olive grove, 1 marina, 1 forest dead-end) returns the expected composite within ±2 points.

**Rollback:** revert this file via git.

### Phase 5 — Re-score all spots (OPS)

**Owner:** [USER] runs everything. Long-running, large-output — Claude must not stream the logs.

**Steps:**
1. **[USER]** Snapshot the table first: `pg_dump -t spots wildspotter > spots_pre_v3.sql`.
2. **[USER]** Reset `status` for all completed spots to trigger landcover + scoring:
   ```sql
   UPDATE spots SET status = 'amenities_done' WHERE status = 'completed';
   ```
   *(Only landcover + scoring run; terrain/legal/ai/context/amenities are untouched.)*
3. **[USER]** Run the pipeline (expect ~1 h):
   ```bash
   docker-compose exec worker python run_all.py
   ```
4. **[USER]** When done, paste back: total elapsed time + count of `status = 'completed'` rows.

**Definition of done [USER pastes 2 numbers]:**
- All 82,970 spots back at `status = 'completed'`.
- `composite_score` distribution shifted: top-30 should look very different from the V2 baseline.

**Rollback [USER]:** restore from `spots_pre_v3.sql` if the new distribution is broken.

### Phase 6 — Visual audit (QA)

**Owner:** [USER] does the visual classification (Claude must not read the tile folder). [CLAUDE] interprets the result and decides whether to tune.

**Steps:**
1. **[USER]** Fetch the new top-30:
   ```sql
   SELECT id, osm_id, composite_score, landcover_label,
          (context_details->>'wild_bonus')::float       AS wild_bonus,
          (context_details->>'landcover_penalty')::float AS penalty,
          ST_Y(geom) AS lat, ST_X(geom) AS lon
   FROM spots
   ORDER BY composite_score DESC
   LIMIT 30;
   ```
2. **[USER]** For each, open the cached satellite tile under `data/satellite_tiles/<osm_id>.png` and visually classify as ✓ / ~ / ✗.
3. **[USER]** Paste back to Claude: only the clean rate (X / 30 ✓) and the **osm_id list of the false positives** with a one-word descriptor each (e.g., `123456 olive_grove`, `789012 marina`). Do **not** paste the full 30-row table or any image.
4. **[CLAUDE]** If ≥ 85 % → proceed to Phase 7. If < 85 % → propose specific weight/penalty adjustments in SPEC_V3 §2; user re-runs Phases 4–6.

**Definition of done [USER pastes 1 number + ≤30 short lines]:** clean rate ≥ 85 % on top-30. Claude updates the "Tuning log" entry in SPEC_V3.

### Phase 7 — Frontend badge (FRONTEND)

**Owner:** [CLAUDE] writes the code (small files, fits the token budget). [USER] runs Expo, opens the app, reports whether the badge looks right on 3 spots.

**File:** `src/app/spot/[id].tsx` (or the spot detail component, depending on current structure).

**Steps:**
1. **[CLAUDE]** Add a metric card "Suelo" between the existing surface and slope cards.
2. **[CLAUDE]** Extend the API spot serializer in `backend/src/routes/spots.ts` to include the three new fields.
3. **[CLAUDE]** Color-code the badge per SPEC_V3 §6.1 + add attribution footer.
4. **[CLAUDE, optional]** Render `wild_bonus` and `landcover_penalty` in a "How was this scored?" expandable section.
5. **[USER]** Run Expo, open 3 spots (one wild, one heterogeneous, one agricultural), report PASS/FAIL + screenshot only if FAIL.

**Definition of done [USER pastes 1 line]:**
- Spot detail in the iOS simulator shows the new badge with correct label and color for at least 3 different spots.

## 2. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| CORINE 25 ha MMU misses small farms | High | Medium | SIOSE-AR covers down to 0.5 ha — used as second layer |
| SIOSE-AR field names differ across CCAA SHPs | Medium | Medium | Inspect each file in Phase 1; normalise via `-sql` flag in ogr2ogr if needed |
| Reproject overhead during query (3035 ↔ 4326) | Low | Low | Import with `-t_srs EPSG:4326` so all tables match `spots.geom` |
| New formula scores too few spots above 80 (UI looks empty) | Medium | High | Tune wild_bonus upward; ship `min_score` default at 60 instead of 70 |
| Re-scoring locks the DB during peak | Low | Low | Run during off-hours; the operation is read-mostly and short |

## 3. Order of operations checklist

- [x] Phase 1 — import CORINE (232,685 polygons)
- [x] Phase 1 — spatial indexes (CORINE)
- [~] Phase 1 — import SIOSE-AR — **deferred** (see §4)
- [x] Phase 2 — DB migration applied
- [ ] Phase 3 — `workers/landcover.py` written and tested on sample
- [ ] Phase 3 — wired into `run_all.py`
- [ ] Phase 4 — `workers/scoring.py` updated with bonus / penalty / gate
- [ ] Phase 4 — unit tests pass
- [ ] Phase 5 — DB snapshot taken
- [ ] Phase 5 — re-score completed
- [ ] Phase 6 — visual audit ≥ 85 %
- [ ] Phase 7 — frontend badge live
- [ ] SPEC_V3 acceptance criteria §8 all green

## 4. Deferred items

- **SIOSE-AR import (deferred from V3 first iteration, 2026-04-16).** Worker is SIOSE-aware: it `LEFT JOIN`s on the table when it exists and writes `siose_dominant = NULL` when it doesn't. To activate later: free ~80 GB on `pgdata` (external SSD or larger disk), run `ogr2ogr -append` per province .gpkg as in the original Phase 1 §3, then a single `UPDATE spots SET status='amenities_done' WHERE status='completed'` re-run. No code change required.
- Multi-country support (would require CORINE for the new country; SIOSE is Spain-only).
- Realtime CORINE refresh (annual snapshot is fine for V3).
- User-facing land-cover filter on the map ("only forest spots") — wait for usage data after launch.
- Re-training MobileNetV2 with land-cover-aware labels — large effort, separate plan.

## 5. References

- Spec: [`../SPEC_V3.md`](../SPEC_V3.md)
- Base spec: [`../SPEC_V2.md`](../SPEC_V2.md)
- AI vision sub-scores: [`../.claude/rules/ai-inference.md`](../.claude/rules/ai-inference.md)
- Worker conventions: [`../.claude/rules/backend.md`](../.claude/rules/backend.md)
- CORINE 2018 nomenclature: https://land.copernicus.eu/en/technical-library/corine-land-cover-nomenclature-guidelines/html
- SIOSE-AR documentation: https://www.siose.es/
