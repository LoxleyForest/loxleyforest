"""The experiences page: what every stay holds, and what can be added to it.

Facts from the old experiences.html, the add-ons in your-adventure.html (its "EDIT: the add-ons"
list) and Mick's rulings of 2026-10-15 (TreeMail) and 2026-10-19 (the oven, the skillet, the fire
pit grill, the fire table). No prices on this page: none were on the old page, and an add-on's
price comes only from loxley-rescue docs/pricing.md.
"""
import build_v2 as B

ACORN = B.ACORN


def chapter(n, title, img, alt, words, note, flip=False):
    """One chapter of the stay: a photograph beside its words."""
    cls = 'lf-split lf-split--flip' if flip else 'lf-split'
    body = ''.join(f'<p>{p}</p>' for p in words)
    return f'''        <article class="{cls} lf-xp lf-rise">
          <figure class="lf-photo lf-xp__photo">{B.pic(img, alt, '(min-width: 900px) 50vw, 100vw')}</figure>
          <div>
            <p class="lf-eyebrow">{n}</p>
            <h3 class="lf-h3 lf-xp__h">{title}</h3>
            <div class="lf-body lf-xp__body">{body}</div>
            <p class="lf-xp__note">{note}</p>
          </div>
        </article>
'''


def ritual(img, alt, title, words, note):
    return (f'<figure class="lf-chapter lf-rise">{B.pic(img, alt, "(min-width: 900px) 25vw, 78vw")}'
            f'<figcaption><span class="lf-chapter__n">{note}</span><h3 class="lf-h3">{title}</h3><p>{words}</p></figcaption></figure>')


# EDIT: the add-ons. The old page's list, then the ones your-adventure.html offers that it lacked.
# Names and words only; never a price here unless it is in docs/pricing.md and Mick says to show it.
ADDONS = [
    ('Morning Moments', 'Champagne brunch at sunrise, crafted by Livy.'),
    ('The Dawn Table', 'Breakfast carried across the bridge to your door, with a late checkout to go with it.'),
    ('Forest Tableau', 'Our signature evening on a white oak slab from our forest.'),
    ('The Flight Deck', 'Sommelier-curated wines. Four pours. No two ever the same.'),
    ('The Landing', 'Artisan cheese paired to the Flight Deck.'),
    ('Golden Hour Beer Board', 'Craft beers, warm pretzels, a slow evening in the canopy.'),
    ('Khachapuri', 'Georgian cheese bread from our stone oven. Ancient tradition, sixty feet up.'),
    ('After Dark', "Champagne, strawberries, a blanket, and the sky you've never actually seen."),
    ('Romance Package', 'Champagne, candles, rose petals. Arranged before you arrive.'),
    ('Celebration Package', "Tell us what you're celebrating. We'll make it right."),
    ('A cake for the occasion', 'Name the occasion and we take it from there.'),
    ('Tea service', 'For the slow morning on the deck.'),
    ("The s'mores board", 'Not the grocery-store kind. The board changes with the micro-season.'),
    ('Firewood', 'A stack ready by the pit, so the first night needs no gathering.'),
    ('Loxley Provisions Box', 'A curated box of the region to take home.'),
]


