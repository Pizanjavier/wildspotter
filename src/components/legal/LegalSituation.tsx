import { useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ConfidenceTierBadge } from '@/components/legal/ConfidenceTierBadge';
import { DecreeArticleCard } from '@/components/legal/DecreeArticleCard';
import { CCAA_DATA } from '@/constants/ccaa-data';
import type { LegalStatus, LegalDocument } from '@/services/api/types';
import type { ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';

type LegalSituationProps = {
  legalStatus: LegalStatus | null;
  documents: LegalDocument[];
  loading?: boolean;
};

const getCcaaDisplayName = (id: string | null): string | null => {
  if (!id) return null;
  const entry = CCAA_DATA.find((c) => c.id === id);
  return entry?.name ?? id.replace(/_/g, ' ');
};

type Severity = 'clear' | 'info' | 'warn' | 'block';

type UnifiedItem = {
  key: string;
  label: string;
  hint?: string;
  severity: Severity;
  expandable?: boolean;
  document?: LegalDocument;
};

const severityOrder: Record<Severity, number> = {
  block: 0,
  warn: 1,
  info: 2,
  clear: 3,
};

const severityConfig = (
  severity: Severity,
  colors: ThemeColors,
): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (severity) {
    case 'clear':
      return { icon: 'checkmark-circle', color: colors.SCORE_HIGH };
    case 'info':
      return { icon: 'information-circle', color: colors.SCORE_MEDIUM };
    case 'warn':
      return { icon: 'warning', color: colors.SCORE_LOW };
    case 'block':
      return { icon: 'close-circle', color: colors.DANGER };
  }
};

const buildStaticItems = (legalStatus: LegalStatus | null): UnifiedItem[] => {
  if (!legalStatus) return [];

  const naturaInside = Boolean(legalStatus.natura2000?.inside);
  const parkInside = Boolean(legalStatus.national_park?.inside);
  const coastInside = Boolean(legalStatus.coastal_law?.inside);
  const cadastrePrivate = Boolean(legalStatus.cadastre?.private);
  const cadastreClass = legalStatus.cadastre?.classification;

  return [
    {
      key: 'natura2000',
      label: t('legal.natura2000'),
      hint: naturaInside ? t('legal.natura2000InsideHint') : t('legal.natura2000OutsideHint'),
      severity: naturaInside ? 'warn' : 'clear',
    },
    {
      key: 'national_park',
      label: t('legal.nationalParks'),
      hint: parkInside ? t('legal.nationalParksInsideHint') : t('legal.nationalParksOutsideHint'),
      severity: parkInside ? 'warn' : 'clear',
    },
    {
      key: 'coastal_law',
      label: t('legal.coastalLaw'),
      hint: coastInside ? t('legal.coastalLawInsideHint') : t('legal.coastalLawOutsideHint'),
      severity: coastInside ? 'warn' : 'clear',
    },
    {
      key: 'cadastre',
      label: t('legal.cadastre'),
      hint: cadastrePrivate
        ? t('legal.cadastrePrivateHint')
        : cadastreClass
          ? t('legal.cadastrePublicHint', { classification: cadastreClass.replace(/_/g, ' ') })
          : undefined,
      severity: cadastrePrivate ? 'block' : 'clear',
    },
  ];
};

const docSeverity = (doc: LegalDocument): Severity => {
  const type = doc.restriction_type;
  if (type === 'fire_ban') return 'block';
  if (type === 'camping_ban' || type === 'overnight_ban' || type === 'parking_ban') return 'warn';
  return 'info';
};

const buildDocItems = (documents: LegalDocument[]): UnifiedItem[] =>
  documents.map((doc) => {
    const location = [doc.affected_municipality, doc.affected_province, getCcaaDisplayName(doc.affected_ccaa)]
      .filter(Boolean)
      .join(', ');
    return {
      key: `doc-${doc.id}`,
      label: doc.title,
      hint: location || undefined,
      severity: docSeverity(doc),
      expandable: true,
      document: doc,
    };
  });

