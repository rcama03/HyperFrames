/**
 * pipeline.js
 * Full post-production pipeline — runs all steps in order:
 *
 *   assembled video
 *     Step 1 → add background music
 *     Step 2 → add logo watermark (bottom-right, throughout)
 *     Step 3 → add subscribe card (bottom area, captions-safe)
 *     → final output
 *
 * Usage:
 *   node pipeline.js <input.mp4> <music.mp3|wav> [options]
 *
 * Options:
 *   --subscribe-at <seconds>   When to show subscribe card (default: 70% mark)
 *   --captions <file.srt>      External SRT file — rendered on top of card
 *   --music-vol <0-1>          Music volume (default: 0.12)
 *   --output <file.mp4>        Output filename (default: input_final.mp4)
 *
 * Example:
 *   node pipeline.js my_video.mp4 bgm.mp3
 *   node pipeline.js my_video.mp4 bgm.mp3 --subscribe-at 45 --captions subs.srt
 */

const { spawnSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Parse args ────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag, defaultVal) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : defaultVal;
}

const inputVideo  = args[0];
const musicFile   = args[1];
const outputVideo = getArg('--output',
  path.join(path.dirname(inputVideo || '.'),
    path.basename(inputVideo || 'out', '.mp4') + '_final.mp4'));
const subscribeAt = getArg('--subscribe-at', null);
const captionFile = getArg('--captions', null);
const musicVol    = parseFloat(getArg('--music-vol', '0.12'));

if (!inputVideo || !musicFile) {
  console.error('Usage: node pipeline.js <input.mp4> <music.mp3> [options]');
  process.exit(1);
}
for (const f of [inputVideo, musicFile]) {
  if (!fs.existsSync(f)) { console.error(`File not found: ${f}`); process.exit(1); }
}
if (captionFile && !fs.existsSync(captionFile)) {
  console.error(`Captions file not found: ${captionFile}`); process.exit(1);
}

// ── Asset checks ──────────────────────────────────

const SCRIPTS    = __dirname;
const STUDIO     = path.resolve(SCRIPTS, '..');
const LOGO_WEBM  = path.resolve(STUDIO, 'logo_animated_overlay.webm');
const LOGO_PNG   = path.resolve(STUDIO, 'logo_watermark.png');
const CARD_WEBM  = path.resolve(STUDIO, 'subscribe_card_overlay.webm');

function need(file, renderScript) {
  if (!fs.existsSync(file)) {
    console.log(`  Asset missing: ${path.basename(file)}`);
    console.log(`  Running ${renderScript}...`);
    const r = spawnSync('node', [path.join(SCRIPTS, renderScript)], { stdio: 'inherit' });
    if (r.status !== 0) { console.error(`  Failed to render ${file}`); process.exit(1); }
  }
}

// ── Helpers ───────────────────────────────────────

function run(label, ffArgs) {
  console.log(`\n  Running FFmpeg...`);
  const r = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`\n  ✗ ${label} failed`); process.exit(1); }
}

function getVideoDuration(file) {
  const r = spawnSync('ffprobe', [
    '-v','error','-show_entries','format=duration',
    '-of','default=noprint_wrappers=1:nokey=1', file
  ], { encoding: 'utf8' });
  return parseFloat(r.stdout.trim());
}

function hasEmbeddedSubs(file) {
  const r = spawnSync('ffprobe', [
    '-v','error','-select_streams','s',
    '-show_entries','stream=index','-of','csv=p=0', file
  ], { encoding: 'utf8' });
  return r.stdout.trim().length > 0;
}

function tmpFile(suffix) {
  return path.join(path.dirname(outputVideo), `_tmp_pipeline_${suffix}.mp4`);
}

// ── Banner ────────────────────────────────────────

const SEP = '─'.repeat(52);
console.log('\n' + SEP);
console.log('  REISE INSIDER — Post-Production Pipeline');
console.log(SEP);
console.log(`  Input   : ${inputVideo}`);
console.log(`  Music   : ${musicFile} (vol ${(musicVol*100).toFixed(0)}%)`);
console.log(`  Output  : ${outputVideo}`);
if (captionFile) console.log(`  Captions: ${captionFile}`);

// ── Ensure rendered assets exist ──────────────────

console.log('\n[Assets]');
// Prefer animated WebM logo; fall back to static PNG
if (!fs.existsSync(LOGO_WEBM) && !fs.existsSync(LOGO_PNG)) {
  need(LOGO_WEBM, 'render-logo-animated.js');
} else if (!fs.existsSync(LOGO_WEBM)) {
  console.log('  (tip: run render-logo-animated.js for the animated logo)');
}
need(CARD_WEBM, 'render-card.js');
const logoAsset = fs.existsSync(LOGO_WEBM) ? 'logo_animated_overlay.webm' : 'logo_watermark.png';
console.log(`  ✓ ${logoAsset}`);
console.log('  ✓ subscribe_card_overlay.webm');

// ── Step 1 — Background music with auto-ducking ───

const tmp1 = tmpFile('1_music');
console.log('\n' + SEP);
console.log(`  Step 1/3 — Background music`);
console.log(`  Base vol : ${(musicVol*100).toFixed(0)}% during pauses`);
console.log(`  Ducked   : ~${((musicVol/8)*100).toFixed(1)}% under speech  (sidechain 8:1)`);
console.log(`  Fades    : 3s in / 3s out`);

