import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';
import type { ThemeColors } from '@/constants/theme';

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  colors: ThemeColors;
};

const MetricCard = ({ icon, value, label, colors }: MetricCardProps) => (
  <View style={[styles.card, { backgroundColor: colors.CARD }]}>
    <Ionicons name={icon} size={20} color={colors.ACCENT} />
    <Text style={[styles.value, { color: colors.TEXT_PRIMARY }]}>{value}</Text>
    <Text style={[styles.label, { color: colors.TEXT_MUTED }]}>{label}</Text>
  </View>
);

type MetricsRowProps = {
  surface: string;
  slope: string | null;
  elevation: string | null;
};

export const MetricsRow = ({
  surface,
  slope,
  elevation,
}: MetricsRowProps) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <MetricCard
        icon="water-outline"
        value={surface}
        label={t('spotDetail.surface')}
        colors={colors}
      />
      <MetricCard
        icon="triangle-outline"
        value={slope ?? '\u2014'}
        label={t('spotDetail.slopeLabel')}
        colors={colors}
      />
      <MetricCard
        icon="arrow-up-outline"
        value={elevation ?? '\u2014'}
        label={t('spotDetail.elevation')}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.MD,
    gap: SPACING.XS,
  },
  value: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 15,
  },
  label: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
