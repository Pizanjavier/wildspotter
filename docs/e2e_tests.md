# WildSpotter — End-to-End Test Plan

> **Scope:** Pre-launch full-app verification using Chrome browser automation against Expo Web (`http://localhost:8081`) with backend stack running (`docker-compose up -d`). Covers functionality, visual/design, performance, marketing copy, common sense, i18n, native features, security, and the marketing-path Remotion project.
>
> **Tooling:** `mcp__claude-in-chrome__*` tools for navigation, screenshots, GIF capture, console reads, network reads, JS evaluation. Use `gif_creator` for any multi-step flow worth sharing.
>
> **Pre-flight:**
> 1. `docker-compose up -d --build` → wait for `/health` = `ok`
> 2. `npx expo start --web` → confirm bundler ready
> 3. `tabs_context_mcp` → create fresh tab at `http://localhost:8081`
> 4. Clear localStorage/AsyncStorage between test suites where noted
> 5. Set viewport to 390×844 (iPhone 14) for primary pass; repeat critical screens at 1280×800 for desktop check

---

## 0. Test Conventions

| Severity | Meaning |
|---|---|
| **P0** | Launch blocker — must pass |
| **P1** | High — fix before marketing push |
| **P2** | Polish — fix in next sprint |

For each test record: ✅/❌, screenshot path, console errors, network failures, notes.

Use `read_console_messages` after every screen visit; any `error` or red log = automatic ❌ on the row.

---

## 1. Bootstrap & Onboarding

### 1.1 Cold start (no AsyncStorage)
- **Steps:** `javascript_tool` → `localStorage.clear()`, reload, `read_page`
- **Expect:** Splash → onboarding page 1 (P0)
- **Check:** Logo renders, fonts loaded (Inter + JetBrains Mono present in computed styles), no FOUC, no console errors
- **Screenshot:** `01_onboarding_p1.png`

### 1.2 Onboarding pagination
- Swipe/tap through pages 1→2→3, capture GIF `onboarding_flow.gif`
- Dot indicators reflect current page
- "Skip" on p1 jumps to map; "Let's Go" on p3 jumps to map and persists `wildspotter_onboarding_complete`
- **Edge:** Reload after skip → must NOT show onboarding again
- **i18n:** Repeat in Spanish (set `navigator.language` override before reload)

### 1.3 Language auto-detect (native feature)
- Override `navigator.language` to `es-ES`, clear storage, reload
- **Expect:** Onboarding renders in Spanish, settings store `language = 'es'`
- Repeat with `fr-FR` → falls back to English (P1)

### 1.4 Splash performance
- `read_network_requests` → confirm splash hides in <2s after bundle parse
- No layout shift on transition (visual diff before/after)

---

## 2. Map Screen (Primary Surface)

### 2.1 First render
- Map loads centered on Spain `[-3.7, 40.4]`, zoom ~6
- MapLibre tiles fetch successfully (network 200s on tile URLs)
- No WebGL errors in console
- SearchBar, FilterChips, MyLocationButton, ScanButton all visible & tappable
- **Visual:** Dark warm earthy palette (`#1A1614`), amber accent on chips. No bright white surfaces.

### 2.2 Pan & zoom
- Programmatic pan via map gesture; `bounds` in store updates
- Zoom out below 9 → ZoomWarning banner appears + ScanButton disabled state with "Zoom in to scan" label (P0)
- Zoom in above 9 → warning hides, ScanButton enables

### 2.3 Search bar
- Type "Cabo de Gata" → debounced suggestions appear
- Select first result → map flies to coordinates, suggestion list closes
- **Edge:** Empty query, 1-char query, 200-char garbage, emoji input, SQL/script injection (`<script>alert(1)</script>`, `'; DROP TABLE--`) → no XSS, no crash, sanitized display (Security P0)
- **Edge:** Network offline mid-search → graceful error, no unhandled rejection

### 2.4 Scan happy path
- Pan to known good area (e.g., Almería coast `[-2.0, 36.8]`), zoom 11, tap Scan
- `area_scanned` analytics event fires (verify with PostHog network call or console)
- ScanningOverlay shows, ScanButton pulses, "SCANNING..." label
- Results populate BottomSheet within 5s; header reads "X SPOTS FOUND"
- Markers render on map color-coded by score
- **GIF:** `scan_happy_path.gif`

