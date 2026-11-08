#!/usr/bin/env node
/* Checks "offer the stay that works" (js/gatehouse.js OFFER_STAY) in a real browser, on a local copy
   of /book, in both states of its switch.

   Run from the repo:  node scripts/site/check_offer_stay.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine: the booking server is answered here with made-up nights (weeknights
   at one night, Fridays and Saturdays at two, one three-night holiday with no arrival on its eve,
   one taken Sunday, one taken stretch) and a made-up quote; the beacon is recorded and answered 204;
   every other outside request is refused. The shipped file has OFFER_STAY false; the "offered"
   checks serve the same file with OFFER_STAY set to true, and say so.

   It proves: shipped, a tap on a two-night Saturday waits for the check-out as before, a one-night
   check-out is refused with the old words and quote_refused reaches the beacon, and no night carries
   a minimum label; offered, each arrival night with a minimum shows "2+" or "3+" before the tap, a
   tap on a two-night Saturday selects Saturday to Monday and prices it, a Saturday whose Sunday is
   taken selects Friday to Sunday instead, a night walled in by taken nights offers the nearest stay
   that works, a one-night weeknight still waits for the check-out, a check-out under the minimum
   extends the stay instead of refusing (and sends no quote_refused), the holiday's eve still refuses
   arrival as before, and the words are exactly the ones Mick hears. */
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
const SWITCH = 'var OFFER_STAY = false;';

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

