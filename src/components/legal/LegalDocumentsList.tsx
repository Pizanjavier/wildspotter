import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ConfidenceTierBadge } from '@/components/legal/ConfidenceTierBadge';
import { DecreeArticleCard } from '@/components/legal/DecreeArticleCard';
import type { LegalDocument } from '@/services/api/types';
import { t } from '@/i18n';

type LegalDocumentsListProps = {
  documents: LegalDocument[];
};

const RESTRICTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  tourism_decree: 'document-text-outline',
  environmental: 'leaf-outline',
  camping_ban: 'close-circle-outline',
  seasonal_restriction: 'calendar-outline',
  municipal_ordinance: 'business-outline',
};

const formatDate = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatSeasonalRange = (start: number | null, end: number | null): string | null => {
  if (start === null || end === null) return null;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[start - 1]} – ${months[end - 1]}`;
};

export const LegalDocumentsList = ({ documents }: LegalDocumentsListProps) => {
  const colors = useThemeColors();

  if (documents.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: colors.TEXT_PRIMARY }]}>
        {t('legal.dynamicDocsTitle')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
        {t('legal.dynamicDocsSubtitle')}
      </Text>
      <View style={styles.list}>
        {documents.map((doc) => {
          const icon = RESTRICTION_ICONS[doc.restriction_type] ?? 'alert-circle-outline';
          const location = [doc.affected_municipality, doc.affected_province, doc.affected_ccaa]
            .filter(Boolean)
            .join(', ');
          const seasonal = doc.seasonal
            ? formatSeasonalRange(doc.season_start_month, doc.season_end_month)
            : null;

          return (
            <View
              key={doc.id}
              style={[styles.card, { backgroundColor: colors.CARD_SURFACE, borderColor: colors.BORDER }]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name={icon} size={18} color={colors.ACCENT} />
                <Text
                  style={[styles.cardTitle, { color: colors.TEXT_PRIMARY }]}
                  numberOfLines={2}
                >
                  {doc.title}
                </Text>
              </View>

              <View style={styles.meta}>
                <ConfidenceTierBadge tier={doc.confidence_tier} compact />
                {location ? (
                  <Text style={[styles.metaText, { color: colors.TEXT_SECONDARY }]}>
                    {location}
                  </Text>
                ) : null}
              </View>

              {seasonal && (
                <View style={styles.seasonalRow}>
                  <Ionicons name="calendar-outline" size={13} color={colors.SCORE_LOW} />
                  <Text style={[styles.seasonalText, { color: colors.SCORE_LOW }]}>
                    {seasonal}
                  </Text>
                </View>
              )}

              {doc.effective_from && (
                <Text style={[styles.dateText, { color: colors.TEXT_MUTED }]}>
                  {t('legal.effectiveFrom', { date: formatDate(doc.effective_from) ?? '' })}
                </Text>
              )}

              {doc.source_url && (
                <Pressable
                  style={styles.sourceLink}
                  onPress={() => Linking.openURL(doc.source_url!)}
                >
                  <Ionicons name="open-outline" size={12} color={colors.ACCENT} />
                  <Text style={[styles.sourceLinkText, { color: colors.ACCENT }]}>
                    {t('legal.viewSource')}
                  </Text>
                </Pressable>
              )}

              {doc.decree_articles && doc.decree_articles.length > 0 && (
                <View style={[styles.articlesContainer, { borderTopColor: colors.BORDER }]}>
                  <Text style={[styles.articlesLabel, { color: colors.TEXT_SECONDARY }]}>
                    {t('legal.parsedRules')}
                  </Text>
                  {doc.decree_articles.map((article, idx) => (
                    <DecreeArticleCard key={idx} article={article} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  header: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -2,
  },
  list: {
    gap: SPACING.SM,
  },
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.MD,
    gap: SPACING.SM,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
  },
  seasonalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonalText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
  },
  dateText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  sourceLinkText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 11,
  },
  articlesContainer: {
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    gap: SPACING.MD,
  },
  articlesLabel: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
