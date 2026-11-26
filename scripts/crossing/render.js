// node render.js out.mp4 seconds [clean]
const { chromium } = require('../logo/node_modules/playwright-core');
const { spawn } = require('child_process');
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
(async () => {
  const [, , out, secs, clean] = process.argv, fps = 30;
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  pg.on('pageerror', (e) => console.log('ERR', e.message));
  await pg.goto('file://' + __dirname + '/reel.html' + (clean ? '#clean' : ''));
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(400);
  if (clean) await pg.evaluate(() => document.body.classList.add('clean'));
  const ff = spawn(process.env.HOME + '/bin/ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out]);
  const N = Math.round(+secs * fps);
  for (let i = 0; i < N; i++) {
    await pg.evaluate((t) => window.seek(t), i / fps);
    const buf = await pg.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(out, i, '/', N);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await b.close();
  console.log('done', out);
})();
