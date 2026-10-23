#!/usr/bin/env python3
"""Every carousel quote is the guest's own words.

    python3 scripts/site/check_reviews.py [path/to/all.md]

Each quote in build_v2.REVIEW_LIST, split at " ... ", must be found verbatim
in the review list (loxley-rescue docs/reviews/all.md), apostrophes included.
Exit 1 on any quote that is not. Run it before every push that touches reviews.
"""
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT = os.path.join(HERE, "..", "..", "..", "loxley-rescue", "docs", "reviews", "all.md")


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    text = re.sub(r"\s+", " ", open(path, encoding="utf-8").read())
    spec = importlib.util.spec_from_file_location("build_v2", os.path.join(HERE, "build_v2.py"))
    src = open(os.path.join(HERE, "build_v2.py"), encoding="utf-8").read()
    block = src[src.index("REVIEW_LIST = ["):src.index("\n]\n", src.index("REVIEW_LIST = [")) + 2]
    ns = {}
    exec(block, ns)
    bad = 0
    for quote, credit in ns["REVIEW_LIST"]:
        for part in quote.split(" ... "):
            if part not in text:
                print("NOT VERBATIM (%s): %s" % (credit, part[:80]))
                bad += 1
    print("%d quotes checked, %d not verbatim" % (len(ns["REVIEW_LIST"]), bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
