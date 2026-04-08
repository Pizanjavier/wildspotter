# WildSpotter — Wave 1 Security Results
**Date:** 2026-04-07
**Scope:** Section 12 — Security (Cross-cutting)
**Reviewer:** reviewer agent (claude-sonnet-4-6)
**Backend:** http://localhost:8000 (running)

---

## Summary Table

| ID | Test | Result | Severity |
|----|------|--------|----------|
| 12.1a | `dangerouslySetInnerHTML` in src/ | ✅ PASS | P0 |
| 12.1b | `dangerouslySetInnerHTML` in backend/src/ | ✅ PASS | P0 |
| 12.1c | `eval(` in src/ | ✅ PASS | P0 |
| 12.1d | `eval(` in backend/src/ | ✅ PASS | P0 |
| 12.2a | Hardcoded secrets in src/ | ✅ PASS | P0 |
| 12.2b | Hardcoded secrets in backend/src/ | ✅ PASS | P0 |
| 12.2c | PostHog key — env-gated, empty default | ✅ PASS | P1 |
| 12.2d | Sentry DSN — placeholder, SDK init gated | ✅ PASS | P1 |
| 12.3a | CORS — restricted to known origins | ✅ PASS | P1 |
| 12.4a | GPS coords rounded before analytics | ✅ PASS | P0 |
| 12.4b | Analytics/Sentry opt-out gate | ⚠️ WARN | P1 |
| 12.5a | `npm audit` root — high/critical vulns | ✅ PASS | P0 |
| 12.5b | `npm audit` backend — high/critical vulns | ✅ PASS | P0 |
| 12.6a | No exposed admin endpoints | ✅ PASS | P0 |
| 12.7a | X-Content-Type-Options: nosniff | ✅ PASS | P1 |
| 12.7b | X-Frame-Options: DENY | ✅ PASS | P1 |
| 12.7c | Content-Security-Policy present | ✅ PASS | P1 |
| 12.7d | Server header does not leak version | ✅ PASS | P1 |
| 12.7e | SQL injection on /spots numeric params | ✅ PASS | P0 |
| 12.7f | Path traversal on /spots/:id | ✅ PASS | P0 |
| 12.7g | Satellite path traversal / non-image ext | ✅ PASS | P0 |
| 12.7h | Legal tiles zoom-range enforcement | ✅ PASS | P0 |
| 12.7i | Report XSS payload — UUID validation blocks | ✅ PASS | P0 |
| 12.8a | Default export in _layout.tsx (Expo Router req.) | ⚠️ WARN | P2 |

---

## Detailed Findings

---

### Test: 12.1a dangerouslySetInnerHTML in src/
Status: ✅
Severity: P0
Console: 0 errors
Network: n/a
Notes: Zero matches in src/**/*.{ts,tsx}. React's default escaping is intact.

---

### Test: 12.1b dangerouslySetInnerHTML in backend/src/
Status: ✅
Severity: P0
Notes: Zero matches in backend/src/**/*.ts.

---

### Test: 12.1c eval( in src/
Status: ✅
Severity: P0
Notes: Zero matches in src/**/*.{ts,tsx}.

---

### Test: 12.1d eval( in backend/src/
Status: ✅
Severity: P0
Notes: Zero matches.

---

### Test: 12.2a Hardcoded secrets in src/
Status: ✅
Severity: P0
Notes: No hardcoded secret/password/private_key/api_key literals. PostHog key reads from `process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''` — analytics stays inert when key is absent. Sentry DSN reads from `process.env.EXPO_PUBLIC_SENTRY_DSN ?? 'YOUR_SENTRY_DSN_HERE'`; SDK init is gated on `SENTRY_ENABLED = SENTRY_DSN !== 'YOUR_SENTRY_DSN_HERE'`.

---

### Test: 12.2b Hardcoded secrets in backend/src/
Status: ✅
Severity: P0
Notes: No hardcoded secrets. DATABASE_URL, CORS_ORIGINS read from env via CONFIG.

---

### Test: 12.3a CORS restricted to known origins
Status: ✅
Severity: P1
File: backend/src/index.ts:48-68
Notes: CORS allowlist is built from `CORS_ORIGINS` env var (production) or the five explicit localhost dev origins (no env set). Unknown origin `http://evil.com` received no `access-control-allow-origin` header in live test. `credentials: true` is set — acceptable since the allowlist is strict (not `origin: true`).

---

### Test: 12.4a GPS coordinates rounded before analytics
Status: ✅
Severity: P0
File: src/components/spots/ActionButtons.tsx:18
Notes: `roundCoord` rounds to 2 decimal places (`Math.round(value * 100) / 100`) before passing lat/lon to `trackEvent`. Meets SPEC_V2 §12.4 requirement. Note: these are spot coordinates, not user GPS position — user location is never passed to analytics at all (only used for map centering client-side).

---

### Test: 12.4b Analytics and Sentry opt-out gate
Status: ⚠️ WARN
Severity: P1
File: src/app/_layout.tsx:22,46
Issue: `initSentry()` is called at module scope (line 22, before the component mounts). `initAnalytics()` and `trackEvent('app_opened')` are called unconditionally in the first `useEffect` (line 46). There is no check for a user opt-out preference before initialisation. SPEC_V2 §12.4 states PostHog/Sentry should be "initialized only when the user has not opted out". Currently there is no consent mechanism or opt-out store field.
Fix: Add an `analyticsEnabled` boolean to the settings store (default `true`). In `_layout.tsx` read the hydrated value before calling `initAnalytics()` / `initSentry()`. Provide a toggle in the Config screen.

