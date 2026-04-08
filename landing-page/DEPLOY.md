# WildSpotter Landing — Deploy Guide

Target: `https://wildspotter.app` on Cloudflare Pages. Domain already in the user's Cloudflare account.

## 0. Prerequisites

- Cloudflare account with `wildspotter.app` zone active
- `wrangler` CLI logged in: `npx wrangler login`
- Resend account (free tier)
- Cloudflare Turnstile widget (free tier)

## 1. Create the D1 database

```bash
npx wrangler d1 create wildspotter-waitlist
```

Copy the printed `database_id` into two files:

- `wrangler.toml` → `[[d1_databases]] database_id = "..."`
- `workers/wrangler.cleanup.toml` → same `database_id`

## 2. Apply the schema (local + remote)

```bash
# Local dev DB (for `wrangler pages dev`)
npx wrangler d1 execute wildspotter-waitlist --local --file=migrations/0001_waitlist.sql

# Production DB
npx wrangler d1 execute wildspotter-waitlist --remote --file=migrations/0001_waitlist.sql
```

## 3. Turnstile (invisible CAPTCHA)

1. Cloudflare dashboard → Turnstile → Add site → Domain `wildspotter.app`, widget mode **Invisible**.
2. Copy the **Site Key** into `src/islands/EmailForm.tsx` (replace the test key `1x00000000000000000000AA`).
3. Copy the **Secret Key** — set it later in step 5.

The test keys currently committed always pass verification — fine for dev, **must be replaced before go-live**.

## 4. Resend (transactional email)

1. Create a sending API key in Resend dashboard.
2. Verify the `wildspotter.app` sending domain: add the DKIM/SPF/Return-Path DNS records Resend shows into your Cloudflare DNS for the zone. Wait for all three to go green (~5 min).
3. Once verified, update `wrangler.toml`:
   ```toml
   RESEND_FROM = "WildSpotter <hola@wildspotter.app>"
   ```
   Until then, emails come from `onboarding@resend.dev` and may land in spam.

## 5. Create the Pages project

```bash
# From landing-page/
npm run build
npx wrangler pages project create wildspotter-landing --production-branch main
npx wrangler pages deploy dist --project-name wildspotter-landing
```

Or via dashboard: Pages → Create project → Connect Git → point at the repo, build command `npm run build`, output `dist`, root `landing-page/`.

## 6. Bind the D1 database to Pages

Dashboard → Pages → wildspotter-landing → Settings → Functions → D1 bindings → Add:

- Variable name: `DB`
- Database: `wildspotter-waitlist`

(Apply to both **Production** and **Preview** environments.)

## 7. Set Pages secrets

```bash
npx wrangler pages secret put RESEND_API_KEY   --project-name wildspotter-landing
npx wrangler pages secret put TURNSTILE_SECRET --project-name wildspotter-landing
```

Paste the values when prompted.

## 8. Bind the custom domain

Dashboard → Pages → wildspotter-landing → Custom domains → Set up a custom domain → `wildspotter.app` (and optionally `www.wildspotter.app`). Cloudflare detects the zone and wires DNS automatically.

## 9. Deploy the cleanup Worker (separate from Pages)

The 30-day GDPR cleanup is a standalone Worker with a cron trigger — it cannot live inside Pages Functions.

```bash
cd workers
npx wrangler deploy -c wrangler.cleanup.toml
```

Confirm the cron shows under dashboard → Workers → wildspotter-waitlist-cleanup → Triggers.

## 10. Smoke test against production

1. Visit `https://wildspotter.app`, submit a real email.
2. Check inbox for the confirmation email (first send may take ~30s, later ones are instant).
3. Click confirm → should land on `/gracias?pos=1` showing Pioneer #1.
4. Refresh the home page → counter should show `1` taken.
5. Check D1:
   ```bash
   npx wrangler d1 execute wildspotter-waitlist --remote \
     --command="SELECT position, status, is_pioneer, email FROM waitlist ORDER BY position DESC LIMIT 5"
   ```

## 11. Post-deploy checklist

- [ ] Turnstile real site key swapped in `EmailForm.tsx`
- [ ] Resend domain verified, `RESEND_FROM` updated
- [ ] `DB` binding attached to both Production and Preview
- [ ] Secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET`) set
- [ ] Custom domain `wildspotter.app` serving HTTPS
- [ ] Cleanup Worker cron visible in dashboard
- [ ] Smoke test: submit → confirm → gracias → counter increments
- [ ] Add `https://wildspotter.app/?utm_source=tiktok&utm_campaign=parkinglleno` to TikTok/IG bio links

## Local development

```bash
# Apply schema to the local D1 once:
npx wrangler d1 execute wildspotter-waitlist --local --file=migrations/0001_waitlist.sql

# Astro-only (no Functions, form will 404):
npm run dev

# Full stack (Pages Functions + D1) — use this for backend testing:
npm run build && npx wrangler pages dev dist --d1 DB=wildspotter-waitlist
```

## Out of scope for this deploy

- Plausible/PostHog analytics wiring
- Launch-day campaign email script (Phase 8 in `../docs/landing-spec.md`)
- Email 4 follow-up automation
- `/api/privacy/export` and `/api/privacy/delete` endpoints (manual D1 queries suffice until signups grow)
