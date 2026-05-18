import { create } from 'zustand';
import type { LngLat, BoundingBox } from '@/types/map';
import type { ContextDetails, LegalStatus } from '@/services/api/types';

const DEFAULT_CENTER: LngLat = [-3.7, 40.4];
const DEFAULT_ZOOM = 6;

export type FlyToTarget = {
  center: LngLat;
  zoom: number;
};

export type SelectedSpot = {
  id: string;
  name: string | null;
  score: number | null;
  surface: string;
  province: string | null;
  slopePct: number | null;
  satelliteImagePath: string | null;
  legalStatus: LegalStatus | null;
  spotType: string | null;
  contextDetails: ContextDetails | null;
  coordinates: { lat: number; lon: number };
};

type MapState = {
  center: LngLat;
  zoom: number;
  bounds: BoundingBox | null;
  flyToTarget: FlyToTarget | null;
  selectionMode: boolean;
  customBounds: BoundingBox | null;
  selectedSpot: SelectedSpot | null;
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  updateBounds: (bounds: BoundingBox) => void;
  flyTo: (target: FlyToTarget) => void;
  clearFlyTo: () => void;
  toggleSelectionMode: () => void;
  setCustomBounds: (bounds: BoundingBox | null) => void;
  setSelectedSpot: (spot: SelectedSpot) => void;
  clearSelectedSpot: () => void;
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
  selectedSpot: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  updateBounds: (bounds) => set({ bounds }),
  flyTo: (target) => set({ flyToTarget: target }),
  clearFlyTo: () => set({ flyToTarget: null }),
  toggleSelectionMode: () =>
    set((state) => ({
      selectionMode: !state.selectionMode,
      customBounds: !state.selectionMode ? state.bounds : null,
    })),
  setCustomBounds: (customBounds) => set({ customBounds }),
  setSelectedSpot: (selectedSpot) => set({ selectedSpot }),
  clearSelectedSpot: () => set({ selectedSpot: null }),
  userLocation: null,
  setUserLocation: (userLocation) => set({ userLocation }),
}));

if (__DEV__) {
  (globalThis as Record<string, unknown>).__mapStore = useMapStore;
}
