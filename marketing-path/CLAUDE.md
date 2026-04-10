# WildSpotter — Marketing & Video Production

This is the **marketing subfolder** of the WildSpotter project. It is a standalone Remotion project for creating promotional videos, social content, and marketing materials for the WildSpotter app.

**Parent project:** `../` — read `../SPEC_V2.md` for the full product spec and `../CLAUDE.md` for the app's coding conventions and agent workflow.

## What is WildSpotter?

WildSpotter is an advanced geographical exploration tool for the **overland and vanlife community** in Spain. It acts as a "radar" that processes raw geographic, topographic, legal, and satellite data to probabilistically identify undiscovered, flat, and legally viable overnight parking spots in the wild.

### Core Pipeline (in order)

1. **Radar** — Finds candidate spots from OpenStreetMap data (dead-end tracks, dirt parkings, clearings)
2. **Topographer** — Evaluates terrain slope and elevation via Terrain-RGB tiles
3. **Legal Judge** — Cross-references spots against Natura 2000, National Parks, Coastal Law, and Cadastre data
4. **Satellite Eye** — AI model analyzes satellite imagery for ground surface, vehicle detection, canopy density
5. **Context Analyst** — Spatial scoring (road noise, urban density, scenic value, privacy, etc.)
6. **Success Score** — Composite 0-100 score: Terrain 20% + AI 25% + Context 55%

### Key Value Proposition

Unlike user-generated directories (Park4night, iOverlander) that lead to massification of natural spots, WildSpotter **discovers spots no one has shared** by analyzing raw geographic data with AI-powered satellite vision. It's a "radar" for vanlifers, not a review site.

### Target Audience

- Vanlifers and overlanders exploring Spain
- Digital nomads living in converted vans
- Outdoor enthusiasts seeking wild camping spots
- Road-trippers who prefer nature over crowded campsites

## Stack (This Project)

- **Video Engine:** Remotion 4.x (React-based programmatic video)
- **UI:** React 19, TypeScript
- **Styling:** Tailwind CSS v4 (via `@remotion/tailwind-v4`)
- **Config:** `remotion.config.ts` — JPEG output, overwrite enabled, Tailwind webpack override

## Brand Identity & Design Tokens

All videos and marketing materials **must** follow the WildSpotter brand:

| Token | Value | Usage |
|-------|-------|-------|
| **Background** | `#0A0F1C` | Deep navy — primary background |
| **Card surface** | `#1E293B` | Slate — panels, cards, overlays |
| **Accent** | `#22D3EE` | Electric cyan — highlights, CTAs, radar pulses |
| **Score high** | `#4ADE80` | Green — scores 80+ |
| **Score medium** | `#22D3EE` | Cyan — scores 60-79 |
| **Score low** | `#FBBF24` | Amber — scores < 60 |
| **Data font** | JetBrains Mono | Scores, coordinates, metrics |
| **Body font** | Inter | Titles, descriptions, body text |

### Visual Aesthetic

- **Dark command-center / radar theme** — not generic dark mode. Think military radar UI, satellite command center.
- Deep navy background with electric cyan accent lines and pulses.
- Slate card surfaces with subtle borders.
- Score badges are color-coded green/cyan/amber.
- Map views use dark vector basemaps (not bright Google Maps style).

## Testing the Live WildSpotter App

> **IMPORTANT:** The design mockups in `../design/` do NOT reflect the exact current state of the application. The mockups are aspirational references, not screenshots of the live app.

To see the **real, current state** of the WildSpotter app:

1. The Expo dev server is typically running at `http://localhost:8081` (Expo Web)
2. **Use Chrome browser automation** to interact with the live app:
   - Navigate to the Expo Web URL in Chrome
   - Take **screenshots** of real screens for use in videos and marketing materials
   - Record **GIFs/screen captures** of actual user flows (scanning, viewing spots, etc.)
   - Browse through all tabs: Map, Spots, Legal, Config
3. For the most authentic marketing material, **always capture from the live app** rather than relying on static mockups

### Why This Matters

