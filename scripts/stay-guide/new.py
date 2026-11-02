#!/usr/bin/env python3
"""Start a new stay guide from the template.

    python3 scripts/stay-guide/new.py 2026-11-14 "November 14 to 16, 2026"

Makes private/stay-guide-2026-11-14-<random>/index.html with the dates stamped
and every {{...}} block left for the session to write. Prints the path and the
share link. Refuses to overwrite. Standard library only.

Guest names never go in the file. They ride in the link after the #:
    https://loxleyforest.com/private/stay-guide-2026-11-14-abc123/#for=Jon%20and%20his%20bride
"""
import pathlib
import re
import secrets
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "scripts" / "stay-guide" / "template.html"
PRIVATE = ROOT / "private"


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    arrival, dates = argv[1], argv[2]
    names = argv[3] if len(argv) > 3 else ""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", arrival):
        print("arrival must be YYYY-MM-DD")
        return 2
    # A third argument, the names, is used only to print the share link. It is never written to disk.
    folder = PRIVATE / f"stay-guide-{arrival}-{secrets.token_hex(3)}"
    if folder.exists():
        print(f"refusing: {folder} exists")
        return 1
    html = TEMPLATE.read_text()
    html = html.replace("{{DATES}}", dates)
    html = html.replace("{{DESCRIPTION}}", f"Your days in the North Georgia mountains, {dates}.")
    folder.mkdir(parents=True)
    (folder / "index.html").write_text(html)
    left = len(re.findall(r"\{\{", html))
    url = f"https://loxleyforest.com/private/{folder.name}/"
    print(f"made  {folder.relative_to(ROOT)}/index.html")
    print(f"left  {left} blocks marked {{{{...}}}} to write, plus the EDIT comments")
    print(f"link  {url}#for={urllib.parse.quote(names or 'the two of you')}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
