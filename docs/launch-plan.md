# WildSpotter — Pre-Launch Plan

> Detailed roadmap from current state to public launch, with reasoning for each decision.

## 1. Launch Strategy: Free Early Access → Monetize Later

### Decision

Launch WildSpotter as a **free "Early Access"** app. All features unlocked, no paywall. Implement monetization 2-3 months after launch based on real usage data.

### Reasoning

| Factor | Rationale |
|--------|-----------|
| **Low burn rate** | €25/mo server (Hetzner CX41) + €80 one-time AI processing = ~€105 total. Sustainable for months without revenue. |
| **Community trust** | The vanlife community is skeptical of paid spot apps. Free launch builds organic word-of-mouth in forums, Reddit, and Instagram — the channels where vanlifers actually discover tools. |
| **Product validation** | We don't yet know if users prefer WildSpotter over Park4night/iOverlander for daily use. Free access maximizes trial volume and feedback quality. |
| **Architecture supports it** | Feature gating is API-side (see `monetization-plan.md`). We can activate paid tiers server-side without any app update. Zero wasted dev work. |
| **Revenue is marginal early on** | Conservative projections: €155/mo at 6 months. Monetizing on day 1 adds complexity without meaningful revenue while reducing potential user volume. |
| **Better pricing data** | Real usage patterns will reveal which features to gate and at what limits (e.g., is 3 spot views/day too generous or restrictive?). |

### What "Early Access" Means

