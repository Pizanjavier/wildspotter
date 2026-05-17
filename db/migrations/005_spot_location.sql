-- Add municipality/province columns to spots for display purposes.
-- Populated by reverse-geocoding against the municipalities table.

ALTER TABLE spots ADD COLUMN IF NOT EXISTS municipality VARCHAR;
ALTER TABLE spots ADD COLUMN IF NOT EXISTS province VARCHAR;

CREATE INDEX IF NOT EXISTS idx_spots_province ON spots (province);

-- Backfill from municipalities table (requires municipalities to be populated)
UPDATE spots s
SET
    municipality = m.nombre,
    province     = m.provincia
FROM municipalities m
WHERE s.municipality IS NULL
  AND m.geom IS NOT NULL
  AND ST_Contains(m.geom, s.geom);
