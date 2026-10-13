// Browser animation for the Loxley Forest lockup. Deterministic: seek(t) draws the frame at t seconds.
// Expects window.LF_CFG = { E:{...emblem geometry}, wm:{tip, ay} } and an <svg id="stage"> holding the stacked lockup.
(function () {
  const cfg = window.LF_CFG, svg = document.getElementById('stage');
  if (!cfg || !svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const q = (s, r = svg) => r.querySelector(s), qa = (s, r = svg) => Array.from(r.querySelectorAll(s));
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eo3 = (u) => 1 - (1 - u) ** 3, eio = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
  const eBack = (u) => { const c = 1.5; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
  const mix = (a, b, u) => a + (b - a) * u;
  const hexMix = (h1, h2, u) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const a = p(h1), b = p(h2); return '#' + a.map((v, i) => Math.round(mix(v, b[i], u)).toString(16).padStart(2, '0')).join(''); };
  const { E, wm } = cfg;
  const emb = q('.emblem'), wmg = q('.wordmark');

  // --- wipes: a clip rect per layer, in emblem space ---
  const defs = document.createElementNS(NS, 'defs'); emb.appendChild(defs);
  const wipe = (sel, key) => {
    const g = q(sel, emb); if (!g) return null;
    const cp = document.createElementNS(NS, 'clipPath'); cp.id = 'wipe-' + key;
    const r = document.createElementNS(NS, 'rect'); cp.appendChild(r); defs.appendChild(cp);
    g.setAttribute('clip-path', `url(#wipe-${key})`);
    return { g, r };
  };
  const W = E.W, H = E.H;
  const wipes = {};
  ['sky', 'oak-O5', 'oak-O2', 'oak-O4', 'oak-O1', 'oak-O3', 'canopy', 'floor', 'spire-small', 'spire-big', 'deck', 'rail', 'bridge'].forEach((k) => (wipes[k] = wipe('.ly-' + k, k)));
  const setRect = (w, x, y, ww, hh) => { if (!w) return; w.r.setAttribute('x', x); w.r.setAttribute('y', y); w.r.setAttribute('width', Math.max(0, ww)); w.r.setAttribute('height', Math.max(0, hh)); };

  // --- pen draws: dash by real length ---
  const drawables = (sel) => qa(sel, emb).map((p) => { const L = p.getTotalLength ? p.getTotalLength() : 1; p.style.strokeDasharray = `${L} ${L}`; return { p, L }; });
  const frame = drawables('.frame, .frame2');
  const truss = drawables('.ly-truss path[stroke]');
  const cables = drawables('.ly-cables path[stroke]');
  const trussFills = qa('.ly-truss path:not([stroke]), .ly-truss circle', emb);
  const draw = (list, u) => list.forEach(({ p, L }) => (p.style.strokeDashoffset = L * (1 - u)));

  // --- the canvas: cream when lit, dim gold before ---
  const LIGHT = '#f7e4bd', DIM = '#7d6d4b';
  const canvasLines = qa('.ly-spire-small path, .ly-spire-big path', emb).filter((p) => !p.classList.contains('win') && (p.getAttribute('fill') || '').toLowerCase() === LIGHT);
  const win = qa('.win', emb), finials = qa('.finial', emb);

  // finial glints
  const glints = [E.small, E.big].map((s, i) => {
    const g = document.createElementNS(NS, 'g'); const bx = s.cx, by = s.ty - 20 * (i ? 1 : 0.8) - 2.2;
    g.innerHTML = `<path d="M${bx} ${by - 13}L${bx + 1} ${by - 1}L${bx + 13} ${by}L${bx + 1} ${by + 1}L${bx} ${by + 13}L${bx - 1} ${by + 1}L${bx - 13} ${by}L${bx - 1} ${by - 1}Z" fill="#fff6dc"/>`;
    emb.appendChild(g); return { g, bx, by };
  });

  // --- lights ---
  const bulbs = {};
  qa('.ly-lights .bulb, .ly-lights .ray', emb).forEach((el) => { const i = +el.dataset.i; (bulbs[i] = bulbs[i] || { dots: [], rays: [] })[el.classList.contains('ray') ? 'rays' : 'dots'].push(el); });
  Object.values(bulbs).forEach((b) => { const c = b.dots[0]; b.x = +c.getAttribute('cx'); b.y = +c.getAttribute('cy'); });
  const bulbOrder = Object.keys(bulbs).map(Number).sort((a, b) => bulbs[a].x - bulbs[b].x);

  // --- wordmark ---
  const fly = qa('.fly', wmg), glyphs = qa('.name .g', wmg), mglyphs = qa('.mg', wmg);
  const tg = qa('.tagline .tg');
  // motion blur on the flying arrow
  const fdefs = document.createElementNS(NS, 'defs');
  fdefs.innerHTML = `<filter id="lf-blur" x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur id="lf-blur-g" stdDeviation="0 0"/></filter>`;
  wmg.appendChild(fdefs);
  const blurG = fdefs.querySelector('#lf-blur-g');
  fly.forEach((f) => f.setAttribute('filter', 'url(#lf-blur)'));
  const FLY0 = 5.55, FLY1 = 6.35, START = -(wm.tip + 260);

  const T_END = 8.2;
  function seek(t) {
    // frame
    draw(frame.slice(0, 1), eio(prog(t, 0.05, 1.25)));
    draw(frame.slice(1), eio(prog(t, 0.35, 1.45)));
    // sky inks in from the top
    const us = eo3(prog(t, 0.5, 1.7)); setRect(wipes.sky, 0, 0, W, H * 0.62 * us);
    // five oaks grow from the forest floor
    [['oak-O5', 0.8], ['oak-O2', 0.9], ['oak-O4', 1.0], ['oak-O1', 1.1], ['oak-O3', 1.2]].forEach(([k, a]) => { const u = eo3(prog(t, a, a + 1.05)); setRect(wipes[k], -20, H * (1 - u), W + 40, H * u + 10); });
    // canopy spreads down from the crowns
    const uc = eio(prog(t, 1.75, 2.75)); setRect(wipes.canopy, -20, -20, W + 40, 20 + 190 * uc);
    const uf = eo3(prog(t, 1.5, 2.3)); setRect(wipes.floor, -20, H - 60 * uf, W + 40, 70);
    // truss and its hubs, then the deck, then the cables up from the bottom hubs
    draw(truss, eio(prog(t, 2.3, 2.95)));
    trussFills.forEach((el) => (el.style.opacity = prog(t, 2.6, 2.9)));
    const ud = eio(prog(t, 2.55, 3.15)); setRect(wipes.deck, E.deckX0 - 4 + (E.deckX1 - E.deckX0 + 8) * 0 , E.deckY - 4, (E.deckX1 - E.deckX0 + 8) * ud, 20);
    draw(cables, eio(prog(t, 2.8, 3.7)));
    // the canvas rises off the deck
    const u1 = eo3(prog(t, 3.2, 4.1)), u2 = eo3(prog(t, 3.35, 4.35));
    setRect(wipes['spire-small'], 0, E.small.by + 2 - (E.small.by - E.small.ty + 34) * u1, W, (E.small.by - E.small.ty + 36) * u1);
    setRect(wipes['spire-big'], 0, E.big.by + 2 - (E.big.by - E.big.ty + 40) * u2, W, (E.big.by - E.big.ty + 42) * u2);
    // rail, bridge
    const ur = eio(prog(t, 3.9, 4.4)); setRect(wipes.rail, E.big.cx + E.big.hw, E.deckY - 22, (E.deckX1 - E.big.cx - E.big.hw + 4) * ur, 26);
    const ub = eio(prog(t, 3.7, 4.7)); setRect(wipes.bridge, -10, E.deckY - 40, (E.deckX0 + 14) * ub + 10, 120);
    // finial glints
    glints.forEach((gl, i) => { const a = 4.15 + i * 0.22, u = prog(t, a, a + 0.55); const s = Math.sin(Math.PI * u); gl.g.setAttribute('opacity', s.toFixed(3)); gl.g.setAttribute('transform', `rotate(${45 * u} ${gl.bx} ${gl.by}) translate(${gl.bx} ${gl.by}) scale(${0.3 + 0.9 * s}) translate(${-gl.bx} ${-gl.by})`); });
    // the lamp: the window flickers on, then the canvas warms
    const lw = t < 4.55 ? 0 : t < 4.62 ? 0.8 : t < 4.7 ? 0.25 : t < 4.8 ? 0.9 : t < 4.86 ? 0.6 : 1;
    const flick = t > 8 ? 0.93 + 0.07 * Math.sin(t * 7.1) * Math.sin(t * 3.3) : 1;
    win.forEach((el) => { if ((el.getAttribute('fill') || '').toLowerCase() === LIGHT) el.style.opacity = lw * flick; });
    const warm = eio(prog(t, 4.6, 5.4)), col = hexMix(DIM, LIGHT, warm);
    canvasLines.forEach((p) => p.setAttribute('fill', col));
    // the bulbs come on, left to right
    bulbOrder.forEach((i, k) => {
      const b = bulbs[i], a = 4.85 + k * 0.1, u = prog(t, a, a + 0.32);
      const s = u <= 0 ? 0 : eBack(u);
      const tw = t > 6 ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * (2.1 + (i % 4) * 0.37) + i * 1.9)) : 1;
      b.dots.forEach((d) => d.setAttribute('transform', `translate(${b.x} ${b.y}) scale(${s}) translate(${-b.x} ${-b.y})`));
      b.rays.forEach((r) => { r.style.opacity = (u > 0 ? Math.min(1, u * 1.4) : 0) * tw; r.setAttribute('transform', `translate(${b.x} ${b.y}) scale(${0.6 + 0.4 * s * (0.85 + 0.15 * tw)}) translate(${-b.x} ${-b.y})`); });
    });
    // the arrow flies in and writes the name
    const uf2 = prog(t, FLY0, FLY1), pos = eo3(uf2), vel = uf2 > 0 && uf2 < 1 ? 3 * (1 - uf2) ** 2 : 0;
    const dx = START * (1 - pos);
    let rot = 0;
    if (t > FLY1) { const tau = t - FLY1; rot = 1.7 * Math.exp(-5.2 * tau) * Math.sin(30 * tau); }
    const tr = `translate(${dx.toFixed(2)} 0) rotate(${rot.toFixed(3)} ${wm.tip} ${wm.ay})`;
    fly.forEach((f) => f.setAttribute('transform', tr));
    blurG.setAttribute('stdDeviation', `${(vel * 9).toFixed(2)} 0`);
    const head = wm.tip + dx;
    glyphs.forEach((g, i) => {
      const cx = +g.dataset.cx, u = eo3(clamp((head - cx) / 70));
      const v = t < FLY0 ? 0 : u;
      g.style.opacity = v; g.setAttribute('transform', `translate(0 ${((1 - v) * 9).toFixed(2)})`);
      if (mglyphs[i]) mglyphs[i].style.opacity = v;
    });
    // tagline gathers in
    const n = tg.length;
    tg.forEach((p, i) => { const a = 6.45 + i * 0.025, u = eo3(prog(t, a, a + 0.6)); p.style.opacity = u; p.setAttribute('transform', `translate(${((i - n / 2) * 2.2 * (1 - u)).toFixed(2)} 0)`); });
  }
  window.seek = seek;
  window.LF_T_END = T_END;

  // playback
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t0 = null, raf = null;
  function loop(now) { if (t0 === null) t0 = now; const t = (now - t0) / 1000; seek(t); raf = requestAnimationFrame(loop); }
  window.lfPlay = () => { if (reduce) { seek(T_END); return; } cancelAnimationFrame(raf); t0 = null; raf = requestAnimationFrame(loop); };
  window.lfStop = () => cancelAnimationFrame(raf);
  seek(T_END); // complete at rest
  if (!cfg.manual) { if (reduce) seek(T_END); else setTimeout(window.lfPlay, 350); }
})();
