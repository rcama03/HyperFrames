#!/usr/bin/env python3
"""
Generate word-level timings from an audio file using OpenAI Whisper.

Outputs a JSON array of {text, start, end} objects compatible with the
HyperFrames TRANSCRIPT format used in captions compositions.

Usage:
    # Transcribe audio directly (auto-detects language):
    python generate-timings.py full_voiceover.mp3

    # Forced alignment against an existing script (much more accurate):
    pip install stable-ts
    python generate-timings.py full_voiceover.mp3 --script script.txt --language de

    # Specify output file:
    python generate-timings.py full_voiceover.mp3 --script script.txt -o timings.json
"""

import sys
import json
import os
import argparse


def load_script(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


def generate_forced_alignment(audio_path: str, script_text: str, language: str, model_size: str) -> list:
    """Align existing script text to audio using stable-ts forced alignment."""
    try:
        import stable_whisper
    except ImportError:
        print("stable-ts not found. Install it with: pip install stable-ts")
        print("Falling back to Whisper transcription with script as prompt...")
        return generate_transcription(audio_path, language, model_size, initial_prompt=script_text[:500])

    print(f"Loading {model_size} model via stable-ts for forced alignment...")
    model = stable_whisper.load_model(model_size)

    print(f"Aligning audio to script (language={language})...")
    result = model.align(audio_path, script_text, language=language)

    words = []
    for segment in result.segments:
        for w in segment.words:
            text = w.word.strip()
            if text:
                words.append({
                    "text": text,
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                })
    return words


def generate_transcription(audio_path: str, language: str, model_size: str, initial_prompt: str = None) -> list:
    """Transcribe audio with Whisper and extract word-level timestamps."""
    import whisper

    print(f"Loading Whisper {model_size} model...")
    model = whisper.load_model(model_size)

    kwargs = {"word_timestamps": True}
    if language:
        kwargs["language"] = language
    if initial_prompt:
        kwargs["initial_prompt"] = initial_prompt

    print(f"Transcribing: {audio_path}")
    result = model.transcribe(audio_path, **kwargs)

    words = []
    for segment in result.get("segments", []):
        for w in segment.get("words", []):
            text = w["word"].strip()
            if text:
                words.append({
                    "text": text,
                    "start": round(w["start"], 3),
                    "end": round(w["end"], 3),
                })
    return words


def main():
    parser = argparse.ArgumentParser(
        description="Generate word-level timings for HyperFrames captions.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("audio", help="Audio file (mp3, wav, m4a, ...)")
    parser.add_argument("-o", "--output", help="Output JSON file (default: <audio>_timings.json)")
    parser.add_argument("--script", help="Text script file — enables forced alignment (requires: pip install stable-ts)")
    parser.add_argument("--language", default="de", help="Language code, e.g. de, en, fr (default: de)")
    parser.add_argument("--model", default="base", choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size (default: base). Use 'small' or 'medium' for better accuracy.")
    args = parser.parse_args()

    if not os.path.isfile(args.audio):
        print(f"Error: audio file not found: {args.audio}")
        sys.exit(1)

    if args.script and not os.path.isfile(args.script):
        print(f"Error: script file not found: {args.script}")
        sys.exit(1)

    output_path = args.output
    if not output_path:
        base = os.path.splitext(os.path.basename(args.audio))[0]
        output_path = os.path.join(os.path.dirname(args.audio) or ".", f"{base}_timings.json")

    if args.script:
        script_text = load_script(args.script)
        print(f"Script loaded: {len(script_text.split())} words")
        words = generate_forced_alignment(args.audio, script_text, args.language, args.model)
    else:
        words = generate_transcription(args.audio, args.language, args.model)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)

    print(f"Done — wrote {len(words)} word timings to: {output_path}")


if __name__ == "__main__":
    main()
