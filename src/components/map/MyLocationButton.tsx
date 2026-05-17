import { Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useBottomSheetTop } from '@/hooks/useBottomSheetTop';

const BUTTON_GAP = 8;

export const MyLocationButton = () => {
  const colors = useThemeColors();
  const { status, locate, openSettings } = useUserLocation();
  const sheetTop = useBottomSheetTop();

  const isLocating = status === 'requesting' || status === 'locating';
  const isDenied = status === 'denied';

  const handlePress = () => {
    if (isLocating) return;
    if (isDenied) {
      openSettings();
      return;
    }
    locate();
  };

  const iconColor = isDenied ? colors.TEXT_MUTED : colors.ACCENT;
  const bottomOffset = sheetTop + BUTTON_GAP;

  const webShadow = Platform.OS === 'web'
    ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)' }
    : { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 };

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: colors.CARD,
          borderColor: colors.BORDER,
          bottom: bottomOffset,
        },
        webShadow,
      ]}
      onPress={handlePress}
      disabled={isLocating}
    >
      {isLocating ? (
        <ActivityIndicator size="small" color={colors.ACCENT} />
      ) : (
        <Ionicons
          name={isDenied ? 'navigate-outline' : 'navigate'}
          size={22}
          color={iconColor}
        />
      )}
    </Pressable>
  );
};

export const LOCATION_BUTTON_SIZE = 48;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: SPACING.MD,
    zIndex: 10,
    width: LOCATION_BUTTON_SIZE,
    height: LOCATION_BUTTON_SIZE,
    borderRadius: RADIUS.PILL,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
