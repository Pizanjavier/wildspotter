# WildSpotter — Product Specification (V3)

> This document **extends** [`SPEC_V2.md`](./SPEC_V2.md). V2 remains the base specification for product overview, architecture, frontend, mapping, design tokens, and the data model. V3 only documents what changes in the next iteration. If V3 is silent on a topic, V2 still applies.

## 0. Why V3 Exists

V2 ships a working pipeline (Radar → Topographer → Legal → Satellite Eye → Context → Amenities → Composite Score) but the **top-ranked spots do not yet match the marketing promise**.

The marketing copy promises:

- *"Spots nobody has shared"* — wild, unindexed, off-grid.
- *"Objetivo: terreno, legal, satélite, contexto"* — the four-axis radar.
- Authentic vanlife geography: alpine clearings, coastal cliffs, dead-end forest tracks.

Empirical visual audit of the current top-30 (run on 82,970 fully-processed spots, 2026-04-15):

- ~50% are genuine wild spots (alpine, coastal cliff, forest dead-end).
- ~50% are false positives the formula cannot distinguish: olive groves, rice paddies, cortijos (Andalusian farmsteads), beach parkings, marina edges, salinas.

Root cause is **not** the formula weights. Root cause is **OSM tagging gaps in Spain**: cortijos are rarely tagged `building=farm`, rice paddies are rarely tagged `wetland=*`, olive groves frequently lack `landuse=orchard`. The Context stage cannot penalise what OSM does not label.

**V3 fixes this** by adding an authoritative land-cover layer that does not depend on community-edited OSM tags, and by re-balancing the composite formula around an explicit "wild" qualifier.

V3 keeps every architectural rule from V2 — including the **score-penalty rule**: no spot is ever rejected from the database. All filtering is at query time via user preferences.

## 1. What Changes vs V2

| Area | V2 | V3 |
|------|----|----|
| Composite formula | `terrain*0.20 + ai*0.25 + context*0.55` | `terrain*0.15 + ai*0.20 + context*0.35 + wild_bonus − landcover_penalty` |
| "Wild" definition | Implicit (emerges from context sub-scores) | Explicit qualifier with multiple paths (coastal, protected, alpine, forest, natural-fraction) |
| Land-cover source | OSM `landuse=*` polygons (incomplete) | CORINE Land Cover 2018 + SIOSE Alta Resolución (authoritative, government-grade) |
| Vision gate | Soft (sub-scores feed `ai_score`) | Hard floor: `obstruction_absence ≥ 8 AND surface_quality ≥ 8 AND ai_score ≥ 55` |
| Spot detail UI | Surface, slope, elevation, legal checklist | + Land-cover badge ("Bosque mediterráneo" / "Cultivo herbáceo" / "Costa rocosa") + source attribution |
| Filters | `max_slope`, `hide_restricted`, `min_score` | + `min_wild_bonus` (optional, advanced filter) |
| Data model | See V2 §4 | + 3 columns on `spots` (see §5) |

**Unchanged:** product overview, architecture (backend + workers), MapLibre client, Expo stack, design tokens, all V2 features 2.1–2.9 (Area Scanner, Radar, Topographer, Legal Judge, Satellite Eye primary classifier, Context, Amenities, Google Maps Bridge), tile generation, MITECO legal layers, Catastro REST integration.

## 2. Scoring Formula (V3)

### 2.1. Composite

```
composite_score = clamp(0, 100,
    terrain_score   * 0.15
  + ai_score        * 0.20
  + context_score   * 0.35
  + wild_bonus
  − landcover_penalty
)
```

`wild_bonus` and `landcover_penalty` are absolute point adjustments (not weighted percentages), capped together at ±50 points before clamping.

### 2.2. Vision gate (hard floor, applied before bonuses)

A spot is eligible for `wild_bonus` **only if** the Claude Vision sub-scores satisfy:

```
ai_details.obstruction_absence >= 8
ai_details.surface_quality     >= 8
ai_score                       >= 55
```

Spots that fail the gate keep their base composite (`terrain*0.15 + ai*0.20 + context*0.35`) but receive **no `wild_bonus`** (still receive any `landcover_penalty`). This stops aerial-only false positives (a rice paddy that "looks flat from space") from inheriting wild bonuses.

### 2.3. Wild qualifier (any-of)

A spot is "wild" if ANY of the following is true:

| Path | Condition | Source |
|------|-----------|--------|
| Coastal | Within 1500 m of `natural=beach\|cliff` OR `natural=coastline` (and not within 500 m of `leisure=marina` / `landuse=harbour`) | OSM |
| National Park | `legal_status->'national_park'->>'inside' = 'true'` | MITECO |
| Natura 2000 | `legal_status->'natura2000'->>'inside' = 'true'` | MITECO |
| Alpine | `elevation >= 1200 m` | Terrain-RGB |
| Forest dead-end | `spot_type = 'dead_end'` AND CORINE class ∈ {311, 312, 313, 322, 323, 324} | OSM + CORINE |
| Natural fraction | ≥ 15 % of CORINE classes 3xx (forest/scrub) within 500 m | CORINE |

