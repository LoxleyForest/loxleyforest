#!/usr/bin/env node
/* Checks the talk-to-Mick card (js/talk.js) in a real browser, on a local copy of the site.

   Run from the repo:  node scripts/site/check_talk.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set NODE_PATH) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine: the booking API (book.loxleyforest.com) is answered here with
   made-up nights and a made-up quote, the beacon is recorded and refused for card_* as the
   engine does today ("unknown step"), and every other outside request gets an empty answer.
   Google Fonts load, so text measures as it does live. Time runs on Playwright's clock. */
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

let failures = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const consoleErrors = [];   // script errors and anything else the page logs as an error
  const refusals = [];       // the browser's own network line for a refused card_* beacon
  const talkSrc = fs.readFileSync(path.join(ROOT, 'js/talk.js'), 'utf8');

  async function open(opts) {
    const phone = opts.phone;
    const ctx = await browser.newContext(phone
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' }
      : { viewport: { width: 1280, height: 800 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
    const beacons = [];
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === '127.0.0.1') {
        if (opts.callLink && u.pathname === '/js/talk.js') {
          return route.fulfill({ contentType: 'text/javascript', body: talkSrc.replace("var CALL_LINK = '';", "var CALL_LINK = '" + opts.callLink + "';") });
        }
        return route.continue();
      }
      if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o, s) => route.fulfill({ status: s || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) });
        if (u.pathname === '/v1/funnel') {
          let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
          beacons.push(b);
          return /^card_/.test(b.step) && !opts.engineLanded ? json({ error: 'unknown step' }, 400) : json({ ok: true });
        }
        if (u.pathname === '/v1/availability') return json(NIGHTS);
        if (u.pathname === '/v1/quote') return json(QUOTE);
        if (u.pathname === '/v1/agreement') return json(AGREEMENT);
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
      else consoleErrors.push(opts.name + ': ' + m.text() + (from ? ' (' + from + ')' : ''));
    });
    page.on('pageerror', (e) => consoleErrors.push(opts.name + ': ' + e.message));
    await page.clock.install();
    return { ctx, page, beacons };
  }

  const card = (page) => page.$('#lf-talk');
  const shown = async (page) => !!(await page.$('#lf-talk.is-in'));
  async function settle(page) { await page.clock.runFor(50); await page.waitForTimeout(400); }
  async function overflow(page) { return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); }
  async function shot(page, name) { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name) }); } }
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
        callBtn: !!c.querySelector('.lf-talk__call'), r: c.getBoundingClientRect().toJSON() };
    });
    check(a11y.role === 'dialog' && a11y.label && a11y.desc && a11y.close === 'Close', 'dialog role, heading label, description, labelled close button');
    check(a11y.focused, 'focus moved to the card');
    check(a11y.tel === 'tel:+17065024823' && /Call or text Mick at 706-502-4823/.test(a11y.phoneText), 'phone line carries the site number');
    check(!a11y.callBtn, 'no call button while the link is empty');
    check(a11y.r.left >= 16 && a11y.r.right <= 374, 'card sits inside the 16 px gutters');
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
    check(beacons.filter((x) => x.step === 'card_click').length === 1, 'phone link sends card_click');
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

  // 5. /book, phone: dates chosen, checkout not begun for 60 s.
  console.log('/book, phone 390');
  {
    const { ctx, page, beacons } = await open({ name: 'book-phone', phone: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.clock.runFor(58000);
    check(!(await card(page)), 'no card at 58 s with dates chosen');
    await page.clock.runFor(3000); await settle(page);
    check(await shown(page), 'card shown 60 s after dates, checkout not begun');
    check(beacons.some((x) => x.step === 'card_shown' && x.path === '/book'), 'card_shown beacon with /book');
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

  // 6. /book: 59 s is not enough, and starting checkout cancels the dates wait.
  {
    const { ctx, page } = await open({ name: 'book-begin', phone: true });
    await bookReady(page, `/book?checkIn=${CI}&checkOut=${CO}`);
    await page.clock.runFor(40000);
    await page.click('#gatehouse .gh-cta');
    await page.waitForSelector('#gatehouse .gh-form');
    await page.clock.runFor(30000);
    check(!(await card(page)), 'checkout begun at 40 s: no card at 70 s (idle wait starts over)');
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
    check(beacons.filter((x) => x.step === 'card_click').length === 1 && beacons.find((x) => x.step === 'card_click').path === '/elopements', 'button sends card_click with the path');
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

  console.log('console errors and page errors: ' + consoleErrors.length);
  consoleErrors.forEach((e) => console.log('  ' + e));
  check(consoleErrors.length === 0, 'no script errors and no console errors from the page, on any page');
  console.log('browser network lines for refused card_* beacons (engine not yet landed): ' + refusals.length);
  check(!refusals.includes('reduced'), 'once the engine accepts card_* (the reduced-motion run): not one console line');

  await browser.close();
  srv.close();
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
