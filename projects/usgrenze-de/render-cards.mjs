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
        <div style="font-size:53px;font-weight:900;color:#fff3e0;line-height:1">#${rank}</div>
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
  { id: 'chap-01', type: 'chapter', inTime: 0.0,    outTime: 5.0,    html: buildChapter('Schock An Der Grenze') },
  { id: 'chap-02', type: 'chapter', inTime: 86.6,   outTime: 91.6,   html: buildChapter('Unterkunftsnachweis') },
  { id: 'chap-03', type: 'chapter', inTime: 103.2,  outTime: 108.2,  html: buildChapter('Rückflugticket') },
  { id: 'chap-04', type: 'chapter', inTime: 137.2,  outTime: 142.2,  html: buildChapter('Finanzielle Mittel') },
  { id: 'chap-05', type: 'chapter', inTime: 192.7,  outTime: 197.7,  html: buildChapter('Reisebegleitung & Kontakte') },
  { id: 'chap-06', type: 'chapter', inTime: 265.7,  outTime: 270.7,  html: buildChapter('Zweck Des Besuchs') },
  { id: 'chap-07', type: 'chapter', inTime: 319.2,  outTime: 324.2,  html: buildChapter('Vorstrafen & Verhaftungen') },
  { id: 'chap-08', type: 'chapter', inTime: 379.6,  outTime: 384.6,  html: buildChapter('Soziale Bindungen') },
  { id: 'chap-09', type: 'chapter', inTime: 452.5,  outTime: 457.5,  html: buildChapter('Kontakt Zu US-Bürgern') },
  { id: 'chap-10', type: 'chapter', inTime: 488.6,  outTime: 493.6,  html: buildChapter('Gepäckinhalt & Zollregeln') },

  // ── STAT CARDS (6) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-besucher',  type: 'stat', inTime: 25,  outTime: 33,  html: buildStat('5 Mio',    'Ausländische Besucher zur WM 2026 erwartet',       '🌍') },
  { id: 'stat-sekundar',  type: 'stat', inTime: 125, outTime: 133, html: buildStat('40%',      'Der Fans in erweiterte Sekundärbefragung',          '🔍') },
  { id: 'stat-jfk',       type: 'stat', inTime: 225, outTime: 233, html: buildStat('200.000',  'In Sekundärkontrolle am JFK allein 2023',           '✈️') },
  { id: 'stat-bio',       type: 'stat', inTime: 295, outTime: 303, html: buildStat('180+',     'Länder im biometrischen Abgleichssystem',           '🛂') },
  { id: 'stat-ats',       type: 'stat', inTime: 355, outTime: 363, html: buildStat('Echtzeit', 'ATS bewertet dich noch vor der Landung',            '💻') },
  { id: 'stat-busse',     type: 'stat', inTime: 505, outTime: 513, html: buildStat('10.000$',  'Maximalstrafe für verbotene Lebensmittel',          '⚖️') },

  // ── ALERT CARDS (4) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-esta',     type: 'alert', inTime: 55,  outTime: 62,  html: buildAlert('ESTA ist NUR eine Vorabgenehmigung — der Beamte am Schalter entscheidet!', 'WARNUNG') },
  { id: 'alert-zoeger',   type: 'alert', inTime: 115, outTime: 122, html: buildAlert('Wer beim Rückflugdatum zögert, löst sofort eine Warnstufe aus!', 'ACHTUNG') },
  { id: 'alert-saetze',   type: 'alert', inTime: 240, outTime: 247, html: buildAlert('Verbotene Sätze: \'Ich schaue mal ob ich arbeiten kann\' — sofort Nebenraum!', 'VERBOTEN') },
  { id: 'alert-rechte',   type: 'alert', inTime: 555, outTime: 562, html: buildAlert('Kein Anwalt, kein Schweigen — als Nicht-Bürger fast keine Rechte an der Grenze!', 'ACHTUNG') },

  // ── KEY CARDS (5) — bottom-left, orange ────────────────────────────────────
  { id: 'key-doku',       type: 'key', inTime: 93,  outTime: 101, html: buildKey('Ausgedruckte Buchungsbestätigungen, Adressen und Telefonnummern griffbereit haben', 'DOKUMENTE') },
  { id: 'key-finanzen',   type: 'key', inTime: 148, outTime: 156, html: buildKey('Kontoauszüge, Kreditkartenlimits und Bargeld als Nachweis mitführen', 'FINANZNACHWEIS') },
  { id: 'key-tickets',    type: 'key', inTime: 280, outTime: 288, html: buildKey('WM-Tickets ausgedruckt mitbringen — vollständige Reiseroute ist stärkstes Argument', 'REISETIPP') },
  { id: 'key-mappe',      type: 'key', inTime: 430, outTime: 438, html: buildKey('Dokumentenmappe: Rückflug, Hotel, WM-Tickets, Kontoauszüge, Versicherung', 'VORBEREITUNG') },
  { id: 'key-antworten',  type: 'key', inTime: 465, outTime: 473, html: buildKey('Kurze, klare Antworten — kein Witz, kein Sarkasmus am Grenzschalter!', 'KOMMUNIKATION') },

  // ── DEFINITION CARDS (2) — top-left, teal ─────────────────────────────────
  { id: 'def-sekundar',   type: 'definition', inTime: 210, outTime: 218, html: buildDefinition('Sekundärbefragung', 'Separater Raum, kein Handy, stundenlange Wartezeit — für bis zu 40% der WM-Fans') },
  { id: 'def-ats',        type: 'definition', inTime: 340, outTime: 348, html: buildDefinition('ATS — Automated Targeting System', 'Bewertet Flugbuchungen, Reisemuster und Online-Daten vor der Landung') },

  // ── QUOTE CARD (1) — bottom-left, purple ───────────────────────────────────
  { id: 'quote-interview', type: 'quote', inTime: 600, outTime: 608, html: buildQuote('Treat every question like an interview you really want to win.', 'Reisevorbereitung WM 2026') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-fbi',        type: 'source', inTime: 35,  outTime: 42,  html: buildSource('FBI & Homeland Security — Spezialprotokolle für WM 2026') },
  { id: 'src-jfk',        type: 'source', inTime: 300, outTime: 307, html: buildSource('JFK Airport Einreisestatistik 2023') },
  { id: 'src-cbp',        type: 'source', inTime: 360, outTime: 367, html: buildSource('US Customs & Border Protection (CBP)') },

  // ── RANK CARD (1) — bottom-left, amber ─────────────────────────────────────
  { id: 'rank-streng',    type: 'rank', inTime: 478, outTime: 486, html: buildRank(1, 'STRENGSTE EINREISEPUNKTE', 'New York & Los Angeles') },
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
