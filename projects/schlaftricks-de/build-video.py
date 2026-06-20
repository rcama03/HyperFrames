#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from pathlib import Path

PROJECT   = Path(__file__).parent
SHARED    = PROJECT.parents[1] / "packages" / "shared"
sys.path.insert(0, str(SHARED))

VIDEO_IN   = PROJECT / 'source-video.mp4'
VOICE_IN   = PROJECT / 'voiceover.mp3'
SWOOSH_IN  = PROJECT / 'swoosh.mp3'
MANIFEST   = PROJECT / 'card-frames/manifest.json'
MUSIC      = SHARED / 'music' / 'sleep-music-chris-haugen.mp3'
VIDEO_OUT  = PROJECT / 'output/source-video-final.mp4'

VOICE_DUR   = 478.128
DURATION    = VOICE_DUR

MUSIC_VOL   = 0.35
SWOOSH_VOL  = 0.35
SRC_AUD_VOL = 0.30

ZOOM_SCALE  = 1.10
ZOOM_DUR    = 0.15
SHAKE_MARGIN = 15
SHAKE_PX    = 12
SHAKE_DUR   = 0.7
BAR_H       = 6
BAR_COLOR   = "0xFFB300"

W, H        = 1280, 720
FPS         = 25
TOTAL_FRAMES = DURATION * FPS
CRF         = 25

ZOOM_TIMES  = [0.0, 50.6, 124.6, 229.6, 316.2, 410.0]

SHAKE_TIMES = [15, 140, 248, 390]

SWOOSH_CARD_TIMES = [
    0.0, 50.6, 83.7, 103.1, 124.6, 159.6, 192.7, 229.6, 282.2, 316.2,
    15, 60, 140, 390,
    95, 350,
    72, 185, 248,
    155, 172, 210, 335,
    113, 240,
    410, 445,
    57, 148, 395,
]

