-- Legal monitoring pipeline tables
-- Run inside the db container:
--   docker-compose exec -T db psql -U wildspotter -d wildspotter < db/migrations/002_legal_pipeline.sql
--
-- Rollback:
--   DROP TABLE IF EXISTS comarcas CASCADE;
--   DROP TABLE IF EXISTS municipalities CASCADE;
--   DROP TABLE IF EXISTS legal_documents CASCADE;
--   DROP TABLE IF EXISTS legal_source_state CASCADE;
--   DROP TABLE IF EXISTS legal_keywords CASCADE;

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tracks 67+ monitored legal bulletin sources with hash-based change detection
CREATE TABLE IF NOT EXISTS legal_source_state (
    id                    VARCHAR PRIMARY KEY,
    name                  VARCHAR NOT NULL,
    source_type           VARCHAR NOT NULL CHECK (source_type IN ('rss', 'api', 'html', 'email', 'pdf')),
    region                VARCHAR NOT NULL,
    url                   VARCHAR,
    poll_interval_hours   INTEGER NOT NULL DEFAULT 24,
    content_hash          VARCHAR,
    last_checked_at       TIMESTAMPTZ,
    last_changed_at       TIMESTAMPTZ,
    consecutive_failures  INTEGER NOT NULL DEFAULT 0,
    health                VARCHAR NOT NULL DEFAULT 'GREEN' CHECK (health IN ('GREEN', 'YELLOW', 'RED')),
    last_error            TEXT,
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Parsed legal restrictions with geometry, confidence tiers, expiration
CREATE TABLE IF NOT EXISTS legal_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id           VARCHAR NOT NULL REFERENCES legal_source_state(id),
    external_id         VARCHAR,
    title               VARCHAR NOT NULL,
    body                TEXT,
    restriction_type    VARCHAR NOT NULL CHECK (restriction_type IN (
        'parking_ban', 'overnight_ban', 'camping_ban', 'fire_ban',
        'access_restriction', 'seasonal_closure', 'speed_limit',
        'noise_ordinance', 'waste_ordinance', 'tourism_decree', 'other'
    )),
    affected_area       GEOMETRY(MultiPolygon, 4326),
    affected_municipality VARCHAR,
    affected_province   VARCHAR,
    affected_ccaa       VARCHAR,
    confidence_tier     VARCHAR NOT NULL DEFAULT 'unverified' CHECK (confidence_tier IN (
        'verified', 'automated', 'unverified'
    )),
    effective_from      DATE,
    effective_until     DATE,
    seasonal            BOOLEAN DEFAULT FALSE,
    season_start_month  INTEGER CHECK (season_start_month BETWEEN 1 AND 12),
    season_end_month    INTEGER CHECK (season_end_month BETWEEN 1 AND 12),
    content_hash        VARCHAR NOT NULL,
    raw_text            TEXT,
    llm_confidence      FLOAT,
    needs_review        BOOLEAN DEFAULT FALSE,
    status              VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'superseded', 'needs_refresh')),
    decree_ref          VARCHAR,
    decree_articles     JSONB,
    source_url          VARCHAR,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 8,131 Spanish municipalities with INE codes + PostGIS boundaries (populated Phase 4)
CREATE TABLE IF NOT EXISTS municipalities (
    id                  SERIAL PRIMARY KEY,
    ine_code            VARCHAR(5) UNIQUE NOT NULL,
    nombre              VARCHAR NOT NULL,
    nombre_normalized   VARCHAR NOT NULL,
    provincia           VARCHAR NOT NULL,
    provincia_code      VARCHAR(2) NOT NULL,
    ccaa                VARCHAR NOT NULL,
    geom                GEOMETRY(MultiPolygon, 4326),
    population          INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-municipality regions (populated Phase 4)
CREATE TABLE IF NOT EXISTS comarcas (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR NOT NULL,
    nombre_normalized   VARCHAR NOT NULL,
    ccaa                VARCHAR NOT NULL,
    geom                GEOMETRY(MultiPolygon, 4326),
    municipality_ids    INTEGER[],
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- DB-stored keyword list for the keyword gate (Phase 6)
CREATE TABLE IF NOT EXISTS legal_keywords (
    id                  SERIAL PRIMARY KEY,
    pattern             VARCHAR NOT NULL UNIQUE,
    category            VARCHAR NOT NULL DEFAULT 'general',
    added_by            VARCHAR NOT NULL DEFAULT 'manual' CHECK (added_by IN ('manual', 'llm_expansion')),
    hit_count           INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes: GIST on geometries
CREATE INDEX IF NOT EXISTS idx_legal_documents_area ON legal_documents USING GIST (affected_area);
CREATE INDEX IF NOT EXISTS idx_municipalities_geom ON municipalities USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_comarcas_geom ON comarcas USING GIST (geom);

-- GIN on nombre_normalized for trigram fuzzy search
CREATE INDEX IF NOT EXISTS idx_municipalities_nombre_trgm ON municipalities USING GIN (nombre_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_comarcas_nombre_trgm ON comarcas USING GIN (nombre_normalized gin_trgm_ops);

-- B-tree on content_hash for dedup
CREATE INDEX IF NOT EXISTS idx_legal_documents_content_hash ON legal_documents (content_hash);

-- Composite on effective dates for expiration queries
CREATE INDEX IF NOT EXISTS idx_legal_documents_effective ON legal_documents (effective_from, effective_until) WHERE status = 'active';

-- Source + status for filtered lookups
CREATE INDEX IF NOT EXISTS idx_legal_documents_source ON legal_documents (source_id, status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_restriction_type ON legal_documents (restriction_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_ccaa ON legal_documents (affected_ccaa);

-- INE code lookup
CREATE INDEX IF NOT EXISTS idx_municipalities_ine ON municipalities (ine_code);
CREATE INDEX IF NOT EXISTS idx_municipalities_provincia ON municipalities (provincia_code);

-- Seed initial keyword patterns
INSERT INTO legal_keywords (pattern, category) VALUES
    ('autocaravana', 'vehicle'),
    ('pernocta', 'overnight'),
    ('acampada', 'camping'),
    ('estacionamiento', 'parking'),
    ('camping', 'camping'),
    ('caravana', 'vehicle'),
    ('aparcamiento.*nocturno', 'parking'),
    ('vehiculo.*vivienda', 'vehicle'),
    ('prohibi.*aparcar', 'parking'),
    ('vehiculos de uso habitacional', 'vehicle'),
    ('acampada libre', 'camping'),
    ('acampada difusa', 'camping'),
    ('estacionamiento prolongado', 'parking'),
    ('incendios forestales', 'fire')
ON CONFLICT (pattern) DO NOTHING;

COMMIT;
