import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { SLOPE_THRESHOLD } from '@/constants/config';
import { trackEvent } from '@/services/analytics';
import type { ThemeMode } from '@/constants/theme';

const detectDefaultLanguage = (): string => {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode;
    if (code === 'es') return 'es';
    return 'en';
  } catch {
    return 'en';
  }
};

const STORAGE_KEY = 'wildspotter-settings';

type PersistedState = {
  slopeThreshold: number;
  minScore: number;
  hideRestricted: boolean;
  showLegalZones: boolean;
  language: string;
  theme: ThemeMode;
  analyticsEnabled: boolean;
};

type SettingsStore = PersistedState & {
  filtersVersion: number;
  _hydrated: boolean;
  setSlopeThreshold: (value: number) => void;
  setMinScore: (value: number) => void;
  setHideRestricted: (value: boolean) => void;
  setShowLegalZones: (value: boolean) => void;
  setLanguage: (value: string) => void;
  setTheme: (value: ThemeMode) => void;
  setAnalyticsEnabled: (value: boolean) => void;
};

const persistFields = (state: SettingsStore): PersistedState => ({
  slopeThreshold: state.slopeThreshold,
  minScore: state.minScore,
  hideRestricted: state.hideRestricted,
  showLegalZones: state.showLegalZones,
  language: state.language,
  theme: state.theme,
  analyticsEnabled: state.analyticsEnabled,
});

const saveToStorage = (state: SettingsStore) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistFields(state)));
};

const trackConfigChange = (setting: string, value: string | number | boolean) => {
  trackEvent('config_changed', { setting, value });
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  slopeThreshold: SLOPE_THRESHOLD,
  minScore: 0,
  hideRestricted: false,
  showLegalZones: false,
  language: detectDefaultLanguage(),
  theme: 'light',
  analyticsEnabled: true,
  filtersVersion: 0,
  _hydrated: false,
  setSlopeThreshold: (value) => {
    set((s) => ({ slopeThreshold: value, filtersVersion: s.filtersVersion + 1 }));
    saveToStorage(get());
    trackConfigChange('slopeThreshold', value);
  },
  setMinScore: (value) => {
    set((s) => ({ minScore: value, filtersVersion: s.filtersVersion + 1 }));
    saveToStorage(get());
    trackConfigChange('minScore', value);
  },
  setHideRestricted: (value) => {
    set((s) => ({ hideRestricted: value, filtersVersion: s.filtersVersion + 1 }));
    saveToStorage(get());
    trackConfigChange('hideRestricted', value);
  },
  setShowLegalZones: (value) => {
    set({ showLegalZones: value });
    saveToStorage(get());
    trackConfigChange('showLegalZones', value);
  },
  setLanguage: (value) => {
    set({ language: value });
    saveToStorage(get());
    trackConfigChange('language', value);
  },
  setTheme: (value) => {
    set({ theme: value });
    saveToStorage(get());
    trackConfigChange('theme', value);
  },
  setAnalyticsEnabled: (value) => {
    set({ analyticsEnabled: value });
    saveToStorage(get());
    if (value) {
      trackConfigChange('analyticsEnabled', value);
    }
  },
}));

export const hydrateSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.language === undefined) {
        parsed.language = detectDefaultLanguage();
      }
      useSettingsStore.setState({ ...parsed, _hydrated: true });
    } else {
      useSettingsStore.setState({
        language: detectDefaultLanguage(),
        _hydrated: true,
      });
    }
  } catch {
    useSettingsStore.setState({ _hydrated: true });
  }
};

if (__DEV__) {
  (globalThis as Record<string, unknown>).__settingsStore =
    useSettingsStore;
}
