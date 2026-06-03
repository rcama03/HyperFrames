/**
 * Renders motion graphics cards for lounge-de project.
 * Output: card-frames/*.png + card-manifest.json
 * Source video: 1280×720, voiceover 540.624s (scale=0.971245 from timings 0–556.63s)
 *
 * Chapter timestamps (user-specified, scaled to voiceover):
 *   0:00  → 0.5s   "Schockierende Lounge-Fakt"
 *   1:37  → 97.0s  "Trick 3 —"
 *   3:14  → 194.5s "Du Die Frage"
 *   4:51  → 291.5s "Wichtiger Hinweis Zur"
 *   6:28  → 388.5s "Häufigste Fehler Beim"
 *   8:05  → 485.6s "Airlines Nicht Wollen,"
 *   8:28  → 508.5s "Entscheidende Unterschied Z"
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

// ── Card definitions — all timings in voiceover-scaled seconds (0–540s) ───────
// All cards are exactly 5s duration. ONE card on screen at a time.
const cards = [
  // ── Chapter cards — top-left navy/cyan ──────────────────────────────────────
  { id: 'chap-lounge',      type: 'chapter', inTime: 0.5,   outTime: 5.5,   text: 'Schockierende\nLounge-Fakt' },
  { id: 'chap-trick3',      type: 'chapter', inTime: 97.0,  outTime: 102.0, text: 'Trick 3 —' },
  { id: 'chap-frage',       type: 'chapter', inTime: 194.5, outTime: 199.5, text: 'Du Die Frage' },
  { id: 'chap-hinweis',     type: 'chapter', inTime: 291.5, outTime: 296.5, text: 'Wichtiger Hinweis\nZur' },
  { id: 'chap-fehler',      type: 'chapter', inTime: 388.5, outTime: 393.5, text: 'Häufigste Fehler\nBeim' },
  { id: 'chap-airlines',    type: 'chapter', inTime: 485.6, outTime: 490.6, text: 'Airlines Nicht\nWollen,' },
  { id: 'chap-unterschied', type: 'chapter', inTime: 508.5, outTime: 513.5, text: 'Entscheidende\nUnterschied Z' },

  // ── Stat cards — bottom-left gold stripe, big number ────────────────────────
  { id: 'stat-80pct',   type: 'stat', inTime: 2.0,   outTime: 7.0,   label: 'ZAHLEN FÜR LOUNGE-ZUGANG',  value: '80 %',    sub: 'der Reisenden — obwohl es kostenlos geht',          icon: '✈️' },
  { id: 'stat-50euro',  type: 'stat', inTime: 18.0,  outTime: 23.0,  label: 'LOUNGE-BESUCH WERT',         value: '50 €',    sub: 'im Durchschnitt — die meisten zahlen 0',            icon: '💰' },
  { id: 'stat-1300',    type: 'stat', inTime: 48.0,  outTime: 53.0,  label: 'LOUNGES WELTWEIT',           value: '1.300',   sub: 'mit Premium-Kreditkarte — kein Aufpreis',           icon: '💳' },
  { id: 'stat-1500',    type: 'stat', inTime: 63.5,  outTime: 68.5,  label: 'PRIORITY PASS LOUNGES',      value: '1.500',   sub: 'in mehr als 145 Ländern weltweit',                  icon: '🌍' },
  { id: 'stat-80euro',  type: 'stat', inTime: 84.0,  outTime: 89.0,  label: 'GÜNSTIGSTE STATUSFLÜGE AB',  value: '80 €',    sub: 'ein Flug genügt für Lounge-Zugang',                 icon: '🎫' },
  { id: 'stat-40pct',   type: 'stat', inTime: 113.5, outTime: 118.5, label: 'RABATT VIA APPS',            value: '40 %',    sub: 'LoungeBuddy, Regus — selbe Lounges günstiger',      icon: '📱' },
  { id: 'stat-8pct',    type: 'stat', inTime: 181.0, outTime: 186.0, label: 'BEANTRAGEN IHRE RECHTE',     value: '< 8 %',   sub: 'der berechtigten Passagiere bei Verspätung',        icon: '⚖️' },
  { id: 'stat-150euro', type: 'stat', inTime: 196.5, outTime: 201.5, label: 'BUSINESS-UPGRADE AB',        value: '150 €',   sub: 'manchmal schon ab 80 € vor dem Abflug',             icon: '🏆' },
  { id: 'stat-70pct',   type: 'stat', inTime: 336.0, outTime: 341.0, label: 'LOUNGE-BESUCHER',            value: '70 %',    sub: 'haben nie aktiv nach Alternativen gefragt',         icon: '🚪' },
  { id: 'stat-7mrd',    type: 'stat', inTime: 467.5, outTime: 472.5, label: 'FLUGREISENDE BIS 2030',      value: '7 Mrd.',  sub: 'Nachfrage nach Premium-Lounges steigt stark',        icon: '📈' },

  // ── Key cards — bottom-left gold badge + text ────────────────────────────────
  { id: 'key-gratis',      type: 'key', inTime: 33.5,  outTime: 38.5,  tag: 'SYSTEM',       text: 'Airlines verdienen Milliarden —\ndu kannst kostenlos eintreten' },
  { id: 'key-companion',   type: 'key', inTime: 100.0, outTime: 105.0, tag: 'BONUS',        text: 'Begleitperson kostenlos\nmitbringen — legal & problemlos' },
  { id: 'key-eu261',       type: 'key', inTime: 143.0, outTime: 148.0, tag: 'TRICK 6',      text: 'EU-Verordnung 261 —\ngesetzlicher Lounge-Anspruch' },
  { id: 'key-voucher',     type: 'key', inTime: 165.5, outTime: 170.5, tag: 'FORMULIERUNG', text: '»Kann ich einen\nLounge-Voucher erhalten?«' },
  { id: 'key-trial',       type: 'key', inTime: 232.0, outTime: 237.0, tag: 'TESTZEITRAUM', text: '30–90 Tage kostenlos —\ndann fristgerecht kündigen' },
  { id: 'key-asia',        type: 'key', inTime: 451.0, outTime: 456.0, tag: 'ASIEN-TIPP',   text: 'Singapur, Seoul, Tokio:\nBedingungen großzügiger' },
  { id: 'key-aktionsplan', type: 'key', inTime: 488.5, outTime: 493.5, tag: 'DEIN PLAN',    text: 'Kreditkarte prüfen +\nEU-261 auf Handy speichern' },
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
