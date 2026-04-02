# WildSpotter Backend Architecture

Complete documentation for developers who need to understand, operate, and extend the backend processing stack.

---

## 1. System Overview

```
 +------------------------------------------------------------------------------------+
 |                              EXTERNAL DATA SOURCES                                 |
 |                                                                                    |
 |  +------------------+  +------------------+  +---------------+  +---------------+  |
 |  | AWS Terrarium    |  | MITECO Shapefiles|  | Catastro REST |  | IGN PNOA      |  |
 |  | Elevation Tiles  |  | Natura 2000      |  | Land Registry |  | Satellite     |  |
 |  | (z15 PNG)        |  | Parks, Coastal   |  | API           |  | (z17 JPEG)    |  |
 |  +--------+---------+  +--------+---------+  +-------+-------+  +-------+-------+  |
 +-----------|----------------------|----------------------|----------------|----------+
             |                      |                      |                |
             v                      v                      v                v
 +------------------------------------------------------------------------------------+
 |                          DOCKER COMPOSE STACK                                      |
 |                        (wildspotter-net bridge)                                    |
 |                                                                                    |
 |  +----------------------------------------------------------------------+          |
 |  |                    PYTHON WORKER (:8001)                             |          |
 |  |                                                                      |          |
 |  |  +------------+  +----------+  +--------------+  +-----------+       |          |
 |  |  | terrain.py |  | legal.py |  | ai_inference |  | scoring   |       |          |
 |  |  | Slope calc |  | PostGIS  |  | Keras/ONNX   |  | Composite |       |          |
 |  |  +------+-----+  +----+-----+  +------+-------+  +-----+-----+       |          |
 |  |         |              |               |                |             |          |
 |  |         +------- SQL --+------- SQL ---+------ SQL -----+             |          |
 |  |                        |                                              |          |
 |  |  +------------+        |                                              |          |
 |  |  | api.py     |  Flask API for n8n + monitoring                       |          |
 |  |  | /run/*     |  /status  /progress  /dashboard                       |          |
 |  |  | /reset/*   |  /reset/ai  /reset/all  /reset/stage                  |          |
 |  |  +------+-----+                                                       |          |
 |  +---------|-------------------------------------------------------------+          |
 |            |                                                                        |
 |            |  HTTP POST /run/*                                                      |
 |            |                                                                        |
 |  +---------+-------------------+                                                    |
 |  |        n8n (:5678)          |                                                    |
 |  |  Scheduled every 5 min     |                                                    |
 |  |  Sequential pipeline       |                                                    |
 |  +-----------------------------+                                                    |
 |                                                                                    |
 |            SQL (read/write)                                                         |
 |  +---------+-------------------+        +----------------------------------+        |
 |  |  PostgreSQL + PostGIS       |        |  FASTIFY API (:8000)             |        |
 |  |  (:5432 internal)           | SQL    |                                  |        |
 |  |  (:5433 external)           |<------>|  GET /spots (bbox query)         |        |
 |  |                             |        |  GET /spots/:id (detail)         |        |
 |  |  spots table                |        |  GET /satellite/:file            |        |
 |  |  sync_state table           |        |  GET /health                     |        |
 |  +-----------------------------+        +----------------+-----------------+        |
 |                                                          |                          |
 +----------------------------------------------------------|-------------------------+
                                                            |
                                                            | JSON over HTTP
                                                            v
                                                 +---------------------+
                                                 | React Native App    |
                                                 | (Expo)              |
                                                 |                     |
                                                 | MapLibre GL map     |
                                                 | Score badges        |
                                                 | Spot detail cards   |
                                                 | Google Maps bridge  |
                                                 +---------------------+
```

### Network and Ports

```
  HOST MACHINE                    DOCKER NETWORK (wildspotter-net)
 +-------------------+           +-----------------------------------+
 |                   |   :5433   |  db       (PostgreSQL)   :5432    |
 |  Browser/App  ----+---------->|                                   |
 |                   |   :8000   |  api      (Fastify)     :8000    |
 |               ----+---------->|                                   |
 |                   |   :8001   |  worker   (Python)      :8001    |
 |               ----+---------->|                                   |
 |                   |   :5678   |  n8n      (Orchestrator) :5678   |
 |               ----+---------->|                                   |
 +-------------------+           +-----------------------------------+
```

| Service  | Internal Port | Exposed Port | Protocol |
|----------|--------------|--------------|----------|
| db       | 5432         | 5433         | PostgreSQL |
| api      | 8000         | 8000         | HTTP (JSON) |
| worker   | 8001         | 8001         | HTTP (JSON) |
| n8n      | 5678         | 5678         | HTTP (Web UI) |

All services communicate over the `wildspotter-net` Docker bridge network. Internal service names (`db`, `api`, `worker`) resolve via Docker DNS.

---

## 2. Docker Compose Stack

```
 docker-compose.yml
 ==================

 +--[ db ]------------------------------+     +--[ api ]----------------------------+
 |  PostgreSQL 16 + PostGIS 3           |     |  Node 20 slim                      |
 |  Port: 5433:5432                     |     |  Port: 8000:8000                   |
 |                                      |     |  CMD: npx tsx src/index.ts         |
 |  Volumes:                            |     |                                    |
 |    pgdata -> /var/lib/postgresql/data |     |  Volumes:                          |
 |    ./db/init.sql -> /docker-entry..  |     |    ./backend -> /app               |
 |                                      |     |    ./data -> /data                 |
 |  Healthcheck: pg_isready (5s)        |     |    satellite_tiles -> /data/tiles  |
 |                                      |     |                                    |
 |  Env: POSTGRES_USER, _PASSWORD, _DB  |     |  Env: DATABASE_URL, PORT,          |
 +--------------------------------------+     |       SATELLITE_DIR                |
        ^                                     |  Depends: db (healthy)             |
        |                                     +------------------------------------+
        |
 +--[ worker ]---------------------------+    +--[ n8n ]----------------------------+
 |  Python 3.12 slim + libgdal           |    |  n8nio/n8n (official)              |
 |  Port: 8001:8001                      |    |  Port: 5678:5678                   |
 |  CMD: python api.py                   |    |                                    |
 |                                       |    |  Volumes:                          |
 |  Volumes:                             |    |    n8n_data -> /home/node/.n8n     |
 |    ./workers -> /app                  |    |                                    |
 |    ./models -> /models                |    |  Env: N8N_BASIC_AUTH_ACTIVE,       |
 |    ./data -> /data                    |    |       DB_TYPE=postgresdb,          |
 |    satellite_tiles -> /data/tiles     |    |       DB_POSTGRESDB_HOST/PORT/...  |
 |                                       |    |  Depends: db (healthy)             |
 |  Env: DATABASE_URL                    |    +------------------------------------+
 |  Depends: db (healthy)                |
 +---------------------------------------+

 Named Volumes: pgdata, n8n_data, satellite_tiles
```

