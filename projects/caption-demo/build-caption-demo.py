#!/usr/bin/env python3
"""
build-caption-demo.py — caption-demo
30s preview of modified caption style:
  - words_per_line: 5 → 3
  - font size: 34 → 38
Uses baggage-de source video + voiceover. Captions only, no cards or music.
"""
import json, subprocess, sys
from pathlib import Path

HERE   = Path(__file__).parent
SHARED = HERE.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

SRC_VIDEO = HERE.parent / "baggage-de" / "source-video.mp4"
VOICE_MP3 = HERE.parent / "baggage-de" / "voiceover.mp3"
WORDS_JSON = HERE.parent / "baggage-de" / "word-timings.json"
OUT = HERE / "output" / "caption-demo-30s.mp4"

DEMO_DUR = 30.0

for label, path in [("Source video", SRC_VIDEO), ("Voiceover", VOICE_MP3), ("Words", WORDS_JSON)]:
    if not Path(path).exists():
        print(f"ERROR: {label} not found: {path}"); sys.exit(1)

# ── Modified caption settings ──────────────────────────────────────────────────
import hf_style
# Bump font size 34 → 38 in both Default and Highlight styles
hf_style.ASS_STYLES = hf_style.ASS_STYLES.replace(",34,", ",38,")

words = json.loads(Path(WORDS_JSON).read_text(encoding="utf-8"))

# Scale timestamps to voiceover (same as real pipeline)
import json as _json
probe_a = _json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(VOICE_MP3)],
    capture_output=True, text=True).stdout)
voice_dur = float(probe_a["format"]["duration"])
timing_end = words[-1]["end"]
if abs(timing_end - voice_dur) > 0.5:
    scale = voice_dur / timing_end
    print(f"Scaling timestamps by {scale:.6f}")
    for w in words:
        w["start"] = round(w["start"] * scale, 4)
        w["end"]   = round(w["end"]   * scale, 4)

# Only keep words within demo duration
words = [w for w in words if w["start"] < DEMO_DUR]

# words_per_line = 3 (was 5)
ass_content = hf_style.build_ass(words, width=1280, height=720, words_per_line=3)
ass_path = HERE / "output" / "captions.ass"
ass_path.write_text(ass_content, encoding="utf-8")
print(f"Captions: {len(words)} words → {ass_path.name}  (3 words/group, size 38)")

# ── FFmpeg ─────────────────────────────────────────────────────────────────────
cmd = [
    "ffmpeg", "-y",
    "-t", str(DEMO_DUR), "-i", str(SRC_VIDEO),
    "-t", str(DEMO_DUR), "-i", str(VOICE_MP3),
    "-filter_complex",
    f"[0:v]ass={ass_path},fade=t=out:st=28.5:d=1.5[vout];"
    f"[1:a]atrim=end={DEMO_DUR}[aout]",
    "-map", "[vout]",
    "-map", "[aout]",
    "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-t", str(DEMO_DUR),
    str(OUT),
]

print(f"\nBuilding 30s caption demo...\nOutput → {OUT}\n")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    size = Path(OUT).stat().st_size
    print(f"✓ Done: {OUT}")
    print(f"  Size: {size/1024/1024:.1f} MB")
else:
    print("FFmpeg error:")
    for line in result.stderr.split("\n")[-30:]:
        print(" ", line)
    sys.exit(1)