def _ts_ass(t):
    h = int(t // 3600); m = int((t % 3600) // 60)
    s = int(t % 60);    cs = int((t % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def _build_ass(words, width, height):
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Montserrat,52,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,1.6,0,2,20,20,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    wpl = 3
    for i in range(0, len(words), wpl):
        line = words[i:i+wpl]
        for wi, word in enumerate(line):
            before = " ".join(w["word"].upper() for w in line[:wi])
            cur    = word["word"].upper()
            after  = " ".join(w["word"].upper() for w in line[wi+1:])
            parts  = []
            if before:
                parts.append(r"{\c&H00FFFFFF&}" + before + " ")
            parts.append(r"{\c&H0000D7FF&}" + cur)
            if after:
                parts.append(r"{\c&H00FFFFFF&}" + " " + after)
            text = r"{\bord2\shad0}" + "".join(parts)
            w_start = word["start"]
            w_end   = line[wi+1]["start"] if wi < len(line)-1 else word["end"]
            events.append(f"Dialogue: 0,{_ts_ass(w_start)},{_ts_ass(w_end)},Default,,0,0,0,,{text}")
    return header + "\n".join(events) + "\n"

def srt_to_secs(ts):
    h, m, s = ts.replace(',', '.').split(':')
    return int(h)*3600 + int(m)*60 + float(s)

def srt_to_words(path):
    blocks = re.split(r'\n{2,}', Path(path).read_text(encoding='utf-8').strip())
    words = []
    for b in blocks:
        lines = b.strip().splitlines()
        if len(lines) < 3:
            continue
        times = lines[1].split(' --> ')
        start = srt_to_secs(times[0].strip())
        end   = srt_to_secs(times[1].strip())
        text  = ' '.join(lines[2:]).strip()
        parts = text.split()
        n = len(parts)
        step = (end - start) / n if n else 0
        for i, w in enumerate(parts):
            words.append({"word": w, "start": start + i*step, "end": start + (i+1)*step})
    return words

def main():
    SRT_SRC = '/root/.claude/uploads/bf195af2-7fab-5825-a36f-49fc2b3be335/045cce03-captions.srt'
    raw_words = srt_to_words(SRT_SRC)

    srt_end = raw_words[-1]['end']
    if abs(srt_end - VOICE_DUR) > 0.5:
        scale = VOICE_DUR / srt_end
        print(f"Caption sync: scaling by {scale:.6f} ({srt_end:.2f}s → {VOICE_DUR:.2f}s)")
        for w in raw_words:
            w['start'] = round(w['start'] * scale, 4)
            w['end']   = round(w['end']   * scale, 4)

    words = [w for w in raw_words if w['start'] < DURATION]
    ass_content = _build_ass(words, W, H)
    ass_path = PROJECT / 'output/captions.ass'
    ass_path.parent.mkdir(parents=True, exist_ok=True)
    ass_path.write_text(ass_content, encoding='utf-8')
    print(f"Captions: {len(words)} words → captions.ass")

    manifest = json.loads(MANIFEST.read_text())
    cards    = sorted(manifest, key=lambda c: c['inTime'])
    N        = len(cards)
    NS       = len(SWOOSH_CARD_TIMES)

    cmd = ['ffmpeg', '-y']
    cmd += ['-ss', '0', '-t', str(DURATION), '-i', str(VIDEO_IN)]
    cmd += ['-i', str(VOICE_IN)]
    for c in cards:
        cmd += ['-i', c['file']]
    music_idx  = 2 + N
    swoosh_idx = music_idx + 1
    bar_idx    = swoosh_idx + 1
    cmd += ['-i', str(MUSIC)]
    cmd += ['-i', str(SWOOSH_IN)]
    cmd += ['-f', 'lavfi', '-i', f'color=c={BAR_COLOR}:size={W}x{BAR_H}:rate={FPS}']

    vf = []

    vf.append(
        f'[0:v]trim=0:{DURATION},setpts=PTS-STARTPTS,'
        f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},'
        f'fade=t=in:st=0:d=0.5[v_base]'
    )

    ass_esc = str(ass_path).replace(':', '\\:')
    vf.append(f'[v_base]ass={ass_esc}[v_caps]')

    SLIDE_DUR = 0.3
    def slide_xy(c):
        t0  = c['inTime']
        cid = c.get('type', c['id'].split('-')[0])
        d   = f'(t-{t0})/{SLIDE_DUR}'
        clamp = f'min(1,max(0,{d}))'
        if cid in ('chapter', 'source'):
            return f"x='(-{W}+{W}*{clamp})':y='0'"
        elif cid == 'definition':
            return f"x='0':y='(-{H}+{H}*{clamp})'"
        elif cid in ('stat', 'alert', 'rank'):
            return f"x='({W}-{W}*{clamp})':y='0'"
        else:
            return f"x='0':y='({H}-{H}*{clamp})'"

    prev = '[v_caps]'
    for i, c in enumerate(cards):
        out = f'[ov{i}]'
        vf.append(
            f'{prev}[{2+i}:v]overlay={slide_xy(c)}:'
            f'enable=\'between(t,{c["inTime"]},{c["outTime"]})\':'
            f'format=auto{out}'
        )
        prev = out

    vf.append(f'{prev}fade=t=out:st={DURATION-1.5:.3f}:d=1.5[v_faded]')

    ZW = int(W * ZOOM_SCALE)
    ZH = int(H * ZOOM_SCALE)
    ZX = (ZW - W) // 2
    ZY = (ZH - H) // 2
    zoom_cond = "+".join(f"between(t,{t},{t+ZOOM_DUR})" for t in ZOOM_TIMES)
    vf.append(f'[v_faded]split[v_main][v_zsrc]')
    vf.append(f'[v_zsrc]scale={ZW}:{ZH},crop={W}:{H}:{ZX}:{ZY}[v_zoomed]')
    vf.append(f"[v_main][v_zoomed]overlay=0:0:enable='({zoom_cond})'[v_zoom]")

    SW = W + 2 * SHAKE_MARGIN
    SH = H + 2 * SHAKE_MARGIN
    shake_parts_x, shake_parts_y = [], []
    for t in SHAKE_TIMES:
        shake_parts_x.append(f"if(between(t,{t},{t+SHAKE_DUR}),{SHAKE_PX}*sin(80*(t-{t})+0),0)")
        shake_parts_y.append(f"if(between(t,{t},{t+SHAKE_DUR}),{SHAKE_PX}*sin(80*(t-{t})+1.5),0)")
    sx = f"{SHAKE_MARGIN}+(" + "+".join(shake_parts_x) + ")"
    sy = f"{SHAKE_MARGIN}+(" + "+".join(shake_parts_y) + ")"
    vf.append(f"[v_zoom]scale={SW}:{SH},crop={W}:{H}:x='{sx}':y='{sy}'[v_shake]")

    vf.append(
        f'[{bar_idx}:v]scale=w=\'max(1,{W}*n/{TOTAL_FRAMES:.3f})\':h={BAR_H}:eval=frame[bar]'
    )
    vf.append(f'[v_shake][bar]overlay=0:0:format=auto[vout]')

    af = []
    fade_dur = min(3.0, DURATION * 0.03)

    af.append(
        f'[{music_idx}:a]aloop=loop=-1:size=2147483647,'
        f'atrim=duration={DURATION:.3f},'
        f'afade=t=in:st=0:d={fade_dur},'
        f'afade=t=out:st={DURATION-fade_dur:.3f}:d={fade_dur},'
        f'volume={MUSIC_VOL}[bg_raw]'
    )
    af.append(f'[1:a]atrim=end={DURATION:.3f},asplit=2[voice_out][voice_sc]')
    af.append(
        '[bg_raw][voice_sc]sidechaincompress='
        'threshold=0.03:ratio=3:attack=200:release=800:makeup=1[bg_ducked]'
    )

    af.append(
        f'[0:a]atrim=0:{DURATION:.3f},asetpts=PTS-STARTPTS,'
        f'afade=t=out:st={DURATION-fade_dur:.3f}:d={fade_dur},'
        f'volume={SRC_AUD_VOL}[src_aud]'
    )

    af.append(
        f'[{swoosh_idx}:a]asplit={NS}' + ''.join(f'[sw_raw{j}]' for j in range(NS))
    )
    for j, t in enumerate(SWOOSH_CARD_TIMES):
        delay_ms = int(t * 1000)
        af.append(
            f'[sw_raw{j}]atrim=start=0.033:duration=0.95,'
            f'adelay={delay_ms}|{delay_ms},'
            f'volume={SWOOSH_VOL}[sw{j}]'
        )

    sw_labels = ''.join(f'[sw{j}]' for j in range(NS))
    n_mix = 3 + NS
    af.append(
        f'[voice_out][bg_ducked][src_aud]{sw_labels}'
        f'amix=inputs={n_mix}:normalize=0:duration=first[aout]'
    )

    filter_complex = ';'.join(vf + af)

    cmd += [
        '-filter_complex', filter_complex,
        '-map', '[vout]', '-map', '[aout]',
        '-t', str(DURATION),
        '-c:v', 'libx264', '-crf', str(CRF), '-preset', 'medium',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart',
        str(VIDEO_OUT),
    ]

    VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)
    print(f'Running ffmpeg (CRF={CRF}, {W}x{H}, {N} cards, {len(words)} words)...')
    log = PROJECT / 'output/ffmpeg.log'
    with open(log, 'w') as lf:
        result = subprocess.run(cmd, stderr=lf, stdout=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print('STDERR:', open(log).read()[-4000:])
        raise RuntimeError('ffmpeg failed')

    size_mb = VIDEO_OUT.stat().st_size / 1024 / 1024
    print(f'Done! {VIDEO_OUT}  ({size_mb:.1f} MB)')

if __name__ == '__main__':
    main()
