/* ============================================================
   AN ELOPEMENT PACKAGE OFFER, AND THE INVITATION · the private page
   (/elopement/offer). Loaded after js/gatehouse.js, whose helpers
   it uses (window.Gatehouse: el, api, money, long, markdown,
   mountStripe). Every sentence it shows is in the page's JSON block
   (id lf-offer-words), written by scripts/site/pages/offer.py from
   its WORDS; while Mick has not approved them ("ready" false) the
   page shows only /book's own "Questions?" line and nothing else.

   Two things the page can be, by the key in its link (the keys
   script in the head, scripts/site/build_v2.py KEYS_SCRIPT, lifts
   them out of the address bar before Tag Manager loads):

   #offer=<token>  A MADE OFFER (loxley-rescue gatehouse/offers.py;
     GATEHOUSE-SPEC.md section 16): its nights claimed, the agreement
     to sign, the payment in place.
     POST /v1/offer {token} -> {status: open | booked | expired |
          cancelled, package {key, name, includes[]}, check_in,
          check_out, nights, and, while open: greeting, extras[],
          party, lines[], total_cents, modes [deposit?, full],
          plans, retainer_cents, balance_cents, balance_due,
          check_in_time, expires_at, clearing, agreement {text,
          version, choices[{id, question, options[], default}]},
          and (2026-11-12) note, days}; an offer whose bank payment
          is clearing reads {status: open, clearing: true} and no
          more. 404 {error: "not found"}.
     POST /v1/offer/checkout {token, mode, typed_name, accepted:
          true, agreement_version, choices {id: answer}} ->
          {client_secret, due_now_cents, total_cents, later}; 409
          {error: offer_closed | payment_clearing}; 422 {error:
          agreement_unsigned | agreement_changed |
          agreement_unanswered | mode_not_offered}.
     GET  /v1/booked?session_id= -> the stay: status reserved or paid
          (the payment succeeded), held (a bank payment clearing).
     The thank-you shows only when the engine says the payment
     succeeded. Stripe returns the couple here with ?session_id=.

   #invite=<token>  THE INVITATION (the Chief's route and the table
     of 2026-11-11; the Forge's rulings of 2026-11-12): the couple's
     page from their first reply, unsigned. It holds nothing and the
     engine keeps no name: their names ride after the # (&for=...),
     as the stay guides' do.
     GET  /v1/invitation?token=&check_in= -> {package {key, name,
          includes[]}, check_in, check_out, nights, lines[],
          total_cents, extras[], party, modes, plans, retainer_cents,
          balance_cents, balance_due, check_in_time, note, days
          [{date, sunrise, sunset, stops [{time | null, title,
          words}]}], open_dates [{check_in, check_out}], hold {mode:
          "ask" | "hold", hours, until}}. No agreement, no expiry. A
          check_in from open_dates reads the same Invitation on that
          date: a read, nothing written.
     POST /v1/invitation/ask  {token} -> {asked: true}: one bell to
          Mick, nothing held; the page says he will send the
          agreement. The default.
     POST /v1/invitation/hold {token, names} -> {token}: the made
          offer, on Mick's word only; the page moves to it.

   Everything sent goes to our own booking server, the token in a
   body or a query to it, and nowhere else: never a beacon, never
   the tag manager. The names never leave the browser except in the
   hold's body, which makes the offer the ledger keeps.

   The demo (pages/offer.py DEMO, a private page for Mick's read):
   the words block carries "demo", an invented Invitation, and the
   page renders it in the engine's place, asks the engine nothing
   and sends nothing. The live page's block never carries "demo".
   ============================================================ */
