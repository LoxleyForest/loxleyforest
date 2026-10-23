/* ============================================================
   LOXLEY FOREST · talk to Mick
   A small card that offers a person to a visitor who is
   hesitating, so Mick can close by phone (Mick, 2026-10-23).
   Ours, not a pop-up kit: no discount, no wheel, no countdown,
   no scarcity. At most once a visit (this tab's session), never
   on /booked or /manage, never while a field is being typed in.

   Loaded on /book, /elopements and /proposals by the builder
   (scripts/site/build_v2.py, TALK_PAGES). Styles at the end of
   css/v2.css. When it shows, in seconds the page is in view:
     /book         dates chosen and checkout not begun for 60 s,
                   or 90 s with no touch, key, scroll or pointer on
                   the payment step (?step=pay); it never covers a
                   checkout button or the bottom of Stripe's form
     /elopements   45 s on the page, or 60% of the way down; on a
     /proposals    desktop, also when the pointer leaves the top of
                   the window (after the first 5 s). Stands down
                   once the visitor starts writing in the page's form.

   It tells our own booking server card_shown and card_click
   through the page beacon (window.lfFunnel, js/funnel.js): the
   visit's random id (the engine needs it), the step and the
   page's path. Nothing else, nothing about the person. Until the
   engine knows these two steps it refuses them, and the beacon
   never looks at the answer, so the refusal is silent.
   ============================================================ */
