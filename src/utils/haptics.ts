import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const hapticSelection = async () => {
  if (!isNative) return;
  const { selectionAsync } = await import('expo-haptics');
  selectionAsync();
};

export const hapticImpact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!isNative) return;
  const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
  const map = { light: ImpactFeedbackStyle.Light, medium: ImpactFeedbackStyle.Medium, heavy: ImpactFeedbackStyle.Heavy };
  impactAsync(map[style]);
};
