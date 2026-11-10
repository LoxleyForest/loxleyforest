#!/usr/bin/env python3
"""Every inquiry form lands where Google Ads counts it, and nothing else lands there.

    python3 scripts/site/check_forms.py [root]

Google Ads' "Form Inquiry (success)" fires on a page view whose path holds /success
(loxley-rescue docs/site-tags.md: the trigger matches by "contains", 2026-08-25). So
every Netlify form on a public page must post to /success or /success.html. On
2026-10-23 the elopement and FAQ forms posted back to their own pages and the ads paid
for inquiries Google could not count. Runs in the Netlify build before publish: a
failing form fails the deploy. Exit 1 names each form that would not count.

The elopement form has its own door since 2026-11-04 (the Marketer's elopements memo,
item 3, routed by the Chief): /success-elopement, so its inquiries can count on their
own action, "Elopement Inquiry", once Mick's clicks make it (docs/elopement-conversion.md).
OWN holds the form there. The path holds /success on purpose: until his clicks, the old
action keeps counting elopement inquiries.

A form that is not an inquiry (the giveaway form, coming) must land on no path holding
/success, or Google would count an entry as an inquiry: NOT_INQUIRY keeps it off, and it
needs no ad click.

Every inquiry form also carries the ad click (2026-11-02, loxley-rescue
GATEHOUSE-SPEC 22): a hidden field named gclid, so an inquiry keeps the click
that brought it and a stay booked from it can be traced to the ad. A form
without one fails the deploy too.
"""
import os
import re
import sys

OK = {"/success", "/success.html"}
# A form with a door of its own: the paths it must post to, and no other.
OWN = {"elopement-inquiry": {"/success-elopement", "/success-elopement.html"}}
# Forms that are not inquiries, by name or the start of one: never on a path holding /success.
# anniversary-letter (2026-11-10): a guest's letter to their future selves, on a private page, posted
# in place and never to any path; named here for the record (this check reads the root pages only).
NOT_INQUIRY = ("giveaway", "anniversary-letter")
# Forms that are not inquiries and have their own page by design: none today.
EXEMPT = set()


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..")
    bad = checked = kept_off = 0
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
            action = (re.search(r'action=["\']([^"\']*)', tag, re.I) or [None, ""])[1]
            path = action.split("?")[0].split("#")[0]
            if form.startswith(NOT_INQUIRY):
                kept_off += 1
                if "/success" in path:
                    print("FORM IS NOT AN INQUIRY: %s form %r posts to %r, where Google counts an inquiry" % (name, form, action))
                    bad += 1
                continue
            checked += 1
            want = OWN.get(form, OK)
            if path not in want:
                print("FORM WILL NOT COUNT: %s form %r posts to %r, not %s" % (name, form, action, " or ".join(sorted(want))))
                bad += 1
            if not re.search(r"<input\b[^>]*\bname=[\"']gclid[\"']", whole, re.I):
                print("FORM DROPS THE AD CLICK: %s form %r has no hidden gclid field" % (name, form))
                bad += 1
    print("check_forms: %d inquiry forms checked, %d would not count or carry the ad click; %d other forms kept off /success"
          % (checked, bad, kept_off))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
