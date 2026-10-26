/* ============================================================
   THE GATEHOUSE · booking on our own domain
   Our calendar, our checkout, Stripe direct (Mick, 2026-10-19:
   no Hostfully anywhere). The API is book.loxleyforest.com; its
   contract is loxley-rescue docs/briefs/2026-10-19-review-booking-engine.md,
   section D.

   Drop onto a page:
     <div id="gatehouse"
          data-api="https://book.loxleyforest.com"
          data-unit="loxley-forest-canopy-treehouse-dahlonega"
          data-stripe-key="pk_live_..."   (publishable, not a secret)
          data-handoff="/book"            (optional: show the calendar and the
                                           total, then carry the dates to /book)
          data-fallback="#id"></div>      (shown when the API cannot be reached)

   /book is the checkout: pick nights, see the all-in total, choose how
   to pay; then the email first (kept with the dates as a checkout lead),
   details, guests and dogs, the booking summary, the stay agreement in
   its own short version with the full text one tap away, one tick and a
   typed name; then Stripe.
   Dates live in the link (?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD), so
   back and refresh keep them. If the API cannot be reached, the
   request-dates form takes over; there is no preview mode.

   Also exposes window.Gatehouse: the shared helpers and the calendar,
   used by js/gatehouse-stay.js on /booked and /manage.
   ============================================================ */
