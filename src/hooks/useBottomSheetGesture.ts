import { useCallback, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

const SCREEN_HEIGHT = Dimensions.get('window').height;

/** Height of handle + header drag zone */
const DRAG_ZONE_HEIGHT = 80;
/** Total peek height when collapsed — drag zone + visible card previews */
const COLLAPSED_HEIGHT = 240;
const HALF_RATIO = 0.50;
const EXPANDED_RATIO = 0.85;

const SNAP_COLLAPSED = SCREEN_HEIGHT - COLLAPSED_HEIGHT;
const SNAP_HALF = SCREEN_HEIGHT * (1 - HALF_RATIO);
const SNAP_EXPANDED = SCREEN_HEIGHT * (1 - EXPANDED_RATIO);

const SNAP_POINTS = [SNAP_EXPANDED, SNAP_HALF, SNAP_COLLAPSED] as const;

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

const findNearestSnap = (y: number): number => {
  'worklet';
  let nearest = SNAP_POINTS[0];
  let minDist = Math.abs(y - nearest);
  for (let i = 1; i < SNAP_POINTS.length; i++) {
    const dist = Math.abs(y - SNAP_POINTS[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = SNAP_POINTS[i];
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
  const translateY = useSharedValue(SNAP_COLLAPSED);
  const startY = useSharedValue(SNAP_COLLAPSED);
  const isDragging = useSharedValue(false);

  const expandToHalf = useCallback(() => {
    translateY.value = withSpring(SNAP_HALF, SPRING_CONFIG);
  }, [translateY]);

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
      const clamped = Math.max(SNAP_EXPANDED, Math.min(SNAP_COLLAPSED, next));
      translateY.value = clamped;
    })
    .onEnd((event) => {
      isDragging.value = false;
      const velocity = event.velocityY;
      const projected = translateY.value + velocity * 0.15;
      const target = findNearestSnap(projected);
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

  /** Peek content visible when collapsed = COLLAPSED_HEIGHT - DRAG_ZONE_HEIGHT */
  const PEEK_CONTENT_HEIGHT = COLLAPSED_HEIGHT - DRAG_ZONE_HEIGHT;
  const contentHeight = useDerivedValue(() =>
    interpolate(
      translateY.value,
      [SNAP_EXPANDED, SNAP_COLLAPSED],
      [SCREEN_HEIGHT * EXPANDED_RATIO - DRAG_ZONE_HEIGHT, PEEK_CONTENT_HEIGHT],
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

export { SCREEN_HEIGHT, COLLAPSED_HEIGHT, DRAG_ZONE_HEIGHT, SNAP_COLLAPSED };