A spot that qualifies through any path receives `wild_bonus` from §2.4.

### 2.4. Wild bonus (additive, max 65 pts pre-clamp)

| Signal | Bonus |
|--------|-------|
| Coastal qualifier hit | +20 |
| Inside National Park | +25 |
| Inside Natura 2000 (and not National Park) | +15 |
| `elevation ≥ 1500 m` | +15 |
| `elevation ≥ 1000 m` (and < 1500) | +10 |
| `elevation ≥ 600 m` (and < 1000) | +5 |
| Natural fraction ≥ 40 % | +20 |
| Natural fraction ≥ 20 % (and < 40) | +12 |
| Natural fraction ≥ 10 % (and < 20) | +6 |
| Vision `van_presence ≥ 5` | +15 |
| Vision `van_presence ≥ 2` (and < 5) | +5 |

All compatible bonuses stack (e.g., a coastal cliff at 50 m elevation inside Natura 2000 with 30 % natural fraction = 20 + 15 + 12 = +47).

### 2.5. Land-cover penalty (subtractive, max 50 pts)

| Signal | Penalty |
|--------|---------|
| CORINE class ∈ {211, 212, 213, 221, 222, 223, 241, 242, 243} (arable / permanent crops / orchards / heterogeneous agricultural) | −30 |
| CORINE class ∈ {121, 122, 123, 124, 131, 132, 133, 142} (industrial / transport / extraction / dump / construction) | −40 |
| CORINE class ∈ {111, 112} (urban fabric) | −35 |
| SIOSE-AR dominant descriptor matches `CHL` (cultivo herbáceo) / `OLI` (olivar) / `FRT` (frutal) / `EDF` (edificación) with cover ≥ 60 % | −25 |
| Within 200 m of `building=*` (any) | −15 |
| Within 600 m of `landuse=industrial\|quarry\|military` | −20 |
| Within 100 m of `amenity=parking` (organised parking) | −20 |
| Within 250 m of `place=farm\|hamlet\|isolated_dwelling` (farmstead cluster) | −15 |
| Within 800 m of `aeroway=runway\|aerodrome` | −20 |

Penalties stack but are clipped to `−50` total before being subtracted from the composite.

### 2.6. Reference enums

- **CORINE 2018, level-3 codes used:** see Copernicus Land Monitoring Service nomenclature.
- **SIOSE-AR descriptors used:** see IGN SIOSE-AR documentation. V3 only consumes the dominant cover class per polygon, not the full hierarchical composite.

This formula is the **first version** committed in V3. It will be tuned as the visual audit feedback loop matures. Tuning happens here in this document.

## 3. Data Sources Added in V3

### 3.1. CORINE Land Cover 2018

- **Source:** Copernicus Land Monitoring Service.
- **Format:** GeoPackage (`.gpkg`), NUTS region "España".
- **Resolution:** 25 ha minimum mapping unit (MMU), 100 m linear MMU.
- **CRS:** EPSG:3035 (LAEA Europe).
- **Classes:** 44 classes across 3 hierarchical levels.
- **Licence:** Free, attribution required.
- **Use:** Coarse but authoritative land-cover floor. Catches large agricultural / industrial / urban zones that OSM misses.

### 3.2. SIOSE Alta Resolución (SIOSE-AR) — DEFERRED

> **Status (2026-04-16): Deferred from V3 first iteration.** Disk-space constraint on the dev machine (only ~10 GB free after CORINE, vs. ~50–80 GB needed in `pgdata` for full-Spain SIOSE-AR). The land-cover worker is written to query SIOSE *if* the table exists and degrade gracefully when it doesn't, so SIOSE can be added later without code changes. Revisit after Phase 6 visual audit (see `docs/scoring-v3-plan.md`): if the residual false-positive set is dominated by sub-25 ha features (small cortijos, isolated olive groves), invest in external storage and import SIOSE-AR.

- **Source:** Instituto Geográfico Nacional (IGN) Spain.
- **Format:** GeoPackage (`.gpkg`), distributed per province (~50 files; 15 of those downloaded as of 2026-04-16).
- **Resolution:** 0.5–1 ha (much finer than CORINE).
- **CRS:** EPSG:25830 / 25829 (UTM ETRS89, zone-dependent).
- **Classes:** Hierarchical composite descriptors (e.g., `100_CHL_60_OLI_40` = 60 % cereals + 40 % olive grove).
- **Licence:** Free.
- **Use:** Catches small farms, olive groves, cortijos, rice paddies invisible to CORINE's 25 ha MMU.

