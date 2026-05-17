# Legal Monitoring Pipeline — Technical Reference

## Overview

WildSpotter's legal monitoring pipeline continuously ingests, classifies, and serves Spanish legal restrictions relevant to vanlife/camping. It monitors 89 official bulletin sources across national, regional (CCAA), and provincial (BOP) levels, classifying documents with a keyword gate + LLM hybrid approach.

No competitor (Park4Night, iOverlander, Caramaps) monitors these sources. This is the product's competitive moat.

---

## Architecture

```
                         ┌──────────────────────────────────────────────────────┐
                         │              LEGAL MONITORING PIPELINE              │
                         └──────────────────────────────────────────────────────┘

   SOURCES (89)                INGESTION                 CLASSIFICATION              STORAGE & SERVING
  ─────────────          ──────────────────────        ─────────────────          ─────────────────────

  ┌──────────┐           ┌────────────────────┐       ┌───────────────┐         ┌──────────────────┐
  │ BOE      │──────────▶│  boe_watcher.py    │──┐    │ Keyword Gate  │         │   PostgreSQL +   │
  │ (Nacional)│          └────────────────────┘  │    │ (regex, zero  │         │   PostGIS        │
  └──────────┘                                   │    │  AI cost)     │         │                  │
  ┌──────────┐           ┌────────────────────┐  │    │               │    ┌───▶│ legal_documents  │
  │ AEMET    │──────────▶│  aemet_watcher.py  │──┤    │   Matches?    │    │    │ legal_source_    │
  │ (Incendios)          └────────────────────┘  │    │   ├── YES ────┼───▶│    │   state          │
  └──────────┘                                   │    │   └── NO ─────┼─▶ │    │ municipalities   │
  ┌──────────┐           ┌────────────────────┐  │    │       drop    │  skip   │ priority_munis   │
  │ 8 RSS    │──────────▶│  rss_watcher.py    │──┤    └───────┬───────┘    │    └────────┬─────────┘
  │ CCAA feeds           └────────────────────┘  │            │            │             │
  └──────────┘                                   │    ┌───────▼───────┐    │             │
  ┌──────────┐           ┌────────────────────┐  │    │  LLM Classify │    │    ┌────────▼─────────┐
  │ 8 HTML   │──────────▶│  html_scraper.py   │──┤    │  (Ollama dev/ │    │    │  Fastify API     │
  │ CCAA pages           └────────────────────┘  │    │  Haiku prod)  │    │    │  (TypeScript)    │
  └──────────┘                                   ├───▶│               │────┘    │                  │
  ┌──────────┐           ┌────────────────────┐  │    │ Confidence:   │         │ GET /legal/docs  │
  │ 47 BOPs  │──────┬───▶│  bop_scraper.py    │──┤    │ ├ >0.8 auto   │         │ GET /legal/:id   │
  │(Provinces)│     │    │  (Group B: HTML)   │  │    │ ├ 0.5-0.8 unv │         │ GET /legal/src   │
  └──────────┘     │    └────────────────────┘  │    │ └ <0.5 review │         │ GET /legal/ccaa  │
                   │    ┌────────────────────┐  │    └───────────────┘         └────────┬─────────┘
                   ├───▶│  bop_scraper.py    │──┤                                      │
                   │    │  (Group C: PDF)    │  │                              ┌────────▼─────────┐
                   │    └────────────────────┘  │                              │  React Native    │
                   │    ┌────────────────────┐  │                              │  App (Client)    │
                   └───▶│  bop_playwright.py │──┘                              │                  │
                        │  (Group D: JS)     │                                 │ Spot Detail:     │
                        └────────────────────┘                                 │  decree articles │
                                                                               │  confidence badge│
  ┌──────────┐           ┌────────────────────┐    ┌─────────────────┐         │  disclaimer      │
  │ 6 Email  │──────────▶│  n8n Schedule (5m) │───▶│ poll-email      │         └──────────────────┘
  │ CCAA     │           │  → Worker HTTP POST│    │ (Python imaplib)│
  │ (Gmail)  │           └────────────────────┘    │                 │
  └──────────┘                                     │ IMAP connect    │
                                                   │ → read UNSEEN   │
                                                   │ → keyword gate  │──────────────────┐
                                                   │ → store matches │                  │
                                                   │ → disconnect    │         stores directly in
                                                   └─────────────────┘         legal_documents ▲
```

