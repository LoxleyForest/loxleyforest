#!/usr/bin/env python3
"""Writes scripts/site/reviews_data.py, the reviews behind the click (/reviews), from the review list.

    python3 scripts/site/make_reviews_data.py [path/to/all.md]

The source is loxley-rescue docs/reviews/all.md (read only). Mick's rulings, 2026-10-23: the best
14 are in the carousel (build_v2.REVIEW_LIST); the rest of the five-star reviews sit behind a click;
the three four-star reviews stay off the site; the site never names a platform and shows no count.
FTC 16 CFR 465.7(b): reviews are left out by rating, so nothing may say or imply this is all of them.

Each entry is (id, text, credit, month). The text is the file's own characters (curly apostrophes
kept); paragraphs are joined by a blank line. Credit is the first name, plus " · town" where the
file shows one (Google shows none). Newest month first. Never edit reviews_data.py by hand: rerun
this, then scripts/site/check_reviews.py, which proves every quote verbatim against all.md.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT = os.path.join(HERE, '..', '..', '..', 'loxley-rescue', 'docs', 'reviews', 'all.md')
OUT = os.path.join(HERE, 'reviews_data.py')

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
          'September', 'October', 'November', 'December']

# The carousel's town style ("Atlanta, GA"), so a guest reads the same in both places.
STATES = {
    'Alabama': 'AL', 'Alaska': 'AK', 'California': 'CA', 'District of Columbia': 'DC', 'Florida': 'FL',
    'Georgia': 'GA', 'Maryland': 'MD', 'Mississippi': 'MS', 'New York': 'NY', 'Ohio': 'OH',
    'South Carolina': 'SC', 'Tennessee': 'TN', 'Utah': 'UT', 'Wisconsin': 'WI',
}

# Kept off the page by name, each with its reason:
KEEP_OFF = {
    # Jordan (July 2024) came to mark a late sister's birthday; the file's note says keep it off.
    'A62': "the file's note: keep it off (a late sister's birthday)",
}

# A review that names the treehouse's old name, "Archer in the Trees", stays off (2023 reviews).
OLD_NAME = re.compile(r'archer in the trees', re.I)

# The site never names a platform (Mick, 2026-10-23), and the text is never edited, so a review
# whose own words name one stays off rather than being cut. The Architect may rule a trim instead.
PLATFORM = re.compile(r'air\s*b\s*n\s*b|\bab&b\b|google|vrbo|hostfully|tripadvisor', re.I)

HEAD = re.compile(r'^### ([GA]\d+)\. (.+)$')


def parse(path):
    """Every review in the file: id, name, town, (year, month), stars, paragraphs."""
    lines = open(path, encoding='utf-8').read().split('\n')
    out, cur = [], None
    for line in lines:
        m = HEAD.match(line)
        if m or line.startswith('## '):
            if cur:
                out.append(cur)
            cur = None
        if not m:
            if cur is not None:
                cur['body'].append(line)
            continue
        rid, rest = m.groups()
        if rid.startswith('G'):
            # "Kathryne, Google, 2026-10-21 (Google: "2 days ago"), 5 stars"
            name, _, when = rest.split(', ', 3)[:3]
            stars = int(re.search(r'(\d) stars$', rest).group(1))
            d = re.match(r'(\d{4})-(\d\d)-\d\d', when)
            if d:
                ym = (int(d.group(1)), int(d.group(2)))
            else:
                mm = re.search(r'(' + '|'.join(MONTHS) + r') (\d{4})', when)
                ym = (int(mm.group(2)), MONTHS.index(mm.group(1)) + 1)
            town = ''
        else:
            # "John, Dahlonega, Georgia · Airbnb · August 2026 · 5 stars · stayed one night"
            parts = rest.split(' · ')
            who = parts[0]
            name, _, town = who.partition(', ')
            mm = re.match(r'(' + '|'.join(MONTHS) + r') (\d{4})$', parts[2])
            ym = (int(mm.group(2)), MONTHS.index(mm.group(1)) + 1)
            stars = int(re.match(r'(\d) stars$', parts[3]).group(1))
        cur = {'id': rid, 'name': name, 'town': town, 'ym': ym, 'stars': stars, 'body': []}
    if cur:
        out.append(cur)
    for r in out:
        paras = [p.strip() for p in '\n'.join(r['body']).split('\n\n')]
        r['paras'] = [re.sub(r'\s*\n\s*', ' ', p) for p in paras if p]
        assert r['paras'], r['id']
    return out


def short_town(town):
    if not town:
        return ''
    head, sep, tail = town.rpartition(', ')
    if sep and tail in STATES:
        return head + ', ' + STATES[tail]
    return town


def carousel():
    """The carousel's quotes, read from build_v2.py's REVIEW_LIST block (no import: no Pillow needed)."""
    src = open(os.path.join(HERE, 'build_v2.py'), encoding='utf-8').read()
    at = src.index('REVIEW_LIST = [')
    ns = {}
    exec(src[at:src.index('\n]\n', at) + 2], ns)
    return ns['REVIEW_LIST']


def flat(s):
    return re.sub(r'\s+', ' ', s)


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    reviews = parse(path)
    assert len(reviews) == 129, len(reviews)

    # The carousel's 14, matched by text: every part of a quote (split at " ... ") is in the review.
    in_carousel = {}
    for quote, credit in carousel():
        hits = [r['id'] for r in reviews if all(p in flat(' '.join(r['paras'])) for p in quote.split(' ... '))]
        assert len(hits) == 1, (credit, hits)
        in_carousel[hits[0]] = credit
    assert len(in_carousel) == 14, len(in_carousel)

    rows, off = [], []
    for r in reviews:
        text = '\n\n'.join(r['paras'])
        if r['stars'] != 5:
            off.append((r['id'], 'four stars: off the site (Mick, 2026-10-23)'))
        elif r['id'] in in_carousel:
            off.append((r['id'], 'in the carousel'))
        elif r['id'] in KEEP_OFF:
            off.append((r['id'], KEEP_OFF[r['id']]))
        elif OLD_NAME.search(text):
            off.append((r['id'], 'names the old name, "Archer in the Trees"'))
        elif PLATFORM.search(text):
            off.append((r['id'], 'its own words name a platform (%s)' % PLATFORM.search(text).group(0)))
        else:
            credit = r['name'] + (' · ' + short_town(r['town']) if r['town'] else '')
            month = '%s %d' % (MONTHS[r['ym'][1] - 1], r['ym'][0])
            rows.append((r['ym'], r['id'], text, credit, month))
    # Newest month first; within a month, the file's own order (sorted() is stable).
    rows = sorted(rows, key=lambda x: x[0], reverse=True)

    body = ('"""The reviews behind the click (/reviews). Written by scripts/site/make_reviews_data.py from\n'
            'loxley-rescue docs/reviews/all.md: never edit by hand. (id, text, credit, month), newest first.\n'
            'Paragraphs are joined by a blank line. scripts/site/check_reviews.py proves every text verbatim."""\n\n'
            'REVIEWS = [\n')
    for _, rid, text, credit, month in rows:
        body += '    (%r,\n     %r,\n     %r, %r),\n' % (rid, text, credit, month)
    body += ']\n'
    open(OUT, 'w', encoding='utf-8').write(body)
    for rid, why in off:
        if why != 'in the carousel':
            print('off  %-5s %s' % (rid, why))
    print('%d reviews written to %s (%d off the page, %d of them in the carousel)'
          % (len(rows), os.path.relpath(OUT), len(off), len(in_carousel)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
