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
import { SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSpotsStore } from '@/stores/spots-store';
import { ScoreBadge } from '@/components/spots/ScoreBadge';
import { ActionButtons } from '@/components/spots/ActionButtons';
import { SpotDetailHeader } from '@/components/spots/SpotDetailHeader';
import { LegalChecklist } from '@/components/legal/LegalChecklist';
import { MetricsRow } from '@/components/spots/MetricsRow';
import { AiAnalysis } from '@/components/spots/AiAnalysis';
import { ContextAnalysis } from '@/components/spots/ContextAnalysis';
import { ScoreBreakdown } from '@/components/spots/ScoreBreakdown';
import { ReportModal } from '@/components/spots/ReportModal';
import { getSpotDetail, ApiError, buildSatelliteUrl } from '@/services/api';
import type { SpotDetail } from '@/services/api/types';
import { t } from '@/i18n';
import { trackEvent } from '@/services/analytics';

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

export const SpotDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const [spot, setSpot] = useState<SpotDetail | null>(null);
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

  useEffect(() => {
    if (!id) return;
    activeIdRef.current = id;
    if (inFlightIdRef.current === id) return;
    trackEvent('spot_viewed', { spot_id: id });
    inFlightIdRef.current = id;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getSpotDetail(id);
        if (activeIdRef.current !== id) return;
        setSpot(detail);
      } catch (err: unknown) {
        if (activeIdRef.current !== id) return;
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
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
  const subtitle = [
    spot.spot_type?.replace('_', ' '),
    spot.surface_type !== 'unknown' ? capitalize(spot.surface_type) : null,
  ]
    .filter(Boolean)
    .join(' \u00B7 ');

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <SpotDetailHeader
        onBack={() => router.back()}
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
              {spot.name || t('spots.unnamedSpot')}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <ScoreBadge score={score} variant="circle" size="lg" />
        </View>

        <MetricsRow
          surface={capitalize(spot.surface_type)}
          slope={spot.slope_pct !== null ? `${spot.slope_pct.toFixed(1)}%` : null}
          elevation={
            spot.elevation !== null ? `${Math.round(spot.elevation)}m` : null
          }
        />

        <LegalChecklist legalStatus={spot.legal_status} />

        {spot.ai_details && (
          <AiAnalysis
            aiScore={spot.ai_score}
            aiDetails={spot.ai_details}
          />
        )}

        {spot.context_details && (
          <ContextAnalysis
            contextScore={spot.context_score}
            contextDetails={spot.context_details}
          />
        )}

        <ScoreBreakdown
          terrainScore={spot.terrain_score}
          aiScore={spot.ai_score}
          contextScore={spot.context_score}
          compositeScore={spot.composite_score}
        />

        <ActionButtons
          lat={spot.coordinates.lat}
          lon={spot.coordinates.lon}
        />

        <Pressable style={styles.reportLink} onPress={openReport}>
          <Ionicons name="flag-outline" size={16} color={colors.TEXT_MUTED} />
          <Text style={[styles.reportText, { color: colors.TEXT_MUTED }]}>
            {t('spotDetail.report')}
          </Text>
        </Pressable>
      </ScrollView>

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
    paddingBottom: SPACING.XL * 2,
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
