import { useCallback, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of handle + header drag zone */
const DRAG_ZONE_HEIGHT = 80;
/** Visible card previews height when collapsed */
const COLLAPSED_PEEK = 160;
const HALF_RATIO = 0.50;
const EXPANDED_RATIO = 0.85;

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

const findNearestSnap = (y: number, snaps: readonly number[]): number => {
  'worklet';
  let nearest = snaps[0];
  let minDist = Math.abs(y - nearest);
  for (let i = 1; i < snaps.length; i++) {
    const dist = Math.abs(y - snaps[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = snaps[i];
    }
  }
  return nearest;
};

type BottomSheetGestureResult = {
  translateY: SharedValue<number>;
  panGesture: ReturnType<typeof Gesture.Pan>;
  sheetStyle: ReturnType<typeof useAnimatedStyle>;
  handleOpacity: ReturnType<typeof useAnimatedStyle>;
  contentHeight: SharedValue<number>;
  expandToHalf: () => void;
};

export const useBottomSheetGesture = (
  spotsCount: number,
): BottomSheetGestureResult => {
  const { height: screenHeight } = useWindowDimensions();

  // Total collapsed height = drag zone + peek content
  const collapsedHeight = DRAG_ZONE_HEIGHT + COLLAPSED_PEEK;

  const snapCollapsed = screenHeight - collapsedHeight;
  const snapHalf = screenHeight * (1 - HALF_RATIO);
  const snapExpanded = screenHeight * (1 - EXPANDED_RATIO);

  const SNAP_POINTS = [snapExpanded, snapHalf, snapCollapsed] as const;

  const translateY = useSharedValue(snapCollapsed);
  const startY = useSharedValue(snapCollapsed);
  const isDragging = useSharedValue(false);

  const expandToHalf = useCallback(() => {
    translateY.value = withSpring(snapHalf, SPRING_CONFIG);
  }, [translateY, snapHalf]);

  useEffect(() => {
    if (spotsCount > 0) {
      expandToHalf();
    }
  }, [spotsCount, expandToHalf]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
      isDragging.value = true;
    })
    .onUpdate((event) => {
      const next = startY.value + event.translationY;
      const clamped = Math.max(snapExpanded, Math.min(snapCollapsed, next));
      translateY.value = clamped;
    })
    .onEnd((event) => {
      isDragging.value = false;
      const velocity = event.velocityY;
      const projected = translateY.value + velocity * 0.15;
      const target = findNearestSnap(projected, SNAP_POINTS);
      translateY.value = withSpring(target, {
        ...SPRING_CONFIG,
        velocity,
      });
    });

  if (Platform.OS !== 'web') {
    panGesture.activeOffsetY([-10, 10]);
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleOpacity = useAnimatedStyle(() => ({
    opacity: isDragging.value ? 0.8 : 0.5,
  }));

  /** Peek content visible when collapsed */
  const contentHeight = useDerivedValue(() =>
    interpolate(
      translateY.value,
      [snapExpanded, snapCollapsed],
      [screenHeight * EXPANDED_RATIO - DRAG_ZONE_HEIGHT, COLLAPSED_PEEK],
    ),
  );

  return {
    translateY,
    panGesture,
    sheetStyle,
    handleOpacity,
    contentHeight,
    expandToHalf,
  };
};

export { DRAG_ZONE_HEIGHT, COLLAPSED_PEEK };
