#!/usr/bin/env node
/* Checks the "first to know" sign-up in a real browser (2026-11-18, D13): the page as the builder
   writes it with the switch on, served on a local copy of the site; nothing leaves this machine
   (the Netlify post is answered here; every other outside request is refused).

   Run from the repo:  node scripts/site/check_first_to_know.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE), the Chromium at
   ~/.cache/ms-playwright/chromium-1243 (never "playwright install"), and python3 for the render.

   It proves, at 390 by 844 and 1280 wide: the form sits in the footer; src reads the link's token
   (?src=giveaway-bio), the visit's kept entry, or direct, and page reads the page's path; a submit
   posts the five fields to / as Netlify takes them (form-name, src, page, email, bot-field empty)
   and shows the thanks line in place with the box and button gone; a failed post falls back to the
   plain submit to /first-to-know-thanks; the thanks page renders. */
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
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };

// The two pages as the builder writes them with the switch on, rendered in process; nothing written.
const RENDER = `
import json, sys
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'scripts', 'site'))})
import build_v2 as B
B.page_modules()
B.FIRST_TO_KNOW = True
ftk = sys.modules['lfpage_first_to_know']
_, home = B.render(B.page_index)
_, thanks = B.render(ftk.page_thanks)
print(json.dumps({'home': home, 'thanks': thanks, 'thanksPath': B.FTK_THANKS, 'done': B.FTK_WORDS['done']}))
`;
const out = execFileSync('python3', ['-c', RENDER], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString();
const PAGES = JSON.parse(out.trim().split('\n').pop());

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

  async function visitor(opts) {
    const o = Object.assign({ phone: true, postOk: true, entry: null }, opts || {});
    const ctx = await browser.newContext(o.phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
    ctx.posts = [];
    if (o.entry) await ctx.addInitScript('try { sessionStorage.setItem("gh_entry", ' + JSON.stringify(JSON.stringify(o.entry)) + '); } catch (e) {}');
    await ctx.route('**/*', async (route) => {
      const req = route.request(); const u = new URL(req.url());
      if (u.origin === base) {
        if (req.method() === 'POST') {
          ctx.posts.push({ path: u.pathname, body: req.postData() || '' });
          return o.postOk ? route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }) : route.fulfill({ status: 500, body: 'no' });
        }
        if (u.pathname === '/' || u.pathname === '/index.html') return route.fulfill({ status: 200, contentType: 'text/html', body: PAGES.home });
        if (u.pathname === PAGES.thanksPath || u.pathname === PAGES.thanksPath + '.html') return route.fulfill({ status: 200, contentType: 'text/html', body: PAGES.thanks });
        return route.continue();
      }
      if (u.hostname === 'book.loxleyforest.com') return route.fulfill({ status: 204, body: '' });
      return route.abort();
    });
    const page = await ctx.newPage();
    return { ctx, page };
  }
  const fields = (body) => Object.fromEntries(new URLSearchParams(body));
  async function form(page) {
    return page.evaluate(() => {
      const f = document.querySelector('form[name="first-to-know"]');
      if (!f) return null;
      const inFoot = !!f.closest('footer');
      const b = f.getBoundingClientRect();
      return { inFoot, src: f.querySelector('input[name="src"]').value, page: f.querySelector('input[name="page"]').value,
        emailShown: !f.querySelector('input[type="email"]').hidden, done: f.querySelector('.lf-signup__done'), doneHidden: f.querySelector('.lf-signup__done').hidden,
        width: Math.round(b.width), inner: window.innerWidth };
    });
  }

  console.log('phone, a link with a token');
  {
    const { ctx, page } = await visitor({ phone: true });
    await page.goto(base + '/?src=giveaway-bio', { waitUntil: 'load' });
    const f = await form(page);
    check(f && f.inFoot, 'the form sits in the footer');
    check(f && f.src === 'giveaway-bio' && f.page === '/', 'src reads the link\'s token and page the path: ' + JSON.stringify(f && [f.src, f.page]));
    check(f && f.width <= f.inner - 16, 'it fits the phone (' + (f || {}).width + ' of ' + (f || {}).inner + ' px)');
    await page.fill('form[name="first-to-know"] input[type="email"]', 'check@example.net');
    await page.click('form[name="first-to-know"] button[type="submit"]');
    await page.waitForTimeout(600);
    check(ctx.posts.length === 1 && ctx.posts[0].path === '/', 'one post, to / as Netlify takes it');
    const got = fields((ctx.posts[0] || {}).body || '');
    check(got['form-name'] === 'first-to-know' && got.src === 'giveaway-bio' && got.page === '/' && got.email === 'check@example.net' && got['bot-field'] === '', 'with the five fields: ' + JSON.stringify(got));
    const after = await form(page);
    check(after && !after.emailShown && !after.doneHidden, 'the thanks line shows in place, the box and button gone');
    check(after && (await page.evaluate(() => document.querySelector('form[name="first-to-know"] .lf-signup__done').textContent.trim())) === PAGES.done, 'in the words of the build');
    await ctx.close();
  }

  console.log('desk, no token: the visit\'s kept entry, else direct');
  {
    const { ctx, page } = await visitor({ phone: false, entry: { referrer: 'instagram.com', src: 'manychat' } });
    await page.goto(base + '/', { waitUntil: 'load' });
    const f = await form(page);
    check(f && f.src === 'manychat', 'src reads the entry the visit kept: ' + (f || {}).src);
    await ctx.close();
  }
  {
    const { ctx, page } = await visitor({ phone: false });
    await page.goto(base + '/', { waitUntil: 'load' });
    const f = await form(page);
    check(f && f.src === 'direct', 'with nothing to read, direct');
    await ctx.close();
  }

  console.log('a failed post falls back to the plain submit');
  {
    const { ctx, page } = await visitor({ phone: true, postOk: false });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.fill('form[name="first-to-know"] input[type="email"]', 'check@example.net');
    await Promise.all([page.waitForNavigation({ timeout: 8000 }).catch(() => null), page.click('form[name="first-to-know"] button[type="submit"]')]);
    await page.waitForTimeout(400);
    check(ctx.posts.length >= 2 && ctx.posts[ctx.posts.length - 1].path === PAGES.thanksPath, 'the plain submit goes to ' + PAGES.thanksPath + ' (' + ctx.posts.map(p => p.path).join(', ') + ')');
    await ctx.close();
  }

  console.log('the thanks page');
  {
    const { ctx, page } = await visitor({ phone: true });
    await page.goto(base + PAGES.thanksPath, { waitUntil: 'load' });
    check(await page.evaluate(() => !!document.querySelector('.lf-note h1') && document.documentElement.scrollWidth <= window.innerWidth), 'renders as a note, no sideways scroll');
    check(await page.evaluate(() => !!document.querySelector('meta[name="robots"][content*="noindex"]')), 'noindex');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('check_first_to_know: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
