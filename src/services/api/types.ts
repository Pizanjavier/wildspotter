export type SpotCoordinates = {
  lat: number;
  lon: number;
};

export type LegalCheck = {
  inside?: boolean;
  classification?: string | null;
  private?: boolean;
  ref?: string | null;
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
  context_details: ContextDetails | null;
  composite_score: number;
  status: string;
  municipality: string | null;
  province: string | null;
  satellite_image_path: string | null;
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
  drinking_water?: ContextSubScore;
  dog_friendly?: ContextSubScore;
  wild_bonus_raw?: number;
  wild_bonus?: number;
  landcover_penalty?: number;
  wild_paths?: string[];
  ai_gate?: number;
  onspot_quarry?: boolean;
};

export type SioseDominant = {
  code?: string | null;
  label?: string | null;
  cover_pct?: number | null;
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
  landcover_class: string | null;
  landcover_label: string | null;
  siose_dominant: SioseDominant | null;
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

export type ConfidenceTier = 'verified' | 'automated' | 'unverified';

export type DecreeArticle = {
  title: string;
  number: string;
  text_verbatim: string;
  restrictions: string[];
  exceptions: string[];
  max_stay_hours: number | null;
  legal_distinction: string | null;
};

export type LegalDocument = {
  id: string;
  source_id: string;
  title: string;
  restriction_type: string;
  affected_municipality: string | null;
  affected_province: string | null;
  affected_ccaa: string | null;
  confidence_tier: ConfidenceTier;
  effective_from: string | null;
  effective_until: string | null;
  seasonal: boolean;
  season_start_month: number | null;
  season_end_month: number | null;
  decree_ref: string | null;
  source_url: string | null;
  status: string;
  created_at: string;
  decree_articles?: DecreeArticle[] | null;
};
