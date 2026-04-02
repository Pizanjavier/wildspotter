import { useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { DRAG_ZONE_HEIGHT, COLLAPSED_PEEK } from '@/hooks/useBottomSheetGesture';
import { t } from '@/i18n';

type ScanButtonProps = {
  onPress?: () => void;
  isScanning?: boolean;
  disabled?: boolean;
};

/** Gap between the scan button and the collapsed sheet header */
const SCAN_BUTTON_MARGIN = 20;

export const ScanButton = ({
  onPress,
  isScanning = false,
  disabled = false,
}: ScanButtonProps) => {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isScanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
    return undefined;
  }, [isScanning, pulseAnim]);

  const handlePress = () => {
    if (isScanning || disabled) return;
    onPress?.();
  };

  const label = isScanning
    ? t('map.scanning')
    : disabled
      ? t('map.scanDisabledZoom')
      : t('map.scanButton');
  const iconName = isScanning ? 'pulse-outline' : 'radio-outline';

  // Position above the collapsed bottom sheet
  const collapsedSheetHeight = DRAG_ZONE_HEIGHT + COLLAPSED_PEEK;
  const bottomOffset = collapsedSheetHeight + SCAN_BUTTON_MARGIN;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <Animated.View style={[styles.wrapper, { opacity: pulseAnim }]}>
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: disabled ? colors.BORDER : colors.ACCENT,
              shadowColor: disabled ? 'transparent' : colors.ACCENT,
              shadowOpacity: disabled ? 0 : 0.4,
            },
            isScanning && { borderColor: colors.SCORE_LOW },
          ]}
          onPress={handlePress}
          disabled={isScanning || disabled}
        >
          <Ionicons
            name={iconName}
            size={18}
            color={disabled ? colors.TEXT_MUTED : '#FFFFFF'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.label,
              disabled && { color: colors.TEXT_MUTED },
            ]}
          >
            {label}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
  },
  wrapper: {},
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 48,
    borderRadius: RADIUS.PILL,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    gap: SPACING.SM,
  },
  icon: {},
  label: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
