import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { isOnboardingComplete } from '@/app/onboarding';
import { useThemeColors } from '@/hooks/useThemeColors';

export const IndexRedirect = () => {
  const colors = useThemeColors();
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const check = async () => {
      const done = await isOnboardingComplete();
      setShowOnboarding(!done);
      setReady(true);
    };
    void check();
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }} />;
  }

  if (showOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/map" />;
};

export default IndexRedirect;
