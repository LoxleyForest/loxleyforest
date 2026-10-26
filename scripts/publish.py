#!/usr/bin/env python3
"""Copy the site, and only the site, into _site/ for Netlify to publish.

Found 2026-10-20: Netlify published the repository root, so NEXT-SESSION.md,
CLAUDE.md, README.md, the build spec and copy documents, and scripts/ were
public at loxleyforest.com. Working notes are not pages. This runs after
ensure_gtm.py and copies everything EXCEPT what is listed below; a page or an
asset added later is published without anyone remembering to list it.

    python3 scripts/publish.py            build _site/
    python3 scripts/publish.py --check    build, then fail if anything internal got in
"""

import fnmatch
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_site")

# Never published, at any depth.
NEVER = (".git", ".gitignore", "_site", "scripts", "__pycache__", "node_modules",
         "*.md", "*.docx", "*.pdf", "*.py", "netlify.toml", ".DS_Store",
         # local and tool folders: test renders (tmp/, ignored by git), Netlify's and
         # Claude's working folders, and any env file, should one ever sit in the tree
         "tmp", ".netlify", ".claude", ".github", ".vscode", ".env", ".env.*")


def ignore(folder, names):
    return [n for n in names if any(fnmatch.fnmatch(n, p) for p in NEVER)]


def build():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    shutil.copytree(ROOT, OUT, ignore=ignore)


def leaks():
    out = []
    for folder, dirs, files in os.walk(OUT):
        for n in dirs + files:
            if any(fnmatch.fnmatch(n, p) for p in NEVER):
                out.append(os.path.relpath(os.path.join(folder, n), OUT))
    return out


if __name__ == "__main__":
    build()
    found = leaks()
    if "--check" in sys.argv[1:] or found:
        for f in found:
            print("internal file in _site: %s" % f)
        print("publish: %d internal files" % len(found))
    sys.exit(1 if found else 0)
