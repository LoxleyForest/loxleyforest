#!/usr/bin/env node
/* Checks the talk-to-Mick card (js/talk.js) in a real browser, on a local copy of the site.

   Run from the repo:  node scripts/site/check_talk.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set NODE_PATH) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine: the booking API (book.loxleyforest.com) is answered here with
   made-up nights and a made-up quote, the beacon is recorded and refused for card_* and hold_*
   as the engine does today ("unknown step"), POST /v1/marker and POST /v1/hold are answered as
   each check needs (taken, refused, missing, unreachable) and recorded, as is POST /v1/checkout
   (then refused), and every other outside request gets an empty answer. Google Fonts load, so
   text measures as it does live. Time runs on Playwright's clock. The email typed is made up
   (example.test).

   The card's email on /book runs in the mode js/talk.js ships with (CARD_EMAIL 'marker'); the
   'hold' checks serve the same file with CARD_EMAIL set to 'hold', and say so. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

let chromium;
for (const p of [process.env.PLAYWRIGHT_CORE, path.join(__dirname, '..', 'logo', 'node_modules', 'playwright-core'), 'playwright-core']) {
  if (!p) continue;
  try { chromium = require(p).chromium; break; } catch (e) {}
}
if (!chromium) { console.error('playwright-core not found (set NODE_PATH or PLAYWRIGHT_CORE)'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..', '..');
const EXE = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const SHOTS = process.env.SHOTS || '';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/') p = '/index.html';
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('<!doctype html><title>404</title>'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

// ---- made-up booking data
function day(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const NIGHTS = { nights: Array.from({ length: 150 }, (_, i) => ({ night: day(i + 1), rate_cents: 39900, min_stay: 2 })) };
const CI = day(14), CO = day(16);
const QUOTE = { quote: { nights: 2, total_cents: 98765, lines: [{ label: '2 nights', cents: 79800 }, { label: 'Cleaning and taxes', cents: 18965 }] },
  modes: ['deposit', 'full'], promise: { retainer_pct: 25, balance_days: 30 },
  plans: { deposit: [{ amount_cents: 24691 }, { amount_cents: 74074, due_on: day(-30 + 14 + 30) }], full: [{ amount_cents: 98765 }] } };
const AGREEMENT = { version: 'check', text: '# The stay agreement\n\nA made-up agreement for the check.\n\n**I accept the release of liability.**\n' };
// 01:10 UTC on Monday, November 2, 2026 is 8:10 PM Eastern (standard time) on Sunday, November 1.
const HELD_UNTIL = '2026-11-02T01:10:00Z';
const HELD_LINE = 'Held until Sunday 8:10 PM. The link to book them is in your email.';
const TEST_EMAIL = 'guest@example.test';
// The engine's hold (loxley-rescue, 2026-10-24): POST /v1/hold {visit, unit, check_in, check_out,
// guests, email}; guests only once chosen, and on the dates step they are not.
const HOLD_FIELDS = 'check_in,check_out,email,unit,visit';
const MARKER_START = 'Your trail marker is on its way. Check your inbox for ', MARKER_END = ' and the link straight back to them.';

let failures = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const consoleErrors = [];   // script errors and anything else the page logs as an error
  const refusals = [];       // the browser's own network line for a refused card_* beacon
  const mockedLines = [];    // the browser's own network line for a hold or checkout this check refuses on purpose
  const talkSrc = fs.readFileSync(path.join(ROOT, 'js/talk.js'), 'utf8');

  async function open(opts) {
    const phone = opts.phone;
    const ctx = await browser.newContext(phone
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' }
      : { viewport: { width: 1280, height: 800 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
    const beacons = [], holds = [], markers = [], checkouts = [], avail = [], quotes = [];
    if (opts.cardSeen) await ctx.addInitScript(() => { try { sessionStorage.setItem('lf_talk', 'shown'); } catch (e) {} });
    await ctx.route('**/*', async (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === '127.0.0.1') {
        if (u.pathname === '/proposals') {
          // No proposals page on main yet: the elopements page standing in at /proposals, so the
          // script's /proposals rule is proven as it will run there.
          const html = fs.readFileSync(path.join(ROOT, 'elopements.html'), 'utf8').replace('data-lf-path="/elopements"', 'data-lf-path="/proposals"');
          return route.fulfill({ contentType: 'text/html', body: html });
        }
        if (u.pathname === '/js/talk.js') {
          // The real file carries Mick's booking links; most checks run with none, the
          // call-link check with a stand-in, so both shapes of the card are proven.
          let src = talkSrc.replace("var href = link(CALL_LINKS[PATH] || '');", "var href = link('" + (opts.callLink || '') + "');");
          if (src === talkSrc) throw new Error('check_talk: the call-link line in js/talk.js moved');
          if (!src.includes("var CARD_EMAIL = 'marker';")) throw new Error("check_talk: js/talk.js no longer ships CARD_EMAIL = 'marker'");
          if (opts.mode === 'hold') src = src.replace("var CARD_EMAIL = 'marker';", "var CARD_EMAIL = 'hold';");
          return route.fulfill({ contentType: 'text/javascript', body: src });
        }
        return route.continue();
      }
      if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o, s) => route.fulfill({ status: s || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) });
        if (u.pathname === '/v1/funnel') {
          let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
          beacons.push(b);
          return /^(card|hold|marker)_/.test(b.step) && !opts.engineLanded ? json({ error: 'unknown step' }, 400) : json({ ok: true });
        }
        if (u.pathname === '/v1/availability') { avail.push(u.search); return json(NIGHTS); }
        if (u.pathname === '/v1/quote') { quotes.push(u.search); if (opts.quoteGate) await opts.quoteGate; return json(QUOTE); }
        if (u.pathname === '/v1/marker' && route.request().method() === 'POST') {
          let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
          markers.push(b);
          const m = opts.marker || 'ok';
          if (m === 'ok') return json({ ok: true, check_in: b.check_in, check_out: b.check_out, total_cents: 98765 });
          if (m === 'net') return route.abort('failed');
          return json({ error: 'refused in this check' }, m);
        }
        if (u.pathname === '/v1/hold' && route.request().method() === 'POST') {
          let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
          holds.push(b);
          const h = opts.hold || 404;
          if (h === 'ok') return json({ held: true, held_until: HELD_UNTIL, total_cents: b.total_cents, hold: 'tok-held-1', link: 'https://loxleyforest.com/book?checkIn=' + CI + '&checkOut=' + CO + '#hold=tok-held-1' });
          if (h === 'net') return route.abort('failed');
          if (h === 'taken' || h === 'already_held') return json({ held: false, reason: h }, 409);
          if (h === 'not-held') return json({ held: false });
          if (h === 410) return json({ error: 'Hold my dates has been retired.' }, 410);
          return json({ error: 'refused in this check' }, h);
        }
        if (u.pathname === '/v1/checkout' && route.request().method() === 'POST') {
          let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
          checkouts.push(b);
          return json({ error: 'not in this check' }, 503);
        }
        if (u.pathname === '/v1/agreement') return json(AGREEMENT);
        if (u.pathname === '/v1/lead') return json({ ok: true });
        return json({ error: 'not found' }, 404);
      }
      // Tag Manager, analytics, Stripe and the rest: an empty answer, never the real thing.
      return route.fulfill({ status: 200, contentType: /\.js|gtm|gtag/.test(u.pathname) ? 'text/javascript' : 'text/plain', body: '' });
    });
    const page = await ctx.newPage();
    // A 4xx answer to a beacon is written to the console by Chrome itself ("Failed to load
    // resource"), whatever the page does; nothing in the page sees it or can quiet it. Those lines,
    // from /v1/funnel only, are counted apart: they end when the engine accepts card_* steps.
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const from = (m.location() && m.location().url) || '';
      if (/^https:\/\/book\.loxleyforest\.com\/v1\/funnel$/.test(from) && /status of 400/.test(m.text())) refusals.push(opts.name);
      else if (/^https:\/\/book\.loxleyforest\.com\/v1\/(hold|marker|checkout)$/.test(from) && /Failed to load resource/.test(m.text())) mockedLines.push(opts.name);
      else consoleErrors.push(opts.name + ': ' + m.text() + (from ? ' (' + from + ')' : ''));
    });
    page.on('pageerror', (e) => consoleErrors.push(opts.name + ': ' + e.message));
    await page.clock.install();
    return { ctx, page, beacons, holds, markers, checkouts, avail, quotes };
  }

  const card = (page) => page.$('#lf-talk');
  const shown = async (page) => !!(await page.$('#lf-talk.is-in'));
  async function settle(page) { await page.clock.runFor(50); await page.waitForTimeout(400); }
  async function overflow(page) { return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); }
  // A beacon reaches the mock a moment after the click: wait for it, up to 3 s.
  async function until(fn) { for (let i = 0; i < 30 && !fn(); i++) await new Promise((r) => setTimeout(r, 100)); return fn(); }
  async function shot(page, name) { if (SHOTS) { await page.waitForTimeout(900); fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name) }); } }
  async function overlapsAny(page, sel) {
    return page.evaluate((sel) => {
      const c = document.getElementById('lf-talk'); if (!c) return false;
      const r = c.getBoundingClientRect();
      return [...document.querySelectorAll(sel)].some((b) => { const g = b.getBoundingClientRect(); return g.height && r.left < g.right && r.right > g.left && r.top < g.bottom && r.bottom > g.top; });
    }, sel);
  }
  async function bookReady(page, url) {
    await page.goto(BASE + url);
    await page.waitForSelector('#gatehouse .gh-cta', { timeout: 10000 });
  }

  // 1. /elopements, phone: 45 s on the page.
  console.log('/elopements, phone 390');
  {
    const { ctx, page, beacons } = await open({ name: 'elopements-phone', phone: true });
    await page.goto(BASE + '/elopements');
    await page.clock.runFor(44000);
    check(!(await card(page)), 'no card at 44 s');
    const before = await page.evaluate(() => [document.documentElement.scrollHeight, document.querySelector('main').getBoundingClientRect().top]);
    await page.clock.runFor(1500); await settle(page);
    check(await shown(page), 'card shown after 45 s');
    const after = await page.evaluate(() => [document.documentElement.scrollHeight, document.querySelector('main').getBoundingClientRect().top]);
    check(before[0] === after[0] && before[1] === after[1], 'no layout shift (page height and main unchanged)');
    check((await overflow(page)) <= 0, 'no horizontal overflow at 390 with the card shown');
    const a11y = await page.evaluate(() => {
      const c = document.getElementById('lf-talk');
      return { role: c.getAttribute('role'), label: document.getElementById(c.getAttribute('aria-labelledby')).textContent,
        desc: document.getElementById(c.getAttribute('aria-describedby')).textContent,
        close: c.querySelector('.lf-talk__x').getAttribute('aria-label'), focused: document.activeElement === c,
        tel: c.querySelector('a[href^="tel:"]').getAttribute('href'), phoneText: c.querySelector('.lf-talk__phone').textContent,
        callBtn: !!c.querySelector('.lf-talk__call'), r: c.getBoundingClientRect().toJSON(),
        hold: !!c.querySelector('.lf-talk__ask, input, form') };
    });
    check(a11y.role === 'dialog' && a11y.label && a11y.desc && a11y.close === 'Close', 'dialog role, heading label, description, labelled close button');
    check(!a11y.hold && a11y.label === 'Rather talk it through?', '/elopements: the card as before, no email, no field');
    check(a11y.focused, 'focus moved to the card');
    check(a11y.tel === 'tel:+17065024823' && /Call or text Mick at 706-502-4823/.test(a11y.phoneText), 'phone line carries the site number');
    check(!a11y.callBtn, 'no call button while the link is empty');
    check(a11y.r.left >= 16 && a11y.r.right <= 374, 'card sits inside the 16 px gutters');
    await until(() => beacons.some((x) => x.step === 'card_shown'));
    const b = beacons.filter((x) => x.step === 'card_shown');
    check(b.length === 1 && b[0].path === '/elopements' && Object.keys(b[0]).sort().join() === 'path,step,visit', 'card_shown beacon: visit, step, path only');
    await shot(page, 'phone-elopements.png');
    // Keyboard: Tab moves through the card.
    await page.keyboard.press('Tab');
    check(await page.evaluate(() => document.activeElement.classList.contains('lf-talk__x')), 'Tab reaches the close button');
    await page.keyboard.press('Tab');
    check(await page.evaluate(() => /^tel:/.test(document.activeElement.getAttribute('href') || '') && !!document.activeElement.closest('#lf-talk')), 'Tab reaches the phone link');
    // The phone link counts a click (the test stops the tel: hand-off, which a headless browser cannot take).
    await page.evaluate(() => document.addEventListener('click', (e) => { if (e.target.closest('a[href^="tel:"]')) e.preventDefault(); }, true));
    await page.tap('#lf-talk .lf-talk__phone a');
    check(await until(() => beacons.filter((x) => x.step === 'card_click').length === 1), 'phone link sends card_click');
    // Tap outside dismisses.
    const spot = await page.evaluate(() => {
      const c = document.getElementById('lf-talk').getBoundingClientRect();
      const p = [...document.querySelectorAll('main p, main h2')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 80 && r.bottom < c.top - 10 && !x.closest('a, button, label, form'); });
      const r = p.getBoundingClientRect(); return [Math.round(r.left + 10), Math.round(r.top + r.height / 2)];
    });
    const url = page.url();
    await page.touchscreen.tap(spot[0], spot[1]);
    await page.clock.runFor(500); await page.waitForTimeout(450);
    check(!(await card(page)) && page.url() === url, 'tap outside dismisses');
    // Once a visit: a reload and another page do not bring it back.
    await page.reload();
    await page.clock.runFor(50000);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.7, behavior: 'instant' }));
    await page.clock.runFor(2000);
    check(!(await card(page)), 'not again on reload (once per visit)');
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.clock.runFor(65000);
    check(!(await card(page)), 'not again on /book in the same visit');
    check(beacons.filter((x) => x.step === 'card_shown').length === 1, 'card_shown sent once in the visit');
    await ctx.close();
  }

  // 2. /elopements, desktop: 60% of the way down; Escape; light and dark sections.
  console.log('/elopements, desktop 1280');
  {
    const { ctx, page } = await open({ name: 'elopements-desk' });
    await page.goto(BASE + '/elopements');
    await page.clock.runFor(3000);
    await page.evaluate(() => window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * 0.3, behavior: 'instant' }));
    await page.clock.runFor(1500);
    check(!(await card(page)), 'no card at 30% down');
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.62 - window.innerHeight + 10, behavior: 'instant' }));
    await page.clock.runFor(1500); await settle(page);
    check(await shown(page), 'card shown at 60% scroll');
    check((await page.evaluate(() => { const r = document.getElementById('lf-talk').getBoundingClientRect(); return [Math.round(r.width), Math.round(innerWidth - r.right), Math.round(innerHeight - r.bottom)]; })).join() === '360,24,24', 'desktop card: 360 px, bottom right');
    // Seen over a light section, then a dark one (the card stays while the page scrolls).
    for (const [sel, name] of [['main .lf-light, main .lf-parch', 'light'], ['main .lf-dark', 'dark']]) {
      await page.evaluate((sel) => { const s = [...document.querySelectorAll(sel)].find((x) => x.offsetHeight > 500) || document.querySelector(sel); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY, behavior: 'instant' }); }, sel);
      await page.clock.runFor(100); await page.waitForTimeout(200);
      check(await shown(page), 'card stays over a ' + name + ' section');
      await shot(page, 'desktop-elopements-' + name + '.png');
    }
    await page.keyboard.press('Escape');
    await page.clock.runFor(500); await page.waitForTimeout(450);
    check(!(await card(page)), 'Escape dismisses');
    await ctx.close();
  }

  // 3. Exit intent on a desktop; never on a phone.
  console.log('exit intent');
  {
    const { ctx, page } = await open({ name: 'exit-desk' });
    await page.goto(BASE + '/elopements');
    await page.clock.runFor(6000);
    await page.mouse.move(640, 400);
    await page.mouse.move(-10, 400, { steps: 4 });
    await page.clock.runFor(1500);
    check(!(await card(page)), 'desktop: pointer leaving by the side does not count');
    await page.mouse.move(640, 300);
    await page.mouse.move(640, 120, { steps: 4 });
    await page.mouse.move(640, -10, { steps: 4 });
    await settle(page);
    check(await shown(page), 'desktop: pointer leaving the top shows the card');
    await page.mouse.move(640, 300);
    await page.click('#lf-talk .lf-talk__x');
    await page.clock.runFor(500); await page.waitForTimeout(450);
    check(!(await card(page)), 'close button dismisses');
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ name: 'exit-phone', phone: true });
    await page.goto(BASE + '/elopements');
    await page.clock.runFor(6000);
    await page.evaluate(() => document.body.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: 100, clientY: -5, relatedTarget: null })));
    await page.clock.runFor(1500);
    check(!(await card(page)), 'phone: no exit-intent card');
    await ctx.close();
  }

  // 4. Writing in the elopements form: the card stands down.
  console.log('/elopements, visitor writing in the inquiry form');
  {
    const { ctx, page } = await open({ name: 'elopements-typing', phone: true });
    await page.goto(BASE + '/elopements');
    const field = await page.$('main form input[type="text"], main form input[type="email"]');
    await field.scrollIntoViewIfNeeded();
    await field.focus();
    await page.keyboard.type('Sa');
    await page.clock.runFor(50000);
    check(!(await card(page)), 'no card at 50 s while writing in the form');
    await page.evaluate(() => document.activeElement.blur());
    await page.clock.runFor(5000);
    check(!(await card(page)), 'still none after leaving the field (they are writing to us)');
    await ctx.close();
  }

  // 5. /book, phone: the all-in total on screen, checkout not begun for 10 s (was 60 s before
  //    the date hold, 2026-10-24).
  console.log('/book, phone 390');
  {
    const { ctx, page, beacons } = await open({ name: 'book-phone', phone: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.clock.runFor(8500);
    check(!(await card(page)), 'no card at 8.5 s with the total on screen');
    await page.clock.runFor(2500); await settle(page);
    check(await shown(page), 'card shown 10 s after the total, checkout not begun');
    check(!!(await page.$('#lf-talk .lf-talk__ask #lf-talk-email')), 'it asks for an email (marker mode): one field');
    check(await until(() => beacons.some((x) => x.step === 'card_shown' && x.path === '/book')), 'card_shown beacon with /book');
    check((await overflow(page)) <= 0, 'no horizontal overflow at 390');
    check(!(await overlapsAny(page, '#gatehouse .gh-cta')), 'card is clear of the checkout button');
    await shot(page, 'phone-book-dates.png');
    // Bring the checkout button to the card's place: the card moves up out of its way.
    await page.evaluate(() => { const b = document.querySelector('#gatehouse .gh-cta'); const r = b.getBoundingClientRect(); window.scrollBy({ top: r.bottom - (innerHeight - 110), behavior: 'instant' }); });
    await page.clock.runFor(100); await page.waitForTimeout(100);
    check(!(await overlapsAny(page, '#gatehouse .gh-cta')), 'checkout button scrolled under it: still clear');
    check(await page.evaluate(() => document.getElementById('lf-talk').classList.contains('is-top')), 'the card moved under the header');
    await shot(page, 'phone-book-dates-cta-low.png');
    await ctx.close();
  }

  // 6. /book: starting checkout before the 10 s cancels the hold's wait.
  {
    const { ctx, page } = await open({ name: 'book-begin', phone: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.clock.runFor(6000);
    await page.click('#gatehouse .gh-cta');
    await page.waitForSelector('#gatehouse .gh-form');
    await page.clock.runFor(30000);
    check(!(await card(page)), 'checkout begun at 6 s: no card at 36 s (idle wait starts over)');
    await ctx.close();
  }

  // 7. /book payment step: 90 s idle; never over the pay button; never while typing.
  console.log('/book payment step');
  {
    const { ctx, page } = await open({ name: 'pay-desk' });
    await page.goto(BASE + `/book?checkIn=${CI}&checkOut=${CO}&step=pay`);
    await page.waitForSelector('#gatehouse .gh-form');
    await page.clock.runFor(85000);
    check(!(await card(page)), 'no card at 85 s idle');
    await page.clock.runFor(7000); await settle(page);
    check(await shown(page), 'desktop: card shown after 90 s idle on the payment step');
    check(!(await overlapsAny(page, '#gatehouse button[type="submit"], #gatehouse .gh-cta')), 'card is clear of the pay button');
    await shot(page, 'desktop-book-pay.png');
    // A Stripe form in place (an empty frame here): the card keeps off its foot.
    await page.evaluate(() => { const f = document.createElement('iframe'); f.style.cssText = 'display:block;width:100%;height:900px;border:0'; document.getElementById('gh-pay').appendChild(f); });
    for (const at of [0.95, 0.75, 0.5]) {
      await page.evaluate((at) => { const f = document.querySelector('#gh-pay iframe').getBoundingClientRect(); window.scrollBy({ top: f.bottom - innerHeight * at, behavior: 'instant' }); }, at);
      await page.clock.runFor(100); await page.waitForTimeout(80);
      const clear = await page.evaluate(() => {
        const c = document.getElementById('lf-talk'); const r = c.getBoundingClientRect(); const f = document.querySelector('#gh-pay iframe').getBoundingClientRect();
        const tail = { top: f.bottom - 320, bottom: f.bottom };
        return getComputedStyle(c).visibility === 'hidden' || !(r.left < f.right && r.right > f.left && r.top < tail.bottom && r.bottom > tail.top);
      });
      check(clear, `Stripe's pay area (last 320 px) at ${Math.round(at * 100)}% of the screen: card clear of it`);
    }
    await page.keyboard.press('Escape');
    await page.clock.runFor(500); await page.waitForTimeout(450);
    check(!(await card(page)), 'Escape dismisses');
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ name: 'pay-phone', phone: true });
    await page.goto(BASE + `/book?checkIn=${CI}&checkOut=${CO}&step=pay`);
    await page.waitForSelector('#gatehouse .gh-form');
    await page.clock.runFor(92000); await settle(page);
    check(await shown(page), 'phone: card shown after 90 s idle on the payment step');
    check(!(await page.$('#lf-talk .lf-talk__ask, #lf-talk input')), 'phone: the pay step card asks no email (it is taken first there)');
    check(!(await overlapsAny(page, '#gatehouse button[type="submit"], #gatehouse .gh-cta')), 'phone: card is clear of the pay button');
    check((await overflow(page)) <= 0, 'phone: no horizontal overflow');
    await shot(page, 'phone-book-pay.png');
    await page.evaluate(() => { const b = document.querySelector('#gatehouse button[type="submit"]'); const r = b.getBoundingClientRect(); window.scrollBy({ top: r.bottom - (innerHeight - 100), behavior: 'instant' }); });
    await page.clock.runFor(100); await page.waitForTimeout(100);
    check(!(await overlapsAny(page, '#gatehouse button[type="submit"]')), 'phone: pay button scrolled to the bottom: card clear of it');
    await shot(page, 'phone-book-pay-button-low.png');
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ name: 'pay-typing', phone: true });
    await page.goto(BASE + `/book?checkIn=${CI}&checkOut=${CO}&step=pay`);
    await page.waitForSelector('#gatehouse .gh-form');
    await page.focus('#gatehouse input[name="first_name"]');
    await page.keyboard.type('S');
    await page.clock.runFor(100000);
    check(!(await card(page)), 'cursor in a field: no card after 100 s');
    await page.evaluate(() => document.activeElement.blur());
    await page.clock.runFor(1500); await settle(page);
    check(await shown(page), 'field left after 90 s idle: card shown');
    await ctx.close();
  }

  // 8. Never on /booked or /manage, even if the script were there.
  console.log('/booked and /manage');
  for (const p of ['/booked', '/manage']) {
    const { ctx, page, beacons } = await open({ name: p, phone: true });
    await page.goto(BASE + p);
    check(!(await page.$('script[src$="talk.js"]')), p + ' does not load the card');
    await page.addScriptTag({ url: BASE + '/js/talk.js' });
    await page.clock.runFor(100000);
    await page.mouse.move(100, 100);
    check(!(await card(page)) && !beacons.some((x) => /^card_/.test(x.step)), p + ': the script itself refuses the page');
    await ctx.close();
  }

  // 9. With a call link set: the button shows, opens in a new tab, and counts a click.
  console.log('call link set');
  {
    const { ctx, page, beacons } = await open({ name: 'call-link', phone: true, callLink: 'https://example.com/mick-30' });
    await page.goto(BASE + '/elopements');
    await page.clock.runFor(46000); await settle(page);
    const btn = await page.$('#lf-talk a.lf-talk__call');
    check(!!btn && (await btn.textContent()) === 'Book a 30-minute call' && (await btn.getAttribute('target')) === '_blank' && (await btn.getAttribute('href')) === 'https://example.com/mick-30', 'button shows, with the link, in a new tab');
    check((await overflow(page)) <= 0, 'no horizontal overflow at 390 with the button');
    await shot(page, 'phone-elopements-with-call-link.png');
    const pop = ctx.waitForEvent('page');
    await btn.tap();
    await (await pop).close();
    check(await until(() => beacons.filter((x) => x.step === 'card_click').length === 1) && beacons.find((x) => x.step === 'card_click').path === '/elopements', 'button sends card_click with the path');
    await ctx.close();
  }

  // 10. Reduced motion: no movement.
  {
    const { ctx, page } = await open({ name: 'reduced', phone: true, reduced: true, engineLanded: true });
    await page.goto(BASE + '/elopements');
    await page.clock.runFor(46000); await settle(page);
    const t = await page.evaluate(() => { const s = getComputedStyle(document.getElementById('lf-talk')); return [s.transitionDuration, s.transform]; });
    check(t[0].split(',').every((d) => parseFloat(d) === 0) && t[1] === 'none', 'reduced motion: no transition, no transform');
    await ctx.close();
  }

  // 11. The email on /book (2026-10-24): marker mode, as js/talk.js ships; then hold mode.
  const TALK_ONLY = 'Rather talk it through?' + 'Mick built the treehouse with his family. Ask him anything. No pressure.' + 'Call or text Mick at 706-502-4823';
  const cardText = (page) => page.evaluate(() => { const c = document.getElementById('lf-talk'); return c ? c.textContent.replace(/\s+/g, ' ').replace(/\s*(?=Mick built|Call or text)/g, '').trim() : ''; });
  async function askCard(page, url) {
    await bookReady(page, url || `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.clock.runFor(11000); await settle(page);
  }
  async function tapAsk(page) {
    await page.tap('#lf-talk-email');
    await page.keyboard.type(TEST_EMAIL);
    await page.tap('#lf-talk .lf-talk__go');
  }
  async function fillCheckout(page) {
    await page.click('#gatehouse .gh-cta');
    await page.waitForSelector('#gatehouse .gh-form');
    await page.fill('#gh-email', TEST_EMAIL);
    await page.fill('#gh-first_name', 'Test');
    await page.fill('#gh-last_name', 'Guest');
    await page.fill('#gh-phone', '555-010-0000');
    await page.selectOption('#gh-guests', '2');
    await page.selectOption('#gh-dogs', '0');
    await page.check('#gh-agree');
    await page.fill('#gh-typed_name', 'Test Guest');
    await page.click('#gatehouse .gh-form button[type="submit"]');
  }
  async function cardLook(page) {
    return page.evaluate(() => {
      const c = document.getElementById('lf-talk'), ab = c.querySelector('.lf-talk__ask'), tk = c.querySelector('.lf-talk__talk');
      const i = c.querySelector('#lf-talk-email'), lab = c.querySelector('label[for="lf-talk-email"]'), b = c.querySelector('.lf-talk__go');
      return { label: document.getElementById(c.getAttribute('aria-labelledby')).textContent, desc: document.getElementById(c.getAttribute('aria-describedby')).textContent,
        h: ab.querySelector('h2').textContent, p: ab.querySelector('p').textContent, type: i.type, auto: i.autocomplete, lab: lab && lab.textContent, btn: b.textContent,
        fields: c.querySelectorAll('input').length, buttons: c.querySelectorAll('form button').length,
        order: !!(ab.compareDocumentPosition(tk) & Node.DOCUMENT_POSITION_FOLLOWING), talk: tk.textContent,
        font: parseFloat(getComputedStyle(i).fontSize), r: c.getBoundingClientRect().toJSON(), bg: getComputedStyle(b).backgroundColor,
        bh: b.getBoundingClientRect().height, ih: i.getBoundingClientRect().height };
    });
  }
  async function refusedOnly(page, what, sentOk, beacons, made) {
    await page.waitForSelector('#lf-talk .lf-talk__ask', { state: 'detached', timeout: 5000 }).catch(() => {});
    const after = await page.evaluate(() => { const c = document.getElementById('lf-talk');
      return c ? { label: document.getElementById(c.getAttribute('aria-labelledby')).textContent, alert: !!c.querySelector('[role="alert"], .gh-error'), inCard: c.contains(document.activeElement), shown: c.classList.contains('is-in') } : null; });
    const text = await cardText(page);
    check(sentOk && !!after && after.shown && text === TALK_ONLY && !after.alert && after.label === 'Rather talk it through?' && after.inCard && !beacons.some((x) => x.step === made),
      what + ': the email part leaves, only the call line stays, no error, focus kept in the card');
  }
  async function clearOfPay(page, tag) {
    for (const at of [110, 420, 160]) {
      await page.evaluate((at) => { const b = document.querySelector('#gatehouse .gh-cta'); const r = b.getBoundingClientRect(); window.scrollBy({ top: r.bottom - (innerHeight - at), behavior: 'instant' }); }, at);
      await page.clock.runFor(100); await page.waitForTimeout(120);
      const clear = await page.evaluate(() => getComputedStyle(document.getElementById('lf-talk')).visibility === 'hidden') || !(await overlapsAny(page, '#gatehouse .gh-cta'));
      check(clear, `${tag}: pay button ${at} px above the foot of the screen, the card is clear of it`);
      if (at === 110) await shot(page, 'phone-book-' + tag + '-cta-low.png');
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.clock.runFor(100); await page.waitForTimeout(120);
  }

  console.log('/book, the email (marker mode): not before the total exists');
  {
    let release; const gate = new Promise((r) => { release = r; });
    const { ctx, page } = await open({ name: 'ask-late-total', phone: true, quoteGate: gate });
    await page.goto(BASE + `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.waitForSelector('#gatehouse .gh-pulse');
    await page.clock.runFor(12000);
    check(!(await page.$('#gatehouse dd.gh-total')) && !(await card(page)), 'dates in the link, total still adding up at 12 s: no card');
    release();
    await page.waitForSelector('#gatehouse dd.gh-total');
    await page.clock.runFor(8500);
    check(!(await card(page)), 'total on screen 8.5 s: no card yet');
    await page.clock.runFor(2500); await settle(page);
    check(await shown(page) && !!(await page.$('#lf-talk #lf-talk-email')), 'total on screen 10 s: the card, asking for an email');
    await ctx.close();
  }

  // What the page's own "Leave a trail marker" sends, to hold the card's call against.
  let pageMarker = null;
  {
    const { ctx, page, markers } = await open({ name: 'marker-block', phone: true, cardSeen: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.click('#gatehouse .gh-marker .gh-link');
    await page.fill('#gh-marker-email', TEST_EMAIL);
    await page.click('#gh-marker-form button[type="submit"]');
    await until(() => markers.length === 1);
    pageMarker = markers[0] || null;
    await ctx.close();
  }

  console.log('/book, the email (marker mode): shown at 390, and left');
  {
    const { ctx, page, beacons, holds, markers, checkouts, avail, quotes } = await open({ name: 'marker-ok', phone: true });
    await askCard(page);
    const look = await cardLook(page);
    check(look.h === 'Want a day to think it over?' && look.p === "Leave your email and we'll send you these dates and the all-in price, with a link straight back to them." && look.btn === 'Leave a trail marker', 'marker: the drafted words, exactly');
    check(look.fields === 1 && look.buttons === 1 && look.type === 'email' && look.auto === 'email' && look.lab === 'Your email', 'marker: one email field (labelled "Your email") and one button');
    check(look.order && /Rather talk it through\?/.test(look.talk) && /Call or text Mick at 706-502-4823/.test(look.talk), 'marker: the call line stays below it, its words as they are');
    check(look.label === 'Want a day to think it over?' && /these dates and the all-in price/.test(look.desc), 'marker: the dialog is named by its heading');
    check(look.font >= 16 && look.ih >= 44 && look.bh >= 44, 'marker: field 16 px type, field and button 44 px or taller');
    check(look.r.left >= 16 && look.r.right <= 374 && look.r.top >= 68, 'marker: card inside the gutters and below the header, ' + Math.round(look.r.height) + ' px tall');
    check(look.bg !== 'rgb(196, 162, 101)', "marker: the button is not gold (gold is the Book button's)");
    check((await overflow(page)) <= 0, 'marker: no horizontal overflow at 390');
    check(!(await overlapsAny(page, '#gatehouse .gh-cta')), 'marker: card clear of the pay button');
    await until(() => beacons.some((x) => x.step === 'marker_shown'));
    const ms = beacons.filter((x) => x.step === 'marker_shown');
    check(ms.length === 1 && ms[0].path === '/book' && Object.keys(ms[0]).sort().join() === 'path,step,visit' && beacons.some((x) => x.step === 'card_shown' && x.path === '/book'), 'marker_shown beacon (with card_shown): visit, step, path only');
    await shot(page, 'phone-book-marker.png');
    await clearOfPay(page, 'marker');
    // Not an email: nothing sent, the field asks again, no words that blame.
    await page.tap('#lf-talk-email');
    await page.keyboard.type('not-an-email');
    await page.tap('#lf-talk .lf-talk__go');
    await page.waitForTimeout(300);
    check(markers.length === 0 && (await page.evaluate(() => document.activeElement.id === 'lf-talk-email' && document.activeElement.getAttribute('aria-invalid') === 'true'))
      && !(await page.$('#lf-talk [role="alert"]')), 'marker: not an email, nothing sent, focus stays in the field, no error line');
    await page.fill('#lf-talk-email', '');
    await page.keyboard.type(TEST_EMAIL);
    await page.tap('#lf-talk .lf-talk__go');
    check(await until(() => markers.length === 1), 'marker: POST /v1/marker sent once');
    check(!!pageMarker && JSON.stringify(markers[0]) === JSON.stringify(pageMarker), 'marker: the very body the page\'s own trail marker sends: ' + JSON.stringify(markers[0]));
    await page.waitForSelector('#lf-talk .lf-talk__done', { timeout: 5000 }).catch(() => {});
    const done = await page.evaluate(() => { const c = document.getElementById('lf-talk'); const d = c && c.querySelector('.lf-talk__done'); const pg = document.querySelector('#gatehouse .gh-marker__done');
      return d ? { text: d.textContent, page: pg && pg.textContent, role: d.getAttribute('role'), field: !!c.querySelector('input'), focus: document.activeElement === d, talk: !!c.querySelector('.lf-talk__phone a[href^="tel:"]') } : null; });
    check(!!done && done.text.startsWith(MARKER_START) && done.text.endsWith(MARKER_END) && done.text === done.page, 'marker done: the trail marker\'s own line, as the page shows it: "' + (done && done.text) + '"');
    check(!!done && done.role === 'status' && done.focus && !done.field && done.talk, 'marker done: read out where focus was; the field is gone; the call line stays');
    check(await until(() => beacons.some((x) => x.step === 'marker_card')) && Object.keys(beacons.find((x) => x.step === 'marker_card')).sort().join() === 'path,step,visit', 'marker_card beacon: visit, step, path only');
    const dl = await page.evaluate(() => JSON.stringify(window.dataLayer || []));
    check(!JSON.stringify(beacons).includes(TEST_EMAIL) && !dl.includes(TEST_EMAIL) && /"gh_marker_left"/.test(dl), 'marker: the email in no beacon and no tag-manager entry; gh_marker_left counted as for the page\'s marker');
    await shot(page, 'phone-book-marker-done.png');
    // Nothing of the hold runs in marker mode.
    await page.click('#lf-talk .lf-talk__x');
    await page.clock.runFor(500); await page.waitForTimeout(450);
    await fillCheckout(page);
    check(await until(() => checkouts.length === 1) && holds.length === 0 && !('hold' in checkouts[0]) && !('visit' in checkouts[0])
      && !avail.concat(quotes).some((q) => /hold=/.test(q)), 'marker: no /v1/hold call, no hold anywhere in the calendar, quote or checkout');
    await ctx.close();
  }

  console.log('/book, the email (marker mode) with a call link, as the live card has');
  {
    const { ctx, page } = await open({ name: 'marker-call-link', phone: true, callLink: 'https://example.com/mick-30' });
    await askCard(page);
    const look = await cardLook(page);
    check(!!(await page.$('#lf-talk .lf-talk__talk a.lf-talk__call')) && look.r.top >= 68 && look.r.left >= 16 && look.r.right <= 374 && (await overflow(page)) <= 0,
      'with the call button: inside the gutters, below the header, no overflow (' + Math.round(look.r.height) + ' px tall)');
    await shot(page, 'phone-book-marker-with-call-link.png');
    await clearOfPay(page, 'marker-call-link');
    await ctx.close();
  }

  console.log('/book, the email (marker mode) refused, missing or unreachable');
  for (const kind of [409, 422, 429, 400, 404, 500, 'net']) {
    const { ctx, page, beacons, markers } = await open({ name: 'marker-' + kind, phone: true, marker: kind });
    await askCard(page);
    await tapAsk(page);
    const sent = await until(() => markers.length === 1);
    await refusedOnly(page, 'marker ' + (kind === 'net' ? 'no network' : kind), sent, beacons, 'marker_card');
    check(!(await page.$('#gatehouse .gh-marker .gh-error:not(:empty)')), 'marker ' + kind + ': the page\'s own trail marker shows no error either');
    if (kind === 409) await shot(page, 'phone-book-marker-refused.png');
    await ctx.close();
  }

  console.log('/book, the email (marker mode): a marker already left on the page');
  {
    const { ctx, page, markers } = await open({ name: 'marker-already', phone: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.click('#gatehouse .gh-marker .gh-link');
    await page.fill('#gh-marker-email', TEST_EMAIL);
    await page.click('#gh-marker-form button[type="submit"]');
    await until(() => markers.length === 1);
    await page.waitForSelector('#gatehouse .gh-marker__done');
    await page.clock.runFor(14000); await settle(page);
    check(await shown(page) && !(await page.$('#lf-talk input')) && (await cardText(page)) === TALK_ONLY, 'marker already left: the card without the email, only the call line');
    await ctx.close();
  }

  console.log('/book, the email (marker mode) waits while a field is in use');
  {
    const { ctx, page } = await open({ name: 'ask-typing', phone: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.click('#gatehouse .gh-marker .gh-link');
    await page.focus('#gh-marker-email');
    await page.keyboard.type('a');
    await page.clock.runFor(20000);
    check(!(await card(page)), 'cursor in the trail-marker field: no card at 20 s');
    await page.evaluate(() => document.activeElement.blur());
    await page.clock.runFor(2500); await settle(page);
    check(await shown(page) && !!(await page.$('#lf-talk #lf-talk-email')), 'field left: the card, asking for an email');
    await ctx.close();
  }

  console.log("/book, the email in hold mode (CARD_EMAIL set to 'hold' for these checks only)");
  {
    const { ctx, page, beacons, holds, markers, checkouts, quotes } = await open({ name: 'hold-ok', phone: true, hold: 'ok', mode: 'hold' });
    await askCard(page);
    const look = await cardLook(page);
    check(look.h === 'Want a day to think it over?' && look.p === "Leave your email and we'll hold these nights for you for 24 hours. No card, no charge." && look.btn === 'Hold my nights', 'hold: the drafted words, exactly');
    check(look.fields === 1 && look.buttons === 1 && look.order && look.r.left >= 16 && look.r.right <= 374, 'hold: one field, one button, the call line below, inside the gutters (' + Math.round(look.r.height) + ' px tall)');
    check((await overflow(page)) <= 0 && !(await overlapsAny(page, '#gatehouse .gh-cta')), 'hold: no overflow at 390, clear of the pay button');
    check(await until(() => beacons.some((x) => x.step === 'hold_shown')) && Object.keys(beacons.find((x) => x.step === 'hold_shown')).sort().join() === 'path,step,visit', 'hold_shown beacon: visit, step, path only');
    await shot(page, 'phone-book-hold.png');
    await clearOfPay(page, 'hold');
    await tapAsk(page);
    check(await until(() => holds.length === 1) && markers.length === 0, 'hold: POST /v1/hold sent once, no marker');
    const b = holds[0] || {};
    check(Object.keys(b).sort().join() === HOLD_FIELDS && b.email === TEST_EMAIL && b.check_in === CI && b.check_out === CO && b.unit === 'loxley-forest-canopy-treehouse-dahlonega' && b.visit && b.visit === (beacons[0] || {}).visit,
      "hold: the engine's shape (guests not yet chosen): " + Object.keys(b).sort().join());
    await page.waitForSelector('#lf-talk .lf-talk__done', { timeout: 5000 }).catch(() => {});
    const done = await page.evaluate(() => { const d = document.querySelector('#lf-talk .lf-talk__done'); return d ? { text: d.textContent, focus: document.activeElement === d } : null; });
    check(!!done && done.text === HELD_LINE && done.focus, 'hold done, Eastern time: "' + (done && done.text) + '"');
    check(await until(() => beacons.some((x) => x.step === 'hold_made')) && Object.keys(beacons.find((x) => x.step === 'hold_made')).sort().join() === 'path,step,visit', 'hold_made beacon: visit, step, path only');
    const dl = await page.evaluate(() => JSON.stringify(window.dataLayer || []));
    check(!JSON.stringify(beacons).includes(TEST_EMAIL) && !dl.includes(TEST_EMAIL) && !JSON.stringify(beacons).includes('tok-held-1') && !dl.includes('tok-held-1'), 'hold: the email and the key in no beacon and no tag-manager entry');
    check(await page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem('gh_keys'))['/book'].hold === 'tok-held-1'; } catch (e) { return false; } }), 'hold: the key kept for this tab where the head script restores keys on a refresh');
    await shot(page, 'phone-book-held.png');
    await page.click('#lf-talk .lf-talk__x');
    await page.clock.runFor(500); await page.waitForTimeout(450);
    await fillCheckout(page);
    check(await until(() => checkouts.length === 1) && checkouts[0].hold === 'tok-held-1' && checkouts[0].visit === b.visit, 'hold: a hold made on the card rides this tab\'s checkout, with the visit');
    await ctx.close();
  }
  for (const kind of [404, 'taken', 'already_held', 429, 400, 410, 'net', 'not-held']) {
    const { ctx, page, beacons, holds } = await open({ name: 'hold-' + kind, phone: true, hold: kind, mode: 'hold' });
    await askCard(page);
    await tapAsk(page);
    const sent = await until(() => holds.length === 1);
    const what = kind === 'taken' || kind === 'already_held' ? '409 ' + kind : kind === 'net' ? 'no network' : kind === 'not-held' ? '200 without held: true' : kind === 410 ? '410 (the engine today)' : String(kind);
    await refusedOnly(page, 'hold ' + what, sent, beacons, 'hold_made');
    if (kind === 'taken') await shot(page, 'phone-book-hold-refused.png');
    await ctx.close();
  }

  console.log('/book, a hold link (#hold=, the key path in js/gatehouse.js that hold mode uses)');
  {
    const { ctx, page, beacons, checkouts, avail, quotes } = await open({ name: 'hold-link', phone: true, cardSeen: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}#hold=tok-from-link`);
    check(!/hold=/.test(page.url()) && /checkIn=/.test(page.url()), 'the key is lifted out of the address bar, the dates kept');
    check(/[?&]hold=tok-from-link(&|$)/.test(avail[0] || '') && /[?&]hold=tok-from-link(&|$)/.test(quotes[0] || ''), 'the calendar and the quote ask with the hold');
    await fillCheckout(page);
    check(await until(() => checkouts.length === 1) && checkouts[0].hold === 'tok-from-link' && checkouts[0].visit === (beacons[0] || {}).visit, 'the hold reaches the checkout request, with the visit');
    const dl = await page.evaluate(() => JSON.stringify(window.dataLayer || []));
    check(!JSON.stringify(beacons).includes('tok-from-link') && !dl.includes('tok-from-link'), 'the hold key is in no beacon and no tag-manager entry');
    await ctx.close();
  }

  console.log('/proposals (the elopements page standing in): unchanged');
  {
    const { ctx, page, beacons } = await open({ name: 'proposals', phone: true });
    await page.goto(BASE + '/proposals');
    await page.clock.runFor(44000);
    check(!(await card(page)), '/proposals: no card at 44 s');
    await page.clock.runFor(1500); await settle(page);
    check(await shown(page) && !(await page.$('#lf-talk .lf-talk__ask, #lf-talk input')) && (await cardText(page)) === TALK_ONLY, '/proposals: the card at 45 s, as before, no email');
    check(await until(() => beacons.some((x) => x.step === 'card_shown' && x.path === '/proposals')) && !beacons.some((x) => /^(hold|marker)_/.test(x.step)), '/proposals: card_shown, no hold_ or marker_ beacon');
    await ctx.close();
  }

  console.log('console errors and page errors: ' + consoleErrors.length);
  consoleErrors.forEach((e) => console.log('  ' + e));
  check(consoleErrors.length === 0, 'no script errors and no console errors from the page, on any page');
  console.log('browser network lines for refused card_* beacons (engine not yet landed): ' + refusals.length);
  check(!refusals.includes('reduced'), 'once the engine accepts card_* (the reduced-motion run): not one console line');
  console.log('browser network lines for holds and checkouts this check refuses on purpose: ' + mockedLines.length);

  await browser.close();
  srv.close();
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
