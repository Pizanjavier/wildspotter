# WildSpotter — Refactoring Plan

> **Source of truth:** This plan implements the architecture defined in [`SPEC_V2.md`](../SPEC_V2.md). Refer to that document for the "what" — this document covers the "how".

## 1. Overview

Transition WildSpotter from a client-heavy architecture (all processing on-device, Cloudflare Worker proxy) to a backend-centric model (Dockerized Fastify API + PostGIS + Python workers + n8n). The mobile app becomes a thin client consuming pre-processed data via JSON API. The API is TypeScript (shared language with the frontend); heavy GIS/AI processing workers remain Python.

## 2. Architecture Implementation

### 2.1. Docker Compose Stack

All backend services run locally via a single `docker-compose.yml` at the project root.

**Services to define:**

| Service | Image | Ports | Volumes |
|---------|-------|-------|---------|
| `db` | `postgis/postgis:16-3.4` | `5432:5432` | `pgdata:/var/lib/postgresql/data`, `./db/init.sql:/docker-entrypoint-initdb.d/init.sql` |
| `api` | Custom (Fastify/TypeScript) | `8000:8000` | `./backend:/app` |
| `worker` | Custom (Python) | — | `./workers:/app`, `./models:/models`, `./data:/data`, `satellite_tiles:/data/tiles` |
| `n8n` | `n8nio/n8n` | `5678:5678` | `n8n_data:/home/node/.n8n` |

**Network:** All services on a shared `wildspotter-net` bridge network.

**Environment variables (`.env` file):**
```
POSTGRES_USER=wildspotter
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=wildspotter
DATABASE_URL=postgresql://wildspotter:<password>@db:5432/wildspotter
BING_MAPS_API_KEY=<key>
```

### 2.2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                     │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │   n8n    │───▶│  AI/GIS      │───▶│  PostgreSQL       │   │
│  │ (cron)   │    │  Worker      │    │  + PostGIS        │   │
│  │          │    │ (Python)     │    │                   │   │
│  └──────────┘    └──────────────┘    └─────────┬─────────┘   │
│       │                                        │             │
│       │  Geofabrik .osc diffs                  │             │
│       ▼                                        │             │
│  ┌──────────┐                          ┌───────┴─────────┐   │
│  │ osm2pgsql│─────────────────────────▶│    Fastify       │   │
│  │ (import) │                          │  (JSON API)     │   │
│  └──────────┘                          └───────┬─────────┘   │
│                                                │             │
└────────────────────────────────────────────────┼─────────────┘
                                                 │ HTTP/JSON
                                        ┌────────┴────────┐
                                        │  React Native   │
                                        │  (Expo) Client  │
                                        └─────────────────┘
