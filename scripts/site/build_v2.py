#!/usr/bin/env python3
"""Builds the redesigned pages of loxleyforest.com from shared parts.

The site stays hand-authored static HTML: this writes plain .html files into
the repo root, and nothing runs at deploy. Edit a page's body here (or a shared
part), run `python3 scripts/site/build_v2.py`, commit the HTML it writes.

Each page keeps its own <head> (Tag Manager, title, meta, schema) from the file
already in the repo; the builder swaps only the stylesheets and the preload.

Pages: the home page and the treehouse page are written here; every other page lives in its
own module in scripts/site/pages/ (one file per page or group), which imports this module as
`B` for the shared parts and exposes `PAGES = [fn, ...]` and, if it needs any, `CSS` (a string of rules).
The builder gathers every module's CSS into css/v2-pages.css (do not hand-edit it). Photos:
scripts/site/v2img.py makes images/v2/<name>-800.webp and -1600.webp for pic().
"""
import glob
import importlib.util
import os
import re
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ARROW = open(os.path.join(ROOT, 'images/brand/logo/loxley-arrow-divider.svg')).read().strip()
ACORN = ('<svg viewBox="0 0 16 20" aria-hidden="true"><path fill="currentColor" d="M8 2.2C4.6 2.2 1.9 4.6 1.9 8H14.1C14.1 4.6 '
         '11.4 2.2 8 2.2ZM2.8 8.9H13.2C13.2 13.4 10.8 17.2 8 19.2C5.2 17.2 2.8 13.4 2.8 8.9ZM7.6 2.4C7.7 1.2 8.4 .4 9.6 .1L9.9 '
         '.7C9 1 8.5 1.6 8.5 2.4Z"/></svg>')
NAV = [('/treehouses', 'The Treehouse'), ('/experiences', 'Experiences'), ('/elopements', 'Elopements'),
       ('/our-story', 'Our Story'), ('/gallery', 'Gallery'), ('/local-guide', 'Local Guide')]
FONTS = ('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500'
         '&family=Montserrat:wght@300;400;500;600;700&display=swap')


def pic(name, alt, sizes, eager=False, cls=''):
    """A responsive <img> from images/v2/<name>-800.webp (and -1600 when it exists)."""
    big = f'images/v2/{name}-1600.webp'
    srcset = f'images/v2/{name}-800.webp 800w' + (f', {big} 1600w' if os.path.exists(os.path.join(ROOT, big)) else '')
    w, h = Image.open(os.path.join(ROOT, f'images/v2/{name}-800.webp')).size
    load = ' fetchpriority="high"' if eager else ' loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ''
    return f'<img src="images/v2/{name}-800.webp" srcset="{srcset}" sizes="{sizes}" width="{w}" height="{h}" alt="{alt}"{load}{c}>'


def head_from(page, preload=''):
    """The page's own <head>, with the redesign's stylesheets in place of its old ones."""
    s = open(os.path.join(ROOT, page)).read()
    head = s[:s.index('</head>')]
    head = re.sub(r'\s*<link rel="stylesheet" href="css/(?!global\.css)[a-z0-9-]+\.css">', '', head)
    head = re.sub(r'\s*<link rel="preload" as="image"[^>]*>', '', head)
    head = head.replace('<link rel="stylesheet" href="css/global.css">',
                        '<link rel="stylesheet" href="css/global.css">\n  <link rel="stylesheet" href="css/gatehouse.css">\n  <link rel="stylesheet" href="css/v2.css">\n  <link rel="stylesheet" href="css/v2-pages.css">')
    if preload:
        head = head.rstrip() + '\n  ' + preload
    gtm = s[s.index('<!-- Google Tag Manager (noscript) -->'):s.index('<!-- End Google Tag Manager (noscript) -->') + len('<!-- End Google Tag Manager (noscript) -->')]
    return head + '\n</head>\n', gtm


