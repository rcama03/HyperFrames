/**
 * render-cards.mjs — handgepaeck-de
 * "Neue Handgepaeck Regeln Juni 2026 - was jetzt gilt"
 * Resolution: 1280×720
 * Card times are pre-scaled (timings 689.23s → voiceover 671.71s, factor 0.9746)
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

const chapHTML = (label, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00E5FF','rgba(0,3,15,0.50)','rgba(0,229,255,0.45)',580)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${label ? bdg('#00E5FF','#000d1a',label) : ''}${hr('rgba(0,229,255,.2)')}
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
  ${btmCard('#FF6D00','rgba(10,4,0,0.50)','rgba(255,109,0,0.45)',560)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF6D00','#fff',tag)}${hr('rgba(255,109,0,.25)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;

const alertHTML = (text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${btmCard('#FF3C3C','rgba(20,2,2,0.50)','rgba(255,60,60,0.5)',580)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#FF3C3C','#fff','⚠ ACHTUNG')}${hr('rgba(255,60,60,.3)')}
    <div style="font-size:19px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
  </div></div></body></html>`;

const defHTML = (term, text) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
  ${topCard('#00BCD4','rgba(0,7,12,0.50)','rgba(0,188,212,0.45)',600)}
  </head><body><div class="card"><div class="stripe"></div><div class="inner">
    ${bdg('#00BCD4','#001a20','DEFINITION')}${hr('rgba(0,188,212,.25)')}
    <div style="font-size:14px;font-weight:800;color:#00BCD4;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">${term}</div>
    <div style="font-size:17px;font-weight:700;color:#FFF;line-height:1.45">${text}</div>
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

// ── Card definitions ──────────────────────────────────────────────────────────
// All inTime/outTime pre-scaled (×0.9746 from timings.json scene starts)
// Chapter timestamps: 0:00 | 1:16 (75.5s) | 2:53 (169.5s) | 4:27 (260.5s)
//                     5:45 (336.5s) | 7:05 (415.5s) | 8:30 (498s) | 9:51 (577s)
const cards = [
{ id: 'stat-60pct',   inTime: 22.0,  outTime: 32.0,  html: statHTML('60%', 'EUROPÄISCHE STUDIE', 'Reisende verstehen Handgepäck-Regeln FALSCH') },
  { id: 'src-eu',       inTime: 22.0,  outTime: 30.0,  html: sourceHTML('Europäischer Verbraucherverband') },

  // ── Scene 4: Neue Maße (~54s) ──────────────────────────────────────────────
  { id: 'key-eusize',   inTime: 55.0,  outTime: 65.0,  html: keyHTML('NEUE MASSE AB JUNI 2026', '55 × 40 × 23 cm — einheitlicher EU-Standard') },

  // ── Chapter 2: Welche Taschen (1:16 → ~75.5s) ─────────────────────────────
  { id: 'chap-2',       inTime: 75.5,  outTime: 81.5,  html: chapHTML('KAPITEL 2', 'Welche Taschen passen NICHT mehr') },
  { id: 'stat-30pct',   inTime: 82.5,  outTime: 92.5,  html: statHTML('30%', 'ALLER HANDGEPÄCKSTÜCKE', 'passen nicht mehr — betroffen in ganz Europa') },

  // ── Scene 6: Gewichtslimit (~94.8s) ───────────────────────────────────────
  { id: 'stat-10kg',    inTime: 95.5,  outTime: 105.5, html: statHTML('10 kg', 'NEUES GEWICHTSLIMIT', 'für Kabinenhandgepäck — europaweit verbindlich') },

  // ── Scene 7: 100ml Regel (~113.6s) ────────────────────────────────────────
  { id: 'alert-100ml',  inTime: 113.5, outTime: 123.5, html: alertHTML('100ml-Regel NICHT überall abgeschafft — Flughafen VOR Reise prüfen!') },
  { id: 'src-iata',     inTime: 114.0, outTime: 122.0, html: sourceHTML('IATA-Studie 2024 — CT-Scanner') },

  // ── Scene 9: Laptops (~147.7s) ────────────────────────────────────────────
  { id: 'key-laptops',  inTime: 148.0, outTime: 158.0, html: keyHTML('★ NEU: ZEITERSPARNIS', 'Laptops & Tablets: nicht mehr aus der Tasche nehmen — +4 Min gespart') },

  // ── Chapter 3: Persönliche Gegenstände (2:53 → ~169.5s) ──────────────────
  { id: 'chap-3',       inTime: 169.5, outTime: 175.5, html: chapHTML('KAPITEL 3', 'Neue Persönliche-Gegenstands-Regel') },
  { id: 'alert-pers',   inTime: 176.0, outTime: 186.0, html: alertHTML('Persönlicher Gegenstand: strenger, kleiner — bei einigen Airlines nur noch GEGEN Aufpreis') },

  // ── Scene 11: Ryanair Gate-Gebühr (~184.1s) ───────────────────────────────
  { id: 'stat-50eur',   inTime: 185.0, outTime: 195.0, html: statHTML('50→80 €', 'RYANAIR GATE-GEBÜHR', 'für zu großes Handgepäck — ab Juni 2026') },

  // ── Scene 12: Powerbanks (~201.8s) ────────────────────────────────────────
  { id: 'alert-power',  inTime: 202.5, outTime: 212.5, html: alertHTML('Powerbanks >100 Wh: Genehmigung der Airline nötig — viele erteilen sie NICHT mehr automatisch') },

  // ── Scene 13: CT-Scanner Definition (~221.9s) ─────────────────────────────
  { id: 'def-ct',       inTime: 228.5, outTime: 240.5, html: defHTML('CT-SCANNER', '3D-Bild deines Gepäcks — JEDEN Gegenstand digital drehen, ohne die Tasche zu öffnen') },

  // ── Chapter 4: Medikamente (4:27 → ~260.5s) ──────────────────────────────
  { id: 'chap-4',       inTime: 260.5, outTime: 266.5, html: chapHTML('KAPITEL 4', 'Neue Regelung für Medikamente & Flüssigkeiten') },
  { id: 'alert-medi',   inTime: 261.5, outTime: 271.5, html: alertHTML('Flüssigmedikamente >100 ml: ärztliches Attest ZWINGEND — in Landessprache oder Englisch') },

  // ── Scene 17: Duty-Free Falle (~296.3s) ───────────────────────────────────
  { id: 'alert-duty',   inTime: 305.0, outTime: 315.0, html: alertHTML('Duty-Free am Umsteigeflughafen: wird TROTZDEM abgenommen — keine Ausnahme') },
  { id: 'key-steb',     inTime: 318.5, outTime: 328.5, html: keyHTML('★ TRICK', 'Duty-Free nur am LETZTEN Abflugort. Bei Transfer: STEB-Beutel verlangen') },

  // ── Chapter 5: E-Zigaretten (5:45 → ~336.5s) ─────────────────────────────
  { id: 'chap-5',       inTime: 336.5, outTime: 342.5, html: chapHTML('KAPITEL 5', 'Neue Regeln für E-Zigaretten & Verbotenes') },
  { id: 'alert-vape',   inTime: 337.5, outTime: 347.5, html: alertHTML('E-Zigaretten & Vapes: max. 2 pro Person — mehr = KONFISZIERUNG ohne Ausnahme') },

  // ── Scene 20: Neue verbotene Gegenstände (~353.8s) ────────────────────────
  { id: 'alert-tools',  inTime: 354.0, outTime: 364.0, html: alertHTML('Neu verboten: Werkzeugsets, Multifunktionstools, Kosmetik mit Metallklingen') },

  // ── Scene 21: IATA Konfiszierungen (~373.5s) ──────────────────────────────
  { id: 'stat-1mio',    inTime: 374.0, outTime: 384.0, html: statHTML('1,2 Mio.', 'TÄGLICH KONFISZIERT', 'Gegenstände weltweit an Sicherheitskontrollen') },
  { id: 'src-iata2',    inTime: 374.5, outTime: 382.0, html: sourceHTML('IATA-Daten 2025 — konfiszierte Gegenstände') },

  // ── Scene 22-23: Milliarden-Geschäft (~397.6s) ───────────────────────────
  { id: 'stat-3mrd',    inTime: 398.0, outTime: 408.0, html: statHTML('3,8 Mrd. €', 'GEPÄCKGEBÜHREN 2024', 'europäische Low-Cost-Carrier — Tendenz steigend') },

  // ── Chapter 6: Handgepäck-Gebühr (7:05 → ~415.5s) ────────────────────────
  { id: 'chap-6',       inTime: 415.5, outTime: 421.5, html: chapHTML('KAPITEL 6', 'Handgepäck-Gebühr — Wie viel kostet es?') },

  // ── Scene 24: Priority Boarding Trick (~433.8s) ───────────────────────────
  { id: 'key-priority', inTime: 434.5, outTime: 444.5, html: keyHTML('★ INSIDER-TRICK', 'Priority Boarding: 5–15€ extra — rettet dich vor bis zu 80€ Gate-Strafe') },

  // ── Scene 25: Konkrete Checkliste (~454.4s) ───────────────────────────────
  { id: 'key-messen',   inTime: 454.5, outTime: 464.5, html: keyHTML('★ SOFORT MESSEN', 'Handgepäck: 55×40×23 cm · max 10 kg · Flughafen-CT-Typ prüfen') },

  // ── Scene 26: Empfohlene Taschen (~479.3s) ────────────────────────────────
  { id: 'key-bags',     inTime: 479.5, outTime: 489.5, html: keyHTML('★ TIPP: KONFORME TASCHEN', 'Osprey Farpoint 40, Cabin Zero, Samsonite Proxis — IATA 2026 konform') },

  // ── Chapter 7: Was passiert wenn Nein (8:30 → ~498s) ─────────────────────
  { id: 'chap-7',       inTime: 498.0, outTime: 504.0, html: chapHTML('KAPITEL 7', 'Passiert, Wenn Du Am Gate Nein Sagst') },
  { id: 'alert-gate',   inTime: 504.5, outTime: 514.5, html: alertHTML('Am Gate Nein sagen = kein Boarding. Verpasster Flug = KEINE Entschädigung') },

  // ── Scene 28: Deine Rechte (~515.4s) ──────────────────────────────────────
  { id: 'key-rechte',   inTime: 515.5, outTime: 525.5, html: keyHTML('DEINE RECHTE', 'Ungerechtfertigte Gebühr? Beschwerde bei nationaler Luftfahrtbehörde — 88% ungenutzt') },

  // ── Chapter 8: Schnelle Checkliste (9:51 → ~577s) ─────────────────────────
  { id: 'chap-8',       inTime: 577.0, outTime: 583.0, html: chapHTML('ABSCHLUSS', 'Schnelle Checkliste Vor dem Flug') },
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
