/* ============================================================
   THE GOLDEN ARROW · the purchase panel (/gift) and the card (/gift/card)
   The house's gift of three nights and the Dawn Table (Mick,
   2026-10-25). Loaded after js/gatehouse.js, whose helpers it uses
   (window.Gatehouse: el, api, money, the phone). Every sentence it
   shows is in the page's JSON block (id lf-gift-words), written by
   scripts/site/pages/gift.py from its WORDS (awaiting Mick).

   The engine (book.loxleyforest.com, loxley-rescue ceo/golden-arrow,
   cdb68bc):
     POST /v1/gift/checkout {product, email, giver_name,
          recipient_names, ship_to?{name, line1, line2, city, state
          (two letters), zip (five digits)}} -> {url, total_cents};
          400 or 503 {error: a sentence}. Stripe returns the buyer to
          /gift/thanks?session_id=..., or to /gift on the way back.
     GET  /v1/gift?code=LF-XXXX-XXXX -> {code, product, name, status
          (issued, redeemed or void), recipient_names, giver_name,
          covers, never_expires, includes}; 404 {error: a sentence}.
   Each has its own door (sales, lookup). A door that is off answers
   404 with the engine's bare {"error": "not found"}, as for a path it
   does not have: the panel then says to call or text Mick. Anything
   the engine refuses is a sentence, shown as is.

   The card's code arrives after # and the keys script in the head
   (scripts/site/build_v2.py KEYS_SCRIPT) has already lifted it out
   of the address bar into window.__ghKeys before Tag Manager loads.
   It goes to our own booking server and nowhere else: never a
   beacon, never the tag manager, never an <a href> a tag could
   read (the buttons below navigate by script, as /book does).
   ============================================================ */