### 2.1. `db` -- PostgreSQL + PostGIS

| Property | Value |
|----------|-------|
| Build context | `./db` |
| Dockerfile | `db/Dockerfile` (PostgreSQL 16 + PostGIS 3) |
| Exposed port | `5433:5432` |
| Volumes | `pgdata:/var/lib/postgresql/data`, `./db/init.sql` mounted to `/docker-entrypoint-initdb.d/` |
| Healthcheck | `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB` every 5s |

The `init.sql` script runs automatically on first boot, creating the PostGIS extension, `spots` table, `sync_state` table, and all indexes.

### 2.2. `api` -- Fastify API

| Property | Value |
|----------|-------|
| Build context | `./backend` |
| Dockerfile | `backend/Dockerfile` (Node 20 slim, `npx tsx src/index.ts`) |
| Exposed port | `8000:8000` |
| Volumes | `./backend:/app` (live reload), `./data:/data`, `satellite_tiles:/data/tiles` |
| Depends on | `db` (healthy) |

### 2.3. `worker` -- Python Processing Worker

| Property | Value |
|----------|-------|
| Build context | `./workers` |
| Dockerfile | `workers/Dockerfile` (Python 3.12 slim + libgdal + osm2pgsql) |
| Exposed port | `8001:8001` |
| Command | `python api.py` |
| Volumes | `./workers:/app`, `./models:/models`, `./data:/data`, `satellite_tiles:/data/tiles` |
| Depends on | `db` (healthy) |

Python dependencies (`requirements.txt`):

- `psycopg2-binary` -- PostgreSQL driver
- `requests` -- HTTP client for Catastro REST API and tile downloads
- `Pillow` -- image processing
- `numpy` -- numerical computation (terrain, heuristics)
- `flask` -- HTTP API for n8n integration
- `tensorflow` -- Keras model inference (MobileNetV2)

### 2.4. `n8n` -- Workflow Orchestrator

| Property | Value |
|----------|-------|
| Image | `n8nio/n8n` (official) |
| Exposed port | `5678:5678` |
| Volumes | `n8n_data:/home/node/.n8n` |
| Depends on | `db` (healthy) |

---

## 3. Database (PostgreSQL + PostGIS)

### 3.1. Schema Initialization (`db/init.sql`)

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS hstore;

-- Main table: every candidate spot and all its processing results
CREATE TABLE spots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    osm_id              BIGINT UNIQUE,
    name                VARCHAR,
    geom                GEOMETRY(Point, 4326),
    spot_type           VARCHAR,
    surface_type        VARCHAR,
    osm_tags            JSONB,
    elevation           FLOAT,
    slope_pct           FLOAT,
    terrain_score       FLOAT,
    legal_status        JSONB,
    ai_score            FLOAT,
    composite_score     FLOAT,
    satellite_image_path VARCHAR,
    status              VARCHAR DEFAULT 'pending',
    rejection_reason    VARCHAR,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- OSM data sync tracking
CREATE TABLE sync_state (
    id              SERIAL PRIMARY KEY,
    last_sequence   INTEGER,
    last_sync_at    TIMESTAMPTZ
);

-- Spatial index for bounding box queries (the main app query)
CREATE INDEX idx_spots_geom      ON spots USING GIST (geom);
-- Pipeline batch selection
CREATE INDEX idx_spots_status    ON spots (status);
-- Score-sorted retrieval
CREATE INDEX idx_spots_composite ON spots (composite_score DESC);
-- JSONB queries on OSM tags
CREATE INDEX idx_spots_osm_tags  ON spots USING GIN (osm_tags);
-- JSONB queries on legal status
CREATE INDEX idx_spots_legal     ON spots USING GIN (legal_status);