def header(book):
    links = ''.join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    return f'''  <a href="#main" class="skip-link">Skip to content</a>

  <header class="lf-hdr">
    <a href="/" class="lf-hdr__mark" aria-label="Loxley Forest, home"><img src="images/brand/logo/loxley-wordmark-on-dark.svg" alt="Loxley Forest" width="236" height="32"></a>
    <nav class="lf-hdr__nav" aria-label="Main">{links}</nav>
    <a href="{book}" class="lf-btn lf-hdr__book">Book your dates</a>
    <button class="lf-menu-btn" type="button" aria-expanded="false" aria-controls="lf-menu" aria-label="Open menu"><span></span></button>
  </header>
  <div class="lf-menu" id="lf-menu" aria-hidden="true">
    <nav aria-label="Menu">{links}<a href="/faq">Questions</a></nav>
    <a href="{book}" class="lf-btn">{ACORN}Book your dates</a>
    <p class="lf-menu__foot">Dahlonega, Georgia<br>Just over an hour from Atlanta</p>
  </div>
'''


def footer(book, gatehouse):
    links = ''.join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    gh = '\n  <script src="js/gatehouse.js" defer></script>' if gatehouse else ''
    return f'''  <footer class="lf-foot">
    <div class="lf-foot__grid">
      <div>
        <img src="images/brand/logo/loxley-wordmark-on-dark.svg" alt="Loxley Forest" width="220" height="30" loading="lazy">
        <p style="margin-top:18px;font-size:1.1rem">Dahlonega, Georgia. Just over an hour from Atlanta.<br>42 acres of hardwood cove forest at 1,470 feet.</p>
      </div>
      <nav aria-label="Footer">{links}<a href="/faq">Questions</a></nav>
      <nav aria-label="Contact"><a href="https://instagram.com/loxleyforest" target="_blank" rel="noopener">Instagram</a><a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a><a href="tel:+17065024823">706-502-4823</a></nav>
      <div class="lf-foot__small"><span>&copy; 2026 Loxley Forest</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/cancellation">Cancellation</a></div>
    </div>
  </footer>

  <a href="{book}" class="book-fab">{ACORN}Book your dates</a>
  <script src="js/vendor/lenis.min.js"></script>
  <script src="js/global.js"></script>
  <script src="js/v2.js"></script>
  <script src="js/reviews.js" defer></script>{gh}
'''


BOOK = f'''    <section class="lf-sec lf-parch lf-book" id="book" aria-labelledby="book-h">
      <div class="lf-book__head">
        <p class="lf-eyebrow">Your dates</p>
        <h2 class="lf-h2" id="book-h">Pick your nights. <em>See the whole price at once.</em></h2>
        <p class="lf-lead" style="margin-left:auto;margin-right:auto">Every open night shows its rate. Choose your dates and the total appears, taxes and cleaning included. Book direct and deal with the family who built it.</p>
        <ul class="lf-promise" data-gh-live-only hidden>
          <li>A 25% retainer holds your nights</li>
          <li>The rest is due 30 days before you arrive</li>
          <li>One free reschedule within a year, up to 7 days out</li>
        </ul>
      </div>
      <div id="gatehouse"
           data-api=""
           data-unit="loxley-forest-canopy-treehouse-dahlonega"
           data-stripe-key=""
           data-snapshot="data/gatehouse-snapshot.json"
           data-handoff="/book"
           data-fallback="#gh-fallback"></div>
      <div id="gh-fallback" class="lf-book__alt" hidden>
        <p>Booking is resting for a moment. <a href="/book">Send us your dates</a> and we'll write back.</p>
      </div>
      <p class="lf-book__alt">Questions before you book? <a href="/faq">Read the answers</a> or write to stay@loxleyforest.com.</p>
    </section>
'''

