import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export const TabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.BACKGROUND },
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
    height: 80,
    paddingTop: 12,
    paddingBottom: 21,
    paddingHorizontal: 21,
  },
  tabRow: {
    flex: 1,
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
