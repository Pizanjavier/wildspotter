import type { LegalStatus, LegalDocument } from '@/services/api/types';

export type OvernightLevel = 'allowed' | 'restricted' | 'prohibited' | 'unknown';

export type OvernightLevelFull =
  | 'allowed'
  | 'tolerated'
  | 'restricted'
  | 'prohibited'
  | 'unknown';

/**
 * Basic overnight level from static per-spot legal checks only.
 * Used on map dots where documents are not available.
 */
export const getOvernightLevel = (ls: LegalStatus | null): OvernightLevel => {
  if (!ls) return 'unknown';
  if (ls.cadastre?.private) return 'prohibited';
  if (ls.national_park?.inside) return 'restricted';
  if (ls.coastal_law?.inside) return 'restricted';
  if (ls.natura2000?.inside) return 'restricted';
  return 'allowed';
};

/**
 * Full overnight level incorporating both static checks and dynamic
 * legal documents (CCAA decrees with max_stay_hours, fire bans, etc.).
 * Used in spot detail where documents are fetched.
 */
export const getOvernightLevelFull = (
  legalStatus: LegalStatus | null,
  documents: LegalDocument[],
): OvernightLevelFull => {
  const isInsidePark = Boolean(legalStatus?.national_park?.inside);
  const isInsideNatura = Boolean(legalStatus?.natura2000?.inside);
  const isCoastal = Boolean(legalStatus?.coastal_law?.inside);
  const isPrivateLand = Boolean(legalStatus?.cadastre?.private);
  
  const hasFireBan = documents.some((d) => d.restriction_type === 'fire_ban');
  const hasStrictBan = documents.some(
    (d) =>
      d.restriction_type === 'camping_ban' ||
      d.restriction_type === 'overnight_ban' ||
      d.restriction_type === 'parking_ban'
  );

  let maxStayHours: number | null = null;
  for (const doc of documents) {
    if (!doc.decree_articles) continue;
    for (const article of doc.decree_articles) {
      if (article.max_stay_hours !== null) {
        // Take the MINIMUM stay hours if multiple decrees apply
        if (maxStayHours === null || article.max_stay_hours < maxStayHours) {
          maxStayHours = article.max_stay_hours;
        }
      }
    }
  }

  // Hierarchy of restrictions (first match wins)
  if (hasFireBan) return 'prohibited';
  if (isPrivateLand) return 'prohibited';
  if (maxStayHours === 0) return 'prohibited';
  if (hasStrictBan) return 'restricted';
  if (isInsidePark) return 'restricted';
  if (isCoastal) return 'restricted';
  if (isInsideNatura) return 'restricted';
  if (maxStayHours !== null) return 'tolerated';
  
  if (documents.length === 0 && !legalStatus) return 'unknown';
  return 'allowed';
};
