#!/usr/bin/env python3
"""
Assembles the medikamente-de video using FFmpeg.

Features:
  - Source video with original transition audio preserved
  - Word-level gold-highlight captions (ASS) — mobile-first
  - ANIMATED motion graphics cards (slide-in, scale-pop, count-up)
  - Animated intro title + outro end-card (subscribe)
  - Swoosh SFX on every card appearance
  - Background music with auto-ducking
  - Zoom punch-ins on chapter cards (1.1x snap)
  - Screen shake on dramatic stat moments
  - Amber progress bar (top edge)
  - End fade to black (last 1.5s)
"""
import json
import subprocess
import sys
from pathlib import Path

HERE   = Path(__file__).parent
SHARED = HERE.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

SRC_VIDEO  = sys.argv[1] if len(sys.argv) > 1 else str(HERE / "source-video.mp4")
VOICE_MP3  = sys.argv[2] if len(sys.argv) > 2 else str(HERE / "full_voiceover.mp3")
OUT_VIDEO  = str(HERE / "output" / (Path(SRC_VIDEO).stem + "-final.mp4"))
ANIM_MAN   = HERE / "anim-manifest.json"
WORDS_JSON = HERE / "timings.json"
SWOOSH     = HERE / "swoosh.mp3"
MUSIC      = SHARED / "music" / "sleep-music-chris-haugen.mp3"
ANIM_DIR   = HERE / "anim"

MUSIC_VOL  = 0.19
SWOOSH_VOL = 0.35
SRC_AUDIO_VOL = 0.55

ZOOM_SCALE  = 1.10
ZOOM_DUR    = 0.15
SHAKE_MARGIN = 15
SHAKE_PX    = 12
SHAKE_DUR   = 0.7
BAR_H       = 8
BAR_COLOR   = "0xFFB300"

# Chapter starts — zoom punch-ins
ZOOM_TIMES  = [0.5, 54.0, 110.0, 166.0]
# Dramatic stat moments — screen shake (340%, DREIFACHE, TÄGLICH, DREISSIG Min)
SHAKE_TIMES = [31.5, 53.5, 144.1, 223.0]

# Intro/outro timing
INTRO_START = 0.0
INTRO_DUR   = 3.0
OUTRO_DUR   = 4.5   # placed at end of video

Path(OUT_VIDEO).parent.mkdir(parents=True, exist_ok=True)

for label, path in [("Source video", SRC_VIDEO), ("Voiceover", VOICE_MP3),
                    ("Music", MUSIC), ("Swoosh", SWOOSH), ("Anim manifest", ANIM_MAN)]:
    if not Path(path).exists():
        print(f"ERROR: {label} not found: {path}")
        sys.exit(1)

# ── Probe ─────────────────────────────────────────────────────────────────────
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
DURATION     = VOICE_DUR
_fr          = video_stream.get("r_frame_rate", "30/1").split("/")
FPS          = int(_fr[0]) // int(_fr[1])

print(f"Source : {Path(SRC_VIDEO).name}  {WIDTH}x{HEIGHT}  {VIDEO_DUR:.1f}s")
print(f"Voice  : {Path(VOICE_MP3).name}  {VOICE_DUR:.1f}s")
print(f"Output : {DURATION:.1f}s  ({WIDTH}x{HEIGHT}, CRF 18)")

# ── Captions ──────────────────────────────────────────────────────────────────
from hf_style import ASS_HEADER_TEMPLATE, ts_ass

MOBILE_ASS_STYLES = """\
Style: Default,Montserrat,42,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1.5,0,2,30,30,55,1
Style: Highlight,Montserrat,42,&H0000D7FF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1.5,0,2,30,30,55,1"""

def build_ass_mobile(words, width=1280, height=720, words_per_line=4):
    header = ASS_HEADER_TEMPLATE.format(width=width, height=height, styles=MOBILE_ASS_STYLES)
    events = []
    for i in range(0, len(words), words_per_line):
        line = words[i : i + words_per_line]
        for wi, word in enumerate(line):
            before = " ".join(w["word"].upper() for w in line[:wi])
            cur    = word["word"].upper()
            after  = " ".join(w["word"].upper() for w in line[wi + 1:])
            parts = []
            if before:
                parts.append(r"{\c&H00FFFFFF&\alpha&H33&}" + before + " ")
            parts.append(r"{\c&H0000D7FF&\alpha&H00&}" + cur)
            if after:
                parts.append(r"{\c&H00FFFFFF&\alpha&H33&}" + " " + after)
            text = r"{\bord1\shad0}" + "".join(parts)
            w_start = word["start"]
            if wi < len(line) - 1:
                w_end = line[wi + 1]["start"]
            else:
                w_end = word["end"]
            events.append(
                f"Dialogue: 0,{ts_ass(w_start)},{ts_ass(w_end)}"
                f",Default,,0,0,0,,{text}"
            )
    return header + "\n".join(events) + "\n"