-- Initial sync state row
INSERT INTO sync_state (last_sequence, last_sync_at) VALUES (0, NULL);
```

### 3.2. Column Reference

```
 spots table
 ===========
 +---------------------+-------------------+------------------------------------------+
 | Column              | Type              | Description                              |
 +---------------------+-------------------+------------------------------------------+
 | id                  | UUID (PK)         | gen_random_uuid()                        |
 | osm_id              | BIGINT (UNIQUE)   | Original OSM node/way ID                 |
 | name                | VARCHAR           | Human name from OSM (nullable)           |
 | geom                | GEOMETRY(Pt,4326) | Lon/Lat WGS84 coordinates                |
 | spot_type           | VARCHAR           | dead_end / dirt_parking / clearing / ...  |
 | surface_type        | VARCHAR           | dirt / gravel / grass / asphalt / unknown |
 | osm_tags            | JSONB             | Raw OSM tags                             |
 |---------------------|-------------------|------------------------------------------|
 | elevation           | FLOAT             | Meters (from Terrain-RGB)                |
 | slope_pct           | FLOAT             | Slope percentage (Horn's method)         |
 | terrain_score       | FLOAT             | 0-100: terrain suitability               |
 |---------------------|-------------------|------------------------------------------|
 | legal_status        | JSONB             | Structured legal results (see below)     |
 |---------------------|-------------------|------------------------------------------|
 | ai_score            | FLOAT             | 0-100: AI visual validation              |
 | satellite_image_path| VARCHAR           | Relative path to cached JPEG             |
 |---------------------|-------------------|------------------------------------------|
 | composite_score     | FLOAT             | 0-100: weighted final score              |
 | status              | VARCHAR           | Pipeline stage (state machine)           |
 | rejection_reason    | VARCHAR           | Manual flag reason (nullable)            |
 | created_at          | TIMESTAMPTZ       | Ingestion timestamp                      |
 | updated_at          | TIMESTAMPTZ       | Last processing timestamp                |
 +---------------------+-------------------+------------------------------------------+
```

### 3.3. `legal_status` JSONB Structure

```json
{
  "natura2000":    { "inside": false },
  "national_park": { "inside": false },
  "coastal_law":   { "inside": false },
  "cadastre":      { "classification": "rustic", "private": false, "ref": "33008A04800101" },
  "blocked": false
}
```

`blocked = true` if ANY of: Natura 2000 inside, National Park inside, Coastal Law inside, or Cadastre private. Informational only -- no spots are deleted.

> **Legal GIS tables** (created by ogr2ogr during MITECO shapefile import):
> - `natura2000` (SRID 3042, 1,636 polygons) — Red Natura 2000
> - `national_parks` (SRID 25830, 1,788 polygons) — Espacios Naturales Protegidos
> - `dpmt` (SRID 25830, MULTILINESTRING) — Deslinde DPMT boundary
> - `servidumbre_proteccion` (SRID 25830) — 100m coastal protection easement
> - `terrenos_incluidos_dpmt` (SRID 25830) — Additional public domain terrains
> - `nucleos_excluidos_dpmt` (SRID 25830) — Urban exemption zones (subtracted from costas checks)

### 3.4. Pipeline State Machine

```
                           PIPELINE STATUS FLOW
  ============================================================================

  +----------+     +--------------+     +------------+     +---------+     +-----------+
  | pending  |---->| terrain_done |---->| legal_done |---->| ai_done |---->| completed |
  +----------+     +--------------+     +------------+     +---------+     +-----------+
       ^               terrain.py          legal.py       ai_inference.py    scoring.py
       |                                                                         |
       |                  POST /reset/all  (rewinds everything)                  |
       +-------------------------------------------------------------------------+

  Each worker:
    1. SELECT spots WHERE status = '<input_status>' ORDER BY created_at LIMIT <batch>
    2. Process (external API calls, computation)
    3. UPDATE spots SET <fields>, status = '<output_status>' WHERE id = <spot_id>
```

| Status | Written By | Fields Set | Next Worker |
|--------|-----------|------------|-------------|
| `pending` | osm2pgsql import | geom, osm_id, spot_type, surface_type, osm_tags | terrain.py |
| `terrain_done` | terrain.py | elevation, slope_pct, terrain_score | legal.py |
| `legal_done` | legal.py | legal_status (JSONB) | ai_inference.py |
| `ai_done` | ai_inference.py | ai_score, satellite_image_path | scoring.py |
| `completed` | scoring.py | composite_score | -- (ready for app) |

### 3.5. Index Usage Map

```
  Query                                          Index Used
  =============================================  ========================
  GET /spots?bbox=...                            idx_spots_geom (GiST)
  WHERE status = 'pending' LIMIT N               idx_spots_status (B-tree)
  ORDER BY composite_score DESC                  idx_spots_composite
  WHERE legal_status->>'blocked' = 'false'       idx_spots_legal (GIN)
  WHERE osm_tags @> '{"surface":"dirt"}'         idx_spots_osm_tags (GIN)
```

---

## 4. Fastify API (`backend/`)

The API is the thin layer between the React Native client and the PostGIS database. It serves pre-processed spot data as JSON.

**Base URL:** `http://localhost:8000`

### 4.1. `GET /health`

```
  App ──GET /health──> Fastify ──SELECT 1──> PostgreSQL
                                                |
  App <──{"status":"ok"}──────────────────── <──+
```

**SQL:**
```sql
SELECT 1
```

### 4.2. `GET /spots` -- Bounding Box Query

This is the primary endpoint. Called when the user pans the map or taps "SCAN THIS AREA."

```
  App ──GET /spots?min_lat=36&min_lon=-6&max_lat=37&max_lon=-5──> Fastify
                                                                       |
                                                                       v
                                                               +---------------+
                                                               |  PostgreSQL   |
                                                               |  PostGIS      |
                                                               |  ST_MakeEnv.. |
                                                               +-------+-------+
                                                                       |
  App <──[{id,osm_id,name,coordinates,score,...}, ...]──────────── <───+
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `min_lat` | number | yes | Southern boundary |
| `min_lon` | number | yes | Western boundary |
| `max_lat` | number | yes | Northern boundary |
| `max_lon` | number | yes | Eastern boundary |
| `min_score` | number | no | Minimum composite_score (default: 0) |
| `max_slope` | number | no | Maximum slope percentage filter |
| `hide_restricted` | boolean | no | Exclude blocked spots (default: false) |

**SQL (`backend/src/services/spatial.ts`):**
```sql
SELECT id, osm_id, name,
       ST_X(geom) AS lon, ST_Y(geom) AS lat,
       spot_type, surface_type, slope_pct, elevation,
       legal_status, composite_score, status
FROM spots
WHERE status = 'completed'
  AND geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)   -- spatial bbox filter
  AND (composite_score >= $5 OR composite_score IS NULL) -- min_score
  -- (conditional) AND (slope_pct <= $6 OR slope_pct IS NULL)
  -- (conditional) AND (legal_status->>'blocked' = 'false' OR legal_status IS NULL)
ORDER BY composite_score DESC NULLS LAST
LIMIT 500
```

**Response (200):** Array of spot summaries (max 500), sorted by composite_score DESC.

### 4.3. `GET /spots/:id` -- Spot Detail

**SQL (`backend/src/services/spatial.ts`):**
```sql
SELECT id, osm_id, name,
       ST_X(geom) AS lon, ST_Y(geom) AS lat,
       spot_type, surface_type, osm_tags,
       elevation, slope_pct, terrain_score,
       legal_status, ai_score, composite_score,
       satellite_image_path, status, rejection_reason,
       created_at, updated_at
FROM spots
WHERE id = $1
```

**Response (404):** `{ "error": "Spot not found" }`

### 4.4. `GET /legal/tiles/:z/:x/:y.pbf` -- Legal Zone Vector Tiles

Serves pre-generated Mapbox Vector Tiles (MVT) containing legal restriction zone polygons for the map overlay. Tiles are static `.pbf` files read from disk — no PostGIS queries at runtime.

```
  App ──GET /legal/tiles/8/126/96.pbf──> Fastify
                                            |
                                            v
                                      +-----------+
                                      | /data/    |
                                      | legal-    |
                                      | tiles/    |
                                      +-----+-----+
                                            |
  App <──application/x-protobuf (Cache: 1d)─+
