#!/usr/bin/env node
/* The home hero's film on phones (js/global.js, the rule of 2026-11-08: every phone gets it unless the
   browser asks for less), in a real browser on a local copy of the site.

   Run from the repo:  node scripts/site/check_hero_film.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install"). Nothing leaves this machine;
   every outside request is refused.

   It proves, on a 390 px phone: a browser that reports no connection at all (an iPhone) asks for
   hero-phone.mp4 and nothing else of the films, the poster standing first, the video muted and
   inline, and once it plays the pause button is drawn and stops it; one that reports 4g plays it
   too; one that reports 3g, 2g or slow-2g, or asks for Save-Data, asks for no film at all; reduced
   motion asks for none; a desk asks for the desk film as before. */
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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/') p = '/index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); return res.end(); }
      // the films are served with ranges, as a host does, so the browser can start playing early
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      const type = TYPES[path.extname(f)] || 'application/octet-stream';
      if (range && /^video/.test(type)) {
        const start = range[1] ? +range[1] : 0, end = range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' });
        return fs.createReadStream(f, { start, end }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(f).pipe(res);
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

  // conn: null for a browser that reports nothing (an iPhone), else {effectiveType, saveData}
  async function visit(conn, phone, reduce) {
    const ctx = await browser.newContext(Object.assign(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } },
      reduce ? { reducedMotion: 'reduce' } : {}));
    await ctx.addInitScript((conn) => {
      const def = (v) => { try { Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => v }); } catch (e) {} };
      if (conn === null) def(undefined); else def(conn);
    }, conn);
    const films = [];
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.origin !== base) return route.abort();
      if (/\.(mp4|webm)$/.test(u.pathname)) films.push(u.pathname);
      return route.continue();
    });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const state = async () => page.evaluate(() => { const v = document.querySelector('.hero__video'), b = document.querySelector('.lf-hero__pause'), poster = document.querySelector('.hero__media img, .lf-hero picture img, .hero__poster');
      return { src: v ? (v.getAttribute('src') || '') : null, muted: v ? v.muted : null, inline: v ? v.playsInline : null, playing: !!(v && v.classList.contains('is-playing')), paused: v ? v.paused : null,
        btn: b ? { hidden: b.hidden, display: getComputedStyle(b).display, label: b.getAttribute('aria-label') } : null, poster: poster ? getComputedStyle(poster).display !== 'none' : null }; });
    return { ctx, page, films, state };
  }

  console.log('a phone that reports no connection (an iPhone)');
  {
    const v = await visit(null, true);
    await v.page.waitForFunction(() => { const x = document.querySelector('.hero__video'); return x && x.classList.contains('is-playing'); }, null, { timeout: 15000 }).catch(() => {});
    const s = await v.state();
    check(/hero-phone\.mp4$/.test(s.src || '') && v.films.every((f) => /hero-phone\.mp4$/.test(f)) && v.films.length > 0, 'asks for hero-phone.mp4 and no other film (' + [...new Set(v.films)].join(', ') + ')');
    check(s.muted === true && s.inline === true, 'muted and inline');
    check(s.poster !== false, 'the poster stands first');
    check(s.playing && s.btn && !s.btn.hidden && s.btn.display !== 'none', 'it plays, and the pause button is drawn then');
    if (s.playing) {
      await v.page.click('.lf-hero__pause'); await v.page.waitForTimeout(300);
      const t = await v.state();
      check(t.paused === true && /Play/.test(t.btn.label), 'the pause button stops it and offers play');
    }
    await v.ctx.close();
  }
  console.log('a phone that reports 4g');
  {
    const v = await visit({ effectiveType: '4g', saveData: false }, true);
    await v.page.waitForFunction(() => { const x = document.querySelector('.hero__video'); return x && x.getAttribute('src'); }, null, { timeout: 10000 }).catch(() => {});
    const s = await v.state();
    check(/hero-phone\.mp4$/.test(s.src || ''), 'asks for the phone film too');
    await v.ctx.close();
  }
  for (const [what, conn] of [['3g', { effectiveType: '3g', saveData: false }], ['2g', { effectiveType: '2g', saveData: false }], ['slow-2g', { effectiveType: 'slow-2g', saveData: false }], ['Save-Data on 4g', { effectiveType: '4g', saveData: true }]]) {
    console.log('a phone that reports ' + what);
    const v = await visit(conn, true);
    await v.page.waitForTimeout(1200);
    const s = await v.state();
    check(!s.src && v.films.length === 0 && s.btn && s.btn.hidden && s.btn.display === 'none', 'no film asked for, the poster alone, no pause button');
    await v.ctx.close();
  }
  console.log('reduced motion, a phone reporting nothing');
  {
    const v = await visit(null, true, true);
    await v.page.waitForTimeout(1200);
    const s = await v.state();
    check(!s.src && v.films.length === 0, 'no film asked for');
    await v.ctx.close();
  }
  console.log('a desk');
  {
    const v = await visit(null, false);
    await v.page.waitForFunction(() => { const x = document.querySelector('.hero__video'); return x && x.getAttribute('src'); }, null, { timeout: 10000 }).catch(() => {});
    const s = await v.state();
    check(/hero-desk\.(mp4|webm)$/.test(s.src || ''), 'asks for the desk film, as before (' + (s.src || '').split('/').pop() + ')');
    await v.ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_hero_film: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
