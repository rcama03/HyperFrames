/**
 * add-music.js
 * Mixes background music under voiceover with:
 *   • Auto-ducking via sidechain compression — music quiets under every
 *     spoken word and rises back smoothly during pauses
 *   • 3-second fade-in at start, 3-second fade-out at end
 *   • Music loops automatically if shorter than the video
 *
 * Usage: node add-music.js <input.mp4> <music.mp3|wav> <output.mp4> [base_volume]
 *   base_volume — music level during silence, 0.0–1.0 (default 0.18)
 *                 during speech it drops to ~base_volume/8
 *
 * Examples:
 *   node add-music.js video.mp4 bgm.mp3 video_music.mp4
 *   node add-music.js video.mp4 bgm.mp3 video_music.mp4 0.12
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

function usage() {
  console.log('Usage: node add-music.js <input.mp4> <music.mp3|wav> <output.mp4> [base_volume]');
  process.exit(1);
}

// ── Args ──────────────────────────────────────────
const [,, inputVideo, musicFile, outputVideo, volArg] = process.argv;
if (!inputVideo || !musicFile || !outputVideo) usage();

for (const f of [inputVideo, musicFile]) {
  if (!fs.existsSync(f)) { console.error(`File not found: ${f}`); process.exit(1); }
}

const baseVol = (volArg !== undefined && !isNaN(parseFloat(volArg)))
  ? Math.min(1, Math.max(0, parseFloat(volArg)))
  : 0.18;

// ── Get video duration for fade-out ───────────────
const probe = spawnSync('ffprobe', [
  '-v', 'error', '-show_entries', 'format=duration',
  '-of', 'default=noprint_wrappers=1:nokey=1', inputVideo
], { encoding: 'utf8' });

const duration = parseFloat(probe.stdout.trim());
if (isNaN(duration)) {
  console.error('Could not read video duration — is ffprobe installed?');
  process.exit(1);
}
const fadeOutStart = Math.max(0, duration - 3).toFixed(3);

// ── Info ──────────────────────────────────────────
console.log(`Input    : ${inputVideo}`);
console.log(`Music    : ${musicFile}`);
console.log(`Duration : ${duration.toFixed(1)}s`);
console.log(`Base vol : ${(baseVol * 100).toFixed(0)}% during pauses`);
console.log(`Ducked   : ~${((baseVol / 8) * 100).toFixed(1)}% under speech  (ratio 8:1)`);
console.log(`Fades    : 3s in / 3s out`);
console.log(`Output   : ${outputVideo}\n`);

// ── Filter graph ──────────────────────────────────
//
// [1:a] → volume (base level) → [music_raw]
// [music_raw][0:a] → sidechaincompress → [ducked]
//   threshold : 0.015  (-36 dB) — catches clear speech, ignores room noise
//   ratio     : 8      — music drops to 1/8 when voice is active
//   attack    : 5 ms   — fast duck-in, no bleed at word starts
//   release   : 600 ms — smooth 600 ms rise-back during pauses
// [0:a][ducked] → amix → [mixed]
// [mixed] → afade in 3s → afade out 3s → [audio_out]
//
const filterComplex = [
  `[1:a]volume=${baseVol},aformat=fltp:44100:stereo[music_raw]`,
  `[music_raw][0:a]sidechaincompress=threshold=0.015:ratio=8:attack=5:release=600[ducked]`,
  `[0:a][ducked]amix=inputs=2:duration=first:dropout_transition=2[mixed]`,
  `[mixed]afade=t=in:ss=0:d=3,afade=t=out:st=${fadeOutStart}:d=3[audio_out]`
].join(';');

// ── Run ───────────────────────────────────────────
const result = spawnSync('ffmpeg', [
  '-y',
  '-i', inputVideo,
  '-stream_loop', '-1', '-i', musicFile,
  '-filter_complex', filterComplex,
  '-map', '0:v',
  '-map', '[audio_out]',
  '-c:v', 'copy',
  '-c:a', 'aac', '-b:a', '192k',
  outputVideo
], { stdio: 'inherit' });

if (result.status === 0) {
  const mb = (fs.statSync(outputVideo).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone → ${outputVideo} (${mb} MB)`);
} else {
  console.error('\nFFmpeg failed. Make sure your FFmpeg build includes the "af" filters.');
  process.exit(1);
}