Marketing videos and content should showcase what the app **actually looks like and does**, not idealized mockups. Use the browser to:
- Capture the real map scanning experience
- Show actual spot results with real scores
- Demonstrate the spot detail view with real data
- Record smooth transitions and interactions

## Project Structure

```
marketing-path/
├── src/
│   ├── Root.tsx              # Remotion entry — registers all 28 composition variants
│   ├── components/
│   │   ├── StoreInstallIntro.tsx  # Reusable "app store install" intro (3.5s)
│   │   └── GenericHook.tsx        # Reusable text-over-video hook scene
│   ├── scenes/               # ParkingLleno scene files
│   ├── scenes-87/            # OchentaYSiete scene files
│   ├── ParkingLleno.tsx      # Concepto A — accepts hookVariant + withIntro props
│   ├── Natura2000Clip.tsx     # Micro-clip educativo — accepts props
│   ├── LaMulta.tsx           # Concepto C — accepts props
│   ├── OchentaYSiete.tsx     # Concepto B — accepts props
│   ├── ElPipeline.tsx        # Concepto D — accepts props
│   ├── index.ts              # Bundle entry
│   └── index.css             # Global styles (Tailwind)
├── scripts/
│   └── render-all-variants.sh  # Batch render all 28 variants
├── public/                   # Static assets (images, audio, fonts)
├── remotion.config.ts        # Remotion + Tailwind config
├── .claude/skills/           # Remotion-specific skills
├── .agents/skills/           # 35 marketing strategy skills (SEO, ads, copy, etc.)
└── package.json
```

## Marketing Skills Available

This project has **35 pre-loaded marketing skills** in `.agents/skills/` covering:

- **Content:** `content-strategy`, `copywriting`, `copy-editing`, `social-content`
- **Growth:** `launch-strategy`, `referral-program`, `lead-magnets`, `free-tool-strategy`
- **Ads:** `paid-ads`, `ad-creative`, `ab-test-setup`
- **SEO:** `ai-seo`, `seo-audit`, `programmatic-seo`, `schema-markup`, `site-architecture`
- **CRO:** `page-cro`, `form-cro`, `signup-flow-cro`, `onboarding-cro`, `popup-cro`, `paywall-upgrade-cro`
- **Email:** `email-sequence`, `cold-email`
- **Strategy:** `pricing-strategy`, `churn-prevention`, `competitor-alternatives`, `marketing-ideas`, `marketing-psychology`, `customer-research`, `product-marketing-context`
- **Sales:** `sales-enablement`, `revops`
- **Analytics:** `analytics-tracking`
- **Video:** `remotion-best-practices` (with 30+ Remotion rules)

Load the relevant skill before starting any marketing task.

## Produced Videos

Each video has **hook variants** (different first 3 seconds) and optional **store intro** (3.5s app install simulation). All registered in `Root.tsx` via props — no file duplication.

| File | Base ID | Variants | Base Duration | With Intro |
|------|---------|----------|---------------|------------|
| `src/ParkingLleno.tsx` | `ParkingLleno` | A1, A2, A3 | 26.8s (805f) | 30.3s (910f) |
| `src/Natura2000Clip.tsx` | `Natura2000Clip` | N1, N2 | 16.1s (482f) | 19.6s (587f) |
| `src/LaMulta.tsx` | `LaMulta` | C1, C2, C3 | 25.5s (766f) | 29.0s (871f) |
| `src/OchentaYSiete.tsx` | `OchentaYSiete` | B1, B2, B3 | 30.0s (900f) | 33.5s (1005f) |
| `src/ElPipeline.tsx` | `ElPipeline` | D1, D2, D3 | 27.9s (836f) | 31.4s (941f) |

**Total: 28 renderable compositions** (14 hooks × with/without intro).

Render commands:
```bash
# Individual
npx remotion render ParkingLleno out/parking-lleno.mp4
npx remotion render ParkingLleno-A2 out/parking-lleno-a2.mp4
npx remotion render LaMulta-C2-Intro out/la-multa-c2-intro.mp4

# All hook variants (14 videos)
./scripts/render-all-variants.sh --hooks-only

# All 28 variants
./scripts/render-all-variants.sh
```

