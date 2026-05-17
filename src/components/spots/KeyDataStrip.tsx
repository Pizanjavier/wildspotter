import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type DataPill = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
};

type KeyDataStripProps = {
  surface: string;
  slope: string | null;
  elevation: string | null;
};

export const KeyDataStrip = ({ surface, slope, elevation }: KeyDataStripProps) => {
  const colors = useThemeColors();

  const pills: DataPill[] = [];

  if (surface && surface.toLowerCase() !== 'unknown') {
    pills.push({ icon: 'water-outline', value: surface, label: t('spotDetail.surface') });
  }
  if (slope !== null) {
    pills.push({ icon: 'triangle-outline', value: slope, label: t('spotDetail.slopeLabel') });
  }
  if (elevation !== null) {
    pills.push({ icon: 'arrow-up-outline', value: elevation, label: t('spotDetail.elevation') });
  }

  if (pills.length === 0) return null;

  return (
    <View style={styles.container}>
      {pills.map((pill, idx) => (
        <View
          key={idx}
          style={[styles.pill, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}
        >
          <Ionicons name={pill.icon} size={14} color={colors.ACCENT} />
          <Text style={[styles.value, { color: colors.TEXT_PRIMARY }]}>{pill.value}</Text>
          <Text style={[styles.label, { color: colors.TEXT_MUTED }]}>{pill.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS + 2,
    paddingHorizontal: SPACING.SM + 4,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
  },
  value: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 13,
  },
  label: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
