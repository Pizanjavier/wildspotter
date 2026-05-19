import { useEffect } from 'react';
import type { JsonType } from '@posthog/core';
import { trackScreen } from '@/services/analytics';

export const useTrackScreen = (
  screenName: string,
  properties?: Record<string, JsonType>,
): void => {
  useEffect(() => {
    trackScreen(screenName, properties);
    // Only fire on mount — screen name is static per component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
