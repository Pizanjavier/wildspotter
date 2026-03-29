import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settings-store';
import { t } from '@/i18n';

export const TabLayout = () => {
  const colors = useThemeColors();
  const _lang = useSettingsStore((s) => s.language);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.BACKGROUND },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{ title: t('tabs.map') }}
      />
      <Tabs.Screen
        name="spots"
        options={{ title: t('tabs.spots') }}
      />
      <Tabs.Screen
        name="legal"
        options={{ title: t('tabs.guide') }}
      />
      <Tabs.Screen
        name="config"
        options={{ title: t('tabs.config') }}
      />
    </Tabs>
  );
};

export default TabLayout;
