"""/giveaway: the January giveaway's rules and its entry form, and /giveaway-entered, where the
form lands (the Chief's route, 2026-11-07, on Mick's "we just do our own"; the table of 2026-11-03,
chief docs/briefs/2026-11-03-table-january-giveaway.md, Counsel's list at its line 93 and the
Critic's fix; Counsel's memo loxley-rescue docs/briefs/2026-10-27-counsel-giveaway-and-gift-promotions.md,
G1 and the rules list at its line 71).

The prize: two nights, Friday and Saturday, on the weekend of Jan 8, 15, 22 or 29, 2027, with the
Dawn Table; free entry by this form only, one entry each; entries close Sun Dec 13, 2026, 11:59 PM
ET; the draw Mon Dec 14 by entry number with the seed published; 72 hours to claim, then the next
number. No purchase, no follow, no tag, no share.

THE FORM is the engine's contract (the workshop Forge, 2026-11-07): a Netlify form named
"giveaway" with first_name (required), email (required, one entry per address), eligible (a
checkbox, value yes, required; its label is the rules' line), letters (a checkbox, value yes, NOT
required and unticked: the separate consent to the house's letters), src (hidden, filled from the
landing URL's ?src=, a plain token [a-z0-9_-]{1,40}, else "direct"), and the honeypot. It lands on
/giveaway-entered, never on a path holding /success, so no inquiry conversion counts an entry
(scripts/site/check_forms.py NOT_INQUIRY). scripts/site/check_giveaway.py holds the form to this.

THE WORDS. Every sentence a visitor reads on either page is in WORDS below and only there. They go
to Mick's ear; until he has said yes, APPROVED_SHA256 is None and the form is closed: it is in the
file so Netlify registers it, but hidden and disabled, with the closed line in its place. When he
has, set APPROVED_SHA256 to the hash the builder prints (words_sha256) and OPENS to the day he says
"live", rebuild, and the form opens. Any change to a word closes it again until approved again.
After the close (the page's own clock, and the engine refuses late entries) the form gives way to
the closed line. RESULT, after the draw, is the seed and the winning entry number the Forge
publishes; the page shows it only once set. Merge values: {{opens}}, {{result}}.

SHADOW: noindex, not in sitemap.xml, linked from no nav; Mick says "live" and the seat links it.
"""
import hashlib
import json
import sys
from html import escape

import build_v2 as B

URL = 'https://loxleyforest.com/giveaway'
ENTERED_URL = 'https://loxleyforest.com/giveaway-entered'
# Entries close Sun Dec 13, 2026, 11:59:59 PM Eastern (UTC-5): the page's clock, in the script below.
CLOSE_UTC = (2026, 11, 14, 4, 59, 59)  # JavaScript's month is 0-based: 11 is December.
# The day and hour the form opens, in words ("Thursday, November 12, 2026, at 9 AM Eastern Time"), set
# when Mick says "live" and only after the engine's giveaway_open is on (the Critic, 2026-11-07:
# until then the engine refuses every entry while the page would say "You're in"). None: not yet.
OPENS = 'Thursday, November 12, 2026, at 9 AM Eastern Time'  # Mick, 2026-11-08 by the Chief (the sheet's line 2)
# The Thursday flip (the Chief, 2026-11-08): Mick runs the engine's open line on Thu Nov 12 at 9 AM
# ET, then this and js/giveaway-popup.js LIVE go true in one push and the form opens. False: the
# form stays closed though the words are approved, the address set and the open day named.
# FLIPPED 2026-11-12 about 10:15 ET: Mick ran the open line himself at about 10:12 (the droplet:
# "giveaway open: entries are kept from now to the start of 2026-12-14"; "giveaway OPEN; 0 entries"),
# the Chief routed the push. The words' "9 AM" stays as approved: entries were not open before it.
OPEN = True
# Dec 14, two lines from the engine through Mick and the Chief, numbers only (the Forge, 2026-11-07):
# FROZEN, the count fixed before the pulse ("N entries, at <time UTC>"), published here before noon
# ET; RESULT, after the draw ("pulse <outputValue> index <i>; N entries; winning entry W; alternates
# A, B, C"). Both are values outside the words' hash. None: not yet.
FROZEN = None
RESULT = None
# The sponsor's mailing address, required by O.C.G.A. 10-1-393(b)(16) (Counsel, 2026-11-07, chief
# docs/briefs/2026-11-07-counsel-giveaway-champagne.md): the LLC's registered office on file with the
# Secretary of State, or a PO box rented before Nov 11; Mick's choice, brought by the Chief, never
# taken from a guest-facing file. A merge value, not a word in the hash, so his yes on the words
# survives it. The form does not open without it. None: not yet.
ADDRESS = '154 Hilburn Rd, Dahlonega, Georgia 30533'  # the LLC's registered office, public; Mick's choice (a), 2026-11-08 by the Chief
ADDRESS_PLACEHOLDER = '[mailing address], Dahlonega, Georgia [ZIP]'