CORINE alone is imported into PostGIS via `ogr2ogr` and queried per-spot in a new worker (see V3 plan, `docs/scoring-v3-plan.md`).

### 3.3. Attribution

Spot detail screen must show:

> Suelo: CORINE Land Cover 2018 © European Union, Copernicus Land Monitoring Service.
> SIOSE-AR © Instituto Geográfico Nacional de España.

## 4. Architecture Rules (Carried Forward)

- **No rejection rule (V2 §2.4 reaffirmed):** Land-cover signals **never** delete or skip spots from the database. They only adjust `composite_score`. Users filter via `min_score` (and optionally `min_wild_bonus`).
- **Backend-centric (V2 §3.1 reaffirmed):** All land-cover queries run server-side in Python workers. The mobile client never sees CORINE / SIOSE polygons.
- **Score-penalty over feature gate:** A heavy negative weight (−40) is preferred to a hard exclusion. This preserves recall and lets future tuning recover spots.

## 5. Data Model Changes

Three columns added to `spots`:

| Field | Type | Description |
|-------|------|-------------|
| `landcover_class` | TEXT | CORINE level-3 code (e.g., `'312'` for coniferous forest) |
| `landcover_label` | TEXT | Human-readable label, Spanish (e.g., `'Bosque de coníferas'`) — used by the UI badge |
| `siose_dominant` | JSONB | Dominant SIOSE-AR descriptor and cover %, e.g., `{"code":"OLI","label":"Olivar","cover_pct":85}` |

A new `wild_bonus` and `landcover_penalty` are **not** persisted as columns; they are computed inside `workers/scoring.py` from the inputs above and folded into `composite_score`. If they need to be exposed in the UI, persist them in `context_details` JSONB under keys `wild_bonus` and `landcover_penalty`.

`status` enum gets one new value:

- `landcover_done` — populated after the new worker runs, before `scoring`.

Pipeline order becomes:

```
pending → terrain_done → legal_done → ai_done → context_done → amenities_done → landcover_done → completed
```

## 6. Design / UI Changes

### 6.1. Spot detail screen

Add a new metric card between **Surface** and **Slope**:

- **Label:** `Suelo` (Spanish) / `Land cover` (English).
- **Value:** `landcover_label` from CORINE (fallback to `siose_dominant.label` if CORINE class is heterogeneous 24x).
- **Color coding:**
  - Green (`#4ADE80`) — wild classes (3xx forest/scrub, 4xx wetland excluding 423 salinas, 5xx water excluding 521 lagoons-with-aquaculture).
  - Amber (`#FBBF24`) — heterogeneous (24x).
  - Red (`#EF4444`) — agricultural / urban / industrial (1xx, 2xx).
- **Footer:** small attribution `Fuente: CORINE 2018 + SIOSE-AR`.

### 6.2. Score breakdown (optional, not required for V3 launch)

If the spot detail screen includes a "How was this scored?" expandable section, add two rows:

- `Bonus paisaje (wild_bonus)` — value from `context_details.wild_bonus`.
- `Penalización suelo (landcover_penalty)` — value from `context_details.landcover_penalty`.

### 6.3. Config screen (no required change)

The existing `min_score` slider already covers the user filter need. An advanced `min_wild_bonus` slider is optional and can ship in a later iteration.

### 6.4. Marketing alignment

Top-30 visual quality target: **≥ 85 %** genuine wild spots after V3. This is the metric that justifies the marketing promise. Below that threshold, V3 tuning continues before launch.

## 7. Out of Scope for V3

- New satellite providers.
- Crowd-sourced corrections / user voting on spots.
- Multi-country expansion (Spain only, as in V2).
- Replacing the MobileNetV2 primary classifier — V3 uses it as-is and gates on the Claude Vision sub-scores.
- Realtime land-cover refresh — CORINE 2018 + SIOSE-AR are static snapshots; refresh cadence is annual at most.
- **SIOSE-AR import** — deferred to a follow-up iteration (see §3.2). Triggered by Phase 6 visual audit if residual FPs are dominated by sub-25 ha features.

## 8. Acceptance Criteria

V3 is shippable when **all** of the following are true:

1. CORINE 2018 + SIOSE-AR imported into PostGIS with valid spatial indexes.
2. `landcover_class`, `landcover_label`, `siose_dominant` populated for ≥ 99 % of spots in `status >= context_done`.
3. `composite_score` recomputed for all 82,970+ spots using the V3 formula.
4. Visual audit of the top-30 spots returns ≥ 85 % genuine wild spots (alpine, coastal cliff, forest dead-end, protected area).
5. Spot detail screen shows the new `Suelo` badge with correct color coding and attribution.
6. Pipeline status enum extended; `workers/landcover.py` integrated into `run_all.py` between `amenities` and `scoring`.

## 9. References

