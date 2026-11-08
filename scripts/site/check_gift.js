#!/usr/bin/env node
/* Checks The Golden Arrow (2026-10-25) in a real browser, on a local copy of the site, phone width
   390: the purchase panel on /gift and its fallback while the engine's sales door is off, the
   thank-you Stripe returns to, the card on /gift/card#code=, a gift code riding /book#gift= into
   the quote and the checkout, and a gift stay on /booked and /manage.

   Run from the repo:  node scripts/site/check_gift.js        (SHOTS=dir to save screenshots and the
                                                               printed card as a PDF)
   Needs playwright-core (scripts/logo/node_modules has it; or set PLAYWRIGHT_CORE) and the Chromium
   at ~/.cache/ms-playwright/chromium-1243 (never "playwright install").

   Nothing leaves this machine. The engine (book.loxleyforest.com) is answered here in its own shapes
   (loxley-rescue branch ceo/golden-arrow, cdb68bc: gatehouse/api.py and gatehouse/gifts.py), each
   gift door (sales, lookup, redeem) on or off as a check needs, off meaning the engine's bare 404
   {"error": "not found"}; its refusal sentences are the engine's own. Stripe is a stub; Tag Manager
   and everything else get an empty answer. Every name and email is made up (example.test). The
   local server applies netlify.toml's 200 rewrites, so /gift/card and /gift/thanks are served as
   they will be live.

   Round two (Mick, 2026-10-25: "as good as a Disney gift card"): the delivery choice (to me, or to
   them by email on a day and hour, with the quick picks and a note with a live count), the card's
   reveal, note and status line, "Print this card" and "Book your nights", the lost-card form
   (POST /v1/gift/resend), the thank-you reading the choice back, every field labelled and every
   focus ring visible, and the buyer's change page (/gift/manage#token=). The engine's round-two
   shapes are its own (loxley-rescue ceo/golden-arrow-2, 4c9175d): deliver {email, date, hour,
   message}, gift_delivery on /v1/health, GET and POST /v1/gift/delivery, state and month on
   GET /v1/gift, resend {ok, message}. One thing the engine does not send is mocked here on
   purpose: a "message" on GET /v1/gift, to prove the card shows a note when one comes.

   It proves:
     - /gift: no price in the page's prose; the panel reads GET /v1/health's gift_sales and says to
       call or text Mick while it is false, missing, or the engine unreachable; with it on, the checks before anything is sent (the state as
       two letters, the ZIP as five digits), the body sent (the contract's fields only), the all-in
       amount shown only in the purchase step, the payment page reused for the same details, Stripe
       reached by script, a non-Stripe answer refused, the engine's refusal shown as it wrote it;
       the visit's own source (js/funnel.js gh_entry) as src and referrer in the checkout, a Google
       ad click as "google-ads"; with no entry or a broken one, neither, and the sale still starts;
       never the long-lived attribution (gh_attr, loxley_attribution);
     - /gift/thanks: the payment session out of the address bar before Tag Manager, the thank-you;
       the sale for Google Ads, gift_purchase {value, currency, transaction_id, item}, only on the
       engine's paid answer (GET /v1/gift/sold), once per session, its id a hash; nothing on paid
       false, a 404, no answer, a bare load or a session that is not Stripe's;
     - /gift/card: the code lifted out of the address bar before Tag Manager, the card filled from
       GET /v1/gift with the card's ratified words and its gift number, long names stepped down
       beside the photo, one printed page, the share link, "Choose your dates" into /book#gift=, and
       the plain sentences for no code, the engine's own for a code it cannot find, a used gift, a
       void one, the lookup door off;
     - /book#gift=: the code rides the quote and the checkout; the total panel says "The Golden Arrow
       covers these nights" with what remains due, fully covered and in part; the third night offered
       as covered; a stay it covers whole hides the trail marker and goes straight to /booked with
       no card; the engine's refusal
       for these dates, a code it cannot find, a used gift, a void one and the redeem door off each
       said plainly, at full price;
     - /booked and /manage for a gift stay: the gift's line in the stay, and "To move or change a
       gift stay, call or text Mick" in place of move and cancel;
     - no beacon, no tag-manager entry and no request to any other host ever carries a gift code,
       a payment session, a name or an email; no sideways scroll at 390; no script errors. */
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

// ---- the words, as the builder wrote them into each page (from the one WORDS block)
const read = (n) => fs.readFileSync(path.join(ROOT, n), 'utf8');
const wordsOf = (n) => JSON.parse(/<script type="application\/json" id="lf-gift-words">([\s\S]*?)<\/script>/.exec(read(n))[1]);
const PANEL = wordsOf('gift.html'), CARD_W = wordsOf('gift-card.html'), BOOK_W = wordsOf('book.html'), STAY_W = wordsOf('manage.html');
// The card's ratified words (loxley-rescue docs/gift-card/golden-arrow/card.html).
const RATIFIED = 'Good for any three nights, weekends included, within twelve months of purchase. After that it never expires; we ask only the difference if rates have risen.';
// Mick, 2026-10-27: brunch, not breakfast; "Champagne brunch across the bridge" approved by ear.
const RATIFIED_GIFT = 'Three nights in the treehouse, and the Dawn Table: champagne brunch carried across the bridge to your door.';
// The engine's own sentences (gatehouse/gifts.py, gatehouse/api.py at cdb68bc).
const NOT_FOUND = 'We could not find that gift. Please check the code on the card.';
const BLACKOUT = 'The Golden Arrow covers any nights but Valentine\'s weekend, the nights of February 12, 13 and 14, 2027. Please choose other dates.';
const PAY_503 = 'Payments are unavailable for a moment; nothing was charged, so please try again.';
// The engine's sales cap (coming): its own sentence, 409.
const SOLD = 'The Golden Arrow is spoken for this season. Call or text Mick at 706-502-4823.';
// The gift in its sizes (js/gift.js SIZES, in shadow): GET /v1/gift/sizes -> {sizes: [...]} (the
// Forge, 2026-11-08, forge/gift-sizes-read), each size on sale with its price all in and the card's
// own words; sold_out and the engine's sentence for one at the season's cap (gifts.FEWER_NIGHTS
// while a shorter size still fits). The shipped file has SIZES false; the "on" checks serve
// js/gift.js with it true, and say so.
const GIFT_JS = read('js/gift.js'), SIZES_SWITCH = 'var SIZES = false;', WORDS_SWITCH = 'var SIZE_WORDS = false;', PRICE_SWITCH = 'var PRICE = false;';
// js/gift.js with its switches set as a run asks: SIZES (the gift page in its sizes), SIZE_WORDS (the
// Writer's gift line and status for a card of one night or two, for Mick's ear) and PRICE (the engine's
// price above the names, which reverses Mick's rule of 2026-10-19 and waits for his yes).
const withSwitches = (sizes, words, price) => GIFT_JS.replace(SIZES_SWITCH, 'var SIZES = ' + !!sizes + ';').replace(WORDS_SWITCH, 'var SIZE_WORDS = ' + !!words + ';').replace(PRICE_SWITCH, 'var PRICE = ' + !!price + ';');
// The page's own lines follow the SIZES switch at build (gift.py SIZES_ON reads js/gift.js): the
// three-night lines while it is off, the Writer's lines that fit every size while it is on. The "on"
// runs serve gift.html with those lines swapped in, as the builder would write it, so the page as it
// would be built is the page rendered.
const NEUTRAL = { h: 'Nights <em>in the trees</em>', lead: 'Nights in the treehouse, and the Dawn Table: champagne brunch carried across the bridge to their door.',
  desc: 'A gift of nights in the treehouse at Loxley Forest, and the Dawn Table.' };
const THREE = { h: 'Three nights <em>in the trees</em>', lead: 'Three nights in the treehouse, and the Dawn Table: champagne brunch carried across the bridge to their door.',
  desc: 'A gift of three nights in the treehouse at Loxley Forest, and the Dawn Table.' };
const WHEN_SIZES = 'Any weeknight for one night, Monday to Thursday; any two or three nights, weekends included. Good within twelve months of purchase. After that it never expires; we ask only the difference if rates have risen.';
const giftBuiltOn = () => ['h', 'lead', 'desc'].reduce((h, k) => h.split(THREE[k]).join(NEUTRAL[k]), read('gift.html'));
const TERMS_1 = 'Good for any weeknight, Monday to Thursday, within twelve months of purchase. After that it never expires; we ask only the difference if rates have risen.';
const TERMS_2 = 'Good for any two nights, weekends included, within twelve months of purchase. After that it never expires; we ask only the difference if rates have risen.';
const FEWER = 'There are not enough nights left this season for this Golden Arrow. A shorter one is still open, or call or text Mick at 706-502-4823.';
const SIZE_1 = { product: 'golden-arrow-1', nights: 1, name: 'The Golden Arrow', subtitle: 'A gift of a night in the trees', price_cents: 75320, terms: TERMS_1, includes: 'the Dawn Table', sold_out: false, sentence: '' };
const SIZE_2 = { product: 'golden-arrow-2', nights: 2, name: 'The Golden Arrow', subtitle: 'A gift of two nights in the trees', price_cents: 150640, terms: TERMS_2, includes: 'the Dawn Table', sold_out: false, sentence: '' };
const SIZE_3 = { product: 'golden-arrow', nights: 3, name: 'The Golden Arrow', subtitle: 'A gift of three nights in the trees', price_cents: 200000, terms: RATIFIED, includes: 'the Dawn Table', sold_out: false, sentence: '' };
const SIZES_ALL = [SIZE_3, SIZE_1, SIZE_2];   // out of nights order on purpose: the page sorts
const priceOf = (product) => ([SIZE_1, SIZE_2, SIZE_3].find((s) => s.product === product) || SIZE_3).price_cents;

