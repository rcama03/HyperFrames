#!/usr/bin/env python3
import json
import re
import subprocess
from pathlib import Path

PROJECT   = Path(__file__).parent
VIDEO_IN  = PROJECT / 'source-video.mp4'
VOICE_IN  = PROJECT / 'voiceover.mp3'
SWOOSH_IN = PROJECT / 'swoosh.mp3'
SRT_SRC   = '/root/.claude/uploads/bf195af2-7fab-5825-a36f-49fc2b3be335/0ac7e353-captions.srt'
SRT_SCALED = PROJECT / 'output/captions-scaled.srt'
MANIFEST  = PROJECT / 'card-frames/manifest.json'
VIDEO_OUT = PROJECT / 'output/source-video-final.mp4'

VIDEO_DUR  = 586.920
VOICE_DUR  = 586.896
DURATION   = VOICE_DUR

SRT_END    = 603.07
CAP_SCALE  = VOICE_DUR / SRT_END   # 0.973181

W, H       = 1920, 1080
BAR_H      = 8
FPS        = 25
TOTAL_FRAMES = int(DURATION * FPS)
CRF        = 28

ZOOM_TIMES   = [87.05, 170.47, 261.81, 349.35, 426.32, 513.10]
SHAKE_TIMES  = [2.5, 261.81, 513.10]
SWOOSH_TIMES = [87.05, 170.47, 261.81, 349.35, 426.32, 513.10,
                64.19, 186.39, 278.09, 308.26]

# ── SRT helpers ───────────────────────────────────────────────────────────────
def srt_to_secs(ts):
    h, m, s = ts.replace(',', '.').split(':')
    return int(h)*3600 + int(m)*60 + float(s)

