#!/usr/bin/env python3
"""Make "Married at Loxley Forest", the house's keepsake for an elopement couple, from the template.

    python3 scripts/keepsake/new.py 2027-04-17 --site bridge
    python3 scripts/keepsake/new.py 2027-04-17 --site fire --size card

That makes private/keepsake-2027-04-17-<6 hex>/index.html (a card is keepsake-2027-04-17-card-<6
hex>), noindex and without Tag Manager as every private page, with the date stamped in long form
("Saturday, April 17, 2027") and the line for where they were married. It prints the path and the
share link. Refuses to overwrite. Standard library only.

  date          YYYY-MM-DD, the wedding day.
  --site        where the vows were, in the house's own words:
                  bridge  out on the hundred-foot rope bridge, over the holler
                  fire    at the Fire Circle
                  deck    on the treehouse deck
                The waterfall is refused: its words wait for Mick.
  --size        letter (US Letter portrait, the default) or card (5 by 7 inches).
  --for         their names, used ONLY to print the share link. Never written. Make every link
                this way: it encodes an "&" (%26), and a hand-typed "&" drops the second name.
  --out DIR     the folder to make the page's folder in. Default: private/.

No name goes in the file, ever: this repository is public. The page reads the names from the link
after the #, as the stay guide does:
    https://loxleyforest.com/private/keepsake-2027-04-17-abc123/#for=Her%20and%20Him
Without it the page shows a quiet blank rule where the names go, for a pen.

A line Mick has not heard stays "[MICK RATIFIES]" in template.html, and no page is made while one
is left there (as loxley-rescue gatehouse/offers.py keeps unheard words as None and refuses).
PROPOSED below holds the words put to him for each; on his yes, write them into the template in
place of the marker, and note there who said yes and when.

A thing given, never sold: no price, no package name, nothing a couple did not do on the day.
"""
import argparse
import datetime as dt
import html as entities
import pathlib
import re
import secrets
import sys
import urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
TEMPLATE = HERE / "template.html"
WORDMARK = ROOT / "images" / "brand" / "logo" / "loxley-wordmark-on-light.svg"
PRIVATE = ROOT / "private"
SITE = "https://loxleyforest.com/private/"

# Where the vows were, in the house's own words. Each clause is a line on the page. The bridge is
# a hundred feet long and sixty feet up, never a hundred feet high (canon/voice.md: "a hundred-foot
# suspended bridge", "60 feet up"); its words are canon/letters/purple-room.md's ("a hundred-foot
# rope bridge ... hanging over the holler"). The deck is The Vow's site in the engine's words
# (gatehouse/offers.py: "the treehouse deck"); a deck couple did not take the bridge as their aisle,
# which is The Crossing's (the Critic, 2026-10-29). Canon also calls it the Sky Deck: Mick's call.
SITES = {
    "bridge": ("out on the hundred-foot rope bridge,", "over the holler"),
    "fire": ("at the Fire Circle",),
    "deck": ("on the treehouse deck",),
}
# Both slots in the template, each of which every page must carry with words in it.
SLOTS = ("closing", "signature")
# The bridge's length read as its height: never on a sheet Mick signs.
HEIGHT = re.compile(r"hundred feet (over|above|up|high)", re.I)
REFUSED_SITES = {
    "waterfall": "the waterfall's words wait for Mick (every waterfall line in loxley-rescue "
                 "gatehouse/offers.py is unheard); no keepsake names it until he has said yes",
}
SIZES = {  # the sheet, exactly, for @page
    "letter": "8.5in 11in",
    "card": "5in 7in",
}

MARK = "[MICK RATIFIES]"
# The words put to Mick for each slot in the template. Unheard: proposals only, never on a page
# until he says yes and they are written into template.html in place of the marker.
PROPOSED = {
    "closing": "The bridge will be lit when you come back.",
    "signature": "Mick",
}

DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
MONTHS = ("January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December")

