#!/usr/bin/env python3
"""Every inquiry form lands where Google Ads counts it.

    python3 scripts/site/check_forms.py [root]

Google Ads' "Form Inquiry (success)" fires on a page view of /success
(loxley-rescue docs/site-tags.md). So every Netlify form on a public page must
post to /success or /success.html. On 2026-10-23 the elopement and FAQ forms
posted back to their own pages and the ads paid for inquiries Google could not
count. Runs in the Netlify build before publish: a failing form fails the
deploy. Exit 1 names each form that would not count.

Every such form also carries the ad click (2026-11-02, loxley-rescue
GATEHOUSE-SPEC 22): a hidden field named gclid, so an inquiry keeps the click
that brought it and a stay booked from it can be traced to the ad. A form
without one fails the deploy too.
"""
import os
import re
import sys

OK = {"/success", "/success.html"}
# Forms that are not inquiries and have their own page by design: none today.
EXEMPT = set()


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..")
    bad = checked = 0
    for name in sorted(os.listdir(root)):
        if not name.endswith(".html"):
            continue
        html = open(os.path.join(root, name), encoding="utf-8").read()
        for whole in re.findall(r"<form\b.*?</form>", html, re.I | re.S):
            tag = whole[:whole.index(">") + 1]
            if not re.search(r"data-netlify|netlify-honeypot|\bnetlify\b", tag, re.I):
                continue
            form = (re.search(r'name=["\']([^"\']+)', tag) or [None, "?"])[1]
            if form in EXEMPT:
                continue
            checked += 1
            action = (re.search(r'action=["\']([^"\']*)', tag, re.I) or [None, ""])[1]
            if action.split("?")[0].split("#")[0] not in OK:
                print("FORM WILL NOT COUNT: %s form %r posts to %r, not /success" % (name, form, action))
                bad += 1
            if not re.search(r"<input\b[^>]*\bname=[\"']gclid[\"']", whole, re.I):
                print("FORM DROPS THE AD CLICK: %s form %r has no hidden gclid field" % (name, form))
                bad += 1
    print("check_forms: %d inquiry forms checked, %d would not count or carry the ad click" % (checked, bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
