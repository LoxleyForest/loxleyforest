"""/reviews: guests' own words, behind the "More guest reviews" link under the carousel.

Mick's rulings, 2026-10-23: the carousel's 14 stay on the pages that carry it; the rest of the
five-star reviews are here; the four-star reviews stay off the site; no platform is named and no
count is shown. FTC 16 CFR 465.7(b): reviews are left out by rating, so nothing on this page may
say or imply it shows all of them. The heading is "Guest reviews", never "All reviews", no count.

The reviews come from scripts/site/reviews_data.py (written by make_reviews_data.py from
loxley-rescue docs/reviews/all.md, proven verbatim by check_reviews.py). Never edit a quote here.

The head is the terms page's (Tag Manager, icons, fonts, stylesheets), with this page's own
title, description, canonical and og: tags; indexed (no noindex), and listed in sitemap.xml.
"""
import importlib.util
import os
import re
from html import escape

import build_v2 as B

HERE = os.path.dirname(os.path.abspath(__file__))

TITLE = 'Guest reviews | Loxley Forest'
DESC = 'Guests of the treehouse at Loxley Forest, in their own words.'
URL = 'https://loxleyforest.com/reviews'


def _data():
    spec = importlib.util.spec_from_file_location('lf_reviews_data', os.path.join(HERE, '..', 'reviews_data.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.REVIEWS


def _sub(head, pattern, new):
    head, n = re.subn(pattern, lambda m: new, head, count=1)
    assert n == 1, pattern
    return head


def head():
    h, gtm = B.head_from('terms.html')
    h = _sub(h, r'<title>[^<]*</title>', f'<title>{TITLE}</title>')
    h = _sub(h, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DESC}">')
    h = _sub(h, r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{TITLE}">')
    h = _sub(h, r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{DESC}">')
    h = _sub(h, r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{URL}">')
    h = _sub(h, r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{URL}">')
    assert 'noindex' not in h
    # head_from leaves a blank line before </head> when there is no preload; keep it at one.
    return re.sub(r'\s*</head>\n$', '\n</head>\n', h), gtm


def card(text, credit, month):
    paras = ''.join(f'<p>{escape(p, quote=False)}</p>' for p in text.split('\n\n'))
    return (f'\n          <li><figure class="lf-gr__card"><blockquote class="lf-gr__quote">{paras}</blockquote>'
            f'<figcaption class="lf-gr__by">— {escape(credit, quote=False)} · {escape(month, quote=False)}</figcaption></figure></li>')


def page_reviews():
    h, gtm = head()
    cards = ''.join(card(t, c, m) for _, t, c, m in _data())
    body = f'''
    <section class="lf-sec lf-dark lf-gr-top" aria-labelledby="gr-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow">Guest stories</p>
        <h1 class="lf-h1" id="gr-h">Guest reviews</h1>
        <p class="lf-lead">In their own words.</p>
      </div>
    </section>

    <section class="lf-sec lf-parch lf-gr" aria-label="Guest reviews">
      <div class="lf-wrap">
        <ul class="lf-gr__list">{cards}
        </ul>
      </div>
    </section>

{B.final_call('/book')}'''
    return 'reviews.html', h, gtm, body, '/book', False


PAGES = [page_reviews]

CSS = '''
.lf-gr-top { padding-top: calc(var(--hdr-h) + clamp(44px, 8vw, 96px)); padding-bottom: clamp(48px, 7vw, 80px); }
.lf-gr-top .lf-wrap { max-width: 40rem; }
.lf-gr-top .lf-h1 { font-size: clamp(2.6rem, 8vw, 4.2rem); }
.lf-gr { padding-top: clamp(40px, 6vw, 72px); }
.lf-gr__list { list-style: none; margin: 0 auto; padding: 0; max-width: 40rem; display: grid; gap: clamp(16px, 3vw, 24px); }
.lf-gr__card {
  margin: 0; display: flex; flex-direction: column; gap: 22px;
  background: var(--cream); padding: clamp(26px, 6vw, 40px) clamp(22px, 5vw, 38px); box-shadow: 0 14px 40px rgba(26, 46, 26, 0.06);
}
.lf-gr__quote { margin: 0; }
.lf-gr__quote p {
  margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400;
  font-size: clamp(1.2rem, 4vw, 1.35rem); line-height: 1.5; color: var(--forest-deep); text-wrap: pretty; overflow-wrap: break-word;
}
.lf-gr__quote p + p { margin-top: 0.8em; }
.lf-gr__by { font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.16em; line-height: 1.7; text-transform: uppercase; color: var(--stone); border-top: 1px solid rgba(107, 99, 87, 0.22); padding-top: 16px; }
'''
