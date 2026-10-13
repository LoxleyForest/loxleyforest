// Lockups for the engraved emblem: stacked, horizontal, wordmark, icon.
const E2 = require('./emblem2.js');
const X = require('./engrave.js');
const WM = require('./wordmark.js');
const { W, H } = E2;

const C = { deep: '#1a2e1a', forest: '#2d4a2d', linen: '#f7f3ed', gold: '#c4a265', light: '#f7e4bd', white: '#ffffff' };

function tagline(text, size, tracking, cx, baseline, color, split = false) {
  const t = WM.setText(text, 'Montserrat-500', size, tracking, 0, baseline);
  const dx = (cx - t.width / 2).toFixed(2);
  if (split) return `<g class="tagline" fill="${color}" transform="translate(${dx} 0)">` + t.glyphs.filter((g) => g.d).map((g, i) => `<path class="tg" data-i="${i}" d="${g.d}"/>`).join('') + `</g>`;
  return `<path class="tagline" transform="translate(${dx} 0)" d="${t.d}" fill="${color}"/>`;
}
const wmFor = (dark, o, id) => WM.wordmark({ size: 84, tracking: 0.08, ink: o.ink || (dark ? C.linen : C.deep), arrowColor: o.arrow || C.gold, fletch: o.arrow || C.gold, id });

// emblemSvg: pass a ready string to reuse one copy (e.g. a <use>), else it is built here
function emblemFor(dark, o, id) {
  if (o.emblemSvg) return o.emblemSvg;
  if (o.mode === 'knock') return E2.emblem('knock', { id, ink: o.ink || (dark ? C.linen : C.deep) });
  return E2.emblem('color', { id });
}

function stacked(theme = 'dark', o = {}) {
  const dark = theme === 'dark', id = o.id || 'st-' + theme;
  const wm = wmFor(dark, o, id + '-wm');
  const ew = o.ew || 270, eh = (ew * H) / W;
  const Wd = Math.ceil(wm.width + 40), ex = (Wd - ew) / 2, ey = 20, wy = ey + eh + 34;
  const tg = tagline('DAHLONEGA · GEORGIA', 15, 0.42, Wd / 2, wy + wm.height + 30, o.tag || (dark ? C.gold : C.forest), o.split);
  const inner = `<g class="emblem" transform="translate(${ex.toFixed(2)} ${ey}) scale(${(ew / W).toFixed(5)})">${emblemFor(dark, o, id + '-em')}</g><g class="wordmark" transform="translate(20 ${wy.toFixed(2)})">${wm.inner}</g>${tg}`;
  return { inner, w: Wd, h: Math.ceil(wy + wm.height + 52), parts: { ex, ey, ew, eh, wy, wm: { tip: wm.tip, width: wm.width, ay: wm.ay, hb: wm.A.hb } } };
}
function horizontal(theme = 'dark', o = {}) {
  const dark = theme === 'dark', id = o.id || 'hz-' + theme;
  const wm = wmFor(dark, o, id + '-wm');
  const eh = 200, ew = (eh * W) / H, wy = 20 + eh / 2 - wm.ay - 4;
  const inner = `<g class="emblem" transform="translate(20 20) scale(${(ew / W).toFixed(5)})">${emblemFor(dark, o, id + '-em')}</g><g class="wordmark" transform="translate(${(20 + ew + 34).toFixed(2)} ${wy.toFixed(2)})">${wm.inner}</g>`;
  return { inner, w: Math.ceil(20 + ew + 34 + wm.width + 20), h: Math.ceil(eh + 40) };
}
function wordOnly(theme = 'dark', o = {}) {
  const dark = theme === 'dark';
  const wm = wmFor(dark, o, o.id || 'wo-' + theme);
  return { inner: `<g transform="translate(10 10)">${wm.inner}</g>`, w: Math.ceil(wm.width + 20), h: Math.ceil(wm.height + 20) };
}

