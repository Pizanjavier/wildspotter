import { useState, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useMapStore } from '@/stores/map-store';
import { t } from '@/i18n';

export type LocationStatus = 'idle' | 'requesting' | 'locating' | 'granted' | 'denied';

const FLY_TO_ZOOM = 14;

export const useUserLocation = () => {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const flyTo = useMapStore((s) => s.flyTo);
  const setUserLocation = useMapStore((s) => s.setUserLocation);

  const locate = useCallback(async () => {
    if (status === 'requesting' || status === 'locating') return;

    setStatus('requesting');

    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();

      if (permStatus !== 'granted') {
        setStatus('denied');
        return;
      }

      setStatus('locating');

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { longitude, latitude } = position.coords;
      const lngLat: [number, number] = [longitude, latitude];

      setUserLocation(lngLat);
      flyTo({ center: lngLat, zoom: FLY_TO_ZOOM });
      setStatus('granted');
    } catch (err) {
      console.warn('[useUserLocation] Failed to get location:', err);
      setStatus('idle');
    }
  }, [status, flyTo, setUserLocation]);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('location.permissionDenied'),
        t('location.permissionDeniedHint'),
      );
    } else {
      Linking.openSettings();
    }
  }, []);

  return { status, locate, openSettings };
};
