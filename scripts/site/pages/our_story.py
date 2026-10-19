"""Our Story: the family that built Loxley Forest and lives in it.

The story's facts are the old page's, kept exactly; the prose is tightened.
Built by scripts/site/build_v2.py (this module is loaded as a page module).
"""
import build_v2 as B

WIDE = '(min-width: 1200px) 1200px, 100vw'
HALF = '(min-width: 900px) 50vw, 100vw'
PAIR = '(min-width: 900px) 600px, 50vw'


def page_our_story():
    head, gtm = B.head_from('our-story.html',
                            '<link rel="preload" as="image" type="image/webp" href="images/v2/eq3a8862-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n'
                            '  <link rel="preload" as="image" type="image/webp" href="images/v2/eq3a8862-800.webp" media="(max-width: 767px)" fetchpriority="high">')
    body = f'''
    <!-- ========== HERO ========== -->
    <section class="lf-hero lf-hero--page" aria-label="Our story">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/eq3a8862-800.webp" type="image/webp"><img src="images/v2/eq3a8862-1600.webp" width="1600" height="1067" alt="The treehouse canvas in thick fog among bare trees" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Our story</p>
        <h1 class="lf-h1">We came here to heal. <em>We stayed to build.</em></h1>
        <p class="lf-lead">Mick, Livy, Aurora and Tilly Mac. The family that built Loxley Forest by hand, and lives in it.</p>
      </div>
    </section>

    <!-- ========== HOW WE FOUND IT ========== -->
    <section class="lf-sec lf-light" aria-labelledby="find-h">
      <div class="st-prose">
        <p class="lf-eyebrow lf-rise">How we found it</p>
        <h2 class="lf-h2 lf-rise" id="find-h">A tunnel of <em>mountain laurel</em></h2>
        <div class="lf-body st-body lf-rise">
          <p class="st-drop">There's a place in the North Georgia foothills, just over an hour from Atlanta, where the road drops through a tunnel of mountain laurel so thick the branches nearly meet overhead.</p>
          <p>Mick and Livy found it in the hardest season of their lives. They had been through a loss that nearly broke them, the kind that leaves you on the couch for a week, barely speaking, because there are no words for it yet. When words came back, they were small ones. A long weekend somewhere. A change of scenery. Just to breathe.</p>
          <p>It was Livy's idea. Some of her friends had been to a wedding in a small town with wineries and mountains, a place called Dahlonega. "What about there?" she said. Mick had never heard of it.</p>
        </div>
      </div>
      <figure class="st-bleed lf-rise">{B.pic('eq3a0107', 'Fog lifting through tall hardwoods, morning light coming through the trunks', WIDE)}</figure>
      <div class="st-prose">
        <div class="lf-body st-body lf-rise">
          <p>They had been looking for a place to start their family. Mick had just exited his construction business. Livy was moving on from running a gymnastics facility. They had scouted land in North Carolina, South Carolina and Tennessee, and nothing felt right. Dahlonega was supposed to be a weekend away, not a life change.</p>
          <p>Two weeks later they were there. They stayed in a treehouse across the street from where they live now. Not a real treehouse, just a house with a tree built into the deck. But the canopy, the creek, the elevation and the quiet planted a seed.</p>
          <p>They looked at five properties that weekend. All overpriced. All wrong. They were ready to drive the nine hours back to Ohio and keep looking. Then on Saturday night their realtor called: "One more just popped up. The photos are terrible. But go see it tomorrow."</p>
          <p>Mick wanted to skip it. He wanted cinnamon buns from Picnics and an early start on the drive home. Livy said, "Why don't we just take our coffee and walk around it?"</p>
          <p>So on a cold January morning, with fog still burning off the valley, they drove down a driveway lined with mountain laurel. Two hundred feet in, through the laurel tunnel, through the fog, Livy said it.</p>
        </div>
        <p class="st-quote lf-rise">&ldquo;This is it. Come on.&rdquo;</p>
        <div class="lf-body st-body lf-rise">
          <p>They hadn't even seen the house yet.</p>
          <p>They wrote an offer within a week. Before they had even closed, a treehouse designer was on the property picking sites. They found five.</p>
        </div>
      </div>
    </section>

    <!-- ========== THE LAND ========== -->
    <figure class="st-band" aria-label="The land from above">{B.pic('aerial-fall', 'From above in fall: the treehouse canvas showing through a canopy of orange, red and gold', '100vw')}</figure>

    <!-- ========== WHAT WE WANTED TO BUILD ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="want-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow lf-rise">What we wanted to build</p>
          <h2 class="lf-h2 lf-rise" id="want-h">Get lost. Stay lost. <em>Come back different.</em></h2>
          <div class="lf-body lf-rise" style="margin-top:26px">
            <p>Mick has always recharged by disappearing. Multi-day hikes into the backcountry. Canoe trips deep into places with no cell service. Hunting and fishing trips where the only sounds are water and wind. That was always his idea of a vacation.</p>
            <p>Most people don't have two or three weeks to paddle into the wilderness and set up camp. They have a weekend. Maybe two nights between the obligations that never stop pulling at them. They want the silence, the forest and the feeling of being truly away, without the time, the gear or the trail miles to earn it the hard way.</p>
            <p>That's what Loxley was designed to solve.</p>
          </div>
        </div>
        <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('eq3a2186', 'The treehouse platform seen from the forest floor, its wooden truss overhead', HALF)}</figure>
      </div>
      <div class="lf-wrap lf-split lf-split--flip" style="margin-top:72px">
        <div>
          <div class="lf-body lf-rise">
            <p>We loved this land so much we wanted to share it. Not as a business first, but as a place where people could come and do what the forest does for us. Unplug. Breathe. Sit with the person you love and hear nothing but the creek and the wind in the canopy. Watch your kids find out what it's like to be somewhere with no screens competing for their attention.</p>
            <p>We marked five treehouse sites before we had even closed on the land. The vision was always shared. Mick saw the engineering: the structure, the way a platform could float between five trees. Livy saw the experience: waking up in the canopy, the details that make someone feel cared for, the reason a couple would drive just over an hour from Atlanta and never want to leave.</p>
            <p>Every design decision passed through both. Is it structurally extraordinary? And does it feel like someone thought about every moment of your stay?</p>
          </div>
        </div>
        <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('eq3a2149', 'The steel and wood frame beneath the treehouse deck, hung among fall trees', HALF)}</figure>
      </div>
      <div class="lf-wrap lf-center" style="margin-top:88px">
        <p class="st-quote st-quote--wide lf-rise">How many people can say they've spent the night hanging from five oak trees, sixty feet in the air, with nothing between them and the stars but canvas and canopy?</p>
        <p class="lf-lead lf-rise">Not a hotel room with a view. A night in the forest that changes how you feel when you drive home on Sunday.</p>
      </div>
    </section>

    <!-- ========== WHAT WE ACTUALLY BUILT ========== -->
    <section class="lf-sec lf-light" aria-labelledby="built-h">
      <div class="st-prose">
        <p class="lf-eyebrow lf-rise">What we actually built</p>
        <h2 class="lf-h2 lf-rise" id="built-h">Engineered on paper. <em>Made to fit by hand.</em></h2>
        <div class="lf-body st-body lf-rise">
          <p>Mick and Livy designed the treehouses with a treehouse engineering firm: a tetrahedron frame that sandwiches steel between wood for the most strength at the least weight, hung from living trees by specialized hardware. The roof is canvas instead of timber, again to keep the load on the trees as light as possible. Every structural element was engineered. Every connection point was calculated.</p>
          <p>But engineering only gets you a platform in the sky. It was Livy who insisted on a full bathroom in the canopy, a waterfall shower sixty feet above the forest floor, because she wasn't climbing down a tree in the middle of the night, and neither should anyone else. The details you'll find during your stay are Livy's hand: the warmth of the light, every window placed to frame the canopy, a room that feels intimate instead of exposed.</p>
        </div>
        <p class="st-quote lf-rise">Then the real work began.</p>
      </div>
      <div class="st-pair">
        <figure class="lf-rise">{B.pic('eq3a0946', 'The rope bridge at night, its rails strung with warm lights', PAIR)}</figure>
        <figure class="lf-rise">{B.pic('eq3a2062', 'The treehouse among fall trees, sun breaking through the canopy', PAIR)}</figure>
      </div>
      <div class="st-prose">
        <div class="lf-body st-body lf-rise">
          <p>Nothing came in by machine. No ATVs. No excavators. Every beam, every bolt, every panel was carried four hundred feet down the mountainside by hand: by Mick, by a team of carpenters, and by a crew of arborists and riggers, some of whom had been featured on HGTV. They used wagons and carts when they could. They used their shoulders when they couldn't. They did it this way because Mick and Livy loved the forest too much to tear it up with equipment.</p>
          <p>Mick built much of the framing himself. The modular system was designed to bolt together like a giant set of building blocks, triangles locking into triangles. But off-site engineering and on-site reality don't always agree. Making it fit sixty feet in the air, in the canopy, over a creek, on the side of a ridge: that was the craft.</p>
          <p>Nine months from breaking ground to a finished treehouse. Triple what they had planned. The terrain, and the work of building something this ambitious in a living forest, humbled everyone involved.</p>
        </div>
        <p class="st-note lf-rise">Livy was pregnant with their first daughter, Aurora, through the entire build. Aurora arrived before it was finished. They paused for six months, because family comes first. Always.</p>
      </div>
      <figure class="st-bleed lf-rise">{B.pic('eq3a0907', 'The treehouse at dusk, its canvas glowing from inside, the rope bridge strung with lights', WIDE)}</figure>
      <div class="st-prose">
        <div class="lf-body st-body lf-rise">
          <p>The rope bridge came later. Mick could see the path, a clear line through the canopy that said this is where it goes. The arborists warned him: a hundred feet is a massive span, and trees could come down on it. They built it anyway.</p>
          <p>An elite crew of riggers from North Carolina strung the first cables between the trees, and in two weeks those cables became a hundred-foot rope bridge suspended over the valley. Mick was alongside them the entire build, doing carpentry and saw work. The deck planks are white oak, salvaged and milled from standing dead trees on the property. Wood that was already here, given a second life.</p>
        </div>
        <p class="st-note lf-rise">By then Livy was pregnant with their second daughter, Tilly Mac. The bridge was built while Tilly Mac was on the way.</p>
        <div class="lf-body st-body lf-rise">
          <p>That's the rhythm of Loxley Forest. Build. Pause for the family. Build again. No investor timelines. No grand opening deadlines. Just two people building something extraordinary at a pace that lets them be present for the life growing alongside it.</p>
        </div>
      </div>
    </section>

    <!-- ========== WHY LOXLEY ========== -->
    <section class="lf-sec lf-parch lf-center" aria-labelledby="why-h">
      <div class="lf-wrap">
        <div class="lf-rise" style="margin-bottom:40px">{B.ARROW}</div>
        <p class="lf-eyebrow lf-rise">Why Loxley</p>
        <h2 class="lf-h2 lf-rise" id="why-h">Their own forest. <em>Their own story.</em></h2>
        <div class="lf-body lf-rise" style="margin-top:26px">
          <p>The name comes from Robin Hood. Robin of Loxley made his stand in Sherwood Forest, and Mick and Livy always loved that story. Not the stealing from the rich. The living in the forest. The idea that a forest could be a home, a refuge and an adventure at the same time. Instead of Sherwood, they called it Loxley.</p>
        </div>
      </div>
    </section>

    <!-- ========== WHAT YOU'LL FIND HERE ========== -->
    <section class="lf-sec lf-dark" aria-labelledby="find-here-h">
      <div class="lf-wrap lf-split">
        <figure class="lf-photo lf-photo--tall lf-rise">{B.pic('img_2726', 'The rope bridge leading through the canopy to the treehouse at dusk', HALF)}</figure>
        <div>
          <p class="lf-eyebrow lf-rise">What you'll find here</p>
          <h2 class="lf-h2 lf-rise" id="find-here-h">A family that lives <em>in the forest they built</em></h2>
          <ul class="lf-acorns lf-rise">
            <li>A treehouse sixty feet up in the canopy, reached by a hundred-foot rope bridge, with a thirty-foot bridge before it as the warm-up</li>
            <li>A second treehouse, coming soon</li>
            <li>42 acres of hardwood cove forest, with trails down to the creek</li>
            <li>A family that lives on the property and greets every guest personally</li>
            <li>Two little girls who think rope bridges are a normal way to get home</li>
          </ul>
          <div class="lf-body lf-rise" style="margin-top:30px">
            <p>The man who engineered your treehouse is the same man who carried the beams down the mountain. The woman who designed every detail of your stay, the waterfall shower, the welcome note on the bed, the wildflowers, where the candles sit, the feeling that someone was here before you and thought of everything, is the same woman running the Instagram account you probably found us on.</p>
            <p>This isn't a hospitality brand. It's a family's home, opened to people who need what the forest gives: silence, elevation, and the feeling of being somewhere built with love by the people who live inside it.</p>
          </div>
          <p class="st-quote st-quote--left lf-rise">We're glad you found us. Come up. The forest is waiting.</p>
        </div>
      </div>
    </section>

    <!-- ========== THE VALUES ========== -->
    <section class="lf-sec lf-dark" style="padding-top:0" aria-labelledby="val-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow lf-rise">What we believe</p>
        <h2 class="lf-h2 lf-rise" id="val-h">The values</h2>
        <ol class="st-values">
          <li class="lf-rise"><h3 class="lf-h3">Built, not bought</h3><p>Every beam was carried down the mountain by hand, because we loved the forest too much to bring in machines. That's how we do everything here.</p></li>
          <li class="lf-rise"><h3 class="lf-h3">Family is the floor plan</h3><p>We paused the build twice for our daughters. Every decision starts with one question: does this serve the family who lives here and the families who visit?</p></li>
          <li class="lf-rise"><h3 class="lf-h3">Silence is the product</h3><p>We don't sell square footage or thread count. We sell the experience of being in a forest with nothing demanding your attention.</p></li>
        </ol>
      </div>
    </section>

    <!-- ========== THE CALL ========== -->
    <section class="lf-sec lf-dark lf-center" aria-labelledby="fc-h">
      <div class="lf-bg">{B.pic('aerial-sunset', '', '100vw')}</div>
      <div class="lf-wrap lf-over">
        <div class="lf-rise" style="margin-bottom:44px">{B.ARROW}</div>
        <h2 class="lf-h2 lf-rise" id="fc-h">Come see what one family <em>built in the sky</em></h2>
        <p class="lf-lead lf-rise">Book direct with the family who built it.</p>
        <div class="lf-actions lf-rise" style="justify-content:center"><a href="/book" class="lf-btn">{B.ACORN}Book your dates</a><a href="/treehouses" class="lf-link">See the treehouse</a></div>
      </div>
    </section>
'''
    return 'our-story.html', head, gtm, body, '/book', False


