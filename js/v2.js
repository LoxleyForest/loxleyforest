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

/* A film in the page (the interior on /treehouses, 2026-10-29): the hero's loop (js/global.js),
   for a clip below the fold. Its still is what paints first. The clip gets a source only once the
   page has loaded and the film is on screen, so the first load carries the still and nothing more;
   it plays only while on screen, and never loads on reduced motion, Save-Data, a slow connection
   or an old browser. */
(function () {
  var vids = document.querySelectorAll('.lf-loop__video[data-ready]');
  if (!vids.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
  var phone = window.matchMedia('(max-width: 767px)').matches;
  var loaded = document.readyState === 'complete';
  if (!loaded) window.addEventListener('load', function () { loaded = true; vids.forEach(function (v) { if (v._lfOn) v._lfShow(); }); }, { once: true });
  vids.forEach(function (v) {
    var btn = v.parentNode.querySelector('.lf-loop__pause');
    var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    v._lfShow = function () {
      if (!loaded) return;
      if (!v.src) {
        // iPhones want these set as properties, not only as attributes, before the source arrives
        v.muted = true; v.defaultMuted = true; v.playsInline = true;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        // the file follows the film's own width, not the screen's: a desktop column takes the 720 file
        var small = phone || v.parentNode.clientWidth <= 400;
        var webm = !small && v.dataset.deskWebm && v.canPlayType('video/webm; codecs="vp9"');
        v.src = small ? v.dataset.phone : (webm ? v.dataset.deskWebm : v.dataset.desk);
        v.load();
        v.addEventListener('playing', function () { v.classList.add('is-playing'); if (btn) btn.hidden = false; }, { once: true });
        // An iPhone in Low Power Mode refuses autoplay; the first touch starts the loop instead.
        ['touchstart', 'pointerdown', 'keydown'].forEach(function (ev) {
          window.addEventListener(ev, function () { if (v._lfOn && v.paused && !v.dataset.userPaused) tryPlay(); }, { once: true, passive: true });
        });
      }
      if (!v.dataset.userPaused) tryPlay();
    };
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        v._lfOn = e.isIntersecting;
        if (e.isIntersecting) v._lfShow(); else if (v.src) v.pause();
      });
    }).observe(v.parentNode);
    if (btn) btn.addEventListener('click', function () {
      if (v.paused) { delete v.dataset.userPaused; tryPlay(); btn.setAttribute('aria-label', 'Pause the video'); btn.classList.remove('is-paused'); }
      else { v.dataset.userPaused = '1'; v.pause(); btn.setAttribute('aria-label', 'Play the video'); btn.classList.add('is-paused'); }
    });
  });
})();
