#!/usr/bin/env node
/* Checks the phone's one fixed button (js/global.js: "Book your dates", and on /elopements with
   INQUIRE_FAB "Inquire about your date") in a real browser, on a local copy of the site, in both
   states of its switch; and the home hero's pause button.

   Run from the repo:  node scripts/site/check_inquire_fab.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine; every outside request is refused. The check reads the shipped value
   of INQUIRE_FAB, says which it is, and serves js/global.js in each state in turn.

   It proves: the button keeps the pattern guests know (the Chief, 2026-11-08): hidden over the first
   screen, hidden while the thumb scrolls down, back on a scroll up and at the page's end, on
   /elopements and on the home page; off, /elopements keeps "Book your dates" to /book, as every
   page; on, the one fixed button on /elopements reads "Inquire about your date" (the acorn kept),
   points at #inquiry, a tap lands on the form, the button steps aside while the form is on screen
   and returns above it; /book and the home page keep their button either way; on a desk the button
   is not shown. And the hero's pause button is drawn only while the film plays: the hidden attribute
   alone hides it, and "playing" unhides it. */
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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
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
    return { text: f.textContent.trim(), href: f.getAttribute('href'), icon: !!f.querySelector('svg'), shown: cs.display !== 'none' && cs.opacity !== '0', away: f.classList.contains('is-away'), hidden: f.classList.contains('is-hidden'), onScreen: r.top >= 0 && r.bottom <= innerHeight }; });
  // a scroll as the page scrolls (the smooth-scroll library has the wheel once it is up)
  const go = (page, y) => page.evaluate((y) => { if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); }, y).then(() => page.waitForTimeout(350));
  const pageEnd = (page) => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  // a spot past the first screen where no other Book button is on screen for 300 px of scroll (the
  // button rightly hides while one is; on the home page the calendar sits one screen down once the
  // bridge is the poster), found by geometry
  const clearSpot = (page) => page.evaluate(async () => {
    const other = () => [...document.querySelectorAll('main a.btn--primary[href="/book"], main a.lf-btn[href="#book"], main #book')].some((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    const go = (y) => { if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); };
    const tick = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = Math.round(innerHeight * 1.2); y < max - 400; y += 24) {
      go(y); await tick(); if (other()) continue;
      go(y + 300); await tick(); if (other()) continue;
      go(0); await tick(); return y;
    }
    go(0); await tick(); return Math.round(innerHeight * 1.6);
  });
  // the pattern: down hides, up shows, the end shows, the first screen hides
  async function pattern(page, where) {
    const y0 = await clearSpot(page);
    await go(page, 0); await go(page, y0); await go(page, y0 + 180);
    let f = await fab(page);
    check(f && f.hidden && !f.shown, where + ': scrolling down past the first screen, the button is hidden (at ' + (y0 + 180) + ')');
    await go(page, y0 + 90);
    f = await fab(page);
    check(f && !f.hidden && f.shown && f.onScreen, where + ': a scroll up brings it back');
    await go(page, y0 + 300);
    f = await fab(page);
    check(f && f.hidden, where + ': down again, hidden again');
    await go(page, await pageEnd(page));
    f = await fab(page);
    check(f && !f.hidden && f.shown, where + ': at the page\'s end it shows, however it was reached');
    await go(page, 200);
    f = await fab(page);
    check(f && f.hidden, where + ': over the first screen it stays hidden');
  }
  // bring the button into view: a little down at a clear spot, then a little up
  async function reveal(page) { const y0 = await clearSpot(page); await go(page, y0 + 160); await go(page, y0 + 80); }
  // The hero's pause button (the audit, 2026-11-08): hidden until the film is playing; an iPhone never plays it.
  const pauseState = (page) => page.evaluate(() => { const b = document.querySelector('.lf-hero__pause'); if (!b) return null; return { hidden: b.hidden, display: getComputedStyle(b).display, playing: !!document.querySelector('.hero__video.is-playing') }; });

  console.log('off (INQUIRE_FAB false), a phone');
  {
    const { ctx, page } = await visitor(false, true);
    await page.goto(base + '/elopements', { waitUntil: 'load' }); await page.waitForTimeout(400);
    await reveal(page);
    const f = await fab(page);
    check(f && f.text === 'Book your dates' && f.href === '/book' && f.shown && f.icon, '/elopements keeps "Book your dates" to /book, with its acorn: ' + JSON.stringify(f));
    await pattern(page, '/elopements');
    await ctx.close();
  }

  console.log('on (INQUIRE_FAB true), a phone');
  {
    const { ctx, page } = await visitor(true, true);
    await page.goto(base + '/elopements', { waitUntil: 'load' }); await page.waitForTimeout(400);
    let f = await fab(page);
    check(f && f.text === 'Inquire about your date' && f.href === '#inquiry' && f.icon, 'the one fixed button reads "Inquire about your date", keeps its acorn, and points at the form');
    await reveal(page);
    f = await fab(page);
    check(f && f.shown && f.onScreen && !f.away, 'and is on screen once past the first screen, on a scroll up: ' + JSON.stringify(f));
    await pattern(page, '/elopements (on)');
    await reveal(page);
    // the guest's own path: a tap, which the site's anchor handler turns into its own smooth scroll (the address bar does not change)
    await page.tap('.book-fab'); await page.waitForTimeout(1500);
    const landed = await page.evaluate(() => { const r = document.getElementById('inquiry').getBoundingClientRect(); return r.top <= 120 && r.bottom > 0; });
    check(landed, 'a tap lands on the form');
    f = await fab(page);
    check(f && f.away, 'and the button steps aside while the form is on screen');
    await reveal(page);
    f = await fab(page);
    check(f && !f.away && f.shown, 'and returns when the form has gone');
    await page.goto(base + '/book', { waitUntil: 'load' }); await page.waitForTimeout(300);
    f = await fab(page);
    check(f && f.text === 'Book your dates' && f.href === '#book', '/book keeps "Book your dates" to its own calendar');
    await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(400);
    f = await fab(page);
    check(f && f.text === 'Book your dates', 'the home page keeps "Book your dates"');
    await pattern(page, 'the home page');
    // this browser's phone reports a fast connection, so the film may play here where an iPhone's never does:
    // hidden means not drawn, shown only while playing, and the hidden attribute alone must hide it
    const ps = await pauseState(page);
    check(ps && (ps.playing ? !ps.hidden && ps.display !== 'none' : ps.hidden && ps.display === 'none'), 'the hero\'s pause button on a phone: drawn only while the film plays (playing ' + (ps && ps.playing) + ', display ' + (ps && ps.display) + ')');
    const forced = await page.evaluate(() => { const b = document.querySelector('.lf-hero__pause'); b.hidden = true; return getComputedStyle(b).display; });
    check(forced === 'none', 'the hidden attribute alone hides it (an iPhone\'s case, where "playing" never comes): display ' + forced);
    await ctx.close();
    const d = await visitor(true, false);
    await d.page.goto(base + '/elopements', { waitUntil: 'load' }); await d.page.waitForTimeout(300);
    f = await fab(d.page);
    check(f && !f.shown, 'on a desktop the button is not shown, as before');
    await d.page.goto(base + '/', { waitUntil: 'load' }); await d.page.waitForTimeout(300);
    const pd = await pauseState(d.page);
    check(pd && (pd.playing ? !pd.hidden && pd.display !== 'none' : pd.hidden && pd.display === 'none'), 'on a desk the pause button shows only once the film plays (playing ' + (pd && pd.playing) + ', display ' + (pd && pd.display) + ')');
    const unhid = await d.page.evaluate(() => { const v = document.querySelector('.hero__video'), b = document.querySelector('.lf-hero__pause'); if (!v || !b) return null; v.dispatchEvent(new Event('playing')); return !b.hidden && getComputedStyle(b).display !== 'none'; });
    check(unhid === true, 'the film\'s "playing" unhides it, and it is drawn then');
    await d.ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_inquire_fab: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
