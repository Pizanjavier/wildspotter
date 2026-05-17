# Legal Monitoring Pipeline — Full Implementation Plan

## Context

WildSpotter's competitive moat is legal data. No competitor (Park4Night, iOverlander, Caramaps) monitors Spanish legal bulletins to warn vanlifers about parking bans, fire restrictions, or protected area changes. The existing `workers/legal.py` does static spatial checks (Natura 2000, National Parks, Coastal Law, Catastro) against imported MITECO shapefiles. This plan builds the **dynamic monitoring pipeline**: continuous ingestion of legal bulletins from 17 CCAA + 50 provincial BOPs + national BOE/AEMET, AI classification, and real-time user alerts.

Production CX43 is live with users — all development is local-first, deployed carefully after testing.

---

## Parallelization Strategy — What Happens When

```
WEEK 1 ─────────────────────────────────────────────────────────
  [CLAUDE] Phase 1A: DB migration (legal_source_state, legal_documents, municipalities, comarcas)
  [CLAUDE] Phase 1B: Decree JSON schema + legal-data-scout pre-fills 17 CCAA decrees
  [CLAUDE] Phase 1C: LegalDisclaimer component + ConfidenceTierBadge component
  [USER]   Day 1 (~2h): Gmail App Password + 6 gov email signups + AEMET key request
  ──── user done for the week, emails arriving over next 2-3 days ────

WEEK 2 ─────────────────────────────────────────────────────────
  [CLAUDE] Phase 2A: Hash-based change detection engine
  [CLAUDE] Phase 2B: BOE API watcher
  [CLAUDE] Phase 2C: AEMET fire risk watcher
  [CLAUDE] Phase 2D: Polling scheduler + docker-compose legal-watcher service
  [USER]   Day 1 (~15 min): Check inbox, document email formats received
  [USER]   Day 1 (~30 min): Review pre-filled decree JSONs, correct errors

WEEK 3 ─────────────────────────────────────────────────────────
  [CLAUDE] Phase 3A: RSS watchers for 8 Easy CCAA
  [CLAUDE] Phase 3B: n8n IMAP email workflow for 3 Hard CCAA
  [CLAUDE] Phase 3C: Circuit breaker monitoring (health states, ntfy.sh alerts)

WEEK 4 ─────────────────────────────────────────────────────────
  [CLAUDE] Phase 4A: HTML scrapers for 6 Medium CCAA
  [CLAUDE] Phase 4B: Municipality import script + geocoding pipeline
  [USER]   Day 1 (~15 min): Download INE CSV + CNIG shapefile

WEEK 5-6 ───────────────────────────────────────────────────────
  [CLAUDE] Phase 5A: PDF extraction pipeline (4-stage regex funnel + OCR fallback)
  [CLAUDE] Phase 5B: Generic BOP scraper framework + 50 province configs
  [CLAUDE] Phase 5C: Deduplication engine
  [USER]   Day 1 (~20 min): Validate 5 sample BOP configs

WEEK 7 ─────────────────────────────────────────────────────────
  [CLAUDE] Phase 6: LLM classifier (keyword gate + Ollama/Haiku abstraction + confidence routing)

WEEK 8 ─────────────────────────────────────────────────────────
  [CLAUDE] Phase 7A: Bootstrap script
  [USER]   Run bootstrap on Mac overnight (~4h unattended with Ollama)
  [CLAUDE] Phase 7B: Deploy migration + bootstrap data to CX43

WEEK 9-10 ──────────────────────────────────────────────────────
  [CLAUDE] Phase 8: Seasonal alerts + expiration cron + notifications
  [CLAUDE] Phase 9: API endpoints + frontend integration

WEEK 11 ────────────────────────────────────────────────────────
  [USER]   Final validation (~30 min): spot detail, map overlay, alerts
  [CLAUDE] Phase 9 polish + reviewer pass
```

**Total user manual time: ~5-6 hours across 11 weeks, concentrated in Week 1 (2h) and Week 8 (4h overnight).**

---

## Phase 1: Foundation (Week 1)

### 1A. Database Migration [CLAUDE — backend-engineer] ✅ DONE

**New file:** `db/migrations/002_legal_pipeline.sql`

Creates 4 new tables (no existing table modifications — backwards-compatible):
- `legal_source_state` — tracks 67+ monitored sources with hash-based change detection
- `legal_documents` — parsed legal restrictions with geometry, confidence tiers, expiration
- `municipalities` — 8,131 Spanish municipalities with INE codes + PostGIS boundaries (populated Phase 4)
- `comarcas` — multi-municipality regions (populated Phase 4)

