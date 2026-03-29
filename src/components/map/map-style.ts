import type { StyleSpecification } from 'maplibre-gl';
import { TERRAIN_TILE_URL } from '@/constants/config';
import type { ThemeMode } from '@/constants/theme';

export const TERRAIN_DEM_SOURCE_ID = 'terrain-dem';

/**
 * Light map style — CARTO Voyager (clean, readable) with hillshade.
 */
export const LIGHT_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'WildSpotter Light',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },
    [TERRAIN_DEM_SOURCE_ID]: {
      type: 'raster-dem',
      tiles: [TERRAIN_TILE_URL],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#F0F0F0',
      },
    },
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 20,
      paint: {
        'raster-opacity': 1.0,
        'raster-saturation': -0.1,
        'raster-contrast': 0.0,
        'raster-brightness-min': 0.0,
        'raster-brightness-max': 1.0,
      },
    },
    {
      id: 'hillshade',
      type: 'hillshade',
      source: TERRAIN_DEM_SOURCE_ID,
      paint: {
        'hillshade-illumination-direction': 315,
        'hillshade-exaggeration': 0.35,
        'hillshade-shadow-color': 'rgba(0, 0, 0, 0.15)',
        'hillshade-highlight-color': 'rgba(255, 255, 255, 0.3)',
        'hillshade-accent-color': 'rgba(52, 211, 153, 0.08)',
      },
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

/**
 * Dark map style — CARTO dark_matter with subdued hillshade.
 */
export const DARK_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'WildSpotter Dark',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },
    [TERRAIN_DEM_SOURCE_ID]: {
      type: 'raster-dem',
      tiles: [TERRAIN_TILE_URL],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#2A2420',
      },
    },
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 20,
      paint: {
        'raster-opacity': 1.0,
        'raster-saturation': -0.4,
        'raster-contrast': 0.1,
        'raster-brightness-min': 0.0,
        'raster-brightness-max': 0.45,
      },
    },
    {
      id: 'hillshade',
      type: 'hillshade',
      source: TERRAIN_DEM_SOURCE_ID,
      paint: {
        'hillshade-illumination-direction': 315,
        'hillshade-exaggeration': 0.3,
        'hillshade-shadow-color': 'rgba(0, 0, 0, 0.4)',
        'hillshade-highlight-color': 'rgba(255, 255, 255, 0.1)',
        'hillshade-accent-color': 'rgba(52, 211, 153, 0.05)',
      },
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

export const getMapStyle = (theme: ThemeMode): StyleSpecification =>
  theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
