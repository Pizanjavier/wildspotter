import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settings-store';
import { DRAG_ZONE_HEIGHT, COLLAPSED_PEEK } from '@/hooks/useBottomSheetGesture';

const BASE_MARGIN = 20;
const BUTTON_SIZE = 48;
const BUTTON_GAP = 10;

/**
 * Floating map button that toggles the legal-zones overlay.
 * Positioned above MyLocationButton so users can surface the
 * protected-areas layer without digging into Config.
 */
export const MapLayersButton = () => {
  const colors = useThemeColors();
  const showLegalZones = useSettingsStore((s) => s.showLegalZones);
  const setShowLegalZones = useSettingsStore((s) => s.setShowLegalZones);

  const collapsedSheetHeight = DRAG_ZONE_HEIGHT + COLLAPSED_PEEK;
  const bottomOffset =
    collapsedSheetHeight + BASE_MARGIN + BUTTON_SIZE + BUTTON_GAP;

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
