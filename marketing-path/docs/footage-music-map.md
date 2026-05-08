# Footage & Music Assignments

Which clips and tracks are used in each produced video. Check this before selecting footage/music for a new video to avoid reuse.

**Always `ls public/videos/` and `ls public/audio/music/` for the full current inventory.** This file tracks assignments, not the complete inventory — new files may exist that aren't listed here.

## Per-Video Footage Map

### ParkingLleno (Concepto A)
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Hook | `ai_Van_trying_to_park_full_parking.mp4` | 35% | Hero — vanlife overcrowding |
| S2 Stars | `ai_Van_trying_to_park_full_parking.mp4` (continued) | 75% | Same footage, darker |
| S3 Question | `drone_mountains.mp4` | 55% | Pivot — nature emerging |
| S4 Scan | `road_trip_sunset.mp4` | 85% | Subtle warmth behind phone |
| S5 CTA | `van_in_spot_calm.mp4` | 40% | Payoff — the dream |

### Natura2000Clip
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Map | `Aerial_Spanish_Mediterranean_coast.mp4` | 25% | Nature establishing shot |
| S2 Natura overlay | `Aerial_Spanish_Mediterranean_coast.mp4` (continued) | 75% | Same, darker |
| S3 Warning | `police_car.mp4` | 82% | Fear |
| S4 Logo | `van_in_spot_calm.mp4` (loop) | 80% | Subtle payoff |

### LaMulta (Concepto C)
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Hook "600E" | `police_car.mp4` | 75% | Fear |
| S2 Zones map | `drone_forest.mp4` | 85% | Behind Natura 2000 map |
| S3 Question | `police_writing_ticket.mp4` | 85% | Authority atmosphere |
| S4 Checklist | `Aerial_Spanish_Mediterranean_coast.mp4` | 90% | Subtle — cards are focus |
| S5 CTA | `van_in_spot_calm_couple_dog_night.mp4` (loop) | 78% | Warm human payoff |

### OchentaYSiete (Concepto B)
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1 Map counter | None — dark map image | N/A | Map + animated dots |
| S2 Qualities | `drone_mountains.mp4` | 80% | Scenic backdrop |
| S3 Reveal | `road_trip_sunset.mp4` | 82% | Moody road |
| S4 Demo | `rv_mountain_road.mp4` | 85% | Subtle driving |
| S5 Pipeline | `coffee_camping.mp4` | 90% | Minimal — cards are focus |
| S6 Choice | TOP: `ai_Van_trying_to_park_full_parking.mp4`, BOTTOM: `van_in_spot_calm.mp4` | 45%/55% | Split comparison |

### PuenteDeMayo
| Scene | Footage | Dim | Role |
|-------|---------|-----|------|
| S1-S2 Hook+Problem | `hippie_camper_van_18325890_2160x3840_18325890.mp4` | 40->55% | Crowded atmosphere |
| S3-S4 Pivot+CTA | `orange_vw_camper_van_on_scenic_coastal_drive_37075748_1080x1920_37075748.mp4` | 55->35% | Freedom payoff |

### ElRadarDetecto (data-driven)
| Variant | S1 (Scanning) | S2 (Data) | S5 (CTA) | Spot |
|---------|---------------|-----------|----------|------|
| RD1 (rio) | `drone_forest.mp4` | `drone_forest.mp4` | `van_in_spot_calm.mp4` | OSM 1311493324, score 86.1 |
| RD2 (lago) | `a_gravel_road_*.mp4` | `scenic_drive_through_*.mp4` | `dog-beach-happy.mp4` | OSM 71422800, score 83.7 |
| RD3 (montana) | `scenic_drive_through_*.mp4` | `a_gravel_road_*.mp4` | `rv_mountain_road.mp4` | OSM 5484843145, score 80.7 |
| RD4 (costa) | `Aerial_Spanish_Mediterranean_coast.mp4` | `cliff_ocean_*.mp4` | `dog-beach-happy.mp4` | OSM 2254888334, score 68.1 |

## Music Assignments

| Track | File | Source | Assigned to |
|-------|------|--------|-------------|
| Cinematic | `background.mp3` | — | ParkingLleno A1 |
| Reflective | `the-journey.mp3` | Mixkit 79 | ParkingLleno A2/A3 |
| Suspense piano | `tension.mp3` | — | Natura2000 N1 |
| Ambient | `digital-clouds.mp3` | Mixkit 175 | Natura2000 N2 |
| Documentary | `suspense.mp3` | — | LaMulta C1 |
| Dark ambient | `echoes.mp3` | Mixkit 188 | LaMulta C2/C3 |
| Epic drums | `epic-drums.mp3` | — | OchentaYSiete B1 |
| Atmospheric | `spirit-in-the-woods.mp3` | Mixkit 139 | OchentaYSiete B2/B3, LasCoordenadas E1-E3 |
| Futuristic tech | `sci-fi-score.mp3` | Mixkit 464 | ElPipeline D1 |
| Electronic | `voxscape.mp3` | Mixkit 571 | ElPipeline D2/D3 |
| Warm | `morning-calm.mp3` | Mixkit 82 | ElPrimerCafe PC1/PC2 |
| Upbeat gentle | `golden-fields.mp3` | Mixkit 142 | TuPerroLoSabe P1/P2, ElPrimerCafe PC3 |
| Driving | `open-road.mp3` | Mixkit 468 | NoLoBusque NB1/NB2 |
| Dramatic | `rising-tide.mp3` | Mixkit 580 | MientrasTodosBuscan MT1/MT2, NoLoBusque NB3 |
| Energetic reveal | `pulse-reveal.mp3` | — | PuenteDeMayo |
| Tense dramatic | `dark-verdict.mp3` | Mixkit 582 | QuizLegal |

### SFX available
`radar-ping.mp3`, `score-reveal.mp3`, `whoosh.mp3`

## AI Video Generation — Best Candidates

Shots worth generating for future videos:
1. Drone pullback from parked van revealing Spanish coastline panorama
2. Van driving down winding dirt road through Spanish countryside at golden hour
3. First-person POV arriving at wild camping spot — headlights illuminating a clearing
4. Time-lapse of sunset behind a van with string lights turning on
