#!/usr/bin/env node
/* Checks the night-sky page, /sky-over-loxley (pages/sky.py, 2026-11-18, D16), in a real browser on
   a local copy of the site. Nothing leaves this machine: the engine's calendar is answered here with
   made-up open nights, every other outside request is refused.

   Run from the repo:  node scripts/site/check_sky.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE), the Chromium at
   ~/.cache/ms-playwright/chromium-1243 (never "playwright install"), and python3 (one render with a
   sourced wildlife row, in process, nothing written).

   It proves, at 390 and 1280 px: the page is noindex, out of the sitemap and linked from no page; the
   table covers at least 14 days from today; no sideways scroll; the sky is drawn (the canvas is not
   blank) and the evening slider redraws it; the open nights come from the engine: "The darkest nights
   still open" lists only nights the feed holds, each with its link to /book on those dates with the
   night's minimum and src=sky, a night the feed lacks reads Taken, and the note says the calendar
   stands now; when the engine does not answer, the table's own snapshot shows with its as-of note;
   the two sections of outside facts are not written while no row is sourced, and appear, with the
   source linked, when one is; the words hash is printed; only the engine and Google Fonts are asked. */
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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };
const PAGE = 'sky-over-loxley.html';
const TABLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'site', 'sky', 'sky.json'), 'utf8'));

