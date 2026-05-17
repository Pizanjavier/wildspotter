import { useRef, useCallback } from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CCAA_DATA } from '@/constants/ccaa-data';
import { useStatusColor } from '@/hooks/useCcaaStatus';

type CcaaStripProps = {
  selectedCcaa: string | null;
  onSelect: (id: string) => void;
};

export const CcaaStrip = ({ selectedCcaa, onSelect }: CcaaStripProps) => {
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const getStatusColor = useStatusColor();

  const handleSelect = useCallback(
    (id: string, index: number) => {
      onSelect(id);
      scrollRef.current?.scrollTo({ x: Math.max(0, index * 120 - 40), animated: true });
    },
    [onSelect],
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {CCAA_DATA.map((ccaa, index) => {
        const isSelected = selectedCcaa === ccaa.id;
        const statusColor = getStatusColor(ccaa.status);

        return (
          <Pressable
            key={ccaa.id}
            onPress={() => handleSelect(ccaa.id, index)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? statusColor + '20' : colors.CARD,
                borderColor: isSelected ? statusColor : colors.BORDER,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? colors.TEXT_PRIMARY : colors.TEXT_SECONDARY,
                },
              ]}
              numberOfLines={1}
            >
              {ccaa.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    gap: SPACING.SM,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.PILL,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
  },
});