> **Note:** Email sources use a self-contained poll cycle: the `/legal/poll-email` worker
> endpoint connects to Gmail IMAP, reads UNSEEN emails, runs the same keyword gate regex,
> and stores matches directly into `legal_documents` (as `confidence_tier: 'unverified'`).
> This bypasses the watcher → classifier flow because email content is pre-filtered by
> subscription topic (the Gmail account is subscribed to specific legal bulletin alerts).

---

## Source Coverage

### Hierarchy: Nacional → CCAA → Provincial

```
NATIONAL (2 sources)
├── BOE — Boletín Oficial del Estado (XML API, 6h poll)
└── AEMET — Fire risk API (REST + API key, 6h poll)

CCAA (17 autonomous communities, 20 sources)
├── RSS (8 feeds, 12h poll)
│   ├── BOIB (Baleares)      ├── BOC (Canarias)
│   ├── BOCyL (Castilla y León) ├── DOE (Extremadura)
│   ├── BOCM (Madrid)        ├── BORM (Murcia)
│   ├── BOE secondary        └── DOGA (Galicia, secondary)
├── HTML (8 scrapers, 24h poll)
│   ├── BOJA (Andalucía)     ├── BOPA (Asturias)
│   ├── BOC (Cantabria)      ├── BON (Navarra)
│   ├── BOPV (País Vasco)    ├── BOR (La Rioja)
│   ├── BOA (Aragón)         └── DOGV (Valencia)
└── Email via n8n Schedule → Worker IMAP poll (6 sources, 5m poll)
    ├── DOGC (Cataluña)      ├── DOG (Galicia)
    ├── DOCM (Castilla-La Mancha) ├── MiBON (Navarra)
    ├── DOE (Extremadura)    └── BOR (La Rioja)

PROVINCIAL (47 BOPs)
├── Group B — HTML scrapeable (33 provinces, 24h poll)
├── Group C — Daily PDF (10 provinces, 24h poll)
└── Group D — JS-heavy / Playwright (7 provinces, 48h poll)

BASELINE (1 source)
└── baseline_ccaa — 18 verified tourism decree articles (all 17 CCAAs)
```

### Source Counts by Type

| Type | Count | Poll Interval | Method |
|------|-------|---------------|--------|
| RSS  | 8     | 12h           | `feedparser` |
| HTML | 8     | 24h           | `requests` + BeautifulSoup, `LegacyCipherAdapter` for legacy SSL |
| API  | 2     | 6h            | BOE XML, AEMET REST |
| BOP HTML (B) | 33 | 24h      | Generic HTML scraper |
| BOP PDF (C)  | 10 | 24h      | PDF link discovery + `pdfplumber` extraction |
| BOP JS (D)   | 7  | 48h      | Playwright headless Chromium |
| Email (n8n)  | 6  | 5m         | n8n Schedule → `POST /legal/poll-email` (Python `imaplib`) |
| Baseline     | 1  | Static    | Migration SQL |
| **Total**    | **89** | | |

---

## Database Schema

### Tables (migration `002_legal_pipeline.sql` + `003_legal_baseline.sql`)

```
legal_source_state              legal_documents                  municipalities
──────────────────              ───────────────                  ──────────────
id (PK)                         id (UUID PK)                     id (PK)
name                            source_id → legal_source_state   nombre
source_type (rss/html/api/pdf)  title                           nombre_normalized
region                          restriction_type                 provincia
url                             affected_municipality            ccaa
content_hash (SHA-256)          affected_province                ine_code (UNIQUE)
health (GREEN/YELLOW/RED)       affected_ccaa                    geom (MultiPolygon, 4326)
consecutive_failures            affected_area (Geometry)         ──────────────────────────
poll_interval_hours             confidence_tier                  GIST index on geom
last_checked_at                 effective_from / effective_until  GIN trgm on nombre_norm
last_changed_at                 seasonal (bool)
                                season_start_month / end_month   priority_municipalities
                                decree_ref                       ──────────────────────────
                                decree_articles (JSONB)          nombre, provincia, ccaa
                                source_url                       category, priority (1-3)
                                content_hash                     backfill_status
                                needs_review (bool)              notes
                                status (active/expired/revoked)
                                created_at / updated_at
                                ──────────────────────────────
                                GIST index on affected_area
                                B-tree on content_hash
                                Composite on effective dates
```

### Key Relationships