// ---- made-up data
function day(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const NIGHTS = { nights: Array.from({ length: 150 }, (_, i) => ({ night: day(i + 1), rate_cents: 55000, min_stay: 2 })) };
const CI = day(20), CO2 = day(22), CO3 = day(23), CO4 = day(24), CI_NO = day(40), CO_NO = day(43);
const NIGHT_ALL_IN = 64439;
const CODE = 'LF-TEST-7Q2X', CODE_USED = 'LF-TEST-USED', CODE_VOID = 'LF-TEST-VOID', CODE_LONG = 'LF-TEST-LONG', CODE_BOOKED = 'LF-TEST-BOOK';
// A gift Mick gave its own window (loxley-rescue forge/gift-window, `gifts extend`): the engine's
// window {from, to, whole, line}, line "" until Mick has heard its words, and a made-up line after.
const CODE_OWN = 'LF-TEST-OWN1', CODE_OWN_LINE = 'LF-TEST-OWN2';
const OWN_LINE = 'A made-up dates line for a gift with its own window.';
const NOTE = 'For the anniversary you keep talking about.\nGo slow, sleep late, and stay in the trees.';
const RESEND = 'If that email bought a Golden Arrow, its card is on its way.';
const DELIVERY_OFF = 'Emailing the card on a day you pick is not open yet.';
const NO_DELIVERY = 'We could not find that gift\'s delivery.';
const SENT_ALREADY = 'Their card has already been emailed, so it can no longer change.';
const DTOKEN = 'tok-deliver-1x9';
// GET /v1/gift's covers: the gift's own twelve months since 2026-10-27 (the engine's dates; the card shows the site's words, never these)
const COVERS = 'October 27, 2026 to October 27, 2027';
function giftRow(code, status, names, giver, more) {
  return Object.assign({ code, product: 'golden-arrow', name: 'The Golden Arrow', status, recipient_names: names, giver_name: giver,
    covers: COVERS, never_expires: true, includes: 'the Dawn Table', state: status === 'issued' ? 'unused' : 'used' }, more || {});
}
// A card of another size (the Chief, 2026-11-08): the engine's new fields on GET /v1/gift (nights,
// subtitle, terms, includes; the Forge adding them), and an older answer with the product alone.
const CODE_TWO = 'LF-TEST-TWO2', CODE_ONE = 'LF-TEST-ONE1', CODE_TWO_OWN = 'LF-TEST-TWOW', CODE_TWO_BARE = 'LF-TEST-TWOB';
const GIFTS = {
  [CODE]: giftRow(CODE, 'issued', 'Ana & Luis', 'Aunt June', { message: NOTE }),
  [CODE_TWO]: giftRow(CODE_TWO, 'issued', 'Ana & Luis', 'Aunt June', { product: 'golden-arrow-2', nights: 2, subtitle: 'A gift of two nights in the trees', terms: TERMS_2 }),
  [CODE_ONE]: giftRow(CODE_ONE, 'issued', 'Ana & Luis', 'Aunt June', { product: 'golden-arrow-1' }),
  // the engine at main ac3bb9a: a two-night gift with its own window carries terms "" (its dates line the
  // window's, "" until Mick hears one); a size without its own words sends terms "" and no window
  [CODE_TWO_OWN]: giftRow(CODE_TWO_OWN, 'issued', 'Ana & Luis', 'Aunt June', { product: 'golden-arrow-2', nights: 2, subtitle: 'A gift of two nights in the trees', terms: '',
    covers: 'December 5, 2026 to December 5, 2027', window: { from: '2026-12-05', to: '2027-12-05', whole: true, line: OWN_LINE } }),
  [CODE_TWO_BARE]: giftRow(CODE_TWO_BARE, 'issued', 'Ana & Luis', 'Aunt June', { product: 'golden-arrow-2', nights: 2, subtitle: 'A gift of two nights in the trees', terms: '' }),
  [CODE_USED]: giftRow(CODE_USED, 'redeemed', 'Ana & Luis', 'Aunt June', { state: 'used', month: 'March 2027' }),
  [CODE_BOOKED]: giftRow(CODE_BOOKED, 'redeemed', 'Ana & Luis', 'Aunt June', { state: 'booked', month: 'February 2027' }),
  [CODE_VOID]: giftRow(CODE_VOID, 'void', 'Ana & Luis', 'Aunt June'),
  [CODE_LONG]: giftRow(CODE_LONG, 'issued', 'Elizabeth Anne Whitfield & Christopher James Okonkwo-Brennan', 'Grandmother Josephine and Grandfather Bartholomew Whitfield'),
  [CODE_OWN]: giftRow(CODE_OWN, 'issued', 'Ana & Luis', 'Aunt June', { covers: 'December 5, 2026 to December 5, 2027',
    window: { from: '2026-12-05', to: '2027-12-05', whole: true, line: '' } }),
  [CODE_OWN_LINE]: giftRow(CODE_OWN_LINE, 'issued', 'Ana & Luis', 'Aunt June', { covers: 'December 5, 2026 to December 5, 2027',
    window: { from: '2026-12-05', to: '2027-12-05', whole: true, line: OWN_LINE } }),
};
// Eastern time and the quick picks, worked out here as the page must.
function nowEastern() {
  const p = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
}
function nextMorning(md) { const y = +nowEastern().slice(0, 4), at = y + '-' + md + 'T07:00'; return at > nowEastern() ? at : (y + 1) + '-' + md + 'T07:00'; }
// The engine's words for a delivery moment (gatehouse/gifts.py when_words).
function whenEngine(date, hour) {
  const d = new Date(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ' at ' + ((hour % 12) || 12) + ' ' + (hour < 12 ? 'AM' : 'PM') + ' Eastern';
}
const THEM = 'them@example.test';
const AGREEMENT = { version: 'check', text: '# The stay agreement\n\nA made-up agreement for the check.\n\n**I accept the release of liability.**\n' };
const PAY_URL = 'https://checkout.stripe.com/c/pay/cs_test_giftcheck';
const SESSION = 'cs_test_thanks_5RTq';
const BUYER = { names: 'Maya & Sam', giver: 'Dad', email: 'buyer@example.test' };
const SHIP = { name: 'Dad Example', line1: '1 Test Lane', line2: 'Apt 2', city: 'Testville', state: 'GA', zip: '30533' };
const SECRETS = [DTOKEN, CODE, CODE_USED, CODE_VOID, CODE_LONG, CODE_BOOKED, SESSION, 'mt-test-1', BUYER.email, BUYER.names, THEM, 'Ana & Luis', 'Aunt June', 'Test Lane', 'sleep late', 'lost@example.test'];

// The engine's quote (gatehouse/api.py _quote_payload): `quote` and `total` stay the stay's own
// all-in; with a gift, gift_card says what it covers and plans, summary and extend are on what is left.
// Past the card's twelve months the engine says so in its own sentence, with the card's last night
// (gatehouse/gifts.py AFTER_WINDOW; "" inside the twelve months). win: 'past' sends it; 'past-noline'
// sends after_window alone, as an older engine would.
const AFTER_LINE = 'These nights fall after October 27, 2027, so we ask only the difference.';
function quote(ci, co, gift, win) {
  const n = Math.round((new Date(co) - new Date(ci)) / 86400000);
  const total = n * NIGHT_ALL_IN;
  let card = null;
  if (gift) {
    const k = Math.min(3, n), off = k * NIGHT_ALL_IN;
    card = { code: gift, name: 'The Golden Arrow', nights: k, gift_cents: off, due_cents: total - off,
      due: '$' + ((total - off) / 100).toFixed(2), after_window: !!win, after_window_line: win === 'past' ? AFTER_LINE : '', includes: 'the Dawn Table' };
  }
  const left = card ? card.due_cents : total, dep = Math.round(left * 0.25);
  return { unit: 'u', check_in: ci, check_out: co, total: '$' + (total / 100).toFixed(2),
    quote: { nights: n, total_cents: total, lines: [{ label: n + ' nights', cents: n * 55000 }, { label: 'Taxes and fees', cents: n * (NIGHT_ALL_IN - 55000) }] },
    modes: ['deposit', 'full'], promise: { retainer_pct: 25, balance_days: 30 },
    plans: { deposit: [{ amount_cents: dep }, { amount_cents: left - dep, due_on: day(10) }], full: [{ amount_cents: left }] },
    summary: { deposit: { today_cents: dep, balance_cents: left - dep, balance_on: day(10) }, full: { today_cents: left, balance_cents: 0, balance_on: null } },
    credit_cents: 0, gift_card: card,
    // two nights offer the third; against the gift, a night it covers adds nothing
    extend: n === 2 ? { check_out: co, add_cents: card ? 0 : NIGHT_ALL_IN } : null };
}
function giftStay() {
  return { status: 'reserved', check_in: CI, check_out: CO3, guests: 2, dogs: 0,
    total_cents: 3 * NIGHT_ALL_IN, paid_cents: 0, payments: [], can_move: false, can_cancel: false, reschedules_used: 0,
    change_until: null, gift_card: { gift_cents: 3 * NIGHT_ALL_IN, includes: 'the Dawn Table' } };
}

let failures = 0, passes = 0;
function check(ok, what) { if (ok) { passes++; console.log('  ok   ' + what); } else { failures++; console.log('  FAIL ' + what); } }
const has = (s, t) => String(s).indexOf(t) >= 0;

// Static: the pages as built.
function statics() {
  console.log('the pages as built');
  const gift = read('gift.html'), card = read('gift-card.html'), thanks = read('gift-thanks.html'), mng = read('gift-manage.html'), book = read('book.html');
  const prose = gift.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  check(!/\$\s?\d/.test(prose) && !/\$\s?\d/.test(JSON.stringify(PANEL)), '/gift: no price in its prose or its words');
  check([gift, card, thanks, mng].every((h) => has(h, 'GTM-5N4BX66K')), 'Tag Manager on all four pages (the house rule)');
  for (const [n, h] of [['/gift/card', card], ['/gift/thanks', thanks], ['/gift/manage', mng]]) {
    const keysAt = h.indexOf('<!-- Booking keys'), gtmAt = h.indexOf('gtm.js?id=');
    check(keysAt > 0 && gtmAt > keysAt, n + ': the keys script runs before Tag Manager');
    check(has(h, 'noindex') && /src="\/js\//.test(h) && /href="\/css\/v2-pages\.css"/.test(h), n + ': noindex, root paths (served one folder deep)');
  }
  check(!has(gift, 'noindex'), '/gift is indexable');
  check(/'gift','code'[,\]]/.test(book) && /'gift','code'[,\]]/.test(card), 'the keys script lifts gift and code');
  check(REWRITES['/gift/card'] === '/gift-card.html' && REWRITES['/gift/thanks'] === '/gift-thanks.html' && REWRITES['/gift/manage'] === '/gift-manage.html', 'netlify.toml serves /gift/card, /gift/thanks and /gift/manage');
  // The one way in (2026-10-26, the CEO's piece): "The Golden Arrow" beside "Questions" in the menu
  // and the footer of every page that has them (build_v2.GIFT_LINK). Anything else that links to a
  // gift page is still a failure: the card, the thank-you and the change page are reached by their
  // own links, never from the site.
  const ONE_WAY = '<a href="/faq">Questions</a><a href="/gift">The Golden Arrow</a></nav>';
  // "Give a Stay" (build_v2.GIVE_A_STAY, 2026-11-08, for Mick's yes): on, the second link of the header row
  // and the menu is /gift as "Give a Stay", and the home page carries a band to /gift; the one way beside
  // "Questions" stays either way. The built pages say which state they are in.
  const GIVE = '<a href="/gift">Give a Stay</a>';
  const giveOn = has(read('index.html'), GIVE);
  const pages = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html'));
  const navved = pages.filter((n) => /aria-label="(?:Menu|Footer)"/.test(read(n)));
  const missing = navved.filter((n) => {
    const h = read(n);
    return (!giveOn && !(/<nav aria-label="Menu">[^]*?<\/nav>/.exec(h) || [''])[0].endsWith(ONE_WAY))
      || !(/<nav aria-label="Footer">[^]*?<\/nav>/.exec(h) || [''])[0].endsWith(ONE_WAY);
  });
  check(navved.length > 0 && missing.length === 0, 'every page\'s ' + (giveOn ? 'footer links' : 'menu and footer link') + ' to /gift as "The Golden Arrow"' + (missing.length ? ': not on ' + missing.join(', ') : ''));
  // on, the header row keeps its six links (a seventh pushes the Book button off a 1280 px screen, the
  // Critic measured); the menu takes "Give a Stay" second and drops "The Golden Arrow", one name for /gift
  // there; the footer keeps the one way. check_header_fit.js lays the header out at 1280 to 1366 px.
  const giveWrong = navved.filter((n) => {
    const h = read(n), row = (/<nav class="lf-hdr__nav" aria-label="Main">([^]*?)<\/nav>/.exec(h) || ['', ''])[1], menu = (/<nav aria-label="Menu">([^]*?)<\/nav>/.exec(h) || ['', ''])[1];
    const links = (s) => s.match(/<a [^>]*>[^<]*<\/a>/g) || [];
    const giftLinks = (s) => links(s).filter((a) => /href="\/gift"/.test(a)).length;
    if (has(row, GIVE) || links(row).length !== 6) return true;
    return giveOn ? (links(menu)[1] !== GIVE || giftLinks(menu) !== 1 || !menu.endsWith('<a href="/faq">Questions</a>')) : (has(menu, GIVE) || giftLinks(menu) !== 1);
  });
  check(giveWrong.length === 0, (giveOn ? 'the header row keeps its six links; "Give a Stay" is the menu\'s second link and /gift\'s one name there, on every page' : 'no page carries "Give a Stay" (GIVE_A_STAY off); the row\'s six links, /gift once in the menu') + (giveWrong.length ? ': wrong on ' + giveWrong.join(', ') : ''));
  // (the giveaway's third door, "Give a stay" to /gift?src=giveaway-site, is the reel's way in, 2026-11-08)
  const linking = pages.filter((n) => !/^gift/.test(n))
    .filter((n) => /href="\/?gift(?:[\/"#?.-])/i.test(read(n).split(ONE_WAY).join('</nav>').split(GIVE).join('')
      .replace(/<section class="lf-sec lf-dark lf-center lf-give"[^]*?<\/section>/, '').replace(/<nav class="gw-doors"[^]*?<\/nav>/g, '')));
  check(linking.length === 0, 'no other link to the gift pages beyond the giveaway\'s door' + (giveOn ? ', "Give a Stay" and the home band' : '') + (linking.length ? ': ' + linking.join(', ') : ''));
  check(giveOn ? has(gift, 'ga-what__gift') && /gift card/i.test(gift) : !has(gift, 'ga-what__gift'), giveOn ? '/gift says "gift card" where it explains the gift' : '/gift does not say "gift card" yet (GIVE_A_STAY off)');
  check(!/\/gift/.test(read('sitemap.xml')), 'not in sitemap.xml');
  check(has(gift, RATIFIED), '/gift carries the card\'s ratified terms line');
  // The page's own lines follow the sizes switch at build (gift.py SIZES_ON reads js/gift.js); the
  // "When" row keeps the card's ratified words either way (js/gift.js swaps it only while all three sell).
  const sizesBuilt = has(GIFT_JS, 'var SIZES = true;');
  check((GIFT_JS.match(/var SIZE_WORDS = (true|false);/g) || []).length === 1 && has(GIFT_JS, WORDS_SWITCH), 'the SIZE_WORDS switch is one line, false as shipped (the Writer\'s two card lines wait for Mick\'s ear)');
  check(!has(prose, WHEN_SIZES) && PANEL.when_sizes === WHEN_SIZES && /data-ga-when>Good for any three nights/.test(gift), 'the "When" row is built with the card\'s ratified words; the one sentence for every size is in the page\'s words for the script alone');
  if (sizesBuilt) check(has(gift, NEUTRAL.h) && has(gift, NEUTRAL.lead) && has(gift, NEUTRAL.desc) && !has(gift, THREE.h) && has(card, NEUTRAL.desc), '/gift built with SIZES on: the lines that fit every size (the Writer\'s, for Mick\'s ear), on the card page\'s description too');
  else check(has(gift, THREE.h) && has(gift, THREE.lead) && has(gift, THREE.desc) && !has(gift, NEUTRAL.h) && !has(gift, NEUTRAL.lead) && has(card, THREE.desc), '/gift built with SIZES off: the three-night lines as today, none of the per-size lines on the page');
  check(BOOK_W.book_covers === 'The Golden Arrow covers these nights.' && STAY_W.stay_gift_move === 'To move or change a gift stay, call or text Mick at 706-502-4823.', 'the CEO\'s two lines, word for word');
}