```

**Source layer:** `legal_zones` (with `layer_type` property: `natura2000`, `national_park`, `coastal_servidumbre`, `coastal_terrenos`)

**Tile generation:** `workers/generate_legal_tiles.py` pre-generates tiles at z4–z10 (~1,783 tiles checked, ~1,038 non-empty, ~64 MB total). The script:
1. Creates a materialized view `legal_zones_3857` from 5 legal tables (natura2000, national_parks, servidumbre_proteccion, terrenos_incluidos_dpmt, dpmt with 20m buffer)
2. Clips all geometries to Spain's OSM administrative boundary (removes marine zones)
3. Pre-transforms to EPSG:3857 and subdivides polygons with `ST_Subdivide(geom, 256)` for fast spatial lookups
4. Iterates over Spain's bounding box and writes non-empty tiles to `data/legal-tiles/{z}/{x}/{y}.pbf`

**Note:** The `dpmt` table contains MULTILINESTRING geometries (the DPMT boundary line). Since `legal.py` flags spots within 20m of this line (`ST_DWithin(geom, point, 20)`), the tile generator buffers it to a polygon (`ST_Buffer(geom, 20)`) so the overlay matches the per-spot check.

**Why static tiles:** On-the-fly MVT generation with `ST_AsMVT` was too CPU-intensive — each tile triggered `ST_Transform` + `ST_Intersects` on ~150K+ subdivided polygons. MapLibre requests dozens of tiles simultaneously when panning, saturating the DB connection pool. Legal boundaries change ~once/year when MITECO publishes new shapefiles, so static tiles are the optimal approach. Regenerate with:
```bash
docker-compose exec worker python generate_legal_tiles.py
```

**Response headers:** `Content-Type: application/x-protobuf`, `Cache-Control: public, max-age=86400`

Returns empty buffer (0 bytes) if the tile file doesn't exist (no legal zones in that area).

### 4.5. `GET /satellite/:filename` -- Satellite Image Server

```
  App ──GET /satellite/123456.jpg──> Fastify
                                        |
                                        v
                                  +-----------+
                                  | /data/    |
                                  | satellite |
                                  | _tiles/   |
                                  +-----+-----+
                                        |
  App <──image/jpeg (Cache-Control: 1d)─+
```

Validates filename against regex `^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$`. Directory traversal blocked (403).

---

## 5. Python Worker (`workers/`)

Flask HTTP API on port 8001. Called by n8n or manually via curl.

### 5.1. Monitoring Endpoints

#### `GET /status`

```sql
SELECT status, COUNT(*) FROM spots GROUP BY status ORDER BY status
```

```json
{
  "status": {
    "pending": 12450,
    "terrain_done": 3200,
    "legal_done": 1800,
    "ai_done": 500,
    "completed": 8050
  },
  "running_jobs": { "run_all": false }
}
```

#### `GET /progress`

```sql
-- Status counts
SELECT status, COUNT(*) FROM spots GROUP BY status ORDER BY status

-- Processing rate (last 10 minutes)
SELECT COUNT(*) FROM spots
WHERE status = 'completed'
  AND updated_at > NOW() - INTERVAL '10 minutes'

-- Score distribution
SELECT
    COUNT(*) FILTER (WHERE composite_score >= 80) AS high,
    COUNT(*) FILTER (WHERE composite_score >= 60 AND composite_score < 80) AS medium,
    COUNT(*) FILTER (WHERE composite_score < 60) AS low
FROM spots WHERE status = 'completed'
```

```json
{
  "total_spots": 26000,
  "completed": 18500,
  "progress_pct": 71.2,
  "pipeline": { "pending": 2000, "terrain_done": 1500, "..." : "..." },
  "rate_per_hour": 1200,
  "eta_hours": 6.3,
  "score_distribution": { "high_80plus": 4200, "medium_60_79": 8100, "low_under_60": 6200 }
}
```

Rate is calculated from spots completed in the last 10 minutes, extrapolated to per-hour.

#### `GET /dashboard`

Self-contained HTML page with auto-refresh every 30 seconds. Dark radar theme.

```bash
open http://localhost:8001/dashboard
```

### 5.2. Processing Endpoints

#### `POST /run/terrain`

```bash
curl -X POST http://localhost:8001/run/terrain \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 500, "limit": 500}'
```

#### `POST /run/legal`

```bash
curl -X POST http://localhost:8001/run/legal \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 200}'
```

#### `POST /run/ai`

```bash
curl -X POST http://localhost:8001/run/ai \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 100}'
```

#### `POST /run/scoring`

```bash
curl -X POST http://localhost:8001/run/scoring \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 500}'
```

#### `POST /run/pipeline`

Runs Legal + AI + Scoring in one **sequential** call (legacy).

```bash
curl -X POST http://localhost:8001/run/pipeline \
  -H "Content-Type: application/json" \
  -d '{"legal_batch": 100, "ai_batch": 100, "scoring_batch": 500}'
```

#### `POST /run/parallel` (recommended)

Runs Terrain + Legal + AI in **concurrent threads** (`ThreadPoolExecutor`, 3 workers), then Scoring after all three finish. This is the primary endpoint used by the n8n workflow.

```bash
curl -X POST http://localhost:8001/run/parallel \
  -H "Content-Type: application/json" \
  -d '{"terrain_batch": 500, "terrain_limit": 500, "legal_batch": 100, "ai_batch": 100, "scoring_batch": 500}'
```

```
  Inside the worker (one HTTP call):
  ==================================
  +-- Thread 1: terrain.process_batch(500) --+
  |                                          |
  +-- Thread 2: legal.process_batch(100)   --+--> all done --> scoring.process_batch(500)
  |                                          |
  +-- Thread 3: ai_inference.process_batch --+
                (100)
```

| Body Param | Type | Default | Description |
|------------|------|---------|-------------|
| `terrain_batch` | int | 500 | Terrain batch size |
| `terrain_limit` | int | 500 | Terrain spot limit |
| `legal_batch` | int | 100 | Legal batch size |
| `ai_batch` | int | 100 | AI batch size |
| `scoring_batch` | int | 500 | Scoring batch size |

**Response:**

```json
{
  "results": { "terrain": 487, "legal": 98, "ai": 95, "scoring": 450 },
  "status": { "pending": 11000, "..." : "..." }
}
```

#### `POST /run/all`

Background thread: terrain + full pipeline, multiple passes. Returns immediately.

```bash
curl -X POST http://localhost:8001/run/all \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 500, "passes": 10}'
```

Returns 409 if already running.

### 5.3. Reset Endpoints

#### `POST /reset/ai`

Rewinds `ai_done` + `completed` back to `legal_done`. Clears satellite cache from disk.

**SQL:**
```sql
UPDATE spots
SET ai_score = NULL,
    satellite_image_path = NULL,
    composite_score = NULL,
    status = 'legal_done',
    updated_at = NOW()
