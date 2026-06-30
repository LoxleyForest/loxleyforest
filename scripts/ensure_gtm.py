#!/usr/bin/env python3
"""ensure_gtm.py — single source of truth for the Google Tag Manager snippet.

Netlify runs this at build time (see netlify.toml), so even if a future content
edit strips GTM from a page's source, the DEPLOYED site still has it. The
snippet is defined ONCE here instead of being hand-pasted into 15 HTML files.

Usage:
    python3 scripts/ensure_gtm.py          insert where missing (idempotent, never duplicates)
    python3 scripts/ensure_gtm.py --check  report only; exit 1 if any page is missing GTM

This is a static, no-framework site, so we edit the *.html files at the repo
root directly.
"""
import glob
import os
import re
import sys

GTM_ID = "GTM-5N4BX66K"

HEAD = (
    '  <!-- Google Tag Manager -->\n'
    "  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n"
    "  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n"
    "  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n"
    "  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n"
    "  })(window,document,'script','dataLayer','" + GTM_ID + "');</script>\n"
    '  <!-- End Google Tag Manager -->\n'
)

BODY = (
    '<!-- Google Tag Manager (noscript) -->\n'
    '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=' + GTM_ID + '"\n'
    'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n'
    '<!-- End Google Tag Manager (noscript) -->\n'
)

# Insert the head loader as high as possible: right after the viewport meta
# (keeps <meta charset> first per spec). Fall back to right after <head>.
VIEWPORT = re.compile(r'(\n[ \t]*<meta name="viewport"[^>]*>\n)', re.I)
HEAD_OPEN = re.compile(r'(<head[^>]*>\n)', re.I)
BODY_OPEN = re.compile(r'(<body[^>]*>\n)', re.I)


def main():
    check_only = "--check" in sys.argv[1:]
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(root, "*.html")))

    ok, fixed, missing = [], [], []

    for name in files:
        full = os.path.join(root, name)
        with open(full, encoding="utf-8") as fh:
            src = fh.read()

        has_head = "gtm.js?id=" in src
        has_body = ("ns.html?id=" + GTM_ID) in src

        if has_head and has_body:
            ok.append(name)
            continue

        missing.append(name)
        if check_only:
            continue

        out = src
        if not has_head:
            if VIEWPORT.search(out):
                out = VIEWPORT.sub(lambda m: m.group(1) + HEAD, out, count=1)
            elif HEAD_OPEN.search(out):
                out = HEAD_OPEN.sub(lambda m: m.group(1) + HEAD, out, count=1)
            else:
                sys.stderr.write("  ! %s: no <head>; skipped head snippet\n" % name)
        if not has_body:
            if BODY_OPEN.search(out):
                out = BODY_OPEN.sub(lambda m: m.group(1) + BODY, out, count=1)
            else:
                sys.stderr.write("  ! %s: no <body>; skipped noscript\n" % name)

        if out != src:
            with open(full, "w", encoding="utf-8") as fh:
                fh.write(out)
            fixed.append(name)

    print("ensure-gtm: %d HTML files scanned for %s" % (len(files), GTM_ID))
    print("  already correct: %d" % len(ok))
    if fixed:
        print("  injected GTM into: %s" % ", ".join(fixed))

    if check_only and missing:
        sys.stderr.write("  MISSING GTM on: %s\n" % ", ".join(missing))
        sys.exit(1)
    print("  all pages have GTM ✓")


if __name__ == "__main__":
    main()
