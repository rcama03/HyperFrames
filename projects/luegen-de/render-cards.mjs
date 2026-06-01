/**
 * render-cards.mjs — luegen-de
 * Source: 1280×720, voiceover 613.56s (scale=0.9739 from timings 630.03s)
 *
 * 7 chapter cards (top-left) + 9 stat + 6 key (bottom-left)
 * Chapter timestamps from user: 0,100,200,300,400,500,600s raw → scaled below
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
const GOLD = '#FFD700';

// All timings in voiceover-scaled seconds (scale=0.9739, 0–613.56s)
// Scene boundaries (scaled): 1:0-20.3  2:20.6-34.0  3:34.3-52.7  4:53.0-72.0
//   5:72.3-90.9  6:91.2-110.7  7:111.0-128.1  8:128.4-145.9  9:146.2-165.2
//  10:165.5-186.9  11:187.2-204.0  12:204.3-219.8  13:220.0-237.5
//  14:237.8-255.9  15:256.2-276.4  16:276.7-291.2  17:291.5-309.4
//  18:309.7-326.6  19:326.9-343.0  20:343.3-366.3  21:366.6-382.5
//  22:382.8-396.8  23:397.0-412.2  24:412.5-429.6  25:429.9-450.4
//  26:450.7-467.3  27:467.6-490.7  28:491.0-507.0  29:507.3-533.9
//  30:534.2-556.9  31:557.2-576.2  32:576.5-595.5  33:595.8-613.3
const cards = [
  // ── Chapter cards (top-left, user-specified timestamps scaled ×0.9739) ──────
  { id: 'chap-12sek',      type: 'chapter', inTime:   0.5,  outTime:   5.0,  text: '12 Sekunden' },
  { id: 'chap-luege2',     type: 'chapter', inTime:  91.5,  outTime:  96.0,  text: 'Lüge Nr. 2:' },
  { id: 'chap-beutel',     type: 'chapter', inTime: 187.5,  outTime: 192.0,  text: 'Reservoirbeutel —\nWas' },
  { id: 'chap-filter',     type: 'chapter', inTime: 292.0,  outTime: 296.5,  text: 'Oft Werden Filter' },
  { id: 'chap-einfrieren', type: 'chapter', inTime: 389.5,  outTime: 394.0,  text: 'Einfrieren Im\nNotfall' },
  { id: 'chap-druck',      type: 'chapter', inTime: 467.5,  outTime: 472.0,  text: 'Druckabfall —\nWie' },
  { id: 'chap-airlines',   type: 'chapter', inTime: 557.5,  outTime: 562.0,  text: 'Airlines Ändern\nSollten' },

  // ── Stat cards (bottom-left, big number) ────────────────────────────────────
  { id: 'stat-12sek',  type: 'stat', inTime:   5.5,  outTime:  19.5,
    label: 'BEWUSSTLOSIGKEIT NACH', value: '12 Sek.', sub: 'explosivem Druckabfall in 10 km Höhe', icon: '⏱️' },
  { id: 'stat-90pct',  type: 'stat', inTime:  22.5,  outTime:  33.5,
    label: 'DER PASSAGIERE', value: '90 %', sub: 'wissen nicht wie die Maske wirklich funktioniert', icon: '✈️' },
  { id: 'stat-260c',   type: 'stat', inTime:  55.5,  outTime:  72.5,
    label: 'GENERATOR-TEMPERATUR', value: '260 °C', sub: 'direkt über deinem Kopf im Flieger', icon: '🔥' },
  { id: 'stat-15min',  type: 'stat', inTime: 115.0,  outTime: 128.0,
    label: 'SAUERSTOFF-DAUER', value: '15 Min.', sub: 'dann ist der Generator verbraucht', icon: '🫁' },
  { id: 'stat-75pct',  type: 'stat', inTime: 220.5,  outTime: 237.0,
    label: 'DER FLUGPASSAGIERE', value: '75 %', sub: 'würden die Maske falsch anlegen', icon: '😷' },
  { id: 'stat-50pct',  type: 'stat', inTime: 238.5,  outTime: 255.5,
    label: 'DER KABINENLUFT', value: '50 %', sub: 'wird auf Langstrecke rezirkuliert', icon: '💨' },
  { id: 'stat-2l',     type: 'stat', inTime: 310.0,  outTime: 326.0,
    label: 'WASSERVERLUST', value: '2 Liter', sub: 'auf einem 10-Stunden-Flug unbewusst', icon: '💧' },
  { id: 'stat-1988',   type: 'stat', inTime: 468.5,  outTime: 485.5,
    label: 'ALOHA AIRLINES FLUG 243', value: '1988', sub: 'Rumpf riss weg in 7.300 m Höhe', icon: '✈️' },
  { id: 'stat-02',     type: 'stat', inTime: 535.0,  outTime: 555.5,
    label: 'TÖDLICHE UNFÄLLE PRO MIO. FLÜGE', value: '0,2', sub: 'laut IATA-Daten 2023', icon: '📊' },

  // ── Key cards (bottom-left, tag badge + text) ────────────────────────────────
  { id: 'key-generator', type: 'key', inTime:  36.0,  outTime:  53.0,
    tag: 'LÜGE 1', text: 'Chemische Reaktion —\nkein Sauerstofftank' },
  { id: 'key-schnur',    type: 'key', inTime: 166.5,  outTime: 186.5,
    tag: 'LÜGE 4', text: 'Immer die Schnur ziehen —\nsonst kein Sauerstoff' },
  { id: 'key-hepa',      type: 'key', inTime: 257.0,  outTime: 276.0,
    tag: 'FILTER', text: 'HEPA filtert 99,97 % —\nnur wenn rechtzeitig gewechselt' },
  { id: 'key-alkohol',   type: 'key', inTime: 327.5,  outTime: 342.5,
    tag: 'ACHTUNG', text: 'Alkohol trifft im Flieger\ndoppelt so hart' },
  { id: 'key-erstar',    type: 'key', inTime: 344.0,  outTime: 365.5,
    tag: 'LÜGE 7', text: 'Erstarrungsreaktion —\nkein Instinkt rettet dich' },
  { id: 'key-schuhe',    type: 'key', inTime: 493.0,  outTime: 507.0,
    tag: 'TIPP', text: 'Schuhe ausziehen vor\nder Notrutsche' },
];


// ── Styles (720p-scaled — matches HyperFrames brand) ─────────────────────────
const mgStyle = `
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; bottom: 95px;
      display: flex; align-items: stretch;
      background: rgba(10,10,30,0.88);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 8px 32px rgba(0,0,0,0.65);
      border-radius: 14px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 4px; background: ${GOLD}; flex-shrink: 0; }
    .inner  { padding: 14px 18px; flex: 1; }
  </style>`;

const chapStyle = `
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; top: 40px;
      display: flex; align-items: stretch;
      background: rgba(0,20,45,0.82);
      border: 1px solid rgba(100,180,255,0.28);
      box-shadow: 0 8px 32px rgba(0,0,0,0.65);
      border-radius: 14px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 4px; background: #4FC3F7; flex-shrink: 0; }
    .inner  { padding: 14px 18px; flex: 1; }
  </style>`;

function buildHTML(card) {
  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:455px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:11px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:4px">${card.label}</div>
          <div style="font-size:48px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-1px">${card.value}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:4px">${card.sub}</div>
        </div>
        <div style="font-size:30px;padding:14px 14px 14px 0;display:flex;align-items:flex-start;padding-top:16px">${card.icon}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:455px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:9px;font-weight:800;letter-spacing:.12em;padding:2px 7px;border-radius:4px;text-transform:uppercase;margin-bottom:8px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.18);margin-bottom:8px"></div>
          <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4;white-space:pre-line">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${chapStyle}</head><body>
      <div class="card" style="width:415px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:#4FC3F7;color:#001828;font-size:9px;font-weight:800;letter-spacing:.12em;padding:2px 7px;border-radius:4px;text-transform:uppercase;margin-bottom:6px">KAPITEL</div>
          <div style="height:1px;background:rgba(100,180,255,.22);margin-bottom:6px"></div>
          <div style="font-size:20px;font-weight:800;color:#FFF;letter-spacing:-.3px;line-height:1.25;white-space:pre-line">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  const manifest = { cards: [] };
  for (const card of cards) {
    await page.setContent(buildHTML(card), { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const pngPath = join(outDir, `${card.id}.png`);
    await page.screenshot({ path: pngPath, omitBackground: true });
    manifest.cards.push({ id: card.id, path: `card-frames/${card.id}.png`, inTime: card.inTime, outTime: card.outTime });
    console.log(`  ✓ ${card.id}.png`);
  }
  await browser.close();
  writeFileSync(join(__dir, 'card-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${manifest.cards.length} cards → card-manifest.json`);
})();
