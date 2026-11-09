#!/usr/bin/env node
/* Checks the home page's bridge walk on a phone (js/crossing.js PHONE_STILL) in a real browser, on a
   local copy of the site, in both states of its switch.

   Run from the repo:  node scripts/site/check_crossing_still.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine; every outside request is refused (the engine answered with made-up
   nights). The check reads the shipped value of PHONE_STILL, says which it is, and serves js/crossing.js
   in each state in turn.

   It proves: off, a phone walks the bridge (the section pinned over several screens, the words
   fading in along the way, "Skip to your dates"); on, a phone gets the poster: one screen, the
   picture already drawn for no-script browsers on the stage, no scene built and no canvas shown,
   every line of the words shown, no skip link, the calendar the next thing on the page, no pin; a
   desk stays animated either way; reduced motion is the still engraving either way; no script
   error. */
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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const SCRIPT = fs.readFileSync(path.join(ROOT, 'js', 'crossing.js'), 'utf8');
const SHIPPED = (SCRIPT.match(/const PHONE_STILL = (true|false);/) || [])[1];
// The walk left the home page on 2026-11-08 (build_v2.CROSSING_FILM: the crossing as a film), kept in
// the repo behind that switch for later use as art. When index.html on disk carries no walk, this
// check serves the home page built with CROSSING_FILM off (build_v2.render, in memory) so the walk
// is still proven in both states of PHONE_STILL.
let HOME = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!/data-crossing/.test(HOME)) {
  const { execFileSync } = require('child_process');
  const out = path.join(require('os').tmpdir(), 'lf-home-walk-' + process.pid + '.html');
  const code = "import sys, os; sys.path.insert(0, sys.argv[1]); os.chdir(sys.argv[2])\n" +
    "import build_v2 as B; B.page_modules(); B.CROSSING_FILM = False\n" +
    "open(sys.argv[3], 'w', encoding='utf-8').write(B.render(B.page_index)[1])\n";
  execFileSync('python3', ['-c', code, path.join(ROOT, 'scripts', 'site'), ROOT, out], { stdio: ['ignore', 'ignore', 'inherit'] });
  HOME = fs.readFileSync(out, 'utf8');
  fs.unlinkSync(out);
  console.log('the walk is off the home page (build_v2.CROSSING_FILM on); its checks run on the page built with that switch off');
}
const withSwitch = (on) => SCRIPT.replace(/const PHONE_STILL = (true|false);/, 'const PHONE_STILL = ' + on + ';');
const NIGHTS = { nights: Array.from({ length: 120 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return { night: d.toISOString().slice(0, 10), rate_cents: 55000, min_stay: 2 }; }) };

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/' || p === '/index.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(HOME); }
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
  check((SCRIPT.match(/const PHONE_STILL = (true|false);/g) || []).length === 1 && SHIPPED, 'the switch is one line; shipped PHONE_STILL = ' + SHIPPED);

  async function visitor(on, phone, reduce) {
    const ctx = await browser.newContext(Object.assign(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } },
      reduce ? { reducedMotion: 'reduce' } : {}));
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === 'book.loxleyforest.com') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(u.pathname === '/v1/availability' ? NIGHTS : {}) });
      if (u.origin !== base) return route.abort();
      if (u.pathname === '/js/crossing.js') return route.fulfill({ status: 200, contentType: 'text/javascript', body: withSwitch(on) });
      return route.continue();
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    return { ctx, page, errors };
  }
  // the walk as the page shows it, after scrolling it into reach so the scene builds
  async function walk(page) {
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => { const s = document.querySelector('.lf-walk'); const y = s.getBoundingClientRect().top + scrollY - 300; if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); });
    await page.waitForFunction(() => document.querySelector('.lf-walk.is-ready') && window.lfCrossing && window.lfCrossing.stats().marks > 0, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);
    return page.evaluate(() => {
      const s = document.querySelector('.lf-walk'), r = s.getBoundingClientRect();
      const words = [...s.querySelectorAll('.lf-walk__line')].map((w) => +getComputedStyle(w).opacity);
      const next = s.nextElementSibling;
      const cv = s.querySelector('canvas'), data = (() => { try { const c = cv.getContext('2d'); const px = c.getImageData(0, 0, cv.width, Math.min(cv.height, 40)).data; let lit = 0; for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 120) lit++; return lit; } catch (e) { return -1; } })();
      const stage = s.querySelector('.lf-walk__stage'), skip = s.querySelector('.lf-walk__skip');
      return { ready: s.classList.contains('is-ready'), still: s.classList.contains('is-still'), poster: s.classList.contains('is-poster'), screens: +(r.height / innerHeight).toFixed(2),
        sticky: getComputedStyle(stage).position, words: words, skip: skip ? skip.textContent : '', skipShown: !!skip && getComputedStyle(skip).display !== 'none',
        bg: getComputedStyle(stage).backgroundImage, canvasShown: getComputedStyle(cv).display !== 'none',
        nextId: next && (next.id || next.className), litTop: data, marks: window.lfCrossing ? window.lfCrossing.stats().marks : -1, api: !!window.lfCrossing };
    });
  }

  for (const on of [false, true]) {
    console.log((on ? 'on' : 'off') + ' (PHONE_STILL ' + on + ')');
    const p = await visitor(on, true);
    const w = await walk(p.page);
    if (!on) {
      check(w.ready && !w.still && w.screens > 4 && w.sticky === 'sticky', 'a phone walks the bridge: pinned over ' + w.screens + ' screens, the stage sticky');
      check(w.words.some((o) => o < 0.5), 'the words wait for their place on the bridge (opacities ' + w.words.join(', ') + ')');
    } else {
      check(w.ready && w.still && w.poster && w.screens <= 1.05 && w.sticky !== 'sticky', 'a phone gets the poster: one screen (' + w.screens + '), no pin');
      check(/crossing-still-phone\.webp/.test(w.bg) && !w.canvasShown, 'the picture already drawn for no-script browsers on the stage, the canvas not shown');
      check(!w.api && w.marks === -1, 'no scene built, no engraving drawn: the script stops at the poster');
      check(w.words.every((o) => o > 0.95), 'every line of the words shown at once');
      check(!w.skipShown, 'no "Skip to your dates" on a one-screen picture');
    }
    if (!on) check(/Skip to your dates|Pick your nights/.test(w.skip || ''), '"' + (w.skip || '') + '" is there');
    check(/book|gatehouse|lf-book/i.test(String(w.nextId)), 'the calendar is the next thing on the page (' + w.nextId + ')');
    check(p.errors.length === 0, 'no script errors' + (p.errors.length ? ': ' + p.errors.join('; ') : ''));
    await p.ctx.close();
    const d = await visitor(on, false);
    const wd = await walk(d.page);
    check(wd.ready && !wd.still && wd.screens > 4, 'a desk stays animated (' + wd.screens + ' screens)');
    await d.ctx.close();
    const r = await visitor(on, true, true);
    const wr = await walk(r.page);
    check(wr.ready && wr.still && wr.screens <= 1.05, 'reduced motion on a phone: the still either way');
    await r.ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_crossing_still: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
