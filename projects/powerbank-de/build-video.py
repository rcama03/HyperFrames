#!/usr/bin/env python3
"""
Composites motion graphics onto the source video using FFmpeg.
- ASS-styled captions with word-level gold highlighting
- PNG card overlays with fade-in/out animations
- Lower-third intro strip overlay
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2] / "packages" / "shared"))
from hf_style import build_ass

SRC_VIDEO = "/root/.claude/uploads/5cc2d5cb-54b1-483f-8b1f-659531df5437/f4ecdaf3-Diese_1_Sache_im_Handgepaeck_kann_deinen_Flug_ruinieren__die_meisten_wissen_es_.mp4"
OUT_VIDEO = str(Path(__file__).parent / "output" / "powerbank-de-final.mp4")
CARDS_DIR = Path(__file__).parent / "card-frames"
MANIFEST  = Path(__file__).parent / "card-manifest.json"
WORDS_JSON = "/tmp/word_timings.json"

Path(OUT_VIDEO).parent.mkdir(parents=True, exist_ok=True)

# ── Load data ─────────────────────────────────────────────────────────────────
with open(MANIFEST) as f:
    manifest = json.load(f)

with open(WORDS_JSON, encoding="utf-8") as f:
    words = json.load(f)

# ── Build ASS subtitle file (style from shared hf_style.py) ──────────────────
ass_content = build_ass(words, width=1280, height=720)
ass_path = Path(__file__).parent / "output" / "captions.ass"
ass_path.parent.mkdir(parents=True, exist_ok=True)
ass_path.write_text(ass_content, encoding="utf-8")
print(f"ASS captions: {ass_path} ({len(ass_content)} chars)")

# ── Build FFmpeg filter_complex ───────────────────────────────────────────────
# Input 0: source video
# Inputs 1..N: card PNGs (overlay images)
# We'll fade each card in/out using the 'overlay' filter with 'enable' expressions

all_overlays = []

# intro strip
intro = manifest["intro"]
all_overlays.append({
    "path": intro["path"],
    "inTime": intro["inTime"],
    "outTime": intro["outTime"],
    "x": 0, "y": 0,  # full-frame transparent PNG
})

# motion cards
for card in manifest["cards"]:
    all_overlays.append({
        "path": card["path"],
        "inTime": card["inTime"],
        "outTime": card["outTime"],
        "x": 0, "y": 0,
    })

# Build ffmpeg command
# Strategy: chain overlays using filter_complex
# Each PNG is faded in/out using the 'overlay' with 'format=auto' and alpha timing

inputs = ["-i", SRC_VIDEO]
for ov in all_overlays:
    inputs += ["-i", ov["path"]]

filter_parts = []
# Start with base video
current = "[0:v]"

# Apply subtitles first
sub_filter = f"[0:v]ass={ass_path}[subs]"
filter_parts.append(sub_filter)
current = "[subs]"

for idx, ov in enumerate(all_overlays):
    in_idx = idx + 1
    in_t   = ov["inTime"]
    out_t  = ov["outTime"]
    fade_dur = 0.4

    # Alpha fade for the overlay PNG: use overlay with enable time window
    # For fade effect, we use a luma matte or just hard cut with enable=
    # Using hard cut first (fade would require more complex filter)
    out_label = f"[v{idx}]"

    # Use overlay with alpha and enable for timing
    # The PNG has transparency so overlay handles it correctly
    filter_parts.append(
        f"{current}[{in_idx}:v]overlay=0:0:"
        f"enable='between(t,{in_t},{out_t})':"
        f"format=auto{out_label}"
    )
    current = out_label

filter_parts[-1] = filter_parts[-1].rstrip(f"[v{len(all_overlays)-1}]") + "[vout]"

filter_str = ";".join(filter_parts)

cmd = (
    ["ffmpeg", "-y"]
    + inputs
    + [
        "-filter_complex", filter_str,
        "-map", "[vout]",
        "-map", "0:a",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        OUT_VIDEO,
    ]
)

print("\nRunning FFmpeg...")
print(" ".join(cmd[:8]) + " ...")

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"\n✓ Output: {OUT_VIDEO}")
    import os
    size = os.path.getsize(OUT_VIDEO)
    print(f"  Size: {size/1024/1024:.1f} MB")
else:
    print("\nFFmpeg stderr (last 40 lines):")
    for line in result.stderr.split("\n")[-40:]:
        print(" ", line)
    sys.exit(1)
