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
import os
import re
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
    'package_h': 'What is provided',
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
    # ---- The Invitation grown (the Chief's route and the table of 2026-11-11), for Mick's ear: the
    # hash moves with them, so the live page stays closed until his yes by the new hash. Each shows
    # only when the engine sends its field (days, note, open_dates, hold, expires_at). ----
    'day_h': 'Your day, hour by hour',
    'sunrise_label': 'Sunrise',
    'sunset_label': 'Sunset',
    'sunset_line': 'The sun sets at {{sunset}} on your day.',
    'note_h': 'A word from Mick',
    'photos_h': 'Where it happens',
    'price_h': 'The price, to the dollar',
    'dates_h': 'Other open dates near yours',
    # The Invitation: a tap re-reads the page on that date (GET /v1/invitation?check_in=); a made
    # offer: a tap composes a text to the house, since its nights are claimed and moving them is Mick's.
    'dates_line': 'Tap one to see your day on that date instead.',
    'dates_line_offer': 'Tap one and it goes to Mick as a text. Nothing moves until he writes back.',
    'dates_ask': 'Could we have {{dates}} instead of {{our_dates}}?',
    'stands_until': 'This invitation stands until {{expires}}.',
    # The Invitation's foot (GET /v1/invitation; the Forge's rulings of 2026-11-12). Ask, the default:
    # the button rings Mick and nothing is held; Hold, only on Mick's word: the button makes the offer
    # and the page moves to the agreement.
    'invite_plan': ('Half, {{retainer}}, holds the date once Mick sends your agreement and you sign; the rest, '
                    '{{balance}}, comes off the same card on {{balance_date}}.'),
    'invite_plan_whole': 'Inside thirty days the whole of it, {{total}}, is paid when you sign.',
    'ask_h': 'Nothing is held yet',
    'ask_line': 'Press, and Mick reads it himself and sends your agreement to sign. The date is yours when you do.',
    'ask_button': 'Ask Mick for this date',
    'asked_h': 'Asked.',
    'asked': 'Mick will send your agreement to sign. The date is yours when you do, and he is a call or a text away until then.',
    'hold_h': 'Hold your date',
    'hold_line': 'Nothing is held until you press. Then the date is yours for {{hold_hours}} hours while you sign and pay.',
    'hold_button': 'Hold our date',
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


# ---- The Invitation grown (2026-11-11, the Chief's route and the table): the photographs, the demo ----

# The photographs the page shows by package key: the house's own frames, never a couple's; four
# each, the first the widest. js/offer.js takes the set for the offer's package from a <template>
# written into the page, so the page needs no engine field for them.
PHOTOS = {
    'the-crossing': [
        ('ra-bridge-dusk', 'The rope bridge at dusk, the treehouse lit at its far end'),
        ('aerial-bridge', 'From above: the hundred-foot rope bridge through the canopy at golden hour'),
        ('ra-deck-dusk', 'The deck at dusk, sixty feet up'),
        ('ra-room', 'The room under the canvas peak')],
    'the-vow': [
        ('img_1717', 'The stone fire pit on the forest floor, ringed with ferns'),
        ('img_2546', 'The treehouse deck with chairs, above the forest'),
        ('ra-bridge-dusk', 'The rope bridge at dusk, the treehouse lit at its far end'),
        ('ra-room', 'The room under the canvas peak')],
    'the-falls': [
        ('waterfall-falls', 'The waterfall at Loxley Forest, the falls over the rock shelf'),
        ('aerial-bridge', 'From above: the hundred-foot rope bridge through the canopy at golden hour'),
        ('ra-deck-dusk', 'The deck at dusk, sixty feet up'),
        ('ra-room', 'The room under the canvas peak')],
}
PHOTOS['firelight'] = PHOTOS['the-vow']


