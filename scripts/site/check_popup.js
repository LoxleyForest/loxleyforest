#!/usr/bin/env node
/* Checks the January giveaway's invitation (js/giveaway-popup.js) in a real browser, on a local
   copy of the site, in both states of its pull switch.

   Run from the repo:  node scripts/site/check_popup.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine: the beacon (POST /v1/funnel at the booking server) is recorded and
   answered 204, and every other outside request is refused. Time runs on Playwright's clock. The
   shipped file has LIVE false; the "live" checks serve the same file with LIVE set to true, and say
   so. Math.random is pinned per check (0.9: not a holdout; 0.1: the holdout).

   It proves: shipped, nothing shows anywhere and /book's line stays hidden; live, the card comes on
   a desktop only when the pointer leaves the top after 5 s, on a phone only on the second page as a
   bottom sheet, never full screen; once per visitor; never after an entry; never on /book, /elopements
   or /giveaway; the holdout never sees it and sends popup_held_out; the button's route is giveaway-ads
   after an ad landing and giveaway-site otherwise; popup_shown, popup_close and popup_click reach the
   beacon with the card's fields only; dismissed, the folded line stays for the visit; the script and
   its words block sit on exactly the pages the builder names; the switch is one line. */
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
const SCRIPT = fs.readFileSync(path.join(ROOT, 'js', 'giveaway-popup.js'), 'utf8');
const SWITCH = 'var LIVE = false;';
const POPUP_PAGES = ['index.html', 'treehouses.html', 'experiences.html', 'gallery.html', 'our-story.html', 'local-guide.html', 'faq.html'];
const SCRIPT_PAGES = POPUP_PAGES.concat(['book.html', 'giveaway-entered.html']);
const NO_SCRIPT = ['elopements.html', 'giveaway.html', 'gift.html', 'gift-card.html', 'booked.html', 'manage.html', 'success.html',
  'success-elopement.html', 'booking-confirmed.html', 'eloping-from-atlanta.html', 'elope-in-dahlonega.html',
  'christmas-new-years-elopement.html', 'where-to-propose-north-georgia.html', 'romantic-getaways-near-atlanta.html'];

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

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });

  // One browsing context is one visitor; its beacons are recorded on it.
  // live: the script served with LIVE true, and the pages' words block with "open": true (as the
  // builder writes it once Mick's yes, the address and the day are set), unless asBuilt keeps the
  // block as it is on disk. time: the visitor's clock.
  async function visitor(opts) {
    const o = Object.assign({ live: false, phone: false, random: 0.9, asBuilt: false, time: null }, opts || {});
    const ctx = await browser.newContext(o.phone
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
      : { viewport: { width: 1440, height: 900 } });
    ctx.beacons = [];
    ctx.outside = [];
    ctx.opts = o;
    await ctx.addInitScript('Math.random = function () { return ' + o.random + '; };');
    await ctx.route('**/*', async (route) => {
      const req = route.request();
      const u = new URL(req.url());
      if (u.origin === base) {
        if (u.pathname === '/js/giveaway-popup.js' && o.live) {
          return route.fulfill({ status: 200, contentType: 'text/javascript', body: SCRIPT.replace(SWITCH, 'var LIVE = true;') });
        }
        if (o.live && !o.asBuilt && req.resourceType() === 'document') {
          const resp = await route.fetch();
          const text = await resp.text();
          return route.fulfill({ response: resp, body: text.replace(/"open":\s*false/, '"open": true') });
        }
        return route.continue();
      }
      if (u.hostname === 'book.loxleyforest.com' && u.pathname === '/v1/funnel') {
        try { ctx.beacons.push(JSON.parse(req.postData() || '{}')); } catch (e) { ctx.beacons.push({ bad: req.postData() }); }
        return route.fulfill({ status: 204, body: '' });
      }
      if (u.hostname === 'book.loxleyforest.com') return route.fulfill({ status: 404, body: '{}' });
      ctx.outside.push(u.hostname);
      return route.abort();
    });
    const page = await ctx.newPage();
    await page.clock.install(o.time ? { time: o.time } : {});
    return { ctx, page };
  }
  async function go(page, p) { await page.goto(base + p, { waitUntil: 'load' }); await page.clock.runFor(50); await page.waitForTimeout(150); }
  async function runFor(page, ms) { await page.clock.runFor(ms); await page.waitForTimeout(100); }
  async function exit(page) {
    await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, relatedTarget: null, bubbles: true })));
    await page.clock.runFor(100); await page.waitForTimeout(450);
  }
  async function card(page) { return page.evaluate(() => { const c = document.getElementById('lf-gw'); return c ? { in: c.classList.contains('is-in'), sheet: c.classList.contains('is-sheet'), href: (c.querySelector('a.lf-gw__btn') || {}).getAttribute ? c.querySelector('a.lf-gw__btn').getAttribute('href') : '' } : null; }); }
  async function box(page) { const h = await page.$('#lf-gw'); return h ? h.boundingBox() : null; }
  async function bar(page) { return page.evaluate(() => { const b = document.getElementById('lf-gwbar'); return b ? { text: b.textContent, href: (b.querySelector('a') || {}).getAttribute ? b.querySelector('a').getAttribute('href') : '' } : null; }); }
  function steps(ctx) { return ctx.beacons.filter(b => /^popup_/.test(b.step || '')); }

  // ---- the files
  console.log('the files');
  check((SCRIPT.match(new RegExp(SWITCH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1, 'the pull switch is one line, LIVE false as shipped');
  for (const n of SCRIPT_PAGES) {
    const h = fs.readFileSync(path.join(ROOT, n), 'utf8');
    check(h.includes('<script src="js/giveaway-popup.js" defer>') && h.includes('id="lf-gw-words"'), n + ' loads the script and carries its words');
  }
  for (const n of NO_SCRIPT) {
    if (!fs.existsSync(path.join(ROOT, n))) continue;
    const h = fs.readFileSync(path.join(ROOT, n), 'utf8');
    check(!h.includes('giveaway-popup.js') && !h.includes('lf-gw-words'), n + ' never loads it');
  }
  {
    const gw = fs.readFileSync(path.join(ROOT, 'giveaway.html'), 'utf8');
    const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'experiences.html'), 'utf8').match(/<script type="application\/json" id="lf-gw-words">(.*?)<\/script>/)[1]);
    check(gw.includes('>' + words.h.replace(/&/g, '&amp;') + '<'), 'the card says what the rules page says: ' + JSON.stringify(words.h));
    check(fs.readFileSync(path.join(ROOT, 'book.html'), 'utf8').includes('<p class="lf-gw-line" id="lf-gw-line" hidden>'), '/book carries its quiet line, hidden');
  }

  // ---- shipped: LIVE false
  console.log('shipped (LIVE false)');
  {
    const { ctx, page } = await visitor({ live: false });
    await go(page, '/experiences'); await runFor(page, 6000); await exit(page);
    check(!(await card(page)), 'desktop /experiences: no card after the pointer leaves');
    await go(page, '/book');
    check(await page.evaluate(() => document.getElementById('lf-gw-line').hidden === true), '/book: the quiet line stays hidden');
    check(steps(ctx).length === 0, 'no popup_ step reached the beacon');
    await ctx.close();
    const m = await visitor({ live: false, phone: true });
    await go(m.page, '/treehouses'); await go(m.page, '/experiences'); await runFor(m.page, 3000);
    check(!(await card(m.page)), 'phone, second page: no sheet');
    await m.ctx.close();
  }

  // ---- live: a desktop visitor from the site
  console.log('live (LIVE true), desktop, a visitor from the site');
  {
    const { ctx, page } = await visitor({ live: true });
    await go(page, '/experiences');
    await runFor(page, 2000); await exit(page);
    check(!(await card(page)), 'the pointer leaving before 5 s shows nothing');
    await runFor(page, 4000); await exit(page);
    let c = await card(page);
    check(c && c.in && !c.sheet, 'after 5 s the pointer leaving the top shows the card');
    const b = await box(page);
    check(b && b.height < 900 * 0.8 && b.width < 1440 * 0.5, 'the card is a corner card, not a screen: ' + (b ? Math.round(b.width) + 'x' + Math.round(b.height) : 'none'));
    check(c && c.href === '/giveaway?src=giveaway-site', 'its button goes to /giveaway?src=giveaway-site');
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'popup-desktop.png') });
    let s = steps(ctx);
    check(s.length === 1 && s[0].step === 'popup_shown' && s[0].path === '/experiences', 'popup_shown reached the beacon with the page');
    check(s.every(x => Object.keys(x).every(k => ['visit', 'step', 'path', 'src', 'referrer'].includes(k))), 'the beacon carries only visit, step, path, src, referrer');
    await page.click('#lf-gw .lf-gw__x'); await runFor(page, 500);
    s = steps(ctx);
    check(s.length === 2 && s[1].step === 'popup_close', 'closing it tells popup_close');
    check(!(await page.$('#lf-gw')), 'the card is gone');
    let f = await bar(page);
    check(f && f.href === '/giveaway?src=giveaway-site' && f.text.length > 10, 'dismissed, it folds to one line with the link');
    await go(page, '/faq'); await runFor(page, 6000); await exit(page);
    check(!(await card(page)), 'once per visitor: the next page shows no card');
    check(!!(await bar(page)), 'the folded line stays for the visit');
    check(steps(ctx).length === 2, 'no second popup_shown');
    check(ctx.outside.length === 0 || ctx.outside.every(h => /googletagmanager|fonts\.g|google-analytics|clarity|facebook/.test(h)), 'nothing left for anywhere but the booking server and the usual tags');
    await ctx.close();
  }

  // ---- live: an ad landing, and the click
  console.log('live, desktop, an ad landing');
  {
    const { ctx, page } = await visitor({ live: true });
    await go(page, '/experiences?gclid=abc123'); await runFor(page, 6000); await exit(page);
    const c = await card(page);
    check(c && c.href === '/giveaway?src=giveaway-ads', 'after an ad landing the button goes to ?src=giveaway-ads');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('#lf-gw a.lf-gw__btn')]);
    await runFor(page, 200);
    const s = steps(ctx).map(x => x.step);
    check(s.includes('popup_click') && !s.includes('popup_close'), 'the click tells popup_click, not popup_close');
    check(page.url().endsWith('/giveaway?src=giveaway-ads'), 'and lands on the rules page with the route');
    check((await page.evaluate(() => document.getElementById('gw-src').value)) === 'giveaway-ads', 'whose form keeps the route');
    check(!(await card(page)), 'no card on /giveaway');
    await ctx.close();
    const u = await visitor({ live: true });
    await go(u.page, '/?utm_source=google&utm_campaign=brand'); await go(u.page, '/experiences'); await runFor(u.page, 6000); await exit(u.page);
    const c2 = await card(u.page);
    check(c2 && c2.href === '/giveaway?src=giveaway-ads', 'utm_source=google on the landing page counts as an ad landing, on a later page too');
    await u.ctx.close();
  }

  // ---- live: the pages that never show it
  console.log('live, the pages that never show it');
  {
    const { ctx, page } = await visitor({ live: true });
    await go(page, '/elopements'); await runFor(page, 6000); await exit(page);
    check(!(await card(page)), '/elopements (a talk.js page): no card');
    await go(page, '/book');
    check(await page.evaluate(() => { const l = document.getElementById('lf-gw-line'); return l && !l.hidden && l.querySelector('a').getAttribute('href') === '/giveaway?src=giveaway-site'; }), '/book: the quiet line shows with its link');
    await runFor(page, 6000); await exit(page);
    check(!(await card(page)), '/book: no card');
    await go(page, '/giveaway'); await runFor(page, 6000); await exit(page);
    check(!(await card(page)), '/giveaway: no card');
    check(steps(ctx).length === 0, 'none of them told a popup_ step');
    await ctx.close();
  }

  // ---- live: a phone
  console.log('live, a phone');
  {
    const { ctx, page } = await visitor({ live: true, phone: true });
    await go(page, '/treehouses'); await runFor(page, 3000);
    check(!(await card(page)), 'first landing: nothing');
    await go(page, '/experiences'); await runFor(page, 3000);
    const c = await card(page);
    check(c && c.in && c.sheet, 'second page: the bottom sheet');
    const b = await box(page);
    check(b && b.height <= 844 * 0.7 + 2 && b.y >= 844 * 0.3, 'never full screen: ' + (b ? Math.round(b.width) + 'x' + Math.round(b.height) + ' at y ' + Math.round(b.y) : 'none'));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'popup-phone.png') });
    check(steps(ctx).some(x => x.step === 'popup_shown' && x.path === '/experiences'), 'popup_shown reached the beacon');
    await page.click('#lf-gw .lf-gw__x'); await runFor(page, 500);
    check(!!(await bar(page)) && !(await page.$('#lf-gw')), 'closed, it folds to the line');
    await ctx.close();
  }

  // ---- live: the holdout
  console.log('live, the holdout (one visitor in three)');
  {
    const { ctx, page } = await visitor({ live: true, random: 0.1 });
    await go(page, '/experiences'); await runFor(page, 6000); await exit(page);
    check(!(await card(page)), 'the holdout never sees the card');
    let s = steps(ctx);
    check(s.length === 1 && s[0].step === 'popup_held_out' && s[0].path === '/experiences', 'and tells popup_held_out where it would have shown');
    check(await page.evaluate(() => JSON.parse(localStorage.getItem('lf_giveaway')).holdout === true), 'the holdout is kept for the visitor');
    await go(page, '/faq'); await runFor(page, 6000); await exit(page);
    check(steps(ctx).length === 1, 'once per visit');
    // A later visit by the same held-out visitor (a new tab: new session, same storage).
    const again = await ctx.newPage(); await again.clock.install();
    await go(again, '/experiences'); await runFor(again, 6000); await exit(again);
    check(steps(ctx).length === 1 && !(await card(again)), 'and once per visitor, like the card: a later visit sends nothing');
    await ctx.close();
  }

  // ---- live: the switch alone opens nothing
  console.log('live, but the form not open, or closed by the clock');
  {
    const { ctx, page } = await visitor({ live: true, asBuilt: true });
    await go(page, '/experiences'); await runFor(page, 6000); await exit(page);
    check(!(await card(page)) && steps(ctx).length === 0, 'with the words block as built today (the form not yet open): no card, no step');
    await go(page, '/book');
    check(await page.evaluate(() => document.getElementById('lf-gw-line').hidden === true), 'and /book\'s line stays hidden');
    await ctx.close();
    const late = await visitor({ live: true, time: new Date('2026-12-14T06:00:00Z') });
    await go(late.page, '/experiences'); await runFor(late.page, 6000); await exit(late.page);
    check(!(await card(late.page)) && steps(late.ctx).length === 0, 'after the close (Dec 14, 06:00 UTC on the visitor\'s clock): no card, no step');
    await late.ctx.close();
  }

  // ---- live: after an entry
  console.log('live, after an entry');
  {
    const { ctx, page } = await visitor({ live: true });
    await go(page, '/giveaway-entered');
    check(await page.evaluate(() => !!JSON.parse(localStorage.getItem('lf_giveaway') || '{}').entered), 'the entered page remembers the entry');
    check(await page.evaluate(() => { const a = document.querySelector('.lf-actions a[href="/book?src=giveaway-site"]'); return !!a; }), 'and links the open nights');
    await go(page, '/experiences'); await runFor(page, 6000); await exit(page);
    check(!(await card(page)) && steps(ctx).length === 0, 'never a card after an entry, and no step');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_popup: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
