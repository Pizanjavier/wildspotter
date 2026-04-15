---
name: hetzner-deploy
description: Provision and operate the WildSpotter Hetzner CX43 via the official hcloud CLI. Covers the single-server prod + stage topology defined in docs/deploy-hetzner.md.
argument-hint: [provision|status|ssh|firewall|snapshot|resize|cost]
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash
---

# Hetzner Deploy

Project-specific Hetzner operations for WildSpotter. The full deploy runbook lives in `docs/deploy-hetzner.md` — this skill is the operational companion: constants, common commands, and post-deploy maintenance.

## ⚠ Cost discipline — read first

WildSpotter is a hobby-grade €23/mo project. Hetzner charges by the hour the moment a resource exists — **creating then destroying a CX43 still costs ~€0.02**. Before any `hcloud *create*` call:

1. **Never create a second server.** Stage lives on the prod box via Docker — there is only one Hetzner server in this project.
2. **Never spin up extra volumes, floating IPs, or load balancers** without an explicit user ask. They're tiny charges individually but compound silently.
3. **Never `change-type` upward** (e.g. CX43 → CX53) without the user asking — disk upgrades are one-way and add recurring cost.
4. **If in doubt, dry-run.** `hcloud server create --help` shows flags without billing. Always check `hcloud server list` before any create to confirm the resource doesn't already exist.
5. **Snapshots cost ~€0.01/GB/mo.** Delete old snapshots with `hcloud image delete <id>` when their purpose is done.
6. **Ask before any recurring cost addition** (backup add-ons, volumes, extra IPs). One-time commands (resize, reboot) are fine.

This rule applies even when an agent or skill delegates to me — if a Hetzner create/resize command isn't covered by the user's explicit instruction, stop and ask.

## Project constants (do not change without updating `docs/deploy-hetzner.md`)

| Field | Value | Rationale |
|-------|-------|-----------|
| Server name | `wildspotter-prod` | Single box, prod + stage colocated |
| Type | `cx43` | 8 vCPU, 16 GB RAM, 160 GB disk — CX41 successor, €14.51/mo fsn1 (gross) |
| Image | `ubuntu-22.04` | LTS, matches runbook |
| Location | `nbg1` (Nürnberg, DE) | EU jurisdiction for GDPR on Spanish user data (fsn1 was disabled at provision time 2026-04-15) |
| SSH key name | `wildspotter-deploy` | Uploaded via `hcloud ssh-key create` |
| Firewall | `wildspotter-fw` | 22 (SSH), 80/tcp, 443/tcp, 443/udp (HTTP/3) |
| Backups | Enabled at create time (`--enable-backup`) | ~€2.90/mo (20% of server price) — Phase 1 requirement |
| Cost | ~€23/mo (server + backup + volume + DNS) | See `docs/monetization-plan.md` §Base Server |

## Setup (one-time)

```bash
# 1. Generate API token in Hetzner Cloud Console → Security → API Tokens (Read & Write)
# 2. Persist in ~/.zshenv (NOT ~/.zshrc — non-interactive subshells don't source .zshrc)
echo 'export HCLOUD_TOKEN=<paste-token>' >> ~/.zshenv

# 3. Verify (open new terminal, or source)
source ~/.zshenv && hcloud server-type describe cx43
```

Alternative: `hcloud context create wildspotter` (interactive prompt, stores in `~/.config/hcloud/cli.toml`).

## Actions

### `provision` — One-shot box creation

> Only run once. If the server already exists, abort — don't create duplicates.

```bash
# 1. Upload SSH key (once per key)
hcloud ssh-key create --name wildspotter-deploy --public-key-from-file ~/.ssh/id_ed25519_wildspotter.pub

# 2. Create the firewall
hcloud firewall create --name wildspotter-fw
hcloud firewall add-rule wildspotter-fw --direction in --protocol tcp --port 22    --source-ips 0.0.0.0/0 --source-ips ::/0
hcloud firewall add-rule wildspotter-fw --direction in --protocol tcp --port 80    --source-ips 0.0.0.0/0 --source-ips ::/0
hcloud firewall add-rule wildspotter-fw --direction in --protocol tcp --port 443   --source-ips 0.0.0.0/0 --source-ips ::/0
hcloud firewall add-rule wildspotter-fw --direction in --protocol udp --port 443   --source-ips 0.0.0.0/0 --source-ips ::/0

# 3. Create the server (triggers ~30s boot)
hcloud server create \
  --name wildspotter-prod \
  --type cx43 \
  --image ubuntu-22.04 \
  --location nbg1 \
  --ssh-key wildspotter-deploy \
  --firewall wildspotter-fw \
  --enable-backup

# 4. Grab IPv4 — set Cloudflare A records (DNS-only, grey cloud) for:
#    api.wildspotter.app       → <ipv4>
#    api-stage.wildspotter.app → <ipv4>
hcloud server ip wildspotter-prod
```