// Video duration needed for fade-out start time
const durProbe = spawnSync('ffprobe', [
  '-v','error','-show_entries','format=duration',
  '-of','default=noprint_wrappers=1:nokey=1', inputVideo
], { encoding: 'utf8' });
const vidDuration = parseFloat(durProbe.stdout.trim());
const fadeOutStart = Math.max(0, vidDuration - 3).toFixed(3);

const musicFilter = [
  `[1:a]volume=${musicVol},aformat=fltp:44100:stereo[music_raw]`,
  `[music_raw][0:a]sidechaincompress=threshold=0.015:ratio=8:attack=5:release=600[ducked]`,
  `[0:a][ducked]amix=inputs=2:duration=first:dropout_transition=2[mixed]`,
  `[mixed]afade=t=in:ss=0:d=3,afade=t=out:st=${fadeOutStart}:d=3[audio_out]`
].join(';');

run('add-music', [
  '-y',
  '-i', inputVideo,
  '-stream_loop', '-1', '-i', musicFile,
  '-filter_complex', musicFilter,
  '-map', '0:v', '-map', '[audio_out]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  tmp1
]);
console.log('  ✓ Music added with ducking + fades');

// ── Step 2 — Logo overlay (animated or static) ───

const tmp2 = tmpFile('2_logo');
const LOGO_SIZE  = 190;   // px — matches the 190px logo diameter
const LOGO_MARGIN = 35;   // px from top-left edges

console.log('\n' + SEP);
console.log(`  Step 2/3 — Logo overlay`);

let logoArgs;
if (fs.existsSync(LOGO_WEBM)) {
  console.log(`  Animated WebM · ${LOGO_SIZE}px · top-left +${LOGO_MARGIN}px`);
  logoArgs = [
    '-y',
    '-i', tmp1,
    '-stream_loop', '-1', '-i', LOGO_WEBM,
    '-filter_complex',
    `[1:v]scale=${LOGO_SIZE}:${LOGO_SIZE}[logo];[0:v][logo]overlay=${LOGO_MARGIN}:${LOGO_MARGIN}`,
    '-shortest',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
    '-c:a', 'copy',
    tmp2
  ];
} else {
  console.log(`  Static PNG · ${LOGO_SIZE}px · 50% opacity · top-left +${LOGO_MARGIN}px`);
  logoArgs = [
    '-y',
    '-i', tmp1, '-i', LOGO_PNG,
    '-filter_complex',
    `[1:v]scale=${LOGO_SIZE}:${LOGO_SIZE},format=rgba,colorchannelmixer=aa=0.5[logo];[0:v][logo]overlay=${LOGO_MARGIN}:${LOGO_MARGIN}`,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
    '-c:a', 'copy',
    tmp2
  ];
}

run('add-logo', logoArgs);
console.log('  ✓ Logo overlay added');

// ── Step 3 — Subscribe card ───────────────────────

console.log('\n' + SEP);
console.log(`  Step 3/3 — Subscribe card`);

// Determine start time
let startSec;
if (subscribeAt !== null) {
  startSec = parseFloat(subscribeAt);
  console.log(`  Card at: ${startSec.toFixed(1)}s (manual)`);
} else {
  const dur = getVideoDuration(tmp2);
  startSec = Math.max(0, dur * 0.7 - 4.25);
  console.log(`  Video: ${dur.toFixed(1)}s → card at ${startSec.toFixed(1)}s (70% mark)`);
}
const endSec = startSec + 8.5;
console.log(`  Visible: ${startSec.toFixed(1)}s → ${endSec.toFixed(1)}s`);

// Caption detection
const externalSRT = captionFile ? path.resolve(captionFile) : null;
const embeddedSubs = !externalSRT && hasEmbeddedSubs(tmp2);
if (externalSRT)   console.log(`  Captions: external SRT → rendered on top`);
else if (embeddedSubs) console.log(`  Captions: embedded → rendered on top`);
else               console.log(`  Captions: none`);

const cardDelay = `[1:v]setpts=PTS+${startSec}/TB[card]`;
const cardOverlay = `[0:v][card]overlay=0:0:enable='between(t,${startSec},${endSec})'[bg]`;

let filterComplex, mapVideo;
if (externalSRT) {
  const esc = externalSRT.replace(/\\/g,'/').replace(/:/g,'\\:');
  filterComplex = `${cardDelay};${cardOverlay};[bg]subtitles='${esc}'[v]`;
  mapVideo = '[v]';
} else if (embeddedSubs) {
  const esc = path.resolve(tmp2).replace(/\\/g,'/').replace(/:/g,'\\:');
  filterComplex = `${cardDelay};${cardOverlay};[bg]subtitles='${esc}'[v]`;
  mapVideo = '[v]';
} else {
  filterComplex = `${cardDelay};[0:v][card]overlay=0:0:enable='between(t,${startSec},${endSec})'`;
  mapVideo = null;
}

const subArgs = ['-y', '-i', tmp2, '-i', CARD_WEBM,
  '-filter_complex', filterComplex];
if (mapVideo) subArgs.push('-map', mapVideo, '-map', '0:a?');
subArgs.push('-c:v','libx264','-preset','fast','-crf','18','-c:a','copy', outputVideo);

run('add-subscribe', subArgs);
console.log('  ✓ Subscribe card added');

// ── Cleanup ───────────────────────────────────────

[tmp1, tmp2].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });

// ── Done ──────────────────────────────────────────

const mb = (fs.statSync(outputVideo).size / 1024 / 1024).toFixed(1);
console.log('\n' + SEP);
console.log(`  ✓ Pipeline complete!`);
console.log(`  Output  : ${outputVideo} (${mb} MB)`);
console.log(SEP + '\n');
