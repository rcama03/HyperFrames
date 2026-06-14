#!/usr/bin/env python3
"""
Assembles the umstieg-de video using FFmpeg.
WM 2026 Umsteigefluege Frankfurt Muenchen Berlin — der komplette Guide
"""
import json
import subprocess
import sys
from pathlib import Path

HERE   = Path(__file__).parent
SHARED = HERE.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

SRC_VIDEO  = sys.argv[1] if len(sys.argv) > 1 else str(HERE / "source-video.mp4")
VOICE_MP3  = sys.argv[2] if len(sys.argv) > 2 else str(HERE / "voiceover.mp3")
OUT_VIDEO  = str(HERE / "output" / (Path(SRC_VIDEO).stem + "-final.mp4"))
MANIFEST   = HERE / "card-manifest.json"
WORDS_JSON = HERE / "word-timings.json"
SWOOSH     = HERE / "swoosh.mp3"
MUSIC      = SHARED / "music" / "sleep-music-chris-haugen.mp3"

MUSIC_VOL  = 0.20
SWOOSH_VOL = 1.0

ZOOM_SCALE   = 1.10
ZOOM_DUR     = 0.15
SHAKE_MARGIN = 15
SHAKE_PX     = 12
SHAKE_DUR    = 0.7
BAR_H        = 8
BAR_COLOR    = "0xFFB300"

SRC_OFFSET = 0.0

# Chapter card inTimes (scaled) — no intro hook card
ZOOM_TIMES  = [65.8, 142.8, 206.0]
# Dramatic moments: hook stat + Berlin hub reveal + price spike finale
SHAKE_TIMES = [2.5, 206.0, 519.1]

Path(OUT_VIDEO).parent.mkdir(parents=True, exist_ok=True)

for label, path in [("Source video", SRC_VIDEO), ("Voiceover", VOICE_MP3),
                    ("Music", MUSIC), ("Swoosh", SWOOSH), ("Manifest", MANIFEST)]:
    if not Path(path).exists():
        print(f"ERROR: {label} not found: {path}")
        sys.exit(1)

probe_v = json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", SRC_VIDEO],
    capture_output=True, text=True).stdout)
probe_a = json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", VOICE_MP3],
    capture_output=True, text=True).stdout)

video_stream = next(s for s in probe_v["streams"] if s["codec_type"] == "video")
WIDTH        = video_stream["width"]
HEIGHT       = video_stream["height"]
VIDEO_DUR    = float(probe_v["format"]["duration"])
VOICE_DUR    = float(probe_a["format"]["duration"])
DURATION     = min(VIDEO_DUR - SRC_OFFSET, VOICE_DUR)

_fr = video_stream.get("r_frame_rate", "25/1").split("/")
FPS = int(_fr[0]) // int(_fr[1])

print(f"Source : {Path(SRC_VIDEO).name}  {WIDTH}x{HEIGHT}  {VIDEO_DUR:.1f}s  {FPS}fps")
print(f"Voice  : {Path(VOICE_MP3).name}  {VOICE_DUR:.1f}s  (trimmed to {DURATION:.1f}s)")
print(f"Output : {DURATION:.1f}s")

from hf_style import build_ass
words_data = json.loads(Path(WORDS_JSON).read_text(encoding="utf-8"))
words = words_data["entries"] if "entries" in words_data else words_data

timing_end = words[-1]["end"]
if abs(timing_end - VOICE_DUR) > 0.5:
    scale = VOICE_DUR / timing_end
    print(f"Caption sync  : scaling timestamps by {scale:.6f} ({timing_end:.2f}s -> {VOICE_DUR:.2f}s)")
    for w in words:
        w["start"] = round(w["start"] * scale, 4)
        w["end"]   = round(w["end"]   * scale, 4)

for w in words:
    if "word" not in w and "text" in w:
        w["word"] = w["text"]
words = [w for w in words if w["start"] < DURATION]

ass_content = build_ass(words, width=WIDTH, height=HEIGHT, words_per_line=3)
ass_path = HERE / "output" / "captions.ass"
ass_path.write_text(ass_content, encoding="utf-8")
print(f"Captions: {len(words)} words -> {ass_path.name}")

manifest = json.loads(Path(MANIFEST).read_text())
cards    = manifest["cards"]
for c in cards:
    p = Path(c["path"])
    if not p.is_absolute():
        c["path"] = str(HERE / p)
n_cards = len(cards)

inputs = ["-ss", str(SRC_OFFSET), "-i", SRC_VIDEO, "-i", VOICE_MP3]
for c in cards:
    inputs += ["-i", c["path"]]
music_idx  = 2 + n_cards
swoosh_idx = music_idx + 1
bar_idx    = swoosh_idx + 1
inputs += ["-i", str(MUSIC), "-i", str(SWOOSH),
           "-f", "lavfi", "-i", f"color=c={BAR_COLOR}:size={WIDTH}x{BAR_H}:rate={FPS}"]

