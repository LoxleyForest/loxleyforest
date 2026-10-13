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
