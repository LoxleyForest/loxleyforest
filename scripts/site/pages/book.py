"""/book: our checkout (the Gatehouse, js/gatehouse.js), live against book.loxleyforest.com.

Every Book button on the site lands here, and the home, treehouse and experiences calendars carry
their dates here (/book?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD). No Hostfully anywhere (Mick,
2026-10-19). When the booking API cannot be reached, the calendar steps aside for the request-dates
form below it; there is no preview. The booking-inquiry Netlify form keeps its name, honeypot,
hidden fields, every field name and its action. The header Book button goes to #book, the calendar.
"""
import re

import build_v2 as B


def tidy(head):
    """head_from adds a blank line before </head> on every build when there is no preload;
    keep it at one so a rebuild writes the same file (reported to the Forge)."""
    return re.sub(r'\s*</head>\n$', '\n</head>\n', head)


# data-stripe-key is B.STRIPE_KEY (scripts/site/build_v2.py), the live publishable key at cutover.
# Until it is set, the checkout runs to the agreement and then says plainly that payment opens
# shortly, with the phone number; it never claims nights it cannot take payment for.
GATEHOUSE = f'''<div id="gatehouse"
           data-api="{B.API}"
           data-unit="{B.UNIT}"
           data-stripe-key="{B.STRIPE_KEY}"
           data-fallback="#gh-down">{B.GH_WAIT}</div>
      <div id="gh-down" class="lf-book__alt" hidden>
        <p>Our booking calendar isn't answering just now. Nothing is lost: <a href="#inquiry">send us your dates</a> and we'll write back within two hours, or call or text <a href="tel:+17065024823">706-502-4823</a>.</p>
      </div>'''

DAY = [('3:00 PM', 'Turn off the paved road onto a gravel path through the forest. The world gets quieter with every turn.'),
       ('3:30 PM', 'Park at the trailhead. Walk four hundred feet through mountain laurel and fern. Hear the creek before you see it.'),
       ('3:45 PM', 'Cross the rope bridge for the first time. Your heart beats faster. Then the treehouse door opens.'),
       ('4:00 PM', "Unpack. Step onto the deck. Realize you're sixty feet in the air and there isn't a single sound except wind through leaves."),
       ('5:30 PM', 'Fire up the pizza oven on the sky deck. Open the bottle you brought. Burn the first pizza. Laugh about it. Nail the second one.'),
       ('7:00 PM', 'Watch the sun drop behind the ridgeline from your private deck. The forest turns gold, then amber, then blue.'),
       ('8:30 PM', 'Build a fire. Roast marshmallows. Look up. The Milky Way is right there.'),
       ('10:00 PM', 'Fall asleep to absolute silence, sixty feet above the forest floor.'),
       # TreeMail arrives around 8:30 every morning (Mick's ruling); the old page said 7:00 AM.
       ('8:30 AM', 'Wake up to birdsong. Check the TreeMail box at the entrance to your bridge. Something is waiting inside.')]