```

## 3. Project Structure (Post-Refactor)

```text
wildspotter/
├── src/                      # React Native app (refactored)
│   ├── app/                  # Expo Router screens & layouts
│   ├── components/           # UI components (unchanged)
│   ├── services/
│   │   ├── api/              # NEW: thin API client
│   │   │   ├── client.ts     # Typed fetch wrapper
│   │   │   ├── spots.ts      # getSpots(bbox), getSpotDetail(id)
│   │   │   └── types.ts      # Response types matching API contract
│   │   └── cache/            # Offline cache (now caches API JSON)
│   ├── stores/               # Zustand (adapted for API data)
│   ├── hooks/                # Custom hooks (call API service)
│   ├── types/                # TypeScript types
│   ├── utils/                # Pure utilities
│   └── constants/            # App-wide constants
├── backend/                  # NEW: Fastify API (TypeScript)
│   ├── src/
│   │   ├── index.ts          # Entry point, Fastify setup, CORS
│   │   ├── routes/
│   │   │   ├── spots.ts      # GET /spots (bbox query)
│   │   │   └── health.ts     # GET /health
│   │   ├── models/
│   │   │   └── spot.ts       # TypeScript types + DB queries
│   │   ├── services/
│   │   │   └── spatial.ts    # PostGIS query builders (pg + raw SQL)
│   │   └── config.ts         # Settings from env vars
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── workers/                  # NEW: Processing scripts
│   ├── terrain.py            # Terrain-RGB slope/elevation
│   ├── legal.py              # WMS queries (MITECO, Catastro, IGN)
│   ├── ai_inference.py       # ONNX/PyTorch satellite analysis
│   ├── scoring.py            # Composite score calculation
│   ├── Dockerfile
│   └── requirements.txt
├── db/                       # NEW: Database initialization
│   └── init.sql              # PostGIS extension + table creation
├── n8n/                      # NEW: n8n persistent data (auto-created)
├── data/                     # NEW: Data volumes
│   ├── spain-latest.osm.pbf  # Pre-downloaded Geofabrik extract (~1.3 GB, gitignored)
│   └── satellite_tiles/      # Cached satellite imagery
├── models/                   # ML model files (.onnx)
├── design/                   # Mockups — UNCHANGED, PROTECTED
├── docker-compose.yml        # NEW: Stack orchestration
├── .env                      # NEW: Environment variables
├── CLAUDE.md                 # UPDATED
├── SPEC.md                   # ARCHIVED (superseded by SPEC_V2.md)
├── SPEC_V2.md                # NEW: Source of truth
└── docs/
    └── refactoring_plan.md   # This document
```

## 4. Database Implementation

### 4.1. `db/init.sql`

This file is mounted to `docker-entrypoint-initdb.d` and runs automatically on first container boot.

**Must contain:**
1. `CREATE EXTENSION IF NOT EXISTS postgis;`
2. `CREATE TABLE spots (...)` — all columns from SPEC_V2 §4.1.
3. `CREATE TABLE sync_state (...)` — from SPEC_V2 §4.3.
4. All indexes:

```sql
CREATE INDEX idx_spots_geom ON spots USING GIST (geom);
CREATE INDEX idx_spots_status ON spots (status);
CREATE INDEX idx_spots_composite ON spots (composite_score DESC);
CREATE INDEX idx_spots_osm_tags ON spots USING GIN (osm_tags);
CREATE INDEX idx_spots_legal ON spots USING GIN (legal_status);
```

### 4.2. Initial Data Seed (osm2pgsql)

After the Docker stack is running:

> **Note:** `data/spain-latest.osm.pbf` (1.3 GB) is already pre-downloaded. Skip the download step.

1. Install `osm2pgsql` inside the worker container (or use a dedicated seed container).
2. Run: `osm2pgsql -d wildspotter -H db -U wildspotter -W -s /data/spain-latest.osm.pbf`
3. Execute SQL to extract candidate spots from the raw OSM data into the `spots` table with `status = 'pending'`.

## 5. Backend API Implementation

### 5.1. Fastify App (`backend/`)

**Key endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/spots` | Query spots by bounding box. Params: `min_lat`, `min_lon`, `max_lat`, `max_lon`, `min_score` (optional). Returns JSON array. |
| `GET` | `/spots/:id` | Full spot detail with legal status, all scores, OSM tags. |
| `GET` | `/health` | Health check for Docker/n8n monitoring. |

**Implementation details:**
- Use `pg` (node-postgres) with raw PostGIS SQL queries for spatial operations.
- Spatial queries use `ST_MakeEnvelope` for bounding box and `ST_DWithin` for radius.
- Filter by `status = 'completed'` by default.
- CORS via `@fastify/cors` to allow React Native dev server.
- JSON Schema validation on routes via Fastify's built-in schema support.
- TypeScript strict mode, shared type definitions usable by the mobile app.

### 5.2. Dockerfile

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

**Dependencies (`package.json`):**
`fastify`, `@fastify/cors`, `pg`, `dotenv`, `typescript`, `tsx` (dev)

