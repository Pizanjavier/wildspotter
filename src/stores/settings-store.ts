import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SLOPE_THRESHOLD } from '@/constants/config';
import type { ThemeMode } from '@/constants/theme';

const STORAGE_KEY = 'wildspotter-settings';

type PersistedState = {
  slopeThreshold: number;
  minScore: number;
  hideRestricted: boolean;
  showLegalZones: boolean;
  offlineMode: boolean;
  language: string;
  theme: ThemeMode;
};

type SettingsStore = PersistedState & {
  filtersVersion: number;
  _hydrated: boolean;
  setSlopeThreshold: (value: number) => void;
  setMinScore: (value: number) => void;
  setHideRestricted: (value: boolean) => void;
  setShowLegalZones: (value: boolean) => void;
  setOfflineMode: (value: boolean) => void;
  setLanguage: (value: string) => void;
  setTheme: (value: ThemeMode) => void;
};

const persistFields = (state: SettingsStore): PersistedState => ({
  slopeThreshold: state.slopeThreshold,
  minScore: state.minScore,
  hideRestricted: state.hideRestricted,
  showLegalZones: state.showLegalZones,
  offlineMode: state.offlineMode,
  language: state.language,
  theme: state.theme,
});

const saveToStorage = (state: SettingsStore) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistFields(state)));
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  slopeThreshold: SLOPE_THRESHOLD,
  minScore: 0,
  hideRestricted: false,
  showLegalZones: false,
  offlineMode: false,
  language: 'en',
  theme: 'light',
  filtersVersion: 0,
  _hydrated: false,
  setSlopeThreshold: (value) => {
    set((s) => ({ slopeThreshold: value, filtersVersion: s.filtersVersion + 1 }));
    saveToStorage(get());
  },
  setMinScore: (value) => {
    set((s) => ({ minScore: value, filtersVersion: s.filtersVersion + 1 }));
    saveToStorage(get());
  },
  setHideRestricted: (value) => {
    set((s) => ({ hideRestricted: value, filtersVersion: s.filtersVersion + 1 }));
    saveToStorage(get());
  },
  setShowLegalZones: (value) => {
    set({ showLegalZones: value });
    saveToStorage(get());
  },
  setOfflineMode: (value) => {
    set({ offlineMode: value });
    saveToStorage(get());
  },
  setLanguage: (value) => {
    set({ language: value });
    saveToStorage(get());
  },
  setTheme: (value) => {
    set({ theme: value });
    saveToStorage(get());
  },
}));

export const hydrateSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      useSettingsStore.setState({ ...parsed, _hydrated: true });
    } else {
      useSettingsStore.setState({ _hydrated: true });
    }
  } catch {
    useSettingsStore.setState({ _hydrated: true });
  }
};

if (__DEV__) {
  (globalThis as Record<string, unknown>).__settingsStore =
    useSettingsStore;
}