# =============================================================================================
# WORDS. From the table memo (2026-11-03) and the site's own pages: gift-card.html's Dawn Table
# line, experiences.html's dough, the FAQ's eighteen; the value from the Marketer's live quote of
# 2026-11-07 (chief docs/briefs/2026-11-07-marketer-giveaway-own-channels.md: $1,300.02 all in plus
# the Dawn Table's $265); after the Critic's read of 2026-11-07 (no hold stated that the engine is
# not making; the seed published, not "checkable"; an @loxleyforest.com address; champagne 21 or
# older; one entry per address on the entered page). No dashes. Waiting on Mick's ear.
# =============================================================================================
WORDS = {
    'title': 'The January giveaway | Loxley Forest',
    'desc': 'Two nights in the treehouse this January, with the Dawn Table, on us. Free to enter. The rules, and the form.',
    'eyebrow': 'A January weekend, on us',
    'h1': 'Two nights in the trees. Free to enter.',
    'lead': ('One winner spends a Friday and Saturday night in the treehouse this January, with the Dawn Table '
             'carried across the bridge on the first morning. Nothing to buy, follow, tag or share. One entry '
             'each, by the form below.'),
    'prize_h': 'The prize',
    'prize_1': ('Two nights in the treehouse, Friday and Saturday, on the weekend of January 8, 15, 22 or 29, '
                '2027. The winner chooses from those still open when they claim the prize. If all four are '
                'booked, any open Friday and Saturday through March 2027.'),
    'prize_2': ('The Dawn Table on your first morning: champagne brunch carried across the bridge to your door. '
                'Champagne is for guests 21 or older. And pizza night, as on every stay: fresh dough waiting '
                'in the treehouse.'),
    'prize_3': ('Approximate retail value: $1,565, the dearest of the four weekends at our rates on November 7, '
                '2026, with the Dawn Table. Odds depend on the number of entries. The winner pays nothing to '
                'claim or take the stay. The prize has no cash value, cannot be exchanged or transferred, and '
                'is for the winner\'s own stay, booked with us under our usual booking agreement. Any income '
                'tax on the prize is the winner\'s.'),
    'enter_h': 'How to enter',
    'enter_1': ('Fill in the form below. That is the whole of it. No purchase, no follow, no tag, no share, and '
                'nothing you buy improves your chances.'),
    'enter_2': ('One entry per person. A second entry from the same email address does not count. A plus-tag in '
                'any address, or dots in a Gmail address, do not make it a different address. Entries after the '
                'close do not count, nor does an entry without the eligibility box ticked.'),
    'enter_3': 'Entries open {{opens}} and close on Sunday, December 13, 2026, at 11:59 PM Eastern Time.',
    # The numbering the draw's rule rests on, as the engine does it (the Forge, 2026-11-07).
    # The spam rule as the engine codes it (the Forge, by the Chief, 2026-11-07 evening): a held entry
    # counts unless struck as not a person before the freeze, and takes the next number when counted.
    'enter_4': ('Entries are numbered 1, 2, 3 and so on in the order we count them, with no gaps. Entries our '
                'spam filter holds are counted unless we strike them as not a person before the count is fixed; '
                'a held entry takes the next number when it is counted. Entries that do not count are never '
                'numbered.'),
    'who_h': 'Who can enter',
    'who_1': ('Anyone 21 or older who lives in the United States. Not our own household, nor anyone who works '
              'with us at Loxley Forest or lives with them.'),
    'draw_h': 'The draw',
    # The seed source named before entries open, so it cannot be chosen once the entries are known
    # (the Critic by way of the Forge, 2026-11-07): the NIST Randomness Beacon's pulse at noon
    # Eastern on the draw day. [MICK RATIFIES] the beacon; the Forge's draw matches the rule below.
    # The count frozen before the pulse (the Forge's `freeze`, by 11:00 AM ET), the beacon's field,
    # its time in UTC, where to find it, and the fallback if the beacon misses the minute (the Forge,
    # 2026-11-07, after the Critic). [MICK RATIFIES] with the rest.
    'draw_1': ('On Monday, December 14, 2026, we draw one entry number. The number of entries is fixed and '
               'published here by 11:00 AM Eastern Time that day, before the pulse. The seed is the NIST '
               'Randomness Beacon\'s pulse at 12:00 PM Eastern Time, 17:00:00 UTC, that day: its outputValue, '
               '128 hexadecimal digits, published by the US government at beacon.nist.gov, which nobody can '
               'pick. If the beacon publishes no pulse for that minute, we use the first pulse it publishes '
               'after it.'),
    'draw_1b': ('The winning entry number is that outputValue, read as a hexadecimal number, divided by the '
                'number of entries, remainder plus one. We publish the pulse\'s value and index, the number of '
                'entries and the winning number on this page, so anyone can check the draw.'),
    'draw_2': ('The winner hears from us by email, from mic@loxleyforest.com and from nowhere else, and '
               'we never ask for money. They have 72 hours to claim the weekend. If they do not, the next entry '
               'number up wins, wrapping around to 1 after the last, and so on for up to three alternates.'),
    'frozen': 'The number of entries, fixed before the pulse: {{frozen}}.',
    'result': 'The draw: {{result}}.',
    'details_h': 'Your details',
    'details_1': ('We use your first name and email to run the giveaway and to reach the winner, and for nothing '
                  'else, unless you tick the letters box. Our <a href="/privacy">privacy page</a> says how we '
                  'keep them.'),
    'meta_h': 'Instagram',
    'meta_1': ('This giveaway is not sponsored, endorsed or administered by, or associated with, Instagram or '
               'Meta. By entering, you release Instagram of any responsibility for it.'),
    'sponsor': 'Sponsor: Loxley Forest LLC, {{address}}. Questions: stay@loxleyforest.com.',
    'form_h': 'Enter',
    'first_name': 'First name',
    'email': 'Email',
    'eligible': 'I am 21 or older and live in the United States.',
    'letters': ('Yes, send me Loxley Forest\'s letters: a few a year, about the forest and what is new. Not '
                'needed to enter. Stop them any time.'),
    'submit': 'Enter the giveaway',
    'closed_soon': 'Entries are not open yet. When they are, the form will be right here.',
    'closed_after': ('Entries closed on Sunday, December 13. The draw is Monday, December 14, and the result '
                     'will be posted on this page.'),
    # The invitation (js/giveaway-popup.js, the table of 2026-11-07): the card's words, the folded
    # line after a dismissal, the quiet line under /book's hero, and the entered page's link to
    # the open nights (the Marketer's move). All in this one hash.
    'popup_h': 'Two nights in the trees. Free to enter.',
    'popup_p': ('A January weekend at the treehouse, with the Dawn Table, on us. Worth about $1,565. Odds '
                'depend on the number of entries.'),
    'popup_button': 'See the giveaway',
    'popup_close': 'Close',
    'popup_fold': 'A January weekend, on us. Free to enter.',
    'popup_fold_link': 'See the giveaway',
    'book_line': 'A January weekend, on us. Two nights in the trees, free to enter.',
    'book_link': 'See the giveaway',
    'entered_link': 'See the open nights',
    'entered_eyebrow': 'Entered',
    'entered_h': 'You\'re in.',
    'entered_lead': 'We have your entry. One counts per email address.',
    # The next step (the Chief's route of 2026-11-14, chief docs/routes/loxleyforest/2026-11-14-reel-
    # next-step.md; Mick from Disney: turn the reel's views into bookings or elopements; the Writer's
    # draft 1, version B, chief docs/drafts/2026-11-14-writer-reel-next-step.md): "Until then, there's
    # nothing to do." gives way to the line that keeps the entry apart from any booking (Counsel's rule,
    # visible before any door), the passage, and three links in the actions' place: the open nights,
    # a proposal, an elopement. Version A, the restrained one, is the fallback (PASSAGES, NEXT_VERSION).
    # The one line under the form on the rules page is the Writer's draft 2. The links' hrefs sit
    # outside the hash, as the doors' do, tagged by page (NEXT_TAG, RULES_TAG). Every one of these
    # words moves the hash, so they reach Mick's ear by it with the rest.
    'entered_1': ('We draw on Monday, December 14. If it\'s you, you\'ll hear from mic@loxleyforest.com, '
                  'and from nowhere else.'),
    'next_apart': 'Your entry stands on its own. Nothing you book or buy changes it.',
    'next_form_line': ('Here for the treehouse itself? See <a href="{{nights}}">the open nights</a>, or '
                       '<a href="{{elopement}}">an elopement on the bridge</a>.'),
    # The reel's door (the Marketer's teardown and the Critic's site-audit sheet, 2026-11-08, the Chief's
    # route): the bridge they just watched, and three doors on, on /giveaway and on /giveaway-entered.
    # The links carry ?src=giveaway-site, as the entered page's open-nights link does. Behind the
    # gate with the rest: these words change the hash, so they reach Mick's ear with the others.
    'doors_h': 'While you’re here',
    'door_stay': 'Stay',
    'door_stay_p': 'The open nights, and what each costs.',
    'door_elope': 'Elope',
    'door_elope_p': 'Your vows on the bridge, or by the fire.',
    'door_give': 'Give a stay',
    'door_give_p': 'The Golden Arrow: nights in the trees, as a gift.',
}
# The passage and the two links' words, in the Writer's two versions; Mick picks one by its hash.
PASSAGES = {
    'A': {'next_p': ('If a night up here is on your mind anyway, the calendar shows which are open and what '
                     'each costs. Some couples come for an anniversary. Some come to ask a question halfway '
                     'across the bridge. Some come to be married by the fire.'),
          'next_ask': 'Asking the question',
          'next_vows': 'Elopements'},
    'B': {'next_p': ('If the bridge stayed with you, here is what it does at dusk. The small warm lights come '
                     'on, and the treehouse glows at the far end like a lantern somebody lit for you. Couples '
                     'cross it for an anniversary, to ask a question halfway over, or to say their vows by '
                     'the fire.'),
          'next_ask': 'Ask on the bridge',
          'next_vows': 'Your vows by the fire'},
}
NEXT_VERSION = 'B'  # the Chief's pick to build, 2026-11-14; A stays ready
WORDS.update(PASSAGES[NEXT_VERSION])
# The bridge, as the reel shows it, over the rules and on the entered page (the one photograph).
# The photograph over the rules and on the entered page: Mick's daylight aerial (2026-11-08, about
# 22:35 ET, "consider one of these photos instead"), the rope bridge running into the deck and the
# canvas peak through the green canopy in late sun; the wide frame on a desk, the upright one on a
# phone (images/v2/giveaway-bridge*, through scripts/site/v2img.py). The alt is true of both and is
# not in WORDS, so his yes by hash stands. Before it: aerial-bridge, the reel's golden-hour frame.
BRIDGE_PHOTO = ('giveaway-bridge', 'From above: the hundred-foot rope bridge through the canopy to the treehouse')
BRIDGE_PHONE = 'giveaway-bridge-tall'
# The source tags the links carry (?src=, the engine's funnel token, [a-z0-9_-]{1,40}), one a page,
# so the engine reads the entered page's clicks apart from the rules page's (the Chief's route of
# 2026-11-14: the bio link's visits picked dates 0 times, and the one tag hid where they stopped).
# giveaway-site is named in the engine (counts.SOURCES, clock.SOURCE_NAMES); giveaway-entered and
# giveaway-rules are kept raw by the funnel and read as "other" in the named counts until the Forge
# adds them there.
SITE_TAG = 'giveaway-site'        # the rules page's doors
NEXT_TAG = 'giveaway-entered'     # every link on the entered page
RULES_TAG = 'giveaway-rules'      # the one line under the form on the rules page
DOORS = (('/book', 'door_stay', 'door_stay_p'),
         ('/elopements', 'door_elope', 'door_elope_p'),
         ('/gift', 'door_give', 'door_give_p'))


