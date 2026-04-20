import PostHog from 'posthog-react-native';
import type { JsonType } from '@posthog/core';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '@/constants/analytics';

/**
 * Lightweight analytics wrapper around PostHog.
 *
 * If POSTHOG_API_KEY is not set the module stays inert — every
 * call is a no-op so the app never blocks on analytics.
 */

let client: PostHog | null = null;

const isEnabled = (): boolean => POSTHOG_API_KEY.length > 0;

/**
 * Initialise the PostHog client. Safe to call multiple times.
 */
export const initAnalytics = (): void => {
  if (client || !isEnabled()) {
    if (!isEnabled()) {
      console.log('[Analytics] Disabled — set EXPO_PUBLIC_POSTHOG_API_KEY to enable.');
    }
    return;
  }

  client = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    captureAppLifecycleEvents: true,
  });
};

/**
 * Track a named event with optional properties.
 * Silently no-ops when analytics is disabled or not yet initialised.
 */
export const trackEvent = (
  name: string,
  properties?: Record<string, JsonType>,
): void => {
  if (!client) return;
  client.capture(name, properties);
};
