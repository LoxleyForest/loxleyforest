#!/usr/bin/env python3
"""Make Before the Bridge, the house's questionnaire for an elopement couple, from the template.

    python3 scripts/before-the-bridge/new.py --check-in 2027-04-16 --check-out 2027-04-18 \\
        --package the-vow --site deck --alcohol --house-photographs --no-waterfall \\
        --children 2 --children-are girls --cake --pizza-night

That is a made-up shape. It makes private/before-the-bridge-2027-04-16-to-18-<6 hex>/index.html
(noindex, no Tag Manager, as every private page) and prints the path, a one-line summary, any line
held out for Mick, and the share link. Refuses to overwrite, and refuses a page with a token or a
hidden comment left in it. Standard library only.

The stay (the arrival day is --check-in):
  --check-in, --check-out   YYYY-MM-DD. The page names the arrival ("Friday the 16th"), the dates
                            ("April 16 to 18, 2027") and closes "See you in the trees on the
                            sixteenth."
  --ceremony                YYYY-MM-DD, a night of the stay. Default: the second day of a stay of
                            two nights or more, else the arrival. The Morning After is the morning after it.
The package (the contents of loxley-rescue gatehouse/offers.py PACKAGES):
  --package                 the-vow or the-crossing. The Crossing brings its dinner, The Morning
                            After and its cake. The waterfall package (the-falls) is
                            refused: its words wait for Mick's ear.
  --site                    where the vows are: fire-circle, deck or either (The Vow's choice);
                            bridge (The Crossing's default; The Crossing may also take The Vow's).
  --bridge-open             adds "and the rope bridge is yours to choose until the week of".
  --morning-after, --cake, --pizza-night
                            what Mick gave beyond the package.
The couple's answers so far, and Mick's call on the waterfall row:
  --alcohol | --no-alcohol  one is required. It changes the toast question; --no-alcohol also
                            refuses a page with any alcohol word in it (offers.py ALCOHOL).
  --own-photographer | --house-photographs
                            one is required. It changes the photography part.
  --waterfall | --no-waterfall
                            one is required: the waterfall row among the places to photograph.
                            The record says it runs in summer and not how it runs otherwise.
  --children N              0 to 6; the children's part shows only above 0.
  --children-are            boys, girls or children (the default). The words the page uses.
Where it goes:
  --out DIR                 the folder to make the page's folder in. Default: private/.
  --for "Her and Him"       their first names, hers first, used ONLY to print the share link.
                            Never written.

No guest name, email or phone ever goes in the file, and nothing about the couple beyond what the
flags choose: this repository is public. The page reads the first names from the link after the #,
as the stay guide does: https://loxleyforest.com/private/<folder>/#for=Amy%20and%20Jon greets "Amy
and Jon," and asks question 3 of Jon about Amy; without it the page says "Hi,".

Lines the record does not hold are HOLDS below. Each stays out of every page until Mick hears it
and says yes, and new.py names it each time it leaves one out.
"""
import argparse
import base64
import calendar
import datetime as dt
import pathlib
import re
import secrets
import sys
import urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
TEMPLATE = HERE / "template.html"
FONTS = HERE / "fonts"
PRIVATE = ROOT / "private"
SITE = "https://loxleyforest.com/private/"

PACKAGES = {  # key: (name, sites it may take, its default site)
    "the-vow": ("The Vow", ("fire-circle", "deck", "either"), None),
    "the-crossing": ("The Crossing", ("bridge", "fire-circle", "deck", "either"), "bridge"),
}
REFUSED_PACKAGES = {
    "the-falls": "the waterfall package's words wait for Mick's ear (every waterfall line "
                          "in loxley-rescue gatehouse/offers.py is unheard); no page until he has "
                          "said yes to them",
}
SITE_WORDS = {"fire-circle": "at the Fire Circle", "deck": "on the treehouse deck",
              "either": "at the Fire Circle or on the deck", "bridge": "on the rope bridge"}
SEASONS = {12: "winter", 1: "winter", 2: "winter", 3: "spring", 4: "spring", 5: "spring",
           6: "summer", 7: "summer", 8: "summer", 9: "fall", 10: "fall", 11: "fall"}  # seasons.md
NUMBER = ("no", "one", "two", "three", "four", "five", "six", "seven", "eight")
ORDINAL = ("", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth",
           "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth",
           "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first",
           "twenty-second", "twenty-third", "twenty-fourth", "twenty-fifth", "twenty-sixth",
           "twenty-seventh", "twenty-eighth", "twenty-ninth", "thirtieth", "thirty-first")
KIDS = {  # plural, singular, and the singular's subject, possessive and "is"
    "boys": ("boys", "boy", "he", "his", "he is"),
    "girls": ("girls", "girl", "she", "her", "she is"),
    "children": ("children", "child", "they", "their", "they are"),
}
MAX_CHILDREN = 6  # the agreement: the two of you plus up to six guests (offers.py MAX_PARTY)

