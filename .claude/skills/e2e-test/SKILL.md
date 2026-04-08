---
name: e2e-test
description: Runs the full WildSpotter E2E test plan from docs/e2e_tests.md across functionality, design, performance, i18n, native features, security, and the marketing-path Remotion project. Delegates to project agents in parallel and produces tests/e2e/RESULTS.md.
user-invocable: true
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate, mcp__claude-in-chrome__read_page, mcp__claude-in-chrome__get_page_text, mcp__claude-in-chrome__javascript_tool, mcp__claude-in-chrome__read_console_messages, mcp__claude-in-chrome__read_network_requests, mcp__claude-in-chrome__find, mcp__claude-in-chrome__form_input, mcp__claude-in-chrome__get_screenshot, mcp__claude-in-chrome__gif_creator
---

# E2E Test

Execute the full E2E test plan defined in `docs/e2e_tests.md`. Coordinates parallel agent teams to minimize tokens and wall-clock time.

## Pre-flight (run inline, sequential)

1. `docker-compose ps` — confirm api+db+worker up. If not, `docker-compose up -d` (use `docker-ops` skill).
2. `curl -s localhost:8000/health` — must return `{"status":"ok"}`.
3. Check Expo Web is running (`lsof -i :8081`); if not, instruct user to run `npx expo start --web` (do NOT start it yourself — it blocks).
4. `tabs_context_mcp` then `tabs_create_mcp` → `http://localhost:8081`.

## Parallel execution plan

Spawn the following agents in a SINGLE message (parallel):

### Wave 1 — independent verification
- **tester** → Sections 1, 2, 3, 4 of `docs/e2e_tests.md` (UI happy paths + edge cases via Chrome). Outputs `tests/e2e/wave1-ui.md`.
- **tester** → Sections 5, 6, 7, 8 (Guide, Config, i18n, visual/design tokens). Outputs `tests/e2e/wave1-design.md`.
- **backend-engineer** → Section 11 (API contract + validation). Curl-based, no browser. Outputs `tests/e2e/wave1-api.md`.
- **reviewer** → Section 12 (security cross-cutting: grep `dangerouslySetInnerHTML`, `eval(`, secrets, `npm audit`, headers). Outputs `tests/e2e/wave1-security.md`.
- **general-purpose** → Section 14 (marketing-path Remotion: asset integrity via `file` cmd, lint, composition registration check — DO NOT render videos, just verify). Outputs `tests/e2e/wave1-marketing.md`.

### Wave 2 — depends on Wave 1 UI being green
- **tester** → Sections 9, 10, 15 (perf, native features, random-spot regression). Outputs `tests/e2e/wave2-perf.md`.
- **reviewer** → Section 13 (marketing copy & common sense — read screens text + appstore-description.md). Outputs `tests/e2e/wave2-copy.md`.

## Aggregation (inline, after waves complete)

Read all `tests/e2e/wave*.md`, produce `tests/e2e/RESULTS.md` using template from §17 of the test plan. Compute exit-criteria status (§16). Print one-screen summary to user: counts of ✅/❌/⚠️ by P0/P1/P2 and GO/NO-GO verdict.

## Token discipline

- Each agent gets ONLY its sections of the plan, not the whole doc.
- Agents must report concise pass/fail rows, not narrative.
- No screenshots in agent output unless a test fails.
- Use `docker-ops`, `check-spec`, `scan-design` skills where they shortcut work.
- If a wave-1 agent finds a P0 blocker, abort wave 2 and report immediately.
