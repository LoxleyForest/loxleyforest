# CURRENT STATE · 2026-11-06 (at most 40 lines here, kept by the Janitor; the history by month is in docs/log/)

**In force**
- Live since 2026-10-19 (merge a246479): the V2 design on every page, /book our own checkout on book.loxleyforest.com, no Hostfully anywhere (Mick's ruling). The look is DIRECTION.md (docs/log/2026-10.md, the 2026-10-19 night block and 2026-10-13).
- Every page is a module in scripts/site/pages/, built by `python3 scripts/site/build_v2.py`: edit the builder, run it, commit the HTML, never hand-edit a built page (docs/log/2026-10.md, 2026-10-13, "Where things are").
- A push to main is the live site. Netlify runs ensure_gtm.py, scripts/site/check_forms.py, then scripts/publish.py: only the site reaches _site/, never *.md, scripts/ or netlify.toml. Before a push: `python3 scripts/ensure_gtm.py --check` and the check_*.js and check_*.py in scripts/site/.
- Every Netlify form carries the ad click's hidden fields and check_forms.py fails a deploy without them; the privacy page says so in Mick's words (the 2026-11-02 block below).
- Words a guest sees go to Mick's ear first. The elopement offer page is approved by hash (APPROVED_SHA256 in scripts/site/pages/offer.py); a changed word closes the page until he approves again (docs/log/2026-10.md, 2026-10-27).
- Private pages: private/<slug>-<random>/, noindex, no GTM, the guest's name only after the # in the link (docs/log/2026-09.md, "Private guest pages"). private/always-tea-time-4f9c21 is a guest's invitation: never link it, never delete it without asking. private/johnson-treehouse-cf6993 (2026-11-07, the Chief's route on Mick's ask) is a treehouse design for a family friend, not a guest page: never link it; its slug carries the family's surname, flagged to the Chief. private/the-bridge-21b368 is the house's bridge, for any couple.
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

# IN FLIGHT · 2026-11-08 · The booking funnel's five fixes (the Chief's route from the ads overnight sheet)

The route (chief docs/briefs/2026-11-08-ads-overnight/sheet.md, "For the website seat"; the memo):
since Oct 22 Google Ads brought 1,631 visits, 232 picked dates, 213 got a price, 16 started
checkout, 2 booked; 45 quotes were refused on the minimum stay, the largest refusal; 93% of ad clicks
are phones. Five fixes, in the Chief's order, nothing live without its word; estimates sent first.

**1. Offer the stay that works (shadow, `var OFFER_STAY = false;` in js/gatehouse.js).** With the
switch on: a tap on a night whose minimum is two or more selects the shortest valid stay that
includes it (the day itself as arrival first, then earlier days when the nights after are taken),
says so in the calendar's note, and the price card shows its total; the offer keeps its arrival, so
a later tap lengthens the stay instead of starting over (the Critic's weakest claim: without that no
tap could make a weekend stay longer than its minimum); a check-out tapped under the minimum extends
the stay instead of refusing; a night that can make no stay offers the nearest that can; each
arrival night with a minimum shows "2+" or "3+" (10 px) in its corner, "2 nights at least" to a
screen reader. The engine's rules (min_stay, max_stay, gap, no_arrival) do not change; no engine
change needed. A new funnel step stay_offered with reason direct, shifted or nearest: the engine takes it
from 5f43e0c (the Forge, 2026-11-08; counts stay_offered and its reasons as distinct visits a day,
apart from picked_dates and the refusals), once the droplet deploys it. THE WORDS, for the Chief and then Mick's ear (the
dates in the calendar's own shapes): "Arriving Sat, Nov 28 takes 2 nights. Here's Sat, Nov 28 to
Mon, Nov 30, 2026; the price is below. Tap a later day to stay longer." / "Arriving Fri, Dec 11 takes
2 nights. The nights after it are taken, so here's Thu, Dec 10 to Sat, Dec 12, 2026 instead; the
price is below. Tap a later day to stay longer." / "No stay works around Sat, Dec 19: the nights
beside it are taken. The nearest that does is Thu, Dec 17 to Fri, Dec 18, 2026; the price is below.
Tap a later day to stay longer." The Critic's verdict: the switch stays off until Mick hears the
words, and "nearest" (it moves a guest to other dates from one tap) needs his yes on whether it ships
at all; it can be cut to the first two cases with one line. CUT 2026-11-08 (the Critic's site-audit
sheet, the Chief's route): `var OFFER_NEAREST = false;` in js/gatehouse.js, the first two cases
alone; a night that can make no stay now starts a stay there as it always did; the third case
flips on Mick's own yes. No fixed minimum sentence is added above the calendar (false inside 7
days, where a weekend sells one night; the calendar prints each night's real minimum). Proven: scripts/site/check_offer_stay.js,
31 checks in both states (shipped: the old refusal and its quote_refused step; offered: every rule
above, the words, the step reasons); check_checkout (124) with the switch off.

**2. /book on a phone, the calendar first.** PageSpeed Insights' API refused us on its shared daily
quota (retry Nov 9). Measured live on a throttled phone (1.6 Mbps, 150 ms RTT, 4x CPU): /book first
paint 2.1 to 2.2 s, largest paint 3.0 to 3.7 s, the calendar live at 2.9 to 4.0 s, load 4.0 to 4.5 s;
the scripts took 1.3 s to arrive and the two API calls (availability, agreement) started only at 1.7
to 1.9 s. /elopements: first paint 1.6 to 1.8 s, largest paint 3.2 to 3.4 s, load 8.8 to 9.2 s (the
reviews and photos below the fold). THE FIRST CUT, cleared by the Chief to go live once the Critic
read it and the checks were green: build_v2.early_script() puts a few lines in the head of the four
pages that mount the calendar (/book, /, /treehouses, /experiences; never the gift, booked, manage
or offer pages), right after the preconnect, starting the availability fetch (and on /book the
agreement) with the exact URL gatehouse.js builds; gatehouse.api() takes a matching GET once and
falls back to a fresh fetch if the early one failed; the early fetch gives up at 8 s so a stalled
engine still reaches the fallback form (proven: a 20 s stall shows the form at 23 s); a hold in the
link skips the early availability call. The second cut (preconnects) was already in place; the third
(the stylesheets) is dropped: the calendar now waits on gatehouse.js itself, not the stylesheets.
LIVE, 6c7efaf, measured again the same way: the calendar live at 2.1 to 2.3 s (from 2.9 to 4.0), the
availability and agreement calls starting at 0.5 s with the stylesheets (from 1.7 to 1.9 s) and done
by 0.9 s, so the calendar waits only on js/gatehouse.js (84 KB raw, about 1 s to arrive on that
link) and its boot. The next lever, not tonight: a lighter calendar script, the checkout and payment
code split out of the calendar's path.

**3. The month link, LIVE and inert.** /book?month=2026-12 opens the calendar on that month
(js/gatehouse.js readUrl/applyMonth): a month before the calendar's first is clamped to the current
one, one past its last to the last, a bad value is ignored, dates in the link win over it, and the
parameter is dropped from the address once dates are tapped. No words change; no beacon (the utm
marks the visit). Nothing uses it until the Christmas ad's final URL in Google Ads is edited to
/book?month=2026-12&utm_campaign=christmas (the sheet still carries the plain /book URL; the Chief's
or the Marketer's edit, not ours). Proven: check_offer_stay.js (now 36, five on the month link),
check_checkout (124). The Critic: goes as is.

**4. The sticky inquire button on /elopements, LIVE since 2026-11-08 (`var INQUIRE_FAB = true;` in
js/global.js, the Chief's word the same day, /elopements only).** On a phone, every page's fixed
gold button reads "Book your dates" to /book and shows once the reader is past the first screen. On
/elopements alone it now reads "Inquire about your date" (the page's own words), keeps its acorn,
points at the form (#inquiry, which sits below the reviews and the questions; the site's anchor
handler scrolls to it), and steps aside while the form is on screen (css .book-fab.is-away). The
menu still carries "Book your dates". The swap is in the script, not the built page; the five
landing pages' #inquiry forms wait on the read below, then one line each in PAGES. Proven:
scripts/site/check_inquire_fab.js, 10 checks in both states, whichever is shipped. The Critic read
it before it shipped dark (its four test fixes and two code fixes are in: the acorn kept, a stray
transition line cut). THE READ, the Chief's: Netlify elopement form submissions per /elopements phone
visit, Oct 25 to Nov 7 against Nov 8 to Nov 21, 2026 (the Analyst, after Nov 21; the visits from
the engine's funnel counts or Analytics, never a guest's name).

**5. /book's words for its searches (the Writer, 2026-11-08, Mick's ear, nothing on the page).** For
the people arriving from "treehouse rental" and "romantic getaway" (Google rates the landing
experience Below average on most keywords). Today's hero: "Dahlonega, Georgia" / "Book your stay" /
"Book direct. No platform fees, no middleman. Just you, the forest, and the family who built it."
The Writer's three sets, each shorter than today's, every claim already on the site (no rating, no
review count, no price in words, "Book direct" kept): A, for the treehouse search: "Dahlonega,
Georgia" / "Book the treehouse" / "Sixty feet up, reached by a hundred-foot rope bridge. Book direct,
no platform fees." B, for the romance search: "Just over an hour from Atlanta" / "Just the two of
you" / "Book direct. A private deck sixty feet up, and the creek below." (the Writer's warning: the
treehouse sleeps four to six, and "the two of you" is an elopement phrase on the site). C, the
Writer's pick, both searches: "Dahlonega, Georgia" / "A treehouse sixty feet up" / "Book direct. A
private deck in the canopy, just over an hour from Atlanta." And one line to replace, not join, the
line under "Choose your nights": "Every open night shows its rate. Tap your first night, then your
check-out day: the whole price, taxes included." Notes: "A treehouse" stops being exact when
Treehouse 2 opens; reread the calendar line if OFFER_STAY goes on (one tap then prices a stay); the
words go into scripts/site/pages/book.py, built, never typed into book.html. Sent to the Chief for
Mick's ear; nothing changes on the page until his yes on the exact words.

---

# DONE · 2026-11-08 · /book's Golden Arrow line past the card's twelve months names the engine's date, never a fixed one

The Chief's factual fix, on its word: /book said "These nights fall after May 31, 2027, so we ask only
the difference" (gift.py WORDS book_after_window, shown when the quote's gift_card.after_window is
true). The May 31 rule went 2026-10-26 (Mick: twelve months from purchase for everyone, then never
expires, the difference only). The engine already sends the sentence with the card's own last night,
gift_card.after_window_line ("These nights fall after November 8, 2027, so we ask only the
difference."; "" when after_window is false; the Forge confirmed the field 2026-11-08: twelve months
from the day it was bought, or a window Mick held or extended). js/gatehouse.js giftNotice() now
shows that line exactly as sent, and only it: book_after_window is deleted from gift.py WORDS (the
Critic: a dateless fallback of our own would be new words nobody heard, and the engine never sends
the flag without its line), book.html rebuilt. Proven: check_gift.js (230; the new section proves
the engine's line in the notice, the notice ending without it, no book_after_window in the page's
words, no "May 31" in book.html), check_checkout 124, check_offer_stay 36. No other page named May
31 (the card's and letters' words were already "within twelve months of purchase"). What would settle
it: a live quote with a night past a card's last night, which no guest can reach before late 2027.

Same day, the Chief's word, the Forge's files: two more card fronts published for the gift letters,
which read them by URL and nothing links them: images/gift/golden-arrow-card-front-1-night.jpg and
golden-arrow-card-front-2-nights.jpg, from loxley-rescue docs/gift-card/golden-arrow/moo-luxe/
front-1-night.jpg and front-2-nights.jpg, made the way golden-arrow-card-front.jpg (the three-night
card, untouched) was: the 0.08 in bleed trimmed, 5 x 7 at 720 x 1008, JPEG 85, no profile.

---

# DONE · 2026-11-08 · Before the Bridge for the December 11 to 13 stay (The Vow), from the generator

Mick's ask through the Chief ("I need to get their Before the Bridge out"). Made with
scripts/before-the-bridge/new.py from the field guide and day book (loxley-rescue
docs/guides/2026-12-11-to-13-*): The Vow, December 11 to 13, 2026, the ceremony Saturday the 12th at
the Fire Circle with the rope bridge open ("Your vows are at the Fire Circle, and the rope bridge is
yours to choose until the week of"), three boys for the day, no alcohol anywhere (the toast question
offers fresh-squeezed orange juice), their own photographer, no waterfall row, The Morning After,
the cake and pizza night given. The Chief's command said --site either, which writes "at the Fire
Circle or on the deck"; the record (the call of 2026-10-27, log 2853 to 2856 and 2917) and the
Chief's own reason are the Fire Circle with the bridge hers to choose, so the page was made with
--site fire-circle --bridge-open and the Chief told; it is remade in a minute if the Chief wants the
other. Every hold left out as the generator does: the laurel grove row, the pizza sentence ("The
dough, the sauce and the cheese are ours..."), the children's overnight question. Nothing of the
couple in the file: the names ride after the # in the link, which Mick adds. Checked: check.js (10
shapes, 7 refusals, 0 failed); the page itself at 390 px (no sideways scroll, fonts loaded, no script
error, no outside request, "Her and Him," from a test link) and in print (four US-letter sheets, each
read). The page: private/before-the-bridge-2026-12-11-to-13-c344f7/ (noindex, robots blocks
/private/, no Tag Manager, linked from nowhere). Mick sends the link from his own Gmail, in an email
they can reply to.

---

# IN FLIGHT · 2026-11-08 · The site audit's eight (the Chief's route from chief docs/briefs/2026-11-08-site-walkthrough.md and 2026-11-08-critic-site-audit.md, "Thursday's eight", one commit each, before the Nov 12 freeze)

The Chief's ship rules: truth fixes and the two bugs ship on green on its word; everything else behind
a switch until Mick's yes. MICK'S YES, 2026-11-08 about 18:40 ET, by the Chief, to his sheet's five
site lines ("Brother just run it I trust you! If it's legendary and best in class and prints money I
approve."): FLIPPED ON, one commit each, checks green, read back live: PACKAGE_ORDER_V2 (b774af7),
PRICE (5de9860), GIVE_A_STAY (7231db2), REVIEW_COUNT with the rating computed from the list, 5.0
(f2247c6 the code, the flip after it), PHONE_STILL (the flip after). Still off, separate yeses:
OFFER_STAY and OFFER_NEAREST, SIZES, SIZE_WORDS, the giveaway's hash, the /book hero words. The
paragraphs below describe each piece as built; where one says "shadow" or "flips on", read it against
this line. Too risky for the freeze, not started: the toast move, the /book price card
and calendar layout, "Buying for someone else?", cancellation rewording.

**The dead pause icon (bug, shipped).** On an iPhone the hero film never plays (only a phone reporting
4g gets it), yet a pause icon showed over the still: css/v2.css `.lf-hero__pause { display: grid }`
overrode the hidden attribute. `.lf-hero__pause[hidden] { display: none; }` added, as .lf-loop__pause
has it; js/global.js unhides it on "playing". Proven in check_inquire_fab.js (a phone: hidden and not
drawn; a desk: shown only once playing).

**The floating button clear of the words (bug, shipped twice).** It sat over package text on
/elopements and over the bridge's lines on the home page. The first fix (c79e23c) stepped it aside
whenever words ran under its band; the Critic measured it blinking, the rework fixed that, and the
number it left (shown on 21% of /elopements' scroll) made the Chief strike the approach: "a button
that shows a fifth of the time doesn't earn its place." Now the pattern guests know: hidden over the
first screen, hidden while the thumb scrolls down, back on a scroll up (6 px of movement, so a tremor
is not a scroll) and at the page's end, out of the way of the open menu and any other Book button,
and on /elopements with INQUIRE_FAB still stepping aside while the form itself is on screen. Proven
in check_inquire_fab.js on /elopements and the home page, both states of INQUIRE_FAB.

**Truth fixes (shipped on the Chief's word; cuts and one narrowing, no new words).** elopements.html's
head no longer tells Google the place is an "EventVenue" (the agreement: "We are not a commercial or
licensed wedding venue"; the head is kept from the file by the builder, so it was cut there). The
rope bridge's tag "The aisle in every package." is cut to "The aisle." (false for Firelight, whose
vows are at the Fire Circle; the Critic struck "The aisle in The Crossing." as reading as the bridge
itself under the card's eyebrow "The crossing", and naming a package there is new words for Mick's
ear). "Every guest is part of your private celebration: your closest people, sharing your night
in the canopy." cut from the elopement FAQ's guest answer and from the inquiry form's help line
(four pages share it): it read as eight overnight in a treehouse that holds six. "The canopy
provides natural protection." cut from the elopement FAQ and "and the canopy gives the deck natural
protection" from /faq: no source.

**OFFER_STAY, the first two cases (item 2):** `var OFFER_NEAREST = false;` in js/gatehouse.js (see the
five-fixes block above); check_offer_stay.js 38, check_checkout 124.

**The package order (item 3, shadow, `PACKAGE_ORDER_V2 = False` in scripts/site/pages/elopements.py,
a build-time switch).** On: the cards read The Crossing, The Vow, Firelight, then The Falls as the
dimmed card that takes no date ("From October 2027"); the form's options follow. Off: as Mick placed
them 2026-11-02 (The Vow, Firelight, The Crossing). In both states, and shipped now since it changes
no words: every card's "Inquire for your date" link carries its package into the form (only
Firelight's did). No "From $2,500" lead is added (the Critic cut it). Proven:
scripts/site/check_packages.py, both states, and the built page matching the shipped one. Flipping
it: the one line, python3 scripts/site/build_v2.py, the checks, one commit, on Mick's yes (he placed
Firelight second). The heading "Four tiers." stays as it is (words).

**The review count line (item 4, shadow, `REVIEW_COUNT = False` in scripts/site/build_v2.py, a
build-time switch).** On: under the 4.9 and its acorns, wherever the rating shows (the reviews
section on /, /elopements and the landing pages; /book's quote card), "129 reviews. 126 of them five
stars.", the numbers never typed: read at build from the review list's own summary line
(loxley-rescue docs/reviews/all.md, "129 reviews in all: 126 five stars, 3 four stars."), so a build
on the day it ships carries that day's counts, and the build stops if the switch is on and the list
cannot be read. FOR MICK'S EAR, PLAINLY (the Critic): his ruling in the review list's own notes
(docs/reviews/all.md, 2026-10-23) was "no count and no platform name, just 4.9 with acorns", so this
line reverses that ruling, as item 7 reverses his Oct 19 one; and 126 five stars of 129 average 4.98,
which rounds to 5.0, so the 4.9 beside the line will read wrong: his call whether the 4.9 stays, goes,
or becomes 5.0 (the Marketer wanted the count line in the 4.9's place). Proven: check_reviews.py
(the built line equals the list's counts, or no page carries one while the switch is off; and the
list's typed summary line must agree with its own headings, 129 and 126 today). Flipping it: the
line, a rebuild the same day, the checks, one commit.

**/giveaway and /giveaway-entered, the reel's door (item 5, behind the giveaway's own gate).** One
bridge photograph (aerial-bridge, as the reel shows it) over the rules and on the entered page in
the dusk photograph's place, and three doors on under each page: Stay (/book), Elope (/elopements),
Give a stay (/gift), each with ?src=giveaway-site. The door words are new, in giveaway.py WORDS
(eyebrow "While you're here"; "Stay" / "The open nights, and what each costs."; "Elope" / "Your vows
on the bridge, or by the fire."; "Give a stay" / "The Golden Arrow: nights in the trees, as a gift."),
so the words hash moved and they reach Mick's ear with the rest; the form stays closed as before
(APPROVED_SHA256 None, OPENS None). The bio link's tag is Mick's to set in Instagram: ?src=giveaway-bio
on the link; the page already keeps any ?src= for the entry. check_giveaway.py green.

**"Give a Stay" (item 6, shadow, `GIVE_A_STAY = False` in scripts/site/build_v2.py, a build-time
switch).** On: "Give a Stay" (/gift) is the menu's second link on every page and /gift's one name
there ("The Golden Arrow" leaves the menu; the footer keeps it). Not the header row: it keeps its six
links, since a seventh pushes the Book button 36 px off a 1280 px screen (the Critic measured; if
Mick wants it in the row, he names the link that leaves; scripts/site/check_header_fit.js lays the
header out at 1280, 1300 and 1366 px in both states). The home page carries a band after the reviews through
December 24 with the Marketer's line "They don't need another thing. Give them a night in the trees."
and a Give a Stay button (built only until that day, Eastern, and the page drops it itself after it);
/gift's "What it is" opens with "The Golden Arrow is our gift card: nights in the treehouse, given."
(my draft, since no page said "gift card"; the Chief said the band's line comes by Mick's ear, so all
three are for his ear). Proven: scripts/site/check_give_a_stay.py (both states, the built pages in the
shipped one); check_gift.js's statics follow the state the built pages are in. Flipping it: the line,
a rebuild, the checks, one commit.

**The engine's price on /gift (item 7, shadow, `var PRICE = false;` in js/gift.js).** On: the price of
the card the form sells, read from /v1/gift/sizes (one read a page load, shared with SIZES), stands
above the names as "$2,000.00 Taxes and fees included." (the engine's figure and the page's existing
words); typed nowhere; nothing shown if the read fails, answers 404, or lists the 3-night at its cap;
with SIZES on too the cards carry the prices and no line doubles them. It reverses Mick's rule of
2026-10-19 (the amount only right before Stripe), so it waits on his yes. Proven: check_gift.js.

**The bridge as a still on phones (shadow, `const PHONE_STILL = false;` in js/crossing.js).** Mick:
"the animated bridge is too clunky"; the audit: pinned 5.6 screens, about 5 fps under a 4x CPU
slowdown, long tasks to 770 ms. With the switch on a phone takes the existing still path (the one
engraving, every line of the words, no pin, one screen, the calendar next); a desk stays animated;
reduced motion is the still either way. Proven: scripts/site/check_crossing_still.js, both states.
MEASURED on a throttled phone (390 px, 1.6 Mbps, 150 ms, 4x CPU, three runs each, the engine
faked): the calendar live at 3.5 to 3.6 s animated and 3.3 to 3.5 s as the still (the walk builds
only when scrolled near, so it never held the calendar back); the walk itself, a thumb's scroll
through it: animated, 5.6 screens, 4.7 to 6 frames a second, 70 to 74 long tasks, the longest 0.9
to 1.0 s, the script's own governor already down to its low-detail mode; the still engraving, 1
screen, 37 to 43 frames a second on the scroll, but its scene still built when the walk came near,
2 long tasks, the longest 0.9 s (the Critic's test: at that, the poster wins); so the switch takes
the POSTER already drawn for no-script browsers (images/crossing/crossing-still-phone.webp, 129 KB)
in place of the engraving: no scene, no canvas, the words shown, no skip link, one screen: no long
task at all when the walk comes near, 43 to 56 frames a second on the scroll, the calendar live at
3.2 to 3.4 s (from 3.5 to 3.7). Flips on the Chief's word.

---

# IN FLIGHT · 2026-11-08 · The Golden Arrow in its sizes on /gift (shadow, `var SIZES = false;` in js/gift.js)

The Chief's route, the Golden Arrow's last site piece: the gift page per size, the 1-night (Monday
to Thursday), the 2-night and the 3-night, each with its own card front (images/gift/
golden-arrow-card-front-1-night.jpg, -2-nights.jpg, golden-arrow-card-front.jpg), its price and its
terms in the card's own words, every one from the engine, never typed. The engine's side: /v1/health
gift_sizes names each open size that still sells (Loxley main c78de5b); GET /v1/gift/sizes (the
Forge, 2026-11-08, on Loxley main at ac3bb9a, deployed on the droplet's next timer pass) answers {sizes: [{product, nights,
name, subtitle, price_cents (what the checkout charges), terms, includes, sold_out, sentence}]} in
nights order, the sizes on sale alone, sentence "" while a size sells and the engine's FEWER_NIGHTS
("There are not enough nights left this season for this Golden Arrow. A shorter one is still open,
or call or text Mick at 706-502-4823.", ratified 2026-11-08) or its sold-out sentence at the cap;
404 while the sales door is off. The page, with the switch on: health's gift_sales speaks for the
3-night card alone (false at its cap), so the sizes are read whenever it or gift_sizes says anything
sells, and the page is closed only when both say closed (the Critic's weakest claim: before its
fix the page would have said "can't be bought online just yet" in the one case FEWER_NIGHTS exists
for); one read of the sizes; a size is buyable only while health names it and it is not at the
cap; a size at the cap shows with the engine's sentence, named to a screen reader with its terms,
and takes no tap; a size the engine lists without either is not shown; the 3-night alone (today)
is exactly the page as it was; two or more, or the 3-night at the cap, open with the choice: one
card per size, its front (a size with no front yet takes the width with its words), the engine's
line ("A gift of two nights in the trees"), its price with "Taxes and fees included.", its terms;
the choice sets the product the checkout asks for, the terms line under the panel, a line above
the names with "Change", the purchase step's size, and the thank-you's gift_purchase item. A read
that fails, or lists nothing usable, leaves the page as it was (the form while the 3-night sells,
else call or text Mick). NEW WORDS, for Mick's ear (typed in gift.py WORDS, shown only with the
switch on): the legend "How many nights?" (the Writer's pick; the others were "Which card should
they have?" and "A night, two, or three?") and the ask "Please choose how many nights." Nothing
else new: each card's line, price and terms are the engine's; the prices in the chooser are the
engine's figures, so Mick's rule of 2026-10-19 (no amount typed on the page) holds, as the Critic
read it. Proven: check_gift.js, 270 (40 new: shipped, the 3-night alone, three sizes end to end
through Stripe and the thank-you, the engine's own pair at the 3-night's cap with the fake's health
computed as api.py computes it, health naming fewer than the list, the sales door off, the cap with
the read failing, a size with no front, the read failing four ways).
THE CARD PAGE PER SIZE (the Chief's second route the same night, on the Writer's read, chief
docs/briefs/2026-11-08-writer-gift-page-sizes.md): /gift/card accepts every Golden Arrow product
(it refused all but golden-arrow, so a 1- or 2-night card's link would have read "We could not find
a gift on this link"). TWO GATES, not one (the Critic's weakest claim: a hand-issued card of another
size can exist the day Mick types the open line, before any site push, so the card page must never
read "three nights" for it, and must not wait on SIZES). (a) At once, no switch: a card of one night
or two shows its own subtitle and terms, the printed card's words ruled 2026-10-27, as the engine
sends them on GET /v1/gift (the Forge, Loxley main ac3bb9a: nights,
subtitle, terms, includes on every product, from one helper gifts.card_words that /v1/gift/sizes
reads too), the site's copy of those words by product only when the fields are missing (an older
answer; a field the engine sends empty means none: a gift with its own window carries terms "" and
shows its window's line, a size without its own words sends "" and shows no terms line, never the
twelve-month words from the product; a size priced above its $2,000 line is not listed by the sizes
read at all); and no gift line and no status line at all. (b) `var SIZE_WORDS = false;` in js/gift.js: the Writer's two lines
for such a card, its gift line ("A night in the treehouse, and the Dawn Table: champagne brunch
carried across the bridge to your door." / "Two nights in the treehouse, and the Dawn Table: ...")
and its unused status ("Unused, ready for one night" / "Unused, ready for two nights"), for Mick's
ear; on, they show. The 3-night card is as it was in every state. SIZES governs /gift alone: the
panel, and (built into the page while js/gift.js has SIZES true, gift.py reading the switch at
build) the description "A gift of nights in the treehouse at Loxley Forest, and the Dawn Table."
(all four gift pages), the lead "Nights in the treehouse, and the Dawn Table: champagne brunch
carried across the bridge to their door.", the heading "Nights in the trees"; on /gift, choosing a
size swaps the sample card to that size's line and terms (its gift line too once SIZE_WORDS is on;
the 3-night's own always). The "When" row keeps the card's ratified words as built; the script puts
the Writer's one sentence for every size ("Any weeknight for one night, Monday to Thursday; any two
or three nights, weekends included. Good within twelve months of purchase. After that it never
expires; we ask only the difference if rates have risen.") in its place only while all three sizes
sell, since it names a one-night card (the Critic). Proven: check_gift.js 289 (shipped, a two-night
card with the engine's fields and a one-night from the product alone, no gift line or status; with
SIZE_WORDS on, the Writer's lines; the three-night unchanged in every state; the sample swap, back,
and with the Writer's line; the "When" row swapped only with all three on sale; the page as built
with SIZES on rendered, not only its script; terms sent empty on a card and on a listed size). The Dawn Table is ruled, not a question: Mick,
2026-11-08, "Golden Arrow as written", the brunch given in every size. ORDER (the Critic's, confirmed by the Chief 2026-11-08: "a card always tells the truth about its own size, whatever the switches say"): Mick
hears the Writer's six lines before he types the open line for any size; SIZE_WORDS flips on his
yes (one line, the check, one commit); SIZES flips on the Chief's word once a size is open (the
one line in js/gift.js, python3 scripts/site/build_v2.py, the checks, one commit).

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
Critic read before merge; its fixes are in. Measured live after the push (d1821d5), our origin's bytes on a 3x phone: the home page 299 KB on
a landing and 1,105 KB on a full scroll for an iPhone (no film), 958 and 1,764 KB for an Android that
reports 4g (the 659 KB film); /giveaway about 60 KB cold; /giveaway-entered 37 KB plus the shared
CSS and scripts; /experiences 123 KB on a landing, 607 on a full scroll. At 50,000 visits, credits
roughly equal the KB a visit: about 285 to 915 on landings and 1,055 to 1,680 on full scrolls, against
2,400 and 3,970 before, on a plan of 3,000. The next shave if the counts run hot: img_2546-800 (257
KB, the home page's tall deck photo, no 1600 to crop from) and img_1717-800 (301 KB, experiences),
both re-encoded from their sources at a lower quality.

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

