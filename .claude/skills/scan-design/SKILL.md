---
name: scan-design
description: Opens the WildSpotter design mockup, takes screenshots, and validates the current implementation against the design spec.
user-invocable: true
allowed-tools: Read, Grep, Glob, mcp__pencil__get_editor_state, mcp__pencil__open_document, mcp__pencil__batch_get, mcp__pencil__get_screenshot, mcp__pencil__snapshot_layout, mcp__pencil__get_variables
---

# Scan Design

Validate the current UI implementation against the WildSpotter design mockups.

## Steps

1. Open `design/wildspotter-mockup.pen` using the Pencil MCP
2. Take screenshots of all screens in the mockup
3. Read the design tokens from SPEC.md §4.1
4. Read the implemented component files in `src/components/` and `src/app/`
5. Compare: colors, typography, spacing, layout, component styles
6. Report findings per screen:
   - **Match score** (1-10)
   - **Deviations** with file:line references
   - **Suggested fixes** with exact style values

## Design Tokens Reference

- Background: `#0A0F1C`, Surface: `#1E293B`, Accent: `#22D3EE`
- Score: Green `#4ADE80`, Cyan `#22D3EE`, Amber `#FBBF24`
- Data font: JetBrains Mono, Body font: Inter