def tagged(href, tag):
    return f'{href}?src={tag}'


def doors_html(tag=SITE_TAG):
    e = lambda k: escape(WORDS[k], quote=False)
    items = ''.join(f'\n        <a class="gw-door" href="{tagged(href, tag)}"><strong>{e(h)}</strong><span>{e(p)}</span></a>' for href, h, p in DOORS)
    return f'''
    <nav class="gw-doors" aria-labelledby="gw-doors-h">
      <p class="lf-eyebrow" id="gw-doors-h">{e('doors_h')}</p>
      <div class="gw-doors__row">{items}
      </div>
    </nav>'''


# The next step's links (2026-11-14): the entered page's three actions, in the "Return home / See the
# open nights" pair's place, and the two in the line under the form. Hrefs outside the hash, each
# tagged by its page. The "While you're here" row on the entered page is off: two of its three
# doors would repeat the actions right above it (the seat's call, 2026-11-14; one line brings it
# back, tagged NEXT_TAG); the rules page keeps its row.
NEXT_ACTIONS = (('/book', 'entered_link'),
                ('/where-to-propose-north-georgia', 'next_ask'),
                ('/elopements', 'next_vows'))
NEXT_FORM_HREFS = {'nights': '/book', 'elopement': '/elopements'}
ENTERED_DOORS = False


