"""/gift and /gift/card: The Golden Arrow, the house's gift of three nights and the Dawn Table.

Ruled by Mick 2026-10-25 (loxley-rescue docs/lantern-log.md, "The Golden Arrow" and "The Golden
Arrow never expires"). The card is loxley-rescue docs/gift-card/golden-arrow/card.html, its
digital face (#digital) drawn here in units of its own width, so it is the same card on a phone,
on a desk and on paper.

/gift        what it is, the window and the never-expires line, how the couple picks dates, and
             the purchase panel (js/gift.js): their names, the giver's, the buyer's email and an
             optional address for the printed card. The amount appears only in the purchase
             step, from the engine, right before Stripe; never in the page's prose (no prices on
             the site, Mick 2026-10-19). While the engine's gift route answers 404, the panel
             says plainly to call or text Mick.
/gift/card   the card from GET /v1/gift (names filled), printable from the browser, a link to
             send. The code rides after # and the keys script in the head (build_v2.KEYS_SCRIPT)
             lifts it out of the address bar before Tag Manager loads; it goes to our own booking
             server and nowhere else. Served at /gift/card by a rewrite in netlify.toml; the file
             is gift-card.html so scripts/ensure_gtm.py and the other root checks see it. Noindex.

Not linked from the menu or any page until Mick says so. Not in sitemap.xml.

Every sentence on both pages, and the Golden Arrow's lines on /book, lives in WORDS below and
only there. js/gift.js and js/gatehouse.js read their part from a JSON block the builder writes
into each page (id lf-gift-words).
"""
import json
import re
from html import escape

import build_v2 as B

PHONE = '706-502-4823'

# ---------------------------------------------------------------------------------------------
# THE CARD'S OWN WORDS · RATIFIED (Mick, 2026-10-25, read to him by phone; the never-expires
# line ~02:20 ET). Copied from loxley-rescue docs/gift-card/golden-arrow/card.html. Never edit
# here without the card.
# ---------------------------------------------------------------------------------------------
CARD = {
    'title': 'The Golden Arrow',
    'subtitle': 'A gift of three nights in the trees',
    'for': 'For',
    'from': 'With love from',
    'giftno': 'Gift no.',
    'gift': 'Three nights in the treehouse, and the Dawn Table: Livy’s breakfast, carried across the bridge to your door.',
    'nights': ('Good for any three nights, weekends included, January 4 to May 31, 2027, Valentine’s weekend aside. '
               'It never expires; for later dates, we ask only the difference if rates have risen.'),
    'call': 'To choose your dates, call or text Mick at',
    'foot': 'loxleyforest.com · Dahlonega, Georgia',
}

