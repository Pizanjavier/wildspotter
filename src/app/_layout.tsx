import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { useSpotsStore } from '@/stores/spots-store';
import { useSettingsStore, hydrateSettings } from '@/stores/settings-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { setLocale } from '@/i18n';
import { initSentry } from '@/services/sentry';
import { initAnalytics, trackEvent } from '@/services/analytics';
import type { Locale } from '@/i18n/types';

export const RootLayout = () => {
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const analyticsEnabled = useSettingsStore((s) => s.analyticsEnabled);
  const hydrated = useSettingsStore((s) => s._hydrated);
  const analyticsInitedRef = useRef(false);
  const colors = useThemeColors();

  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    void useSpotsStore.getState().loadSaved();
    void hydrateSettings();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!analyticsEnabled) return;
    if (analyticsInitedRef.current) return;
    analyticsInitedRef.current = true;
    initSentry();
    initAnalytics();
    trackEvent('app_opened');
  }, [hydrated, analyticsEnabled]);

  useEffect(() => {
    setLocale(language as Locale);
  }, [language]);

  const statusBarStyle = theme === 'dark' ? 'light' : 'dark';

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.BACKGROUND }]}>
        <StatusBar style={statusBarStyle} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
          <StatusBar style={statusBarStyle} />
          <Slot />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// Expo Router requires a default export; Sentry.wrap adds error boundary + performance monitoring
// eslint-disable-next-line import/no-default-export
export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
  },
});
