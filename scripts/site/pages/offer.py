"""/elopement/offer: the private page of an elopement package offer (Mick's yes, 2026-10-27;
loxley-rescue gatehouse/offers.py, GATEHOUSE-SPEC.md section 16).

Mick makes an offer for one couple on the droplet (`python3 -m gatehouse.offers make`); its
private link is https://loxleyforest.com/elopement/offer#offer=<token>. The keys script in the
head (build_v2.KEYS_SCRIPT) lifts the token out of the address bar before Tag Manager loads; it
goes to our own booking server, posted (POST /v1/offer), and nowhere else.

The page is an invitation, not a form: Mick's dusk photograph (the one on /book), their names and
the headline, then their dates and the package as the day itself, what Mick gives them, one
total, half today or all of it today, the elopement agreement (its own words, filled by the
engine), the typed name and the tick, and Stripe's embedded checkout in place (js/offer.js). Where
Stripe returns them (?session_id=, lifted like the token), the thank-you shows only once the
engine says the payment succeeded; a bank payment still clearing has its own state.

Served at /elopement/offer by a rewrite in netlify.toml; the file is elopement-offer.html so
scripts/ensure_gtm.py and the other root checks see it. Noindex, not in sitemap.xml, linked from
nowhere. Rooted paths: it is served one folder deep.

THE WORDS. Every sentence a couple reads on this page is in WORDS below and only there; the
agreement's words are the engine's. The Writer drafts them (2026-10-27) and they go to Mick's ear.
Until he has approved them, APPROVED_SHA256 is None and the page shows nothing of the offer: only
/book's live line "Questions? Call or text 706-502-4823, or write to stay@loxleyforest.com." When
he has, set APPROVED_SHA256 to the hash the builder prints for WORDS (words_sha256), rebuild, and
the page opens. Any change to a word after that closes it again until approved again. Merge values
the words may use: {{first_names}} (the couple, as Mick greets them), {{package}}, {{dates}},
{{arrival}}, {{check_in_time}}, {{total}}, {{today_amount}}, {{retainer}}, {{balance}},
{{balance_date}}.
"""
import hashlib
import json
import sys
from html import escape

import build_v2 as B

PHONE = '706-502-4823'
URL = 'https://loxleyforest.com/elopement/offer'
# /book's own line, live and ratified as the site's: what the page says while its words wait for
# Mick, and without JavaScript.
NOT_READY = 'Questions? Call or text 706-502-4823, or write to stay@loxleyforest.com.'

# =============================================================================================
# WORDS · APPROVED. The Writer's final words (2026-10-27, the CEO seat's batch); Mick's yes to all,
# by sight and ear, the same day (APPROVED_SHA256 below). The page shows them only while
# APPROVED_SHA256 matches. need_sign_plain is need_sign without its photo question, for an offer
# whose couple brings their own photographer (the agreement then asks no "May we?").
# =============================================================================================
WORDS = {
    'title': 'Your day in the trees | Loxley Forest',
    'headline': '{{first_names}}, that bridge is your front door.',
    'opening': ('Mick here. You\'ll walk in the way everyone does, ten minutes under the trees, until the laurel '
                'opens up and the bridge is there. Everything for your day is below. When it reads right, sign at '
                'the bottom, and the date is yours.'),
    'package_h': 'Your day',
    'extras_h': 'And on us',
    'total_label': 'All in',
    'total_sub': 'Taxes and fees included.',
    'half_label': 'Half today',
    'half_line': ('{{today_amount}} by card holds the date, and it does not come back. The rest, {{balance}}, comes '
                  'off the same card on {{balance_date}}.'),
    'whole_label': 'All of it today',
    'whole_line': '{{today_amount}} by card, Link or Klarna, and no balance later.',
    'agreement_lead': ('Last, the agreement. It\'s in plain words, and it says what happens if plans change or the '
                       'weather turns.'),
    'sign_label': 'Type your full name to sign',
    'tick': 'I\'m 18 or older and have read and agree to the elopement agreement, liability waiver included.',
    'pay': 'Sign and pay {{today_amount}}',
    'need_sign': 'Please type your full name, tick the box, and answer the photo question to sign.',
    'need_sign_plain': 'Please type your full name and tick the box to sign.',
    'loading': 'One moment…',
    'failure': 'Something went wrong just now. Please try again in a moment.',
    'questions': 'Questions? Call or text Mick at 706-502-4823.',
    'thanks_h': 'The date is yours.',
    'thanks': ('{{package}}, {{dates}}.\nYour confirmation comes by email, with what happens next.\n'
               'See you at the bridge.'),
    'clearing': ('Your bank payment is on its way. It can take a few days to clear, and your dates stay held for you '
                 'until it does. Your confirmation comes by email once it\'s through.'),
    'expired': ('This offer has closed, and its dates are no longer held. That happens, and it\'s alright. Mick will '
                'tell you exactly where the dates stand.'),
}
# The SHA-256 of WORDS (words_sha256) once Mick has approved every word. None: not yet.
# Mick, 2026-10-27, on the review page by sight and ear: "yes to all" (relayed by the CEO seat;
# https://claude.ai/artifact/8ofANdGu5jtkrGdqtLFcSx). Any change to a word closes the page again.
APPROVED_SHA256 = '399359d8dec17d8d98fef291a59c90813d605abc9e11b3be94f60518ce7c45b6'


