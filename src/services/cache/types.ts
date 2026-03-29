import type { BoundingBox } from '@/types/map';
import type { SpotSummary } from '@/services/api/types';

export type CachedScan = {
  id: string;
  boundingBox: BoundingBox;
  spots: SpotSummary[];
  regionName: string;
  cachedAt: number;
  expiresAt: number;
};

/** 7 days in milliseconds */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const CACHE_KEY_PREFIX = 'ws_scan_';
