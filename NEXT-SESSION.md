# CURRENT STATE · 2026-11-06 (at most 40 lines here, kept by the Janitor; the history by month is in docs/log/)

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

- The December 15 to 17 couple's Before the Bridge page says "ready from 3:00 pm" (his standing ruling) while their signed agreement says 4:00 p.m.; his word if he wants the page changed. Their recap went 2026-11-05 at about 17:40 ET from his Gmail (the blocks below); their answers come back to him by reply or as a photo of the pages, and nothing of them belongs in this repo. Their page is live at /private/before-the-bridge-2026-12-15-to-17-7df87e/; it says "ready from 3:00 pm" while their signed agreement says 4:00 p.m., for his word.

- The January giveaway's words (scripts/site/pages/giveaway.py WORDS, the card's and /book's line among them): his yes by hash, the sponsor's mailing address into ADDRESS, then the day and hour he says "live" into OPENS, only after the engine's giveaway_open is on; then LIVE in js/giveaway-popup.js flips to true in the same push and the seat links the page. Open with the yes: the holds (the engine holds nothing until he rules; the page says the winner chooses from the weekends still open), the value ($1,565 by the Marketer's Nov 7 quote; the accountant confirms), champagne 21 or older on the page or 21 to enter (the table's lean, since the card meets paid traffic), which address he writes to the winner from, the pull switch's standing term in chief docs/terms.md by Nov 11 (the two 2026-11-07 blocks below).

**For the seat to rule, next session (the Chief's flags of 2026-11-04; nothing new goes live Nov 13 to about Nov 27 while Mick is away)**
- CLAUDE.md still says "no build system" though scripts/site/build_v2.py builds the pages; README.md is GitHub boilerplate. Fix both, and point CLAUDE.md's session-open line at this block and docs/log/.
- private/new-site-371cf1/ (26 MB, the preview and its reels) was to be deleted at launch and is still on main; Mick shared its links with Livy, so his yes before it goes.
- Branches not on main, kept and untouched: answers (1 commit, 113 behind: two answer pages for AI assistants, a romantic getaway near Atlanta and where to propose; the pseo pages on main cover the same two subjects) and proposals (3 commits, 129 behind: the proposals page with Mick's photos, 2026-10-21 to 22).
- Ideas logged, not started: the animated guidebook with the pizza guide as a chapter, seasonal reels and profile pictures, the interior clips still on Mick's laptop (docs/log/2026-10.md, 2026-10-13 and 2026-10-19).

The Janitor (chief docs/v2/janitor.md) runs here weekly: this file keeps this block and the current month's entries; older blocks move word for word to docs/log/<YYYY-MM>.md.

---

# DONE · 2026-11-07 · The home page's phone weight, for the reel's burst (the Chief's bandwidth route)

Why: Netlify bandwidth costs credits (about 150 GB a month on the plan; at zero the site pauses;
chief docs/v2/scout-netlify-limits-2026-11-07.md), and the reel could send 25,000 to 50,000 phone
visits in a week while Mick is away. Measured on the live site, a 3x phone, our origin's bytes as
Netlify serves them: the home page 2,511 KB on load and 4,161 KB after a full scroll, of which
hero-phone.mp4 2,213 KB and the below-the-fold photos at 1600 (a 3x phone at 100vw asks for the
1600); /giveaway about 60 KB cold; /giveaway-entered 92 KB. Outside hosts (Tag Manager 309 KB,
Facebook 220 KB, Google Fonts 110 KB) are not Netlify's bytes. Done, nothing new on any page: (1)
the hero films re-encoded in place with ffmpeg (~/bin, 7.0.2 static), same names, same loop:
hero-phone.mp4 720x1280 30 fps 2,264 KB to 540x960 24 fps crf 31, 659 KB; hero-desk.mp4 1080p
3,994 KB to 720p crf 28, 1,300 KB; hero-desk.webm dropped (a vp9 re-encode came out larger than
the new mp4), so every desktop takes the one mp4. (2) build_v2.pic(): where a 1600 exists the image
is wrapped in <picture> with a phone source of the 800, so a 3x phone takes 800 across 390 px; and
where the page crops the photo into a 4:5 frame (.lf-photo--tall, .lf-chapter on the home and
treehouse pages) the phone source is a centred 684x855 crop of the 1600 (images/v2/<name>-p684x855,
made by the builder), since an 800 in that frame is only 1.25 photo pixels to a screen point and
went soft (the Critic). The home page's nine photos below the fold on a 3x phone: about 850 KB
where they were 1,858. (3) js/global.js, THE DIRECTION APPLIED, not a new ruling: DIRECTION.md
(Video) and the Forge's tier rule say a phone gets the poster alone until the connection is known
to be fast; the code had treated an unknown connection as fast, so every iPhone got the film. Now
only a phone that reports 4g gets the film; an iPhone reports nothing and keeps the poster. Mick
once took a still on his iPhone for a fault (docs/log/2026-10.md:363): it is the direction, and it
is what keeps the reel's week inside the plan's credits. The Critic's arithmetic, at 50,000 visits
credits roughly equal the KB a visit: before, about 2,500 credits on landings alone, 4,100 on full
scrolls, against the plan's 3,000; after, about 300 on a landing and about 940 on a full scroll. The
Critic read before merge; its fixes are in. The live after-number is measured after the push and
written below.

---

# IN FLIGHT · 2026-11-07 · The giveaway's invitation in shadow: js/giveaway-popup.js behind LIVE=false

The Chief's route (09:30 ET) from the table (chief docs/briefs/2026-11-07-table-giveaway-popup.md,
the Critic's fixes whole): the card that points a visitor to /giveaway, built in shadow by Tue Nov
10. THE SWITCH: `var LIVE = false;` in js/giveaway-popup.js, one line; true removes nothing but
shows the card, the folded line and /book's quiet line; false removes all three in one push and
changes nothing else; the rules page and the form never move. On top of it the builder writes the
form's state into each page's words block (open: ready(); closes: the Dec 13 close), so even with
LIVE true nothing shows before Mick's yes, the address and the day, nor after the close by the
visitor's clock. THE PAGES (build_v2 POPUP_PAGES): /, /treehouses, /experiences, /gallery,
/our-story, /local-guide, /faq; the script also loads on /book, where it only reveals the quiet line
under the hero (pages/book.py, hidden in the file with no href until revealed, so check_giveaway's
shadow rule holds), and on /giveaway-entered, where it only remembers the entry. Never /elopements,
/proposals, the landing pages, /gift, checkout, manage, the confirmations or /giveaway. WHEN: on a
phone a bottom sheet 1.5 s into the second page of the visit, never full screen (70% of the screen
at most), never on first landing; on a desktop only when the pointer leaves the top 10 px after 5 s
(talk.js's own trigger; no talk.js page is in the list). Once per visitor (localStorage lf_giveaway),
never after an entry (the mark set on /giveaway-entered), one visitor in three a holdout decided once
and kept, counted at its first exposure like the card. Dismissed, it folds to one line under the
header for the rest of the visit. THE STEPS, agreed with the Forge (its engine commit to come):
popup_shown, popup_close, popup_click, popup_held_out, once each a visit, through window.lfFunnel as
the card's steps go, body visit, step, path, src, referrer. THE ROUTE: the button and the lines carry
?src=giveaway-ads when the visit's first page carried gclid, gbraid, wbraid or utm_source=google (or
gh_entry.src is google-ads), else giveaway-site. THE WORDS are in giveaway.py WORDS (popup_h, popup_p,
popup_button, popup_close, popup_fold, popup_fold_link, book_line, book_link, entered_link), in Mick's
one hash, written into the pages as JSON (#lf-gw-words); the script holds none. The entered page
links the open nights (/book?src=giveaway-site) in place of the treehouse. PROVEN: scripts/site/
check_popup.js, 70 checks in a real browser in both switch states (shipped: nothing anywhere; live:
every rule above, the ad route, the holdout and its step, the clock, the entry mark); check_giveaway,
check_forms, ensure_gtm, publish, check_pseo; check_talk on /book. The Critic's read before merge,
taken: the holdout counted once per visitor (else held-out visits outnumber shown ones and the pull
trigger misreads); the sheet above the Book button (z-index 930, under the menu and header); the
open-and-close gate. Still Mick's: the yes by hash, the address, the day and hour, the pull switch's
standing term by Nov 11, and 21 to enter or not.

---

# IN FLIGHT · 2026-11-07 · The January giveaway in shadow: /giveaway and /giveaway-entered (025de64)

The Chief's route (08:20 ET) on Mick's "we just do our own" after Romantic Atlanta declined: the
engine's half (register, draw, held weekends) is the workshop Forge's, branch forge/giveaway; the
page and the form are the seat's, in shadow by Wed Nov 11. Built in scripts/site/pages/giveaway.py:
the rules (the table of 2026-11-03, chief docs/briefs/2026-11-03-table-january-giveaway.md; Counsel's
list at its line 93; the Critic's fix; Counsel's memo of 2026-10-27 line 71) and the entry form, a
Netlify form named giveaway with the Forge's fields exactly (first_name, email, eligible checkbox
yes required, letters checkbox yes unticked and not required, src hidden from ?src= as a token
[a-z0-9_-]{1,40} else "direct", the honeypot), landing on /giveaway-entered.html, never /success
(check_forms NOT_INQUIRY). Every visitor-facing sentence is in WORDS; APPROVED_SHA256 None, so the
form is in the file (Netlify registers it) but hidden and disabled with the closed line in its
place; the page is noindex, in no nav and not in sitemap.xml; the rules read at the URL for Mick's
eye. scripts/site/check_giveaway.py holds the form to the contract and the pages to shadow
(fails if /giveaway is linked while the form is closed). The page's own clock closes the form after
Sun Dec 13 11:59:59 PM ET; the engine refuses late entries too. The Critic's read, taken: no hold
stated that the engine is not making (the engine holds nothing until Mick rules; the Marketer's
Nov 7 move keeps the weekends on sale), so "the winner chooses from those still open when they claim
the prize"; the value $1,565 (the Marketer's live quote: $1,300.02 all in plus the Dawn Table's
$265), not the table's $1,749; "we publish the seed, the number of entries and the winning number"
without "anyone can check it" (the seed is typed after the close and no entrant knows their number;
a seed hash posted before entries open would make it checkable, the Forge's call); the winner hears
"from an @loxleyforest.com address" since Mick writes from his own mail; "Champagne is for guests
21 or older" (Georgia's alcohol rules unread by Counsel; the entry age is 18); the entered page's
lead "We have your entry. One counts per email address." Then, the Chief's line by way of the Forge
(9951c70): the draw's seed named before entries open, the NIST Randomness Beacon's pulse at 12:00 PM
Eastern on Dec 14, the winning number "that pulse divided by the number of entries, remainder plus
one" [MICK RATIFIES the beacon; the Forge's draw matches the rule, told], and the register's rules
in plain words (Gmail dots and plus-tags are one address; spam-flagged entries checked by hand; late
entries not counted). Netlify rewrites the <form> tag at deploy (attributes reordered, data-netlify
and the honeypot attribute removed), so the closed state sits on a wrapper div, not the form tag.
Then the Forge's own rule and numbering, on the page in plain words (5515ea1): the pulse read as a
hexadecimal number; alternates the next entry number up, wrapping to 1, up to three; entries
numbered in the order counted with no gaps, spam-held ones unnumbered until checked by hand,
entries that do not count never numbered. The words' hash for his yes, the card's and /book's line now among the words:
4b364f292f7fd1610924f5dc1fbb425dd07a21ca079454a512c894bc623f0f02, sent to the Chief with every word. On his yes: APPROVED_SHA256 set, OPENS set to the day and hour he
says live and only after the engine's giveaway_open is on, rebuild, push, then link it where the
Marketer's list says. Counsel's read of 2026-11-07 (chief docs/briefs/2026-11-07-counsel-giveaway-champagne.md):
it can launch Nov 12 without a lawyer; one required change, the sponsor's mailing address (O.C.G.A.
10-1-393(b)(16)), is ADDRESS in giveaway.py, a merge value outside the hash, shown as a bracket until
Mick's choice comes through the Chief (the registered office or a PO box rented before Nov 11), and
the form does not open without it; three tightenings taken (the fallback weekend through March 2027,
"The winner pays nothing to claim or take the stay", "income tax", the odds beside the value).
Entry at 18 with champagne for 21 and older fits the statute, Counsel says, as long as nobody under
21 is poured for; 21 to enter only if the draw ever runs in paid ads. Then the Forge's freeze (its
Critic: nothing fixed the count before the pulse went public): the page says the number of entries
is fixed and published by 11:00 AM ET on Dec 14, names the beacon's outputValue (128 hexadecimal
digits) at 12:00 PM ET, 17:00:00 UTC, at beacon.nist.gov with its index, and the fallback to the
first pulse after a missed minute; the engine's draw refuses without the freeze logged before the
pulse. DEC 14, THE SEAT'S TWO DUTIES: the workshop has no path to the droplet, so the engine's two
lines come through Mick and the Chief, numbers only. Before 11:00 AM ET Mick runs `freeze`, which
prints "RESULT frozen: N entries, at <time UTC>"; it goes into FROZEN in giveaway.py (a value outside
the hash), rebuild, push, live before noon. After the noon pulse he runs `draw`, which prints "RESULT
pulse <outputValue> index <i>; N entries; winning entry W; alternates A, B, C"; it goes into RESULT
the same way. Both slots and their sentences are on the page now, so no word changes that day.
Nothing about any guest on either page.