async function main() {
  statics();
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const errors = [];

  // engine: doors { sales, lookup, redeem } each 'on' | 'off'; down: no answer at all; sale503; checkoutUrl
  async function open(name, engine) {
    engine = Object.assign({ sales: 'on', lookup: 'on', redeem: 'on', down: false, checkoutUrl: PAY_URL }, engine || {});
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      reducedMotion: engine.reducedMotion ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(() => {
      // What the panel keeps for the thank-you, seen as it is written (it is cleared once shown).
      try {
        const set = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { if (k === 'ga_deliver') { try { set.call(localStorage, '__ga_kept', v); } catch (e) {} } return set.call(this, k, v); };
      } catch (e) {}
      try { Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { window.__shared = d; return Promise.resolve(); } }); } catch (e) {}
      window.__printed = 0;
      window.print = () => { window.__printed++; };
    });
    const rec = { beacons: [], health: 0, lookups: [], probes: 0, sales: [], resends: [], deliveries: [],
      dv: { recipient_names: 'Ana & Luis', giver_name: 'Aunt June', email: THEM, date: nextMorning('12-25').slice(0, 10), hour: 8, message: NOTE, sent: !!engine.sent }, quotes: [], checkouts: [], stays: [], outside: [], stripePages: [], solds: [] };
    await ctx.route('**/*', (route) => {
      const req = route.request(), u = new URL(req.url());
      if (u.hostname === '127.0.0.1' && u.pathname === '/js/gift.js' && (engine.sizesOn || engine.sizeWordsOn || engine.priceOn)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: withSwitches(engine.sizesOn, engine.sizeWordsOn, engine.priceOn) });
      if (u.hostname === '127.0.0.1' && (u.pathname === '/gift' || u.pathname === '/gift.html') && engine.sizesOn && !has(GIFT_JS, 'var SIZES = true;')) return route.fulfill({ status: 200, contentType: 'text/html', body: giftBuiltOn() });
      if (u.hostname === '127.0.0.1') return route.continue();
      if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') return route.continue();
      if (u.hostname === 'book.loxleyforest.com') {
        const json = (o, s) => route.fulfill({ status: s || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: JSON.stringify(o) });
        if (req.method() === 'OPTIONS') return json({});
        if (engine.down && /^\/v1\/gift/.test(u.pathname)) return route.abort('failed');
        let b = {}; try { b = JSON.parse(req.postData() || '{}'); } catch (e) {}
        if (u.pathname === '/v1/funnel') { rec.beacons.push(req.postData() || ''); return json({ ok: true }); }
        // The engine says whether it may sell (main 002ab6c): gift_sales on /v1/health.
        if (u.pathname === '/v1/health') {
          rec.health++;
          if (engine.down) return route.abort('failed');
          const h = { ok: true, units: 1, agreement: true, stripe: true, live: false, payments: true };
          // as api.py health computes it: the sales door, and the 3-night card not at its cap
          const capped3 = (engine.sizesList || []).some((s) => s.product === 'golden-arrow' && s.sold_out === true);
          if (engine.sales !== 'nofield') h.gift_sales = engine.sales === 'on' && !capped3;
          h.gift_delivery = engine.delivery !== 'off';
          // each open size that still sells (main c78de5b): [] while the sales door is off
          h.gift_sizes = engine.sales === 'on' ? (engine.sizes || ['golden-arrow']) : [];
          rec.healthSaid = h;
          return json(h);
        }
        // The sizes on sale, with their prices and words (the Forge, 2026-11-08).
        if (u.pathname === '/v1/gift/sizes') {
          rec.sizesReads = (rec.sizesReads || 0) + 1;
          if (engine.sales === 'off' || engine.sizesRoute === 'off') return json({ error: 'not found' }, 404);
          if (engine.sizesRoute === 'down') return route.abort('failed');
          return json('sizesAnswer' in engine ? engine.sizesAnswer : { sizes: engine.sizesList || [SIZE_3] });
        }
        if (u.pathname === '/v1/gift') {
          if (engine.lookup === 'off') return json({ error: 'not found' }, 404);
          const code = u.searchParams.get('code') || '';
          rec.lookups.push(code);
          if (!code) return json({ error: 'Please include code.' }, 400);
          return GIFTS[code] ? json(GIFTS[code]) : json({ error: NOT_FOUND }, 404);
        }
        if (u.pathname === '/v1/gift/checkout') {
          if (engine.sales === 'off') return json({ error: 'not found' }, 404);
          if (!b.product) { rec.probes++; return json({ error: 'A product is needed.' }, 400); }
          rec.sales.push(b);
          if (engine.sale503) return json({ error: PAY_503 }, 503);
          if (engine.soldOut) return json({ error: SOLD }, 409);
          if (b.deliver && engine.delivery === 'off') return json({ error: DELIVERY_OFF }, 400);
          return json({ url: engine.checkoutUrl, total_cents: priceOf(b.product) });
        }
        if (u.pathname === '/v1/gift/resend') {
          if (engine.resend === 'off') return json({ error: 'not found' }, 404);
          rec.resends.push(b);
          return json({ ok: true, message: RESEND });
        }
        if (u.pathname === '/v1/gift/delivery') {
          if (engine.delivery === 'off') return json({ error: 'not found' }, 404);
          const dv = rec.dv;
          const view = () => ({ name: 'The Golden Arrow', recipient_names: dv.recipient_names, giver_name: dv.giver_name, email: dv.email,
            date: dv.date, hour: dv.hour, when: whenEngine(dv.date, dv.hour), message: dv.message, sent: dv.sent, can_change: !dv.sent });
          const tok = req.method() === 'GET' ? u.searchParams.get('token') : b.token;
          rec.deliveries.push({ method: req.method(), body: b, token: tok });
          if (tok !== DTOKEN) return json({ error: NO_DELIVERY }, 404);
          if (req.method() === 'GET') return json(view());
          if (dv.sent) return json({ error: SENT_ALREADY }, 422);
          if (b.email) dv.email = b.email;
          if (b.date) dv.date = b.date;
          if (b.hour !== undefined) dv.hour = +b.hour;
          return json(view());
        }
        // The sale's proof (the Forge, 2026-10-29): {paid, cents} for a gift session, 404 for anything else.
        if (u.pathname === '/v1/gift/sold') {
          const sid = u.searchParams.get('session_id') || '';
          rec.solds.push(sid);
          if (engine.sold === 'none' || sid !== SESSION) return json({ error: 'not found' }, 404);
          // paid at the price of the size the last sale asked for (the 3-night's when none was made in this run)
          return json(engine.sold === 'unpaid' ? { paid: false, cents: 0 } : { paid: true, cents: rec.sales.length ? priceOf(rec.sales[rec.sales.length - 1].product) : 200000 });
        }
        if (u.pathname === '/v1/availability') return json(NIGHTS);
        if (u.pathname === '/v1/agreement') return json(AGREEMENT);
        if (u.pathname === '/v1/quote') {
          rec.quotes.push(u.search);
          const ci = u.searchParams.get('check_in'), co = u.searchParams.get('check_out');
          // gift= is not read while the redeem door is off
          const gift = engine.redeem === 'on' ? u.searchParams.get('gift') : null;
          if (gift && !GIFTS[gift]) return json({ error: NOT_FOUND }, 404);
          if (gift && GIFTS[gift].status !== 'issued') return json({ error: 'This gift has already been used.' }, 422);
          if (gift && ci === CI_NO) return json({ error: BLACKOUT }, 422);
          return json(quote(ci, co, gift, engine.window));
        }
        if (u.pathname === '/v1/checkout') {
          rec.checkouts.push(b);
          const gift = engine.redeem === 'on' ? b.gift : null;
          const q = quote(b.check_in, b.check_out, gift, engine.window);
          const left = q.gift_card ? q.gift_card.due_cents : q.quote.total_cents;
          if (!left) return json({ confirmed: true, client_secret: null, due_now_cents: 0, manage_token: 'mt-test-1', total_cents: 0, gift_cents: q.gift_card.gift_cents });
          return json({ client_secret: 'cs_test_secret_1', total_cents: left, gift_cents: q.gift_card ? q.gift_card.gift_cents : 0, summary: q.summary[b.mode] });
        }
        if (u.pathname === '/v1/stay') {
          rec.stays.push(u.searchParams.get('token'));
          return u.searchParams.get('token') === 'mt-test-1' ? json(giftStay()) : json({ error: 'We could not find that stay.' }, 404);
        }
        return json({ error: 'not found' }, 404);
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
    // A refusal answered on purpose shows as the browser's own "Failed to load resource" line; not an error here.
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
  function leaks(rec, dl, what) {
    const outside = rec.outside.filter((x) => SECRETS.some((s) => x.indexOf(s) >= 0 || x.indexOf(encodeURIComponent(s)) >= 0));
    const beacon = rec.beacons.filter((x) => SECRETS.some((s) => x.indexOf(s) >= 0));
    const tags = SECRETS.filter((s) => dl.indexOf(s) >= 0);
    check(!outside.length && !beacon.length && !tags.length, what + ': no beacon, tag-manager entry or outside request carries a code, a session, a name or an email' +
      (outside.length + beacon.length + tags.length ? ' (' + outside.concat(beacon, tags).join(' | ').slice(0, 300) + ')' : ''));
  }
  const dataLayer = (page) => page.evaluate(() => JSON.stringify(window.dataLayer || []));
  // The sale for Google Ads (2026-10-29): gift_purchase, pushed by the page itself on Stripe's return.
  const sold = (page) => page.evaluate(() => (window.dataLayer || []).filter((x) => x && (x.event === 'gift_purchase' || x.event === 'purchase')));
  const settle = () => new Promise((r) => setTimeout(r, 600));
  const text = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return n ? n.innerText.replace(/\s+/g, ' ').trim() : null; }, sel);
  // A button's own words (its CSS sets them in capitals, which innerText would report).
  const label = (page, sel) => page.evaluate((s) => { const n = document.querySelector(s); return n ? n.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
  // A button, box or link pressed as the DOM does. The page's smooth scroll (Lenis) can keep a long
  // page moving under Playwright's pointer for longer than its patience (seen 2026-10-25, twice in
  // four runs); what the page does with the press, not the pointer, is what these checks are for.
  const press = (page, sel) => page.$eval(sel, (b) => b.click());
  // Every control in a region, brought in turn to the top of the screen (just under the header) and
  // to the bottom edge, where a reader scrolling meets it: no fixed element (the floating Book
  // button, a card, anything pinned) may sit over it in either place.
  async function covered(page, within) {
    const q = (sel) => sel + ' input, ' + sel + ' select, ' + sel + ' textarea, ' + sel + ' button, ' + sel + ' a[href]';
    const n = await page.evaluate((all) => document.querySelectorAll(all).length, q(within));
    const out = [];
    for (let i = 0; i < n; i++) {
      for (const edge of ['start', 'end']) {
        const shown = await page.evaluate(([all, k, edge]) => {
          const c = document.querySelectorAll(all)[k];
          const r0 = c.getBoundingClientRect();
          if (!r0.width || !r0.height || getComputedStyle(c).visibility === 'hidden') return false;
          const hdr = document.querySelector('.lf-hdr'), keep = [c.style.scrollMarginTop, c.style.scrollMarginBottom];
          c.style.scrollMarginTop = ((hdr ? hdr.getBoundingClientRect().height : 0) + 8) + 'px';
          c.style.scrollMarginBottom = '0px';
          c.scrollIntoView({ block: edge });
          c.style.scrollMarginTop = keep[0]; c.style.scrollMarginBottom = keep[1];
          return true;
        }, [q(within), i, edge]);
        if (!shown) continue;
        // Let the page answer the scroll as a reader would see it (the floating button fades in
        // and out over 0.3 s on scroll).
        await page.waitForTimeout(400);
        const hit = await page.evaluate(([all, k, edge]) => {
          const c = document.querySelectorAll(all)[k], r = c.getBoundingClientRect();
          const fixed = [...document.querySelectorAll('body *')].filter((x) => {
            const cs = getComputedStyle(x);
            if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
            const f = x.getBoundingClientRect();
            return f.width > 0 && f.height > 0 && f.left < r.right && f.right > r.left && f.top < r.bottom && f.bottom > r.top;
          });
          return fixed.length ? (c.id || c.textContent.trim().slice(0, 30) || c.tagName) + ' (at the ' + (edge === 'end' ? 'bottom' : 'top') + ') under ' +
            (String(fixed[0].className) || fixed[0].tagName) : null;
        }, [q(within), i, edge]);
        if (hit) out.push(hit);
      }
    }
    return out;
  }
  // Anything marked hidden that a stylesheet still shows (a display rule beats the hidden attribute).
  const leaky = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s + ' [hidden]')]
    .filter((n) => getComputedStyle(n).display !== 'none').map((n) => n.className || n.tagName), sel);
  // Tab through a region by keyboard: every stop must show a ring (2 px or more, not the linen of
  // the site's dark-ground ring), on the control or, for a radio or tick box, on its label.
  async function rings(page, within) {
    // Start just inside the region (no scrolling of our own: the page's smooth scroll owns that),
    // then let the keyboard walk.
    await page.evaluate((sel) => { const b = document.querySelector(sel); b.setAttribute('tabindex', '-1'); b.focus({ preventScroll: true }); }, within);
    const stops = [], bad = [];
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate((sel) => {
        const a = document.activeElement, box = document.querySelector(sel);
        if (!a || !box || !box.contains(a)) return null;
        const ring = (n) => { const c = getComputedStyle(n); return { w: parseFloat(c.outlineWidth) || 0, s: c.outlineStyle, c: c.outlineColor }; };
        let o = ring(a);
        if ((a.type === 'radio' || a.type === 'checkbox') && a.closest('label')) { const l = ring(a.closest('label')); if (l.w >= o.w) o = l; }
        return { id: a.id || (a.textContent || '').trim().slice(0, 40) || a.className || a.tagName, ok: o.w >= 2 && o.s !== 'none' && o.c !== 'rgb(247, 243, 237)' };
      }, within);
      if (!r) { if (stops.length) break; else continue; }
      if (r.id === stops[stops.length - 1]) continue;      // a date field's next part: the same stop
      if (stops.indexOf(r.id) >= 0) break;
      stops.push(r.id);
      if (!r.ok) bad.push(r.id);
    }
    await page.evaluate((sel) => { const b = document.querySelector(sel); b.removeAttribute('tabindex'); document.activeElement && document.activeElement.blur && document.activeElement.blur(); }, within);
    return { stops, bad };
  }

  // ------------------------------------------------------------------ /gift
  console.log('/gift while the engine\'s sales door is off');
  {
    const { ctx, page, rec } = await open('gift-off', { sales: 'off' });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-panel', { timeout: 10000 });
    check(await text(page, '#ga-buy .ga-panel__lead') === PANEL.off, 'the panel says plainly to call or text Mick');
    const links = await page.evaluate(() => [...document.querySelectorAll('#ga-buy a')].map((a) => a.getAttribute('href')));
    check(links.join() === 'tel:+17065024823,sms:+17065024823', 'with one tap to call and one to text');
    check(!(await page.$('#ga-buy form')) && rec.sales.length === 0, 'no form to fill, nothing sent');
    check(await page.evaluate(() => document.querySelector('.ga-give__lead').hidden), 'the line promising a price before paying steps aside');
    const body = await page.evaluate(() => document.body.innerText);
    check(!/\$\s?\d/.test(body), 'no price anywhere on the page');
    check(has(body, RATIFIED), 'the window and the never-expires line, in the card\'s ratified words');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'gift-off.png');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('gift-down', { down: true });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-panel', { timeout: 10000 });
    check(await text(page, '#ga-buy .ga-panel__lead') === PANEL.down, 'the engine unreachable: closed, nothing was charged, Mick\'s number');
    await ctx.close();
  }
  {
    const { ctx, page, rec } = await open('gift-nofield', { sales: 'nofield' });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-panel', { timeout: 10000 });
    check(await text(page, '#ga-buy .ga-panel__lead') === PANEL.off && rec.sales.length === 0, '/v1/health without gift_sales: closed, the call-or-text panel');
    await ctx.close();
  }

  console.log('/gift with the sales door on: the purchase panel');
  {
    const { ctx, page, rec } = await open('gift-on', {});
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    check(rec.health === 1 && rec.probes === 0, 'whether to sell read once from GET /v1/health (gift_sales), no empty order sent');
    const ids = await page.evaluate(() => [...document.querySelectorAll('#ga-buy input')].map((i) => i.id));
    check(['ga-for', 'ga-from', 'ga-email', 'ga-mail'].every((i) => ids.indexOf(i) >= 0), 'their names, the giver\'s name, the email and "mail me the printed card"');
    check(await page.evaluate(() => document.querySelector('.ga-ship').hidden), 'the address stays hidden until the box is ticked');
    check(!/\$\s?\d/.test(await page.evaluate(() => document.body.innerText)), 'no amount on the page before the purchase step');
    await shot(page, 'gift-top.png', false);
    await page.locator('#ga-buy form').scrollIntoViewIfNeeded();
    await shot(page, 'gift-panel-form.png', false);

    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_for && rec.sales.length === 0, 'empty: it asks for their names and sends nothing');
    await page.fill('#ga-for', BUYER.names);
    await page.fill('#ga-from', BUYER.giver);
    await page.fill('#ga-email', 'not-an-email');
    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_email && rec.sales.length === 0, 'a bad email: it asks for a working one');
    await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-mail');
    check(!(await page.evaluate(() => document.querySelector('.ga-ship').hidden)), 'ticked: the address opens');
    await page.fill('#ga-ship-name', SHIP.name);
    await page.fill('#ga-ship-line1', SHIP.line1);
    await page.fill('#ga-ship-line2', SHIP.line2);
    await page.fill('#ga-ship-city', SHIP.city);
    await page.fill('#ga-ship-state', 'G');
    await page.fill('#ga-ship-zip', SHIP.zip);
    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_state && rec.sales.length === 0, 'a state that is not two letters: it asks for two');
    await page.fill('#ga-ship-state', 'ga');
    await page.fill('#ga-ship-zip', '3053');
    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_zip && rec.sales.length === 0, 'a ZIP that is not five digits: it asks for five');
    await shot(page, 'gift-panel-address.png', false);
    await page.fill('#ga-ship-zip', SHIP.zip);
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm', { timeout: 5000 });
    const sent = rec.sales[0] || {};
    check(Object.keys(sent).sort().join() === 'email,giver_name,product,recipient_names,ship_to', 'POST /v1/gift/checkout carries the contract\'s fields and nothing else');
    check(!('deliver' in sent), 'the default, "Send the card to me": no deliver sent');
    check(sent.product === 'golden-arrow' && sent.email === BUYER.email && sent.giver_name === BUYER.giver && sent.recipient_names === BUYER.names, 'product, email, giver and their names as typed');
    check(JSON.stringify(sent.ship_to) === JSON.stringify(SHIP), 'ship_to {name, line1, line2, city, state, zip}, the state in capitals');
    const conf = await text(page, '#ga-buy .ga-confirm');
    check(has(conf, 'Total $2,000.00') && has(conf, PANEL.all_in), 'the purchase step shows the engine\'s all-in amount (' + (conf.match(/Total \$[\d,.]+/) || [''])[0] + ')');
    check(has(conf, 'For ' + BUYER.names) && has(conf, 'With love from ' + BUYER.giver), 'and the names as the card will read');
    check(has(conf, PANEL.confirm_mail + ' ' + SHIP.name), 'and where the printed card goes');
    check(has(conf, 'Your card goes to ' + BUYER.email + '. ' + PANEL.confirm_change), 'the buyer\'s own email, seen before paying: "Your card goes to ' + BUYER.email + '." with "Change"');
    check(!(await page.$('#ga-buy a[href*="stripe"]')), 'Stripe is reached by a button, never a link a tag could read');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await page.locator('#ga-buy .ga-confirm').scrollIntoViewIfNeeded();
    await shot(page, 'gift-purchase-step.png', false);

    await press(page, '#ga-buy .ga-inline');
    await page.waitForSelector('#ga-buy form');
    check(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'ga-email', '"Change": back to the form, the email field in focus');
    check(await page.inputValue('#ga-for') === BUYER.names && await page.inputValue('#ga-ship-zip') === SHIP.zip, 'back: everything typed is still there');
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm');
    check(rec.sales.length === 1, 'the same details again: the payment page already made, not a second');
    const dl = await dataLayer(page);
    await Promise.all([page.waitForURL(/checkout\.stripe\.com/, { timeout: 5000 }), press(page, '#ga-buy .ga-pay')]);
    check(rec.stripePages[0] === PAY_URL, 'pay: the buyer goes to the engine\'s Stripe page');
    await page.goto(BASE + '/gift/thanks?session_id=' + SESSION);
    await page.waitForSelector('[data-ga-thanks-lead]');
    check(await text(page, '[data-ga-thanks-lead]') === 'Your card is on its way to ' + BUYER.email + '.', 'back from Stripe: "Your card is on its way to ' + BUYER.email + '."');
    check(await text(page, '[data-ga-thanks-printed]') === 'Mick hand-writes your printed card and mails it to you.', 'the printed card ticked: "Mick hand-writes your printed card and mails it to you."');
    check(await page.evaluate(() => sessionStorage.getItem('ga_deliver') === null), 'shown once, then cleared from the tab');
    await until(async () => (await sold(page)).length > 0);
    const sale = await sold(page);
    const one = sale[0] || {};
    check(sale.length === 1 && one.event === 'gift_purchase' && Object.keys(one).sort().join() === 'currency,event,item,transaction_id,value',
      'the sale for Google Ads: one gift_purchase {event, value, currency, transaction_id, item}, never a purchase (the booking tag\'s event)');
    check(rec.solds.length >= 1 && rec.solds.every((x) => x === SESSION), 'counted only after the engine was asked about this session (GET /v1/gift/sold)');
    check(one.value === 2000 && one.currency === 'USD' && one.item === 'golden-arrow', 'its value the engine\'s paid amount, in dollars (2000), USD, the card the engine names (golden-arrow)');
    check(/^lf-[0-9a-f]{16}$/.test(String(one.transaction_id)) && !has(JSON.stringify(sale), SESSION), 'its transaction_id a one-way hash of the session, never the session (' + one.transaction_id + ')');
    leaks(rec, await dataLayer(page), 'the sale');
    const kept = await page.evaluate(() => localStorage.getItem('__ga_kept') || '');
    check(has(kept, BUYER.email) && !has(kept, BUYER.names) && !has(kept, 'Test Lane'), 'what was kept for it: the choice, the email and the printed tick, no names, no address');
    await page.reload();
    await page.waitForSelector('[data-ga-thanks-lead]');
    check(await text(page, '[data-ga-thanks-lead]') === 'Your card and its link are on their way by email.' && !has(await page.evaluate(() => document.body.innerText), BUYER.email), 'a refresh: the general lines, no email');
    await settle();
    check((await sold(page)).length === 0, 'a refresh: the sale is not counted twice');
    leaks(rec, dl, 'the purchase');
    await ctx.close();
  }

  console.log('/gift: "Email it to them on a day I choose"');
  {
    const { ctx, page, rec } = await open('gift-them', {});
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    check(await page.isChecked('#ga-deliver-me') && await page.evaluate(() => document.querySelector('.ga-them').hidden), '"Send the card to me" is the default; the rest stays folded');
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-deliver-them');
    check(!(await page.evaluate(() => document.querySelector('.ga-them').hidden)), '"Email it to them on a day I choose" opens their email, the day and hour, the picks and the note');
    const lk = await leaky(page, '#give');
    check(!lk.length, 'nothing marked hidden shows in the panel' + (lk.length ? ': ' + lk.join(', ') : ''));
    const dayAttrs = await page.evaluate(() => { const d = document.getElementById('ga-day'); return { min: d.min, max: d.max }; });
    const lastDay = (() => { const t = nowEastern().slice(0, 10); const d = new Date(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10)); d.setMonth(d.getMonth() + 12); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
    check(dayAttrs.min === nowEastern().slice(0, 10) && dayAttrs.max === lastDay, 'the day: from today (Eastern) to twelve months ahead (' + dayAttrs.min + ' to ' + dayAttrs.max + ')');
    const picks = await page.evaluate(() => [...document.querySelectorAll('.ga-pick')].map((b) => b.textContent));
    check(picks.join(' | ') === PANEL.pick_christmas + ' | ' + PANEL.pick_valentine, 'the quick picks: ' + picks.join(', '));
    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_their_email && rec.sales.length === 0, 'no email for them: it asks');
    await page.fill('#ga-their-email', THEM);
    await page.fill('#ga-day', '2099-01-01');
    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_day && rec.sales.length === 0, 'a day past twelve months: it asks for one within');
    await page.fill('#ga-day', nowEastern().slice(0, 10));
    await page.selectOption('#ga-hour', '0');
    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-error') === PANEL.need_future && rec.sales.length === 0, 'an hour already gone: it asks for one to come');
    await press(page, '.ga-pick[data-pick="christmas"]');
    const xmas = nextMorning('12-25');
    check(await page.inputValue('#ga-day') === xmas.slice(0, 10) && await page.inputValue('#ga-hour') === '7' &&
      await page.getAttribute('.ga-pick[data-pick="christmas"]', 'aria-pressed') === 'true', '"Christmas morning, 7 AM" sets ' + xmas);
    await page.fill('#ga-note', NOTE);
    check(await text(page, '#ga-note-count') === NOTE.length + ' of 500', 'the note\'s live count (' + (await text(page, '#ga-note-count')) + ')');
    await page.fill('#ga-note', 'x'.repeat(600));
    check((await page.inputValue('#ga-note')).length === 500 && await text(page, '#ga-note-count') === '500 of 500', 'five hundred characters at most');
    await page.fill('#ga-note', NOTE);
    const labelled = await page.evaluate(() => [...document.querySelectorAll('#ga-buy input, #ga-buy select, #ga-buy textarea')]
      .filter((n) => !(n.labels && n.labels.length) && !n.getAttribute('aria-label')).map((n) => n.id || n.name));
    await press(page, '#ga-mail');
    check(await page.evaluate(() => { const b = document.getElementById('ga-mail'), h = document.getElementById('ga-mail-hint');
      return !!h && b.getAttribute('aria-describedby') === 'ga-mail-hint' && h.textContent; }) === PANEL.mail_hint, 'next to "Mail me the printed card as well": "' + PANEL.mail_hint + '"');
    const labelled2 = await page.evaluate(() => [...document.querySelectorAll('#ga-buy input, #ga-buy select, #ga-buy textarea')]
      .filter((n) => !(n.labels && n.labels.length) && !n.getAttribute('aria-label')).map((n) => n.id || n.name));
    check(!labelled.length && !labelled2.length, 'every field has its label' + (labelled.concat(labelled2).length ? ': ' + labelled.concat(labelled2).join(', ') : ''));
    const cov = await covered(page, '#give');
    check(!cov.length, 'no fixed element over any field or button of the panel at 390' + (cov.length ? ': ' + cov.join('; ') : ''));
    const r = await rings(page, '#ga-buy');
    check(r.stops.length >= 15 && !r.bad.length, 'every keyboard stop shows its ring (' + r.stops.length + ' stops' + (r.bad.length ? '; none on ' + r.bad.join(', ') : '') + ')');
    await press(page, '#ga-mail');
    await page.locator('.ga-deliver').scrollIntoViewIfNeeded();
    await shot(page, 'gift-deliver-them.png', false);
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm', { timeout: 5000 });
    const d = (rec.sales[0] || {}).deliver || {};
    check(JSON.stringify(d) === JSON.stringify({ email: THEM, date: xmas.slice(0, 10), hour: 7, message: NOTE }), 'deliver {email, date: "' + xmas.slice(0, 10) + '", hour: 7, message}');
    const conf = await text(page, '#ga-buy .ga-confirm');
    check(has(conf, 'We will email it to ' + THEM + ' on Christmas morning at 7 AM.') && has(conf, 'sleep late'), 'the purchase step reads it back: Christmas morning at 7 AM, and the note');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await page.locator('#ga-buy .ga-confirm').scrollIntoViewIfNeeded();
    await shot(page, 'gift-purchase-them.png', false);
    const covC = await covered(page, '#give');
    check(!covC.length, 'nor over the purchase step' + (covC.length ? ': ' + covC.join('; ') : ''));
    const confRings = await rings(page, '#ga-buy');
    check(!confRings.bad.length && confRings.stops.length >= 2, 'the purchase step\'s buttons show their rings too');
    const dl = await dataLayer(page);
    await Promise.all([page.waitForURL(/checkout\.stripe\.com/, { timeout: 5000 }), press(page, '#ga-buy .ga-pay')]);
    await page.goto(BASE + '/gift/thanks?session_id=' + SESSION);
    await page.waitForSelector('[data-ga-thanks-lead]');
    check(await text(page, '[data-ga-thanks-lead]') === 'We\u2019ll email it to them on Christmas morning at 7 AM.', 'the thank-you: "We\'ll email it to them on Christmas morning at 7 AM."');
    check(await text(page, '[data-ga-thanks-you]') === 'We have written to you at ' + BUYER.email + ', with a link to change the day.' &&
      await page.evaluate(() => document.querySelector('[data-ga-thanks-printed]').hidden), 'where the buyer\'s letter went; no printed line when none was asked for');
    const kept2 = await page.evaluate(() => localStorage.getItem('__ga_kept') || '');
    check(!has(kept2, 'sleep') && !has(kept2, THEM) && await page.evaluate(() => sessionStorage.getItem('ga_deliver') === null), 'never the note or their email in it, and cleared once shown');
    const covT = await covered(page, '#ga-thanks');
    check(!covT.length, 'no fixed element over the thank-you\'s links' + (covT.length ? ': ' + covT.join('; ') : ''));
    await shot(page, 'gift-thanks-them.png');
    leaks(rec, dl, 'to them');
    await ctx.close();
  }

  console.log('/gift: "a day I choose" while the engine\'s delivery door is off');
  {
    const { ctx, page, rec } = await open('gift-no-delivery', { delivery: 'off' });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    check(!(await page.$('#ga-deliver-them')) && !(await page.$('.ga-deliver')), 'gift_delivery false: the choice is not offered, the card goes to the buyer');
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm', { timeout: 5000 });
    check(rec.sales.length === 1 && !('deliver' in rec.sales[0]), 'and nothing about a day is sent');
    await ctx.close();
  }

  // Where the sale came from (loxley-rescue forge/gift-counts): the visit's own entry, js/funnel.js
  // gh_entry in this tab, rides the checkout as src and referrer; the engine keeps only its class.
  console.log('/gift: the visit\'s own source rides the checkout');
  {
    const { ctx, page, rec } = await open('gift-src-ad', {});
    // A Google ad click: it lands on the home page from google.com with a click id, then goes to /gift.
    await page.goto(BASE + '/?gclid=test-click-1', { referer: 'https://google.com/' });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    const entry = await page.evaluate(() => sessionStorage.getItem('gh_entry'));
    check(entry === JSON.stringify({ referrer: 'google.com', src: 'google-ads' }), 'the visit\'s entry: gh_entry {src: "google-ads", referrer: "google.com"} (' + entry + ')');
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm', { timeout: 5000 });
    const sent = rec.sales[0] || {};
    check(sent.src === 'google-ads' && sent.referrer === 'google.com', 'POST /v1/gift/checkout carries src "google-ads" and referrer "google.com"');
    check(Object.keys(sent).sort().join() === 'email,giver_name,product,recipient_names,referrer,src' && sent.product === 'golden-arrow' && sent.email === BUYER.email,
      'and the rest of the body as before: no attribution, no click id');
    check(!has(JSON.stringify(sent), 'test-click'), 'the click id itself never sent');
    await ctx.close();
  }
  for (const [what, stored] of [['no entry', null], ['a broken entry', '{not json']]) {
    const { ctx, page, rec } = await open('gift-src-none', {});
    await page.goto(BASE + '/gift');
    // The long-lived attribution (js/gatehouse.js gh_attr, the old loxley_attribution) is there, and never read.
    await page.evaluate(() => {
      localStorage.setItem('gh_attr', JSON.stringify({ src: 'instagram', referrer: 'https://instagram.com/', gclid: 'old-click' }));
      localStorage.setItem('loxley_attribution', JSON.stringify({ gclid: 'old-click' }));
    });
    await page.reload();
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    await page.evaluate((s) => { if (s === null) sessionStorage.removeItem('gh_entry'); else sessionStorage.setItem('gh_entry', s); }, stored);
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm', { timeout: 5000 });
    const sent = rec.sales[0] || {};
    check(rec.sales.length === 1 && Object.keys(sent).sort().join() === 'email,giver_name,product,recipient_names',
      what + ': neither src nor referrer sent, and the sale still starts');
    check(!has(JSON.stringify(sent), 'instagram') && !has(JSON.stringify(sent), 'old-click'), what + ': never the long-lived attribution (gh_attr, loxley_attribution)');
    await ctx.close();
  }

  // ------------------------------------------------- /gift in its sizes (js/gift.js SIZES, in shadow)
  console.log('/gift in its sizes (js/gift.js SIZES, in shadow): the switch, and shipped');
  check((GIFT_JS.match(/var SIZES = (true|false);/g) || []).length === 1 && has(GIFT_JS, SIZES_SWITCH), 'the switch is one line, SIZES false as shipped');
  check(PANEL.size_legend === 'How many nights?' && !!PANEL.need_size && !/\d/.test(PANEL.size_legend + PANEL.need_size), 'the chooser\'s two lines are in the page\'s words (the Writer\'s, for Mick\'s ear), no digit in them');
  {
    const { ctx, page, rec } = await open('gift-sizes-shipped', { sizes: ['golden-arrow', 'golden-arrow-1', 'golden-arrow-2'], sizesList: SIZES_ALL });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    await settle();
    check(!rec.sizesReads && !(await page.$('.ga-sizes')) && !(await page.$('.ga-chosen')), 'shipped (SIZES false), three sizes open: the sizes never asked for, the 3-night form as today');
    await ctx.close();
  }

  console.log('/gift in its sizes, the switch on: the 3-night alone, as today');
  {
    const { ctx, page, rec } = await open('gift-sizes-one', { sizesOn: true, sizes: ['golden-arrow'], sizesList: [SIZE_3] });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    check(rec.sizesReads === 1 && !(await page.$('.ga-sizes')) && !(await page.$('.ga-chosen')), 'the engine lists the 3-night alone: the sizes read once, no choice to make, the form as today');
    check(!/\$\s?\d/.test(await page.evaluate(() => document.body.innerText)), 'no amount on the page before the purchase step');
    check(await text(page, '.ga-terms-line') === RATIFIED && await text(page, '[data-ga-when]') === RATIFIED, 'the card\'s words under the panel and in the "When" row as they were');
    check(await text(page, '#ga-what-h') === 'Nights in the trees' && has(await page.evaluate(() => document.querySelector('.lf-lead').innerText), 'Nights in the treehouse'), 'the page as built with SIZES on: "Nights in the trees", the lead that fits every size');
    await ctx.close();
  }

  console.log('/gift in its sizes, the switch on: three sizes');
  {
    const { ctx, page, rec } = await open('gift-sizes-three', { sizesOn: true, sizes: ['golden-arrow', 'golden-arrow-1', 'golden-arrow-2'], sizesList: SIZES_ALL });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-sizes', { timeout: 10000 });
    const cards = await page.evaluate(() => [...document.querySelectorAll('.ga-size')].map((l) => ({
      product: l.querySelector('input').value, disabled: l.querySelector('input').disabled, front: l.querySelector('img') ? l.querySelector('img').getAttribute('src') : '',
      name: l.querySelector('.ga-size__name').textContent, price: l.querySelector('.ga-size__price') ? l.querySelector('.ga-size__price').textContent : '',
      terms: l.querySelector('.ga-size__terms').textContent, out: l.querySelector('.ga-size__out') ? l.querySelector('.ga-size__out').textContent : '' })));
    check(rec.sizesReads === 1 && rec.health === 1, 'the sizes and health each read once');
    check(await text(page, '.ga-sizes legend') === PANEL.size_legend, 'the legend: "' + PANEL.size_legend + '"');
    check(cards.map((c) => c.product).join() === 'golden-arrow-1,golden-arrow-2,golden-arrow', 'three cards in nights order, whatever order the engine listed them');
    check(cards.map((c) => c.front).join() === '/images/gift/golden-arrow-card-front-1-night.jpg,/images/gift/golden-arrow-card-front-2-nights.jpg,/images/gift/golden-arrow-card-front.jpg', 'each with its own front');
    check(cards.map((c) => c.name).join('|') === 'A gift of a night in the trees|A gift of two nights in the trees|A gift of three nights in the trees', 'each with its own line, the engine\'s');
    check(cards.map((c) => c.price.replace(/\s+/g, ' ').trim()).join('|') === '$753.20 ' + PANEL.all_in + '|$1,506.40 ' + PANEL.all_in + '|$2,000.00 ' + PANEL.all_in, 'each price the engine\'s, all in (' + cards.map((c) => c.price.replace(/\s+/g, ' ').trim()).join(', ') + ')');
    check(cards[0].terms === TERMS_1 && cards[1].terms === TERMS_2 && cards[2].terms === RATIFIED, 'each with its terms in the card\'s own words, the engine\'s');
    check(cards.every((c) => !c.disabled && !c.out), 'all three buyable');
    check(await text(page, '[data-ga-when]') === WHEN_SIZES, 'all three on sale: the "When" row reads the one sentence for every size');
    check(await page.evaluate(() => document.querySelector('.ga-terms-line').hidden), 'the 3-night terms line under the panel steps aside while the choice is open');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await page.locator('#ga-buy').scrollIntoViewIfNeeded();
    await shot(page, 'gift-sizes.png', false);
    await press(page, '#ga-buy button[type=submit]');
    check(await text(page, '#ga-size-error') === PANEL.need_size && rec.sales.length === 0, 'Continue with no choice: it asks for one, sends nothing');
    const sampleOf = (page) => page.evaluate(() => { const c = document.querySelector('.ga-show .ga-card'); const q = (s) => c.querySelector(s).innerText; const g = c.querySelector('.ga-gift'); return { sub: q('.ga-subtitle'), gift: g.hidden ? null : g.innerText, nights: q('.ga-nights') }; });
    await press(page, 'label[for="ga-size-golden-arrow-2"]');
    const s2 = await sampleOf(page);
    check(s2.sub === 'A gift of two nights in the trees' && s2.gift === null && s2.nights === TERMS_2, 'the sample card above shows the two-night card: its line and terms the engine\'s, no gift line until Mick hears the Writer\'s');
    await press(page, 'label[for="ga-size-golden-arrow"]');
    const s3 = await sampleOf(page);
    check(s3.sub === 'A gift of three nights in the trees' && s3.gift === RATIFIED_GIFT && s3.nights === RATIFIED, 'the three-night chosen again: the sample card back to its ratified lines');
    await press(page, 'label[for="ga-size-golden-arrow-2"]');
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy form .ga-chosen', { timeout: 5000 });
    check(await text(page, '.ga-chosen') === 'A gift of two nights in the trees $1,506.40 ' + PANEL.all_in + ' ' + PANEL.confirm_change, 'the two-night card chosen: its line and price above the names, with "Change"');
    check(await text(page, '.ga-terms-line') === TERMS_2 && !(await page.evaluate(() => document.querySelector('.ga-terms-line').hidden)), 'the words under the panel are now the two-night card\'s');
    await press(page, '.ga-chosen .ga-inline');
    await page.waitForSelector('#ga-buy .ga-sizes');
    check(await page.evaluate(() => document.querySelector('#ga-size-golden-arrow-2').checked), '"Change": back to the choice, the two-night card still chosen');
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy form .ga-chosen');
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-confirm', { timeout: 5000 });
    const sent = rec.sales[0] || {};
    check(sent.product === 'golden-arrow-2' && Object.keys(sent).sort().join() === 'email,giver_name,product,recipient_names', 'POST /v1/gift/checkout asks for golden-arrow-2, nothing else new');
    const conf = await text(page, '#ga-buy .ga-confirm');
    check(has(conf, 'A gift of two nights in the trees') && has(conf, 'Total $1,506.40'), 'the purchase step names the size and shows the engine\'s amount for it');
    await page.locator('#ga-buy .ga-confirm').scrollIntoViewIfNeeded();
    await shot(page, 'gift-sizes-purchase-step.png', false);
    await Promise.all([page.waitForURL(/checkout\.stripe\.com/, { timeout: 5000 }), press(page, '#ga-buy .ga-pay')]);
    check(rec.stripePages.length === 1, 'Pay: on to Stripe');
    await page.goto(BASE + '/gift/thanks?session_id=' + SESSION);
    await page.waitForSelector('h1');
    await until(async () => (await sold(page)).length > 0);
    const bought = await sold(page);
    check(bought.length === 1 && bought[0].item === 'golden-arrow-2' && bought[0].value === 1506.4, 'the thank-you counts the sale as the size bought (item golden-arrow-2), at the engine\'s paid amount');
    leaks(rec, await dataLayer(page), 'the sizes');
    await ctx.close();
  }

  console.log('/gift in its sizes, the switch on: a size at the season\'s cap');
  {
    const list = [SIZE_1, SIZE_2, Object.assign({}, SIZE_3, { sold_out: true, sentence: FEWER })];
    const { ctx, page, rec } = await open('gift-sizes-cap', { sizesOn: true, sizes: ['golden-arrow-1', 'golden-arrow-2'], sizesList: list });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-sizes', { timeout: 10000 });
    check(rec.healthSaid.gift_sales === false && rec.healthSaid.gift_sizes.join() === 'golden-arrow-1,golden-arrow-2', 'the engine\'s own pair at the 3-night\'s cap: health says gift_sales false and names the two shorter sizes (the Critic, 2026-11-08)');
    check(rec.sizesReads === 1 && !(await page.$('#ga-buy .ga-panel')), 'and the page still reads the sizes and offers the choice, not "can\'t be bought online just yet"');
    const c3 = await page.evaluate(() => { const l = document.querySelector('label[for="ga-size-golden-arrow"]'); const i = l.querySelector('input'); return { disabled: i.disabled, described: i.getAttribute('aria-describedby'), out: l.querySelector('.ga-size__out').textContent, outId: l.querySelector('.ga-size__out').id, price: !!l.querySelector('.ga-size__price'), cls: l.className }; });
    check(c3.disabled && c3.out === FEWER && !c3.price && /ga-size--out/.test(c3.cls), 'the 3-night at the cap: the engine\'s sentence ("A shorter one is still open"), no price, no tap');
    check(c3.described === 'ga-size-golden-arrow-terms ga-size-golden-arrow-out' && c3.outId === 'ga-size-golden-arrow-out', 'the sentence is named to a screen reader with the terms');
    check(await text(page, '[data-ga-when]') === RATIFIED, 'not all three sell: the "When" row keeps the card\'s ratified words');
    await press(page, 'label[for="ga-size-golden-arrow"]');
    check(!(await page.evaluate(() => document.querySelector('#ga-size-golden-arrow').checked)), 'a tap on it chooses nothing');
    check(await page.evaluate(() => document.querySelectorAll('.ga-size input:not([disabled])').length) === 2, 'the two shorter cards stay buyable');
    await page.locator('#ga-buy').scrollIntoViewIfNeeded();
    await shot(page, 'gift-sizes-cap.png', false);
    await ctx.close();
    // health names fewer sizes than the list: a size health does not name is not buyable, and with no sentence it is not shown
    const two = await open('gift-sizes-unnamed', { sizesOn: true, sizes: ['golden-arrow'], sizesList: SIZES_ALL });
    await two.page.goto(BASE + '/gift');
    await two.page.waitForSelector('#ga-buy form', { timeout: 10000 });
    check(!(await two.page.$('.ga-sizes')), 'health names the 3-night alone: the other two are not shown, the form as today');
    await two.ctx.close();
    // the 3-night at its cap and the sizes read failing: the page as it was, the call-or-text panel
    const three = await open('gift-sizes-cap-noread', { sizesOn: true, sizes: ['golden-arrow-1', 'golden-arrow-2'], sizesList: list, sizesRoute: 'down' });
    await three.page.goto(BASE + '/gift');
    await three.page.waitForSelector('#ga-buy .ga-panel', { timeout: 10000 });
    check(await text(three.page, '#ga-buy .ga-panel__lead') === PANEL.off && !(await three.page.$('#ga-buy form')), 'the 3-night at the cap and the sizes unreachable: the page as it was, call or text Mick, no form');
    await three.ctx.close();
    // the sales door off: health says gift_sales false and names nothing; closed, the sizes never asked for
    const four = await open('gift-sizes-door-off', { sizesOn: true, sales: 'off', sizesList: SIZES_ALL });
    await four.page.goto(BASE + '/gift');
    await four.page.waitForSelector('#ga-buy .ga-panel', { timeout: 10000 });
    await settle();
    check(await text(four.page, '#ga-buy .ga-panel__lead') === PANEL.off && !four.rec.sizesReads, 'the sales door off: closed as today, the sizes never asked for');
    await four.ctx.close();
    // a size the page has no front for yet: its words take the card's width
    const five = await open('gift-sizes-noart', { sizesOn: true, sizes: ['golden-arrow', 'golden-arrow-9'], sizesList: [SIZE_3, Object.assign({}, SIZE_2, { product: 'golden-arrow-9', nights: 9, subtitle: 'A made-up size' })] });
    await five.page.goto(BASE + '/gift');
    await five.page.waitForSelector('#ga-buy .ga-sizes', { timeout: 10000 });
    const noart = await five.page.evaluate(() => { const l = document.querySelector('label[for="ga-size-golden-arrow-9"]'); const t = l.querySelector('.ga-size__text').getBoundingClientRect(); return { cls: l.className, img: !!l.querySelector('img'), textLeft: t.left - l.getBoundingClientRect().left, textWidth: t.width, cardWidth: l.getBoundingClientRect().width }; });
    check(!noart.img && /ga-size--noart/.test(noart.cls) && noart.textLeft < 30 && noart.textWidth > noart.cardWidth * 0.8, 'a size with no front yet: no picture, its words across the card (' + Math.round(noart.textWidth) + ' of ' + Math.round(noart.cardWidth) + ' px)');
    check(await overflow(five.page) <= 0, 'no sideways scroll at 390');
    await five.ctx.close();
  }

  console.log('/gift: the engine\'s price above the names (js/gift.js PRICE, in shadow)');
  check((GIFT_JS.match(/var PRICE = (true|false);/g) || []).length === 1 && has(GIFT_JS, PRICE_SWITCH), 'the PRICE switch is one line, false as shipped (it reverses Mick\'s rule of 2026-10-19; his yes first)');
  {
    const one = await open('gift-price', { priceOn: true, sizes: ['golden-arrow'], sizesList: [SIZE_3] });
    await one.page.goto(BASE + '/gift');
    await one.page.waitForSelector('#ga-buy form', { timeout: 10000 });
    const formFirst = !(await one.page.$('#ga-buy form .ga-price'));   // the form never waits on the sizes read (the Critic)
    await one.page.waitForSelector('#ga-buy form .ga-price', { timeout: 5000 });
    const pl = await text(one.page, '#ga-buy form .ga-price');
    check(one.rec.sizesReads === 1 && pl === '$2,000.00 ' + PANEL.all_in, 'PRICE on, the 3-night alone: the engine\'s price above the names, "' + pl + '", from one read of the sizes' + (formFirst ? ' (the form first, the price joining it)' : ''));
    check(await one.page.evaluate(() => { const f = document.querySelector('#ga-buy form'); return f.firstElementChild.className === 'ga-price' && !!f.querySelector('#ga-for'); }), 'the line stands first, the names below it');
    const prose = await one.page.evaluate(() => document.querySelector('main').innerText.replace(document.querySelector('#ga-buy').innerText, ''));
    check(!/\$\s?\d/.test(prose), 'no amount anywhere else on the page');
    await one.page.locator('#ga-buy').scrollIntoViewIfNeeded();
    await shot(one.page, 'gift-price.png', false);
    await one.ctx.close();
    for (const [what, engine] of [['answers 404', { sizesRoute: 'off' }], ['is unreachable', { sizesRoute: 'down' }], ['lists the 3-night at its cap', { sizes: [], sizesList: [Object.assign({}, SIZE_3, { sold_out: true, sentence: SOLD })] }]]) {
      const c = await open('gift-price-silent', Object.assign({ priceOn: true }, engine));
      await c.page.goto(BASE + '/gift');
      await c.page.waitForSelector('#ga-buy form, #ga-buy .ga-panel', { timeout: 10000 });
      await settle();
      check(!(await c.page.$('.ga-price')), 'the sizes read ' + what + ': no price shown, the page as it was');
      await c.ctx.close();
    }
    // with the sizes on too, the chooser carries the prices and no line doubles them; the 3-night alone keeps the line
    const both = await open('gift-price-sizes', { priceOn: true, sizesOn: true, sizes: ['golden-arrow', 'golden-arrow-1', 'golden-arrow-2'], sizesList: SIZES_ALL });
    await both.page.goto(BASE + '/gift');
    await both.page.waitForSelector('#ga-buy .ga-sizes', { timeout: 10000 });
    check(!(await both.page.$('.ga-price')), 'PRICE and SIZES on, three sizes: the cards carry the prices, no line above');
    await press(both.page, 'label[for="ga-size-golden-arrow-2"]'); await press(both.page, '#ga-buy button[type=submit]');
    await both.page.waitForSelector('#ga-buy form .ga-chosen', { timeout: 5000 });
    check(!(await both.page.$('.ga-price')), 'a size chosen: its own line carries the price, no second line');
    await both.ctx.close();
  }

  console.log('/gift in its sizes, the switch on: the sizes read fails');
  {
    // a listed size that sends terms "" (none of its own, main ac3bb9a) is still offered, without a terms line
    const { ctx, page } = await open('gift-sizes-noterms', { sizesOn: true, sizes: ['golden-arrow', 'golden-arrow-2'], sizesList: [SIZE_3, Object.assign({}, SIZE_2, { terms: '' })] });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy .ga-sizes', { timeout: 10000 });
    const nt = await page.evaluate(() => { const l = document.querySelector('label[for="ga-size-golden-arrow-2"]'); return { there: !!l, terms: !!l.querySelector('.ga-size__terms'), price: (l.querySelector('.ga-size__price') || {}).textContent || '' }; });
    check(nt.there && !nt.terms && /\$1,506\.40/.test(nt.price), 'a size the engine lists with terms "": offered with its price, no terms line, nothing borrowed');
    await press(page, 'label[for="ga-size-golden-arrow-2"]');
    check(await page.evaluate(() => document.querySelector('.ga-terms-line').hidden && document.querySelector('.ga-show .ga-nights').hidden), 'chosen: the terms line under the panel and the sample card\'s stay hidden, not the three-night\'s words');
    await ctx.close();
  }
  for (const [what, engine] of [['answers 404 (the route not there)', { sizesRoute: 'off' }], ['is unreachable', { sizesRoute: 'down' }],
    ['answers something that is not the shape', { sizesAnswer: { nope: 1 } }], ['lists a size with no price', { sizesList: [Object.assign({}, SIZE_2, { price_cents: null })] }]]) {
    const { ctx, page, rec } = await open('gift-sizes-fail', Object.assign({ sizesOn: true, sizes: ['golden-arrow', 'golden-arrow-2'] }, engine));
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    check(!(await page.$('.ga-sizes')) && !(await page.$('.ga-chosen')) && rec.sales.length === 0, 'the sizes read ' + what + ': the page as it was, the 3-night form');
    await ctx.close();
  }

  console.log('/gift: spoken for this season (409)');
  {
    const { ctx, page, rec } = await open('gift-sold', { soldOut: true });
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-buy button[type=submit]');
    await page.waitForSelector('#ga-buy .ga-panel', { timeout: 5000 });
    check(await text(page, '#ga-buy .ga-panel__lead') === SOLD && !(await page.$('#ga-buy form')) && !(await page.$('#ga-buy .ga-confirm')) && rec.sales.length === 1,
      'the engine\'s sentence, as is, in place of the panel');
    check(await page.evaluate(() => document.querySelector('.ga-give__lead').hidden), 'and the line promising a price steps aside');
    await page.locator('#give').scrollIntoViewIfNeeded();
    await shot(page, 'gift-sold-out.png', false);
    await ctx.close();
  }

  console.log('/gift: the engine refuses, or answers with something that is not Stripe');
  for (const [what, engine, want] of [
    ['payments unavailable (503): the engine\'s sentence as it wrote it', { sale503: true }, PAY_503 + ' ' + PANEL.questions],
    ['not a Stripe page: refused', { checkoutUrl: 'https://evil.example/pay' }, PANEL.no_payment],
  ]) {
    const { ctx, page, rec } = await open('gift-refused', engine);
    await page.goto(BASE + '/gift');
    await page.waitForSelector('#ga-buy form', { timeout: 10000 });
    await page.fill('#ga-for', BUYER.names); await page.fill('#ga-from', BUYER.giver); await page.fill('#ga-email', BUYER.email);
    await press(page, '#ga-buy button[type=submit]');
    await until(async () => (await text(page, '#ga-error')) === want);
    check(await text(page, '#ga-error') === want && !(await page.$('#ga-buy .ga-confirm')), what);
    if (engine.sale503) check(Object.keys(rec.sales[0] || {}).sort().join() === 'email,giver_name,product,recipient_names', 'no box ticked: no ship_to sent');
    await ctx.close();
  }

  // ---------------------------------------------------------- /gift/thanks
  console.log('/gift/thanks?session_id=: where Stripe returns the buyer');
  {
    const { ctx, page, rec } = await open('thanks', {});
    await page.goto(BASE + '/gift/thanks?session_id=' + SESSION);
    await page.waitForSelector('h1');
    check(!has(page.url(), SESSION) && new URL(page.url()).pathname === '/gift/thanks', 'the payment session is out of the address bar');
    const t = await page.evaluate(() => document.querySelector('main').innerText.replace(/\s+/g, ' '));
    check(has(t, 'Thank you.') && has(t, 'Your card and its link are on their way by email.') && has(t, '706-502-4823'), 'a thank-you, the card and its link by email, Mick\'s number');
    await until(async () => (await sold(page)).length > 0);
    const bare = await sold(page);
    check(bare.length === 1 && bare[0].event === 'gift_purchase' && bare[0].value === 2000 && /^lf-[0-9a-f]{16}$/.test(String(bare[0].transaction_id)),
      'no purchase step in this tab: the engine\'s paid answer alone counts the sale, at its amount');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    leaks(rec, await dataLayer(page), 'the thank-you');
    await shot(page, 'gift-thanks.png');
    for (const [q, what] of [['', 'no session'], ['?session_id=not-a-stripe-session', 'a session that is not Stripe\'s']]) {
      const asked = rec.solds.length;
      await page.goto(BASE + '/gift/thanks' + q);
      await page.waitForSelector('h1');
      await settle();
      check((await sold(page)).length === 0 && rec.solds.length === asked, 'the thank-you with ' + what + ': the engine not asked, no sale counted');
    }
    await ctx.close();
  }
  for (const [what, engine] of [['paid false (a bank payment still clearing)', { sold: 'unpaid' }], ['404 (not a gift session)', { sold: 'none' }], ['nothing (unreachable)', { down: true }]]) {
    const { ctx, page, rec } = await open('thanks-unpaid', engine);
    await page.goto(BASE + '/gift/thanks?session_id=' + SESSION);
    await page.waitForSelector('h1');
    await until(async () => engine.down || rec.solds.length > 0, 30);
    await settle();
    check((await sold(page)).length === 0 && (engine.down || rec.solds[0] === SESSION), 'the engine answers ' + what + ': nothing pushed');
    await ctx.close();
  }

  // ------------------------------------------------------------- /gift/card
  console.log('/gift/card#code=: the card');
  {
    const { ctx, page, rec } = await open('card', {});
    await page.goto(BASE + '/gift/card#code=' + CODE);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const rv = await page.evaluate(() => {
      const card = document.querySelector('.ga-card'), door = getComputedStyle(document.querySelector('.ga-arch'), '::after');
      const no = document.querySelector('.ga-giftno');
      return { opening: card.classList.contains('is-opening'), dur: parseFloat(door.animationDuration) + parseFloat(door.animationDelay),
        no: getComputedStyle(no).opacity === '1' && !no.hidden && no.getBoundingClientRect().height > 0 };
    });
    check(rv.opening && rv.dur > 0 && rv.dur < 1, 'first open: the arch\'s doors part onto the photo, under a second (' + rv.dur + ' s)');
    check(rv.no, 'the gift number shows throughout');
    await page.waitForTimeout(1300);
    check(!(await page.evaluate(() => document.querySelector('.ga-card').classList.contains('is-opening'))), 'and then it is done');
    await page.evaluate(() => document.fonts.ready);
    const url = new URL(page.url());
    check(!has(page.url(), CODE) && url.pathname === '/gift/card', 'the code is out of the address bar (' + url.pathname + url.hash + ')');
    check(await page.evaluate((c) => window.__ghKeys.code === c, CODE), 'and kept for the page');
    check(rec.lookups.length === 1 && rec.lookups[0] === CODE, 'GET /v1/gift asked once, with the code, of our own server');
    const c = await page.evaluate(() => {
      const q = (s) => (document.querySelector(s) || {}).innerText;
      return { forL: q('.ga-for'), fromL: q('.ga-from'), no: q('.ga-giftno'), gift: q('.ga-gift'), nights: q('.ga-nights'), call: q('.ga-call'),
        title: q('.ga-title'), sub: q('.ga-subtitle'), dates: !document.querySelector('[data-ga-dates]').hidden, keep: !document.querySelector('[data-ga-keep]').hidden };
    });
    check(c.forL === 'For Ana & Luis' && c.fromL === 'With love from Aunt June', 'the names filled from the engine');
    check(/LF-TEST-7Q2X/.test(c.no || ''), 'its gift number, the code, as the card prints it (' + (c.no || '').trim() + ')');
    check(c.gift === RATIFIED_GIFT && c.nights === RATIFIED && c.title === 'The Golden Arrow' && c.sub === 'A gift of three nights in the trees', 'the card\'s ratified words, word for word');
    check(/^To choose your dates, call or text Mick at 706-502-4823\.$/.test(c.call || ''), 'and its call line');
    check(c.dates && c.keep, '"Book your nights" and the keep-it-close line for a gift not yet used');
    check(await text(page, '[data-ga-status]') === 'UNUSED, READY FOR THREE NIGHTS' || await label(page, '[data-ga-status]') === CARD_W.state_unused, 'the status line: "' + CARD_W.state_unused + '"');
    check(await label(page, '[data-ga-dates]') === CARD_W.choose_dates && await label(page, '[data-ga-print]') === CARD_W.print, 'the buttons: "' + CARD_W.choose_dates + '" and "' + CARD_W.print + '"');
    const m = await page.evaluate(() => { const b = document.querySelector('[data-ga-message]'); return { shown: !b.hidden, from: b.querySelector('[data-ga-message-from]').textContent, text: b.querySelector('[data-ga-message-text]').textContent }; });
    check(m.shown && m.from === 'A note from Aunt June' && m.text === NOTE, 'the note under the dedication, as it was written');
    const lay = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      return { callBottom: r('.ga-call').bottom, footTop: r('.ga-foot').top, side: document.querySelector('.ga-side').scrollHeight,
        arch: document.querySelector('.ga-arch').offsetHeight, w: r('.ga-card').width };
    });
    check(lay.callBottom <= lay.footTop && lay.side <= lay.arch + 1, 'nothing on the card runs into anything (' + Math.round(lay.w) + ' px wide)');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'card.png');
    if (SHOTS) await page.locator('.ga-card').screenshot({ path: path.join(SHOTS, 'card-only.png') });

    await press(page, '[data-ga-share]');
    const shared = await page.evaluate(() => window.__shared);
    check(shared && shared.url === BASE + '/gift/card#code=' + CODE, 'send the link: /gift/card#code=, through the share sheet');
    await press(page, '[data-ga-print]');
    check(await page.evaluate(() => window.__printed) === 1, 'print the card: the browser\'s print');
    await page.emulateMedia({ media: 'print' });
    const pr = await page.evaluate(() => {
      const vis = (s) => { const n = document.querySelector(s); return !!n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0; };
      return { hdr: vis('.lf-hdr'), foot: vis('.lf-foot'), actions: vis('.ga-actions'), card: vis('.ga-card'), fab: vis('.book-fab') };
    });
    check(pr.card && !pr.hdr && !pr.foot && !pr.actions && !pr.fab, 'printed: the card alone, no header, footer or buttons');
    const pdf = await page.pdf({ format: 'Letter', printBackground: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    check(pages === 1, 'printed on Letter, with its note: one page (' + pages + ')');
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, 'card-print.pdf'), pdf);
    await page.emulateMedia({ media: 'screen' });

    await page.reload();
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    check(await page.evaluate(() => document.querySelector('.ga-for').innerText) === 'For Ana & Luis', 'a refresh keeps the card');
    check(!(await page.evaluate(() => document.querySelector('.ga-card').classList.contains('is-opening'))), 'the second open: no reveal');
    const cr = await rings(page, '#ga-card-page');
    check(cr.stops.length >= 3 && !cr.bad.length, 'the card page\'s buttons show their rings (' + cr.stops.length + ' stops)');
    const lk = await leaky(page, '#ga-card-page');
    check(!lk.length, 'nothing marked hidden shows on the card page' + (lk.length ? ': ' + lk.join(', ') : ''));
    const covK = await covered(page, '#ga-card-page');
    check(!covK.length, 'no fixed element over the card page\'s buttons' + (covK.length ? ': ' + covK.join('; ') : ''));
    leaks(rec, await dataLayer(page), 'the card');

    await Promise.all([page.waitForURL(/\/book/, { timeout: 5000 }), press(page, '[data-ga-dates]')]);
    await page.waitForSelector('#gatehouse .gh-summary', { timeout: 10000 });
    check(!has(page.url(), CODE) && await page.evaluate((c) => window.__ghKeys.gift === c, CODE), '"Book your nights" opens /book with the gift, out of the address bar');
    check(await text(page, '#gatehouse .gh-gift') === BOOK_W.book_with, 'and /book says the Golden Arrow is with them');
    leaks(rec, await dataLayer(page), 'card to /book');
    await ctx.close();
  }

  console.log('/gift/card: a card of another size (the Chief, 2026-11-08: every Golden Arrow product accepted)');
  {
    const cardOf = (page) => page.evaluate(() => { const q = (s) => (document.querySelector(s) || {}).innerText; const g = document.querySelector('.ga-gift'), st = document.querySelector('[data-ga-status]');
      return { forL: q('.ga-for'), sub: q('.ga-subtitle'), gift: g.hidden ? null : g.innerText, nights: q('.ga-nights'), title: q('.ga-title'), status: st.hidden ? null : st.textContent, dates: !document.querySelector('[data-ga-dates]').hidden }; });
    const layoutOk = (page) => page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); return r('.ga-call').bottom <= r('.ga-foot').top && document.querySelector('.ga-side').scrollHeight <= document.querySelector('.ga-arch').offsetHeight + 1; });
    // shipped (both switches off): a two-night card opens with its own line and terms, the engine's; no gift line or status until Mick hears the Writer's
    const off = await open('card-two-shipped', {});
    await off.page.goto(BASE + '/gift/card#code=' + CODE_TWO);
    await off.page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    await off.page.evaluate(() => document.fonts.ready);
    const c0 = await cardOf(off.page);
    check(c0.forL === 'For Ana & Luis' && c0.title === 'The Golden Arrow' && c0.dates, 'shipped: a golden-arrow-2 card opens (no "could not find a gift"), the names filled, "Book your nights" offered');
    check(c0.sub === 'A gift of two nights in the trees' && c0.nights === TERMS_2, 'its own line and terms, the engine\'s (the printed card\'s words), never the three-night\'s');
    check(c0.gift === null && c0.status === null, 'no gift line and no status line until Mick hears the Writer\'s two (never "three nights")');
    check(await layoutOk(off.page), 'nothing on the two-night card runs into anything');
    await shot(off.page, 'card-two-nights.png');
    await off.ctx.close();
    // shipped: an older answer with the product alone: the site's copy of the printed card's words for one night
    const one = await open('card-one-shipped', {});
    await one.page.goto(BASE + '/gift/card#code=' + CODE_ONE);
    await one.page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const c1 = await cardOf(one.page);
    check(c1.sub === CARD_W.card_subtitle_1 && c1.nights === CARD_W.card_nights_1 && c1.gift === null && c1.status === null, 'an answer with the product alone (golden-arrow-1): the card\'s own words for one night by product, no gift line, no status');
    check(await layoutOk(one.page), 'nothing on the one-night card runs into anything');
    await one.ctx.close();
    // the engine sends terms "" (main ac3bb9a): a two-night gift with its own window shows the window's line, never the twelve-month words from the product
    const own = await open('card-two-own', {});
    await own.page.goto(BASE + '/gift/card#code=' + CODE_TWO_OWN);
    await own.page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const co = await cardOf(own.page);
    check(co.sub === 'A gift of two nights in the trees' && co.nights === OWN_LINE && !has(await own.page.evaluate(() => document.querySelector('.ga-card').innerText), 'twelve months'), 'a two-night gift with its own window: the window\'s dates line in the terms\' place, no twelve-month words');
    await own.ctx.close();
    // a size without its own words: terms "" and no window: no terms line at all, never filled from the product
    const bare = await open('card-two-bare', {});
    await bare.page.goto(BASE + '/gift/card#code=' + CODE_TWO_BARE);
    await bare.page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const cb = await bare.page.evaluate(() => { const n = document.querySelector('.ga-nights'); return { sub: document.querySelector('.ga-subtitle').innerText, hidden: n.hidden, text: n.textContent, all: document.querySelector('.ga-card').innerText }; });
    check(cb.sub === 'A gift of two nights in the trees' && cb.hidden && !has(cb.all, 'twelve months') && !has(cb.all, 'three nights'), 'terms sent empty, no window: no terms line, nothing borrowed from the product or the three-night card');
    check(await layoutOk(bare.page), 'and nothing on that card runs into anything');
    await bare.ctx.close();
    // SIZE_WORDS on (Mick has heard them): the Writer's gift line and status for each size
    const two = await open('card-two-words', { sizeWordsOn: true });
    await two.page.goto(BASE + '/gift/card#code=' + CODE_TWO);
    await two.page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    await two.page.evaluate(() => document.fonts.ready);
    const c2 = await cardOf(two.page);
    check(c2.sub === 'A gift of two nights in the trees' && c2.nights === TERMS_2 && c2.gift === CARD_W.card_gift_2, 'SIZE_WORDS on: the two-night card\'s gift line "' + CARD_W.card_gift_2 + '"');
    check(c2.status === CARD_W.state_unused_2, 'and its status "' + CARD_W.state_unused_2 + '"');
    check(await layoutOk(two.page), 'nothing on the card runs into anything with its gift line');
    await shot(two.page, 'card-two-nights-words.png');
    await two.ctx.close();
    const oneW = await open('card-one-words', { sizeWordsOn: true });
    await oneW.page.goto(BASE + '/gift/card#code=' + CODE_ONE);
    await oneW.page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const c1w = await cardOf(oneW.page);
    check(c1w.gift === CARD_W.card_gift_1 && c1w.status === CARD_W.state_unused_1, 'the one-night card: "' + CARD_W.card_gift_1 + '", "' + CARD_W.state_unused_1 + '"');
    await oneW.ctx.close();
    // the three-night card with both switches on: as it was
    const three = await open('card-three-on', { sizesOn: true, sizeWordsOn: true });
    await three.page.goto(BASE + '/gift/card#code=' + CODE);
    await three.page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const c3 = await cardOf(three.page);
    check(c3.sub === 'A gift of three nights in the trees' && c3.gift === RATIFIED_GIFT && c3.nights === RATIFIED && c3.status === CARD_W.state_unused, 'the three-night card, both switches on: its ratified words as they were');
    await three.ctx.close();
    // on /gift with both switches on, the sample card takes the Writer's gift line for the size chosen
    const both = await open('gift-sizes-words', { sizesOn: true, sizeWordsOn: true, sizes: ['golden-arrow', 'golden-arrow-1', 'golden-arrow-2'], sizesList: SIZES_ALL });
    await both.page.goto(BASE + '/gift');
    await both.page.waitForSelector('#ga-buy .ga-sizes', { timeout: 10000 });
    await press(both.page, 'label[for="ga-size-golden-arrow-1"]');
    const sw = await both.page.evaluate(() => { const c = document.querySelector('.ga-show .ga-card'); const g = c.querySelector('.ga-gift'); return { sub: c.querySelector('.ga-subtitle').innerText, gift: g.hidden ? null : g.innerText, nights: c.querySelector('.ga-nights').innerText }; });
    check(sw.sub === 'A gift of a night in the trees' && sw.gift === PANEL.card_gift_1 && sw.nights === TERMS_1, 'SIZE_WORDS on: the sample card shows the one-night card with its gift line "' + PANEL.card_gift_1 + '"');
    await both.ctx.close();
  }

  console.log('/gift/card: long names step down beside the photo');
  {
    const { ctx, page } = await open('card-long', {});
    await page.goto(BASE + '/gift/card#code=' + CODE_LONG);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const lay = await page.evaluate(() => {
      const card = document.querySelector('.ga-card');
      return { ns: card.style.getPropertyValue('--ns'), side: card.querySelector('.ga-side').scrollHeight, arch: card.querySelector('.ga-arch').offsetHeight,
        call: card.querySelector('.ga-call').getBoundingClientRect().bottom, foot: card.querySelector('.ga-foot').getBoundingClientRect().top };
    });
    check(+lay.ns > 0 && +lay.ns < 1 && lay.side <= lay.arch + 1 && lay.call <= lay.foot, 'the dedication steps down and fits beside the photo (names at ' + lay.ns + ')');
    await shot(page, 'card-long-names.png');
    await ctx.close();
  }

  console.log('/gift/card: reduced motion, and a gift booked or enjoyed');
  {
    const { ctx, page } = await open('card-still', { reducedMotion: true });
    await page.goto(BASE + '/gift/card#code=' + CODE);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    check(!(await page.evaluate(() => document.querySelector('.ga-card').classList.contains('is-opening'))), 'with reduced motion: no reveal on first open');
    await ctx.close();
  }
  for (const [code, want] of [[CODE_BOOKED, 'Booked for February 2027'], [CODE_USED, 'Enjoyed in March 2027']]) {
    const { ctx, page } = await open('card-state', {});
    await page.goto(BASE + '/gift/card#code=' + code);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const v = await page.evaluate(() => ({ status: document.querySelector('[data-ga-status]').textContent, dates: document.querySelector('[data-ga-dates]').hidden,
      keep: document.querySelector('[data-ga-keep]').hidden, msg: document.querySelector('[data-ga-message]').hidden }));
    check(v.status === want && v.dates && v.keep && v.msg, '"' + want + '": the card to keep, no "Book your nights", no note when none was written');
    if (code === CODE_BOOKED) await shot(page, 'card-booked.png');
    await ctx.close();
  }

  console.log('/gift/card: a gift with its own window (Mick, 2026-10-26)');
  for (const [code, line] of [[CODE_OWN, ''], [CODE_OWN_LINE, OWN_LINE]]) {
    const { ctx, page } = await open('card-own', {});
    await page.goto(BASE + '/gift/card#code=' + code);
    await page.waitForSelector('[data-ga-card]:not([hidden])', { timeout: 10000 });
    const v = await page.evaluate(() => {
      const n = document.querySelector('.ga-nights');
      return { shown: getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0, nights: n.textContent,
        card: document.querySelector('.ga-card').innerText, call: document.querySelector('.ga-call').innerText,
        dates: !document.querySelector('[data-ga-dates]').hidden };
    });
    const wrong = ['January 4', 'May 31', 'difference', 'Valentine'].filter((w) => v.card.indexOf(w) >= 0);
    check(!wrong.length, (line ? 'with its line' : 'its line not yet heard') + ': the card never says January to May or the difference (' + (wrong.join(', ') || 'none') + ')');
    check(line ? v.shown && v.nights === line : !v.shown, line ? 'the engine\'s dates line in the January-to-May line\'s place' : 'no dates line at all until Mick has heard its words');
    check(/^To choose your dates, call or text Mick at 706-502-4823\.$/.test(v.call || '') && v.dates, 'the call line and "Book your nights" stay');
    if (!line) await shot(page, 'card-own-window.png');
    await ctx.close();
  }

  console.log('/gift/card: lost your card?');
  {
    const { ctx, page, rec } = await open('card-lost', {});
    await page.goto(BASE + '/gift/card');
    await page.waitForSelector('[data-ga-lost]:not([hidden])', { timeout: 10000 });
    check(await text(page, '#ga-lost-h') === CARD_W.lost_h && await text(page, '[data-ga-note]') === CARD_W.card_none, 'no code: "' + CARD_W.lost_h + '"');
    const covL = await covered(page, '[data-ga-lost]');
    check(!covL.length, 'no fixed element over the lost-card form' + (covL.length ? ': ' + covL.join('; ') : ''));
    check(await page.evaluate(() => { const i = document.getElementById('ga-lost-email'); return !!(i.labels && i.labels.length); }), 'its field has its label');
    await press(page, '[data-ga-lost] button[type=submit]');
    check(await text(page, '#ga-lost-error') === CARD_W.lost_need && rec.resends.length === 0, 'empty: it asks, sends nothing');
    await page.fill('#ga-lost-email', 'lost@example.test');
    await press(page, '[data-ga-lost] button[type=submit]');
    await page.waitForSelector('[data-ga-lost-said]:not([hidden])', { timeout: 5000 });
    check(JSON.stringify(rec.resends[0]) === '{"email":"lost@example.test"}', 'POST /v1/gift/resend {email}');
    check(await text(page, '[data-ga-lost-said]') === RESEND, 'then the engine\'s one sentence, as it wrote it');
    check(await page.evaluate(() => { const b = document.querySelector('[data-ga-lost] button[type=submit]'); return getComputedStyle(b).display === 'none'; }), 'and the button steps aside');
    const lk = await leaky(page, '#ga-card-page');
    check(!lk.length, 'nothing marked hidden shows' + (lk.length ? ': ' + lk.join(', ') : ''));
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'card-lost.png', false);
    leaks(rec, await dataLayer(page), 'lost card');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('card-lost-off', { resend: 'off' });
    await page.goto(BASE + '/gift/card#code=LF-NOPE-NOPE');
    await page.waitForSelector('[data-ga-lost]:not([hidden])', { timeout: 10000 });
    check(await text(page, '[data-ga-note]') === NOT_FOUND + ' ' + CARD_W.questions, 'a code it cannot find: its sentence, and the lost-card form');
    await page.fill('#ga-lost-email', 'lost@example.test');
    await press(page, '[data-ga-lost] button[type=submit]');
    await page.waitForSelector('[data-ga-lost-said]:not([hidden])', { timeout: 5000 });
    check(await text(page, '[data-ga-lost-said]') === CARD_W.lost_off, 'the resend door off: "' + CARD_W.lost_off + '"');
    await ctx.close();
  }

  console.log('/gift/card: the plain sentences');
  for (const [what, hash, engine, want] of [
    ['no code on the link', '', {}, CARD_W.card_none],
    ['a code the engine cannot find: its own sentence', '#code=LF-NOPE-NOPE', {}, NOT_FOUND + ' ' + CARD_W.questions],
    ['a void gift', '#code=' + CODE_VOID, {}, CARD_W.card_void],
    ['the lookup door off', '#code=' + CODE, { lookup: 'off' }, CARD_W.card_off],
    ['the engine unreachable', '#code=' + CODE, { down: true }, CARD_W.card_down],
  ]) {
    const { ctx, page } = await open('card-sentence', engine);
    await page.goto(BASE + '/gift/card' + hash);
    await page.waitForSelector('[data-ga-note]:not([hidden])', { timeout: 10000 });
    check(await text(page, '[data-ga-note]') === want && await page.evaluate(() => document.querySelector('[data-ga-card]').hidden), what + ', no card');
    if (want.indexOf(NOT_FOUND) === 0) { check(await overflow(page) <= 0, 'no sideways scroll at 390'); await shot(page, 'card-unknown.png', false); }
    await ctx.close();
  }

  // ------------------------------------------------------------- /gift/manage
  console.log('/gift/manage#token=: the buyer changes the day');
  {
    const { ctx, page, rec } = await open('manage-delivery', {});
    await page.goto(BASE + '/gift/manage#token=' + DTOKEN);
    await page.waitForSelector('[data-ga-letter]:not([hidden])', { timeout: 10000 });
    check(!has(page.url(), DTOKEN) && new URL(page.url()).pathname === '/gift/manage', 'the token is out of the address bar');
    check(rec.deliveries[0] && rec.deliveries[0].method === 'GET' && rec.deliveries[0].token === DTOKEN, 'GET /v1/gift/delivery?token=, of our own server');
    const xd = nextMorning('12-25').slice(0, 10);
    const v = await page.evaluate(() => ({ for_: document.querySelector('.ga-letter__for').textContent, from: document.querySelector('.ga-letter__from').textContent,
      when: document.querySelector('.ga-letter__when').textContent, note: document.querySelector('[data-ga-letter-note] [data-v="message"]').textContent,
      fixed: !document.querySelector('[data-ga-letter-note]').hidden, noteField: !!document.querySelector('[data-ga-change] textarea') }));
    check(v.for_ === 'For Ana & Luis' && v.from === 'With love from Aunt June', 'the names, as the card reads');
    check(v.when === 'Their card is emailed to ' + THEM + ' on ' + whenEngine(xd, 8) + '.', 'where and when, in the engine\'s words (' + v.when + ')');
    check(v.fixed && v.note === NOTE && !v.noteField, 'the note shown, and not to be changed');
    check(await page.inputValue('#ga-their-email') === THEM && await page.inputValue('#ga-day') === xd && await page.inputValue('#ga-hour') === '8', 'the form holds the email, the day and the hour as they stand');
    const labelled = await page.evaluate(() => [...document.querySelectorAll('#ga-manage input, #ga-manage select')].filter((n) => !(n.labels && n.labels.length)).map((n) => n.id));
    check(!labelled.length, 'every field has its label');
    const covM = await covered(page, '#ga-manage');
    check(!covM.length, 'no fixed element over the change page\'s fields' + (covM.length ? ': ' + covM.join('; ') : ''));
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'gift-manage.png');
    await page.selectOption('#ga-hour', '9');
    await press(page, '[data-ga-change] button[type=submit]');
    await page.waitForFunction(() => document.querySelector('[data-ga-saved]').textContent.length > 0, null, { timeout: 5000 });
    const post = rec.deliveries.filter((x) => x.method === 'POST')[0] || {};
    check(JSON.stringify(post.body) === JSON.stringify({ token: DTOKEN, date: xd, hour: 9, email: THEM }), 'POST /v1/gift/delivery {token, date, hour, email}');
    check(await text(page, '[data-ga-saved]') === 'Saved. Their card is now emailed to ' + THEM + ' on ' + whenEngine(xd, 9) + '.' &&
      has(await text(page, '.ga-letter__when'), whenEngine(xd, 9)), 'saved: the new moment, in the engine\'s words');
    const r = await rings(page, '#ga-manage');
    check(r.stops.length >= 4 && !r.bad.length, 'every keyboard stop shows its ring (' + r.stops.length + ' stops)');
    rec.dv.sent = true;
    await page.selectOption('#ga-hour', '10');
    await press(page, '[data-ga-change] button[type=submit]');
    await page.waitForFunction(() => !document.querySelector('[data-ga-change] form'), null, { timeout: 5000 });
    check(await text(page, '[data-ga-saved]') === SENT_ALREADY + ' ' + PANEL.questions && has(await text(page, '.ga-letter__when'), 'was emailed'),
      'already emailed: the engine\'s sentence, and no form to change it');
    leaks(rec, await dataLayer(page), 'the change page');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('manage-none', {});
    await page.goto(BASE + '/gift/manage');
    await page.waitForSelector('[data-ga-note]:not([hidden])', { timeout: 10000 });
    check(has(await text(page, '[data-ga-note]'), 'missing its key'), 'no token: it says the link is missing its key');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('manage-off', { delivery: 'off' });
    await page.goto(BASE + '/gift/manage#token=' + DTOKEN);
    await page.waitForSelector('[data-ga-note]:not([hidden])', { timeout: 10000 });
    check(has(await text(page, '[data-ga-note]'), 'isn\u2019t open yet') && await page.evaluate(() => document.querySelector('[data-ga-letter]').hidden), 'the delivery door off: "not open yet", quietly');
    await ctx.close();
  }
  {
    const { ctx, page } = await open('manage-unknown', {});
    await page.goto(BASE + '/gift/manage#token=tok-nope');
    await page.waitForSelector('[data-ga-note]:not([hidden])', { timeout: 10000 });
    check(await text(page, '[data-ga-note]') === NO_DELIVERY + ' ' + PANEL.questions, 'a token it does not know: the engine\'s sentence');
    await ctx.close();
  }

  // --------------------------------------------------------------- /book#gift=
  async function toSummary(page, ci, co, hash) {
    await page.goto(BASE + '/book?checkIn=' + ci + '&checkOut=' + co + (hash || ''));
    await page.waitForSelector('#gatehouse button.gh-cta', { timeout: 10000 });
  }
  async function details(page) {
    await press(page, '#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form', { timeout: 5000 });
    await page.fill('#gh-email', 'guest@example.test');
    await page.fill('#gh-first_name', 'Test'); await page.fill('#gh-last_name', 'Guest');
    await page.fill('#gh-phone', '7065550100');
    await page.selectOption('#gh-guests', '2');
    await press(page, '#gh-agree');
    await page.fill('#gh-typed_name', 'Test Guest');
  }
  const lineText = (page) => page.evaluate(() => [...document.querySelectorAll('#gatehouse .gh-summary .gh-lines dt, #gatehouse .gh-summary .gh-lines dd')].map((n) => n.innerText.trim()).join(' | '));

  console.log('/book#gift=: two nights, and the third offered as covered');
  {
    const { ctx, page, rec } = await open('book-extend', {});
    await toSummary(page, CI, CO2, '#gift=' + CODE);
    check(!has(page.url(), CODE) && await page.evaluate((c) => window.__ghKeys.gift === c, CODE), 'the code is out of the address bar, kept for the page');
    check(rec.lookups[0] === CODE && rec.quotes.length === 1 && has(rec.quotes[0], 'gift=' + CODE), 'looked up once; the quote carries gift=<code>');
    check(await label(page, '#gatehouse .gh-extend') === 'Add a third night: ' + BOOK_W.book_extend_free, 'the third night offered: "' + BOOK_W.book_extend_free + '"');
    await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded();
    await shot(page, 'book-gift-two-nights.png', false);
    await press(page, '#gatehouse .gh-extend');
    await until(async () => rec.quotes.length > 1 && has(await lineText(page), '$1,933.17'));
    check(has(rec.quotes[1] || '', 'check_out=' + CO3) && has(rec.quotes[1] || '', 'gift=' + CODE), 'one tap: three nights, quoted with the gift');
    await ctx.close();
  }

  console.log('/book#gift=: three nights, covered whole');
  {
    const { ctx, page, rec } = await open('book-covered', {});
    await toSummary(page, CI, CO3, '#gift=' + CODE);
    const ls = await lineText(page);
    check(has(ls, 'Total | $1,933.17 | ' + BOOK_W.book_name + ' | -$1,933.17 | ' + BOOK_W.book_left + ' | $0.00'), 'the total panel: Total, The Golden Arrow, Left to pay (' + ls + ')');
    check(await text(page, '#gatehouse .gh-gift') === BOOK_W.book_covers + ' The Dawn Table comes with it. ' + BOOK_W.book_nothing_left, '"The Golden Arrow covers these nights." the Dawn Table, nothing left');
    check(await label(page, '#gatehouse button.gh-cta') === BOOK_W.book_cta && !(await page.$('#gatehouse .gh-options')), 'one button, "' + BOOK_W.book_cta + '", no way-to-pay choice');
    check(!(await page.$('#gatehouse .gh-marker')) && await page.evaluate(() => window.Gatehouse.booking().marker_done === true), 'covered in full: no trail marker, and the talk card asks for none');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded();
    await shot(page, 'book-gift-covered.png', false);
    await details(page);
    const sum = await page.evaluate(() => [...document.querySelectorAll('.gh-booking .gh-lines dt, .gh-booking .gh-lines dd')].map((n) => n.innerText.trim()).join(' | '));
    check(has(sum, 'Total | $1,933.17 | ' + BOOK_W.book_name + ' | -$1,933.17 | Due today | $0.00'), 'the booking summary: Total, The Golden Arrow, Due today $0.00');
    check(await label(page, '#gatehouse form.gh-form button[type=submit]') === BOOK_W.book_cta, 'the pay step\'s button says the same');
    await Promise.all([page.waitForURL(/\/booked/, { timeout: 8000 }), press(page, '#gatehouse form.gh-form button[type=submit]')]);
    const sent = rec.checkouts[0] || {};
    check(sent.gift === CODE && sent.check_in === CI && sent.check_out === CO3, 'POST /v1/checkout carries gift=<code> with the dates');
    await page.waitForSelector('#gatehouse-stay .gh-stay', { timeout: 8000 });
    check(!has(page.url(), 'mt-test-1') && rec.stays[0] === 'mt-test-1', 'confirmed with no card: straight to /booked, its key out of the address bar');
    const w = await page.evaluate(() => document.getElementById('gatehouse-stay').innerText.replace(/\s+/g, ' '));
    check(/You.re booked/.test(await page.title()), 'the welcome (' + (await page.title()) + ')');
    check(has(w, BOOK_W.book_name) && has(w, 'The Dawn Table included') && has(w, '$1,933.17'), 'the stay shows The Golden Arrow, the Dawn Table included');
    check(has(w, STAY_W.stay_booked_now) && has(w, 'Plans change. ' + STAY_W.stay_gift_move), 'no email promised; "To move or change a gift stay, call or text Mick"');
    check(await page.evaluate(() => { try { const s = JSON.parse(sessionStorage.getItem('gh_keys')); return !(s['/book'] && s['/book'].gift); } catch (e) { return false; } }), 'the gift forgotten on /book once booked');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'booked-gift.png');
    leaks(rec, await dataLayer(page), 'covered');
    await ctx.close();
  }

  console.log('/book#gift=: nights after the card\'s twelve months (the Chief, 2026-11-08: no fixed date on the page)');
  {
    const { ctx, page } = await open('book-after-window', { window: 'past' });
    await toSummary(page, CI, CO4, '#gift=' + CODE);
    check(await text(page, '#gatehouse .gh-gift') === 'The Golden Arrow covers three of these nights. The Dawn Table comes with it. ' + AFTER_LINE, 'the engine\'s own sentence, naming the card\'s last night, in the notice');
    await ctx.close();
    const f = await open('book-after-window-noline', { window: 'past-noline' });
    await toSummary(f.page, CI, CO4, '#gift=' + CODE);
    check(await text(f.page, '#gatehouse .gh-gift') === 'The Golden Arrow covers three of these nights. The Dawn Table comes with it.', 'without the engine\'s sentence the notice ends there: the site has no after-window words of its own');
    check(!('book_after_window' in BOOK_W) && !has(fs.readFileSync(path.join(ROOT, 'book.html'), 'utf8'), 'May 31'), 'no book_after_window in the page\'s words; "May 31" is gone from /book');
    await f.ctx.close();
  }

  console.log('/book#gift=: four nights, covered in part');
  {
    const { ctx, page, rec } = await open('book-partial', {});
    await toSummary(page, CI, CO4, '#gift=' + CODE);
    const ls = await lineText(page);
    check(has(ls, 'Total | $2,577.56 | ' + BOOK_W.book_name + ' | -$1,933.17 | ' + BOOK_W.book_left + ' | $644.39'), 'Left to pay: the engine\'s due_cents (' + ls + ')');
    check(await text(page, '#gatehouse .gh-gift') === 'The Golden Arrow covers three of these nights. The Dawn Table comes with it.', '"The Golden Arrow covers three of these nights."');
    const opts = await page.evaluate(() => [...document.querySelectorAll('#gatehouse .gh-option')].map((n) => n.innerText.replace(/\s+/g, ' ').trim()));
    check(opts.some((o) => has(o, 'Pay in full: $644.39 after ' + BOOK_W.book_name)) && opts.some((o) => has(o, 'After ' + BOOK_W.book_name + ', the rest')), 'the ways to pay are for what is left');
    check(!!(await page.$('#gatehouse .gh-marker')), 'something left to pay: the trail marker stays');
    await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded();
    await shot(page, 'book-gift-partial.png', false);
    await press(page, '#gatehouse .gh-option:last-of-type input');
    await details(page);
    await press(page, '#gatehouse form.gh-form button[type=submit]');
    await page.waitForSelector('#gh-paying:not([hidden])', { timeout: 8000 });
    check((rec.checkouts[0] || {}).gift === CODE, 'POST /v1/checkout carries gift=<code>');
    check(has(await text(page, '#gh-paying'), '$644.39 due today, of $644.39'), 'Stripe opens for what is left (' + (await text(page, '#gh-paying')) + ')');
    leaks(rec, await dataLayer(page), 'in part');
    await ctx.close();
  }

  console.log('/book#gift=: what the engine refuses, at full price');
  {
    const { ctx, page, rec } = await open('book-blackout', {});
    await toSummary(page, CI_NO, CO_NO, '#gift=' + CODE);
    const t = await text(page, '#gatehouse .gh-credit--off');
    check(t === BLACKOUT + ' ' + BOOK_W.book_full_price, 'dates it cannot cover: the engine\'s sentence, then full price and Mick');
    check(rec.quotes.length === 2 && has(rec.quotes[0], 'gift=') && !has(rec.quotes[1], 'gift='), 'asked with the gift, refused (422), asked again without it');
    check(has(await lineText(page), 'Total | $1,933.17') && !has(await lineText(page), BOOK_W.book_left), 'the full price, shown as the full price');
    await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded();
    await shot(page, 'book-gift-refused.png', false);
    await press(page, '#gatehouse button.gh-cta');
    await page.waitForSelector('#gatehouse form.gh-form');
    check(await text(page, '.gh-booking .gh-credit--off') === t, 'said again above the agreement');
    await ctx.close();
  }
  for (const [what, hash, engine, want, codeRides] of [
    ['a code the engine cannot find', '#gift=LF-NOPE-NOPE', {}, NOT_FOUND + ' ' + BOOK_W.book_full_price, false],
    ['a gift already used', '#gift=' + CODE_USED, {}, BOOK_W.book_used, false],
    ['a void gift', '#gift=' + CODE_VOID, {}, BOOK_W.book_void, false],
    ['the redeem door off', '#gift=' + CODE, { lookup: 'off', redeem: 'off' }, BOOK_W.book_off, true],
  ]) {
    const { ctx, page, rec } = await open('book-refused', engine);
    await toSummary(page, CI, CO3, hash);
    check(await text(page, '#gatehouse .gh-credit--off') === want, what + ': it says so, at full price');
    check(rec.quotes.length && rec.quotes.every((q) => has(q, 'gift=') === codeRides), what + (codeRides ? ': the code still rides the quote (the engine decides)' : ': no code rides the quote'));
    if (engine.redeem === 'off') { await page.locator('#gatehouse .gh-summary').scrollIntoViewIfNeeded(); await shot(page, 'book-gift-off.png', false); }
    await ctx.close();
  }
  {
    const { ctx, page, rec } = await open('book-lookup-off', { lookup: 'off' });
    await toSummary(page, CI, CO3, '#gift=' + CODE);
    check(rec.lookups.length === 0 && has(rec.quotes[0], 'gift=' + CODE) && await label(page, '#gatehouse button.gh-cta') === BOOK_W.book_cta, 'the lookup door off, the redeem door on: the quote decides, covered');
    await ctx.close();
  }

  console.log('/manage for a gift stay');
  {
    const { ctx, page, rec } = await open('manage-gift', {});
    await page.goto(BASE + '/manage#token=mt-test-1');
    await page.waitForSelector('#gatehouse-stay .gh-stay', { timeout: 8000 });
    const t = await page.evaluate(() => document.getElementById('gatehouse-stay').innerText.replace(/\s+/g, ' '));
    check(has(t, STAY_W.stay_gift_move) && !has(t, 'Move your stay') && !has(t, 'Cancel and keep it as credit') && !has(t, 'Your stay is set'),
      '"To move or change a gift stay, call or text Mick", no move or cancel');
    check(await overflow(page) <= 0, 'no sideways scroll at 390');
    await shot(page, 'manage-gift.png');
    leaks(rec, await dataLayer(page), 'manage');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log('\n' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
