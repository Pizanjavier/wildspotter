---
paths:
  - "backend/**/*"
  - "workers/**/*.py"
  - "db/**/*"
  - "docker-compose.yml"
---

# Backend & Docker Rules

## Architecture
- Fastify API (TypeScript) serves JSON to the mobile app — no business logic in the client
- Python workers handle heavy GIS/AI processing (terrain, legal, AI inference, scoring)
- PostgreSQL + PostGIS stores all spot data with spatial indexing
- n8n orchestrates data ingestion and processing pipelines
- All services run in Docker Compose on a shared `wildspotter-net` bridge network

## Fastify API Conventions
- Use `pg` (node-postgres) with raw SQL for PostGIS spatial queries — no ORM
- JSON Schema validation on all routes via Fastify's built-in schema support
- CORS via `@fastify/cors` to allow React Native dev server
- TypeScript strict mode, shared type definitions usable by the mobile app
- Environment variables loaded from `.env` via `dotenv`
- Keep route handlers thin — delegate to service functions in `backend/src/services/`

## PostGIS Query Patterns
- Bounding box queries: `ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)`
- Radius queries: `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lon, lat), 4326), radius_m)`
- Always specify SRID 4326 (WGS84) for geometry operations
- Use `ST_AsGeoJSON(geom)` when returning coordinates to the API
- Index spatial columns with `USING GIST`
- Filter by `status = 'completed'` by default in API queries

## Database Conventions
- Schema defined in `db/init.sql` — runs on first container boot
- Use `JSONB` for flexible nested data (OSM tags, legal status)
- Index JSONB columns with `USING GIN` when querying by key
- UUID primary keys for the `spots` table
- Timestamps always `TIMESTAMPTZ`

## Python Worker Conventions
- Each worker is a standalone script (`terrain.py`, `legal.py`, `ai_inference.py`, `scoring.py`)
- Workers read from and write to PostgreSQL via `psycopg2`
- Process spots in batches (LIMIT 50) filtered by `status` column
- Rate-limit external requests (1s delay for WMS, 2s for satellite tiles)
- Log progress to stdout for Docker log collection

## Docker Development Workflow
- `docker-compose up -d --build` — start/rebuild the full stack
- `docker-compose logs -f api` — follow Fastify API logs
- `docker-compose logs -f worker` — follow Python worker logs
- `docker-compose down` — stop all services
- `docker-compose exec db psql -U wildspotter` — connect to database
- Database data persists in a Docker volume (`pgdata`)
- Worker and API containers mount source directories for live reloading during development

## Environment Variables
- All secrets and config in `.env` at project root (gitignored)
- Required: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`
- Optional: `BING_MAPS_API_KEY` (fallback satellite imagery)
- Never hardcode secrets in source files or Dockerfiles

## Security
- API is local-only for MVP — no authentication required
- Validate and sanitize all query parameters at the route level
- Use parameterized SQL queries — never string-interpolate user input into SQL
- Rate limit WMS requests to avoid overloading government servers