def next_line_html():
    """The one line under the form on the rules page, outside the form's wrapper so it stays when
    the form gives way to the closed line."""
    merged = w('next_form_line', **{k: tagged(href, RULES_TAG) for k, href in NEXT_FORM_HREFS.items()})
    return f'\n        <p class="gw-next-line">{merged}</p>'
# The SHA-256 of WORDS (words_sha256) once Mick has approved every word. None: not yet.
# Mick's yes, 2026-11-08 about 22:35 ET by the Chief, to the page as he read it on his phone.
APPROVED_SHA256 = '4de06ad37e1a5fb1a723e5ce507344506999fbc92278cd0ee28037ebdd215766'


def words_sha256(words=None):
    """The hash Mick's approval names: WORDS as canonical JSON."""
    return hashlib.sha256(json.dumps(words or WORDS, ensure_ascii=False, sort_keys=True)
                          .encode('utf-8')).hexdigest()


def ready():
    return APPROVED_SHA256 is not None and words_sha256() == APPROVED_SHA256 and bool(OPENS) and bool(ADDRESS) and OPEN


# The invitation's photograph: the treehouse at dusk (the thank-you pages' own), with its alt text.
POPUP_PHOTO = ('images/v2/eq3a0907-800.webp', 'The treehouse at dusk, its canvas glowing, the rope bridge strung with lights')


