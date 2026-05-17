import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

export const LegalDisclaimer = () => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.CARD_SURFACE, borderColor: colors.BORDER },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name="shield-outline"
          size={16}
          color={colors.SCORE_LOW}
        />
        <Text style={[styles.title, { color: colors.SCORE_LOW }]}>
          {t('legal.disclaimerTitle')}
        </Text>
      </View>
      <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
        {t('legal.disclaimerFull')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  title: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 18,
  },
});
