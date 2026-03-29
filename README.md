# WildSpotter

A geographical exploration tool for the overland and vanlife community. WildSpotter acts as a "radar" that processes geographic, topographic, legal, and satellite data to probabilistically discover undiscovered overnight parking spots in the wild.

Unlike user-generated directories (Park4night, iOverlander) that lead to spot overcrowding, WildSpotter discovers new spots from raw geographic data — no community reviews needed.

**Target region:** Spain (initial).

**Full specification:** [SPEC_V2.md](SPEC_V2.md)

## Architecture

WildSpotter uses a **backend-centric** architecture. All heavy processing (geographic filtering, terrain analysis, legal cross-referencing, AI inference) runs in a Dockerized backend stack. The React Native app is a lightweight client that consumes pre-processed data via a JSON API.

```
┌──────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                     │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │   n8n    │───>│  AI/GIS      │───>│  PostgreSQL       │   │
│  │ (cron)   │    │  Worker      │    │  + PostGIS        │   │
│  │          │    │ (Python)     │    │                   │   │
│  └──────────┘    └──────────────┘    └─────────┬─────────┘   │
│       │                                        │             │
│       │  Geofabrik .osc diffs                  │             │
│       v                                        │             │
│  ┌──────────┐                          ┌───────┴─────────┐   │
│  │ osm2pgsql│─────────────────────────>│    Fastify       │   │
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

| Component | Technology | Role |
|-----------|-----------|------|
| **Mobile Client** | React Native / Expo (TypeScript) | UI, map rendering, API consumption, offline caching |
| **Backend API** | Fastify (TypeScript) | Serves processed spot data as JSON |
| **Database** | PostgreSQL + PostGIS | Spain OSM data, terrain/legal/AI results, spatial indexing |
| **Orchestration** | n8n | Scheduled data ingestion and processing pipelines |
| **Processing Worker** | Python | Terrain-RGB analysis, WMS legal checks, AI model inference |

## How It Works

WildSpotter runs a 4-stage processing pipeline on OSM data, executed server-side:

```
Radar → Topographer → Legal Judge → Satellite Eye
```

### 1. Radar (Infrastructure Filtering)
Queries the local PostGIS database (imported from OpenStreetMap via Geofabrik) to find:
- Dead-end dirt/gravel tracks (`noexit=yes`)
- Informal unpaved parkings near points of interest
- Clearings accessible by motor vehicle (excludes hiking/cycling paths)

### 2. Topographer (Elevation Analysis)
Python worker evaluates terrain slope using Terrain-RGB tiles (AWS Terrarium, z15). Slope and elevation are stored for every spot — no spots are rejected. Users filter by max slope at query time via preferences.

### 3. Legal Judge (Restriction Cross-Referencing)
Python worker cross-references candidates against Spanish government WMS layers:
- **Red Natura 2000** — EU environmental protection zones
- **National Parks** — strict protection boundaries
- **Coastal Law zones** — maritime-terrestrial public domain
- **Cadastre** — public vs. private land classification

### 4. Satellite Eye (AI Visual Validation)
Python worker downloads satellite imagery (IGN Spain PNOA orthophotos, 25cm/pixel) and runs a trained MobileNetV2 Keras model to classify ground suitability for vehicle parking. Fallback chain: Keras → ONNX → color heuristic.

### Scoring
Each spot receives a 0-100 composite score: Terrain (25%) + AI (75%). Legal data is informational only — it does not gate scoring. All spots receive a score regardless of legal status. Users can toggle "hide restricted areas" at query time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App | React Native + Expo (TypeScript strict) |
| Maps | MapLibre GL |
| AI | TensorFlow/Keras MobileNetV2 (server-side, Python worker) |
| State | Zustand |
| Backend API | Fastify (TypeScript) |
| Database | PostgreSQL + PostGIS |
| Orchestration | n8n (cron pipelines) |
| Workers | Python (terrain, legal, AI, scoring) |
| Data | Local OSM (Geofabrik), Terrain-RGB, Spanish WMS (MITECO, Catastro, IGN) |

## Getting Started

### Prerequisites

- **Docker Desktop** (includes Docker Compose)
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode + iOS Simulator runtime
- For Android: Android Studio + Android SDK

### 1. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your values (database password, optional API keys)
```

