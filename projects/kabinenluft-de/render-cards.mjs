import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, 'card-frames');
mkdirSync(outDir, { recursive: true });

const W = 1920, H = 1080;
const SCALE = 0.973181; // VOICE_DUR / timing_end = 586.896 / 603.07
function sc(t) { return Math.round(t * SCALE * 100) / 100; }

// ── Card colour palette (matches scanner-de locked palette) ───────────────────
// chapter   : #00E5FF  cyan   / navy bg      — top-left
// stat      : #FFC107  gold   / dark bg      — bottom-left
// key       : #FF6D00  orange / dark bg      — bottom-left
// alert     : #FF3C3C  red    / dark-red bg  — bottom-left
// source    : #66BB6A  green  / dark-green bg — bottom-right

const SHARP = `-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-feature-settings:"kern" 1,"liga" 1;`;

function bottomCardStyle(accentHex, bgRgba) {
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
      font-family:'Montserrat','Arial Black',Arial,sans-serif;${SHARP}}
    .card{position:absolute;left:60px;bottom:140px;display:flex;align-items:stretch;
      background:${bgRgba};border:2px solid ${accentHex}80;
      box-shadow:0 12px 48px rgba(0,0,0,0.65);border-radius:20px;overflow:hidden;}
    .stripe{width:7px;background:${accentHex};flex-shrink:0;}
    .inner{padding:22px 28px;flex:1;}
  </style>`;
}

function topCardStyle(accentHex, bgRgba) {
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
      font-family:'Montserrat','Arial Black',Arial,sans-serif;${SHARP}}
    .card{position:absolute;left:60px;top:60px;display:flex;align-items:stretch;
      background:${bgRgba};border:2px solid ${accentHex}70;
      box-shadow:0 12px 48px rgba(0,0,0,0.65);border-radius:20px;overflow:hidden;}
    .stripe{width:7px;background:${accentHex};flex-shrink:0;}
    .inner{padding:22px 28px;flex:1;}
  </style>`;
}

function pill(bgHex, textColor, label) {
  return `<div style="display:inline-block;background:${bgHex};color:${textColor};font-size:20px;font-weight:800;letter-spacing:.12em;padding:7px 16px;border-radius:12px;text-transform:uppercase;margin-bottom:14px">${label}</div>`;
}
function divider(color) {
  return `<div style="height:1px;background:${color};margin-bottom:14px"></div>`;
}

function buildChapter(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCardStyle('#00E5FF','rgba(0,8,30,0.50)')}
  </head><body>
    <div class="card" style="width:640px">
      <div class="stripe"></div>
      <div class="inner">
        ${divider('rgba(0,229,255,.35)')}
        <div style="font-size:36px;font-weight:800;color:#FFF;letter-spacing:-.3px;line-height:1.25">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildStat(value, label, icon) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#FFC107','rgba(10,8,0,0.50)')}
  </head><body>
    <div class="card" style="width:720px">
      <div class="stripe"></div>
      <div class="inner">
        <div style="font-size:76px;font-weight:900;color:#FFC107;line-height:1;letter-spacing:-2px">${value}</div>
        <div style="font-size:22px;color:rgba(255,255,255,.82);margin-top:8px;line-height:1.4">${label}</div>
      </div>
      <div style="font-size:52px;padding:22px 24px 22px 0;display:flex;align-items:flex-start;padding-top:28px">${icon}</div>
    </div>
  </body></html>`;
}

function buildAlert(text, badge) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#FF3C3C','rgba(35,5,5,0.50)')}
  </head><body>
    <div class="card" style="width:860px">
      <div class="stripe"></div>
      <div class="inner">
        ${pill('#FF3C3C','#fff',`⚠ ${badge}`)}
        ${divider('rgba(255,60,60,.3)')}
        <div style="font-size:32px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildKey(text, tag) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${bottomCardStyle('#FF6D00','rgba(20,8,0,0.50)')}
  </head><body>
    <div class="card" style="width:800px">
      <div class="stripe"></div>
      <div class="inner">
        ${pill('#FF6D00','#fff',`💡 ${tag}`)}
        ${divider('rgba(255,109,0,.3)')}
        <div style="font-size:30px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
      </div>
    </div>
  </body></html>`;
}

