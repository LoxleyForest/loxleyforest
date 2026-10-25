#!/usr/bin/env node
/* Checks The Golden Arrow (2026-10-25) in a real browser, on a local copy of the site, phone width
   390: the purchase panel on /gift, its fallback while the engine's gift route answers 404, the card
   on /gift/card#code=, and a gift code riding /book#gift= into the quote and the checkout.

   Run from the repo:  node scripts/site/check_gift.js        (SHOTS=dir to save screenshots and the
                                                               printed card as a PDF)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine. The engine (book.loxleyforest.com) is answered here with made-up
   gifts, quotes and payment pages, in the shapes js/gift.js and js/gatehouse.js read (the contract
   the engine must match is in the report and in those files' heads); Stripe is a stub; Tag Manager
   and everything else get an empty answer. Every name and email is made up (example.test). The
   local server applies netlify.toml's 200 rewrites, so /gift/card is served as it will be live.

   It proves:
     - /gift: no price in the page's prose; the panel says to call or text Mick while the route is
       off (the engine's bare 404 "not found") or unreachable; with the route on, the fields, the
       checks before anything is sent, the body sent (and only the contract's fields), the all-in
       amount shown only in the purchase step, the payment page reused for the same details, Stripe
       reached by script (never an <a href>), a non-Stripe answer refused;
     - /gift/card: the code lifted out of the address bar before Tag Manager, the card filled from
       GET /v1/gift with the card's ratified words, long names stepped down beside the photo,
       printable as one page, the share link, "Choose your dates" into /book#gift=, and the plain
       sentences for no code, an unknown code, a pending payment, a used gift and a route switched off;
     - /book#gift=: the code rides the quote and the checkout, the total panel says "The Golden Arrow
       covers these nights" with what remains due, fully covered and in part, and says plainly when
       the gift cannot be used, cannot be found, or the route is off (then no code rides the quote);
     - no beacon, no tag-manager entry and no request to any other host ever carries a gift code,
       a name or an email; no sideways scroll at 390; no script errors. */
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
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };

// netlify.toml's rewrites (status 200), applied as Netlify will.
const REWRITES = {};
for (const m of fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8').matchAll(/\[\[redirects\]\]\s*\n\s*from\s*=\s*"([^"]+)"\s*\n\s*to\s*=\s*"([^"]+)"\s*\n\s*status\s*=\s*(\d+)/g)) {
  if (m[3] === '200') REWRITES[m[1]] = m[2];
}

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/') p = '/index.html';
    if (REWRITES[p] || REWRITES[p.replace(/\/$/, '')]) p = REWRITES[p] || REWRITES[p.replace(/\/$/, '')];
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

// ---- the words, from the page module (the one WORDS block)
function words() {
  const src = fs.readFileSync(path.join(ROOT, 'gift.html'), 'utf8');
  const m = /<script type="application\/json" id="lf-gift-words">([\s\S]*?)<\/script>/.exec(src);
  return JSON.parse(m[1]);
}
const PANEL = words();
const CARD_W = JSON.parse(/<script type="application\/json" id="lf-gift-words">([\s\S]*?)<\/script>/.exec(fs.readFileSync(path.join(ROOT, 'gift-card.html'), 'utf8'))[1]);
const BOOK_W = JSON.parse(/<script type="application\/json" id="lf-gift-words">([\s\S]*?)<\/script>/.exec(fs.readFileSync(path.join(ROOT, 'book.html'), 'utf8'))[1]);
// The card's ratified terms line (loxley-rescue docs/gift-card/golden-arrow/card.html, FILL.nights).
const RATIFIED = 'Good for any three nights, weekends included, January 4 to May 31, 2027, Valentine’s weekend aside. It never expires; for later dates, we ask only the difference if rates have risen.';
const RATIFIED_GIFT = 'Three nights in the treehouse, and the Dawn Table: Livy’s breakfast, carried across the bridge to your door.';

