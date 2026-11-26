// Render a stage page to H.264 by seeking each frame and piping screenshots to ffmpeg.
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
(async () => {
  const [, , file, out, W, H, secs = '10', fps = '30'] = process.argv;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  await page.goto('file://' + path.resolve(file));
  await page.evaluate(() => document.fonts.ready);
  const ff = spawn(process.env.HOME + '/bin/ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', fps, '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-tune', 'animation', '-movflags', '+faststart', out]);
  const N = Math.round(+secs * +fps);
  for (let i = 0; i < N; i++) {
    await page.evaluate((t) => window.seek(t), i / +fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(out, i, '/', N);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();
