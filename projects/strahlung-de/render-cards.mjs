/**
 * Renders motion graphics cards for strahlung-de project.
 * Output: card-frames/*.png + card-manifest.json
 *
 * Video: 1280×720, voiceover 560.688s (timings.json scaled ×0.97053)
 * Chapter timestamps (user-specified video time):
 *   0:00 → 0.5s   "Schockierende Einstieg"
 *   1:22 → 82.0s  "Sonneneruptionen — Die"
 *   3:01 → 181.0s "Kurzstrecke Vs. Langstrecke"
 *   4:28 → 268.0s "Hilft Wirklich?"
 *   5:58 → 358.0s "Luftfahrtbehörden Sagen"
 *   7:23 → 443.0s "Wahrheiten 4 Und"
 *   8:49 → 529.0s "Relativierung — Panik"
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
  { id: 'chap-einstieg',      type: 'chapter', inTime: 0.5,   outTime: 5.5,   text: 'Schockierende\nEinstieg' },
  { id: 'chap-sonne',         type: 'chapter', inTime: 82.0,  outTime: 87.0,  text: 'Sonneneruptionen —\nDie' },
  { id: 'chap-kurz',          type: 'chapter', inTime: 181.0, outTime: 186.0, text: 'Kurzstrecke\nVs. Langstrecke' },
  { id: 'chap-hilft',         type: 'chapter', inTime: 268.0, outTime: 273.0, text: 'Hilft\nWirklich?' },
  { id: 'chap-behoerde',      type: 'chapter', inTime: 358.0, outTime: 363.0, text: 'Luftfahrtbehörden\nSagen' },
  { id: 'chap-wahrheit',      type: 'chapter', inTime: 443.0, outTime: 448.0, text: 'Wahrheiten 4\nUnd' },
  { id: 'chap-relativierung', type: 'chapter', inTime: 529.0, outTime: 534.0, text: 'Relativierung —\nPanik' },

  // ── Stat cards — bottom-left gold stripe, big number ────────────────────────
  { id: 'stat-10x',    type: 'stat', inTime: 7.0,   outTime: 12.0,  label: '10× RÖNTGEN',        value: '10×',      sub: 'Mehr Strahlung pro Transatlantikflug',          icon: '☢️' },
  { id: 'stat-1msv',   type: 'stat', inTime: 48.0,  outTime: 53.0,  label: 'ICRP GRENZE',         value: '1 mSv',    sub: 'Zivilpersonen pro Jahr erlaubt',                icon: '📊' },
  { id: 'stat-6msv',   type: 'stat', inTime: 73.0,  outTime: 78.0,  label: 'PILOTEN-DOSIS',       value: '6 mSv',    sub: 'Pro Jahr — wie Kernkraftwerks-Mitarbeiter',     icon: '⚡' },
  { id: 'stat-30pct',  type: 'stat', inTime: 122.0, outTime: 127.0, label: 'POLARROUTEN',         value: '30 %',     sub: 'mehr Strahlung als Standardrouten',             icon: '🧭' },
  { id: 'stat-51pct',  type: 'stat', inTime: 203.0, outTime: 208.0, label: 'BRUSTKREBS-RATE',     value: '51 %',     sub: 'höher bei Flugbegleiterinnen (Harvard)',        icon: '🔬' },
  { id: 'stat-56min',  type: 'stat', inTime: 247.0, outTime: 252.0, label: 'FENSTERSITZ',         value: '56 Min.',  sub: '= 20 Min. Sonnenbett UV-Dosis',                 icon: '☀️' },
  { id: 'stat-12flug', type: 'stat', inTime: 405.0, outTime: 410.0, label: 'ICRP GRENZE',         value: '12 Flüge', sub: 'transatlantisch überschreitet Normalbürgerlimit', icon: '✈️' },

  // ── Key cards — bottom-left gold badge + punchy heading ─────────────────────
  { id: 'key-roentgen',   type: 'key', inTime: 14.0,  outTime: 19.0,  tag: 'SCHOCK',       text: '10× die Dosis\ndes Arztes.' },
  { id: 'key-kernkraft',  type: 'key', inTime: 61.0,  outTime: 66.0,  tag: 'EU-RECHT',     text: 'Piloten = Kernkraftwerk-\nMitarbeiter.' },
  { id: 'key-passagier',  type: 'key', inTime: 96.0,  outTime: 101.0, tag: 'VERSCHWIEGEN', text: 'Passagier weiß\nrein gar nichts.' },
  { id: 'key-dna',        type: 'key', inTime: 148.0, outTime: 153.0, tag: 'DNA-SCHADEN',  text: 'Direkt in\ndie DNA.' },
  { id: 'key-sievert',    type: 'key', inTime: 285.0, outTime: 290.0, tag: 'ESA APP',      text: 'SIEVERT App.\nKostenlos tracken.' },
  { id: 'key-schwanger',  type: 'key', inTime: 478.0, outTime: 483.0, tag: 'EU-GESETZ',    text: 'Schwangere am Boden.\nPassagierinnen: kein Schutz.' },
  { id: 'key-wissen',     type: 'key', inTime: 551.0, outTime: 556.0, tag: 'FAZIT',        text: 'Wissen schützt.\nPanik nicht.' },
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
