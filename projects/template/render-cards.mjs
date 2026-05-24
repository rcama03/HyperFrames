/**
 * render-cards.mjs — TEMPLATE
 *
 * Steps:
 *   1. Edit the `cards` array below with your video's content + timings
 *   2. Run:  node render-cards.mjs
 *   3. Output: card-frames/*.png  +  card-manifest.json
 *
 * Card types:
 *   chapter  — top-left, navy/cyan, marks a new section
 *   stat     — bottom-left, dark/gold, shows a big number/stat
 *   key      — bottom-left, dark/gold, shows a key fact with a tag badge
 *
 * Timing rules:
 *   - inTime / outTime are seconds in the FINAL output video
 *   - Leave at least 1s gap between consecutive cards (no overlaps)
 *   - Cards stay on screen for at least 4-5s for readability
 */

import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, 'card-frames');
mkdirSync(outDir, { recursive: true });

const W = 1920, H = 1080;
const GOLD = '#FFD700';

// ── ✏️  EDIT THIS — your video's cards ────────────────────────────────────────
const cards = [

  // CHAPTER cards — top-left corner, navy/cyan stripe
  // Use at the start of each major section
  { id: 'chap-intro',   type: 'chapter', inTime: 0.5,  outTime: 5,    text: 'Kapitelname' },
  { id: 'chap-section2',type: 'chapter', inTime: 30,   outTime: 34,   text: 'Zweiter Teil' },

  // STAT cards — bottom-left, big number with label + icon
  // Great for impressive numbers/facts
  {
    id: 'stat-example',
    type: 'stat',
    inTime: 10, outTime: 20,
    label: 'PRO JAHR',       // small label above the number
    value: '1,4 Mrd.',       // big number
    sub:   'Kurze Erklärung dazu',
    icon:  '✈️',
  },

  // KEY cards — bottom-left, tag badge + fact text
  // Great for key insights or surprising facts
  {
    id: 'key-example',
    type: 'key',
    inTime: 22, outTime: 32,
    tag:  'WICHTIG',         // badge label (keep short)
    text: 'Hier steht die wichtigste Erkenntnis des Videos.',
  },

];
// ── end of editable section ───────────────────────────────────────────────────


// ── Styles (do not edit — matches HyperFrames brand) ─────────────────────────
const mgStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 60px; bottom: 140px;
      display: flex; align-items: stretch;
      background: rgba(10,10,30,0.72);
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 12px 48px rgba(0,0,0,0.65);
      border-radius: 20px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 6px; background: ${GOLD}; flex-shrink: 0; }
    .inner  { padding: 22px 26px; flex: 1; }
  </style>`;

const chapStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 60px; top: 60px;
      display: flex; align-items: stretch;
      background: rgba(0,28,58,0.52);
      border: 1.5px solid rgba(100,180,255,0.32);
      box-shadow: 0 12px 48px rgba(0,0,0,0.65);
      border-radius: 20px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 6px; background: #4FC3F7; flex-shrink: 0; }
    .inner  { padding: 22px 26px; flex: 1; }
  </style>`;

function buildHTML(card) {
  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:680px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:16px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:6px">${card.label}</div>
          <div style="font-size:72px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-2px">${card.value}</div>
          <div style="font-size:18px;color:rgba(255,255,255,.7);margin-top:6px">${card.sub}</div>
        </div>
        <div style="font-size:44px;padding:22px 20px 22px 0;display:flex;align-items:flex-start;padding-top:26px">${card.icon}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:680px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 14px;border-radius:12px;text-transform:uppercase;margin-bottom:12px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.18);margin-bottom:12px"></div>
          <div style="font-size:22px;font-weight:700;color:#FFF;line-height:1.4">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${chapStyle}</head><body>
      <div class="card" style="width:620px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:#4FC3F7;color:#001828;font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 14px;border-radius:12px;text-transform:uppercase;margin-bottom:12px">KAPITEL</div>
          <div style="height:1px;background:rgba(100,180,255,.25);margin-bottom:12px"></div>
          <div style="font-size:28px;font-weight:800;color:#FFF;letter-spacing:-.3px;line-height:1.2">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  const manifest = { cards: [] };
  for (const card of cards) {
    await page.setContent(buildHTML(card), { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const pngPath = join(outDir, `${card.id}.png`);
    await page.screenshot({ path: pngPath, omitBackground: true });
    manifest.cards.push({ id: card.id, path: `card-frames/${card.id}.png`, inTime: card.inTime, outTime: card.outTime });
    console.log(`  ✓ ${card.id}.png`);
  }
  await browser.close();
  writeFileSync(join(__dir, 'card-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${manifest.cards.length} cards → card-manifest.json`);
})();
