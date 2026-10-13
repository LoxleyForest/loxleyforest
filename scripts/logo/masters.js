const fs = require('fs');
const E2 = require('./emblem2.js');
const LK = require('./lockups.js');
const { C } = LK;
const dir = __dirname + '/out/masters'; fs.mkdirSync(dir, { recursive: true });
const svg = (inner, w, h, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><title>${title}</title>${inner}</svg>`;
const out = {};
const put = (name, s) => { fs.writeFileSync(`${dir}/${name}`, s); out[name] = s.length; };
put('loxley-emblem-colour.svg', svg(E2.emblem('color', { id: 'e' }), E2.W, E2.H, 'Loxley Forest emblem, colour'));
put('loxley-emblem-one-colour-forest.svg', svg(E2.emblem('knock', { id: 'e', ink: C.deep }), E2.W, E2.H, 'Loxley Forest emblem, one colour, forest'));
put('loxley-emblem-gold-lines.svg', svg(E2.emblem('lines', { id: 'e', ink: C.gold }), E2.W, E2.H, 'Loxley Forest emblem, gold lines only'));
for (const [name, o] of [
  ['loxley-stacked-on-dark.svg', LK.stacked('dark', { id: 's' })],
  ['loxley-stacked-on-light.svg', LK.stacked('light', { id: 's' })],
  ['loxley-horizontal-on-dark.svg', LK.horizontal('dark', { id: 'h' })],
  ['loxley-horizontal-on-light.svg', LK.horizontal('light', { id: 'h' })],
  ['loxley-wordmark-on-dark.svg', LK.wordOnly('dark', { id: 'w' })],
  ['loxley-wordmark-on-light.svg', LK.wordOnly('light', { id: 'w' })],
  ['loxley-icon.svg', LK.icon({ id: 'i' })],
  ['loxley-favicon.svg', LK.icon({ id: 'f', rx: 112 })],
]) put(name, svg(o.inner, o.w, o.h, 'Loxley Forest'));
console.log(out);
