/**
 * render-card.js
 * Records reise-insider-subscribe-card.html to subscribe_card_overlay.webm
 * with full alpha transparency at 30fps.
 *
 * Usage:  node render-card.js
 * Output: ../subscribe_card_overlay.webm  (1920x1080, VP8 alpha)
 *
 * Requires: puppeteer (npm install), ffmpeg in PATH
 */

const puppeteer = require('puppeteer');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FPS = 30;
const DURATION = 8.5;          // seconds — matches animation length
const FRAME_COUNT = Math.ceil(FPS * DURATION);
const FRAMES_DIR = path.join(__dirname, '.frames');
const HTML_PATH = path.resolve(__dirname, '../reise-insider-subscribe-card.html');
const OUT_WEBM = path.resolve(__dirname, '../subscribe_card_overlay.webm');

async function main() {
  // Verify ffmpeg is available
  const ffCheck = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (ffCheck.status !== 0) {
    console.error('ffmpeg not found in PATH. Install it from https://ffmpeg.org');
    process.exit(1);
  }

  // Clean frame buffer
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

    // Suppress console noise from the page
    page.on('console', () => {});

    await page.goto('file://' + HTML_PATH, { waitUntil: 'load' });
    await page.click('#btn');   // start animation

    console.log(`Capturing ${FRAME_COUNT} frames at ${FPS}fps (~${DURATION}s)...`);

    const startMs = Date.now();
    for (let f = 0; f < FRAME_COUNT; f++) {
      // Align to real-time frame boundary
      const targetMs = (f / FPS) * 1000;
      const elapsed = Date.now() - startMs;
      const wait = targetMs - elapsed;
      if (wait > 2) await new Promise(r => setTimeout(r, wait));

      await page.screenshot({
        path: path.join(FRAMES_DIR, `f${String(f).padStart(4, '0')}.png`),
        omitBackground: true    // preserves canvas transparency
      });

      // Progress bar
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
    '-b:v', '3M',
    OUT_WEBM
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  if (enc.status !== 0) {
    console.error('FFmpeg encoding failed:\n', enc.stderr.toString());
    process.exit(1);
  }

  fs.rmSync(FRAMES_DIR, { recursive: true });
  const sizeMB = (fs.statSync(OUT_WEBM).size / 1024 / 1024).toFixed(1);
  console.log(`\nDone! ${OUT_WEBM} (${sizeMB} MB)`);
  console.log('Run overlay-card.js to apply it to a video.');
}

main().catch(e => { console.error(e); process.exit(1); });
