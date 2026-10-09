# The stay guide

One unlisted page per stay, built from `template.html`, with the guests' days
written out stop by stop. The first one, for October 9 to 12, 2026, lives at
`private/field-guide-oct-2026-79af52/` and is the model.

## Make one

```
python3 scripts/stay-guide/new.py 2026-11-14 "November 14 to 16, 2026"
```

That makes `private/stay-guide-2026-11-14-<random>/index.html` with the dates
stamped. Then write every `{{...}}` block and follow each `<!-- EDIT -->`
comment. Delete the comments when done. Push to `main`; Netlify serves it in
seconds.

## The rules

- **No guest names in the file, ever.** The page reads them from the link after
  the `#` (`#for=Jon%20and%20Amy`) and shows "Prepared for Jon and Amy". Share
  the link with that part attached. Nothing after a `#` reaches a server or a
  log.
- **Unlisted, not secret.** The folder gets a random suffix, the page carries
  `noindex`, and `robots.txt` blocks `/private/`. Anyone with the link can open
  it, so the page holds nothing a stranger could use: no booking numbers, no
  door codes, no addresses beyond the places in town.
- **Every fact checked the day it is written.** The forecast from weather.gov,
  hours and fees from each place's own site or the Forest Service, with the
  check date said on the page. The staff's Scout does this in one dispatch.
  Nothing from memory.
- **The evergreen sections stay evergreen.** Waterfalls, eat and drink, the
  treehouse: edit the badges per stay, keep the facts, and when a fact is
  corrected, correct it in `template.html` too.
- **The voice is Mick's.** Plain sentences from a man in the woods. No emoji,
  no stacked exclamation marks, "holler" not "ravine". A thing may be given,
  never discounted.

## What changes per stay

Hero note, the forecast grid, Book These Today, one section per day, the pack
list lines, the badges, the closing line. The guests' answers to the arrival
questionnaire (`/your-adventure`) say how hard to hike, whether water is in,
and whether it is tables or trails.

## Photos

All from `/images/`, listed with their subjects in the DAYS comment inside the
template. Reference them by absolute path; do not copy them into the folder.
