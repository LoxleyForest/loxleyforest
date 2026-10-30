"""The elopements page: the bridge as the aisle, the three packages, the inquiry.

The three cards (Mick, 2026-10-30, by voice: "add the pricing. Just make sure the value is there";
loxley-rescue docs/lantern-log.md, its entry of 15:54 ET that day, which reverses his 2026-10-19 ruling
of no prices on the site). The Vow and The Crossing print at bare prices with the lines of the
Strategist's section 7 (loxley-rescue docs/briefs/2026-10-28-table-elopement-packages.md), word for
word. The rope bridge is the aisle in every package, so no line puts it behind a tier (the Critic,
2026-10-30-critic-close-package.md: keep "the bridge as your aisle" in The Vow). The gifts are given,
never priced (Letter Law 1); the dinner is "a private dinner" (Law 7). The Elevation is off the page:
the round froze its lines as its own for the one couple who was sent it (log 2026-10-28 ~11:05).

The third card is the waterfall package for summer 2027, shown but shadowed (Mick: "there but
strategically shadowed out, beautiful picture of the waterfall, price and a tantalizing description
with a banner"). It takes no retainer and no date: its agreement words (Counsel, 2026-10-29) are not
set. Its words come only from Counsel's W3 and the table, and never say pre-sale, reserve, deposit or
book now. Its banner scrolls to the form, picks the package there and sets the hidden "list" field to
"waterfall-2027", so the inquiry says which card it came from.

The inquiry form is the same Netlify form: name "elopement-inquiry", the honeypot, the hidden
form-name, every field name, and the action "/success.html" (check_forms.py). A hidden "page" field
(2026-10-29) names the page the form was sent from, and a hidden "list" field (2026-10-30), empty
unless the waterfall banner fills it, names the list. The search landing pages (pages/pseo.py) carry
this same form, and Netlify reads forms sharing a name as one definition, from the first it meets, so
both fields are here for theirs to be kept. The waterfall's option value is its name's slug. The
crossing walk (js/crossing.js) is not on this page by ruling; it is a later decision.
"""
import re

import build_v2 as B

ACORN = B.ACORN

# The waterfall package's name, said once: its card, its photograph's caption, the form's option and
# the option's value all read it, so Mick's pick swaps in this one edit. [MICK RATIFIES] the name
# ("What the owner decides" 3, docs/briefs/2026-10-28-table-elopement-packages.md: The Seventh Season,
# the table's candidate and this placeholder; Canopy Green; or his own). The Critic's note on the
# placeholder: the FAQ below names four of the seven seasons.
WATERFALL_NAME = 'The Seventh Season'

# What the waterfall banner writes into the form's hidden "list" field. It stays the same when the
# name changes, so every inquiry from the card is counted under one word.
WATERFALL_LIST = 'waterfall-2027'


def slug(name):
    """'The Seventh Season' -> 'the-seventh-season', the form's option value."""
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


SPACES = [
    ('eq3a0154', 'The rope bridge from the side, an oak trunk in the foreground', 'The Rope Bridge', 'The crossing',
     'One hundred feet of suspended pathway between two ancient white oaks. The bridge becomes the aisle. The canopy becomes the cathedral. There is no other wedding aisle like this in the Southeast.',
     'The aisle in every package.'),
    ('img_1717', 'The stone fire pit on the forest floor, ringed with ferns', 'The Fire Circle', 'Fire as witness',
     'A boulder fire pit that looks like it emerged from the earth centuries ago, set at the four compass points. It echoes traditions that have existed for thousands of years.',
     'With every package.'),
    ('img_2546', 'The treehouse deck with chairs, above the forest', 'The Sky Deck', 'Privacy measured in altitude',
     'An intimate ceremony on the private deck of your treehouse, sixty feet in the air. Just you, your partner, your officiant, and the sky.',
     'With every package.'),
]

# The gifts, in every card: said as given, never priced, no dollar figure beside them (Letter Law 1;
# Mick, 2026-10-28 ~07:30 ET). "And from us:" comes before them.
GIFTS = 'And from us: The Morning After, champagne brunch carried across the bridge, and a small cake.'

