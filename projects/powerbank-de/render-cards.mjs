/**
 * Renders each motion card and the intro strip as PNG frames using Playwright,
 * then outputs a manifest for ffmpeg composite assembly.
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

// Card definitions: id, type, inTime, outTime, extra content for rendering
const cards = [
  { id: 'stat-2mio',    inTime: 2,   outTime: 12,  label: 'PASSAGIERE', value: '2 Mio.', sub: 'jährlich aufgehalten', icon: '✈️', type: 'stat' },
  { id: 'key-powerbank',inTime: 16,  outTime: 27,  tag: 'WICHTIG',  text: 'Powerbank kann deinen Flug ruinieren', type: 'key' },
  { id: 'stat-100wh',   inTime: 34,  outTime: 44,  label: 'IATA LIMIT', value: '100', sub: 'Wh pro Powerbank', icon: '⚡', type: 'stat' },
  { id: 'key-noexcept', inTime: 50,  outTime: 63,  tag: 'REGELUNG', text: 'Keine Ausnahmen. Kein Ermessen.', type: 'key' },
  { id: 'key-danger',   inTime: 69,  outTime: 80,  tag: 'GEFAHR',   text: 'Lithium-Ionen-Akkus können im Flug in Flammen aufgehen', type: 'danger' },
  { id: 'comp-zone',    inTime: 85,  outTime: 99,  type: 'zonebar' },
  { id: 'key-formula',  inTime: 104, outTime: 112, tag: 'FORMEL',   text: 'mAh × Volt ÷ 1000 = Wh', type: 'key' },
  { id: 'stat-74wh',    inTime: 113, outTime: 120, label: '20.000 mAh = SICHER', value: '74', sub: 'Wattstunden', icon: '✅', type: 'stat' },
  { id: 'quote-120',    inTime: 122, outTime: 136, type: 'quote',
    text: '120 € Powerbank konfisziert – Flug verpasst – Entschädigung: null',
    source: '— Frankfurt, echter Fall' },
  { id: 'stat-800k',    inTime: 141, outTime: 154, label: 'EUROPA / JAHR', value: '800.000', sub: 'Elektronikgeräte beschlagnahmt', icon: '📦', type: 'stat' },
  { id: 'key-tip',      inTime: 159, outTime: 170, tag: 'TIPP',     text: 'Nur Powerbanks <20.000 mAh kaufen', type: 'key' },
  { id: 'stat-5keur',   inTime: 176, outTime: 190, label: 'MAX. STRAFE', value: '5.000', sub: 'Euro bei Verstoß', icon: '⚠️', type: 'stat' },
  { id: 'fazit',        inTime: 197, outTime: 212, type: 'fazit' },
];

const introStrip = { id: 'intro-strip', inTime: 0.3, outTime: 7.9 };

function buildCardHTML(card) {
  const GOLD = '#FFD700';
  const base = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
      .card {
        position: absolute;
        left: 40px; bottom: 100px;
        display: flex; align-items: stretch;
        background: rgba(255,255,255,0.09);
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 8px 32px rgba(0,0,0,0.45);
        border-radius: 16px;
        overflow: hidden;
        font-family: 'Montserrat', 'Arial Black', sans-serif;
      }
      .stripe { width:4px; background:${GOLD}; flex-shrink:0; }
      .inner { padding:16px 18px; flex:1; }
    </style>`;

  if (card.type === 'stat') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${base}</head><body>
      <div class="card" style="width:420px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:11px;font-weight:700;letter-spacing:.15em;color:${GOLD};opacity:.85;text-transform:uppercase;margin-bottom:4px">${card.label}</div>
          <div style="font-size:52px;font-weight:800;color:#FFF;line-height:1;letter-spacing:-1px">${card.value}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.65);margin-top:4px">${card.sub}</div>
        </div>
        <div style="font-size:28px;padding:16px 14px 16px 0;display:flex;align-items:flex-start;padding-top:18px">${card.icon}</div>
      </div>
    </body></html>`;
  }
  if (card.type === 'key') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${base}</head><body>
      <div class="card" style="width:420px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:10px;font-weight:800;letter-spacing:.12em;padding:3px 10px;border-radius:10px;text-transform:uppercase;margin-bottom:8px">${card.tag}</div>
          <div style="height:1px;background:rgba(255,255,255,.15);margin-bottom:8px"></div>
          <div style="font-size:17px;font-weight:700;color:#FFF;line-height:1.35">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }
  if (card.type === 'quote') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${base}</head><body>
      <div class="card" style="width:460px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="font-size:48px;font-weight:800;color:${GOLD};line-height:.8;margin-bottom:4px">"</div>
          <div style="font-size:14px;font-style:italic;color:#FFF;line-height:1.4;font-weight:500;margin-bottom:8px">${card.text}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.5)">${card.source}</div>
        </div>
      </div>
    </body></html>`;
  }
  // Effect 4: DANGER card — red accent + red glow border
  if (card.type === 'danger') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${base}</head><body>
      <div class="card" style="width:440px;border:1px solid rgba(255,59,48,0.55);box-shadow:0 0 24px rgba(255,59,48,0.35),0 8px 32px rgba(0,0,0,0.5);">
        <div class="stripe" style="background:#FF3B30"></div>
        <div class="inner">
          <div style="display:inline-block;background:#FF3B30;color:#fff;font-size:10px;font-weight:800;letter-spacing:.12em;padding:3px 10px;border-radius:10px;text-transform:uppercase;margin-bottom:8px">⚠ GEFAHR</div>
          <div style="height:1px;background:rgba(255,59,48,.3);margin-bottom:8px"></div>
          <div style="font-size:17px;font-weight:700;color:#FFF;line-height:1.35">${card.text}</div>
        </div>
      </div>
    </body></html>`;
  }

  // Effect 5: Wh zone bar — horizontal colour-coded fill bars
  if (card.type === 'zonebar') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${base}</head><body>
      <div class="card" style="width:500px">
        <div class="stripe"></div>
        <div class="inner" style="padding:14px 18px">
          <div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:${GOLD};text-transform:uppercase;margin-bottom:10px">WH-ZONEN – DEINE POWERBANK</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:11px;font-weight:700;color:#34C759">✔ ERLAUBT</span>
                <span style="font-size:11px;font-weight:800;color:#FFF">&lt; 100 Wh</span>
              </div>
              <div style="height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden">
                <div style="width:50%;height:100%;background:#34C759;border-radius:5px"></div>
              </div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:11px;font-weight:700;color:${GOLD}">⚡ GRAUZONE</span>
                <span style="font-size:11px;font-weight:800;color:#FFF">100 – 160 Wh</span>
              </div>
              <div style="height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden">
                <div style="width:75%;height:100%;background:${GOLD};border-radius:5px"></div>
              </div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:11px;font-weight:700;color:#FF3B30">✖ VERBOTEN</span>
                <span style="font-size:11px;font-weight:800;color:#FFF">&gt; 160 Wh</span>
              </div>
              <div style="height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden">
                <div style="width:100%;height:100%;background:#FF3B30;border-radius:5px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body></html>`;
  }

  // Effect 6: Fazit summary card — 3 takeaways with gold checkmarks
  if (card.type === 'fazit') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${base}</head><body>
      <div class="card" style="width:460px">
        <div class="stripe"></div>
        <div class="inner">
          <div style="display:inline-block;background:${GOLD};color:#0D0D1A;font-size:10px;font-weight:800;letter-spacing:.12em;padding:3px 10px;border-radius:10px;text-transform:uppercase;margin-bottom:10px">FAZIT</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:flex-start;gap:8px">
              <span style="color:${GOLD};font-size:14px;font-weight:800;flex-shrink:0;margin-top:1px">✓</span>
              <span style="font-size:14px;font-weight:700;color:#FFF;line-height:1.3">Powerbanks &gt;100 Wh? Immer vorher fragen</span>
            </div>
            <div style="display:flex;align-items:flex-start;gap:8px">
              <span style="color:${GOLD};font-size:14px;font-weight:800;flex-shrink:0;margin-top:1px">✓</span>
              <span style="font-size:14px;font-weight:700;color:#FFF;line-height:1.3">Nur Powerbanks &lt;20.000 mAh kaufen</span>
            </div>
            <div style="display:flex;align-items:flex-start;gap:8px">
              <span style="color:${GOLD};font-size:14px;font-weight:800;flex-shrink:0;margin-top:1px">✓</span>
              <span style="font-size:14px;font-weight:700;color:#FFF;line-height:1.3">Powerbank immer ins Handgepäck</span>
            </div>
          </div>
        </div>
      </div>
    </body></html>`;
  }

  if (card.type === 'comp') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${base}</head><body>
      <div class="card" style="width:480px">
        <div class="stripe"></div>
        <div style="display:flex;align-items:center;gap:8px;padding:14px 16px;flex:1">
          <div style="flex:1;text-align:center">
            <div style="font-size:10px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.55);text-transform:uppercase;margin-bottom:4px">ERLAUBT</div>
            <div style="font-size:22px;font-weight:800;color:#FFF">&lt;100 Wh</div>
          </div>
          <div style="font-size:20px;color:${GOLD};font-weight:700;flex-shrink:0">→</div>
          <div style="flex:1;text-align:center">
            <div style="font-size:10px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.55);text-transform:uppercase;margin-bottom:4px">GRAUZONE</div>
            <div style="font-size:20px;font-weight:800;color:${GOLD}">100–160 Wh</div>
          </div>
          <div style="font-size:20px;color:${GOLD};font-weight:700;flex-shrink:0">→</div>
          <div style="flex:1;text-align:center">
            <div style="font-size:10px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.55);text-transform:uppercase;margin-bottom:4px">VERBOTEN</div>
            <div style="font-size:22px;font-weight:800;color:#FFF">&gt;160 Wh</div>
          </div>
        </div>
      </div>
    </body></html>`;
  }
}

function buildIntroHTML() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:${W}px; height:${H}px; background:transparent; overflow:hidden; }
      .strip {
        position:absolute; bottom:180px; left:0; right:0; height:56px;
        background:rgba(10,10,26,.82);
        border-top:2px solid #FFD700;
        border-bottom:1px solid rgba(255,215,0,.3);
        display:flex; align-items:center;
      }
      .inner { display:flex; align-items:center; gap:16px; padding:0 32px; width:100%; }
      .icon { font-size:22px; color:#FFD700; }
      .title { font-family:'Montserrat',sans-serif; font-size:18px; font-weight:800; color:#FFD700; letter-spacing:.12em; }
      .div  { width:1px; height:28px; background:rgba(255,215,0,.4); flex-shrink:0; }
      .sub  { font-family:'Montserrat',sans-serif; font-size:14px; font-weight:700; color:rgba(255,255,255,.85); letter-spacing:.06em; text-transform:uppercase; }
    </style>
  </head><body>
    <div class="strip">
      <div class="inner">
        <div class="left" style="display:flex;align-items:center;gap:10px;flex-shrink:0">
          <span class="icon">✈</span>
          <span class="title">REISE-WISSEN</span>
        </div>
        <div class="div"></div>
        <div class="sub">HANDGEPÄCK &amp; POWERBANK REGELN</div>
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

  const manifest = { cards: [], intro: null };

  // Render intro strip
  console.log('Rendering intro strip...');
  await page.setContent(buildIntroHTML(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const introPath = join(outDir, 'intro-strip.png');
  await page.screenshot({ path: introPath, omitBackground: true });
  manifest.intro = { path: introPath, inTime: introStrip.inTime, outTime: introStrip.outTime };
  console.log('  ✓ intro-strip.png');

  // Render each card
  for (const card of cards) {
    const html = buildCardHTML(card);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const pngPath = join(outDir, `${card.id}.png`);
    await page.screenshot({ path: pngPath, omitBackground: true });
    manifest.cards.push({ id: card.id, path: pngPath, inTime: card.inTime, outTime: card.outTime });
    console.log(`  ✓ ${card.id}.png`);
  }

  await browser.close();

  const manifestPath = join(__dir, 'card-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written: ${manifestPath}`);
  console.log(`Total PNGs: ${manifest.cards.length + 1}`);
})();