(function () {
  'use strict';

  var G = window.Gatehouse;
  if (!G) return;
  var el = G.el;

  var W = (function () {
    try { var n = document.getElementById('lf-gift-words'); return (n && JSON.parse(n.textContent)) || {}; } catch (e) { return {}; }
  })();
  function w(k) { return W[k] || ''; }
  // The engine's refusal, as it wrote it, then Mick's number; our own words when it gave none.
  function said(e, fallback) {
    var t = e && e.body && typeof e.body.error === 'string' ? e.body.error.trim() : '';
    return t ? t + ' ' + w('questions') : (e && e.message) || w(fallback);
  }

  // The engine's own answer for a door that is off (or a path it does not have).
  function routeOff(e) { return !!(e && e.status === 404 && e.body && e.body.error === 'not found'); }
  // No answer at all, a timeout, or the server's own failure.
  function unreachable(e) { return !e || !e.status || e.status >= 500; }

  var PRODUCT = 'golden-arrow';
  var USABLE = { issued: 1 };
  var USED = { redeemed: 1 };
  var STRIPE = /^https:\/\/([a-z0-9-]+\.)*stripe\.com\//i;

  // Two taps for the phone, under a sentence that already gives the number.
  function callLine() {
    return el('div', { 'class': 'ga-calls' }, [
      el('a', { 'class': 'lf-btn gh-btn--quiet', href: G.TEL, text: w('call_mick') }),
      el('a', { 'class': 'lf-btn gh-btn--quiet', href: G.SMS, text: w('text_mick') })]);
  }

  // The card's dedication must sit beside the photograph, never under it: long names step down
  // (--ns, the names' scale), five per cent at a time, to half size at the most. Everything on the
  // card is in units of its width, so the scale that fits here fits on any screen and on paper.
  function fit(card) {
    var side = card.querySelector('.ga-side'), arch = card.querySelector('.ga-arch');
    if (!side || !arch) return;
    var ns = 1;
    card.style.removeProperty('--ns');
    while (side.scrollHeight > arch.offsetHeight + 1 && ns > 0.5) {
      ns = Math.round((ns - 0.05) * 100) / 100;
      card.style.setProperty('--ns', String(ns));
    }
  }
  function fitAll() { document.querySelectorAll('.ga-card').forEach(fit); }
  fitAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  // ================================================== /gift: the purchase panel

  function Buy(root) {
    var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
    var f = { recipient_names: '', giver_name: '', email: '', mail: false,
              ship: { name: '', line1: '', line2: '', city: '', state: '', zip: '' } };
    var opened = null;          // {key, res, at}: a payment page already made for these exact details
    var error = '';

    function show(nodes) { root.replaceChildren.apply(root, nodes); }

    function off(kind) {
      // The lead above promises a price before paying; with no way to pay here, it steps aside.
      var lead = document.querySelector('.ga-give__lead');
      if (lead) lead.hidden = true;
      show([el('div', { 'class': 'ga-panel', role: 'status' }, [
        el('p', { 'class': 'ga-panel__lead', text: w(kind) }), callLine()])]);
    }

    function field(id, key, label, opts) {
      opts = opts || {};
      var obj = opts.ship ? f.ship : f;
      var input = el('input', { id: id, name: key, type: opts.type || 'text', autocomplete: opts.auto || null,
        inputmode: opts.mode || null, maxlength: opts.max || 120, required: opts.optional ? null : 'required',
        'aria-describedby': opts.hint ? id + '-hint' : null, value: obj[key] || '',
        oninput: function (e) { obj[key] = e.target.value; } });
      return el('div', { 'class': 'gh-field' }, [
        el('label', { 'for': id, text: label + (opts.optional ? ' ' + w('optional') : '') }), input,
        opts.hint ? el('small', { id: id + '-hint', text: opts.hint }) : null]);
    }

    function form() {
      var err = el('p', { 'class': 'gh-error', id: 'ga-error', role: 'alert', text: error });
      var mail = el('input', { type: 'checkbox', id: 'ga-mail', name: 'mail', checked: f.mail ? 'checked' : null,
        onchange: function (e) { f.mail = e.target.checked; ship.hidden = !f.mail; } });
      var ship = el('fieldset', { 'class': 'ga-ship', hidden: f.mail ? null : 'hidden' }, [
        el('legend', { 'class': 'gh-eyebrow', text: w('mail_label') }),
        field('ga-ship-name', 'name', w('ship_name'), { ship: true, auto: 'shipping name' }),
        field('ga-ship-line1', 'line1', w('ship_line1'), { ship: true, auto: 'shipping address-line1' }),
        field('ga-ship-line2', 'line2', w('ship_line2'), { ship: true, auto: 'shipping address-line2', optional: true }),
        field('ga-ship-city', 'city', w('ship_city'), { ship: true, auto: 'shipping address-level2' }),
        el('div', { 'class': 'ga-row2' }, [
          field('ga-ship-state', 'state', w('ship_state'), { ship: true, auto: 'shipping address-level1', max: 2 }),
          field('ga-ship-zip', 'zip', w('ship_zip'), { ship: true, auto: 'shipping postal-code', mode: 'numeric', max: 5 })])
      ]);
      var btn = el('button', { type: 'submit', 'class': 'lf-btn gh-btn--dark gh-cta', text: w('continue') });
      return el('form', { 'class': 'ga-form', novalidate: 'novalidate', onsubmit: function (ev) { ev.preventDefault(); submit(ev.target, btn, err); } }, [
        field('ga-for', 'recipient_names', w('for_label'), { hint: w('for_hint'), auto: 'off', max: 80 }),
        field('ga-from', 'giver_name', w('from_label'), { hint: w('from_hint'), auto: 'name', max: 80 }),
        field('ga-email', 'email', w('email_label'), { type: 'email', auto: 'email', mode: 'email' }),
        el('label', { 'class': 'gh-optin', 'for': 'ga-mail' }, [mail, el('span', { text: w('mail_label') })]),
        ship, err, btn]);
    }

    function body() {
      var b = { product: PRODUCT, email: f.email.trim(), giver_name: f.giver_name.trim(), recipient_names: f.recipient_names.trim() };
      if (f.mail) {
        b.ship_to = {};
        ['name', 'line1', 'line2', 'city', 'state', 'zip'].forEach(function (k) { b.ship_to[k] = String(f.ship[k] || '').trim(); });
        b.ship_to.state = b.ship_to.state.toUpperCase();
      }
      return b;
    }

    function problem(b) {
      if (!b.recipient_names) return ['need_for', 'ga-for'];
      if (!b.giver_name) return ['need_from', 'ga-from'];
      if (!/^\S+@\S+\.\S+$/.test(b.email)) return ['need_email', 'ga-email'];
      if (b.ship_to) {
        // The engine's rule: the state as two letters, the ZIP as five digits.
        var s = b.ship_to, miss = !s.name ? 'name' : !s.line1 ? 'line1' : !s.city ? 'city' : '';
        if (miss) return ['need_address', 'ga-ship-' + miss];
        if (!/^[A-Z]{2}$/.test(s.state)) return ['need_state', 'ga-ship-state'];
        if (!/^\d{5}$/.test(s.zip)) return ['need_zip', 'ga-ship-zip'];
      }
      return null;
    }

    function submit(formEl, btn, err) {
      var b = body(), p = problem(b);
      if (p) {
        error = w(p[0]); err.textContent = error;
        var x = document.getElementById(p[1]); if (x && x.focus) x.focus();
        return;
      }
      error = ''; err.textContent = '';
      var key = JSON.stringify(b);
      // Same details within the half hour: the payment page already made, never a second one.
      if (opened && opened.key === key && Date.now() - opened.at < 25 * 60 * 1000) return confirm(opened.res, b);
      btn.disabled = true; btn.textContent = w('adding');
      G.api(API, '/v1/gift/checkout', b, 20000).then(function (res) {
        if (!res || !STRIPE.test(String(res.url || ''))) throw new Error(w('no_payment'));
        opened = { key: key, res: res, at: Date.now() };
        confirm(res, b);
      }).catch(function (e) {
        if (routeOff(e)) return off('off');
        error = e && e.body && e.body.error ? said(e) : (e && e.message) || w('no_payment');
        err.textContent = error; btn.disabled = false; btn.textContent = w('continue');
      });
    }

    // The purchase step: the whole amount, from the engine, right before Stripe. Never in the
    // page's prose (Mick, 2026-10-19). A Google Ads conversion for a gift bought is NOT here: it
    // would fire on Stripe's return, a page view of /gift/thanks, as an Ads account change
    // (Mick's clicks).
    function confirm(res, b) {
      var total = Number(res.total_cents);
      var amount = [];
      if (total > 0) {
        var dl = el('dl', { 'class': 'gh-lines' });
        (Array.isArray(res.lines) ? res.lines : []).forEach(function (l) {
          if (!l || !l.label || !isFinite(Number(l.cents))) return;
          dl.appendChild(el('dt', { text: String(l.label) }));
          dl.appendChild(el('dd', { text: G.money(Number(l.cents)) }));
        });
        dl.appendChild(el('dt', { 'class': 'gh-total', text: w('total_label') }));
        dl.appendChild(el('dd', { 'class': 'gh-total', text: G.money(total) }));
        amount = [dl, el('p', { 'class': 'gh-fine', text: w('all_in') })];
      } else {
        amount = [el('p', { 'class': 'gh-fine', text: w('total_at_stripe') })];
      }
      var where = b.ship_to ? [b.ship_to.name, b.ship_to.line1, b.ship_to.line2, b.ship_to.city, b.ship_to.state + ' ' + b.ship_to.zip]
        .filter(function (x) { return String(x || '').trim(); }).join(', ') : '';
      var pay = el('button', { type: 'button', 'class': 'lf-btn gh-btn--dark ga-pay', text: w('pay'), onclick: function () {
        pay.disabled = true; pay.textContent = w('leaving');
        location.assign(res.url);
      } });
      var head = el('p', { 'class': 'gh-eyebrow', tabindex: '-1', text: w('confirm_eyebrow') });
      show([el('div', { 'class': 'ga-confirm' }, [
        head,
        el('p', { 'class': 'ga-confirm__names' }, [w('card_for') + ' ' + b.recipient_names, el('span', { text: w('card_from') + ' ' + b.giver_name })]),
        el('p', { 'class': 'gh-fine', text: b.ship_to ? w('confirm_mail') + ' ' + where + '.' : w('confirm_link') }),
        el('div', {}, amount),
        pay,
        el('button', { type: 'button', 'class': 'gh-back', text: w('change'), onclick: function () { show([form()]); } }),
        el('p', { 'class': 'gh-fine', text: w('pay_fine') })
      ])]);
      try { head.focus({ preventScroll: true }); } catch (e) {}
    }

    // Is the sales door open? Asked once, with an empty order: an open door refuses it with a
    // sentence (400, nothing kept; the engine's product check comes before anything is written);
    // a closed one answers {"error": "not found"}. It costs one of the engine's 20 writes per
    // address per ten minutes; a door flag on /v1/health would let this be a read.
    G.api(API, '/v1/gift/checkout', {}, 8000).then(function () { show([form()]); }, function (e) {
      if (routeOff(e)) return off('off');
      if (unreachable(e)) return off('down');
      show([form()]);
    });
  }

  // =================================================== /gift/card: the card

  function Card(root) {
    var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
    var CODE = String((window.__ghKeys || {}).code || '');
    var wait = root.querySelector('[data-ga-wait]'), fig = root.querySelector('[data-ga-card]');
    var note = root.querySelector('[data-ga-note]'), actions = root.querySelector('[data-ga-actions]');
    var keep = root.querySelector('[data-ga-keep]'), out = root.querySelector('[data-ga-share-out]');
    function say(k, text) { wait.hidden = true; note.textContent = text || w(k); note.hidden = false; }

    function draw(g, usable) {
      var card = fig.querySelector('.ga-card');
      card.querySelector('[data-fill="names"]').textContent = String(g.recipient_names || '').trim();
      card.querySelector('[data-fill="giver"]').textContent = String(g.giver_name || '').trim();
      // The gift's number is its code (LF-XXXX-XXXX), as the card prints it: what the couple
      // reads to Mick when they call, and what the link carries.
      var no = card.querySelector('[data-ga-giftno]'), num = String(g.code || '').trim();
      if (no && num) { no.querySelector('[data-fill="giftno"]').textContent = num; no.hidden = false; }
      wait.hidden = true; note.hidden = true;
      fig.hidden = false;
      fit(card);
      actions.hidden = false;
      root.querySelector('[data-ga-dates]').hidden = !usable;
      keep.hidden = !usable;
      if (!usable) { note.textContent = w('card_used'); note.hidden = false; }
    }

    function load() {
      G.api(API, '/v1/gift?code=' + encodeURIComponent(CODE), null, 12000).then(function (g) {
        if (!g || g.product !== PRODUCT) return say('card_unknown');
        var st = String(g.status || '').toLowerCase();
        if (USABLE[st]) return draw(g, true);
        if (USED[st]) return draw(g, false);
        say('card_void');
      }).catch(function (e) {
        if (routeOff(e)) return say('card_off');
        if (unreachable(e)) return say('card_down');
        // A code it cannot find (404), or too many tries (429): the engine's sentence, as is.
        say('card_unknown', e && e.body && e.body.error ? said(e) : '');
      });
    }

    function link() { return location.origin + '/gift/card#code=' + encodeURIComponent(CODE); }

    root.querySelector('[data-ga-print]').addEventListener('click', function () { window.print(); });
    root.querySelector('[data-ga-dates]').addEventListener('click', function () {
      location.assign('/book#gift=' + encodeURIComponent(CODE));
    });
    root.querySelector('[data-ga-share]').addEventListener('click', function () {
      var url = link();
      function manual() {
        var input = el('input', { type: 'text', readonly: 'readonly', value: url, 'aria-label': w('share_manual') });
        out.replaceChildren(el('p', { text: w('share_manual') }), input);
        out.hidden = false;
        input.focus(); input.select();
      }
      function copied() { out.replaceChildren(el('p', { role: 'status', text: w('share_copied') })); out.hidden = false; }
      if (navigator.share) {
        navigator.share({ title: w('card_name'), url: url }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(copied, manual);
      } else manual();
    });

    if (!CODE) return say('card_none');
    load();
  }

  var buy = document.getElementById('ga-buy');
  if (buy) Buy(buy);
  var page = document.getElementById('ga-card-page');
  if (page) Card(page);
})();
