import { useCallback } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CcaaStatus } from '@/constants/ccaa-data';

export const useStatusColor = () => {
  const colors = useThemeColors();

  return useCallback(
    (status: CcaaStatus): string => {
      switch (status) {
        case 'prohibited':
          return colors.DANGER;
        case 'tolerated':
          return colors.SCORE_LOW;
        case 'permitted':
          return colors.SCORE_HIGH;
        case 'ambiguous':
        case 'no_decree':
          return colors.TEXT_MUTED;
      }
    },
    [colors],
  );
};

export const useStatusLabel = () => {
  return useCallback((status: CcaaStatus): string => {
    const labels: Record<CcaaStatus, string> = {
      prohibited: 'legal.statusProhibited',
      tolerated: 'legal.statusTolerated',
      permitted: 'legal.statusPermitted',
      ambiguous: 'legal.statusAmbiguous',
      no_decree: 'legal.statusNoDecree',
    };
    return labels[status];
  }, []);
};