- Base spec: [`SPEC_V2.md`](./SPEC_V2.md)
- Implementation plan for V3: [`docs/scoring-v3-plan.md`](./docs/scoring-v3-plan.md)
- Marketing promise source: `marketing-path/marketing-strategy.md`
- AI vision rules: `.claude/rules/ai-inference.md`
- Backend worker conventions: `.claude/rules/backend.md`

## 10. V3.1 Revisions (Post-Audit, 2026-04-16)

### 10.0. Why V3.1

Phase 6 visual audit of the V3 top-30 (scoring run 2026-04-16) returned **6/30 clean (20 %)**, far below the ≥ 85 % acceptance target (§8.4). The top-30 was dominated by **"clean Spanish dehesa"** — flat, quiet, rural nothing — while the spots the marketing promises (coastal cliffs, alpine clearings, forest dead-ends, scenic viewpoints, lakeside) were mostly absent or penalised.

Root causes identified:

1. **Vision gate is an archetype filter.** Requiring `obstruction_absence ≥ 8 AND surface_quality ≥ 8` rejects every archetype except flat dry ground — forest fails on canopy, coast fails on wet/mixed surface, alpine fails on rocks. Only ~5 % of spots pass the gate, so 95 % never receive `wild_bonus` and the ranking collapses to *absence of badness*, which dehesa wins by default.
2. **Coastal qualifier is polluted by inland cliffs.** `natural=cliff` in OSM is frequently used for inland escarpments (Aragón, Soria, Zaragoza). Inland cliffs steal the coastal +20 bonus from real coastal spots.
3. **Viewpoints and inland water were missing.** Spanish vanlife sources (furgosfera, nomade-nation, sincodigopostal) consistently cite *miradores* and *embalses/lagos* as top overnight archetypes. V3 had no qualifier for either.
4. **Legal status was leaking into the score.** V3 §2.4 awarded `+25` for National Park and `+15` for Natura 2000 as `wild_bonus` signals. This violates the V2 rule (and the V3 §4 carry-forward) that *legal data is informational only*. Scoring must be independent of legal status; users filter at query time via `hide_restricted`. V3.1 removes both.
5. **Building penalty too soft at close range.** `building_dist ≤ 200 → −15` allows fincas with pools to reach the top-30 when `wild_bonus` stacks.
6. **On-spot quarry/industrial not checked directly.** V3 only tested proximity (600 m). Spots *inside* a quarry perimeter escape detection when the polygon edge is > 600 m from the centroid.

V3.1 is a tuning revision, not an architectural change. Data model, pipeline order, and data sources are unchanged.

### 10.1. Formula change — vision gate becomes a soft weight

Replace §2.2 gate behaviour. The gate no longer blocks `wild_bonus`; it **weights** it:

```
ai_weight   = clamp(0.5, 1.0, 0.5 + ai_score/200)
wild_bonus  = wild_bonus_raw * ai_weight
```

- `ai_score = 0`  → `wild_bonus × 0.5`
- `ai_score = 40` → `wild_bonus × 0.70`
- `ai_score = 100` → `wild_bonus × 1.0`

This lets forest clearings (ai ~40) receive 70 % of their geographic bonus instead of 0 %. The gate is replaced by a **soft cap** on the final composite: spots whose AI sub-scores suggest a building or obstruction (`obstruction_absence < 5`) cap at composite ≤ 70, preventing aerial false positives from reaching the top tier.

### 10.2. Wild qualifier paths (revised)

Supersedes §2.3. An any-of match. New paths in bold.

| Path | Condition |
|------|-----------|
| **Coastal (revised)** | Within 1500 m of `natural='coastline'` OR (`natural='beach'` AND `ST_DWithin(way, sea_polygon, 500)`). Excludes `natural='cliff'` (inland ambiguity). |
| **Scenic viewpoint (new)** | Within 500 m of `tourism='viewpoint'` |
| **Water feature (new)** | Within 300 m of `natural='water'` / `landuse='reservoir'` / `waterway IN ('river','stream')` where water polygon area ≥ 1 ha |
| Alpine (revised threshold) | `elevation >= 1000 m` (was 1200) |
| **Forest dense (new)** | CORINE class ∈ {311, 312} within 500 m ≥ 30 % |
| Forest dead-end (carried) | `spot_type='dead_end'` AND CORINE class ∈ {311, 312, 313, 322, 323, 324} |
| Natural fraction (tightened) | ≥ 25 % of CORINE 3xx within 500 m (was 15 %). Only a *supporting* qualifier — never the sole wild path. |

**Removed:** National Park qualifier AND Natura 2000 qualifier — legal status is informational only (V2/V3 §4 rule) and MUST NOT affect `composite_score`. Both remain visible in the spot detail checklist and filterable at query time via `hide_restricted`.

### 10.3. Wild bonus table (revised)

