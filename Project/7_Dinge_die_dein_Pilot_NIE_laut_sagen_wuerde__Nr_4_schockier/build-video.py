# -*- coding: utf-8 -*-
"""
build-video.py  --  HyperFrames local assembler
Usage:
    python build-video.py "C:\\Videos\\your-original-video.mp4"

Output:
    output_final.mp4  -- YouTube-ready, CRF 18, audio zero-loss,
                         word-by-word gold karaoke subtitles
"""

import json
import os
import re
import shutil
import subprocess
import sys

# ── ffmpeg auto-detect ────────────────────────────────────────────────────────
FFMPEG_HINT  = r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffmpeg.exe"
FFPROBE_HINT = r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffprobe.exe"

def find_bin(name, hint):
    if os.path.exists(hint):
        return hint
    found = shutil.which(name)
    if found:
        return found
    print("ERROR: {} not found. Install ffmpeg and add it to PATH.".format(name))
    sys.exit(1)

FFMPEG  = find_bin("ffmpeg",  FFMPEG_HINT)
FFPROBE = find_bin("ffprobe", FFPROBE_HINT)

# ── shared style (packages/shared/hf_style.py) ───────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
SHARED_DIR  = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "packages", "shared"))
sys.path.insert(0, SHARED_DIR)
from hf_style import build_ass


# ── script parser ─────────────────────────────────────────────────────────────
def parse_script(script_path):
    """Return list of {scene_id, text} from script_german.txt."""
    with open(script_path, encoding="utf-8") as f:
        content = f.read()
    blocks = re.split(r"\[SZENE\s+(\d+)[^\]]*\]", content)
    scenes = {}
    i = 1
    while i < len(blocks) - 1:
        scene_id = int(blocks[i])
        text     = blocks[i + 1].strip()
        scenes[scene_id] = text
        i += 2
    return scenes


def main():
    if len(sys.argv) < 2:
        print("Usage: python build-video.py <path-to-original-video.mp4>")
        sys.exit(1)

    src_video = os.path.abspath(sys.argv[1])
    if not os.path.exists(src_video):
        print("File not found: " + src_video)
        sys.exit(1)

    timing_f   = os.path.join(BASE_DIR, "timing.json")
    script_f   = os.path.join(BASE_DIR, "script_german.txt")
    audio_src  = os.path.join(BASE_DIR, "full_voiceover.mp3")
    ass_path   = os.path.join(BASE_DIR, "subtitles.ass")
    output     = os.path.join(BASE_DIR, "output_final.mp4")

    # Probe resolution
    probe = subprocess.run(
        [FFPROBE, "-v", "quiet", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", src_video],
        capture_output=True, text=True
    )
    if probe.returncode != 0 or not probe.stdout.strip():
        print("Could not probe video -- is ffprobe installed?")
        sys.exit(1)
    width, height = probe.stdout.strip().split(",")
    print("Source resolution: {}x{}".format(width, height))

    # Build subtitle data
    with open(timing_f, encoding="utf-8") as f:
        timing = json.load(f)
    script_texts = parse_script(script_f)

    scenes_for_ass = []
    for sc in timing:
        text = script_texts.get(sc["scene_id"], "")
        scenes_for_ass.append({
            "text":  text,
            "start": sc["start"],
            "end":   sc["end"],
        })

    ass_content = build_ass(scenes_for_ass, width=int(width), height=int(height))
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
    print("Subtitles written -> subtitles.ass")

    # FFmpeg: burn subtitles, swap audio
    # Use forward slashes for ass path on Windows (ffmpeg requirement)
    ass_ff = ass_path.replace("\\", "/").replace(":", "\\:")

    cmd = [
        FFMPEG, "-y",
        "-i", src_video,
        "-i", audio_src,
        "-vf", "ass='{}'".format(ass_ff),
        "-map", "0:v",
        "-map", "1:a",
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "slow",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        "-movflags", "+faststart",
        output,
    ]

    print("\nBuilding final video...")
    print("  Source : " + src_video)
    print("  Audio  : " + audio_src)
    print("  Output : " + output)
    print("  Style  : Montserrat Bold, gold karaoke, CRF 18\n")

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("ERROR:\n" + result.stderr[-3000:])
        sys.exit(1)

    size_mb = os.path.getsize(output) / 1024 / 1024
    print("Done!  output_final.mp4  ({:.1f} MB)  -- ready for YouTube.".format(size_mb))


if __name__ == "__main__":
    main()
