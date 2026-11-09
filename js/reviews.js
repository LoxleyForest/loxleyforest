/* ============================================================
   LOXLEY FOREST · the guest stories carousel
   The stories themselves are written into the page by the builder
   (REVIEW_LIST in scripts/site/build_v2.py, the one place they
   live). The track scrolls sideways on its own, with snap; this
   adds the arrows, the count, the arrow keys, and a slow turn.

   The turn: one story every 8 seconds, only while the carousel is
   on screen and the tab is visible; paused while a pointer rests on
   it or focus is inside it; stopped for good by any touch, drag,
   arrow or key, and by the stop button. It ends at the last story.
   With reduced motion it never starts, and the stop button hides.
   ============================================================ */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    var track = root.querySelector('.lf-rv__track');
    var cards = track ? track.querySelectorAll('.lf-rv__card') : [];
    if (!cards.length) return;
    var prev = root.querySelector('[data-rv-prev]');
    var next = root.querySelector('[data-rv-next]');
    var at = root.querySelector('[data-rv-at]');
    var live = root.querySelector('[data-rv-live]');
    var pause = root.querySelector('[data-rv-pause]');
    var index = 0, timer = null, stopped = reduce, held = false, seen = false, frame = 0;

    /* the card nearest the track's start edge is the current one */
    function current() {
      var edge = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).scrollPaddingLeft || 0);
      var best = 0, dist = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var d = Math.abs(cards[i].getBoundingClientRect().left - edge);
        if (d < dist) { dist = d; best = i; }
      }
      /* scrolled to the end: the last card counts, even if it cannot reach the start edge */
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) best = cards.length - 1;
      return best;
    }

    function paint() {
      frame = 0;
      index = current();
      if (at) at.textContent = index + 1;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }

    function go(i, announce) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      var edge = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).scrollPaddingLeft || 0);
      track.scrollBy({ left: cards[i].getBoundingClientRect().left - edge, behavior: reduce ? 'auto' : 'smooth' });
      if (announce && live) live.textContent = 'Story ' + (i + 1) + ' of ' + cards.length;
    }

    function stop() {
      stopped = true;
      clearInterval(timer); timer = null;
      if (pause) { pause.classList.add('is-paused'); pause.setAttribute('aria-label', 'Turn the stories'); }
    }

    function tick() {
      if (held || document.hidden) return;
      if (index >= cards.length - 1 || (next && next.disabled)) { stop(); return; }
      go(index + 1, false);
    }

    function run() {
      clearInterval(timer); timer = null;
      if (!stopped && seen) timer = setInterval(tick, 8000);
    }

    track.addEventListener('scroll', function () { if (!frame) frame = requestAnimationFrame(paint); }, { passive: true });
    window.addEventListener('resize', function () { if (!frame) frame = requestAnimationFrame(paint); });

    if (prev) prev.addEventListener('click', function () { stop(); go(index - 1, true); });
    if (next) next.addEventListener('click', function () { stop(); go(index + 1, true); });

    track.addEventListener('keydown', function (e) {
      var k = e.key, to = null;
      if (k === 'ArrowRight') to = index + 1;
      else if (k === 'ArrowLeft') to = index - 1;
      else if (k === 'Home') to = 0;
      else if (k === 'End') to = cards.length - 1;
      if (to === null) return;
      e.preventDefault(); stop(); go(to, true);
    });

    /* a hand on it is the guest reading: stop turning */
    ['pointerdown', 'touchstart', 'wheel'].forEach(function (t) {
      track.addEventListener(t, function (e) {
        if (t === 'wheel' && Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        stop();
      }, { passive: true });
    });
    root.addEventListener('mouseenter', function () { held = true; });
    root.addEventListener('mouseleave', function () { held = false; });
    root.addEventListener('focusin', function () { held = true; });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) held = false; });

    if (pause) {
      if (reduce) pause.hidden = true;
      pause.addEventListener('click', function () {
        if (stopped) {
          stopped = false; pause.classList.remove('is-paused'); pause.setAttribute('aria-label', 'Stop the stories turning');
          if (index >= cards.length - 1) go(0, true);
          run();
        } else {
          stop();
        }
      });
    }

    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        seen = entries[0].isIntersecting;
        run();
      }, { threshold: 0.5 }).observe(root);
    }
    paint();
  }

  function start() { document.querySelectorAll('[data-reviews]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
