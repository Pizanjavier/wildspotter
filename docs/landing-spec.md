# WildSpotter — Waitlist Landing Page Spec

> Single-page waitlist site that captures TikTok/Reels campaign traffic during Early Access, before the app is live in the stores. Deployed at `https://wildspotter.app`.
>
> **Purpose:** Convert video viewers → emails → Pioneer tier subscribers on launch day. Absorbs App Store review delays and builds the mailing list that powers the monetization launch.

## 1. Goals & Success Metrics

| Metric | Target |
|--------|--------|
| Video → landing visit rate | >5% of video views (bio link clicks) |
| Landing → email submit rate | >25% of visitors |
| Double opt-in confirm rate | >70% |
| Total signups before app launch | 500+ (fills the Pioneer cap) |
| Mobile share of traffic | ~90% (TikTok/Reels is mobile-first) |

## 2. Page Structure (single scroll, mobile-first)

```
┌─────────────────────────────┐
│  NAV    [logo]   ES / EN    │  56px, transparent over hero
├─────────────────────────────┤
│                             │
│   HERO VIDEO BACKGROUND     │  full-bleed, autoplay muted loop
│   (ParkingLleno render)     │  100vh on mobile, 90vh desktop
│                             │
│   "Descubre spots que       │  80px Inter Black
│    nadie ha compartido."    │
│                             │
│   subtitle (52px)           │
│                             │
│   [ tu@email.com ] [CTA]    │  email input + submit button
│   "Avísame cuando lance"    │
│                             │
│   badge: "Pioneer €24.99/yr │  scarcity, amber pill
│   locked forever — 347/500" │  live counter from D1
│                             │
├─────────────────────────────┤
│  SECTION 2 — EL PROBLEMA    │
│  3 stat cards:              │
│  • 27% de España protegido  │
│  • 600€ multa media         │
│  • 87 spots sin compartir   │
├─────────────────────────────┤
│  SECTION 3 — EL PIPELINE    │
│  6-step visual:             │
│  Radar → Terreno → Legal    │
│  → Satélite → Contexto →    │
│  Score                      │
│  (reuse OchentaYSiete S5)   │
├─────────────────────────────┤
│  SECTION 4 — LEGAL TRUST    │
│  4 data source logos:       │
│  MITECO · IGN · Catastro ·  │
│  OpenStreetMap              │
│  "Datos oficiales. Sin      │
│   opiniones."               │
├─────────────────────────────┤
│  SECTION 5 — PIONEER OFFER  │
│  Price comparison table:    │
│  Explorer €34.99/yr         │
│  Pioneer   €24.99/yr locked │
│  "Solo primeros 500. Para   │
│   siempre a este precio."   │
├─────────────────────────────┤
│  SECTION 6 — SECOND CTA     │
│  Sticky email form repeat   │
├─────────────────────────────┤
│  FOOTER                     │
│  Privacy · Contact · IG/TT  │
└─────────────────────────────┘
```

### Section details

**Hero.** Full-bleed autoplay muted loop of the ParkingLleno render (or a 10s cut of it). Dark overlay gradient bottom 40% for text legibility. Headline in Inter Black 80px, subtitle in Inter Regular 36px. Email input is 64px tall with 24px font — thumb-friendly. CTA button uses amber `#D97706` accent with JetBrains Mono label. **Live scarcity counter** pulls from D1: `347/500 Pioneer spots reserved`. Updates on each page load (cached 60s at edge).

**El Problema.** Three horizontally scrolling stat cards (stack on mobile). Big number + label. Pulls the same emotional triggers as LaMulta — fear and scarcity.

**El Pipeline.** Visual adaptation of the 6-layer pipeline card from OchentaYSiete Scene 5. Staggered on scroll with IntersectionObserver. Progressive reveal builds authority.

**Legal Trust.** Grayscale logos of MITECO, IGN, Catastro, OpenStreetMap in a row. Tagline reinforces the core differentiator from all 4 marketing videos: "Datos oficiales. Sin opiniones."

**Pioneer Offer.** Side-by-side price cards. Explorer tier on the left (regular €34.99/yr), Pioneer tier on the right (€24.99/yr, highlighted with amber border + "EARLY ACCESS" badge). Copy: "Tu precio, bloqueado para siempre. Solo los primeros 500 signups."

