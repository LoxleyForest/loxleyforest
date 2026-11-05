# CURRENT STATE · 2026-11-05 (at most 40 lines here, kept by the Janitor; the history by month is in docs/log/)

**In force**
- Live since 2026-10-19 (merge a246479): the V2 design on every page, /book our own checkout on book.loxleyforest.com, no Hostfully anywhere (Mick's ruling). The look is DIRECTION.md (docs/log/2026-10.md, the 2026-10-19 night block and 2026-10-13).
- Every page is a module in scripts/site/pages/, built by `python3 scripts/site/build_v2.py`: edit the builder, run it, commit the HTML, never hand-edit a built page (docs/log/2026-10.md, 2026-10-13, "Where things are").
- A push to main is the live site. Netlify runs ensure_gtm.py, scripts/site/check_forms.py, then scripts/publish.py: only the site reaches _site/, never *.md, scripts/ or netlify.toml. Before a push: `python3 scripts/ensure_gtm.py --check` and the check_*.js and check_*.py in scripts/site/.
- Every Netlify form carries the ad click's hidden fields and check_forms.py fails a deploy without them; the privacy page says so in Mick's words (the 2026-11-02 block below).
- Words a guest sees go to Mick's ear first. The elopement offer page is approved by hash (APPROVED_SHA256 in scripts/site/pages/offer.py); a changed word closes the page until he approves again (docs/log/2026-10.md, 2026-10-27).
- Private pages: private/<slug>-<random>/, noindex, no GTM, the guest's name only after the # in the link (docs/log/2026-09.md, "Private guest pages"). private/always-tea-time-4f9c21 is a guest's invitation: never link it, never delete it without asking.
- The Golden Arrow (gift cards): /gift, /gift/card, /gift/thanks, /gift/manage; gift_purchase counts only on the engine's paid answer (docs/log/2026-10.md, 2026-10-29).
- Search landing pages from scripts/site/pseo: five live from heard words, seven held until Mick hears their lines (merge 681a1ad).

**Waits on Mick**
- The Google Ads label for "Gift - Golden Arrow": it goes in GIFT_LABEL in scripts/site/check_conversions.js (docs/log/2026-10.md, 2026-10-29).
- your-adventure.html, the arrival questionnaire: a draft, noindex, linked from nowhere; its copy and its last line need his yes, and the link rides only in the booking confirmation (docs/log/2026-09.md).
- Open since 2026-10-19, the pages keep what they say: the Experiences add-ons still offered, s'mores included or an add-on, The Letter, "Most popular" on The Crossing, 2 to 20 ceremony guests against a stay of 6, the Woodland Yurt line, "treehouses" in the home title, Klarna in Stripe, the bell line for disputes (docs/log/2026-10.md, both 2026-10-19 blocks).
- Hostfully's 30-day rollback from 2026-10-19: when it is cancelled, redirect /booking-confirmed and /booking-confirmed.html to /book in netlify.toml and retire booking-confirmed.html (docs/log/2026-10.md, 2026-10-19 night).

- Before the Bridge for the December 15 to 17 stay (The Vow, ceremony Wednesday the 16th): made on branch `before-the-bridge-2026-12-15`, not on main, until his ear has had the template's new lines and his word on the flags (the 2026-11-05 block below). Nothing of the couple is on the page; their names ride only after the # in the link.

**For the seat to rule, next session (the Chief's flags of 2026-11-04; nothing new goes live Nov 13 to about Nov 27 while Mick is away)**
- CLAUDE.md still says "no build system" though scripts/site/build_v2.py builds the pages; README.md is GitHub boilerplate. Fix both, and point CLAUDE.md's session-open line at this block and docs/log/.
- private/new-site-371cf1/ (26 MB, the preview and its reels) was to be deleted at launch and is still on main; Mick shared its links with Livy, so his yes before it goes.
- Branches not on main, kept and untouched: answers (1 commit, 113 behind: two answer pages for AI assistants, a romantic getaway near Atlanta and where to propose; the pseo pages on main cover the same two subjects) and proposals (3 commits, 129 behind: the proposals page with Mick's photos, 2026-10-21 to 22).
- Ideas logged, not started: the animated guidebook with the pizza guide as a chapter, seasonal reels and profile pictures, the interior clips still on Mick's laptop (docs/log/2026-10.md, 2026-10-13 and 2026-10-19).

The Janitor (chief docs/v2/janitor.md) runs here weekly: this file keeps this block and the current month's entries; older blocks move word for word to docs/log/<YYYY-MM>.md.

---

# IN FLIGHT · 2026-11-05 · Before the Bridge and the recap for the December 15 to 17 stay (branch before-the-bridge-2026-12-15)

The Chief's route (chief docs/log.md, 15:50): the first elopement (The Vow, signed and paid in
September; ceremony Wednesday Dec 16) needs its own questionnaire with Mick's recap tonight; the page
he had in hand was the Dec 11 to 13 couple's. Then Mick, by voice in the seat's session, passed the
seat the torch on the page and the recap email with his call notes of Oct 26 (dates and amounts only
here; nothing of the couple in the repo). His word: the brunch yes; the drone his gift, free; the
cake locked (caramel, cream cheese buttercream); pizza night locked (dough and toppings for two named
pizzas on arrival); the ceremony spot still theirs to lock, the middle of the bridge or the bridge as
the aisle to the Sky Deck; a bold marriage-license reminder; hair and makeup a recommendation only.
The page, made in the branch's worktree by
  python3 scripts/before-the-bridge/new.py --check-in 2026-12-15 --check-out 2026-12-17 \
    --ceremony 2026-12-16 --package the-vow --site deck --bridge-open --alcohol \
    --house-photographs --waterfall --morning-after
into private/before-the-bridge-2026-12-15-to-17-7df87e/ (d9c09bf, pushed; not on main): 4 print
pages, 20 questions, the laurel grove row held; no --cake and no --pizza-night because both are
chosen, so their questions would be moot. The waterfall row on Mick's own Sep 11 promise of shots
"down at the waterfall"; the row claims nothing about the water. Template change on the branch, the
Critic's words: deck with the bridge open now reads "Your vows are out on the rope bridge or on the
Sky Deck at its end, and the choice is yours until the week of" (the deck alone read as fixed beside
a letter offering the middle of the bridge). Mick's own "If your friends described the two of you as
a couple" question was tried and taken out: a sixth question on sheet one spills to a fifth print
page on every shape (two failed checks, then stop). Proven: check.js 10 shapes, 7 refusals, 0 failed;
the page at 390 px with made-up names in the link, no sideways scroll, no outside request, 4 Letter
pages. Private artifact for his eye: https://claude.ai/artifact/PyVDS4c1DM5zmtdaMdo8A3.
The recap email: the Writer's draft in Mick's shape, the Scout's rows (the county rule and the
court's phone primary from gaprobate.gov; the court's address, hours and fee secondary, so the email
says call ahead; December flowers from UGA Extension: camellias, magnolia, cedar, boxwood; Make Me Up's
own $100 fee inside 30 days), the Critic last. The Critic's weakest claim: the drone, against
agreement line 51 (drones not permitted anywhere on the property, signed by them) and the camera
(The Vow's ceremony photographs; who shoots stills while he flies); its fix is to drop the drone
from tonight's letter or name the exception out loud. Put to Mick in the Critic's words. Also to his
word: the page's "ready from 3:00 pm" against their signed agreement's 4:00 p.m. check-in. The
Chief holds the Gmail draft; on Mick's yes the seat merges the branch, pushes, and sends the Chief
the full text with the link (#for=Her%20and%20Him); the Chief places it and "send" is Mick's. They
said no to the marketing release (loxley-rescue docs/log/2026-09.md, 2026-09-15): nothing from their
stay in any marketing, the drone footage included.

---

# DONE · 2026-11-05 · Elopement Inquiry counts on its own label (merge 359c303)

The Chief, in Mick's Chrome on his word: the Google Ads action "Elopement Inquiry" by 08:23 ET on the
box's clock (the Chief's clock ran ahead that morning and read 08:50; the box's commit times bound it)
(docs/elopement-conversion.md step 1: Submit lead form, count One, click-through 90 days, data-driven
attribution, ID 18110631502, label 6ibiCPrZ1LIdEM6c6btD; Google's flow no longer offers "don't use a
value", so it carries "same value for each conversion" at the default $1 where Form Inquiry carries
none, which matters only if a campaign ever bids for value), then Tag Manager GTM-5N4BX66K version 8
"Elopement Inquiry conversion" at 08:26 ET by the Tag Manager page's own time (the Chief first reported
09:26 from the clock that ran ahead; the merge commit's message carries that figure), three changes in
one version: the tag "Ads - Elopement
Inquiry Conversion", its trigger "PV - Elopement Inquiry Success" (Page Path contains
/success-elopement), and the trigger "PV — /success" now also Page Path does not contain
/success-elopement. The seat prepared the switch on branch elopement-label (ELOPEMENT_LABEL in
scripts/site/check_conversions.js and the doc's rows) while the publish waited, proved on the live
site that the branch's check failed in exactly the two lines the publish flips while main's passed,
and merged on the Chief's word. node scripts/site/check_conversions.js on the live site after the
merge, nothing sent:
  fires   Form Inquiry (success) on /success
  fires   Elopement Inquiry (success-elopement) on /success-elopement
  fires   Widget Inquiry on /booking-confirmed
  fires   Booking - direct on /booked
  pushes  gift_purchase on /gift/thanks {value: 2000, currency: USD, transaction_id: lf-…, item: golden-arrow}
  awaiting Mick's label: Gift - Golden Arrow on /gift/thanks
Exit 0, no WRONG line. Before the merge, main's check with the blank label already read MISSING Form
Inquiry on /success-elopement: version 8's exclusion was live. Step 6 closed by 08:30 ET on the box's
clock (the Chief's clock read 09:35), read only: the
Search - Elopements campaign's goals read "Account-default: Purchases, Submit lead forms", so the new
action counts for it, no change made (the Chief). Open only on the Forge's side: step 8, CONFIRM_PATHS
in loxley-rescue gatehouse/funnel.py (SITE_PATHS already carries the path) and the site-tags.md row,
both routed to the workshop Forge by the Chief. Branch elopement-label is merged and can go.

---

# DONE · 2026-11-04 · the elopement form's fixes and its own door (the Chief's routing of the Marketer's item 3)

On /elopements and the three elopement landing pages (one Netlify form, elopement-inquiry): guest
count "Just us" or "2 to 6 guests" (the cards say up to six; 7 to 20 gone), the date hint "e.g. May
2027 or 5/12/2027", "Romantic Atlanta" under How did you hear, and the form lands on its own page,
/success-elopement (pages/confirmations.py: /success's words unchanged, the bridge from above;
noindex, not in the sitemap). Its path holds "/success" on purpose: Form Inquiry's trigger matches by
"contains", so elopement inquiries keep counting under it until Mick's clicks make "Elopement
Inquiry" and scope the old trigger (docs/elopement-conversion.md, one list). check_forms.py holds the
form there (OWN) and keeps the coming giveaway form off any /success path (NOT_INQUIRY);
check_conversions.js wants Form Inquiry on the new page today and, once ELOPEMENT_LABEL is set, the
new label there and Form Inquiry not. Proven on a local render with the live container (a clean-URL
server in the session scratchpad; python3 -m http.server has no clean URLs, so every row reads
MISSING under it): every row fires, nothing sent. The Forge's side, flagged to the Chief:
/success-elopement into loxley-rescue gatehouse/funnel.py CONFIRM_PATHS and gatehouse/sources.py
SITE_PATHS (exact matches today).

---

# DONE · 2026-11-04 · the Janitor's first run (the Chief's routing)

28 clean, fully merged worktrees removed (11 beside this folder, 17 under /tmp) and their 35 branches
deleted, each tagged archive/<branch>-2026-11-04 first and the tags pushed (git tag -l 'archive/*').
Kept: the worktrees loxleyforest-answers and loxleyforest-proposals (unmerged, above). The old
NEXT-SESSION blocks (496 lines, 2026-09-26 to 2026-10-29) moved word for word to docs/log/2026-09.md
and docs/log/2026-10.md; nothing in docs/ is published (scripts/publish.py). Merged remote branches
left on GitHub for the seat's call: origin/cutover, flywheel, launch, next-level, more-reviews,
reviews-final, gatehouse, site-offers, site-story, publish-only-the-site, ceo/priced-cards,
forge/arrow-2000, forge/elopement-offer, forge/gift-window; and forge/form-clicks, whose one commit
is on main as 6b7b75c.

---

# IN FLIGHT · 2026-11-02 · the ad click on every inquiry form (branch forge/form-clicks)

Every Netlify form now carries hidden gclid, gbraid, wbraid, utm_source, utm_campaign and
landing_page (build_v2.ATTR_FIELDS, data-lf-attr). js/global.js fills them from the first ad click
it kept (loxley_attribution, 90 days). your-adventure.html loads no global.js, so it has its own
four-line filler. /book's form keeps its own older fields (pages/book.py). check_forms.py now
fails the deploy if any Netlify form has no gclid field. On the live pages before this branch,
8 of 11 forms failed it, including all four elopement forms. The engine reads them with
loxley-rescue `python3 -m gatehouse.clicks` (GATEHOUSE-SPEC 22): counts only, nothing stored. The
privacy page says so in Mick's words (his yes, 2026-11-02), shipped in the same push.