## 6. Processing Workers Implementation

### 6.1. Terrain Worker (`workers/terrain.py`)

- **Input:** Spot coordinates from DB (`status = 'pending'`).
- **Process:** Fetch Terrain-RGB tile for the coordinate. Decode RGB values to elevation. Calculate slope percentage using surrounding pixel elevations.
- **Output:** Update `elevation`, `slope_pct`, `terrain_score`. Set `status = 'terrain_done'` or `status = 'rejected'` with `rejection_reason = 'slope_too_steep'` if slope > 8%.

### 6.2. Legal Worker (`workers/legal.py`)

- **Input:** Spots with `status = 'terrain_done'`.
- **Process:** For each spot, query WMS endpoints:
  - MITECO WMS → Red Natura 2000, National Parks
  - Catastro WMS → Public vs. private land
  - IGN WMS → Coastal Law zones
- **Output:** Update `legal_status` JSONB (structure per SPEC_V2 §4.2). Set `status = 'legal_done'` or `status = 'rejected'` with `rejection_reason = 'protected_area'` if `blocked = true`.
- **Rate Limiting:** 1-second delay between WMS requests to avoid overloading government servers.

### 6.3. AI Worker (`workers/ai_inference.py`)

- **Input:** Spots with `status = 'legal_done'`.
- **Process:**
  1. Download satellite tile from Bing Maps Static API (fallback: IGN PNOA WMS).
  2. Cache tile to `./data/satellite_tiles/{osm_id}.jpg`.
  3. Load ONNX model from `/models/`.
  4. Run inference → surface classification, vehicle detection, canopy estimation.
- **Output:** Update `ai_score`, `satellite_image_path`. Set `status` for scoring.
- **Rate Limiting:** 2-second delay between satellite tile downloads.

### 6.4. Scoring Worker (`workers/scoring.py`)

- **Input:** Spots with terrain + AI scores.
- **Process:** Calculate `composite_score` = (terrain_score × 0.25) + (ai_score × 0.75). Legal is already a pass/fail gate at this point.
- **Output:** Update `composite_score`. Set `status = 'completed'`.

### 6.5. Worker Dockerfile

```dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y libgdal-dev osm2pgsql && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

**Dependencies:** `psycopg2-binary`, `requests`, `Pillow`, `numpy`, `onnxruntime`, `gdal`

## 7. n8n Workflow Implementation

### 7.1. Workflow 1: Daily OSM Diff Ingestion

| Step | n8n Node Type | Action |
|------|--------------|--------|
| 1 | Cron | Trigger every night at 3:00 AM |
| 2 | Postgres | Query `sync_state` for `last_sequence` |
| 3 | HTTP Request | Download next `.osc.gz` from `https://download.geofabrik.de/europe/spain-updates/` |
| 4 | Execute Command | Run `osm2pgsql --append` with the `.osc` file against the DB |
| 5 | Postgres | Extract new candidate spots matching Radar criteria → insert into `spots` with `status = 'pending'` |
| 6 | Postgres | Update `sync_state` with new sequence + timestamp |

### 7.2. Workflow 2: Spot Processing Pipeline

| Step | n8n Node Type | Action |
|------|--------------|--------|
| 1 | Cron / Webhook | Runs after Workflow 1, or manual trigger |
| 2 | Postgres | Fetch batch of spots `WHERE status = 'pending'` (LIMIT 50) |
| 3 | Execute Command | Call `python terrain.py --batch-id <id>` |
| 4 | Postgres | Fetch batch `WHERE status = 'terrain_done'` (LIMIT 50) |
| 5 | Execute Command | Call `python legal.py --batch-id <id>` |
| 6 | Postgres | Fetch batch `WHERE status = 'legal_done'` (LIMIT 50) |
| 7 | Execute Command | Call `python ai_inference.py --batch-id <id>` |
| 8 | Execute Command | Call `python scoring.py --batch-id <id>` |
| 9 | IF Node | If more `pending` spots remain → loop to step 2 |

