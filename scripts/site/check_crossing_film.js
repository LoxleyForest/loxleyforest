#!/usr/bin/env node
/* Checks the home page's bridge section as a film (build_v2.CROSSING_FILM, loop B of Romantic
   Atlanta's crossing footage, Mick's pick 2026-11-08) in a real browser, on a local copy of the
   site, in both states of its switch.

   Run from the repo:  node scripts/site/check_crossing_film.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE), the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install"), and python3 for the page
   in its other state (build_v2.render, nothing written).

   Nothing leaves this machine; every outside request is refused (the engine answered with made-up
   nights). The check reads the shipped value of CROSSING_FILM, says which it is, renders the home
   page in each state through build_v2.py in memory, and serves each in turn.

   It proves, with the switch on, on a phone and on a desk: the section is one screen, not pinned, no
   canvas and no js/crossing.js asked for; the poster painted first from the loop's own first frame
   (the phone frame on a phone, the desk frame on a desk), no film asked for on a landing; the walk's
   four lines all shown; no "Skip to your dates"; the calendar the next thing on the page; once the
   page has loaded and the section is on screen, the film (the phone file on a phone, the desk file
   on a desk) muted, inline, looping, playing, the pause button shown and stopping it; off screen it
   pauses; a browser that reports 3g, 2g or slow-2g, or asks for Save-Data, asks for no film and keeps
   the poster; reduced motion the same; the words sit clear of the pause button and the Book button;
   no script error. With the switch off: the walk as before (data-crossing, js/crossing.js asked
   for), no film and no film files asked for. */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const BUILD = fs.readFileSync(path.join(ROOT, 'scripts', 'site', 'build_v2.py'), 'utf8');
const SHIPPED = (BUILD.match(/^CROSSING_FILM = (True|False)$/m) || [])[1];
const NIGHTS = { nights: Array.from({ length: 120 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return { night: d.toISOString().slice(0, 10), rate_cents: 55000, min_stay: 2 }; }) };

// The home page in a given state, as build_v2.render writes it (the page modules loaded, as build does).
function renderHome(on) {
  const out = path.join(os.tmpdir(), 'lf-home-' + (on ? 'film' : 'walk') + '-' + process.pid + '.html');
  const code = "import sys, os; sys.path.insert(0, sys.argv[1]); os.chdir(sys.argv[2])\n" +
    "import build_v2 as B; B.page_modules(); B.CROSSING_FILM = sys.argv[3] == 'on'\n" +
    "open(sys.argv[4], 'w', encoding='utf-8').write(B.render(B.page_index)[1])\n";
  execFileSync('python3', ['-c', code, path.join(ROOT, 'scripts', 'site'), ROOT, on ? 'on' : 'off', out], { stdio: ['ignore', 'ignore', 'inherit'] });
  const html = fs.readFileSync(out, 'utf8');
  fs.unlinkSync(out);
  return html;
}
const HOME = { on: renderHome(true), off: renderHome(false) };

