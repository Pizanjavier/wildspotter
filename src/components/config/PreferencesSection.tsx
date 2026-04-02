import { View, Text, Switch, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settings-store';
import { t } from '@/i18n';

type RowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  children: React.ReactNode;
  iconColor: string;
  textColor: string;
};

const SettingRow = ({ icon, label, children, iconColor, textColor }: RowProps) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={20} color={iconColor} style={styles.rowIcon} />
    <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    {children}
  </View>
);

export const PreferencesSection = () => {
  const colors = useThemeColors();
  const slopeThreshold = useSettingsStore((s) => s.slopeThreshold);
  const minScore = useSettingsStore((s) => s.minScore);
  const hideRestricted = useSettingsStore((s) => s.hideRestricted);
  const showLegalZones = useSettingsStore((s) => s.showLegalZones);
  const offlineMode = useSettingsStore((s) => s.offlineMode);
  const setSlopeThreshold = useSettingsStore((s) => s.setSlopeThreshold);
  const setMinScore = useSettingsStore((s) => s.setMinScore);
  const setHideRestricted = useSettingsStore((s) => s.setHideRestricted);
  const setShowLegalZones = useSettingsStore((s) => s.setShowLegalZones);
  const setOfflineMode = useSettingsStore((s) => s.setOfflineMode);

  const handleSlopeChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 30) {
      setSlopeThreshold(num);
    }
  };

  const handleMinScoreChange = (text: string) => {
    const num = parseInt(text, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 100) {
      setMinScore(num);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT_MUTED }]}>
        {t('config.preferences')}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.CARD }]}>
        <SettingRow
          icon="triangle-outline"
          label={t('config.maxSlope')}
          iconColor={colors.TEXT_MUTED}
          textColor={colors.TEXT_PRIMARY}
        >
          <View style={[styles.inputContainer, { backgroundColor: colors.ACCENT + '1A' }]}>
            <TextInput
              style={[styles.input, { color: colors.ACCENT }]}
              value={String(slopeThreshold)}
              onChangeText={handleSlopeChange}
              keyboardType="numeric"
              maxLength={2}
              selectTextOnFocus
            />
            <Text style={[styles.inputUnit, { color: colors.ACCENT }]}>%</Text>
          </View>
        </SettingRow>
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <SettingRow
          icon="star-outline"
          label={t('config.minScore')}
          iconColor={colors.TEXT_MUTED}
          textColor={colors.TEXT_PRIMARY}
        >
          <View style={[styles.inputContainer, { backgroundColor: colors.ACCENT + '1A' }]}>
            <TextInput
              style={[styles.input, { color: colors.ACCENT }]}
              value={String(minScore)}
              onChangeText={handleMinScoreChange}
              keyboardType="numeric"
              maxLength={3}
              selectTextOnFocus
            />
          </View>
        </SettingRow>
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <SettingRow
          icon="location-outline"
          label={t('config.hideRestricted')}
          iconColor={colors.TEXT_MUTED}
          textColor={colors.TEXT_PRIMARY}
        >
          <Switch
            value={hideRestricted}
            onValueChange={setHideRestricted}
            trackColor={{ false: colors.BORDER, true: colors.ACCENT }}
            thumbColor={colors.WHITE}
          />
        </SettingRow>
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <SettingRow
          icon="map-outline"
          label={t('config.showLegalZones')}
          iconColor={colors.TEXT_MUTED}
          textColor={colors.TEXT_PRIMARY}
        >
          <Switch
            value={showLegalZones}
            onValueChange={setShowLegalZones}
            trackColor={{ false: colors.BORDER, true: '#EF4444' }}
            thumbColor={colors.WHITE}
          />
        </SettingRow>
        <View style={[styles.divider, { backgroundColor: colors.BORDER }]} />
        <SettingRow
          icon="cloud-offline-outline"
          label={t('config.offlineMode')}
          iconColor={colors.TEXT_MUTED}
          textColor={colors.TEXT_PRIMARY}
        >
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: colors.BORDER, true: colors.ACCENT }}
            thumbColor={colors.WHITE}
          />
        </SettingRow>
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
    paddingVertical: SPACING.SM,
  },
  rowIcon: {
    marginRight: SPACING.SM + 4,
  },
  label: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.XS,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.SM,
    paddingHorizontal: SPACING.SM + 2,
    paddingVertical: SPACING.XS,
  },
  input: {
    fontFamily: FONT_FAMILIES.DATA_BOLD,
    fontSize: 15,
    textAlign: 'center',
    width: 30,
    padding: 0,
  },
  inputUnit: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 13,
    marginLeft: 2,
  },
});
