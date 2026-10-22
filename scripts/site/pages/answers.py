"""The answer pages: plain, specific pages that answer the questions people ask AI assistants.

Mick, 2026-10-22: "we want to make sure ... we are front runners in those AI agents." The Scout's
memo (loxley-rescue docs/briefs/2026-10-22-scout-ai-assistants.md) found Google needs nothing more
than an indexed, snippet-eligible page, and Bing (behind Copilot) asks for content that is "fresh,
authoritative, structured, and semantically clear". So each page answers its question in its first
paragraph, then says only what the site or loxley-rescue canon/voice.md already says.

  /romantic-getaways-near-atlanta   A romantic getaway near Atlanta
  /where-to-propose-north-georgia   Where to propose in North Georgia

Where each fact comes from (nothing here is new):
  sixty feet up, the hundred-foot rope bridge, small warm lights: the home page, the treehouse
    schema, llms.txt; "the front door": canon (the arrival)
  42 acres of hardwood cove forest, Dahlonega, just over an hour north of Atlanta, the foothills,
    the mountain road, directions with the booking: the footer and faq.py
  the thirty-foot warm-up bridge, "It sways, by design.", WiFi, guests, dogs: faq.py
  the queen bed, the panoramic windows, the private deck, the fire pit, heated, no televisions:
    build_v2.py INCLUDED and the home page
  TreeMail around 8:30, the trails across 42 acres: faq.py and experiences.py
  the Dawn Table: experiences.py ADDONS (offered); the stars and the cathedral window: experiences.py
  the seasons: local_guide.py SEASONS; "The color comes in, the air turns...": canon (letter 2)
  the places and drive times near the treehouse, Spirits Tavern: local_guide.py, word for word
  couples celebrate anniversaries, proposals and elopements: elopements.py (the about block)
  "Celebrating something?" at checkout: js/gatehouse.js
  the whole price with taxes at /book: book.py; "the family who built it": build_v2.py
  check-in 3:00 PM, check-out 11:00 AM, early or late "may be available": terms (legal.py)
  the three places to ask, the secret, the photographer, "things like flowers, lanterns and
    champagne on ice", the night after, the reply "to you, and only you": the proposals page
    (branch proposals, 8feb5c7) and elopements.py SPACES
Left out on purpose: prices, any rating or count, superlatives, dates of any season, the Romance
and Celebration packages (still an open question for Mick), and weather (no covered place to ask is
named anywhere on the site).

The voice laws (canon/voice.md): no discount, "things like" for food, the only guarantees are
abundance and premium champagne with fresh-squeezed orange juice, no em dashes.

Schema: each page carries an FAQPage written from the same list as its visible questions (so the
two never drift), and a BreadcrumbList. No aggregateRating (Mick, 2026-10-20).
"""
import html
import json
import re

import build_v2 as B

ACORN = B.ACORN
SITE = B.SITE


def _plain(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s))


def _block(data):
    """One schema.org block, written the way build_v2.set_schema writes one."""
    body = json.dumps(data, indent=2, ensure_ascii=False).replace('</', '<\\/')
    return '<!-- Schema: ' + data['@type'] + ' -->\n  <script type="application/ld+json">\n' + body + '\n  </script>'


SCHEMA_RE = re.compile(r'<!-- Schema: [A-Za-z]+ -->\s*<script type="application/ld\+json">.*?</script>\s*', re.S)


def set_schemas(head, blocks):
    """The page's schema blocks, written fresh on every build, before the preloads (the builder's
    set_schema keeps one block a page; these pages carry two)."""
    head = SCHEMA_RE.sub('', head)
    at = head.find('<link rel="preload"')
    at = at if at >= 0 else head.rindex('</head>')
    return head[:at] + '\n  '.join(_block(d) for d in blocks) + '\n  ' + head[at:]


def faq_schema(qa):
    return {'@context': 'https://schema.org', '@type': 'FAQPage',
            'mainEntity': [{'@type': 'Question', 'name': q,
                            'acceptedAnswer': {'@type': 'Answer', 'text': _plain(a)}} for q, a in qa]}


def crumbs(path, name):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
            'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Loxley Forest', 'item': SITE + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': name, 'item': SITE + path}]}


def faq_html(qa, eyebrow, h2):
    items = ''.join(f'\n          <div class="lf-ans-faq__item"><h3>{html.escape(q, quote=False)}</h3><p>{a}</p></div>' for q, a in qa)
    return f'''    <section class="lf-sec lf-light" aria-labelledby="fq-h">
      <div class="lf-wrap lf-ans-faq">
        <p class="lf-eyebrow lf-rise">{eyebrow}</p>
        <h2 class="lf-h2 lf-rise" id="fq-h">{h2}</h2>
        <div class="lf-ans-faq__list lf-rise">{items}
        </div>
      </div>
    </section>
'''


