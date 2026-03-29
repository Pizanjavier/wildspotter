# WildSpotter — Product Specification (V2)

> This document supersedes `SPEC.md` as the source of truth for the application's product definition, features, architecture, and data model.

## 1. Product Overview

WildSpotter is an advanced geographical exploration tool for the overland and vanlife community. Unlike user-generated directories (e.g., Park4night) that lead to massification of natural spots, WildSpotter acts as a **"radar"** — processing raw geographic, topographic, legal, and satellite data to probabilistically identify undiscovered, flat, and legally viable overnight parking spots in the wild.

- **Target Region:** Spain (full country coverage).
- **Platform Priority:** Mobile-first (iOS & Android). Desktop/web is secondary.

## 2. Core Features

Features are listed in pipeline order. Each module feeds the next.

### 2.1. The Area Scanner (Interactive Map)

- **Vector Mapping:** High-performance MapLibre map allowing users to pan, zoom, and explore regions.
- **Bounding Box Selection:** Users define a search area (mountain range, coastal stretch) to query pre-processed spots from the backend.
- **Offline Cache:** Previously queried areas and their results are cached locally (AsyncStorage) for connectivity-free use on the road.
- **My Location:** A floating button (bottom-right) centers the map on the user's current GPS position and zooms to street level. Requests location permission on first use. A blue dot marks the user's position on the map.

### 2.2. The "Radar" (Infrastructure Filtering)

The Radar identifies candidate spots from OpenStreetMap data stored in a local PostGIS database.

- **Target Geometries:**
  - Dead ends of dirt, gravel, or unpaved tracks (`noexit=yes`).
  - Informal dirt parkings near points of interest (viewpoints, beaches).
  - Clearings accessible by motor vehicles, filtering out narrow hiking or biking trails.
- **Data Source:** Full Spain OSM dataset imported locally via Geofabrik `.pbf` files and kept current with daily `.osc` diffs. No dependency on the public Overpass API.

### 2.3. The "Topographer" (Elevation Analysis)

- **Incline Check:** Evaluates terrain slope at each candidate spot's coordinates.
- **Data Stored, Not Filtered:** Slope and elevation values are always stored. No spots are rejected by the pipeline — filtering is the user's choice at query time via configurable preferences (e.g., max slope threshold).
- **Data Source:** Terrain-RGB tiles (Terrarium encoding) from AWS Open Data or IGN Spain, processed server-side.

### 2.4. The "Legal Judge" (Restriction Cross-Referencing)

- **Environmental Protection Check:** Cross-references spots against official environmental boundaries:
  - Red Natura 2000 zones
  - National Parks and Natural Parks
  - Coastal Law zones (Ley de Costas)
- **Cadastre / Public Land Check:** Determines if land is strictly private (fenced) or public utility forestry.
- **Visual Warnings:** Spots inside protected polygons are clearly marked with warnings. No spots are rejected — legal data is stored and the user can toggle "Hide restricted areas" in preferences to filter them out at query time.
- **Data Sources:** WMS services from MITECO, Sede Electrónica del Catastro, and IGN.

### 2.5. The "Satellite Eye" (AI Visual Validation)

- **Selective Analysis:** Triggered for all spots that complete the Terrain and Legal stages. Since no spots are rejected, all candidates receive AI analysis.
- **Object Detection:** A custom-trained lightweight model detects:
  - Open mineral ground / clearings suitable for parking.
  - Absence of dense tree canopy blocking vehicle access.
  - Parked vans/campers — a strong positive signal of community usage.
- **Training Strategy:** Build a labeled dataset of satellite tiles from known good/bad spots, rather than relying on generic pre-trained classifiers.
- **Data Sources:** IGN Spain PNOA orthophotos (primary, 25cm/pixel resolution across Spain, free, no API key), Bing Maps Static API (fallback).

### 2.6. The "Context Analyst" (Spatial Context Scoring)

After AI inference, each spot is evaluated against its surrounding geographic context using PostGIS spatial queries against the imported OSM data. This stage produces a `context_score` (0-100) and a `context_details` JSONB breakdown. No external API calls are needed — all data comes from the local PostGIS database.

#### Context Sub-Scores