Enables `pg_trgm` extension for fuzzy municipality name matching.

Key indexes: GIST on geometries, GIN on `nombre_normalized` for trigram search, B-tree on `content_hash` for dedup, composite on `effective_from/until` for expiration queries.

### 1B. Tourism Decree Data [CLAUDE — legal-data-scout + backend-engineer] ✅ DONE

**New files:**
- `data/legal-decrees/schema.json` — JSON Schema for decree structure
- `data/legal-decrees/ccaa/{ccaa_name}.json` — 17 files, one per CCAA
- `workers/legal_decrees_seed.py` — imports JSONs as `legal_documents` with `confidence_tier = 'verified'`

Schema supports article-level granularity (required for Premium Legal Toolkit):
```json
{
  "ccaa": "andalucia",
  "decree_ref": "Decreto 26/2018",
  "decree_title": "Decreto de Turismo de Andalucia",
  "source_url": "https://www.boe.es/...",
  "bulletin": "BOJA",
  "effective_from": "2018-04-15",
  "articles": [
    {
      "number": "12.3",
      "title": "Estacionamiento vs Acampada",
      "text_verbatim": "Se entiende por estacionamiento...",
      "legal_distinction": "estacionamiento_vs_acampada",
      "max_stay_hours": 48,
      "restrictions": ["no_awning", "no_stabilizers", "no_external_furniture"],
      "exceptions": ["designated_areas"]
    }
  ],
  "confidence_tier": "verified"
}
```

**Agent workflow:** legal-data-scout researches BOE/CCAA bulletin archives online, pre-fills what it can find. User reviews and corrects (~30 min in Week 2).

### 1C. Legal Disclaimer + Confidence Badges [CLAUDE — developer] ✅ DONE

**New files:**
- `src/components/legal/LegalDisclaimer.tsx` — reusable disclaimer component
- `src/components/legal/ConfidenceTierBadge.tsx` — pill badges (Verificado/Automatizado/Sin verificar)

**Modified files:**
- `src/components/legal/LegalChecklist.tsx` — expanded disclaimer text per research doc
- `src/components/legal/index.ts` — export new components
- `src/i18n/locales/es.ts` + `en.ts` — new i18n keys for full disclaimer + tier labels
- `src/services/api/types.ts` — add `LegalDocument`, `ConfidenceTier` types

Disclaimer text (ES): "Informacion orientativa basada en fuentes oficiales publicas. Consulte siempre la normativa oficial vigente antes de pernoctar. WildSpotter no se responsabiliza de posibles inexactitudes o cambios normativos no detectados."

### 1D. Manual Work — User Day 1 [USER ~2 hours total] ✅ DONE

#### Gmail App Password (15 min) — DONE

#### Government Email Subscriptions — DONE
Subscribed to 4 email-only CCAA:
- DOGC (Cataluna) — done
- DOG (Galicia) — done
- DOCM (Castilla-La Mancha) — done
- MiBON (Navarra) — done

DOE (Extremadura) and BOR (La Rioja) email subscriptions **skipped** — not needed because both are already covered by other channels:
- Extremadura: RSS feed (`doe_extremadura` in `rss_configs.py`)
- La Rioja: HTML scraper (`bor_la_rioja_html` in `html_configs.py`)

#### AEMET API Key (5 min) (DONE)
1. Go to `https://opendata.aemet.es/centrodedescargas/altaUsuario`
2. Register with `wildspotterapp@gmail.com`
3. API key arrives by email in 1-2 days -> save to `.env` as `AEMET_API_KEY=xxx`

#### What to paste back
> "App Password saved. Subscribed to: DOGC, DOG, DOCM, BON, DOE, BOR. AEMET key requested."

### 1E. Testing [CLAUDE — tester] ✅ DONE
- Migration runs cleanly — 77 sources GREEN, 18 active documents
- `legal_decrees_seed.py` parses all 17 JSON files — decrees API returns articles
- LegalDisclaimer renders in spot detail screen (E2E browser verified)
- ConfidenceTierBadge renders correctly (compact mode with icon)

---

## Phase 2: National APIs + Change Detection (Week 2)

All [CLAUDE — backend-engineer]

### 2A. Change Detection Engine ✅ DONE
**New file:** `workers/legal_source_monitor.py`

