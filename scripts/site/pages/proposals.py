"""The proposals page: where to ask, how it works, the night after, one inquiry.

Mick, 2026-10-21: elopements and proposals are the house's bread and butter, and proposal searches
had nowhere to land. Built on elopements.py: its ceremony-space cards, its questions and its
inquiry form, field for field in shape (the honeypot, method POST, a hidden form-name, the action
back to this page with ?submitted=1 and the thank-you script).

The words keep the house voice (loxley-rescue canon/voice.md): no price, no discount, no count of
things served, no scarcity, no brand, no rating or superlative. Only what the site or the canon
already says the house has: the rope bridge and its small warm lights, sixty feet up, the Compass
Fire Pit, the canopy deck, 42 acres of hardwood cove forest, the trail lanterns, golden hour, the
Dawn Table, flowers, champagne, photography coordination, Dahlonega, just over an hour from Atlanta.
Weather is not answered here: neither the elopements page nor the questions page says there is a
covered place to ask, so the page does not promise one (a question for Mick).

The Netlify form "proposal-inquiry" carries the ad click (gclid, gbraid, wbraid) and the link's src
in hidden fields, filled by the small script below the form from what the site already keeps:
js/global.js keeps the click in localStorage "loxley_attribution" (90 days), js/funnel.js keeps the
visit's src in sessionStorage "gh_entry". The address bar wins when it carries one, so a visitor
who lands here straight from an ad (before global.js has run) still sends the click.
"""
import build_v2 as B

ACORN = B.ACORN

# Where to ask: (photo, alt, name, kicker, words). Facts from elopements.py's SPACES and canon.
SPOTS = [
    ('img_2726', 'The rope bridge leading through the canopy to the treehouse', 'The Rope Bridge', 'The crossing',
     'A hundred feet of suspended bridge between two white oaks, sixty feet up and strung with small warm lights. '
     'Stop halfway across and turn around.'),
    ('img_1717', 'The stone fire pit on the forest floor, ringed with ferns', 'The Compass Fire Pit', 'On the forest floor',
     'A boulder fire pit set at the four compass points, ringed with ferns. Sit close to the fire after dark and ask '
     'with the whole forest listening.'),
    ('img_2546', 'The treehouse deck with chairs, above the forest', 'The Canopy Deck', 'Just the two of you',
     'The private deck of your treehouse, sixty feet in the air. Nothing above you but sky, nothing around you but '
     'the canopy.'),
]

# How it works, in the order it happens. Kickers in words, not numbers.
STEPS = [
    ('First', 'Tell us the date',
     'Tell us the date you have in mind and how you want it to feel. Golden hour on the bridge or a fire after dark. '
     'Quiet, or with a photographer there to catch it.'),
    ('Then', 'We set the scene',
     'Things like flowers, lanterns and champagne on ice, ready where you plan to ask.'),
    ('And then', 'You ask',
     'The rest of the night is yours, in the treehouse at the far end of the bridge.'),
]

FAQ = [
    ('Can we keep it a secret?',
     'Yes. We plan it with you and no one else. To your partner it can be a night away in the trees, right up '
     'until you ask.'),
    ('Can we have a photographer there?',
     'Yes. We coordinate with a photographer you choose, or one we suggest, so they know where to be and when.'),
    ('How far is it from Atlanta?',
     "Just over an hour. We're in the foothills above Dahlonega. The last mile is a mountain road. That's how you "
     "know you're close."),
]

# The click and the link's source, from what global.js and funnel.js already keep (see above).
ATTRIBUTION = '''    <script>
      /* Fill the hidden fields of the proposal inquiry: the ad click from js/global.js
         (localStorage loxley_attribution), the link's src from js/funnel.js (sessionStorage
         gh_entry). The address bar wins when it carries one. Empty when there is none. */
      (function () {
        var kept = {}, entry = {}, q = null;
        try { kept = JSON.parse(localStorage.getItem('loxley_attribution') || '{}') || {}; } catch (e) {}
        try { entry = JSON.parse(sessionStorage.getItem('gh_entry') || '{}') || {}; } catch (e) {}
        try { q = new URLSearchParams(location.search); } catch (e) {}
        var form = document.querySelector('form[name="proposal-inquiry"]');
        function put(name, value) {
          var el = form && form.querySelector('input[name="' + name + '"]');
          if (el && value) el.value = String(value).slice(0, 200);
        }
        ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { put(k, (q && q.get(k)) || kept[k]); });
        put('src', (q && q.get('src')) || entry.src);
      })();
    </script>
'''