vf = []
current = "[0:v]"

vf.append(f"{current}ass={ass_path}[v_caps]")
current = "[v_caps]"

for idx, card in enumerate(cards):
    card_stream = idx + 2
    out_label   = f"[v{idx}]"
    vf.append(
        f"{current}[{card_stream}:v]overlay=0:0:"
        f"enable='between(t,{card['inTime']},{card['outTime']})':"
        f"format=auto{out_label}"
    )
    current = out_label

fade_out_start = DURATION - 1.5
vf.append(f"{current}fade=t=out:st={fade_out_start:.3f}:d=1.5[v_base]")
current = "[v_base]"

ZW = int(WIDTH  * ZOOM_SCALE)
ZH = int(HEIGHT * ZOOM_SCALE)
ZX = (ZW - WIDTH)  // 2
ZY = (ZH - HEIGHT) // 2
zoom_cond = "+".join(f"between(t,{t},{t+ZOOM_DUR})" for t in ZOOM_TIMES)
vf.append(f"{current}split[v_main][v_zsrc]")
vf.append(f"[v_zsrc]scale={ZW}:{ZH},crop={WIDTH}:{HEIGHT}:{ZX}:{ZY}[v_zoomed]")
vf.append(f"[v_main][v_zoomed]overlay=0:0:enable='({zoom_cond})'[v_zoom]")
current = "[v_zoom]"

SW = WIDTH  + 2 * SHAKE_MARGIN
SH = HEIGHT + 2 * SHAKE_MARGIN

def _shake_axis(phase_offset):
    parts = []
    for t in SHAKE_TIMES:
        parts.append(
            f"if(between(t,{t},{t+SHAKE_DUR}),"
            f"{SHAKE_PX}*sin(80*(t-{t})+{phase_offset}),0)"
        )
    offset = "+".join(parts) if parts else "0"
    return f"{SHAKE_MARGIN}+({offset})"

sx = _shake_axis(0)
sy = _shake_axis(1.5)
vf.append(
    f"{current}scale={SW}:{SH},"
    f"crop={WIDTH}:{HEIGHT}:x='{sx}':y='{sy}'[v_shake]"
)
current = "[v_shake]"

TOTAL_FRAMES = DURATION * FPS
vf.append(
    f"[{bar_idx}:v]scale=w='max(1,{WIDTH}*n/{TOTAL_FRAMES:.3f})':h={BAR_H}:eval=frame[bar_grow]"
)
vf.append(f"{current}[bar_grow]overlay=0:0:format=auto[vout]")

af = []
fade_dur = min(3.0, DURATION * 0.03)

af.append(
    f"[{music_idx}:a]aloop=loop=-1:size=2147483647,"
    f"atrim=duration={DURATION:.3f},"
    f"afade=t=in:st=0:d={fade_dur},"
    f"afade=t=out:st={DURATION - fade_dur:.3f}:d={fade_dur},"
    f"volume={MUSIC_VOL}[bg_raw]"
)

af.append(f"[1:a]atrim=end={DURATION:.3f},asplit=2[voice_out][voice_sc]")
af.append(
    "[bg_raw][voice_sc]sidechaincompress="
    "threshold=0.015:ratio=4:attack=200:release=1200:makeup=1[bg_ducked]"
)

af.append(
    f"[{swoosh_idx}:a]asplit={n_cards}"
    + "".join(f"[sw_raw{i}]" for i in range(n_cards))
)
for i, card in enumerate(cards):
    delay_ms = int(card["inTime"] * 1000)
    af.append(
        f"[sw_raw{i}]atrim=start=0.033:duration=0.95,"
        f"adelay={delay_ms}|{delay_ms},"
        f"volume={SWOOSH_VOL}[sw{i}]"
    )

sw_labels = "".join(f"[sw{i}]" for i in range(n_cards))
n_mix     = 2 + n_cards
af.append(
    f"[voice_out][bg_ducked]{sw_labels}"
    f"amix=inputs={n_mix}:duration=first:normalize=0:weights=1 1"
    + " 0.8" * n_cards
    + "[audio_out]"
)

filter_complex = ";".join(vf + af)

cmd = (
    ["ffmpeg", "-y"]
    + inputs
    + [
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "[audio_out]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "27",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-t", f"{DURATION:.3f}",
        OUT_VIDEO,
    ]
)

print(f"\nRunning FFmpeg...\nOutput -> {OUT_VIDEO}\n")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    size = Path(OUT_VIDEO).stat().st_size
    print(f"Done: {OUT_VIDEO}")
    print(f"  Size: {size/1024/1024:.0f} MB  ({WIDTH}x{HEIGHT}, CRF 23)")
else:
    print("FFmpeg error:")
    for line in result.stderr.split("\n")[-40:]:
        print(" ", line)
    sys.exit(1)
