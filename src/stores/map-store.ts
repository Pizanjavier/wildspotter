import { create } from 'zustand';
import type { LngLat, BoundingBox } from '@/types/map';

const DEFAULT_CENTER: LngLat = [-3.7, 40.4];
const DEFAULT_ZOOM = 6;

export type FlyToTarget = {
  center: LngLat;
  zoom: number;
};

type MapState = {
  center: LngLat;
  zoom: number;
  bounds: BoundingBox | null;
  flyToTarget: FlyToTarget | null;
  selectionMode: boolean;
  customBounds: BoundingBox | null;
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  updateBounds: (bounds: BoundingBox) => void;
  flyTo: (target: FlyToTarget) => void;
  clearFlyTo: () => void;
  toggleSelectionMode: () => void;
  setCustomBounds: (bounds: BoundingBox | null) => void;
  userLocation: LngLat | null;
  setUserLocation: (location: LngLat | null) => void;
};

export const useMapStore = create<MapState>((set) => ({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  bounds: null,
  flyToTarget: null,
  selectionMode: false,
  customBounds: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  updateBounds: (bounds) => set({ bounds }),
  flyTo: (target) => {
    const latDelta = 360 / Math.pow(2, target.zoom + 1);
    const lngDelta = 360 / Math.pow(2, target.zoom);
    const bounds: BoundingBox = {
      north: target.center[1] + latDelta / 2,
      south: target.center[1] - latDelta / 2,
      east: target.center[0] + lngDelta / 2,
      west: target.center[0] - lngDelta / 2,
    };
    set({ flyToTarget: target, center: target.center, zoom: target.zoom, bounds });
  },
  clearFlyTo: () => set({ flyToTarget: null }),
  toggleSelectionMode: () =>
    set((state) => ({
      selectionMode: !state.selectionMode,
      customBounds: !state.selectionMode ? state.bounds : null,
    })),
  setCustomBounds: (customBounds) => set({ customBounds }),
  userLocation: null,
  setUserLocation: (userLocation) => set({ userLocation }),
}));

if (__DEV__) {
  (globalThis as Record<string, unknown>).__mapStore = useMapStore;
}
