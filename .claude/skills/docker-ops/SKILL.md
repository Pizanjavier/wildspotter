---
name: docker-ops
description: Build, start, stop, and debug the WildSpotter Docker Compose stack (Fastify API, PostGIS, Python workers, n8n).
argument-hint: [start|stop|rebuild|logs|status|shell]
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash
---

# Docker Operations

Manage the WildSpotter Docker Compose stack.

## Arguments

- `$ARGUMENTS` — Action: `start`, `stop`, `rebuild`, `logs`, `status`, `shell`, or `reset-db`. If omitted, defaults to `status`.

## Actions

### `start` — Start all services
```bash
cd /Users/javier/Documents/Proyects/wildspotter && docker-compose up -d --build
```
Then verify all 4 containers are running: `db`, `api`, `worker`, `n8n`.

### `stop` — Stop all services
```bash
cd /Users/javier/Documents/Proyects/wildspotter && docker-compose down
```

### `rebuild` — Rebuild and restart a specific service or all
```bash
# All services
docker-compose up -d --build

# Single service (e.g., api)
docker-compose up -d --build api
```

### `logs` — Follow logs for a service
```bash
docker-compose logs -f api      # Fastify API
docker-compose logs -f worker   # Python workers
docker-compose logs -f db       # PostgreSQL
docker-compose logs -f n8n      # n8n orchestrator
```

### `status` — Check container health
```bash
docker-compose ps
```
Verify all services show `Up` status. Check port bindings:
- `db`: 5432
- `api`: 8000
- `n8n`: 5678

### `shell` — Open a shell in a container
```bash
docker-compose exec db psql -U wildspotter           # PostgreSQL shell
docker-compose exec api sh                            # API container shell
docker-compose exec worker bash                       # Worker container shell
```

### `reset-db` — Destroy and recreate the database
```bash
docker-compose down -v   # Removes volumes (destroys data)
docker-compose up -d --build
```
Warning: This deletes all data including imported OSM data. Re-seed required.

## Troubleshooting

1. **Container won't start** — Check `docker-compose logs <service>` for error messages
2. **Port conflict** — Another process using 5432/8000/5678. Find with `lsof -i :<port>`
3. **Database connection refused** — Wait for `db` container to be fully ready before starting `api`
4. **Out of disk space** — Clean unused images: `docker system prune`
5. **Worker can't connect to DB** — Verify `DATABASE_URL` in `.env` uses `db` as hostname (Docker network)

## Health Checks

After starting, verify the stack:
```bash
# API responds
curl http://localhost:8000/health

# Database has PostGIS
docker-compose exec db psql -U wildspotter -c "SELECT PostGIS_version();"

# n8n is accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:5678
```
