# Wave 1 — Backend API Contract & Validation (§11)

Backend: http://localhost:8000 | Date: 2026-04-07 | Method: curl only

### Test: 11.1 GET /health
Status: PASS
Severity: P0
Network: 200 in 11ms
Notes: Body `{"status":"ok"}`, well under 100ms budget.

### Test: 11.2 GET /spots (bbox query)
Status: PASS
Severity: P0
Notes:
- Valid bbox (Almeria coast) -> 200, array of SpotSummary with id/osm_id/coordinates/spot_type/surface_type/slope_pct/elevation/legal_status/composite_score/status. Schema matches spec.
- Missing params -> 400 `querystring must have required property 'min_lat'`.
- Inverted bbox -> 400 `Invalid bbox: min_lat must be < max_lat and min_lon must be < max_lon` (custom guard, not 500).
- SQL injection `min_lat=0;DROP TABLE` -> 400 `must be number` (schema-rejected before reaching SQL; parameterized pg queries confirmed).
- CORS: preflight from `http://evil.com` returns no ACAO header; preflight from `http://localhost:8081` is allowed. Origin allowlist enforced.

### Test: 11.3 GET /spots/:id
Status: PASS
Severity: P0
Notes:
- Valid UUID -> 200 SpotDetail (osm_tags, terrain_score, legal_status, etc.).
- Invalid UUID format -> 400 `params/id must match format "uuid"`.
- Non-existent valid UUID -> 404 `{"error":"Spot not found"}`.
- Path traversal `/spots/../admin` -> 404 route not found. No file leak.

### Test: 11.4 POST /reports
Status: PASS (with P1 note)
Severity: P0
Notes:
- Valid body (`not_accessible`) -> 201 with id, spot_id, category, comment, created_at.
- Missing category -> 400 schema error.
- Oversized comment (5000 chars) -> 400 `must NOT have more than 2000 characters` (not 413, but rejected cleanly).
- XSS payload `<script>alert(1)</script>` accepted and stored verbatim (201). React escapes on render so not an active XSS, but server-side sanitization would be defense-in-depth. **P1**.
- Allowed categories per code: `incorrect_legal | not_accessible | private_property | score_too_high | score_too_low | other`. docs/e2e_tests.md §11.4 uses outdated names (`inaccessible`) — **P2 doc drift**.

### Test: 11.5 GET /satellite/:filename
Status: PASS
Severity: P0
Notes:
- Path traversal `../etc/passwd` -> 404 (regex rejects).
- `foo.exe` -> 400 (extension pattern rejects non-image).
- Nonexistent valid filename -> 404.

### Test: 11.6 GET /legal/tiles/:z/:x/:y.pbf
Status: PASS
Severity: P0
Notes:
- Valid `6/32/24.pbf` -> 200, `content-type: application/x-protobuf`.
- Out-of-range `z=99` -> 404.
- Non-integer `z=abc` -> 400 (integer schema validation).

---

## Summary

| Test | Result |
|---|---|
| 11.1 /health | PASS |
| 11.2 /spots | PASS |
| 11.3 /spots/:id | PASS |
| 11.4 /reports | PASS (P1) |
| 11.5 /satellite | PASS |
| 11.6 /legal/tiles | PASS |

**P0 blockers:** none.

**P1:** `/reports` stores comment HTML verbatim. Add server-side sanitization for defense-in-depth.

**P2:** docs/e2e_tests.md §11.4 references outdated report category names; align with backend enum.

**Files exercised:**
- /Users/javier/Documents/Proyects/wildspotter/backend/src/routes/spots.ts
- /Users/javier/Documents/Proyects/wildspotter/backend/src/routes/reports.ts
- /Users/javier/Documents/Proyects/wildspotter/backend/src/routes/legal-tiles.ts
