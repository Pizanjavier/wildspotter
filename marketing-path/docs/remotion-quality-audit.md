# Remotion Quality Audit — WildSpotter Marketing Videos

**Date:** 2026-05-14
**Auditor:** remotion-producer agent
**Scope:** All .tsx video compositions in `src/`

---

## Executive Summary

Four systemic problems confirmed across the composition library:

1. **Text timing too short** — Multiple scenes run at 3.3–4.3s (90–130f) but pack 2–3 text blocks with staggered delays, leaving the last block visible for under 2s.
2. **Layout overlaps / safe zone violations** — `ElProblema`, `OchoTresMil`, and `ElPeorMomento` CTA scenes stack the logo + brand name + divider + engagement question + CTA pill within the bottom 850px of screen, overlapping the TikTok/Reels UI safe area (last 450px). The engagement question at `bottom: 850` and the logo at `bottom: 640` are within 210px of each other with multiple elements stacked between — guaranteed collision.
3. **Footage over-reuse** — `van_in_spot_calm.mp4`, `drone_forest.mp4`, `Aerial_Spanish_Mediterranean_coast.mp4`, `road_trip_sunset.mp4`, `rv_mountain_road.mp4`, `ai_Spanish_Countryside_Van_Video.mp4`, and `ai_Van_trying_to_park_full_parking.mp4` each appear in 3–5 different compositions. Meanwhile 20+ clips in `public/videos/` are unused or barely used.
4. **Music monotony** — `spirit-in-the-woods.mp3` assigned to OchentaYSiete B2/B3 AND LasCoordenadas E1/E2/E3 (5 variants). `data-reveal.mp3` shared between UnNoventa and OchoTresMil. `golden-fields.mp3` used for TuPerroLoSabe P1/P2 AND IOSLaunch AND ElPrimerCafe PC3 (4 variants).

---

## Video-by-Video Issues Table