def page_book():
    head, gtm = B.head_from('book.html')
    head = tidy(head)
    day = ''.join(f'\n          <li><span>{t}</span><p>{x}</p></li>' for t, x in DAY)
    body = f'''
    <!-- ========== BOOK DIRECT ========== -->
    <section class="lf-sec lf-dark lf-center lf-bk-top" aria-labelledby="bk-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow">Dahlonega, Georgia</p>
        <h1 class="lf-h1" id="bk-h">Book your stay</h1>
        <p class="lf-lead">Book direct. No platform fees, no middleman. Just you, the forest, and the family who built it.</p>
      </div>
    </section>

    <!-- ========== THE CHECKOUT: our calendar, our agreement, Stripe ========== -->
    <section class="lf-sec lf-parch lf-book lf-bk-book" id="book" aria-labelledby="bk-w">
      <div class="lf-bk-head">
        <h2 class="lf-h3" id="bk-w">Choose your nights</h2>
        <p>Every open night shows its rate. Pick your dates and the whole price appears, taxes included. Then book right here.</p>
        <p class="lf-bk-trust">Book direct and deal straight with the family who built it.</p>
      </div>
      {GATEHOUSE}
      <p class="lf-bk-contact">Questions? Call or text <a href="tel:+17065024823">706-502-4823</a>, or write to <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a>.</p>
    </section>

    <!-- ========== INQUIRY (Netlify form booking-inquiry) ========== -->
    <section id="inquiry" class="lf-sec lf-light lf-bk-ask" aria-labelledby="bk-q">
      <div class="lf-bk-ask__in">
        <p class="lf-bk-or"><span>or</span></p>
        <h2 class="lf-h2" id="bk-q">Prefer a personal response?</h2>
        <p class="lf-lead">Tell us what you're looking for and we'll respond within 2 hours.</p>

        <form class="lf-bk-form" name="booking-inquiry" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" action="/success.html">
          <input type="hidden" name="form-name" value="booking-inquiry">

          <!-- Ad attribution. Filled by the script below the form; empty
               for visitors who arrived without an ad click, which is fine
               and expected. Carries the click through to the inquiry so a
               booking can be reported back to Google with real revenue. -->
          <input type="hidden" name="gclid" id="attr-gclid">
          <input type="hidden" name="fbclid" id="attr-fbclid">
          <input type="hidden" name="utm_source" id="attr-utm_source">
          <input type="hidden" name="utm_medium" id="attr-utm_medium">
          <input type="hidden" name="utm_campaign" id="attr-utm_campaign">
          <input type="hidden" name="landing_page" id="attr-landing">
          <input type="hidden" name="referrer" id="attr-referrer">
          <p style="display:none;"><label>Don't fill this out: <input name="bot-field"></label></p>

          <div class="lf-bk-field">
            <label for="name">Your name</label>
            <input type="text" id="name" name="name" required autocomplete="name">
          </div>
          <div class="lf-bk-field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email">
          </div>
          <div class="lf-bk-field">
            <label for="phone">Phone</label>
            <input type="tel" id="phone" name="phone" autocomplete="tel">
          </div>
          <div class="lf-bk-row">
            <div class="lf-bk-field">
              <label for="checkin">Preferred check-in</label>
              <input type="date" id="checkin" name="checkin">
            </div>
            <div class="lf-bk-field">
              <label for="checkout">Preferred check-out</label>
              <input type="date" id="checkout" name="checkout">
            </div>
          </div>
          <div class="lf-bk-field">
            <label for="treehouse">Which treehouse?</label>
            <select id="treehouse" name="treehouse">
              <option value="">Select...</option>
              <option value="treehouse-1">Treehouse 1</option>
              <option value="treehouse-2">Treehouse 2 (Coming Soon)</option>
              <option value="no-preference">No Preference</option>
            </select>
          </div>
          <div class="lf-bk-field">
            <label for="occasion">What brings you to Loxley?</label>
            <select id="occasion" name="occasion">
              <option value="">Select...</option>
              <option value="getaway">Time Away</option>
              <option value="anniversary">Anniversary</option>
              <option value="birthday">Birthday</option>
              <option value="elopement">Elopement</option>
              <option value="proposal">Proposal</option>
              <option value="honeymoon">Honeymoon</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="lf-bk-field">
            <label for="referral">How did you hear about us?</label>
            <select id="referral" name="referral">
              <option value="">Select...</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="pinterest">Pinterest</option>
              <option value="google">Google</option>
              <option value="airbnb">Airbnb</option>
              <option value="friend">Friend / Word of Mouth</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="lf-bk-field">
            <label for="message">Anything else?</label>
            <textarea id="message" name="message" rows="4"></textarea>
          </div>
          <button type="submit" class="lf-bk-send">Send your request</button>
        </form>

        <script>
        /* Fill the attribution fields from the URL or the stored click. */
        (function () {{
          function put(id, value) {{
            var el = document.getElementById(id);
            if (el && value) el.value = value;
          }}
          var saved = {{}};
          try {{
            saved = JSON.parse(window.localStorage.getItem('loxley_attribution') || '{{}}') || {{}};
          }} catch (e) {{}}
          var p;
          try {{ p = new URLSearchParams(window.location.search); }} catch (e) {{ p = null; }}
          function pick(name) {{
            return (p && p.get(name)) || saved[name] || '';
          }}
          put('attr-gclid', pick('gclid') || pick('gbraid') || pick('wbraid'));
          put('attr-fbclid', pick('fbclid'));
          put('attr-utm_source', pick('utm_source'));
          put('attr-utm_medium', pick('utm_medium'));
          put('attr-utm_campaign', pick('utm_campaign'));
          put('attr-landing', saved.landing || window.location.pathname);
          put('attr-referrer', saved.referrer || document.referrer || '');
        }})();
        </script>
        <div id="booking-success" class="lf-bk-done" hidden><p>The forest knows you're coming. We'll be in touch soon.</p><p class="lf-bk-sign">Mick &amp; Livy</p></div>
        <script>
          (function(){{
            if (location.search.indexOf('submitted=1') !== -1) {{
              var form = document.querySelector('form[name="booking-inquiry"]');
              var success = document.getElementById('booking-success');
              if (form) form.style.display = 'none';
              if (success) success.hidden = false;
            }}
          }})();
        </script>
      </div>
    </section>

{B.REVIEWS}
    <!-- ========== A DAY IN THE CANOPY ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="bk-d">
      <div class="lf-wrap lf-bk-day">
        <p class="lf-eyebrow lf-rise">Your stay</p>
        <h2 class="lf-h2 lf-rise" id="bk-d">A day in the canopy</h2>
        <ol class="lf-bk-times lf-rise">{day}
        </ol>
        <p class="lf-lead lf-rise">That's just one version. Every stay writes its own story.</p>
        <p class="lf-body lf-rise" style="margin-top:18px">Every direct booking supports a family-owned property and keeps Loxley independent. Thank you for booking with us.</p>
        <div class="lf-actions lf-rise"><a href="#book" class="lf-btn">{B.ACORN}Book your dates</a></div>
      </div>
    </section>
'''
    return 'book.html', head, gtm, body, '#book', True


