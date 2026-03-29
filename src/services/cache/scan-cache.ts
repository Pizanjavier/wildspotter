import type { BoundingBox } from '@/types/map';
import type { CachedScan } from '@/services/cache/types';
import { CACHE_TTL_MS, CACHE_KEY_PREFIX } from '@/services/cache/types';
import {
  getItem,
  setItem,
  removeItem,
  getAllKeys,
} from '@/services/cache/storage';

const hashBoundingBox = (bounds: BoundingBox): string => {
  const n = bounds.north.toFixed(3);
  const s = bounds.south.toFixed(3);
  const e = bounds.east.toFixed(3);
  const w = bounds.west.toFixed(3);
  return `${CACHE_KEY_PREFIX}${n}_${s}_${e}_${w}`;
};

const getCacheKeys = async (): Promise<string[]> => {
  const allKeys = await getAllKeys();
  return allKeys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
};

export const cacheScan = async (scan: CachedScan): Promise<void> => {
  const key = hashBoundingBox(scan.boundingBox);
  const json = JSON.stringify(scan);
  await setItem(key, json);
};

export const getCachedScan = async (
  bounds: BoundingBox,
): Promise<CachedScan | null> => {
  const key = hashBoundingBox(bounds);
  const raw = await getItem(key);
  if (!raw) return null;

  const parsed: unknown = JSON.parse(raw);
  const scan = parsed as CachedScan;

  if (scan.expiresAt < Date.now()) {
    await removeItem(key);
    return null;
  }

  return scan;
};

export const getAllCachedScans = async (): Promise<CachedScan[]> => {
  const keys = await getCacheKeys();
  const scans: CachedScan[] = [];

  for (const key of keys) {
    const raw = await getItem(key);
    if (!raw) continue;

    const parsed: unknown = JSON.parse(raw);
    const scan = parsed as CachedScan;

    if (scan.expiresAt < Date.now()) {
      await removeItem(key);
      continue;
    }

    scans.push(scan);
  }

  return scans;
};

export const clearCache = async (): Promise<void> => {
  const keys = await getCacheKeys();
  for (const key of keys) {
    await removeItem(key);
  }
};

export const getCacheSize = async (): Promise<number> => {
  const keys = await getCacheKeys();
  let totalBytes = 0;

  for (const key of keys) {
    const raw = await getItem(key);
    if (raw) {
      totalBytes += new Blob([raw]).size;
    }
  }

  return totalBytes;
};
