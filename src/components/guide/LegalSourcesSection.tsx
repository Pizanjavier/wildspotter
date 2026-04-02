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
    description: 'EU network of protected natural areas (LIC/ZEC and ZEPA zones). Local PostGIS data from MITECO shapefiles.',
    endpoint: 'PostGIS · natura2000 (1,636 polygons)',
  },
  {
    icon: 'earth-outline',
    label: 'National Parks',
    description: 'Parques Nacionales and Espacios Naturales Protegidos — boundaries and peripheral protection zones.',
    endpoint: 'PostGIS · national_parks (1,788 polygons)',
  },
  {
    icon: 'water-outline',
    label: 'Coastal Law (DPMT)',
    description: 'Dominio Público Marítimo Terrestre — DPMT boundary, Servidumbre de Protección, and Terrenos Incluidos (minus Núcleos Excluidos).',
    endpoint: 'PostGIS · dpmt + servidumbre_proteccion',
  },
  {
    icon: 'document-text-outline',
    label: 'Cadastre (Land Parcels)',
    description: 'Sede Electrónica del Catastro — land classification via REST API (rustic, urban, registered).',
    endpoint: 'ovc.catastro.meh.es · Consulta_RCCOOR',
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
        <Text style={[styles.attribution, { color: colors.TEXT_MUTED }]}>
          {t('guide.legalAttribution')}
        </Text>
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
  attribution: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: SPACING.SM,
  },
});
