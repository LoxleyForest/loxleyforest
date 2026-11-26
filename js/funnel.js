/* ============================================================
   LOXLEY FOREST · where every visit came from
   The flywheel's first gate (Mick, 2026-10-20). Loaded first on
   every page (scripts/site/build_v2.py footer; your-adventure.html
   by hand). Each page tells our own booking server, and no one else,
   that it was seen:
     visit     a random id, the same one the booking calendar uses,
               so a visit's pages and its booking steps join
     path      the page's clean path as the builder wrote it
               (body data-lf-path), never the address bar, so no
               query or fragment can ride along
     referrer  the host the visit arrived from, host only, kept for
               the visit
     src       when a link carried one (?src=instagram, ?src=ai)
   Every beacon, this one and the booking calendar's (js/gatehouse.js,
   through window.lfFunnel), goes through scrub(): known fields only,
   short plain values, nothing shaped like a key. On /book, /booked and
   /manage the keys script in the head has already lifted any key out
   of the address before this runs.
   ============================================================ */
(function () {
  var body = document.body;
  var API = ((body && body.getAttribute('data-lf-api')) || '').replace(/\/$/, '');
  var FIELDS = ['visit', 'step', 'unit', 'src', 'path', 'referrer', 'check_in', 'mode', 'nights', 'value_cents', 'ms', 'reason'];
  var PLAIN = /^[A-Za-z0-9 ._:\/-]{1,120}$/;          // no = ? & # %: nothing that carries a key
  var KEYISH = /token|session|secret|credit|cs_(test|live)_/i;
  var OURS = /(^|\.)loxleyforest\.com$/i;

  function scrub(b) {
    var out = {};
    FIELDS.forEach(function (k) {
      var v = b && b[k];
      if (v === undefined || v === null || v === '') return;
      var s = String(v);
      if (PLAIN.test(s) && !KEYISH.test(s)) out[k] = v;
    });
    return out;
  }

  function send(api, b) {
    api = String(api || API).replace(/\/$/, '');
    if (!api) return;
    var data = JSON.stringify(scrub(b));
    try {
      // text/plain keeps the beacon a "simple" request: no preflight.
      if (navigator.sendBeacon && navigator.sendBeacon(api + '/v1/funnel', new Blob([data], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(api + '/v1/funnel', { method: 'POST', body: data, keepalive: true }).catch(function () {}); } catch (e) {}
  }

  var visit = (function () {
    try {
      var v = sessionStorage.getItem('gh_visit');
      if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('gh_visit', v); }
      return v;
    } catch (e) { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  })();

  // A link's src as a short plain word ("instagram", "ai"); anything else is dropped.
  function cleanSrc(s) {
    s = String(s || '').toLowerCase().replace(/[^a-z0-9_-]+$/, '');
    return /^[a-z0-9_-]{1,40}$/.test(s) ? s : '';
  }
  // The host a visitor came from, when it is not this site: host only, never the page.
  function outsideHost(ref) {
    try {
      var h = new URL(ref).hostname.toLowerCase();
      return h && h !== location.hostname && !OURS.test(h) ? h : '';
    } catch (e) { return ''; }
  }

  window.lfFunnel = { visit: visit, send: send, scrub: scrub };

  var path = body && body.getAttribute('data-lf-path');
  if (!API || !path) return;
  var linkSrc = '';
  try { linkSrc = cleanSrc(new URLSearchParams(location.search).get('src')); } catch (e) {}
  // An ad click carries Google's click id, not a src: count it as Google Ads, apart
  // from people who found us on Google by search (2026-10-22, the morning line).
  if (!linkSrc && /[?&](gclid|gbraid|wbraid)=/.test(location.search)) linkSrc = 'google-ads';
  var entry = null;
  try { entry = JSON.parse(sessionStorage.getItem('gh_entry') || 'null'); } catch (e) {}
  if (!entry || typeof entry !== 'object') entry = { referrer: outsideHost(document.referrer), src: linkSrc };
  else if (linkSrc) entry.src = linkSrc;
  try { sessionStorage.setItem('gh_entry', JSON.stringify(entry)); } catch (e) {}
  send(API, { visit: visit, step: 'page', path: path, referrer: entry.referrer, src: entry.src });
})();