// A render with one sourced wildlife row and one sourced shower row, for the "appears" case.
const RENDER = `
import json, sys
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'scripts', 'site'))})
import build_v2 as B
B.page_modules()
sky = sys.modules['lfpage_sky']
real = sky.facts
def fake():
    f = real()
    f['wildlife'][1].update(url='https://example.org/barred-owl', quote='the source words', read='2026-11-18')
    f['showers'][1].update(url='https://example.org/geminids', quote='the source words', read='2026-11-18')
    return f
sky.facts = fake
_, html = B.render(sky.page_sky)
print(json.dumps({'html': html, 'hash': sky.words_sha256(html)}))
`;
const WITH = JSON.parse(execFileSync('python3', ['-c', RENDER], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString().trim().split('\n').pop());
const HASH = execFileSync('python3', ['-c', `
import sys; sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'scripts', 'site'))}); import build_v2 as B; B.page_modules(); sky = sys.modules['lfpage_sky']
_, h = B.render(sky.page_sky); print(sky.words_sha256(h))`], { cwd: ROOT }).toString().trim().split('\n').pop();

function day(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const OPEN = new Set([day(3), day(4), day(9), day(16), day(23), day(30)]);   // the engine's open nights; every other night is taken
function nights() { return { nights: [...OPEN].map((n) => ({ night: n, rate_cents: 42242, min_stay: new Date(n + 'T12:00:00').getDay() === 6 ? 2 : 1 })) }; }

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/') p = '/index.html';
    if (p === '/with-facts') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(WITH.html); }
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

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  async function visitor(opts) {
    const o = Object.assign({ width: 390, engine: true, path: '/sky-over-loxley' }, opts || {});
    const ctx = await browser.newContext(o.width < 768 ? { viewport: { width: o.width, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: o.width, height: 900 } });
    ctx.outside = [];
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.origin === base) return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        if (!o.engine) return route.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'no' });
        if (u.pathname === '/v1/availability') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(nights()) });
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' });
      }
      // refused, and allowed to have been asked: the fonts, and the Tag Manager every page of the site carries with its usual tags
      if (/fonts\.g(oogleapis|static)\.com$|googletagmanager|google-analytics|clarity\.ms|facebook/.test(u.hostname)) return route.abort();
      ctx.outside.push(u.hostname);
      return route.abort();
    });
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', (e) => page.errors.push(String(e.message)));
    await page.goto(base + o.path, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    return { ctx, page };
  }
  const read = (page) => page.evaluate(() => {
    const rows = [...document.querySelectorAll('#best .row')].map((r) => ({ title: r.querySelector('.t').textContent, link: (r.querySelector('a') || {}).getAttribute ? r.querySelector('a').getAttribute('href') : null, tag: (r.querySelector('.tag') || {}).textContent || '', meta: r.querySelector('.m').textContent }));
    const cv = document.getElementById('sky'); let drawn = false;
    try { const g = cv.getContext('2d'); const d = g.getImageData(0, 0, cv.width, Math.max(1, cv.height >> 1)).data; let s = 0; for (let i = 0; i < d.length; i += 4 * 97) s += d[i] + d[i + 1] + d[i + 2]; drawn = s > 0 && cv.width > 100; } catch (e) {}
    return { rows, drawn, asof: (document.getElementById('asof') || {}).textContent || '', wild: !!document.getElementById('wild'), shows: !!document.getElementById('shows'),
      sw: document.documentElement.scrollWidth, w: window.innerWidth, stamp: document.getElementById('stampTime').textContent, say: document.getElementById('say').textContent,
      noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]'), who: [...document.querySelectorAll('#wild .who a')].map((a) => a.getAttribute('href')) };
  });

  console.log('the file');
  const html = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');
  check(html.includes('content="noindex'), 'noindex');
  check(!fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').includes('sky-over-loxley'), 'not in sitemap.xml');
  const linkers = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html') && n !== PAGE && fs.readFileSync(path.join(ROOT, n), 'utf8').includes('href="/sky-over-loxley'));
  check(linkers.length === 0, 'linked from no page' + (linkers.length ? ': ' + linkers.join(', ') : ''));
  const last = TABLE.days[TABLE.days.length - 1].d;
  check(last >= day(14), 'the table runs to ' + last + ', at least 14 days from today');
  const FACTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'site', 'sky', 'facts.json'), 'utf8'));
  const sourced = (rows) => rows.filter((r) => r.url && r.read && r.quote !== null && r.quote !== undefined);
  check(html.includes('id="wild"') === (sourced(FACTS.wildlife).length > 0), 'the wildlife section is written only with a sourced row (' + sourced(FACTS.wildlife).length + ' of ' + FACTS.wildlife.length + ')');
  check(html.includes('id="shows"') === (sourced(FACTS.showers).length > 0), 'the shower section is written only with a sourced row (' + sourced(FACTS.showers).length + ' of ' + FACTS.showers.length + ': ' + sourced(FACTS.showers).map((r) => r.name).join(', ') + ')');
  console.log('  words sha256: ' + HASH + (WITH.hash !== HASH ? ' (a sourced row changes it: ' + WITH.hash.slice(0, 8) + ')' : ''));

  for (const width of [390, 1280]) {
    console.log('the engine answers, ' + width + ' px');
    const { ctx, page } = await visitor({ width });
    const s = await read(page);
    check(s.sw <= s.w, 'no sideways scroll (' + s.sw + ' of ' + s.w + ')');
    check(s.drawn && /\d+:\d\d (AM|PM)/.test(s.stamp), 'the sky is drawn, the evening stamped ' + s.stamp);
    const before = s.stamp;
    await page.evaluate(() => { const t = document.getElementById('time'); t.value = 1000; t.dispatchEvent(new Event('input')); });
    await page.waitForTimeout(200);
    const s2 = await read(page);
    check(s2.stamp !== before && s2.drawn, 'the slider moves the evening and redraws: ' + before + ' to ' + s2.stamp);
    check(s.rows.length > 0 && s.rows.every((r) => OPEN.has(r.link.match(/checkIn=(\d{4}-\d\d-\d\d)/)[1])), 'the darkest nights listed are all nights the engine holds open (' + s.rows.length + ')');
    const sat = s.rows.find((r) => new Date(r.link.match(/checkIn=(\d{4}-\d\d-\d\d)/)[1] + 'T12:00:00').getDay() === 6);
    check(s.rows.every((r) => /^\/book\?checkIn=\d{4}-\d\d-\d\d&checkOut=\d{4}-\d\d-\d\d&src=sky$/.test(r.link)), 'each links to /book on its dates, tagged sky');
    if (sat) { const m = sat.link.match(/checkIn=(\S+?)&checkOut=(\S+?)&/); const nights = (new Date(m[2] + 'T12:00:00') - new Date(m[1] + 'T12:00:00')) / 86400000; check(nights === 2 && /2 nights at least/.test(sat.meta), 'a Saturday carries its two-night minimum into the link and the line'); }
    check(s.rows.every((r) => /\$422 a night/.test(r.meta)), 'with the engine\'s rate');
    check(/stands now/.test(s.asof), 'the note says the calendar stands now: ' + JSON.stringify(s.asof));
    // a night the engine lacks: pick it on the date box and read the fact
    const taken = day(5);
    await page.evaluate((d) => { const b = document.getElementById('date'); b.value = d; b.dispatchEvent(new Event('change')); }, taken);
    await page.waitForTimeout(200);
    const t = await page.evaluate(() => [...document.querySelectorAll('#facts .fact .s')].pop().textContent);
    check(/^Taken/.test(t), 'a night the engine does not list reads Taken: ' + JSON.stringify(t));
    check(s.wild === (sourced(FACTS.wildlife).length > 0) && s.shows === (sourced(FACTS.showers).length > 0), 'the outside-fact sections on the page match the sourced rows');
    check(ctx.outside.length === 0 && page.errors.length === 0, 'nothing asked of any host but the engine and Google Fonts; no script error' + (page.errors.length ? ' (' + page.errors.join(' | ') + ')' : ''));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'sky-' + width + '.png'), fullPage: width === 390 });
    await ctx.close();
  }

  console.log('the engine does not answer: the table\'s snapshot');
  {
    const { ctx, page } = await visitor({ width: 390, engine: false });
    const s = await read(page);
    const snapOpen = new Set(TABLE.days.filter((d) => d.st === 'open').map((d) => d.d));
    check(s.rows.length > 0 && s.rows.every((r) => snapOpen.has(r.link.match(/checkIn=(\d{4}-\d\d-\d\d)/)[1])), 'the darkest nights listed are the snapshot\'s open nights');
    check(/stood at .* ET; the calendar did not answer just now\.$/.test(s.asof), 'and the note names the snapshot\'s time: ' + JSON.stringify(s.asof));
    check(page.errors.length === 0, 'no script error');
    await ctx.close();
  }

  console.log('with a sourced row: the section appears, the source linked');
  {
    const { ctx, page } = await visitor({ width: 390, path: '/with-facts' });
    // pick a January night so the barred owl (in season all year, at its best in winter) is listed
    await page.evaluate(() => { const b = document.getElementById('date'); b.value = '2027-01-10'; b.dispatchEvent(new Event('change')); });
    await page.waitForTimeout(300);
    const s = await read(page);
    check(s.wild && s.shows, 'the wildlife and shower sections are written');
    check(s.who.length >= 1 && s.who.every((h) => /^https:\/\/example\.org\//.test(h)), 'each wildlife line links its source: ' + s.who.join(', '));
    const shows = await page.evaluate(() => [...document.querySelectorAll('#shows .row .t')].map((e) => e.textContent));
    const wantShows = sourced(FACTS.showers).length + 1;   // the rows sourced in the data, plus the one this check sources
    check(shows.length === wantShows && shows.some((t) => /Geminids/.test(t)), 'only the sourced showers are listed (' + shows.length + '): ' + shows.join('; '));
    check(page.errors.length === 0, 'no script error');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_sky: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
