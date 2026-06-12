/**
 * render-cards.mjs — gepaeck-de
 * "8 Gepaeck-Finder-Tricks — Nr. 5 kennt kein Passagier"
 * Resolution: 1280×720
 * Card times in scaled voiceover timeline (×0.9747, timings 612.74s → 597.24s)
 * No chap-1: hook rule — video opens clean, first chapter card at Nummer 3
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

// ── Card HTML builders ────────────────────────────────────────────────────────

const chapHTML = (label, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00E5FF','rgba(0,3,15,0.50)','rgba(0,229,255,0.45)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00E5FF','#000d1a',label)}${hr('rgba(0,229,255,.2)')}
    <div style="font-size:21px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
  </div></div></body></html>`;

const statHTML = (value, label, sub) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FFC107','rgba(10,8,0,0.50)','rgba(255,193,7,0.45)',520)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FFC107','#1a0f00','STATISTIK')}${hr('rgba(255,193,7,.25)')}
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

// ── Card definitions ──────────────────────────────────────────────────────────
// Times in scaled voiceover timeline (612.74 × 0.9747 = 597.24s)
// Scaled scene starts:
//  S3=35.8  S4=54.3  S5=71.8  S6=93.5  S7=111.8  S8=126.4
//  S11=183.3 S12=201.4 S15=255.4 S16=274.1 S17=292.5
//  S20=351.9 S21=371.1 S22=389.0 S23=407.4 S24=426.0
//  S25=457.7 S26=477.4 S28=518.2 S29=536.4

const cards = [
  // ── Stats (gold, bottom-left) ──────────────────────────────────────────────
  { id: 'stat-25mio',    inTime:   2.5,  outTime:  12.5,  html: statHTML('25 Mio.',  'GEPÄCKSTÜCKE VERLOREN',  'Jedes Jahr weltweit — Airlines verschweigen es') },
  { id: 'stat-60pct',    inTime:  35.8,  outTime:  45.8,  html: statHTML('60 %',    'VERLORENE KOFFER',        'Tragen keine aktuelle Adresse') },
  { id: 'stat-40pct',    inTime: 111.8,  outTime: 121.8,  html: statHTML('40 %',    'ALLER KOFFER AM BAND',    'Sind schwarz — höchste Verwechslungsgefahr') },
  { id: 'stat-3x',       inTime: 268.0,  outTime: 278.0,  html: statHTML('3×',      'HÖHERE VERLUSTRATE',      'Bei Last-Minute Check-in — Airline-Insider') },
  { id: 'stat-70pct',    inTime: 355.0,  outTime: 365.0,  html: statHTML('70 %',    'ALLER GEPÄCKVERLUSTE',    'Passieren bei Umsteigeflügen — IATA-Daten') },
  { id: 'stat-1500',     inTime: 412.0,  outTime: 422.0,  html: statHTML('1.500 €', 'ENTSCHÄDIGUNG',           'Nach 21 Tagen — Montrealer Übereinkommen') },

  // ── Keys / Tips (orange, bottom-left) ─────────────────────────────────────
  { id: 'key-schild',    inTime:  54.3,  outTime:  64.3,  html: keyHTML('★ TIPP', 'Name + Handy + E-Mail auf das Gepäckschild') },
  { id: 'key-innen',     inTime:  71.8,  outTime:  81.8,  html: keyHTML('★ TIPP', 'Zettel mit Kontaktdaten ins Kofferinnere legen') },
  { id: 'key-foto',      inTime: 126.4,  outTime: 136.4,  html: keyHTML('★ TIPP', 'Koffer vor Check-in von allen Seiten fotografieren') },
  { id: 'key-tracker',   inTime: 198.0,  outTime: 208.0,  html: keyHTML('★ PROFI', 'AirTag in den Innenfutter-Rand eingenäht — unsichtbar') },
  { id: 'key-frueh',     inTime: 255.4,  outTime: 265.4,  html: keyHTML('★ TIPP', 'Früh einchecken = früh im System = 3× sicherer') },
  { id: 'key-etikett',   inTime: 292.5,  outTime: 302.5,  html: keyHTML('★ TIPP', 'Alle alten Etiketten entfernen — Scanner liest falsche Route') },

  // ── Alerts (red, bottom-left) ─────────────────────────────────────────────
  { id: 'alert-schwarz', inTime: 113.0,  outTime: 123.0,  html: alertHTML('Schwarzer Koffer: 40% aller Koffer sind schwarz — maximale Verwechslungsgefahr') },
  { id: 'alert-lastmin', inTime: 280.0,  outTime: 290.0,  html: alertHTML('Last-Minute Check-in: 3× höhere Verlustrate — Bodenpersonal unter Extremdruck') },
  { id: 'alert-tickets', inTime: 384.0,  outTime: 394.0,  html: alertHTML('2 separate Tickets: Airline 2 ist nicht verpflichtet — du verlierst alle Rechte') },
  { id: 'alert-pir',     inTime: 399.0,  outTime: 409.0,  html: alertHTML('Ohne PIR-Formular: kein Anspruch auf Entschädigung — vor Verlassen des Flughafens!') },

  // ── Chapter cards (cyan, top-left) — NO chap-1 (hook rule) ───────────────
  { id: 'chap-2',        inTime:  93.5,  outTime: 105.5,  html: chapHTML('KAPITEL 2', 'Nummer 3 — Der auffällige Koffer') },
  { id: 'chap-3',        inTime: 183.3,  outTime: 195.3,  html: chapHTML('KAPITEL 3', 'Nummer 5 — Der versteckte Tracker') },
  { id: 'chap-4',        inTime: 274.1,  outTime: 286.1,  html: chapHTML('KAPITEL 4', 'Nummer 6 — Früh einchecken') },
  { id: 'chap-5',        inTime: 351.9,  outTime: 363.9,  html: chapHTML('KAPITEL 5', 'Nummer 8 — Direktflüge & eine Airline') },
  { id: 'chap-6',        inTime: 457.7,  outTime: 469.7,  html: chapHTML('DEEP DIVE', 'Was nach dem Verlust wirklich passiert') },
  { id: 'chap-7',        inTime: 536.4,  outTime: 548.4,  html: chapHTML('INSIDER-PERSPEKTIVE', 'Der Ex-Gepäckarbeiter spricht') },

  // ── Sources (green, bottom-right) ─────────────────────────────────────────
  { id: 'src-iata',      inTime: 368.5,  outTime: 380.5,  html: sourceHTML('IATA World Baggage Report 2024') },
  { id: 'src-montreal',  inTime: 419.0,  outTime: 431.0,  html: sourceHTML('Montrealer Übereinkommen — Internat. Luftrecht') },
  { id: 'src-sita',      inTime: 477.5,  outTime: 489.5,  html: sourceHTML('SITA World Baggage Report 2022') },
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
