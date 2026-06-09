/**
 * render-cards.mjs — packing-de
 * "9 Packtricks vor dem Flug — Nr. 7 sparst du dir sofort"
 * Resolution: 1280×720
 * Card times are pre-scaled (timings 490.88s → video 475.87s, factor 0.97)
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

const chapHTML = (label, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00E5FF','rgba(0,3,15,0.96)','rgba(0,229,255,0.45)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00E5FF','#000d1a',label)}${hr('rgba(0,229,255,.2)')}
    <div style="font-size:21px;font-weight:800;color:#FFF;line-height:1.4">${text}</div>
  </div></div></body></html>`;

const statHTML = (value, label, sub) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FFC107','rgba(10,8,0,0.96)','rgba(255,193,7,0.45)',520)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FFC107','#1a0f00','STATISTIK')}${hr('rgba(255,193,7,.25)')}
    <div style="font-size:38px;font-weight:900;color:#FFC107;line-height:1.1;margin-bottom:5px">${value}</div>
    <div style="font-size:11px;font-weight:800;color:rgba(255,193,7,.8);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">${label}</div>
    <div style="font-size:14px;color:rgba(255,255,255,.78);line-height:1.4">${sub}</div>
  </div></div></body></html>`;

const keyHTML = (tag, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF6D00','rgba(10,4,0,0.96)','rgba(255,109,0,0.45)',540)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF6D00','#fff',tag)}${hr('rgba(255,109,0,.25)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;

const alertHTML = (text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF3C3C','rgba(20,2,2,0.96)','rgba(255,60,60,0.5)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF3C3C','#fff','⚠ ACHTUNG')}${hr('rgba(255,60,60,.3)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;

const defHTML = (term, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00BCD4','rgba(0,7,12,0.96)','rgba(0,188,212,0.45)',580)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00BCD4','#001a20','DEFINITION')}${hr('rgba(0,188,212,.25)')}
    <div style="font-size:14px;font-weight:800;color:#00BCD4;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">${term}</div>
    <div style="font-size:18px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;

const sourceHTML = (text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
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

const rankHTML = (num, label, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${base}
  .card{position:absolute;left:40px;bottom:${BOTTOM};display:flex;align-items:stretch;
    background:rgba(10,7,0,0.96);border:1.5px solid rgba(255,143,0,0.5);
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
// All inTime/outTime in scaled video timeline (×0.97 from timings.json scene starts)
// Chapter timestamps: 0:00 | 1:24 (84s) | 3:01 (181s) | 4:39 (279s) | 6:13 (373s) | 7:39 (459s)
const cards = [
  // ── Chapter 1: Teure Packfehler (0:00) ───────────────────────────────────────
  { id:'chap-1',       inTime:0.5,   outTime:7.0,   html: chapHTML('INTRO','Teure Packfehler\n— Stiller Geldfresser') },
  { id:'stat-200',     inTime:5.0,   outTime:15.0,  html: statHTML('200€','Zu viel pro Jahr','Reisende zahlen es für vermeidbare Packfehler') },

  // ── Scene 4: Trick 1 — Gewichtsliste (~51.8s) ────────────────────────────────
  { id:'rank-1',       inTime:51.8,  outTime:61.9,  html: rankHTML(1,'Trick Nr. 1','Die Gewichtsliste — leeren Koffer wiegen') },
  { id:'stat-68',      inTime:62.0,  outTime:67.0,  html: statHTML('68%','Aller Reisenden','wissen nicht, wie schwer ihr leerer Koffer ist') },
  { id:'alert-gewicht',inTime:67.3,  outTime:78.0,  html: alertHTML('Hartschalenkoffer wiegt 3–5 kg leer — von 20 kg Freigepäck bleiben nur 15–17 übrig.') },

  // ── Chapter 2: Trick 2 — Rollen (1:24 → ~81.7s) ─────────────────────────────
  { id:'chap-2',       inTime:81.7,  outTime:88.0,  html: chapHTML('KAPITEL 2','Trick 2 —\nRollen statt Falten') },
  { id:'rank-2',       inTime:81.7,  outTime:92.0,  html: rankHTML(2,'Trick Nr. 2','Rollen statt Falten — 30% mehr Platz') },

  // ── Scene 6: Rollen-Statistik (~81.7s) ───────────────────────────────────────
  { id:'stat-roll',    inTime:95.0,  outTime:106.0, html: statHTML('30%','Mehr Platz im Koffer','durch Rollen statt Falten — bestätigt von Militärlogistikern') },

  // ── Scene 7: Ranger-Roll (~96.7s) ────────────────────────────────────────────
  { id:'key-ranger',   inTime:107.0, outTime:113.5, html: keyHTML('★ RANGER-ROLL','Hemden, Hosen, Jacken — auf Minimum komprimieren. Shirts kommen knitterfrei an.') },

  // ── Scene 8: Trick 3 — Packing Cubes (~113.9s) ───────────────────────────────
  { id:'rank-3',       inTime:113.9, outTime:124.0, html: rankHTML(3,'Trick Nr. 3','Packing Cubes — klare Zonen im Koffer') },

  // ── Scene 9: Komprimierungswürfel (~128.7s) ───────────────────────────────────
  { id:'key-cube',     inTime:128.7, outTime:136.0, html: keyHTML('★ KOMPRIMIERUNGSWÜRFEL','Reißverschluss drückt Luft heraus — doppelter Inhalt auf halbes Volumen.') },
  { id:'stat-2x',      inTime:136.5, outTime:143.0, html: statHTML('2×','Inhalt, ½ Volumen','Messbare Physik — kein Mythos') },

  // ── Scene 10: Trick 4 — Schuhe (~143.4s) ─────────────────────────────────────
  { id:'rank-4',       inTime:143.4, outTime:153.5, html: rankHTML(4,'Trick Nr. 4','Schuhe richtig packen — unten, in Schuhbeutel') },
  { id:'key-hohlraum', inTime:158.5, outTime:170.0, html: keyHTML('★ HOHLRAUM NUTZEN','Schuhe innen perfekt für Socken, Ladekabel, kleine Accessories.') },

  // ── Chapter 3: Trick 5 — Capsule Wardrobe (3:01 → ~176.2s) ──────────────────
  { id:'chap-3',       inTime:176.2, outTime:182.5, html: chapHTML('KAPITEL 3','Trick 5 —\nCapsule Wardrobe') },
  { id:'rank-5',       inTime:176.2, outTime:186.5, html: rankHTML(5,'Trick Nr. 5','Capsule Wardrobe — wenige Teile, viele Outfits') },

  // ── Scene 13: Farbpalette (~192.3s) ──────────────────────────────────────────
  { id:'def-capsule',  inTime:192.3, outTime:206.0, html: defHTML('Capsule Wardrobe','Nur kombinierbare Stücke — 5 Hemden = 20 Outfits. Schwarz, Weiß, Grau + Akzentton.') },
  { id:'key-capsule',  inTime:192.3, outTime:204.0, html: keyHTML('★ FARBPALETTE','Schwarz · Weiß · Grau + ein Akzentton — alles kombinierbar, keine Fehlkäufe.') },

  // ── Scene 14: Trick 6 — Flüssigkeiten (~206.8s) ──────────────────────────────
  { id:'rank-6',       inTime:206.8, outTime:217.0, html: rankHTML(6,'Trick Nr. 6','Flüssigkeiten clever verstauen') },
  { id:'key-fluessig', inTime:223.0, outTime:235.0, html: keyHTML('★ FESTE ALTERNATIVEN','Shampoo-Bars, feste Conditioner — umgehen die 100ml-Regel komplett.') },

  // ── Chapter 4: Trick 7 Vertiefung (4:39 → ~254.2s) ───────────────────────────
  { id:'chap-4',       inTime:254.2, outTime:260.5, html: chapHTML('KAPITEL 4','Trick 7 —\nHandgepäck als Gepäckstück') },
  { id:'rank-7',       inTime:254.2, outTime:264.5, html: rankHTML(7,'Trick Nr. 7','Handgepäck statt Aufgabe — spart bis zu 60€ pro Flug') },

  // ── Scene 18-19: Ryanair / Which Travel (~271.5s) ─────────────────────────────
  { id:'stat-52',      inTime:271.5, outTime:282.0, html: statHTML('52€','Pro Strecke','zahlen Europäer im Schnitt für aufgegebenes Gepäck') },
  { id:'src-which',    inTime:286.4, outTime:297.0, html: sourceHTML('Which Travel Studie — Gepäckkosten') },

  // ── Scene 20: Trick 8 — Technik (~299.6s) ────────────────────────────────────
  { id:'rank-8',       inTime:299.6, outTime:310.0, html: rankHTML(8,'Trick Nr. 8','Technik clever packen — dedizierte Technik-Pouch') },

  // ── Scene 21: Powerbanks IATA (~315.5s) ──────────────────────────────────────
  { id:'alert-powerbank',inTime:315.5,outTime:326.0,html: alertHTML('Powerbanks laut IATA-Vorschrift NUR ins Handgepäck — sonst Gepäckstück komplett zurückgehalten.') },
  { id:'src-iata',     inTime:315.5, outTime:326.0, html: sourceHTML('IATA-Vorschrift — Powerbanks') },

  // ── Chapter 5: Trick 9 Vertiefung (6:13 → ~346.7s) ───────────────────────────
  { id:'chap-5',       inTime:346.7, outTime:353.0, html: chapHTML('KAPITEL 5','Trick 9 —\nPachlisten-System') },
  { id:'rank-9',       inTime:346.7, outTime:357.0, html: rankHTML(9,'Trick Nr. 9','Packlisten-System — digitale Masterliste') },

  // ── Scene 24: 42% vergessen (~362.6s) ────────────────────────────────────────
  { id:'stat-42',      inTime:362.6, outTime:373.0, html: statHTML('42%','Der Reisenden','vergessen bei jeder Reise mindestens ein wichtiges Item') },
  { id:'src-umfrage',  inTime:362.6, outTime:373.0, html: sourceHTML('Reisende-Umfrage — vergessene Items') },

  // ── Scene 25: TSA-Schlösser Bonus (~378.5s) ───────────────────────────────────
  { id:'key-tsa',      inTime:378.5, outTime:390.0, html: keyHTML('★ TSA-SCHLÖSSER','US-Behörden öffnen Gepäck ohne Ankündigung — TSA-Schloss wird geöffnet, nicht aufgebrochen.') },

  // ── Scene 26: AirTag (~395.1s) ───────────────────────────────────────────────
  { id:'stat-airtag',  inTime:395.1, outTime:407.0, html: statHTML('3 Mio.','Gepäckstücke','gehen weltweit jährlich verloren — AirTag kostet ~30€') },

  // ── Scene 28: Zusammenfassung (~430.4s) ──────────────────────────────────────
  { id:'stat-200y',    inTime:430.4, outTime:441.0, html: statHTML('200€+','Gespart pro Jahr','wer alle 9 Tricks konsequent umsetzt') },

  // ── Chapter 6: Abschluss (7:39 → ~446.1s) ───────────────────────────────────
  { id:'chap-6',       inTime:446.1, outTime:452.5, html: chapHTML('ABSCHLUSS','Ausblick —\nPack wie ein Profi') },
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
