// Brand kit renders: profile picture, link preview, icon PNGs, email signature.
const fs = require('fs');
const { chromium } = require('playwright-core');
const { execFileSync } = require('child_process');
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const M = 'file://' + __dirname + '/out/masters-min/';
const photo = 'file://' + __dirname + '/out/photo.jpg';
const D = '#1a2e1a', L = '#f7f3ed';
const font = `@font-face{font-family:Mont;src:url(file://${__dirname}/fonts/Montserrat-500.ttf);font-weight:500}`;
const out = __dirname + '/out/kit'; fs.mkdirSync(out, { recursive: true });
const jobs = [
  ['loxley-profile-1080.jpg', 1080, 1080, `<body style="background:${D};display:grid;place-items:center"><img src="${M}loxley-emblem-colour.svg" style="height:840px;transform:translateY(8px)"></body>`],
  ['loxley-share-1200x630.jpg', 1200, 630, `<body style="background:${D};display:grid;grid-template-columns:58% 42%">
    <div style="display:grid;place-items:center"><img src="${M}loxley-stacked-on-dark.svg" style="width:600px"></div>
    <div style="background:url(${photo}) 46% 48%/cover"></div></body>`],
  ['apple-touch-icon.png', 180, 180, `<body style="background:${D}"><img src="${M}loxley-app-icon.svg" style="width:180px;height:180px;display:block"></body>`],
  ['loxley-icon-192.png', 192, 192, `<body style="background:transparent"><img src="${M}loxley-app-icon.svg" style="width:192px;height:192px;display:block"></body>`],
  ['loxley-icon-512.png', 512, 512, `<body style="background:transparent"><img src="${M}loxley-app-icon.svg" style="width:512px;height:512px;display:block"></body>`],
  ['favicon-32.png', 32, 32, `<body style="background:transparent"><img src="${M}loxley-favicon.svg" style="width:32px;height:32px;display:block"></body>`],
  ['loxley-email-signature.png', 1040, 280, `<body style="background:#ffffff;display:grid;place-items:center"><img src="${M}loxley-horizontal-on-light.svg" style="width:1000px"></body>`],
];
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  for (const [name, w, h, body] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const f = __dirname + `/out/kit-${name}.html`;
    fs.writeFileSync(f, `<!doctype html><html><head><style>${font}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}</style></head>${body}</html>`);
    await p.goto('file://' + f, { waitUntil: 'load' }); await p.waitForTimeout(250);
    const isJpg = name.endsWith('.jpg');
    await p.screenshot({ path: `${out}/${name}`, type: isJpg ? 'jpeg' : 'png', quality: isJpg ? 90 : undefined, omitBackground: !isJpg && body.includes('transparent') });
    await p.close();
  }
  await b.close();
  for (const f of fs.readdirSync(out)) console.log(f, fs.statSync(`${out}/${f}`).size);
})();