# Lines the record does not hold. The template keeps each inside an "ok_NAME" block, so its words
# stay out of every page until Mick hears them and says yes, as offers.py keeps unheard words out.
# To set one: read him the words in the template, and on his yes put who said it and when in "yes"
# (for example "Mick, 2026-11-02, by ear"); change the template's words first if he changed them.
HOLDS = {
    "laurel_grove": {
        "line": "the laurel grove row among the places to photograph",
        "ask": "Are the laurel grove's lights on for their weekend, and is it an easy walk?",
        "yes": None},
    "pizza_house": {
        "line": "the pizza sentence \"The dough, the sauce and the cheese are ours, and the "
                "toppings you love will be waiting.\"",
        "ask": "In canon/voice.md guests bring the sauce and toppings and the house the dough on "
               "request; is this sentence what pizza night brings?",
        "yes": None},
    "children_overnight": {
        "line": "the children's question \"Will they stay the night, or head home after?\"",
        "ask": "May the children stay the night? The record says the treehouse sleeps four "
               "comfortably, with an air mattress for families.",
        "yes": None},
}

# Every flag the template may test. A term the template uses that is not here is refused.
FLAGS = ("children", "many_children", "one_child", "pizza", "morning_after", "cake_gift", "dinner",
         "alcohol", "no_alcohol", "own_photo", "house_photo", "waterfall_row", "guests",
         "bridge_open", "site_fire_circle", "site_deck", "site_either", "site_bridge",
         "winter", "spring", "summer", "fall") + tuple("ok_" + k for k in HOLDS)
# What nothing a no-alcohol couple reads may say: loxley-rescue gatehouse/offers.py ALCOHOL, word
# for word (2026-10-28), so this page holds to the same line their agreement does.
ALCOHOL = re.compile(r"\b(champagne|mimosas?|prosecco|bubbly|wines?|beers?|ales?|lagers?|"
                     r"cocktails?|sangria|margaritas?|alcohol\w*|liquor|booze|bourbon|whiske?y|"
                     r"vodka|tequila|hard ciders?)\b", re.I)
BASE64_RUN = re.compile(r"base64,[A-Za-z0-9+/=]+")
DIRECTIVE = re.compile(r"<!--(if\s[^>]*?|endif)-->")


class Refused(Exception):
    pass


def day_th(d):
    s = "th" if 11 <= d % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(d % 10, "th")
    return f"{d}{s}"


def dates_label(a, b):
    m = calendar.month_name
    if a.year != b.year:
        return f"{m[a.month]} {a.day}, {a.year} to {m[b.month]} {b.day}, {b.year}"
    if a.month != b.month:
        return f"{m[a.month]} {a.day} to {m[b.month]} {b.day}, {b.year}"
    return f"{m[a.month]} {a.day} to {b.day}, {b.year}"


def folder_dates(a, b):
    if a.year != b.year:
        return f"{a.isoformat()}-to-{b.isoformat()}"
    if a.month != b.month:
        return f"{a.isoformat()}-to-{b.month:02d}-{b.day:02d}"
    return f"{a.isoformat()}-to-{b.day:02d}"


