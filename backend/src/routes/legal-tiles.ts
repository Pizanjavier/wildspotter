import type { FastifyInstance } from 'fastify';
import { fetchLegalTile } from '../services/legal-tiles.js';

interface TileParams {
  z: number;
  x: number;
  y: number;
}

const tileParamsSchema = {
  type: 'object',
  required: ['z', 'x', 'y'],
  properties: {
    z: { type: 'integer' },
    x: { type: 'integer', minimum: 0 },
    y: { type: 'integer', minimum: 0 },
  },
} as const;

export const legalTilesRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get<{ Params: TileParams }>('/legal/tiles/:z/:x/:y.pbf', {
    schema: {
      params: tileParamsSchema,
    },
  }, async (request, reply) => {
    const { z, x, y } = request.params;

    if (z < 0 || z > 22) {
      return reply.code(404).send({ error: 'Tile zoom out of range' });
    }

    const mvt = await fetchLegalTile(z, x, y);

    return reply
      .header('Content-Type', 'application/x-protobuf')
      .header('Cache-Control', 'public, max-age=86400')
      .send(mvt);
  });
};
