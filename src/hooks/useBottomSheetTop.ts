import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DRAG_ZONE_HEIGHT, COLLAPSED_PEEK } from '@/hooks/useBottomSheetGesture';

const TAB_BAR_CONTENT = 46;
const TAB_BAR_TOP_PADDING = 12;
const TAB_BAR_BASE_BOTTOM = 8;

export const useBottomSheetTop = (): number => {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const tabBarBottom = insets.bottom > 0 ? insets.bottom + TAB_BAR_BASE_BOTTOM : 21;
  const tabBarHeight = TAB_BAR_TOP_PADDING + TAB_BAR_CONTENT + tabBarBottom;

  const collapsedHeight = DRAG_ZONE_HEIGHT + COLLAPSED_PEEK;
  const sheetTopY = screenHeight - collapsedHeight;
  const containerHeight = screenHeight - tabBarHeight;
  const sheetTopFromContainerBottom = containerHeight - sheetTopY;

  return Math.max(sheetTopFromContainerBottom, 0);
};
