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
need(LOGO_PNG,  'render-logo.js');
need(CARD_WEBM, 'render-card.js');
console.log('  ✓ logo_watermark.png');
console.log('  ✓ subscribe_card_overlay.webm');

// ── Step 1 — Background music ─────────────────────

const tmp1 = tmpFile('1_music');
console.log('\n' + SEP);
console.log(`  Step 1/3 — Background music`);
console.log(`  Music volume: ${(musicVol*100).toFixed(0)}% (ducked under voiceover)`);

run('add-music', [
  '-y',
  '-i', inputVideo,
  '-stream_loop', '-1', '-i', musicFile,
  '-filter_complex',
  `[1:a]volume=${musicVol}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[a]`,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  tmp1
]);
console.log('  ✓ Music added');

// ── Step 2 — Logo watermark ───────────────────────

const tmp2 = tmpFile('2_logo');
const LOGO_SIZE  = 120;
const LOGO_ALPHA = 0.5;
const MARGIN     = 24;

console.log('\n' + SEP);
console.log(`  Step 2/3 — Logo watermark`);
console.log(`  ${LOGO_SIZE}px · ${LOGO_ALPHA*100}% opacity · bottom-right corner`);

run('add-logo', [
  '-y',
  '-i', tmp1, '-i', LOGO_PNG,
  '-filter_complex',
  `[1:v]scale=${LOGO_SIZE}:${LOGO_SIZE},format=rgba,colorchannelmixer=aa=${LOGO_ALPHA}[logo];[0:v][logo]overlay=W-w-${MARGIN}:H-h-${MARGIN}`,
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
  '-c:a', 'copy',
  tmp2
]);
console.log('  ✓ Logo watermark added');

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
