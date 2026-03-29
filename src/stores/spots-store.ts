import { create } from 'zustand';
import type { SpotSummary } from '@/services/api/types';
import { getItem, setItem, removeItem } from '@/services/cache/storage';

const STORAGE_KEY = 'wildspotter:saved-spots';

type SpotsStore = {
  savedSpots: SpotSummary[];
  hydrated: boolean;
  addSpot: (spot: SpotSummary) => void;
  removeSpot: (id: string) => void;
  isSaved: (id: string) => boolean;
  loadSaved: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const persistSpots = async (spots: SpotSummary[]): Promise<void> => {
  try {
    await setItem(STORAGE_KEY, JSON.stringify(spots));
  } catch (err: unknown) {
    console.warn(
      '[SpotsStore] Failed to persist spots:',
      err instanceof Error ? err.message : err,
    );
  }
};

export const useSpotsStore = create<SpotsStore>((set, get) => ({
  savedSpots: [],
  hydrated: false,

  addSpot: (spot) => {
    const { savedSpots } = get();
    if (savedSpots.some((s) => s.id === spot.id)) return;

    const updated = [...savedSpots, spot];
    set({ savedSpots: updated });
    void persistSpots(updated);
  },

  removeSpot: (id) => {
    const updated = get().savedSpots.filter((s) => s.id !== id);
    set({ savedSpots: updated });
    void persistSpots(updated);
  },

  isSaved: (id) => get().savedSpots.some((s) => s.id === id),

  loadSaved: async () => {
    try {
      const raw = await getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        set({ hydrated: true });
        return;
      }

      set({ savedSpots: parsed as SpotSummary[], hydrated: true });
    } catch (err: unknown) {
      console.warn(
        '[SpotsStore] Failed to load saved spots:',
        err instanceof Error ? err.message : err,
      );
      set({ hydrated: true });
    }
  },

  clearAll: async () => {
    set({ savedSpots: [] });
    try {
      await removeItem(STORAGE_KEY);
    } catch (err: unknown) {
      console.warn(
        '[SpotsStore] Failed to clear storage:',
        err instanceof Error ? err.message : err,
      );
    }
  },
}));

if (__DEV__) {
  (globalThis as Record<string, unknown>).__spotsStore = useSpotsStore;
}