**Second CTA.** Duplicate email form at the bottom of the scroll. 60% of email submits happen on the second CTA exposure — this is free conversion.

## 3. Visual Design

| Token | Value |
|-------|-------|
| Background | `#0F0D0B` (warm near-black — matches marketing videos, NOT the app's navy) |
| Card surface | `#1A1614` |
| Accent | `#D97706` (amber — same as marketing videos) |
| Text primary | `#FFFFFF` |
| Text muted | `#A0836C` |
| Success | `#4ADE80` |
| Body font | Inter (400, 700, 900) |
| Display font | Inter Black 900 |
| Data font | JetBrains Mono |

**Rationale:** The landing must feel continuous with the TikTok/Reels videos the user just watched — same warm earthy palette, same fonts, same energy. When a user taps a link in a TikTok bio and lands here, zero cognitive dissonance. The app's navy/cyan palette is reserved for inside the app, not the marketing surface.

**Motion.**
- Hero video loops silently (muted autoplay is the only autoplay Safari/Chrome mobile permit)
- Scroll-triggered fade-ins on all sections (50px translate, 400ms ease-out)
- Email submit → button morphs into checkmark spring animation → confetti of amber dots
- Pipeline stage cards stagger on scroll with 120ms delay between stages
- No parallax — it breaks on iOS Safari and feels dated
- Pioneer counter ticks up with a subtle pulse if it changes during the session

## 4. Tech Stack & Deployment

### Stack

- **Framework:** Astro 4.x — static output, zero JS by default, islands for the form + counter. Better than Next.js here because the page is 95% static and we want the smallest possible TTI on mobile.
- **Styling:** Tailwind v4 (matches marketing-path/ project for visual consistency)
- **Forms/islands:** Preact (10KB vs React's 40KB)
- **Video:** Self-hosted `.mp4` from Cloudflare R2, `<video autoplay muted loop playsinline>` with a poster fallback
- **i18n:** Astro's built-in routing, `/` defaults to ES, `/en` for English, language switcher preserves scroll position

### Hosting

- **Cloudflare Pages** — free tier, 500 builds/mo, global CDN, automatic HTTPS
- **Domain:** `wildspotter.app` (already budgeted in launch-plan.md)
- **DNS:** Cloudflare (free), orange cloud ON for edge caching + DDoS protection
- **Deploy:** `git push` to `main` branch of a `wildspotter-landing` repo triggers Cloudflare Pages build

### Backend (form submission)

- **Cloudflare Pages Functions** — the `/api/subscribe` endpoint runs as a Worker at the edge
- **Database:** Cloudflare D1 (free tier: 5GB storage, 5M reads/day, 100k writes/day — 1000x more than we need)
- **Email sending:** Resend free tier (3k emails/mo, €0 cost, excellent deliverability). Alternative: Cloudflare Email Workers if Resend hits limits.
- **Rate limiting:** Cloudflare Rate Limiting rules (free tier: 10k requests/day) — cap `/api/subscribe` at 3 requests/min/IP to block abuse
- **Turnstile:** Cloudflare Turnstile (free) on the form as invisible CAPTCHA

### Total monthly cost

**€0.** Cloudflare Pages + D1 + Turnstile + Resend free tier covers everything up to ~3k signups/month. We only expect 500.

## 5. Data Schema (Cloudflare D1)

```sql
CREATE TABLE waitlist (
  id          TEXT PRIMARY KEY,           -- UUID v4
  email       TEXT NOT NULL UNIQUE,
  locale      TEXT NOT NULL DEFAULT 'es', -- 'es' | 'en'
  status      TEXT NOT NULL DEFAULT 'pending',
                                          -- 'pending' | 'confirmed' | 'notified' | 'unsubscribed'
  position    INTEGER NOT NULL,           -- auto-incremented on insert for "347/500"
  is_pioneer  INTEGER NOT NULL DEFAULT 0, -- 1 if position <= 500
  referrer    TEXT,                        -- document.referrer
  utm_source  TEXT,                        -- 'tiktok' | 'instagram' | 'direct' | ...
  utm_medium  TEXT,
  utm_campaign TEXT,                       -- 'parkinglleno' | 'lamulta' | ...
  user_agent  TEXT,
  ip_country  TEXT,                        -- from Cloudflare CF-IPCountry header
  confirm_token TEXT NOT NULL,              -- for double opt-in link
  confirmed_at TIMESTAMP,
  notified_at TIMESTAMP,                    -- when launch email was sent
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP
);

CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_position ON waitlist(position);
CREATE INDEX idx_waitlist_is_pioneer ON waitlist(is_pioneer);
```

### Pioneer position logic

- On email confirm (not on first submit — prevents fake emails burning slots), assign `position` as `MAX(position) + 1` among `status != 'pending'` rows
- If `position <= 500`, set `is_pioneer = 1`
- The live counter on the landing queries `SELECT COUNT(*) FROM waitlist WHERE is_pioneer = 1 AND status = 'confirmed'`

## 6. Form Submission Flow

```
1. User types email + clicks "Avísame cuando lance"
   ↓
2. Client-side: Turnstile token generated invisibly
   ↓
3. POST /api/subscribe { email, locale, utm_*, turnstile_token }
   ↓
4. Worker validates:
   - Turnstile token valid?
   - Email format valid?
   - Not already in DB? (if yes → return "already subscribed")
   - Rate limit not exceeded?
   ↓
5. Insert row with status='pending', generate confirm_token (UUID)
   ↓
6. Send confirmation email via Resend:
   Subject: "Confirma tu lugar en WildSpotter Early Access"
   Body: "Haz clic para confirmar: https://wildspotter.app/confirm?t={token}"
   ↓
7. Return success → client shows "Revisa tu email para confirmar"
   ↓
8. User clicks confirm link → GET /api/confirm?t={token}
   ↓
9. Worker updates row: status='confirmed', assigns position, sets is_pioneer
   ↓
10. Redirect to /gracias page with personalized "Eres el Pioneer #347/500"
   ↓
11. Auto-send welcome email with social share CTA ("Comparte y gana acceso prioritario")
```

## 7. Email Sequences (Resend)

### Email 1 — Confirmation (immediate)

**Subject (ES):** `Confirma tu lugar en WildSpotter`
**Subject (EN):** `Confirm your WildSpotter Early Access spot`

Plain, minimal HTML. One button: "Confirmar email". Unsubscribe footer link (legal requirement).

### Email 2 — Welcome (on confirm)

**Subject (ES):** `Eres Pioneer #{position}. Bienvenido al radar.`

- Confirms Pioneer status if applicable: "Tu precio €24.99/yr está bloqueado para siempre"
- Shows the ParkingLleno video embed (hosted on Cloudflare R2)
- Soft ask: "Comparte con un compañero vanlifer" with a prefilled WhatsApp/Telegram share link
- Link to follow `@wildspotter` on TikTok + Instagram

### Email 3 — Launch day (triggered manually)

**Subject (ES):** `WildSpotter ya está disponible. Tu oferta Pioneer te espera.`

- Big App Store + Google Play buttons
- Personalized Pioneer confirmation: "Usa el código `PIONEER500` en RevenueCat para bloquear tu €24.99/yr"
- Deep link that opens the app and jumps straight to the purchase flow
- Link to `https://wildspotter.app/pioneer-claim?t={token}` for a one-click claim

### Optional Email 4 — 48h follow-up (only to non-openers of Email 3)

**Subject (ES):** `No olvides tu Pioneer price. Expira en 72h.`

- Creates urgency to convert waitlist → paid
- Only send to users who haven't opened Email 3 (tracked via Resend webhook)

## 8. Launch Day: Sending the Notification

When the app is approved in both stores and live:

### Step 1 — Prepare the launch email campaign

- Write final copy in ES and EN
- Test the deep link from a real TikTok tap → opens the app → shows the purchase flow
- Verify the `PIONEER500` code works in RevenueCat sandbox
- Render a fresh 10s hero video clip for the email embed

### Step 2 — Segment the waitlist

```sql
SELECT email, locale, position, is_pioneer, confirm_token
FROM waitlist
WHERE status = 'confirmed'
  AND notified_at IS NULL
ORDER BY position ASC;
```

### Step 3 — Send via Resend batch API

- Resend supports batch sends up to 100 emails per request
- For 500 emails that's 5 requests — trivial, stays well within free tier
- Script: `scripts/send-launch-email.ts` in the landing repo
- On successful send, update `notified_at = CURRENT_TIMESTAMP`
- Split ES and EN audiences, send ES first (primary market)
- Stagger sends over 30 minutes to avoid overwhelming App Store servers with simultaneous installs (also helps if a bug is found in the first wave)

### Step 4 — Monitor & follow up

- Watch Resend dashboard for delivery rate (should be >98%)
- Watch PostHog for `/pioneer-claim` page hits
- Watch RevenueCat for Pioneer tier activations
- 48h later, send Email 4 to non-openers (Resend webhook tracks opens)

### Alternative for scale: RevenueCat + push notifications

Once the app is live and users have installed it, push notifications become the cheapest re-engagement channel. For the very first launch notification though, **email is the only channel that works** — the waitlist users don't have the app installed yet, so there's no device token to push to. Email first, then transition to push post-install.

## 9. Legal & Compliance

- **GDPR:** Double opt-in (required in EU), clear privacy policy link, one-click unsubscribe in every email footer, data export + delete endpoints at `/privacy/export` and `/privacy/delete` (queries D1 by email)
- **Privacy Policy:** Reuse `docs/privacy-policy.md` content, add a section on email collection + retention
- **Cookie banner:** Not needed if we only use Plausible (cookieless) or PostHog in EU-compliant mode. Do NOT use Google Analytics on this page — it triggers the cookie banner requirement.
- **Anti-spam:** Unsubscribe link mandatory in Spain (LSSI-CE) and EU (GDPR)
- **Data retention:** Delete unconfirmed `pending` rows after 30 days via a scheduled Cloudflare Worker cron

## 10. Analytics

- **Plausible** (€9/mo) OR **PostHog free tier** for event tracking
- Events: `page_view`, `video_played`, `scroll_50`, `scroll_100`, `email_submit`, `email_confirm`, `cta_click_pioneer`
- Goal funnel: `page_view` → `email_submit` → `email_confirm` → (eventually) `pioneer_claim`
- UTM parameters from TikTok/Instagram bio links must be preserved through the form submission so we can attribute which video drove each signup

## 11. Pre-Launch Checklist

- [x] Register `wildspotter.app` domain
- [x] Create Cloudflare account + Pages project + D1 database
- [x] Create Resend account + verify sending domain (DKIM/SPF)
- [x] Set up `wildspotter-landing` git repo
- [x] Build Astro project with sections 1-6
- [x] Write ES + EN copy for all sections
- [x] Render ParkingLleno 10s cut → upload to R2 (self-hosted in `public/videos/hero.mp4`)
- [x] Implement `/api/subscribe` + `/api/confirm` Pages Functions
- [x] Implement live Pioneer counter (cached 60s)
- [x] Write confirmation + welcome email templates in Resend
- [ ] Set up Plausible/PostHog
- [x] Test full flow: form → email → confirm → welcome email → database row with correct position (verified end-to-end 2026-04-08, Pioneer #1 assigned)
- [x] Legal: privacy policy page, unsubscribe flow, data export/delete
- [x] Deploy to production, verify HTTPS + custom domain (https://wildspotter.app live)
- [ ] Add landing URL to all TikTok/Instagram bio links before marketing week 1

## 12. Post-Launch Maintenance

- Weekly export of waitlist growth to track campaign performance per video
- If Pioneer tier fills before launch (>500 signups), remove the counter badge and switch copy to "Explorer €34.99/yr — early access"
- Consider adding a referral mechanism: "Comparte tu link. Cada 3 amigos que confirmen te suben 50 posiciones." (only if organic signups plateau)

## 13. References

- [launch-plan.md](launch-plan.md) Phase 2.5 + Phase 5
- [monetization-plan.md](monetization-plan.md) — Pioneer tier definition
- [marketing-strategy.md](../marketing-path/marketing-strategy.md) — Videos that drive traffic here
- [privacy-policy.md](privacy-policy.md) — Data handling terms