| Video | Timing Issues | Layout/Overlap | Footage Reuse | Music Issue |
|-------|--------------|----------------|---------------|-------------|
| **ParkingLleno** | Scene1 = 130f (4.3s) — OK. Scene2 = 155f — OK. Scene3 = 175f — OK. Scene4 = 220f — OK. Scene5 = 195f — OK. | No overlaps detected. Safe zone respected. | `ai_Van_trying_to_park_full_parking.mp4` also in ElProblema S1. `van_in_spot_calm.mp4` also in LasCoordenadas E1. | OK — unique tracks. |
| **Natura2000Clip** | 482 frames total. 4 scenes. Each ~4s. OK. | No overlaps. | `Aerial_Spanish_Mediterranean_coast.mp4` also in LaMulta S4, ElPipeline TERRENO. `drone_forest.mp4` also in LaMulta S2, MientrasTodosBuscan. | OK. |
| **LaMulta** | Scene3 = 130f (4.3s) with 2 staggered text blocks (delay 5 + 35). Last text appears frame 35, scene ends frame 130 — only 3.2s to read. **BORDERLINE.** Scene4 = 180f with 4 legal cards staggered 22f apart — last card visible from ~f78, scene has 102f left = 3.4s. OK. | CTA scene (230f): `top: 52%` logo + `top: 66%` brand name + `top: 73%` divider + `top: 76%` tagline. At 1920px height, top 52% = 998px, top 76% = 1459px. Tagline at 1459px is within safe zone bottom (1920-450=1470). Very tight — tagline may be cut by captions UI. | `Aerial_Spanish_Mediterranean_coast.mp4` in S4. `drone_forest.mp4` in S2. `police_car.mp4` in S1. | OK — suspense/echoes. |
| **OchentaYSiete** | Scene3 (Reveal) = 130f (4.3s). Has big "87" counter. Only 1 text element after scene transition — OK. Scene2 = 150f — OK. | No overlaps found. | `drone_mountains.mp4` also in ParkingLleno S3. `road_trip_sunset.mp4` also in ElPipeline D1 hook, ElProblema via `crowded_parking_aerial.mp4`. `rv_mountain_road.mp4` also in NoLoBusque NB2, Scene4Scan. | `spirit-in-the-woods` shared with LasCoordenadas E1/E2/E3. **MUSIC REUSE.** |
| **ElPipeline** | RADAR scene = 110f (3.7s). Viz + stage label = OK (just 2 elements). TERRENO scene = 110f — slope chart animates over ~50f, leaving 60f (2s) visible. **SHORT.** LEGAL scene = 110f. CONTEXTO = 110f — 4 bar charts animate staggered, last bar starts frame 28, readable for ~82f (2.7s). **BORDERLINE.** | PipelineChrome shows progress bar at `bottom: 110` and dots at `bottom: 60`. In stage scenes with content at `top: 50%` (frame), progress dots overlap with the viz container on smaller elements. **Minor overlap risk on TERRENO.** | `road_trip_sunset.mp4` (D1 hook), `rvs_parked_outdoors.mp4` (SATÉLITE), `Aerial_Spanish_Mediterranean_coast.mp4` (TERRENO), `ai_Spanish_Countryside_Van_Video.mp4` (RADAR + D3 hook). All over-used clips. | `sci-fi-score.mp3` also in DatoHero H1/H2/H3 and OjoSatelite I1/I2. **3x usage.** |
| **ElPrimerCafe** | 450 frames (15s). Text 1 ("6:47") visible frames 30–140 = 3.7s. OK. Text 2 visible frames 150–235 = 2.8s. **BORDERLINE** (3-line text block at 64px). Text 3 visible frames 280–370 = 3s. OK. CTA logoIn at f375, ctaIn at f405. Only 45f (1.5s) for CTA label after logo. **TOO SHORT.** | CTA at `bottom: 380` for logo block, `bottom: 280` for LINK IN BIO label. At 1920px, `bottom: 280` = 1640px absolute which is inside safe zone top of the bottom (1470px). Appears OK but very tight. | `couple-inside-van-with-lake-outside.mp4` used in both PC1 and PC2. PC1/PC2 use same footage B. **Same clip in 2 variants.** | `the-journey` shared with ParkingLleno A2/A3. |
| **TuPerroLoSabe** | 540 frames (18s). Text3 visible frames 360–490 = 4.3s — 3-line text at 60px. OK. CTA visible frames 505–end = only 1.2s (35f). **CTA TOO SHORT.** | `top: 340` for "Tu perro lo sabe" + `bottom: 370` for logo block. At 1920px, bottom 370 = 1550px. "Tu perro lo sabe" at top 340 — separation: 1550 - 340 = 1210px. These two blocks should not overlap. OK, but CTA elements are compressed. | Dog beach clips are varied between P1/P2. Night footage `van_in_spot_calm_couple_dog_night.mp4` also in LaMulta S5. | `golden-fields` also in IOSLaunch and ElPrimerCafe PC3. **3x usage.** |
| **NoLoBusque** | 540 frames (18s). Text1 visible f20–140 = 4s. OK. Text2 visible f145–250 = 3.5s. OK. Text3 ("No lo busqué.") visible f270–370 = 3.3s. OK. Text4 ("Lo calculé.") visible f375–450 = 2.5s. **BORDERLINE** (hero statement). CTA logoIn f455, ctaIn f485. Only 55 frames (1.8s) for "LINK IN BIO" label. **CTA TOO SHORT.** | Texts 3 and 4 share same position (`bottom: 480`/`bottom: 480`) — they take turns via opacity. OK. Logo at `bottom: 380`, "LINK IN BIO" at `bottom: 280`. Right edge at 60px (no `paddingRight: 150`). **Missing right safe zone padding** — TikTok engagement icons will overlap text. | `ai_Spanish_Countryside_Van_Video.mp4` (NB1) also in ElPipeline RADAR. `rv_mountain_road.mp4` (NB2) also in Scene4Scan. `road_trip_sunset.mp4` (NB3) also used by ElPipeline D1/OchentaYSiete. Arrival footage `ai_Spanish_Beach_VW_Van_Golden_Hour.mp4` also in ElPipeline D3 hook + Payoff scene. | OK — open-road/rising-tide unique enough. |
| **MientrasTodosBuscan** | 600 frames (20s). 5 scenes. Each ~130f (4.3s). OK. CTA logos appear at f505, brand at f535. Only 65f (2.2s) of CTA visible. **CTA TOO SHORT.** | `top: 160` for LabelBar. `bottom: 450` for body text. At 1920px: labelBar at 160px (top, in status bar safe zone — 250px minimum). **LabelBar overlaps top safe zone.** Logo at `bottom: 340`, "LINK IN BIO" at bottom of flex column — similar to other videos, tight. | `rvs_parked_outdoors.mp4` also in LaMulta S3 area, ParkingLleno HookA3. `crowded_parking_aerial.mp4` also in ElProblema. `drone_forest.mp4` also in LaMulta, Natura2000Clip. | `rising-tide` shared with NoLoBusque NB3. Minor — different enough. |
| **UnNoventa** | S1 = 150f (5s) — OK. S2 = 195f (6.5s) — OK. S3 = 135f (4.5s) — 2 text blocks with delays 15 and 55. Last block appears at f55, scene ends f135 = 2.7s remaining. **BORDERLINE.** S4 = 180f (6s) — OK with staggered elements. | S3 uses `paddingRight: 180` — consistent safe zone. S4 uses `paddingRight: 160` — correct. CTA `gap: 32` stacks question + emoji + CTA pill + badge cleanly. OK. Emoji element (👇) in CTA is an emoji — minor quality issue per guidelines. | Ocean wave clips are relatively unique. `lonely_beach_with_lifeguard_chair_and_waves` also in ElProblema CTA. | `data-reveal.mp3` also in OchoTresMil. **Shared track.** |
| **ElProblema** | S1 = 130f (4.3s): title at f0, subtitle at f50–70. Subtitle visible only ~60f (2s). **TIMING ISSUE** — short read time for 2-line subtitle. S2 = 150f (5s): 3 lines staggered at 0, 38, 70. Last line (f70) leaves 80f (2.7s). **BORDERLINE.** S3 = 130f (4.3s): "WildSpotter no comparte" + "Calcula." Second line pops at f55, leaving 75f (2.5s). **BORDERLINE.** S4 CTA = 250f — stacks 83006 counter + 2 body lines + engagement question + logo + brand + divider + CTA pill. | **S4 CTA OVERLAP (CRITICAL):** Engagement question at `bottom: 850` (= 1070px from top). Logo at `bottom: 640` (= 1280px from top). Brand name at `bottom: 560` (= 1360px from top). Divider at `bottom: 530` (= 1390px from top). CTA pill at `bottom: 450` (= 1470px from top). TikTok safe zone bottom = 1920-450=1470px. **CTA pill sits exactly at the safe zone edge and will be cut off by the audio player UI.** Additionally, the engagement question at bottom 850 and the hero number block at top 280 leave only ~540px (1280-280-460px for text height). Very compressed. | `ai_Van_trying_to_park_full_parking.mp4` also in ParkingLleno S1/S2. `lonely_beach` also in UnNoventa. | `cyber-decrypt.mp3` — listed as "Unused" in footage-music-map but it IS used here. Inconsistency in map. **Track mood mismatch** — "cyber-decrypt" sounds like hacker/tech which violates warm earthy brand. |
| **OchoTresMil** | S1 = 160f (5.3s) — OK. S2 = 140f (4.7s): 3 StatCards stagger at delays 10, 32, 52. Last card appears at f52, scene ends f140 = 88f (2.9s) readable. OK. S3 = 150f: line2 appears at f45, leaving 105f (3.5s). OK. S4 CTA = 190f — same dense CTA pattern. | **S4 CTA OVERLAP (CRITICAL):** Same pattern as ElProblema — engagement question at `bottom: 490` (= 1430px), logo at `bottom: 270` (= 1650px), brand at `bottom: 190` (= 1730px), divider at `bottom: 160` (= 1760px), CTA pill at `bottom: 80` (= 1840px). CTA pill at 1840px is completely inside the TikTok audio UI area (last 450px = below 1470px). **The CTA pill, brand name, divider, and logo are ALL below the safe zone boundary.** This is a critical layout failure — these elements will be covered by Instagram/TikTok native UI. | `aerial_view_of_verdant_forest_canopy` (S1), `stunning_aerial_view_of_lush_green_forest` (S2), `serene_pine_forest` (S3), `aerial_view_of_scenic_forest_road` (S4). All new forest clips — good footage variety. | `data-reveal.mp3` also in UnNoventa. **Shared.** Volume set to 0.16 — very quiet. |
| **ElPeorMomento** | S2 = 170f (5.7s): 3 lines staggered 0, 38, 70. Line3 at f70 leaves 100f (3.3s). OK. S3 = 150f: "Eso no le pasa..." at f0, secondary line at f50 = 100f left (3.3s). OK. S4 CTA = 200f — same dense CTA pattern. | **S4 CTA OVERLAP (CRITICAL):** Same as OchoTresMil/ElProblema. Logo at `bottom: 640` (= 1280px), brand at `bottom: 560` (= 1360px), divider at `bottom: 530` (= 1390px), CTA pill at `bottom: 450` (= 1470px). **CTA pill is exactly at the safe zone limit.** Engagement question at `bottom: 850` = 1070px is separated from logo (1280px) by only 210px — with 40px font size for that text + some padding, this is VERY tight. | `view_of_the_horizon_at_dusk` (S1+S2), `tranquil_pine_forest` (S3 pivot), `couple-cofee-outside-caravan` (S4 CTA). Mostly unique clips. | `night-drive.mp3` — unique, good match. |
| **Debate** | 450f (15s). S1 = 0–160f (5.3s) — OK. S2 = 160–340f (6s) — 3 arg lines staggered, all visible. OK. S3 = 340–450f (3.7s) — engagement question with `whiteSpace: pre-line`. 3-line text at 68px. **3.7s for 3 lines at 68px = BORDERLINE.** | `safeZone` uses `left: 50, right: 150` — respects right safe zone. `paddingBottom: 450` — respects bottom safe zone. `paddingTop: 250` — respects top safe zone. Layout OK. | D1 uses `couple_sitting_in_van` — relatively unique. D2 uses `couple_in_the_morning_in_a_campervan` — unique. | `quiet-debate` and `data-truth` — unique tracks. OK. |
| **MayoMejorMes** | 540f (18s). S1 = 0–105f (3.5s). V1 hook = single word "Mayo." — OK at 140px. V2 hook = 2 lines at 80px, 3.5s. **BORDERLINE** (2 blocks in 3.5s). S2 = 105–330f (7.5s) — 3 staggered lines. Line 1 at f115, line 3 at f225. Each line has 55–115f of solo time. OK. S3 CTA = 330–540f (7s) — 3 staggered elements (radarOp, questionOp, pillOp). All have ample time. OK. | `safeZone` uses `left: 50, right: 150, paddingBottom: 450` — correct safe zones. CTA section stacks radar pitch (36px) + main text (68px) + engagement question (50px) + logo (80px) + "Gratis en iOS" (34px) + pill (30px) all within the safe zone. Tight but within bounds. | `stunning_cliffs_and_turquoise_sea` — unique. `stunning_aerial_views_of_rocky_kefalonia_coast` — also appears in PuenteDeMayo S3-S4 though that clip is different. Mostly OK. | `atlantic-swell` — unique per video. OK. |

