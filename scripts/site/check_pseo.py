#!/usr/bin/env python3
"""The search landing pages, checked (scripts/site/pages/pseo.py builds them from scripts/site/pseo/).

    python3 scripts/site/check_pseo.py            the guards on the data; each page written is what the
                                                  data makes, nothing else of the generator's is left at
                                                  the root, the sitemap lists exactly the pages written;
                                                  each page's own words and its nearest sibling
    python3 scripts/site/check_pseo.py --prove    breaks one page for each guard and shows it refused
                                                  (and one fact row with a drive time, which must pass)
    python3 scripts/site/check_pseo.py --preview DIR
                                                  every page, held ones too, into DIR (never inside the
                                                  repository) for Mick's eye: a banner on each page that
                                                  is not written, saying why

Exit 1 when a page is refused for a reason that is not a hold (words Mick has not heard, a slot
still to fill, a fact row to read again), when a page on disk is not what the data makes, or when the sitemap disagrees.
The review list is loxley-rescue docs/reviews/all.md beside this repository (or LOXLEY_REVIEWS).
"""
import copy
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_v2 as B  # noqa: E402

B.page_modules()
P = sys.modules['lfpage_pseo']


def status(slug, verdict):
    reasons = verdict[slug]
    if not reasons:
        return 'written'
    return 'held' if all(c in P.HELD for c, _ in reasons) else 'REFUSED'


def check():
    bad = 0
    print('%-38s %-3s %-8s %6s %6s %8s' % ('page', 'set', 'state', 'own', 'shared', 'sibling'))
    for p in P.DATA['pages']:
        s = p['slug']
        st = P.STATS[s]
        print('%-38s %-3s %-8s %6s %6s %8s' % ('/' + s, p['set'], status(s, P.VERDICT), st.get('unique', '-'), st.get('shared', '-'),
                                              '%d%%' % round(100 * st['sibling']) if 'sibling' in st else '-'))
    for p in P.DATA['pages']:
        reasons = P.VERDICT[p['slug']]
        for c, m in reasons:
            print('  /%s [%s] %s' % (p['slug'], c, m))
        if status(p['slug'], P.VERDICT) == 'REFUSED':
            bad += 1
    linkable = {q['slug'] for q in P.BUILT}
    for p in P.BUILT:
        name, page = B.render(P.page_fn(P.DATA, p, linkable))
        path = os.path.join(B.ROOT, name)
        if not os.path.exists(path) or open(path, encoding='utf-8').read() != page:
            print('  %s is not what the data makes: run python3 scripts/site/build_v2.py' % name)
            bad += 1
    for name in P.stale():
        print('  %s was made by the generator and is no longer written: run python3 scripts/site/build_v2.py' % name)
        bad += 1
    current = open(P.SITEMAP, encoding='utf-8').read()
    if P.sitemap_text(current, P.BUILT) != current:
        print('  sitemap.xml does not list exactly the landing pages written: run python3 scripts/site/build_v2.py')
        bad += 1
    print('check_pseo: %d pages, %d written, %d held, %d problems' % (
        len(P.DATA['pages']), len(P.BUILT), sum(status(p['slug'], P.VERDICT) == 'held' for p in P.DATA['pages']), bad))
    return 1 if bad else 0


# ------------------------------------------------------------------ the proof: one bad page per guard

def _page(d, slug):
    return next(p for p in d['pages'] if p['slug'] == slug)


def _first_block(d, slug):
    return d['blocks'][_page(d, slug)['blocks'][0]]


def _say(where, words):
    def f(d, slug):
        if where == 'block':
            b = _first_block(d, slug)
            b['text'] += ' ' + words
        elif where == 'answer':
            _page(d, slug)['faq'][0]['a'] += ' ' + words
        else:
            _page(d, slug)['lead']['text'] += ' ' + words
    return f