def page_proposals():
    head, gtm = B.head_from('proposals.html', '<link rel="preload" as="image" type="image/webp" href="images/v2/hero-bridge-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="images/v2/eq3a0943-800.webp" media="(max-width: 767px)" fetchpriority="high">')
    spots = ''.join(
        f'<figure class="lf-space lf-rise">{B.pic(img, alt, "(min-width: 900px) 33vw, 100vw")}<figcaption>'
        f'<span class="lf-chapter__n">{kicker}</span><h3 class="lf-h3">{name}</h3><p>{words}</p></figcaption></figure>'
        for img, alt, name, kicker, words in SPOTS)
    steps = ''.join(
        f'<li class="lf-pr-step lf-rise">{ACORN}<span class="lf-chapter__n">{kicker}</span><h3 class="lf-h3">{title}</h3><p>{words}</p></li>'
        for kicker, title, words in STEPS)
    faq = ''.join(f'<details class="lf-faq__item"><summary>{q}</summary><p>{a}</p></details>' for q, a in FAQ)
    body = f'''
    <!-- ========== HERO: the question, sixty feet up ========== -->
    <section class="lf-hero lf-hero--page" aria-label="Proposals">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/eq3a0943-800.webp" type="image/webp"><img src="images/v2/hero-bridge-1600.webp" width="1600" height="1067" alt="The rope bridge at night, strung with warm lights, leading to the treehouse glowing at the far end" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Proposals at Loxley Forest</p>
        <h1 class="lf-h1">Ask the question <em>sixty feet up</em></h1>
        <p class="lf-lead">A hundred-foot rope bridge strung with small warm lights, in a North Georgia forest just over an hour from Atlanta.</p>
        <div class="lf-actions"><a href="#inquiry" class="lf-btn lf-btn--ghost">Plan your proposal</a><a href="#where" class="lf-link">Where to ask</a></div>
      </div>
    </section>

    <!-- ========== THE QUESTION ========== -->
    <section class="lf-sec lf-light lf-center" aria-labelledby="qu-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise" id="qu-h">The question</p>
        <p class="lf-statement lf-rise">Halfway across the bridge, you stop noticing the height and start noticing the silence. That is a good place to ask.</p>
        <div class="lf-body lf-rise">
          <p>Loxley Forest is 42 acres of hardwood cove forest above Dahlonega, just over an hour from Atlanta. The treehouse sits at the far end of the bridge, glowing from the inside like a lantern somebody lit for you.</p>
          <p>Ask on the bridge at golden hour, by the fire after dark, or on the deck with nothing around you but trees. Tell us which, and we'll help you get the moment right.</p>
        </div>
        <p class="lf-el-coda lf-rise">You bring the ring. <em>We'll set the scene.</em></p>
      </div>
    </section>

    <!-- ========== WHERE TO ASK ========== -->
    <section class="lf-sec lf-dark" id="where" aria-labelledby="wh-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Where to ask</p>
        <h2 class="lf-h2 lf-rise" id="wh-h">On the bridge, by the fire, <em>or in the canopy</em></h2>
        <div class="lf-spaces">{spots}</div>
      </div>
    </section>

    <!-- ========== HOW IT WORKS ========== -->
    <section class="lf-sec lf-light" aria-labelledby="hw-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">How it works</p>
        <h2 class="lf-h2 lf-rise" id="hw-h">Leave the setting to us. <em>Keep the words for yourself.</em></h2>
        <ol class="lf-pr-steps">{steps}</ol>
      </div>
    </section>

    <!-- ========== AFTER THE YES ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="ay-h">
      <div class="lf-wrap lf-split">
        <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('img_0828', 'The bed beneath the treehouse windows in warm light', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">After the yes</p>
          <h2 class="lf-h2 lf-rise" id="ay-h">Stay the night. <em>Wake up engaged in the trees.</em></h2>
          <div class="lf-body lf-rise" style="margin-top:24px">
            <p>The treehouse is yours until morning: a queen bed framed by panoramic windows, a private deck above the forest floor, and the forest all around you.</p>
            <p>For the morning, add the Dawn Table: breakfast carried across the bridge to your door, with a late checkout to go with it.</p>
          </div>
          <div class="lf-actions lf-rise"><a href="/book" class="lf-btn">{ACORN}Book your dates</a></div>
        </div>
      </div>
    </section>

    <!-- ========== QUESTIONS ========== -->
    <section class="lf-sec lf-light" aria-labelledby="fq-h">
      <div class="lf-wrap lf-faq">
        <p class="lf-eyebrow lf-rise">Questions</p>
        <h2 class="lf-h2 lf-rise" id="fq-h">Before you <em>ask</em></h2>
        <div class="lf-faq__list lf-rise">{faq}</div>
      </div>
    </section>

    <!-- ========== INQUIRY: the Netlify form "proposal-inquiry" ========== -->
    <section class="lf-sec lf-parch" id="inquiry" aria-labelledby="iq-h">
      <div class="lf-wrap lf-inq">
        <div class="lf-center">
          <p class="lf-eyebrow lf-rise">Plan your proposal</p>
          <h2 class="lf-h2 lf-rise" id="iq-h">Tell us <em>how you picture it</em></h2>
          <p class="lf-lead lf-rise">The date, the place, the feeling you want. We'll write back to you, and only you, to plan it.</p>
        </div>

        <div class="lf-inq__wrap lf-rise">
          <form class="lf-form lf-form--light" name="proposal-inquiry" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" action="/proposals?submitted=1#inquiry">
            <input type="hidden" name="form-name" value="proposal-inquiry">
            <input type="hidden" name="gclid">
            <input type="hidden" name="gbraid">
            <input type="hidden" name="wbraid">
            <input type="hidden" name="src">
            <p style="display:none;"><label>Don't fill this out: <input name="bot-field"></label></p>

            <div class="lf-form__row">
              <label for="pr-name">Your name</label>
              <input type="text" id="pr-name" name="name" required autocomplete="name">
            </div>

            <div class="lf-form__row">
              <label for="pr-email">Email</label>
              <input type="email" id="pr-email" name="email" required autocomplete="email">
            </div>

            <div class="lf-form__row">
              <label for="pr-phone">Phone (optional)</label>
              <input type="tel" id="pr-phone" name="phone" autocomplete="tel">
            </div>

            <div class="lf-form__row">
              <label for="pr-dates">The date or dates you have in mind</label>
              <input type="text" id="pr-dates" name="dates" placeholder="A date, a few dates, or a month">
            </div>

            <div class="lf-form__row">
              <label for="pr-picture">How do you picture it?</label>
              <textarea id="pr-picture" name="how_you_picture_it" rows="5" placeholder="Where you'd like to ask, the time of day, anything we should know. We'll plan around it."></textarea>
            </div>

            <button type="submit" class="lf-btn lf-btn--forest">Plan your proposal</button>
          </form>

          <p class="lf-inq__talk">Prefer to talk? Call or text <a href="tel:+17065024823">706-502-4823</a> or email <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a></p>

          <div id="proposal-success" class="lf-inq__done" role="status" hidden>
            <p>The forest can keep a secret. We'll be in touch soon.</p>
            <p class="lf-inq__sig">Mick &amp; Livy</p>
          </div>
        </div>
      </div>
    </section>
{ATTRIBUTION}    <script>
      (function(){{
        if (location.search.indexOf('submitted=1') !== -1) {{
          var form = document.querySelector('form[name="proposal-inquiry"]');
          var success = document.getElementById('proposal-success');
          if (form) form.style.display = 'none';
          if (success) success.hidden = false;
        }}
      }})();
    </script>
'''
    return 'proposals.html', head, gtm, body, '/book', False


