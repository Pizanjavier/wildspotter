import { getLocales } from 'expo-localization';
import { es } from '@/i18n/locales/es';
import { en } from '@/i18n/locales/en';
import type { Locale, TranslationDictionary } from '@/i18n/types';

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  es,
  en,
};

const DEFAULT_LOCALE: Locale = 'en';

const readRawLocale = (): string | null => {
  try {
    const locales = getLocales();
    const code = locales?.[0]?.languageCode;
    if (code) return code;
  } catch {
    // expo-localization unavailable
  }
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.language === 'string'
  ) {
    return navigator.language;
  }
  return null;
};

const detectLocale = (): Locale => {
  const raw = readRawLocale();
  if (raw && raw.toLowerCase().startsWith('es')) return 'es';
  return DEFAULT_LOCALE;
};

let currentLocale: Locale = detectLocale();

export const getLocale = (): Locale => currentLocale;

export const setLocale = (locale: Locale): void => {
  currentLocale = locale;
};

type NestedRecord = {
  [key: string]: string | NestedRecord;
};

const getNestedValue = (
  obj: NestedRecord,
  path: string,
): string | undefined => {
  const keys = path.split('.');
  let current: string | NestedRecord | undefined = obj;

  for (const key of keys) {
    if (current === undefined || typeof current === 'string') {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === 'string' ? current : undefined;
};

const interpolate = (
  template: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return template;

  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => {
      const value = params[key];
      return value !== undefined ? String(value) : `{{${key}}}`;
    },
  );
};

/**
 * Translate a dot-notation key with optional interpolation.
 *
 * Lookup order:
 * 1. Current locale dictionary
 * 2. Spanish (default) dictionary as fallback
 * 3. The raw key itself if missing everywhere
 *
 * Interpolation uses `{{variable}}` syntax:
 *   t('map.spotsFound', { count: 5 }) => "5 SPOTS FOUND"
 */
export const t = (
  key: string,
  params?: Record<string, string | number>,
): string => {
  const dict = DICTIONARIES[currentLocale] as unknown as NestedRecord;
  const fallback = DICTIONARIES[DEFAULT_LOCALE] as unknown as NestedRecord;

  const value =
    getNestedValue(dict, key) ??
    getNestedValue(fallback, key) ??
    key;

  return interpolate(value, params);
};