WHERE status IN ('ai_done', 'completed')
```

#### `POST /reset/all`

Full reset. ALL spots back to `pending`.

**SQL:**
```sql
UPDATE spots
SET elevation = NULL,
    slope_pct = NULL,
    terrain_score = NULL,
    legal_status = NULL,
    ai_score = NULL,
    satellite_image_path = NULL,
    composite_score = NULL,
    status = 'pending',
    updated_at = NOW()
WHERE status != 'pending'
```

#### `POST /reset/stage`

Partial reset from a specific pipeline stage onwards.

```
  POST /reset/stage {"from": "terrain_done"}
  ===========================================

  +----------+     +--------------+     +------------+     +---------+     +-----------+
  | pending  |     | terrain_done |     | legal_done |     | ai_done |     | completed |
  +----------+     +--------------+     +------------+     +---------+     +-----------+
       ^                  |                   |                  |               |
       |                  +-------------------+------------------+---------------+
       |                          All rewound to 'pending'
       +--------------------------------------------------------------------------+
```

**SQL variants by `from` value:**

`from=terrain_done` (target: `pending`):
```sql
UPDATE spots
SET elevation = NULL, slope_pct = NULL, terrain_score = NULL,
    legal_status = NULL, ai_score = NULL, satellite_image_path = NULL,
    composite_score = NULL, status = 'pending', updated_at = NOW()
WHERE status IN ('terrain_done', 'legal_done', 'ai_done', 'completed')
```

`from=legal_done` (target: `terrain_done`):
```sql
UPDATE spots
SET legal_status = NULL, ai_score = NULL, satellite_image_path = NULL,
    composite_score = NULL, status = 'terrain_done', updated_at = NOW()
WHERE status IN ('legal_done', 'ai_done', 'completed')
```

`from=ai_done` (target: `legal_done`):
```sql
UPDATE spots
SET ai_score = NULL, satellite_image_path = NULL,
    composite_score = NULL, status = 'legal_done', updated_at = NOW()
WHERE status IN ('ai_done', 'completed')
```

---

## 6. Processing Pipeline -- Stage Details

### 6.1. Terrain Stage (`terrain.py`)

```
  +----------+                  +-------------------+               +----------+
  | pending  |  -- SELECT -->   | terrain.py        |  -- UPDATE -> | terrain  |
  | spots    |                  |                   |               | _done    |
  +----------+                  | For each spot:    |               +----------+
                                |   1. lat_lon_to_tile(lat,lon,15) |
                                |   2. Fetch 3x3 Terrarium tiles   |
                                |   3. Decode RGB -> elevation     |
                                |   4. Horn's method -> slope      |
                                |   5. Score = 100 - slope*10      |
                                +-------------------+
                                        |
                                        v
                                +-------------------+
                                | AWS Terrarium     |
                                | Tiles (z15 PNG)   |
                                |                   |
                                | LRU cache: 512    |
                                | tiles in memory   |
                                +-------------------+
```

**Fetch Query:**
```sql
SELECT id, osm_id, ST_Y(geom) AS lat, ST_X(geom) AS lon
FROM spots
WHERE status = 'pending'
ORDER BY created_at
LIMIT %s                        -- batch_size (default 500)
```

**Update Query (per spot):**
```sql
UPDATE spots
SET elevation = %s,             -- meters
    slope_pct = %s,             -- percentage
    terrain_score = %s,         -- 0-100
    status = 'terrain_done',
    updated_at = NOW()
WHERE id = %s
```

#### Terrarium RGB Decoding

```
  PNG pixel (R, G, B) --> elevation = (R * 256 + G + B / 256) - 32768

  Sentinel: R=0, G=0, B=0 = -32768 (ocean/no data, treated as NULL)
```

#### Slope Calculation (Horn's Method)

```
  3x3 elevation grid (30m spacing):         Horn's weighted kernel:

    NW   N   NE                               -1  0  +1
     W   C   E                                -2  0  +2
    SW   S   SE                               -1  0  +1

  dz/dx = ((NE + 2*E + SE) - (NW + 2*W + SW)) / (8 * cell_size_m)
  dz/dy = ((SW + 2*S + SE) - (NW + 2*N + NE)) / (8 * cell_size_m)

  slope_rad = arctan(sqrt(dz_dx^2 + dz_dy^2))
  slope_pct = tan(slope_rad) * 100

  cell_size_m = 0.0003 * 111320 * cos(lat_rad)   (~33m at mid-latitudes)
```

#### Terrain Score

```
  score = 100 - slope_pct * 10      (clamped to [0, 100])

  0% slope  --> 100 (perfect)
  5% slope  -->  50 (moderate)
  10% slope -->   0 (too steep)
```

#### Performance

- LRU tile cache: 512 tiles. Clustered spots share tiles -- 500 spots in one region may only need ~30 unique tiles.
- Rate limit: 0.2s between spots.
- Throughput: ~200-300 spots/min.

### 6.2. Legal Stage (`legal.py`)

```
  +--------------+                  +-----------------+               +------------+
  | terrain_done |  -- SELECT -->   | legal.py        |  -- UPDATE -> | legal_done |
  | spots        |                  |                 |               +------------+
  +--------------+                  | For each spot:  |
                                    | 3 PostGIS +     |
                                    | 1 REST API      |
                                    +--------+--------+
                                             |
                            +----------------+----------------+----------------+
                            |                |                |                |
                            v                v                v                v
                     +-----------+    +-----------+    +-----------+    +-----------+
                     | PostGIS   |    | PostGIS   |    | PostGIS   |    | Catastro  |
                     | Natura    |    | Parks     |    | Costas    |    | REST API  |
                     | 2000      |    | (ENP)     |    | (DPMT/SP) |    | Registry  |
                     +-----------+    +-----------+    +-----------+    +-----------+
                      ~1ms local       ~1ms local       ~1ms local      ~300ms HTTP
```

**Fetch Query:**
```sql
SELECT id, osm_id, ST_Y(geom) AS lat, ST_X(geom) AS lon
FROM spots
WHERE status = 'terrain_done'
ORDER BY created_at
LIMIT %s                        -- batch_size (default 50)
```

**Update Query (per spot):**
```sql
UPDATE spots
SET legal_status = %s,          -- JSONB with all 4 check results + blocked flag
    status = 'legal_done',
    updated_at = NOW()
