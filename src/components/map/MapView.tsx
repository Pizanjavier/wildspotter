import { useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  MapView as MLMapView,
  Camera,
  ShapeSource,
  VectorSource,
  CircleLayer,
  SymbolLayer,
  FillLayer,
  LineLayer,
  type CameraRef,
  type RegionPayload,
} from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { API_BASE_URL } from '@/constants/config';
import { useMapStore } from '@/stores/map-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useSpotsStore } from '@/stores/spots-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { t } from '@/i18n';
import { getMapStyle } from '@/components/map/map-style';
import type { SpotSummary } from '@/services/api/types';
import { getOvernightLevel } from '@/utils/legal-verdict';
import type { OvernightLevel } from '@/utils/legal-verdict';
import { LegalLegend } from '@/components/map/LegalLegend';

/** Numeric encoding: 0=unknown, 1=allowed, 3=restricted, 4=prohibited */
const OVERNIGHT_LEVEL_NUM: Record<OvernightLevel, number> = {
  unknown: 0,
  allowed: 1,
  restricted: 3,
  prohibited: 4,
};

const SPOTS_SOURCE_ID = 'spots-source';
const SPOTS_LAYER_ID = 'spots-layer';
const SPOTS_GLOW_LAYER_ID = 'spots-glow-layer';

const LEGAL_ZONES_SOURCE_ID = 'legal-zones';
const LEGAL_ZONES_FILL_LAYER_ID = 'legal-zones-fill';
const LEGAL_ZONES_LINE_LAYER_ID = 'legal-zones-line';

const LEGAL_TILE_URL = `${API_BASE_URL}/legal/tiles/{z}/{x}/{y}.pbf`;

type MapViewProps = {
  onMapReady?: () => void;
  spots?: SpotSummary[];
};