function serve(getHome) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/' || p === '/index.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(getHome()); }
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      const type = TYPES[path.extname(f)] || 'application/octet-stream';
      // byte ranges, as Netlify serves them: a seek in the film asks for one
      const range = req.headers.range && /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if (range) {
        const a = +range[1], b = range[2] ? +range[2] : data.length - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 });
        return res.end(data.subarray(a, b + 1));
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length, 'Accept-Ranges': 'bytes' });
      res.end(data);
    });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  let state = 'on';
  const srv = await serve(() => HOME[state]);
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  check((BUILD.match(/^CROSSING_FILM = (True|False)$/gm) || []).length === 1 && SHIPPED, 'the switch is one line; shipped CROSSING_FILM = ' + SHIPPED);
  check((SHIPPED === 'True') === /lf-walk--film/.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')), 'index.html on disk is in the shipped state');
  const CROSSING_TAG = /<script src="js\/crossing\.js"/;
  check(/data-crossing/.test(HOME.off) && !/lf-walk--film/.test(HOME.off) && CROSSING_TAG.test(HOME.off), 'off: the page carries the walk and the js/crossing.js script');
  check(/lf-walk--film/.test(HOME.on) && !/data-crossing/.test(HOME.on) && !CROSSING_TAG.test(HOME.on) && !/Skip to your dates/.test(HOME.on), 'on: the page carries the film, no walk, no js/crossing.js script, no skip link');
  check(!/<video[^>]*class="lf-loop__video lf-walk__video"[^>]*poster=/.test(HOME.on), 'on: the video carries no poster attribute (the <picture> is the poster; a phone never fetches the desk frame)');
  for (const f of ['images/crossing/crossing-phone.mp4', 'images/crossing/crossing-desk.mp4', 'images/crossing/crossing-poster-phone.webp', 'images/crossing/crossing-poster-desk.webp']) {
    check(fs.existsSync(path.join(ROOT, f)) && fs.statSync(path.join(ROOT, f)).size > 0, f + ' exists (' + Math.round(fs.statSync(path.join(ROOT, f)).size / 1024) + ' KB)');
  }

  // conn: null for a browser that reports nothing (an iPhone), else {effectiveType, saveData}
  async function visitor(phone, conn, reduce) {
    const ctx = await browser.newContext(Object.assign(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } },
      reduce ? { reducedMotion: 'reduce' } : {}));
    if (conn) await ctx.addInitScript((c) => { Object.defineProperty(navigator, 'connection', { value: c, configurable: true }); }, conn);
    const asked = [];
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === 'book.loxleyforest.com') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(u.pathname === '/v1/availability' ? NIGHTS : {}) });
      if (u.origin !== base) return route.abort();
      asked.push(u.pathname);
      return route.continue();
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    return { ctx, page, errors, asked };
  }
  const films = (asked) => asked.filter((p) => /crossing-(phone|desk)\.mp4$/.test(p));
  async function section(page) {
    return page.evaluate(() => {
      const s = document.querySelector('.lf-walk'), r = s.getBoundingClientRect();
      const stage = s.querySelector('.lf-walk__stage'), img = s.querySelector('picture img'), v = s.querySelector('video'), btn = s.querySelector('.lf-loop__pause');
      const words = [...s.querySelectorAll('.lf-walk__line')].map((w) => +getComputedStyle(w).opacity);
      const next = s.nextElementSibling;
      const rb = btn ? btn.getBoundingClientRect() : null, rw = s.querySelector('.lf-walk__words').getBoundingClientRect();
      const fab = document.querySelector('.book-fab'), rf = fab ? fab.getBoundingClientRect() : null;
      const overlap = (a, b) => !!(a && b && a.width && b.width && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
      return { film: s.classList.contains('lf-walk--film'), screens: +(r.height / innerHeight).toFixed(2), sticky: getComputedStyle(stage).position,
        canvas: !!s.querySelector('canvas'), poster: img ? img.currentSrc.split('/').pop() : '', posterPainted: !!img && img.complete && img.naturalWidth > 0,
        words: words, wordCount: words.length, skip: !!s.querySelector('.lf-walk__skip'), nextId: next && (next.id || next.className),
        src: v ? (v.currentSrc || v.src || '').split('/').pop() : '', muted: v ? v.muted : null, loop: v ? v.loop : null, inline: v ? v.playsInline : null,
        paused: v ? v.paused : null, playing: v ? v.classList.contains('is-playing') : null, videoShown: v ? getComputedStyle(v).display !== 'none' : null,
        btnShown: !!btn && !btn.hidden && getComputedStyle(btn).display !== 'none', btnLabel: btn ? btn.getAttribute('aria-label') : '',
        btnOverWords: overlap(rb, rw), btnOverFab: overlap(rb, rf), ready: document.readyState };
    });
  }
  async function toSection(page) {
    await page.evaluate(() => { const s = document.querySelector('.lf-walk'); const y = s.getBoundingClientRect().top + scrollY; if (window.lfLenis) window.lfLenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); });
    await page.waitForTimeout(300);
  }

  // ------------------------------------------------------------ on
  state = 'on';
  for (const phone of [true, false]) {
    const shape = phone ? 'a phone' : 'a desk';
    console.log('on (CROSSING_FILM), ' + shape);
    const p = await visitor(phone, null);
    await p.page.goto(base + '/', { waitUntil: 'load' });
    await p.page.waitForTimeout(400);
    let s = await section(p.page);
    check(s.film && s.screens <= 1.05 && s.sticky !== 'sticky' && !s.canvas, shape + ': the film section, one screen (' + s.screens + '), no pin, no canvas');
    check(!p.asked.includes('/js/crossing.js'), 'js/crossing.js is not asked for');
    check(films(p.asked).length === 0 && !s.src, 'on a landing no film is asked for (the section is below the fold)');
    check(s.wordCount === 4 && s.words.every((o) => o > 0.95), 'the four lines of the words shown at once');
    check(!s.skip, 'no "Skip to your dates"');
    check(/book|gatehouse|lf-book/i.test(String(s.nextId)), 'the calendar is the next thing on the page (' + s.nextId + ')');
    await toSection(p.page);
    s = await section(p.page);
    check(s.poster === (phone ? 'crossing-poster-phone.webp' : 'crossing-poster-desk.webp') && s.posterPainted, 'the poster is the loop\'s own first frame for ' + shape + ' (' + s.poster + '), painted');
    await p.page.waitForFunction(() => { const v = document.querySelector('.lf-walk video'); return v && v.classList.contains('is-playing'); }, null, { timeout: 10000 }).catch(() => {});
    s = await section(p.page);
    check(s.src === (phone ? 'crossing-phone.mp4' : 'crossing-desk.mp4'), 'on screen after load, the film for ' + shape + ' is asked for (' + s.src + ')');
    check(s.muted && s.loop && s.inline, 'muted, looping, inline');
    check(s.playing && !s.paused, 'playing');
    check(s.btnShown && s.btnLabel === 'Pause the video', 'the pause button shown once playing');
    check(!s.btnOverWords && !s.btnOverFab, 'the pause button sits clear of the words and the Book button');
    await p.page.click('.lf-walk .lf-loop__pause');
    await p.page.waitForTimeout(200);
    s = await section(p.page);
    check(s.paused && s.btnLabel === 'Play the video', 'the pause button stops it and offers play');
    await p.page.click('.lf-walk .lf-loop__pause');
    await p.page.waitForTimeout(300);
    s = await section(p.page);
    check(!s.paused, 'and starts it again');
    // what the film tells the Tag Manager, as the walk did: crossing_start once it plays, crossing_end once through
    const dl = await p.page.evaluate(() => (window.dataLayer || []).filter((e) => /^crossing_/.test(e.event)).map((e) => e.event));
    check(dl.filter((e) => e === 'crossing_start').length === 1, 'crossing_start pushed to the Tag Manager once it plays (' + dl.join(', ') + ')');
    await p.page.evaluate(() => { const v = document.querySelector('.lf-walk video'); v.currentTime = Math.max(0, v.duration - 1); });
    await p.page.waitForFunction(() => (window.dataLayer || []).some((e) => e.event === 'crossing_end'), null, { timeout: 6000 }).catch(() => {});
    const dl2 = await p.page.evaluate(() => (window.dataLayer || []).filter((e) => /^crossing_/.test(e.event)).map((e) => e.event));
    check(dl2.filter((e) => e === 'crossing_end').length === 1 && dl2.filter((e) => e === 'crossing_start').length === 1, 'crossing_end once it has played through, each once (' + dl2.join(', ') + ')');
    await p.page.evaluate(() => { if (window.lfLenis) window.lfLenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); });
    await p.page.waitForTimeout(500);
    s = await section(p.page);
    check(s.paused, 'off screen it pauses');
    check(p.errors.length === 0, 'no script errors' + (p.errors.length ? ': ' + p.errors.join('; ') : ''));
    await p.ctx.close();
  }
  // the words sit on a dark part of the film at every desk width, through the loop (the Critic, 2026-11-08:
  // the lit canvas walks up the left half of the frame; the words were on it at 1024 and 1280)
  console.log('on, the words over the film');
  for (const [w, h] of [[1024, 768], [1280, 720], [1440, 900], [390, 844], [375, 667]]) {
    const ctx = await browser.newContext(w < 768 ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true } : { viewport: { width: w, height: h } });
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === 'book.loxleyforest.com') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(u.pathname === '/v1/availability' ? NIGHTS : {}) });
      if (u.origin !== base) return route.abort();
      return route.continue();
    });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'load' });
    await toSection(page);
    await page.waitForFunction(() => { const v = document.querySelector('.lf-walk video'); return v && v.readyState >= 2 && v.videoWidth > 0; }, null, { timeout: 15000 }).catch(() => {});
    const lum = await page.evaluate(async () => {
      const s = document.querySelector('.lf-walk'), v = s.querySelector('video'), wd = s.querySelector('.lf-walk__words');
      const st = s.querySelector('.lf-walk__stage').getBoundingClientRect(), r = wd.getBoundingClientRect();
      const out = [];
      const lumOf = (g, x, y, ww, hh) => { const px = g.getImageData(x, y, ww, hh).data; let sum = 0, n = 0, bright = 0; for (let i = 0; i < px.length; i += 16) { const l = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; sum += l; n++; if (l > 140) bright++; } return { mean: Math.round(sum / n), bright: +(bright / n).toFixed(3) }; };
      for (const t of [1, 4, 7.5]) {
        v.pause();
        await new Promise((ok) => { const hnd = () => { v.removeEventListener('seeked', hnd); ok(); }; v.addEventListener('seeked', hnd); v.currentTime = t; setTimeout(ok, 5000); });
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        const c = document.createElement('canvas'); c.width = Math.round(st.width); c.height = Math.round(st.height);
        const g = c.getContext('2d');
        const vw = v.videoWidth, vh = v.videoHeight, sc = Math.max(c.width / vw, c.height / vh), dw = vw * sc, dh = vh * sc;
        g.drawImage(v, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
        const x = Math.max(0, Math.round(r.left - st.left)), y = Math.max(0, Math.round(r.top - st.top));
        const ww = Math.max(1, Math.min(c.width - x, Math.round(r.width))), hh = Math.max(1, Math.min(c.height - y, Math.round(r.height)));
        const under = lumOf(g, x, y, ww, hh), whole = lumOf(g, 0, 0, c.width, c.height);
        out.push({ t, at: +v.currentTime.toFixed(2), mean: under.mean, bright: under.bright, frame: whole.mean });
      }
      return out;
    });
    const seeked = lum.length === 3 && lum.every((m) => Math.abs(m.at - m.t) < 0.5);
    const ok = seeked && lum.every((m) => m.mean < 100 && m.bright < 0.1);
    check(ok, w + 'x' + h + ': the words sit on a dark part of the frame at 1, 4 and 7.5 s (' + lum.map((m) => 'at ' + m.at + 's under the words mean ' + m.mean + ', lit ' + Math.round(m.bright * 100) + '%, the frame ' + m.frame).join('; ') + ')');
    await ctx.close();
  }
  console.log('on, a phone that asks for less');
  for (const [what, conn] of [['3g', { effectiveType: '3g', saveData: false }], ['2g', { effectiveType: '2g', saveData: false }], ['slow-2g', { effectiveType: 'slow-2g', saveData: false }], ['Save-Data on 4g', { effectiveType: '4g', saveData: true }]]) {
    const p = await visitor(true, conn);
    await p.page.goto(base + '/', { waitUntil: 'load' });
    await toSection(p.page);
    await p.page.waitForTimeout(1200);
    const s = await section(p.page);
    check(films(p.asked).length === 0 && !s.src && s.posterPainted && !s.btnShown, what + ': no film asked for, the poster stays, no pause button');
    await p.ctx.close();
  }
  {
    const p = await visitor(true, { effectiveType: '4g', saveData: false });
    await p.page.goto(base + '/', { waitUntil: 'load' });
    await toSection(p.page);
    await p.page.waitForFunction(() => { const v = document.querySelector('.lf-walk video'); return v && v.classList.contains('is-playing'); }, null, { timeout: 10000 }).catch(() => {});
    const s = await section(p.page);
    check(s.src === 'crossing-phone.mp4' && s.playing, 'a phone that reports 4g plays the phone film');
    await p.ctx.close();
    const r = await visitor(true, null, true);
    await r.page.goto(base + '/', { waitUntil: 'load' });
    await toSection(r.page);
    await r.page.waitForTimeout(1200);
    const sr = await section(r.page);
    check(films(r.asked).length === 0 && !sr.src && !sr.videoShown && sr.posterPainted && sr.wordCount === 4, 'reduced motion: no film, the video not shown, the poster and the words');
    await r.ctx.close();
  }

  // ------------------------------------------------------------ off
  state = 'off';
  for (const phone of [true, false]) {
    const shape = phone ? 'a phone' : 'a desk';
    console.log('off (the walk), ' + shape);
    const p = await visitor(phone, null);
    await p.page.goto(base + '/', { waitUntil: 'load' });
    await toSection(p.page);
    await p.page.waitForTimeout(800);
    const s = await section(p.page);
    check(!s.film && p.asked.includes('/js/crossing.js') && films(p.asked).length === 0 && !s.src, shape + ': the walk as before, js/crossing.js asked for, no film');
    check(p.errors.length === 0, 'no script errors' + (p.errors.length ? ': ' + p.errors.join('; ') : ''));
    await p.ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_crossing_film: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
