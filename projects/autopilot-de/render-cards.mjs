/**
 * render-cards.mjs — autopilot-de
 * "Was Autopilot WIRKLICH kann — und was er dir verschweigt"
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
// source     #66BB6A green  btm-right   entry: left

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

function chapHTML(label, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00E5FF','rgba(0,3,15,0.96)','rgba(0,229,255,0.45)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00E5FF','#000d1a',label)}
    ${hr('rgba(0,229,255,.2)')}
    <div style="font-size:21px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
  </div></div></body></html>`;
}

function statHTML(value, label, sub) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FFC107','rgba(10,8,0,0.96)','rgba(255,193,7,0.45)',520)}
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
  ${btmCard('#FF6D00','rgba(10,4,0,0.96)','rgba(255,109,0,0.45)',540)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF6D00','#fff',tag)}
    ${hr('rgba(255,109,0,.25)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;
}

function alertHTML(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF3C3C','rgba(20,2,2,0.96)','rgba(255,60,60,0.5)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF3C3C','#fff','⚠ ACHTUNG')}
    ${hr('rgba(255,60,60,.3)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;
}

function defHTML(term, text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00BCD4','rgba(0,7,12,0.96)','rgba(0,188,212,0.45)',580)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00BCD4','#001a20','DEFINITION')}
    ${hr('rgba(0,188,212,.25)')}
    <div style="font-size:14px;font-weight:800;color:#00BCD4;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">${term}</div>
    <div style="font-size:18px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;
}

function sourceHTML(text) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${base}
  .card{position:absolute;right:40px;bottom:${BOTTOM};display:flex;align-items:center;gap:10px;
    background:rgba(2,11,5,0.92);border:1px solid rgba(76,175,80,0.35);
    box-shadow:0 4px 16px rgba(0,0,0,.5);border-radius:8px;padding:10px 18px;
    font-family:'Montserrat','Arial Black',sans-serif;}
  </style>
  </head><body><div class="card">
    <div style="font-size:11px;font-weight:700;color:#66BB6A;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap">Quelle:</div>
    <div style="font-size:13px;color:rgba(255,255,255,.88);font-weight:600;white-space:nowrap">${text}</div>
  </div></body></html>`;
}

// ── Card definitions ──────────────────────────────────────────────────────────
// Timings scaled from timings.json (652.48s) → voice (635.784s) by factor 0.9744
// Chapter markers align with user-specified timestamps:
//   0:00 Autopilot-Schock | 1:34 Start | 3:11 Autoland | 4:48 Air France 447
//   6:25 Zukunft | 8:07 KI im Cockpit | 9:36 Finale Geheimnis
const cards = [
  // ── Chapter 1: Autopilot-Schock (0:00) ───────────────────────────────────────
  { id:'chap-1',       inTime:1.0,   outTime:8.0,   entry:'left',   html: chapHTML('INTRO','Autopilot-Schock\n— Was du nicht weißt') },
  { id:'stat-99',      inTime:4.5,   outTime:14.0,  entry:'right',  html: statHTML('99%','Autopilot-Anteil','Auf Langstrecke fliegt er fast die gesamte Strecke') },

  // ── Scene 4: Geschichte (52s) ─────────────────────────────────────────────────
  { id:'stat-1914',    inTime:52.0,  outTime:62.0,  entry:'right',  html: statHTML('1914','Erster Autopilot','Lawrence Sperry — Demo mit offenen Armen über Paris') },

  // ── Scene 5: 3 kritische Phasen (70s) ────────────────────────────────────────
  { id:'alert-phasen', inTime:70.0,  outTime:82.0,  entry:'right',  html: alertHTML('Start · Landung · Schlechtwetter — Autopilot ist genau dann ausgeschaltet.') },

  // ── Chapter 2: Start — Gefährlichste Phase (1:34 → ~92.5s scaled) ────────────
  { id:'chap-2',       inTime:92.5,  outTime:99.0,  entry:'left',   html: chapHTML('KAPITEL 2','Start —\nGefährlichste Phase') },
  { id:'alert-1000ft', inTime:96.0,  outTime:110.0, entry:'bottom', html: alertHTML('Bis 1.000 Fuß Höhe — kein Autopilot. Nur der Mensch hat das Ruder.') },

  // ── Scene 7: V1-Entscheidung (111s) ──────────────────────────────────────────
  { id:'key-v1',       inTime:111.0, outTime:124.0, entry:'bottom', html: keyHTML('★ V1-ENTSCHEIDUNG','Abbruch oder Weiterfliegen in Bruchteilen von Sekunden — falsch entschieden = Katastrophe.') },

  // ── Scene 10: Pilotenmüdigkeit (163.5s) ──────────────────────────────────────
  { id:'stat-faa',     inTime:163.5, outTime:175.0, entry:'right',  html: statHTML('20–25%','Aller Flugunfälle','beteiligt ist Pilotenmüdigkeit — laut FAA-Schätzung') },
  { id:'src-faa',      inTime:164.0, outTime:175.0, entry:'left',   html: sourceHTML('FAA-Schätzung zu Pilotenmüdigkeit') },

  // ── Chapter 3: Autoland — CAT III ILS (3:11 → ~186.2s scaled) ───────────────
  { id:'chap-3',       inTime:186.2, outTime:193.0, entry:'left',   html: chapHTML('KAPITEL 3','Autoland —\nCAT III ILS') },
  { id:'def-catiii',   inTime:193.5, outTime:207.0, entry:'top',    html: defHTML('CAT III ILS','Vollautomatische Landung — funktioniert auch bei null Meter Sicht im Nebel') },

  // ── Scene 12: Autoland-Grenzen (203.9s) ──────────────────────────────────────
  { id:'alert-autoland',inTime:209.0,outTime:221.0, entry:'right',  html: alertHTML('Kein Autoland-Bodensystem + schlechte Sicht → Pilot muss manuell durch den Nebel.') },

  // ── Scene 14: Clear Air Turbulenz (244s) ─────────────────────────────────────
  { id:'alert-cat',    inTime:244.0, outTime:258.0, entry:'top',    html: alertHTML('Clear Air Turbulenz: Unsichtbar — kein Radar zeigt sie. Sie trifft ohne Warnung.') },
  { id:'src-qatar',    inTime:248.0, outTime:263.0, entry:'left',   html: sourceHTML('Qatar Airways 2023 — 40m Absturz, 12 Verletzte') },

  // ── Scene 15: Das Geheimnis (266s) ───────────────────────────────────────────
  { id:'key-kontext',  inTime:266.0, outTime:278.0, entry:'bottom', html: keyHTML('★ DAS GEHEIMNIS','Autopilot ist präziser als Menschen — aber er versteht keinen Kontext.') },

  // ── Chapter 4: Air France 447 (4:48 → ~280.9s scaled) ───────────────────────
  { id:'chap-4',       inTime:280.9, outTime:287.0, entry:'left',   html: chapHTML('KAPITEL 4','Air France 447 —\nDas Paradox') },
  { id:'alert-af447',  inTime:284.0, outTime:298.0, entry:'right',  html: alertHTML('Pitot-Rohre eingefroren → Autopilot schaltet ab. Piloten fliegen 3 Minuten in den Absturz.') },

  // ── Scene 17: Skill Degradation (307s) ───────────────────────────────────────
  { id:'def-skill',    inTime:307.0, outTime:321.0, entry:'top',    html: defHTML('Skill Degradation','Piloten verlieren manuelle Fähigkeiten durch zu wenig manuelles Fliegen') },

  // ── Scene 18-19: Luftfahrt-Philosophie (326s) ────────────────────────────────
  { id:'key-airbus',   inTime:326.0, outTime:340.0, entry:'bottom', html: keyHTML('★ AIRBUS vs. BOEING','Airbus: Fly-by-Wire mit Grenzen | Boeing: Pilot hat immer das letzte Wort') },

  // ── Scene 19: MCAS Boeing 737 MAX (346s) ─────────────────────────────────────
  { id:'alert-mcas',   inTime:346.0, outTime:360.0, entry:'right',  html: alertHTML('Boeing 737 MAX — MCAS drückte Nase nach unten: 346 Tote. Das System entschied falsch.') },

  // ── Chapter 5: Zukunft: Einpiloten-Cockpit (6:25 → ~375.8s scaled) ──────────
  { id:'chap-5',       inTime:375.8, outTime:382.0, entry:'left',   html: chapHTML('KAPITEL 5','Zukunft:\nEinpiloten-Cockpit') },
  { id:'key-einpilot', inTime:382.5, outTime:396.0, entry:'bottom', html: keyHTML('★ AIRBUS TESTET ES','Ein Pilot vorne — der andere am Boden per Fernsteuerung assistiert.') },

  // ── Scene 23: Umfrage-Schock (415.6s) ────────────────────────────────────────
  { id:'stat-60',      inTime:415.6, outTime:428.0, entry:'right',  html: statHTML('60%','Der Passagiere','glauben irrtümlich: Autopilot handelt im Notfall selbstständig') },

  // ── Scene 24-25: Captain Sully (444s) ────────────────────────────────────────
  { id:'src-sully',    inTime:444.0, outTime:458.0, entry:'left',   html: sourceHTML('US Airways 1549 — Sully, Hudson River 2009') },
  { id:'stat-208',     inTime:466.0, outTime:478.0, entry:'right',  html: statHTML('208 s','Reaktionszeit Sully','kein Algorithmus hätte diese Entscheidung getroffen') },

  // ── Chapter 6: KI im Cockpit (8:07 → ~475.4s scaled) ────────────────────────
  { id:'chap-6',       inTime:475.4, outTime:482.0, entry:'left',   html: chapHTML('KAPITEL 6','KI im\nCockpit') },
  { id:'def-garmin',   inTime:482.5, outTime:496.0, entry:'top',    html: defHTML('Garmin Autoland','Passagier drückt Knopf — Kleinflugzeug landet vollautomatisch') },

  // ── Scene 27: KI-Grenzen (506s) ──────────────────────────────────────────────
  { id:'alert-ki',     inTime:506.0, outTime:520.0, entry:'right',  html: alertHTML('KI kann nicht improvisieren — jeder Notfall ist einzigartig. Das ist die fundamentale Schwäche.') },

  // ── Scene 29: Flugsicherheit (527.8s) ────────────────────────────────────────
  { id:'stat-risk',    inTime:527.8, outTime:541.0, entry:'right',  html: statHTML('1 : 11 Mio.','Absturzrisiko','Fliegen ist die sicherste Transportform der Welt') },

  // ── Chapter 7: Finale Geheimnis (9:36 → ~561.8s scaled) ─────────────────────
  { id:'chap-7',       inTime:561.8, outTime:568.0, entry:'left',   html: chapHTML('KAPITEL 7','Das\nFinale Geheimnis') },
  { id:'alert-paradox',inTime:565.0, outTime:579.0, entry:'bottom', html: alertHTML('Je mehr wir dem Autopiloten vertrauen — desto gefährlicher wird sein Ausfall.') },

  // ── Scene 33: Fünf Wahrheiten (597.9s) ───────────────────────────────────────
  { id:'key-5facts',   inTime:597.9, outTime:612.0, entry:'bottom', html: keyHTML('★ 5 WAHRHEITEN','99% Autopilot · Start/Landung manuell · Müdigkeit real · AF447 lehrreich · Zukunft offen') },
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
