#!/usr/bin/env python3
"""
Add background music to a composited HyperFrames video.

Usage:
  python3 add-music.py input-final.mp4
  python3 add-music.py input-final.mp4 --music /path/to/your-track.mp3

If --music is not provided, uses the built-in copyright-free ambient pad
from packages/shared/music/ambient-pad.mp3

The music is:
  - Mixed at ~15% volume under the voiceover
  - Auto-ducked via sidechain compression when voice is detected
    (music lowers smoothly during speech, rises back during pauses)
  - Fades in over the first 3 seconds
  - Fades out over the last 3 seconds
  - Looped automatically if shorter than the video

Output: same folder as input, filename gains '-music' suffix.

Free music alternatives to the built-in pad:
  - YouTube Audio Library: studio.youtube.com/channel/music
  - Free Music Archive: freemusicarchive.org (CC licensed)
  - Pixabay Music: pixabay.com/music (fully free, no attribution)
  - Mixkit: mixkit.co/free-stock-music (free for YouTube)
"""
import subprocess
import sys
import argparse
from pathlib import Path

HERE = Path(__file__).parent

# ── Args ──────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Add background music to a video")
parser.add_argument("video", help="Input video file (composited, with voiceover)")
parser.add_argument("--music", default=None,
                    help="Path to music file (MP3/WAV/FLAC). "
                         "Defaults to built-in ambient pad.")
parser.add_argument("--volume", type=float, default=0.14,
                    help="Music volume 0.0–1.0 relative to voice (default: 0.14)")
parser.add_argument("--no-duck", action="store_true",
                    help="Disable auto-ducking (music stays constant volume)")
args = parser.parse_args()

video_path = Path(args.video)
if not video_path.exists():
    print(f"ERROR: Video not found: {video_path}")
    sys.exit(1)

# Default to built-in ambient pad
music_path = Path(args.music) if args.music else (
    HERE.parents[1] / "packages" / "shared" / "music" / "ambient-pad.mp3"
)
if not music_path.exists():
    print(f"ERROR: Music file not found: {music_path}")
    sys.exit(1)

out_path = video_path.parent / (video_path.stem + "-music" + video_path.suffix)
vol = args.volume

print(f"Video : {video_path.name}")
print(f"Music : {music_path.name}  (volume={vol:.0%})")
print(f"Duck  : {'disabled' if args.no_duck else 'enabled (sidechain compress)'}")
print(f"Output: {out_path.name}\n")

# ── Get video duration ────────────────────────────────────────────────────────
probe = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(video_path)],
    capture_output=True, text=True
)
import json
duration = float(json.loads(probe.stdout)["format"]["duration"])
fade_dur = min(3.0, duration * 0.03)   # 3s fade or 3% of duration

# ── Build filter_complex ──────────────────────────────────────────────────────
#
# Signal flow:
#   [1:a] music → loop → trim to video length → fade in/out → volume → [bg]
#   [0:a] voice → [voice]
#   if ducking: [bg][voice] → sidechaincompress → [ducked]
#               [voice][ducked] → amix → [audio]
#   else:       [voice][bg]    → amix with weights → [audio]

filters = []

# Prepare music: loop infinitely then trim to video duration, apply fades
filters.append(
    f"[1:a]aloop=loop=-1:size=2147483647,"
    f"atrim=duration={duration},"
    f"afade=t=in:st=0:d={fade_dur},"
    f"afade=t=out:st={duration - fade_dur}:d={fade_dur},"
    f"volume={vol}"
    f"[bg]"
)

if args.no_duck:
    filters.append("[0:a][bg]amix=inputs=2:duration=first:weights='1 1'[audio]")
else:
    # Sidechain ducking:
    # voice signal drives compression on the music
    # threshold=0.015: music ducks when voice exceeds ~1.5% amplitude
    # ratio=4:1 compression, 200ms attack (smooth), 1200ms release (smooth restore)
    filters.append("[0:a]asplit=2[voice][sc]")
    filters.append(
        f"[bg][sc]sidechaincompress="
        f"threshold=0.015:ratio=4:attack=200:release=1200:makeup=1"
        f"[ducked]"
    )
    filters.append("[voice][ducked]amix=inputs=2:duration=first:weights='1 1'[audio]")

filter_str = ";".join(filters)

# ── FFmpeg command ────────────────────────────────────────────────────────────
cmd = [
    "ffmpeg", "-y",
    "-i", str(video_path),
    "-i", str(music_path),
    "-filter_complex", filter_str,
    "-map", "0:v",           # video from original (no re-encode)
    "-map", "[audio]",
    "-c:v", "copy",          # copy video stream — zero quality loss
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
