/**
 * Renders motion graphics cards for lounge-de project.
 * Output: card-frames/*.png + card-manifest.json
 *
 * Video: 1280×720, voiceover 534.24s (timings.json scaled ×0.9697)
 * Chapter timestamps (user-specified video time):
 *   0:00 → 0.5s   "Schmutzige Schock"
 *   1:20 → 80.5s  "Lüge Nr. 2"
 *   2:40 → 160.5s "Kosten-Rechnung Dahinter"
 *   4:01 → 241.0s "Lüge Nr. 6"
 *   5:33 → 333.0s "Echte Preis Des"
 *   6:54 → 414.0s "Corona-Nachwirkung"
 *   8:22 → 502.0s "Hoffnung — Veränderung"
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

// All inTime/outTime in actual video seconds (voiceover-scaled). ONE card visible at a time.
const cards = [
  // ── Chapter cards — top-left navy/cyan ──────────────────────────────────────
  { id: 'chap-schock',     type: 'chapter', inTime: 0.5,   outTime: 5.5,   text: 'Schmutzige\nSchock' },
  { id: 'chap-luege2',     type: 'chapter', inTime: 80.5,  outTime: 85.5,  text: 'Lüge Nr. 2' },
  { id: 'chap-kosten',     type: 'chapter', inTime: 160.5, outTime: 165.5, text: 'Kosten-Rechnung\nDahinter' },
  { id: 'chap-luege6',     type: 'chapter', inTime: 241.0, outTime: 246.0, text: 'Lüge Nr. 6' },
  { id: 'chap-preis',      type: 'chapter', inTime: 333.0, outTime: 338.0, text: 'Echter Preis\nDes' },
  { id: 'chap-corona',     type: 'chapter', inTime: 414.0, outTime: 419.0, text: 'Corona-\nNachwirkung' },
  { id: 'chap-hoffnung',   type: 'chapter', inTime: 502.0, outTime: 507.0, text: 'Hoffnung —\nVeränderung' },

  // ── Stat cards — bottom-left gold stripe, big number ────────────────────────
  { id: 'stat-40pct',      type: 'stat', inTime: 50.0,  outTime: 55.0,  label: 'GETESTETE BUFFETS',          value: '40 %',   sub: 'unter Warmhalte-Mindesttemperaturen',        icon: '🌡️' },
  { id: 'stat-100plus',    type: 'stat', inTime: 109.0, outTime: 114.0, label: 'FLÜGE PRO JAHR',             value: '100+',   sub: 'Vielflieger meiden das Buffet komplett',     icon: '✈️' },
  { id: 'stat-keim2h',     type: 'stat', inTime: 129.0, outTime: 134.0, label: 'KRITISCHE KEIMWERTE',        value: '2 Std.', sub: 'Obst bei Raumtemperatur — dann gefährlich',  icon: '⚠️' },
  { id: 'stat-3euro',      type: 'stat', inTime: 167.0, outTime: 172.0, label: 'PRO LOUNGE-BESUCHER',        value: '3–8 €',  sub: 'Airlines kalkulieren für Essen & Getränke', icon: '💰' },
  { id: 'stat-30pct',      type: 'stat', inTime: 221.0, outTime: 226.0, label: 'ECHTER CHAMPAGNER',          value: '30 %',   sub: 'der Lounges servieren ihn wirklich',         icon: '🥂' },
  { id: 'stat-allergen',   type: 'stat', inTime: 317.0, outTime: 322.0, label: 'EU-LOUNGE-BUFFETS',          value: '< 50 %', sub: 'kennzeichnen Allergene korrekt',             icon: '⚖️' },
  { id: 'stat-400euro',    type: 'stat', inTime: 326.0, outTime: 331.0, label: 'PRIORITY PASS JAHRESGEBÜHR', value: '400 €+', sub: 'für angebliche Premium-Qualität',             icon: '💳' },

  // ── Key cards — bottom-left gold badge + punchy heading ─────────────────────
  { id: 'key-ungekuehlt',      type: 'key', inTime: 7.0,   outTime: 12.0,  tag: 'SCHOCK',       text: '6 Stunden.\nUngekühlt.' },
  { id: 'key-theater',         type: 'key', inTime: 103.0, outTime: 108.0, tag: 'FRISCHETHEKE', text: 'Kochschürze?\nReines Theater.' },
  { id: 'key-wiederverwertet', type: 'key', inTime: 149.0, outTime: 154.0, tag: 'LÜGE NR. 5',   text: 'Nicht weggeworfen.\nWiederverwertet.' },
  { id: 'key-zertifikat',      type: 'key', inTime: 182.0, outTime: 187.0, tag: 'ZERTIFIKAT',   text: 'Kein Schutz.\nNur Marketing.' },
  { id: 'key-grauzone',        type: 'key', inTime: 189.0, outTime: 194.0, tag: 'GESETZESLAGE', text: 'Regulatorische\nGrauzone.' },
  { id: 'key-warnsystem',      type: 'key', inTime: 303.0, outTime: 308.0, tag: 'WARNSYSTEM',   text: 'Kein Dampf.\nTrocken. Kein Personal.' },
  { id: 'key-illusion',        type: 'key', inTime: 450.0, outTime: 455.0, tag: 'WAHRHEIT',     text: 'Sorgfältig inszenierte\nIllusion.' },
];

// ── Styles (1280×720) ─────────────────────────────────────────────────────────
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
