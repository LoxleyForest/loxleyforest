/* ============================================================
   LOXLEY FOREST · the redesign layer's behaviour
   global.js still runs underneath it: ad attribution, smooth
   scroll, the hero loop and the phone Book button.
   ============================================================ */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  /* Header: transparent over the hero, solid once the page moves. */
  var hdr = document.querySelector('.lf-hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('is-solid', window.scrollY > 40 || root.classList.contains('lf-menu-open')); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menu (phones). */
  var btn = document.querySelector('.lf-menu-btn');
  var menu = document.getElementById('lf-menu');
  function setMenu(open) {
    root.classList.toggle('lf-menu-open', open);
    if (btn) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    if (menu) menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (window.lfLenis) { if (open) window.lfLenis.stop(); else window.lfLenis.start(); }
    onScroll();
  }
  if (btn && menu) {
    btn.addEventListener('click', function () { setMenu(!root.classList.contains('lf-menu-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('lf-menu-open')) { setMenu(false); btn.focus(); } });
  }

  /* Sections rise into view, once. */
  var rise = document.querySelectorAll('.lf-rise');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rise.forEach(function (el) { io.observe(el); });
  } else {
    rise.forEach(function (el) { el.classList.add('is-in'); });
  }
})();

/* Where every visit came from (the flywheel's first gate, Mick, 2026-10-20). Every page tells
   our own booking server, and no one else, that it was seen: a random visit id (the same one the
   booking calendar uses, so a visit's pages and its booking steps join), the page's clean path as
   the builder wrote it (body data-lf-path; never the address bar, so no query or fragment can ride
   along), the host the visit arrived from (host only, kept for the visit), and src when a link
   carried one (?src=instagram, ?src=ai). Every beacon, this one and the booking calendar's
   (js/gatehouse.js), goes through scrub(): only known fields, short plain values, nothing shaped
   like a key. On /book, /booked and /manage the keys script in the head has already lifted any
   key out of the address before this runs. */
(function () {
  var body = document.body;
  var API = ((body && body.getAttribute('data-lf-api')) || '').replace(/\/$/, '');
  var FIELDS = ['visit', 'step', 'unit', 'src', 'path', 'referrer', 'check_in', 'mode', 'nights', 'value_cents', 'ms'];
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
  var entry = null;
  try { entry = JSON.parse(sessionStorage.getItem('gh_entry') || 'null'); } catch (e) {}
  if (!entry || typeof entry !== 'object') entry = { referrer: outsideHost(document.referrer), src: linkSrc };
  else if (linkSrc) entry.src = linkSrc;
  try { sessionStorage.setItem('gh_entry', JSON.stringify(entry)); } catch (e) {}
  send(API, { visit: visit, step: 'page', path: path, referrer: entry.referrer, src: entry.src });
})();

/* List sign-ups post in place (Netlify forms), so nobody leaves the page. */
(function () {
  document.querySelectorAll('form[data-lf-ajax]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.URLSearchParams) return;
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
        .then(function (r) {
          if (!r.ok) throw new Error('status ' + r.status);
          var done = form.querySelector('.lf-signup__done');
          form.querySelectorAll('input[type="email"], button[type="submit"], label').forEach(function (el) { el.hidden = true; });
          if (done) done.hidden = false;
        })
        .catch(function () { if (btn) btn.disabled = false; form.removeAttribute('data-lf-ajax'); form.submit(); });
    });
  });
})();
