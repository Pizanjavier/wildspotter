import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type ScanningOverlayProps = {
  visible: boolean;
};

export const ScanningOverlay = ({ visible }: ScanningOverlayProps) => {
  const colors = useThemeColors();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.CARD,
          borderColor: colors.BORDER,
        },
      ]}
      pointerEvents="none"
    >
      <ActivityIndicator
        size="small"
        color={colors.ACCENT}
        style={styles.spinner}
      />
      <Text style={[styles.title, { color: colors.ACCENT }]}>
        {t('scanning.title')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.PILL,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderWidth: 1,
    gap: SPACING.SM,
  },
  title: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  spinner: {},
});