# (name, bare price, the line under the price, lead, items, the closing line). Bare prices: never
# "from" or "starting at", because no weekday price or seasonal premium exists (table section 7).
# The waterfall card is not here: it is shadowed and built by waterfall() below.
PACKAGES = [
    ('The Vow', '$4,500', None, None, [
        'Two nights in the treehouse.',
        'Your vows at the Fire Circle, or on the Sky Deck with the rope bridge as your aisle.',
        'An officiant, and photographs of your ceremony.',
        'A bouquet, a boutonniere, a champagne toast.'],
     None),
    ('The Crossing', '$6,500', None, 'Everything in The Vow, and', [
        'Your vows out on the rope bridge, at golden hour.',
        'A private dinner carried across the bridge to your door.',
        'Two hours of photographs, on the bridge and in the forest.',
        'Your day planned with Mick, hour by hour.',
        "The Builder's Tour."],
     None),
]

# The waterfall card (Mick, 2026-10-30). The price is log:3001 ($10,500 plus tax). "Summer 2027" and
# "a place we are still preparing for summer 2027" are Counsel's W3; the rest are the table's section 7
# lines for this card. "The calendar is open." is not said: no date can be taken until the agreement
# carries its words. The photograph is Mick's own of the waterfall on the land (log 2026-10-22 ~14:15;
# the same frame as branch proposals' proposal-waterfall, a1b4ad1), on the site's gallery since
# 2026-10-19 as aerial-creek.
WATERFALL = {
    'price': '$10,500',
    'when': 'Summer 2027',
    'about': 'Your vows at our waterfall, a place we are still preparing for summer 2027.',
    'lead': 'Everything in The Vow, and',
    'items': [
        'Three nights.',
        'Golden hour on the rope bridge after.',
        'A private dinner carried across the bridge to your door.',
        'Photographs through the day, and one of us with you all of it.'],
    'close': 'One weekend a month, June to September.',
    'banner': 'Get on the list for 2027',
    'img': 'aerial-creek',
    'alt': 'A waterfall spilling over mossy rock in a green summer forest',
}

# The line under the cards (agreement: the two of you plus up to six guests; half reserves the date,
# the balance thirty days before arrival). The waterfall card takes no retainer until its agreement
# words exist and Counsel has read them, so the retainer sentence names the two tiers it is true for.
UNDER_CARDS = 'Each is for the two of you and up to six guests. For The Vow and The Crossing, half reserves your date; the rest is due thirty days before you arrive.'

FAQ = [
    ('How many guests can attend?',
     'Each package is for the two of you and up to six guests. Intimate by design. The bridge is rated for eight people at one time, everyone counted: on the bridge that is the two of you, your officiant, and up to five more, your photographer among them. Every guest is part of your private celebration: your closest people, sharing your night in the canopy. Because Loxley Forest is our home and yours during your stay, all ceremony guests are welcomed as part of your booking party.'),
    # No officiant is named in the record: the answer says only what the agreement does.
    ('Do you provide an officiant?',
     'We arrange your officiant.'),
    # "Our preferred photographers have shot at Loxley before" is off: no photographer is named in
    # the record, and "They know the light" leaned on it. What every card says stands in its place.
    ('What about photography?',
     'Every package includes photographs of your ceremony. The rope bridge at golden hour produces images that will stop anyone mid-scroll.'),
    ("What's the best season?",
     'We have seven seasons, and every one is dramatic. Wildflower brings soft light and mountain laurel. Canopy Green brings fireflies. Color Turn is a cathedral of gold and crimson. Frost Season strips the canopy to its bones and reveals views you can\'t see the rest of the year.'),
    # "We've hosted ceremonies in every kind of weather" is off: the first ceremony is Dec 15, 2026.
    ('What about weather?',
     'Rain in the mountains is its own kind of magic, and your photographer will love it. Every couple receives a weather contingency plan. The canopy provides natural protection.'),
    ('Can we elope on a weekday?',
     "Absolutely, and we'll love you for it. Weekday ceremonies get the best light and the quietest forest."),
]


