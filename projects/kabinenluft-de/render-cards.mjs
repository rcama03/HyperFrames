import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import fs from 'fs';
import path from 'path';

const { chromium } = pkg;

const OUT_DIR = './card-frames';
const W = 1920, H = 1080;
const SCALE = 0.973181; // VOICE_DUR / timing_end = 586.896 / 603.07

function chapHTML(label, badge) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;font-family:'Arial Black',Arial,sans-serif;">
<div style="position:absolute;top:48px;left:48px;max-width:640px;">
  <div style="background:rgba(0,3,15,0.50);border-left:6px solid rgba(0,210,230,0.95);padding:18px 26px 18px 22px;border-radius:0 10px 10px 0;">
    <div style="color:rgba(0,210,230,0.85);font-size:15px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">${badge}</div>
    <div style="color:#ffffff;font-size:28px;font-weight:900;line-height:1.2;text-shadow:0 2px 8px rgba(0,0,0,0.8);">${label}</div>
  </div>
</div>
</body></html>`;
}

function statHTML(value, label) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;font-family:'Arial Black',Arial,sans-serif;">
<div style="position:absolute;bottom:130px;left:48px;max-width:560px;">
  <div style="background:rgba(10,8,0,0.50);border-left:6px solid rgba(230,185,0,0.95);padding:16px 24px 16px 22px;border-radius:0 10px 10px 0;">
    <div style="color:rgba(230,185,0,0.95);font-size:42px;font-weight:900;line-height:1;text-shadow:0 2px 10px rgba(0,0,0,0.8);">${value}</div>
    <div style="color:#e8e8e8;font-size:17px;font-weight:700;margin-top:6px;line-height:1.3;">${label}</div>
  </div>
</div>
</body></html>`;
}

function alertHTML(label, badge) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;font-family:'Arial Black',Arial,sans-serif;">
<div style="position:absolute;bottom:130px;left:48px;max-width:600px;">
  <div style="background:rgba(15,0,0,0.50);border-left:6px solid rgba(220,35,35,0.95);padding:16px 24px 16px 22px;border-radius:0 10px 10px 0;">
    <div style="color:rgba(220,35,35,0.95);font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${badge}</div>
    <div style="color:#f0f0f0;font-size:19px;font-weight:700;line-height:1.35;text-shadow:0 2px 8px rgba(0,0,0,0.8);">${label}</div>
  </div>
</div>
</body></html>`;
}

function keyHTML(label, badge) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;font-family:'Arial Black',Arial,sans-serif;">
<div style="position:absolute;bottom:130px;left:48px;max-width:600px;">
  <div style="background:rgba(12,5,0,0.50);border-left:6px solid rgba(225,125,0,0.95);padding:16px 24px 16px 22px;border-radius:0 10px 10px 0;">
    <div style="color:rgba(225,125,0,0.95);font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${badge}</div>
    <div style="color:#f0f0f0;font-size:19px;font-weight:700;line-height:1.35;text-shadow:0 2px 8px rgba(0,0,0,0.8);">${label}</div>
  </div>
</div>
</body></html>`;
}

function sourceHTML(label, badge) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;font-family:'Arial Black',Arial,sans-serif;">
<div style="position:absolute;bottom:130px;right:48px;max-width:480px;">
  <div style="background:rgba(0,10,3,0.50);border-right:6px solid rgba(0,185,80,0.95);padding:14px 22px 14px 22px;border-radius:10px 0 0 10px;text-align:right;">
    <div style="color:rgba(0,185,80,0.95);font-size:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">${badge}</div>
    <div style="color:#e8f0e8;font-size:16px;font-weight:700;line-height:1.3;">${label}</div>
  </div>
