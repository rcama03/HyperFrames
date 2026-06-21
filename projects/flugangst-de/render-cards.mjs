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
  // ── CHAPTER CARDS (9) — top-left, cyan ────────────────────────────────────
  { id: 'chap-01', type: 'chapter', inTime: 0.0,   outTime: 5.0,   html: buildChapter('Erschreckende Zahl') },
  { id: 'chap-02', type: 'chapter', inTime: 97.4,  outTime: 102.4, html: buildChapter('Angstauslöser Identifizieren') },
  { id: 'chap-03', type: 'chapter', inTime: 130.5, outTime: 135.5, html: buildChapter('Atemtechniken') },
  { id: 'chap-04', type: 'chapter', inTime: 186.0, outTime: 191.0, html: buildChapter('Graduelle Exposition') },
  { id: 'chap-05', type: 'chapter', inTime: 220.1, outTime: 225.1, html: buildChapter('Wissen Als Angstlöser') },
  { id: 'chap-06', type: 'chapter', inTime: 273.6, outTime: 278.6, html: buildChapter('Kognitive Umstrukturierung') },
  { id: 'chap-07', type: 'chapter', inTime: 306.7, outTime: 311.7, html: buildChapter('Medizinische Unterstützung') },
  { id: 'chap-08', type: 'chapter', inTime: 364.2, outTime: 369.2, html: buildChapter('Ablenkungsstrategie') },
  { id: 'chap-09', type: 'chapter', inTime: 379.7, outTime: 384.7, html: buildChapter('Fazit & Zusammenfassung') },

  // ── STAT CARDS (5) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-40pct',  type: 'stat', inTime: 8,   outTime: 15,  html: buildStat('40%', 'Aller Menschen weltweit haben Flugangst', '😰') },
  { id: 'stat-73pct',  type: 'stat', inTime: 140, outTime: 147, html: buildStat('73%', 'Der Angstpatienten fürchten vor allem Turbulenzen', '🌪️') },
  { id: 'stat-11mio',  type: 'stat', inTime: 285, outTime: 292, html: buildStat('1:11M', 'Sterberisiko beim Fliegen — 95× sicherer als Autofahren', '✈️') },
  { id: 'stat-90pct',  type: 'stat', inTime: 112, outTime: 119, html: buildStat('90–95%', 'Fliegen nach Verhaltenstherapie tatsächlich', '📊') },
  { id: 'stat-80pct',  type: 'stat', inTime: 200, outTime: 207, html: buildStat('80%+', 'Erfolgsrate nach wenigen VR-Therapiesitzungen', '🥽') },

  // ── RANK CARDS (2) — bottom-left, amber ────────────────────────────────────
  { id: 'rank-7steps', type: 'rank', inTime: 470, outTime: 477, html: buildRank('7', 'SCHRITTE', 'Zwischen dir und dem größten Fußballfest deines Lebens') },
  { id: 'rank-90days', type: 'rank', inTime: 440, outTime: 447, html: buildRank('90', 'TAGE-PLAN', 'Atemübungen → VR-Kurs → Kurzstreckenflug → New York') },

  // ── ALERT CARDS (3) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-alkohol',  type: 'alert', inTime: 340, outTime: 347, html: buildAlert('Alkohol wirkt in großer Höhe doppelt so stark — dehydriert und verstärkt Panikattacken massiv!', 'ALKOHOL-FALLE') },
  { id: 'alert-zyklus',   type: 'alert', inTime: 415, outTime: 422, html: buildAlert('Ohne Intervention wird Flugangst mit der Zeit STÄRKER — jede gemiedene Situation bestätigt die Angst!', 'TEUFELSKREIS') },
  { id: 'alert-sitz',     type: 'alert', inTime: 355, outTime: 362, html: buildAlert('Gangplatz hinten = schlechteste Wahl für Angstpatienten — über den Tragflächen ist es am ruhigsten!', 'SITZPLATZ') },

  // ── KEY CARDS (4) — bottom-left, orange ────────────────────────────────────
  { id: 'key-478',       type: 'key', inTime: 148, outTime: 155, html: buildKey('4-7-8 Atemtechnik: 4 Sekunden einatmen, 7 halten, 8 ausatmen — senkt Cortisol in MINUTEN', 'NOTFALL-TOOL') },
  { id: 'key-sofort',    type: 'key', inTime: 165, outTime: 172, html: buildKey('Atemtechnik SOFORT aktivieren wenn Angst aufsteigt — nicht erst warten bis Panik einsetzt', 'TIMING') },
  { id: 'key-ablenk',    type: 'key', inTime: 370, outTime: 377, html: buildKey('Ablenkung VOR dem Boarding starten — Serien, Playlist, Buch — nicht erst wenn die Angst da ist', 'STRATEGIE') },
  { id: 'key-expo',      type: 'key', inTime: 192, outTime: 199, html: buildKey('Videos von Starts anschauen → Flughafenbesuch → Kurzstreckenflug: Toleranz aufbauen', 'STUFENPLAN') },

  // ── DEFINITION CARDS (2) — top-left, teal ──────────────────────────────────
  { id: 'def-kvt',       type: 'definition', inTime: 105, outTime: 112, html: buildDefinition('Kognitive Verhaltenstherapie', 'Wissenschaftlich meistbelegte Methode gegen Flugangst — Denkmuster erkennen und verändern') },
  { id: 'def-amygdala',  type: 'definition', inTime: 55,  outTime: 62,  html: buildDefinition('Flugangst', 'Fehlfunktion des Überlebenssystems — das Gehirn interpretiert sichere Situationen als Bedrohung') },

  // ── QUOTE CARDS (2) — bottom-left, purple ──────────────────────────────────
  { id: 'quote-piloten', type: 'quote', inTime: 230, outTime: 237, html: buildQuote('Turbulenzen? Wie eine holprige Landstraße — unangenehm, aber absolut ungefährlich.', 'Berufspiloten') },
  { id: 'quote-wende',   type: 'quote', inTime: 455, outTime: 462, html: buildQuote('Flugangst überwinden ist eine Lebenswende — mehr Mut in allen Bereichen des Lebens.', 'Therapie-Absolventen') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-amsterdam', type: 'source', inTime: 135, outTime: 142, html: buildSource('Universität Amsterdam — 73% fürchten Turbulenzen') },
  { id: 'src-lufthansa', type: 'source', inTime: 260, outTime: 267, html: buildSource('Lufthansa Flugangst-Kurs — über 90% Erfolgsquote') },
  { id: 'src-iata',      type: 'source', inTime: 295, outTime: 302, html: buildSource('IATA — Sterberisiko 1:11 Millionen pro Flug') },
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