---

## Critical Issues (Priority 1 — Fix Immediately)

### P1: CTA elements below TikTok/Reels safe zone boundary

**Affected files:** `ElProblema.tsx`, `OchoTresMil.tsx`, `ElPeorMomento.tsx`

The rule: bottom 450px is reserved for TikTok/Instagram audio UI. The "CTA pill" element in these three videos is positioned at `bottom: 80` (OchoTresMil), `bottom: 450` (ElPeorMomento), `bottom: 450` (ElProblema) — directly in or below the safe zone.

Fix: Move all CTA stack elements up by 200–280px minimum.

### P2: MientrasTodosBuscan LabelBar overlaps top safe zone

**File:** `MientrasTodosBuscan.tsx`, line 49 — `top: 160`

The rule: top 250px is reserved for system UI. The LabelBar at `top: 160` is 90px inside the forbidden zone. Fix: change to `top: 260`.

### P3: NoLoBusque missing right padding

**File:** `NoLoBusque.tsx` — text and CTA elements use `left: 60, right: 60`. Missing `right: 150` for the TikTok engagement icons column. The text at `right: 60` will be covered by the like/comment icons column (which is 150px wide from the right edge).

---

## High Issues (Priority 2 — Fix Soon)

### P4: ElProblema S1 subtitle read time too short