</div>
</body></html>`;
}

// Scale raw timing to voice duration
function sc(t) { return Math.round(t * SCALE * 100) / 100; }

const cards = [
  // CHAPTER CARDS (top-left, cyan)
  { id: 'chap-aerotoxic',   inTime: sc(89.45),  outTime: sc(89.45)+5,  html: chapHTML('Aerotoxic Syndrome', 'KAPITEL 2') },
  { id: 'chap-gefaehrdung', inTime: sc(175.17), outTime: sc(175.17)+5, html: chapHTML('Wer Ist Am Stärksten Betroffen?', 'KAPITEL 3') },
  { id: 'chap-fume',        inTime: sc(269.03), outTime: sc(269.03)+5, html: chapHTML('Was Passiert Bei Einem Fume Event?', 'KAPITEL 4') },
  { id: 'chap-langstrecke', inTime: sc(358.98), outTime: sc(358.98)+5, html: chapHTML('Langstrecke & Covid-19', 'KAPITEL 5') },
  { id: 'chap-schutz',      inTime: sc(438.07), outTime: sc(438.07)+5, html: chapHTML('Nasale Schutzmaßnahmen', 'KAPITEL 6') },
  { id: 'chap-zukunft',     inTime: sc(527.24), outTime: sc(527.24)+5, html: chapHTML('Zukunft Der Kabinenluft', 'KAPITEL 7') },

  // STAT CARDS (bottom-left, gold)
  { id: 'stat-millionen', inTime: sc(33.38),  outTime: sc(50.15),  html: statHTML('5 MIO.', 'Internationale WM-Fans im Langstreckenflug') },
  { id: 'stat-50pct',     inTime: sc(50.15),  outTime: sc(65.96),  html: statHTML('50%', 'Recycelte Kabinenluft — typischer Anteil') },
  { id: 'stat-fume',      inTime: sc(103.39), outTime: sc(120.40), html: statHTML('1.000+', 'Fume Events bei EASA gemeldet (2006–2021)') },
  { id: 'stat-feuchte',   inTime: sc(136.76), outTime: sc(152.33), html: statHTML('12%', 'Luftfeuchtigkeit — trockener als die Sahara') },
  { id: 'stat-sauerstoff',inTime: sc(152.33), outTime: sc(175.17), html: statHTML('90%', 'Sauerstoffgehalt im Blut sinkt auf — bei Gesunden') },

  // ALERT CARDS (bottom-left, red)
  { id: 'alert-bleedair',   inTime: sc(65.96),  outTime: sc(89.45),  html: alertHTML('Giftige Organophosphate aus Triebwerksöl — direkt in die Kabine geleitet', '⚠ BLEED AIR GEFAHR') },
  { id: 'alert-aerosole',   inTime: sc(191.53), outTime: sc(209.93), html: alertHTML('Aerosole von Mitpassagieren kaum filterbar — echtes Risiko in vollen WM-Maschinen', '⚠ KEIMGEFAHR') },
  { id: 'alert-tcp',        inTime: sc(285.75), outTime: sc(301.32), html: alertHTML('Geruch nach alten Socken oder Öl = TCP-Nervengift im Triebwerksöl', '⚠ NERVENGIFT') },
  { id: 'alert-monitoring', inTime: sc(316.75), outTime: sc(339.98), html: alertHTML('Kein verpflichtendes Echtzeit-Monitoring auf keinem kommerziellen Flugzeug weltweit', '⚠ KEINE KONTROLLE') },

  // KEY CARDS (bottom-left, orange)
  { id: 'key-hepa',      inTime: sc(120.40), outTime: sc(136.76), html: keyHTML('HEPA-Filter filtert 99,97% der Partikel — aber KEINE Gase oder chemischen Dämpfe', 'FAKTENCHECK') },
  { id: 'key-dreamliner',inTime: sc(226.15), outTime: sc(248.47), html: keyHTML('Boeing 787 Dreamliner: kein Bleed Air — Luft wird elektrisch komprimiert', 'TIPP: FLUGZEUGTYP') },
  { id: 'key-melden',    inTime: sc(339.98), outTime: sc(358.98), html: keyHTML('Fume Event sofort der Crew melden — du hast das Recht dazu. Dokumentiere alles.', 'DEIN RECHT') },
  { id: 'key-wasser',    inTime: sc(374.72), outTime: sc(391.71), html: keyHTML('Mindestens 0,5 Liter Wasser pro 2 Stunden Flugzeit — Mediziner-Empfehlung', 'SCHUTZREGEL') },
  { id: 'key-flugzeug',  inTime: sc(417.91), outTime: sc(438.07), html: keyHTML('787 oder A350 buchen — kein Bleed Air. Typ auf Google Flights oder Kayak prüfen.', 'BUCHUNGSTIPP') },
  { id: 'key-fenster',   inTime: sc(470.95), outTime: sc(496.19), html: keyHTML('Fensterplatz = geringeres Infektionsrisiko — laut MIT-Studie weniger Passagierkontakt', 'BESTER PLATZ') },

  // SOURCE CARDS (bottom-right, green)
  { id: 'src-easa',    inTime: sc(89.45),  outTime: sc(103.39), html: sourceHTML('EASA — Aerotoxic Syndrome offiziell bestätigt', 'QUELLE') },
  { id: 'src-british', inTime: sc(301.32), outTime: sc(316.75), html: sourceHTML('Britische Studie: Neurologische Schäden bei Flugzeugbesatzungen', 'QUELLE') },
  { id: 'src-mit',     inTime: sc(496.19), outTime: sc(512.84), html: sourceHTML('MIT-Studie: Sitzplatz-Risikofaktoren im Langstreckenflug', 'QUELLE') },
];

async function renderCard(browser, card) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(card.html, { waitUntil: 'networkidle' });
  const outPath = path.join(OUT_DIR, `${card.id}.png`);
  await page.screenshot({ path: outPath, fullPage: false, omitBackground: true });
  await page.close();
  console.log(`  rendered ${card.id}.png  [${card.inTime}s → ${card.outTime}s]`);
  return { ...card, file: outPath };
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log(`Rendering ${cards.length} cards...`);
  const results = [];
  for (const card of cards) {
    results.push(await renderCard(browser, card));
  }
  await browser.close();

  const manifest = results.map(c => ({
    id: c.id,
    file: c.file,
    inTime: c.inTime,
    outTime: c.outTime,
  }));
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. manifest.json written with ${manifest.length} cards.`);
}

main().catch(err => { console.error(err); process.exit(1); });
