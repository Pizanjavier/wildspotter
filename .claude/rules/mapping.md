---
paths:
  - "src/components/map/**/*"
  - "src/hooks/useMap*"
  - "backend/src/services/spatial*"
  - "db/**/*"
---

# Mapping & Geospatial Rules

## MapLibre Configuration
- Use `@maplibre/maplibre-react-native` as primary map engine
- Dark basemap style matching the radar theme (#0A0F1C base)
- Enable raster-dem source for terrain visualization and hillshade
- Elevation data for scoring is processed server-side by Python workers

## PostGIS Spatial Queries
- All geographic data is stored locally in PostGIS — no external API calls for spot geometry
- OSM data imported via `osm2pgsql` from Geofabrik `.pbf` files, kept current with daily `.osc` diffs
- Bounding box queries: `WHERE geom && ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)`
- Use `&&` operator with GIST index for fast envelope intersection
- Radius proximity: `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lon, lat), 4326), distance_m)`
- Return coordinates as GeoJSON: `ST_AsGeoJSON(geom)::json`
- Key OSM tags for spot detection (stored in `osm_tags` JSONB column):
  - Dead ends: `noexit=yes`
  - Surface: `surface IN ('dirt', 'gravel', 'unpaved', 'ground', 'earth', 'sand')`
  - Tracks: `highway=track`, filter by `tracktype`
  - Access: exclude `access=private`, `access=no`

## Elevation & Slope
- Terrain-RGB tile sources: AWS Open Data or IGN Spain
- Slope processing runs server-side in the Python terrain worker
- Discard spots with slope > 8%
- Sample multiple points per spot (center + 4 corners of parking area)

## Coordinates
- Internal storage: WGS84 (EPSG:4326) — `[longitude, latitude]`
- Always longitude first (GeoJSON standard), not lat/lon
- Bounding box format: `[west, south, east, north]`
- Spanish WMS data often uses EPSG:25830 (ETRS89 / UTM zone 30N) — transform on the server

## Offline
- Cache API JSON responses in AsyncStorage for offline map data
- Cache viewed map tiles in IndexedDB for offline map display
- Store queried area results with TTL (7 days default)