## 8. Satellite Imagery Strategy

- **Primary:** IGN Spain PNOA orthophotos (25cm/pixel across Spain, free, no API key — `https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{y}.jpeg`).
- **Fallback:** Bing Maps Static Tile API (requires API key, lower resolution in rural Spain).
- **Storage:** Docker volume `./data/satellite_tiles/` mapped to the worker container.
- **DB Reference:** `satellite_image_path` column stores relative path (e.g., `tiles/12345.jpg`).
- **Rate Limiting:** n8n batches 50 spots per run with 2-second delays between downloads.

## 9. Mobile App Refactoring

### 9.1. Modules to DELETE

| Module | Current Role | Why |
|--------|-------------|-----|
| `src/services/overpass/` | OverpassQL query builder & parser | Data now in PostGIS |
| `src/services/elevation/` | Terrain-RGB pixel math | Backend worker |
| `src/services/legal/` | WMS client for legal checks | Backend worker |
| `src/services/ai/` | On-device TF.js inference | Backend worker |
| `src/services/scoring/` | Client-side score computation | `composite_score` from API |
| `workers/proxy/` | Cloudflare Worker caching proxy | No longer needed |

### 9.2. Modules to CREATE

| Module | Implementation |
|--------|---------------|
| `src/services/api/client.ts` | Typed fetch wrapper. Base URL from config. Error handling. |
| `src/services/api/spots.ts` | `getSpots(bbox): Promise<Spot[]>`, `getSpotDetail(id): Promise<SpotDetail>` |
| `src/services/api/types.ts` | TypeScript interfaces matching Fastify response schemas |

### 9.3. Modules to UPDATE

| Module | Change |
|--------|--------|
| `src/services/cache/` | Cache API JSON responses instead of raw Overpass/tile data |
| `src/stores/` | Zustand stores adapted to hold API response shapes |
| `src/hooks/` | Hooks call `src/services/api/` instead of processing services |
| `src/constants/` | Add `API_BASE_URL` constant |

### 9.4. Offline Cache Strategy

- On API fetch, cache the JSON response keyed by bounding box hash.
- On next request for same area, serve from cache first (stale-while-revalidate).
- User can manually "save" an area for full offline access.

## 10. Claude Code Configuration Updates

### 10.1. `CLAUDE.md` — Required Changes

| Section | Current Value | New Value |
|---------|--------------|-----------|
| Stack → Backend | `Cloudflare Workers (caching proxy only, free tier)` | `Fastify (TypeScript) API, Python workers, PostgreSQL + PostGIS, n8n (Docker Compose)` |
| Stack → Data | `Overpass API, Terrain-RGB tiles, Spanish WMS` | `Local OSM via Geofabrik/osm2pgsql, Terrain-RGB, Spanish WMS (server-side)` |
| Project Structure | Missing `backend/`, `workers/`, `db/` | Add all new directories, remove `workers/proxy/` |
| Services rule | `All API calls go through the Cloudflare Worker proxy` | `Mobile app calls the local Fastify backend. Heavy GIS/AI processing runs in Python Docker workers.` |
| Commands | `npx wrangler dev/deploy` | Replace with `docker-compose up -d --build`, `docker-compose logs -f api`, `docker-compose down` |
| Full spec reference | `@SPEC.md` | `@SPEC_V2.md` |

### 10.2. `.claude/rules/` — Changes

| File | Action |
|------|--------|
| `cloudflare.md` | **DELETE** |
| `backend.md` | **CREATE** — Fastify/TypeScript conventions, PostGIS query patterns via `pg`, Docker development workflow |
| `mapping.md` | **UPDATE** — Remove Overpass-specific rules, add PostGIS spatial query patterns |

### 10.3. `.claude/skills/` — Changes

