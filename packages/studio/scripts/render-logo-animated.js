/**
 * render-logo-animated.js
 * Records reise-insider-logo-animated.html canvas (20-second seamless loop)
 * to logo_animated_overlay.webm with full alpha transparency at 30fps.
 *
 * Usage:  node render-logo-animated.js
 * Output: ../logo_animated_overlay.webm  (1920x1080, VP8 alpha, 20s loop)
 *
 * Requires: puppeteer (npm install), ffmpeg in PATH
 */

const puppeteer = require('puppeteer');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const DURATION = 20;                           // one full seamless loop
const FRAME_COUNT = Math.ceil(FPS * DURATION);
const FRAMES_DIR = path.join(__dirname, '.frames_logo');
const HTML_PATH = path.resolve(__dirname, '../reise-insider-logo-animated.html');
const OUT_WEBM = path.resolve(__dirname, '../logo_animated_overlay.webm');

async function main() {
  const ffCheck = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (ffCheck.status !== 0) {
    console.error('ffmpeg not found in PATH.');
    process.exit(1);
  }

  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    page.on('console', () => {});
    await page.goto('file://' + HTML_PATH, { waitUntil: 'load' });

    // Give rAF loop a moment to start
    await new Promise(r => setTimeout(r, 200));

    console.log(`Capturing ${FRAME_COUNT} frames at ${FPS}fps (${DURATION}s loop)...`);

    // Inject a tick function so we can drive time deterministically
    // The animation uses requestAnimationFrame(draw) with performance.now() timestamps,
    // so we capture frames in real-time at the target framerate.
    const startMs = Date.now();
    for (let f = 0; f < FRAME_COUNT; f++) {
      const targetMs = (f / FPS) * 1000;
      const elapsed = Date.now() - startMs;
      const wait = targetMs - elapsed;
      if (wait > 2) await new Promise(r => setTimeout(r, wait));

      await page.screenshot({
        path: path.join(FRAMES_DIR, `f${String(f).padStart(4, '0')}.png`),
        omitBackground: true
      });

      const pct = Math.round((f + 1) / FRAME_COUNT * 40);
      process.stdout.write(
        `\r  [${'='.repeat(pct)}${' '.repeat(40 - pct)}] ${f + 1}/${FRAME_COUNT}`
      );
    }
    console.log('\n  Capture complete.');
  } finally {
    await browser.close();
  }

  console.log('  Encoding WebM with alpha channel...');
  const enc = spawnSync('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(FRAMES_DIR, 'f%04d.png'),
    '-c:v', 'libvpx',
    '-pix_fmt', 'yuva420p',
    '-auto-alt-ref', '0',
    '-crf', '10',
    '-b:v', '2M',
    OUT_WEBM
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  if (enc.status !== 0) {
    console.error('FFmpeg encoding failed:\n', enc.stderr.toString());
    process.exit(1);
  }

  fs.rmSync(FRAMES_DIR, { recursive: true });
  const sizeMB = (fs.statSync(OUT_WEBM).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone → ${OUT_WEBM} (${sizeMB} MB)`);
  console.log('20-second seamless loop — use with -stream_loop -1 in FFmpeg.');
}

main().catch(e => { console.error(e); process.exit(1); });
