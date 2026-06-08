/**
 * render-cards.mjs — checkin-de
 * "9 Check-in-Fehler die dir deinen Flug SOFORT kosten können"
 * Resolution: 1280×720
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

// ── Locked colour palette ─────────────────────────────────────────────────────
// chapter    #00E5FF cyan   top-left    entry: left
// stat       #FFC107 gold   btm-left    entry: right
// key        #FF6D00 orange btm-left    entry: bottom
// alert      #FF3C3C red    btm-left    entry: right
// definition #00BCD4 teal   top-left    entry: top
// quote      #9C27B0 purple btm-left    entry: bottom
// source     #66BB6A green  btm-right   entry: left
// rank       #FF8F00 amber  btm-left    entry: right

const BOTTOM = '165px';
const TOP    = '40px';

// ── Style helpers ─────────────────────────────────────────────────────────────
const base = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;}`;

function btmCard(accent, bg, border, w) {
  return `<style>${base}
  .card{position:absolute;left:40px;bottom:${BOTTOM};display:flex;align-items:stretch;width:${w}px;
    background:${bg};border:1.5px solid ${border};
    box-shadow:0 8px 32px rgba(0,0,0,.65);border-radius:14px;overflow:hidden;
    font-family:'Montserrat','Arial Black',sans-serif;}
  .stripe{width:5px;background:${accent};flex-shrink:0;}
  .inner{padding:16px 22px;flex:1;}
  </style>`;
}

function topCard(accent, bg, border, w) {
  return `<style>${base}
  .card{position:absolute;left:40px;top:${TOP};display:flex;align-items:stretch;width:${w}px;
    background:${bg};border:1.5px solid ${border};
    box-shadow:0 8px 32px rgba(0,0,0,.65);border-radius:14px;overflow:hidden;
    font-family:'Montserrat','Arial Black',sans-serif;}
  .stripe{width:5px;background:${accent};flex-shrink:0;}
  .inner{padding:16px 22px;flex:1;}
  </style>`;
}

const bdg = (bg, fg, txt) =>
  `<div style="display:inline-block;background:${bg};color:${fg};font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 12px;border-radius:8px;text-transform:uppercase;margin-bottom:10px">${txt}</div>`;
const hr = (c) =>
  `<div style="height:1px;background:${c};margin-bottom:10px"></div>`;

function chapHTML(label, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00E5FF','rgba(0,8,30,0.90)','rgba(0,229,255,0.45)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00E5FF','#000d1a',label)}
    ${hr('rgba(0,229,255,.2)')}
    <div style="font-size:21px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
  </div></div></body></html>`;
}

function rankHTML(num, label, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${base}
  .card{position:absolute;left:40px;bottom:${BOTTOM};display:flex;align-items:stretch;
    background:rgba(20,14,0,0.90);border:1.5px solid rgba(255,143,0,0.5);
    box-shadow:0 8px 32px rgba(0,0,0,.65);border-radius:14px;overflow:hidden;
    font-family:'Montserrat','Arial Black',sans-serif;}
  .num{display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg,#FF8F00,#E65100);width:84px;flex-shrink:0;}
  .inner{padding:16px 22px;width:340px;}
  </style>
  </head><body><div class="card">
    <div class="num"><div style="font-size:50px;font-weight:900;color:#fff3e0;line-height:1">#${num}</div></div>
    <div class="inner">
      <div style="font-size:11px;font-weight:800;color:#FF8F00;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">${label}</div>
      <div style="height:1px;background:rgba(255,143,0,.25);margin-bottom:10px"></div>
      <div style="font-size:19px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
    </div>
  </div></body></html>`;
}

function statHTML(value, label, sub) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FFC107','rgba(20,14,0,0.90)','rgba(255,193,7,0.45)',520)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FFC107','#1a0f00','STATISTIK')}
    ${hr('rgba(255,193,7,.25)')}
    <div style="font-size:38px;font-weight:900;color:#FFC107;line-height:1.1;margin-bottom:5px">${value}</div>
    <div style="font-size:11px;font-weight:800;color:rgba(255,193,7,.8);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">${label}</div>
    <div style="font-size:14px;color:rgba(255,255,255,.78);line-height:1.4">${sub}</div>
  </div></div></body></html>`;
}

function keyHTML(tag, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF6D00','rgba(20,8,0,0.90)','rgba(255,109,0,0.45)',540)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF6D00','#fff',tag)}
    ${hr('rgba(255,109,0,.25)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;
}

function alertHTML(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF3C3C','rgba(35,5,5,0.90)','rgba(255,60,60,0.5)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF3C3C','#fff','⚠ ACHTUNG')}
    ${hr('rgba(255,60,60,.3)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;
}

function sourceHTML(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${base}
  .card{position:absolute;right:40px;bottom:${BOTTOM};display:flex;align-items:center;gap:10px;
    background:rgba(5,20,10,0.82);border:1px solid rgba(76,175,80,0.35);
    box-shadow:0 4px 16px rgba(0,0,0,.5);border-radius:8px;padding:10px 18px;
    font-family:'Montserrat','Arial Black',sans-serif;}
  </style>
  </head><body><div class="card">
    <div style="font-size:11px;font-weight:700;color:#66BB6A;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
    <div style="font-size:13px;color:rgba(255,255,255,.88);font-weight:600;white-space:nowrap">${text}</div>
  </div></body></html>`;
}

// ── Card definitions ──────────────────────────────────────────────────────────
// entry: left=chapter/source, right=stat/alert/rank, bottom=key, top=definition
const cards = [
  // ── Chapter markers ──────────────────────────────────────────────────────────
  { id:'chap-intro',       inTime:0.5,   outTime:6,    entry:'left',   html: chapHTML('INTRO','9 Check-in-Fehler\n— Stille Flugkiller') },
  { id:'chap-stat',        inTime:83.5,  outTime:89,   entry:'left',   html: chapHTML('KAPITEL 2','Statistik\n— Namenfehler') },
  { id:'chap-praxis',      inTime:177.5, outTime:183,  entry:'left',   html: chapHTML('KAPITEL 3','Praxis-Tipp\n— Wann checken?') },
  { id:'chap-overbooking', inTime:273.5, outTime:279,  entry:'left',   html: chapHTML('KAPITEL 4','Schutz Vor\nOverbooking') },
  { id:'chap-airlines',    inTime:367.5, outTime:373,  entry:'left',   html: chapHTML('KAPITEL 5','Was Airlines\nüber dich speichern') },
  { id:'chap-dich',        inTime:448,   outTime:453,  entry:'left',   html: chapHTML('KAPITEL 6','Was Airlines\nwirklich über dich wissen') },
  { id:'chap-missv',       inTime:547.5, outTime:553,  entry:'left',   html: chapHTML('KAPITEL 7','Das Größte\nMissverständnis über Check-in') },

  // ── Rank / Fehler cards ───────────────────────────────────────────────────────
  { id:'rank-1', inTime:44.8,  outTime:55,  entry:'right', html: rankHTML(1,'Fehler Nr. 1','Zu spät online eingecheckt.') },
  { id:'rank-2', inTime:62.8,  outTime:73,  entry:'right', html: rankHTML(2,'Fehler Nr. 2','Namensabweichung im Ticket.') },
  { id:'rank-3', inTime:102.6, outTime:113, entry:'right', html: rankHTML(3,'Fehler Nr. 3','Abgelaufener Reisepass.') },
  { id:'rank-4', inTime:119.1, outTime:130, entry:'right', html: rankHTML(4,'Fehler Nr. 4','Gepäcklimits ignoriert.') },
  { id:'rank-5', inTime:159.7, outTime:170, entry:'right', html: rankHTML(5,'Fehler Nr. 5','Check-in-Frist verpasst.') },
  { id:'rank-6', inTime:195.3, outTime:206, entry:'right', html: rankHTML(6,'Fehler Nr. 6','Falsche Zahlungsmethode.') },
  { id:'rank-7', inTime:213.0, outTime:224, entry:'right', html: rankHTML(7,'Fehler Nr. 7','Fehlendes Visum oder ESTA.') },
  { id:'rank-8', inTime:254.9, outTime:265, entry:'right', html: rankHTML(8,'Fehler Nr. 8','Overbooking nicht bedacht.') },
  { id:'rank-9', inTime:294.5, outTime:305, entry:'right', html: rankHTML(9,'Fehler Nr. 9','Falsches Terminal erwischt.') },

  // ── Stat cards ────────────────────────────────────────────────────────────────
  { id:'stat-namen',  inTime:88.5,  outTime:100, entry:'right', html: statHTML('10%',     'ALLER BUCHUNGEN',   'enthalten einen Namensfehler (Skyscanner)') },
  { id:'stat-gepack', inTime:148,   outTime:158, entry:'right', html: statHTML('33 Mrd.', 'US-DOLLAR',         'Gepäckgebühren weltweit pro Jahr (IATA)') },
  { id:'stat-docs',   inTime:241,   outTime:252, entry:'right', html: statHTML('1,2 Mio.','PASSAGIERE',        'jährlich wegen fehlender Dokumente abgewiesen') },
  { id:'stat-eu',     inTime:470,   outTime:482, entry:'right', html: statHTML('600 €',   'ENTSCHÄDIGUNG',     'EU-Verordnung 261/2004 — pro Person') },

  // ── Key / Tipp cards ──────────────────────────────────────────────────────────
  { id:'key-regel',   inTime:179,   outTime:192, entry:'bottom', html: keyHTML('★ GOLDENE REGEL',    'Mindestens 2 Stunden vor Abflug am Flughafen sein.') },
  { id:'key-protect', inTime:275,   outTime:288, entry:'bottom', html: keyHTML('★ SCHUTZSTRATEGIE',  'Sofort bei Check-in-Öffnung einloggen — exakt 24h vor Abflug.') },

  // ── Alert cards ───────────────────────────────────────────────────────────────
  { id:'alert-data',  inTime:369,   outTime:381, entry:'right', html: alertHTML('Dein Check-in-Verhalten wird intern gespeichert und beeinflusst zukünftige Upgrades.') },
  { id:'alert-missv', inTime:549,   outTime:561, entry:'right', html: alertHTML('Check-in ist kein Selbstläufer — eine falsche Entscheidung kostet deinen Flug.') },

  // ── Source citations ──────────────────────────────────────────────────────────
  { id:'src-sky',   inTime:90,    outTime:100,  entry:'left', html: sourceHTML('Skyscanner-Studie 2023') },
  { id:'src-iata1', inTime:149,   outTime:158,  entry:'left', html: sourceHTML('IATA Ancillary Revenue Report') },
  { id:'src-iata2', inTime:242,   outTime:252,  entry:'left', html: sourceHTML('IATA Passagier-Abweisungsdaten') },
  { id:'src-eu261', inTime:471,   outTime:482,  entry:'left', html: sourceHTML('EU-Verordnung 261/2004') },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });

  const manifest = { cards: [] };
  for (const card of cards) {
    await page.setContent(card.html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const pngPath = join(outDir, `${card.id}.png`);
    await page.screenshot({ path: pngPath, omitBackground: true });
    manifest.cards.push({
      id: card.id,
      path: `card-frames/${card.id}.png`,
      inTime: card.inTime,
      outTime: card.outTime,
      entry: card.entry,
    });
    console.log(`  ✓ ${card.id}.png`);
  }
  await browser.close();

  const manifestPath = join(__dir, 'card-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${manifest.cards.length} cards → card-manifest.json`);
})();
