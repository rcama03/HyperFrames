/**
 * add-logo.js
 * Overlays logo_watermark.png in the bottom-right corner throughout the video.
 * Size: 120px  |  Opacity: 50%  |  Margin: 24px from edges
 *
 * Usage: node add-logo.js <input.mp4> <output.mp4>
 *
 * Requires: logo_watermark.png (run render-logo.js first)
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const LOGO   = path.resolve(__dirname, '../logo_watermark.png');
const SIZE   = 120;   // px — diameter of logo in video
const OPACITY = 0.5;  // 50%
const MARGIN  = 24;   // px from right and bottom edges

function usage() {
  console.log('Usage: node add-logo.js <input.mp4> <output.mp4>');
  process.exit(1);
}

const [,, inputVideo, outputVideo] = process.argv;
if (!inputVideo || !outputVideo) usage();

if (!fs.existsSync(inputVideo)) { console.error(`Not found: ${inputVideo}`); process.exit(1); }
if (!fs.existsSync(LOGO)) {
  console.error('logo_watermark.png not found — run "node render-logo.js" first.');
  process.exit(1);
}

console.log(`Input   : ${inputVideo}`);
console.log(`Logo    : ${SIZE}px, ${OPACITY * 100}% opacity, bottom-right +${MARGIN}px`);
console.log(`Output  : ${outputVideo}\n`);

// scale logo → set alpha to OPACITY → overlay bottom-right
// W/H = video dimensions (FFmpeg expands these automatically)
const filter = [
  `[1:v]scale=${SIZE}:${SIZE},format=rgba,colorchannelmixer=aa=${OPACITY}[logo]`,
  `[0:v][logo]overlay=W-w-${MARGIN}:H-h-${MARGIN}`
].join(';');

const result = spawnSync('ffmpeg', [
  '-y',
  '-i', inputVideo,
  '-i', LOGO,
  '-filter_complex', filter,
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
  '-c:a', 'copy',
  outputVideo
], { stdio: 'inherit' });

if (result.status === 0) {
  const mb = (fs.statSync(outputVideo).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone → ${outputVideo} (${mb} MB)`);
} else {
  console.error('FFmpeg failed.');
  process.exit(1);
}
