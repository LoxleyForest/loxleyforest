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

   The page's words are Mick's, approved by hash (scripts/site/pages/offer.py APPROVED_SHA256, his
   yes to all, 2026-10-27): as built the page is ready, and it is checked in his words. Words that
   do not match the approved hash must close it: that is checked by serving the page with "ready"
   false, when it must show only /book's own "Questions?" line.

   It proves:
     - as built: Tag Manager, the keys script before it, noindex, root paths, the rewrite, not in
       sitemap.xml, linked from no page; every slot of the Writer's in WORDS; ready on Mick's
       approved words; not ready, the page shows only /book's line and never asks the engine;
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

// Mick's approved words, as built (scripts/site/pages/offer.py WORDS; his yes to all, 2026-10-27).
const WORDS = BUILT;
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
// The Invitation (2026-11-11; the Forge's rulings of 2026-11-12): GET /v1/invitation, no agreement,
// no name kept by the engine (the names ride after the #), days, note, open dates, the ask or the hold.
const INVITE = 'inv-AbC123xyz789qwe456rty012uio345pq';
function invitation(over) {
  return Object.assign({ package: { key: 'the-crossing', name: 'The Crossing', includes: ['Two nights in the treehouse',
    'Your vows out on the rope bridge, at golden hour', 'An officiant'] },
    check_in: '2027-04-16', check_out: '2027-04-18', nights: 2, party: 2,
    extras: ['The Morning After, champagne brunch carried across the bridge', 'A small cake'],
    note: 'A made-up line from Mick.',
    days: [{ date: '2027-04-16', sunrise: '7:06 a.m.', sunset: '8:13 p.m.', stops: [{ time: '3:00 p.m.', title: 'Your treehouse is ready', words: 'Made-up words.' }, { time: 'After dark', title: 'The bridge', words: '' }] },
      { date: '2027-04-17', sunrise: '7:05 a.m.', sunset: '8:14 p.m.', stops: [{ time: null, title: 'The ceremony', ceremony: true, words: 'Golden hour.' }, { time: null, title: 'A private dinner', words: '' }] },
      { date: '2027-04-18', sunrise: '7:04 a.m.', sunset: '8:15 p.m.', stops: [{ time: '10:00 a.m.', title: 'The Morning After', words: '' }, { time: '12:00 p.m.', title: 'Checkout', words: '' }] }],
    lines: [{ label: 'The Crossing', cents: 650000 }, { label: 'Sales tax', cents: 52000 }, { label: 'Lumpkin County hotel-motel tax', cents: 52000 }, { label: 'Georgia hotel-motel fee', cents: 1000 }],
    total_cents: 755000, modes: ['deposit', 'full'],
    plans: { deposit: [{ kind: 'deposit', label: 'Retainer', amount_cents: 377500, due_on: null }, { kind: 'balance', label: 'Balance', amount_cents: 377500, due_on: '2027-03-17' }],
      full: [{ kind: 'full', label: '', amount_cents: 755000, due_on: null }] },
    retainer_cents: 377500, balance_cents: 377500, balance_due: '2027-03-17', check_in_time: '3:00 p.m.',
    open_dates: [{ check_in: '2027-04-23', check_out: '2027-04-25' }, { check_in: '2027-04-30', check_out: '2027-05-02' }, { check_in: '2027-05-07', check_out: '2027-05-09' }],
    hold: { mode: 'ask', hours: null, until: null } }, over || {});
}
const INVITATION = invitation();
const SECRETS = [TOKEN, INVITE, SESSION, NAMES, GREETING, EMAIL, 'Ana', 'Luis'];

let failures = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }
const has = (s, t) => String(s).indexOf(t) >= 0;

