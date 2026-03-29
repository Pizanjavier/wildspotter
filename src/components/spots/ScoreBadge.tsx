import { View, Text, StyleSheet } from 'react-native';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/theme';

type ScoreBadgeProps = {
  score: number | null;
  size?: 'sm' | 'lg';
  variant?: 'circle' | 'pill';
};

const SIZES = {
  sm: { container: 38, fontSize: 13 },
  lg: { container: 56, fontSize: 22 },
} as const;

export const getScoreColor = (score: number | null, colors: ThemeColors): string => {
  if (score === null) return colors.TEXT_SECONDARY;
  if (score >= 80) return colors.SCORE_HIGH;
  if (score >= 60) return colors.SCORE_MEDIUM;
  return colors.SCORE_LOW;
};

export const ScoreBadge = ({ score, size = 'sm', variant = 'circle' }: ScoreBadgeProps) => {
  const colors = useThemeColors();
  const color = getScoreColor(score, colors);

  if (variant === 'pill') {
    return (
      <View style={[styles.pill, { backgroundColor: color }]}>
        <Text style={styles.pillText}>
          {score !== null ? `${Math.round(score)}% Match` : '--'}
        </Text>
      </View>
    );
  }

  const dimensions = SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text
        style={[
          styles.scoreText,
          { fontSize: dimensions.fontSize },
        ]}
      >
        {score !== null ? String(Math.round(score)) : '--'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  pill: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: SPACING.SM + 4,
    alignItems: 'center',
  },
  pillText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
