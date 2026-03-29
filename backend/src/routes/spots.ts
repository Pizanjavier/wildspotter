import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { findSpotsByBbox, findSpotById } from '../services/spatial.js';

interface SpotsQuerystring {
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  min_score?: number;
  max_slope?: number;
  hide_restricted?: boolean;
}

interface SpotParams {
  id: string;
}

const bboxQuerySchema = {
  type: 'object',
  required: ['min_lat', 'min_lon', 'max_lat', 'max_lon'],
  properties: {
    min_lat: { type: 'number', minimum: -90, maximum: 90 },
    min_lon: { type: 'number', minimum: -180, maximum: 180 },
    max_lat: { type: 'number', minimum: -90, maximum: 90 },
    max_lon: { type: 'number', minimum: -180, maximum: 180 },
    min_score: { type: 'number', minimum: 0, maximum: 100, default: 0 },
    max_slope: { type: 'number', minimum: 0, maximum: 100 },
    hide_restricted: { type: 'boolean', default: false },
  },
} as const;

const spotParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
} as const;

const coordinatesSchema = {
  type: 'object',
  properties: {
    lon: { type: 'number' },
    lat: { type: 'number' },
  },
  required: ['lon', 'lat'],
};

const spotSummarySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    osm_id: { type: ['number', 'null'] },
    name: { type: ['string', 'null'] },
    coordinates: coordinatesSchema,
    spot_type: { type: ['string', 'null'] },
    surface_type: { type: ['string', 'null'] },
    slope_pct: { type: ['number', 'null'] },
    elevation: { type: ['number', 'null'] },
    legal_status: { type: ['object', 'null'] },
    composite_score: { type: ['number', 'null'] },
    status: { type: 'string' },
  },
};

const spotDetailSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    osm_id: { type: ['number', 'null'] },
    name: { type: ['string', 'null'] },
    coordinates: coordinatesSchema,
    spot_type: { type: ['string', 'null'] },
    surface_type: { type: ['string', 'null'] },
    osm_tags: { type: ['object', 'null'] },
    elevation: { type: ['number', 'null'] },
    slope_pct: { type: ['number', 'null'] },
    terrain_score: { type: ['number', 'null'] },
    legal_status: { type: ['object', 'null'] },
    ai_score: { type: ['number', 'null'] },
    ai_details: { type: ['object', 'null'], additionalProperties: true },
    context_score: { type: ['number', 'null'] },
    context_details: { type: ['object', 'null'], additionalProperties: true },
    composite_score: { type: ['number', 'null'] },
    satellite_image_path: { type: ['string', 'null'] },
    status: { type: 'string' },
    rejection_reason: { type: ['string', 'null'] },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
};

export const spotsRoutes = (pool: Pool) => {
  return async (app: FastifyInstance): Promise<void> => {
    app.get<{ Querystring: SpotsQuerystring }>('/spots', {
      schema: {
        querystring: bboxQuerySchema,
        response: {
          200: {
            type: 'array',
            items: spotSummarySchema,
          },
        },
      },
    }, async (request) => {
      const { min_lat, min_lon, max_lat, max_lon, min_score, max_slope, hide_restricted } = request.query;
      const bbox = { min_lat, min_lon, max_lat, max_lon };
      return findSpotsByBbox(pool, bbox, min_score ?? 0, max_slope, hide_restricted);
    });

    app.get<{ Params: SpotParams }>('/spots/:id', {
      schema: {
        params: spotParamsSchema,
        response: {
          200: spotDetailSchema,
        },
      },
    }, async (request, reply) => {
      const spot = await findSpotById(pool, request.params.id);
      if (!spot) {
        return reply.code(404).send({ error: 'Spot not found' });
      }
      return spot;
    });
  };
};
