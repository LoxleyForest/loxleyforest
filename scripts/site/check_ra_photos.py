#!/usr/bin/env python3
"""Romantic Atlanta's stills on /treehouses (build_v2.RA_PHOTOS), in both states of its switch.

    python3 scripts/site/check_ra_photos.py

Proves: the switch is one line; the page built in the shipped state is the file on disk; off, no
image from the shoot (images/v2/ra-*) is on the page; on, every photograph the page names exists,
every image carries alt text in words (no em dash), the two hero preloads name the hero's own two
files, the hero's width and height are the desktop file's, no file the page names is over the
direction's 500 KB line (DIRECTION.md, the weight budget), the set a phone takes on a full scroll
is under 1,024 KB, and the home page is the same in both states (treehouse_two() shares the
second-treehouse block with it). Nothing is written.
"""
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
shipped = re.findall(r'^RA_PHOTOS = (True|False)$', src, re.M)
check(len(shipped) == 1, 'the switch is one line; shipped RA_PHOTOS = ' + (shipped[0] if shipped else '?'))
SHIPPED_ON = shipped == ['True']

IMG = re.compile(r'<img\b[^>]*>')
ATTR = lambda tag, a: (re.search(r'\b' + a + r'="([^"]*)"', tag) or [None, None])[1]  # noqa: E731
KB = lambda p: os.path.getsize(os.path.join(ROOT, p)) // 1024  # noqa: E731


def phone_set(main):
    """The image files a 390 px phone takes on a full scroll: each <picture>'s phone source, else
    the <img>'s own src (pic() gives a phone the 800 or a crop, never the 1600)."""
    files = []
    rest = main
    for m in re.finditer(r'<picture>(.*?)</picture>', main, re.S):
        p = m.group(1)
        s = re.search(r'<source media="\(max-width: 767px\)" srcset="([^" ]+)', p)
        files.append(s.group(1) if s else ATTR(re.search(r'<img\b[^>]*>', p).group(0), 'src'))
        rest = rest.replace(m.group(0), '')
    for tag in IMG.findall(rest):
        s = ATTR(tag, 'src')
        if s and s.startswith('images/v2/'):
            files.append(s)
    return files


home = {}
for on in (False, True):
    B.RA_PHOTOS = on
    state = 'on' if on else 'off'
    name, html = B.render(B.page_treehouses)
    home[on] = B.render(B.page_index)[1]
    main = html[html.index('<main id="main">'):html.index('</main>')]
    named = sorted(set(re.findall(r'images/v2/[a-z0-9_-]+\.webp', html)))
    ra = [p for p in named if p.startswith('images/v2/ra-')]
    if on == SHIPPED_ON:
        check(html == open(os.path.join(ROOT, 'treehouses.html'), encoding='utf-8').read(), state + ' (shipped): the built page is treehouses.html on disk')
    if not on:
        check(not ra, 'off: no image from the shoot on the page')
    else:
        check(len(ra) >= 10, 'on: the hero and the photographs are the shoot\'s (%d files from images/v2/ra-*)' % len(ra))
        check(all(os.path.exists(os.path.join(ROOT, p)) for p in named), 'on: every image the page names exists')
        heavy = [(p, KB(p)) for p in named if os.path.exists(os.path.join(ROOT, p)) and KB(p) > 500]
        check(not heavy, 'on: no file the page names is over 500 KB' + (' (%s)' % heavy if heavy else ''))
        tags = IMG.findall(main)
        alts = [ATTR(t, 'alt') for t in tags]
        check(all(a and a.strip() for a in alts), 'on: every image on the page carries alt text (%d images)' % len(tags))
        check(not any('—' in (a or '') or ' - ' in (a or '') for a in alts), 'on: no em dash in any alt text')
        hero = re.search(r'<section class="lf-hero lf-hero--page".*?</section>', main, re.S).group(0)
        hero_img = IMG.search(hero).group(0)
        hero_phone = re.search(r'<source media="\(max-width: 767px\)" srcset="([^"]+)"', hero).group(1)
        pre = re.findall(r'<link rel="preload" as="image" type="image/webp" href="([^"]+)" media="\(([a-z-]+): 76[78]px\)" fetchpriority="high">', html)
        check(sorted(pre) == sorted([(ATTR(hero_img, 'src'), 'min-width'), (hero_phone, 'max-width')]), 'on: the two preloads name the hero\'s desktop file and its phone file (%s)' % pre)
        from PIL import Image
        w, h = Image.open(os.path.join(ROOT, ATTR(hero_img, 'src'))).size
        check(ATTR(hero_img, 'width') == str(w) and ATTR(hero_img, 'height') == str(h), 'on: the hero\'s width and height are the file\'s (%dx%d)' % (w, h))
        check('fetchpriority="high"' in hero_img and 'loading="lazy"' not in hero_img, 'on: the hero is fetched first, never lazy')
        phone = phone_set(main)
        total = sum(KB(p) for p in phone if os.path.exists(os.path.join(ROOT, p)))
        check(total <= 1024, 'on: a phone\'s full scroll takes %d KB in %d images (the budget: under 1,024 KB)' % (total, len(phone)))
        for p in phone:
            print('         ' + p + ' ' + str(KB(p)) + ' KB')
        srcs = set(ATTR(t, 'src') for t in tags if ATTR(t, 'src') and ATTR(t, 'src').startswith('images/v2/'))
        check(len(srcs) == len([t for t in tags if ATTR(t, 'src') and ATTR(t, 'src').startswith('images/v2/')]), 'on: no photograph is used twice on the page')
        for slot, val in B.TREEHOUSE_PHOTOS[True].items():
            pairs = val if isinstance(val, list) else [val]
            for n, a in pairs:
                check(os.path.exists(os.path.join(ROOT, f'images/v2/{n}-800.webp')) and bool(a.strip()), 'on: slot %s: images/v2/%s-800.webp with its alt' % (slot, n))

check(home[False] == home[True], 'the home page is the same in both states')
B.RA_PHOTOS = SHIPPED_ON

print('\n%s' % ('all good' if not fails else '%d FAILED' % fails))
sys.exit(1 if fails else 0)
