---
name: audio-analyzer
description: Analyse audio files (mp3, wav, flac, ogg, aac) for spectral, harmonic, rhythm, timbre, stereo, and loudness data using the audio-analyzer MCP server.
metadata:
  tags: audio, music, analysis, mcp, spectral, rhythm, loudness
---

## When to use

Use this skill whenever you need to analyse local audio files — for example to:

- Detect the **key, tempo, or BPM** of a track.
- Measure **loudness (LUFS)**, dynamic range, or streaming-platform targets.
- Profile **timbre / MFCCs**, spectral brightness, or frequency-band energy.
- Check **stereo width**, mono compatibility, or phase correlation.
- Find **structural section boundaries** (intro, verse, chorus, bridge).
- **Compare two tracks** side-by-side (A/B diff).
- Get **time-series data** showing how features evolve over the duration.

## Prerequisites

The `audio-analyzer` MCP server must be running (configured in `.mcp.json`).
It is a local stdio server — files are read directly from disk, **never uploaded**.

## Available MCP Tools

| Tool | Purpose |
|---|---|
| `audio_info` | Basic file metadata: duration, sample rate, channels, format |
| `spectral_features` | Centroid, bandwidth, rolloff, flatness, MFCCs, band energy, spectral contrast |
| `harmonic_analysis` | Chromagram, key detection (Krumhansl-Schmuckler), tonnetz |
| `rhythm_analysis` | Tempo / BPM, beat tracking, onset detection, tempo stability |
| `full_analysis` | Runs **all** analyses in one call (spectral, harmonic, rhythm, percussive, dynamics, LUFS, stereo, sections) |
| `compare` | A/B comparison of two tracks — compact diff table of loudness, dynamics, spectral, stereo, key, tempo |

## Key parameters

### `file_path` (required for all tools)

Always provide the **absolute path** on disk. Example:

```
/Users/javier/Documents/Proyects/wildspotter/marketing-path/public/audio/music/epic-drums.mp3
```

### `resolution` (optional — all tools)

Controls time-series output granularity:

| Value | Behaviour |
|---|---|
| *(omitted)* | Summary statistics only (averages) — most token-efficient |
| `"low"` | Coarse time-series |
| `"medium"` | ~1 row/sec — good balance of detail vs tokens |
| `"high"` | Fine-grained time-series |
| `"20"` (numeric string) | Custom: 20 data-points per second |

### `start_time` / `end_time` (optional)

Analyse only a slice of the track (in seconds). Useful after detecting section boundaries to zoom into a specific section.

## Workflow patterns

### 1. Quick overview

Ask for `full_analysis` with no resolution to get a compact summary of all features.

### 2. Summary → Zoom

1. Run `full_analysis` to get section boundaries.
2. Use `start_time` / `end_time` to zoom into an interesting section with `resolution: "medium"`.

### 3. A/B comparison

Use `compare` with two file paths to get a side-by-side diff table highlighting differences in loudness, dynamics, spectral balance, stereo field, key, and tempo.

### 4. Music selection for video

When choosing background music for a Remotion video:

1. Run `full_analysis` on candidate tracks.
2. Check **tempo** matches desired pacing.
3. Check **key** compatibility if layering multiple tracks.
4. Check **LUFS** to anticipate volume normalization on streaming platforms.
5. Check **section boundaries** to align video cuts with musical transitions.

## Important notes

- Files are read **locally from disk** — use absolute paths, do not try to upload or attach files.
- Supports **mp3, wav, flac, ogg, aac** formats.
- A full 60-second analysis completes in **~2 seconds**.
- Pure Rust, no Python/FFmpeg dependencies needed.
- Output is **token-efficient** — designed to fit comfortably in the context window (<1% usage for a full track analysis).
