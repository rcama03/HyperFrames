#!/usr/bin/env python3
"""
Add background music to a composited HyperFrames video.

Usage:
  python3 add-music.py your-video-final.mp4 your-music.mp3

The music is:
  - Auto-ducked via sidechain compression when voice is detected
    (lowers smoothly during speech, rises back during pauses)
  - Fades in over the first 3 seconds
  - Fades out over the last 3 seconds
  - Looped automatically if track is shorter than the video
  - Mixed at ~14% volume under the voiceover

Optional flags:
  --volume 0.18     adjust music level (default 0.14)
  --no-duck         disable auto-ducking

Output: same folder as input, filename gains '-music' suffix.
"""
import subprocess
import sys
import json
import argparse
from pathlib import Path

# ── Args ──────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("video", help="Input video file (with voiceover)")
parser.add_argument("music", help="Your music track (MP3/WAV/FLAC/AAC)")
parser.add_argument("--volume", type=float, default=0.14,
                    help="Music volume 0.0–1.0 relative to voice (default: 0.14)")
parser.add_argument("--no-duck", action="store_true",
                    help="Disable auto-ducking")
args = parser.parse_args()

video_path = Path(args.video)
music_path = Path(args.music)

if not video_path.exists():
    print(f"ERROR: Video not found: {video_path}")
    sys.exit(1)
if not music_path.exists():
    print(f"ERROR: Music not found: {music_path}")
    sys.exit(1)

out_path = video_path.parent / (video_path.stem + "-music" + video_path.suffix)
vol = args.volume

print(f"Video : {video_path.name}")
print(f"Music : {music_path.name}  (volume={vol:.0%})")
print(f"Duck  : {'disabled' if args.no_duck else 'enabled'}")
print(f"Output: {out_path.name}\n")

# ── Get video duration ────────────────────────────────────────────────────────
probe = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json",
     "-show_format", str(video_path)],
    capture_output=True, text=True
)
duration = float(json.loads(probe.stdout)["format"]["duration"])
fade_dur = min(3.0, duration * 0.03)

# ── Build filter_complex ──────────────────────────────────────────────────────
filters = []

# Music: loop → trim to video length → fade in/out → set volume
filters.append(
    f"[1:a]aloop=loop=-1:size=2147483647,"
    f"atrim=duration={duration},"
    f"afade=t=in:st=0:d={fade_dur},"
    f"afade=t=out:st={duration - fade_dur}:d={fade_dur},"
    f"volume={vol}[bg]"
)

if args.no_duck:
    filters.append("[0:a][bg]amix=inputs=2:duration=first:weights='1 1'[audio]")
else:
    # Sidechain: voice drives compression on music
    # 200ms attack = smooth duck-down, 1200ms release = smooth restore
    filters.append("[0:a]asplit=2[voice][sc]")
    filters.append(
        "[bg][sc]sidechaincompress="
        "threshold=0.015:ratio=4:attack=200:release=1200:makeup=1"
        "[ducked]"
    )
    filters.append(
        "[voice][ducked]amix=inputs=2:duration=first:weights='1 1'[audio]"
    )

# ── FFmpeg command ────────────────────────────────────────────────────────────
cmd = [
    "ffmpeg", "-y",
    "-i", str(video_path),
    "-i", str(music_path),
    "-filter_complex", ";".join(filters),
    "-map", "0:v",
    "-map", "[audio]",
    "-c:v", "copy",          # video copied — zero quality loss
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    str(out_path),
]

print("Running FFmpeg...")
result = subprocess.run(cmd, capture_output=True, text=True)

if result.returncode == 0:
    size = out_path.stat().st_size
    print(f"\n✓ Done: {out_path}")
    print(f"  Size: {size/1024/1024:.0f} MB")
    print(f"\n  → Upload this file directly to YouTube.")
else:
    print("FFmpeg error:")
    for line in result.stderr.split("\n")[-30:]:
        print(" ", line)
    sys.exit(1)
