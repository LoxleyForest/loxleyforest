// usage: node render.js page.html out.png W H [t=seconds|-] [scale]
const { chromium } = require('playwright-core');
const path = require('path');
const EXE = process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
(async () => {
  const [, , file, out, W = '1200', H = '1200', t = '-', scale = '1'] = process.argv;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +scale });
  await page.goto('file://' + path.resolve(file) + (t !== '-' ? '#t=' + t : ''));
  await page.evaluate(() => document.fonts.ready);
  if (t !== '-') await page.evaluate((tt) => window.seek && window.seek(+tt), t);
  await page.waitForTimeout(150);
  await page.screenshot({ path: out });
  await browser.close();
})();
