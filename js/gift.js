/* ============================================================
   THE GOLDEN ARROW · the purchase panel (/gift) and the card (/gift/card)
   The house's gift of three nights and the Dawn Table (Mick,
   2026-10-25). Loaded after js/gatehouse.js, whose helpers it uses
   (window.Gatehouse: el, api, money, the phone). Every sentence it
   shows is in the page's JSON block (id lf-gift-words), written by
   scripts/site/pages/gift.py from its WORDS (awaiting Mick).

   The engine (book.loxleyforest.com, loxley-rescue ceo/golden-arrow,
   cdb68bc):
     GET  /v1/health -> {..., gift_sales, gift_delivery}: whether to
          sell, and whether to offer "a day I choose".
     POST /v1/gift/checkout {product, email, giver_name,
          recipient_names, ship_to?{name, line1, line2, city, state
          (two letters), zip (five digits)}, deliver?{email, date
          "YYYY-MM-DD", hour 0-23 Eastern, message}} -> {url,
          total_cents}; no deliver: the card goes to the buyer;
          400 or 503 {error: a sentence}. Stripe returns the buyer to
          /gift/thanks?session_id=..., or to /gift on the way back.
     GET  /v1/gift?code=LF-XXXX-XXXX -> {code, product, name, status
          (issued, redeemed or void), recipient_names, giver_name,
          covers, never_expires, includes, state (unused, booked or
          used), month ("January 2027" or null)}; 404 {error}. A gift
          Mick gave its own window (loxley-rescue forge/gift-window,
          `gifts extend`) also reads window {from, to, whole, line}:
          the card's January-to-May line is not true for it, so the
          card shows `line` in its place, or no dates line while that
          is "" (its words wait for Mick).
     POST /v1/gift/resend {email} -> {ok, message}: one sentence,
          the same whatever the email.
     GET  /v1/gift/delivery?token= and POST /v1/gift/delivery {token,
          date?, hour?, email?} -> {name, recipient_names, giver_name,
          email, date, hour, when, message, sent, can_change}: the
          buyer's change page. GET /v1/health's gift_delivery says
          whether "a day I choose" is offered.
   (engine round two: loxley-rescue ceo/golden-arrow-2, 4c9175d.)
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

  // ---- time, as the engine counts it: Eastern, "YYYY-MM-DDTHH:MM"
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function nowEastern() {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
    } catch (e) { var d = new Date(); return G.iso(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  }
  // The last day a card may be sent: twelve months from today.
  function lastDay() { var d = G.parse(G.today()); d.setMonth(d.getMonth() + 12); return G.iso(d); }
  // The next 7 AM on a day of the year ("12-25"), this year if it is still ahead: its day.
  function nextMorning(md) {
    var y = +G.today().slice(0, 4), at = y + '-' + md + 'T07:00';
    return (at > nowEastern() ? at : (y + 1) + '-' + md + 'T07:00').slice(0, 10);
  }
  function hourWords(h) { return (h % 12 || 12) + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function at(day, hour) { return day + 'T' + pad(+hour) + ':00'; }
  // "Christmas morning at 7 AM", "Valentine's Day at 7 AM", "Friday, January 8, 2027 at 9 AM".
  function whenWords(day, hour) {
    var md = String(day).slice(5, 10), h = +hour;
    var d = md === '12-25' && h < 12 ? w('when_christmas') : md === '02-14' ? w('when_valentine') : G.long(day);
    return w('when_at').replace('{day}', d).replace('{hour}', hourWords(h));
  }
  // Is a day and hour one the engine takes: still ahead, and no later than twelve months out?
  function whenProblem(day, hour) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') || day < G.today() || day > lastDay()) return 'need_day';
    if (at(day, hour) <= nowEastern()) return 'need_future';
    return '';
  }

  // A labelled field bound to obj[key].
  function inputField(obj, id, key, label, opts) {
    opts = opts || {};
    var input = el('input', { id: id, name: key, type: opts.type || 'text', autocomplete: opts.auto || null,
      inputmode: opts.mode || null, maxlength: opts.type === 'date' ? null : opts.max || 120, required: opts.optional ? null : 'required',
      min: opts.min || null, max: opts.type === 'date' ? opts.maxDay || null : null,
      'aria-describedby': opts.hint ? id + '-hint' : null, value: obj[key] === undefined || obj[key] === null ? '' : obj[key],
      oninput: function (e) { obj[key] = e.target.value; if (opts.after) opts.after(); } });
    return el('div', { 'class': 'gh-field' }, [
      el('label', { 'for': id, text: label + (opts.optional ? ' ' + w('optional') : '') }), input,
      opts.hint ? el('small', { id: id + '-hint', text: opts.hint }) : null]);
  }

  // The day, the hour (Eastern) and the quick picks, bound to t {day, hour, pick}; for the purchase
  // panel and the buyer's change page alike.
  function whenPicker(t) {
    function unpick() { t.pick = ''; refresh(); }
    var day = inputField(t, 'ga-day', 'day', w('day_label'), { type: 'date', min: G.today(), maxDay: lastDay(), after: unpick });
    var hour = el('select', { id: 'ga-hour', name: 'hour', onchange: function (e) { t.hour = +e.target.value; unpick(); } });
    for (var h = 0; h < 24; h++) hour.appendChild(el('option', { value: String(h), text: hourWords(h), selected: +t.hour === h ? 'selected' : null }));
    var picks = [['christmas', '12-25', w('pick_christmas')], ['valentine', '02-14', w('pick_valentine')]].map(function (p) {
      var d = nextMorning(p[1]);
      if (d > lastDay()) return null;
      return el('button', { type: 'button', 'class': 'ga-pick', 'data-pick': p[0], 'aria-pressed': 'false', text: p[2], onclick: function () {
        t.pick = p[0]; t.day = d; t.hour = 7;
        day.querySelector('input').value = d; hour.value = '7'; refresh();
      } });
    }).filter(Boolean);
    function refresh() { picks.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pick') === t.pick ? 'true' : 'false'); }); }
    refresh();
    return [el('div', { 'class': 'ga-row2' }, [day, el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'ga-hour', text: w('hour_label') }), hour])]),
      picks.length ? el('div', { 'class': 'ga-picks', role: 'group', 'aria-labelledby': 'ga-picks-l' }, [el('span', { id: 'ga-picks-l', text: w('picks_label') })].concat(picks)) : null];
  }

  // ================================================== /gift: the purchase panel

  function Buy(root) {
    var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
    var f = { recipient_names: '', giver_name: '', email: '', mail: false,
              ship: { name: '', line1: '', line2: '', city: '', state: '', zip: '' },
              deliver: 'me', them: { email: '', day: '', hour: 7, pick: '', message: '' } };
    var opened = null;          // {key, res, at}: a payment page already made for these exact details
    var error = '';
    var canDeliver = false;     // GET /v1/health's gift_delivery: "a day I choose" is offered

    function show(nodes) { root.replaceChildren.apply(root, nodes); }

    function off(kind, sentence) {
      // The lead above promises a price before paying; with no way to pay here, it steps aside.
      var lead = document.querySelector('.ga-give__lead');
      if (lead) lead.hidden = true;
      show([el('div', { 'class': 'ga-panel', role: 'status' }, [
        el('p', { 'class': 'ga-panel__lead', text: sentence || w(kind) }), callLine()])]);
    }

    function field(id, key, label, opts) {
      opts = opts || {};
      return inputField(opts.obj || (opts.ship ? f.ship : f), id, key, label, opts);
    }

    // How the card arrives: to the buyer (the default), or to them by email on a day chosen here,
    // with a note (round two, 2026-10-25).
    function deliverBlock() {
      var t = f.them;
      var them = el('div', { 'class': 'ga-them', hidden: f.deliver === 'them' ? null : 'hidden' });
      function choice(v, text) {
        return el('label', { 'class': 'ga-choice', 'for': 'ga-deliver-' + v }, [
          el('input', { type: 'radio', id: 'ga-deliver-' + v, name: 'deliver', value: v, checked: f.deliver === v ? 'checked' : null,
            onchange: function () { f.deliver = v; them.hidden = v !== 'them'; } }),
          el('span', { text: text })]);
      }
      function counted() { return w('note_count').replace('{n}', String(t.message.length)); }
      var count = el('span', { 'class': 'ga-count', id: 'ga-note-count', text: counted() });
      var note = el('textarea', { id: 'ga-note', name: 'message', maxlength: '500', rows: '4', 'aria-describedby': 'ga-note-hint ga-note-count',
        oninput: function (e) { t.message = e.target.value.slice(0, 500); count.textContent = counted(); } });
      note.value = t.message;
      [field('ga-their-email', 'email', w('their_email_label'), { obj: t, type: 'email', auto: 'off', mode: 'email', hint: w('their_email_hint') })]
      .concat(whenPicker(t)).concat([
       el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'ga-note', text: w('note_label') + ' ' + w('optional') }), note,
         el('small', { id: 'ga-note-hint', text: w('note_hint') }), count])
      ]).forEach(function (n) { if (n) them.appendChild(n); });
      return el('fieldset', { 'class': 'ga-deliver' }, [el('legend', { text: w('deliver_legend') }),
        choice('me', w('deliver_me')), choice('them', w('deliver_them')), them]);
    }

    function form() {
      var err = el('p', { 'class': 'gh-error', id: 'ga-error', role: 'alert', text: error });
      var mail = el('input', { type: 'checkbox', id: 'ga-mail', name: 'mail', checked: f.mail ? 'checked' : null, 'aria-describedby': 'ga-mail-hint',
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
        canDeliver ? deliverBlock() : null,
        el('div', {}, [el('label', { 'class': 'gh-optin', 'for': 'ga-mail' }, [mail, el('span', { text: w('mail_label') })]),
          el('p', { 'class': 'ga-mail-hint', id: 'ga-mail-hint', text: w('mail_hint') })]),
        ship, err, btn]);
    }

    function body() {
      var b = { product: PRODUCT, email: f.email.trim(), giver_name: f.giver_name.trim(), recipient_names: f.recipient_names.trim() };
      if (f.mail) {
        b.ship_to = {};
        ['name', 'line1', 'line2', 'city', 'state', 'zip'].forEach(function (k) { b.ship_to[k] = String(f.ship[k] || '').trim(); });
        b.ship_to.state = b.ship_to.state.toUpperCase();
      }
      // "Email it to them on a day I choose": deliver {email, date, hour, message}. Without it the
      // card goes to the buyer.
      var t = f.them;
      if (canDeliver && f.deliver === 'them') b.deliver = { email: t.email.trim(), date: t.day || '', hour: +t.hour, message: t.message.trim() };
      return b;
    }

    function problem(b) {
      if (!b.recipient_names) return ['need_for', 'ga-for'];
      if (!b.giver_name) return ['need_from', 'ga-from'];
      if (!/^\S+@\S+\.\S+$/.test(b.email)) return ['need_email', 'ga-email'];
      var d = b.deliver;
      if (d) {
        if (!/^\S+@\S+\.\S+$/.test(d.email)) return ['need_their_email', 'ga-their-email'];
        var wp = whenProblem(d.date, d.hour);
        if (wp) return [wp, wp === 'need_day' ? 'ga-day' : 'ga-hour'];
      }
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
        // Spoken for this season (409, the engine's sales cap): its sentence, as is, in place of the panel.
        if (e && e.status === 409 && e.body && typeof e.body.error === 'string' && e.body.error.trim()) return off('', e.body.error.trim());
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
        // For /gift/thanks to read back how the card arrives: the choice and its moment only,
        // never an email or the note, in this tab alone.
        // The buyer's email rides along so the thank-you can say where it went; this tab only,
        // never a beacon or the tag manager, and the thank-you clears it once shown.
        var keep = b.deliver ? { to: 'them', date: b.deliver.date, hour: b.deliver.hour } : { to: 'me' };
        keep.email = b.email; keep.printed = !!b.ship_to;
        try { sessionStorage.setItem('ga_deliver', JSON.stringify(keep)); } catch (e) {}
        location.assign(res.url);
      } });
      var d = b.deliver, them = !!d;
      var head = el('p', { 'class': 'gh-eyebrow', tabindex: '-1', text: w('confirm_eyebrow') });
      // The buyer's own email, seen before paying, one tap from the field to fix it.
      var mine = el('p', { 'class': 'gh-fine ga-mine' }, [w(them ? 'confirm_to_you' : 'confirm_to_me').replace('{email}', b.email) + ' ',
        el('button', { type: 'button', 'class': 'ga-inline', 'aria-label': w('confirm_change') + ': ' + w('email_label'), text: w('confirm_change'), onclick: function () {
          show([form()]);
          var x = document.getElementById('ga-email'); if (x) { x.focus(); x.select && x.select(); }
        } })]);
      show([el('div', { 'class': 'ga-confirm' }, [
        head,
        el('p', { 'class': 'ga-confirm__names' }, [w('card_for') + ' ' + b.recipient_names, el('span', { text: w('card_from') + ' ' + b.giver_name })]),
        mine,
        them ? el('p', { 'class': 'gh-fine', text: w('confirm_them').replace('{email}', d.email).replace('{when}', whenWords(d.date, d.hour)) }) : null,
        them && d.message ? el('p', { 'class': 'ga-confirm__note', 'aria-label': w('confirm_note') }, [d.message]) : null,
        b.ship_to ? el('p', { 'class': 'gh-fine', text: w('confirm_mail') + ' ' + where + '.' }) : null,
        el('div', {}, amount),
        pay,
        el('button', { type: 'button', 'class': 'gh-back', text: w('change'), onclick: function () { show([form()]); } }),
        el('p', { 'class': 'gh-fine', text: w('pay_fine') })
      ])]);
      try { head.focus({ preventScroll: true }); } catch (e) {}
    }

    // Is the sales door open? GET /v1/health says so, gift_sales true or false (the engine, main
    // 002ab6c). A missing field or a failed read counts as closed: the call-or-text panel.
    G.api(API, '/v1/health', null, 8000).then(function (h) {
      canDeliver = !!(h && h.gift_delivery === true);
      if (h && h.gift_sales === true) show([form()]); else off('off');
    }, function (e) { off(unreachable(e) ? 'down' : 'off'); });
  }

  // =================================================== /gift/card: the card

  function Card(root) {
    var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
    var CODE = String((window.__ghKeys || {}).code || '');
    var wait = root.querySelector('[data-ga-wait]'), fig = root.querySelector('[data-ga-card]');
    var note = root.querySelector('[data-ga-note]'), actions = root.querySelector('[data-ga-actions]');
    var keep = root.querySelector('[data-ga-keep]'), out = root.querySelector('[data-ga-share-out]');
    var status = root.querySelector('[data-ga-status]');
    function say(k, text) { wait.hidden = true; note.textContent = text || w(k); note.hidden = false; }

    // The stay's month in words, from the engine's "YYYY-MM" (or a date, or words already).
    function monthOf(g) {
      var m = String(g.month || g.check_in || '').trim(), x = /^(\d{4})-(\d{2})/.exec(m);
      return x ? new Date(+x[1], +x[2] - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : m;
    }
    function stateLine(state, g) {
      var m = monthOf(g), t = w('state_' + state);
      return m ? t.replace('{month}', m) : t.replace(/\s*\S+ \{month\}/, '');
    }
    // The reveal plays once per card on this device: a short hash of the code, never the code.
    function firstOpen() {
      var h = 5381;
      for (var i = 0; i < CODE.length; i++) h = ((h << 5) + h + CODE.charCodeAt(i)) >>> 0;
      var key = 'c' + h.toString(36), seen = [];
      try { seen = JSON.parse(localStorage.getItem('ga_opened') || '[]') || []; } catch (e) {}
      if (seen.indexOf(key) >= 0) return false;
      seen.push(key);
      try { localStorage.setItem('ga_opened', JSON.stringify(seen.slice(-20))); } catch (e) {}
      return true;
    }
    function reveal(card) {
      if (!firstOpen() || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      var stop = function () { card.classList.remove('is-opening'); };
      card.classList.add('is-opening');
      card.addEventListener('animationend', function (e) { if (e.animationName === 'ga-door-r') stop(); });
      setTimeout(stop, 1200);
    }

    function draw(g, state) {
      var card = fig.querySelector('.ga-card'), usable = state === 'unused';
      var giver = String(g.giver_name || '').trim();
      card.querySelector('[data-fill="names"]').textContent = String(g.recipient_names || '').trim();
      card.querySelector('[data-fill="giver"]').textContent = giver;
      // The giver's note, under the dedication, as they wrote it (text only, line breaks kept).
      var msg = String(g.message || '').trim(), box = fig.querySelector('[data-ga-message]');
      if (msg && box) {
        box.querySelector('[data-ga-message-from]').textContent = w('note_from').replace('{giver}', giver);
        box.querySelector('[data-ga-message-text]').textContent = msg;
        box.hidden = false;
      }
      // The gift's number is its code (LF-XXXX-XXXX), as the card prints it: what the couple
      // reads to Mick when they call, and what the link carries.
      var no = card.querySelector('[data-ga-giftno]'), num = String(g.code || '').trim();
      if (no && num) { no.querySelector('[data-fill="giftno"]').textContent = num; no.hidden = false; }
      // A gift with its own window: the engine's dates line for it, or none (never January to May).
      var nights = card.querySelector('.ga-nights');
      if (nights && g.window) {
        var line = String(g.window.line || '').trim();
        if (line) nights.textContent = line; else nights.hidden = true;
      }
      wait.hidden = true; note.hidden = true;
      fig.hidden = false;
      fit(card);
      reveal(card);
      status.textContent = stateLine(state, g);
      status.hidden = false;
      actions.hidden = false;
      root.querySelector('[data-ga-dates]').hidden = !usable;
      keep.hidden = !usable;
    }

    // Lost card: the email that bought it, and the engine's one sentence, whatever it is.
    function lost() {
      var form = root.querySelector('[data-ga-lost]');
      if (!form) return;
      var input = form.querySelector('#ga-lost-email'), err = form.querySelector('#ga-lost-error');
      var btn = form.querySelector('button[type=submit]'), out = form.querySelector('[data-ga-lost-said]');
      form.hidden = false;
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var email = input.value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = w('lost_need'); input.focus(); return; }
        err.textContent = ''; btn.disabled = true; btn.textContent = w('lost_sending');
        function done(t) { out.textContent = t; out.hidden = false; btn.hidden = true; input.disabled = true; }
        G.api(API, '/v1/gift/resend', { email: email }, 15000).then(function (r) {
          done(String((r && (r.message || r.sentence)) || '').trim() || w('lost_sent'));
        }, function (e) {
          if (routeOff(e)) return done(w('lost_off'));
          var t = e && e.body && typeof e.body.error === 'string' ? e.body.error.trim() : '';
          if (t) return done(t);
          btn.disabled = false; btn.textContent = w('lost_send'); err.textContent = w('card_down');
        });
      });
    }

    function load() {
      G.api(API, '/v1/gift?code=' + encodeURIComponent(CODE), null, 12000).then(function (g) {
        if (!g || g.product !== PRODUCT) return say('card_unknown');
        var st = String(g.status || '').toLowerCase(), state = String(g.state || '').toLowerCase();
        if (st === 'void') return say('card_void');
        // The engine's state (unused, booked, used); from the status when an older answer lacks it.
        if (!/^(unused|booked|used)$/.test(state)) state = USABLE[st] ? 'unused' : USED[st] ? 'used' : '';
        if (state) return draw(g, state);
        say('card_void');
      }).catch(function (e) {
        if (routeOff(e)) return say('card_off');
        if (unreachable(e)) return say('card_down');
        // A code it cannot find (404), or too many tries (429): the engine's sentence, as is, and
        // the lost-card form.
        say('card_unknown', e && e.body && e.body.error ? said(e) : '');
        if (e && e.status === 404) lost();
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

    if (!CODE) { say('card_none'); return lost(); }
    load();
  }

  // ====================================== /gift/manage: the buyer's change page

  // A card emailed to them on a day the buyer chose: its day, hour and email can change until it
  // goes; the note never does. The token arrives after # in the buyer's letter and the keys script
  // has lifted it out of the address bar; it goes to our own booking server and nowhere else.
  function Manage(root) {
    var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
    var TOKEN = String((window.__ghKeys || {}).token || '');
    function q(sel) { return root.querySelector(sel); }
    var wait = q('[data-ga-wait]'), note = q('[data-ga-note]'), letter = q('[data-ga-letter]');
    var saved = q('[data-ga-saved]'), change = q('[data-ga-change]');
    function say(t) { wait.hidden = true; letter.hidden = true; change.replaceChildren(); note.textContent = t; note.hidden = false; }
    function fail(e) {
      if (routeOff(e)) return say(w('manage_off'));
      if (unreachable(e)) return say(w('manage_down'));
      say(e && e.body && e.body.error ? said(e) : w('manage_down'));
    }

    function render(v) {
      wait.hidden = true; note.hidden = true;
      letter.querySelector('[data-v="names"]').textContent = String(v.recipient_names || '').trim();
      letter.querySelector('[data-v="giver"]').textContent = String(v.giver_name || '').trim();
      letter.querySelector('[data-v="when"]').textContent = w(v.sent ? 'manage_went' : 'manage_goes')
        .replace('{email}', String(v.email || '')).replace('{when}', String(v.when || ''));
      var msg = String(v.message || '').trim(), nb = letter.querySelector('[data-ga-letter-note]');
      nb.querySelector('[data-v="message"]').textContent = msg;
      nb.hidden = !msg;
      letter.hidden = false;
      change.replaceChildren();
      if (v.can_change && !v.sent) change.appendChild(form(v));
    }

    function form(v) {
      var t = { email: String(v.email || ''), day: String(v.date || ''), hour: +v.hour || 0, pick: '' };
      var err = el('p', { 'class': 'gh-error', id: 'ga-change-error', role: 'alert' });
      var btn = el('button', { type: 'submit', 'class': 'lf-btn gh-btn--dark', text: w('manage_save') });
      function focus(id) { var n = document.getElementById(id); if (n && n.focus) n.focus(); }
      return el('form', { 'class': 'ga-change', novalidate: 'novalidate', 'aria-labelledby': 'ga-change-h', onsubmit: function (ev) {
        ev.preventDefault();
        saved.textContent = '';
        if (!/^\S+@\S+\.\S+$/.test(t.email.trim())) { err.textContent = w('need_their_email'); return focus('ga-their-email'); }
        var wp = whenProblem(t.day, t.hour);
        if (wp) { err.textContent = w(wp); return focus(wp === 'need_day' ? 'ga-day' : 'ga-hour'); }
        err.textContent = ''; btn.disabled = true; btn.textContent = w('manage_saving');
        G.api(API, '/v1/gift/delivery', { token: TOKEN, date: t.day, hour: +t.hour, email: t.email.trim() }, 15000).then(function (nv) {
          render(nv);
          saved.textContent = w('manage_saved').replace('{email}', String(nv.email || '')).replace('{when}', String(nv.when || ''));
        }, function (e) {
          btn.disabled = false; btn.textContent = w('manage_save');
          if (routeOff(e)) return say(w('manage_off'));
          // Already emailed (422): the engine's sentence, and the page as it now stands.
          if (e && e.status === 422 && e.body && e.body.error) { load(); saved.textContent = said(e); return; }
          err.textContent = e && e.body && e.body.error ? said(e) : w('manage_down');
        });
      } }, [el('h2', { 'class': 'ga-change__h', id: 'ga-change-h', text: w('manage_change_h') }),
        inputField(t, 'ga-their-email', 'email', w('their_email_label'), { type: 'email', auto: 'off', mode: 'email' })]
        .concat(whenPicker(t)).concat([err, btn, el('p', { 'class': 'gh-fine', text: w('questions') })]).filter(Boolean));
    }

    function load() { G.api(API, '/v1/gift/delivery?token=' + encodeURIComponent(TOKEN), null, 12000).then(render, fail); }
    if (!TOKEN) return say(w('manage_none'));
    load();
  }

  // ============================================ /gift/thanks: how the card arrives

  function Thanks(root) {
    var d = null;
    try { d = JSON.parse(sessionStorage.getItem('ga_deliver') || 'null'); } catch (e) {}
    if (!d) return;
    // Shown once, then cleared: a refresh shows the general lines.
    try { sessionStorage.removeItem('ga_deliver'); } catch (e) {}
    var lead = root.querySelector('[data-ga-thanks-lead]'), me = root.querySelector('[data-ga-thanks-me]');
    var you = root.querySelector('[data-ga-thanks-you]'), printed = root.querySelector('[data-ga-thanks-printed]');
    var email = typeof d.email === 'string' && /^\S+@\S+\.\S+$/.test(d.email) ? d.email : '';
    if (d.to === 'them' && /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') && d.hour >= 0 && d.hour <= 23) {
      lead.textContent = w('thanks_them').replace('{when}', whenWords(d.date, d.hour));
      me.hidden = true;
      if (email) { you.textContent = w('thanks_you_at').replace('{email}', email); you.hidden = false; }
    } else if (d.to === 'me') lead.textContent = email ? w('thanks_me').replace('{email}', email) : w('thanks_me_inbox');
    else return;
    if (d.printed) printed.textContent = w('thanks_printed'); else printed.hidden = true;
  }

  var buy = document.getElementById('ga-buy');
  if (buy) Buy(buy);
  var page = document.getElementById('ga-card-page');
  if (page) Card(page);
  var thanks = document.getElementById('ga-thanks');
  if (thanks) Thanks(thanks);
  var manage = document.getElementById('ga-manage');
  if (manage) Manage(manage);
})();
