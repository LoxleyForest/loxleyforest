#!/usr/bin/env node
/* The header row fits the screens it shows on, in both states of build_v2.GIVE_A_STAY.

   Run from the repo:  node scripts/site/check_header_fit.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install"). Nothing leaves this machine
   but the fonts (Google Fonts, so the row is measured with the real type); everything else outside
   is refused.

   The six links show from 1280 px (css/v2.css); a seventh pushed the Book button 36 px off a 1280
   screen (the Critic, 2026-11-08), so the row keeps six in both states and "Give a Stay" goes in the
   menu alone. It proves, at 1280, 1300 and 1366 px on the home page as built and as the builder
   writes it with the switch on: the header is no wider than the screen, the Book button's right
   edge is inside it, no link wraps, the row has six links, and the menu links to /gift once. */
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
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// the page as the builder writes it with GIVE_A_STAY on (build_v2.nav_links(menu=True), menu_gift_link): the
// menu's second link "Give a Stay", "The Golden Arrow" gone from the menu, the row untouched
const INDEX_ON = INDEX.replace(/(<nav aria-label="Menu">)(<a [^>]*>[^<]*<\/a>)/, '$1$2<a href="/gift">Give a Stay</a>')
  .replace(/(<nav aria-label="Menu">[^]*?)<a href="\/gift">The Golden Arrow<\/a>(<\/nav>)/, '$1$2');
if (INDEX_ON === INDEX) { console.error('could not write the on state'); process.exit(2); }

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/on') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(INDEX_ON); }
    if (p === '/') p = '/index.html';
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
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
  for (const on of [false, true]) {
    console.log(on ? 'GIVE_A_STAY on (as the builder would write it)' : 'as built (GIVE_A_STAY off)');
    for (const width of [1280, 1300, 1366]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await ctx.route('**/*', (route) => {
        const u = new URL(route.request().url());
        if (u.origin === base || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
        return route.abort();
      });
      const page = await ctx.newPage();
      await page.goto(base + (on ? '/on' : '/'), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const hdr = document.querySelector('.lf-hdr'), book = document.querySelector('.lf-hdr__book'), row = document.querySelector('.lf-hdr__nav');
        const links = [...row.querySelectorAll('a')];
        const menu = [...document.querySelectorAll('nav[aria-label="Menu"] a')];
        return { hdrW: hdr.scrollWidth, hdrRight: hdr.getBoundingClientRect().right, bookRight: book.getBoundingClientRect().right, rowShown: getComputedStyle(row).display !== 'none',
          links: links.length, wrapped: links.filter((a) => a.getClientRects().length > 1).length, menuGift: menu.filter((a) => a.getAttribute('href') === '/gift').map((a) => a.textContent),
          menuSecond: menu[1] && menu[1].textContent, sw: document.documentElement.scrollWidth };
      });
      check(m.rowShown && m.links === 6 && m.wrapped === 0, width + ' px: the row shows its six links on one line (shown ' + m.rowShown + ', ' + m.links + ' links, ' + m.wrapped + ' wrapped)');
      check(m.hdrW <= width && m.hdrRight <= width + 0.5 && m.bookRight <= width - 8 && m.sw <= width, width + ' px: the header fits and the Book button\'s right edge is inside the screen (' + Math.round(m.bookRight) + ' of ' + width + ')');
      check(m.menuGift.length === 1 && (on ? m.menuGift[0] === 'Give a Stay' && m.menuSecond === 'Give a Stay' : m.menuGift[0] === 'The Golden Arrow'), width + ' px: the menu links to /gift once, as "' + m.menuGift.join('", "') + '"');
      await ctx.close();
    }
  }
  await browser.close();
  srv.close();
  console.log('check_header_fit: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
