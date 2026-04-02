import { type ReactNode } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  useBottomSheetGesture,
  DRAG_ZONE_HEIGHT,
} from '@/hooks/useBottomSheetGesture';
import { t } from '@/i18n';

type BottomSheetProps = {
  spotsCount: number;
  regionName?: string;
  children?: ReactNode;
};

export const BottomSheet = ({
  spotsCount,
  regionName,
  children,
}: BottomSheetProps) => {
  const colors = useThemeColors();
  const { height: screenHeight } = useWindowDimensions();
  const { panGesture, sheetStyle, handleOpacity, contentHeight } =
    useBottomSheetGesture(spotsCount);

  const contentAnimatedStyle = {
    height: contentHeight,
  };

  const title = spotsCount > 0
    ? t('map.spotsFound', { count: spotsCount })
    : t('map.recentScans');

  return (
    <Animated.View
      style={[
        styles.container,
        sheetStyle,
        {
          height: screenHeight,
          backgroundColor: colors.BACKGROUND,
          borderTopColor: colors.BORDER,
        },
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.dragZone}>
          <View style={styles.handleArea}>
            <Animated.View
              style={[
                styles.handle,
                handleOpacity,
                { backgroundColor: colors.TEXT_MUTED },
              ]}
            />
          </View>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
                {title}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {regionName ? (
                <Text style={[styles.regionName, { color: colors.TEXT_SECONDARY }]}>
                  {regionName}
                </Text>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        <View style={styles.scrollContent}>
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 20,
    borderTopWidth: 1,
  },
  dragZone: {
    height: DRAG_ZONE_HEIGHT,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.SM,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  title: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 22,
  },
  regionName: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 12,
    letterSpacing: 1,
  },
  content: {
    overflow: 'hidden',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
});
