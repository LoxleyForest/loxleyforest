// Render the engraved emblem. mode 'color' (gold + light lines on deep forest) or 'knock' (one ink, lines cut out).
const X = require('./engrave.js');
const { W, H } = X;
let cache = null;
const scene = () => (cache = cache || X.build());

const { acorn } = require('./acorn.js');
const TOP = 40; // headroom above the arch for the acorn
const HT = H + TOP; // total emblem height
const AC = acorn(150, 0.6, 1.45);
// The acorn: solid shapes in one colour, with its cap lattice and the glint cut out (or drawn in 'cut' colour)
function acornSvg(id, ink, cut, light) {
  const shapes = `<path d="${AC.stem}" stroke="#fff" stroke-width="2.1" fill="none" stroke-linecap="round"/><path d="${AC.nut}" fill="#fff"/><path d="${AC.cap}" fill="#fff"/>`;
  const holes = `<g clip-path="url(#${id}-capc)"><path d="${AC.hatch}" stroke="#000" stroke-width="0.85"/></g><path d="${AC.glint}" stroke="#000" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  if (cut === null) { // colour: draw lattice in the ground colour and the glint in light
    return `<g class="acorn"><clipPath id="${id}-capc"><path d="${AC.cap}"/></clipPath><path d="${AC.stem}" stroke="${ink}" stroke-width="2.1" fill="none" stroke-linecap="round"/><path d="${AC.nut}" fill="${ink}"/><path d="${AC.cap}" fill="${ink}"/><g clip-path="url(#${id}-capc)"><path d="${AC.hatch}" stroke="${PAL.ground}" stroke-width="0.85"/></g><path d="${AC.glint}" stroke="${light}" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>`;
  }
  return `<g class="acorn"><clipPath id="${id}-capc"><path d="${AC.cap}"/></clipPath><mask id="${id}-am" maskUnits="userSpaceOnUse" x="100" y="-40" width="100" height="44">${shapes}${holes}</mask><rect x="100" y="-40" width="100" height="44" fill="${ink}" mask="url(#${id}-am)"/></g>`;
}
const PAL = { ground: '#1a2e1a', gold: '#c9a868', light: '#f7e4bd', frame: '#c4a265' };

let PEN_K = 1;
function opSvg(op, col, extraCls = '') {
  const cls = [op.cls, extraCls].filter(Boolean).join(' ');
  const c = cls ? ` class="${cls}"${op.i !== undefined ? ` data-i="${op.i}"` : ''}` : '';
  if (op.k === 'pen') return `<path${c} d="${op.d}" fill="none" stroke="${col}" stroke-width="${+(op.w * PEN_K).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (op.k === 'dot') return `<circle${c} cx="${op.x}" cy="${op.y}" r="${op.r}" fill="${col}"/>`;
  return `<path${c} d="${op.d}" fill="${col}"/>`;
}

// Merge runs of plain pen strokes (and, for the sky, ribbons) that share colour and width into one path.
function mergeOps(ops, mergeRibs) {
  const out = []; let run = [];
  const flush = () => {
    const g = new Map();
    for (const op of run) { const key = op.k + '|' + op.c + '|' + (op.w || ''); if (!g.has(key)) g.set(key, { ...op, d: '' }); g.get(key).d += op.d; }
    out.push(...g.values()); run = [];
  };
  for (const op of ops) {
    const mergeable = !op.cls && (op.k === 'pen' || (mergeRibs && op.k === 'rib'));
    if (mergeable) run.push(op); else { flush(); out.push(op); }
  }
  flush();
  return out;
}
// colors: map of ground/gold/light; for 'knock', ground->white(ink) and lines->black(holes) inside a mask
function emblem(mode = 'color', opts = {}) {
  PEN_K = opts.penWeight || 1;
  const id = opts.id || 'em';
  const { L } = scene();
  const pal = { ...PAL, ...(opts.pal || {}) };
  const frameInset = 2, fillInset = 10;
  const frame = (col) => `<path class="frame" d="${X.archPath(frameInset)}" fill="none" stroke="${col}" stroke-width="3" pathLength="1"/><path class="frame2" d="${X.archPath(6.5)}" fill="none" stroke="${col}" stroke-width="0.8" pathLength="1"/>`;
  const layers = (map) => X.ORDER.filter((k) => L[k]).map((k) => `<g class="ly ly-${k}">` + mergeOps(L[k], k === 'sky').map((op) => opSvg(op, map[op.c])).join('') + `</g>`).join('\n');
  if (mode === 'color') {
    return `<g class="emb-inner" transform="translate(0 ${TOP})"><defs><clipPath id="${id}-in"><path d="${X.archPath(fillInset)}"/></clipPath></defs>
${acornSvg(id, pal.frame, null, pal.light)}
${frame(pal.frame)}
<path class="ground" d="${X.archPath(fillInset)}" fill="${pal.ground}"/>
<g clip-path="url(#${id}-in)">
${layers({ ground: pal.ground, gold: pal.gold, light: pal.light })}
</g></g>`;
  }
  if (mode === 'lines') {
    // lines only, one ink, nothing behind them: for foil on dark stock and for thread
    const ink = opts.ink || PAL.frame;
    return `<g class="emb-inner" transform="translate(0 ${TOP})"><defs><clipPath id="${id}-in"><path d="${X.archPath(fillInset)}"/></clipPath>
<mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/><g clip-path="url(#${id}-in)">
${layers({ ground: '#000', gold: '#fff', light: '#fff' })}
</g></mask></defs>
${acornSvg(id, ink, true)}
${frame(ink)}
<rect width="${W}" height="${H}" fill="${ink}" mask="url(#${id}-m)"/></g>`;
  }
  // knock: one ink. The arch is ink; every line is a hole; occluders re-fill with ink.
  const ink = opts.ink || '#1a2e1a';
  return `<g class="emb-inner" transform="translate(0 ${TOP})"><defs><clipPath id="${id}-in"><path d="${X.archPath(fillInset)}"/></clipPath>
<mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/><path d="${X.archPath(fillInset)}" fill="#fff"/><g clip-path="url(#${id}-in)">
${layers({ ground: '#fff', gold: '#000', light: '#000' })}
</g></mask></defs>
${acornSvg(id, ink, true)}
${frame(ink)}
<rect width="${W}" height="${H}" fill="${ink}" mask="url(#${id}-m)"/></g>`;
}

module.exports = { emblem, PAL, W, H, HT, TOP, scene };

if (require.main === module) {
  const fs = require('fs');
  const sv = (inner, w, h, s) => `<svg viewBox="0 0 ${w} ${h}" width="${w * s}" height="${h * s}">${inner}</svg>`;
  const t0 = Date.now();
  const a = emblem('color', { id: 'a' }), b = emblem('knock', { id: 'b' });
  console.log('built in', Date.now() - t0, 'ms; color svg', (a.length / 1024).toFixed(0), 'KB');
  const { L } = scene(); for (const k of Object.keys(L)) console.log(k.padEnd(12), (L[k].reduce((n, o) => n + (o.d || '').length, 0) / 1024).toFixed(0) + 'KB', L[k].length);
  fs.writeFileSync(__dirname + '/out/eng.html', `<!doctype html><body style="margin:0;display:flex;background:#888">
<div style="background:#1a2e1a;padding:30px">${sv(a, W, H, 2)}</div>
<div style="background:#f7f3ed;padding:30px">${sv(b, W, H, 2)}</div></body>`);
}
