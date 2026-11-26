#!/usr/bin/env node
/* Checks "offer the stay that works" (js/gatehouse.js OFFER_STAY) in a real browser, on a local copy
   of /book, in both states of its switch.

   Run from the repo:  node scripts/site/check_offer_stay.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine: the booking server is answered here with made-up nights (weeknights
   at one night, Fridays and Saturdays at two, one three-night holiday with no arrival on its eve,
   one taken Sunday, one taken stretch) and a made-up quote; the beacon is recorded and answered 204;
   every other outside request is refused. The check reads OFFER_STAY as shipped (true since
   2026-11-08, Mick's yes) and serves js/gatehouse.js in each state in turn, saying which.

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
// The switch is read as shipped and served in each state in turn (true since 2026-11-08, Mick's yes), so
// both states are proven whatever is shipped.
const SWITCH_RE = /var OFFER_STAY = (true|false);/;
const SHIPPED_OFFER = (SCRIPT.match(SWITCH_RE) || [])[1];
const withOffer = (on) => SCRIPT.replace(SWITCH_RE, 'var OFFER_STAY = ' + on + ';');
const NEAREST_SWITCH = 'var OFFER_NEAREST = false;';   // the third case (the nearest stay for a night that can make none), off

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
const SAT4 = SAT3 + 14;                                     // a Saturday that is taken: its Friday has nowhere to go but back
const TAKEN = new Set([TAKEN_SUNDAY, day(SAT3 + 2), day(SAT3 + 4), day(SAT4)]);
const HOLIDAY = day(SAT1 + 30);                             // a three-night holiday; no arrival on its eve
const EVE = day(SAT1 + 29);
const CAPPED = day(SAT1 + 44);                              // a Monday the engine caps at its own minimum: three nights, at most three (Christmas, 2026-11-09)
function nights() {
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const n = day(i);
    if (TAKEN.has(n)) continue;
    const w = dow(n);
    const night = { night: n, rate_cents: 39900, min_stay: (w === 5 || w === 6) ? 2 : 1 };
    if (n === HOLIDAY) { night.min_stay = 3; night.rate_cents = 64900; }
    if (n === CAPPED) { night.min_stay = 3; night.max_stay = 3; night.rate_cents = 64900; }
    if (n === day(SAT1 + 43)) night.max_stay = 1;   // the capped night's eve: a stay starting there is at most one night, so nothing runs through the fixed stay (as the engine holds Dec 22)
    if (n === EVE) night.no_arrival = true;
    out.push(night);
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

  async function visitor(offered) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    ctx.beacons = [];
    await ctx.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (u.pathname === '/js/gatehouse.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: withOffer(!!offered) });
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
    if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return;
    for (let i = 0; i < 14; i++) {   // back to the first month, then forward
      const earlier = await page.$('.gh-arrow[aria-label="Earlier months"]:not(:disabled)');
      if (!earlier) break;
      await earlier.click(); await page.waitForTimeout(150);
    }
    for (let i = 0; i < 14; i++) {
      if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return;
      await page.click('.gh-arrow[aria-label="Later months"]'); await page.waitForTimeout(200);
    }
  }
  async function tap(page, dayIso) { await goTo(page, dayIso); await page.click(`.gh-day[data-day="${dayIso}"]`); await page.waitForTimeout(500); }
  async function state(page) {
    return page.evaluate(() => {
      const edges = [...document.querySelectorAll('.gh-day--edge')].map(b => b.getAttribute('data-day'));
      const total = document.querySelector('.gh-summary dd.gh-total');   // the price card under the calendar (the checkout step's section is .gh-booking)
      return { edges, note: (document.querySelector('.gh-note') || {}).textContent || '', total: total ? total.textContent : '', url: location.search };
    });
  }
  async function waitTotal(page) { try { await page.waitForSelector('.gh-summary dd.gh-total', { timeout: 6000 }); } catch (e) {} await page.waitForTimeout(200); }
  const refusals = (ctx) => ctx.beacons.filter(b => b.step === 'quote_refused');

  console.log('the file');
  check((SCRIPT.match(/var OFFER_STAY = (true|false);/g) || []).length === 1 && !!SHIPPED_OFFER, 'the switch is one line; shipped OFFER_STAY = ' + SHIPPED_OFFER + ' (Mick\'s yes, 2026-11-08, to the two offer sentences and the corner labels)');
  check((SCRIPT.match(/var OFFER_NEAREST = (true|false);/g) || []).length === 1 && SCRIPT.includes(NEAREST_SWITCH), 'the third case has its own line, OFFER_NEAREST false as shipped (the first two cases alone until Mick\'s yes)');

  console.log('off (OFFER_STAY false)');
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
    check(/^Arriving .* takes 2 nights\. Here's .*; the price is below\. Tap a later day to stay longer\.$/.test(s.note), 'with the offered words: ' + JSON.stringify(s.note));
    check(/\$/.test(s.total), 'and its price is on the card: ' + s.total);
    check(/checkIn=/.test(s.url) && /checkOut=/.test(s.url), 'and the link holds both dates');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'offer-stay-saturday.png'), fullPage: false });
    check(refusals(ctx).length === 0, 'no quote_refused');
    const offeredSteps = () => ctx.beacons.filter(b => b.step === 'stay_offered').map(b => b.reason);
    check(offeredSteps().join(',') === 'direct', 'stay_offered reached the beacon with reason direct');

    // the offer holds the arrival: a later tap lengthens the stay (the Critic, 2026-11-08)
    await tap(page, day(SAT1 + 3)); await waitTotal(page);
    s = await state(page);
    // the link holds both dates whatever month the phone is showing (a turned page drops the other month's grid)
    check(s.url === '?checkIn=' + day(SAT1) + '&checkOut=' + day(SAT1 + 3), 'a later tap makes it Saturday to Tuesday, not a new arrival: ' + s.url);
    check(/\$/.test(s.total) && s.note === '', 'priced, with no note');

    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(SAT2)); await waitTotal(page);
    s = await state(page);
    check(s.edges.join(',') === day(SAT2 - 1) + ',' + day(SAT2 + 1), 'a Saturday whose Sunday is taken selects Friday to Sunday instead');
    check(/takes 2 nights\. The nights after it are taken, so here's .* instead; the price is below\. Tap a later day to stay longer\.$/.test(s.note), 'with the shifted words: ' + JSON.stringify(s.note));
    check(offeredSteps().slice(-1)[0] === 'shifted', 'stay_offered reason shifted');

    // a Friday whose Saturday is taken: the stay shifts back to Thursday, and the words still say the Friday's own two nights
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(SAT4 - 1)); await waitTotal(page);
    s = await state(page);
    check(s.edges.join(',') === day(SAT4 - 2) + ',' + day(SAT4), 'a Friday whose Saturday is taken selects Thursday to Saturday');
    check(/^Arriving .* takes 2 nights\./.test(s.note), 'and says the Friday takes 2 nights, not the Thursday\'s one: ' + JSON.stringify(s.note));

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
    check(/Tap a later day to stay longer\.$/.test(s.note), 'and, with no cap from the engine, still says to tap a later day');

    // the Christmas guard (the Chief, 2026-11-09): a night the engine caps at its own minimum offers its stay with no "later day" tail
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, CAPPED); await waitTotal(page);
    s = await state(page);
    check(s.edges.join(',') === CAPPED + ',' + day(SAT1 + 47) && /takes 3 nights\. Here's .*; the price is below\.$/.test(s.note) && !/later day/.test(s.note), 'a night capped at its minimum (max_stay 3 of 3) offers its three nights and leaves off "Tap a later day": ' + JSON.stringify(s.note));
    check(/\$/.test(s.total), 'and its price is on the card');
    check(refusals(ctx).filter(r => r.reason === 'min_stay').length === 0, 'no minimum-stay refusal reached the beacon in the offered state');
    await ctx.close();
  }

  // a Saturday walled by a taken stretch after it, with a taken Friday before: nothing includes it. With the third
  // case off (OFFER_NEAREST false, as shipped) the tap starts a stay there as it always did, and the taken nights
  // after refuse every check-out; with it on, the nearest stay that works is offered.
  console.log('offered, the night that can make no stay');
  for (const nearestOn of [false, true]) {
    const ctxN = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const W = day(SAT3 + 7);   // the Saturday three weeks after the first: wall it in
    const walledNights = () => { const n = nights(); n.nights = n.nights.filter(x => x.night !== day(SAT3 + 6) && x.night !== day(SAT3 + 8) && x.night !== day(SAT3 + 9)); return n; };
    await ctxN.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (u.pathname === '/js/gatehouse.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: withOffer(true).replace(NEAREST_SWITCH, 'var OFFER_NEAREST = ' + nearestOn + ';') });
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
    await tap(page, W);
    if (!nearestOn) {
      await page.waitForTimeout(600);
      const s = await state(page);
      check(s.edges.length === 1 && s.edges[0] === W && /^Arriving .*Now choose your check-out day\.$/.test(s.note) && !/\$/.test(s.total || ''), 'the third case off (as shipped): the walled-in Saturday starts a stay there as always, no other dates offered: ' + JSON.stringify(s.note));
    } else {
      await waitTotal(page);
      const s = await state(page);
      check(s.edges.length === 2 && s.edges[0] !== W && /^No stay works around .*: the nights beside it are taken\. The nearest that does is .*; the price is below\. Tap a later day to stay longer\.$/.test(s.note), 'OFFER_NEAREST on: a walled-in Saturday offers the nearest stay that works: ' + JSON.stringify(s.note));
      check(/\$/.test(s.total), 'with its price: ' + s.total);
    }
    await ctxN.close();
  }

  // ---- the month link (item 3): /book?month=YYYY-MM opens that month; dates in the link still win
  console.log('the month link');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) });
        if (u.pathname === '/v1/availability') return json(nights());
        if (u.pathname === '/v1/quote') return json(quote(u.searchParams.get('check_in'), u.searchParams.get('check_out')));
        if (u.pathname === '/v1/funnel') return route.fulfill({ status: 204, body: '' });
        return route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' });
      }
      return route.abort();
    });
    const page = await ctx.newPage();
    const shown = async () => page.evaluate(() => document.querySelector('.gh-month__name').textContent);
    const label = (ym) => new Date(ym + '-15T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const plus = (n) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };
    const open = async (q) => { await page.goto(base + '/book' + q, { waitUntil: 'load' }); await page.waitForSelector('.gh-calendar .gh-day', { timeout: 15000 }); await page.waitForTimeout(200); };
    await open('?month=' + plus(2));
    check((await shown()) === label(plus(2)), '?month=' + plus(2) + ' opens ' + label(plus(2)));
    await open('?month=2026-13');
    check((await shown()) === label(plus(0)), 'a month that is not one opens the current month');
    await open('?month=' + plus(30));
    check((await shown()) === label(plus(12)), 'a month past the calendar\'s last opens the last: ' + (await shown()));
    await open('?month=' + plus(4) + '&checkIn=' + day(SAT1) + '&checkOut=' + day(SAT1 + 2));
    check((await shown()) === label(day(SAT1).slice(0, 7)), 'dates in the link win over the month');
    await open('?month=' + plus(1));
    const d1 = await page.evaluate(() => { const b = [...document.querySelectorAll('.gh-day:not(:disabled)')].find(b => b.offsetParent !== null); return b && b.getAttribute('data-day'); });
    await page.click(`.gh-day[data-day="${d1}"]`); await page.waitForTimeout(300);
    check(!/month=/.test(await page.evaluate(() => location.search)), 'once a date is tapped the link drops the month and carries the date');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_offer_stay: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
