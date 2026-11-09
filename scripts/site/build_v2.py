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
import json
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
# The one way to reach /gift (the CEO's piece, 2026-10-26): beside "Questions", in the menu and the
# footer only, never the desktop header row (its six links are measured to fit). The words are the
# card's ratified title (scripts/site/pages/gift.py CARD); the link itself awaits Mick's yes.
GIFT_LINK = '<a href="/gift">The Golden Arrow</a>'
# "Give a Stay" (the Marketer's teardown and the Critic's site-audit sheet, 2026-11-08; the Chief's
# route, behind a switch until Mick's yes): the gift as the second item of the header row and the
# menu, a band on the home page after the reviews through December 24, and the words "gift card"
# where /gift explains it (pages/gift.py reads this switch). The band's line is the Marketer's, for
# Mick's ear. False: as it was, the one way to /gift beside "Questions". A build-time switch: one
# line, a rebuild, the checks, one commit.
GIVE_A_STAY = True
# the build's day, Eastern, for the band's end (never a date in copy: those come from the date file)
TODAY = __import__('datetime').datetime.now(__import__('zoneinfo').ZoneInfo('America/New_York')).date().isoformat()
GIVE_LINK = '<a href="/gift">Give a Stay</a>'
GIVE_BAND_UNTIL = '2026-12-24'
GIVE_BAND_LINE = 'They don’t need another thing. Give them a night in the trees.'


def nav_links(menu=False):
    """The header row's links (NAV, six, measured to fit from 1280 px: a seventh pushes the Book
    button off a 1280 screen, the Critic measured) and the menu's: NAV with "Give a Stay" second
    while the switch is on, when the menu's trailing "The Golden Arrow" goes, so /gift has one name
    there (the footer keeps it)."""
    links = [f'<a href="{h}">{t}</a>' for h, t in NAV]
    if GIVE_A_STAY and menu:
        links.insert(1, GIVE_LINK)
    return ''.join(links)


def menu_gift_link():
    return '' if GIVE_A_STAY else GIFT_LINK


def give_band():
    """The home page's band after the reviews, through December 24 (built only until then, and the
    page itself drops it after that day, Eastern, so a build left standing cannot keep it up)."""
    if not GIVE_A_STAY or TODAY > GIVE_BAND_UNTIL:
        return ''
    return f'''
    <!-- ========== GIVE A STAY: through December 24 (build_v2.GIVE_A_STAY) ========== -->
    <section class="lf-sec lf-dark lf-center lf-give" id="give-a-stay" aria-labelledby="gv-h" data-until="{GIVE_BAND_UNTIL}">
      <div class="lf-wrap">
        <p class="lf-eyebrow">Give a Stay</p>
        <h2 class="lf-h2" id="gv-h">{GIVE_BAND_LINE}</h2>
        <div class="lf-actions" style="justify-content:center"><a href="/gift" class="lf-btn">{ACORN}Give a Stay</a></div>
      </div>
    </section>
    <script>(function(){{var s=document.getElementById('give-a-stay');if(!s)return;var d=new Intl.DateTimeFormat('en-CA',{{timeZone:'America/New_York'}}).format(new Date());if(d>s.getAttribute('data-until'))s.remove();}})();</script>
'''
FONTS = ('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500'
         '&family=Montserrat:wght@300;400;500;600;700&display=swap')


def pic(name, alt, sizes, eager=False, cls='', frame=None):
    """A responsive <img> from images/v2/<name>-800.webp (and -1600 when it exists). On a phone
    (under 768 px) the 800 is the only source: a 3x phone would otherwise ask for the 1600 at
    100vw (the Chief's bandwidth route, 2026-11-07; a full scroll of the home page moved 4.2 MB on
    a phone, most of it 1600s). Where the page crops the photo into a tall frame (frame=(4, 5):
    .lf-photo--tall and .lf-chapter), an 800 across 390 px is only 1.25 photo pixels to a screen
    point, so the phone source is a centred 4:5 crop of the 1600 at 684x855 instead (the Critic,
    2026-11-07), made here once and kept beside the others."""
    big = f'images/v2/{name}-1600.webp'
    has_big = os.path.exists(os.path.join(ROOT, big))
    srcset = f'images/v2/{name}-800.webp 800w' + (f', {big} 1600w' if has_big else '')
    w, h = Image.open(os.path.join(ROOT, f'images/v2/{name}-800.webp')).size
    load = ' fetchpriority="high"' if eager else ' loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ''
    img = f'<img src="images/v2/{name}-800.webp" srcset="{srcset}" sizes="{sizes}" width="{w}" height="{h}" alt="{alt}"{load}{c}>'
    if not has_big:
        return img
    phone = framed(name, frame) if frame else f'images/v2/{name}-800.webp'
    return f'<picture><source media="(max-width: 767px)" srcset="{phone}" type="image/webp">{img}</picture>'


FRAMED = {(4, 5): (684, 855)}


