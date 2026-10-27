#!/usr/bin/env node
/* Checks an elopement package offer's private page (/elopement/offer, 2026-10-27) in a real browser,
   on a local copy of the site, at phone widths 390 and 430 (the site has one look, light).

   Run from the repo:  node scripts/site/check_offer.js        (SHOTS=dir to save screenshots)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine. The engine (book.loxleyforest.com) is answered here in its own shapes
   (loxley-rescue forge/elopement-offer: gatehouse/offers.py page() and start_checkout, gatehouse/api.py
   post_offer, offer_checkout and get_booked). Stripe is a stub; Tag Manager and everything else get
   an empty answer. Every name and email is made up (example.test).

   The page's words wait for Mick (scripts/site/pages/offer.py WORDS, APPROVED_SHA256 None): as
   built, the page must show only /book's own "Questions?" line. To check the page a couple will
   see, this serves it with made-up words of a real length in place of the placeholders and
   "ready" true; the made-up words never reach the repository.

   It proves:
     - as built: Tag Manager, the keys script before it, noindex, root paths, the rewrite, not in
       sitemap.xml, linked from no page; every slot of the Writer's in WORDS; not ready, so the page
       shows only /book's line and never asks the engine;
     - ready: the invitation (their names in the headline, the package and dates over the dusk
       photograph), the day, the gifts, one total, half today or all of it today (the whole only
       inside 30 days), the pay button's amount following the choice, the agreement in its own
       words with its question asked in place and no marker left, the typed name and the tick
       checked before anything is sent, the body sent (the contract's fields and nothing else),
       Stripe mounted in place;
     - the thank-you only when the engine says paid: the offer read back booked, or Stripe's return
       with the stay reserved or paid; a bank payment clearing has its own line, never the thanks;
     - an offer over, a link the engine cannot find, the engine down, a checkout refused, each said
       plainly in the page's words; a changed agreement read again;
     - the token and the payment session out of the address bar before Tag Manager, and in no
       request but our own engine's; no sideways scroll at 390 or 430; no script errors. */
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

const REWRITES = {};
for (const m of fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8').matchAll(/\[\[redirects\]\]\s*\n\s*from\s*=\s*"([^"]+)"\s*\n\s*to\s*=\s*"([^"]+)"\s*\n\s*status\s*=\s*(\d+)/g)) {
  if (m[3] === '200') REWRITES[m[1]] = m[2];
}
const read = (n) => fs.readFileSync(path.join(ROOT, n), 'utf8');
const BLOCK = /<script type="application\/json" id="lf-offer-words">([\s\S]*?)<\/script>/;
const BUILT = JSON.parse(BLOCK.exec(read('elopement-offer.html'))[1]);
const NOT_READY = 'Questions? Call or text 706-502-4823, or write to stay@loxleyforest.com.';

// Made-up words of a real length, for the page as a couple will see it. Never written to the repo.
const WORDS = Object.assign({}, BUILT, {
  ready: true,
  title: 'Your day in the trees | Loxley Forest',
  headline: '{{first_names}}, that bridge is your front door.',
  opening: 'A made-up opening of a real length: two sentences about the forest at dusk and the day ahead, for the check only.',
  package_h: 'Your day', extras_h: 'And on us', total_label: 'All in',
  total_sub: 'A made-up sub-line: the package, the taxes and the fees, nothing more to come.',
  half_label: 'Half today', half_line: '{{today_amount}} today to hold your date; {{balance}} on {{balance_date}}, on its own.',
  whole_label: 'All of it today', whole_line: '{{today_amount}} today, and nothing more to pay.',
  agreement_lead: 'A made-up lead-in to the agreement, in one sentence.',
  sign_label: 'Your full name', tick: 'A made-up tick line: I have read the agreement and agree to it.',
  pay: 'Sign and pay {{today_amount}}', need_sign: 'A made-up line: your name, the tick and the answer, please.',
  loading: 'A made-up opening line…', failure: 'A made-up failure line.', questions: 'A made-up questions line, 706-502-4823.',
  thanks_h: 'A made-up thank-you heading', thanks: 'A made-up thank-you for {{package}}, {{dates}}.',
  clearing: 'A made-up clearing line: your bank payment is on its way.', expired: 'A made-up expired-offer line.',
});
const SLOTS = ['headline', 'opening', 'package_h', 'extras_h', 'total_label', 'total_sub', 'half_label', 'half_line', 'whole_label',
  'whole_line', 'agreement_lead', 'tick', 'pay', 'loading', 'failure', 'questions', 'thanks', 'clearing', 'expired'];