| Factor | Query Strategy | Score Effect | Rationale |
|--------|---------------|-------------|-----------|
| **Road noise** | Distance to nearest road by `highway` class | Graduated penalty: motorway <200m = -40, trunk <200m = -30, primary <150m = -20, secondary <100m = -10, track = 0 | Traffic noise is the #1 vanlife complaint. Graduated by road importance. |
| **Urban density** | Count `building=*` polygons within 300m radius | 0 buildings = +20 bonus, 1-5 = neutral, 6-20 = -10, 20+ = -25 | Dense housing means complaints and "the knock". A few buildings (farmhouse, beach bar) are fine. |
| **Scenic value** | Proximity to `natural=beach/water/cliff/peak`, `tourism=viewpoint`, `waterway=river/stream` | Bonus: beach <500m = +25, viewpoint <1km = +15, water feature <500m = +10 | Scenic spots are the reason vanlifers travel. Your Playa de la Calera scores high here. |
| **Privacy** | Spot type bonus + distance from populated `place=*` nodes | Dead-end = +15, track endpoint = +10. Town <1km = -10, city <3km = -15 | Dead-end tracks provide natural seclusion. |
| **Industrial/commercial** | Intersect with `landuse=industrial/commercial/retail/quarry` within 500m | Present = -20 | Factories, malls, quarries make spots unpleasant. |
| **Railway noise** | Distance to `railway=rail` | <150m = -15, 150-500m = -5 | Train noise at night. |
| **Van community signal** | Count nearby `tourism=caravan_site` or `amenity=parking` with camping tags within 5km | Present = +10 | Indicates area tolerance for overnight vans. |

The base context score starts at 50 (neutral) and is adjusted by the sum of all sub-score bonuses/penalties, clamped to 0-100.

### 2.7. Success Probability Score

Every spot that completes the full pipeline (including context analysis) receives a composite score (0-100):

- **Weighting (tunable):**
  - **Terrain:** 20% — slope and flatness suitability
  - **AI (Satellite Eye):** 25% — ground surface quality, van detection, canopy analysis
  - **Context:** 55% — spatial surroundings quality (road noise, urban density, scenic value, privacy)
- **Legal data** is informational — it does not gate scoring. All spots receive a composite score regardless of legal status. Users can toggle "Hide restricted areas" in preferences to filter at query time.
- **User-Side Filtering:** The API supports query-time filters (`max_slope`, `hide_restricted`, `min_score`) so users can customize which spots they see via the Config screen, without discarding any data from the database.
- **Color-Coded Display:**
  - Green (`#4ADE80`): 80+ (high confidence)
  - Cyan (`#22D3EE`): 60-79 (medium confidence)
  - Amber (`#FBBF24`): <60 (low/warning)

### 2.8. The Google Maps Bridge (Manual Validation & Navigation)

- **Spot Dashboard:** Displays the score alongside metrics: surface type, slope %, elevation, legal status checklist.
- **Deep Linking:**
  - *Inspect:* Opens coordinates in Google Maps Satellite/Street View for human validation.
  - *Navigate:* Launches GPS turn-by-turn navigation to the spot.

## 3. Architecture

### 3.1. Architecture Philosophy: Backend-Centric + Lightweight Client

All heavy processing (geographic filtering, terrain analysis, legal cross-referencing, AI inference) runs on a Dockerized backend stack. The React Native app is a thin client that consumes pre-processed data via a JSON API. This approach:

- **Eliminates battery drain** from on-device AI and terrain math.
- **Builds a persistent dataset** of Spain's wild spots that improves over time.
- **Works on weak connectivity** — lightweight JSON payloads vs. heavy tile downloads.
- **Runs 100% locally** for development via Docker Compose (zero cloud cost for MVP).

### 3.2. System Components

| Component | Technology | Role |
|-----------|-----------|------|
| **Mobile Client** | React Native / Expo (TypeScript) | UI, map rendering, user location, API consumption, offline caching |
| **Backend API** | Fastify (TypeScript) | Serves processed spot data as JSON to the mobile app |
| **Database** | PostgreSQL + PostGIS | Hosts Spain OSM data, terrain/legal/AI results, spatial indexing |
| **Orchestration** | n8n | Scheduled data ingestion (Geofabrik diffs) and processing pipelines |
| **Processing Worker** | Python | Terrain-RGB analysis, WMS legal checks, AI model inference |

> **Hybrid rationale:** The API is TypeScript (shared language with the React Native frontend, shared types, single toolchain). Processing workers remain Python because the GIS/AI ecosystem (GDAL, ONNX Runtime, numpy, rasterio) has no viable Node.js equivalent.

### 3.3. Frontend & Framework

- **Framework:** React Native with Expo (Expo Router).
- **Rationale:** Mobile-first, single codebase for iOS and Android. Expo Web provides secondary desktop experience.
- **Known Trade-off:** MapLibre integration in RN is less mature than the web version. Fallback: embed MapLibre GL JS in a WebView if needed.

### 3.4. Mapping & Rendering

- **Map Engine:** MapLibre GL JS (via `@maplibre/maplibre-react-native`).
- **Rationale:** Open-source, high-performance vector maps without Google Maps or Mapbox licensing costs.
- **Terrain Visualization:** MapLibre raster-dem sources for hillshade rendering on the client. Elevation data for scoring is processed server-side.

### 3.5. Data Sources

| Data | Source | Processing Layer |
|------|--------|-----------------|
| **Spot Geometry (OSM)** | Geofabrik `spain-latest.osm.pbf` + daily `.osc` diffs | Imported into PostGIS via `osm2pgsql` (backend) |
| **Elevation** | Terrain-RGB tiles (AWS Open Data / IGN Spain) | Processing Worker (backend) |
| **Legal & Cadastre** | WMS: MITECO, Catastro, IGN | Processing Worker (backend) |
| **Satellite Imagery** | IGN Spain PNOA orthophotos (primary), Bing Maps Static API (fallback) | Processing Worker (backend), cached to disk |

