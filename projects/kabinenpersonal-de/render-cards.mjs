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
  { id: 'chap-01', type: 'chapter', inTime: 0.0,    outTime: 5.0,    html: buildChapter('Erschreckender Schlaf-Schock') },
  { id: 'chap-02', type: 'chapter', inTime: 38.34,  outTime: 43.34,  html: buildChapter('Schlafentzug Im Dienst') },
  { id: 'chap-03', type: 'chapter', inTime: 76.69,  outTime: 81.69,  html: buildChapter('Trinkwasser-Geheimnis') },
  { id: 'chap-04', type: 'chapter', inTime: 115.03, outTime: 120.03, html: buildChapter('Upgrade-Tricks Kennen') },
  { id: 'chap-05', type: 'chapter', inTime: 153.38, outTime: 158.38, html: buildChapter('Kabinenluft-Wahrheit') },
  { id: 'chap-06', type: 'chapter', inTime: 191.72, outTime: 196.72, html: buildChapter('Notfall-Reaktion Unter Druck') },
  { id: 'chap-07', type: 'chapter', inTime: 230.06, outTime: 235.06, html: buildChapter('Gehalt-Schock') },
  { id: 'chap-08', type: 'chapter', inTime: 268.41, outTime: 273.41, html: buildChapter('Geheime Kommunikationscodes') },
  { id: 'chap-09', type: 'chapter', inTime: 306.75, outTime: 311.75, html: buildChapter('Alkohol-Wahrheit An Bord') },
  { id: 'chap-10', type: 'chapter', inTime: 345.10, outTime: 350.10, html: buildChapter('Cockpit-Schlaf-Skandal') },

  // ── STAT CARDS (6) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-schlaf',    type: 'stat', inTime: 46,  outTime: 54,  html: buildStat('<6h',      'Klinischer Schlafentzug laut EASA-Studie',        '😴') },
  { id: 'stat-wasser',    type: 'stat', inTime: 84,  outTime: 92,  html: buildStat('12%',      'Flugzeuge mit Kolibakterien im Bordwasser',       '🦠') },
  { id: 'stat-notfall',   type: 'stat', inTime: 199, outTime: 207, html: buildStat('1 : 604',  'Medizinische Notfälle pro Langstreckenflüge',     '🚨') },
  { id: 'stat-gehalt',    type: 'stat', inTime: 238, outTime: 246, html: buildStat('31.000$',  'Einstiegsgehalt US-Flugbegleiter pro Jahr',       '💰') },
  { id: 'stat-piloten',   type: 'stat', inTime: 355, outTime: 363, html: buildStat('29%',      'Piloten schliefen im Cockpit ein — NASA',         '😨') },
  { id: 'stat-strahlung', type: 'stat', inTime: 465, outTime: 473, html: buildStat('3×',       'Mehr Strahlung als Kernkraftwerk-Grenzwerte',     '☢️') },

  // ── ALERT CARDS (4) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-wasser',   type: 'alert', inTime: 94,  outTime: 101, html: buildAlert('Kein Bordwasser trinken — Kolibakterien in über 12% der Tanks!', 'WARNUNG') },
  { id: 'alert-zapfluft', type: 'alert', inTime: 163, outTime: 170, html: buildAlert('Zapfluft kann giftige Chemikalien in die Kabine leiten!', 'GESUNDHEIT') },
  { id: 'alert-alkohol',  type: 'alert', inTime: 316, outTime: 323, html: buildAlert('Alkohol wirkt in der Höhe doppelt so stark — Crew darf verweigern!', 'ACHTUNG') },
  { id: 'alert-ueber',    type: 'alert', inTime: 425, outTime: 432, html: buildAlert('WM-Flüge oft überbucht — Airlines kalkulieren Nichterscheinen ein!', 'ÜBERBUCHUNG') },

  // ── KEY CARDS (5) — bottom-left, orange ────────────────────────────────────
  { id: 'key-flasche',    type: 'key', inTime: 103, outTime: 111, html: buildKey('Eigene Wasserflasche mitnehmen — Bordwasser vermeiden', 'REISETIPP') },
  { id: 'key-upgrade',    type: 'key', inTime: 128, outTime: 136, html: buildKey('Freundlichkeit und Dankbarkeit erhöhen Upgrade-Chancen massiv', 'INSIDER') },
  { id: 'key-flugzeug',   type: 'key', inTime: 178, outTime: 186, html: buildKey('Neuere Flugzeugtypen wie Airbus A350 wählen — keine Zapfluft', 'BUCHUNGSTIPP') },
  { id: 'key-signale',    type: 'key', inTime: 283, outTime: 291, html: buildKey('Bei plötzlicher Crew-Stille aufmerksam bleiben — interne Kommunikation', 'FAKTENCHECK') },
  { id: 'key-regeln',     type: 'key', inTime: 505, outTime: 513, html: buildKey('Kein Leitungswasser, freundlich sein, Rechte kennen, modernes Flugzeug', 'ZUSAMMENFASSUNG') },

  // ── DEFINITION CARDS (2) — top-left, teal ─────────────────────────────────
  { id: 'def-zapfluft',   type: 'definition', inTime: 160, outTime: 168, html: buildDefinition('Zapfluft', 'Luft aus dem Triebwerk, die gefiltert in die Kabine geleitet wird — kann Chemikalien enthalten') },
  { id: 'def-kabdruck',   type: 'definition', inTime: 445, outTime: 453, html: buildDefinition('Kabinendruck', 'Simuliert 2.400m Höhe — verändert Wahrnehmung, Geschmack und Stimmung') },

  // ── QUOTE CARD (1) — bottom-left, purple ───────────────────────────────────
  { id: 'quote-nasa',     type: 'quote', inTime: 370, outTime: 378, html: buildQuote('Unbeabsichtigtes Einschlafen im Cockpit ist kein Einzelfall.', 'NASA-Studie') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-easa',       type: 'source', inTime: 50,  outTime: 58,  html: buildSource('Europäische Agentur für Flugsicherheit (EASA)') },
  { id: 'src-bls',        type: 'source', inTime: 243, outTime: 250, html: buildSource('U.S. Bureau of Labor Statistics') },
  { id: 'src-faa',        type: 'source', inTime: 490, outTime: 498, html: buildSource('Federal Aviation Administration (FAA)') },

  // ── RANK CARD (1) — bottom-left, amber ─────────────────────────────────────
  { id: 'rank-sicher',    type: 'rank', inTime: 387, outTime: 395, html: buildRank(1, 'SICHERSTES', 'Transportmittel der Welt') },
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