- Full Explorer-tier features for all users (unlimited views, full score breakdown, legal details, satellite previews)
- Subtle "Early Access" badge in the app (signals it's a preview, sets expectations)
- No paywall, no ads, no data gating
- Feedback mechanism to collect user input

---

## 2. Cost Breakdown

### One-Time Launch Costs

| Item | Cost | Notes |
|------|------|-------|
| Claude Haiku AI satellite processing | ~€80 | Processes all candidate spots through Satellite Eye pipeline. Results stored permanently in PostgreSQL. |
| **Total one-time** | **~€80** | |

### Store Registration Costs (One-Time)

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | €99/yr | Required to build, test on devices, and publish to App Store |
| Google Play Developer | €25 | One-time registration fee to publish on Google Play |
| **Total store fees** | **~€124** | Apple renews annually |

### Recurring Monthly Costs

| Item | Cost | Notes |
|------|------|-------|
| Hetzner CX41 VPS | €15.90 | 4 vCPU, 16GB RAM, 160GB disk |
| Volume storage (100GB) | €4.80 | Satellite tiles + OSM data |
| Automated backups | €3.80 | Daily |
| Domain (.app) + DNS | ~€1.00 | Cloudflare free tier |
| **Total monthly** | **~€25/mo** | Plus ~€8/mo amortized Apple renewal |

### Runway

At €25/mo, with no paying users, the project can run indefinitely at minimal cost. Break-even requires only **7 paying Explorer users** once monetization is activated.

---

## 3. Pre-Launch Checklist

### Phase 0 — Pipeline Completion ⚙️
> **Goal:** Ensure all spots are fully processed and the data is production-quality.

- [ ] **Run full pipeline on all candidate spots**
  - Terrain → Legal → AI (Claude Haiku) → Context → Scoring
  - Monitor via the worker dashboard (`http://localhost:8001/dashboard`)
  - Budget: ~€80 for Claude Haiku API calls on the AI stage
  - Expected: all spots reach `status = 'completed'` with `composite_score`
- [ ] **Spot-check pipeline accuracy**
  - Pick 10-15 spots you can physically verify (or verify via Google Maps Street View)
  - Check: Is the slope data reasonable? Is the legal status correct? Does the AI score match the satellite image?
  - Document any systematic errors for post-launch fixes
- [ ] **Verify API data quality**
  - Query `GET /spots` with bounding boxes across different Spanish regions
  - Confirm scores, legal status, and satellite images are populated
  - Check edge cases: coastal areas, mountain zones, urban fringes

---

### Phase 1 — Production Infrastructure 🏗️
> **Goal:** Move from local Docker development to a live production server.

- [ ] **Provision Hetzner CX41 server**
  - Ubuntu 22.04, Docker + Docker Compose installed
  - Open ports: 22 (SSH), 80/443 (reverse proxy), 8000 (API — behind proxy)
  - Lock down ports 5432, 5678, 8001 to internal/VPN only
- [ ] **Set up domain and DNS**
  - Register/configure domain (e.g., `api.wildspotter.app`)
  - Cloudflare DNS pointing to Hetzner server
  - SSL via Caddy or Nginx + Let's Encrypt
- [ ] **Deploy Docker Compose stack to production**
  - Copy `docker-compose.yml`, `backend/`, `workers/`, `db/` to server
  - Configure `.env` with production passwords (not dev defaults)
  - `docker-compose up -d --build`
  - Verify `GET /health` returns 200 from public URL
- [ ] **Import database to production**
  - Transfer the fully-processed PostgreSQL database (pg_dump/pg_restore)
  - Verify spot counts and completed status match local
- [ ] **Set up reverse proxy**
  - Caddy or Nginx in front of Fastify API (port 8000)
  - HTTPS termination, automatic cert renewal
  - CORS configured for the mobile app domain
- [ ] **Set up automated backups**
  - Hetzner automated daily backups (€3.80/mo)
  - Optional: pg_dump cron to a separate volume for extra safety

---

### Phase 2 — Observability, Feedback & In-App Features 📊💬
> **Goal:** Integrate crash reporting, analytics, and user feedback mechanisms into the app *before* building store binaries. These are app-side code changes that don't require a live production server.

- [x] **Crash reporting — Sentry (free tier)** ✅
  - Installed `@sentry/react-native` with Expo plugin in `app.json`
  - `src/services/sentry/index.ts` — DSN via `EXPO_PUBLIC_SENTRY_DSN` env var, environment tagging (dev/prod via `__DEV__`)
  - Wraps root layout with `Sentry.wrap()` for error boundary + performance monitoring
  - Disabled by default when DSN is placeholder — set env var to activate
- [x] **Basic analytics — PostHog (free tier)** ✅
  - Installed `posthog-react-native`, configured via `EXPO_PUBLIC_POSTHOG_API_KEY` env var
  - `src/services/analytics/index.ts` — thin wrapper with `initAnalytics()` + `trackEvent()`
  - Events tracked: `app_opened`, `area_scanned`, `spot_viewed`, `spot_navigated`, `spot_inspected`, `config_changed`
  - Note: `offline_area_saved` not yet tracked (offline cache feature not implemented)
- [x] **In-app feedback button** ✅
  - "Send Feedback" card in Config → About section (`src/components/config/AboutSection.tsx`)
  - Opens `mailto:feedback@wildspotter.app?subject=WildSpotter Feedback`
  - Styled with mail icon, hint text, chevron — matches existing card pattern
- [x] **Report bad spots** ✅
  - `spot_reports` table added to `db/init.sql` (UUID PK, FK to spots, category enum, optional comment)
  - `POST /reports` endpoint in `backend/src/routes/reports.ts` with JSON Schema validation
  - `ReportModal` component (`src/components/spots/ReportModal.tsx`) — slide-up modal with 6 categories + comment
  - Subtle "Report" link at bottom of spot detail screen
  - i18n keys added for both EN and ES

---

### Phase 2.5 — Waitlist Landing Page 🌐
> **Goal:** Build a single-page waitlist site that catches the TikTok/Reels campaign traffic while the App Store review is pending. This is the connective tissue between the marketing campaign and monetization — without it, video traffic leaks into the void.
> **Full spec:** See `docs/landing-spec.md`.

- [x] **Build landing page** ✅ — Astro + Preact, ES/EN, hero video, email form, Pioneer counter, Problem/Pipeline/Legal/Offer/CTA sections
- [x] **Set up email storage** ✅ — Cloudflare D1 `wildspotter-waitlist` with `waitlist` table (migration `0001_waitlist.sql`)
- [x] **Deploy to Cloudflare Pages** ✅ — live at `https://wildspotter.app`, Pages Functions for `/api/subscribe`, `/api/confirm`, `/api/pioneer-count` + scheduled cleanup Worker
- [x] **Double opt-in email confirmation** ✅ — Resend (`hola@wildspotter.app`), verified end-to-end 2026-04-08 (Pioneer #1 assigned on confirm)
- [ ] **Analytics** — Plausible or PostHog tracking form submit, scroll depth, video play
- [x] **Social meta tags** ✅ — OpenGraph + Twitter card in `Base.astro`
- [ ] **Launch before marketing campaign week 1** — all video CTAs point here, not to the App Store

---

### Phase 3 — App Store Readiness 📱
> **Goal:** Prepare the React Native app for public distribution. At this point the binary already includes Sentry, analytics, and feedback features from Phase 2.

- [ ] **Update API base URL**
  - Switch `src/constants/` from `localhost:8000` to production API URL
  - Use environment variable or build-time config for dev/prod toggle
- [ ] **Test on real devices**
  - iOS: build with `eas build --platform ios` (requires Apple Developer Program, €99/yr)
  - Android: build with `eas build --platform android` (requires Google Play Developer account, €25 one-time)
  - Test all flows: map browsing, area scanning, spot detail, Google Maps deep links, offline cache, Sentry crash capture, analytics events firing
- [ ] **App Store assets** (partially done)
  - [ ] Screenshots (6.7" iPhone, 6.5" iPhone, Android phone + tablet) — TODO: capture from live app
  - [x] App icon (1024x1024) — `assets/icon.png` ✅ (warm earthy gradient, map pin/mountain mark)
  - [x] App Store description + keywords — `docs/appstore-description.md` ✅ (EN, iOS + Google Play formats, ASO-optimized keywords)
  - [x] Privacy policy — `docs/privacy-policy.md` ✅ (covers location, analytics, crash reports, GDPR)
- [x] **Add "Early Access" badge** ✅
  - Pill badge next to version string in Config → About section
  - Muted border, JetBrains Mono 10px — subtle, non-intrusive
  - i18n: "Early Access" (EN) / "Acceso Anticipado" (ES)
- [ ] **Submit to App Store / Google Play**
  - Apple: ~1-3 day review process
  - Google: ~1-7 day review process
  - Category: Travel & Navigation

---

### Phase 4 — Server Monitoring & Community 📡
> **Goal:** Set up production-side observability (requires live server from Phase 1) and community channels.

- [ ] **Server monitoring**
  - Uptime check on `/health` endpoint (UptimeRobot free tier or Hetzner built-in)
  - Docker container health monitoring (restart policy in docker-compose)
  - Disk usage alerts (satellite tiles will grow)
- [ ] **API logging**
  - Log request volume, response times, error rates
  - Fastify built-in logging with `pino` is already available
  - Monitor for slow PostGIS queries (should be <5ms for bbox queries)
- [ ] **Social / community presence**
  - Instagram: `@wildspotter` — share scenic spots, behind-the-scenes of the tech
  - TikTok: `@wildspotter` — primary channel for video strategy (see `marketing-path/marketing-strategy.md`)
  - iOverlander/Park4night forums — position as complementary, not competitive

---

### Phase 5 — Marketing & Launch Day 🚀
> **Goal:** 500+ waitlist signups during Early Access, then 100+ app installs within 2 weeks of store approval.
> **Full video strategy:** See `marketing-path/marketing-strategy.md` for the 4-week TikTok/Reels content calendar, produced videos, and creative concepts.
> **CTAs point to the waitlist landing page (Phase 2.5), NOT directly to the App Store.** This absorbs the risk of store review delays and builds a mailing list for the monetization launch.

- [ ] **Hook variation budget** — for each of the 4 produced videos, render **2-3 opening-3s variations** (different hook text, different opening footage). TikTok algo rewards variation testing. Assume 3 of 4 videos will underperform — iterate on hooks, not bodies.
- [ ] **TikTok + Instagram Reels campaign** (videos already produced in `marketing-path/`)
  - Week 1 (Agitate the problem): "El Parking Lleno", Natura 2000 micro-clip, "La Multa de 600€"
  - Week 2 (Reveal the solution): "87 Spots", pipeline BTS, hook variations
  - Week 3 (Product demo): "El Pipeline" tech flex, real screen recordings
  - Week 4 (Social proof): Real scan results, community engagement, aspirational compilation
  - Render final videos: `npx remotion render ParkingLleno out/parking-lleno.mp4` (etc.)
  - Set up Instagram `@wildspotter` and TikTok accounts before launch week
- [x] **App Store Optimization (ASO)** ✅ — see `docs/appstore-description.md`
  - Title: "WildSpotter — Wild Spot Finder"
  - Subtitle: "AI Vanlife Radar for Spain"
  - Keywords: vanlife,wild camping,Spain,free camping,overnight parking,overlanding,camper spots,off grid,van life,road trip (99 chars)

---

## 4. Post-Launch: The Path to Monetization

### Weeks 1-8: Free period — data collection

| What to Monitor | Why | Tool |
|-----------------|-----|------|
| Daily Active Users (DAU) | Is anyone coming back after day 1? | PostHog/Plausible |
| Spots viewed per session | How engaged are users? | Analytics events |
| Offline saves per user | Validates offline cache as premium feature | Analytics events |
| Geographic heat map of scans | Are users exploring all of Spain or just coastal areas? | API logs |
| Feedback reports | What's broken or inaccurate? | Feedback forms |
| App Store ratings | Are users happy? Are there deal-breaker bugs? | App Store Connect / Google Play Console |

### Weeks 8-10: Analyze and decide

Based on real data, finalize:

1. **Free tier limits** — e.g., is 3 spot views/day the right number, or should it be 5?
2. **Premium killer feature** — is it offline cache, or full score breakdown, or satellite previews?
3. **Pricing validation** — €3.99/mo still feel right based on comparable apps users mention?
4. **Conversion trigger** — what moment makes users want more? (hitting the daily limit? seeing a blurred satellite preview?)

### Weeks 10-12: Implement monetization

- [ ] Integrate RevenueCat (handles iOS + Android subscription management, free under $2.5k MRR)
- [ ] Implement API-side feature gating (per `monetization-plan.md` §Feature Gating)
- [ ] Add upgrade flow in the app (when free user hits a gated feature)
- [ ] Grandfather early users: "You've been with us since Early Access — get 50% off your first year"
- [ ] Announce paid tiers via in-app notification + email (if collected)

### Pricing Tiers (see `monetization-plan.md`)

| Tier | Price | Gated Features |
|------|-------|----------------|
| Scout (Free) | €0 | Everything EXCEPT satellite previews, offline cache, advanced filters. Full legal data, full scores, full context — all free. |
| Explorer | €4.99/mo or €34.99/yr | Offline cache, satellite previews, advanced filters |
| Pioneer (Early Access only) | €24.99/yr, locked forever | Same as Explorer. First 500 waitlist signups only. |

> Lifetime tier removed at launch. Legal data is deliberately free — it's the marketing campaign's core trust signal, gating it would break the promise.

---

## 5. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Nobody downloads the app | The €25/mo cost is low enough to sustain while iterating. Reddit/vanlife communities are highly receptive to free tools — the launch posts will get traction. |
| Pipeline data is inaccurate | Spot-check before launch (Phase 0). User reports post-launch create a feedback loop for continuous improvement. |
| Server goes down | Hetzner automated backups + Docker restart policies. Single-server failure recovers in minutes. |
| Apple/Google reject the app | Category is Travel/Navigation, no controversial content. Main risk is missing privacy policy — prepare one in advance. |
| Users expect the app to stay free forever | "Early Access" branding + subtle messaging about upcoming premium tiers sets expectations from day 1. |
| Claude Haiku API costs spike | AI processing is a one-time batch job. Once processed, results are stored in PostgreSQL. No per-user AI cost. |
| Competitor launches similar product | WildSpotter's moat is the processed dataset. Running the full pipeline on all of Spain takes weeks + ~€80 in AI costs — not trivially replicable. |

---

## 6. Timeline Overview

```
April 2026
├── Week 1: Phase 0 — Run full pipeline, verify data quality
│           Phase 2 — Sentry, analytics, feedback button (done)
│           Phase 2.5 — Waitlist landing page (Cloudflare Pages + D1 + Resend)
├── Week 2: Phase 1 — Deploy to Hetzner, set up domain + SSL
│           Phase 4 — Server monitoring
│           Phase 5 — Render hook variations for all 4 videos
├── Week 3: 🚀 WAITLIST LAUNCH — TikTok/Reels campaign week 1, all CTAs → landing
│           Phase 3 — Build app binaries, App Store assets
├── Week 4: TikTok/Reels week 2 + Phase 3 store submission

May 2026
├── Week 1-2: TikTok/Reels weeks 3-4, waitlist growing, store review
├── Week 3: 📱 APP LAUNCH — email waitlist with Pioneer €24.99/yr offer
├── Week 4: Monitor installs, convert waitlist → Pioneers

June-July 2026
├── Analyze usage data
├── Decide final monetization gating
└── Implement RevenueCat + paid tiers
```

---

## References

- [SPEC_V2.md](../SPEC_V2.md) — Full product specification
- [monetization-plan.md](monetization-plan.md) — Pricing tiers and revenue projections
- [backend-architecture.md](backend-architecture.md) — Docker stack and API documentation
- [refactoring_plan.md](refactoring_plan.md) — Technical implementation plan
