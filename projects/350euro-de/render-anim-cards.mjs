/**
 * Renders ANIMATED motion-graphics cards as frame sequences (transparent PNGs).
 * Entrance animation per card; stat cards get prefix+count-up+suffix.
 * Also renders animated intro title and outro end-card.
 *
 * Output: anim/<id>/f_####.png  +  anim-manifest.json
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
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

// ── Card data ────────────────────────────────────────────────────────────────
const cards = [
  // Chapter cards (4) — slide-in from left
  { id: 'chap-deal',     type: 'chapter', inTime: 0.5,   outTime: 4.5,   text: '1.500€ vs. 350€', num: 1 },
  { id: 'chap-fenster',  type: 'chapter', inTime: 54.0,  outTime: 58.5,  text: 'Magische\nBuchungsfenster', num: 2 },
  { id: 'chap-wochentag',type: 'chapter', inTime: 110.0, outTime: 114.5, text: 'Wochentag-Trick\nBeim Buchen', num: 3 },
  { id: 'chap-flex',     type: 'chapter', inTime: 166.0, outTime: 170.5, text: 'Flexibilität —\nDein Vorteil', num: 4 },

  // Stat cards (10) — slide-up + count-up (prefix/countTo/suffix)
  { id: 'stat-vergleich', type: 'stat', inTime: 12.0,  outTime: 18.0,  label: 'GLEICHER FLUG',     prefix: '', countTo: 350,  suffix: '€', value: '350€',     sub: 'Statt 1.500€ — selbe Airline & Route', icon: '✈️' },
  { id: 'stat-340',       type: 'stat', inTime: 31.0,  outTime: 37.0,  label: 'WM KATAR',          prefix: '+', countTo: 340, suffix: '%', value: '+340%',    sub: 'Flugpreis-Anstieg in 48 Stunden',     icon: '📈' },
  { id: 'stat-dreifach',  type: 'stat', inTime: 51.0,  outTime: 56.0,  label: 'IN 6 MONATEN',      prefix: '', countTo: null, suffix: '', value: '3×',       sub: 'So viel zahlst du später',            icon: '💸' },
  { id: 'stat-fenster',   type: 'stat', inTime: 60.5,  outTime: 67.0,  label: 'BUCHUNGSFENSTER',   prefix: '', countTo: null, suffix: '', value: '3–6 Mon.', sub: 'Vor Abflug am günstigsten',           icon: '🗓️' },
  { id: 'stat-kiwi',      type: 'stat', inTime: 89.0,  outTime: 95.0,  label: 'KIWI.COM',          prefix: '−', countTo: 40,  suffix: '%', value: '−40%',     sub: 'Über versteckte Verbindungsrouten',   icon: '🔍' },
  { id: 'stat-umweg',     type: 'stat', inTime: 103.0, outTime: 109.0, label: 'UMWEG KANADA',      prefix: '', countTo: null, suffix: '', value: '300–400€', sub: 'Toronto/Montreal → New York spart',   icon: '🍁' },
  { id: 'stat-wochentag', type: 'stat', inTime: 116.5, outTime: 122.5, label: 'DI & MI BUCHEN',    prefix: '−', countTo: 20,  suffix: '%', value: '−20%',     sub: 'Unter dem Wochendurchschnitt',        icon: '📉' },
  { id: 'stat-meilen',    type: 'stat', inTime: 132.0, outTime: 138.0, label: 'MEILEN NÖTIG',      prefix: '', countTo: null, suffix: '', value: '50–70k',   sub: 'Für ein Rückflugticket nach NYC',     icon: '💳' },
  { id: 'stat-direkt',    type: 'stat', inTime: 192.5, outTime: 198.0, label: 'DIREKTBUCHUNG',     prefix: '+', countTo: 23,  suffix: '%', value: '+23%',     sub: 'Teurer als Vergleichsportale',        icon: '⚠️' },
  { id: 'stat-final',     type: 'stat', inTime: 221.0, outTime: 227.5, label: '30 MIN ARBEIT',     prefix: '', countTo: 1000, suffix: '€', value: '1.000€',   sub: 'So viel sparst du mit der Formel',     icon: '🏆' },

  // Key cards (4) — scale-pop
  { id: 'key-trick',     type: 'key', inTime: 15.0,  outTime: 19.0,  tag: 'GEHEIMNIS',  text: 'Diese Leute kennen\neinen einzigen Trick.' },
  { id: 'key-jetzt',     type: 'key', inTime: 48.0,  outTime: 53.0,  tag: 'TIMING',     text: 'Wer jetzt bucht,\nzahlt Normalpreise.' },
  { id: 'key-tools',     type: 'key', inTime: 78.0,  outTime: 85.0,  tag: '3 PROFI-TOOLS', text: 'Google Flights · Skyscanner\n· Kiwi.com' },
  { id: 'key-preisalarm',type: 'key', inTime: 149.0, outTime: 156.0, tag: 'SCHRITT',    text: 'Preisalarm setzen —\ndas System arbeitet für dich.' },

  // Alert cards (2) — scale-pop
  { id: 'alert-auto',    type: 'alert', inTime: 22.0,  outTime: 28.0,  badge: 'ACHTUNG',  text: 'Airlines erhöhen Preise\nAUTOMATISCH bei Events.' },
  { id: 'alert-direkt',  type: 'alert', inTime: 186.0, outTime: 192.0, badge: 'VORSICHT', text: 'Direktbuchung bei Events\n= Event-Zuschlag.' },

  // Definition card (1) — slide-in top
  { id: 'def-fenster',   type: 'definition', inTime: 63.0, outTime: 70.0, term: 'Goldenes Fenster', text: 'Jan–März 2026 — die\ngünstigste Buchungszeit.' },

  // Source cards (2) — fade-in right
  { id: 'src-google',    type: 'source', inTime: 56.5,  outTime: 62.0,  text: 'Google Flights — Buchungsfenster-Studie' },
  { id: 'src-iata',      type: 'source', inTime: 177.0, outTime: 182.5, text: 'IATA — Preisunterschiede bei Großevents' },

  // Quote card (1) — scale-pop
  { id: 'quote-flex',    type: 'quote', inTime: 182.5, outTime: 186.0, text: 'Flexibilität ist die günstigste Währung, die du hast.', attribution: 'Fazit' },

  // Checklist card (1) — scale-pop (the formula)
  { id: 'checklist-formel', type: 'checklist', inTime: 207.0, outTime: 215.0, items: [
    'Dienstag/Mittwoch buchen',
    '3–6 Monate im Voraus',
    'Über Skyscanner oder Kiwi',
    'Preisalarm auf Google Flights',
    'Umweg über Kanada prüfen',
  ]},
];

function animDuration(card) {
  return Math.min(card.outTime - card.inTime, 5.0);
}

function pill(bg, color, label) {
  return `<div style="display:inline-block;background:${bg};color:${color};font-size:9px;font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px;text-transform:uppercase;margin-bottom:7px">${label}</div>`;
}
function divider(color) {
  return `<div style="height:1px;background:${color};margin-bottom:7px"></div>`;
}

function buildFrame(card, t) {
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

  if (card.type === 'stat') {
    const e = easeOutCubic(clamp01(t / 0.5));
    const y = 40 * (1 - e);
    const op = clamp01(t / 0.3);
    let displayVal;
    if (card.countTo !== null) {
      const cp = easeOutCubic(clamp01((t - 0.2) / 1.3));
      const n = Math.round(card.countTo * cp).toLocaleString('de-DE');
      displayVal = card.prefix + n + card.suffix;
    } else {
      displayVal = card.value;
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
        ${pill(GOLD,'#000','DIE FORMEL')}
        ${divider('rgba(255,215,0,.25)')}
        ${listItems}
      </div>
    </div>`;
  }
}

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
          font-size:70px;font-weight:900;color:#fff;letter-spacing:-1px;
          text-shadow:0 6px 30px rgba(0,0,0,.8);text-align:center;line-height:1.05">
          <span style="color:${GOLD}">350€</span><br>ZUM WM-FINALE</div>
        <div style="opacity:${sub};transform:translateY(${(1 - sub) * 18}px);
          font-size:22px;font-weight:700;color:#fff;letter-spacing:3px;
          background:rgba(0,0,0,.45);padding:8px 22px;border-radius:30px;
          border:1.5px solid rgba(255,255,255,.25)">WM 2026 · FLUG-DEAL TRICKS</div>
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
        <div style="font-size:16px;font-weight:700;color:#fff;background:rgba(0,0,0,.5);
          padding:9px 20px;border-radius:10px;border:1px solid rgba(255,255,255,.2)">
          ⬇ Download: github.com/rcama03/HyperFrames</div>
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

  for (const card of cards) {
    const dur = animDuration(card);
    const nFrames = Math.round(dur * FPS);
    const dir = join(animDir, card.id);
    mkdirSync(dir, { recursive: true });
    console.log(`▶ ${card.id}: ${nFrames} frames (${dur}s)`);
    for (let f = 0; f < nFrames; f++) {
      const t = f / FPS;
      await page.evaluate(html => { document.body.innerHTML = html; }, buildFrame(card, t));
      await page.screenshot({ path: join(dir, `f_${String(f).padStart(4, '0')}.png`), omitBackground: true });
    }
    manifest.elements.push({ id: card.id, frames: nFrames, duration: dur, inTime: card.inTime, outTime: card.outTime });
    console.log(`  ✓ ${card.id} done`);
  }

  for (const el of specialElements) {
    const dir = join(animDir, el.id);
    mkdirSync(dir, { recursive: true });
    const nFrames = Math.round(el.duration * FPS);
    console.log(`▶ ${el.id}: ${nFrames} frames (${el.duration}s)`);
    for (let f = 0; f < nFrames; f++) {
      const t = f / FPS;
      await page.evaluate(html => { document.body.innerHTML = html; }, el.frame(t));
      await page.screenshot({ path: join(dir, `f_${String(f).padStart(4, '0')}.png`), omitBackground: true });
    }
    manifest.elements.push({ id: el.id, frames: nFrames, duration: el.duration });
    console.log(`  ✓ ${el.id} done`);
  }

  await browser.close();
  writeFileSync(join(__dir, 'anim-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n✓ ${manifest.elements.length} animated elements written to anim-manifest.json`);
})().catch(err => { console.error(err); process.exit(1); });