def popup_words_block():
    """The invitation's words as JSON in a page, for js/giveaway-popup.js (build_v2 writes it on the
    pages that load the script). The script holds no words of its own. '</' is escaped so nothing in
    it can close the tag."""
    data = {'h': WORDS['popup_h'], 'p': WORDS['popup_p'], 'button': WORDS['popup_button'],
            'close': WORDS['popup_close'], 'fold': WORDS['popup_fold'], 'foldLink': WORDS['popup_fold_link'],
            'photo': POPUP_PHOTO[0], 'photoAlt': POPUP_PHOTO[1],
            # The form's state, so the card and /book's line show only while entries are open (the
            # Critic, 2026-11-07): open is ready() at build; closes is the close, in JavaScript's
            # Date.UTC order, read by the visitor's clock.
            'open': ready(), 'closes': list(CLOSE_UTC)}
    body = json.dumps(data, ensure_ascii=False, sort_keys=True).replace('</', '<\\/')
    return f'  <script type="application/json" id="lf-gw-words">{body}</script>\n'


def book_line_html():
    """/book's quiet line under its hero (pages/book.py): in the page, hidden; js/giveaway-popup.js
    reveals it while LIVE and points its link by the visit's route. Never a card on /book."""
    # No href in the file: while the form is closed no page may link /giveaway (check_giveaway.py);
    # the script sets the link by the visit's route when it reveals the line.
    return (f'<p class="lf-gw-line" id="lf-gw-line" hidden>{escape(WORDS["book_line"], quote=False)} '
            f'<a data-gw-link>{escape(WORDS["book_link"], quote=False)}</a></p>')


def w(key, **merge):
    """A word, its merge values filled; HTML in WORDS is the author's (the privacy link)."""
    s = WORDS[key]
    for k, v in merge.items():
        s = s.replace('{{' + k + '}}', v)
    assert '{{' not in s, f'giveaway: {key} keeps a merge token'
    return s


# The page's own script: src from the landing URL (the engine's token rule, mirrored), and the
# close by the clock. No braces to escape: plain concatenation, not an f-string.
SCRIPT = ('<script>(function(){var m=/[?&]src=([^&#]*)/.exec(location.search);'
          'var v=m?decodeURIComponent(m[1].replace(/\\+/g," ")).trim().toLowerCase():"";'
          'if(!/^[a-z0-9_-]{1,40}$/.test(v))v="direct";'
          'var s=document.getElementById("gw-src");if(s)s.value=v;'
          'if(Date.now()>Date.UTC(' + ','.join(str(n) for n in CLOSE_UTC) + ')){'
          'var f=document.getElementById("gw-formwrap"),c=document.getElementById("gw-after");'
          'if(f)f.hidden=true;if(c)c.hidden=false;}})();</script>')


