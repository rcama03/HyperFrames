/**
 * render-cards.mjs — wm2026-de
 * "WM 2026 Flug USA buchen - die wichtigsten Tipps jetzt"
 * Resolution: 1280×720
 * Card times pre-scaled: raw × (580.128 / 595.81) = × 0.97369
 * No hook card — first chapter card at Scene 6 (Gruppenauslosung)
 * All card backgrounds: 50% translucent (opacity 0.50)
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
const BOTTOM = '165px';
const TOP    = '40px';

const base = `
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
  font-family:'Arial Black','Arial',sans-serif;}`;

function btmCard(accent, bg, border, w) {
  return `<style>${base}
  .card{position:absolute;left:40px;bottom:${BOTTOM};display:flex;align-items:stretch;width:${w}px;
    background:${bg};border:1.5px solid ${border};
    box-shadow:0 8px 32px rgba(0,0,0,.65);border-radius:14px;overflow:hidden;}
  .stripe{width:5px;background:${accent};flex-shrink:0;}
  .inner{padding:16px 22px;flex:1;}
  </style>`;
}
function topCard(accent, bg, border, w) {
  return `<style>${base}
  .card{position:absolute;left:40px;top:${TOP};display:flex;align-items:stretch;width:${w}px;
    background:${bg};border:1.5px solid ${border};
    box-shadow:0 8px 32px rgba(0,0,0,.65);border-radius:14px;overflow:hidden;}
  .stripe{width:5px;background:${accent};flex-shrink:0;}
  .inner{padding:16px 22px;flex:1;}
  </style>`;
}

const bdg = (bg, fg, txt) =>
  `<div style="display:inline-block;background:${bg};color:${fg};font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 12px;border-radius:8px;text-transform:uppercase;margin-bottom:10px">${txt}</div>`;
const hr = (c) =>
  `<div style="height:1px;background:${c};margin-bottom:10px"></div>`;

// ── Card HTML builders ─────────────────────────────────────────────────────────

const chapHTML = (label, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00E5FF','rgba(0,3,15,0.50)','rgba(0,229,255,0.45)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00E5FF','#000d1a',label)}${hr('rgba(0,229,255,.2)')}
    <div style="font-size:21px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
  </div></div></body></html>`;

const statHTML = (value, label, sub) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FFC107','rgba(10,8,0,0.50)','rgba(255,193,7,0.45)',520)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FFC107','#1a0f00','STUDIE')}${hr('rgba(255,193,7,.25)')}
    <div style="font-size:38px;font-weight:900;color:#FFC107;line-height:1.1;margin-bottom:5px">${value}</div>
    <div style="font-size:11px;font-weight:800;color:rgba(255,193,7,.8);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">${label}</div>
    <div style="font-size:14px;color:rgba(255,255,255,.78);line-height:1.4">${sub}</div>
  </div></div></body></html>`;

const keyHTML = (tag, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF6D00','rgba(10,4,0,0.50)','rgba(255,109,0,0.45)',540)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF6D00','#fff',tag)}${hr('rgba(255,109,0,.25)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;

const alertHTML = (text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF3C3C','rgba(20,2,2,0.50)','rgba(255,60,60,0.5)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF3C3C','#fff','⚠ ACHTUNG')}${hr('rgba(255,60,60,.3)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;

const sourceHTML = (text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${base}
  .card{position:absolute;right:40px;bottom:${BOTTOM};display:flex;align-items:center;gap:10px;
    background:rgba(2,11,5,0.50);border:1px solid rgba(76,175,80,0.35);
    box-shadow:0 4px 16px rgba(0,0,0,.5);border-radius:8px;padding:10px 18px;}
  </style>
  </head><body><div class="card">
    <div style="font-size:11px;font-weight:700;color:#66BB6A;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
    <div style="font-size:13px;color:rgba(255,255,255,.88);font-weight:600;white-space:nowrap">${text}</div>
  </div></body></html>`;

// ── Card definitions ───────────────────────────────────────────────────────────
// All times pre-scaled: raw_time × 0.97369  (580.128s voiceover / 595.81s raw)
// Scene starts (raw → scaled):
//  S6=97.39→94.8   S9=148.69→144.8  S10=165.65→161.3  S11=186.69→181.8
//  S12=202.86→197.6  S13=220.14→214.4  S15=252.38→245.8  S16=280.82→273.4
//  S19=331.05→322.4  S20=348.16→339.0  S21=371.10→361.4  S22=387.94→377.8
//  S23=406.44→395.9  S25=439.36→427.8  S26=461.00→449.0  S28=496.03→483.0
//  S31=559.40→544.8

const cards = [
  // ── Chapter cards (cyan, top-left) — NO hook card ─────────────────────────
  { id: 'chap-gruppen',   inTime:  94.8, outTime: 106.8, html: chapHTML('GRUPPENAUSLOSUNG',   'Preise schießen in Minuten durch die Decke') },
  { id: 'chap-wochentag', inTime: 181.8, outTime: 193.8, html: chapHTML('WOCHENTAG-STRATEGIE','Dienstag & Mittwoch — günstigste Buchungstage') },
  { id: 'chap-meilen',    inTime: 273.4, outTime: 285.4, html: chapHTML('MEILEN & PUNKTE',    'Award-Tickets & Kreditkarten-Boni nutzen') },
  { id: 'chap-hotels',    inTime: 361.4, outTime: 373.4, html: chapHTML('HOTEL-APPS',         'Frühbucher sichern die besten Preise') },
  { id: 'chap-waehrung',  inTime: 449.0, outTime: 461.0, html: chapHTML('WÄHRUNG & GELD',     'Auslandseinsatzgebühr vermeiden') },
  { id: 'chap-zuspat',    inTime: 544.8, outTime: 556.8, html: chapHTML('IST ES ZU SPÄT?',    'Ab März 2026 wird es brutal teuer') },

  // ── Stats (gold, bottom-left) ─────────────────────────────────────────────
  { id: 'stat-400pct',  inTime:   2.5, outTime:  12.5, html: statHTML('400 %',    'MEHR',              'zahlt, wer nach der Gruppenauslosung bucht') },
  { id: 'stat-312pct',  inTime: 245.8, outTime: 255.8, html: statHTML('312 %',    'PREISSTEIGERUNG',   'bei großen Sportevents — Hopper-Analyse') },
  { id: 'stat-15pct',   inTime: 339.0, outTime: 349.0, html: statHTML('15–25 %',  'GÜNSTIGER',         'Flug & Hotel separat buchen statt Pauschal') },
  { id: 'stat-50k',     inTime: 395.9, outTime: 405.9, html: statHTML('50.000 $', 'KLINIKKOSTEN USA',  'ein einfacher Krankenhausaufenthalt ohne Versicherung') },

  // ── Alerts (red, bottom-left) ─────────────────────────────────────────────
  { id: 'alert-tracking', inTime: 214.4, outTime: 224.4, html: alertHTML('Inkognito-Modus nutzen! Airlines & Portale erhöhen Preise bei Mehrfachsuche') },
  { id: 'alert-spieltag', inTime: 322.4, outTime: 332.4, html: alertHTML('Spieltag = teuerster Reisetag — 2 Tage früher anreisen und sparen') },
  { id: 'alert-esta',     inTime: 377.8, outTime: 387.8, html: alertHTML('ESTA: Mindestens 72 Stunden vor Abflug beantragen — 21 $ — ohne geht es nicht') },

  // ── Keys / Tips (orange, bottom-left) ────────────────────────────────────
  { id: 'key-preisalarm', inTime: 161.3, outTime: 171.3, html: keyHTML('★ TIPP',     'Preisalarm bei Google Flights einrichten — kostenlos & effektiv') },
  { id: 'key-stopp',      inTime: 197.6, outTime: 207.6, html: keyHTML('★ TIPP',     'Stopp via Amsterdam, Dublin oder Reykjavik: 200–400 € sparen') },
  { id: 'key-seatguru',   inTime: 427.8, outTime: 437.8, html: keyHTML('★ TIPP',     'SeatGuru.com: Beste Sitzplätze mit Beinfreiheit — kostenlos') },

  // ── Sources (green, bottom-right) ─────────────────────────────────────────
  { id: 'src-google',  inTime: 144.8, outTime: 156.8, html: sourceHTML('Google Flights — Preisvergleich & Preisalarm') },
  { id: 'src-hopper',  inTime: 245.8, outTime: 257.8, html: sourceHTML('Hopper-Studie — Flugpreise bei Sportevents') },
  { id: 'src-fifa',    inTime: 483.0, outTime: 495.0, html: sourceHTML('FIFA.com — Offizielle WM-Ticketvergabe 2026') },
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
    });
    console.log(`  ✓ ${card.id}.png`);
  }
  await browser.close();

  const manifestPath = join(__dir, 'card-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${manifest.cards.length} cards → card-manifest.json`);
})();