# The only places the page may reach: Google Fonts. The SVG namespace is a name, not a request.
ALLOWED_URLS = re.compile(r"https?://(fonts\.googleapis\.com|fonts\.gstatic\.com|www\.w3\.org/2000/svg)")


class Refused(Exception):
    pass


def long_date(d):
    """Saturday, April 17, 2027 (English, whatever the machine's locale)."""
    return f"{DAYS[d.weekday()]}, {MONTHS[d.month - 1]} {d.day}, {d.year}"


def parse_args(argv):
    p = argparse.ArgumentParser(prog="new.py", description="Make the house's keepsake page.")
    p.add_argument("date", help="the wedding day, YYYY-MM-DD")
    p.add_argument("--site", required=True, help="bridge, fire or deck")
    p.add_argument("--size", default="letter", help="letter (default) or card")
    p.add_argument("--for", dest="names", default="", help="names for the share link only; never written")
    p.add_argument("--out", type=pathlib.Path, default=PRIVATE, help="where to make the folder")
    return p.parse_args(argv)


def wordmark():
    """The live wordmark, inline: the name in the page's ink, the arrow in its gold (both set by the
    page's CSS through currentColor), its mask renamed so nothing else on the page can collide."""
    svg = WORDMARK.read_text(encoding="utf-8")
    svg = svg.replace('xmlns="http://www.w3.org/2000/svg" ', "")
    svg = re.sub(r' width="\d+" height="\d+"', "", svg, count=1)
    svg = svg.replace("<svg ", '<svg class="wm" role="img" aria-label="Loxley Forest" ', 1)
    svg = svg.replace('id="a"', 'id="wm-cut"').replace("url(#a)", "url(#wm-cut)")
    svg = svg.replace('fill="#1a2e1a" class="name"', 'fill="currentColor" class="name"')
    svg = svg.replace('"#c4a265"', '"currentColor"')
    if "#1a2e1a" in svg or "#c4a265" in svg or 'class="name"' not in svg or 'class="arrow"' not in svg:
        raise Refused(f"the wordmark changed shape ({WORDMARK.relative_to(ROOT)}); look before printing it")
    return svg


def make(day, site, size, template=None):
    """The page's HTML, or Refused with the reason."""
    if site in REFUSED_SITES:
        raise Refused(f"--site {site}: {REFUSED_SITES[site]}")
    if site not in SITES:
        raise Refused(f"--site must be one of {', '.join(SITES)} (got {site!r})")
    if size not in SIZES:
        raise Refused(f"--size must be one of {', '.join(SIZES)} (got {size!r})")
    html = (template or TEMPLATE).read_text(encoding="utf-8")

    unset = re.findall(r'data-slot="(\w+)"[^>]*>\s*' + re.escape(MARK), html)
    if MARK in html:
        lines = [f"{k}: proposed \"{PROPOSED.get(k, '(none)')}\"" for k in unset] or ["(a marker outside a slot)"]
        raise Refused("lines Mick has not heard are still " + MARK + " in template.html, so no "
                      "keepsake is made:\n  " + "\n  ".join(lines) +
                      "\nRead him each; on his yes, write his words in place of the marker.")
    for k, words in re.findall(r'data-slot="(\w+)"[^>]*>(.*?)</', html, re.S):
        if not words.strip():
            raise Refused(f"the {k} slot in template.html is empty")

    # Template notes are for whoever edits the template, never for the page.
    html = re.sub(r"[ \t]*<!--.*?-->[ \t]*\n?", "", html, flags=re.S)
    html = re.sub(r"[ \t]*/\*.*?\*/[ \t]*\n?", "", html, flags=re.S)
    values = {
        "SIZE": size,
        "PAGE_SIZE": SIZES[size],
        "DATE_LONG": long_date(day),
        "DATE_ISO": day.isoformat(),
        "SITE_LINES": " ".join(f'<span class="clause">{c}</span>' for c in SITES[site]),
        "WORDMARK": wordmark(),
    }
    missing = sorted(set(re.findall(r"\{\{(\w+)\}\}", html)) - set(values))
    if missing:
        raise Refused("template: no value for " + ", ".join(missing))
    html = re.sub(r"\{\{(\w+)\}\}", lambda m: values[m.group(1)], html)
    html = "<!-- Married at Loxley Forest: the house's keepsake, made by scripts/keepsake/new.py -->\n" + html
    guard(html)
    return html


