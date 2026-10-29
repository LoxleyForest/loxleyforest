"""The search landing pages: one generator, its data and its guards (Mick, 2026-10-29: "build me a
programmatic SEO legend").

Each page is <slug>.html at the repo root, served at /<slug> like every page here, so
scripts/ensure_gtm.py, check_forms.py and publish.py read it as they read the rest. The data is in
scripts/site/pseo/ (its README says what each field is):
  pages.json   the pages, in order: set, slug, title, meta, h1, hub, links_to, blocks, facts, faq,
               quote, form, and the photograph
  blocks.json  the copy blocks by name, each with its text and its sources (file:line)
  facts.json   outside facts by id, each with its text, the source's url, the source's own words
               and the day they were read
The repository is public: the data holds only what a page prints. The Marketer's evidence and notes
stay in loxley-rescue.

A page is written only when every guard below passes. A refused page is not written, a copy of it
written before is taken down, and the build says why in plain words. Refusals of three kinds hold a
page until someone acts, and are expected: words Mick has not heard ("heard": false on the page or
a block, as pages/offer.py holds words he has not approved), a slot not yet filled, and a fact row
waiting to be read again ("recheck": true). Everything
else is an error in the data. The guards (scripts/site/check_pseo.py --prove breaks one page for
each and shows it refused):
  - a slot left in: [MICK RATIFIES], [SCOUT], [COUNSEL] or any [CAPS: ...], or "{{";
  - words Mick has not heard;
  - a fact row without its url, the source's words, or a read date (and no fact the page cites
    but facts.json lacks); a fact row marked "recheck": true holds the page until it is read again;
  - "$", "price", "rate", or any discount word (Mick: no price on the site without his yes; canon
    letter law 1: a thing is given, never marked down);
  - a guest's words not found word for word in loxley-rescue docs/reviews/all.md, by the method of
    check_reviews.py; or from a review that is not five stars; or under a credit the site has not
    already published (so this generator never adds a guest's name to the public repository);
  - under 350 words of copy that are the page's own, found on no other landing page; shared words
    outnumbering the page's own; more than two shared blocks;
  - two pages of one set sharing more than 40 percent of their sentences, read with each page's own
    place, month or occasion masked, so a page that is its sibling with one word swapped is caught;
  - an em-dash anywhere; "ravine"; "private chef"; "I answer everything myself" and its family;
    "wedding venue"; a claim of ceremonies hosted; Counsel's "must not say" for marriage law (a
    license's expiry, a friend ordained online, no witnesses needed or marrying the day you apply as
    promises, the house getting the license, a license "free", "no fee" or "waived", appearing in
    person, an officiant "licensed", "authorized" outside a statute's quoted words, any witness line
    but "the license law names none"); the names awaiting Mick (the Ember Board, the
    Evening Fire, the Anniversary Key); an exclamation mark outside a guest's words; an emoji; a
    count of open nights;
  - a drive time or distance in miles or minutes anywhere on the page, unless it is a fact row
    whose source's own words carry the same number;
  - a missing field, a slug another page or a redirect already owns, a title over 70 characters or
    a meta line over 160, a block or answer without sources, a missing photograph or one shown twice
    on a page, a link to a page or an anchor that does not exist;
  - as written: the Tag Manager snippet (from scripts/ensure_gtm.py, the one source), no noindex,
    the canonical, and the page's form with the hidden field "page" naming it.
A link to a landing page that is held is left off until that page is written. The sitemap's
landing-page entries sit between <!-- pseo --> and <!-- /pseo --> and are rewritten from the pages
written, after every build; the hand-written entries are never touched.
"""
import datetime
import functools
import html
import importlib.util
import json
import os
import re
import sys

import build_v2 as B

HERE = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.dirname(HERE)
DATA_DIR = os.path.join(SITE_DIR, 'pseo')
MARK = '<meta name="generator" content="scripts/site/pages/pseo.py">'
SITEMAP = os.path.join(B.ROOT, 'sitemap.xml')


def _module(name, path):
    if name in sys.modules:
        return sys.modules[name]
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


GTM = _module('ensure_gtm', os.path.join(B.ROOT, 'scripts', 'ensure_gtm.py'))
REV = _module('check_reviews', os.path.join(SITE_DIR, 'check_reviews.py'))
REVIEWS_DATA = _module('reviews_data', os.path.join(SITE_DIR, 'reviews_data.py'))

# The sets (the Marketer's map, 2026-10-29): a place, a season, an occasion, a getaway, a question.
SETS = {'A': 'Places', 'B': 'Seasons', 'C': 'Occasions', 'D': 'Getaways', 'E': 'Questions'}
# The site's own pages a landing page may name as its hub or link to, by the words they go by.
NAMES = {'/': 'Home', '/elopements': 'Elopements', '/treehouses': 'The Treehouse', '/experiences': 'Experiences',
         '/our-story': 'Our Story', '/gallery': 'Gallery', '/local-guide': 'Local Guide', '/faq': 'Questions',
         '/reviews': 'Guest reviews', '/book': 'Book your dates', '/gift': 'The Golden Arrow'}
FORMS = ('elopement', 'booking')

MIN_UNIQUE = 350
MAX_SHARED_SENTENCES = 0.40
MAX_SHARED_BLOCKS = 2
TITLE_MAX, META_MAX = 70, 160
HELD = ('slot', 'heard', 'recheck')

# ------------------------------------------------------------------ the rules for words

