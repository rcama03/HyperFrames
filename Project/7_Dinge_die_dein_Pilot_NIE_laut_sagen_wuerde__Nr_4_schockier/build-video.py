# -*- coding: utf-8 -*-
"""
build-video.py  --  HyperFrames local assembler
Usage:
    python build-video.py "C:\\Videos\\your-original-video.mp4"

Output:
    output_final.mp4 with:
      - Glassmorphism info cards    (bottom-left, per scene)
      - Word-by-word gold captions  (bottom-centre, synced to voiceover)
      - Voiceover audio
      - Background music w/ auto-ducking (drops when voice plays, rises in silence)
      - Source bitrate preserved
"""

import json, os, re, shutil, subprocess, sys

# ── ffmpeg paths ──────────────────────────────────────────────────────────────
FFMPEG_HINT  = r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffmpeg.exe"
FFPROBE_HINT = r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffprobe.exe"

def find_bin(name, hint):
    if os.path.exists(hint):
        return hint
    found = shutil.which(name)
    if found:
        return found
    print("ERROR: {} not found.".format(name))
    sys.exit(1)

FFMPEG  = find_bin("ffmpeg",  FFMPEG_HINT)
FFPROBE = find_bin("ffprobe", FFPROBE_HINT)

# ── shared style ──────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
SHARED_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "packages", "shared"))
sys.path.insert(0, SHARED_DIR)
from hf_style import build_ass


