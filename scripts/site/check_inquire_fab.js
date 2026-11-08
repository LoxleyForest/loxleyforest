#!/usr/bin/env node
/* Checks the elopement page's fixed button on a phone (js/global.js INQUIRE_FAB) in a real browser,
   on a local copy of the site, in both states of its switch.

   Run from the repo:  node scripts/site/check_inquire_fab.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine; every outside request is refused. The check reads the shipped value
   of INQUIRE_FAB, says which it is, and serves js/global.js in each state in turn.

   It proves: off, /elopements keeps "Book your dates" to /book on a phone, as every page; on,
   the one fixed button on /elopements reads "Inquire about your date" (the acorn kept), points at
   #inquiry, is on screen once the reader is past the first screen (as every page's button), a tap
   lands on the form, the button steps aside while the form is on screen and returns above it;
   /book and the home page keep their button either way; on a desktop the button is not shown. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

let chromium;
for (const p of [process.env.PLAYWRIGHT_CORE, path.join(__dirname, '..', 'logo', 'node_modules', 'playwright-core'), 'playwright-core']) {
  if (!p) continue;
  try { chromium = require(p).chromium; break; } catch (e) {}
}
if (!chromium) { console.error('playwright-core not found (set PLAYWRIGHT_CORE)'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..', '..');
const EXE = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const SCRIPT = fs.readFileSync(path.join(ROOT, 'js', 'global.js'), 'utf8');
const SHIPPED = (SCRIPT.match(/var INQUIRE_FAB = (true|false);/) || [])[1];
const withSwitch = (on) => SCRIPT.replace(/var INQUIRE_FAB = (true|false);/, 'var INQUIRE_FAB = ' + on + ';');

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/') p = '/index.html';
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  check((SCRIPT.match(/var INQUIRE_FAB = (true|false);/g) || []).length === 1 && SHIPPED, 'the switch is one line; shipped INQUIRE_FAB = ' + SHIPPED);

  async function visitor(on, phone) {
    const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.origin !== base) return route.abort();
      if (u.pathname === '/js/global.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: withSwitch(on) });
      return route.continue();
    });
    return { ctx, page: await ctx.newPage() };
  }
  const fab = (page) => page.evaluate(() => { const f = document.querySelector('.book-fab'); if (!f) return null; const r = f.getBoundingClientRect(); const cs = getComputedStyle(f);
    return { text: f.textContent.trim(), href: f.getAttribute('href'), icon: !!f.querySelector('svg'), shown: cs.display !== 'none' && cs.opacity !== '0', away: f.classList.contains('is-away'), onScreen: r.top >= 0 && r.bottom <= innerHeight }; });

  console.log('off (INQUIRE_FAB false), a phone');
  {
    const { ctx, page } = await visitor(false, true);
    await page.goto(base + '/elopements', { waitUntil: 'load' }); await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, Math.round(innerHeight * 1.6))); await page.waitForTimeout(700);
    const f = await fab(page);
    check(f && f.text === 'Book your dates' && f.href === '/book' && f.shown && f.icon, '/elopements keeps "Book your dates" to /book, with its acorn: ' + JSON.stringify(f));
    await ctx.close();
  }

  console.log('on (INQUIRE_FAB true), a phone');
  {
    const { ctx, page } = await visitor(true, true);
    await page.goto(base + '/elopements', { waitUntil: 'load' }); await page.waitForTimeout(400);
    let f = await fab(page);
    check(f && f.text === 'Inquire about your date' && f.href === '#inquiry' && f.icon, 'the one fixed button reads "Inquire about your date", keeps its acorn, and points at the form');
    // the button shows after the first screen, as on every page (global.js keeps it hidden over the hero)
    await page.evaluate(() => window.scrollTo(0, Math.round(innerHeight * 1.6))); await page.waitForTimeout(700);
    f = await fab(page);
    check(f && f.shown && f.onScreen && !f.away, 'and is on screen once the reader is past the first screen: ' + JSON.stringify(f));
    // the guest's own path: a tap, which the site's anchor handler turns into its own smooth scroll (the address bar does not change)
    await page.tap('.book-fab'); await page.waitForTimeout(1500);
    const landed = await page.evaluate(() => { const r = document.getElementById('inquiry').getBoundingClientRect(); return r.top <= 120 && r.bottom > 0; });
    check(landed, 'a tap lands on the form');
    f = await fab(page);
    check(f && f.away, 'and the button steps aside while the form is on screen');
    // back up the page the way the smooth-scroll library allows once it has taken the wheel
    await page.evaluate(() => { const y = Math.round(innerHeight * 1.6); if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); }); await page.waitForTimeout(900);
    f = await fab(page);
    check(f && !f.away && f.shown, 'and returns when the form has gone');
    await page.goto(base + '/book', { waitUntil: 'load' }); await page.waitForTimeout(300);
    f = await fab(page);
    check(f && f.text === 'Book your dates' && f.href === '#book', '/book keeps "Book your dates" to its own calendar');
    await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(300);
    f = await fab(page);
    check(f && f.text === 'Book your dates', 'the home page keeps "Book your dates"');
    await ctx.close();
    const d = await visitor(true, false);
    await d.page.goto(base + '/elopements', { waitUntil: 'load' }); await d.page.waitForTimeout(300);
    f = await fab(d.page);
    check(f && !f.shown, 'on a desktop the button is not shown, as before');
    await d.ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_inquire_fab: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
