import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type LandcoverCardProps = {
  landcoverClass: string | null;
  landcoverLabel: string | null;
};

type Tone = 'wild' | 'neutral' | 'penalty' | 'unknown';

const classifyCode = (code: string | null): Tone => {
  if (!code) return 'unknown';
  const prefix = code.slice(0, 2);
  const first = code.charAt(0);
  if (prefix === '31' || prefix === '32' || prefix === '33' || prefix === '41' || prefix === '51') {
    return 'wild';
  }
  if (first === '1' || prefix === '21' || prefix === '22' || prefix === '23' || prefix === '24') {
    return 'penalty';
  }
  return 'neutral';
};

export const LandcoverCard = ({
  landcoverClass,
  landcoverLabel,
}: LandcoverCardProps) => {
  const colors = useThemeColors();
  const tone = classifyCode(landcoverClass);

  const tintColor =
    tone === 'wild'
      ? colors.SCORE_HIGH
      : tone === 'penalty'
        ? colors.SCORE_LOW
        : colors.ACCENT;

  const display = landcoverLabel ?? t('spotDetail.landcoverUnknown');
  const codeDisplay = landcoverClass ? `CLC ${landcoverClass}` : 'CORINE';

  return (
    <View style={[styles.card, { backgroundColor: colors.CARD }]}>
      <View style={styles.topRow}>
        <View style={styles.iconRow}>
          <Ionicons name="leaf-outline" size={16} color={tintColor} />
          <Text style={[styles.label, { color: colors.TEXT_MUTED }]}>
            {t('spotDetail.landcoverTitle')}
          </Text>
        </View>
        <Text style={[styles.code, { color: colors.TEXT_MUTED }]}>
          {codeDisplay}
        </Text>
      </View>
      <Text style={[styles.value, { color: colors.TEXT_PRIMARY }]}>
        {display}
      </Text>
      <Text style={[styles.attribution, { color: colors.TEXT_MUTED }]}>
        {t('spotDetail.landcoverAttribution')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.MD,
    padding: SPACING.MD,
    gap: SPACING.XS,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  label: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  code: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 15,
  },
  attribution: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: SPACING.XS,
  },
});
