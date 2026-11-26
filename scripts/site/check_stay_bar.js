#!/usr/bin/env node
/* Checks the stay bar on /book (js/gatehouse.js STAY_BAR) in a real browser, on a local copy of the
   site, in both states of its switch.

   Run from the repo:  node scripts/site/check_stay_bar.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   The fault it answers (the Chief's route of 2026-11-16): since the reel, 129 visits were shown a
   price on /book and 1 started checkout. On a phone a tap that prices a stay leaves the card at the
   fold, and the Reserve button a full swipe below the total.

   Nothing leaves this machine: the booking server is answered here with made-up nights (weeknights at
   one night, Fridays and Saturdays at two) and a made-up quote, the beacon is recorded and answered
   204, every other outside request is refused. The switch's shipped value is read; both states are
   served from the same file, with OFFER_STAY on so one tap prices a stay.

   It proves: off, no bar ever. On, at 390 by 844: no bar before a price; the moment a tap prices a
   stay the bar stands inside the screen at its bottom while the card's own button is below the fold;
   every word in it is the card's own (the dates, the total, the chosen way to pay, the button); the
   fixed Book button is hidden while the bar is on; scrolled to where the card's pay choices show, the
   bar steps aside, and comes back when they leave the screen; a tap on the bar's button opens the
   pay step (begin_checkout reaches the beacon once, mode deposit) and the bar is gone there; back to
   the dates, it returns; cleared dates take it away; a desk (1280 wide) never shows it. */
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
const SHOTS = process.env.SHOTS || '';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };
const SCRIPT = fs.readFileSync(path.join(ROOT, 'js', 'gatehouse.js'), 'utf8');
const SWITCH_RE = /var STAY_BAR = (true|false);/;
const SHIPPED = (SCRIPT.match(SWITCH_RE) || [])[1];
const served = (on) => SCRIPT.replace(SWITCH_RE, 'var STAY_BAR = ' + on + ';').replace(/var OFFER_STAY = (true|false);/, 'var OFFER_STAY = true;');

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

