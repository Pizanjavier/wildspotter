import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSpotsStore } from '@/stores/spots-store';
import { ScoreBadge } from '@/components/spots/ScoreBadge';
import { SpotDetailHeader } from '@/components/spots/SpotDetailHeader';
import { LegalSituation } from '@/components/legal/LegalSituation';
import { LandcoverCard } from '@/components/spots/LandcoverCard';
import { AiAnalysis } from '@/components/spots/AiAnalysis';
import { ContextAnalysis } from '@/components/spots/ContextAnalysis';
import { ScoreBreakdown } from '@/components/spots/ScoreBreakdown';
import { SpotHighlights } from '@/components/spots/SpotHighlights';
import { ExpandableSection } from '@/components/spots/ExpandableSection';
import { ReportModal } from '@/components/spots/ReportModal';
import { getSpotDetail, ApiError, buildSatelliteUrl } from '@/services/api';
import { getLegalDocuments } from '@/services/api/spots';
import { openNavigate, openInspect } from '@/services/navigation';
import type { SpotDetail, LegalDocument } from '@/services/api/types';
import { t } from '@/i18n';
import { getSpotDisplayName, getTranslatedSurface } from '@/utils/spot-display-name';
import { trackEvent } from '@/services/analytics';


export const SpotDetailScreen = () => {
  const { id, origin } = useLocalSearchParams<{ id: string; origin?: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [legalDocs, setLegalDocs] = useState<LegalDocument[]>([]);
  const [legalDocsLoading, setLegalDocsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportVisible, setReportVisible] = useState(false);
  const isSaved = useSpotsStore((s) => s.isSaved(id ?? ''));
  const addSpot = useSpotsStore((s) => s.addSpot);
  const removeSpot = useSpotsStore((s) => s.removeSpot);
  const openReport = useCallback(() => setReportVisible(true), []);
  const closeReport = useCallback(() => setReportVisible(false), []);

  const inFlightIdRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const handleBack = useCallback(() => {
    if (origin === 'spots') {
      router.navigate('/(tabs)/spots');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/map');
    }
  }, [origin, router]);

  useEffect(() => {
    if (!id) return;
    activeIdRef.current = id;
    if (inFlightIdRef.current === id) return;
    trackEvent('spot_viewed', { spot_id: id });
    inFlightIdRef.current = id;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      setLegalDocsLoading(true);
      try {
        const detail = await getSpotDetail(id);
        if (activeIdRef.current !== id) return;
        setSpot(detail);
        getLegalDocuments(detail.coordinates.lat, detail.coordinates.lon)
          .then((docs) => {
            if (activeIdRef.current === id) setLegalDocs(docs);
          })
          .catch(() => {})
          .finally(() => {
            if (activeIdRef.current === id) setLegalDocsLoading(false);
          });
      } catch (err: unknown) {
        if (activeIdRef.current !== id) return;
        setLegalDocsLoading(false);
        if (
          err instanceof ApiError &&
          (err.status === 400 || err.status === 404)
        ) {
          setError(t('spotDetail.notFound'));
        } else {
          const message =
            err instanceof Error ? err.message : 'Failed to load spot';
          setError(message);
        }
      } finally {
        if (inFlightIdRef.current === id) {
          inFlightIdRef.current = null;
        }
        if (activeIdRef.current === id) {
          setLoading(false);
        }
      }
    };
    void fetchDetail();
    return () => {
      activeIdRef.current = null;
    };
  }, [id]);

  const handleToggleSave = () => {
    if (!spot || !id) return;
    if (isSaved) removeSpot(id);
    else addSpot(spot);
  };

  const handleInspect = () => {
    if (!spot) return;
    trackEvent('spot_inspected', { lat: spot.coordinates.lat, lon: spot.coordinates.lon });
    openInspect(spot.coordinates.lat, spot.coordinates.lon);
  };

  const handleNavigate = () => {
    if (!spot) return;
    trackEvent('spot_navigated', { lat: spot.coordinates.lat, lon: spot.coordinates.lon });
    openNavigate(spot.coordinates.lat, spot.coordinates.lon);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.ACCENT} />
        </Pressable>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.ACCENT} />
          <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>
            {t('spotDetail.loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !spot) {
    return (
      <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.ACCENT} />
        </Pressable>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>
            {error ?? t('spotDetail.notFound')}
          </Text>
        </View>
      </View>
    );
  }

  const score = spot.composite_score ?? null;
  const satelliteImageUrl = spot.satellite_image_path
    ? buildSatelliteUrl(spot.satellite_image_path)
    : null;
  const locationParts = [spot.municipality, spot.province].filter(Boolean);
  const locationLabel = locationParts.length > 0
    ? locationParts.join(', ')
    : null;
  const subtitle = [
    locationLabel,
    getTranslatedSurface(spot.surface_type),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <SpotDetailHeader
        onBack={handleBack}
        onSave={handleToggleSave}
        isSaved={isSaved}
        aiScore={spot.ai_score}
        aiDetails={spot.ai_details}
        satelliteImagePath={satelliteImageUrl}
        status={spot.status}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={[styles.spotName, { color: colors.TEXT_PRIMARY }]}>
              {getSpotDisplayName(spot)}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <ScoreBadge score={score} variant="circle" size="lg" />
        </View>

        <LegalSituation legalStatus={spot.legal_status} documents={legalDocs} loading={legalDocsLoading} />

        <SpotHighlights
          contextDetails={spot.context_details}
          surface={getTranslatedSurface(spot.surface_type)}
          slopePct={spot.slope_pct}
          elevation={spot.elevation}
        />

        <ExpandableSection icon="eye-outline" title={t('deepDive.satelliteAnalysis')}>
          <AiAnalysis aiScore={spot.ai_score} aiDetails={spot.ai_details} />
        </ExpandableSection>

        <ExpandableSection icon="analytics-outline" title={t('deepDive.contextBreakdown')}>
          <ContextAnalysis contextScore={spot.context_score} contextDetails={spot.context_details} />
        </ExpandableSection>

        <ExpandableSection icon="speedometer-outline" title={t('deepDive.scoreFormula')}>
          <ScoreBreakdown
            terrainScore={spot.terrain_score}
            aiScore={spot.ai_score}
            contextScore={spot.context_score}
            compositeScore={spot.composite_score}
            wildBonus={spot.context_details?.wild_bonus ?? null}
            landcoverPenalty={spot.context_details?.landcover_penalty ?? null}
          />
        </ExpandableSection>

        <ExpandableSection icon="leaf-outline" title={t('deepDive.landCover')}>
          <LandcoverCard
            landcoverClass={spot.landcover_class}
            landcoverLabel={spot.landcover_label}
          />
        </ExpandableSection>

        <Pressable style={styles.reportLink} onPress={openReport}>
          <Ionicons name="flag-outline" size={16} color={colors.TEXT_MUTED} />
          <Text style={[styles.reportText, { color: colors.TEXT_MUTED }]}>
            {t('spotDetail.report')}
          </Text>
        </Pressable>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.BACKGROUND,
            borderTopColor: colors.BORDER,
            paddingBottom: Math.max(insets.bottom, SPACING.MD),
          },
        ]}
      >
        <Pressable
          onPress={handleToggleSave}
          style={[
            styles.iconBtn,
            isSaved
              ? { backgroundColor: `${colors.ACCENT}15`, borderColor: colors.ACCENT, borderWidth: 1 }
              : { backgroundColor: 'transparent', borderColor: colors.BORDER, borderWidth: 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? t('spotDetail.saved') : t('spotDetail.save')}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? colors.ACCENT : colors.TEXT_PRIMARY}
          />
        </Pressable>

        <Pressable
          onPress={handleInspect}
          style={[
            styles.actionBtn,
            { backgroundColor: 'transparent', borderColor: colors.BORDER, borderWidth: 1 },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="grid-outline" size={18} color={colors.TEXT_PRIMARY} />
          <Text style={[styles.actionBtnText, { color: colors.TEXT_PRIMARY }]} numberOfLines={1}>
            {t('spotDetail.inspect')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNavigate}
          style={[
            styles.actionBtn,
            { backgroundColor: colors.ACCENT, borderWidth: 0 },
          ]}
          accessibilityRole="button"
        >
          <Ionicons name="navigate" size={18} color={colors.BACKGROUND} />
          <Text style={[styles.actionBtnText, { color: colors.BACKGROUND }]} numberOfLines={1}>
            {t('spotDetail.navigate')}
          </Text>
        </Pressable>
      </View>

      <ReportModal
        visible={reportVisible}
        spotId={id ?? ''}
        onClose={closeReport}
      />
    </View>
  );
};

export default SpotDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: SPACING.LG,
    gap: SPACING.LG,
    paddingBottom: SPACING.XL * 3,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 13,
  },
  backButton: { padding: SPACING.MD },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  loadingText: {
    fontFamily: FONT_FAMILIES.BODY_MEDIUM,
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.MD,
  },
  titleCol: { flex: 1, gap: 4 },
  spotName: {
    fontFamily: FONT_FAMILIES.BODY_BOLD,
    fontSize: 24,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 14,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.SM,
  },
  reportText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
  },
});