Core logic used by ALL watchers:
1. Fetch URL from `legal_source_state.url`
2. SHA-256 response body -> compare with `content_hash`
3. If match: update `last_checked_at`, done (cost: 1 HTTP request + 1 DB lookup)
4. If different: dispatch to appropriate parser, update hash + `last_changed_at`
5. Track failures: increment `consecutive_failures`, degrade health after 3 (YELLOW) / 7 (RED)

Includes: respectful rate limiting (2-5s delay), honest User-Agent (`WildSpotter-LegalMonitor/1.0`), exponential backoff on 429/403, HTTP caching headers (`If-None-Match`, `If-Modified-Since`).

### 2B. BOE API Watcher ✅ DONE
**New file:** `workers/watchers/boe_watcher.py`

- Polls `https://www.boe.es/datosabiertos/api/boe/sumario/{fecha}` every 6h
- XML parsing (stdlib `xml.etree.ElementTree`)
- Keyword gate on titles before storing
- Stores matches as `legal_documents` with `source_id = 'boe_national'`, `confidence_tier = 'automated'`

### 2C. AEMET Fire Risk Watcher ✅ DONE
**New file:** `workers/watchers/aemet_watcher.py`

- Endpoints: `/api/incendios/mapasriesgo/estimado/area/{area}` (requires AEMET API key)
- Polls every 6h
- Stores fire risk as `legal_documents` with `restriction_type = 'fire_ban'`

### 2D. Polling Scheduler + Docker Service ✅ DONE
**New file:** `workers/legal_scheduler.py`

Long-running process that reads `legal_source_state.poll_interval_hours` and dispatches checks on schedule. Different intervals per source category (BOE 6h, RSS 12h, HTML 24h, email on-receipt).

**Modified:** `docker-compose.yml` — add `legal-watcher` service:
```yaml
legal-watcher:
  build: ./workers
  command: ["python", "legal_scheduler.py"]
  environment:
    DATABASE_URL: ${DATABASE_URL}
    AEMET_API_KEY: ${AEMET_API_KEY:-}
    ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
  depends_on:
    db: { condition: service_healthy }
  deploy:
    resources:
      limits: { memory: 2G, cpus: '2' }
```

### 2E. Worker API Extensions ✅ DONE
**Modified:** `workers/api.py` — add endpoints:
- `GET /legal/sources` — list source states with health
- `GET /legal/documents` — recent legal documents
- `POST /run/legal-poll` — manually trigger poll
- `GET /legal/health` — dashboard with GREEN/YELLOW/RED per source

### 2F. Manual Work — User Week 2 [USER ~45 min] ⏳ PARTIAL

#### n8n Legal Email Workflow — IMPORTED (needs credential setup)
The "Legal Email Monitor" workflow was imported into n8n via CLI. User must:
1. Sign into n8n at `http://localhost:5678`
2. Create IMAP credential (host: imap.gmail.com, port: 993, SSL, user: wildspotterapp@gmail.com, password: Gmail App Password)
3. Open "Legal Email Monitor" workflow → link credential to IMAP Trigger → Save → Activate

#### Document Email Formats (15 min) — PENDING
Check `wildspotterapp@gmail.com` inbox. If no emails from gov sources after weeks, subscriptions may need re-doing.

#### Review Pre-filled Decrees (30 min) — PENDING
All 17 decree JSONs have `NEEDS_REVIEW: true` on articles. The `needs_review` flag now propagates to the DB.

---

## Phase 3: CCAA Bulletin Monitoring (Week 3)

All [CLAUDE — backend-engineer]

### 3A. RSS Watchers for 8 Easy CCAA ✅ DONE
**New files:**
- `workers/watchers/rss_watcher.py` — generic RSS watcher using `feedparser`
- `workers/watchers/rss_configs.py` — source configs for:
  - Aragon (BOA), Baleares (BOIB), Canarias (BOC), Castilla y Leon (BOCyL)
  - Extremadura (DOE), Madrid (BOCM), Valencia (DOGV), + BOE secondary

Each RSS entry -> keyword gate -> store if match.

**Modified:** `workers/requirements.txt` — add `feedparser`, `httpx`

### 3B. n8n IMAP Email Workflow ✅ DONE
**New file:** `n8n-legal-email-workflow.json`

