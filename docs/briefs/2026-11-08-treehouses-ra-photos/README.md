# /treehouses on Romantic Atlanta's stills, in shadow (2026-11-08)

The one number: 2 bookings from 1,631 Google Ads visits since October 22 (the Chief's overnight sheet, 2026-11-08).

The route: the Chief, Mick's word at about 19:20 ET: "we own the rights. Use anything in romantic Atlanta file ... they did a bang up job so use it. Make it legendary. Even the photos for the treehouse page pull from theirs."

## What the page shows today (the audit)

Every photograph on /treehouses is the house's own, from the fall and the first season:

| Slot | File | What it shows |
|---|---|---|
| Hero, desk | eq3a0907-1600 | The treehouse at dusk, its canvas glowing, the bridge lights |
| Hero, phone | treehouse-dusk-phone-900 | The same at dusk, upright |
| The original, gallery | img_0823, img_0831, aerial-bridge, eq3a0160 | The treehouse from its deck; the bed; the bridge from above at golden hour; the bridge in fall colour |
| The original, the loop | images/interior/ (video) | Inside by day, Mick's own clip. Untouched. |
| Built by the family | eq3a2149 | The steel and wood frame beneath, fall |
| Sixty feet | eq3a2062 | Sun flaring through the canopy |
| The crossing | eq3a0337 | The start of the bridge in fall |
| Your stay | img_0828 | The bed in warm light (4:5) |
| Treehouse two | img_2546 | A deck with chairs above the forest (4:5) |
| Share card | images/EQ3A0906.webp | The head's og:image |

## What the switch puts there (`RA_PHOTOS = True` in scripts/site/build_v2.py)

Romantic Atlanta's July 8, 2026 shoot: 47 stills on the workshop at `/home/mick/footage-in/drive/Pictures /` (24 Canon 4W6A, 11 Canon 5P3A, 12 drone). No face in any of them; three pizza frames show hands and are not used. Each file below was made by scripts/site/v2img.py (WebP, quality 74, 800 and 1600 wide), the same pipeline as every other photograph on the site; the builder makes the 684x855 phone crops for the two 4:5 frames.

| Slot | Frame | File | Alt text |
|---|---|---|---|
| Hero, desk | 4W6A8086 | ra-bridge-dusk-1600 (214 KB) | The rope bridge at dusk, strung with lights, the treehouse canvas glowing at its end |
| Hero, phone | 4W6A8086, an upright 2:3 crop about the glow | ra-bridge-dusk-phone-900 (158 KB, quality 68) | (the same alt; the same frame, so it is true on both) |
| Gallery 1, the room | 4W6A7946-HDR | ra-room-wide | The queen bed under the ring chandelier, triangle windows onto the forest |
| Gallery 2, the deck | 4W6A7888 | ra-deck | Two chairs on the sky deck, the canvas sweeping up beside them |
| Gallery 3, the canopy | 5P3A1483 | ra-canopy-sun | Sun through the summer canopy, the deck below |
| Gallery 4, the bridge by day | 4W6A8022-HDR, cut 3:4 | ra-bridge-green (800 only, quality 64) | The rope bridge by day, straight on through the green |
| Built by the family | 4W6A8004-HDR | ra-bridge-end | Where the rope bridge meets the deck: the oak through the floor, the beam, the canvas peak |
| Sixty feet | drone 205816_0029 | ra-aerial-dusk | The canvas glowing at dusk, level with the treetops |
| The crossing | 4W6A8101 | ra-bridge-dusk-side | The rope bridge at dusk from the deck, its lights running out to the treehouse |
| Your stay (4:5) | 4W6A7968-HDR | ra-room | The queen bed under the canvas peak, the ring chandelier above |
| Treehouse two (4:5) | 4W6A8084 | ra-deck-dusk | The canvas glowing at dusk, a chair on the sky deck |
| Share card | the hero | images/v2/ra-bridge-dusk-1600.webp, 1600 x 1067 | (og:image follows the hero; off, the page's own EQ3A0906 is written back) |

The home page does not change: the second-treehouse block keeps its own photograph there. The schema.org image list for the page follows the switch (the hero, the room, the drone frame at dusk).

The Critic's read before this was written (its memo is in the seat's session; the fixes are in): the first cut's phone hero was the upright sibling frame 4W6A8074, which has no treehouse in it, so "A home in the sky" sat over a picture with no home and the shared alt was false on phones; the three "Built, not bought" splits were one drone composition three times; the weight line counted only images/v2; the share card did not follow the hero. Each is changed above.

Not used, worth knowing: the upright bridge curving away (4W6A8028-HDR) and the upright deck (4W6A7890) came out at 250 to 300 KB per 800-wide file because the gallery crops phones to 4:3; the pizza and coffee frames (5P3A15xx, 4W6A8047, 4W6A8052) belong to /experiences, not this page; the day drone frames (0014 to 0021) and the dusk span from the air (0045, 0048, 0050) are strong and unused here.

## Weight

Measured in a real browser on the local build, images only, a full scroll:

| | Phone, 390 px | Desk, 1440 px |
|---|---|---|
| Before | 981 KB | 1,429 KB |
| After | 764 KB | 1,245 KB |

By file size the after page's photographs (images/v2) on a phone are 988 KB in 10 files; the line in the check is 1,024 KB. In both states the page also carries the interior loop's poster (115 KB) and, on a phone that scrolls to it, the interior film (2,157 KB; js/v2.js), so the whole page is over DIRECTION.md's 1 MB line before and after; that film is Mick's own and outside this route. The hero's first-paint file grows: desk 89 KB to 214 KB, phone 78 KB to 158 KB, both preloaded; the Critic's estimate is about 0.3 s more at the route's 1.6 Mbps throttle, to be measured after the flip. Nothing named on the page is over 500 KB (the direction's recompress line).

## The sheets

- `sheet-first-screen-1440.jpg` and `sheet-first-screen-390.jpg`: the first screen, before on the left, after on the right.
- `sheet-desk.jpg` and `sheet-phone.jpg`: the whole page, before and after, side by side.
- `after-desk-gallery.jpg` and `after-desk-built.jpg`: the gallery row and the three splits at full size.

## Proven

scripts/site/check_ra_photos.py, both states: the switch is one line; the shipped-state build is the file on disk; off, no frame from the shoot on the page and the share card is the page's own; on, every file named exists, every image carries alt text with no em dash, the two hero preloads name the hero's own two files, the hero's width and height are the file's, the phone hero is a crop of the desk hero's frame, the share card is the hero with its size, nothing over 500 KB, the photographs under 1,024 KB on a phone, no photograph used twice, the home page identical in both states.

Also found on the way: scripts/publish.py published the docs/ folder's non-markdown files (its never-list went by pattern, *.md, *.py and the like), so these sheets would have gone live; "docs" is on the never-list now, and `publish.py --check` passes.

## Flipping it

One line (`RA_PHOTOS = True`), `python3 scripts/site/build_v2.py`, `python3 scripts/site/check_ra_photos.py`, one commit, on Mick's yes to these sheets. What would settle whether "legendary" sells: the funnel's phone picked_dates rate from /treehouses, a week on against a week off (the Critic).
