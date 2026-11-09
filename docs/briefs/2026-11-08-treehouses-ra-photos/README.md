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

## What the switch puts there (`RA_PHOTOS = True` in scripts/site/build_v2.py)

Romantic Atlanta's July 8, 2026 shoot: 47 stills on the workshop at `/home/mick/footage-in/drive/Pictures /` (24 Canon 4W6A, 11 Canon 5P3A, 12 drone). No face in any of them; three pizza frames show hands and are not used. Each file below was made by scripts/site/v2img.py (WebP, quality 74, 800 and 1600 wide), the same pipeline as every other photograph on the site; the builder makes the 684x855 phone crops for the two 4:5 frames.

| Slot | Frame | File | Alt text |
|---|---|---|---|
| Hero, desk | 4W6A8086 | ra-bridge-dusk-1600 (214 KB) | The rope bridge at dusk, strung with lights, the treehouse canvas glowing at its end |
| Hero, phone | 4W6A8074 | ra-bridge-dusk-phone-800 (145 KB) | (the same alt; one image element) |
| Gallery 1, the room | 4W6A7946-HDR | ra-room-wide | The queen bed under the ring chandelier, triangle windows onto the forest |
| Gallery 2, the deck | 4W6A7888 | ra-deck | Two chairs on the sky deck, the canvas sweeping up beside them |
| Gallery 3, the canopy | 5P3A1483 | ra-canopy-sun | Sun through the summer canopy, the deck below |
| Gallery 4, the bridge's end | 4W6A8004-HDR | ra-bridge-end | Where the rope bridge meets the deck, the canvas peak above |
| Built by the family | drone 191028_0015 | ra-aerial | The treehouse hung in the oaks, the rope bridge leading in, seen from above the canopy |
| Sixty feet | drone 205816_0029 | ra-aerial-dusk | The canvas glowing at dusk, level with the treetops |
| The crossing | drone 210518_0045 | ra-bridge-span | The whole span of the rope bridge at dusk, lit all the way to the treehouse |
| Your stay (4:5) | 4W6A7968-HDR | ra-room | The queen bed under the canvas peak, the ring chandelier above |
| Treehouse two (4:5) | 4W6A8084 | ra-deck-dusk | The canvas glowing at dusk, a chair on the sky deck |

The home page does not change: the second-treehouse block keeps its own photograph there. The schema.org image list for the page follows the switch (the hero, the room, the drone frame).

Not used, worth knowing: the upright green bridge (4W6A8022-HDR, 4W6A8028-HDR) and the upright deck (4W6A7890) came out at 250 to 300 KB per 800-wide file because the gallery crops phones to 4:3, so landscape frames were taken for the gallery instead; the pizza and coffee frames (5P3A15xx, 4W6A8047, 4W6A8052) belong to /experiences, not this page.

## Weight

Measured in a real browser on the local build, images only, a full scroll:

| | Phone, 390 px | Desk, 1440 px |
|---|---|---|
| Before | 981 KB | 1,429 KB |
| After | 713 KB | 1,370 KB |

By file size the after page's phone set is 855 KB in 10 images (DIRECTION.md's budget for any other page: under 1 MB). The hero's first-paint file grows: desk 89 KB to 214 KB, phone 78 KB to 145 KB, both preloaded; dusk frames hold more detail than the old still. Nothing named on the page is over 500 KB (the direction's recompress line).

## The sheets

- `sheet-first-screen-1440.jpg` and `sheet-first-screen-390.jpg`: the first screen, before on the left, after on the right.
- `sheet-desk.jpg` and `sheet-phone.jpg`: the whole page, before and after, side by side.
- `after-desk-gallery.jpg` and `after-desk-built.jpg`: the gallery row and the three splits at full size.

## Proven

scripts/site/check_ra_photos.py, both states: the switch is one line; the shipped-state build is the file on disk; off, no frame from the shoot on the page; on, every file named exists, every image carries alt text with no em dash, the two hero preloads name the hero's own two files, the hero's width and height are the file's, nothing over 500 KB, the phone set under 1,024 KB, no photograph used twice, the home page identical in both states.

## Flipping it

One line (`RA_PHOTOS = True`), `python3 scripts/site/build_v2.py`, `python3 scripts/site/check_ra_photos.py`, one commit, on Mick's yes to these sheets. Open with the yes: the share preview (og:image) in the page's head still names the old EQ3A0906 picture; whether it follows the hero is his call.