| Skill | Action |
|-------|--------|
| `overpass-query/` | **UPDATE** — Replace OverpassQL HTTP queries with PostGIS SQL equivalents |
| `deploy-worker/` | **DELETE** — Cloudflare Worker deployment removed |
| `docker-ops/` | **CREATE** — Build, start, stop, debug Docker stack |
| `seed-database/` | **CREATE** — Download Geofabrik `.pbf`, run `osm2pgsql` import |

### 10.4. `.claude/agents/` — Changes

| Agent | Action |
|-------|--------|
| `developer/` | **UPDATE** — Add Fastify backend TypeScript context, clarify Python is workers-only |
| `geo-researcher/` | **UPDATE** — Reference PostGIS and local OSM data instead of Overpass API |
| `backend-engineer/` | **CREATE** — Fastify API (TypeScript), Python workers, Docker, and database development |

## 11. Setup Checklist (Phased, with Verification)

Each phase ends with a **✅ VERIFY** step. Use the **tester** agent with Chrome browser automation to confirm each milestone before moving on. Agent assignments are listed per phase — use the **orchestrator** to coordinate multi-agent work.

### Phase 1: Claude Code Configuration + MCP Setup

> **Agents:** `orchestrator` → `developer` + `reviewer`
> **Goal:** Update all Claude Code config so agents, rules, skills, and MCPs are ready for the backend-centric architecture before writing any implementation code.

- [ ] Update `README.md` — new architecture overview, Docker Compose "Getting Started", prerequisites (Docker Desktop), reference `SPEC_V2.md`
- [ ] Update `CLAUDE.md` per §10.1 (stack, structure, services rule, commands, spec reference)
- [ ] Delete `.claude/rules/cloudflare.md`
- [ ] Create `.claude/rules/backend.md` — Fastify/TypeScript conventions, PostGIS query patterns, Docker workflow
- [ ] Update `.claude/rules/mapping.md` — remove Overpass rules, add PostGIS spatial patterns
- [ ] Update `.claude/skills/overpass-query/` — replace OverpassQL with PostGIS SQL equivalents
- [ ] Delete `.claude/skills/deploy-worker/`
- [ ] Create `.claude/skills/docker-ops/` — build, start, stop, debug Docker stack
- [ ] Create `.claude/skills/seed-database/` — run `osm2pgsql` import using pre-downloaded `data/spain-latest.osm.pbf`
- [ ] Update `.claude/agents/developer/` — add Python worker context alongside TypeScript
- [ ] Update `.claude/agents/geo-researcher/` — reference PostGIS and local OSM data
- [ ] Create `.claude/agents/backend-engineer/` — Fastify, Docker, database, worker development
- [ ] Install and configure MCPs:
  - **PostgreSQL / PostGIS MCP** — for direct DB queries and schema introspection
  - **Docker MCP** — for container status, logs, and restart commands
  - **HTTP / Fetch MCP** — for testing Fastify endpoints from the IDE
  - **n8n MCP** — for triggering workflows and inspecting executions
- [ ] **✅ VERIFY:** Confirm `CLAUDE.md` no longer references Cloudflare Workers or Overpass API. Confirm all new agents/rules/skills exist. Confirm MCPs respond (e.g., Docker MCP lists containers, Postgres MCP connects to default).

### Phase 2: Infrastructure (Docker + Database)

> **Agents:** `orchestrator` → `backend-engineer` + `developer`
> Use the **docker-ops** and **seed-database** skills created in Phase 1.

- [ ] Create `docker-compose.yml` with all 4 services
- [ ] Create `db/init.sql` with PostGIS extension + schema + indexes
- [ ] Create `.env` with all required variables
- [ ] Run `docker-compose up -d --build`
- [ ] **✅ VERIFY (Browser + MCP):** Use **Docker MCP** to confirm all 4 containers are running. Open `http://localhost:5678` in browser — confirm n8n login page loads. Use **Postgres MCP** to run `SELECT PostGIS_version();` and `SELECT count(*) FROM spots;` — confirm PostGIS extension and table exist.