Supersedes §2.4. Caps at 65 pts pre-weighting.

| Signal | Bonus |
|--------|-------|
| Coastal qualifier hit | +25 (was +20) |
| Scenic viewpoint within 500 m | **+25 (new)** |
| Scenic viewpoint within 1000 m | **+10 (new)** |
| Water feature within 300 m | **+20 (new)** |
| `elevation ≥ 1500 m` | +20 (was +15) |
| `elevation ≥ 1000 m` (< 1500) | +12 (was +10) |
| `elevation ≥ 600 m` (< 1000) | +5 |
| Forest dense ≥ 40 % CORINE 311/312 in 500 m | **+20 (new)** |
| Forest dense ≥ 25 % CORINE 311/312 in 500 m | **+12 (new)** |
| Natural fraction ≥ 40 % | +15 (was +20) |
| Natural fraction ≥ 25 % (< 40) | +8 (was +12 at ≥ 20) |
| Vision `van_presence ≥ 5` | +15 |
| Vision `van_presence ≥ 2` (< 5) | +5 |

Stacking rules unchanged.

### 10.4. Land-cover penalty table (revised)

Supersedes §2.5. Cap raised to 60 (was 50).

| Signal | Penalty |
|--------|---------|
| CORINE ∈ {211, 212, 213, 221, 222, 223, 241, 242, 243} | −30 |
| CORINE ∈ {121, 122, 123, 124, 131, 132, 133, 142} | −40 |
| CORINE ∈ {111, 112} | −35 |
| SIOSE-AR CHL/OLI/FRT/EDF cover ≥ 60 % | −25 |
| **On-spot `landuse=quarry\|industrial\|military` (intersect, not proximity, new)** | **−50 (hard)** |
| Within 50 m of `building=*` (any) — **new tier** | **−40** |
| Within 100 m of `building=*` — **new tier** | **−25** |
| Within 200 m of `building=*` (retained softer tier) | −15 |
| Within 600 m of `landuse=industrial\|quarry\|military` | −20 |
| Within 100 m of `amenity=parking` | −20 |
| Within 250 m of `place=farm\|hamlet\|isolated_dwelling` | −15 |
| Within 500 m of `place=village\|town` **(new)** | −20 |
| Within 800 m of `aeroway=runway\|aerodrome` | −20 |

Penalty tiers for buildings use the tightest matching distance only (not stacked).

### 10.5. Top-tier archetype requirement (new)

To reach `composite_score > 75`, a spot must satisfy **at least one of**:

- Coastal qualifier
- Scenic viewpoint within 500 m
- Water feature within 300 m
- Alpine ≥ 1000 m
- Forest dense ≥ 25 %
- Forest dead-end

Without an archetype match, composite is capped at 75. This guarantees the top tier of the leaderboard *has* to be special, not just clean dehesa.

### 10.6. Implementation notes

- `scoring_v3.py` adds helpers `compute_wild_bonus_v31`, `compute_landcover_penalty_v31`, `apply_archetype_cap`. Legacy V3 helpers are kept for rollback.
- New PostGIS signal queries: `viewpoint_dist`, `water_feature_dist`, `forest_dense_fraction`, `onspot_quarry`, `village_dist`. Coastal query restricted to `natural='coastline'` + sea-adjacent beaches.
- `run_all.py` and the `landcover_done → completed` stage are unchanged; only the scoring logic shifts.
- Attribution in §3.3 unchanged.

### 10.7. Acceptance re-target

§8.4 target ≥ 85 % clean in the top-30 stands. Intermediate milestones:

- V3.1 first re-score: ≥ 50 % clean in top-30 (raises the floor above dehesa baseline).
- V3.1 second pass (after tuning): ≥ 75 %.
- Ship when ≥ 85 % and the top-30 visibly includes coast / forest / alpine / viewpoint / lakeside archetypes in roughly equal weight.

### 10.8. Van community research (source for V3.1 signals)

Web research on how Spanish vanlifers find overnight spots (Park4Night app usage patterns, furgoperfecta.com, furgosfera.com, nomade-nation.com, sincodigopostal.com, Google Maps queries used by the community) surfaced the following archetypes — ranked by frequency of mention as *the* reason to drive somewhere for the night.