### 2.5 Scan edge cases
- **Empty area** (middle of Mediterranean): "No spots found" empty state + NoResultsToast auto-dismisses ~4s
- **Cached area**: re-scan same bounds → "CACHED" badge, instant return, no network call (verify via `read_network_requests`)
- **Backend down**: stop API container, scan → ErrorState with TRY AGAIN button, no crash
- **Slow network**: throttle to 3G via DevTools, scan → loading overlay persists, no double-fire
- **Huge bbox** (Spain-wide at zoom 6): blocked by zoom guard
- **500+ spots** result: list virtualizes, scroll stays 60fps

### 2.6 Bottom sheet
- Drag handle → expands/collapses smoothly, no jank
- Tap card → navigates to `/spot/:id`
- Sheet height calculation accounts for ScanButton FAB above it (no overlap, P1)
- **Visual:** rounded top corners, drag indicator visible, content respects safe area

### 2.7 My location (native feature)
- Tap MyLocationButton → permission prompt
- **Granted:** flies to position, blue dot appears, button becomes "active" state
- **Denied:** error message, no crash, button remains usable for retry
- **No GPS available:** timeout handled gracefully
- **Security:** verify permission prompt origin matches app, geolocation never logged to analytics with raw coords (privacy P0)

### 2.8 Legal zones overlay
- Toggle in Config "Show legal zones" → MVT tiles render as red translucent polygons
- Tiles cached locally on second visit (verify network)
- Toggle off → polygons disappear immediately (no scan re-run, visual-only change)

---

## 3. Spots Screen

### 3.1 Empty state
- Fresh install (clear `wildspotter:saved-spots`) → empty illustration + CTA "Go to Map"
- Tapping CTA navigates to map tab

### 3.2 Saved spots list
- Save 3 spots with varied scores (95, 72, 48), navigate to Spots tab
- List sorted by score DESC; badges show correct color tier (green / cyan-teal / amber)
- Count header reads "3 spots" (or pluralization rule for 1 spot)
- Tap card → spot detail; back button returns to list with scroll position preserved (P1)

### 3.3 Persistence
- Reload app → saved spots survive (AsyncStorage hydrated)
- Clear cache from Config → saved spots NOT cleared (separate keys, verify)

---

## 4. Spot Detail Screen

### 4.1 Load
- Navigate from list, observe loading spinner → full content
- All sections render: header image, title, metrics row, legal checklist, AI analysis, context analysis, score breakdown, action buttons, report link
- Satellite image loads from `/satellite/:filename` (200, cached header present)
- **Edge:** Spot with `satellite_image_path = null` → graceful placeholder
- **Edge:** Invalid `id` in URL → "Spot not found" with back button (P0)

### 4.2 Bookmark toggle
- Tap bookmark → spot added to store, icon flips filled
- Re-tap → removed, icon flips outline
- Cross-check Spots tab reflects change immediately (no reload needed)

### 4.3 Metrics & analyses
- Surface, slope %, elevation values match API response
- Legal checklist: 4 rows (Natura 2000, Parques, Costas, Catastre) with pass/fail/pending icons in correct colors
- AI Analysis: 5 factors with weights summing to 100%, bars proportional
- Context: 9 factors render only when API returns data; no broken UI when missing
- Score breakdown formula visually adds up to composite (T·0.20 + A·0.25 + C·0.55)
- **Common sense:** if `composite_score = 87` shown big, sub-scores must mathematically support it

### 4.4 Action buttons
- **Inspect** → opens Google Maps satellite (`maps.google.com/?layer=s&...`) in new tab
- **Navigate** → opens directions intent
- **Security:** verify URL is constructed with encoded coords, no open redirect via spot data fields (P0)

### 4.5 Report modal
- Tap report → modal slides up from bottom
- Submit blocked until category selected
- Comment max 2000 chars enforced (try paste 5000 chars → truncated or rejected gracefully)
- Submit success → checkmark, auto-close 1.5s, network POST 200
- **Edge:** Submit with backend down → error state, modal stays open
- **Security:** comment field XSS payload (`<img src=x onerror=...>`) sanitized server-side AND client-side render escaped (P0)
- **Security:** rate limit — submit 20 reports rapid-fire, verify backend throttles (P1)

---

## 5. Guide Screen

### 5.1 Sections
- All 6 collapsible sections render with title + icon
- Tap each → expands smoothly with animated height
- Content text reads professionally, no Lorem ipsum, no truncated sentences
- All factors mentioned match SPEC_V2.md (9 context factors, 5 AI factors)
- **i18n:** repeat in Spanish, verify no untranslated keys (no raw `guide.satellite.title` strings)

