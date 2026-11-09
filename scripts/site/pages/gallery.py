"""Gallery: the photographs already on the site, in six rooms, photograph first.

Every photograph is lazy-loaded except the hero. Tapping a photograph opens its largest
copy in the same tab: the old page's lightbox lived in the page's own script, and
js/global.js only decorates it, so there is no shared lightbox to reuse without editing js/.
Built by scripts/site/build_v2.py (this module is loaded as a page module).
"""
import os

import build_v2 as B

# Phones take the 800 copy of a lead photograph (about twice the screen's width in CSS pixels),
# not the 1600: the lazy-load margin pulls the first room in before any scroll, and the page
# must stay under 1 MB before scrolling (DIRECTION.md). Desktop gets the 1600.
LEAD = '(min-width: 1200px) 1200px, (min-width: 768px) 100vw, 266px'
TILE = '(min-width: 900px) 400px, 50vw'

# (name in images/v2, alt text: what is in the frame, caption: the old page's line, kept)
ROOMS = [
    ('treehouse', 'The treehouse', [
        ('eq3a8862', 'The treehouse canvas in thick fog among bare trees', 'The forest kept the secret.'),
        ('eq3a9079', 'The treehouse small on the far slope, sun low behind bare trees', 'Winter sun through bare branches.'),
        ('eq3a0242', 'The treehouse peak framed by dark summer branches', 'Summer branches frame the view.'),
        ('eq3a0907', 'The treehouse at dusk, its canvas glowing orange, the rope bridge lit beside it', 'Dusk. The treehouse breathes.'),
        ('eq3a0161', 'The white canvas peaks of the treehouse among yellow fall leaves, the rope bridge at its door', 'Through the fall canopy.'),
        ('eq3a2110', 'The treehouse canvas seen from the hillside below, in orange and red fall colour', 'From the ground, looking up.'),
    ]),
    ('bridges', 'The bridges', [
        ('eq3a0160', 'The rope bridge running through fall leaves to the treehouse canvas', 'The most dramatic aisle in the Southeast.'),
        ('aerial-bridge', 'From above: the rope bridge reaching the treehouse through the fall canopy', 'One hundred feet. Two ancient oaks. One bridge between them.'),
        ('eq3a0337', 'Looking along the rope bridge to a landing built around a tree trunk, in fall gold', 'The threshold. Everything changes after this.'),
        ('eq3a2008', 'The rope bridge stretching through the trees toward the treehouse in fall', 'Fall light on the crossing.'),
        ('eq3a0154', 'The rope bridge and the treehouse canvas behind a close tree trunk', 'An intimate perspective.'),
        ('eq3a0943', 'The rope bridge at night, its rails lit, the glowing treehouse at the far end', 'Through the leaves.'),
        ('eq3a0946', 'The rope bridge at night, its rails strung with warm lights', 'Steel and wood, sixty feet up.'),
        ('img_2726', 'The rope bridge deck leading through the canopy to the treehouse at dusk', 'Dusk on the crossing.'),
        ('eq3a2062', 'The treehouse and the bridge landing among fall trees, sun breaking through', 'Sun flare through the canopy.'),
    ]),
    ('inside', 'Inside', [
        ('img_0823', 'Inside the treehouse: a bed, a long wooden bench and tall windows onto the forest', 'Home in the sky.'),
        ('img_0828', 'The bed beneath the treehouse windows, a ring of lights overhead', 'A ring of light, a wall of forest.'),
        ('img_0831', 'The bed beside the panoramic windows, the canopy outside', 'Every detail was chosen. Nothing was default.'),
        ('img_0838_3', 'Looking through the canvas doorway to the bed, lit warm inside', 'Steel meets wood meets candlelight.'),
    ]),
    ('built', 'Built by hand', [
        ('eq3a2149', 'The steel and wood frame beneath the treehouse deck, hung among fall trees', 'The engineering underneath the magic.'),
        ('eq3a2186', 'The treehouse platform seen from the forest floor, its wooden truss overhead', 'Platform. Precision. Purpose.'),
        ('eq3a1541', 'The treehouse deck seen through falling leaves and fall colour', 'Platform through the fall canopy.'),
    ]),
    ('fire', 'Fire and food', [
        ('eq3a0222', 'The pizza oven on the sky deck rail, green forest behind', 'Pizza tastes different in the canopy.'),
        ('img_1717', 'The boulder fire pit on the forest floor, ringed with flat stones', 'Fire as witness.'),
        ('img_2546', 'The sky deck with the pizza oven, a low table and two wooden chairs above the forest', 'The sky deck.'),
        ('img_2752', 'The sky deck set for cinema night, a screen up against the trees', 'Cinema night in the canopy.'),
    ]),
    ('forest', 'The forest', [
        ('eq3a0107', 'Fog lifting through tall hardwoods, morning light coming through the trunks', 'Morning mist. The forest waking up.'),
        ('eq3a1665', 'A hollow of tall trees in yellow and orange fall colour', 'The forest floor in October.'),
        ('eq3a0272', 'A leaf-covered trail through green and fall trees', 'The trail has no destination. That\'s the point.'),
        ('eq3a1890', 'The creek running over rock through fall leaves and rhododendron', 'Creek and canopy.'),
        ('aerial-creek', 'A waterfall spilling over mossy rock in a green summer forest', 'Water has been carving this valley for centuries.'),
        ('img_0650', 'Mountain laurel in pink bloom beside the rope bridge', 'Spring. Mountain laurel in bloom.'),
    ]),
    ('above', 'From above', [
        ('aerial-canopy', 'From above in summer: the treehouse deck and canvas among green treetops', 'From above, it disappears into the forest. By design.'),
        ('aerial-fall', 'From above in fall: the treehouse canvas showing through a canopy of orange, red and gold', 'Forty-two acres of cove forest.'),
        ('aerial-sunset', 'The sun low over a ridge of fall trees under a clear sky', 'Sunset over the mountains.'),
    ]),
]


