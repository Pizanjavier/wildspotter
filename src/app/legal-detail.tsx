import { Text, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { t } from '@/i18n';
import { LegalSourcesSection } from '@/components/guide/LegalSourcesSection';
import { LegalDisclaimer } from '@/components/legal/LegalDisclaimer';
import { useTrackScreen } from '@/hooks/useTrackScreen';

type FlowStep = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  number: string;
  titleKey: string;
  descKey: string;
};

const FLOW_STEPS: FlowStep[] = [
  {
    icon: 'download-outline',
    number: '89',
    titleKey: 'legalDetail.flowIngestTitle',
    descKey: 'legalDetail.flowIngestDesc',
  },
  {
    icon: 'search-outline',
    number: '24h',
    titleKey: 'legalDetail.flowDetectTitle',
    descKey: 'legalDetail.flowDetectDesc',
  },
  {
    icon: 'funnel-outline',
    number: 'AI',
    titleKey: 'legalDetail.flowClassifyTitle',
    descKey: 'legalDetail.flowClassifyDesc',
  },
  {
    icon: 'location-outline',
    number: '8132',
    titleKey: 'legalDetail.flowGeoTitle',
    descKey: 'legalDetail.flowGeoDesc',
  },
];

export const LegalDetailScreen = () => {
  const colors = useThemeColors();
  useTrackScreen('LegalDetail');
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
      edges={['top']}
    >
      <View style={styles.navBar}>
        <Pressable onPress={() => router.navigate('/(tabs)/legal')} style={styles.backButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.ACCENT} />
          <Text style={[styles.backText, { color: colors.ACCENT }]}>
            {t('guide.title')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.ACCENT }]}>
            {t('legalDetail.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
            {t('legalDetail.subtitle')}
          </Text>
        </View>

        <View style={[styles.statsRow, { borderColor: colors.BORDER }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.ACCENT }]}>89</Text>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
              {t('legalDetail.statSources')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.BORDER }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.ACCENT }]}>17</Text>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
              {t('legalDetail.statCcaa')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.BORDER }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.ACCENT }]}>125+</Text>
            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
              {t('legalDetail.statDocs')}
            </Text>
          </View>
        </View>

        <View style={styles.flowSection}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            {t('legalDetail.flowTitle')}
          </Text>
          {FLOW_STEPS.map((step, idx) => (
            <View key={step.titleKey} style={styles.flowRow}>
              <View style={[styles.flowBadge, { backgroundColor: `${colors.ACCENT}22` }]}>
                <Text style={[styles.flowNumber, { color: colors.ACCENT }]}>
                  {step.number}
                </Text>
              </View>
              <View style={styles.flowText}>
                <View style={styles.flowTitleRow}>
                  <Ionicons name={step.icon} size={16} color={colors.ACCENT} />
                  <Text style={[styles.flowTitle, { color: colors.TEXT_PRIMARY }]}>
                    {t(step.titleKey)}
                  </Text>
                </View>
                <Text style={[styles.flowDesc, { color: colors.TEXT_SECONDARY }]}>
                  {t(step.descKey)}
                </Text>
              </View>
              {idx < FLOW_STEPS.length - 1 && (
                <View style={[styles.flowConnector, { backgroundColor: colors.BORDER }]} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.sourcesSection}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT_PRIMARY }]}>
            {t('legalDetail.sourcesTitle')}
          </Text>
          <LegalSourcesSection />
        </View>

        <LegalDisclaimer />
      </ScrollView>
    </SafeAreaView>
  );
};

export default LegalDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  backText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL * 2,
    gap: SPACING.LG,
  },
  header: {
    gap: SPACING.XS,
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
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.MD,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  flowSection: {
    gap: SPACING.MD,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
    position: 'relative',
  },
  flowBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowNumber: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 11,
  },
  flowText: {
    flex: 1,
    gap: 2,
  },
  flowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    paddingTop: 2,
  },
  flowTitle: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 14,
  },
  flowDesc: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 18,
    paddingLeft: SPACING.XS + 16,
  },
  flowConnector: {
    position: 'absolute',
    left: 19,
    top: 42,
    width: 2,
    height: 20,
  },
  sourcesSection: {
    gap: SPACING.SM,
  },
});
