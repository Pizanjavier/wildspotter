import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/theme';
import type { GeocodingResult } from '@/services/geocoding';

type SearchSuggestionsProps = {
  results: GeocodingResult[];
  onSelect: (result: GeocodingResult) => void;
  visible: boolean;
};

const SuggestionItem = ({
  result,
  onSelect,
  colors,
}: {
  result: GeocodingResult;
  onSelect: (result: GeocodingResult) => void;
  colors: ThemeColors;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.item,
      pressed && { backgroundColor: `${colors.ACCENT}12` },
    ]}
    onPress={() => onSelect(result)}
  >
    <Text style={[styles.itemText, { color: colors.TEXT_PRIMARY }]} numberOfLines={2}>
      {result.displayName}
    </Text>
    <Text style={[styles.coordText, { color: colors.TEXT_SECONDARY }]}>
      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
    </Text>
  </Pressable>
);

export const SearchSuggestions = ({
  results,
  onSelect,
  visible,
}: SearchSuggestionsProps) => {
  const colors = useThemeColors();

  if (!visible || results.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.CARD,
          borderColor: colors.BORDER,
        },
      ]}
    >
      <FlatList
        data={results}
        keyExtractor={(item, index) =>
          `${item.lat}-${item.lng}-${index}`
        }
        renderItem={({ item }) => (
          <SuggestionItem result={item} onSelect={onSelect} colors={colors} />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.BORDER }]} />
        )}
        scrollEnabled={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    marginTop: SPACING.XS,
    overflow: 'hidden',
  },
  item: {
    paddingVertical: SPACING.SM + 2,
    paddingHorizontal: SPACING.MD,
  },
  itemText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    lineHeight: 18,
  },
  coordText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    marginTop: 2,
  },
  separator: {
    height: 1,
  },
});
