const fs = require('fs');
const { chromium } = require('playwright-core');
const { execFileSync } = require('child_process');
const LK = require('./lockups.js');
const E2 = require('./emblem2.js');
const { C } = LK;
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const M = 'file://' + __dirname + '/out/masters-min/';
const photo = 'file://' + __dirname + '/out/photo.jpg';
const fontCss = `@font-face{font-family:Mont;src:url(file://${__dirname}/fonts/Montserrat-500.ttf);font-weight:500}`;
const tiles = {
  'emblem-large': [900, 1200, `<body style="background:${C.deep};display:grid;place-items:center"><img src="${M}loxley-emblem-colour.svg" style="height:1120px"></body>`],
  'stacked-light': [1200, 900, `<body style="background:${C.linen};display:grid;place-items:center"><img src="${M}loxley-stacked-on-light.svg" style="width:900px"></body>`],
  'horizontal-dark': [1600, 500, `<body style="background:${C.deep};display:grid;place-items:center"><img src="${M}loxley-horizontal-on-dark.svg" style="width:1380px"></body>`],
  'horizontal-light': [1600, 500, `<body style="background:${C.linen};display:grid;place-items:center"><img src="${M}loxley-horizontal-on-light.svg" style="width:1380px"></body>`],
  'wordmark-dark': [1600, 360, `<body style="background:${C.deep};display:grid;place-items:center"><img src="${M}loxley-wordmark-on-dark.svg" style="width:1300px"></body>`],
  'knock-cream': [900, 1100, `<body style="background:${C.linen};display:grid;place-items:center"><img src="${M}loxley-emblem-one-colour-forest.svg" style="height:960px"></body>`],
  'gold-lines': [900, 1100, `<body style="background:${C.deep};display:grid;place-items:center"><img src="${M}loxley-emblem-gold-lines.svg" style="height:960px"></body>`],
  'header-mock': [1600, 900, `<body style="background:#000"><div style="position:absolute;inset:0;background:url(${photo}) center 58%/cover"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,29,17,.82) 0%,rgba(16,29,17,.15) 26%,rgba(16,29,17,0) 50%,rgba(16,29,17,.75) 100%)"></div>
    <div style="position:absolute;left:56px;right:56px;top:34px;display:flex;justify-content:space-between;align-items:center"><img src="${M}loxley-horizontal-on-dark.svg" style="height:110px">
    <div style="font:500 17px Mont;letter-spacing:.22em;text-transform:uppercase;background:${C.gold};color:${C.deep};padding:20px 30px">Book your dates</div></div>
    <div style="position:absolute;left:64px;bottom:70px;color:${C.linen};font:500 19px Mont;letter-spacing:.34em;text-transform:uppercase">Dahlonega, Georgia · 1,470 Feet</div></body>`],
  'card-mock': [1600, 1000, `<body style="background:#22382a;display:grid;place-items:center">
    <div style="width:620px;height:860px;background:${C.linen};box-shadow:0 40px 80px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;transform:rotate(-2deg)">
    <img src="${M}loxley-emblem-one-colour-forest.svg" style="height:470px"><img src="${M}loxley-wordmark-on-light.svg" style="width:520px">
    <div style="font:500 13px Mont;letter-spacing:.42em;color:${C.forest};text-transform:uppercase">Dahlonega · Georgia</div></div></body>`],
};
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  for (const [name, [w, h, body]] of Object.entries(tiles)) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const f = __dirname + `/out/tile-${name}.html`;
    fs.writeFileSync(f, `<!doctype html><html><head><style>${fontCss}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}</style></head>${body}</html>`);
    await page.goto('file://' + f, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const png = __dirname + `/out/page/${name}.png`;
    await page.screenshot({ path: png });
    execFileSync(process.env.HOME + '/bin/ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', '86', png.replace('.png', '.webp')]);
    fs.unlinkSync(png);
    await page.close();
  }
  await browser.close();
  for (const f of fs.readdirSync(__dirname + '/out/page')) console.log(f, fs.statSync(__dirname + '/out/page/' + f).size);
})();