WHERE id = %s
```

#### Legal Checks Detail

**Local PostGIS checks** (Natura 2000, National Parks, Coastal Law) use `ST_Intersects` against imported MITECO shapefiles. A single CTE-based SQL query runs all three checks in ~1ms per spot. The DPMT layer (a MULTILINESTRING) uses `ST_DWithin(20m)` instead of `ST_Intersects`. Núcleos Excluidos (urban exemption zones) are subtracted from coastal law matches.

**Catastro REST API** (`Consulta_RCCOOR`) returns XML with the cadastral reference and land description. Classifications: `rustic` (rural parcels), `urban` (private, flagged), `registered` (generic), `no_parcel` (no cadastral data for coordinates).

| # | Check | Method | Source | Output |
|---|-------|--------|--------|--------|
| 1 | Natura 2000 | PostGIS `ST_Intersects` | `natura2000` table (SRID 3042, 1,636 polygons) | `{inside}` |
| 2 | National Parks | PostGIS `ST_Intersects` | `national_parks` table (SRID 25830, 1,788 polygons) | `{inside}` |
| 3 | Coastal Law | PostGIS `ST_DWithin`/`ST_Intersects` | `dpmt` + `servidumbre_proteccion` + `terrenos_incluidos_dpmt` − `nucleos_excluidos_dpmt` (SRID 25830) | `{inside}` |
| 4 | Cadastre | REST API | `ovc.catastro.meh.es/.../Consulta_RCCOOR` | `{classification, private, ref}` |

```
  blocked = natura2000.inside OR national_park.inside OR coastal_law.inside OR cadastre.private
```

Cadastre classification values: `rustic`, `urban`, `registered`, `no_parcel`. Marked `private: true` only for urban parcels (streets, buildings).

> **Why local PostGIS instead of WMS?** The original WMS-based approach had three critical bugs: (1) wrong layer names (`Red_Natura` instead of `PS.ProtectedSite`), (2) MITECO servers return ESRI XML instead of JSON causing silent parse failures, (3) the Coastal Law endpoint was dead. All checks silently returned "clear" for every spot. Local PostGIS eliminates network dependencies, runs 1000x faster (~1ms vs ~1s), and works offline.

> Fuente: «© Ministerio para la Transición Ecológica y el Reto Demográfico»

### 6.3a. AI Vision Labeler (`ai_vision_labeler.py`) — NEW

An optional enrichment step that re-scores spots using Claude Haiku Vision instead of the MobileNetV2 binary classifier. Runs **after** the main pipeline completes (operates on spots with status `ai_done`, `context_done`, or `completed`).

**Key differences from `ai_inference.py`:**
- Multi-factor output: 5 sub-scores (surface_quality, vehicle_access, open_space, van_presence, obstruction_absence) stored in `ai_details` JSONB
- Contextual understanding (a dirt clearing by a beach vs. a quarry)
- Does NOT change pipeline status — updates `ai_score` and `ai_details` in place
- Processes highest-composite-score spots first
- Requires `ANTHROPIC_API_KEY` environment variable
- Cost: ~$0.001/spot, ~$100 for 100K spots

See [docs/ai-vision-labeler.md](ai-vision-labeler.md) for full documentation.

### 6.3. AI Inference Stage (`ai_inference.py`)

```
  +------------+                  +-------------------+              +---------+
  | legal_done |  -- SELECT -->   | ai_inference.py   |  -- UPDATE ->| ai_done |
  | spots      |                  |                   |              +---------+
  +------------+                  | For each spot:    |
                                  |   1. Download sat |
                                  |      tile (PNOA)  |
                                  |   2. Run model:   |
                                  |      Keras ->     |
                                  |      ONNX ->      |
                                  |      Heuristic    |
                                  +--------+----------+
                                           |
                          +----------------+
                          |                |
                          v                v
                   +------------+    +-------------------+
                   | IGN PNOA   |    | MobileNetV2       |
                   | Satellite  |    | Binary Classifier |
                   | z17 JPEG   |    | 256x256 RGB       |
                   | TMS y-flip |    | sigmoid -> 0-100  |
                   +------------+    +-------------------+
                          |
                          v
                   +-------------------+
                   | /data/satellite   |
                   | _tiles/{osm_id}   |
                   | .jpg              |
                   | (disk cache)      |
                   +-------------------+
```

**Fetch Query:**
```sql
SELECT id, osm_id, ST_Y(geom) AS lat, ST_X(geom) AS lon
FROM spots
WHERE status = 'legal_done'
ORDER BY created_at
LIMIT %s                        -- batch_size (default 100)
```

**Update Query (per spot):**
```sql
UPDATE spots
SET ai_score = %s,              -- 0-100
    satellite_image_path = %s,  -- 'satellite_tiles/{osm_id}.jpg'
    status = 'ai_done',
    updated_at = NOW()
WHERE id = %s
```

#### Satellite Tile Download

```
  PNOA TMS URL: https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{y}.jpeg

  CRITICAL: TMS Y-axis flip!
  ===========================
  x, y_xyz, z = lat_lon_to_tile(lat, lon, 17)
  y_tms = (2^z - 1) - y_xyz          <-- This is the fix for blank tiles
  url = PNOA_URL.format(x=x, y=y_tms, z=z)
```

Cached to `/data/satellite_tiles/{osm_id}.jpg`. Skips download if file exists.

#### Model Inference Fallback Chain

```
  +-------------------+     +-------------------+     +-------------------+
  | 1. Keras Model    |---->| 2. ONNX Model     |---->| 3. Heuristic      |
  | .keras file       |fail | .onnx file        |fail | Color analysis    |
  | MobileNetV2       |     | Auto-detect shape |     | No model needed   |
  | 256x256 [0,1]     |     | NCHW or NHWC      |     | Green/brown/dark  |
  | sigmoid -> *100   |     | auto-scale        |     | ratios + variance |
  +-------------------+     +-------------------+     +-------------------+
```

**Keras inference:**
- Input: 256x256 RGB, pixels / 255.0
- Output: sigmoid (0=unsuitable, 1=suitable)
- Score: `raw * 100`, clamped [0, 100]
- Model loaded once, cached in `_keras_model` global

**Heuristic fallback formula:**
```
  score = brightness_score + variance_score + brown_bonus - green_penalty - dark_penalty

  brightness_score: 70 if mean in [80,180], else 50
  variance_score:   min(std_dev / 3, 30)
  brown_bonus:      brown_ratio * 40     (R > G > B, R > 100)
  green_penalty:    max(0, (green_ratio - 0.33) * 200)
  dark_penalty:     dark_ratio * 30      (brightness < 50)
