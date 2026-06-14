/**
 * render-cards.mjs — umstieg-de
 * "WM 2026 Umsteigefluege Frankfurt Muenchen Berlin — der komplette Guide"
 * Resolution: 1280×720
 * Card times pre-scaled: raw × (568.32 / 585.48) = × 0.97070
 * No hook card — first chapter card at Frankfurt Hub (Scene 5)
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
// All times pre-scaled: raw_time × 0.97070  (568.32s voiceover / 585.48s raw)
// Scene starts (raw → scaled):
//  S2=19.48→18.9   S3=35.15→34.1   S5=67.73→65.8   S6=84.02→81.6
//  S8=114.99→111.6  S9=129.55→125.8  S10=147.11→142.8  S14=212.20→206.0
//  S17=261.70→254.1  S19=295.10→286.4  S21=327.75→318.2  S22=343.39→333.3
//  S25=391.81→380.4  S33=534.65→519.1

const cards = [
  // ── Chapter cards (cyan, top-left) — NO hook card ─────────────────────────
  { id: 'chap-frankfurt', inTime:  65.8, outTime:  77.8, html: chapHTML('FRANKFURT AM MAIN HUB',    'Deutschlands größter Flughafen — 60 Mio. Passagiere, aber die größte FALLE') },
  { id: 'chap-muenchen',  inTime: 142.8, outTime: 154.8, html: chapHTML('MÜNCHEN AIRPORT HUB',      'Effizient, kurze Wege, Satellit-Terminal — der smartere WM-Umstieg') },
  { id: 'chap-berlin',    inTime: 206.0, outTime: 218.0, html: chapHTML('BERLIN BRANDENBURG HUB',   'Neuester Hub seit 2020 — moderne Infra, aber zu wenig Nordamerika-Verbindungen') },

  // ── Stats (gold, bottom-left) ─────────────────────────────────────────────
  { id: 'stat-30pct',  inTime:  18.9, outTime:  28.9, html: statHTML('30 %',      'VERBINDUNGEN KRITISCH', 'aller FRA-Umsteigeverbindungen im Sommer 2026 — Airlines verkaufen sie trotzdem') },
  { id: 'stat-2mio',   inTime:  34.1, outTime:  44.1, html: statHTML('2 Mio.',    'DEUTSCHE WM-REISENDE',  'allein aus Deutschland fliegen zur WM — viele via Frankfurt oder München') },
  { id: 'stat-60mio',  inTime:  81.6, outTime:  91.6, html: statHTML('60 Mio.',   'PASSAGIERE PRO JAHR',   'Frankfurt verarbeitet mehr Fluggäste als jeder andere deutsche Flughafen') },
  { id: 'stat-600eu',  inTime: 286.4, outTime: 296.4, html: statHTML('600 €',     'ENTSCHÄDIGUNG MÖGLICH', 'pro Person bei Verspätung >3h — EU-Verordnung 261/2004, kaum jemand fordert es ein') },

  // ── Alerts (red, bottom-left) ─────────────────────────────────────────────
  { id: 'alert-skytrain',  inTime: 125.8, outTime: 135.8, html: alertHTML('Skytrain FRA Terminal 1→2 mind. 15 Min. — und er kommt nicht immer PÜNKTLICH!') },
  { id: 'alert-getrennt',  inTime: 254.1, outTime: 264.1, html: alertHTML('Getrennte Tickets: Keine Airline haftet für deinen Anschluss — verpasst = ALLES verloren!') },
  { id: 'alert-gepaeck',   inTime: 318.2, outTime: 328.2, html: alertHTML('Gepäckband: 20–45 Min. warten beim WM-Umstieg ist TÖDLICH — Handgepäck only!') },

  // ── Keys / Tips (orange, bottom-left) ────────────────────────────────────
  { id: 'key-90min',     inTime: 111.6, outTime: 121.6, html: keyHTML('★ FAUSTREGEL',  '90 Min. in Frankfurt, 75 Min. in München — alles darunter ist Glücksspiel') },
  { id: 'key-fruehflug', inTime: 333.3, outTime: 343.3, html: keyHTML('★ TIPP',        'Frühflug buchen — statistisch pünktlichsten und größter Puffer für Umstieg') },
  { id: 'key-apps',      inTime: 380.4, outTime: 390.4, html: keyHTML('★ APPS',        'Flightradar24 + Airline-App + FlightAware — wer informiert ist, ist VORBEREITET') },

  // ── Sources (green, bottom-right) ─────────────────────────────────────────
  { id: 'src-lufthansa',   inTime:  65.8, outTime:  77.8, html: sourceHTML('Lufthansa Group — Frankfurt & München Hub-Dominanz') },
  { id: 'src-eu261',       inTime: 286.4, outTime: 298.4, html: sourceHTML('EU-Verordnung 261/2004 — Fluggastrechte Europa') },
  { id: 'src-flightradar', inTime: 380.4, outTime: 392.4, html: sourceHTML('Flightradar24 — Live-Flugverfolgung weltweit') },
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