| Rank | Archetype | How vanlifers describe it | Why V3 missed it | V3.1 signal that captures it |
|------|-----------|---------------------------|------------------|------------------------------|
| 1 | **Coastal wild beach / cove** | *"aparcamiento junto al mar"*, *"cala salvaje"*, *"dormir escuchando las olas"* | Coastal qualifier polluted by inland `natural=cliff` | Coastal restricted to `natural='coastline'` + sea-adjacent `natural='beach'` (§10.2) |
| 2 | **Mirador (scenic viewpoint)** | *"dormir con vistas"*, *"amanecer en el mirador"* — sunset/sunrise over valley, sea, or mountains | No qualifier at all; viewpoints near villages got penalised | `tourism='viewpoint'` within 500 m → +25 (§10.3) |
| 3 | **Embalse / lago (reservoir, lake)** | *"noche junto al agua"*, *"embalse tranquilo"*, *"pantano"* — flat ground, fishing, calm | No inland-water qualifier; rivers/reservoirs only appeared as scenic sub-score | `natural='water'` / `landuse='reservoir'` ≥ 1 ha within 300 m → +20 (§10.3) |
| 4 | **Alpine pass / clearing** | *"puerto de montaña"*, *"subida al refugio"* — cool summer nights, dramatic views | Threshold at 1200 m excluded many Iberian passes; vision gate killed rocky spots | Threshold lowered to 1000 m; ai soft-weight replaces hard gate (§10.1, §10.2) |
| 5 | **Forest dead-end / dense pine** | *"final de pista forestal"*, *"entre pinos"* — shade, privacy, sound of wind | Forest canopy crashed `obstruction_absence`; vision gate blocked `wild_bonus` | Soft-weight retains ~70 % of bonus at ai ~40; new forest-dense CORINE 311/312 qualifier (§10.3) |
| 6 | **Dehesa / open meadow** | *"campo abierto"* — mentioned, but usually as *passing through*, not destination | V3 inadvertently optimised for this (top-30 was 80 % dehesa) | No new bonus; dehesa ranks on natural fraction + terrain only, never triggers archetype cap lift |

Secondary signals mentioned but NOT added to V3.1 (too noisy or already covered):

- *"Sin cobertura"* (no phone signal) — impossible to compute reliably from OSM, correlates strongly with `place` distance which is already penalised.
- *"Sin basura, sin vecinos"* (no trash, no neighbours) — already covered by building-distance tiers (§10.4).
- *"Cerca de una fuente"* (near a drinking-water fountain) — already in V2 amenities sub-score, no change.

Anti-signals (reasons vanlifers *avoid* a spot) that informed V3.1 penalties:

- **Urbanisations, fincas with pools** — the #1 complaint in audit. Drives the new 50 m / 100 m building tiers (§10.4).
- **Quarries, gravel pits, industrial yards** — often look "flat and open" on satellite but are depressing and often gated. Drives the on-spot intersect penalty (§10.4).
- **Villages with dogs / neighbours who call the Guardia Civil** — drives the new 500 m `place=village/town` penalty (§10.4).

National Parks in Spain explicitly **ban overnight stays** (Ordesa, Picos de Europa, Doñana, Teide, etc.). This is a *legal* signal and MUST NOT enter the score (V2/V3 §4). It is surfaced in the spot detail checklist and filtered at query time via `hide_restricted`. The community still *visits* these parks by day and sleeps just outside — which V3.1 now rewards naturally via proximity to alpine / viewpoint / forest-dense signals that cluster around park peripheries.

## 11. V3.2 Tuning (2026-04-17)

### 11.0. Why V3.2

V3.1 first re-score (82,970 spots) produced **97 spots tied at exactly 100.0** and ~2,300 spots at composite ≥ 80. Top-30 visual audit: **7/30 clean (23 %)** — marginal improvement over V3's 20 %. The leaderboard saturated because:

1. **Cap absorbed the signal.** Base score (terrain 15 % + ai 20 % + context 35 %) tops out near 50 for a competent spot; wild bonus cap 65 weighted to ~50; adjustment cap ±50 — sum always hits 100 whenever any archetype matched.
2. **`water_feature` matched `waterway=river|stream` lines.** Rural Spain has streams everywhere — free +20 for almost every spot in a valley.
3. **Viewpoint 1000 m tier too generous** — a tourist mirador 800 m away gave +10 to a tourist car-park tile (e.g., osm_id 425704806 — a parking lot with cars visible scored 100).
4. **Alpine threshold at 1000 m was too low** for Iberian mesetas — dry Aragón/Castilla plateaus at 1050 m scored like Pyrenean passes.
5. **`natural_fraction` supporting bonus too large.** +15 at ≥ 40 % pushed marginal dehesa into the top tier when stacked with any archetype.
6. **Building proximity capped at 200 m** — cortijos and fincas 200–500 m away escaped all penalty (CORINE 25 ha MMU cannot see them, SIOSE-AR still deferred).

V3.2 is a **numerical tuning** revision. No new signals, no architectural change, no data-model change. Same pipeline, same qualifier paths, tighter values.

### 11.1. Formula constants (tuning)

| Constant | V3.1 | V3.2 |
|----------|------|------|
| `WILD_BONUS_CAP` (pre-weighting) | 65 | **40** |
| `ADJUSTMENT_CAP` (wild − penalty) | ±50 | **±35** |
| `ARCHETYPE_CAP` (without strong archetype) | 75 | **80** |
| `PENALTY_CAP` | 60 | 60 |