- `legal_documents.source_id` references `legal_source_state.id`
- `legal_documents.affected_area` + `municipalities.geom` enable spatial lookups
- `priority_municipalities` tracks 63 high-enforcement municipalities for backfill

---

## Pipeline Stages

### 1. Change Detection (`source_monitor.py`)

Every watcher uses the same core loop:

```
Fetch URL → SHA-256(body) → Compare with stored hash
  ├── Same hash → update last_checked_at, done (1 HTTP + 1 DB)
  └── Different hash → dispatch to parser → update hash + last_changed_at

Failure tracking:
  consecutive_failures: 0-2 → GREEN
  consecutive_failures: 3-6 → YELLOW (ntfy alert)
  consecutive_failures: 7+  → RED (ntfy alert, skip until manual check)
```

**Rate limiting:** 2-5s random delay between requests, `WildSpotter-LegalMonitor/1.0` User-Agent, HTTP caching headers (`If-None-Match`, `If-Modified-Since`), exponential backoff on 429/403.

### 2. Keyword Gate (`classifier.py`)

Zero-AI-cost regex filter that eliminates ~95-98% of bulletin content before any LLM call.

**Unified pattern** (shared across all watchers):

```regex
autocaravana|pernocta|acampada|estacionamiento|camping|caravana|
aparcamiento\s*nocturno|veh[ií]culo\s*vivienda|prohibi.*aparcar|
veh[ií]culos?\s*de\s*uso\s*habitacional|acampada\s*libre|
incendios?\s*forestales|medio\s*ambient[e]?|turismo|turisme|
parque\s*natural|parc\s*natural|espacio\s*natural|espai\s*natural|
ordenanza|ordenança|urbanismo|urbanisme|
circulaci[oó]n|tr[aá]fico|tr[àa]nsit
```

Includes Catalan (`turisme`, `ordenança`, `parc natural`, `espai natural`, `trànsit`) and Galician variants.

### 3. LLM Classification (`llm.py`)

Documents passing the keyword gate are classified by an LLM:

```
┌─────────────────┐     ┌───────────────────────────┐
│  Keyword Match   │────▶│  LLM Classification       │
│  (regex, free)   │     │                           │
└─────────────────┘     │  Backend:                  │
                         │  ├── ollama (dev/bootstrap)│
                         │  │   Qwen 3.6 27B local   │
                         │  └── haiku (production)    │
                         │      claude-haiku-4-5      │
                         │                           │
                         │  Output:                   │
                         │  ├── relevant: bool        │
                         │  ├── restriction_type      │
                         │  ├── municipality/province │
                         │  ├── confidence: 0.0-1.0   │
                         │  └── summary               │
                         └───────────────────────────┘

Confidence routing:
  BOE/manual decree      → confidence_tier: 'verified'
  LLM conf > 0.8        → confidence_tier: 'automated'
  LLM conf 0.5-0.8      → confidence_tier: 'unverified'
  LLM conf < 0.5        → needs_review = true (hidden from users)

Authority ranking (dedup):
  BOE (1) > CCAA gazette (2) > BOP (3)
```

### 4. PDF Extraction (`pdf_pipeline.py`, `pdf_ocr.py`)

For BOP Group C sources that publish daily PDFs:

```
PDF download (with SSL retry verify=False fallback)
  │
  ├── Stage 1: TOC extraction (pages 1-2)
  ├── Stage 2: Regex split at ANUNCIO/EDICTO/BANDO/ORDENANZA headers
  ├── Stage 3: Keyword gate (eliminates ~95-98%)
  └── Stage 4: Output 1-3 matched sections → LLM

OCR fallback:
  If len(text) / page_count < 50 → scanned PDF
  Selective OCR: only TOC + keyword-matched pages
  Uses ocrmypdf (rotation, deskewing, Spanish text)
```

### 5. Deduplication (`dedup.py`)

```
Exact:  SHA-256 content_hash match → skip insert
Fuzzy:  same municipality + overlapping dates + pg_trgm > 0.9 → merge
Rank:   BOE confirms BOP → upgrade confidence_tier to 'verified'
```

### 6. Expiration (`expiration.py`)

```
Monthly:    expire documents past effective_until
March:      flag previous year's seasonal bans as needs_refresh
Seasonal:   activate/deactivate restrictions by season_start/end_month
```

### 7. Notifications (`notifications.py`)