def photo_templates():
    return '\n    '.join(
        f'<template data-eo-photos="{key}">' + ''.join(
            f'<figure class="eo-photo">{B.pic(name, alt, "(min-width: 900px) 640px, 100vw", cls="eo-photo__img")}</figure>'
            for name, alt in frames) + '</template>'
        for key, frames in PHOTOS.items())


# The demo for the read (the route: "one demo page for an invented couple on invented dates"). An
# invented stay: the names ride after the # in the link, as the guides' do, and are nowhere in the
# file; every number and every sun time is made up; the agreement is a stand-in, not the canon's
# words; the stops' words are a draft of the shape the engine's days field would carry, for the
# Forge and Mick to replace. demo_page() writes it into private/<DEMO_FOLDER>/index.html from the
# built page: this module's styles and js/offer.js inline (so the page stands on its own wherever
# main is), no Tag Manager (a private page), the fixture in the words block in the engine's place.
# The folder name is fixed so a rebuild writes the same file.
DEMO_FOLDER = 'invitation-demo-9b4e27'
DEMO = {
    'status': 'open', 'greeting': '',
    'package': {'key': 'the-crossing', 'name': 'The Crossing', 'includes': [
        'Two nights in the treehouse', 'Your vows out on the rope bridge, at golden hour', 'An officiant',
        'Two hours of photographs, on the bridge and in the forest', 'A bouquet and a boutonniere',
        'A champagne toast', 'A private dinner carried across the bridge to your door',
        'Your day planned with Mick, hour by hour', "The Builder's Tour"]},
    'check_in': '2027-04-16', 'check_out': '2027-04-18', 'nights': 2, 'party': 2,
    'extras': ['The Morning After, champagne brunch carried across the bridge', 'A small cake'],
    'note': ('Mick here. Mid-April is when the laurel starts along the trail in, and the light on the bridge goes '
             'gold about an hour before sunset. I have kept Saturday evening for your vows.'),
    'days': [
        {'date': '2027-04-16', 'sunrise': '7:06 a.m.', 'sunset': '8:13 p.m.', 'stops': [
            {'time': '3:00 p.m.', 'title': 'Your treehouse is ready',
             'words': ('Drive in between the two signs, park at the end of Bobcat Road, and walk ten minutes under the '
                       'trees until the laurel opens and the bridge is there. That bridge is your front door.')},
            {'time': 'After dark', 'title': 'The bridge with its lights on',
             'words': 'Cross it again once the string lights are on. It is a different walk at night, and the forest is yours.'}]},
        {'date': '2027-04-17', 'sunrise': '7:05 a.m.', 'sunset': '8:14 p.m.', 'stops': [
            {'time': '11:00 a.m.', 'title': "The Builder's Tour",
             'words': 'Mick walks you through what he built, from the anchors in the oaks to the oven on the Sky Deck.'},
            {'time': '7:15 p.m.', 'title': 'Your vows, out on the rope bridge',
             'words': ('Golden hour. Your officiant and your photographer are there; the two of you walk out to the middle '
                       'of the span and say it.')},
            {'time': '8:30 p.m.', 'title': 'A private dinner, carried across the bridge',
             'words': 'Set on the deck, sixty feet up, with the champagne toast.'}]},
        {'date': '2027-04-18', 'sunrise': '7:04 a.m.', 'sunset': '8:15 p.m.', 'stops': [
            {'time': '10:00 a.m.', 'title': 'The Morning After',
             'words': 'Champagne brunch carried across the bridge to your door, and the small cake.'},
            {'time': '12:00 noon', 'title': 'Checkout', 'words': 'Take your time with the last of it.'}]}],
    'lines': [{'label': 'The Crossing', 'cents': 650000}, {'label': 'Sales tax', 'cents': 52000},
              {'label': 'Lumpkin County hotel-motel tax', 'cents': 52000}, {'label': 'Georgia hotel-motel fee', 'cents': 1000}],
    'total_cents': 755000, 'modes': ['deposit', 'full'],
    'plans': {'deposit': [{'kind': 'deposit', 'label': 'Retainer', 'amount_cents': 377500, 'due_on': None},
                          {'kind': 'balance', 'label': 'Balance', 'amount_cents': 377500, 'due_on': '2027-03-17'}],
              'full': [{'kind': 'full', 'label': '', 'amount_cents': 755000, 'due_on': None}]},
    'retainer_cents': 377500, 'balance_cents': 377500, 'balance_due': '2027-03-17',
    'pay_later': ['klarna'], 'check_in_time': '3:00 p.m.',
    'open_dates': [{'check_in': '2027-04-23', 'check_out': '2027-04-25'},
                   {'check_in': '2027-04-30', 'check_out': '2027-05-02'},
                   {'check_in': '2027-05-07', 'check_out': '2027-05-09'}],
    # The Forge's shape: "ask" is the default and moves no law; "hold" only on Mick's word.
    'hold': {'mode': 'ask', 'hours': None, 'until': None},
    'demo_line': 'A demo: an invented couple on invented dates, every number made up. Nothing is sent, held or charged.',
}
# The ceremony stop carries no clock time (the Forge: the record has no hour; it is settled together);
# the page prints the day's sunset beside it.
DEMO['days'][1]['stops'][1]['time'] = None
DEMO['days'][1]['stops'][2]['time'] = None


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
    <section class="lf-sec lf-parch eo" id="eo" data-api="{B.API}" data-stripe-key="{B.STRIPE_KEY}" data-phone="{PHONE}" aria-live="polite">
      <div class="eo__in">
        <p class="eo-wait" role="status" data-eo-wait></p>
        <noscript><p class="eo-noscript">{escape(NOT_READY, quote=False)}</p></noscript>
        <div class="eo-body" data-eo-body hidden></div>
      </div>
    </section>
    {photo_templates()}
    {words_block()}