Lower bonus cap + lower adjustment cap squeezes the top of the distribution; raising the archetype cap to 80 means "strong archetype" gatekeeps the top 20 points of the score.

### 11.2. Wild bonus table (supersedes §10.3)

Cap 40 pre-weighting.

| Signal | V3.1 | V3.2 |
|--------|------|------|
| Coastal qualifier hit | +25 | +25 |
| Scenic viewpoint within 300 m (new tight tier) | — | **+20** |
| Scenic viewpoint within 500 m (replaces 300-500) | +25 @ ≤500 | **+10** |
| Scenic viewpoint within 1000 m | +10 | **removed** |
| Water polygon ≥ 5 ha within 200 m (new strong tier) | — | **+18** |
| Water polygon ≥ 1 ha within 300 m (soft tier) | +20 (poly or line) | **+10** |
| Waterway `river` / `stream` line | counted | **removed** |
| Alpine ≥ 1500 m | +20 | **+15** |
| Alpine ≥ 1000 m (< 1500) | +12 | **+5** |
| Alpine ≥ 600 m (< 1000) | +5 | **+2** |
| Forest dense CORINE 311/312 ≥ 40 % in 500 m | +20 | **+15** |
| Forest dense CORINE 311/312 ≥ 25 % in 500 m | +12 | **+8** |
| Natural fraction ≥ 40 % (supporting only) | +15 | **+6** |
| Natural fraction ≥ 25 % (supporting only) | +8 | **+3** |
| Vision `van_presence ≥ 5` | +15 | **+10** |
| Vision `van_presence ≥ 2` (< 5) | +5 | **+3** |

### 11.3. Land-cover penalty (additive tier)

Supersedes §10.4 for `building_dist`.

| Signal | V3.1 | V3.2 |
|--------|------|------|
| Within 50 m of `building=*` | −40 | −40 |
| Within 100 m of `building=*` | −25 | −25 |
| Within 200 m of `building=*` | −15 | −15 |
| Within 500 m of `building=*` (**new**) | — | **−8** |

Building tiers still use the tightest matching distance only (not stacked). All other penalties unchanged from §10.4.

### 11.4. Strong vs. weak archetypes

Replaces §10.5. The archetype cap now has two tiers.

**Strong archetypes** (composite > 80 requires at least one):

- Coastal qualifier
- Alpine ≥ 1500 m
- Water polygon ≥ 5 ha within 200 m
- Forest dense ≥ 40 % CORINE 311/312 within 500 m
- Forest dead-end

**Weak archetypes** (let a spot qualify as "wild" but cap composite at 80):

- Scenic viewpoint (any tier)
- Alpine 1000–1500 m
- Water ≥ 1 ha at 200–300 m
- Forest dense 25–40 %

A spot with only weak archetypes keeps its base + bonus (still better than the no-archetype 75 cap would have given it in V3.1), but it cannot reach 81+.

### 11.5. Signal queries (revised)

- `water_feature_dist` — polygons only (`natural='water'` OR `landuse='reservoir'`). Streams/rivers removed. Query still returns nearest distance within 300 m; code tiers by area.
- `viewpoint_dist` — search radius tightened to 500 m (was 1000 m).
- `building_dist` — search radius expanded to 500 m (was 200 m). Code tiers at 50/100/200/500.
- All other queries unchanged.

### 11.6. Acceptance re-target

§8.4 target ≥ 85 % clean stands. Revised intermediate milestones:

