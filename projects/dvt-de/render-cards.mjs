/**
 * render-cards.mjs — dvt-de
 * "9 DVT-Wahrheiten im Flieger — Nr. 6 trifft dich sofort"
 *
 * Source video: 1280×720, 656.68s
 *
 * Chapter timestamps (mm:ss → seconds):
 *   0:00 →   0.5s  "Stille Killer An"
 *   1:33 →  93.5s  "Wahrheit Nr. 2"
 *   3:11 → 191.5s  "Wahrheit Nr. 6"
 *   4:55 → 295.5s  "Kompressionsstrümpfe Wirklich"
 *   6:20 → 380.5s  "Du Nach Der"
 *   8:03 → 483.5s  "Flugangst Und Dvt"
 *   9:46 → 586.5s  "Rechtslage — Können"
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
  // ── Section 1: Stille Killer An (0–93.5s) ────────────────────────────────────
  { id: 'chap-stille',       type: 'chapter', inTime:   0.5, outTime:   6.5, text: 'Stille Killer\nAn Bord' },
  { id: 'stat-300pct',       type: 'stat',    inTime:  18.0, outTime:  24.0, label: 'DVT-RISIKO BEI LANGSTRECKE',   value: '↑300%',     sub: 'laut WHO bei Flügen über 4 Stunden',                    icon: '🩺' },
  { id: 'key-dvt-def',       type: 'key',     inTime:  38.0, outTime:  44.0, tag: 'WAS IST DVT',  text: 'Blutgerinnsel in tiefen Venen —\nkann zur Lunge wandern: Lungenembolie tödlich' },

  // ── Section 2: Wahrheit Nr. 2 (93.5–191.5s) ──────────────────────────────────
  { id: 'chap-wahrheit2',    type: 'chapter', inTime:  93.5, outTime:  99.5, text: 'Wahrheit\nNr. 2' },
  { id: 'stat-blutfluss',    type: 'stat',    inTime: 111.0, outTime: 117.0, label: 'BLUTFLUSS-VERLANGSAMUNG',      value: '−50%',      sub: 'in Beinvenen beim Sitzen in engen Flugsitzen',          icon: '🦵' },
  { id: 'stat-fluessigkeit', type: 'stat',    inTime: 133.0, outTime: 139.0, label: 'FLÜSSIGKEITSVERLUST AN BORD', value: '1 Liter',   sub: 'unbemerkt verloren — Kabinenluft unter 20% Luftfeuchtigkeit', icon: '💧' },
  { id: 'key-alkohol',       type: 'key',     inTime: 154.0, outTime: 160.0, tag: 'ACHTUNG',      text: 'Alkohol an Bord fördert Dehydration —\nGerinnungsrisiko steigt beim anschließenden Schlafen' },

  // ── Section 3: Wahrheit Nr. 6 (191.5–295.5s) ─────────────────────────────────
  { id: 'chap-wahrheit6',    type: 'chapter', inTime: 191.5, outTime: 197.5, text: 'Wahrheit\nNr. 6' },
  { id: 'key-emma',          type: 'key',     inTime: 209.0, outTime: 215.0, tag: 'ECHTER FALL',  text: 'Emma Christoffersen, 28 — starb 2000\nnach Flug Sydney→London an Lungenembolie' },
  { id: 'stat-90min',        type: 'stat',    inTime: 232.0, outTime: 238.0, label: 'RISIKOSTART',                 value: '90 Min.',   sub: 'ununterbrochenes Sitzen — Blutfluss verändert sich messbar', icon: '⏱️' },

  // ── Section 4: Kompressionsstrümpfe (295.5–380.5s) ───────────────────────────
  { id: 'chap-kompressions', type: 'chapter', inTime: 295.5, outTime: 301.5, text: 'Kompressionsstrümpfe\nWirklich?' },
  { id: 'stat-90pct',        type: 'stat',    inTime: 313.0, outTime: 319.0, label: 'DVT-RISIKO REDUKTION',        value: '−90%',      sub: 'durch Reisekompressionsstrümpfe (British Medical Journal)', icon: '🧦' },
  { id: 'key-risikogruppen', type: 'key',     inTime: 336.0, outTime: 342.0, tag: 'RISIKOGRUPPEN', text: 'Pille, 50+, Schwangere, Übergewicht —\nKrebspatienten & frisch Operierte: besonders gefährdet' },

  // ── Section 5: Du Nach Der (380.5–483.5s) ────────────────────────────────────
  { id: 'chap-nach-flug',    type: 'chapter', inTime: 380.5, outTime: 386.5, text: 'Du Nach\nDem Flug' },
  { id: 'stat-250ml',        type: 'stat',    inTime: 398.0, outTime: 404.0, label: 'EMPFOHLENE TRINKMENGE',       value: '250 ml',    sub: 'Wasser pro Stunde — 2,5 L auf einem Zehnstundenflug',   icon: '💧' },
  { id: 'key-48h',           type: 'key',     inTime: 421.0, outTime: 427.0, tag: 'HÖCHSTE GEFAHR', text: '48–72 Stunden NACH dem Flug —\nbei Schwellung oder Rötung sofort zum Arzt' },

  // ── Section 6: Flugangst Und Dvt (483.5–586.5s) ──────────────────────────────
  { id: 'chap-flugangst',    type: 'chapter', inTime: 483.5, outTime: 489.5, text: 'Flugangst\nUnd DVT' },
  { id: 'key-aspirin',       type: 'key',     inTime: 507.0, outTime: 513.0, tag: 'ACHTUNG',      text: 'Aspirin schützt NICHT vor DVT —\nnur Antikoagulantien wie Heparin sind wirksam' },
  { id: 'stat-economy',      type: 'stat',    inTime: 530.0, outTime: 536.0, label: 'DVT ECONOMY VS BUSINESS',    value: '3× häufiger', sub: 'DVT-Fälle in Economy gegenüber Business/First Class', icon: '✈️' },

  // ── Section 7: Rechtslage — Können (586.5–656.66s) ───────────────────────────
  { id: 'chap-rechtslage',   type: 'chapter', inTime: 586.5, outTime: 592.5, text: 'Rechtslage —\nKönnen' },
  { id: 'key-airlines',      type: 'key',     inTime: 604.0, outTime: 610.0, tag: 'AIRLINES',     text: 'Qantas & British Airways informieren proaktiv —\nviele Fluggesellschaften verschweigen das DVT-Risiko' },
  { id: 'key-montreal',      type: 'key',     inTime: 627.0, outTime: 633.0, tag: 'RECHTSLAGE',   text: 'Montrealer Übereinkommen — Gerichte stufen DVT\nbisher meist als Eigenrisiko des Passagiers ein' },
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
