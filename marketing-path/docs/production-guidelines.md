# Video Production Guidelines

Rules learned during production of ParkingLleno, LaMulta, OchentaYSiete, ElRadarDetecto, PuenteDeMayo, and others. Apply to all future videos.

## 1. Footage

### FOUNDATIONAL RULE: Continuous video backgrounds — no flat solid frames

**Every frame must have motion.** Flat solid-color text slides mixed with real footage feels like PowerPoint, not a professional ad.

- Every scene gets a video background. Vary dimming (15-75% overlay opacity), but never show a static frame.
- **DO NOT switch video for every text change.** One clip can run behind multiple text scenes — vary the dimming. 15-20s Reel = 2 videos max (one crossfade at the narrative midpoint). 25-30s = 3 ceiling.
- The last video must cover the entire remaining duration. Use `loop` if the clip is shorter. Never let a shorter clip end and reveal black.
- Dimming by scene type: text-focused (0.15-0.25), UI/app demo (0.10-0.20), data visualization (0.10-0.15).
- **All transitions should be fades** (16-20f). No slide or wipe transitions.
- Narrative footage arc: problem (crowded, stressful) -> transition (nature, hope) -> solution (peaceful van in nature).
- Use `<Video>` from `@remotion/media` with `muted`, `loop`, `style={{ objectFit: "cover" }}`.
- Apply slow Ken Burns zoom (`interpolate(frame, [0, duration], [1.0, 1.08-1.12])`) on all video backgrounds.

### Exception: map scenes

When a scene's visual IS the map (animated counter + appearing dots + geography), don't add a video background behind it — two competing layers create confusion. The dark map with animated elements provides its own motion.

### Footage source priority

1. **Pexels free stock video** — generic vanlife/nature/driving. No attribution needed.
2. **AI video generators** (Runway Gen-3, Kling, Sora, Veo) — specific shots impossible to find in stock.
3. **Screen captures from live app** — authentic app demos via Chrome browser automation against localhost:8081.
4. **Real CARTO map tiles** — for map-background scenes inside phone frames.

### Footage variety — don't reuse the same clips

- Each video needs a **distinct footage palette**. Always `ls public/videos/` and pick from the FULL inventory (70+ clips). The folder listing is the source of truth.
- Check `docs/footage-music-map.md` for what's already used. Prefer unused clips.
- Thematic match beats novelty — but if two clips both fit, pick the less-used one.

### Footage-context match

- Footage must match the product context, not just the emotion. A city parking lot reads as "parking app" — use campervans in natural settings for "crowded spot" scenes.
- AI generation excels for shots too specific for stock ("VW vans packed in a coastal clearing at golden hour").

### Text-footage semantic coherence

**If text describes a specific landscape, footage must visually match it.** Mismatches destroy credibility instantly.

- "plano" (flat) -> no cliffs. "meseta castellana" -> dry plateau, not salt flats. "vistas al mar" -> sea must be visible.
- Rule of thumb: read the text out loud while watching the footage. If a viewer would think "that's not what they just said", it's wrong.
- When no footage matches the text: (a) adjust text to match available footage, or (b) flag that new footage is needed. Never force a mismatch.

### AI-generated footage (Veo) — watermark handling

AI clips (prefixed `ai_`) have a "VEO" watermark bottom-right. Hide with: `objectPosition` crop, dark gradient vignette, or `objectFit: "cover"` + `scale(1.08)`.

## 2. Typography

- Minimum font sizes for 1080x1920: **72px** main statements, **48px** secondary, **28px** metadata/labels.
- Text read in under 2 seconds: 80px+.
- `letterSpacing: -1` or `-2` on large Inter bold text.
- Always apply `textShadow` (`0 4px 16px rgba(0,0,0,0.8)`) or dark overlay behind text for legibility against video.
- Show **full sentences at once** with key phrases highlighted inline. Staggered word-by-word reveals are confusing. Exception: counter animations (0->87).

## 3. Layout & Safe Zones

### Platform safe areas (TikTok / Instagram Reels)

- `paddingBottom: 450px` (captions/audio UI)
- `paddingTop: 250px` (system status/following tabs)
- `paddingRight: 150px` (engagement icons)
- `paddingLeft: 50px`

### Split-screen — top/bottom for landscape footage

- Landscape (16:9) footage: **top/bottom split**, not left/right. Each half gets full 1080px width.
- Thin glowing divider (3px, amber gradient) with `zIndex: 10`. Comparison text centered at divider.
- Best with: TOP = crowded footage, BOTTOM = calm solo van footage.

## 4. Audio

- Audio files may be corrupt (HTML error pages from failed downloads). **Always check with `file` command** before using.
- Valid: `Audio file with ID3...` or `MPEG ADTS, layer III`. Invalid: `HTML document text`.
- Royalty-free sources: Mixkit (direct MP3 at `https://assets.mixkit.co/music/{id}/{id}.mp3`), Pixabay (browser download).
- **Each video gets its own distinct music track.** Different moods need different tracks.
- Mixkit download: `curl -sL -o public/audio/music/name.mp3 https://assets.mixkit.co/music/{ID}/{ID}.mp3`. Verify with `file`.
- Get track IDs from Mixkit category pages via WebFetch — don't guess IDs.

### SFX — less is more

- Game-y UI sound effects (pings, dings, whooshes) sound cheap in educational/fear-angle videos.
- Serious/educational videos: music only, no SFX. SFX work better in playful/ironic videos (Concepto A) than fear/authority (Concepto C).

