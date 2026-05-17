/**
 * add-logo.js
 * Overlays the animated logo (logo_animated_overlay.webm) or static fallback
 * (logo_watermark.png) in the top-left corner throughout the video.
 *
 * Animated WebM loops seamlessly via -stream_loop -1.
 * Size: 190px  |  Margin: 35px from top-left edges
 *
 * Usage: node add-logo.js <input.mp4> <output.mp4>
 *
 * Requires: logo_animated_overlay.webm  (run render-logo-animated.js first)
 *       or: logo_watermark.png          (run render-logo.js first)
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const STUDIO         = path.resolve(__dirname, '..');
const LOGO_WEBM      = path.resolve(STUDIO, 'logo_animated_overlay.webm');
const LOGO_PNG       = path.resolve(STUDIO, 'logo_watermark.png');
const SIZE           = 190;   // px — matches the 190px rendered logo diameter
const MARGIN         = 35;    // px from left and top edges

function usage() {
  console.log('Usage: node add-logo.js <input.mp4> <output.mp4>');
  process.exit(1);
}

const [,, inputVideo, outputVideo] = process.argv;
if (!inputVideo || !outputVideo) usage();
if (!fs.existsSync(inputVideo)) { console.error(`Not found: ${inputVideo}`); process.exit(1); }

const useWebm = fs.existsSync(LOGO_WEBM);
const usePng  = !useWebm && fs.existsSync(LOGO_PNG);
if (!useWebm && !usePng) {
  console.error('No logo asset found. Run render-logo-animated.js or render-logo.js first.');
  process.exit(1);
}

const logoFile = useWebm ? LOGO_WEBM : LOGO_PNG;
console.log(`Input   : ${inputVideo}`);
console.log(`Logo    : ${path.basename(logoFile)}  (${SIZE}px, top-left +${MARGIN}px)`);
console.log(`Output  : ${outputVideo}\n`);

let ffArgs;
if (useWebm) {
  // Animated WebM with alpha: loop indefinitely, trim to video length, overlay top-left
  const filter = [
    `[1:v]scale=${SIZE}:${SIZE}[logo]`,
    `[0:v][logo]overlay=${MARGIN}:${MARGIN}`
  ].join(';');

  ffArgs = [
    '-y',
    '-i', inputVideo,
    '-stream_loop', '-1', '-i', logoFile,
    '-filter_complex', filter,
    '-shortest',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
    '-c:a', 'copy',
    outputVideo
  ];
} else {
  // Static PNG fallback (50% opacity, same position)
  const filter = [
    `[1:v]scale=${SIZE}:${SIZE},format=rgba,colorchannelmixer=aa=0.5[logo]`,
    `[0:v][logo]overlay=${MARGIN}:${MARGIN}`
  ].join(';');

  ffArgs = [
    '-y',
    '-i', inputVideo,
    '-i', logoFile,
    '-filter_complex', filter,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
    '-c:a', 'copy',
    outputVideo
  ];
}

const result = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });

if (result.status === 0) {
  const mb = (fs.statSync(outputVideo).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone → ${outputVideo} (${mb} MB)`);
} else {
  console.error('FFmpeg failed.');
  process.exit(1);
}
