-- SPEC_V3 §5: add land-cover columns to spots
-- Run inside the db container:
--   docker-compose exec -T db psql -U wildspotter -d wildspotter < db/migrations/001_landcover.sql
--
-- Rollback:
--   ALTER TABLE spots
--     DROP COLUMN IF EXISTS landcover_class,
--     DROP COLUMN IF EXISTS landcover_label,
--     DROP COLUMN IF EXISTS siose_dominant;
--   DROP INDEX IF EXISTS idx_spots_landcover_class;

BEGIN;

ALTER TABLE spots
    ADD COLUMN IF NOT EXISTS landcover_class TEXT,
    ADD COLUMN IF NOT EXISTS landcover_label TEXT,
    ADD COLUMN IF NOT EXISTS siose_dominant  JSONB;

CREATE INDEX IF NOT EXISTS idx_spots_landcover_class
    ON spots (landcover_class);

-- status is plain VARCHAR in init.sql — no enum migration needed.
-- The landcover worker will start writing status = 'landcover_done' once deployed.

COMMIT;