SLOT = re.compile(r'\[[A-Z][A-Z ]{2,}(?::[^\]]*)?\]|\[(?i:date|tbd|tk|todo|name|place|month)\]|\{\{|\}\}|\bTODO\b')
BANNED = [
    (r'\bravine', 'say "holler", never "ravine" (canon/voice.md, letter law 5)'),
    (r'\bprivate chef', 'never "private chef"'),
    (r'\bI answer everything myself|\bit\'?s me on the other end|\bI(?:\'ll| will)? read (?:it|them|every \w+) myself|\bnot a chatbot',
     'never "I answer everything myself" or anything like it (Mick, 2026-10-26)'),
    (r'\bI answer fast', 'it is "We answer fast" (Mick, 2026-10-26)'),
    (r'\bLivy\'?s breakfast|\blet Livy feed you|\bin our kitchen',
     'the breakfast is the house\'s, "made from scratch"; never a person cooking for the guest (canon/voice.md, law 7)'),
    (r'\bcompass fire pit', 'it is the Fire Circle (canon/voice.md, law 7)'),
    (r'\bwedding venue', '"ceremony", never "wedding venue": the house is not a licensed venue (the elopement hosting agreement)'),
    (r'\bwe(?:\'ve| have) hosted\b', 'no ceremony or count is claimed as hosted that the record does not show'),
    # Counsel's "must not say" for the marriage-law lines (docs/briefs/2026-10-29-counsel-elope-in-georgia.md):
    (r'licen[cs]e[^.]{0,80}\b(?:expir\w*|valid for|good for)\b|\b(?:expir\w*|valid for|good for)\b[^.]{0,80}licen[cs]e',
     'gives a marriage license an expiry; the law read sets none (Counsel, 2026-10-29)'),
    (r'\bordain\w*\s+online|\bonline[- ]ordain\w*|\bonline ordination|\buniversal life church',
     'says a friend ordained online can marry them; unsettled in Georgia law, an attorney signs first (Counsel, 2026-10-29)'),
    (r'\bno witness(?:es)? (?:needed|required|necessary)|\b(?:don\'?t|do not|won\'?t) need (?:any )?witness',
     'promises that no witnesses are needed; a reading, not a promise (Counsel, 2026-10-29)'),
    (r'\b(?:marry|married|wed)\b[^.]{0,40}\b(?:same day|the day you apply)\b|\bsame[- ]day (?:license|marriage|wedding|elopement)',
     'promises marrying the day they apply; the court\'s hours decide (Counsel, 2026-10-29)'),
    (r'\bwe (?:can )?(?:get|obtain|handle|file|pick up|arrange) (?:the |your )?(?:marriage )?licen[cs]e',
     'says the house gets or handles the license; it does not (the elopement hosting agreement)'),    (r'licen[cs]e[^.]{0,60}\b(?:free|no fee|waived?|waiver)\b|\b(?:free|no fee|waived?|waiver)\b[^.]{0,60}licen[cs]e',
     'speaks of a license as free, with no fee or waived; the fee is the court\'s page\'s to state (Counsel, after the Critic, 2026-10-29)'),
    (r'(?:licen[cs]e|court|appl(?:y|ication))[^.]{0,80}\bin person\b|\bin person\b[^.]{0,80}(?:licen[cs]e|court|appl(?:y|ication))|\bappear\w*\b[^.]{0,40}\bcourt\b',
     'says something about appearing in person; nothing either way (Counsel, 2026-10-29)'),
    (r'\blicensed (?:officiant|minister|celebrant|clergy)|\bofficiant[^.]{0,40}\blicensed\b',
     'calls an officiant "licensed"; never (Counsel, 2026-10-29)'),
]
UNQUOTED = re.compile(r'"[^"]*"|“[^”]*”')   # a statute's quoted words, set aside for the next two rules
AUTHORIZED = re.compile(r'\bauthori[sz]\w*', re.I)
WITNESS = re.compile(r'\bwitnesses\b|\bwitness (?:rule|requirement)s?\b|\bno witness\b', re.I)
FAMILY = re.compile(r'\bI\b[^.?!]{0,40}\bmyself\b')   # the family of "I answer everything myself"
AWAITING = [('Ember Board', 'awaiting Mick (canon/voice.md)'), ('Evening Fire', 'awaiting Mick (canon/voice.md)'),
            ('Anniversary Key', 'on Mick\'s yes only')]
PRICE = re.compile(r'\$|\bpric(?:e|es|ed|ing)\b|\brates?\b', re.I)
DISCOUNT = re.compile(r'\bdiscount\w*|\bcoupons?\b|\bpromo(?:s|tions?| codes?)?\b|%|\bpercent\b|\bspecial offers?\b|\bdeals?\b(?! with)', re.I)
SCARCITY = re.compile(r'\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a few|only)\s+(?:open\s+)?'
                      r'(?:nights?|weekends?|dates?|spots?)\s+(?:left|remain\w*|open|available)\b', re.I)
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿️]')
MARKUP = re.compile(r'<[a-zA-Z/!]|&[a-z]+;|&#')
_N = (r'(?:\d+(?:[.,]\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|'
      r'thirty|forty|fifty|sixty|seventy|eighty|ninety|a few|a couple of|several|half an?)')
DRIVE = re.compile(rf'\b{_N}(?:\s*(?:-|to|or|and)\s*{_N})?[\s-]+(?:miles?|minutes?|mins?|mi)\b|\b\d+(?:mi|min)\b'
                   r'|\b(?:last|first|final|next)\s+(?:miles?|minutes?)\b', re.I)
WORD = re.compile(r"[A-Za-z0-9]+(?:['’][A-Za-z]+)*")


def _plain(s):
    return s.replace('’', "'").replace('‘', "'")


def text_rules(s, kind='copy', fact=None):
    """Why these words may not go on a page, each reason in a few plain words. kind is 'copy' (our
    words), 'quote' (a guest's, verbatim) or 'fact' (a fact row's text; fact is its row)."""
    out = []
    t = _plain(s)
    m = SLOT.search(s)
    if m:
        out.append(('slot', f'holds a slot still to fill, "{m.group(0)}"'))
    if '—' in s:
        out.append(('em-dash', 'holds an em-dash; Mick writes without them'))
    for pat, why in BANNED:
        m = re.search(pat, t, re.I)
        if m:
            out.append(('banned', f'says "{m.group(0)}": {why}'))
    if kind != 'quote':
        bare = UNQUOTED.sub(' ', t)
        m = AUTHORIZED.search(bare)
        if m:
            out.append(('banned', f'says "{m.group(0)}" outside a statute\'s quoted words (Counsel, 2026-10-29)'))
        for sent in re.split(r'(?<=[.?!])\s+', bare):
            m = WITNESS.search(sent)
            if m and 'license law names none' not in sent.lower():
                out.append(('banned', f'says "{m.group(0)}"; on witnesses the most a page says is that the license law names none (Counsel, 2026-10-29)'))
        m = FAMILY.search(t)
        if m:
            out.append(('banned', f'says "{m.group(0)}": the family of "I answer everything myself"'))
    for name, why in AWAITING:
        if name in t:
            out.append(('banned', f'names "{name}", {why}'))
    m = PRICE.search(t)
    if m:
        out.append(('price', f'names a price or a rate ("{m.group(0)}"); no price goes on the site without Mick\'s yes'))
    m = DISCOUNT.search(t)
    if m:
        out.append(('price', f'speaks of a discount ("{m.group(0)}"); a thing is given, never marked down'))
    m = SCARCITY.search(t)
    if m:
        out.append(('banned', f'counts what is left ("{m.group(0)}"); the calendar shows open nights, a page never counts them'))
    if kind != 'quote' and '!' in s:
        out.append(('exclaim', 'holds an exclamation mark; plain sentences'))
    if EMOJI.search(s):
        out.append(('emoji', 'holds an emoji'))
    if MARKUP.search(s):
        out.append(('schema', 'holds markup; copy is plain text and the builder escapes it'))
    for m in DRIVE.finditer(t):
        said = m.group(0).lower()
        if kind == 'fact' and fact:
            quote = _plain(fact.get('quote', '')).lower()
            num = said.split()[0].split('-')[0]
            unit = 'mi' if 'mi' in said and 'min' not in said else 'min'
            if num in quote and unit in quote:
                continue
        out.append(('drive', f'gives a drive time or distance ("{m.group(0)}") that is not a fact row whose source says it'))
    return out


