// After every push: prove the Google Ads conversions fire on the live site,
// catching each hit before it leaves (nothing is recorded, no analytics sent).
//     node scripts/site/check_conversions.js        (needs Playwright)
//     SITE=http://127.0.0.1:8000 node scripts/site/check_conversions.js   (a local render)
// Exit 1 if any expected conversion label does not fire, or one fires where it must not.
// Labels: loxley-rescue docs/site-tags.md, and docs/elopement-conversion.md here.
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
// The elopement form's own door (2026-11-04, the Marketer's elopements memo item 3, routed by the
// Chief): /success-elopement. Its Google Ads action, "Elopement Inquiry", exists since 2026-11-05
// (the Chief's clicks in Mick's Chrome, on his word; the label read from the page), and the Tag
// Manager version named in docs/elopement-conversion.md fires it there and keeps the Form Inquiry
// trigger off the page. So the page must fire ELOPEMENT_LABEL and Form Inquiry must not (a "not"
// label here fails the check when it fires), or every elopement inquiry counts twice. Before that
// version was published the page's path holding "/success" made Form Inquiry (its trigger matches
// by "contains") count an elopement inquiry, and this check wanted that label there: blank
// ELOPEMENT_LABEL again and it wants that again, should the container ever be rolled back.
const FORM_LABEL = '12CKCM613eccEM6c6btD';
const ELOPEMENT_LABEL = '6ibiCPrZ1LIdEM6c6btD';
const WANT = [
  { path: '/success', label: FORM_LABEL, what: 'Form Inquiry (success)', not: ELOPEMENT_LABEL },
  ELOPEMENT_LABEL
    ? { path: '/success-elopement', label: ELOPEMENT_LABEL, what: 'Elopement Inquiry (success-elopement)', not: FORM_LABEL }
    : { path: '/success-elopement', label: FORM_LABEL, what: 'Form Inquiry (success-elopement), until Mick\'s Elopement Inquiry label is in ELOPEMENT_LABEL' },
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
    if (w.not && seen.includes(w.not)) { console.log('WRONG   ' + w.not + ' fired on ' + where + ' too'); bad++; }
    await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
