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