---

## Video Production Guidelines (learned in production)

These rules come directly from feedback during the production of "El Parking Lleno". Apply them to all future videos.

### FOUNDATIONAL RULE: Continuous video backgrounds — no flat solid frames

**Every frame must have motion.** A video with real footage backgrounds mixed with flat solid-color text slides feels like a PowerPoint, not a professional ad. This is the single most impactful quality lever.

- **Every scene gets a video background**, even text-heavy or UI-focused scenes. Vary the dimming (15-75% overlay opacity), but never show a static frame.
- Text-focused scenes use heavily dimmed footage (opacity 0.15-0.25) — just enough to add life and texture without distracting from the text.
- UI/app demo scenes use subtle footage (opacity 0.10-0.20) behind the phone frame.
- Data visualization scenes (pipeline cards, checklists) can use the most subtle footage (opacity 0.10-0.15) or a slow-moving abstract bg.
- **All transitions should be fades** (16-20f duration). Slide and wipe transitions feel like PowerPoint. Cross-dissolving footage into footage feels cinematic.
- The narrative arc should flow through the footage: problem footage (crowded, stressful) → transition footage (nature, hope) → solution footage (peaceful van in nature).
- Use `<Video>` from `@remotion/media` with `muted`, `loop` (for short clips), and `style={{ objectFit: "cover" }}`.
- Apply slow Ken Burns zoom (`interpolate(frame, [0, duration], [1.0, 1.08-1.12])`) on all video backgrounds for cinematic feel.

### Video footage inventory (`public/videos/`)

| File | Duration | Resolution | Content | Source |
|------|----------|------------|---------|--------|
| `crowded_parking_aerial.mp4` | 23.9s | 1080p | Aerial of packed parking lot | Pexels |
| `drone_mountains.mp4` | 10s | 4K | Mountain landscape at dawn | Pexels |
| `road_trip_sunset.mp4` | 33.5s | 4K | Driving scenic road at sunset | Pexels |
| `van_in_spot_calm.mp4` | 9.5s | 4K | Van parked in calm wooded spot | Pexels |
| `van_in_spot_calm_couple_dog_night.mp4` | 11.6s | 1080p | Couple + dog at van, night/string lights | Pexels |
| `drone_forest.mp4` | 25.7s | 1080p | Aerial lush forest | Pexels |
| `police_car.mp4` | 46.3s | 1080p | Police car footage | Pexels |
| `police_writing_ticket.mp4` | 13.3s | 4K | Police writing a ticket | Pexels |
| `rv_mountain_road.mp4` | 16s | 720p | RV on mountain road | Pexels |
| `rvs_parked_outdoors.mp4` | 14.2s | 1080p | RVs parked in nature | Pexels |
| `coffee_camping.mp4` | 24s | 1080p | Pouring coffee, mountain camping | Pexels |
| `Aerial_Spanish_Mediterranean_coast.mp4` | 59.8s | 1080p | Aerial Mediterranean coastline | Pexels |
| `ai_Spanish_Beach_VW_Van_Golden_Hour.mp4` | 8s | 720p | VW van on Spanish beach, golden hour | Veo AI |
| `ai_Spanish_Countryside_Van_Video.mp4` | 8s | 720p | Van driving through Spanish countryside | Veo AI |
| `ai_Campervan_Sunset_Time_Lapse_Video.mp4` | 8s | 720p | Campervan sunset time-lapse | Veo AI |
| `ai_Van_trying_to_park_full_parking.mp4` | 8s | 720p | Aerial: VW vans packed in coastal clearing, golden hour | Veo AI |

### AI-generated footage (Veo) — watermark handling

AI-generated clips (prefixed `ai_`) have a **"VEO" watermark in the bottom-right corner**. To hide it in compositions:
- Position the video with `objectPosition` to crop the bottom-right, OR
- Place a dark gradient vignette over the bottom-right corner, OR
- Use `objectFit: "cover"` with slight scale-up (`transform: scale(1.08)`) so the watermark falls outside the visible frame
- The watermark is small — a bottom gradient overlay for text readability often hides it naturally

