---
name: seed-database
description: Run osm2pgsql import using pre-downloaded data/spain-latest.osm.pbf to seed the PostGIS database with Spain OSM data.
user-invocable: true
allowed-tools: Read, Grep, Bash
---

# Seed Database

Import Spain OSM data into the local PostGIS database using the pre-downloaded Geofabrik extract.

## Prerequisites

1. Docker stack is running (`docker-compose up -d`)
2. `data/spain-latest.osm.pbf` exists (~1.3 GB, pre-downloaded)
3. Database has PostGIS extension enabled (handled by `db/init.sql`)

## Steps

### 1. Verify the PBF file exists

```bash
ls -lh data/spain-latest.osm.pbf
```

If missing, download it (large file, ~1.3 GB):
```bash
mkdir -p data
wget -O data/spain-latest.osm.pbf https://download.geofabrik.de/europe/spain-latest.osm.pbf
```

### 2. Verify the database is ready

```bash
docker-compose exec db psql -U wildspotter -c "SELECT PostGIS_version();"
```

### 3. Run osm2pgsql import

The worker container has `osm2pgsql` installed and mounts `./data:/data`:

```bash
docker-compose exec worker osm2pgsql \
  -d wildspotter \
  -H db \
  -U wildspotter \
  -W \
  -s \
  /data/spain-latest.osm.pbf
```

This will prompt for the database password (from `POSTGRES_PASSWORD` in `.env`).

To run non-interactively, set `PGPASSWORD`:
```bash
docker-compose exec -e PGPASSWORD=$POSTGRES_PASSWORD worker osm2pgsql \
  -d wildspotter \
  -H db \
  -U wildspotter \
  -s \
  /data/spain-latest.osm.pbf
```

**Expected duration:** 10-30 minutes depending on hardware.

### 4. Extract candidate spots

After the raw OSM import, run SQL to extract candidate spots matching Radar criteria into the `spots` table:

```sql
INSERT INTO spots (id, osm_id, name, geom, spot_type, surface_type, osm_tags, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  osm_id,
  tags->>'name',
  way,
  CASE
    WHEN tags->>'noexit' = 'yes' THEN 'dead_end'
    WHEN tags->>'amenity' = 'parking' THEN 'dirt_parking'
    WHEN tags->>'landuse' IN ('grass', 'meadow') THEN 'clearing'
    ELSE 'dead_end'
  END,
  COALESCE(tags->>'surface', 'unknown'),
  tags,
  'pending',
  NOW(),
  NOW()
FROM planet_osm_point
WHERE (
  (tags->>'noexit' = 'yes' AND tags->>'highway' IN ('track', 'unclassified', 'service'))
  OR (tags->>'amenity' = 'parking' AND tags->>'surface' IN ('dirt', 'gravel', 'unpaved', 'ground', 'earth', 'sand'))
)
AND (tags->>'access' IS NULL OR tags->>'access' NOT IN ('private', 'no'))
AND (tags->>'motor_vehicle' IS NULL OR tags->>'motor_vehicle' != 'no')
ON CONFLICT (osm_id) DO NOTHING;
```

Run via:
```bash
docker-compose exec db psql -U wildspotter -f /docker-entrypoint-initdb.d/extract-candidates.sql
```

Or paste into `docker-compose exec db psql -U wildspotter`.

### 5. Verify the import

```bash
docker-compose exec db psql -U wildspotter -c "SELECT count(*) FROM spots;"
docker-compose exec db psql -U wildspotter -c "SELECT spot_type, count(*) FROM spots GROUP BY spot_type;"
docker-compose exec db psql -U wildspotter -c "SELECT * FROM spots LIMIT 5;"
```

### 6. Initialize sync state

Record the current Geofabrik sequence so daily diffs start from this point:

```bash
docker-compose exec db psql -U wildspotter -c \
  "INSERT INTO sync_state (last_sequence, last_sync_at) VALUES (0, NOW());"
```

## Troubleshooting

- **osm2pgsql not found** — Ensure the worker Dockerfile installs it: `apt-get install -y osm2pgsql`
- **Connection refused** — Wait for the `db` container to be fully ready
- **Out of memory** — osm2pgsql defaults to slim mode (`-s`), which uses less RAM. For very large imports, increase Docker memory limit.
- **Import stalls** — Check `docker-compose logs -f worker` for errors