def _fact(field, value):
    def f(d, slug):
        p = _page(d, slug)
        if not p['facts']:
            d['facts']['proof-fact'] = {'text': 'A fact.', 'url': 'https://example.org/', 'quote': 'A fact, in its own words.',
                                         'checked': '2026-10-29'}
            p['facts'].append('proof-fact')
        d['facts'][p['facts'][0]][field] = value
    return f


def _cite_unknown(d, slug):
    _page(d, slug)['facts'].append('no-such-fact')


def _heard(d, slug):
    _first_block(d, slug)['heard'] = False


def _quote_word(d, slug):
    q = _page(d, slug)['quote']
    q['text'] = q['text'].replace('beautiful', 'lovely', 1) if 'beautiful' in q['text'] else 'Lovely ' + q['text']


def _quote_credit(d, slug):
    _page(d, slug)['quote']['credit'] = 'Somebody · Nowhere, GA'


def _thin(d, slug):
    p = _page(d, slug)
    p['blocks'] = p['blocks'][:1]
    p['faq'] = p['faq'][:1]
    p['facts'] = []


def _twin(d, slug):
    """A sibling of the same set: the page again with its month swapped, its blocks copied under new names."""
    p = copy.deepcopy(_page(d, slug))
    swap = lambda s: s.replace('October', 'November').replace('october', 'november')
    p['slug'], p['crumb'] = swap(p['slug']), swap(p['crumb'])
    p['title'], p['meta'], p['h1'], p['h1_em'] = swap(p['title']), swap(p['meta']), swap(p['h1']), swap(p.get('h1_em', ''))
    names = []
    for name in p['blocks']:
        b = copy.deepcopy(d['blocks'][name])
        b['text'], b['heading'] = swap(b['text']), swap(b.get('heading', ''))
        d['blocks'][name + '-twin'] = b
        names.append(name + '-twin')
    p['blocks'] = names
    for qa in p['faq']:
        qa['q'], qa['a'] = swap(qa['q']), swap(qa['a'])
    d['pages'].append(p)
    return p['slug']


def _shared_blocks(d, slug):
    others = [q for q in d['pages'] if q['slug'] != slug]
    _page(d, slug)['blocks'] += others[0]['blocks'][:3]


def _link(target):
    def f(d, slug):
        _page(d, slug)['links_to'][0] = target
    return f


def _slug(d, slug):
    _page(d, slug)['slug'] = 'elopements'
    return 'elopements'


def _no_sources(d, slug):
    _first_block(d, slug)['sources'] = []


def _drive_fact_ok(d, slug):
    d['facts']['proof-drive'] = {'text': 'Dahlonega is approximately 70 miles north of Atlanta.', 'source': 'City of Dahlonega',
                                 'url': 'https://www.dahlonega.gov/community/about-our-town/',
                                 'quote': 'approximately 70 miles north of Atlanta', 'checked': '2026-10-29'}
    _page(d, slug)['facts'].append('proof-drive')


