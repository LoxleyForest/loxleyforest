# Married at Loxley Forest

The house's keepsake for every elopement couple: one printed sheet, the names,
where and when they were married, and Mick's hand on it. It is a gift, given
after the ceremony, in hand or as a PDF. Never sold, never priced, never part
of a package's list.

## Make one

```
python3 scripts/keepsake/new.py 2027-04-17 --site bridge
python3 scripts/keepsake/new.py 2027-04-17 --site bridge --size card
```

That makes `private/keepsake-2027-04-17-<random>/index.html` (a card's folder
is `keepsake-2027-04-17-card-<random>`) with the date stamped in long form,
"Saturday, April 17, 2027", and the line for where the vows were. Push to
`main`; Netlify serves it in seconds. Standard library only.

| `--site` | The line on the sheet |
|---|---|
| `bridge` | out on the hundred-foot rope bridge, over the holler |
| `fire` | at the Fire Circle |
| `deck` | on the treehouse deck |

The waterfall is refused until Mick has said yes to its words. The bridge is a
hundred feet long and sixty feet up; `new.py` refuses a sheet that says "a
hundred feet" over or up. The deck line is the engine's own words for The
Vow's site; canon also calls it the Sky Deck, and which one the sheet says is
Mick's call by ear.

`--size letter` (the default) is US Letter portrait, for framing. `--size card`
is 5 by 7 inches. Each prints on exactly one page of its own size.

## The names

**Never in the file.** The page reads them from the link after the `#`:

```
https://loxleyforest.com/private/keepsake-2027-04-17-abc123/#for=Her%20and%20Him
```

Nothing after a `#` reaches a server or a log. Two names joined by "and" or "&"
are set as a pair, each on its own line with a small "and" between. Long names
step down in size to fit. Without the `#for=` part the sheet shows a quiet rule
where the names go, for a pen.

## Print it, or send it

Make the link with `--for "Her and Him"`, never by typing the names into it:
`new.py` encodes an "&" as `%26`, and a hand-typed "&" after `#for=` drops the
second name. Open that link in Chrome, then Print.

- **To send:** Save as PDF, Background graphics **on**. The PDF carries the
  cream of the paper.
- **To print on cream card stock:** Background graphics **off**. Only the ink
  prints: the forest green type and the gold arrow and rule.

The page sets its own paper size and margins, so leave the dialog's paper and
margin settings at their defaults. Every word sits at least 0.95 inch inside
the edge of a Letter sheet and 0.45 inch inside a card, clear of any printer's
edge and any frame's mat.

## Two lines wait for Mick

The closing line and the words under the signature rule are `[MICK RATIFIES]`
in `template.html`. `new.py` makes no keepsake while either marker stands, and
names the words proposed for each (`PROPOSED` in `new.py`, unheard):

- closing: "The bridge will be lit when you come back."
- signature: "Mick"

Read them to him. On his yes, write his words in the template in place of the
marker, with who said yes and when in the note beside it.

## The rules

- **A gift, never discounted.** No price, no package name, nothing a couple did
  not do on the day. `new.py` refuses a page that says one.
- **Unlisted, not secret.** A random folder, `noindex`, and `robots.txt` blocks
  `/private/`. No Tag Manager, no form, nothing sent or fetched. The only
  outside request is Google Fonts, the site's own faces.
- **The voice is Mick's.** Plain words, "holler" never "ravine", no
  exclamation marks, no emoji.
- **The mark is the live wordmark,** read from
  `images/brand/logo/loxley-wordmark-on-light.svg` each time, with the arrow
  through the name kept (Mick, 2026-10-12). The arrow is the sheet's one
  ornament. The engraved emblem is not on any live page yet; it joins the
  sheet only if Mick says so.
