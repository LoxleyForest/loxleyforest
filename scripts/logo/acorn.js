// An engraved acorn to crown the arch. Drawn around (cx, base) where base is the cap's lower rim.
function acorn(cx = 150, base = 0.5, s = 1) {
  const P = (x, y) => `${(cx + x * s).toFixed(1)} ${(base + y * s).toFixed(1)}`;
  const ops = [];
  // nut sits below the rim inside the cap? No: a finial: cap on top, nut hangs... we stand it upright: nut on the arch, cap above.
  // nut: egg from the rim down to... upright acorn on the frame: nut bottom touches the frame, cap on top.
  const nut = `M${P(0, 0)}C${P(-3.2, -1.2)} ${P(-7.6, -6)} ${P(-7.4, -11.5)}L${P(7.4, -11.5)}C${P(7.6, -6)} ${P(3.2, -1.2)} ${P(0, 0)}Z`;
  const cap = `M${P(-8.6, -11)}C${P(-9.2, -17)} ${P(-5, -21)} ${P(0, -21.2)}C${P(5, -21)} ${P(9.2, -17)} ${P(8.6, -11)}C${P(3, -12.6)} ${P(-3, -12.6)} ${P(-8.6, -11)}Z`;
  const stem = `M${P(0, -21)}C${P(0.4, -23.5)} ${P(1.6, -25)} ${P(3.2, -26)}`;
  // cap texture: a little lattice; nut: two highlight strokes
  const hatch = [];
  for (let k = -3; k <= 3; k++) hatch.push(`M${P(k * 2.4 - 3, -12.2)}L${P(k * 2.4 + 2.2, -20)}`, `M${P(k * 2.4 + 3, -12.2)}L${P(k * 2.4 - 2.2, -20)}`);
  return { nut, cap, stem, hatch: hatch.join(''), glint: `M${P(-3.6, -9.6)}C${P(-3.9, -6.4)} ${P(-2.6, -3.6)} ${P(-1, -1.8)}` };
}
module.exports = { acorn };
