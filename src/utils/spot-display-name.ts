import { t } from '@/i18n';
import type { ContextDetails } from '@/services/api/types';

type SpotNameInput = {
  name: string | null;
  spot_type: string | null;
  surface_type: string | null;
  context_details?: ContextDetails | null;
};

const GENERIC_NAMES = new Set([
  'parking', 'viewpoint', 'clearing',
  'track', 'path', 'camino', 'pista',
]);

const isGenericName = (name: string): boolean =>
  GENERIC_NAMES.has(name.toLowerCase().trim());

const getScenicSuffix = (ctx: ContextDetails): string | null => {
  const scenic = ctx.scenic_value;
  if (!scenic?.features?.length) return null;

  for (const feat of scenic.features) {
    if (feat.includes('beach')) return t('spotName.nearBeach');
    if (feat.includes('viewpoint')) return t('spotName.nearViewpoint');
    if (feat.includes('peak')) return t('spotName.nearPeak');
    if (feat.includes('water') || feat.includes('reservoir'))
      return t('spotName.nearWater');
    if (feat.includes('river') || feat.includes('stream'))
      return t('spotName.nearRiver');
  }
  return null;
};

export const getSpotDisplayName = (spot: SpotNameInput): string => {
  if (spot.name && !isGenericName(spot.name)) return spot.name;

  const typeKey = spot.spot_type as 'dead_end' | 'dirt_parking' | 'viewpoint_adjacent' | 'clearing' | null;
  const typeLabel = typeKey ? t(`spotTypes.${typeKey}`) : null;

  const scenicSuffix = spot.context_details
    ? getScenicSuffix(spot.context_details)
    : null;

  if (typeLabel && scenicSuffix) return `${typeLabel} · ${scenicSuffix}`;
  if (typeLabel) return typeLabel;

  return t('spots.unnamedSpot');
};

export const getTranslatedSurface = (surface: string | null): string | null => {
  if (!surface || surface === 'unknown') return null;
  return t(`surfaces.${surface}`);
};

export const getTranslatedSpotType = (spotType: string | null): string | null => {
  if (!spotType) return null;
  return t(`spotTypes.${spotType}`);
};
