# WildSpotter

Geographical exploration tool for the overland/vanlife community. A "radar" that processes geographic, topographic, and legal data to find undiscovered overnight parking spots.

**Full spec:** @SPEC_V2.md

## Stack

- **App:** React Native + Expo (Expo Router), TypeScript strict
- **Maps:** MapLibre GL (`@maplibre/maplibre-react-native`)
- **AI:** ONNX Runtime or PyTorch (server-side inference in Python workers)
- **Backend:** Fastify (TypeScript) API, Python workers, PostgreSQL + PostGIS, n8n (Docker Compose)
- **Data:** Local OSM via Geofabrik/osm2pgsql, Terrain-RGB, CORINE Land Cover 2018, Spanish WMS (server-side)
- **Design:** Dark radar theme — see `design/wildspotter-mockup.pen`

## Project Structure

```
src/
├── app/                     # Expo Router screens & layouts
│   ├── (tabs)/              # Tab-based navigation
│   │   ├── map.tsx          # Map view with scanner
│   │   ├── spots.tsx        # Saved/discovered spots list
│   │   ├── legal.tsx        # Guide hub (pipeline explainer, overnight tips, legal card)
│   │   └── config.tsx       # Settings screen
│   ├── spot/[id].tsx        # Spot detail screen
│   ├── legal-detail.tsx     # Legal sources detail (pipeline flow, data sources, disclaimer)
│   └── _layout.tsx          # Root layout
├── components/              # Reusable UI components
│   ├── map/                 # Map-specific (markers, overlays, scanner)
│   ├── spots/               # Spot cards, lists, badges
│   ├── legal/               # Legal status indicators, LegalSituation verdict
│   ├── guide/               # Guide hub sections (pipeline, overnight tips, sources)
│   └── ui/                  # Generic (buttons, cards, sheets)
├── services/                # Business logic & API clients
│   ├── api/                 # Typed API client for Fastify backend
│   └── cache/               # AsyncStorage offline cache layer
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand state management
├── types/                   # Shared TypeScript types & interfaces
├── utils/                   # Pure utility functions
├── i18n/                    # Internationalization (es/en)
│   ├── index.ts             # t() helper, locale detection, DEFAULT_LOCALE='es'
│   ├── types.ts             # TranslationKeys type (enforces key completeness)
│   └── locales/             # es.ts (default), en.ts
└── constants/               # App-wide constants & config
backend/                     # Fastify API (TypeScript)
├── src/
│   ├── index.ts             # Entry point, Fastify setup, CORS
│   ├── routes/              # API route handlers
│   ├── models/              # TypeScript types + DB queries
│   ├── services/            # PostGIS query builders (pg + raw SQL)
│   └── config.ts            # Settings from env vars
├── Dockerfile
├── package.json
└── tsconfig.json
workers/                     # Processing scripts (Python)
├── api.py                   # Flask API server
├── utils.py                 # Shared utilities (DB connection, logging)
├── run_all.py               # Pipeline orchestrator
├── pipeline/                # Spot processing pipeline
│   ├── terrain.py           # Terrain-RGB slope/elevation
│   ├── legal.py             # PostGIS spatial legal checks
│   ├── ai_inference.py      # ONNX/PyTorch satellite analysis
│   ├── ai_vision_labeler.py # Claude Vision enrichment
│   ├── context_scoring.py   # Spatial context scoring
│   ├── amenities_scoring.py # Amenities bonus scoring
│   ├── landcover.py         # CORINE Land Cover classification
│   ├── scoring.py           # Composite score calculation (V4)
│   ├── extract_candidates.py # OSM candidate extraction
│   └── location.py          # Reverse geocode municipality/province via PostGIS
├── legal/                   # Legal monitoring pipeline
│   ├── source_monitor.py    # Hash-based change detection
│   ├── scheduler.py         # Polling scheduler (long-running)
│   ├── classifier.py        # Keyword gate + LLM classification
│   ├── llm.py               # Ollama/Haiku LLM abstraction
│   ├── bootstrap.py         # Initial data load orchestrator
│   ├── dedup.py             # Cross-source deduplication
│   ├── expiration.py        # Document expiration + seasonal
│   ├── notifications.py     # ntfy.sh push alerts
│   └── ...                  # geocoder, health_monitor, pdf_*, etc.
├── watchers/                # Legal bulletin source watchers
│   ├── boe_watcher.py       # BOE national gazette
│   ├── aemet_watcher.py     # AEMET fire risk API
│   ├── rss_watcher.py       # Generic RSS (8 CCAA)
│   ├── html_scraper.py      # Generic HTML (6 CCAA)
│   └── bop_scraper.py       # 50 provincial BOPs
├── Dockerfile
└── requirements.txt
n8n/                         # n8n workflow definitions
├── pipeline-workflow.json   # Spot processing pipeline
└── legal-email-workflow.json # Gov email ingestion
db/                          # Database initialization
├── init.sql                 # PostGIS extension + table creation
└── migrations/              # Schema migrations
data/                        # Data volumes (gitignored)
├── spain-latest.osm.pbf     # Pre-downloaded Geofabrik extract
├── satellite_tiles/         # Cached satellite imagery
└── legal/                   # Legal pipeline data
    ├── decrees/             # 17 CCAA tourism decree JSONs
    ├── ine_municipios.xlsx  # INE municipality codes
    └── cnig_municipios/     # CNIG municipal boundary shapefiles
assets/store/                # App store & signing assets
models/                      # ML model files (.onnx)
design/                      # Mockups (.pen) and exported PNGs
docker-compose.yml           # Stack orchestration
```

