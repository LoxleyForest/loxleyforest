#!/usr/bin/env node
/* Checks the pay step on /book (js/gatehouse.js) in a real browser, on a local copy of the site,
   with the real stay agreement (2026-10-24: email first, kept as a checkout lead; the agreement's
   own short version with the full text one tap away).

   Run from the repo:  node scripts/site/check_checkout.js        (SHOTS=dir to save screenshots)
   AGREEMENT=path      the agreement the engine serves (default:
                       ~/work/loxley-rescue/clients/loxley/agreement.md)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the
   Chromium at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   It proves, word for word:
     - the full agreement is in the page and identical to agreement.md, before and after the tap
       on "Read the full agreement";
     - the short version is the agreement's own "In short" section, nothing added;
     - the bold release beside the tick, the tick's words and the typed-name label are unchanged;
     - an agreement without "In short" still shows in full, as before;
     - the email is the first field; leaving it sends one lead to our own server (visit, dates,
       nights, total), once per dates and address, again for new dates at begin_checkout; and
       no beacon and no tag-manager entry ever carries the address;
     - (2026-10-26, the CEO's pay-step piece) the Book tap lands with "Who is coming" and the
       email box in view at 390 x 844, the dates and the total above them, for a stay inside
       the pay-in-full window and a December stay (its balance line added), and focuses
       nothing; on a desktop that already showed the email box the landing is as before;
     - the talk card (js/talk.js) counts card_shown and marker_shown only once it can be seen:
       not while it stands aside, hidden, because the Book button is under both its places.
   Nothing leaves this machine: the booking API is answered here, everything else gets an empty
   answer, Stripe is never reached. */
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
const AGREEMENT_FILE = process.env.AGREEMENT || path.join(process.env.HOME, 'work/loxley-rescue/clients/loxley/agreement.md');
if (!fs.existsSync(AGREEMENT_FILE)) { console.error('agreement not found: ' + AGREEMENT_FILE + ' (set AGREEMENT)'); process.exit(2); }
const AGREEMENT_TEXT = fs.readFileSync(AGREEMENT_FILE, 'utf8');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };

// The words exactly as they stand on the pay step today (js/gatehouse.js), never to change here.
const TICK = 'I have read the stay agreement above and agree to it, including the release in bold.';
const TYPED = 'Type your full name to sign';

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