const spotsToGeoJSON = (
  spots: SpotSummary[],
  savedIds: Set<string>,
): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: spots.map((spot) => {
    const level = getOvernightLevel(spot.legal_status);
    const levelNum = OVERNIGHT_LEVEL_NUM[level];
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [spot.coordinates.lon, spot.coordinates.lat],
      },
      properties: {
        id: spot.id,
        name: spot.name,
        spot_type: spot.spot_type,
        surface_type: spot.surface_type,
        composite_score: spot.composite_score ?? 0,
        score_label: String(Math.round(spot.composite_score ?? 0)),
        restricted: levelNum,
        overnight_level: levelNum,
        saved: savedIds.has(spot.id) ? 1 : 0,
      },
    };
  }),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeColorExpr: any = [
  'case',
  ['==', ['get', 'restricted'], 4], '#EF4444',
  ['>=', ['get', 'restricted'], 3], '#FBBF24',
  '#FFFFFF',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeWidthExpr: any = [
  'case',
  ['>=', ['get', 'restricted'], 3], 2.5,
  1.5,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeOpacityExpr: any = [
  'case',
  ['>=', ['get', 'restricted'], 3], 0.95,
  0.3,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const badgeTextExpr: any = [
  'case',
  ['==', ['get', 'overnight_level'], 3], '!',
  ['==', ['get', 'overnight_level'], 4], 'X',
  '',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const badgeColorExpr: any = [
  'case',
  ['==', ['get', 'overnight_level'], 3], '#FBBF24',
  ['==', ['get', 'overnight_level'], 4], '#EF4444',
  'rgba(0,0,0,0)',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zoomRadiusExpr: any = [
  'interpolate', ['linear'], ['zoom'],
  8, 10,
  12, 14,
  15, 18,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const glowRadiusExpr: any = [
  'interpolate', ['linear'], ['zoom'],
  8, 13,
  12, 18,
  15, 24,
];

/**
 * Native MapLibre map for iOS/Android.
 * Renders a full-screen dark-themed interactive map with spot markers.
 * Uses @maplibre/maplibre-react-native declarative components.
 */
export const MapView = ({ onMapReady, spots = [] }: MapViewProps) => {
  const cameraRef = useRef<CameraRef>(null);
  const theme = useSettingsStore((s) => s.theme);
  const showLegalZones = useSettingsStore((s) => s.showLegalZones);
  const themeColors = useThemeColors();

  // Data-driven color: green (30+), cyan (10-29), amber (<10).
  // Built from theme colors so map dots match ScoreBadge in both light & dark.
  const scoreColorExpr = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (): any => [
      'case',
      ['>=', ['coalesce', ['get', 'composite_score'], 0], 30], themeColors.SCORE_HIGH,
      ['>=', ['coalesce', ['get', 'composite_score'], 0], 10], themeColors.SCORE_MEDIUM,
      themeColors.SCORE_LOW,
    ],
    [themeColors.SCORE_HIGH, themeColors.SCORE_MEDIUM, themeColors.SCORE_LOW],
  );

  const glowStyle = useMemo(
    () => ({
      circleRadius: glowRadiusExpr,
      circleColor: scoreColorExpr,
      circleOpacity: 0.15,
      circleBlur: 1,
    }),
    [scoreColorExpr],
  );

  const dotStyle = useMemo(
    () => ({
      circleRadius: zoomRadiusExpr,
      circleColor: scoreColorExpr,
      circleOpacity: 0.9,
      circleStrokeWidth: strokeWidthExpr,
      circleStrokeColor: strokeColorExpr,
      circleStrokeOpacity: strokeOpacityExpr,
    }),
    [scoreColorExpr],
  );
  const {
    center,
    zoom,
    updateBounds,
    setCenter,
    setZoom,
    flyToTarget,
    clearFlyTo,
  } = useMapStore();

  const initialCameraSettings = useRef({
    centerCoordinate: [center[0], center[1]] as [number, number],
    zoomLevel: zoom,
  });

  const userLocation = useMapStore((s) => s.userLocation);

  const savedSpots = useSpotsStore((s) => s.savedSpots);
  const savedIds = useMemo(
    () => new Set(savedSpots.map((sp) => sp.id)),
    [savedSpots],
  );

  const spotsGeoJSON = useMemo(() => spotsToGeoJSON(spots, savedIds), [spots, savedIds]);

  const userLocationGeoJSON = useMemo(
    (): GeoJSON.FeatureCollection => ({
      type: 'FeatureCollection',
      features: userLocation
        ? [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: userLocation },
            properties: {},
          }]
        : [],
    }),
    [userLocation],
  );

  const handleRegionDidChange = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) => {
      const { visibleBounds, zoomLevel } = feature.properties;
      const [ne, sw] = visibleBounds;

      updateBounds({
        north: ne[1],
        south: sw[1],
        east: ne[0],
        west: sw[0],
      });

      const coords = feature.geometry.coordinates;
      setCenter([coords[0], coords[1]]);
      setZoom(zoomLevel);
    },
    [updateBounds, setCenter, setZoom],
  );

  const handleDidFinishLoadingMap = useCallback(() => {
    onMapReady?.();
  }, [onMapReady]);

  const handleSpotPress = useCallback(
    (event: { features: GeoJSON.Feature[]; coordinates: { latitude: number; longitude: number } }) => {
      const feature = event.features[0];
      const spotId = feature?.properties?.id as string | undefined;
      if (spotId) {
        router.push(`/spot/${spotId}`);
      }
    },
    [],
  );

  useEffect(() => {
    if (!flyToTarget || !cameraRef.current) return;

    cameraRef.current.setCamera({
      centerCoordinate: [flyToTarget.center[0], flyToTarget.center[1]],
      zoomLevel: flyToTarget.zoom,
      animationDuration: 1500,
      animationMode: 'flyTo',
    });
    clearFlyTo();
  }, [flyToTarget, clearFlyTo]);

  return (
    <View style={styles.container}>
      <MLMapView
        style={styles.map}
        mapStyle={getMapStyle(theme)}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        onRegionDidChange={handleRegionDidChange}
        onDidFinishLoadingMap={handleDidFinishLoadingMap}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={initialCameraSettings.current}
        />

        <VectorSource
          id={LEGAL_ZONES_SOURCE_ID}
          tileUrlTemplates={[LEGAL_TILE_URL]}
          minZoomLevel={4}
          maxZoomLevel={10}
        >
          <FillLayer
            id={LEGAL_ZONES_FILL_LAYER_ID}
            sourceLayerID="legal_zones"
            style={{
              visibility: showLegalZones ? 'visible' : 'none',
              fillColor: '#EF4444',
              fillOpacity: 0.15,
            }}
            belowLayerID={SPOTS_GLOW_LAYER_ID}
          />
          <LineLayer
            id={LEGAL_ZONES_LINE_LAYER_ID}
            sourceLayerID="legal_zones"
            style={{
              visibility: showLegalZones ? 'visible' : 'none',
              lineColor: '#EF4444',
              lineOpacity: 0.5,
              lineWidth: 1,
            }}
            belowLayerID={SPOTS_GLOW_LAYER_ID}
          />
        </VectorSource>

        <ShapeSource id={SPOTS_SOURCE_ID} shape={spotsGeoJSON} onPress={handleSpotPress} hitbox={{ width: 24, height: 24 }}>
          <CircleLayer
            id={SPOTS_GLOW_LAYER_ID}
            style={glowStyle}
          />
          <CircleLayer
            id={SPOTS_LAYER_ID}
            style={dotStyle}
          />
          <SymbolLayer
            id="spots-text-layer"
            style={{
              textField: ['get', 'score_label'],
              textSize: 12,
              textColor: '#FFFFFF',
              textAllowOverlap: true,
            }}
          />
          {/* Legal badge background circle (top-right) */}
          <CircleLayer
            id="spots-badge-bg"
            filter={['>=', ['get', 'overnight_level'], 3]}
            style={{
              circleRadius: 7,
              circleColor: badgeColorExpr,
              circleTranslate: [11, -11],
              circleOpacity: 0.95,
            }}
          />
          <SymbolLayer
            id="spots-badge-layer"
            filter={['>=', ['get', 'overnight_level'], 3]}
            style={{
              textField: badgeTextExpr,
              textSize: 9,
              textColor: '#FFFFFF',
              textAllowOverlap: true,
              textOffset: [0.9, -0.9],
            }}
          />
          {/* Saved spot indicator (top-left white dot) */}
          <CircleLayer
            id="spots-saved-bg"
            filter={['==', ['get', 'saved'], 1]}
            style={{
              circleRadius: 6,
              circleColor: '#FFFFFF',
              circleStrokeWidth: 1.5,
              circleStrokeColor: themeColors.ACCENT,
              circleTranslate: [-10, -10],
            }}
          />
          <SymbolLayer
            id="spots-saved-icon"
            filter={['==', ['get', 'saved'], 1]}
            style={{
              textField: 'S',
              textSize: 7,
              textColor: themeColors.ACCENT,
              textAllowOverlap: true,
              textOffset: [-0.7, -0.7],
            }}
          />
        </ShapeSource>

        <ShapeSource id="user-location-source" shape={userLocationGeoJSON}>
          <CircleLayer
            id="user-location-glow"
            style={{
              circleRadius: 20,
              circleColor: '#4A90D9',
              circleOpacity: 0.2,
              circleBlur: 1,
            }}
          />
          <CircleLayer
            id="user-location-dot"
            style={{
              circleRadius: 8,
              circleColor: '#4A90D9',
              circleOpacity: 0.9,
              circleStrokeWidth: 2,
              circleStrokeColor: '#FFFFFF',
              circleStrokeOpacity: 0.8,
            }}
          />
        </ShapeSource>
      </MLMapView>
      {showLegalZones && (
        <View style={[styles.legalBanner, { backgroundColor: themeColors.CARD_SURFACE }]}>
          <Ionicons name="shield-outline" size={14} color={themeColors.SCORE_LOW} />
          <Text style={[styles.legalBannerText, { color: themeColors.SCORE_LOW }]}>
            {t('legal.legalOverlayBanner')}
          </Text>
        </View>
      )}
      <LegalLegend />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  map: {
    flex: 1,
  },
  legalBanner: {
    position: 'absolute',
    top: SPACING.SM,
    left: SPACING.MD,
    right: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.XS + 2,
    paddingHorizontal: SPACING.MD,
    borderRadius: 8,
    opacity: 0.92,
  },
  legalBannerText: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
