import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import {
  findLegalDocumentsByLocation,
  findLegalDocumentById,
  findLegalSources,
  findDecreesByCcaa,
} from '../services/legal-documents.js';

interface LocationQuery {
  lat: number;
  lon: number;
  radius?: number;
}

interface DocumentParams {
  id: string;
}

interface DecreeParams {
  ccaa: string;
}

const locationQuerySchema = {
  type: 'object',
  required: ['lat', 'lon'],
  properties: {
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lon: { type: 'number', minimum: -180, maximum: 180 },
    radius: { type: 'number', minimum: 1, maximum: 200, default: 50 },
  },
} as const;

const documentParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
  },
} as const;

const decreeParamsSchema = {
  type: 'object',
  required: ['ccaa'],
  properties: {
    ccaa: { type: 'string', minLength: 2 },
  },
} as const;

export const legalDocumentsRoutes = (pool: Pool) => {
  return async (app: FastifyInstance): Promise<void> => {
    app.get<{ Querystring: LocationQuery }>(
      '/legal/documents',
      { schema: { querystring: locationQuerySchema } },
      async (request, reply) => {
        try {
          const { lat, lon, radius } = request.query;
          const radiusKm = radius ?? 50;
          const docs = await findLegalDocumentsByLocation(pool, lat, lon, radiusKm);
          return { documents: docs, count: docs.length };
        } catch (err: unknown) {
          request.log.error(err);
          return reply.status(500).send({ error: 'Internal server error' });
        }
      },
    );

    app.get<{ Params: DocumentParams }>(
      '/legal/documents/:id',
      { schema: { params: documentParamsSchema } },
      async (request, reply) => {
        try {
          const doc = await findLegalDocumentById(pool, request.params.id);
          if (!doc) {
            return reply.status(404).send({ error: 'Document not found' });
          }
          return doc;
        } catch (err: unknown) {
          request.log.error(err);
          return reply.status(500).send({ error: 'Internal server error' });
        }
      },
    );

    app.get(
      '/legal/sources',
      async (request, reply) => {
        try {
          const sources = await findLegalSources(pool);
          return { sources, count: sources.length };
        } catch (err: unknown) {
          request.log.error(err);
          return reply.status(500).send({ error: 'Internal server error' });
        }
      },
    );

    app.get<{ Params: DecreeParams }>(
      '/legal/decrees/:ccaa',
      { schema: { params: decreeParamsSchema } },
      async (request, reply) => {
        try {
          const decrees = await findDecreesByCcaa(pool, request.params.ccaa);
          return { decrees, count: decrees.length };
        } catch (err: unknown) {
          request.log.error(err);
          return reply.status(500).send({ error: 'Internal server error' });
        }
      },
    );
  };
};
