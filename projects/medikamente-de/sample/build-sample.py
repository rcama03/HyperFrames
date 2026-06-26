#!/usr/bin/env python3
"""
Builds a 45s SAMPLE reel demonstrating the proposed new motion-graphics features
on the medikamente-de footage. Feature checklist (all visible in 45s):

  - Animated intro title (scale + fade in)
  - Animated chapter lower-third (slide-in from left)
  - Number count-up stat card (0 -> 1.000.000, slide-up)
  - Scale-pop alert card
  - Animated outro end-card (subscribe pulse + GitHub link)
  - Ken Burns slow drift (whole clip)
  - Zoom punch-ins
  - Screen shake
  - RGB-split jolt
  - Red vignette pulse (alert moment)
  - Spotlight / dim
  - Whip-pan motion blur transition (synced to swoosh)
  - Karaoke caption wipe (gold sweep)
  - Progress bar with glowing leading edge
  - Swoosh SFX on each element
  - Fade to black ending
"""
import json, subprocess, sys
from pathlib import Path

HERE   = Path(__file__).parent
PROJ   = HERE.parent
SHARED = PROJ.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

SRC_VIDEO = PROJ / "source-video.mp4"
VOICE     = PROJ / "full_voiceover.mp3"
TIMINGS   = PROJ / "timings.json"
SWOOSH    = PROJ / "swoosh.mp3"
MUSIC     = SHARED / "music" / "sleep-music-chris-haugen.mp3"
ANIM      = HERE / "anim"
ANIM_MAN  = HERE / "anim-manifest.json"
OUT       = HERE / "output" / "medikamente-sample-45s.mp4"
OUT.parent.mkdir(parents=True, exist_ok=True)

SAMPLE_DUR = 45.0
W, H, FPS  = 1280, 720, 25

MUSIC_VOL, SWOOSH_VOL, SRC_AUDIO_VOL = 0.18, 0.35, 0.5

# ── element placements on the 45s timeline (start time in seconds) ─────────────
PLACE = {
    "intro":   0.0,
    "chapter": 3.8,
    "alert":   16.0,
    "stat":    32.6,
    "outro":   40.0,
}
ZOOM_TIMES  = [8.0, 36.0]
SHAKE_TIMES = [10.0]
JOLT_TIMES  = [10.0]            # rgb split
VIGNETTE    = (16.0, 19.2)      # red vignette during alert
SPOTLIGHT   = (24.0, 26.3)
WHIP        = (32.3, 32.9)      # motion-blur transition synced to stat swoosh
SWOOSH_AT   = [0.0, 3.8, 16.0, 24.0, 32.6, 40.0]

# ── 1. assemble animated card frame-seqs into transparent .mov (qtrle) ─────────
man = json.loads(ANIM_MAN.read_text())
movs = {}
for el in man["elements"]:
    eid = el["id"]
    mov = HERE / "anim" / f"{eid}.mov"
    cmd = ["ffmpeg", "-y", "-framerate", str(FPS),
           "-i", str(ANIM / eid / "f_%04d.png"),
           "-c:v", "qtrle", "-pix_fmt", "argb", str(mov)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"mov assemble failed for {eid}:\n", r.stderr[-1500:]); sys.exit(1)
    movs[eid] = (mov, el["duration"])
    print(f"  ✓ {eid}.mov ({el['duration']}s)")

# ── 2. karaoke captions (gold sweep) for first 45s ─────────────────────────────
from hf_style import ASS_HEADER_TEMPLATE, ts_ass

# Karaoke: secondary (pre) = dim white, primary (swept) = gold.
KARA_STYLES = (
    "Style: Default,Montserrat,42,&H0000D7FF,&H80FFFFFF,&H00101010,&H00000000,"
    "-1,0,0,0,100,100,0,0,1,1.6,0,2,30,30,55,1"
)

def cs(x):  # seconds -> centiseconds
    return max(1, int(round(x * 100)))

raw = json.loads(TIMINGS.read_text(encoding="utf-8"))
voice_dur = float(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(VOICE)],
    capture_output=True, text=True).stdout and json.loads(subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(VOICE)],
    capture_output=True, text=True).stdout)["format"]["duration"])

