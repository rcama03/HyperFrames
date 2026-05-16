/**
 * overlay-card.js
 * Composites subscribe_card_overlay.webm onto an MP4 at a chosen time.
 * The card sits in the bottom-safe zone, above captions.
 *
 * Usage:
 *   node overlay-card.js <input.mp4> <output.mp4> [start_seconds]
 *
 *   start_seconds  — when to show the card (default: auto, placed at ~70% through video)
 *
 * Examples:
 *   node overlay-card.js my_video.mp4 my_video_with_card.mp4
 *   node overlay-card.js my_video.mp4 output.mp4 45
 *       → card appears at the 45-second mark
 *
 * Requires: ffmpeg in PATH, subscribe_card_overlay.webm in ../
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CARD = path.resolve(__dirname, '../subscribe_card_overlay.webm');
const CARD_DURATION = 8.5;

function usage() {
  console.log('Usage: node overlay-card.js <input.mp4> <output.mp4> [start_seconds]');
  process.exit(1);
}

function getVideoDuration(filePath) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath
  ], { encoding: 'utf8' });
  return parseFloat(r.stdout.trim());
}

// ── Args ──────────────────────────────────────────
const [,, inputVideo, outputVideo, startArg] = process.argv;
if (!inputVideo || !outputVideo) usage();

if (!fs.existsSync(inputVideo)) {
  console.error(`Input not found: ${inputVideo}`);
  process.exit(1);
}
if (!fs.existsSync(CARD)) {
  console.error('subscribe_card_overlay.webm not found.\nRun "node render-card.js" first.');
  process.exit(1);
}

// ── Determine start time ──────────────────────────
let startSec;
if (startArg !== undefined) {
  startSec = parseFloat(startArg);
  if (isNaN(startSec) || startSec < 0) {
    console.error('start_seconds must be a non-negative number');
    process.exit(1);
  }
} else {
  const dur = getVideoDuration(inputVideo);
  if (isNaN(dur)) {
    console.error('Could not read video duration. Specify start_seconds manually.');
    process.exit(1);
  }
  // Default: centre the card at 70% through the video
  startSec = Math.max(0, dur * 0.7 - CARD_DURATION / 2);
  console.log(`Video duration: ${dur.toFixed(1)}s`);
  console.log(`Auto start time: ${startSec.toFixed(1)}s (70% mark)`);
}

const endSec = startSec + CARD_DURATION;
console.log(`Overlaying card from ${startSec.toFixed(1)}s → ${endSec.toFixed(1)}s`);
console.log(`Output: ${outputVideo}\n`);

// ── FFmpeg overlay ────────────────────────────────
// [1:v] = card webm, delayed to startSec
// overlay=0:0 = full-frame composite (card canvas is already 1920x1080)
// card alpha is preserved by libvpx yuva420p
const result = spawnSync('ffmpeg', [
  '-y',
  '-i', inputVideo,
  '-i', CARD,
  '-filter_complex',
  [
    `[1:v]setpts=PTS+${startSec}/TB[card]`,
    `[0:v][card]overlay=0:0:enable='between(t,${startSec},${endSec})'`
  ].join(';'),
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '18',
  '-c:a', 'copy',
  outputVideo
], { stdio: 'inherit' });

if (result.status === 0) {
  const sizeMB = (fs.statSync(outputVideo).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone! ${outputVideo} (${sizeMB} MB)`);
} else {
  console.error('\nFFmpeg overlay failed.');
  process.exit(1);
}
