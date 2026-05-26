/**
 * Renders motion graphics cards for sauerstoff-de project.
 * Output: card-frames/*.png + card-manifest.json
 * Source video: 1280×720
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, 'card-frames');
mkdirSync(outDir, { recursive: true });

const W = 1280, H = 720;
const GOLD = '#FFD700';

// ── Card definitions — timed to voiceover scene boundaries (scaled to 199.06s) ──
// Scene boundaries (scaled):  1:0-12.5  2:12.8-23.6  3:23.9-34.7  4:35.0-45.9
//   5:46.2-61.4  6:61.7-73.4  7:73.7-84.7  8:85.0-96.8  9:97.1-109.8
//  10:110.1-124.7  11:125.0-137.3  12:137.6-150.1  13:150.4-161.1
//  14:161.4-173.5  15:173.8-187.8  16:188.1-199.1
// All timings staggered — ONE card on screen at a time.
const cards = [
  // Chapter cards — top-left, navy/cyan
  // Stat/Key cards — bottom-left, dark/gold glass
  { id: 'chap-hook',      type: 'chapter', inTime: 0.5,   outTime: 4.0,   text: 'Der Schock' },
  { id: 'stat-30sek',     type: 'stat',    inTime: 24.5,  outTime: 33.5,  label: 'BEWUSSTSEIN',      value: '30 Sek.',  sub: 'bis zur Ohnmacht in 10.000 m',         icon: '💨' },
  { id: 'chap-physik',    type: 'chapter', inTime: 34.5,  outTime: 38.0,  text: 'Die Physik' },
  { id: 'stat-75pct',     type: 'stat',    inTime: 38.5,  outTime: 44.5,  label: 'KABINENDRUCK',     value: '75 %',     sub: 'des normalen Bodendrucks',             icon: '✈️' },
  { id: 'stat-12min',     type: 'stat',    inTime: 51.5,  outTime: 59.5,  label: 'SAUERSTOFF',       value: '12 Min.',  sub: 'exakt — dann ist er weg',              icon: '⏱️' },
  { id: 'chap-pilot',     type: 'chapter', inTime: 62.5,  outTime: 66.0,  text: 'Der Pilot' },
  { id: 'stat-3000m',     type: 'stat',    inTime: 67.0,  outTime: 72.5,  label: 'STURZFLUG BIS',    value: '3.000 m',  sub: 'Pilot rast auf atembare Luft',         icon: '📉' },
  { id: 'stat-2h',        type: 'stat',    inTime: 86.0,  outTime: 95.0,  label: 'PILOT BEKOMMT',    value: '2 Std.',   sub: 'Sauerstoff — du bekommst 12 Min.',     icon: '😷' },
  { id: 'key-southwest',  type: 'key',     inTime: 97.5,  outTime: 108.5, tag: 'SOUTHWEST 2018',     text: 'Triebwerkexplosion — Passagiere hatten exakt diese 12 Minuten' },
  { id: 'chap-wahrheit',  type: 'chapter', inTime: 110.5, outTime: 114.0, text: 'Die Wahrheit' },
  { id: 'key-uberbruck',  type: 'key',     inTime: 115.0, outTime: 123.5, tag: 'KEIN RETTUNGSGERÄT', text: 'Die Maske ist ein Überbrückungsgerät — so designt, nicht fehlerhaft' },
  { id: 'chap-hypoxie',   type: 'chapter', inTime: 125.5, outTime: 129.0, text: 'Hypoxie' },
  { id: 'key-tod',        type: 'key',     inTime: 130.0, outTime: 136.0, tag: 'TRÜGERISCHER TOD',   text: 'Du fühlst dich euphorisch — dein Gehirn schaltet ab, während du lächelst' },
  { id: 'chap-schutz',    type: 'chapter', inTime: 151.0, outTime: 154.5, text: 'Dein Schutz' },
  { id: 'chap-bonus',     type: 'chapter', inTime: 174.5, outTime: 178.0, text: 'Bonus-Fakt' },
  { id: 'key-selbst',     type: 'key',     inTime: 179.0, outTime: 186.5, tag: 'ZUERST DU',          text: 'Eigene Maske zuerst — unbewusstes Elternteil kann niemanden retten' },
];

// ── Styles (scaled for 1280×720) ──────────────────────────────────────────────
const mgStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; bottom: 95px;
      display: flex; align-items: stretch;
      background: rgba(10,10,30,0.72);
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 8px 32px rgba(0,0,0,0.65);
      border-radius: 14px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 4px; background: ${GOLD}; flex-shrink: 0; }
    .inner  { padding: 14px 18px; flex: 1; }
  </style>`;

const chapStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; top: 40px;
      display: flex; align-items: stretch;
      background: rgba(0,28,58,0.52);
      border: 1.5px solid rgba(100,180,255,0.32);
      box-shadow: 0 8px 32px rgba(0,0,0,0.65);
      border-radius: 14px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 4px; background: #4FC3F7; flex-shrink: 0; }
    .inner  { padding: 14px 18px; flex: 1; }
  </style>`;

function buildHTML(card) {
  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:455px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:11px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:4px">${card.label}</div>
          <div style="font-size:48px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-1px">${card.value}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:4px">${card.sub}</div>
        </div>
        <div style="font-size:30px;padding:14px 14px 14px 0;display:flex;align-items:flex-start;padding-top:18px">${card.icon}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:455px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:9px;font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px;text-transform:uppercase;margin-bottom:8px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.18);margin-bottom:8px"></div>
          <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${chapStyle}</head><body>
      <div class="card" style="width:415px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:#4FC3F7;color:#001828;font-size:9px;font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px;text-transform:uppercase;margin-bottom:8px">KAPITEL</div>
          <div style="height:1px;background:rgba(100,180,255,.25);margin-bottom:8px"></div>
          <div style="font-size:19px;font-weight:800;color:#FFF;letter-spacing:-.2px;line-height:1.2">${card.text}</div>
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
