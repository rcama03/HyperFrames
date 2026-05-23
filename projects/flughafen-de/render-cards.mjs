/**
 * Renders motion graphics cards and chapter marker cards as PNGs.
 * Output: card-frames/*.png + card-manifest.json (paths relative to project root)
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

// ── Card definitions ──────────────────────────────────────────────────────────
const cards = [
  // MG cards — key stats and concepts from the script
  {
    id: 'stat-97h',
    type: 'stat',
    inTime: 9, outTime: 18,
    label: 'ø PRO PERSON', value: '97', sub: 'Stunden am Flughafen verschwendet', icon: '⏱️',
  },
  {
    id: 'key-loss-aversion',
    type: 'key',
    inTime: 27, outTime: 37,
    tag: 'PSYCHOLOGIE', text: 'Loss Aversion: Dein Gehirn übertreibt die Gefahr — unbewusst',
  },
  {
    id: 'stat-73pct',
    type: 'stat',
    inTime: 40, outTime: 50,
    label: 'STUDIE ZEIGT', value: '73%', sub: 'aller Reisenden kommen zu früh', icon: '📊',
  },
  {
    id: 'key-sozialer-beweis',
    type: 'key',
    inTime: 67, outTime: 77,
    tag: 'URINSTINKT', text: 'Sozialer Beweis: Du stellst dich an, weil alle anderen es tun',
  },
  {
    id: 'key-reverse-buffer',
    type: 'key',
    inTime: 84, outTime: 94,
    tag: 'METHODE', text: 'Reverse-Buffer-Prinzip — Daten statt Gefühle',
  },

  // Chapter marker cards — first 2 words of each chapter title
  {
    id: 'chap-erschreckende',
    type: 'chapter',
    inTime: 5.5, outTime: 8.5,
    text: 'Der erschreckende',
  },
  {
    id: 'chap-herdentrieb',
    type: 'chapter',
    inTime: 100, outTime: 103,
    text: 'Der Herdentrieb',
  },
  {
    id: 'chap-entkommen',
    type: 'chapter',
    inTime: 112, outTime: 115,
    text: 'So entkommen',
  },
  {
    id: 'chap-loesung',
    type: 'chapter',
    inTime: 122, outTime: 125,
    text: 'Die Lösung',
  },
];

// ── Card HTML builders ────────────────────────────────────────────────────────
const baseStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 48px; bottom: 120px;
      display: flex; align-items: stretch;
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
      border-radius: 16px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 4px; background: ${GOLD}; flex-shrink: 0; }
    .inner  { padding: 16px 18px; flex: 1; }
  </style>`;

function buildHTML(card) {
  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head><body>
      <div class="card" style="width:460px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:11px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.85;text-transform:uppercase;margin-bottom:4px">${card.label}</div>
          <div style="font-size:56px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-1px">${card.value}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.65);margin-top:4px">${card.sub}</div>
        </div>
        <div style="font-size:30px;padding:16px 14px 16px 0;display:flex;align-items:flex-start;padding-top:20px">${card.icon}</div>
      </div>
    </body></html>`;
  }

  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head><body>
      <div class="card" style="width:460px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:10px;font-weight:800;letter-spacing:.12em;padding:3px 10px;border-radius:10px;text-transform:uppercase;margin-bottom:8px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.15);margin-bottom:8px"></div>
          <div style="font-size:17px;font-weight:700;color:#FFF;line-height:1.35">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }

  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head><body>
      <div class="card" style="width:380px">
        <div class="stripe" style="background:rgba(255,215,0,0.5)"></div>
        <div class="inner">
          <div style="font-size:9px;font-weight:800;letter-spacing:.2em;color:rgba(255,215,0,.6);text-transform:uppercase;margin-bottom:6px">KAPITEL</div>
          <div style="font-size:22px;font-weight:800;color:#FFF;letter-spacing:-.3px">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
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
    manifest.cards.push({
      id:      card.id,
      path:    `card-frames/${card.id}.png`,
      inTime:  card.inTime,
      outTime: card.outTime,
    });
    console.log(`  ✓ ${card.id}.png`);
  }

  await browser.close();

  const manifestPath = join(__dir, 'card-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${manifest.cards.length} cards → ${manifestPath}`);
})();