// ---- made-up data
function day(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const NIGHTS = { nights: Array.from({ length: 150 }, (_, i) => ({ night: day(i + 1), rate_cents: 55000, min_stay: 2 })) };
const CI = day(20), CO3 = day(23), CO4 = day(24), CI_NOTE = day(40), CO_NOTE = day(43);
const NIGHT_ALL_IN = 64439;
const CODE = 'GA-TEST-7Q2X', CODE_PENDING = 'GA-TEST-PEND', CODE_USED = 'GA-TEST-USED', CODE_LONG = 'GA-TEST-LONG';
const GIFTS = {
  [CODE]: { product: 'golden-arrow', status: 'paid', recipient_names: 'Ana & Luis', giver_name: 'Aunt June', covers: { nights: 3 }, never_expires: true, number: 'LF-0042' },
  [CODE_USED]: { product: 'golden-arrow', status: 'redeemed', recipient_names: 'Ana & Luis', giver_name: 'Aunt June', never_expires: true },
  [CODE_LONG]: { product: 'golden-arrow', status: 'paid', recipient_names: 'Elizabeth Anne Whitfield & Christopher James Okonkwo-Brennan',
    giver_name: 'Grandmother Josephine and Grandfather Bartholomew Whitfield', never_expires: true, number: 'LF-0043' },
};
const AGREEMENT = { version: 'check', text: '# The stay agreement\n\nA made-up agreement for the check.\n\n**I accept the release of liability.**\n' };
const PAY_URL = 'https://checkout.stripe.com/c/pay/cs_test_giftcheck';
const BUYER = { names: 'Maya & Sam', giver: 'Dad', email: 'buyer@example.test' };
const SHIP = { name: 'Dad Example', line1: '1 Test Lane', line2: 'Apt 2', city: 'Testville', state: 'GA', zip: '30533' };
const SECRETS = [CODE, CODE_PENDING, CODE_USED, CODE_LONG, BUYER.email, BUYER.names, 'Ana & Luis', 'Aunt June', 'Test Lane'];

function quote(u) {
  const ci = u.searchParams.get('check_in'), co = u.searchParams.get('check_out'), gift = u.searchParams.get('gift');
  const n = Math.round((new Date(co) - new Date(ci)) / 86400000);
  const total = n * NIGHT_ALL_IN;
  let giftCents = 0, note;
  if (gift === CODE || gift === CODE_LONG) {
    if (ci === CI_NOTE) note = 'the Golden Arrow covers nights from January 4, 2027';
    else giftCents = Math.min(total, 3 * NIGHT_ALL_IN);
  }
  const left = total - giftCents, dep = Math.round(left * 0.25);
  const q = { quote: { nights: n, total_cents: total, lines: [{ label: n + ' nights', cents: n * 55000 }, { label: 'Taxes and fees', cents: n * (NIGHT_ALL_IN - 55000) }] },
    modes: ['deposit', 'full'], promise: { retainer_pct: 25, balance_days: 30 },
    plans: { deposit: [{ amount_cents: dep }, { amount_cents: left - dep, due_on: day(-10) }], full: [{ amount_cents: left }] },
    summary: { deposit: { today_cents: dep, balance_cents: left - dep, balance_on: day(-10 + 20) }, full: { today_cents: left, balance_cents: 0, balance_on: null } },
    credit_cents: 0 };
  if (gift) { q.gift_cents = giftCents; if (note) q.gift_note = note; }
  return q;
}

let failures = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }
const has = (s, t) => String(s).indexOf(t) >= 0;

