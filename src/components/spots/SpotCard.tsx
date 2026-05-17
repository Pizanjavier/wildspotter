import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSpotsStore } from '@/stores/spots-store';
import { getScoreColor } from '@/components/spots/ScoreBadge';
import { getOvernightLevel } from '@/utils/legal-verdict';
import { getSpotDisplayName, getTranslatedSurface } from '@/utils/spot-display-name';
import type { SpotSummary } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';
import { useSpotNavigation } from '@/hooks/useSpotNavigation';
import { t } from '@/i18n';

type SpotCardProps = {
  spot: SpotSummary;
};

type LegalIndicator = { color: string; icon: string } | null;

const getLegalIndicator = (spot: SpotSummary, colors: ThemeColors): LegalIndicator => {
  const level = getOvernightLevel(spot.legal_status);
  if (level === 'prohibited') return { color: colors.DANGER, icon: 'X' };
  if (level === 'restricted') return { color: colors.SCORE_LOW, icon: '!' };
  return null;
};

const formatSubtitle = (spot: SpotSummary): string => {
  const parts: string[] = [];
  if (spot.province) parts.push(spot.province);
  const surfaceLabel = getTranslatedSurface(spot.surface_type);
  if (surfaceLabel) parts.push(surfaceLabel);
  if (spot.slope_pct !== null) parts.push(t('spots.slope', { value: spot.slope_pct.toFixed(1) }));
  return parts.join(' \u00B7 ');
};

export const SpotCard = ({ spot }: SpotCardProps) => {
  const colors = useThemeColors();
  const score = spot.composite_score ?? null;
  const { navigateToSpot } = useSpotNavigation();
  const isSaved = useSpotsStore((s) => s.isSaved(spot.id));

  const handlePress = () => {
    navigateToSpot(spot.id);
  };

  const scoreColor = getScoreColor(score, colors);
  const subtitle = formatSubtitle(spot);
  const legal = getLegalIndicator(spot, colors);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.CARD },
        legal !== null && {
          borderWidth: 1.5,
          borderColor: legal.color,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.scoreBadge,
          { backgroundColor: scoreColor },
          legal !== null && {
            borderWidth: 2,
            borderColor: legal.color,
          },
        ]}
      >
        <Text style={styles.scoreValue}>
          {score !== null ? String(Math.round(score)) : '--'}
        </Text>
      </View>
      <View style={styles.textArea}>
        <View style={styles.nameRow}>
          {isSaved && (
            <Ionicons name="bookmark" size={14} color={colors.ACCENT} />
          )}
          <Text style={[styles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
            {getSpotDisplayName(spot)}
          </Text>
          {legal && (
            <Text style={[styles.legalIcon, { color: legal.color }]}>
              {legal.icon}
            </Text>
          )}
        </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
    flexShrink: 1,
  },
  legalIcon: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 13,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
  },
});
