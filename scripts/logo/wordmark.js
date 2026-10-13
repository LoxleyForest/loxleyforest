// The name, outlined from the font files, and the arrow through it.
const opentype = require('opentype.js');
const fs = require('fs');
const path = require('path');
const fontCache = {};
function font(name) {
  if (!fontCache[name]) {
    const buf = fs.readFileSync(path.join(__dirname, 'fonts', name + '.woff'));
    fontCache[name] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return fontCache[name];
}
const r2 = (n) => Math.round(n * 100) / 100;

// Lay out text with HarfBuzz shaping and fontTools outlines (outline.py). Returns {d, width, glyphs}
const { execFileSync } = require('child_process');
const outlineCache = {};
function setText(text, fontName, size, tracking = 0, x0 = 0, baseline = 0) {
  const key = [text, fontName, size, tracking, x0, baseline].join('|');
  if (!outlineCache[key]) {
    const out = execFileSync(path.join(__dirname, 'venv/bin/python'), [path.join(__dirname, 'outline.py'), path.join(__dirname, 'fonts', fontName + '.ttf'), text, String(size), String(tracking), String(x0), String(baseline)]);
    const j = JSON.parse(out.toString());
    outlineCache[key] = { d: j.glyphs.map((g) => g.d).join(''), width: j.width, glyphs: j.glyphs };
  }
  return outlineCache[key];
}
function bbox(d) {
  const p = new opentype.Path();
  // crude: parse numbers pairs
  const nums = d.match(/-?\d*\.?\d+/g).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) { x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]); y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1]); }
  return { x0, y0, x1, y1 };
}

