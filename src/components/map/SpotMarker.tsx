import { View, Text, StyleSheet } from 'react-native';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/theme';
import type { LngLat } from '@/types/map';

const getThemedScoreColor = (score: number | null, colors: ThemeColors): string => {
  if (score === null) return colors.TEXT_SECONDARY;
  if (score >= 30) return colors.SCORE_HIGH;
  if (score >= 10) return colors.SCORE_MEDIUM;
  return colors.SCORE_LOW;
};

type SpotMarkerProps = {
  coordinates: LngLat;
  score?: number | null;
  size?: number;
};

export const SpotMarker = ({
  score = null,
  size = 36,
}: SpotMarkerProps) => {
  const colors = useThemeColors();
  const color = getThemedScoreColor(score, colors);
  const displayText = score !== null ? String(Math.round(score)) : '--';

  return (
    <View
      style={[
        styles.marker,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={styles.label}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
