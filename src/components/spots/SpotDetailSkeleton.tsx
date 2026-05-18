import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

type SkeletonBlockProps = {
  width: number | `${number}%`;
  height: number;
  style?: object;
};

const SkeletonBlock = ({ width, height, style }: SkeletonBlockProps) => {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: colors.CARD, borderRadius: RADIUS.SM, opacity },
        style,
      ]}
    />
  );
};

export const SpotDetailSkeleton = () => {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* Image placeholder */}
      <SkeletonBlock width="100%" height={260} style={{ borderRadius: 0 }} />

      {/* Content area */}
      <View style={styles.content}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <SkeletonBlock width={180} height={24} />
            <SkeletonBlock width={120} height={14} style={{ marginTop: 8 }} />
          </View>
          <SkeletonBlock width={56} height={56} style={{ borderRadius: 28 }} />
        </View>

        {/* Legal situation */}
        <SkeletonBlock width="100%" height={80} style={{ marginTop: SPACING.LG }} />

        {/* Highlights pills */}
        <View style={styles.pillsRow}>
          <SkeletonBlock width={80} height={28} style={{ borderRadius: 14 }} />
          <SkeletonBlock width={100} height={28} style={{ borderRadius: 14 }} />
          <SkeletonBlock width={70} height={28} style={{ borderRadius: 14 }} />
        </View>

        {/* Expandable sections */}
        <SkeletonBlock width="100%" height={48} style={{ marginTop: SPACING.MD }} />
        <SkeletonBlock width="100%" height={48} style={{ marginTop: SPACING.SM }} />
        <SkeletonBlock width="100%" height={48} style={{ marginTop: SPACING.SM }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.LG },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleCol: { flex: 1 },
  pillsRow: { flexDirection: 'row', gap: SPACING.SM, marginTop: SPACING.LG },
});
