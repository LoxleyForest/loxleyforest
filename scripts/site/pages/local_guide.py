"""The local guide (local-guide.html) in the new design.

Every place, drive time and detail is the old page's, tightened; no place, hours or price is
added. One line under the opening says hours change by season, so call ahead.
"""
import build_v2 as B

# chapter: (id, eyebrow, heading HTML, lead, photo, alt, places)
# place: (name, drive time or '', what it is, Mick's pick)
CHAPTERS = [
    ('wine', 'Wine country', '15 wineries. 20 minutes. <em>Start here.</em>',
     "Dahlonega sits at the heart of Georgia's wine country. These are the three we send every guest to, and two "
     'more for the ones who want to keep going.',
     'eq3a1665', 'The cove forest in fall, gold and orange leaves above the forest floor', [
         ('Wolf Mountain Vineyards', 'About 15 min',
          'The crown jewel. Award-winning wines, hilltop views, and a Sunday brunch that books up fast. If you can '
          'only do one winery, this is it.',
          'Call ahead for brunch. It fills up.'),
         ('Montaluce Winery &amp; Restaurant', 'About 20 min',
          'Best food in wine country. Floor-to-ceiling windows over the vineyard. Made for a long lunch with wine.',
          'The restaurant is the real draw.'),
         ('Kaya Vineyard &amp; Winery', 'About 12 min',
          '270-degree mountain views from a hilltop, the most dramatic vista of any winery in the area. Get there an '
          'hour before sunset with a glass in hand.',
          'The best free sunset show in North Georgia.'),
         ('Doghobble Wine Farm', 'About 5 min',
          'A working farm with wine. Dogs, chickens, alpacas. The most authentic, unpretentious winery in the area, '
          'and great food too.',
          'For guests who want real, not polished.'),
         ('Cavender Creek Vineyards', 'About 5 min',
          'Family-owned, laid-back, estate-grown wines. Right around the corner from Doghobble.',
          'Pair it with Doghobble for a slow afternoon close to the treehouse.'),
     ]),
    ('hiking', 'Hiking and waterfalls', 'Waterfalls, summits <em>and the Appalachian Trail</em>',
     'Some of the most dramatic hiking in the Southeast, all within 45 minutes. From easy waterfall walks to '
     'above-the-clouds sunrise hikes.',
     'eq3a0272', 'A leaf-covered trail through rhododendron and tall hardwoods', [
         ('Amicalola Falls', 'About 45 min',
          'The tallest cascading waterfall in Georgia, 729 feet, with several viewing platforms. The East Ridge Loop '
          'gives you the best of it.',
          'The waterfall to see. Stop at B.J. Reece Orchards on the way back for cider and doughnuts.'),
         ("Preacher's Rock from Woody Gap", 'About 25 min',
          'A short climb with a massive reward: one of the best views in North Georgia, 2 miles round trip on the '
          "Appalachian Trail. It faces southeast, so at sunrise you're above the clouds.",
          'Leave the treehouse by 6:30 AM. The best effort-to-reward ratio in the area.'),
         ('Raven Cliff Falls', 'About 35 min',
          '4.9 miles round trip to a stunning waterfall. Stream crossings, beautiful forest, real hiking.',
          'For guests who actually want to hike. Stop in Helen after for the mountain coaster.'),
         ('Lake Zwerner', 'About 7 min',
          'An easy, scenic loop around the reservoir. Flat, beautiful, accessible.',
          "Coffee at Jethro's first, then the loop. The perfect easy morning."),
     ]),
    ('downtown', 'Downtown Dahlonega', 'Gold rush history <em>and small-town character</em>',
     "America's first gold rush started here in 1828. The square still has its courthouse with the gold-leaf "
     'steeple, surrounded by local shops, restaurants and places that have nothing to do with a chain.',
     'eq3a0107', 'Mist in the tall hardwoods of the cove forest', [
         ('Spirits Tavern', '',
          'Elevated American fare on the square. Good cocktails, a solid menu. Our default dinner recommendation.',
          'Call ahead on weekends.'),
         ('Picnic Cafe', '',
          "The mayor's wife bakes. Small-town, personal, genuine. Great sandwiches and baked goods.",
          'The perfect quick lunch before you explore the square.'),
         ('Foothill Grill', 'About 10 min',
          'A breakfast legend. The cinnamon rolls are what people talk about.',
          'The cinnamon rolls. Get there early on weekends.'),
         ('Consolidated Gold Mine', 'About 8 min',
          '200 feet underground, a constant 60 degrees, a 40-minute guided tour through the original tunnels. Gold '
          'panning included.',
          'Our number one rainy-day pick. Underground means weatherproof.'),
         ("Jethro's Coffee House", '',
          'The coffee stop. Good coffee, a cozy room, right on the square.',
          "Coffee at Jethro's before a walk at Lake Zwerner. That's the move."),
         ('Dahlonega Fudge Factory', '',
          'Family-owned since 1982. More than 15 kinds of fudge, and the Dahlonega Nuggets: pecans in caramel, '
          'dipped in chocolate. An institution.',
          "Everyone stops here. It's part of the trip."),
         ('Paul Thomas Chocolates', '',
          'More than 120 handmade recipes, made on site. The elevated chocolate option.',
          'For couples who want something special to bring back to the treehouse.'),
     ]),
    ('day-trips', 'Day trips', 'Three mountain towns <em>within an hour</em>',
     'When you want to explore beyond Dahlonega, these three towns extend the adventure.',
     'eq3a1890', 'A creek running over rock through a forest of fall leaves', [
         ('Helen, GA', 'About 35 min',
          'A Bavarian village in the mountains. The real draw is the Alpine Coaster, gravity-powered with you in '
          'control of the speed, and $5 unlimited river tubing in summer.',
          'Do the coaster, walk the village, get ice cream. A full afternoon.'),
         ('Ellijay, GA', 'About 45 min',
          "Georgia's apple capital. In fall, B.J. Reece Orchards for apple picking and legendary doughnuts, then walk "
          "across to Reece's Cider Company for 16 hard ciders on tap.",
          'In fall, this is the day trip.'),
         ('Blue Ridge, GA', 'About 1 hr',
          'A vintage scenic railway along the Toccoa River. Zip lines and aerial courses at the Adventure Park. A more '
          'polished downtown with shops and galleries.',
          'Book the railway ahead. It sells out.'),
     ]),
]

