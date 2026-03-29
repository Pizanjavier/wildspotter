import type { FastifyInstance } from 'fastify';

export const healthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
          required: ['status'],
        },
      },
    },
  }, async () => {
    return { status: 'ok' };
  });
};