def sentences(text):
    out = []
    for para in re.split(r'\n\s*\n', text.strip()):
        for s in re.split(r'(?<=[.?!])\s+|(?<=[.?!][”"’])\s+', para.strip()):
            if WORD.search(s):
                out.append(s.strip())
    return out


def norm(s, mask=()):
    t = _plain(s).lower()
    for w in mask:
        t = re.sub(r'\b' + re.escape(w) + r'\b', ' it ', t)
    return ' '.join(re.findall(r"[a-z0-9']+", t))


def words(s):
    return len(WORD.findall(s))


# ------------------------------------------------------------------ the data

def load(folder=DATA_DIR):
    def read(name):
        return json.load(open(os.path.join(folder, name), encoding='utf-8'))
    return {'pages': read('pages.json'), 'blocks': read('blocks.json'), 'facts': read('facts.json')}


def slug_of(p):
    return p.get('slug', '')


def mask_of(p):
    """The page's own word or words (its place, month or occasion), from its crumb."""
    return tuple(w for w in norm(p.get('crumb', '')).split() if len(w) > 2 and w not in ('the', 'and', 'for', 'from'))


def shared_blocks(data):
    used = {}
    for p in data['pages']:
        for b in p.get('blocks', []):
            used[b] = used.get(b, 0) + 1
    return {b for b, n in used.items() if n > 1 or data['blocks'].get(b, {}).get('shared')}


def facts_shared(data):
    used = {}
    for p in data['pages']:
        for f in p.get('facts', []):
            used[f] = used.get(f, 0) + 1
    return {f for f, n in used.items() if n > 1}


def copy_parts(data, p, own_only=False):
    """The page's copy as (where, text): what it says in its own voice, the facts and the guest's
    words. own_only: only what is not a shared block or a shared fact (the guest's words are never
    the page's own)."""
    shared, sfacts = shared_blocks(data), facts_shared(data)
    parts = [('h1', (p.get('h1', '') + ' ' + p.get('h1_em', '')).strip()), ('lead', p.get('lead', {}).get('text', ''))]
    for name in p.get('blocks', []):
        b = data['blocks'].get(name, {})
        if own_only and name in shared:
            continue
        parts.append((f'block {name}', (b.get('heading', '') + ' ' + b.get('heading_em', '')).strip()))
        parts.append((f'block {name}', b.get('text', '')))
    for i, qa in enumerate(p.get('faq', []), 1):
        parts.append((f'question {i}', qa.get('q', '')))
        parts.append((f'answer {i}', qa.get('a', '')))
    for f in p.get('facts', []):
        if own_only and f in sfacts:
            continue
        parts.append((f'fact {f}', data['facts'].get(f, {}).get('text', '')))
    if not own_only and p.get('quote'):
        parts.append(('quote', p['quote'].get('text', '')))
    return [(w, t) for w, t in parts if t]


def page_sentences(data, p, own_only=False):
    return [s for _, t in copy_parts(data, p, own_only) for s in sentences(t)]


# ------------------------------------------------------------------ the site around the pages

def site_paths():
    """The site's pages by their paths, from the root's *.html (index.html is '/')."""
    out = {}
    for name in os.listdir(B.ROOT):
        if name.endswith('.html'):
            out['/' if name == 'index.html' else '/' + name[:-5]] = name
    return out


def redirects():
    src = open(os.path.join(B.ROOT, 'netlify.toml'), encoding='utf-8').read()
    return set(re.findall(r'from\s*=\s*"([^"]+)"', src))


def module_pages():
    """The files build_v2 and the other page modules write (their literal names; a page named
    otherwise, like legal.py's, already exists without this generator's mark and is refused by
    ours()). A landing page may not take one."""
    names = {'index.html', 'treehouses.html'}
    for name in os.listdir(HERE):
        if name.endswith('.py') and name != 'pseo.py':
            src = open(os.path.join(HERE, name), encoding='utf-8').read()
            names.update(re.findall(r"return '([a-z0-9-]+\.html)'", src))
    return names


def ours(name):
    path = os.path.join(B.ROOT, name)
    if not os.path.exists(path):
        return None
    with open(path, encoding='utf-8') as fh:
        return MARK in fh.read(4000)


def anchor_ok(path):
    """A link's page exists and, if it names an anchor, the page has it."""
    base, _, anchor = path.partition('#')
    name = site_paths().get(base)
    if not name:
        return False, f'no page at {base}'
    if anchor:
        src = open(os.path.join(B.ROOT, name), encoding='utf-8').read()
        if f'id="{anchor}"' not in src:
            ids = re.findall(r'id="([a-z0-9-]+)"', src)
            near = [i for i in ids if i[:4] == anchor[:4]]
            hint = f' (it has #{near[0]})' if near else ''
            return False, f'{base} has no #{anchor}{hint}'
    return True, ''


# ------------------------------------------------------------------ the guards

