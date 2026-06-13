/**
 * render-cards.mjs — jetlag-de
 * "WM 2026 Jetlag USA vermeiden — die wichtigsten Tipps fuer Fans"
 * Resolution: 1280×720
 * Card times pre-scaled: raw × (623.28 / 639.48) = × 0.97467
 * No hook card — first chapter card at 48-Stunden-Voranpassung (Scene 5)
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
// All times pre-scaled: raw_time × 0.97467  (623.28s voiceover / 639.48s raw)
// Scene starts (raw → scaled):
//  S5=67.69→66.0   S6=92.17→89.9   S7=109.93→107.1  S8=124.54→121.4
//  S9=142.85→139.2  S10=163.41→159.3  S11=182.49→177.9  S12=199.12→194.1
//  S13=214.88→209.5  S15=254.92→248.5  S16=275.92→269.0  S17=294.66→287.2
//  S18=317.43→309.4  S19=336.65→328.2  S20=354.60→345.7  S21=372.28→362.9
//  S22=399.97→390.0  S24=436.15→425.2  S25=453.93→442.5  S26=477.09→465.1
//  S28=516.85→503.9  S31=582.41→567.8

const cards = [
  // ── Chapter cards (cyan, top-left) — NO hook card ─────────────────────────
  { id: 'chap-48stunden',    inTime:  66.0, outTime:  78.0, html: chapHTML('48-STUNDEN-VORANPASSUNG',    'Jeden Tag 1h früher schlafen — 2 Tage vor Abflug starten') },
  { id: 'chap-licht',        inTime: 107.1, outTime: 119.1, html: chapHTML('LICHTTHERAPIE GEZIELT',       'Abends Licht tanken — nicht morgens — für Westflüge in die USA') },
  { id: 'chap-schlaf',       inTime: 159.3, outTime: 171.3, html: chapHTML('SCHLAF NACH ZIELORTZEIT',     'Schlafe wenn es in den USA Nacht ist — nicht wenn du müde bist') },
  { id: 'chap-melatonin',    inTime: 177.9, outTime: 189.9, html: chapHTML('MELATONIN RICHTIG DOSIEREN',  '0,5–3 mg erst wenn es am Zielort dunkel ist — nicht früher') },
  { id: 'chap-fasten',       inTime: 209.5, outTime: 221.5, html: chapHTML('STRATEGISCHES FASTEN VOR ANKUNFT','12–16h Fastenfenster beschleunigt innere Uhr dramatisch') },
  { id: 'chap-bewegung',     inTime: 287.2, outTime: 299.2, html: chapHTML('BEWEGUNG AM ANKUNFTSTAG',     '30 Min. Aktivität draußen halbiert deine Melatoninproduktion') },
  { id: 'chap-timeshifter',  inTime: 328.2, outTime: 340.2, html: chapHTML('TIMESHIFTER APP',              'Von NASA & Profisportlern genutzt — Dr. Steven Lockley, Harvard') },
  { id: 'chap-koffein',      inTime: 345.7, outTime: 357.7, html: chapHTML('KOFFEIN STRATEGISCH EINSETZEN','Morgens ja — nach 14 Uhr NEIN (6h Halbwertszeit beachten)') },
  { id: 'chap-flug',         inTime: 390.0, outTime: 402.0, html: chapHTML('DEN RICHTIGEN FLUG WÄHLEN',   'Nachtflug aus Europa = sofort schlafen, ausgeruht ankommen') },
  { id: 'chap-blaulicht',    inTime: 425.2, outTime: 437.2, html: chapHTML('BLAULICHT KONSEQUENT MEIDEN',  'Smartphone-Display hemmt Melatonin um bis zu 50%') },
  { id: 'chap-apotheke',     inTime: 465.1, outTime: 477.1, html: chapHTML('RICHTIGE REISEAPOTHEKE',       'Melatonin + Magnesium + Elektrolyte — keine Schlaftabletten!') },
  { id: 'chap-schlaftemp',   inTime: 503.9, outTime: 515.9, html: chapHTML('SCHLAFTEMPERATUR OPTIMIEREN',  '16–19°C für Tiefschlaf — Klimaanlage im Hotel runterstellen') },

  // ── Stats (gold, bottom-left) ─────────────────────────────────────────────
  { id: 'stat-4tage',  inTime:   2.5, outTime:  12.5, html: statHTML('4 Tage',     'REISEZEIT VERLOREN',     'Schwerer Jetlag raubt dir bis zu vier volle Erlebnistage') },
  { id: 'stat-93pct',  inTime:  89.9, outTime:  99.9, html: statHTML('93 %',       'REISENDE BETROFFEN',     'leiden unter messbaren Jetlag-Symptomen auf Langstreckenflügen') },
  { id: 'stat-12h',    inTime: 248.5, outTime: 258.5, html: statHTML('12–16h',     'FASTENFENSTER',          'vor der Ankunft — Harvard Medical School Forschungsergebnis') },
  { id: 'stat-27tage', inTime: 567.8, outTime: 577.8, html: statHTML('2,7 Tage',   'SCHNELLER ERHOLT',       'mit aktivem Jetlag-Management (Sleep Research Society)') },

  // ── Alerts (red, bottom-left) ─────────────────────────────────────────────
  { id: 'alert-schlaffehler', inTime: 139.2, outTime: 149.2, html: alertHTML('Schlafen wenn du müde bist ist FALSCH — kostet dich 2 volle Anpassungstage!') },
  { id: 'alert-nickerchen',   inTime: 269.0, outTime: 279.0, html: alertHTML('Mittagsschlaf über 20 Min. wirft dich 24 Stunden zurück — nur vor 15 Uhr und max. 20 Min.!') },
  { id: 'alert-blaulicht',    inTime: 442.5, outTime: 452.5, html: alertHTML('Blaues Licht hemmt Melatoninproduktion um 50% — Nachtmodus ab 20 Uhr Ortszeit Pflicht!') },

  // ── Keys / Tips (orange, bottom-left) ────────────────────────────────────
  { id: 'key-lichtbrille',  inTime: 121.4, outTime: 131.4, html: keyHTML('★ TIPP',    'LED-Lichttherapiebrille simuliert Abendsonne sogar im Flugzeug — unter 50 €') },
  { id: 'key-timeshifter',  inTime: 330.0, outTime: 340.0, html: keyHTML('★ APP',     'Timeshifter: personalisierten Licht-Schlaf-Koffein-Plan gratis erstellen lassen') },
  { id: 'key-spieltag',     inTime: 362.9, outTime: 372.9, html: keyHTML('★ SPIELTAG','22 Uhr Melatonin → 23 Uhr schlafen → Anpfiff mit vollem Fokus erleben') },

  // ── Sources (green, bottom-right) ─────────────────────────────────────────
  { id: 'src-michigan',   inTime:  18.5, outTime:  28.5, html: sourceHTML('Univ. Michigan — Chronobiology & Sleep Research') },
  { id: 'src-asms',       inTime:  89.9, outTime:  99.9, html: sourceHTML('American Academy of Sleep Medicine (AASM)') },
  { id: 'src-sleeprsch',  inTime: 567.8, outTime: 577.8, html: sourceHTML('Sleep Research Society — Jetlag-Erholungsstudie') },
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
