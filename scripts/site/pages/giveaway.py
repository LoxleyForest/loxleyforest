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
OPEN = False
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
    'entered_1': ('We draw on Monday, December 14. If it\'s you, you\'ll hear from mic@loxleyforest.com, '
                  'and from nowhere else. Until then, there\'s nothing to do.'),
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
# The bridge, as the reel shows it, over the rules and on the entered page (the one photograph).
# The photograph over the rules and on the entered page: Mick's daylight aerial (2026-11-08, about
# 22:35 ET, "consider one of these photos instead"), the rope bridge running into the deck and the
# canvas peak through the green canopy in late sun; the wide frame on a desk, the upright one on a
# phone (images/v2/giveaway-bridge*, through scripts/site/v2img.py). The alt is true of both and is
# not in WORDS, so his yes by hash stands. Before it: aerial-bridge, the reel's golden-hour frame.
BRIDGE_PHOTO = ('giveaway-bridge', 'From above: the hundred-foot rope bridge through the canopy to the treehouse')
BRIDGE_PHONE = 'giveaway-bridge-tall'
DOORS = (('/book?src=giveaway-site', 'door_stay', 'door_stay_p'),
         ('/elopements?src=giveaway-site', 'door_elope', 'door_elope_p'),
         ('/gift?src=giveaway-site', 'door_give', 'door_give_p'))


def doors_html():
    e = lambda k: escape(WORDS[k], quote=False)
    items = ''.join(f'\n        <a class="gw-door" href="{href}"><strong>{e(h)}</strong><span>{e(p)}</span></a>' for href, h, p in DOORS)
    return f'''
    <nav class="gw-doors" aria-labelledby="gw-doors-h">
      <p class="lf-eyebrow" id="gw-doors-h">{e('doors_h')}</p>
      <div class="gw-doors__row">{items}
      </div>
    </nav>'''
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
        print(f'giveaway: the form is closed; words sha256 {words_sha256()} (APPROVED_SHA256 '
              f'{"matches" if APPROVED_SHA256 == words_sha256() else "unset or stale"}; OPENS {OPENS!r}; '
              f'ADDRESS {"set" if ADDRESS else "unset"}; OPEN {OPEN})')
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
        <p class="gw-closed" id="gw-after" hidden>{e('closed_after')}</p>{form_html(open_now)}
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
    body = c.note(e('entered_eyebrow'), e('entered_h'), e('entered_lead'), [e('entered_1')],
                  B.pic(BRIDGE_PHOTO[0], BRIDGE_PHOTO[1], '(min-width: 900px) 50vw, 100vw', eager=True, phone=BRIDGE_PHONE))
    # The Marketer's move (the table of 2026-11-07): the open nights, in place of the treehouse link.
    old = '<a href="/treehouses" class="lf-link">See the treehouse</a>'
    assert body.count(old) == 1, 'the thank-you note lost its second link; the entered page replaces it'
    body = body.replace(old, f'<a href="/book?src=giveaway-site" class="lf-link">{e("entered_link")}</a>')
    # and the three doors on (2026-11-08), under the note
    body += f'''
    <section class="lf-sec lf-parch" aria-label="{e('doors_h')}">
      <div class="lf-wrap">{doors_html()}
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
.lf-form .gw-check input[type="checkbox"] { width: 20px; height: 20px; margin: 4px 0 0; padding: 0; flex: none; accent-color: var(--forest-deep); }
.gw-closed { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.3rem; line-height: 1.5; color: var(--stone); margin: 0; }
.gw-closed + .gw-form { margin-top: 28px; }

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
