/* ============================================================
   AN ELOPEMENT PACKAGE OFFER · the private page (/elopement/offer)
   Mick makes the offer for one couple on the droplet (loxley-rescue
   gatehouse/offers.py; GATEHOUSE-SPEC.md section 16) and sends them
   its link, /elopement/offer#offer=<token>. Loaded after
   js/gatehouse.js, whose helpers it uses (window.Gatehouse: el, api,
   money, long, markdown, mountStripe). Every sentence it shows is in
   the page's JSON block (id lf-offer-words), written by
   scripts/site/pages/offer.py from its WORDS; while Mick has not
   approved them ("ready" false) the page shows only /book's own
   "Questions?" line and nothing of the offer.

   The engine (book.loxleyforest.com, loxley-rescue gatehouse/api.py):
     POST /v1/offer {token} -> {status: open | booked | expired |
          cancelled, package {key, name, includes[]}, check_in,
          check_out, nights, and, while open: greeting, extras[],
          party, lines[], total_cents, modes [deposit?, full],
          plans, retainer_cents, balance_cents, balance_due,
          check_in_time, clearing, agreement {text, version,
          choices[{id, question, options[], default}]}}; an offer
          whose bank payment is clearing reads {status: open,
          clearing: true} and no more. 404 {error: "not found"}.
     POST /v1/offer/checkout {token, mode, typed_name, accepted:
          true, agreement_version, choices {id: answer}} ->
          {client_secret, due_now_cents, total_cents, later}; 409
          {error: offer_closed | payment_clearing}; 422 {error:
          agreement_unsigned | agreement_changed |
          agreement_unanswered | mode_not_offered}.
     GET  /v1/booked?session_id= -> the stay: status reserved or paid
          (the payment succeeded), held (a bank payment clearing).
   The thank-you shows only when the engine says the payment
   succeeded: the offer read back booked, or the stay reserved or
   paid. Stripe returns the couple here with ?session_id=.

   The token and the session arrive in the address and the keys
   script in the head (scripts/site/build_v2.py KEYS_SCRIPT) has
   already lifted them out into window.__ghKeys before Tag Manager
   loads. They go to our own booking server, the token in a POST
   body, and nowhere else: never a beacon, never the tag manager.
   ============================================================ */
