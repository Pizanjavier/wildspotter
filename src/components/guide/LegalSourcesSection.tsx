import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';

type SourceConfig = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  endpoint: string;
};

const SOURCES: SourceConfig[] = [
  {
    icon: 'leaf-outline',
    label: 'Red Natura 2000',
    description: 'EU network of protected natural areas (LIC/ZEC and ZEPA zones). Data from MITECO.',
    endpoint: 'wms.mapama.gob.es/sig/Biodiversidad',
  },
  {
    icon: 'earth-outline',
    label: 'National Parks',
    description: 'Parques Nacionales — boundaries and peripheral protection zones. Served by OAPN.',
    endpoint: 'sigred.oapn.es/geoserverOAPN',
  },
  {
    icon: 'water-outline',
    label: 'Coastal Law (DPMT)',
    description: 'Dominio Publico Maritimo Terrestre — public maritime-terrestrial domain.',
    endpoint: 'wms.mapama.gob.es/sig/Costas/DPMT',
  },
  {
    icon: 'document-text-outline',
    label: 'Cadastre (Land Parcels)',
    description: 'Sede Electronica del Catastro — INSPIRE cadastral parcel layer.',
    endpoint: 'ovc.catastro.meh.es/Cartografia',
  },
];

export const LegalSourcesSection = () => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.intro, { color: colors.TEXT_SECONDARY }]}>
        {t('guide.legalSourcesBody')}
      </Text>
      {SOURCES.map((src) => (
        <View
          key={src.label}
          style={[styles.card, { backgroundColor: colors.CARD_ELEVATED ?? colors.BACKGROUND }]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name={src.icon} size={16} color={colors.ACCENT} />
            <Text style={[styles.cardLabel, { color: colors.TEXT_PRIMARY }]}>
              {src.label}
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.TEXT_SECONDARY }]}>
            {src.description}
          </Text>
          <Text style={[styles.cardEndpoint, { color: colors.TEXT_MUTED }]}>
            {src.endpoint}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  intro: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    borderRadius: RADIUS.SM,
    padding: SPACING.SM,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  cardLabel: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 13,
  },
  cardDesc: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 17,
    paddingLeft: SPACING.XS + 16,
  },
  cardEndpoint: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    paddingLeft: SPACING.XS + 16,
  },
});
