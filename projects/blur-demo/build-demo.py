#!/usr/bin/env python3
"""
build-demo.py — blur-demo
1-minute showcase of the Blur Font effect on key stats.

Each of 8 stat cards appears for 5s with a blur-in / hold / blur-out animation:
  0.0-0.3s : heavy blur  (sigma=16)
  0.3-0.7s : medium blur (sigma=6)
  0.7-4.3s : sharp
  4.3-4.7s : medium blur
  4.7-5.0s : heavy blur
"""
import json, subprocess, sys
from pathlib import Path

HERE   = Path(__file__).parent
SHARED = HERE.parents[1] / "packages" / "shared"
OUT    = str(HERE / "output" / "blur-demo.mp4")
MUSIC  = SHARED / "music" / "sleep-music-chris-haugen.mp3"

Path(OUT).parent.mkdir(parents=True, exist_ok=True)

if not MUSIC.exists():
    print(f"ERROR: Music not found: {MUSIC}"); sys.exit(1)

# ── Card data ──────────────────────────────────────────────────────────────────
manifest = json.loads((HERE / "card-manifest.json").read_text())
cards = manifest["cards"]
N = len(cards)  # 8

TOTAL_DUR    = 60.0
CARD_DUR     = 5.0
GAP          = 1.0
START        = 2.0

HEAVY_DUR    = 0.3   # heavy blur phase
MED_DUR      = 0.4   # medium blur phase
# sharp phase = CARD_DUR - 2*HEAVY_DUR - 2*MED_DUR = 3.6s

def card_frames_path(card_id, suffix):
    return str(HERE / "card-frames" / f"{card_id}-{suffix}.png")

# ── Inputs ─────────────────────────────────────────────────────────────────────
# [0]      : dark background (lavfi)
# [5i+1]   : card i, blur16 (entry)
# [5i+2]   : card i, blur6  (entry)
# [5i+3]   : card i, sharp
# [5i+4]   : card i, blur6  (exit)  ← same file, separate stream
# [5i+5]   : card i, blur16 (exit)  ← same file, separate stream
# [5N+1]   : background music

inputs = [
    "-f", "lavfi",
    "-i", "color=c=0x07071A:size=1280x720:rate=30:duration=60",
]
for c in cards:
    for suffix in ["blur16", "blur6", "sharp", "blur6", "blur16"]:
        inputs += ["-i", card_frames_path(c["id"], suffix)]

music_idx = 5 * N + 1
inputs += ["-i", str(MUSIC)]

# ── Video filter chain ─────────────────────────────────────────────────────────
vf = []
current = "[0:v]"

for i, card in enumerate(cards):
    t_start = START + i * (CARD_DUR + GAP)
    t_end   = t_start + CARD_DUR

    p1 = t_start
    p2 = round(t_start + HEAVY_DUR, 3)
    p3 = round(t_start + HEAVY_DUR + MED_DUR, 3)
    p4 = round(t_end   - HEAVY_DUR - MED_DUR, 3)
    p5 = round(t_end   - HEAVY_DUR, 3)
    p6 = t_end

    b16_in  = 5 * i + 1
    b6_in   = 5 * i + 2
    sharp   = 5 * i + 3
    b6_out  = 5 * i + 4
    b16_out = 5 * i + 5

    vf.append(f"{current}[{b16_in}:v]overlay=0:0:enable='between(t,{p1},{p2})':format=auto[c{i}a]")
    vf.append(f"[c{i}a][{b6_in}:v]overlay=0:0:enable='between(t,{p2},{p3})':format=auto[c{i}b]")
    vf.append(f"[c{i}b][{sharp}:v]overlay=0:0:enable='between(t,{p3},{p4})':format=auto[c{i}c]")
    vf.append(f"[c{i}c][{b6_out}:v]overlay=0:0:enable='between(t,{p4},{p5})':format=auto[c{i}d]")
    vf.append(f"[c{i}d][{b16_out}:v]overlay=0:0:enable='between(t,{p5},{p6})':format=auto[c{i}e]")
    current = f"[c{i}e]"

vf.append(f"{current}fade=t=out:st=58.5:d=1.5[vout]")

# ── Audio filter chain ─────────────────────────────────────────────────────────
af = [
    f"[{music_idx}:a]aloop=loop=-1:size=2147483647,"
    f"atrim=duration={TOTAL_DUR},"
    f"afade=t=in:st=0:d=2,"
    f"afade=t=out:st=57:d=3,"
    f"volume=0.30[audio_out]"
]

# ── FFmpeg ─────────────────────────────────────────────────────────────────────
filter_complex = ";".join(vf + af)

cmd = (
    ["ffmpeg", "-y"]
    + inputs
    + [
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "[audio_out]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-t", f"{TOTAL_DUR}",
        OUT,
    ]
)

print(f"Building blur-demo ({TOTAL_DUR}s, {N} cards)...")
print(f"Output → {OUT}\n")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    size = Path(OUT).stat().st_size
    print(f"✓ Done: {OUT}")
    print(f"  Size: {size/1024/1024:.0f} MB  (1280×720, CRF 20)")
else:
    print("FFmpeg error:")
    for line in result.stderr.split("\n")[-40:]:
        print(" ", line)
    sys.exit(1)