```
ntfy.sh (free, no account)
  Topic: wildspotter-legal
  Triggers:
  ├── New fire ban detected
  ├── New parking/overnight ban
  └── Source health degradation (YELLOW/RED)
```

---

## Scheduler (`scheduler.py`)

Long-running Docker service that dispatches checks on schedule:

```yaml
# docker-compose.yml
legal-watcher:
  build: ./workers
  command: ["python", "-m", "legal.scheduler"]
  environment:
    DATABASE_URL: ${DATABASE_URL}
    AEMET_API_KEY: ${AEMET_API_KEY:-}
    ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
  depends_on:
    db: { condition: service_healthy }
```

**Tick interval:** 60 seconds. Each tick queries `legal_source_state` for sources where `NOW() - last_checked_at > poll_interval_hours`. Seasonal boost (April-October) doubles poll frequency for coastal CCAAs and fire-risk provinces.

---

## Baseline Data (`003_legal_baseline.sql`)

### Park PRUG Overnight Rules (18 documents, all `confidence_tier: 'verified'`)

Pre-loaded overnight rules extracted from PRUGs (Planes Rectores de Uso y Gestión) for parks that overlap with existing spots. Each document is linked to the park's polygon via `affected_area` so `LegalSituation` can show park-specific verdicts instead of generic hints. Source: `baseline_parks`.

| Park | Type | Status | Key Rule |
|------|------|--------|----------|
| Picos de Europa | PN | Prohibited | Bivouac only above 1,600m |
| Sierra de Guadarrama | PN | Prohibited | Art. 38 explicitly names vehicles |
| Sierra Nevada | PN | Prohibited | Bivouac above 1,600m with notification |
| Ordesa y Monte Perdido | PN | Prohibited | Sector-dependent (Ordesa fully banned since 2022) |
| Monfragüe | PN | Prohibited | No exceptions |
| Islas Atlánticas | PN | Prohibited | No vehicle access (island park) |
| Tablas de Daimiel | PN | Restricted | 6 motorhome spaces with permit |
| Doñana | PN | Prohibited | No exceptions |
| Sierra de las Nieves | PN | Restricted | PRUG in formulation (2025) |
| Aigüestortes | PN | Prohibited | No vehicle access to park interior |
| Cabañeros | PN | Prohibited | Informal tolerance at Las Becerras |
| Archipiélago de Cabrera | PN | Prohibited | No vehicle access (island) |
| Cazorla, Segura y Las Villas | PNat | Prohibited | Practical tolerance on remote tracks |
| Bardenas Reales | PNat | Prohibited | Art. 29 explicitly names autocaravanas |
| Serra de Tramuntana | PNat | Prohibited | Exception: Lluc monastery |
| Garrotxa | PNat | Restricted | 2 designated overnight areas |
| Cap de Creus | PNat | Prohibited (summer) | Camera enforcement, €200 fine |
| Sierra de Grazalema | PNat | Prohibited | Bivouac only with formal 15-day authorization |

### CCAA Tourism Decrees (18 documents, all `confidence_tier: 'verified'`)

Pre-loaded rules for every CCAA, stored with `decree_articles` in frontend-compatible `DecreeArticle[]` format:

```json
[{
  "number": "Art. 70-72",
  "title": "Pernocta tolerada (48h)",
  "text_verbatim": "Prohíbe la acampada libre. Distingue pernocta en autocaravana...",
  "legal_distinction": "estacionamiento_vs_acampada",
  "max_stay_hours": 48,
  "restrictions": ["sin_elementos_externos", "estacionamiento_permitido"],
  "exceptions": []
}]
```

**Pernocta rules by CCAA:**

| CCAA | Status | Max Stay | Decree |
|------|--------|----------|--------|
| Baleares | Prohibited | 0h | Ley 8/2012 |
| Cataluña | Tolerated | 24h | Decret 159/2012 |
| Aragón | Tolerated | 48h | Decreto 35/2023 |
| Galicia | Tolerated | 48h | Decreto 144/2013 |
| Navarra | Tolerated | 48h | DF 230/2011 |
| Asturias | Tolerated | 72h | Decreto 61/2022 |
| Extremadura | Permitted (conditions) | 72h | Decreto 120/2015 |
| Andalucía | Ambiguous | — | Decreto 26/2018 |
| Canarias | Prohibited (enforcement varies) | 0h | Ley 7/1995 |
| Madrid | No specific decree | — | — |
| Castilla y León | Tolerated | 48h | Decreto 25/2001 |
| Castilla-La Mancha | Ambiguous | — | Ley 8/1999 |
| Murcia | Tolerated (strict in coast) | 48h | Decreto 37/2019 |
| Valencia | Ambiguous | — | Ley 3/1998 |
| País Vasco | No specific decree | — | — |
| La Rioja | Tolerated | 48h | — |
| Cantabria | Ambiguous | — | Ley 5/1999 |