### `status` — Show server state + IPs

```bash
hcloud server list
hcloud server describe wildspotter-prod
```

### `ssh` — Connect as root

```bash
ssh root@$(hcloud server ip wildspotter-prod)
```
First connect triggers host-key prompt. Add a `Host wildspotter-prod` block in `~/.ssh/config` after first successful login.

### `firewall` — Inspect / update rules

```bash
hcloud firewall describe wildspotter-fw
# To add a rule (e.g. open Postgres to your home IP for emergency debug — remove after):
hcloud firewall add-rule wildspotter-fw --direction in --protocol tcp --port 5432 --source-ips <your.ip>/32
# To remove, re-apply the full rule set (hcloud firewall doesn't have per-rule delete by index; use replace-rules)
```

### `snapshot` — Manual point-in-time backup

```bash
hcloud server create-image wildspotter-prod --type snapshot --description "pre-$(date +%Y%m%d)-migration"
hcloud image list --type snapshot
```
Use before risky migrations. Automated daily backups (from `--enable-backup`) cover routine restore needs.

### `resize` — Upsize when traffic grows

Scaling thresholds from `docs/monetization-plan.md` §Scaling: CX43 handles up to ~500 MAU.

```bash
# Upgrade to CX53 (next size up — verify current pricing with `hcloud server-type list` first)
hcloud server shutdown wildspotter-prod
hcloud server change-type wildspotter-prod --type cx53 --upgrade-disk
hcloud server poweron wildspotter-prod
```
Disk cannot be downsized afterwards — `--upgrade-disk` is one-way.

### `cost` — Current monthly burn

```bash
hcloud server describe wildspotter-prod -o format='{{.ServerType.Prices}}'
```
Then tally: server type (see `hcloud server-type describe cx43`) + backup (20 % of server price) + volume (€4.80 per 100 GB) + floating IPs (€0 unless added).

## Gotchas specific to this project

1. **Cloudflare proxy OFF for API subdomains.** Orange cloud breaks Let's Encrypt TLS-ALPN in Caddy. Landing (`wildspotter.app`) stays proxied; `api.*` and `api-stage.*` are DNS-only (grey). Called out in `docs/deploy-hetzner.md:24`.
2. **UDP/443 is easy to miss.** Caddy serves HTTP/3 over QUIC. If it's missing, TLS still works but you lose the perf boost. Verify with `hcloud firewall describe wildspotter-fw | grep udp`.
3. **Backups snapshot the whole disk — including the Postgres volume.** Restore-from-backup gives you an exact replica (spots, satellite tiles, everything) but does not include changes since the last nightly snapshot. For data-only rollback, prefer the `pg_dump` cron described in the runbook.
4. **Let's Encrypt rate limit: 5 duplicate certs per domain per week.** Don't delete the `caddy_data` named volume unless you're prepared to re-issue and potentially hit the ceiling.
5. **Location matters for latency.** `fsn1` (Germany) adds ~40ms RTT to Spanish users vs. a hypothetical Madrid region — acceptable for an API, not for anything real-time. Hetzner has no Iberian region; if latency becomes a complaint, consider Hetzner `hel1` (Helsinki — no improvement) or moving to a CDN-cached endpoint for read traffic.

## Related files

- `docs/deploy-hetzner.md` — full step-by-step runbook (use first)
- `docker-compose.prod.yml` / `docker-compose.stage.overrides.yml` — the stack this server runs
- `Caddyfile` — reverse proxy config for both vhosts
- `.env.prod.example` / `.env.stage.example` — secrets template
