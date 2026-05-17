#!/usr/bin/env bash
set -euo pipefail

# Deploy the legal monitoring pipeline to the CX43 production server.
# All operations are backwards-compatible — no downtime, no existing table mods.

REMOTE="${DEPLOY_HOST:-wildspotter}"
REMOTE_DIR="${DEPLOY_DIR:-/opt/wildspotter}"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== Legal Pipeline Deploy ==="
echo "Target: $REMOTE:$REMOTE_DIR"
echo ""

# 1. Run migration on prod DB
echo "[1/5] Applying database migration..."
scp db/migrations/002_legal_pipeline.sql "$REMOTE:/tmp/002_legal_pipeline.sql"
ssh "$REMOTE" "docker exec -i \$(docker ps -qf name=wildspotter.*db) psql -U \$POSTGRES_USER -d \$POSTGRES_DB < /tmp/002_legal_pipeline.sql && rm /tmp/002_legal_pipeline.sql"
echo "  Migration applied."

# 2. Upload bootstrap data (if available)
BOOTSTRAP_FILE="data/legal/bootstrap_results.sql"
if [ -f "$BOOTSTRAP_FILE" ]; then
  echo "[2/5] Uploading bootstrap data..."
  scp "$BOOTSTRAP_FILE" "$REMOTE:/tmp/bootstrap_results.sql"
  ssh "$REMOTE" "docker exec -i \$(docker ps -qf name=wildspotter.*db) psql -U \$POSTGRES_USER -d \$POSTGRES_DB < /tmp/bootstrap_results.sql && rm /tmp/bootstrap_results.sql"
  echo "  Bootstrap data loaded."
else
  echo "[2/5] No bootstrap file found at $BOOTSTRAP_FILE — skipping."
fi

# 3. Upload decree JSONs
echo "[3/5] Uploading decree data..."
scp -r data/legal/decrees "$REMOTE:$REMOTE_DIR/data/legal/"
echo "  Decree data uploaded."

# 4. Rebuild and deploy legal-watcher + updated worker
echo "[4/5] Deploying containers..."
ssh "$REMOTE" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE build worker && docker compose -f $COMPOSE_FILE up -d worker"

if ssh "$REMOTE" "grep -q legal-watcher $REMOTE_DIR/$COMPOSE_FILE 2>/dev/null"; then
  ssh "$REMOTE" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE up -d legal-watcher"
  echo "  legal-watcher started."
else
  echo "  Warning: legal-watcher not in $COMPOSE_FILE — add it manually."
fi

# 5. Verify
echo "[5/5] Verifying health..."
sleep 5
HEALTH=$(ssh "$REMOTE" "curl -sf http://localhost:8001/legal/health 2>/dev/null || echo 'UNREACHABLE'")
echo "  Health: $HEALTH"

echo ""
echo "=== Deploy Complete ==="
echo "Next steps:"
echo "  - Check health: ssh $REMOTE 'curl localhost:8001/legal/health'"
echo "  - View sources: ssh $REMOTE 'curl localhost:8001/legal/sources'"
echo "  - View logs: ssh $REMOTE 'docker compose -f $COMPOSE_FILE logs -f legal-watcher'"
