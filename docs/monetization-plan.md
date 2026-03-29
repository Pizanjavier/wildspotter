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

### Free — "Scout"

- Unlimited map browsing with spot markers (color-coded by score)
- 3 full spot detail views per day
- Composite score number only (no breakdown)
- Legal status summary (restricted yes/no, no zone details)
- No offline mode
- Small non-intrusive upgrade banner

### Paid — "Explorer" (3.99/mo or 29.99/yr)

- Unlimited spot detail views
- Full score breakdown (terrain / AI / context sub-scores)
- Full legal details (zone name, distance, land classification)
- Satellite preview images
- Offline cache (save areas for off-grid use)
- Context details (road noise, scenic value, privacy, urban density)
- No ads

### One-Time — "Lifetime Explorer" (49.99)

- Everything in Explorer, permanently
- Targets the subscription-averse vanlife audience
- Breaks even vs. monthly after ~13 months per user

## Feature Gating

All gating is API-side. No client-side DRM needed.

| Feature | Scout (Free) | Explorer (Paid) |
|---------|-------------|----------------|
| Map + markers | Yes | Yes |
| Score (number) | Yes | Yes |
| Score breakdown | No | Yes |
| Legal summary (yes/no) | Yes | Yes |
| Legal details (zones) | No | Yes |
| Satellite preview | No | Yes |
| Context details | No | Yes |
| Offline cache | No | Yes |
| Spot views/day | 3 | Unlimited |
| Google Maps links | Yes | Yes |

Implementation: free tier API responses omit `context_details`, detailed `legal_status`, and `satellite_image_path` fields. Rate-limit full spot views to 3/day by device ID.

## Revenue Projections (Conservative)

| Timeline | Free Users | Paid Monthly | Paid Yearly | Lifetime | Monthly Revenue |
|----------|-----------|-------------|-------------|----------|----------------|
| 6 months | 500 | 20 | 30 | 15 | ~155 |
| 1 year | 2,000 | 50 | 100 | 50 | ~400 |
| 2 years | 5,000 | 100 | 300 | 150 | ~850 |

**Break-even point: ~7 paying users covers the base server cost.**

## Pricing Rationale

- **3.99/mo** is impulse-buy territory — below a coffee, well under Park4night premium (9.99/yr for less functionality)
- **29.99/yr** offers a ~37% discount vs. monthly, incentivizing annual commitment
- **49.99 lifetime** captures gear-minded vanlifers who budget for equipment, not subscriptions
- **Legal data partially free** (yes/no) because gating safety info would erode trust
- **Offline cache as killer paid feature** — vanlifers are often off-grid, this is the #1 reason to pay

## Payment Infrastructure (TBD)

Options to evaluate at implementation time:
- **RevenueCat** — handles iOS/Android in-app subscriptions, free up to $2.5k MRR
- **Stripe** — if web-only or for lifetime purchases outside app stores
- **App Store / Google Play billing** — required for in-app purchases (30% cut, 15% for small business program)

## Notes

- All prices in EUR. Adjust per market if expanding beyond Spain.
- App Store small business program (15% commission) applies under $1M annual revenue.
- Lifetime tier should be re-evaluated after 1 year of data on churn rates.
