/**
 * Canonical card HTML templates — shared across all HyperFrames projects.
 * Import specific templates as needed in each project's render-cards.mjs.
 *
 * Card background opacity: 0.50 (translucent — video shows through)
 * Resolution target: 1280×720  (BOTTOM / TOP constants set per-project)
 */

// ── Rank card — LOCKED STYLE ─────────────────────────────────────────────────
// Used for all list/ranking-style videos (#1–#N trick/tip/fact cards).
// Orange gradient number block on left, dark translucent body on right.
export function rankHTML(num, label, text, { bottom = '165px', base = '' } = {}) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
  ${base}
  .card{position:absolute;left:40px;bottom:${bottom};display:flex;align-items:stretch;
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
}
