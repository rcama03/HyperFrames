# pilot-secrets-de

**"7 Dinge, die dein Pilot NIE laut sagen wuerde"** — German YouTube video project.

## Files in this folder

| File | Purpose |
|---|---|
| `script_german.txt` | Original script (10 scenes, 307 words, ~150s) |
| `full_voiceover.mp3` | Voiceover audio (149.88s, 24kHz) |
| `timing.json` | Per-scene timestamps (auto-calculated from word count) |
| `cards/scene_01-10.png` | 1920x1080 text-overlay cards (one per scene) |
| `generate_cards.py` | Regenerates PNGs + timing.json (run in cloud) |
| `build-video.py` | **Run this locally** to produce the final video |

## Scene timing

| Scene | Label | Start | End | Duration |
|---|---|---|---|---|
| 1 | HOOK | 0.00s | 10.74s | 10.74s |
| 2 | #1 MEL List | 10.74s | 25.88s | 15.13s |
| 3 | #2 Turbulence | 25.88s | 40.52s | 14.65s |
| 4 | #3 Autopilot | 40.52s | 53.70s | 13.18s |
| 5 | #4 O2 masks | 53.70s | 70.30s | 16.60s |
| 6 | #5 Sleep cabins | 70.30s | 84.46s | 14.16s |
| 7 | #6 Lightning | 84.46s | 100.57s | 16.11s |
| 8 | #7 Deadly 11min | 100.57s | 118.15s | 17.58s |
| 9 | OUTRO | 118.15s | 134.26s | 16.11s |
| 10 | CTA | 134.26s | 149.88s | 15.62s |

## How to build the video locally

**Requirements:** Python 3, ffmpeg in PATH

```bash
# 1. Clone the repo (one-time)
git clone https://github.com/rcama03/HyperFrames
cd HyperFrames/projects/pilot-secrets-de

# 2. Build — point to your original video (B-roll / stock footage)
python3 build-video.py "C:\Videos\your-original-video.mp4"

# Output: output_final.mp4  (CRF 18, audio zero-loss, YouTube-ready)
```

The script overlays each scene card onto your video at the correct timestamp,
then swaps in the voiceover. Your original video frames are never re-encoded
beyond CRF 18 — quality is preserved.