### 5.2 Marketing copy quality
- Tone: educational + adventurous (matches CLAUDE.md content guidelines)
- No competitor names (Park4night, iOverlander) — only "other apps"
- No false promises ("legal/safe") — uses "data, not guarantees"
- No typos (run automated spell check via JS eval against text content)

---

## 6. Config Screen

### 6.1 Preferences
- Slope slider 0–30%, default 8 → drag → store updates → `filtersVersion` increments → returning to map auto-rescans current bounds
- Min score slider 0–100 → same flow
- Hide restricted toggle → triggers rescan
- Show legal zones toggle → no rescan, only overlay visibility
- Offline mode toggle → next scan returns from cache only, no network

### 6.2 Language switcher
- Open modal, select Español → entire app re-renders in Spanish immediately
- All tab labels, buttons, headers translated
- Reload → language persists
- Repeat back to English

### 6.3 Theme toggle
- Light/Dark pill toggle → instant theme change across all screens
- Verify both themes against design tokens (`theme.ts`): no hardcoded colors leaking through (P1)
- Visit every screen in both themes, capture screenshots for diff
- **Visual:** No white-on-white or black-on-black text, all contrast ratios ≥ AA

### 6.4 Cache section
- Shows cache size in MB and area count (verify accuracy after 3 known scans)
- "Clear Cache" → confirmation modal → confirm → cache cleared, count resets to 0, scans table empty
- **Edge:** Clear with empty cache → no crash

### 6.5 About section
- Version matches `app.json`
- Tagline + description present, no placeholder text
- Data sources link opens external URL safely (`rel="noopener"`, `target="_blank"`)
- **Security:** external links use `noopener noreferrer` (P1)

---

## 7. Internationalization (Cross-cutting)

### 7.1 Coverage audit
- JS eval: walk DOM textContent, flag any string matching `/^[a-z]+\.[a-z]+/i` (raw key leak) — must be 0
- Switch to Spanish, repeat — must be 0
- Verify pluralization: 0/1/2/100 spots all read naturally in both languages

### 7.2 Layout integrity
- Spanish text often 20-30% longer → check no truncation, no overflow on:
  - Scan button label
  - Tab bar labels
  - Filter chips
  - Score badges ("X% Match")
  - Onboarding CTAs
- Capture comparative screenshots EN vs ES for each screen

### 7.3 Date/number formatting
- Slope: `8%` not `8.0000%`; coordinates: `40.25N, -3.44W` rendered consistently
- Spanish uses comma decimal separator where applicable

---

## 8. Visual & Design Consistency

### 8.1 Design token audit
For every screen, JS eval `getComputedStyle` on key elements and assert:
- Backgrounds use `BACKGROUND` / `CARD` / `CARD_ELEVATED` from active theme
- Accent buttons use `ACCENT` (`#D97706` light / `#D97706` dark)
- Score colors map exactly to `SCORE_HIGH/MEDIUM/LOW`
- Fonts: Inter for body, JetBrains Mono for numeric data (slope, elevation, score, coords)

### 8.2 Spacing & alignment
- Screen horizontal padding consistent (16px)
- Cards have 12px gaps
- No double-borders, no orphaned dividers
- Tab bar pill alignment centered, doesn't shift between tabs

### 8.3 Iconography
- All icons from one set (Ionicons/Lucide), consistent stroke width
- No emoji used as functional icons (per CLAUDE.md)

### 8.4 Animation polish
- Bottom sheet drag: 60fps, no jank
- Tab transitions: smooth, no flash
- ScanButton pulse: continuous loop while scanning, stops cleanly on complete
- ScanningOverlay fade in/out
- Spring animations on score badges feel natural (not overshoot ugly)

### 8.5 Empty/error/loading states
- Every async surface has a defined state for: loading, empty, error, success
- States designed (not default spinner on grey) — match brand

---

## 9. Performance

### 9.1 Render budget
- Use Chrome Performance panel via `javascript_tool` to record:
  - Map idle: 0 unnecessary re-renders (verify with React DevTools Profiler if available)
  - Scrolling Spots list of 500: maintain 55+ fps
  - Spot detail mount: <300ms after API response
- No memory leaks on tab switching 50× (heap snapshot delta < 5MB)

