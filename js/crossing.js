/* ============================================================
   LOXLEY FOREST · the crossing, walked
   Scroll carries the guest across the hundred-foot bridge, drawn
   in the logo's engraving (scripts/logo/engrave.js): light lines
   on the dark, every tone a line, a slight hand wobble, no
   gradients. The camera walks the deck from the first platform to
   the treehouse; halfway it looks down at the creek, then back up
   into the canopy. The far end opens onto the calendar.
   Reduced motion shows the opening view as a still engraving.

   Drawn true to the bridge in Mick's photographs
   (images/source/crossing/): long deck boards on crossbeams,
   hangers to a top rope, wire netting, lights along the top rope.
   Units are feet: x right, y up, z along the bridge.
   ============================================================ */
(function () {
  'use strict';
  const sec = document.querySelector('[data-crossing]');
  if (!sec) return;
  const stage = sec.querySelector('.lf-walk__stage');
  const cv = stage.querySelector('canvas');
  const ctx = cv.getContext('2d', { alpha: false });
  const words = Array.from(sec.querySelectorAll('[data-from]'));
  const countEl = sec.querySelector('[data-walk-count]');
  const markEl = sec.querySelector('[data-walk-mark]');
  const STILL = sec.hasAttribute('data-still') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- ink
  // The colour emblem's three inks (scripts/logo/emblem2.js).
  const RGB = { k: [26, 46, 26], g: [201, 168, 104], l: [247, 228, 189] };
  const LV = 10;
  const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
  const GROUND = mix(RGB.k, RGB.k, 0);
  const STYLE = [];
  for (let layer = 0; layer < 5; layer++) for (let lv = 0; lv <= 15; lv++) {
    const c = layer === 0 || layer === 2 ? null : layer === 1 ? 'g' : 'l';
    STYLE[layer * 16 + lv] = c ? mix(RGB.k, RGB[c], Math.min(lv, LV) / LV) : GROUND;
  }
  // layers, back to front within one object: 0 fills, 1 gold lines, 2 dark halos, 3 light lines, 4 light dots

  // ---------------------------------------------------------------- randomness (as in engrave.js)
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function noise1(seed) {
    const r = rng(seed), N = 97, v = Array.from({ length: N }, () => r() * 2 - 1);
    return (x) => { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); const a = v[((i % N) + N) % N], b = v[(((i + 1) % N) + N) % N]; return a + (b - a) * t; };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rad = (d) => (d * Math.PI) / 180;

  // ---------------------------------------------------------------- the place
  const SPAN = 100;      // the bridge, feet
  const SAG = 4.2;       // its sag at the middle
  const EYE = 5.3;       // eye height above the deck
  const FLOOR = -62;     // the forest floor, sixty feet down
  const TOP = 96;        // where trunks leave the frame
  const HALF = 1.5;      // half the walking width
  const H0 = 2.0, H1 = 2.6, RAIL = 4.1; // netting from the deck edge out and up to the top rope
  const deckY = (z) => (z <= 0 || z >= SPAN ? 0 : -SAG * 4 * (z / SPAN) * (1 - z / SPAN));
  // the creek, crossing beneath the bridge
  const creekZ = (x) => 47 + 8 * Math.sin(x * 0.034 + 0.9) + 3 * Math.sin(x * 0.11 + 2);
  const floorY = (x, z) => FLOOR + Math.min(26, 0.05 * Math.abs(z - creekZ(x)) ** 1.35) + 0.6 * Math.sin(x * 0.21 + z * 0.13);
  // the treehouse
  const HOUSE = { x0: -19, x1: 6, z0: 100.6, z1: 124 };
  const SPIRES = [
    { cx: -13.6, cz: 117.5, r: 4.6, h: 13.5, M: 64, seams: 2, bright: 0.75, win: false, seed: 55 },
    { cx: -5.4, cz: 112.5, r: 7.0, h: 19.5, M: 96, seams: 3, bright: 1, win: true, seed: 77 },
  ];

  // ---------------------------------------------------------------- the scene, as objects of world-space marks
  const OBJ = [];
  let SEED = 11;
  function obj(x, y, z, draw) { const o = { x, y, z, items: [], draw, d: 0 }; OBJ.push(o); return o; }
  // a line through world points; w = width in feet; tone 0..1; lod = farthest depth it is drawn at
  function ln(o, pts, w, c, tone, extra) {
    const n = pts.length, P = new Float32Array(n * 3), N = new Float32Array(n), nz = noise1(SEED++);
    let s = 0;
    for (let i = 0; i < n; i++) {
      P[i * 3] = pts[i][0]; P[i * 3 + 1] = pts[i][1]; P[i * 3 + 2] = pts[i][2];
      if (i) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
      N[i] = nz(s * 0.8 + SEED * 1.7);
    }
    const it = { k: 0, P, N, n, w, c, tone, taper: 0, lod: 1e9 };
    if (extra) Object.assign(it, extra);
    o.items.push(it);
    return it;
  }
  function fill(o, pts) {
    const P = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { P[i * 3] = p[0]; P[i * 3 + 1] = p[1]; P[i * 3 + 2] = p[2]; });
    o.items.push({ k: 1, P, n: pts.length });
  }
  function bulb(o, x, y, z, r) { o.items.push({ k: 2, x, y, z, r: r || 0.13 }); }
  const along = (fn, n) => { const a = []; for (let i = 0; i <= n; i++) a.push(fn(i / n)); return a; };

  // ---- the bridge, in two-foot bays
  for (let z0 = 0; z0 < SPAN; z0 += 2) {
    const z1 = z0 + 2, zm = z0 + 1, o = obj(0, deckY(zm) + 1.5, zm);
    const zs = [z0, zm, z1], at = (x, dy, z) => [x, deckY(z) + dy, z];
    // deck boards run the length of the bridge, on crossbeams
    for (let b = 0; b < 5; b++) {
      const xa = -HALF + b * 0.6 + 0.03, xb = xa + 0.54;
      fill(o, [at(xa, 0, z0), at(xb, 0, z0), at(xb, 0, z1), at(xa, 0, z1)]);
      ln(o, zs.map((z) => at(xa, 0, z)), 0.022, 'g', 0.62);
      ln(o, zs.map((z) => at(xb, 0, z)), 0.03, 'g', 0.85);
      const R = rng(z0 * 7 + b);
      if (R() < 0.8) { const gx = lerp(xa, xb, 0.25 + R() * 0.5), za = z0 + R() * 0.6, zb = za + 0.6 + R() * 0.9; ln(o, along((t) => at(gx + 0.02 * Math.sin(t * 3 + b), 0, lerp(za, zb, t)), 2), 0.012, 'g', 0.42, { lod: 16, taper: 1 }); }
      if ((z0 + b * 3) % 10 === 0) ln(o, [at(xa, 0, z0 + 0.02), at(xb, 0, z0 + 0.02)], 0.02, 'g', 0.6, { lod: 40 });
    }
    for (const s of [-1, 1]) {
      // the crossbeam's end, past the boards
      ln(o, [at(s * 1.46, -0.06, zm), at(s * 2.24, -0.06, zm)], 0.2, 'g', 0.7);
      // ropes: the deck edge, the middle, the top rope that carries the lights
      ln(o, zs.map((z) => at(s * H0, 0.04, z)), 0.06, 'g', 0.85);
      ln(o, zs.map((z) => at(s * lerp(H0, H1, 0.5), RAIL * 0.5, z)), 0.028, 'g', 0.55);
      ln(o, zs.map((z) => at(s * H1, RAIL, z)), 0.075, 'g', 1);
      // a hanger every four feet
      if (z0 % 4 === 0) ln(o, along((t) => at(s * lerp(H0, H1, t), RAIL * t, z0), 2), 0.034, 'g', 0.9);
      // the netting: two families of diagonals in the plane of the side
      const D = 1.5, m = 0.5, wall = (z, v) => at(s * lerp(H0, H1, v), RAIL * v, z);
      for (const dir of [1, -1]) {
        let k = 0;
        for (let c = z0 - D; c < z1 + D; c += m, k++) {
          // z = c + dir * v * D, clipped to this bay and to 0..1 in v
          let va = 0, vb = 1;
          const zA = (v) => c + dir * v * D;
          const vAt = (z) => (z - c) / (dir * D);
          let lo = vAt(z0), hi = vAt(z1); if (lo > hi) [lo, hi] = [hi, lo];
          va = Math.max(va, lo); vb = Math.min(vb, hi);
          if (vb - va < 0.02) continue;
          ln(o, along((t) => wall(zA(lerp(va, vb, t)), lerp(va, vb, t)), 2), 0.011, 'g', 0.46, { lod: k % 2 ? 34 : 70, maxPx: 0.9 });
        }
      }
      // the lights ride the top rope, one each bay, staggered side to side
      const zb = s > 0 ? z0 + 0.5 : z0 + 1.5;
      ln(o, [at(s * H1, RAIL, zb), at(s * H1, RAIL - 0.2, zb)], 0.012, 'g', 0.7, { lod: 30 });
      bulb(o, s * H1, deckY(zb) + RAIL - 0.27, zb);
    }
  }

  // ---- the platforms and their gateways: the first one under the camera, the far one at the deck
  function gateway(z) {
    const o = obj(0, 3.5, z);
    for (const s of [-1, 1]) {
      const x = s * 2.35;
      fill(o, [[x - 0.2, 0, z], [x + 0.2, 0, z], [x + 0.2, 7.4, z], [x - 0.2, 7.4, z]]);
      ln(o, [[x - 0.2 * s, 0, z], [x - 0.2 * s, 7.4, z]], 0.06, 'g', 0.95);
      ln(o, [[x + 0.2 * s, 0, z], [x + 0.2 * s, 7.4, z]], 0.03, 'g', 0.5);
      for (let y = 0.6; y < 7; y += 0.9 + (y * 7 % 1) * 0.6) ln(o, [[x - 0.1, y, z], [x - 0.08, y + 0.5, z]], 0.012, 'g', 0.5, { lod: 20 });
    }
    fill(o, [[-3.1, 7.4, z], [3.1, 7.4, z], [3.1, 7.95, z], [-3.1, 7.95, z]]);
    ln(o, along((t) => [lerp(-3.1, 3.1, t), 7.42, z], 4), 0.05, 'g', 1);
    ln(o, along((t) => [lerp(-3.1, 3.1, t), 7.93, z], 4), 0.025, 'g', 0.6);
    for (let i = 0; i < 4; i++) { const y = 7.52 + i * 0.1, a = -3 + (i % 2) * 0.9; ln(o, along((t) => [lerp(a, a + 4.2, t), y + 0.01 * Math.sin(t * 9 + i), z], 4), 0.01, 'g', 0.4, { lod: 26, taper: 1 }); }
  }
  {
    // the first platform: boards across, a rail each side
    for (let z0 = -10; z0 < 0; z0 += 2) {
      const o = obj(0, 0.5, z0 + 1);
      fill(o, [[-4.4, 0, z0], [4.4, 0, z0], [4.4, 0, z0 + 2], [-4.4, 0, z0 + 2]]);
      for (let z = z0 + 0.28; z < z0 + 2; z += 0.56) ln(o, along((t) => [lerp(-4.4, 4.4, t), 0, z], 4), 0.022, 'g', 0.7);
      for (const s of [-1, 1]) {
        ln(o, [[s * 4.4, 3.4, z0], [s * 4.4, 3.4, z0 + 2]], 0.07, 'g', 0.9);
        ln(o, [[s * 4.4, 1.7, z0], [s * 4.4, 1.7, z0 + 2]], 0.03, 'g', 0.55);
        ln(o, [[s * 4.4, 0, z0], [s * 4.4, 3.4, z0]], 0.06, 'g', 0.85);
      }
    }
    gateway(-0.3);
    gateway(SPAN + 0.3);
  }

  // ---- the treehouse: its deck, rail and lights; the spires are drawn below
  {
    const { x0, x1, z0, z1 } = HOUSE;
    for (let zz = z0; zz < z1; zz += 4) {
      const o = obj((x0 + x1) / 2, 0, zz + 2);
      const zb = Math.min(z1, zz + 4);
      fill(o, [[x0, 0, zz], [x1, 0, zz], [x1, 0, zb], [x0, 0, zb]]);
      for (let z = zz + 0.27; z < zb; z += 0.55) ln(o, along((t) => [lerp(x0, x1, t), 0, z], 6), 0.02, 'g', 0.62, { lod: 50 });
    }
    // the fascia and the rail, with mesh panels and lights, along the front and the sides
    const o = obj((x0 + x1) / 2, 2, z0);
    ln(o, along((t) => [lerp(x0, x1, t), 0, z0], 8), 0.08, 'g', 1);
    ln(o, along((t) => [lerp(x0, x1, t), -0.9, z0], 8), 0.04, 'g', 0.7);
    const railRun = (a, b, oo) => {
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]), nPost = Math.max(1, Math.round(len / 4));
      ln(oo, along((t) => [lerp(a[0], b[0], t), 3.5, lerp(a[2], b[2], t)], 6), 0.07, 'g', 0.95);
      ln(oo, along((t) => [lerp(a[0], b[0], t), 0.25, lerp(a[2], b[2], t)], 6), 0.04, 'g', 0.6);
      for (let i = 0; i <= nPost; i++) { const t = i / nPost, x = lerp(a[0], b[0], t), z = lerp(a[2], b[2], t); ln(oo, [[x, 0, z], [x, 3.5, z]], 0.07, 'g', 0.9); }
      for (let d = 0.4; d < len; d += 0.55) { const t = d / len, x = lerp(a[0], b[0], t), z = lerp(a[2], b[2], t), t2 = Math.min(1, (d + 1.6) / len); ln(oo, [[x, 0.3, z], [lerp(a[0], b[0], t2), 3.4, lerp(a[2], b[2], t2)]], 0.011, 'g', 0.42, { lod: 40 }); }
      for (let d = 1; d < len; d += 2.2) { const t = d / len; bulb(oo, lerp(a[0], b[0], t), 3.25, lerp(a[2], b[2], t)); }
    };
    railRun([x0, 0, z0], [-2.6, 0, z0], o);
    railRun([2.6, 0, z0], [x1, 0, z0], o);
    const sideL = obj(HOUSE.x0, 2, (z0 + z1) / 2), sideR = obj(HOUSE.x1, 2, (z0 + z1) / 2);
    railRun([x0, 0, z0], [x0, 0, z1], sideL);
    railRun([x1, 0, z0], [x1, 0, z1], sideR);
    // the truss beneath the deck: frame lines to two hubs, every cable from the hubs to an oak
    const ot = obj(-6, -5, 112);
    const hubs = [[-10, -6.4, 110], [-2.5, -6.8, 114]];
    const nodes = [[-17, -0.9, 104], [-6, -0.9, 101.5], [4.5, -0.9, 106], [-7, -0.9, 122]];
    [[0, 0], [1, 0], [1, 1], [2, 1], [3, 0], [3, 1]].forEach(([n, h]) => ln(ot, along((t) => [lerp(nodes[n][0], hubs[h][0], t), lerp(nodes[n][1], hubs[h][1], t), lerp(nodes[n][2], hubs[h][2], t)], 3), 0.09, 'g', 0.8));
    ln(ot, along((t) => [lerp(hubs[0][0], hubs[1][0], t), lerp(hubs[0][1], hubs[1][1], t), lerp(hubs[0][2], hubs[1][2], t)], 3), 0.09, 'g', 0.8);
    ot.hubs = hubs;
  }

  // ---- the oaks: the two at the first platform, the five that hold the house, and the forest
  const TREES = [];
  function tree(x, z, r, opts) {
    const R = rng(Math.round(x * 13 + z * 7 + 999));
    const t = { x, z, r, lean: [(R() - 0.5) * 0.04, (R() - 0.5) * 0.03], bend: (R() - 0.5) * 2.4, seed: Math.round(R() * 1e6), bark: [], limbs: [], house: opts && opts.house };
    // bark: broken strokes in columns, densest on the lit half
    const nB = r > 1.2 ? 11 : 8;
    for (let j = 0; j < nB; j++) {
      const fx = (j + 0.5) / nB;
      if (fx < 0.3 && R() > 0.4) continue;
      let y = FLOOR + R() * 4;
      while (y < TOP) { const len = 2.5 + R() * 8, y2 = Math.min(TOP, y + len); t.bark.push(fx, y, y2, 0.6 + R() * 0.6); y = y2 + 0.7 + R() * 3.5; }
    }
    // limbs reaching out and up, each ending in clumps of leaves
    const nL = r > 0.85 ? 1 + Math.floor(R() * 3) : R() < 0.5 ? 1 : 0;
    for (let i = 0; i < nL; i++) {
      const out = x > 0 ? 0 : Math.PI, near = Math.abs(x) < 12;
      const yb = near ? 26 + R() * 20 : 6 + R() * 34, ang = out + (R() - 0.5) * (near ? 1.4 : 2.6), len = 9 + R() * 16, rise = 0.5 + R() * 0.7;
      const a = [x, yb, z], dx = Math.cos(ang), dz = Math.sin(ang);
      const e = [x + dx * len, yb + len * rise, z + dz * len], c = [x + dx * len * 0.55, yb + len * rise * 0.25, z + dz * len * 0.55];
      t.limbs.push({ a, c, e, r0: r * 0.42, seed: Math.round(R() * 1e5) });
    }
    TREES.push(t);
    obj(x, EYE, z, drawTree).t = t;
    return t;
  }
  // "suspended between two ancient white oaks"
  tree(-5.8, -1.6, 1.7); tree(6.0, 0.4, 1.55);
  // five oaks hold the house up
  [[4.6, 102.2, 1.6], [-22.5, 106.5, 1.3], [9, 119.5, 1.4], [-20.5, 125.5, 1.2], [-8.5, 131, 1.1]].forEach(([x, z, r]) => tree(x, z, r, { house: true }));
  {
    const R = rng(4242);
    for (let tries = 0; tries < 1400 && TREES.length < 104; tries++) {
      const side = R() < 0.5 ? -1 : 1, x = side * (6.5 + R() ** 0.8 * 120), z = -50 + R() * 290, r = 0.55 + R() ** 1.6 * 1.1;
      if (x > HOUSE.x0 - 6 && x < HOUSE.x1 + 5 && z > HOUSE.z0 - 5 && z < HOUSE.z1 + 10) continue;
      if (Math.abs(x) < 9 && z > -14 && z < 2) continue;
      let ok = true;
      for (const t of TREES) if (Math.hypot(t.x - x, t.z - z) < 7 + (t.r + r) * 1.5) { ok = false; break; }
      if (ok) tree(x, z, r);
    }
  }
  // the canopy: clumps at the limb ends, and the high canopy, open over the bridge's far half and the house
  const CLUMPS = [];
  function clump(x, y, z, R0, seed) {
    const R = rng(seed);
    const c = { x, y, z, R: R0, lob: [R() * 6, R() * 6, R() * 6], sc: [] };
    // scallops in rows along the lower contour, thinning as they climb (as engrave.js draws the canopy)
    const rows = 6;
    for (let row = 0; row < rows; row++) {
      const k = row / rows, rr = 1 - k * 0.85, span = Math.PI * (0.6 + 0.55 * (1 - k)), step = 0.26 / rr;
      for (let a = Math.PI / 2 - span / 2 + (row % 2) * step * 0.5; a < Math.PI / 2 + span / 2; a += step * (1 + R() * 0.35)) {
        if (R() < 0.1 + k * 0.55) continue;
        c.sc.push(a, row, rr, 0.1 + R() * 0.06);
      }
    }
    CLUMPS.push(c);
    obj(x, y, z, drawClump).c = c;
  }
  {
    let seed = 900;
    for (const t of TREES) for (const L of t.limbs) {
      const R = rng(L.seed), n = 4 + Math.floor(R() * 4);
      for (let i = 0; i < n; i++) clump(L.e[0] + (R() - 0.5) * 9, L.e[1] + (R() - 0.3) * 5, L.e[2] + (R() - 0.5) * 9, 3 + R() * 3.5, seed++);
    }
    const R = rng(77);
    for (let i = 0; i < 150; i++) {
      const x = (R() - 0.5) * 220, z = -40 + R() * 280, y = 34 + R() * 46;
      if (Math.abs(x) < 26 && z > 40 && z < 150 && y < 74) continue; // the opening over the far half and the house
      clump(x, y, z, 4 + R() * 5, seed++);
    }
  }
  // the forest floor: rows of broken lines that only catch light near the creek; the creek itself in light
  {
    for (let z = -40; z < 240; z += 3.2) {
      const o = obj(0, FLOOR, z);
      let run = [];
      const flush = () => { if (run.length > 1) ln(o, run.map((p) => p.slice(0, 3)), 0.16, 'g', run.reduce((s, p) => s + p[3], 0) / run.length, { taper: 1 }); run = []; };
      const nz = noise1(Math.round(z * 10) + 5);
      for (let x = -150; x <= 150; x += 5) {
        const zz = z + 1.2 * Math.sin(x * 0.07 + z), near = Math.exp(-(((zz - creekZ(x)) / 16) ** 2));
        const tone = 0.1 + 0.75 * near + 0.1 * nz(x * 0.05);
        if (tone > 0.14 && nz(x * 0.09 + 3) > -0.45) { run.push([x, floorY(x, zz), zz, tone]); if (run.length > 6) { flush(); } } else flush();
      }
      flush();
    }
    // water: horizontal strokes, brightest in the middle of the stream
    for (let off = -4.2; off <= 4.21; off += 0.42) {
      const o = obj(0, FLOOR, creekZ(0) + off), nz = noise1(Math.round(off * 100) + 31);
      let run = [];
      const flush = () => { if (run.length > 1) ln(o, run, 0.3, 'l', 1 - Math.abs(off) * 0.1, { taper: 1, minTone: 0.62 }); run = []; };
      for (let x = -150; x <= 150; x += 2.5) {
        if (nz(x * 0.12) > -0.25) { run.push([x, FLOOR - 0.3, creekZ(x) + off]); if (run.length > 4) flush(); } else flush();
      }
      flush();
    }
    for (const side of [-1, 1]) {
      const o = obj(0, FLOOR, creekZ(0) + side * 3.4);
      ln(o, along((t) => { const x = lerp(-150, 150, t); return [x, FLOOR + 0.2, creekZ(x) + side * (4.9 + 0.6 * Math.sin(x * 0.3))]; }, 120), 0.16, 'g', 0.9, { minTone: 0.5 });
    }
  }
  {
    const R = rng(808);
    // boulders: an outline on the ground and a few strokes of shade across the lit face
    for (let i = 0; i < 26; i++) {
      const x = (R() - 0.5) * 150, side = R() < 0.5 ? -1 : 1, z = creekZ(x) + side * (5.5 + R() * 9), r = 1.6 + R() * 2.8;
      const o = obj(x, FLOOR, z), y0 = floorY(x, z), nz = noise1(i + 300), ring = [];
      for (let k = 0; k <= 18; k++) { const a = (k / 18) * Math.PI * 2, rr = r * (1 + 0.18 * nz(k * 0.7)); ring.push([x + rr * Math.cos(a), y0 + Math.max(0, Math.sin(a)) * r * 0.55, z + rr * Math.sin(a) * 0.8]); }
      fill(o, ring);
      ln(o, ring, 0.09, 'g', 0.8, { minTone: 0.35 });
      for (let k = 0; k < 4; k++) { const a = -0.3 + k * 0.28; ln(o, along((t) => [x + r * lerp(-0.6, 0.6, t), y0 + r * (0.45 - k * 0.1), z - r * 0.5 + a], 2), 0.05, 'g', 0.55, { taper: 1, lod: 120 }); }
    }
    // fern fronds, the logo's: a curving stem, leaflets both sides
    for (let i = 0; i < 70; i++) {
      const x = (R() - 0.5) * 170, z = creekZ(x) + (R() - 0.5) * 34, len = 2 + R() * 2.2, dir = R() * Math.PI * 2;
      const o = obj(x, FLOOR, z), y0 = floorY(x, z), dx = Math.cos(dir), dz = Math.sin(dir);
      const stem = (t) => [x + dx * len * 0.7 * t, y0 + len * (0.8 * t - 0.45 * t * t), z + dz * len * 0.7 * t];
      ln(o, along(stem, 6), 0.07, 'g', 0.7, { minTone: 0.3 });
      for (let j = 1; j < 7; j++) {
        const t = j / 7, p = stem(t), l = (1 - t) * len * 0.3 + 0.2;
        for (const sg of [-1, 1]) ln(o, [p, [p[0] - dz * sg * l + dx * l * 0.4, p[1] - l * 0.2, p[2] + dx * sg * l + dz * l * 0.4]], 0.05, 'g', 0.6, { taper: 1, lod: 110, minTone: 0.25 });
      }
    }
  }
  // the spires
  for (const sp of SPIRES) obj(sp.cx, sp.h * 0.4, sp.cz, drawSpire).sp = sp;

  // ---------------------------------------------------------------- the camera
  const cam = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0, f: 300, W: 0, H: 0, cx: 0, cy: 0, sp: 0, cp: 1, sy: 0, cyw: 1 };
  const NEAR = 0.35;
  let dpr = 1;
  function setCam(x, y, z, pitch, yaw, roll) {
    Object.assign(cam, { x, y, z, pitch, yaw, roll, sp: Math.sin(pitch), cp: Math.cos(pitch), sy: Math.sin(yaw), cyw: Math.cos(yaw) });
  }
  const C = new Float32Array(3);
  function toCam(x, y, z) {
    const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
    const X = dx * cam.cyw - dz * cam.sy, Z1 = dx * cam.sy + dz * cam.cyw;
    C[0] = X; C[1] = dy * cam.cp - Z1 * cam.sp; C[2] = dy * cam.sp + Z1 * cam.cp;
  }
  const fade = (Z) => 0.3 + 0.7 * Math.exp(-Math.max(0, Z - 6) / 70);

  // the walk: where you stand and where you look, for p from 0 (the first platform) to 1 (the deck)
  function walk(p) {
    const e = 0.6 * p + 0.4 * (0.5 - 0.5 * Math.cos(Math.PI * p));
    const z = lerp(-5.5, SPAN + 2.5, e);
    const plateau = (v, a, b, c, d) => smooth((v - a) / (b - a)) * (1 - smooth((v - c) / (d - c)));
    const down = plateau(z, 16, 32, 44, 60);       // the heart beats faster: the creek, sixty feet down
    const arrive = smooth((z - 78) / 24);          // the house rises
    const step = STILL ? 0 : Math.sin(z * Math.PI * 2 / 2.7);
    const pitch = rad(-4 - 44 * down + 13 * arrive);
    const yaw = rad(48 * down - 15 * arrive);
    const roll = STILL ? 0 : rad(0.35 * Math.sin(z * Math.PI / 2.7) + 0.6 * Math.sin(z * 0.09));
    const y = deckY(Math.max(0, Math.min(SPAN, z))) + EYE + 0.05 * step;
    const x = STILL ? 0 : 0.12 * Math.sin(z * 0.09);
    return { x, y, z, pitch, yaw, roll, ft: clamp(z, 0, SPAN) };
  }

  // ---------------------------------------------------------------- the painter
  const BK = Array.from({ length: 80 }, () => ({ p: [], c: [] }));
  const used = [];
  function put(key, poly) { if (window.lfPut) window.lfPut(key, poly); const b = BK[key]; if (!b.p.length && !b.c.length) used.push(key); b.p.push(poly); }
  function dot(key, x, y, r) { const b = BK[key]; if (!b.p.length && !b.c.length) used.push(key); b.c.push(x, y, r); }
  function flush() {
    used.sort((a, b) => a - b);
    for (const k of used) {
      const b = BK[k];
      ctx.beginPath();
      for (const q of b.p) { ctx.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) ctx.lineTo(q[i], q[i + 1]); ctx.closePath(); }
      for (let i = 0; i < b.c.length; i += 3) { ctx.moveTo(b.c[i] + b.c[i + 2], b.c[i + 1]); ctx.arc(b.c[i], b.c[i + 1], b.c[i + 2], 0, 6.2832); }
      ctx.fillStyle = STYLE[k];
      ctx.fill();
      b.p.length = 0; b.c.length = 0;
    }
    used.length = 0;
  }
  const level = (t) => clamp(Math.round(t * LV), 0, LV);

  // screen-space work arrays
  const MAXP = 1024;
  const SX = new Float32Array(MAXP), SY = new Float32Array(MAXP), SW = new Float32Array(MAXP), SZ = new Float32Array(MAXP), SN = new Float32Array(MAXP);
  const MINPX = 0.55, MAXPX = 5.5;
  // a swelling ribbon through SX/SY with half-widths SW and wobble SN (px), into layer/level
  function ribbon(n, key, wob) {
    if (n < 2) return;
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (let i = 0; i < n; i++) { if (SX[i] < minx) minx = SX[i]; if (SX[i] > maxx) maxx = SX[i]; if (SY[i] < miny) miny = SY[i]; if (SY[i] > maxy) maxy = SY[i]; }
    const pad = 8;
    if (maxx < -pad - cam.W * 0.1 || minx > cam.W * 1.1 + pad || maxy < -pad - cam.H * 0.1 || miny > cam.H * 1.1 + pad) return;
    const out = new Array(n * 4);
    for (let i = 0; i < n; i++) {
      const a = i > 0 ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1;
      let dx = SX[b] - SX[a], dy = SY[b] - SY[a]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      const o = wob ? SN[i] : 0, cx = SX[i] - dy * o, cy = SY[i] + dx * o, h = SW[i];
      out[i * 2] = cx - dy * h; out[i * 2 + 1] = cy + dx * h;
      const j = (2 * n - 1 - i) * 2;
      out[j] = cx + dy * h; out[j + 1] = cy - dx * h;
    }
    put(key, out);
  }
  const taperAt = (t) => Math.max(0.25, Math.min(1, Math.sin(Math.PI * clamp(t, 0, 1)) ** 0.6 * 1.18));

  // project a world line item, clip it to the near plane, and paint it
  const CXa = new Float32Array(MAXP), CYa = new Float32Array(MAXP), CZa = new Float32Array(MAXP);
  function paintLine(it, Zobj) {
    if (Zobj > it.lod) return;
    const P = it.P, n = it.n;
    for (let i = 0; i < n; i++) { toCam(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); CXa[i] = C[0]; CYa[i] = C[1]; CZa[i] = C[2]; }
    let m = 0, zsum = 0, wsum = 0;
    const emit = () => {
      if (m >= 2) {
        const Zm = zsum / m, wm = wsum / m;
        const thin = Math.min(1, (wm * 2) / MINPX);
        const key = (it.c === 'l' ? 3 : 1) * 16 + level(Math.max(it.minTone || 0, it.tone * fade(Zm) * thin));
        ribbon(m, key, true);
      }
      m = 0; zsum = 0; wsum = 0;
    };
    const push = (X, Y, Z, i, t) => {
      const px = (it.w * cam.f) / Z;
      let h = clamp(px, MINPX, it.maxPx || MAXPX) / 2;
      if (it.taper) h *= taperAt(t);
      SX[m] = cam.cx + (cam.f * X) / Z; SY[m] = cam.cy - (cam.f * Y) / Z; SW[m] = h;
      SN[m] = it.N[i] * Math.min(1.1, 0.25 + px * 0.12);
      zsum += Z; wsum += px / 2; m++;
    };
    for (let i = 0; i < n; i++) {
      const Z = CZa[i], t = n > 1 ? i / (n - 1) : 0;
      if (Z >= NEAR) {
        if (i > 0 && CZa[i - 1] < NEAR) { const k = (NEAR - CZa[i - 1]) / (Z - CZa[i - 1]); push(lerp(CXa[i - 1], CXa[i], k), lerp(CYa[i - 1], CYa[i], k), NEAR, i, t); }
        push(CXa[i], CYa[i], Z, i, t);
      } else if (i > 0 && CZa[i - 1] >= NEAR) {
        const k = (NEAR - CZa[i - 1]) / (Z - CZa[i - 1]); push(lerp(CXa[i - 1], CXa[i], k), lerp(CYa[i - 1], CYa[i], k), NEAR, i, t); emit();
      }
    }
    emit();
  }
  // a dark fill (an occluder), clipped to the near plane
  function paintFill(it) {
    const P = it.P, out = [];
    let prev = null;
    const pts = [];
    for (let i = 0; i < it.n; i++) { toCam(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); pts.push([C[0], C[1], C[2]]); }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const ain = a[2] >= NEAR, bin = b[2] >= NEAR;
      if (ain) out.push(a);
      if (ain !== bin) { const k = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), NEAR]); }
    }
    if (out.length < 3) return;
    const q = new Array(out.length * 2);
    out.forEach((p, i) => { q[i * 2] = cam.cx + (cam.f * p[0]) / p[2]; q[i * 2 + 1] = cam.cy - (cam.f * p[1]) / p[2]; });
    put(0, q);
  }
  // a string light, the logo's glyph: a dark halo, a bright point, eight fine rays
  function paintBulb(it) {
    toCam(it.x, it.y, it.z);
    const Z = C[2];
    if (Z < NEAR * 2) return;
    const sx = cam.cx + (cam.f * C[0]) / Z, sy = cam.cy - (cam.f * C[1]) / Z;
    if (sx < -40 || sx > cam.W + 40 || sy < -40 || sy > cam.H + 40) return;
    const g = clamp((it.r * cam.f) / Z, 0.32, 3.1), lv = level(0.55 + 0.45 * fade(Z));
    dot(2 * 16, sx, sy, 2.6 * g);
    dot(4 * 16 + lv, sx, sy, Math.max(0.55, 1.45 * g));
    if (g < 0.62) return;
    for (const [dx, dy, len] of RAYS) {
      SX[0] = sx + dx * 2.6 * g; SY[0] = sy + dy * 2.6 * g; SX[1] = sx + dx * (2.6 + len) * g; SY[1] = sy + dy * (2.6 + len) * g;
      const w = (len > 3 ? 0.45 : 0.35) * g * 0.5; SW[0] = w; SW[1] = w * 0.5;
      ribbon(2, 3 * 16 + lv, false);
    }
  }
  const RAYS = [[1, 0, 4.5], [-1, 0, 4.5], [0, -1, 4], [0, 1, 4], [0.7, 0.7, 2.6], [-0.7, 0.7, 2.6], [0.7, -0.7, 2.6], [-0.7, -0.7, 2.6]];

  // ---- a tube (trunk or limb) through world spine points, drawn as the logo draws its oaks:
  // a dark body, a lit edge toward the light, a fine shadow edge, bark on the lit half
  const TX = new Float32Array(MAXP), TY = new Float32Array(MAXP), TR = new Float32Array(MAXP), TZ = new Float32Array(MAXP), TT = new Float32Array(MAXP);
  function tube(spine, radius, litSign, bark, seed) {
    // spine: function t -> [x,y,z]; radius: function t -> feet
    const N = 26;
    let m = 0, prevIn = false, pX = 0, pY = 0, pZ = 0, pT = 0;
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = spine(t);
      toCam(p[0], p[1], p[2]);
      const X = C[0], Y = C[1], Z = C[2], inn = Z >= NEAR;
      if (inn && i > 0 && !prevIn) { const k = (NEAR - pZ) / (Z - pZ); addT(lerp(pX, X, k), lerp(pY, Y, k), NEAR, lerp(pT, t, k)); }
      if (inn) addT(X, Y, Z, t);
      else if (prevIn) { const k = (NEAR - pZ) / (Z - pZ); addT(lerp(pX, X, k), lerp(pY, Y, k), NEAR, lerp(pT, t, k)); break; }
      prevIn = inn; pX = X; pY = Y; pZ = Z; pT = t;
    }
    function addT(X, Y, Z, t) { TX[m] = cam.cx + (cam.f * X) / Z; TY[m] = cam.cy - (cam.f * Y) / Z; TZ[m] = Z; TT[m] = t; TR[m] = (radius(t) * cam.f) / Z; m++; }
    if (m < 2) return;
    // cull
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, rmax = 0;
    for (let i = 0; i < m; i++) { minx = Math.min(minx, TX[i] - TR[i]); maxx = Math.max(maxx, TX[i] + TR[i]); miny = Math.min(miny, TY[i]); maxy = Math.max(maxy, TY[i]); rmax = Math.max(rmax, TR[i]); }
    if (maxx < -10 || minx > cam.W + 10 || maxy < -10 || miny > cam.H + 10) return;
    if (rmax < 0.3) return;
    // normals
    const NX = new Float32Array(m), NY = new Float32Array(m);
    for (let i = 0; i < m; i++) {
      const a = i > 0 ? i - 1 : 0, b = i < m - 1 ? i + 1 : m - 1;
      let dx = TX[b] - TX[a], dy = TY[b] - TY[a]; const l = Math.hypot(dx, dy) || 1;
      NX[i] = -dy / l; NY[i] = dx / l;
    }
    // which side is lit: toward the middle of the frame, where the bridge and its lights are
    const midX = (minx + maxx) / 2;
    const side = litSign !== undefined ? litSign : (midX > cam.W / 2 ? -1 : 1) * Math.sign(NX[Math.floor(m / 2)] || 1);
    const body = new Array(m * 4);
    for (let i = 0; i < m; i++) {
      body[i * 2] = TX[i] + NX[i] * TR[i]; body[i * 2 + 1] = TY[i] + NY[i] * TR[i];
      const j = (2 * m - 1 - i) * 2;
      body[j] = TX[i] - NX[i] * TR[i]; body[j + 1] = TY[i] - NY[i] * TR[i];
    }
    put(0, body);
    let zs = 0; for (let i = 0; i < m; i++) zs += TZ[i];
    const Zm = zs / m, fd = fade(Zm), rm = TR[Math.floor(m / 2)];
    const nz = noise1(seed);
    // edges
    for (const [sg, wk, tone] of [[side, 0.085, 1], [-side, 0.035, 0.55]]) {
      for (let i = 0; i < m; i++) {
        SX[i] = TX[i] + NX[i] * TR[i] * sg * 0.94; SY[i] = TY[i] + NY[i] * TR[i] * sg * 0.94;
        SW[i] = clamp(TR[i] * wk * 2, 0.3, 2.6) * (0.55 + 0.45 * taperAt(TT[i] * 1.1));
        SN[i] = nz(i * 1.3 + sg * 7) * Math.min(1, 0.2 + TR[i] * 0.04);
      }
      ribbon(m, 16 + level(tone * fd * Math.min(1, rm / 1.2)), true);
    }
    // bark: [fx, t0, t1, wf] in tube parameter
    if (bark && rm > 3.5) {
      const keep = rm > 14 ? 1 : rm > 7 ? 0.55 : 0.25;
      for (let k = 0; k < bark.length; k += 4) {
        const fx = bark[k], t0 = bark[k + 1], t1 = bark[k + 2], wf = bark[k + 3];
        if (((k / 4) * 0.6180339) % 1 > keep) continue;
        // locate along the projected spine by parameter
        let n2 = 0;
        for (let s = 0; s <= 3; s++) {
          const tt = lerp(t0, t1, s / 3);
          if (tt < TT[0] || tt > TT[m - 1]) continue;
          let i = 0; while (i < m - 2 && TT[i + 1] < tt) i++;
          const u = (tt - TT[i]) / ((TT[i + 1] - TT[i]) || 1);
          const x = lerp(TX[i], TX[i + 1], u), y = lerp(TY[i], TY[i + 1], u), r = lerp(TR[i], TR[i + 1], u);
          const off = side * lerp(-0.7, 0.8, fx) * r;
          SX[n2] = x + NX[i] * off; SY[n2] = y + NY[i] * off; SW[n2] = clamp(r * 0.028 * (0.3 + 0.65 * fx) * wf * 2, 0.22, 2.1) * taperAt(s / 3); SN[n2] = nz(k * 0.37 + s) * 0.5; n2++;
        }
        if (n2 >= 2) ribbon(n2, 16 + level((0.35 + 0.6 * fx) * fd), true);
      }
    }
  }
  function drawTree(o) {
    const t = o.t, span = TOP - FLOOR;
    const spine = (u) => { const y = FLOOR - 2 + u * (span + 2); const k = y - FLOOR; return [t.x + t.lean[0] * k + t.bend * Math.sin(u * 2.4), y, t.z + t.lean[1] * k]; };
    const radius = (u) => t.r * lerp(1.32, 0.72, u) * (1 + 0.35 * (1 - u) ** 10);
    // bark stored in feet: convert to tube parameter once
    if (!t.barkT) { t.barkT = t.bark.slice(); for (let k = 0; k < t.barkT.length; k += 4) { t.barkT[k + 1] = (t.bark[k + 1] - FLOOR + 2) / (span + 2); t.barkT[k + 2] = (t.bark[k + 2] - FLOOR + 2) / (span + 2); } }
    for (const L of t.limbs) {
      const sp = (u) => { const v = 1 - u; return [v * v * L.a[0] + 2 * v * u * L.c[0] + u * u * L.e[0], v * v * L.a[1] + 2 * v * u * L.c[1] + u * u * L.e[1], v * v * L.a[2] + 2 * v * u * L.c[2] + u * u * L.e[2]]; };
      tube(sp, (u) => L.r0 * lerp(1, 0.18, u), undefined, null, L.seed);
      flushInto();
    }
    tube(spine, radius, undefined, t.barkT, t.seed);
  }
  // limbs sit behind their own trunk; draw each in its own pass so the trunk covers its root
  function flushInto() { flush(); }

  function drawClump(o) {
    const c = o.c;
    toCam(c.x, c.y, c.z);
    const Z = C[2];
    if (Z < NEAR * 4) return;
    const sx = cam.cx + (cam.f * C[0]) / Z, sy = cam.cy - (cam.f * C[1]) / Z, rs = (c.R * cam.f) / Z;
    if (rs < 1.2 || rs > cam.H * 0.8 || sx + rs * 1.3 < 0 || sx - rs * 1.3 > cam.W || sy + rs < 0 || sy - rs > cam.H) return;
    const lobe = (a) => 1 + 0.12 * Math.sin(a * 5 + c.lob[0]) + 0.09 * Math.sin(a * 11 + c.lob[1]) + 0.05 * Math.sin(a * 19 + c.lob[2]);
    const q = new Array(52);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, r = rs * lobe(a); q[i * 2] = sx + r * Math.cos(a); q[i * 2 + 1] = sy + r * Math.sin(a) * 0.82; }
    put(0, q);
    const fd = fade(Z), rows = clamp(Math.round(rs / 4.5), 1, 6);
    for (let k = 0; k < c.sc.length; k += 4) {
      const a = c.sc[k], row = c.sc[k + 1], rr = c.sc[k + 2], s2 = c.sc[k + 3];
      if (row >= rows) continue;
      const r = rs * lobe(a) * rr - 1, x = sx + r * Math.cos(a), y = sy + r * Math.sin(a) * 0.82;
      const s = Math.max(0.9, s2 * rs), nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx;
      // a small scallop: a quadratic through three points
      for (let i = 0; i < 4; i++) {
        const u = i / 3, v = 1 - u;
        const ax = x - tx * s, ay = y - ty * s, bx = x + nx * s * 1.4, by = y + ny * s * 1.4, ex = x + tx * s, ey = y + ty * s;
        SX[i] = v * v * ax + 2 * v * u * bx + u * u * ex; SY[i] = v * v * ay + 2 * v * u * by + u * u * ey;
        SW[i] = clamp(rs * 0.03 * (0.35 + 0.65 * (1 - row / 6)), 0.25, 1.3) * taperAt(u);
      }
      ribbon(4, 16 + level((0.45 + 0.55 * (1 - row / 6)) * fd), false);
    }
    // a thin rim against the sky
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.15 + 0.7 * (i / 8)), r = rs * lobe(a); SX[i] = sx + r * Math.cos(a); SY[i] = sy + r * Math.sin(a) * 0.82; SW[i] = clamp(rs * 0.02, 0.2, 0.9) * taperAt(i / 8); }
    ribbon(9, 16 + level(0.5 * fd), false);
  }

  // ---- a spire: the canvas house as a surface of revolution with the logo's profile
  // (engrave.js spireSides: the cubic from the finial out to the hem)
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  function drawSpire(o) {
    const sp = o.sp, R = rng(sp.seed);
    const ang = Math.atan2(cam.z - sp.cz, cam.x - sp.cx); // toward the camera, in the x-z plane
    const at = (phi, v, lift) => {
      const r = sp.r * bez(0, 0.3, 0.68, 1, v), drop = sp.h * bez(0, 0.52, 0.9, 1, v);
      const hem = v > 0.999 ? hemLift(phi) : 0;
      return [sp.cx + r * Math.cos(phi), sp.h - drop + (lift || 0) + hem, sp.cz + r * Math.sin(phi)];
    };
    const n = sp.seams;
    const hemLift = (phi) => { const k = ((((phi / (Math.PI * 2)) * n * 2) % 1) + 1) % 1; return 0.75 * 4 * k * (1 - k); };
    // the dark body: the silhouette, generator to generator around the front
    const sil = [];
    for (let i = 0; i <= 12; i++) sil.push(at(ang + Math.PI / 2, i / 12));
    for (let i = 0; i <= 24; i++) { const phi = ang + Math.PI / 2 - (Math.PI * i) / 24; sil.push(at(phi, 1)); }
    for (let i = 12; i >= 0; i--) sil.push(at(ang - Math.PI / 2, i / 12));
    paintFill({ P: Float32Array.from(sil.flat()), n: sil.length });
    // the canvas lines, from the finial to the hem, swelling as the hand presses
    toCam(sp.cx, sp.h * 0.5, sp.cz); const Zc = C[2];
    if (Zc < NEAR) return;
    const fd = fade(Zc), big = (sp.r * cam.f) / Zc, every = big > 110 ? 1 : big > 45 ? 2 : 4;
    for (let i = 0; i < sp.M; i++) {
      const phi = (i / sp.M) * Math.PI * 2 + 0.05, face = Math.cos(phi - ang);
      if (face < 0.02 || i % every) continue;
      const tone = (0.3 + 0.7 * face ** 0.7) * sp.bright;
      const seam = i % (sp.M / n / 2) === 0;
      const press = noise1(i * 7 + sp.seed);
      const v0 = 0.04 + (i % 2 ? 0.1 : 0.02);
      let m = 0;
      for (let s = 0; s <= 10; s++) {
        const v = lerp(v0, 1, s / 10), p = at(phi, v, v > 0.98 ? -0.15 : 0);
        toCam(p[0], p[1], p[2]); if (C[2] < NEAR) { m = 0; break; }
        SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2];
        const w = (seam ? 0.2 : 0.155) * tone * Math.max(0.12, 0.15 + 0.85 * v ** 0.8) * (0.62 + 0.62 * (0.5 + 0.5 * press(v * 5.5)));
        SW[m] = clamp((w * cam.f) / C[2], 0.25, 4.5) / 2; SN[m] = press(v * 9 + 3) * 0.4; m++;
      }
      ribbon(m, (seam ? 1 : 3) * 16 + level(tone * fd), true);
    }
    // hatching across the lit canvas, following its curve: short strokes, densest where it glows
    const hrows = big > 110 ? 26 : big > 45 ? 16 : 10;
    for (let r = 0; r < hrows; r++) {
      const v = lerp(0.42, 0.96, r / (hrows - 1));
      let u = -1.2 + R() * 0.08;
      while (u < 1.2) {
        const len = 0.1 + R() * 0.16, u1 = Math.min(1.2, u + len), um = (u + u1) / 2;
        const glow = Math.cos(um) ** 1.3 * clamp((v - 0.4) / 0.45, 0, 1);
        if (glow > 0.4 + R() * 0.3) {
          let m = 0;
          for (let s = 0; s <= 3; s++) { const p = at(ang + lerp(u, u1, s / 3), v - 0.012 * (s - 1.5)); toCam(p[0], p[1], p[2]); if (C[2] < NEAR) { m = 0; break; } SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp(((0.03 + 0.05 * glow) * cam.f) / C[2], 0.2, 2.2) / 2 * taperAt(s / 3); m++; }
          ribbon(m, 3 * 16 + level((0.45 + 0.5 * glow) * sp.bright * fd), false);
        }
        u = u1 + 0.05 + R() * 0.12;
      }
    }
    // the hem, scalloped between its anchors
    {
      let m = 0;
      for (let i = 0; i <= 40; i++) { const phi = ang + Math.PI / 2 - (Math.PI * i) / 40, p = at(phi, 1); toCam(p[0], p[1], p[2]); if (C[2] < NEAR) continue; SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp((0.09 * sp.bright * cam.f) / C[2], 0.4, 3) / 2; m++; }
      ribbon(m, 3 * 16 + level(sp.bright * fd), false);
    }
    // the silhouette, bolder on the side toward the light
    for (const [dphi, wk] of [[Math.PI / 2, 0.16], [-Math.PI / 2, 0.11]]) {
      let m = 0;
      for (let i = 0; i <= 12; i++) { const p = at(ang + dphi, i / 12); toCam(p[0], p[1], p[2]); if (C[2] < NEAR) continue; SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp((wk * sp.bright * (0.35 + 0.65 * i / 12) * cam.f) / C[2], 0.3, 3.5) / 2; m++; }
      ribbon(m, 3 * 16 + level(sp.bright * fd), false);
    }
    // the fly window, lit from inside, and its zipper; it faces the bridge
    if (sp.win) {
      const wf = Math.atan2(SPAN + 2 - sp.cz, 0 - sp.cx), face = Math.cos(wf - ang);
      if (face > 0.15) {
        const panel = (du, vT, vB) => {
          const pts = [at(wf, vT, 0)];
          for (let k = 1; k <= 8; k++) { const v = lerp(vT, vB, k / 8), e = Math.min(1, k / 8 / 0.3); pts.push(at(wf - du * Math.sin((e * Math.PI) / 2), v)); }
          for (let k = 8; k >= 1; k--) { const v = lerp(vT, vB, k / 8), e = Math.min(1, k / 8 / 0.3); pts.push(at(wf + du * Math.sin((e * Math.PI) / 2), v)); }
          return pts;
        };
        paintFill({ P: Float32Array.from(panel(0.36, 0.47, 0.83).flat()), n: 17 });
        // the light inside, engraved: close level strokes across the panel, heaviest at its middle
        const vT = 0.505, vB = 0.815, du = 0.29, scr = (p) => { toCam(p[0], p[1], p[2]); return C[2] < NEAR ? null : [cam.cx + (cam.f * C[0]) / C[2], cam.cy - (cam.f * C[1]) / C[2]]; };
        const top = scr(at(wf, vT)), bot = scr(at(wf, vB));
        if (!top || !bot) return;
        const tall = Math.abs(bot[1] - top[1]), rows = Math.max(4, Math.round(tall / 2.9));
        for (let r = 0; r <= rows; r++) {
          const k = r / rows, v = lerp(vT, vB, k), e = Math.min(1, k / 0.3), half = du * Math.sin((e * Math.PI) / 2) * 0.96;
          let m = 0;
          for (let s = 0; s <= 6; s++) {
            const p = scr(at(wf + lerp(-half, half, s / 6), v));
            if (!p) continue;
            SX[m] = p[0]; SY[m] = p[1]; SW[m] = (tall / rows) * (0.2 + 0.2 * Math.sin(Math.PI * k)) * (0.75 + 0.25 * Math.sin(Math.PI * s / 6)); SN[m] = 0; m++;
          }
          ribbon(m, 3 * 16 + level(fd), false);
        }
        // the zipper, down the middle
        let m = 0;
        for (let s = 0; s <= 6; s++) { const p = scr(at(wf, lerp(vT + 0.01, vB, s / 6))); if (p) { SX[m] = p[0]; SY[m] = p[1]; SW[m] = Math.max(0.5, tall * 0.006); SN[m] = 0; m++; } }
        ribbon(m, 0, false);
      }
    }
    // the finial: a slender gold cap and a bead
    toCam(sp.cx, sp.h + 0.2, sp.cz);
    if (C[2] > NEAR) {
      const x = cam.cx + (cam.f * C[0]) / C[2], y = cam.cy - (cam.f * C[1]) / C[2], s = (0.12 * cam.f) / C[2] * (sp.win ? 1 : 0.8);
      const hh = 20 * s, w = 4.2 * s, q = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8; q.push(x + w * Math.sin(t * Math.PI / 2) ** 0.7, y - hh * (1 - t) ** 1.6); }
      for (let i = 8; i >= 0; i--) { const t = i / 8; q.push(x - w * Math.sin(t * Math.PI / 2) ** 0.7, y - hh * (1 - t) ** 1.6); }
      put(16 + level(fd), q);
      dot(16 + level(fd), x, y - hh - 2.2 * s, Math.max(0.5, 1.8 * s));
    }
  }

  // ---------------------------------------------------------------- the sky: the logo's engraved lines,
  // brightest in the opening over the house, drawn in screen space so only turning the head moves it
  function paintSky() {
    // where the dusk opening sits: straight ahead, 26 degrees up
    const e = rad(26);
    const dx = 0, dy = Math.sin(e), dz = Math.cos(e);
    const X = dx * cam.cyw - dz * cam.sy, Z1 = dx * cam.sy + dz * cam.cyw;
    const Y = dy * cam.cp - Z1 * cam.sp, Z = dy * cam.sp + Z1 * cam.cp;
    if (Z < 0.05) return;
    const gx = cam.cx + (cam.f * X) / Z, gy = cam.cy - (cam.f * Y) / Z;
    const Rk = Math.max(cam.W, cam.H) * 0.8;
    const step = 3.3, x0 = -cam.W * 0.1, x1 = cam.W * 1.1, dxs = 9;
    const nz = noise1(5);
    let row = 0;
    const yTop = Math.max(-cam.H * 0.1, gy - Rk), yBot = Math.min(cam.H * 1.1, gy + Rk * 0.7);
    for (let y = gy - Math.ceil((gy - yTop) / step) * step; y < yBot; y += step, row++) {
      let m = 0;
      for (let x = x0; x <= x1; x += dxs) {
        const tone = Math.max(0, 1 - Math.hypot((x - gx) / 1.35, (y - gy) * 1.15) / Rk) ** 1.5;
        if (tone > 0.04 && nz(x * 0.01 + row * 0.7) > -0.6) { SX[m] = x; SY[m] = y + nz(x * 0.02 + row) * 0.5; SW[m] = (0.1 + 0.9 * tone) / 2; SN[m] = 0; m++; }
        else { if (m > 1) ribbon(m, 16 + level(0.55 + 0.45 * tone), false); m = 0; }
      }
      if (m > 1) ribbon(m, 16 + 8, false);
    }
    flush();
  }

  // ---------------------------------------------------------------- one frame
  function render(p) {
    const W = cam.W, H = cam.H, s = walk(p);
    setCam(s.x, s.y, s.z, s.pitch, s.yaw, s.roll);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = GROUND; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2); ctx.rotate(cam.roll); ctx.scale(1.02, 1.02); ctx.translate(-W / 2, -H / 2);
    paintSky();
    for (const o of OBJ) { toCam(o.x, o.y, o.z); o.d = C[2]; }
    const list = OBJ.filter((o) => o.d > -30).sort((a, b) => b.d - a.d);
    for (const o of list) {
      if (window.lfOnly && !window.lfOnly(o)) continue;
      const T0 = window.lfProf ? performance.now() : 0;
      if (o.draw) o.draw(o);
      for (const it of o.items) {
        if (it.k === 0) paintLine(it, o.d);
        else if (it.k === 1) paintFill(it);
        else paintBulb(it);
      }
      flush();
      if (window.lfProf) window.lfProf(o, performance.now() - T0);
    }
    // the words and the count
    const ft = Math.round(s.ft);
    if (countEl) countEl.textContent = ft;
    if (markEl) markEl.style.transform = 'translateX(' + ft + '%)';
    for (const w of words) {
      const a = +w.dataset.from, b = +w.dataset.to, z = s.z;
      const v = STILL ? 1 : smooth((z - a) / 4) * (1 - smooth((z - b) / 4));
      w.style.opacity = v.toFixed(3);
      w.style.transform = 'translateY(' + ((1 - v) * 10).toFixed(1) + 'px)';
    }
  }

  // ---------------------------------------------------------------- size, scroll, and the loop
  function resize() {
    const r = stage.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height);
    if (W === cam.W && Math.abs(H - cam.H) < 90) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cam.W = W; cam.H = H; cam.cx = W / 2; cam.cy = H * 0.5;
    // a person's field of view: about 70 degrees across a phone held upright, 74 degrees tall on a wide screen
    cam.f = H > W ? W / 2 / Math.tan(rad(35)) : H / 2 / Math.tan(rad(37));
    return true;
  }
  function progress() {
    const r = sec.getBoundingClientRect(), run = r.height - window.innerHeight;
    return run > 0 ? clamp(-r.top / run, 0, 1) : 0;
  }
  let shown = -1, eased = 0, live = false;
  function frame() {
    if (!live) return;
    const target = STILL ? 0 : progress();
    eased += (target - eased) * 0.16;
    if (Math.abs(target - eased) < 0.0004) eased = target;
    const sized = resize();
    if (sized || Math.abs(eased - shown) > 0.00005) { render(eased); shown = eased; }
    requestAnimationFrame(frame);
  }
  window.lfCrossing = { render: (p) => { resize(); render(p); }, walk, OBJ, cam };
  if (STILL) sec.classList.add('is-still');
  sec.classList.add('is-ready');
  resize(); eased = STILL ? 0 : progress(); render(eased); shown = eased;
  if (STILL) { window.addEventListener('resize', () => { if (resize()) render(0); }); return; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { const was = live; live = es[0].isIntersecting; if (live && !was) requestAnimationFrame(frame); }, { rootMargin: '200px 0px' }).observe(sec);
  } else { live = true; requestAnimationFrame(frame); }
})();