(function () {
  'use strict';

  var G = window.Gatehouse;
  var root = document.getElementById('eo');
  if (!G || !root) return;
  var el = G.el;
  var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
  var KEY = root.getAttribute('data-stripe-key') || '';
  var W = (function () {
    try { var n = document.getElementById('lf-offer-words'); return (n && JSON.parse(n.textContent)) || {}; } catch (e) { return {}; }
  })();
  var keys = window.__ghKeys || {};
  var wait = root.querySelector('[data-eo-wait]');
  var body = root.querySelector('[data-eo-body]');
  var top = { eyebrow: document.querySelector('[data-eo-eyebrow]'), h1: document.querySelector('[data-eo-h1]'),
    lead: document.querySelector('[data-eo-lead]') };

  // The merge values the words may use; filled as the offer is read.
  var vars = {};
  function w(k) {
    return String(W[k] || '').replace(/\{\{(\w+)\}\}/g, function (m, n) { return vars[n] != null ? vars[n] : ''; });
  }
  function say(lines) {
    body.hidden = true;
    body.textContent = '';
    wait.hidden = false;
    wait.textContent = [].concat(lines).filter(Boolean).join(' ');
  }
  function show(nodes) {
    wait.hidden = true;
    body.textContent = '';
    nodes.forEach(function (n) { if (n) body.appendChild(n); });
    body.hidden = false;
  }
  // "Friday, December 11 to Sunday, December 13, 2026": the year once when it is one year.
  function dates(a, b) { return (a.slice(0, 4) === b.slice(0, 4) ? G.longNoYear(a) : G.long(a)) + ' to ' + G.long(b); }

  // Until Mick has approved every word, nothing of the offer shows.
  if (W.ready !== true) { say(W.not_ready || ''); return; }

  // ---------------------------------------------------------- the ends
  function ended() { say([w('expired'), w('questions')]); }
  function failed() { say([w('failure'), w('questions')]); }
  function done(kind) {
    var parts = kind === 'thanks'
      ? [el('h2', { text: w('thanks_h') }), el('p', { text: w('thanks') })]
      : [el('p', { text: w('clearing') })];
    show([el('div', { 'class': 'eo-done', role: 'status' }, parts.concat([el('p', { 'class': 'eo-call', text: w('questions') })]))]);
  }
  function stayVars(s) {
    vars.package = s.package || '';
    if (s.check_in && s.check_out) vars.dates = dates(s.check_in, s.check_out);
    if (s.check_in) vars.arrival = G.longNoYear(s.check_in);
    if (s.total_cents != null) vars.total = G.money(s.total_cents);
    if (s.paid_cents != null) vars.today_amount = G.money(s.paid_cents);
    var later = (s.payments || []).filter(function (p) { return p.status === 'scheduled'; })[0];
    if (later) { vars.balance = G.money(later.amount_cents); vars.balance_date = G.long(later.due_on); }
  }

  // ---------------------------------------------------- back from Stripe
  function returned(session) {
    say(w('loading'));
    G.api(API, '/v1/booked?session_id=' + encodeURIComponent(session), null, 20000).then(function (s) {
      stayVars(s);
      if (s.status === 'reserved' || s.status === 'paid') return done('thanks');
      if (s.status === 'held') return done('clearing');
      failed();
    }).catch(failed);
  }

  // ------------------------------------------------------------ the offer
  function load(token) {
    say(w('loading'));
    G.api(API, '/v1/offer', { token: token }, 20000).then(function (o) {
      vars.package = o.package && o.package.name || '';
      if (o.check_in && o.check_out) vars.dates = dates(o.check_in, o.check_out);
      if (o.status === 'booked') return done('thanks');
      if (o.status !== 'open') return ended();
      if (o.clearing) return done('clearing');
      render(token, o);
    }).catch(function (e) {
      if (e && e.status === 404) return ended();
      failed();
    });
  }

  // The agreement as formatted text (the engine's own words), each of its questions ([[choice:id]])
  // asked in place as a group of choices.
  function agreementBox(ag, answers, labelId) {
    var box = el('div', { 'class': 'gh-agreement', tabindex: '0', role: 'region', 'aria-labelledby': labelId });
    var held = [];
    function flush() { if (held.length) { box.appendChild(G.markdown(held.join('\n'))); held = []; } }
    String(ag.text || '').split('\n').forEach(function (line) {
      var m = /\[\[choice:([\w-]+)\]\]/.exec(line);
      var c = m && (ag.choices || []).filter(function (x) { return x.id === m[1]; })[0];
      if (!c) { held.push(line); return; }
      flush();
      var set = el('fieldset', { 'class': 'eo-choice' }, [el('legend', { text: line.replace(m[0], '').trim() || c.question })]);
      c.options.forEach(function (opt, i) {
        var input = el('input', { type: 'radio', name: 'eo-choice-' + c.id, value: opt, id: 'eo-choice-' + c.id + '-' + i,
          onchange: function () { answers[c.id] = opt; } });
        if (opt === c['default']) { input.checked = true; answers[c.id] = opt; }
        set.appendChild(el('label', { 'for': input.id }, [input, el('span', { text: opt })]));
      });
      box.appendChild(set);
    });
    flush();
    return box;
  }

  function render(token, o) {
    vars.first_names = o.greeting || '';
    vars.arrival = G.longNoYear(o.check_in);
    vars.check_in_time = o.check_in_time || '';
    vars.total = G.money(o.total_cents);
    vars.retainer = G.money(o.retainer_cents || 0);
    vars.balance = G.money(o.balance_cents || 0);
    vars.balance_date = o.balance_due ? G.long(o.balance_due) : '';
    var modes = o.modes || [];
    var mode = modes.indexOf('deposit') >= 0 ? 'deposit' : 'full';
    function today() { return G.money(mode === 'deposit' ? o.retainer_cents : o.total_cents); }
    vars.today_amount = today();

    top.eyebrow.textContent = vars.package;
    top.h1.textContent = w('headline');
    top.lead.textContent = w('opening');
    top.lead.hidden = !top.lead.textContent;

    var day = el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-day-h' }, [
      el('h2', { id: 'eo-day-h', text: w('package_h') }),
      el('p', { 'class': 'eo-dates', text: vars.dates }),
      el('ul', { 'class': 'eo-list' }, (o.package.includes || []).map(function (x) { return el('li', { text: x }); }))]);
    var gifts = (o.extras || []).length ? el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-gifts-h' }, [
      el('h2', { id: 'eo-gifts-h', text: w('extras_h') }),
      el('ul', { 'class': 'eo-list' }, o.extras.map(function (x) { return el('li', { text: x }); }))]) : null;
    var total = el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-total-h' }, [
      el('div', { 'class': 'eo-total' }, [el('span', { 'class': 'eo-total__label', id: 'eo-total-h', text: w('total_label') }),
        el('span', { 'class': 'eo-total__sum', text: vars.total })]),
      el('p', { 'class': 'eo-sub', text: w('total_sub') })]);

    var payBtn = el('button', { type: 'button', 'class': 'lf-btn gh-btn--dark', id: 'eo-paybtn' });
    function label() { vars.today_amount = today(); payBtn.textContent = w('pay'); }
    var wayLines = [];
    var ways = el('fieldset', { 'class': 'eo-ways', 'aria-labelledby': 'eo-total-h' }, modes.map(function (m) {
      var input = el('input', { type: 'radio', name: 'eo-way', value: m, id: 'eo-way-' + m,
        onchange: function () { mode = m; label(); } });
      if (m === mode) input.checked = true;
      var line = el('span', { 'class': 'eo-way__line' });
      wayLines.push([m, line]);
      return el('label', { 'class': 'eo-way', 'for': input.id }, [input,
        el('span', { 'class': 'eo-way__label', text: w(m === 'deposit' ? 'half_label' : 'whole_label') }), line]);
    }));
    // Each way's own line names its own amount today.
    wayLines.forEach(function (pair) {
      var keep = mode; mode = pair[0]; vars.today_amount = today();
      pair[1].textContent = w(pair[0] === 'deposit' ? 'half_line' : 'whole_line');
      mode = keep;
    });
    label();

    var answers = {};
    var lead = el('p', { 'class': 'eo-lead-in', id: 'eo-ag-h', text: w('agreement_lead') });
    var box = agreementBox(o.agreement, answers, 'eo-ag-h');
    var agreement = el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-ag-h' }, [lead, box]);

    var name = el('input', { id: 'eo-name', name: 'name', type: 'text', autocomplete: 'name', autocapitalize: 'words', required: true });
    var tick = el('input', { id: 'eo-tick', type: 'checkbox', required: true });
    var error = el('p', { 'class': 'gh-error', id: 'eo-error', role: 'alert' });
    var sign = el('section', { 'class': 'eo-part eo-sign', 'aria-label': w('sign_label') }, [
      el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'eo-name', text: w('sign_label') }), name]),
      el('label', { 'class': 'gh-agree', 'for': 'eo-tick' }, [tick, el('span', { text: w('tick') })]),
      error, payBtn]);
    var pay = el('div', { 'class': 'eo-pay', id: 'eo-pay', tabindex: '-1' });
    var call = el('p', { 'class': 'eo-call', text: w('questions') });
    show([day, gifts, total, ways, agreement, sign, pay, call]);

    payBtn.addEventListener('click', function () {
      var typed = name.value.trim();
      var missing = typed.replace(/[^A-Za-zÀ-ɏ]/g, '').length < 2 ? name
        : !tick.checked ? tick
        : (o.agreement.choices || []).some(function (c) { return !answers[c.id]; }) ? box : null;
      if (missing) { error.textContent = w((o.agreement.choices || []).length ? 'need_sign' : 'need_sign_plain'); missing.focus(); return; }
      error.textContent = '';
      payBtn.disabled = true;
      G.api(API, '/v1/offer/checkout', { token: token, mode: mode, typed_name: typed, accepted: true,
        agreement_version: o.agreement.version, choices: answers }, 30000).then(function (r) {
        [ways, agreement, sign].forEach(function (n) { n.hidden = true; });
        return G.mountStripe(KEY, r.client_secret, '#eo-pay').then(function () {
          pay.focus({ preventScroll: true });
          pay.scrollIntoView({ block: 'start' });
        });
      }).catch(function (e) {
        payBtn.disabled = false;
        [ways, agreement, sign].forEach(function (n) { n.hidden = false; });
        var code = e && e.body && e.body.error;
        if (code === 'payment_clearing') return done('clearing');
        if (code === 'offer_closed' || (e && e.status === 404)) return ended();
        if (code === 'agreement_changed') return load(token);
        error.textContent = [w('failure'), w('questions')].join(' ');
      });
    });
  }

  // No offer and no payment in the address: there is nothing to try again, so the page stands
  // closed, as it does when the words are not the approved ones (/book's own "Questions?" line).
  if (keys.session_id) returned(keys.session_id);
  else if (keys.offer) load(keys.offer);
  else say(W.not_ready || '');
})();
