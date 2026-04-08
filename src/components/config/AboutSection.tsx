import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

const DATA_SOURCES: ReadonlyArray<{ label: string; url: string }> = [
  { label: 'OSM', url: 'https://www.openstreetmap.org/copyright' },
  { label: 'IGN', url: 'https://www.ign.es/' },
  { label: 'MITECO', url: 'https://www.miteco.gob.es/' },
  { label: 'Catastro', url: 'https://www.sedecatastro.gob.es/' },
];

const FEEDBACK_EMAIL = 'feedback@wildspotter.app';

const handleFeedback = () => {
  Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=WildSpotter Feedback`);
};

export const AboutSection = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT_MUTED }]}>
        {t('config.about')}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.CARD }]}>
        <View style={styles.nameRow}>
          <Text style={[styles.appName, { color: colors.ACCENT }]}>
            WildSpotter v{APP_VERSION}
          </Text>
          <View
            style={[
              styles.earlyAccessBadge,
              { borderColor: colors.TEXT_MUTED + '66' },
            ]}
          >
            <Text style={[styles.earlyAccessText, { color: colors.TEXT_MUTED }]}>
              {t('config.earlyAccess')}
            </Text>
          </View>
        </View>
        <Text style={[styles.description, { color: colors.TEXT_SECONDARY }]}>
          {t('config.aboutDescription')}
        </Text>
        <View style={styles.sourcesRow}>
          {DATA_SOURCES.map(({ label, url }) => (
            <Pressable
              key={label}
              onPress={() => {
                void Linking.openURL(url);
              }}
              hitSlop={8}
            >
              <Text style={[styles.sourceLabel, { color: colors.ACCENT }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={handleFeedback}
        style={[styles.feedbackCard, { backgroundColor: colors.CARD }]}
      >
        <Ionicons
          name="mail-outline"
          size={20}
          color={colors.TEXT_MUTED}
          style={styles.feedbackIcon}
        />
        <View style={styles.feedbackText}>
          <Text style={[styles.feedbackLabel, { color: colors.TEXT_PRIMARY }]}>
            {t('config.sendFeedback')}
          </Text>
          <Text style={[styles.feedbackHint, { color: colors.TEXT_MUTED }]}>
            {t('config.sendFeedbackHint')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.TEXT_MUTED} />
      </Pressable>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  appName: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 16,
  },
  earlyAccessBadge: {
    marginLeft: SPACING.SM + 4,
    borderWidth: 1,
    borderRadius: RADIUS.PILL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
  },
  earlyAccessText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    letterSpacing: 0.5,
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
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    marginTop: SPACING.SM,
  },
  feedbackIcon: {
    marginRight: SPACING.SM + 4,
  },
  feedbackText: {
    flex: 1,
  },
  feedbackLabel: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 15,
  },
  feedbackHint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    marginTop: 2,
  },
});