PAGES = [page_book]

CSS = '''
.lf-bk-top { padding-top: calc(var(--hdr-h) + clamp(44px, 8vw, 96px)); padding-bottom: clamp(56px, 8vw, 96px); }
.lf-bk-top .lf-h1 { font-size: clamp(2.6rem, 9vw, 4.8rem); }
.lf-bk-top .lf-lead { margin-left: auto; margin-right: auto; }
.lf-bk-book { scroll-margin-top: var(--hdr-h); padding-top: clamp(56px, 8vw, 96px); padding-bottom: clamp(56px, 8vw, 96px); }
.lf-bk-head { max-width: 36rem; margin: 0 auto 32px; text-align: center; }
.lf-bk-head .lf-h3 { color: var(--forest-deep); font-size: clamp(1.75rem, 5vw, 2.3rem); }
.lf-bk-head p { margin: 10px 0 0; font-size: 1.2rem; line-height: 1.5; color: var(--stone); }
.lf-bk-head .lf-bk-trust { margin-top: 14px; font-family: 'Montserrat', sans-serif; font-size: 0.8125rem; letter-spacing: 0.04em; color: var(--bark); }
.lf-bk-contact { max-width: 36rem; margin: 26px auto 0; text-align: center; font-size: 1.15rem; line-height: 1.6; color: var(--stone); }
.lf-bk-contact a, .lf-bk-done a { color: var(--forest-deep); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; white-space: nowrap; }

.lf-bk-ask { padding-top: clamp(48px, 7vw, 80px); }
.lf-bk-ask__in { max-width: 36rem; margin: 0 auto; }
.lf-bk-or { display: flex; align-items: center; gap: 18px; margin: 0 0 40px; font-family: 'Montserrat', sans-serif; font-size: 0.6875rem; letter-spacing: 0.32em; text-transform: uppercase; color: var(--stone); }
.lf-bk-or::before, .lf-bk-or::after { content: ''; flex: 1; height: 1px; background: rgba(44, 34, 25, 0.18); }
.lf-bk-ask .lf-h2 { color: var(--forest-deep); }
.lf-bk-form { display: grid; gap: 22px; margin-top: 36px; }
.lf-bk-row { display: grid; gap: 22px; }
@media (min-width: 600px) { .lf-bk-row { grid-template-columns: 1fr 1fr; } }
.lf-bk-field { min-width: 0; }
.lf-bk-field label { display: block; margin-bottom: 8px; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--stone); }
.lf-bk-field input, .lf-bk-field select, .lf-bk-field textarea {
  display: block; width: 100%; min-height: 52px; padding: 12px 14px; border: 1px solid rgba(44, 34, 25, 0.28); border-radius: 0;
  background: #fff; color: var(--bark); font: 400 1rem/1.4 'Montserrat', sans-serif; -webkit-appearance: none; appearance: none;
}
.lf-bk-field select { padding-right: 40px; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236b6357' stroke-width='1.5'/%3E%3C/svg%3E") right 16px center / 12px 8px no-repeat; }
.lf-bk-field textarea { min-height: 120px; resize: vertical; }
.lf-bk-field input:focus-visible, .lf-bk-field select:focus-visible, .lf-bk-field textarea:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 1px; border-color: var(--forest-deep); }
.lf-bk-send {
  min-height: 56px; margin-top: 6px; border: 1px solid var(--forest-deep); background: var(--forest-deep); color: var(--on-dark); cursor: pointer;
  font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase;
  transition: background 0.25s var(--ease-natural);
}
.lf-bk-send:hover { background: var(--ink); }
.lf-bk-send:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 3px; }
.lf-bk-done { margin-top: 36px; padding: 28px 24px; background: var(--parchment); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; line-height: 1.4; color: var(--forest-deep); text-align: center; }
.lf-bk-sign { margin-top: 10px; font-style: italic; font-size: 1.25rem; color: var(--stone); }

.lf-bk-day { max-width: 46rem; }
.lf-bk-times { list-style: none; margin: 40px 0 36px; padding: 0; }
.lf-bk-times li { display: grid; grid-template-columns: 5.5rem 1fr; gap: 16px; padding: 18px 0; border-top: 1px solid rgba(247, 243, 237, 0.14); }
.lf-bk-times li:last-child { border-bottom: 1px solid rgba(247, 243, 237, 0.14); }
.lf-bk-times span { padding-top: 0.35em; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.75rem; letter-spacing: 0.12em; color: var(--on-dark-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.lf-bk-times p { margin: 0; font-size: 1.15rem; line-height: 1.6; color: var(--on-dark); }
@media (min-width: 900px) { .lf-bk-times li { grid-template-columns: 7rem 1fr; } .lf-bk-times p { font-size: 1.25rem; } }
'''
