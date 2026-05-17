import { get } from '@/services/api/client';
import type { BoundingBox, SpotSummary, SpotDetail, LegalDocument } from '@/services/api/types';

export type SpotFilters = {
  minScore?: number;
  maxSlope?: number;
  hideRestricted?: boolean;
};

export const getSpots = async (
  bbox: BoundingBox,
  filters?: SpotFilters,
): Promise<SpotSummary[]> => {
  const params: Record<string, string | number | boolean | undefined> = {
    min_lat: bbox.min_lat,
    min_lon: bbox.min_lon,
    max_lat: bbox.max_lat,
    max_lon: bbox.max_lon,
    min_score: filters?.minScore,
    max_slope: filters?.maxSlope,
    hide_restricted: filters?.hideRestricted || undefined,
  };

  return get<SpotSummary[]>('/spots', params);
};

export const getSpotDetail = async (
  id: string,
): Promise<SpotDetail> => {
  return get<SpotDetail>(`/spots/${id}`);
};

export const getLegalDocuments = async (
  lat: number,
  lon: number,
  radiusKm: number = 50,
): Promise<LegalDocument[]> => {
  const response = await get<{ documents: LegalDocument[]; count: number }>(
    '/legal/documents',
    { lat, lon, radius: radiusKm },
  );
  return response.documents;
};