// ---- the engine's shapes (made-up couple and words)
function day(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const TOKEN = 'tok-offer-AbC123xyz789qwe456rty012uio345p';
const SESSION = 'cs_test_offer_9Zq';
const NAMES = 'Ana Example and Luis Example', GREETING = 'Ana and Luis', EMAIL = 'ana@example.test';
const AGREEMENT_TEXT = 'A made-up opening letter.\n\n# Elopement Hosting Agreement\n\nMade as of a made-up date, between **Loxley Forest LLC** and **' + NAMES +
  '**.\n\n## The Vow · $4,500.00\n\nIncluded:\n\n- 2-night treehouse stay\n- Vetted officiant\n\n## Photography\n\nPhotography of your ceremony is included.\n\n' +
  'May we? [[choice:marketing-release]]\n\n## The Legal Part\n\nA made-up last paragraph.\n';
const CHOICE = { id: 'marketing-release', question: 'May we?', default: 'Yes, and we would be proud to',
  options: ['Yes, and we would be proud to', 'Yes, but please leave our names out of it', 'Not for now, ask us again when we have seen them'] };
function offer(over) {
  const ci = day(45), co = day(47);
  return Object.assign({ status: 'open', package: { key: 'the-vow', name: 'The Vow', includes: ['2-night treehouse stay',
    'Choice of ceremony site: the Fire Circle or the treehouse deck', 'Vetted officiant', 'Seasonal bouquet and boutonniere', 'Champagne toast',
    'Romantic room preparation'] }, check_in: ci, check_out: co, nights: 2, greeting: GREETING,
    extras: ['The Morning After, our champagne brunch', 'Pizza night', 'A small wedding cake'], party: 3,
    lines: [{ label: 'The Vow', cents: 450000 }, { label: 'Sales tax', cents: 36000 }, { label: 'Lumpkin County hotel-motel tax (8%)', cents: 36000 },
      { label: 'Georgia hotel-motel fee ($5 a night)', cents: 1000 }],
    total_cents: 523000, modes: ['deposit', 'full'],
    plans: { deposit: [{ kind: 'deposit', label: 'Retainer deposit (non-refundable)', amount_cents: 261500, due_on: null },
      { kind: 'balance', label: 'Balance', amount_cents: 261500, due_on: day(15) }], full: [{ kind: 'full', label: '', amount_cents: 523000, due_on: null }] },
    retainer_cents: 261500, balance_cents: 261500, balance_due: day(15), pay_later: ['klarna'], expires_at: '2026-10-29T23:59:00+00:00',
    check_in_time: '3:00 p.m.', clearing: false, agreement: { text: AGREEMENT_TEXT, version: 'v-check', choices: [CHOICE] } }, over || {});
}
const SECRETS = [TOKEN, SESSION, NAMES, GREETING, EMAIL, 'Ana', 'Luis'];

let failures = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }
const has = (s, t) => String(s).indexOf(t) >= 0;

