/**
 * render-cards.mjs — baggage-de
 * "8 Gepäck-Gebühren-Fallen — Nr. 5 trifft jeden Reisenden"
 *
 * Source video: 1280×720, 614.68s
 *
 * Chapter timestamps (mm:ss → seconds):
 *   0:00 →   0.5s  "Milliarden Dollar"
 *   1:25 →  85.5s  "1-Kilo-Überschreitung-Drama"
 *   2:55 → 175.5s  "Falle Nr. 5"
 *   4:22 → 262.5s  "Statistik: Wie Viele"
 *   5:51 → 351.5s  "Priority Boarding Als"
 *   7:27 → 447.5s  "Tipp 3 —"
 *   8:54 → 534.5s  "Wichtigste Erkenntnis"
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
  // ── Section 1: Milliarden Dollar (0–85.5s) ───────────────────────────────────
  { id: 'chap-milliarden',   type: 'chapter', inTime:   0.5, outTime:   6.5, text: 'Milliarden\nDollar' },
  { id: 'stat-33mrd',        type: 'stat',    inTime:  18.0, outTime:  24.0, label: 'GEPÄCKGEBÜHREN JÄHRLICH',     value: '33 Mrd. $', sub: 'Airlines verdienen durch Gebühren mehr als durch Tickets',  icon: '💰' },
  { id: 'stat-400pct',       type: 'stat',    inTime:  38.0, outTime:  44.0, label: 'PREISERHÖHUNG SEIT 2010',     value: '+400%',     sub: 'Ryanair & Easyjet haben Gepäckgebühren massiv erhöht',      icon: '📈' },
  { id: 'key-falle1',        type: 'key',     inTime:  60.0, outTime:  66.0, tag: 'FALLE 1',     text: '3× teurer\nam Airport.' },

  // ── Section 2: 1-Kilo-Überschreitung-Drama (85.5–175.5s) ─────────────────────
  { id: 'chap-kilo',         type: 'chapter', inTime:  85.5, outTime:  91.5, text: '1-Kilo-\nDrama' },
  { id: 'stat-kilopreis',    type: 'stat',    inTime: 103.0, outTime: 109.0, label: 'ÜBERGEWICHT-KILOPREIS',       value: '15 €/kg',   sub: 'Aufpreis für 1,3 Kilo Übergewicht — wie ein Luxusgut',       icon: '⚖️' },
  { id: 'key-falle3',        type: 'key',     inTime: 130.0, outTime: 136.0, tag: 'FALLE 3',     text: 'Gate-Schock:\n50 € bar zahlen.' },

  // ── Section 3: Falle Nr. 5 (175.5–262.5s) ────────────────────────────────────
  { id: 'chap-falle5',       type: 'chapter', inTime: 175.5, outTime: 181.5, text: 'Falle\nNr. 5' },
  { id: 'key-darkpattern',   type: 'key',     inTime: 193.0, outTime: 199.0, tag: 'DARK PATTERN', text: 'Einmal falsch\ngeklickt. Gezahlt.' },
  { id: 'key-eu-recht',      type: 'key',     inTime: 228.0, outTime: 234.0, tag: 'EU-RECHT',    text: 'Grauzone.\nAirlines nutzen sie.' },

  // ── Section 4: Statistik: Wie Viele (262.5–351.5s) ───────────────────────────
  { id: 'chap-statistik',    type: 'chapter', inTime: 262.5, outTime: 268.5, text: 'Statistik:\nWie Viele' },
  { id: 'stat-68pct',        type: 'stat',    inTime: 280.0, outTime: 286.0, label: 'PASSAGIERE UNWISSEND',        value: '68 %',      sub: 'wussten nicht, dass sie für Gepäck mehr zahlen als nötig',   icon: '👤' },
  { id: 'stat-dcc',          type: 'stat',    inTime: 315.0, outTime: 321.0, label: 'WÄHRUNGSGEBÜHR (DCC)',        value: '3,5 %',     sub: 'versteckt als Dynamic Currency Conversion beim Auslandskauf', icon: '💳' },

  // ── Section 5: Priority Boarding Als (351.5–447.5s) ──────────────────────────
  { id: 'chap-priority',     type: 'chapter', inTime: 351.5, outTime: 357.5, text: 'Priority\nBoarding Als' },
  { id: 'key-falle7',        type: 'key',     inTime: 369.0, outTime: 375.0, tag: 'FALLE 7',     text: 'Gebühr weg.\nLegal. Für immer.' },
  { id: 'stat-ryanair30',    type: 'stat',    inTime: 410.0, outTime: 416.0, label: 'RYANAIR ZUSATZUMSATZ',        value: '30 %',      sub: 'des Gesamtumsatzes durch Extras: Gepäck, Sitzplatz, Priorität', icon: '✈️' },

  // ── Section 6: Tipp 3 — (447.5–534.5s) ──────────────────────────────────────
  { id: 'chap-tipp3',        type: 'chapter', inTime: 447.5, outTime: 453.5, text: 'Tipp 3 —\nKreditkarte' },
  { id: 'stat-waage',        type: 'stat',    inTime: 465.0, outTime: 471.0, label: 'REISEGEPÄCKWAAGE',           value: '<15 €',     sub: 'kostet — spart nach einer Reise drauf: Übergewicht bis 20 €/kg', icon: '💡' },
  { id: 'key-tipp1',         type: 'key',     inTime: 500.0, outTime: 506.0, tag: 'TIPP 1',      text: 'Beim Buchen.\nNie nachträglich.' },

  // ── Section 7: Wichtigste Erkenntnis (534.5–614.64s) ─────────────────────────
  { id: 'chap-erkenntnis',   type: 'chapter', inTime: 534.5, outTime: 540.5, text: 'Wichtigste\nErkenntnis' },
  { id: 'key-erkenntnis',    type: 'key',     inTime: 552.0, outTime: 558.0, tag: 'ERKENNTNIS',  text: 'Informiert zahlt\nweniger.' },
  { id: 'stat-nettoprofit',  type: 'stat',    inTime: 578.0, outTime: 584.0, label: 'AIRLINE-NETTOPROFIT/TICKET', value: '6 $',       sub: 'echter Profit kommt fast nur aus Zusatzgebühren wie Gepäck',   icon: '📊' },
];


// ── Styles (720p) ─────────────────────────────────────────────────────────────
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
