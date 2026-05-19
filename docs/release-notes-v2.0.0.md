# Release Notes — v2.0.0

**Date:** 2026-05-19
**Branch:** `feature/legal-monitoring-pipeline` merged to `main`
**App:** 2.0.0 (iOS buildNumber 6, Android versionCode 5)
**Backend API:** 1.0.0
**Commits:** `e6da3ad..bcb3521` (205 files changed, ~17k lines added)

---

## Summary

Major release introducing the automated legal monitoring pipeline, redesigned Legal tab with per-CCAA status and park-specific verdicts, interactive spot popups on the map, PostHog analytics with session replay, and municipality/province data for all spots.

---

## Backend & Infrastructure

### Legal Monitoring Pipeline (new)
- **89 automated sources** across all 17 CCAA: BOE national gazette, AEMET fire risk API, RSS feeds (8 CCAA), HTML scrapers (6 CCAA), 50 provincial BOP scrapers
- **Classifier:** keyword gate + LLM classification (Claude Haiku) for document relevance and restriction type
- **Scheduler:** long-running `legal-watcher` service with configurable poll intervals per source
- **Health monitoring:** per-source health tracking (GREEN/YELLOW/RED), consecutive failure detection
- **Deduplication:** cross-source dedup to prevent duplicate legal documents
- **Expiration:** automatic document expiration and seasonal rule handling
- **Notifications:** ntfy.sh push alerts for new restrictions
- **PDF pipeline:** OCR-capable PDF extraction for scanned bulletins
- **Geocoder:** municipality-level geocoding of legal documents against CNIG boundaries
- **Bootstrap:** initial data load orchestrator with 125+ curated baseline documents
- **Park rules baseline:** PRUG-sourced overnight rules for all National Parks with geometry-linked affected areas

### Email ingestion (new)
- n8n workflow polls Gmail IMAP every 5 minutes for 6 CCAA bulletin subscriptions (DOGC, DOG, DOCM, MiBON, DOE, BOR)
- Worker endpoint `/legal/poll-email` connects, reads UNSEEN, runs keyword gate, stores matches
- Bypasses watcher→classifier flow (email content is pre-filtered by subscription topic)

### Legal API endpoints (new)
- `GET /legal/sources` — list all monitored sources with health status
- `GET /legal/documents` — list recent legal documents with CCAA/type filters
- `GET /legal/documents?lat=X&lon=Y&radius=Z` — documents affecting a location (spatial query)
- `GET /legal/documents/:id` — single document with `decree_articles`
- `GET /legal/decrees/:ccaa` — tourism decrees for a CCAA
- `GET /legal/health` — pipeline health overview
- `GET /legal/dashboard` — internal HTML dashboard (Docker-internal only, not internet-exposed)

### Spot API changes (additive, non-breaking)
- Summary response now includes: `municipality`, `province`, `satellite_image_path`, `context_details`
- Detail response now includes: `municipality`, `province`, `landcover_class`, `landcover_label`, `siose_dominant`
- All new fields are nullable — v1.x clients ignore them safely

### Worker restructure
- Pipeline modules moved from `workers/*.py` to `workers/pipeline/*.py`
- Legal modules added at `workers/legal/*.py`
- Watcher modules added at `workers/watchers/*.py`
- Import paths updated across `api.py` and `run_all.py`
- Old scripts archived to `workers/_archive/`

### Database migrations
- **001_landcover.sql** — `landcover_class`, `landcover_label`, `siose_dominant` columns on spots
- **002_legal_pipeline.sql** — `legal_documents`, `legal_source_state` tables + indexes
- **003_legal_baseline.sql** — seed 125+ curated baseline legal documents
- **004_park_rules_baseline.sql** — seed park-specific overnight rules linked to National Park geometries
- **005_spot_location.sql** — `municipality`, `province` columns on spots + backfill from municipalities table

### Docker
- New `legal-watcher` service in `docker-compose.prod.yml` (2G RAM / 2 CPU limit, restart: unless-stopped)
- Worker service now includes IMAP env vars for email ingestion
- `.env.prod.example` updated with `AEMET_API_KEY`

