import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ContextDetails } from '@/services/api/types';
import { t } from '@/i18n';

type Highlight = {
  icon: string;
  text: string;
};

type MetricInputs = {
  surface: string | null;
  slopePct: number | null;
  elevation: number | null;
};

const buildMetricPills = (metrics: MetricInputs): Highlight[] => {
  const items: Highlight[] = [];
  if (metrics.surface && metrics.surface.toLowerCase() !== 'unknown') {
    items.push({ icon: '\u{1F4A7}', text: metrics.surface });
  }
  if (metrics.slopePct !== null) {
    items.push({ icon: '\u{25B3}', text: t('highlights.slope', { value: metrics.slopePct.toFixed(1) }) });
  }
  if (metrics.elevation !== null) {
    items.push({ icon: '\u{2191}', text: t('highlights.altitude', { value: String(Math.round(metrics.elevation)) }) });
  }
  return items;
};

const extractHighlights = (ctx: ContextDetails): Highlight[] => {
  const items: Highlight[] = [];
  const hasDrinkingWater = ctx.drinking_water && ctx.drinking_water.score > 0;

  const scenic = ctx.scenic_value;
  if (scenic.score > 0 && scenic.features) {
    for (const feat of scenic.features) {
      if (feat.includes('beach')) items.push({ icon: '\u{1F3D6}', text: t('highlights.beachNearby') });
      else if (feat.includes('viewpoint')) items.push({ icon: '\u{1F3D4}', text: t('highlights.viewpoint') });
      else if (!hasDrinkingWater && (feat.includes('water') || feat.includes('river') || feat.includes('stream')))
        items.push({ icon: '\u{1F4A7}', text: t('highlights.waterNearby') });
    }
  }

  if (ctx.road_noise.score >= 0) {
    items.push({ icon: '\u{1F507}', text: t('highlights.lowNoise') });
  }

  if (ctx.drinking_water && ctx.drinking_water.score > 0 && ctx.drinking_water.distance_m != null) {
    const dist = ctx.drinking_water.distance_m < 1000
      ? `${Math.round(ctx.drinking_water.distance_m)}m`
      : `${(ctx.drinking_water.distance_m / 1000).toFixed(1)}km`;
    items.push({ icon: '\u{1F6B0}', text: `${t('highlights.water')} ${dist}` });
  }

  if (ctx.dog_friendly && ctx.dog_friendly.score > 0 && ctx.dog_friendly.distance_m != null) {
    const dist = ctx.dog_friendly.distance_m < 1000
      ? `${Math.round(ctx.dog_friendly.distance_m)}m`
      : `${(ctx.dog_friendly.distance_m / 1000).toFixed(1)}km`;
    items.push({ icon: '\u{1F436}', text: `${t('highlights.dogFriendly')} ${dist}` });
  }

  if (ctx.privacy.score > 0 && ctx.privacy.is_dead_end) {
    items.push({ icon: '\u{1F6E1}', text: t('highlights.deadEnd') });
  }

  if (ctx.van_community.score > 0) {
    items.push({ icon: '\u{1F690}', text: t('highlights.vanCommunity') });
  }

  if (ctx.urban_density.score >= 10) {
    items.push({ icon: '\u{1F333}', text: t('highlights.isolated') });
  }

  return items.slice(0, 4);
};

type SpotHighlightsProps = {
  contextDetails: ContextDetails | null;
  surface?: string | null;
  slopePct?: number | null;
  elevation?: number | null;
};

export const SpotHighlights = ({ contextDetails, surface, slopePct, elevation }: SpotHighlightsProps) => {
  const colors = useThemeColors();

  const metricPills = buildMetricPills({
    surface: surface ?? null,
    slopePct: slopePct ?? null,
    elevation: elevation ?? null,
  });
  const contextPills = contextDetails ? extractHighlights(contextDetails) : [];
  const highlights = [...metricPills, ...contextPills];
  if (highlights.length === 0) return null;

  return (
    <View style={styles.container}>
      {highlights.map((h, idx) => (
        <View
          key={idx}
          style={[styles.pill, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}
        >
          <Text style={styles.icon}>{h.icon}</Text>
          <Text style={[styles.text, { color: colors.TEXT_PRIMARY }]}>{h.text}</Text>
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
    paddingVertical: SPACING.XS + 2,
    borderRadius: RADIUS.PILL,
    borderWidth: 1,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 12,
  },
});
