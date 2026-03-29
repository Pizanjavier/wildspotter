import { useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settings-store';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useSpotsStore } from '@/stores/spots-store';
import { SpotCard } from '@/components/spots/SpotCard';
import type { SpotSummary } from '@/services/api/types';
import { t } from '@/i18n';

const EmptyState = () => {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.TEXT_PRIMARY }]}>
        {t('emptySpots.title')}
      </Text>
      <Text style={[styles.emptyBody, { color: colors.TEXT_SECONDARY }]}>
        {t('emptySpots.body')}
      </Text>
      <Pressable
        onPress={() => router.push('/(tabs)/map')}
        style={({ pressed }) => [
          styles.ctaButton,
          { backgroundColor: colors.ACCENT },
          pressed && styles.ctaPressed,
        ]}
      >
        <Text style={styles.ctaText}>{t('emptySpots.goToMap')}</Text>
      </Pressable>
    </View>
  );
};

const renderItem = ({ item }: { item: SpotSummary }) => (
  <SpotCard spot={item} />
);

const keyExtractor = (item: SpotSummary) => item.id;

export const SpotsScreen = () => {
  const colors = useThemeColors();
  const _lang = useSettingsStore((s) => s.language);
  const savedSpots = useSpotsStore((s) => s.savedSpots);

  const sortedSpots = useMemo(
    () => [...savedSpots].sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0)),
    [savedSpots],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ACCENT }]}>
          {t('spots.savedTitle')}
        </Text>
        <Text style={[styles.count, { color: colors.TEXT_MUTED }]}>
          {savedSpots.length === 1
            ? t('spots.countSingular', { count: savedSpots.length })
            : t('spots.count', { count: savedSpots.length })}
        </Text>
      </View>
      <FlatList
        data={sortedSpots}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          sortedSpots.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default SpotsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  title: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 20,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  count: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.XL,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingHorizontal: SPACING.XL,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 18,
    marginBottom: SPACING.XS,
  },
  emptyBody: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.MD,
  },
  ctaButton: {
    paddingVertical: SPACING.SM + 4,
    paddingHorizontal: SPACING.LG,
    borderRadius: 24,
  },
  ctaPressed: {
    opacity: 0.8,
  },
  ctaText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
