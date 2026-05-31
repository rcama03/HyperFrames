#!/usr/bin/env python3
"""
Assembles the scanner-de video using FFmpeg.

Features:
  - External voiceover replaces source audio
  - Video frozen/padded to match voiceover duration
  - Word-level gold-highlight captions (ASS)
  - Motion graphics cards + chapter marker cards
  - Swoosh SFX on every card appearance
  - Background music with auto-ducking

Usage:
  python3 build-video.py /path/to/source-video.mp4 /path/to/voiceover.mp3
"""
import json
import subprocess
import sys
from pathlib import Path

HERE   = Path(__file__).parent
SHARED = HERE.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

SRC_VIDEO  = sys.argv[1] if len(sys.argv) > 1 else str(HERE / "source-video.mp4")
VOICE_MP3  = sys.argv[2] if len(sys.argv) > 2 else str(HERE / "voiceover.mp3")
OUT_VIDEO  = str(HERE / "output" / (Path(SRC_VIDEO).stem + "-final.mp4"))
MANIFEST   = HERE / "card-manifest.json"
WORDS_JSON = HERE / "word-timings.json"
SWOOSH     = HERE / "swoosh.mp3"
MUSIC      = SHARED / "music" / "sleep-music-chris-haugen.mp3"

MUSIC_VOL  = 0.19
SWOOSH_VOL = 0.35

Path(OUT_VIDEO).parent.mkdir(parents=True, exist_ok=True)

for label, path in [("Source video", SRC_VIDEO), ("Voiceover", VOICE_MP3),
                    ("Music", MUSIC), ("Swoosh", SWOOSH), ("Manifest", MANIFEST)]:
    if not Path(path).exists():
        print(f"ERROR: {label} not found: {path}")
        sys.exit(1)

# ── Probe ─────────────────────────────────────────────────────────────────────
probe_v = json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", SRC_VIDEO],
    capture_output=True, text=True).stdout)
probe_a = json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", VOICE_MP3],
    capture_output=True, text=True).stdout)

video_stream = next(s for s in probe_v["streams"] if s["codec_type"] == "video")
WIDTH        = video_stream["width"]
HEIGHT       = video_stream["height"]
VIDEO_DUR    = float(probe_v["format"]["duration"])
VOICE_DUR    = float(probe_a["format"]["duration"])
SRC_OFFSET   = 4.5        # skip dark bedroom intro; airport runway visible from this point
DURATION     = min(VIDEO_DUR - SRC_OFFSET, VOICE_DUR)  # end when shorter of video/voiceover ends

print(f"Source : {Path(SRC_VIDEO).name}  {WIDTH}×{HEIGHT}  {VIDEO_DUR:.1f}s")
print(f"Voice  : {Path(VOICE_MP3).name}  {VOICE_DUR:.1f}s  (trimmed to {DURATION:.1f}s)")
print(f"Output : {DURATION:.1f}s")

# ── Captions ──────────────────────────────────────────────────────────────────
from hf_style import build_ass
words = json.loads(WORDS_JSON.read_text(encoding="utf-8"))

# Scale word timestamps to match actual voiceover duration
# (timing file may be generated at a different speed than the recording)
timing_end = words[-1]["end"]
if abs(timing_end - VOICE_DUR) > 0.5:
    scale = VOICE_DUR / timing_end
    print(f"Caption sync  : scaling timestamps by {scale:.6f} ({timing_end:.2f}s → {VOICE_DUR:.2f}s)")
    for w in words:
        w["start"] = round(w["start"] * scale, 4)
        w["end"]   = round(w["end"]   * scale, 4)

# Only include words that fall within the output duration
words = [w for w in words if w["start"] < DURATION]

ass_content = build_ass(words, width=WIDTH, height=HEIGHT, words_per_line=5)
ass_path = HERE / "output" / "captions.ass"
ass_path.write_text(ass_content, encoding="utf-8")
print(f"Captions: {len(words)} words → {ass_path.name}")

