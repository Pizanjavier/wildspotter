---
name: overpass-query
description: Helps build, test, and optimize PostGIS SQL queries for WildSpotter spot detection. Provide a target (dead ends, dirt parkings, clearings) or a bounding box.
argument-hint: [target-type] [bbox]
user-invocable: true
allowed-tools: Read, Grep, Bash
---

# PostGIS Spot Query Builder

Build and validate PostGIS SQL queries for WildSpotter spot detection against the local OSM database.

## Arguments

- `$0` — Target type: `dead-ends`, `dirt-parkings`, `clearings`, `tracks`, or `all`
- `$1` — Optional bounding box: `min_lon,min_lat,max_lon,max_lat` (defaults to sample area in Spain)

## Steps

1. Identify the target type from arguments
2. Build a PostGIS SQL query using the relevant OSM tag filters on `osm_tags` JSONB:
   - **dead-ends:** `osm_tags->>'noexit' = 'yes'` + highway track/unclassified/service + unpaved surfaces
   - **dirt-parkings:** `osm_tags->>'amenity' = 'parking'` + surface dirt/gravel/unpaved/ground
   - **clearings:** `osm_tags->>'landuse' IN ('grass', 'meadow')` near highway=track with motor vehicle access
   - **tracks:** `osm_tags->>'highway' = 'track'` + tracktype grade3/4/5 + surface filters
3. Apply the bounding box filter using `ST_MakeEnvelope`
4. Filter by `status` and include spatial index hints
5. Test the query by running it against the local PostGIS database via `docker-compose exec db psql`
6. Report: number of results, sample coordinates, query optimization suggestions
7. Output the final query ready to use in the Fastify API

## Key Tags Reference (JSONB Queries)

```sql
-- Surface types
osm_tags->>'surface' IN ('dirt', 'gravel', 'unpaved', 'ground', 'earth', 'sand', 'grass')

-- Highway types
osm_tags->>'highway' IN ('track', 'unclassified', 'service', 'path')

-- Track grade
osm_tags->>'tracktype' IN ('grade3', 'grade4', 'grade5')

-- Access filtering
osm_tags->>'access' NOT IN ('private', 'no')
AND (osm_tags->>'motor_vehicle' IS NULL OR osm_tags->>'motor_vehicle' != 'no')

-- Dead end
osm_tags->>'noexit' = 'yes'
```

## Example Query

```sql
SELECT id, osm_id, name, ST_AsGeoJSON(geom)::json AS geometry,
       spot_type, surface_type, composite_score
FROM spots
WHERE geom && ST_MakeEnvelope(-5.5, 36.5, -5.0, 37.0, 4326)
  AND osm_tags->>'noexit' = 'yes'
  AND osm_tags->>'surface' IN ('dirt', 'gravel', 'unpaved', 'ground')
  AND status = 'completed'
ORDER BY composite_score DESC
LIMIT 50;
```