function statics() {
  console.log('the page as built');
  const h = read('elopement-offer.html');
  check(has(h, 'GTM-5N4BX66K'), 'Tag Manager on the page (the house rule)');
  const keysAt = h.indexOf('<!-- Booking keys'), gtmAt = h.indexOf('gtm.js?id=');
  check(keysAt > 0 && gtmAt > keysAt, 'the keys script runs before Tag Manager');
  check(/'code','offer'\]/.test(h) && /code\|offer\)=/.test(h), 'the keys script lifts offer (and session_id)');
  check(has(h, 'noindex') && /src="\/js\/offer\.js"/.test(h) && /href="\/css\/v2-pages\.css"/.test(h), 'noindex, root paths (served one folder deep)');
  check(REWRITES['/elopement/offer'] === '/elopement-offer.html', 'netlify.toml serves /elopement/offer');
  check(!/elopement\/offer|elopement-offer/.test(read('sitemap.xml')), 'not in sitemap.xml');
  const linking = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html') && n !== 'elopement-offer.html')
    .filter((n) => /elopement\/offer|elopement-offer/.test(read(n)));
  check(linking.length === 0, 'linked from no page' + (linking.length ? ': ' + linking.join(', ') : ''));
  check(SLOTS.every((k) => typeof BUILT[k] === 'string' && BUILT[k]), 'every slot of the Writer\'s is in WORDS');
  check(BUILT.ready === false, 'as built, its words wait for Mick (ready false)');
  check(BUILT.not_ready === NOT_READY && has(read('book.html'), 'Questions? Call or text <a href="tel:+17065024823">706-502-4823</a>, or write to'),
    'while they wait, /book\'s own live line');
  check(has(h, 'book-hero-phone-828') && has(h, 'lf-bk-top'), 'the dusk photograph from /book');
}

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    if (p === '/') p = '/index.html';
    const r = REWRITES[p] || REWRITES[p.replace(/\/$/, '')];
    if (r) p = r;
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