n8n workflow:
1. IMAP trigger -> polls `wildspotterapp+legalwatcher@gmail.com` every 5 min
2. Filter by sender domain (gencat.cat, xunta.gal, jccm.es, navarra.es, juntaex.es, larioja.org)
3. Extract HTML body -> text
4. POST to `http://worker:8001/legal/ingest-email`

**New endpoint:** `POST /legal/ingest-email` in `workers/api.py` — routes by sender, runs keyword gate, stores matches.

**Env vars in `.env`:**
```
LEGAL_IMAP_HOST=imap.gmail.com
LEGAL_IMAP_USER=wildspotterapp+legalwatcher@gmail.com
LEGAL_IMAP_PASSWORD=<from Phase 1D>
```

### 3C. Circuit Breaker Monitoring ✅ DONE
**New file:** `workers/legal_health_monitor.py`

- Tracks `last_email_received_at` per email source
- Degradation states: GREEN -> YELLOW (extraction rate dropped >50%) -> RED (no data for 3+ intervals)
- Email schema fingerprint: hash DOM skeleton, alert if 3 consecutive emails differ from baseline
- Alert via ntfy.sh: `POST https://ntfy.sh/wildspotter-legal` (free, no account)

---

## Phase 4: Medium CCAA + Geocoding (Week 4)

### 4A. HTML Scrapers [CLAUDE — backend-engineer] ✅ DONE
**New files:**
- `workers/watchers/html_scraper.py` — generic async HTML scraper (`httpx`)
- `workers/watchers/html_configs.py` — configs for 6 Medium CCAA:
  - Andalucia (BOJA), Asturias (BOPA), Cantabria (BOC), Navarra (BON), Pais Vasco (BOPV), La Rioja (BOR)
  - Cantabria + Navarra share Liferay CMS -> single adapter covers both

### 4B. Municipality Import + Geocoding [CLAUDE — backend-engineer + geo-researcher] ✅ DONE
**New files:**
- `workers/import_municipalities.py` — imports INE CSV + CNIG shapefile into `municipalities` table
- `workers/legal_geocoder.py` — 3-pass matching:
  1. Exact match: normalized name + province context
  2. Fuzzy: `pg_trgm` similarity > 0.6, same province
  3. LLM disambiguation: only when passes 1+2 fail

### 4C. Manual Work [USER ~15 min] ✅ DONE (downloaded via Chrome automation)

#### Download INE Municipality List (5 min)
1. Go to `https://www.ine.es/daco/daco42/codmun/codmunmain.htm`
2. Download latest "Relacion de municipios y codigos" (Excel or CSV)
3. Save to `data/legal/ine_municipios.xlsx`

#### Download CNIG Municipal Boundaries (10 min)
1. Go to `https://centrodedescargas.cnig.es/CentroDescargas/index.jsp`
2. Search "Lineas limite municipales"
3. Download SHP format for all of Spain
4. Extract ZIP to `data/legal/cnig_municipios/`

Paste back: "INE file at data/legal/ine_municipios.xlsx. CNIG shapefile at data/legal/cnig_municipios/."

---

## Phase 5: BOP Coverage (Week 5-6)

All [CLAUDE — backend-engineer]

### 5A. PDF Extraction Pipeline ✅ DONE
**New files:**
- `workers/pdf_pipeline.py` — 4-stage regex funnel:
  1. TOC extraction (pages 1-2)
  2. Regex split at ANUNCIO/EDICTO/BANDO/ORDENANZA headers
  3. Keyword gate (zero AI cost) — eliminates ~95-98% of content
  4. Output: 1-3 matched sections per day for LLM
- `workers/pdf_ocr.py` — OCR fallback:
  - Detection gate: `len(text) / page_count < 50` chars/page -> scanned PDF
  - Selective OCR: only TOC + keyword-matched pages (never full document)
  - Uses `ocrmypdf` (handles rotation, deskewing, Spanish text)

**Modified:** `workers/requirements.txt` — add `pdfplumber`, `ocrmypdf`

### 5B. BOP Scraper Framework ✅ DONE
**New files:**
- `workers/watchers/bop_scraper.py` — generic framework handling 4 BOP groups:
  - Group A (5 with RSS): Barcelona, Huesca, Zaragoza, Teruel -> uses `rss_watcher.py`
  - Group B (~30 with web search): generic HTML scraper
  - Group C (~10 with daily PDF): uses `pdf_pipeline.py`
  - Group D (~5 with access issues): Playwright fallback
