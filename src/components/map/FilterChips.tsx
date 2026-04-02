import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settings-store';
import { SEARCH_BAR_HEIGHT } from '@/components/map/SearchBar';
import { t } from '@/i18n';

const CHIPS_GAP = 8;

export const FilterChips = () => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const slopeThreshold = useSettingsStore((s) => s.slopeThreshold);
  const minScore = useSettingsStore((s) => s.minScore);

  // Position below SearchBar: insets.top + searchBarTopOffset(8) + searchBarHeight + gap
  const topOffset = Platform.OS === 'web'
    ? 74
    : insets.top + 8 + SEARCH_BAR_HEIGHT + CHIPS_GAP;

  return (
    <View style={[styles.chipsContainer, { top: topOffset }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
      >
        <Pressable
          style={[styles.chipAccent, { backgroundColor: colors.ACCENT }]}
          onPress={() => router.push('/(tabs)/config')}
        >
          <Ionicons name="options-outline" size={14} color="#FFFFFF" />
          <Text style={styles.chipAccentText}>{t('map.filtersChip')}</Text>
        </Pressable>

        {slopeThreshold > 0 && (
          <View
            style={[
              styles.chip,
              { backgroundColor: colors.CARD, borderColor: colors.BORDER },
            ]}
          >
            <Text style={[styles.chipText, { color: colors.TEXT_PRIMARY }]}>
              {'\u2264'}{slopeThreshold}% slope
            </Text>
          </View>
        )}

        {minScore > 0 && (
          <View
            style={[
              styles.chip,
              { backgroundColor: colors.CARD, borderColor: colors.SCORE_HIGH },
            ]}
          >
            <Text style={[styles.chipText, { color: colors.SCORE_HIGH }]}>
              {minScore}+
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chipsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  chipsContent: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  chipAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.XS + 2,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.PILL,
    gap: SPACING.XS,
  },
  chipAccentText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.XS + 2,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.PILL,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