# =============================================================================================
# WORDS · AWAITING MICK
# Drafted 2026-10-25 by the Foreman from canon/voice.md and the card's ratified words. None is
# ratified yet. No price in any of them. Facts used: the treehouse (canvas peak, sixty feet up,
# the hundred-foot bridge with small warm lights, Dahlonega), the Dawn Table (Livy makes it,
# Mick carries it across the bridge), the card's own terms and phone line. Lines marked ENGINE
# are true only once the engine's gift routes are switched on.
# =============================================================================================
WORDS = {
    # ---- /gift: the page -------------------------------------------------------------------
    'title': 'The Golden Arrow | Loxley Forest',
    'description': 'A gift of three nights in the treehouse at Loxley Forest, and the Dawn Table.',
    'eyebrow': 'A gift from Loxley Forest',
    'lead': 'Three nights in the treehouse, and the Dawn Table: Livy’s breakfast, carried across the bridge to their door.',
    'to_give': 'Give it',
    'sample_names': 'Sarah & Tom',          # the sample card's names, plainly an example
    'sample_giver': 'Mom & Dad',
    'card_caption': 'The card, as it reaches them. Their names and yours go where these are.',
    'what_eyebrow': 'What it is',
    'what_h': 'Three nights <em>in the trees</em>',
    'what': [
        'A hand-built treehouse with a canvas peak, sixty feet up in the forest above Dahlonega, Georgia. '
        'The way in is a hundred-foot bridge strung with small warm lights.',
        'And the Dawn Table. Livy makes breakfast, and Mick carries it across the bridge to their door.',
    ],
    'when_h': 'When',
    'choose_h': 'Choosing their nights',
    'choose': 'When they know their dates, they call or text Mick at ' + PHONE + ', and he books them in.',
    'card_h': 'The card',
    'card_how': 'Their names and yours on the card. You have it as a link the moment you pay, to send them '   # ENGINE
                'or print at home. Tick the box below and we will mail you the printed card as well.',
    'give_h': 'Give The Golden Arrow',
    'give_lead': 'Their names, yours, and your email. You see the whole price, taxes and fees included, before you pay.',

    # ---- /gift: the purchase panel (js/gift.js) --------------------------------------------
    'opening': 'One moment…',
    'off': 'The Golden Arrow can’t be bought online just yet. Call or text Mick at ' + PHONE + ' and he will take it from there.',
    'down': 'We couldn’t reach our booking system just now. Nothing was charged. Call or text Mick at ' + PHONE + ', or try again in a moment.',
    'call_mick': 'Call Mick',
    'text_mick': 'Text Mick',
    'for_label': 'Their names',
    'for_hint': 'The card reads “For” and then these.',
    'from_label': 'Your name',
    'from_hint': 'The card reads “With love from” and then this.',
    'email_label': 'Your email',
    'mail_label': 'Mail me the printed card as well',
    'ship_name': 'Name on the envelope',
    'ship_line1': 'Street address',
    'ship_line2': 'Apartment or suite',
    'ship_city': 'City',
    'ship_state': 'State',
    'ship_zip': 'ZIP code',
    'optional': '(optional)',
    'need_for': 'Please add their names, as the card should read.',
    'need_from': 'Please add your name, as the card should sign it.',
    'need_email': 'Please add a working email.',
    'need_address': 'Please add the full address for the printed card, or untick the box.',
    'continue': 'Continue',
    'adding': 'Adding it up…',
    'confirm_eyebrow': 'Your gift',
    'confirm_mail': 'The printed card goes to',
    'confirm_link': 'The card comes to you as a link once you pay.',    # ENGINE
    'total_label': 'Total',
    'all_in': 'Taxes and fees included.',
    'total_at_stripe': 'Stripe shows the whole price, taxes and fees included, before you pay.',
    'pay': 'Pay securely with Stripe',
    'leaving': 'Opening secure payment…',
    'change': '‹ Change the names or the address',
    'pay_fine': 'Payment is by Stripe. Questions? Call or text Mick at ' + PHONE + '.',
    'no_payment': 'Secure payment could not open. Nothing was charged. Please try again, or call or text Mick at ' + PHONE + '.',

    # ---- /gift/card (js/gift.js) -----------------------------------------------------------
    'card_title': 'Your Golden Arrow | Loxley Forest',
    'card_eyebrow': 'A gift from Loxley Forest',
    'card_opening': 'Opening the card…',
    'card_none': 'This link has no gift on it. Call or text Mick at ' + PHONE + ' and he will sort it out.',
    'card_unknown': 'We could not find a gift on this link. Call or text Mick at ' + PHONE + ' and he will sort it out.',
    'card_off': 'The card can’t be shown online just yet. Call or text Mick at ' + PHONE + '.',
    'card_down': 'We couldn’t reach the card just now. Please try again in a moment, or call or text Mick at ' + PHONE + '.',
    'card_pending': 'The payment is still coming through. The card will appear here in a moment.',
    'card_slow': 'The payment is taking longer than usual to come through. Refresh in a minute, or call or text Mick at ' + PHONE + '.',
    'card_void': 'This gift is no longer active. Questions? Call or text Mick at ' + PHONE + '.',
    'card_used': 'This Golden Arrow has been used to book a stay. The card stays here to keep.',
    'choose_dates': 'Choose your dates',                                # ENGINE
    'print': 'Print the card',
    'share': 'Send the link',
    'share_copied': 'The link is copied. Paste it into a message to them.',
    'share_manual': 'Copy this link and send it to them:',
    'keep': 'Anyone with this link can use the gift. Send it to them, and keep it close.',

    # ---- /book, when a Golden Arrow rides the link (js/gatehouse.js) -----------------------
    'book_name': 'The Golden Arrow',
    'book_with': 'The Golden Arrow is with you. Choose your nights, and you will see what it covers before you book.',
    'book_covers': 'The Golden Arrow covers these nights.',             # the CEO's words, 2026-10-25
    'book_left': 'Left to pay',
    'book_nothing_left': 'Nothing left to pay, today or later.',
    'book_not_these': 'The Golden Arrow can’t be used for these dates.',
    'book_other_dates': 'Choose other nights, or call or text Mick at ' + PHONE + ' before you book.',
    'book_missing': 'We could not find a Golden Arrow on your link, so these dates are at full price. '
                    'If you expected one, call or text Mick at ' + PHONE + ' before you book.',
    'book_used': 'The Golden Arrow on your link has been used already, so these dates are at full price. '
                 'Questions? Call or text Mick at ' + PHONE + '.',
    'book_off': 'The Golden Arrow can’t be used online just yet, so these dates are at full price. '
                'To use it, call or text Mick at ' + PHONE + '.',
    'book_down': 'We couldn’t check your Golden Arrow just now, so these dates are at full price. '
                 'Refresh in a moment, or call or text Mick at ' + PHONE + '.',
    'book_cta': 'Book with The Golden Arrow',
    'book_booking': 'Booking with The Golden Arrow…',
    'book_covered_title': 'Covered by The Golden Arrow',
}