def package(name, price, when, lead, items, close):
    # The Crossing keeps the dark card as the middle of three; no badge, no claim on it.
    featured = name == 'The Crossing'
    when_html = f'<p class="lf-pkg__when">{when}</p>' if when else ''
    lead_html = f'<p class="lf-pkg__lead">{lead}:</p>' if lead else ''
    lis = ''.join(f'<li>{i}</li>' for i in items)
    close_html = f'<p class="lf-pkg__note">{close}</p>' if close else ''
    return f'''          <article class="lf-pkg{' lf-pkg--featured' if featured else ''} lf-rise">
            <h3 class="lf-h3 lf-pkg__name">{name}</h3>
            <p class="lf-pkg__price">{price} <span>plus tax</span></p>
            {when_html}{lead_html}<ul class="lf-acorns lf-pkg__list">{lis}</ul>
            <p class="lf-pkg__gift">{GIFTS}</p>
            {close_html}<a href="#inquiry" class="lf-link lf-pkg__go">Inquire for your date</a>
          </article>
'''


def waterfall():
    """The third card, shadowed: the photograph and the words dimmed, the banner bright. It has no
    "Inquire for your date" link, because it takes no date; the banner is its only way to the form."""
    w = WATERFALL
    lis = ''.join(f'<li>{i}</li>' for i in w['items'])
    photo = B.pic(w['img'], w['alt'], '(min-width: 900px) 33vw, 100vw', cls='lf-pkg__img')
    return f'''          <article class="lf-pkg lf-pkg--soon lf-rise" aria-labelledby="pk-water">
            <div class="lf-pkg__photo">{photo}<span class="lf-pkg__tag">{w['when']}</span></div>
            <div class="lf-pkg__shade">
            <h3 class="lf-h3 lf-pkg__name" id="pk-water">{WATERFALL_NAME}</h3>
            <p class="lf-pkg__price">{w['price']} <span>plus tax</span></p>
            <p class="lf-pkg__when">{w['about']}</p>
            <p class="lf-pkg__lead">{w['lead']}:</p><ul class="lf-acorns lf-pkg__list">{lis}</ul>
            <p class="lf-pkg__gift">{GIFTS}</p>
            <p class="lf-pkg__note">{w['close']}</p>
            </div>
            <a href="#inquiry" class="lf-pkg__list-go" data-list="{WATERFALL_LIST}" data-package="{slug(WATERFALL_NAME)}">{w['banner']}</a>
          </article>
'''