- `workers/watchers/bop_configs.py` — 50 province configurations
- `workers/watchers/bop_playwright.py` — headless browser fallback

### 5C. Deduplication Engine ✅ DONE
**New file:** `workers/legal_dedup.py`
- SHA-256 content hash on insert -> skip if exists
- Fuzzy cross-source: same municipality + overlapping dates + `pg_trgm` similarity > 0.9 -> merge
- Authority ranking: BOE > CCAA > BOP -> upgrade `confidence_tier` when higher source confirms

### 5D. BOP URL Validation [CLAUDE — automated] ✅ DONE
Validated 5 coastal BOP URLs + all Group A RSS feeds. Findings and fixes:
- **Cadiz**: URL was wrong (`bop.dipcadiz.es` → `www.bopcadiz.es`) — FIXED
- **Malaga**: Returns 403 without User-Agent, 200 with UA — OK (watchers set UA)
- **Barcelona**: RSS at `bop.diba.cat/rss` returns 500 — moved from Group A to Group B (HTML)
- **Valencia**: 200 OK
- **Baleares**: 200 OK
- **All Aragon RSS feeds (Huesca, Zaragoza, Teruel)**: `/rss` returns 404 — moved to Group B (HTML)
- **Bizkaia RSS**: 404 + base 403 — moved to Group D (Playwright)
- Group A now has 0 entries (all RSS endpoints broken). Updated header counts.

---

## Phase 6: AI Classification (Week 7)

All [CLAUDE — backend-engineer]

### 6A. Keyword Gate + LLM Classification ✅ DONE
**New files:**
- `workers/legal_classifier.py` — keyword gate (DB-stored, not hardcoded) + LLM dispatch
- `workers/legal_llm.py` — LLM abstraction layer:
  - `backend="ollama"`: calls `localhost:11434` (Qwen 3.6 27B, for local dev)
  - `backend="haiku"`: calls Anthropic API (`claude-haiku-4-5-20251001`, for production)
  - Env var `LEGAL_LLM_BACKEND=ollama` (dev) / `haiku` (prod)

Initial keyword list:
```
autocaravana|pernocta|acampada|estacionamiento|camping|caravana|
aparcamiento.*nocturno|vehiculo.*vivienda|prohibi.*aparcar|
vehiculos de uso habitacional|acampada libre|acampada difusa|
estacionamiento prolongado|incendios forestales
```

### 6B. Confidence Routing ✅ DONE
- Source is BOE/manual decree -> `verified`
- RSS/API + LLM confidence > 0.8 -> `automated`
- Email source or LLM confidence 0.5-0.8 -> `unverified`
- LLM confidence < 0.5 -> `needs_review = true`, hidden from users

### 6C. Keyword Expansion Feedback Loop ✅ DONE
When LLM marks a document relevant but keyword gate would have missed it -> extract matching phrase -> add to keyword table -> log for user review.

### Haiku Budget Note
User has ~EUR 20 in Anthropic credits. Haiku classification costs ~EUR 0.001-0.005 per document. At 5-20 docs/week, that's ~EUR 0.02-0.40/month. The EUR 20 balance covers 2+ years of steady-state usage. No top-up needed.

---

## Phase 7: Bootstrap + Deploy (Week 8)

### 7A. Bootstrap Script [CLAUDE — backend-engineer] ✅ DONE
**New file:** `workers/legal_bootstrap.py`

Orchestrates:
1. Register all 67 sources in `legal_source_state`
2. Fetch current content, compute initial hashes
3. Run keyword filter on all current bulletin entries
4. Classify matches via local Ollama (Qwen 3.6 27B)
5. Export as `data/legal/bootstrap_results.sql`

### 7B. User Runs Bootstrap [USER ~4h, mostly unattended] ✅ DONE. It was faster than expected, review it.
```bash
# Ensure Ollama is running (should already be)
ollama list  # verify qwen3.6:27b is available

# Start local DB
docker-compose up -d db

# Run bootstrap (takes 2-4 hours, logs progress)
cd workers
python legal_bootstrap.py --llm-backend ollama --output ../data/legal/bootstrap_results.sql

# When done, paste back the last 5 lines of output
```

### 7C. Deploy to CX43 [CLAUDE — backend-engineer] ⬜ TODO
**New file:** `scripts/deploy-legal-pipeline.sh`