def words_sha256(words=None):
    """The hash Mick's approval names: WORDS as canonical JSON."""
    return hashlib.sha256(json.dumps(words or WORDS, ensure_ascii=False, sort_keys=True)
                          .encode('utf-8')).hexdigest()


def words_block():
    """The words js/offer.js reads, as JSON in the page; `ready` only when they are the words Mick
    approved. '</' is escaped so nothing in it can close the tag."""
    data = dict(WORDS, ready=APPROVED_SHA256 is not None and words_sha256() == APPROVED_SHA256,
                not_ready=NOT_READY)
    body = json.dumps(data, ensure_ascii=False, sort_keys=True).replace('</', '<\\/')
    return f'<script type="application/json" id="lf-offer-words">{body}</script>'


def _book():
    """/book's module, for its hero photograph (Mick's dusk photograph, 2026-10-26)."""
    mod = sys.modules.get('lfpage_book')
    assert mod is not None and hasattr(mod, 'HERO_PHOTO'), 'pages/book.py loads before pages/offer.py'
    return mod


def page_offer():
    book = _book()
    # The terms page's head with this page's own title and canonical, noindex (pages/gift.py
    # head_for), and /book's hero preload so the photograph is the first paint.
    ready = APPROVED_SHA256 is not None and words_sha256() == APPROVED_SHA256
    h, gtm = sys.modules['lfpage_gift'].head_for(WORDS['title'] if ready else 'Loxley Forest',
                                                 'Loxley Forest, Dahlonega, Georgia.', URL, noindex=True)
    h = h.replace('</head>', '  ' + book.HERO_PRELOAD + '\n</head>', 1)
    body = f'''
    <!-- ========== THE INVITATION: the bridge at dusk behind their names ========== -->
    <section class="lf-sec lf-dark lf-center lf-bk-top eo-top" aria-labelledby="eo-h">
      {book.HERO_PHOTO}
      <div class="lf-wrap">
        <p class="lf-eyebrow" data-eo-eyebrow>Dahlonega, Georgia</p>
        <h1 class="lf-h1" id="eo-h" data-eo-h1>Loxley Forest</h1>
        <p class="lf-lead" data-eo-lead hidden></p>
      </div>
    </section>

    <!-- ========== THE OFFER (js/offer.js): POST /v1/offer, then POST /v1/offer/checkout and
         Stripe's embedded checkout in place. The token never rides a URL a server logs. ========== -->
    <section class="lf-sec lf-parch eo" id="eo" data-api="{B.API}" data-stripe-key="{B.STRIPE_KEY}" aria-live="polite">
      <div class="eo__in">
        <p class="eo-wait" role="status" data-eo-wait></p>
        <noscript><p class="eo-note">{escape(NOT_READY, quote=False)}</p></noscript>
        <div class="eo-body" data-eo-body hidden></div>
      </div>
    </section>
    {words_block()}
'''
    return 'elopement-offer.html', h, gtm, body, '/book', True


PAGES = [page_offer]

