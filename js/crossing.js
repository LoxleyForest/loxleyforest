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
  // the still engraving for reduced motion, and for browsers that cannot pin the stage
  const STILL = sec.hasAttribute('data-still') || window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !(window.CSS && CSS.supports('overflow-x', 'clip'));
  const STEADY = sec.hasAttribute('data-steady'); // full detail always: for rendering the still posters

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
  // From Mick, 2026-10-14, and his photographs: aircraft cable on the catenaries, natural rope
  // verticals tied to them, rope netting lashed to the verticals, 42 inches high; the cables at
  // least 4 feet apart and wider in places; the cables run low enough mid-span that the netting
  // sits at your chest. The bridge lands on a half-octagon deck around a great oak (3.5 feet
  // through, 120 feet tall) that carries the house and the bridge's cables; ship stairs drop
  // about 4 feet to the octagon sky deck; the big spire stands on a knee wall to your left.
  // The creek runs downhill on your right, alongside the bridge, with a cascade near the middle.
  const SPAN = 100;      // the bridge, feet
  const SAG = 4.2;       // the deck's sag at the middle
  const EYE = 5.3;       // eye height above the deck
  const FLOOR = -62;     // the forest floor, about sixty feet down
  const TOP = 110;       // where trunks leave the frame
  const HALF = 1.5;      // half the walking width
  const NET = 3.5;       // the netting, 42 inches
  const deckY = (z) => (z <= 0 || z >= SPAN ? 0 : -SAG * 4 * (z / SPAN) * (1 - z / SPAN));
  const mid2 = (z) => { const u = clamp(z / SPAN, 0, 1) * 2 - 1; return u * u; }; // 0 mid-span, 1 at the ends
  const cableH = (z) => 4.4 + 2.6 * mid2(z);   // above the deck: chest height mid-span, overhead at the ends
  const cableX = (z) => 2.05 + 0.4 * mid2(z);  // never closer than 4 feet apart
  const POST = 1.95;                           // where the verticals tie to the crossbeams
  const wallX = (z, y) => lerp(POST, cableX(z), clamp(y / cableH(z), 0, 1)); // the side leans out with the verticals
  // the creek: downhill on the right, alongside the bridge
  const creekX = (z) => 34 + 5 * Math.sin(z * 0.045 + 1) + 2 * Math.sin(z * 0.13);
  const floorY = (x, z) => { const d = x - creekX(z); return FLOOR - 6 + (d < 0 ? Math.min(16, 0.22 * -d) : Math.min(14, 0.35 * d)) + 0.5 * Math.sin(x * 0.21 + z * 0.13); };
  const CASCADE = [42, 54];
  // the landing deck (a half-octagon around the great oak), the sky deck below it, the tent
  const OAK = { x: 1.3, z: 106.5, r: 1.75 };
  const LANDING = [[-3.5, 100], [5, 100], [9, 103.5], [9, 110], [5.5, 113.5], [-3.5, 113.5]];
  const SKY = { x: -1, z: 120, R: 6.5, y: -4 };
  const SPIRES = [
    { cx: -17, cz: 122, r: 5, h: 15, y0: -1.5, M: 128, seams: 2, arch: 2.2, bright: 0.75, win: false, seed: 55 },
    { cx: -10, cz: 113, r: 7, h: 22, y0: -1.5, M: 192, seams: 3, arch: 3, bright: 1, win: true, seed: 77 },
  ];

  // ---------------------------------------------------------------- the scene, as objects of world-space marks
  const OBJ = [];
  let SEED = 11;
  function obj(x, y, z, draw) { const o = { x, y, z, items: [], draw, d: 0, bias: 0 }; OBJ.push(o); return o; }
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
  function bulb(o, x, y, z, r) { o.items.push({ k: 2, x, y, z, r: r || 0.11 }); }
  const along = (fn, n) => { const a = []; for (let i = 0; i <= n; i++) a.push(fn(i / n)); return a; };
  const seg = (a, b, n) => along((t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], n || 1);

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
      // the crossbeam's end, past the boards, where the vertical is tied
      ln(o, [at(s * 1.46, -0.06, zm), at(s * 2.2, -0.06, zm)], 0.2, 'g', 0.7);
      // the aircraft cable, steel, carrying everything
      ln(o, zs.map((z) => at(s * cableX(z), cableH(z), z)), 0.055, 'g', 1);
      // the netting's lashed top edge and its foot along the deck
      ln(o, zs.map((z) => at(s * wallX(z, NET), NET, z)), 0.04, 'g', 0.7);
      ln(o, zs.map((z) => at(s * POST, 0.05, z)), 0.05, 'g', 0.8);
      // a natural rope vertical every two feet, knotted at the cable
      {
        const z = zm, top = cableH(z);
        ln(o, along((t) => at(s * wallX(z, top * t), top * t, z), 3), 0.045, 'g', 0.85);
        ln(o, [at(s * cableX(z), top - 0.05, z), at(s * wallX(z, top - 0.45), top - 0.45, z)], 0.11, 'g', 0.75, { lod: 40 });
      }
      // the rope netting: diamonds, lashed to the verticals
      const D = NET, m = 0.6;
      for (const dir of [1, -1]) {
        let k = 0;
        for (let c = z0 - D; c < z1 + D; c += m, k++) {
          // z = c + dir * v * D, clipped to this bay and to 0..1 in v
          const vAt = (z) => (z - c) / (dir * D);
          let lo = vAt(z0), hi = vAt(z1); if (lo > hi) [lo, hi] = [hi, lo];
          const va = Math.max(0, lo), vb = Math.min(1, hi);
          if (vb - va < 0.02) continue;
          ln(o, along((t) => { const v = lerp(va, vb, t), z = c + dir * v * D; return at(s * wallX(z, NET * v), NET * v, z); }, 2), 0.014, 'g', 0.5, { lod: k % 2 ? 34 : 70, maxPx: 1 });
        }
      }
      // string lights along the cable, about a foot apart
      for (let zb = z0 + (s > 0 ? 0.25 : 0.75); zb < z1; zb += 1) bulb(o, s * cableX(zb), deckY(zb) + cableH(zb) - 0.16, zb);
    }
  }

  // ---- the spreader beams that hang across each end of the bridge, from the cables (no posts)
  function spreader(z) {
    const o = obj(0, 7, z), y = cableH(z) + 0.15, w = cableX(z) + 0.7;
    fill(o, [[-w, y, z], [w, y, z], [w, y + 0.5, z], [-w, y + 0.5, z]]);
    ln(o, seg([-w, y + 0.02, z], [w, y + 0.02, z], 4), 0.05, 'g', 1);
    ln(o, seg([-w, y + 0.48, z], [w, y + 0.48, z], 4), 0.025, 'g', 0.6);
    for (let i = 0; i < 3; i++) { const yy = y + 0.12 + i * 0.12, a = -w + 0.2 + (i % 2) * 0.8; ln(o, seg([a, yy, z], [a + w * 1.2, yy + 0.01, z], 4), 0.01, 'g', 0.4, { lod: 26, taper: 1 }); }
    for (const s of [-1, 1]) ln(o, seg([s * (w - 0.3), y + 0.5, z], [s * (w - 0.6), y + 3.2, z + (z > 1 ? -1.2 : 1.2)], 2), 0.03, 'g', 0.75);
    return o;
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
    spreader(0);
    spreader(SPAN);
    // past the far beam the cables run on to the great oak, where a collar takes them
    const o = obj(OAK.x, 8, SPAN + 3);
    for (const s of [-1, 1]) ln(o, seg([s * (cableX(SPAN) + 0.4), cableH(SPAN) + 0.4, SPAN], [OAK.x + s * OAK.r * 0.8, 10.5, OAK.z - OAK.r * 0.6], 4), 0.05, 'g', 0.9);
  }

  // ---- the landing deck: boards along the bridge, a hog-fence rail with lights, braces to the oak
  const insidePoly = (poly, x, z) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside; } return inside; };
  // a rail of wooden posts, top and bottom rails, the welded-wire grid between, lights on top
  function railRun(a, b, y0, h, lights) {
    const oo = obj((a[0] + b[0]) / 2, y0 + h / 2, (a[1] + b[1]) / 2);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), P = (t, y) => [lerp(a[0], b[0], t), y0 + y, lerp(a[1], b[1], t)];
    const nPost = Math.max(1, Math.round(len / 3.6));
    ln(oo, along((t) => P(t, h), 4), 0.12, 'g', 0.95);
    ln(oo, along((t) => P(t, h - 0.25), 4), 0.03, 'g', 0.55);
    ln(oo, along((t) => P(t, 0.3), 4), 0.06, 'g', 0.65);
    for (let i = 0; i <= nPost; i++) ln(oo, [P(i / nPost, 0), P(i / nPost, h)], 0.11, 'g', 0.9);
    for (let d = 0.35; d < len; d += 0.35) ln(oo, [P(d / len, 0.3), P(d / len, h - 0.25)], 0.008, 'g', 0.4, { lod: 30, maxPx: 0.7 });
    for (let y = 0.8; y < h - 0.3; y += 0.5) ln(oo, along((t) => P(t, y), 2), 0.008, 'g', 0.4, { lod: 30, maxPx: 0.7 });
    if (lights) for (let d = 0.7; d < len; d += 1.4) { const p = P(d / len, h - 0.12); bulb(oo, p[0], p[1], p[2]); }
    return oo;
  }
  {
    // boards in three strips, so the oak can stand among them
    for (const [xa, xb] of [[-3.5, 0.5], [0.5, 4.5], [4.5, 9]]) {
      const o = obj((xa + xb) / 2, -0.5, 106.8);
      o.bias = 6; // a floor sorts behind what stands on it
      const strip = [];
      for (const [x, z] of [[xa, 99.9], [xb, 99.9], [xb, 113.6], [xa, 113.6]]) strip.push([x, 0, z]);
      fill(o, LANDING.map(([x, z]) => [clamp(x, xa, xb), 0, z]));
      for (let x = xa + 0.25; x < xb; x += 0.5) {
        let za = null, zb = null;
        for (let z = 99.9; z < 113.7; z += 0.25) if (insidePoly(LANDING, x, z)) { if (za === null) za = z; zb = z; }
        if (za !== null && Math.hypot(x - OAK.x, 0) > OAK.r + 0.2) ln(o, seg([x, 0, za], [x, 0, zb], 6), 0.02, 'g', 0.62, { lod: 60 });
        else if (za !== null) { const dz = Math.sqrt(Math.max(0, (OAK.r + 0.3) ** 2 - (x - OAK.x) ** 2)); ln(o, seg([x, 0, za], [x, 0, OAK.z - dz], 3), 0.02, 'g', 0.62, { lod: 60 }); ln(o, seg([x, 0, OAK.z + dz], [x, 0, zb], 3), 0.02, 'g', 0.62, { lod: 60 }); }
      }
    }
    // the fascia under the deck edge
    const of = obj(3, -0.5, 106.8); of.bias = 6;
    for (let i = 0; i < LANDING.length; i++) { const a = LANDING[i], b = LANDING[(i + 1) % LANDING.length]; ln(of, seg([a[0], -0.05, a[1]], [b[0], -0.05, b[1]], 3), 0.07, 'g', 0.9); ln(of, seg([a[0], -0.9, a[1]], [b[0], -0.9, b[1]], 3), 0.035, 'g', 0.6); }
    // the hog-fence rail around the octagon's sides, open where the bridge lands and where the stairs go down
    railRun([2.15, 100], [5, 100], 0, 3.4, true);
    railRun([5, 100], [9, 103.5], 0, 3.4, true);
    railRun([9, 103.5], [9, 110], 0, 3.4, true);
    railRun([9, 110], [5.5, 113.5], 0, 3.4, true);
    railRun([5.5, 113.5], [0.2, 113.5], 0, 3.4, true);
    railRun([-3.5, 100], [-2.15, 100], 0, 3.4, false);
    railRun([-3.5, 100], [-3.5, 113.5], 0, 3.0, true); // the low rail in front of the tent
    // ship stairs down to the sky deck: two stringers and the treads
    const os = obj(-1.6, -2, 115);
    for (const x of [-3.3, 0]) ln(os, seg([x, 0, 113.5], [x, SKY.y, 116.8], 3), 0.1, 'g', 0.9);
    for (let i = 1; i <= 5; i++) { const t = i / 6, y = lerp(0, SKY.y, t), z = lerp(113.5, 116.8, t); fill(os, [[-3.3, y, z], [0, y, z], [0, y, z + 0.6], [-3.3, y, z + 0.6]]); ln(os, seg([-3.3, y, z], [0, y, z], 3), 0.05, 'g', 0.85); }
    for (const x of [-3.3, 0]) ln(os, seg([x, 3, 113.5], [x, SKY.y + 3, 116.8], 3), 0.06, 'g', 0.8);
    // braces under the deck, down to the oak
    const ob = obj(OAK.x, -6, OAK.z); ob.bias = 8;
    for (const [x, z] of [[-3, 102], [7.5, 102.5], [8, 110.5], [-3, 112]]) ln(ob, seg([x, -0.9, z], [OAK.x + Math.sign(x - OAK.x) * OAK.r, -9, OAK.z + Math.sign(z - OAK.z) * 0.6], 3), 0.18, 'g', 0.8);
  }
  // ---- the sky deck, an octagon four feet down, in front of the tent
  {
    const o = obj(SKY.x, SKY.y, SKY.z); o.bias = 6;
    const pts = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; pts.push([SKY.x + SKY.R * Math.cos(a), SKY.z + SKY.R * Math.sin(a)]); }
    fill(o, pts.map(([x, z]) => [x, SKY.y, z]));
    for (let x = SKY.x - SKY.R + 0.25; x < SKY.x + SKY.R; x += 0.5) {
      let za = null, zb = null;
      for (let z = SKY.z - SKY.R; z <= SKY.z + SKY.R; z += 0.25) if (insidePoly(pts, x, z)) { if (za === null) za = z; zb = z; }
      if (za !== null) ln(o, seg([x, SKY.y, za], [x, SKY.y, zb], 4), 0.02, 'g', 0.6, { lod: 60 });
    }
    // its rail, except on the tent's side and at the foot of the stairs
    for (let i = 0; i < 8; i++) {
      const a = pts[i], b = pts[(i + 1) % 8], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (Math.hypot(mx - SPIRES[1].cx, mz - SPIRES[1].cz) < 10.5 || (mz < SKY.z - 4 && mx < 1)) continue;
      railRun(a, b, SKY.y, 3.4, true);
    }
  }

  // ---- the oaks: the two at the first platform, the great oak at the landing, and the forest
  const TREES = [];
  function tree(x, z, r, opts) {
    const R = rng(Math.round(x * 13 + z * 7 + 999));
    const t = { x, z, r, lean: [(R() - 0.5) * 0.04, (R() - 0.5) * 0.03], bend: (R() - 0.5) * 2.4, seed: Math.round(R() * 1e6), bark: [], limbs: [] };
    if (opts && opts.straight) { t.lean = [0, 0]; t.bend = 0.6; }
    // bark: broken strokes in columns, densest on the lit half
    const nB = r > 1.5 ? 14 : r > 1.2 ? 11 : 8;
    for (let j = 0; j < nB; j++) {
      const fx = (j + 0.5) / nB;
      if (fx < 0.3 && R() > 0.4) continue;
      let y = FLOOR + R() * 4;
      while (y < TOP) { const len = 2.5 + R() * 8, y2 = Math.min(TOP, y + len); t.bark.push(fx, y, y2, 0.6 + R() * 0.6); y = y2 + 0.7 + R() * 3.5; }
    }
    // limbs reaching out and up, each ending in clumps of leaves
    const nL = opts && opts.high ? 2 : r > 0.85 ? 1 + Math.floor(R() * 3) : R() < 0.5 ? 1 : 0;
    for (let i = 0; i < nL; i++) {
      const out = x > 0 ? 0 : Math.PI, near = Math.abs(x) < 12;
      const yb = opts && opts.high ? 30 + R() * 20 : near ? 26 + R() * 20 : 6 + R() * 34;
      const ang = out + (R() - 0.5) * (near ? 1.4 : 2.6), len = 9 + R() * 16, rise = 0.5 + R() * 0.7;
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
  // the great oak: the bridge's cables end at it, the house hangs from it
  tree(OAK.x, OAK.z, OAK.r, { straight: true, high: true });
  // the others around the house
  [[-24, 104, 1.3], [12.5, 121, 1.3], [-27, 127, 1.2], [-9, 134, 1.1]].forEach(([x, z, r]) => tree(x, z, r));
  {
    const R = rng(4242);
    for (let tries = 0; tries < 1400 && TREES.length < 104; tries++) {
      const side = R() < 0.5 ? -1 : 1, x = side * (6.5 + R() ** 0.8 * 120), z = -50 + R() * 290, r = 0.55 + R() ** 1.6 * 1.1;
      if (x > -32 && x < 16 && z > 95 && z < 138) continue;
      if (Math.abs(x) < 9 && z > -14 && z < 2) continue;
      if (Math.abs(x - creekX(z)) < 5) continue;
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
      const R = rng(L.seed), n = 2 + Math.floor(R() * 2);
      for (let i = 0; i < n; i++) clump(L.e[0] + (R() - 0.5) * 9, L.e[1] + (R() - 0.3) * 5, L.e[2] + (R() - 0.5) * 9, 3 + R() * 3.5, seed++);
    }
    const R = rng(77);
    for (let i = 0; i < 150; i++) {
      const x = (R() - 0.5) * 220, z = -40 + R() * 280, y = 34 + R() * 46;
      if (Math.abs(x + 4) < 26 && z > 40 && z < 150 && y < 74) continue; // the opening over the far half and the house
      clump(x, y, z, 4 + R() * 5, seed++);
    }
    // the understory along the creek: mountain laurel, low and dark, hiding the water in places
    const L = rng(515);
    for (let i = 0; i < 70; i++) {
      const z = -30 + L() * 240, side = L() < 0.5 ? -1 : 1, x = creekX(z) + side * (4 + L() * 16), r = 3 + L() * 4;
      clump(x, floorY(x, z) + r * 0.6, z, r, seed++);
    }
    for (let i = 0; i < 26; i++) { // and a few right over the water, so it shows in pieces
      const z = -20 + L() * 220; if (z > CASCADE[0] - 4 && z < CASCADE[1] + 4) continue;
      const x = creekX(z) + (L() - 0.5) * 4, r = 4 + L() * 4;
      clump(x, floorY(x, z) + r * 0.7, z, r, seed++);
    }
  }
  // the forest floor: broken lines that only catch light near the creek; the creek itself in light
  {
    for (let z = -40; z < 240; z += 3.2) {
      const o = obj(30, FLOOR, z);
      let run = [];
      const flush = () => { if (run.length > 1) ln(o, run.map((p) => p.slice(0, 3)), 0.16, 'g', run.reduce((s, p) => s + p[3], 0) / run.length, { taper: 1, lod: 160 }); run = []; };
      const nz = noise1(Math.round(z * 10) + 5);
      for (let x = -150; x <= 150; x += 5) {
        const zz = z + 1.2 * Math.sin(x * 0.07 + z), near = Math.exp(-(((x - creekX(zz)) / 18) ** 2));
        const tone = 0.1 + 0.7 * near + 0.1 * nz(x * 0.05);
        if (tone > 0.14 && nz(x * 0.09 + 3) > -0.45) { run.push([x, floorY(x, zz), zz, tone]); if (run.length > 6) flush(); } else flush();
      }
      flush();
    }
    // water: strokes running with the stream, brightest mid-stream, in pieces
    for (let z0 = -40; z0 < 230; z0 += 8) {
      const o = obj(creekX(z0 + 4), FLOOR - 6, z0 + 4), nz = noise1(Math.round(z0) + 31);
      for (let off = -2.6; off <= 2.61; off += 0.4) {
        let run = [];
        const flush = () => { if (run.length > 1) ln(o, run, 0.22, 'l', 1 - Math.abs(off) * 0.14, { taper: 1, minTone: 0.55 }); run = []; };
        for (let z = z0; z <= z0 + 8.01; z += 1) {
          if (nz(z * 0.35 + off * 3) > -0.3) { const x = creekX(z) + off; run.push([x, floorY(creekX(z), z) - 0.4, z]); } else flush();
        }
        flush();
      }
      for (const side of [-1, 1]) ln(o, along((t) => { const z = z0 + t * 8, x = creekX(z) + side * (3.2 + 0.5 * Math.sin(z * 0.3)); return [x, floorY(x, z) + 0.2, z]; }, 6), 0.14, 'g', 0.85, { minTone: 0.45 });
    }
    // the cascade: the stream steps down over rock, white water in short broken strokes
    {
      const o = obj(creekX(48), FLOOR - 7, 48), R = rng(4848);
      for (let i = 0; i < 70; i++) {
        const z = lerp(CASCADE[0], CASCADE[1], R()), x = creekX(z) + (R() - 0.5) * 5, y = floorY(creekX(z), z) - 0.3 + R() * 1.2, l = 0.6 + R() * 1.3;
        ln(o, [[x, y + 0.5, z], [x + (R() - 0.5) * 0.4, y - 0.3, z + l]], 0.12, 'l', 1, { taper: 1, minTone: 0.7 });
      }
      for (let i = 0; i < 9; i++) { // the rocks in the stream
        const z = lerp(CASCADE[0], CASCADE[1], (i + 0.5) / 9), x = creekX(z) + (R() - 0.5) * 4.5, r = 0.8 + R() * 1.4, y0 = floorY(creekX(z), z);
        const ring = []; for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2; ring.push([x + r * Math.cos(a), y0 + Math.max(0, Math.sin(a)) * r * 0.6, z + r * Math.sin(a) * 0.8]); }
        fill(o, ring); ln(o, ring, 0.08, 'g', 0.85, { minTone: 0.45 });
      }
    }
  }
  {
    const R = rng(808);
    // boulders along the banks: an outline and a few strokes of shade across the lit face
    for (let i = 0; i < 26; i++) {
      const z = -30 + R() * 230, side = R() < 0.5 ? -1 : 1, x = creekX(z) + side * (5 + R() * 9), r = 1.6 + R() * 2.8;
      const o = obj(x, FLOOR, z), y0 = floorY(x, z), nz = noise1(i + 300), ring = [];
      for (let k = 0; k <= 18; k++) { const a = (k / 18) * Math.PI * 2, rr = r * (1 + 0.18 * nz(k * 0.7)); ring.push([x + rr * Math.cos(a), y0 + Math.max(0, Math.sin(a)) * r * 0.55, z + rr * Math.sin(a) * 0.8]); }
      fill(o, ring);
      ln(o, ring, 0.09, 'g', 0.8, { minTone: 0.35 });
      for (let k = 0; k < 4; k++) { const a = -0.3 + k * 0.28; ln(o, along((t) => [x + r * lerp(-0.6, 0.6, t), y0 + r * (0.45 - k * 0.1), z - r * 0.5 + a], 2), 0.05, 'g', 0.55, { taper: 1, lod: 120 }); }
    }
    // fern fronds, the logo's: a curving stem, leaflets both sides
    for (let i = 0; i < 70; i++) {
      const z = -30 + R() * 230, x = creekX(z) + (R() - 0.5) * 34, len = 2 + R() * 2.2, dir = R() * Math.PI * 2;
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
  for (const sp of SPIRES) obj(sp.cx, sp.y0 + sp.h * 0.4, sp.cz, drawSpire).sp = sp;

  // ---------------------------------------------------------------- the camera
  const cam = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0, f: 300, W: 0, H: 0, cx: 0, cy: 0, sp: 0, cp: 1, sy: 0, cyw: 1 };
  const NEAR = 0.35;
  let LITE = false; // set by the governor when a device draws slowly
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
    const z = lerp(-5.5, SPAN + 0.8, e);
    const plateau = (v, a, b, c, d) => smooth((v - a) / (b - a)) * (1 - smooth((v - c) / (d - c)));
    const down = plateau(z, 16, 32, 44, 60);       // the heart beats faster: the creek, sixty feet down
    const arrive = smooth((z - 82) / 18);          // the house rises
    const step = STILL ? 0 : Math.sin(z * Math.PI * 2 / 2.7);
    const pitch = rad(-4 - 40 * down + 10 * arrive);
    const yaw = rad(56 * down - 13 * smooth((z - 90) / 10));
    const roll = STILL ? 0 : rad(0.35 * Math.sin(z * Math.PI / 2.7) + 0.6 * Math.sin(z * 0.09));
    const y = deckY(Math.max(0, Math.min(SPAN, z))) + EYE + 0.05 * step;
    const x = STILL ? 0 : 0.12 * Math.sin(z * 0.09);
    return { x, y, z, pitch, yaw, roll, ft: clamp(z, 0, SPAN) };
  }

  // ---------------------------------------------------------------- the painter
  // Each object's marks collect in buckets and are painted with one call per bucket, back to
  // front: dark fills, gold shapes, gold strokes, dark halos, light shapes, light strokes, light
  // dots. Swelling lines are filled shapes; fine lines are plain strokes, which cost far less.
  // A key is rank * 4096 + tone level * 16 + stroke width step.
  const FILL = 0, GOLD = 1, GOLDS = 2, HALO = 3, LIGHT = 4, LIGHTS = 5, DOT = 6;
  const WS = [0.3, 0.42, 0.55, 0.7, 0.85, 1.0, 1.2, 1.45, 1.75, 2.1, 2.5];
  const wstep = (px) => { let i = 0; while (i < WS.length - 1 && WS[i + 1] <= px) i++; return i; };
  const K = (rank, lv, ws) => rank * 4096 + lv * 16 + (ws || 0);
  const BK = new Map(), used = [];
  function bucket(key) {
    let b = BK.get(key);
    if (!b) BK.set(key, (b = { p: [], c: [], s: [] }));
    if (!b.p.length && !b.c.length && !b.s.length) used.push(key);
    return b;
  }
  function put(key, poly) { bucket(key).p.push(poly); }
  function dot(key, x, y, r) { bucket(key).c.push(x, y, r); }
  function stroke(key, pts) { bucket(key).s.push(pts); }
  let marks = 0;
  function flush() {
    used.sort((a, b) => a - b);
    for (const k of used) {
      const b = BK.get(k), rank = k >> 12, lv = (k >> 4) & 255;
      ctx.beginPath();
      for (const q of b.p) { ctx.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) ctx.lineTo(q[i], q[i + 1]); ctx.closePath(); }
      for (let i = 0; i < b.c.length; i += 3) { ctx.moveTo(b.c[i] + b.c[i + 2], b.c[i + 1]); ctx.arc(b.c[i], b.c[i + 1], b.c[i + 2], 0, 6.2832); }
      for (const q of b.s) { ctx.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) ctx.lineTo(q[i], q[i + 1]); }
      marks += b.p.length + b.c.length / 3 + b.s.length;
      const col = rank === FILL || rank === HALO ? GROUND : STYLE[(rank <= GOLDS ? 1 : 3) * 16 + lv];
      if (rank === GOLDS || rank === LIGHTS) { ctx.lineWidth = WS[k & 15]; ctx.strokeStyle = col; ctx.stroke(); }
      else { ctx.fillStyle = col; ctx.fill(); }
      b.p.length = 0; b.c.length = 0; b.s.length = 0;
    }
    used.length = 0;
  }
  const level = (t) => clamp(Math.round(t * LV), 0, LV);
  // a fine line through SX/SY as one stroke, if it is on screen
  function fine(n, rank, lv, px) {
    if (n < 2) return;
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (let i = 0; i < n; i++) { if (SX[i] < minx) minx = SX[i]; if (SX[i] > maxx) maxx = SX[i]; if (SY[i] < miny) miny = SY[i]; if (SY[i] > maxy) maxy = SY[i]; }
    if (maxx < -8 || minx > cam.W + 8 || maxy < -8 || miny > cam.H + 8) return;
    const q = new Array(n * 2);
    for (let i = 0; i < n; i++) { q[i * 2] = SX[i]; q[i * 2 + 1] = SY[i]; }
    stroke(K(rank, lv, wstep(px)), q);
  }

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
    if (Zobj > (LITE ? it.lod * 0.5 : it.lod)) return;
    const P = it.P, n = it.n;
    for (let i = 0; i < n; i++) { toCam(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); CXa[i] = C[0]; CYa[i] = C[1]; CZa[i] = C[2]; }
    let m = 0, zsum = 0, wsum = 0, hmax = 0;
    const emit = () => {
      if (m >= 2) {
        const Zm = zsum / m, wm = wsum / m;
        const thin = Math.min(1, (wm * 2) / MINPX);
        const lv = level(Math.max(it.minTone || 0, it.tone * fade(Zm) * thin)), light = it.c === 'l';
        if (hmax < 0.62 || (hmax < 1.1 && !it.taper)) fine(m, light ? LIGHTS : GOLDS, lv, Math.max(MINPX, wm * 2 * (it.taper ? 0.75 : 1)));
        else ribbon(m, K(light ? LIGHT : GOLD, lv), true);
      }
      m = 0; zsum = 0; wsum = 0; hmax = 0;
    };
    const push = (X, Y, Z, i, t) => {
      const px = (it.w * cam.f) / Z;
      let h = clamp(px, MINPX, it.maxPx || MAXPX) / 2;
      if (it.taper) h *= taperAt(t);
      SX[m] = cam.cx + (cam.f * X) / Z; SY[m] = cam.cy - (cam.f * Y) / Z; SW[m] = h;
      SN[m] = it.N[i] * Math.min(1.1, 0.25 + px * 0.12);
      zsum += Z; wsum += Math.min(px, it.maxPx || MAXPX) / 2; if (h > hmax) hmax = h; m++;
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
    put(K(FILL, 0), q);
  }
  // a string light, the logo's glyph: a dark halo, a bright point, eight fine rays
  function paintBulb(it) {
    toCam(it.x, it.y, it.z);
    const Z = C[2];
    if (Z < NEAR * 2) return;
    const sx = cam.cx + (cam.f * C[0]) / Z, sy = cam.cy - (cam.f * C[1]) / Z;
    if (sx < -40 || sx > cam.W + 40 || sy < -40 || sy > cam.H + 40) return;
    const g = clamp((it.r * cam.f) / Z, 0.32, 3.1), lv = level(0.55 + 0.45 * fade(Z));
    dot(K(HALO, 0), sx, sy, 2.6 * g);
    dot(K(DOT, lv), sx, sy, Math.max(0.55, 1.45 * g));
    if (g < 0.62) return;
    // the rays: the long four in one stroke, the short four in another
    for (const [a, b, wk] of [[0, 4, 0.42], [4, 8, 0.32]]) {
      const q = [];
      for (let r = a; r < b; r++) { const [dx, dy, len] = RAYS[r]; q.push(sx + dx * 2.6 * g, sy + dy * 2.6 * g, sx + dx * (2.6 + len) * g, sy + dy * (2.6 + len) * g); }
      for (let i = 0; i < q.length; i += 4) stroke(K(LIGHTS, lv, wstep(wk * g)), q.slice(i, i + 4));
    }
  }
  const RAYS = [[1, 0, 4.5], [-1, 0, 4.5], [0, -1, 4], [0, 1, 4], [0.7, 0.7, 2.6], [-0.7, 0.7, 2.6], [0.7, -0.7, 2.6], [-0.7, -0.7, 2.6]];

  // ---- a tube (trunk or limb) through world spine points, drawn as the logo draws its oaks:
  // a dark body, a lit edge toward the light, a fine shadow edge, bark on the lit half
  const TX = new Float32Array(MAXP), TY = new Float32Array(MAXP), TR = new Float32Array(MAXP), TZ = new Float32Array(MAXP), TT = new Float32Array(MAXP);
  function tube(spine, radius, litSign, bark, nz, N) {
    // spine: function t -> [x,y,z]; radius: function t -> feet; nz: the tube's own noise
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
    put(K(FILL, 0), body);
    let zs = 0; for (let i = 0; i < m; i++) zs += TZ[i];
    const Zm = zs / m, fd = fade(Zm), rm = TR[Math.floor(m / 2)];
    // edges
    for (const [sg, wk, tone] of [[side, 0.085, 1], [-side, 0.035, 0.55]]) {
      for (let i = 0; i < m; i++) {
        SX[i] = TX[i] + NX[i] * TR[i] * sg * 0.94; SY[i] = TY[i] + NY[i] * TR[i] * sg * 0.94;
        SW[i] = clamp(TR[i] * wk * 2, 0.3, 2.6) * (0.55 + 0.45 * taperAt(TT[i] * 1.1));
        SN[i] = nz(i * 1.3 + sg * 7) * Math.min(1, 0.2 + TR[i] * 0.04);
      }
      if (rm < 6) { let w = 0; for (let i = 0; i < m; i++) w += SW[i]; fine(m, GOLDS, level(tone * fd * Math.min(1, rm / 1.2)), Math.max(0.35, (2 * w) / m)); }
      else ribbon(m, K(GOLD, level(tone * fd * Math.min(1, rm / 1.2))), true);
    }
    // bark: [fx, t0, t1, wf] in tube parameter
    if (bark && rm > 3.5 && !LITE) {
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
        if (n2 >= 2) { if (rm > 16) ribbon(n2, K(GOLD, level((0.35 + 0.6 * fx) * fd)), true); else fine(n2, GOLDS, level((0.35 + 0.6 * fx) * fd), Math.max(0.3, SW[1] * 2)); }
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
      tube(sp, (u) => L.r0 * lerp(1, 0.18, u), undefined, null, L.nz || (L.nz = noise1(L.seed)), 12);
      flushInto();
    }
    const near = (t.r * cam.f) / Math.max(1, o.d);
    tube(spine, radius, undefined, t.barkT, t.nz || (t.nz = noise1(t.seed)), near > 8 ? 26 : 10);
  }
  // limbs sit behind their own trunk; draw each in its own pass so the trunk covers its root
  function flushInto() { flush(); }

  function drawClump(o) {
    const c = o.c;
    toCam(c.x, c.y, c.z);
    const Z = C[2];
    if (Z < NEAR * 4) return;
    const sx = cam.cx + (cam.f * C[0]) / Z, sy = cam.cy - (cam.f * C[1]) / Z, rs = (c.R * cam.f) / Z;
    if (rs < 2 || rs > cam.H * 0.8 || sx + rs * 1.3 < 0 || sx - rs * 1.3 > cam.W || sy + rs < 0 || sy - rs > cam.H) return;
    const lobe = (a) => 1 + 0.12 * Math.sin(a * 5 + c.lob[0]) + 0.09 * Math.sin(a * 11 + c.lob[1]) + 0.05 * Math.sin(a * 19 + c.lob[2]);
    const q = new Array(52);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, r = rs * lobe(a); q[i * 2] = sx + r * Math.cos(a); q[i * 2 + 1] = sy + r * Math.sin(a) * 0.82; }
    put(K(FILL, 0), q);
    const fd = fade(Z), rows = rs < 9 || Z > 100 ? 0 : clamp(Math.round(rs / (LITE ? 14 : 8)), 1, 6);
    for (let k = 0; k < c.sc.length; k += 4) {
      const a = c.sc[k], row = c.sc[k + 1], rr = c.sc[k + 2], s2 = c.sc[k + 3];
      if (row >= rows) continue;
      const r = rs * lobe(a) * rr - 1, x = sx + r * Math.cos(a), y = sy + r * Math.sin(a) * 0.82;
      const s = Math.max(0.9, s2 * rs), nx = Math.cos(a), ny = Math.sin(a), tx = -ny, ty = nx;
      // a small scallop, as one stroke
      stroke(K(GOLDS, level((0.45 + 0.55 * (1 - row / 6)) * fd), wstep(clamp(rs * 0.03 * (0.35 + 0.65 * (1 - row / 6)), 0.3, 1.3))),
        [x - tx * s, y - ty * s, x + nx * s * 0.8 - tx * s * 0.45, y + ny * s * 0.8 - ty * s * 0.45, x + nx * s * 0.8 + tx * s * 0.45, y + ny * s * 0.8 + ty * s * 0.45, x + tx * s, y + ty * s]);
    }
    // a thin rim against the sky
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.15 + 0.7 * (i / 8)), r = rs * lobe(a); SX[i] = sx + r * Math.cos(a); SY[i] = sy + r * Math.sin(a) * 0.82; }
    fine(9, GOLDS, level(0.5 * fd), clamp(rs * 0.025, 0.3, 1));
  }

  // ---- a spire: the canvas house as a surface of revolution with the logo's profile
  // (engrave.js spireSides: the cubic from the finial out to the hem)
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  function drawSpire(o) {
    const sp = o.sp, R = rng(sp.seed);
    const ang = Math.atan2(cam.z - sp.cz, cam.x - sp.cx); // toward the camera, in the x-z plane
    const n = sp.seams;
    // the window faces the end of the bridge; the hem is pulled down to an anchor beneath it
    // and arches up between anchors (Mick's photographs: the canvas over a wooden knee wall)
    const wf = Math.atan2(SPAN - sp.cz, 0 - sp.cx);
    const hemLift = (phi) => { const k = (((((phi - wf) / (Math.PI * 2)) * n * 2) % 1) + 1) % 1; return sp.arch * 4 * k * (1 - k); };
    const at = (phi, v, lift) => {
      const r = sp.r * bez(0, 0.3, 0.68, 1, v), drop = sp.h * bez(0, 0.52, 0.9, 1, v);
      return [sp.cx + r * Math.cos(phi), sp.y0 + Math.max(sp.h - drop, hemLift(phi)) + (lift || 0), sp.cz + r * Math.sin(phi)];
    };
    const ring = (phi, y) => [sp.cx + sp.r * Math.cos(phi), y, sp.cz + sp.r * Math.sin(phi)];
    // where each canvas line meets the hem
    const vEnd = (phi) => { const goal = sp.h - hemLift(phi); let lo = 0.5, hi = 1; for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (sp.h * bez(0, 0.52, 0.9, 1, m) < goal) lo = m; else hi = m; } return lo; };
    // the dark body: the silhouette down to the floor, the knee wall's front around the bottom
    const sil = [];
    for (let i = 0; i <= 12; i++) sil.push(at(ang + Math.PI / 2, i / 12));
    sil.push(ring(ang + Math.PI / 2, SKY.y));
    for (let i = 0; i <= 24; i++) sil.push(ring(ang + Math.PI / 2 - (Math.PI * i) / 24, SKY.y));
    sil.push(ring(ang - Math.PI / 2, SKY.y));
    for (let i = 12; i >= 0; i--) sil.push(at(ang - Math.PI / 2, i / 12));
    paintFill({ P: Float32Array.from(sil.flat()), n: sil.length });
    // the knee wall: board seams around its front, a cap where the canvas sits
    for (const [y, w, tone] of [[sp.y0, 0.12, 0.95], [sp.y0 - 0.8, 0.03, 0.55], [sp.y0 - 1.6, 0.03, 0.5], [SKY.y + 0.05, 0.06, 0.7]]) {
      let m = 0;
      for (let i = 0; i <= 24; i++) { const p = ring(ang + Math.PI / 2 - (Math.PI * i) / 24, y); toCam(p[0], p[1], p[2]); if (C[2] < NEAR) continue; SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp((w * cam.f) / C[2], 0.3, 3) / 2; SN[m] = 0; m++; }
      ribbon(m, K(GOLD, level(tone * fade(sp.r + 3))), false);
    }
    // the canvas lines, from the finial to the hem, swelling as the hand presses
    toCam(sp.cx, sp.y0 + sp.h * 0.5, sp.cz); const Zc = C[2];
    if (Zc < NEAR) return;
    const fd = fade(Zc), big = (sp.r * cam.f) / Zc, gap = 3.6;
    if (!sp.press) sp.press = Array.from({ length: sp.M }, (_, i) => noise1(i * 7 + sp.seed));
    const order = [];
    for (let i = 0; i < sp.M; i++) {
      let d = (i / sp.M) * Math.PI * 2 + 0.05 - ang;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (Math.abs(d) < Math.PI / 2 - 0.02) order.push([Math.sin(d), i]);
    }
    order.sort((a, b) => a[0] - b[0]);
    let lastS = -9;
    for (const [sd, i] of order) {
      const seam = i % (sp.M / n / 2) === 0;
      if (!seam && (sd - lastS) * big < gap) continue;
      lastS = sd;
      const phi = (i / sp.M) * Math.PI * 2 + 0.05, face = Math.cos(phi - ang);
      const tone = (0.3 + 0.7 * face ** 0.7) * sp.bright;
      const press = sp.press[i];
      const v0 = 0.04 + (i % 2 ? 0.1 : 0.02), ve = sp.vEnd ? sp.vEnd[i] : (sp.vEnd = Array.from({ length: sp.M }, (_, j) => vEnd((j / sp.M) * Math.PI * 2 + 0.05)))[i];
      let m = 0;
      for (let s = 0; s <= 10; s++) {
        const v = lerp(v0, ve, s / 10), p = at(phi, v);
        toCam(p[0], p[1], p[2]); if (C[2] < NEAR) { m = 0; break; }
        SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2];
        const w = (seam ? 0.2 : 0.155) * tone * Math.max(0.12, 0.15 + 0.85 * v ** 0.8) * (0.62 + 0.62 * (0.5 + 0.5 * press(v * 5.5)));
        SW[m] = clamp((w * cam.f) / C[2], 0.25, 4.5) / 2; SN[m] = press(v * 9 + 3) * 0.4; m++;
      }
      ribbon(m, K(seam ? GOLD : LIGHT, level(tone * fd)), true);
    }
    // hatching across the lit canvas, following its curve: short strokes, densest where it glows
    const hrows = big > 110 ? 26 : big > 45 ? 16 : 10;
    for (let r = 0; r < hrows; r++) {
      const v = lerp(0.42, 0.86, r / (hrows - 1));
      let u = -1.2 + R() * 0.08;
      while (u < 1.2) {
        const len = 0.1 + R() * 0.16, u1 = Math.min(1.2, u + len), um = (u + u1) / 2;
        const glow = Math.cos(um) ** 1.3 * clamp((v - 0.4) / 0.45, 0, 1);
        if (glow > 0.3 + R() * 0.3) {
          let m = 0;
          for (let s = 0; s <= 3; s++) { const p = at(ang + lerp(u, u1, s / 3), v - 0.012 * (s - 1.5)); toCam(p[0], p[1], p[2]); if (C[2] < NEAR) { m = 0; break; } SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp(((0.04 + 0.07 * glow) * cam.f) / C[2], 0.2, 2.4) / 2 * taperAt(s / 3); m++; }
          ribbon(m, K(LIGHT, level((0.45 + 0.5 * glow) * sp.bright * fd)), false);
        }
        u = u1 + 0.05 + R() * 0.12;
      }
    }
    // the hem, scalloped between its anchors
    {
      let m = 0;
      for (let i = 0; i <= 60; i++) { const phi = ang + Math.PI / 2 - (Math.PI * i) / 60, p = at(phi, 1); toCam(p[0], p[1], p[2]); if (C[2] < NEAR) continue; SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp((0.09 * sp.bright * cam.f) / C[2], 0.4, 3) / 2; m++; }
      ribbon(m, K(LIGHT, level(sp.bright * fd)), false);
    }
    // the silhouette, bolder on the side toward the light
    for (const [dphi, wk] of [[Math.PI / 2, 0.16], [-Math.PI / 2, 0.11]]) {
      let m = 0;
      for (let i = 0; i <= 12; i++) { const p = at(ang + dphi, i / 12); toCam(p[0], p[1], p[2]); if (C[2] < NEAR) continue; SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp((wk * sp.bright * (0.35 + 0.65 * i / 12) * cam.f) / C[2], 0.3, 3.5) / 2; m++; }
      ribbon(m, K(LIGHT, level(sp.bright * fd)), false);
    }
    // the fly window, lit from inside, and its zipper; it faces the bridge
    if (sp.win) {
      const face = Math.cos(wf - ang);
      if (face > 0.15) {
        const panel = (du, vT, vB) => {
          const pts = [at(wf, vT, 0)];
          for (let k = 1; k <= 8; k++) { const v = lerp(vT, vB, k / 8), e = Math.min(1, k / 8 / 0.3); pts.push(at(wf - du * Math.sin((e * Math.PI) / 2), v)); }
          for (let k = 8; k >= 1; k--) { const v = lerp(vT, vB, k / 8), e = Math.min(1, k / 8 / 0.3); pts.push(at(wf + du * Math.sin((e * Math.PI) / 2), v)); }
          return pts;
        };
        paintFill({ P: Float32Array.from(panel(0.36, 0.47, 0.83).flat()), n: 17 });
        // the window's frame
        { let m = 0; for (const p of panel(0.33, 0.485, 0.815)) { toCam(p[0], p[1], p[2]); if (C[2] < NEAR) continue; SX[m] = cam.cx + (cam.f * C[0]) / C[2]; SY[m] = cam.cy - (cam.f * C[1]) / C[2]; SW[m] = clamp((0.09 * cam.f) / C[2], 0.4, 3) / 2; SN[m] = 0; m++; } if (m > 2) { SX[m] = SX[0]; SY[m] = SY[0]; SW[m] = SW[0]; m++; } ribbon(m, K(LIGHT, level(0.75 * fd)), false); }
        // the light inside, engraved: close level strokes across the panel, heaviest at its middle
        const vT = 0.505, vB = 0.8, du = 0.29, scr = (p) => { toCam(p[0], p[1], p[2]); return C[2] < NEAR ? null : [cam.cx + (cam.f * C[0]) / C[2], cam.cy - (cam.f * C[1]) / C[2]]; };
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
          ribbon(m, K(LIGHT, level(fd)), false);
        }
        // the zipper, down the middle
        let m = 0;
        for (let s = 0; s <= 6; s++) { const p = scr(at(wf, lerp(vT + 0.01, vB, s / 6))); if (p) { SX[m] = p[0]; SY[m] = p[1]; SW[m] = Math.max(0.5, tall * 0.006); SN[m] = 0; m++; } }
        ribbon(m, K(FILL, 0), false);
      }
    }
    // the finial: a slender gold cap and a bead
    toCam(sp.cx, sp.y0 + sp.h + 0.2, sp.cz);
    if (C[2] > NEAR) {
      const x = cam.cx + (cam.f * C[0]) / C[2], y = cam.cy - (cam.f * C[1]) / C[2], s = (0.12 * cam.f) / C[2] * (sp.win ? 1 : 0.8);
      const hh = 20 * s, w = 4.2 * s, q = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8; q.push(x + w * Math.sin(t * Math.PI / 2) ** 0.7, y - hh * (1 - t) ** 1.6); }
      for (let i = 8; i >= 0; i--) { const t = i / 8; q.push(x - w * Math.sin(t * Math.PI / 2) ** 0.7, y - hh * (1 - t) ** 1.6); }
      put(K(GOLD, level(fd)), q);
      dot(K(GOLD, level(fd)), x, y - hh - 2.2 * s, Math.max(0.5, 1.8 * s));
    }
  }

  // ---------------------------------------------------------------- the sky: the logo's engraved lines,
  // brightest in the opening over the house. The sky sits at infinity, so only turning the head
  // moves it: its lines are engraved once into a plate of their own and laid in place each frame.
  let sky = null;
  function skyPlate() {
    const Rk = Math.max(cam.W, cam.H) * 0.8, sc = Math.min(dpr, 1.5);
    const w = Math.ceil(Rk * 2.7), h = Math.ceil(Rk * 1.75), ox = w / 2, oy = Rk;
    const c = document.createElement('canvas');
    c.width = Math.round(w * sc); c.height = Math.round(h * sc);
    const g = c.getContext('2d');
    g.setTransform(sc, 0, 0, sc, 0, 0);
    g.fillStyle = GROUND; g.fillRect(0, 0, w, h);
    const nz = noise1(5), by = new Map();
    const run = (pts) => {
      if (pts.length < 2) return;
      const n = pts.length, q = new Array(n * 4);
      for (let i = 0; i < n; i++) { const [x, y, hw] = pts[i]; q[i * 2] = x; q[i * 2 + 1] = y - hw; const j = (2 * n - 1 - i) * 2; q[j] = x; q[j + 1] = y + hw; }
      const lv = level(0.55 + 0.45 * pts.reduce((a, p) => a + p[3], 0) / n);
      if (!by.has(lv)) by.set(lv, []);
      by.get(lv).push(q);
    };
    let row = 0;
    for (let y = 1.5; y < h; y += 3.3, row++) {
      let pts = [];
      for (let x = 0; x <= w; x += 9) {
        const tone = Math.max(0, 1 - Math.hypot((x - ox) / 1.35, (y - oy) * 1.15) / Rk) ** 1.5;
        if (tone > 0.04 && nz(x * 0.01 + row * 0.7) > -0.6) pts.push([x, y + nz(x * 0.02 + row) * 0.5, (0.1 + 0.9 * tone) / 2, tone]);
        else { run(pts); pts = []; }
      }
      run(pts);
    }
    for (const [lv, qs] of by) {
      g.beginPath();
      for (const q of qs) { g.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) g.lineTo(q[i], q[i + 1]); g.closePath(); }
      g.fillStyle = STYLE[16 + lv]; g.fill();
    }
    sky = { c, w, h, ox, oy };
  }
  function paintSky() {
    // where the opening sits: straight ahead, 26 degrees up
    const e = rad(26), dy = Math.sin(e), dz = Math.cos(e);
    const X = -dz * cam.sy, Z1 = dz * cam.cyw;
    const Y = dy * cam.cp - Z1 * cam.sp, Z = dy * cam.sp + Z1 * cam.cp;
    if (Z < 0.05) return;
    const gx = cam.cx + (cam.f * X) / Z, gy = cam.cy - (cam.f * Y) / Z;
    if (!sky) skyPlate();
    if (gx + sky.w / 2 < 0 || gx - sky.w / 2 > cam.W || gy + sky.h < 0 || gy - sky.oy > cam.H) return;
    ctx.drawImage(sky.c, gx - sky.ox, gy - sky.oy, sky.w, sky.h);
  }

  // ---------------------------------------------------------------- one frame
  function render(p) {
    const T = performance.now(), W = cam.W, H = cam.H, s = walk(p);
    setCam(s.x, s.y, s.z, s.pitch, s.yaw, s.roll);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = GROUND; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2); ctx.rotate(cam.roll); ctx.scale(1.02, 1.02); ctx.translate(-W / 2, -H / 2);
    paintSky();
    marks = 0;
    for (const o of OBJ) { toCam(o.x, o.y, o.z); o.d = C[2] + o.bias; }
    const list = OBJ.filter((o) => o.d > -30).sort((a, b) => b.d - a.d);
    for (const o of list) {
      if (o.draw) o.draw(o);
      for (const it of o.items) {
        if (it.k === 0) paintLine(it, o.d);
        else if (it.k === 1) paintFill(it);
        else paintBulb(it);
      }
      flush();
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
    // keep the walk smooth: if frames run slow, draw at a lower resolution, then with less detail
    const ms = performance.now() - T;
    frames++; ema = frames < 4 ? ms : ema * 0.85 + ms * 0.15;
    if (frames > 12 && ema > 20 && !STEADY) {
      if (dprCap > 1) { dprCap = Math.max(1, dprCap - 0.5); cam.W = 0; } else LITE = true;
      frames = 4; ema = 12;
    }
  }
  let frames = 0, ema = 0, dprCap = 2;

  // ---------------------------------------------------------------- size, scroll, and the loop
  function resize() {
    const r = stage.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height);
    if (W === cam.W && Math.abs(H - cam.H) < 90) return false;
    if (!cam.W && !frames && W < 768) dprCap = 1.5;
    dpr = Math.min(dprCap, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    sky = null;
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
  // for the poster renderer and speed checks
  window.lfCrossing = { render: (p) => { resize(); render(p); }, stats: () => ({ marks, ema, dpr, LITE }) };
  if (STILL) sec.classList.add('is-still');
  sec.classList.add('is-ready');
  resize(); eased = STILL ? 0 : progress(); render(eased); shown = eased;
  if (STILL) { window.addEventListener('resize', () => { if (resize()) render(0); }); return; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { const was = live; live = es[0].isIntersecting; if (live && !was) requestAnimationFrame(frame); }, { rootMargin: '200px 0px' }).observe(sec);
  } else { live = true; requestAnimationFrame(frame); }
})();
