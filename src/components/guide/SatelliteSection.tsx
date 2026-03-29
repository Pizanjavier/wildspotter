import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type FactorRow = {
  textKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const FACTORS: FactorRow[] = [
  { textKey: 'guide.satelliteSurface', icon: 'earth-outline' },
  { textKey: 'guide.satelliteAccess', icon: 'trail-sign-outline' },
  { textKey: 'guide.satelliteSpace', icon: 'resize-outline' },
  { textKey: 'guide.satelliteVans', icon: 'car-outline' },
  { textKey: 'guide.satelliteClear', icon: 'eye-outline' },
];

export const SatelliteSection = () => {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
        {t('guide.satelliteBody')}
      </Text>
      <View style={styles.factorList}>
        {FACTORS.map((factor) => (
          <View key={factor.textKey} style={styles.factorRow}>
            <Ionicons name={factor.icon} size={14} color={colors.ACCENT} />
            <Text style={[styles.factorText, { color: colors.TEXT_SECONDARY }]}>
              {t(factor.textKey)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
        {t('guide.satelliteFactors')}
      </Text>
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
  factorList: {
    gap: SPACING.XS + 2,
    paddingLeft: SPACING.XS,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
  },
  factorText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