raw_timings = json.loads(WORDS_JSON.read_text(encoding="utf-8"))
if isinstance(raw_timings, dict) and "entries" in raw_timings:
    words = [{"word": e["text"], "start": e["start"], "end": e["end"]} for e in raw_timings["entries"]]
elif isinstance(raw_timings, list):
    words = raw_timings
else:
    words = raw_timings

timing_end = words[-1]["end"]
if abs(timing_end - VOICE_DUR) > 0.5:
    scale = VOICE_DUR / timing_end
    print(f"Caption sync  : scaling timestamps by {scale:.6f} ({timing_end:.2f}s -> {VOICE_DUR:.2f}s)")
    for w in words:
        w["start"] = round(w["start"] * scale, 4)
        w["end"]   = round(w["end"]   * scale, 4)

words = [w for w in words if w["start"] < DURATION]

ass_content = build_ass_mobile(words, width=WIDTH, height=HEIGHT, words_per_line=4)
ass_path = HERE / "output" / "captions.ass"
ass_path.write_text(ass_content, encoding="utf-8")
print(f"Captions: {len(words)} words -> {ass_path.name}")

# ── Assemble animated card frames into transparent .mov (qtrle) ──────────────
man = json.loads(ANIM_MAN.read_text())
movs = {}
for el in man["elements"]:
    eid = el["id"]
    mov = ANIM_DIR / f"{eid}.mov"
    cmd = ["ffmpeg", "-y", "-framerate", str(FPS),
           "-i", str(ANIM_DIR / eid / "f_%04d.png"),
           "-c:v", "qtrle", "-pix_fmt", "argb", str(mov)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"mov assemble failed for {eid}:\n", r.stderr[-1500:]); sys.exit(1)
    movs[eid] = el
    print(f"  ✓ {eid}.mov ({el['duration']}s)")

# Separate card elements from special elements (intro/outro)
card_elements = [e for e in man["elements"] if "inTime" in e]
special_elements = [e for e in man["elements"] if "inTime" not in e]

# Apply time scaling to card elements if needed
if abs(timing_end - VOICE_DUR) > 0.5:
    ts = VOICE_DUR / timing_end
    for c in card_elements:
        c["inTime"]  = round(c["inTime"]  * ts, 3)
        c["outTime"] = round(c["outTime"] * ts, 3)

n_cards = len(card_elements)

# Outro starts near end of voice
OUTRO_START = DURATION - OUTRO_DUR - 0.5

# ── Inputs ────────────────────────────────────────────────────────────────────
inputs = ["-i", SRC_VIDEO, "-i", VOICE_MP3]

# Card animated movs (with itsoffset for each card's start time)
for c in card_elements:
    inputs += ["-itsoffset", f"{c['inTime']}", "-i", str(ANIM_DIR / f"{c['id']}.mov")]

# Intro mov
intro_idx = 2 + n_cards
inputs += ["-itsoffset", f"{INTRO_START}", "-i", str(ANIM_DIR / "intro.mov")]

# Outro mov
outro_idx = intro_idx + 1
inputs += ["-itsoffset", f"{OUTRO_START}", "-i", str(ANIM_DIR / "outro.mov")]

music_idx  = outro_idx + 1
swoosh_idx = music_idx + 1
bar_idx    = swoosh_idx + 1
inputs += ["-i", str(MUSIC), "-i", str(SWOOSH),
           "-f", "lavfi", "-i", f"color=c={BAR_COLOR}:size={WIDTH}x{BAR_H}:rate={FPS}"]

# ── Video filter chain ────────────────────────────────────────────────────────
vf = []
current = "[0:v]"

if VIDEO_DUR < DURATION:
    pad_frames = int((DURATION - VIDEO_DUR) * FPS) + FPS
    vf.append(f"{current}tpad=stop={pad_frames}:stop_mode=clone[v_padded]")
    current = "[v_padded]"

vf.append(f"{current}ass={ass_path}[v_caps]")
current = "[v_caps]"

# Overlay intro
intro_end = INTRO_START + INTRO_DUR
vf.append(
    f"{current}[{intro_idx}:v]overlay=0:0:"
    f"enable='between(t,{INTRO_START},{intro_end})':format=auto:eof_action=pass[v_intro]"
)
current = "[v_intro]"

