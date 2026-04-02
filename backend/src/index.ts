import Fastify from 'fastify';
import cors from '@fastify/cors';
import pg from 'pg';
import { CONFIG } from './config.js';
import { healthRoutes } from './routes/health.js';
import { spotsRoutes } from './routes/spots.js';
import { satelliteRoutes } from './routes/satellite.js';
import { legalTilesRoutes } from './routes/legal-tiles.js';

const { Pool } = pg;

const start = async (): Promise<void> => {
  const app = Fastify({ logger: true });

  const pool = new Pool({ connectionString: CONFIG.DATABASE_URL });

  // Verify database connectivity on startup
  try {
    await pool.query('SELECT 1');
    app.log.info('Database connection established');
  } catch (err) {
    app.log.error('Failed to connect to database');
    throw err;
  }

  // Graceful shutdown: close pool when Fastify closes
  app.addHook('onClose', async () => {
    await pool.end();
  });

  await app.register(cors, { origin: true });
  await app.register(healthRoutes);
  await app.register(spotsRoutes(pool));
  await app.register(satelliteRoutes);
  await app.register(legalTilesRoutes);

  try {
    await app.listen({ port: CONFIG.PORT, host: CONFIG.HOST });
    console.log(`WildSpotter API listening on ${CONFIG.HOST}:${CONFIG.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
