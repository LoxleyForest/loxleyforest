/* ============================================================
   THE GATEHOUSE · after the booking
     /booked   where Stripe returns the guest: the welcome. "You're booked",
               the dates and times, what happens next, add to calendar.
     /manage   the guest's own page: what is paid and what will be charged,
               a move with the live calendar and its price before it happens,
               cancel and keep it as credit, pay the rest now, the credit.
   Needs js/gatehouse.js first (window.Gatehouse: helpers and the calendar), and
     <div id="gatehouse-stay" data-api="https://book.loxleyforest.com"
          data-unit="..." data-stripe-key="..." data-page="booked|manage"></div>
   The API contract: loxley-rescue docs/briefs/2026-10-19-review-booking-engine.md, section D.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('gatehouse-stay');
  var G = window.Gatehouse;
  if (!root || !G) return;
  var el = G.el, money = G.money, long = G.long, PHONE = G.PHONE;
  var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
  var UNIT = root.getAttribute('data-unit') || '';
  var STRIPE_KEY = root.getAttribute('data-stripe-key') || '';
  var PAGE = root.getAttribute('data-page');
  // The manage key and the payment session arrive after # (or, from an older link, in the
  // query) and are lifted out of the address bar by the head script before Tag Manager loads
  // (build_v2.py KEYS_SCRIPT). They live in window.__ghKeys, never in a URL a tag can read.
  var KEYS = window.__ghKeys || {};
  var title = document.getElementById('gh-title');

  function call(path, body) { return G.api(API, path, body); }
  function show(nodes) { root.replaceChildren.apply(root, nodes.filter(Boolean)); root.removeAttribute('aria-busy'); }
  function problem(msg) {
    show([el('div', { 'class': 'gh-summary' }, [
      el('p', { 'class': 'gh-lead', text: msg }),
      el('p', { 'class': 'gh-fine' }, ['Questions? Call or text ', el('a', { href: G.TEL, text: PHONE }), ' or write to ',
        el('a', { href: 'mailto:stay@loxleyforest.com', text: 'stay@loxleyforest.com' }), '.'])
    ])]);
  }
  function active(stay) { return stay.status === 'reserved' || stay.status === 'paid'; }
  // Everything put toward the stay: the engine's paid_cents counts card payments AND credit
  // spent into it. Worked out from the lines only if an older answer lacks it.
  function paidCents(stay) {
    if (typeof stay.paid_cents === 'number') return stay.paid_cents;
    return (stay.payments || []).filter(function (p) { return p.status === 'succeeded'; })
      .reduce(function (a, p) { return a + p.amount_cents; }, 0) + (Number(stay.credit_applied_cents) || 0);
  }
  // Every link this site makes carries the key after #: a fragment is never sent to a server.
  function manageLink(token) { return '/manage#token=' + encodeURIComponent(token); }
  function manageUrl(token) { return location.origin + manageLink(token); }

  // ---- the stay, as the guest reads it ---------------------------------------

  // The engine names each line for the page (display_label: a move's difference reads
  // "Move difference"); its label otherwise; ours only if both are empty.
  var NAMES = { deposit: 'Retainer deposit (non-refundable)', balance: 'Balance', difference: 'Move difference', full: 'Your stay, in full' };
  function payRow(p) {
    var name = p.display_label || p.label || NAMES[p.kind] || 'Payment';
    var when = p.status === 'succeeded' ? 'Paid'
      : p.status === 'failed' ? 'Due now: the card did not go through'
      : p.status === 'pending' ? 'Confirming'
      : p.status === 'authorized' ? 'Authorized'
      : p.due_on ? 'Will be charged on ' + long(p.due_on)
      : 'Due';
    return [el('dt', {}, [el('span', { text: name }), el('small', { text: when })]), el('dd', { text: money(p.amount_cents) })];
  }

  function party(stay) {
    var bits = [];
    if (stay.guests) bits.push(stay.guests + ' guest' + (stay.guests === 1 ? '' : 's'));
    if (stay.dogs) bits.push(stay.dogs + ' dog' + (stay.dogs === 1 ? '' : 's'));
    return bits.join(' · ');
  }

  function stayCard(stay, eyebrow) {
    var dl = el('dl', { 'class': 'gh-lines gh-lines--pay' });
    (stay.payments || []).forEach(function (p) { payRow(p).forEach(function (n) { dl.appendChild(n); }); });
    // Credit spent into the stay is part of how it is paid, so the lines add up to the total.
    if (Number(stay.credit_applied_cents) > 0) {
      dl.appendChild(el('dt', {}, [el('span', { text: 'Credit applied' }), el('small', { text: 'From your credit' })]));
      dl.appendChild(el('dd', { text: money(stay.credit_applied_cents) }));
    }
    dl.appendChild(el('dt', { 'class': 'gh-total', text: 'Total' }));
    dl.appendChild(el('dd', { 'class': 'gh-total', text: money(stay.total_cents) }));
    var on = active(stay);
    return el('div', { 'class': 'gh-summary gh-stay' }, [
      el('p', { 'class': 'gh-eyebrow', text: eyebrow }),
      el('p', { 'class': 'gh-dates', text: G.span(stay.check_in, stay.check_out) }),
      el('ul', { 'class': 'gh-when' }, [
        el('li', {}, [el('b', { text: 'Check-in' }), ' from ' + G.CHECK_IN_TIME + ', ' + long(stay.check_in)]),
        el('li', {}, [el('b', { text: 'Check-out' }), ' by ' + G.CHECK_OUT_TIME + ', ' + long(stay.check_out)]),
        party(stay) ? el('li', {}, [el('b', { text: 'Coming' }), ' ' + party(stay)]) : null
      ]),
      on || (stay.payments || []).length ? dl : null,
      stay.gift ? el('p', { 'class': 'gh-gift', text: 'Paid in full early: ' + G.giftLine(stay.gift).replace(/^Your/, 'your') }) : null
    ]);
  }

  function calendarButton(stay, token) {
    return el('button', { type: 'button', 'class': 'lf-btn gh-btn--quiet', text: 'Add to calendar',
      onclick: function () { G.addToCalendar(stay, token ? manageUrl(token) : ''); } });
  }

  // ---- booked: the welcome ----------------------------------------------------

  function booked() {
    var sid = KEYS.session_id || '';
    if (!sid) return problem('This page opens from the payment link, and this one is missing its key. Your confirmation email has everything.');
    var tries = 0;
    (function load() {
      call('/v1/booked?session_id=' + encodeURIComponent(sid)).then(function (stay) {
        if (!active(stay) && stay.status !== 'cancelled' && tries < 6) {
          tries++;
          if (title) title.textContent = 'Payment received';
          show([el('div', { 'class': 'gh-summary' }, [el('p', { 'class': 'gh-lead gh-pulse', text: 'Your payment is in. We are confirming your nights now; this takes a few seconds.' })])]);
          setTimeout(load, 2500);
          return;
        }
        if (!active(stay)) {
          if (title) title.textContent = 'Payment received';
          return problem('Your payment is in, and your confirmation email will follow as soon as your nights are confirmed. Nothing more to do.');
        }
        // What was paid decides the welcome: a move's difference, the balance, or the booking.
        var kind = stay.kind || '';
        if (kind === 'difference' || kind === 'balance') G.track('gh_paid', { gh_kind: kind });
        else purchase(stay, sid);
        welcome(stay, kind);
      }).catch(function (e) { problem(e.message); });
    })();
  }

  // The purchase for the tag manager. Its id is a one-way hash of the payment session, so
  // analytics can count a booking once without ever holding a key that opens it.
  function anonId(s) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve('');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode('loxley-purchase:' + s)).then(function (b) {
      return 'lf-' + Array.prototype.map.call(new Uint8Array(b).slice(0, 8), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    }).catch(function () { return ''; });
  }
  function purchase(stay, sid) {
    anonId(sid).then(function (id) {
      var seen = 'gh_purchase_' + (id || 'x');
      try { if (sessionStorage.getItem(seen)) return; sessionStorage.setItem(seen, '1'); } catch (e) {}
      var data = { value: stay.total_cents / 100, currency: 'USD', gh_paid_now: paidCents(stay) / 100 };
      if (id) data.transaction_id = id;
      G.track('purchase', data);
    });
  }

  var WELCOME = {
    difference: { h1: 'Your stay has moved.', title: 'Your stay has moved', eyebrow: 'Your new dates',
                  now: 'A note with your new dates is on its way to your inbox.' },
    balance: { h1: 'Paid in full.', title: 'Paid in full', eyebrow: 'Your stay',
               now: 'Your receipt is on its way to your inbox. Nothing more is due.' },
    booked: { h1: "You're booked.", title: "You're booked", eyebrow: 'Your stay',
              now: 'Your confirmation is on its way to your inbox, with a link back to this stay.' }
  };

  function welcome(stay, kind) {
    var w = WELCOME[kind] || WELCOME.booked;
    if (title) title.textContent = w.h1;
    document.title = w.title + ' | Loxley Forest';
    // A credit carried to /book in this tab has done its work once a stay is booked.
    try {
      var st = JSON.parse(sessionStorage.getItem('gh_keys') || '{}') || {};
      if (st['/book'] && st['/book'].credit) { delete st['/book'].credit; sessionStorage.setItem('gh_keys', JSON.stringify(st)); }
    } catch (e) {}
    var token = stay.manage_token || '';
    var balance = (stay.payments || []).filter(function (p) { return p.status === 'scheduled' && p.due_on; })[0];
    var daysOut = G.daysBetween(G.today(), stay.check_in);
    var next = el('ol', { 'class': 'gh-next' }, [
      el('li', {}, [el('b', { text: 'Now. ' }), w.now]),
      balance ? el('li', {}, [el('b', { text: long(balance.due_on) + '. ' }),
        'The balance, ' + money(balance.amount_cents) + ', will be charged to the card you booked with. We write three days before.']) : null,
      daysOut > 7 ? el('li', {}, [el('b', { text: 'A week before. ' }), 'Your guide to the forest, and what it is doing that week.']) : null,
      daysOut >= 1 ? el('li', {}, [el('b', { text: 'The day before. ' }), 'The way in: the address, the drive and the walk to the bridge.'])
        : el('li', {}, [el('b', { text: 'Today. ' }), 'The way in is in your inbox: the address, the drive and the walk to the bridge.']),
      daysOut >= 7 && (canMove(stay) || stay.can_cancel) ? el('li', {}, [el('b', { text: 'Plans change. ' }), 'Until ' + G.changeUntil(stay.change_until, stay.check_in) +
        (canMove(stay) ? ', you can move your stay once, free, or keep everything you have paid as credit for 12 months.'
          : ', you can cancel and keep everything you have paid as credit for 12 months.')]) : null
    ]);
    show([
      stayCard(stay, w.eyebrow),
      el('div', { 'class': 'gh-actions' }, [
        calendarButton(stay, token),
        token ? el('a', { 'class': 'lf-btn gh-btn--quiet', href: manageLink(token), text: 'Manage my stay' }) : null
      ]),
      el('section', { 'class': 'gh-panel', 'aria-labelledby': 'gh-next-h' }, [
        el('h2', { 'class': 'gh-eyebrow', id: 'gh-next-h', text: 'What happens next' }), next,
        el('p', { 'class': 'gh-fine' }, ['Questions before then? Call or text ', el('a', { href: G.TEL, text: PHONE }), '. We answer fast.'])
      ])
    ]);
  }

  // ---- manage: the guest's own page ------------------------------------------

  var token = '';
  var move = null;        // {open, cal, quote, busy, err}
  var confirmCancel = false;

  function manage() {
    token = KEYS.token || '';
    if (!token) return problem('This link is missing its key. Use the link in your confirmation email.');
    reload();
  }

  function reload() {
    return call('/v1/stay?token=' + encodeURIComponent(token)).then(render).catch(function (e) {
      problem(e.status === 404 ? 'We could not find a stay for this link. Use the link in your latest email from us.' : e.message);
    });
  }

  var current = null;
  function render(stay) {
    current = stay = stay || current;
    var on = active(stay);
    var credit = stay.credit && stay.credit.cents > 0 ? stay.credit : null;
    if (title) title.textContent = on ? 'Your stay' : stay.status === 'cancelled' ? 'Your stay is cancelled' : 'Your stay';
    var eyebrow = on ? 'Your stay' : stay.status === 'cancelled' ? 'Cancelled' : stay.status === 'released' ? 'Released' : 'Your stay';
    show([
      stayCard(stay, eyebrow),
      on ? el('div', { 'class': 'gh-actions' }, [calendarButton(stay, token)]) : null,
      credit ? creditPanel(credit) : null,
      on ? owedPanel(stay) : null,
      on && stay.pay_early_cents > 0 ? payEarlyPanel(stay) : null,
      on ? movePanel(stay) : null,
      on ? cancelPanel(stay) : null,
      on && !canMove(stay) && !stay.can_cancel ? el('section', { 'class': 'gh-panel' }, [
        el('h2', { 'class': 'gh-eyebrow', text: 'Your stay is set' }),
        el('p', { 'class': 'gh-body', text: stay.reschedules_used ? 'This stay has used its free move, and from 7 days before arrival nothing moves or carries over.' : 'From 7 days before arrival, nothing moves or carries over. We look forward to having you.' })
      ]) : null,
      helpPanel(on)
    ]);
  }

  function canMove(stay) {
    if (stay.can_move !== undefined) return !!stay.can_move;
    return stay.reschedules_used < 1 && active(stay);
  }

  function creditPanel(credit) {
    return el('section', { 'class': 'gh-panel gh-panel--credit', 'aria-labelledby': 'gh-credit-h' }, [
      el('h2', { 'class': 'gh-eyebrow', id: 'gh-credit-h', text: 'Your credit' }),
      el('p', { 'class': 'gh-big', text: money(credit.cents) }),
      el('p', { 'class': 'gh-body', text: 'Good toward a stay until ' + long(credit.expires_on) + '. Choose your new nights and it comes off at checkout.' }),
      el('a', { 'class': 'lf-btn gh-cta', href: '/book#credit=' + encodeURIComponent(token), text: 'Choose new dates' })
    ]);
  }

  // The failed-payment letter's door: a balance the card did not cover, paid here.
  function owedPanel(stay) {
    var owed = (stay.payments || []).filter(function (p) { return p.status === 'failed'; })[0];
    if (!owed) return null;
    return payPanel('Balance due', 'The card on file did not go through. Pay ' + money(owed.amount_cents) +
      ' here to keep your dates. We keep your nights for 7 days from the failed charge.', 'Pay ' + money(owed.amount_cents) + ' now', 'gh_pay_link_opened');
  }

  function payEarlyPanel(stay) {
    var bal = (stay.payments || []).filter(function (p) { return p.status === 'scheduled' && p.due_on; })[0];
    return payPanel('Pay the rest now', 'Your balance, ' + money(stay.pay_early_cents) + ', ' +
      (bal ? 'will be charged on ' + long(bal.due_on) + '. You can pay it now instead, and nothing more is due.' : 'can be paid now, and nothing more is due.'),
      'Pay the rest now · ' + money(stay.pay_early_cents), 'gh_pay_early_opened');
  }

  function payPanel(head, words, label, event) {
    var err = el('p', { 'class': 'gh-error', role: 'alert' });
    var box = el('div', { 'class': 'gh-pay' });
    var btn = el('button', { type: 'button', 'class': 'lf-btn gh-btn--dark gh-cta', text: label, onclick: function () {
      btn.disabled = true; err.textContent = '';
      G.track(event, {});
      call('/v1/pay', { token: token }).then(function (res) {
        return G.mountStripe(STRIPE_KEY, res.client_secret, box).then(function () { btn.hidden = true; });
      }).catch(function (e) { btn.disabled = false; err.textContent = e.message; });
    } });
    return el('section', { 'class': 'gh-panel' }, [el('h2', { 'class': 'gh-eyebrow', text: head }), el('p', { 'class': 'gh-body', text: words }), btn, err, box]);
  }

  // ---- a move: the calendar, the price of the move, then the guest's yes ----------

  function movePanel(stay) {
    if (!canMove(stay)) return null;
    var until = G.changeUntil(stay.change_until, stay.check_in);
    var panel = el('section', { 'class': 'gh-panel', id: 'gh-move', 'aria-labelledby': 'gh-move-h' }, [
      el('h2', { 'class': 'gh-eyebrow', id: 'gh-move-h', text: 'Move your stay' }),
      el('p', { 'class': 'gh-body', text: 'One free move to any open dates within 12 months of your original arrival, until ' + until +
        '. Everything you have paid comes with you. You see the price of the move before anything changes.' })
    ]);
    if (!move || !move.open) {
      panel.appendChild(el('button', { type: 'button', 'class': 'lf-btn gh-btn--quiet', text: 'Choose new dates', onclick: function () { openMove(stay); } }));
      return panel;
    }
    if (move.loading) { panel.appendChild(el('p', { 'class': 'gh-lead gh-pulse', text: 'Opening the calendar…' })); return panel; }
    if (move.err && !move.cal) { panel.appendChild(el('p', { 'class': 'gh-error', role: 'alert', text: move.err })); return panel; }
    panel.appendChild(move.cal.render());
    var c = move.cal;
    if (c.checkIn && c.checkOut) panel.appendChild(moveQuote(stay));
    panel.appendChild(el('button', { type: 'button', 'class': 'gh-link', text: 'Keep my dates', onclick: function () { move = null; render(); } }));
    return panel;
  }

  function openMove(stay) {
    move = { open: true, loading: true };
    render();
    // The stay's own nights are taken on the public calendar; to its guest they are
    // free to keep, so they show as choosable (the move's quote has the last word).
    G.availability(API, UNIT).then(function (nights) {
      for (var d = stay.check_in; d < stay.check_out; d = G.addDays(d, 1)) {
        if (!nights[d]) nights[d] = { night: d, rate_cents: 0, min_stay: 1, max_stay: 30, own: true };
      }
      move.loading = false;
      move.cal = G.Calendar({ nights: nights, label: 'Choose your new nights', hint: 'Tap your new first night', onChange: onMovePick });
      render();
      var p = document.getElementById('gh-move');
      if (p && p.scrollIntoView) p.scrollIntoView({ block: 'start' });
    }).catch(function (e) { move.loading = false; move.err = e.message; render(); });
  }

  function onMovePick(c, navOnly) {
    if (!navOnly) { move.quote = null; move.err = ''; move.done = null; }
    if (!navOnly && c.checkIn && c.checkOut) {
      var key = c.checkIn + '/' + c.checkOut;
      move.busy = key;
      call('/v1/move/quote?token=' + encodeURIComponent(token) + '&check_in=' + c.checkIn + '&check_out=' + c.checkOut).then(function (q) {
        if (move.busy !== key) return;
        move.busy = null;
        if (q.ok === false) { move.err = G.plain(q.reason) || 'Those dates cannot take this stay.'; }
        else move.quote = q;
        render();
      }).catch(function (e) { if (move.busy !== key) return; move.busy = null; move.err = e.message; render(); });
    }
    render();
  }

  function moveQuote(stay) {
    var c = move.cal;
    var box = el('div', { 'class': 'gh-booking gh-move-quote', 'aria-live': 'polite' }, [
      el('p', { 'class': 'gh-eyebrow', text: 'Your new dates' }),
      el('p', { 'class': 'gh-dates', text: G.span(c.checkIn, c.checkOut) })
    ]);
    if (move.busy) { box.appendChild(el('p', { 'class': 'gh-lead gh-pulse', text: 'Pricing the move…' })); return box; }
    if (move.err) { box.appendChild(el('p', { 'class': 'gh-error', role: 'alert', text: move.err })); return box; }
    var q = move.quote;
    if (!q) return box;
    var dl = el('dl', { 'class': 'gh-lines gh-lines--summary' }, [
      el('dt', { 'class': 'gh-total', text: 'New total' }), el('dd', { 'class': 'gh-total', text: money(q.new_total_cents) }),
      el('dt', { text: 'Paid so far' }), el('dd', { text: money(q.paid_cents) })
    ]);
    if (q.pay_now_cents > 0) { dl.appendChild(el('dt', { text: 'You pay now, when you move' })); dl.appendChild(el('dd', { text: money(q.pay_now_cents) })); }
    if (q.credit_cents > 0) { dl.appendChild(el('dt', { text: 'You keep as credit, good for 12 months' })); dl.appendChild(el('dd', { text: money(q.credit_cents) })); }
    // What is left after today, so the lines add up to the new total (the agreement: 30 days before arrival).
    var rest = q.new_total_cents - q.paid_cents - (q.pay_now_cents || 0);
    if (rest > 0 && !(q.credit_cents > 0)) { dl.appendChild(el('dt', { text: 'The rest, charged 30 days before you arrive' })); dl.appendChild(el('dd', { text: money(rest) })); }
    box.appendChild(dl);
    if (!(q.pay_now_cents > 0) && !(q.credit_cents > 0)) box.appendChild(el('p', { 'class': 'gh-fine', text: 'Nothing to pay now.' }));
    box.appendChild(el('p', { 'class': 'gh-fine', text: 'This uses your one free move. After it, the stay can still be cancelled to credit until 7 days before the new arrival.' }));
    var err = el('p', { 'class': 'gh-error', role: 'alert' });
    var payBox = el('div', { 'class': 'gh-pay' });
    var btn = el('button', { type: 'button', 'class': 'lf-btn gh-btn--dark gh-cta',
      text: q.pay_now_cents > 0 ? 'Move my stay and pay ' + money(q.pay_now_cents) : 'Move my stay', onclick: function () {
        btn.disabled = true; err.textContent = '';
        call('/v1/reschedule', { token: token, check_in: c.checkIn, check_out: c.checkOut, confirm: true }).then(function (res) {
          if (res.client_secret) {
            // The saved card needs the guest: pay the difference here, and the move happens on its confirmation.
            return G.mountStripe(STRIPE_KEY, res.client_secret, payBox).then(function () { btn.hidden = true; });
          }
          G.track('gh_rescheduled', {});
          move = null;
          if (res.check_in) { render(res); return reload(); }
          return reload();
        }).catch(function (e) { btn.disabled = false; err.textContent = e.message; });
      } });
    box.appendChild(btn); box.appendChild(err); box.appendChild(payBox);
    return box;
  }

  // ---- cancel and keep it as credit -----------------------------------------------

  function cancelPanel(stay) {
    if (!stay.can_cancel) return null;
    var paid = paidCents(stay), until = G.changeUntil(stay.change_until, stay.check_in);
    var panel = el('section', { 'class': 'gh-panel', 'aria-labelledby': 'gh-cancel-h' }, [
      el('h2', { 'class': 'gh-eyebrow', id: 'gh-cancel-h', text: 'Cancel and keep it as credit' }),
      el('p', { 'class': 'gh-body', text: 'Until ' + until + ', you can cancel instead of moving: everything you have paid, ' + money(paid) +
        ', becomes credit toward a stay, good for 12 months from your arrival date.' })
    ]);
    if (!confirmCancel) {
      panel.appendChild(el('button', { type: 'button', 'class': 'lf-btn gh-btn--quiet', text: 'Cancel and keep it as credit',
        onclick: function () { confirmCancel = true; render(); var b = document.getElementById('gh-cancel-yes'); if (b) b.focus(); } }));
      return panel;
    }
    var err = el('p', { 'class': 'gh-error', role: 'alert' });
    var yes = el('button', { type: 'button', id: 'gh-cancel-yes', 'class': 'lf-btn gh-btn--dark gh-cta', text: 'Yes, cancel and keep ' + money(paid) + ' as credit',
      onclick: function () {
        yes.disabled = true; err.textContent = '';
        call('/v1/cancel', { token: token }).then(function () {
          G.track('gh_cancelled_to_credit', { value: paid / 100, currency: 'USD' });
          confirmCancel = false; move = null;
          return reload();
        }).catch(function (e) { yes.disabled = false; err.textContent = e.message; });
      } });
    panel.appendChild(el('div', { 'class': 'gh-confirm', role: 'alertdialog', 'aria-labelledby': 'gh-cancel-q' }, [
      el('p', { 'class': 'gh-lead', id: 'gh-cancel-q', text: 'Cancel ' + G.span(stay.check_in, stay.check_out) + '? Your nights are released at once, and ' +
        money(paid) + ' becomes credit, good for 12 months from your original arrival date. This cannot be undone.' }),
      yes,
      el('button', { type: 'button', 'class': 'gh-link', text: 'No, keep my stay', onclick: function () { confirmCancel = false; render(); } }),
      err
    ]));
    return panel;
  }

  function helpPanel(on) {
    return el('section', { 'class': 'gh-panel gh-panel--help', 'aria-labelledby': 'gh-help-h' }, [
      el('h2', { 'class': 'gh-eyebrow', id: 'gh-help-h', text: 'Good to know' }),
      el('ul', { 'class': 'gh-when' }, [
        el('li', {}, [el('b', { text: 'Times' }), ' Check-in from ' + G.CHECK_IN_TIME + ', check-out by ' + G.CHECK_OUT_TIME + '.']),
        on ? el('li', {}, [el('b', { text: 'The way in' }), ' The address, the drive and the walk to the bridge arrive by email the day before you do.']) : null,
        on ? el('li', {}, [el('b', { text: 'Make it yours' }), ' ', el('a', { href: '/experiences#more', text: 'See what you can add' }), ', then reply to your confirmation email with what you would like.']) : null,
        el('li', {}, [el('b', { text: 'Mick and Livy' }), ' Call ', el('a', { href: G.TEL, text: PHONE }), ' or ', el('a', { href: G.SMS, text: 'text us' }), '. We answer fast.'])
      ])
    ]);
  }

  if (PAGE === 'booked') booked();
  else if (PAGE === 'manage') manage();
})();