def form_html(open_now):
    """The Netlify form, in the file either way (so Netlify registers it); hidden and disabled
    until the words are approved and OPENS is set."""
    # The closed state sits on a wrapper, not on the <form> tag: Netlify rewrites the form tag it
    # processes at deploy, so an attribute there may not survive (seen 2026-11-07).
    state = '' if open_now else ' hidden'
    disabled = '' if open_now else ' disabled'
    return f'''
        <div id="gw-formwrap"{state}>
        <form class="lf-form lf-form--light gw-form" id="gw-form" name="giveaway" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" action="/giveaway-entered.html">
          <input type="hidden" name="form-name" value="giveaway">
          <input type="hidden" name="src" value="direct" id="gw-src">
          <p style="display:none;"><label>Don't fill this out: <input name="bot-field"></label></p>
          <fieldset class="gw-fields"{disabled}>
            <legend class="lf-h2 gw-h2">{escape(WORDS['form_h'], quote=False)}</legend>
            <div class="lf-form__row">
              <label for="gw-first-name">{escape(WORDS['first_name'], quote=False)}</label>
              <input type="text" id="gw-first-name" name="first_name" required autocomplete="given-name">
            </div>
            <div class="lf-form__row">
              <label for="gw-email">{escape(WORDS['email'], quote=False)}</label>
              <input type="email" id="gw-email" name="email" required autocomplete="email">
            </div>
            <label class="gw-check"><input type="checkbox" name="eligible" value="yes" required><span>{escape(WORDS['eligible'], quote=False)}</span></label>
            <label class="gw-check"><input type="checkbox" name="letters" value="yes"><span>{escape(WORDS['letters'], quote=False)}</span></label>
            <div class="lf-form__actions"><button type="submit" class="lf-btn lf-btn--forest">{escape(WORDS['submit'], quote=False)}</button></div>
          </fieldset>
        </form>
        </div>'''


def page_giveaway():
    head, gtm = sys.modules['lfpage_gift'].head_for(WORDS['title'], WORDS['desc'], URL, noindex=True)
    open_now = ready()
    if not open_now:
        other = 'A' if NEXT_VERSION == 'B' else 'B'
        print(f'giveaway: the form is closed; words sha256 {words_sha256()} (APPROVED_SHA256 '
              f'{"matches" if APPROVED_SHA256 == words_sha256() else "unset or stale"}; OPENS {OPENS!r}; '
              f'ADDRESS {"set" if ADDRESS else "unset"}; OPEN {OPEN}; the next step\'s version {NEXT_VERSION}; '
              f'with version {other} the hash would be {words_sha256({**WORDS, **PASSAGES[other]})})')
    opens = f'on {OPENS}' if OPENS else 'soon'
    e = lambda k, **m: escape(w(k, **m), quote=False)
    result = (f'\n      <p class="gw-result">{e("frozen", frozen=FROZEN)}</p>' if FROZEN else '') + (
              f'\n      <p class="gw-result">{e("result", result=RESULT)}</p>' if RESULT else '')
    closed_soon = '' if open_now else f'\n        <p class="gw-closed" id="gw-soon">{e("closed_soon")}</p>'
    body = f'''
    <section class="lf-sec lf-dark lf-legal-top gw-top" aria-labelledby="gw-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow">{e('eyebrow')}</p>
        <h1 class="lf-h1" id="gw-h">{e('h1')}</h1>
        <p class="lf-lead">{e('lead')}</p>
        <figure class="gw-bridge">{B.pic(BRIDGE_PHOTO[0], BRIDGE_PHOTO[1], '(min-width: 900px) 60vw, 100vw', eager=True, phone=BRIDGE_PHONE)}</figure>
      </div>
    </section>

    <section class="lf-sec lf-light lf-legal gw">
      <div class="lf-legal__text">
      <h2>{e('prize_h')}</h2>
      <p>{e('prize_1')}</p>
      <p>{e('prize_2')}</p>
      <p>{e('prize_3')}</p>
      <h2>{e('enter_h')}</h2>
      <p>{e('enter_1')}</p>
      <p>{e('enter_2')}</p>
      <p>{e('enter_3', opens=opens)}</p>
      <p>{e('enter_4')}</p>
      <h2>{e('who_h')}</h2>
      <p>{e('who_1')}</p>
      <h2>{e('draw_h')}</h2>
      <p>{e('draw_1')}</p>
      <p>{e('draw_1b')}</p>
      <p>{e('draw_2')}</p>{result}
      <h2>{e('details_h')}</h2>
      <p>{w('details_1')}</p>
      <h2>{e('meta_h')}</h2>
      <p>{e('meta_1')}</p>
      <p class="lf-legal-sign">{e('sponsor', address=ADDRESS or ADDRESS_PLACEHOLDER)}</p>
      </div>
      <div class="gw-entry">{closed_soon}
        <p class="gw-closed" id="gw-after" hidden>{e('closed_after')}</p>{form_html(open_now)}{next_line_html()}
      </div>
    </section>
    <section class="lf-sec lf-parch" aria-label="{e('doors_h')}">
      <div class="lf-wrap">{doors_html()}
      </div>
    </section>
    {SCRIPT}
'''
    return 'giveaway.html', head, gtm, body, '/book', False


