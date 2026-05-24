#!/usr/bin/env python3
"""
Automatically add word-highlight captions to a YouTubeBot output folder.

Finds audio/, script_german, and *.mp4 inside the folder, aligns the
script to the audio using stable-ts, then burns captions into the video
with FFmpeg.

Requirements:
    pip install stable-ts
    FFmpeg must be installed and available in PATH (https://ffmpeg.org)

Usage:
    python add_captions.py <video_output_folder>
    python add_captions.py "C:/YouTubeBot/output/My_Video_Title"

Options:
    --model     tiny | base | small | medium | large  (default: base)
    --chunk     words shown on screen at once          (default: 4)
    --fontsize  caption font size                      (default: 72)
    --language  language code                         (default: de)
"""

import sys
import os
import json
import glob
import subprocess
import argparse


# ── File discovery ────────────────────────────────────────────────────────────

def find_audio(folder: str) -> str:
    """Find the main voiceover audio file."""
    audio_dir = os.path.join(folder, "audio")
    for search_dir in [audio_dir, folder]:
        for ext in ["*.mp3", "*.wav", "*.m4a", "*.aac", "*.ogg"]:
            matches = glob.glob(os.path.join(search_dir, ext))
            if matches:
                # Prefer files with "voiceover" or "full" in name
                for m in matches:
                    if any(k in os.path.basename(m).lower() for k in ["voiceover", "full", "voice"]):
                        return m
                return matches[0]
    return None


def find_video(folder: str) -> str:
    """Find the output video (skip already-captioned files)."""
    for f in sorted(glob.glob(os.path.join(folder, "*.mp4"))):
        if "_captioned" not in os.path.basename(f):
            return f
    return None


def find_script(folder: str) -> str:
    """Find the German script file."""
    for name in ["script_german", "script_german.txt", "script_readable", "script.txt", "script"]:
        path = os.path.join(folder, name)
        if os.path.isfile(path):
            return path
    return None


def get_video_dimensions(video_path: str) -> tuple:
    """Get video width and height via ffprobe."""
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0",
        video_path,
    ]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip()
        w, h = out.split(",")
        return int(w), int(h)
    except Exception:
        return 1080, 1920  # default: portrait


# ── Word alignment ────────────────────────────────────────────────────────────

def generate_word_timings(audio_path: str, script_text: str, language: str, model_size: str) -> list:
    """Align script text to audio and return [{text, start, end}] per word."""
    try:
        import stable_whisper
        print(f"  Loading {model_size} model (stable-ts forced alignment)...")
        model = stable_whisper.load_model(model_size)
        print("  Aligning script to audio — this may take a minute...")
        result = model.align(audio_path, script_text, language=language)
        words = []
        for segment in result.segments:
            for w in segment.words:
                text = w.word.strip()
                if text:
                    words.append({"text": text, "start": round(w.start, 3), "end": round(w.end, 3)})
        return words
    except ImportError:
        print("  stable-ts not installed — falling back to Whisper transcription.")
        print("  For better accuracy run: pip install stable-ts")
        import whisper
        print(f"  Loading Whisper {model_size} model...")
        model = whisper.load_model(model_size)
        result = model.transcribe(
            audio_path,
            word_timestamps=True,
            language=language,
            initial_prompt=script_text[:500],
        )
        words = []
        for seg in result.get("segments", []):
            for w in seg.get("words", []):
                text = w["word"].strip()
                if text:
                    words.append({"text": text, "start": round(w["start"], 3), "end": round(w["end"], 3)})
        return words


# ── ASS subtitle generation ───────────────────────────────────────────────────