def _reviews():
    path = REV.DEFAULT
    cands = [os.environ.get('LOXLEY_REVIEWS', ''), path]
    git = os.path.join(B.ROOT, '.git')
    if os.path.isfile(git):   # a worktree: its main checkout sits beside loxley-rescue
        line = open(git, encoding='utf-8').read().strip()
        if line.startswith('gitdir:'):
            main = line.split(':', 1)[1].strip().split(os.sep + '.git' + os.sep)[0]
            cands.append(os.path.join(main, '..', 'loxley-rescue', 'docs', 'reviews', 'all.md'))
    for c in cands:
        if c and os.path.exists(c):
            return open(c, encoding='utf-8').read()
    return None


@functools.lru_cache(None)
def _published_credits():
    out = {credit for _, credit in B.REVIEW_LIST}
    out.update(credit for _, _, credit, _ in REVIEWS_DATA.REVIEWS)
    return out


def check_quote(q, raw):
    out = []
    for k in ('id', 'text', 'credit'):
        if not q.get(k):
            out.append(('quote', f'the guest\'s words have no {k}'))
    if out:
        return out
    if raw is None:
        return [('quote', 'the review list (loxley-rescue docs/reviews/all.md) is not on this machine, so the guest\'s words cannot be proven')]
    reviews = REV.by_id(raw)
    if q['id'] not in reviews:
        return [('quote', f'no review {q["id"]} in docs/reviews/all.md')]
    heading, paras = reviews[q['id']]
    whole = ' '.join(paras)
    if not re.search(r'\b5 stars\b', heading):
        out.append(('quote', f'review {q["id"]} is not a five-star review'))
    for part in q['text'].split(' ... '):
        if re.sub(r'\s+', ' ', part) not in whole:
            out.append(('quote', f'the guest\'s words are not found word for word in review {q["id"]}: "{part[:60]}"'))
    if q['credit'] not in _published_credits():
        out.append(('quote', f'the credit "{q["credit"]}" is not one the site already shows; a new guest name does not go into the public repository'))
    elif not re.match(re.escape(q['credit'].split(' · ')[0]) + '(, | · )', heading):
        out.append(('quote', f'the credit "{q["credit"]}" is not review {q["id"]}\'s reviewer'))
    if REV.PLATFORM.search(q['text'] + ' ' + q['credit']):
        out.append(('quote', 'the guest\'s words name a platform'))
    return out


DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def _date_ok(s):
    if not isinstance(s, str) or not DATE.match(s):
        return False
    try:
        return datetime.date.fromisoformat(s) <= datetime.date.today()
    except ValueError:
        return False


def check_facts(data):
    """Every fact row, whether a page cites it or not: {id: [reasons]}."""
    out = {}
    for fid, f in data['facts'].items():
        bad = []
        if not f.get('text'):
            bad.append(('facts', 'has no text'))
        if not re.match(r'^https?://\S+$', f.get('url', '') or ''):
            bad.append(('facts', 'has no url'))
        if len((f.get('quote') or '').strip()) < 12:
            bad.append(('facts', 'has no quote in the source\'s own words'))
        if not _date_ok(f.get('checked')):
            bad.append(('facts', 'has no read date (checked, YYYY-MM-DD, not in the future)'))
        if f.get('recheck'):
            bad.append(('recheck', 'is marked "recheck": true; it is read again live, and the mark cleared, before a page prints it'))
        bad += text_rules(f.get('text', ''), 'fact', f)
        out[fid] = bad
    return out


REQUIRED = ('set', 'slug', 'title', 'meta', 'eyebrow', 'h1', 'crumb', 'hero', 'lead', 'hub', 'links_to', 'blocks',
            'facts', 'faq', 'quote', 'form', 'updated')


def check_schema(data, p, slugs):
    out = []
    for k in REQUIRED:
        if k not in p:
            out.append(('schema', f'has no "{k}"'))
    if out:
        return out
    slug = p['slug']
    if p['set'] not in SETS:
        out.append(('schema', f'set "{p["set"]}" is not one of {", ".join(SETS)}'))
    if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', slug):
        out.append(('schema', f'slug "{slug}" is not lowercase words joined by hyphens'))
    if slugs.count(slug) > 1:
        out.append(('schema', 'another page in pages.json has the same slug'))
    name = slug + '.html'
    if name in module_pages():
        out.append(('schema', f'{name} is written by another page module'))
    elif ours(name) is False:
        out.append(('schema', f'{name} is a page this generator did not make; it will not be overwritten'))
    if '/' + slug in redirects() or '/' + name in redirects():
        out.append(('schema', f'/{slug} is a redirect in netlify.toml'))
    if len(p['title']) > TITLE_MAX:
        out.append(('schema', f'the title is {len(p["title"])} characters; {TITLE_MAX} at most'))
    if len(p['meta']) > META_MAX:
        out.append(('schema', f'the meta line is {len(p["meta"])} characters; {META_MAX} at most'))
    if p['hub'] not in NAMES or p['hub'] not in site_paths():
        out.append(('schema', f'hub "{p["hub"]}" is not one of the site\'s pages'))
    if p['form'] not in FORMS:
        out.append(('schema', f'form "{p["form"]}" is not one of {", ".join(FORMS)}'))
    if not _date_ok(p['updated']):
        out.append(('schema', 'updated is not a date (YYYY-MM-DD, not in the future)'))
    if not p['lead'].get('sources'):
        out.append(('schema', 'the lead has no sources'))
    hero = p['hero'].get('photo', '')
    if not os.path.exists(os.path.join(B.ROOT, f'images/v2/{hero}-800.webp')):
        out.append(('schema', f'no photograph images/v2/{hero}-800.webp'))
    if not p['hero'].get('alt'):
        out.append(('schema', 'the photograph has no alt words'))
    for name_ in p['blocks'] + ([p['form_intro']] if p.get('form_intro') else []):
        b = data['blocks'].get(name_)
        if b is None:
            out.append(('schema', f'block "{name_}" is not in blocks.json'))
            continue
        if not b.get('text'):
            out.append(('schema', f'block "{name_}" has no text'))
        if not b.get('sources'):
            out.append(('schema', f'block "{name_}" has no sources'))
        if b.get('photo') and not os.path.exists(os.path.join(B.ROOT, f'images/v2/{b["photo"]}-800.webp')):
            out.append(('schema', f'block "{name_}": no photograph images/v2/{b["photo"]}-800.webp'))
    photos = [hero] + [data['blocks'].get(n, {}).get('photo') for n in p['blocks'] if data['blocks'].get(n, {}).get('photo')]
    for ph in sorted({x for x in photos if photos.count(x) > 1}):
        out.append(('schema', f'shows the photograph {ph} twice'))
    for i, qa in enumerate(p['faq'], 1):
        if not (qa.get('q') and qa.get('a') and qa.get('sources')):
            out.append(('schema', f'question {i} needs q, a and sources'))
    for f in p['facts']:
        if f not in data['facts']:
            out.append(('facts', f'cites fact "{f}", which facts.json does not have'))
    for link in p['links_to']:
        if link.split('#')[0].strip('/') == slug:
            out.append(('links', 'links to itself'))
        elif link.split('#')[0].lstrip('/') in slugs:
            continue
        else:
            ok, why = anchor_ok(link)
            if not ok:
                out.append(('links', f'links to {link}, but {why}'))
    if len(p['links_to']) < 3:
        out.append(('links', f'links to {len(p["links_to"])} pages; three at least, besides the hub'))
    return out