WALK = f'''    <section class="lf-walk" data-crossing aria-label="The crossing: a hundred feet of rope bridge to the treehouse">
      <div class="lf-walk__stage">
        <canvas aria-hidden="true"></canvas>
        <div class="lf-walk__words">
          <p class="lf-walk__line" data-from="-20" data-to="12">Then the hundred-foot bridge appears,</p>
          <p class="lf-walk__line" data-from="20" data-to="50">the one that makes your heart beat faster</p>
          <p class="lf-walk__line" data-from="56" data-to="80">before the forest slows it back down.</p>
          <p class="lf-walk__line" data-from="88" data-to="999">That one takes you to your front door.</p>
        </div>
        <div class="lf-walk__count" aria-hidden="true"><p><b data-walk-count>0</b><span>feet across</span></p><i class="lf-walk__bar"><i class="lf-walk__mark" data-walk-mark>{ACORN}</i></i></div>
        <a class="lf-walk__skip" href="#book">Skip to your dates</a>
      </div>
    </section>
'''

REVIEWS = '''    <section class="lf-sec lf-parch lf-center lf-reviews" aria-labelledby="rv-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow">Guest stories</p>
        <h2 class="lf-h2" id="rv-h" style="margin-bottom:34px">What they remember most</h2>
        <div class="review-rotator" data-review-rotator>
          <div class="review-rotator__card">
            <div class="testimonial__stars" aria-hidden="true">★★★★★</div>
            <p class="testimonial__quote">"The only sounds you hear are the birds chirping and the gentle rushing of water below. It feels very private and secluded. The perfect adventure to feel like you are camping in the woods, but with a bed and bathroom."</p>
            <p class="testimonial__author">Kellie · Marietta, GA</p>
          </div>
        </div>
        <p class="lf-reviews__note">4.98 from 200+ guest reviews, gathered on Airbnb and Google · Tap for another story</p>
      </div>
    </section>
'''


def treehouse_two():
    return f'''    <section class="lf-sec lf-dark" id="treehouse-two" aria-labelledby="t2-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow lf-rise">Coming soon</p>
          <h2 class="lf-h2 lf-rise" id="t2-h">Treehouse two is <em>almost here</em></h2>
          <p class="lf-lead lf-rise">Same hand-built craft. Same sixty-foot elevation. A different view of the same forest. The first nights go to the list.</p>
          <form class="lf-signup lf-rise" name="treehouse-2-list" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-lf-ajax action="/success.html">
            <input type="hidden" name="form-name" value="treehouse-2-list">
            <p hidden><label>Leave this empty <input name="bot-field"></label></p>
            <label for="t2-email">Your email</label>
            <input id="t2-email" type="email" name="email" required autocomplete="email" placeholder="you@example.com">
            <button class="lf-btn lf-btn--ghost" type="submit">Join the list</button>
            <p class="lf-signup__done" role="status" hidden>You're on the list. We'll write when the first nights open.</p>
          </form>
        </div>
        <figure class="lf-photo lf-photo--tall lf-rise">{pic('img_2546', 'A treehouse deck with chairs above the forest', '(min-width: 900px) 50vw, 100vw')}</figure>
      </div>
    </section>
'''


INCLUDED = '''          <ul class="lf-acorns lf-rise">
            <li>A queen bed framed by panoramic windows</li>
            <li>A private deck above the forest floor</li>
            <li><b>Fire &amp; Flour:</b> fresh dough and a wood-fired oven on your sky deck</li>
            <li><b>TreeMail:</b> morning coffee and seasonal treats, delivered</li>
            <li>A pop-up projector for cinema night in the canopy</li>
            <li>A fire pit on the forest floor</li>
            <li>Heated for the cold seasons, with windows that open to the forest in summer</li>
            <li>A kitchen for morning coffee and midnight snacks</li>
            <li>42 acres of cove forest to explore</li>
          </ul>
'''


def final_call(book):
    return f'''    <section class="lf-sec lf-dark lf-center" aria-labelledby="fc-h">
      <div class="lf-wrap">
        <div class="lf-rise" style="margin-bottom:44px">{ARROW}</div>
        <h2 class="lf-h2 lf-rise" id="fc-h">Some places you visit. <em>This one changes you.</em></h2>
        <p class="lf-lead lf-rise">Book direct with the family who built it.</p>
        <div class="lf-actions lf-rise" style="justify-content:center"><a href="{book}" class="lf-btn">{ACORN}Book your dates</a></div>
      </div>
    </section>
'''