def parse_args(argv):
    p = argparse.ArgumentParser(prog="new.py", description=__doc__.split("\n\n")[0],
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--check-in", required=True, type=dt.date.fromisoformat)
    p.add_argument("--check-out", required=True, type=dt.date.fromisoformat)
    p.add_argument("--ceremony", type=dt.date.fromisoformat)
    p.add_argument("--package", required=True, choices=sorted({*PACKAGES, *REFUSED_PACKAGES}))
    p.add_argument("--site", choices=sorted(SITE_WORDS))
    p.add_argument("--bridge-open", action="store_true")
    drink = p.add_mutually_exclusive_group(required=True)
    drink.add_argument("--alcohol", dest="alcohol", action="store_true")
    drink.add_argument("--no-alcohol", dest="alcohol", action="store_false")
    photo = p.add_mutually_exclusive_group(required=True)
    photo.add_argument("--own-photographer", dest="own_photo", action="store_true")
    photo.add_argument("--house-photographs", dest="own_photo", action="store_false")
    fall = p.add_mutually_exclusive_group(required=True)
    fall.add_argument("--waterfall", dest="waterfall_row", action="store_true")
    fall.add_argument("--no-waterfall", dest="waterfall_row", action="store_false")
    p.add_argument("--children", type=int, default=0)
    p.add_argument("--children-are", choices=sorted(KIDS), default="children")
    p.add_argument("--morning-after", action="store_true")
    p.add_argument("--cake", action="store_true")
    p.add_argument("--pizza-night", action="store_true")
    p.add_argument("--out", type=pathlib.Path, default=PRIVATE)
    p.add_argument("--for", dest="names", default="")
    return p.parse_args(argv)


def shape(a):
    """The flags and values for one couple, or Refused with the reason."""
    if a.package in REFUSED_PACKAGES:
        raise Refused(REFUSED_PACKAGES[a.package])
    name, sites, default_site = PACKAGES[a.package]
    nights = (a.check_out - a.check_in).days
    if nights < 1:
        raise Refused("--check-out must come after --check-in")
    site = a.site or default_site
    if not site:
        raise Refused(f"{name} needs --site: {', '.join(sites)}")
    if site not in sites:
        raise Refused(f"{name} does not take --site {site}: {', '.join(sites)}")
    if a.bridge_open and site == "bridge":
        raise Refused("--bridge-open makes no sense with --site bridge")
    ceremony = a.ceremony or (a.check_in + dt.timedelta(days=1) if nights >= 2 else a.check_in)
    if not a.check_in <= ceremony < a.check_out:
        raise Refused("--ceremony must be a night of the stay: on or after --check-in, before --check-out")
    if not 0 <= a.children <= MAX_CHILDREN:
        raise Refused(f"--children runs 0 to {MAX_CHILDREN} (the agreement's six guests)")

    crossing = a.package == "the-crossing"
    morning_after = a.morning_after or crossing          # The Crossing: "The Morning After"
    cake_gift = a.cake and not crossing                   # The Crossing: "Celebration cake"
    plural, single, subj, pos, be = KIDS[a.children_are]
    many = a.children > 1
    the_kids = f"the {plural if many else single}"
    month = calendar.month_name[ceremony.month]
    flags = {
        "children": a.children > 0, "many_children": many, "one_child": a.children == 1,
        "pizza": a.pizza_night, "morning_after": morning_after, "cake_gift": cake_gift,
        "dinner": crossing, "alcohol": a.alcohol, "no_alcohol": not a.alcohol,
        "own_photo": a.own_photo, "house_photo": not a.own_photo,
        "waterfall_row": a.waterfall_row, "guests": a.children > 0 or a.own_photo,
        "bridge_open": a.bridge_open,
        **{"site_" + s.replace("-", "_"): site == s for s in SITE_WORDS},
        **{s: SEASONS[ceremony.month] == s for s in ("winter", "spring", "summer", "fall")},
        **{"ok_" + k: h["yes"] is not None for k, h in HOLDS.items()},
    }
    who = [w for w, on in ((the_kids.capitalize(), a.children), ("your photographer", a.own_photo)) if on]
    guest_list = " and ".join(who)
    guest_list = guest_list[:1].upper() + guest_list[1:]
    group = ("they", "Their", "they are") if many or a.children_are == "children" else (subj, pos.capitalize(), be)
    values = {
        "package_name": name, "dates_label": dates_label(a.check_in, a.check_out), "month": month,
        "arrival_phrase": f"{calendar.day_name[a.check_in.weekday()]} the {day_th(a.check_in.day)}",
        "arrival_ordinal": ORDINAL[a.check_in.day],
        "ceremony_day": calendar.day_name[ceremony.weekday()],
        "morning_day": calendar.day_name[(ceremony + dt.timedelta(days=1)).weekday()],
        "the_kids": the_kids, "Kids": (plural if many else single).capitalize(),
        "kids_all": "both of them" if a.children == 2 else f"all {NUMBER[a.children]} of them",
        "party_word": NUMBER[2 + a.children],
        "kids_do": "do" if many else "does",
        "pr_subj": group[0], "Pr_pos": group[1], "pr_subj_be": group[2],
        "plural_s": "s" if many else "",
        "care_part": "Four" if a.children else "Three", "guest_list": guest_list,
    }
    summary = [
        name, values["dates_label"],
        f"ceremony {values['ceremony_day']} the {day_th(ceremony.day)} {SITE_WORDS[site]}"
        + (" (the bridge open)" if a.bridge_open else ""),
        f"{NUMBER[a.children]} {plural if many else single}" if a.children else "no children",
        "alcohol" if a.alcohol else "no alcohol",
        "their own photographer" if a.own_photo else "the house photographs",
        "the waterfall row" if a.waterfall_row else "no waterfall row",
    ]
    extras = [w for w, on in (("The Morning After", a.morning_after and not crossing),
                              ("cake", cake_gift), ("pizza night", a.pizza_night)) if on]
    if extras:
        summary.append(" + ".join(extras))
    return flags, values, summary


def choose(text, flags, seen):
    """Keep what every enclosing 'if' allows; drop the directives themselves. Every flag tested
    where the page is still being kept goes into seen, so the holds this page met can be named."""
    # A directive alone on its line takes its line with it, so the page has no stray blank lines.
    text = re.sub(r"(?m)^[ \t]*(<!--(?:if\s[^>]*?|endif)-->)[ \t]*\n", r"\1", text)
    out, stack, pos = [], [], 0
    for m in DIRECTIVE.finditer(text):
        if all(stack):
            out.append(text[pos:m.start()])
        pos = m.end()
        body = m.group(1)
        if body == "endif":
            if not stack:
                raise Refused("template: an endif with no if")
            stack.pop()
            continue
        ok = True
        for term in body.split()[1:]:
            neg, key = term.startswith("!"), term.lstrip("!")
            if key not in flags:
                raise Refused(f"template: unknown flag {key!r}")
            if all(stack):
                seen.add(key)
            ok = ok and (flags[key] != neg)
        stack.append(ok)
    if stack:
        raise Refused("template: an if with no endif")
    out.append(text[pos:])
    return "".join(out)


def render(flags, values):
    html = TEMPLATE.read_text(encoding="utf-8")
    html = re.sub(r"[ \t]*<!--t:.*?-->[ \t]*\n?", "", html, flags=re.S)
    seen = set()
    html = choose(html, flags, seen)
    held = [k for k in HOLDS if "ok_" + k in seen and not flags["ok_" + k]]

    def font(m):
        return base64.b64encode((FONTS / m.group(1)).read_bytes()).decode("ascii")

    html = re.sub(r"\{\{font:([\w.-]+)\}\}", font, html)
    counter = iter(range(1, 1000))
    html = re.sub(r'<span class="n">#</span>', lambda m: f'<span class="n">{next(counter)}</span>', html)
    sheets = html.count('<div class="sheet')
    pages = iter(range(1, sheets + 1))
    html = html.replace("{{pages}}", str(sheets))
    html = re.sub(r"\{\{page\}\}", lambda m: str(next(pages)), html)
    missing = sorted(set(re.findall(r"\{\{(\w+)\}\}", html)) - set(values))
    if missing:
        raise Refused("template: no value for " + ", ".join(missing))
    html = re.sub(r"\{\{(\w+)\}\}", lambda m: values[m.group(1)], html)
    return html, sheets, len(re.findall(r'<span class="n">\d+</span>', html)), held


def guard(html, alcohol):
    """Refuse a page that could carry a token, a hidden hold, a dash the house does not use, or a
    drink word."""
    bare = BASE64_RUN.sub("base64,", html)
    if "{{" in bare or "}}" in bare:
        raise Refused("a {{token}} is left in the page")
    if DIRECTIVE.search(bare) or "<!--t:" in bare:
        raise Refused("a template directive is left in the page")
    if "MICK RATIFIES" in bare.upper() or bare.count("<!--") != 1:
        raise Refused("a comment beyond the page's header is in the page; a line Mick has not "
                      "heard is a hold in new.py (HOLDS), never a comment beside words a couple reads")
    if re.search("[\\u2013\\u2014]", bare):
        raise Refused("an en or em dash is in the page")
    if 'name="robots" content="noindex' not in bare:
        raise Refused("the page lost its noindex")
    if "googletagmanager" in bare:
        raise Refused("a private page carries no Tag Manager")
    if not alcohol:
        hits = sorted({m.group(0).lower() for m in ALCOHOL.finditer(bare)})
        if hits:
            raise Refused("a no-alcohol page says: " + ", ".join(hits))


def main(argv):
    a = parse_args(argv)
    try:
        flags, values, summary = shape(a)
        html, sheets, questions, held = render(flags, values)
        guard(html, a.alcohol)
    except Refused as e:
        print(f"refused: {e}", file=sys.stderr)
        return 2
    folder = a.out / f"before-the-bridge-{folder_dates(a.check_in, a.check_out)}-{secrets.token_hex(3)}"
    if folder.exists():
        print(f"refusing: {folder} exists", file=sys.stderr)
        return 1
    folder.mkdir(parents=True)
    (folder / "index.html").write_text(html, encoding="utf-8")
    shown = folder.relative_to(ROOT) if folder.is_relative_to(ROOT) else folder
    summary += [f"{sheets} print pages", f"{questions} questions", f"{len(held)} held for Mick"]
    url = SITE + folder.name + "/"
    print(f"made  {shown}/index.html")
    print("page  " + " · ".join(summary))
    for k in held:
        print(f"held  {HOLDS[k]['line']}: out of the page until Mick says yes. {HOLDS[k]['ask']}")
    if a.names:  # used for this line only; never written to disk
        print(f"link  {url}#for={urllib.parse.quote(a.names.strip())}")
    else:
        print(f"link  {url}  (add #for=Her%20and%20Him, hers first, to greet them by name)")
    print("send  from Mick's own Gmail, so a reply with the numbers comes back to him")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