PAGES = [page_proposals]

CSS = '''
/* how it works: three short steps, each under a gold acorn */
.lf-pr-steps { list-style: none; margin: 44px 0 0; padding: 0; display: grid; gap: 36px; }
.lf-pr-step { border-top: 1px solid rgba(61, 50, 40, 0.18); padding-top: 26px; }
.lf-pr-step > svg { display: block; width: 14px; height: 18px; margin-bottom: 18px; color: var(--gold); }
.lf-pr-step .lf-chapter__n { color: var(--stone); }
.lf-pr-step .lf-h3 { color: var(--forest-deep); }
.lf-pr-step p { margin: 10px 0 0; max-width: 30rem; font-size: 1.15rem; line-height: 1.65; color: var(--stone); }
@media (min-width: 900px) { .lf-pr-steps { grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 60px; } }

/* The inquiry form on a light ground. faq.py's rules for its dark-ground form share the .lf-form
   selectors and come later in this file than elopements.py's, so they win there; this modifier
   puts the light form back (labels in forest green, dark words on linen). */
.lf-form.lf-form--light { gap: 22px; max-width: none; }
.lf-form.lf-form--light label { margin-top: 0; color: var(--forest-deep); }
.lf-form.lf-form--light input, .lf-form.lf-form--light textarea { border-color: rgba(61, 50, 40, 0.3); background: var(--linen); color: var(--bark); }
.lf-form.lf-form--light input:focus-visible, .lf-form.lf-form--light textarea:focus-visible { outline-color: var(--forest-deep); }
'''
