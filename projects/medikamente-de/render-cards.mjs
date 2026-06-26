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

const cards = [
  // ── Chapter cards — top-left, cyan ────────────────────────────────────────
  { id: 'chap-hook',       type: 'chapter', inTime: 0.5,   outTime: 4.0,   text: 'Schock-Hook:\nDeine Tablette' },
  { id: 'chap-benzo',      type: 'chapter', inTime: 92.0,  outTime: 96.0,  text: 'Benzodiazepine' },
  { id: 'chap-adhs',       type: 'chapter', inTime: 115.0, outTime: 119.0, text: 'ADHS-Medikamente' },
  { id: 'chap-opioide',    type: 'chapter', inTime: 135.0, outTime: 139.0, text: 'Opioide & Codein' },
  { id: 'chap-attest',     type: 'chapter', inTime: 208.0, outTime: 212.0, text: 'Ärztliches Attest\nAuf Englisch' },
  { id: 'chap-original',   type: 'chapter', inTime: 254.0, outTime: 258.0, text: 'Originalverpackung' },
  { id: 'chap-menge',      type: 'chapter', inTime: 273.0, outTime: 277.0, text: 'Menge & Vorrat' },
  { id: 'chap-fluessig',   type: 'chapter', inTime: 295.0, outTime: 299.0, text: 'Flüssige\nMedikamente' },
  { id: 'chap-fazit',      type: 'chapter', inTime: 314.0, outTime: 318.0, text: 'Fazit &\nZusammenfassung' },

  // ── Stat cards — bottom-left, gold ────────────────────────────────────────
  { id: 'stat-festnahme',   type: 'stat', inTime: 7.5,   outTime: 13.0,  label: 'RISIKO',           value: 'Festnahme',  sub: 'Schlaftablette → Sofort am Flughafen',       icon: '🚨' },
  { id: 'stat-16staedte',   type: 'stat', inTime: 55.0,  outTime: 61.0,  label: 'WM 2026 — USA',    value: '16 Städte',  sub: 'Von New York bis Los Angeles',               icon: '🏟️' },
  { id: 'stat-schedule4',   type: 'stat', inTime: 100.0, outTime: 107.0, label: 'BENZODIAZEPINE',   value: 'Sch. IV',    sub: 'Strenge Mengenbeschränkung in den USA',       icon: '💊' },
  { id: 'stat-schedule2',   type: 'stat', inTime: 120.0, outTime: 127.0, label: 'ADHS-MEDIKAMENTE', value: 'Sch. II',    sub: 'Strengste Kategorie — wie Morphin',           icon: '⚠️' },
  { id: 'stat-60k',         type: 'stat', inTime: 160.0, outTime: 167.0, label: 'BESCHLAGNAHMT',    value: '60.000+',    sub: 'Medikamente jährlich am US-Zoll',             icon: '📦' },
  { id: 'stat-90tage',      type: 'stat', inTime: 280.0, outTime: 287.0, label: 'MAX. VORRAT',      value: '90 Tage',    sub: 'Persönlicher Bedarf — variiert je Wirkstoff', icon: '📋' },
  { id: 'stat-5mio',        type: 'stat', inTime: 470.0, outTime: 477.0, label: 'WM-REISENDE',      value: '5 Mio.',     sub: '30% nehmen regelmäßig Medikamente ein',       icon: '✈️' },

  // ── Key cards — bottom-left, orange ───────────────────────────────────────
  { id: 'key-grundregel',   type: 'key', inTime: 35.0,  outTime: 42.0,  tag: 'GRUNDREGEL',   text: 'US-Recht gilt — nicht\ndeutsches Rezept.' },
  { id: 'key-dea',          type: 'key', inTime: 72.0,  outTime: 79.0,  tag: 'DEA-LISTE',    text: 'Controlled Substances —\nalles streng reglementiert.' },
  { id: 'key-attest',       type: 'key', inTime: 215.0, outTime: 223.0, tag: 'SCHRITT 1',    text: 'Ärztliches Attest auf\nEnglisch — mit Diagnose.' },
  { id: 'key-verpackung',   type: 'key', inTime: 258.0, outTime: 266.0, tag: 'SCHRITT 2',    text: 'Immer Originalverpackung —\nnie lose Pillen.' },
  { id: 'key-verhalten',    type: 'key', inTime: 350.0, outTime: 358.0, tag: 'AM ZOLL',      text: 'Ruhig, proaktiv, Dokumente\nbereithalten.' },

  // ── Alert cards — bottom-left, red ────────────────────────────────────────
  { id: 'alert-cannabis',   type: 'alert', inTime: 390.0, outTime: 398.0, badge: 'TABU',     text: 'Cannabis & CBD-Öl —\nauf Bundesebene ILLEGAL.' },
  { id: 'alert-strafe',     type: 'alert', inTime: 410.0, outTime: 418.0, badge: 'WORST CASE', text: 'Schedule-II ohne Doku =\nSTRAFVERFOLGUNG möglich.' },
  { id: 'alert-post',       type: 'alert', inTime: 430.0, outTime: 438.0, badge: 'VERBOTEN', text: 'Medikamente per Post in\ndie USA — grundsätzlich illegal.' },

  // ── Definition cards — top-left, teal ─────────────────────────────────────
  { id: 'def-controlled',   type: 'definition', inTime: 45.0,  outTime: 53.0,  term: 'Controlled Substances', text: 'US-Liste streng reglementierter\noder verbotener Wirkstoffe.' },
  { id: 'def-enforcement',  type: 'definition', inTime: 330.0, outTime: 338.0, term: 'Enforcement Discretion', text: 'Ermessensspielraum — Beamter\nentscheidet individuell.' },

  // ── Source cards — bottom-right, green ────────────────────────────────────
  { id: 'src-cbp',          type: 'source', inTime: 63.0,  outTime: 68.0,  text: 'US Customs & Border Protection — Kontrollen 2026' },
  { id: 'src-dea',          type: 'source', inTime: 78.0,  outTime: 83.0,  text: 'DEA — Controlled Substances Act' },
  { id: 'src-fda',          type: 'source', inTime: 500.0, outTime: 506.0, text: 'FDA — Medikamentenimport Richtlinien' },

  // ── Quote card — bottom-left, purple ──────────────────────────────────────
  { id: 'quote-fazit', type: 'quote', inTime: 555.0, outTime: 564.0, text: 'Attest, Originalverpackung, richtige Menge — das REICHT.', attribution: 'Fazit' },

  // ── Checklist card — bottom-left, gold ────────────────────────────────────
  { id: 'checklist-abflug', type: 'checklist', inTime: 510.0, outTime: 520.0, items: [
    'Attest auf Englisch',
    'Originalverpackung',
    'Max. 30 Tage (Schedule II)',
    'Flüssiges separat im Handgepäck',
    'Am Zoll proaktiv ansprechen',
  ]},
];

