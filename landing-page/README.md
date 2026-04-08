# WildSpotter — Waitlist Landing

Astro 4 + Tailwind v4 + Preact islands. Deployed to Cloudflare Pages with D1 + Pages Functions.

## Local development

```bash
cd landing-page
npm install
cp .dev.vars.example .dev.vars   # fill in keys (optional in dev)
npm run dev                      # http://localhost:4321
```

The Pages Functions in `functions/` are wired through Wrangler when running with:

```bash
npm run build
npx wrangler pages dev dist --d1 DB=wildspotter-waitlist
```

In plain `npm run dev` the API endpoints will 404 — use the wrangler command above to test the full flow with D1.

## Cloudflare setup (one-time)

```bash
# 1. Auth
npx wrangler login

# 2. Create the D1 database and copy the database_id into wrangler.toml
npx wrangler d1 create wildspotter-waitlist

# 3. Apply schema
npx wrangler d1 execute wildspotter-waitlist --file=db/schema.sql            # local
npx wrangler d1 execute wildspotter-waitlist --file=db/schema.sql --remote   # production

# 4. Secrets
npx wrangler pages secret put RESEND_API_KEY
npx wrangler pages secret put TURNSTILE_SECRET   # optional
```

## Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name wildspotter-landing
```

Or connect the repo in the Cloudflare Pages dashboard:
- Build command: `npm run build`
- Output dir: `dist`
- Compatibility date: `2024-11-20`

## TODO before launch

- [ ] Buy/connect `wildspotter.app` domain in Cloudflare
- [ ] Render the ParkingLleno 10s hero loop and upload to R2 → replace `VIDEO_URL` in `src/components/Hero.astro`
- [ ] Generate a poster frame at `public/hero-poster.jpg`
- [ ] Verify Resend sender domain (DKIM/SPF)
- [ ] Set `RESEND_API_KEY` and `TURNSTILE_SECRET` as Cloudflare Pages secrets
- [ ] Replace `database_id` placeholder in `wrangler.toml`
- [ ] (Optional) Add Plausible/PostHog analytics snippet to `Base.astro`
