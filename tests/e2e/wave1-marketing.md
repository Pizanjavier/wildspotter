# Wave 1 — marketing-path (Remotion) E2E Results

Scope: Section 14 of `docs/e2e_tests.md`, no renders. Verifies asset integrity (videos only), lint/types, and scene registration.

Project: `/Users/javier/Documents/Proyects/wildspotter/marketing-path`

---

### Test: 14.2 Asset integrity — videos
Status: PASS
Severity: P0
Console: n/a
Network: n/a
Notes: All 17 files in `public/videos/*.mp4` report as valid ISO Media / MP4 via `file` command. No HTML error pages or truncated files. Plan text says "24 video files" but current inventory per `marketing-path/CLAUDE.md` lists 16-17 — count matches the live inventory table; plan wording is stale.
Repro: `file marketing-path/public/videos/*.mp4`

### Test: 14.3 Composition / scene registration
Status: PASS
Severity: P0
Notes: `src/Root.tsx` registers all 4 compositions required by the plan: `ParkingLleno` (805f), `Natura2000Clip` (482f), `LaMulta` (766f), `OchentaYSiete` (900f) — frame counts match the CLAUDE.md table exactly, 30fps, 1080x1920. All scene files under `src/scenes/` (Scene1Hook, Scene2Stars, Scene3Question, Scene4Scan, Scene5CTA) and `src/scenes-87/` (Scene1Map, Scene2Qualities, Scene3Reveal, Scene4Demo, Scene5Pipeline, Scene6Choice) exist and are wired through their parent composition files. No orphan scene files.

### Test: 14.6 Lint & types (`npm run lint` = `eslint src && tsc`)
Status: PASS
Severity: P1
Notes: Exit code 0. Both `eslint src` and `tsc` ran clean — no errors, no warnings (only unrelated npm config warnings about `always-auth`). Previous run's `Math.random()` lint error in `Scene3Reveal.tsx` has been resolved.
Repro: `cd marketing-path && npm run lint`

---

## Summary

| Check | Result |
|---|---|
| Video asset integrity | PASS 17/17 valid MP4 |
| Scene/composition registration | PASS 4/4 compositions, 11/11 scene files wired |
| ESLint + tsc | PASS exit 0 |

Wave 1 (Section 14, subset: assets + lint + registration): clean. No P0 or P1 failures. Not covered in this pass (deferred): 14.1 Studio launch, 14.2 images/audio integrity, 14.3 per-composition preview/frame playback, 14.4 visual brand, 14.5 render output — all require Remotion Studio or render pipeline which was explicitly excluded.
