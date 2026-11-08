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
  // The button keeps clear of the words (the audit, 2026-11-08): it steps aside while a text block runs
  // through the band at the foot of the screen where it sits. textInBand: is any text there now?
  const TEXT = 'main :is(p, li, dd, dt, h1, h2, h3, h4, blockquote, figcaption, label, summary, td, th, a, span, b, button)';
  // The page's clear stretches: scroll positions past the first screen where no words run through the band and no
  // other Book button is on screen, measured by geometry in 8 px steps, as runs [start, length]. Also the shown share.
  const stretches = (page) => page.evaluate(async (sel) => {
    const f = document.querySelector('.book-fab'), band = () => innerHeight - (f.offsetHeight + 32);
    const has = () => [...document.querySelectorAll(sel)].some((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > band() && r.top < innerHeight; });
    const other = () => [...document.querySelectorAll('main a.btn--primary[href="/book"], main a.lf-btn[href="#book"], main #book')].some((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    const go = (y) => { if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); };
    const max = document.documentElement.scrollHeight - innerHeight, runs = [];
    let clear = 0, total = 0, run = null;
    for (let y = Math.round(innerHeight * 0.6) + 8; y < max; y += 8) {
      go(y);
      const ok = !has() && !other();
      total++; if (ok) clear++;
      if (ok && !run) run = [y, 0];
      if (ok) run[1] += 8;
      if (!ok && run) { runs.push(run); run = null; }
    }
    if (run) runs.push(run);
    go(0);
    return { runs, share: total ? Math.round((clear / total) * 100) : 0 };
  }, TEXT);
  const fabHidden = (page) => page.evaluate(() => document.querySelector('.book-fab').classList.contains('is-hidden'));
  const textInBand = (page) => page.evaluate((sel) => { const f = document.querySelector('.book-fab'); const band = innerHeight - (f.offsetHeight + 32);
    return [...document.querySelectorAll(sel)].some((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > band && r.top < innerHeight; }); }, TEXT);
  // scroll until a text block sits in the band (over = true) or the band is clear of text (over = false), past the first screen
  // (a clear spot also has no other Book button on screen, which hides the button too)
  const scrollUntil = (page, over) => page.evaluate(async ([sel, over]) => {
    const f = document.querySelector('.book-fab'), band = () => innerHeight - (f.offsetHeight + 32);
    const has = () => [...document.querySelectorAll(sel)].some((el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > band() && r.top < innerHeight; });
    const other = () => [...document.querySelectorAll('main a.btn--primary[href="/book"], main a.lf-btn[href="#book"], main #book')].some((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = Math.round(innerHeight * 0.8); y < max; y += 24) {
      if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (over ? has() : (!has() && !other())) return y;
    }
    return -1;
  }, [TEXT, over]);
  // The hero's pause button (the audit, 2026-11-08): hidden until the film is playing; an iPhone never plays it.
  const pauseState = (page) => page.evaluate(() => { const b = document.querySelector('.lf-hero__pause'); if (!b) return null; return { hidden: b.hidden, display: getComputedStyle(b).display, playing: !!document.querySelector('.hero__video.is-playing') }; });

  console.log('off (INQUIRE_FAB false), a phone');
  {
    const { ctx, page } = await visitor(false, true);
    await page.goto(base + '/elopements', { waitUntil: 'load' }); await page.waitForTimeout(400);
    await scrollUntil(page, false); await page.waitForTimeout(700);
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
    // the button shows after the first screen, as on every page (global.js keeps it hidden over the hero), where no text runs under it
    await scrollUntil(page, false); await page.waitForTimeout(700);
    f = await fab(page);
    check(f && f.shown && f.onScreen && !f.away, 'and is on screen once the reader is past the first screen, the band clear: ' + JSON.stringify(f));
    // the guest's own path: a tap, which the site's anchor handler turns into its own smooth scroll (the address bar does not change)
    await page.tap('.book-fab'); await page.waitForTimeout(1500);
    const landed = await page.evaluate(() => { const r = document.getElementById('inquiry').getBoundingClientRect(); return r.top <= 120 && r.bottom > 0; });
    check(landed, 'a tap lands on the form');
    f = await fab(page);
    check(f && f.away, 'and the button steps aside while the form is on screen');
    // back up the page to a clear spot (the smooth-scroll library has the wheel once it has scrolled)
    await scrollUntil(page, false); await page.waitForTimeout(900);
    f = await fab(page);
    check(f && !f.away && f.shown, 'and returns when the form has gone');
    // clear of the words: over a text block it steps aside; over a photograph or a gap it is back
    let y = await scrollUntil(page, true); await page.waitForTimeout(500);
    f = await fab(page);
    check(y > 0 && await textInBand(page) && f && !f.shown, 'a text block under the button\'s band on /elopements: it steps aside (scrollY ' + y + ')');
    y = await scrollUntil(page, false); await page.waitForTimeout(500);
    f = await fab(page);
    check(y > 0 && !(await textInBand(page)) && f && f.shown, 'the band clear of text: the button is back (scrollY ' + y + ')');
    // the Critic's three (2026-11-08): no blink through a short gap, no unhide on an address bar's resize, and the shown share said
    const st = await stretches(page);
    const short = st.runs.filter((r) => r[1] <= 120), long = st.runs.filter((r) => r[1] >= 400);
    console.log('       /elopements: the band is clear on ' + st.share + '% of the scroll, in ' + st.runs.length + ' stretches (' + short.length + ' of 120 px or less)');
    if (short.length) {
      // a flick through the shortest gap: three steps 50 ms apart; the button must stay hidden throughout
      const gap = short.sort((a, b) => a[1] - b[1])[0];
      const blinked = await page.evaluate(async ([y0, len]) => {
        const f = document.querySelector('.book-fab'), go = (y) => { if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); };
        go(y0 - 40); await new Promise((r) => setTimeout(r, 400));
        let shown = false;
        for (const y of [y0, y0 + len / 2, y0 + len, y0 + len + 40]) { go(y); await new Promise((r) => setTimeout(r, 50)); if (!f.classList.contains('is-hidden')) shown = true; }
        return shown;
      }, gap);
      check(!blinked, 'a flick through a ' + gap[1] + ' px gap in the words: the button never blinks on');
    }
    if (long.length) {
      await page.evaluate((y) => { if (window.lfLenis) window.lfLenis.scrollTo(y + 100, { immediate: true }); else window.scrollTo(0, y + 100); }, long[0][0]);
      const at80 = await page.waitForTimeout(80).then(() => fabHidden(page));
      await page.waitForTimeout(500);
      check(at80 && !(await fabHidden(page)), 'a long clear stretch: still hidden after 80 ms, shown once the way has been clear a moment');
      // the address bar collapsing mid-scroll: a taller screen and a scroll in the same breath never unhide it over words
      y = await scrollUntil(page, true); await page.waitForTimeout(400);
      const before = await fabHidden(page);
      await page.setViewportSize({ width: 390, height: 844 + 160 });
      const during = await page.evaluate(() => { window.dispatchEvent(new Event('scroll')); return document.querySelector('.book-fab').classList.contains('is-hidden'); });
      await page.waitForTimeout(400);
      const after = await fabHidden(page) && await textInBand(page);
      await page.setViewportSize({ width: 390, height: 844 });
      check(before && during && after, 'the screen grows by an address bar over words: hidden before, in the same breath, and after the observer re-arms');
    }
    await page.goto(base + '/book', { waitUntil: 'load' }); await page.waitForTimeout(300);
    f = await fab(page);
    check(f && f.text === 'Book your dates' && f.href === '#book', '/book keeps "Book your dates" to its own calendar');
    await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(300);
    f = await fab(page);
    check(f && f.text === 'Book your dates', 'the home page keeps "Book your dates"');
    y = await scrollUntil(page, true); await page.waitForTimeout(500);
    f = await fab(page);
    check(y > 0 && f && !f.shown, 'a text block under the band on the home page: it steps aside (scrollY ' + y + ')');
    y = await scrollUntil(page, false); await page.waitForTimeout(500);
    f = await fab(page);
    check(y > 0 && f && f.shown, 'the home page\'s band clear of text: the button is back (scrollY ' + y + ')');
    const sh = await stretches(page);
    console.log('       the home page: the band is clear on ' + sh.share + '% of the scroll, in ' + sh.runs.length + ' stretches');
    // this browser's phone reports a fast connection, so the film may play here where an iPhone's never does:
    // hidden means not drawn, shown only while playing, and the hidden attribute alone must hide it
    const ps = await pauseState(page);
    check(ps && (ps.playing ? !ps.hidden && ps.display !== 'none' : ps.hidden && ps.display === 'none'), 'the hero\'s pause button on a phone: drawn only while the film plays (playing ' + (ps && ps.playing) + ', display ' + (ps && ps.display) + ')');
    const forced = await page.evaluate(() => { const b = document.querySelector('.lf-hero__pause'); b.hidden = true; const d = getComputedStyle(b).display; return d; });
    check(forced === 'none', 'the hidden attribute alone hides it (an iPhone\'s case, where "playing" never comes): display ' + forced);
    await ctx.close();
    const d = await visitor(true, false);
    await d.page.goto(base + '/elopements', { waitUntil: 'load' }); await d.page.waitForTimeout(300);
    f = await fab(d.page);
    check(f && !f.shown, 'on a desktop the button is not shown, as before');
    await d.page.goto(base + '/', { waitUntil: 'load' }); await d.page.waitForTimeout(300);
    const pd = await pauseState(d.page);
    check(pd && (pd.playing ? !pd.hidden && pd.display !== 'none' : pd.hidden && pd.display === 'none'), 'on a desk the pause button shows only once the film plays (playing ' + (pd && pd.playing) + ', display ' + (pd && pd.display) + ')');
    // and "playing" is what unhides it: fire the event on the video and read the button
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
