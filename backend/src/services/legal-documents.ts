import type { Pool } from 'pg';

export interface DecreeArticleRow {
  number: string;
  title: string;
  text_verbatim: string;
  legal_distinction: string | null;
  max_stay_hours: number | null;
  restrictions: string[];
  exceptions: string[];
}

export interface LegalDocumentRow {
  id: string;
  source_id: string;
  title: string;
  restriction_type: string;
  affected_municipality: string | null;
  affected_province: string | null;
  affected_ccaa: string | null;
  confidence_tier: string;
  effective_from: string | null;
  effective_until: string | null;
  seasonal: boolean;
  season_start_month: number | null;
  season_end_month: number | null;
  decree_ref: string | null;
  source_url: string | null;
  status: string;
  created_at: string;
  decree_articles: DecreeArticleRow[] | null;
}

export interface LegalSourceRow {
  id: string;
  name: string;
  source_type: string;
  region: string | null;
  url: string | null;
  health: string;
  consecutive_failures: number;
  last_checked_at: string | null;
  last_changed_at: string | null;
}

const DOCUMENT_COLUMNS = `
  id, source_id, title, restriction_type,
  affected_municipality, affected_province, affected_ccaa,
  confidence_tier, effective_from, effective_until,
  seasonal, season_start_month, season_end_month,
  decree_ref, source_url, status, created_at, decree_articles
`;

export const findLegalDocumentsByLocation = async (
  pool: Pool,
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<LegalDocumentRow[]> => {
  const { rows } = await pool.query<LegalDocumentRow>(
    `SELECT ${DOCUMENT_COLUMNS}
     FROM legal_documents
     WHERE status = 'active'
       AND needs_review = FALSE
       AND LENGTH(title) > 40
       AND restriction_type != 'other'
       AND (
         -- 1. Has specific area and is within radius
         (affected_area IS NOT NULL AND ST_DWithin(
           affected_area::geography,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $3
         ))
         OR
         -- 2. No specific area, but affects the CCAA where the spot is located
         (affected_area IS NULL AND affected_ccaa IS NOT NULL AND affected_ccaa = (
             SELECT ccaa FROM municipalities
             WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
             LIMIT 1
         ))
         OR
         -- 3. National restriction (no specific area, CCAA, or province)
         (affected_area IS NULL AND affected_ccaa IS NULL AND affected_province IS NULL AND affected_municipality IS NULL)
       )
     ORDER BY
       CASE confidence_tier
         WHEN 'verified' THEN 0
         WHEN 'automated' THEN 1
         ELSE 2
       END,
       CASE restriction_type
         WHEN 'camping_ban' THEN 0
         WHEN 'overnight_ban' THEN 1
         WHEN 'parking_ban' THEN 2
         WHEN 'fire_ban' THEN 3
         WHEN 'access_restriction' THEN 4
         WHEN 'tourism_decree' THEN 5
         ELSE 6
       END,
       created_at DESC
     LIMIT 20`,
    [lon, lat, radiusKm * 1000],
  );
  return rows;
};

export const findLegalDocumentById = async (
  pool: Pool,
  id: string,
): Promise<LegalDocumentRow | null> => {
  const { rows } = await pool.query<LegalDocumentRow>(
    `SELECT ${DOCUMENT_COLUMNS} FROM legal_documents WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const findLegalSources = async (
  pool: Pool,
): Promise<LegalSourceRow[]> => {
  const { rows } = await pool.query<LegalSourceRow>(
    `SELECT id, name, source_type, region, url, health,
            consecutive_failures, last_checked_at, last_changed_at
     FROM legal_source_state
     ORDER BY
       CASE health WHEN 'RED' THEN 0 WHEN 'YELLOW' THEN 1 ELSE 2 END,
       name`,
  );
  return rows;
};

export const findDecreesByCcaa = async (
  pool: Pool,
  ccaa: string,
): Promise<LegalDocumentRow[]> => {
  const { rows } = await pool.query<LegalDocumentRow>(
    `SELECT ${DOCUMENT_COLUMNS}
     FROM legal_documents
     WHERE restriction_type = 'tourism_decree'
       AND LOWER(affected_ccaa) = LOWER($1)
       AND status = 'active'
     ORDER BY effective_from DESC`,
    [ccaa],
  );
  return rows;
};