def page_giveaway_entered():
    c = sys.modules['lfpage_confirmations']
    head, gtm = sys.modules['lfpage_gift'].head_for('Entered | Loxley Forest', WORDS['entered_lead'], ENTERED_URL, noindex=True)
    e = lambda k: escape(WORDS[k], quote=False)
    body = c.note(e('entered_eyebrow'), e('entered_h'), e('entered_lead'), [e('entered_1'), e('next_apart'), e('next_p')],
                  B.pic(BRIDGE_PHOTO[0], BRIDGE_PHOTO[1], '(min-width: 900px) 50vw, 100vw', eager=True, phone=BRIDGE_PHONE))
    # The three actions in the note's pair's place (2026-11-14; before it, the Marketer's move of
    # 2026-11-07 put the open nights in the treehouse link's place): every link on this page carries
    # NEXT_TAG, so the engine reads this page's clicks apart from the rules page's.
    old = '<div class="lf-actions"><a href="/" class="lf-link">Return home</a><a href="/treehouses" class="lf-link">See the treehouse</a></div>'
    assert body.count(old) == 1, 'the thank-you note lost its actions; the entered page replaces them'
    actions = ''.join(f'<a href="{tagged(href, NEXT_TAG)}" class="lf-link">{e(k)}</a>' for href, k in NEXT_ACTIONS)
    body = body.replace(old, f'<div class="lf-actions">{actions}</div>')
    if ENTERED_DOORS:
        body += f'''
    <section class="lf-sec lf-parch" aria-label="{e('doors_h')}">
      <div class="lf-wrap">{doors_html(NEXT_TAG)}
      </div>
    </section>
'''
    return 'giveaway-entered.html', head, gtm, body, '/book', False


PAGES = [page_giveaway, page_giveaway_entered]

