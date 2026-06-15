#!/usr/bin/env python3
import json
import re
import subprocess
from pathlib import Path

PROJECT = Path(__file__).parent
VIDEO_IN  = PROJECT / 'source-video.mp4'
VOICE_IN  = PROJECT / 'voiceover.mp3'
SWOOSH_IN = PROJECT / 'swoosh.mp3'
SRT_PATH  = '/root/.claude/uploads/bf195af2-7fab-5825-a36f-49fc2b3be335/0ac7e353-captions.srt'
MANIFEST  = PROJECT / 'card-frames/manifest.json'
VIDEO_OUT = PROJECT / 'output/source-video-final.mp4'

VIDEO_DUR  = 586.920
VOICE_DUR  = 586.896
DURATION   = VOICE_DUR  # 586.896s — no loop needed

SRT_END    = 603.07
CAP_SCALE  = VOICE_DUR / SRT_END  # 0.973181

W, H       = 1920, 1080
BAR_H      = 8
FPS        = 25
TOTAL_FRAMES = int(DURATION * FPS)

CRF        = 23

# Chapter transitions → zoom in
ZOOM_TIMES  = [87.05, 170.47, 261.81, 349.35, 426.32, 513.10]
# Alert/stat transitions → shake
SHAKE_TIMES = [2.5, 261.81, 513.10]
# Swoosh at chapter + alert card inTimes
SWOOSH_TIMES = [87.05, 170.47, 261.81, 349.35, 426.32, 513.10,
                64.19, 186.39, 278.09, 308.26]

# ── Parse SRT, group words_per_line=3, scale timings ─────────────────────────
def srt_to_secs(ts):
    h, m, s = ts.replace(',', '.').split(':')
    return int(h)*3600 + int(m)*60 + float(s)

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

def group_captions(entries, words_per_line=3):
    groups = []
    buf_words, buf_start, buf_end = [], None, None
    for start, end, text in entries:
        words = text.split()
        for w in words:
            if buf_start is None:
                buf_start = start
            buf_end = end
            buf_words.append(w)
            is_sentence_end = w[-1] in '.!?,:;' if w else False
            if len(buf_words) >= words_per_line or is_sentence_end:
                groups.append((buf_start * CAP_SCALE, buf_end * CAP_SCALE,
                               ' '.join(buf_words)))
                buf_words, buf_start, buf_end = [], None, None
    if buf_words:
        groups.append((buf_start * CAP_SCALE, buf_end * CAP_SCALE,
                       ' '.join(buf_words)))
    return groups

# ── Escape text for drawtext ──────────────────────────────────────────────────
def esc(t):
    return (t.replace('\\', '\\\\')
             .replace("'", "\\'")
             .replace(':', '\\:')
             .replace('[', '\\[')
             .replace(']', '\\]'))

# ── Build zoom expression — zoompan uses 'on' (output frame counter), not 'n'
def zoom_expr():
    parts = []
    for t in ZOOM_TIMES:
        f    = int(t * FPS)
        half = 6   # 6 frames ramp-up, 6 ramp-down
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
        f   = int(t * FPS)
        dur = 10  # 10 frames
        parts.append(f"if(between(on,{f},{f+dur}),{amp}*sin(6.2832*(on-{f})/{dur}),")
    parts.append('0')
    parts.append(')' * len(SHAKE_TIMES))
    return ''.join(parts)