### Priority Municipalities (63 rows)

High-enforcement or vanlife-popular municipalities tracked for BOP backfill:

| Category | Count | Examples |
|----------|-------|---------|
| `coastal_hotspot` | 28 | Tarifa, Bolonia, Cabo de Gata, Zahara de los Atunes |
| `park_gateway` | 8 | Torla-Ordesa, Ronda, Aracena |
| `island` | 15 | La Oliva, Teguise, Valle Gran Rey, Alcúdia |
| `mountain` | 7 | Benasque, Aínsa, Isaba, Ochagavía |
| `inland_hotspot` | 5 | Laguardia, Mérida |

---

## API Endpoints

### Fastify (TypeScript) — serves the mobile app

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/legal/documents?lat=X&lon=Y&radius=Z` | GET | Documents affecting a location (max 20, filtered, prioritized) |
| `/legal/documents/:id` | GET | Single document with `decree_articles` |
| `/legal/sources` | GET | All monitored sources with health status |
| `/legal/decrees/:ccaa` | GET | Tourism decrees for a CCAA |
| `/legal/tiles/:z/:x/:y.pbf` | GET | Pre-generated MVT tiles (z4-z10) |

**Location query logic** (`findLegalDocumentsByLocation`):

```sql
WHERE status = 'active'
  AND needs_review = FALSE
  AND LENGTH(title) > 40          -- filter BOP section headers
  AND restriction_type != 'other'  -- filter generic matches
  AND (
    -- 1. Has geometry → ST_DWithin(radius)
    -- 2. No geometry, has CCAA → match via municipalities.geom
    -- 3. National (no geo) → always included
  )
ORDER BY
  confidence_tier (verified → automated → unverified),
  restriction_type (camping_ban → overnight_ban → parking_ban → fire_ban → ...)
LIMIT 20
```

### Worker API (Python Flask) — internal / monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/legal/sources` | GET | Source states with health |
| `/legal/documents` | GET | Recent legal documents |
| `/legal/health` | GET | Health dashboard (GREEN/YELLOW/RED) |
| `/legal/ingest-email` | POST | Email ingestion (direct, legacy) |
| `/legal/poll-email` | POST | IMAP poll: connect, read UNSEEN, filter, ingest, disconnect |
| `/run/legal-poll` | POST | Manually trigger poll cycle |

---

## Frontend — Unified Legal Situation

### Overnight Verdict System

Both legal subsystems (static per-spot checks + dynamic gazette monitoring) are merged into a single UX component. The spot detail page shows one collapsed card with an overnight verdict framed in vanlife language ("Can I sleep here?"), not legal jargon.

**Verdict priority hierarchy** (first match wins):
1. Fire ban active → `prohibited`
2. Private land (cadastre) → `prohibited`
3. Inside National Park → `restricted` (park regs override CCAA decree tolerance)
4. Inside Coastal Law zone → `restricted`
5. Camping ban document nearby → `restricted`
6. Inside Natura 2000 → `restricted`
7. CCAA decree allows max stay → `tolerated`
8. None of the above → `allowed`

**Map & list coloring** (3-level system via `getOvernightLevel()` in `src/utils/legal-verdict.ts`):
- White stroke / no border = allowed
- Amber stroke (`#FBBF24`) / amber border = restricted (Natura 2000, Parks, Coastal)
- Red stroke (`#EF4444`) / red border = prohibited (private land)

### Components

```
src/components/legal/
├── index.ts                  # Barrel exports
├── LegalSituation.tsx        # Unified legal component (replaces LegalChecklist + LegalDocumentsList)
├── LegalChecklist.tsx        # (legacy, still exported but not rendered in spot detail)
├── LegalDocumentsList.tsx    # (legacy, still exported but not rendered in spot detail)
├── DecreeArticleCard.tsx     # Decree article renderer (used inside LegalSituation)
├── ConfidenceTierBadge.tsx   # Pill badge (used inside LegalSituation)
└── LegalDisclaimer.tsx       # Legal disclaimer ("Solo informativo...")

src/utils/legal-verdict.ts    # Shared overnight level utility for map/list (no documents context)
```