SEASONS = [
    ('Spring', 'img_2726', 'The rope bridge to the treehouse under a fresh green canopy',
     'Wildflowers blanket the forest floor and mountain laurel blooms along every trail. The Dahlonega Butterfly '
     'Farm opens late March. The waterfalls run full, and the forest smells like rain and new growth.'),
    ('Summer', 'img_2752', 'The sky deck in summer: two chairs, the pizza oven and the cinema screen, deep in green leaves',
     'Fireflies in the forest at dusk: in June and July the canopy lights up from the inside. $5 unlimited tubing in '
     'Helen. Long evenings on the deck. The canopy is so thick the only light is green.'),
    ('Fall', 'aerial-fall', 'The treehouse from above, small among red and gold fall treetops',
     'Color at elevation arrives earlier and lasts longer. The canopy turns gold, then crimson, then amber. Apple '
     'picking in Ellijay. Gold Rush Days on the square. The most dramatic season, and the most popular. Book early.'),
    ('Winter', 'hero-bridge', 'The treehouse canvas glowing at night beside the lit rope bridge',
     'Frost on the rope bridge. The bare canopy shows views the leaves keep secret. The fire pit feels essential. Old '
     'Fashioned Christmas turns Dahlonega into the Christmas Town of the Southeast. The silence is deeper, the stars '
     'are brighter, and the forest is yours.'),
]

CHEAT = [
    ('One winery?', 'Wolf Mountain.', 'Call ahead for brunch.'),
    ('Two wineries?', 'Wolf Mountain and Montaluce.', 'Best food in wine country.'),
    ('A slow afternoon?', 'Doghobble and Cavender Creek.', 'Both 5 minutes from the treehouse.'),
    ('Best hike?', 'Amicalola Falls.', 'Stop at B.J. Reece Orchards on the way back.'),
    ('Quick hike, big views?', "Preacher's Rock from Woody Gap.", '2 miles. Above the clouds.'),
    ('Rainy day?', 'The Consolidated Gold Mine and the square.', 'Fudge, coffee, wine tasting.'),
    ('Nice dinner?', 'Spirits Tavern.', 'Call ahead on weekends.'),
    ('Best breakfast?', 'Foothill Grill.', 'The cinnamon rolls.'),
    ('Evening in?', 'Pizza on the sky deck.', 'Or a beer board and a projector movie.'),
    ('Secret sunrise?', "Preacher's Rock.", 'Leave the treehouse by 6:30 AM.'),
    ('Secret sunset?', 'Kaya Vineyard.', 'An hour before sunset. Wine in hand.'),
]


