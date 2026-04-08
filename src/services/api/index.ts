export { getSpots, getSpotDetail } from '@/services/api/spots';
export type { SpotFilters } from '@/services/api/spots';
export { get, post, ApiError, buildSatelliteUrl } from '@/services/api/client';
export { reportSpot } from '@/services/api/reports';
export type { ReportCategory } from '@/services/api/reports';
export type {
  SpotCoordinates,
  LegalCheck,
  LegalStatus,
  SpotSummary,
  SpotDetail,
  BoundingBox,
} from '@/services/api/types';