def _ass_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def make_ass(words: list, width: int, height: int, font_size: int, words_per_chunk: int) -> str:
    """
    Build an ASS subtitle string.
    Each chunk of N words appears together; the active word turns yellow.
    Style: bold white text, black outline, positioned in the lower third.
    """
    margin_v = int(height * 0.12)  # distance from bottom edge

    header = f"""\
[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Arial,{font_size},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,2,0,1,5,2,2,60,60,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    lines = []

    # Split words into fixed-size chunks
    chunks = [words[i:i + words_per_chunk] for i in range(0, len(words), words_per_chunk)]

    for chunk in chunks:
        chunk_end = chunk[-1]["end"]

        for active_idx, active_word in enumerate(chunk):
            word_start = active_word["start"]
            # End this subtitle entry when the next word in the chunk starts
            if active_idx < len(chunk) - 1:
                word_end = chunk[active_idx + 1]["start"]
            else:
                word_end = chunk_end

            # Build display text: active word = yellow, rest = white
            parts = []
            for i, w in enumerate(chunk):
                if i == active_idx:
                    # Yellow: &H00FFFF& in ASS is BGR, so yellow = 00FFFF
                    parts.append(f"{{\\c&H00FFFF&\\b1}}{w['text']}{{\\c&H00FFFFFF&}}")
                else:
                    parts.append(w["text"])
            text = " ".join(parts)

            lines.append(
                f"Dialogue: 0,{_ass_time(word_start)},{_ass_time(word_end)},Cap,,0,0,0,,{text}"
            )

    return header + "\n".join(lines) + "\n"


# ── FFmpeg burn-in ────────────────────────────────────────────────────────────

def burn_captions(video_path: str, ass_path: str, output_path: str) -> bool:
    # On Windows, FFmpeg ass filter needs forward slashes and escaped colons
    ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", f"ass='{ass_escaped}'",
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-c:a", "copy",
        output_path,
    ]
    print("  Running FFmpeg (this takes a while for long videos)...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("\n  FFmpeg error output:")
        print(result.stderr[-2000:])
        return False
    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Burn word-highlight captions into a YouTubeBot output folder.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("folder", help="Path to the video output folder")
    parser.add_argument("--language", default="de", help="Language code (default: de)")
    parser.add_argument("--model", default="base",
                        choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size (default: base)")
    parser.add_argument("--chunk", type=int, default=4, metavar="N",
                        help="Words shown on screen at once (default: 4)")
    parser.add_argument("--fontsize", type=int, default=72,
                        help="Caption font size (default: 72)")
    args = parser.parse_args()

    folder = os.path.abspath(args.folder)
    if not os.path.isdir(folder):
        print(f"Error: folder not found: {folder}")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"Folder : {folder}")
    print(f"{'='*60}")

    # Discover files
    audio_path  = find_audio(folder)
    video_path  = find_video(folder)
    script_path = find_script(folder)

    missing = []
    if not audio_path:  missing.append("audio file (audio/*.mp3)")
    if not video_path:  missing.append("video file (*.mp4)")
    if not script_path: missing.append("script file (script_german)")
    if missing:
        for m in missing:
            print(f"Error: could not find {m}")
        sys.exit(1)

    print(f"Audio  : {os.path.relpath(audio_path, folder)}")
    print(f"Video  : {os.path.basename(video_path)}")
    print(f"Script : {os.path.basename(script_path)}")

    with open(script_path, "r", encoding="utf-8") as f:
        script_text = f.read().strip()
    print(f"Script : {len(script_text.split())} words loaded")

    # Detect video dimensions
    width, height = get_video_dimensions(video_path)
    print(f"Video  : {width}x{height}")

    # Generate word timings
    print(f"\n[1/3] Generating word timings...")
    words = generate_word_timings(audio_path, script_text, args.language, args.model)
    if not words:
        print("Error: no word timings produced — check your audio/script files.")
        sys.exit(1)
    print(f"  {len(words)} words aligned")

    # Save timings JSON
    timings_path = os.path.splitext(video_path)[0] + "_timings.json"
    with open(timings_path, "w", encoding="utf-8") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {os.path.basename(timings_path)}")

    # Generate ASS subtitle file
    print(f"\n[2/3] Building subtitle file...")
    ass_content = make_ass(words, width, height, args.fontsize, args.chunk)
    ass_path = os.path.splitext(video_path)[0] + "_captions.ass"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
    print(f"  Saved: {os.path.basename(ass_path)}")

    # Burn into video
    output_path = os.path.splitext(video_path)[0] + "_captioned.mp4"
    print(f"\n[3/3] Burning captions into video...")
    if burn_captions(video_path, ass_path, output_path):
        size_mb = os.path.getsize(output_path) / 1_000_000
        print(f"\n{'='*60}")
        print(f"Done!  {os.path.basename(output_path)}  ({size_mb:.1f} MB)")
        print(f"{'='*60}\n")
    else:
        print("\nFailed. Make sure FFmpeg is installed: https://ffmpeg.org/download.html")
        sys.exit(1)


if __name__ == "__main__":
    main()