// The icon: the engraving reduced to what survives at 16 px. Two spires in a cradle of cables between two oaks.
function iconInner(pal, id) {
  const P = X.P, sp = (cx, ty, by, hw) => { const h = by - ty; return `M${cx} ${ty}C${cx - hw * 0.3} ${ty + h * 0.52} ${cx - hw * 0.68} ${by - h * 0.1} ${cx - hw} ${by}H${cx + hw}C${cx + hw * 0.68} ${by - h * 0.1} ${cx + hw * 0.3} ${ty + h * 0.52} ${cx} ${ty}Z`; };
  const big = { cx: 162, ty: 96, by: 268, hw: 66 }, small = { cx: 100, ty: 162, by: 268, hw: 40 };
  const hub = [150, 350];
  const seam = (s, u) => { const h = s.by - s.ty, x = s.cx - s.hw + 2 * s.hw * u; return `M${s.cx} ${s.ty + 10}C${s.cx + (x - s.cx) * 0.25} ${s.ty + h * 0.5} ${s.cx + (x - s.cx) * 0.7} ${s.by - h * 0.1} ${x} ${s.by}`; };
  return `<defs><clipPath id="${id}-in"><path d="${X.archPath(18)}"/></clipPath></defs>
<path d="${X.archPath(6)}" fill="none" stroke="${pal.frame}" stroke-width="12"/>
<path d="${X.archPath(18)}" fill="${pal.ground}"/>
<g clip-path="url(#${id}-in)">
<path d="M0 0H300V150H0Z" fill="none"/>
<path d="M40 430L46 0H68L76 430Z" fill="${pal.gold}"/>
<path d="M224 430L232 0H254L260 430Z" fill="${pal.gold}"/>
<g stroke="${pal.gold}" stroke-linecap="round" fill="none"><path d="M${hub[0]} ${hub[1]}L62 196M${hub[0]} ${hub[1]}L236 196" stroke-width="6"/></g>
<path d="${sp(small.cx, small.ty, small.by, small.hw)}" fill="${pal.light}" stroke="${pal.ground}" stroke-width="8" stroke-linejoin="round"/>
<path d="${sp(big.cx, big.ty, big.by, big.hw)}" fill="${pal.light}" stroke="${pal.ground}" stroke-width="10" stroke-linejoin="round"/>
<path d="${seam(big, 1 / 3)}${seam(big, 2 / 3)}" stroke="${pal.ground}" stroke-width="6" fill="none"/>
<path d="M${big.cx} ${big.ty - 34}L${big.cx + 9} ${big.ty + 4}H${big.cx - 9}Z" fill="${pal.gold}"/>
<path d="M${small.cx} ${small.ty - 26}L${small.cx + 7} ${small.ty + 3}H${small.cx - 7}Z" fill="${pal.gold}"/>
<path d="M54 268H246V286H54Z" fill="${pal.gold}"/><path d="M226 268V246H246V268" fill="none" stroke="${pal.gold}" stroke-width="5"/>
<circle cx="${hub[0]}" cy="${hub[1]}" r="11" fill="${pal.gold}"/>
</g>`;
}
function icon(o = {}) {
  const id = o.id || 'ic', tile = o.tile ?? true;
  const pal = o.pal || { frame: C.gold, ground: C.deep, gold: C.gold, light: C.light };
  const S = 512, eh = tile ? 448 : 512, ew = (eh * W) / H;
  return { inner: (tile ? `<rect width="${S}" height="${S}" rx="${o.rx ?? 96}" fill="${C.deep}"/>` : '') + `<g transform="translate(${((S - ew) / 2).toFixed(2)} ${((S - eh) / 2).toFixed(2)}) scale(${(ew / W).toFixed(5)})">${iconInner(pal, id)}</g>`, w: S, h: S };
}

const svg = (o, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.w} ${o.h}" width="${o.w}" height="${o.h}"${extra}>${o.inner}</svg>`;

module.exports = { C, stacked, horizontal, wordOnly, icon, iconInner, svg, tagline };

if (require.main === module) {
  const fs = require('fs');
  const sv = (o, s) => `<svg viewBox="0 0 ${o.w} ${o.h}" width="${o.w * s}" height="${o.h * s}">${o.inner}</svg>`;
  const ic = icon(), ick = icon({ id: 'k', tile: false, pal: { frame: C.deep, ground: C.deep, gold: C.linen, light: C.linen } });
  const sizes = (o, bg) => `<div style="background:${bg};padding:14px;display:flex;align-items:end;gap:14px">` + [16, 32, 48, 96, 180].map((z) => `<svg viewBox="0 0 ${o.w} ${o.h}" width="${z}" height="${z}">${o.inner}</svg>`).join('') + `</div>`;
  fs.writeFileSync(__dirname + '/out/lock.html', `<!doctype html><body style="margin:0;background:#777;font:12px sans-serif">
<div style="display:flex"><div style="background:${C.deep};padding:30px 20px;width:660px;display:flex;justify-content:center">${sv(stacked('dark'), 0.62)}</div>
<div style="background:${C.linen};padding:30px 20px;width:660px;display:flex;justify-content:center">${sv(stacked('light'), 0.62)}</div></div>
<div style="display:flex"><div style="background:${C.deep};padding:20px;width:660px">${sv(horizontal('dark'), 0.6)}</div><div style="background:${C.linen};padding:20px;width:660px">${sv(horizontal('light', { mode: 'knock', id: 'hk' }), 0.6)}</div></div>
<div style="display:flex">${sizes(ic, C.linen)}${sizes(ick, '#fff')}</div>
</body>`);
}
