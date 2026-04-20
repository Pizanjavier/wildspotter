import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { LegalStatus } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';

type LegalCheckStatus = 'pass' | 'warn' | 'block' | 'pending';

type LegalCheckItem = {
  key: string;
  label: string;
  hint?: string;
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
    case 'pass':
      return { icon: 'checkmark-circle', color: colors.SCORE_HIGH };
    case 'warn':
      return { icon: 'warning', color: colors.SCORE_LOW };
    case 'block':
      return { icon: 'close-circle', color: colors.DANGER };
    case 'pending':
      return { icon: 'ellipse-outline', color: colors.TEXT_SECONDARY };
  }
};

const buildItems = (legalStatus: LegalStatus | null): LegalCheckItem[] => {
  if (!legalStatus) {
    return [
      { key: 'natura2000', label: t('legal.natura2000'), status: 'pending' },
      { key: 'national_park', label: t('legal.nationalParks'), status: 'pending' },
      { key: 'coastal_law', label: t('legal.coastalLaw'), status: 'pending' },
      { key: 'cadastre', label: t('legal.cadastre'), status: 'pending' },
    ];
  }

  const naturaInside = Boolean(legalStatus.natura2000?.inside);
  const parkInside = Boolean(legalStatus.national_park?.inside);
  const coastInside = Boolean(legalStatus.coastal_law?.inside);
  const cadastrePrivate = Boolean(legalStatus.cadastre?.private);
  const cadastreClass = legalStatus.cadastre?.classification;

  return [
    {
      key: 'natura2000',
      label: t('legal.natura2000'),
      hint: naturaInside
        ? t('legal.natura2000InsideHint')
        : t('legal.natura2000OutsideHint'),
      status: naturaInside ? 'warn' : 'pass',
    },
    {
      key: 'national_park',
      label: t('legal.nationalParks'),
      hint: parkInside
        ? t('legal.nationalParksInsideHint')
        : t('legal.nationalParksOutsideHint'),
      status: parkInside ? 'warn' : 'pass',
    },
    {
      key: 'coastal_law',
      label: t('legal.coastalLaw'),
      hint: coastInside
        ? t('legal.coastalLawInsideHint')
        : t('legal.coastalLawOutsideHint'),
      status: coastInside ? 'warn' : 'pass',
    },
    {
      key: 'cadastre',
      label: t('legal.cadastre'),
      hint: cadastrePrivate
        ? t('legal.cadastrePrivateHint')
        : cadastreClass
          ? t('legal.cadastrePublicHint', {
              classification: cadastreClass.replace(/_/g, ' '),
            })
          : undefined,
      status: cadastrePrivate ? 'block' : 'pass',
    },
  ];
};

export const LegalChecklist = ({ legalStatus }: LegalChecklistProps) => {
  const colors = useThemeColors();
  const items = buildItems(legalStatus);

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: colors.TEXT_PRIMARY }]}>
        {t('spotDetail.legalStatus')}
      </Text>
      <Text style={[styles.disclaimer, { color: colors.TEXT_SECONDARY }]}>
        {t('legal.informationalDisclaimer')}
      </Text>
      <View style={styles.list}>
        {items.map((item) => {
          const config = getStatusConfig(item.status, colors);
          return (
            <View key={item.key} style={styles.item}>
              <Ionicons
                name={config.icon}
                size={20}
                color={config.color}
                style={styles.icon}
              />
              <View style={styles.itemBody}>
                <Text
                  style={[styles.itemLabel, { color: colors.TEXT_PRIMARY }]}
                >
                  {item.label}
                </Text>
                {item.hint ? (
                  <Text
                    style={[styles.itemHint, { color: colors.TEXT_SECONDARY }]}
                  >
                    {item.hint}
                  </Text>
                ) : null}
              </View>
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
  disclaimer: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -2,
    marginBottom: SPACING.XS,
  },
  list: {
    gap: SPACING.SM,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM + 2,
    paddingVertical: SPACING.XS,
  },
  icon: {
    marginTop: 1,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 14,
  },
  itemHint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 16,
  },
});
