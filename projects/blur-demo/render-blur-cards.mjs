/**
 * render-blur-cards.mjs — blur-demo
 * Renders each stat card at 3 blur levels: sharp, blur6, blur16
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

const cards = [
  { id: 'c1', value: '33 Mrd. $',  sub: 'allein durch Gepäckgebühren' },
  { id: 'c2', value: '+400%',      sub: 'Ryanair & Easyjet seit 2010' },
  { id: 'c3', value: '300%',       sub: 'DVT-Risiko steigt auf Langstrecke' },
  { id: 'c4', value: '−90%',       sub: 'DVT-Reduktion mit Kompressionsstrümpfen' },
  { id: 'c5', value: '7,8 Mrd. $', sub: 'Gepäckgebühren nur in den USA' },
  { id: 'c6', value: '68%',        sub: 'Passagiere zahlen mehr als nötig' },
  { id: 'c7', value: '90 Min.',    sub: 'bis DVT-Risikostart beim Sitzen' },
  { id: 'c8', value: '6 $',        sub: 'Nettoprofit pro Ticket für Airlines' },
];

const BLUR_LEVELS = [
  { suffix: 'sharp', px: 0  },
  { suffix: 'blur6', px: 6  },
  { suffix: 'blur16', px: 16 },
];

function buildHTML(card, blurPx) {
  const filterStyle = blurPx > 0 ? `filter:blur(${blurPx}px);` : '';
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
  .wrap {
    width:${W}px; height:${H}px;
    display:flex; align-items:center; justify-content:center;
    ${filterStyle}
  }
  .content {
    text-align:center;
    background: radial-gradient(ellipse 860px 320px at center, rgba(0,0,0,0.72) 0%, transparent 100%);
    padding: 64px 120px;
  }
  .value {
    font-family:'Montserrat','Arial Black',sans-serif;
    font-size:104px; font-weight:900;
    color:#FFD700; line-height:1; letter-spacing:-2px;
  }
  .divider { width:72px; height:3px; background:#FFD700; margin:18px auto; opacity:0.85; }
  .sub {
    font-family:'Montserrat','Arial Black',sans-serif;
    font-size:28px; font-weight:700;
    color:rgba(255,255,255,0.90); letter-spacing:0.02em;
  }
</style>
</head><body>
  <div class="wrap">
    <div class="content">
      <div class="value">${card.value}</div>
      <div class="divider"></div>
      <div class="sub">${card.sub}</div>
    </div>
  </div>
</body></html>`;
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
    for (const blur of BLUR_LEVELS) {
      await page.setContent(buildHTML(card, blur.px), { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      const pngPath = join(outDir, `${card.id}-${blur.suffix}.png`);
      await page.screenshot({ path: pngPath, omitBackground: true });
      console.log(`  ✓ ${card.id}-${blur.suffix}.png`);
    }
    manifest.cards.push({ id: card.id, value: card.value, sub: card.sub });
  }
  await browser.close();
  writeFileSync(join(__dir, 'card-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone: ${cards.length} cards × 3 blur levels = ${cards.length * 3} PNGs`);
})();
