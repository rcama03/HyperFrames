/**
 * Renders motion graphics cards for meilen-karte-de project.
 * Mobile-first: compact cards, small fonts, raised above caption zone.
 * Output: card-frames/*.png + card-manifest.json
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

const cards = [
  // ── Chapter cards — top-left, cyan ────────────────────────────────────────
  { id: 'chap-upgrade',     type: 'chapter', inTime: 0.5,   outTime: 4.0,   text: 'Kostenloses Upgrade\nZur WM' },
  { id: 'chap-zahlen',      type: 'chapter', inTime: 63.3,  outTime: 67.0,  text: 'Konkrete Zahlen' },
  { id: 'chap-wm2026',      type: 'chapter', inTime: 117.9, outTime: 121.5, text: 'WM 2026 — Timing' },
  { id: 'chap-alternative', type: 'chapter', inTime: 176.6, outTime: 180.5, text: 'Alternative —\nMiles & More' },

  // ── Stat cards — bottom-left, gold ────────────────────────────────────────
  { id: 'stat-4bis6',   type: 'stat', inTime: 23.9,  outTime: 29.0,  label: 'MEILEN SAMMELN',   value: '4–6 J.',   sub: 'Normales Meilen-Sammeln über Flüge',                  icon: '✈️' },
  { id: 'stat-3monate', type: 'stat', inTime: 30.2,  outTime: 35.0,  label: 'MEILEN-KARTE',     value: '< 3 Mon.', sub: 'Mit der richtigen Karte zum Upgrade',                  icon: '⚡' },
  { id: 'stat-3punkte', type: 'stat', inTime: 41.9,  outTime: 47.0,  label: 'PREMIUM-KARTEN',   value: '3×',       sub: 'Punkte pro Euro mit Premium-Karten',                   icon: '💳' },
  { id: 'stat-60k',     type: 'stat', inTime: 66.9,  outTime: 73.0,  label: 'STARTBONUS',       value: '60.000',   sub: 'Membership Rewards Punkte als Startbonus',             icon: '🎁' },
  { id: 'stat-75k',     type: 'stat', inTime: 79.1,  outTime: 84.0,  label: 'AIRLINE-MEILEN',   value: '75.000',   sub: 'Business-Class Frankfurt–NY',                          icon: '🏆' },
  { id: 'stat-5800',    type: 'stat', inTime: 143.2, outTime: 149.0, label: 'REGULÄRER PREIS',  value: '5.800€',   sub: 'Business-Class Frankfurt–NY bei Lufthansa',            icon: '💸' },
  { id: 'stat-87k',     type: 'stat', inTime: 146.1, outTime: 153.0, label: 'MIT MEILEN',       value: '87.000',   sub: 'Miles & More + 300€ Steuern',                          icon: '📊' },

  // ── Key cards — bottom-left, orange ───────────────────────────────────────
  { id: 'key-kreditkarte', type: 'key', inTime: 10.4,  outTime: 17.0,  tag: 'SYSTEM',     text: 'Eine Kreditkarte reicht\nfür Business Class.' },
  { id: 'key-smarter',     type: 'key', inTime: 83.8,  outTime: 91.0,  tag: 'STRATEGIE',  text: 'Nicht mehr ausgeben —\nsmarter zahlen.' },
  { id: 'key-transfer',    type: 'key', inTime: 107.5, outTime: 114.0, tag: 'TRANSFER',   text: 'Amex → Lufthansa 1:1\nKeine Punkte verlieren.' },
  { id: 'key-plan',        type: 'key', inTime: 213.2, outTime: 221.0, tag: 'DER PLAN',   text: 'Amex beantragen → 6.000€\nin 3 Mon. → Business Class.' },

  // ── Alert cards — bottom-left, red ────────────────────────────────────────
  { id: 'alert-award',   type: 'alert', inTime: 130.6, outTime: 137.5, badge: 'TIMING',  text: 'Wer wartet, riskiert leere\nAward-Kontingente!' },
  { id: 'alert-verfall', type: 'alert', inTime: 196.8, outTime: 203.0, badge: 'ACHTUNG', text: 'Miles & More verfallen nach\n36 Monaten ohne Aktivität!' },

  // ── Definition card — top-left, teal ──────────────────────────────────────
  { id: 'def-meilen', type: 'definition', inTime: 33.0, outTime: 40.0, term: 'Meilen-Kreditkarte', text: 'Punkte für jeden Euro —\nSupermarkt, Tankstelle, Netflix.' },

  // ── Source cards — bottom-right, green ────────────────────────────────────
  { id: 'src-amex',      type: 'source', inTime: 70.5,  outTime: 76.0,  text: 'American Express — Platinum Startbonus' },
  { id: 'src-lufthansa', type: 'source', inTime: 141.0, outTime: 146.0, text: 'Lufthansa — Business Class Preise 2026' },
  { id: 'src-miles',     type: 'source', inTime: 182.0, outTime: 187.0, text: 'Miles & More — Kreditkarte Infinite' },

  // ── Quote card — bottom-left, purple ──────────────────────────────────────
  { id: 'quote-system', type: 'quote', inTime: 231.9, outTime: 240.0, text: 'Das ist kein Traum — das ist ein System.', attribution: 'Fazit' },
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
