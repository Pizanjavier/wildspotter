/**
 * PostHog analytics configuration and event name constants.
 *
 * Set EXPO_PUBLIC_POSTHOG_API_KEY and EXPO_PUBLIC_POSTHOG_HOST
 * in your .env or build environment. The values below are
 * placeholders — analytics is silently disabled when the key
 * is missing.
 */

export const POSTHOG_API_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';

export const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export const ANALYTICS_EVENTS = {
  APP_OPENED: 'app_opened',

  // Screens
  SCREEN_VIEWED: '$screen',

  // Onboarding
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Map
  AREA_SCANNED: 'area_scanned',
  MY_LOCATION_PRESSED: 'my_location_pressed',
  MAP_LAYERS_TOGGLED: 'map_layers_toggled',
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_SUGGESTION_SELECTED: 'search_suggestion_selected',
  FILTER_CHIP_PRESSED: 'filter_chip_pressed',

  // Spots
  SPOT_VIEWED: 'spot_viewed',
  SPOT_SAVED: 'spot_saved',
  SPOT_UNSAVED: 'spot_unsaved',
  SPOT_INSPECTED: 'spot_inspected',
  SPOT_NAVIGATED: 'spot_navigated',
  SPOT_REPORT_OPENED: 'spot_report_opened',
  SPOT_REPORTED: 'spot_reported',
  SPOT_POPUP_OPENED: 'spot_popup_opened',
  SPOT_SHOW_ON_MAP: 'spot_show_on_map',
  SORT_CHANGED: 'sort_changed',
  EMPTY_STATE_CTA_PRESSED: 'empty_state_cta_pressed',
  SECTION_EXPANDED: 'section_expanded',

  // Legal / Guide
  LEGAL_DETAIL_OPENED: 'legal_detail_opened',
  GUIDE_SECTION_EXPANDED: 'guide_section_expanded',

  // Config
  CONFIG_CHANGED: 'config_changed',
  LANGUAGE_CHANGED: 'language_changed',
  THEME_CHANGED: 'theme_changed',
  CACHE_CLEARED: 'cache_cleared',
  FEEDBACK_LINK_PRESSED: 'feedback_link_pressed',
  DATA_SOURCE_LINK_PRESSED: 'data_source_link_pressed',

  // Tab navigation
  TAB_SWITCHED: 'tab_switched',
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
