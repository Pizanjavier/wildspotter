import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';
import { trackEvent } from '@/services/analytics';
import { ANALYTICS_EVENTS } from '@/constants/analytics';

export type SortKey = 'score' | 'slope' | 'elevation';

type SortControlsProps = {
  activeKey: SortKey;
  onSelect: (key: SortKey) => void;
};

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: 'score', labelKey: 'sort.score' },
  { key: 'slope', labelKey: 'sort.slope' },
  { key: 'elevation', labelKey: 'sort.elevation' },
];

export const SortControls = ({ activeKey, onSelect }: SortControlsProps) => {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      {SORT_OPTIONS.map(({ key, labelKey }) => {
        const isActive = key === activeKey;
        return (
          <Pressable
            key={key}
            onPress={() => {
              trackEvent(ANALYTICS_EVENTS.SORT_CHANGED, { sort_by: key });
              onSelect(key);
            }}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? colors.ACCENT : 'transparent',
                borderColor: isActive ? colors.ACCENT : colors.BORDER,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? '#FFFFFF' : colors.TEXT_SECONDARY },
              ]}
            >
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.PILL,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