# Overlay all animated card movs
for idx_i, card in enumerate(card_elements):
    stream = idx_i + 2
    out_label = f"[v_c{idx_i}]"
    vf.append(
        f"{current}[{stream}:v]overlay=0:0:"
        f"enable='between(t,{card['inTime']},{card['outTime']})':"
        f"format=auto:eof_action=pass{out_label}"
    )
    current = out_label

# Overlay outro
outro_end = OUTRO_START + OUTRO_DUR
vf.append(
    f"{current}[{outro_idx}:v]overlay=0:0:"
    f"enable='between(t,{OUTRO_START},{outro_end})':format=auto:eof_action=pass[v_outro]"
)
current = "[v_outro]"

fade_out_start = DURATION - 1.5
vf.append(f"{current}fade=t=out:st={fade_out_start:.3f}:d=1.5[v_base]")
current = "[v_base]"

# ── Zoom punch-ins ────────────────────────────────────────────────────────────
ZW = int(WIDTH  * ZOOM_SCALE)
ZH = int(HEIGHT * ZOOM_SCALE)
ZX = (ZW - WIDTH)  // 2
ZY = (ZH - HEIGHT) // 2

if abs(timing_end - VOICE_DUR) > 0.5:
    scaled_zoom = [round(t * (VOICE_DUR / timing_end), 3) for t in ZOOM_TIMES]
else:
    scaled_zoom = ZOOM_TIMES

zoom_cond = "+".join(f"between(t,{t},{t+ZOOM_DUR})" for t in scaled_zoom)
vf.append(f"{current}split[v_main][v_zsrc]")
vf.append(f"[v_zsrc]scale={ZW}:{ZH},crop={WIDTH}:{HEIGHT}:{ZX}:{ZY}[v_zoomed]")
vf.append(f"[v_main][v_zoomed]overlay=0:0:enable='({zoom_cond})'[v_zoom]")
current = "[v_zoom]"

# ── Screen shake ──────────────────────────────────────────────────────────────
SW = WIDTH  + 2 * SHAKE_MARGIN
SH = HEIGHT + 2 * SHAKE_MARGIN

if abs(timing_end - VOICE_DUR) > 0.5:
    scaled_shake = [round(t * (VOICE_DUR / timing_end), 3) for t in SHAKE_TIMES]
else:
    scaled_shake = SHAKE_TIMES

def _shake_axis(phase_offset):
    parts = []
    for t in scaled_shake:
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

# ── Gold progress bar ─────────────────────────────────────────────────────────
TOTAL_FRAMES = DURATION * FPS
vf.append(
    f"[{bar_idx}:v]scale=w='max(1,{WIDTH}*n/{TOTAL_FRAMES:.3f})':h={BAR_H}:eval=frame[bar_grow]"
)
vf.append(f"{current}[bar_grow]overlay=0:0:format=auto[vout]")

# ── Audio filter chain ────────────────────────────────────────────────────────
af = []
fade_dur = min(3.0, DURATION * 0.03)

if VIDEO_DUR < DURATION:
    af.append(f"[0:a]apad=whole_dur={DURATION:.3f},volume={SRC_AUDIO_VOL}[src_audio]")
else:
    af.append(f"[0:a]atrim=end={DURATION:.3f},volume={SRC_AUDIO_VOL}[src_audio]")

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

# Swoosh for each card + intro + outro
swoosh_times = [c["inTime"] for c in card_elements] + [INTRO_START, OUTRO_START]
n_swoosh = len(swoosh_times)

af.append(
    f"[{swoosh_idx}:a]asplit={n_swoosh}"
    + "".join(f"[sw_raw{i}]" for i in range(n_swoosh))
)
for i, t in enumerate(swoosh_times):
    delay_ms = int(t * 1000)
    af.append(
        f"[sw_raw{i}]atrim=start=0.033:duration=0.95,"
        f"adelay={delay_ms}|{delay_ms},"
        f"volume={SWOOSH_VOL}[sw{i}]"
    )

sw_labels = "".join(f"[sw{i}]" for i in range(n_swoosh))
n_mix     = 3 + n_swoosh
af.append(
    f"[voice_out][bg_ducked][src_audio]{sw_labels}"
    f"amix=inputs={n_mix}:normalize=0:duration=first:weights=1 1 0.7"
    + " 0.8" * n_swoosh
    + "[audio_out]"
)

# ── FFmpeg ────────────────────────────────────────────────────────────────────
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
        "-crf", "18",
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
    print(f"\n✓ Done: {OUT_VIDEO}")
    print(f"  Size: {size/1024/1024:.0f} MB  ({WIDTH}x{HEIGHT}, CRF 18)")
else:
    print("FFmpeg error:")
    for line in result.stderr.split("\n")[-40:]:
        print(" ", line)
    sys.exit(1)
