import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, 'card-frames');
mkdirSync(outDir, { recursive: true });

const W = 1280, H = 720;

const SHARP = `-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-feature-settings:"kern" 1,"liga" 1;`;

function bottomCardStyle(accentHex, bgRgba) {
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
      font-family:'Montserrat','Arial Black',Arial,sans-serif;${SHARP}}
    .card{position:absolute;left:40px;bottom:93px;display:flex;align-items:stretch;
      background:${bgRgba};border:2px solid ${accentHex}80;
      box-shadow:0 8px 32px rgba(0,0,0,0.65);border-radius:13px;overflow:hidden;}
    .stripe{width:5px;background:${accentHex};flex-shrink:0;}
    .inner{padding:15px 19px;flex:1;}
  </style>`;
}

function topCardStyle(accentHex, bgRgba) {
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
      font-family:'Montserrat','Arial Black',Arial,sans-serif;${SHARP}}
    .card{position:absolute;left:40px;top:40px;display:flex;align-items:stretch;
      background:${bgRgba};border:2px solid ${accentHex}70;
      box-shadow:0 8px 32px rgba(0,0,0,0.65);border-radius:13px;overflow:hidden;}
    .stripe{width:5px;background:${accentHex};flex-shrink:0;}
    .inner{padding:15px 19px;flex:1;}
  </style>`;
}

function pill(bgHex, textColor, label) {
  return `<div style="display:inline-block;background:${bgHex};color:${textColor};font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 11px;border-radius:8px;text-transform:uppercase;margin-bottom:10px">${label}</div>`;
}
function divider(color) {
  return `<div style="height:1px;background:${color};margin-bottom:10px"></div>`;
}

function buildChapter(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCardStyle('#00E5FF','rgba(0,8,30,0.50)')}
  </head><body>
    <div class="card" style="width:427px">
      <div class="stripe"></div>
      <div class="inner">
        ${divider('rgba(0,229,255,.35)')}
        <div style="font-size:24px;font-weight:800;color:#FFF;letter-spacing:-.3px;line-height:1.25">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildStat(value, label, icon) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#FFC107','rgba(10,8,0,0.50)')}
  </head><body>
    <div class="card" style="width:480px">
      <div class="stripe"></div>
      <div class="inner">
        <div style="font-size:51px;font-weight:900;color:#FFC107;line-height:1;letter-spacing:-2px">${value}</div>
        <div style="font-size:15px;color:rgba(255,255,255,.82);margin-top:6px;line-height:1.4">${label}</div>
      </div>
      <div style="font-size:35px;padding:15px 16px 15px 0;display:flex;align-items:flex-start;padding-top:19px">${icon}</div>
    </div>
  </body></html>`;
}

function buildAlert(text, badge) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#FF3C3C','rgba(35,5,5,0.50)')}
  </head><body>
    <div class="card" style="width:573px">
      <div class="stripe"></div>
      <div class="inner">
        ${pill('#FF3C3C','#fff',`⚠ ${badge}`)}
        ${divider('rgba(255,60,60,.3)')}
        <div style="font-size:21px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildKey(text, tag) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#FF6D00','rgba(20,8,0,0.50)')}
  </head><body>
    <div class="card" style="width:533px">
      <div class="stripe"></div>
      <div class="inner">
        ${pill('#FF6D00','#fff',`💡 ${tag}`)}
        ${divider('rgba(255,109,0,.3)')}
        <div style="font-size:20px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildDefinition(term, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCardStyle('#00BCD4','rgba(0,18,28,0.50)')}
  </head><body>
    <div class="card" style="width:550px">
      <div class="stripe"></div>
      <div class="inner">
        ${pill('#00BCD4','#001820','DEFINITION')}
        ${divider('rgba(0,188,212,.25)')}
        <div style="font-size:25px;font-weight:800;color:#FFF;margin-bottom:7px;line-height:1.25">${term}</div>
        <div style="font-size:19px;color:rgba(255,255,255,.85);line-height:1.5">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildQuote(text, attribution) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#9C27B0','rgba(15,5,30,0.50)')}
  </head><body>
    <div class="card" style="width:580px">
      <div class="stripe"></div>
      <div class="inner">
        <div style="font-size:37px;color:#9C27B0;line-height:1;margin-bottom:6px;opacity:0.9">&ldquo;</div>
        <div style="font-size:20px;font-weight:700;color:#FFF;line-height:1.5;font-style:italic">${text}</div>
        <div style="font-size:16px;color:#CE93D8;margin-top:10px;letter-spacing:.05em">&mdash; ${attribution}</div>
      </div>
    </div>
  </body></html>`;
}

