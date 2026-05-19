#!/usr/bin/env python3
"""
Composites motion graphics onto the source video using FFmpeg.

Usage:
  python3 build-video.py                          # uses default video path
  python3 build-video.py /path/to/your/video.mp4  # your full-quality video

Run this locally against your original high-quality video.
Output will match the input quality — no unnecessary compression.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parents[1] / "packages" / "shared"))
from hf_style import build_ass

# ── Paths ─────────────────────────────────────────────────────────────────────
# Pass your full-quality video as a command-line argument, e.g.:
#   python3 build-video.py "C:/Videos/my-video.mp4"
#   python3 build-video.py ~/Videos/my-video.mp4
SRC_VIDEO  = sys.argv[1] if len(sys.argv) > 1 else str(HERE / "source-video.mp4")
OUT_VIDEO  = str(HERE / "output" / (Path(SRC_VIDEO).stem + "-final.mp4"))
MANIFEST   = HERE / "card-manifest.json"
WORDS_JSON = HERE / "word-timings.json"

Path(OUT_VIDEO).parent.mkdir(parents=True, exist_ok=True)

if not Path(SRC_VIDEO).exists():
    print(f"ERROR: Source video not found: {SRC_VIDEO}")
    print("Usage: python3 build-video.py /path/to/your/video.mp4")
    sys.exit(1)

# ── Load data ─────────────────────────────────────────────────────────────────
with open(MANIFEST) as f:
    manifest = json.load(f)

with open(WORDS_JSON, encoding="utf-8") as f:
    words = json.load(f)

# ── Detect video resolution ───────────────────────────────────────────────────
probe = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json",
     "-show_streams", SRC_VIDEO],
    capture_output=True, text=True
)
probe_data = json.loads(probe.stdout)
video_stream = next(s for s in probe_data["streams"] if s["codec_type"] == "video")
WIDTH    = video_stream["width"]
HEIGHT   = video_stream["height"]
DURATION = float(video_stream.get("duration", 213.1))
print(f"Source: {Path(SRC_VIDEO).name}  {WIDTH}×{HEIGHT}")

# ── Build ASS subtitle file (style from shared hf_style.py) ──────────────────
ass_content = build_ass(words, width=WIDTH, height=HEIGHT)
ass_path = HERE / "output" / "captions.ass"
ass_path.write_text(ass_content, encoding="utf-8")
print(f"Captions: {len(words)} words → {ass_path.name}")

# ── Build FFmpeg overlay list ─────────────────────────────────────────────────
all_overlays = [
    {"path": manifest["intro"]["path"],
     "inTime": manifest["intro"]["inTime"],
     "outTime": manifest["intro"]["outTime"]},
    *[{"path": c["path"], "inTime": c["inTime"], "outTime": c["outTime"]}
      for c in manifest["cards"]]
]

# ── Build FFmpeg command ──────────────────────────────────────────────────────
inputs = ["-i", SRC_VIDEO]
for ov in all_overlays:
    inputs += ["-i", ov["path"]]

filter_parts = []

# Captions + gold progress bar burned onto base video
filter_parts.append(f"[0:v]ass={ass_path}[subtitled]")
filter_parts.append(
    f"[subtitled]drawbox=x=0:y=ih-5:w='iw*t/{DURATION:.3f}':h=5"
    f":color=FFD700@0.85:t=fill[base]"
)
current = "[base]"

# Each overlay: fade alpha in/out + slide-up entrance / slide-down exit
for idx, ov in enumerate(all_overlays):
    in_t  = ov["inTime"]
    out_t = ov["outTime"]
    fade_out_st = (out_t - in_t) - 0.3
    in_idx = idx + 1

    # Pre-process PNG: fade in alpha over 0.4s, fade out alpha over 0.3s
    card_label = f"[c{idx}]"
    filter_parts.append(
        f"[{in_idx}:v]fade=in:st=0:d=0.4:alpha=1,"
        f"fade=out:st={fade_out_st:.3f}:d=0.3:alpha=1{card_label}"
    )

    # Overlay: slide up 12px on entry, slide down 8px on exit
    out_label = "[vout]" if idx == len(all_overlays) - 1 else f"[v{idx}]"
    y = (
        f"if(lt(t,{in_t}+0.4),"
        f"trunc(12*(1-(t-{in_t})/0.4)),"
        f"if(gt(t,{out_t}-0.3),"
        f"trunc(8*(t-({out_t}-0.3))/0.3),"
        f"0))"
    )
    filter_parts.append(
        f"{current}{card_label}overlay=x=0:y='{y}':"
        f"enable='between(t,{in_t},{out_t})':format=auto{out_label}"
    )
    current = out_label

cmd = (
    ["ffmpeg", "-y"]
    + inputs
    + [
        "-filter_complex", ";".join(filter_parts),
        "-map", "[vout]",
        "-map", "0:a",
        # ── Encoding: preserve quality, no unnecessary compression ──
        # CRF 18 = near-lossless for h264; lower = bigger file/better quality
        # Change to crf 23 for smaller file, crf 16 for archival quality
        "-c:v", "libx264",
        "-preset", "slow",       # better compression efficiency
        "-crf", "18",            # high quality (YouTube-ready)
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",          # copy original audio — zero quality loss
        "-movflags", "+faststart",
        OUT_VIDEO,
    ]
)

print(f"\nRunning FFmpeg (high-quality encode)...")
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