```

If no tile downloadable: neutral score of 50.0.

### 6.4. Scoring Stage (`scoring.py`)

```
  +---------+                   +-------------------+              +-----------+
  | ai_done |  -- SELECT -->    | scoring.py        |  -- UPDATE ->| completed |
  | spots   |                   |                   |              +-----------+
  +---------+                   | composite_score = |
                                | terrain * 0.25 +  |
                                | ai * 0.75         |
                                +-------------------+
```

**Fetch Query:**
```sql
SELECT id, osm_id, terrain_score, ai_score
FROM spots
WHERE terrain_score IS NOT NULL
  AND ai_score IS NOT NULL
  AND status NOT IN ('completed', 'rejected')
ORDER BY created_at
LIMIT %s                        -- batch_size (default 500)
```

**Update Query (per spot):**
```sql
UPDATE spots
SET composite_score = %s,       -- 0-100
    status = 'completed',
    updated_at = NOW()
WHERE id = %s
```

#### Scoring Formula

```
  composite_score = terrain_score * 0.25 + ai_score * 0.75

  Why 75% AI?  Satellite visual analysis (open ground, no canopy, vehicle traces)
               is a much stronger signal than slope alone.

  Color Coding (React Native app):
  ================================
  +-------+--------+---------+
  | 80+   | Green  | #4ADE80 |  High confidence
  | 60-79 | Cyan   | #22D3EE |  Medium confidence
  | < 60  | Amber  | #FBBF24 |  Low / warning
  +-------+--------+---------+
```

---

## 7. n8n Orchestration

### 7.1. Workflow Structure

The workflow makes a single HTTP call to the worker's `/run/parallel` endpoint, which internally runs Terrain, Legal, and AI in concurrent threads, then Scoring.

```
  n8n Workflow: "WildSpotter Pipeline" (3 nodes)
  ===============================================

  +-------------------+     +-------------------------------+     +-------------------+
  | Every 20 Minutes  |---->| Parallel (Terrain+Legal+AI+   |---->| Progress          |
  | Schedule Trigger  |     | Score)                        |     | GET /progress     |
  |                   |     | POST /run/parallel            |     |                   |
  +-------------------+     | timeout: 30min                |     +-------------------+
                            |                               |
                            | Inside the worker:            |
                            | Thread 1: Terrain (500)       |
                            | Thread 2: Legal (100)         |
                            | Thread 3: AI (100)            |
                            | Then: Scoring (500)           |
                            +-------------------------------+

  Overall workflow execution timeout: 1 hour (3600s)
```

**Why a single endpoint?** n8n executes branches sequentially even when they look parallel in the UI. Moving parallelism into the Python worker (via `concurrent.futures.ThreadPoolExecutor`) achieves true concurrent execution.

### 7.2. Per-Cycle Throughput

```
  Every 12 minutes (concurrent execution):
  =========================================
  These run IN PARALLEL (3 threads):
    Terrain:  ~500 spots   (~2-3 min, tile cache helps)      [FAST]
    Legal:    ~1000 spots  (~6 min, 0.37s/spot: 1ms PostGIS + 300ms Catastro REST) [FAST]
    AI:       ~1000 spots  (~2-3 min, 0.5s download + model) [MODERATE]

  Total wall-clock time: ~6 min (limited by Legal, but now 10x faster than old WMS)

  Then sequentially:
    Scoring:  ~1000 spots  (DB only, <10s)                   [FAST]
```

Compared to the old sequential approach (~13 min for the same work), parallel execution saves ~5 min per cycle.

### 7.3. How to Activate

1. Open `http://localhost:5678`
2. Log in with credentials from `.env`
3. Find "WildSpotter Pipeline"
4. Toggle "Active" switch (top-right)

The workflow can also be managed programmatically via the n8n MCP server (configured in `.mcp.json`).

---

## 8. Operations Guide

### 8.1. Starting the Stack

```bash
docker-compose up -d --build        # Build and start all services
docker-compose ps                    # Verify everything is running
curl http://localhost:8000/health    # Check API health
curl http://localhost:8001/status    # Check worker health
open http://localhost:8001/dashboard # Pipeline dashboard
open http://localhost:5678           # n8n UI
```

### 8.2. Monitoring

```bash
# Quick status
curl -s http://localhost:8001/status | python3 -m json.tool

# Detailed progress with ETA
curl -s http://localhost:8001/progress | python3 -m json.tool

# Watch logs
docker-compose logs -f worker
docker-compose logs -f api
```

### 8.3. Operational Scenarios

```
  Scenario: AI Model Changed
  ==========================
  1. Replace models/spot-classifier.keras
  2. curl -X POST http://localhost:8001/reset/ai
     (moves ai_done + completed -> legal_done, clears satellite cache)
  3. n8n auto-reprocesses, or:
     curl -X POST http://localhost:8001/run/all -d '{"passes":20}'
  4. Monitor: open http://localhost:8001/dashboard


  Scenario: Monthly Full Refresh
  ==============================
  1. curl -X POST http://localhost:8001/reset/all
     (ALL spots -> pending, all fields cleared)
  2. Optionally re-import OSM: docker-compose exec worker osm2pgsql ...
  3. curl -X POST http://localhost:8001/run/all -d '{"passes":50,"batch_size":500}'
  4. Monitor: open http://localhost:8001/dashboard


  Scenario: Legal Data Refresh
  ============================
  curl -X POST http://localhost:8001/reset/stage \
    -H "Content-Type: application/json" \
    -d '{"from": "legal_done"}'
  (keeps terrain data, re-does legal + AI + scoring)


  Scenario: Bad Spots / Wrong OSM Queries
  ========================================
  1. Adjust OSM import queries / osm2pgsql style
  2. Re-import OSM data
  3. curl -X POST http://localhost:8001/reset/all
  4. curl -X POST http://localhost:8001/run/all -d '{"passes":50}'
```

### 8.4. Speed Tuning