# ---------------------------------------------------------------- the pages

def page_index():
    head, gtm = head_from('index.html', '<link rel="preload" as="image" type="image/webp" href="images/hero/hero-poster-desk.webp" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="images/hero/hero-poster-phone.webp" media="(max-width: 767px)" fetchpriority="high">')
    body = f'''
    <!-- ========== HERO: the crossing ========== -->
    <section class="lf-hero" aria-label="Loxley Forest">
      <div class="hero__media">
        <picture>
          <source media="(max-width: 767px)" srcset="images/hero/hero-poster-phone.webp" type="image/webp">
          <img src="images/hero/hero-poster-desk.webp" alt="The rope bridge strung with lights, leading through the forest to the treehouse at dusk" width="1920" height="1080" fetchpriority="high">
        </picture>
        <video class="hero__video" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-ready
          data-desk="images/hero/hero-desk.mp4" data-desk-webm="images/hero/hero-desk.webm" data-phone="images/hero/hero-phone.mp4"></video>
      </div>
      <div class="lf-hero__shade"></div>
      <button class="lf-hero__pause" type="button" aria-label="Pause the video" hidden><span></span></button>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Dahlonega, Georgia · 1,470 feet</p>
        <h1 class="lf-h1">Sleep where the forest <em>holds you</em></h1>
        <p class="lf-lead">A hand-built treehouse sixty feet up in the canopy, reached by a hundred-foot rope bridge. Just over an hour from Atlanta.</p>
        <div class="lf-actions">
          <a href="#book" class="lf-btn">{ACORN}Book your dates</a>
          <a href="/treehouses" class="lf-link">See the treehouse</a>
        </div>
        <p class="lf-proof"><span class="lf-proof__stars" aria-hidden="true">★★★★★</span><span>4.98 from 200+ guest reviews</span></p>
      </div>
    </section>

    <!-- ========== THE CROSSING ========== -->
    <section class="lf-sec lf-light lf-center">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">The crossing</p>
        <p class="lf-statement lf-rise">This is not a cabin with a view. This is a home in the sky, suspended in a canopy of white oak and beech that has stood for over a century.</p>
        <div class="lf-body lf-rise">
          <p>You'll cross a thirty-foot rope bridge through the trees as a warm-up.</p>
        </div>
      </div>
    </section>

    <!-- ========== THE CROSSING, WALKED (js/crossing.js): the far end opens onto the calendar ========== -->
{WALK}
    <!-- ========== YOUR DATES: the Gatehouse, at the far end of the bridge ========== -->
{BOOK}
{REVIEWS}
    <!-- ========== WHAT'S INCLUDED ========== -->
    <section class="lf-sec lf-light" aria-labelledby="inc-h">
      <div class="lf-wrap lf-split">
        <figure class="lf-photo lf-photo--tall lf-rise">{pic('img_0831', 'The bed beneath the treehouse windows', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">The treehouse</p>
          <h2 class="lf-h2 lf-rise" id="inc-h">Everything you need. <em>Nothing you don't.</em></h2>
          <p class="lf-lead lf-rise">You'll fall asleep sixty feet in the air with nothing above you but stars and nothing below you but the creek rolling through the forest floor.</p>
{INCLUDED}          <p class="lf-body lf-rise" style="margin-top:26px">What we don't include: televisions. You won't need one.</p>
        </div>
      </div>
    </section>


    <!-- ========== SIXTY FEET UP ========== -->
    <section class="lf-sec lf-dark" aria-label="The treehouse in numbers">
      <div class="lf-wrap">
        <ul class="lf-facts">
          <li class="lf-rise"><b>60 ft</b><span>Up in the canopy</span></li>
          <li class="lf-rise"><b>100 ft</b><span>Of rope bridge to your door</span></li>
          <li class="lf-rise"><b>42</b><span>Acres of cove forest</span></li>
          <li class="lf-rise"><b>1,470 ft</b><span>Above sea level</span></li>
        </ul>
      </div>
    </section>

    <!-- ========== CHAPTERS ========== -->
    <section class="lf-sec lf-dark" style="padding-top:0" aria-labelledby="ch-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">The Loxley experience</p>
        <h2 class="lf-h2 lf-rise" id="ch-h">Your stay is a story, <em>not a checklist</em></h2>
        <div class="lf-chapters">
          <figure class="lf-chapter lf-rise">{pic('eq3a0943', 'The rope bridge at night, strung with warm lights', '(min-width: 900px) 25vw, 78vw')}<figcaption><span class="lf-chapter__n">Chapter one</span><h3 class="lf-h3">The Crossing</h3><p>Your first steps across the rope bridge.</p></figcaption></figure>
          <figure class="lf-chapter lf-rise">{pic('img_0828', 'The bed beneath the treehouse windows in warm light', '(min-width: 900px) 25vw, 78vw')}<figcaption><span class="lf-chapter__n">Chapter two</span><h3 class="lf-h3">First Light</h3><p>Dawn breaking through the canopy, from your pillow.</p></figcaption></figure>
          <figure class="lf-chapter lf-rise">{pic('eq3a0222', 'The pizza oven on the sky deck', '(min-width: 900px) 25vw, 78vw')}<figcaption><span class="lf-chapter__n">Chapter three</span><h3 class="lf-h3">Fire &amp; Flour</h3><p>Pizza you made yourself on the sky deck.</p></figcaption></figure>
          <figure class="lf-chapter lf-rise">{pic('eq3a0907', 'The treehouse canvas glowing at dusk with string lights', '(min-width: 900px) 25vw, 78vw')}<figcaption><span class="lf-chapter__n">Chapter four</span><h3 class="lf-h3">After Dark</h3><p>The stars you forgot existed, framed by the canopy.</p></figcaption></figure>
        </div>
        <div class="lf-actions lf-rise"><a href="/experiences" class="lf-link">See every experience</a></div>
      </div>
    </section>

    <!-- ========== BUILT BY HAND ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="bh-h">
      <div class="lf-bg">{pic('eq3a2149', '', '100vw')}</div>
      <div class="lf-wrap lf-over">
        <p class="lf-eyebrow lf-rise">Built by hand</p>
        <h2 class="lf-h2 lf-rise" id="bh-h">A family that lives in the <em>forest they built</em></h2>
        <div class="lf-body lf-rise" style="margin-top:24px">
          <p>They carried every beam and board down four hundred feet of mountain by hand, because they wouldn't let a machine touch the forest. The arborists said the rope bridge was too long. They built it anyway.</p>
          <p>They live here now: Mick, Livy, Aurora and Tilly Mac. When you arrive, the people who designed and built your treehouse are the same people handing you a welcome basket.</p>
        </div>
        <div class="lf-actions lf-rise"><a href="/our-story" class="lf-link">Read our story</a></div>
      </div>
    </section>

    <!-- ========== ELOPEMENTS ========== -->
    <section class="lf-sec lf-light" aria-labelledby="el-h">
      <div class="lf-wrap lf-split lf-split--flip">
        <figure class="lf-photo lf-photo--tall lf-rise">{pic('eq3a0160', 'The rope bridge to the treehouse in fall colour', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">Elopements</p>
          <h2 class="lf-h2 lf-rise" id="el-h">The most dramatic aisle <em>in the Southeast</em></h2>
          <p class="lf-lead lf-rise">Cross a hundred-foot rope bridge to say your vows. Exchange rings beside a boulder fire pit that looks like it emerged from the earth centuries ago.</p>
          <div class="lf-actions lf-rise"><a href="/elopements" class="lf-link">Plan your elopement</a></div>
        </div>
      </div>
    </section>

{treehouse_two()}
    <!-- ========== FIND US ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="fu-h">
      <div class="lf-bg">{pic('eq3a0107', '', '100vw')}</div>
      <div class="lf-wrap lf-over">
        <p class="lf-eyebrow lf-rise">Find us</p>
        <h2 class="lf-h2 lf-rise" id="fu-h">Closer than you think. <em>Further than you've ever been.</em></h2>
        <p class="lf-lead lf-rise">In the foothills above Dahlonega: Georgia's wine country, the southern tip of the Appalachian Trail, and 42 acres of forest where the only schedule is sunrise and sunset.</p>
        <ul class="lf-drive lf-rise">
          <li><span>From Atlanta</span><b>Just over an hour</b></li>
          <li><span>From Chattanooga</span><b>2 hours</b></li>
          <li><span>From Greenville, SC</span><b>2 hours</b></li>
          <li><span>From Birmingham</span><b>3 hours</b></li>
          <li><span>From Charlotte</span><b>3.5 hours</b></li>
        </ul>
        <div class="lf-actions lf-rise"><a href="https://maps.google.com/?q=Loxley+Forest+Dahlonega+GA" target="_blank" rel="noopener" class="lf-link">Get directions</a><a href="/local-guide" class="lf-link">The local guide</a></div>
      </div>
    </section>

{final_call('#book')}'''
    return 'index.html', head, gtm, body, '#book', True


