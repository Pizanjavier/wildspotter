import { Text, ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { t } from '@/i18n';
import {
  CollapsibleSection,
  RadarSection,
  TerrainSection,
  SatelliteSection,
  ContextSection,
  LandcoverSection,
  ScoringSection,
} from '@/components/guide';
import { OvernightTips } from '@/components/guide/OvernightTips';

export const GuideScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();

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

        <OvernightTips />

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

        <CollapsibleSection icon="leaf-outline" title={t('guide.landcoverTitle')}>
          <LandcoverSection />
        </CollapsibleSection>

        <CollapsibleSection icon="speedometer-outline" title={t('guide.scoringTitle')}>
          <ScoringSection />
        </CollapsibleSection>

        <Pressable
          onPress={() => router.push('/legal-detail')}
          style={[styles.legalCard, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.ACCENT} />
          <View style={styles.legalCardText}>
            <Text style={[styles.legalCardTitle, { color: colors.TEXT_PRIMARY }]}>
              {t('guide.legalCardTitle')}
            </Text>
            <Text style={[styles.legalCardSubtitle, { color: colors.TEXT_SECONDARY }]}>
              {t('guide.legalCardSubtitle')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${colors.ACCENT}22` }]}>
            <Text style={[styles.badgeText, { color: colors.ACCENT }]}>
              {t('guide.legalCardBadge')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
        </Pressable>

        <Text style={[styles.attribution, { color: colors.TEXT_MUTED }]}>
          {'© Ministerio para la Transición Ecológica y el Reto Demográfico'}
        </Text>
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
  legalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 1,
    gap: SPACING.SM,
    marginTop: SPACING.SM,
  },
  legalCardText: {
    flex: 1,
  },
  legalCardTitle: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 15,
  },
  legalCardSubtitle: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    borderRadius: RADIUS.PILL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 10,
  },
  attribution: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
