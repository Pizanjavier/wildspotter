import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type LegendEntry = {
  symbol: string;
  labelKey: 'legend.restricted' | 'legend.prohibited';
  colorKey: 'SCORE_LOW' | 'DANGER';
};

const ENTRIES: LegendEntry[] = [
  { symbol: '!', labelKey: 'legend.restricted', colorKey: 'SCORE_LOW' },
  { symbol: 'X', labelKey: 'legend.prohibited', colorKey: 'DANGER' },
];

export const LegalLegend = () => {
  const [expanded, setExpanded] = useState(false);
  const colors = useThemeColors();

  if (!expanded) {
    return (
      <Pressable
        style={[styles.pill, { backgroundColor: colors.CARD_SURFACE, borderColor: colors.BORDER }]}
        onPress={() => setExpanded(true)}
      >
        <Text style={[styles.pillText, { color: colors.TEXT_SECONDARY }]}>
          {t('legend.title')}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.panel, { backgroundColor: colors.CARD_SURFACE, borderColor: colors.BORDER }]}
      onPress={() => setExpanded(false)}
    >
      <Text style={[styles.panelTitle, { color: colors.TEXT_SECONDARY }]}>
        {t('legend.title')}
      </Text>
      {ENTRIES.map((entry) => (
        <View key={entry.labelKey} style={styles.row}>
          <Text style={[styles.symbol, { color: colors[entry.colorKey] }]}>
            {entry.symbol}
          </Text>
          <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>
            {t(entry.labelKey)}
          </Text>
        </View>
      ))}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    paddingHorizontal: SPACING.SM + 4,
    paddingVertical: SPACING.XS + 2,
    borderRadius: RADIUS.PILL,
    borderWidth: 1,
    opacity: 0.92,
  },
  pillText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  panel: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    paddingHorizontal: SPACING.SM + 4,
    paddingVertical: SPACING.SM,
    borderRadius: RADIUS.SM,
    borderWidth: 1,
    gap: 5,
    opacity: 0.94,
  },
  panelTitle: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  symbol: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    width: 14,
    textAlign: 'center',
  },
  label: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
  },
});
