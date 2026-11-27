#!/usr/bin/env node
/* Checks the three counters on /book (js/gatehouse.js, 2026-11-16: quote_shown, script_error,
   pay_reopened) in a real browser, on a local copy of the site.

   Run from the repo:  node scripts/site/check_counters.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Why (the Chief's route of 2026-11-16): checkouts started per pick stepped down on Oct 27 and no
   change in the page or the count carries it. dates_chosen fires when the quote arrives, before the
   card is drawn, so a card that fails to draw on some phones would count a pick and show no button:
   quote_shown says the button was drawn, script_error says what broke and where, pay_reopened keeps a
   return to a begun checkout (a link with step=pay) from reading as a pick with no start.

   Nothing leaves this machine: the booking server is answered here with made-up nights and a made-up
   quote, the beacon is recorded and answered 204, Clarity is a stub that records its calls, and every
   other outside request is refused. One served variant of the script plants a failure in the card
   (window.__boom) to prove the pattern is caught.

   It proves, at 390 by 844: a priced tap sends dates_chosen then quote_shown once, with the check-in,
   and the same event reaches the Tag Manager's dataLayer and Clarity; a pay-mode change sends no
   second quote_shown, a new stay sends one more, cleared dates none, and the Book tap sends
   begin_checkout and no pay_reopened. With the card made to fail: dates_chosen still counts, no
   quote_shown, one script_error whose words name the failure and the file, the address inside it
   stripped of its query (no code or token), the phase named, and the same in the dataLayer and
   Clarity; the same error a second time sends nothing; a third party's error sends nothing; a sixth
   distinct error sends nothing. An arrival with step=pay sends dates_chosen and pay_reopened once, no
   begin_checkout, and lands on the pay step; an arrival with dates alone sends quote_shown and no
   pay_reopened. The file names the three in STEP_FOR and the two dated ones in WITH_CHECK_IN.
   Added 2026-11-26 (the Chief): a refusal carries the check-in asked, as check_in on the beacon and
   gh_check_in in the dataLayer: a tap on a night nobody may arrive on (no_arrival, that day) and a
   link asking one night of a two-night Saturday (min_stay, the Saturday). */
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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };
const SCRIPT = fs.readFileSync(path.join(ROOT, 'js', 'gatehouse.js'), 'utf8');
const PLANT = 'function stayHead(q) {';
const BOOM = 'function stayHead(q) { if (window.__boom) throw new Error("check: the card failed https://book.loxleyforest.com/v1/gift?code=SECRET123&token=T0K3N x=1"); ';
const served = (boom) => (boom ? SCRIPT.replace(PLANT, BOOM) : SCRIPT).replace(/var OFFER_STAY = (true|false);/, 'var OFFER_STAY = true;');

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
const EVE = SAT + 21;   // a made-up night nobody may arrive on, as the engine marks a holiday's eve
function nights() {
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const n = day(i), w = dow(n), night = { night: n, rate_cents: 39900, min_stay: (w === 5 || w === 6) ? 2 : 1 };
    if (i === EVE) night.no_arrival = true;
    out.push(night);
  }
  return { nights: out };
}
function quote(ci, co) {
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

  async function visitor(opts) {
    const o = Object.assign({ boom: false, path: '/book' }, opts || {});
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    ctx.beacons = [];
    // Clarity as the Tag Manager would have loaded it: a stub that records its calls.
    await ctx.addInitScript('window.__clarity = []; window.clarity = function () { window.__clarity.push([].slice.call(arguments)); };');
    await ctx.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (u.pathname === '/js/gatehouse.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: served(o.boom) });
        return route.continue();
      }
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (x) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(x) });
        if (u.pathname === '/v1/availability') return json(nights());
        if (u.pathname === '/v1/quote') return json(quote(u.searchParams.get('check_in'), u.searchParams.get('check_out')));
        if (u.pathname === '/v1/funnel') { try { ctx.beacons.push(JSON.parse(req.postData() || '{}')); } catch (e) {} return route.fulfill({ status: 204, body: '' }); }
        return route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' });
      }
      return route.abort();
    });
    const page = await ctx.newPage();
    await page.goto(base + o.path, { waitUntil: 'load' });
    await page.waitForSelector('#gatehouse:not(.gh-loading)', { timeout: 15000 });
    await page.waitForTimeout(400);
    return { ctx, page };
  }
  async function goTo(page, dayIso) {
    for (let i = 0; i < 14; i++) {
      if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return;
      await page.click('.gh-arrow[aria-label="Later months"]'); await page.waitForTimeout(200);
    }
  }
  async function tap(page, dayIso) { await goTo(page, dayIso); await page.click(`.gh-day[data-day="${dayIso}"]`); await page.waitForTimeout(700); }
  const steps = (ctx, name) => ctx.beacons.filter((b) => b.step === name);
  const order = (ctx) => ctx.beacons.map((b) => b.step).filter((s) => s !== 'page' && s !== 'view' && s !== 'calendar_ready').join(' > ');
  const layer = (page, ev) => page.evaluate((e) => (window.dataLayer || []).filter((x) => x.event === e), ev);
  const clarity = (page) => page.evaluate(() => window.__clarity || []);

  console.log('the file');
  check(/gh_quote_shown: 'quote_shown', gh_script_error: 'script_error', gh_pay_reopened: 'pay_reopened'/.test(SCRIPT), 'STEP_FOR names the three');
  check(/WITH_CHECK_IN = \{[^}]*quote_shown: 1, pay_reopened: 1/.test(SCRIPT), 'WITH_CHECK_IN carries the check-in on quote_shown and pay_reopened');
  check(SCRIPT.includes(PLANT), 'the planted failure has its place in the card');

  console.log('a priced tap: quote_shown once the button is drawn');
  {
    const { ctx, page } = await visitor();
    check(steps(ctx, 'quote_shown').length === 0 && steps(ctx, 'script_error').length === 0, 'nothing before a price');
    await tap(page, day(SAT));
    const shown = steps(ctx, 'quote_shown'), picks = steps(ctx, 'dates_chosen');
    check(picks.length === 1 && shown.length === 1, 'dates_chosen once, quote_shown once: ' + order(ctx));
    check(ctx.beacons.findIndex((b) => b.step === 'dates_chosen') < ctx.beacons.findIndex((b) => b.step === 'quote_shown'), 'the pick first, then the card drawn');
    check(shown[0] && shown[0].check_in === day(SAT) && shown[0].nights === 2 && shown[0].value_cents > 0, 'with the check-in, the nights and the value: ' + JSON.stringify(shown[0]));
    check(await page.evaluate(() => { const b = document.querySelector('.gh-summary .gh-cta'); return !!b && b.getBoundingClientRect().height > 0; }), 'and the button is in the page');
    check((await layer(page, 'gh_quote_shown')).length === 1, 'the dataLayer carries gh_quote_shown');
    const cl = await clarity(page);
    check(cl.some((c) => c[0] === 'event' && c[1] === 'quote_shown'), 'Clarity got the event quote_shown');
    await page.click('.gh-option input[value="full"]'); await page.waitForTimeout(300);
    check(steps(ctx, 'quote_shown').length === 1, 'a pay-mode change sends no second quote_shown');
    await tap(page, day(SAT + 3));
    check(steps(ctx, 'quote_shown').length === 2 && steps(ctx, 'quote_shown')[1].check_in === day(SAT), 'a new stay sends one more');
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    check(steps(ctx, 'quote_shown').length === 2, 'cleared dates send none');
    await tap(page, day(SAT));
    check(steps(ctx, 'quote_shown').length === 2, 'the same stay again in the visit sends none (one a stay a visit, like a pick)');
    await page.click('.gh-summary .gh-cta'); await page.waitForTimeout(500);
    check(steps(ctx, 'begin_checkout').length === 1 && steps(ctx, 'pay_reopened').length === 0, 'the Book tap: begin_checkout, no pay_reopened');
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(900);
    check(steps(ctx, 'pay_reopened').length === 0 && steps(ctx, 'begin_checkout').length === 1, 'a reload at the pay step in the visit that started it: no pay_reopened, no second start');
    check(steps(ctx, 'script_error').length === 0, 'no script_error in a clean visit');
    await ctx.close();
  }

  console.log('the card made to fail: a pick, no quote_shown, one script_error');
  {
    const { ctx, page } = await visitor({ boom: true });
    await page.evaluate(() => { window.__boom = true; });
    await tap(page, day(SAT));
    await page.waitForTimeout(400);
    const errs = steps(ctx, 'script_error');
    check(steps(ctx, 'dates_chosen').length === 1, 'dates_chosen still counts the pick');
    check(steps(ctx, 'quote_shown').length === 0, 'no quote_shown: the button was never drawn');
    check(!(await page.$('.gh-summary .gh-cta')), 'and indeed there is no button on the page');
    check(errs.length === 1, 'one script_error: ' + JSON.stringify(errs[0] || null));
    const r = (errs[0] || {}).reason || '';
    check(/^check: the card failed https:\/\/book\.loxleyforest\.com\/v1\/gift/.test(r), 'its words name the failure');
    check(!/code=|SECRET|token|T0K3N|[?=&]/.test(r), 'the address inside it lost its query: no code, no token, no = ? &');
    check(/ at js\/gatehouse\.js:\d+/.test(r), 'and names the file and line');
    check(r.length <= 120 && /^[A-Za-z0-9 ._:\/-]+$/.test(r), 'plain words the funnel keeps, 120 at most (' + r.length + ')');
    check(['dates', 'quote'].indexOf((errs[0] || {}).mode) >= 0, 'the step it broke at: ' + (errs[0] || {}).mode);
    check((await layer(page, 'gh_script_error')).length === 1, 'the dataLayer carries gh_script_error');
    const cl = await clarity(page);
    check(cl.some((c) => c[0] === 'event' && c[1] === 'script_error') && cl.some((c) => c[0] === 'set' && c[1] === 'gh_error' && /check: the card failed/.test(c[2])), 'Clarity got the event and the words');
    // the same failure again: nothing more
    await page.click('.gh-clear'); await page.waitForTimeout(200);
    await tap(page, day(SAT + 7));
    check(steps(ctx, 'script_error').length === 1, 'the same error a second time sends nothing');
    // a third party's error (another origin) is not ours
    await page.evaluate(() => { window.dispatchEvent(new ErrorEvent('error', { message: 'theirs', filename: 'https://www.googletagmanager.com/gtm.js', lineno: 1 })); });
    await page.waitForTimeout(200);
    check(steps(ctx, 'script_error').length === 1, 'a third party\'s error sends nothing');
    // our own inline error, then five distinct errors cap
    await page.evaluate(() => { window.dispatchEvent(new ErrorEvent('error', { message: 'ours two', filename: location.href, lineno: 7 })); });
    await page.waitForTimeout(200);
    check(steps(ctx, 'script_error').length === 2 && /^ours two at /.test(steps(ctx, 'script_error')[1].reason), 'an error in the page\'s own script is sent: ' + steps(ctx, 'script_error')[1].reason);
    await page.evaluate(() => { for (let i = 3; i <= 9; i++) window.dispatchEvent(new ErrorEvent('error', { message: 'ours ' + i, filename: location.href, lineno: i })); });
    await page.waitForTimeout(300);
    check(steps(ctx, 'script_error').length === 5, 'five distinct errors at most a page (' + steps(ctx, 'script_error').length + ')');
    await ctx.close();
  }

  console.log('where the Book tap came from (2026-11-19): card, bar or link, on begin_checkout and add_payment_info');
  check(/step\('begin_checkout', \{[^}]*gh_origin: state\.origin, gh_reason: state\.origin/.test(SCRIPT) && /step\('add_payment_info', \{[^}]*gh_origin: state\.origin, gh_reason: state\.origin/.test(SCRIPT),
    'both steps carry the origin as reason (the beacon) and gh_origin (the dataLayer)');
  {
    const { ctx, page } = await visitor();
    await tap(page, day(SAT));
    await page.evaluate(() => document.querySelector('.gh-summary .gh-cta').click());
    await page.waitForTimeout(500);
    let b = steps(ctx, 'begin_checkout');
    check(b.length === 1 && b[0].reason === 'card', 'the card\'s own button: begin_checkout with reason card');
    check((await layer(page, 'begin_checkout')).some((x) => x.gh_origin === 'card'), 'and gh_origin card in the dataLayer');
    await ctx.close();
  }
  {
    const { ctx, page } = await visitor();
    await tap(page, day(SAT));
    const bar = await page.$('.gh-bar__btn');
    check(!!bar, 'the stay bar stands after the price (STAY_BAR as shipped)');
    if (bar) {
      await bar.click(); await page.waitForTimeout(500);
      const b = steps(ctx, 'begin_checkout');
      check(b.length === 1 && b[0].reason === 'bar', 'the bar\'s button: begin_checkout with reason bar');
      check((await layer(page, 'begin_checkout')).some((x) => x.gh_origin === 'bar'), 'and gh_origin bar in the dataLayer');
      // back to the dates and a new choice: the origin is forgotten until the next tap
      await page.goBack(); await page.waitForTimeout(600);
      await page.click('.gh-clear'); await page.waitForTimeout(300);
      await tap(page, day(SAT + 7));
      await page.evaluate(() => document.querySelector('.gh-summary .gh-cta').click());
      await page.waitForTimeout(500);
      const again = steps(ctx, 'begin_checkout');
      check(again.length === 2 && again[1].reason === 'card', 'new dates, the card\'s button: reason card, not the bar\'s');
    }
    await ctx.close();
  }

  console.log('an arrival with step=pay: pay_reopened, no start');
  {
    const { ctx, page } = await visitor({ path: '/book?checkIn=' + day(SAT) + '&checkOut=' + day(SAT + 2) + '&step=pay' });
    await page.waitForTimeout(800);
    check(steps(ctx, 'dates_chosen').length === 1, 'the pick counts');
    check(steps(ctx, 'pay_reopened').length === 1 && steps(ctx, 'pay_reopened')[0].check_in === day(SAT) && steps(ctx, 'pay_reopened')[0].mode === 'deposit', 'pay_reopened once, with the check-in and the mode');
    check(steps(ctx, 'begin_checkout').length === 0, 'no begin_checkout');
    check(steps(ctx, 'quote_shown').length === 0, 'no quote_shown: the card was never on the dates step');
    check(await page.evaluate(() => !!document.querySelector('.gh-wrap.is-checkout')), 'and the visitor is on the pay step');
    await ctx.close();
  }
  {
    const { ctx, page } = await visitor({ path: '/book?checkIn=' + day(SAT) + '&checkOut=' + day(SAT + 2) });
    await page.waitForTimeout(800);
    check(steps(ctx, 'dates_chosen').length === 1 && steps(ctx, 'quote_shown').length === 1 && steps(ctx, 'pay_reopened').length === 0, 'dates alone in the link: a pick, the card drawn, no pay_reopened');
    await ctx.close();
  }

  console.log('dates refused (2026-11-26): quote_refused carries the check-in asked');
  check(/function refused\(why, ci\) \{ step\('gh_quote_refused', \{ gh_reason: refusedCode\(why, ci\), gh_check_in: ci \|\| '' \}\); \}/.test(SCRIPT) && /WITH_CHECK_IN = \{[^}]*quote_refused: 1/.test(SCRIPT),
    'refused() sends gh_check_in and WITH_CHECK_IN names quote_refused');
  {
    const { ctx, page } = await visitor();
    await tap(page, day(EVE));
    const r = steps(ctx, 'quote_refused');
    check(r.length === 1 && r[0].reason === 'no_arrival' && r[0].check_in === day(EVE), 'a tap on a night nobody may arrive on: quote_refused no_arrival, that day as the check-in');
    check((await layer(page, 'gh_quote_refused')).some((x) => x.gh_reason === 'no_arrival' && x.gh_check_in === day(EVE)), 'and gh_check_in in the dataLayer');
    check(steps(ctx, 'dates_chosen').length === 0 && steps(ctx, 'quote_shown').length === 0, 'no pick and no card');
    check(Object.keys(r[0] || {}).every((k) => ['visit', 'step', 'unit', 'src', 'mode', 'nights', 'value_cents', 'check_in', 'reason'].includes(k)), 'the beacon carries the known fields only, nothing about a person');
    await ctx.close();
  }
  {
    const { ctx, page } = await visitor({ path: '/book?checkIn=' + day(SAT) + '&checkOut=' + day(SAT + 1) });
    await page.waitForTimeout(800);
    const r = steps(ctx, 'quote_refused');
    check(r.length === 1 && r[0].reason === 'min_stay' && r[0].check_in === day(SAT), 'a link asking one night of a two-night Saturday: quote_refused min_stay, the Saturday as the check-in');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_counters: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
