/* ============================================================
   LOXLEY FOREST · the January giveaway's invitation
   A small card that points a visitor to /giveaway (the table of
   2026-11-07, chief docs/briefs/2026-11-07-table-giveaway-popup.md,
   the Critic's fixes whole). Ours, not a pop-up kit: no countdown,
   no scarcity, one button.

   Where it may show (PAGES below): the home page, the treehouse,
   experiences, gallery, our story, the local guide, questions.
   Never on /book, /gift, checkout, manage, the confirmations, the
   elopement pages and their landing pages, /giveaway itself, or any
   page that loads js/talk.js (two cards from one mouse-out).
   When: on a phone, a bottom sheet on the second page of the visit,
   never full screen, never on first landing; on a desktop, only when
   the pointer leaves the top of the window after the first 5 s.
   Once per visitor, kept in localStorage; never after an entry (the
   mark set on /giveaway-entered); one visitor in three is a holdout
   who never sees it, decided once and kept. Dismissed, it folds to one
   line under the header for the rest of the visit.
   /book gets no card: one quiet line under the hero, in the page's
   HTML, which this script only reveals.

   It tells our own booking server popup_shown, popup_close,
   popup_click and, for the holdout, popup_held_out (the Forge,
   2026-11-07), once each a visit, through the page beacon
   (window.lfFunnel, js/funnel.js): the visit's id, the step, the
   page's path, and the visit's src and referrer as funnel.js keeps
   them. Nothing typed by anyone, nothing about the
   person. The button carries ?src=giveaway-ads when the visit landed
   from an ad (gclid, gbraid, wbraid or utm_source=google on the
   landing URL, as the engine's funnel reads it), else giveaway-site.

   THE WORDS are the giveaway page's (scripts/site/pages/giveaway.py
   WORDS, in Mick's one hash), written into each page as JSON by the
   builder (#lf-gw-words). No words live here.
   ============================================================ */
