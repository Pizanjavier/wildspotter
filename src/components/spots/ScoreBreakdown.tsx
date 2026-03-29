import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getScoreColor } from '@/components/spots/ScoreBadge';
import { t } from '@/i18n';

type ScoreBreakdownProps = {
  compositeScore: number | null;
  terrainScore: number | null;
  aiScore: number | null;
  contextScore: number | null;
};

type BreakdownRow = {
  label: string;
  score: number | null;
  weight: number;
};

export const ScoreBreakdown = ({
  compositeScore,
  terrainScore,
  aiScore,
  contextScore,
}: ScoreBreakdownProps) => {
  const colors = useThemeColors();
  const overallColor = getScoreColor(compositeScore, colors);

  const rows: BreakdownRow[] = [
    { label: t('spotDetail.terrainWeight'), score: terrainScore, weight: 0.20 },
    { label: t('spotDetail.aiWeight'), score: aiScore, weight: 0.25 },
    { label: t('spotDetail.contextWeight'), score: contextScore, weight: 0.55 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.TEXT_PRIMARY }]}>
          {t('spotDetail.scoreBreakdown')}
        </Text>
        <View style={[styles.scorePill, { backgroundColor: overallColor }]}>
          <Text style={styles.scoreText}>
            {compositeScore !== null ? Math.round(compositeScore) : '--'}
          </Text>
        </View>
      </View>
      <View style={styles.rows}>
        {rows.map((row) => {
          const barColor = getScoreColor(row.score, colors);
          const barWidth = row.score != null && !isNaN(row.score) ? `${Math.min(row.score, 100)}%` : '0%';
          return (
            <View key={row.label} style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.TEXT_SECONDARY }]}>
                {row.label}
              </Text>
              <View style={[styles.barBg, { backgroundColor: colors.CARD }]}>
                <View
                  style={[styles.barFill, { width: barWidth as `${number}%`, backgroundColor: barColor }]}
                />
              </View>
              <Text style={[styles.rowScore, { color: colors.TEXT_PRIMARY }]}>
                {row.score != null && !isNaN(row.score) ? Math.round(row.score) : '--'}
              </Text>
            </View>
          );
        })}
      </View>
      {compositeScore !== null && (
        <Text style={[styles.formula, { color: colors.TEXT_MUTED }]}>
          {`Score = ${terrainScore != null && !isNaN(terrainScore) ? Math.round(terrainScore) : '--'}`}
          {` x 0.20 + ${aiScore != null && !isNaN(aiScore) ? Math.round(aiScore) : '--'}`}
          {` x 0.25 + ${contextScore != null && !isNaN(contextScore) ? Math.round(contextScore) : '--'}`}
          {` x 0.55 = ${Math.round(compositeScore)}`}
        </Text>
      )}
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
  rows: {
    gap: SPACING.SM,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  rowLabel: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    width: 120,
  },
  barBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  rowScore: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 14,
    width: 30,
    textAlign: 'right',
  },
  formula: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    marginTop: SPACING.XS,
  },
});
