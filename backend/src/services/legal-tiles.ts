import { readFile } from 'fs/promises';
import { join } from 'path';

const TILES_DIR = process.env.LEGAL_TILES_DIR || '/data/legal-tiles';
const EMPTY_TILE = Buffer.alloc(0);

/**
 * Serves a pre-generated legal zone MVT tile from disk.
 * Returns an empty buffer if the tile file does not exist (meaning the
 * tile contained no legal zone geometries when it was generated).
 */
export const fetchLegalTile = async (
  z: number,
  x: number,
  y: number,
): Promise<Buffer> => {
  try {
    return await readFile(join(TILES_DIR, String(z), String(x), `${y}.pbf`));
  } catch {
    return EMPTY_TILE;
  }
};
