#!/usr/bin/env node
/* Checks The Tale on the pillow (private/tale-<hex>/, the Chief's route of 2026-11-26), the private
   page Mick or Livy fills in on a wedding night to print a 12-page booklet, in a real browser on a
   local copy of the site. Fails the build on anything the Critic's rules forbid.

   Run from the repo:  node scripts/site/check_tale.js        (SHOTS=dir to save screenshots and PDFs)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine. Every name typed is invented, every photograph is drawn here.

   It proves, from the file: noindex; no Tag Manager, analytics or outside address (the fonts are
   embedded); a Content-Security-Policy with connect-src 'none' and form-action 'none'; no form
   element; no fetch, XHR, sendBeacon, WebSocket, localStorage, sessionStorage, indexedDB or cookie
   in the script; the file input reads images only and uploads nowhere; the words are marked as
   sample while they are; the invented couple alone is in the file; none of the words the rules
   forbid (cast names, horn, tree, mead, anvil, "bound"). And in the browser, at 390 px and 1280 px:
   no sideways scroll; the twelve pages render in order with the couple, the date in words and the
   minute in words; a tap on the map sets the stone and the book's map carries it; eight drawn
   photographs picked from the phone fill their pages and a ninth is refused; the book prints as six
   landscape letter sheets in the folded order with eight photographs and with none; a fetch from
   the page is refused by the policy; no storage of any kind is written and no request leaves for any
   host but the page's own; Start over clears it all; no script errors. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let chromium;
for (const p of [process.env.PLAYWRIGHT_CORE, path.join(__dirname, '..', 'logo', 'node_modules', 'playwright-core'), 'playwright-core']) {
  if (!p) continue;
  try { chromium = require(p).chromium; break; } catch (e) {}
}
if (!chromium) { console.error('playwright-core not found (set PLAYWRIGHT_CORE)'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..', '..');
const EXE = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const SHOTS = process.env.SHOTS || '';
const DIR = fs.readdirSync(path.join(ROOT, 'private')).find((d) => /^tale-[0-9a-f]{6}$/.test(d));
if (!DIR) { console.error('no private/tale-<hex>/ folder'); process.exit(2); }
const PAGE = '/private/' + DIR + '/';
const HTML = fs.readFileSync(path.join(ROOT, 'private', DIR, 'index.html'), 'utf8');
const NO_COMMENTS = HTML.replace(/<!--[\s\S]*?-->/g, '');
const SCRIPT = (NO_COMMENTS.match(/<script>([\s\S]*?)<\/script>/) || ['', ''])[1];
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };

// A drawn photograph: a small PNG of one flat colour, made here (no file leaves or enters the machine).
function png(w, h, rgb) {
  const crcTable = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) { row[1 + x * 3] = rgb[0]; row[2 + x * 3] = rgb[1]; row[3 + x * 3] = rgb[2]; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const PHOTOS = Array.from({ length: 9 }, (_, i) => ({ name: 'night-' + (i + 1) + '.png', mimeType: 'image/png', buffer: png(64, 80, [40 + i * 20, 60 + i * 10, 40]) }));

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
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
  console.log('the file, ' + PAGE);
  check(/name="robots" content="noindex, nofollow, noarchive"/.test(HTML), 'noindex, nofollow, noarchive');
  check(!/googletagmanager|gtm\.js|GTM-|clarity|gtag\(|analytics/i.test(NO_COMMENTS), 'no Tag Manager, Clarity or analytics');
  check(!/https?:\/\//.test(NO_COMMENTS.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')), 'no outside address anywhere in the page (the fonts are embedded)');
  const csp = (HTML.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
  check(/connect-src 'none'/.test(csp) && /form-action 'none'/.test(csp) && /default-src 'none'/.test(csp), 'a Content-Security-Policy with connect-src none and form-action none: ' + csp);
  check(!/<form\b/i.test(NO_COMMENTS), 'no form element');
  check(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.share|\.submit\(/.test(SCRIPT), 'the script never fetches, posts, beacons or stores');
  check(/<input id="files" type="file" accept="image\/\*" multiple>/.test(HTML) && /createObjectURL/.test(SCRIPT) && /revokeObjectURL/.test(SCRIPT), 'photographs are read in the page as object URLs and freed');
  check(/<body data-words="sample">/.test(HTML) && /id="ribbon"/.test(HTML), 'the words are marked as sample on the page while they are');
  check(/value="Ada"/.test(HTML) && /value="Hollis"/.test(HTML) && /name1: 'Ada', name2: 'Hollis'/.test(SCRIPT), 'the invented couple alone is in the file');
  const text = NO_COMMENTS.replace(/<script>[\s\S]*?<\/script>/, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ');
  const words = text + ' ' + SCRIPT.replace(/[A-Za-z]+Words|wordmark/g, '');
  check(!/\bhorn\b|\bmead\b|\banvil\b|\bbound\b|plant(ed)? a tree|\byour tree\b/i.test(words), 'none of the words the rules forbid (horn, mead, anvil, bound, a tree)');
  check(!/[–—]/.test(text), 'no em dash in the words');
  check(/FOLD = \[\[12, 1\], \[2, 11\], \[10, 3\], \[4, 9\], \[8, 5\], \[6, 7\]\]/.test(SCRIPT), 'the folded order for three sheets: 12|1, 2|11, 10|3, 4|9, 8|5, 6|7');

  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  for (const width of [390, 1280]) {
    console.log('in the browser, ' + width + ' px');
    const ctx = await browser.newContext(width < 768 ? { viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width, height: 900 } });
    const outside = [], errors = [];
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.origin === base) return route.continue();
      outside.push(u.hostname + u.pathname);
      return route.abort();
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e.message)));
    page.on('requestfailed', () => {});
    await page.goto(base + PAGE, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const read = () => page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, w: innerWidth,
      pages: [...document.querySelectorAll('#pages .pg')].map((p) => p.getAttribute('data-page')),
      cover: document.querySelector('#pages .pg[data-page="1"]').textContent.replace(/\s+/g, ' ').trim(),
      fire: document.querySelector('#pages .pg[data-page="5"] .minute').textContent.trim(),
      stoneMarks: document.querySelectorAll('#pages .pg[data-page="7"] .mapwrap svg g').length,
      photosOnPages: document.querySelectorAll('#pages .pg .photo img').length,
      thumbs: document.querySelectorAll('#thumbs img').length,
      count: document.getElementById('count').textContent,
      sheets: [...document.querySelectorAll('#press .sh')].map((s) => [...s.querySelectorAll('.pg')].map((p) => +p.getAttribute('data-page'))),
      ribbon: !!document.getElementById('ribbon') && document.body.getAttribute('data-words') === 'sample',
      storage: (() => { try { return localStorage.length + sessionStorage.length; } catch (e) { return -1; } })(),
      cookie: document.cookie
    }));
    let s = await read();
    check(s.sw <= s.w, 'no sideways scroll (' + s.sw + ' of ' + s.w + ')');
    check(s.pages.join(',') === '1,2,3,4,5,6,7,8,9,10,11,12', 'twelve pages in reading order on screen');
    check(/Ada & Hollis/.test(s.cover) && /Saturday, December 12, 2026/.test(s.cover), 'the cover carries the invented couple and the date in words: ' + s.cover.slice(0, 80));
    check(s.fire === '5:17 in the evening', 'the fire page carries the minute in words: ' + s.fire);
    check(s.stoneMarks === 0 && s.photosOnPages === 0 && s.thumbs === 0, 'no stone yet, no photographs yet');
    check(JSON.stringify(s.sheets) === JSON.stringify([[12, 1], [2, 11], [10, 3], [4, 9], [8, 5], [6, 7]]), 'six sheets in the folded order for print');
    check(s.ribbon, 'the sample ribbon stands while the words are sample');

    // the book with no photographs prints as six landscape letter sheets
    const pdf0 = await page.pdf({ format: 'Letter', landscape: true, printBackground: true, preferCSSPageSize: true });
    const pages0 = (pdf0.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    check(pages0 === 6, 'with no photographs the book prints as six letter sheets (' + pages0 + ')');
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, 'tale-' + width + '-no-photos.pdf'), pdf0);

    // type a couple over the invented one, a date, a minute; tap the map
    await page.fill('#name1', 'Juniper'); await page.fill('#name2', 'Teodor');
    await page.fill('#date', '2026-12-17'); await page.fill('#minute', '16:58');
    await page.waitForTimeout(200);
    const map = await page.$('#map');
    const box = await map.boundingBox();
    await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.55);
    await page.waitForTimeout(200);
    s = await read();
    check(/Juniper & Teodor/.test(s.cover) && /Thursday, December 17, 2026/.test(s.cover) && s.fire === '4:58 in the afternoon', 'the typed couple, date and minute reach the book');
    check(s.stoneMarks === 1, 'a tap on the map sets the stone and the book\'s map carries it');
    const mark1 = await page.evaluate(() => document.querySelector('#pages .pg[data-page="7"] svg g circle').getAttribute('cx'));
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.6);
    await page.waitForTimeout(200);
    const mark2 = await page.evaluate(() => document.querySelector('#pages .pg[data-page="7"] svg g circle').getAttribute('cx'));
    check(mark1 !== mark2 && (await read()).stoneMarks === 1, 'a second tap moves it, one stone only');

    // eight drawn photographs from the phone, a ninth refused
    await page.setInputFiles('#files', PHOTOS.slice(0, 5));
    await page.waitForTimeout(300);
    await page.setInputFiles('#files', PHOTOS.slice(5, 9));
    await page.waitForTimeout(400);
    s = await read();
    check(s.thumbs === 8 && s.count === '8 of 8', 'eight photographs are kept and a ninth is refused (' + s.count + ')');
    check(s.photosOnPages === 8, 'all eight fill the book\'s pages');
    const srcs = await page.evaluate(() => [...document.querySelectorAll('#pages .pg .photo img')].map((i) => i.src.slice(0, 5)));
    check(srcs.every((x) => x === 'blob:'), 'each as an object URL on this device, never an address elsewhere');
    const pdf8 = await page.pdf({ format: 'Letter', landscape: true, printBackground: true, preferCSSPageSize: true });
    const pages8 = (pdf8.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    check(pages8 === 6 && pdf8.length > pdf0.length, 'with eight photographs the book still prints as six letter sheets (' + pages8 + ', ' + Math.round(pdf8.length / 1024) + ' KB)');
    if (SHOTS) { fs.writeFileSync(path.join(SHOTS, 'tale-' + width + '-eight-photos.pdf'), pdf8); await page.screenshot({ path: path.join(SHOTS, 'tale-' + width + '-screen.png'), fullPage: true }); }

    // remove one, and the book follows
    await page.click('#thumbs button[data-i="2"]');
    await page.waitForTimeout(200);
    s = await read();
    check(s.thumbs === 7 && s.photosOnPages === 7, 'removing one leaves seven on the pages');

    // nothing leaves, nothing is kept
    const fetched = await page.evaluate(() => fetch('/favicon.svg').then(() => 'sent', () => 'refused').catch(() => 'refused'));
    check(fetched === 'refused', 'a fetch from the page is refused by the policy');
    check(s.storage === 0 && s.cookie === '', 'no storage written and no cookie');
    check(outside.length === 0, 'no request left for any host but the page\'s own' + (outside.length ? ' (' + outside.slice(0, 3).join(', ') + ')' : ''));

    // start over
    await page.click('#reset');
    await page.waitForTimeout(200);
    s = await read();
    check(s.thumbs === 0 && s.photosOnPages === 0 && s.stoneMarks === 0 && !/Juniper/.test(s.cover), 'Start over clears the couple, the stone and the photographs');
    check(errors.filter((e) => !/Content Security Policy|Refused to connect/.test(e)).length === 0, 'no script errors' + (errors.length ? ' (' + errors.join('; ') + ')' : ''));
    await ctx.close();
  }
  await browser.close();
  srv.close();
  console.log('check_tale: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
