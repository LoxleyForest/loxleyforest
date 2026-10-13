// Loxley Forest emblem, engraved. A pen-and-ink drawing built from strokes:
// light lines on a dark arch. Five oaks, cables from the truss's bottom hubs, the twin-spire canvas house.
// Emblem space 300 x 420; arch round-top radius 150.

const W = 300, H = 420;
const r1 = (n) => Math.round(n * 10) / 10;

// ---------- randomness and noise (deterministic) ----------
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function noise1(seed) {
  const r = rng(seed), N = 97, v = Array.from({ length: N }, () => r() * 2 - 1);
  return (x) => { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); const a = v[((i % N) + N) % N], b = v[(((i + 1) % N) + N) % N]; return a + (b - a) * t; };
}

// ---------- curves: functions t in [0,1] -> [x,y] ----------
const lerp = (a, b, t) => a + (b - a) * t;
const P = {
  line: (a, b) => (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)],
  quad: (a, c, b) => (t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; },
  cubic: (a, c1, c2, b) => (t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]; },
  poly: (pts) => { // by arc length
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const T = L[L.length - 1] || 1;
    return (t) => { const d = t * T; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const k = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; };
  },
  arc: (cx, cy, r, a0, a1) => (t) => { const a = lerp(a0, a1, t); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; },
};
function approxLen(fn) { let L = 0, p = fn(0); for (let i = 1; i <= 24; i++) { const q = fn(i / 24); L += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return L; }

// Sample a curve with a hand wobble applied along its normal.
function sample(fn, { step = 3, wob = 0.35, freq = 0.06, seed = 1, t0 = 0, t1 = 1 } = {}) {
  const sub = (t) => fn(lerp(t0, t1, t));
  const L = approxLen(sub), n = Math.max(2, Math.ceil(L / step)), nz = noise1(seed), out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = sub(t), a = sub(Math.max(0, t - 0.01)), b = sub(Math.min(1, t + 0.01));
    let dx = b[0] - a[0], dy = b[1] - a[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const o = wob * nz(t * L * freq + seed * 7.3);
    out.push([p[0] - dy * o, p[1] + dx * o, dx, dy, t]);
  }
  return out;
}
// Catmull-Rom through points -> smooth path data
function smooth(pts, closed = false) {
  if (pts.length < 3) return `M${r1(pts[0][0])} ${r1(pts[0][1])}` + pts.slice(1).map((p) => `L${r1(p[0])} ${r1(p[1])}`).join('');
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  const N = pts.length, g = (i) => pts[closed ? (i + N) % N : Math.max(0, Math.min(N - 1, i))];
  const last = closed ? N : N - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
// A stroked pen line (constant width, round ends)
function pen(fn, o = {}) { const pts = sample(fn, { step: o.step || 4, wob: o.wob ?? 0.35, seed: o.seed || 1, t0: o.t0 ?? 0, t1: o.t1 ?? 1 }); return smooth(pts); }
// A swelling engraved line: filled ribbon whose width follows prof(t) (0..1) times w
const taper = (t, a = 0.18) => Math.min(1, Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.6 / Math.sin(Math.PI * 0.5) * (1 + a)) ;
function ribbon(fn, w, prof = (t) => taper(t), o = {}) {
  const pts = sample(fn, { step: o.step || 3.2, wob: o.wob ?? 0.35, seed: o.seed || 1, t0: o.t0 ?? 0, t1: o.t1 ?? 1 });
  const L = [], R = [];
  for (const [x, y, dx, dy, t] of pts) { const h = Math.max(0.06, (w * prof(t)) / 2); L.push([x - dy * h, y + dx * h]); R.push([x + dy * h, y - dx * h]); }
  const ring = L.concat(R.reverse());
  if (o.straight) return 'M' + ring.map((p) => `${r1(p[0])} ${r1(p[1])}`).join('L') + 'Z';
  return smooth(ring, true);
}

// ---------- the scene ----------
const S = {
  deckY: 270, deckX0: 70, deckX1: 270, deckT: 9,
  big: { cx: 160, ty: 98, by: 268, hw: 60 },
  small: { cx: 98, ty: 158, by: 267, hw: 36 },
  // five oaks: base x, bend, fork (x,y), widths, depth 1 front .. 0.4 far, branch ends
  oaks: [
    { id: 'O5', xb: 136, bend: -6, xf: 130, fy: 104, w0: 10, w1: 5, depth: 0.45, br: [[112, 50], [150, 36]] },
    { id: 'O2', xb: 72, bend: 8, xf: 66, fy: 126, w0: 14, w1: 7, depth: 0.65, br: [[44, 70], [92, 58]] },
    { id: 'O4', xb: 266, bend: -8, xf: 272, fy: 124, w0: 15, w1: 7.5, depth: 0.65, br: [[250, 62], [292, 74]] },
    { id: 'O1', xb: 26, bend: 10, xf: 30, fy: 150, w0: 23, w1: 10, depth: 1, br: [[8, 84], [58, 96], [34, 52]] },
    { id: 'O3', xb: 234, bend: -9, xf: 230, fy: 140, w0: 23, w1: 11, depth: 1, br: [[208, 72], [262, 58], [240, 104]] },
  ],
};
S.hubs = [[114, S.deckY + 50], [204, S.deckY + 54]];
S.nodes = [[S.deckX0 + 6, S.deckY + S.deckT], [158, S.deckY + S.deckT], [S.deckX1 - 4, S.deckY + S.deckT]];
// cables: hub index -> oak id at anchor height y
S.cables = [[0, 'O1', 176], [0, 'O2', 146], [0, 'O5', 138], [1, 'O3', 168], [1, 'O4', 150]];

const oak = (id) => S.oaks.find((o) => o.id === id);
// spine: quadratic from the root (below the frame) to the fork; t=0 root, t=1 fork
const oakSpine = (o) => P.quad([o.xb, H + 6], [o.xb + o.bend, (H + o.fy) / 2], [o.xf, o.fy]);
const oakAtY = (o, y) => { // spine point and width at height y (y between fork and ground)
  const t = Math.max(0, Math.min(1, (H + 6 - y) / (H + 6 - o.fy))); const sp = oakSpine(o);
  let lo = 0, hi = 1; for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (sp(m)[1] > y) lo = m; else hi = m; }
  const tt = (lo + hi) / 2; return { x: sp(tt)[0], w: oakWt(o, tt), t: tt };
};
const oakWt = (o, t) => lerp(o.w0, o.w1, t) * (1 + 0.35 * (1 - t) ** 8);
const oakX = (o, y) => oakAtY(o, y).x;
const oakW = (o, y) => oakAtY(o, y).w;

function spireSides(sp) {
  const { cx, ty, by, hw } = sp, h = by - ty;
  const Lf = P.cubic([cx, ty], [cx - hw * 0.3, ty + h * 0.52], [cx - hw * 0.68, by - h * 0.1], [cx - hw, by]);
  const Rf = P.cubic([cx, ty], [cx + hw * 0.3, ty + h * 0.52], [cx + hw * 0.68, by - h * 0.1], [cx + hw, by]);
  return { Lf, Rf };
}
function hemY(sp, x, n) { // scalloped hem: lifts between anchors
  const { cx, by, hw } = sp, u = (x - (cx - hw)) / (2 * hw), k = u * n - Math.floor(u * n);
  return by - 4.2 * 4 * k * (1 - k);
}
function spireOutline(sp, n) {
  const { Lf, Rf } = spireSides(sp), pts = [];
  for (let i = 0; i <= 30; i++) pts.push(Lf(i / 30));
  for (let i = 0; i <= 60; i++) { const x = lerp(sp.cx - sp.hw, sp.cx + sp.hw, i / 60); pts.push([x, hemY(sp, x, n)]); }
  for (let i = 30; i >= 0; i--) pts.push(Rf(i / 30));
  return 'M' + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join('L') + 'Z';
}
function windowShape() {
  const sp = S.big, x = sp.cx - 6, w = 12, yb = sp.by - 42, yt = sp.ty + 100;
  return { x, w, yb, yt, d: `M${x} ${yb} V${yt + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${yt + w / 2} V${yb} Z` };
}

function archPath(inset) { const r = 150 - inset; return `M${inset} ${H - inset} V150 A${r} ${r} 0 0 1 ${W - inset} 150 V${H - inset} Z`; }

// Build the drawing as ordered layers of ops. Op: {k:'fill'|'pen'|'rib'|'dot', d, w, c:'ground'|'gold'|'light'}
function build(level = 'full') {
  const L = {}; const add = (layer, op) => (L[layer] = L[layer] || []).push(op);
  const R = rng(7);

  // sky: horizontal engraved lines; brightest high in the gap above the spires, fading with breaks
  const skyTone = (x, y) => Math.max(0, 1 - Math.hypot((x - 160) / 1.3, y - 40) / 190) ** 1.3;
  for (let y = 8, i = 0; y < 250; y += 2.7, i++) {
    let run = [];
    const flush = () => { if (run.length > 1) { const w = Math.max(...run.map((p) => p[2])); add('sky', { k: 'rib', d: ribbon(P.poly(run.map((p) => [p[0], p[1]])), 1, (t) => { const k = Math.min(run.length - 1, Math.round(t * (run.length - 1))); return run[k][2]; }, { step: 6, wob: 0.22, seed: 100 + i * 3 + run[0][0], straight: true }), c: 'gold' }); } run = []; };
    for (let x = 0; x <= W; x += 6) { const tone = skyTone(x, y); const w = 0.12 + 1.05 * tone; if (tone > 0.05) run.push([x, y, w]); else flush(); }
    flush();
  }

  // oaks, back to front: occluder, lit edge, shadow edge, bark, branches into the canopy
  const glowX = S.big.cx;
  const limb = (lay, o, fn, w0, w1, seed, litSide) => {
    const prof = (t) => lerp(w0, w1, t);
    const sp = sample(fn, { step: 2.5, wob: 0.5, seed, freq: 0.05 }), Lp = [], Rp = [];
    for (const [x, y, dx, dy, t] of sp) { const h = prof(t) / 2; Lp.push([x - dy * h, y + dx * h]); Rp.push([x + dy * h, y - dx * h]); }
    add(lay, { k: 'fill', d: smooth(Lp.concat(Rp.slice().reverse()), true), c: 'ground' });
    // edges: the side facing the house is lit
    const lit = litSide > 0 ? Rp : Lp, dark = litSide > 0 ? Lp : Rp;
    // Lp is on the left of travel direction; for an upward limb, left of travel = screen left
    add(lay, { k: 'rib', d: ribbon(P.poly(lit), 1.6 * o.depth + 0.6, (t) => 0.4 + 0.6 * taper(t, 0), { wob: 0.25, seed: seed + 1 }), c: 'gold' });
    add(lay, { k: 'rib', d: ribbon(P.poly(dark), 0.55 * o.depth + 0.25, (t) => 0.3 + 0.7 * taper(t, 0), { wob: 0.25, seed: seed + 2 }), c: 'gold' });
    return { Lp, Rp, prof, fn };
  };
  for (const o of S.oaks) {
    const lay = 'oak-' + o.id;
    const sp = oakSpine(o);
    const litSide = o.xf < glowX ? 1 : -1; // +1: right side lit
    // trunk from root to slightly above the fork
    const trunkFn = (t) => (t <= 1 ? sp(t) : sp(1));
    const tk = limb(lay, o, sp, o.w0 * 1.35, o.w1, o.xb * 3, litSide);
    // root flare handled by the start width; bark: broken strokes following the trunk on the lit half
    const nB = Math.round(3 + o.depth * 5);
    for (let j = 0; j < nB; j++) {
      const fx = (j + 0.5) / nB; // 0 shadow edge .. 1 lit edge
      if (fx < 0.3 && R() > 0.35) continue;
      let t = R() * 0.08;
      while (t < 0.97) {
        const len = 0.04 + R() * 0.09, t2 = Math.min(0.99, t + len);
        const off = (tt) => { const p = sp(tt), q = sp(Math.min(1, tt + 0.01)), dx = q[0] - p[0], dy = q[1] - p[1], m = Math.hypot(dx, dy) || 1; const w = lerp(o.w0 * 1.35, o.w1, tt) / 2; const k = litSide * lerp(-0.7, 0.8, fx) * w; return [p[0] + (-dy / m) * -k, p[1] + (dx / m) * -k]; };
        add(lay, { k: 'pen', d: pen((u) => off(lerp(t, t2, u)), { step: 5, wob: 0.55, seed: (o.xb * 31 + j * 7 + t * 999) | 0 }), w: r1((0.3 + 0.65 * fx) * (0.45 + 0.55 * o.depth)), c: 'gold' });
        t = t2 + 0.015 + R() * 0.05;
      }
    }
    // branches from the fork to each end, plus a leader
    o.br.forEach(([ex, ey], k) => {
      const f = [o.xf, o.fy + 4], c = [lerp(o.xf, ex, 0.25), lerp(o.fy, ey, 0.6)];
      limb(lay, o, P.quad(f, c, [ex, ey]), o.w1 * 0.95, 2.2, o.xb * 5 + k * 17, ex > o.xf ? -litSide * 0 + (ex < glowX ? 1 : -1) : (ex < glowX ? 1 : -1));
    });
    // collars where cables anchor
    for (const [hi, id, ay] of S.cables) if (id === o.id) {
      const { x, w } = oakAtY(o, ay);
      add(lay, { k: 'rib', d: ribbon(P.line([x - w / 2 - 1, ay - 1], [x + w / 2 + 1, ay + 1]), 2.2, () => 1, { wob: 0.1, seed: ay }), c: 'gold' });
    }
  }

  // canopy: engraved oak foliage. Clumps at the branch ends; rows of small scallops, densest on the lit underside.
  const blobs = [];
  const RB = rng(31);
  for (const o of S.oaks) o.br.forEach(([ex, ey], k) => {
    const n = 7 + Math.round(o.depth * 4), spread = 14 + o.depth * 10;
    for (let i = 0; i < n; i++) {
      const a = RB() * Math.PI * 2, d = Math.sqrt(RB()) * spread;
      blobs.push([ex + Math.cos(a) * d * 1.25, ey - 6 + Math.sin(a) * d * 0.8, 6 + RB() * 5 + o.depth * 2.5, o.depth]);
    }
  });
  [[150, 2, 9, 0.45], [138, 14, 7, 0.45], [164, 10, 7, 0.45], [104, 22, 8, 0.6], [196, 20, 8, 0.6], [2, 140, 9, 1], [8, 124, 8, 1], [298, 134, 9, 0.8]].forEach((b) => blobs.push(b));
  blobs.sort((p, q) => p[1] - q[1]); // top first: lower clumps overlap upper ones
  const lobe = (b, a) => b[2] * (1 + 0.12 * Math.sin(a * 5 + b[0]) + 0.09 * Math.sin(a * 11 + b[1] * 0.7) + 0.05 * Math.sin(a * 19 + b[2]));
  blobs.forEach((b, j) => {
    const pts = []; for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; const r = lobe(b, a); pts.push([b[0] + r * Math.cos(a), b[1] + r * Math.sin(a)]); }
    add('canopy', { k: 'fill', d: smooth(pts, true), c: 'ground' });
    // rows of small leaf scallops following the lower contour, thinning as they climb
    const rows = Math.max(2, Math.round(b[2] / 2.4));
    for (let row = 0; row < rows; row++) {
      const k = row / rows, rr = 1 - k * 0.85;
      const span = Math.PI * (0.6 + 0.55 * (1 - k));
      const step = 3.2 / (b[2] * rr);
      for (let a = Math.PI / 2 - span / 2 + (row % 2) * step * 0.5; a < Math.PI / 2 + span / 2; a += step * (1 + RB() * 0.35)) {
        if (RB() < 0.1 + k * 0.55) continue;
        const r = lobe(b, a) * rr - 1, x = b[0] + r * Math.cos(a), y = b[1] + r * Math.sin(a);
        const s2 = 1.2 + RB() * 0.7, nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx;
        const w = r1((0.3 + 0.7 * (1 - k)) * (0.55 + 0.45 * b[3]));
        add('canopy', { k: 'pen', d: `M${r1(x - tx * s2)} ${r1(y - ty * s2)}Q${r1(x + nx * s2 * 1.4)} ${r1(y + ny * s2 * 1.4)} ${r1(x + tx * s2)} ${r1(y + ty * s2)}`, w, c: 'gold' });
      }
    }
    // a thin rim on the top against the sky
    const rim = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.15 + 0.7 * (i / 10)); const r = lobe(b, a); rim.push([b[0] + r * Math.cos(a), b[1] + r * Math.sin(a)]); }
    add('canopy', { k: 'rib', d: ribbon(P.poly(rim), 0.55, (t) => taper(t, 0), { wob: 0.15, seed: j * 7 + 3 }), c: 'gold' });
  });

  // cables from the bottom hubs up to the oaks (drawn behind the house)
  S.cables.forEach(([hi, id, ay], i) => {
    const o = oak(id), h = S.hubs[hi], x = oakX(o, ay) + (oakX(o, ay) > h[0] ? -oakW(o, ay) / 2 : oakW(o, ay) / 2);
    add('cables', { k: 'pen', d: pen(P.line(h, [x, ay]), { step: 8, wob: 0.15, seed: 300 + i }), w: 0.75, c: 'gold' });
  });

  // the house: small spire, big spire
  for (const [key, n, bright] of [['small', 2, 0.75], ['big', 3, 1]]) {
    const sp = S[key], lay = 'spire-' + key, { Lf, Rf } = spireSides(sp);
    add(lay, { k: 'fill', d: spireOutline(sp, n), c: 'ground' });
    const M = key === 'big' ? 30 : 18;
    for (let i = 1; i < M; i++) {
      const u = i / M;
      const v0 = 0.05 + (i % 2 ? 0.1 : 0.02) + 0.18 * Math.abs(u - 0.5) * (i % 3 === 0 ? 0 : 1);
      const fn = (v) => { const a = Lf(v), b = Rf(v); const x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); return [x, Math.min(y, hemY(sp, x, n) - 0.8)]; };
      const tone = (0.3 + 0.7 * Math.sin(Math.PI * u) ** 0.7) * bright;
      const seam = Math.abs(u * n - Math.round(u * n)) < 0.5 / M * n && Math.round(u * n) > 0 && Math.round(u * n) < n;
      add(lay, { k: 'rib', d: ribbon(fn, (seam ? 2.0 : 1.55) * tone, (t) => Math.max(0.12, 0.15 + 0.85 * t ** 0.8) * (t > 0.97 ? 0.6 : 1), { t0: v0, t1: 1, wob: 0.18, seed: i * 11 + n, step: 2.5 }), c: seam ? 'gold' : 'light' });
    }
    // silhouette
    add(lay, { k: 'rib', d: ribbon(Lf, 1.7 * bright, (t) => 0.35 + 0.65 * t, { wob: 0.2, seed: 21 + n }), c: 'light' });
    add(lay, { k: 'rib', d: ribbon(Rf, 1.2 * bright, (t) => 0.35 + 0.65 * t, { wob: 0.2, seed: 23 + n }), c: 'light' });
    add(lay, { k: 'rib', d: ribbon((t) => { const x = lerp(sp.cx - sp.hw, sp.cx + sp.hw, t); return [x, hemY(sp, x, n)]; }, 1.5 * bright, () => 1, { wob: 0.1, seed: 31 + n, step: 1.5 }), c: 'light' });
    if (key === 'big') {
      const wd = windowShape();
      add(lay, { k: 'fill', d: `M${wd.x - 2.6} ${wd.yb + 2.6} V${wd.yt + wd.w / 2} A${wd.w / 2 + 2.6} ${wd.w / 2 + 2.6} 0 0 1 ${wd.x + wd.w + 2.6} ${wd.yt + wd.w / 2} V${wd.yb + 2.6} Z`, c: 'ground' });
      add(lay, { k: 'fill', d: wd.d, c: 'light', cls: 'win' });
      add(lay, { k: 'pen', d: `M${wd.x + wd.w / 2} ${wd.yt + 1} V${wd.yb}M${wd.x} ${wd.yt + wd.w / 2 + 5} H${wd.x + wd.w}`, w: 1.1, c: 'ground', cls: 'win' });
    }
    // finial: a slender gold cap with a bead
    const { cx, ty } = sp, s = key === 'big' ? 1 : 0.8, hh = 20 * s, w = 4.2 * s;
    add(lay, { k: 'fill', d: `M${cx} ${r1(ty - hh)} C${r1(cx + w * 0.25)} ${r1(ty - hh * 0.45)} ${r1(cx + w)} ${r1(ty - 3 * s)} ${r1(cx + w)} ${r1(ty + s)} L${r1(cx - w)} ${r1(ty + s)} C${r1(cx - w)} ${r1(ty - 3 * s)} ${r1(cx - w * 0.25)} ${r1(ty - hh * 0.45)} ${cx} ${r1(ty - hh)} Z`, c: 'gold', cls: 'finial' });
    add(lay, { k: 'dot', x: cx, y: r1(ty - hh - 2.2 * s), r: r1(1.8 * s), c: 'gold', cls: 'finial' });
  }

  // deck, rail and lights
  const { deckY: dy, deckX0: x0, deckX1: x1, deckT: dt } = S;
  add('deck', { k: 'fill', d: `M${x0} ${dy - 1} H${x1} V${dy + dt} H${x0} Z`, c: 'ground' });
  add('deck', { k: 'rib', d: ribbon(P.line([x0, dy], [x1, dy]), 2.4, () => 1, { wob: 0.25, seed: 401 }), c: 'gold' });
  add('deck', { k: 'pen', d: pen(P.line([x0 + 1, dy + dt], [x1 - 1, dy + dt]), { wob: 0.2, seed: 402 }), w: 0.8, c: 'gold' });
  for (let x = x0 + 3; x < x1 - 1; x += 4.2) add('deck', { k: 'pen', d: pen(P.line([x, dy + 2.6], [x + 0.4, dy + dt - 1.2]), { wob: 0.1, seed: x | 0 }), w: 0.55, c: 'gold' });
  const rx0 = S.big.cx + S.big.hw + 3, rt = dy - 17;
  add('rail', { k: 'rib', d: ribbon(P.line([rx0, rt], [x1, rt]), 1.6, () => 1, { wob: 0.2, seed: 411 }), c: 'gold' });
  add('rail', { k: 'pen', d: pen(P.line([rx0, rt + 8], [x1, rt + 8]), { wob: 0.15, seed: 412 }), w: 0.6, c: 'gold' });
  for (let i = 0; i <= 4; i++) { const x = lerp(rx0, x1, i / 4); add('rail', { k: 'pen', d: pen(P.line([x, rt], [x, dy]), { wob: 0.1, seed: 420 + i }), w: 1.1, c: 'gold' }); }
  const lights = [];
  for (let i = 0; i < 4; i++) lights.push([lerp(rx0, x1, (i + 0.5) / 4), rt + 3.2]);

  // truss under the deck: tetrahedron frame, hubs at the bottom
  const tr = [[S.nodes[0], S.hubs[0]], [S.nodes[1], S.hubs[0]], [S.nodes[1], S.hubs[1]], [S.nodes[2], S.hubs[1]], [S.hubs[0], S.hubs[1]]];
  tr.forEach(([a, b], i) => add('truss', { k: 'pen', d: pen(P.line(a, b), { step: 6, wob: 0.15, seed: 500 + i }), w: 1.25, c: 'gold' }));
  S.hubs.forEach((h, i) => { add('truss', { k: 'fill', d: `M${h[0] - 3.4} ${h[1]}a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0Z`, c: 'ground' }); add('truss', { k: 'pen', d: smooth(sample(P.arc(h[0], h[1], 3.2, 0, Math.PI * 2), { step: 1, wob: 0.05, seed: 600 + i })), w: 1.1, c: 'gold' }); add('truss', { k: 'dot', x: h[0], y: h[1], r: 1.1, c: 'gold' }); });

  // the bridge: walkway with planks, two hand ropes, netting, lights on the upper rope
  const A = [0, 316], B = [x0 + 1, dy + 1], sag = 24;
  const walk = P.quad(A, [(A[0] + B[0]) / 2, Math.max(A[1], B[1]) + sag], B);
  const ropeA = [A[0], A[1] - 22], ropeB = [B[0], B[1] - 22];
  const rope = P.quad(ropeA, [(ropeA[0] + ropeB[0]) / 2, Math.max(ropeA[1], ropeB[1]) + sag], ropeB);
  const rope2 = P.quad([A[0], A[1] - 11], [(A[0] + B[0]) / 2, Math.max(A[1], B[1]) - 11 + sag], [B[0], B[1] - 11]);
  add('bridge', { k: 'rib', d: ribbon(walk, 2.6, () => 1, { wob: 0.2, seed: 701 }), c: 'gold' });
  for (let i = 1; i < 18; i++) { const t = i / 18, p = walk(t), q = walk(Math.min(1, t + 0.01)); const dx = q[0] - p[0], dy2 = q[1] - p[1], m = Math.hypot(dx, dy2); add('bridge', { k: 'pen', d: pen(P.line([p[0] + (dy2 / m) * 2.5, p[1] - (dx / m) * 2.5], [p[0] - (dy2 / m) * 1.2, p[1] + (dx / m) * 1.2]), { wob: 0.05, seed: 710 + i }), w: 0.9, c: 'gold' }); }
  add('bridge', { k: 'pen', d: pen(rope, { wob: 0.2, seed: 702 }), w: 1.2, c: 'gold' });
  add('bridge', { k: 'pen', d: pen(rope2, { wob: 0.2, seed: 703 }), w: 0.6, c: 'gold' });
  for (let i = 1; i < 12; i++) { const t = i / 12, a = rope(t), b = walk(t); add('bridge', { k: 'pen', d: pen(P.line(a, b), { wob: 0.1, seed: 720 + i }), w: 0.6, c: 'gold' }); }
  for (let i = 0; i < 11; i++) { const t = i / 12, t2 = (i + 1) / 12; for (const [a, b] of [[rope(t), walk(t2)], [walk(t), rope(t2)]]) add('bridge', { k: 'pen', d: pen(P.line(a, b), { wob: 0.05, seed: 740 + i }), w: 0.3, c: 'gold' }); }
  for (let i = 0; i < 5; i++) { const p = rope((i + 0.5) / 5); lights.push([p[0], p[1] + 3.6]); }

  // lights: a bright point with four fine rays
  lights.forEach(([x, y], i) => {
    add('lights', { k: 'dot', x: r1(x), y: r1(y), r: 2.6, c: 'ground', cls: 'bulb', i });
    add('lights', { k: 'dot', x: r1(x), y: r1(y), r: 1.45, c: 'light', cls: 'bulb', i });
    for (const [dx, dy3, len] of [[1, 0, 4.5], [-1, 0, 4.5], [0, -1, 4], [0, 1, 4], [0.7, 0.7, 2.6], [-0.7, 0.7, 2.6], [0.7, -0.7, 2.6], [-0.7, -0.7, 2.6]]) add('lights', { k: 'pen', d: `M${r1(x + dx * 2.6)} ${r1(y + dy3 * 2.6)}L${r1(x + dx * (2.6 + len))} ${r1(y + dy3 * (2.6 + len))}`, w: len > 3 ? 0.45 : 0.35, c: 'light', cls: 'ray', i });
  });

  // a few fern fronds on the forest floor, far below
  [[16, 414, 1, 34], [44, 418, 1, 26], [6, 404, 1, 22], [284, 414, -1, 34], [258, 418, -1, 24], [294, 400, -1, 20]].forEach(([fx, fy, dir, len], k) => {
    const stem = P.quad([fx, fy], [fx + dir * len * 0.2, fy - len * 0.8], [fx + dir * len * 0.7, fy - len * 0.95]);
    add('floor', { k: 'pen', d: pen(stem, { step: 2, wob: 0.15, seed: 800 + k }), w: 0.7, c: 'gold' });
    for (let j = 1; j < 9; j++) { const t = j / 9, p = stem(t), q = stem(Math.min(1, t + 0.02)); const dx = q[0] - p[0], dy4 = q[1] - p[1], m = Math.hypot(dx, dy4) || 1, l = (1 - t) * len * 0.32 + 1; for (const sgn of [-1, 1]) add('floor', { k: 'pen', d: pen(P.quad(p, [p[0] + (dx / m) * l * 0.3 + sgn * (dy4 / m) * l * 0.6, p[1] + (dy4 / m) * l * 0.3 - sgn * (dx / m) * l * 0.6], [p[0] + (dx / m) * l * 0.7 + sgn * (dy4 / m) * l, p[1] + (dy4 / m) * l * 0.7 - sgn * (dx / m) * l]), { step: 1.5, wob: 0.05, seed: 820 + j + k * 20 }), w: 0.5, c: 'gold' }); }
  });

  return { L, lights };
}

// Draw order, back to front.
const ORDER = ['sky', 'oak-O5', 'oak-O2', 'oak-O4', 'canopy', 'cables', 'floor', 'spire-small', 'spire-big', 'truss', 'oak-O3', 'deck', 'rail', 'bridge', 'oak-O1', 'lights'];
// O1 sits in front of the bridge's far end; move the bridge after O1 so the walkway crosses in front.
ORDER.splice(ORDER.indexOf('bridge'), 1); ORDER.splice(ORDER.indexOf('oak-O1') + 1, 0, 'bridge');

module.exports = { W, H, S, build, ORDER, archPath, ribbon, pen, P, sample, smooth, noise1, rng, r1 };