Deployment sequence (all backwards-compatible):
1. `scp db/migrations/002_legal_pipeline.sql` to CX43
2. Run migration on prod DB
3. `scp data/legal/bootstrap_results.sql` -> apply on prod
4. Update `docker-compose.prod.yml` with `legal-watcher` service
5. `docker-compose -f docker-compose.prod.yml up -d legal-watcher`
6. Verify health: `curl http://localhost:8001/legal/health`

No downtime. No existing table modifications. The `legal-watcher` runs as a separate container.

---

## Phase 8: Seasonal Alerts + Expiration (Week 9)

All [CLAUDE — backend-engineer]

### 8A. Seasonal Monitoring ✅ DONE
- Peak season (April-October): double polling frequency for coastal CCAA + fire-risk provinces
- Fire ban detection: when AEMET reports "Extreme"/"Very High" risk -> create `fire_ban` restriction

### 8B. Expiration Cron ✅ DONE
**New file:** `workers/legal_expiration.py`
- Monthly: `UPDATE legal_documents SET status = 'expired' WHERE effective_until < NOW() AND status = 'active'`
- March annually: flag previous year's seasonal bans as `needs_refresh`
- API always filters: `WHERE status = 'active' AND (effective_until >= NOW() OR effective_until IS NULL)`

### 8C. Notifications ✅ DONE
**New file:** `workers/legal_notifications.py`
- ntfy.sh webhook (free, no account): `POST https://ntfy.sh/wildspotter-legal`
- Triggers on: new fire ban, new parking ban, source health degradation (YELLOW/RED)

---

## Phase 9: API + Frontend (Week 10-11)

### 9A. Legal Documents API [CLAUDE — backend-engineer] ✅ DONE
**New files:**
- `backend/src/routes/legal-documents.ts`
- `backend/src/services/legal-documents.ts`

Endpoints:
- `GET /legal/documents?lat=X&lon=Y&radius=Z` — find restrictions affecting an area
- `GET /legal/documents/:id` — single document
- `GET /legal/sources` — monitored sources + health
- `GET /legal/decrees/:ccaa` — base tourism decree for a CCAA

### 9B. Frontend Integration [CLAUDE — developer] ✅ DONE
**Modified files:**
- `src/services/api/types.ts` — add `LegalDocument` response type
- `src/services/api/spots.ts` — add `getLegalDocuments(lat, lon)` call
- `src/app/spot/[id].tsx` — show dynamic legal documents below existing `LegalChecklist`
- `src/components/legal/LegalChecklist.tsx` — integrate confidence badges + dynamic docs
- `src/components/map/MapView.tsx` — banner when legal overlay active: "Zonas orientativas"

### 9C. Final Validation [CLAUDE — tester] ✅ DONE
1. ✅ Spot detail → disclaimer visible ("Solo informativo"), confidence badges render (compact orange `?` for unverified)
2. ✅ Dynamic legal docs show in "Normativa cercana" section with parsed articles
3. ✅ Legal overlay toggles and renders red zones on map
4. ⚠️ Banner text was missing from `MapView.web.tsx` — FIXED (added Ionicons + i18n banner)
5. ntfy.sh test alert — deferred to prod deployment

### 9D. Parsed Rules UI [CLAUDE — developer] ✅ DONE
1. ✅ `decree_articles` already in `DOCUMENT_COLUMNS`
2. ✅ `DecreeArticle` type updated with nullable `legal_distinction`
3. ✅ New `DecreeArticleCard.tsx` component (197 lines) — renders max stay, restrictions, exceptions, legal distinction
4. ✅ `LegalDocumentsList.tsx` refactored to use `DecreeArticleCard` (258→206 lines)
5. ✅ 8 new i18n keys added (es + en)

---

## Agent Assignments Summary

| Agent | Phases | Responsibility |
|-------|--------|---------------|
| **orchestrator** | All | Coordinates phase execution, delegates to sub-agents |
| **backend-engineer** | 1A, 2-8 | DB migrations, Python workers, Docker, all watcher code |
| **developer** | 1C, 9B | React Native components (disclaimer, badges, spot detail) |
| **legal-data-scout** | 1B | Research 17 CCAA tourism decrees online, pre-fill JSONs |
| **geo-researcher** | 4B | PostGIS patterns for municipality import + geocoding |
| **tester** | 1E, per-phase | Unit tests + E2E browser verification |
| **reviewer** | End of each phase | Code review against spec + conventions |

---

## New Files (33 total)