function statics() {
  console.log('the page as built');
  const h = read('elopement-offer.html');
  check(has(h, 'GTM-5N4BX66K'), 'Tag Manager on the page (the house rule)');
  const keysAt = h.indexOf('<!-- Booking keys'), gtmAt = h.indexOf('gtm.js?id=');
  check(keysAt > 0 && gtmAt > keysAt, 'the keys script runs before Tag Manager');
  check(/'code','offer','invite'\]/.test(h) && /code\|offer\|invite\)=/.test(h), 'the keys script lifts offer and invite (and session_id)');
  check(has(h, 'noindex') && /src="\/js\/offer\.js"/.test(h) && /href="\/css\/v2-pages\.css"/.test(h), 'noindex, root paths (served one folder deep)');
  check(REWRITES['/elopement/offer'] === '/elopement-offer.html', 'netlify.toml serves /elopement/offer');
  check(!/elopement\/offer|elopement-offer/.test(read('sitemap.xml')), 'not in sitemap.xml');
  const linking = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html') && n !== 'elopement-offer.html')
    .filter((n) => /elopement\/offer|elopement-offer/.test(read(n)));
  check(linking.length === 0, 'linked from no page' + (linking.length ? ': ' + linking.join(', ') : ''));
  check(SLOTS.every((k) => typeof BUILT[k] === 'string' && BUILT[k]), 'every slot of the Writer\'s is in WORDS');
  // The words carry Mick's hash of Oct 27, or wait for his yes to the Invitation's new words
  // (2026-11-11): closed as built is right until then. The browser runs below force the words ready
  // to prove them either way.
  check(BUILT.ready === true ? /Your day in the trees/.test(h) : /<title>Loxley Forest<\/title>/.test(h),
    BUILT.ready === true ? 'as built, ready on Mick\'s approved words, its title his' : 'as built, closed: the words wait for Mick\'s yes by hash, the title plain');
  check(BUILT.demo === undefined, 'the live page never carries the demo');
  check(['the-crossing', 'the-vow', 'firelight', 'the-falls'].every((k) => has(h, 'data-eo-photos="' + k + '"')), 'a photograph set for every package key');
  const demos = fs.readdirSync(path.join(ROOT, 'private')).filter((n) => /^invitation-demo-[0-9a-f]{6}$/.test(n));
  check(demos.length === 1, 'one demo folder under private/');
  if (demos.length === 1) {
    const d = read(path.join('private', demos[0], 'index.html'));
    const dw = JSON.parse(BLOCK.exec(d)[1]);
    check(!has(d, 'GTM-') && !has(d, 'js/funnel.js') && has(d, 'noindex') && dw.ready === true && dw.demo && dw.demo.package && dw.demo.package.key === 'the-crossing',
      'the demo: a private page, no Tag Manager, no page beacon, noindex, ready on the invented Invitation');
    check(!/Avery|\bSam\b/.test(d) && dw.demo.greeting === '', 'the demo file names no one: the names ride after the #');
    check(has(d, 'DOMContentLoaded') && !has(d, 'src="/js/offer.js"') && has(d, '.eo-days {'), 'the demo carries the script and the styles inline, so it stands on its own wherever main is');
    check(!dw.demo.agreement && !dw.demo.expires_at && dw.demo.hold && dw.demo.hold.mode === 'ask', 'the demo is an Invitation in ask mode: no agreement, no expiry, nothing held');
    const y = read(path.join('private', demos[0], 'your-day.html'));
    const yw = JSON.parse(BLOCK.exec(y)[1]);
    check(!has(y, 'GTM-') && !has(y, 'js/funnel.js') && has(y, 'noindex') && yw.ready === true && yw.demo_public && yw.demo_public.days && yw.demo_public.open,
      'the public demo: a private page, no Tag Manager, no page beacon, noindex, ready on the invented days');
    check(!has(y, 'data-netlify') && has(y, 'data-demo-form') && !has(y, 'action="/success-elopement.html"'), 'the public demo\'s form posts nowhere');
    check(!/Avery|\bSam\b/.test(y), 'the public demo file names no one');
  }
  // The public door, /your-day (2026-11-12): the same words, the same photographs, /elopements' own form.
  const yd = read('your-day.html');
  check(has(yd, 'GTM-5N4BX66K') && has(yd, 'noindex') && /data-mode="public"/.test(yd) && /src="\/js\/offer\.js"/.test(yd), '/your-day: Tag Manager, noindex, the public mode, the shared script by its root path');
  check(!/your-day/.test(read('sitemap.xml')), '/your-day is not in sitemap.xml');
  const linkingYd = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html') && n !== 'your-day.html').filter((n) => /href="\/?your-day"/.test(read(n)));
  check(linkingYd.length === 0, '/your-day is linked from no page' + (linkingYd.length ? ': ' + linkingYd.join(', ') : ''));
  const ydForm = /<form class="lf-form lf-form--light" name="elopement-inquiry"[^>]*action="\/success-elopement\.html">[\s\S]*?<\/form>/.exec(yd);
  check(!!ydForm && has(ydForm[0], 'name="page" value="/your-day"') && has(ydForm[0], 'name="gclid"') && has(ydForm[0], 'name="preferred_date"')
    && has(ydForm[0], 'name="package"') && has(ydForm[0], 'name="guest_count"'),
    '/your-day carries /elopements\' own form: its door, its page field, the ad click, the fields the button fills');
  const elForm = /<form class="lf-form lf-form--light" name="elopement-inquiry"[\s\S]*?<\/form>/.exec(read('elopements.html'));
  check(!!elForm && !!ydForm && elForm[0].replace('value="/elopements"', 'value="/your-day"') === ydForm[0], 'the form is /elopements\' word for word, but for the page field');
  const pks = /<script type="application\/json" id="lf-yd-packages">([\s\S]*?)<\/script>/.exec(yd);
  const pkRows = pks ? JSON.parse(pks[1]) : [];
  check(pkRows.map((p) => p.key).join() === 'the-crossing,the-vow,firelight' && pkRows.every((p) => /^\$[\d,]+ plus tax$/.test(p.price)),
    'the three packages in the cards\' order with the cards\' prices');
  check(['the-crossing', 'the-vow', 'firelight', 'the-falls'].every((k) => has(yd, 'data-eo-photos="' + k + '"')), '/your-day carries the photograph sets');
  check(JSON.parse(BLOCK.exec(yd)[1]).demo_public === undefined && BUILT.demo_public === undefined, 'neither live page carries the public demo');
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
    const rec = { reads: [], invites: [], asks: [], holds: [], dateReads: [], dayReads: [], checkouts: [], booked: [], outside: [], beacons: [], addresses: [] };
    await ctx.route('**/*', async (route) => {
      const req = route.request(), u = new URL(req.url());
      if (u.hostname === '127.0.0.1' && (u.pathname === '/elopement/offer' || u.pathname === '/your-day')) {
        // The words as the run needs them: ready (as Mick's yes makes them) or not (the page as it
        // must then stand).
        const res = await route.fetch();
        const words = JSON.stringify(Object.assign({}, WORDS, { ready: !!engine.ready })).replace(/<\//g, '<\\/');
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
        if (u.pathname === '/v1/invitation' && req.method() === 'GET') {
          rec.invites.push(Object.fromEntries(u.searchParams));
          const r = typeof engine.invite === 'function' ? engine.invite(u.searchParams.get('check_in')) : engine.invite;
          if (!r || u.searchParams.get('token') !== INVITE) return json({ error: 'not found' }, 404);
          return json(r);
        }
        if (u.pathname === '/v1/invitation/ask') { rec.asks.push(b); return json({ asked: true }); }
        if (u.pathname === '/v1/invitation/hold') { rec.holds.push(b); return json({ token: TOKEN }); }
        if (u.pathname === '/v1/your-day/dates' && req.method() === 'GET') {
          rec.dateReads.push(u.searchParams.get('package'));
          return json({ dates: (engine.openDays || {})[u.searchParams.get('package')] || [] });
        }
        if (u.pathname === '/v1/your-day') {
          rec.dayReads.push(b);
          const r = typeof engine.yourDay === 'function' ? engine.yourDay(b) : engine.yourDay;
          return r ? json(r) : json({ error: 'not found' }, 404);
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
    check(/^The Vow · [A-Z][a-z]+day, /.test(await text(page, '[data-eo-eyebrow]')) && (await text(page, '[data-eo-lead]')) === WORDS.opening, 'the package, the dates and the opening over the photograph');
    check(/^[A-Z][a-z]+day, [A-Z][a-z]+ \d+ to [A-Z][a-z]+day, [A-Z][a-z]+ \d+, \d{4}$/.test(await text(page, '.eo-dates')), 'their dates under Your day, the year once');
    check(!(await visible(page, '.book-fab')), 'one action on the page: the floating "Book your dates" steps aside');
    check(await page.evaluate(() => { const i = document.querySelector('.lf-bk-top__photo img'); return !!i && i.complete && i.naturalWidth > 0; }), 'the dusk photograph is shown');
    const day = await text(page, '#eo-day-h');
    check(day === WORDS.package_h && (await page.$$eval('.eo-list li', (l) => l.length)) === 9, 'what is provided: its six lines, then the three gifts');
    check(!(await visible(page, '#eo-days-h')) && !(await visible(page, '#eo-note-h')) && !(await visible(page, '#eo-dates-h')),
      'an offer without days, note or open dates shows none of those parts');
    check((await text(page, '#eo-gifts-h')) === 'And on us', 'the gifts under their own heading, no price beside them');
    check(!/\$\s?\d/.test(await text(page, '.eo-list')), 'no price or value beside a gift (Letter Law 1)');
    check(has(await text(page, '.eo-total'), '$5,230.00') && has(await text(page, '.eo-total'), 'All in'), 'one total, all in');
    check((await page.$$eval('.eo-way', (l) => l.length)) === 2 && (await page.isChecked('#eo-way-deposit')), 'half today or all of it today, half chosen');
    const halfLine = await text(page, '.eo-way:first-child .eo-way__line'), wholeLine = await text(page, '.eo-way:last-child .eo-way__line');
    check(halfLine.startsWith('$2,615.00 by card holds the date') && has(halfLine, 'The rest, $2,615.00, comes off the same card on ')
      && wholeLine.startsWith('$5,230.00 by card, Link or Klarna'), 'each way names its own amount today, and half today its balance and date');
    check(!/\{\{|\[WRITER|\[MICK/.test(await page.evaluate(() => document.body.innerText)), 'no merge field or placeholder left on the page');
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

  // ---- the Invitation (2026-11-11): read by GET, nothing held, the names from the link
  console.log('the Invitation');
  {
    const { ctx, page, rec } = await open('invite', { invite: invitation() });
    await page.goto(BASE + '/elopement/offer#invite=' + INVITE + '&for=' + encodeURIComponent(GREETING));
    await until(() => visible(page, '#eo-askbtn'));
    check(rec.reads.length === 0 && rec.invites.length === 1 && rec.invites[0].token === INVITE && !rec.invites[0].check_in,
      'reads the Invitation by GET with its token, never POST /v1/offer');
    check(!has(page.url(), INVITE) && has(page.url(), 'for='), 'the token is out of the address bar; the names stay in it');
    check((await text(page, '[data-eo-h1]')) === fill(WORDS.headline), 'the headline greets them by the names in the link');
    check((await text(page, '#eo-note-h')) === WORDS.note_h && (await text(page, '.eo-note p')) === INVITATION.note, 'Mick\'s word, as sent');
    check((await page.$$eval('.eo-day', (l) => l.length)) === 3 && (await page.$$eval('.eo-stop', (l) => l.length)) === 6, 'the day hour by hour: three dates, six stops');
    const stopTimes = await page.$$eval('.eo-stop__time', (l) => l.map((x) => x.textContent));
    check(stopTimes[0] === '3:00 p.m.' && stopTimes[2] === WORDS.sunset_label + ' 8:14 p.m.', 'a stop with no clock time shows the day\'s sunset in its place');
    check(has(await text(page, '.eo-sun'), '8:14 p.m.'), 'the ceremony day\'s sunset under the dates');
    check((await page.$$eval('.eo-photos img', (l) => l.length)) === 4, 'four photographs for the package');
    check((await page.$$eval('.eo-price li', (l) => l.length)) === 4 && has(await text(page, '.eo-total'), '$7,550.00'), 'the price to the dollar: four lines and the total');
    check((await page.$$eval('.eo-dates-list .eo-date', (l) => l.length)) === 3, 'three open dates near theirs');
    check(!(await visible(page, '.gh-agreement')) && !(await visible(page, '#eo-paybtn')) && !(await visible(page, '.eo-way')), 'no agreement, no payment, no ways to pay: nothing is held');
    check((await text(page, '#eo-askbtn')) === WORDS.ask_button && has(await text(page, '.eo-hold'), WORDS.ask_line), 'the button asks; the page says nothing is held yet');
    check(!/\{\{|\[WRITER|\[MICK/.test(await page.evaluate(() => document.body.innerText)), 'no merge field or placeholder left on the page');
    await shot(page, 'invitation-390.png');
    await page.click('.eo-dates-list .eo-date');
    await until(() => rec.invites.length >= 2);
    check(rec.invites[1].check_in === INVITATION.open_dates[0].check_in && rec.invites[1].token === INVITE, 'a tap on an open date reads the Invitation on that date, nothing written');
    await until(() => visible(page, '#eo-askbtn'));
    await page.click('#eo-askbtn');
    await until(async () => has(await page.evaluate(() => document.getElementById('eo').innerText), WORDS.asked_h));
    check(rec.asks.length === 1 && Object.keys(rec.asks[0]).join() === 'token' && rec.asks[0].token === INVITE, 'Ask posts the token and nothing else, and the page says Mick will send the agreement');
    check(rec.holds.length === 0 && rec.checkouts.length === 0 && rec.reads.length === 0, 'nothing held, nothing charged, no offer read');
    check(await noSideways(page), 'no sideways scroll at 390');
    clean(rec, 'invite');
    await ctx.close();
  }
  {
    const { ctx, page, rec } = await open('invite hold', { invite: invitation({ hold: { mode: 'hold', hours: 48, until: null } }) });
    await page.goto(BASE + '/elopement/offer#invite=' + INVITE + '&for=' + encodeURIComponent(GREETING));
    await until(() => visible(page, '#eo-askbtn'));
    check((await text(page, '#eo-askbtn')) === WORDS.hold_button && has(await text(page, '.eo-hold'), '48 hours'), 'in hold mode the button holds and the page says for how long');
    await page.click('#eo-askbtn');
    await until(() => visible(page, '#eo-paybtn'));
    check(rec.holds.length === 1 && rec.holds[0].token === INVITE && rec.holds[0].names === GREETING && rec.reads.length === 1 && rec.reads[0].token === TOKEN,
      'Hold posts the token and the names, then the made offer is read and its agreement shown');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('invite gone', { invite: null });
    await page.goto(BASE + '/elopement/offer#invite=' + INVITE);
    await until(async () => has(await page.evaluate(() => document.getElementById('eo').innerText), WORDS.expired));
    check(!(await visible(page, '#eo-askbtn')), 'an Invitation the engine cannot find: its own line, no button');
    await ctx.close();
  }
  {
    // A made offer that carries days and a note (the engine gains both) shows them above the agreement.
    const { ctx, page } = await open('offer with days', { read: offer({ days: INVITATION.days, note: INVITATION.note, open_dates: INVITATION.open_dates }) });
    await page.goto(BASE + '/elopement/offer#offer=' + TOKEN);
    await until(() => visible(page, '#eo-paybtn'));
    check((await page.$$eval('.eo-stop', (l) => l.length)) === 6 && (await text(page, '.eo-note p')) === INVITATION.note, 'a made offer with days and a note shows them');
    const href = await page.$eval('.eo-dates-list .eo-date', (a) => a.getAttribute('href'));
    check(/^sms:\d+\?&body=/.test(href) && has(decodeURIComponent(href), 'instead of'), 'on a made offer an open date composes a text to the house');
    check(await visible(page, '.gh-agreement') && (await text(page, '#eo-paybtn')) === 'Sign and pay $2,615.00', 'and keeps its agreement and its button');
    await ctx.close();
  }

  // ---- the public door, /your-day (2026-11-12): a picker, the day, one button that fills the form
  console.log('the public door');
  {
    const OPEN = { 'the-crossing': ['2027-04-16', '2027-04-23', '2027-05-07'], 'the-vow': ['2027-04-16', '2027-04-30'], firelight: ['2027-04-19', '2027-04-20'] };
    const answers = [];
    const yourDay = (b) => {
      answers.push(b);
      if (b.check_in === '2027-04-23') return { available: false, reason: 'too_soon', open_dates: INVITATION.open_dates };
      return Object.assign(invitation(), { available: true, package: { key: b.package, name: b.package === 'the-vow' ? 'The Vow' : 'The Crossing', includes: ['A made-up line'] },
        check_in: b.check_in, check_out: '2027-04-18', note: '' });
    };
    const { ctx, page, rec } = await open('your day', { openDays: OPEN, yourDay });
    await page.goto(BASE + '/your-day');
    await until(() => visible(page, '.yd-pkg'));
    check((await text(page, '[data-eo-h1]')) === WORDS.yd_h1 && (await text(page, '[data-eo-lead]')) === WORDS.yd_lead, 'the page\'s own words over the photograph');
    check((await page.$$eval('.yd-pkg', (l) => l.length)) === 3 && (await page.isChecked('#yd-pkg-the-crossing')), 'three packages, the first chosen');
    check(has(await text(page, '.yd-pkg__price'), 'plus tax'), 'each package with its card\'s price');
    await until(() => visible(page, '.yd-cal .gh-day'));
    check(rec.dateReads.join() === 'the-crossing' && rec.dayReads.length === 0, 'the open days read for the chosen package, nothing else asked');
    const days = await page.$$eval('.yd-cal .gh-day', (l) => l.map((b) => [b.getAttribute('data-day'), !b.disabled]));
    check(days.filter((d) => d[1]).map((d) => d[0]).join() === '2027-04-16,2027-04-23' && days.filter((d) => !d[1]).length > 20, 'April: the open days tappable, every other day not');
    check(has(await text(page, '.yd-cal .gh-hint'), 'April 2027') && !(await page.isDisabled('.yd-cal .gh-arrow[aria-label="Later months"]')), 'one month at a time, May a turn away');
    check(!(await visible(page, '[data-eo-body]')) && rec.reads.length === 0 && rec.invites.length === 0, 'nothing of a day before a tap; no offer, no Invitation read');
    await page.click('.yd-cal [data-day="2027-04-16"]');
    await until(() => visible(page, '#eo-askbtn'));
    check(rec.dayReads.length === 1 && rec.dayReads[0].package === 'the-crossing' && rec.dayReads[0].check_in === '2027-04-16' && Object.keys(rec.dayReads[0]).sort().join() === 'check_in,package',
      'a tap posts the package and the day, nothing else');
    check((await page.$$eval('.eo-stop', (l) => l.length)) === 6 && !(await visible(page, '#eo-note-h')) && (await page.$$eval('.eo-photos img', (l) => l.length)) === 4
      && has(await text(page, '.eo-total'), '$7,550.00'), 'the day hour by hour, no note, the photographs, the price');
    check(!(await visible(page, '.gh-agreement')) && !(await visible(page, '#eo-paybtn')) && !(await visible(page, '.eo-way')), 'no agreement, no payment, no ways to pay');
    check((await text(page, '#eo-askbtn')) === WORDS.yd_ask_button && has(await text(page, '.eo-hold'), WORDS.yd_ask_line), 'the one button asks');
    check(await page.evaluate(() => { const b = document.querySelector('.yd-cal [data-day="2027-04-16"]'); return b && b.getAttribute('aria-pressed') === 'true'; }), 'the tapped day lit');
    await page.click('#eo-askbtn');
    await page.waitForTimeout(700);
    const filled = await page.evaluate(() => { const f = document.querySelector('form[name="elopement-inquiry"]'); const v = (n) => f.querySelector('[name="' + n + '"]').value;
      return { date: v('preferred_date'), pkg: v('package'), guests: v('guest_count'), list: v('list'), page: v('page'), near: f.getBoundingClientRect().top < window.innerHeight }; });
    check(filled.date === 'Friday, April 16 to Sunday, April 18, 2027' && filled.pkg === 'the-crossing' && filled.guests === 'just-us' && filled.list === '' && filled.page === '/your-day',
      'the form filled in: the dates, the package, just us, this page');
    check(filled.near, 'and the page at the form');
    check(rec.checkouts.length === 0 && rec.asks.length === 0 && rec.holds.length === 0, 'nothing posted to the engine by the button: the form is the ask');
    // a day the engine refuses, from the open dates
    await page.click('.yd-cal [data-day="2027-04-23"]');
    await until(async () => has(await page.evaluate(() => document.getElementById('eo').innerText), WORDS.yd_too_soon));
    check(rec.dayReads.length === 2 && !(await visible(page, '#eo-askbtn')) && (await page.$$eval('.eo-dates-list .eo-date', (l) => l.length)) === 3,
      'a day the engine refuses: its own line, no button, the open days near it');
    // another package reloads the days
    await page.click('label[for="yd-pkg-firelight"]');
    await until(() => rec.dateReads.length === 2);
    await until(() => visible(page, '.yd-cal .gh-day'));
    const fdays = await page.$$eval('.yd-cal .gh-day', (l) => l.filter((b) => !b.disabled).map((b) => b.getAttribute('data-day')));
    check(rec.dateReads[1] === 'firelight' && fdays.join() === '2027-04-19,2027-04-20' && !(await visible(page, '[data-eo-body]')), 'another package: its own open days, the day cleared');
    check(!/\{\{|\[WRITER|\[MICK/.test(await page.evaluate(() => document.body.innerText)), 'no merge field or placeholder left on the page');
    check(await noSideways(page), 'no sideways scroll at 390');
    clean(rec, 'your day');
    await shot(page, 'your-day-390.png');
    await ctx.close();
  }
  {
    const { ctx, page, rec } = await open('your day, no days', { openDays: {} });
    await page.goto(BASE + '/your-day');
    await until(async () => has(await text(page, '[data-eo-wait]'), WORDS.yd_no_dates));
    check(rec.dateReads.length === 1 && !(await visible(page, '.yd-cal .gh-day')), 'no open days: the page says so and draws no calendar');
    await ctx.close();
  }
  {
    const { ctx, page, rec } = await open('your day, not ready', { ready: false, openDays: {} });
    await page.goto(BASE + '/your-day');
    await until(() => text(page, '[data-eo-wait]'));
    check((await text(page, '[data-eo-wait]')) === NOT_READY && rec.dateReads.length === 0 && !(await visible(page, '.yd-pkg')), 'words not approved: /book\'s line, no picker, the engine never asked');
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
    // No offer in the address: nothing to try again, so the page stands closed on /book's line
    // (never "Something went wrong", which is for an offer that fails to load).
    const { ctx, page, rec } = await open('no key');
    await page.goto(BASE + '/elopement/offer');
    await until(() => text(page, '[data-eo-wait]'));
    check((await text(page, '[data-eo-wait]')) === NOT_READY && rec.reads.length === 0 && rec.booked.length === 0
      && !(await visible(page, '[data-eo-body]')), 'no key: the page closed on /book\'s line, the engine never asked');
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