# Which words each page's script reads (the JSON block the builder writes into the page).
PANEL_KEYS = ('opening', 'off', 'down', 'call_mick', 'text_mick', 'for_label', 'for_hint', 'from_label', 'from_hint',
              'email_label', 'mail_label', 'ship_name', 'ship_line1', 'ship_line2', 'ship_city', 'ship_state', 'ship_zip',
              'optional', 'need_for', 'need_from', 'need_email', 'need_address', 'continue', 'adding', 'confirm_eyebrow',
              'confirm_mail', 'confirm_link', 'total_label', 'all_in', 'total_at_stripe', 'pay', 'leaving', 'change',
              'pay_fine', 'no_payment')
CARD_KEYS = ('card_none', 'card_unknown', 'card_off', 'card_down', 'card_pending', 'card_slow', 'card_void', 'card_used',
             'choose_dates', 'print', 'share', 'share_copied', 'share_manual', 'keep')
BOOK_KEYS = tuple(k for k in WORDS if k.startswith('book_'))


def words_block(keys):
    """The words a page's script reads, as JSON in the page, with the card's own name and its
    two ratified openings. '</' is escaped so nothing in it can close the tag."""
    data = {k: WORDS[k] for k in keys}
    data.update({'card_name': CARD['title'], 'card_for': CARD['for'], 'card_from': CARD['from']})
    body = json.dumps(data, ensure_ascii=False, sort_keys=True).replace('</', '<\\/')
    return f'<script type="application/json" id="lf-gift-words">{body}</script>'


URL = 'https://loxleyforest.com/gift'
CARD_URL = 'https://loxleyforest.com/gift/card'
PHOTO = 'images/v2/gift-treehouse-dusk-1200.webp'
ARROW = B.ARROW.replace('class="lf-arrow"', 'class="ga-arrow"', 1)
assert 'class="ga-arrow"' in ARROW


def _sub(head, pattern, new):
    head, n = re.subn(pattern, lambda m: new, head, count=1)
    assert n == 1, pattern
    return head


