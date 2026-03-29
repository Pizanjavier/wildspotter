export type SpotCoordinates = {
  lat: number;
  lon: number;
};

export type LegalCheck = {
  inside: boolean;
  zone_name?: string | null;
  park_name?: string | null;
  distance_m?: number | null;
  classification?: string | null;
  private?: boolean;
};

export type LegalStatus = {
  natura2000: LegalCheck;
  national_park: LegalCheck;
  coastal_law: LegalCheck;
  cadastre: LegalCheck;
  blocked: boolean;
};

export type SpotSummary = {
  id: string;
  osm_id: number;
  name: string | null;
  coordinates: SpotCoordinates;
  spot_type: string;
  surface_type: string;
  slope_pct: number | null;
  elevation: number | null;
  legal_status: LegalStatus | null;
  composite_score: number;
  status: string;
};

export type ContextSubScore = {
  score: number;
  nearest_road?: string;
  distance_m?: number | null;
  building_count?: number;
  radius_m?: number;
  features?: string[];
  is_dead_end?: boolean;
  nearest_place?: string;
  place_distance_m?: number;
  nearby?: boolean;
  caravan_sites_5km?: number;
};

export type ContextDetails = {
  road_noise: ContextSubScore;
  urban_density: ContextSubScore;
  scenic_value: ContextSubScore;
  privacy: ContextSubScore;
  industrial: ContextSubScore;
  railway: ContextSubScore;
  van_community: ContextSubScore;
};

export type AiDetails = {
  surface_quality: number;
  vehicle_access: number;
  open_space: number;
  van_presence: number;
  obstruction_absence: number;
};

export type SpotDetail = SpotSummary & {
  terrain_score: number | null;
  ai_score: number | null;
  ai_details: AiDetails | null;
  context_score: number | null;
  context_details: ContextDetails | null;
  satellite_image_path: string | null;
  osm_tags: Record<string, string> | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type BoundingBox = {
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
};
