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
     /book         10 s after the all-in total is on screen with
                   checkout not begun, and then it asks for an email
                   (2026-10-24, CARD_EMAIL below); or 90 s with no
                   touch, key, scroll or pointer on the payment step
                   (?step=pay), without the email (it is taken first
                   there); it never covers a checkout button or the
                   bottom of Stripe's form
     /elopements   45 s on the page, or 60% of the way down; on a
     /proposals    desktop, also when the pointer leaves the top of
                   the window (after the first 5 s). Stands down
                   once the visitor starts writing in the page's form.

   The email on /book goes to our own booking server alone, through
   js/gatehouse.js. 'marker' (on): a trail marker, the very call the
   page's own "Not ready? Leave a trail marker." makes (POST
   /v1/marker), nothing held; Mick cut Hold my dates on 2026-10-19.
   'hold' (off): the nights held 24 hours (POST /v1/hold), built for
   the day he reverses that. Any refusal, a missing route or no
   network: the email part leaves quietly and the call line stays.

   It tells our own booking server card_shown and card_click, and
   on /book marker_shown and marker_card (or hold_shown and
   hold_made), through the page beacon (window.lfFunnel,
   js/funnel.js): the visit's random id (the engine needs it), the
   step and the page's path. Nothing else, nothing about the
   person. Until the engine knows these steps it refuses them, and
   the beacon never looks at the answer, so the refusal is silent.
   ============================================================ */
