#!/usr/bin/env python3
""""Give a Stay" (build_v2.GIVE_A_STAY), in both states of its switch.

    python3 scripts/site/check_give_a_stay.py

Proves: as shipped the switch is one line and false; off, the header row and the menu carry the six
links as they were and no page carries "Give a Stay", the home band or the words "gift card"; on,
"Give a Stay" is the second link of the header row and the menu, the home page carries the band
after the reviews with the Marketer's line and a link to /gift, the band is left out of a build after
December 24 and carries the script that drops it after that day, and /gift's "What it is" opens with
the words "gift card". Nothing is written.
"""
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
os.chdir(ROOT)

fails = 0


def check(ok, what):
    global fails
    print(('  ok   ' if ok else '  FAIL ') + what)
    if not ok:
        fails += 1


import build_v2 as B  # noqa: E402

src = open(os.path.join(HERE, 'build_v2.py'), encoding='utf-8').read()
check(len(re.findall(r'^GIVE_A_STAY = (True|False)$', src, re.M)) == 1 and 'GIVE_A_STAY = False' in src,
      'the switch is one line, GIVE_A_STAY False as shipped')

for on in (False, True):
    B.GIVE_A_STAY = on
    links = re.findall(r'<a href="([^"]+)">([^<]+)</a>', B.nav_links())
    head = B.header('/book')
    if on:
        check(links[1] == ('/gift', 'Give a Stay') and len(links) == len(B.NAV) + 1, 'on: "Give a Stay" is the second link (' + ', '.join(t for _, t in links) + ')')
        check(head.count('<a href="/gift">Give a Stay</a>') == 2 and head.index('Give a Stay') < head.index('Experiences'), 'on: in the header row and the menu, second in each')
        band = B.give_band()
        check('id="give-a-stay"' in band and B.GIVE_BAND_LINE in band and 'href="/gift"' in band and 'data-until="2026-12-24"' in band and 's.remove()' in band,
              'on: the home band carries the Marketer\'s line, a link to /gift, its end date and the script that drops it after')
        saved = B.TODAY
        B.TODAY = '2026-12-25'
        check(B.give_band() == '', 'on: a build after December 24 leaves the band out')
        B.TODAY = saved
    else:
        check([t for _, t in links] == [t for _, t in B.NAV] and 'Give a Stay' not in head, 'off: the six links as they were, no "Give a Stay"')
        check(B.give_band() == '', 'off: no home band')

B.GIVE_A_STAY = False
index = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
gift = open(os.path.join(ROOT, 'gift.html'), encoding='utf-8').read()
pages = [n for n in os.listdir(ROOT) if n.endswith('.html')]
carrying = [n for n in pages if 'Give a Stay' in open(os.path.join(ROOT, n), encoding='utf-8').read()]
check(not carrying and 'give-a-stay' not in index, 'as built (shipped): no page carries "Give a Stay" or the band' + (': ' + ', '.join(carrying) if carrying else ''))
check('gift card' not in gift.lower().split('<script')[0] or 'ga-what__gift' not in gift, 'as built (shipped): /gift does not say "gift card" yet')

# /gift's line, as the page module writes it with the switch on (pages/gift.py reads B.GIVE_A_STAY)
spec = importlib.util.spec_from_file_location('lfpage_gift_check', os.path.join(HERE, 'pages', 'gift.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
B.GIVE_A_STAY = True
_, _, _, body, _, _ = mod.page_gift()
check('ga-what__gift' in body and 'gift card' in body and body.index('gift card') < body.index('ga-what__body') + 400, 'on: /gift\'s "What it is" opens with the words "gift card" (for Mick\'s ear)')
B.GIVE_A_STAY = False
_, _, _, body, _, _ = mod.page_gift()
check('ga-what__gift' not in body, 'off: /gift as it was')

print('check_give_a_stay: %d failed' % fails)
sys.exit(1 if fails else 0)