PROOFS = [
    ('slot', 'a block holds "[MICK RATIFIES]"', _say('block', '[MICK RATIFIES]'), 'elope-in-dahlonega'),
    ('slot', 'a block holds "[SCOUT: Dec sunset]"', _say('block', 'Sunset is at [SCOUT: Dec sunset].'), 'elope-in-october'),
    ('slot', 'an answer holds "{{month}}"', _say('answer', 'Write to us about {{month}}.'), 'anniversary-getaway-north-georgia'),
    ('heard', 'a block is marked "heard": false', _heard, 'elope-in-october'),
    ('facts', 'a fact row with no url', _fact('url', ''), 'elope-in-dahlonega'),
    ('facts', 'a fact row with no quote', _fact('quote', ''), 'elope-in-dahlonega'),
    ('facts', 'a fact row with no read date', _fact('checked', ''), 'elope-in-dahlonega'),
    ('facts', 'a page cites a fact facts.json lacks', _cite_unknown, 'elope-in-october'),
    ('recheck', 'a fact row marked "recheck": true', _fact('recheck', True), 'elope-in-dahlonega'),
    ('price', 'an answer says "$395 a night"', _say('answer', 'Nights are $395 a night.'), 'anniversary-getaway-north-georgia'),
    ('price', 'the lead says "price"', _say('lead', 'Ask us the price.'), 'elope-in-dahlonega'),
    ('price', 'a block says "rate"', _say('block', 'The weekday rate is lower.'), 'elope-in-october'),
    ('price', 'an answer says "from $4,500"', _say('answer', 'Packages from $4,500.'), 'elope-in-dahlonega'),
    ('price', 'a block offers "ten percent off"', _say('block', 'Ten percent off in January.'), 'anniversary-getaway-north-georgia'),
    ('quote', 'the guest\'s words with one word changed', _quote_word, 'elope-in-october'),
    ('quote', 'a credit the site has never shown', _quote_credit, 'anniversary-getaway-north-georgia'),
    ('thin', 'a page cut to one block and one answer', _thin, 'elope-in-october'),
    ('similar', 'a sibling that is the October page with "November" swapped in', _twin, 'elope-in-october'),
    ('shared', 'a page carrying three blocks another page carries', _shared_blocks, 'elope-in-dahlonega'),
    ('em-dash', 'the lead holds an em-dash', _say('lead', 'The bridge — a hundred feet.'), 'elope-in-dahlonega'),
    ('banned', 'a block says "ravine"', _say('block', 'The bridge crosses a ravine.'), 'elope-in-dahlonega'),
    ('banned', 'an answer says "private chef"', _say('answer', 'A private chef cooks dinner.'), 'elope-in-october'),
    ('banned', 'a block says "I answer everything myself"', _say('block', 'Write any time; I answer everything myself.'), 'anniversary-getaway-north-georgia'),
    ('banned', 'the lead says "wedding venue"', _say('lead', 'The best wedding venue in Georgia.'), 'elope-in-october'),
    ('banned', 'an answer claims "We\'ve hosted hundreds"', _say('answer', "We've hosted hundreds."), 'anniversary-getaway-north-georgia'),
    ('banned', 'a block counts "only three nights left"', _say('block', 'Only three nights left in December.'), 'elope-in-october'),
    ('drive', 'a block says "about 10 minutes from the square"', _say('block', 'The square is about 10 minutes away.'), 'elope-in-dahlonega'),
    ('drive', 'an answer says "five miles"', _say('answer', 'Town is five miles off.'), 'elope-in-october'),
    ('exclaim', 'the lead ends "!"', _say('lead', 'Come up!'), 'anniversary-getaway-north-georgia'),
    ('emoji', 'a block holds an emoji', _say('block', 'Fire tonight \U0001F525'), 'elope-in-dahlonega'),
    ('links', 'a link to a page that does not exist', _link('/no-such-page'), 'elope-in-dahlonega'),
    ('links', 'a link to /elopements#inquire (the page\'s anchor is #inquiry)', _link('/elopements#inquire'), 'elope-in-october'),
    ('schema', 'a slug that is an existing page (/elopements)', _slug, 'elope-in-dahlonega'),
    ('schema', 'a block with no sources', _no_sources, 'anniversary-getaway-north-georgia'),
]