(function () {
  'use strict';

  var body = document.body;
  if (!body || !document.querySelector) return;
  var PATH = body.getAttribute('data-lf-path') || '';
  var API = body.getAttribute('data-lf-api') || '';

  // THE ONE PLACE to set the "Book a 30-minute call" links (Google Calendar booking pages,
  // built 2026-10-23): elopements get Mick's elopement page, the rest his stay page.
  // Empty: the button is not shown, and the phone line stays.
  var CALL_LINKS = {
    '/elopements': 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ09-JeAUO0U36--uUgaokdw-x5Rt0tl8V_1PQIEbCxDrqbinwF9xkIa_bojj6Vui9ZVDAYgJmDX',
    '/book': 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ14V7SMtghWX_kk-0u24C47dElxr7ki9EdtjJsotoQnYOWOtHqb06wtvrMRmS6kHcOBQ655VAC3',
    '/proposals': 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ14V7SMtghWX_kk-0u24C47dElxr7ki9EdtjJsotoQnYOWOtHqb06wtvrMRmS6kHcOBQ655VAC3'
  };

  // The words, approved by Mick 2026-10-23.
  var WORDS = {
    heading: 'Rather talk it through?',
    line: 'Mick built the treehouse with his family. Ask him anything. No pressure.',
    phone: 'Call or text Mick at',
    call: 'Book a 30-minute call',
    close: 'Close',
    // The email on /book (2026-10-24), above the words above, which stay as they are.
    email: 'Your email',   // the field's label and placeholder: the trail marker's own label
    // CARD_EMAIL 'marker' (on). Done: the trail marker's own line, from js/gatehouse.js.
    markerHeading: 'Want a day to think it over?',   // awaiting Mick
    markerLine: "Leave your email and we'll send you these dates and the all-in price, with a link straight back to them.",   // awaiting Mick
    markerButton: 'Leave a trail marker',   // awaiting Mick
    // CARD_EMAIL 'hold' (off).
    holdHeading: 'Want a day to think it over?',   // awaiting Mick
    holdLine: "Leave your email and we'll hold these nights for you for 24 hours. No card, no charge.",   // awaiting Mick
    holdButton: 'Hold my nights',   // awaiting Mick
    holdDone: 'Held until {when}. The link to book them is in your email.'   // awaiting Mick; {when} like "Sunday 8:10 PM", Eastern
  };

  // What the card's email does on /book. 'marker' (the default): a trail marker, nothing held.
  // 'hold': the 24-hour date hold; off while Mick's 2026-10-19 ruling stands ("Hold my dates is
  // cut") and until the engine's /v1/hold takes holds. Anything else: 'marker'.
  var CARD_EMAIL = 'marker';
  var MODE = CARD_EMAIL === 'hold' ? 'hold' : 'marker';
  var ASK = MODE === 'hold'
    ? { heading: WORDS.holdHeading, line: WORDS.holdLine, button: WORDS.holdButton, shown: 'hold_shown', made: 'hold_made' }
    : { heading: WORDS.markerHeading, line: WORDS.markerLine, button: WORDS.markerButton, shown: 'marker_shown', made: 'marker_card' };
  // The site's number, as on every page and in js/gatehouse.js.
  var PHONE = '706-502-4823';
  var TEL = 'tel:+17065024823';

  var NEVER = { '/booked': 1, '/manage': 1 };
  var PAGES = {
    '/book': { book: true },
    '/elopements': { after: 45, depth: 0.6, exit: true },
    '/proposals': { after: 45, depth: 0.6, exit: true }
  };
  var TOTAL_WAIT = 10;     // s with the all-in total on screen and checkout not begun (Mick, 2026-10-24)
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

  // /book: the stay whose total is on screen, from the Gatehouse (js/gatehouse.js); else null.
  function stay() {
    try { var g = window.Gatehouse; return g && g.booking ? g.booking() : null; } catch (e) { return null; }
  }
  // Whether the card asks for an email for this stay: not when one was already left for it.
  function asks(s) {
    if (!s || !s.api) return false;
    var g = window.Gatehouse;
    return MODE === 'hold' ? !s.held : !s.marker_done && !!(g && g.leaveMarker);
  }
  function totalShown() {
    var t = document.querySelector('#gatehouse .gh-summary dd.gh-total');
    return !!(t && t.getClientRects().length);
  }

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
  var lastKey = 0, idle = 0, secs = 0, due = false, totalDue = false, done = false, wroteInForm = false;
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

  // The wait counts only the seconds the total is on screen, and is read afresh each second:
  // once checkout begins (or the dates change) it no longer stands.
  var totalFor = 0;
  function tick() {
    if (done) return;
    if (document.visibilityState === 'hidden') return;
    secs++; idle++;
    if (cfg.book) {
      var s = bookState();
      totalFor = s === 'dates' && totalShown() && stay() ? totalFor + 1 : 0;
      totalDue = totalFor >= TOTAL_WAIT;
      if (s === 'pay' && idle >= PAY_IDLE) due = true;
    } else {
      if (wroteInForm) { stop(); return; }
      if (cfg.after && secs >= cfg.after) due = true;
      if (cfg.depth) checkDepth();
    }
    if (due || totalDue) maybeShow();
  }
  var timer = setInterval(tick, 1000);
  function stop() { done = true; clearInterval(timer); }

  if (cfg.exit && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mouseout', function (e) {
      // Out of the page (no element to go to) through its top 10 px: the tab bar or the address bar.
      if (done || e.relatedTarget || e.clientY > 10 || secs < EXIT_ARM || wroteInForm) return;
      due = true;
      maybeShow();
    });
  }

  function maybeShow() {
    if (done) return;
    if (seen()) { stop(); return; }
    if (typing() || menuOpen() || document.visibilityState !== 'visible') return;   // wait for the next second
    stop();
    var s = totalDue && bookState() === 'dates' ? stay() : null;
    show(asks(s));
  }

  // ---- the card
  var card = null, back = null, raf = 0;

  function link(href) { return /^https:\/\/[^\s"'<>]+$/i.test(href) ? href : ''; }

  function build(withAsk) {
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

    // The call line: the words approved 2026-10-23, as they were.
    var talk = document.createElement('div');
    talk.className = 'lf-talk__talk';
    talk.appendChild(h);
    talk.appendChild(p);
    talk.appendChild(ph);

    var href = link(CALL_LINKS[PATH] || '');
    if (href) {
      var b = document.createElement('a');
      b.className = 'lf-btn lf-btn--ghost lf-talk__call';
      b.href = href;
      b.target = '_blank';
      b.rel = 'noopener';
      b.textContent = WORDS.call;
      b.addEventListener('click', function () { tell('card_click'); });
      talk.appendChild(b);
    }

    c.appendChild(x);
    if (withAsk) {
      c.appendChild(buildAsk());
      c.classList.add('has-ask');
      c.setAttribute('aria-labelledby', 'lf-talk-ah');
      c.setAttribute('aria-describedby', 'lf-talk-ap');
    }
    c.appendChild(talk);
    return c;
  }

  // ---- the email (/book only, 2026-10-24): one field and one button, above the call line
  var EMAIL_OK = /^\S+@\S+\.\S+$/;
  var askBox = null, askBusy = false;

  function buildAsk() {
    var w = document.createElement('div');
    w.className = 'lf-talk__ask';

    var h = document.createElement('h2');
    h.className = 'lf-talk__h';
    h.id = 'lf-talk-ah';
    h.textContent = ASK.heading;

    var p = document.createElement('p');
    p.className = 'lf-talk__p';
    p.id = 'lf-talk-ap';
    p.textContent = ASK.line;

    var f = document.createElement('form');
    f.className = 'lf-talk__form';
    f.noValidate = true;
    var l = document.createElement('label');
    l.className = 'lf-talk__sr';
    l.htmlFor = 'lf-talk-email';
    l.textContent = WORDS.email;
    var i = document.createElement('input');
    i.id = 'lf-talk-email';
    i.className = 'lf-talk__email';
    i.type = 'email';
    i.name = 'email';
    i.autocomplete = 'email';
    i.setAttribute('inputmode', 'email');
    i.setAttribute('autocapitalize', 'off');
    i.spellcheck = false;
    i.required = true;
    i.placeholder = WORDS.email;
    i.addEventListener('input', function () { i.removeAttribute('aria-invalid'); });
    var b = document.createElement('button');
    b.type = 'submit';
    b.className = 'lf-btn lf-talk__go';
    b.textContent = ASK.button;
    f.appendChild(l);
    f.appendChild(i);
    f.appendChild(b);
    f.addEventListener('submit', function (e) { e.preventDefault(); send(i, b); });

    w.appendChild(h);
    w.appendChild(p);
    w.appendChild(f);
    askBox = w;
    return w;
  }

  // 'hold' only. "Sunday 8:10 PM": held_until in Eastern time, put together from its parts so
  // no locale's spacing rides along. '' when it cannot be read.
  function eastern(t) {
    var d = new Date(t || '');
    if (!t || isNaN(d)) return '';
    try {
      var parts = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true })
        .formatToParts(d).forEach(function (x) { parts[x.type] = x.value; });
      if (!parts.weekday || !parts.hour || !parts.minute || !parts.dayPeriod) return '';
      return parts.weekday + ' ' + parts.hour + ':' + parts.minute + ' ' + parts.dayPeriod.toUpperCase();
    } catch (e) { return ''; }
  }

  // 'marker': the page's own trail marker call (Gatehouse.leaveMarker), resolving to its done line.
  // 'hold': POST /v1/hold in the engine's shape, resolving to the done line with the time.
  function ask(s, email) {
    var g = window.Gatehouse;
    if (MODE !== 'hold') return g.leaveMarker(email);
    var hb = { visit: s.visit, unit: s.unit, check_in: s.check_in, check_out: s.check_out, email: email };
    if (s.guests) hb.guests = s.guests;
    return g.api(s.api, '/v1/hold', hb).then(function (r) {
      var when = r && r.held === true && typeof r.hold === 'string' && r.hold ? eastern(r.held_until) : '';
      if (!when) throw new Error('not held');
      if (g.useHold) g.useHold(r.hold);
      return WORDS.holdDone.replace('{when}', when);
    });
  }

  function send(input, btn) {
    if (askBusy || !askBox) return;
    var email = String(input.value || '').trim();
    if (!EMAIL_OK.test(email)) { input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
    var s = stay();
    if (!asks(s)) { askLeaves(); return; }
    askBusy = true;
    // Busy, but never disabled: a disabled button drops the focus it holds.
    btn.setAttribute('aria-disabled', 'true');
    var sent;
    try { sent = ask(s, email); } catch (e) { sent = Promise.reject(e); }
    function free() { askBusy = false; btn.removeAttribute('aria-disabled'); }
    Promise.resolve(sent).then(function (line) {
      if (!line) { askLeaves(); return; }
      tell(ASK.made);
      asked(line);
    }, askLeaves).then(free, free);
  }

  // Done: the line and the field give way to the done line, read out where focus was.
  function asked(line) {
    if (!card || !askBox || !card.contains(askBox)) return;
    var had = askBox.contains(document.activeElement);
    var d = document.createElement('p');
    d.className = 'lf-talk__p lf-talk__done';
    d.id = 'lf-talk-ad';
    d.setAttribute('role', 'status');
    d.tabIndex = -1;
    d.textContent = line;
    askBox.querySelectorAll('.lf-talk__p, .lf-talk__form').forEach(function (n) { n.remove(); });
    askBox.appendChild(d);
    card.setAttribute('aria-describedby', 'lf-talk-ad');
    if (had) { try { d.focus({ preventScroll: true }); } catch (e) { d.focus(); } }
    queuePlace();
  }

  // Refused, not there, or no network: the email part leaves without a word and the call line stays.
  function askLeaves() {
    if (!card || !askBox || !card.contains(askBox)) { askBox = null; return; }
    var had = askBox.contains(document.activeElement);
    askBox.remove();
    askBox = null;
    card.classList.remove('has-ask');
    card.setAttribute('aria-labelledby', 'lf-talk-h');
    card.setAttribute('aria-describedby', 'lf-talk-p');
    if (had) { try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); } }
    queuePlace();
  }
  // The visitor is writing in the card's own field: it holds still until they leave it.
  function writingHere() {
    var a = document.activeElement;
    return !!(card && a && a.tagName === 'INPUT' && card.contains(a));
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
    if (!card || writingHere()) return;
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

  function show(withAsk) {
    if (card) return;
    markSeen();
    back = document.activeElement;
    card = build(!!withAsk);
    body.appendChild(card);
    place();
    // The next frame, so the rise plays (none under reduced motion).
    requestAnimationFrame(function () { if (card) card.classList.add('is-in'); });
    card.addEventListener('transitionend', queuePlace);   // measured again where the rise ends
    // Focus moves to the card (nothing is being typed: maybeShow waited for that) and goes back on close.
    try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('scroll', queuePlace, { passive: true });
    window.addEventListener('resize', queuePlace);
    card.addEventListener('focusout', queuePlace);   // out of the card's field: measured again
    tell('card_shown');
    if (askBox) tell(ASK.shown);
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