def full(name):
    """The largest copy of a photograph, for the tap."""
    big = f'images/v2/{name}-1600.webp'
    return big if os.path.exists(os.path.join(B.ROOT, big)) else f'images/v2/{name}-800.webp'


def shot(name, alt, caption, sizes, cls):
    return (f'<figure class="{cls}"><a href="{full(name)}" class="gl-tap">{B.pic(name, alt, sizes)}</a>'
            f'<figcaption>{caption}</figcaption></figure>')


def room(key, title, shots):
    lead, rest = shots[0], shots[1:]
    tiles = '\n          '.join(shot(n, a, c, TILE, 'gl-tile') for n, a, c in rest)
    return f'''    <section class="gl-room" id="{key}" aria-labelledby="{key}-h">
      <div class="gl-room__head lf-rise"><p class="lf-eyebrow">{len(shots)} photographs</p><h2 class="lf-h2" id="{key}-h">{title}</h2></div>
      {shot(*lead, LEAD, 'gl-lead lf-rise')}
      <div class="gl-grid">
          {tiles}
      </div>
    </section>
'''


def page_gallery():
    head, gtm = B.head_from('gallery.html',
                            '<link rel="preload" as="image" type="image/webp" href="images/v2/eq3a0906-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n'
                            '  <link rel="preload" as="image" type="image/webp" href="images/v2/eq3a0906-800.webp" media="(max-width: 767px)" fetchpriority="high">')
    nav = ''.join(f'<a href="#{k}">{t}</a>' for k, t, _ in ROOMS)
    rooms = '\n'.join(room(*r) for r in ROOMS)
    body = f'''
    <!-- ========== HERO ========== -->
    <section class="lf-hero lf-hero--page" aria-label="Gallery">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/eq3a0906-800.webp" type="image/webp"><img src="images/v2/eq3a0906-1600.webp" width="1600" height="1067" alt="The treehouse canvas glowing gold at night, the lit rope bridge running off into the dark" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Gallery</p>
        <h1 class="lf-h1">See it. <em>Then come feel it.</em></h1>
        <p class="lf-lead">The glow that stops every guest mid-step. Sixty feet up, a hundred-foot rope bridge, 42 acres of cove forest. Tap any photograph to see it full size.</p>
        <nav class="gl-nav" aria-label="Gallery rooms">{nav}</nav>
      </div>
    </section>

    <!-- ========== THE ROOMS ========== -->
    <div class="lf-dark gl-rooms">
{rooms}    </div>

    <!-- ========== THE CALL ========== -->
    <section class="lf-sec lf-dark lf-center" aria-labelledby="fc-h">
      <div class="lf-bg">{B.pic('eq3a0160', '', '100vw')}</div>
      <div class="lf-wrap lf-over">
        <div class="lf-rise" style="margin-bottom:44px">{B.ARROW}</div>
        <h2 class="lf-h2 lf-rise" id="fc-h">Photos can only do so much. <em>Come feel it.</em></h2>
        <p class="lf-lead lf-rise">Book direct with the family who built it.</p>
        <div class="lf-actions lf-rise" style="justify-content:center"><a href="/book" class="lf-btn">{B.ACORN}Book your dates</a></div>
      </div>
    </section>
'''
    return 'gallery.html', head, gtm, body, '/book', False


PAGES = [page_gallery]

CSS = '''
/* gallery: six rooms on the dark, a lead photograph each, then a two-up (phones) or three-up masonry */
.gl-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
.gl-nav a {
  display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px;
  border: 1px solid rgba(247, 243, 237, 0.4); color: var(--on-dark); text-decoration: none;
  font-family: 'Montserrat', sans-serif; font-size: 0.6875rem; letter-spacing: 0.14em; text-transform: uppercase;
}
.gl-nav a:hover, .gl-nav a:focus-visible { background: rgba(247, 243, 237, 0.1); }
.gl-rooms { padding: 24px var(--pad-x) 40px; }
.gl-room { max-width: 1200px; margin: 0 auto; padding: 56px 0 24px; scroll-margin-top: var(--hdr-h); }
.gl-room__head { display: flex; flex-direction: column-reverse; margin-bottom: 24px; }
.gl-room__head .lf-eyebrow { margin: 10px 0 0; }
.gl-tap { display: block; color: inherit; }
.gl-tap img { display: block; width: 100%; height: auto; background: #1d3221; transition: opacity 0.3s var(--ease-natural); }
.gl-tap:hover img { opacity: 0.88; }
.gl-tap:focus-visible { outline: 2px solid var(--on-dark); outline-offset: 3px; }
.gl-lead, .gl-tile { margin: 0; }
.gl-lead { margin: 0 calc(var(--pad-x) * -1) 10px; }
.gl-lead figcaption, .gl-tile figcaption {
  padding: 10px 0 0; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic;
  font-size: 1.05rem; line-height: 1.35; color: var(--on-dark-muted);
}
.gl-lead figcaption { padding: 12px var(--pad-x) 0; font-size: 1.25rem; }
.gl-grid { columns: 2; column-gap: 10px; margin-top: 18px; }
.gl-tile { break-inside: avoid; margin-bottom: 18px; }
@media (min-width: 900px) {
  .gl-room { padding-top: 96px; }
  .gl-lead { margin: 0 0 14px; }
  .gl-lead figcaption { padding: 14px 0 0; }
  .gl-grid { columns: 3; column-gap: 20px; margin-top: 24px; }
  .gl-tile { margin-bottom: 26px; }
  .gl-tile figcaption { font-size: 1.15rem; }
}
'''