(function () {
  'use strict';

  // THE PULL SWITCH. false: no card, no folded line, no /book line, anywhere; the rules page and
  // the form at /giveaway never move either way. true on Mick's "live"; false again on the trigger
  // he pre-rules (chief docs/terms.md), one push. scripts/site/check_popup.js proves both states.
  // true since 2026-11-12 about 10:15 ET, the same push that opened the form (pages/giveaway.py
  // OPEN), after Mick ran the engine's open line himself at about 10:12.
  var LIVE = true;

  var body = document.body;
  if (!body || !document.querySelector) return;
  var PATH = body.getAttribute('data-lf-path') || '';
  var API = body.getAttribute('data-lf-api') || '';

  var PAGES = { '/': 1, '/treehouses': 1, '/experiences': 1, '/gallery': 1, '/our-story': 1, '/local-guide': 1, '/faq': 1 };
  var KEY = 'lf_giveaway';     // localStorage, this visitor: {holdout, shown, entered}
  var VIEWS = 'lf_gw_views';   // sessionStorage, this visit: pages seen
  var ADS = 'lf_gw_ads';       // sessionStorage: '1' when the visit landed from an ad
  var FOLD = 'lf_gw_fold';     // sessionStorage: dismissed this visit, so the folded line stays
  var TOLD = 'lf_gw_told';     // sessionStorage: steps already told this visit
  var EXIT_ARM = 5;            // s on the page before the pointer leaving counts
  var SHEET_DELAY = 1500;      // ms after the second page is in view
  var HOLDOUT = 1 / 3;

  function ss(k, v) {
    try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, String(v)); } catch (e) {}
    return null;
  }
  function load() {
    try { var m = JSON.parse(localStorage.getItem(KEY) || 'null'); return m && typeof m === 'object' ? m : {}; } catch (e) { return {}; }
  }
  function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }
  var m = load();

  // The entered page: remember the entry, show nothing, ever again.
  if (PATH === '/giveaway-entered') {
    if (!m.entered) { m.entered = Date.now(); save(m); }
    return;
  }

  // The visit's pages, and whether it landed from an ad (read once, on its first page).
  var views = (parseInt(ss(VIEWS), 10) || 0) + 1;
  ss(VIEWS, views);
  var entry = null;
  try { entry = JSON.parse(sessionStorage.getItem('gh_entry') || 'null'); } catch (e) {}
  if (!entry || typeof entry !== 'object') entry = {};
  var ads;
  if (views === 1) {
    var q = location.search || '';
    ads = /[?&](gclid|gbraid|wbraid)=/.test(q) || /[?&]utm_source=google(&|$)/i.test(q) || entry.src === 'google-ads';
    ss(ADS, ads ? '1' : '0');
  } else {
    ads = ss(ADS) === '1';
  }
  var HREF = '/giveaway?src=' + (ads ? 'giveaway-ads' : 'giveaway-site');

  if (!LIVE) return;

  // The words, from the page (the builder writes them from the giveaway page's WORDS).
  var words = null;
  try { var el = document.getElementById('lf-gw-words'); words = el ? JSON.parse(el.textContent) : null; } catch (e) {}
  if (!words || !words.h) return;
  // Only while the form is open: the builder writes open (Mick's yes, the address and the day set)
  // and the close (the page's own clock); neither the card nor /book's line says "free to enter"
  // to a closed form (the Critic, 2026-11-07).
  if (!words.open) return;
  try { if (words.closes && Date.now() > Date.UTC.apply(null, words.closes)) return; } catch (e) { return; }

  // /book: the quiet line under the hero, and nothing else.
  if (PATH === '/book') {
    var line = document.getElementById('lf-gw-line');
    if (line) {
      var a = line.querySelector('a');
      if (a) a.setAttribute('href', HREF);
      line.hidden = false;
    }
    return;
  }

  if (!PAGES[PATH]) return;
  if (document.querySelector('script[src$="talk.js"]')) return;
  if (m.entered) return;
  // The holdout, one visitor in three, decided once and kept: never shown the card, but told as
  // popup_held_out at the moment and on the page it would have shown (the Forge, 2026-11-07), so
  // the held-out visits' picked-dates rate can be read against the shown ones'.
  if (m.holdout === undefined) { m.holdout = Math.random() < HOLDOUT; save(m); }

  function tell(step) {
    try {
      var told = (ss(TOLD) || '').split(',');
      if (told.indexOf(step) >= 0) return;
      told.push(step); ss(TOLD, told.filter(Boolean).join(','));
      var f = window.lfFunnel;
      if (f && f.send && API && PATH) f.send(API, { visit: f.visit, step: step, path: PATH, src: entry.src, referrer: entry.referrer });
    } catch (e) {}
  }

  // ---- the folded line (after a dismissal, for the rest of the visit)
  function fold() {
    if (document.getElementById('lf-gwbar')) return;
    var bar = document.createElement('div');
    bar.className = 'lf-gwbar';
    bar.id = 'lf-gwbar';
    var t = document.createElement('span');
    t.textContent = words.fold;
    var l = document.createElement('a');
    l.href = HREF;
    l.textContent = words.foldLink;
    l.addEventListener('click', function () { tell('popup_click'); });
    bar.appendChild(t); bar.appendChild(l);
    body.appendChild(bar);
  }

  if (m.shown) { if (ss(FOLD) === '1') fold(); return; }   // once per visitor

  var phone = !(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  var done = false, card = null, secs = 0;

  var TEXTY = /^(text|email|tel|number|search|url|password|date|datetime-local|month|week|time)$/i;
  function inField() {
    var a = document.activeElement;
    if (!a || a === body || a === document.documentElement) return false;
    var tag = a.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'IFRAME' || a.isContentEditable) return true;
    return tag === 'INPUT' && TEXTY.test(a.type || 'text');
  }
  function menuOpen() { return document.documentElement.classList.contains('lf-menu-open'); }

  function maybeShow() {
    if (done) return;
    if (inField() || menuOpen() || document.visibilityState !== 'visible') return;
    done = true;
    // The holdout follows the card's own once-per-visitor rule (the Critic, 2026-11-07): counted
    // at its first exposure only, so held-out and shown visits compare like with like.
    if (m.holdout) { m.shown = Date.now(); save(m); tell('popup_held_out'); return; }
    show();
  }

  if (phone) {
    if (views >= 2) setTimeout(maybeShow, SHEET_DELAY);
  } else {
    var timer = setInterval(function () { if (document.visibilityState === 'visible') secs++; if (done) clearInterval(timer); }, 1000);
    document.addEventListener('mouseout', function (e) {
      // Out of the page (no element to go to) through its top 10 px: the tab bar or the address bar.
      if (done || e.relatedTarget || e.clientY > 10 || secs < EXIT_ARM) return;
      maybeShow();
    });
  }

  // ---- the card
  function build() {
    var c = document.createElement('aside');
    c.className = 'lf-gw' + (phone ? ' is-sheet' : '');
    c.id = 'lf-gw';
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-modal', 'false');
    c.setAttribute('aria-labelledby', 'lf-gw-h');
    c.setAttribute('aria-describedby', 'lf-gw-p');
    c.tabIndex = -1;

    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'lf-gw__x';
    x.setAttribute('aria-label', words.close);
    x.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
    x.addEventListener('click', dismiss);

    var ph = document.createElement('div');
    ph.className = 'lf-gw__photo';
    if (words.photo) {
      var img = document.createElement('img');
      img.src = words.photo;
      img.alt = words.photoAlt || '';
      img.width = 800; img.height = 533;
      img.decoding = 'async';
      ph.appendChild(img);
    }

    var inner = document.createElement('div');
    inner.className = 'lf-gw__in';
    var h = document.createElement('h2');
    h.className = 'lf-gw__h';
    h.id = 'lf-gw-h';
    h.textContent = words.h;
    var p = document.createElement('p');
    p.className = 'lf-gw__p';
    p.id = 'lf-gw-p';
    p.textContent = words.p;
    var btn = document.createElement('a');
    btn.className = 'lf-btn lf-gw__btn';
    btn.href = HREF;
    btn.textContent = words.button;
    btn.addEventListener('click', function () { tell('popup_click'); });
    inner.appendChild(h); inner.appendChild(p); inner.appendChild(btn);

    c.appendChild(x); c.appendChild(ph); c.appendChild(inner);
    return c;
  }

  function show() {
    card = build();
    body.appendChild(card);
    m.shown = Date.now(); save(m);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      card.classList.add('is-in');
      tell('popup_shown');
      try { card.focus({ preventScroll: true }); } catch (e) {}
    }); });
    document.addEventListener('keydown', onKey, true);
  }

  function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') dismiss(); }

  function dismiss() {
    if (!card) return;
    document.removeEventListener('keydown', onKey, true);
    var c = card; card = null;
    c.classList.remove('is-in');
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 350);
    tell('popup_close');
    ss(FOLD, '1');
    fold();
  }
})();