### 3.6. Artificial Intelligence & Processing

- **Engine:** ONNX Runtime or PyTorch (server-side). No longer on-device.
- **Model:** Custom-trained lightweight detection model (quantized YOLO variant or similar) optimized for:
  - Ground surface classification (mineral/dirt vs. vegetation).
  - Vehicle detection (vans, campers) as positive community signal.
  - Canopy density estimation.
- **Inference Strategy:** Batch processing via pipeline orchestrator (`run_pipeline.py`). Model runs on all spots that have completed Terrain and Legal stages — no spots are filtered out before inference.

## 4. Data Model

### 4.1. Spots Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `osm_id` | BIGINT | Original OSM node/way ID (unique) |
| `name` | VARCHAR | Human-readable name from OSM (if available) |
| `geom` | GEOMETRY(Point, 4326) | Spatial coordinates (Lon, Lat) |
| `spot_type` | VARCHAR | `dead_end`, `dirt_parking`, `clearing`, `viewpoint_adjacent` |
| `surface_type` | VARCHAR | OSM `surface` tag: `dirt`, `gravel`, `grass`, `asphalt`, `unknown` |
| `osm_tags` | JSONB | Raw OSM tags |
| `elevation` | FLOAT | Elevation in meters |
| `slope_pct` | FLOAT | Slope percentage |
| `terrain_score` | FLOAT | Terrain suitability (0-100) |
| `legal_status` | JSONB | Structured legal results per check |
| `ai_score` | FLOAT | AI visual validation (0-100) |
| `context_score` | FLOAT | Spatial context quality (0-100) |
| `context_details` | JSONB | Breakdown of context sub-scores |
| `composite_score` | FLOAT | Weighted final score (0-100) |
| `satellite_image_path` | VARCHAR | Cached satellite tile path |
| `status` | VARCHAR | `pending`, `terrain_done`, `legal_done`, `ai_done`, `context_done`, `completed` |
| `created_at` | TIMESTAMPTZ | Ingestion timestamp |
| `updated_at` | TIMESTAMPTZ | Last processed timestamp |

### 4.2. Legal Status Structure

```json
{
  "natura2000": { "inside": false, "zone_name": null },
  "national_park": { "inside": false, "park_name": null },
  "coastal_law": { "inside": false, "distance_m": null },
  "cadastre": { "classification": "public_forestry", "private": false },
  "blocked": false
}
```

### 4.3. Context Details Structure

```json
{
  "road_noise": { "score": -10, "nearest_road": "secondary", "distance_m": 85 },
  "urban_density": { "score": 0, "building_count": 3, "radius_m": 300 },
  "scenic_value": { "score": 25, "features": ["beach_nearby"] },
  "privacy": { "score": 15, "is_dead_end": true, "nearest_place": "village", "place_distance_m": 2100 },
  "industrial": { "score": 0, "nearby": false },
  "railway": { "score": 0, "distance_m": null },
  "van_community": { "score": 10, "caravan_sites_5km": 1 }
}
```

### 4.4. Sync State Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | PK |
| `last_sequence` | INTEGER | Last Geofabrik diff sequence applied |
| `last_sync_at` | TIMESTAMPTZ | Timestamp of last sync |

## 5. Design Reference

Mockups are in `design/wildspotter-mockup-v2.pen` (editable) and exported as PNGs in `design/`.

### 5.1. Visual Style

- **Aesthetic:** Dark command-center / radar theme — deep navy (`#0A0F1C`) background, slate card surfaces (`#1E293B`), electric cyan (`#22D3EE`) accent.
- **Typography:** JetBrains Mono for data values, scores, and labels. Inter for titles and body text.

### 5.2. Screen Flow

#### Map View (`design/map-view.png`)
Full-screen dark vector map with floating search bar, "SCAN THIS AREA" radar button, and a draggable bottom sheet showing result previews. Pill-style tab bar (Map / Spots / Legal / Config).

#### Scan Results (`design/scan-results.png`)
Expanded bottom sheet listing all discovered spots with score badges. Pipeline filter indicators at the top show the funnel: Radar → Topographer → Legal → AI.

#### Spot Detail (`design/spot-detail.png`)
Satellite preview with AI/van-detection badges. Metrics cards (surface, slope, elevation), legal status checklist with green checkmarks, and dual action buttons: Inspect (Google Maps satellite) and Navigate (turn-by-turn).

#### Config (`design/wildspotter-mockup-v2.pen` → Config frame)
Settings screen with Preferences section (max slope threshold input, hide restricted areas toggle, offline mode toggle) and About section (version, tagline). Filter preferences are applied at query time — they do not reject or delete data, only control what the API returns.