CSS = '''
/* the reel's door (2026-11-08): the bridge over the rules, and three doors on */
.gw-top .lf-wrap { max-width: 60rem; }
.gw-bridge { margin: clamp(28px, 5vw, 44px) auto 0; max-width: 56rem; }
.gw-bridge img { display: block; width: 100%; height: auto; border-radius: 4px; box-shadow: 0 18px 50px rgba(10, 20, 10, 0.35); }
/* a phone takes the upright frame (800 x 1422) while the tag's width and height are the wide one's: the box is reserved upright so nothing jumps when it lands */
@media (max-width: 767px) { .gw-bridge img { aspect-ratio: 800 / 1422; } }
.gw-doors .lf-eyebrow { text-align: center; }
.gw-doors__row { display: grid; gap: 14px; margin-top: 18px; }
@media (min-width: 720px) { .gw-doors__row { grid-template-columns: repeat(3, 1fr); } }
.gw-door { display: grid; gap: 6px; padding: 20px 22px; min-height: 48px; background: var(--linen); border: 1px solid rgba(44, 34, 25, 0.12); text-decoration: none; color: var(--bark); }
.gw-door:hover, .gw-door:focus-visible { border-color: var(--forest-deep); outline: none; }
.gw-door:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 3px; }
.gw-door strong { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: 1.5rem; line-height: 1.15; color: var(--forest-deep); }
.gw-door span { font-size: 1rem; line-height: 1.45; color: var(--stone); }
.gw .lf-legal__text .gw-result { margin-top: 1em; font-family: 'Montserrat', sans-serif; font-size: 0.95rem; letter-spacing: 0.02em; }
.gw-entry { max-width: 40rem; margin: clamp(40px, 6vw, 64px) auto 0; }
.gw-fields { border: 0; padding: 0; margin: 0; display: grid; gap: 22px; min-width: 0; }
.gw-h2 { margin: 0 0 4px; padding: 0; }
.lf-form label.gw-check { display: flex; gap: 12px; align-items: flex-start; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.15rem; font-weight: 400; letter-spacing: 0; text-transform: none; line-height: 1.5; color: var(--bark); cursor: pointer; }
/* The browser draws the box and its tick (2026-11-13, an Instagram comment: "the boxes are not working").
   `.lf-form input` above strips the native look from every input (appearance none, min-height 52px,
   a border and a linen ground), so a ticked box looked empty and drew 20 by 52 px; a visitor tapped
   twice and unticked the required box. Proven by scripts/site/check_boxes.js. */
.lf-form .gw-check input[type="checkbox"] { width: 20px; height: 20px; min-height: 0; margin: 4px 0 0; padding: 0; border: 0; background: none; flex: none; -webkit-appearance: checkbox; appearance: auto; accent-color: var(--forest-deep); }
.gw-closed { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.3rem; line-height: 1.5; color: var(--stone); margin: 0; }
.gw-closed + .gw-form { margin-top: 28px; }
/* the next step (2026-11-14): the one line under the form on the rules page */
.gw-next-line { margin: 26px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.15rem; line-height: 1.5; color: var(--stone); }
.gw-next-line a { color: var(--forest-deep); font-weight: 600; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.gw-next-line a:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 2px; }

/* The invitation (js/giveaway-popup.js): a card at the corner on a desktop, a bottom sheet on a phone,
   never full screen; the folded line under the header after a dismissal; /book's quiet line. */
.lf-gw { position: fixed; right: 20px; bottom: 20px; z-index: 930; width: min(380px, calc(100vw - 40px)); background: var(--forest-deep); color: var(--on-dark); border-radius: 14px; box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.6); overflow: hidden; opacity: 0; transform: translateY(12px); transition: opacity 0.35s ease, transform 0.35s ease; pointer-events: none; }
.lf-gw.is-in { opacity: 1; transform: none; pointer-events: auto; }
.lf-gw:focus, .lf-gw:focus-visible { outline: none; }
.lf-gw__x { position: absolute; top: 8px; right: 8px; z-index: 1; width: 40px; height: 40px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: rgba(18, 29, 22, 0.55); color: var(--on-dark); cursor: pointer; }
.lf-gw__x:hover { background: rgba(18, 29, 22, 0.8); }
.lf-gw__x:focus-visible { outline: 2px solid var(--on-dark); outline-offset: 2px; }
.lf-gw__photo img { display: block; width: 100%; height: 150px; object-fit: cover; }
.lf-gw__in { padding: 18px 20px 20px; }
.lf-gw__h { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: 1.55rem; line-height: 1.15; color: var(--on-dark); }
.lf-gw__p { margin: 8px 0 0; font-size: 1rem; line-height: 1.5; color: var(--on-dark-muted); }
.lf-gw__btn { display: flex; width: 100%; min-height: 48px; margin-top: 14px; justify-content: center; align-items: center; }
.lf-gw.is-sheet { left: 0; right: 0; bottom: 0; width: auto; max-height: 70vh; max-height: 70svh; border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom, 0px); transform: translateY(100%); overflow-y: auto; }
.lf-gw.is-sheet.is-in { transform: none; }
.lf-gw.is-sheet .lf-gw__photo img { height: 120px; }
.lf-gwbar { position: fixed; top: calc(var(--hdr-h) + env(safe-area-inset-top, 0px)); left: 0; right: 0; z-index: 930; display: flex; flex-wrap: wrap; gap: 2px 12px; justify-content: center; align-items: center; padding: 9px 16px; background: var(--forest-deep); color: var(--on-dark-muted); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.05rem; line-height: 1.4; text-align: center; box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.5); }
.lf-gwbar a { color: var(--on-dark); font-weight: 600; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.lf-gw-line { margin: 18px auto 0; max-width: 36rem; font-size: 1.05rem; line-height: 1.5; color: var(--on-dark-muted); }
.lf-gw-line a { color: var(--on-dark); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
'''