# ── helpers ───────────────────────────────────────────────────────────────────
def parse_script(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    blocks = re.split(r"\[SZENE\s+(\d+)[^\]]*\]", content)
    scenes = {}
    i = 1
    while i < len(blocks) - 1:
        scenes[int(blocks[i])] = blocks[i + 1].strip()
        i += 2
    return scenes


def probe_resolution(src):
    p = subprocess.run(
        [FFPROBE, "-v", "quiet", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", src],
        capture_output=True, text=True
    )
    if p.returncode != 0 or not p.stdout.strip():
        print("Could not probe video resolution.")
        sys.exit(1)
    w, h = p.stdout.strip().split(",")
    return int(w), int(h)


def probe_bitrate(src):
    p = subprocess.run(
        [FFPROBE, "-v", "quiet", "-select_streams", "v:0",
         "-show_entries", "stream=bit_rate", "-of", "csv=p=0", src],
        capture_output=True, text=True
    )
    val = p.stdout.strip()
    if val and val != "N/A":
        return int(val)
    p2 = subprocess.run(
        [FFPROBE, "-v", "quiet", "-show_entries", "format=bit_rate",
         "-of", "csv=p=0", src],
        capture_output=True, text=True
    )
    val2 = p2.stdout.strip()
    if val2 and val2 != "N/A":
        return int(val2)
    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python build-video.py <source-video.mp4>")
        sys.exit(1)

    src = os.path.abspath(sys.argv[1])
    if not os.path.exists(src):
        print("File not found: " + src)
        sys.exit(1)

    timing_f  = os.path.join(BASE_DIR, "timing.json")
    script_f  = os.path.join(BASE_DIR, "script_german.txt")
    audio_f   = os.path.join(BASE_DIR, "full_voiceover.mp3")
    bgm_f     = os.path.join(BASE_DIR, "background_music.mp3")
    ass_f     = os.path.join(BASE_DIR, "subtitles.ass")
    output    = os.path.join(BASE_DIR, "output_final.mp4")
    has_bgm   = os.path.exists(bgm_f)

    # ── Probe source ─────────────────────────────────────────────────────────
    width, height = probe_resolution(src)
    src_bitrate   = probe_bitrate(src)
    if src_bitrate:
        video_args = ["-b:v", str(src_bitrate), "-maxrate", str(src_bitrate),
                      "-bufsize", str(src_bitrate * 2)]
        print("Source: {}x{}  {:.1f} Mbps (output will match)".format(
            width, height, src_bitrate / 1e6))
    else:
        video_args = ["-crf", "16"]
        print("Source: {}x{}  (bitrate unknown, using CRF 16)".format(width, height))

    # ── Build ASS subtitles ───────────────────────────────────────────────────
    with open(timing_f, encoding="utf-8") as f:
        timing = json.load(f)
    script_texts = parse_script(script_f)

    scenes_for_ass = [
        {"text": script_texts.get(sc["scene_id"], ""),
         "start": sc["start"], "end": sc["end"]}
        for sc in timing
    ]
    with open(ass_f, "w", encoding="utf-8") as f:
        f.write(build_ass(scenes_for_ass, width=width, height=height))
    print("Subtitles -> subtitles.ass")

    # ── Inputs ───────────────────────────────────────────────────────────────
    # 0=video  1=voiceover  2..N+1=card PNGs  [N+2=bgm if present]
    inputs = ["-i", src, "-i", audio_f]
    for sc in timing:
        inputs += ["-i", os.path.join(BASE_DIR, sc["card_png"])]
    bgm_idx = len(timing) + 2
    if has_bgm:
        # stream_loop -1 loops BGM indefinitely so it always covers full video
        inputs += ["-stream_loop", "-1", "-i", bgm_f]
        print("Background music: background_music.mp3  (auto-ducking ON)")
    else:
        print("Background music: none")

    # ── Video filter chain ────────────────────────────────────────────────────
    filter_parts = []
    prev = "[0:v]"
    for i, sc in enumerate(timing):
        card_idx = i + 2
        nxt = "[vc{}]".format(i)
        filter_parts.append(
            "[{}:v]scale={}:{},format=rgba[c{}]".format(card_idx, width, height, i)
        )
        filter_parts.append(
            "{}[c{}]overlay=0:0:enable='between(t,{},{})'{}" .format(
                prev, i, sc["start"], sc["end"], nxt
            )
        )
        prev = nxt

    # Burn ASS subtitles (escape path for Windows)
    ass_ff = ass_f.replace("\\", "/")
    drive, rest = ass_ff.split(":/", 1)
    ass_ff = drive + "\\:/" + rest
    filter_parts.append(
        "{}subtitles='{}':force_style='FontName=Montserrat'[vout]".format(prev, ass_ff)
    )

    # ── Audio filter chain ────────────────────────────────────────────────────
    if has_bgm:
        # Duck BGM using voiceover as sidechain:
        #   threshold=0.015 : trigger ducking when voice exceeds ~1.5% amplitude
        #   ratio=20        : compress 20:1 (aggressive duck)
        #   attack=150      : duck starts in 150 ms
        #   release=800     : fade back over 800 ms
        #   volume=0.15     : BGM sits at 15% before ducking (subtle background)
        filter_parts += [
            "[{}:a]volume=0.15,aresample=44100[bgm]".format(bgm_idx),
            "[1:a]aresample=44100,asplit=2[vo1][vo2]",
            "[bgm][vo2]sidechaincompress=threshold=0.015:ratio=20:"
            "attack=150:release=800:makeup=1[ducked]",
            "[vo1][ducked]amix=inputs=2:duration=first:weights=1 1[aout]",
        ]
        audio_map = ["-map", "[aout]"]
        audio_codec = ["-c:a", "aac", "-b:a", "192k"]
    else:
        audio_map  = ["-map", "1:a"]
        audio_codec = ["-c:a", "copy"]

    filtergraph = ";".join(filter_parts)

    # ── Final command ─────────────────────────────────────────────────────────
    cmd = (
        [FFMPEG, "-y"]
        + inputs
        + ["-filter_complex", filtergraph]
        + ["-map", "[vout]"]
        + audio_map
        + ["-c:v", "libx264"]
        + video_args
        + ["-preset", "slow", "-pix_fmt", "yuv420p"]
        + audio_codec
        + ["-movflags", "+faststart", output]
    )

    print("\nBuilding final video...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("ERROR:\n" + result.stderr[-3000:])
        sys.exit(1)

    size_mb = os.path.getsize(output) / 1024 / 1024
    print("\nDone!  output_final.mp4  ({:.1f} MB)  -- ready for YouTube.".format(size_mb))


if __name__ == "__main__":
    main()
