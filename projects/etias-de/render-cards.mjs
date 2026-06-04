/**
 * render-cards.mjs — etias-de
 * "ETIAS: Europa sperrt ab 2025 — Was du jetzt wissen musst"
 *
 * Source video: 1280×720, 631.9s
 *
 * Chapter timestamps (mm:ss → seconds):
 *   0:00 →   0.5s  "Europa Sperrt"
 *   1:20 →  80.5s  "Echte"
 *   2:40 → 160.5s  "Nicht-Eu-Bürger Besonders"
 *   4:00 → 240.5s  "Zeitplan — Wann"
 *   5:20 → 320.5s  "Kosten — Mehr"
 *   6:40 → 400.5s  "Großbritannien Als Vorbild"
 *   8:00 → 480.5s  "Kinder Und Minderjährige"
 *   9:20 → 560.5s  "Große Bild"
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
  // ── Section 1: Europa Sperrt (0–80s) ────────────────────────────────────────
  { id: 'chap-europa',      type: 'chapter', inTime:   0.5, outTime:   6.5, text: 'Europa\nSperrt' },
  { id: 'stat-60laender',   type: 'stat',    inTime:  18.0, outTime:  24.0, label: 'LÄNDER BRAUCHEN ETIAS',    value: '60+',     sub: 'Staaten ohne EU-Pass — Einreise nur mit Voranmeldung',   icon: '🌍' },
  { id: 'key-kein-visum',   type: 'key',     inTime:  35.0, outTime:  41.0, tag: 'WICHTIG',   text: 'ETIAS ist kein Visum —\nnur eine elektronische Vorab-Genehmigung' },

  // ── Section 2: Echte (80–160s) ───────────────────────────────────────────────
  { id: 'chap-echte',       type: 'chapter', inTime:  80.5, outTime:  86.5, text: 'Echte' },
  { id: 'stat-750k',        type: 'stat',    inTime:  98.0, outTime: 104.0, label: 'ANTRÄGE PRO TAG',          value: '750.000', sub: 'erwartet ab dem ersten Jahr nach dem Start',             icon: '📋' },
  { id: 'key-prescreening', type: 'key',     inTime: 115.0, outTime: 121.0, tag: 'SYSTEM',    text: 'Daten werden vor Ankunft geprüft —\nGrenzbeamte sehen Ergebnis sofort' },

  // ── Section 3: Nicht-EU-Bürger (160–240s) ────────────────────────────────────
  { id: 'chap-nichteubuerger', type: 'chapter', inTime: 160.5, outTime: 166.5, text: 'Nicht-EU-Bürger\nBesonders' },
  { id: 'stat-1pt4mrd',     type: 'stat',    inTime: 178.0, outTime: 184.0, label: 'BESUCHER PRO JAHR',       value: '1,4 Mrd.', sub: 'Nicht-EU-Reisende in den Schengen-Raum',               icon: '✈️' },
  { id: 'key-wer',          type: 'key',     inTime: 198.0, outTime: 204.0, tag: 'WER BETROFFEN', text: 'USA, UK, Kanada, Australien —\nauch visafreie Länder müssen ETIAS beantragen' },

  // ── Section 4: Zeitplan (240–320s) ───────────────────────────────────────────
  { id: 'chap-zeitplan',    type: 'chapter', inTime: 240.5, outTime: 246.5, text: 'Zeitplan —\nWann' },
  { id: 'stat-2025',        type: 'stat',    inTime: 258.0, outTime: 264.0, label: 'GEPLANTER START',         value: '2025',    sub: 'nach mehrfachen Verzögerungen seit 2021',                icon: '📅' },
  { id: 'key-verzoegerung', type: 'key',     inTime: 278.0, outTime: 284.0, tag: 'VERZÖGERUNG', text: 'Ursprünglich für 2021 geplant —\ntechnische & politische Hürden verschoben den Start' },

  // ── Section 5: Kosten (320–400s) ─────────────────────────────────────────────
  { id: 'chap-kosten',      type: 'chapter', inTime: 320.5, outTime: 326.5, text: 'Kosten —\nMehr' },
  { id: 'stat-7euro',       type: 'stat',    inTime: 338.0, outTime: 344.0, label: 'ANTRAGSGEBÜHR',           value: '7 €',     sub: 'einmalig — Kinder unter 18 & über 70 kostenlos',        icon: '💶' },
  { id: 'stat-3jahre',      type: 'stat',    inTime: 358.0, outTime: 364.0, label: 'GÜLTIGKEITSDAUER',        value: '3 Jahre', sub: 'oder bis Reisepassablauf — mehrfache Einreisen erlaubt', icon: '🗓️' },

  // ── Section 6: Großbritannien (400–480s) ─────────────────────────────────────
  { id: 'chap-gb',          type: 'chapter', inTime: 400.5, outTime: 406.5, text: 'Großbritannien\nAls Vorbild' },
  { id: 'stat-eta-uk',      type: 'stat',    inTime: 418.0, outTime: 424.0, label: 'UK ELECTRONIC TRAVEL AUTH', value: '£10',  sub: 'UK ETA — bereits aktiv für viele Länder',               icon: '🇬🇧' },
  { id: 'key-vorbild',      type: 'key',     inTime: 438.0, outTime: 444.0, tag: 'VORBILD',    text: 'Großbritannien startete ETA zuerst —\nEU folgt mit ETIAS dem gleichen Prinzip' },

  // ── Section 7: Kinder & Minderjährige (480–560s) ──────────────────────────────
  { id: 'chap-kinder',      type: 'chapter', inTime: 480.5, outTime: 486.5, text: 'Kinder Und\nMinderjährige' },
  { id: 'stat-unter18',     type: 'stat',    inTime: 498.0, outTime: 504.0, label: 'UNTER 18 JAHRE',          value: 'Kostenlos', sub: 'ETIAS nötig — aber keine Gebühr für Kinder',          icon: '👶' },
  { id: 'key-minderjahrige',type: 'key',     inTime: 518.0, outTime: 524.0, tag: 'ELTERN',     text: 'Eltern beantragen ETIAS für Kinder —\nohne Genehmigung kein Boarding' },

  // ── Section 8: Großes Bild (560–631s) ────────────────────────────────────────
  { id: 'chap-grossbild',   type: 'chapter', inTime: 560.5, outTime: 566.5, text: 'Große Bild' },
  { id: 'stat-95pct',       type: 'stat',    inTime: 578.0, outTime: 584.0, label: 'GENEHMIGUNGSRATE',        value: '95 %+',   sub: 'werden automatisch in Minuten genehmigt',               icon: '✅' },
  { id: 'key-ziel',         type: 'key',     inTime: 598.0, outTime: 604.0, tag: 'ZIEL',       text: 'Nicht Touristen stoppen —\nsondern Sicherheitsrisiken vor Ankunft erkennen' },
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
