#!/usr/bin/env python3
"""The elopement packages' order and their links, in both states of PACKAGE_ORDER_V2 (pages/elopements.py).

    python3 scripts/site/check_packages.py

Proves: as shipped the switch is one line and false; off, the cards read The Vow, Firelight, The
Crossing, then The Falls, as Mick placed them (2026-11-02); on (the Critic's site-audit sheet,
2026-11-08: high to low), The Crossing, The Vow, Firelight, then The Falls; in both states every
card's "Inquire for your date" link carries its package (data-package) into the form, the form's
options follow the cards' order with The Falls after them, and the built elopements.html matches the
shipped state. Nothing is written.
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


def load():
    spec = importlib.util.spec_from_file_location('lfpage_elopements_check', os.path.join(HERE, 'pages', 'elopements.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


src = open(os.path.join(HERE, 'pages', 'elopements.py'), encoding='utf-8').read()
shipped = re.findall(r'^PACKAGE_ORDER_V2 = (True|False)$', src, re.M)
check(len(shipped) == 1, 'the switch is one line; shipped PACKAGE_ORDER_V2 = ' + (shipped[0] if shipped else '?'))
SHIPPED_ON = shipped == ['True']

mod = load()
want = {False: ['The Vow', 'Firelight', 'The Crossing'], True: ['The Crossing', 'The Vow', 'Firelight']}
for on in (False, True):
    mod.PACKAGE_ORDER_V2 = on
    names = [p[0] for p in mod.ordered_packages()]
    check(names == want[on], ('on' if on else 'off') + ': the cards read ' + ', '.join(names))
    _, _, _, body, _, _ = mod.page_elopements()
    cards = re.findall(r'class="lf-h3 lf-pkg__name"[^>]*>([^<]*)<', body)
    check(cards == want[on] + ['The Falls'], ('on' if on else 'off') + ': built in that order, The Falls after them (' + ', '.join(cards) + ')')
    links = re.findall(r'<a href="#inquiry" class="lf-link lf-pkg__go"([^>]*)>', body)
    carried = [re.search(r'data-package="([a-z0-9-]+)"', a) for a in links]
    check(links and all(carried), ('on' if on else 'off') + ': every card\'s "Inquire for your date" link carries its package (' + ', '.join(m.group(1) for m in carried if m) + ')')
    options = re.findall(r'<option value="([a-z0-9-]+)"', body.split('id="el-package"')[1].split('</select>')[0])
    check(options[:3] == [mod.slug(n) for n in want[on]] and options[3] == mod.slug(mod.WATERFALL_NAME),
          ('on' if on else 'off') + ': the form\'s options follow the cards, The Falls after (' + ', '.join(options[:5]) + ')')

built = open(os.path.join(ROOT, 'elopements.html'), encoding='utf-8').read()
built_cards = re.findall(r'class="lf-h3 lf-pkg__name"[^>]*>([^<]*)<', built)
check(built_cards == want[SHIPPED_ON] + ['The Falls'], 'elopements.html as built matches the shipped state (' + ', '.join(built_cards) + ')')
check('From $2,500' not in built, 'no "From $2,500" lead on the page')

print('check_packages: %d failed' % fails)
sys.exit(1 if fails else 0)