Subtitle appears at frame 50–70 in a 130-frame scene. Remaining time = 60f = 2s. For a 2-line, 52px text this is tight. Increase scene to 150f.

### P5: ElPipeline stage scenes too short

RADAR, TERRENO, LEGAL, CONTEXTO scenes are each 110f (3.7s). The progress bar + stage label + visualization all animate within the first ~50f, leaving 2s of read time. Minimum should be 140f (4.7s) per stage.

### P6: ElPrimerCafe CTA too short

`logoIn` starts at f375, `ctaIn` at f405 in a 450-frame video. Only 45 frames (1.5s) for the CTA label. Extend to 480 frames minimum.

### P7: TuPerroLoSabe CTA too short

`ctaOp` starts at f505 in a 540-frame video = only 35f (1.2s). Extend video to 580 frames.

### P8: NoLoBusque CTA too short

`logoIn` at f455, `ctaIn` at f485 in 540-frame video = 55f (1.8s) for "LINK IN BIO". Extend to 570 frames.

---

## Medium Issues (Priority 3 — Music & Footage Diversification)

### P9: Over-used footage clips

| Clip | Used in |
|------|---------|
| `van_in_spot_calm.mp4` | ParkingLleno S5, LasCoordenadas E1, Natura2000Clip S4 |
| `drone_forest.mp4` | LaMulta S2, Natura2000Clip, MientrasTodosBuscan S2, ElRadarDetecto RD1 |
| `Aerial_Spanish_Mediterranean_coast.mp4` | LaMulta S4, Natura2000Clip S1-S2, ElPipeline TERRENO |
| `road_trip_sunset.mp4` | ElPipeline D1 hook, OchentaYSiete S3, NoLoBusque NB3 |
| `rv_mountain_road.mp4` | OchentaYSiete S4, NoLoBusque NB2, Scene4Scan |
| `ai_Spanish_Countryside_Van_Video.mp4` | ElPipeline RADAR, OchentaYSiete B3 hook, NoLoBusque NB1 |
| `ai_Van_trying_to_park_full_parking.mp4` | ParkingLleno S1-S2, ElProblema S1-S2 |