### 9.2 Network efficiency
- `read_network_requests` after a typical session
- No duplicate API calls (e.g., scan firing twice on filter change)
- No oversized payloads (spot summary <3KB each)
- Satellite images served with `Cache-Control` and only loaded when detail viewed
- MVT tiles loaded on-demand by viewport

### 9.3 Bundle
- Initial JS bundle <3MB gzipped
- Lazy splits for MapLibre, spot detail
- No source maps leaked in production build (Security P1)

### 9.4 Offline mode
- Toggle offline, kill network, navigate full app — no white screens, no infinite spinners, all cached data accessible

---

## 10. Native Features

### 10.1 Geolocation
- Permission prompt, granted/denied/blocked all handled (see 2.7)
- Location used only when user requests (no background polling, P0 privacy)

### 10.2 AsyncStorage
- Saved spots persist across reload
- Settings persist
- Cache TTL respected (7 days) — fast-forward time via JS eval to verify expiration
- **Edge:** Storage full / quota exceeded → graceful error

### 10.3 Deep links
- `wildspotter://spot/:id` and web URL `/spot/:id` both navigate correctly
- Invalid id → "not found" screen
- **Security:** deep link params validated, no JS injection via URL (P0)

### 10.4 External app intents
- Google Maps inspect/navigate links work on web (open new tab)
- On native, would launch Maps app — note for device QA

### 10.5 Language detection
- See 1.3

---

## 11. Backend API Contract Verification

For each endpoint, send requests via `javascript_tool` (`fetch`) and verify:

### 11.1 `GET /health`
- 200, body `{status:'ok'}`, fast (<100ms)

### 11.2 `GET /spots?min_lat=...`
- Valid bbox → 200 array
- Missing params → 400 with descriptive error
- Inverted bbox (min > max) → 400, not 500
- Filter combinations: `min_score`, `max_slope`, `hide_restricted` all functional
- Result schema matches `SpotSummary` type exactly
- **Security:** SQL injection in numeric params (`min_lat=0; DROP TABLE`) → rejected by validation (P0)
- **Security:** CORS configured to allow only known origins (P1)

### 11.3 `GET /spots/:id`
- Valid UUID → 200 SpotDetail
- Invalid UUID format → 400
- Non-existent UUID → 404
- **Security:** path traversal (`/spots/../admin`) → 404, not file leak (P0)

### 11.4 `POST /reports`
- Valid body → 201 with id
- Missing category → 400
- Oversized comment → 413 or trimmed
- **Security:** Body schema validated; HTML/script in comment stored escaped (P0)
- **Security:** Anonymous abuse — verify rate limiting (per IP, per spot) (P1)

### 11.5 `GET /satellite/:filename`
- Valid filename → image, correct MIME, cache header
- Invalid pattern (`../etc/passwd`, `foo.exe`, `bar.php`) → 400 (regex enforced) (P0)
- Non-existent file → 404

### 11.6 `GET /legal/tiles/:z/:x/:y.pbf`
- Valid coords → MVT binary, gzip
- Out-of-range (`z=99`) → 404
- **Security:** path params validated as integers (P0)

---

## 12. Security (Cross-cutting)

### 12.1 Input handling
- All user inputs (search, comment) sanitized on render (React escapes by default — verify no `dangerouslySetInnerHTML` slipped in)
- Grep codebase for `dangerouslySetInnerHTML` and `eval(` — must be 0

### 12.2 Storage
- AsyncStorage contains no secrets, no auth tokens, no PII
- No API keys hardcoded in client bundle (`Sentry DSN` and `PostHog key` are public-safe)
- Inspect bundle for accidental leaks (`grep -E "(secret|password|private_key)" dist/`)

### 12.3 Network
- All API calls over HTTP locally; production must enforce HTTPS
- No mixed content warnings
- CORS headers allow only intended origins

### 12.4 Privacy
- Location data never sent to third-party analytics with raw coords (round to ≥2 decimals if logged)
- PostHog/Sentry initialized only when user has not opted out
- Privacy policy link present in About; matches `docs/privacy-policy.md`
- Report submissions are anonymous (no device fingerprinting beyond what backend logs minimally)

### 12.5 Dependency hygiene
- `npm audit` — no high/critical
- Backend `npm audit` — no high/critical
- Python workers `pip-audit` — no high/critical

### 12.6 Auth
- Currently no auth — verify no protected routes accidentally exposed without auth check that should require one
- Admin endpoints (if any) blocked from public

