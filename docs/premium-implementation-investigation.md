# WildSpotter Premium — Implementation Investigation

> Deep technical investigation of every feature in [wildspotter-premium-plan.md](wildspotter-premium-plan.md). Covers effort, viability, cost, required infrastructure, and dependencies. Written to be referenced during development planning.
>
> **Related docs:**
> - [wildspotter-premium-plan.md](wildspotter-premium-plan.md) — Feature goals and product vision
> - [monetization-plan.md](monetization-plan.md) — Pricing tiers, feature gating strategy, revenue projections
> - [backend-architecture.md](backend-architecture.md) — Current Docker Compose stack and processing pipeline
> - [deploy-hetzner.md](deploy-hetzner.md) — Server topology (single CX43, 160GB + 100GB volume)
> - [legal-monitoring-pipeline.md](legal-monitoring-pipeline.md) — Legal pipeline (89 sources, 125+ documents)
> - [legal-pipeline-deep-investigation.md](legal-pipeline-deep-investigation.md) — Legal data source details
> - `SPEC_V3.md` — Data model, pipeline stages, scoring formula
>
> **Claude Code skills (installed):**
> - `fastify-best-practices` — Fastify lifecycle, hooks, auth, validation, CORS, performance. Use for Phase 0 auth routes, webhook endpoints, feature gating middleware.
> - `fastify-typescript` — Fastify + TypeScript patterns, validation, testing. Use for all backend API route development.
> - `revenuecat-purchase-flow` — RevenueCat SDK purchase/restore flow for React Native. Use for Phase 0 paywall, offerings, purchase error handling.
> - `postgis-skill` — PostGIS SQL tips and spatial query patterns. Use for Phase 3 Tap-to-Check (`ST_Intersects`, `ST_Transform`, `ST_DWithin`) and offline export queries.

---

## 0. Foundation: Auth, Payments & User Infrastructure

**This is the prerequisite for everything.** Today WildSpotter has zero user infrastructure — no `users` table, no auth, no entitlements, no payment integration. Every Premium feature depends on identifying the user.

### 0.1 Auth System

**Decision: Auth from day one.** Users must identify themselves to access Premium. This follows standard app patterns and unlocks all features (notifications, saved spots sync, circles) without a migration from anonymous-first later.

**Recommended approach: Social sign-in only (Apple + Google)**

- Apple Sign-In is **mandatory** on iOS if you offer any third-party login (Apple guideline 4.8).
- Google Sign-In covers Android and cross-platform users.
- No email/password — eliminates password reset flows, credential storage, brute-force protection, and GDPR headaches around storing passwords.
- Both providers return a verified email + stable user ID.

> **Apple email gotcha:** Apple only returns the user's email on the **first** `signInAsync()` call. Subsequent sign-ins return `null` for email. The backend `POST /auth/login` **must** persist the email on first contact — if it's missed, it's gone forever. The frontend should also cache it locally as a fallback.

**Account linking:** Users who sign in with Google on Android and later switch to iOS (or vice versa) need to link accounts. Match by verified email: if a user logs in with Apple and an existing `users` row has the same email from Google, prompt to link. This avoids duplicate accounts and preserves saved spots, entitlements, and circles across platforms.

**Account deletion (mandatory):** Apple guideline 5.1.1(v) **requires** that apps offering account creation must also offer account deletion within a reasonable time. Implement `DELETE /user/me` — cascades to `user_sessions`, `saved_spots`, `user_entitlements`, `coupon_redemptions`. The UI needs a "Delete Account" button in Config with a **confirmation dialog that lists what gets deleted** (saved spots, subscription entitlements, circle memberships) and a notice that **active subscriptions must be cancelled in the App Store / Play Store** — the backend can revoke the entitlement but not stop the recurring charge. RevenueCat subscriptions must also be revoked via their API. Add ~1 day to the auth estimate.

**Stack:**

| Layer | Technology | Notes |
|-------|-----------|-------|
| Apple Sign-In | `expo-apple-authentication` | iOS only — conditionally render on Android. Official Apple button UI required. |
| Google Sign-In | `@react-native-google-signin/google-signin` (**Universal Sign In** variant, not legacy) | Uses Credential Manager on Android, Google Sign-In SDK on iOS. The legacy Android SDK is deprecated — go straight to Universal. |
| Backend verification | Fastify 5 route `POST /auth/login` | Receives the provider token, verifies it against Apple/Google's public keys, issues a JWT |
| Session management | JWT (access token, 15min) + refresh token (stored in `user_sessions`, 30 days, rotated on every use) | Standard pattern, no session store needed for access tokens |
| Token storage on device | `expo-secure-store` | Encrypted keychain storage, not AsyncStorage. **~2KB value limit on iOS** — store only access token + refresh token, nothing larger. |

> **Skip `expo-auth-session`:** Expo's own docs recommend using native provider libraries (`expo-apple-authentication`, `@react-native-google-signin`) directly rather than routing through the generic AuthSession wrapper. AuthSession adds complexity without value when you only support two first-party providers.
>
> **`@react-native-google-signin` install gotcha:** This package is hosted on the **GitHub npm registry**, not npmjs.com. Before `npm install` works, you need a GitHub Personal Access Token with `packages:read` scope configured in `.npmrc`. This also affects EAS Build — the PAT must be set as an EAS secret. Budget ~0.5 days for this CI/CD plumbing.
>
> **Peer dependency:** If `expo-auth-session` is referenced anywhere transitively, it requires `expo-crypto` as a peer dep. Since we skip it, this shouldn't apply — but verify after install.

**Database schema:**

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider        VARCHAR(20) NOT NULL,       -- 'apple' | 'google'
    provider_id     VARCHAR(255) NOT NULL,       -- stable ID from provider
    email           VARCHAR(255),                -- may be null (Apple privacy relay) — MUST be persisted on first sign-in (Apple only sends it once)
    display_name    VARCHAR(100),
    role            VARCHAR(20) DEFAULT 'user',  -- 'user' | 'admin' | 'tester' — admin/tester bypass Premium gating
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(512) NOT NULL UNIQUE,
    device_info     JSONB,                       -- {platform, os_version, app_version}
    is_revoked      BOOLEAN DEFAULT false,       -- for refresh token rotation
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Limit stale sessions: users who reinstall or clear storage create orphaned sessions.
-- Run a cleanup job (cron or on-login) to keep max 5 active sessions per user,
-- revoking the oldest when exceeded.
CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, created_at)
    WHERE is_revoked = false;
