"""
build-video.py  --  HyperFrames local assembler
Usage:
    python3 build-video.py "C:\\Videos\\your-original-video.mp4"

Requirements:
    - ffmpeg in PATH  (https://ffmpeg.org/download.html)
    - This script lives next to timing.json and the cards/ folder
      (clone https://github.com/rcama03/HyperFrames and cd into
       projects/pilot-secrets-de)

Output:
    output_final.mp4  --  YouTube-ready, CRF 18, audio zero-loss
"""

import json
import os
import subprocess
import sys


def run(cmd, desc=""):
    print(("[ffmpeg] " + desc) if desc else "[ffmpeg] " + " ".join(str(c) for c in cmd[:4]) + " ...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("ERROR:\n" + result.stderr[-2000:])
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 build-video.py <path-to-original-video.mp4>")
        sys.exit(1)

    src_video = os.path.abspath(sys.argv[1])
    if not os.path.exists(src_video):
        print("File not found: " + src_video)
        sys.exit(1)

    base_dir   = os.path.dirname(os.path.abspath(__file__))
    timing_f   = os.path.join(base_dir, "timing.json")
    audio_src  = os.path.join(base_dir, "full_voiceover.mp3")
    output     = os.path.join(base_dir, "output_final.mp4")

    with open(timing_f, encoding="utf-8") as f:
        scenes = json.load(f)

    # Probe source video resolution
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-select_streams", "v:0",
         "-show_entries", "stream=width,height",
         "-of", "csv=p=0", src_video],
        capture_output=True, text=True
    )
    if probe.returncode != 0 or not probe.stdout.strip():
        print("Could not probe video resolution -- is ffprobe installed?")
        sys.exit(1)
    width, height = probe.stdout.strip().split(",")
    print("Source resolution: {}x{}".format(width, height))

    # Build the complex filtergraph:
    #   For each scene: overlay its card PNG during [start, end],
    #   scaled to match source resolution, alpha-blended at 0.82 opacity.
    filter_parts = []
    inputs       = ["-i", src_video, "-i", audio_src]

    for i, sc in enumerate(scenes):
        card_path = os.path.join(base_dir, sc["card_png"])
        inputs += ["-i", card_path]

    # Input 0 = video, 1 = audio, 2..N+1 = card PNGs
    # Chain overlays sequentially: v0 -> overlay(card2) -> overlay(card3) -> ...
    chain = "[0:v]"
    for i, sc in enumerate(scenes):
        card_idx = i + 2  # inputs offset
        start    = sc["start"]
        end      = sc["end"]
        next_lbl = "[vout]" if i == len(scenes) - 1 else "[v{}]".format(i + 1)
        prev_lbl = chain if i == 0 else "[v{}]".format(i)
        # Scale card to source res, then overlay with enable window
        filter_parts.append(
            "[{}:v]scale={}:{},format=rgba,colorchannelmixer=aa=0.82[card{}]".format(
                card_idx, width, height, i
            )
        )
        filter_parts.append(
            "{}[card{}]overlay=0:0:enable='between(t,{},{}){}".format(
                prev_lbl, i, start, end, next_lbl
            )
        )
        chain = next_lbl  # not used after last, but harmless

    filtergraph = ";".join(filter_parts)

    cmd = (
        ["ffmpeg", "-y"]
        + inputs
        + [
            "-filter_complex", filtergraph,
            "-map", "[vout]",
            "-map", "1:a",          # use provided voiceover
            "-c:v", "libx264",
            "-crf", "18",
            "-preset", "slow",
            "-pix_fmt", "yuv420p",  # YouTube compatibility
            "-c:a", "copy",         # zero-loss audio
            "-movflags", "+faststart",
            output,
        ]
    )

    print("\nBuilding final video...")
    print("  Source : " + src_video)
    print("  Audio  : " + audio_src)
    print("  Output : " + output)
    print("  CRF    : 18 (near-lossless)")
    print()

    run(cmd, "compositing {} scenes onto video".format(len(scenes)))
    size_mb = os.path.getsize(output) / 1024 / 1024
    print("\nDone!  output_final.mp4  ({:.1f} MB)".format(size_mb))
    print("Ready to upload to YouTube.")


if __name__ == "__main__":
    main()
