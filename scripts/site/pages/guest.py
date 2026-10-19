"""The guest's pages after booking, in the new design: /booked and /manage (both noindex).

/booked is where Stripe returns the guest: the welcome. js/gatehouse-stay.js fills in "You're
booked", the dates and times, the payments to the cent, what happens next and add to calendar.
The things a guest can ask for are the experiences page's own list (experiences.py ADDONS), by
name and words only: no prices on the site (Mick, 2026-10-19).

/manage is the guest's own page: what is paid and what will be charged, a move with the live
calendar and its price before anything changes, cancel and keep it as credit, pay the rest now.
"""
import os
import re

import build_v2 as B

HERE = os.path.dirname(os.path.abspath(__file__))


def _addons():
    """The add-ons, from the experiences page module, so the two lists never drift."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('lfpage_experiences_addons', os.path.join(HERE, 'experiences.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.ADDONS


ICONS = ('<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n'
         '    <link rel="icon" type="image/png" sizes="32x32" href="/images/brand/logo/kit/favicon-32.png">\n'
         '    <link rel="apple-touch-icon" href="/apple-touch-icon.png">')
FONTS_LINK = f'<link rel="stylesheet" href="{B.FONTS}">'


def head_for(page, title):
    """The page's own head (Tag Manager, noindex, canonical), brought to the new design's:
    its title, the fonts and the icons. Each step checks first, so a rebuild writes the same file."""
    head, gtm = B.head_from(page)
    head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head, count=1)
    if '/apple-touch-icon.png' not in head:
        head = head.replace('<link rel="icon" type="image/svg+xml" href="/favicon.svg">', ICONS, 1)
    if FONTS_LINK not in head:
        head = head.replace('  <link rel="stylesheet" href="css/global.css">', '  ' + FONTS_LINK + '\n  <link rel="stylesheet" href="css/global.css">', 1)
    head = re.sub(r'\s*</head>\n$', '\n</head>\n', head)
    return head, gtm


def top(h1):
    return f'''
    <section class="lf-sec lf-dark lf-stay-top" aria-labelledby="gh-title">
      <div class="lf-wrap">
        <p class="lf-eyebrow">Loxley Forest · Dahlonega, Georgia</p>
        <h1 class="lf-h1" id="gh-title">{h1}</h1>
      </div>
    </section>
'''


NOSCRIPT = ('<noscript><p class="gh-lead">This page needs JavaScript to show your stay. Your confirmation email has '
            'everything, or call or text <a href="tel:+17065024823">706-502-4823</a>.</p></noscript>')


def page_booked():
    head, gtm = head_for('booked.html', "You're booked | Loxley Forest")
    addons = ''.join(f'<li><b>{n}.</b> {d}</li>' for n, d in _addons())
    body = top('Confirming your booking') + f'''
    <section class="lf-sec lf-light lf-stay" aria-label="Your stay">
      <div class="lf-stay__in">
        <div id="gatehouse-stay" data-api="{B.API}" data-page="booked" aria-busy="true">
          <div class="gh-summary"><p class="gh-lead gh-pulse">Confirming your booking with the payment, a few seconds…</p></div>
          {NOSCRIPT}
        </div>
      </div>
    </section>

    <!-- ========== MAKE IT YOURS: the experiences page's add-ons, names only, no prices ========== -->
    <section class="lf-sec lf-parch" id="add" aria-labelledby="add-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow">Make it yours</p>
          <h2 class="lf-h2" id="add-h">Things you can <em>ask us for</em></h2>
          <p class="lf-lead">Reply to your confirmation email, or write to <a class="lf-stay__mail" href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a>, with any you would like, and we'll arrange them before you arrive.</p>
          <ul class="lf-acorns lf-addons">{addons}</ul>
        </div>
        <figure class="lf-photo lf-photo--tall">{B.pic('img_2546', 'A treehouse deck with chairs above the forest', '(min-width: 900px) 50vw, 100vw')}</figure>
      </div>
    </section>
'''
    return 'booked.html', head, gtm, body, '/book', 'stay'


def page_manage():
    head, gtm = head_for('manage.html', 'Your stay | Loxley Forest')
    # TODO(cutover, Architect): data-stripe-key takes the live publishable key (pk_live_...), as on /book.
    body = top('Your stay') + f'''
    <section class="lf-sec lf-light lf-stay" aria-label="Your stay">
      <div class="lf-stay__in">
        <div id="gatehouse-stay" data-api="{B.API}" data-unit="{B.UNIT}" data-stripe-key="" data-page="manage" aria-busy="true">
          <div class="gh-summary"><p class="gh-lead gh-pulse">Opening your stay…</p></div>
          {NOSCRIPT}
        </div>
      </div>
    </section>
'''
    return 'manage.html', head, gtm, body, '/book', 'stay'


PAGES = [page_booked, page_manage]

CSS = '''
.lf-stay-top { padding-top: calc(var(--hdr-h) + clamp(40px, 7vw, 80px)); padding-bottom: clamp(36px, 6vw, 64px); }
.lf-stay-top .lf-h1 { font-size: clamp(2.6rem, 9vw, 4.4rem); }
.lf-stay { padding-top: clamp(40px, 6vw, 72px); }
.lf-stay__in { max-width: 720px; margin: 0 auto; }
.lf-stay__mail { color: inherit; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
'''