def hero(label, desk, phone, alt, w, h, eyebrow, h1, lead, actions):
    return f'''    <section class="lf-hero lf-hero--page lf-hero--short" aria-label="{label}">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="{phone}" type="image/webp"><img src="{desk}" width="{w}" height="{h}" alt="{alt}" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">{eyebrow}</p>
        <h1 class="lf-h1">{h1}</h1>
        <p class="lf-lead">{lead}</p>
        <div class="lf-actions">{actions}</div>
      </div>
    </section>
'''


def preload(desk, phone):
    return (f'<link rel="preload" as="image" type="image/webp" href="{desk}" media="(min-width: 768px)" fetchpriority="high">\n'
            f'  <link rel="preload" as="image" type="image/webp" href="{phone}" media="(max-width: 767px)" fetchpriority="high">')


# ------------------------------------------------- a romantic getaway near Atlanta

ROMANTIC_PATH = '/romantic-getaways-near-atlanta'

ROMANTIC_QA = [
    ('How far is Loxley Forest from Atlanta?',
     'Just over an hour north of Atlanta, in the foothills above Dahlonega, Georgia. Detailed directions come with '
     'your booking confirmation.'),
    ('How many guests can stay?',
     'The treehouse sleeps 4 comfortably, and up to 6 guests in all. Children are welcome.'),
    ('Can we bring our dog?',
     'Yes, up to two well-behaved dogs, with no fee (dogs only, please). The bridge sways sixty feet up, so if '
     "you're not sure how your dog will take it, write to us before you book."),
    ('Is there WiFi?',
     'Yes. But we encourage you not to use it.'),
    ('What time are check-in and check-out?',
     'Check-in is from 3:00 PM and check-out is by 11:00 AM. Early check-in or late check-out may be available, '
     'so just ask.'),
]

# Near the treehouse, with the drive, as the local guide gives them (local_guide.py).
NEARBY = [
    ('Doghobble Wine Farm', 'About 5 min'),
    ('Cavender Creek Vineyards', 'About 5 min'),
    ('Lake Zwerner', 'About 7 min'),
    ('Consolidated Gold Mine', 'About 8 min'),
    ('Kaya Vineyard &amp; Winery', 'About 12 min'),
    ('Wolf Mountain Vineyards', 'About 15 min'),
    ("Preacher's Rock from Woody Gap", 'About 25 min'),
    ('Amicalola Falls', 'About 45 min'),
]


