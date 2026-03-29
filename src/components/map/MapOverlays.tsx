import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

export const EmptyState = () => {
  const colors = useThemeColors();
  return (
    <View style={styles.stateContainer}>
      <Ionicons name="search-outline" size={36} color={colors.TEXT_SECONDARY} />
      <Text style={[styles.stateTitle, { color: colors.TEXT_PRIMARY }]}>
        {t('map.emptyTitle')}
      </Text>
      <Text style={[styles.stateHint, { color: colors.TEXT_SECONDARY }]}>
        {t('map.emptyHint')}
      </Text>
    </View>
  );
};

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  const colors = useThemeColors();
  return (
    <View style={styles.stateContainer}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.SCORE_LOW} />
      <Text style={[styles.stateTitle, { color: colors.SCORE_LOW }]}>
        {t('map.errorTitle')}
      </Text>
      <Text style={[styles.stateHint, { color: colors.TEXT_SECONDARY }]}>
        {message}
      </Text>
      <Pressable
        style={[styles.retryButton, { borderColor: colors.ACCENT }]}
        onPress={onRetry}
      >
        <Text style={[styles.retryText, { color: colors.ACCENT }]}>
          {t('map.retryButton')}
        </Text>
      </Pressable>
    </View>
  );
};

export const NoResultsToast = ({ visible }: { visible: boolean }) => {
  const colors = useThemeColors();
  if (!visible) return null;
  return (
    <View
      style={[
        styles.floatingToast,
        { backgroundColor: colors.CARD, borderColor: colors.SCORE_LOW },
      ]}
    >
      <Ionicons name="leaf-outline" size={18} color={colors.SCORE_LOW} />
      <View style={styles.toastTextContainer}>
        <Text style={[styles.toastTitle, { color: colors.TEXT_PRIMARY }]}>
          {t('map.emptyTitle')}
        </Text>
        <Text style={[styles.toastHint, { color: colors.TEXT_SECONDARY }]}>
          {t('map.emptyHint')}
        </Text>
      </View>
    </View>
  );
};

export const ZoomWarning = () => {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.floatingToast,
        { backgroundColor: colors.CARD, borderColor: colors.SCORE_LOW },
      ]}
    >
      <Ionicons
        name="warning-outline"
        size={18}
        color={colors.SCORE_LOW}
        style={styles.toastIcon}
      />
      <View style={styles.toastTextContainer}>
        <Text style={[styles.toastTitle, { color: colors.SCORE_LOW }]}>
          {t('map.zoomWarningTitle')}
        </Text>
        <Text style={[styles.toastHint, { color: colors.TEXT_SECONDARY }]}>
          {t('map.zoomWarningHint')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stateContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  stateTitle: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 16,
    textAlign: 'center',
  },
  stateHint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: SPACING.SM,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    borderRadius: RADIUS.PILL,
    borderWidth: 1.5,
  },
  retryText: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 13,
    letterSpacing: 2,
  },
  floatingToast: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.SM + 2,
    paddingHorizontal: SPACING.MD,
    borderWidth: 1.5,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastIcon: {
    marginRight: SPACING.SM,
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  toastTitle: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
    marginBottom: 2,
  },
  toastHint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
    lineHeight: 15,
  },
});
