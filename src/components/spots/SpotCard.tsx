import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getScoreColor } from '@/components/spots/ScoreBadge';
import type { SpotSummary } from '@/services/api/types';
import { t } from '@/i18n';

type SpotCardProps = {
  spot: SpotSummary;
};

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

const formatSubtitle = (spot: SpotSummary): string => {
  const parts: string[] = [];
  if (spot.spot_type) parts.push(capitalize(spot.spot_type.replace(/_/g, ' ')));
  if (spot.surface_type && spot.surface_type !== 'unknown') {
    parts.push(capitalize(spot.surface_type));
  }
  if (spot.slope_pct !== null) parts.push(`${spot.slope_pct.toFixed(1)}% slope`);
  return parts.join(' \u00B7 ');
};

export const SpotCard = ({ spot }: SpotCardProps) => {
  const colors = useThemeColors();
  const score = spot.composite_score ?? null;
  const router = useRouter();

  const handlePress = () => {
    router.push(`/spot/${spot.id}`);
  };

  const scoreColor = getScoreColor(score, colors);
  const subtitle = formatSubtitle(spot);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.CARD },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
        <Text style={styles.scoreValue}>
          {score !== null ? String(Math.round(score)) : '--'}
        </Text>
      </View>
      <View style={styles.textArea}>
        <Text style={[styles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
          {spot.name || t('spots.unnamedSpot')}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM + 4,
    marginBottom: 10,
    gap: SPACING.MD,
  },
  pressed: {
    opacity: 0.7,
  },
  scoreBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 13,
    color: '#FFFFFF',
  },
  textArea: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
  },
});
