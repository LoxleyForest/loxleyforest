#!/usr/bin/env python3
"""Before you book (the deep session of 2026-11-18, D6): the facts block, the call line's words, the
phone in the header, and the places the site disagreed with itself, as the builder writes them under
one hash and the Writer's seven facts.

    python3 scripts/site/check_before_you_book.py

Proves, from build_v2 and the built pages: both versions of the block carry the same keys and hash
apart (the hashes printed for Mick's yes); the block on /book shows exactly the lines whose facts are
settled, in the Writer's order, as short lines, and never a word from the Writer's must-not list;
with every fact a yes (rendered here in process, nothing written) all eight lines show, the FAQ says
the air mattress, every "within two hours" becomes "by evening, every day", and /book carries the
call line's words with the call link read from js/talk.js; with the facts unanswered (as shipped)
the gated lines are absent, the old sentences stand where the gate holds, and no page promises "by
evening"; the free fixes are in: no page says "fully equipped kitchen", "encourage you not to use
it", "coffee and seasonal treats", "a kitchen for morning coffee" or "four hundred feet through";
the forest kitchen and the wifi fact are on /faq and the live landing page; every page's header
carries the phone link once with the number; "heated" is not written anew (the word count on the
pages does not rise). Exit 1 names what is wrong. Standard library only.
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import build_v2 as B  # noqa: E402

bad, ok = [], []


def check(c, what):
    (ok if c else bad).append(what)


def pages():
    return sorted(n for n in os.listdir(ROOT) if n.endswith('.html'))


def text_of(name):
    return open(os.path.join(ROOT, name), encoding='utf-8').read()


def block_lines(html):
    m = re.search(r'<section class="lf-byb".*?</section>', html, re.S)
    if not m:
        return None
    return [re.sub(r'<[^>]+>', '', l).strip() for l in re.findall(r'<li>(.*?)</li>', m.group(0), re.S)]


def render_with(facts):
    """/book and /faq as the builder writes them with these answers, in process; restored after."""
    saved = dict(B.D6_FACTS)
    B.D6_FACTS.update(facts)
    try:
        import importlib
        # faq.py and book.py read d6() at import, so they are loaded afresh under these answers
        for name in ('lfpage_book', 'lfpage_faq'):
            sys.modules.pop(name, None)
        B.page_modules()
        _n, book = B.render(sys.modules['lfpage_book'].page_book)
        _n2, faq = B.render(sys.modules['lfpage_faq'].page_faq)
        return book, faq
    finally:
        B.D6_FACTS.clear(); B.D6_FACTS.update(saved)
        for name in ('lfpage_book', 'lfpage_faq'):
            sys.modules.pop(name, None)
        B.page_modules()


def main():
    B.page_modules()
    # the words
    keys = {v: frozenset(d) for v, d in B.D6_PASSAGES.items()}
    check(len(set(keys.values())) == 1 and set(keys) == {'A', 'B'}, 'versions A and B carry the same keys')
    hashes = {v: B.d6_sha256({**B.D6_WORDS, **B.D6_PASSAGES[v]}) for v in B.D6_PASSAGES}
    check(hashes['A'] != hashes['B'] and hashes[B.D6_VERSION] == B.d6_sha256(), 'the two versions hash apart; the build is version ' + B.D6_VERSION)
    for k in B.D6_BLOCK:
        low = B.D6_WORDS[k].lower()
        check(not any(n.lower() in low for n in B.D6_NEVER), 'the block never says one of the Writer\'s must-nots: ' + k)
    check(all(not re.search('[–—]', v) for v in B.D6_WORDS.values()), 'no dash in any word')
    check('heated' not in B.D6_WORDS['kitchen'].lower() + B.D6_WORDS['wifi'].lower() + B.D6_WORDS['included_kitchen'].lower(), 'the settled sentences do not write "heated" anew')
    print('before-you-book: version %s; words sha256 B %s; A %s; facts answered: %s' % (
        B.D6_VERSION, hashes['B'], hashes['A'], ', '.join(k for k, v in B.D6_FACTS.items() if v is not None) or 'none'))

    # as built, in the shipped state
    book = text_of('book.html')
    lines = block_lines(book)
    want = [B.D6_WORDS[k] for k in B.D6_BLOCK if B.d6_ok(k)]
    check(lines is not None and lines == [re.sub(r'&amp;', '&', w) for w in want] or (lines == want), 'the block shows exactly the settled lines, in order: %d of %d' % (len(lines or []), len(B.D6_BLOCK)))
    check(book.index('class="lf-byb"') < book.index('id="gatehouse"'), 'the block sits above the calendar, so above every price')
    check(('lf-ask-words' in book) == B.d6_ok('ask_price'), 'the call line\'s words are on /book only with fact 7\'s yes (now: %s)' % ('yes' if B.d6_ok('ask_price') else 'unanswered'))
    all_html = {n: text_of(n) for n in pages()}
    for n, h in all_html.items():
        check(h.count('class="lf-hdr__tel"') == 1 and '706-502-4823</span>' in h, 'the header carries the phone once: ' + n)
    gone = ('fully equipped kitchen', 'encourage you not to use it', 'coffee and seasonal treats', 'a kitchen for morning coffee', 'four hundred feet through')
    for g in gone:
        where = [n for n, h in all_html.items() if g in h]
        check(not where, 'no page says "%s"%s' % (g, (': ' + ', '.join(where)) if where else ''))
    faq = all_html['faq.html']
    check(B.D6_WORDS['kitchen'].replace("'", '&#x27;') in faq or B.D6_WORDS['kitchen'] in faq, '/faq says the forest kitchen')
    check(B.D6_WORDS['wifi'].replace("'", '&#x27;') in faq or B.D6_WORDS['wifi'] in faq, '/faq says the wifi fact')
    rga = all_html.get('romantic-getaways-near-atlanta.html', '')
    check(B.D6_WORDS['wifi'].replace("'", '&#x27;') in rga or B.D6_WORDS['wifi'] in rga, 'the live landing page says the wifi fact too')
    check(B.D6_WORDS['walk_day'] in book, '/book\'s day says the walk of five to ten minutes')
    two_hours = [n for n, h in all_html.items() if 'within two hours' in h]
    if B.d6_ok('reply'):
        check(not two_hours, 'with fact 7\'s yes no page says "within two hours"')
    else:
        check(set(two_hours) == {'book.html', 'index.html', 'treehouses.html', 'experiences.html'} and not any('by evening' in h for h in all_html.values()),
              'until fact 7, the four fallback lines keep "within two hours" and no page promises "by evening"')
    # "heated" not written anew: the count on main's pages is the count now
    try:
        before = subprocess.run(['git', 'show', 'main:faq.html'], cwd=ROOT, capture_output=True, text=True).stdout.lower().count('heated')
        before_t = subprocess.run(['git', 'show', 'main:treehouses.html'], cwd=ROOT, capture_output=True, text=True).stdout.lower().count('heated')
        check(faq.lower().count('heated') <= before and all_html['treehouses.html'].lower().count('heated') <= before_t, '"heated" is not written anew on /faq or /treehouses')
    except Exception as e:  # noqa: BLE001
        check(False, 'could not read main\'s pages: %r' % e)

    # every fact a yes
    book_y, faq_y = render_with({k: True for k in B.D6_FACTS})
    lines_y = block_lines(book_y)
    check(lines_y == [B.D6_WORDS[k] for k in B.D6_BLOCK], 'with every fact a yes, all eight lines show in the Writer\'s order')
    check('lf-ask-words' in book_y and B.call_link().startswith('https://calendar.google.com/') and B.call_link() in book_y, 'and /book carries the call line\'s words with the call link from js/talk.js')
    check(B.D6_WORDS['ask_price'] in book_y.replace('\\/', '/').replace('&#x27;', "'") or 'Still deciding?' in book_y, 'the price line is in the words block')
    check('within two hours' not in book_y and B.D6_WORDS['reply'] in book_y, 'and /book says "by evening, every day" in place of "within two hours"')
    check(B.D6_WORDS['sleeps_faq'] in faq_y, 'and /faq names the air mattress')
    # every fact a no: the gate holds
    book_n, faq_n = render_with({k: False for k in B.D6_FACTS})
    check(block_lines(book_n) == [B.D6_WORDS[k] for k in B.D6_BLOCK if B.D6_WAITS.get(k) is None], 'with every fact a no, only the free lines show')
    check('lf-ask-words' not in book_n and 'within two hours' in book_n and 'sleeps 4 comfortably' in faq_n, 'and the old sentences stand where the gate holds')

    print('check_before_you_book: %d ok, %d wrong' % (len(ok), len(bad)))
    for b in bad:
        print('  WRONG: ' + b)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
