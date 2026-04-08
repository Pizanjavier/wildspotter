import { es } from './es';
import { en } from './en';

export const dictionaries = { es, en } as const;
export type Locale = keyof typeof dictionaries;

export const getDict = (locale: Locale) => dictionaries[locale];
export const localeHref = (locale: Locale, path: string = '/') =>
  locale === 'es' ? path : `/en${path === '/' ? '' : path}`;
