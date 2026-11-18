"""/first-to-know-thanks: where the footer's "first to know" sign-up lands without script (the deep
session of 2026-11-18, D13). The form itself is build_v2.first_to_know_block(), in every page's
footer while build_v2.FIRST_TO_KNOW is on; its words and this page's are build_v2.FTK_WORDS, the
Writer's (due Nov 23), under one hash (ftk_sha256) for Mick's yes. Off, this page is not built
and the footer carries no form. noindex, not in sitemap.xml, linked from nowhere but the form.
"""
import sys
from html import escape

import build_v2 as B

URL = 'https://loxleyforest.com' + B.FTK_THANKS


def page_thanks():
    c = sys.modules['lfpage_confirmations']
    w = B.FTK_WORDS
    head, gtm = sys.modules['lfpage_gift'].head_for(w['thanks_title'], w['thanks_lead'], URL, noindex=True)
    body = c.note(escape(w['thanks_eyebrow'], quote=False), escape(w['thanks_h'], quote=False),
                  escape(w['thanks_lead'], quote=False), [escape(w['thanks_1'], quote=False)],
                  B.pic('eq3a0907', 'The treehouse at dusk, its canvas glowing, the rope bridge strung with lights', '(min-width: 900px) 50vw, 100vw', eager=True))
    return B.FTK_THANKS.lstrip('/') + '.html', head, gtm, body, '/book', False


state = 'on' if B.FIRST_TO_KNOW else 'off'
print(f'first-to-know: the sign-up is {state}; words sha256 {B.ftk_sha256()}'
      + ('; the Writer\'s placeholders still stand' if B.ftk_placeholders() else ''))
PAGES = [page_thanks] if B.FIRST_TO_KNOW else []
