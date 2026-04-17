import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getScoreColor } from '@/components/spots/ScoreBadge';
import type { ContextDetails, ContextSubScore } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';

type ContextAnalysisProps = {
  contextScore: number | null;
  contextDetails: ContextDetails | null;
};

type SubScoreKey =
  | 'road_noise'
  | 'urban_density'
  | 'scenic_value'
  | 'privacy'
  | 'industrial'
  | 'railway'
  | 'van_community'
  | 'drinking_water'
  | 'dog_friendly';

type FactorConfig = {
  key: SubScoreKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  getDetail: (sub: ContextSubScore) => string;
};

const FACTORS: FactorConfig[] = [
  {
    key: 'road_noise',
    label: 'Road noise',
    icon: 'car-outline',
    getDetail: (s) => {
      const road = s.nearest_road ?? 'unknown';
      const dist = s.distance_m != null ? `${s.distance_m}m` : '--';
      return `${road} · ${dist}`;
    },
  },
  {
    key: 'urban_density',
    label: 'Urban density',
    icon: 'business-outline',
    getDetail: (s) => `${s.building_count ?? 0} buildings`,
  },
  {
    key: 'scenic_value',
    label: 'Scenic value',
    icon: 'leaf-outline',
    getDetail: (s) => {
      const features = s.features ?? [];
      return features.length > 0
        ? features.map((f) => f.replace(/_/g, ' ')).join(', ')
        : 'none nearby';
    },
  },
  {
    key: 'privacy',
    label: 'Privacy',
    icon: 'eye-off-outline',
    getDetail: (s) => {
      const parts: string[] = [];
      if (s.is_dead_end) parts.push('Dead end');
      if (s.place_distance_m != null) parts.push(`${(s.place_distance_m / 1000).toFixed(1)} km`);
      return parts.length > 0 ? parts.join(' · ') : '--';
    },
  },
  {
    key: 'industrial',
    label: 'Industrial',
    icon: 'construct-outline',
    getDetail: (s) => s.nearby ? 'Near nearby' : 'None nearby',
  },
  {
    key: 'railway',
    label: 'Railway',
    icon: 'train-outline',
    getDetail: (s) => s.distance_m != null ? `${s.distance_m}m` : 'No railway',
  },
  {
    key: 'van_community',
    label: 'Van community',
    icon: 'people-outline',
    getDetail: (s) => {
      const count = s.caravan_sites_5km ?? 0;
      return count > 0 ? `${count} site within 5km` : 'No sites nearby';
    },
  },
  {
    key: 'drinking_water',
    label: 'Drinking water',
    icon: 'water-outline',
    getDetail: (s) => s.distance_m != null ? `${s.distance_m}m` : 'None nearby',
  },
  {
    key: 'dog_friendly',
    label: 'Dog friendly',
    icon: 'paw-outline',
    getDetail: (s) => s.distance_m != null ? `${s.distance_m}m` : 'None nearby',
  },
];

const formatScoreDelta = (score: number): string =>
  score >= 0 ? `+${score}` : String(score);

const getScoreDeltaColor = (score: number, colors: ThemeColors): string => {
  if (score > 0) return colors.SCORE_HIGH;
  if (score < 0) return colors.DANGER;
  return colors.TEXT_MUTED;
};

export const ContextAnalysis = ({
  contextScore,
  contextDetails,
}: ContextAnalysisProps) => {
  const colors = useThemeColors();

  if (!contextDetails) return null;

  const overallColor = getScoreColor(contextScore, colors);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.TEXT_PRIMARY }]}>
          {t('spotDetail.contextAnalysis')}
        </Text>
        <View style={[styles.scorePill, { backgroundColor: overallColor }]}>
          <Text style={styles.scoreText}>
            {contextScore !== null ? Math.round(contextScore) : '--'}
          </Text>
        </View>
      </View>
      <View style={styles.factorList}>
        {FACTORS.map((factor) => {
          const sub = contextDetails[factor.key] as ContextSubScore | undefined;
          if (!sub) return null;
          const deltaColor = getScoreDeltaColor(sub.score, colors);
          return (
            <View key={factor.key} style={styles.factorRow}>
              <Ionicons name={factor.icon} size={16} color={colors.TEXT_MUTED} />
              <View style={styles.factorContent}>
                <Text style={[styles.factorLabel, { color: colors.TEXT_PRIMARY }]}>
                  {factor.label}
                </Text>
                <Text style={[styles.factorDetail, { color: colors.TEXT_MUTED }]}>
                  {factor.getDetail(sub)}
                </Text>
              </View>
              <Text style={[styles.factorDelta, { color: deltaColor }]}>
                {formatScoreDelta(sub.score)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
  },
  scorePill: {
    borderRadius: RADIUS.PILL,
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM + 4,
  },
  scoreText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 13,
    color: '#FFFFFF',
  },
  factorList: {
    gap: SPACING.XS,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingVertical: SPACING.XS + 2,
  },
  factorContent: {
    flex: 1,
  },
  factorLabel: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 14,
  },
  factorDetail: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    marginTop: 1,
  },
  factorDelta: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 14,
    minWidth: 36,
    textAlign: 'right',
  },
});
