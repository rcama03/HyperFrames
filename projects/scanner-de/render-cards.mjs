/**
 * Renders motion graphics cards for scanner-de project.
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

const W = 1920, H = 1080;
const GOLD = '#FFD700';

// ── Card type colour palette (locked) ─────────────────────────────────────────
// chapter   : #00E5FF  cyan   / navy bg      — top-left
// stat      : #FFC107  gold   / dark-gold bg — bottom-left
// key       : #FF6D00  orange / dark bg      — bottom-left
// alert     : #FF3C3C  red    / dark-red bg  — bottom-left
// definition: #00BCD4  teal   / dark-teal bg — top-left
// quote     : #9C27B0  purple / dark-purple bg — bottom-left
// source    : #66BB6A  green  / dark-green bg — bottom-right (pill)
// rank      : #FF8F00  amber  / dark-amber bg — bottom-left

// ── Card definitions — timed to timings.json scene boundaries ─────────────────
const cards = [
  // Chapter marker cards — top-left, navy/cyan
  // MG cards — bottom-left, dark gold glass
  // All timings staggered so only ONE card is on screen at a time.
  { id: 'chap-scan',     type: 'chapter', inTime: 0.5,  outTime: 4,    text: 'Der Scan' },
  { id: 'stat-1mrd',     type: 'stat',    inTime: 17,   outTime: 26,   label: 'PRO JAHR',      value: '1,4 Mrd.', sub: 'Passagiere durch europ. Flughäfen', icon: '✈️' },
  { id: 'chap-was',      type: 'chapter', inTime: 31,   outTime: 34,   text: 'Was er speichert' },
  { id: 'key-3d',        type: 'key',     inTime: 35,   outTime: 45,   tag: 'SCANNER',          text: 'Nichts bleibt\nverborgen.' },
  { id: 'key-ki',        type: 'key',     inTime: 55,   outTime: 65,   tag: 'KI-ANALYSE',       text: 'KI liest dich.' },
  { id: 'key-gesicht',   type: 'key',     inTime: 68,   outTime: 79,   tag: 'GESICHTSERKENNUNG',text: 'Erkannt in\n2 Sekunden.' },
  { id: 'chap-lange',    type: 'chapter', inTime: 80,   outTime: 83,   text: 'Wie lange?' },
  { id: 'stat-eu',       type: 'stat',    inTime: 84,   outTime: 91,   label: 'EU SPEICHERT',   value: '5 Jahre',  sub: 'Passagierdaten pro Flug', icon: '🇪🇺' },
  { id: 'stat-usa',      type: 'stat',    inTime: 92,   outTime: 99,   label: 'USA SPEICHERT',  value: '15 Jahre', sub: 'Passagierdaten pro Flug', icon: '🇺🇸' },
  { id: 'chap-rechte',   type: 'chapter', inTime: 117,  outTime: 120,  text: 'Deine Rechte' },
  { id: 'key-recht',     type: 'key',     inTime: 121,  outTime: 132,  tag: 'DEIN RECHT',       text: 'Deine Daten.\nDein Recht.' },
];

// ── Legacy shared styles (stat / key / chapter) — kept for existing cards ─────
const mgStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 60px; bottom: 140px;
      display: flex; align-items: stretch;
      background: rgba(10,10,30,0.50);
      border: 1.5px solid rgba(255,215,0,0.35);
      box-shadow: 0 12px 48px rgba(0,0,0,0.65);
      border-radius: 20px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 7px; background: ${GOLD}; flex-shrink: 0; }
    .inner  { padding: 22px 26px; flex: 1; }
  </style>`;

const chapStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 60px; top: 60px;
      display: flex; align-items: stretch;
      background: rgba(0,8,30,0.50);
      border: 2px solid rgba(0,229,255,0.45);
      box-shadow: 0 12px 48px rgba(0,0,0,0.65);
      border-radius: 20px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 7px; background: #00E5FF; flex-shrink: 0; }
    .inner  { padding: 22px 26px; flex: 1; }
  </style>`;

// ── Shared style builders ─────────────────────────────────────────────────────
function bottomCardStyle(accentColor, bgColor, borderAlpha = 0.5) {
  return `<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
    .card{position:absolute;left:60px;bottom:140px;display:flex;align-items:stretch;
      background:${bgColor};border:2px solid ${accentColor.replace(')', `,${borderAlpha})`).replace('rgb','rgba')};
      box-shadow:0 12px 48px rgba(0,0,0,0.65);border-radius:20px;overflow:hidden;
      font-family:'Montserrat','Arial Black',sans-serif;}
    .stripe{width:7px;background:${accentColor};flex-shrink:0;}
    .inner{padding:22px 28px;flex:1;}
  </style>`;
}

function topCardStyle(accentColor, bgColor, borderAlpha = 0.4) {
  return `<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
    .card{position:absolute;left:60px;top:60px;display:flex;align-items:stretch;
      background:${bgColor};border:2px solid ${accentColor.replace(')', `,${borderAlpha})`).replace('rgb','rgba')};
      box-shadow:0 12px 48px rgba(0,0,0,0.65);border-radius:20px;overflow:hidden;
      font-family:'Montserrat','Arial Black',sans-serif;}
    .stripe{width:7px;background:${accentColor};flex-shrink:0;}
    .inner{padding:22px 28px;flex:1;}
  </style>`;
}

function badge(color, textColor, label) {
  return `<div style="display:inline-block;background:${color};color:${textColor};font-size:16px;font-weight:800;letter-spacing:.12em;padding:7px 16px;border-radius:12px;text-transform:uppercase;margin-bottom:14px">${label}</div>`;
}
function divider(color) {
  return `<div style="height:1px;background:${color};margin-bottom:14px"></div>`;
}

function buildHTML(card) {
  // ── ALERT ──────────────────────────────────────────────────────────────────
  if (card.type === 'alert') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    ${bottomCardStyle('#FF3C3C','rgba(35,5,5,0.50)')}
    </head><body>
      <div class="card" style="width:840px">
        <div class="stripe"></div>
        <div class="inner">
          ${badge('#FF3C3C','#fff','⚠ ACHTUNG')}
          ${divider('rgba(255,60,60,.3)')}
          <div style="font-size:30px;font-weight:700;color:#FFF;line-height:1.45">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }

  // ── DEFINITION ─────────────────────────────────────────────────────────────
  if (card.type === 'definition') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    ${topCardStyle('#00BCD4','rgba(0,18,28,0.50)')}
    </head><body>
      <div class="card" style="width:825px">
        <div class="stripe"></div>
        <div class="inner">
          ${badge('#00BCD4','#001820','DEFINITION')}
          ${divider('rgba(0,188,212,.25)')}
          <div style="font-size:33px;font-weight:800;color:#FFF;margin-bottom:10px">${card.term}</div>
          <div style="font-size:24px;color:rgba(255,255,255,.82);line-height:1.5">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }

  // ── QUOTE ──────────────────────────────────────────────────────────────────
  if (card.type === 'quote') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    ${bottomCardStyle('#9C27B0','rgba(15,5,30,0.50)', 0.45)}
    </head><body>
      <div class="card" style="width:870px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:51px;color:#9C27B0;line-height:1;margin-bottom:8px;opacity:0.9">"</div>
          <div style="font-size:26px;font-weight:700;color:#FFF;line-height:1.55;font-style:italic">${card.text}</div>
          <div style="font-size:20px;color:#CE93D8;margin-top:14px;letter-spacing:.05em">— ${card.attribution}</div>
        </div>
      </div>
    </body></html>`;
  }

  // ── SOURCE ─────────────────────────────────────────────────────────────────
  if (card.type === 'source') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;}
      html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
      .card{position:absolute;right:60px;bottom:140px;display:flex;align-items:center;gap:14px;
        background:rgba(5,20,10,0.50);border:1.5px solid rgba(76,175,80,0.35);
        box-shadow:0 6px 24px rgba(0,0,0,0.5);border-radius:12px;padding:14px 24px;
        font-family:'Montserrat','Arial Black',sans-serif;}
    </style>
    </head><body>
      <div class="card">
        <div style="font-size:16px;font-weight:700;color:#66BB6A;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
        <div style="font-size:20px;color:rgba(255,255,255,.88);font-weight:600;white-space:nowrap">${card.text}</div>
      </div>
    </body></html>`;
  }

  // ── RANK ───────────────────────────────────────────────────────────────────
  if (card.type === 'rank') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap');
      *{margin:0;padding:0;box-sizing:border-box;}
      html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
      .card{position:absolute;left:60px;bottom:140px;display:flex;align-items:stretch;
        background:rgba(20,14,0,0.50);border:2px solid rgba(255,143,0,0.5);
        box-shadow:0 12px 48px rgba(0,0,0,0.65);border-radius:20px;overflow:hidden;
        font-family:'Montserrat','Arial Black',sans-serif;}
      .rank-block{display:flex;align-items:center;justify-content:center;
        background:linear-gradient(135deg,#FF8F00,#E65100);width:126px;flex-shrink:0;}
      .inner{padding:22px 28px;width:510px;}
    </style>
    </head><body>
      <div class="card">
        <div class="rank-block">
          <div style="font-size:75px;font-weight:900;color:#fff3e0;line-height:1">#${card.rank}</div>
        </div>
        <div class="inner">
          <div style="font-size:16px;font-weight:800;color:#FF8F00;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px">${card.label}</div>
          <div style="height:1px;background:rgba(255,143,0,.25);margin-bottom:14px"></div>
          <div style="font-size:28px;font-weight:800;color:#FFF;line-height:1.4">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }

  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:680px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:16px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:6px">${card.label}</div>
          <div style="font-size:72px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-2px">${card.value}</div>
          <div style="font-size:18px;color:rgba(255,255,255,.7);margin-top:6px">${card.sub}</div>
        </div>
        <div style="font-size:44px;padding:22px 20px 22px 0;display:flex;align-items:flex-start;padding-top:26px">${card.icon}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:680px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 14px;border-radius:12px;text-transform:uppercase;margin-bottom:12px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.18);margin-bottom:12px"></div>
          <div style="font-size:22px;font-weight:700;color:#FFF;line-height:1.4">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${chapStyle}</head><body>
      <div class="card" style="width:620px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:#00E5FF;color:#000d1a;font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 14px;border-radius:12px;text-transform:uppercase;margin-bottom:12px">KAPITEL</div>
          <div style="height:1px;background:rgba(0,229,255,.25);margin-bottom:12px"></div>
          <div style="font-size:28px;font-weight:800;color:#FFF;letter-spacing:-.3px;line-height:1.2">${card.text}</div>
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
  console.log(`\nManifest: ${manifest.cards.length} cards`);
})();
