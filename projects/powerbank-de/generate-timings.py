#!/usr/bin/env python3
"""
Generates word-timings.json from a voiceover audio file using Whisper.

Usage:
  pip install openai-whisper
  python3 generate-timings.py full_voiceover.mp3

Output: word-timings.json in the same directory as the audio file.
"""
import json
import sys
from pathlib import Path

try:
    import whisper
except ImportError:
    print("ERROR: openai-whisper not installed.")
    print("Run: pip install openai-whisper")
    sys.exit(1)

if len(sys.argv) < 2:
    print("Usage: python3 generate-timings.py full_voiceover.mp3")
    sys.exit(1)

audio_path = Path(sys.argv[1])
if not audio_path.exists():
    print(f"ERROR: File not found: {audio_path}")
    sys.exit(1)

print(f"Loading Whisper model (medium)...")
model = whisper.load_model("medium")

print(f"Transcribing: {audio_path.name} ...")
result = model.transcribe(
    str(audio_path),
    language="de",
    word_timestamps=True,
    verbose=False,
)

words = []
for segment in result["segments"]:
    for w in segment.get("words", []):
        words.append({
            "word":  w["word"].strip(),
            "start": round(w["start"], 3),
            "end":   round(w["end"],   3),
        })

out_path = audio_path.parent / "word-timings.json"
out_path.write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nDone: {len(words)} words → {out_path}")
print("Upload word-timings.json to continue.")
