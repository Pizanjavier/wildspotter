import * as Sentry from '@sentry/react-native';
import {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_ENABLED,
} from '@/constants/sentry';

let initialized = false;

/**
 * Initialise Sentry crash reporting.
 * Call once at module scope in _layout.tsx (before the component renders).
 *
 * When SENTRY_DSN is the placeholder value, init is skipped so local dev
 * never sends events by accident.
 */
export const initSentry = (): void => {
  if (initialized || !SENTRY_ENABLED) {
    if (!SENTRY_ENABLED) {
      console.log('[Sentry] Disabled — set EXPO_PUBLIC_SENTRY_DSN to enable.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    debug: __DEV__,

    // Capture unhandled JS exceptions and promise rejections
    enableAutoSessionTracking: true,

    // Performance monitoring — sample 20% in prod, 100% in dev
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Breadcrumbs are enabled by default (console, fetch, navigation)
    enableNativeCrashHandling: true,

    // Attach useful context
    beforeSend(event) {
      // Strip events in dev if you only want prod data
      // (currently we allow them for testing the integration)
      return event;
    },
  });

  initialized = true;
};
