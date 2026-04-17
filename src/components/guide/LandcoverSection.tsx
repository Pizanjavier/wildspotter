import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type Row = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  textKey: string;
};

const BONUSES: Row[] = [
  { icon: 'water-outline', textKey: 'guide.landcoverBonusCoastal' },
  { icon: 'boat-outline', textKey: 'guide.landcoverBonusWater' },
  { icon: 'triangle-outline', textKey: 'guide.landcoverBonusAlpine' },
  { icon: 'eye-outline', textKey: 'guide.landcoverBonusViewpoint' },
  { icon: 'leaf-outline', textKey: 'guide.landcoverBonusForestDeadEnd' },
];

const PENALTIES: Row[] = [
  { icon: 'nutrition-outline', textKey: 'guide.landcoverPenaltyFarmland' },
  { icon: 'business-outline', textKey: 'guide.landcoverPenaltyUrban' },
  { icon: 'construct-outline', textKey: 'guide.landcoverPenaltyIndustrial' },
];

export const LandcoverSection = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
        {t('guide.landcoverBody')}
      </Text>

      <View style={[styles.block, { backgroundColor: colors.CARD_ELEVATED ?? colors.BACKGROUND }]}>
        <Text style={[styles.blockIntro, { color: colors.SCORE_HIGH }]}>
          {t('guide.landcoverBonusIntro')}
        </Text>
        {BONUSES.map(({ icon, textKey }) => (
          <View key={textKey} style={styles.row}>
            <Ionicons name={icon} size={14} color={colors.SCORE_HIGH} />
            <Text style={[styles.rowText, { color: colors.TEXT_SECONDARY }]}>
              {t(textKey)}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.block, { backgroundColor: colors.CARD_ELEVATED ?? colors.BACKGROUND }]}>
        <Text style={[styles.blockIntro, { color: colors.SCORE_LOW }]}>
          {t('guide.landcoverPenaltyIntro')}
        </Text>
        {PENALTIES.map(({ icon, textKey }) => (
          <View key={textKey} style={styles.row}>
            <Ionicons name={icon} size={14} color={colors.SCORE_LOW} />
            <Text style={[styles.rowText, { color: colors.TEXT_SECONDARY }]}>
              {t(textKey)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.attribution, { color: colors.TEXT_MUTED }]}>
        {t('guide.landcoverAttribution')}
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
  block: {
    borderRadius: RADIUS.SM,
    padding: SPACING.SM,
    gap: 6,
  },
  blockIntro: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 13,
    marginBottom: SPACING.XS,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
  },
  rowText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 17,
  },
  attribution: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: SPACING.SM,
  },
});
