#!/usr/bin/env python3
"""
Generate word-level timings from an audio file using OpenAI Whisper.

Outputs a JSON array of {text, start, end} objects compatible with the
HyperFrames TRANSCRIPT format used in captions compositions.

Usage:
    python generate-timings.py <audio_file> [output_file]

If output_file is omitted, writes <audio_file_basename>_timings.json
"""

import sys
import json
import os
import whisper


def generate_timings(audio_path: str, output_path: str) -> None:
    print(f"Loading Whisper model (base)...")
    model = whisper.load_model("base")

    print(f"Transcribing: {audio_path}")
    result = model.transcribe(audio_path, word_timestamps=True)

    words = []
    for segment in result.get("segments", []):
        for word_data in segment.get("words", []):
            text = word_data["word"].strip()
            if text:
                words.append({
                    "text": text,
                    "start": round(word_data["start"], 3),
                    "end": round(word_data["end"], 3),
                })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(words)} word timings to: {output_path}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    audio_path = sys.argv[1]

    if not os.path.isfile(audio_path):
        print(f"Error: file not found: {audio_path}")
        sys.exit(1)

    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        base = os.path.splitext(os.path.basename(audio_path))[0]
        output_path = os.path.join(os.path.dirname(audio_path) or ".", f"{base}_timings.json")

    generate_timings(audio_path, output_path)


if __name__ == "__main__":
    main()