**Spot detail screen** (`src/app/spot/[id].tsx`) shows:
1. `LegalSituation` — single collapsed card with overnight verdict and restriction count pill
2. Tapping expands: unified list of static checks + dynamic documents, sorted by severity
3. Inner documents expandable with `DecreeArticleCard` showing parsed rules
4. `ConfidenceTierBadge` on each document
5. `LegalDisclaimer` at bottom

---

## Document Examples

### Verified Baseline Decree

```json
{
  "id": "uuid-...",
  "source_id": "baseline_ccaa",
  "title": "Aragón: acampada libre prohibida; pernocta en autocaravana tolerada 48h",
  "restriction_type": "camping_ban",
  "affected_ccaa": "aragon",
  "confidence_tier": "verified",
  "status": "active",
  "decree_ref": "Decreto 35/2023, de 5 de abril",
  "decree_articles": [{
    "number": "Art. 2",
    "title": "Pernocta tolerada (48h)",
    "text_verbatim": "Prohíbe la acampada libre. Distingue pernocta en autocaravana (tolerada hasta 48h)...",
    "legal_distinction": "estacionamiento_vs_acampada",
    "max_stay_hours": 48,
    "restrictions": ["sin_elementos_externos", "estacionamiento_permitido"],
    "exceptions": []
  }]
}
```

### Automated BOP Detection

```json
{
  "id": "uuid-...",
  "source_id": "bop_cadiz",
  "title": "Ordenanza reguladora del estacionamiento de autocaravanas en el término municipal de Tarifa",
  "restriction_type": "parking_ban",
  "affected_municipality": "Tarifa",
  "affected_province": "Cádiz",
  "affected_ccaa": "andalucia",
  "confidence_tier": "automated",
  "status": "active",
  "decree_articles": null,
  "source_url": "https://www.bopcadiz.es/..."
}
```

### Fire Ban (AEMET)

```json
{
  "id": "uuid-...",
  "source_id": "aemet_fire_risk",
  "title": "Riesgo extremo de incendio forestal — Huelva, Sevilla",
  "restriction_type": "fire_ban",
  "affected_province": "Huelva",
  "confidence_tier": "automated",
  "effective_from": "2026-07-15",
  "effective_until": "2026-07-20",
  "seasonal": true
}
```

---

## Technical Challenges & Solutions

### Legacy Government SSL

Many provincial BOP servers use outdated TLS. Solved with `LegacyCipherAdapter`:

```python
class LegacyCipherAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.set_ciphers("DEFAULT:@SECLEVEL=0")
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.minimum_version = ssl.TLSVersion.TLSv1
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)
```

### Block-Level HTML Extraction

Government HTML often has content in `<div>` blocks without semantic structure. The `_TextExtractor` inserts newlines at block element boundaries (`<div>`, `<p>`, `<li>`, `<tr>`, `<h1>`-`<h6>`, etc.) to produce searchable text lines.

### Playwright for JS-Heavy Sites

7 BOP sites (Group D) require JavaScript rendering. Uses `domcontentloaded` + 3s wait instead of `networkidle` (which hangs on persistent connections).

### Multilingual Keywords

Spanish bulletins in Cataluña, Baleares, Valencia, and Galicia publish in regional languages. The keyword pattern includes Catalan (`turisme`, `ordenança`, `parc natural`, `trànsit`) and Galician variants.

---

## File Inventory

### Workers — Legal Pipeline (`workers/legal/`)

| File | Purpose |
|------|---------|
| `scheduler.py` | Long-running polling scheduler (Docker service) |
| `source_monitor.py` | Hash-based change detection engine |
| `classifier.py` | Keyword gate + LLM dispatch |
| `llm.py` | Ollama/Haiku LLM abstraction |
| `bootstrap.py` | Initial data load orchestrator |
| `dedup.py` | Cross-source deduplication |
| `expiration.py` | Document expiration + seasonal management |
| `notifications.py` | ntfy.sh push alerts |
| `health_monitor.py` | Source health tracking + degradation alerts |
| `geocoder.py` | 3-pass municipality matching (exact → fuzzy → LLM) |
| `import_municipalities.py` | INE CSV + CNIG shapefile import |
| `decrees_seed.py` | Tourism decree JSON → DB import |
| `pdf_pipeline.py` | 4-stage PDF regex funnel |
| `pdf_ocr.py` | OCR fallback for scanned PDFs |