### Video footage source strategy

**Priority order for footage:**
1. **Pexels free stock video** — best for generic vanlife/nature/driving scenes. All free, no attribution needed. Search at pexels.com/search/videos/
2. **AI video generators** (Runway Gen-3, Kling, Sora) — best for specific shots impossible to find in stock: "van driving down dirt track toward coastal clearing at golden hour", "drone pullback from parked van revealing panoramic view", "first-person POV arriving at perfect wild camping spot". These create custom footage matching exact creative briefs.
3. **Screen captures from live app** — for authentic app demo scenes (scan, spot detail, map interactions). Use Chrome browser automation against localhost:8081.
4. **Real CARTO map tiles** — for map-background scenes inside phone frames.

### Per-video footage map

#### ParkingLleno (✅ DONE)
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Hook | `ai_Van_trying_to_park_full_parking.mp4` | 35% | Hero — vanlife overcrowding |
| S2 Stars | `ai_Van_trying_to_park_full_parking.mp4` (continued) | 75% | Same footage, darker, tighter zoom |
| S3 Question | `drone_mountains.mp4` | 55% | Pivot — nature emerging |
| S4 Scan | `road_trip_sunset.mp4` | 85% | Subtle warmth behind phone |
| S5 CTA | `van_in_spot_calm.mp4` | 40% | Payoff — the dream |

#### Natura2000Clip (✅ DONE)
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Map | `Aerial_Spanish_Mediterranean_coast.mp4` | Full — 25% dark overlay | Beautiful nature establishing shot |
| S2 Natura overlay | `Aerial_Spanish_Mediterranean_coast.mp4` (continued) | 75% | Same footage darker, red zone focus |
| S3 Warning | `police_car.mp4` | 82% | Fear — "Estás en una zona protegida." |
| S4 Logo | `van_in_spot_calm.mp4` (loop) | 80% | Subtle payoff |

#### LaMulta (✅ DONE)
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Hook "600€" | `police_car.mp4` | 75% | Fear through footage |
| S2 Zones map | `drone_forest.mp4` | 85% | Behind the official Natura 2000 map |
| S3 Question | `police_writing_ticket.mp4` | 85% | Authority atmosphere |
| S4 Checklist | `Aerial_Spanish_Mediterranean_coast.mp4` | 90% | Subtle — legal cards are the focus |
| S5 CTA | `van_in_spot_calm_couple_dog_night.mp4` (loop) | 78% | Warm human payoff |

#### OchentaYSiete (✅ DONE)
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Map counter | None — dark map image is the visual | N/A | Map + animated dots provide the motion |
| S2 Qualities | `drone_mountains.mp4` | 80% | Scenic backdrop for "con vistas al mar" |
| S3 Reveal | `road_trip_sunset.mp4` | 82% | Moody vanishing-point road |
| S4 Demo | `rv_mountain_road.mp4` | 85% | Subtle driving behind phone frame |
| S5 Pipeline | `coffee_camping.mp4` | 90% | Minimal — pipeline cards are the focus |
| S6 Choice (top/bottom) | TOP: `ai_Van_trying_to_park_full_parking.mp4`, BOTTOM: `van_in_spot_calm.mp4` | 45%/55% | Landscape footage fills full width |

### AI video generation — when to use

AI video generators (Runway Gen-3 Alpha, Kling 1.6, Sora) are best for shots that are:
- **Too specific for stock** — "VW van driving down a narrow dirt track toward a hidden coastal clearing at golden hour, drone following from behind"
- **Vanlife-niche** — Stock footage of generic nature is abundant, but a specific "one van parked alone at the end of a dead-end track with ocean view" is nearly impossible to find
- **CTA/hero shots** — The final payoff scene of each video benefits most from a perfect, on-brand shot
- **Transition clips** — 2-3 second connective tissue between scenes (a drone ascending over treetops, waves hitting rocks at sunset)

