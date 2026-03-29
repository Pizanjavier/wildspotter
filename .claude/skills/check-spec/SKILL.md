---
name: check-spec
description: Cross-references current implementation against SPEC_V2.md to find gaps, deviations, or missing features. Optionally focus on a specific section.
argument-hint: [section]
user-invocable: true
allowed-tools: Read, Grep, Glob
---

# Check Spec Compliance

Compare the current codebase against SPEC_V2.md requirements.

## Arguments

- `$ARGUMENTS` — Optional section to focus on (e.g., `2.1`, `radar`, `topographer`, `legal`, `ai`, `bridge`). If omitted, checks everything.

## Steps

1. Read `SPEC_V2.md` fully (or the specified section)
2. Scan `src/` to understand what's implemented
3. For each SPEC_V2.md requirement, classify as:
   - **Implemented** — Code exists and matches the spec
   - **Partial** — Code exists but is incomplete or deviates
   - **Missing** — No implementation found
   - **Deviated** — Implemented differently than spec describes

4. Report in a table:

| Spec Section | Requirement | Status | Notes |
|-------------|-------------|--------|-------|
| §2.1 | Vector mapping | Implemented | Using MapLibre GL |
| §2.1 | Bounding box selection | Missing | — |
| ... | ... | ... | ... |

5. Summary: % implemented, critical gaps, recommended next steps
