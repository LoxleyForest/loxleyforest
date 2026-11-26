#!/usr/bin/env node
/* Checks every checkbox and radio inside an .lf-form, in a real browser, on a local copy of the site:
   a ticked box must look different from an empty one.

   Run from the repo:  node scripts/site/check_boxes.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   The fault it was written for (2026-11-13, an Instagram comment, "the boxes are not working"):
   `.lf-form input` sets appearance none and min-height 52px on every input, and the giveaway's
   `.gw-check input[type="checkbox"]` rule set only width and height, so each box drew 20 by 52 px
   with no tick when ticked. A visitor tapped, saw nothing, tapped again, unticked the required box,
   and the browser refused the entry. check_giveaway.py reads the markup and could not see it.

   It proves, on a phone (390 px) and a desk (1280 px), for every .lf-form input[type=checkbox] and
   input[type=radio] on every root page (a form hidden behind a switch is shown for the measurement):
   the computed appearance is not none; the box is square and between 14 and 28 px; a tap on its label
   ticks it and the pixels change; a second tap unticks it and the pixels are the empty box's again;
   and, for a required box, the form refuses while it is empty and accepts once it is ticked. Nothing
   leaves this machine: every outside request is refused. */
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
const SELECTOR = '.lf-form input[type="checkbox"], .lf-form input[type="radio"]';

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

// The pages that carry a box: read from the files, so a new form with one is checked without being named.
function pagesWithBoxes() {
  const out = [];
  for (const n of fs.readdirSync(ROOT).sort()) {
    if (!n.endsWith('.html')) continue;
    const h = fs.readFileSync(path.join(ROOT, n), 'utf8');
    if (/class="[^"]*\blf-form\b/.test(h) && /type="(?:checkbox|radio)"/.test(h)) out.push(n);
  }
  return out;
}

async function main() {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  const pages = pagesWithBoxes();
  check(pages.length > 0, 'pages with a box in an .lf-form: ' + (pages.join(', ') || 'none'));

  for (const shape of [{ name: 'phone', phone: true }, { name: 'desk', phone: false }]) {
    const ctx = await browser.newContext(shape.phone
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
      : { viewport: { width: 1280, height: 900 } });
    const outside = [];
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.origin === base) return route.continue();
      outside.push(u.hostname);
      return route.abort();
    });
    const page = await ctx.newPage();
    for (const n of pages) {
      console.log(shape.name + ' ' + n);
      await page.goto(base + '/' + n, { waitUntil: 'load' });
      // A form behind a switch (the giveaway while closed) is shown so its boxes can be measured.
      await page.evaluate((sel) => {
        for (const el of document.querySelectorAll(sel)) {
          for (let p = el; p; p = p.parentElement) { p.removeAttribute('hidden'); if (p.hasAttribute('disabled')) p.removeAttribute('disabled'); }
        }
      }, SELECTOR);
      const boxes = await page.$$(SELECTOR);
      check(boxes.length > 0, boxes.length + ' box(es) in an .lf-form');
      for (let i = 0; i < boxes.length; i++) {
        const el = boxes[i];
        const info = await el.evaluate((e) => {
          const cs = getComputedStyle(e);
          const label = e.closest('label') || (e.id && document.querySelector('label[for="' + e.id + '"]'));
          return { name: e.name, type: e.type, required: e.required, checked: e.checked,
            appearance: cs.appearance, webkit: cs.webkitAppearance, hasLabel: !!label,
            text: label ? label.textContent.trim().slice(0, 40) : '' };
        });
        const who = info.type + ' ' + info.name + ' ("' + info.text + '...")';
        await el.scrollIntoViewIfNeeded();
        const b = await el.boundingBox();
        check(info.appearance !== 'none' && info.webkit !== 'none', who + ': native look (appearance ' + info.appearance + ')');
        check(b && Math.abs(b.width - b.height) <= 2 && b.width >= 14 && b.width <= 28,
          who + ': square, ' + (b ? Math.round(b.width) + ' by ' + Math.round(b.height) + ' px' : 'not drawn'));
        check(info.hasLabel, who + ': has a label to tap');
        check(!info.checked, who + ': empty before any tap');
        // The pixels: empty, ticked, empty again. Focus is dropped and the pointer parked off the
        // box before each shot, so neither an outline nor a desk's hover look is the difference.
        const shot = async (tag) => {
          await page.evaluate(() => document.activeElement && document.activeElement.blur());
          await page.mouse.move(0, 0);
          await page.waitForTimeout(120);
          const png = await el.screenshot({ type: 'png' });
          if (SHOTS) fs.writeFileSync(path.join(SHOTS, shape.name + '-' + n.replace(/\.html$/, '') + '-' + info.name + '-' + tag + '.png'), png);
          return png;
        };
        const label = await el.evaluateHandle((e) => e.closest('label') || document.querySelector('label[for="' + e.id + '"]') || e);
        const empty = await shot('empty');
        await label.asElement().click();
        const ticked = await shot('ticked');
        const after1 = await el.evaluate((e) => e.checked);
        check(after1, who + ': one tap on the label ticks it');
        check(!empty.equals(ticked), who + ': the ticked box looks different from the empty one (' + empty.length + ' vs ' + ticked.length + ' bytes)');
        if (info.required) {
          const form = await el.evaluateHandle((e) => e.form);
          const ok = await form.evaluate((f, name) => { const e = f.elements[name]; return { valid: e.validity.valid }; }, info.name);
          check(ok.valid, who + ': the form accepts the field once ticked');
        }
        if (info.type === 'checkbox') {
          await label.asElement().click();
          const again = await shot('empty-again');
          const after2 = await el.evaluate((e) => e.checked);
          check(!after2, who + ': a second tap unticks it');
          check(again.equals(empty), who + ': unticked, it looks exactly as it did before');
          if (info.required) {
            const ok = await el.evaluate((e) => e.validity.valid);
            check(!ok, who + ': the form refuses the field while it is empty');
          }
        }
      }
    }
    console.log('  ' + shape.name + ': outside requests refused, none left this machine' + (outside.length ? ' (' + Array.from(new Set(outside)).join(', ') + ')' : ''));
    await ctx.close();
  }
  await browser.close();
  srv.close();
  console.log('check_boxes: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
