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
  // ── CHAPTER CARDS (11) — top-left, cyan ────────────────────────────────────
  { id: 'chap-01', type: 'chapter', inTime: 0.0,   outTime: 5.0,   html: buildChapter('Tausende Gestoppt') },
  { id: 'chap-02', type: 'chapter', inTime: 46.0,  outTime: 51.0,  html: buildChapter('100ml-Flüssigkeiten-Falle') },
  { id: 'chap-03', type: 'chapter', inTime: 90.0,  outTime: 95.0,  html: buildChapter('Powerbank-Wattstunden-Falle') },
  { id: 'chap-04', type: 'chapter', inTime: 140.0, outTime: 145.0, html: buildChapter('Verbotene-Messer-Falle') },
  { id: 'chap-05', type: 'chapter', inTime: 179.0, outTime: 184.0, html: buildChapter('Duty-Free-Alkohol-Falle') },
  { id: 'chap-06', type: 'chapter', inTime: 226.0, outTime: 231.0, html: buildChapter('Zollpflicht-Freigrenze-Falle') },
  { id: 'chap-07', type: 'chapter', inTime: 270.0, outTime: 275.0, html: buildChapter('Medikamenten-Zulassungs-Falle') },
  { id: 'chap-08', type: 'chapter', inTime: 313.0, outTime: 318.0, html: buildChapter('Lebensmittel-Import-Verbot') },
  { id: 'chap-09', type: 'chapter', inTime: 363.0, outTime: 368.0, html: buildChapter('Lithium-Akku-E-Gerät-Verbot') },
  { id: 'chap-10', type: 'chapter', inTime: 406.0, outTime: 411.0, html: buildChapter('ESTA-Antrags-Zeitfalle') },
  { id: 'chap-11', type: 'chapter', inTime: 429.0, outTime: 434.0, html: buildChapter('Zusammenfassung & Tipps') },

  // ── STAT CARDS (6) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-crowd',  type: 'stat', inTime: 8.0,   outTime: 15.0,  html: buildStat('1000e', 'Reisende jährlich am US-Flughafen gestoppt — kleine Handgepäck-Fehler', '🛃') },
  { id: 'stat-67m',    type: 'stat', inTime: 65.0,  outTime: 75.0,  html: buildStat('6,7 Mio.', 'Verbotene Gegenstände 2023 an US-Flughäfen beschlagnahmt', '🚫') },
  { id: 'stat-100wh',  type: 'stat', inTime: 98.0,  outTime: 108.0, html: buildStat('100 Wh', 'Maximale Kapazität für Powerbanks im Handgepäck', '🔋') },
  { id: 'stat-14950',  type: 'stat', inTime: 157.0, outTime: 167.0, html: buildStat('$14.950', 'Maximales TSA-Bußgeld pro Verstoß', '💰') },
  { id: 'stat-800',    type: 'stat', inTime: 237.0, outTime: 247.0, html: buildStat('$800', 'Zollfreie Einfuhrgrenze pro Person in die USA', '🧳') },
  { id: 'stat-80pct',  type: 'stat', inTime: 440.0, outTime: 450.0, html: buildStat('80%', 'Aller Kontrollen mit mindestens einem Problem', '📊') },

  // ── ALERT CARDS (5) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-nutella',  type: 'alert', inTime: 55.0,  outTime: 62.0,  html: buildAlert('Nutella, Marmelade & Sonnencreme werden als FLÜSSIGKEIT eingestuft!', 'ÜBERRASCHUNG') },
  { id: 'alert-knife',    type: 'alert', inTime: 148.0, outTime: 155.0, html: buildAlert('Messer & Multitools unbewusst im Alltagsrucksack — sofortige Konfiszierung!', 'ACHTUNG') },
  { id: 'alert-transfer', type: 'alert', inTime: 200.0, outTime: 210.0, html: buildAlert('Versiegelte Duty-Free-Tüten werden beim US-Transfer geöffnet und KONFISZIERT!', 'FALLE') },
  { id: 'alert-food',     type: 'alert', inTime: 330.0, outTime: 340.0, html: buildAlert('Ein Apfel im Rucksack = bis zu $10.000 Strafe beim US-Zoll!', 'LEBENSMITTEL') },
  { id: 'alert-esta',     type: 'alert', inTime: 415.0, outTime: 425.0, html: buildAlert('Abgelehntes ESTA = kein Boarding. Kein WM-Ticket rettet dich!', 'ESTA') },

  // ── KEY CARDS (4) — bottom-left, orange ────────────────────────────────────
  { id: 'key-formula',   type: 'key', inTime: 112.0, outTime: 122.0, html: buildKey('mAh ÷ 1000 × 3,7 = Wattstunden — 26.800 mAh = knapp 100 Wh', 'BERECHNUNG') },
  { id: 'key-meds',      type: 'key', inTime: 283.0, outTime: 293.0, html: buildKey('Originalverpackung + ärztliches Attest auf Englisch — nur Reisemenge mitnehmen', 'MEDIKAMENTE') },
  { id: 'key-checklist', type: 'key', inTime: 480.0, outTime: 490.0, html: buildKey('Flüssigkeiten im Beutel · Powerbank <100Wh · Kein Messer · ESTA 2 Wochen vorher', 'CHECKLISTE') },
  { id: 'key-precheck',  type: 'key', inTime: 505.0, outTime: 515.0, html: buildKey('TSA PreCheck: $78 einmalig, 5 Jahre schnellere Kontrolle — Laptop & Schuhe bleiben', 'GEHEIMTIPP') },

  // ── DEFINITION CARDS (2) — top-left, teal ──────────────────────────────────
  { id: 'def-tsa',  type: 'definition', inTime: 20.0,  outTime: 30.0,  html: buildDefinition('TSA', 'Transportation Security Administration — US-Transportsicherheitsbehörde für alle Flughafenkontrollen') },
  { id: 'def-esta', type: 'definition', inTime: 393.0, outTime: 403.0, html: buildDefinition('ESTA', 'Electronic System for Travel Authorization — elektronische Reisegenehmigung für visafreie USA-Einreise') },

  // ── QUOTE CARD (1) — bottom-left, purple ───────────────────────────────────
  { id: 'quote-fazit', type: 'quote', inTime: 525.0, outTime: 535.0, html: buildQuote('Wer vorbereitet reist, erlebt das Abenteuer seines Lebens. Wer unvorbereitet reist, verfolgt die WM vom Flughafen.', 'Fazit') },

  // ── RANK CARDS (3) — bottom-left, amber ────────────────────────────────────
  { id: 'rank-5',    type: 'rank', inTime: 185.0, outTime: 192.0, html: buildRank('#5', 'DIE FALLE FÜR JEDEN FAN', 'Zollpflicht ab $800 — Trikots & Sneaker summieren sich') },
  { id: 'rank-9',    type: 'rank', inTime: 375.0, outTime: 382.0, html: buildRank('#9', 'NICHT RÜCKGÄNGIG ZU MACHEN', 'ESTA-Fehler am Flughafen = kein Boarding') },
  { id: 'rank-safe', type: 'rank', inTime: 548.0, outTime: 558.0, html: buildRank('✓', 'REISEVERSICHERUNG', 'Einreiseschutz sichert WM-Ticket, Hotel & Flug') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-tsa',  type: 'source', inTime: 67.0,  outTime: 74.0,  html: buildSource('TSA — 6,7 Mio. beschlagnahmte Gegenstände 2023') },
  { id: 'src-cbp',  type: 'source', inTime: 332.0, outTime: 339.0, html: buildSource('U.S. Customs & Border Protection — Einfuhrbestimmungen') },
  { id: 'src-iata', type: 'source', inTime: 442.0, outTime: 449.0, html: buildSource('TSA — 80% Beanstandungsrate bei Kontrollen') },
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
