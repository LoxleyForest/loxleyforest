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
OPENS = None
# The draw's seed and winning entry number, in the Forge's words, once drawn. None: not yet.
RESULT = None

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
                '2027. The winner chooses from those still open when they claim the prize.'),
    'prize_2': ('The Dawn Table on your first morning: champagne brunch carried across the bridge to your door. '
                'Champagne is for guests 21 or older. And pizza night, as on every stay: fresh dough waiting '
                'in the treehouse.'),
    'prize_3': ('Approximate retail value: $1,565, the dearest of the four weekends at our rates on November 7, '
                '2026, with the Dawn Table. The prize has no cash value, cannot be exchanged or transferred, '
                'and is for the winner\'s own stay, booked with us under our usual booking agreement. Any '
                'taxes on the prize are the winner\'s.'),
    'enter_h': 'How to enter',
    'enter_1': ('Fill in the form below. That is the whole of it. No purchase, no follow, no tag, no share, and '
                'nothing you buy improves your chances.'),
    'enter_2': ('One entry per person. A second entry from the same email address does not count, and dots or a '
                'plus-tag in a Gmail address do not make it a different address. If an entry lands in our spam '
                'filter, we check it by hand before the draw. Entries after the close are not counted.'),
    'enter_3': 'Entries open {{opens}} and close on Sunday, December 13, 2026, at 11:59 PM Eastern Time.',
    'who_h': 'Who can enter',
    'who_1': ('Anyone 18 or older who lives in the United States. Not our own household, nor anyone who works '
              'with us at Loxley Forest or lives with them.'),
    'draw_h': 'The draw',
    # The seed source named before entries open, so it cannot be chosen once the entries are known
    # (the Critic by way of the Forge, 2026-11-07): the NIST Randomness Beacon's pulse at noon
    # Eastern on the draw day. [MICK RATIFIES] the beacon; the Forge's draw matches the rule below.
    'draw_1': ('On Monday, December 14, 2026, we draw one entry number. The seed is the NIST Randomness '
               'Beacon\'s pulse at 12:00 PM Eastern Time that day, a number the US government publishes every '
               'minute and nobody can pick. The winning entry number is that pulse divided by the number of '
               'entries, remainder plus one. We publish the pulse, the number of entries and the winning number '
               'on this page, so anyone can check the draw. Odds depend on the number of entries.'),
    'draw_2': ('The winner hears from us by email, from an @loxleyforest.com address and from nowhere else, and '
               'we never ask for money. They have 72 hours to claim the weekend. If they do not, we draw the '
               'next number.'),
    'result': 'The draw: {{result}}',
    'details_h': 'Your details',
    'details_1': ('We use your first name and email to run the giveaway and to reach the winner, and for nothing '
                  'else, unless you tick the letters box. Our <a href="/privacy">privacy page</a> says how we '
                  'keep them.'),
    'meta_h': 'Instagram',
    'meta_1': ('This giveaway is not sponsored, endorsed or administered by, or associated with, Instagram or '
               'Meta. By entering, you release Instagram of any responsibility for it.'),
    'sponsor': 'Sponsor: Loxley Forest LLC, Dahlonega, Georgia. Questions: stay@loxleyforest.com.',
    'form_h': 'Enter',
    'first_name': 'First name',
    'email': 'Email',
    'eligible': 'I am 18 or older and live in the United States.',
    'letters': ('Yes, send me Loxley Forest\'s letters: a few a year, about the forest and what is new. Not '
                'needed to enter. Stop them any time.'),
    'submit': 'Enter the giveaway',
    'closed_soon': 'Entries are not open yet. When they are, the form will be right here.',
    'closed_after': ('Entries closed on Sunday, December 13. The draw is Monday, December 14, and the result '
                     'will be posted on this page.'),
    'entered_eyebrow': 'Entered',
    'entered_h': 'You\'re in.',
    'entered_lead': 'We have your entry. One counts per email address.',
    'entered_1': ('We draw on Monday, December 14. If it\'s you, you\'ll hear from an @loxleyforest.com address, '
                  'and from nowhere else. Until then, there\'s nothing to do.'),
}
# The SHA-256 of WORDS (words_sha256) once Mick has approved every word. None: not yet.
APPROVED_SHA256 = None


def words_sha256(words=None):
    """The hash Mick's approval names: WORDS as canonical JSON."""
    return hashlib.sha256(json.dumps(words or WORDS, ensure_ascii=False, sort_keys=True)
                          .encode('utf-8')).hexdigest()


def ready():
    return APPROVED_SHA256 is not None and words_sha256() == APPROVED_SHA256 and bool(OPENS)


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
              f'{"matches" if APPROVED_SHA256 == words_sha256() else "unset or stale"}; OPENS {OPENS!r})')
    opens = f'on {OPENS}' if OPENS else 'soon'
    e = lambda k, **m: escape(w(k, **m), quote=False)
    result = f'\n      <p class="gw-result">{e("result", result=RESULT)}</p>' if RESULT else ''
    closed_soon = '' if open_now else f'\n        <p class="gw-closed" id="gw-soon">{e("closed_soon")}</p>'
    body = f'''
    <section class="lf-sec lf-dark lf-legal-top" aria-labelledby="gw-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow">{e('eyebrow')}</p>
        <h1 class="lf-h1" id="gw-h">{e('h1')}</h1>
        <p class="lf-lead">{e('lead')}</p>
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
      <h2>{e('who_h')}</h2>
      <p>{e('who_1')}</p>
      <h2>{e('draw_h')}</h2>
      <p>{e('draw_1')}</p>
      <p>{e('draw_2')}</p>{result}
      <h2>{e('details_h')}</h2>
      <p>{w('details_1')}</p>
      <h2>{e('meta_h')}</h2>
      <p>{e('meta_1')}</p>
      <p class="lf-legal-sign">{e('sponsor')}</p>
      </div>
      <div class="gw-entry">{closed_soon}
        <p class="gw-closed" id="gw-after" hidden>{e('closed_after')}</p>{form_html(open_now)}
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
                  B.pic('eq3a0907', 'The treehouse at dusk, its canvas glowing, the rope bridge strung with lights', '(min-width: 900px) 50vw, 100vw', eager=True))
    return 'giveaway-entered.html', head, gtm, body, '/book', False


PAGES = [page_giveaway, page_giveaway_entered]

CSS = '''
.gw .lf-legal__text .gw-result { margin-top: 1em; font-family: 'Montserrat', sans-serif; font-size: 0.95rem; letter-spacing: 0.02em; }
.gw-entry { max-width: 40rem; margin: clamp(40px, 6vw, 64px) auto 0; }
.gw-fields { border: 0; padding: 0; margin: 0; display: grid; gap: 22px; min-width: 0; }
.gw-h2 { margin: 0 0 4px; padding: 0; }
.lf-form label.gw-check { display: flex; gap: 12px; align-items: flex-start; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.15rem; font-weight: 400; letter-spacing: 0; text-transform: none; line-height: 1.5; color: var(--bark); cursor: pointer; }
.lf-form .gw-check input[type="checkbox"] { width: 20px; height: 20px; margin: 4px 0 0; padding: 0; flex: none; accent-color: var(--forest-deep); }
.gw-closed { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.3rem; line-height: 1.5; color: var(--stone); margin: 0; }
.gw-closed + .gw-form { margin-top: 28px; }
'''
