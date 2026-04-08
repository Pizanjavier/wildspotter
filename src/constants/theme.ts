export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  BACKGROUND: string;
  BACKGROUND_MAP: string;
  CARD: string;
  CARD_SURFACE: string;
  CARD_ELEVATED: string;
  ACCENT: string;
  ACCENT_DIM: string;
  SCORE_HIGH: string;
  SCORE_MEDIUM: string;
  SCORE_LOW: string;
  DANGER: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  TEXT_MUTED: string;
  BORDER: string;
  BLACK: string;
  WHITE: string;
  FOREST: string;
  SAND: string;
};

export const LIGHT_THEME: ThemeColors = {
  BACKGROUND: '#F7F3EE',
  BACKGROUND_MAP: '#EDE8E0',
  CARD: '#FFFFFF',
  CARD_SURFACE: '#FFFFFF',
  CARD_ELEVATED: '#FFFFFF',
  ACCENT: '#D97706',
  ACCENT_DIM: '#B45309',
  SCORE_HIGH: '#16A34A',
  SCORE_MEDIUM: '#22D3EE',
  SCORE_LOW: '#FBBF24',
  DANGER: '#EF4444',
  TEXT_PRIMARY: '#1C1410',
  TEXT_SECONDARY: '#6B5D4F',
  TEXT_MUTED: '#9C8E7E',
  BORDER: '#E2DDD5',
  BLACK: '#1C1410',
  WHITE: '#FFFFFF',
  FOREST: '#1B4332',
  SAND: '#D4A574',
};

export const DARK_THEME: ThemeColors = {
  BACKGROUND: '#1A1614',
  BACKGROUND_MAP: '#211C18',
  CARD: '#332B26',
  CARD_SURFACE: '#332B26',
  CARD_ELEVATED: '#3D3430',
  ACCENT: '#D97706',
  ACCENT_DIM: '#92400E',
  SCORE_HIGH: '#4ADE80',
  SCORE_MEDIUM: '#22D3EE',
  SCORE_LOW: '#FBBF24',
  DANGER: '#EF4444',
  TEXT_PRIMARY: '#FEF3C7',
  TEXT_SECONDARY: '#BCA88A',
  TEXT_MUTED: '#7A6E5E',
  BORDER: '#4A3F36',
  BLACK: '#0F0C0A',
  WHITE: '#FEF3C7',
  FOREST: '#1B4332',
  SAND: '#D4A574',
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === 'dark' ? DARK_THEME : LIGHT_THEME;

// Backward compat — will be replaced by useThemeColors hook in components
export const COLORS = LIGHT_THEME;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
} as const;

export const RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  PILL: 24,
} as const;
