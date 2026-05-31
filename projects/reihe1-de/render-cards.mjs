/**
 * Renders motion graphics cards for reihe1-de project.
 * Output: card-frames/*.png + card-manifest.json
 * Source video: 1280×720, voiceover 251.28s (scale=0.9721 from timings)
 *
 * Chapter timestamps (user-specified, scaled to voiceover):
 *   0:00  → 0s    "Schockierende Haken"
 *   1:40  → 97s   "Kältere Kabine"
 *   3:20  → 194s  "Reihe 1: Aufgedeckt"
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

// ── Card definitions — all timings in voiceover-scaled seconds (0–251s) ───────
// Scene boundaries (scaled): 1:0-14.8  2:15.1-30.3  3:30.6-45.1  4:45.4-59.2
//   5:59.5-79.0  6:79.3-93.9  7:94.1-108.8  8:109.1-125.4  9:125.7-146.4
//  10:146.7-163.1  11:163.4-181.0  12:181.4-198.2  13:198.5-220.0
//  14:220.3-237.2  15:237.6-251.3
// All timings staggered — ONE card on screen at a time.
const cards = [
  // Chapter cards — top-left navy/cyan (user-specified timestamps)
  // Stat/Key cards — bottom-left dark/gold glass
  { id: 'chap-trick',     type: 'chapter', inTime: 0.5,   outTime: 4.0,   text: 'Schockierende Haken' },
  { id: 'stat-20pct',     type: 'stat',    inTime: 16.0,  outTime: 25.0,  label: 'NEBENEINNAHMEN',    value: '20 %',     sub: 'Ryanair & EasyJet via Sitzplatz-Upgrades',  icon: '💰' },
  { id: 'key-overhead',   type: 'key',     inTime: 31.0,  outTime: 43.0,  tag: 'OVERHEAD-FACH',       text: 'Handgepäck zwingend in Overhead-Box — bei Billigfliegern oft schon voll' },
  { id: 'key-klapptisch', type: 'key',     inTime: 47.0,  outTime: 58.0,  tag: 'KLAPPTISCH',          text: 'Schmaler, wackeliger Tisch in der Armlehne — echter Produktivitätskiller' },
  { id: 'key-galley',     type: 'key',     inTime: 60.5,  outTime: 72.0,  tag: 'GALLEY-LÄRM',         text: 'Bordküche direkt hinter Reihe 1 — deutlich mehr Lärm als Rest der Kabine' },
  { id: 'key-kaelte',     type: 'key',     inTime: 80.0,  outTime: 93.5,  tag: 'KÄLTE',               text: 'Messbar kälter an Kabinentür & Außenwand — besonders auf Langstrecken' },
  { id: 'chap-kabine',    type: 'chapter', inTime: 97.7,  outTime: 101.2, text: 'Kältere Kabine' },
  { id: 'stat-15cm',      type: 'stat',    inTime: 102.5, outTime: 111.0, label: 'BEINFREIHEIT',       value: '+15 cm',   sub: 'in Notausgangsreihen vs. Reihe 1',           icon: '🦵' },
  { id: 'key-gate',       type: 'key',     inTime: 112.0, outTime: 124.0, tag: 'GATE-UPGRADE',         text: 'Bereits bezahlt — am Gate nochmals gefragt. Doppelt zahlen für denselben Stuhl.' },
  { id: 'stat-23euro',    type: 'stat',    inTime: 127.0, outTime: 140.0, label: 'PRO PASSAGIER',      value: '23 €',     sub: 'Billigflieger-Einnahmen via Sitzplatz-Gebühren (IATA 2023)', icon: '📊' },
  { id: 'stat-50euro',    type: 'stat',    inTime: 147.5, outTime: 159.0, label: 'GESPART MIT',        value: '50 €',     sub: '90 Sekunden auf SeatGuru — reicht oft aus', icon: '⏱️' },
  { id: 'key-bassinet',   type: 'key',     inTime: 164.0, outTime: 175.0, tag: 'BABYBETT',             text: 'Bassinet-Halterungen standardmäßig an Reihe 1 — weinender Säugling inklusive' },
  { id: 'key-ausnahmen',  type: 'key',     inTime: 182.0, outTime: 193.0, tag: 'AUSNAHMEN',            text: 'Propellermaschinen & Turboprops: Reihe 1 oft ruhiger — weit weg von Triebwerken' },
  { id: 'chap-reihe1',    type: 'chapter', inTime: 195.0, outTime: 198.5, text: 'Reihe 1: Aufgedeckt' },
  { id: 'stat-500k',      type: 'stat',    inTime: 205.0, outTime: 218.0, label: 'BEWERTUNGEN',        value: '500K+',    sub: 'TripAdvisor: Reihe 10–20 konstant beste Werte', icon: '⭐' },
  { id: 'key-seatguru',   type: 'key',     inTime: 221.0, outTime: 234.0, tag: 'DEIN GEGENZUG',        text: 'SeatGuru öffnen, Flugzeugmodell eingeben — 90 Sek. die beste Entscheidung deiner Reise' },
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