### Geodata imports (prod)
- `national_parks` table: 1,788 polygons (MITECO, SRID 25830)
- `municipalities` table: 8,132 polygons (CNIG, SRID 4326)
- 71,815 spots backfilled with municipality/province via PostGIS reverse geocoding

---

## Frontend (React Native / Expo)

### MapView — major rewrite
- Complete rewrite of `MapView.tsx` (~1,000 lines) and `MapView.web.tsx`
- Spot markers now color-coded by overnight legal level (white=allowed, amber=restricted, red=prohibited) via `getOvernightLevel()`
- Saved spots rendered with bookmark icon overlay (`Images` + `SymbolLayer`)
- Spot tap opens `SpotPopup` instead of navigating directly to detail
- `view-shot` integration for map snapshot capture
- Legal legend overlay toggle explaining restriction zone colors
- Improved scan button, search bar, my location button, and map layers button styling
- MapOverlays updated with expanded legal zone rendering

### Map — SpotPopup (new)
- Interactive popup when tapping a spot marker on the map
- Shows spot name/municipality, score badge, satellite thumbnail, key legal status and overnight verdict
- Navigate and inspect actions directly from the popup
- Haptic feedback on interaction (`expo-haptics`)
- Save/unsave spot directly from popup

### Legal Tab — full redesign
- **CCAA Status Grid:** visual overview of all 17 autonomous communities with document counts and confidence tiers
- **CCAA Detail Card:** drill-down showing regional documents, decree articles, restriction types
- **CCAA Strip:** compact community identifier with color-coded status
- **Confidence Tier Badge:** visual indicator (verified / likely / unconfirmed)
- **Decree Article Card:** formatted display of specific regulation articles
- **Legal Disclaimer:** standard disclaimer about informational nature of legal data
- **Legal Documents List:** paginated list of all monitored documents with filters
- **LegalSituation component:** per-spot verdict engine combining pipeline data, park rules, and CCAA regulations

### Legal Detail screen (new)
- Deep-dive into legal pipeline: data flow visualization, source list, methodology explanation
- Accessible from the Legal tab

### Spot Detail — major redesign
- Municipality/province display in header with `getSpotDisplayName()` and translated surface types
- **LegalSituation** verdict integrated (replaces legacy `LegalChecklist` — overnight verdict with priority hierarchy: fire ban > private land > park > coastal > camping ban > Natura 2000 > CCAA decree > allowed)
- Legal documents fetched per-spot via `getLegalDocuments()` with spatial location query
- **ExpandableSection** component for collapsible data sections
- **SpotDetailSkeleton** loading state while fetching
- **GoogleMapsModal** replaces inline action buttons — modal with satellite inspect + navigation options
- **KeyDataStrip** compact metrics display (surface, slope, elevation)
- **SpotHighlights** quick-glance key attributes (scenic features, water access, privacy)
- Back navigation aware of origin screen (spots list vs map)
- Screen view tracking via `useTrackScreen`

### Spots Tab — enhancements
- **SortControls** component for spot list ordering
- **SpotCard** rewritten: satellite thumbnail via `buildSatelliteUrl()`, municipality/province subtitle, overnight legal indicator (color-coded icon), translated surface labels, save/unsave action, haptic feedback, focus highlighting, "show on map" action
- Spot navigation via `useSpotNavigation` hook with origin tracking
- Screen view and event tracking

### Guide tab
- **OvernightTips** component: practical vanlife overnight tips section

### ContextAnalysis — improvements
- Redesigned layout with expanded breakdown display
- Improved sub-score visualization

### Analytics — PostHog full suite (new)
- PostHog SDK with session replay (`posthog-react-native`, `posthog-react-native-session-replay`)
- Autocapture enabled across all screens
- `useTrackScreen` hook for consistent screen view tracking on all tab and detail screens
- Expanded `ANALYTICS_EVENTS` constants covering: scan actions, spot views/saves/reports, filter changes, legal tab interactions, CCAA drill-downs, config changes, cache operations, onboarding steps
- Analytics service rewritten with structured event properties
- Privacy policy updated to reflect PostHog data collection