---

# DONE · 2026-11-06 · The AI channel counted, and llms.txt says what a stay holds (the Chief's route, Mick: "Let's build", 22:10 ET)

Why: the Nov 5 to 6 couple found Loxley because the wife asked ChatGPT for the best place to take
her husband and it named Loxley Forest; the site could not count that. (1) "How did you hear about
us?" on /book's Netlify inquiry form (pages/book.py) and on the elopement form (pages/elopements.py,
reused by the five landing pages) gains "An AI assistant (ChatGPT, Claude, Gemini)", value
ai-assistant, before "Friend / Word of Mouth"; the field stays "referral"; the option is on all
seven built pages, once each. /book's own checkout already had the chip "An AI assistant" sending
heard_from=ai_assistant (js/gatehouse.js; the engine's desk.py HEARD_FROM), so the two vocabularies
stand: Netlify referral=ai-assistant, checkout heard_from=ai_assistant; the workshop Forge told both
in one line. The Forge's answer: nothing in the engine reads a form's referral today (the doors keep
id, form name and time only); counting form referrals would be a new door counter by value, counts
only, likely a mirror field and a contract bump, the Chief's call to route. Until then the value
reaches Mick in each Netlify submission. Live on main as 010b566 (the option, llms.txt and the FAQ
confirmed by fetch). (2) llms.txt: two sections from the site's own words, "What a stay
holds" (the home page's "Your stay is a story, not a checklist"; TreeMail, Fire & Flour, First Light
as "Part of every stay") and "Elopements" (the four cards with their prices and lines, the guest
count, the half-reserves line, The Falls' one weekend a month from October 2027 and its list), and
"Prices are never printed" corrected to nightly prices, since the elopement packages are priced on
the page. The Critic's weakest claim, taken: "at no extra cost" is not the site's phrase, and Stars &
S'mores and The Letter stay out of the file because both are questions Mick has held open since
2026-10-19 (s'mores included or an add-on; The Letter still running); the file hardens nothing he
has not ruled. Also taken: The Falls' line carries its cadence and its list, not "inquire"; the
"three ceremony spaces" sentence dropped rather than sit beside the waterfall. (3) faq.py "Three
packages" became "Four packages", a correction to the page's four cards since Firelight (83a077f,
Mick's yes by ear 2026-11-02), in the visible answer and the FAQPage schema alike. Checks: build_v2,
check_forms (11 forms), ensure_gtm, check_pseo (0 problems). The Critic's standing ask, not built
tonight: a check that fails the build when llms.txt holds a phrase no built page holds.

---

# DONE · 2026-11-05 · Before the Bridge live and the recap drafted for the December 15 to 17 stay (merge 6c349ff)

The page is on main and live (200 at 16:50 ET, noindex, the vows line as below), on Mick's yes by
voice ("Okay amazing ... whatever you think is best", the new lines read to him in the seat's message;
the drone break put to him in the Critic's words first). The branch is merged and deleted. The seat's
calls on "whatever you think is best": the drone stays in as his free gift, worded as the house's own
exception to the no-drones line and flown by him, the videographer the polished option; the page keeps
"ready from 3:00 pm" (his standing ruling) though their signed agreement says 4:00 p.m., for his word
if he wants it changed. The recap is in the Chief's Gmail draft in their thread, updated in place by
the seat on Mick's ask, with four bracketed spots for his own hand: the five bridge pictures
(email-sized copies in the session scratchpad, bridge/), the Drive folder link, the Make Me Up link
and the page link. Found and proven: the Gmail connector rewrites every link it writes, in the HTML
and the plain text alike, into https://www.google.com/url?q=...&source=gmail&ust=<about 24 h
later>&sa=E, the redirect Mick's earlier recipients hit; so links go into a draft by hand in Gmail,
never through the connector. The license paragraph corrects the Sep 15 email's "or a county easier
for y'all": for non-residents the license comes from the ceremony's county (gaprobate.gov). Then the
Chief's last route on Mick's ask for "the elite way" to show the bridge: private/the-bridge-21b368/
(84dd12f), the house's five bridge pictures with captions in the Before the Bridge look, the stay
guide's bridge line under the title, unlisted, nothing about any guest, so it serves any couple
choosing where to say their vows; the draft's picture spot became one hero shot inline (the whole
span at dusk) and the page's link. **Sent by Mick from his Gmail at about 17:40 ET, the hero shot
and the four links pasted by his hand** (the Chief's word, cleared in its queue). The route below is
the record of how it was built.

---

# IN FLIGHT · 2026-11-05 · Before the Bridge and the recap for the December 15 to 17 stay (the build, branch before-the-bridge-2026-12-15, merged above)

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