### Workers — Watchers (`workers/watchers/`)

| File | Purpose |
|------|---------|
| `boe_watcher.py` | BOE national gazette XML API |
| `aemet_watcher.py` | AEMET fire risk REST API |
| `rss_watcher.py` | Generic RSS watcher (`feedparser`) |
| `rss_configs.py` | 8 CCAA RSS feed configurations |
| `html_scraper.py` | Generic HTML scraper with SSL adapter |
| `html_configs.py` | 8 CCAA HTML scraper configurations |
| `bop_scraper.py` | BOP orchestrator (Groups B/C/D) |
| `bop_configs.py` | 47 provincial BOP configurations |
| `bop_playwright.py` | Playwright headless fallback (Group D) |

### Backend API (`backend/src/`)

| File | Purpose |
|------|---------|
| `routes/legal-documents.ts` | Fastify route handlers (4 endpoints) |
| `services/legal-documents.ts` | PostGIS queries (location, ID, sources, decrees) |
| `routes/legal-tiles.ts` | MVT tile serving |
| `services/legal-tiles.ts` | Tile file lookup |

### Frontend (`src/components/legal/` + `src/utils/`)

| File | Purpose |
|------|---------|
| `LegalSituation.tsx` | Unified legal component: overnight verdict + collapsed detail |
| `LegalChecklist.tsx` | Legacy static checks (exported, not rendered in spot detail) |
| `LegalDocumentsList.tsx` | Legacy document list (exported, not rendered in spot detail) |
| `DecreeArticleCard.tsx` | Decree article card renderer (used inside LegalSituation) |
| `ConfidenceTierBadge.tsx` | Confidence tier pill badge (used inside LegalSituation) |
| `LegalDisclaimer.tsx` | Legal disclaimer component |
| `index.ts` | Barrel exports |
| `src/utils/legal-verdict.ts` | Shared `getOvernightLevel()` for map dots + spot cards |

### Database (`db/migrations/`)

| File | Purpose |
|------|---------|
| `002_legal_pipeline.sql` | Tables: `legal_source_state`, `legal_documents`, `municipalities`, `comarcas` |
| `003_legal_baseline.sql` | Baseline: 18 CCAA decrees, 63 priority municipalities, `decree_articles` transform |
| `004_park_rules_baseline.sql` | Park PRUG overnight rules: 18 parks with geometry-linked `affected_area` |

### n8n Workflows (`n8n/`)

| File | Purpose |
|------|---------|
| `legal-email-workflow.json` | Schedule (5m) → `POST /legal/poll-email` for 6 email-subscribed CCAAs |
| `legal-health-workflow.json` | Schedule (6h) → health check → ntfy.sh alert if unhealthy |

---

## Operations

### Start the pipeline

```bash
docker-compose up -d --build    # Starts legal-watcher service alongside API/DB
docker-compose logs -f legal-watcher   # Follow scheduler logs
```

### Manual poll trigger

```bash
curl -X POST http://localhost:8001/run/legal-poll
```

### Check health

```bash
curl http://localhost:8001/legal/health
# Returns per-source GREEN/YELLOW/RED status
```

### Run bootstrap (first time)

```bash
docker-compose exec worker python -m legal.bootstrap --llm-backend ollama
```

### Run expiration check

```bash
docker-compose exec worker python -m legal.expiration
```

### Regenerate legal tiles

```bash
docker-compose exec worker python generate_legal_tiles.py
```

### Current stats (as of 2026-05-15)

- **88** monitored sources (all GREEN) — includes `baseline_parks`
- **143** active legal documents (125 original + 18 park PRUG rules)
- **8,132** municipalities with PostGIS boundaries
- **63** priority municipalities for enforcement tracking
- **~74 MB** pre-generated MVT tiles (z4-z10)

---

## Cost

| Component | Monthly Cost |
|-----------|-------------|
| Infrastructure (existing CX43) | EUR 0 extra |
| Claude Haiku classification (~10 docs/mo) | EUR 0.02-0.40 |
| ntfy.sh alerts | EUR 0 (free tier) |
| **Total** | **~EUR 0.50/mo** |
