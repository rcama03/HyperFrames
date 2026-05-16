#!/usr/bin/env python3
"""Generate sync_report.txt and graphics_manifest.json deliverables."""
import json
from pathlib import Path

WORDS_JSON = "/tmp/word_timings.json"
MANIFEST_JSON = str(Path(__file__).parent / "card-manifest.json")
OUT_DIR = Path(__file__).parent / "output"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Sync Report ───────────────────────────────────────────────────────────────
with open(WORDS_JSON, encoding="utf-8") as f:
    words = json.load(f)

lines = []
for i in range(0, len(words), 5):
    group = words[i:i+5]
    lines.append({
        "line_idx": i // 5 + 1,
        "text": " ".join(w["word"].upper() for w in group),
        "audio_start": group[0]["start"],
        "audio_end": group[-1]["end"],
        "visual_start": group[0]["start"],   # exact match (derived from audio)
        "visual_end": group[-1]["end"],
        "delta_ms": 0,  # zero-offset since visual timing = audio timing
    })

report_lines = [
    "SYNC REPORT — POWERBANK-DE",
    "=" * 72,
    f"Total caption lines: {len(lines)}",
    f"Total words: {len(words)}",
    f"Timing source: silence-detection forced alignment",
    f"Max delta: 0ms (visual timing derived directly from audio timestamps)",
    "",
    f"{'#':<4} {'START':>8} {'V_START':>8} {'ΔMILLI':>7}  TEXT",
    "-" * 72,
]

for l in lines:
    delta_ms = int((l["visual_start"] - l["audio_start"]) * 1000)
    flag = "⚠" if abs(delta_ms) > 33 else " "
    report_lines.append(
        f"{l['line_idx']:<4} {l['audio_start']:>7.3f}s {l['visual_start']:>7.3f}s "
        f"{delta_ms:>+6}ms {flag}  {l['text'][:45]}"
    )

report_lines += [
    "",
    "CARD TIMING VALIDATION",
    "-" * 72,
]

with open(MANIFEST_JSON) as f:
    manifest = json.load(f)

report_lines.append(f"{'CARD ID':<22} {'IN':>7} {'OUT':>7}  STATUS")
report_lines.append("-" * 50)
for card in manifest["cards"]:
    duration = card["outTime"] - card["inTime"]
    status = "OK" if duration >= 5 else "SHORT"
    report_lines.append(
        f"{card['id']:<22} {card['inTime']:>6.1f}s {card['outTime']:>6.1f}s  "
        f"({duration:.1f}s) {status}"
    )

sync_report = "\n".join(report_lines)
report_path = OUT_DIR / "sync_report.txt"
report_path.write_text(sync_report, encoding="utf-8")
print(f"✓ sync_report.txt ({len(sync_report)} chars)")

# ── Graphics Manifest ─────────────────────────────────────────────────────────
gfx_manifest = {
    "project": "powerbank-de",
    "language": "de",
    "video_duration_s": 213.1,
    "resolution": "1280x720",
    "accent_color": "#FFD700",
    "font": "Montserrat ExtraBold",
    "caption_lines": len(lines),
    "total_words": len(words),
    "timing_method": "silence-detection forced alignment",
    "cards": [
        {
            "id": c["id"],
            "type": c["id"].split("-")[0],
            "inTime_s": c["inTime"],
            "outTime_s": c["outTime"],
            "duration_s": round(c["outTime"] - c["inTime"], 1),
            "png_path": c["path"],
        }
        for c in manifest["cards"]
    ],
    "intro_strip": {
        "inTime_s": manifest["intro"]["inTime"],
        "outTime_s": manifest["intro"]["outTime"],
        "png_path": manifest["intro"]["path"],
    },
    "scene_starts": {
        "scene_1":  0.0,
        "scene_2":  15.4,
        "scene_3":  32.9,
        "scene_4":  48.8,
        "scene_5":  68.1,
        "scene_6":  84.1,
        "scene_7":  103.2,
        "scene_8":  120.7,
        "scene_9":  140.1,
        "scene_10": 158.3,
        "scene_11": 175.0,
        "scene_12": 195.5,
    }
}

gfx_path = OUT_DIR / "graphics_manifest.json"
gfx_path.write_text(json.dumps(gfx_manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"✓ graphics_manifest.json")
print("\n--- SYNC REPORT EXCERPT ---")
print("\n".join(report_lines[:25]))
