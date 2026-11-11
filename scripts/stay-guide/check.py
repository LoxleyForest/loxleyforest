#!/usr/bin/env python3
"""Check a finished stay guide before it is pushed.

    python3 scripts/stay-guide/check.py private/stay-guide-2026-11-21-e67855

Fails (exit 1) on anything a guest must never see or the house's rules forbid:
  - a folder outside private/ or not named stay-guide-<arrival>-<six hex>
  - no noindex, or Tag Manager anywhere on the page
  - a {{...}} block, an <!-- EDIT --> comment, a [MICK RATIFIES] or [SCOUT] marker left in
  - the template's own stale description (October 9 to 12) still in the head
  - a nav pill with no section, or a section with no nav pill
  - an image or a private page the site does not have
  - a stylesheet, script, image or font from any host but Google Fonts
  - a late checkout promised, or an em dash (the house writes none)
  - the names hook missing: the #for reader, and a generic "Prepared for" line in the file
Warns (exit 0) on a dollar sign, so every price on the page is a deliberate one.
Standard library only. Prints one line per check; the last line is the verdict.
"""
import html as htmllib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
FONT_HOSTS = ("https://fonts.googleapis.com", "https://fonts.gstatic.com")


def main(argv):
    if len(argv) != 2:
        print(__doc__)
        return 2
    folder = (ROOT / argv[1]).resolve() if not pathlib.Path(argv[1]).is_absolute() else pathlib.Path(argv[1])
    fails, warns = [], []

    def ok(label):
        print(f"  ok    {label}")

    def fail(label):
        fails.append(label)
        print(f"  FAIL  {label}")

    def warn(label):
        warns.append(label)
        print(f"  warn  {label}")

    rel = folder.relative_to(ROOT) if folder.is_relative_to(ROOT) else folder
    if folder.parent != ROOT / "private" or not re.fullmatch(r"stay-guide-\d{4}-\d{2}-\d{2}-[0-9a-f]{6}", folder.name):
        fail(f"folder {rel} is not private/stay-guide-<arrival>-<six hex>")
    else:
        ok(f"folder {rel}")
    page = folder / "index.html"
    if not page.exists():
        fail("index.html missing")
        print(f"{len(fails)} failed")
        return 1
    html = page.read_text()
    others = [p.name for p in folder.iterdir() if p.name != "index.html"]
    if others:
        fail(f"the folder holds more than index.html: {', '.join(others)}")
    else:
        ok("index.html alone in the folder")

    # Unlisted, no Tag Manager.
    if '<meta name="robots" content="noindex, nofollow, noarchive">' in html:
        ok("noindex, nofollow, noarchive")
    else:
        fail("the noindex meta is missing or changed")
    if "GTM-" in html or "googletagmanager" in html:
        fail("Tag Manager on the page")
    else:
        ok("no Tag Manager")

    # Nothing of the writing left behind. The {{...}} blocks live in the markup; the style and
    # script blocks close with }} of their own.
    markup = re.sub(r"<style>.*?</style>|<script>.*?</script>", " ", html, flags=re.S)
    for pat, found, none in ((r"\{\{|\}\}", "a {{...}} block", "no {{...}} block left"),
                             (r"<!--\s*EDIT", "an EDIT comment", "no EDIT comment left"),
                             (r"\[MICK RATIFIES", "a [MICK RATIFIES] line", "no [MICK RATIFIES] line"),
                             (r"\[SCOUT", "a [SCOUT] marker", "no [SCOUT] marker"),
                             (r"October 9 to 12", "the template's stale description", "the description is this stay's"),
                             (r"late check-?out", "a late checkout", "no late checkout promised"),
                             ("—", "an em dash", "no em dash")):
        n = len(re.findall(pat, markup if pat.startswith(r"\{") else html, flags=re.I))
        if n:
            fail(f"{found} left on the page ({n})")
        else:
            ok(none)

    # The names ride in the link.
    if "location.hash" in html and "for=" in html and 'id="for"' in html:
        ok("the names reader (#for=) is in place")
    else:
        fail("the names reader is missing")
    m = re.search(r'<div class="for" id="for">([^<]*)</div>', html)
    if m and re.fullmatch(r"Prepared for (the two of you|your family|you|both of you|the three of you|all of you)", m.group(1).strip()):
        ok(f'the file greets no one by name ("{m.group(1).strip()}")')
    else:
        fail(f'the "for" line is not a generic one: {m.group(1).strip() if m else "(missing)"}')

    # Nav pills and sections agree.
    pills = re.findall(r'<nav class="nav" id="nav">(.*?)</nav>', html, flags=re.S)
    hrefs = re.findall(r'href="#([\w-]+)"', pills[0]) if pills else []
    ids = set(re.findall(r'<(?:section|div) class="(?:[\w -]*)" id="([\w-]+)"', html))
    ids |= set(re.findall(r'<section id="([\w-]+)"', html))
    for h in hrefs:
        if h not in ids:
            fail(f"nav pill #{h} has no section")
    for i in ids:
        if i not in hrefs and i != "for":
            fail(f"section #{i} has no nav pill")
    if hrefs and all(h in ids for h in hrefs) and all(i in hrefs for i in ids if i != "for"):
        ok(f"{len(hrefs)} nav pills, each with its section, and no section without one")

    # Every picture and private page the site has.
    paths = set(re.findall(r'(?:src|href|content)="(?:https://loxleyforest\.com)?(/(?:images|private)/[^"#?]+)"', html))
    missing = []
    for p in sorted(paths):
        target = ROOT / htmllib.unescape(p).lstrip("/")
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            missing.append(p)
    if missing:
        fail("not on the site: " + ", ".join(missing))
    else:
        ok(f"{len(paths)} images and private pages, all on the site")

    # Nothing fetched from another host but the fonts.
    fetched = re.findall(r'<(?:link|script|img|source|video|iframe)\b[^>]*?(?:href|src)="(https?://[^"]+)"', html)
    strangers = [u for u in fetched if not u.startswith(FONT_HOSTS)]
    if strangers:
        fail("fetched from outside: " + ", ".join(sorted(set(strangers))))
    else:
        ok("nothing fetched from outside but Google Fonts")

    # Prices are a deliberate choice, never a leftover.
    text = re.sub(r"<style>.*?</style>|<script>.*?</script>|<[^>]+>", " ", html, flags=re.S)
    dollars = re.findall(r"\$\s?\d+(?:[.,]\d+)*(?:\s+[\w'&;]+){0,3}", text)
    if dollars:
        warn("dollar signs on the page: " + "; ".join(" ".join(d.split()) for d in dollars))
    else:
        ok("no dollar sign on the page")

    print(f"{len(fails)} failed, {len(warns)} warned")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