CSS = '''
/* The invitation's top: /book's dusk photograph (lf-bk-top), their names over it. It carries more
   words than /book's, so it stands taller and its dark band begins higher: the words sit below the
   lit canopy, never on it. */
.eo-top { min-height: clamp(620px, 112svh, 920px); }
.eo-top::before {
  background: linear-gradient(180deg, rgba(20, 36, 24, 0.62) 0%, rgba(20, 36, 24, 0) 14%, rgba(20, 36, 24, 0) 34%,
    rgba(20, 36, 24, 0.8) 50%, rgba(20, 36, 24, 0.93) 66%, var(--ink) 100%);
}
.eo-top .lf-h1 { font-size: clamp(2.3rem, 8.4vw, 4.4rem); overflow-wrap: anywhere; }
.eo-top .lf-lead { white-space: pre-line; }
.eo { padding-top: 40px; }
.eo__in { width: min(640px, 100%); margin: 0 auto; padding: 0 16px; }
.eo-wait, .eo-note { margin: 0; font-size: 18px; line-height: 1.55; color: var(--bark); text-align: center; }
.eo-body { display: grid; gap: 34px; }
.eo-part { display: grid; gap: 12px; }
.eo-part > h2 { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: clamp(1.7rem, 6vw, 2.2rem); line-height: 1.15; color: var(--forest-deep); }
.eo-dates { margin: 0; font-family: 'Montserrat', Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--forest); }
.eo-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.eo-list li { position: relative; padding-left: 26px; font-size: 18px; line-height: 1.45; color: var(--bark); overflow-wrap: anywhere; }
.eo-list li::before { content: ''; position: absolute; left: 4px; top: 0.62em; width: 8px; height: 8px; border-radius: 50%; background: var(--gold, #b8955a); }
.eo-total { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 16px 18px; background: var(--cream); border: 1px solid var(--parchment); }
.eo-total__label { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; color: var(--forest-deep); }
.eo-total__sum { font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: var(--forest-deep); }
.eo-sub { margin: 0; font-size: 16px; line-height: 1.5; color: var(--stone); }
.eo-ways { border: 0; margin: 0; padding: 0; display: grid; gap: 10px; min-width: 0; }
.eo-way { display: grid; grid-template-columns: 26px 1fr; gap: 4px 14px; align-items: start; padding: 14px 16px; min-height: 56px; cursor: pointer;
  background: var(--cream); border: 1px solid var(--driftwood); }
.eo-way input { margin: 3px 0 0; width: 22px; height: 22px; accent-color: var(--forest-deep); grid-row: span 2; }
.eo-way:has(input:checked) { border-color: var(--forest-deep); background: var(--white); }
.eo-way:has(input:focus-visible) { outline: 2px solid var(--gold); outline-offset: 2px; }
.eo-way__label { font-size: 18px; font-weight: 600; color: var(--forest-deep); }
.eo-way__line { font-size: 16px; line-height: 1.45; color: var(--bark); }
.eo-lead-in { margin: 0; font-size: 17px; line-height: 1.55; color: var(--bark); }
.eo .gh-agreement { overflow-wrap: anywhere; }
.eo-choice { border: 0; margin: 0.4em 0 1em; padding: 0; display: grid; gap: 8px; min-width: 0; }
.eo-choice legend { padding: 0; margin-bottom: 4px; font-weight: 600; color: var(--forest-deep); }
.eo-choice label { display: flex; gap: 10px; align-items: flex-start; min-height: 44px; cursor: pointer; line-height: 1.4; }
.eo-choice input { flex: none; width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--forest-deep); }
.eo-sign { display: grid; gap: 12px; }
.eo-sign .lf-btn { width: 100%; justify-content: center; min-height: 56px; font-size: 16px; }
.eo-pay { min-height: 0; }
.eo-pay:empty { display: none; }
.eo-done { text-align: center; display: grid; gap: 14px; }
.eo-done h2 { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: clamp(1.9rem, 7vw, 2.6rem); color: var(--forest-deep); }
.eo-done p { margin: 0; font-size: 18px; line-height: 1.55; color: var(--bark); white-space: pre-line; }
.eo-call { margin: 0; font-size: 16px; color: var(--stone); text-align: center; }
.eo-call a { color: var(--forest-deep); }
/* The invitation has one action, Sign and pay: the site's floating "Book your dates" steps aside. */
.v2[data-lf-path="/elopement/offer"] .book-fab { display: none; }
'''
