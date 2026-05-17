import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type TipItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  titleKey: string;
  detailKey: string;
};

const TIPS: TipItem[] = [
  { icon: 'close-circle-outline', titleKey: 'overnightTips.noExternalTitle', detailKey: 'overnightTips.noExternalDetail' },
  { icon: 'document-text-outline', titleKey: 'overnightTips.checkLocalTitle', detailKey: 'overnightTips.checkLocalDetail' },
  { icon: 'leaf-outline', titleKey: 'overnightTips.protectedTitle', detailKey: 'overnightTips.protectedDetail' },
  { icon: 'time-outline', titleKey: 'overnightTips.stayLimitTitle', detailKey: 'overnightTips.stayLimitDetail' },
  { icon: 'trash-outline', titleKey: 'overnightTips.noTraceTitle', detailKey: 'overnightTips.noTraceDetail' },
  { icon: 'people-outline', titleKey: 'overnightTips.respectTitle', detailKey: 'overnightTips.respectDetail' },
];

export const OvernightTips = () => {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}>
      <View style={styles.titleRow}>
        <Ionicons name="bulb-outline" size={18} color={colors.ACCENT} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          {t('overnightTips.title')}
        </Text>
      </View>

      <View style={styles.tipsList}>
        {TIPS.map((tip) => (
          <View key={tip.titleKey} style={styles.tipRow}>
            <Ionicons name={tip.icon} size={18} color={colors.ACCENT} style={styles.tipIcon} />
            <View style={styles.tipText}>
              <Text style={[styles.tipTitle, { color: colors.TEXT_PRIMARY }]}>
                {t(tip.titleKey)}
              </Text>
              <Text style={[styles.tipDetail, { color: colors.TEXT_SECONDARY }]}>
                {t(tip.detailKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  title: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
  },
  tipsList: {
    gap: SPACING.MD,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginTop: 1,
    marginRight: SPACING.SM,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
  },
  tipDetail: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
