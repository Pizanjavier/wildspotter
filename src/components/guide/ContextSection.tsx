import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type FactorConfig = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  textKey: string;
};

const FACTORS: FactorConfig[] = [
  { icon: 'car-outline', textKey: 'guide.contextRoadNoise' },
  { icon: 'business-outline', textKey: 'guide.contextUrbanDensity' },
  { icon: 'leaf-outline', textKey: 'guide.contextScenicValue' },
  { icon: 'eye-off-outline', textKey: 'guide.contextPrivacy' },
  { icon: 'construct-outline', textKey: 'guide.contextIndustrial' },
  { icon: 'train-outline', textKey: 'guide.contextRailway' },
  { icon: 'people-outline', textKey: 'guide.contextVanCommunity' },
  { icon: 'water-outline', textKey: 'guide.contextDrinkingWater' },
  { icon: 'paw-outline', textKey: 'guide.contextDogFriendly' },
];

export const ContextSection = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.intro, { color: colors.TEXT_SECONDARY }]}>
        {t('guide.contextBody')}
      </Text>
      {FACTORS.map((factor) => (
        <View key={factor.textKey} style={styles.factorRow}>
          <Ionicons name={factor.icon} size={16} color={colors.ACCENT} />
          <Text style={[styles.factorText, { color: colors.TEXT_SECONDARY }]}>
            {t(factor.textKey)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  intro: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    lineHeight: 21,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
    paddingLeft: SPACING.XS,
  },
  factorText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    lineHeight: 19,
  },
});
