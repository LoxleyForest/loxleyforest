#!/usr/bin/env node
/* Checks The Letter, the private page where a guest writes to their future selves
   (private/letter-62a1b3/, the Chief's route of 2026-11-10), in a real browser on a local copy of
   the site at a phone's 390 px.

   Run from the repo:  node scripts/site/check_letter.js
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine: the Netlify post is answered here (200, or 500 for the failing case).
   Every name typed is made up.

   It proves: noindex, no Tag Manager, no request to any host but the page's own (the fonts are
   embedded); the form is a Netlify form named anniversary-letter with the honeypot, posting to its
   own private path and never to a path holding /success; the arrival day starts a year from today
   and will not take a day that has passed; what is typed is kept on the phone (a reload restores
   it) and only there; a send posts one form-encoded body with the form's name and every field, then
   shows the thank-you with the day in words, hides the form and forgets the draft; a send the
   server refuses keeps the draft, shows the plain line and leaves the button live; nothing in the
   page's own storage or requests reaches another host; no sideways scroll; no script errors. */
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
const DIR = fs.readdirSync(path.join(ROOT, 'private')).find((d) => /^letter-[0-9a-f]{6}$/.test(d));
if (!DIR) { console.error('no private/letter-<hex>/ folder'); process.exit(2); }
const PAGE = '/private/' + DIR + '/';
const HTML = fs.readFileSync(path.join(ROOT, 'private', DIR, 'index.html'), 'utf8');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };

let passes = 0, failures = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

function serve(state) {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => { state.posts.push({ path: p, type: req.headers['content-type'] || '', body }); res.writeHead(state.fail ? 500 : 200, { 'Content-Type': 'text/html' }); res.end(state.fail ? 'no' : 'ok'); });
      return;
    }
    let f = path.join(ROOT, p);
    if (p.endsWith('/')) f = path.join(f, 'index.html');
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

const pad = (n) => (n < 10 ? '0' : '') + n;
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

