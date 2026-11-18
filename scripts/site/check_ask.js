#!/usr/bin/env node
/* Checks the call line and the header's phone (2026-11-18, D6) in a real browser, on a local copy of
   the site: /book as built (the facts unanswered) and /book as the builder writes it once every fact
   is a yes (rendered in process by python3; nothing written).

   Run from the repo:  node scripts/site/check_ask.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE), the Chromium at
   ~/.cache/ms-playwright/chromium-1243 (never "playwright install"), and python3.

   Nothing leaves this machine: the booking server is answered here with made-up nights and a
   made-up quote; the beacon is answered 204; every other outside request is refused.

   It proves: as built, no call line anywhere after a price or a refusal; with the words in the page,
   the line stands right under the total with "Ask us" linked to the page's own form and the call
   words to the booking page from js/talk.js, and under a refusal (a night nobody may arrive on) the
   refusal line stands under the calendar's note with "Ask us" linked, and leaves with the next tap;
   the facts block stands above the calendar with its eight lines at 390 px; the header's phone is
   the handset alone at 390 px inside the header's width, the number at 1440 px, and nothing between
   (1280 px). */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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

const RENDER = `
import json, sys
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'scripts', 'site'))})
import build_v2 as B
B.page_modules()
for k in B.D6_FACTS: B.D6_FACTS[k] = True
for n in ('lfpage_book',): sys.modules.pop(n, None)
B.page_modules()
_, book = B.render(sys.modules['lfpage_book'].page_book)
print(json.dumps({'book': book, 'call': B.call_link(), 'price': B.D6_WORDS['ask_price'], 'refusal': B.D6_WORDS['ask_refusal'], 'n': len(B.D6_BLOCK)}))
`;
const YES = JSON.parse(execFileSync('python3', ['-c', RENDER], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString().trim().split('\n').pop());

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
const SAT = firstSaturdayFrom(14), EVE = SAT + 10;   // a night nobody may arrive on, ten days after the Saturday
function nights() {
  const out = [];
  for (let i = 1; i <= 120; i++) { const n = day(i), w = dow(n); const night = { night: n, rate_cents: 39900, min_stay: (w === 5 || w === 6) ? 2 : 1 }; if (n === day(EVE)) night.no_arrival = true; out.push(night); }
  return { nights: out };
}
function quote(ci, co) {
  const n = Math.round((new Date(co) - new Date(ci)) / 86400000), total = n * 39900 + 18965;
  return { quote: { nights: n, total_cents: total, lines: [{ label: n + ' nights', cents: n * 39900 }, { label: 'Cleaning and taxes', cents: 18965 }] },
    modes: ['deposit', 'full'], promise: { retainer_pct: 25, balance_days: 30 },
    plans: { deposit: [{ amount_cents: Math.round(total / 4) }, { amount_cents: total - Math.round(total / 4), due_on: day(60) }], full: [{ amount_cents: total }] }, summary: {} };
}

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  async function visitor(opts) {
    const o = Object.assign({ yes: false, width: 390 }, opts || {});
    const phone = o.width < 768;
    const ctx = await browser.newContext(phone ? { viewport: { width: o.width, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: o.width, height: 900 } });
    await ctx.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (o.yes && (u.pathname === '/book' || u.pathname === '/book.html') && req.resourceType() === 'document') return route.fulfill({ status: 200, contentType: 'text/html', body: YES.book });
        return route.continue();
      }
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (x) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(x) });
        if (u.pathname === '/v1/availability') return json(nights());
        if (u.pathname === '/v1/quote') return json(quote(u.searchParams.get('check_in'), u.searchParams.get('check_out')));
        if (u.pathname === '/v1/funnel') return route.fulfill({ status: 204, body: '' });
        return route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' });
      }
      return route.abort();
    });
    const page = await ctx.newPage();
    await page.goto(base + '/book', { waitUntil: 'load' });
    await page.waitForSelector('.gh-calendar .gh-day', { timeout: 15000 });
    return { ctx, page };
  }
  async function goTo(page, dayIso) { for (let i = 0; i < 14; i++) { if (await page.isVisible(`.gh-day[data-day="${dayIso}"]`)) return; await page.click('.gh-arrow[aria-label="Later months"]'); await page.waitForTimeout(200); } }
  async function tap(page, dayIso) { await goTo(page, dayIso); await page.click(`.gh-day[data-day="${dayIso}"]`); await page.waitForTimeout(700); }
  const ask = (page) => page.evaluate(() => {
    const q = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { text: e.textContent.trim(), top: Math.round(b.top), links: [...e.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]) }; };
    const total = document.querySelector('.gh-summary dd.gh-total');
    return { price: q('.gh-summary .gh-ask--price'), refusal: q('.gh-calendar .gh-ask--refusal'), note: (document.querySelector('.gh-note') || {}).textContent || '',
      totalBottom: total ? Math.round(total.getBoundingClientRect().bottom) : null, block: [...document.querySelectorAll('.lf-byb__list li')].map((l) => l.textContent),
      blockAboveCal: (() => { const b = document.querySelector('.lf-byb'), c = document.querySelector('#gatehouse'); return b && c ? b.getBoundingClientRect().bottom <= c.getBoundingClientRect().top : null; })() };
  });
  const tel = (page) => page.evaluate(() => {
    const t = document.querySelector('.lf-hdr__tel'), h = document.querySelector('.lf-hdr'), s = t && t.querySelector('span');
    return { shown: t && getComputedStyle(t).display !== 'none', number: s ? getComputedStyle(s).display !== 'none' : null, href: t && t.getAttribute('href'),
      inside: t ? t.getBoundingClientRect().right <= h.getBoundingClientRect().right + 0.5 && t.getBoundingClientRect().left >= 0 : null, hdrW: h.scrollWidth, sw: document.documentElement.scrollWidth, w: window.innerWidth };
  });

  console.log('as built (the facts unanswered): no call line');
  {
    const { ctx, page } = await visitor();
    await tap(page, day(SAT));
    let a = await ask(page);
    check(!!a.totalBottom && !a.price, 'a price, and no line under it');
    await tap(page, day(EVE));
    a = await ask(page);
    check(/No check-in on/.test(a.note) && !a.refusal, 'a refusal, and no line under it: ' + a.note);
    check(a.block.length === 3 && a.blockAboveCal === true, 'the block shows its three settled lines above the calendar');
    await ctx.close();
  }

  console.log('every fact a yes: the call line under the total and under a refusal, phone 390');
  {
    const { ctx, page } = await visitor({ yes: true });
    let a = await ask(page);
    check(a.block.length === YES.n && a.blockAboveCal === true, 'the block shows all ' + YES.n + ' lines above the calendar');
    await tap(page, day(SAT));
    a = await ask(page);
    check(a.price && a.price.text === YES.price, 'the line under the total reads the Writer\'s words: ' + JSON.stringify((a.price || {}).text));
    check(a.price && a.price.top >= a.totalBottom && a.price.top - a.totalBottom < 40, 'right under the total');
    check(a.price && a.price.links.length === 2 && a.price.links[0][0] === 'Ask us' && a.price.links[0][1] === '/book#inquiry' && a.price.links[1][0] === 'pick a time for a 30-minute call' && a.price.links[1][1] === YES.call, 'with "Ask us" to the page\'s form and the call words to the booking page from js/talk.js');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'ask-price.png') });
    await tap(page, day(EVE));
    a = await ask(page);
    check(/No check-in on/.test(a.note) && a.refusal && a.refusal.text === YES.refusal, 'under a refusal the refusal line reads the Writer\'s words: ' + JSON.stringify((a.refusal || {}).text));
    check(a.refusal && a.refusal.links.length === 1 && a.refusal.links[0][0] === 'Ask us' && a.refusal.links[0][1] === '/book#inquiry', 'with "Ask us" linked to the form');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'ask-refusal.png') });
    await tap(page, day(SAT + 3));
    a = await ask(page);
    check(!a.refusal, 'and it leaves with the next tap');
    await ctx.close();
  }

  console.log('the phone in the header');
  for (const width of [390, 1280, 1440]) {
    const { ctx, page } = await visitor({ width });
    const t = await tel(page);
    if (width === 390) check(t.shown && t.number === false && t.inside && t.hdrW <= width && t.sw <= width && t.href === 'tel:+17065024823', '390 px: the handset alone, inside the header, a tel link');
    if (width === 1280) check(t.shown === false && t.sw <= width, '1280 px: hidden, the row keeps its six links and the Book button');
    if (width === 1440) check(t.shown && t.number === true && t.inside && t.sw <= width, '1440 px: the number shows inside the header');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_ask: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