---

### Test: 12.5a npm audit root — high/critical
Status: ✅
Severity: P0
Notes: `npm audit` reports 2 moderate vulnerabilities only — `brace-expansion` (DoS via zero-step sequence, dev/test dependency only in `@jest/reporters` and `@react-native/codegen`) and `yaml` (stack overflow via deeply nested YAML). Zero high or critical vulnerabilities. Does not block launch per §16 exit criteria.

---

### Test: 12.5b npm audit backend
Status: ✅
Severity: P0
Notes: `npm audit` reports 0 vulnerabilities. Backend is clean.

---

### Test: 12.6a Exposed admin endpoints
Status: ✅
Severity: P0
Notes: `GET /spots/../../admin` returns `404 Route GET:/admin not found`. No admin routes registered. No auth-required routes present without an auth check (no auth implemented — consistent with §12.6 spec acknowledgment).

---

### Test: 12.7a X-Content-Type-Options: nosniff
Status: ✅
Severity: P1
Notes: `@fastify/helmet` registered globally in backend/src/index.ts:33-46. Live response confirms `X-Content-Type-Options: nosniff`.

---

### Test: 12.7b X-Frame-Options: DENY
Status: ✅
Severity: P1
Notes: Live response confirms `X-Frame-Options: DENY` (set via `frameguard: { action: 'deny' }` in helmet config).

---

### Test: 12.7c Content-Security-Policy present
Status: ✅
Severity: P1
Notes: Full CSP header present: `default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; ...`. The `unsafe-inline` on style-src is a minor weakness but acceptable for a JSON API backend (no HTML served).

---

### Test: 12.7d Server header version leak
Status: ✅
Severity: P1
Notes: No `Server:` header in response. Fastify version not disclosed.

---

### Test: 12.7e SQL injection on /spots numeric params
Status: ✅
Severity: P0
Notes: `GET /spots?min_lat=0&min_lon=-10&max_lat=99&max_lon=0&min_score=abc` returns `400 Bad Request` — Fastify JSON Schema validation rejects invalid types before reaching SQL. Parameterized queries in `findSpotsByBbox` provide a second layer of defence.

---

### Test: 12.7f Path traversal on /spots/:id
Status: ✅
Severity: P0
Notes: `GET /spots/../../admin` resolves to `/admin` by Fastify's router (path normalisation), returns 404. UUID format validation on `params.id` would additionally reject non-UUID strings.

---

### Test: 12.7g Satellite path traversal / non-image extension
Status: ✅
Severity: P0
Notes: `GET /satellite/../etc/passwd` → 404 (path normalised to `/etc/passwd`, route not found). `GET /satellite/foo.exe` → `400 params/filename must match pattern "^[a-zA-Z0-9_-]+\\.(jpg|jpeg|png|webp)$"` — regex whitelist enforced at route level.

---

### Test: 12.7h Legal tiles zoom-range enforcement
Status: ✅
Severity: P0
Notes: `GET /legal/tiles/99/0/0.pbf` → `404 Tile zoom out of range`. `GET /legal/tiles/abc/0/0.pbf` → `400 params/z must be integer`. Both integer type and range validated.

---

### Test: 12.7i Report XSS payload — UUID validation blocks before storage
Status: ✅
Severity: P0
Notes: POST /reports with `spot_id: "test-uuid"` (not a UUID) and XSS comment `<img src=x onerror=alert(1)>` returns `400 body/spot_id must match format "uuid"`. The XSS string never reaches storage. A valid UUID with an XSS comment body would be stored as a raw string in PostgreSQL TEXT — no HTML rendering occurs in the API response (JSON-encoded), so the XSS vector requires a consuming UI to render it without escaping. The mobile app has no `dangerouslySetInnerHTML` (see 12.1a), so the vector is effectively neutralised end-to-end.

---

### Test: 12.8a Default export in _layout.tsx
Status: ⚠️ WARN
Severity: P2
File: src/app/_layout.tsx:78
Notes: `export default Sentry.wrap(RootLayout)` uses a default export with an eslint-disable comment (`eslint-disable-next-line import/no-default-export`). CLAUDE.md mandates named exports only. The comment acknowledges Expo Router's requirement for a default export on the root layout. This is an accepted deviation but the suppress comment should reference the reason explicitly.

---

## Aggregate Status

| Severity | Total | Passed | Warned | Failed |
|----------|-------|--------|--------|--------|
| P0 | 12 | 12 | 0 | **0** |
| P1 | 10 | 8 | 2 | 0 |
| P2 | 1 | 0 | 1 | 0 |

Launch is **CONDITIONAL GO** on security grounds — all P0 checks pass. Two P1 warnings must be addressed before marketing push:
1. Analytics/Sentry opt-out gate (12.4b) — add consent mechanism per §12.4
2. `npm audit fix` for the 2 moderate vulns (non-blocking but keep clean)