async function main() {
  statics();
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errors = [];

  // engine: {read: offer object | 404 | 'down', checkout: 'ok' | {status, error}, booked: stay | 'down', ready: bool, width}
  async function open(name, engine) {
    engine = Object.assign({ ready: true, read: offer(), checkout: 'ok', width: 390 }, engine || {});
    const height = engine.width === 430 ? 932 : 844;
    const ctx = await browser.newContext({ viewport: { width: engine.width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const rec = { reads: [], checkouts: [], booked: [], outside: [], beacons: [], addresses: [] };
    await ctx.route('**/*', async (route) => {
      const req = route.request(), u = new URL(req.url());
      if (u.hostname === '127.0.0.1' && u.pathname === '/elopement/offer' && engine.ready) {
        // The page a couple will see: made-up words in place of the placeholders, ready.
        const res = await route.fetch();
        const words = JSON.stringify(WORDS).replace(/<\//g, '<\\/');
        return route.fulfill({ response: res, body: (await res.text()).replace(BLOCK,
          () => '<script type="application/json" id="lf-offer-words">' + words + '</script>') });
      }
      if (u.hostname === '127.0.0.1') return route.continue();
      if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o, s) => route.fulfill({ status: s || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify(o) });
        if (req.method() === 'OPTIONS') return json({});
        let b = {}; try { b = JSON.parse(req.postData() || '{}'); } catch (e) {}
        if (u.pathname === '/v1/funnel') { rec.beacons.push(req.postData() || ''); return json({ ok: true }); }
        if (u.pathname === '/v1/offer') {
          rec.reads.push(b);
          const r = typeof engine.read === 'function' ? engine.read(rec.reads.length) : engine.read;
          if (r === 'down') return route.abort('failed');
          if (r === 404) return json({ error: 'not found' }, 404);
          return b.token === TOKEN ? json(r) : json({ error: 'not found' }, 404);
        }
        if (u.pathname === '/v1/offer/checkout') {
          rec.checkouts.push(b);
          if (engine.checkout !== 'ok') return json({ error: engine.checkout.error }, engine.checkout.status);
          return json({ client_secret: 'cs_test_secret_offer', stay: 'sty_x', total_cents: 523000,
            due_now_cents: b.mode === 'full' ? 523000 : 261500, later: [] });
        }
        if (u.pathname === '/v1/booked') {
          rec.booked.push(u.searchParams.get('session_id'));
          if (engine.booked === 'down') return route.abort('failed');
          return json(engine.booked);
        }
        return json({ error: 'not found' }, 404);
      }
      rec.outside.push(req.url() + ' ' + (req.postData() || ''));
      if (u.hostname === 'js.stripe.com') {
        return route.fulfill({ status: 200, contentType: 'text/javascript',
          body: 'window.Stripe=function(){return{initEmbeddedCheckout:function(){return Promise.resolve({mount:function(t){document.querySelector(t).textContent="stripe test mount"},destroy:function(){}})}}};' });
      }
      return route.fulfill({ status: 200, contentType: /\.js|gtm|gtag/.test(u.pathname) ? 'text/javascript' : 'text/plain', body: '' });
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(name + ': ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(name + ': ' + m.text()); });
    return { ctx, page, rec };
  }
  async function until(fn, n) { for (let i = 0; i < (n || 60) && !(await fn()); i++) await new Promise((r) => setTimeout(r, 100)); return fn(); }
  async function shot(page, file) {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, file), fullPage: true });
  }
  const text = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return n ? n.textContent : ''; }, sel);
  const visible = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return !!n && !n.closest('[hidden]') && n.getClientRects().length > 0; }, sel);
  const noSideways = (page) => page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth);
  const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (m, n) => ({ first_names: GREETING }[n] || m));
  function clean(rec, label) {
    const bad = rec.outside.concat(rec.beacons).filter((x) => SECRETS.some((s) => has(x, s)));
    check(bad.length === 0, label + ': no request but our own engine\'s carries the token, the session, a name or an email');
  }

  // ---- as built: not ready
  console.log('as built (words waiting for Mick)');
  {
    const { ctx, page, rec } = await open('not ready', { ready: false });
    await page.goto(BASE + '/elopement/offer#offer=' + TOKEN);
    await until(() => text(page, '[data-eo-wait]'));
    check((await text(page, '[data-eo-wait]')) === NOT_READY, 'shows only /book\'s line');
    check(rec.reads.length === 0 && !(await visible(page, '[data-eo-body]')), 'never asks the engine, shows nothing of the offer');
    check(!has(page.url(), TOKEN), 'the token is out of the address bar (the keys script runs before Tag Manager)');
    clean(rec, 'not ready');
    await ctx.close();
  }

  // ---- ready: the invitation, at 390 and 430
  for (const width of [390, 430]) {
    console.log('the invitation at ' + width);
    const { ctx, page, rec } = await open('ready ' + width, { width });
    await page.goto(BASE + '/elopement/offer#offer=' + TOKEN);
    await until(() => visible(page, '#eo-paybtn'));
    check(rec.reads.length === 1 && rec.reads[0].token === TOKEN && Object.keys(rec.reads[0]).join() === 'token', 'reads the offer by posting its token, and nothing else');
    check(!has(page.url(), TOKEN), 'the token is out of the address bar (the keys script runs before Tag Manager)');
    check((await text(page, '[data-eo-h1]')) === fill(WORDS.headline), 'the headline greets them by name');
    check((await text(page, '[data-eo-eyebrow]')) === 'The Vow' && (await text(page, '[data-eo-lead]')) === WORDS.opening, 'the package and the opening over the photograph');
    check(/^[A-Z][a-z]+day, [A-Z][a-z]+ \d+ to [A-Z][a-z]+day, [A-Z][a-z]+ \d+, \d{4}$/.test(await text(page, '.eo-dates')), 'their dates under Your day, the year once');
    check(!(await visible(page, '.book-fab')), 'one action on the page: the floating "Book your dates" steps aside');
    check(await page.evaluate(() => { const i = document.querySelector('.lf-bk-top__photo img'); return !!i && i.complete && i.naturalWidth > 0; }), 'the dusk photograph is shown');
    const day = await text(page, '#eo-day-h');
    check(day === 'Your day' && (await page.$$eval('.eo-list li', (l) => l.length)) === 9, 'the day: its six lines, then the three gifts');
    check((await text(page, '#eo-gifts-h')) === 'And on us', 'the gifts under their own heading, no price beside them');
    check(!/\$\s?\d/.test(await text(page, '.eo-list')), 'no price or value beside a gift (Letter Law 1)');
    check(has(await text(page, '.eo-total'), '$5,230.00') && has(await text(page, '.eo-total'), 'All in'), 'one total, all in');
    check((await page.$$eval('.eo-way', (l) => l.length)) === 2 && (await page.isChecked('#eo-way-deposit')), 'half today or all of it today, half chosen');
    check(has(await text(page, '.eo-way:first-child .eo-way__line'), '$2,615.00 today') && has(await text(page, '.eo-way:last-child .eo-way__line'), '$5,230.00 today'),
      'each way names its own amount today');
    check((await text(page, '#eo-paybtn')) === 'Sign and pay $2,615.00', 'the button: Sign and pay $2,615.00');
    await page.click('label[for="eo-way-full"]');
    check((await text(page, '#eo-paybtn')) === 'Sign and pay $5,230.00', 'all of it today: Sign and pay $5,230.00');
    await page.click('label[for="eo-way-deposit"]');
    const ag = await text(page, '.gh-agreement');
    check(has(ag, 'Elopement Hosting Agreement') && has(ag, NAMES) && !has(ag, '[[choice') && !has(ag, '**'), 'the agreement in its own words, formatted, no marker left');
    check((await page.$$eval('.eo-choice input', (l) => l.length)) === 3 && (await page.isChecked('#eo-choice-marketing-release-0')),
      'its question asked in place, its own default chosen');
    check(await page.evaluate(() => { const b = document.querySelector('.gh-agreement'); return b.scrollHeight >= b.clientHeight && b.clientHeight <= window.innerHeight * 0.62; }),
      'the agreement in a box of its own, under two-thirds of the screen');
    check(await noSideways(page), 'no sideways scroll at ' + width);
    await shot(page, 'offer-' + width + '.png');
    // signing: nothing goes until the name and the tick
    await page.click('#eo-paybtn');
    check((await text(page, '#eo-error')) === WORDS.need_sign && rec.checkouts.length === 0, 'no name: the page says so, nothing sent');
    await page.fill('#eo-name', 'Ana Example');
    await page.click('#eo-paybtn');
    check(rec.checkouts.length === 0, 'no tick: nothing sent');
    await page.click('label[for="eo-tick"]');
    await page.click('label[for="eo-choice-marketing-release-1"]');
    await page.click('#eo-paybtn');
    await until(() => text(page, '#eo-pay'));
    const b = rec.checkouts[0] || {};
    check(Object.keys(b).sort().join() === 'accepted,agreement_version,choices,mode,token,typed_name', 'the checkout sends the contract\'s fields and nothing else');
    check(b.token === TOKEN && b.mode === 'deposit' && b.typed_name === 'Ana Example' && b.accepted === true && b.agreement_version === 'v-check'
      && b.choices['marketing-release'] === CHOICE.options[1], 'the token, half today, the typed name, the tick, the version and their answer');
    check((await text(page, '#eo-pay')) === 'stripe test mount' && !(await visible(page, '.gh-agreement')) && !(await visible(page, '#eo-paybtn')),
      'Stripe in place of the agreement and the button');
    check(!(await visible(page, '.eo-done')), 'no thank-you before the payment succeeds');
    clean(rec, 'ready ' + width);
    await ctx.close();
  }

  // ---- inside 30 days: the whole only
  console.log('inside 30 days');
  {
    const { ctx, page } = await open('whole only', { read: offer({ modes: ['full'], retainer_cents: 0, balance_cents: 0, balance_due: null,
      plans: { full: [{ kind: 'full', label: '', amount_cents: 523000, due_on: null }] } }) });
    await page.goto(BASE + '/elopement/offer#offer=' + TOKEN);
    await until(() => visible(page, '#eo-paybtn'));
    check((await page.$$eval('.eo-way', (l) => l.length)) === 1 && (await page.isChecked('#eo-way-full')) && (await text(page, '#eo-paybtn')) === 'Sign and pay $5,230.00',
      'only all of it today, and the button says so');
    await ctx.close();
  }

  // ---- the states
  console.log('the states');
  const states = [
    ['booked', { read: offer({ status: 'booked' }) }, WORDS.thanks_h],
    ['expired', { read: { status: 'expired', package: { key: 'the-vow', name: 'The Vow' }, check_in: day(45), check_out: day(47), nights: 2 } }, WORDS.expired],
    ['cancelled', { read: { status: 'cancelled', package: { key: 'the-vow', name: 'The Vow' }, check_in: day(45), check_out: day(47), nights: 2 } }, WORDS.expired],
    ['clearing', { read: { status: 'open', clearing: true, package: { key: 'the-vow', name: 'The Vow' }, check_in: day(45), check_out: day(47), nights: 2 } }, WORDS.clearing],
    ['not found', { read: 404 }, WORDS.expired],
    ['down', { read: 'down' }, WORDS.failure],
  ];
  for (const [label, engine, want] of states) {
    const { ctx, page } = await open(label, engine);
    await page.goto(BASE + '/elopement/offer#offer=' + TOKEN);
    await until(async () => has(await page.evaluate(() => document.getElementById('eo').innerText), want));
    const all = await page.evaluate(() => document.getElementById('eo').innerText);
    check(has(all, want) && !(await visible(page, '#eo-paybtn')), label + ': its own line, nothing to pay');
    check(label === 'booked' || !has(all, WORDS.thanks_h), label + ': never the thank-you');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('no key');
    await page.goto(BASE + '/elopement/offer');
    await until(() => text(page, '[data-eo-wait]'));
    check(has(await text(page, '[data-eo-wait]'), WORDS.failure), 'no key: the failure line, the engine never asked');
    await ctx.close();
  }

  // ---- a checkout refused
  console.log('a checkout refused');
  const refusals = [
    ['payment_clearing', 409, WORDS.clearing], ['offer_closed', 409, WORDS.expired], ['agreement_unsigned', 422, WORDS.failure],
  ];
  for (const [code, status, want] of refusals) {
    const { ctx, page } = await open(code, { checkout: { status, error: code } });
    await page.goto(BASE + '/elopement/offer#offer=' + TOKEN);
    await until(() => visible(page, '#eo-paybtn'));
    await page.fill('#eo-name', 'Ana Example');
    await page.click('label[for="eo-tick"]');
    await page.click('#eo-paybtn');
    await until(async () => has(await page.evaluate(() => document.getElementById('eo').innerText), want));
    check(has(await page.evaluate(() => document.getElementById('eo').innerText), want), code + ': said in the page\'s words');
    check(!has(await page.evaluate(() => document.getElementById('eo').innerText), WORDS.thanks_h), code + ': never the thank-you');
    await ctx.close();
  }
  {
    let n = 0;
    const { ctx, page, rec } = await open('changed', { checkout: { status: 422, error: 'agreement_changed' }, read: () => { n++; return offer(); } });
    await page.goto(BASE + '/elopement/offer#offer=' + TOKEN);
    await until(() => visible(page, '#eo-paybtn'));
    await page.fill('#eo-name', 'Ana Example');
    await page.click('label[for="eo-tick"]');
    await page.click('#eo-paybtn');
    await until(() => rec.reads.length >= 2);
    check(rec.reads.length === 2 && n === 2, 'a changed agreement: the offer read again, to sign what it says now');
    await ctx.close();
  }

  // ---- back from Stripe
  console.log('back from Stripe');
  const back = [
    ['reserved', { status: 'reserved', package: 'The Vow', check_in: day(45), check_out: day(47), total_cents: 523000, paid_cents: 261500,
      payments: [{ kind: 'balance', status: 'scheduled', amount_cents: 261500, due_on: day(15) }] }, WORDS.thanks_h],
    ['paid', { status: 'paid', package: 'The Vow', check_in: day(45), check_out: day(47), total_cents: 523000, paid_cents: 523000, payments: [] }, WORDS.thanks_h],
    ['held (a bank payment clearing)', { status: 'held', package: 'The Vow', check_in: day(45), check_out: day(47), payments: [] }, WORDS.clearing],
    ['down', 'down', WORDS.failure],
  ];
  for (const [label, stay, want] of back) {
    const { ctx, page, rec } = await open('back ' + label, { booked: stay });
    await page.goto(BASE + '/elopement/offer?session_id=' + SESSION);
    await until(async () => has(await page.evaluate(() => document.getElementById('eo').innerText), want));
    const all = await page.evaluate(() => document.getElementById('eo').innerText);
    check(has(all, want), label + ': ' + (want === WORDS.thanks_h ? 'the thank-you' : 'its own line'));
    check(want === WORDS.thanks_h || !has(all, WORDS.thanks_h), label + ': never the thank-you');
    check(rec.booked[0] === SESSION && !has(page.url(), SESSION),
      label + ': the session asked of our engine, out of the address bar');
    if (label === 'reserved') check(has(all, 'The Vow'), 'the thank-you names the package');
    clean(rec, 'back ' + label);
    await ctx.close();
  }

  check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  srv.close();
  console.log('\n' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