### i18n
- ~180 new translation keys for legal pipeline UI, spot enhancements, and guide content (ES + EN)
- Type-safe translation keys via `TranslationKeys` type

### API client
- `getLegalDocuments(lat, lon, radius)` added to `services/api/spots.ts`
- `LegalDocument` and `DecreeArticle` types added to `services/api/types.ts`
- `SpotSummary` type expanded: `municipality`, `province`, `satellite_image_path`, `context_details`
- `SpotDetail` type expanded: `municipality`, `province`

### Stores
- `map-store`: added `selectedSpot` state for SpotPopup, legal legend visibility
- `scan-store`: additional scan state tracking
- `settings-store`: new setting entries

### Hooks (new)
- `useSpotNavigation` — consistent spot detail navigation with origin tracking
- `useCcaaStatus` — aggregate legal documents by CCAA for status grid
- `useBottomSheetTop` — dynamic bottom sheet height calculation
- `useTrackScreen` — PostHog screen view tracking

### Utils (new)
- `legal-verdict.ts` — `getOvernightLevel()` overnight verdict hierarchy for map/list coloring
- `spot-display-name.ts` — `getSpotDisplayName()` human-readable names with municipality, `getTranslatedSurface()` i18n surface labels
- `haptics.ts` — `hapticSelection()` / `hapticImpact()` wrappers around `expo-haptics`

### Constants (new/expanded)
- `ccaa-data.ts` — 17 CCAA metadata (names, codes, keys)
- `fonts.ts` — `FONT_FAMILIES` centralized font reference
- `theme.ts` — additional color tokens
- `analytics.ts` — expanded `ANALYTICS_EVENTS` constant map

### UI components
- `BottomSheet` — expanded API surface
- `TabBar` — styling refinements
- `AboutSection` (config) — version display updates
- `CacheSection` (config) — analytics event on cache clear
- `CollapsibleSection` (guide) — interaction improvements
- Onboarding screen — PostHog tracking integration

### n8n workflows
- `legal-email-workflow.json` — Schedule (5m) → `POST /legal/poll-email` for 6 email-subscribed CCAAs
- `pipeline-workflow.json` — moved from root to `n8n/` directory (was `n8n-workflow.json`)

---

## Version Bumps

| Component | Before | After |
|-----------|--------|-------|
| App (package.json) | 1.0.0 | 2.0.0 |
| App (app.json) | 1.0.0 | 2.0.0 |
| iOS buildNumber | 5 | 6 |
| Android versionCode | 4 | 5 |
| Backend API | 0.1.0 | 1.0.0 |

---

## Deploy Notes

### Migration order (critical)
1. Migrations 001-005 must be applied **before** restarting api/worker
2. `national_parks` and `municipalities` tables must exist before 004 and 005
3. api + worker must be rebuilt together (import paths changed)

### Rollback
- All migrations are additive (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`)
- v1.x app clients work with the new backend (extra nullable fields are ignored)
- Revert: `git checkout` previous commit, rebuild api + worker

### No downtime
- DB migrations are non-locking (new tables/columns only)
- Docker Compose restarts containers sequentially (~2-3s gap, covered by client cache)
- App store update is independent — old app works with new backend during 2-3 day review

---

## App Store Release Notes (short)

### English

> **What's new in WildSpotter 2.0**
>
> - Legal Monitor: real-time tracking of overnight regulations across all 17 Spanish regions, with park-specific rules and confidence ratings
> - Tap any spot on the map to see a quick preview with score, photo, and legal status
> - Every spot now shows its municipality and province
> - Improved spot cards with satellite thumbnails and context highlights
> - Performance and stability improvements

### Spanish

> **Novedades en WildSpotter 2.0**
>
> - Monitor Legal: seguimiento en tiempo real de la normativa de pernocta en las 17 comunidades autónomas, con reglas específicas por parque y niveles de confianza
> - Toca cualquier spot en el mapa para ver una vista rápida con puntuación, foto y situación legal
> - Cada spot muestra ahora su municipio y provincia
> - Tarjetas de spots mejoradas con miniaturas de satélite y contexto destacado
> - Mejoras de rendimiento y estabilidad
