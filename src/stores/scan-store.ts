import { create } from 'zustand';
import type { BoundingBox } from '@/types/map';
import type { SpotSummary } from '@/services/api/types';
import type { ScanState } from '@/types/scan';
import { getSpots, ApiError } from '@/services/api';
import type { SpotFilters } from '@/services/api';
import { useSettingsStore } from '@/stores/settings-store';
import {
  getCachedScan,
  cacheScan,
  CACHE_TTL_MS,
} from '@/services/cache';

type ScanStore = {
  state: ScanState;
  spots: SpotSummary[];
  regionName: string;
  error: string | null;
  fromCache: boolean;
  startScan: (bounds: BoundingBox) => Promise<void>;
  refreshScan: (bounds: BoundingBox) => Promise<void>;
  reset: () => void;
};

const formatRegionName = (bounds: BoundingBox): string => {
  const centerLat = ((bounds.north + bounds.south) / 2).toFixed(2);
  const centerLng = ((bounds.east + bounds.west) / 2).toFixed(2);
  return `${centerLat}N, ${centerLng}${Number(centerLng) >= 0 ? 'E' : 'W'}`;
};

const fetchSpots = async (
  bounds: BoundingBox,
  set: (partial: Partial<ScanStore>) => void,
): Promise<void> => {
  const regionName = formatRegionName(bounds);

  set({
    state: 'scanning',
    spots: [],
    error: null,
    fromCache: false,
    regionName,
  });

  const settings = useSettingsStore.getState();
  const filters: SpotFilters = {
    maxSlope: settings.slopeThreshold > 0 ? settings.slopeThreshold : undefined,
    minScore: settings.minScore > 0 ? settings.minScore : undefined,
    hideRestricted: settings.hideRestricted || undefined,
  };

  const spots = await getSpots({
    min_lat: bounds.south,
    min_lon: bounds.west,
    max_lat: bounds.north,
    max_lon: bounds.east,
  }, filters);

  const sorted = [...spots].sort(
    (a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0),
  );

  set({
    state: 'complete',
    spots: sorted,
  });

  const now = Date.now();
  await cacheScan({
    id: `${now}`,
    boundingBox: bounds,
    spots: sorted,
    regionName,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  }).catch((err: unknown) => {
    console.warn('[ScanStore] Failed to cache scan:', err);
  });
};

export const useScanStore = create<ScanStore>((set, get) => ({
  state: 'idle',
  spots: [],
  regionName: '',
  error: null,
  fromCache: false,

  startScan: async (bounds: BoundingBox) => {
    if (get().state === 'scanning') return;

    try {
      const cached = await getCachedScan(bounds);
      if (cached) {
        set({
          state: 'complete',
          spots: cached.spots,
          regionName: cached.regionName,
          error: null,
          fromCache: true,
        });
        return;
      }

      await fetchSpots(bounds, set);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unknown error during scan';

      console.error('[ScanStore] Scan failed:', message);
      set({ state: 'error', error: message });
    }
  },

  refreshScan: async (bounds: BoundingBox) => {
    if (get().state === 'scanning') return;

    try {
      await fetchSpots(bounds, set);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unknown error during scan';

      console.error('[ScanStore] Scan failed:', message);
      set({ state: 'error', error: message });
    }
  },

  reset: () =>
    set({
      state: 'idle',
      spots: [],
      regionName: '',
      error: null,
      fromCache: false,
    }),
}));

if (__DEV__) {
  (globalThis as Record<string, unknown>).__scanStore = useScanStore;
}
