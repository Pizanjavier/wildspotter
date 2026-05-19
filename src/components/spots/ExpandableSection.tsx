import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { trackEvent } from '@/services/analytics';
import { ANALYTICS_EVENTS } from '@/constants/analytics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ExpandableSectionProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export const ExpandableSection = ({
  title,
  icon,
  children,
  defaultOpen = false,
}: ExpandableSectionProps) => {
  const colors = useThemeColors();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => {
      if (!prev) trackEvent(ANALYTICS_EVENTS.SECTION_EXPANDED, { section: title });
      return !prev;
    });
  }, [title]);

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}>
      <Pressable style={styles.header} onPress={toggle}>
        <Ionicons name={icon} size={18} color={colors.ACCENT} />
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.TEXT_MUTED}
        />
      </Pressable>
      {open && <View style={[styles.content, { borderTopColor: colors.BORDER }]}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 14,
  },
  title: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 14,
  },
  content: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
