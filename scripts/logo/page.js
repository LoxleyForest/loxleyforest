// The review page: the live animated lockup, then the proof plates.
const fs = require('fs');
const LK = require('./lockups.js');
const X = require('./engrave.js');

const st = LK.stacked('dark', { ew: 270, split: true, id: 'pg' });
const cfg = { E: { W: X.W, H: X.H, big: X.S.big, small: X.S.small, deckY: X.S.deckY, deckX0: X.S.deckX0, deckX1: X.S.deckX1 }, wm: st.parts.wm };
const icon = LK.icon({ id: 'pi' });
const iconSvg = (z, id) => `<svg viewBox="0 0 512 512" width="${z}" height="${z}" role="img" aria-label="Icon at ${z} pixels">${icon.inner.replace(/pi-in/g, 'pi' + id + '-in')}</svg>`;

const html = `<title>Loxley Forest Mark</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500&display=swap">
<style>
/* Layout: one dark room at dusk. The mark on a stage, then proof plates like an engraver's sheet. */
:root {
  color-scheme: dark;
  --room: #142418; --forest: #1a2e1a; --linen: #f7f3ed; --cream: #efe6d6; --muted: #bdb5a4; --gold: #c4a265; --rule: rgba(196, 162, 101, 0.28);
  --display: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --body: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
}
* { box-sizing: border-box }
html { background: var(--room) }
body { background: var(--room); color: var(--linen); font: 400 15px/1.65 var(--body); margin: 0; padding-inline: 16px; overflow-x: hidden }
.wrap { max-width: 1120px; margin: 0 auto }
.top { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; padding-block: 22px 0; font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: var(--muted) }
.top b { color: var(--gold); font-weight: 500 }
.stage { display: flex; flex-direction: column; align-items: center; gap: 18px; padding-block: 28px 40px }
.stage svg { width: 100%; max-width: 760px; height: auto; overflow: visible; display: block }
.replay { font: 500 11px var(--body); letter-spacing: .26em; text-transform: uppercase; color: var(--gold); background: none; border: 1px solid var(--rule); padding: 0 22px; min-height: 44px; cursor: pointer }
.replay:hover, .replay:focus-visible { border-color: var(--gold); outline: none }
h2 { font: 400 clamp(30px, 4.4vw, 46px)/1.05 var(--display); margin: 0; text-wrap: balance; letter-spacing: .01em }
h2 em { color: var(--gold) }
.lede { color: var(--muted); max-width: 62ch; margin: 0 }
section { padding-block: 56px; border-top: 1px solid var(--rule); display: grid; gap: 26px }
.label { font-size: 11px; letter-spacing: .3em; text-transform: uppercase; color: var(--gold) }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; align-items: stretch }
figure { margin: 0; display: grid; gap: 10px; min-width: 0 }
figure img, figure video { width: 100%; height: auto; display: block; max-width: 100% }
figcaption { font-size: 12.5px; color: var(--muted); line-height: 1.55 }
.photo img { aspect-ratio: 900 / 1200; object-fit: cover; object-position: 50% 45% }
.notes { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; max-width: 62ch }
.notes li { padding-left: 22px; position: relative }
.notes li::before { content: ''; position: absolute; left: 0; top: .72em; width: 10px; height: 1px; background: var(--gold) }
.notes b { font-weight: 500; color: var(--cream) }
.plates { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 16px }
.wide { grid-column: 1 / -1 }
.sizes { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 22px; padding: 28px; background: var(--linen); color: var(--forest) }
.sizes span { display: block; text-align: center; font-size: 11px; margin-top: 8px; color: #4b5a49; font-variant-numeric: tabular-nums }
.phone { width: min(100%, 300px); margin: 0 auto; padding: 12px; border-radius: 42px; background: #0b130c; box-shadow: 0 0 0 1px var(--rule), 0 30px 60px rgba(0,0,0,.45) }
.phone video { border-radius: 30px; aspect-ratio: 9 / 16; object-fit: cover; background: var(--forest) }
.files { width: 100%; border-collapse: collapse; font-size: 13.5px }
.files th { text-align: left; font-weight: 500; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: var(--gold); padding: 8px 12px 8px 0; border-bottom: 1px solid var(--rule) }
.files td { padding: 10px 12px 10px 0; border-bottom: 1px solid rgba(196,162,101,.12); vertical-align: top }
.files td:first-child { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 12.5px; color: var(--cream); white-space: nowrap }
.scroll { overflow-x: auto }
@media (max-width: 560px) {
  .files thead { display: none }
  .files tr { display: grid; gap: 2px; padding-block: 10px; border-bottom: 1px solid rgba(196,162,101,.12) }
  .files td { border: 0; padding: 0 }
  .files td:first-child { white-space: normal; overflow-wrap: anywhere }
}
.ask { margin: 0; padding-left: 1.2em; display: grid; gap: 10px; max-width: 64ch }
.foot { padding-block: 40px 60px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 12px }
@media (prefers-reduced-motion: reduce) { .replay { display: none } }
</style>

<div class="wrap">
  <div class="top"><span><b>Loxley Forest</b> · the mark, engraved</span><span>Draft for Mick · 12 October 2026</span></div>

  <div class="stage">
    <svg id="stage" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${st.w} ${st.h}" role="img" aria-label="Loxley Forest: an engraved arch showing the twin-spire treehouse hung by cables between five oaks, with the name and an arrow beneath">${st.inner}</svg>
    <button class="replay" id="replay" type="button">Play again</button>
  </div>

  <section>
    <div class="label">Drawn from the house</div>
    <h2>Hung in five oaks, <em>lit from inside</em></h2>
    <div class="pair">
      <figure class="photo"><img src="photo.webp" alt="The twin-spire treehouse at dusk, lit from inside, with the rope bridge and string lights"><figcaption>Your photograph, the reference.</figcaption></figure>
      <figure><img src="emblem-large.webp" alt="The engraved emblem: twin spires on a deck between five oaks, cables from the truss below"><figcaption>The emblem, drawn as an engraving. Every tone is a line.</figcaption></figure>
    </div>
    <ul class="notes">
      <li><b>Five oaks hold the house.</b> Two on each side and one behind it. The front right oak runs up through the deck, as it does in the photograph.</li>
      <li><b>Every cable starts at the truss.</b> The frame under the deck ends in two bottom hubs, and each cable runs from a hub up to a collar on an oak. Nothing ties to the spire tops.</li>
      <li><b>The canvas glows.</b> The spires are the brightest lines in the drawing, the window is lit, and the bridge and rail carry their string lights.</li>
      <li><b>Open air below.</b> The deck sits high, with ferns on the forest floor far beneath.</li>
      <li><b>The arrow stays.</b> It runs through the name as it does in the current logo, now with drawn feathers.</li>
    </ul>
  </section>

  <section>
    <div class="label">The set</div>
    <h2>Stacked, side by side, and the name alone</h2>
    <div class="plates">
      <figure class="wide"><img src="stacked-light.webp" alt="Stacked lockup on cream"><figcaption>Stacked, on cream. On light grounds the emblem keeps its dusk. The stacked lockup on forest is the one playing at the top of this page.</figcaption></figure>
      <figure class="wide"><img src="horizontal-dark.webp" alt="Horizontal lockup on forest green"><figcaption>Side by side, for the site header and email.</figcaption></figure>
      <figure class="wide"><img src="horizontal-light.webp" alt="Horizontal lockup on cream"></figure>
      <figure class="wide"><img src="wordmark-dark.webp" alt="The name with the arrow through it"><figcaption>The name alone, for small headers and the footer.</figcaption></figure>
    </div>
  </section>

  <section>
    <div class="label">One colour</div>
    <h2>One ink, for stamps, foil and thread</h2>
    <div class="plates">
      <figure><img src="knock-cream.webp" alt="One-colour emblem in forest green on cream"><figcaption>Forest on cream. Rubber stamps, letterpress, a branding iron on wood.</figcaption></figure>
      <figure><img src="gold-lines.webp" alt="Gold lines only on forest green"><figcaption>Gold lines only. Foil on dark card, embroidery on a cap or a tee.</figcaption></figure>
    </div>
  </section>

  <section>
    <div class="label">Small sizes</div>
    <h2>Below 64 pixels, a bolder drawing of the same house</h2>
    <p class="lede">The engraving needs room. For the browser tab and a phone's home screen the icon keeps the arch, the two spires, the deck, two oaks and the cables from the hub.</p>
    <div class="sizes">
      ${[16, 32, 48, 96, 180].map((z, i) => `<div>${iconSvg(z, i)}<span>${z}</span></div>`).join('')}
    </div>
  </section>

  <section>
    <div class="label">In use</div>
    <h2>The header, the welcome card, the reel</h2>
    <div class="plates">
      <figure class="wide"><img src="header-mock.webp" alt="Website header over the treehouse photo with the horizontal lockup and a Book your dates button"><figcaption>The site header over your photograph.</figcaption></figure>
      <figure><img src="card-mock.webp" alt="A cream welcome card with the one-colour emblem and the name"><figcaption>A welcome card in one ink.</figcaption></figure>
      <figure><div class="phone"><video src="loxley-logo-reel-1080x1920.mp4" poster="reel-poster.webp" autoplay muted loop playsinline aria-label="The logo animation as a vertical reel"></video></div><figcaption style="text-align:center">The animation as a ten-second reel, 1080 by 1920.</figcaption></figure>
    </div>
  </section>

  <section>
    <div class="label">Files</div>
    <h2>Where everything lives</h2>
    <p class="lede">In the website repository, on the next-level branch, in the brand folder. The live site is untouched.</p>
    <div class="scroll"><table class="files">
      <thead><tr><th>File</th><th>Use</th></tr></thead>
      <tbody>
        <tr><td>loxley-emblem-colour.svg</td><td>The master. Gold and cream lines on forest.</td></tr>
        <tr><td>loxley-emblem-one-colour-forest.svg</td><td>One ink on light grounds.</td></tr>
        <tr><td>loxley-emblem-gold-lines.svg</td><td>One ink on dark grounds, foil and thread.</td></tr>
        <tr><td>loxley-stacked-on-dark.svg</td><td>Emblem over the name, for dark grounds.</td></tr>
        <tr><td>loxley-stacked-on-light.svg</td><td>The same, for cream and white.</td></tr>
        <tr><td>loxley-horizontal-on-dark.svg</td><td>Side by side, for the site header.</td></tr>
        <tr><td>loxley-horizontal-on-light.svg</td><td>Side by side, for letters and invoices.</td></tr>
        <tr><td>loxley-wordmark-on-dark.svg</td><td>The name and the arrow alone.</td></tr>
        <tr><td>loxley-wordmark-on-light.svg</td><td>The same, on light grounds.</td></tr>
        <tr><td>loxley-icon.svg</td><td>App and home-screen icon.</td></tr>
        <tr><td>loxley-favicon.svg</td><td>Browser tab.</td></tr>
        <tr><td>motion/ three MP4s</td><td>The animation: reel 1080 by 1920, square 1080, wide 1920 by 1080.</td></tr>
      </tbody>
    </table></div>
  </section>

  <section>
    <div class="label">Your call</div>
    <h2>Three things only you can answer</h2>
    <ol class="ask">
      <li>Is this the mark? If something is off, name it and it changes.</li>
      <li>Where the five oaks stand. I drew two left, two right and one behind. If the real ones stand differently, say how.</li>
      <li>The line under the name reads Dahlonega · Georgia. Keep it, change it, or drop it.</li>
    </ol>
  </section>

  <div class="foot">Drawn in code from the July 2026 photograph and Mick's notes of 12 October 2026. Cormorant Garamond and Montserrat, the site's own faces.</div>
</div>
<script>window.LF_CFG=${JSON.stringify(cfg)};</script>
<script>${fs.readFileSync(__dirname + '/anim.js', 'utf8')}</script>
<script>document.getElementById('replay').addEventListener('click', function () { window.lfPlay && window.lfPlay(); });</script>
`;
fs.writeFileSync(__dirname + '/out/page/index.html', html);
console.log('page', (html.length / 1024).toFixed(0), 'KB');
