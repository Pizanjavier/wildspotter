import { useSettingsStore } from '@/stores/settings-store';
import { getThemeColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

export const useThemeColors = (): ThemeColors => {
  const theme = useSettingsStore((s) => s.theme);
  return getThemeColors(theme);
};
