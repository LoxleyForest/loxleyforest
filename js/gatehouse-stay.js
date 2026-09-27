/* ============================================================
   THE GATEHOUSE · after the booking
     booked.html   where Stripe returns the guest: confirms, then says so
     manage.html   the guest's own page: what is paid, what is next,
                   and the Promise's one free reschedule
   Needs <div id="gatehouse-stay" data-api="https://book.loxleyforest.com"
          data-page="booked|manage"></div>
   Wording on these pages is a draft restating the ruled terms;
   [MICK RATIFIES] before launch.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('gatehouse-stay');
  if (!root) return;
  var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
  var PAGE = root.getAttribute('data-page');
  var qs = new URLSearchParams(location.search);

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function money(c) { return '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pretty(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function api(path, body) {
    return fetch(API + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body) } : {}).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Something went wrong.'); return j; });
    });
  }
  function show(nodes) { root.replaceChildren.apply(root, nodes); }
  function problem(msg) { show([el('p', { 'class': 'gh-lead', text: msg })]); }

  function payments(stay) {
    var dl = el('dl', { 'class': 'gh-lines' });
    stay.payments.forEach(function (p) {
      var what = p.status === 'succeeded' ? 'Paid' : p.status === 'failed' ? 'Due now'
        : p.due_on ? 'Charged ' + pretty(p.due_on) : 'Due';
      dl.appendChild(el('dt', { text: what }));
      dl.appendChild(el('dd', { text: money(p.amount_cents) }));
    });
    dl.appendChild(el('dt', { 'class': 'gh-total', text: 'Total' }));
    dl.appendChild(el('dd', { 'class': 'gh-total', text: money(stay.total_cents) }));
    return dl;
  }

  function stayCard(stay, heading) {
    return el('div', { 'class': 'gh-summary' }, [
      el('p', { 'class': 'gh-eyebrow', text: heading }),
      el('p', { 'class': 'gh-dates', text: pretty(stay.check_in) + ' to ' + pretty(stay.check_out) }),
      payments(stay),
      stay.gift ? el('p', { 'class': 'gh-lead', text: 'Paid in full early: your first morning brings an ' +
        stay.gift.replace(', first morning', '') + '.' }) : null
    ]);
  }

  // ---- booked --------------------------------------------------------------

  function booked() {
    var sid = qs.get('session_id');
    if (!sid) return problem('We could not find your booking in this link. Your confirmation email has everything.');
    api('/v1/booked?session_id=' + encodeURIComponent(sid)).then(function (stay) {
      if (stay.kind === 'hold_auth') {
        show([stayCard(stay, 'Your dates are held'), el('p', { 'class': 'gh-lead',
          text: 'These nights are yours for the next 24 hours. Nothing has been charged. Come back to book them any time before the hold lets go.' })]);
        return;
      }
      var confirmed = stay.status === 'reserved' || stay.status === 'paid';
      window.dataLayer = window.dataLayer || [];
      if (confirmed && !sessionStorage.getItem('gh_purchase_' + sid)) {
        try { sessionStorage.setItem('gh_purchase_' + sid, '1'); } catch (e) {}
        var paid = stay.payments.filter(function (p) { return p.status === 'succeeded'; })
          .reduce(function (a, p) { return a + p.amount_cents; }, 0);
        window.dataLayer.push({ event: 'purchase', transaction_id: sid, value: stay.total_cents / 100,
          currency: 'USD', gh_paid_now: paid / 100 });
      }
      show([
        stayCard(stay, confirmed ? 'You are booked' : 'Payment received, confirming'),
        stay.manage_token ? el('a', { 'class': 'btn btn--secondary', href: '/manage?token=' + encodeURIComponent(stay.manage_token),
          text: 'Manage my stay' }) : null
      ]);
    }).catch(function (e) { problem(e.message); });
  }

  // ---- manage --------------------------------------------------------------

  function manage() {
    var token = qs.get('token');
    if (!token) return problem('This link is missing its key. Use the link in your confirmation email.');
    api('/v1/stay?token=' + encodeURIComponent(token)).then(function (stay) { render(stay, token); })
      .catch(function (e) { problem(e.message); });
  }

  function render(stay, token) {
    var canMove = stay.reschedules_used < 1 && (stay.status === 'reserved' || stay.status === 'paid');
    var err = el('p', { 'class': 'gh-error', role: 'alert' });
    var form = canMove ? el('form', { 'class': 'gh-form', onsubmit: function (ev) {
      ev.preventDefault();
      var ci = form.elements.check_in.value, co = form.elements.check_out.value;
      if (!ci || !co || co <= ci) { err.textContent = 'Choose a check-in and a later check-out.'; return; }
      form.querySelector('[type=submit]').disabled = true;
      api('/v1/reschedule', { token: token, check_in: ci, check_out: co }).then(function (moved) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'gh_rescheduled' });
        render(moved, token);
      }).catch(function (e) { err.textContent = e.message; form.querySelector('[type=submit]').disabled = false; });
    } }, [
      el('p', { 'class': 'gh-eyebrow', text: 'Move your stay' }),
      el('p', { 'class': 'gh-lead', text: 'One free move to any open dates within 12 months, up to 7 days before arrival. Everything you have paid comes with you.' }),
      el('div', { 'class': 'gh-row' }, [
        el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'gh-ci', text: 'New check-in' }), el('input', { id: 'gh-ci', name: 'check_in', type: 'date' })]),
        el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'gh-co', text: 'New check-out' }), el('input', { id: 'gh-co', name: 'check_out', type: 'date' })])
      ]),
      err,
      el('button', { type: 'submit', 'class': 'btn btn--primary gh-cta', text: 'Move my stay' })
    ]) : el('p', { 'class': 'gh-fine', text: stay.reschedules_used ? 'This stay has used its free move.' : '' });
    show([stayCard(stay, 'Your stay'), el('div', { 'class': 'gh-checkout' }, [form])]);
  }

  if (PAGE === 'booked') booked();
  else if (PAGE === 'manage') manage();
})();
