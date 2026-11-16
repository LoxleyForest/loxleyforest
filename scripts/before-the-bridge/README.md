# Before the Bridge

The house's questionnaire for an elopement couple: four printable pages, read first on a phone.
One unlisted page per couple, built from `template.html` by `new.py`. The model is the first page
the house made this way, which was built on Mick's own pages.

## Make one

```
python3 scripts/before-the-bridge/new.py --check-in 2027-04-16 --check-out 2027-04-18 \
  --package the-vow --site deck --alcohol --house-photographs --no-waterfall \
  --children 2 --children-are girls --cake --pizza-night
```

That is a made-up shape. It makes `private/before-the-bridge-2027-04-16-to-18-<random>/index.html`
and prints the path and one line saying what the page holds: the package, the dates, the ceremony
day and site, the children, the drink, the photography, the gifts, the print pages, the questions
and the lines held for Mick. Then it prints a `held` line for each line it left out, and the share
link. `--help` lists every flag. Look at the page at phone width and in print preview, then push
to `main`. The first page made from this template waits for Mick's yes on its words, read to him by ear, starting with the lines its notes mark as new. Log his yes; a changed word goes back to him.

Send the link from Mick's own Gmail, in an email they can reply to: the page asks for it back as
a photo of the pages or a reply with the numbers.

## The rules

- **This repository is public.** A page carries the dates, the package and what the flags choose,
  and nothing else about the couple. No name, no email, no phone, nothing about anyone's health.
  Anything specific to one couple goes in Mick's own cover note, never on the page.
- **Names ride in the link.** The page reads their first names from the link after the `#`, as
  the stay guide does. Write them her and him: `#for=Amy%20and%20Jon`, with Amy hers. The page
  greets "Amy and Jon," and question 3 asks Jon about Amy first, as on the model page. Without the
  names the page says "Hi,". `--for "Amy and Jon"` only prints the link with that part attached;
  it is never written. Nothing after a `#` reaches a server or a log.
- **Unlisted, not secret.** A random folder suffix, `noindex`, and `robots.txt` blocks `/private/`.
  No Tag Manager, as on every private page (`scripts/ensure_gtm.py` scans the root pages only).
- **Nothing invented, and no hidden holds.** Every fact on the page comes from `canon/voice.md`,
  the elopement agreement, `gatehouse/offers.py` (loxley-rescue), Mick's own pages or the site. A
  line the record does not hold is a hold in `new.py` (`HOLDS`): its words stay out of every page
  until Mick hears them and says yes, and `new.py` names it each time it leaves it out. A page
  with any comment but its header is refused, so a hold can never ride along hidden.
- **The words live in `template.html`.** Change a word there, never in a made page, and run the
  check. Words the model page does not have are marked with a note in the template.
- **Fonts are embedded** (EB Garamond and Inter, SIL Open Font License, Latin subset, in `fonts/`),
  so the page needs nothing from outside to render or to print.

## Held for Mick

| Hold | The question |
|---|---|
| `laurel_grove` | Are the laurel grove's lights on for their weekend, and is it an easy walk? |
| `pizza_house` | What does pizza night bring? `canon/voice.md` has guests bring the sauce and toppings and the house the dough on request; the held sentence says the dough, the sauce and the cheese are ours. |
| `children_overnight` | May the children stay the night? The record says the treehouse sleeps four comfortably, with an air mattress for families. |

On his yes, put who said it and when in that hold's `yes` in `new.py`, after changing the
template's words if he changed them.

## What changes per couple

| Flag | What the page does |
|---|---|
| `--check-in`, `--check-out`, `--ceremony` | The dates line, "arrive on Friday the 16th", "See you in the trees on the sixteenth", the month and season line in the places question, the day of pizza night and of The Morning After |
| `--package` | `the-vow` or `the-crossing`; The Crossing adds its dinner, cake and The Morning After. The waterfall package is refused until Mick has heard its words |
| `--site`, `--bridge-open` | The line under Part Two: where the vows are, and whether the bridge stays theirs to choose |
| `--alcohol` / `--no-alcohol` | The toast question. `--no-alcohol` refuses a page with any alcohol word (the engine's own list) |
| `--own-photographer` / `--house-photographs` | Questions 8 to 10 and the camera gear line |
| `--waterfall` / `--no-waterfall` | The waterfall row among the places to photograph, one required: the record says it runs in summer and not how it runs otherwise |
| `--children N`, `--children-are` | Part Three for the children, and "all four of you"; without children the care part is Part Three |
| `--morning-after`, `--cake`, `--pizza-night` | What Mick gave beyond the package, each with its question |

## Check

```
node scripts/before-the-bridge/check.js
```

Makes ten made-up shapes into a temporary folder (never `private/`). It proves, in a real browser
at 390 px with every outside request refused: no sideways scroll, the fonts loaded, no script
error, the names from the link and "Hi," without them, one printed page per sheet on US letter,
noindex, no Tag Manager, no token, no name and no comment but the header in the file, and every
held line out of the page. Three of the shapes are made with every hold set, to prove the page
still prints on four sheets once Mick says yes. Then it checks seven things `new.py` must refuse.
Needs playwright-core (`scripts/logo/node_modules`, or set `PLAYWRIGHT_CORE`) and the Chromium at
`~/.cache/ms-playwright/chromium-1243`.