// The arrow, drawn along y = ay from xa (nock) to xb (point). s = scale.
function arrow(xa, xb, ay, s = 1) {
  const P = (x, y) => `${r2(x)} ${r2(y)}`;
  const hx = xb, HL = 40 * s, HW = 11.5 * s, hb = hx - HL;
  const shaft = `M${P(xa + 3 * s, ay)} H${r2(hb - 6 * s)}`;
  // broadhead: long leaf, slight concave shoulders, barbs swept back
  const head = `M${P(hx, ay)} C${P(hx - 12 * s, ay - 2.4 * s)} ${P(hx - 26 * s, ay - 8 * s)} ${P(hb + 4 * s, ay - HW)} ` +
    `L${P(hb - 1.5 * s, ay - HW - 1.5 * s)} C${P(hb + 3 * s, ay - 6 * s)} ${P(hb + 4 * s, ay - 3 * s)} ${P(hb + 2 * s, ay - 1.7 * s)} ` +
    `L${P(hb + 2 * s, ay + 1.7 * s)} C${P(hb + 4 * s, ay + 3 * s)} ${P(hb + 3 * s, ay + 6 * s)} ${P(hb - 1.5 * s, ay + HW + 1.5 * s)} ` +
    `L${P(hb + 4 * s, ay + HW)} C${P(hx - 26 * s, ay + 8 * s)} ${P(hx - 12 * s, ay + 2.4 * s)} ${P(hx, ay)} Z`;
  const socket = `M${P(hb - 9 * s, ay - 2.1 * s)} H${r2(hb + 3 * s)} V${r2(ay + 2.1 * s)} H${r2(hb - 9 * s)} Z`;
  const midrib = `M${P(hb + 3 * s, ay)} H${r2(hx - 7 * s)}`;
  // fletching: a long swept vane above and below, with barbs cut in
  const xr = xa + 12 * s, FL = 84 * s, FH = 14 * s;
  const vane = (sg) => `M${P(xr, ay + sg * 0.8 * s)} L${P(xr - 10 * s, ay + sg * FH)} C${P(xr + FL * 0.1, ay + sg * (FH + 1.2 * s))} ${P(xr + FL * 0.42, ay + sg * (FH - 0.5 * s))} ${P(xr + FL * 0.66, ay + sg * FH * 0.5)} C${P(xr + FL * 0.8, ay + sg * FH * 0.25)} ${P(xr + FL * 0.92, ay + sg * 1.4 * s)} ${P(xr + FL, ay + sg * 0.9 * s)} Z`;
  const fletch = vane(-1) + vane(1);
  // engraved feather: the vane's edge drawn as a line, filled with fine barbs swept back from the quill
  const vEdge = (sg) => `M${P(xr, ay + sg * 1.2 * s)} L${P(xr - 10 * s, ay + sg * FH)} C${P(xr + FL * 0.1, ay + sg * (FH + 1.2 * s))} ${P(xr + FL * 0.42, ay + sg * (FH - 0.5 * s))} ${P(xr + FL * 0.66, ay + sg * FH * 0.5)} C${P(xr + FL * 0.8, ay + sg * FH * 0.25)} ${P(xr + FL * 0.92, ay + sg * 1.4 * s)} ${P(xr + FL, ay + sg * 0.9 * s)}`;
  const vaneH = (x) => { // approximate vane height at x along the shaft
    const u = (x - xr) / FL; if (u < 0) return FH * (1 + u * 0.5); return FH * (u < 0.42 ? 1 - u * 0.1 : u < 0.66 ? lerp(0.96, 0.5, (u - 0.42) / 0.24) : lerp(0.5, 0.08, (u - 0.66) / 0.34));
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const barbList = [];
  for (let x = xr - 6 * s; x < xr + FL - 3 * s; x += 2.3 * s) {
    for (const sg of [-1, 1]) { const h = vaneH(x + 5 * s) - 0.8 * s; if (h < 1.5 * s) continue; barbList.push(`M${P(x + 5 * s, ay + sg * 1.6 * s)} Q${P(x + 2.5 * s, ay + sg * h * 0.6)} ${P(x - 0.5 * s, ay + sg * h)}`); }
  }
  const featherEdge = vEdge(-1) + vEdge(1), featherBarbs = barbList.join('');
  const nock = `M${P(xa + 4 * s, ay - 2.3 * s)} L${P(xa, ay - 3.6 * s)} L${P(xa + 1.6 * s, ay)} L${P(xa, ay + 3.6 * s)} L${P(xa + 4 * s, ay + 2.3 * s)} Z`;
  return { shaft, head, socket, midrib, fletch, barbs: '', nock, hb, xr, FL, featherEdge, featherBarbs, quill: `M${P(xr - 9 * s, ay)} H${r2(xr + FL + 2 * s)}` };
}

// Full wordmark with arrow. Returns {svg inner, width, height, parts}
// opts: size (cap height-ish font size), ink, arrowColor, ground (for knockout), fletch (colour)
function wordmark(opts = {}) {
  const size = opts.size || 84;
  const tracking = opts.tracking ?? 0.075;
  const fontName = opts.font || 'CormorantSC-600';
  const s = (opts.arrowScale || 1) * size / 84;
  const lead = 100 * s, tail = 50 * s, gap = 16 * s; // room for fletching and head
  const baseline = size * 0.8;
  const t1 = setText(opts.text || 'Loxley Forest', fontName, size, tracking, lead + gap, baseline);
  const xg = setText('x', fontName, size, 0, 0, baseline);
  const scH = baseline - bbox(xg.d).y0; // small cap height above baseline
  const ay = r2(baseline - scH * 0.52);
  const textEnd = lead + gap + t1.width;
  const W = textEnd + gap + tail + 6 * s;
  const A = arrow(4 * s, W - 4 * s, ay, s);
  const id = opts.id || 'wm';
  const ink = opts.ink || '#1a2e1a', ac = opts.arrowColor || '#c4a265', fc = opts.fletch || ac;
  const knock = r2(size * 0.07);
  // Structure (also what the animation drives): the shaft's knockout mask lives outside the moving
  // arrow, so the breaks stay put on the letters while the arrow slides beneath them.
  const MW = r2(W + 2000), MX = -1000;
  const glyphs = t1.glyphs.filter((g) => g.d);
  const inner = `
<defs><mask id="${id}-k" maskUnits="userSpaceOnUse" x="${MX}" y="0" width="${MW}" height="${r2(size * 1.1)}">
<rect x="${MX}" width="${MW}" height="${r2(size * 1.1)}" fill="#fff"/>
${glyphs.map((g, i) => `<path class="mg" data-i="${i}" d="${g.d}" fill="#000" stroke="#000" stroke-width="${knock}" stroke-linejoin="round"/>`).join('')}</mask></defs>
<g class="arrow" fill="${ac}">
<g mask="url(#${id}-k)"><g class="fly"><path class="shaft" d="${A.shaft}" stroke="${ac}" stroke-width="${r2(2.2 * s)}" fill="none"/></g></g>
<g class="fly">
<g class="fletch" fill="none" stroke="${fc}" stroke-linecap="round" stroke-linejoin="round"><path d="${A.featherEdge}" stroke-width="${r2(1.3 * s)}"/><path d="${A.featherBarbs}" stroke-width="${r2(0.75 * s)}"/><path d="${A.quill}" stroke-width="${r2(1.8 * s)}"/></g>
<path class="nock" d="${A.nock}" fill="${fc}"/>
<path class="socket" d="${A.socket}"/>
<path class="head" d="${A.head}"/>
</g>
</g>
<g class="name" fill="${ink}">${glyphs.map((g, i) => `<path class="g" data-i="${i}" data-cx="${r2(g.x + g.w / 2)}" d="${g.d}"/>`).join('')}</g>`;
  return { inner, width: r2(W), height: r2(size * 1.05), ay, glyphs, A, textStart: lead + gap, textEnd, s, tip: r2(W - 4 * s) };
}

module.exports = { setText, wordmark, arrow, font, bbox };
