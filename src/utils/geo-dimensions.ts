import type { BoundingBox } from '@/types/map';

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Returns approximate width and height of a bounding box in kilometers.
 */
export const getBoundingBoxDimensions = (
  bounds: BoundingBox,
): { widthKm: number; heightKm: number } => {
  const midLat = ((bounds.north + bounds.south) / 2) * DEG_TO_RAD;
  const dLat = (bounds.north - bounds.south) * DEG_TO_RAD;
  const dLng = (bounds.east - bounds.west) * DEG_TO_RAD;

  const heightKm = dLat * EARTH_RADIUS_KM;
  const widthKm = dLng * Math.cos(midLat) * EARTH_RADIUS_KM;

  return {
    widthKm: Math.abs(Math.round(widthKm * 10) / 10),
    heightKm: Math.abs(Math.round(heightKm * 10) / 10),
  };
};
