/**
 * overlay-card.js
 * Composites subscribe_card_overlay.webm onto an MP4.
 * Captions are NEVER covered — subtitle streams are rendered last (on top of card).
 *
 * Usage:
 *   node overlay-card.js <input.mp4> <output.mp4> [start_seconds] [captions.srt]
 *
 *   start_seconds — when to show the card (default: auto, placed at ~70% through video)
 *   captions.srt  — optional external SRT file; if omitted, embedded subs are used if present
 *
 * Examples:
 *   node overlay-card.js video.mp4 output.mp4
 *   node overlay-card.js video.mp4 output.mp4 45
 *   node overlay-card.js video.mp4 output.mp4 45 captions.srt
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CARD = path.resolve(__dirname, '../subscribe_card_overlay.webm');
const CARD_DURATION = 8.5;

function usage() {
  console.log('Usage: node overlay-card.js <input.mp4> <output.mp4> [start_seconds] [captions.srt]');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────

function ffprobe(args) {
  return spawnSync('ffprobe', args, { encoding: 'utf8' });
}

function getVideoDuration(file) {
  const r = ffprobe(['-v','error','-show_entries','format=duration',
                     '-of','default=noprint_wrappers=1:nokey=1', file]);
  return parseFloat(r.stdout.trim());
}

function hasEmbeddedSubtitles(file) {
  const r = ffprobe(['-v','error','-select_streams','s',
                     '-show_entries','stream=index',
                     '-of','csv=p=0', file]);
  return r.stdout.trim().length > 0;
}

// ── Args ──────────────────────────────────────────

const [,, inputVideo, outputVideo, startArg, srtArg] = process.argv;
if (!inputVideo || !outputVideo) usage();

if (!fs.existsSync(inputVideo)) {
  console.error(`Input not found: ${inputVideo}`); process.exit(1);
}
if (!fs.existsSync(CARD)) {
  console.error('subscribe_card_overlay.webm not found — run "node render-card.js" first.');
  process.exit(1);
}
if (srtArg && !fs.existsSync(srtArg)) {
  console.error(`SRT file not found: ${srtArg}`); process.exit(1);
}

// ── Start time ────────────────────────────────────

let startSec;
if (startArg !== undefined && !isNaN(parseFloat(startArg))) {
  startSec = parseFloat(startArg);
} else {
  const dur = getVideoDuration(inputVideo);
  if (isNaN(dur)) {
    console.error('Could not read video duration — specify start_seconds manually.');
    process.exit(1);
  }
  startSec = Math.max(0, dur * 0.7 - CARD_DURATION / 2);
  console.log(`Video duration : ${dur.toFixed(1)}s`);
  console.log(`Auto start time: ${startSec.toFixed(1)}s (centred at 70% mark)`);
}
const endSec = startSec + CARD_DURATION;
console.log(`Card visible   : ${startSec.toFixed(1)}s → ${endSec.toFixed(1)}s`);

// ── Caption detection ─────────────────────────────

const externalSRT = srtArg ? path.resolve(srtArg) : null;
const embeddedSubs = !externalSRT && hasEmbeddedSubtitles(inputVideo);

if (externalSRT)   console.log(`Captions       : external SRT (${path.basename(externalSRT)})`);
else if (embeddedSubs) console.log('Captions       : embedded subtitle stream detected — will render on top');
else               console.log('Captions       : none detected');

// ── Build FFmpeg filter graph ─────────────────────
//
// Step 1 — delay card to startSec:   [1:v] → [card]
// Step 2 — overlay card on video:    [0:v][card] → [bg]
// Step 3 — burn captions on top:     [bg] → [v]   (only if captions exist)
//
// Result: captions always appear above the card, never covered.

const cardDelay = `[1:v]setpts=PTS+${startSec}/TB[card]`;
const overlay   = `[0:v][card]overlay=0:0:enable='between(t,${startSec},${endSec})'[bg]`;

let filterComplex;
let mapVideo;

if (externalSRT) {
  // Escape path for FFmpeg filter (backslashes and colons need escaping on Windows)
  const srtEscaped = externalSRT.replace(/\\/g, '/').replace(/:/g, '\\:');
  filterComplex = `${cardDelay};${overlay};[bg]subtitles='${srtEscaped}'[v]`;
  mapVideo = '[v]';
} else if (embeddedSubs) {
  // Use the embedded subtitle stream from the input file
  const inputEscaped = path.resolve(inputVideo).replace(/\\/g, '/').replace(/:/g, '\\:');
  filterComplex = `${cardDelay};${overlay};[bg]subtitles='${inputEscaped}'[v]`;
  mapVideo = '[v]';
} else {
  // No captions — simple two-step filter
  filterComplex = `${cardDelay};[0:v][card]overlay=0:0:enable='between(t,${startSec},${endSec})'`;
  mapVideo = null;   // FFmpeg default output
}

// ── Run FFmpeg ────────────────────────────────────

console.log(`\nEncoding → ${outputVideo}\n`);

const ffArgs = ['-y', '-i', inputVideo, '-i', CARD,
  '-filter_complex', filterComplex];

if (mapVideo) {
  ffArgs.push('-map', mapVideo, '-map', '0:a?');
}

ffArgs.push(
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
  '-c:a', 'copy',
  outputVideo
);

const result = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });

if (result.status === 0) {
  const sizeMB = (fs.statSync(outputVideo).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone! ${outputVideo} (${sizeMB} MB)`);
  if (externalSRT || embeddedSubs) {
    console.log('Captions rendered on top of subscribe card — not covered.');
  }
} else {
  console.error('\nFFmpeg failed.');
  process.exit(1);
}
