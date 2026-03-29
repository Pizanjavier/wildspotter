import 'dotenv/config';

export const CONFIG = {
  PORT: Number(process.env.PORT) || 8000,
  HOST: process.env.HOST || '0.0.0.0',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://wildspotter:wildspotter@db:5432/wildspotter',
} as const;