'''
    return 'elopement-offer.html', h, gtm, body, '/book', True


def demo_page():
    """The demo page for the read, written from the built elopement-offer.html (see DEMO): the
    fixture in the words block, ready, in the engine's place; this module's styles and js/offer.js
    inline; no Tag Manager; its own title and canonical; the ribbon at the top."""
    html = open(os.path.join(B.ROOT, 'elopement-offer.html')).read()
    words = dict(WORDS, ready=True, not_ready=NOT_READY, demo=DEMO)
    block = json.dumps(words, ensure_ascii=False, sort_keys=True).replace('</', '<\\/')
    html, n = re.subn(r'<script type="application/json" id="lf-offer-words">.*?</script>',
                      lambda m: f'<script type="application/json" id="lf-offer-words">{block}</script>', html, flags=re.S)
    assert n == 1, 'one words block on the offer page'
    html = re.sub(r'\s*<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->', '', html, count=1, flags=re.S)
    html = re.sub(r'\s*<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->', '', html, count=1, flags=re.S)
    tag = '<script src="/js/offer.js" defer></script>'
    assert tag in html, 'the offer page loads /js/offer.js'
    js = open(os.path.join(B.ROOT, 'js', 'offer.js')).read().replace('</script', '<\\/script')
    # gatehouse.js is deferred, so the inline copy waits for it.
    html = html.replace(tag, '<script>document.addEventListener("DOMContentLoaded", function () {\n' + js + '\n});</script>')
    html = html.replace('</head>', '<style>\n' + CSS.strip() + '\n</style>\n</head>', 1)
    demo_url = f'https://loxleyforest.com/private/{DEMO_FOLDER}/'
    html = re.sub(r'<title>[^<]*</title>', '<title>A demo of the Invitation | Loxley Forest</title>', html, count=1)
    html = html.replace(f'<link rel="canonical" href="{URL}">', f'<link rel="canonical" href="{demo_url}">', 1)
    html = html.replace(f'<meta property="og:url" content="{URL}">', f'<meta property="og:url" content="{demo_url}">', 1)
    html = html.replace('data-lf-path="/elopement/offer"', f'data-lf-path="/private/{DEMO_FOLDER}"', 1)
    html = html.replace('<main id="main">', '<main id="main">\n  <p class="eo-demo">' + escape(DEMO['demo_line'], quote=False) + '</p>', 1)
    folder = os.path.join(B.ROOT, 'private', DEMO_FOLDER)
    os.makedirs(folder, exist_ok=True)
    open(os.path.join(folder, 'index.html'), 'w').write(html)
    print('wrote', f'private/{DEMO_FOLDER}/index.html', len(html))


PAGES = [page_offer]
AFTER = [demo_page]

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
.eo-wait, .eo-noscript { margin: 0; font-size: 18px; line-height: 1.55; color: var(--bark); text-align: center; }
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
.v2[data-lf-path="/elopement/offer"] .book-fab, .v2[data-lf-path^="/private/invitation-demo"] .book-fab { display: none; }

/* ---- The Invitation grown (2026-11-11): the demo ribbon, Mick's word, the day hour by hour, the
   photographs, the price to the dollar, the open dates, the hold. Shown only when the engine sends
   each field. ---- */
.eo-demo { margin: 0; padding: 10px 16px; background: var(--gold, #c4a265); color: var(--ink); font-family: 'Montserrat', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; text-align: center; line-height: 1.5; }
.eo-sun { margin: 0; font-size: 15px; color: var(--stone); }
.eo-note { position: relative; padding: 26px 24px 22px; background: var(--white); border: 1px solid var(--parchment); }
.eo-note::before { content: '\\201C'; position: absolute; left: 14px; top: -4px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 64px; line-height: 1; color: var(--gold, #c4a265); }
.eo-note p { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: clamp(1.25rem, 4.6vw, 1.5rem); line-height: 1.4; color: var(--forest-deep); }
.eo-days { display: grid; gap: 26px; }
.eo-day { display: grid; gap: 10px; }
.eo-day__h { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: 1.5rem; line-height: 1.15; color: var(--forest-deep); }
.eo-day__sun { margin: 0; font-family: 'Montserrat', Arial, sans-serif; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--stone); }
.eo-stops { margin: 4px 0 0; padding: 0; list-style: none; display: grid; border-left: 1px solid var(--driftwood); }
.eo-stop { position: relative; padding: 10px 0 14px 22px; }
.eo-stop::before { content: ''; position: absolute; left: -5px; top: 19px; width: 9px; height: 9px; border-radius: 50%; background: var(--gold, #c4a265); box-shadow: 0 0 0 3px var(--parchment); }
.eo-stop__time { display: block; font-family: 'Montserrat', Arial, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: var(--forest); }
.eo-stop__title { display: block; margin-top: 2px; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: 1.35rem; line-height: 1.15; color: var(--forest-deep); }
.eo-stop__words { margin: 4px 0 0; font-size: 16px; line-height: 1.5; color: var(--bark); }
.eo-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0; }
.eo-photo { margin: 0; overflow: hidden; aspect-ratio: 4 / 3; background: var(--parchment); }
.eo-photo:first-child { grid-column: 1 / -1; aspect-ratio: 16 / 10; }
.eo-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.eo-price { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--driftwood); }
.eo-price li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--parchment); font-size: 16px; color: var(--bark); }
.eo-price li span:last-child { font-variant-numeric: tabular-nums; white-space: nowrap; }
.eo-dates-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.eo-date { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border: 1px solid var(--driftwood); background: var(--cream); font-size: 15px; color: var(--forest-deep); text-decoration: none; }
.eo-date:hover, .eo-date:focus-visible { border-color: var(--forest-deep); background: var(--white); }
.eo-until { margin: 0; font-size: 14px; color: var(--stone); }
.eo-hold { margin: 0; padding: 14px 16px; border-left: 3px solid var(--gold, #c4a265); background: var(--cream); font-size: 16px; line-height: 1.5; color: var(--bark); }
'''
