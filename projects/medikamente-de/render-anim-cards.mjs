/**
 * Renders ANIMATED motion-graphics cards as frame sequences (transparent PNGs).
 * Each card gets entrance animation; stat cards get number count-up.
 * Also renders animated intro title and outro end-card.
 *
 * Output: anim/<id>/f_####.png  +  anim-manifest.json
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const animDir = join(__dir, 'anim');
mkdirSync(animDir, { recursive: true });

const W = 1280, H = 720, FPS = 25;
const GOLD = '#FFD700';

const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeOutBack  = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const clamp01 = x => Math.max(0, Math.min(1, x));

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');`;
const BASE = `
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; background:transparent; overflow:hidden;
    font-family:'Montserrat','Arial Black',sans-serif;
    -webkit-font-smoothing:antialiased; text-rendering:geometricPrecision; }`;

// ── Card data (same as render-cards.mjs but each gets animation) ─────────────
const cards = [
  // Chapter cards — slide-in from left
  { id: 'chap-hook',       type: 'chapter', inTime: 0.5,   outTime: 4.0,   text: 'Schock-Hook:\nDeine Tablette', num: 1 },
  { id: 'chap-benzo',      type: 'chapter', inTime: 92.0,  outTime: 96.0,  text: 'Benzodiazepine', num: 2 },
  { id: 'chap-adhs',       type: 'chapter', inTime: 115.0, outTime: 119.0, text: 'ADHS-Medikamente', num: 3 },
  { id: 'chap-opioide',    type: 'chapter', inTime: 135.0, outTime: 139.0, text: 'Opioide & Codein', num: 4 },
  { id: 'chap-attest',     type: 'chapter', inTime: 208.0, outTime: 212.0, text: 'Ärztliches Attest\nAuf Englisch', num: 5 },
  { id: 'chap-original',   type: 'chapter', inTime: 254.0, outTime: 258.0, text: 'Originalverpackung', num: 6 },
  { id: 'chap-menge',      type: 'chapter', inTime: 273.0, outTime: 277.0, text: 'Menge & Vorrat', num: 7 },
  { id: 'chap-fluessig',   type: 'chapter', inTime: 295.0, outTime: 299.0, text: 'Flüssige\nMedikamente', num: 8 },
  { id: 'chap-fazit',      type: 'chapter', inTime: 314.0, outTime: 318.0, text: 'Fazit &\nZusammenfassung', num: 9 },

  // Stat cards — slide-up + number count-up
  { id: 'stat-festnahme',   type: 'stat', inTime: 7.5,   outTime: 13.0,  label: 'RISIKO',           value: 'Festnahme', countTo: null,   sub: 'Schlaftablette → Sofort am Flughafen',       icon: '🚨' },
  { id: 'stat-16staedte',   type: 'stat', inTime: 55.0,  outTime: 61.0,  label: 'WM 2026 — USA',    value: '16',        countTo: 16,     sub: 'Städte von New York bis Los Angeles',         icon: '🏟️' },
  { id: 'stat-schedule4',   type: 'stat', inTime: 100.0, outTime: 107.0, label: 'BENZODIAZEPINE',   value: 'Sch. IV',   countTo: null,   sub: 'Strenge Mengenbeschränkung in den USA',       icon: '💊' },
  { id: 'stat-schedule2',   type: 'stat', inTime: 120.0, outTime: 127.0, label: 'ADHS-MEDIKAMENTE', value: 'Sch. II',   countTo: null,   sub: 'Strengste Kategorie — wie Morphin',           icon: '⚠️' },
  { id: 'stat-60k',         type: 'stat', inTime: 160.0, outTime: 167.0, label: 'BESCHLAGNAHMT',    value: '60.000+',   countTo: 60000,  sub: 'Medikamente jährlich am US-Zoll',             icon: '📦' },
  { id: 'stat-90tage',      type: 'stat', inTime: 280.0, outTime: 287.0, label: 'MAX. VORRAT',      value: '90',        countTo: 90,     sub: 'Tage persönlicher Bedarf',                    icon: '📋' },
  { id: 'stat-5mio',        type: 'stat', inTime: 470.0, outTime: 477.0, label: 'WM-REISENDE',      value: '5 Mio.',    countTo: 5000000,sub: '30% nehmen regelmäßig Medikamente ein',       icon: '✈️' },

  // Key cards — scale-pop entrance
  { id: 'key-grundregel',   type: 'key', inTime: 35.0,  outTime: 42.0,  tag: 'GRUNDREGEL',   text: 'US-Recht gilt — nicht\ndeutsches Rezept.' },
  { id: 'key-dea',          type: 'key', inTime: 72.0,  outTime: 79.0,  tag: 'DEA-LISTE',    text: 'Controlled Substances —\nalles streng reglementiert.' },
  { id: 'key-attest',       type: 'key', inTime: 215.0, outTime: 223.0, tag: 'SCHRITT 1',    text: 'Ärztliches Attest auf\nEnglisch — mit Diagnose.' },
  { id: 'key-verpackung',   type: 'key', inTime: 258.0, outTime: 266.0, tag: 'SCHRITT 2',    text: 'Immer Originalverpackung —\nnie lose Pillen.' },
  { id: 'key-verhalten',    type: 'key', inTime: 350.0, outTime: 358.0, tag: 'AM ZOLL',      text: 'Ruhig, proaktiv, Dokumente\nbereithalten.' },

  // Alert cards — scale-pop (stronger bounce)
  { id: 'alert-cannabis',   type: 'alert', inTime: 390.0, outTime: 398.0, badge: 'TABU',       text: 'Cannabis & CBD-Öl —\nauf Bundesebene ILLEGAL.' },
  { id: 'alert-strafe',     type: 'alert', inTime: 410.0, outTime: 418.0, badge: 'WORST CASE', text: 'Schedule-II ohne Doku =\nSTRAFVERFOLGUNG möglich.' },
  { id: 'alert-post',       type: 'alert', inTime: 430.0, outTime: 438.0, badge: 'VERBOTEN',   text: 'Medikamente per Post in\ndie USA — grundsätzlich illegal.' },

  // Definition cards — slide-in from left (top position)
  { id: 'def-controlled',   type: 'definition', inTime: 45.0,  outTime: 53.0,  term: 'Controlled Substances', text: 'US-Liste streng reglementierter\noder verbotener Wirkstoffe.' },
  { id: 'def-enforcement',  type: 'definition', inTime: 330.0, outTime: 338.0, term: 'Enforcement Discretion', text: 'Ermessensspielraum — Beamter\nentscheidet individuell.' },

  // Source cards — fade-in (right side)
  { id: 'src-cbp',          type: 'source', inTime: 63.0,  outTime: 68.0,  text: 'US Customs & Border Protection — Kontrollen 2026' },
  { id: 'src-dea',          type: 'source', inTime: 78.0,  outTime: 83.0,  text: 'DEA — Controlled Substances Act' },
  { id: 'src-fda',          type: 'source', inTime: 500.0, outTime: 506.0, text: 'FDA — Medikamentenimport Richtlinien' },

  // Quote card — scale-pop
  { id: 'quote-fazit', type: 'quote', inTime: 555.0, outTime: 564.0, text: 'Attest, Originalverpackung, richtige Menge — das REICHT.', attribution: 'Fazit' },

  // Checklist card — scale-pop
  { id: 'checklist-abflug', type: 'checklist', inTime: 510.0, outTime: 520.0, items: [
    'Attest auf Englisch',
    'Originalverpackung',
    'Max. 30 Tage (Schedule II)',
    'Flüssiges separat im Handgepäck',
    'Am Zoll proaktiv ansprechen',
  ]},
];

// ── Animation duration per card = card visible duration (capped at 5s for frame count) ──
function animDuration(card) {
  return Math.min(card.outTime - card.inTime, 5.0);
}

// ── HTML builders per type with animation parameter t ────────────────────────

function pill(bg, color, label) {
  return `<div style="display:inline-block;background:${bg};color:${color};font-size:9px;font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px;text-transform:uppercase;margin-bottom:7px">${label}</div>`;
}
function divider(color) {
  return `<div style="height:1px;background:${color};margin-bottom:7px"></div>`;
}

function formatCount(n, countTo) {
  if (countTo === null) return n;
  if (countTo >= 1000000) return Math.round(n).toLocaleString('de-DE');
  if (countTo >= 1000) return Math.round(n).toLocaleString('de-DE');
  return String(Math.round(n));
}

function formatCountSuffix(card) {
  if (card.countTo === null) return '';
  if (card.countTo >= 1000000) return '';
  if (card.value.includes('+')) return '+';
  if (card.value.includes(' ')) return ' ' + card.value.split(' ').slice(1).join(' ');
  return '';
}

function buildFrame(card, t) {
  // Chapter — slide in from left
  if (card.type === 'chapter') {
    const e = easeOutCubic(clamp01(t / 0.5));
    const x = -420 + 460 * e;
    const op = clamp01(t / 0.3);
    return `<div style="position:absolute;left:${x}px;top:40px;opacity:${op};
      display:flex;align-items:stretch;background:rgba(0,28,58,.55);
      border:1.5px solid rgba(100,180,255,.32);border-radius:12px;overflow:hidden;
      box-shadow:0 6px 24px rgba(0,0,0,.6);width:370px">
      <div style="width:4px;background:#4FC3F7"></div>
      <div style="padding:12px 16px">
        ${pill('#4FC3F7','#001828','KAPITEL ' + card.num)}
        ${divider('rgba(100,180,255,.25)')}
        <div style="font-size:19px;font-weight:800;color:#FFF;letter-spacing:-.2px;line-height:1.2;white-space:pre-line">${card.text}</div>
      </div>
    </div>`;
  }

  // Stat — slide up + count-up
  if (card.type === 'stat') {
    const e = easeOutCubic(clamp01(t / 0.5));
    const y = 40 * (1 - e);
    const op = clamp01(t / 0.3);
    let displayVal;
    if (card.countTo !== null) {
      const cp = easeOutCubic(clamp01((t - 0.2) / 1.3));
      const raw = card.countTo * cp;
      displayVal = formatCount(raw, card.countTo) + formatCountSuffix(card);
    } else {
      const textOp = clamp01((t - 0.15) / 0.3);
      displayVal = textOp >= 0.99 ? card.value : card.value;
    }
    return `<div style="position:absolute;left:40px;bottom:165px;opacity:${op};
      transform:translateY(${y}px);display:flex;align-items:stretch;
      background:rgba(10,10,30,.72);border:1.5px solid rgba(255,255,255,.22);
      border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6);width:420px">
      <div style="width:4px;background:${GOLD}"></div>
      <div style="padding:12px 16px;flex:1">
        <div style="font-size:10px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:3px">${card.label}</div>
        <div style="font-size:42px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-1px;font-variant-numeric:tabular-nums">${displayVal}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:3px">${card.sub}</div>
      </div>
      <div style="font-size:26px;padding:12px 12px 12px 0;display:flex;align-items:flex-start;padding-top:16px">${card.icon}</div>
    </div>`;
  }

  // Key — scale-pop
  if (card.type === 'key') {
    const e = easeOutBack(clamp01(t / 0.5));
    const sc = 0.85 + 0.15 * Math.min(1, e);
    const op = clamp01(t / 0.25);
    return `<div style="position:absolute;left:40px;bottom:165px;opacity:${op};
      transform:scale(${sc});transform-origin:left bottom;display:flex;align-items:stretch;
      background:rgba(10,10,30,.72);border:1.5px solid rgba(255,255,255,.22);
      border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6);width:420px">
      <div style="width:4px;background:#FF6D00"></div>
      <div style="padding:12px 16px">
        ${pill('#FF6D00','#fff',card.tag)}
        ${divider('rgba(255,109,0,.25)')}
        <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4;white-space:pre-line">${card.text}</div>
      </div>
    </div>`;
  }

  // Alert — scale-pop (stronger bounce)
  if (card.type === 'alert') {
    const e = easeOutBack(clamp01(t / 0.5));
    const sc = 0.82 + 0.18 * Math.min(1, e);
    const op = clamp01(t / 0.25);
    return `<div style="position:absolute;left:40px;bottom:165px;opacity:${op};
      transform:scale(${sc});transform-origin:left bottom;display:flex;align-items:stretch;
      background:rgba(35,5,5,.72);border:1.5px solid rgba(255,60,60,.35);
      border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6);width:430px">
      <div style="width:4px;background:#FF3C3C"></div>
      <div style="padding:12px 16px">
        ${pill('#FF3C3C','#fff','⚠ ' + card.badge)}
        ${divider('rgba(255,60,60,.25)')}
        <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4;white-space:pre-line">${card.text}</div>
      </div>
    </div>`;
  }

  // Definition — slide-in from left (top position)
  if (card.type === 'definition') {
    const e = easeOutCubic(clamp01(t / 0.5));
    const x = -460 + 500 * e;
    const op = clamp01(t / 0.3);
    return `<div style="position:absolute;left:${x}px;top:40px;opacity:${op};
      display:flex;align-items:stretch;background:rgba(0,28,58,.55);
      border:1.5px solid rgba(100,180,255,.32);border-radius:12px;overflow:hidden;
      box-shadow:0 6px 24px rgba(0,0,0,.6);width:430px">
      <div style="width:4px;background:#00BCD4"></div>
      <div style="padding:12px 16px">
        ${pill('#00BCD4','#001820','DEFINITION')}
        ${divider('rgba(0,188,212,.25)')}
        <div style="font-size:18px;font-weight:800;color:#FFF;margin-bottom:5px;line-height:1.2">${card.term}</div>
        <div style="font-size:14px;color:rgba(255,255,255,.82);line-height:1.45;white-space:pre-line">${card.text}</div>
      </div>
    </div>`;
  }

  // Source — fade-in from right
  if (card.type === 'source') {
    const e = easeOutCubic(clamp01(t / 0.5));
    const x = 30 * (1 - e);
    const op = clamp01(t / 0.4);
    return `<div style="position:absolute;right:${40 - x}px;bottom:165px;opacity:${op};
      display:flex;align-items:center;gap:8px;
      background:rgba(5,20,10,.55);border:1.5px solid rgba(102,187,106,.35);
      border-radius:10px;padding:9px 14px;max-width:400px;
      box-shadow:0 4px 16px rgba(0,0,0,.5)">
      <div style="font-size:11px;font-weight:800;color:#66BB6A;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
      <div style="font-size:14px;color:rgba(255,255,255,.88);font-weight:600;line-height:1.3">${card.text}</div>
    </div>`;
  }

  // Quote — scale-pop
  if (card.type === 'quote') {
    const e = easeOutBack(clamp01(t / 0.5));
    const sc = 0.85 + 0.15 * Math.min(1, e);
    const op = clamp01(t / 0.25);
    return `<div style="position:absolute;left:40px;bottom:165px;opacity:${op};
      transform:scale(${sc});transform-origin:left bottom;display:flex;align-items:stretch;
      background:rgba(15,5,30,.72);border:1.5px solid rgba(156,39,176,.35);
      border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6);width:440px">
      <div style="width:4px;background:#9C27B0"></div>
      <div style="padding:12px 16px">
        <div style="font-size:28px;color:#9C27B0;line-height:1;margin-bottom:4px;opacity:0.9">&ldquo;</div>
        <div style="font-size:16px;font-weight:700;color:#FFF;line-height:1.45;font-style:italic">${card.text}</div>
        <div style="font-size:13px;color:#CE93D8;margin-top:7px;letter-spacing:.05em">&mdash; ${card.attribution}</div>
      </div>
    </div>`;
  }

  // Checklist — scale-pop
  if (card.type === 'checklist') {
    const e = easeOutBack(clamp01(t / 0.5));
    const sc = 0.85 + 0.15 * Math.min(1, e);
    const op = clamp01(t / 0.25);
    const listItems = card.items.map(item =>
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <div style="width:16px;height:16px;border-radius:4px;background:${GOLD};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:10px;color:#000;font-weight:800">✓</span>
        </div>
        <span style="font-size:13px;font-weight:600;color:#FFF;line-height:1.3">${item}</span>
      </div>`
    ).join('');
    return `<div style="position:absolute;left:40px;bottom:165px;opacity:${op};
      transform:scale(${sc});transform-origin:left bottom;display:flex;align-items:stretch;
      background:rgba(10,10,30,.72);border:1.5px solid rgba(255,255,255,.22);
      border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6);width:430px">
      <div style="width:4px;background:${GOLD}"></div>
      <div style="padding:12px 16px">
        ${pill(GOLD,'#000','CHECKLISTE')}
        ${divider('rgba(255,215,0,.25)')}
        ${listItems}
      </div>
    </div>`;
  }
}

// ── Special elements: intro + outro ──────────────────────────────────────────
const specialElements = [
  {
    id: 'intro', duration: 3.0,
    frame(t) {
      const e = easeOutCubic(clamp01(t / 0.7));
      const sub = easeOutCubic(clamp01((t - 0.35) / 0.7));
      const sc = 0.82 + 0.18 * e;
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:18px">
        <div style="opacity:${e};transform:scale(${sc});
          font-size:68px;font-weight:900;color:#fff;letter-spacing:-1px;
          text-shadow:0 6px 30px rgba(0,0,0,.8);text-align:center;line-height:1.05">
          MEDIKAMENTE<br><span style="color:${GOLD}">IN DIE USA</span></div>
        <div style="opacity:${sub};transform:translateY(${(1 - sub) * 18}px);
          font-size:22px;font-weight:700;color:#fff;letter-spacing:3px;
          background:rgba(0,0,0,.45);padding:8px 22px;border-radius:30px;
          border:1.5px solid rgba(255,255,255,.25)">WM 2026 · WAS FANS WISSEN MÜSSEN</div>
      </div>`;
    },
  },
  {
    id: 'outro', duration: 4.5,
    frame(t) {
      const e = easeOutCubic(clamp01(t / 0.6));
      const sc = 0.88 + 0.12 * e;
      const pulse = 1 + 0.05 * Math.sin(t * 6);
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:20px;opacity:${e};transform:scale(${sc})">
        <div style="font-size:40px;font-weight:900;color:#fff;text-align:center;
          text-shadow:0 4px 20px rgba(0,0,0,.8)">Bereit für die WM 2026?</div>
        <div style="transform:scale(${pulse});background:#FF0000;color:#fff;font-size:24px;
          font-weight:800;padding:14px 38px;border-radius:40px;letter-spacing:1px;
          box-shadow:0 8px 30px rgba(255,0,0,.5)">▶ ABONNIEREN</div>
      </div>`;
    },
  },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  await page.setContent(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${FONT}${BASE}</style></head><body></body></html>`,
    { waitUntil: 'load' });
  await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });

  const manifest = { fps: FPS, elements: [] };

  // Render all card animations
  for (const card of cards) {
    const dur = animDuration(card);
    const nFrames = Math.round(dur * FPS);
    const dir = join(animDir, card.id);
    mkdirSync(dir, { recursive: true });

    console.log(`▶ ${card.id}: ${nFrames} frames (${dur}s)`);
    for (let f = 0; f < nFrames; f++) {
      const t = f / FPS;
      await page.evaluate(html => { document.body.innerHTML = html; }, buildFrame(card, t));
      const num = String(f).padStart(4, '0');
      await page.screenshot({ path: join(dir, `f_${num}.png`), omitBackground: true });
    }
    manifest.elements.push({
      id: card.id, frames: nFrames, duration: dur,
      inTime: card.inTime, outTime: card.outTime
    });
    console.log(`  ✓ ${card.id} done`);
  }

  // Render special elements (intro + outro)
  for (const el of specialElements) {
    const dir = join(animDir, el.id);
    mkdirSync(dir, { recursive: true });
    const nFrames = Math.round(el.duration * FPS);
    console.log(`▶ ${el.id}: ${nFrames} frames (${el.duration}s)`);
    for (let f = 0; f < nFrames; f++) {
      const t = f / FPS;
      await page.evaluate(html => { document.body.innerHTML = html; }, el.frame(t));
      const num = String(f).padStart(4, '0');
      await page.screenshot({ path: join(dir, `f_${num}.png`), omitBackground: true });
    }
    manifest.elements.push({ id: el.id, frames: nFrames, duration: el.duration });
    console.log(`  ✓ ${el.id} done`);
  }

  await browser.close();
  writeFileSync(join(__dir, 'anim-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n✓ ${manifest.elements.length} animated elements written to anim-manifest.json`);
})().catch(err => { console.error(err); process.exit(1); });