```
  +-----------------------+------------------+---------+------------------------------------+
  | Parameter             | Where            | Default | Effect                             |
  +-----------------------+------------------+---------+------------------------------------+
  | Terrain batch_size    | n8n / curl       | 500     | More spots/cycle. LRU cache helps. |
  | Legal batch_size      | n8n / curl       | 1000    | Fast: ~0.37s/spot (PostGIS+REST).  |
  | AI batch_size         | n8n / curl       | 1000    | Bound by 0.5s download + inference.|
  | Scoring batch_size    | n8n / curl       | 1000    | Fast (DB only). Can go higher.     |
  | DOWNLOAD_DELAY_SECONDS| ai_inference.py  | 0.5     | Reduce for speed. Respect PNOA.    |
  | Terrain LRU cache     | terrain.py       | 512     | Increase for large clustered batch.|
  | n8n schedule interval | n8n workflow      | 12 min  | Reduce for faster processing.      |
  +-----------------------+------------------+---------+------------------------------------+
```

---

## 9. End-to-End Data Flow

```
  Geofabrik spain-latest.osm.pbf
              |
              v
  osm2pgsql -----> PostgreSQL/PostGIS
                   spots table (status='pending')
                   ~26,000 candidate spots
              |
              | n8n triggers every 20 min (POST /run/parallel)
              v
  +========================================================================+
  ||          PROCESSING PIPELINE (Python Worker, /run/parallel)           ||
  ||                                                                      ||
  ||  PARALLEL THREADS (concurrent.futures.ThreadPoolExecutor):            ||
  ||  ================================================================    ||
  ||                                                                      ||
  ||  Thread 1: TERRAIN (terrain.py)                                      ||
  ||     SELECT ... WHERE status='pending' LIMIT 500                      ||
  ||       +--> AWS Terrarium tiles (z15, LRU cached)                     ||
  ||       +--> Decode RGB: elev = (R*256 + G + B/256) - 32768           ||
  ||       +--> 3x3 grid (30m) -> Horn's method -> slope_pct             ||
  ||       +--> terrain_score = 100 - slope*10                            ||
  ||       +--> UPDATE ... SET status='terrain_done'                      ||
  ||                                                                      ||
  ||  Thread 2: LEGAL (legal.py)          [runs at same time as 1 and 3]  ||
  ||     SELECT ... WHERE status='terrain_done' LIMIT 100                 ||
  ||       +--> MITECO WMS: Natura 2000     (1s delay)                    ||
  ||       +--> MITECO WMS: National Parks  (1s delay)                    ||
  ||       +--> MITECO WMS: Coastal Law     (1s delay)                    ||
  ||       +--> Catastro WMS: Land class.   (1s delay)                    ||
  ||       +--> legal_status JSONB + blocked flag                         ||
  ||       +--> UPDATE ... SET status='legal_done'                        ||
  ||                                                                      ||
  ||  Thread 3: AI INFERENCE (ai_inference.py)   [same time as 1 and 2]   ||
  ||     SELECT ... WHERE status='legal_done' LIMIT 100                   ||
  ||       +--> IGN PNOA satellite tile (z17, TMS y-flip!)                ||
  ||       +--> Cache to /data/satellite_tiles/{osm_id}.jpg               ||
  ||       +--> Keras MobileNetV2 -> ONNX -> Heuristic (fallback chain)  ||
  ||       +--> ai_score 0-100                                            ||
  ||       +--> UPDATE ... SET status='ai_done'                           ||
  ||                                                                      ||
  ||  ================================================================    ||
  ||  AFTER ALL THREADS COMPLETE:                                         ||
  ||                                                                      ||
  ||  SCORING (scoring.py)                                                ||
  ||     SELECT ... WHERE terrain_score IS NOT NULL AND ai_score IS NOT   ||
  ||                      NULL AND status NOT IN ('completed','rejected') ||
  ||       +--> composite = terrain*0.25 + ai*0.75                        ||
  ||       +--> UPDATE ... SET status='completed'                         ||
  +========================================================================+
              |
              v
  PostgreSQL (spots with status='completed', composite_score set)
              |
              | SQL via pg Pool
              v
  Fastify API (:8000)
    GET /spots?bbox=...   --> ST_MakeEnvelope spatial query (max 500)
    GET /spots/:id        --> Full detail with all fields
    GET /satellite/:file  --> Cached JPEG from shared volume
              |
              | JSON over HTTP
              v
  React Native App (Expo)
    +----------------------------------+
    |  MapLibre GL map                 |
    |  +-------+ +-------+ +-------+  |
    |  | Green | | Cyan  | | Amber |  |
    |  |  80+  | | 60-79 | |  <60  |  |
    |  +-------+ +-------+ +-------+  |
    |  Score badge markers             |
    |                                  |
    |  Spot detail screen:             |
    |  - Satellite preview (from API)  |
    |  - Metrics: surface, slope, elev |
    |  - Legal checklist               |
    |  - Navigate / Inspect buttons    |
    |    (deep link to Google Maps)    |
    +----------------------------------+
```

---

## 10. Volumes and Data Persistence

### 10.1. Volume Map

```
  HOST                              CONTAINER
  ====                              =========

  Docker Named Volumes:
  +------------------+
  | pgdata           |------------> db:/var/lib/postgresql/data     (PostgreSQL data)
  | n8n_data         |------------> n8n:/home/node/.n8n             (workflow state)
  | satellite_tiles  |--+--------> worker:/data/tiles               (satellite JPEGs)
  |                  |  +--------> api:/data/tiles                  (served by Fastify)
  +------------------+

  Bind Mounts:
  +------------------+
  | ./backend        |------------> api:/app                        (live reload)
  | ./workers        |------------> worker:/app                     (live reload)
  | ./models         |------------> worker:/models                  (.keras, .onnx)
  | ./data           |--+--------> api:/data                        (shared data dir)
  |                  |  +--------> worker:/data                     (shared data dir)
  | ./db/init.sql    |------------> db:/docker-entrypoint-initdb.d/ (schema init)
  +------------------+
```

### 10.2. Gitignored Data

- `data/` -- OSM pbf files, satellite tile cache
- `pgdata` -- database files (Docker volume)
- `n8n_data` -- workflow state (Docker volume)
- `.env` -- environment variables with database credentials

### 10.3. Satellite Tile Lifecycle

```
  ai_inference.py downloads tile
         |
         v
  /data/satellite_tiles/{osm_id}.jpg   (inside satellite_tiles Docker volume)
         |
         | Shared volume
         v
  Fastify serves via GET /satellite/{osm_id}.jpg
         |
         v
  React Native app displays in SpotDetailHeader

  To clear: POST /reset/ai  (deletes all tiles + resets AI scores)
```