function buildSource(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
      font-family:'Montserrat','Arial Black',Arial,sans-serif;}
    .card{position:absolute;right:60px;bottom:140px;display:flex;align-items:center;gap:14px;
      background:rgba(5,20,10,0.50);border:1.5px solid rgba(102,187,106,0.4);
      box-shadow:0 6px 24px rgba(0,0,0,0.5);border-radius:14px;padding:16px 26px;
      max-width:680px;}
  </style>
  </head><body>
    <div class="card">
      <div style="font-size:28px;flex-shrink:0">📰</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:#66BB6A;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px">Quelle</div>
        <div style="font-size:24px;color:rgba(255,255,255,.9);font-weight:600;line-height:1.35">${text}</div>
      </div>
    </div>
  </body></html>`;
}

const cards = [
  // CHAPTER CARDS (top-left, cyan)
  { id: 'chap-aerotoxic',   inTime: sc(89.45),  outTime: sc(89.45)+5,   html: buildChapter('Aerotoxic Syndrome') },
  { id: 'chap-gefaehrdung', inTime: sc(175.17), outTime: sc(175.17)+5,  html: buildChapter('Wer Ist Am Stärksten Betroffen?') },
  { id: 'chap-fume',        inTime: sc(269.03), outTime: sc(269.03)+5,  html: buildChapter('Was Passiert Bei Einem Fume Event?') },
  { id: 'chap-langstrecke', inTime: sc(358.98), outTime: sc(358.98)+5,  html: buildChapter('Langstrecke & Covid-19') },
  { id: 'chap-schutz',      inTime: sc(438.07), outTime: sc(438.07)+5,  html: buildChapter('Nasale Schutzmaßnahmen') },
  { id: 'chap-zukunft',     inTime: sc(527.24), outTime: sc(527.24)+5,  html: buildChapter('Zukunft Der Kabinenluft') },

  // STAT CARDS (bottom-left, gold) — icon on right
  { id: 'stat-millionen', inTime: sc(33.38),  outTime: sc(50.15),  html: buildStat('5 MIO.',  'Internationale WM-Fans im Langstreckenflug',       '✈️') },
  { id: 'stat-50pct',     inTime: sc(50.15),  outTime: sc(65.96),  html: buildStat('50%',    'Recycelte Kabinenluft — typischer Anteil',           '🌀') },
  { id: 'stat-fume',      inTime: sc(103.39), outTime: sc(120.40), html: buildStat('1.000+', 'Fume Events bei EASA gemeldet (2006–2021)',           '⚠️') },
  { id: 'stat-feuchte',   inTime: sc(136.76), outTime: sc(152.33), html: buildStat('12%',    'Luftfeuchtigkeit in der Kabine — trockener als Sahara','💧') },
  { id: 'stat-sauerstoff',inTime: sc(152.33), outTime: sc(175.17), html: buildStat('90%',    'Sauerstoffgehalt im Blut sinkt auf — bei Gesunden',   '🫁') },

  // ALERT CARDS (bottom-left, red)
  { id: 'alert-bleedair',   inTime: sc(65.96),  outTime: sc(89.45),  html: buildAlert('Giftige Organophosphate aus Triebwerksöl — direkt in die Kabine geleitet', 'BLEED AIR') },
  { id: 'alert-aerosole',   inTime: sc(191.53), outTime: sc(209.93), html: buildAlert('Aerosole von Mitpassagieren kaum filterbar — echtes Risiko in vollen WM-Maschinen', 'KEIMGEFAHR') },
  { id: 'alert-tcp',        inTime: sc(285.75), outTime: sc(301.32), html: buildAlert('Geruch nach alten Socken oder Öl = TCP-Nervengift im Triebwerksöl', 'NERVENGIFT') },
  { id: 'alert-monitoring', inTime: sc(316.75), outTime: sc(339.98), html: buildAlert('Kein verpflichtendes Echtzeit-Monitoring auf keinem kommerziellen Flugzeug weltweit', 'KEINE KONTROLLE') },

  // KEY CARDS (bottom-left, orange)
  { id: 'key-hepa',      inTime: sc(120.40), outTime: sc(136.76), html: buildKey('HEPA-Filter filtert 99,97% der Partikel — aber KEINE Gase oder chemischen Dämpfe', 'FAKTENCHECK') },
  { id: 'key-dreamliner',inTime: sc(226.15), outTime: sc(248.47), html: buildKey('Boeing 787 Dreamliner: kein Bleed Air — Luft wird elektrisch komprimiert', 'FLUGZEUGTYP') },
  { id: 'key-melden',    inTime: sc(339.98), outTime: sc(358.98), html: buildKey('Fume Event sofort der Crew melden — du hast das Recht dazu. Dokumentiere alles.', 'DEIN RECHT') },
  { id: 'key-wasser',    inTime: sc(374.72), outTime: sc(391.71), html: buildKey('Mindestens 0,5 Liter Wasser pro 2 Stunden Flugzeit — Mediziner-Empfehlung', 'SCHUTZREGEL') },
  { id: 'key-flugzeug',  inTime: sc(417.91), outTime: sc(438.07), html: buildKey('787 oder A350 buchen — kein Bleed Air. Typ auf Google Flights oder Kayak prüfen.', 'BUCHUNGSTIPP') },
  { id: 'key-fenster',   inTime: sc(470.95), outTime: sc(496.19), html: buildKey('Fensterplatz = geringeres Infektionsrisiko — laut MIT-Studie weniger Passagierkontakt', 'BESTER PLATZ') },

  // SOURCE CARDS (bottom-right, green)
  { id: 'src-easa',    inTime: sc(89.45),  outTime: sc(103.39), html: buildSource('EASA — Aerotoxic Syndrome offiziell bestätigt') },
  { id: 'src-british', inTime: sc(301.32), outTime: sc(316.75), html: buildSource('Britische Studie: Neurologische Schäden bei Flugzeugbesatzungen') },
  { id: 'src-mit',     inTime: sc(496.19), outTime: sc(512.84), html: buildSource('MIT-Studie: Sitzplatz-Risikofaktoren im Langstreckenflug') },
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
    manifest.push({ id: card.id, file: pngPath, inTime: card.inTime, outTime: card.outTime });
    console.log(`  ✓ ${card.id}.png  [${card.inTime}s → ${card.outTime}s]`);
  }
  await browser.close();
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${manifest.length} cards written.`);
})().catch(err => { console.error(err); process.exit(1); });