(function () {
  'use strict';

  var G = window.Gatehouse;
  var root = document.getElementById('eo');
  if (!G || !root) return;
  var el = G.el;
  var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
  var KEY = root.getAttribute('data-stripe-key') || '';
  var PHONE = (root.getAttribute('data-phone') || '').replace(/\D/g, '');
  var W = (function () {
    try { var n = document.getElementById('lf-offer-words'); return (n && JSON.parse(n.textContent)) || {}; } catch (e) { return {}; }
  })();
  var DEMO = W.demo && typeof W.demo === 'object' ? W.demo : null;
  var keys = window.__ghKeys || {};
  var wait = root.querySelector('[data-eo-wait]');
  var body = root.querySelector('[data-eo-body]');
  var top = { eyebrow: document.querySelector('[data-eo-eyebrow]'), h1: document.querySelector('[data-eo-h1]'),
    lead: document.querySelector('[data-eo-lead]') };

  // The merge values the words may use; filled as the page is read.
  var vars = {};
  function w(k, extra) {
    var v = extra ? Object.assign({}, vars, extra) : vars;
    return String(W[k] || '').replace(/\{\{(\w+)\}\}/g, function (m, n) { return v[n] != null ? v[n] : ''; });
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
  // The names in the link after the # (&for=...), for an Invitation and the demo; never sent.
  function namesInLink() {
    var m = /(?:^|&)for=([^&]*)/.exec(location.hash.replace(/^#/, ''));
    try { return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')).trim().slice(0, 80) : ''; } catch (e) { return ''; }
  }
  function addISO(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function diffISO(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5); }

  // Until Mick has approved every word, nothing shows.
  if (W.ready !== true) { say(W.not_ready || ''); return; }

  // ---------------------------------------------------------- the ends
  function ended() { say([w('expired'), w('questions')]); }
  function failed() { say([w('failure'), w('questions')]); }
  function done(kind, extra) {
    var parts = kind === 'thanks' ? [el('h2', { text: w('thanks_h') }), el('p', { text: w('thanks') })]
      : kind === 'asked' ? [el('h2', { text: w('asked_h') }), el('p', { text: w('asked') })]
      : [el('p', { text: w('clearing') })];
    parts.push(el('p', { 'class': 'eo-call', text: w('questions') }));
    if (extra) parts.push(el('p', { 'class': 'eo-call', text: extra }));
    show([el('div', { 'class': 'eo-done', role: 'status' }, parts)]);
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

  // ------------------------------------------------------- a made offer
  function load(token) {
    say(w('loading'));
    G.api(API, '/v1/offer', { token: token }, 20000).then(function (o) {
      vars.package = o.package && o.package.name || '';
      if (o.check_in && o.check_out) vars.dates = dates(o.check_in, o.check_out);
      if (o.status === 'booked') return done('thanks');
      if (o.status !== 'open') return ended();
      if (o.clearing) return done('clearing');
      render('offer', token, o);
    }).catch(function (e) {
      if (e && e.status === 404) return ended();
      failed();
    });
  }

  // ----------------------------------------------------- the Invitation
  // A read, on their date or on one of the open dates near it; nothing held, no name kept.
  function readInvite(token, checkIn) {
    say(w('loading'));
    if (DEMO) { render('invite', token, checkIn ? demoOn(checkIn) : DEMO); return; }
    G.api(API, '/v1/invitation?token=' + encodeURIComponent(token) + (checkIn ? '&check_in=' + encodeURIComponent(checkIn) : ''), null, 20000)
      .then(function (o) {
        if (o.status && o.status !== 'open') return ended();
        render('invite', token, o);
      }).catch(function (e) {
        if (e && e.status === 404) return ended();
        failed();
      });
  }
  // The demo on another of its open dates: the same invented stay, its days moved with the dates.
  function demoOn(checkIn) {
    var shift = diffISO(DEMO.check_in, checkIn);
    var o = JSON.parse(JSON.stringify(DEMO));
    o.check_in = checkIn;
    o.check_out = addISO(DEMO.check_out, shift);
    if (DEMO.balance_due) o.balance_due = addISO(DEMO.balance_due, shift);
    (o.days || []).forEach(function (d) { if (d.date) d.date = addISO(d.date, shift); });
    o.open_dates = (DEMO.open_dates || []).map(function (d) {
      return d.check_in === checkIn ? { check_in: DEMO.check_in, check_out: DEMO.check_out } : d;
    });
    return o;
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

  // ------------------------------------- the parts both pages share (2026-11-11)
  function part(id, heading, kids) {
    return el('section', { 'class': 'eo-part', 'aria-labelledby': id }, [el('h2', { id: id, text: heading })].concat(kids));
  }
  // The stop that holds the vows is the ceremony; its day is the ceremony day, else the second day,
  // else the first.
  function isCeremony(s) { return /\bvows?\b/i.test((s.title || '') + ' ' + (s.words || '')); }
  function ceremonyDay(days) {
    var hit = days.filter(function (d) { return (d.stops || []).some(isCeremony); })[0];
    return hit || days[1] || days[0] || null;
  }
  function noteBlock(o) {
    if (!o.note) return null;
    return part('eo-note-h', w('note_h'), [el('div', { 'class': 'eo-note' }, [el('p', { text: o.note })])]);
  }
  function daysBlock(o) {
    var days = o.days || [];
    if (!days.length) return null;
    return part('eo-days-h', w('day_h'), [el('div', { 'class': 'eo-days' }, days.map(function (d) {
      var sun = [d.sunrise ? w('sunrise_label') + ' ' + d.sunrise : '', d.sunset ? w('sunset_label') + ' ' + d.sunset : '']
        .filter(Boolean).join(' · ');
      return el('div', { 'class': 'eo-day' }, [
        el('h3', { 'class': 'eo-day__h', text: d.date ? G.long(d.date) : '' }),
        sun ? el('p', { 'class': 'eo-day__sun', text: sun }) : null,
        el('ol', { 'class': 'eo-stops' }, (d.stops || []).map(function (s) {
          // The ceremony has no clock time (the record has no hour; it is settled together): the
          // day's sunset stands in its place. Another stop without a time shows none.
          var when = s.time || (isCeremony(s) && d.sunset ? w('sunset_label') + ' ' + d.sunset : '');
          return el('li', { 'class': 'eo-stop' }, [
            el('span', { 'class': 'eo-stop__time', text: when }),
            el('span', { 'class': 'eo-stop__title', text: s.title || '' }),
            s.words ? el('p', { 'class': 'eo-stop__words', text: s.words }) : null]);
        }))]);
    }))]);
  }
  function photosBlock(o) {
    var key = o.package && o.package.key || '';
    var t = key && document.querySelector('template[data-eo-photos="' + key + '"]');
    if (!t || !t.content) return null;
    var grid = el('div', { 'class': 'eo-photos' });
    grid.appendChild(t.content.cloneNode(true));
    return part('eo-photos-h', w('photos_h'), [grid]);
  }
  function priceBlock(o) {
    var lines = (o.lines || []).filter(function (l) { return l && l.label; });
    var list = lines.length ? el('ul', { 'class': 'eo-price' }, lines.map(function (l) {
      return el('li', {}, [el('span', { text: l.label }), el('span', { text: G.money(l.cents || 0) })]);
    })) : null;
    var total = el('div', { 'class': 'eo-total' }, [el('span', { 'class': 'eo-total__label', id: 'eo-total-h', text: w('total_label') }),
      el('span', { 'class': 'eo-total__sum', text: vars.total })]);
    var kids = [list, total, el('p', { 'class': 'eo-sub', text: w('total_sub') })];
    if (vars.expires) kids.push(el('p', { 'class': 'eo-until', text: w('stands_until') }));
    return lines.length ? part('eo-price-h', w('price_h'), kids)
      : el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-total-h' }, kids.slice(1));
  }
  // The open dates near theirs. On an Invitation a tap reads the page on that date; on a made
  // offer, whose nights are claimed, a tap composes a text to the house.
  function openDatesBlock(o, kind, token) {
    var list = (o.open_dates || []).filter(function (d) { return d && d.check_in && d.check_out; });
    if (!list.length) return null;
    var invite = kind === 'invite';
    return part('eo-dates-h', w('dates_h'), [el('p', { 'class': 'eo-sub', text: w(invite ? 'dates_line' : 'dates_line_offer') }),
      el('ul', { 'class': 'eo-dates-list' }, list.map(function (d) {
        var label = dates(d.check_in, d.check_out);
        if (invite) {
          return el('li', {}, [el('button', { type: 'button', 'class': 'eo-date', text: label,
            onclick: function () { readInvite(token, d.check_in); root.scrollIntoView({ block: 'start' }); } })]);
        }
        var ask = w('dates_ask', { dates: label, our_dates: vars.dates });
        return el('li', {}, [el('a', { 'class': 'eo-date', href: 'sms:' + PHONE + '?&body=' + encodeURIComponent(ask), text: label })]);
      }))]);
  }

  // ---------------------------------------------------------- the page
  function render(kind, token, o) {
    var invite = kind === 'invite';
    vars.package = o.package && o.package.name || '';
    vars.dates = o.check_in && o.check_out ? dates(o.check_in, o.check_out) : '';
    vars.first_names = invite ? (namesInLink() || (DEMO ? 'The two of you' : '')) : (o.greeting || '');
    vars.arrival = o.check_in ? G.longNoYear(o.check_in) : '';
    vars.check_in_time = o.check_in_time || '';
    vars.total = G.money(o.total_cents || 0);
    vars.retainer = G.money(o.retainer_cents || 0);
    vars.balance = G.money(o.balance_cents || 0);
    vars.balance_date = o.balance_due ? G.long(o.balance_due) : '';
    vars.expires = o.expires_at ? G.long(String(o.expires_at).slice(0, 10)) : '';
    vars.hold_hours = o.hold && o.hold.hours ? String(o.hold.hours) : '';
    var cday = ceremonyDay(o.days || []);
    vars.sunset = cday && cday.sunset || '';
    var modes = o.modes || [];
    var mode = modes.indexOf('deposit') >= 0 ? 'deposit' : 'full';
    function today() { return G.money(mode === 'deposit' ? o.retainer_cents : o.total_cents); }
    vars.today_amount = today();

    top.eyebrow.textContent = [vars.package, vars.dates].filter(Boolean).join(' · ');
    top.h1.textContent = w('headline');
    top.lead.textContent = w('opening');
    top.lead.hidden = !top.lead.textContent;

    var provided = el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-day-h' }, [
      el('h2', { id: 'eo-day-h', text: w('package_h') }),
      el('p', { 'class': 'eo-dates', text: vars.dates }),
      vars.sunset ? el('p', { 'class': 'eo-sun', text: w('sunset_line') }) : null,
      el('ul', { 'class': 'eo-list' }, ((o.package || {}).includes || []).map(function (x) { return el('li', { text: x }); }))]);
    var gifts = (o.extras || []).length ? el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-gifts-h' }, [
      el('h2', { id: 'eo-gifts-h', text: w('extras_h') }),
      el('ul', { 'class': 'eo-list' }, o.extras.map(function (x) { return el('li', { text: x }); }))]) : null;
    var common = [noteBlock(o), daysBlock(o), provided, gifts, photosBlock(o), priceBlock(o)];
    var call = el('p', { 'class': 'eo-call', text: w('questions') });

    if (invite) {
      // The Invitation's foot: how the money goes once Mick sends the agreement, the open dates,
      // and one button: Ask (nothing held) or, on Mick's word, Hold.
      var plan = el('p', { 'class': 'eo-sub', text: w(modes.indexOf('deposit') >= 0 ? 'invite_plan' : 'invite_plan_whole') });
      var holding = !!(o.hold && o.hold.mode === 'hold');
      var foot = part(holding ? 'eo-hold-h' : 'eo-ask-h', w(holding ? 'hold_h' : 'ask_h'),
        [el('p', { 'class': 'eo-hold', text: w(holding ? 'hold_line' : 'ask_line') })]);
      var err = el('p', { 'class': 'gh-error', id: 'eo-error', role: 'alert' });
      var btn = el('button', { type: 'button', 'class': 'lf-btn gh-btn--dark', id: 'eo-askbtn', text: w(holding ? 'hold_button' : 'ask_button') });
      var act = el('section', { 'class': 'eo-part eo-sign', 'aria-label': btn.textContent }, [err, btn]);
      show(common.concat([plan, openDatesBlock(o, 'invite', token), foot, act, call]));
      btn.addEventListener('click', function () {
        err.textContent = '';
        // The demo sends nothing, holds nothing and charges nothing.
        if (DEMO) { done('asked', String(o.demo_line || '')); return; }
        btn.disabled = true;
        var req = holding ? G.api(API, '/v1/invitation/hold', { token: token, names: vars.first_names }, 30000)
          : G.api(API, '/v1/invitation/ask', { token: token }, 30000);
        req.then(function (r) {
          if (holding) { if (r && r.token) return load(r.token); return failed(); }
          if (r && r.asked) return done('asked');
          failed();
        }).catch(function (e) {
          btn.disabled = false;
          if (e && (e.status === 404 || e.status === 409)) return ended();
          err.textContent = [w('failure'), w('questions')].join(' ');
        });
      });
      return;
    }

    // A made offer: the ways to pay, the agreement, the signature, the payment.
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
    var box = agreementBox(o.agreement || {}, answers, 'eo-ag-h');
    var agreement = el('section', { 'class': 'eo-part', 'aria-labelledby': 'eo-ag-h' }, [lead, box]);

    var name = el('input', { id: 'eo-name', name: 'name', type: 'text', autocomplete: 'name', autocapitalize: 'words', required: true });
    var tick = el('input', { id: 'eo-tick', type: 'checkbox', required: true });
    var error = el('p', { 'class': 'gh-error', id: 'eo-error', role: 'alert' });
    var sign = el('section', { 'class': 'eo-part eo-sign', 'aria-label': w('sign_label') }, [
      el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'eo-name', text: w('sign_label') }), name]),
      el('label', { 'class': 'gh-agree', 'for': 'eo-tick' }, [tick, el('span', { text: w('tick') })]),
      error, payBtn]);
    var pay = el('div', { 'class': 'eo-pay', id: 'eo-pay', tabindex: '-1' });
    show(common.concat([openDatesBlock(o, 'offer', token), ways, agreement, sign, pay, call]));

    payBtn.addEventListener('click', function () {
      var typed = name.value.trim();
      var choices = (o.agreement && o.agreement.choices) || [];
      var missing = typed.replace(/[^A-Za-zÀ-ɏ]/g, '').length < 2 ? name
        : !tick.checked ? tick
        : choices.some(function (c) { return !answers[c.id]; }) ? box : null;
      if (missing) { error.textContent = w(choices.length ? 'need_sign' : 'need_sign_plain'); missing.focus(); return; }
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

  // The demo: the invented Invitation in the engine's place.
  if (DEMO) { readInvite('demo'); return; }
  // No offer, no invitation and no payment in the address: there is nothing to try again, so the
  // page stands closed, as it does when the words are not the approved ones (/book's own line).
  if (keys.session_id) returned(keys.session_id);
  else if (keys.offer) load(keys.offer);
  else if (keys.invite) readInvite(keys.invite);
  else say(W.not_ready || '');
})();
