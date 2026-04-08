import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAllCachedScans, clearCache, getCacheSize } from '@/services/cache';
import { t } from '@/i18n';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const CacheSection = () => {
  const colors = useThemeColors();
  const [scanCount, setScanCount] = useState(0);
  const [cacheBytes, setCacheBytes] = useState(0);
  const [clearing, setClearing] = useState(false);

  const refreshStats = useCallback(async () => {
    const scans = await getAllCachedScans();
    setScanCount(scans.length);
    const size = await getCacheSize();
    setCacheBytes(size);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleClear = () => {
    const doClear = async () => {
      setClearing(true);
      await clearCache();
      setScanCount(0);
      setCacheBytes(0);
      setClearing(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('config.clearConfirmMessage'))) {
        doClear();
      }
      return;
    }

    Alert.alert(
      t('config.clearConfirmTitle'),
      t('config.clearConfirmMessage'),
      [
        { text: t('config.clearConfirmCancel'), style: 'cancel' },
        { text: t('config.clearConfirmAction'), style: 'destructive', onPress: doClear },
      ],
    );
  };

  const summary = t('config.cacheSummary', {
    count: scanCount,
    size: formatBytes(cacheBytes),
  });

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT_MUTED }]}>
        {t('config.cachedData')}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.CARD }]}>
        <View style={styles.row}>
          <Ionicons
            name="server-outline"
            size={20}
            color={colors.TEXT_MUTED}
            style={styles.icon}
          />
          <View style={styles.textCol}>
            <Text style={[styles.summaryText, { color: colors.TEXT_PRIMARY }]}>
              {summary}
            </Text>
            <Text style={[styles.hint, { color: colors.TEXT_MUTED }]}>
              {t('config.clearHint')}
            </Text>
          </View>
          <Pressable
            onPress={handleClear}
            disabled={clearing}
            style={[
              styles.clearButton,
              { backgroundColor: colors.ACCENT },
              clearing && styles.clearDisabled,
            ]}
          >
            <Text style={[styles.clearText, { color: colors.WHITE }]}>
              {clearing ? t('config.clearing') : t('config.clearCache')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.SM,
  },
  card: {
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.SM + 4,
  },
  textCol: {
    flex: 1,
  },
  summaryText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 14,
  },
  hint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    borderRadius: RADIUS.PILL,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS + 2,
  },
  clearDisabled: {
    opacity: 0.5,
  },
  clearText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 13,
  },
});
