/**
 * Sentry crash reporting configuration.
 *
 * Replace SENTRY_DSN with your actual DSN from https://sentry.io
 * You can also set it via the EXPO_PUBLIC_SENTRY_DSN environment variable.
 */

const FALLBACK_DSN = 'YOUR_SENTRY_DSN_HERE';

export const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ?? FALLBACK_DSN;

export const SENTRY_ENVIRONMENT: string = (() => {
  const explicit = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;
  if (explicit) return explicit;
  if (__DEV__) return 'development';
  return 'production';
})();

export const SENTRY_ENABLED = SENTRY_DSN !== FALLBACK_DSN;