def chapter(i, c):
    cid, eyebrow, h2, lead, photo, alt, places = c
    tone = 'lf-light' if i % 2 == 0 else 'lf-dark'
    flip = ' lf-split--flip' if i % 2 else ''
    rows = ''.join(
        f'''
            <li class="lf-place">
              <h3 class="lf-place__name">{name}</h3>{f'<p class="lf-place__time">{t}</p>' if t else ''}
              <p class="lf-place__what">{what}</p>
              <p class="lf-place__pick"><span>Mick's pick</span> {pick}</p>
            </li>''' for name, t, what, pick in places)
    return f'''
    <!-- ========== {eyebrow.upper()} ========== -->
    <section class="lf-sec {tone}" id="{cid}" aria-labelledby="{cid}-h">
      <div class="lf-wrap lf-split lf-guide{flip}">
        <figure class="lf-photo lf-guide__photo lf-rise">{B.pic(photo, alt, '(min-width: 900px) 50vw, 100vw')}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">{eyebrow}</p>
          <h2 class="lf-h2 lf-rise" id="{cid}-h">{h2}</h2>
          <p class="lf-lead lf-rise">{lead}</p>
          <ul class="lf-places lf-rise">{rows}
          </ul>
        </div>
      </div>
    </section>
'''


def page_local_guide():
    head, gtm = B.head_from('local-guide.html', '<link rel="preload" as="image" type="image/webp" href="images/v2/ridge-sunset-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="images/v2/ridge-sunset-800.webp" media="(max-width: 767px)" fetchpriority="high">')
    chapters = ''.join(chapter(i, c) for i, c in enumerate(CHAPTERS))
    seasons = ''.join(
        f'<figure class="lf-chapter lf-rise">{B.pic(p, alt, "(min-width: 900px) 25vw, 78vw")}<figcaption><h3 class="lf-h3">{n}</h3><p>{t}</p></figcaption></figure>'
        for n, p, alt, t in SEASONS)
    cheat = ''.join(f'<div><dt>{q}</dt><dd><b>{a}</b> {r}</dd></div>' for q, a, r in CHEAT)
    jump = ''.join(f'<li><a href="#{c[0]}">{c[1]}</a></li>' for c in CHAPTERS) + '<li><a href="#seasons">Seasons</a></li><li><a href="#short-list">The short list</a></li>'
    body = f'''
    <!-- ========== HERO ========== -->
    <section class="lf-hero lf-hero--page lf-hero--short" aria-label="The local guide">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/ridge-sunset-800.webp" type="image/webp"><img src="images/v2/ridge-sunset-1600.webp" width="1600" height="1198" alt="The sun low over the North Georgia ridges, the forest turning for fall" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Local guide</p>
        <h1 class="lf-h1">Dahlonega and <em>the North Georgia mountains</em></h1>
        <p class="lf-lead">The spots we actually send our guests to. Not everything in town, just the places worth your time.</p>
        <p class="lf-guide__note">Hours change by season, so call ahead before you go.</p>
        <nav class="lf-jump" aria-label="On this page"><ul>{jump}</ul></nav>
      </div>
    </section>
{chapters}
    <!-- ========== SEASONS ========== -->
    <section class="lf-sec lf-parch lf-seasons" id="seasons" aria-labelledby="se-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Every season has a story</p>
        <h2 class="lf-h2 lf-rise" id="se-h">Seasonal highlights</h2>
        <div class="lf-chapters">{seasons}</div>
      </div>
    </section>

    <!-- ========== THE SHORT LIST ========== -->
    <section class="lf-sec lf-light" id="short-list" aria-labelledby="sl-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">Quick reference</p>
        <h2 class="lf-h2 lf-rise" id="sl-h">If you only have time for <em>one thing</em></h2>
        <dl class="lf-short lf-rise">{cheat}</dl>
      </div>
    </section>

    <!-- ========== FINAL CALL ========== -->
    <section class="lf-sec lf-dark lf-center" aria-labelledby="fc-h">
      <div class="lf-bg">{B.pic('eq3a2062', '', '100vw')}</div>
      <div class="lf-wrap lf-over">
        <div class="lf-rise" style="margin-bottom:44px">{B.ARROW}</div>
        <h2 class="lf-h2 lf-rise" id="fc-h">The mountains are waiting. <em>So is your treehouse.</em></h2>
        <p class="lf-lead lf-ans lf-rise">Coming up from Atlanta? Read about <a href="/romantic-getaways-near-atlanta">a romantic getaway near Atlanta</a>.</p>
        <div class="lf-actions lf-rise" style="justify-content:center"><a href="/book" class="lf-btn">{B.ACORN}Book your dates</a></div>
      </div>
    </section>
'''
    return 'local-guide.html', head, gtm, body, '/book', False