def page_treehouses():
    head, gtm = head_from('treehouses.html', '<link rel="preload" as="image" type="image/webp" href="images/v2/eq3a0907-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="images/v2/treehouse-dusk-phone-900.webp" media="(max-width: 767px)" fetchpriority="high">')
    gallery = [('img_0823', 'The treehouse from its deck, the canvas peaks against the forest'),
               ('img_0831', 'The bed beneath the panoramic windows'),
               ('aerial-bridge', 'From above: the rope bridge at golden hour'),
               ('eq3a0160', 'The bridge to the treehouse in fall colour')]
    shots = ''.join(f'<figure class="lf-chapter">{pic(n, a, "(min-width: 900px) 25vw, 78vw")}</figure>' for n, a in gallery)
    body = f'''
    <!-- ========== HERO ========== -->
    <section class="lf-hero lf-hero--page" aria-label="The treehouse">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/treehouse-dusk-phone-900.webp" type="image/webp"><img src="images/v2/eq3a0907-1600.webp" width="1600" height="1067" alt="The treehouse at dusk, its canvas glowing, the rope bridge strung with lights" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">60 feet up · a 100-foot rope bridge</p>
        <h1 class="lf-h1">Not a cabin with a view. <em>A home in the sky.</em></h1>
        <p class="lf-lead">Hand-built, sixty feet up in a canopy that has been growing for over a hundred years.</p>
        <div class="lf-actions"><a href="#book" class="lf-btn">{ACORN}Book your dates</a></div>
      </div>
    </section>

    <!-- ========== THE ORIGINAL ========== -->
    <section class="lf-sec lf-light" aria-labelledby="or-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">The original</p>
        <h2 class="lf-h2 lf-rise" id="or-h">The treehouse that <em>started everything</em></h2>
        <p class="lf-lead lf-rise">A queen bed framed by panoramic windows that turn every morning into a painting you've never seen before. A private deck suspended above the forest floor. A pizza oven on your sky deck, because even pizza is better in the canopy. This is where 200+ five-star reviews began.</p>
        <ul class="lf-chips lf-rise">
          <li>Sleeps 4 comfortably</li><li>Queen bed</li><li>Full bathroom</li><li>60 feet up</li><li>Private deck</li><li>Heated</li><li>Fire pit</li>
        </ul>
        <div class="lf-chapters lf-gallery">{shots}</div>
      </div>
    </section>

    <!-- ========== THE LOXLEY DIFFERENCE ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="df-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">What makes it different</p>
        <h2 class="lf-h2 lf-rise" id="df-h" style="margin-bottom:56px">Built, not <em>bought</em></h2>
        <div class="lf-split lf-rise">
          <figure class="lf-photo">{pic('eq3a2149', 'The steel and wood frame beneath the treehouse, in fall colour', '(min-width: 900px) 50vw, 100vw')}</figure>
          <div>
            <h3 class="lf-h3">Built by the family that lives here</h3>
            <div class="lf-body" style="margin-top:14px">
              <p>The treehouse is a tetrahedron frame, steel sandwiched between wood, suspended from living oaks by specialized hardware. Canvas roofs instead of timber keep the load on the trees as light as possible. Every piece was carried down four hundred feet of mountain without a single machine touching the forest.</p>
              <p>It took nine months, three times longer than planned, because in a living forest the trees sway, the terrain fights you, and the forest has the final say.</p>
            </div>
          </div>
        </div>
        <div class="lf-split lf-split--flip lf-rise" style="margin-top:72px">
          <figure class="lf-photo">{pic('eq3a2062', 'Sun flaring through the canopy', '(min-width: 900px) 50vw, 100vw')}</figure>
          <div>
            <h3 class="lf-h3">Sixty feet changes everything</h3>
            <p class="lf-body" style="margin-top:14px">At ground level, a forest is beautiful. At sixty feet, it's transcendent. You're level with the hawks. Sound works differently up here: the wind moves through the leaves like a living thing, and the silence between gusts is the deepest quiet you've heard in years.</p>
          </div>
        </div>
        <div class="lf-split lf-rise" style="margin-top:72px">
          <figure class="lf-photo">{pic('eq3a0337', 'The start of the rope bridge in fall', '(min-width: 900px) 50vw, 100vw')}</figure>
          <div>
            <h3 class="lf-h3">The crossing</h3>
            <p class="lf-body" style="margin-top:14px">The hundred-foot rope bridge isn't a gimmick. It's a threshold. The moment you step onto it, you leave the ground behind. By the time you reach the other side, something in your chest has shifted.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== WHAT'S INCLUDED ========== -->
    <section class="lf-sec lf-light" aria-labelledby="inc-h">
      <div class="lf-wrap lf-split">
        <figure class="lf-photo lf-photo--tall lf-rise">{pic('img_0828', 'The bed beneath the treehouse windows in warm light', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">Your stay</p>
          <h2 class="lf-h2 lf-rise" id="inc-h">Everything you need. <em>Nothing you don't.</em></h2>
{INCLUDED}          <p class="lf-body lf-rise" style="margin-top:26px">What we don't include: televisions. What we do include: a pop-up projector on the sky deck for cinema night in the canopy. Most guests never open it. The stars are better.</p>
        </div>
      </div>
    </section>

    <!-- ========== YOUR DATES ========== -->
{BOOK}
{REVIEWS}
{treehouse_two()}
{final_call('#book')}'''
    return 'treehouses.html', head, gtm, body, '#book', True


