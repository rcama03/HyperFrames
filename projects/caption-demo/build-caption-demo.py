#!/usr/bin/env python3
"""
build-caption-demo.py — caption-demo
30s preview of improved caption style:
  - words_per_line: 3
  - font size: 42
  - sync fix: highlighted word holds until next word starts (no gaps)
Uses baggage-de source video + voiceover. Captions only, no cards or music.
"""
import json, subprocess, sys
from pathlib import Path

HERE      = Path(__file__).parent
SHARED    = HERE.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

SRC_VIDEO  = HERE.parent / "baggage-de" / "source-video.mp4"
VOICE_MP3  = HERE.parent / "baggage-de" / "voiceover.mp3"
WORDS_JSON = HERE.parent / "baggage-de" / "word-timings.json"
OUT        = HERE / "output" / "caption-demo-30s.mp4"
DEMO_DUR   = 30.0

for label, path in [("Source video", SRC_VIDEO), ("Voiceover", VOICE_MP3), ("Words", WORDS_JSON)]:
    if not Path(path).exists():
        print(f"ERROR: {label} not found: {path}"); sys.exit(1)

# ── Probe voiceover & scale word timestamps ────────────────────────────────────
words = json.loads(Path(WORDS_JSON).read_text(encoding="utf-8"))
probe_a = json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(VOICE_MP3)],
    capture_output=True, text=True).stdout)
voice_dur  = float(probe_a["format"]["duration"])
timing_end = words[-1]["end"]
if abs(timing_end - voice_dur) > 0.5:
    scale = voice_dur / timing_end
    print(f"Scaling timestamps ×{scale:.6f}  ({timing_end:.2f}s → {voice_dur:.2f}s)")
    for w in words:
        w["start"] = round(w["start"] * scale, 4)
        w["end"]   = round(w["end"]   * scale, 4)

words = [w for w in words if w["start"] < DEMO_DUR]

# ── Improved build_ass: perfect word-highlight sync ────────────────────────────
import hf_style

FONT_SIZE      = 42
WORDS_PER_LINE = 3

# Patch font size in the shared style string
ASS_STYLES = hf_style.ASS_STYLES.replace(",34,", f",{FONT_SIZE},")

ASS_HEADER = hf_style.ASS_HEADER_TEMPLATE.format(
    width=1280, height=720, styles=ASS_STYLES
)

def ts(t):
    h  = int(t // 3600)
    m  = int((t % 3600) // 60)
    s  = int(t % 60)
    cs = int((t % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

events = []
for i in range(0, len(words), WORDS_PER_LINE):
    line = words[i : i + WORDS_PER_LINE]

    for wi, word in enumerate(line):
        before = " ".join(w["word"].upper() for w in line[:wi])
        cur    = word["word"].upper()
        after  = " ".join(w["word"].upper() for w in line[wi + 1:])

        parts = []
        if before:
            parts.append(r"{\c&H00FFFFFF&\alpha&H33&}" + before + " ")
        parts.append(r"{\c&H0000D7FF&\alpha&H00&}" + cur)
        if after:
            parts.append(r"{\c&H00FFFFFF&\alpha&H33&}" + " " + after)

        text = r"{\bord1\shad0}" + "".join(parts)

        w_start = word["start"]
        # KEY SYNC FIX: hold highlight until next word starts, not until word.end
        if wi < len(line) - 1:
            w_end = line[wi + 1]["start"]
        else:
            w_end = word["end"]

        events.append(
            f"Dialogue: 0,{ts(w_start)},{ts(w_end)},Default,,0,0,0,,{text}"
        )

ass_content = ASS_HEADER + "\n".join(events) + "\n"
ass_path = HERE / "output" / "captions.ass"
ass_path.write_text(ass_content, encoding="utf-8")
print(f"Captions: {len(words)} words → {ass_path.name}  "
      f"({WORDS_PER_LINE} words/group, size {FONT_SIZE}, sync-fixed)")

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
