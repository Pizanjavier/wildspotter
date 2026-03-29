import { View, Text, StyleSheet } from 'react-native';
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

export const ScoringSection = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
        {t('guide.scoringBody')}
      </Text>
      <Text style={[styles.formula, { color: colors.TEXT_PRIMARY, backgroundColor: colors.BACKGROUND }]}>
        {t('guide.scoringFormula')}
      </Text>
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
    gap: SPACING.SM,
  },
  body: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    lineHeight: 21,
  },
  formula: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 12,
    padding: SPACING.SM,
    borderRadius: 8,
    textAlign: 'center',
    overflow: 'hidden',
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