def secs_to_srt(s):
    h  = int(s // 3600); s -= h * 3600
    m  = int(s // 60);   s -= m * 60
    ms = int(round((s % 1) * 1000))
    ss = int(s)
    return f'{h:02d}:{m:02d}:{ss:02d},{ms:03d}'

def parse_srt(path):
    blocks = re.split(r'\n{2,}', Path(path).read_text(encoding='utf-8').strip())
    entries = []
    for b in blocks:
        lines = b.strip().splitlines()
        if len(lines) < 3:
            continue
        times = lines[1].split(' --> ')
        start = srt_to_secs(times[0].strip())
        end   = srt_to_secs(times[1].strip())
        text  = ' '.join(lines[2:]).strip()
        entries.append((start, end, text))
    return entries

def write_scaled_srt(entries):
    """Group words_per_line=3, scale timings, write SRT file for subtitles filter."""
    groups = []
    buf_words, buf_start, buf_end = [], None, None
    for start, end, text in entries:
        for w in text.split():
            if buf_start is None:
                buf_start = start
            buf_end = end
            buf_words.append(w)
            if len(buf_words) >= 3 or (buf_words and buf_words[-1][-1] in '.!?'):
                groups.append((buf_start * CAP_SCALE, buf_end * CAP_SCALE,
                               ' '.join(buf_words)))
                buf_words, buf_start, buf_end = [], None, None
    if buf_words:
        groups.append((buf_start * CAP_SCALE, buf_end * CAP_SCALE,
                       ' '.join(buf_words)))

    lines = []
    for i, (s, e, txt) in enumerate(groups, 1):
        lines.append(f'{i}\n{secs_to_srt(s)} --> {secs_to_srt(e)}\n{txt}\n')
    SRT_SCALED.parent.mkdir(parents=True, exist_ok=True)
    SRT_SCALED.write_text('\n'.join(lines), encoding='utf-8')
    return len(groups)

# ── Zoom / shake expressions (zoompan uses 'on') ─────────────────────────────
def zoom_expr():
    parts = []
    for t in ZOOM_TIMES:
        f = int(t * FPS); half = 6
        parts.append(
            f"if(between(on,{f},{f+half}),1.0+0.04*(on-{f})/{half},"
            f"if(between(on,{f+half},{f+2*half}),1.04-0.04*(on-{f+half})/{half},"
        )
    parts.append('1.0')
    parts.append(')' * (2 * len(ZOOM_TIMES)))
    return ''.join(parts)

def shake_expr(axis='x'):
    amp = 7 if axis == 'x' else 4
    parts = []
    for t in SHAKE_TIMES:
        f = int(t * FPS); dur = 10
        parts.append(f"if(between(on,{f},{f+dur}),{amp}*sin(6.2832*(on-{f})/{dur}),")
    parts.append('0')
    parts.append(')' * len(SHAKE_TIMES))
    return ''.join(parts)

# ── Build & run ffmpeg ────────────────────────────────────────────────────────
def main():
    raw_entries  = parse_srt(SRT_SRC)
    n_caps       = write_scaled_srt(raw_entries)
    manifest     = json.loads(MANIFEST.read_text())
    cards        = sorted(manifest, key=lambda c: c['inTime'])
    N            = len(cards)
    NS           = len(SWOOSH_TIMES)

    cmd = ['ffmpeg', '-y']
    cmd += ['-ss', '0', '-t', str(DURATION), '-i', str(VIDEO_IN)]
    cmd += ['-i', str(VOICE_IN)]
    cmd += ['-i', str(SWOOSH_IN)]
    for c in cards:
        cmd += ['-i', c['file']]
    cmd += ['-f', 'lavfi', '-i', f'color=c=0x00C8E6:size={W}x{BAR_H}:rate={FPS}']

    bar_idx   = 3 + N
    card_idx0 = 3

    lines = []

    # 1. Base video
    lines.append(
        f'[0:v]trim=0:{DURATION},setpts=PTS-STARTPTS,'
        f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},'
        f'fade=t=in:st=0:d=0.5,fade=t=out:st={DURATION-1.0}:d=1.0[base_raw]'
    )

    # 2. Zoom + shake via zoompan
    lines.append(
        f'[base_raw]zoompan=z=\'{zoom_expr()}\':'
        f'x=\'(iw-iw/zoom)/2+({shake_expr("x")})\':'
        f'y=\'(ih-ih/zoom)/2+({shake_expr("y")})\':'
        f'd=1:fps={FPS}:s={W}x{H}[zoomed]'
    )

    # 3. Card overlays
    prev = 'zoomed'
    for i, c in enumerate(cards):
        out = f'ov{i}'
        lines.append(
            f'[{prev}][{card_idx0+i}:v]overlay=0:0:'
            f'enable=\'between(t,{c["inTime"]},{c["outTime"]})\','
            f'format=yuv420p[{out}]'
        )
        prev = out

    # 4. Captions — single subtitles filter (fast, not 492 drawtext calls)
    srt_path_esc = str(SRT_SCALED).replace(':', '\\:')
    style = ('Fontname=DejaVu Sans Bold,Fontsize=36,PrimaryColour=&H00FFFFFF,'
             'OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=0,'
             'Alignment=2,MarginV=70')
    lines.append(
        f'[{prev}]subtitles={srt_path_esc}:force_style=\'{style}\'[captioned]'
    )

    # 5. Progress bar
    lines.append(
        f'[{bar_idx}:v]scale=w=\'max(1,{W}*n/{TOTAL_FRAMES})\':h={BAR_H}:eval=frame[bar]'
    )
    lines.append(f'[captioned][bar]overlay=0:{H-BAR_H}[with_bar]')

    # 6. Vignette
    lines.append(f'[with_bar]vignette=PI/5[vout]')

    # 7. Audio
    lines.append(f'[0:a]aformat=sample_rates=44100:channel_layouts=stereo[vid_a]')
    lines.append(f'[1:a]aformat=sample_rates=44100:channel_layouts=stereo[vo_a]')
    lines.append(f'[2:a]asplit={NS}' + ''.join(f'[sw_raw{j}]' for j in range(NS)))
    sw_labels = []
    for j, t in enumerate(SWOOSH_TIMES):
        delay_ms = int(t * 1000)
        lines.append(f'[sw_raw{j}]adelay={delay_ms}|{delay_ms},volume=0.35[sw{j}]')
        sw_labels.append(f'[sw{j}]')
    all_a = '[vid_a][vo_a]' + ''.join(sw_labels)
    lines.append(
        f'{all_a}amix=inputs={2+NS}:normalize=0,'
        f'atrim=0:{DURATION},asetpts=PTS-STARTPTS[aout]'
    )

    filter_complex = ';\n'.join(lines)

    cmd += [
        '-filter_complex', filter_complex,
        '-map', '[vout]', '-map', '[aout]',
        '-c:v', 'libx264', '-crf', str(CRF), '-preset', 'medium',
        '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart',
        str(VIDEO_OUT),
    ]

    VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)
    print(f'Running ffmpeg (CRF={CRF}, {N} cards, {n_caps} subtitle entries)...')
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print('STDERR:', result.stderr[-4000:])
        raise RuntimeError('ffmpeg failed')

    size_mb = VIDEO_OUT.stat().st_size / 1024 / 1024
    print(f'Done! {VIDEO_OUT}  ({size_mb:.1f} MB)')

if __name__ == '__main__':
    main()