```

**Refresh token rotation:** On every `POST /auth/refresh`, issue a new refresh token and revoke the old one (`is_revoked = true`). If a revoked token is presented, it indicates token theft — invalidate all sessions for that user (force re-login on all devices). This is zero extra effort since it's part of the auth route implementation, but must be in the design from day one. A stolen 30-day refresh token without rotation is a wide-open security window.

**Effort: ~6-8 days** (2 days backend auth routes + JWT + refresh rotation, 1 day account linking + deletion, 2 days mobile sign-in screens, 1-2 days testing on both platforms).

> **Skills:** Use `fastify-best-practices` for auth route design (hooks, preHandler, error handling) and `fastify-typescript` for typed route schemas and validation.

### 0.2 Payment System: RevenueCat

**What RevenueCat is:** A middleware layer between the app and Apple/Google's native billing systems. Apple and Google **require** that in-app subscriptions use their native APIs (StoreKit on iOS, Google Play Billing on Android) — you cannot use Stripe or external payment processors for subscriptions inside a mobile app. RevenueCat wraps both platforms into a single SDK, handles receipt validation, subscription lifecycle (renewals, cancellations, grace periods, refunds), and fires webhooks to your backend.

**Why not implement StoreKit + Google Play Billing directly:** 3-4 weeks of platform-specific code vs. ~2 days with RevenueCat. Receipt validation alone has dozens of edge cases (family sharing, subscription groups, billing retries, sandbox testing).

**Cost:** Free up to $2,500 MRR. After that, 1% of tracked revenue. Per [monetization-plan.md](monetization-plan.md), you won't hit this threshold until ~5x the 2-year revenue projection.

**Products to configure (in App Store Connect + Google Play Console + RevenueCat):**

| Product ID | Price | Availability | Notes |
|-----------|-------|-------------|-------|
| `explorer_monthly` | 4.99/mo | Public | Standard tier per [monetization-plan.md](monetization-plan.md) |
| `explorer_yearly` | 34.99/yr | Public | ~42% savings vs. monthly |
| `pioneer_yearly` | 24.99/yr | Hidden | Only shown to waitlist users via RevenueCat Offerings. See [monetization-plan.md](monetization-plan.md): capped at 500, locked price forever |

**Integration flow:**

```
User taps "Go Premium"
        |
        v
RevenueCat SDK presents native paywall
(Apple Pay / Google Pay sheet)
        |
        v
Apple/Google processes payment (they take 15% — small business program)
        |
        v
RevenueCat validates receipt, fires webhook
        |
        v
POST /webhooks/revenuecat on Fastify API
  -> verify webhook signature (Authorization header vs. shared secret)
  -> upserts user_entitlements table
  -> {user_id, tier, product_id, expires_at, is_active}
        |
        v
Gated API endpoints check entitlement:
  if no active entitlement -> 402 with upgrade prompt
