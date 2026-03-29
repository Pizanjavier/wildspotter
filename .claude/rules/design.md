---
paths:
  - "src/components/**/*"
  - "src/app/**/*"
  - "*.pen"
---

# Design Rules

## Color Palette — No Exceptions
- Background: `#0A0F1C` — all screen backgrounds
- Card/Surface: `#1E293B` — cards, modals, bottom sheets
- Accent: `#22D3EE` — buttons, links, active states, radar elements
- Score green: `#4ADE80` — confidence 80+
- Score cyan: `#22D3EE` — confidence 60-79
- Score amber: `#FBBF24` — confidence <60, warnings
- Text primary: `#F1F5F9` (slate-100)
- Text secondary: `#94A3B8` (slate-400)
- Border/divider: `#334155` (slate-700)

Never use white (`#FFFFFF`) backgrounds. Never hardcode colors outside this palette — use constants from `@/constants/colors`.

## Typography
- **Data values, scores, labels, coordinates:** JetBrains Mono
- **Titles, body text, descriptions:** Inter
- Define font families in `@/constants/typography`

## Component Patterns
- Bottom sheets: draggable, slate surface, rounded top corners
- Score badges: pill-shaped, color-coded by confidence tier
- Cards: slate surface, subtle border, 12px border-radius
- Buttons: cyan accent fill for primary, outline for secondary
- Tab bar: pill-style, bottom-fixed

## Spacing
- Base unit: 4px
- Padding: 12px (tight), 16px (default), 24px (loose)
- Card gap: 12px
- Screen horizontal padding: 16px

## Reference
- Mockups: `design/wildspotter-mockup.pen`
- Exports: `design/map-view.png`, `design/scan-results.png`, `design/spot-detail.png`
