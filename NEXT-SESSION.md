# CURRENT STATE · 2026-11-06 (at most 40 lines here, kept by the Janitor; the history by month is in docs/log/)

**In force**
- Live since 2026-10-19 (merge a246479): the V2 design on every page, /book our own checkout on book.loxleyforest.com, no Hostfully anywhere (Mick's ruling). The look is DIRECTION.md (docs/log/2026-10.md, the 2026-10-19 night block and 2026-10-13).
- Every page is a module in scripts/site/pages/, built by `python3 scripts/site/build_v2.py`: edit the builder, run it, commit the HTML, never hand-edit a built page (docs/log/2026-10.md, 2026-10-13, "Where things are").
- A push to main is the live site. Netlify runs ensure_gtm.py, scripts/site/check_forms.py, then scripts/publish.py: only the site reaches _site/, never *.md, scripts/ or netlify.toml. Before a push: `python3 scripts/ensure_gtm.py --check` and the check_*.js and check_*.py in scripts/site/.
- Every Netlify form carries the ad click's hidden fields and check_forms.py fails a deploy without them; the privacy page says so in Mick's words (the 2026-11-02 block below).
- Words a guest sees go to Mick's ear first. The elopement offer page is approved by hash (APPROVED_SHA256 in scripts/site/pages/offer.py); a changed word closes the page until he approves again (docs/log/2026-10.md, 2026-10-27).
- Private pages: private/<slug>-<random>/, noindex, no GTM, the guest's name only after the # in the link (docs/log/2026-09.md, "Private guest pages"). private/letter-62a1b3/ (2026-11-10, the Chief's route on Mick's word) is The Letter: any guest writes to their future selves on their phone, the draft kept on the phone as they write and cleared once sent, and sends it through the Netlify form anniversary-letter, posted in place to its own path (never /success; check_forms NOT_INQUIRY names it); the letter and the address reach the mailbox the site's form notifications go to and land nowhere on the site, in a log or in analytics; the page names no outside host (fonts embedded) and serves any guest. The words are the experiences page's own ritual, "The Letter", and the promise is only "mail it to you on your anniversary" (the calligraphy and the wax seal are not arranged); Mick approves the words before the link goes to a guest. Proven by scripts/site/check_letter.js (30). To confirm once, in Netlify's Forms settings (the usher or the Chief, read only): the notification for the new form reaches Mick's Loxley mailbox; and the Forge: the clicks puller keeps counts only for this form too. private/stay-guide-2026-11-21-e67855/ (2026-11-10, the Chief's route on Mick's word) is the field guide for the stay of Nov 21 to 23, built from the Forge's draft (loxley-rescue docs/guides/2026-11-21-to-23-field-guide.md, b882e06) on scripts/stay-guide/template.html; the [MICK RATIFIES] lines went to the Chief, not onto the page; the forecast is not on it (NWS reached only Nov 17 on Nov 10): the Scout rechecks Nov 20 and the page is edited then (the three days' forecast, Public House's weekend hours, Jethro's Sunday hours, the trail after rain). scripts/stay-guide/check.py checks a finished guide. Mick sends the link himself, the names after the #. private/stay-guide-2026-11-13-fda4eb/ (2026-11-12, the Chief's route on Mick's word by voice) is the 22nd Anniversary Celebration Field Guide for the stay of Nov 13 to 15, built from the Forge's draft (loxley-rescue docs/guides/2026-11-13-to-15-field-guide.md, 781bbc4) on the same template in one push: the fireplace's pilot steps near the top in Mick's order and counts, the water line in his phone words, no alcohol word anywhere (Montaluce named as the restaurant, Le Vigne), no house or helper number and no helper's name (the group text is the contact; the one number on it is Montaluce's own), the pizza steps in Friday, pastries Saturday around 9 and nothing more; the four [MICK RATIFIES] lines went to the Chief, not onto the page; three came back ruled the same afternoon (2:35 PM, by the Chief; the Forge's d005af4, one push): both Montaluce rooms offered, Le Vigne the anniversary pick for fine dining and the Trattoria di Montaluce the more casual menu, each with its own Tock link ("Pick the one that suits you"); the trail and bridge lights stay on two to four hours after dark depending on the day's sun, with his humor on the walk back from dinner and a flashlight handy, even the phone's; the shower-and-kettle advice his, and the kettle for coffee under the counter. The gas-smell line stands as written until his word. private/always-tea-time-4f9c21 is a guest's invitation: never link it, never delete it without asking. private/johnson-treehouse-cf6993 (2026-11-07, the Chief's route on Mick's ask) is a treehouse design for a family friend, not a guest page: never link it; its slug carries the family's surname, flagged to the Chief. private/the-bridge-21b368 is the house's bridge, for any couple.
- The Golden Arrow (gift cards): /gift, /gift/card, /gift/thanks, /gift/manage; gift_purchase counts only on the engine's paid answer (docs/log/2026-10.md, 2026-10-29).
- Search landing pages from scripts/site/pseo: five live from heard words, seven held until Mick hears their lines (merge 681a1ad).

**Waits on Mick**
- The Google Ads label for "Gift - Golden Arrow": it goes in GIFT_LABEL in scripts/site/check_conversions.js (docs/log/2026-10.md, 2026-10-29).
- your-adventure.html, the arrival questionnaire: a draft, noindex, linked from nowhere; its copy and its last line need his yes, and the link rides only in the booking confirmation (docs/log/2026-09.md).
- Open since 2026-10-19, the pages keep what they say: the Experiences add-ons still offered, s'mores included or an add-on, The Letter, "Most popular" on The Crossing, 2 to 20 ceremony guests against a stay of 6, the Woodland Yurt line, "treehouses" in the home title, Klarna in Stripe, the bell line for disputes (docs/log/2026-10.md, both 2026-10-19 blocks).
- Hostfully's 30-day rollback from 2026-10-19: when it is cancelled, redirect /booking-confirmed and /booking-confirmed.html to /book in netlify.toml and retire booking-confirmed.html (docs/log/2026-10.md, 2026-10-19 night).

- The December 15 to 17 couple's Before the Bridge page says "ready from 3:00 pm" (his standing ruling) while their signed agreement says 4:00 p.m.; his word if he wants the page changed. Their recap went 2026-11-05 at about 17:40 ET from his Gmail (the blocks below); their answers come back to him by reply or as a photo of the pages, and nothing of them belongs in this repo. Their page is live at /private/before-the-bridge-2026-12-15-to-17-7df87e/; it says "ready from 3:00 pm" while their signed agreement says 4:00 p.m., for his word.

- The January giveaway's words (scripts/site/pages/giveaway.py WORDS, the card's and /book's line among them): his yes by hash, the sponsor's mailing address into ADDRESS, then the day and hour he says "live" into OPENS, only after the engine's giveaway_open is on; then LIVE in js/giveaway-popup.js flips to true in the same push and the seat links the page. Open with the yes: the holds (the engine holds nothing until he rules; the page says the winner chooses from the weekends still open), the value ($1,565 by the Marketer's Nov 7 quote; the accountant confirms), champagne 21 or older on the page or 21 to enter (the table's lean, since the card meets paid traffic), which address he writes to the winner from, the pull switch's standing term in chief docs/terms.md by Nov 11 (the two 2026-11-07 blocks below). RULED 2026-11-08 about 21:20 ET (Mick by the Chief: "as written, 21, and (a)"): entry at 21 or older (the rules line and the eligibility box; the champagne line as written), the sponsor line with the LLC's registered office (ADDRESS = '154 Hilburn Rd, Dahlonega, Georgia 30533', public), the winner hears from mic@loxleyforest.com (both pages), OPENS = 'Thursday, November 12, 2026, at 9 AM Eastern Time'; rebuilt and pushed; the words' hash is now 4de06ad37e1a5fb1a723e5ce507344506999fbc92278cd0ee28037ebdd215766, sent to the Chief with the live URL for his read on his phone. HIS YES BY THAT HASH, 2026-11-08 about 22:35 ET by the Chief: APPROVED_SHA256 names it. OPEN SINCE 2026-11-12: Mick ran the engine's open line himself at about 10:12 ET (the droplet: "giveaway open: entries are kept from now to the start of 2026-12-14"; "giveaway OPEN; 0 entries"), the Chief routed the push, and OPEN = True and js/giveaway-popup.js LIVE = true went live together at about 10:20 ET (15b14a0): the form visibly open on /giveaway, the address, the 21 line and the tagged doors as approved, no word changed ("9 AM" stays true as written: entries were not open before it); the card, the folded line and /book's quiet line show by the switch on the seven pop-up pages and /book. check_popup.js now reads the shipped switch and proves both states from the one file (70). THE DOORS (the Chief, 2026-11-12, after the flip): the pop-up, /book's quiet line and Mick's Instagram bio link, and no other link placed; nothing changes on /elopements before Nov 27, and any other placement comes with the Marketer's list and Mick's word through the Chief. STILL TO DO: Dec 14, the FROZEN and RESULT values from the engine through Mick and the Chief; the pull switch's trigger (chief docs/terms.md) turns LIVE false in one push. Same night, his "consider one of these photos instead": the rules page and the entered page carry his daylight aerial (the bridge into the deck, the canvas peak through the green canopy), the wide frame on a desk and the upright one on a phone (images/v2/giveaway-bridge-800/-1600 and giveaway-bridge-tall-800; pic() gained phone= for a second photograph as the phone source); the alt stays "From above: the hundred-foot rope bridge through the canopy to the treehouse", true of both and outside WORDS, so the hash did not move.

**For the seat to rule, next session (the Chief's flags of 2026-11-04; nothing new goes live Nov 13 to about Nov 27 while Mick is away)**
- FIXED 2026-11-12: scripts/site/check_checkout.js was date-dependent (the same on main and on the invitation branch): its second stay is today plus 17 to 19 days, and on Nov 12 the check-out day, Dec 1, sat in the month a phone has not turned to (css/gatehouse.css shows one month under 768 px), so the click waited on a button laid out at zero width; 27 passed, then the timeout. Not a page fault: proven on the live /book the same morning, read only (every POST refused in the browser), at 390 and 1280 px, Nov 29 to Dec 1 ($1,059.98), Nov 30 to Dec 1 ($530.00) and a mid-December control, each to the price and the checkout step with its summary. The check now taps a day as a guest does (tapDay: turns the month with "Later months" when the day is not in view); 124 green on main.
- CLAUDE.md still says "no build system" though scripts/site/build_v2.py builds the pages; README.md is GitHub boilerplate. Fix both, and point CLAUDE.md's session-open line at this block and docs/log/.
- private/new-site-371cf1/ (26 MB, the preview and its reels) was to be deleted at launch and is still on main; Mick shared its links with Livy, so his yes before it goes.
- Branches not on main, kept and untouched: answers (1 commit, 113 behind: two answer pages for AI assistants, a romantic getaway near Atlanta and where to propose; the pseo pages on main cover the same two subjects) and proposals (3 commits, 129 behind: the proposals page with Mick's photos, 2026-10-21 to 22).
- invitation (2026-11-12, the Chief's route and the table of 2026-11-11 on Mick's word "Build it tonight"; the Forge's rulings of 2026-11-12 on the fields; NOTHING MERGES BEFORE MICK'S YES AFTER NOV 24): /elopement/offer grown into the couple's own page, two things by the key in its link (#offer= a made offer as before; #invite= the Invitation, GET /v1/invitation, nothing held, the names after the #): Mick's line, the day hour by hour with the engine's sun, what is provided, four photographs by package, the price to the dollar, the open dates near theirs, then Ask (the default) or Hold (on his word). New words in pages/offer.py WORDS for his ear, so the live page is closed as built until his yes by the new hash. THE TWO DEMOS for his read, the only files carried to main (Nov 12, before the freeze, the Chief's yes): private/invitation-demo-9b4e27/ (the Invitation) and private/invitation-demo-9b4e27/your-day.html (the public door): noindex, no Tag Manager, no page beacon (js/funnel.js and js/v2.js left off), linked from nowhere, the script and styles inline, an invented couple whose names ride after the #, every number made up, a ribbon saying so; the public demo's form posts nowhere. Mick read the first and changed one sentence (the Builder's Tour: "what he and the family built", the tail his too); the real pages, the script and the check stay on the branch. THE PUBLIC DOOR, /your-day (your-day.html on the branch, rooted, noindex, in no nav, sitemap or link; the table of 2026-11-11, the Critic's version): a visitor picks a package (the three live ones with their cards' prices, read from elopements.py's own data) and an arrival day on a one-month picker in the booking calendar's clothes (GET /v1/your-day/dates?package=, the Forge's name), then POST /v1/your-day {package, check_in} renders the Invitation without a name; the one button fills /elopements' own inquiry form on the page (lifted word for word, its page field /your-day, the same door /success-elopement, so check_forms counts it: 12 forms) and asks Mick; it never holds and takes no money. Proven on the branch: check_offer.js 174 (the Invitation, the public door, the demos' shapes, everything before). Next on the branch: the Critic's round; then the real responses for the demo dates from the Forge once GET /v1/invitation exists.
- elopements-schema (c4707f0, 2026-11-11, the Chief's route from the table on where elopement inquiries come from; NOTHING MERGES BEFORE NOV 27 WITHOUT MICK'S WORD): structured data on /elopements, a schema.org Service "Elopement stay" provided by the home page's LodgingBusiness, the four packages as Offers at the cards' prices (plus tax as valueAddedTaxIncluded false), the cards' own lines, the line under the cards as the audience, Firelight's and the Falls' dates; never "venue"; written by pages/elopements.py schema_elopements() from the cards' data, proven by scripts/site/check_elopements_schema.py (79; fails on a changed price or name); the visible page unchanged (the rebuilt file differs from main's only by the block in its head). To merge on his word: rebase on main, rebuild, the check, one push. Read only, the same route: the site is not verified in Bing Webmaster Tools by any trace here (no BingSiteAuth.xml, no msvalidate meta; a DNS or a Search Console import would leave none, so the usher reads Bing itself), nothing pings IndexNow (no key file, no code), and /elopements is in sitemap.xml with lastmod 2026-10-19 though the page changed Oct 30, Nov 2 and Nov 8 (the builder does not write lastmod for it).
- Ideas logged, not started: the animated guidebook with the pizza guide as a chapter, seasonal reels and profile pictures, the interior clips still on Mick's laptop (docs/log/2026-10.md, 2026-10-13 and 2026-10-19).

The Janitor (chief docs/v2/janitor.md) runs here weekly: this file keeps this block and the current month's entries; older blocks move word for word to docs/log/<YYYY-MM>.md.

---

# DONE · 2026-11-10 · The field guide for the stay of November 21 to 23 (the Chief's route, on Mick's word by voice: "get that field guide made now")

The Forge drafted it in loxley-rescue docs/guides/2026-11-21-to-23-field-guide.md (b882e06; three
waterfalls, a late-night pizza, a birthday thought in words only, the USNO sun and the nearly full
moon, the town's quiet weekend before Old Fashioned Christmas, every claim sourced). Built here as
private/stay-guide-2026-11-21-e67855/ on scripts/stay-guide/template.html, the shape of the Oct 17
guide (the Nov 7 to 9 draft was never built as a page): noindex, no Tag Manager, nothing of the
guests in the file, the names read from the link after the #. The words are the Forge's between its
two rules; mine on the page are the weather lede and the three day cards (sunrise, sunset and
moonrise from the draft's USNO rows, since the NWS forecast reached only Nov 17), the two "call
ahead" lines that stand where the Scout's Nov 20 rechecks go (Public House's weekend hours,
Jethro's Sunday), the two template ledes, the pills, badges and buttons. The hero is the treehouse
at dusk with bare trees (EQ3A0906), not the golden-leaf frame, which is false by Nov 21. The
[MICK RATIFIES] lines (who answers the number, carries TreeMail and lights the fire while Mick is
away; the birthday paragraph; Raven Cliff's trail in late November) stayed off the page and went to
the Chief in the reply, with the sentences they govern, each a one-line cut on his no. RULED
2026-11-11 just after midnight (Mick by voice, by the Chief), four of the six, edited and pushed the
same night: the weekend's contact is Mary Katherine, the forest concierge, by call or text at
770-301-8355, in Mick's number's place in both spots (the repo's rules name booking numbers, door
codes and addresses as what stays off a private page, not a helper's working number; the repo is
public on GitHub, so the number sits in its history as Mick's own does, said to the Chief); the
dough ready and waiting in the treehouse on arrival, kept in a proofer so it stays fresh for hours,
theirs whenever they're ready, no maker named and no "made fresh"; pastries Sunday morning only,
nothing promised after (the page already said no more); the wood chopped and ready for them to
build a fire, the offer to light it cut. Still unruled, left as drafted: the birthday callout and
Raven Cliff. Proven:
scripts/stay-guide/check.py (new, 17 checks), a phone and desk render (no sideways scroll, no
outside host but Google Fonts, every image answering, no script error, 1,132 KB on a phone),
ensure_gtm --check and publish --check green. template.html: the stale October description is now
{{DESCRIPTION}}, and a three-day stay's last weather card takes the whole row. TO DO NOV 20: the
Scout's recheck, then edit the page (the forecast into the cards and the lede, the two hours lines)
and push. Mick is away Nov 13 to about Nov 27 and nothing new goes live then; this is a fact
update to a guest's private page, so the Chief rules whether it goes.

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
above, the words, the step reasons); check_checkout (124) with the switch off. LIVE 2026-11-08 as
7832b21 (Mick's yes at about 21:00 ET by the Chief to the two sentences and the "2+" / "3+" corner
labels; OFFER_NEAREST stays off): read back on a phone, Nov 28 carries "3+", the tap gives the
sentence with Sat, Nov 28 to Tue, Dec 1, 2026 and the stay card $1,357.74 for 3 nights; the Forge
told the stay_offered step is live; check_offer_stay.js reads the switch as shipped and proves both
states (38). THE CHRISTMAS GUARD (the Chief's route of 2026-11-09, chief
docs/routes/loxleyforest/2026-11-09-christmas-tail.md; Mick ruled Dec 23 to 26 one fixed stay, the
Forge's engine side on loxley-rescue forge/christmas-guard): the "Tap a later day to stay longer."
tail is left off whenever the engine caps the arrival night (max_stay) at what is offered, so Dec 23
reads "Arriving Wed, Dec 23 takes 3 nights. Here's Wed, Dec 23 to Sat, Dec 26, 2026; the price is
below." and stops; no new words, no switch; proven in check_offer_stay.js (41: a capped night
offers its nights with no tail, an uncapped holiday keeps it; the made-up calendar holds the capped
night's eve at one night, as the engine holds Dec 22). Live, the tail goes the moment the engine
serves Dec 23's cap.

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
(f2247c6 the code, 9433988 the flip), PHONE_STILL (4a49ce8). Then, his yes by the Chief at about
18:55 ET to the gift page's new lines read to him: SIZES (5372947) and SIZE_WORDS (78604b1), the
block below. Then OFFER_STAY, his yes at about 21:00 ET to the two offer sentences and the "2+" /
"3+" corner labels (the five-fixes block above, item 1; OFFER_NEAREST stays off on his separate
word). Still off, separate yeses: OFFER_NEAREST, the giveaway's hash, the /book hero words. The
paragraphs below describe each piece as built; where one says "shadow" or "flips on", read it against
this line. Too risky for the freeze, not started: the toast move, the /book price card
and calendar layout, "Buying for someone else?", cancellation rewording.

**The hero film on every phone (Mick, 2026-11-08 about 18:45 ET, by the Chief: "I want the video we
made for the hero"; ships on his word).** js/global.js: the film plays on every phone unless the
browser asks for less (Save-Data, or a connection it reports as slow-2g, 2g or 3g); no report counts
as fast, so an iPhone, which reports nothing, now gets it. This reverses the 2026-11-07 rule (only a
phone reporting 4g; DIRECTION.md's video direction and the Forge's tier rule) on the owner's own
word. The poster first, muted, inline, the pause button once playing, as before. hero-phone.mp4 is
659 KB: about 70 GB at the reel's 100,000 phone visits, inside the plan's 150 GB (the credit pack
stays Mick's to buy). Proven: scripts/site/check_hero_film.js (an iPhone-shaped browser that reports
no connection asks for hero-phone.mp4 alone, muted and inline, plays, the pause button drawn and
stopping it; 4g plays; 3g, 2g, slow-2g and Save-Data ask for no film; reduced motion none; a desk
as before). MEASURED on a throttled iPhone-shaped phone (390 px, no connection reported, 1.6 Mbps,
150 ms, 4x CPU, three runs each, our origin's bytes on a landing to load plus 3 s): before, 610 KB,
first paint 2.54 to 2.61 s, load 3.4 s, no film; after, 1,269 KB (the film's 659 KB), first paint 2.42
to 2.76 s, load 3.4 to 3.5 s, the film playing. First paint and load do not move because the phone
asks for the film only after load, the poster already up. THE CRITIC'S CORRECTION, FOR THE CHIEF AND
MICK: the Chief's 70 GB is the film alone; the whole page counts. From the Nov 7 measurements, a
phone landing with the film is about 958 KB and a full scroll about 1,764 KB, so 100,000 phone visits
cost about 96 GB (1,900 credits) on landings and about 176 GB (3,500 credits) on full scrolls, plus
300 to 800 credits of web requests, against the plan's 3,000 credits a month (20 a GB, shared by every
project on the team; at zero every project pauses and forms stop until the next cycle). Without the
film the same week was 600 to 2,200 credits. So the reel's week needs Mick's own action on Netlify
before it: auto recharge on (1,500 credits for $10 each time), or one bought pack (bought credits
never expire). Shipped on his word regardless; the numbers are in js/global.js's comment and
DIRECTION.md's Video section now reads the new rule with the date. Two more of the Critic's: the
first-tap kick for iOS Low Power Mode now listens for touchend and click, which WebKit counts as a
tap that may start a video (touchstart is not); and the browser check's iPhone shape (no
navigator.connection) stands in for the connection rule, not for Safari's autoplay rules, so a real
iPhone in Low Power Mode, one tap on the hero, is what would settle that. check_talk.js now reads
the booking page's quote card as build_v2 writes it (the rating and the count line, never a
platform), since the count line is live.

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

# IN FLIGHT · 2026-11-08 · Romantic Atlanta's shoot on the site (Mick by the Chief, about 19:20 ET: "we own the rights ... Make it legendary. Even the photos for the treehouse page pull from theirs")

The shoot is on the workshop: /home/mick/footage-in/drive/Pictures / (the trailing space is in the
name; 47 stills, no face in any) and Videos / beside it. Two pieces from the Chief.

**1. /treehouses on the stills, LIVE (`RA_PHOTOS = True` in scripts/site/build_v2.py, a build-time
switch; built in shadow as 96caa1e, flipped as 8d156a1 on the Chief's word the same night, Mick's
"Even the photos for the treehouse page pull from theirs ... Make me proud", the Critic's read
taken; read back live: the hero preloads, the og:image and every ra- file answering, the first
screen on a phone shot from the live page). The sheets also sit at the bottom of the loops preview
(private/loops-4ad685/, "The treehouse page: before and after") so he sees them beside the loops.
As built:** A per-state photo table (TREEHOUSE_PHOTOS) feeds every slot of
page_treehouses(); treehouse_two(photo) takes its photo so the home page never changes. On: the hero
is the bridge at dusk straight on (4W6A8086, ra-bridge-dusk-1600) and on a phone an upright crop of
the same frame about the glowing canvas (ra-bridge-dusk-phone-900), the gallery the room, the deck,
the sun through the canopy and the bridge by day, the three "Built, not bought" splits where the
bridge meets the deck, the drone at dusk and the bridge at dusk from the deck, the two 4:5 frames the
room upright and the deck at dusk; the share card (og:image) and the schema images follow the switch
(written from the table in both states, since the head is read back from the file on disk). Off:
the page as it was, byte for byte. 21 files in images/v2/ra-* through scripts/site/v2img.py, none
over 500 KB; a phone's full scroll of the photographs 988 KB (the check's line 1,024), measured in a
browser 764 KB after against 981 before, a desk 1,245 against 1,429; the hero's first-paint file
grows, desk 89 to 214 KB and phone 78 to 158 KB. THE CRITIC'S READ, taken: the first phone hero was
the upright sibling frame with no treehouse in it ("A home in the sky" over no home, the shared alt
false on phones; the fix is the crop of the desk frame); the three splits were one drone shape three
times; the weight line now says it counts images/v2 and logs that the interior film (2,157 KB, Mick's
own, both states) puts the whole page over DIRECTION.md's 1 MB line; og:image in the table. Proven:
scripts/site/check_ra_photos.py, both states. FOR MICK'S EYE: the before/after sheets and the memo in
docs/briefs/2026-11-08-treehouses-ra-photos/ (first screens at 390 and 1440, the whole page side by
side, the gallery and the splits at full size), sent to the Chief. Flipping it: the one line,
build_v2.py, the check, one commit, on his yes. What would settle "legendary": the funnel's phone
picked_dates rate from /treehouses a week on against a week off. Found on the way and fixed:
scripts/publish.py let docs/'s non-markdown files through (the never-list went by pattern), so
"docs" is on it now; the line above that says nothing in docs/ is published is true again.

**2. The crossing as a film on the home page, LIVE as 5f95fc5 (`CROSSING_FILM = True` in
scripts/site/build_v2.py, a build-time switch; Mick's "I agree" to loop B, walking the crossing at
blue hour, at about 20:45 ET by the Chief; read back live on a phone and a desk: the film section
served, the right poster and film each, playing muted inline in a loop about 0.2 s after the section
arrives, the words, the pause button, crossing_start pushed, the calendar next, no error).** The Chief
cut three loops from the July 8 footage (A: drone at canopy height; B: walking the crossing at blue
hour; C: drone glide along the bridge) and Mick picked B from an unlisted preview
(private/loops-4ad685/, deleted in the commit after 5f95fc5 once B was live). As built:
the bridge section is one screen on every shape, the loop's own first frame as the poster painted
first (images/crossing/crossing-poster-phone.webp 41 KB, -desk.webp 70 KB, a <picture>, the video
carrying no poster attribute so a phone never fetches the desk frame), the loop over it once the page
has loaded and the section is on screen (js/v2.js, the in-page film player that already served the
interior loop; its connection rule is now the hero's, slow-2g, 2g, 3g or Save-Data keep the poster,
and its first-tap kick listens for touchend and click), muted, inline, looping, paused off screen, a
pause button top right on a phone where the skip link sat and bottom right on a desk; the walk's four
lines shown at once as the still path showed them; no "Skip to your dates" (one screen needs none);
the calendar next; the words top right on a desk, over the dark trees (the lit canvas walks up the
left half of the frame). The films, re-cut from the Chief's masters with the house's x264 settings
on the Critic's read: crossing-phone.mp4 (540x960 at 24 fps, the direction's phone file, 8.5 s, 395
KB; the Chief's 720x1280 web cut was 753 KB) and crossing-desk.mp4 (1920x1080, 1,385 KB, under the
direction's 1.5 MB line), H.264, silent, the tail crossfaded into the head, force-added past
.gitignore's *.mp4 rule; no WebM (the hero's vp9 came out larger; the Chief's masters are the
cutter's). The film tells the Tag Manager crossing_start once it plays and crossing_end once
through, as the walk did (js/v2.js data-track), so walkers can still be counted beside the calendar's
steps. The scroll-drawn walk (WALK, js/crossing.js, PHONE_STILL, css .lf-walk) stays in the repo
behind the switch for later use as art; check_crossing_still.js renders the home page with the switch
off to keep proving it. Proven: scripts/site/check_crossing_film.js, 60 in both states (the film's
pixels under the words read as dark at 1, 4 and 7.5 s on 1024, 1280, 1440, 390 and 375 px);
check_crossing_still 17, check_inquire_fab 29, check_hero_film 12, check_popup 70, the file checks
green. THE CRITIC'S READ, taken: the first measurement counted only finished downloads, so neither
the hero film nor the crossing film was in its numbers and "lighter" was false; the phone file was
720x1280 against the direction's 540p; the desk file was over 1.5 MB; the desk words sat on the lit
canvas at 1024 and 1280 wide; the walk's Tag Manager events were being dropped. MEASURED HONESTLY
(every byte on the wire from our origin, Chrome's own count, the engine faked, three runs, medians,
before/after; a landing is load plus 3 s, then an 8 s stop at the bridge, then the rest of the page a
screen per 0.25 s): a throttled phone (390 px, 1.6 Mbps, 150 ms, 4x CPU): first paint 2.49/2.53 s,
largest paint 4.06/3.93 s, load 3.45/3.34 s, the calendar live 3.39/3.31 s; a landing 1,151/1,018 KB
(crossing.js's 61 KB and the engraving's 126 KB gone; the hero film's 659 KB in both); after the stop
at the bridge 1,232/1,483 KB (the film's 396 KB arrives and plays about 1 s after the section does);
a full scroll 2,036/2,287 KB, UP 251 KB (12%). A desk (1440 px, 10 Mbps): first paint 0.72/0.62 s,
load 0.97/0.89 s, the calendar 0.84/0.78 s; a landing 1,919/1,778 KB; a full scroll 3,216/4,461 KB
with the 1,385 KB film. The Critic's line was to ship only if the phone full scroll did not rise; it
rose by the film less what left, so it is logged here and in the Chief's report with its cost: at the
reel's 100,000 phone visits, about 25 GB (500 credits at 20 a GB) if every visit scrolled the whole
page, against about 13 GB saved on landings; shipped on the Chief's word to ship after the Critic,
one line to turn off. What would settle it: Netlify's bandwidth for the week after against the week
before (readable by Nov 15), and crossing_start beside picked_dates in the funnel.

---

# DONE · 2026-11-08 · The Golden Arrow in its sizes on /gift (`var SIZES = true;` and `var SIZE_WORDS = true;` in js/gift.js)

LIVE, 2026-11-08 about 19:05 ET, on Mick's yes by the Chief (about 18:55 ET) to the lines read to
him: "How many nights?", "Please choose how many nights.", the lead, the heading "Nights in the
trees", the card lines from the engine, and "Unused, ready for one night" / "two nights". SIZES
5372947 (the one line, the rebuild: only the four gift pages moved, the description on all four,
the lead and the heading on /gift), SIZE_WORDS 78604b1 (the one line; the builder reads only
SIZES, so no page moved). check_gift.js 306 in each state, check_checkout 124, ensure_gtm and
check_forms green; the three-sizes run in check_gift.js now pins SIZE_WORDS off, whatever is
shipped, since the words-on sample card has its own run. READ BACK LIVE at 390 px: both switches
true in the served script; the new description, lead and heading on the page; the engine's health
names golden-arrow alone and /v1/gift/sizes lists the 3-night alone, so the panel is the 3-night
form as it was, no chooser, the price line "$2,000.00 Taxes and fees included." (PRICE), the
"When" row and the sample card in the card's ratified words, one health read and one sizes read,
no sideways scroll, no script error. The Forge told the site line is clear: the chooser appears
by itself the moment /v1/health gift_sizes names a second size and /v1/gift/sizes lists it; no
site push is needed for that. The record of how it was built follows.

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