words = [{"word": e["text"], "start": e["start"], "end": e["end"]} for e in raw["entries"]]
tend = words[-1]["end"]
scale = voice_dur / tend if abs(tend - voice_dur) > 0.5 else 1.0
for w in words:
    w["start"] *= scale; w["end"] *= scale
words = [w for w in words if w["start"] < SAMPLE_DUR]

header = ASS_HEADER_TEMPLATE.format(width=W, height=H, styles=KARA_STYLES)
events, PER = [], 4
for i in range(0, len(words), PER):
    line = words[i:i + PER]
    l_start, l_end = line[0]["start"], line[-1]["end"]
    chunks = []
    for w in line:
        dur = cs(max(0.08, w["end"] - w["start"]))
        chunks.append(r"{\k%d}%s " % (dur, w["word"].upper()))
    text = r"{\bord1.6\shad0}" + "".join(chunks).rstrip()
    events.append(f"Dialogue: 0,{ts_ass(l_start)},{ts_ass(l_end)},Default,,0,0,0,,{text}")
ass_path = HERE / "output" / "captions-sample.ass"
ass_path.write_text(header + "\n".join(events) + "\n", encoding="utf-8")
print(f"  ✓ karaoke captions: {len(words)} words")

# ── 3. inputs ──────────────────────────────────────────────────────────────────
order = ["intro", "chapter", "alert", "stat", "outro"]
inputs = ["-ss", "0", "-t", f"{SAMPLE_DUR}", "-i", str(SRC_VIDEO),     # 0 video
          "-ss", "0", "-t", f"{SAMPLE_DUR}", "-i", str(VOICE)]        # 1 voice
idx = {}
n = 2
for eid in order:
    mov, _ = movs[eid]
    inputs += ["-itsoffset", f"{PLACE[eid]}", "-i", str(mov)]
    idx[eid] = n; n += 1
music_i  = n; inputs += ["-i", str(MUSIC)];               n += 1
swoosh_i = n; inputs += ["-i", str(SWOOSH)];              n += 1
bar_i    = n; inputs += ["-f", "lavfi", "-i", f"color=c=0xFFB300:size={W}x8:rate={FPS}"]; n += 1
spot_i   = n; inputs += ["-i", str(ANIM / "spotlight.png")]; n += 1
glow_i   = n; inputs += ["-i", str(ANIM / "glow.png")];      n += 1

vf = []

# Ken Burns slow drift (scale 1.08, pan diagonally across the clip)
KW, KH = int(W * 1.08), int(H * 1.08)
vf.append(f"[0:v]scale={KW}:{KH},"
          f"crop={W}:{H}:x='({KW}-{W})*(t/{SAMPLE_DUR})':y='({KH}-{H})*(0.5+0.4*t/{SAMPLE_DUR})',"
          f"setsar=1[base]")
cur = "[base]"

# RGB-split jolt
jolt = "+".join(f"between(t,{t},{t+0.18})" for t in JOLT_TIMES)
vf.append(f"{cur}rgbashift=rh=-6:bh=6:enable='({jolt})'[v_jolt]"); cur = "[v_jolt]"

# Red vignette pulse during alert
vf.append(f"{cur}vignette=angle=PI/3:enable='between(t,{VIGNETTE[0]},{VIGNETTE[1]})'[v_vig]"); cur = "[v_vig]"

# Whip-pan motion blur transition (gblur toggled on during the window)
vf.append(f"{cur}gblur=sigma=22:steps=2:enable='between(t,{WHIP[0]},{WHIP[1]})'[v_whip]"); cur = "[v_whip]"

# Karaoke captions
vf.append(f"{cur}ass={ass_path}[v_caps]"); cur = "[v_caps]"

# Spotlight / dim
vf.append(f"[{spot_i}:v]format=rgba[spot]")
vf.append(f"{cur}[spot]overlay=0:0:enable='between(t,{SPOTLIGHT[0]},{SPOTLIGHT[1]})':format=auto[v_spot]"); cur = "[v_spot]"

