import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { FONT_FAMILIES } from '@/constants/fonts';
import { API_BASE_URL } from '@/constants/config';
import { useMapStore } from '@/stores/map-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getMapStyle, TERRAIN_DEM_SOURCE_ID } from '@/components/map/map-style';
import type { SpotSummary } from '@/services/api/types';

const isWebGLAvailable = (): boolean => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
};

const USER_LOCATION_SOURCE_ID = 'user-location-source';
const USER_LOCATION_GLOW_LAYER_ID = 'user-location-glow';
const USER_LOCATION_DOT_LAYER_ID = 'user-location-dot';

const SPOTS_SOURCE_ID = 'spots-source';
const SPOTS_LAYER_ID = 'spots-layer';
const SPOTS_GLOW_LAYER_ID = 'spots-glow-layer';

const LEGAL_ZONES_SOURCE_ID = 'legal-zones';
const LEGAL_ZONES_FILL_LAYER_ID = 'legal-zones-fill';
const LEGAL_ZONES_LINE_LAYER_ID = 'legal-zones-line';

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

/**
 * MapLibre GL JS map for web platform.
 * Renders a full-screen dark-themed interactive map with spot markers.
 */
export const MapView = ({ onMapReady, spots = [] }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const mapLoadedRef = useRef(false);
  const [webGLFailed, setWebGLFailed] = useState(false);
  const { center, zoom, updateBounds, setCenter, setZoom, flyToTarget, clearFlyTo } = useMapStore();
  const userLocation = useMapStore((s) => s.userLocation);
  const theme = useSettingsStore((s) => s.theme);
  const showLegalZones = useSettingsStore((s) => s.showLegalZones);
  const themeColors = useThemeColors();

  const syncBounds = useCallback(
    (map: import('maplibre-gl').Map) => {
      const bounds = map.getBounds();
      updateBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
      const mapCenter = map.getCenter();
      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(map.getZoom());
    },
    [updateBounds, setCenter, setZoom],
  );

  // Update map style when theme changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current as import('maplibre-gl').Map;
    map.setStyle(getMapStyle(theme));
  }, [theme]);

  // Re-apply theme-aware score colors to spot layers when theme changes
  useEffect(() => {
    if (!mapLoadedRef.current || !mapRef.current) return;
    const map = mapRef.current as import('maplibre-gl').Map;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expr: any = [
      'case',
      ['>=', ['coalesce', ['get', 'composite_score'], 0], 30], themeColors.SCORE_HIGH,
      ['>=', ['coalesce', ['get', 'composite_score'], 0], 10], themeColors.SCORE_MEDIUM,
      themeColors.SCORE_LOW,
    ];
    try {
      map.setPaintProperty(SPOTS_LAYER_ID, 'circle-color', expr);
      map.setPaintProperty(SPOTS_GLOW_LAYER_ID, 'circle-color', expr);
    } catch {
      // Layers may have been wiped by setStyle; they will be re-added on next load
    }
  }, [themeColors.SCORE_HIGH, themeColors.SCORE_MEDIUM, themeColors.SCORE_LOW]);

  // Toggle legal zone layers visibility
  useEffect(() => {
    if (!mapLoadedRef.current || !mapRef.current) return;
    const map = mapRef.current as import('maplibre-gl').Map;
    const visibility = showLegalZones ? 'visible' : 'none';
    try {
      map.setLayoutProperty(LEGAL_ZONES_FILL_LAYER_ID, 'visibility', visibility);
      map.setLayoutProperty(LEGAL_ZONES_LINE_LAYER_ID, 'visibility', visibility);
    } catch {
      // Layers may not exist yet if map hasn't fully loaded
    }
  }, [showLegalZones]);

  // Update spots layer when spots change
  useEffect(() => {
    if (!mapLoadedRef.current || !mapRef.current) return;
    const map = mapRef.current as import('maplibre-gl').Map;
    const source = map.getSource(SPOTS_SOURCE_ID);
    if (source && 'setData' in source) {
      (source as import('maplibre-gl').GeoJSONSource).setData(
        spotsToGeoJSON(spots),
      );
    }
  }, [spots]);

  // Update user location dot on web map
  useEffect(() => {
    if (!mapLoadedRef.current || !mapRef.current) return;
    const map = mapRef.current as import('maplibre-gl').Map;
    const source = map.getSource(USER_LOCATION_SOURCE_ID);
    if (!source || !('setData' in source)) return;

    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: userLocation
        ? [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: userLocation },
            properties: {},
          }]
        : [],
    };
    (source as import('maplibre-gl').GeoJSONSource).setData(data);
  }, [userLocation]);

  // Fly to target when set externally (e.g., from search)
  useEffect(() => {
    if (!flyToTarget || !mapRef.current) return;
    const map = mapRef.current as import('maplibre-gl').Map;
    map.flyTo({
      center: flyToTarget.center,
      zoom: flyToTarget.zoom,
      duration: 1500,
    });
    clearFlyTo();
  }, [flyToTarget, clearFlyTo]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    let mounted = true;

    const initMap = async () => {
      if (!isWebGLAvailable()) {
        console.warn('[MapView] WebGL not available — showing fallback');
        setWebGLFailed(true);
        return;
      }

      const maplibreModule = await import('maplibre-gl');
      const maplibregl = maplibreModule.default ?? maplibreModule;

      // Inject MapLibre CSS via style tag (Metro doesn't support CSS imports)
      if (!document.getElementById('maplibre-css')) {
        const link = document.createElement('link');
        link.id = 'maplibre-css';
        link.rel = 'stylesheet';
        link.href =
          'https://unpkg.com/maplibre-gl/dist/maplibre-gl.css';
        document.head.appendChild(link);
      }

      if (!mounted || !containerRef.current) return;

      try {
        const MapConstructor = maplibregl.Map ?? maplibreModule.Map;
        const map = new MapConstructor({
          container: containerRef.current,
          style: getMapStyle(theme),
          center: center,
          zoom: zoom,
          attributionControl: false,
        } as ConstructorParameters<typeof MapConstructor>[0]);

        mapRef.current = map;
        // Expose map instance on container for sibling components
        if (containerRef.current) {
          (containerRef.current as unknown as { _mlMap: typeof map })._mlMap = map;
        }

        map.on('load', () => {
          if (!mounted) return;
          mapLoadedRef.current = true;

          // Add spots GeoJSON source
          map.addSource(SPOTS_SOURCE_ID, {
            type: 'geojson',
            data: spotsToGeoJSON(spots),
          });

          // Legal restriction zones overlay (vector tiles)
          map.addSource(LEGAL_ZONES_SOURCE_ID, {
            type: 'vector',
            tiles: [`${API_BASE_URL}/legal/tiles/{z}/{x}/{y}.pbf`],
            minzoom: 4,
            maxzoom: 10,
          });

          map.addLayer({
            id: LEGAL_ZONES_FILL_LAYER_ID,
            type: 'fill',
            source: LEGAL_ZONES_SOURCE_ID,
            'source-layer': 'legal_zones',
            paint: {
              'fill-color': '#EF4444',
              'fill-opacity': 0.15,
            },
            layout: {
              visibility: showLegalZones ? 'visible' : 'none',
            },
          });

          map.addLayer({
            id: LEGAL_ZONES_LINE_LAYER_ID,
            type: 'line',
            source: LEGAL_ZONES_SOURCE_ID,
            'source-layer': 'legal_zones',
            paint: {
              'line-color': '#EF4444',
              'line-opacity': 0.5,
              'line-width': 1,
            },
            layout: {
              visibility: showLegalZones ? 'visible' : 'none',
            },
          });

          // Data-driven color: green (30+), cyan (10-29), amber (<10).
          // Built from theme colors so dots match ScoreBadge in both light & dark.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const scoreColorExpr: any = [
            'case',
            ['>=', ['coalesce', ['get', 'composite_score'], 0], 30], themeColors.SCORE_HIGH,
            ['>=', ['coalesce', ['get', 'composite_score'], 0], 10], themeColors.SCORE_MEDIUM,
            themeColors.SCORE_LOW,
          ];

          // Glow layer (larger, semi-transparent)
          map.addLayer({
            id: SPOTS_GLOW_LAYER_ID,
            type: 'circle',
            source: SPOTS_SOURCE_ID,
            paint: {
              'circle-radius': 16,
              'circle-color': scoreColorExpr,
              'circle-opacity': 0.2,
              'circle-blur': 1,
            },
          });

          // Main dot layer — red stroke on legally-restricted spots
          map.addLayer({
            id: SPOTS_LAYER_ID,
            type: 'circle',
            source: SPOTS_SOURCE_ID,
            paint: {
              'circle-radius': 12,
              'circle-color': scoreColorExpr,
              'circle-opacity': 0.9,
              'circle-stroke-width': [
                'case',
                ['==', ['get', 'restricted'], 1], 3,
                2,
              ],
              'circle-stroke-color': [
                'case',
                ['==', ['get', 'restricted'], 1], '#EF4444',
                '#FFFFFF',
              ],
              'circle-stroke-opacity': [
                'case',
                ['==', ['get', 'restricted'], 1], 0.95,
                0.3,
              ],
            },
          });

          // Score labels on dots
          map.addLayer({
            id: 'spots-labels',
            type: 'symbol',
            source: SPOTS_SOURCE_ID,
            layout: {
              'text-field': [
                'number-format',
                ['coalesce', ['get', 'composite_score'], 0],
                { 'max-fraction-digits': 0 },
              ],
              'text-size': 11,
              'text-font': ['Open Sans Bold'],
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#FFFFFF',
            },
          });

          // Navigate to spot detail on click
          const handleSpotClick = (e: import('maplibre-gl').MapMouseEvent & { features?: import('maplibre-gl').MapGeoJSONFeature[] }) => {
            const feature = e.features?.[0];
            const spotId = feature?.properties?.id as string | undefined;
            if (spotId) {
              router.push(`/spot/${spotId}`);
            }
          };
          map.on('click', SPOTS_LAYER_ID, handleSpotClick);
          map.on('click', 'spots-labels', handleSpotClick);

          // Pointer cursor on hover
          map.on('mouseenter', SPOTS_LAYER_ID, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', SPOTS_LAYER_ID, () => {
            map.getCanvas().style.cursor = '';
          });

          // User location blue dot
          map.addSource(USER_LOCATION_SOURCE_ID, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          map.addLayer({
            id: USER_LOCATION_GLOW_LAYER_ID,
            type: 'circle',
            source: USER_LOCATION_SOURCE_ID,
            paint: {
              'circle-radius': 20,
              'circle-color': '#4A90D9',
              'circle-opacity': 0.2,
              'circle-blur': 1,
            },
          });

          map.addLayer({
            id: USER_LOCATION_DOT_LAYER_ID,
            type: 'circle',
            source: USER_LOCATION_SOURCE_ID,
            paint: {
              'circle-radius': 8,
              'circle-color': '#4A90D9',
              'circle-opacity': 0.9,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-opacity': 0.8,
            },
          });

          // Enable 3D terrain for hillshade
          try {
            map.setTerrain({
              source: TERRAIN_DEM_SOURCE_ID,
              exaggeration: 1.5,
            });
          } catch (terrainErr) {
            console.warn('[MapView] 3D terrain unavailable:', terrainErr);
          }

          syncBounds(map);
          onMapReady?.();
        });

        map.on('moveend', () => {
          if (!mounted) return;
          syncBounds(map);
        });

        const AttrControl =
          maplibregl.AttributionControl ?? maplibreModule.AttributionControl;
        map.addControl(
          new AttrControl({ compact: true }),
          'bottom-right',
        );
      } catch (err) {
        console.warn('[MapView] Failed to initialize map:', err);
        setWebGLFailed(true);
      }
    };

    initMap();

    return () => {
      mounted = false;
      mapLoadedRef.current = false;
      if (mapRef.current) {
        (mapRef.current as import('maplibre-gl').Map).remove();
        mapRef.current = null;
      }
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        {/* Native MapLibre will be added in a future phase */}
      </View>
    );
  }

  if (webGLFailed) {
    return (
      <View style={styles.webglFallback}>
        <Text style={styles.fallbackIcon}>MAP</Text>
        <Text style={styles.fallbackText}>
          WebGL is not available in this browser.
        </Text>
        <Text style={styles.fallbackHint}>
          The map requires GPU acceleration. Try a different browser or enable
          hardware acceleration in settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  fallback: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  webglFallback: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fallbackIcon: {
    fontFamily: FONT_FAMILIES.DATA,
    fontSize: 24,
    color: COLORS.ACCENT,
    marginBottom: 16,
    letterSpacing: 4,
  },
  fallbackText: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackHint: {
    fontFamily: FONT_FAMILIES.BODY,
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});
