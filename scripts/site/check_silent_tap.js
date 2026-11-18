#!/usr/bin/env node
/* Checks the silent tap's answer on /book (js/gatehouse.js, 2026-11-18) in a real browser, on a local
   copy of the site, in both states of OFFER_STAY.

   Run from the repo:  node scripts/site/check_silent_tap.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   The fault (the mystery guests and the Forge, 2026-11-18): a tap on Sat Jan 16 offered two nights;
   a tap on Sun Jan 17 to end the stay on Sunday did nothing and said nothing, because the shortest
   stay from that arrival was the one already shown. Now the calendar keeps the stay and says, in the
   Forge's words with the calendar's own date shapes, "A stay starting Sat, Jan 16 is at least 2
   nights. Sat, Jan 16 to Mon, Jan 18, 2027 is the shortest." and, since a Saturday was asked for one
   night, the Writer's weeknight line: "Just one night? Tap a Sunday through Thursday. Each night
   tells you what it needs." Both are new words, for Mick's yes by the hash this check prints.

   Nothing leaves this machine: the booking server is answered here with made-up nights (weeknights
   at one night, Fridays and Saturdays at two) and a made-up quote; the beacon is recorded and
   answered 204; every other outside request is refused.

   It proves: offered (as shipped), a Saturday tap offers Saturday to Monday; a Sunday tap keeps the
   same stay, says both sentences, re-quotes nothing and sends stay_offered with reason same; a tap on
   the Monday itself (the check-out already shown) says nothing new; a Tuesday tap lengthens the stay
   with no such sentence; a Friday asked for one night says both sentences; a Tuesday arrival (no
   minimum) never does; a one-night check-out attempted on a weekday arrival under a two-night minimum
   that was never offered gets the offer, not the sentence. Off (OFFER_STAY false), the old refusal
   words stand unchanged. The two sentences are one place each in the file. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
const SAME_RE = /return 'A stay starting ' \+ short\(ci\) \+ ' is at least ' \+ nightsWord\(min\) \+ '\. ' \+ span\(ci, co\) \+ ' is the shortest\.';/g;
const WEEK_RE = /var WEEKNIGHT = '([^']+)';/g;
const WEEKNIGHT = 'Just one night? Tap a Sunday through Thursday. Each night tells you what it needs.';
const served = (on) => SCRIPT.replace(/var OFFER_STAY = (true|false);/, 'var OFFER_STAY = ' + on + ';');

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
// A Saturday far enough out that its whole week sits in one month's grid on a phone.
function saturdayInOneMonth() {
  for (let s = firstSaturdayFrom(14); s < 120; s += 7) {
    if (day(s - 1).slice(0, 7) === day(s + 4).slice(0, 7)) return s;
  }
  return firstSaturdayFrom(14);
}
const SAT = saturdayInOneMonth(), FRI = SAT - 1, TUE = SAT + 3;
const MONDAY_MIN2 = SAT + 9;   // a Monday given a two-night minimum, never offered first (the weekday case)
function nights() {
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const n = day(i), w = dow(n);
    const night = { night: n, rate_cents: 39900, min_stay: (w === 5 || w === 6) ? 2 : 1 };
    if (n === day(MONDAY_MIN2)) night.min_stay = 2;
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
// The sentence as the page builds it, from the dates (the calendar's own shapes).
const SHORT = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const LONGSPAN = (a, b) => {
  const A = new Date(a + 'T12:00:00'), B = new Date(b + 'T12:00:00');
  return SHORT(a) + ' to ' + SHORT(b) + ', ' + B.getFullYear();
};

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });

  async function visitor(on) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
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
        if (u.pathname === '/v1/quote') { ctx.quotes = (ctx.quotes || 0) + 1; return json(quote(u.searchParams.get('check_in'), u.searchParams.get('check_out'))); }
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
    for (let i = 0; i < 14; i++) {
      if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return;
      await page.click('.gh-arrow[aria-label="Later months"]'); await page.waitForTimeout(200);
    }
  }
  async function tap(page, dayIso) { await goTo(page, dayIso); await page.click(`.gh-day[data-day="${dayIso}"]`); await page.waitForTimeout(600); }
  async function state(page) {
    return page.evaluate(() => {
      const edges = [...document.querySelectorAll('.gh-day--edge')].map(b => b.getAttribute('data-day'));
      const total = document.querySelector('.gh-summary dd.gh-total');
      return { edges, note: (document.querySelector('.gh-note') || {}).textContent || '', total: total ? total.textContent : '', url: location.search };
    });
  }
  const offers = (ctx) => ctx.beacons.filter(b => b.step === 'stay_offered').map(b => b.reason);
  const same = (ci, min) => 'A stay starting ' + SHORT(ci) + ' is at least ' + min + ' nights. ' + LONGSPAN(ci, day(ci === day(SAT) ? SAT + 2 : ci === day(FRI) ? FRI + 2 : MONDAY_MIN2 + 2)) + ' is the shortest.';

  console.log('the file');
  check((SCRIPT.match(SAME_RE) || []).length === 1, 'the Forge\'s sentence is one place in the file');
  const wk = SCRIPT.match(WEEK_RE) || [];
  check(wk.length === 1 && wk[0].includes(WEEKNIGHT), 'the Writer\'s weeknight line is one place and reads: ' + WEEKNIGHT);
  const words = "A stay starting {arrival} is at least {n} nights. {stay} is the shortest. | " + WEEKNIGHT;
  console.log('  words sha256 (the two sentences, the dates as merge values): ' + crypto.createHash('sha256').update(words, 'utf8').digest('hex'));

  console.log('offered (OFFER_STAY true): the silent tap answers');
  {
    const { ctx, page } = await visitor(true);
    await tap(page, day(SAT));
    let s = await state(page);
    check(s.edges.join(',') === day(SAT) + ',' + day(SAT + 2) && /^Arriving .* takes 2 nights\./.test(s.note), 'a Saturday tap offers Saturday to Monday: ' + s.note);
    const quotesBefore = ctx.quotes, total = s.total;
    await tap(page, day(SAT + 1));
    s = await state(page);
    check(s.edges.join(',') === day(SAT) + ',' + day(SAT + 2), 'a Sunday tap keeps the same stay');
    check(s.note === same(day(SAT), 2) + ' ' + WEEKNIGHT, 'and says both sentences: ' + JSON.stringify(s.note));
    check(ctx.quotes === quotesBefore && s.total === total, 'nothing re-quoted; the price stands');
    check(offers(ctx).join(',') === 'direct,same', 'stay_offered reached the beacon as direct, then same');
    await tap(page, day(TUE));
    s = await state(page);
    check(s.edges.join(',') === day(SAT) + ',' + day(TUE) && !/is the shortest/.test(s.note), 'the offer still holds its arrival: a Tuesday tap lengthens the stay with no such sentence');
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(SAT));
    await tap(page, day(SAT + 2));
    s = await state(page);
    check(s.edges.join(',') === day(SAT) + ',' + day(SAT + 2) && !/is the shortest/.test(s.note), 'a tap on the Monday already shown chooses it and says nothing new: ' + JSON.stringify(s.note));
    await ctx.close();
  }
  {
    const { ctx, page } = await visitor(true);
    await tap(page, day(FRI));
    let s = await state(page);
    check(s.edges.join(',') === day(FRI) + ',' + day(FRI + 2), 'a Friday tap offers Friday to Sunday');
    await tap(page, day(FRI + 1));
    s = await state(page);
    check(s.note === same(day(FRI), 2) + ' ' + WEEKNIGHT, 'a Friday asked for one night says both sentences');
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    await tap(page, day(TUE));
    s = await state(page);
    check(s.edges.join(',') === day(TUE) && /Now choose your check-out day/.test(s.note), 'a Tuesday arrival waits for the check-out');
    await tap(page, day(TUE + 1));
    s = await state(page);
    check(s.edges.join(',') === day(TUE) + ',' + day(TUE + 1) && s.note === '', 'one weeknight prices with no sentence');
    await page.click('.gh-clear'); await page.waitForTimeout(300);
    // a Monday with a two-night minimum, never offered first: the one-night check-out gets the offer, not the sentence
    await tap(page, day(MONDAY_MIN2));
    s = await state(page);
    check(s.edges.join(',') === day(MONDAY_MIN2) + ',' + day(MONDAY_MIN2 + 2) && /takes 2 nights/.test(s.note), 'a weekday with a minimum is offered its two nights at the tap');
    await tap(page, day(MONDAY_MIN2 + 1));
    s = await state(page);
    check(s.note === same(day(MONDAY_MIN2), 2), 'asked for one night, it says the Forge\'s sentence without the weeknight line (not a Friday or Saturday): ' + JSON.stringify(s.note));
    await ctx.close();
  }

  console.log('off (OFFER_STAY false): the old words stand');
  {
    const { ctx, page } = await visitor(false);
    await tap(page, day(SAT));
    await tap(page, day(SAT + 1));
    const s = await state(page);
    check(s.edges.join(',') === day(SAT) && /is at least 2 nights\.$/.test(s.note) && !/shortest/.test(s.note), 'a one-night check-out is refused with the old words: ' + JSON.stringify(s.note));
    check(offers(ctx).length === 0, 'and no stay_offered');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_silent_tap: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
