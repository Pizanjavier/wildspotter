import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: TabIconName; inactive: TabIconName }> = {
  map: { active: 'map', inactive: 'map-outline' },
  spots: { active: 'grid', inactive: 'grid-outline' },
  legal: { active: 'book', inactive: 'book-outline' },
  config: { active: 'settings', inactive: 'settings-outline' },
};

const TAB_LABELS: Record<string, () => string> = {
  map: () => t('tabs.map'),
  spots: () => t('tabs.spots'),
  legal: () => t('tabs.guide'),
  config: () => t('tabs.config'),
};

const TAB_CONTENT_HEIGHT = 46;
const TAB_TOP_PADDING = 12;
const TAB_BASE_BOTTOM_PADDING = 8;

export const TabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  // When the device has a bottom inset (home indicator / nav bar), add it.
  // Otherwise fall back to a comfortable default.
  const bottomPadding = insets.bottom > 0
    ? insets.bottom + TAB_BASE_BOTTOM_PADDING
    : 21;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.BACKGROUND,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if ((options as Record<string, unknown>).href === null) return null;

          const label = TAB_LABELS[route.name]?.() ?? options.title ?? route.name;
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name] ?? {
            active: 'ellipse' as TabIconName,
            inactive: 'ellipse-outline' as TabIconName,
          };

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const handleLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={handlePress}
              onLongPress={handleLongPress}
              style={[
                styles.tab,
                isFocused && {
                  backgroundColor: colors.ACCENT + '1A',
                },
              ]}
            >
              <Ionicons
                name={isFocused ? icons.active : icons.inactive}
                size={22}
                color={isFocused ? colors.ACCENT : colors.TEXT_MUTED}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.ACCENT : colors.TEXT_MUTED,
                    fontFamily: isFocused
                      ? FONT_FAMILIES.DATA_BOLD
                      : FONT_FAMILIES.DATA,
                  },
                ]}
              >
                {label.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: TAB_TOP_PADDING,
    paddingHorizontal: 21,
  },
  tabRow: {
    height: TAB_CONTENT_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: RADIUS.PILL,
    gap: 4,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1.5,
  },
});