// Static: the pages as built.
function statics() {
  console.log('the pages as built');
  const gift = fs.readFileSync(path.join(ROOT, 'gift.html'), 'utf8');
  const card = fs.readFileSync(path.join(ROOT, 'gift-card.html'), 'utf8');
  const book = fs.readFileSync(path.join(ROOT, 'book.html'), 'utf8');
  const prose = gift.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  check(!/\$\s?\d/.test(prose) && !/\$\s?\d/.test(JSON.stringify(PANEL)), '/gift: no price in its prose or its words');
  check(has(gift, 'GTM-5N4BX66K') && has(card, 'GTM-5N4BX66K'), 'Tag Manager on both pages (the house rule)');
  const keysAt = card.indexOf('<!-- Booking keys'), gtmAt = card.indexOf('gtm.js?id=');
  check(keysAt > 0 && gtmAt > keysAt, '/gift/card: the keys script runs before Tag Manager');
  check(/'gift','code'\]/.test(book) && /'gift','code'\]/.test(card), 'the keys script lifts gift and code on /book and /gift/card');
  check(has(card, 'noindex') && !has(gift, 'noindex'), '/gift/card is noindex; /gift is not');
  check(/src="\/js\/gift\.js"/.test(card) && /src="\/css\/v2-pages\.css"|href="\/css\/v2-pages\.css"/.test(card), '/gift/card uses root paths (it is served one folder deep)');
  check(REWRITES['/gift/card'] === '/gift-card.html', 'netlify.toml serves /gift/card from gift-card.html');
  const linking = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html') && n !== 'gift.html' && n !== 'gift-card.html')
    .filter((n) => /href="\/?gift(?:[\/"#?.-])/i.test(fs.readFileSync(path.join(ROOT, n), 'utf8')));
  check(linking.length === 0, 'no other page links to /gift or /gift/card yet' + (linking.length ? ': ' + linking.join(', ') : ''));
  check(!/\/gift/.test(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')), 'not in sitemap.xml');
  check(has(gift, RATIFIED.replace(/’/g, '’')) || has(gift, RATIFIED), '/gift carries the card\'s ratified terms line');
  check(['book_covers', 'book_left', 'book_missing', 'book_cta'].every((k) => BOOK_W[k]) && BOOK_W.book_covers === 'The Golden Arrow covers these nights.', '/book carries the Golden Arrow\'s words');
}

async function main() {
  statics();
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errors = [];

  // engine: { gift: 'on' | 'off' | 'down', checkoutUrl, checkout404 }
  async function open(name, engine) {
    engine = Object.assign({ gift: 'on', checkoutUrl: PAY_URL }, engine || {});
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => {
      try { Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { window.__shared = d; return Promise.resolve(); } }); } catch (e) {}
      window.__printed = 0;
      window.print = () => { window.__printed++; };
    });
    const rec = { beacons: [], giftChecks: [], giftCheckouts: [], quotes: [], checkouts: [], outside: [], stripePages: [], pendingSeen: 0 };
    await ctx.route('**/*', (route) => {
      const req = route.request(), u = new URL(req.url());
      if (u.hostname === '127.0.0.1') return route.continue();
      if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o, s) => route.fulfill({ status: s || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify(o) });
        if (req.method() === 'OPTIONS') return json({});
        let b = {}; try { b = JSON.parse(req.postData() || '{}'); } catch (e) {}
        if (u.pathname === '/v1/funnel') { rec.beacons.push(req.postData() || ''); return json({ ok: true }); }
        if (u.pathname === '/v1/gift' || u.pathname === '/v1/gift/checkout') {
          if (engine.gift === 'off') return json({ error: 'not found' }, 404);
          if (engine.gift === 'down') return route.abort('failed');
        }
        if (u.pathname === '/v1/gift') {
          const code = u.searchParams.get('code') || '';
          rec.giftChecks.push(code);
          if (!code) return json({ error: 'A gift code is needed.' }, 400);
          if (code === CODE_PENDING) {
            rec.pendingSeen++;
            return json(Object.assign({}, GIFTS[CODE], { status: rec.pendingSeen < 2 ? 'pending' : 'paid' }));
          }
          if (GIFTS[code]) return json(GIFTS[code]);
          return json({ error: 'We could not find that gift.' }, 404);
        }
        if (u.pathname === '/v1/gift/checkout') {
          rec.giftCheckouts.push(b);
          if (engine.checkout404) return json({ error: 'not found' }, 404);
          return json({ url: engine.checkoutUrl, total_cents: 254580,
            lines: [{ label: 'The Golden Arrow', cents: 220000 }, { label: 'Taxes and fees', cents: 34580 }] });
        }
        if (u.pathname === '/v1/availability') return json(NIGHTS);
        if (u.pathname === '/v1/agreement') return json(AGREEMENT);
        if (u.pathname === '/v1/quote') { rec.quotes.push(u.search); return json(quote(u)); }
        if (u.pathname === '/v1/checkout') {
          rec.checkouts.push(b);
          const q = quote(new URL('https://x/?check_in=' + b.check_in + '&check_out=' + b.check_out + (b.gift ? '&gift=' + b.gift : '')));
          const left = q.quote.total_cents - (q.gift_cents || 0);
          if (!left) return json({ manage_token: 'mt-test-1', total_cents: q.quote.total_cents });
          return json({ client_secret: 'cs_test_secret_1', total_cents: q.quote.total_cents, summary: q.summary[b.mode] });
        }
        return json({ error: 'We could not find that.' }, 404);
      }
      rec.outside.push(req.url() + ' ' + (req.postData() || ''));
      if (u.hostname === 'js.stripe.com') {
        return route.fulfill({ status: 200, contentType: 'text/javascript',
          body: 'window.Stripe=function(){return{initEmbeddedCheckout:function(){return Promise.resolve({mount:function(t){document.querySelector(t).textContent="stripe test mount"},destroy:function(){}})}}};' });
      }
      if (u.hostname === 'checkout.stripe.com') {
        rec.stripePages.push(req.url());
        return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Stripe test</title><p>Stripe test page</p>' });
      }
      // Tag Manager, analytics and the rest: an empty answer, never the real thing.
      return route.fulfill({ status: 200, contentType: /\.js|gtm|gtag/.test(u.pathname) ? 'text/javascript' : 'text/plain', body: '' });
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(name + ': ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(name + ': ' + m.text()); });
    return { ctx, page, rec };
  }
  async function until(fn, n) { for (let i = 0; i < (n || 50) && !(await fn()); i++) await new Promise((r) => setTimeout(r, 100)); return fn(); }
  async function shot(page, file, full) {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, file), fullPage: full !== false });
  }
  const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  function leaks(rec, dl, label) {
    const outside = rec.outside.filter((x) => SECRETS.some((s) => x.indexOf(s) >= 0 || x.indexOf(encodeURIComponent(s)) >= 0));
    const beacon = rec.beacons.filter((x) => SECRETS.some((s) => x.indexOf(s) >= 0));
    const tags = SECRETS.filter((s) => dl.indexOf(s) >= 0);
    check(!outside.length && !beacon.length && !tags.length, label + ': no beacon, tag-manager entry or outside request carries a code, a name or an email' +
      (outside.length + beacon.length + tags.length ? ' (' + outside.concat(beacon, tags).join(' | ').slice(0, 300) + ')' : ''));
  }
  const dataLayer = (page) => page.evaluate(() => JSON.stringify(window.dataLayer || []));
  const text = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return n ? n.innerText.replace(/\s+/g, ' ').trim() : null; }, sel);

  // ------------------------------------------------------------------ /gift
  console.log('/gift while the engine\'s gift route answers 404 (switched off)');
  {
    const { ctx, page, rec } = await open('gift-off', { gift: 'off' });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-panel', { timeout: 10000 });
    check(await text(page, '#ga-buy .ga-panel__lead') === PANEL.off, 'the panel says plainly to call or text Mick');
    const links = await page.evaluate(() => [...document.querySelectorAll('#ga-buy a')].map((a) => a.getAttribute('href')));
    check(links.join() === 'tel:+17065024823,sms:+17065024823', 'with one tap to call and one to text');
    check(!(await page.$('#ga-buy form')), 'no form to fill while the route is off');
    check(rec.giftCheckouts.length === 0, 'nothing sent');
    const body = await page.evaluate(() => document.body.innerText);
    check(!/\$\s?\d/.test(body), 'no price anywhere on the page');
    check(has(body, RATIFIED), 'the window and the never-expires line, in the card\'s ratified words');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'gift-off.png');
    await ctx.close();
  }

  console.log('/gift with the engine unreachable');
  {
    const { ctx, page } = await open('gift-down', { gift: 'down' });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-panel', { timeout: 10000 });
    check(await text(page, '#ga-buy .ga-panel__lead') === PANEL.down, 'it says nothing was charged and gives Mick\'s number');
    await ctx.close();
  }

  console.log('/gift with the route on: the purchase panel');
  {
    const { ctx, page, rec } = await open('gift-on', {});
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    const ids = await page.evaluate(() => [...document.querySelectorAll('#ga-buy input')].map((i) => i.id));
    check(['ga-for', 'ga-from', 'ga-email', 'ga-mail'].every((i) => ids.indexOf(i) >= 0), 'their names, the giver\'s name, the email and "mail me the printed card"');
    check(await page.evaluate(() => document.querySelector('.ga-ship').hidden), 'the address stays hidden until the box is ticked');
    check(!/\$\s?\d/.test(await page.evaluate(() => document.body.innerText)), 'no amount on the page before the purchase step');
    await shot(page, 'gift-panel.png', false);
    await page.locator('#ga-buy form').scrollIntoViewIfNeeded();
    await shot(page, 'gift-panel-form.png', false);

    await page.click('#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_for && rec.giftCheckouts.length === 0, 'empty: it asks for their names and sends nothing');
    await page.fill('#ga-for', BUYER.names);
    await page.fill('#ga-from', BUYER.giver);
    await page.fill('#ga-email', 'not-an-email');
    await page.click('#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_email && rec.giftCheckouts.length === 0, 'a bad email: it asks for a working one');
    await page.fill('#ga-email', BUYER.email);
    await page.check('#ga-mail');
    check(!(await page.evaluate(() => document.querySelector('.ga-ship').hidden)), 'ticked: the address opens');
    await page.fill('#ga-ship-name', SHIP.name);
    await page.fill('#ga-ship-line1', SHIP.line1);
    await page.fill('#ga-ship-line2', SHIP.line2);
    await page.fill('#ga-ship-city', SHIP.city);
    await page.fill('#ga-ship-state', SHIP.state);
    await page.click('#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_address && rec.giftCheckouts.length === 0, 'no ZIP: it asks for the full address');
    await shot(page, 'gift-panel-address.png', false);
    await page.fill('#ga-ship-zip', SHIP.zip);
    await page.click('#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm', { timeout: 5000 });
    const sent = rec.giftCheckouts[0] || {};
    check(Object.keys(sent).sort().join() === 'email,giver_name,product,recipient_names,ship_to', 'POST /v1/gift/checkout carries the contract\'s fields and nothing else');
    check(sent.product === 'golden-arrow' && sent.email === BUYER.email && sent.giver_name === BUYER.giver && sent.recipient_names === BUYER.names, 'product, email, giver and their names as typed');
    check(JSON.stringify(sent.ship_to) === JSON.stringify(SHIP), 'ship_to {name, line1, line2, city, state, zip} as typed');
    const conf = await text(page, '#ga-buy .ga-confirm');
    check(has(conf, '$2,545.80') && has(conf, 'Total') && has(conf, PANEL.all_in), 'the purchase step shows the all-in amount, from the engine');
    check(has(conf, 'For ' + BUYER.names) && has(conf, 'With love from ' + BUYER.giver), 'and the names as the card will read');
    check(has(conf, PANEL.confirm_mail + ' ' + SHIP.name), 'and where the printed card goes');
    check(!(await page.$('#ga-buy a[href*="stripe"]')), 'Stripe is reached by a button, never a link a tag could read');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await page.locator('#ga-buy .ga-confirm').scrollIntoViewIfNeeded();
    await shot(page, 'gift-purchase-step.png', false);

    await page.click('#ga-buy .gh-back');
    await page.waitForSelector('#ga-buy form');
    check(await page.inputValue('#ga-for') === BUYER.names && await page.inputValue('#ga-ship-zip') === SHIP.zip, 'back: everything typed is still there');
    await page.click('#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm');
    check(rec.giftCheckouts.length === 1, 'the same details again: the payment page already made, not a second');
    const dl = await dataLayer(page);
    await Promise.all([page.waitForURL(/checkout\.stripe\.com/, { timeout: 5000 }), page.click('#ga-buy .ga-pay')]);
    check(rec.stripePages[0] === PAY_URL, 'pay: the buyer goes to the engine\'s Stripe page');
    leaks(rec, dl, 'the purchase');
    await ctx.close();
  }

  console.log('/gift: an answer that is not a Stripe page, and a route switched off mid-way');
  {
    const { ctx, page, rec } = await open('gift-bad-url', { checkoutUrl: 'https://evil.example/pay' });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await page.click('#ga-buy button[type=submit]');
    await until(async () => (await text(page, '#ga-error')) === PANEL.no_payment);
    check(await text(page, '#ga-error') === PANEL.no_payment && !(await page.$('#ga-buy .ga-confirm')), 'not Stripe: refused, nothing charged, Mick\'s number');
    check(Object.keys(rec.giftCheckouts[0] || {}).sort().join() === 'email,giver_name,product,recipient_names', 'no box ticked: no ship_to sent');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('gift-404-at-pay', { checkout404: true });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await page.click('#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-panel', { timeout: 5000 });
    check(await text(page, '#ga-buy .ga-panel__lead') === PANEL.off, 'switched off between load and pay: the call-or-text panel');
    await ctx.close();
  }

  // ------------------------------------------------------------- /gift/card
  console.log('/gift/card#code=: the card');
  {
    const { ctx, page, rec } = await open('card', {});
    await page.goto(BASE + '/gift/card#code=' + CODE);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    const url = page.url();
    check(!has(url, CODE) && new URL(url).pathname === '/gift/card', 'the code is out of the address bar (' + new URL(url).pathname + new URL(url).hash + ')');
    check(await page.evaluate((c) => window.__ghKeys.code === c, CODE), 'and kept for the page');
    check(rec.giftChecks.length === 1 && rec.giftChecks[0] === CODE, 'GET /v1/gift asked once, with the code, of our own server');
    const c = await page.evaluate(() => {
      const q = (s) => (document.querySelector(s) || {}).innerText;
      return { forL: q('.ga-for'), fromL: q('.ga-from'), no: q('.ga-giftno'), gift: q('.ga-gift'), nights: q('.ga-nights'), call: q('.ga-call'),
        title: q('.ga-title'), sub: q('.ga-subtitle'), dates: !document.querySelector('[data-ga-dates]').hidden, keep: !document.querySelector('[data-ga-keep]').hidden };
    });
    check(c.forL === 'For Ana & Luis' && c.fromL === 'With love from Aunt June', 'the names filled from the engine');
    check(/LF-0042/.test(c.no || '') && !has(c.no || '', CODE), 'the gift number printed, never the code');
    check(c.gift === RATIFIED_GIFT && c.nights === RATIFIED && c.title === 'The Golden Arrow' && c.sub === 'A gift of three nights in the trees', 'the card\'s ratified words, word for word');
    check(/^To choose your dates, call or text Mick at 706-502-4823\.$/.test(c.call || ''), 'and its call line');
    check(c.dates && c.keep, '"Choose your dates" and the keep-it-close line show for a paid gift');
    const lay = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const side = document.querySelector('.ga-side'), arch = document.querySelector('.ga-arch');
      return { bodyBottom: r('.ga-call').bottom, footTop: r('.ga-foot').top, side: side.scrollHeight, arch: arch.offsetHeight, card: r('.ga-card').width };
    });
    check(lay.bodyBottom <= lay.footTop && lay.side <= lay.arch + 1, 'nothing on the card runs into anything (' + Math.round(lay.card) + ' px wide)');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'card.png');
    await page.locator('.ga-card').screenshot({ path: SHOTS ? path.join(SHOTS, 'card-only.png') : path.join(require('os').tmpdir(), 'ga-card-only.png') });

    // Share: the link with the code, by script.
    await page.click('[data-ga-share]');
    const shared = await page.evaluate(() => window.__shared);
    check(shared && shared.url === BASE + '/gift/card#code=' + CODE, 'send the link: /gift/card#code=, the share sheet');
    // Print: one page, the card alone.
    await page.click('[data-ga-print]');
    check(await page.evaluate(() => window.__printed) === 1, 'print the card: the browser\'s print');
    await page.emulateMedia({ media: 'print' });
    const pr = await page.evaluate(() => {
      const vis = (s) => { const n = document.querySelector(s); return !!n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0; };
      return { hdr: vis('.lf-hdr'), foot: vis('.lf-foot'), actions: vis('.ga-actions'), card: vis('.ga-card'), fab: vis('.book-fab') };
    });
    check(pr.card && !pr.hdr && !pr.foot && !pr.actions && !pr.fab, 'printed: the card alone, no header, footer or buttons');
    const pdf = await page.pdf({ format: 'Letter', printBackground: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    check(pages === 1, 'printed on Letter: one page (' + pages + ')');
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, 'card-print.pdf'), pdf);
    await page.emulateMedia({ media: 'screen' });

    // A refresh keeps the card (the keys script restores the code for this tab).
    await page.reload();
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    check(await page.evaluate(() => document.querySelector('.ga-for').innerText) === 'For Ana & Luis', 'a refresh keeps the card');
    leaks(rec, await dataLayer(page), 'the card');

    // Choose your dates: into /book#gift=, the code lifted there too.
    await Promise.all([page.waitForURL(/\/book/, { timeout: 5000 }), page.click('[data-ga-dates]')]);
    await page.waitForSelector('#gatehouse .gh-summary', { timeout: 10000 });
    check(!has(page.url(), CODE) && await page.evaluate((c) => window.__ghKeys.gift === c, CODE), '"Choose your dates" opens /book with the gift, out of the address bar');
    check(await text(page, '#gatehouse .gh-gift') === BOOK_W.book_with, 'and /book says the Golden Arrow is with them');
    leaks(rec, await dataLayer(page), 'card to /book');
    await ctx.close();
  }

  console.log('/gift/card: long names step down beside the photo');
  {
    const { ctx, page } = await open('card-long', {});
    await page.goto(BASE + '/gift/card#code=' + CODE_LONG);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const lay = await page.evaluate(() => {
      const card = document.querySelector('.ga-card'), side = card.querySelector('.ga-side'), arch = card.querySelector('.ga-arch');
      return { cls: card.className, side: side.scrollHeight, arch: arch.offsetHeight };
    });
    check(/is-long/.test(lay.cls) && lay.side <= lay.arch + 1, 'the dedication fits beside the photo (' + lay.cls.replace('ga-card', '').trim() + ')');
    await shot(page, 'card-long-names.png');
    await ctx.close();
  }

  console.log('/gift/card: the plain sentences');
  for (const [label, hash, engine, key] of [
    ['no code on the link', '', {}, 'card_none'],
    ['an unknown code', '#code=GA-NOPE', {}, 'card_unknown'],
    ['the route switched off', '#code=' + CODE, { gift: 'off' }, 'card_off'],
    ['the engine unreachable', '#code=' + CODE, { gift: 'down' }, 'card_down'],
  ]) {
    const { ctx, page } = await open('card-' + key, engine);
    await page.goto(BASE + '/gift/card' + hash);
    await page.waitForSelector('[data-ga-note]:not([hidden])', { timeout: 10000 });
    check(await text(page, '[data-ga-note]') === CARD_W[key] && await page.evaluate(() => document.querySelector('[data-ga-card]').hidden), label + ': "' + CARD_W[key].slice(0, 48) + '…", no card');
    if (key === 'card_unknown') { check(await overflow(page) <= 0, 'no sideways scroll at 390'); await shot(page, 'card-unknown.png', false); }
    await ctx.close();
  }
  {
    const { ctx, page, rec } = await open('card-pending', {});
    await page.goto(BASE + '/gift/card#code=' + CODE_PENDING);
    await page.waitForSelector('[data-ga-note]:not([hidden])', { timeout: 10000 });
    check(await text(page, '[data-ga-note]') === CARD_W.card_pending, 'a payment still coming through: it says so, and waits');
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 8000 });
    check(rec.giftChecks.length === 2 && await page.evaluate(() => document.querySelector('[data-ga-note]').hidden), 'then the card appears by itself');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('card-used', {});
    await page.goto(BASE + '/gift/card#code=' + CODE_USED);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const v = await page.evaluate(() => ({ dates: document.querySelector('[data-ga-dates]').hidden, note: document.querySelector('[data-ga-note]').innerText, no: document.querySelector('.ga-giftno').hidden }));
    check(v.dates && v.note === CARD_W.card_used && v.no, 'a gift already used: the card to keep, no "Choose your dates", no gift number when none is sent');
    await ctx.close();
  }

  // --------------------------------------------------------------- /book#gift=
  async function toSummary(page, ci, co, hash) {
    await page.goto(BASE + '/book?checkIn=' + ci + '&checkOut=' + co + (hash || ''));
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 10000 });
  }
  async function pay(page) {
    await page.click('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form', { timeout: 5000 });
    await page.fill('#gh-email', 'guest@example.test');
    await page.fill('#gh-first_name', 'Test'); await page.fill('#gh-last_name', 'Guest');
    await page.fill('#gh-phone', '7065550100');
    await page.selectOption('#gh-guests', '2');
    await page.check('#gh-agree');
    await page.fill('#gh-typed_name', 'Test Guest');
  }
  const lineText = (page) => page.evaluate(() => [...document.querySelectorAll('#gatehouse .gh-summary .gh-lines dt, #gatehouse .gh-summary .gh-lines dd')].map((n) => n.innerText.trim()).join(' | '));

  console.log('/book#gift=: three nights, fully covered');
  {
    const { ctx, page, rec } = await open('book-covered', {});
    await toSummary(page, CI, CO3, '#gift=' + CODE);
    check(!has(page.url(), CODE) && await page.evaluate((c) => window.__ghKeys.gift === c, CODE), 'the code is out of the address bar, kept for the page');
    check(rec.giftChecks[0] === CODE, 'checked once with GET /v1/gift');
    check(rec.quotes.length === 1 && has(rec.quotes[0], 'gift=' + CODE), 'the quote carries gift=<code>');
    const total = 3 * NIGHT_ALL_IN;
    const ls = await lineText(page);
    check(has(ls, 'Total | $1,933.17') && has(ls, BOOK_W.book_name + ' | -$1,933.17') && has(ls, BOOK_W.book_left + ' | $0.00'), 'the total panel: Total, The Golden Arrow, Left to pay (' + ls + ')');
    check(await text(page, '#gatehouse .gh-gift') === BOOK_W.book_covers + ' ' + BOOK_W.book_nothing_left, '"The Golden Arrow covers these nights." and nothing left');
    check(await text(page, '#gatehouse button.gh-cta') === BOOK_W.book_cta && !(await page.$('#gatehouse .gh-options')), 'one button, "' + BOOK_W.book_cta + '", no way-to-pay choice');
    check(!(await page.$('#gatehouse .gh-extend')), 'no extend offer priced at full while the gift is in hand');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded();
    await shot(page, 'book-gift-covered.png', false);
    await pay(page);
    const sum = await page.evaluate(() => [...document.querySelectorAll('.gh-booking .gh-lines dt, .gh-booking .gh-lines dd')].map((n) => n.innerText.trim()).join(' | '));
    check(has(sum, 'Total | $1,933.17 | ' + BOOK_W.book_name + ' | -$1,933.17 | Due today | $0.00'), 'the booking summary: Total, The Golden Arrow, Due today $0.00');
    check(await text(page, '#gatehouse form.gh-form button[type=submit]') === BOOK_W.book_cta, 'the pay step\'s button says the same');
    await Promise.all([page.waitForURL(/\/manage/, { timeout: 8000 }), page.click('#gatehouse form.gh-form button[type=submit]')]);
    const sent = rec.checkouts[0] || {};
    check(sent.gift === CODE && sent.check_in === CI && sent.check_out === CO3, 'POST /v1/checkout carries gift=<code> with the dates');
    check(await page.evaluate(() => { try { const s = JSON.parse(sessionStorage.getItem('gh_keys')); return !(s['/book'] && s['/book'].gift); } catch (e) { return false; } }),
      'booked with nothing to pay: on to /manage, the gift forgotten on /book');
    leaks(rec, await dataLayer(page), 'covered');
    await ctx.close();
  }

  console.log('/book#gift=: four nights, covered in part');
  {
    const { ctx, page, rec } = await open('book-partial', {});
    await toSummary(page, CI, CO4, '#gift=' + CODE);
    const ls = await lineText(page);
    check(has(ls, 'Total | $2,577.56') && has(ls, BOOK_W.book_name + ' | -$1,933.17') && has(ls, BOOK_W.book_left + ' | $644.39'), 'Left to pay: what the gift leaves (' + ls + ')');
    check(await text(page, '#gatehouse .gh-gift') === BOOK_W.book_covers, '"The Golden Arrow covers these nights."');
    const opts = await page.evaluate(() => [...document.querySelectorAll('#gatehouse .gh-option')].map((n) => n.innerText.replace(/\s+/g, ' ').trim()));
    check(opts.some((o) => has(o, 'Pay in full: $644.39 after ' + BOOK_W.book_name)) && opts.some((o) => has(o, 'After ' + BOOK_W.book_name + ', the rest')), 'the ways to pay are for what is left');
    await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded();
    await shot(page, 'book-gift-partial.png', false);
    await page.click('#gatehouse .gh-option:last-of-type input');
    await pay(page);
    await page.click('#gatehouse form.gh-form button[type=submit]');
    await page.waitForSelector('#gh-paying:not([hidden])', { timeout: 8000 });
    check((rec.checkouts[0] || {}).gift === CODE, 'POST /v1/checkout carries gift=<code>');
    check(has(await text(page, '#gh-paying'), '$644.39 due today, of $2,577.56'), 'Stripe opens for what is left');
    leaks(rec, await dataLayer(page), 'in part');
    await ctx.close();
  }

  console.log('/book#gift=: dates it cannot cover, a code it cannot find, the route off');
  {
    const { ctx, page, rec } = await open('book-not-these', {});
    await toSummary(page, CI_NOTE, CO_NOTE, '#gift=' + CODE);
    const t = await text(page, '#gatehouse .gh-credit--off');
    check(t === 'The Golden Arrow covers nights from January 4, 2027. ' + BOOK_W.book_other_dates, 'the engine\'s reason, and other nights or Mick (' + t + ')');
    check(!has(await lineText(page), BOOK_W.book_left), 'full price shown as full price');
    await page.click('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form');
    check(await text(page, '.gh-booking .gh-credit--off') === t, 'said again above the agreement');
    check(rec.quotes.every((q) => has(q, 'gift=')), 'the code still rides the quote (the engine decides)');
    await ctx.close();
  }
  for (const [label, hash, engine, key] of [
    ['a code the engine cannot find', '#gift=GA-NOPE', {}, 'book_missing'],
    ['a gift already used', '#gift=' + CODE_USED, {}, 'book_used'],
    ['the gift route switched off', '#gift=' + CODE, { gift: 'off' }, 'book_off'],
  ]) {
    const { ctx, page, rec } = await open('book-' + key, engine);
    await toSummary(page, CI, CO3, hash);
    check(await text(page, '#gatehouse .gh-credit--off') === BOOK_W[key], label + ': it says so, at full price');
    check(rec.quotes.length && rec.quotes.every((q) => !has(q, 'gift=')), label + ': no code rides the quote');
    if (key === 'book_off') { await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded(); await shot(page, 'book-gift-off.png', false); }
    await ctx.close();
  }

  await browser.close();
  srv.close();
  check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log('\n' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
