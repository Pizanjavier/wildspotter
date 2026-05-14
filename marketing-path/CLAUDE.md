# WildSpotter — Marketing & Video Production

Standalone Remotion project for promotional videos, social content, and marketing materials.

**Parent project:** `../` — see `../SPEC_V2.md` for product spec, `../CLAUDE.md` for app conventions.

## What is WildSpotter?

Geographical exploration tool for the **overland and vanlife community** in Spain. A "radar" that processes geographic, topographic, legal, and satellite data to find undiscovered overnight parking spots.

**Core pipeline (7 stages):** Radar -> Topographer -> Legal Judge -> Satellite Eye -> Context Analyst -> Landcover -> Success Score

**V4 scoring:** `Terrain x 10% + AI x 55% + Context x 15% + wild_bonus - landcover_penalty`

> Existing videos (ParkingLleno, OchentaYSiete, etc.) show 5 stages and old V2 weights (20/25/55). Future videos must show 7 stages and V4 formula.

**Key message:** Unlike user-generated directories that lead to massification, WildSpotter **discovers spots no one has shared** by analyzing raw geographic data with AI-powered satellite vision.

**Audience:** Vanlifers, overlanders, digital nomads, road-trippers exploring Spain.

## Stack

- **Video Engine:** Remotion 4.x (React-based programmatic video)
- **UI:** React 19, TypeScript strict
- **Styling:** Tailwind CSS v4 (via `@remotion/tailwind-v4`)
- **Config:** `remotion.config.ts` — JPEG output, overwrite enabled, Tailwind webpack override

## Marketing Palette (for videos)

Videos use a **warm earthy palette**, NOT the app's navy/cyan design system.

| Token | Value | Usage |
|-------|-------|-------|
| **Background** | `#0F0D0B` / `#1A1614` | Near-black warm brown |
| **Card surface** | `#1E1A17` | Dark brown, borders `#3D3530` |
| **Accent** | `#D97706` | Amber — highlights, CTAs, score rings, scan pulses |
| **Muted text** | `#A0836C` | Warm tan — secondary text |
| **Primary text** | `#FFFFFF` | White |
| **Score high** | `#4ADE80` | Green — scores 80+ |
| **Score medium** | `#22D3EE` | Cyan — scores 60-79 |
| **Score low** | `#FBBF24` | Amber — scores < 60 |
| **Data font** | JetBrains Mono | Scores, coordinates, metrics |
| **Body font** | Inter | Titles, descriptions, body text |

**App design tokens** (navy `#0A0F1C`, cyan `#22D3EE`) are for the app UI inside phone frames only — never for the marketing video chrome. The logo uses its own real colors (orange gradient from `app-logo-1024.png`).

The aesthetic is **warm and earthy**, not military/hacker/tech. The app "scans" and "detects" — use natural language, not military jargon. No CRT scan lines, glitch effects, or "SENAL DETECTADA" language.

## App UI Scenes

When showing the app inside a phone frame:
- Must visually match the **real app** — same color tokens, map style, component proportions.
- Use CARTO Voyager map image as background. Don't draw fake roads in SVG.
- Phone frame interior uses **app tokens** (`#1A1614` bg, amber accents), not the video's earthy palette.

### Testing the live app

The Expo dev server runs at `http://localhost:8081`. Use Chrome browser automation to capture real screenshots and GIFs for authentic marketing material — always prefer live captures over static mockups.

## Project Structure

```
marketing-path/
src/
  Root.tsx              # Remotion entry — registers all composition variants
  components/           # Reusable components (StoreInstallIntro, GenericHook, etc.)
  scenes/               # ParkingLleno scenes
  scenes-87/            # OchentaYSiete scenes
  scenes-radar/         # ElRadarDetecto scenes (data-driven, reusable)
  [Video].tsx           # One orchestrator per video concept
scripts/
  render-all-variants.sh
public/                 # Static assets (images, audio, fonts, videos)
docs/
  production-guidelines.md  # All video production rules (footage, typography, audio, timing, etc.)
  footage-music-map.md      # Which clips and tracks are assigned to which video
.agents/skills/         # 35 marketing strategy skills
.claude/skills/         # Remotion-specific skills
```