PAGES = [page_local_guide]

CSS = '''
.lf-guide__note { margin: 18px 0 0; font-family: 'Montserrat', sans-serif; font-size: 0.8125rem; letter-spacing: 0.04em; line-height: 1.6; color: var(--on-dark-muted); }
.lf-jump ul { list-style: none; margin: 26px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.lf-jump a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border: 1px solid rgba(247, 243, 237, 0.35); color: var(--on-dark); text-decoration: none; font-family: 'Montserrat', sans-serif; font-size: 0.6875rem; letter-spacing: 0.14em; text-transform: uppercase; }
.lf-jump a:hover { background: rgba(247, 243, 237, 0.08); }
.lf-jump a:focus-visible { outline: 2px solid var(--on-dark); outline-offset: 2px; }
.lf-guide.lf-split { align-items: start; }
.lf-guide__photo img { aspect-ratio: 4 / 3; object-fit: cover; }
@media (min-width: 900px) { .lf-guide__photo { position: sticky; top: calc(var(--hdr-h) + 32px); } .lf-guide__photo img { aspect-ratio: 4 / 5; } }
.lf-sec[id] { scroll-margin-top: var(--hdr-h); }

/* the places: name, drive time, what it is, Mick's pick */
.lf-places { list-style: none; margin: 34px 0 0; padding: 0; max-width: 36rem; }
.lf-place { padding: 22px 0; border-top: 1px solid rgba(26, 46, 26, 0.16); }
.lf-dark .lf-place { border-top-color: rgba(247, 243, 237, 0.16); }
.lf-place__name { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 1.7rem; line-height: 1.15; color: var(--forest-deep); }
.lf-dark .lf-place__name { color: var(--on-dark); }
.lf-place__time { margin: 6px 0 0; font-family: 'Montserrat', sans-serif; font-size: 0.6875rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--stone); }
.lf-dark .lf-place__time { color: var(--on-dark-muted); }
.lf-place__what { margin: 10px 0 0; font-size: 1.12rem; line-height: 1.65; color: var(--stone); }
.lf-dark .lf-place__what { color: var(--on-dark-muted); }
.lf-place__pick { position: relative; margin: 12px 0 0; padding-left: 24px; font-size: 1.12rem; line-height: 1.55; font-style: italic; color: var(--forest-deep); }
.lf-dark .lf-place__pick { color: var(--on-dark); }
.lf-place__pick::before { content: ''; position: absolute; left: 0; top: 0.3em; width: 11px; height: 14px; background: var(--acorn) center / contain no-repeat; }
.lf-place__pick span { font-style: normal; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.16em; text-transform: uppercase; margin-right: 6px; }

/* seasons on parchment: the chapter cards with dark ink */
.lf-seasons .lf-chapter .lf-h3 { color: var(--forest-deep); }
.lf-seasons .lf-chapter p { color: var(--stone); }
.lf-seasons .lf-chapter img { aspect-ratio: 4 / 3; }

/* the short list */
.lf-short { margin: 40px 0 0; display: grid; gap: 0 56px; }
@media (min-width: 900px) { .lf-short { grid-template-columns: 1fr 1fr; } }
.lf-short > div { display: grid; gap: 4px; padding: 18px 0; border-top: 1px solid rgba(26, 46, 26, 0.16); }
.lf-short dt { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.3rem; color: var(--stone); }
.lf-short dd { margin: 0; font-size: 1.12rem; line-height: 1.55; color: var(--stone); }
.lf-short dd b { font-weight: 600; color: var(--forest-deep); }
'''
