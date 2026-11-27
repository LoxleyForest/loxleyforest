#!/usr/bin/env node
/* Checks The Tale on the pillow (private/tale-<hex>/, the Chief's route of 2026-11-26), the private
   page Mick or Livy fills in on a wedding night to print a 12-page booklet, in a real browser on a
   local copy of the site. Fails the build on anything the Critic's rules forbid. Prints the words hash
   (the words block, canonical JSON) for Mick's yes.

   Run from the repo:  node scripts/site/check_tale.js        (SHOTS=dir to save screenshots and PDFs)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine. Every name typed is invented, every photograph is drawn here.

   It proves, from the file: noindex; no Tag Manager, analytics or outside address (the fonts are
   embedded); a Content-Security-Policy with connect-src 'none' and form-action 'none'; no form
   element; no fetch, XHR, sendBeacon, WebSocket, localStorage, sessionStorage, indexedDB or cookie
   in the script; the file input reads images only; the words block holds twelve pages with the four
   blanks only, its mark says whose the words are and the ribbon stands until they are approved; the
   invented couple alone is in the file; none of the words the rules forbid. And in the browser, at
   390 px and 1280 px: no sideways scroll; twelve pages in reading order with the couple, the date and
   the minute in words; the stone's words and a tap on the map reach page 8; eight drawn photographs
   fill their slots and a ninth is refused; the Sky Deck switch swaps pages 4 to 11 and drops the map;
   the tag unticked drops page 10 and keeps twelve pages with a blank inside back cover; the book
   prints as six landscape letter sheets in the folded order in every state; a fetch is refused by the
   policy; no storage is written and no request leaves for any host but the page's own; Start over
   clears it all; no script errors. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

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
const WORDS_TEXT = (NO_COMMENTS.match(/<script type="application\/json" id="tale-words">([\s\S]*?)<\/script>/) || ['', ''])[1];
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };

function canon(v) { return Array.isArray(v) ? '[' + v.map(canon).join(',') : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v); }

// A drawn photograph: a small PNG of one flat colour, made here (no file leaves or enters the machine).
function png(w, h, rgb) {
  const crcTable = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
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
const pdfPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

async function main() {
  console.log('the file, ' + PAGE);
  check(/name="robots" content="noindex, nofollow, noarchive"/.test(HTML), 'noindex, nofollow, noarchive');
  check(!/googletagmanager|gtm\.js|GTM-|clarity|gtag\(|analytics/i.test(NO_COMMENTS), 'no Tag Manager, Clarity or analytics');
  check(!/https?:\/\//.test(NO_COMMENTS.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')), 'no outside address anywhere in the page (the fonts are embedded)');
  const csp = (HTML.match(/http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
  check(/connect-src 'none'/.test(csp) && /form-action 'none'/.test(csp) && /default-src 'none'/.test(csp), 'a Content-Security-Policy with connect-src none and form-action none');
  check(!/<form\b/i.test(NO_COMMENTS), 'no form element');
  check(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.share|\.submit\(/.test(SCRIPT), 'the script never fetches, posts, beacons or stores');
  check(/<input id="files" type="file" accept="image\/\*" multiple>/.test(HTML) && /createObjectURL/.test(SCRIPT) && /revokeObjectURL/.test(SCRIPT), 'photographs are read in the page as object URLs and freed');
  let words = null;
  try { words = JSON.parse(WORDS_TEXT); } catch (e) {}
  check(!!words && Array.isArray(words.fire) && words.fire.length === 12, 'the words block holds twelve pages');
  const allText = words ? JSON.stringify(words) : '';
  const blanks = Array.from(new Set((allText.match(/\{\{(\w+)\}\}/g) || []))).sort();
  check(blanks.join(',') === '{{date}},{{minute}},{{names}},{{stone}}' || blanks.join(',') === '{{date}},{{minute}},{{stone}}', 'the four blanks only (names, date, minute, stone): ' + blanks.join(' '));
  check(words && ['4', '5', '6', '7', '8', '9', '10', '11'].every((k) => words.sky[k]), 'the Sky Deck alternates for pages 4 to 11');
  check(words && words.mark !== 'approved' ? /id="ribbon"/.test(HTML) && new RegExp('<body data-words="' + words.mark + '">').test(HTML) : !/id="ribbon"/.test(HTML), 'the mark says whose the words are (' + (words && words.mark) + ') and the ribbon stands until they are approved');
  const hash = crypto.createHash('sha256').update(canon(words), 'utf8').digest('hex');
  console.log('  words sha256: ' + hash);
  check(/value="Ada"/.test(HTML) && /value="Hollis"/.test(HTML) && /name1: 'Ada', name2: 'Hollis'/.test(SCRIPT), 'the invented couple alone is in the file');
  const text = NO_COMMENTS.replace(/<script>[\s\S]*?<\/script>/, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ');
  check(!/\bhorn\b|\bmead\b|\banvil\b|\bbound\b|plant(ed)? a tree|\byour tree\b|\bOdin\b|\bThor\b|\bLoki\b/i.test(text + ' ' + allText), 'none of the words the rules forbid (cast names, horn, mead, anvil, bound, a tree)');
  check(!/[–—]/.test(text + allText), 'no em dash in the words');
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
    await page.goto(base + PAGE, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const read = () => page.evaluate(() => {
      const pg = (n) => document.querySelector('#pages .pg[data-page="' + n + '"]');
      const t = (n) => (pg(n) || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim();
      return {
        sw: document.documentElement.scrollWidth, w: innerWidth,
        pages: [...document.querySelectorAll('#pages .pg')].map((p) => p.getAttribute('data-page')),
        cover: t(1), p4: t(4), p6: t(6), p8: t(8), p10: t(10), p11: t(11), p12: t(12),
        eyebrows: [...document.querySelectorAll('#pages .pg .ey')].map((e) => e.textContent),
        stoneMarks: document.querySelectorAll('#pages .pg[data-page="8"] .mapwrap svg g').length,
        mapOn8: !!(pg(8) && pg(8).querySelector('.mapwrap')),
        photosOnPages: document.querySelectorAll('#pages .pg .photo img').length,
        thumbs: document.querySelectorAll('#thumbs img').length,
        count: document.getElementById('count').textContent,
        sheets: [...document.querySelectorAll('#press .sh')].map((s) => [...s.querySelectorAll('.pg')].map((p) => +p.getAttribute('data-page'))),
        ribbon: !!document.getElementById('ribbon'),
        storage: (() => { try { return localStorage.length + sessionStorage.length; } catch (e) { return -1; } })(),
        cookie: document.cookie
      };
    });
    let s = await read();
    check(s.sw <= s.w, 'no sideways scroll (' + s.sw + ' of ' + s.w + ')');
    check(s.pages.join(',') === '1,2,3,4,5,6,7,8,9,10,11,12', 'twelve pages in reading order on screen');
    check(/Ada & Hollis/.test(s.cover) && /Saturday, December 12, 2026/.test(s.cover) && /by the family who built the place/.test(s.cover), 'the cover carries the invented couple, the date in words and the Writer\'s line');
    check(/It caught at 5:17 in the evening\./.test(s.p6) && /^The minute\s*5:17 in the evening/.test(s.p11) && /5:17 in the evening on Saturday, December 12, 2026, when your fire caught/.test(s.p11), 'the minute in words reaches pages 6 and 11');
    check(/the wall the oak broke\. The oak broke that wall\./.test(s.p8) && s.mapOn8 && s.stoneMarks === 0, 'page 8 drops the stone clause while none is typed, carries the map, no mark yet');
    check(/The tag/.test(s.p10) && /oak that fell\./.test(s.p10), 'page 10 is the tag');
    check(/look back from the bridge once/.test(s.p12) && /Mick · Loxley Forest/.test(s.p12), 'page 12 is the sign-off');
    check(JSON.stringify(s.sheets) === JSON.stringify([[12, 1], [2, 11], [10, 3], [4, 9], [8, 5], [6, 7]]), 'six sheets in the folded order for print');
    check(s.ribbon, 'the ribbon stands while the words are not yet his');

    const pdf0 = await page.pdf({ format: 'Letter', landscape: true, printBackground: true, preferCSSPageSize: true });
    check(pdfPages(pdf0) === 6, 'with no photographs the book prints as six letter sheets (' + pdfPages(pdf0) + ')');
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, 'tale-' + width + '-no-photos.pdf'), pdf0);

    // type a couple over the invented one, a date, a minute and the stone's words; tap the map
    await page.fill('#name1', 'Juniper'); await page.fill('#name2', 'Teodor');
    await page.fill('#date', '2026-12-17'); await page.fill('#minute', '16:58');
    await page.fill('#stone', 'beside the lantern, under the gap');
    await page.waitForTimeout(200);
    const map = await page.$('#map');
    await map.scrollIntoViewIfNeeded();
    let box = await map.boundingBox();
    await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.55);
    await page.waitForTimeout(250);
    s = await read();
    check(/Juniper & Teodor/.test(s.cover) && /Thursday, December 17, 2026/.test(s.cover) && /4:58 in the afternoon/.test(s.p6), 'the typed couple, date and minute reach the book');
    check(/the wall the oak broke: beside the lantern, under the gap\./.test(s.p8), 'the stone\'s words follow the colon on page 8');
    check(s.stoneMarks === 1, 'a tap on the map sets the stone and page 8\'s map carries it');
    const mark1 = await page.evaluate(() => document.querySelector('#pages .pg[data-page="8"] svg g circle').getAttribute('cx'));
    box = await (await page.$('#map')).boundingBox();
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.6);
    await page.waitForTimeout(250);
    const mark2 = await page.evaluate(() => document.querySelector('#pages .pg[data-page="8"] svg g circle').getAttribute('cx'));
    check(mark1 !== mark2 && (await read()).stoneMarks === 1, 'a second tap moves it, one stone only');

    // eight drawn photographs from the phone, a ninth refused
    await page.setInputFiles('#files', PHOTOS.slice(0, 5));
    await page.waitForTimeout(300);
    await page.setInputFiles('#files', PHOTOS.slice(5, 9));
    await page.waitForTimeout(400);
    s = await read();
    check(s.thumbs === 8 && s.count === '8 of 8', 'eight photographs are kept and a ninth is refused (' + s.count + ')');
    check(s.photosOnPages === 8, 'all eight fill their slots (the cover and pages 3 to 9)');
    const srcs = await page.evaluate(() => [...document.querySelectorAll('#pages .pg .photo img')].map((i) => i.src.slice(0, 5)));
    check(srcs.every((x) => x === 'blob:'), 'each as an object URL on this device, never an address elsewhere');
    const pdf8 = await page.pdf({ format: 'Letter', landscape: true, printBackground: true, preferCSSPageSize: true });
    check(pdfPages(pdf8) === 6 && pdf8.length > pdf0.length, 'with eight photographs the book still prints as six letter sheets (' + pdfPages(pdf8) + ', ' + Math.round(pdf8.length / 1024) + ' KB)');
    if (SHOTS) { fs.writeFileSync(path.join(SHOTS, 'tale-' + width + '-eight-photos.pdf'), pdf8); await page.screenshot({ path: path.join(SHOTS, 'tale-' + width + '-screen.png'), fullPage: true }); }

    // the Sky Deck: pages 4 to 11 swap, the map goes
    await page.check('#site-sky'); await page.waitForTimeout(250);
    s = await read();
    check(/Sky Deck, sixty feet up/.test(s.p4) && /You were married at 4:58 in the afternoon/.test(s.p6) && /The door/.test(s.p8) && !s.mapOn8, 'the Sky Deck switch swaps pages 4 to 9 and drops the map');
    check(/an oak that fell here/.test(s.p10) && /when you were married at Loxley Forest/.test(s.p11), 'and the tag and minute pages take their Sky Deck words');
    check(await page.evaluate(() => document.getElementById('stonefields').hidden), 'the stone fields step aside on the Sky Deck');
    const pdfSky = await page.pdf({ format: 'Letter', landscape: true, printBackground: true, preferCSSPageSize: true });
    check(pdfPages(pdfSky) === 6, 'and the Sky Deck book prints as six sheets');
    await page.check('#site-fire'); await page.waitForTimeout(250);

    // the tag unticked: page 10 goes, a blank inside back cover keeps the fold
    await page.uncheck('#tag'); await page.waitForTimeout(250);
    s = await read();
    check(/The minute/.test(s.p10) && !/The tag/.test(JSON.stringify(s.eyebrows)) && s.p11 === '' && /look back from the bridge once/.test(s.p12), 'the tag unticked: page 10 is the minute, page 11 a blank, page 12 the sign-off');
    check(s.pages.length === 12 && JSON.stringify(s.sheets) === JSON.stringify([[12, 1], [2, 11], [10, 3], [4, 9], [8, 5], [6, 7]]), 'still twelve pages and six sheets');
    const pdfTag = await page.pdf({ format: 'Letter', landscape: true, printBackground: true, preferCSSPageSize: true });
    check(pdfPages(pdfTag) === 6, 'and it prints as six sheets');
    await page.check('#tag'); await page.waitForTimeout(200);

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
