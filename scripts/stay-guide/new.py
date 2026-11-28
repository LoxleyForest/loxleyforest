#!/usr/bin/env python3
"""Start a new stay guide from the template.

    python3 scripts/stay-guide/new.py 2026-11-14 2026-11-16 "November 14 to 16, 2026"

Makes private/stay-guide-2026-11-14-<random>/index.html with the dates stamped (the words, and
the two machine-readable metas, loxley-check-in and loxley-check-out, that the engine's guide
check reads), adds the guide's row to scripts/stay-guide/guides.json (check-in, check-out, path;
never a name), and leaves every {{...}} block for the session to write. Prints the path and the
share link. Refuses to overwrite. Standard library only.

Guest names never go in the file. They ride in the link after the #:
    https://loxleyforest.com/private/stay-guide-2026-11-14-abc123/#for=Jon%20and%20his%20bride
"""
import json
import pathlib
import re
import secrets
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "scripts" / "stay-guide" / "template.html"
REGISTRY = ROOT / "scripts" / "stay-guide" / "guides.json"
PRIVATE = ROOT / "private"
DATE = r"\d{4}-\d{2}-\d{2}"


def register(check_in, check_out, path):
    """Add the guide's row to guides.json, kept in check-in order; the file is never published."""
    rows = json.loads(REGISTRY.read_text()) if REGISTRY.exists() else []
    rows = [r for r in rows if r.get("path") != path]
    rows.append({"check_in": check_in, "check_out": check_out, "path": path})
    rows.sort(key=lambda r: (r["check_in"], r["path"]))
    REGISTRY.write_text(json.dumps(rows, indent=1) + "\n")


def main(argv):
    if len(argv) < 4:
        print(__doc__)
        return 2
    arrival, departure, dates = argv[1], argv[2], argv[3]
    names = argv[4] if len(argv) > 4 else ""
    if not re.fullmatch(DATE, arrival) or not re.fullmatch(DATE, departure) or departure <= arrival:
        print("arrival and check-out must be YYYY-MM-DD, the check-out after the arrival")
        return 2
    # A fourth argument, the names, is used only to print the share link. It is never written to disk.
    folder = PRIVATE / f"stay-guide-{arrival}-{secrets.token_hex(3)}"
    if folder.exists():
        print(f"refusing: {folder} exists")
        return 1
    html = TEMPLATE.read_text()
    html = html.replace("{{DATES}}", dates)
    html = html.replace("{{DESCRIPTION}}", f"Your days in the North Georgia mountains, {dates}.")
    html = html.replace("{{CHECK_IN}}", arrival).replace("{{CHECK_OUT}}", departure)
    folder.mkdir(parents=True)
    (folder / "index.html").write_text(html)
    path = f"/private/{folder.name}/"
    register(arrival, departure, path)
    left = len(re.findall(r"\{\{", html))
    url = f"https://loxleyforest.com{path}"
    print(f"made  {folder.relative_to(ROOT)}/index.html")
    print(f"row   {arrival} to {departure} {path} in {REGISTRY.relative_to(ROOT)}")
    print(f"left  {left} blocks marked {{{{...}}}} to write, plus the EDIT comments")
    print(f"link  {url}#for={urllib.parse.quote(names or 'the two of you')}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
