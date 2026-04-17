export type SpotStatus = 'pending' | 'terrain_done' | 'legal_done' | 'ai_done' | 'context_done' | 'completed' | 'rejected';

export interface AiDetails {
  surface_quality: number;
  vehicle_access: number;
  open_space: number;
  van_presence: number;
  obstruction_absence: number;
}

export type SpotType = 'dead_end' | 'dirt_parking' | 'clearing' | 'viewpoint_adjacent';

export type SurfaceType = 'dirt' | 'gravel' | 'grass' | 'asphalt' | 'unknown';

export interface Natura2000Status {
  inside: boolean;
  zone_name: string | null;
}

export interface NationalParkStatus {
  inside: boolean;
  park_name: string | null;
}

export interface CoastalLawStatus {
  inside: boolean;
  distance_m: number | null;
}

export interface CadastreStatus {
  classification: string;
  private: boolean;
}

export interface LegalStatus {
  natura2000: Natura2000Status;
  national_park: NationalParkStatus;
  coastal_law: CoastalLawStatus;
  cadastre: CadastreStatus;
  blocked: boolean;
}

export interface SpotCoordinates {
  lon: number;
  lat: number;
}

/** Lightweight spot representation for list/map views */
export interface SpotSummary {
  id: string;
  osm_id: number | null;
  name: string | null;
  coordinates: SpotCoordinates;
  spot_type: SpotType | null;
  surface_type: SurfaceType | null;
  slope_pct: number | null;
  elevation: number | null;
  legal_status: LegalStatus | null;
  composite_score: number | null;
  status: SpotStatus;
}

/** Full spot detail including all processing results */
export interface SpotDetail {
  id: string;
  osm_id: number | null;
  name: string | null;
  coordinates: SpotCoordinates;
  spot_type: SpotType | null;
  surface_type: SurfaceType | null;
  osm_tags: Record<string, unknown> | null;
  elevation: number | null;
  slope_pct: number | null;
  terrain_score: number | null;
  legal_status: LegalStatus | null;
  ai_score: number | null;
  ai_details: AiDetails | null;
  context_score: number | null;
  context_details: Record<string, unknown> | null;
  landcover_class: string | null;
  landcover_label: string | null;
  siose_dominant: Record<string, unknown> | null;
  composite_score: number | null;
  satellite_image_path: string | null;
  status: SpotStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** Bounding box for spatial queries */
export interface BoundingBox {
  min_lon: number;
  min_lat: number;
  max_lon: number;
  max_lat: number;
}
