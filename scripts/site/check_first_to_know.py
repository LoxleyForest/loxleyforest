#!/usr/bin/env python3
"""The "first to know" sign-up (the deep session of 2026-11-18, D13): the footer's form is the
engine's contract, and nothing of it shows until the Writer's words are in and Mick has said yes.

    python3 scripts/site/check_first_to_know.py

Proves, from build_v2 and the built pages: the switch off (as shipped) leaves no form named
first-to-know on any page and no thanks page; the switch on (rendered here in process, nothing
written) puts the form in every page's footer with exactly the fields the Forge reads (form-name,
src, page, email, bot-field), email required, src defaulting to direct, posting to
/first-to-know-thanks (never a path holding /success) as a Netlify form with the honeypot and the
in-place handler, no ad-click field (it is not an inquiry), and the thanks page noindex, out of the
sitemap and carrying the words; check_forms.py keeps it off /success; and the words carry no
placeholder once the switch is on (the Writer's brackets fail the build state). Prints the words
hash for Mick's yes. Exit 1 names what is wrong. Standard library only.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import build_v2 as B  # noqa: E402

WANT_FIELDS = {'form-name', 'src', 'page', 'email', 'bot-field'}
bad, ok = [], []


def check(c, what):
    (ok if c else bad).append(what)


def attr(tag, name):
    m = re.search(r'\b%s=["\']([^"\']*)' % re.escape(name), tag, re.I)
    return m.group(1) if m else None


def forms_in(html):
    out = []
    for whole in re.findall(r'<form\b.*?</form>', html, re.I | re.S):
        tag = whole[:whole.index('>') + 1]
        if attr(tag, 'name') == B.FTK_FORM:
            out.append((tag, whole))
    return out


def main():
    mods = B.page_modules()
    root_pages = sorted(n for n in os.listdir(ROOT) if n.endswith('.html'))
    thanks_name = B.FTK_THANKS.lstrip('/') + '.html'

    # the file and the words
    check(B.FTK_THANKS and '/success' not in B.FTK_THANKS, 'the thanks path holds no /success: ' + B.FTK_THANKS)
    check(B.FTK_FORM in __import__('check_forms').NOT_INQUIRY, 'check_forms.py keeps %s off /success (NOT_INQUIRY)' % B.FTK_FORM)
    print('first-to-know: switch %s; words sha256 %s%s' % ('on' if B.FIRST_TO_KNOW else 'off', B.ftk_sha256(),
          '; the Writer\'s placeholders still stand' if B.ftk_placeholders() else ''))
    if B.FIRST_TO_KNOW:
        check(not B.ftk_placeholders(), 'the switch is on and no word is a placeholder')

    # as built on disk, in the shipped state
    shipped_forms = {n: forms_in(open(os.path.join(ROOT, n), encoding='utf-8').read()) for n in root_pages}
    if not B.FIRST_TO_KNOW:
        check(all(not f for f in shipped_forms.values()), 'off: no page carries the form')
        check(not os.path.exists(os.path.join(ROOT, thanks_name)), 'off: no thanks page is built')
    else:
        check(all(shipped_forms[n] for n in root_pages if n != thanks_name), 'on: every page carries the form')
        check(os.path.exists(os.path.join(ROOT, thanks_name)), 'on: the thanks page is built')

    # the on state, rendered here: the footer of the home page and the thanks page
    was = B.FIRST_TO_KNOW
    B.FIRST_TO_KNOW = True
    try:
        ftk = sys.modules['lfpage_first_to_know']
        _n, home = B.render(B.page_index)
        _n2, thanks = B.render(ftk.page_thanks)
    finally:
        B.FIRST_TO_KNOW = was
    fs = forms_in(home)
    check(len(fs) == 1, 'on: the home page carries the form once')
    if fs:
        tag, whole = fs[0]
        names = {}
        for inp in re.findall(r'<input\b[^>]*>', whole, re.I):
            n = attr(inp, 'name')
            if n:
                names[n] = inp
        check(set(names) == WANT_FIELDS, 'the fields are exactly the contract: %s' % ', '.join(sorted(names)))
        check(attr(names.get('email', ''), 'type') == 'email' and re.search(r'\brequired\b', names.get('email', '')), 'email is an email box, required')
        check(attr(names.get('src', ''), 'value') == 'direct' and 'data-lf-src' in names.get('src', ''), 'src defaults to direct and is filled by the page')
        check('data-lf-page' in names.get('page', ''), 'page is filled by the page')
        check(attr(tag, 'action') == B.FTK_THANKS, 'it posts to ' + B.FTK_THANKS)
        check(re.search(r'data-netlify=["\']true', tag) and attr(tag, 'data-netlify-honeypot') == 'bot-field' and 'data-lf-ajax' in tag, 'a Netlify form with the honeypot, posting in place')
        check('gclid' not in whole, 'no ad-click field: a sign-up is not an inquiry')
        check('[the Writer' not in whole or B.ftk_placeholders(), 'the words are the Writer\'s (or the placeholders are still marked)')
        check(whole.count('</label>') == 2 and '<label for="ftk-email">' in whole, 'one visible label, for the email box')
    check('name="robots" content="noindex' in thanks, 'the thanks page is noindex')
    check(B.FTK_THANKS not in open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read(), 'and not in sitemap.xml')
    check(B.FTK_WORDS['thanks_h'] in thanks.replace('&#x27;', "'") or B.FTK_WORDS['thanks_h'].replace("'", '&#x27;') in thanks, 'and carries its heading')
    check(not re.search(r'<form\b', thanks, re.I) or len(forms_in(thanks)) == 1, 'the thanks page carries no other form')
    check(not re.search('[–—]', B.FTK_WORDS['label'] + B.FTK_WORDS['done'] + B.FTK_WORDS['thanks_1']), 'no dash in the words')

    print('check_first_to_know: %d ok, %d wrong' % (len(ok), len(bad)))
    for b in bad:
        print('  WRONG: ' + b)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
