#!/usr/bin/env python3
"""
Assembles the final flughafen-de video using FFmpeg.

Features:
  - Motion graphics cards + chapter marker cards
  - Swoosh sound effect on every card appearance
  - Background music with auto-ducking sidechain compression
  - Captions (word-level gold highlight) — activates when word-timings.json present

Usage:
  python3 build-video.py /path/to/source-video.mp4
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
SHARED = HERE.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

SRC_VIDEO  = sys.argv[1] if len(sys.argv) > 1 else str(HERE / "source-video.mp4")
OUT_VIDEO  = str(HERE / "output" / (Path(SRC_VIDEO).stem + "-final.mp4"))
MANIFEST   = HERE / "card-manifest.json"
WORDS_JSON = HERE / "word-timings.json"
SWOOSH     = HERE / "swoosh.mp3"
MUSIC      = SHARED / "music" / "sleep-music-chris-haugen.mp3"

MUSIC_VOL   = 0.19
SWOOSH_VOL  = 0.35

Path(OUT_VIDEO).parent.mkdir(parents=True, exist_ok=True)

# ── Validate inputs ───────────────────────────────────────────────────────────
for label, path in [("Source video", SRC_VIDEO), ("Music", MUSIC),
                    ("Swoosh", SWOOSH), ("Manifest", MANIFEST)]:
    if not Path(path).exists():
        print(f"ERROR: {label} not found: {path}")
        sys.exit(1)

# ── Probe source video ────────────────────────────────────────────────────────
probe = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", SRC_VIDEO],
    capture_output=True, text=True
)
probe_data   = json.loads(probe.stdout)
video_stream = next(s for s in probe_data["streams"] if s["codec_type"] == "video")
WIDTH        = video_stream["width"]
HEIGHT       = video_stream["height"]
DURATION     = float(probe_data["format"]["duration"])
print(f"Source : {Path(SRC_VIDEO).name}  {WIDTH}×{HEIGHT}  {DURATION:.1f}s")

# ── Captions (optional) ───────────────────────────────────────────────────────
use_captions = WORDS_JSON.exists()
if use_captions:
    from hf_style import build_ass
    words = json.loads(WORDS_JSON.read_text(encoding="utf-8"))
    ass_content = build_ass(words, width=WIDTH, height=HEIGHT)
    ass_path = HERE / "output" / "captions.ass"
    ass_path.write_text(ass_content, encoding="utf-8")
    print(f"Captions: {len(words)} words → {ass_path.name}")
else:
    print("Captions: skipped (no word-timings.json)")

# ── Load card manifest ────────────────────────────────────────────────────────
manifest = json.loads(MANIFEST.read_text())
cards     = manifest["cards"]

for c in cards:
    p = Path(c["path"])
    if not p.is_absolute():
        c["path"] = str(HERE / p)

n_cards = len(cards)

# ── Build FFmpeg inputs ───────────────────────────────────────────────────────
#   [0]       source video
#   [1…N]     card PNGs
#   [N+1]     background music
#   [N+2]     swoosh sfx
inputs = ["-i", SRC_VIDEO]
for c in cards:
    inputs += ["-i", c["path"]]
music_idx  = 1 + n_cards
swoosh_idx = music_idx + 1
inputs += ["-i", str(MUSIC), "-i", str(SWOOSH)]

# ── Video filter chain ────────────────────────────────────────────────────────
vf = []

if use_captions:
    vf.append(f"[0:v]ass={ass_path}[v_caps]")
    current = "[v_caps]"
else:
    current = "[0:v]"

for idx, card in enumerate(cards):
    card_stream = idx + 1
    is_last     = (idx == n_cards - 1)
    out_label   = "[vout]" if is_last else f"[v{idx}]"
    vf.append(
        f"{current}[{card_stream}:v]overlay=0:0:"
        f"enable='between(t,{card['inTime']},{card['outTime']})':"
        f"format=auto{out_label}"
    )
    current = out_label

# ── Audio filter chain ────────────────────────────────────────────────────────
af = []
fade_dur = min(3.0, DURATION * 0.03)

# Background music: loop → trim → fade → volume
af.append(
    f"[{music_idx}:a]aloop=loop=-1:size=2147483647,"
    f"atrim=duration={DURATION},"
    f"afade=t=in:st=0:d={fade_dur},"
    f"afade=t=out:st={DURATION - fade_dur}:d={fade_dur},"
    f"volume={MUSIC_VOL}[bg_raw]"
)

# Sidechain compress music under voice
af.append("[0:a]asplit=2[voice_out][voice_sc]")
af.append(
    "[bg_raw][voice_sc]sidechaincompress="
    "threshold=0.015:ratio=4:attack=200:release=1200:makeup=1[bg_ducked]"
)

# Swoosh at every card inTime — split into N copies, delay each
af.append(
    f"[{swoosh_idx}:a]asplit={n_cards}"
    + "".join(f"[sw_raw{i}]" for i in range(n_cards))
)
for i, card in enumerate(cards):
    # Fire 100ms early so swoosh peak lands on card entry
    delay_ms = max(0, int((card["inTime"] - 0.1) * 1000))
    af.append(
        f"[sw_raw{i}]atrim=duration=1.2,"
        f"adelay={delay_ms}|{delay_ms},"
        f"volume={SWOOSH_VOL}[sw{i}]"
    )

# Final mix: voice + music + all swooshes
sw_labels = "".join(f"[sw{i}]" for i in range(n_cards))
n_mix     = 2 + n_cards
af.append(
    f"[voice_out][bg_ducked]{sw_labels}"
    f"amix=inputs={n_mix}:duration=first:weights=1 1"
    + " 0.8" * n_cards
    + "[audio_out]"
)

# ── Assemble FFmpeg command ───────────────────────────────────────────────────
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
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        OUT_VIDEO,
    ]
)

print(f"\nRunning FFmpeg...")
print(f"Output → {OUT_VIDEO}\n")

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    size = Path(OUT_VIDEO).stat().st_size
    print(f"✓ Done: {OUT_VIDEO}")
    print(f"  Size: {size/1024/1024:.0f} MB  ({WIDTH}×{HEIGHT}, CRF 18)")
    print(f"\n  → Upload this file directly to YouTube.")
else:
    print("FFmpeg error:")
    for line in result.stderr.split("\n")[-40:]:
        print(" ", line)
    sys.exit(1)
