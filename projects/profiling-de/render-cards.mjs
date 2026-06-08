/**
 * Renders motion graphics cards for profiling-de project.
 * Output: card-frames/*.png + card-manifest.json
 *
 * Video: 1280×720, voiceover 676.68s (timings scaled ×0.97452)
 * Chapter timestamps (user-specified video time):
 *   0:00  → 0.5s   "7-Sekunden-Urteil"
 *   1:35  → 95.5s  "Signal Nr. 1"
 *   2:56  → 176.5s "Wirklich Auffällt —"
 *   4:19  → 259.5s "Mythos: Ethnisches Profiling"
 *   5:37  → 337.5s "Mikroausdrücke — Das"
 *   7:09  → 429.5s "Last-Minute-Tickets Und"
 *   8:43  → 523.5s "No-Fly-List — Das"
 *   10:03 → 603.5s "Ist Das System"
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
  // ── Chapter cards — top-left navy/cyan ──────────────────────────────────────
  { id: 'chap-urteil',    type: 'chapter', inTime: 0.5,   outTime: 5.5,   text: '7-Sekunden-\nUrteil' },
  { id: 'chap-signal1',   type: 'chapter', inTime: 95.5,  outTime: 100.5, text: 'Signal Nr. 1' },
  { id: 'chap-auffaellt', type: 'chapter', inTime: 176.5, outTime: 181.5, text: 'Wirklich\nAuffällt —' },
  { id: 'chap-mythos',    type: 'chapter', inTime: 259.5, outTime: 264.5, text: 'Mythos: Ethnisches\nProfiling' },
  { id: 'chap-mikro',     type: 'chapter', inTime: 337.5, outTime: 342.5, text: 'Mikroausdrücke —\nDas' },
  { id: 'chap-lastmin',   type: 'chapter', inTime: 429.5, outTime: 434.5, text: 'Last-Minute-\nTickets Und' },
  { id: 'chap-nofly',     type: 'chapter', inTime: 523.5, outTime: 528.5, text: 'No-Fly-List —\nDas' },
  { id: 'chap-system',    type: 'chapter', inTime: 603.5, outTime: 608.5, text: 'Ist Das\nSystem' },

  // ── Stat cards — bottom-left gold stripe, big number ────────────────────────
  { id: 'stat-7sek',      type: 'stat', inTime: 7.0,   outTime: 12.0,  label: '7 SEKUNDEN',       value: '7 Sek.',    sub: 'Profiler entscheidet bereits über dein Risikoprofil',      icon: '👁️' },
  { id: 'stat-200',       type: 'stat', inTime: 27.0,  outTime: 32.0,  label: 'BDO TRAINING',     value: '200+',      sub: 'Mikroverhaltensweisen — viele davon unbewusst',             icon: '🔍' },
  { id: 'stat-900mio',    type: 'stat', inTime: 74.0,  outTime: 79.0,  label: 'SPOT KOSTEN',      value: '900 Mio. $', sub: 'TSA-Jahresausgaben für das Verhaltens-Screening-Programm', icon: '💰' },
  { id: 'stat-61000',     type: 'stat', inTime: 237.0, outTime: 242.0, label: 'SPOT 2008–2012',   value: '61.000',    sub: 'Passagiere markiert — nur 0,6 % festgenommen',              icon: '📊' },
  { id: 'stat-2sek',      type: 'stat', inTime: 355.0, outTime: 360.0, label: 'REAKTIONSZEIT',    value: '< 2 Sek.', sub: 'Ehrliche Antwort — wer länger braucht, sucht die Lüge',      icon: '⏱️' },
  { id: 'stat-40pct',     type: 'stat', inTime: 490.0, outTime: 495.0, label: 'LAST-MINUTE BAR',  value: '40 %+',    sub: 'solcher Tickets werden für manuelle Kontrolle markiert',      icon: '🎫' },
  { id: 'stat-1000namen', type: 'stat', inTime: 533.0, outTime: 538.0, label: 'NO-FLY-LIST',      value: '1.000+',   sub: 'Namen — viele nie einer Straftat beschuldigt',               icon: '🚫' },

  // ── Key cards — bottom-left gold badge + punchy heading ─────────────────────
  { id: 'key-koerper',     type: 'key', inTime: 112.0, outTime: 117.0, tag: 'KEIN LÜGEN',    text: 'Dein Körper\nlügt nicht.' },
  { id: 'key-risiko',      type: 'key', inTime: 170.0, outTime: 175.0, tag: 'UNSICHTBAR',    text: 'Markiert.\nOhne es zu wissen.' },
  { id: 'key-smalltalk',   type: 'key', inTime: 199.0, outTime: 204.0, tag: 'VERHÖR',        text: 'Small Talk =\nStrukturiertes Verhör.' },
  { id: 'key-inkonsistenz',type: 'key', inTime: 272.0, outTime: 277.0, tag: 'WARNSIGNAL',    text: 'Inkonsistenz.\nGrößtes Alarmsignal.' },
  { id: 'key-paradox',     type: 'key', inTime: 447.0, outTime: 452.0, tag: 'PARADOX',       text: 'Unschuldige zeigen\nmehr Stress.' },
  { id: 'key-tipp',        type: 'key', inTime: 617.0, outTime: 622.0, tag: 'TIPP',          text: 'Ruhig. Konsistent.\nBleib du selbst.' },
];

const mgStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; bottom: 95px;
      display: flex; align-items: stretch;
      background: rgba(10,10,30,0.72);
      border: 1.5px solid rgba(255,255,255,0.22);
      box-shadow: 0 8px 32px rgba(0,0,0,0.65);
      border-radius: 14px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 4px; background: ${GOLD}; flex-shrink: 0; }
    .inner  { padding: 14px 18px; flex: 1; }
  </style>`;

const chapStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
    .card {
      position: absolute; left: 40px; top: 40px;
      display: flex; align-items: stretch;
      background: rgba(0,28,58,0.52);
      border: 1.5px solid rgba(100,180,255,0.32);
      box-shadow: 0 8px 32px rgba(0,0,0,0.65);
      border-radius: 14px; overflow: hidden;
      font-family: 'Montserrat', 'Arial Black', sans-serif;
    }
    .stripe { width: 4px; background: #4FC3F7; flex-shrink: 0; }
    .inner  { padding: 14px 18px; flex: 1; }
  </style>`;

function buildHTML(card) {
  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:455px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:11px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.9;text-transform:uppercase;margin-bottom:4px">${card.label}</div>
          <div style="font-size:48px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-1px">${card.value}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:4px">${card.sub}</div>
        </div>
        <div style="font-size:30px;padding:14px 14px 14px 0;display:flex;align-items:flex-start;padding-top:18px">${card.icon}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${mgStyle}</head><body>
      <div class="card" style="width:455px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:9px;font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px;text-transform:uppercase;margin-bottom:8px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.18);margin-bottom:8px"></div>
          <div style="font-size:15px;font-weight:700;color:#FFF;line-height:1.4;white-space:pre-line">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'chapter') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${chapStyle}</head><body>
      <div class="card" style="width:415px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:#4FC3F7;color:#001828;font-size:9px;font-weight:800;letter-spacing:.12em;padding:4px 10px;border-radius:8px;text-transform:uppercase;margin-bottom:8px">KAPITEL</div>
          <div style="height:1px;background:rgba(100,180,255,.25);margin-bottom:8px"></div>
          <div style="font-size:19px;font-weight:800;color:#FFF;letter-spacing:-.2px;line-height:1.2;white-space:pre-line">${card.text}</div>
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
  console.log(`\nManifest: ${manifest.cards.length} cards → card-manifest.json`);
})();