(function () {
  'use strict';

  var PHONE = '706-502-4823';
  var TEL = 'tel:+17065024823';
  var SMS = 'sms:+17065024823';
  var CHECK_IN_TIME = '3:00 PM';
  var CHECK_OUT_TIME = '11:00 AM';
  var MONTHS_AHEAD = 12;
  var OFFLINE = "We couldn't reach our booking system just now. Nothing was charged. Please try again in a moment, or call or text " + PHONE + '.';

  // ---------------------------------------------------------------- helpers

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false || c === '') return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function iso(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function isDay(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(parse(s)); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  // "Today" is the Eastern date, as the booking system counts it.
  function today() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) { return iso(new Date()); }
  }

  // Money is shown to the cent everywhere a guest adds it up.
  function money(cents) {
    cents = Number(cents) || 0;
    return (cents < 0 ? '-' : '') + '$' + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // A night's rate inside a calendar cell, where there is room for dollars only.
  function dollars(cents) { return '$' + Math.round(cents / 100).toLocaleString('en-US'); }

  function fmt(s, o) { return parse(s).toLocaleDateString('en-US', o); }
  function short(s) { return fmt(s, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function shortYear(s) { return fmt(s, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  function long(s) { return fmt(s, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function longNoYear(s) { return fmt(s, { weekday: 'long', month: 'long', day: 'numeric' }); }
  function span(a, b) {
    var sameYear = a.slice(0, 4) === b.slice(0, 4);
    return (sameYear ? short(a) : shortYear(a)) + ' to ' + shortYear(b);
  }
  function nightsWord(n) { return n + ' night' + (n === 1 ? '' : 's'); }

  // An ISO time from the API ("2026-11-05T23:59:00-05:00", already Eastern) in words:
  // "11:59 PM Eastern, Thursday, November 5, 2026".
  function moment(t) {
    var m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(t || '');
    if (!m) return '';
    if (!m[2]) return long(m[1]);
    var h = +m[2], ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m[3] + ' ' + ap + ' Eastern, ' + long(m[1]);
  }
  // The last moment to move or cancel: the API's change_until, or the agreement's rule
  // (11:59 PM Eastern, 7 days before arrival) when an older answer lacks it.
  function changeUntil(value, checkIn) {
    return value ? moment(value) : (checkIn ? '11:59 PM Eastern, ' + long(addDays(checkIn, -7)) : '');
  }
  // Inside the last week that moment has passed; a date in the past is not shown (2026-10-26: a
  // stay four days out read "Last moment to move or cancel ... October 20").
  function changePassed(value, checkIn) {
    var t = value ? Date.parse(value) : (checkIn ? Date.parse(addDays(checkIn, -6) + 'T04:59:00Z') : NaN);
    return !isNaN(t) && t < Date.now();
  }

  function withArticle(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }
  function giftLine(gift) {
    if (!gift) return '';
    return 'Your first morning brings ' + withArticle(String(gift).replace(/,\s*first morning\s*$/i, '')) + ', on the house.';
  }

  // Refusals come back as one sentence; make sure it reads as one, with real dates.
  function plain(msg) {
    var s = String(msg || '').trim()
      .replace(/\b(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g, function (x) { return moment(x); })
      .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, function (x) { return isDay(x) ? long(x) : x; });
    if (!s) return '';
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!/[.!?]$/.test(s)) s += '.';
    return s;
  }
  function errorText(status, body) {
    if (status === 0 || !body || !body.error) {
      if (status === 429) return 'Too many tries in a short time. Please wait a few minutes and try again, or call or text ' + PHONE + '.';
      return OFFLINE;
    }
    var s = plain(body.error);
    if (status >= 500) s += ' Nothing was charged.';
    return s + ' Questions? Call or text ' + PHONE + '.';
  }

  // Every call: a timeout, and a sentence a guest can read whatever goes wrong
  // (never "Failed to fetch" or "Unexpected token '<'").
  function api(base, path, body, timeoutMs) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 15000) : null;
    var init = { cache: 'no-store' };
    if (ctl) init.signal = ctl.signal;
    if (body) { init.method = 'POST'; init.headers = { 'Content-Type': 'application/json' }; init.body = JSON.stringify(body); }
    function fail(status, j) { var e = new Error(errorText(status, j)); e.status = status; e.body = j; throw e; }
    return fetch(base + path, init).then(function (r) {
      return r.text().then(function (t) {
        clearTimeout(timer);
        var j = null;
        try { j = JSON.parse(t); } catch (e) { j = null; }
        if (!r.ok || !j || typeof j !== 'object') fail(r.status || 0, j);
        return j;
      });
    }, function () { clearTimeout(timer); fail(0, null); });
  }

  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: event };
    Object.keys(data || {}).forEach(function (k) { payload[k] = data[k]; });
    window.dataLayer.push(payload);
  }

  // ------------------------------------------------- the agreement, as text

  // The agreement is markdown (clients/loxley/agreement.md). Rendered as formatted
  // text: headings, paragraphs, lists, bold and italics. Built with text nodes only,
  // so nothing in it can run as markup.
  function inline(s) {
    var out = [], re = /(\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(((?:https:|mailto:|tel:)[^)\s]+)\))/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(s.slice(last, m.index));
      if (m[2]) out.push(el('strong', { text: m[2] }));
      else if (m[3]) out.push(el('em', { text: m[3] }));
      else out.push(el('a', { href: m[5], text: m[4] }));
      last = re.lastIndex;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }
  function markdown(text) {
    var frag = document.createDocumentFragment(), para = [], list = null;
    function flushPara() { if (para.length) { frag.appendChild(el('p', {}, inline(para.join(' ')))); para = []; } }
    function flushList() { if (list) { frag.appendChild(list); list = null; } }
    String(text || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
      var h = /^(#{1,6})\s+(.*)$/.exec(line), li = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
      if (!line.trim()) { flushPara(); flushList(); return; }
      if (h) { flushPara(); flushList(); frag.appendChild(el('h' + Math.min(h[1].length + 2, 6), {}, inline(h[2].trim()))); return; }
      if (li) { flushPara(); if (!list) list = el(/^\s*\d/.test(line) ? 'ol' : 'ul'); list.appendChild(el('li', {}, inline(li[1]))); return; }
      if (list && /^\s+\S/.test(line)) { list.lastChild.appendChild(document.createTextNode(' ')); inline(line.trim()).forEach(function (n) { list.lastChild.appendChild(typeof n === 'string' ? document.createTextNode(n) : n); }); return; }
      flushList(); para.push(line.trim());
    });
    flushPara(); flushList();
    return frag;
  }
  // The bold release paragraph, word for word, to repeat beside the tick box.
  function releaseText(text) {
    var m = String(text || '').match(/^\s*\*\*([^*\n]*\brelease[^*\n]*)\*\*\s*$/im);
    return m ? m[1] : '';
  }
  // The agreement's own short version: the text under its "In short" heading, word for word,
  // shown first on the pay step with the full text one tap away (2026-10-24). Not a word of it
  // is written here: an agreement with no such heading shows in full, as before.
  function shortVersion(text) {
    var out = [], on = false;
    String(text || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n').split('\n').some(function (line) {
      var h = /^#{1,6}\s+(.*)$/.exec(line);
      if (h) { if (on) return true; on = /^in short$/i.test(h[1].trim()); return false; }
      if (on) out.push(line);
      return false;
    });
    return out.join('\n').trim();
  }

  // ------------------------------------------------------------ calendar

  // One calendar for /book, the home and treehouse pages, and a move on /manage.
  // opts: nights {day: {rate_cents, min_stay, max_stay}}, checkIn, checkOut,
  //       onChange(cal) after any pick or clear, label (aria) .
  function Calendar(opts) {
    var now = today();
    var c = {
      nights: opts.nights || {},
      checkIn: opts.checkIn || null,
      checkOut: opts.checkOut || null,
      note: '',
      first: parse(now.slice(0, 8) + '01'),
      last: (function () { var d = parse(now); d.setMonth(d.getMonth() + (opts.monthsAhead || MONTHS_AHEAD)); return new Date(d.getFullYear(), d.getMonth(), 1); })()
    };
    c.month = c.checkIn ? parse(c.checkIn.slice(0, 8) + '01') : c.first;

    c.stayOk = function (ci, co) {
      var first = c.nights[ci];
      if (!first) return short(ci) + ' is not open.';
      var n = daysBetween(ci, co);
      if (n < 1) return 'Your check-out day comes after ' + short(ci) + '.';
      // A single open night between two stays sells alone (the engine's gap), never under a minimum of three.
      if (first.min_stay && n < first.min_stay && !(n === 1 && first.gap && first.min_stay <= 2)) return 'A stay starting ' + short(ci) + ' is at least ' + nightsWord(first.min_stay) + '.';
      if (first.max_stay && n > first.max_stay) return 'A stay starting ' + short(ci) + ' is at most ' + nightsWord(first.max_stay) + '.';
      for (var d = ci; d < co; d = addDays(d, 1)) {
        if (!c.nights[d]) return short(d) + ' is already taken. Try nights before it, or other dates.';
      }
      return '';
    };

    c.pick = function (day) {
      if (!c.checkIn || c.checkOut || day <= c.checkIn) {
        if (!c.nights[day]) return;
        // A night nobody may arrive on (the holidays): say so at the tap, not at the price.
        if (c.nights[day].no_arrival && (!c.checkIn || c.checkOut || day <= c.checkIn)) {
          c.note = 'No check-in on ' + short(day) + '. Arrive an earlier day and stay through.';
          if (opts.onRefuse) opts.onRefuse(c.note, day);
          opts.onChange(c); return;
        }
        c.checkIn = day; c.checkOut = null;
        c.note = 'Arriving ' + short(day) + '. Now choose your check-out day.';
      } else {
        var why = c.stayOk(c.checkIn, day);
        if (why) { c.note = why; if (opts.onRefuse) opts.onRefuse(why, c.checkIn); opts.onChange(c); return; }
        c.checkOut = day; c.note = '';
      }
      opts.onChange(c);
    };

    c.clear = function () { c.checkIn = null; c.checkOut = null; c.note = ''; opts.onChange(c); };

    c.set = function (ci, co) {
      c.checkIn = ci || null; c.checkOut = co || null; c.note = '';
      if (ci) c.month = parse(ci.slice(0, 8) + '01');
    };

    function grid(first) {
      var y = first.getFullYear(), m = first.getMonth(), t = today();
      var label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      var g = el('div', { 'class': 'gh-grid', role: 'group', 'aria-label': label });
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (w) { g.appendChild(el('span', { 'class': 'gh-dow', 'aria-hidden': 'true', text: w })); });
      for (var i = 0, lead = new Date(y, m, 1).getDay(); i < lead; i++) g.appendChild(el('span', { 'class': 'gh-pad' }));
      for (var d = 1, days = new Date(y, m + 1, 0).getDate(); d <= days; d++) {
        var day = iso(new Date(y, m, d)), night = c.nights[day];
        var inRange = c.checkIn && c.checkOut && day > c.checkIn && day < c.checkOut;
        var isEdge = day === c.checkIn || day === c.checkOut;
        // A check-out day may fall on a night someone else has: they leave that morning.
        var endable = c.checkIn && !c.checkOut && day > c.checkIn && !c.stayOk(c.checkIn, day);
        var usable = day >= t && (night || endable);
        var priced = night && night.rate_cents && day >= t;
        var cls = 'gh-day' + (night ? '' : ' gh-day--taken') + (night && night.own ? ' gh-day--own' : '') + (inRange ? ' gh-day--range' : '') +
          (isEdge ? ' gh-day--edge' : '') + (endable ? ' gh-day--endable' : '');
        var sr = long(day) + (priced ? ', ' + money(night.rate_cents) + ' a night' : night && night.own ? ', one of your nights' : endable ? ', check-out' : ', not available');
        g.appendChild(el('button', {
          type: 'button', 'class': cls, 'data-day': day, 'aria-pressed': isEdge ? 'true' : 'false', disabled: usable ? null : 'disabled',
          onclick: (function (x) { return function () { c.pick(x); }; })(day)
        }, [el('span', { 'class': 'gh-num', text: String(d) }),
            el('span', { 'class': 'gh-rate', text: priced ? dollars(night.rate_cents) : '' }),
            el('span', { 'class': 'gh-sr', text: ' ' + sr })]));
      }
      return el('div', { 'class': 'gh-month' }, [el('h3', { 'class': 'gh-month__name', text: label }), g]);
    }

    c.render = function () {
      var next = new Date(c.month.getFullYear(), c.month.getMonth() + 1, 1);
      var nav = el('div', { 'class': 'gh-nav' }, [
        el('button', { type: 'button', 'class': 'gh-arrow', 'aria-label': 'Earlier months', text: '‹',
          disabled: c.month <= c.first ? 'disabled' : null,
          onclick: function () { c.month = new Date(c.month.getFullYear(), c.month.getMonth() - 1, 1); opts.onChange(c, true); } }),
        c.checkIn ? el('button', { type: 'button', 'class': 'gh-clear', text: 'Clear dates', onclick: c.clear }) : el('span', { 'class': 'gh-hint', text: opts.hint || 'Tap your first night' }),
        el('button', { type: 'button', 'class': 'gh-arrow', 'aria-label': 'Later months', text: '›',
          disabled: c.month >= c.last ? 'disabled' : null,
          onclick: function () { c.month = new Date(c.month.getFullYear(), c.month.getMonth() + 1, 1); opts.onChange(c, true); } })
      ]);
      return el('div', { 'class': 'gh-calendar', 'aria-label': opts.label || 'Choose your nights' }, [
        nav, el('div', { 'class': 'gh-months' }, [grid(c.month), grid(next)]),
        el('p', { 'class': 'gh-note', 'aria-live': 'polite', text: c.note })
      ]);
    };
    return c;
  }

  // Open nights for a unit as {day: night}, today through the months ahead.
  function availability(base, unit, extra) {
    var from = today(), to = (function () { var d = parse(from); d.setMonth(d.getMonth() + MONTHS_AHEAD); return iso(d); })();
    return api(base, '/v1/availability?unit=' + encodeURIComponent(unit) + '&from=' + from + '&to=' + to + (extra || '')).then(function (r) {
      var nights = {};
      (r.nights || []).forEach(function (n) { nights[n.night] = n; });
      return nights;
    });
  }

  // ------------------------------------------------------------- payment

  function loadStripe() {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = function () { window.Stripe ? ok(window.Stripe) : fail(); };
      s.onerror = function () { fail(); };
      document.head.appendChild(s);
    }).catch(function () {
      throw new Error('Secure payment could not load. Nothing was charged. Please check your connection and try again, or call or text ' + PHONE + '.');
    });
  }

  var mounted = null;
  // Stripe's embedded checkout, in place. One at a time: a second mount replaces the first.
  function mountStripe(key, secret, target) {
    if (!key) {
      return Promise.reject(new Error('Online payment opens shortly. To book now, call or text ' + PHONE + ' and we will take it from here. Nothing was charged.'));
    }
    return loadStripe().then(function (Stripe) {
      if (mounted) { try { mounted.destroy(); } catch (e) {} mounted = null; }
      return Stripe(key).initEmbeddedCheckout({ fetchClientSecret: function () { return Promise.resolve(secret); } });
    }).then(function (checkout) {
      mounted = checkout;
      checkout.mount(target);
      return checkout;
    }).catch(function (e) {
      throw (e && /Nothing was charged/.test(e.message)) ? e : new Error('Secure payment could not open. Nothing was charged. Please try again, or call or text ' + PHONE + '.');
    });
  }

  // ------------------------------------------------- add to calendar (.ics)

  // Built in the browser and handed over as a file: no guest name in any link.
  function icsFile(stay, manageUrl) {
    function stamp(day, hhmm) { return day.replace(/-/g, '') + 'T' + hhmm + '00'; }
    function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    var now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var uid = 'stay-' + stay.check_in + '-' + Math.random().toString(36).slice(2, 10) + '@loxleyforest.com';
    var desc = 'Check-in from ' + CHECK_IN_TIME + '. Check-out by ' + CHECK_OUT_TIME + '.\n' +
      'The way in arrives by email the day before you do.\n' +
      (manageUrl ? 'Your stay: ' + manageUrl + '\n' : '') + 'Questions: call or text ' + PHONE + '.';
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Loxley Forest//Your stay//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE', 'TZID:America/New_York',
      'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
      'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD',
      'END:VTIMEZONE',
      'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + now,
      'DTSTART;TZID=America/New_York:' + stamp(stay.check_in, '1500'),
      'DTEND;TZID=America/New_York:' + stamp(stay.check_out, '1100'),
      'SUMMARY:' + esc('Loxley Forest: your treehouse stay'),
      'LOCATION:' + esc('Loxley Forest, Dahlonega, Georgia'),
      'DESCRIPTION:' + esc(desc),
      'URL:https://loxleyforest.com',
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return lines.join('\r\n') + '\r\n';
  }
  function addToCalendar(stay, manageUrl) {
    var blob = new Blob([icsFile(stay, manageUrl)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: 'loxley-forest-stay.ics' });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
    track('gh_add_to_calendar', {});
  }

  window.Gatehouse = {
    PHONE: PHONE, TEL: TEL, SMS: SMS, CHECK_IN_TIME: CHECK_IN_TIME, CHECK_OUT_TIME: CHECK_OUT_TIME,
    el: el, iso: iso, parse: parse, addDays: addDays, daysBetween: daysBetween, today: today,
    money: money, short: short, shortYear: shortYear, long: long, longNoYear: longNoYear, span: span,
    nightsWord: nightsWord, moment: moment, changeUntil: changeUntil, giftLine: giftLine, plain: plain,
    api: api, track: track, Calendar: Calendar, availability: availability, mountStripe: mountStripe,
    addToCalendar: addToCalendar, icsFile: icsFile, markdown: markdown, releaseText: releaseText
  };

  // ======================================================== the booking page

  var root = document.getElementById('gatehouse');
  if (!root) return;

  var API = (root.getAttribute('data-api') || '').replace(/\/$/, '');
  var UNIT = root.getAttribute('data-unit') || '';
  // The publishable key: set at cutover. Without it, payment says plainly that it opens
  // shortly and gives the phone number; nights are never claimed without a way to pay.
  var STRIPE_KEY = root.getAttribute('data-stripe-key') || '';
  var HANDOFF = root.getAttribute('data-handoff') || '';
  var FALLBACK = root.getAttribute('data-fallback') || '';
  var QS = new URLSearchParams(location.search);
  // Keys arrive after # and are lifted out of the address bar by the head script on /book
  // (build_v2.py KEYS_SCRIPT) before Tag Manager loads; they live in window.__ghKeys.
  var KEYS = window.__ghKeys || {};
  // A hold's key: a Hold my dates link from before it was retired (2026-10-19), or, once the
  // talk card's 'hold' mode is on (js/talk.js CARD_EMAIL, off), the link its email carries
  // (#hold=, lifted out of the address bar by the head script like every key) or a hold made
  // on this page (Gatehouse.useHold below). It rides the calendar, the quote and the checkout,
  // so held nights are open to their holder at payment. The API ignores a hold it no longer
  // has. Never a beacon, never the tag manager.
  var HOLD = KEYS.hold || '';
  // A credit to spend: the manage key of a cancelled stay, from its manage page (/book#credit=).
  var CREDIT = KEYS.credit || '';

  var state = {
    agreement: null,
    quote: null,
    payMode: null,
    busy: false,
    step: 'dates',           // 'dates' or 'pay'
    form: {},                // what the guest typed, kept across steps
    marker: { open: false, email: '', done: false, error: '' },
    pending: null,           // a checkout already opened for these exact details
    credit: null             // {cents, expires_on} when spending one
  };
  var cal = null, quoteFor = '';

  // ---- measurement: the tag manager AND our own server ----
  // The visit id is the page beacon's (js/funnel.js), so a visit's pages and booking steps join.
  var VISIT = window.lfFunnel ? window.lfFunnel.visit : (function () {
    try {
      var v = sessionStorage.getItem('gh_visit');
      if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('gh_visit', v); }
      return v;
    } catch (e) { return Math.random().toString(36).slice(2); }
  })();
  var STEP_FOR = { gh_view: 'view', gh_dates_chosen: 'dates_chosen', gh_payment_mode: 'payment_mode',
    begin_checkout: 'begin_checkout', add_payment_info: 'add_payment_info', gh_fallback_shown: 'fallback_shown',
    // 2026-10-26 (the CEO's funnel piece): the "Book these nights" tap, and dates refused, by a code.
    gh_handoff: 'handoff', gh_quote_refused: 'quote_refused' };

  // Where this guest came from: a letter or trail marker (src, card), an ad (gclid and
  // friends), a campaign (utm_*). Kept for the visit, sent with the booking.
  var ATTR = (function () {
    var keys = ['src', 'card', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
    var a = {};
    try { a = JSON.parse(localStorage.getItem('gh_attr') || '{}') || {}; } catch (e) {}
    var fresh = false;
    keys.forEach(function (k) { if (QS.get(k)) { a[k] = QS.get(k).slice(0, 120); fresh = true; } });
    try {
      var saved = JSON.parse(localStorage.getItem('loxley_attribution') || 'null');
      if (saved) ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { if (saved[k] && !a[k]) a[k] = saved[k]; });
    } catch (e) {}
    if (fresh) { a.landing = location.pathname; a.referrer = (document.referrer || '').slice(0, 120); }
    try { localStorage.setItem('gh_attr', JSON.stringify(a)); } catch (e) {}
    return a;
  })();

  // Every beacon goes through the page beacon's scrub (js/funnel.js, loaded on every page before
  // this file): known fields only, plain short values, nothing shaped like a key. Without it,
  // nothing is sent rather than something unscrubbed.
  function beacon(step, extra) {
    if (!API || !window.lfFunnel) return;
    var body = { visit: VISIT, step: step, unit: UNIT, src: ATTR.src || '' };
    Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
    window.lfFunnel.send(API, body);
  }

  // The check-in date rides on these three (the flywheel contract, 2026-10-20), so weekends and
  // weeknights can be told apart.
  var WITH_CHECK_IN = { dates_chosen: 1, begin_checkout: 1, add_payment_info: 1, handoff: 1 };

  // Why dates were refused, as one of the engine's codes (gatehouse/counts.py REFUSE_REASONS), never
  // the sentence: taken, min_stay, no_arrival, too_far (past the last open night), other.
  function refusedCode(why, ci) {
    why = String(why || '');
    if (/already taken/.test(why)) return 'taken';
    if (/No check-in/.test(why)) return 'no_arrival';
    if (/at least/.test(why)) return 'min_stay';
    if (/not open/.test(why)) {
      var last = Object.keys((cal && cal.nights) || {}).sort().pop();
      return !last || (ci && ci > last) ? 'too_far' : 'other';
    }
    return 'other';
  }
  function refused(why, ci) { step('gh_quote_refused', { gh_reason: refusedCode(why, ci) }); }

  function step(event, data) {
    data = data || {};
    var payload = { gh_unit: UNIT };
    Object.keys(data).forEach(function (k) { payload[k] = data[k]; });
    track(event, payload);
    if (STEP_FOR[event]) {
      beacon(STEP_FOR[event], { mode: data.gh_mode || '', nights: data.gh_nights || '',
        value_cents: data.value ? Math.round(data.value * 100) : '',
        check_in: WITH_CHECK_IN[STEP_FOR[event]] ? data.gh_check_in || '' : '', reason: data.gh_reason || '' });
    }
  }

  function call(path, body) { return api(API, path, body); }

  // ---- for the talk card's email (js/talk.js, 2026-10-24) ----
  // booking(): the stay whose all-in total is on screen, before checkout begins; null at any
  // other moment. leaveMarker(email): the trail marker below, the same call and the same body,
  // resolving to its done line. useHold(key): 'hold' mode only, a hold the card made, kept for
  // this tab (a refresh keeps it, as the head script keeps every key).
  window.Gatehouse.booking = function () {
    if (!API || HANDOFF || !cal || state.step !== 'dates' || !state.quote || !cal.checkIn || !cal.checkOut) return null;
    return { api: API, visit: VISIT, unit: UNIT, check_in: cal.checkIn, check_out: cal.checkOut,
      nights: state.quote.quote.nights, total_cents: state.quote.quote.total_cents,
      guests: /^[1-6]$/.test(String(state.form.guests || '')) ? +state.form.guests : 0,
      marker_done: !!state.marker.done, held: !!HOLD };
  };
  window.Gatehouse.leaveMarker = function (email) {
    if (!window.Gatehouse.booking()) return Promise.reject(new Error('no stay on screen'));
    return leaveMarker(email);
  };
  window.Gatehouse.useHold = function (key) {
    key = String(key || '');
    if (!key) return;
    HOLD = key;
    KEYS.hold = key;
    try {
      var p = location.pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1');
      var st = JSON.parse(sessionStorage.getItem('gh_keys') || '{}') || {};
      st[p] = st[p] || {};
      st[p].hold = key;
      sessionStorage.setItem('gh_keys', JSON.stringify(st));
    } catch (e) {}
  };

  // ---- the checkout lead (2026-10-24): the email, kept with these dates ----
  // When a guest types a working email at the top of the pay step and moves on, or opens the
  // pay step with one already typed, our own booking server keeps it with the visit and these
  // dates, so a guest who leaves is not lost. Never a beacon and never the tag manager: it goes
  // to book.loxleyforest.com alone, once per dates and address. The server sends nothing from
  // it. A failure is silent and tried again on the next change: it must never stand in the way.
  var EMAIL_OK = /^\S+@\S+\.\S+$/;
  var leadsSent = {};
  function sendLead(email) {
    email = String(email || '').trim();
    if (!API || HANDOFF || !state.quote || !cal || !cal.checkIn || !cal.checkOut || !EMAIL_OK.test(email)) return;
    var key = [cal.checkIn, cal.checkOut, email.toLowerCase()].join('|');
    if (leadsSent[key]) return;
    leadsSent[key] = true;
    call('/v1/lead', { visit: VISIT, unit: UNIT, email: email, check_in: cal.checkIn, check_out: cal.checkOut,
      nights: state.quote.quote.nights, total_cents: state.quote.quote.total_cents }).catch(function () { delete leadsSent[key]; });
  }

  // ---------------------------------------------------- the link holds the dates

  function writeUrl(push) {
    var q = new URLSearchParams(location.search);
    ['checkIn', 'checkOut', 'check_in', 'check_out', 'checkin', 'checkout', 'step'].forEach(function (k) { q.delete(k); });
    if (cal && cal.checkIn) q.set('checkIn', cal.checkIn);
    if (cal && cal.checkOut) q.set('checkOut', cal.checkOut);
    if (state.step === 'pay') q.set('step', 'pay');
    var s = q.toString(), url = location.pathname + (s ? '?' + s : '') + location.hash;
    if (url === location.pathname + location.search + location.hash) return;
    try { history[push ? 'pushState' : 'replaceState']({ gh: true }, '', url); } catch (e) {}
  }

  function readUrl() {
    var q = new URLSearchParams(location.search);
    var ci = q.get('checkIn') || q.get('check_in') || q.get('checkin');
    var co = q.get('checkOut') || q.get('check_out') || q.get('checkout');
    return { checkIn: isDay(ci) ? ci : null, checkOut: isDay(co) ? co : null, step: q.get('step') === 'pay' ? 'pay' : 'dates' };
  }

  // Dates from a link: chosen for the guest when they are open, explained when not.
  function applyUrl() {
    var u = readUrl(), t = today();
    if (!u.checkIn) { cal.set(null, null); state.quote = null; quoteFor = ''; return; }
    if (u.checkIn < t) {
      cal.set(null, null);
      cal.note = short(u.checkIn) + ' has already passed. Choose your nights on the calendar.';
      writeUrl(false); return;
    }
    if (!u.checkOut || u.checkOut <= u.checkIn) { cal.set(u.checkIn, null); if (!cal.nights[u.checkIn]) cal.set(null, null); return; }
    var why = cal.stayOk(u.checkIn, u.checkOut);
    if (why) {
      refused(why, u.checkIn);
      cal.set(null, null);
      cal.month = parse(u.checkIn.slice(0, 8) + '01');
      cal.note = 'The dates in your link, ' + span(u.checkIn, u.checkOut) + ", can't be booked now. " + why + ' Choose other nights, or call or text ' + PHONE + '.';
      writeUrl(false); return;
    }
    cal.set(u.checkIn, u.checkOut);
    getQuote(u.step === 'pay');
  }

  // ----------------------------------------------------------------- quote

  function onCalendar(c, navOnly) {
    if (navOnly) return render();
    state.step = 'dates';
    state.pending = null;
    state.marker = { open: false, email: state.marker.email, done: false, error: '' };
    if (c.checkIn && c.checkOut) {
      writeUrl(false);
      getQuote(false);
    } else {
      state.quote = null; quoteFor = '';
      if (c.checkIn) step('gh_checkin_chosen', { gh_check_in: c.checkIn });
      writeUrl(false);
    }
    render();
  }

  function getQuote(thenPay) {
    var ci = cal.checkIn, co = cal.checkOut, key = ci + '/' + co;
    if (quoteFor === key && state.quote) { if (thenPay) toCheckout(true); else render(); return; }
    state.busy = true; state.quote = null; quoteFor = key; render();
    // With a credit held, the engine spends it in the quote: summary comes back net of it, and
    // credit_cents says how much it actually used on these dates.
    call('/v1/quote?unit=' + encodeURIComponent(UNIT) + '&check_in=' + ci + '&check_out=' + co +
      (state.credit ? '&credit=' + encodeURIComponent(CREDIT) : '') + (HOLD ? '&hold=' + encodeURIComponent(HOLD) : '')).then(function (q) {
      if (quoteFor !== key) return;
      state.quote = q;
      if (!state.payMode || (q.modes || []).indexOf(state.payMode) < 0) state.payMode = (q.modes || [])[0];
      step('gh_dates_chosen', { gh_check_in: ci, gh_check_out: co, gh_nights: q.quote.nights, value: q.quote.total_cents / 100, currency: 'USD' });
    }).catch(function (e) {
      if (quoteFor !== key) return;
      quoteFor = '';
      if (e.status === 409) refused(e.message, ci);   // the engine refused the dates; not a lost connection
      cal.set(ci, null);
      cal.note = e.message;
      writeUrl(false);
    }).then(function () {
      if (quoteFor !== key && quoteFor !== '') return;
      state.busy = false;
      if (thenPay && state.quote) toCheckout(true); else render();
    });
  }

  // The quote's summary for a pay mode: {today_cents, balance_cents, balance_on, change_until}.
  // Read from the API; worked out from the plan only if an older answer lacks it.
  function summaryFor(q, mode) {
    var s = q.summary || null;
    if (s && s[mode]) s = s[mode];
    else if (!(s && s.today_cents !== undefined)) s = null;
    if (s) return s;
    var plan = (q.plans || {})[mode] || [];
    var now = plan.filter(function (p) { return !p.due_on; }).reduce(function (a, p) { return a + p.amount_cents; }, 0);
    var later = plan.filter(function (p) { return p.due_on; });
    return { today_cents: now, balance_cents: later.reduce(function (a, p) { return a + p.amount_cents; }, 0),
      balance_on: later.length ? later[0].due_on : null, change_until: null };
  }

  // The credit the engine spends on these dates (the quote's credit_cents): never the key's
  // whole balance, which these dates may not be able to use.
  function creditUsed(q) { return Math.max(0, Number(q && q.credit_cents) || 0); }
  // Nothing to pay today: only when a credit covers it.
  function coveredToday(q, mode) { return creditUsed(q) > 0 && !summaryFor(q, mode).today_cents; }

  function planLine(mode, q) {
    var s = summaryFor(q, mode), pct = (q.promise || {}).retainer_pct, used = creditUsed(q);
    if (used && !s.today_cents && !s.balance_cents) return { title: 'Covered by your credit', sub: 'Nothing to pay, today or later.' };
    if (mode === 'deposit') {
      return { title: 'Reserve with ' + money(s.today_cents) + ' today',
               sub: (pct ? 'A ' + pct + '% retainer deposit, non-refundable. ' : 'A retainer deposit, non-refundable. ') +
                    (s.balance_cents ? (used ? 'After your credit, the rest, ' : 'The rest, ') + money(s.balance_cents) + ', will be charged on ' + long(s.balance_on) + '.'
                      : used ? 'Your credit covers the rest.' : '') };
    }
    if (mode === 'affirm') return { title: 'Pay monthly with Affirm', sub: 'Choose a plan at checkout. Subject to approval.' };
    return { title: used ? 'Pay in full: ' + money(s.today_cents) + ' after your credit' : 'Pay in full, ' + money(q.quote.total_cents),
             sub: giftLine(q.gift_if_paid_in_full) || 'Nothing more to pay.' };
  }

  // A credit the guest came with, in plain words: what it takes off, or why it cannot be used
  // here. A guest who expected a credit is never charged full price without being told.
  function creditNotice(q) {
    if (!CREDIT) return null;
    if (!state.credit) {
      return el('p', { 'class': 'gh-credit gh-credit--off', role: 'status',
        text: 'We could not find a credit on your link, so these dates are at full price. If you expected one, call or text ' + PHONE + ' before you book.' });
    }
    if (!q) {
      return el('p', { 'class': 'gh-credit', text: 'Your credit, ' + money(state.credit.cents) + ', comes off your new stay' +
        (state.credit.expires_on ? ' if you arrive by ' + long(state.credit.expires_on) : '') + '.' });
    }
    var used = creditUsed(q), exp = state.credit.expires_on;
    if (used) return el('p', { 'class': 'gh-credit', text: 'Your credit takes ' + money(used) + ' off this stay.' });
    return el('p', { 'class': 'gh-credit gh-credit--off', role: 'status',
      text: 'Your credit of ' + money(state.credit.cents) + " can't be used for these dates" +
        (exp && cal.checkIn > exp ? ': it is good for stays arriving by ' + long(exp) + '.' : '.') +
        ' Choose other dates, or call or text ' + PHONE + ' before you book.' });
  }

  function ctaText(q, mode, forDetails) {
    var s = summaryFor(q, mode);
    if (coveredToday(q, mode)) return 'Book with your credit';
    if (forDetails) return 'Continue to payment · ' + money(s.today_cents) + ' today';
    return mode === 'deposit' ? 'Reserve for ' + money(s.today_cents)
      : mode === 'affirm' ? 'Continue with Affirm' : 'Book for ' + money(s.today_cents);
  }

  function forgetCredit() {
    try {
      var st = JSON.parse(sessionStorage.getItem('gh_keys') || '{}') || {};
      if (st['/book']) { delete st['/book'].credit; sessionStorage.setItem('gh_keys', JSON.stringify(st)); }
    } catch (e) {}
  }

  // Pay over time (Mick, 2026-10-19): Affirm or Klarna through Stripe, the house paid in
  // full up front. One quiet line, naming only the methods the quote's pay_later list holds;
  // nothing when the list is empty (the default). Checkout pages only, never marketing pages.
  var LATER_NAMES = { affirm: 'Affirm', klarna: 'Klarna', afterpay_clearpay: 'Afterpay', afterpay: 'Afterpay', zip: 'Zip' };
  function payLater(q) {
    var names = (Array.isArray(q.pay_later) ? q.pay_later : []).map(function (m) {
      var k = String(m || '').toLowerCase();
      return LATER_NAMES[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : '');
    }).filter(function (n, i, a) { return n && a.indexOf(n) === i; });
    if (!names.length) return '';
    var list = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1];
    return 'Or pay over time with ' + list + ' at checkout.';
  }

  function lines(q) {
    var dl = el('dl', { 'class': 'gh-lines' });
    (q.quote.lines || []).forEach(function (l) {
      dl.appendChild(el('dt', { text: l.label }));
      dl.appendChild(el('dd', { text: money(l.cents) }));
    });
    dl.appendChild(el('dt', { 'class': 'gh-total', text: 'Total' }));
    dl.appendChild(el('dd', { 'class': 'gh-total', text: money(q.quote.total_cents) }));
    return dl;
  }

  // Two nights by default, the third pushed (Mick, 2026-10-20): the quote's `extend` offers the
  // next night, one tap. Its price is the engine's, never worked out here: extend.add_cents, what
  // the all-in total grows by, rate and tax (loxley-rescue gatehouse/desk.py extend_offer).
  // No price, no offer.
  var EXTEND_WORDS = { 1: 'Make it two nights', 2: 'Add a third night' };
  function extendCents(x) { return Number(x.add_cents) > 0 ? Math.round(Number(x.add_cents)) : 0; }
  function plus(cents) {
    return '+' + (cents % 100 ? money(cents) : '$' + (cents / 100).toLocaleString('en-US'));
  }
  function extendOffer(q) {
    var x = q && q.extend, n = q && q.quote && q.quote.nights, words = EXTEND_WORDS[n];
    if (!x || typeof x !== 'object' || !words || !cal.checkIn || !cal.checkOut) return null;
    var add = extendCents(x), co = addDays(cal.checkOut, 1);
    // The calendar must agree the next night is open, or the tap would only meet a refusal.
    if (!add || cal.stayOk(cal.checkIn, co)) return null;
    return el('button', { type: 'button', 'class': 'gh-extend', text: words + ': ' + plus(add),
      onclick: function () {
        track('gh_extend', { gh_unit: UNIT, gh_nights_from: n, gh_nights: n + 1 });
        state.pending = null;
        cal.set(cal.checkIn, co);
        writeUrl(false);
        getQuote(false);
      } });
  }

  function stayHead(q) {
    return [
      el('p', { 'class': 'gh-eyebrow', text: 'Your stay' }),
      el('p', { 'class': 'gh-dates', text: span(cal.checkIn, cal.checkOut) }),
      el('p', { 'class': 'gh-times', text: nightsWord(q.quote.nights) + ' · check-in from ' + CHECK_IN_TIME + ' · check-out by ' + CHECK_OUT_TIME })
    ];
  }

  function summary() {
    var q = state.quote;
    if (!cal.checkIn) {
      return el('div', { 'class': 'gh-summary gh-summary--empty' }, [
        el('p', { 'class': 'gh-eyebrow', text: 'Your stay' }),
        el('p', { 'class': 'gh-lead', text: 'Choose your nights on the calendar. You see the whole price, taxes included, before we ask for a thing.' }),
        creditNotice(null)
      ]);
    }
    if (!cal.checkOut) {
      return el('div', { 'class': 'gh-summary gh-summary--empty' }, [
        el('p', { 'class': 'gh-eyebrow', text: 'Your stay' }),
        el('p', { 'class': 'gh-lead', text: 'Arriving ' + long(cal.checkIn) + '. Now choose your check-out day.' })
      ]);
    }
    if (!q) {
      return el('div', { 'class': 'gh-summary gh-summary--empty', 'aria-busy': 'true' }, [
        el('p', { 'class': 'gh-eyebrow', text: 'Your stay' }),
        el('p', { 'class': 'gh-dates', text: span(cal.checkIn, cal.checkOut) }),
        el('p', { 'class': 'gh-lead gh-pulse', text: 'Adding up your stay…' })
      ]);
    }
    if (HANDOFF) {
      var href = HANDOFF + (HANDOFF.indexOf('?') < 0 ? '?' : '&') + 'checkIn=' + cal.checkIn + '&checkOut=' + cal.checkOut;
      return el('div', { 'class': 'gh-summary', 'aria-live': 'polite' }, stayHead(q).concat([
        lines(q),
        extendOffer(q),
        el('a', { 'class': 'lf-btn gh-cta', href: href, text: 'Book these nights',
          onclick: function () { step('gh_handoff', { gh_check_in: cal.checkIn, gh_nights: q.quote.nights, value: q.quote.total_cents / 100, currency: 'USD' }); } })
      ]));
    }

    var options = el('fieldset', { 'class': 'gh-options' }, [el('legend', { text: 'How would you like to pay?' })]);
    (q.modes || []).forEach(function (m) {
      var pl = planLine(m, q);
      options.appendChild(el('label', { 'class': 'gh-option' + (state.payMode === m ? ' is-on' : '') }, [
        el('input', { type: 'radio', name: 'gh-pay', value: m, checked: state.payMode === m ? 'checked' : null,
          onchange: function () { state.payMode = m; state.pending = null; step('gh_payment_mode', { gh_mode: m }); render(); } }),
        el('span', {}, [el('strong', { text: pl.title }), el('span', { text: pl.sub })])
      ]));
      if (m === 'full' && payLater(q)) options.appendChild(el('p', { 'class': 'gh-later', text: payLater(q) }));
    });
    // TODO(cutover, Architect): Stripe's Payment Method Messaging Element ("as low as $X/month")
    // goes here, under Pay in full, once data-stripe-key holds the publishable key.
    if ((q.modes || []).indexOf('deposit') < 0 && q.promise && q.promise.balance_days) {
      options.appendChild(el('p', { 'class': 'gh-fine', text: 'Stays within ' + q.promise.balance_days + ' days of arrival are paid in full when you book.' }));
    }
    // A credit that covers every way to pay leaves nothing to choose: one plain line instead.
    var allCovered = (q.modes || []).length && (q.modes || []).every(function (m) {
      var sm = summaryFor(q, m); return creditUsed(q) > 0 && !sm.today_cents && !sm.balance_cents;
    });
    return el('div', { 'class': 'gh-summary', 'aria-live': 'polite' }, stayHead(q).concat([
      lines(q),
      extendOffer(q),
      creditNotice(q),
      allCovered ? el('p', { 'class': 'gh-lead gh-covered', text: 'Your credit covers this stay. Nothing to pay, today or later.' }) : options,
      el('button', { type: 'button', 'class': 'lf-btn gh-cta', onclick: function () { toCheckout(false); }, text: ctaText(q, state.payMode) }),
      markerBlock(q)
    ]));
  }

  // ------------------------------------------------------- the trail marker

  // "Not ready? Leave a trail marker." The guest's email, these dates, the all-in price,
  // emailed with a link straight back. Nothing is claimed (POST /v1/marker).
  function markerDone(ci, co) {
    return 'Your trail marker is on its way. Check your inbox for ' + span(ci, co) + ' and the link straight back to them.';
  }
  // The one way a marker is left, from the block below or from the talk card (2026-10-24):
  // resolves to the done line for the dates it was left for.
  function leaveMarker(email) {
    var mk = state.marker, q = state.quote, ci = cal.checkIn, co = cal.checkOut;
    return call('/v1/marker', { unit: UNIT, check_in: ci, check_out: co, email: email, attribution: ATTR }).then(function () {
      mk.done = true; mk.error = '';
      step('gh_marker_left', { gh_check_in: ci, gh_check_out: co, value: q.quote.total_cents / 100, currency: 'USD' });
      render();
      return markerDone(ci, co);
    });
  }
  function markerBlock(q) {
    var mk = state.marker;
    var wrap = el('div', { 'class': 'gh-marker' });
    if (mk.done) {
      wrap.appendChild(el('p', { 'class': 'gh-marker__done', role: 'status', text: markerDone(cal.checkIn, cal.checkOut) }));
      return wrap;
    }
    wrap.appendChild(el('button', { type: 'button', 'class': 'gh-link', 'aria-expanded': mk.open ? 'true' : 'false', 'aria-controls': 'gh-marker-form',
      text: 'Not ready? Leave a trail marker.', onclick: function () { mk.open = !mk.open; render(); if (mk.open) { var i = document.getElementById('gh-marker-email'); if (i) i.focus(); } } }));
    wrap.appendChild(el('p', { 'class': 'gh-marker__line', text: "We'll email you these exact dates and a link straight back to them. Nothing is held." }));
    if (!mk.open) return wrap;
    var err = el('p', { 'class': 'gh-error', role: 'alert', text: mk.error });
    var input = el('input', { id: 'gh-marker-email', type: 'email', name: 'email', autocomplete: 'email', inputmode: 'email', required: 'required',
      value: mk.email, oninput: function (e) { mk.email = e.target.value; } });
    var btn = el('button', { type: 'submit', 'class': 'lf-btn gh-btn--quiet', text: 'Leave a trail marker' });
    wrap.appendChild(el('form', { id: 'gh-marker-form', 'class': 'gh-marker__form', novalidate: 'novalidate', onsubmit: function (ev) {
      ev.preventDefault();
      var email = (input.value || '').trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { mk.error = 'Please add the email you would like the marker sent to.'; err.textContent = mk.error; input.focus(); return; }
      btn.disabled = true; err.textContent = '';
      leaveMarker(email).catch(function (e) { mk.error = e.message; err.textContent = e.message; btn.disabled = false; });
    } }, [el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'gh-marker-email', text: 'Your email' }), input]), btn, err]));
    return wrap;
  }

  // --------------------------------------------------------------- checkout

  function toCheckout(fromUrl) {
    if (!state.quote) return;
    state.step = 'pay';
    writeUrl(!fromUrl);
    if (!fromUrl) step('begin_checkout', { value: state.quote.quote.total_cents / 100, currency: 'USD',
      gh_mode: state.payMode, gh_check_in: cal.checkIn, gh_check_out: cal.checkOut });
    sendLead(state.form.email);
    render();
    if (!fromUrl) landOnPay();
  }

  // The bottom of the site's fixed header, or null: what a visitor sees starts below it.
  function headerBottom() {
    var hdr = document.querySelector('.lf-hdr');
    return hdr && window.getComputedStyle && getComputedStyle(hdr).position === 'fixed' ? Math.max(0, hdr.getBoundingClientRect().bottom) : null;
  }

  // Where the Book tap lands (2026-10-26, the CEO's pay-step piece). Since the ads began, 8
  // visits tapped Book and none typed an email: on a phone the tap landed on the section's
  // heading, with the email box at the fold, or below it when a balance line is added. Now
  // "Who is coming" and the email box are in view, with as much as fits above them, in this
  // order: the way back to the dates, the summary's heading, the dates, the total. Never a
  // focus: on iOS that opens the keyboard over the summary. Where the old landing (the
  // section's top) already shows the email box, as on a tall desktop, it is kept as it was.
  function landOnPay() {
    payLanded = null;
    payLandUntil = 0;
    var sec = root.closest('section') || root;
    if (!sec.scrollIntoView) return;
    var legend = root.querySelector('.gh-fields legend'), email = document.getElementById('gh-email');
    if (!legend || !email || !window.getComputedStyle || !window.scrollTo) { sec.scrollIntoView({ block: 'start' }); return; }
    var GAP = 12, FOOT = 16;
    function docTop(n) { return n.getBoundingClientRect().top + window.pageYOffset; }
    var margin = parseFloat(getComputedStyle(sec).scrollMarginTop) || 0;
    var top = headerBottom();
    if (top === null) top = margin;
    var view = window.innerHeight, max = Math.max(0, document.documentElement.scrollHeight - view);
    var from = docTop(legend), to = email.getBoundingClientRect().bottom + window.pageYOffset + FOOT;
    var old = Math.min(max, Math.max(0, docTop(sec) - margin));
    if (from - old >= top && to - old <= view) {
      payLanded = Math.round(old); payLandUntil = Date.now() + 1500;
      sec.scrollIntoView({ block: 'start' });
      return;
    }
    var y = from - GAP - top;      // nothing above fits: "Who is coming" just under the header
    var above = [root.querySelector('.gh-form > .gh-back'), document.getElementById('gh-booking-h'),
      root.querySelector('.gh-booking .gh-dates'), root.querySelector('.gh-booking dt.gh-total')];
    for (var i = 0; i < above.length; i++) {
      if (above[i] && to - (docTop(above[i]) - GAP) <= view - top) { y = docTop(above[i]) - GAP - top; break; }
    }
    payLanded = Math.min(max, Math.max(0, Math.round(y)));
    payLandUntil = Date.now() + 1500;
    window.scrollTo(0, payLanded);
  }

  // ---- the pay step, measured (2026-10-26, the CEO's pay-step piece) ----
  // Why a guest leaves the pay step before the first field was not measured. Five steps go to
  // our own booking server through the page beacon's scrub, each once a visit a day (and the
  // engine counts each visit once a day, gatehouse/counts.py STEP_KEYS): pay_step_10s (the step
  // open 10 s, the tab in front), pay_scrolled_summary (the booking summary scrolled above the
  // header), pay_saw_waiver (the release or the tick in view), pay_field_touched (the guest's
  // first focus on a field, or the first thing typed or chosen in one; a focus this page moves
  // is not a touch), pay_stopped (a "Continue to payment" tap a check stopped, with the field's
  // code alone). Never a word or a value the guest typed, never
  // the tag manager. A server that does not know a step refuses it and the beacon never looks
  // at the answer, so nothing here can stand in the way of a booking.
  var PAY_OPEN_S = 10, PAY_SEEN_PX = 40;
  var STOP_CODE = { first_name: 'name', last_name: 'name', email: 'email', phone: 'phone',
    guests: 'guests', dogs: 'dogs', agree: 'agree', typed_name: 'typed_name' };
  // payLanded: where landOnPay put the page, and payLandUntil the end of its (smooth) scroll
  // there. The way there and the spot itself are the page's doing, not the guest scrolling
  // past the summary (on a screen too short for anything above "Who is coming" the summary
  // sits just above the header there), so neither is counted.
  var paySent = {}, payWatch = null, ownFocus = false, payLanded = null, payLandUntil = 0;
  function payStep(name, reason) {
    try {
      var d = new Date(), on = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      var key = name + (reason ? ':' + reason : '');
      if (paySent[key] === on) return;
      var kept = {};
      try { kept = JSON.parse(sessionStorage.getItem('gh_pay_steps') || '{}') || {}; } catch (e) {}
      paySent[key] = on;
      if (kept[key] === on) return;   // this visit sent it today, before a reload
      kept[key] = on;
      try { sessionStorage.setItem('gh_pay_steps', JSON.stringify(kept)); } catch (e) {}
      beacon(name, reason ? { reason: reason } : {});
    } catch (e) {}
  }
  // Some of it on screen below the header: all of it, or PAY_SEEN_PX of a taller one.
  function inView(n) {
    if (!n) return false;
    var r = n.getBoundingClientRect(), top = headerBottom() || 0;
    if (!r.height) return false;
    return Math.min(r.bottom, window.innerHeight) - Math.max(r.top, top) >= Math.min(r.height, PAY_SEEN_PX);
  }
  function unwatchPay() {
    if (!payWatch) return;
    clearInterval(payWatch.timer);
    window.removeEventListener('scroll', payWatch.look);
    window.removeEventListener('resize', payWatch.look);
    payWatch = null;
  }
  function watchPay() {
    unwatchPay();
    var secs = 0;
    function look() {
      if (state.step !== 'pay') return;
      var sum = root.querySelector('.gh-booking'), top = headerBottom() || 0;
      var at = payLanded !== null && Math.abs(window.pageYOffset - payLanded) <= 2;
      var going = payLanded !== null && !at && Date.now() < payLandUntil;
      if (!at && !going && sum && sum.getClientRects().length && sum.getBoundingClientRect().bottom <= top) payStep('pay_scrolled_summary');
      if (inView(root.querySelector('.gh-sign .gh-waiver-intro')) || inView(root.querySelector('label.gh-agree'))) payStep('pay_saw_waiver');
    }
    payWatch = { look: look, timer: setInterval(function () {
      if (state.step !== 'pay') { unwatchPay(); return; }
      if (document.visibilityState === 'visible' && ++secs >= PAY_OPEN_S) { clearInterval(payWatch.timer); payStep('pay_step_10s'); }
    }, 1000) };
    window.addEventListener('scroll', look, { passive: true });
    window.addEventListener('resize', look, { passive: true });
    setTimeout(look, 0);           // once the Book tap's landing has begun (toCheckout)
  }
  // A focus the guest gave a field, or anything they typed or chose in one (a field this page
  // focused after a stop, then typed in, is touched).
  function fieldTouched(e) {
    var t = e.target;
    if (e.type === 'focusin' && ownFocus) return;
    if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) payStep('pay_field_touched');
  }

  function backToDates() {
    if (history.state && history.state.gh && readUrl().step === 'pay') { history.back(); return; }
    state.step = 'dates'; writeUrl(false); render();
  }

  function field(name, label, type, opts) {
    opts = opts || {};
    var input = el('input', { id: 'gh-' + name, name: name, type: type || 'text', autocomplete: opts.auto || null,
      inputmode: opts.mode || null, required: opts.optional ? null : 'required', value: state.form[name] || '' });
    return el('div', { 'class': 'gh-field' + (opts.cls ? ' ' + opts.cls : '') }, [
      el('label', { 'for': 'gh-' + name, text: label + (opts.optional ? ' (optional)' : '') }), input]);
  }

  function choice(name, label, options) {
    var sel = el('select', { id: 'gh-' + name, name: name, required: 'required' });
    options.forEach(function (o) {
      sel.appendChild(el('option', { value: o[0], text: o[1], selected: String(state.form[name] === undefined ? options[0][0] : state.form[name]) === String(o[0]) ? 'selected' : null }));
    });
    return el('div', { 'class': 'gh-field' }, [el('label', { 'for': 'gh-' + name, text: label }), sel]);
  }

  // The two things checkout asks beyond the booking, and no more (Mick, 2026-10-20: simple and
  // warm, never burdensome, "not a game"): where they heard of us, one optional tap (tap again to
  // clear), and first word of open dates and Treehouse 2, unticked unless they tick it.
  var HEARD = [['google', 'Google'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['friend', 'A friend'],
    ['ai_assistant', 'An AI assistant'], ['stayed_before', "I've stayed before"], ['other', 'Something else']];
  function heardRow() {
    var row = el('fieldset', { 'class': 'gh-heard' }, [el('legend', {}, ['How did you find us? ', el('span', { text: '(optional)' })])]);
    var chips = el('div', { 'class': 'gh-chips' });
    HEARD.forEach(function (h) {
      chips.appendChild(el('button', { type: 'button', 'class': 'gh-chip', 'data-heard': h[0], text: h[1],
        'aria-pressed': state.form.heard_from === h[0] ? 'true' : 'false',
        onclick: function () {
          state.form.heard_from = state.form.heard_from === h[0] ? '' : h[0];
          chips.querySelectorAll('.gh-chip').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-heard') === state.form.heard_from ? 'true' : 'false');
          });
        } }));
    });
    row.appendChild(chips);
    return row;
  }
  function listOptIn() {
    return el('label', { 'class': 'gh-optin', 'for': 'gh-list' }, [
      el('input', { type: 'checkbox', id: 'gh-list', name: 'list_opt_in', checked: state.form.list_opt_in ? 'checked' : null,
        onchange: function (e) { state.form.list_opt_in = e.target.checked; } }),
      el('span', { text: 'Send me first word when dates open up, and when Treehouse 2 does.' })]);
  }

  // The booking summary, above the agreement: the agreement makes it part of the deal.
  function bookingSummary(q, mode) {
    var s = summaryFor(q, mode);
    var dl = el('dl', { 'class': 'gh-lines gh-lines--summary' }, [
      el('dt', { 'class': 'gh-total', text: 'Total' }), el('dd', { 'class': 'gh-total', text: money(q.quote.total_cents) }),
      el('dt', { text: 'Due today' }), el('dd', { text: money(s.today_cents) })
    ]);
    if (s.balance_cents) {
      dl.appendChild(el('dt', { text: 'Balance, will be charged on ' + long(s.balance_on) }));
      dl.appendChild(el('dd', { text: money(s.balance_cents) }));
    }
    if (creditUsed(q)) {
      // Total less credit applied is today plus the balance: the engine's summary is already net.
      dl.insertBefore(el('dd', { text: money(-creditUsed(q)) }), dl.children[2]);
      dl.insertBefore(el('dt', { text: 'Credit applied' }), dl.children[2]);
    }
    return el('section', { 'class': 'gh-booking', 'aria-labelledby': 'gh-booking-h' }, [
      el('h3', { 'class': 'gh-eyebrow', id: 'gh-booking-h', text: 'Your booking summary' }),
      el('p', { 'class': 'gh-dates', text: span(cal.checkIn, cal.checkOut) }),
      el('p', { 'class': 'gh-times', text: 'Check-in from ' + CHECK_IN_TIME + ', ' + long(cal.checkIn) + '. Check-out by ' + CHECK_OUT_TIME + ', ' + long(cal.checkOut) + '.' }),
      dl,
      changePassed(s.change_until, cal.checkIn) ? null : el('p', { 'class': 'gh-change' }, [el('span', { text: 'Last moment to move or cancel' }),
        el('strong', { text: changeUntil(s.change_until, cal.checkIn) })]),
      mode === 'full' && q.gift_if_paid_in_full ? el('p', { 'class': 'gh-fine', text: giftLine(q.gift_if_paid_in_full) }) : null,
      CREDIT && !creditUsed(q) ? creditNotice(q) : null
    ]);
  }

  function details() {
    var q = state.quote, mode = state.payMode, s = summaryFor(q, mode);
    var ag = state.agreement, release = ag ? releaseText(ag.text) : '';
    var err = el('p', { 'class': 'gh-error', id: 'gh-error', role: 'alert' });
    var agreeBox = el('input', { type: 'checkbox', id: 'gh-agree', name: 'agree', required: 'required' });
    var agreeLine = el('label', { 'class': 'gh-agree', 'for': 'gh-agree' }, [agreeBox,
      el('span', { text: release ? 'I have read the stay agreement above and agree to it, including the liability waiver.' : 'I have read the stay agreement above and agree to it.' })]);
    var typed = field('typed_name', 'Type your full name to sign', 'text', { auto: 'name', cls: 'gh-sign__name' });
    // On a phone the keyboard covers the lower half: when the name is typed, keep the
    // tick box in view just above it, so the signature and the agreement are seen together.
    typed.querySelector('input').addEventListener('focus', function () {
      setTimeout(function () { if (window.innerWidth < 760 && agreeLine.scrollIntoView) agreeLine.scrollIntoView({ block: 'start' }); }, 320);
    });
    var full = ag ? el('div', { 'class': 'gh-agreement', tabindex: '0', role: 'region', 'aria-label': 'The stay agreement, in full' }, [markdown(ag.text)]) : null;
    var brief = ag ? shortVersion(ag.text) : '';
    // On a phone the full text was a long box to scroll before the tick (2026-10-24): the
    // agreement's own short version first, the whole agreement one tap away, in the page.
    var agreement = !ag
      ? el('p', { 'class': 'gh-agreement gh-agreement--missing', role: 'alert', text: 'The stay agreement could not load, so we cannot take a booking on this page just now. Please refresh, or call or text ' + PHONE + '.' })
      : !brief ? full
      : el('div', { 'class': 'gh-agreement-both' }, [
        el('div', { 'class': 'gh-agreement-short', role: 'region', 'aria-label': 'The stay agreement, in short' }, [markdown(brief)]),
        el('details', { 'class': 'gh-agreement-full' }, [el('summary', { text: 'Read the full agreement' }), full])]);
    var email = field('email', 'Email', 'email', { auto: 'email', mode: 'email' });
    email.querySelector('input').addEventListener('change', function (e) { sendLead(e.target.value); });
    var submitBtn = el('button', { type: 'submit', 'class': 'lf-btn gh-cta', disabled: ag ? null : 'disabled',
      text: ctaText(q, mode, true) });

    var form = el('form', { 'class': 'gh-form', novalidate: 'novalidate', onsubmit: submit,
      oninput: function (e) { var t = e.target; if (t.name && t.type !== 'checkbox') state.form[t.name] = t.value; },
      onchange: function (e) { var t = e.target; if (t.name && t.type !== 'checkbox') state.form[t.name] = t.value; } }, [
      el('button', { type: 'button', 'class': 'gh-back', onclick: backToDates, text: '‹ Change dates or how you pay' }),
      bookingSummary(q, mode),
      el('fieldset', { 'class': 'gh-fields' }, [
        el('legend', { 'class': 'gh-eyebrow', text: 'Who is coming' }),
        email,
        el('div', { 'class': 'gh-row' }, [field('first_name', 'First name', 'text', { auto: 'given-name' }), field('last_name', 'Last name', 'text', { auto: 'family-name' })]),
        field('phone', 'Mobile', 'tel', { auto: 'tel', mode: 'tel' }),
        el('div', { 'class': 'gh-row' }, [
          choice('guests', 'Guests, up to 6', [['', 'Choose'], [1, '1 guest'], [2, '2 guests'], [3, '3 guests'], [4, '4 guests'], [5, '5 guests'], [6, '6 guests']]),
          choice('dogs', 'Dogs, up to 2', [[0, 'No dogs'], [1, '1 dog'], [2, '2 dogs']])
        ]),
        field('occasion', 'Celebrating something?', 'text', { auto: 'off', optional: true })
      ]),
      el('div', { 'class': 'gh-light' }, [heardRow(), listOptIn()]),
      el('section', { 'class': 'gh-terms', 'aria-labelledby': 'gh-terms-h' }, [
        el('h3', { 'class': 'gh-eyebrow', id: 'gh-terms-h', text: 'Your stay agreement' }),
        el('p', { 'class': 'gh-fine', text: brief ? "In short, in the agreement's own words. The full text covers payment, changes, cancellations and the risks of the forest." : 'Shown in full. It covers payment, changes, cancellations and the risks of the forest.' }),
        agreement
      ]),
      el('div', { 'class': 'gh-sign' }, [
        // Mick's opener (2026-10-26, by ear: "I like that waiver opener"). The bold release lives in
        // the full agreement only, one tap above (Mick, 2026-10-26: "Any language without clicking
        // the full agreement should be warm"); the "In short" above says it in plain words.
        release ? el('p', { 'class': 'gh-waiver-intro', text: "A simple liability waiver. You'll be sleeping sixty feet up in living trees, so we ask every guest to sign one. It's in the full agreement above. Tick the box to sign." }) : null,
        agreeLine,
        typed
      ]),
      err,
      submitBtn,
      el('p', { 'class': 'gh-fine gh-center', text: 'Payment is by Stripe, on this page. Questions? Call or text ' + PHONE + '.' })
    ]);
    ['focusin', 'input', 'change'].forEach(function (t) { form.addEventListener(t, fieldTouched); });
    return el('div', { 'class': 'gh-checkout' }, [form,
      el('div', { 'class': 'gh-paying', id: 'gh-paying', hidden: 'hidden' }),
      el('div', { id: 'gh-pay', 'class': 'gh-pay' })]);
  }

  function values(form) {
    var v = {};
    ['first_name', 'last_name', 'email', 'phone', 'occasion', 'typed_name', 'guests', 'dogs'].forEach(function (k) {
      v[k] = form.elements[k] ? String(form.elements[k].value || '').trim() : '';
    });
    return v;
  }

  function submit(ev) {
    ev.preventDefault();
    var form = ev.target, err = document.getElementById('gh-error'), v = values(form);
    var btn = form.querySelector('[type=submit]');
    var problem = null, focus = null;
    if (!v.first_name || !v.last_name) { problem = 'Please add your first and last name.'; focus = v.first_name ? 'last_name' : 'first_name'; }
    else if (!/^\S+@\S+\.\S+$/.test(v.email)) { problem = 'Please add a working email, so your confirmation reaches you.'; focus = 'email'; }
    else if (v.phone.replace(/\D/g, '').length < 7) { problem = 'Please add a mobile number we can reach you on.'; focus = 'phone'; }
    else if (!/^[1-6]$/.test(v.guests)) { problem = 'Please choose how many guests are coming, up to 6.'; focus = 'guests'; }
    else if (!/^[0-2]$/.test(v.dogs)) { problem = 'Please choose how many dogs are coming, up to 2.'; focus = 'dogs'; }
    else if (!document.getElementById('gh-agree').checked) { problem = 'Please tick the box to accept the stay agreement.'; focus = 'agree'; }
    else if (v.typed_name.replace(/[^A-Za-z\u00C0-\u024F]/g, '').length < 2) { problem = 'Please type your full name to sign the agreement.'; focus = 'typed_name'; }
    if (problem) {
      err.textContent = problem;
      var f = form.elements[focus];
      ownFocus = true;               // this page moves the focus, not the guest: not a touch
      try { if (f && f.focus) f.focus(); } finally { ownFocus = false; }
      payStep('pay_stopped', STOP_CODE[focus] || '');
      return;
    }
    err.textContent = '';
    step('add_payment_info', { gh_mode: state.payMode, gh_check_in: cal.checkIn, gh_check_out: cal.checkOut });
    var body = { unit: UNIT, check_in: cal.checkIn, check_out: cal.checkOut, mode: state.payMode,
      email: v.email, first_name: v.first_name, last_name: v.last_name, phone: v.phone, occasion: v.occasion,
      guests: +v.guests, dogs: +v.dogs, typed_name: v.typed_name,
      agreement_version: state.agreement && state.agreement.version, attribution: ATTR,
      list_opt_in: !!(form.elements.list_opt_in && form.elements.list_opt_in.checked) };
    // Optional: sent only when they tapped one of the seven.
    if (HEARD.some(function (h) { return h[0] === state.form.heard_from; })) body.heard_from = state.form.heard_from;
    if (CREDIT && state.credit && creditUsed(state.quote)) body.credit = CREDIT;
    if (HOLD) { body.hold = HOLD; body.visit = VISIT; }   // the engine matches a hold to its visit
    // Same details, same dates: reuse the checkout already opened, never a second claim
    // on the guest's own nights (a retry must not lock them out). heard_from and list_opt_in are
    // left out of the key on purpose: changing either after payment opened reuses the first
    // checkout, which keeps what was sent the first time.
    var key =[cal.checkIn, cal.checkOut, state.payMode, v.email.toLowerCase(), v.guests, v.dogs, body.credit || ''].join('|');
    btn.disabled = true;
    btn.textContent = coveredToday(state.quote, state.payMode) ? 'Booking with your credit…' : 'Opening secure payment…';
    // The booking system keeps a checkout's nights for about 35 minutes; reuse it well inside that.
    var reuse = state.pending && state.pending.key === key && Date.now() - state.pending.at < 25 * 60 * 1000;
    var opened = reuse ? Promise.resolve(state.pending.res)
      : (STRIPE_KEY || coveredToday(state.quote, state.payMode) ? call('/v1/checkout', body) : Promise.reject(new Error('Online payment opens shortly. To book these dates now, call or text ' + PHONE + ' and we will take it from here. Nothing was charged.')));
    opened.then(function (res) {
      if (!reuse) state.pending = { key: key, res: res, at: Date.now() };
      if (!res.client_secret) {
        // Nothing to pay today (a credit covered it): the stay is booked.
        if (res.manage_token) {
          forgetCredit();
          step('gh_booked_with_credit', { value: (res.total_cents || 0) / 100, currency: 'USD' });
          location.href = '/manage#token=' + encodeURIComponent(res.manage_token);
          return;
        }
        throw new Error('Your booking went through with nothing to pay today. Your confirmation email is on its way. Questions? Call or text ' + PHONE + '.');
      }
      var due = res.summary && res.summary.today_cents !== undefined ? res.summary.today_cents
        : res.due_now_cents !== undefined ? res.due_now_cents : summaryFor(state.quote, state.payMode).today_cents;
      return mountStripe(STRIPE_KEY, res.client_secret, '#gh-pay').then(function () {
        form.hidden = true;
        var head = document.getElementById('gh-paying');
        head.replaceChildren(
          el('p', { 'class': 'gh-eyebrow', text: 'Secure payment' }),
          el('p', { 'class': 'gh-dates', text: span(cal.checkIn, cal.checkOut) }),
          el('p', { 'class': 'gh-lead', text: money(due) + ' due today, of ' + money(res.total_cents || state.quote.quote.total_cents) + '.' }),
          el('button', { type: 'button', 'class': 'gh-back', text: '‹ Back to your details', onclick: function () {
            form.hidden = false; head.hidden = true; document.getElementById('gh-pay').replaceChildren();
            btn.disabled = false; btn.textContent = ctaText(state.quote, state.payMode, true);
          } }));
        head.hidden = false;
        if (head.scrollIntoView) head.scrollIntoView({ block: 'start' });
      });
    }).catch(function (e) {
      err.textContent = e.message;
      btn.disabled = false;
      btn.textContent = ctaText(state.quote, state.payMode, true);
      if (e.status === 409) { state.pending = null; refreshNights(); }
    });
  }

  function refreshNights() {
    availability(API, UNIT).then(function (n) { cal.nights = n; }).catch(function () {});
  }

  // ----------------------------------------------------------------- render

  function render() {
    var side = state.step === 'pay' && state.quote ? details() : summary();
    var wrap = el('div', { 'class': 'gh-wrap' + (state.step === 'pay' && state.quote ? ' is-checkout' : '') },
      [state.step === 'pay' && state.quote ? null : cal.render(), side]);
    root.replaceChildren(wrap);
    if (state.step === 'pay' && state.quote) watchPay(); else unwatchPay();
  }

  // ------------------------------------------------------------------- boot

  function fallback() {
    root.classList.remove('gh-loading');
    root.hidden = true;
    var fb = FALLBACK && document.querySelector(FALLBACK);
    if (fb) fb.hidden = false;
    // The request-dates form, already holding any dates the link carried.
    var u = readUrl(), ci = document.getElementById('checkin'), co = document.getElementById('checkout');
    if (u.checkIn && ci && !ci.value) ci.value = u.checkIn;
    if (u.checkOut && co && !co.value) co.value = u.checkOut;
    step('gh_fallback_shown', {});
  }

  root.classList.add('gh-loading');
  root.setAttribute('aria-busy', 'true');
  var agreementCall = HANDOFF ? Promise.resolve(null) : call('/v1/agreement').catch(function () { return null; });
  var creditCall = CREDIT && !HANDOFF ? call('/v1/stay?token=' + encodeURIComponent(CREDIT)).then(function (st) {
    return st && st.credit && st.credit.cents > 0 ? st.credit : null;
  }).catch(function () { return null; }) : Promise.resolve(null);

  Promise.all([availability(API, UNIT, HOLD ? '&hold=' + encodeURIComponent(HOLD) : ''), agreementCall, creditCall]).then(function (res) {
    state.agreement = res[1];
    state.credit = res[2];
    cal = Calendar({ nights: res[0], onChange: onCalendar, onRefuse: refused });
    root.classList.remove('gh-loading');
    root.removeAttribute('aria-busy');
    applyUrl();
    step('gh_view', { gh_mode_loaded: 'live' });
    render();
    // Calendar loaded and tappable: the 2.5 s standard, measured on real phones.
    try { performance.mark('gh-calendar-ready'); beacon('calendar_ready', { ms: Math.round(performance.now()) }); } catch (e) {}
  }).catch(fallback);

  // Back and forward move between the calendar and the checkout, dates kept.
  window.addEventListener('popstate', function () {
    if (!cal) return;
    var u = readUrl();
    if (u.checkIn !== cal.checkIn || u.checkOut !== cal.checkOut) { state.step = 'dates'; applyUrl(); render(); return; }
    if (u.step === 'pay' && state.quote) { state.step = 'pay'; render(); }
    else { state.step = 'dates'; render(); }
  });
})();
