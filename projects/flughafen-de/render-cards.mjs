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
  // MG cards
  {
    id: 'stat-97h',
    type: 'stat',
    inTime: 22, outTime: 31,
    label: 'ø PRO PERSON', value: '97', sub: 'Stunden am Flughafen verschwendet', icon: '⏱️',
  },
  {
    id: 'key-loss-aversion',
    type: 'key',
    inTime: 40, outTime: 50,
    tag: 'PSYCHOLOGIE', text: 'Loss Aversion: Dein Gehirn übertreibt die Gefahr — unbewusst',
  },
  {
    id: 'stat-73pct',
    type: 'stat',
    inTime: 55, outTime: 65,
    label: 'STUDIE ZEIGT', value: '73%', sub: 'aller Reisenden kommen zu früh', icon: '📊',
  },
  {
    id: 'key-sozialer-beweis',
    type: 'key',
    inTime: 80, outTime: 90,
    tag: 'URINSTINKT', text: 'Sozialer Beweis: Du stellst dich an, weil alle anderen es tun',
  },
  {
    id: 'key-reverse-buffer',
    type: 'key',
    inTime: 100, outTime: 110,
    tag: 'METHODE', text: 'Reverse-Buffer-Prinzip — Daten statt Gefühle',
  },

  // Chapter marker cards
  {
    id: 'chap-erschreckende',
    type: 'chapter',
    inTime: 19, outTime: 22,
    text: 'Der erschreckende Beweis',
  },
  {
    id: 'chap-herdentrieb',
    type: 'chapter',
    inTime: 70, outTime: 73,
    text: 'Der Herdentrieb',
  },
  {
    id: 'chap-entkommen',
    type: 'chapter',
    inTime: 95, outTime: 98,
    text: 'So entkommen',
  },
  {
    id: 'chap-loesung',
    type: 'chapter',
    inTime: 115, outTime: 118,
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

function buildHTML(card) {
  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head><body>
      <div class="card" style="width:680px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:16px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:6px">${card.label}</div>
          <div style="font-size:82px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-2px">${card.value}</div>
          <div style="font-size:20px;color:rgba(255,255,255,.7);margin-top:6px">${card.sub}</div>
        </div>
        <div style="font-size:46px;padding:22px 20px 22px 0;display:flex;align-items:flex-start;padding-top:26px">${card.icon}</div>
      </div>
    </body></html>`;
  }

  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head><body>
      <div class="card" style="width:680px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 14px;border-radius:12px;text-transform:uppercase;margin-bottom:12px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.18);margin-bottom:12px"></div>
          <div style="font-size:24px;font-weight:700;color:#FFF;line-height:1.4">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }

  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${baseStyle}</head><body>
      <div class="card" style="width:680px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:13px;font-weight:800;letter-spacing:.12em;padding:5px 14px;border-radius:12px;text-transform:uppercase;margin-bottom:12px">KAPITEL</div>
          <div style="height:1px;background:rgba(255,255,255,.18);margin-bottom:12px"></div>
          <div style="font-size:28px;font-weight:800;color:#FFF;letter-spacing:-.3px;line-height:1.2">${card.text}</div>
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