# Animated card movs (each enabled over its window)
for eid in order:
    st, dur = PLACE[eid], movs[eid][1]
    vf.append(f"{cur}[{idx[eid]}:v]overlay=0:0:enable='between(t,{st},{st+dur})':format=auto[v_{eid}]")
    cur = f"[v_{eid}]"

# Zoom punch-ins
ZW, ZH = int(W * 1.10), int(H * 1.10)
ZX, ZY = (ZW - W) // 2, (ZH - H) // 2
zc = "+".join(f"between(t,{t},{t+0.15})" for t in ZOOM_TIMES)
vf.append(f"{cur}split[zm][zs]")
vf.append(f"[zs]scale={ZW}:{ZH},crop={W}:{H}:{ZX}:{ZY}[zd]")
vf.append(f"[zm][zd]overlay=0:0:enable='({zc})'[v_zoom]"); cur = "[v_zoom]"

# Screen shake
SM, SPX, SDUR = 15, 12, 0.7
SW, SH = W + 2 * SM, H + 2 * SM
def axis(ph):
    p = "+".join(f"if(between(t,{t},{t+SDUR}),{SPX}*sin(80*(t-{t})+{ph}),0)" for t in SHAKE_TIMES) or "0"
    return f"{SM}+({p})"
vf.append(f"{cur}scale={SW}:{SH},crop={W}:{H}:x='{axis(0)}':y='{axis(1.5)}'[v_shake]"); cur = "[v_shake]"

# Progress bar + glowing leading edge
TF = SAMPLE_DUR * FPS
vf.append(f"[{bar_i}:v]scale=w='max(1,{W}*n/{TF:.3f})':h=8:eval=frame[bar]")
vf.append(f"{cur}[bar]overlay=0:0:format=auto[v_bar]"); cur = "[v_bar]"
vf.append(f"{cur}[{glow_i}:v]overlay=x='{W}*t/{SAMPLE_DUR}-30':y=-11:format=auto[v_glow]"); cur = "[v_glow]"

# Fade to black
vf.append(f"{cur}fade=t=out:st={SAMPLE_DUR-1.5:.3f}:d=1.5[vout]")

# ── audio ──────────────────────────────────────────────────────────────────────
af = []
fd = 2.0
af.append(f"[0:a]atrim=end={SAMPLE_DUR},volume={SRC_AUDIO_VOL}[src_a]")
af.append(f"[{music_i}:a]aloop=loop=-1:size=2147483647,atrim=duration={SAMPLE_DUR},"
          f"afade=t=in:st=0:d={fd},afade=t=out:st={SAMPLE_DUR-fd}:d={fd},volume={MUSIC_VOL}[bg_raw]")
af.append(f"[1:a]atrim=end={SAMPLE_DUR},asplit=2[voice_out][voice_sc]")
af.append("[bg_raw][voice_sc]sidechaincompress=threshold=0.015:ratio=4:attack=200:release=1200:makeup=1[bg]")
ns = len(SWOOSH_AT)
af.append(f"[{swoosh_i}:a]asplit={ns}" + "".join(f"[sr{i}]" for i in range(ns)))
for i, t in enumerate(SWOOSH_AT):
    ms = int(t * 1000)
    af.append(f"[sr{i}]atrim=start=0.033:duration=0.95,adelay={ms}|{ms},volume={SWOOSH_VOL}[sw{i}]")
sw = "".join(f"[sw{i}]" for i in range(ns))
nmix = 3 + ns
af.append(f"[voice_out][bg][src_a]{sw}amix=inputs={nmix}:normalize=0:duration=first:"
          f"weights=1 1 0.7" + " 0.8" * ns + "[aout]")

fc = ";".join(vf + af)
cmd = (["ffmpeg", "-y"] + inputs +
       ["-filter_complex", fc, "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        "-t", f"{SAMPLE_DUR}", str(OUT)])

print("\nRunning FFmpeg (sample)...")
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode == 0:
    mb = OUT.stat().st_size / 1024 / 1024
    print(f"\n✓ {OUT}  ({mb:.0f} MB, {W}x{H}, {SAMPLE_DUR}s, CRF 18)")
else:
    print("FFmpeg error:")
    print("\n".join(r.stderr.split("\n")[-45:]))
    sys.exit(1)