PAGES = [page_our_story]

CSS = '''
/* our story: an editorial column of prose, photographs that break out of it */
.st-prose { max-width: 38rem; margin: 0 auto; }
.st-body { max-width: none; margin-top: 26px; }
.st-drop::first-letter {
  float: left; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300;
  font-size: 4.6em; line-height: 0.8; padding: 0.06em 0.1em 0 0; color: var(--forest-deep);
}
.st-quote {
  font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 300;
  font-size: clamp(1.9rem, 6.4vw, 3rem); line-height: 1.18; color: var(--forest-deep);
  margin: 48px 0; text-align: center; text-wrap: balance;
}
.lf-dark .st-quote { color: var(--on-dark); }
.st-quote--wide { max-width: 26em; margin: 0 auto; font-size: clamp(1.6rem, 5.2vw, 2.6rem); }
.st-quote--left { text-align: left; margin: 36px 0 0; font-size: clamp(1.5rem, 4.6vw, 2rem); }
.st-note {
  margin: 44px 0; padding: 4px 0 4px 22px; border-left: 1px solid rgba(44, 34, 25, 0.28);
  font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: clamp(1.35rem, 4.2vw, 1.7rem); line-height: 1.4; color: var(--bark);
}
.st-bleed { margin: 64px calc(var(--pad-x) * -1); }
.st-bleed img { width: 100%; height: auto; display: block; }
@media (min-width: 1200px) { .st-bleed { max-width: 1200px; margin: 88px auto; } }
.st-band { margin: 0; background: var(--ink); }
.st-band img { width: 100%; height: clamp(320px, 62vw, 760px); object-fit: cover; display: block; }
.st-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 1200px; margin: 64px auto; }
.st-pair figure { margin: 0; }
.st-pair img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; display: block; }
@media (max-width: 767px) { .st-pair { margin-left: calc(var(--pad-x) * -1); margin-right: calc(var(--pad-x) * -1); gap: 6px; } }
@media (min-width: 900px) { .st-pair { gap: 24px; margin: 96px auto; } }
.st-values { list-style: none; margin: 44px 0 0; padding: 0; display: grid; gap: 40px; counter-reset: v; }
.st-values li { border-top: 1px solid rgba(247, 243, 237, 0.18); padding-top: 22px; counter-increment: v; }
.st-values li::before { content: counter(v, upper-roman); display: block; margin-bottom: 12px; font-family: 'Montserrat', sans-serif; font-size: 0.6875rem; letter-spacing: 0.28em; color: var(--on-dark-muted); }
.st-values p { margin: 12px 0 0; color: var(--on-dark-muted); font-size: 1.15rem; line-height: 1.65; }
@media (min-width: 900px) { .st-values { grid-template-columns: repeat(3, 1fr); gap: 48px; } }
'''
