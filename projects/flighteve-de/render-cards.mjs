/**
 * render-cards.mjs — flighteve-de
 * "9 Abend-vor-dem-Flug-Fehler — Nr. 6 kostet dich deinen Urlaub"
 * Resolution: 1280×720
 * Card times are pre-scaled (timings 569.43s → voiceover 555.43s, factor 0.9754)
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
    box-shadow:0 4px 16px rgba(0,0,0,.5);border-radius:8px;padding:10px 18px;
    font-family:'Montserrat','Arial Black',sans-serif;}
  </style>
  </head><body><div class="card">
    <div style="font-size:11px;font-weight:700;color:#66BB6A;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
    <div style="font-size:13px;color:rgba(255,255,255,.88);font-weight:600;white-space:nowrap">${text}</div>
  </div></body></html>`;

const rankHTML = (num, label, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${base}
  .card{position:absolute;left:40px;bottom:${BOTTOM};display:flex;align-items:stretch;
    background:rgba(10,7,0,0.50);border:1.5px solid rgba(255,143,0,0.5);
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

// ── Card definitions ──────────────────────────────────────────────────────────
// All inTime/outTime in scaled voiceover timeline (×0.9754 from timings.json scene starts)
// Chapter timestamps: 0:00 | 1:41 (101s) | 3:22 (202s) | 4:41 (281s) | 6:18 (378s) | 7:53 (473s)
const cards = [
  // ── Chapter 1: Unsichtbare Urlaubs-Killer (0:00) ──────────────────────────
  { id: 'chap-1',          inTime: 0.5,   outTime: 6.0,   html: chapHTML('INTRO', 'Unsichtbare Urlaubs-Killer') },
  { id: 'stat-50mio',      inTime: 22.0,  outTime: 32.0,  html: statHTML('50 Mio.', 'IATA STUDIE', 'Passagiere verpassen Flug oder verlieren Geld') },
  { id: 'src-iata',        inTime: 22.0,  outTime: 30.0,  html: sourceHTML('IATA — Reiseverband Studie') },

  // ── Scene 3: Fehler Nr. 1 — Koffer (~39s) ────────────────────────────────
  { id: 'rank-1',          inTime: 39.5,  outTime: 50.0,  html: rankHTML(1, 'FEHLER NR. 1', 'Koffer erst kurz vor dem Schlafengehen packen') },
  { id: 'src-expedia',     inTime: 40.0,  outTime: 47.0,  html: sourceHTML('Expedia — Umfrage 10.000 Reisende') },

  // ── Scene 4: Tipp Packliste (~60s) ────────────────────────────────────────
  { id: 'key-packlist',    inTime: 61.0,  outTime: 71.0,  html: keyHTML('★ TIPP', 'Digitale Packliste — 2 Tage vor dem Flug abhaken') },

  // ── Scene 5: Fehler Nr. 2 — Check-in (~78s) ──────────────────────────────
  { id: 'rank-2',          inTime: 78.5,  outTime: 88.0,  html: rankHTML(2, 'FEHLER NR. 2', 'Online Check-in vergessen oder ignoriert') },

  // ── Chapter 2: Nummer 2 — (1:41) ─────────────────────────────────────────
  { id: 'chap-2',          inTime: 101.0, outTime: 107.0, html: chapHTML('KAPITEL 2', 'Nummer 2 — Online Check-in') },
  { id: 'stat-55eur',      inTime: 108.0, outTime: 117.5, html: statHTML('55 €', 'BILLIGFLIEGER EXTRA', 'Check-in am Schalter — pro Person') },

  // ── Scene 7: Fehler Nr. 3 — Abflugzeit (~121s) ───────────────────────────
  { id: 'rank-3',          inTime: 121.5, outTime: 131.5, html: rankHTML(3, 'FEHLER NR. 3', 'Abflugzeit am Abend nicht noch einmal gecheckt') },

  // ── Scene 8: Airline App (~140s) ─────────────────────────────────────────
  { id: 'key-airline',     inTime: 140.5, outTime: 150.5, html: keyHTML('★ TIPP', 'Airline-App installieren + Push-Benachrichtigungen aktivieren') },

  // ── Scene 9: Fehler Nr. 4 — Alkohol (~160s) ──────────────────────────────
  { id: 'rank-4',          inTime: 160.5, outTime: 170.5, html: rankHTML(4, 'FEHLER NR. 4', 'Alkohol am Vorabend — stört Schlaf massiv') },

  // ── Scene 10: Ausgeschlafen (~179s) ──────────────────────────────────────
  { id: 'key-sleep',       inTime: 179.0, outTime: 189.0, html: keyHTML('WICHTIG', 'Ausgeschlafen reisen = schnellere Entscheidungen am Flughafen') },

  // ── Chapter 3: Nummer 5 — (3:22) ─────────────────────────────────────────
  { id: 'chap-3',          inTime: 201.5, outTime: 207.5, html: chapHTML('KAPITEL 3', 'Nummer 5 — Handgepäck') },
  { id: 'rank-5',          inTime: 208.0, outTime: 218.0, html: rankHTML(5, 'FEHLER NR. 5', 'Handgepäck-Regeln der Airline nicht gecheckt') },

  // ── Scene 12: Alert Gate-Gebühr (~221s) ──────────────────────────────────
  { id: 'alert-gate',      inTime: 222.0, outTime: 232.0, html: alertHTML('Bis zu 70€ direkt am Gate — keine Diskussion, keine Kulanz') },

  // ── Scene 14: Fehler Nr. 6 — Reisepass (~260s) ───────────────────────────
  { id: 'rank-6',          inTime: 261.0, outTime: 271.0, html: rankHTML(6, 'FEHLER NR. 6', 'Reisepass Restgültigkeit nicht geprüft') },

  // ── Chapter 4: Nummer 6 — (4:41) ─────────────────────────────────────────
  { id: 'chap-4',          inTime: 281.0, outTime: 287.0, html: chapHTML('KAPITEL 4', 'Nummer 6 — Reisepass') },
  { id: 'alert-passport',  inTime: 289.0, outTime: 299.0, html: alertHTML('Grenzbeamter schickt zurück — kein Ermessen. Urlaub, Hotel, Flüge: alles verloren.') },

  // ── Scene 16: Aktion Pass prüfen (~301s) ─────────────────────────────────
  { id: 'key-passport',    inTime: 302.0, outTime: 312.0, html: keyHTML('★ AKTION HEUTE', 'Pass holen — 6 Monate nach Rückreise addieren — gültig?') },

  // ── Scene 17: Fehler Nr. 7 — Transfer (~321s) ────────────────────────────
  { id: 'rank-7',          inTime: 322.0, outTime: 332.0, html: rankHTML(7, 'FEHLER NR. 7', 'Transfer zum Flughafen nicht organisiert') },

  // ── Scene 18: Tipp Transfer (~339s) ──────────────────────────────────────
  { id: 'key-transfer',    inTime: 339.5, outTime: 349.5, html: keyHTML('★ TIPP', 'Transfer vorab buchen — immer +30 Min Puffer einplanen') },

  // ── Scene 19: Fehler Nr. 8 + USA Stat (~358s) ────────────────────────────
  { id: 'rank-8',          inTime: 358.5, outTime: 367.5, html: rankHTML(8, 'FEHLER NR. 8', 'Auslands-Krankenversicherung nicht geprüft') },
  { id: 'stat-usa',        inTime: 368.0, outTime: 377.0, html: statHTML('30.000 $', 'USA ARZTBESUCH', 'Durchschnitt nach Unfall — ohne Versicherung') },

  // ── Chapter 5: Nummer 8 — (6:18) ─────────────────────────────────────────
  { id: 'chap-5',          inTime: 378.0, outTime: 384.0, html: chapHTML('KAPITEL 5', 'Nummer 8 — Krankenversicherung') },
  { id: 'stat-10eur',      inTime: 378.5, outTime: 388.0, html: statHTML('10 €', 'REISEVERSICHERUNG', 'Für 2 Wochen Auslandsschutz — kein Risiko') },

  // ── Scene 22: Fehler Nr. 9 — Docs online (~416s) ─────────────────────────
  { id: 'rank-9',          inTime: 416.5, outTime: 426.5, html: rankHTML(9, 'FEHLER NR. 9', 'Alle wichtigen Dokumente nur online gespeichert') },

  // ── Scene 23: Offline-Docs Tipp (~435s) ──────────────────────────────────
  { id: 'key-offline',     inTime: 435.5, outTime: 445.5, html: keyHTML('7 MINUTEN', 'Boarding-Pass + Hotelbuchung + Reisepass offline speichern') },

  // ── Scene 24: Bonus Bargeld (~455s) ──────────────────────────────────────
  { id: 'key-bargeld',     inTime: 456.0, outTime: 465.5, html: keyHTML('★ BONUS-TIPP', 'Kein Wechsel am Flughafen — bis 15% Aufschlag. Hausbank nutzen.') },

  // ── Chapter 6: Komplette Abend-Checkliste (7:53) ─────────────────────────
  { id: 'chap-6',          inTime: 473.0, outTime: 479.0, html: chapHTML('ABSCHLUSS', 'Komplette Abend-Checkliste') },
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