// ---- the agreement as plain words, worked out here without the page's renderer
function words(md) {
  return String(md).replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n').split('\n').map((l) => l
    .replace(/^\s*#{1,6}\s+/, '').replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1').replace(/\*/g, '')).join(' ').replace(/\s+/g, ' ').trim();
}
function inShort(md) {
  const m = /^#{1,6}\s+In short\s*$([\s\S]*?)(?=^#{1,6}\s)/im.exec(md);
  return m ? m[1].trim() : '';
}
function releaseOf(md) {
  const m = /^\s*\*\*([^*\n]*\brelease[^*\n]*)\*\*\s*$/im.exec(md);
  return m ? m[1] : '';
}
const squash = (s) => String(s).replace(/\s+/g, '');
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// ---- made-up booking data (the agreement alone is real)
function day(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const NIGHTS = { nights: Array.from({ length: 430 }, (_, i) => ({ night: day(i + 1), rate_cents: 39900, min_stay: 2 })) };
const CI = day(14), CO = day(16), CI2 = day(17), CO2 = day(19);
const QUOTE = { quote: { nights: 2, total_cents: 98765, lines: [{ label: '2 nights', cents: 79800 }, { label: 'Cleaning and taxes', cents: 18965 }] },
  modes: ['deposit', 'full'], promise: { retainer_pct: 25, balance_days: 30 },
  plans: { deposit: [{ amount_cents: 24691 }, { amount_cents: 74074, due_on: day(14 - 30 + 30) }], full: [{ amount_cents: 98765 }] },
  summary: {} };
const EMAIL = 'seed@example.net';
// The quote in the engine's shape for its dates (gatehouse/api.py _quote_payload): inside 30
// days, pay in full only; beyond, the retainer first, with the balance and its day.
function isoDay(d) { return d.toISOString().slice(0, 10); }
function stayQuote(ci) {
  const total = 98765, retainer = 24691, within = (new Date(ci + 'T12:00:00Z') - new Date(day(0) + 'T12:00:00Z')) / 864e5 <= 30;
  const bal = new Date(ci + 'T12:00:00Z'); bal.setUTCDate(bal.getUTCDate() - 30);
  const q = { quote: QUOTE.quote, modes: within ? ['full'] : ['deposit', 'full'], promise: QUOTE.promise, plans: {},
    gift_if_paid_in_full: within ? '' : 'pastry flight, first morning',
    summary: { full: { today_cents: total, balance_cents: 0, balance_on: null, change_until: within ? null : isoDay(bal) } } };
  if (!within) q.summary.deposit = { today_cents: retainer, balance_cents: total - retainer, balance_on: isoDay(bal), change_until: isoDay(bal) };
  return q;
}
// A December stay at least five weeks out (the walk's: a balance line on the pay step).
const [DEC_IN, DEC_OUT] = (() => {
  const now = new Date(day(0) + 'T12:00:00Z');
  let d = new Date(Date.UTC(now.getUTCFullYear(), 11, 11, 12));
  if ((d - now) / 864e5 < 35) d = new Date(Date.UTC(now.getUTCFullYear() + 1, 11, 11, 12));
  const o = new Date(d); o.setUTCDate(o.getUTCDate() + 2);
  return [isoDay(d), isoDay(o)];
})();

let failures = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }

async function main() {
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errors = [];

  async function open(name, agreementText, opts) {
    opts = opts || {};
    const vp = opts.viewport || { width: 390, height: 844 };
    const ctx = await browser.newContext(vp.width < 768 ? { viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: vp });
    const beacons = [], leads = [], checkouts = [];
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname === '127.0.0.1') return route.continue();
      if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o, s) => route.fulfill({ status: s || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify(o) });
        if (route.request().method() === 'OPTIONS') return json({});
        let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
        if (u.pathname === '/v1/funnel') { beacons.push(b); return json({ ok: true }); }
        if (u.pathname === '/v1/lead') { leads.push(b); return json({ ok: true }); }
        if (u.pathname === '/v1/checkout') { checkouts.push(b); return json({ error: 'not in this check' }, 503); }
        if (u.pathname === '/v1/availability') return json(NIGHTS);
        if (u.pathname === '/v1/quote') return json(opts.quote ? opts.quote(u.searchParams.get('check_in')) : QUOTE);
        if (u.pathname === '/v1/agreement') return json({ version: 'check', text: agreementText });
        return json({ error: 'not found' }, 404);
      }
      // Tag Manager, analytics, Stripe and the rest: an empty answer, never the real thing.
      return route.fulfill({ status: 200, contentType: /\.js|gtm|gtag/.test(u.pathname) ? 'text/javascript' : 'text/plain', body: '' });
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(name + ': ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(name + ': ' + m.text()); });
    if (opts.clock) await page.clock.install();
    return { ctx, page, beacons, leads, checkouts };
  }
  // Where the page rests after a tap: scrolled until it holds still, then what is in view
  // between the bottom of the fixed header and the bottom of the screen.
  async function landing(page) {
    let last = -1;
    for (let i = 0; i < 40; i++) {
      const y = await page.evaluate(() => window.scrollY);
      if (y === last) break;
      last = y; await page.waitForTimeout(120);
    }
    return page.evaluate(() => {
      const top = document.querySelector('.lf-hdr').getBoundingClientRect().bottom, bottom = window.innerHeight;
      const box = (s) => { const n = document.querySelector(s); if (!n) return { seen: false }; const r = n.getBoundingClientRect(); return { seen: r.height > 0 && r.top >= top && r.bottom <= bottom, top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
      const sec = document.getElementById('gatehouse').closest('section');
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const a = document.activeElement;
      return { y: Math.round(window.scrollY), hdr: Math.round(top), h: bottom,
        email: box('#gh-email'), legend: box('.gh-fields legend'), dates: box('.gh-booking .gh-dates'), total: box('.gh-booking dd.gh-total'),
        legendText: (document.querySelector('.gh-fields legend') || {}).textContent,
        balance: [...document.querySelectorAll('.gh-booking dt')].some((n) => /^Balance, will be charged on /.test(n.textContent)),
        focused: a && a !== document.body ? a.tagName + '#' + a.id : '',
        oldY: Math.round(Math.min(max, Math.max(0, sec.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(sec).scrollMarginTop)))) };
    });
  }
  async function until(fn) { for (let i = 0; i < 30 && !fn(); i++) await new Promise((r) => setTimeout(r, 100)); return fn(); }
  async function shot(page, name) { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name), fullPage: true }); } }
  async function toPay(page, ci, co) {
    await page.goto(BASE + '/book?checkIn=' + ci + '&checkOut=' + co);
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 10000 });
    await page.click('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form', { timeout: 5000 });
  }

  console.log('the pay step, phone 390, the real agreement (' + AGREEMENT_FILE + ')');
  {
    const { ctx, page, beacons, leads, checkouts } = await open('pay', AGREEMENT_TEXT);
    await toPay(page, CI, CO);
    const firstField = await page.evaluate(() => { const f = document.querySelector('.gh-fields input, .gh-fields select'); return f && f.id; });
    check(firstField === 'gh-email', 'the email is the first field (found ' + firstField + ')');

    // B. The agreement: short version, full text in the page, one tap away.
    const shortWant = words(inShort(AGREEMENT_TEXT));
    check(shortWant.length > 40, 'the agreement has an "In short" section to show');
    const view = await page.evaluate(() => {
      const s = document.querySelector('.gh-agreement-short'), d = document.querySelector('details.gh-agreement-full');
      const full = d && d.querySelector('.gh-agreement');
      return { short: s ? s.innerText : null, open: d ? d.open : null, summary: d ? d.querySelector('summary').textContent : null,
        fullDom: full ? full.textContent : null, closedH: d ? d.getBoundingClientRect().height : -1,
        summaryH: d ? d.querySelector('summary').getBoundingClientRect().height : -1,
        release: [...document.querySelectorAll('.gh-sign .gh-release strong')].map((n) => n.textContent),
        tick: (document.querySelector('label.gh-agree span') || {}).textContent,
        typed: (document.querySelector('label[for="gh-typed_name"]') || {}).textContent,
        fine: [...document.querySelectorAll('.gh-terms .gh-fine')].map((n) => n.textContent),
        overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    check(view.short !== null && norm(view.short) === shortWant, 'the short version is the agreement\'s own "In short", word for word');
    check(view.summary === 'Read the full agreement' && view.open === false, '"Read the full agreement", closed until tapped');
    check(view.fullDom !== null && squash(view.fullDom) === squash(words(AGREEMENT_TEXT)), 'closed, the full agreement is in the page, every word of agreement.md');
    check(view.closedH > 0 && view.closedH <= view.summaryH + 1, 'closed, the full text takes no room (' + Math.round(view.closedH) + ' px, the tap line alone)');
    check(view.summaryH >= 44, 'the tap line is a 44 px target (' + Math.round(view.summaryH) + ' px)');
    check(view.release.length === 1 && view.release[0] === releaseOf(AGREEMENT_TEXT) && view.release[0].length > 200, 'the bold release beside the tick, word for word');
    check(view.tick === TICK, 'the tick\'s words unchanged');
    check(view.typed === TYPED, 'the typed-name label unchanged');
    check(view.fine.length === 1 && view.fine[0] === "In short, in the agreement's own words. The full text covers payment, changes, cancellations and the risks of the forest.", 'the line under the heading no longer says "Shown in full"');
    check(view.overflow <= 0, 'no sideways scroll at 390');
    await shot(page, 'pay-closed.png');
    await page.tap('details.gh-agreement-full > summary');
    const opened = await page.evaluate(() => {
      const d = document.querySelector('details.gh-agreement-full'), full = d.querySelector('.gh-agreement');
      return { open: d.open, text: full.innerText, h: full.getBoundingClientRect().height, overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    check(opened.open && opened.h > 100, 'one tap opens the full agreement');
    check(norm(opened.text) === words(AGREEMENT_TEXT), 'opened, the full agreement reads word for word as agreement.md');
    check(opened.overflow <= 0, 'no sideways scroll with the full text open');
    await shot(page, 'pay-open.png');

    // A. The checkout lead.
    check(leads.length === 0, 'no lead before an email is typed');
    await page.fill('#gh-email', EMAIL);
    await page.tap('#gh-first_name');
    check(await until(() => leads.length === 1), 'leaving the email sends one lead');
    const visit = await page.evaluate(() => window.lfFunnel && window.lfFunnel.visit);
    const l = leads[0] || {};
    check(Object.keys(l).sort().join() === 'check_in,check_out,email,nights,total_cents,unit,visit', 'the lead carries visit, unit, email, dates, nights, total, nothing else');
    check(l.visit === visit && l.email === EMAIL && l.check_in === CI && l.check_out === CO && l.nights === 2 && l.total_cents === 98765, 'the lead\'s visit is the funnel\'s, its dates and total the quote\'s');
    await page.tap('#gh-email'); await page.fill('#gh-email', ' ' + EMAIL.toUpperCase()); await page.tap('#gh-phone');
    await page.waitForTimeout(400);
    check(leads.length === 1, 'the same address and dates again: no second lead');
    // Back to the dates, new nights, the pay step again: the kept address goes with the new dates.
    await page.click('#gatehouse .gh-back');
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 5000 });
    await page.click('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form');
    await page.waitForTimeout(300);
    check(leads.length === 1, 'the same dates at begin_checkout: no second lead');
    await page.click('#gatehouse .gh-back');
    await page.waitForSelector('[data-day="' + CI2 + '"]', { timeout: 5000 });
    await page.click('[data-day="' + CI2 + '"]');
    await page.click('[data-day="' + CO2 + '"]');
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 5000 });
    await page.click('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form');
    check(await until(() => leads.length === 2), 'new dates at begin_checkout: one lead for them');
    check((leads[1] || {}).check_in === CI2 && (leads[1] || {}).check_out === CO2 && /^\s*seed@example\.net\s*$/i.test((leads[1] || {}).email || ''), 'the second lead carries the new dates and the kept address');
    const dl = await page.evaluate(() => JSON.stringify(window.dataLayer || []));
    check(!/@/.test(JSON.stringify(beacons)) && !/@/.test(dl), 'no beacon and no tag-manager entry carries the address');
    check(checkouts.length === 0, 'no checkout was opened by any of it');
    await ctx.close();
  }

  console.log('an agreement without "In short": shown in full, as before');
  {
    const plain = AGREEMENT_TEXT.replace(/^#{1,6}\s+In short\s*$[\s\S]*?(?=^#{1,6}\s)/im, '');
    const { ctx, page } = await open('no-short', plain);
    await toPay(page, CI, CO);
    const v = await page.evaluate(() => {
      const full = document.querySelector('.gh-terms .gh-agreement');
      return { details: !!document.querySelector('details.gh-agreement-full'), short: !!document.querySelector('.gh-agreement-short'),
        text: full ? full.innerText : '', fine: (document.querySelector('.gh-terms .gh-fine') || {}).textContent };
    });
    check(!v.details && !v.short, 'no short version and no tap: the full text, open');
    check(norm(v.text) === words(plain), 'every word of it shown');
    check(v.fine === 'Shown in full. It covers payment, changes, cancellations and the risks of the forest.', 'the line under the heading as before');
    await ctx.close();
  }

  // The walk (2026-10-26): after the tap a phone landed on the section's heading and the
  // summary, the email box at the fold (a stay inside 30 days) or below it (December).
  console.log('the Book tap lands on "Who is coming", phone 390 x 844');
  const WITHIN_IN = day(10), WITHIN_OUT = day(12);
  for (const [what, ci, co, tap] of [['inside 30 days', WITHIN_IN, WITHIN_OUT, /^Book for \$/], ['December', DEC_IN, DEC_OUT, /^Reserve for \$/]]) {
    const { ctx, page } = await open('land-' + what, AGREEMENT_TEXT, { quote: stayQuote });
    await page.goto(BASE + '/book?checkIn=' + ci + '&checkOut=' + co);
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 10000 });
    const cta = await page.textContent('#gatehouse button.gh-cta');
    await page.tap('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form', { timeout: 5000 });
    const l = await landing(page);
    check(tap.test(cta), what + ': the tap was "' + cta + '"');
    check(what === 'December' ? l.balance : !l.balance, what === 'December' ? 'December: the summary carries its balance line' : what + ': paid in full, no balance line');
    check(l.legend.seen && l.legendText === 'Who is coming', what + ': "Who is coming" in view (' + l.legend.top + ' px, under the header at ' + l.hdr + ')');
    check(l.email.seen, what + ': the email box in view (' + l.email.top + ' to ' + l.email.bottom + ' of ' + l.h + ' px)');
    check(l.dates.seen && l.total.seen && l.dates.top < l.legend.top && l.total.top < l.legend.top, what + ': the dates and the total in view above it (' + l.dates.top + ', ' + l.total.top + ' px)');
    check(!/INPUT|SELECT|TEXTAREA/.test(l.focused), what + ': no field focused, so no keyboard opens (' + (l.focused || 'nothing') + ')');
    await shot(page, 'land-' + what.replace(/\W+/g, '-') + '.png');
    await ctx.close();
  }
  console.log('the Book tap on a desktop');
  {
    const { ctx, page } = await open('land-desk-tall', AGREEMENT_TEXT, { quote: stayQuote, viewport: { width: 1280, height: 1000 } });
    await page.goto(BASE + '/book?checkIn=' + WITHIN_IN + '&checkOut=' + WITHIN_OUT);
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 10000 });
    await page.click('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form', { timeout: 5000 });
    const l = await landing(page);
    check(l.email.seen && Math.abs(l.y - l.oldY) <= 1, '1280 x 1000, the email box already in view: the landing as before, the section at the top (' + l.y + ' px, was ' + l.oldY + ')');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('land-desk-dec', AGREEMENT_TEXT, { quote: stayQuote, viewport: { width: 1280, height: 800 } });
    await page.goto(BASE + '/book?checkIn=' + DEC_IN + '&checkOut=' + DEC_OUT);
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 10000 });
    await page.click('#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form', { timeout: 5000 });
    const l = await landing(page);
    check(l.email.seen && l.legend.seen && l.dates.seen && l.total.seen && !/INPUT|SELECT|TEXTAREA/.test(l.focused),
      '1280 x 800, December (the old landing hid the email box): "Who is coming", the email box, the dates and the total in view, nothing focused');
    await ctx.close();
  }

  // The walk found card_shown sent while the card stood aside, hidden, because the Book button
  // was under both of its places (js/talk.js guards()).
  console.log('the talk card counts as shown only when it can be seen, phone 390');
  for (const close of [false, true]) {
    const { ctx, page, beacons } = await open(close ? 'card-closed' : 'card', AGREEMENT_TEXT, { clock: true });
    await page.goto(BASE + '/book?checkIn=' + CI + '&checkOut=' + CO);
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 10000 });
    // The Book button in the middle of the screen: under both of the card's places.
    await page.evaluate(() => { const b = document.querySelector('#gatehouse .gh-cta').getBoundingClientRect(); window.scrollBy({ top: (b.top + b.bottom) / 2 - innerHeight / 2, behavior: 'instant' }); });
    await page.clock.runFor(11500); await page.waitForTimeout(300); await page.clock.runFor(500); await page.waitForTimeout(300);
    const st = await page.evaluate(() => { const c = document.getElementById('lf-talk'); return c ? { away: c.classList.contains('is-away'), in: c.classList.contains('is-in'), vis: getComputedStyle(c).visibility, ask: !!c.querySelector('.lf-talk__ask') } : null; });
    const tag = close ? 'closed unseen: ' : '';
    check(!!st && st.in && st.away && st.vis === 'hidden' && st.ask, tag + 'the card is up, standing aside, hidden (it asks for an email)');
    await page.waitForTimeout(400);
    check(!beacons.some((b) => b.step === 'card_shown' || b.step === 'marker_shown'), tag + 'hidden: no card_shown and no marker_shown');
    if (close) { await page.keyboard.press('Escape'); await page.clock.runFor(500); await page.waitForTimeout(450); }
    // The Book button scrolled off the top of the screen: the card can take its place at the foot.
    await page.evaluate(() => { const b = document.querySelector('#gatehouse .gh-cta').getBoundingClientRect(); window.scrollBy({ top: b.bottom + 20, behavior: 'instant' }); });
    await page.clock.runFor(200); await page.waitForTimeout(400);
    if (close) {
      check(!(await page.$('#lf-talk')) && !beacons.some((b) => b.step === 'card_shown' || b.step === 'marker_shown'), 'closed before it was ever seen: never counted as shown');
    } else {
      const seen = await page.evaluate(() => { const c = document.getElementById('lf-talk'); const r = c.getBoundingClientRect(); return !c.classList.contains('is-away') && getComputedStyle(c).visibility === 'visible' && r.top >= 0 && r.bottom <= innerHeight; });
      check(seen, 'the Book button scrolled away: the card in view at the foot of the screen');
      check(await until(() => beacons.some((b) => b.step === 'marker_shown')), 'seen: marker_shown sent');
      const once = () => beacons.filter((b) => b.step === 'card_shown').length === 1 && beacons.filter((b) => b.step === 'marker_shown').length === 1;
      check(once(), 'seen: card_shown and marker_shown, one each');
      const b = beacons.find((x) => x.step === 'card_shown') || {};
      check(Object.keys(b).sort().join() === 'path,step,visit' && b.path === '/book', 'card_shown carries the visit, the step and the page, nothing else');
      await page.evaluate(() => window.scrollBy({ top: -300, behavior: 'instant' }));
      await page.clock.runFor(200); await page.waitForTimeout(200);
      await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'instant' }));
      await page.clock.runFor(200); await page.waitForTimeout(300);
      check(once(), 'scrolled about after: still one each');
    }
    await ctx.close();
  }

  await browser.close();
  srv.close();
  check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log('\n' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
