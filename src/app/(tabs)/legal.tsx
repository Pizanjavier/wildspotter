import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settings-store';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { t } from '@/i18n';
import {
  CollapsibleSection,
  RadarSection,
  TerrainSection,
  SatelliteSection,
  ContextSection,
  LegalSourcesSection,
  ScoringSection,
} from '@/components/guide';

export const GuideScreen = () => {
  const colors = useThemeColors();
  const _lang = useSettingsStore((s) => s.language);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.ACCENT }]}>
          {t('guide.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
          {t('guide.subtitle')}
        </Text>

        <CollapsibleSection icon="radio-outline" title={t('guide.radarTitle')}>
          <RadarSection />
        </CollapsibleSection>

        <CollapsibleSection icon="trending-up-outline" title={t('guide.terrainTitle')}>
          <TerrainSection />
        </CollapsibleSection>

        <CollapsibleSection icon="eye-outline" title={t('guide.satelliteTitle')}>
          <SatelliteSection />
        </CollapsibleSection>

        <CollapsibleSection icon="analytics-outline" title={t('guide.contextTitle')}>
          <ContextSection />
        </CollapsibleSection>

        <CollapsibleSection icon="shield-checkmark-outline" title={t('guide.legalSourcesTitle')}>
          <LegalSourcesSection />
        </CollapsibleSection>

        <CollapsibleSection icon="speedometer-outline" title={t('guide.scoringTitle')}>
          <ScoringSection />
        </CollapsibleSection>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GuideScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.LG,
    gap: SPACING.MD,
    paddingBottom: SPACING.XL * 2,
  },
  title: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 14,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: SPACING.SM,
  },
});