def page_romantic():
    desk, phone = 'images/v2/eq3a0907-1600.webp', 'images/v2/treehouse-dusk-phone-900.webp'
    head, gtm = B.head_from('romantic-getaways-near-atlanta.html', preload(desk, phone))
    head = set_schemas(head, [faq_schema(ROMANTIC_QA), crumbs(ROMANTIC_PATH, 'A Romantic Getaway Near Atlanta')])
    nearby = ''.join(f'<li><span>{n}</span><b>{t}</b></li>' for n, t in NEARBY)
    body = f'''
    <!-- ========== HERO: the answer, first ========== -->
{hero('A romantic getaway near Atlanta', desk, phone, 'The treehouse at dusk, its canvas glowing, the rope bridge strung with lights', 1600, 1067,
      'A romantic getaway near Atlanta',
      'A treehouse sixty feet up, <em>just over an hour from Atlanta</em>',
      'Loxley Forest is a hand-built treehouse sixty feet up in the canopy of 42 acres of hardwood cove forest, in '
      'Dahlonega, Georgia, just over an hour north of Atlanta. You reach the door across a hundred-foot rope bridge '
      'strung with small warm lights.',
      f'<a href="/book" class="lf-btn">{ACORN}Book your dates</a><a href="#stay" class="lf-link">What a stay is like</a>')}
    <!-- ========== WHAT A STAY IS LIKE ========== -->
    <section class="lf-sec lf-light" id="stay" aria-labelledby="st-h">
      <div class="lf-wrap lf-split">
        <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('img_0831', 'The bed beneath the treehouse windows', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">What a stay is like</p>
          <h2 class="lf-h2 lf-rise" id="st-h">The bridge, the deck, <em>the fire and the stars</em></h2>
          <div class="lf-body lf-ans lf-rise" style="margin-top:24px">
            <p>The crossing comes first. A thirty-foot rope bridge is the warm-up, then the hundred-foot bridge carries you through the trees to your front door. It sways, by design.</p>
            <p>Inside, a queen bed is framed by panoramic windows. Outside, a private deck sits above the forest floor, with a fire pit on the ground below.</p>
            <p>In the morning, TreeMail leaves things like fresh pastries in the box where you enter the bridges, around 8:30. Or add the Dawn Table, and breakfast is carried across the bridge to your door, with a late checkout to go with it.</p>
            <p>After dark, light a fire in the pit on the forest floor, then watch the stars from the deck. When the leaves drop, the canopy opens over you. In the warmer months, the stars show in pockets between the branches, like the sky through a cathedral window.</p>
            <p>By day, walk the trails across 42 acres. The only schedule is sunrise and sunset. There are no televisions. On purpose.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== THE SEASONS ========== -->
    <section class="lf-sec lf-parch" aria-labelledby="se-h">
      <div class="lf-wrap lf-split lf-split--flip">
        <figure class="lf-photo lf-rise">{B.pic('aerial-fall', 'The treehouse from above, small among red and gold fall treetops', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">The seasons</p>
          <h2 class="lf-h2 lf-rise" id="se-h">Fall color. <em>Winter fires.</em></h2>
          <div class="lf-body lf-ans lf-rise" style="margin-top:24px">
            <p>In fall, the canopy turns gold, then crimson, then amber. The color comes in, the air turns, and the treehouse doesn't look at it. It sits inside it.</p>
            <p>In winter, there is frost on the rope bridge, and the bare canopy shows views the leaves keep secret. The treehouse is heated for the cold seasons, and the fire pit feels essential.</p>
            <p>In spring, mountain laurel blooms along the trails. In summer, the windows open to the forest and the evenings on the deck run long.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== GETTING HERE, AND WHAT IS NEAR ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="gh-h">
      <div class="lf-wrap lf-split lf-ans-near">
        <div>
          <p class="lf-eyebrow lf-rise">Getting here</p>
          <h2 class="lf-h2 lf-rise" id="gh-h">Just over an hour <em>north of Atlanta</em></h2>
          <div class="lf-body lf-ans lf-rise" style="margin-top:24px">
            <p>We're in the foothills above Dahlonega, just over an hour north of Atlanta. The last mile is a mountain road. That's how you know you're close. Detailed directions come with your booking confirmation.</p>
            <p>Dahlonega sits at the heart of Georgia's wine country. For dinner, our default is Spirits Tavern, on the square. Call ahead on weekends.</p>
          </div>
        </div>
        <div>
          <p class="lf-ans-near__h lf-rise">Near the treehouse, by car</p>
          <ul class="lf-drive lf-rise">{nearby}</ul>
          <p class="lf-body lf-ans lf-rise" style="margin-top:28px">Hours change by season, so call ahead before you go. The rest is in <a href="/local-guide">the local guide</a>.</p>
        </div>
      </div>
    </section>

    <!-- ========== ANNIVERSARIES AND PROPOSALS ========== -->
    <section class="lf-sec lf-light" aria-labelledby="oc-h">
      <div class="lf-wrap lf-split">
        <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('eq3a0943', 'The rope bridge at night, strung with warm lights', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">Anniversaries and proposals</p>
          <h2 class="lf-h2 lf-rise" id="oc-h">An anniversary, a proposal, <em>a wedding in the trees</em></h2>
          <div class="lf-body lf-ans lf-rise" style="margin-top:24px">
            <p>Couples come to Loxley Forest to celebrate anniversaries, proposals and elopements. When you book, tell us what you're celebrating.</p>
            <p>Planning to propose? Ask on the rope bridge, by the Compass Fire Pit or on the canopy deck, and we'll help set the scene. See <a href="/where-to-propose-north-georgia">where to propose in North Georgia</a>, or go straight to <a href="/proposals">proposals at Loxley Forest</a>.</p>
            <p>If you'd rather marry here, the hundred-foot rope bridge becomes the aisle. Then stay the night. <a href="/elopements">See elopements</a>.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== HOW TO BOOK ========== -->
    <section class="lf-sec lf-parch lf-center" aria-labelledby="bk-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">How to book</p>
        <h2 class="lf-h2 lf-rise" id="bk-h">Book direct with <em>the family who built it</em></h2>
        <p class="lf-lead lf-ans lf-rise">Every open night is on our <a href="/book">booking calendar</a>. Pick your dates and the whole price appears, taxes included.</p>
        <p class="lf-body lf-ans lf-rise" style="margin-top:14px">Questions first? Call or text <a href="tel:+17065024823">706-502-4823</a>, or write to <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a>.</p>
        <div class="lf-actions lf-rise" style="justify-content:center"><a href="/book" class="lf-btn">{ACORN}Book your dates</a></div>
      </div>
    </section>

    <!-- ========== QUESTIONS (the FAQPage schema is written from the same list) ========== -->
{faq_html(ROMANTIC_QA, 'Questions', 'Before you <em>come up</em>')}'''
    return 'romantic-getaways-near-atlanta.html', head, gtm, body, '/book', False


