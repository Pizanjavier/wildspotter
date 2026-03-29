import { FlatList, StyleSheet } from 'react-native';
import { SPACING } from '@/constants/theme';
import { SpotCard } from '@/components/spots/SpotCard';
import type { SpotSummary } from '@/services/api/types';

type SpotListProps = {
  spots: SpotSummary[];
};

const keyExtractor = (item: SpotSummary): string => item.id;

export const SpotList = ({ spots }: SpotListProps) => {
  const renderItem = ({ item }: { item: SpotSummary }) => (
    <SpotCard spot={item} />
  );

  return (
    <FlatList
      data={spots}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.XL,
    gap: 0,
  },
});
