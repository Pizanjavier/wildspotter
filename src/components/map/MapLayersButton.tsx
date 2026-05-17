import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settings-store';
import { useBottomSheetTop } from '@/hooks/useBottomSheetTop';
import { LOCATION_BUTTON_SIZE } from '@/components/map/MyLocationButton';

const BUTTON_SIZE = 48;
const BUTTON_GAP = 8;

export const MapLayersButton = () => {
  const colors = useThemeColors();
  const showLegalZones = useSettingsStore((s) => s.showLegalZones);
  const setShowLegalZones = useSettingsStore((s) => s.setShowLegalZones);
  const sheetTop = useBottomSheetTop();

  const bottomOffset = sheetTop + BUTTON_GAP + LOCATION_BUTTON_SIZE + BUTTON_GAP;

  const webShadow =
    Platform.OS === 'web'
      ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        };

  const iconColor = showLegalZones ? colors.DANGER : colors.ACCENT;
  const borderColor = showLegalZones ? colors.DANGER : colors.BORDER;

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: colors.CARD,
          borderColor,
          bottom: bottomOffset,
        },
        webShadow,
      ]}
      onPress={() => setShowLegalZones(!showLegalZones)}
      accessibilityRole="switch"
      accessibilityState={{ checked: showLegalZones }}
    >
      <Ionicons
        name={showLegalZones ? 'layers' : 'layers-outline'}
        size={22}
        color={iconColor}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: SPACING.MD,
    zIndex: 10,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: RADIUS.PILL,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