# ------------------------------------------------- where to propose in North Georgia

PROPOSE_PATH = '/where-to-propose-north-georgia'

PROPOSE_QA = [
    ('Can you keep the proposal a secret?',
     'Yes. We plan it with you and no one else, and to your partner it can be a night away in the trees right up '
     'until you ask.'),
    ('Can we have a photographer there?',
     'Yes. We coordinate with a photographer you choose, or one we suggest, so they know where to be and when.'),
    ('Where on the property can I propose?',
     'On the hundred-foot rope bridge, by the Compass Fire Pit on the forest floor, or on the private deck of the '
     'treehouse, sixty feet up.'),
    ('How far is it from Atlanta?',
     'Just over an hour north of Atlanta, in the foothills above Dahlonega, Georgia. Detailed directions come with '
     'your booking confirmation.'),
    ('Can we stay the night after?',
     'Yes. Book your dates and the treehouse is yours until morning, with check-in from 3:00 PM and check-out by '
     '11:00 AM.'),
]

# Where to ask: (photo, alt, kicker, name, words). The facts of elopements.py SPACES and the proposals page.
SPOTS = [
    ('img_2726', 'The rope bridge leading through the canopy to the treehouse', 'The crossing', 'The Rope Bridge',
     'A hundred feet of suspended bridge between two white oaks, sixty feet up and strung with small warm lights. '
     'Halfway across, you stop noticing the height and start noticing the silence.'),
    ('img_1717', 'The stone fire pit on the forest floor, ringed with ferns', 'On the forest floor', 'The Compass Fire Pit',
     'A boulder fire pit set at the four compass points, ringed with ferns. Ask after dark, with the fire lit.'),
    ('img_2546', 'The treehouse deck with chairs, above the forest', 'Just the two of you', 'The Canopy Deck',
     'The private deck of the treehouse, sixty feet in the air, with nothing around you but the canopy.'),
]

PLANNING = [
    ('We keep it a secret.',
     'We plan it with you and no one else. To your partner it can be a night away in the trees, right up until you ask.'),
    ('We coordinate a photographer.',
     'One you choose, or one we suggest, so they know where to be and when.'),
    ('We set the scene.',
     'Things like flowers, lanterns and champagne on ice, ready where you plan to ask.'),
]