# ── Cards ─────────────────────────────────────────────────────────────────────
manifest = json.loads(MANIFEST.read_text())
cards    = manifest["cards"]
for c in cards:
    p = Path(c["path"])
    if not p.is_absolute():
        c["path"] = str(HERE / p)
n_cards = len(cards)

# ── Inputs ────────────────────────────────────────────────────────────────────
#   [0]     source video
#   [1]     voiceover
#   [2…N+1] card PNGs
#   [N+2]   background music
#   [N+3]   swoosh
inputs = ["-ss", str(SRC_OFFSET), "-i", SRC_VIDEO, "-i", VOICE_MP3]
for c in cards:
    inputs += ["-i", c["path"]]
music_idx  = 2 + n_cards
swoosh_idx = music_idx + 1
inputs += ["-i", str(MUSIC), "-i", str(SWOOSH)]

# ── Video filter chain ────────────────────────────────────────────────────────
vf = []
current = "[0:v]"

# Captions
vf.append(f"{current}ass={ass_path}[v_caps]")
current = "[v_caps]"

# Card overlays
for idx, card in enumerate(cards):
    card_stream = idx + 2
    out_label   = f"[v{idx}]"
    vf.append(
        f"{current}[{card_stream}:v]overlay=0:0:"
        f"enable='between(t,{card['inTime']},{card['outTime']})':"
        f"format=auto{out_label}"
    )
    current = out_label

# Fade to black in last 1.5s — hides captions and cards cleanly
fade_out_start = DURATION - 1.5
vf.append(f"{current}fade=t=out:st={fade_out_start:.3f}:d=1.5[vout]")

# ── Audio filter chain ────────────────────────────────────────────────────────
af = []
fade_dur = min(3.0, DURATION * 0.03)

# Background music
af.append(
    f"[{music_idx}:a]aloop=loop=-1:size=2147483647,"
    f"atrim=duration={DURATION:.3f},"
    f"afade=t=in:st=0:d={fade_dur},"
    f"afade=t=out:st={DURATION - fade_dur:.3f}:d={fade_dur},"
    f"volume={MUSIC_VOL}[bg_raw]"
)

# Trim voiceover to video duration, then sidechain compress under music
af.append(f"[1:a]atrim=end={DURATION:.3f},asplit=2[voice_out][voice_sc]")
af.append(
    "[bg_raw][voice_sc]sidechaincompress="
    "threshold=0.015:ratio=4:attack=200:release=1200:makeup=1[bg_ducked]"
)

# Swoosh on every card entry
af.append(
    f"[{swoosh_idx}:a]asplit={n_cards}"
    + "".join(f"[sw_raw{i}]" for i in range(n_cards))
)
for i, card in enumerate(cards):
    delay_ms = int(card["inTime"] * 1000)
    af.append(
        f"[sw_raw{i}]atrim=start=0.033:duration=0.95,"
        f"adelay={delay_ms}|{delay_ms},"
        f"volume={SWOOSH_VOL}[sw{i}]"
    )

sw_labels = "".join(f"[sw{i}]" for i in range(n_cards))
n_mix     = 2 + n_cards
af.append(
    f"[voice_out][bg_ducked]{sw_labels}"
    f"amix=inputs={n_mix}:duration=first:weights=1 1"
    + " 0.8" * n_cards
    + "[audio_out]"
)

# ── FFmpeg ────────────────────────────────────────────────────────────────────
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
        "-t", f"{DURATION:.3f}",
        OUT_VIDEO,
    ]
)

print(f"\nRunning FFmpeg...\nOutput → {OUT_VIDEO}\n")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    size = Path(OUT_VIDEO).stat().st_size
    print(f"✓ Done: {OUT_VIDEO}")
    print(f"  Size: {size/1024/1024:.0f} MB  ({WIDTH}×{HEIGHT}, CRF 18)")
else:
    print("FFmpeg error:")
    for line in result.stderr.split("\n")[-40:]:
        print(" ", line)
    sys.exit(1)