def build(page):
    name, head, gtm, body, book, gatehouse = page()
    html = (head + '<body class="v2">\n' + gtm + '\n' + header(book) + '\n  <main id="main">\n' + body + '\n  </main>\n\n'
            + footer(book, gatehouse) + ('  <script src="js/crossing.js" defer></script>\n' if 'data-crossing' in body else '')
            + '</body>\n</html>\n')
    open(os.path.join(ROOT, name), 'w').write(html)
    print('wrote', name, len(html))


def page_modules():
    """Every module in scripts/site/pages/, in name order, each loaded once."""
    mods = []
    sys.modules.setdefault('build_v2', sys.modules[__name__])
    for path in sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'pages', '*.py'))):
        name = 'lfpage_' + os.path.basename(path)[:-3]
        spec = importlib.util.spec_from_file_location(name, path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        mods.append(mod)
    return mods


if __name__ == '__main__':
    mods = page_modules()
    css = '/* Built by scripts/site/build_v2.py from scripts/site/pages/*.py. Do not edit by hand. */\n'
    for m in mods:
        if getattr(m, 'CSS', '').strip():
            css += f'\n/* ---- {m.__name__[7:]} ---- */\n' + m.CSS.strip() + '\n'
    open(os.path.join(ROOT, 'css', 'v2-pages.css'), 'w').write(css)
    for p in [page_index, page_treehouses] + [fn for m in mods for fn in m.PAGES]:
        build(p)
