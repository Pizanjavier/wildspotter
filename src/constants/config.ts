import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve the API base URL:
 * 1. Explicit env var always wins (set EXPO_PUBLIC_API_URL for production or custom setups)
 * 2. In dev on Android emulator → 10.0.2.2 (Android's alias for host loopback)
 * 3. In dev on physical device via Expo Go → use the debugger host IP (your Mac's LAN IP)
 * 4. Fallback → localhost (web / iOS simulator)
 */
const resolveApiUrl = (): string => {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  if (!__DEV__) return 'http://localhost:8000';

  // Android emulator maps 10.0.2.2 to the host machine's localhost
  if (Platform.OS === 'android') {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    // If running on a physical device via Expo Go, debuggerHost is the Mac's LAN IP
    // If running on emulator, use the special alias
    return debuggerHost
      ? `http://${debuggerHost}:8000`
      : 'http://10.0.2.2:8000';
  }

  // iOS physical device via Expo Go — use the Mac's LAN IP from the dev server
  if (Platform.OS === 'ios') {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    return debuggerHost
      ? `http://${debuggerHost}:8000`
      : 'http://localhost:8000';
  }

  // Web / iOS simulator
  return 'http://localhost:8000';
};

export const API_BASE_URL = resolveApiUrl();

export const SLOPE_THRESHOLD = 8;

export const TERRAIN_TILE_URL =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

export const MIN_ZOOM_FOR_SCAN = 9;

export const MAX_SPOTS_WARNING = 500;
