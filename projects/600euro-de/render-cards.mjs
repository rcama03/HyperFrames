/**
 * Renders motion graphics cards for 600euro-de project.
 * Output: card-frames/*.png + card-manifest.json
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
        ${pill('#00E5FF','#000d1a','KAPITEL')}
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

function buildKey(text, tag) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#FF6D00','rgba(20,8,0,0.50)')}
  </head><body>
    <div class="card" style="width:533px">
      <div class="stripe"></div>
      <div class="inner">
        ${pill('#FF6D00','#fff',tag)}
        ${divider('rgba(255,109,0,.3)')}
        <div style="font-size:22px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
      </div>
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
        ${pill('#FF3C3C','#fff',badge)}
        ${divider('rgba(255,60,60,.3)')}
        <div style="font-size:23px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
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
      <div style="font-size:14px;font-weight:800;color:#66BB6A;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
      <div style="font-size:18px;color:rgba(255,255,255,.9);font-weight:600;line-height:1.35">${text}</div>
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

const cards = [
  // ── CHAPTER CARDS (4) — top-left, cyan ────────────────────────────────────
  { id: 'chap-schock',    inTime: 0.5,   outTime: 4.0,   html: buildChapter('600-Euro-Schock') },
  { id: 'chap-kalender',  inTime: 68.5,  outTime: 72.0,  html: buildChapter('Kalender-Trick') },
  { id: 'chap-inkognito', inTime: 136.0, outTime: 140.0, html: buildChapter('Inkognito-Modus — Mythos') },
  { id: 'chap-ersparnis', inTime: 201.5, outTime: 205.5, html: buildChapter('Meine Genaue Ersparnis') },

  // ── STAT CARDS (6) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-50x',    inTime: 21.0,  outTime: 26.0,  html: buildStat('50×/Tag', 'Airlines ändern ihre Ticketpreise', '✈️') },
  { id: 'stat-61pct',  inTime: 28.0,  outTime: 34.0,  html: buildStat('61%', 'Durchschnittliche Preisschwankung auf beliebten Routen', '📉') },
  { id: 'stat-3x',     inTime: 44.0,  outTime: 50.0,  html: buildStat('3×', 'Preise auf WM-Routen — dreimal so hoch wie normal', '💸') },
  { id: 'stat-400eur', inTime: 78.0,  outTime: 84.0,  html: buildStat('–400€', 'Ersparnis durch 3 Tage früher fliegen', '📅') },
  { id: 'stat-214eur', inTime: 116.0, outTime: 120.5, html: buildStat('–214€', 'Ersparnis durch Preisalarm nach 2 Wochen', '📧') },
  { id: 'stat-4080',   inTime: 192.0, outTime: 199.0, html: buildStat('40–80%', 'WM-Flugpreise über dem Normalpreis', '📈') },

  // ── KEY CARDS (4) — bottom-left, orange ────────────────────────────────────
  { id: 'key-google',  inTime: 53.0,  outTime: 61.0,  html: buildKey('Google Flights: Preisalarm, Preishistorie und Kalender-Trick — nicht nur einfach suchen!', '💡 GEHEIMWAFFE') },
  { id: 'key-alarm',   inTime: 105.0, outTime: 113.0, html: buildKey('Route suchen → Preisalarm aktivieren → Warten auf E-Mail wenn der Preis fällt', '🔔 PREISALARM') },
  { id: 'key-airport', inTime: 124.0, outTime: 132.0, html: buildKey('Umliegende Flughäfen checken — oft 100 bis 300€ günstiger für WM-Destinationen', '✈️ FLUGHAFEN-TRICK') },
  { id: 'key-meilen',  inTime: 220.0, outTime: 228.0, html: buildKey('Kreditkarten-Meilen jetzt einsetzen — Miles & More hat WM-Bonusaktionen', '🏆 MEILEN-TIPP') },

  // ── ALERT CARDS (2) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-inkognito', inTime: 141.0, outTime: 149.0, html: buildAlert('Inkognito-Modus hilft nur bedingt — Airlines nutzen primär IP-Adressen und Standortdaten, nicht nur Cookies!', '⚠ MYTHOS') },
  { id: 'alert-ticket',    inTime: 180.0, outTime: 186.0, html: buildAlert('Hidden City: Nur Handgepäck, keine Rückflüge auf derselben Buchung — sonst Ticket annulliert!', '⚠ ACHTUNG') },

  // ── DEFINITION CARD (1) — top-left, teal ───────────────────────────────────
  { id: 'def-hidden', inTime: 163.0, outTime: 170.0, html: buildDefinition('Hidden City Ticketing', 'Über einen Zwischenstopp buchen und dort einfach aussteigen — nicht illegal, aber Airlines mögen es nicht') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-iata',     inTime: 25.0,  outTime: 30.0,  html: buildSource('IATA — 61% Preisschwankung') },
  { id: 'src-cheapair', inTime: 90.0,  outTime: 95.0,  html: buildSource('CheapAir — 900 Mio. Flugpreise analysiert') },
  { id: 'src-kayak',    inTime: 187.0, outTime: 192.0, html: buildSource('Kayak & Skyscanner — WM-Preisprognose') },

  // ── QUOTE CARD (1) — bottom-left, purple ───────────────────────────────────
  { id: 'quote-system', inTime: 265.0, outTime: 272.0, html: buildQuote('600 Euro Ersparnis sind kein Glück — sie sind das Ergebnis von System.', 'Fazit') },

  // ── STAT — breakdown (1) — bottom-left, gold ──────────────────────────────
  { id: 'stat-600', inTime: 206.0, outTime: 214.0, html: buildStat('600€', '214€ Preisalarm + 183€ Kalender + 203€ Flughafen', '💰') },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  const manifest = { cards: [] };
  console.log(`Rendering ${cards.length} cards at ${W}×${H}...`);
  for (const card of cards) {
    await page.setContent(card.html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const pngPath = join(outDir, `${card.id}.png`);
    await page.screenshot({ path: pngPath, omitBackground: true });
    manifest.cards.push({ id: card.id, path: `card-frames/${card.id}.png`, inTime: card.inTime, outTime: card.outTime });
    console.log(`  ✓ ${card.id}.png  [${card.inTime}s → ${card.outTime}s]`);
  }
  await browser.close();
  writeFileSync(join(__dir, 'card-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${manifest.cards.length} cards written to card-manifest.json`);
})().catch(err => { console.error(err); process.exit(1); });