## Produced Videos

Each video has **hook variants** (different first 3s) and optional **store intro** (3.5s). All registered in `Root.tsx` via props — no file duplication.

| File | Base ID | Variants |
|------|---------|----------|
| `ParkingLleno.tsx` | ParkingLleno | A1, A2, A3 + Intro |
| `Natura2000Clip.tsx` | Natura2000Clip | N1, N2 + Intro |
| `LaMulta.tsx` | LaMulta | C1, C2, C3 + Intro |
| `OchentaYSiete.tsx` | OchentaYSiete | B1, B2, B3 + Intro |
| `ElPipeline.tsx` | ElPipeline | D1, D2, D3 + Intro |
| `ElRadarDetecto.tsx` | ElRadarDetecto | RD1, RD2, RD3, RD4 (data-driven) |
| `ElPrimerCafe.tsx` | ElPrimerCafe | PC1, PC2, PC3 |
| `TuPerroLoSabe.tsx` | TuPerroLoSabe | P1, P2 |
| `NoLoBusque.tsx` | NoLoBusque | NB1, NB2, NB3 |
| `MientrasTodosBuscan.tsx` | MientrasTodosBuscan | MT1, MT2 |
| `LasCoordenadas.tsx` | LasCoordenadas | E1, E2, E3 |
| `PuenteDeMayo.tsx` | PuenteDeMayo | — |
| `QuizLegal.tsx` | QuizLegal | — |

Check `Root.tsx` for the authoritative list of all registered compositions and their exact IDs.

Footage and music assignments per video: see `docs/footage-music-map.md`.

## Commands

```bash
npm run dev                   # Open Remotion Studio (preview)
npx remotion render MyComp    # Render specific composition
./scripts/render-all-variants.sh          # All variants
./scripts/render-all-variants.sh --hooks-only  # Hook variants only
npm run lint                  # ESLint + TypeScript check
```

## Coding Practices

- TypeScript strict mode, functional React components only
- Tailwind v4 utility classes for styling
- Register all compositions in `src/Root.tsx`
- One file per video/scene, keep modular
- Use `useCurrentFrame()` and `interpolate()` for animations
- Load the `remotion-best-practices` skill before writing Remotion code

## Content Guidelines

- **Tone:** Adventurous, bold, tech-savvy. Speak to independent travelers who hate tourist traps.
- **Never promise** spots are "legal" or "safe" — the app provides data, not guarantees.
- **Core message:** "Find spots no one has shared."
- **Show the pipeline** — the radar/scanner metaphor is powerful for demos.
- **Spain focus** for MVP.
- **Video-first:** Real footage + animated text overlays + app UI demos. No pure motion-graphics-only videos.
- **Emotional arc:** Problem (crowded) -> Pivot (nature) -> Solution (app) -> Payoff (van in nature).
- **Never name competitors** (Park4night, iOverlander) — use "Otras apps". Not in hashtags either.
- **Max 5 hashtags** per post.

## Production Guidelines

All video production rules (footage selection, typography, audio, timing, layout, safe zones, data accuracy, visual patterns) live in **`docs/production-guidelines.md`**. Read it before producing any video.

## Agent Workflow

Two specialized agents. **Use them by default** for any content or video task.

```
community-manager -> content brief -> remotion-producer -> Remotion composition -> rendered video
```

| Task | Agent |
|------|-------|
| Captions, calendars, audits, copys, content strategy | community-manager |
| Build/fix Remotion compositions | remotion-producer |
| New video end-to-end | community-manager (brief) -> remotion-producer (build) |
| Quick single-file code fix | Direct edit (no agent needed) |

## Marketing Skills

35 pre-loaded skills in `.agents/skills/` covering content, growth, ads, SEO, CRO, email, strategy, sales, analytics, and video production. Load the relevant skill before starting any marketing task.

## Spelling mistakes
No mistakes in the spanish spelling. If you make a mistake, fix it immediately. Special atention with accents.

## Local Ollama MCP Server
An MCP server is available to delegate simple or repetitive text generation tasks to the local Qwen3 model (via Ollama). This saves cloud tokens and speeds up basic tasks like summarizing or data extraction.