## 5. Timing & Duration

- Minimum per text amount: 1 block = 3s, 2 blocks = 4.5s, 3+ blocks = 6s+.
- CTA scene (last) needs at least 6s.
- Initial instinct is to make scenes too short. **Add 30-50% more frames** than feels necessary on first pass.
- 15s micro-clip: 4 scenes of ~4s each. Don't cram 4 scenes into 10s.
- Text-heavy scenes (2+ blocks, different timings): minimum 3.7s.
- If text appears late (delay > 60% of scene duration), ensure at least 2.5s remain: `(sceneDuration - textDelay) / fps >= 2.5s`.

## 6. Content Rules

### Competitor references
- **Never mention Park4night, iOverlander, or any competitor by name.** Use "Otras apps" instead. Not in hashtags either.

### Hashtags
- **Maximum 5 per post.** More looks spammy.

### Narrative coherence
- Every scene must connect to the previous one or be self-contained. No dangling references ("dentro" without establishing what "dentro" means).
- Test: "If someone watched only this scene, would they understand?"

### Use REAL product data, not invented values

When showing app output, cross-reference the actual worker code:
- **AI sub-scores** (`workers/ai_vision_labeler.py`): `surface_quality`, `vehicle_access`, `open_space`, `van_presence`, `obstruction_absence` (each 0-10). Model: Claude Haiku 4.5. Source: IGN PNOA 25cm/px.
- **Context sub-scores** (`workers/context_scoring.py`, `SPEC_V2.md` S2.6): road_noise, urban_density, scenic_value, privacy, industrial, railway, van_community, drinking_water, dog_friendly.
- **Landcover** (`workers/landcover.py`): `landcover_class` (CORINE code), `landcover_label`. Wild archetypes: coastal, alpine_strong, water_feature_strong, forest_dead_end, scenic_viewpoint. Penalty: agricultural (2xx), urban (1xx), industrial (131/132/133).
- **V4 scoring:** `Terrain x 10% + AI x 55% + Context x 15% + wild_bonus - landcover_penalty`. Old V2 weights (20/25/55) are obsolete.
- **Pipeline statuses:** `pending -> terrain_done -> legal_done -> ai_done -> context_done -> amenities_done -> completed`.
- **Translate labels to Spanish** for on-screen display. English keys only when showing "raw data / JSON / API" framing.

### Official data imagery

- Use actual official map images (MITECO, IGN) for legal/geographic data. Never approximate with SVG blobs.
- Visual treatment: `filter: saturate(0.55) brightness(0.7) contrast(1.25)` + color tint overlay (`mixBlendMode: "multiply"`) + gradient vignettes.
- Scale large (200%+), crop into the dense center.

## 7. Visual Patterns

### Assets — real images over SVG

- Use real PNG for recognizable objects (vans, logos). `<Img src={staticFile("images/file.png")} />`.
- App logo: `public/images/app-logo.png` (source: `design/app-logo-1024.png`). Never approximate in SVG.
- Vans: `public/images/van1.png` (blue Kombi), `van2.png` (white Kombi) — RGBA with transparent backgrounds.
- Map backgrounds: real CARTO Voyager tiles. URL: `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`.

### Map geography

- Always verify map image land/sea distribution before placing pins/overlays.
- Center coordinates must place land in the center. Verify by reading the image before rendering.

### Legal check cards

- 4-card pattern (Natura 2000, Parque Nacional, Ley de Costas, Catastro). Color-coded dot + label + status + icon.
- Staggered spring animations, ~18f delay. Colors: red, amber, blue, green.

### Pipeline / list cards

- Label + progress bar + checkmark. No sublabels. Font 42px+, staggered slide-in, sequential progress bars.

### Icons — skip emoji and standard sets

- Emoji/Lucide/FontAwesome look unprofessional in video. Use colored vertical bar accents (4px wide) next to text items.

### Avoid redundant elements

- One hero element per scene. Big number (e.g. "87") OR animated counter — not both.

### Satellite reveal (ElRadarDetecto hero moment)

- Circular `clipPath` expanding 0% -> 75% via spring animation.
- Image: 1.8x scale + 16px blur -> 1x + 0px blur during reveal.
- Amber crosshair overlay at center. Camera shake on completion (frames 70-82).
- Label "PNOA . 25cm/px . Ortofoto real" fades in after settle.
- Dim tile (0.35 opacity, 4px blur) as background in the following score scene for visual continuity.

## 8. Data-Driven Compositions

The most effective content differentiator is **real data from the WildSpotter pipeline**.

- **Query PostGIS** for completed spots: `docker-compose exec db psql -U wildspotter -d wildspotter`. Pick `status = 'completed'` with interesting characteristics.
- **Use real PNOA satellite tiles** from `data/satellite_tiles/` -> `public/images/satellite-spot-{osm_id}.jpg`.
- **`SpotData` type** with real fields. Each variant gets its own object as `defaultProps` in `Root.tsx`.
- **Scene components accept props** — same scenes, different data per variant. No file duplication.
- **Variety** — include different landscape types (river, lake, mountain, coast). At least one coastal.
- **Never reveal exact location** — show landscape type + data, never coordinates/municipality/province.
- **DB access:** port 5433, user `wildspotter`, password `wildspotter_dev`, database `wildspotter`. Docker must be running.