### 12.7 CSP / headers
- Backend sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, basic CSP
- No `Server` header leaking version

---

## 13. Marketing Copy & Common Sense

### 13.1 Copy review
- Onboarding: hooks attention, explains value, no jargon overload
- Empty states: friendly, actionable (not just "No data")
- Error states: human language, no stack traces shown to user
- CTAs: verb-led, specific ("Scan This Area" not "Submit")
- About / App Store description (`docs/appstore-description.md`) consistent with in-app tagline

### 13.2 Cohesion
- Navigate the full app top-to-bottom as a new user. Does the story make sense?
  - Why do I scan? → because hidden spots
  - What do scores mean? → guide explains
  - Can I save favorites? → spots tab
  - Can I trust the data? → legal disclaimers + report flow
- Any dead-ends? Any orphan screens? Any confusing icons?

### 13.3 Brand consistency
- Logo, name "WildSpotter", tagline appear identically in: splash, onboarding, about, app.json, package.json, marketing-path videos
- Color tokens consistent app vs marketing (note: marketing videos use warm earthy palette intentionally — app uses warm earthy too per `theme.ts`, NOT the legacy navy from old SPEC)

---

## 14. marketing-path (Remotion Project)

### 14.1 Studio launch
- `cd marketing-path && npm run dev` → opens Remotion Studio at default port
- All 4 compositions registered: ParkingLleno, OchentaYSiete, LaMulta, Natura2000Clip
- No console errors, no missing asset warnings

### 14.2 Asset integrity
- All 24 video files in `public/videos/` exist and are valid MP4 (`file` command check)
- All 8 audio files valid MP3 (not HTML error pages — known historical risk)
- All images load (logos, vans, maps)

### 14.3 Per-composition preview
For each composition, in Studio:
- Plays end-to-end with no missing-asset red frames
- Frame count matches CLAUDE.md table (805/900/766/482)
- Audio audible, music fades clean, SFX (where used) sync to frame markers
- All scenes have video background visible (no flat solid frames — foundational rule)
- Ken Burns zoom present on every clip
- Text legible, font sizes ≥72/48/28 minimums
- Min scene durations respected (3s/4.5s/6s)

### 14.4 Visual brand
- Warm earthy palette throughout (`#1A1614`, `#D97706`)
- Logo box uses real gradient logo image, not SVG approximation
- AI footage Veo watermark hidden (vignette or crop)
- No competitor names visible in any frame
- Legal cards use staggered 18f spring cascade pattern

### 14.5 Render output
- `npx remotion render ParkingLleno out/parking-lleno.mp4` succeeds
- Output is 1080×1920, 30fps, h264 MP4
- File plays in QuickTime + Chrome
- Repeat for all 4 videos
- Total render time logged, file sizes reasonable (<50MB each)

### 14.6 Lint & types
- `npm run lint` clean

---

## 15. Regression Random-Spot Sampling

Pick 5 spots at random from the database (varied score, region, legal status):

For each:
1. Open detail page from direct URL
2. Verify all sections render with that spot's specific data
3. Cross-check API response vs displayed values (no rounding bugs)
4. Save → unsave → save → reload → still saved
5. Report spot → "score too high" → succeeds
6. Inspect/Navigate links contain correct coords
7. Screenshot `random_spot_<id>.png`

Random selection script:
```js
fetch('/spots?min_lat=36&min_lon=-9&max_lat=44&max_lon=4')
  .then(r=>r.json())
  .then(s=>s.sort(()=>Math.random()-0.5).slice(0,5))
```

---

## 16. Exit Criteria

Launch is GO when:
- All P0 rows ✅
- ≥95% P1 rows ✅
- Zero console errors during a 10-minute happy-path session
- Zero unhandled promise rejections
- Zero failed network requests on happy paths
- All 4 marketing videos render successfully
- `npm audit` (frontend + backend) clean of high/critical
- Spanish + English both pass full visual sweep
- Light + Dark both pass full visual sweep

---

## 17. Reporting Template

```
### Test: <id> <name>
Status: ✅ / ❌ / ⚠️
Severity: P0 / P1 / P2
Screenshot: tests/e2e/<id>.png
GIF: tests/e2e/<id>.gif (if multi-step)
Console: <0 errors> / <list>
Network: <ok> / <list of failures>
Notes: <observations>
Repro: <if failed>
```

Aggregate results in `tests/e2e/RESULTS.md` after each pass.
