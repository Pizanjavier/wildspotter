import { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { geocode } from '@/services/geocoding';
import type { GeocodingResult } from '@/services/geocoding';
import { SearchSuggestions } from '@/components/map/SearchSuggestions';
import { t } from '@/i18n';

const DEBOUNCE_MS = 500;

type SearchBarProps = {
  onSelect?: (result: GeocodingResult) => void;
};

export const SearchBar = ({ onSelect }: SearchBarProps) => {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const performSearch = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const geocodeResults = await geocode(text);
      setResults(geocodeResults);
      setShowSuggestions(geocodeResults.length > 0);
    } catch (err) {
      console.warn('[SearchBar] Geocoding failed:', err);
      setResults([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (text.trim().length < 2) {
        setResults([]);
        setShowSuggestions(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        performSearch(text);
      }, DEBOUNCE_MS);
    },
    [performSearch],
  );

  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      setQuery(result.displayName.split(',')[0]);
      setShowSuggestions(false);
      setResults([]);
      inputRef.current?.blur();
      onSelect?.(result);
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowSuggestions(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    inputRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: colors.CARD }]}>
        <Ionicons
          name="search"
          size={20}
          color={colors.TEXT_MUTED}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.TEXT_PRIMARY }]}
          placeholder={t('map.searchLocation')}
          placeholderTextColor={colors.TEXT_MUTED}
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (results.length > 0) setShowSuggestions(true);
          }}
          returnKeyType="search"
          autoCorrect={false}
        />
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={colors.ACCENT}
            style={styles.loader}
          />
        )}
        {query.length > 0 && !isLoading && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.TEXT_SECONDARY} />
          </Pressable>
        )}
      </View>
      <SearchSuggestions
        results={results}
        onSelect={handleSelect}
        visible={showSuggestions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 52,
    left: SPACING.MD,
    right: SPACING.MD,
    zIndex: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: SPACING.MD + 4,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  searchIcon: {
    marginRight: SPACING.SM + 4,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as ReturnType<typeof StyleSheet.create>[string],
  clearButton: {
    padding: SPACING.XS,
    marginRight: SPACING.XS,
  },
  loader: {
    marginRight: SPACING.XS,
  },
});