```

**Webhook security:** RevenueCat signs webhooks with a shared secret sent in the `Authorization` header. The `/webhooks/revenuecat` endpoint **must** verify this before processing — without it, anyone can POST fake entitlement events and grant themselves Premium. This is a 1-hour implementation but a critical security requirement.

**CORS exemption:** The webhook endpoint receives server-to-server POSTs from RevenueCat's infrastructure, not browser requests. It must be **excluded from CORS restrictions**. Currently `@fastify/cors` is configured globally in `backend/src/index.ts` — either exempt the webhook route or configure CORS per-route for `/webhooks/*`.

**Idempotency (critical):** RevenueCat retries webhooks up to **5 times** with increasing delay, and duplicate events are possible even without retries. Every webhook handler **must be idempotent**. Use `INSERT ... ON CONFLICT (user_id, rc_customer_id) DO UPDATE` rather than plain `INSERT` — otherwise `INITIAL_PURCHASE` retries create duplicate entitlement rows. Add a `UNIQUE(user_id, rc_customer_id)` constraint to `user_entitlements`. Cancellation events may take up to 2 hours to deliver — don't assume real-time accuracy.

**Webhook edge cases to handle:**
- `INITIAL_PURCHASE` — upsert entitlement (idempotent via unique constraint)
- `RENEWAL` — extend `expires_at`
- `CANCELLATION` — set `is_active = false` at period end (user keeps access until `expires_at`)
- `BILLING_ISSUE` — grace period, keep active but flag for follow-up
- `EXPIRATION` — deactivate entitlement
- `PRODUCT_CHANGE` — upgrade/downgrade between monthly/yearly
- `REFUND` — immediate deactivation (Apple-initiated refunds bypass user consent)

**Database schema:**

```sql
CREATE TABLE user_entitlements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rc_customer_id  VARCHAR(255) NOT NULL,       -- RevenueCat customer ID
    tier            VARCHAR(20) NOT NULL,         -- 'explorer' | 'pioneer'
    product_id      VARCHAR(100) NOT NULL,        -- 'explorer_monthly', 'explorer_yearly', 'pioneer_yearly'
    is_active       BOOLEAN DEFAULT true,
    is_sandbox      BOOLEAN DEFAULT false,        -- true for sandbox/test purchases — distinguishes real vs. test revenue
    expires_at      TIMESTAMPTZ,
    purchased_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, rc_customer_id)               -- idempotency: prevents duplicate entitlements from webhook retries
);

CREATE INDEX idx_entitlements_user ON user_entitlements(user_id);
CREATE INDEX idx_entitlements_active ON user_entitlements(user_id, is_active) WHERE is_active = true;
```

**Effort: ~4-5 days** (1 day RevenueCat dashboard + store product config, 2 days SDK integration + paywall screen, 1-2 days webhook endpoint + entitlement middleware).

> **Skills:** Use `revenuecat-purchase-flow` for SDK integration, paywall purchase logic, error handling, and restore flow on React Native. Use `fastify-best-practices` for the webhook endpoint (request lifecycle, signature verification, error handling).

### 0.3 Coupon & Discount System

Three mechanisms, from simplest to most custom:

**A) Apple/Google Promo Codes (for gifting free access)**
- Generate one-time redemption codes directly in App Store Connect / Google Play Console.
- Apple: up to 150,000 codes per app per quarter.
- User redeems in their device's App Store. RevenueCat picks it up automatically.
- Best for: giving full free access to beta testers, influencers, contest winners.
- Effort: zero code — store dashboard only.

**B) RevenueCat Promotional Entitlements (for flexible gifting)**
- RevenueCat API call: `POST /subscribers/{app_user_id}/entitlements/{entitlement_id}/promotional` with a duration.
- Grants Premium access without any payment. Appears in user's subscription status.
- Best for: admin-granted free months, partnership deals.
- Effort: one admin API endpoint in Fastify, ~0.5 days.

**C) Custom Coupon System (for discount codes you hand out)**

For the people you've already promised discounts, and for future marketing campaigns:

```sql
CREATE TABLE coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20) NOT NULL UNIQUE,   -- e.g. 'VANLIFE2026'
    description     VARCHAR(255),
    discount_type   VARCHAR(20) NOT NULL,           -- 'free_months' | 'pioneer_upgrade'
    discount_value  INTEGER NOT NULL,               -- months of free access, or percentage
    max_uses        INTEGER,                        -- null = unlimited
    used_count      INTEGER DEFAULT 0,
    valid_from      TIMESTAMPTZ DEFAULT NOW(),
    valid_until     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id       UUID NOT NULL REFERENCES coupons(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    redeemed_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coupon_id, user_id)                      -- one redemption per user per coupon
);
```

**Flow:** User enters code in app -> `POST /coupons/redeem` validates code (exists, not expired, not maxed, not already redeemed by user) -> grants RevenueCat promotional entitlement for the specified duration -> records redemption.

**Important Apple constraints (especially for Spain/EU):**
- You **cannot** use coupons to redirect users to pay outside the app (Stripe, website) to avoid Apple's 15% cut. **In Spain and all non-US App Store storefronts, external purchase links are prohibited** unless you have a specific Apple entitlement. The US storefront exception does not apply to WildSpotter.
- Coupons that grant **free months** of access are fine — they bypass the payment system entirely via RevenueCat promotional entitlements.
- Coupons that offer a **discount** (e.g., "50% off for 3 months") **must** use Apple's native promotional/introductory offer system via StoreKit, not a custom code that points to a cheaper product. A custom `VANLIFE2026` code that redirects to a discounted IAP is a **rejection risk** (anti-steering violation), not just a policy gray area.
- **Safe pattern for custom coupons:** grant free months only. For percentage discounts, use Apple's Subscription Offer Codes (App Store Connect) or RevenueCat's Promotional Offers integration, which wraps StoreKit's `SKPaymentDiscount`.
- **Restore purchases button is mandatory** for any app with restorable IAPs (Apple guideline 3.1.1). Must be accessible from the paywall and from Config.

**For Pioneer tier access:** The cleanest approach is a coupon that unlocks the hidden `pioneer_yearly` RevenueCat Offering for that user, so they see the $24.99/yr price instead of the standard $34.99/yr when they hit the paywall. This is acceptable because it's a separate product at a fixed price, not a "discount" on the standard product.

**Effort: ~2-3 days** (coupon tables + redemption endpoint + input UI in app + admin seeding).

> **Skills:** Use `fastify-best-practices` for validation (JSON Schema on coupon codes) and `revenuecat-purchase-flow` for granting promotional entitlements via RevenueCat API.

### 0.4 Feature Gating Middleware

Per [monetization-plan.md](monetization-plan.md), all gating is API-side:

```typescript
// Fastify 5 preHandler hook
const requirePremium = async (request, reply) => {
  const user = request.user;
  if (!user) return reply.code(401).send({ error: 'auth_required' });

  // Admin and tester roles bypass all Premium gating
  if (user.role === 'admin' || user.role === 'tester') return;

  const entitlement = await db.query(
    `SELECT 1 FROM user_entitlements
     WHERE user_id = $1 AND is_active = true AND expires_at > NOW()`,
    [user.id]
  );

  if (entitlement.rows.length === 0) {
    return reply.code(402).send({
      error: 'premium_required',
      upgrade_url: 'wildspotter://premium'
    });
  }
};
```

Applied to gated routes: `/offline/download-region`, `/spots` with advanced filter params, satellite image URLs.

> **Deep link prerequisite verified:** The `wildspotter://` URL scheme is already configured in `app.json` (`"scheme": "wildspotter"`), so the 402 `upgrade_url` will work.

**Effort: ~0.5 days** (middleware + apply to routes).

> **Skills:** Use `fastify-best-practices` for preHandler hook patterns and plugin encapsulation. Note: we're on **Fastify 5.2.1** — verify hook signatures and plugin registration patterns against Fastify 5 docs (breaking changes from v4 in type definitions and `register` behavior).

### 0.5 Local Development, Admin Access & Testing

**The investigation originally had zero coverage of how you (the developer/admin) test Premium features without paying yourself.** This is critical — you need three complementary mechanisms:

**A) Admin role bypass (for day-to-day development)**

The `users.role` column (`'admin'` or `'tester'`) bypasses all Premium gating in `requirePremium` middleware (see 0.4). After signing in for the first time, set your role directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'javierpicatoste@gmail.com';
```

This gives you instant access to every gated feature without touching entitlements or RevenueCat. Tester accounts for beta testers work the same way with `role = 'tester'`.

**B) RevenueCat sandbox purchases (for testing the real purchase flow)**

Both Apple and Google provide sandbox environments for testing purchases without real charges. RevenueCat supports this natively — sandbox purchases flow through the same webhook pipeline with a `sandbox: true` flag in the webhook payload. The `is_sandbox` column on `user_entitlements` records these. Sandbox testing is the **only way** to verify the full purchase → webhook → entitlement pipeline before going live.

> **Dev build required:** Expo Go on Android (SDK 53+) **does not support push notifications**. Since WildSpotter is on Expo 55, all push notification testing — and sandbox purchase testing — requires a **development build** via `expo-dev-client` (already installed in `package.json`). Build the dev client for both platforms before starting Phase 0 work.

**C) Admin coupon (for testing the coupon flow itself)**

Seed a permanent coupon in the migration:

```sql
INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_until)
VALUES ('ADMIN_WILDSPOTTER', 'Developer/admin free access', 'free_months', 9999, NULL, NULL);
```

This coupon grants 9999 months (~833 years) of free access. It tests the full coupon redemption flow end-to-end: code entry → validation → RevenueCat promotional entitlement → entitlement record. Useful for verifying the coupon system works before handing out real codes.

**D) Infrastructure verification checklist**

Before starting Phase 0 implementation, verify these prerequisites are in place:

- [ ] `expo-dev-client` builds successfully on both iOS and Android
- [ ] GitHub PAT with `packages:read` scope exists for `@react-native-google-signin` install
- [ ] Apple Developer account has Sign in with Apple capability enabled for `com.wildspotter.app`
- [ ] Google Cloud project has OAuth consent screen configured for `com.wildspotter.app`
- [ ] RevenueCat account created, iOS and Android apps configured
- [ ] App Store Connect and Google Play Console have test/sandbox accounts set up
- [ ] `@fastify/rate-limit` compatible with Fastify 5.2.1 (verify before install)

**Effort: ~1 day** (admin seeding, sandbox setup, dev build verification).

### 0.6 Total Foundation Effort

| Component | Days |
|-----------|------|
| Auth (Apple + Google Sign-In + account linking + deletion) | 6-8 |
| RevenueCat integration + paywall + webhook handlers | 4-5 |
| Coupon system | 2-3 |
| Feature gating middleware | 0.5 |
| Local dev, admin access & testing setup | 1 |
| **Total** | **14-18 days** |

---

## 1. Full Offline Map & Data Access

> Ref: [wildspotter-premium-plan.md](wildspotter-premium-plan.md) section 1, [monetization-plan.md](monetization-plan.md) "Offline cache" as paid killer feature.

### Current State

- AsyncStorage cache layer exists (`src/services/cache/`) — caches scan results with 7-day TTL.
- Legal tiles are pre-generated MVTs, 171MB on disk (`data/legal-tiles/`).
- Spot database is pure PostGIS read queries.
- No offline map tile infrastructure.

### 1.1 Offline Spot Database

**What:** Export all spots in a bounding box as a downloadable bundle (GeoJSON or SQLite) so users can browse spots with zero connectivity.

**Implementation:**
- New endpoint: `GET /offline/download-region?bbox=...` (gated by Premium entitlement).
- Returns compressed JSON with all spot data (coordinates, scores, legal status, context details) for the region.
- Client stores in a local SQLite database (`expo-sqlite`).
- On-device queries for filtering/sorting (SQLite supports basic spatial operations via R*tree).

**Size estimate:** ~1KB per spot. At 50,000 spots for all of Spain: ~50MB. **AsyncStorage is not viable** at this size — Android has practical limits around 6-10MB depending on device. SQLite is the only real option and also provides query capabilities (filtering, sorting) that AsyncStorage cannot.

**Effort: ~3-4 days** (export endpoint, download manager, local SQLite storage, offline query layer).

> **Skills:** Use `postgis-skill` for bounding box spatial export queries. Use `fastify-typescript` for typed endpoint schemas.

### 1.2 Base Map Caching

**What:** Download map tiles for a region so the map renders offline.

**Implementation options:**

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **MapLibre OfflineManager** (built-in) | Native API, no server work. Uses existing tile source. | Requires a tile source whose ToS allows caching. CARTO Voyager free tier may not allow bulk offline caching in a paid product. | Depends on tile provider ToS |
| **Self-host OpenMapTiles on Hetzner** | Full control, no ToS risk. One-time setup. | Spain z0-z14 is ~5-10GB. Eats into Hetzner CX43 storage (160GB + 100GB volume, currently 2.1GB used). | Storage only, no API cost |
| **Protomaps + PMTiles** | Single-file tile archive, works offline natively. Can host on Cloudflare R2 (free egress). Spain extract is ~3-4GB as PMTiles. | Newer ecosystem, less battle-tested with MapLibre RN. | ~$0.015/GB stored on R2 |

**Recommendation:** PMTiles on Cloudflare R2 is the best fit — low cost, no Hetzner storage pressure, works offline natively. Users download region extracts, MapLibre reads them locally.

**Risk: PMTiles + MapLibre React Native is unproven.** PMTiles works via HTTP Range requests against a remote archive. For offline use, you'd need to serve a local PMTiles file from the device — either via a local HTTP server (e.g., `expo-http-server` or a native module) or a custom protocol handler that MapLibre can read. This integration path has minimal community precedent on React Native. **Mitigation: schedule a 1-2 day spike** at the start of Phase 2 to prove PMTiles renders from a local file on both iOS and Android. If it fails, fall back to MapLibre's built-in `OfflineManager` with self-hosted OpenMapTiles (more storage on Hetzner, but proven path).

**Effort: ~5-8 days** (1-2 days feasibility spike, 2-3 days PMTiles pipeline + R2 upload, 2-3 days MapLibre offline integration + download UI with progress). The spike may save days if it reveals blockers early.

### 1.3 On-Device Legal Verification

**What:** Check the legal status of saved spots without network.

**Two levels of complexity:**

**Level 1 — Pre-computed (easy):** The offline spot bundle already includes `legal_status` JSONB for every spot. Users can view legal status of any downloaded spot with zero computation. This covers "check the legality of any spot in the database" from the plan.

**Level 2 — On-device spatial queries (hard):** Ship MITECO polygon datasets to the device for `ST_Intersects`-style checks on arbitrary coordinates. Requires SpatiaLite or Turf.js with simplified geometries. MITECO shapefiles (Natura 2000 + Parks + Coastal) would be ~50-100MB simplified. Feasible but significant engineering.

**Recommendation:** Ship Level 1 for V1 (it's essentially free since the data is in the offline bundle). Level 2 is only needed if Tap-to-Check (Section 4) must work offline — defer it.

**Effort:** Level 1: included in offline spot bundle (0 additional). Level 2: ~5-8 days.

### 1.4 Summary

| Sub-feature | Effort | Recurring Cost |
|-------------|--------|---------------|
| Offline spot database (SQLite) | 3-4 days | ~0 |
| Base map caching (PMTiles, includes spike) | 5-8 days | ~$1/mo R2 |
| On-device legal (pre-computed) | 0 (included) | 0 |
| On-device legal (spatial queries) | 5-8 days | 0 |
| **Total (without Level 2)** | **8-12 days** | **~$1/mo** |

---

## 2. Advanced "Explorer" Filters

> Ref: [wildspotter-premium-plan.md](wildspotter-premium-plan.md) section 2, [monetization-plan.md](monetization-plan.md) "Advanced filters" as paid feature.

### Current State

- `spots` table already stores `elevation`, `slope_pct`, `context_score`, `context_details` (JSONB with all sub-scores), `composite_score`.
- API already supports `max_slope`, `min_score`, `hide_restricted` query params.
- All the data needed for advanced filtering is already computed and stored.

### What's Needed

| Filter | Data Source | SQL | Effort |
|--------|-----------|-----|--------|
| Altitude range | `spots.elevation` | `WHERE elevation BETWEEN $1 AND $2` | ~1 hour |
| Isolation level | `context_details->'privacy'->'place_distance_m'` and `context_details->'urban_density'->'building_count'` | `WHERE (context_details->'privacy'->>'place_distance_m')::float > $1` | ~2 hours |
| Near water/beach/coast | `context_details->'scenic_value'->'features'` | `WHERE context_details->'scenic_value'->'features' ? 'beach_nearby'` | ~2 hours |
| Sort by Wildness | Derived from privacy + scenic - urban sub-scores | `ORDER BY (privacy_score + scenic_score - urban_density_score) DESC` | ~3 hours |
| Sort by Safety | Derived from legal_status + context sub-scores | `ORDER BY composite_score DESC` (already exists) | ~1 hour |
| Surface type combos | `spots.surface_type` | `WHERE surface_type = ANY($1)` | ~1 hour |

**Frontend:** A filter sheet or expanded filter chips in the map view. ~2-3 days for UI.

**Gating:** Free tier API rejects advanced filter params with 402 per [monetization-plan.md](monetization-plan.md).

### Summary

| Effort | Recurring Cost | Dependencies |
|--------|---------------|-------------|
| **3-4 days total** | 0 | Feature gating middleware only |

**This is the lowest-effort, highest-ROI Premium feature.** Ship it first.

---

## 3. Active Legal Guard & Notifications

> Ref: [wildspotter-premium-plan.md](wildspotter-premium-plan.md) section 3, [legal-monitoring-pipeline.md](legal-monitoring-pipeline.md), [legal-pipeline-deep-investigation.md](legal-pipeline-deep-investigation.md).

### Current State

- Legal monitoring pipeline is complete: 89 sources, 125+ classified documents.
- `workers/legal/scheduler.py` polls sources on schedule.
- `workers/legal/source_monitor.py` detects changes via content hashing.
- `workers/legal/classifier.py` classifies documents with keyword gate + LLM.
- `workers/legal/notifications.py` sends alerts via ntfy.sh (admin-only, not user-facing).
- **No push notification infrastructure in the app.** No `expo-notifications`, no FCM, no device token storage.

### 3.1 Saved Spots (prerequisite)

Before you can notify users about their spots, they need to be able to save/bookmark spots.

```sql
CREATE TABLE saved_spots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    spot_id     UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
    saved_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, spot_id)
);

CREATE INDEX idx_saved_spots_user ON saved_spots(user_id);
```

API: `POST /spots/:id/save`, `DELETE /spots/:id/save`, `GET /user/saved-spots`.

**Effort: ~2 days** (API + frontend bookmark button + saved spots list).

### 3.2 Push Notification Infrastructure

**Recommended: Expo Push Notifications**
- Free, unlimited, works on both iOS and Android.
- Expo handles APNs (Apple) and FCM (Google) behind the scenes.
- Requires `expo-notifications` + `expo-device` packages.
- Device push tokens stored per user session.
- **Dev build required for testing:** Expo Go on Android (SDK 53+) does not support push notifications. All push notification development and testing requires a dev build via `expo-dev-client`. iOS also requires `remote-notification` in `UIBackgroundModes` for background notifications — add via `app.json` plugins.
- Android 8.0+: notifications require a **notification channel** to be created before sending.

```sql
ALTER TABLE user_sessions ADD COLUMN push_token VARCHAR(255);

-- Notification preferences per user (prevents OS-level disable-all)
ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{
    "legal_updates": true,
    "spot_watchdog": true,
    "enforcement_alerts": true,
    "marketing": false
}';
```

**Effort: ~2-3 days** (SDK setup, permission request flow, token registration endpoint, backend notification sender utility, preferences UI in Config screen).

### 3.3 Spot Watchdog

**What:** When the legal pipeline detects a change affecting a municipality/province/CCAA, cross-reference against users' saved spots and push a notification.

**Implementation:**
- The legal pipeline already detects changes and classifies them by geographic scope (municipality, province, CCAA) via `workers/legal/geocoder.py`.
- Add a post-classification hook: when a document is classified as affecting region X, query `saved_spots JOIN spots` for spots in region X, then push to those users.
- **Geographic matching:** `workers/pipeline/location.py` already reverse-geocodes every spot to `municipality_code` and `province_code` (stored in `spots`). The legal pipeline classifies documents by geographic scope (municipality/province/CCAA). The join is: `saved_spots JOIN spots ON spot_id WHERE spots.municipality_code = doc.municipality_code` (or province/ccaa level). No spatial query needed — it's a simple code match.
- The notification says: "Legal update affecting [Spot Name]: [document title]. Tap to review."

**Effort: ~3-4 days** (join query, notification dispatch worker, notification detail view in app).

### 3.4 Regional Enforcement Alerts

**What:** Warn users when entering regions with aggressive enforcement or seasonal restrictions.

**Two approaches:**

| Approach | How | Pros | Cons |
|----------|-----|------|------|
| **Passive (recommended)** | When user opens a spot detail or scans a region, show a banner if active restrictions exist for that area | Simple, no background location, no App Store risk | User must open the app |
| **Active (risky)** | Background geofencing triggers push notification when user enters a restricted region | Proactive, feels like real protection | Requires `Always` location permission, heavy battery drain, Apple will scrutinize the justification, high rejection risk |

**Recommendation:** Passive approach for V1. Show enforcement context in the spot detail view and as a banner on scan results. The legal pipeline already has the data — it's a display problem, not a data problem.

**Effort:** Passive: ~2-3 days. Active (background geofencing): ~5-7 days + App Store review risk.

### 3.5 Preventative Legal Toolkit

**What:** Show the specific legal articles applicable to a spot, formatted to show to authorities.

**Implementation:** The legal pipeline stores classified documents with source URLs and extracted text. Display in a formatted card within the spot detail view: "Article X of Decree Y permits overnight parking of self-contained vehicles in rustic land..."

The premium plan notes "maybe offering this free" — per [monetization-plan.md](monetization-plan.md), legal data is already free to build trust. Making the toolkit free aligns with the marketing promise. Consider gating only the "formatted for authorities" PDF export as Premium.

**Effort: ~2-3 days** (legal document viewer component, optional PDF export).

### 3.6 Summary

| Sub-feature | Effort | Dependencies | Recurring Cost |
|-------------|--------|-------------|---------------|
| Saved spots system | 2 days | Auth | 0 |
| Push notification infra | 2-3 days | Auth | 0 (Expo Push is free) |
| Spot Watchdog | 3-4 days | Saved spots + Push + Legal pipeline | 0 |
| Regional Enforcement (passive) | 2-3 days | Legal pipeline | 0 |
| Legal Toolkit | 2-3 days | Legal pipeline | 0 |
| **Total** | **12-15 days** | Auth system | **0** |

---

## 4. Tap-to-Check: Legal Verification Anywhere

> Ref: [wildspotter-premium-plan.md](wildspotter-premium-plan.md) section 4, [legal-monitoring-pipeline.md](legal-monitoring-pipeline.md).

### Current State

- `workers/pipeline/legal.py` runs `ST_Intersects` against MITECO shapefiles (Natura 2000, Parks, Coastal Law). ~1ms per query.
- Catastro uses a live REST API (`Consulta_RCCOOR`). ~300ms per query.
- `workers/legal/geocoder.py` reverse-geocodes coordinates to municipality/province/CCAA.
- Legal pipeline has a database of classified documents by geographic scope.

### 4.1 Online Tap-to-Check (Recommended for V1)

**What:** Long-press on map -> API call -> legal verdict card.

**Implementation:**

1. **Map handler:** MapLibre `onLongPress` returns coordinates. ~1 hour.
2. **New API endpoint:** `POST /legal/check-point` with `{lat, lng}`.
   - Runs the same PostGIS queries as `workers/pipeline/legal.py`: `ST_Intersects` against natura2000, national_parks, coastal_law tables.
   - Calls Catastro REST API for land classification.
   - Reverse-geocodes to municipality/province/CCAA.
   - Queries `legal_documents` table for active restrictions in that jurisdiction.
   - Returns structured result identical to spot `legal_status` JSONB + applicable documents.
3. **Bottom sheet UI:** Reuse `LegalSituation.tsx` component patterns. Green checks, red warnings, source citations.

**Key decision — TypeScript or Python?**
The legal PostGIS queries are raw SQL (`ST_Intersects`, `ST_Transform`, `ST_DWithin`). They can run from either the Fastify API (TypeScript + `pg` client) or the Python worker Flask API. Implementing directly in Fastify avoids an extra hop and keeps the response fast (~50ms total for PostGIS queries + geocode). The Catastro REST API call can be done from TypeScript with `fetch`.

**Rate limiting (required):** This endpoint hits the external Catastro REST API (~300ms per call). Without rate limiting, a user long-pressing repeatedly or a bad actor could hammer Catastro and get the server IP blocked. Implement per-user rate limiting: **10 checks/minute for Premium, blocked for free tier** (returns 402). Use Fastify's `@fastify/rate-limit` plugin scoped to `user_id`. Note: `@fastify/rate-limit` is **not currently installed** — add it to `backend/package.json`. For the single-server Hetzner setup, in-memory store is fine (no Redis needed). This is ~2 hours of work but prevents a real operational risk.

**Effort: ~5-6 days** (API endpoint with PostGIS queries, Catastro integration, geocode + legal doc lookup, rate limiting, bottom sheet UI).

> **Skills:** Use `postgis-skill` for `ST_Intersects`/`ST_Transform`/`ST_DWithin` query patterns and spatial indexing. Use `fastify-best-practices` for rate limiting (`@fastify/rate-limit`) and route design. Use `fastify-typescript` for typed request/response schemas.

### 4.2 INSPIRE Cadastre Replacement (Deferred)

**What:** Replace the Catastro REST API with locally imported INSPIRE/ATOM cadastral parcels for fully offline operation.

**The problem:** Spain's INSPIRE ATOM feed contains cadastral parcels for ~8,000 municipalities. The full dataset is ~200GB+ of GML files. Even simplified and imported to PostGIS, it would consume 50-100GB+ of database storage.

**Impact on Hetzner:** Current data usage is 2.1GB. The CX43 has 160GB SSD + 100GB volume. Importing full INSPIRE data would use 30-60% of total available storage, and PostgreSQL needs working space for indexes and queries on top of raw data.

**Scoped alternative:** Import only high-traffic vanlife regions (Andalusia, Catalonia, Galicia, Asturias, Basque Country) — maybe ~30-40GB. Still significant.

**Recommendation:** Keep using the Catastro REST API for online Tap-to-Check. It works, it's free, and 300ms latency is acceptable for an on-demand feature. Only invest in INSPIRE import if offline Tap-to-Check becomes a validated user demand.

**Effort if pursued:** ~10-15 days (download pipeline, GML->PostGIS import script, spatial indexing, incremental update strategy) + ~$5-10/mo additional Hetzner volume storage.

### 4.3 Offline Tap-to-Check (Deferred)

Requires shipping MITECO polygons + legal documents to the device. See Section 1.3 Level 2. Feasible but complex — defer to post-launch based on user demand.

### 4.4 Spot Proposal (Optional — Defer)

> The premium plan flags this as "Under Evaluation." Recommendation: defer.

**Technical effort:** Low (~4-5 days for submission endpoint, `proposed_spots` table, rate limiting, admin review via n8n workflow or simple web dashboard, notification on approve/reject).

**Real cost:** Your moderation time. Every proposal needs human review to maintain the "algorithmic radar" identity. At 500 Premium users x 5 proposals/month = 2,500 reviews/month. Even at 30 seconds per review, that's ~21 hours/month of moderation.

**When to build:** Only after you have paying users explicitly asking for it. The open question in the plan is valid — validate with early adopters first.

### 4.5 Summary

| Sub-feature | Effort | Dependencies | Recurring Cost |
|-------------|--------|-------------|---------------|
| Online Tap-to-Check | 5-6 days | Feature gating middleware | 0 (Catastro API is free) |
| INSPIRE cadastre import | 10-15 days | Hetzner storage | $5-10/mo |
| Offline Tap-to-Check | 5-8 days | MITECO on-device + INSPIRE | 0 |
| Spot Proposal | 4-5 days | Auth + Push | Your moderation time |
| **Recommended V1** | **5-6 days** | Gating only | **0** |

---

## 5. Private Explorer Circles

> Ref: [wildspotter-premium-plan.md](wildspotter-premium-plan.md) section 5.

### Assessment

This is the highest-effort, lowest-priority feature. It requires building a mini social network:

**Database schema:**

```sql
CREATE TABLE circles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    created_by      UUID NOT NULL REFERENCES users(id),
    invite_code     VARCHAR(20) UNIQUE NOT NULL,
    max_members     INTEGER DEFAULT 10,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE circle_members (
    circle_id       UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) DEFAULT 'member',    -- 'owner' | 'member'
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(circle_id, user_id)
);

CREATE TABLE circle_spots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id       UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    spot_id         UUID NOT NULL REFERENCES spots(id),
    added_by        UUID NOT NULL REFERENCES users(id),
    note            TEXT,
    added_at        TIMESTAMPTZ DEFAULT NOW()
);
```

**Features needed:**
- Circle CRUD (create, invite, join, leave, delete)
- Invite system (deep links with invite codes)
- Shared spots view (spots pinned to a circle, visible to members only)
- Real-time sync (WebSocket or polling when circle members add/remove spots)
- Permission checks on every query (user must be a circle member to see circle spots)
- Trip planning UI (shared map view with pinned spots)

**Effort: ~15-20 days** (5-7 backend, 5-8 frontend, 3-5 testing/edge cases).

**Recurring cost:** Near-zero at hobby scale. WebSocket connections increase server memory.

**Strategic concern:** Every social feature moves WildSpotter closer to being another Park4night. The "algorithmic radar" identity is strongest when the app is a tool, not a community platform. Circles are table-stakes for a social app but optional for a radar tool.

**Recommendation:** Cut from V1 Premium entirely. Revisit in year 2 if paying users request it. The "anti-crowding philosophy" described in the plan can be achieved more simply by limiting how many spots a user can share via external links (WhatsApp, iMessage) — no circles infrastructure needed.

---

## Overall Implementation Roadmap

### Recommended Build Order

| Phase | Features | Effort | Cumulative |
|-------|----------|--------|-----------|
| **Phase 0** | Auth + RevenueCat + Coupons + Gating + Admin/Testing setup | 14-18 days | 14-18 days |
| **Phase 1** | Advanced Filters (quick win, immediate paywall value) | 3-4 days | 17-22 days |
| **Phase 2** | Offline Maps & Spots (killer feature per [monetization-plan.md](monetization-plan.md)), starts with PMTiles spike | 8-12 days | 25-34 days |
| **Phase 3** | Tap-to-Check online (unique differentiator) | 5-6 days | 30-40 days |
| **Phase 4** | Saved Spots + Push Notifications + Legal Guard | 12-15 days | 42-55 days |
| **Deferred** | Circles, INSPIRE cadastre, Offline Tap-to-Check, Spot Proposals | 30-45 days | — |

**Parallelization opportunities:** Push notification infra (Phase 4) can be built in parallel with Phase 2 or 3 since it only depends on Auth (Phase 0). Similarly, Saved Spots (Phase 4 prerequisite) can start during Phase 2. A dependency graph:

```
Phase 0 (Auth + Payments)
    ├── Phase 1 (Filters) ── no deps beyond gating
    ├── Phase 2 (Offline) ── no deps beyond gating
    │       └── PMTiles spike first (go/no-go gate)
    ├── Phase 3 (Tap-to-Check) ── no deps beyond gating
    └── Saved Spots ──┬── Push Infra ── Spot Watchdog ── Legal Guard
                      └── (can start during Phase 2)
```

With parallelization, the effective calendar time for Phases 0-4 could be **~35-42 days** rather than the serial sum.

### Docker Compose: No New Services Needed

The auth + payments + gating work all fits within the existing `api` container (Fastify). No Redis, no separate auth service, no message queue needed for V1. JWT access tokens are stateless (verified by signature, not a session store). Refresh tokens are in PostgreSQL. Rate limiting uses in-memory store (acceptable for a single-server deployment). The existing Hetzner CX43 is sufficient.

### Total for a Shippable Premium V1 (Phases 0-3): ~30-40 days

This gives you: auth, payments, coupons, advanced filters, offline maps+spots, and tap-to-check. That covers the core value proposition from [wildspotter-premium-plan.md](wildspotter-premium-plan.md) minus the social and notification features.

### Total for Full Premium V1 (Phases 0-4): ~42-55 days (serial) / ~36-43 days (parallelized)

Adds saved spots, push notifications, and Legal Guard. This is the complete "safety and legal shield" positioning.

### Recurring Cost Impact

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Hetzner CX43 (existing) | 23.21 | Per [deploy-hetzner.md](deploy-hetzner.md) |
| RevenueCat | 0 | Free under $2.5k MRR |
| Expo Push Notifications | 0 | Free, unlimited |
| PMTiles on Cloudflare R2 | ~1 | ~3-4GB Spain tiles |
| Apple Developer Program | ~8.25/mo | $99/yr, already paying |
| Google Play Developer | 0 | $25 one-time, already paid |
| **Total** | **~$32/mo** | vs. current ~$23/mo |

Well within the ~$25/mo base target from [monetization-plan.md](monetization-plan.md), with the ~$9 increase fully offset by the first paying user.

### Break-Even Reminder

Per [monetization-plan.md](monetization-plan.md): **6 paying users covers the base server cost.** The Premium infrastructure adds essentially zero marginal cost — the investment is entirely development time.

---

## Risk Register

### Existing User Migration

WildSpotter currently has zero auth — existing app installs work anonymously. When Premium launches, the app update will introduce login. Key decisions:

- **Free features must remain accessible without login.** The map, scanner, basic spot viewing, and legal overlay work today without auth — gating them behind login would break the existing experience and tank retention. Auth should only be required when a user taps a Premium feature.
- **Soft login prompt:** After the update, show a non-blocking banner ("Sign in to save spots and unlock Premium features") rather than a login wall. Users who never want Premium should never be forced to create an account.
- **Data migration:** The existing AsyncStorage cache (scan results, preferences) is device-local and anonymous. When a user signs in for the first time, migrate their cached preferences to their server-side profile. Cached scan results stay local (they're just a cache of API responses).

### App Store Review Risk

Apple rejects subscription apps that don't provide enough perceived value behind the paywall. If Premium V1 launches with only Phases 0-1 (auth + filters), that's just "more filter options" — thin for a $4.99/mo subscription and likely to be rejected.

**Minimum viable feature set for App Store approval:** Phases 0-2 (auth + filters + offline maps/spots). Offline access is a tangible, demonstrable feature that justifies a subscription. Tap-to-Check (Phase 3) strengthens the case further. **Do not submit to App Review until at least Phase 2 is complete.**

### Database Migration

Adding `users`, `user_sessions`, `user_entitlements`, `saved_spots`, `coupons`, `coupon_redemptions` to the existing production database requires a migration strategy:

- All new tables are additive — no existing tables are modified (except `user_sessions.push_token` and `users.notification_preferences` which are ALTERs).
- Use `db/migrations/` with numbered migration files, applied via a migration runner on deploy.
- The `spots` table already has `municipality_code` from `workers/pipeline/location.py` — verify this column is populated for all spots before deploying the Spot Watchdog.

### New Environment Variables Required

The following must be added to `.env`, `.env.prod.example`, and `.env.stage.example`:

```bash
# Auth
JWT_SECRET=              # Access token signing key (generate with openssl rand -hex 32)
JWT_REFRESH_SECRET=      # Refresh token signing key (separate from access token)
APPLE_TEAM_ID=           # Apple Developer Team ID
APPLE_SERVICE_ID=        # Apple Services ID for Sign in with Apple
GOOGLE_CLIENT_ID_IOS=    # Google OAuth client ID (iOS)
GOOGLE_CLIENT_ID_ANDROID= # Google OAuth client ID (Android)

# Payments
REVENUECAT_API_KEY=      # RevenueCat REST API key (for server-side operations)
REVENUECAT_WEBHOOK_SECRET= # Shared secret for webhook signature verification

# Push Notifications (Expo handles APNs/FCM credentials via EAS)
# No additional env vars needed — Expo Push uses the EAS project ID already in app.json
```

### RevenueCat SDK Version & Google Play Billing

RevenueCat's React Native SDK (`react-native-purchases`) bundles Google Play Billing Library internally. As of May 2026, Google Play Billing Library 8.0.0 introduced breaking changes (removed `querySkuDetailsAsync`, changed `enablePendingPurchases` signature). Verify that the installed `react-native-purchases` version bundles PBL 8. RevenueCat manages this dependency — you don't interact with it directly — but if the SDK version is too old, purchases may fail silently on newer Android devices.

### Analytics (Conversion Funnel)

Track these events to understand Premium conversion and identify drop-off points:

| Event | When | Properties |
|-------|------|-----------|
| `paywall_shown` | User sees the upgrade prompt (402 response or explicit "Go Premium" tap) | `trigger` (which gated feature), `screen` |
| `paywall_dismissed` | User closes the paywall without purchasing | `trigger`, `time_spent_ms` |
| `purchase_started` | User taps a product on the paywall | `product_id` |
| `purchase_completed` | RevenueCat webhook confirms purchase | `product_id`, `tier`, `is_trial` |
| `purchase_failed` | Payment fails or user cancels at the store sheet | `product_id`, `error_type` |
| `premium_feature_used` | User successfully uses a gated feature | `feature` (e.g. `offline_download`, `tap_to_check`, `advanced_filter`) |
| `coupon_redeemed` | User successfully redeems a coupon | `coupon_code`, `discount_type` |

These integrate with the existing PostHog setup. The funnel `paywall_shown → purchase_started → purchase_completed` is the critical metric.

---

## Codebase Readiness Snapshot (May 2026)

Verified against the actual codebase — not assumptions.

### What Exists (Ready for Premium)
- **Fastify 5.2.1** API with 10 public routes (spots, reports, legal docs, tiles, satellite, health)
- **PostGIS** database with ~20 tables (spots, legal_documents, municipalities, legal_sources, etc.)
- **`@fastify/cors`** + **`@fastify/helmet`** already configured globally
- **Legal pipeline** complete: 89 sources, 125+ classified documents, ntfy.sh admin alerts
- **Client-side offline cache** (AsyncStorage, 7-day TTL) in `src/services/cache/`
- **Settings/preferences store** (Zustand + AsyncStorage) in `src/stores/settings-store.ts`
- **PostHog analytics** already integrated (tracks config changes, feature usage)
- **`expo-dev-client`** already in `package.json` (required for push notification testing)
- **URL scheme** `wildspotter://` configured in `app.json`
- **Expo 55** / **React Native 0.83.2** — modern enough for all planned SDKs
- **HTML sanitization** on user input (spot reports) — good security baseline

### What's Missing (Must Build)
- Zero auth infrastructure (no users table, no JWT, no login screens, no middleware)
- Zero payment infrastructure (no RevenueCat, no StoreKit, no entitlements)
- Zero push notification infrastructure (no `expo-notifications`, no FCM, no token storage)
- No `@fastify/rate-limit` installed
- No `@fastify/jwt` or any auth plugin installed
- No route guards or permission checks on any endpoint
- No `expo-secure-store` installed
- No `expo-sqlite` installed (needed for offline spot database)
- Config screen has no account section, no subscription status, no restore purchases button
- Settings store has no `userId`, `tier`, or `expiresAt` fields

### Packages to Install

**Frontend (`package.json`):**
```
expo-apple-authentication
@react-native-google-signin/google-signin   # requires GitHub PAT in .npmrc
expo-secure-store
expo-notifications
expo-sqlite
react-native-purchases                       # RevenueCat SDK
```

**Backend (`backend/package.json`):**
```
@fastify/jwt
@fastify/rate-limit
jsonwebtoken                                 # for refresh token signing (separate from Fastify JWT)
```