function buildRank(rank, label, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
      font-family:'Montserrat','Arial Black',Arial,sans-serif;${SHARP}}
    .card{position:absolute;left:40px;bottom:93px;display:flex;align-items:stretch;
      background:rgba(20,14,0,0.50);border:2px solid rgba(255,143,0,0.5);
      box-shadow:0 8px 32px rgba(0,0,0,0.65);border-radius:13px;overflow:hidden;}
    .rank-block{display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#FF8F00,#E65100);width:87px;flex-shrink:0;}
    .inner{padding:15px 19px;width:347px;}
  </style>
  </head><body>
    <div class="card">
      <div class="rank-block">
        <div style="font-size:53px;font-weight:900;color:#fff3e0;line-height:1">${rank}</div>
      </div>
      <div class="inner">
        <div style="font-size:13px;font-weight:800;color:#FF8F00;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">${label}</div>
        <div style="height:1px;background:rgba(255,143,0,.25);margin-bottom:10px"></div>
        <div style="font-size:21px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildSource(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
      font-family:'Montserrat','Arial Black',Arial,sans-serif;${SHARP}}
    .card{position:absolute;right:40px;bottom:93px;display:flex;align-items:center;gap:10px;
      background:rgba(5,20,10,0.50);border:1.5px solid rgba(102,187,106,0.4);
      box-shadow:0 4px 16px rgba(0,0,0,0.5);border-radius:10px;padding:11px 17px;
      max-width:453px;}
  </style>
  </head><body>
    <div class="card">
      <div style="font-size:19px;flex-shrink:0">📰</div>
      <div>
        <div style="font-size:12px;font-weight:800;color:#66BB6A;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px">Quelle</div>
        <div style="font-size:16px;color:rgba(255,255,255,.9);font-weight:600;line-height:1.35">${text}</div>
      </div>
    </div>
  </body></html>`;
}

const cards = [
  // ── CHAPTER CARDS (10) — top-left, cyan ────────────────────────────────────
  { id: 'chap-01', type: 'chapter', inTime: 0.0,   outTime: 5.0,   html: buildChapter('Erschreckende Schlaf-Fakt') },
  { id: 'chap-02', type: 'chapter', inTime: 50.6,  outTime: 55.6,  html: buildChapter('Sitzplatz-Strategie') },
  { id: 'chap-03', type: 'chapter', inTime: 83.7,  outTime: 88.7,  html: buildChapter('Melatonin-Timing') },
  { id: 'chap-04', type: 'chapter', inTime: 103.1, outTime: 108.1, html: buildChapter('Schlafmaske Wählen') },
  { id: 'chap-05', type: 'chapter', inTime: 124.6, outTime: 129.6, html: buildChapter('Geräuschblockade') },
  { id: 'chap-06', type: 'chapter', inTime: 159.6, outTime: 164.6, html: buildChapter('Ernährungs-Timing') },
  { id: 'chap-07', type: 'chapter', inTime: 192.7, outTime: 197.7, html: buildChapter('Kompressions-Ausrüstung') },
  { id: 'chap-08', type: 'chapter', inTime: 229.6, outTime: 234.6, html: buildChapter('Licht-Management') },
  { id: 'chap-09', type: 'chapter', inTime: 282.2, outTime: 287.2, html: buildChapter('Körper-Uhr Sync') },
  { id: 'chap-10', type: 'chapter', inTime: 316.2, outTime: 321.2, html: buildChapter('Schlaf-Kleidung') },

  // ── STAT CARDS (4) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-40pct',  type: 'stat', inTime: 15,  outTime: 22,  html: buildStat('40%', 'Langstreckenpassagiere kommen klinisch erschöpft an', '😴') },
  { id: 'stat-40min',  type: 'stat', inTime: 60,  outTime: 67,  html: buildStat('+40 Min', 'Mehr Schlaf am Fensterplatz vs. Mittelplatz', '💺') },
  { id: 'stat-85db',   type: 'stat', inTime: 140, outTime: 147, html: buildStat('85 dB', 'Dauerlärm — chronischer Stress aufs Nervensystem', '🔊') },
  { id: 'stat-4mrd',   type: 'stat', inTime: 390, outTime: 397, html: buildStat('4,5 Mrd', 'Passagiere fliegen jährlich — IATA 2023', '✈️') },

  // ── RANK CARDS (2) — bottom-left, amber ────────────────────────────────────
  { id: 'rank-90min', type: 'rank', inTime: 95,  outTime: 102, html: buildRank("90'", 'MELATONIN-TIMING', 'Vor der Schlafzeit einnehmen — nicht beim Einsteigen') },
  { id: 'rank-50pct', type: 'rank', inTime: 350, outTime: 357, html: buildRank('50%', 'JETLAG-REDUKTION', 'Durch Vorab-Anpassung der inneren Uhr') },

  // ── ALERT CARDS (3) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-exitrow',   type: 'alert', inTime: 72,  outTime: 79,  html: buildAlert('Exit-Row ohne verstellbare Lehne — Sitze vor der Küche: Lärm und Licht die ganze Nacht!', 'SITZPLATZ-FALLE') },
  { id: 'alert-alkohol',   type: 'alert', inTime: 185, outTime: 192, html: buildAlert('Alkohol wirkt im Flieger schneller und fragmentiert den Schlaf — kein Glas Wein!', 'ALKOHOL-MYTHOS') },
  { id: 'alert-blaulicht',  type: 'alert', inTime: 248, outTime: 255, html: buildAlert('Blaues Licht blockiert Melatoninproduktion um bis zu DREI Stunden!', 'BLAULICHT') },

  // ── KEY CARDS (4) — bottom-left, orange ────────────────────────────────────
  { id: 'key-rauschen',    type: 'key', inTime: 155, outTime: 162, html: buildKey('Weißes oder braunes Rauschen über Kopfhörer — überlagert Babys, Husten und Durchsagen', 'BONUS-HACK') },
  { id: 'key-essen',       type: 'key', inTime: 172, outTime: 179, html: buildKey('Leicht essen mindestens 2 Stunden vor Abflug — Verdauung blockiert das Herunterfahren', 'ERNÄHRUNG') },
  { id: 'key-nacken',      type: 'key', inTime: 210, outTime: 217, html: buildKey('Nackenkissen mit seitlichem Support — Standard-U-Kissen kippen den Kopf nach vorne', 'PHYSIK') },
  { id: 'key-kleidung',    type: 'key', inTime: 335, outTime: 342, html: buildKey('Lockere, atmungsaktive Kleidung — Körpertemperatur sinkt beim Einschlafen um 0,5–1°C', 'SIGNAL') },

  // ── DEFINITION CARDS (2) — top-left, teal ──────────────────────────────────
  { id: 'def-rem',       type: 'definition', inTime: 113, outTime: 120, html: buildDefinition('REM-Schlaf', 'Rapid Eye Movement — die wichtigste Schlafphase für mentale Erholung und Gedächtnis') },
  { id: 'def-melatonin', type: 'definition', inTime: 240, outTime: 247, html: buildDefinition('Melatoninproduktion', 'Körpereigenes Schlafhormon — durch blaues Licht bis zu 3 Stunden blockiert') },

  // ── QUOTE CARDS (2) — bottom-left, purple ──────────────────────────────────
  { id: 'quote-piloten', type: 'quote', inTime: 410, outTime: 417, html: buildQuote('Schlaf ist keine Option — er ist Pflicht.', 'Langstreckenpiloten') },
  { id: 'quote-stack',   type: 'quote', inTime: 445, outTime: 452, html: buildQuote('Neun Tricks, ein System — dein persönlicher Schlaf-Stack.', 'Zusammenfassung') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-schlaf',  type: 'source', inTime: 57,  outTime: 64,  html: buildSource('Schlafstudien — Fensterplatz +40 Min Schlaf') },
  { id: 'src-noise',   type: 'source', inTime: 148, outTime: 155, html: buildSource('Lärmforschung — Triebwerk 85 dB Dauerton') },
  { id: 'src-iata',    type: 'source', inTime: 395, outTime: 402, html: buildSource('IATA World Air Transport Statistics 2023') },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  const manifest = [];
  console.log(`Rendering ${cards.length} cards at ${W}×${H}...`);
  for (const card of cards) {
    await page.setContent(card.html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const pngPath = join(outDir, `${card.id}.png`);
    await page.screenshot({ path: pngPath, omitBackground: true });
    manifest.push({ id: card.id, file: pngPath, inTime: card.inTime, outTime: card.outTime, type: card.type });
    console.log(`  ✓ ${card.id}.png  [${card.inTime}s → ${card.outTime}s]`);
  }
  await browser.close();
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${manifest.length} cards written.`);
})().catch(err => { console.error(err); process.exit(1); });
