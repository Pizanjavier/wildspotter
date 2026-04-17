# WildSpotter — Landing Page

Astro + Preact waitlist landing page for the WildSpotter app. Captures TikTok/Reels traffic and sells the Pioneer tier (€24.99/yr lifetime, first 500 signups).

**Parent project:** @../CLAUDE.md
**Product spec:** @../SPEC_V2.md
**Landing spec:** @../docs/landing-spec.md
**Marketing sibling (video ads, strategy, footage):** @../marketing-path/CLAUDE.md
**Marketing strategy doc:** @../marketing-path/marketing-strategy.md

## Stack

- **Framework:** Astro 4 (static SSG), TypeScript strict
- **UI islands:** Preact 10 (`@astrojs/preact`) for `EmailForm`, `PioneerCounter`
- **Styles:** Tailwind CSS v4 via `@tailwindcss/vite`, tokens in `src/styles/global.css`
- **Backend:** Cloudflare Pages Functions (`functions/api/*`) + D1 (SQLite at the edge)
- **i18n:** `/` = Spanish (default), `/en/` = English. Copy in `src/i18n/{es,en}.ts`, shared `Dict` type

## Visual Language

This landing does **NOT** use the app's navy/cyan radar theme. It uses the **warm earthy palette** shared with the marketing videos (`../marketing-path`):

- `--color-bg: #0F0D0B` · `--color-bg-warm: #2A1F15` · `--color-card: #221B16`
- `--color-accent: #D97706` · `--color-accent-glow: #F59E0B`
- `--color-text: #F5EBD8` (cream) · `--color-muted: #B7A089`
- Fonts: **Inter Variable** (sans) + **JetBrains Mono** (data/eyebrows)

Rhythm rule: alternate video-backed sections with static stylish sections so the page is not uniformly video-flooded. Current rhythm: Hero (video) → Problem (gradient) → Pipeline (grid) → Legal (video) → Offer (gradient) → CTA (video).

## Content Rules

- **Spanish must sound native**, not machine-translated. No "Sin furgos encima" weirdness.
- **Never invent stats.** Only real, sourced numbers (27% Natura 2000, 600€ sanction, 5 data sources). If you don't have a source, use a qualitative phrase.
- **Honest promise:** first 500 Pioneer lifetime price. The counter shows seats LEFT + taken/500.
- **No lyrics, no copyrighted copy** from competitors.

## Assets

- Videos: `public/videos/{hero,legal,cta}.mp4` (trimmed/compressed from `../marketing-path/public/videos/` and `../marketing-path/out/*_subvideo.mp4` via ffmpeg). Keep each under ~2 MB.
- Logo: `public/logo.svg` (sourced from `../design/app-logo-1024.png`)

## Skills (local to this folder)

Located in `.claude/skills/`:
- **frontend-design** — aesthetic guidance, avoid AI-slop, typography/color/motion principles
- **e2e-test** — browser verification flow via Chrome MCP

For marketing-oriented work (copy, funnel, channel strategy), read `../marketing-path/marketing-strategy.md` and the sibling CLAUDE.md.

## Commands

```bash
npm run dev            # Astro dev server on :4321
npm run build          # Static build to dist/
npx wrangler pages dev dist --d1 DB=./local.db   # Full stack w/ D1
```

## Verification

The user hosts this locally at **http://localhost:4321**. Always verify visual changes in Chrome via the `mcp__claude-in-chrome__*` tools against that URL. The side panel may be locked at 150px; use `javascript_tool` DOM introspection (offsetWidth, querySelector) instead of visual screenshots when that happens.

## Pipeline & Scoring (pending update)

The landing page currently shows a **6-stage pipeline** (Radar/Terreno/Legal/Satélite/Contexto/Puntuación) and the **LegalTrust section** lists 4 data sources (MITECO/IGN/Catastro/OSM). Both need updating to reflect V4:

- **Pipeline** should show 7 stages: add **Uso del Suelo** (CORINE Land Cover) between Contexto and Puntuación. Update `src/i18n/{es,en}.ts` → `pipeline.stages`.
- **LegalTrust** should add **Copernicus** as a 5th data source. Update `src/components/LegalTrust.astro` and the i18n copy.
- **Scoring description** (stage 06/07 copy) should reference the V4 formula: Terrain 10% + AI 55% + Context 15% + wild_bonus − landcover_penalty.

These changes are cosmetic (i18n strings + one component) and do not affect the backend or form logic.

## Coding Rules (inherits from parent)

- TypeScript strict, no `any`
- Named exports only, one component per file, kebab-case utils / PascalCase components
- Astro `.astro` components for static sections; Preact `.tsx` only for interactive islands
- Never modify `../SPEC.md`, `../SPEC_V2.md`, or `../design/` — reference only
- Always review mobile sizing (grid stacks, text sizes, button overflow) before declaring done