### P10: Shared music tracks

| Track | Assigned to |
|-------|-------------|
| `spirit-in-the-woods.mp3` | OchentaYSiete B2/B3 + LasCoordenadas E1/E2/E3 |
| `data-reveal.mp3` | UnNoventa + OchoTresMil |
| `golden-fields.mp3` | TuPerroLoSabe P1/P2 + ElPrimerCafe PC3 + IOSLaunch |
| `sci-fi-score.mp3` | ElPipeline D1 + DatoHero H1/H2/H3 + OjoSatelite I1/I2 |

### P11: `cyber-decrypt.mp3` in ElProblema — brand mismatch

The footage-music-map lists `cyber-decrypt.mp3` as "Unused" but it IS used in ElProblema. More importantly, a "cyber decrypt" sounding track contradicts the warm earthy brand guidelines. Replace with `open-road.mp3` or `warm-launch.mp3`.

---

## Unused Footage (Available for New Assignments)

Clips in `public/videos/` with zero or minimal usage across all audited compositions:

| Clip | Available for |
|------|--------------|
| `a_couple_kissing_9354246.mp4` | Emotional/lifestyle hooks |
| `a_couple_sharing_drinks_8866013.mp4` | Community/social hooks |
| `a_female_camper_making_drip_coffee_6316958.mp4` | Coffee/morning vibe |
| `a_happy_couple_talking_to_each_other_9354247.mp4` | Engagement/debate |
| `a_green_forest_with_the_words_*.mp4` | Forest abstract |
| `adventure_vanlife_in_desert_salt_flats_34479248.mp4` | Desert/alternative landscape |
| `adventurous_cat_on_van_in_desert_landscape.mp4` | Light/fun content |
| `aerial_view_of_dense_green_forest_34348701.mp4` | Forest aerials |
| `aerial_view_of_van_journey_through_desert_35743112.mp4` | Adventure/driving |
| `ai_Campervan_Gathering_in_Golden_Hour.mp4` | Community gathering |
| `ai_GPS_Coordinates_Phone_Reveal.mp4` | Coordinates/data reveal |
| `ai_Spanish_Beach_VW_Van_Golden_Hour.mp4` | Beach payoff (used in ElPipeline payoff, could be used more) |
| `ai_Van_Arriving_Empty_Coastal_Spot.mp4` | Arrival/payoff |
| `cat_exploring_vintage_van_at_sunset_34479412.mp4` | Light content |
| `drone_footage_of_scenic_desert_in_utah.mp4` | Desert landscape |
| `hippie_camper_van_18325890.mp4` | Used only in PuenteDeMayo — underused |
| `hippie_van_in_mountains_18444421.mp4` | Used only in ElProblema pivot (S3 per map) — underused |
| `majestic_aerial_view_of_utah_desert.mp4` | Desert dramatic |
| `serene_beach_with_chairs_and_blue_sea.mp4` | Beach/summer |
| `serene_winter_beach_with_rolling_waves.mp4` | Off-season beach |
| `teenager_boy_and_girl_in_a_van_6187680.mp4` | Youth/lifestyle |
| `tranquil_beach_with_rolling_waves_34804521.mp4` | Beach payoff |
| `women_and_men_getting_out_of_car_10406796.mp4` | Arrival/exploration |
| `fruit_story_*.mp4` | Fruit story only |

