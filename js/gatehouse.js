/* ============================================================
   THE GATEHOUSE · booking on our own domain
   Replaces the Hostfully widget (GATEHOUSE-SPEC.md in loxley-rescue).

   Drop onto any page:
     <div id="gatehouse"
          data-api="https://book.loxleyforest.com"
          data-unit="loxley-forest-canopy-treehouse-dahlonega"
          data-stripe-key="pk_test_..."          (publishable, not a secret)
          data-snapshot="/data/gatehouse-snapshot.json"   (preview only)
          data-fallback="#inquiry"></div>

   The funnel, from the table of 2026-09-27:
     1. pick dates on a live calendar, prices on every open night
     2. the ALL-IN total the moment they are picked, with the Promise beside it
     3. one screen: name, email, phone, agreement, pay (Apple Pay first)
   Every step pushes an event to the dataLayer so, for the first time, we
   can see WHERE people stop, even if we never learn why.

   If the booking service cannot be reached, the component steps aside and
   shows the request-dates form instead (data-fallback), so the site never
   loses a guest to an outage.
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('gatehouse');
  if (!root) return;

  var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
  var UNIT = root.getAttribute('data-unit') || '';
  var STRIPE_KEY = root.getAttribute('data-stripe-key') || '';
  var SNAPSHOT = root.getAttribute('data-snapshot') || '';
  var FALLBACK = root.getAttribute('data-fallback') || '';
  var MONTHS_AHEAD = 12;
  // A held guest returns with ?hold=<token>: their own held nights show as
  // open to them, and booking converts the hold instead of fighting it.
  var HOLD = new URLSearchParams(location.search).get('hold') || '';

  var state = {
    mode: 'live',            // 'live' or 'preview' (snapshot, no payments)
    nights: {},              // 'YYYY-MM-DD' -> {rate_cents, min_stay, max_stay}
    settings: null,          // preview only: the quote's settings
    agreement: null,
    month: null,             // first visible month (Date, day 1)
    checkIn: null,
    checkOut: null,
    quote: null,
    payMode: null,
    busy: false
  };

  // ---------------------------------------------------------------- helpers

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function parse(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function addDays(s, n) {
    var d = parse(s);
    d.setDate(d.getDate() + n);
    return iso(d);
  }

  function daysBetween(a, b) {
    return Math.round((parse(b) - parse(a)) / 86400000);
  }

  function money(cents, exact) {
    var v = cents / 100;
    return '$' + v.toLocaleString('en-US', {
      minimumFractionDigits: exact ? 2 : 0, maximumFractionDigits: exact ? 2 : 0 });
  }

  function pretty(s, withYear) {
    return parse(s).toLocaleDateString('en-US', withYear
      ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
      : { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: event, gh_unit: UNIT };
    Object.keys(data || {}).forEach(function (k) { payload[k] = data[k]; });
    window.dataLayer.push(payload);
  }

  function api(path, body) {
    return fetch(API + path, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    } : {}).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error || 'Something went wrong.');
        return j;
      });
    });
  }

  // ------------------------------------------------ preview: the same quote

  // The preview runs on a snapshot of the real calendar, so it must price
  // exactly as the service does: gatehouse/quote.py, half-up to the cent.
  function pct(cents, rate) {
    return Math.round(Math.round(cents * Number(rate) * 100) / 100);
  }

  function previewQuote(ci, co) {
    var s = state.settings, rates = [], d = ci;
    while (d < co) { rates.push(state.nights[d].rate_cents); d = addDays(d, 1); }
    var rent = rates.reduce(function (a, b) { return a + b; }, 0);
    var mult = pct(rent, s.rate_multiplier);
    var rentTax = pct(rent + mult, s.tax_rate);
    var clean = s.cleaning_cents, cleanTax = pct(clean, s.cleaning_tax_rate);
    var extras = (s.extra_taxes || []).map(function (t) {
      var c = t.per_night_cents ? t.per_night_cents * rates.length
        : pct({ rent: rent + mult, cleaning: clean, both: rent + mult + clean }[t.on || 'rent'], t.rate);
      return { label: t.label, cents: c };
    });
    var total = rent + mult + rentTax + clean + cleanTax +
      extras.reduce(function (a, e) { return a + e.cents; }, 0);
    var lines = [{ label: rates.length + ' night' + (rates.length > 1 ? 's' : ''), cents: rent }];
    if (mult) lines.push({ label: 'Service', cents: mult });
    if (clean) lines.push({ label: 'Cleaning', cents: clean });
    if (rentTax || cleanTax) lines.push({ label: s.sales_tax_label || 'Sales tax', cents: rentTax + cleanTax });
    lines = lines.concat(extras);
    var today = iso(new Date());
    var balanceOn = addDays(ci, -s.balance_days);
    var inFull = balanceOn <= today;
    var deposit = Math.min(s.deposit_cents, total);
    var plans = {};
    if (!inFull) plans.deposit = [{ kind: 'deposit', amount_cents: deposit, due_on: null },
                                  { kind: 'balance', amount_cents: total - deposit, due_on: balanceOn }];
    plans.full = [{ kind: 'full', amount_cents: total, due_on: null }];
    if (s.affirm_enabled) plans.affirm = plans.full;
    return {
      quote: { total_cents: total, lines: lines, nights: rates.length },
      modes: Object.keys(plans), plans: plans,
      gift_if_paid_in_full: daysBetween(today, ci) >= s.gift_min_days_out ? s.pay_in_full_gift : '',
      promise: s
    };
  }

  // ---------------------------------------------------------------- loading

  function load() {
    var from = iso(new Date());
    var toD = new Date(); toD.setMonth(toD.getMonth() + MONTHS_AHEAD);
    var to = iso(toD);
    var live = API ? api('/v1/health').then(function () {
      return Promise.all([
        api('/v1/availability?unit=' + encodeURIComponent(UNIT) + '&from=' + from + '&to=' + to +
          (HOLD ? '&hold=' + encodeURIComponent(HOLD) : '')),
        api('/v1/agreement').catch(function () { return null; })
      ]);
    }).then(function (res) {
      state.mode = 'live';
      res[0].nights.forEach(function (n) { state.nights[n.night] = n; });
      state.agreement = res[1];
    }) : Promise.reject(new Error('no api'));

    return live.catch(function () {
      if (!SNAPSHOT) throw new Error('offline');
      return fetch(SNAPSHOT).then(function (r) { return r.json(); }).then(function (snap) {
        state.mode = 'preview';
        state.settings = snap.settings;
        snap.nights.forEach(function (n) { if (n.open && n.night >= from) state.nights[n.night] = n; });
      });
    });
  }

  // --------------------------------------------------------------- calendar

  function canCheckIn(day) {
    return !!state.nights[day];
  }

  function stayOk(ci, co) {
    var first = state.nights[ci];
    if (!first) return 'That night is not open.';
    var n = daysBetween(ci, co);
    if (n < first.min_stay) return 'A stay starting ' + pretty(ci) + ' is at least ' + first.min_stay + ' nights.';
    if (n > first.max_stay) return 'A stay starting ' + pretty(ci) + ' is at most ' + first.max_stay + ' nights.';
    for (var d = ci; d < co; d = addDays(d, 1)) {
      if (!state.nights[d]) return pretty(d) + ' is already taken.';
    }
    return '';
  }

  function pick(day) {
    if (state.busy) return;
    if (!state.checkIn || state.checkOut || day <= state.checkIn) {
      if (!canCheckIn(day)) return;
      state.checkIn = day; state.checkOut = null; state.quote = null;
      setNote('Now choose your check-out day.');
      track('gh_checkin_chosen', { gh_check_in: day });
    } else {
      var why = stayOk(state.checkIn, day);
      if (why) { setNote(why); return; }
      state.checkOut = day;
      setNote('');
      getQuote();
    }
    render();
  }

  var noteEl;
  function setNote(t) { if (noteEl) noteEl.textContent = t; }

  function monthGrid(first) {
    var y = first.getFullYear(), m = first.getMonth();
    var label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var grid = el('div', { 'class': 'gh-grid', role: 'grid', 'aria-label': label });
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (w) {
      grid.appendChild(el('span', { 'class': 'gh-dow', 'aria-hidden': 'true', text: w }));
    });
    var lead = new Date(y, m, 1).getDay();
    for (var i = 0; i < lead; i++) grid.appendChild(el('span', { 'class': 'gh-pad' }));
    var days = new Date(y, m + 1, 0).getDate();
    var today = iso(new Date());
    for (var d = 1; d <= days; d++) {
      var day = iso(new Date(y, m, d));
      var night = state.nights[day];
      var inRange = state.checkIn && state.checkOut && day > state.checkIn && day < state.checkOut;
      var isEdge = day === state.checkIn || day === state.checkOut;
      // A check-out day may fall on a night someone else has: they leave
      // that morning. So after a check-in, the next taken night is still
      // selectable as the end of the stay.
      var endable = state.checkIn && !state.checkOut && day > state.checkIn && !stayOk(state.checkIn, day);
      var usable = day >= today && (night || endable);
      var cls = 'gh-day' + (night ? '' : ' gh-day--taken') + (inRange ? ' gh-day--range' : '') +
        (isEdge ? ' gh-day--edge' : '') + (endable ? ' gh-day--endable' : '');
      var labelTxt = pretty(day, true) + (night ? ', ' + money(night.rate_cents) + ' a night' : ', not available');
      var btn = el('button', {
        type: 'button', 'class': cls, 'aria-label': labelTxt,
        'aria-pressed': isEdge ? 'true' : 'false', disabled: usable ? null : 'disabled',
        onclick: (function (x) { return function () { pick(x); }; })(day)
      }, [el('span', { 'class': 'gh-num', text: String(d) }),
          el('span', { 'class': 'gh-rate', text: night && day >= today ? money(night.rate_cents) : '' })]);
      grid.appendChild(btn);
    }
    return el('div', { 'class': 'gh-month' }, [el('h3', { 'class': 'gh-month__name', text: label }), grid]);
  }

  // ----------------------------------------------------------------- quote

  function getQuote() {
    state.busy = true; render();
    var p = state.mode === 'preview'
      ? Promise.resolve(previewQuote(state.checkIn, state.checkOut))
      : api('/v1/quote?unit=' + encodeURIComponent(UNIT) + '&check_in=' + state.checkIn + '&check_out=' + state.checkOut);
    p.then(function (q) {
      state.quote = q;
      state.payMode = q.modes[0];
      track('gh_dates_chosen', { gh_check_in: state.checkIn, gh_check_out: state.checkOut,
        gh_nights: q.quote.nights, value: q.quote.total_cents / 100, currency: 'USD' });
    }).catch(function (e) { setNote(e.message); state.checkOut = null; })
      .then(function () { state.busy = false; render(); });
  }

  function planLine(mode, q) {
    var plan = q.plans[mode];
    if (mode === 'deposit') {
      return { title: money(plan[0].amount_cents) + ' today reserves it',
               sub: 'The rest, ' + money(plan[1].amount_cents, true) + ', on ' + pretty(plan[1].due_on) + '.' };
    }
    if (mode === 'affirm') {
      return { title: 'Pay monthly with Affirm',
               sub: 'Choose a plan at checkout. Subject to approval.' };
    }
    return { title: 'Pay in full, ' + money(plan[0].amount_cents, true),
             sub: q.gift_if_paid_in_full ? 'Your first morning brings an ' + q.gift_if_paid_in_full.replace(', first morning', '') + '.' : 'Nothing more to pay.' };
  }

  function summary() {
    var q = state.quote;
    if (!state.checkIn) {
      return el('div', { 'class': 'gh-summary gh-summary--empty' }, [
        el('p', { 'class': 'gh-eyebrow', text: 'Your stay' }),
        el('p', { 'class': 'gh-lead', text: 'Choose your nights on the calendar. You will see the full price, everything included, before we ask for a thing.' })
      ]);
    }
    if (!q) {
      return el('div', { 'class': 'gh-summary gh-summary--empty' }, [
        el('p', { 'class': 'gh-eyebrow', text: 'Your stay' }),
        el('p', { 'class': 'gh-lead', text: 'Arriving ' + pretty(state.checkIn) + '. Now choose your check-out day.' })
      ]);
    }
    var lines = el('dl', { 'class': 'gh-lines' });
    q.quote.lines.forEach(function (l) {
      lines.appendChild(el('dt', { text: l.label }));
      lines.appendChild(el('dd', { text: money(l.cents, true) }));
    });
    lines.appendChild(el('dt', { 'class': 'gh-total', text: 'Total' }));
    lines.appendChild(el('dd', { 'class': 'gh-total', text: money(q.quote.total_cents, true) }));

    var options = el('fieldset', { 'class': 'gh-options' }, [el('legend', { text: 'How would you like to pay?' })]);
    q.modes.forEach(function (m) {
      var pl = planLine(m, q);
      options.appendChild(el('label', { 'class': 'gh-option' + (state.payMode === m ? ' is-on' : '') }, [
        el('input', { type: 'radio', name: 'gh-pay', value: m, checked: state.payMode === m ? 'checked' : null,
          onchange: function () { state.payMode = m; track('gh_payment_mode', { gh_mode: m }); render(); } }),
        el('span', {}, [el('strong', { text: pl.title }), el('span', { text: pl.sub })])
      ]));
    });
    if (q.modes.indexOf('deposit') < 0) {
      options.appendChild(el('p', { 'class': 'gh-fine', text: 'Stays within ' + q.promise.balance_days + ' days of arrival are paid in full at booking.' }));
    }

    var cta = state.payMode === 'deposit'
      ? 'Reserve for ' + money(q.plans.deposit[0].amount_cents)
      : state.payMode === 'affirm' ? 'Continue with Affirm' : 'Book for ' + money(q.quote.total_cents, true);

    return el('div', { 'class': 'gh-summary', 'aria-live': 'polite' }, [
      el('p', { 'class': 'gh-eyebrow', text: 'Your stay' }),
      el('p', { 'class': 'gh-dates', text: pretty(state.checkIn) + ' to ' + pretty(state.checkOut) }),
      lines,
      options,
      el('button', { type: 'button', 'class': 'btn btn--primary gh-cta', onclick: toCheckout, text: cta }),
      el('button', { type: 'button', 'class': 'gh-link', onclick: holdDates,
        text: 'Not ready? Hold these dates for ' + q.promise.hold_hours + ' hours' }),
      promiseBlock(q.promise)
    ]);
  }

  // The Promise, next to the button, where the decision is made. Draft lines
  // restating the ruled terms; wording [MICK RATIFIES] before launch.
  function promiseBlock(p) {
    return el('ul', { 'class': 'gh-promise', 'aria-label': 'The Loxley Promise' }, [
      el('li', { text: 'Plans change. Move your stay once, free, to any open date within 12 months, up to ' + p.lock_days + ' days before arrival.' }),
      el('li', { text: 'Everything you have paid carries to your new dates.' }),
      el('li', { text: 'Within ' + p.lock_days + ' days of arrival, your stay is set.' }),
      el('li', { text: 'No cash refunds.' })
    ]);
  }

  // --------------------------------------------------------------- checkout

  function field(name, label, type, required, extra) {
    var attrs = { id: 'gh-' + name, name: name, type: type || 'text', autocomplete: extra || null };
    if (required) attrs.required = 'required';
    return el('div', { 'class': 'gh-field' }, [
      el('label', { 'for': 'gh-' + name, text: label + (required ? '' : ' (optional)') }),
      el('input', attrs)
    ]);
  }

  function toCheckout() {
    state.step = 'details';
    track('begin_checkout', { value: state.quote.quote.total_cents / 100, currency: 'USD',
      gh_mode: state.payMode, gh_check_in: state.checkIn, gh_check_out: state.checkOut });
    render();
    var first = document.getElementById('gh-first_name');
    if (first) first.focus();
  }

  function details() {
    var q = state.quote;
    var agreeLink = el('button', { type: 'button', 'class': 'gh-link gh-inline', text: 'rental agreement',
      onclick: showAgreement });
    var form = el('form', { 'class': 'gh-form', novalidate: 'novalidate', onsubmit: submit }, [
      el('p', { 'class': 'gh-eyebrow', text: pretty(state.checkIn) + ' to ' + pretty(state.checkOut) + ' · ' + money(q.quote.total_cents, true) }),
      el('div', { 'class': 'gh-row' }, [field('first_name', 'First name', 'text', true, 'given-name'),
                                       field('last_name', 'Last name', 'text', true, 'family-name')]),
      field('email', 'Email', 'email', true, 'email'),
      field('phone', 'Mobile', 'tel', true, 'tel'),
      field('occasion', 'Celebrating something?', 'text', false, 'off'),
      state.payMode === 'hold'
        ? el('p', { 'class': 'gh-fine', text: 'We hold these nights for ' + q.promise.hold_hours +
            ' hours. Your card is authorized for ' + money(Math.min(q.promise.deposit_cents, q.quote.total_cents)) +
            ' but not charged; if you do not book, the hold simply lets go.' })
        : el('div', { 'class': 'gh-terms' }, [
            // Shown in full, not only linked: Stripe's dispute guidance says a
            // checkbox with only a link may be rejected as evidence, and "a full
            // copy of your policies prior to their purchase" is what holds.
            el('p', { 'class': 'gh-eyebrow', text: 'The Loxley Promise' }),
            promiseBlock(q.promise),
            el('div', { 'class': 'gh-agreement', tabindex: '0', 'aria-label': 'Rental agreement',
              text: state.agreement ? state.agreement.text : 'The rental agreement appears here once it is published. [Preview]' })
          ]),
      state.payMode === 'hold' ? null
        : el('label', { 'class': 'gh-agree' }, [
            el('input', { type: 'checkbox', id: 'gh-agree', required: 'required' }),
            el('span', {}, ['I have read and agree to the ', agreeLink, ' and the Loxley Promise.'])
          ]),
      el('p', { 'class': 'gh-error', id: 'gh-error', role: 'alert' }),
      el('button', { type: 'submit', 'class': 'btn btn--primary gh-cta',
        text: state.payMode === 'hold' ? 'Hold my dates' : 'Continue to payment' }),
      el('button', { type: 'button', 'class': 'gh-link', text: 'Back to dates',
        onclick: function () { state.step = null; render(); } })
    ]);
    return el('div', { 'class': 'gh-checkout' }, [form, el('div', { id: 'gh-pay', 'class': 'gh-pay' })]);
  }

  function showAgreement() {
    var text = state.agreement ? state.agreement.text
      : 'The rental agreement appears here once it is published. [Preview]';
    var dlg = el('dialog', { 'class': 'gh-dialog', 'aria-label': 'Rental agreement' }, [
      el('div', { 'class': 'gh-dialog__body', text: text }),
      el('button', { type: 'button', 'class': 'btn btn--secondary', text: 'Close',
        onclick: function () { dlg.close(); dlg.remove(); } })
    ]);
    document.body.appendChild(dlg);
    if (dlg.showModal) dlg.showModal();
  }

  function values(form) {
    var v = {};
    ['first_name', 'last_name', 'email', 'phone', 'occasion'].forEach(function (k) {
      v[k] = (form.elements[k].value || '').trim();
    });
    return v;
  }

  function submit(ev) {
    ev.preventDefault();
    var form = ev.target, err = document.getElementById('gh-error');
    var v = values(form);
    if (!v.first_name || !v.last_name || !/^\S+@\S+\.\S+$/.test(v.email) || !v.phone) {
      err.textContent = 'Please fill in your name, a working email and your mobile.'; return;
    }
    var holding = state.payMode === 'hold';
    if (!holding && !document.getElementById('gh-agree').checked) {
      err.textContent = 'Please read and accept the rental agreement.'; return;
    }
    err.textContent = '';
    track('add_payment_info', { gh_mode: state.payMode });
    if (state.mode === 'preview') {
      document.getElementById('gh-pay').textContent =
        'Preview: in the live version, secure payment opens right here, with Apple Pay and Google Pay first. Nothing has been charged.';
      return;
    }
    var body = { unit: UNIT, check_in: state.checkIn, check_out: state.checkOut, mode: state.payMode,
      agreement_version: state.agreement && state.agreement.version, hold: HOLD || undefined };
    Object.keys(v).forEach(function (k) { body[k] = v[k]; });
    form.querySelector('[type=submit]').disabled = true;
    api(holding ? '/v1/hold' : '/v1/checkout', body).then(function (res) {
      state.stay = res.stay;
      return mountStripe(res.client_secret);
    }).catch(function (e) {
      err.textContent = e.message;
      form.querySelector('[type=submit]').disabled = false;
    });
  }

  function holdDates() {
    track('gh_hold_started', { gh_check_in: state.checkIn, gh_check_out: state.checkOut });
    state.payMode = 'hold';
    toCheckout();
  }

  function loadStripe() {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = function () { ok(window.Stripe); };
      s.onerror = function () { fail(new Error('Payments could not load. Please try again.')); };
      document.head.appendChild(s);
    });
  }

  function mountStripe(secret) {
    return loadStripe().then(function (Stripe) {
      var stripe = Stripe(STRIPE_KEY);
      return stripe.initEmbeddedCheckout({ fetchClientSecret: function () { return Promise.resolve(secret); } });
    }).then(function (checkout) {
      document.querySelector('.gh-form').hidden = true;
      checkout.mount('#gh-pay');
    });
  }

  // ----------------------------------------------------------------- render

  function render() {
    var months = el('div', { 'class': 'gh-months' }, [monthGrid(state.month),
      monthGrid(new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1))]);
    var nav = el('div', { 'class': 'gh-nav' }, [
      el('button', { type: 'button', 'class': 'gh-arrow', 'aria-label': 'Earlier months', text: '‹',
        onclick: function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); render(); },
        disabled: state.month <= new Date(new Date().getFullYear(), new Date().getMonth(), 1) ? 'disabled' : null }),
      el('button', { type: 'button', 'class': 'gh-arrow', 'aria-label': 'Later months', text: '›',
        onclick: function () { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); render(); } })
    ]);
    noteEl = el('p', { 'class': 'gh-note', 'aria-live': 'polite', text: noteEl ? noteEl.textContent : '' });
    var cal = el('div', { 'class': 'gh-calendar' }, [nav, months, noteEl,
      state.mode === 'preview' ? el('p', { 'class': 'gh-fine', text: 'Preview · prices and open nights from a recent copy of the calendar.' }) : null]);
    var side = state.step === 'details' ? details() : summary();
    root.replaceChildren(el('div', { 'class': 'gh-wrap' + (state.step === 'details' ? ' is-checkout' : '') },
      [state.step === 'details' ? null : cal, side]));
  }

  // ------------------------------------------------------------------- boot

  root.classList.add('gh-loading');
  load().then(function () {
    root.classList.remove('gh-loading');
    var now = new Date();
    state.month = new Date(now.getFullYear(), now.getMonth(), 1);
    // Arriving from an ad or a letter with dates in the link: pre-select them.
    var qs = new URLSearchParams(location.search);
    var ci = qs.get('checkIn') || qs.get('check_in'), co = qs.get('checkOut') || qs.get('check_out');
    if (ci && co && !stayOk(ci, co)) {
      state.checkIn = ci; state.checkOut = co;
      state.month = new Date(parse(ci).getFullYear(), parse(ci).getMonth(), 1);
      getQuote();
    }
    track('gh_view', { gh_mode_loaded: state.mode });
    render();
  }).catch(function () {
    root.classList.remove('gh-loading');
    root.hidden = true;
    var fb = FALLBACK && document.querySelector(FALLBACK);
    if (fb) { fb.hidden = false; fb.scrollIntoView && fb.scrollIntoView(); }
    track('gh_fallback_shown', {});
  });
})();
