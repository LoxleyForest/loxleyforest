"""404: off the trail, and the ways back.

Netlify serves this page at whatever path was missed, so the parts this module writes use
root paths (/css, /images). The shared header and footer still use relative paths; on a missed
path one folder deep (/a/b) their logo and scripts miss. Reported to the Forge, not fixed here."""
import re

import build_v2 as B


def tidy(head):
    """head_from adds a blank line before </head> on every build when there is no preload;
    keep it at one so a rebuild writes the same file (reported to the Forge)."""
    return re.sub(r'\s*</head>\n$', '\n</head>\n', head)


def page_404():
    head, gtm = B.head_from('404.html')
    head = tidy(head.replace('href="css/', 'href="/css/'))
    photo = B.pic('eq3a0337', 'The start of the rope bridge in fall, the trail leading into the trees', '(min-width: 900px) 50vw, 100vw', eager=True)
    photo = photo.replace('src="images/', 'src="/images/').replace('srcset="images/', 'srcset="/images/').replace(', images/', ', /images/')
    body = f'''
    <section class="lf-sec lf-dark lf-off" aria-labelledby="off-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow">404 · Off the trail</p>
          <h1 class="lf-h1" id="off-h">You've wandered off the trail</h1>
          <p class="lf-lead">The forest has many paths, but this one doesn't lead anywhere. Let's get you back to the canopy.</p>
          <div class="lf-actions">
            <a href="/book" class="lf-btn">{B.ACORN}Book your dates</a>
            <a href="/" class="lf-link">Back to the forest</a>
          </div>
          <p class="lf-off__more"><a href="/treehouses">The treehouse</a><a href="/experiences">Experiences</a><a href="/faq">Questions</a></p>
        </div>
        <figure class="lf-photo">{photo}</figure>
      </div>
    </section>
'''
    return '404.html', head, gtm, body, '/book', False


PAGES = [page_404]

CSS = '''
.lf-off { min-height: 100svh; display: flex; align-items: center; padding-top: calc(var(--hdr-h) + clamp(40px, 7vw, 80px)); }
.lf-off > .lf-wrap { width: 100%; }
.lf-off .lf-h1 { font-size: clamp(2.6rem, 8vw, 4.6rem); }
.lf-off .lf-photo img { aspect-ratio: 3 / 2; object-fit: cover; }
.lf-off__more { display: flex; flex-wrap: wrap; gap: 6px 22px; margin: 26px 0 0; }
.lf-off__more a { display: inline-flex; align-items: center; min-height: 44px; color: var(--on-dark-muted); font-size: 1.15rem; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
.lf-off__more a:hover { color: var(--on-dark); }
'''