def page_propose():
    desk, phone = 'images/v2/eq3a0160-1600.webp', 'images/v2/eq3a0160-800.webp'
    head, gtm = B.head_from('where-to-propose-north-georgia.html', preload(desk, phone))
    head = set_schemas(head, [faq_schema(PROPOSE_QA), crumbs(PROPOSE_PATH, 'Where to Propose in North Georgia')])
    spots = ''.join(
        f'<figure class="lf-space lf-rise">{B.pic(img, alt, "(min-width: 900px) 33vw, 100vw")}<figcaption>'
        f'<span class="lf-chapter__n">{kicker}</span><h3 class="lf-h3">{name}</h3><p>{words}</p></figcaption></figure>'
        for img, alt, kicker, name, words in SPOTS)
    planning = ''.join(f'<li><b>{t}</b> {w}</li>' for t, w in PLANNING)
    body = f'''
    <!-- ========== HERO: the answer, first ========== -->
{hero('Where to propose in North Georgia', desk, phone, 'The rope bridge to the treehouse in fall colour', 1600, 1067,
      'Where to propose in North Georgia',
      'On a rope bridge, <em>sixty feet up</em>',
      'For a proposal in North Georgia, Loxley Forest has a hundred-foot rope bridge strung with small warm lights, '
      'sixty feet up in a hardwood cove forest in Dahlonega, just over an hour north of Atlanta. Ask on the bridge, '
      'by the fire or on the treehouse deck, then stay the night.',
      '<a href="/proposals#inquiry" class="lf-btn lf-btn--ghost">Plan your proposal</a><a href="#where" class="lf-link">Where to ask</a>')}
    <!-- ========== WHERE TO ASK ========== -->
    <section class="lf-sec lf-dark" id="where" aria-labelledby="wh-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Where to ask</p>
        <h2 class="lf-h2 lf-rise" id="wh-h">Three places <em>to ask the question</em></h2>
        <div class="lf-spaces">{spots}</div>
      </div>
    </section>

    <!-- ========== HOW PLANNING WORKS ========== -->
    <section class="lf-sec lf-light" aria-labelledby="hw-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow lf-rise">How planning works</p>
          <h2 class="lf-h2 lf-rise" id="hw-h">We keep the secret. <em>You keep the words.</em></h2>
          <p class="lf-lead lf-rise">Tell us the date you have in mind and how you picture it: golden hour on the bridge, or a fire after dark. Then we plan it with you.</p>
          <ul class="lf-acorns lf-rise">{planning}</ul>
        </div>
        <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('eq3a0943', 'The rope bridge at night, strung with warm lights', '(min-width: 900px) 50vw, 100vw')}</figure>
      </div>
    </section>

    <!-- ========== AFTER THE YES ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="ay-h">
      <div class="lf-wrap lf-split lf-split--flip">
        <figure class="lf-photo lf-rise">{B.pic('img_0828', 'The bed beneath the treehouse windows in warm light', '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">After the yes</p>
          <h2 class="lf-h2 lf-rise" id="ay-h">Stay the night <em>in the trees</em></h2>
          <div class="lf-body lf-rise" style="margin-top:24px">
            <p>The treehouse is yours until morning: a queen bed framed by panoramic windows, a private deck above the forest floor, and the forest all around you.</p>
            <p>In the morning, add the Dawn Table: breakfast carried across the bridge to your door, with a late checkout to go with it.</p>
          </div>
          <div class="lf-actions lf-rise"><a href="/book" class="lf-btn">{ACORN}Book your dates</a></div>
        </div>
      </div>
    </section>

    <!-- ========== THE FULL PAGE AND ITS FORM ========== -->
    <section class="lf-sec lf-parch lf-center" aria-labelledby="pl-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Proposals at Loxley Forest</p>
        <h2 class="lf-h2 lf-rise" id="pl-h">Ready to <em>start planning?</em></h2>
        <p class="lf-lead lf-ans lf-rise">Our <a href="/proposals">proposals page</a> has the whole story and a short form. Tell us the date, the place and the feeling you want, and we'll write back to you, and only you, to plan it.</p>
        <p class="lf-body lf-ans lf-rise" style="margin-top:14px">Or call or text <a href="tel:+17065024823">706-502-4823</a>, or write to <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a>. Thinking further ahead? On our <a href="/elopements">elopements</a> page, the same bridge becomes the aisle.</p>
        <div class="lf-actions lf-rise" style="justify-content:center"><a href="/proposals#inquiry" class="lf-btn">{ACORN}Plan your proposal</a></div>
      </div>
    </section>

    <!-- ========== QUESTIONS (the FAQPage schema is written from the same list) ========== -->
{faq_html(PROPOSE_QA, 'Questions', 'Before you <em>ask</em>')}'''
    return 'where-to-propose-north-georgia.html', head, gtm, body, '/book', False


PAGES = [page_romantic, page_propose]

CSS = '''
/* links inside the answer pages' words: underlined, in the ink of their ground */
.lf-ans a { color: var(--forest-deep); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
.lf-dark .lf-ans a { color: var(--on-dark); }

/* getting here: the words, then the places near the treehouse with their drive */
.lf-ans-near.lf-split { align-items: start; }
.lf-ans-near__h { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--on-dark-muted); }
.lf-ans-near .lf-drive { margin-top: 18px; max-width: none; }
@media (min-width: 900px) { .lf-ans-near__h { margin-top: 8px; } }

/* questions, every answer open: a page of answers reads in full, with or without script */
.lf-ans-faq { max-width: 46rem; }
.lf-ans-faq__list { margin-top: 36px; }
.lf-ans-faq__item { padding: 24px 0; border-top: 1px solid rgba(26, 46, 26, 0.16); }
.lf-ans-faq__item:last-child { border-bottom: 1px solid rgba(26, 46, 26, 0.16); }
.lf-ans-faq__item h3 { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: clamp(1.45rem, 4.6vw, 1.8rem); line-height: 1.2; color: var(--forest-deep); }
.lf-ans-faq__item p { margin: 10px 0 0; max-width: 40rem; font-size: 1.15rem; line-height: 1.7; color: var(--stone); }
'''