- V3.2 first re-score: ≥ 35 % clean in top-30 (stepwise from V3.1's 23 %).
- V3.2 second pass (post-tune): ≥ 55 %.
- V3.3+ tuning: ≥ 75 %.
- Ship when ≥ 85 %.

---

## 12. V4 — Vision-primary scoring (2026-04-17)

Supersedes §10 and §11. V3.x kept stacking weak proxies (CORINE forest density, OSM buildings, scenic viewpoint) — each ~70–80 % precise in rural Spain, and multiplying weak signals amplified noise as much as signal. The V3.2 audit (9/30 clean, 30 %) showed the ceiling: CORINE 311/312 classifies dehesa and olive groves as dense forest, and rural OSM buildings are chronically under-mapped.

V4 flips the approach: **trust the satellite image, not the proxies.** Claude Vision already scores every spot on five sub-scores (`surface_quality`, `vehicle_access`, `open_space`, `van_presence`, `obstruction_absence`) — exactly what a vanlifer looks for. We were using that output as a soft 0.5–1.0 multiplier on wild_bonus. V4 promotes it to the primary signal.

### 12.1. Composite formula

```
base       = terrain_score * 0.10 + ai_score * 0.55 + context_score * 0.15
adjustment = clamp(-25, +25, wild_bonus_gated − landcover_penalty)
composite  = clamp(0, 100, base + adjustment)
composite  = apply_archetype_cap(composite, wild_paths)       # §12.4
```

Base weights sum to 0.80 (not 1.0): the remaining 0.20 headroom is where archetype bonuses push great spots above merely-good spots. `ai_score` dominates because it's the best-validated signal we have (per-spot Vision output).

### 12.2. Wild-bonus AI gate

`wild_bonus` is applied only if Vision validates the spot. Otherwise `wild_bonus_gated = 0`.

**Gate passes when** all three hold:

- `ai_details.surface_quality ≥ 6`
- `ai_details.open_space ≥ 6`
- `ai_details.obstruction_absence ≥ 6`

Spots without `ai_details` (MobileNetV2-only) get `wild_bonus_gated = 0.5 * wild_bonus_raw` as a conservative fallback.

This replaces the V3.1 soft AI-weight (§10.1). It's softer than the V3 hard vision gate (rejected for over-rejecting low-risk spots) because it only gates the bonus — the base is untouched.

### 12.3. Archetype paths (trimmed)

CORINE forest_dense is **removed** as a qualifier — it cannot distinguish dehesa / olive groves from real forest in Spain. Vision's `obstruction_absence` and `surface_quality` are the truth on canopy/openness.

**Strong archetypes** (composite > 80 requires at least one):

- Coastal qualifier (natural=coastline OR beach near coastline, ≤ 1500 m)
- Alpine ≥ 1500 m
- Water polygon ≥ 5 ha within 200 m
- Forest dead-end (OSM `noexit=yes` on a track in CORINE forest/scrub — still uses CORINE, but only as a permission, not as a bonus)

**Weak archetypes** (composite caps at 80):

- Scenic viewpoint ≤ 300 m (500 m tier removed — too generous)
- Alpine 1000–1500 m
- Water polygon ≥ 1 ha at 200–300 m

No-archetype **cap lowered to 60** (was 80). A spot with no archetype path and only `natural_fraction` support cannot enter the top bucket, regardless of AI or context scores. This forces the top-N to be actual archetypes, not generic rural.

### 12.4. Archetype cap

```
if any(p in STRONG_ARCHETYPE_PATHS_V4 for p in paths): return composite
if any(p in WEAK_ARCHETYPE_PATHS_V4   for p in paths): return min(composite, 80)
return min(composite, 60)
```

### 12.5. Wild-bonus table (V4)

Raw bonus cap: **30** (was 40 in V3.2). With base contributions higher and adjustment capped at ±25, a tight bonus keeps the ranking tight.

| Signal | V4 raw bonus |
|--------|-------------|
| Coastal qualifier | +20 |
| Scenic viewpoint ≤ 300 m | +12 |
| Water polygon ≥ 5 ha within 200 m | +15 |
| Water polygon ≥ 1 ha at 200–300 m (weak tier) | +6 |
| Alpine ≥ 1500 m | +12 |
| Alpine 1000–1500 m | +4 |
| Elevation ≥ 600 m (< 1000, supporting) | +1 |
| Forest dead-end (strong) | +10 |
| Natural fraction ≥ 40 % (supporting) | +3 |
| Natural fraction ≥ 25 % (supporting) | +1 |
| Vision `van_presence ≥ 5` | +8 |
| Vision `van_presence ≥ 2` (< 5) | +2 |

`natural_fraction` and the low-elevation tier are **supporting-only** — they add bonus only when another archetype qualifies, same as V3.1/V3.2.

### 12.6. Penalties — unchanged

§11.3 (V3.2 penalty tiers) still applies. Penalty cap 60. Building tiers 50/100/200/500 → −40/−25/−15/−8.

### 12.7. Constants (workers/scoring_v3.py)

```python
BASE_TERRAIN_W_V4 = 0.10
BASE_AI_W_V4      = 0.55
BASE_CONTEXT_W_V4 = 0.15
WILD_BONUS_CAP_V4 = 30.0
ADJUSTMENT_CAP_V4 = 25.0
NO_ARCHETYPE_CAP_V4 = 60.0
WEAK_ARCHETYPE_CAP_V4 = 80.0
STRONG_ARCHETYPE_PATHS_V4 = {"coastal", "alpine_strong",
                             "water_feature_strong", "forest_dead_end"}
WEAK_ARCHETYPE_PATHS_V4   = {"scenic_viewpoint", "alpine", "water_feature"}
```

### 12.8. Acceptance

Expected top-30 shift:

- Bad: all dehesa / olive-grove spots drop out (no archetype → cap 60).
- Bad: buildings-within-view spots drop (AI obstruction_absence < 6 → gate fails → bonus = 0, and context already penalises).
- Good: coastal beaches, alpine clearings, large reservoirs, forest dead-ends rise.

Target: ≥ 50 % clean first pass. Ship when ≥ 85 %.
