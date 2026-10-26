// After every push: prove the Google Ads conversions fire on the live site,
// catching each hit before it leaves (nothing is recorded, no analytics sent).
//     node scripts/site/check_conversions.js        (needs Playwright)
// Exit 1 if any expected conversion label does not fire. Labels: docs/site-tags.md.
const PW = process.env.PLAYWRIGHT || '/home/mick/.npm/_npx/705bc6b22212b352/node_modules/playwright';
const { chromium } = require(PW);
const SITE = process.env.SITE || 'https://loxleyforest.com';
const WANT = [
  { path: '/success', label: '12CKCM613eccEM6c6btD', what: 'Form Inquiry (success)' },
  { path: '/booking-confirmed', label: '7sTuCMu13eccEM6c6btD', what: 'Widget Inquiry' },
  { path: '/booked', label: 'iI0nCNmZg6YdEM6c6btD', what: 'Booking - direct', push: { event: 'purchase', value: 1, currency: 'USD', transaction_id: 'check-not-sent' } },
];
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of WANT) {
    const p = await b.newPage(); const seen = [];
    await p.route('**/*', r => { const u = r.request().url(); const h = new URL(u).hostname;
      if (/google-analytics\.com|analytics\.google\.com|facebook|fbcdn|clarity\.ms/.test(h) || /\/g\/collect/.test(u)) return r.abort();
      if (/pagead\/(conversion|1p-conversion|viewthroughconversion)/.test(u)) { const m = u.match(/label=([^&]*)/); if (m) seen.push(m[1]); return r.fulfill({ status: 204, body: '' }); }
      if (h === 'book.loxleyforest.com') return r.fulfill({ status: 404, body: '{}' });
      return r.continue(); });
    await p.goto(SITE + w.path, { waitUntil: 'load' }); await p.waitForTimeout(4000);
    if (w.push) { await p.evaluate(x => { (window.dataLayer = window.dataLayer || []).push(x); }, w.push); await p.waitForTimeout(4000); }
    const ok = seen.includes(w.label);
    console.log((ok ? 'fires   ' : 'MISSING ') + w.what + ' on ' + w.path);
    if (!ok) bad++;
    await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