### Phase 3: Backend API

> **Agents:** `orchestrator` → `backend-engineer` (implementation) + `tester` (verification)

- [ ] Create `backend/` — Fastify app, Dockerfile, package.json
- [ ] Implement `GET /spots` (bbox query), `GET /spots/{id}`, `GET /health`
- [ ] Rebuild stack: `docker-compose up -d --build api`
- [ ] **✅ VERIFY (Browser):** Use **HTTP MCP** to test `GET /health` returns `200`. Test `GET /spots` with a sample bbox returns valid JSON (empty array is fine at this stage). Optionally confirm Swagger UI at `http://localhost:8000/docs` if `@fastify/swagger-ui` is configured.

### Phase 4: Processing Workers + Data Seed

> **Agents:** `orchestrator` → `backend-engineer` (workers) + `geo-researcher` (OSM data & WMS endpoints) + `tester` (verification)

- [ ] Create `workers/` — terrain.py, legal.py, ai_inference.py, scoring.py, Dockerfile
- [ ] Run `osm2pgsql` seed using pre-downloaded `data/spain-latest.osm.pbf` (use **seed-database** skill)
- [ ] Build n8n Workflow 1 (Daily OSM Diff) at `http://localhost:5678`
- [ ] Build n8n Workflow 2 (Spot Processing Pipeline)
- [ ] **✅ VERIFY (Browser + MCP):** Open `http://localhost:5678` — confirm both n8n workflows exist and are active. Use **n8n MCP** to manually trigger Workflow 2 on a small batch. Use **HTTP MCP** to query `GET /spots?min_lat=36&min_lon=-6&max_lat=37&max_lon=-5` — confirm processed spots return with `composite_score` values. Use **Postgres MCP** to verify `status = 'completed'` rows exist.

### Phase 5: Mobile App Refactoring

> **Agents:** `orchestrator` → `developer` (TypeScript) + `design-validator` (UI check) + `tester` (E2E browser verification)

- [ ] Delete `src/services/{overpass,elevation,legal,ai,scoring}/`
- [ ] Delete `workers/proxy/` (Cloudflare Worker)
- [ ] Create `src/services/api/{client,spots,types}.ts`
- [ ] Update stores, hooks, cache layer, and constants
- [ ] **✅ VERIFY (Browser):** Run `npx expo start --web`. Open Expo Web in Chrome. Confirm the map loads without console errors. Confirm spots from the API render as markers on the map. Confirm tapping a marker opens the spot detail view with score, surface, and legal data. Run `npm run lint` — no errors. Run `npm test` — all tests pass. Record a GIF of the full flow.

## 12. Recommended MCP Integrations

| MCP | Purpose |
|-----|---------|
| **PostgreSQL / PostGIS** | Direct DB queries, schema introspection, spatial query testing |
| **Docker** | Container status, log viewing, restart services, network diagnostics |
| **HTTP / Fetch** | Test Fastify endpoints directly from the IDE |
| **n8n** | Trigger workflows, inspect executions, debug pipeline nodes |
| **GitHub** | Progressive commits for this major structural refactor |

## 13. Documentation Deliverables

Maintain inside `docs/` throughout implementation:

| Document | Content |
|----------|---------|
| `ARCHITECTURE.md` | Mermaid diagram of Docker network, port mappings, data flow |
| `API_CONTRACT.md` | OpenAPI spec (auto-generated by Fastify via `@fastify/swagger`) |
| `DB_SCHEMA.md` | Table definitions, index rationale, example PostGIS queries |
| `N8N_WORKFLOWS.md` | Workflow descriptions, cron schedules, JSON exports for backup |
| `AI_MODEL_NOTES.md` | Training data, retraining instructions, accuracy benchmarks |
