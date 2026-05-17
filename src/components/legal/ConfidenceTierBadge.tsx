import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';
import type { ConfidenceTier } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';

type ConfidenceTierBadgeProps = {
  tier: ConfidenceTier;
  compact?: boolean;
};

type TierConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: (c: ThemeColors) => string;
  bg: (c: ThemeColors) => string;
};

const getTierConfig = (tier: ConfidenceTier): TierConfig => {
  switch (tier) {
    case 'verified':
      return {
        label: t('legal.tierVerified'),
        icon: 'shield-checkmark',
        color: (c) => c.SCORE_HIGH,
        bg: (c) => c.SCORE_HIGH + '1A',
      };
    case 'automated':
      return {
        label: t('legal.tierAutomated'),
        icon: 'hardware-chip-outline',
        color: (c) => c.SCORE_MEDIUM,
        bg: (c) => c.SCORE_MEDIUM + '1A',
      };
    case 'unverified':
      return {
        label: t('legal.tierUnverified'),
        icon: 'help-circle-outline',
        color: (c) => c.SCORE_LOW,
        bg: (c) => c.SCORE_LOW + '1A',
      };
  }
};

export const ConfidenceTierBadge = ({
  tier,
  compact = false,
}: ConfidenceTierBadgeProps) => {
  const colors = useThemeColors();
  const config = getTierConfig(tier);
  const color = config.color(colors);
  const bg = config.bg(colors);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={config.icon} size={compact ? 12 : 14} color={color} />
      {!compact && (
        <Text style={[styles.label, { color }]}>{config.label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