def page_experiences():
    head, gtm = B.head_from('experiences.html', '<link rel="preload" as="image" type="image/webp" href="images/v2/eq3a0906-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="images/v2/eq3a0906-800.webp" media="(max-width: 767px)" fetchpriority="high">')
    chapters = ''.join([
        chapter('Chapter one', 'The Crossing', 'eq3a0943', 'The hundred-foot rope bridge at night, strung with warm lights', [
            "The thirty-foot bridge is the warm-up. Next come your first steps across the hundred-footer. The ground drops away. The trees rise to meet you. Your hands grip the ropes and your heart beats faster. Halfway across, you stop noticing the height and start noticing the silence."],
            "Every guest. It isn't optional. It's the way home."),
        chapter('Chapter two', 'First Light', 'eq3a9079', 'Morning sun flaring through the canopy, the treehouse small among the trees', [
            "The canopy at sunrise isn't a view. It's a slow-motion event. The mist lifts off the valley. The first birds call. The leaves above you glow gold, then green, then gold again, and you watch it from your bed, sixty feet in the air."],
            'Every morning the sun rises.', flip=True),
        chapter('Chapter three', 'Fire &amp; Flour', 'eq3a0222', 'The pizza oven on the sky deck', [
            'Every guest finds fresh pizza dough waiting in the treehouse. Our gift, your creation. Fire up the Gozney Roccbox on your sky deck, roll it out, build it however you want, and learn by doing.',
            "We include an appetizer-sized dough as your trial run. Burn it, learn from it, laugh about it. Then make the real one. Somewhere between the first attempt and the last slice you realize you're making pizza in the canopy of an ancient forest, and there's nowhere else you'd rather be."],
            'For guests, during their stay.'),
        chapter('Chapter four', 'After Dark', 'eq3a0946', 'The rope bridge lights climbing into the dark toward the glowing treehouse', [
            "When the leaves drop and the canopy opens, November through early spring, the night sky from your deck is staggering. No light pollution. The Milky Way isn't something you look up at. It's something you're inside.",
            'In the warmer months the canopy thickens and the stars show in pockets between the branches, like the sky through a cathedral window. The fire table on the sky deck keeps you out there longer.'],
            'For guests, during their stay.', flip=True),
        chapter('Chapter five', 'Fireside Cooking', 'img_1717', 'The stone fire pit on the forest floor, ringed with ferns', [
            'Build your own fire in the eight-foot pit on the forest floor and cook over the open flame. The fire pit grill hammers into the pit. There is a skillet for steak and eggs.',
            "Steaks, burgers, foil packets, whatever you bring. There's something primal about a dinner you cooked yourself under the stars."],
            'Anytime. Shoes recommended. Agenda not.'),
    ])
    rituals = ''.join([
        ritual('eq3a0337', 'The way onto the rope bridge in fall colour', 'TreeMail',
               "Fresh morning pastries in the TreeMail box where you enter the bridges, around 8:30, every morning of your stay. Unless you've booked the Dawn Table or Morning Moments instead.",
               'Every morning'),
        ritual('eq3a0907', 'The treehouse canvas glowing at dusk with string lights', "Stars &amp; S'mores",
               'Graham crackers, chocolate, marshmallows, and a fire you built yourself. The stars do the rest.',
               'Every evening'),
        ritual('img_2752', 'The sky deck with its screen down, two chairs and the pizza oven', 'Cinema Night',
               'A 101-inch screen rolls down from the sky deck ceiling, and back up when the stars win.',
               'Any night'),
        ritual('aerial-canopy', 'The treehouse and its decks from above, in the canopy', 'The Letter',
               'On the desk: stationery, a pen and an envelope. Write to yourself, to your partner, to who you want to be a year from now. Seal it and leave it with us. In twelve months it arrives at your door.',
               'The hidden chapter'),
    ])
    addons = ''.join(f'<li><b>{n}.</b> {d}</li>' for n, d in ADDONS)
    body = f'''
    <!-- ========== HERO ========== -->
    <section class="lf-hero lf-hero--page" aria-label="Experiences">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/eq3a0906-800.webp" type="image/webp"><img src="images/v2/eq3a0906-1600.webp" width="1600" height="1067" alt="The treehouse glowing at dusk, the rope bridge lit beside it" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">The Loxley experience</p>
        <h1 class="lf-h1">We don't offer amenities. <em>We offer chapters.</em></h1>
        <p class="lf-lead">Your stay is a story with a beginning, a middle, and a moment you'll still be talking about five years from now.</p>
        <div class="lf-actions"><a href="/book" class="lf-btn">{ACORN}Book your dates</a><a href="#more" class="lf-link">What you can add</a></div>
      </div>
    </section>

    <!-- ========== THE CHAPTERS: part of every stay ========== -->
    <section class="lf-sec lf-light" aria-labelledby="ch-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Part of every stay</p>
        <h2 class="lf-h2 lf-rise" id="ch-h">Your stay is a story, <em>not a checklist</em></h2>
        <div class="lf-xps">
{chapters}        </div>
      </div>
    </section>

    <!-- ========== THE SMALL RITUALS ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="ri-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Mornings and evenings</p>
        <h2 class="lf-h2 lf-rise" id="ri-h">The small rituals <em>that come with it</em></h2>
        <div class="lf-chapters">{rituals}</div>
      </div>
    </section>

    <!-- ========== BEYOND THE STAY: the add-ons ========== -->
    <section class="lf-sec lf-light" id="more" aria-labelledby="mo-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow lf-rise">Beyond the stay</p>
          <h2 class="lf-h2 lf-rise" id="mo-h">There's more <em>when you want it</em></h2>
          <ul class="lf-acorns lf-addons lf-rise">{addons}</ul>
        </div>
        <div>
          <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('img_2546', 'A treehouse deck with chairs above the forest', '(min-width: 900px) 50vw, 100vw')}</figure>
          <div class="lf-body lf-xp__how lf-rise">
            <p>Every experience is for guests, during their stay. Book your dates first. Your full experience guide arrives seven days before you do, and you choose from there.</p>
            <p>On the horizon: private chef dinners, full moon ceremonies, seasonal fire rituals, guided foraging walks. The menu grows with every season, and so does the forest.</p>
            <p>Questions? <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a> or <a href="tel:+17065024823">706-502-4823</a>.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== YOUR DATES ========== -->
{B.BOOK}
{B.REVIEWS}
{B.final_call('/book')}'''
    return 'experiences.html', head, gtm, body, '/book', True


PAGES = [page_experiences]

CSS = '''
.lf-xps { display: grid; gap: 64px; margin-top: 48px; }
.lf-xp .lf-photo img { aspect-ratio: 4 / 3; object-fit: cover; }
.lf-xp__h { color: var(--forest-deep); }
.lf-xp__body { margin-top: 14px; }
.lf-xp__note { margin: 18px 0 0; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--stone); }
@media (min-width: 900px) { .lf-xps { gap: 96px; margin-top: 64px; } .lf-xp .lf-photo img { aspect-ratio: 5 / 4; } }
.lf-addons li { font-size: 1.12rem; }
.lf-addons b { font-weight: 600; }
.lf-xp__how { margin-top: 28px; color: var(--stone); }
.lf-xp__how a { color: var(--forest-deep); }
.lf-xp__how a[href^="tel:"] { white-space: nowrap; }
'''
