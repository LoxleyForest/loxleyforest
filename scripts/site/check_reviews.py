#!/usr/bin/env python3
"""Every quote on the site is the guest's own words.

    python3 scripts/site/check_reviews.py [path/to/all.md]

1. The carousel: each quote in build_v2.REVIEW_LIST, split at " ... ", must be found verbatim
   in the review list (loxley-rescue docs/reviews/all.md), apostrophes included.
2. The reviews page: each entry in reviews_data.REVIEWS must be, paragraph for paragraph, the
   whole text of the review its id names in all.md, and that review must carry five stars.
   No entry may name a platform or repeat a carousel quote.
3. The quote card on /book (2026-10-26): build_v2.QUOTE_CARD's line must sit word for word inside
   one carousel quote, carry that quote's credit exactly, and be found verbatim in all.md; and
   book.html's <template id="gh-proof"> must say the 4.9, that line and that credit, and nothing else.
4. The search landing pages (2026-10-29): each page's quote in scripts/site/pseo/pages.json, split at
   " ... ", must be found word for word in the review its id names, a five-star review, credited to
   that reviewer. (scripts/site/pages/pseo.py also refuses a page whose quote fails.)
Exit 1 on any failure. Run it before every push that touches reviews.
"""
import ast
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT = os.path.join(HERE, "..", "..", "..", "loxley-rescue", "docs", "reviews", "all.md")
PLATFORM = re.compile(r"air\s*b\s*n\s*b|\bab&b\b|google|vrbo|hostfully|tripadvisor", re.I)


def block(src, name):
    at = src.index(name + " = [")
    ns = {}
    exec(src[at:src.index("\n]\n", at) + 2], ns)
    return ns[name]


def by_id(raw):
    """id -> (heading, [paragraphs]) for every "### <id>. ..." review in all.md."""
    out, cur = {}, None
    for line in raw.split("\n"):
        m = re.match(r"^### ([GA]\d+)\. (.+)$", line)
        if m:
            cur = m.group(1)
            out[cur] = (m.group(2), [])
        elif line.startswith("## "):
            cur = None
        elif cur:
            out[cur][1].append(line)
    return {k: (h, [re.sub(r"\s+", " ", p).strip() for p in "\n".join(b).split("\n\n") if p.strip()])
            for k, (h, b) in out.items()}


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    raw = open(path, encoding="utf-8").read()
    text = re.sub(r"\s+", " ", raw)
    bad = 0

    carousel = block(open(os.path.join(HERE, "build_v2.py"), encoding="utf-8").read(), "REVIEW_LIST")
    for quote, credit in carousel:
        for part in quote.split(" ... "):
            if part not in text:
                print("NOT VERBATIM (%s): %s" % (credit, part[:80]))
                bad += 1
    print("carousel: %d quotes checked, %d not verbatim" % (len(carousel), bad))

    page_bad = 0
    reviews = by_id(raw)
    page = block(open(os.path.join(HERE, "reviews_data.py"), encoding="utf-8").read(), "REVIEWS")
    seen = set()
    for rid, body, credit, month in page:
        problems = []
        if rid in seen:
            problems.append("listed twice")
        seen.add(rid)
        if rid not in reviews:
            problems.append("no such id in all.md")
        else:
            heading, paras = reviews[rid]
            if not re.search(r"\b5 stars\b", heading):
                problems.append("not a five-star review")
            mine = [re.sub(r"\s+", " ", p).strip() for p in body.split("\n\n")]
            if mine != paras:
                problems.append("text is not the review's whole text, verbatim")
            if not re.match(re.escape(credit.split(" · ")[0]) + "(, | · )", heading):
                problems.append("credit's name is not the reviewer's")
        for p in body.split("\n\n"):
            if re.sub(r"\s+", " ", p) not in text:
                problems.append("paragraph not found verbatim: " + p[:60])
        if PLATFORM.search(body + " " + credit + " " + month):
            problems.append("names a platform")
        if any(all(part in body for part in q.split(" ... ")) for q, _ in carousel):
            problems.append("already in the carousel")
        for pr in problems:
            print("REVIEWS PAGE %s (%s): %s" % (rid, credit, pr))
        page_bad += bool(problems)
    print("reviews page: %d reviews checked, %d failing" % (len(page), page_bad))

    card_bad = []
    src = open(os.path.join(HERE, "build_v2.py"), encoding="utf-8").read()
    found = [n.value for n in ast.parse(src).body
             if isinstance(n, ast.Assign) and any(getattr(t, "id", "") == "QUOTE_CARD" for t in n.targets)]
    if len(found) != 1:
        card_bad.append("QUOTE_CARD not found once in build_v2.py")
    else:
        line, credit = ast.literal_eval(found[0])
        if not any(line in part and credit == by for q, by in carousel for part in q.split(" ... ")):
            card_bad.append("not word for word inside a carousel quote with the credit %r" % credit)
        if line not in text:
            card_bad.append("not verbatim in all.md")
        if PLATFORM.search(line + " " + credit):
            card_bad.append("names a platform")
        page_html = open(os.path.join(HERE, "..", "..", "book.html"), encoding="utf-8").read()
        tpl = re.findall(r'<template id="gh-proof">(.*?)</template>', page_html, re.S)
        said = html.unescape(re.sub(r"<[^>]+>", "", tpl[0])) if len(tpl) == 1 else None
        if said != "4.9" + "“" + line + "”" + credit:
            card_bad.append("book.html's quote card says %r" % said)
    for pr in card_bad:
        print("QUOTE CARD: " + pr)
    print("quote card: 1 line checked, %d failing" % len(card_bad))

    land_bad = checked = 0
    data = os.path.join(HERE, "pseo", "pages.json")
    for p in (json.load(open(data, encoding="utf-8")) if os.path.exists(data) else []):
        q = p.get("quote")
        if not q:
            continue
        checked += 1
        problems = []
        if q.get("id") not in reviews:
            problems.append("no such id in all.md")
        else:
            heading, paras = reviews[q["id"]]
            if not re.search(r"\b5 stars\b", heading):
                problems.append("not a five-star review")
            for part in q.get("text", "").split(" ... "):
                if re.sub(r"\s+", " ", part) not in " ".join(paras):
                    problems.append("not found word for word in its review: " + part[:60])
            if not re.match(re.escape(q.get("credit", "").split(" · ")[0]) + "(, | · )", heading):
                problems.append("credit's name is not the reviewer's")
        if PLATFORM.search(q.get("text", "") + " " + q.get("credit", "")):
            problems.append("names a platform")
        for pr in problems:
            print("LANDING PAGE /%s (%s): %s" % (p.get("slug"), q.get("credit"), pr))
        land_bad += bool(problems)
    print("landing pages: %d quotes checked, %d failing" % (checked, land_bad))
    return 1 if bad or page_bad or card_bad or land_bad else 0


if __name__ == "__main__":
    sys.exit(main())
