import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import pg from 'pg';
import { CONFIG } from './config.js';
import { healthRoutes } from './routes/health.js';
import { spotsRoutes } from './routes/spots.js';
import { satelliteRoutes } from './routes/satellite.js';
import { legalTilesRoutes } from './routes/legal-tiles.js';
import { reportsRoutes } from './routes/reports.js';

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

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    // Allow cross-origin loading of static assets (satellite tiles, legal MVT tiles)
    // from the mobile app / Expo web dev origin. Without this, helmet's default
    // `Cross-Origin-Resource-Policy: same-origin` causes browsers to block image
    // requests to /satellite/*.jpg, surfacing as failed/503-like network errors.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  });

  const corsOriginsEnv = process.env.CORS_ORIGINS?.trim();
  const defaultDevOrigins = [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:19000',
    'http://localhost:3000',
    'http://127.0.0.1:8081',
  ];
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultDevOrigins;
  app.log.info({ allowedOrigins }, 'CORS allowlist configured');

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow same-origin / non-browser requests (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  });
  await app.register(healthRoutes);
  await app.register(spotsRoutes(pool));
  await app.register(satelliteRoutes);
  await app.register(legalTilesRoutes);
  await app.register(reportsRoutes(pool));

  try {
    await app.listen({ port: CONFIG.PORT, host: CONFIG.HOST });
    console.log(`WildSpotter API listening on ${CONFIG.HOST}:${CONFIG.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
