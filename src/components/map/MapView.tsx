import { useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
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
import { COLORS } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/config';
import { useMapStore } from '@/stores/map-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getMapStyle } from '@/components/map/map-style';
import type { SpotSummary } from '@/services/api/types';

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

const isRestricted = (spot: SpotSummary): boolean => {
  const ls = spot.legal_status;
  if (!ls) return false;
  return Boolean(
    ls.natura2000?.inside ||
      ls.national_park?.inside ||
      ls.coastal_law?.inside,
  );
};

const spotsToGeoJSON = (
  spots: SpotSummary[],
): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: spots.map((spot) => ({
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
      restricted: isRestricted(spot) ? 1 : 0,
    },
  })),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeColorExpr: any = [
  'case',
  ['==', ['get', 'restricted'], 1], '#EF4444',
  '#FFFFFF',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeWidthExpr: any = [
  'case',
  ['==', ['get', 'restricted'], 1], 2.5,
  1.5,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strokeOpacityExpr: any = [
  'case',
  ['==', ['get', 'restricted'], 1], 0.95,
  0.3,
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
      circleRadius: 20,
      circleColor: scoreColorExpr,
      circleOpacity: 0.15,
      circleBlur: 1,
    }),
    [scoreColorExpr],
  );

  const dotStyle = useMemo(
    () => ({
      circleRadius: 16,
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

  const userLocation = useMapStore((s) => s.userLocation);

  const spotsGeoJSON = useMemo(() => spotsToGeoJSON(spots), [spots]);

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
          defaultSettings={{
            centerCoordinate: [center[0], center[1]],
            zoomLevel: zoom,
          }}
        />

        {showLegalZones && (
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
                fillColor: '#EF4444',
                fillOpacity: 0.15,
              }}
              belowLayerID={SPOTS_GLOW_LAYER_ID}
            />
            <LineLayer
              id={LEGAL_ZONES_LINE_LAYER_ID}
              sourceLayerID="legal_zones"
              style={{
                lineColor: '#EF4444',
                lineOpacity: 0.5,
                lineWidth: 1,
              }}
              belowLayerID={SPOTS_GLOW_LAYER_ID}
            />
          </VectorSource>
        )}

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
              textSize: 11,
              textColor: '#FFFFFF',
              textAllowOverlap: true,
            }}
          />
        </ShapeSource>

        {userLocation && (
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
        )}
      </MLMapView>
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
});