## Pipeline & Scoring (V4 — current)

The processing pipeline has 7 stages: **Radar → Terrain → Legal → Satellite Eye → Context → Landcover → Score**.

- **Landcover** (`workers/pipeline/landcover.py`): Classifies each spot against CORINE Land Cover 2018 (44 classes, EU-wide). Stores `landcover_class` (e.g. "323") and `landcover_label` (e.g. "Vegetación esclerófila"). Source: Copernicus Land Monitoring Service.
- **Scoring formula (V4):** `Terrain × 10% + AI × 55% + Context × 15% + wild_bonus − landcover_penalty`
  - **Wild bonus** (up to +30): awarded for wild archetypes (coastal, alpine, water, forest dead-end, scenic viewpoint). Gated by Claude Vision AI sub-scores (surface_quality, open_space, obstruction_absence ≥ 6/10 each).
  - **Landcover penalty**: deducted when CORINE class indicates agricultural, urban, or industrial land.
- **Data sources:** OSM (Geofabrik), Terrain-RGB (AWS/IGN), MITECO shapefiles, Catastro REST API, IGN PNOA orthophotos, CORINE Land Cover 2018 (Copernicus).

## Coding Practices

### General Rules
- TypeScript strict mode, no `any` — use `unknown` + type guards
- Max 200 lines per file — split into focused modules when approaching limit
- One export per file for components and services; barrel exports via `index.ts`
- Named exports only, no default exports
- Prefer `const` arrow functions for components and handlers
- Absolute imports via `@/` alias (e.g., `@/services/api`)

### Naming
- Files: `kebab-case.ts` for utils/services, `PascalCase.tsx` for components
- Types/Interfaces: `PascalCase`, prefix interfaces with `I` only if clashing
- Constants: `SCREAMING_SNAKE_CASE`
- Hooks: `use` prefix (e.g., `useMapScanner`)
- Stores: `use` + domain + `Store` (e.g., `useSpotsStore`)

### Components
- Functional components only, no classes
- Props type defined above component in same file
- Destructure props in function signature
- Keep components under 100 lines — extract hooks for logic
- Co-locate styles with component using StyleSheet.create

### State Management
- Zustand for global state (spots, settings, scan results)
- React state for local UI state only
- No prop drilling beyond 2 levels — use store or context

### Services
- Each service is a directory with `index.ts` + internal modules
- Pure functions where possible, no side effects in utils
- Mobile app calls the local Fastify backend. Heavy GIS/AI processing runs in Python Docker workers.
- Cache-first strategy: check local cache before network

### Error Handling
- Custom error types per service domain
- Errors at boundaries only (API calls, file I/O)
- Let errors propagate naturally, catch at screen level
- User-facing errors as typed result objects, not thrown exceptions

### Testing
- Tests in `__tests__/` mirroring `src/` structure
- Unit tests for services and utils
- Component tests with React Native Testing Library
- Name: `[module].test.ts` or `[Component].test.tsx`
- **Live E2E:** Tester agent runs Expo Web (`npx expo start --web`) and verifies in Chrome via browser automation — visual checks, console errors, network requests, GIF recordings
- UI work is not done until browser-verified, not just unit-tested

### Performance
- All AI inference server-side in Python workers, batch-processed via n8n pipelines
- Lazy load heavy modules (MapLibre)
- Memoize expensive computations (score calculations)
- Offline-first: cache API responses in AsyncStorage

## Design Tokens

- **Background:** `#0A0F1C` (deep navy)
- **Card surface:** `#1E293B` (slate)
- **Accent:** `#22D3EE` (electric cyan)
- **Score high:** `#4ADE80` (green, 80+)
- **Score medium:** `#22D3EE` (cyan, 60-79)
- **Score low:** `#FBBF24` (amber, <60)
- **Data font:** JetBrains Mono
- **Body font:** Inter

