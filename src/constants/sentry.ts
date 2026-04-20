/**
 * Sentry crash reporting configuration.
 *
 * The DSN below is the project's real Sentry DSN. It can be
 * overridden via EXPO_PUBLIC_SENTRY_DSN if needed (e.g. staging).
 */

const DEFAULT_DSN = 'https://5cc01c5880c856cedae67645f08ed135@o4511224843665408.ingest.de.sentry.io/4511224869945424';

export const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN || DEFAULT_DSN;

export const SENTRY_ENVIRONMENT: string = (() => {
  const explicit = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;
  if (explicit) return explicit;
  if (__DEV__) return 'development';
  return 'production';
})();

export const SENTRY_ENABLED = SENTRY_DSN.length > 0;

