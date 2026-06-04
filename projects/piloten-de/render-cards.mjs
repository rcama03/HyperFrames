/**
 * render-cards.mjs — piloten-de
 * "8 Piloten-Schichtlügen — Nr. 5 gefährdet dich wirklich"
 *
 * Source video: 1280×720, 536.3s
 * Voiceover: 536.328s  |  timings: 552.54s → scale ≈ 0.9707
 *
 * Chapter timestamps (user-specified, scaled from mm:ss):
 *   0:00 →   0.5s  "Erschreckende Einstieg"
 *   1:20 →  77.5s  "Zahlen Hinter Der"
 *   2:40 → 155.0s  "Lüge Nr. 5"
 *   4:00 → 232.5s  "Aerotoxic Syndrome"
 *   5:20 → 310.5s  "Nach Der Landung"
 *   6:40 → 388.0s  "Du Als Passagier"
 *   8:00 → 465.5s  "Zusammenfassung"
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

// ── Card definitions — all 6s duration, timings in output video seconds ────────
const cards = [
  // ── Chapter cards — top-left navy/cyan ──────────────────────────────────────
  { id: 'chap-einstieg',       type: 'chapter', inTime:   0.5, outTime:   6.5, text: 'Erschreckende\nEinstieg' },
  { id: 'chap-zahlen',         type: 'chapter', inTime:  77.5, outTime:  83.5, text: 'Zahlen Hinter\nDer' },
  { id: 'chap-luege5',         type: 'chapter', inTime: 155.0, outTime: 161.0, text: 'Lüge Nr. 5' },
  { id: 'chap-aerotoxic',      type: 'chapter', inTime: 232.5, outTime: 238.5, text: 'Aerotoxic\nSyndrome' },
  { id: 'chap-landung',        type: 'chapter', inTime: 310.5, outTime: 316.5, text: 'Nach Der\nLandung' },
  { id: 'chap-passagier',      type: 'chapter', inTime: 388.0, outTime: 394.0, text: 'Du Als\nPassagier' },
  { id: 'chap-zusammenfassung',type: 'chapter', inTime: 465.5, outTime: 471.5, text: 'Zusammenfassung' },

  // ── Stat cards — bottom-left gold stripe, big number ────────────────────────
  { id: 'stat-43pct',  type: 'stat', inTime:  21.0, outTime:  27.0, label: 'PILOTEN EINGESCHLAFEN',        value: '43 %',    sub: 'zugegeben — während des Fluges in der Luft',    icon: '😴' },
  { id: 'stat-58',     type: 'stat', inTime:  38.0, outTime:  44.0, label: 'VERLETZT DURCH TURBULENZEN',   value: '58',      sub: 'Passagiere & Crew pro Jahr — weltweit',          icon: '⚠️' },
  { id: 'stat-56pct',  type: 'stat', inTime:  84.5, outTime:  90.5, label: 'KRITISCHER FEHLER DURCH',      value: '56 %',    sub: 'der Piloten — auf Müdigkeit zurückgeführt',      icon: '😴' },
  { id: 'stat-400',    type: 'stat', inTime: 145.0, outTime: 151.0, label: 'DEFEKTE SYSTEME — LEGAL',      value: '400+',    sub: 'Flugzeug darf trotzdem starten (MEL)',           icon: '⚙️' },
  { id: 'stat-12min',  type: 'stat', inTime: 242.0, outTime: 248.0, label: 'SAUERSTOFF NACH DRUCKVERLUST', value: '12 Min.', sub: 'dann entscheidet der Pilot — nicht du',           icon: '🫁' },
  { id: 'stat-15sek',  type: 'stat', inTime: 260.0, outTime: 266.0, label: 'BIS ZUR BEWUSSTLOSIGKEIT',     value: '15 Sek.', sub: 'bei Druckverlust in 35.000 Fuß Höhe',            icon: '🚨' },
  { id: 'stat-11mio',  type: 'stat', inTime: 422.0, outTime: 428.0, label: 'RISIKO FLUGZEUGABSTURZ',       value: '1:11 Mio.',sub: 'Fliegen ist das sicherste Transportmittel',    icon: '✈️' },
  { id: 'stat-95x',    type: 'stat', inTime: 435.0, outTime: 441.0, label: 'AUTO VS. FLIEGEN',             value: '95×',     sub: 'gefährlicher — trotzdem fürchtest du das Fliegen',icon: '🚗' },
  { id: 'stat-98pct',  type: 'stat', inTime: 454.0, outTime: 460.0, label: 'AUTOPILOT STEUERT',            value: '98 %',    sub: 'der Zeit auf Langstrecke — Pilot überwacht',    icon: '🤖' },

  // ── Key cards — bottom-left gold badge + text ────────────────────────────────
  { id: 'key-mahlzeit',  type: 'key', inTime:  94.0, outTime: 100.0, tag: 'VORSCHRIFT',    text: 'Pilot & Co-Pilot essen verschieden —\nVergiftung soll nicht beide treffen' },
  { id: 'key-notfall',   type: 'key', inTime: 163.0, outTime: 169.0, tag: 'STILLE NOTFÄLLE', text: 'Du hörst nur Musik —\nintern laufen Notfallprotokolle' },
  { id: 'key-aerotoxic', type: 'key', inTime: 223.0, outTime: 229.0, tag: 'AEROTOXIC',     text: 'Zapfluft direkt aus Triebwerken —\noffizielle Anerkennung fehlt bis heute' },
  { id: 'key-reports',   type: 'key', inTime: 317.5, outTime: 323.5, tag: 'GEHEIM',        text: 'Air Safety Reports bleiben intern —\nPassagiere erfahren nie davon' },
  { id: 'key-recht',     type: 'key', inTime: 395.0, outTime: 401.0, tag: 'DEIN RECHT',    text: 'Kein technischer Grund mehr,\nPassagiere im Dunkeln zu lassen' },
  { id: 'key-system',    type: 'key', inTime: 403.0, outTime: 409.0, tag: 'SYSTEM',        text: 'Piloten lügen nicht aus Böswilligkeit —\naber vollständige Transparenz fehlt' },
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
