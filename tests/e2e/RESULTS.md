# WildSpotter E2E — Aggregated Results

**Date:** 2026-04-07
**Branch:** main
**Stack:** docker-compose (api+db+worker+n8n) up, Expo Web :8081

## Verdict: 🟡 CONDITIONAL GO

All P0 launch blockers pass. 10 P1 issues must ship before the marketing push.

## Summary

| Sev | ✅ Pass | ⚠️ Warn | ❌ Fail |
|-----|--------|--------|--------|
| P0  | ~40    | 0      | 0      |
| P1  | ~25    | 10     | 3      |
| P2  | ~12    | 6      | 0      |

## Waves

- Wave 1 UI §1–4: 15✅ / 7⚠️ / 0❌ — `wave1-ui.md`
- Wave 1 Design §5–8: 38✅ / 2⚠️ / 0❌ — `wave1-design.md`
- Wave 1 API §11: pass; 1 P1 (XSS defense-in-depth) — `wave1-api.md`
- Wave 1 Security §12: 12/12 P0 pass; 1 P1 analytics opt-out — `wave1-security.md`
- Wave 1 Marketing/Remotion §14: pass — `wave1-marketing.md`
- Wave 2 Perf/Native/Regression §9,10,15: 2 P1, 1 P2 — `wave2-perf.md`
- Wave 2 Copy §13: 9✅ / 7⚠️ / 1❌ — `wave2-copy.md`

## P1 — fix before marketing push

1. **COPY-13.2-D** `src/i18n/locales/{en,es}.ts:66` — `spotDetail.aiDescription` says "Claude Vision". SPEC_V2 §2.5 = custom ONNX/YOLO. Rewrite. COMMENT: Is not false, review the n8n pipelines, claude vision was used, update spec_v2 as the fix.
2. **PERF-9.2-c** `GET /satellite/<osm_id>.jpg` → 503 for every spot. Verify satellite tile mount/route.
3. **PERF-9.2-a** `src/app/spot/[id].tsx` — `/spots/:id` fires 2–3× per visit. Add AbortController + ref guard.
4. **SEC-12.4-b** `src/app/_layout.tsx:22,46` — `initSentry()`+`initAnalytics()` run unconditionally. Gate on `analyticsEnabled` store flag + Config toggle.
5. **API-11.4** `/reports` stores comment XSS verbatim. Add server-side sanitize (defense-in-depth).
6. **UI-01** Onboarding FlatList horizontal paging broken on Expo Web — pages stack vertically, "Vamos" unreachable.
7. **UI-02** `navigator.language` auto-detect not implemented; defaults to `'en'`.
8. **COPY-13.1-E** Three divergent taglines (splash / config / App Store). Pick canonical.
9. **COPY-13.1-F** App Store says "6-stage pipeline" but Amenities is distinct (SPEC_V2 §2.7). COMMENT: Review reality of the app SPEC_V2 might be outdated,if that's the case update spec_v2
10. **COPY-13.3-F** `pipeline` i18n namespace missing `context`/`amenities` keys in `en.ts`, `es.ts`, `i18n/types.ts`.

## P2 polish

- Scan button not visually disabled at zoom<9 (warning only). COMMENT: That's expected spev_v2 might be outdated.
- App Store: "Ministerio para la Transicion Ecologica" missing accents + "y el Reto Demográfico".
- "Satellite Eye" (app) vs "Satellite AI" (App Store) naming drift.
- Config slope "slider" per spec is TextInput (functionally correct).
- `.claude/rules/design.md` still references legacy navy palette.
- `_layout.tsx:78` default export eslint-disable needs reason string.
- Storage quota-exceeded path not live-verified.

## Exit criteria

- [x] All P0 pass
- [ ] All P1 resolved (10 open)
- [x] No security P0
- [x] Bundle <3 MB gzipped (1.88 MB)
- [x] No console errors on happy path
- [x] i18n parity enforced by TS types
