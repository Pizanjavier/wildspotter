import { Text, StyleSheet } from 'react-native';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

export const RadarSection = () => {
  const colors = useThemeColors();
  return (
    <Text style={[styles.body, { color: colors.TEXT_SECONDARY }]}>
      {t('guide.radarBody')}
    </Text>
  );
};

const styles = StyleSheet.create({
  body: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    lineHeight: 21,
  },
});
