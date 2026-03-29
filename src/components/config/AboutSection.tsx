import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

const APP_VERSION = '0.2.0';

const DATA_SOURCE_LABELS = ['OSM', 'IGN', 'MITECO', 'Catastro'];

export const AboutSection = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT_MUTED }]}>
        {t('config.about')}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.CARD }]}>
        <Text style={[styles.appName, { color: colors.ACCENT }]}>
          WildSpotter v{APP_VERSION}
        </Text>
        <Text style={[styles.description, { color: colors.TEXT_SECONDARY }]}>
          {t('config.aboutDescription')}
        </Text>
        <View style={styles.sourcesRow}>
          {DATA_SOURCE_LABELS.map((label) => (
            <Text
              key={label}
              style={[styles.sourceLabel, { color: colors.ACCENT }]}
            >
              {label}
            </Text>
          ))}
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
  appName: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 16,
    marginBottom: SPACING.SM,
  },
  description: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.MD,
  },
  sourcesRow: {
    flexDirection: 'row',
    gap: SPACING.SM + 4,
  },
  sourceLabel: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 12,
    letterSpacing: 1,
  },
});
