/**
 * PostHog analytics configuration.
 *
 * Set EXPO_PUBLIC_POSTHOG_API_KEY and EXPO_PUBLIC_POSTHOG_HOST
 * in your .env or build environment. The values below are
 * placeholders — analytics is silently disabled when the key
 * is missing.
 */

export const POSTHOG_API_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';

export const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