def page_elopements():
    head, gtm = B.head_from('elopements.html', '<link rel="preload" as="image" type="image/webp" href="images/v2/aerial-bridge-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="images/v2/aerial-bridge-800.webp" media="(max-width: 767px)" fetchpriority="high">')
    spaces = ''.join(
        f'<figure class="lf-space lf-rise">{B.pic(img, alt, "(min-width: 900px) 33vw, 100vw")}<figcaption>'
        f'<span class="lf-chapter__n">{kicker}</span><h3 class="lf-h3">{title}</h3><p>{words}</p><p class="lf-space__note">{note}</p></figcaption></figure>'
        for img, alt, title, kicker, words, note in SPACES)
    packages = ''.join(package(*p) for p in PACKAGES) + waterfall()
    faq = ''.join(f'<details class="lf-faq__item"><summary>{q}</summary><p>{a}</p></details>' for q, a in FAQ)
    body = f'''
    <!-- ========== HERO: the aisle ========== -->
    <section class="lf-hero lf-hero--page" aria-label="Elopements">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/aerial-bridge-800.webp" type="image/webp"><img src="images/v2/aerial-bridge-1600.webp" width="1600" height="1198" alt="From above: the hundred-foot rope bridge through the canopy at golden hour" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Elopements at Loxley Forest</p>
        <h1 class="lf-h1">Your aisle is a hundred feet long <em>and sixty feet in the air</em></h1>
        <p class="lf-lead">No ballrooms. No banquet chairs. No receiving line. Just two people, an ancient forest, and a ceremony as dramatic as the love that brought you here.</p>
        <div class="lf-actions"><a href="#inquiry" class="lf-btn lf-btn--ghost">Inquire about your date</a><a href="#packages" class="lf-link">See the packages</a></div>
      </div>
    </section>

    <!-- ========== THE AISLE ========== -->
    <section class="lf-sec lf-light lf-center" aria-labelledby="ai-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise" id="ai-h">The aisle</p>
        <p class="lf-statement lf-rise">Most elopement venues give you a pretty backdrop. We give you a transformation.</p>
        <div class="lf-body lf-rise">
          <p>Your ceremony begins on solid ground. You walk together toward the rope bridge: a hundred feet of suspended pathway over the forest floor, swaying gently between two ancient white oaks. Every step is a choice. Every step is toward each other. By the time you reach the other side, the ordinary world is behind you, and you're standing in the canopy, sixty feet above the earth, in a place that was built for exactly this moment.</p>
          <p>Say your vows on the deck of a treehouse a family built with their own hands. Exchange rings beside a fire pit set at the four compass points. Let the forest witness it. Let the silence hold it.</p>
        </div>
        <p class="lf-el-coda lf-rise">Then stay the night. <em>Wake up married in the sky.</em></p>
      </div>
    </section>

    <!-- ========== THREE CEREMONY SPACES ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="sp-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Ceremony spaces</p>
        <h2 class="lf-h2 lf-rise" id="sp-h">Three ways <em>to say forever</em></h2>
        <div class="lf-spaces">{spaces}</div>
      </div>
    </section>

    <!-- ========== PACKAGES ========== -->
    <section class="lf-sec lf-light" id="packages" aria-labelledby="pk-h">
      <div class="lf-wrap">
        <div class="lf-center">
          <p class="lf-eyebrow lf-rise">Elopement packages</p>
          <h2 class="lf-h2 lf-rise" id="pk-h">Three tiers. <em>One unforgettable beginning.</em></h2>
          <p class="lf-lead lf-rise">Every Loxley elopement is personally coordinated. Share your vision and we'll design something extraordinary. No two ceremonies are the same.</p>
        </div>
        <div class="lf-pkgs">
{packages}        </div>
        <p class="lf-pkgs__small lf-rise">{UNDER_CARDS}</p>
      </div>
    </section>

{B.REVIEWS}
    <!-- ========== QUESTIONS ========== -->
    <section class="lf-sec lf-light" aria-labelledby="fq-h">
      <div class="lf-wrap lf-faq">
        <p class="lf-eyebrow lf-rise">Questions</p>
        <h2 class="lf-h2 lf-rise" id="fq-h">Everything <em>you're wondering</em></h2>
        <div class="lf-faq__list lf-rise">{faq}</div>
      </div>
    </section>

    <!-- ========== INQUIRY: the Netlify form "elopement-inquiry", kept exactly ========== -->
    <section class="lf-sec lf-parch" id="inquiry" aria-labelledby="iq-h">
      <div class="lf-wrap lf-inq">
        <div class="lf-center">
          <p class="lf-eyebrow lf-rise">Inquire</p>
          <h2 class="lf-h2 lf-rise" id="iq-h">Your marriage deserves a beginning <em>this dramatic</em></h2>
          <p class="lf-lead lf-rise">Tell us your date, your vision, and how many people you're bringing. We'll design the rest.</p>
        </div>

        <div class="lf-inq__wrap lf-rise">
          <form class="lf-form lf-form--light" name="elopement-inquiry" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" action="/success.html">
            <input type="hidden" name="form-name" value="elopement-inquiry">
            <input type="hidden" name="page" value="/elopements">
            <input type="hidden" name="list" value="">
            <p style="display:none;"><label>Don't fill this out: <input name="bot-field"></label></p>

            <div class="lf-form__row">
              <label for="el-names">Your names</label>
              <input type="text" id="el-names" name="names" required>
            </div>

            <div class="lf-form__row">
              <label for="el-email">Email</label>
              <input type="email" id="el-email" name="email" required autocomplete="email">
            </div>

            <div class="lf-form__row">
              <label for="el-phone">Phone</label>
              <input type="tel" id="el-phone" name="phone" autocomplete="tel">
            </div>

            <div class="lf-form__row">
              <label for="el-date">Preferred date or month</label>
              <input type="text" id="el-date" name="preferred_date" placeholder="e.g. October 2026 or 10/12/2026">
            </div>

            <div class="lf-form__row">
              <label for="el-guests">Guest count</label>
              <select id="el-guests" name="guest_count">
                <option value="">Select...</option>
                <option value="just-us">Just us</option>
                <option value="2-6">2 to 6 guests</option>
                <option value="7-12">7 to 12 guests</option>
                <option value="13-20">13 to 20 guests</option>
              </select>
              <p class="lf-form__help">Every guest is part of your private celebration: your closest people, sharing your night in the canopy. Because Loxley Forest is our home and yours during your stay, all ceremony guests are welcomed as part of your booking party.</p>
            </div>

            <div class="lf-form__row">
              <label for="el-package">Which package interests you?</label>
              <select id="el-package" name="package">
                <option value="">Select...</option>
                <option value="the-vow">The Vow</option>
                <option value="the-crossing">The Crossing</option>
                <option value="{slug(WATERFALL_NAME)}">{WATERFALL_NAME}</option>
                <option value="not-sure">Not sure yet, help me decide</option>
              </select>
            </div>

            <div class="lf-form__row">
              <label for="el-referral">How did you hear about us?</label>
              <select id="el-referral" name="referral">
                <option value="">Select...</option>
                <option value="instagram">Instagram</option>
                <option value="pinterest">Pinterest</option>
                <option value="google">Google</option>
                <option value="photographer">Photographer Referral</option>
                <option value="the-knot">The Knot</option>
                <option value="friend">Friend / Word of Mouth</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="lf-form__row">
              <label for="el-vision">Tell us your vision</label>
              <textarea id="el-vision" name="vision" rows="5" placeholder="Your ceremony style, your must-haves, the feeling you want. We'll design around it."></textarea>
            </div>

            <button type="submit" class="lf-btn lf-btn--forest">Inquire about your date</button>
          </form>

          <p class="lf-inq__talk">Prefer to talk? Call us at <a href="tel:+17065024823">706-502-4823</a> or email <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a></p>

          <div id="elopement-success" class="lf-inq__done" role="status" hidden>
            <p>The forest knows you're coming. We'll be in touch soon.</p>
            <p class="lf-inq__sig">Mick &amp; Livy</p>
          </div>
        </div>
      </div>
    </section>
    <script>
      (function(){{
        if (location.search.indexOf('submitted=1') !== -1) {{
          var form = document.querySelector('form[name="elopement-inquiry"]');
          var success = document.getElementById('elopement-success');
          if (form) form.style.display = 'none';
          if (success) success.hidden = false;
        }}
        // The waterfall banner: the click scrolls to the form (js/global.js) and this marks the
        // inquiry as the 2027 list's and picks the package. Without script the link still scrolls.
        var go = document.querySelector('.lf-pkg__list-go');
        if (go) go.addEventListener('click', function(){{
          var form = document.querySelector('form[name="elopement-inquiry"]');
          if (!form) return;
          var list = form.querySelector('input[name="list"]');
          var pkg = form.querySelector('select[name="package"]');
          if (list) list.value = go.getAttribute('data-list');
          if (pkg) pkg.value = go.getAttribute('data-package');
        }});
      }})();
    </script>

    <!-- ========== THE SMALL PRINT ========== -->
    <section class="lf-el-legal" aria-label="About Loxley Forest elopements">
      <p>Loxley Forest is a luxury treehouse accommodation where couples celebrate life's most meaningful moments: elopements, anniversaries, proposals, and intimate family gatherings, surrounded by 42 acres of mountain forest, 60 feet in the air. Our elopement experience add-ons transform your treehouse stay into something sacred. Simple. Beautiful. Intentional.</p>
    </section>
'''
    return 'elopements.html', head, gtm, body, '/book', False