def head_for(title, desc, url, noindex=False):
    """The terms page's head (Tag Manager, icons, fonts, stylesheets) with this page's own title,
    description, canonical and og: tags, as pages/reviews.py does."""
    h, gtm = B.head_from('terms.html')
    h = _sub(h, r'<title>[^<]*</title>', f'<title>{escape(title, quote=False)}</title>')
    h = _sub(h, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{escape(desc)}">')
    h = _sub(h, r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{escape(title)}">')
    h = _sub(h, r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{escape(desc)}">')
    h = _sub(h, r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">')
    h = _sub(h, r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">')
    if noindex:
        h = h.replace(f'<link rel="canonical" href="{url}">',
                      f'<link rel="canonical" href="{url}">\n  <meta name="robots" content="noindex, nofollow, noarchive">', 1)
    # head_from leaves a blank line before </head> when there is no preload; keep it at one.
    return re.sub(r'\s*</head>\n$', '\n</head>\n', h), gtm


def card(names='', giver='', fill=False):
    """The digital card (card.html #digital). fill: the card page's card, which js/gift.js fills
    from GET /v1/gift (names, giver, and the gift number when the engine sends one)."""
    e = lambda s: escape(s, quote=False)
    giftno = (f'\n            <p class="ga-label ga-giftno" data-ga-giftno hidden>{CARD["giftno"]} <span data-fill="giftno"></span></p>'
              if fill else '')
    return f'''<div class="ga-stage">
      <article class="ga-card" aria-label="The Golden Arrow, the gift card">
        <div class="ga-frame" aria-hidden="true"></div>
        <div class="ga-top">
          <div class="ga-plate"><div class="ga-arch"><img src="{PHOTO}" width="1200" height="800" alt="The treehouse glowing at dusk beside the lit bridge" decoding="async"></div><span class="ga-finial">{B.ACORN}</span></div>
          <div class="ga-side">
            <img class="ga-wordmark" src="images/brand/logo/loxley-wordmark-on-light.svg" width="812" height="109" alt="Loxley Forest">
            <p class="ga-title">{CARD["title"]}</p>
            <p class="ga-subtitle">{CARD["subtitle"]}</p>
            <div class="ga-sig">
              <div class="ga-rule"></div>
              <p class="ga-for">{CARD["for"]} <span data-fill="names">{e(names)}</span></p>
              <p class="ga-from">{CARD["from"]} <span data-fill="giver">{e(giver)}</span></p>{giftno}
            </div>
          </div>
        </div>
        <div class="ga-body">
          {ARROW}
          <p class="ga-gift">{e(CARD["gift"])}</p>
          <p class="ga-nights">{e(CARD["nights"])}</p>
          <p class="ga-call">{CARD["call"]} <span class="ga-tel">{PHONE}</span>.</p>
        </div>
        <div class="ga-foot"><span class="ga-label">{CARD["foot"]}</span></div>
      </article>
    </div>'''


def head_section(eyebrow, h1, lead='', actions=''):
    lead = f'\n        <p class="lf-lead">{lead}</p>' if lead else ''
    return f'''
    <section class="lf-sec lf-dark lf-center ga-head" aria-labelledby="ga-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow">{eyebrow}</p>
        <h1 class="lf-h1" id="ga-h">{h1}</h1>{lead}{actions}
      </div>
    </section>
'''


CALL = (f'<a href="tel:+17065024823">{WORDS["call_mick"]}</a> or <a href="sms:+17065024823">{WORDS["text_mick"]}</a> '
        f'at <span class="ga-tel">{PHONE}</span>.')


def page_gift():
    W = WORDS
    h, gtm = head_for(W['title'], W['description'], URL)
    what = ''.join(f'\n            <p>{escape(p, quote=False)}</p>' for p in W['what'])
    body = head_section(W['eyebrow'], CARD['title'], escape(W['lead'], quote=False),
                        f'\n        <div class="lf-actions" style="justify-content:center"><a href="#give" class="lf-link">{W["to_give"]}</a></div>') + f'''
    <section class="lf-sec lf-parch ga-show" aria-label="The card">
      <figure class="ga-figure">
        {card(W["sample_names"], W["sample_giver"])}
        <figcaption>{escape(W["card_caption"], quote=False)}</figcaption>
      </figure>
    </section>

    <section class="lf-sec lf-light ga-what" aria-labelledby="ga-what-h">
      <div class="lf-wrap ga-cols">
        <div>
          <p class="lf-eyebrow">{W["what_eyebrow"]}</p>
          <h2 class="lf-h2" id="ga-what-h">{W["what_h"]}</h2>
          <div class="lf-body ga-what__body">{what}
          </div>
        </div>
        <dl class="ga-terms">
          <div><dt>{W["when_h"]}</dt><dd>{escape(CARD["nights"], quote=False)}</dd></div>
          <div><dt>{W["choose_h"]}</dt><dd>{escape(W["choose"], quote=False)}</dd></div>
          <div><dt>{W["card_h"]}</dt><dd>{escape(W["card_how"], quote=False)}</dd></div>
        </dl>
      </div>
    </section>

    <!-- ========== THE PURCHASE PANEL (js/gift.js): POST /v1/gift/checkout, then Stripe ==========
         The amount shows here only, from the engine, right before payment. While the engine's
         gift route answers 404, the panel says to call or text Mick. -->
    <section class="lf-sec lf-parch ga-give" id="give" aria-labelledby="ga-give-h">
      <div class="ga-give__in">
        <h2 class="lf-h3" id="ga-give-h">{W["give_h"]}</h2>
        <p class="ga-give__lead">{escape(W["give_lead"], quote=False)}</p>
        <div id="ga-buy" class="ga-buy" data-api="{B.API}" data-product="golden-arrow" aria-live="polite">
          <p class="ga-wait" role="status">{W["opening"]}</p>
          <noscript><p class="ga-panel__lead">{CALL}</p></noscript>
        </div>
        <p class="ga-terms-line">{escape(CARD["nights"], quote=False)}</p>
      </div>
    </section>
    {words_block(PANEL_KEYS)}
'''
    return 'gift.html', h, gtm, body, '/book', True


def page_gift_card():
    W = WORDS
    h, gtm = head_for(W['card_title'], W['description'], CARD_URL, noindex=True)
    body = head_section(W['card_eyebrow'], CARD['title']) + f'''
    <section class="lf-sec lf-parch ga-cardpage" id="ga-card-page" data-api="{B.API}" aria-label="The card">
      <div class="ga-cardpage__in">
        <p class="ga-wait" role="status" data-ga-wait>{W["card_opening"]}</p>
        <noscript><p class="ga-note">This page needs JavaScript to show the card. {CALL}</p></noscript>
        <figure class="ga-figure" data-ga-card hidden>
          {card(fill=True)}
        </figure>
        <p class="ga-note" role="status" data-ga-note hidden></p>
        <div class="ga-actions" data-ga-actions hidden>
          <button type="button" class="lf-btn" data-ga-dates hidden>{B.ACORN}{W["choose_dates"]}</button>
          <button type="button" class="lf-btn gh-btn--quiet" data-ga-print>{W["print"]}</button>
          <button type="button" class="lf-btn gh-btn--quiet" data-ga-share>{W["share"]}</button>
        </div>
        <div class="ga-share" data-ga-share-out hidden></div>
        <p class="ga-keep" data-ga-keep hidden>{escape(W["keep"], quote=False)}</p>
      </div>
    </section>
    {words_block(CARD_KEYS)}
'''
    return 'gift-card.html', h, gtm, body, '/book', True


PAGES = [page_gift, page_gift_card]

# 'u' is one unit of the card's 1080-wide design: every size below is the card's own, times u,
# so the card scales with its frame (a phone, a desk, a printed page) and stays the same card.
CSS = '''
.ga-head { padding-top: calc(var(--hdr-h) + clamp(44px, 8vw, 96px)); padding-bottom: clamp(48px, 7vw, 80px); }
.ga-head .lf-h1 { font-size: clamp(2.6rem, 9vw, 4.8rem); font-style: italic; }
.ga-head .lf-lead { margin-left: auto; margin-right: auto; }

.ga-show { padding-top: clamp(48px, 7vw, 88px); padding-bottom: clamp(48px, 7vw, 88px); }
/* width 100%: the stage has size containment, so a shrink-to-fit parent (a grid item with auto
   margins) would give it no width at all */
.ga-figure { margin: 0 auto; width: 100%; max-width: 540px; }
.ga-figure[hidden] { display: none; }
.ga-figure figcaption { margin-top: 18px; text-align: center; font-size: 1.1rem; line-height: 1.5; color: var(--stone); }

.ga-what .lf-h2 { color: var(--forest-deep); }
.ga-what__body { margin-top: 22px; }
.ga-cols { display: grid; gap: 44px; }
@media (min-width: 900px) { .ga-cols { grid-template-columns: 1.1fr 1fr; gap: 72px; align-items: start; } }
.ga-terms { margin: 0; display: grid; gap: 0; }
.ga-terms > div { padding: 20px 0; border-top: 1px solid rgba(44, 34, 25, 0.14); }
.ga-terms > div:last-child { border-bottom: 1px solid rgba(44, 34, 25, 0.14); }
.ga-terms dt { font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.28em; text-transform: uppercase; color: var(--stone); }
.ga-terms dd { margin: 8px 0 0; font-size: 1.2rem; line-height: 1.6; color: var(--bark); }

.ga-give { scroll-margin-top: var(--hdr-h); padding-top: clamp(56px, 8vw, 96px); padding-bottom: clamp(56px, 8vw, 96px); }
.ga-give__in { max-width: 34rem; margin: 0 auto; }
.ga-give .lf-h3 { color: var(--forest-deep); font-size: clamp(1.75rem, 5vw, 2.3rem); text-align: center; }
.ga-give__lead { margin: 10px 0 28px; text-align: center; font-size: 1.2rem; line-height: 1.5; color: var(--stone); }
.ga-buy { background: var(--linen); border: 1px solid rgba(44, 34, 25, 0.12); padding: clamp(20px, 5vw, 32px); }
.ga-wait { margin: 0; font-size: 1.15rem; color: var(--stone); text-align: center; }
.ga-form { display: grid; gap: 16px; }
.ga-form .gh-field small { display: block; margin-top: 6px; font-size: 15px; line-height: 1.4; color: var(--stone); }
.ga-ship { border: 0; margin: 0; padding: 0; display: grid; gap: 14px; min-width: 0; }
.ga-ship[hidden] { display: none; }
.ga-ship legend { padding: 0; margin-bottom: 4px; }
.ga-row2 { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
.ga-panel__lead { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.35rem; line-height: 1.45; color: var(--forest-deep); }
.ga-calls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
.ga-calls .lf-btn { padding: 0 12px; }
.ga-panel__lead a, .ga-note a { color: var(--forest-deep); text-decoration: underline; text-underline-offset: 3px; }
.ga-tel { white-space: nowrap; font-variant-numeric: lining-nums; }
.ga-confirm { display: grid; gap: 14px; }
.ga-confirm .gh-eyebrow { margin: 0; }
.ga-confirm__names { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.45rem; line-height: 1.3; color: var(--forest-deep); overflow-wrap: anywhere; }
.ga-confirm__names span { display: block; font-style: italic; font-size: 1.2rem; color: var(--stone); }
.ga-confirm .gh-lines { margin: 4px 0 0; }
.ga-confirm .gh-fine { margin: 0; overflow-wrap: anywhere; }
.ga-confirm .lf-btn { width: 100%; }
.ga-terms-line { margin: 22px 0 0; text-align: center; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.15rem; line-height: 1.5; color: var(--stone); }

.ga-cardpage { padding-top: clamp(40px, 7vw, 80px); }
.ga-cardpage__in { max-width: 540px; margin: 0 auto; display: grid; gap: 22px; }
.ga-note { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.35rem; line-height: 1.45; color: var(--forest-deep); text-align: center; }
.ga-note[hidden], .ga-actions[hidden], .ga-keep[hidden], .ga-share[hidden], .ga-actions [hidden] { display: none; }
.ga-actions { display: grid; gap: 12px; }
.ga-actions .lf-btn { width: 100%; }
.ga-keep { margin: 0; text-align: center; font-size: 1.05rem; line-height: 1.5; color: var(--stone); }
.ga-share { display: grid; gap: 8px; }
.ga-share p { margin: 0; font-size: 1.05rem; color: var(--stone); text-align: center; }
.ga-share input { width: 100%; min-height: 48px; padding: 10px 12px; border: 1px solid var(--driftwood); background: var(--cream); font: 15px/1.3 'Montserrat', sans-serif; color: var(--bark); }

/* ---- the card ---- */
.ga-stage { container-type: inline-size; width: 100%; max-width: 540px; margin: 0 auto; }
.ga-card {
  --u: calc(100cqw / 1080); position: relative; overflow: hidden; width: 100%; aspect-ratio: 1080 / 1350;
  background: var(--linen); color: var(--bark); box-shadow: 0 18px 50px rgba(20, 36, 24, 0.18);
  font-size: calc(16 * var(--u)); line-height: normal;   /* the card's own page: 16 px on 1080, so no line box grows from the site's type */
  -webkit-font-smoothing: antialiased; font-kerning: normal; -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.ga-card p { margin: 0; }
.ga-card img { display: block; max-width: none; }
.ga-card .ga-frame { position: absolute; inset: calc(34 * var(--u)); border: max(1px, calc(1.5 * var(--u))) solid rgba(196, 162, 101, 0.75); pointer-events: none; }
.ga-card .ga-top { position: absolute; left: calc(96 * var(--u)); right: calc(96 * var(--u)); top: calc(116 * var(--u)); display: flex; gap: calc(64 * var(--u)); align-items: stretch; }
.ga-card .ga-plate { --w: calc(384 * var(--u)); position: relative; flex: none; width: var(--w); align-self: flex-start; }
.ga-card .ga-arch { width: var(--w); height: calc(var(--w) * 10 / 7); border-radius: calc(var(--w) / 2) calc(var(--w) / 2) 0 0; overflow: hidden; background: var(--ink); }
.ga-card .ga-arch img { width: 100%; height: 100%; object-fit: cover; object-position: 35% 50%; }
.ga-card .ga-plate::before {
  content: ''; position: absolute; left: calc(var(--w) * -0.034); top: calc(var(--w) * -0.034);
  width: calc(var(--w) * 1.068); height: calc(var(--w) * 10 / 7 + var(--w) * 0.068);
  border: max(0.75px, calc(1.6 * var(--u))) solid var(--gold); border-radius: calc(var(--w) * 0.534) calc(var(--w) * 0.534) 0 0; pointer-events: none;
}
.ga-card .ga-finial { position: absolute; z-index: 1; left: 50%; top: calc(var(--w) * -0.106); width: calc(var(--w) * 0.058); height: calc(var(--w) * 0.0725); transform: translateX(-50%); color: var(--gold); }
.ga-card .ga-finial svg { display: block; width: 100%; height: 100%; }
.ga-card .ga-side { flex: 1; min-width: 0; display: flex; flex-direction: column; padding-top: calc(14 * var(--u)); }
.ga-card .ga-wordmark { width: 100%; height: auto; margin-left: -1%; }
.ga-card .ga-title { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 400; font-size: calc(68 * var(--u)); line-height: 1.04; color: var(--forest-deep); margin-top: calc(44 * var(--u)); text-wrap: balance; letter-spacing: -0.005em; }
.ga-card .ga-subtitle { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 500; font-size: calc(36 * var(--u)); line-height: 1.2; color: var(--stone); margin-top: calc(14 * var(--u)); }
.ga-card .ga-sig { margin-top: auto; }
.ga-card .ga-rule { width: calc(72 * var(--u)); height: 0; border-top: max(1px, calc(1.5 * var(--u))) solid var(--gold); margin: 0 0 calc(34 * var(--u)); }
.ga-card .ga-for { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: calc(47 * var(--u) * var(--ns, 1)); line-height: 1.1; color: var(--forest-deep); overflow-wrap: break-word; text-wrap: balance; }
.ga-card .ga-from { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 500; font-size: calc(37 * var(--u) * var(--ns, 1)); line-height: 1.2; color: var(--stone); margin-top: calc(12 * var(--u)); overflow-wrap: break-word; text-wrap: balance; }
.ga-card .ga-label { font-family: 'Montserrat', sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.28em; }
.ga-card .ga-giftno { font-size: calc(22 * var(--u)); letter-spacing: 0.24em; color: var(--gold-text); margin-top: calc(34 * var(--u)); }
.ga-card .ga-giftno[hidden] { display: none; }
/* --ns: long names step down (js/gift.js fit) until the dedication sits beside the photo */
.ga-card .ga-body { position: absolute; left: calc(96 * var(--u)); right: calc(96 * var(--u)); top: calc(728 * var(--u)); }
.ga-card .ga-arrow { display: block; width: calc(440 * var(--u)); height: calc(23.5 * var(--u)); margin: 0; color: var(--gold); opacity: 1; }
.ga-card .ga-gift { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: calc(43 * var(--u)); line-height: 1.32; color: var(--bark); margin-top: calc(38 * var(--u)); text-wrap: pretty; }
.ga-card .ga-nights { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 500; font-size: calc(35 * var(--u)); line-height: 1.3; color: var(--stone); margin-top: calc(28 * var(--u)); }
.ga-card .ga-call { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: calc(37 * var(--u)); line-height: 1.3; color: var(--bark); margin-top: calc(20 * var(--u)); }
.ga-card .ga-tel { font-variant-numeric: lining-nums; white-space: nowrap; }
.ga-card .ga-foot { position: absolute; left: calc(96 * var(--u)); right: calc(96 * var(--u)); bottom: calc(84 * var(--u)); text-align: center; border-top: max(1px, calc(1 * var(--u))) solid rgba(196, 162, 101, 0.6); padding-top: calc(26 * var(--u)); }
.ga-card .ga-foot .ga-label { font-size: calc(23 * var(--u)); letter-spacing: 0.24em; color: var(--stone); }

/* Printed from the browser: the card alone, centred, 7 inches wide (fits Letter and A4). */
@media print {
  body:has(#ga-card-page) .lf-hdr, body:has(#ga-card-page) .lf-menu, body:has(#ga-card-page) .lf-foot,
  body:has(#ga-card-page) .book-fab, body:has(#ga-card-page) .skip-link, body:has(#ga-card-page) .ga-head,
  body:has(#ga-card-page) .ga-wait, body:has(#ga-card-page) .ga-note, body:has(#ga-card-page) .ga-actions,
  body:has(#ga-card-page) .ga-share, body:has(#ga-card-page) .ga-keep { display: none !important; }
  body:has(#ga-card-page), body:has(#ga-card-page) main, .ga-cardpage { background: #fff !important; }
  .ga-cardpage { padding: 0 !important; }
  .ga-cardpage__in, .ga-cardpage .ga-figure, .ga-cardpage .ga-stage { max-width: 7in; }
  .ga-cardpage .ga-card { box-shadow: none; break-inside: avoid; }
}
'''