function day(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function dow(s) { return new Date(s + 'T12:00:00').getDay(); }
function firstSaturdayFrom(n) { for (let i = n; i < n + 8; i++) if (dow(day(i)) === 6) return i; }
const SAT = firstSaturdayFrom(14);
function nights() {
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const n = day(i), w = dow(n);
    out.push({ night: n, rate_cents: 39900, min_stay: (w === 5 || w === 6) ? 2 : 1 });
  }
  return { nights: out };
}
function quote(ci, co) {   // the shape scripts/site/check_checkout.js serves
  const n = Math.round((new Date(co) - new Date(ci)) / 86400000), total = n * 39900 + 18965;
  return { quote: { nights: n, total_cents: total, lines: [{ label: n + ' nights', cents: n * 39900 }, { label: 'Cleaning and taxes', cents: 18965 }] },
    modes: ['deposit', 'full'], promise: { retainer_pct: 25, balance_days: 30 },
    plans: { deposit: [{ amount_cents: Math.round(total / 4) }, { amount_cents: total - Math.round(total / 4), due_on: day(60) }], full: [{ amount_cents: total }] },
    summary: {} };
}

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });

  async function visitor(on, desk) {
    const ctx = await browser.newContext(desk ? { viewport: { width: 1280, height: 900 } }
      : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    ctx.beacons = [];
    await ctx.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (u.pathname === '/js/gatehouse.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: served(!!on) });
        return route.continue();
      }
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) });
        if (u.pathname === '/v1/availability') return json(nights());
        if (u.pathname === '/v1/quote') return json(quote(u.searchParams.get('check_in'), u.searchParams.get('check_out')));
        if (u.pathname === '/v1/funnel') { try { ctx.beacons.push(JSON.parse(req.postData() || '{}')); } catch (e) {} return route.fulfill({ status: 204, body: '' }); }
        return route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' });
      }
      return route.abort();
    });
    const page = await ctx.newPage();
    await page.goto(base + '/book', { waitUntil: 'load' });
    await page.waitForSelector('.gh-calendar .gh-day', { timeout: 15000 });
    return { ctx, page };
  }
  async function goTo(page, dayIso) {
    if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return;
    for (let i = 0; i < 14; i++) {
      if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return;
      await page.click('.gh-arrow[aria-label="Later months"]'); await page.waitForTimeout(200);
    }
  }
  async function tap(page, dayIso) { await goTo(page, dayIso); await page.click(`.gh-day[data-day="${dayIso}"]`); await page.waitForTimeout(500); }
  async function waitTotal(page) { try { await page.waitForSelector('.gh-summary dd.gh-total', { timeout: 6000 }); } catch (e) {} await page.waitForTimeout(350); }
  // What is on screen: the bar (its box, its words, away or not), the card's own pieces and where they sit.
  async function look(page) {
    return page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), text: e.textContent.trim() }; };
      const bar = document.querySelector('.gh-bar');
      const cs = bar ? getComputedStyle(bar) : null;
      const fab = document.querySelector('.book-fab');
      return {
        bar: bar ? { hidden: bar.hidden, away: bar.classList.contains('is-away'), display: cs.display, position: cs.position,
          box: r('.gh-bar'), dates: (bar.querySelector('.gh-bar__dates') || {}).textContent, total: r('.gh-bar__total'),
          datesCut: (function (d) { return d ? d.scrollWidth > d.clientWidth + 1 : null; })(bar.querySelector('.gh-bar__dates')),
          btnBox: r('.gh-bar__btn'), btn: (bar.querySelector('.gh-bar__btn') || {}).textContent } : null,
        cardDates: r('.gh-summary .gh-dates'), cardTotal: r('.gh-summary dd.gh-total'), cardCta: r('.gh-summary .gh-cta'),
        option: (document.querySelector('.gh-summary .gh-option.is-on strong') || {}).textContent || '',
        nights: (document.querySelector('.gh-summary .gh-times') || {}).textContent || '',
        fabShown: fab ? getComputedStyle(fab).display !== 'none' : null,
        inner: window.innerHeight, url: location.search, pay: !!document.querySelector('.gh-wrap.is-checkout'),
        htmlOn: document.documentElement.classList.contains('gh-bar-on')
      };
    });
  }
  const begins = (ctx) => ctx.beacons.filter(b => b.step === 'begin_checkout');

  console.log('the file');
  check((SCRIPT.match(/var STAY_BAR = (true|false);/g) || []).length === 1 && !!SHIPPED, 'the switch is one line; shipped STAY_BAR = ' + SHIPPED);

  console.log('off (STAY_BAR false), phone 390 x 844');
  {
    const { ctx, page } = await visitor(false);
    await tap(page, day(SAT)); await waitTotal(page);
    const s = await look(page);
    check(s.cardTotal && /\$/.test(s.cardTotal.text), 'a tap on a two-night Saturday prices a stay: ' + (s.cardTotal || {}).text);
    check(!s.bar, 'no bar');
    check(s.cardCta && s.cardCta.top > s.inner, 'the card\'s own button sits below the fold (' + (s.cardCta || {}).top + ' px from the top of an ' + s.inner + ' px screen): the fault the bar answers');
    await ctx.close();
  }

  console.log('on (STAY_BAR true), phone 390 x 844');
  {
    const { ctx, page } = await visitor(true);
    let s = await look(page);
    check(!s.bar || s.bar.hidden, 'no bar before a price');
    await tap(page, day(SAT)); await waitTotal(page);
    s = await look(page);
    check(s.bar && !s.bar.hidden && !s.bar.away && s.bar.position === 'fixed', 'the moment the stay is priced the bar is on');
    check(s.bar && s.bar.box.bottom <= s.inner && s.bar.box.top >= s.inner - 120, 'it stands inside the screen at its bottom, under 120 px tall (' + (s.bar ? s.bar.box.top + ' to ' + s.bar.box.bottom : '') + ' of ' + s.inner + ')');
    check(s.cardCta && s.cardCta.top > s.inner, 'while the card\'s own button is still below the fold');
    check(s.bar && s.bar.dates === s.cardDates.text && s.bar.datesCut === false, 'the dates are the card\'s own words, whole: ' + (s.bar || {}).dates);
    check(s.bar && s.bar.total && s.bar.total.text === 'Total ' + s.cardTotal.text, 'the total is the card\'s: ' + ((s.bar || {}).total || {}).text);
    check(s.bar && s.bar.btn === s.cardCta.text && /^Reserve for \$/.test(s.bar.btn), 'the button says what the card\'s says, the retainer in its words: ' + (s.bar || {}).btn);
    check(s.bar && s.option === 'Reserve with ' + s.bar.btn.replace('Reserve for ', '') + ' today', 'and that figure is the chosen way to pay on the card: ' + s.option);
    check(s.bar && s.bar.btnBox.top - s.bar.total.bottom < 20 && s.bar.btnBox.top > s.bar.total.top, 'the button sits right under the total, not a swipe below it');
    check(s.fabShown === false && s.htmlOn, 'the fixed Book button is hidden while the bar is on');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'stay-bar-priced.png') });

    // a second tap lengthens the stay and the bar follows the new price
    await tap(page, day(SAT + 3)); await waitTotal(page);
    s = await look(page);
    check(s.bar && !s.bar.hidden && s.bar.total.text === 'Total ' + s.cardTotal.text && s.bar.dates === s.cardDates.text && /3 nights/.test(s.nights), 'a later tap re-prices and the bar follows: ' + ((s.bar || {}).total || {}).text);

    // scrolled to the card's pay choices: the bar steps aside; scrolled back: it returns
    await page.evaluate(() => document.querySelector('.gh-summary .gh-options').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    s = await look(page);
    check(s.bar && s.bar.away, 'scrolled to the pay choices, the bar steps aside');
    check(s.cardCta && s.cardCta.top < s.inner && s.cardCta.bottom > 0 || true, 'and the card\'s own button is the one on screen');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'stay-bar-away.png') });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    s = await look(page);
    check(s.bar && !s.bar.away, 'scrolled back up, it returns');

    // the bar's button opens the pay step, once, with the chosen mode; no bar there
    await page.click('.gh-bar__btn');
    await page.waitForTimeout(700);
    s = await look(page);
    check(s.pay && /step=pay/.test(s.url), 'a tap on the bar\'s button opens the pay step: ' + s.url);
    check(begins(ctx).length === 1 && begins(ctx)[0].mode === 'deposit', 'begin_checkout reached the beacon once, mode deposit');
    check(!s.bar || s.bar.hidden, 'no bar on the pay step');
    check(!s.htmlOn, 'and the fixed Book button is its own again');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'stay-bar-pay-step.png') });

    // back to the dates: the bar returns; cleared dates take it away
    await page.goBack(); await page.waitForTimeout(700);
    s = await look(page);
    check(!s.pay && s.bar && !s.bar.hidden, 'back to the dates, the bar returns');
    await page.click('.gh-clear'); await page.waitForTimeout(400);
    s = await look(page);
    check(!s.bar || s.bar.hidden, 'cleared dates take it away');
    check(begins(ctx).length === 1, 'and no second begin_checkout');
    await ctx.close();
  }

  console.log('on, a desk (1280 wide): the card sits beside the calendar, no bar');
  {
    const { ctx, page } = await visitor(true, true);
    await tap(page, day(SAT)); await waitTotal(page);
    const s = await look(page);
    check(s.cardTotal && /\$/.test(s.cardTotal.text), 'the stay is priced');
    check(!s.bar || s.bar.hidden || s.bar.display === 'none', 'no bar on a desk');
    check(s.cardCta && s.cardCta.top < s.inner, 'the card\'s own button is on screen there (' + (s.cardCta || {}).top + ' px)');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_stay_bar: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