| File | Phase |
|------|-------|
| `db/migrations/002_legal_pipeline.sql` | 1 |
| `data/legal-decrees/schema.json` | 1 |
| `data/legal-decrees/ccaa/*.json` (17 files) | 1 |
| `workers/legal_decrees_seed.py` | 1 |
| `src/components/legal/LegalDisclaimer.tsx` | 1 |
| `src/components/legal/ConfidenceTierBadge.tsx` | 1 |
| `workers/legal_source_monitor.py` | 2 |
| `workers/watchers/__init__.py` | 2 |
| `workers/watchers/boe_watcher.py` | 2 |
| `workers/watchers/aemet_watcher.py` | 2 |
| `workers/legal_scheduler.py` | 2 |
| `workers/watchers/rss_watcher.py` | 3 |
| `workers/watchers/rss_configs.py` | 3 |
| `workers/legal_health_monitor.py` | 3 |
| `n8n-legal-email-workflow.json` | 3 |
| `workers/watchers/html_scraper.py` | 4 |
| `workers/watchers/html_configs.py` | 4 |
| `workers/import_municipalities.py` | 4 |
| `workers/legal_geocoder.py` | 4 |
| `workers/pdf_pipeline.py` | 5 |
| `workers/pdf_ocr.py` | 5 |
| `workers/watchers/bop_scraper.py` | 5 |
| `workers/watchers/bop_configs.py` | 5 |
| `workers/watchers/bop_playwright.py` | 5 |
| `workers/legal_dedup.py` | 5 |
| `workers/legal_classifier.py` | 6 |
| `workers/legal_llm.py` | 6 |
| `workers/legal_bootstrap.py` | 7 |
| `scripts/deploy-legal-pipeline.sh` | 7 |
| `workers/legal_expiration.py` | 8 |
| `workers/legal_notifications.py` | 8 |
| `backend/src/routes/legal-documents.ts` | 9 |
| `backend/src/services/legal-documents.ts` | 9 |

## Modified Files (12 total)

| File | Phase | Change |
|------|-------|--------|
| `workers/requirements.txt` | 2, 5 | Add feedparser, httpx, pdfplumber, ocrmypdf |
| `docker-compose.yml` | 2 | Add legal-watcher service |
| `workers/api.py` | 2-3 | Add /legal/* endpoints |
| `src/components/legal/LegalChecklist.tsx` | 1, 9 | Expanded disclaimer, dynamic docs |
| `src/components/legal/index.ts` | 1 | Export new components |
| `src/i18n/locales/es.ts` + `en.ts` | 1 | Legal disclaimer + tier i18n keys |
| `src/services/api/types.ts` | 1, 9 | LegalDocument, ConfidenceTier types |
| `src/services/api/spots.ts` | 9 | getLegalDocuments call |
| `src/app/spot/[id].tsx` | 9 | Display dynamic legal data |
| `src/components/map/MapView.tsx` | 9 | Legal overlay banner |
| `backend/src/index.ts` | 9 | Register legal-documents routes |
| `.env` | 1-2 | IMAP, AEMET env vars |

---

## Cost Impact

| Component | Added Monthly Cost |
|-----------|-------------------|
| CX43 (existing) | EUR 0 extra |
| Claude Haiku (steady state, ~10 docs/mo) | EUR 0.02-0.40/mo |
| ntfy.sh alerts | EUR 0 (free tier) |
| **Total added** | **~EUR 0.50/mo** |

User's EUR 20 Anthropic balance covers 2+ years of Haiku classification at projected volume. No top-up needed unless volume spikes unexpectedly.

---

## Verification Strategy

| Phase | How to Verify |
|-------|--------------|
| 1 | Migration on fresh + cloned prod DB. E2E: disclaimer + badges render in browser |
| 2 | Unit test BOE XML parser. Integration: poll BOE, verify legal_source_state updated |
| 3 | Unit test RSS parser. Verify n8n IMAP workflow triggers on test email |
| 4 | Import municipalities, verify `SELECT count(*) FROM municipalities` ~ 8131 |
| 5 | Feed sample BOP PDF through pipeline, verify 4-stage funnel output |
| 6 | Feed sample document through classifier, verify confidence tier assignment |
| 7 | Run bootstrap, verify legal_documents populated. Deploy, verify /legal/health returns GREEN |
| 8 | Create test restriction with past effective_until, verify expiration cron marks it expired |
| 9 | E2E: open spot detail in browser, verify dynamic legal docs + badges render |