**Best candidates for AI generation across all videos:**
1. Drone pullback from a parked van revealing a stunning Spanish coastline panorama (OchentaYSiete S6, shared)
2. Van driving down a winding dirt road through Spanish countryside at golden hour (shared B-roll)
3. First-person POV arriving at a wild camping spot — headlights illuminating a clearing (LaMulta S5 or ParkingLleno alternative)
4. Time-lapse of sunset behind a van with string lights turning on (CTA/brand footage)

### Assets — Always use real images over SVG approximations
- **Use real PNG images** for any recognizable object (vans, vehicles, logos). SVG hand-drawn approximations never look as good.
- If an asset exists as a file (logo, photo, cutout), copy it to `public/images/` and use `<Img src={staticFile("images/file.png")} />`.
- The **app logo** is at `design/app-logo-1024.png` (copy to `public/images/app-logo.png`). Never approximate it in SVG.
- Van/vehicle images: `public/images/van1.png` (blue VW Kombi) and `public/images/van2.png` (white VW Kombi). Both are RGBA PNG with transparent backgrounds.
- For map backgrounds, use **real CARTO Voyager tiles** stitched with Python/Pillow — same tiles the app uses. See `public/images/map-cabo-de-gata.jpg` as reference. Tile URL: `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`

### Typography — Go bigger than you think
- Minimum font sizes for 1080×1920 video: **72px** for main statements, **48px** for secondary text, **28px** for metadata/labels.
- Text that needs to be read in under 2 seconds should be 80px+.
- Always use `letterSpacing: -1` or `-2` on large Inter bold text — it looks tighter and more intentional.
- Add `textShadow` on any text over a scene with background imagery.

### Scene duration — Give text time to breathe
- Minimum scene duration per amount of text: 1 text block = 3s minimum, 2 blocks = 4.5s minimum, 3+ blocks = 6s+.
- The CTA scene (last scene) needs at least 6s — viewers need time to decide to act.
- Current production durations: Hook=130f, Stars=140f, Question=165f, Scan=200f, CTA=195f.

### Van / vehicle perspective
- With real video footage, vans appear naturally. No need to manually position PNG van images when footage handles it.
- For scenes that still use van PNG overlays (split-screen comparisons), side-view at ground level is preferred.
- **Prefer real footage over animated PNGs** — a 4-second clip of a real van in nature is worth more than any amount of spring-animated van PNGs.

### App UI scenes (Scene4 / scan demo)
- The app UI mock must visually match the **real app** — same color tokens, same map style, same component proportions.
- Use the CARTO Voyager map image as the background for the phone frame. Do not draw fake roads in SVG.
- Warm earthy palette is for the *marketing video*, not the app UI inside the phone frame. The phone frame interior should use the app's actual tokens (`#1A1614` bg, amber accents).

### Competitor references
- **Never mention Park4night, iOverlander, or any competitor by name** in the video. Use "Otras apps" instead.
- In post copy (hashtags), #park4night is fine — it captures frustrated users searching that term.

### Map geography — Verify pin and overlay positions against actual map
- When generating CARTO map tiles, **always check the resulting image** to verify land/sea distribution before placing pins or overlays.
- Center coordinates for tile stitching must place **land in the center** of the frame, not sea. Delta del Ebro: use `lat=40.72, lon=0.70` (Deltebre area), NOT `lon=0.87` which lands in the Mediterranean.
- SVG overlay polygons (legal zones, Natura 2000) must be shaped to cover **land areas only**. Cross-reference the polygon bounds with the visible map features (coastline, rivers, towns).
- Pin position (`top`/`left` percentages) must correspond to a land feature visible in the map image. Always verify by reading the image file before rendering.