def prove():
    real, _ = P.judge(P.DATA)
    failing = 0
    clean = all(status(s, real) != 'REFUSED' for s in real)
    print('the data as it stands: %s' % ('no page refused' if clean else 'REFUSED pages, see check_pseo.py'))
    for code, what, mutate, slug in PROOFS:
        d = copy.deepcopy(P.DATA)
        target = mutate(d, slug) or slug
        verdict, _ = P.judge(d)
        hits = [m for c, m in verdict.get(target, []) if c == code]
        if hits:
            print('REFUSED  [%-7s] %-62s /%s: %s' % (code, what, target, hits[0]))
        else:
            print('NOT REFUSED [%s] %s /%s: %s' % (code, what, target, verdict.get(target)))
            failing += 1
    # The rendered page: a noindex or a missing Tag Manager snippet is refused as written.
    for code, what, patch in (('render', 'the page as written says noindex', 'noindex'),
                              ('render', 'the page as written lacks the Tag Manager snippet', 'gtm')):
        saved_head, saved_gtm = P.head, P.GTM.HEAD
        if patch == 'noindex':
            P.head = lambda p, h=saved_head: h(p).replace('</head>', '  <meta name="robots" content="noindex">\n</head>')
        else:
            P.GTM.HEAD = ''
        try:
            verdict, _ = P.judge(copy.deepcopy(P.DATA))
        finally:
            P.head, P.GTM.HEAD = saved_head, saved_gtm
        hits = [m for c, m in verdict['elope-in-dahlonega'] if c == code]
        print(('REFUSED  [%-7s] %-62s /%s: %s' % (code, what, 'elope-in-dahlonega', hits[0])) if hits else 'NOT REFUSED [%s] %s' % (code, what))
        failing += not hits
    # And the exception: a drive distance in a fact row whose source's own words carry it is allowed.
    d = copy.deepcopy(P.DATA)
    _drive_fact_ok(d, 'elope-in-dahlonega')
    verdict, _ = P.judge(d)
    drive = [m for c, m in verdict['elope-in-dahlonega'] if c == 'drive']
    print(('ALLOWED  [drive  ] a fact row, "approximately 70 miles north of Atlanta" from the city\'s own page'
           if not drive else 'WRONGLY REFUSED [drive] the fact row: %s' % drive))
    failing += bool(drive)
    print('check_pseo --prove: %d guards proven, %d not' % (len(PROOFS) + 3 - failing, failing))
    return 1 if failing or not clean else 0


# ------------------------------------------------------------------ the preview, outside the repository

ASSETS = ('css', 'js', 'images', 'favicon.svg', 'apple-touch-icon.png')


def banner(reasons):
    heard = any(c == 'heard' for c, _ in reasons)
    title = 'PREVIEW: words not yet heard by Mick' if heard else 'PREVIEW: not written to the site'
    items = ''.join('<li>%s</li>' % P.esc(m) for _, m in reasons)
    return ('\n    <div class="ps-preview" role="note" style="background:#c4a265;color:#142418;padding:calc(var(--hdr-h) + 14px) var(--pad-x) 16px;'
            'font-family:Montserrat,sans-serif;font-size:0.8125rem;line-height:1.5"><p style="margin:0;font-weight:700;letter-spacing:0.12em;'
            'text-transform:uppercase">%s</p><ul style="margin:8px 0 0;padding-left:18px">%s</ul></div>\n' % (title, items))


def preview(folder):
    folder = os.path.realpath(folder)
    root = os.path.realpath(B.ROOT)
    if folder == root or folder.startswith(root + os.sep):
        print('check_pseo --preview: %s is inside the repository; the preview goes outside it' % folder)
        return 1
    os.makedirs(folder, exist_ok=True)
    for a in ASSETS:
        link = os.path.join(folder, a)
        if not os.path.lexists(link):
            os.symlink(os.path.join(root, a), link)
    every = {p['slug'] for p in P.DATA['pages']}
    for p in P.DATA['pages']:
        reasons = P.VERDICT[p['slug']]
        name, page = B.render(P.page_fn(P.DATA, p, every, banner(reasons) if reasons else None))
        open(os.path.join(folder, name), 'w', encoding='utf-8').write(page)
        print('preview: %-40s %s' % (name, status(p['slug'], P.VERDICT)))
    return 0


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--prove' in args:
        sys.exit(prove())
    if '--preview' in args:
        i = args.index('--preview')
        if i + 1 >= len(args):
            print('check_pseo --preview DIR: name the folder')
            sys.exit(2)
        sys.exit(preview(args[i + 1]))
    sys.exit(check())
