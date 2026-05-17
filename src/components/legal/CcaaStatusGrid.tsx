import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CCAA_DATA, STATUS_SORT_ORDER } from '@/constants/ccaa-data';
import { useStatusColor } from '@/hooks/useCcaaStatus';
import { t } from '@/i18n';

type CcaaStatusGridProps = {
  selectedCcaa: string | null;
  onSelect: (id: string) => void;
};

const sorted = [...CCAA_DATA].sort(
  (a, b) => STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status],
);

export const CcaaStatusGrid = ({ selectedCcaa, onSelect }: CcaaStatusGridProps) => {
  const colors = useThemeColors();
  const getStatusColor = useStatusColor();

  return (
    <View style={styles.container}>
      {sorted.map((ccaa) => {
        const statusColor = getStatusColor(ccaa.status);
        const isSelected = selectedCcaa === ccaa.id;
        const stayLabel = ccaa.maxHours !== null && ccaa.maxHours > 0
          ? `${ccaa.maxHours}h`
          : ccaa.maxHours === 0
            ? t('legal.status_prohibited')
            : '—';

        return (
          <Pressable
            key={ccaa.id}
            style={[
              styles.row,
              { backgroundColor: isSelected ? statusColor + '10' : 'transparent', borderColor: colors.BORDER },
            ]}
            onPress={() => onSelect(ccaa.id)}
          >
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.name, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
              {ccaa.name}
            </Text>
            <Text style={[styles.stay, { color: statusColor }]}>
              {stayLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 2,
    marginHorizontal: SPACING.LG,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM + 2,
    borderRadius: RADIUS.SM,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 14,
  },
  stay: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 13,
    minWidth: 60,
    textAlign: 'right',
  },
});