// ---- the made-up calendar: dates relative to today, so the check never ages
function day(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function dow(s) { return new Date(s + 'T12:00:00').getDay(); }   // 0 Sunday .. 6 Saturday
// A Saturday at least two weeks out, with its Sunday open; the Saturday after it has its Sunday taken.
function firstSaturdayFrom(n) { for (let i = n; i < n + 8; i++) if (dow(day(i)) === 6) return i; }
const SAT1 = firstSaturdayFrom(14), SAT2 = SAT1 + 7, SAT3 = SAT1 + 14;
const TAKEN_SUNDAY = day(SAT2 + 1);                         // the Sunday after the second Saturday
const WALLED = day(SAT3 + 3);                               // a Tuesday walled in: Monday and Wednesday taken
const TAKEN = new Set([TAKEN_SUNDAY, day(SAT3 + 2), day(SAT3 + 4)]);
const HOLIDAY = day(SAT1 + 30);                             // a three-night holiday; no arrival on its eve
const EVE = day(SAT1 + 29);
function nights() {
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const n = day(i);
    if (TAKEN.has(n)) continue;
    const w = dow(n);
    const night = { night: n, rate_cents: 39900, min_stay: (w === 5 || w === 6) ? 2 : 1 };
    if (n === HOLIDAY) { night.min_stay = 3; night.rate_cents = 64900; }
    if (n === EVE) night.no_arrival = true;
    out.push(night);
  }
  return { nights: out };
}
function quote(ci, co) {
  const n = Math.round((new Date(co) - new Date(ci)) / 86400000);
  return { quote: { nights: n, check_in: ci, check_out: co, total_cents: n * 39900 + 18965, currency: 'USD',
    lines: [{ label: n + ' nights', cents: n * 39900 }, { label: 'Cleaning and taxes', cents: 18965 }] } };
}
let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });

  async function visitor(offered) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    ctx.beacons = [];
    await ctx.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (u.pathname === '/js/gatehouse.js' && offered) return route.fulfill({ status: 200, contentType: 'text/javascript', body: SCRIPT.replace(SWITCH, 'var OFFER_STAY = true;') });
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
  async function goTo(page, dayIso) {   // turn the calendar until the day is on screen (a phone shows one month)
    for (let i = 0; i < 8; i++) {
      if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return;
      await page.click('.gh-arrow[aria-label="Later months"]'); await page.waitForTimeout(200);
    }
  }
  async function tap(page, dayIso) { await goTo(page, dayIso); await page.click(`.gh-day[data-day="${dayIso}"]`); await page.waitForTimeout(500); }
  async function state(page) {
    return page.evaluate(() => {
      const edges = [...document.querySelectorAll('.gh-day--edge')].map(b => b.getAttribute('data-day'));
      const total = document.querySelector('.gh-booking dd.gh-total');
      return { edges, note: (document.querySelector('.gh-note') || {}).textContent || '', total: total ? total.textContent : '', url: location.search };
    });
  }
  async function waitTotal(page) { try { await page.waitForSelector('.gh-booking dd.gh-total', { timeout: 6000 }); } catch (e) {} await page.waitForTimeout(200); }
  const refusals = (ctx) => ctx.beacons.filter(b => b.step === 'quote_refused');

  console.log('the file');
  check((SCRIPT.match(/var OFFER_STAY = (true|false);/g) || []).length === 1 && SCRIPT.includes(SWITCH), 'the switch is one line, OFFER_STAY false as shipped');

  console.log('shipped (OFFER_STAY false)');
  {
    const { ctx, page } = await visitor(false);
    await goTo(page, day(SAT1));
    check((await page.$$('.gh-min')).length === 0, 'no minimum label on any night');
    await tap(page, day(SAT1));
    let s = await state(page);
    check(s.edges.length === 1 && s.edges[0] === day(SAT1) && /Now choose your check-out day/.test(s.note), 'a two-night Saturday waits for the check-out, as before');
    await tap(page, day(SAT1 + 1));
    s = await state(page);
    check(s.edges.length === 1 && /is at least 2 nights/.test(s.note), 'a one-night check-out is refused with the old words: ' + JSON.stringify(s.note));
    check(refusals(ctx).length === 1 && refusals(ctx)[0].reason === 'min_stay', 'quote_refused min_stay reached the beacon');
    await ctx.close();
  }

  console.log('offered (OFFER_STAY true)');
  {
    const { ctx, page } = await visitor(true);
    await goTo(page, day(SAT1));
    const labels = await page.evaluate(() => [...document.querySelectorAll('.gh-min')].map(e => [e.parentNode.getAttribute('data-day'), e.textContent]));
    const sat = labels.find(l => l[0] === day(SAT1));
    const weekdayTue = day(SAT1 + 3);
    check(sat && sat[1] === '2+', 'a two-night Saturday carries "2+" before the tap');
    check(!labels.find(l => l[0] === weekdayTue), 'a one-night Tuesday carries no label');
    const sr = await page.evaluate((d) => document.querySelector(`.gh-day[data-day="${d}"] .gh-sr`).textContent, day(SAT1));
    check(/2 nights at least/.test(sr), 'and says "2 nights at least" to a screen reader');

    await tap(page, day(SAT1)); await waitTotal(page);
    let s = await state(page);
    check(s.edges.join(',') === day(SAT1) + ',' + day(SAT1 + 2), 'a tap on the Saturday selects Saturday to Monday');
    check(/^Arriving .* takes 2 nights\. Here's .*; the price is below\.$/.test(s.note), 'with the offered words: ' + JSON.stringify(s.note));
    check(/\$/.test(s.total), 'and its price is on the card: ' + s.total);
    check(/checkIn=/.test(s.url) && /checkOut=/.test(s.url), 'and the link holds both dates');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'offer-stay-saturday.png'), fullPage: false });
    check(refusals(ctx).length === 0, 'no quote_refused');

    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(SAT2)); await waitTotal(page);
    s = await state(page);
    check(s.edges.join(',') === day(SAT2 - 1) + ',' + day(SAT2 + 1), 'a Saturday whose Sunday is taken selects Friday to Sunday instead');
    check(/The nights after it are taken, so here's .* instead; the price is below\.$/.test(s.note), 'with the shifted words: ' + JSON.stringify(s.note));

    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(SAT1 + 3));
    s = await state(page);
    check(s.edges.length === 1 && /Now choose your check-out day/.test(s.note), 'a one-night Tuesday still waits for the check-out');
    await tap(page, day(SAT1 + 4)); await waitTotal(page);
    s = await state(page);
    check(s.edges.length === 2 && /\$/.test(s.total), 'and a one-night stay prices as before');

    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(SAT1 - 1));   // the Friday: arrival, two-night minimum, but it is a tap on a min-2 night, so it offers Fri to Sun
    s = await state(page);
    check(s.edges.join(',') === day(SAT1 - 1) + ',' + day(SAT1 + 1), 'a Friday tap offers Friday to Sunday');
    // A check-out under the minimum, from a one-night arrival whose next night is a two-night Friday: start on Thursday
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(SAT1 + 5));   // Thursday, one night: waits
    await tap(page, day(SAT1 + 6));   // Friday as check-out: one night from Thursday is fine (Thursday's own minimum is one)
    s = await state(page);
    check(s.edges.length === 2, 'Thursday to Friday, one night, is fine');

    // the walled-in Tuesday: Monday and Wednesday taken; the Tuesday night itself is open at one night, so it is a valid one-night stay
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await goTo(page, WALLED);
    const walledOpen = await page.$(`.gh-day[data-day="${WALLED}"]:not(:disabled)`);
    check(!!walledOpen, 'a one-night Tuesday between taken nights is still tappable');

    // the holiday: three nights, and no arrival on its eve
    await tap(page, EVE);
    s = await state(page);
    check(/No check-in on/.test(s.note) && s.edges.length === 0, 'the eve still refuses arrival, as before');
    await tap(page, HOLIDAY); await waitTotal(page);
    s = await state(page);
    check(s.edges.join(',') === HOLIDAY + ',' + day(SAT1 + 33) && /takes 3 nights/.test(s.note), 'the three-night holiday offers its three nights: ' + JSON.stringify(s.note));
    check(refusals(ctx).filter(r => r.reason === 'min_stay').length === 0, 'no minimum-stay refusal reached the beacon in the offered state');
    await ctx.close();
  }

  // a Saturday walled by a taken stretch after it, with a taken Friday before: nothing includes it, so the nearest stay is offered
  console.log('offered, the night that can make no stay');
  {
    const ctxN = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const W = day(SAT3 + 7);   // the Saturday three weeks after the first: wall it in
    const walledNights = () => { const n = nights(); n.nights = n.nights.filter(x => x.night !== day(SAT3 + 6) && x.night !== day(SAT3 + 8) && x.night !== day(SAT3 + 9)); return n; };
    await ctxN.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (u.pathname === '/js/gatehouse.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: SCRIPT.replace(SWITCH, 'var OFFER_STAY = true;') });
        return route.continue();
      }
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) });
        if (u.pathname === '/v1/availability') return json(walledNights());
        if (u.pathname === '/v1/quote') return json(quote(u.searchParams.get('check_in'), u.searchParams.get('check_out')));
        if (u.pathname === '/v1/funnel') return route.fulfill({ status: 204, body: '' });
        return route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' });
      }
      return route.abort();
    });
    const page = await ctxN.newPage();
    await page.goto(base + '/book', { waitUntil: 'load' }); await page.waitForSelector('.gh-calendar .gh-day', { timeout: 15000 });
    await tap(page, W); await waitTotal(page);
    const s = await state(page);
    check(s.edges.length === 2 && s.edges[0] !== W && /^No stay works around .*: the nights beside it are taken\. The nearest that does is .*; the price is below\.$/.test(s.note), 'a walled-in Saturday offers the nearest stay that works: ' + JSON.stringify(s.note));
    check(/\$/.test(s.total), 'with its price: ' + s.total);
    await ctxN.close();
  }

  await browser.close();
  srv.close();
  console.log('check_offer_stay: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
