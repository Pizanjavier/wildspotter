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

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Enable Logs
    enableLogs: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,

    // Attach useful context
    beforeSend(event) {
      // Strip events in dev if you only want prod data
      // (currently we allow them for testing the integration)
      return event;
    },
  });

  initialized = true;
};
