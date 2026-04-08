# WildSpotter — Monetization Plan

> Reference document for post-launch monetization strategy.

## Strategy: Open-Source App + Paid Data Access

Open-source the React Native client to build community trust. Monetize via tiered API access to the pre-processed spot database. The vanlife community is skeptical of commercial spot apps — transparency in the client code signals we're not harvesting location data.

## Infrastructure Costs

### Base Server (Hetzner CX41)

| Resource | Spec | Monthly Cost |
|----------|------|-------------|
| VPS | 4 vCPU, 16GB RAM, 160GB disk | 15.90 |
| Volume storage | 100GB (satellite tiles + OSM) | 4.80 |
| Backups | Automated daily | 3.80 |
| Domain + DNS | Cloudflare free + .app domain | ~1.00 |
| **Total** | | **~25/mo** |

### Scaling Thresholds

| Monthly Active Users | Server Needs | Est. Cost/mo |
|---------------------|-------------|-------------|
| 1-500 | CX41 single server | 25 |
| 500-2,000 | CX41 + CDN for tiles | 35 |
| 2,000-10,000 | Dedicated + read replica | 80-100 |
| 10,000+ | Multiple servers + LB | 150-200 |

### Why Costs Stay Low

All heavy processing (terrain, legal, AI, context scoring) runs once during the pipeline and results are stored in PostgreSQL. Serving users is pure read traffic — PostGIS spatial queries run in ~5ms. The marginal cost per additional user is effectively zero until hitting server capacity.

### Ongoing Data Maintenance

| Task | Frequency | Extra Cost |
|------|-----------|-----------|
| OSM diff updates | Daily (n8n automated) | 0 (CPU time) |
| Pipeline on new spots | Weekly | 0 (same server) |
| Satellite tile refresh | Yearly (PNOA cycle) | 0 (free data) |
| Legal data refresh | Quarterly | 0 (WMS is free) |

## Pricing Tiers

> **Positioning rationale:** WildSpotter's marketing campaign (see `marketing-path/marketing-strategy.md`) hammers legal data and fear-of-fines as the #1 differentiator. Gating legal info would break the promise on first app open and destroy trust. Legal data, full scores, and context details are therefore **fully free**. The paid tier is built around the actual vanlife pain points: **offline access** (the road is off-grid) and **satellite previews** (visual validation before driving hours to a spot).

### Free — "Scout"

- Unlimited map browsing with spot markers (color-coded by score)
- Unlimited spot detail views
- Full composite score + breakdown (terrain / AI / context sub-scores)
- **Full legal details** — zone name, distance, land classification (Natura 2000, Parques, Ley de Costas, Catastro)
- Full context details (road noise, scenic value, privacy, urban density)
- Google Maps deep links (Inspect / Navigate)
- Subtle "Early Access" badge

### Paid — "Explorer" (4.99/mo or 34.99/yr)

- **Offline cache** — save regions for off-grid use (the killer feature)
- **Satellite previews** — high-res PNOA orthophoto tile for every spot
- Advanced filters (max slope, min score, hide restricted, surface type combos)
- Priority support
- No ads, ever

### Early-Bird Annual — "Pioneer" (24.99/yr, first 500 users)

- Everything in Explorer
- Locked-in price **forever** (never increases on renewal)
- Available only to users who joined during Early Access (via waitlist)
- Creates launch urgency, builds the paid base fast, no permanent free-rider liability
- **Lifetime tier deliberately removed at launch** — revisit in year 2 once churn data exists

## Feature Gating

All gating is API-side. No client-side DRM needed.

| Feature | Scout (Free) | Explorer (Paid) |
|---------|-------------|----------------|
| Map + markers | Yes | Yes |
| Spot views | Unlimited | Unlimited |
| Full score + breakdown | Yes | Yes |
| Legal details (all zones) | Yes | Yes |
| Context details | Yes | Yes |
| Google Maps links | Yes | Yes |
| **Satellite preview image** | No | Yes |
| **Offline area cache** | No | Yes |
| **Advanced filters** | No | Yes |

Implementation: free tier API responses omit `satellite_image_path`. Offline cache endpoints (`/offline/download-region`) require an authenticated paid entitlement. Advanced filter query params are rejected for free tier with a 402 upgrade prompt. Entitlements resolved via RevenueCat webhook → `user_entitlements` table.

## Revenue Projections (Conservative)

| Timeline | Free Users | Pioneer (€24.99/yr) | Explorer Monthly | Explorer Yearly | Monthly Revenue |
|----------|-----------|---------------------|------------------|-----------------|----------------|
| 6 months | 500 | 40 | 15 | 20 | ~210 |
| 1 year | 2,000 | 100 | 40 | 80 | ~490 |
| 2 years | 5,000 | 200 (locked) | 90 | 250 | ~1,050 |

**Break-even point: ~6 paying users covers the base server cost.**

## Pricing Rationale

- **€4.99/mo, €34.99/yr** — higher than v1's €3.99 because the marketing campaign positions WildSpotter as a serious radar tool with proprietary AI + legal data. Under-pricing would undermine the authority the video campaign builds. Still well below Gaia GPS (€40/yr) or onX Offroad (€30/yr), which is the real comparison set — not Park4night.
- **€24.99/yr Pioneer tier** — only for Early Access waitlist users, locked forever. Creates urgency, rewards trust, and builds the paid base rapidly. Capped at 500 slots to preserve scarcity.
- **Lifetime tier removed at launch** — lifetime tiers create permanent server-cost liabilities for data products with ongoing refresh cycles (OSM diffs, PNOA updates, AI re-inference). Revisit in year 2 if churn data justifies it.
- **Legal data is FREE** — the marketing campaign hammers "cross-checked with 4 official sources" as the core trust signal. Gating it would break the video promise and tank conversion.
- **Offline cache + satellite previews are the paid killer features** — vanlifers are off-grid most of the time (offline is essential) and want to visually validate a spot before driving hours (satellite previews are high-perceived-value, low-marginal-cost to serve).

## Payment Infrastructure (TBD)

Options to evaluate at implementation time:
- **RevenueCat** — handles iOS/Android in-app subscriptions, free up to $2.5k MRR
- **Stripe** — if web-only or for lifetime purchases outside app stores
- **App Store / Google Play billing** — required for in-app purchases (30% cut, 15% for small business program)

## Notes

- All prices in EUR. Adjust per market if expanding beyond Spain.
- App Store small business program (15% commission) applies under $1M annual revenue.
- Lifetime tier should be re-evaluated after 1 year of data on churn rates.