PAGES = [page_elopements]

CSS = '''
.lf-el-coda { margin: 34px auto 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-size: clamp(1.6rem, 5vw, 2.2rem); line-height: 1.3; color: var(--forest-deep); }

.lf-spaces { display: grid; gap: 48px; margin-top: 44px; }
.lf-space { margin: 0; }
.lf-space img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.lf-space figcaption { padding-top: 18px; }
.lf-space .lf-h3 { color: var(--on-dark); }
.lf-space p { margin: 8px 0 0; color: var(--on-dark-muted); font-size: 1.12rem; line-height: 1.6; }
.lf-space .lf-space__note { margin-top: 12px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; }
@media (min-width: 900px) { .lf-spaces { grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 56px; } .lf-space img { aspect-ratio: 4 / 5; } }

.lf-pkgs { display: grid; gap: 22px; margin-top: 48px; }
.lf-pkg { position: relative; background: var(--cream, #fff); border: 1px solid rgba(61, 50, 40, 0.14); padding: 34px 26px 28px; display: flex; flex-direction: column; }
.lf-pkg--featured { background: var(--forest-deep); color: var(--on-dark); border-color: var(--forest-deep); }
.lf-pkg--featured .lf-pkg__lead, .lf-pkg--featured .lf-pkg__note { color: var(--on-dark-muted); }
.lf-pkg--featured .lf-acorns b, .lf-pkg--featured .lf-pkg__name { color: var(--on-dark); }
.lf-pkg--featured .lf-pkg__gift { color: var(--on-dark); border-top-color: rgba(247, 243, 237, 0.24); }
.lf-pkg__name { font-size: 2.2rem; color: var(--forest-deep); }
.lf-pkg__price { margin: 14px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-size: 2.4rem; line-height: 1; font-variant-numeric: lining-nums; }
.lf-pkg__price span { display: block; margin-top: 8px; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.75; }
.lf-pkg__when { margin: 18px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.35rem; line-height: 1.3; }
.lf-pkg__gift { margin: 20px 0 0; padding-top: 16px; border-top: 1px solid rgba(61, 50, 40, 0.16); font-size: 1.05rem; line-height: 1.55; }
.lf-pkg__lead { margin: 24px 0 0; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--stone); }
.lf-pkg__list { margin-top: 18px; gap: 10px; }
.lf-pkg__list li { font-size: 1.08rem; }
.lf-pkg__lead + .lf-pkg__list { margin-top: 14px; }
.lf-pkg__note { margin: 18px 0 0; font-size: 1rem; font-style: italic; color: var(--stone); }
.lf-pkg__go { margin-top: auto; padding-top: 22px; align-self: flex-start; }
@media (min-width: 900px) { .lf-pkgs { grid-template-columns: repeat(3, 1fr); align-items: stretch; margin-top: 64px; } .lf-pkg { padding: 40px 32px 32px; } }
/* The waterfall card, shadowed (Mick, 2026-10-30): a darker ground, the photograph desaturated under a
   veil, every word in stone; the banner alone at full strength. Colours, not opacity, do the dimming,
   so the words keep their contrast (stone on the card's ground is above 4.5:1). */
.lf-pkg--soon { padding-top: 0; overflow: hidden; background: linear-gradient(180deg, var(--parchment), #e7e1d6); color: var(--stone); }
.lf-pkg--soon .lf-pkg__name, .lf-pkg--soon .lf-pkg__price, .lf-pkg--soon .lf-pkg__lead, .lf-pkg--soon .lf-pkg__note, .lf-pkg--soon .lf-pkg__gift, .lf-pkg--soon .lf-acorns b { color: var(--stone); }
.lf-pkg--soon .lf-pkg__shade { display: flex; flex-direction: column; }
.lf-pkg__photo { position: relative; margin: 0 -26px 28px; }
.lf-pkg__img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 10; object-fit: cover; filter: saturate(0.5) brightness(0.78); }
.lf-pkg__photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20, 36, 24, 0.1), rgba(20, 36, 24, 0.55)); pointer-events: none; }
.lf-pkg__tag { position: absolute; left: 22px; bottom: 16px; z-index: 1; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--on-dark); }
.lf-pkg__list-go { display: block; margin: auto -26px -28px; padding: 20px 22px; background: var(--forest-deep); color: var(--linen); text-align: center; text-decoration: none; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.8125rem; letter-spacing: 0.16em; text-transform: uppercase; }
.lf-pkg--soon .lf-pkg__shade + .lf-pkg__list-go { margin-top: 26px; }
.lf-pkg__list-go:hover { opacity: 0.92; }
.lf-pkg__list-go:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 3px; }
@media (min-width: 900px) { .lf-pkg--soon { padding-top: 0; } .lf-pkg__photo { margin: 0 -32px 30px; } .lf-pkg__list-go { margin: 26px -32px -32px; } .lf-pkg--soon .lf-pkg__shade { flex: 1; } }
.lf-pkgs__small { max-width: 40rem; margin: 36px auto 0; text-align: center; font-size: 1.05rem; color: var(--stone); }

.lf-faq { max-width: 820px; }
.lf-faq__list { margin-top: 36px; border-top: 1px solid rgba(61, 50, 40, 0.18); }
.lf-faq__item { border-bottom: 1px solid rgba(61, 50, 40, 0.18); }
.lf-faq__item summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 20px; min-height: 64px; padding: 14px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.5rem; line-height: 1.25; color: var(--forest-deep); }
.lf-faq__item summary::-webkit-details-marker { display: none; }
.lf-faq__item summary::after { content: '+'; flex: none; font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: 1.5rem; color: var(--stone); transition: transform 0.25s var(--ease-natural); }
.lf-faq__item[open] summary::after { transform: rotate(45deg); }
.lf-faq__item summary:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 4px; }
.lf-faq__item p { margin: 0 0 22px; font-size: 1.12rem; line-height: 1.7; color: var(--stone); max-width: var(--measure); }

.lf-inq__wrap { max-width: 640px; margin: 44px auto 0; }
.lf-form { display: grid; gap: 22px; }
.lf-form__row { display: grid; gap: 8px; }
.lf-form label { font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--forest-deep); }
.lf-form input, .lf-form select, .lf-form textarea {
  width: 100%; min-height: 52px; padding: 12px 14px; border: 1px solid rgba(61, 50, 40, 0.3); border-radius: 0;
  background: var(--linen); color: var(--bark); font: 400 1.15rem 'Cormorant Garamond', Georgia, serif; -webkit-appearance: none; appearance: none;
}
.lf-form select { background-image: linear-gradient(45deg, transparent 50%, var(--stone) 50%), linear-gradient(135deg, var(--stone) 50%, transparent 50%); background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 40px; }
.lf-form textarea { min-height: 140px; resize: vertical; }
.lf-form input::placeholder, .lf-form textarea::placeholder { color: var(--stone); opacity: 0.8; }
.lf-form input:focus-visible, .lf-form select:focus-visible, .lf-form textarea:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 2px; }
/* The inquiry form sits on a light ground. faq.py's dark-ground form shares the .lf-form selectors
   and comes later in v2-pages.css, so it won there and the typed words went pale; the modifier puts
   the light form back (dark words on linen). The same rules ride on branch proposals (8feb5c7). */
.lf-form.lf-form--light label { margin-top: 0; color: var(--forest-deep); }
.lf-form.lf-form--light input[type], .lf-form.lf-form--light select[name], .lf-form.lf-form--light textarea[name] { border-color: rgba(61, 50, 40, 0.3); background: var(--linen); color: var(--bark); }
.lf-form.lf-form--light input[type]:focus-visible, .lf-form.lf-form--light select[name]:focus-visible, .lf-form.lf-form--light textarea[name]:focus-visible { outline-color: var(--forest-deep); }
.lf-form__help { margin: 4px 0 0; font-size: 1rem; font-style: italic; line-height: 1.55; color: var(--stone); }
.lf-btn--forest { background: var(--forest-deep); border-color: var(--forest-deep); color: var(--linen); width: 100%; cursor: pointer; }
.lf-btn--forest:hover { background: var(--forest-deep); opacity: 0.92; }
.lf-btn--forest:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 3px; }
.lf-inq__talk { margin: 26px 0 0; text-align: center; font-size: 1.1rem; color: var(--stone); }
.lf-inq__talk a { color: var(--forest-deep); }
.lf-inq__done { margin-top: 10px; text-align: center; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; line-height: 1.35; color: var(--forest-deep); }
.lf-inq__done p { margin: 0; }
.lf-inq__sig { margin-top: 12px !important; font-style: italic; font-size: 1.3rem; color: var(--stone); }

.lf-el-legal { background: var(--parchment); padding: 0 var(--pad-x) 64px; }
.lf-el-legal p { max-width: 46rem; margin: 0 auto; padding-top: 28px; border-top: 1px solid rgba(61, 50, 40, 0.16); text-align: center; font-size: 0.95rem; line-height: 1.6; color: var(--stone); }
'''
