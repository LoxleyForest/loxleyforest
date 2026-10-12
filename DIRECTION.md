# Direction · the next-level site

Written 2026-10-12 on the `next-level` branch, before any code. This page names
the look so every later decision can be checked against it. Facts about other
sites come from the Scout's read of their own HTML and CSS on 2026-10-12.

## The one sentence

A dark forest at dusk, one gold, one serif, one button. Everything that is not
the forest or the button gets quieter.

## Why restraint, not more

Mick's brief: a site a designer looks at and says "who made that", and a guest
looks at and says "I want to stay there", in the same glance. The five
reference sites below do that with almost nothing on screen. The expensive look
is what is left out. The site already owns a good palette and a good serif; the
work is to use less of each per screen and to let video carry the room.

## The five references (checked 2026-10-12)

| Site | What we take from it | What we leave |
|---|---|---|
| Tengile MalaMala Collection, tengilemalamala.com (Awwwards Site of the Day, 2026-10-03) | A 1080p hero loop at 4.97 MB with a 540p copy for phones. Cream, olive, near-black: three colours. Smooth scroll. | A preloader. Nobody waits for a preloader on a phone from a Google ad. |
| White Desert, white-desert.com (Awwwards Site of the Day, 2026-09-11) | Hero loop at 4.42 MB, `preload="metadata"`. Navy, cream, one accent on hover only. The "Enquire now" button in the header and again in the menu. | Twelve sticky elements. One is enough. |
| Domek w brzozach, domekwbrzozach.pl (Awwwards Honorable Mention, 2025-07-30) | One cabin, one page, the booking button repeated four times down the page. A `.webm` beside the `.mp4`. | The day-and-night toggle. A trick, not a reason to book. |
| Tandjung Sari, tandjungsarihotel.com (Awwwards Honorable Mention, 2026-08-05) | Classic serif display (Adobe Caslon), horizontal storytelling, a fixed "Book room" button. | A 24.8 MB hero and a 1.38 MB page. This is the anti-pattern for weight. |
| Fogo Island Inn, fogoislandinn.ca | A `poster` still on the hero video, a sticky header with a "Reserve" button, four words of tagline. No animation library at all. | A 22.8 MB hero. |

Also read and set aside: Bolt Farm Treehouse (boltfarmtreehouse.com) is the
closest competitor, gold on green like us, with a fixed nav and a sticky
"check dates" element, but a still hero and no video. We should beat it on
exactly that. Treehotel (treehotel.se) is a type reference only: still hero,
booking sent off-domain, which is the thing we are leaving.

## Type

- **Display: Cormorant Garamond**, already loaded, already the headline face.
  Light weights, large sizes, tight leading.
- **Body and interface: Montserrat**, already loaded. Weights 400 and 500 only.
- **Playfair Display goes.** Two display serifs is one too many; four of the
  five references pair one serif with one sans. Dropping it also removes one
  font request from every page.
- Font requests move from `@import` in the stylesheet to `<link>` tags in the
  head with `preconnect`, so the text does not wait for the stylesheet to
  finish before the fonts start.

## Palette

The tokens in `css/global.css` stay. The rule changes: **three per screen.**

- Dark screens (hero, the treehouse heroes, the final call to book):
  `--forest-deep`, `--linen`, `--gold`.
- Light screens (story, details, reviews): `--cream`, `--bark`, `--gold`.
- Gold is for the one button and for stars. Never for body text, never for
  rules or borders. If gold appears three times on a screen, one is wrong.
- Overlays on video: `--overlay-dark` at the bottom third only, so the forest
  shows through at the top.

## Video

- **Hero loop**: 8 to 12 seconds, silent, H.264 MP4 under 4 MB at 1080p, plus
  a WebM, plus a 540p MP4 for phones. `autoplay muted loop playsinline
  preload="metadata"` with a `poster`. The poster is a `.webp` under 120 KB,
  preloaded in the head, and stays the largest-contentful-paint element so
  the ad landing page score does not pay for the video.
- On phones under 600 px wide, the poster alone until the connection is
  known to be fast. iOS Low Power Mode refuses autoplay anyway.
- **Treehouse pages**: short still-to-motion clips, 4 to 6 seconds, same
  rules, under 1.5 MB each, one per unit above the price.
- Nothing longer lives in the repo. A brand film, if one is cut, sits on a
  video host behind a click `[MICK RATIFIES the host]`.
- Grade: Runway for colour, light, stabilising and slow motion. **Ruled by
  Mick 2026-10-12:** enhancing the light is allowed (the pinnacle dusk, the
  fog), because the camera never catches it as it is. Nothing is added that
  is not there: no animals, no scenery, no fantasy. Enhance, never invent.
- **Every clip from the July 2026 shoot is vertical (9:16).** Romantic Atlanta
  shot for reels. Phones get the vertical clip as shot. Desktop gets a 16:9
  window cut from the 4K vertical frame with a slow drift, which loses nothing
  real. Runway's video expand can paint in sides, but that is generated
  forest, so it is used only if Mick approves a specific clip after seeing
  it. The November shoot is asked to cover every setup horizontal as well.

## Motion

- **Smooth scroll with Lenis**, vendored into `js/` (about 10 KB, no build
  step). Four of the five references use it; it is the single biggest
  difference between a site that feels like a brochure and one that feels
  expensive.
- **Scroll reveal** stays on the `IntersectionObserver` already in
  `js/global.js`. Fade and a 24 px rise, 700 ms, the existing
  `--ease-natural`. Once per element, never replayed.
- **Parallax** on the hero media only: the video drifts at 0.3 of scroll
  speed. Nowhere else.
- **No GSAP, no preloader, no page-transition curtain.** Page transitions in
  `global.js` are reviewed and kept only if they finish under 300 ms.
- `prefers-reduced-motion` turns all of it off, and the video shows its
  poster.

## The button

One "Book your dates" button, `--gold` on `--forest-deep`, fixed to the bottom
right on phones and in the header on desktop, visible on every page from the
first pixel. It goes to `/book`. Until the Gatehouse cuts over, `/book` is
Hostfully's widget; after cutover it is ours, and this page does not change.
The button is the only fixed element on the page.

## Persuasion, honest only

- The rating badge shows the real figure, linked to the real listing.
- The treehouse page shows the real rate for the real next open dates, read
  from the Gatehouse once `book.loxleyforest.com` answers. Until then, no
  dates are shown rather than a guess.
- No countdowns, no "3 people are looking", no invented scarcity. The forest
  is the argument.

## Weight budget

| Page | Budget |
|---|---|
| Home, first view, phone | under 1.5 MB including the poster, before the video streams |
| Home, desktop, with hero video | under 6 MB |
| Any other page | under 1 MB |
| Largest contentful paint on a mid phone, 4G | under 2.5 s |

The 9 unreferenced HEIC files (26 MB) are deleted on this branch, and the 30
images over 500 KB are recompressed before any video is added, in that order,
because the ads pay for a slow page before the guest does.

## What this page does not decide

- The logo: none exists in the repo or in Drive `[MICK RATIFIES]`.
- Which clips: Mick picks from a contact sheet of all 50.
- Permission for the July 2026 footage: Romantic Atlanta's, on record
  `[MICK RATIFIES]`.
