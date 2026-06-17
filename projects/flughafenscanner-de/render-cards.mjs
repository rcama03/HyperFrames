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
  // ── CHAPTER CARDS (7) — top-left, cyan ─────────────────────────────────────
  { id: 'chap-01', type: 'chapter', inTime: 0.0,    outTime: 5.0,    html: buildChapter('Scanner Sehen Alles') },
  { id: 'chap-02', type: 'chapter', inTime: 81.6,   outTime: 86.6,   html: buildChapter('Körperscanner: Was Sie Speichern') },
  { id: 'chap-03', type: 'chapter', inTime: 168.1,  outTime: 173.1,  html: buildChapter('CT-Scanner: Die Neue Generation') },
  { id: 'chap-04', type: 'chapter', inTime: 257.4,  outTime: 262.4,  html: buildChapter('Hunde Am Flughafen') },
  { id: 'chap-05', type: 'chapter', inTime: 341.0,  outTime: 346.0,  html: buildChapter('WM-Tipp: Was Du Wissen Musst') },
  { id: 'chap-06', type: 'chapter', inTime: 420.7,  outTime: 425.7,  html: buildChapter('Geheimcodes Der Sicherheit') },
  { id: 'chap-07', type: 'chapter', inTime: 513.9,  outTime: 518.9,  html: buildChapter('Fazit: Was Scanner Bedeuten') },

  // ── STAT CARDS (6) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-tsa',      type: 'stat', inTime: 72,  outTime: 80,  html: buildStat('95%',      'Erkennungsrate bei TSA-Interntests',              '🔍') },
  { id: 'stat-bilder',   type: 'stat', inTime: 107, outTime: 115, html: buildStat('35.000',   'Gespeicherte Körperscanner-Bilder aufgetaucht',   '📸') },
  { id: 'stat-100ml',    type: 'stat', inTime: 223, outTime: 231, html: buildStat('100ml',    'Flüssigkeitsregel seit Anschlagsplan 2006',       '💧') },
  { id: 'stat-strafe',   type: 'stat', inTime: 245, outTime: 253, html: buildStat('50.000€',  'Maximalstrafe für verbotene Lebensmittel',        '⚖️') },
  { id: 'stat-hunde',    type: 'stat', inTime: 283, outTime: 290, html: buildStat('100.000×', 'Leistungsfähiger als die menschliche Nase',       '🐕') },
  { id: 'stat-fehler',   type: 'stat', inTime: 310, outTime: 318, html: buildStat('40%',      'Höhere Fehlerrate in zweiter Schichthälfte',      '⚠️') },

  // ── ALERT CARDS (4) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-merch',   type: 'alert', inTime: 122, outTime: 129, html: buildAlert('Fan-Merchandise mit Metalldrucken oder Folienapplikationen löst Scanner-Alarm aus!', 'WARNUNG') },
  { id: 'alert-etd',     type: 'alert', inTime: 148, outTime: 155, html: buildAlert('Sprengstoffspuren auf Händen — Dünger oder Medikamente reichen für Alarm!', 'ACHTUNG') },
  { id: 'alert-verboten',type: 'alert', inTime: 160, outTime: 167, html: buildAlert('Leuchtfackeln, Signalraketen und Laser-Pointer sofort konfisziert!', 'VERBOTEN') },
  { id: 'alert-alarm',   type: 'alert', inTime: 328, outTime: 335, html: buildAlert('Alarm = strenges Protokoll — separater Raum ohne sofortige Erklärung möglich!', 'PROTOKOLL') },

  // ── KEY CARDS (5) — bottom-left, orange ────────────────────────────────────
  { id: 'key-farbcode',  type: 'key', inTime: 40,  outTime: 48,  html: buildKey('Farbcode: Metall blau, organisch orange, Sprengstoff speziell markiert', 'SCANNER-WISSEN') },
  { id: 'key-ki',        type: 'key', inTime: 205, outTime: 213, html: buildKey('BDO-Systeme analysieren Mimik, Gangbild und Blickverhalten automatisch', 'VERHALTENSANALYSE') },
  { id: 'key-bargeld',   type: 'key', inTime: 268, outTime: 275, html: buildKey('Spürhunde erschnüffeln auch Bargeld für Geldwäsche-Kontrollen', 'INSIDER') },
  { id: 'key-packen',    type: 'key', inTime: 413, outTime: 420, html: buildKey('Ordentlich packen — unordentlicher Rucksack wird extra kontrolliert', 'REISETIPP') },
  { id: 'key-regeln',    type: 'key', inTime: 500, outTime: 508, html: buildKey('Keine Fackeln, Hände sauber, Elektronik separat, ruhig bleiben', 'ZUSAMMENFASSUNG') },

  // ── DEFINITION CARDS (2) — top-left, teal ─────────────────────────────────
  { id: 'def-etd',       type: 'definition', inTime: 140, outTime: 148, html: buildDefinition('ETD — Explosive Trace Detection', 'Spürt winzige Sprengstoff-Partikel auf deiner Haut auf — an vielen Airports im Einsatz') },
  { id: 'def-gesicht',   type: 'definition', inTime: 285, outTime: 293, html: buildDefinition('Gesichtserkennung', 'Automatischer Abgleich mit Fahndungslisten in über 80 Ländern — bereits beim Check-in') },

  // ── QUOTE CARD (1) — bottom-left, purple ───────────────────────────────────
  { id: 'quote-daten',   type: 'quote', inTime: 480, outTime: 488, html: buildQuote('Niemand kann dir garantieren, dass dein Körperscan-Profil nicht irgendwo existiert.', 'Datenschutz-Bericht') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-tsa',       type: 'source', inTime: 76,  outTime: 83,  html: buildSource('US Transportation Security Administration (TSA)') },
  { id: 'src-icao',      type: 'source', inTime: 350, outTime: 357, html: buildSource('Internationale Flughafensicherheitsstandards (ICAO)') },
  { id: 'src-dsgvo',     type: 'source', inTime: 470, outTime: 477, html: buildSource('EU-DSGVO Datenschutzrichtlinie') },

  // ── RANK CARD (1) — bottom-left, amber ─────────────────────────────────────
  { id: 'rank-bengurion', type: 'rank', inTime: 395, outTime: 403, html: buildRank(1, 'SICHERSTER FLUGHAFEN', 'Ben Gurion, Tel Aviv') },
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
