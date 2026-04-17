import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getScoreColor } from '@/components/spots/ScoreBadge';
import { t } from '@/i18n';

const TERRAIN_WEIGHT = 0.10;
const AI_WEIGHT = 0.55;
const CONTEXT_WEIGHT = 0.15;

type ScoreBreakdownProps = {
  compositeScore: number | null;
  terrainScore: number | null;
  aiScore: number | null;
  contextScore: number | null;
  wildBonus: number | null;
  landcoverPenalty: number | null;
};

type BaseRow = {
  label: string;
  score: number | null;
};

const round = (n: number | null): string =>
  n != null && !isNaN(n) ? String(Math.round(n)) : '--';

export const ScoreBreakdown = ({
  compositeScore,
  terrainScore,
  aiScore,
  contextScore,
  wildBonus,
  landcoverPenalty,
}: ScoreBreakdownProps) => {
  const colors = useThemeColors();
  const overallColor = getScoreColor(compositeScore, colors);

  const baseRows: BaseRow[] = [
    { label: t('spotDetail.terrainWeight'), score: terrainScore },
    { label: t('spotDetail.aiWeight'), score: aiScore },
    { label: t('spotDetail.contextWeight'), score: contextScore },
  ];

  const showBonus = wildBonus != null && wildBonus > 0;
  const showPenalty = landcoverPenalty != null && landcoverPenalty > 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.TEXT_PRIMARY }]}>
          {t('spotDetail.scoreBreakdown')}
        </Text>
        <View style={[styles.scorePill, { backgroundColor: overallColor }]}>
          <Text style={styles.scoreText}>{round(compositeScore)}</Text>
        </View>
      </View>

      <View style={styles.rows}>
        {baseRows.map((row) => {
          const barColor = getScoreColor(row.score, colors);
          const barWidth =
            row.score != null && !isNaN(row.score)
              ? `${Math.min(row.score, 100)}%`
              : '0%';
          return (
            <View key={row.label} style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.TEXT_SECONDARY }]}>
                {row.label}
              </Text>
              <View style={[styles.barBg, { backgroundColor: colors.CARD }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: barWidth as `${number}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.rowScore, { color: colors.TEXT_PRIMARY }]}>
                {round(row.score)}
              </Text>
            </View>
          );
        })}

        {showBonus && (
          <View style={styles.adjustRow}>
            <Text style={[styles.adjustLabel, { color: colors.SCORE_HIGH }]}>
              {`+ ${t('spotDetail.wildBonusLabel')}`}
            </Text>
            <Text style={[styles.adjustValue, { color: colors.SCORE_HIGH }]}>
              {`+${round(wildBonus)}`}
            </Text>
          </View>
        )}

        {showPenalty && (
          <View style={styles.adjustRow}>
            <Text style={[styles.adjustLabel, { color: colors.SCORE_LOW }]}>
              {`− ${t('spotDetail.landcoverPenaltyLabel')}`}
            </Text>
            <Text style={[styles.adjustValue, { color: colors.SCORE_LOW }]}>
              {`−${round(landcoverPenalty)}`}
            </Text>
          </View>
        )}
      </View>

      {compositeScore !== null && (
        <Text style={[styles.formula, { color: colors.TEXT_MUTED }]}>
          {`${round(terrainScore)} × ${Math.round(TERRAIN_WEIGHT * 100)}% + `}
          {`${round(aiScore)} × ${Math.round(AI_WEIGHT * 100)}% + `}
          {`${round(contextScore)} × ${Math.round(CONTEXT_WEIGHT * 100)}%`}
          {showBonus ? ` + ${round(wildBonus)}` : ''}
          {showPenalty ? ` − ${round(landcoverPenalty)}` : ''}
          {` = ${Math.round(compositeScore)}`}
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
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  adjustLabel: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
  },
  adjustValue: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 14,
  },
  formula: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    marginTop: SPACING.XS,
  },
});
