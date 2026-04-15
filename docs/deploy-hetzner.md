# Deploy Runbook — Hetzner CX43 (Phase 1)

Checklist for bringing `api.wildspotter.app` and `api-stage.wildspotter.app` live on a single CX43 box. Follow top to bottom on a fresh machine.

## 0. Prereqs (local)

- A working local stack with a populated `pgdata` volume (your processed spots).
- Domain `wildspotter.app` under Cloudflare DNS (already set up for the landing page).
- SSH key ready to paste into Hetzner Cloud Console.

## 1. Provision the server

1. Hetzner Cloud Console → **New Server**
   - Image: **Ubuntu 22.04**
   - Type: **CX43** (8 vCPU / 16 GB / 160 GB SSD, successor to retired CX41)
   - Location: `nbg1` (Nürnberg) — fsn1 was disabled at provision time (2026-04-15)
   - SSH key: paste your public key
   - Backups: **enable** (+€2.90/mo — 20% of server price, takes daily snapshots)
   - Name: `wildspotter-prod-1`
2. Note the public IPv4 — you'll need it for DNS.

## 2. DNS records (Cloudflare)

Add two **A** records, proxy status **DNS only** (grey cloud — Caddy handles TLS, and Cloudflare proxying would break Let's Encrypt TLS-ALPN):

| Type | Name          | Content          | Proxy |
| ---- | ------------- | ---------------- | ----- |
| A    | `api`         | `<hetzner-ipv4>` | Off   |
| A    | `api-stage`   | `<hetzner-ipv4>` | Off   |

Wait ~1 min, verify with `dig api.wildspotter.app +short`.

## 3. Server base setup

SSH in as root:

```bash
ssh root@<hetzner-ipv4>
```

Create a non-root user and harden:

```bash
adduser --disabled-password --gecos "" wildspotter
usermod -aG sudo wildspotter
rsync --archive --chown=wildspotter:wildspotter ~/.ssh /home/wildspotter
```

Firewall (only SSH + HTTP + HTTPS):

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp    # Caddy uses HTTP/3 (QUIC) on UDP 443
ufw enable
```

Disable root SSH + password auth:

```bash
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

From now on: `ssh wildspotter@<ip>`.

## 4. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker wildspotter
```

Log out and back in so the group change takes effect. Verify: `docker compose version`.

## 5. Clone the repo

```bash
cd ~
git clone https://github.com/<your-org>/wildspotter.git
cd wildspotter
```

## 6. Create env files

```bash
cp .env.prod.example .env.prod
cp .env.stage.example .env.stage
```

Generate strong passwords:

```bash
openssl rand -base64 32   # paste into POSTGRES_PASSWORD (remember to update DATABASE_URL too)
openssl rand -base64 24   # paste into N8N_BASIC_AUTH_PASSWORD
```

Edit both `.env.prod` and `.env.stage` with real values. Double-check `DATABASE_URL` matches the Postgres creds — mismatch is the most common first-boot failure.

## 7. Bring up prod

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml -p wildspotter-prod up -d --build
```

Watch boot:

```bash
docker compose -p wildspotter-prod logs -f api
docker compose -p wildspotter-prod logs -f caddy
```

Caddy will fetch a Let's Encrypt cert on first HTTPS hit — this takes 5–30 s. If DNS isn't propagated yet the cert issuance will fail and retry; wait and curl again.

## 8. Restore the database from local

On your **local machine**, dump the populated DB:

```bash
docker compose exec -T db pg_dump -U wildspotter -d wildspotter -Fc -f /tmp/wildspotter.dump
docker compose cp db:/tmp/wildspotter.dump ./wildspotter.dump
```

Copy to the server:

```bash
scp wildspotter.dump wildspotter@<hetzner-ipv4>:~/wildspotter/
```

On the **server**, restore:

```bash
cd ~/wildspotter
docker compose -p wildspotter-prod cp wildspotter.dump db:/tmp/wildspotter.dump
docker compose -p wildspotter-prod exec -T db \
  pg_restore -U wildspotter -d wildspotter --clean --if-exists --no-owner /tmp/wildspotter.dump
```

If you hit a Postgres major-version mismatch (e.g. local is 15, prod image is 16), re-dump with `pg_dump --format=plain` and pipe through `psql` instead of `pg_restore`. `pg_restore -Fc` is version-tolerant in one direction only (older → newer).

Restart the API so it picks up the now-populated DB:

```bash
docker compose -p wildspotter-prod restart api
```

## 9. Bring up stage

Attach stage services to the same Caddy network:

```bash
docker compose --env-file .env.stage \
  -f docker-compose.prod.yml -f docker-compose.stage.overrides.yml \
  -p wildspotter-stage up -d --build
```

Stage starts with an empty DB. To seed a trimmed subset:

```bash
# Dump just the last 10k spots locally
docker compose exec db pg_dump -U wildspotter -d wildspotter \
  --data-only --table=spots \
  --where="created_at > NOW() - INTERVAL '30 days'" \
  -Fc -f /tmp/spots-subset.dump
# scp + pg_restore into the stage db following the same pattern as step 8.
```

## 10. Verify

```bash
curl -I https://api.wildspotter.app/health
curl -I https://api-stage.wildspotter.app/health
```

Both should return `200 OK` with `strict-transport-security` in the headers.

Check TLS grade at https://www.ssllabs.com/ssltest/analyze.html?d=api.wildspotter.app (expect A).

## 11. Logs

```bash
docker compose -p wildspotter-prod logs -f api
docker compose -p wildspotter-prod logs -f worker
docker compose -p wildspotter-prod logs -f caddy
docker compose -p wildspotter-stage logs -f api
```

Caddy access logs are written to the `caddy_data` volume: `docker compose -p wildspotter-prod exec caddy cat /data/access.log`.

## 12. Backups

Hetzner automatic backups are already enabled (step 1). They run daily and retain 7 snapshots. In addition, set up a nightly `pg_dump` to cover schema-level mistakes:

```bash
mkdir -p ~/backups
crontab -e
```

Add:

```cron
0 3 * * * cd ~/wildspotter && docker compose -p wildspotter-prod exec -T db pg_dump -U wildspotter -d wildspotter -Fc > ~/backups/wildspotter-$(date +\%F).dump && find ~/backups -name 'wildspotter-*.dump' -mtime +14 -delete
```

Keeps 14 nightly dumps on disk. For offsite storage, `rclone copy` to Backblaze B2 (~€0.005/GB/mo).

## 13. Routine ops

- Deploy new code: `git pull && docker compose -p wildspotter-prod -f docker-compose.prod.yml up -d --build api worker`
- Deploy to stage first: same but `-p wildspotter-stage -f docker-compose.prod.yml -f docker-compose.stage.overrides.yml`
- Rotate secrets: update `.env.prod`, `docker compose -p wildspotter-prod up -d` (restarts only changed services)
- Connect to prod DB: `docker compose -p wildspotter-prod exec db psql -U wildspotter`
- Reload Caddyfile without downtime: `docker compose -p wildspotter-prod exec caddy caddy reload --config /etc/caddy/Caddyfile`