### Audio — Verify all audio files before using
- Audio files in `public/audio/` may be corrupt (HTML error pages from failed downloads). **Always check with `file` command** before using in a composition.
- Valid MP3: `Audio file with ID3...` or `MPEG ADTS, layer III`. Invalid: `HTML document text`.
- Royalty-free music sources: [Mixkit](https://mixkit.co/free-stock-music/) (direct MP3 links at `https://assets.mixkit.co/music/{id}/{id}.mp3`), Pixabay (requires browser download).
- Each video should have its **own distinct music track** — don't reuse the same background music across videos. Different moods need different tracks.
- Current audio inventory: `background.mp3` (cinematic — ParkingLleno A1), `tension.mp3` (suspense piano — Natura2000 N1), `suspense.mp3` (documentary — LaMulta C1), `epic-drums.mp3` (OchentaYSiete B1), `sci-fi-score.mp3` (futuristic tech — ElPipeline D1), `the-journey.mp3` (reflective — ParkingLleno A2/A3), `echoes.mp3` (dark ambient — LaMulta C2/C3), `spirit-in-the-woods.mp3` (atmospheric — OchentaYSiete B2/B3), `digital-clouds.mp3` (ambient — Natura2000 N2), `voxscape.mp3` (electronic — ElPipeline D2/D3), `radar-ping.mp3` (SFX), `score-reveal.mp3` (SFX), `whoosh.mp3` (SFX).

### Scene duration — Err on the side of longer
- Initial instinct is to make scenes too short. **Always add 30-50% more frames** than feels necessary on first pass.
- For a 15s educational micro-clip: 4 scenes of ~4s each works well. Don't try to cram 4 scenes into 10s.
- Text-heavy scenes (2+ text blocks with different timings) need minimum 3.7s even for short copy.

### Color palette — This video series uses warm earthy tones
- Background: `#0F0D0B` or `#1A1614` (near-black warm brown — NOT the app's navy `#0A0F1C`)
- Accent: `#D97706` (amber) — used for highlights, CTAs, score rings
- Text: `#FFFFFF` primary, `#A0836C` muted/secondary
- The app's cyan (`#22D3EE`) is for the app UI only, not the marketing video chrome.
- The logo box uses the **real logo colors** (orange gradient matching `app-logo-1024.png`), not the video's amber.

### Official data imagery — Use real government sources, not approximations
- When showing legal/geographic data (Natura 2000, protected zones), **use the actual official map images** from government sources (MITECO, IGN). Never approximate with SVG blobs or fake colored dots.
- Official maps need visual treatment to blend with the dark aesthetic: apply CSS `filter: saturate(0.55) brightness(0.7) contrast(1.25)` plus a color tint overlay (`mixBlendMode: "multiply"`) and radial/linear gradient vignettes.
- Scale official images **large** (200%+ width) and crop into the dense center. Viewers don't need to see the full outline — the density of data is the message.
- Always verify map images show **land, not sea** at pin/overlay positions before rendering.

### SFX — Less is more for serious content
- Game-y, UI-style sound effects (pings, dings, whooshes) sound cheap in educational/fear-angle videos. They remind viewers of Mario Bros, not a serious documentary.
- For serious/educational videos: **use music only, no SFX**. The suspense music track carries the emotional weight.
- SFX work better in playful/ironic videos (Concepto A) than in fear/authority videos (Concepto C).
- If in doubt, start without SFX and add them only if the video feels flat.

### Narrative coherence — Every scene must connect to the previous one
- Text like "¿Sabías que estabas dentro?" fails if the viewer doesn't know what "dentro" refers to. Each scene must either explicitly reference the previous context or be self-contained.
- When rewriting copy, ask: "If someone watched only this scene, would they understand the message?" If not, add context.
- Example fix: "¿Sabías que estás dentro?" → "Estás en una zona protegida." — self-contained, no dangling reference.

### Use REAL product data, not invented values
- When showing app output (AI scores, metrics, sub-scores, labels), **always cross-reference the actual worker code** in the parent project before writing numbers on screen. Inventing plausible-sounding fields undermines credibility for the tech-savvy audience.
- WildSpotter AI sub-scores live in `workers/ai_vision_labeler.py` — the real keys are `surface_quality`, `vehicle_access`, `open_space`, `van_presence`, `obstruction_absence` (each 0-10, weighted into final `ai_score`). The vision model is Claude Haiku 4.5; the satellite tile source is IGN PNOA at 25cm/px.
- Context sub-scores live in `workers/context_scoring.py` and are documented in `SPEC_V2.md` §2.6. Use those exact labels (road_noise, urban_density, scenic_value, privacy, industrial, railway, van_community, drinking_water, dog_friendly).
- Pipeline statuses: `pending → terrain_done → legal_done → ai_done → context_done → amenities_done → completed`.
- **Translate labels to Spanish** for the on-screen display (audience is Spanish vanlifers) — keep the raw English keys only when the scene is explicitly showing "raw data / JSON / API" framing.

### Footage variety across concepts — don't reuse the same clips
- Each video should have a **distinct footage palette** from the other concepts. Reusing the same 5-6 "greatest hits" clips (drone_mountains, drone_forest, van_in_spot_calm, coffee_camping) across every video makes the series feel like one long ad.
- Before picking footage for a new concept, check the "Per-video footage map" tables above and **prioritize clips not yet used** — especially the underused AI-generated clips (`ai_Spanish_Beach_VW_Van_Golden_Hour`, `ai_Spanish_Countryside_Van_Video`, `ai_Campervan_Sunset_Time_Lapse_Video`) and `rvs_parked_outdoors`.
- Thematic match still beats novelty — don't force a wrong clip just for variety. But if two clips both fit, always pick the less-used one.

### Each video needs its own music track
- Reusing the same background music across videos makes them blur together in the feed. **Every concept gets its own distinct track.**
- **Mixkit direct download pattern:** `curl -sL -o public/audio/music/name.mp3 https://assets.mixkit.co/music/{ID}/{ID}.mp3`. Verify with `file name.mp3` — must be `MPEG ADTS, layer III`, not HTML.
- Get track IDs from Mixkit category pages via WebFetch (e.g. `mixkit.co/free-stock-music/tag/electronic/`) — don't guess IDs.
- Current music inventory: `background.mp3` (cinematic — ParkingLleno A1), `tension.mp3` (suspense piano — Natura2000 N1), `suspense.mp3` (documentary — LaMulta C1), `epic-drums.mp3` (OchentaYSiete B1), `sci-fi-score.mp3` (Mixkit 464, futuristic tech — ElPipeline D1), `the-journey.mp3` (Mixkit 79, reflective — ParkingLleno A2/A3), `echoes.mp3` (Mixkit 188, dark ambient — LaMulta C2/C3), `spirit-in-the-woods.mp3` (Mixkit 139, atmospheric — OchentaYSiete B2/B3), `digital-clouds.mp3` (Mixkit 175, ambient — Natura2000 N2), `voxscape.mp3` (Mixkit 571, electronic — ElPipeline D2/D3).

### Footage must match the product context, not just the emotion
- A generic city parking lot aerial reads as "parking app" — viewers think "Parkopedia" not "vanlife overcrowding."
- For "crowded spot" scenes, use footage of **campervans/VW vans packed in a natural setting** (coastal clearing, dirt lot, forest), not urban parking lots.
- AI video generation (Veo) excels here — "aerial of VW vans packed in a coastal clearing at golden hour" is too specific for stock libraries but trivial for AI.
- The `ai_Van_trying_to_park_full_parking.mp4` clip solved this across ParkingLleno and OchentaYSiete.

### Map scenes don't need video backgrounds
- When a scene's visual IS the map (animated counter + appearing dots + geography), adding a video background behind it creates visual confusion — two competing layers.
- The dark map with animated elements provides its own motion. Let it breathe.

### Legal check cards — App-style UI pattern
- The 4-card legal checklist (Natura 2000, Parque Nacional, Ley de Costas, Catastro) is a strong visual pattern. Each card has a color-coded dot, label, status text, and a ⚠/✓ icon.
- Use staggered spring animations with ~18f delay between cards for a satisfying cascade.
- Color coding: red=Natura 2000, amber=Parque Nacional, blue=Ley de Costas, green=Catastro.

### Avoid redundant elements
- If a big number is the hero element (e.g., "87"), don't also add an animated counter badge. One or the other — not both. The hero number itself can animate (0→87) for engagement.

### Icons in video — skip emoji and standard icon sets
- Emoji icons and generic icon sets (Lucide, FontAwesome) look unprofessional in video. They feel like placeholder UI, not polished marketing.
- **Colored vertical bar accents** (4px wide, stage color) next to text items look much cleaner than any icon for list-style scenes.
- If icons are necessary, use custom-designed ones that match the video's aesthetic.

### Text reveals — full sentences over staggered words
- Staggered word-by-word reveals are confusing — the viewer tries to read ahead and can't. Show the **full sentence at once** with key phrases highlighted inline (e.g., amber color on "ninguna app").
- Exception: counter animations (0→87) work because there's no sentence to pre-read.

### Pipeline / list cards — less is more
- For pipeline stage cards (Radar, Terreno, Legal, etc.), **just the label + a progress bar + checkmark** is enough. Sublabels/descriptions make it feel cramped and unreadable at video speed.
- Large card font (42px+), staggered slide-in from right, progress bars filling sequentially.

### Reading time — always verify last-appearing text
- If text appears late in a scene (delay > 60% of scene duration), **check that there are at least 2.5 seconds** between its appearance and the scene end. Viewers need time to read.
- Formula: `(sceneDuration - textDelay) / fps >= 2.5s`. If not, either move the text earlier or extend the scene.

### Van grid positioning (legacy — for scenes still using van PNGs)
- If a scene still uses van PNG overlays, use direct pixel coordinates (`left: 30, top: 550, width: 140`).
- **Prefer replacing van PNG grids with real video footage** — `crowded_parking_aerial.mp4` replaces any "crowded parking" scene instantly.

### Split-screen scenes — top/bottom for landscape footage
- When using landscape (16:9) footage, use **top/bottom split** instead of left/right. Landscape video crammed into narrow vertical strips wastes most of the frame.
- Top/bottom layout: each half gets the full 1080px width, showing much more of the footage.
- The horizontal divider should be a thin glowing line (3px, amber gradient) with `zIndex: 10`.
- "Elige." or any comparison text sits centered at the divider line with high `zIndex`.
- Each half needs its own vignettes (top + bottom gradients) and labels.
- **Best with real footage:** TOP half plays crowded vanlife footage, BOTTOM half plays calm solo van footage. The vertical contrast (problem above, solution below) reads naturally.

---

## Commands

```bash
npm run dev                   # Open Remotion Studio (preview videos)
npx remotion render           # Render video to file
npx remotion render MyComp    # Render specific composition
npx remotion upgrade          # Upgrade Remotion version
npm run lint                  # ESLint + TypeScript check
```

## Coding Practices

- TypeScript strict mode
- Functional React components only
- Use Tailwind v4 utility classes for styling within Remotion compositions
- Register all compositions in `src/Root.tsx`
- Keep compositions modular — one file per video/scene
- Use `useCurrentFrame()` and `interpolate()` for animations
- Load the `remotion-best-practices` skill before writing any Remotion code

## Content Guidelines

When creating marketing content for WildSpotter:

- **Tone:** Adventurous, bold, tech-savvy. Speak to independent travelers who hate tourist traps.
- **Never promise** spots are "legal" or "safe" — the app provides data, not guarantees.
- **Emphasize discovery** — "Find spots no one has shared" is the core message.
- **Show the pipeline** — The radar/scanner metaphor is powerful for demos.
- **Spain focus** — All content targets Spain coverage for MVP.
- **Video-first:** Every marketing video must use real video footage (stock, AI-generated, or captured). Pure motion-graphics-only videos look like AI-generated explainers and won't perform on social. The combination of real footage + animated text overlays + app UI demos is the production level we target.
- **Emotional footage arc:** Problem (stressful/crowded footage) → Pivot (nature/question) → Solution (app demo) → Payoff (peaceful van in nature). This arc should be visible in the footage choices even before reading the text.
- **Curate stock footage carefully** — generic golden-sunset-beach clips are fine as B-roll, but hero scenes need footage that matches the specific narrative (packed parking lot, police encounter, van alone in wilderness). Use AI video generation for shots too specific for stock libraries.
