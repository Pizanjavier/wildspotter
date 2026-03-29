import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getScoreColor } from '@/components/spots/ScoreBadge';
import type { AiDetails } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';

type AiAnalysisProps = {
  aiScore: number | null;
  aiDetails: AiDetails | null;
};

type FactorConfig = {
  key: keyof AiDetails;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  weight: number;
};

const FACTORS: FactorConfig[] = [
  { key: 'surface_quality', labelKey: 'spotDetail.aiSurface', icon: 'earth-outline', weight: 0.30 },
  { key: 'vehicle_access', labelKey: 'spotDetail.aiAccess', icon: 'trail-sign-outline', weight: 0.20 },
  { key: 'open_space', labelKey: 'spotDetail.aiSpace', icon: 'resize-outline', weight: 0.20 },
  { key: 'van_presence', labelKey: 'spotDetail.aiVans', icon: 'car-outline', weight: 0.15 },
  { key: 'obstruction_absence', labelKey: 'spotDetail.aiClear', icon: 'eye-outline', weight: 0.15 },
];

const getBarColor = (value: number, colors: ThemeColors): string => {
  if (value >= 7) return colors.SCORE_HIGH;
  if (value >= 4) return colors.ACCENT;
  return colors.SCORE_LOW;
};

export const AiAnalysis = ({ aiScore, aiDetails }: AiAnalysisProps) => {
  const colors = useThemeColors();

  if (!aiDetails) return null;

  const overallColor = getScoreColor(aiScore, colors);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="eye-outline" size={18} color={colors.ACCENT} />
          <Text style={[styles.header, { color: colors.TEXT_PRIMARY }]}>
            {t('spotDetail.aiAnalysis')}
          </Text>
        </View>
        <View style={[styles.scorePill, { backgroundColor: overallColor }]}>
          <Text style={styles.scoreText}>
            {aiScore !== null ? Math.round(aiScore) : '--'}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.TEXT_MUTED }]}>
        {t('spotDetail.aiDescription')}
      </Text>

      <View style={styles.factorList}>
        {FACTORS.map((factor) => {
          const value = aiDetails[factor.key];
          const barColor = getBarColor(value, colors);
          const barWidth = `${Math.min(value * 10, 100)}%`;
          return (
            <View key={factor.key} style={styles.factorRow}>
              <Ionicons name={factor.icon} size={15} color={colors.TEXT_MUTED} />
              <View style={styles.factorContent}>
                <View style={styles.factorLabelRow}>
                  <Text style={[styles.factorLabel, { color: colors.TEXT_PRIMARY }]}>
                    {t(factor.labelKey)}
                  </Text>
                  <Text style={[styles.factorWeight, { color: colors.TEXT_MUTED }]}>
                    {`${Math.round(factor.weight * 100)}%`}
                  </Text>
                </View>
                <View style={[styles.barBg, { backgroundColor: colors.CARD }]}>
                  <View
                    style={[styles.barFill, { width: barWidth as `${number}%`, backgroundColor: barColor }]}
                  />
                </View>
              </View>
              <Text style={[styles.factorValue, { color: barColor }]}>
                {value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  header: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
  },
  description: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 17,
  },
  scorePill: {
    borderRadius: RADIUS.PILL,
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM + 4,
  },
  scoreText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 13,
    color: '#FFFFFF',
  },
  factorList: {
    gap: SPACING.SM,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  factorContent: {
    flex: 1,
    gap: 3,
  },
  factorLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorLabel: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
  },
  factorWeight: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorValue: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 16,
    minWidth: 24,
    textAlign: 'right',
  },
});