# ── Build ffmpeg command ──────────────────────────────────────────────────────
def main():
    raw_entries = parse_srt(SRT_PATH)
    captions    = group_captions(raw_entries, words_per_line=3)
    manifest    = json.loads(MANIFEST.read_text())

    # Sort cards by inTime
    cards = sorted(manifest, key=lambda c: c['inTime'])
    N     = len(cards)           # 24
    NS    = len(SWOOSH_TIMES)    # 10

    # Input indices:
    # 0 = source video
    # 1 = voiceover
    # 2 = swoosh (NS copies declared once, split)
    # 3..3+N-1 = card PNGs
    # 3+N = lavfi progress bar

    cmd = ['ffmpeg', '-y']

    # Video input (trim to DURATION)
    cmd += ['-ss', '0', '-t', str(DURATION), '-i', str(VIDEO_IN)]
    # Voiceover
    cmd += ['-i', str(VOICE_IN)]
    # Swoosh
    cmd += ['-i', str(SWOOSH_IN)]
    # Card PNGs
    for c in cards:
        cmd += ['-i', c['file']]
    # Progress bar lavfi
    cmd += ['-f', 'lavfi', '-i',
            f'color=c=0x00C8E6:size={W}x{BAR_H}:rate={FPS}']

    bar_idx   = 3 + N
    card_idx0 = 3

    # ── filter_complex ──
    lines = []

    # 1. Base video: trim, scale, fade in/out
    lines.append(
        f'[0:v]trim=0:{DURATION},setpts=PTS-STARTPTS,'
        f'scale={W}:{H}:force_original_aspect_ratio=increase,'
        f'crop={W}:{H},'
        f'fade=t=in:st=0:d=0.5,fade=t=out:st={DURATION-1.0}:d=1.0[base_raw]'
    )

    # 2. Zoom punch + shake
    zoom_e   = zoom_expr()
    shake_ex = shake_expr('x')
    shake_ey = shake_expr('y')
    lines.append(
        f'[base_raw]zoompan=z=\'{zoom_e}\':'
        f'x=\'(iw-iw/zoom)/2+({shake_ex})\':'
        f'y=\'(ih-ih/zoom)/2+({shake_ey})\':'
        f'd=1:fps={FPS}:s={W}x{H}[zoomed]'
    )

    # 3. Overlay cards
    prev = 'zoomed'
    for i, c in enumerate(cards):
        ci  = card_idx0 + i
        out = f'ov{i}'
        tin  = c['inTime']
        tout = c['outTime']
        lines.append(
            f'[{prev}][{ci}:v]overlay=0:0:'
            f'enable=\'between(t,{tin},{tout})\','
            f'format=yuv420p[{out}]'
        )
        prev = out

    # 4. Captions with drawtext
    cap_filters = []
    for start, end, text in captions:
        safe = esc(text)
        cap_filters.append(
            f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            f":text='{safe}':fontcolor=white:fontsize=48"
            f":borderw=3:bordercolor=black@0.9"
            f":x=(w-text_w)/2:y=h-120"
            f":enable='between(t,{start:.3f},{end:.3f})'"
        )
    cap_chain = ','.join(cap_filters)
    lines.append(f'[{prev}]{cap_chain}[captioned]')

    # 5. Progress bar
    lines.append(
        f'[{bar_idx}:v]scale='
        f'w=\'max(1,{W}*n/{TOTAL_FRAMES})\':h={BAR_H}:eval=frame[bar]'
    )
    lines.append(
        f'[captioned][bar]overlay=0:{H-BAR_H}[with_bar]'
    )

    # 6. Vignette
    lines.append(
        f'[with_bar]vignette=PI/5[vout]'
    )

    # 7. Audio: video audio + voiceover + swoosh delays
    lines.append(f'[0:a]aformat=sample_rates=44100:channel_layouts=stereo[vid_a]')
    lines.append(f'[1:a]aformat=sample_rates=44100:channel_layouts=stereo[vo_a]')
    lines.append(f'[2:a]asplit={NS}' + ''.join(f'[sw_raw{j}]' for j in range(NS)))

    sw_labels = []
    for j, t in enumerate(SWOOSH_TIMES):
        delay_ms = int(t * 1000)
        vol = 0.35
        lines.append(
            f'[sw_raw{j}]adelay={delay_ms}|{delay_ms},'
            f'volume={vol}[sw{j}]'
        )
        sw_labels.append(f'[sw{j}]')

    all_a = '[vid_a][vo_a]' + ''.join(sw_labels)
    n_inputs = 2 + NS
    lines.append(
        f'{all_a}amix=inputs={n_inputs}:normalize=0,'
        f'atrim=0:{DURATION},asetpts=PTS-STARTPTS[aout]'
    )

    filter_complex = ';\n'.join(lines)

    cmd += [
        '-filter_complex', filter_complex,
        '-map', '[vout]',
        '-map', '[aout]',
        '-c:v', 'libx264',
        '-crf', str(CRF),
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        str(VIDEO_OUT),
    ]

    VIDEO_OUT.parent.mkdir(parents=True, exist_ok=True)

    print(f'Running ffmpeg (CRF={CRF}, {N} cards, {len(captions)} caption groups)...')
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print('STDERR:', result.stderr[-4000:])
        raise RuntimeError('ffmpeg failed')

    size_mb = VIDEO_OUT.stat().st_size / 1024 / 1024
    print(f'Done! Output: {VIDEO_OUT}  ({size_mb:.1f} MB)')

if __name__ == '__main__':
    main()