(function () {
  'use strict';

  var body = document.body;
  if (!body || !document.querySelector) return;
  var PATH = body.getAttribute('data-lf-path') || '';
  var API = body.getAttribute('data-lf-api') || '';

  // THE ONE PLACE to set the "Book a 30-minute call" link (an https:// scheduling page).
  // Empty: the button is not shown, and the phone line stays.
  var CALL_LINK = '';

  // PLACEHOLDER WORDS: for Mick's approval by ear before this goes live (2026-10-23).
  var WORDS = {
    heading: 'Rather talk it through?',
    line: 'Mick built the treehouse with his family. Ask him anything. No pressure.',
    phone: 'Call or text Mick at',
    call: 'Book a 30-minute call',
    close: 'Close'
  };
  // The site's number, as on every page and in js/gatehouse.js.
  var PHONE = '706-502-4823';
  var TEL = 'tel:+17065024823';

  var NEVER = { '/booked': 1, '/manage': 1 };
  var PAGES = {
    '/book': { book: true },
    '/elopements': { after: 45, depth: 0.6, exit: true },
    '/proposals': { after: 45, depth: 0.6, exit: true }
  };
  var DATES_WAIT = 60;     // s with dates chosen and checkout not begun
  var PAY_IDLE = 90;       // s idle on the payment step
  var EXIT_ARM = 5;        // s on the page before exit intent counts
  var KEY_QUIET = 2000;    // ms since the last key before "not typing"
  var PAY_TAIL = 320;      // px at the bottom of Stripe's form, where its Pay button is
  var SEEN = 'lf_talk';

  var cfg = PAGES[PATH];
  if (!cfg || NEVER[PATH]) return;

  // ---- once a visit: this tab's session, or this page when storage is refused
  var shownHere = false;
  function seen() {
    if (shownHere) return true;
    try { return sessionStorage.getItem(SEEN) === 'shown'; } catch (e) { return false; }
  }
  function markSeen() {
    shownHere = true;
    try { sessionStorage.setItem(SEEN, 'shown'); } catch (e) {}
  }
  if (seen()) return;

  function tell(step) {
    try {
      var f = window.lfFunnel;
      if (f && f.send && API && PATH) f.send(API, { visit: f.visit, step: step, path: PATH });
    } catch (e) {}
  }

  // ---- what the visitor is doing
  var TEXTY = /^(text|email|tel|number|search|url|password|date|datetime-local|month|week|time)$/i;
  function inField() {
    var a = document.activeElement;
    if (!a || a === body || a === document.documentElement) return false;
    if (card && card.contains(a)) return false;
    var tag = a.tagName;
    // An iframe holding focus is Stripe's card form: what is typed there cannot be seen here.
    if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'IFRAME' || a.isContentEditable) return true;
    return tag === 'INPUT' && TEXTY.test(a.type || 'text');
  }
  var lastKey = 0, idle = 0, secs = 0, due = false, done = false, wroteInForm = false;
  function typing() { return inField() || Date.now() - lastKey < KEY_QUIET; }
  function menuOpen() { return document.documentElement.classList.contains('lf-menu-open'); }

  function active() { idle = 0; }
  ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'input'].forEach(function (t) {
    document.addEventListener(t, active, { passive: true, capture: true });
  });
  window.addEventListener('scroll', function () { active(); if (cfg.depth) checkDepth(); }, { passive: true });
  document.addEventListener('keydown', function () { lastKey = Date.now(); active(); }, true);
  // Writing to us already (the page's inquiry form): not hesitating. /book keeps its idle watch.
  document.addEventListener('input', function (e) {
    if (!cfg.book && e.target && e.target.closest && e.target.closest('main form')) wroteInForm = true;
  }, true);

  // /book: the Gatehouse keeps the dates and the step in the link (?checkIn&checkOut&step=pay).
  function bookState() {
    var gh = document.getElementById('gatehouse');
    if (!gh || gh.hidden) return '';
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return ''; }
    if (!q.get('checkIn') || !q.get('checkOut')) return '';
    return q.get('step') === 'pay' ? 'pay' : 'dates';
  }

  function checkDepth() {
    var h = document.documentElement.scrollHeight;
    if (window.scrollY > 0 && h && (window.scrollY + window.innerHeight) / h >= cfg.depth) due = true;
  }

  var datesFor = 0;
  function tick() {
    if (done) return;
    if (document.visibilityState === 'hidden') return;
    secs++; idle++;
    if (cfg.book) {
      var s = bookState();
      datesFor = s === 'dates' ? datesFor + 1 : 0;
      if (datesFor >= DATES_WAIT || (s === 'pay' && idle >= PAY_IDLE)) due = true;
    } else {
      if (wroteInForm) { stop(); return; }
      if (cfg.after && secs >= cfg.after) due = true;
      if (cfg.depth) checkDepth();
    }
    if (due) maybeShow();
  }
  var timer = setInterval(tick, 1000);
  function stop() { done = true; clearInterval(timer); }

  if (cfg.exit && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mouseout', function (e) {
      if (done || e.relatedTarget || e.clientY > 0 || secs < EXIT_ARM || wroteInForm) return;
      due = true;
      maybeShow();
    });
  }

  function maybeShow() {
    if (done) return;
    if (seen()) { stop(); return; }
    if (typing() || menuOpen() || document.visibilityState !== 'visible') return;   // wait for the next second
    stop();
    show();
  }

  // ---- the card
  var card = null, back = null, raf = 0;

  function link(href) { return /^https:\/\/[^\s"'<>]+$/i.test(href) ? href : ''; }

  function build() {
    var c = document.createElement('aside');
    c.className = 'lf-talk';
    c.id = 'lf-talk';
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-modal', 'false');
    c.setAttribute('aria-labelledby', 'lf-talk-h');
    c.setAttribute('aria-describedby', 'lf-talk-p');
    c.tabIndex = -1;

    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'lf-talk__x';
    x.setAttribute('aria-label', WORDS.close);
    x.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
    x.addEventListener('click', function () { dismiss(); });

    var h = document.createElement('h2');
    h.className = 'lf-talk__h';
    h.id = 'lf-talk-h';
    h.textContent = WORDS.heading;

    var p = document.createElement('p');
    p.className = 'lf-talk__p';
    p.id = 'lf-talk-p';
    p.textContent = WORDS.line;

    var ph = document.createElement('p');
    ph.className = 'lf-talk__phone';
    var a = document.createElement('a');
    a.href = TEL;
    a.textContent = PHONE;
    a.addEventListener('click', function () { tell('card_click'); });
    ph.appendChild(document.createTextNode(WORDS.phone + ' '));
    ph.appendChild(a);

    c.appendChild(x);
    c.appendChild(h);
    c.appendChild(p);
    c.appendChild(ph);

    var href = link(CALL_LINK);
    if (href) {
      var b = document.createElement('a');
      b.className = 'lf-btn lf-btn--ghost lf-talk__call';
      b.href = href;
      b.target = '_blank';
      b.rel = 'noopener';
      b.textContent = WORDS.call;
      b.addEventListener('click', function () { tell('card_click'); });
      c.appendChild(b);
    }
    return c;
  }

  // Never over a checkout button, the page's form button, or the foot of Stripe's form.
  function guards() {
    var out = [];
    document.querySelectorAll('main button[type="submit"], #gatehouse .gh-cta').forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.width && r.height) out.push(r);
    });
    document.querySelectorAll('#gh-pay iframe').forEach(function (f) {
      var r = f.getBoundingClientRect();
      if (r.height) out.push({ left: r.left, right: r.right, top: Math.max(r.top, r.bottom - PAY_TAIL), bottom: r.bottom });
    });
    return out;
  }
  function hits(r, list) {
    for (var i = 0; i < list.length; i++) {
      var g = list[i];
      if (r.left < g.right && r.right > g.left && r.top < g.bottom + 8 && r.bottom > g.top - 8) return true;
    }
    return false;
  }
  function place() {
    raf = 0;
    if (!card) return;
    var list = guards();
    card.classList.remove('is-top', 'is-away');
    if (!list.length) return;
    if (!hits(card.getBoundingClientRect(), list)) return;
    card.classList.add('is-top');
    if (!hits(card.getBoundingClientRect(), list)) return;
    card.classList.remove('is-top');
    card.classList.add('is-away');   // a button under both places: step aside until it scrolls on
  }
  function queuePlace() { if (!raf) raf = requestAnimationFrame(place); }

  function onKey(e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && card && !menuOpen()) dismiss();
  }
  function onPointer(e) {
    if (card && !card.contains(e.target)) dismiss();
  }

  function show() {
    if (card) return;
    markSeen();
    back = document.activeElement;
    card = build();
    body.appendChild(card);
    place();
    // The next frame, so the rise plays (none under reduced motion).
    requestAnimationFrame(function () { if (card) card.classList.add('is-in'); });
    // Focus moves to the card (nothing is being typed: maybeShow waited for that) and goes back on close.
    try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('scroll', queuePlace, { passive: true });
    window.addEventListener('resize', queuePlace);
    tell('card_shown');
  }

  function dismiss() {
    if (!card) return;
    var c = card, hadFocus = c.contains(document.activeElement);
    card = null;
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onPointer, true);
    window.removeEventListener('scroll', queuePlace);
    window.removeEventListener('resize', queuePlace);
    c.classList.remove('is-in');
    var gone = false;
    function remove() { if (!gone) { gone = true; c.remove(); } }
    c.addEventListener('transitionend', remove);
    setTimeout(remove, 400);
    if (hadFocus) {
      if (back && back !== body && document.contains(back) && back.focus) {
        try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); }
      } else {
        c.blur();
      }
    }
  }
})();
