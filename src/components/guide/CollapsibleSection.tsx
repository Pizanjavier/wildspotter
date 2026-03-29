import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';

type CollapsibleSectionProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
};

export const CollapsibleSection = ({
  icon,
  title,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) => {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.container, { backgroundColor: colors.CARD }]}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.ACCENT + '20' }]}>
          <Ionicons name={icon} size={18} color={colors.ACCENT} />
        </View>
        <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
          {title}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.TEXT_MUTED}
        />
      </Pressable>
      {expanded && (
        <View style={styles.body}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.MD,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 15,
  },
  body: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
    gap: SPACING.SM,
  },
});