## DISTILLED_AESTHETICS_PROMPT

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>


## Agent Workflow (Default Behavior)

When implementing features, fixing bugs, or doing any non-trivial task, **always use the project agents** defined in `.claude/agents/`. This is the default workflow, not the exception.

- **orchestrator** — Entry point for multi-step tasks. Breaks work down and delegates.
- **developer** — Writes implementation code (TypeScript frontend + backend).
- **backend-engineer** — Fastify API, Docker, database, and Python worker development.
- **tester** — Writes unit tests AND runs live browser E2E verification via Chrome automation.
- **reviewer** — Reviews code against spec and conventions.
- **debugger** — Investigates and fixes bugs.
- **geo-researcher** — Researches geographic data sources and PostGIS query patterns.
- **legal-data-scout** — Researches Spanish government data services.
- **design-validator** — Validates UI against design mockups.

For simple, single-file changes (typo fix, config tweak), agents are optional. For anything involving new features, modules, or bug fixes — use the orchestrator or the relevant agent team.

## Cost Discipline

WildSpotter runs on a hobby budget — target **~€25/mo all-in** per `docs/monetization-plan.md`. Before running any command that creates a billable cloud resource (Hetzner server/volume/IP, extra Cloudflare add-ons, paid API keys beyond Anthropic), stop and confirm with the user. One-off local-only costs (AI model inference during pipeline runs) are fine within the explicit Phase 0 budget.

- Default to **no new recurring costs**.
- Stage and prod share **one Hetzner CX43** — no second server.
- See `.claude/skills/hetzner-deploy/SKILL.md` for detailed cost rules.

## Token Budget — User Runs Heavy Tasks

Claude's token consumption is a hard constraint. Long-running, large-output, or large-input tasks must be done **by the user**, not by Claude.

- **[USER] tasks (default for anything heavy):** downloads, `ogr2ogr` imports, full pipeline runs, `docker-compose` log tailing, batch SQL re-scoring, opening folders of satellite tiles, scanning large CSVs / SHP / GPKG files, visual audits of many images.
- **[CLAUDE] tasks:** writing migrations, writing worker code, designing SQL queries, designing the scoring formula, code review, interpreting **short** results the user pastes back.
- **Plans must tag every step `[USER]` or `[CLAUDE]`.** See `docs/scoring-v3-plan.md` for the convention.
- **Definitions of done must specify the minimal output to paste back** (e.g., "paste the count + the false-positive osm_ids with one-word descriptors"). Never ask the user to paste full tables, log files, or directory listings.
- **Never read large files / tile folders / log dumps into context** — ask the user to grep, sample, or summarise first.
- For visual audits: the user does the looking; Claude only sees the verdict and the IDs that need attention.

## Token Budget - Local MCP Server Ollama to avoid reach claude subscription limit

An MCP server configured at mcp-ollama-worker is available to delegate simple or repetitive tasks to the local Qwen3.6 and Gemma4 model (via Ollama). This saves cloud tokens and speeds up basic tasks like summarizing or data extraction.

Use it whever you think it can save tokens or speed up the task. Saving tokens is the priority if you suspect the task is too much for ollama models and you'll need to review a lot of code that wouldn't imply any saving in tokens. Always review but avoid large reviews. Ollama is prefered over user manual work if it is obvious.

**SAVE CLAUDE TOKENS**
**This is a continuation and complementary of the Token Budget — User Runs Heavy Tasks**

## Protected Files

- **`SPEC.md`** — Do NOT modify unless the user explicitly asks
- **`SPEC_V2.md`** — Do NOT modify unless the user explicitly asks
- **`SPEC_V3.md`** — Do NOT modify unless the user explicitly asks (extends V2; see file header)
- **`design/`** — Do NOT modify any file in this directory unless the user explicitly asks
- These files are reference material, not implementation targets

## Commands

```bash
npx expo start              # Dev server
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator
npm test                    # Run tests
npm run lint                # ESLint
docker-compose up -d --build   # Start full backend stack
docker-compose logs -f api     # Follow API logs
docker-compose down            # Stop all services

# Pipeline management (run inside worker container)
docker-compose exec worker python run_all.py                       # Full pipeline, 4 terrain workers
docker-compose exec worker python run_all.py --terrain-workers 8   # More parallelism
docker-compose exec worker python run_all.py --batch-size 200      # Smaller batches
docker-compose exec worker python run_all.py --no-terrain          # Skip terrain, run legal/AI/scoring only
```