async function main() {
  console.log('the file');
  const formTag = (HTML.match(/<form\b[^>]*>/) || [''])[0];
  check(/name="robots" content="noindex, nofollow, noarchive"/.test(HTML), 'noindex, nofollow, noarchive');
  check(!/googletagmanager|gtm\.js|GTM-/.test(HTML), 'no Tag Manager');
  check(!/https?:\/\//.test(HTML.replace(/<!--[\s\S]*?-->/, '')), 'no outside address anywhere in the page (fonts embedded)');
  check(/name="anniversary-letter"/.test(formTag) && /data-netlify="true"/.test(formTag) && /data-netlify-honeypot="bot-field"/.test(formTag), 'a Netlify form named anniversary-letter with the honeypot');
  check(new RegExp('action="' + PAGE.replace(/\//g, '\\/') + '"').test(formTag) && !/success/.test(formTag), 'it posts to its own private path, never to a path holding /success');
  check(/<input type="hidden" name="form-name" value="anniversary-letter">/.test(HTML), 'the form-name field Netlify needs');
  for (const n of ['letter', 'names', 'arrive', 'line1', 'line2', 'city', 'state', 'zip']) check(new RegExp('name="' + n + '"').test(HTML), 'the field ' + n);
  // the page's words alone: the head's comment and the style block (the embedded fonts' data) are not words
  const WORDS = HTML.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/, '');
  // Mick's approved lead, 2026-11-10 ("Love it! Sold"), by the Chief: exactly these words
  const LEAD = 'Write to each other. What you felt here, what you promised, what you hope is still true a year from now. Leave it with us, and on your anniversary it arrives at your door.';
  check(WORDS.includes('<p class="lead">' + LEAD + '</p>'), 'the lead is Mick\'s approved line, word for word');
  check(/on your anniversary it arrives at your door/.test(WORDS) && !/calligraph|wax|\bseal/i.test(WORDS), 'the promise is the arrival on their anniversary; nothing about a hand or a seal');

  const state = { posts: [], fail: false };
  const srv = await serve(state);
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const outside = [];
  await ctx.route('**/*', (route) => { const u = new URL(route.request().url()); if (u.origin !== base) { outside.push(u.href); return route.abort(); } return route.continue(); });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));

  console.log('on a phone');
  await page.goto(base + PAGE, { waitUntil: 'load' });
  check(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'no sideways scroll at 390');
  const year = new Date(); year.setHours(12, 0, 0, 0); year.setFullYear(year.getFullYear() + 1);
  const tomorrow = new Date(); tomorrow.setHours(12, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
  const arrive = await page.evaluate(() => ({ value: document.getElementById('f-arrive').value, min: document.getElementById('f-arrive').min }));
  check(arrive.value === iso(year) && arrive.min === iso(tomorrow), 'the arrival day starts a year from today (' + arrive.value + ') and takes no day that has passed (min ' + arrive.min + ')');

  // kept on the phone as they write
  await page.fill('#f-letter', 'Dear us,\n\nRemember the bridge at dusk.');
  await page.fill('#f-names', 'Ana & Luis Example');
  await page.fill('#f-line1', '1 Test Lane');
  await page.fill('#f-city', 'Testville');
  await page.fill('#f-state', 'ga');
  await page.fill('#f-zip', '30533');
  await page.waitForTimeout(500);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lf_letter_draft') || 'null'));
  check(stored && stored.letter === 'Dear us,\n\nRemember the bridge at dusk.' && stored.names === 'Ana & Luis Example' && stored.zip === '30533', 'what is typed is kept on the phone as they write');
  await page.reload({ waitUntil: 'load' });
  const back = await page.evaluate(() => ({ letter: document.getElementById('f-letter').value, names: document.getElementById('f-names').value, city: document.getElementById('f-city').value }));
  check(back.letter === 'Dear us,\n\nRemember the bridge at dusk.' && back.names === 'Ana & Luis Example' && back.city === 'Testville', 'a reload brings it back');
  check(state.posts.length === 0 && outside.length === 0, 'nothing has been sent anywhere yet');

  // a send the server refuses: the draft stays, the plain line shows, the button is live again
  state.fail = true;
  await page.click('#send');
  await page.waitForSelector('#err.on', { timeout: 5000 });
  const afterFail = await page.evaluate(() => ({ err: document.getElementById('err').classList.contains('on'), form: document.getElementById('letter').hidden, draft: !!localStorage.getItem('lf_letter_draft'), live: !document.getElementById('send').disabled }));
  check(afterFail.err && !afterFail.form && afterFail.draft && afterFail.live, 'a refused send: the plain line, the form still there, the draft kept, the button live');
  check(/couldn't send it just now\. Your letter is still saved on this phone/.test(await page.textContent('#err')), 'in the page\'s own words');

  // a send that lands: one form-encoded post to the private path with the form's name and every field
  state.fail = false;
  await page.click('#send');
  await page.waitForSelector('#done.on', { timeout: 5000 });
  const post = state.posts[state.posts.length - 1];
  const sent = new URLSearchParams(post.body);
  check(state.posts.length === 2 && post.path === PAGE && /x-www-form-urlencoded/.test(post.type), 'one form-encoded post to ' + PAGE);
  check(sent.get('form-name') === 'anniversary-letter' && sent.get('letter') === 'Dear us,\n\nRemember the bridge at dusk.' && sent.get('names') === 'Ana & Luis Example' && sent.get('arrive') === iso(year) && sent.get('line1') === '1 Test Lane' && sent.get('city') === 'Testville' && sent.get('state') === 'GA' && sent.get('zip') === '30533' && sent.get('bot-field') === '', 'with the form\'s name, the letter, the names, the day, the address (the state in capitals) and an empty honeypot');
  const doneState = await page.evaluate(() => ({ form: document.getElementById('letter').hidden, date: document.getElementById('done-date').textContent, draft: localStorage.getItem('lf_letter_draft'), text: document.getElementById('done').innerText }));
  const dayWords = year.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  check(doneState.form && doneState.date === dayWords, 'the thank-you names the day in words: ' + doneState.date);
  check(/It's with us\./.test(doneState.text) && /We'll mail your letter to you on/.test(doneState.text), 'in the page\'s own words');
  check(doneState.draft === null, 'and the draft is gone from the phone');
  check(outside.length === 0, 'no request to any other host, start to finish');
  check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join('; ') : ''));

  await ctx.close();
  await browser.close();
  srv.close();
  console.log('check_letter: ' + passes + ' ok, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
