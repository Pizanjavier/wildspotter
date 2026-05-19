import PostHog from 'posthog-react-native';
import type { JsonType } from '@posthog/core';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '@/constants/analytics';

let client: PostHog | null = null;

const isEnabled = (): boolean => POSTHOG_API_KEY.length > 0;

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
    enableSessionReplay: true,
    sessionReplayConfig: {
      maskAllTextInputs: false,
      maskAllImages: false,
    },
    autocapture: {
      captureTouches: true,
      captureScreens: false,
    },
    errorTracking: {
      captureExceptions: true,
    },
  } as ConstructorParameters<typeof PostHog>[1]);
};

export const getPostHogClient = (): PostHog | null => client;

export const trackEvent = (
  name: string,
  properties?: Record<string, JsonType>,
): void => {
  if (!client) return;
  client.capture(name, properties);
};

export const trackScreen = (
  screenName: string,
  properties?: Record<string, JsonType>,
): void => {
  if (!client) return;
  client.screen(screenName, properties);
};

export const setSuperProperties = (
  properties: Record<string, JsonType>,
): void => {
  if (!client) return;
  client.register(properties);
};

export const identifyUser = (
  distinctId: string,
  properties?: Record<string, JsonType>,
): void => {
  if (!client) return;
  client.identify(distinctId, properties);
};

export const resetAnalytics = (): void => {
  if (!client) return;
  client.reset();
};

export const setUserProperties = (
  properties: Record<string, JsonType>,
): void => {
  if (!client) return;
  client.capture('$set', { $set: properties });
};

export const registerDeviceContext = (locale: string, theme: string): void => {
  setSuperProperties({
    app_version: Constants.expoConfig?.version ?? '0.0.0',
    platform: Platform.OS,
    locale,
    theme,
  });
};
