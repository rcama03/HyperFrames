/**
 * Renders ANIMATED motion-graphics elements as frame sequences (transparent PNGs).
 * Each card is rendered frame-by-frame so we get true entrance animation,
 * number count-ups, pulses etc. Frames are later assembled into transparent
 * .mov files (qtrle) and overlaid by build-sample.py.
 *
 * Output: sample/anim/<id>/f_####.png  + sample/anim-manifest.json
 * Plus static helper overlays: spotlight.png, glow.png
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

// ── easing ──────────────────────────────────────────────────────────────────
const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeOutBack  = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const clamp01 = x => Math.max(0, Math.min(1, x));

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');`;
const BASE = `
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; background:transparent; overflow:hidden;
    font-family:'Montserrat','Arial Black',sans-serif;
    -webkit-font-smoothing:antialiased; text-rendering:geometricPrecision; }`;

// ── animated elements ─────────────────────────────────────────────────────────
// Each: { id, duration(s), frame(t) -> innerHTML }  rendered at FPS.

const elements = [
  // 1. INTRO TITLE — scale + fade in, subtitle follows
  {
    id: 'intro', duration: 3.0,
    frame(t) {
      const e = easeOutCubic(clamp01(t / 0.7));            // title entrance
      const sub = easeOutCubic(clamp01((t - 0.35) / 0.7)); // subtitle entrance
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

  // 2. CHAPTER LOWER-THIRD — slides in from left
  {
    id: 'chapter', duration: 3.0,
    frame(t) {
      const e = easeOutCubic(clamp01(t / 0.5));
      const x = -440 + 480 * e;
      return `<div style="position:absolute;left:${x}px;top:44px;opacity:${clamp01(t / 0.3)};
        display:flex;align-items:stretch;background:rgba(0,28,58,.6);
        border:1.5px solid rgba(100,180,255,.35);border-radius:12px;overflow:hidden;
        box-shadow:0 6px 24px rgba(0,0,0,.6);width:400px">
        <div style="width:5px;background:#4FC3F7"></div>
        <div style="padding:12px 18px">
          <div style="display:inline-block;background:#4FC3F7;color:#001828;font-size:9px;
            font-weight:800;letter-spacing:.14em;padding:4px 10px;border-radius:8px">KAPITEL 1</div>
          <div style="font-size:22px;font-weight:800;color:#fff;margin-top:8px;line-height:1.15">
            Schock-Hook:<br>Deine Tablette</div>
        </div>
      </div>`;
    },
  },

  // 3. STAT with NUMBER COUNT-UP — slides up + counts 0 -> 1,000,000
  {
    id: 'stat', duration: 4.0,
    frame(t) {
      const e = easeOutCubic(clamp01(t / 0.5));
      const y = 40 * (1 - e);
      const cp = easeOutCubic(clamp01((t - 0.25) / 1.3));
      const val = Math.round(1000000 * cp).toLocaleString('de-DE');
      return `<div style="position:absolute;left:40px;bottom:165px;opacity:${clamp01(t / 0.3)};
        transform:translateY(${y}px);display:flex;align-items:stretch;
        background:rgba(10,10,30,.74);border:1.5px solid rgba(255,255,255,.22);
        border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6);width:440px">
        <div style="width:5px;background:${GOLD}"></div>
        <div style="padding:12px 16px;flex:1">
          <div style="font-size:10px;font-weight:700;letter-spacing:.15em;color:${GOLD};
            text-transform:uppercase;margin-bottom:3px">FANS REISEN AN — WM 2026</div>
          <div style="font-size:46px;font-weight:900;color:#fff;line-height:1;
            letter-spacing:-1px;font-variant-numeric:tabular-nums">${val}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.72);margin-top:4px">
            Über 1 Million Fans · 16 US-Städte</div>
        </div>
        <div style="font-size:30px;padding:16px 14px 0 0">✈️</div>
      </div>`;
    },
  },

  // 4. ALERT — scale-pop entrance (red)
  {
    id: 'alert', duration: 3.0,
    frame(t) {
      const e = easeOutBack(clamp01(t / 0.5));
      const sc = 0.85 + 0.15 * Math.min(1, e);
      return `<div style="position:absolute;left:40px;bottom:165px;opacity:${clamp01(t / 0.25)};
        transform:scale(${sc});transform-origin:left bottom;display:flex;align-items:stretch;
        background:rgba(35,5,5,.76);border:1.5px solid rgba(255,60,60,.4);
        border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.6);width:440px">
        <div style="width:5px;background:#FF3C3C"></div>
        <div style="padding:12px 16px">
          <div style="display:inline-block;background:#FF3C3C;color:#fff;font-size:9px;
            font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px">⚠ ACHTUNG</div>
          <div style="font-size:16px;font-weight:700;color:#fff;margin-top:8px;line-height:1.4">
            Hunderte Fans bei der letzten WM<br>an der Grenze aufgehalten.</div>
        </div>
      </div>`;
    },
  },

  // 5. OUTRO END-CARD — fade+scale in, subscribe pulse, github link
  {
    id: 'outro', duration: 4.5,
    frame(t) {
      const e = easeOutCubic(clamp01(t / 0.6));
      const sc = 0.88 + 0.12 * e;
      const pulse = 1 + 0.05 * Math.sin(t * 6);           // subscribe button pulse
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

// ── static helper overlays (spotlight + glow dot) ─────────────────────────────
const spotlightHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE}</style></head>
  <body><div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,
    rgba(0,0,0,0) 16%, rgba(0,0,0,0.0) 24%, rgba(0,0,0,0.62) 55%)"></div></body></html>`;
const glowHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE}</style></head>
  <body><div style="position:absolute;left:0;top:0;width:60px;height:30px;
    background:radial-gradient(ellipse at left center,rgba(255,210,80,.95) 0%,
    rgba(255,179,0,.5) 40%,rgba(255,179,0,0) 75%)"></div></body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  const manifest = { fps: FPS, elements: [] };

  // Load the page shell ONCE (font fetched once), then swap body.innerHTML per
  // frame via evaluate — ~10x faster than setContent (which refetches the font).
  await page.setContent(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${FONT}${BASE}</style></head><body></body></html>`,
    { waitUntil: 'load' });
  await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });

  for (const el of elements) {
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

  // static overlays
  await page.setContent(spotlightHTML, { waitUntil: 'load' });
  await page.screenshot({ path: join(animDir, 'spotlight.png'), omitBackground: true });
  await page.setContent(glowHTML, { waitUntil: 'load' });
  await page.screenshot({ path: join(animDir, 'glow.png'), omitBackground: true });

  await browser.close();
  writeFileSync(join(__dir, 'anim-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\n✓ anim frames + manifest written');
})().catch(err => { console.error(err); process.exit(1); });
