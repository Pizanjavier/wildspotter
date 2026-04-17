import type { Pool } from 'pg';
import type { BoundingBox, SpotDetail, SpotSummary } from '../models/spot.js';

const SUMMARY_COLUMNS = `
  id,
  osm_id,
  name,
  ST_X(geom) AS lon,
  ST_Y(geom) AS lat,
  spot_type,
  surface_type,
  slope_pct,
  elevation,
  legal_status,
  composite_score,
  status
`;

const DETAIL_COLUMNS = `
  id,
  osm_id,
  name,
  ST_X(geom) AS lon,
  ST_Y(geom) AS lat,
  spot_type,
  surface_type,
  osm_tags,
  elevation,
  slope_pct,
  terrain_score,
  legal_status,
  ai_score,
  ai_details,
  context_score,
  context_details,
  landcover_class,
  landcover_label,
  siose_dominant,
  composite_score,
  satellite_image_path,
  status,
  rejection_reason,
  created_at,
  updated_at
`;

interface SummaryRow {
  id: string;
  osm_id: string | null;
  name: string | null;
  lon: number;
  lat: number;
  spot_type: string | null;
  surface_type: string | null;
  slope_pct: number | null;
  elevation: number | null;
  legal_status: Record<string, unknown> | null;
  composite_score: number | null;
  status: string;
}

interface DetailRow extends SummaryRow {
  osm_tags: Record<string, unknown> | null;
  elevation: number | null;
  slope_pct: number | null;
  terrain_score: number | null;
  legal_status: Record<string, unknown> | null;
  ai_score: number | null;
  ai_details: Record<string, unknown> | null;
  context_score: number | null;
  context_details: Record<string, unknown> | null;
  landcover_class: string | null;
  landcover_label: string | null;
  siose_dominant: Record<string, unknown> | null;
  satellite_image_path: string | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapSummaryRow = (row: SummaryRow): SpotSummary => ({
  id: row.id,
  osm_id: row.osm_id ? Number(row.osm_id) : null,
  name: row.name,
  coordinates: { lon: row.lon, lat: row.lat },
  spot_type: row.spot_type as SpotSummary['spot_type'],
  surface_type: row.surface_type as SpotSummary['surface_type'],
  slope_pct: row.slope_pct,
  elevation: row.elevation,
  legal_status: row.legal_status as SpotSummary['legal_status'],
  composite_score: row.composite_score,
  status: row.status as SpotSummary['status'],
});

const mapDetailRow = (row: DetailRow): SpotDetail => ({
  id: row.id,
  osm_id: row.osm_id ? Number(row.osm_id) : null,
  name: row.name,
  coordinates: { lon: row.lon, lat: row.lat },
  spot_type: row.spot_type as SpotDetail['spot_type'],
  surface_type: row.surface_type as SpotDetail['surface_type'],
  osm_tags: row.osm_tags,
  elevation: row.elevation,
  slope_pct: row.slope_pct,
  terrain_score: row.terrain_score,
  legal_status: row.legal_status as SpotDetail['legal_status'],
  ai_score: row.ai_score,
  ai_details: row.ai_details as SpotDetail['ai_details'],
  context_score: row.context_score,
  context_details: row.context_details,
  landcover_class: row.landcover_class,
  landcover_label: row.landcover_label,
  siose_dominant: row.siose_dominant,
  composite_score: row.composite_score,
  satellite_image_path: row.satellite_image_path,
  status: row.status as SpotDetail['status'],
  rejection_reason: row.rejection_reason,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

export const findSpotsByBbox = async (
  pool: Pool,
  bbox: BoundingBox,
  minScore: number,
  maxSlope?: number,
  hideRestricted?: boolean,
): Promise<SpotSummary[]> => {
  const conditions = [
    `status = 'completed'`,
    `geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)`,
    `(composite_score >= $5 OR composite_score IS NULL)`,
  ];
  const params: (number | boolean)[] = [
    bbox.min_lon, bbox.min_lat, bbox.max_lon, bbox.max_lat, minScore,
  ];

  if (maxSlope !== undefined && maxSlope > 0) {
    params.push(maxSlope);
    conditions.push(`(slope_pct <= $${params.length} OR slope_pct IS NULL)`);
  }

  if (hideRestricted) {
    conditions.push(`(legal_status->>'blocked' = 'false' OR legal_status IS NULL)`);
  }

  const query = `
    SELECT ${SUMMARY_COLUMNS}
    FROM spots
    WHERE ${conditions.join('\n      AND ')}
    ORDER BY composite_score DESC NULLS LAST
    LIMIT 500
  `;

  const result = await pool.query<SummaryRow>(query, params);
  return result.rows.map(mapSummaryRow);
};

export const findSpotById = async (
  pool: Pool,
  id: string,
): Promise<SpotDetail | null> => {
  const query = `
    SELECT ${DETAIL_COLUMNS}
    FROM spots
    WHERE id = $1
  `;

  const result = await pool.query<DetailRow>(query, [id]);
  if (result.rows.length === 0) return null;
  return mapDetailRow(result.rows[0]);
};