const bottomCard = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; bottom: 165px;
      display: flex; align-items: stretch;
      background: rgba(10,10,30,0.72);
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 6px 24px rgba(0,0,0,0.6);
      border-radius: 12px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
    }
    .stripe { width: 4px; flex-shrink: 0; }
    .inner  { padding: 12px 16px; flex: 1; }
  </style>`;

const topCard = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; top: 40px;
      display: flex; align-items: stretch;
      background: rgba(0,28,58,0.55);
      border: 1.5px solid rgba(100,180,255,0.32);
      box-shadow: 0 6px 24px rgba(0,0,0,0.6);
      border-radius: 12px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
    }
    .stripe { width: 4px; flex-shrink: 0; }
    .inner  { padding: 12px 16px; flex: 1; }
  </style>`;

const sourceCard = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; right: 40px; bottom: 165px;
      display: flex; align-items: center; gap: 8px;
      background: rgba(5,20,10,0.55);
      border: 1.5px solid rgba(102,187,106,0.35);
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      border-radius: 10px; padding: 9px 14px;
      max-width: 400px;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
    }
  </style>`;

function pill(bg, color, label) {
  return `<div style="display:inline-block;background:${bg};color:${color};font-size:9px;font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px;text-transform:uppercase;margin-bottom:7px">${label}</div>`;
}
function divider(color) {
  return `<div style="height:1px;background:${color};margin-bottom:7px"></div>`;
}

function buildHTML(card) {
  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${topCard}</head><body>
      <div class="card" style="width:370px">
        <div class="stripe" style="background:#4FC3F7"></div>
        <div class="inner">
          ${pill('#4FC3F7','#001828','KAPITEL')}
          ${divider('rgba(100,180,255,.25)')}
          <div style="font-size:19px;font-weight:800;color:#FFF;letter-spacing:-.2px;line-height:1.2;white-space:pre-line">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${bottomCard}</head><body>
      <div class="card" style="width:420px">
        <div class="stripe" style="background:${GOLD}"></div>
        <div class="inner">
          <div style="font-size:10px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:3px">${card.label}</div>
          <div style="font-size:42px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-1px">${card.value}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:3px">${card.sub}</div>
        </div>
        <div style="font-size:26px;padding:12px 12px 12px 0;display:flex;align-items:flex-start;padding-top:16px">${card.icon}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${bottomCard}</head><body>
      <div class="card" style="width:420px">
        <div class="stripe" style="background:#FF6D00"></div>
        <div class="inner">
          ${pill('#FF6D00','#fff',card.tag)}
          ${divider('rgba(255,109,0,.25)')}
          <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4;white-space:pre-line">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'alert') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${bottomCard}</head><body>
      <div class="card" style="width:430px;border-color:rgba(255,60,60,0.35);background:rgba(35,5,5,0.72)">
        <div class="stripe" style="background:#FF3C3C"></div>
        <div class="inner">
          ${pill('#FF3C3C','#fff','⚠ ' + card.badge)}
          ${divider('rgba(255,60,60,.25)')}
          <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4;white-space:pre-line">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'definition') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${topCard}</head><body>
      <div class="card" style="width:430px">
        <div class="stripe" style="background:#00BCD4"></div>
        <div class="inner">
          ${pill('#00BCD4','#001820','DEFINITION')}
          ${divider('rgba(0,188,212,.25)')}
          <div style="font-size:18px;font-weight:800;color:#FFF;margin-bottom:5px;line-height:1.2">${card.term}</div>
          <div style="font-size:14px;color:rgba(255,255,255,.82);line-height:1.45;white-space:pre-line">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'source') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${sourceCard}</head><body>
      <div class="card">
        <div style="font-size:11px;font-weight:800;color:#66BB6A;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
        <div style="font-size:14px;color:rgba(255,255,255,.88);font-weight:600;line-height:1.3">${card.text}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'quote') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${bottomCard}</head><body>
      <div class="card" style="width:440px;border-color:rgba(156,39,176,0.35);background:rgba(15,5,30,0.72)">
        <div class="stripe" style="background:#9C27B0"></div>
        <div class="inner">
          <div style="font-size:28px;color:#9C27B0;line-height:1;margin-bottom:4px;opacity:0.9">&ldquo;</div>
          <div style="font-size:16px;font-weight:700;color:#FFF;line-height:1.45;font-style:italic">${card.text}</div>
          <div style="font-size:13px;color:#CE93D8;margin-top:7px;letter-spacing:.05em">&mdash; ${card.attribution}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'checklist') {
    const listItems = card.items.map(item =>
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <div style="width:16px;height:16px;border-radius:4px;background:${GOLD};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:10px;color:#000;font-weight:800">✓</span>
        </div>
        <span style="font-size:13px;font-weight:600;color:#FFF;line-height:1.3">${item}</span>
      </div>`
    ).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${bottomCard}</head><body>
      <div class="card" style="width:430px">
        <div class="stripe" style="background:${GOLD}"></div>
        <div class="inner">
          ${pill(GOLD,'#000','CHECKLISTE')}
          ${divider('rgba(255,215,0,.25)')}
          ${listItems}
        </div>
      </div>
    </body></html>`;
  }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  const manifest = { cards: [] };
  console.log(`Rendering ${cards.length} cards at ${W}×${H} (mobile-first)...`);
  for (const card of cards) {
    await page.setContent(buildHTML(card), { waitUntil: 'networkidle' });
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
