/**
 * add-music.js
 * Mixes a background music track under the existing voiceover.
 * Music loops automatically if shorter than the video.
 * Music volume: 12% (-18 dB) — present but never overpowers voice.
 *
 * Usage: node add-music.js <input.mp4> <music.mp3|wav> <output.mp4> [volume]
 *   volume  — 0.0 to 1.0, default 0.12
 *
 * Examples:
 *   node add-music.js video.mp4 bgm.mp3 video_music.mp4
 *   node add-music.js video.mp4 bgm.mp3 video_music.mp4 0.08
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function usage() {
  console.log('Usage: node add-music.js <input.mp4> <music.mp3|wav> <output.mp4> [volume 0-1]');
  process.exit(1);
}

const [,, inputVideo, musicFile, outputVideo, volArg] = process.argv;
if (!inputVideo || !musicFile || !outputVideo) usage();

for (const f of [inputVideo, musicFile]) {
  if (!fs.existsSync(f)) { console.error(`File not found: ${f}`); process.exit(1); }
}

const volume = (volArg !== undefined && !isNaN(parseFloat(volArg)))
  ? Math.min(1, Math.max(0, parseFloat(volArg)))
  : 0.12;

console.log(`Input   : ${inputVideo}`);
console.log(`Music   : ${musicFile}`);
console.log(`Volume  : ${(volume * 100).toFixed(0)}% (${(20 * Math.log10(volume)).toFixed(1)} dB)`);
console.log(`Output  : ${outputVideo}\n`);

// -stream_loop -1  loops music for the full video duration
// amix duration=first  trims to video length
// dropout_transition=3  smooth fade-out at end
const result = spawnSync('ffmpeg', [
  '-y',
  '-i', inputVideo,
  '-stream_loop', '-1', '-i', musicFile,
  '-filter_complex',
  `[1:a]volume=${volume}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[a]`,
  '-map', '0:v',
  '-map', '[a]',
  '-c:v', 'copy',
  '-c:a', 'aac', '-b:a', '192k',
  outputVideo
], { stdio: 'inherit' });

if (result.status === 0) {
  const mb = (fs.statSync(outputVideo).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone → ${outputVideo} (${mb} MB)`);
} else {
  console.error('FFmpeg failed.');
  process.exit(1);
}
