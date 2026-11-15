#!/usr/bin/env python3
"""The reel's next step on the giveaway pages (the Chief's route of 2026-11-14): the entered page
ends in a passage and three tagged links, the rules page carries one tagged line under the form.

    python3 scripts/site/check_next_step.py

Proves, from the page module and the built files: the Writer's two versions (PASSAGES) carry the
same keys and each has its own words hash, printed for Mick's yes; the three tags are plain tokens
the engine's funnel keeps, one a page; every link's page exists and is not noindex; the entered page's
note reads the draw line, the line that keeps the entry apart from any booking, then the passage, and
its actions are exactly the three links, every one tagged NEXT_TAG, "Return home" and "nothing to do"
gone, no link on the page tagged for another page, the doors row off (or on and tagged NEXT_TAG); the
rules page carries the one line once, under the form, its two links tagged RULES_TAG, its doors still
tagged SITE_TAG and nothing tagged NEXT_TAG; the next step's words never say odds, chance, champagne,
deal or save (the Writer's must-nots, Counsel's rule); version A renders the same shape. Says whether
the form is open or waits on APPROVED_SHA256. Exit 1 names what is wrong. Standard library only.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import build_v2 as B  # noqa: E402

TOKEN = re.compile(r'^[a-z0-9_-]{1,40}$')
MUST_NOT = re.compile(r'\b(odds|chances?|champagne|deal|save)\b', re.I)
bad = []
notes = []


def check(ok, what):
    (notes if ok else bad).append(what)


def links_in(html):
    return re.findall(r'<a\b[^>]*\bhref="([^"]*)"[^>]*>(.*?)</a>', html, re.S)


def main():
    B.page_modules()
    gw = sys.modules['lfpage_giveaway']
    e = lambda k: B.escape(gw.WORDS[k], quote=False) if hasattr(B, 'escape') else gw.escape(gw.WORDS[k], quote=False)
    tagged = gw.tagged

    # The versions and their hashes.
    keys = {v: set(d) for v, d in gw.PASSAGES.items()}
    check(len(keys) == 2 and len(set(map(frozenset, keys.values()))) == 1, 'the two versions carry the same keys')
    check(gw.NEXT_VERSION in gw.PASSAGES, 'NEXT_VERSION names a version: %r' % gw.NEXT_VERSION)
    hashes = {v: gw.words_sha256({**gw.WORDS, **gw.PASSAGES[v]}) for v in gw.PASSAGES}
    check(hashes[gw.NEXT_VERSION] == gw.words_sha256(), 'the built words are version %s' % gw.NEXT_VERSION)
    check(hashes['A'] != hashes['B'], 'the two versions hash apart')

    # The tags.
    tags = {'SITE_TAG': gw.SITE_TAG, 'NEXT_TAG': gw.NEXT_TAG, 'RULES_TAG': gw.RULES_TAG}
    for n, t in tags.items():
        check(bool(TOKEN.match(t)), '%s %r is a plain token the funnel keeps' % (n, t))
    check(len(set(tags.values())) == 3, 'one tag a page')

    # The pages the links lead to.
    hrefs = [h for h, _k in gw.NEXT_ACTIONS] + list(gw.NEXT_FORM_HREFS.values()) + [h for h, _a, _b in gw.DOORS]
    for h in sorted(set(hrefs)):
        f = os.path.join(ROOT, 'index.html' if h == '/' else h.lstrip('/') + '.html')
        ok = os.path.exists(f)
        check(ok, 'the page %s exists' % h)
        if ok:
            check('content="noindex' not in open(f, encoding='utf-8').read(), 'the page %s is not noindex' % h)

    # The words.
    for v, d in gw.PASSAGES.items():
        for k, s in d.items():
            check(not MUST_NOT.search(s), 'version %s %s never says odds, chance, champagne, deal or save' % (v, k))
            check(not re.search('[–—]', s), 'version %s %s has no dash' % (v, k))
    for k in ('entered_1', 'next_apart', 'next_form_line'):
        s = gw.WORDS[k]
        check(not MUST_NOT.search(s), '%s never says odds, chance, champagne, deal or save' % k)
        check(not re.search('[–—]', s), '%s has no dash' % k)
    check('nothing to do' not in gw.WORDS['entered_1'], '"there\'s nothing to do" is gone from the draw line')
    check(gw.WORDS['next_apart'].startswith('Your entry stands on its own.'), 'the entry stands apart before any door')
    check('no entry needed' not in gw.WORDS['next_form_line'].lower(), 'the form line never pairs the draw with a stay')

    # The entered page, as built.
    ent = open(os.path.join(ROOT, 'giveaway-entered.html'), encoding='utf-8').read()
    note = re.search(r'<section class="lf-sec lf-dark lf-note".*?</section>', ent, re.S)
    check(bool(note), 'the entered page carries the note')
    note = note.group(0) if note else ''
    body = re.findall(r'<p>(.*?)</p>', re.search(r'<div class="lf-body">(.*?)</div>', note, re.S).group(1) if '<div class="lf-body">' in note else '', re.S)
    want = [e('entered_1'), e('next_apart'), e('next_p')]
    check(body == want, 'the note reads the draw line, the entry apart, then the passage (%d paragraphs)' % len(body))
    acts = re.search(r'<div class="lf-actions">(.*?)</div>', note, re.S)
    acts = links_in(acts.group(1)) if acts else []
    want_acts = [(tagged(h, gw.NEXT_TAG), e(k)) for h, k in gw.NEXT_ACTIONS]
    check(acts == want_acts, 'the actions are the three links, each tagged %s: %s' % (gw.NEXT_TAG, ', '.join(a for _h, a in acts)))
    check('Return home' not in note and 'nothing to do' not in note, 'no "Return home" and no "nothing to do" on the entered page')
    for h, _t in links_in(ent):
        if '?src=' in h or '&src=' in h:
            check(h.endswith('src=' + gw.NEXT_TAG), 'every tagged link on the entered page is %s: %s' % (gw.NEXT_TAG, h))
    doors = re.findall(r'class="gw-door" href="([^"]*)"', ent)
    if gw.ENTERED_DOORS:
        check(len(doors) == len(gw.DOORS) and all(d.endswith('src=' + gw.NEXT_TAG) for d in doors), 'the doors row is on and tagged %s' % gw.NEXT_TAG)
    else:
        check(not doors, 'the doors row is off on the entered page (ENTERED_DOORS False)')
    check('gw-next-line' not in ent, 'the form line is not on the entered page')

    # The rules page, as built.
    rules = open(os.path.join(ROOT, 'giveaway.html'), encoding='utf-8').read()
    lines = re.findall(r'<p class="gw-next-line">(.*?)</p>', rules, re.S)
    check(len(lines) == 1, 'the rules page carries the one line once')
    if lines:
        merged = gw.w('next_form_line', **{k: tagged(h, gw.RULES_TAG) for k, h in gw.NEXT_FORM_HREFS.items()})
        check(lines[0] == merged, 'the line is the Writer\'s, its links tagged %s' % gw.RULES_TAG)
        entry = re.search(r'<div class="gw-entry">.*?</section>', rules, re.S).group(0)
        check(entry.index('</form>') < entry.index('gw-next-line'), 'the line sits under the form, inside the entry box')
        check(rules.index('gw-next-line') < rules.index('class="gw-doors"'), 'the line sits above the doors row')
    for d in re.findall(r'class="gw-door" href="([^"]*)"', rules):
        check(d.endswith('src=' + gw.SITE_TAG), 'the rules page\'s doors stay tagged %s: %s' % (gw.SITE_TAG, d))
    check('src=' + gw.NEXT_TAG not in rules, 'nothing on the rules page is tagged %s' % gw.NEXT_TAG)

    # Version A renders the same shape.
    saved = dict(gw.WORDS)
    try:
        gw.WORDS.update(gw.PASSAGES['A'])
        _n, html = B.render(gw.page_giveaway_entered)
        a_acts = links_in(re.search(r'<div class="lf-actions">(.*?)</div>', html, re.S).group(1))
        check(gw.escape(gw.PASSAGES['A']['next_p'], quote=False) in html and
              a_acts == [(tagged(h, gw.NEXT_TAG), gw.escape(gw.WORDS[k], quote=False)) for h, k in gw.NEXT_ACTIONS],
              'version A renders the same shape with its own words')
    finally:
        gw.WORDS.clear(); gw.WORDS.update(saved)

    state = 'open' if gw.ready() else 'closed until APPROVED_SHA256 names the hash below'
    print('check_next_step: version %s built; the form is %s; %d wrong' % (gw.NEXT_VERSION, state, len(bad)))
    for v in sorted(hashes):
        print('  words sha256, version %s: %s' % (v, hashes[v]))
    for b in bad:
        print('  WRONG: ' + b)
    print('  %d ok' % len(notes))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
