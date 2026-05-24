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

// ── Card definitions — timed to timings.json scene boundaries ─────────────────
const cards = [
  // Chapter marker cards — top-left, navy/cyan
  // MG cards — bottom-left, dark gold glass
  // All timings staggered so only ONE card is on screen at a time.
  { id: 'chap-scan',     type: 'chapter', inTime: 0.5,  outTime: 4,    text: 'Der Scan' },
  { id: 'stat-1mrd',     type: 'stat',    inTime: 17,   outTime: 26,   label: 'PRO JAHR',      value: '1,4 Mrd.', sub: 'Passagiere durch europ. Flughäfen', icon: '✈️' },
  { id: 'chap-was',      type: 'chapter', inTime: 31,   outTime: 34,   text: 'Was er speichert' },
  { id: 'key-3d',        type: 'key',     inTime: 35,   outTime: 45,   tag: 'SCANNER',          text: 'Komplettes 3D-Bild: jede Kurve, jede Narbe — sichtbar' },
  { id: 'key-ki',        type: 'key',     inTime: 55,   outTime: 65,   tag: 'KI-ANALYSE',       text: 'Gangmuster & Körperhaltung — KI sagt dein Verhalten vorher' },
  { id: 'key-gesicht',   type: 'key',     inTime: 68,   outTime: 79,   tag: 'GESICHTSERKENNUNG',text: 'Datenbankabgleich still — in unter 2 Sekunden' },
  { id: 'chap-lange',    type: 'chapter', inTime: 80,   outTime: 83,   text: 'Wie lange?' },
  { id: 'stat-eu',       type: 'stat',    inTime: 84,   outTime: 91,   label: 'EU SPEICHERT',   value: '5 Jahre',  sub: 'Passagierdaten pro Flug', icon: '🇪🇺' },
  { id: 'stat-usa',      type: 'stat',    inTime: 92,   outTime: 99,   label: 'USA SPEICHERT',  value: '15 Jahre', sub: 'Passagierdaten pro Flug', icon: '🇺🇸' },
  { id: 'chap-rechte',   type: 'chapter', inTime: 117,  outTime: 120,  text: 'Deine Rechte' },
  { id: 'key-recht',     type: 'key',     inTime: 121,  outTime: 132,  tag: 'DEIN RECHT',       text: 'EU: Du kannst gespeicherte Daten anfragen & löschen lassen' },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const mgStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 60px; bottom: 140px;
      display: flex; align-items: stretch;
      background: rgba(10,10,30,0.72);
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 12px 48px rgba(0,0,0,0.65);
      border-radius: 20px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 6px; background: ${GOLD}; flex-shrink: 0; }
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
      background: rgba(0,28,58,0.52);
      border: 1.5px solid rgba(100,180,255,0.32);
      box-shadow: 0 12px 48px rgba(0,0,0,0.65);
      border-radius: 20px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 6px; background: #4FC3F7; flex-shrink: 0; }
    .inner  { padding: 22px 26px; flex: 1; }
  </style>`;

function buildHTML(card) {
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
          <div style="display:inline-block;background:#4FC3F7;color:#001828;font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 14px;border-radius:12px;text-transform:uppercase;margin-bottom:12px">KAPITEL</div>
          <div style="height:1px;background:rgba(100,180,255,.25);margin-bottom:12px"></div>
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
