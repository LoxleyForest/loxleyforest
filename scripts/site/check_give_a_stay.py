#!/usr/bin/env python3
""""Give a Stay" (build_v2.GIVE_A_STAY), in both states of its switch.

    python3 scripts/site/check_give_a_stay.py

Proves: as shipped the switch is one line and false; the header row keeps its six links in both
states (a seventh pushed the Book button off a 1280 px screen, the Critic measured; check_header_fit.js
lays it out); off, the menu carries the six, "Questions" and "The Golden Arrow", and no page carries
"Give a Stay", the home band or the words "gift card"; on, "Give a Stay" is the menu's second link
and /gift's one name there ("The Golden Arrow" leaves the menu, the footer keeps it), the home page
carries the band after the reviews with the Marketer's line and a link to /gift, the band is left out
of a build after December 24 and carries the script that drops it after that day, and /gift's "What
it is" opens with the words "gift card". Nothing is written.
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
shipped = re.findall(r'^GIVE_A_STAY = (True|False)$', src, re.M)
check(len(shipped) == 1, 'the switch is one line; shipped GIVE_A_STAY = ' + (shipped[0] if shipped else '?'))
SHIPPED_ON = shipped == ['True']

LINK = re.compile(r'<a href="([^"]+)">([^<]+)</a>')
for on in (False, True):
    B.GIVE_A_STAY = on
    head = B.header('/book')
    row = LINK.findall(re.search(r'<nav class="lf-hdr__nav" aria-label="Main">(.*?)</nav>', head, re.S).group(1))
    menu = LINK.findall(re.search(r'<nav aria-label="Menu">(.*?)</nav>', head, re.S).group(1))
    state = 'on' if on else 'off'
    check(row == list(B.NAV), state + ': the header row keeps its six links (' + ', '.join(t for _, t in row) + ')')
    gift_in_menu = [t for h, t in menu if h == '/gift']
    if on:
        check(menu[1] == ('/gift', 'Give a Stay') and gift_in_menu == ['Give a Stay'] and menu[-1] == ('/faq', 'Questions'),
              'on: the menu has "Give a Stay" second, /gift once, and ends with Questions (' + ', '.join(t for _, t in menu) + ')')
        band = B.give_band()
        check('id="give-a-stay"' in band and B.GIVE_BAND_LINE in band and 'href="/gift"' in band and 'data-until="2026-12-24"' in band and 's.remove()' in band,
              'on: the home band carries the Marketer\'s line, a link to /gift, its end date and the script that drops it after')
        saved = B.TODAY
        B.TODAY = '2026-12-25'
        check(B.give_band() == '', 'on: a build after December 24 leaves the band out')
        B.TODAY = saved
    else:
        check(menu == list(B.NAV) + [('/faq', 'Questions'), ('/gift', 'The Golden Arrow')] and 'Give a Stay' not in head,
              'off: the menu as it was, "The Golden Arrow" beside Questions, no "Give a Stay"')
        check(B.give_band() == '', 'off: no home band')

B.GIVE_A_STAY = SHIPPED_ON
index = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
gift = open(os.path.join(ROOT, 'gift.html'), encoding='utf-8').read()
pages = [n for n in os.listdir(ROOT) if n.endswith('.html')]
navved = [n for n in pages if 'aria-label="Menu"' in open(os.path.join(ROOT, n), encoding='utf-8').read()]
carrying = [n for n in navved if 'Give a Stay' in open(os.path.join(ROOT, n), encoding='utf-8').read()]
if SHIPPED_ON:
    check(len(carrying) == len(navved) and 'id="give-a-stay"' in index and B.GIVE_BAND_LINE in index,
          'as built (shipped on): every page with a menu carries "Give a Stay" (%d of %d), the home page its band with the Marketer\'s line' % (len(carrying), len(navved)))
    check('ga-what__gift' in gift and 'gift card' in gift, 'as built (shipped on): /gift says "gift card" where it explains the gift')
else:
    check(not carrying and 'give-a-stay' not in index, 'as built (shipped off): no page carries "Give a Stay" or the band' + (': ' + ', '.join(carrying) if carrying else ''))
    check('ga-what__gift' not in gift, 'as built (shipped off): /gift does not say "gift card" yet')

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
