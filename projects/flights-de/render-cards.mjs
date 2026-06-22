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
        <div style="font-size:17px;color:rgba(255,255,255,.82);margin-top:6px;line-height:1.4">${label}</div>
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
        <div style="font-size:23px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
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
        <div style="font-size:22px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
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
        <div style="font-size:21px;color:rgba(255,255,255,.85);line-height:1.5">${text}</div>
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
        <div style="font-size:22px;font-weight:700;color:#FFF;line-height:1.5;font-style:italic">${text}</div>
        <div style="font-size:18px;color:#CE93D8;margin-top:10px;letter-spacing:.05em">&mdash; ${attribution}</div>
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
        <div style="font-size:15px;font-weight:800;color:#FF8F00;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">${label}</div>
        <div style="height:1px;background:rgba(255,143,0,.25);margin-bottom:10px"></div>
        <div style="font-size:23px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
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
        <div style="font-size:14px;font-weight:800;color:#66BB6A;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px">Quelle</div>
        <div style="font-size:18px;color:rgba(255,255,255,.9);font-weight:600;line-height:1.35">${text}</div>
      </div>
    </div>
  </body></html>`;
}

const cards = [
  // ── CHAPTER CARDS (7) — top-left, cyan ─────────────────────────────────────
  { id: 'chap-01', type: 'chapter', inTime: 0.0,   outTime: 5.0,   html: buildChapter('Teure Geheimnis') },
  { id: 'chap-02', type: 'chapter', inTime: 101.0, outTime: 106.0, html: buildChapter('Erste Echte Unterschied') },
  { id: 'chap-03', type: 'chapter', inTime: 187.0, outTime: 192.0, html: buildChapter('Unterschied Entsteht') },
  { id: 'chap-04', type: 'chapter', inTime: 284.0, outTime: 289.0, html: buildChapter('Skyscanner Geheimtipp') },
  { id: 'chap-05', type: 'chapter', inTime: 380.0, outTime: 385.0, html: buildChapter('Routen-Test 2') },
  { id: 'chap-06', type: 'chapter', inTime: 469.0, outTime: 474.0, html: buildChapter('VPN-Trick — Preise') },
  { id: 'chap-07', type: 'chapter', inTime: 558.0, outTime: 563.0, html: buildChapter('Meilen Und Kreditkarten') },

  // ── STAT CARDS (6) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-300pct',  type: 'stat', inTime: 25.0,  outTime: 35.0,  html: buildStat('300%', 'Ticketpreis-Anstieg in Turnierphasen der WM 2026', '📈') },
  { id: 'stat-5mio',    type: 'stat', inTime: 47.0,  outTime: 57.0,  html: buildStat('5 Mio.', 'Internationale Besucher reisen zur WM in die USA', '✈️') },
  { id: 'stat-100mio',  type: 'stat', inTime: 85.0,  outTime: 95.0,  html: buildStat('100 Mio.', 'Monatliche Nutzer auf Skyscanner weltweit', '🌍') },
  { id: 'stat-130eur',  type: 'stat', inTime: 175.0, outTime: 185.0, html: buildStat('130€', 'Günstiger auf Skyscanner — für exakt denselben Flug', '💸') },
  { id: 'stat-21-70',   type: 'stat', inTime: 315.0, outTime: 325.0, html: buildStat('21–70', 'Tage vor Abflug buchen — günstigster Zeitraum laut Google', '📅') },
  { id: 'stat-15pct',   type: 'stat', inTime: 340.0, outTime: 350.0, html: buildStat('15%', 'Teurer an Montagen & Freitagen laut KAYAK-Daten', '📊') },

  // ── ALERT CARDS (4) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-ghost',    type: 'alert', inTime: 112.0, outTime: 119.0, html: buildAlert('Ghost Pricing: Skyscanner-Preise steigen beim Klicken — ärgerlich!', 'VORSICHT') },
  { id: 'alert-alarm',    type: 'alert', inTime: 218.0, outTime: 228.0, html: buildAlert('Skyscanner-Alarme kommen manchmal zu spät — günstiger Preis schon WEG!', 'TIMING') },
  { id: 'alert-ota',      type: 'alert', inTime: 242.0, outTime: 252.0, html: buildAlert('Drittanbieter-Buchung: Stornierung & Umbuchung ohne direkten Airline-Kontakt!', 'OTA-RISIKO') },
  { id: 'alert-gepaeck',  type: 'alert', inTime: 397.0, outTime: 407.0, html: buildAlert('Gepäckkosten verschwiegen — 4-köpfige Familie zahlt 320€ EXTRA!', 'VERSTECKT') },
  { id: 'alert-inkognito', type: 'alert', inTime: 430.0, outTime: 440.0, html: buildAlert('Inkognito-Modus spart NICHT — Airlines nutzen Server-seitiges Tracking!', 'MYTHOS') },

  // ── KEY CARDS (5) — bottom-left, orange ────────────────────────────────────
  { id: 'key-kalender',   type: 'key', inTime: 125.0, outTime: 135.0, html: buildKey('Google Preiskalender: Günstigster Tag farblich markiert — um Spieltage herumbuchen', 'GOOGLE TRICK') },
  { id: 'key-monat',      type: 'key', inTime: 145.0, outTime: 155.0, html: buildKey('Skyscanner: \'Ganzen Monat\' eingeben — günstigster Preis für JEDEN Tag', 'SKYSCANNER TRICK') },
  { id: 'key-cities',     type: 'key', inTime: 268.0, outTime: 278.0, html: buildKey('In günstigere US-Stadt fliegen (Dallas, Kansas City) und vor Ort weiterreisen', 'STRATEGIE') },
  { id: 'key-kombi',      type: 'key', inTime: 355.0, outTime: 365.0, html: buildKey('Skyscanner zum Entdecken + Google Flights zum Verifizieren = beste Kombination', 'DIE FORMEL') },
  { id: 'key-southwest',  type: 'key', inTime: 455.0, outTime: 465.0, html: buildKey('Southwest Airlines: Preise nur auf eigener Website — nicht bei Google oder Skyscanner', 'GEHEIMTIPP') },

  // ── DEFINITION CARDS (2) — top-left, teal ──────────────────────────────────
  { id: 'def-aggregator', type: 'definition', inTime: 65.0,  outTime: 75.0,  html: buildDefinition('Aggregator', 'Sammelt Preise von Airlines & Plattformen — kein eigenes Buchungssystem, nur Weiterleitung') },
  { id: 'def-ota',        type: 'definition', inTime: 195.0, outTime: 205.0, html: buildDefinition('OTA', 'Online Travel Agency — Reisebüros wie Kiwi oder Trip.com mit eigenen Sonderkonditionen') },

  // ── QUOTE CARD (1) — bottom-left, purple ───────────────────────────────────
  { id: 'quote-formel', type: 'quote', inTime: 530.0, outTime: 540.0, html: buildQuote('Skyscanner zum Entdecken, Google Flights zum Verifizieren. Das ist die Formel.', 'Fazit') },

  // ── RANK CARDS (3) — bottom-left, amber ────────────────────────────────────
  { id: 'rank-test1',  type: 'rank', inTime: 163.0, outTime: 170.0, html: buildRank('#1', 'PREISTEST FRA → NYC', 'Google: 987€ vs. Skyscanner: 849€ — gleicher Flug') },
  { id: 'rank-test2',  type: 'rank', inTime: 385.0, outTime: 392.0, html: buildRank('#2', 'PREISTEST BER → LAX', 'Google: 1.240€ vs. Skyscanner: 1.089€ — aber ohne Gepäck') },
  { id: 'rank-5steps', type: 'rank', inTime: 545.0, outTime: 555.0, html: buildRank('5', 'SCHRITTE ZUM SPAREN', 'Alarme + Monat-Filter + Verifizieren + Southwest + Früh buchen') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-skyscanner', type: 'source', inTime: 87.0,  outTime: 94.0,  html: buildSource('Skyscanner — 100 Mio. monatliche Nutzer weltweit') },
  { id: 'src-google',     type: 'source', inTime: 320.0, outTime: 327.0, html: buildSource('Google — Buchungszeitraum 21–70 Tage optimal') },
  { id: 'src-kayak',      type: 'source', inTime: 342.0, outTime: 349.0, html: buildSource('KAYAK — Dienstag & Mittwoch günstigste Buchungstage') },
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
