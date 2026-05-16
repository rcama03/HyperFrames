/**
 * render-logo.js
 * Exports reise-insider-logo.html canvas to logo_watermark.png
 * with a transparent background (only the logo circle renders).
 * Run once — output is reused by add-logo.js.
 *
 * Usage: node render-logo.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const HTML  = path.resolve(__dirname, '../reise-insider-logo.html');
const OUT   = path.resolve(__dirname, '../logo_watermark.png');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 900, height: 900 }
  });
  try {
    const page = await browser.newPage();
    // Load with ?transparent=1 — skips background fill and stars
    await page.goto(`file://${HTML}?transparent=1`, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 300)); // allow canvas to finish painting

    const canvas = await page.$('#c');
    if (!canvas) throw new Error('Canvas #c not found in logo HTML');

    await canvas.screenshot({ path: OUT, omitBackground: true });
    console.log(`Done → ${OUT}`);
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
