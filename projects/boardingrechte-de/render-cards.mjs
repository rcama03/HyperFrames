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
  { id: 'chap-01', type: 'chapter', inTime: 0.0,   outTime: 5.0,   html: buildChapter('1.300-Euro-Wahrheit') },
  { id: 'chap-02', type: 'chapter', inTime: 36.1,  outTime: 41.1,  html: buildChapter('Überbuchungs-Entschädigung') },
  { id: 'chap-03', type: 'chapter', inTime: 76.1,  outTime: 81.1,  html: buildChapter('Betreuungsleistungen') },
  { id: 'chap-04', type: 'chapter', inTime: 96.5,  outTime: 101.5, html: buildChapter('Rückflugrecht') },
  { id: 'chap-05', type: 'chapter', inTime: 114.1, outTime: 119.1, html: buildChapter('Gepäckverlust') },
  { id: 'chap-06', type: 'chapter', inTime: 152.1, outTime: 157.1, html: buildChapter('Upgrade-Anspruch') },
  { id: 'chap-07', type: 'chapter', inTime: 174.6, outTime: 179.6, html: buildChapter('Sofortauszahlung Am Gate') },
  { id: 'chap-08', type: 'chapter', inTime: 233.1, outTime: 238.1, html: buildChapter('Namenskorrektur') },
  { id: 'chap-09', type: 'chapter', inTime: 251.6, outTime: 256.6, html: buildChapter('24-Stunden-Stornoregel') },
  { id: 'chap-10', type: 'chapter', inTime: 293.5, outTime: 298.5, html: buildChapter('Downgrade-Erstattung') },

  // ── STAT CARDS (4) — bottom-left, gold ─────────────────────────────────────
  { id: 'stat-5mio',  type: 'stat', inTime: 24,  outTime: 31,  html: buildStat('5 Mio+', 'Internationale Flugreisende zur WM 2026 erwartet', '✈️') },
  { id: 'stat-26mio', type: 'stat', inTime: 126, outTime: 133, html: buildStat('26 Mio', 'Gepäckstücke weltweit jährlich verloren', '🧳') },
  { id: 'stat-90pct', type: 'stat', inTime: 308, outTime: 315, html: buildStat('90%', 'Interkontinentalflüge zur WM vorab ausgebucht', '📊') },
  { id: 'stat-2pct',  type: 'stat', inTime: 348, outTime: 355, html: buildStat('2%', 'Der berechtigten Ansprüche werden tatsächlich gestellt', '📉') },

  // ── RANK CARDS (2) — bottom-left, amber ────────────────────────────────────
  { id: 'rank-600',  type: 'rank', inTime: 43,  outTime: 50,  html: buildRank('€600', 'MAX EU-ENTSCHÄDIGUNG', 'Pro Person bei Langstrecke — sofort fällig nach EU-Recht') },
  { id: 'rank-75',   type: 'rank', inTime: 300, outTime: 307, html: buildRank('75%', 'DOWNGRADE-ERSTATTUNG', 'Maximale Rückzahlung bei Klassenherabstufung') },

  // ── ALERT CARDS (3) — bottom-left, red ─────────────────────────────────────
  { id: 'alert-gutschein',    type: 'alert', inTime: 63,  outTime: 70,  html: buildAlert('Gutschein statt Bargeld? Hat Verfallsdaten und ist oft weniger wert als die Barentschädigung!', 'GUTSCHEIN-FALLE') },
  { id: 'alert-drittanbieter', type: 'alert', inTime: 378, outTime: 385, html: buildAlert('EU-Rechte gelten nur VOLL bei Buchung direkt bei Airline oder EU-Reiseveranstalter!', 'DRITTANBIETER') },
  { id: 'alert-unterschrift',  type: 'alert', inTime: 420, outTime: 427, html: buildAlert('Niemals am Gate etwas unterschreiben ohne es gelesen zu haben — kann deinen Anspruch entwerten!', 'ACHTUNG') },

  // ── KEY CARDS (4) — bottom-left, orange ────────────────────────────────────
  { id: 'key-bargeld',     type: 'key', inTime: 85,  outTime: 92,  html: buildKey('Gutschein ABLEHNEN und auf sofortige Barzahlung bestehen — das ist dein gesetzliches Recht', 'TIPP') },
  { id: 'key-ec261',       type: 'key', inTime: 195, outTime: 202, html: buildKey('Am Gate klar sagen: „Entschädigung nach EC 261/2004 sofort in bar" — Airline MUSS zahlen', 'STRATEGIE') },
  { id: 'key-apps',        type: 'key', inTime: 338, outTime: 345, html: buildKey('Apps wie AirHelp oder Flightright nutzen — nur Provision im Erfolgsfall', 'WERKZEUG') },
  { id: 'key-dokumentieren', type: 'key', inTime: 455, outTime: 462, html: buildKey('Fotos von Anzeigetafeln, Quittungen und Namen von Gate-Agenten — ALLES dokumentieren', 'BEWEIS') },

  // ── DEFINITION CARDS (2) — top-left, teal ──────────────────────────────────
  { id: 'def-eu261',    type: 'definition', inTime: 48,  outTime: 55,  html: buildDefinition('EU-Verordnung 261/2004', 'Gilt für alle Flüge ab EU-Flughafen und Flüge in die EU mit EU-Airline') },
  { id: 'def-montreal', type: 'definition', inTime: 135, outTime: 142, html: buildDefinition('Montrealer Übereinkommen', 'Internationales Abkommen — bis zu 1.288 SZR (≈ 1.600€) bei Gepäckverlust') },

  // ── QUOTE CARDS (2) — bottom-left, purple ──────────────────────────────────
  { id: 'quote-98pct', type: 'quote', inTime: 470, outTime: 477, html: buildQuote('98 Prozent schenken den Airlines ihr Geld — weil sie ihre Rechte nicht kennen.', 'EU-Studie Fluggastrechte') },
  { id: 'quote-fazit', type: 'quote', inTime: 510, outTime: 517, html: buildQuote('Nutze dein Wissen. Schick dieses Video jemandem, der zur WM 2026 fliegt.', 'Fazit') },

  // ── SOURCE CARDS (3) — bottom-right, green ─────────────────────────────────
  { id: 'src-eu261', type: 'source', inTime: 58,  outTime: 65,  html: buildSource('EU-Verordnung 261/2004 — Fluggastrechte') },
  { id: 'src-sita',  type: 'source', inTime: 140, outTime: 147, html: buildSource('SITA Baggage Report — 26 Mio Gepäckstücke') },
  { id: 'src-dot',   type: 'source', inTime: 365, outTime: 372, html: buildSource('US DOT — 24-Stunden-Stornopflicht') },
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
