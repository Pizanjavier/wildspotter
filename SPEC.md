# 1. Product Overview

WildSpotter (placeholder name) is an advanced geographical exploration tool designed for the overland and vanlife community. Unlike traditional user-generated directories (e.g., Park4night) that lead to the massification of natural spots, this application acts as a "radar." It processes raw geographic, topographic, and legal data to probabilistically identify undiscovered, flat, and legally viable overnight parking spots in the wild.

**Initial Target Region:** Spain.
**Platform Priority:** Mobile-first (iOS & Android). Desktop/web is secondary.

# 2. Core Features

Features are listed in implementation order. Each module builds on the previous one.

## 2.1. The Area Scanner (Interactive Map)

- **Vector Mapping:** High-performance, lightweight map interface allowing users to pan, zoom, and explore regions.
- **Bounding Box Selection:** Users can define a specific search area (e.g., a mountain range or a coastal stretch) to run the discovery algorithm.
- **Offline Cache:** Previously scanned areas and their results are cached locally (IndexedDB / AsyncStorage) for use without connectivity — essential for users already on the road.

## 2.2. The "Radar" (Infrastructure Filtering)

- **Query Engine:** Translates user intent into raw geographical queries.
- **Target Identification:** Automatically locates specific geometries such as:
  - Dead ends of dirt, gravel, or unpaved tracks (`noexit=yes`).
  - Informal dirt parkings near points of interest (viewpoints, beaches).
  - Clearings accessible by motor vehicles, specifically filtering out narrow hiking or biking trails.

## 2.3. The "Topographer" (Elevation Analysis)

- **Incline Check:** Evaluates the terrain slope at the coordinates found by the Radar.
- **Flat Ground Validation:** Discards spots with an incline percentage that would make sleeping in a vehicle uncomfortable or require excessive leveling blocks (e.g., > 8% slope).
- **Implementation Note:** Prefer MapLibre's built-in raster-dem source and `queryTerrainElevation` where available, falling back to manual Terrain-RGB pixel math only when needed.

## 2.4. The "Legal Judge" (Restriction Cross-Referencing)

- **Environmental Protection Check:** Cross-references potential spots against official environmental boundaries (e.g., Red Natura 2000, National Parks, Coastal Law zones).
- **Cadastre / Public Land Check:** Checks if the land is strictly private (fenced) or public utility forestry.
- **Visual Warnings:** Spots falling within protected polygons are either discarded or clearly marked with a "No Overnight Parking / Transit Only" warning.

## 2.5. The "Satellite Eye" (AI Visual Validation)

- **On-Demand Analysis:** Only triggered for spots that pass the Radar + Topographer + Legal Judge filters (typically ~10 candidates per scan). This minimizes API calls and battery drain.
- **On-Device Object Detection:** A custom-trained lightweight model detects:
  - Open mineral ground / clearings suitable for parking.
  - Absence of dense tree canopy blocking vehicle access.
  - Parked vans/campers — a strong positive signal that a spot is viable and used by the community.
- **Training Strategy:** Build a small labeled dataset of satellite tiles from known good/bad spots (gathered during Radar development) rather than relying on generic pre-trained classifiers.

## 2.6. The Google Maps Bridge (Manual Validation & Navigation)

- **Spot Dashboard:** Displays the spot's "Success Probability Score" alongside its metrics (surface type, elevation, legal status).
- **Deep Linking:**
  - *Inspect:* Opens the exact coordinates in Google Maps Satellite/Street View for final human validation.
  - *Navigate:* Launches standard GPS turn-by-turn navigation to the spot.

# 3. Technology Stack

## 3.1. Architecture Philosophy: Minimal-Cost (Client-Heavy + Edge Cache)

The application performs all heavy processing (elevation math, AI inference) on the client device. A lightweight Cloudflare Worker acts as a caching proxy for external APIs (Overpass, WMS) to avoid rate-limiting and improve response times — at zero cost within the free tier.

**Cloudflare Workers Free Tier:** 100,000 requests/day, Workers Cache API (unlimited), KV storage. More than sufficient for early-stage and moderate usage.

> **Note for future scaling:** If battery drain, device performance, or API rate-limiting become bottlenecks at scale, heavy processing (especially AI inference) can be offloaded to a backend server. The caching proxy architecture makes this migration straightforward.

## 3.2. Frontend & Framework

- **Framework:** React Native with Expo.
- **Rationale:** Mobile-first development with a single codebase for iOS and Android. Expo Web provides a secondary desktop experience for trip planning.
- **Known Trade-off:** MapLibre integration in RN (`@maplibre/maplibre-react-native`) is less mature than the web version. If map-related issues become a blocker, fallback to embedding MapLibre GL JS in a WebView within the RN app.

## 3.3. Mapping & Rendering

- **Map Engine:** MapLibre GL JS (via `@maplibre/maplibre-react-native`).
- **Rationale:** Open-source, high-performance vector maps without the licensing costs of Google Maps or Mapbox.
- **Terrain:** Use MapLibre's raster-dem sources for elevation queries and hillshade rendering.

## 3.4. Data Sources & APIs

- **Spot Geometry:** Overpass API (OpenStreetMap). Querying tracks, surfaces, and dead ends. Proxied and cached via the Cloudflare Worker.
- **Elevation Data:** Terrain-RGB tiles (AWS Open Data or IGN Spain). Queried via MapLibre's terrain support or processed locally as fallback.
- **Legal & Cadastre Data:** WMS from public Spanish government servers (MITECO, Sede Electrónica del Catastro, IGN). Proxied and cached via the Cloudflare Worker.
- **Satellite Imagery:** Mapbox Static Images API or Bing Maps API (free tiers). Only fetched for spots that pass all prior filters (~10 per scan).

## 3.5. Artificial Intelligence & Processing

- **Engine:** TensorFlow.js (`@tensorflow/tfjs-react-native`) or ONNX Runtime Web — to be evaluated during development based on model size and inference speed.
- **Model:** A custom-trained lightweight detection model (quantized YOLO variant or similar) optimized for:
  - Ground surface classification (mineral/dirt vs. vegetation).
  - Vehicle detection (vans, campers) as positive community signal.
  - Canopy density estimation.
- **Inference Strategy:** On-demand only. The model runs exclusively on the final ~10 candidate spots per scan, not on every Overpass result.

# 4. Design Reference

Mockups are in `design/wildspotter-mockup.pen` (editable) and exported as PNGs in `design/`.

## 4.1. Visual Style

- **Aesthetic:** Dark command-center / radar theme — deep navy (#0A0F1C) background, slate card surfaces (#1E293B), electric cyan (#22D3EE) accent.
- **Typography:** JetBrains Mono for data values, scores, and labels. Inter for titles and body text.
- **Color-Coded Scores:** Green (#4ADE80) for high-confidence spots (80+), Cyan (#22D3EE) for medium (60-79), Amber (#FBBF24) for low/warning.

## 4.2. Screen Flow

### Map View (`design/map-view.png`)
Full-screen dark vector map with floating search bar, "SCAN THIS AREA" radar button, and a draggable bottom sheet showing result previews. Pill-style tab bar (Map / Spots / Legal / Config).

### Scan Results (`design/scan-results.png`)
Expanded bottom sheet listing all discovered spots with score badges. Pipeline filter indicators at the top show the funnel: Radar (23) → Topographer (12) → Legal (7) → AI (5).

### Spot Detail (`design/spot-detail.png`)
Satellite preview with AI/van-detection badges. Metrics cards (surface, slope, elevation), legal status checklist with green checkmarks, and dual action buttons: Inspect (Google Maps satellite) and Navigate (turn-by-turn).
