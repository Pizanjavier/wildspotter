import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { LegalStatus } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';

type LegalCheckStatus = 'pass' | 'fail' | 'pending';

type LegalCheckItem = {
  label: string;
  status: LegalCheckStatus;
};

type LegalChecklistProps = {
  legalStatus: LegalStatus | null;
};

const getStatusConfig = (
  status: LegalCheckStatus,
  colors: ThemeColors,
): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (status) {
    case 'pass': return { icon: 'checkmark-circle', color: colors.SCORE_HIGH };
    case 'fail': return { icon: 'close-circle', color: colors.DANGER };
    case 'pending': return { icon: 'ellipse-outline', color: colors.TEXT_SECONDARY };
  }
};

const buildItems = (legalStatus: LegalStatus | null): LegalCheckItem[] => {
  if (!legalStatus) {
    return [
      { label: t('legal.publicForestry'), status: 'pending' },
      { label: t('legal.outsideProtected'), status: 'pending' },
      { label: t('legal.outsideCoastal'), status: 'pending' },
    ];
  }

  return [
    {
      label: legalStatus.natura2000?.zone_name
        ? `Natura 2000 — ${legalStatus.natura2000.zone_name}`
        : `Natura 2000 — ${legalStatus.natura2000?.inside ? 'Inside' : 'Not inside'}`,
      status: legalStatus.natura2000?.inside ? 'fail' : 'pass',
    },
    {
      label: legalStatus.national_park?.park_name
        ? `National Parks — ${legalStatus.national_park.park_name}`
        : `National Parks — ${legalStatus.national_park?.inside ? 'Inside' : 'Not inside'}`,
      status: legalStatus.national_park?.inside ? 'fail' : 'pass',
    },
    {
      label: `Coastal Law — ${legalStatus.coastal_law?.inside ? 'Inside' : 'Not inside'}`,
      status: legalStatus.coastal_law?.inside ? 'fail' : 'pass',
    },
    {
      label: legalStatus.cadastre?.classification
        ? `Cadastre — ${legalStatus.cadastre.classification.replace(/_/g, ' ')}`
        : t('legal.publicForestry'),
      status: legalStatus.cadastre?.private ? 'fail' : 'pass',
    },
  ];
};

export const LegalChecklist = ({
  legalStatus,
}: LegalChecklistProps) => {
  const colors = useThemeColors();
  const items = buildItems(legalStatus);

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: colors.TEXT_PRIMARY }]}>
        {t('spotDetail.legalStatus')}
      </Text>
      <View style={styles.list}>
        {items.map((item) => {
          const config = getStatusConfig(item.status, colors);
          return (
            <View key={item.label} style={styles.item}>
              <Ionicons name={config.icon} size={20} color={config.color} />
              <Text style={[styles.itemText, { color: colors.TEXT_SECONDARY }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export type { LegalCheckItem, LegalCheckStatus };

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  header: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
  },
  list: {
    gap: SPACING.XS + 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM + 2,
    paddingVertical: SPACING.XS + 2,
  },
  itemText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    flex: 1,
  },
});
