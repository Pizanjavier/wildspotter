import type { FastifyInstance } from 'fastify';
import { resolve, join } from 'node:path';
import { createReadStream, existsSync } from 'node:fs';

const SATELLITE_DIR = process.env.SATELLITE_DIR || '/data/satellite_tiles';

interface SatelliteParams {
  filename: string;
}

const paramsSchema = {
  type: 'object',
  required: ['filename'],
  properties: {
    filename: { type: 'string', pattern: '^[a-zA-Z0-9_-]+\\.(jpg|jpeg|png|webp)$' },
  },
} as const;

export const satelliteRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get<{ Params: SatelliteParams }>('/satellite/:filename', {
    schema: { params: paramsSchema },
  }, async (request, reply) => {
    const { filename } = request.params;
    const filePath = resolve(join(SATELLITE_DIR, filename));

    // Prevent directory traversal
    if (!filePath.startsWith(resolve(SATELLITE_DIR))) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    if (!existsSync(filePath)) {
      return reply.code(404).send({ error: 'Image not found' });
    }

    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    const contentType = mimeMap[ext] ?? 'application/octet-stream';

    return reply
      .header('Content-Type', contentType)
      .header('Cache-Control', 'public, max-age=86400')
      .send(createReadStream(filePath));
  });
};
