#!/usr/bin/env python3
"""
Produce a <100 MB web-deliverable copy of a final video so it can be pushed to
GitHub (which rejects regular files over 100 MB) and shared as a raw link.

Two-pass H.264, target ~92 MB regardless of length, keeps source resolution.
The full-quality CRF-18 master is never touched.

Usage:  compress-for-web.py <input.mp4> [output.mp4]
Default output: <input dir>/<stem>-web.mp4
"""
import json, subprocess, sys
from pathlib import Path

TARGET_MB    = 92          # safety margin under GitHub's 100 MB limit
AUDIO_KBPS   = 128

src = Path(sys.argv[1])
if not src.exists():
    print(f"ERROR: input not found: {src}"); sys.exit(1)
out = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_name(src.stem + "-web.mp4")

dur = float(json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(src)],
    capture_output=True, text=True).stdout)["format"]["duration"])

# total bitrate budget (kbps) for TARGET_MB over `dur` seconds, minus audio
total_kbps = (TARGET_MB * 8192) / dur          # MB->kbit, /s
video_kbps = max(300, int(total_kbps - AUDIO_KBPS))
print(f"Input  : {src.name}  ({src.stat().st_size/1024/1024:.0f} MB, {dur:.0f}s)")
print(f"Target : {TARGET_MB} MB  ->  video {video_kbps}k + audio {AUDIO_KBPS}k (2-pass)")

passlog = str(out.with_suffix(".passlog"))
common = ["-c:v", "libx264", "-b:v", f"{video_kbps}k", "-preset", "medium",
          "-pix_fmt", "yuv420p", "-passlogfile", passlog]

p1 = ["ffmpeg", "-y", "-i", str(src), *common, "-pass", "1", "-an",
      "-f", "mp4", "/dev/null"]
p2 = ["ffmpeg", "-y", "-i", str(src), *common, "-pass", "2",
      "-c:a", "aac", "-b:a", f"{AUDIO_KBPS}k", "-movflags", "+faststart", str(out)]

for n, cmd in [("pass 1", p1), ("pass 2", p2)]:
    print(f"\n[{n}] running...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"{n} failed:\n" + "\n".join(r.stderr.split("\n")[-25:])); sys.exit(1)

for ext in (".passlog-0.log", ".passlog-0.log.mbtree", ".passlog"):
    Path(str(out.with_suffix("")) + ext).unlink(missing_ok=True)

mb = out.stat().st_size / 1024 / 1024
print(f"\n{'✓' if mb < 100 else '⚠'} {out}  ({mb:.0f} MB)")
if mb >= 100:
    print("WARNING: still >= 100 MB — lower TARGET_MB and retry."); sys.exit(2)
