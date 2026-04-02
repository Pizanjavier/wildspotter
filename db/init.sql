-- WildSpotter database initialization
-- Runs automatically on first container boot via docker-entrypoint-initdb.d

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS hstore;

-- Spots table: all candidate and processed spots
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
    ai_details          JSONB,
    context_score       FLOAT,
    context_details     JSONB,
    composite_score     FLOAT,
    satellite_image_path VARCHAR,
    status              VARCHAR DEFAULT 'pending',
    rejection_reason    VARCHAR,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Sync state table: tracks Geofabrik diff ingestion progress
CREATE TABLE sync_state (
    id              SERIAL PRIMARY KEY,
    last_sequence   INTEGER,
    last_sync_at    TIMESTAMPTZ
);

-- Spatial index for bounding box and proximity queries
CREATE INDEX idx_spots_geom ON spots USING GIST (geom);

-- Status index for pipeline stage filtering
CREATE INDEX idx_spots_status ON spots (status);

-- Composite score index for sorted retrieval
CREATE INDEX idx_spots_composite ON spots (composite_score DESC);

-- GIN indexes for JSONB column queries
CREATE INDEX idx_spots_osm_tags ON spots USING GIN (osm_tags);
CREATE INDEX idx_spots_legal ON spots USING GIN (legal_status);

-- Insert initial sync_state row (no syncs performed yet)
INSERT INTO sync_state (last_sequence, last_sync_at) VALUES (0, NULL);

-- Legal GIS tables (populated via ogr2ogr from MITECO shapefiles in data/miteco/)
-- These tables are created by ogr2ogr during data import, but we define
-- spatial indexes here so they exist after any fresh import.
-- Source: «© Ministerio para la Transición Ecológica y el Reto Demográfico»

-- Natura 2000 (SRID 3042) — imported from PS.RNATURA2000_P_2024.gml
-- Table: natura2000 (geometry column: "geometry")
-- CREATE TABLE natura2000 ... created by ogr2ogr

-- National Parks / ENP (SRID 25830) — imported from enp2024_p.shp
-- Table: national_parks (geometry column: "geom")

-- Coastal Law tables (SRID 25830) — imported from MITECO Costas shapefiles
-- Tables: dpmt (MULTILINESTRING), servidumbre_proteccion, terrenos_incluidos_dpmt,
--         nucleos_excluidos_dpmt (urban exemption zones)

-- Spatial indexes for legal GIS tables (idempotent, safe to re-run)
-- These are critical for sub-millisecond ST_Intersects performance
CREATE INDEX IF NOT EXISTS idx_natura2000_geom ON natura2000 USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_national_parks_geom ON national_parks USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_dpmt_geom ON dpmt USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_servidumbre_proteccion_geom ON servidumbre_proteccion USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_nucleos_excluidos_geom ON nucleos_excluidos_dpmt USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_terrenos_incluidos_geom ON terrenos_incluidos_dpmt USING GIST (geom);
