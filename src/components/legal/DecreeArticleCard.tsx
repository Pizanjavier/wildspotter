import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { DecreeArticle } from '@/services/api/types';
import { t } from '@/i18n';

type DecreeArticleCardProps = {
  article: DecreeArticle;
};

const formatRestriction = (raw: string): string =>
  raw.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const DecreeArticleCard = ({ article }: DecreeArticleCardProps) => {
  const colors = useThemeColors();
  const isParkingAllowed =
    article.legal_distinction === 'estacionamiento_vs_acampada';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.TEXT_PRIMARY }]}>
        {t('legal.article')} {article.number}: {article.title}
      </Text>

      {article.max_stay_hours !== null && (
        <View style={styles.calloutRow}>
          <Ionicons name="time-outline" size={14} color={colors.SCORE_LOW} />
          <Text style={[styles.calloutText, { color: colors.SCORE_LOW }]}>
            {t('legal.maxStayHours')}: {article.max_stay_hours}{t('legal.hours')}
          </Text>
        </View>
      )}

      {article.legal_distinction !== null && (
        <View
          style={[
            styles.distinctionBadge,
            { backgroundColor: `${colors.ACCENT}18` },
          ]}
        >
          <Ionicons
            name="git-compare-outline"
            size={12}
            color={colors.ACCENT}
          />
          <Text style={[styles.smallData, { color: colors.ACCENT }]}>
            {t('legal.legalDistinction')}:{' '}
            {formatRestriction(article.legal_distinction)}
          </Text>
        </View>
      )}

      {isParkingAllowed && (
        <View style={styles.calloutRow}>
          <Ionicons
            name="checkmark-circle-outline"
            size={14}
            color={colors.SCORE_HIGH}
          />
          <Text style={[styles.calloutText, { color: colors.SCORE_HIGH }]}>
            {t('legal.parkingAllowedHint')}
          </Text>
        </View>
      )}

      {article.restrictions.length > 0 && (
        <View style={styles.pillSection}>
          <View style={styles.calloutRow}>
            <Ionicons
              name="warning-outline"
              size={13}
              color={colors.DANGER}
            />
            <Text style={[styles.pillLabel, { color: colors.DANGER }]}>
              {t('legal.restrictions')}
            </Text>
          </View>
          <View style={styles.pillWrap}>
            {article.restrictions.map((r) => (
              <View
                key={r}
                style={[
                  styles.pill,
                  { backgroundColor: `${colors.DANGER}20` },
                ]}
              >
                <Text style={[styles.smallData, { color: colors.DANGER }]}>
                  {formatRestriction(r)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {article.exceptions.length > 0 && (
        <View
          style={[
            styles.exceptionsBox,
            { backgroundColor: `${colors.SCORE_HIGH}10` },
          ]}
        >
          <View style={styles.calloutRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={colors.SCORE_HIGH}
            />
            <Text style={[styles.pillLabel, { color: colors.SCORE_HIGH }]}>
              {t('legal.exceptions')}
            </Text>
          </View>
          {article.exceptions.map((ex) => (
            <Text
              key={ex}
              style={[styles.exceptionText, { color: colors.SCORE_HIGH }]}
            >
              {formatRestriction(ex)}
            </Text>
          ))}
        </View>
      )}

      <Text style={[styles.verbatim, { color: colors.TEXT_MUTED }]}>
        &ldquo;{article.text_verbatim}&rdquo;
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  title: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 12,
    marginBottom: 2,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calloutText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 11,
  },
  distinctionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  smallData: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 10,
  },
  pillSection: {
    gap: 4,
  },
  pillLabel: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 11,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingLeft: 18,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  exceptionsBox: {
    gap: 3,
    padding: 6,
    borderRadius: 6,
  },
  exceptionText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
    paddingLeft: 18,
  },
  verbatim: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 2,
  },
});
