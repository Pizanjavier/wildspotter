import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type ScaleRow = {
  textKey: string;
  colorKey: 'SCORE_HIGH' | 'SCORE_MEDIUM' | 'SCORE_LOW';
};

const SCALE: ScaleRow[] = [
  { textKey: 'guide.scoringGreen', colorKey: 'SCORE_HIGH' },
  { textKey: 'guide.scoringTeal', colorKey: 'SCORE_MEDIUM' },
  { textKey: 'guide.scoringAmber', colorKey: 'SCORE_LOW' },
];

const BULLETS: Array<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  textKey: string;
  colorKey: 'SCORE_HIGH' | 'SCORE_LOW' | 'ACCENT';
}> = [
  { icon: 'add-circle-outline', textKey: 'guide.scoringWildBonus', colorKey: 'SCORE_HIGH' },
  { icon: 'remove-circle-outline', textKey: 'guide.scoringPenalty', colorKey: 'SCORE_LOW' },
  { icon: 'shield-checkmark-outline', textKey: 'guide.scoringAiGate', colorKey: 'ACCENT' },
];

export const ScoringSection = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
        {t('guide.scoringBody')}
      </Text>
      <Text
        style={[
          styles.formula,
          { color: colors.TEXT_PRIMARY, backgroundColor: colors.BACKGROUND },
        ]}
      >
        {t('guide.scoringFormula')}
      </Text>

      <View style={styles.bullets}>
        {BULLETS.map(({ icon, textKey, colorKey }) => (
          <View key={textKey} style={styles.bulletRow}>
            <Ionicons name={icon} size={16} color={colors[colorKey]} />
            <Text style={[styles.bulletText, { color: colors.TEXT_SECONDARY }]}>
              {t(textKey)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.scale}>
        {SCALE.map((row) => (
          <View key={row.textKey} style={styles.scaleRow}>
            <View style={[styles.dot, { backgroundColor: colors[row.colorKey] }]} />
            <Text style={[styles.scaleText, { color: colors.TEXT_SECONDARY }]}>
              {t(row.textKey)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.MD,
  },
  body: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    lineHeight: 21,
  },
  formula: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    padding: SPACING.SM,
    borderRadius: 8,
    textAlign: 'center',
    overflow: 'hidden',
  },
  bullets: {
    gap: SPACING.SM,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
  },
  bulletText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    lineHeight: 19,
  },
  scale: {
    gap: SPACING.XS,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scaleText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    lineHeight: 18,
  },
});