### Unused music tracks

| Track | Recommend using in |
|-------|-------------------|
| `warm-launch.mp3` | ElProblema (replace `cyber-decrypt`) |

---

## Priority Fix List

1. **[CRITICAL] Fix CTA overlap in ElProblema, OchoTresMil, ElPeorMomento** — move bottom-positioned elements up 200px
2. **[CRITICAL] Fix MientrasTodosBuscan LabelBar top safe zone** — change `top: 160` to `top: 260`
3. **[CRITICAL] Fix NoLoBusque right padding** — change `right: 60` to `right: 150` on text elements
4. **[HIGH] Extend ElPipeline stage scenes** — 110f → 140f per stage
5. **[HIGH] Extend short CTA endings** — ElPrimerCafe, TuPerroLoSabe, NoLoBusque
6. **[HIGH] Replace cyber-decrypt in ElProblema** — use warm-launch or open-road
7. **[MEDIUM] Diversify footage** — Immediate easy swaps listed below

### Easy footage swaps (no content change needed)

- **ElProblema S3** (pivot, dark scene with no video): already correct per guidelines — no change needed.
- **ElPipeline RADAR stage**: swap `ai_Spanish_Countryside_Van_Video.mp4` → `aerial_view_of_dense_green_forest_34348701.mp4`
- **ElPipeline TERRENO stage**: swap `Aerial_Spanish_Mediterranean_coast.mp4` → `scenic_drive_through_majestic_mountains.mp4`
- **ElPipeline CONTEXTO stage**: swap `ai_Campervan_Sunset_Time_Lapse_Video.mp4` → `serene_beach_with_chairs_and_blue_sea.mp4`
- **OchentaYSiete S4 (Demo)**: swap `rv_mountain_road.mp4` → `hippie_camper_van_18325890.mp4`
- **NoLoBusque NB3 driving**: swap `road_trip_sunset.mp4` → `aerial_view_of_van_journey_through_desert.mp4`
