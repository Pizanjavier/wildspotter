import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CCAA_DATA } from '@/constants/ccaa-data';
import { useStatusColor } from '@/hooks/useCcaaStatus';
import { t } from '@/i18n';

type CcaaDetailCardProps = {
  ccaaId: string;
};

export const CcaaDetailCard = ({ ccaaId }: CcaaDetailCardProps) => {
  const colors = useThemeColors();
  const getStatusColor = useStatusColor();
  const ccaa = CCAA_DATA.find((c) => c.id === ccaaId);

  if (!ccaa) return null;

  const statusColor = getStatusColor(ccaa.status);
  const statusLabel = t(`legal.status_${ccaa.status}`);

  const handleSearchBoe = () => {
    if (!ccaa.decree) return;
    Linking.openURL(`https://www.boe.es/buscar/act.php?q=${encodeURIComponent(ccaa.decree)}`);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}>
      <View style={styles.headerRow}>
        <Ionicons name="business-outline" size={18} color={statusColor} />
        <Text style={[styles.name, { color: colors.TEXT_PRIMARY }]}>{ccaa.name}</Text>
      </View>

      {ccaa.decree && (
        <Text style={[styles.decree, { color: colors.TEXT_SECONDARY }]}>{ccaa.decree}</Text>
      )}

      <View style={styles.statusRow}>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {ccaa.maxHours !== null && ccaa.maxHours > 0 && (
          <Text style={[styles.maxStay, { color: colors.TEXT_PRIMARY }]}>
            {ccaa.maxHours}h max
          </Text>
        )}
      </View>

      {ccaa.conditions === 'noExternalElements' && (
        <View style={styles.conditionRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.SCORE_LOW} />
          <Text style={[styles.conditionText, { color: colors.TEXT_SECONDARY }]}>
            {t('legal.hintNoExternalElements')}
          </Text>
        </View>
      )}

      {ccaa.decree && (
        <Pressable style={styles.boeLink} onPress={handleSearchBoe}>
          <Ionicons name="search-outline" size={13} color={colors.ACCENT} />
          <Text style={[styles.boeLinkText, { color: colors.ACCENT }]}>
            {t('legal.searchBoe')}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    padding: SPACING.LG,
    gap: SPACING.SM,
    marginHorizontal: SPACING.LG,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  name: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 18,
  },
  decree: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
    marginTop: SPACING.XS,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.SM + 4,
    paddingVertical: SPACING.XS + 2,
    borderRadius: RADIUS.PILL,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 13,
  },
  maxStay: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 15,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
  },
  boeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: SPACING.XS,
  },
  boeLinkText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 12,
  },
});
