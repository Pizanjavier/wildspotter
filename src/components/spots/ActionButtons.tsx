import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { openNavigate, openInspect } from '@/services/navigation';
import { t } from '@/i18n';

type ActionButtonsProps = {
  lat: number;
  lon: number;
};

export const ActionButtons = ({ lat, lon }: ActionButtonsProps) => {
  const colors = useThemeColors();

  const handleInspect = () => {
    openInspect(lat, lon);
  };

  const handleNavigate = () => {
    openNavigate(lat, lon);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handleInspect}
        style={({ pressed }) => [
          styles.inspectButton,
          { borderColor: colors.ACCENT },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.ACCENT} />
        <Text style={[styles.inspectText, { color: colors.ACCENT }]}>
          {t('spotDetail.inspect')}
        </Text>
      </Pressable>
      <Pressable
        onPress={handleNavigate}
        style={({ pressed }) => [
          styles.navigateButton,
          { backgroundColor: colors.SCORE_HIGH },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
        <Text style={styles.navigateText}>{t('spotDetail.navigate')}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.SM + 4,
  },
  inspectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: RADIUS.MD,
    borderWidth: 2,
    backgroundColor: 'transparent',
    gap: SPACING.SM,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: RADIUS.MD,
    gap: SPACING.SM,
  },
  pressed: {
    opacity: 0.7,
  },
  inspectText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 15,
  },
  navigateText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