def judge(data, render=True):
    """Every page's reasons to refuse it, {slug: [(code, message)]}, and its numbers."""
    slugs = [slug_of(p) for p in data['pages']]
    verdict = {s: [] for s in slugs}
    stats = {s: {} for s in slugs}
    raw = _reviews()
    fact_bad = check_facts(data)
    shared = shared_blocks(data)

    for p in data['pages']:
        s, v = slug_of(p), verdict[slug_of(p)]
        v += [(c, m) for c, m in check_schema(data, p, slugs)]
        if any(c == 'schema' and 'has no "' in m for c, m in v):
            continue
        if p.get('heard') is False:
            v.append(('heard', 'the page is marked "heard": false; Mick has not heard its words'))
        for name in p['blocks'] + ([p['form_intro']] if p.get('form_intro') else []):
            if data['blocks'].get(name, {}).get('heard') is False:
                v.append(('heard', f'block "{name}" holds words Mick has not heard'))
        for where, text in [('title', p['title']), ('meta', p['meta']), ('eyebrow', p['eyebrow']), ('crumb', p['crumb']),
                            ('photograph\'s alt', p['hero'].get('alt', ''))] + copy_parts(data, p):
            if where == 'quote' or where.startswith('fact '):
                continue
            v += [(c, f'{where} {m}') for c, m in text_rules(text)]
        for name in p['blocks'] + ([p['form_intro']] if p.get('form_intro') else []):
            alt = data['blocks'].get(name, {}).get('alt', '')
            v += [(c, f'block {name}\'s photograph alt {m}') for c, m in text_rules(alt)] if alt else []
        for f in p['facts']:
            v += [(c, f'fact {f} {m}') for c, m in fact_bad.get(f, [])]
        if p['quote']:
            v += check_quote(p['quote'], raw)
            v += [(c, f'the guest\'s words {m}') for c, m in text_rules(p['quote'].get('text', ''), 'quote')]
        n_shared = sum(1 for b in p['blocks'] if b in shared)
        if n_shared > MAX_SHARED_BLOCKS:
            v.append(('shared', f'carries {n_shared} shared blocks; {MAX_SHARED_BLOCKS} at most besides the form\'s'))

    # Words that are the page's own: in its own blocks, answers and facts, and on no other page.
    seen = {slug_of(p): {norm(x, mask_of(p)) for x in page_sentences(data, p)} for p in data['pages']}
    for p in data['pages']:
        s = slug_of(p)
        others = set().union(*[seen[o] for o in seen if o != s]) if len(seen) > 1 else set()
        own = {}
        for x in page_sentences(data, p, own_only=True):
            k = norm(x, mask_of(p))
            if k not in others:
                own[k] = words(x)
        total = {}
        for x in page_sentences(data, p):
            if not _is_quote(data, p, x):
                total[norm(x, mask_of(p))] = words(x)
        unique = sum(own.values())
        shared_words = sum(total.values()) - unique
        stats[s].update(unique=unique, shared=shared_words)
        if unique < MIN_UNIQUE:
            verdict[s].append(('thin', f'has {unique} words of copy that are its own; {MIN_UNIQUE} at least, so the page is useful alone'))
        if shared_words > unique:
            verdict[s].append(('shared', f'its shared words ({shared_words}) outnumber its own ({unique})'))

    # Siblings: two pages of one set may share at most 40 percent of their sentences.
    for i, p in enumerate(data['pages']):
        for q in data['pages'][i + 1:]:
            if p.get('set') != q.get('set'):
                continue
            a, b = seen[slug_of(p)], seen[slug_of(q)]
            if not a or not b:
                continue
            share = len(a & b) / min(len(a), len(b))
            for x, y in ((p, q), (q, p)):
                stats[slug_of(x)]['sibling'] = max(stats[slug_of(x)].get('sibling', 0), share)
            if share > MAX_SHARED_SENTENCES:
                for x, y in ((p, q), (q, p)):
                    verdict[slug_of(x)].append(('similar', f'shares {share:.0%} of its sentences with /{slug_of(y)}, a page of '
                                                           f'the same set; {MAX_SHARED_SENTENCES:.0%} at most'))

    if render:
        for p in data['pages']:
            s = slug_of(p)
            if any(c in ('schema', 'facts') for c, _ in verdict[s]):
                continue   # a page whose data is broken is not rendered; its reasons stand
            name, page = B.render(page_fn(data, p, set(slugs)))
            verdict[s] += rendered_rules(p, page)
    return verdict, stats


def _is_quote(data, p, x):
    return bool(p.get('quote')) and x in sentences(p['quote'].get('text', ''))