const countRestrictions = (items: UnifiedItem[]): number =>
  items.filter((i) => i.severity === 'warn' || i.severity === 'block').length;

type OvernightVerdict = {
  level: 'allowed' | 'tolerated' | 'restricted' | 'prohibited' | 'unknown';
  maxStayHours: number | null;
  hasProtectedZone: boolean;
  hasFireBan: boolean;
  hasCampingBan: boolean;
  isPrivateLand: boolean;
};

const analyzeOvernight = (
  legalStatus: LegalStatus | null,
  documents: LegalDocument[],
): OvernightVerdict => {
  const isInsidePark = Boolean(legalStatus?.national_park?.inside);
  const isInsideNatura = Boolean(legalStatus?.natura2000?.inside);
  const hasProtectedZone = isInsidePark || isInsideNatura;
  const isCoastal = Boolean(legalStatus?.coastal_law?.inside);
  const isPrivateLand = Boolean(legalStatus?.cadastre?.private);
  
  const hasFireBan = documents.some((d) => d.restriction_type === 'fire_ban');
  const hasCampingBan = documents.some(
    (d) => 
      d.restriction_type === 'camping_ban' || 
      d.restriction_type === 'overnight_ban' ||
      d.restriction_type === 'parking_ban'
  );

  let maxStayHours: number | null = null;
  for (const doc of documents) {
    if (!doc.decree_articles) continue;
    for (const article of doc.decree_articles) {
      if (article.max_stay_hours !== null) {
        // Take the MINIMUM stay hours if multiple decrees apply
        if (maxStayHours === null || article.max_stay_hours < maxStayHours) {
          maxStayHours = article.max_stay_hours;
        }
      }
    }
  }

  const base = { hasProtectedZone, hasFireBan, hasCampingBan, isPrivateLand };
  
  // Hierarchy of restrictions (first match wins)
  if (hasFireBan) return { level: 'prohibited', maxStayHours: null, ...base };
  if (isPrivateLand) return { level: 'prohibited', maxStayHours: null, ...base };
  if (maxStayHours === 0) return { level: 'prohibited', maxStayHours: null, ...base };
  if (hasCampingBan) return { level: 'restricted', maxStayHours: null, ...base };
  if (isInsidePark) return { level: 'restricted', maxStayHours: null, ...base };
  if (isCoastal) return { level: 'restricted', maxStayHours: null, ...base };
  if (isInsideNatura) return { level: 'restricted', maxStayHours: null, ...base };
  if (maxStayHours !== null) return { level: 'tolerated', maxStayHours, ...base };
  
  if (documents.length === 0 && !legalStatus) return { level: 'unknown', maxStayHours: null, ...base };
  return { level: 'allowed', maxStayHours: null, ...base };
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

export const LegalSituation = ({ legalStatus, documents, loading }: LegalSituationProps) => {
  const colors = useThemeColors();
  const [sectionOpen, setSectionOpen] = useState(false);
  const [expandedDocKey, setExpandedDocKey] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.container}>
        <View
          style={[styles.verdictRow, { backgroundColor: colors.CARD_SURFACE, borderColor: colors.BORDER }]}
        >
          <ActivityIndicator size="small" color={colors.TEXT_MUTED} />
          <View style={styles.verdictBody}>
            <Text style={[styles.verdictTitle, { color: colors.TEXT_MUTED }]}>
              {t('legal.pendingCheck')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const staticItems = buildStaticItems(legalStatus);
  const docItems = buildDocItems(documents);
  const allItems = [...staticItems, ...docItems].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  const restrictionCount = countRestrictions(allItems);
  const verdict = analyzeOvernight(legalStatus, documents);

  const verdictColor =
    verdict.level === 'allowed'
      ? colors.SCORE_HIGH
      : verdict.level === 'tolerated'
        ? colors.SCORE_MEDIUM
        : verdict.level === 'prohibited'
          ? colors.DANGER
          : verdict.level === 'restricted'
            ? colors.SCORE_LOW
            : colors.TEXT_SECONDARY;

  const verdictIcon: keyof typeof Ionicons.glyphMap =
    verdict.level === 'allowed'
      ? 'checkmark-circle'
      : verdict.level === 'tolerated'
        ? 'time-outline'
        : verdict.level === 'prohibited'
          ? 'close-circle'
          : verdict.level === 'restricted'
            ? 'warning'
            : 'help-circle-outline';

  const verdictTitle = t(`legal.overnight_${verdict.level}`);
  const verdictHint = buildVerdictHint(verdict);

  return (
    <View style={styles.container}>
      <View
        style={[styles.verdictRow, { backgroundColor: colors.CARD_SURFACE, borderColor: colors.BORDER }]}
      >
        <Ionicons name={verdictIcon} size={22} color={verdictColor} />
        <View style={styles.verdictBody}>
          <Text style={[styles.verdictTitle, { color: verdictColor }]}>
            {verdictTitle}
          </Text>
          {verdictHint && (
            <Text style={[styles.verdictHint, { color: colors.TEXT_SECONDARY }]} numberOfLines={2}>
              {verdictHint}
            </Text>
          )}
          <Text style={[styles.verdictDisclaimer, { color: colors.TEXT_MUTED }]}>
            {t('legal.verdictDisclaimer')}
          </Text>
        </View>
        {restrictionCount > 0 && (
          <View style={[styles.countPill, { backgroundColor: `${verdictColor}20` }]}>
            <Text style={[styles.countText, { color: verdictColor }]}>
              {restrictionCount}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        style={styles.expandToggle}
        onPress={() => setSectionOpen(!sectionOpen)}
      >
        <Ionicons name="document-text-outline" size={14} color={colors.ACCENT} />
        <Text style={[styles.expandToggleText, { color: colors.ACCENT }]}>
          {t('legal.viewDetails')}
        </Text>
        <Ionicons
          name={sectionOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.ACCENT}
        />
      </Pressable>

      {sectionOpen && (
        <View style={styles.detailsContainer}>
          <View style={styles.list}>
            {allItems.map((item) => {
              const config = severityConfig(item.severity, colors);
              const isDocExpanded = expandedDocKey === item.key;
              const doc = item.document;

              return (
                <View key={item.key}>
                  <Pressable
                    style={styles.item}
                    onPress={item.expandable ? () => setExpandedDocKey(isDocExpanded ? null : item.key) : undefined}
                  >
                    <Ionicons
                      name={config.icon}
                      size={16}
                      color={config.color}
                      style={styles.statusIcon}
                    />
                    <View style={styles.itemBody}>
                      <Text
                        style={[styles.itemLabel, { color: colors.TEXT_PRIMARY }]}
                        numberOfLines={isDocExpanded ? undefined : 2}
                      >
                        {item.label}
                      </Text>
                      {item.hint ? (
                        <Text style={[styles.itemHint, { color: colors.TEXT_SECONDARY }]}>
                          {item.hint}
                        </Text>
                      ) : null}
                      {doc && !isDocExpanded && doc.confidence_tier && (
                        <View style={styles.inlineMeta}>
                          <ConfidenceTierBadge tier={doc.confidence_tier} compact />
                        </View>
                      )}
                    </View>
                    {item.expandable && (
                      <Ionicons
                        name={isDocExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.TEXT_MUTED}
                      />
                    )}
                  </Pressable>

                  {isDocExpanded && doc && (
                    <View style={[styles.expandedCard, { backgroundColor: colors.CARD_SURFACE, borderColor: colors.BORDER }]}>
                      <View style={styles.expandedMeta}>
                        <ConfidenceTierBadge tier={doc.confidence_tier} />
                        {doc.seasonal && (
                          <View style={styles.seasonalRow}>
                            <Ionicons name="calendar-outline" size={13} color={colors.SCORE_LOW} />
                            <Text style={[styles.smallText, { color: colors.SCORE_LOW }]}>
                              {formatSeasonalRange(doc.season_start_month, doc.season_end_month)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {doc.decree_ref && (
                        <Text style={[styles.decreeRef, { color: colors.TEXT_PRIMARY }]}>
                          {doc.decree_ref}
                        </Text>
                      )}

                      {doc.effective_from && (
                        <Text style={[styles.smallText, { color: colors.TEXT_MUTED }]}>
                          {t('legal.effectiveFrom', { date: formatDate(doc.effective_from) ?? '' })}
                        </Text>
                      )}

                      <View style={styles.linksRow}>
                        {doc.source_url && (
                          <Pressable
                            style={styles.sourceLink}
                            onPress={() => { if (doc.source_url) Linking.openURL(doc.source_url); }}
                          >
                            <Ionicons name="open-outline" size={12} color={colors.ACCENT} />
                            <Text style={[styles.sourceLinkText, { color: colors.ACCENT }]}>
                              {t('legal.viewSource')}
                            </Text>
                          </Pressable>
                        )}
                        {doc.decree_ref && (
                          <Pressable
                            style={styles.sourceLink}
                            onPress={() => { if (doc.decree_ref) Linking.openURL(`https://www.boe.es/buscar/act.php?q=${encodeURIComponent(doc.decree_ref)}`); }}
                          >
                            <Ionicons name="search-outline" size={12} color={colors.ACCENT} />
                            <Text style={[styles.sourceLinkText, { color: colors.ACCENT }]}>
                              {t('legal.searchBoe')}
                            </Text>
                          </Pressable>
                        )}
                      </View>

                      {doc.decree_articles && doc.decree_articles.length > 0 && (
                        <View style={[styles.articlesContainer, { borderTopColor: colors.BORDER }]}>
                          <Text style={[styles.articlesLabel, { color: colors.TEXT_SECONDARY }]}>
                            {t('legal.parsedRules')}
                          </Text>
                          {doc.decree_articles.map((article, idx) => (
                            <DecreeArticleCard key={article.number ?? `art-${idx}`} article={article} />
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={[styles.disclaimer, { borderColor: colors.BORDER }]}>
            <Ionicons name="shield-outline" size={13} color={colors.TEXT_MUTED} />
            <Text style={[styles.disclaimerText, { color: colors.TEXT_MUTED }]}>
              {t('legal.informationalDisclaimer')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const buildVerdictHint = (verdict: OvernightVerdict): string | null => {
  const parts: string[] = [];

  if (verdict.hasFireBan) {
    parts.push(t('legal.hintFireBan'));
  } else if (verdict.isPrivateLand) {
    parts.push(t('legal.hintPrivateLand'));
  } else if (verdict.hasProtectedZone) {
    parts.push(t('legal.hintProtectedZone'));
    if (verdict.maxStayHours !== null) {
      parts.push(t('legal.hintParkOverrides', { hours: String(verdict.maxStayHours) }));
    }
  } else if (verdict.level === 'tolerated' && verdict.maxStayHours !== null) {
    parts.push(t('legal.hintMaxStay', { hours: String(verdict.maxStayHours) }));
    parts.push(t('legal.hintNoExternalElements'));
  } else if (verdict.level === 'allowed') {
    parts.push(t('legal.hintNoRestrictions'));
  } else if (verdict.level === 'unknown') {
    parts.push(t('legal.hintUnknown'));
  }

  return parts.length > 0 ? parts.join('. ') : null;
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM + 2,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
  },
  verdictBody: {
    flex: 1,
    gap: 3,
  },
  verdictTitle: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 14,
  },
  verdictHint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 16,
  },
  verdictDisclaimer: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: SPACING.XS,
  },
  expandToggleText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
  },
  countPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
  },
  detailsContainer: {
    gap: SPACING.MD,
  },
  list: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  statusIcon: {
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 13,
    lineHeight: 18,
  },
  itemHint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 12,
    lineHeight: 16,
  },
  inlineMeta: {
    marginTop: 2,
  },
  expandedCard: {
    marginLeft: 26,
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.MD,
    gap: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  expandedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    flexWrap: 'wrap',
  },
  seasonalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
  },
  decreeRef: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.MD,
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
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingTop: SPACING.XS,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 11,
    lineHeight: 16,
  },
});
