---
paths:
  - "src/services/legal/**/*"
  - "src/components/legal/**/*"
---

# Legal & Restriction Data Rules

## Data Sources (Spain)
- **MITECO** — Environmental protection: Red Natura 2000, National Parks, Coastal Law
- **Catastro** — Land ownership: public vs private parcels
- **IGN** — Administrative boundaries, public forestry

## WMS Integration
- WMS requests are processed server-side by the Python legal worker
- Use GetMap for visual overlays on MapLibre (client-side rendering)
- Use GetFeatureInfo for point-query checks at spot coordinates (server-side)
- Cache WMS responses aggressively (environmental boundaries rarely change)
- Respect CRS: Spanish data often uses EPSG:25830 (ETRS89 / UTM zone 30N)

## Restriction Logic
- Check each candidate spot against ALL legal layers
- A spot inside a protected zone = DISCARD or WARNING (never silent)
- Warning categories:
  - Red: Inside National Park / strict protection → discard
  - Amber: Near Coastal Law zone / Natura 2000 buffer → warn
  - Green: Public land, no restrictions found → clear

## Legal Status Display
- Show checklist-style status per layer (green check / red X / amber warning)
- Include source attribution (e.g., "Data: MITECO, Red Natura 2000")
- Link to official source when possible

## Important Notes
- Environmental boundaries are legally binding — err on the side of caution
- Coastal Law (Ley de Costas) has complex buffer zones — don't simplify
- Some WMS services have low availability — implement retry with backoff in the Python worker
- Rate-limit WMS requests (1-second delay) to avoid overloading government servers
- Legal results are stored in the `legal_status` JSONB column in PostGIS