def visible(page):
    """The words a reader or a search engine reads: the text, the title, the meta lines and the alt
    words, without scripts."""
    t = re.sub(r'<script\b.*?</script>|<style\b.*?</style>|<noscript>.*?</noscript>', ' ', page, flags=re.S)
    attrs = re.findall(r'\b(?:content|alt|placeholder|aria-label|title)="([^"]*)"', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    return html.unescape(' '.join(attrs) + ' ' + t)


def rendered_rules(p, page):
    out = []
    if '—' in page:
        out.append(('em-dash', 'as written, holds an em-dash'))
    if not ('gtm.js?id=' in page and ('ns.html?id=' + GTM.GTM_ID) in page):
        out.append(('render', 'as written, lacks the Tag Manager snippet'))
    if re.search(r'noindex', page, re.I):
        out.append(('render', 'as written, says noindex'))
    if f'<link rel="canonical" href="{B.SITE}/{p["slug"]}">' not in page:
        out.append(('render', 'as written, lacks its canonical'))
    if f'<input type="hidden" name="page" value="/{p["slug"]}">' not in page or 'action="/success.html"' not in page:
        out.append(('render', 'as written, lacks its form posting to /success with the hidden page field'))
    rest = re.sub(r'<li class="ps-fact">.*?</li>|<figure class="ps-quote">.*?</figure>', ' ', page, flags=re.S)
    for c, m in text_rules(visible(rest)):
        if c != 'schema':   # markup is the page itself here; the copy was read for it before
            out.append((c, f'as written, {m}'))
    return out


# ------------------------------------------------------------------ the page

def esc(s):
    return html.escape(s, quote=False)


def attr(s):
    return html.escape(s, quote=True)


def tie(s):
    """A section mark stays with its number at the end of a line."""
    return s.replace('§ ', '§\u00a0')


def heading(text, em):
    return esc(tie(text)) + (f' <em>{esc(tie(em))}</em>' if em else '')


def paras(text):
    return ''.join(f'<p>{esc(tie(x.strip()))}</p>' for x in re.split(r'\n\s*\n', text.strip()) if x.strip())


def photo_size(name):
    big = f'images/v2/{name}-1600.webp'
    path = big if os.path.exists(os.path.join(B.ROOT, big)) else f'images/v2/{name}-800.webp'
    return path, B.Image.open(os.path.join(B.ROOT, path)).size


def schema_blocks(p):
    url = f'{B.SITE}/{p["slug"]}'
    crumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': B.SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': NAMES.get(p['hub'], ''), 'item': B.SITE + p['hub']},
        {'@type': 'ListItem', 'position': 3, 'name': p['crumb'], 'item': url}]}
    out = [crumbs]
    if p['faq']:
        out.append({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': qa['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': qa['a']}} for qa in p['faq']]})
    blocks = ''
    for d in out:
        body = json.dumps(d, indent=2, ensure_ascii=False).replace('</', '<\\/')
        blocks += f'  <!-- Schema: {d["@type"]} -->\n  <script type="application/ld+json">\n{body}\n  </script>\n'
    return blocks


def head(p):
    url = f'{B.SITE}/{p["slug"]}'
    big, (w, h) = photo_size(p['hero']['photo'])
    small = f'images/v2/{p["hero"]["photo"]}-800.webp'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
{GTM.HEAD}  <title>{esc(p["title"])}</title>
  <meta name="description" content="{attr(p["meta"])}">
  <meta property="og:title" content="{attr(p["title"])}">
  <meta property="og:description" content="{attr(p["meta"])}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{B.SITE}/{big}">
  <meta property="og:image:width" content="{w}">
  <meta property="og:image:height" content="{h}">
  <meta name="twitter:card" content="summary_large_image">
  {MARK}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/brand/logo/kit/favicon-32.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="canonical" href="{url}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <link rel="stylesheet" href="{B.FONTS}">
  <link rel="stylesheet" href="css/global.css">
  <link rel="stylesheet" href="css/gatehouse.css">
  <link rel="stylesheet" href="css/v2.css">
  <link rel="stylesheet" href="css/v2-pages.css">

{schema_blocks(p)}  <link rel="preload" as="image" type="image/webp" href="{big}" media="(min-width: 768px)" fetchpriority="high">
  <link rel="preload" as="image" type="image/webp" href="{small}" media="(max-width: 767px)" fetchpriority="high">
</head>
'''


@functools.lru_cache(None)
def _forms():
    """The two inquiry forms, exactly as their own pages build them: /elopements' elopement-inquiry
    and /book's booking-inquiry (with the script that fills its attribution fields)."""
    el = _module('lfpage_elopements', os.path.join(HERE, 'elopements.py'))
    bk = _module('lfpage_book', os.path.join(HERE, 'book.py'))
    el_form = re.search(r'<form class="lf-form lf-form--light" name="elopement-inquiry".*?</form>', el.page_elopements()[3], re.S)
    bk_form = re.search(r'<form class="lf-bk-form" name="booking-inquiry".*?</form>\s*<script>.*?</script>', bk.page_book()[3], re.S)
    return {'elopement': ('elopement-inquiry', el_form.group(0)), 'booking': ('booking-inquiry', bk_form.group(0))}


def form_html(p):
    name, form = _forms()[p['form']]
    tag = f'<input type="hidden" name="form-name" value="{name}">'
    assert tag in form, f'the {name} form changed shape; pseo.py looks for {tag}'
    return form.replace(tag, tag + f'\n            <input type="hidden" name="page" value="/{p["slug"]}">', 1)


def inquiry(data, p):
    intro_block = data['blocks'].get(p.get('form_intro') or '', {})
    form = form_html(p)
    if p['form'] == 'elopement':
        h2 = (heading(intro_block['heading'], intro_block.get('heading_em', '')) if intro_block.get('heading')
              else heading('Your marriage deserves a beginning', 'this dramatic'))
        lead = paras(intro_block['text']) if intro_block else "<p>Tell us your date, your vision, and how many people you're bringing. We'll design the rest.</p>"
        return f'''
    <!-- ========== INQUIRY: /elopements' own form, the page named in a hidden field ========== -->
    <section class="lf-sec lf-parch" id="inquiry" aria-labelledby="iq-h">
      <div class="lf-wrap lf-inq">
        <div class="lf-center">
          <p class="lf-eyebrow lf-rise">Inquire</p>
          <h2 class="lf-h2 lf-rise" id="iq-h">{h2}</h2>
          <div class="lf-lead lf-rise ps-intro">{lead}</div>
        </div>
        <div class="lf-inq__wrap lf-rise">
          {form}
          <p class="lf-inq__talk">Prefer to talk? Call us at <a href="tel:+17065024823">706-502-4823</a> or email <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a></p>
        </div>
      </div>
    </section>
'''
    h2 = heading(intro_block.get('heading') or 'Prefer a personal response?', intro_block.get('heading_em', ''))
    lead = paras(intro_block['text']) if intro_block else "<p>Tell us what you're looking for and we'll respond within 2 hours.</p>"
    return f'''
    <!-- ========== INQUIRY: /book's own form, the page named in a hidden field ========== -->
    <section id="inquiry" class="lf-sec lf-light lf-bk-ask" aria-labelledby="bk-q">
      <div class="lf-bk-ask__in">
        <h2 class="lf-h2" id="bk-q">{h2}</h2>
        <div class="lf-lead ps-intro">{lead}</div>
        {form}
      </div>
    </section>
'''


def block_html(data, name, i):
    b = data['blocks'][name]
    tone = 'lf-light' if i % 2 == 0 else 'lf-dark'
    eyebrow = f'<p class="lf-eyebrow lf-rise">{esc(b["eyebrow"])}</p>' if b.get('eyebrow') else ''
    h2 = f'<h2 class="lf-h2 lf-rise" id="ps-b{i}">{heading(b.get("heading", ""), b.get("heading_em", ""))}</h2>' if b.get('heading') else ''
    label = f' aria-labelledby="ps-b{i}"' if b.get('heading') else ''
    words_ = f'<div class="lf-body lf-rise">{paras(b["text"])}</div>'
    if b.get('photo'):
        flip = ' lf-split--flip' if i % 2 else ''
        pic = B.pic(b['photo'], attr(b.get('alt', '')), '(min-width: 900px) 50vw, 100vw')
        return f'''
    <section class="lf-sec {tone} ps-block"{label}>
      <div class="lf-wrap lf-split{flip}">
        <figure class="lf-photo lf-photo--tall lf-rise">{pic}</figure>
        <div>
          {eyebrow}
          {h2}
          {words_}
        </div>
      </div>
    </section>
'''
    return f'''
    <section class="lf-sec {tone} ps-block"{label}>
      <div class="lf-wrap ps-prose">
        {eyebrow}
        {h2}
        {words_}
      </div>
    </section>
'''


def quote_html(p):
    q = p['quote']
    return f'''
    <section class="lf-sec lf-parch" aria-label="Guest stories">
      <div class="lf-wrap lf-center">
        <figure class="ps-quote"><blockquote><p>“{esc(q["text"])}”</p></blockquote><figcaption>{esc(q["credit"])}</figcaption></figure>
        <p class="lf-reviews__more"><a href="/reviews" class="lf-link">More guest reviews →</a></p>
      </div>
    </section>
'''


def _long_date(s):
    try:
        d = datetime.date.fromisoformat(s)
    except (TypeError, ValueError):
        return s
    return f'{d.strftime("%B")} {d.day}, {d.year}'


def facts_html(data, p):
    if not p['facts']:
        return ''
    rows = ''
    for fid in p['facts']:
        f = data['facts'][fid]
        src = f.get('source') or re.sub(r'^https?://(www\.)?([^/]+).*$', r'\2', f['url'])
        rows += (f'\n          <li class="ps-fact"><p>{esc(f["text"])}</p><p class="ps-fact__src">'
                 f'<a href="{attr(f["url"])}" target="_blank" rel="noopener">{esc(src)}</a>, read {_long_date(f["checked"])}</p></li>')
    return f'''
    <section class="lf-sec lf-parch" aria-labelledby="ps-facts-h">
      <div class="lf-wrap ps-prose">
        <p class="lf-eyebrow lf-rise">Good to know</p>
        <h2 class="lf-h2 lf-rise" id="ps-facts-h">The facts, <em>with their sources</em></h2>
        <ul class="ps-facts lf-rise">{rows}
        </ul>
      </div>
    </section>
'''


def faq_html(p):
    if not p['faq']:
        return ''
    items = ''.join(f'<details class="lf-faq__item"><summary>{esc(qa["q"])}</summary><p>{esc(qa["a"])}</p></details>' for qa in p['faq'])
    return f'''
    <section class="lf-sec lf-light" aria-labelledby="ps-fq-h">
      <div class="lf-wrap lf-faq">
        <p class="lf-eyebrow lf-rise">Questions</p>
        <h2 class="lf-h2 lf-rise" id="ps-fq-h">Everything <em>you're wondering</em></h2>
        <div class="lf-faq__list lf-rise">{items}</div>
      </div>
    </section>
'''


def related_html(data, p, linkable):
    by_slug = {slug_of(q): q for q in data['pages']}
    cards = [(p['hub'], 'Loxley Forest', NAMES[p['hub']])]
    for link in p['links_to']:
        target = link.split('#')[0].lstrip('/')
        if target in by_slug:
            if target not in linkable:
                continue   # held: the link appears once that page is written
            q = by_slug[target]
            cards.append((link, q['eyebrow'], (q['h1'] + ' ' + q.get('h1_em', '')).strip()))
        else:
            cards.append((link, 'Loxley Forest', NAMES.get(link.split('#')[0], link)))
    seen, lis = set(), ''
    for href, eyebrow, title in cards:
        if href in seen:
            continue
        seen.add(href)
        lis += f'<li><a href="{attr(href)}"><span>{esc(eyebrow)}</span><b>{esc(title)}</b></a></li>'
    return f'''
    <section class="lf-sec lf-dark" aria-labelledby="ps-rel-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow" id="ps-rel-h">Read on</p>
        <ul class="ps-related">{lis}</ul>
      </div>
    </section>
'''


def body_html(data, p, linkable):
    big, (w, h) = photo_size(p['hero']['photo'])
    small = f'images/v2/{p["hero"]["photo"]}-800.webp'
    if p['form'] == 'elopement':
        actions = ('<a href="#inquiry" class="lf-btn lf-btn--ghost">Inquire about your date</a>'
                   '<a href="/elopements#packages" class="lf-link">See the packages</a>')
    else:
        actions = f'<a href="/book" class="lf-btn">{B.ACORN}Book your dates</a><a href="#inquiry" class="lf-link">Send us your dates</a>'
    out = f'''
    <!-- ========== A search landing page, built by scripts/site/pages/pseo.py from scripts/site/pseo/ ========== -->
    <section class="lf-hero lf-hero--page" aria-label="{attr(p["crumb"])}">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="{small}" type="image/webp"><img src="{big}" width="{w}" height="{h}" alt="{attr(p["hero"]["alt"])}" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">{esc(p["eyebrow"])}</p>
        <h1 class="lf-h1">{heading(p["h1"], p.get("h1_em", ""))}</h1>
        <p class="lf-lead">{esc(p["lead"]["text"])}</p>
        <div class="lf-actions">{actions}</div>
      </div>
    </section>

    <nav class="ps-crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="{attr(p["hub"])}">{esc(NAMES[p["hub"]])}</a></li><li aria-current="page">{esc(p["crumb"])}</li></ol></nav>
'''
    for i, name in enumerate(p['blocks']):
        out += block_html(data, name, i)
        if i == 1 and p['quote']:
            out += quote_html(p)
    if len(p['blocks']) < 2 and p['quote']:
        out += quote_html(p)
    out += facts_html(data, p) + faq_html(p)
    if p['form'] == 'booking':
        out += '\n' + B.final_call('/book')
    out += inquiry(data, p) + related_html(data, p, linkable)
    return out


def page_fn(data, p, linkable, banner=None):
    """The page as build_v2 builds every page: (file, head, Tag Manager's noscript, body, the Book
    button's link, the booking calendar)."""
    def page():
        body = body_html(data, p, linkable)
        if banner:
            body = banner + body
        return p['slug'] + '.html', head(p), GTM.BODY.rstrip('\n'), body, '/book', False
    page.__name__ = 'page_' + p['slug'].replace('-', '_')
    return page


# ------------------------------------------------------------------ after the build

def sitemap_text(current, built):
    entries = ''.join(f'  <url>\n    <loc>{B.SITE}/{p["slug"]}</loc>\n    <lastmod>{p["updated"]}</lastmod>\n'
                      f'    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n' for p in built)
    block = '  <!-- pseo -->\n' + entries + '  <!-- /pseo -->\n'
    if '<!-- pseo -->' in current:
        return re.sub(r'  <!-- pseo -->\n.*?  <!-- /pseo -->\n', lambda m: block, current, count=1, flags=re.S)
    return current.replace('</urlset>', block + '</urlset>', 1)


def write_sitemap():
    current = open(SITEMAP, encoding='utf-8').read()
    new = sitemap_text(current, BUILT)
    if new != current:
        open(SITEMAP, 'w', encoding='utf-8').write(new)
        print('wrote sitemap.xml, %d landing pages' % len(BUILT))


def stale():
    """Pages this generator wrote that are no longer written: dropped from the data, or refused."""
    keep = {p['slug'] + '.html' for p in BUILT}
    return sorted(n for n in os.listdir(B.ROOT) if n.endswith('.html') and n not in keep and ours(n))


def take_down():
    for name in stale():
        os.remove(os.path.join(B.ROOT, name))
        print('took down', name, '(not written this build)')


def report(verdict):
    for p in DATA['pages']:
        reasons = verdict[slug_of(p)]
        if reasons:
            kind = 'held' if all(c in HELD for c, _ in reasons) else 'REFUSED'
            print(f'pseo: {kind} /{slug_of(p)}, not written:')
            for c, m in reasons:
                print(f'    [{c}] {m}')
    for p in BUILT:
        for link in p['links_to']:
            target = link.split('#')[0].lstrip('/')
            if target in VERDICT and VERDICT[target]:
                print(f'pseo: /{slug_of(p)} leaves off its link to /{target} until that page is written')


DATA = load()
VERDICT, STATS = judge(DATA)
BUILT = [p for p in DATA['pages'] if not VERDICT[slug_of(p)]]
_LINKABLE = {slug_of(p) for p in BUILT}
PAGES = [page_fn(DATA, p, _LINKABLE) for p in BUILT]
AFTER = [lambda: report(VERDICT), write_sitemap, take_down]

CSS = '''
.ps-crumbs { background: var(--linen); border-bottom: 1px solid rgba(61, 50, 40, 0.12); padding: 0 var(--pad-x); }
.ps-crumbs ol { list-style: none; max-width: 1200px; margin: 0 auto; padding: 10px 0; display: flex; flex-wrap: wrap; align-items: center; gap: 0 10px; font-family: 'Montserrat', sans-serif; font-size: 0.6875rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--stone); }
.ps-crumbs li + li::before { content: '/'; margin-right: 10px; opacity: 0.5; }
.ps-crumbs a { display: inline-block; padding: 12px 0; color: var(--forest-deep); text-decoration: none; }
.ps-crumbs a:hover { text-decoration: underline; }
.ps-crumbs a:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 2px; }
.ps-block .lf-body, .ps-prose .lf-body { margin-top: 26px; }
.ps-prose { max-width: 46rem; }
.ps-quote { margin: 0 auto; max-width: 42rem; }
.ps-quote blockquote { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-style: italic; font-size: clamp(1.6rem, 4.6vw, 2.4rem); line-height: 1.35; color: var(--forest-deep); }
.ps-quote blockquote p { margin: 0; }
.ps-quote figcaption { margin-top: 22px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--stone); }
.ps-facts { list-style: none; margin: 34px 0 0; padding: 0; }
.ps-fact { padding: 20px 0; border-top: 1px solid rgba(26, 46, 26, 0.16); }
.ps-fact p { margin: 0; font-size: 1.15rem; line-height: 1.6; color: var(--bark); }
.ps-fact .ps-fact__src { margin-top: 8px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; letter-spacing: 0.04em; line-height: 1.5; color: var(--stone); }
.ps-fact__src a { color: var(--forest-deep); }
.ps-intro p + p { margin-top: 0.6em; }
.ps-related { list-style: none; margin: 26px 0 0; padding: 0; display: grid; gap: 14px; }
@media (min-width: 900px) { .ps-related { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; } }
.ps-related a { display: block; height: 100%; padding: 22px 22px 24px; border: 1px solid rgba(247, 243, 237, 0.22); color: var(--on-dark); text-decoration: none; transition: background 0.2s; }
.ps-related a:hover { background: rgba(247, 243, 237, 0.06); }
.ps-related a:focus-visible { outline: 2px solid var(--on-dark); outline-offset: 2px; }
.ps-related span { display: block; font-family: 'Montserrat', sans-serif; font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--on-dark-muted); }
.ps-related b { display: block; margin-top: 10px; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 1.6rem; line-height: 1.2; }
'''
