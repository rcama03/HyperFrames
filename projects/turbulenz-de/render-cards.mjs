/**
 * Renders motion graphics cards for turbulenz-de project.
 * Output: card-frames/*.png + card-manifest.json
 *
 * Video: 1280×720, voiceover 224.952s (timings scaled ×0.96899)
 * Chapter timestamps (user-specified video time):
 *   0:00 → 0.5s   "Schockierende Unterschied"
 *   0:57 → 57.0s  "Gehirn Spielt Dir"
 *   1:46 → 106.0s "Stille Austausch Zwischen"
 *   2:46 → 166.0s "Flugzeug Ist Gebaut"
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

const cards = [
  // ── Chapter cards — top-left navy/cyan ──────────────────────────────────────
  { id: 'chap-einstieg',  type: 'chapter', inTime: 0.5,   outTime: 5.5,   text: 'Schockierende\nUnterschied' },
  { id: 'chap-gehirn',    type: 'chapter', inTime: 57.0,  outTime: 62.0,  text: 'Gehirn Spielt\nDir' },
  { id: 'chap-stille',    type: 'chapter', inTime: 106.0, outTime: 111.0, text: 'Stille Austausch\nZwischen' },
  { id: 'chap-flugzeug',  type: 'chapter', inTime: 166.0, outTime: 171.0, text: 'Flugzeug Ist\nGebaut' },

  // ── Stat cards — bottom-left gold stripe, big number ────────────────────────
  { id: 'stat-95pct',      type: 'stat', inTime: 14.0,  outTime: 19.0,  label: '95 PROZENT',    value: '95 %',  sub: 'Piloten: normale Turbulenzen vollkommen ungefährlich',  icon: '✈️' },
  { id: 'stat-30verletzt', type: 'stat', inTime: 44.0,  outTime: 49.0,  label: 'FAA JÄHRLICH',  value: '30',    sub: 'schwere Turbulenz-Verletzungen — fast alle ohne Gurt', icon: '⚠️' },
  { id: 'stat-55pct',      type: 'stat', inTime: 89.0,  outTime: 94.0,  label: 'NORDATLANTIK',  value: '55 %',  sub: 'mehr starke Turbulenz seit 1979 — Folge des Klimawandels', icon: '🌡️' },
  { id: 'stat-60pct',      type: 'stat', inTime: 143.0, outTime: 148.0, label: 'FLÜGELPLATZ',   value: '60 %',  sub: 'weniger Bewegung über dem Flügel — stabilster Sitzplatz', icon: '💺' },

  // ── Key cards — bottom-left gold badge + punchy heading ─────────────────────
  { id: 'key-passagier',   type: 'key', inTime: 28.0,  outTime: 33.0,  tag: 'RISIKO',       text: 'Du — nicht\ndas Flugzeug.' },
  { id: 'key-panikreflex', type: 'key', inTime: 70.0,  outTime: 75.0,  tag: 'PILOT-WISSEN', text: 'Passagier-Panik-\nReflex. Intern bekannt.' },
  { id: 'key-cat',         type: 'key', inTime: 120.0, outTime: 125.0, tag: 'UNSICHTBAR',   text: 'CAT. Kein Radar.\nKeine Warnung.' },
  { id: 'key-crew',        type: 'key', inTime: 208.0, outTime: 213.0, tag: 'TRICK',        text: 'Schau zur Crew.\nSie lächeln? Alles gut.' },
];

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
          <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4;white-space:pre-line">${card.text}</div>
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
          <div style="font-size:19px;font-weight:800;color:#FFF;letter-spacing:-.2px;line-height:1.2;white-space:pre-line">${card.text}</div>
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
