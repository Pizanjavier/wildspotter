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
    },
  })),
});

// Data-driven color: green (80+), cyan (60-79), amber (<60)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scoreColorExpr: any = [
  'case',
  ['>=', ['coalesce', ['get', 'composite_score'], 0], 80], COLORS.SCORE_HIGH,
  ['>=', ['coalesce', ['get', 'composite_score'], 0], 60], COLORS.SCORE_MEDIUM,
  COLORS.SCORE_LOW,
];

const GLOW_STYLE = {
  circleRadius: 20,
  circleColor: scoreColorExpr,
  circleOpacity: 0.15,
  circleBlur: 1,
};

const DOT_STYLE = {
  circleRadius: 16,
  circleColor: scoreColorExpr,
  circleOpacity: 0.9,
  circleStrokeWidth: 1.5,
  circleStrokeColor: '#FFFFFF',
  circleStrokeOpacity: 0.3,
};

/**
 * Native MapLibre map for iOS/Android.
 * Renders a full-screen dark-themed interactive map with spot markers.
 * Uses @maplibre/maplibre-react-native declarative components.
 */
export const MapView = ({ onMapReady, spots = [] }: MapViewProps) => {
  const cameraRef = useRef<CameraRef>(null);
  const theme = useSettingsStore((s) => s.theme);
  const showLegalZones = useSettingsStore((s) => s.showLegalZones);
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
            style={GLOW_STYLE}
          />
          <CircleLayer
            id={SPOTS_LAYER_ID}
            style={DOT_STYLE}
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
