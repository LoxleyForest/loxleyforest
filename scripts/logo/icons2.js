// Icon candidates, drawn in a 512 square.
const fs = require('fs');
const E2 = require('./emblem2.js');
const C = { deep: '#1a2e1a', gold: '#c4a265', goldL: '#d8bb7c', cream: '#f7e4bd', linen: '#f7f3ed' };
const spire = (cx, ty, by, hw) => { const h = by - ty; return `M${cx} ${ty}C${cx - hw * 0.3} ${ty + h * 0.52} ${cx - hw * 0.68} ${by - h * 0.1} ${cx - hw} ${by}Q${cx - hw * 0.66} ${by - 7} ${cx - hw / 3} ${by}Q${cx} ${by - 7} ${cx + hw / 3} ${by}Q${cx + hw * 0.66} ${by - 7} ${cx + hw} ${by}C${cx + hw * 0.68} ${by - h * 0.1} ${cx + hw * 0.3} ${ty + h * 0.52} ${cx} ${ty}Z`; };
const finial = (cx, ty, s) => `M${cx} ${ty - 30 * s}C${cx + 1.5 * s} ${ty - 14 * s} ${cx + 6 * s} ${ty - 4 * s} ${cx + 6 * s} ${ty + 2 * s}H${cx - 6 * s}C${cx - 6 * s} ${ty - 4 * s} ${cx - 1.5 * s} ${ty - 14 * s} ${cx} ${ty - 30 * s}Z`;
const tile = (inner, rx = 112) => `<rect width="512" height="512" rx="${rx}" fill="${C.deep}"/>${inner}`;

// A: the twin spires hung in their cradle. No arch, no trunks.
function A() {
  const big = [282, 120, 360, 112], small = [176, 214, 358, 66], hub = [256, 452];
  return tile(`
<g stroke="${C.gold}" stroke-linecap="round" fill="none">
<path d="M${hub[0]} ${hub[1]}L58 250M${hub[0]} ${hub[1]}L454 236" stroke-width="7"/>
<path d="M96 372L${hub[0]} ${hub[1]}L420 372" stroke-width="9"/>
</g>
<path d="${spire(...small)}" fill="#e8d3a6"/>
<path d="${spire(...big)}" fill="${C.cream}" stroke="${C.deep}" stroke-width="10" stroke-linejoin="round"/>
<path d="${finial(big[0], big[1], 1.3)}${finial(small[0], small[1], 1)}" fill="${C.goldL}"/>
<rect x="80" y="362" width="356" height="16" rx="3" fill="${C.gold}"/>
<circle cx="${hub[0]}" cy="${hub[1]}" r="12" fill="${C.gold}"/>`);
}
// B: the arch, drawn fine, the spires large inside it, the deck and the cradle.
function B() {
  const ar = (i) => { const x0 = 104 + i, x1 = 408 - i, r = (x1 - x0) / 2, cy = 70 + i + r; return `M${x0} 470V${cy}A${r} ${r} 0 0 1 ${x1} ${cy}V470`; };
  const big = [276, 126, 350, 94], small = [190, 212, 348, 58], hub = [256, 430];
  return tile(`
<path d="${ar(0)}" fill="none" stroke="${C.gold}" stroke-width="9" stroke-linecap="round"/>
<g stroke="${C.gold}" stroke-linecap="round" fill="none"><path d="M${hub[0]} ${hub[1]}L111 236M${hub[0]} ${hub[1]}L401 228" stroke-width="6"/></g>
<path d="${spire(...small)}" fill="#e8d3a6"/>
<path d="${spire(...big)}" fill="${C.cream}" stroke="${C.deep}" stroke-width="9" stroke-linejoin="round"/>
<path d="${finial(big[0], big[1], 1.1)}${finial(small[0], small[1], 0.85)}" fill="${C.goldL}"/>
<rect x="118" y="350" width="276" height="14" rx="3" fill="${C.gold}"/>
<circle cx="${hub[0]}" cy="${hub[1]}" r="10" fill="${C.gold}"/>`);
}
// E: the full engraving in the tile, for the phone home screen.
function Eng() {
  const eh = 474, ew = (eh * 300) / E2.HT;
  return tile(`<g transform="translate(${((512 - ew) / 2).toFixed(1)} ${((512 - eh) / 2 + 2).toFixed(1)}) scale(${(eh / E2.HT).toFixed(4)})">${E2.emblem('color', { id: 'ie', penWeight: 1.7 })}</g>`);
}
module.exports = { A, B, Eng, C };
if (require.main === module) {
  const cands = { B: B(), E: Eng() };
  const row = (k, bg) => `<div style="display:flex;align-items:flex-end;gap:18px;padding:16px;background:${bg}"><b style="font:14px sans-serif;width:20px;color:#888">${k}</b>` + [16, 24, 32, 48, 64, 120, 180].map((z) => `<svg viewBox="0 0 512 512" width="${z}" height="${z}">${cands[k]}</svg>`).join('') + `</div>`;
  fs.writeFileSync(__dirname + '/out/icons2.html', `<!doctype html><body style="margin:0">${['B', 'E'].map((k) => row(k, '#f1f1f1') + row(k, '#202124')).join('')}</body>`);
}