def guard(html):
    """Refuse a page that could carry a token, a note, an unheard or missing slot, the bridge's
    length as its height, a dash the house does not use, a form, a request beyond Google Fonts, or
    Tag Manager, or that lost its noindex."""
    if "{{" in html or "}}" in html:
        raise Refused("a {{token}} is left in the page")
    plain = re.sub(r"\s+", " ", entities.unescape(html))  # entities decoded, so no marker hides as &#91;
    if "RATIFIES" in plain.upper():
        raise Refused("an unheard line ([MICK RATIFIES]) is in the page")
    if html.count("<!--") != 1:
        raise Refused("a note beyond the page's header is in the page")
    slots = dict(re.findall(r'data-slot="(\w+)"[^>]*>(.*?)</', html, re.S))
    for k in SLOTS:
        if k not in slots:
            raise Refused(f"the {k} slot is missing from the page")
        if not re.sub(r"<[^>]*>", "", entities.unescape(slots[k])).strip():
            raise Refused(f"the {k} slot holds no words")
    if HEIGHT.search(re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", plain))):
        raise Refused("the page says \"a hundred feet\" over or up: the bridge is a hundred feet long and "
                      "sixty feet up")
    if re.search("[\u2013\u2014]", html):
        raise Refused("an en or em dash is in the page")
    if 'name="robots" content="noindex' not in html:
        raise Refused("the page lost its noindex")
    if "googletagmanager" in html or "gtm.js" in html:
        raise Refused("a private page carries no Tag Manager")
    if re.search(r"<form\b|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|<iframe\b", html, re.I):
        raise Refused("the page may not send or fetch anything")
    for m in re.finditer(r"https?://[^\s\"')<>]+", html):
        if not ALLOWED_URLS.match(m.group(0)):
            raise Refused(f"the page reaches beyond Google Fonts: {m.group(0)}")
    if re.search(r"\$\s?\d|\bprice\b|\bdiscount|\bThe Vow\b|\bThe Crossing\b|\bThe Elevation\b|waterfall",
                 html, re.I):
        raise Refused("a price, a package name or the waterfall is in the page; a keepsake is a gift")


def main(argv):
    a = parse_args(argv)
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", a.date):
            raise Refused("the date must be YYYY-MM-DD")
        try:
            day = dt.date.fromisoformat(a.date)
        except ValueError:
            raise Refused(f"{a.date} is not a date")
        html = make(day, a.site, a.size)
    except Refused as e:
        print(f"refused: {e}", file=sys.stderr)
        return 2
    tag = "" if a.size == "letter" else f"{a.size}-"
    folder = a.out / f"keepsake-{day.isoformat()}-{tag}{secrets.token_hex(3)}"
    if folder.exists():
        print(f"refusing: {folder} exists", file=sys.stderr)
        return 1
    folder.mkdir(parents=True)
    (folder / "index.html").write_text(html, encoding="utf-8")
    shown = folder.relative_to(ROOT) if folder.is_relative_to(ROOT) else folder
    url = SITE + folder.name + "/"
    print(f"made  {shown}/index.html")
    print(f"page  {long_date(day)} · {' '.join(SITES[a.site])} · {a.size} ({SIZES[a.size]})")
    if a.names:  # used for this line only; never written to disk
        print(f"link  {url}#for={urllib.parse.quote(a.names.strip())}")
    else:
        print(f"link  {url}  (make it again with --for \"Her and Him\" to set their names on it)")
    print("print open the link with their names, then Print. Save as PDF with Background graphics on")
    print("      for the paper's cream; on cream card stock, leave Background graphics off.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