### 2. Start the backend stack

```bash
docker-compose up -d --build
```

This starts all 4 services:
- **PostgreSQL + PostGIS** on port 5433 (external)
- **Fastify API** on port 8000
- **Python worker** on port 8001 (Flask API, runs terrain+legal+AI in parallel threads)
- **n8n** on port 5678 (orchestrator, triggers pipeline every 20 min)

Verify the stack is running:
```bash
docker-compose ps
curl http://localhost:8000/health
```

### 3. Seed the database

Download the Spain OSM extract (~1.3 GB) and import it:
```bash
mkdir -p data
wget -O data/spain-latest.osm.pbf https://download.geofabrik.de/europe/spain-latest.osm.pbf

docker-compose exec worker osm2pgsql \
  -d wildspotter -H db -U wildspotter -s \
  /data/spain-latest.osm.pbf
```

### 4. Start the mobile app

```bash
npm install

# Web (recommended for development)
npx expo start --web

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

### Run Tests

```bash
npm test
```

## Project Structure

```
src/                         # React Native app (thin client)
├── app/                     # Expo Router screens (Map, Spots, Legal, Config)
├── components/              # UI components (map/, spots/, legal/, ui/)
├── services/api/            # Typed API client for Fastify backend
├── stores/                  # Zustand state management
├── constants/               # Theme tokens, config
└── types/                   # Shared TypeScript types
backend/                     # Fastify API (TypeScript)
├── src/routes/              # GET /spots, GET /spots/:id, GET /health
├── src/services/            # PostGIS query builders
└── Dockerfile
workers/                     # Processing scripts (Python)
├── terrain.py               # Slope/elevation analysis
├── legal.py                 # WMS legal checks
├── ai_inference.py          # Keras/ONNX satellite analysis
├── scoring.py               # Composite score calculation
└── Dockerfile
db/                          # Database schema
├── init.sql                 # PostGIS extension + tables + indexes
data/                        # OSM extracts, satellite tiles (gitignored)
models/                      # ML model files (.keras, .onnx)
design/                      # Design mockups (.pen + PNG exports)
docker-compose.yml           # Full stack orchestration
```

## AI Model

### Architecture
- **Base:** MobileNetV2 (transfer learning from ImageNet)
- **Task:** Binary classification — `ground_suitable` vs `ground_unsuitable`
- **Input:** 256x256 RGB satellite tiles
- **Output:** Probability score 0-1 (>0.5 = suitable)
- **Performance:** 83% accuracy, 0.89 AUC on validation set
- **Inference:** Server-side via TensorFlow/Keras in Python worker (ONNX fallback)

### Training Pipeline

The model training pipeline is under `models/`:

```
1. datasetcreator.py      — Generate coordinates from OSM data
2. positives_collector.py  — Collect verified positives from OSM
3. imagedownloader.py      — Download satellite tiles
4. smartlabeler.py         — Deduplicate and clean labels
5. train.py                — MobileNetV2 training with augmentation
6. export_tfjs.py          — Export to ONNX/TF.js format
```

## Docker Commands

```bash
docker-compose up -d --build       # Start/rebuild all services
docker-compose logs -f api         # Follow API logs
docker-compose logs -f worker      # Follow worker logs
docker-compose exec db psql -U wildspotter  # Database shell
docker-compose down                # Stop all services
docker-compose down -v             # Stop and destroy volumes (reset DB)
```

## Limitations

- **Spain only** — Legal layers (MITECO, Catastro WMS) are Spain-specific
- **Satellite imagery lag** — Tiles may be months/years old
- **AI accuracy** — 83% accuracy means ~1 in 6 spots may be misclassified
- **Slope estimation** — Terrain-RGB resolution (~30m) misses micro-terrain
- **Legal data completeness** — WMS layers may not cover all restrictions

## License

Private project — not open source.
