/**
 * render-cards.mjs — priority-de
 * "8 Priority-Pass-Luegen — Nr. 4 verlierst du echtes Geld sofort"
 * Resolution: 1280×720
 * Card times pre-scaled: raw × (550.968 / 566.19) = × 0.97313
 * No hook card — first chapter card at Nummer 1 (Scene 4)
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
// All times pre-scaled: raw_time × 0.97313  (550.968s voiceover / 566.19s raw)
// Scene starts (raw → scaled):
//  S4=44.30→43.1   S6=83.75→81.5   S8=119.34→116.2  S11=177.58→172.9
//  S13=219.31→213.6  S15=255.83→249.1  S17=292.71→285.0  S20=350.44→341.3
//  S26=456.18→444.3  S27=476.65→464.2  S29=513.39→499.9

const cards = [
  // ── Chapter cards (cyan, top-left) — NO hook card ─────────────────────────
  { id: 'chap-n1',         inTime:  43.1, outTime:  55.1, html: chapHTML('LÜGE 1 — NETZWERK',       '1.300 Lounges — aber nicht alle sind zugänglich') },
  { id: 'chap-n2',         inTime:  81.5, outTime:  93.5, html: chapHTML('LÜGE 2 — GÄSTE',          'Jeder Gast kostet bis zu 32 Dollar pro Besuch') },
  { id: 'chap-n3',         inTime: 116.2, outTime: 128.2, html: chapHTML('LÜGE 3 — WACHSTUM',       'Lounges kollabieren durch Kreditkarten-Massenangebot') },
  { id: 'chap-n4',         inTime: 172.9, outTime: 184.9, html: chapHTML('LÜGE 4 — RESTAURANTFALLE','Du zahlst mehr als ohne den Priority Pass') },
  { id: 'chap-n5',         inTime: 213.6, outTime: 225.6, html: chapHTML('LÜGE 5 — QUALITÄT',       'Drittanbieter-Räume statt echter VIP-Lounges') },
  { id: 'chap-n6',         inTime: 249.1, outTime: 261.1, html: chapHTML('LÜGE 6 — ÖFFNUNGSZEITEN', 'Früh- & Nachtflüge: Lounge oft geschlossen') },
  { id: 'chap-n7',         inTime: 285.0, outTime: 297.0, html: chapHTML('LÜGE 7 — DIE BANK',       'Konditionen können jederzeit gestrichen werden') },
  { id: 'chap-n8',         inTime: 341.3, outTime: 353.3, html: chapHTML('LÜGE 8 — FALSCHE NÄHE',   'Lounge liegt im anderen Terminal — 15 Minuten laufen') },
  { id: 'chap-industrie',  inTime: 444.3, outTime: 456.3, html: chapHTML('INDUSTRIE VERDIENT AN DIR','Collinson Group: Milliardenumsatz durch Nichtnutzung') },

  // ── Stats (gold, bottom-left) ─────────────────────────────────────────────
  { id: 'stat-60pct',  inTime:   2.5, outTime:  12.5, html: statHTML('60 %',       'ABGEWIESEN',          'aller Priority-Pass-Inhaber in den letzten 12 Monaten') },
  { id: 'stat-10mio',  inTime:  28.7, outTime:  38.7, html: statHTML('10 Mio.',    'KARTENINHABER',        'weltweit — manche zahlen bis zu 699 $ pro Jahr direkt') },
  { id: 'stat-32usd',  inTime:  95.0, outTime: 105.0, html: statHTML('32 $',       'PRO GAST-BESUCH',      'vierköpfige Familie: mehrere Hundert Dollar extra im Jahr') },
  { id: 'stat-30pct',  inTime: 269.2, outTime: 279.2, html: statHTML('30 %+',      'FLÜGE AUSSERHALB',     'normaler Lounge-Betriebszeiten — du sitzt im Terminal') },
  { id: 'stat-35usd',  inTime: 323.0, outTime: 333.0, html: statHTML('35–50 $',    'PRO EXTRA-BESUCH',     'nach dem 10-Besuche-Jahreslimit — Vielreisende zahlen drauf') },

  // ── Alerts (red, bottom-left) ─────────────────────────────────────────────
  { id: 'alert-nichts',      inTime: 148.0, outTime: 158.0, html: alertHTML('Karte garantiert NICHTS — Lounges dürfen bei Überfüllung ablehnen!') },
  { id: 'alert-restaurant',  inTime: 204.0, outTime: 214.0, html: alertHTML('28 $ Guthaben, aber 40 $ Mindestbestellung — du zahlst IMMER drauf') },
  { id: 'alert-bank',        inTime: 304.6, outTime: 314.6, html: alertHTML('Pass-Vorteil kann JEDERZEIT gestrichen werden — ohne große Ankündigung') },

  // ── Keys / Tips (orange, bottom-left) ────────────────────────────────────
  { id: 'key-preise',      inTime: 362.8, outTime: 372.8, html: keyHTML('★ TIPP',  'Lohnt sich erst ab 20+ Flügen/Jahr von großen Drehkreuzen') },
  { id: 'key-drei',        inTime: 427.4, outTime: 437.4, html: keyHTML('★ TIPP',  '3 Fragen: Terminal? Geöffnet? Was kostet die Alternative?') },
  { id: 'key-loungebuddy', inTime: 464.2, outTime: 474.2, html: keyHTML('★ APP',   'LoungeBuddy: Nur Lounges mit ≥ 4 Sterne nutzen — vorher prüfen') },

  // ── Sources (green, bottom-right) ─────────────────────────────────────────
  { id: 'src-pp',         inTime:  44.0, outTime:  56.0, html: sourceHTML('Priority Pass — 1.300 Lounges in 140+ Ländern') },
  { id: 'src-collinson',  inTime: 464.2, outTime: 476.2, html: sourceHTML('Collinson Group — Muttergesellschaft Priority Pass') },
  { id: 'src-loungebuddy',inTime: 499.9, outTime: 511.9, html: sourceHTML('LoungeBuddy — Lounge-Bewertungen weltweit') },
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
