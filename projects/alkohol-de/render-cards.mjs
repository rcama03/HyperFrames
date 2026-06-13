/**
 * render-cards.mjs — alkohol-de
 * "8 Alkohol-Luegen im Flieger — Nr. 4 trifft dich sofort hart"
 * Resolution: 1280×720
 * Card times pre-scaled: raw × (466.416 / 481.39) = × 0.9689
 * No hook card — first chapter card at Lüge 1 (Nummer 1 scene)
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
// All times pre-scaled: raw_time × 0.9689  (466.416s voiceover / 481.39s raw)
// Scene starts (raw → scaled):
//  S4=45.97→44.6  S5=59.5→57.7  S6=77.64→75.2  S8=109.81→106.4
//  S9=124.88→121.0  S10=141.7→137.3  S11=155.54→150.7
//  S12=173.15→167.8  S13=187.55→181.7  S14=203.55→197.3
//  S15=217.75→211.0  S16=234.93→227.6  S17=251.01→243.2
//  S18=267.37→259.1  S19=286.13→277.2  S20=305.18→295.7
//  S21=321.45→311.5  S22=337.86→327.4  S23=351.3→340.4
//  S24=370.74→359.2  S25=388.16→376.1  S26=405.39→392.8
//  S27=419.95→407.0  S28=436.79→423.2  S29=453.37→439.3  S30=466.13→451.8

const cards = [
  // ── Chapter cards (cyan, top-left) — NO intro hook card ───────────────────
  { id: 'chap-l1',  inTime:  44.6,  outTime:  56.6,  html: chapHTML('LÜGE 1',  'Alkohol hilft beim Schlafen im Flieger') },
  { id: 'chap-l2',  inTime:  75.2,  outTime:  87.2,  html: chapHTML('LÜGE 2',  'Wirkung ist stärker auf großer Höhe') },
  { id: 'chap-l3',  inTime: 106.4,  outTime: 118.4,  html: chapHTML('LÜGE 3',  'Wein schmeckt schlechter wegen Qualität') },
  { id: 'chap-l4',  inTime: 137.3,  outTime: 149.3,  html: chapHTML('LÜGE 4',  'Nach der Landung kann ich noch fahren') },
  { id: 'chap-l5',  inTime: 167.8,  outTime: 179.8,  html: chapHTML('LÜGE 5',  'Airlines bieten Alkohol als reinen Service') },
  { id: 'chap-l6',  inTime: 211.0,  outTime: 223.0,  html: chapHTML('LÜGE 6',  'Wasser zwischen Drinks neutralisiert Alkohol') },
  { id: 'chap-l7',  inTime: 243.2,  outTime: 255.2,  html: chapHTML('LÜGE 7',  'Whiskey wärmt dich, wenn dir kalt ist') },
  { id: 'chap-l8',  inTime: 277.2,  outTime: 289.2,  html: chapHTML('LÜGE 8',  'Im Business Class ist alles erlaubt') },

  // ── Stats (gold, bottom-left) ─────────────────────────────────────────────
  { id: 'stat-schlaf',   inTime:  57.7,  outTime:  67.7,  html: statHTML('−24 %',       'SCHLAFQUALITÄT',          'Alkohol vor dem Schlafen — Dt. Sporthochschule Köln') },
  { id: 'stat-aroma',    inTime: 121.0,  outTime: 131.0,  html: statHTML('−30 %',       'AROMAWAHRNEHMUNG',         'Trockene Kabinenluft reduziert süße & saure Noten') },
  { id: 'stat-iata',     inTime: 181.7,  outTime: 191.7,  html: statHTML('1,9 Mrd. $',  'AIRLINE-EINNAHMEN/JAHR',   'Allein durch Getränkeverkäufe an Bord — IATA') },
  { id: 'stat-leber',    inTime: 227.6,  outTime: 237.6,  html: statHTML('0,1 ‰/h',     'ALKOHOLABBAU',             'Leber baut fest ab — kein Wasser, Kaffee oder Sport ändert das') },
  { id: 'stat-50pct',    inTime: 311.5,  outTime: 321.5,  html: statHTML('50 %+',       'ALLER ZWISCHENFÄLLE',      'An Bord mit Alkohol verbunden — Europ. Luftfahrtverband') },

  // ── Alerts (red, bottom-left) ─────────────────────────────────────────────
  { id: 'alert-fahren',     inTime: 150.7,  outTime: 160.7,  html: alertHTML('Nach der Landung: Passagiere noch deutlich stärker beeinträchtigt als sie selbst GLAUBEN') },
  { id: 'alert-rauswurf',   inTime: 295.7,  outTime: 305.7,  html: alertHTML('Trunkenheit: Kapitän darf dich NACH dem Boarding aus dem Flieger weisen — tausende € Strafe') },
  { id: 'alert-medis',      inTime: 327.4,  outTime: 337.4,  html: alertHTML('Schlaftabletten + Alkohol an Bord: Diese Kombination kann lebensbedrohlich werden') },
  { id: 'alert-thrombose',  inTime: 340.4,  outTime: 350.4,  html: alertHTML('Alkohol VERSTÄRKT Thrombose-Risiko erheblich — entwässert und beeinflusst Blutgerinnung') },

  // ── Keys / Tips (orange, bottom-left) ────────────────────────────────────
  { id: 'key-essen',   inTime: 423.0,  outTime: 433.0,  html: keyHTML('★ TIPP', 'Vor dem Flug gut essen und hydrieren') },
  { id: 'key-maßen',   inTime: 436.0,  outTime: 446.0,  html: keyHTML('★ TIPP', 'An Bord: höchstens 1–2 Drinks, viel Wasser dazu') },
  { id: 'key-medis',   inTime: 449.0,  outTime: 459.0,  html: keyHTML('★ WICHTIG', 'Kein Alkohol zusammen mit Beruhigungsmitteln oder Schlaftabletten') },

  // ── Sources (green, bottom-right) ─────────────────────────────────────────
  { id: 'src-koeln',      inTime:  57.7,  outTime:  69.7,  html: sourceHTML('Dt. Sporthochschule Köln — Schlafforschung') },
  { id: 'src-fraunhofer', inTime: 121.0,  outTime: 133.0,  html: sourceHTML('Fraunhofer-Institut — Kabinenluft & Geschmack') },
  { id: 'src-iata',       inTime: 181.7,  outTime: 193.7,  html: sourceHTML('IATA Marktreport — Bordservice-Einnahmen') },
  { id: 'src-luftfahrt',  inTime: 311.5,  outTime: 323.5,  html: sourceHTML('Europäischer Luftfahrtverband — Unruly Passengers') },
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
