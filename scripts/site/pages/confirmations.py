"""The two thank-you pages: /booking-confirmed (Hostfully's redirect after a booking) and
/success (where every Netlify form lands). Both keep their noindex from their own heads.
Warm and short: the message, Mick and Livy, a way home and a way to the treehouse."""
import re

import build_v2 as B


def tidy(head):
    """head_from adds a blank line before </head> on every build when there is no preload;
    keep it at one so a rebuild writes the same file (reported to the Forge)."""
    return re.sub(r'\s*</head>\n$', '\n</head>\n', head)


def note(eyebrow, h1, lead, words, photo):
    words = ''.join(f'\n          <p>{p}</p>' for p in words)
    body = f'''
          <div class="lf-body">{words}
          </div>''' if words else ''
    return f'''
    <section class="lf-sec lf-dark lf-note" aria-labelledby="nt-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow">{eyebrow}</p>
          <h1 class="lf-h1" id="nt-h">{h1}</h1>
          <p class="lf-lead">{lead}</p>{body}
          <p class="lf-note__sign">Mick &amp; Livy</p>
          <div class="lf-actions"><a href="/" class="lf-link">Return home</a><a href="/treehouses" class="lf-link">See the treehouse</a></div>
        </div>
        <figure class="lf-photo">{photo}</figure>
      </div>
    </section>
'''


def page_booking_confirmed():
    head, gtm = B.head_from('booking-confirmed.html')
    head = tidy(head)
    body = note('Booking confirmed', 'Your crossing is confirmed.', 'The forest is expecting you.', [
        'Your dates are held, and your confirmation is on its way to your inbox. Before you arrive, everything you need will reach you: the way in, the threshold, what to carry and what to leave behind.',
        "We created and crafted this treehouse, and the experience around it, with our own hands, over many years, for exactly the stillness you're about to step into. It's our family's craft; for your stay, it's your homecoming. See you at the threshold."],
        B.pic('booking-confirmed', 'The treehouse canvas glowing at dusk, the rope bridge lit beside it', '(min-width: 900px) 50vw, 100vw', eager=True))
    return 'booking-confirmed.html', head, gtm, body, '/book', False


def page_success():
    head, gtm = B.head_from('success.html')
    head = tidy(head)
    body = note('Received', "The forest knows you're coming.", "We'll be in touch soon.", [],
                B.pic('eq3a0907', 'The treehouse at dusk, its canvas glowing, the rope bridge strung with lights', '(min-width: 900px) 50vw, 100vw', eager=True))
    return 'success.html', head, gtm, body, '/book', False


PAGES = [page_booking_confirmed, page_success]

CSS = '''
.lf-note { min-height: 100svh; display: flex; align-items: center; padding-top: calc(var(--hdr-h) + clamp(40px, 7vw, 80px)); }
.lf-note > .lf-wrap { width: 100%; }
.lf-note .lf-h1 { font-size: clamp(2.6rem, 8vw, 4.6rem); }
.lf-note .lf-body { margin-top: 26px; }
.lf-note__sign { margin: 22px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.35rem; color: var(--on-dark); }
.lf-note .lf-photo img { aspect-ratio: 3 / 2; object-fit: cover; }
'''