def framed(name, frame):
    """images/v2/<name>-p<w>x<h>.webp: the 1600 cropped to the frame about its centre and sized for
    a phone, written when missing or older than the 1600. Quality 74, as scripts/site/v2img.py."""
    fw, fh = FRAMED[tuple(frame)]
    out = f'images/v2/{name}-p{fw}x{fh}.webp'
    src = os.path.join(ROOT, f'images/v2/{name}-1600.webp')
    dst = os.path.join(ROOT, out)
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        im = Image.open(src)
        W, H = im.size
        want = fw / fh
        if W / H > want:
            cw = int(round(H * want)); box = ((W - cw) // 2, 0, (W - cw) // 2 + cw, H)
        else:
            ch = int(round(W / want)); box = (0, (H - ch) // 2, W, (H - ch) // 2 + ch)
        im.crop(box).resize((fw, fh), Image.LANCZOS).save(dst, quality=74, method=6)
    return out


# Rating and count claims a page's own <head> still carried (the home page's meta description),
# taken out on every build: no rating and no count anywhere (Mick, 2026-10-20).
HEAD_CLAIMS = (' 200+ five-star reviews.',)


# Mick writes without em dashes: in the title, the meta description and the og: and twitter:
# tags of every page, " — " reads as a comma (the Forge, 2026-10-22). The body text is the
# page modules' own; the legal pages' wording is untouched.
HEAD_TAG = re.compile(r'<title>[^<]*</title>|<meta (?:name|property)="(?:description|og:[a-z:_]+|twitter:[a-z:_]+)"\s+content="[^"]*"')


def no_dashes(head):
    return HEAD_TAG.sub(lambda m: m.group(0).replace(' — ', ', '), head)


def head_from(page, preload=''):
    """The page's own <head>, with the redesign's stylesheets in place of its old ones."""
    s = open(os.path.join(ROOT, page)).read()
    head = s[:s.index('</head>')]
    for claim in HEAD_CLAIMS:
        head = head.replace(claim, '')
    head = no_dashes(head)
    head = re.sub(r'\s*<link rel="stylesheet" href="css/(?!global\.css)[a-z0-9-]+\.css">', '', head)
    head = re.sub(r'\s*<link rel="preload" as="image"[^>]*>', '', head)
    head = head.replace('<link rel="stylesheet" href="css/global.css">',
                        '<link rel="stylesheet" href="css/global.css">\n  <link rel="stylesheet" href="css/gatehouse.css">\n  <link rel="stylesheet" href="css/v2.css">\n  <link rel="stylesheet" href="css/v2-pages.css">')
    if preload:
        head = head.rstrip() + '\n  ' + preload
    gtm = s[s.index('<!-- Google Tag Manager (noscript) -->'):s.index('<!-- End Google Tag Manager (noscript) -->') + len('<!-- End Google Tag Manager (noscript) -->')]
    return head + '\n</head>\n', gtm


def header(book):
    links = nav_links()
    menu = nav_links(menu=True)
    return f'''  <a href="#main" class="skip-link">Skip to content</a>

  <header class="lf-hdr">
    <a href="/" class="lf-hdr__mark" aria-label="Loxley Forest, home"><img src="images/brand/logo/loxley-wordmark-on-dark.svg" alt="Loxley Forest" width="236" height="32"></a>
    <nav class="lf-hdr__nav" aria-label="Main">{links}</nav>
    <a href="{book}" class="lf-btn lf-hdr__book">Book your dates</a>
    <button class="lf-menu-btn" type="button" aria-expanded="false" aria-controls="lf-menu" aria-label="Open menu"><span></span></button>
  </header>
  <div class="lf-menu" id="lf-menu" aria-hidden="true">
    <nav aria-label="Menu">{menu}<a href="/faq">Questions</a>{menu_gift_link()}</nav>
    <a href="{book}" class="lf-btn">{ACORN}Book your dates</a>
    <p class="lf-menu__foot">Dahlonega, Georgia<br>Just over an hour from Atlanta</p>
  </div>
'''


def footer(book, gatehouse):
    """gatehouse: False, True (the booking calendar) or 'stay' (the calendar's helpers and the
    after-booking pages, /booked and /manage)."""
    links = ''.join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    gh = '\n  <script src="js/gatehouse.js" defer></script>' if gatehouse else ''
    if gatehouse == 'stay':
        gh += '\n  <script src="js/gatehouse-stay.js" defer></script>'
    return f'''  <footer class="lf-foot">
    <div class="lf-foot__grid">
      <div>
        <img src="images/brand/logo/loxley-wordmark-on-dark.svg" alt="Loxley Forest" width="220" height="30" loading="lazy">
        <p style="margin-top:18px;font-size:1.1rem">Dahlonega, Georgia. Just over an hour from Atlanta.<br>42 acres of hardwood cove forest at 1,470 feet.</p>
      </div>
      <nav aria-label="Footer">{links}<a href="/faq">Questions</a>{GIFT_LINK}</nav>
      <nav aria-label="Contact"><a href="https://instagram.com/loxleyforest" target="_blank" rel="noopener">Instagram</a><a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a><a href="tel:+17065024823">706-502-4823</a></nav>
      <div class="lf-foot__small"><span>&copy; 2026 Loxley Forest</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
    </div>
  </footer>

  <a href="{book}" class="book-fab">{ACORN}Book your dates</a>
  <script src="js/funnel.js"></script>
  <script src="js/vendor/lenis.min.js"></script>
  <script src="js/global.js"></script>
  <script src="js/v2.js"></script>
  <script src="js/reviews.js" defer></script>{gh}
'''


# Keys never reach the tag manager, analytics or a server log (the Architect, 2026-10-19). The
# manage key moves and cancels a stay, a credit key spends one, and a payment session opens the
# manage key; links this site makes carry them after # (never sent to a server). On /book, /booked
# and /manage this runs before Tag Manager: it reads token, credit, session_id and hold from the
# query or the fragment, keeps them for the page (window.__ghKeys; this tab's sessionStorage for a
# refresh or a back; a credit on /book for any visit in the session, so a guest who wanders off
# and comes back by any Book button keeps it), and takes them out of the address bar. Placed before the viewport meta, so
# scripts/ensure_gtm.py, which inserts a missing snippet after the viewport meta, still lands after it.
# A key arriving as a hash change on the same page (no new load) reloads the page, so it is lifted too.
# The referrer policy sends only the origin, even on our own requests, so a key in an older
# query-string link is not copied into a Referer while the page loads.
# The Golden Arrow (2026-10-25): a gift's code rides /book#gift= like a credit (kept for the session,
# so a guest who wanders off and comes back by any Book button keeps it), and the card page's own
# code, /gift/card#code=, and the payment session Stripe returns to /gift/thanks?session_id= are
# lifted the same way before Tag Manager can read the address, as is the buyer's change key
# (/gift/manage#token=). An elopement package offer's private link (2026-10-27) carries its key
# the same way, /elopement/offer#offer=, and Stripe returns the couple there with ?session_id=.
KEYS_PAGES = ('book.html', 'booked.html', 'manage.html', 'gift-card.html', 'gift-thanks.html', 'gift-manage.html',
              'elopement-offer.html')
KEYS_SCRIPT = r"""  <!-- Booking keys: out of the address bar before anything loads -->
  <meta name="referrer" content="strict-origin">
  <script>(function(){var N=['token','credit','session_id','hold','gift','code','offer'],k={},f=!1,st={},p=location.pathname.replace(/\.html$/,'').replace(/(.)\/$/,'$1');
  try{st=JSON.parse(sessionStorage.getItem('gh_keys')||'{}')||{}}catch(e){}
  var q=new URLSearchParams(location.search),hp=location.hash.indexOf('=')>0,h=new URLSearchParams(hp?location.hash.slice(1):'');
  N.forEach(function(n){var v=h.get(n)||q.get(n);if(q.has(n)||h.has(n)){f=!0;q.delete(n);h.delete(n)}if(v)k[n]=v});
  if(f){st[p]=k;try{sessionStorage.setItem('gh_keys',JSON.stringify(st))}catch(e){}
  var s=q.toString(),t=hp?h.toString():location.hash.slice(1);history.replaceState(history.state,'',location.pathname+(s?'?'+s:'')+(t?'#'+t:''))}
  else{var nv=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0])||{};if(nv.type==='reload'||nv.type==='back_forward')k=st[p]||{};else if(st[p]){if(st[p].credit)k.credit=st[p].credit;if(st[p].gift)k.gift=st[p].gift}}
  window.__ghKeys=k;addEventListener('hashchange',function(){if(/(^#|&)(token|credit|session_id|hold|gift|code|offer)=/.test(location.hash))location.reload()})})();</script>
  <!-- End booking keys -->
"""
KEYS_RE = re.compile(r'  <!-- Booking keys: out of the address bar before anything loads -->\n.*?<!-- End booking keys -->\n', re.S)


def set_keys(head):
    """The keys script, written fresh on every build, right after <meta charset>."""
    head = KEYS_RE.sub('', head)
    return head.replace('<meta charset="UTF-8">\n', '<meta charset="UTF-8">\n' + KEYS_SCRIPT, 1)


API = 'https://book.loxleyforest.com'
UNIT = 'loxley-forest-canopy-treehouse-dahlonega'
# The Stripe PUBLISHABLE key (pk_live_..., not a secret) for /book and /manage, the one place it
# is set. Empty until cutover: the checkout then runs to the agreement and says plainly that
# payment opens shortly. Set it here, run the builder, commit book.html and manage.html.
STRIPE_KEY = 'pk_live_51RH1eh1A4HPU5uCq4EyPTq3QCk4GI5skATfj7Vy9R1irx769gSJDEuVKYFIGHkJBATGJe8xW5qomi5wqeXRWR1lz00PvCZlnNi'
assert STRIPE_KEY == '' or STRIPE_KEY.startswith('pk_'), 'only a publishable key (pk_...) goes on a page'
PRECONNECT = f'<link rel="preconnect" href="{API}" crossorigin>'


def early_script(agreement):
    """The nights (and on /book the agreement) asked for from the head, before the stylesheets and
    scripts, so the answers are waiting when js/gatehouse.js boots (2026-11-08: on a throttled phone
    the calendar was live at 3.0 to 4.0 s, the fetch starting only after 1.3 s of scripts). The URLs
    are built exactly as gatehouse.js builds them (today in Eastern time, twelve months ahead), and
    gatehouse.api() takes each answer once by its URL; a failed early fetch is simply fetched again."""
    # A hold in the link (/book?hold=, window.__ghKeys from the keys script above) changes the
    # availability URL, so that call is left to gatehouse.js; the early fetch gives up after 8 s so a
    # stalled engine still reaches gatehouse.js's own timeout and its fallback form (the Critic).
    calls = ("if(!(window.__ghKeys||{}).hold)g('/v1/availability?unit='+encodeURIComponent(u)+'&from='+f+'&to='+t);"
             + ("g('/v1/agreement');" if agreement else ''))
    return ('  <script>(function(){try{var a=' + repr(API) + ',u=' + repr(UNIT) + ';'
            "var f=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());"
            "var p=f.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);d.setMonth(d.getMonth()+12);"
            "var m=d.getMonth()+1,y=d.getDate(),t=d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(y<10?'0':'')+y;"
            "var e=window.__ghEarly={};function g(path){var o={cache:'no-store'};if(window.AbortController){var c=new AbortController();o.signal=c.signal;setTimeout(function(){c.abort()},8000)}"
            "var p=fetch(a+path,o).then(function(r){return r.text().then(function(x){var j=null;try{j=JSON.parse(x)}catch(q){}if(!r.ok||!j||typeof j!=='object')throw new Error('early');return j})});p.catch(function(){});e[a+path]=p}"
            + calls + '}catch(q){}})();</script>')

# What the booking calendar shows until the open nights arrive: the shape of a month and a
# sentence, never a blank box (js/gatehouse.js replaces it). Without script, a way to book.
GH_WAIT = ('<div class="gh-wait" role="status"><div class="gh-wait__cal" aria-hidden="true">' + '<i></i>' * 35 + '</div>'
           '<p class="gh-wait__words">Opening the calendar: every open night and its price.</p></div>'
           '<noscript><p class="lf-book__alt">The calendar needs JavaScript to run. <a href="/book#inquiry">Send us your dates</a>, '
           'or call or text <a href="tel:+17065024823">706-502-4823</a>.</p></noscript>')

# The calendar on the home, treehouse and experiences pages: live nights and the all-in total,
# then "Book these nights" carries the dates to /book, where the checkout is.
BOOK = f'''    <section class="lf-sec lf-parch lf-book" id="book" aria-labelledby="book-h">
      <div class="lf-book__head">
        <p class="lf-eyebrow">Your dates</p>
        <h2 class="lf-h2" id="book-h">Pick your nights. <em>See the whole price at once.</em></h2>
        <p class="lf-lead" style="margin-left:auto;margin-right:auto">Every open night shows its rate. Choose your dates and the total appears, taxes and cleaning included. Book direct and deal with the family who built it.</p>
      </div>
      <div id="gatehouse"
           data-api="{API}"
           data-unit="{UNIT}"
           data-handoff="/book"
           data-fallback="#gh-fallback">{GH_WAIT}</div>
      <div id="gh-fallback" class="lf-book__alt" hidden>
        <p>Our booking calendar isn't answering just now. <a href="/book#inquiry">Send us your dates</a> and we'll write back within two hours, or call or text <a href="tel:+17065024823">706-502-4823</a>.</p>
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

# ------------------------------------------------- the reviews
# The reviews themselves, the number beside the acorns, and nothing said about them: no count,
# no stars, no platform, no "reviews" (Mick, 2026-10-20: "I don't like that we say anything about
# reviews. Just have the reviews there."; amended 2026-10-21: "the average shown as 4.9 with
# acorns shaded in, no words about it"). The schema and llms.txt carry no rating and no count
# (no aggregateRating): that is Mick's call, not the builder's.
#
# Every word below is a guest's own, verbatim, never written, trimmed or paraphrased here. All ten
# are the real reviews the site has carried since 2026-03-17 (commit d5ac59f put them in index.html
# in place of the first build's placeholder quotes; js/reviews.js held them from 2026-07-02,
# commit e61df3e, until this list replaced it). The copy deck ("Loxley Forest Website Copy V3
# FINAL.docx", Testimonials) names exactly these ten as the real ones. First names and towns only,
# as they have always appeared. Strongest and most specific first. To add one, add a line here
# with its source; nothing else to touch.
# The carousel: 14 guests' own words, chosen 2026-10-23 (the staff's grading, Mick's yes by ear).
# Copied character for character from loxley-rescue docs/reviews/all.md; " ... " marks a trim.
# scripts/site/check_reviews.py proves every one is verbatim. Never edit a quote by hand.
REVIEW_LIST = [
    ('You park your car and walk through the woods to your destination - an exquisite canopy treehouse nestled up in the trees and accessed by a swinging bridge. ... We highly recommend the breakfast experience cooked by Livy. It was amazing!',
     'Maynette'),  # G5
    ('I don’t think I can completely put into words exactly how much my wife and I enjoyed our stay here to celebrate our 10th anniversary. If you are looking for a calm, peaceful getaway, this is the place to go.',
     'Brandon · Atlanta, GA'),  # A41
    ("Livy's treats were wonderful and fresh. We had rain during our stay and we loved it. The wind, swaying of the tree house, and sound of drops on the canopy really added to the experience for us.",
     'Roger'),  # G3
    ('Super unique and adventurous getaway. ... Even though I’m scared of heights, the treehouse felt very safe and sturdy! The added touches like the movie screen, homemade pizza dough, and breakfast pastries were icing on the cake.',
     'Ty & Cortney · Cleveland, TN'),  # A92
    ('The evening calls of the coyotes and the owls ("Who, who, who cooks for you?") felt like enchanting goodnight wishes. ... Loxley Forest is one of those rare places that leaves you with memories rather than just photos, and we\'re very grateful for the experience.',
     'Cheryl'),  # G6
    ('My husband and I went with our doggie for our honeymoon, and we really had a magical experience. The harmony of the place made the experience unforgettable. The sounds of the river, the birds, and the psithurism was like being in paradise.',
     'Claudia · Marietta, GA'),  # A40
    ('This was easily one of our most memorable stays! This is a custom treehouse personally designed, built, and meticulously cared for by the hosts. Their experience add-ons were amazing--far exceeding expectations! Their food was incredible.',
     'James · Atlanta, GA'),  # A9
    ('From the moment we arrived, we loved the uniqueness of staying high up in the trees, surrounded by nature. ... The weather turned out to be much colder than expected; however, the owners were very responsive and made a world of difference!',
     'Kathryne'),  # G1
    ('My husband and I enjoyed a much-needed kid-free weekend, and even though it rained almost the entire time, it somehow made the experience even more perfect. ... One of our favorite memories was seeing the bridge lights glowing through the rain at night.',
     'Ashley · White, GA'),  # A3
    ('I wanted a quiet place to relax and enjoy the natural surroundings. It was a unique space in the treetops and the hosts made sure I got there safely and had everything I needed. The homemade pizza dough and pastries was a nice touch.',
     'Alora · Decatur, GA'),  # A31
    ('It’s beautiful. It’s adventurous. From the twisted tree trunk-lined path to the gorgeous treehouse, you felt like you’ve stepped into a place they write stories about. The bubbling creek below was the sound track to the laid back resting place.',
     'Amy · Sidney, OH'),  # A116
    ('The entire structure is more peaceful and beautiful in person than can be captured in photos. ... The bridge is so cool and whimsical. ... It was a great compromise between my husband wanting to camp and myself not wanting to LOL!',
     'Caela · Savannah, GA'),  # A55
    ("I wanted to take my boys (3 and 5) on a special camping (glamping) trip and this tree house did not disappoint. ... I can't recommend this stay enough, but if you talk yourself out of it, good. It leaves more room for our next camping trip.",
     'Warren'),  # A2
    ("The treehouse is absolutely unreal, but what makes this place truly special is the incredible family behind it. Rain or shine, cold or warm, it's the perfect escape. ... Do yourself a favor and book the stay. It's one you won't forget!",
     'Chris'),  # G2
]

# The one guest line under the Book button on /book's quote card (the CEO's quote-card piece,
# 2026-10-26: the 4.9 beside five acorns and one checked guest line beside Book). A sentence of
# one carousel quote above, word for word, credited as the carousel credits it; no count, no
# platform. scripts/site/check_reviews.py proves it against REVIEW_LIST and docs/reviews/all.md.
QUOTE_CARD = ('This was easily one of our most memorable stays!', 'James · Atlanta, GA')  # A9

# The average, as Mick gave it (2026-10-21), shown while the count line is off. With it on, the
# figure is computed from the review list's own star headings and rounded to one decimal, never
# typed (Mick's word by the Chief, 2026-11-08: 126 of 129 five stars average 4.98, which is 5.0).
# Shown as the number and five acorns shaded to it (RATING, set below the list's readers).
RATING_GIVEN = 4.9
# The count line under it, "129 reviews. 126 of them five stars." (the Marketer and the Critic's
# site-audit sheet, 2026-11-08; the Chief's route: behind a switch until Mick's yes). The numbers are
# never typed: they are read at build from the review list's own summary line in loxley-rescue
# docs/reviews/all.md ("129 reviews in all: 126 five stars, 3 four stars."), so a build on the day it
# ships carries that day's counts, and the build refuses to run with the switch on and no list to
# read. scripts/site/check_reviews.py proves the built line against the list.
REVIEW_COUNT = True
REVIEWS_ALL_MD = os.path.join(ROOT, '..', 'loxley-rescue', 'docs', 'reviews', 'all.md')


def review_counts(path=None):
    """(reviews, five_stars) from the review list's summary line, or None when it cannot be read."""
    try:
        text = open(path or REVIEWS_ALL_MD, encoding='utf-8').read()
    except OSError:
        return None
    m = re.search(r'^(\d+) reviews in all: (\d+) five stars', text, re.M)
    return (int(m.group(1)), int(m.group(2))) if m else None


def review_count_line():
    """The sentence, from the list; '' with the switch off. The build stops if the switch is on and
    the list cannot be read, so no stale or guessed number can ship."""
    if not REVIEW_COUNT:
        return ''
    counts = review_counts()
    if not counts:
        raise SystemExit('REVIEW_COUNT is on but the review list could not be read: ' + REVIEWS_ALL_MD)
    return f'{counts[0]} reviews. {counts[1]} of them five stars.'


def review_stars(path=None):
    """Every review's stars, read from the list's own headings ("### A1. ... · 5 stars ...")."""
    try:
        text = open(path or REVIEWS_ALL_MD, encoding='utf-8').read()
    except OSError:
        return []
    stars = []
    for h in re.findall(r'^### .*$', text, re.M):
        m = re.search(r'\b(\d) stars?\b', h)
        if m:
            stars.append(int(m.group(1)))
    return stars


def review_rating():
    """The average the page shows: computed from the list and rounded to one decimal while the count
    line is on (the two must agree), else the figure Mick gave."""
    if not REVIEW_COUNT:
        return RATING_GIVEN
    stars = review_stars()
    counts = review_counts()
    if not stars or not counts or len(stars) != counts[0]:
        raise SystemExit('REVIEW_COUNT is on but the review list\'s headings (%d) do not match its summary line (%s)' % (len(stars), counts and counts[0]))
    return round(sum(stars) / len(stars), 1)


RATING = review_rating()
# The acorn's body spans x 1.9 to 14.1 of its 16-wide box, so a part acorn is shaded across that
# span, not the box: 0.9 of an acorn is 80.5% of the box, not 90%.
ACORN_X0, ACORN_X1 = 1.9 / 16, 14.1 / 16


def _rating():
    cells = ''
    for i in range(5):
        part = max(0.0, min(1.0, RATING - i))
        fill = 0 if part == 0 else 100 if part == 1 else round((ACORN_X0 + part * (ACORN_X1 - ACORN_X0)) * 100, 1)
        cells += f'<i style="--f:{fill:g}%"></i>'
    line = review_count_line()
    count = f'<span class="lf-rating__count">{line}</span>' if line else ''
    label = f'Rated {RATING:.1f} out of 5' + (f'. {line}' if line else '')
    return (f'<p class="lf-rating" role="img" aria-label="{label}">'
            f'<span class="lf-rating__n" aria-hidden="true">{RATING:.1f}</span>'
            f'<span class="lf-rating__acorns" aria-hidden="true">{cells}</span>{count}</p>')


def quote_card():
    """/book's quote card, under the Book button: the rating as the reviews show it, and the one
    guest line (QUOTE_CARD). An inert <template>; js/gatehouse.js sets a copy under the button."""
    from html import escape
    line, by = QUOTE_CARD
    return (f'<template id="gh-proof"><div class="gh-proof">{_rating()}'
            f'<figure class="gh-proof__q"><blockquote><p>“{escape(line, quote=False)}”</p></blockquote>'
            f'<figcaption>{escape(by, quote=False)}</figcaption></figure></div></template>')


def _reviews():
    from html import escape
    n = len(REVIEW_LIST)
    cards = ''.join(
        f'\n            <figure class="lf-rv__card" role="group" aria-roledescription="review" aria-label="{i} of {n}">'
        f'<blockquote class="lf-rv__quote"><p>“{escape(q, quote=False)}”</p></blockquote>'
        f'<figcaption class="lf-rv__by">{escape(a, quote=False)}</figcaption></figure>'
        for i, (q, a) in enumerate(REVIEW_LIST, 1))
    chev = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
    # The controls come before the track in the page: above the cards on phones (clear of the fixed
    # Book button), moved below them from 768 px by CSS order.
    # Under it, a quiet link to the rest of the five-star reviews (/reviews, pages/reviews.py;
    # Mick, 2026-10-23). Its words say "more", never "all" (FTC 16 CFR 465.7(b)), and no count.
    return f'''    <section class="lf-sec lf-parch lf-reviews" aria-labelledby="rv-h">
      <div class="lf-wrap">
        <div class="lf-reviews__head">
          <p class="lf-eyebrow">Guest stories</p>
          <h2 class="lf-h2" id="rv-h">What they remember most</h2>
          {_rating()}
        </div>
        <div class="lf-rv" data-reviews role="region" aria-roledescription="carousel" aria-label="Guest stories">
          <div class="lf-rv__nav">
            <button type="button" class="lf-rv__btn lf-rv__btn--prev" data-rv-prev aria-controls="rv-track" aria-label="Previous story">{chev}</button>
            <p class="lf-rv__count" aria-hidden="true"><b data-rv-at>1</b> / {n}</p>
            <button type="button" class="lf-rv__btn" data-rv-next aria-controls="rv-track" aria-label="Next story">{chev}</button>
            <button type="button" class="lf-rv__btn lf-rv__pause" data-rv-pause aria-controls="rv-track" aria-label="Stop the stories turning"><span></span></button>
          </div>
          <div class="lf-rv__track" id="rv-track" tabindex="0" aria-label="Guest stories, {n} in all. Use the arrow keys or swipe for the next.">{cards}
          </div>
          <p class="lf-rv__live" data-rv-live aria-live="polite"></p>
        </div>
        <p class="lf-reviews__more"><a href="/reviews" class="lf-link">More guest reviews →</a></p>
      </div>
    </section>
'''


REVIEWS = _reviews()


# The ad click on every inquiry form (2026-11-02, loxley-rescue GATEHOUSE-SPEC 22): Google's click id
# (gclid, or gbraid/wbraid from an iPhone), the campaign words and the page the ad landed on, as
# js/global.js kept them from the visit's first ad click (90 days, the conversion window). global.js
# fills each field by its data-lf-attr; a visit that came from no ad sends them empty. Netlify keeps
# them with the inquiry, so a couple who books later can be traced to the ad that brought them.
# /book's form has its own (pages/book.py). check_forms.py fails a form without gclid.
ATTR_FIELDS = (
    '<input type="hidden" name="gclid" data-lf-attr="gclid">\n'
    '            <input type="hidden" name="gbraid" data-lf-attr="gbraid">\n'
    '            <input type="hidden" name="wbraid" data-lf-attr="wbraid">\n'
    '            <input type="hidden" name="utm_source" data-lf-attr="utm_source">\n'
    '            <input type="hidden" name="utm_campaign" data-lf-attr="utm_campaign">\n'
    '            <input type="hidden" name="landing_page" data-lf-attr="landing">')


def treehouse_two(photo=('img_2546', 'A treehouse deck with chairs above the forest')):
    """The second-treehouse block, on the home page and the treehouse page. photo: (name, alt) for
    its 4:5 frame; the home page keeps the house's own, the treehouse page passes its slot."""
    return f'''    <section class="lf-sec lf-dark" id="treehouse-two" aria-labelledby="t2-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow lf-rise">Coming soon</p>
          <h2 class="lf-h2 lf-rise" id="t2-h">Treehouse two is <em>almost here</em></h2>
          <p class="lf-lead lf-rise">Same hand-built craft. Same sixty-foot elevation. A different view of the same forest. The first nights go to the list.</p>
          <form class="lf-signup lf-rise" name="treehouse-2-list" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-lf-ajax action="/success.html">
            <input type="hidden" name="form-name" value="treehouse-2-list">
            {ATTR_FIELDS}
            <p hidden><label>Leave this empty <input name="bot-field"></label></p>
            <label for="t2-email">Your email</label>
            <input id="t2-email" type="email" name="email" required autocomplete="email" placeholder="you@example.com">
            <button class="lf-btn lf-btn--ghost" type="submit">Join the list</button>
            <p class="lf-signup__done" role="status" hidden>You're on the list. We'll write when the first nights open.</p>
          </form>
        </div>
        <figure class="lf-photo lf-photo--tall lf-rise">{pic(photo[0], photo[1], '(min-width: 900px) 50vw, 100vw', frame=(4, 5))}</figure>
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


# ------------------------------------------------- readable by AI assistants

# schema.org for the home page (the place) and the treehouse page (the stay itself). Facts only
# from the site and loxley-rescue canon/voice.md, "WHAT IS TRUE ABOUT THE PLACE", plus Mick's
# rulings of 2026-10-19 (dogs only, up to two, no fee; also in the FAQ). No prices (Mick's ruling: prices stay off the website; the live
# price is at /book and the booking API) and no street address (it goes to booked guests only).
# No aggregateRating: no rating and no count anywhere (Mick, 2026-10-20).
# TODO(Architect): sameAs holds only Instagram, the one profile the site links. Add the Airbnb
# listing and the Google Business Profile once their links are on the site.
SITE = 'https://loxleyforest.com'
ADDRESS = {'@type': 'PostalAddress', 'addressLocality': 'Dahlonega', 'addressRegion': 'GA', 'addressCountry': 'US'}
SAME_AS = ['https://instagram.com/loxleyforest']
# Links we hand out carry src, so the visit says where it came from (the page beacon in js/v2.js
# sends it; the booking engine classifies the referrer host when a link carries none):
#   the Instagram bio:            https://loxleyforest.com/?src=instagram
#   llms.txt's booking links:     https://loxleyforest.com/book?...&src=ai
DOGS = 'Up to two well-behaved dogs are welcome, with no fee. Dogs only.'
RESERVE = {'@type': 'ReserveAction',
           'target': {'@type': 'EntryPoint', 'urlTemplate': SITE + '/book?checkIn={checkIn}&checkOut={checkOut}',
                      'actionPlatform': ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform']},
           'result': {'@type': 'LodgingReservation', 'name': 'A stay in the treehouse at Loxley Forest'}}


def feature(name, value=True):
    return {'@type': 'LocationFeatureSpecification', 'name': name, 'value': value}


TREEHOUSE_FEATURES = [feature(n) for n in (
    'Sixty feet up in the forest canopy', 'A hundred-foot suspended rope bridge to the door',
    'A queen bed framed by panoramic windows', 'Full bathroom', 'A private deck above the forest floor',
    'A wood-fired pizza oven on the sky deck, with fresh dough', 'A fire pit on the forest floor',
    'Heated for the cold seasons', 'A kitchen', 'WiFi', 'A pop-up projector for cinema night',
    '42 acres of cove forest to explore', 'Children welcome', 'Dogs welcome, up to two')] + [feature('Television', False)]


def schema_home():
    return {
        '@context': 'https://schema.org', '@type': 'LodgingBusiness', '@id': SITE + '/#lodging',
        'name': 'Loxley Forest', 'url': SITE,
        'description': ('A hand-built luxury treehouse sixty feet up in the canopy of a North Georgia cove forest, reached by a '
                         'hundred-foot suspended rope bridge, on 42 acres at 1,470 feet in Dahlonega, Georgia, just over an hour '
                         'from Atlanta. One treehouse; it sleeps 4 comfortably and up to 6 guests. Children and up to two '
                         'well-behaved dogs are welcome. No smoking. A second treehouse is coming soon.'),
        'email': 'stay@loxleyforest.com', 'telephone': '+1-706-502-4823',
        'image': [SITE + '/images/EQ3A0906.webp'],
        'address': ADDRESS, 'checkinTime': '15:00', 'checkoutTime': '11:00',
        'petsAllowed': DOGS, 'smokingAllowed': False,
        'amenityFeature': TREEHOUSE_FEATURES,
        'sameAs': SAME_AS,
        'containsPlace': {'@id': SITE + '/treehouses#treehouse'},
        'potentialAction': RESERVE,
    }


def schema_treehouse():
    return {
        '@context': 'https://schema.org', '@type': 'Accommodation', '@id': SITE + '/treehouses#treehouse',
        'name': 'The treehouse at Loxley Forest', 'url': SITE + '/treehouses',
        'description': ('A hand-built treehouse with a canvas peak, sixty feet up in living oaks, reached by a hundred-foot '
                        'suspended rope bridge strung with small warm lights. A queen bed framed by panoramic windows, a full '
                        'bathroom, a private deck and a wood-fired pizza oven on the sky deck. Sleeps 4 comfortably, up to 6 '
                        'guests in all. Children and up to two well-behaved dogs are welcome. No smoking. Check-in from 3:00 PM, '
                        'check-out by 11:00 AM.'),
        'image': [SITE + '/images/v2/' + n + '.webp' for n in TREEHOUSE_PHOTOS[RA_PHOTOS]['schema']],
        'address': ADDRESS,
        'occupancy': {'@type': 'QuantitativeValue', 'minValue': 1, 'maxValue': 6, 'unitText': 'guests'},
        'bed': {'@type': 'BedDetails', 'numberOfBeds': 1, 'typeOfBed': 'Queen'},
        'numberOfFullBathrooms': 1,
        'petsAllowed': DOGS, 'smokingAllowed': False,
        'amenityFeature': TREEHOUSE_FEATURES,
        'containedInPlace': {'@type': 'LodgingBusiness', '@id': SITE + '/#lodging', 'name': 'Loxley Forest', 'url': SITE,
                             'address': ADDRESS, 'checkinTime': '15:00', 'checkoutTime': '11:00',
                             'telephone': '+1-706-502-4823', 'sameAs': SAME_AS},
        'potentialAction': RESERVE,
    }


def set_schema(head, data):
    """The page's schema.org block, written from data on every build (replaced in place, or
    placed before the preloads so a rebuild writes the same file)."""
    body = json.dumps(data, indent=2, ensure_ascii=False).replace('</', '<\\/')
    block = '<!-- Schema: ' + data['@type'] + ' -->\n  <script type="application/ld+json">\n' + body + '\n  </script>'
    pat = re.compile(r'<!-- Schema: [A-Za-z]+ -->\s*<script type="application/ld\+json">.*?</script>', re.S)
    if pat.search(head):
        return pat.sub(lambda m: block, head, count=1)
    at = head.find('<link rel="preload"')
    at = at if at >= 0 else head.rindex('</head>')
    return head[:at] + block + '\n  ' + head[at:]


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
          data-desk="images/hero/hero-desk.mp4" data-phone="images/hero/hero-phone.mp4"></video>
      </div>
      <div class="lf-hero__shade"></div>
      <button class="lf-hero__pause" type="button" aria-label="Pause the video" hidden><span></span></button>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Dahlonega, Georgia · 1,470 feet</p>
        <h1 class="lf-h1">Sleep where the forest <em>holds you</em></h1>
        <p class="lf-lead">A hand-built treehouse sixty feet up in the canopy, reached by a hundred-foot rope bridge. Just over an hour from Atlanta.</p>
        <div class="lf-actions">
          <a href="/book" class="lf-btn">{ACORN}Book your dates</a>
          <a href="/treehouses" class="lf-link">See the treehouse</a>
        </div>
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
{REVIEWS}{give_band()}
    <!-- ========== WHAT'S INCLUDED ========== -->
    <section class="lf-sec lf-light" aria-labelledby="inc-h">
      <div class="lf-wrap lf-split">
        <figure class="lf-photo lf-photo--tall lf-rise">{pic('img_0831', 'The bed beneath the treehouse windows', '(min-width: 900px) 50vw, 100vw', frame=(4, 5))}</figure>
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
          <figure class="lf-chapter lf-rise">{pic('eq3a0943', 'The rope bridge at night, strung with warm lights', '(min-width: 900px) 25vw, 78vw', frame=(4, 5))}<figcaption><span class="lf-chapter__n">Chapter one</span><h3 class="lf-h3">The Crossing</h3><p>Your first steps across the rope bridge.</p></figcaption></figure>
          <figure class="lf-chapter lf-rise">{pic('img_0828', 'The bed beneath the treehouse windows in warm light', '(min-width: 900px) 25vw, 78vw', frame=(4, 5))}<figcaption><span class="lf-chapter__n">Chapter two</span><h3 class="lf-h3">First Light</h3><p>Dawn breaking through the canopy, from your pillow.</p></figcaption></figure>
          <figure class="lf-chapter lf-rise">{pic('eq3a0222', 'The pizza oven on the sky deck', '(min-width: 900px) 25vw, 78vw', frame=(4, 5))}<figcaption><span class="lf-chapter__n">Chapter three</span><h3 class="lf-h3">Fire &amp; Flour</h3><p>Pizza you made yourself on the sky deck.</p></figcaption></figure>
          <figure class="lf-chapter lf-rise">{pic('eq3a0907', 'The treehouse canvas glowing at dusk with string lights', '(min-width: 900px) 25vw, 78vw', frame=(4, 5))}<figcaption><span class="lf-chapter__n">Chapter four</span><h3 class="lf-h3">After Dark</h3><p>The stars you forgot existed, framed by the canopy.</p></figcaption></figure>
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
        <figure class="lf-photo lf-photo--tall lf-rise">{pic('eq3a0160', 'The rope bridge to the treehouse in fall colour', '(min-width: 900px) 50vw, 100vw', frame=(4, 5))}</figure>
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

{final_call('/book')}'''
    return 'index.html', set_schema(head, schema_home()), gtm, body, '/book', True


# The interior film beside "The original" (Mick approved the cut by voice, 2026-10-28). Real
# footage only: ~/footage-in/cuts/interior-rough.mp4 (make_cuts.py, the Canon 4K clips) encoded by
# make_web.sh beside it, no frame made up. The hero's pattern: the still shows first and stays on
# reduced motion, Save-Data, a slow connection or no script; the clip has no source until js/v2.js
# gives it one near the screen, and it plays only while on screen.
INTERIOR = '''          <figure class="lf-loop lf-rise">
            <img src="images/interior/interior-poster.jpg" width="720" height="1280" alt="Inside the treehouse by day: the ring chandelier under the canvas peak, triangle windows onto the forest, the queen bed below" loading="lazy" decoding="async">
            <video class="lf-loop__video" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-ready poster="images/interior/interior-poster.jpg"
              data-desk="images/interior/interior-desk.mp4" data-desk-webm="images/interior/interior-desk.webm" data-phone="images/interior/interior-phone.mp4"></video>
            <button class="lf-loop__pause" type="button" aria-label="Pause the video" hidden><span></span></button>
          </figure>'''


# Romantic Atlanta's July 8, 2026 shoot on the treehouse page (Mick, 2026-11-08, by the Chief: "we
# own the rights. Use anything in romantic Atlanta file ... Even the photos for the treehouse page
# pull from theirs"), in shadow. RA_PHOTOS False: the page as it was, the house's own photographs.
# True: the hero and every photograph on /treehouses from the shoot, images/v2/ra-*, made by
# scripts/site/v2img.py from the stills on the workshop (/home/mick/footage-in/drive/Pictures /,
# the frame named beside each slot), no face in any of them, the alt text in the house's words; the
# home page does not change (treehouse_two() keeps its own photograph there). Flipping it: this
# line, python3 scripts/site/build_v2.py, scripts/site/check_ra_photos.py, one commit, on Mick's
# yes to the before/after sheet (docs/briefs/2026-11-08-treehouses-ra-photos/).
RA_PHOTOS = True

TREEHOUSE_PHOTOS = {
    False: {
        'hero_desk': 'eq3a0907-1600', 'hero_phone': 'treehouse-dusk-phone-900',
        'hero_alt': 'The treehouse at dusk, its canvas glowing, the rope bridge strung with lights',
        'gallery': [('img_0823', 'The treehouse from its deck, the canvas peaks against the forest'),
                    ('img_0831', 'The bed beneath the panoramic windows'),
                    ('aerial-bridge', 'From above: the rope bridge at golden hour'),
                    ('eq3a0160', 'The bridge to the treehouse in fall colour')],
        'built': ('eq3a2149', 'The steel and wood frame beneath the treehouse, in fall colour'),
        'sixty': ('eq3a2062', 'Sun flaring through the canopy'),
        'crossing': ('eq3a0337', 'The start of the rope bridge in fall'),
        'stay': ('img_0828', 'The bed beneath the treehouse windows in warm light'),
        'two': ('img_2546', 'A treehouse deck with chairs above the forest'),
        'schema': ['eq3a0907-1600', 'img_0831-800', 'aerial-bridge-1600'],
        'share': 'images/EQ3A0906.webp',  # the share card (og:image) as the page has had it
    },
    True: {
        # the hero: the bridge at dusk, straight on, the canvas glowing at its end (4W6A8086); the phone
        # file is an upright 2:3 crop of the same frame about that glow, so one alt is true on both
        # (the Critic, 2026-11-08: the upright sibling 4W6A8074 had no treehouse in it)
        'hero_desk': 'ra-bridge-dusk-1600', 'hero_phone': 'ra-bridge-dusk-phone-900',
        'hero_alt': 'The rope bridge at dusk, strung with lights, the treehouse canvas glowing at its end',
        # the room (4W6A7946-HDR), the deck (4W6A7888), the canopy (5P3A1483), the bridge by day (4W6A8022-HDR, cut 3:4)
        'gallery': [('ra-room-wide', 'The queen bed under the ring chandelier, triangle windows onto the forest'),
                    ('ra-deck', 'Two chairs on the sky deck, the canvas sweeping up beside them'),
                    ('ra-canopy-sun', 'Sun through the summer canopy, the deck below'),
                    ('ra-bridge-green', 'The rope bridge by day, straight on through the green')],
        # the structure where the bridge meets the deck (4W6A8004-HDR); the drone at dusk (dji 0029);
        # the bridge at dusk from the deck's side (4W6A8101): three different views, not one drone shape
        'built': ('ra-bridge-end', 'Where the rope bridge meets the deck: the oak through the floor, the beam, the canvas peak'),
        'sixty': ('ra-aerial-dusk', 'The canvas glowing at dusk, level with the treetops'),
        'crossing': ('ra-bridge-dusk-side', 'The rope bridge at dusk from the deck, its lights running out to the treehouse'),
        # the room upright (4W6A7968-HDR); the deck at dusk, upright (4W6A8084)
        'stay': ('ra-room', 'The queen bed under the canvas peak, the ring chandelier above'),
        'two': ('ra-deck-dusk', 'The canvas glowing at dusk, a chair on the sky deck'),
        'schema': ['ra-bridge-dusk-1600', 'ra-room-wide-800', 'ra-aerial-dusk-1600'],
        'share': 'images/v2/ra-bridge-dusk-1600.webp',  # the share card follows the hero (og:image, its width and height)
    },
}


def page_treehouses():
    P = TREEHOUSE_PHOTOS[RA_PHOTOS]
    hero_desk, hero_phone = f'images/v2/{P["hero_desk"]}.webp', f'images/v2/{P["hero_phone"]}.webp'
    hw, hh = Image.open(os.path.join(ROOT, hero_desk)).size
    head, gtm = head_from('treehouses.html', f'<link rel="preload" as="image" type="image/webp" href="{hero_desk}" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="{hero_phone}" media="(max-width: 767px)" fetchpriority="high">')
    # The share card is written from the table in both states (the head comes from the file on disk,
    # so a build in one state must not leave its picture for the other).
    sw, sh = Image.open(os.path.join(ROOT, P['share'])).size
    head = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{SITE}/{P["share"]}">', head, count=1)
    head = re.sub(r'<meta property="og:image:width" content="\d+">', f'<meta property="og:image:width" content="{sw}">', head, count=1)
    head = re.sub(r'<meta property="og:image:height" content="\d+">', f'<meta property="og:image:height" content="{sh}">', head, count=1)
    shots = ''.join(f'<figure class="lf-chapter">{pic(n, a, "(min-width: 900px) 25vw, 78vw")}</figure>' for n, a in P['gallery'])
    body = f'''
    <!-- ========== HERO ========== -->
    <section class="lf-hero lf-hero--page" aria-label="The treehouse">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="{hero_phone}" type="image/webp"><img src="{hero_desk}" width="{hw}" height="{hh}" alt="{P['hero_alt']}" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">60 feet up · a 100-foot rope bridge</p>
        <h1 class="lf-h1">Not a cabin with a view. <em>A home in the sky.</em></h1>
        <p class="lf-lead">Hand-built, sixty feet up in a canopy that has been growing for over a hundred years.</p>
        <div class="lf-actions"><a href="/book" class="lf-btn">{ACORN}Book your dates</a></div>
      </div>
    </section>

    <!-- ========== THE ORIGINAL ========== -->
    <section class="lf-sec lf-light" aria-labelledby="or-h">
      <div class="lf-wrap">
        <div class="lf-or">
          <div>
            <p class="lf-eyebrow lf-rise">The original</p>
            <h2 class="lf-h2 lf-rise" id="or-h">The treehouse that <em>started everything</em></h2>
            <p class="lf-lead lf-rise">A queen bed framed by panoramic windows that turn every morning into a painting you've never seen before. A private deck suspended above the forest floor. A pizza oven on your sky deck, because even pizza is better in the canopy.</p>
            <ul class="lf-chips lf-rise">
              <li>Sleeps 4 comfortably</li><li>Queen bed</li><li>Full bathroom</li><li>60 feet up</li><li>Private deck</li><li>Heated</li><li>Fire pit</li>
            </ul>
          </div>
{INTERIOR}
        </div>
        <div class="lf-chapters lf-gallery">{shots}</div>
      </div>
    </section>

    <!-- ========== THE LOXLEY DIFFERENCE ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="df-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">What makes it different</p>
        <h2 class="lf-h2 lf-rise" id="df-h" style="margin-bottom:56px">Built, not <em>bought</em></h2>
        <div class="lf-split lf-rise">
          <figure class="lf-photo">{pic(*P['built'], '(min-width: 900px) 50vw, 100vw')}</figure>
          <div>
            <h3 class="lf-h3">Built by the family that lives here</h3>
            <div class="lf-body" style="margin-top:14px">
              <p>The treehouse is a tetrahedron frame, steel sandwiched between wood, suspended from living oaks by specialized hardware. Canvas roofs instead of timber keep the load on the trees as light as possible. Every piece was carried down four hundred feet of mountain without a single machine touching the forest.</p>
              <p>It took nine months, three times longer than planned, because in a living forest the trees sway, the terrain fights you, and the forest has the final say.</p>
            </div>
          </div>
        </div>
        <div class="lf-split lf-split--flip lf-rise" style="margin-top:72px">
          <figure class="lf-photo">{pic(*P['sixty'], '(min-width: 900px) 50vw, 100vw')}</figure>
          <div>
            <h3 class="lf-h3">Sixty feet changes everything</h3>
            <p class="lf-body" style="margin-top:14px">At ground level, a forest is beautiful. At sixty feet, it's transcendent. You're level with the hawks. Sound works differently up here: the wind moves through the leaves like a living thing, and the silence between gusts is the deepest quiet you've heard in years.</p>
          </div>
        </div>
        <div class="lf-split lf-rise" style="margin-top:72px">
          <figure class="lf-photo">{pic(*P['crossing'], '(min-width: 900px) 50vw, 100vw')}</figure>
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
        <figure class="lf-photo lf-photo--tall lf-rise">{pic(*P['stay'], '(min-width: 900px) 50vw, 100vw', frame=(4, 5))}</figure>
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
{treehouse_two(P['two'])}
{final_call('/book')}'''
    return 'treehouses.html', set_schema(head, schema_treehouse()), gtm, body, '/book', True


def page_path(name):
    """The page's clean path ('index.html' is '/', 'treehouses.html' is '/treehouses'). The page
    beacon (js/v2.js) sends this, never the address bar, so no query or fragment can ride it."""
    return '/' if name == 'index.html' else PATHS.get(name) or '/' + name[:-len('.html')]


# Pages served at a path other than their file's (a rewrite in netlify.toml).
PATHS = {'gift-card.html': '/gift/card', 'gift-thanks.html': '/gift/thanks', 'gift-manage.html': '/gift/manage',
         'elopement-offer.html': '/elopement/offer'}


# The talk-to-Mick card (js/talk.js, styles at the end of css/v2.css): offered to a visitor who is
# hesitating, so Mick can close by phone (Mick, 2026-10-23). Only these pages load it; the script
# also refuses /booked and /manage on its own. proposals.html picks it up when its page lands.
TALK_PAGES = ('book.html', 'elopements.html', 'proposals.html')

# The Golden Arrow's pages (scripts/site/pages/gift.py): the purchase panel and the card.
GIFT_PAGES = ('gift.html', 'gift-card.html', 'gift-thanks.html', 'gift-manage.html')

# An elopement package offer's private page (scripts/site/pages/offer.py, 2026-10-27).
OFFER_PAGES = ('elopement-offer.html',)

# The January giveaway's invitation (js/giveaway-popup.js, the table of 2026-11-07): the pages the
# card may show on, never a talk.js page, a form page or /giveaway itself; plus /book, where the
# script only reveals the quiet line under the hero, and /giveaway-entered, where it only remembers
# the entry. The script's words come from pages/giveaway.py WORDS, written into the page as JSON.
POPUP_PAGES = ('index.html', 'treehouses.html', 'experiences.html', 'gallery.html', 'our-story.html',
               'local-guide.html', 'faq.html')
POPUP_SCRIPT_PAGES = POPUP_PAGES + ('book.html', 'giveaway-entered.html')


def popup_block(name):
    if name not in POPUP_SCRIPT_PAGES:
        return ''
    mod = sys.modules.get('lfpage_giveaway')
    words = mod.popup_words_block() if mod and hasattr(mod, 'popup_words_block') else ''
    return words + '  <script src="js/giveaway-popup.js" defer></script>\n'


def render(page):
    """The page's whole file, (name, html). build() writes it; scripts/site/check_pseo.py
    compares it with the file on disk."""
    name, head, gtm, body, book, gatehouse = page()
    if name in KEYS_PAGES:
        head = set_keys(head)
    if gatehouse and PRECONNECT not in head:
        head = head.replace('<link rel="preconnect" href="https://fonts.googleapis.com">',
                            PRECONNECT + '\n  <link rel="preconnect" href="https://fonts.googleapis.com">', 1)
    # The early fetch, right after the preconnect and before the stylesheets, on the pages that mount
    # the calendar and read the nights on load (never the gift, booked, manage or offer pages, which
    # do not); written fresh on every build (the head comes from the file on disk, so an older copy
    # is taken out first).
    head = re.sub(r'\n  <script>\(function\(\)\{try\{var a=[^\n]*window\.__ghEarly[^\n]*</script>', '', head, count=1)
    if gatehouse and 'id="gatehouse"' in body:
        head = head.replace(PRECONNECT, PRECONNECT + '\n' + early_script(name == 'book.html'), 1)
    html = (head + f'<body class="v2" data-lf-path="{page_path(name)}" data-lf-api="{API}">\n' + gtm + '\n' + header(book) + '\n  <main id="main">\n' + body + '\n  </main>\n\n'
            + footer(book, gatehouse) + ('  <script src="js/crossing.js" defer></script>\n' if 'data-crossing' in body else '')
            + ('  <script src="js/talk.js" defer></script>\n' if name in TALK_PAGES else '')
            + ('  <script src="js/gift.js" defer></script>\n' if name in GIFT_PAGES else '')
            + ('  <script src="js/offer.js" defer></script>\n' if name in OFFER_PAGES else '')
            + popup_block(name)
            + '</body>\n</html>\n')
    if name in ROOTED_PAGES:
        html = rooted(html)
    return name, html


def build(page):
    name, html = render(page)
    open(os.path.join(ROOT, name), 'w').write(html)
    print('wrote', name, len(html))


# Netlify serves 404.html at whatever path was missed, so a miss one folder deep (/a/b) would
# resolve the shared header's and footer's relative paths (images/, css/, js/) under /a/ and
# lose the logo and every script. These pages get root paths throughout.
# The gift's card, thank-you and change page are served at /gift/card, /gift/thanks and
# /gift/manage (netlify.toml), one folder deep, so they are rooted too.
ROOTED_PAGES = ('404.html', 'gift-card.html', 'gift-thanks.html', 'gift-manage.html', 'elopement-offer.html')


def rooted(html):
    html = re.sub(r'((?:src|href|poster)=")(?=(?:images|css|js)/)', r'\1/', html)
    return re.sub(r'srcset="[^"]*"', lambda m: re.sub(r'(srcset="|,\s*)(?=(?:images|css|js)/)', r'\1/', m.group(0)), html)


def page_modules():
    """Every module in scripts/site/pages/, in name order, each loaded once."""
    mods = []
    sys.modules.setdefault('build_v2', sys.modules[__name__])
    for path in sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'pages', '*.py'))):
        name = 'lfpage_' + os.path.basename(path)[:-3]
        spec = importlib.util.spec_from_file_location(name, path)
        mod = importlib.util.module_from_spec(spec)
        # Registered, so a page may use an earlier module's parts (pages/offer.py: /book's hero).
        sys.modules[name] = mod
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
    # A module's steps after every page is written (pages/pseo.py: the search landing pages'
    # entries in sitemap.xml, and the removal of a landing page its data no longer lists).
    for m in mods:
        for fn in getattr(m, 'AFTER', ()):
            fn()
