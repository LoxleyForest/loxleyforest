// After every push: prove the Google Ads conversions fire on the live site,
// catching each hit before it leaves (nothing is recorded, no analytics sent).
//     node scripts/site/check_conversions.js        (needs Playwright)
//     SITE=http://127.0.0.1:8000 node scripts/site/check_conversions.js   (a local render)
// Exit 1 if any expected conversion label does not fire. Labels: docs/site-tags.md.
const PW = process.env.PLAYWRIGHT || '/home/mick/.npm/_npx/705bc6b22212b352/node_modules/playwright';
const { chromium } = require(PW);
const SITE = process.env.SITE || 'https://loxleyforest.com';
const SITE_HOST = new URL(SITE).hostname;
// The Golden Arrow sold (2026-10-29): js/gift.js pushes gift_purchase on /gift/thanks, once per
// Stripe session, only when the engine's GET /v1/gift/sold answers paid. The check answers that read
// itself, paid, for a made-up session id and amount; the page itself must push. Its Google Ads action does
// not exist yet: Mick creates "Gift - Golden Arrow" by his own click (loxley-rescue
// docs/site-tags.md, [MICK RATIFIES]). Until its label is written here the line says "awaiting
// Mick's label" and does not fail; the push's shape is checked either way.
const GIFT_LABEL = '';
const GIFT = { cents: 200000, item: 'golden-arrow', session: 'cs_test_checknotsent' };
const WANT = [
  { path: '/success', label: '12CKCM613eccEM6c6btD', what: 'Form Inquiry (success)' },
  { path: '/booking-confirmed', label: '7sTuCMu13eccEM6c6btD', what: 'Widget Inquiry' },
  { path: '/booked', label: 'iI0nCNmZg6YdEM6c6btD', what: 'Booking - direct', push: { event: 'purchase', value: 1, currency: 'USD', transaction_id: 'check-not-sent' } },
  { path: '/gift/thanks?session_id=' + GIFT.session, label: GIFT_LABEL, what: 'Gift - Golden Arrow', gift: GIFT },
];

// The page's own gift_purchase, in the shape /booked's purchase has: value in dollars (at most two
// decimals), USD, a hashed transaction_id that never carries the session, and the card's name.
function giftShape(dl, g) {
  const got = dl.filter(x => x && x.event === 'gift_purchase');
  if (got.length !== 1) return got.length + ' gift_purchase pushes, want 1';
  const e = got[0], keys = Object.keys(e).filter(k => !/^gtm\./.test(k)).sort().join();  // Tag Manager adds gtm.uniqueEventId
  if (keys !== 'currency,event,item,transaction_id,value') return 'fields ' + keys;
  if (typeof e.value !== 'number' || e.value !== g.cents / 100 || Math.round(e.value * 100) !== e.value * 100) return 'value ' + JSON.stringify(e.value);
  if (e.currency !== 'USD') return 'currency ' + JSON.stringify(e.currency);
  if (!/^lf-[0-9a-f]{16}$/.test(String(e.transaction_id)) || String(e.transaction_id).indexOf(g.session) >= 0) return 'transaction_id ' + JSON.stringify(e.transaction_id);
  if (e.item !== g.item) return 'item ' + JSON.stringify(e.item);
  return '';
}

(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of WANT) {
    const p = await b.newPage(); const seen = [];
    await p.route('**/*', r => { const u = r.request().url(); const h = new URL(u).hostname;
      if (/google-analytics\.com|analytics\.google\.com|facebook|fbcdn|clarity\.ms/.test(h) || /\/g\/collect/.test(u)) return r.abort();
      if (/pagead\/(conversion|1p-conversion|viewthroughconversion)/.test(u)) { const m = u.match(/label=([^&]*)/); if (m) seen.push(m[1]); return r.fulfill({ status: 204, body: '' }); }
      if (h === 'book.loxleyforest.com') {
        if (w.gift && new URL(u).pathname === '/v1/gift/sold') return r.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ paid: true, cents: w.gift.cents }) });
        return r.fulfill({ status: 404, body: '{}' });
      }
      // Everything else outside the site, Tag Manager and the fonts is answered here, never sent
      // (2026-10-29: Google's ccm/collect and rmkt/collect hits went out before, from the live
      // site and from a local render alike).
      if (h !== SITE_HOST && !/(^|\.)googletagmanager\.com$|^fonts\.(googleapis|gstatic)\.com$/.test(h)) return r.fulfill({ status: 204, body: '' });
      return r.continue(); });
    await p.goto(SITE + w.path, { waitUntil: 'load' }); await p.waitForTimeout(4000);
    if (w.push) { await p.evaluate(x => { (window.dataLayer = window.dataLayer || []).push(x); }, w.push); await p.waitForTimeout(4000); }
    const where = w.path.split('?')[0];
    if (w.gift) {
      const dl = await p.evaluate(() => JSON.parse(JSON.stringify(window.dataLayer || [])));
      const wrong = giftShape(dl, w.gift);
      const e = dl.find(x => x && x.event === 'gift_purchase') || {};
      console.log((wrong ? 'MISSING ' : 'pushes  ') + 'gift_purchase on ' + where + (wrong ? ' (' + wrong + ')' :
        ' {value: ' + e.value + ', currency: ' + e.currency + ', transaction_id: ' + e.transaction_id + ', item: ' + e.item + '}'));
      if (wrong) bad++;
      // A card is not a stay: no other action may fire here (the booking tag fires on any purchase).
      const other = seen.filter(l => l !== w.label);
      if (other.length) { console.log('WRONG   ' + other.join(', ') + ' fired on ' + where); bad++; }
      if (!w.label) { console.log('awaiting Mick\'s label: ' + w.what + ' on ' + where); await p.close(); continue; }
    }
    const ok = seen.includes(w.label);
    console.log((ok ? 'fires   ' : 'MISSING ') + w.what + ' on ' + where);
    if (!ok) bad++;
    await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
