# START HERE FIRST · 2026-10-19 (the site is built; launch waits on Mick's "go")

**Every public page is in the new design on `next-level`** (Home, Treehouse, Experiences,
Elopements, Our Story, Gallery, FAQ, Local Guide, Book, booking-confirmed, success, 404, terms,
privacy, cancellation). Each page is a module in `scripts/site/pages/` built by
`python3 scripts/site/build_v2.py` (page CSS gathered into `css/v2-pages.css`; photos via
`scripts/site/v2img.py`). Canopy Club removed with 301s in netlify.toml; sitemap updated; the
Promise list stays hidden until our checkout is live (`.lf-promise[hidden]`). Swept at 390 px:
no sideways scroll, no broken images, no errors, GTM on every page, forms intact, legal wording
untouched (its dashes kept on purpose). Not converted (by design): stay, manage, booked (checkout
pages, cutover) and your-adventure (questionnaire).

**Preview Mick walks:** https://loxleyforest.com/private/new-site-371cf1/ (all 15 pages; its
404 page shows unstyled there because it uses root paths; fine live).

**Launch, on Mick's "go" only (a push to main is the live site):**
1. `git fetch origin main && git merge origin/main` into next-level (main carries the private
   stay guides, pizza guide and reels), rebuild, `python3 scripts/ensure_gtm.py --check`.
2. Fast-forward main to next-level and push. Then delete `private/new-site-371cf1/` only (keep
   field-guide, stay-guide-2026-10-17, pizza-guide, always-tea-time).
3. Favicon and phone icon are already the new ones on next-level; confirm live.
4. Walk the live site on Mick's phone; check the Hostfully widget on /book and the elopement form.

**Cutover to our own checkout (branch `cutover`):** booking-confirmed.html stays while Hostfully
is the 30-day rollback. When Hostfully is cancelled, redirect `/booking-confirmed` and
`/booking-confirmed.html` to `/book` in netlify.toml.

**Mick's open questions (none block launch; pages keep what they said):** Experiences add-ons
still offered (Forest Tableau, Flight Deck, The Landing, Beer Board, Khachapuri, After Dark,
Romance, Celebration, Provisions Box); s'mores included or an add-on; The Letter still running;
"Most popular" on The Crossing; elopement 2 to 20 ceremony guests vs a stay of up to 6; the
Woodland Yurt line left off Our Story.

**Interior video:** the Drive connector pulls only files under about 6.5 MB. Nine short clips
(kitchen, table, s'more, oven, the bridge drift) are in `~/footage-in/` (not in any repo; contact
sheets in `~/footage-in/sheets/`). No bed/ceiling/bathroom clip yet; the ten bigger clips need
rclone set up by Mick (one Google sign-in) or his laptop: `scp ~/Downloads/*.MP4 workshop:~/footage-in/`.

**Note:** a builder's first render on 10-19 sent a few GA page views from 127.0.0.1. Test renders
must block outside requests (the sweep in this session did).

---

# START HERE · handoff of 2026-10-13 night (branch `next-level`)

Mick cleared a long session here. This block is the whole state; the dated
blocks below it are the history. Rulings of the day are also in loxley-rescue
`docs/lantern-log.md` (every 2026-10-13 entry).

## The goal and the date
The redesigned loxleyforest.com goes **live Saturday 2026-10-17/18, Monday
2026-10-19 at the latest** (Mick). Mobile first; Mick reviews on his phone by
voice. Quality bar: what an Awwwards jury would reward, and a funnel that
guides people to book, honestly.

## Where things are
- **Built in the new design:** `index.html` and `treehouses.html`, written by
  `scripts/site/build_v2.py` (edit the builder, run it, commit the HTML; never
  hand-edit those two files). Styles `css/v2.css` over `css/global.css`;
  behaviour `js/v2.js` over `js/global.js`; booking `js/gatehouse.js`.
- **The unlisted preview Mick shares with Livy:**
  https://loxleyforest.com/private/new-site-371cf1/ (main branch, noindex, no
  Tag Manager). Refresh after changes:
  `git worktree add ../lf-main-share main && python3 scripts/site/share_preview.py ../lf-main-share`,
  then commit and push main from that worktree and remove it. Delete the
  folder at launch.
- **The logo:** done and loved. Code `scripts/logo/` (README), masters and kit
  `images/brand/logo/`, six reels `images/brand/logo/motion/`, review page
  https://claude.ai/artifact/Vr8WuXmeUFcVPhC1fpvcZu. New favicon and phone icon
  ship at launch, not before. The acorn is a recurring motif.
- **The hero:** "the crossing", three clips blended, `images/hero/`.
- **The booking calendar:** the Gatehouse component, on both pages, after
  "what's included" and before the reviews. Until our checkout takes
  payments it runs in hand-off mode (`data-handoff="/book"`): real nights and
  the all-in total, then "Book these nights" carries the dates to /book
  (Hostfully). The Promise list shows only when our checkout keeps it
  (`data-gh-live-only`). At cutover: set `data-api` and `data-stripe-key`.
  Previews run from `data/gatehouse-snapshot.json` (25% retainer, 30 days).

## Decided today (all logged)
Gold only for the Book button, stars and acorns. Airbnb never up front:
"4.98 from 200+ guest reviews", the source named once by the reviews. Canopy
Club and the announcement banner gone. Treehouse 2 "coming soon" with a list
(Netlify form `treehouse-2-list`). One label, "Book your dates". Sleeps 4
comfortably, up to 6 guests, children and well-behaved pets welcome, no
smoking. The Promise: a 25% retainer deposit of the full total, balance at 30
days, 7 days after a failed charge (Mick told on Telegram, built and merged
in loxley-rescue), one 12-hour hold extension. No attorney: the stay
agreement draft is loxley-rescue `canon/agreements/stay-agreement.md`, revised
to the Scout's Georgia case law; the checkout repeats its bold release beside
the box. Loxley Forest LLC on the agreement.

## Next, in order
0. **The crossing, first build done 2026-10-14** (`js/crossing.js`, styles at the end of
   `css/v2.css`; not on any page yet). Drawn live in canvas: the bridge, the lights, the
   netting, the oaks, the creek 60 ft down; a 0 to 100 ft counter; Mick's own sentence as
   the captions; a look over the rope at "heart beat faster"; arrival at the lit spire; a
   speed governor (lower resolution, then less detail, on slow phones); reduced motion and
   old browsers get the still engraving. Note: `html, body.v2` now use `overflow-x: clip`
   (hidden broke pinning). Private preview with the real calendar after it:
   https://claude.ai/artifact/UyuRfjKG8D6MWm7gaV6wPR. Waiting on Mick's look and his
   bridge facts and footage (asked 2026-10-14). Reels for Mick and Livy (with words, and clean)
   are in the unlisted folder at private/new-site-371cf1/reel/ (re-render: scripts/crossing/). On the home page since 2026-10-14 (Mick agreed): hero,
   the opening statement, the walk, the calendar, reviews, what's included. Tag Manager events:
   crossing_start, crossing_half, crossing_end, crossing_skip, crossing_book (with crossing_ft);
   compare walkers' booking starts with skippers' after launch. Mick ruled the drawing good as is.
1. **"The crossing, walked"**, approved by Mick to build and see: after the
   opening statement, scroll carries the guest across the hundred-foot bridge
   drawn in the logo's engraving, a counter 0 to 100 ft, the far end opening
   onto the calendar. Reduced motion shows the finished engraving. First build
   a photo-to-engraving renderer in `scripts/logo/` (it also powers the
   animated guidebook); his reference photos are `images/source/crossing/`.
   It amends DIRECTION.md's motion rules (Mick approved 2026-10-13).
2. **The treehouse page made its own** (the Critic): interior, bathroom, deck,
   the walk in, the heights, from the Romantic Atlanta Drive set (Mick picks
   tonight); interior video wanted.
3. **The remaining pages** through the builder: Book (stay) in the new design,
   Experiences, Elopements, Our Story, Gallery, Questions (FAQ), Local Guide,
   the legal pages, 404, the confirmation pages. Remove Canopy Club (page,
   nav, and a redirect in netlify.toml). Update sitemap.xml.
4. **Launch:** merge next-level to main, delete the private preview folder,
   switch the favicon set live, check GTM on every page
   (`python3 scripts/ensure_gtm.py --check`), and test on Mick's phone.

## Mick's laptop session tonight (his hands; nothing here is the Forge's)
- loxley-rescue `deploy/INSTALL-GATEHOUSE.md` steps 1 to 6, about 35 minutes:
  Stripe test keys, the `book` DNS record, Caddy and the services, the
  Stripe webhook, the Litestream backup.
- Approve: the stay agreement draft; the six transactional letters by hash
  (`payment_failed.md` changed to 7 days); GATEHOUSE-SPEC.md section 12 (four
  law-2 gates on the transactional rail, and the clash alert).
- Read-only in Chrome: Hostfully's current rental agreement and waiver, to
  fold their best lines into the draft.
- The Airbnb listing link. Drive: interior and deck photographs and video,
  and the couple's video (engagement or romance pages?).
- His own: the Instagram and Facebook profile pictures (`kit/loxley-profile-1080.jpg`).

## Ideas waiting (logged, not started)
The pizza guide (private/pizza-guide-5a376f/ on main, 2026-10-17: sauce first, no cornmeal by
Mick's preference, timers built in) becomes a chapter of the guidebook; the stay guides already
link it.
The animated guidebook in the logo's style (drive in and the bee yard,
parking and trailhead, trail to the bridge, TreeMail, the fire pit, the
treehouse, the pizza guide) from Mick's photographs and voice notes, in place
of Touch Stay. Seasonal versions of the reel and profile picture. A
save-the-booking offer (what every stay includes: pizza dough, wine; his
words).

---

# Next-level build · 2026-10-12 (branch `next-level`, main untouched)

**Read DIRECTION.md next.** It names the look. This block is what was found and
ruled on 2026-10-12; the older brief below still holds where it is not
contradicted.

- **The footage is found.** Google Drive, folder "Loxley Forest" shared by
  Romantic Atlanta on 2026-07-23: 47 pictures and 50 clips from the evening of
  2026-07-08. **Every clip is vertical.** Durations 1 to 25 seconds, 4.5
  minutes in all, most at 60 fps (so half speed is free). Pulled to the
  workshop's scratch space only; never into this repo beyond web-ready cuts.
- **Permission:** Mick's ruling 2026-10-12: full written permission, paid plus
  a two-night stay, including ads. No guest-release question applies to this
  set.
- **Lighting:** Mick rules enhancement of light and colour is allowed; nothing
  invented. See DIRECTION.md, Video.
- **The logo:** a current one exists in three colours in Mick's own files, not
  in Drive or this repo. Its tree is a live oak drawn by his wife's
  grandmother; it stays for throwbacks and tees. A new mark was explored on a
  design canvas 2026-10-12 (the sail peak, three strokes); Mick read it as a
  tent and as cartoonish.
- **The new mark, drawn late 2026-10-12 (supersedes the sail peak):** an
  engraving in an arch. The twin-spire treehouse from Mick's dusk photograph,
  hung between five oaks, the arrow through the name kept. Masters in
  `images/brand/logo/`, three animated cuts in `images/brand/logo/motion/`,
  and the code that draws all of it in `scripts/logo/` (README there; rebuilds
  byte for byte). Review page, private to Mick:
  https://claude.ai/artifact/Vr8WuXmeUFcVPhC1fpvcZu
- **Facts from Mick, 2026-10-12, for this treehouse:** five oaks hold it up;
  every cable is attached at the truss's bottom hubs, none at the top.
- **Ruled 2026-10-12/13:** Mick approved the engraved mark ("knocked it out of
  the park"). "Dahlonega · Georgia" stays under the name. The oak placement as
  drawn (two left, two right, one behind) is close enough. He asked for the
  small icon to be less chunky and for anything that makes it better.
- **Done 2026-10-13 on this branch:** an acorn crowns the arch; two icons (a
  lean favicon for the browser tab, the engraving as the phone home-screen
  icon); the kit in `images/brand/logo/kit/` (profile picture, link preview,
  email signature, icon PNGs); six animations in `motion/`, with and without
  a loxleyforest.com end card. The root `favicon.svg` is now the new favicon,
  `apple-touch-icon.png` sits at the root, and every page links both. The
  header still shows the name as text; the header lockup is part of the
  redesign build.
- `[MICK RATIFIES]` whether the new favicon and phone icon go to the live site
  ahead of the redesign. Mick changes the Instagram and Facebook profile
  pictures himself; the file is `kit/loxley-profile-1080.jpg`.
- **Hero loop:** three candidates cut at 1080p under 4 MB each, phone and
  desktop, posted for Mick to pick. The chosen one gets a Runway grade, then
  lands in `images/` (or `video/`) with a poster `.webp`.
- **Calendar:** Romantic Atlanta shoots Christmas in the Forest on 2026-11-03
  or 04 (peak leaf colour). Mick is away 2026-11-12 or 13 to 11-23, then
  Thanksgiving. The reel is held until he is back; the Christmas site and ads
  launch right after Thanksgiving. The new frame must be finished before the
  November shoot lands.
- **Tools:** a standalone ffmpeg lives in `~/bin` on the workshop (no admin
  rights needed). Netlify branch previews for `next-level` still need Mick to
  switch them on.
- **Where the work is seen (private links, Mick's account):** the logo canvas
  https://claude.ai/artifact/8zSL1LXVp6Yrs7Znri6MUn (four boards: now beside
  proposed, three marks, lockups, in use) and the hero candidates
  https://claude.ai/artifact/ShWtbAPDS1F6fFjCa4ocH6 (A bridge lights, B bridge
  to the treehouse at half speed, C the treehouse at dusk; phone and desktop
  cuts of each). The cut clips live only in the workshop's scratch space and
  can be re-cut from Drive in minutes with the standalone ffmpeg.
- **Mick's read of the mark, 2026-10-12:** the sail peak reads as a tent, not
  a treehouse in the canopy. The current logo's tree is cool but busy, and
  its cottage is not the building. Next pass: make the mark read as *hung in
  the trees* (trunks, the bridge, air beneath the deck), keep the arrow.
  The arrow through the name is the keeper. The current logo's screenshot is
  at `images/brand/current-logo-2026-screenshot.jpg`; the vector master is
  still on Mick's laptop, not in Drive.
- **Preview path:** Mick asked for the field-guide method, an unlisted
  `/private/<slug>-<random>/` copy on the live domain, noindex, unlinked,
  instead of a Netlify branch preview. That means a push to main of an
  unlisted folder only. Netlify branch previews remain the cleaner path and
  need one switch from him. `[MICK RATIFIES]` which.
- **Done 2026-10-13 on this branch:** the 9 unreferenced HEIC files are out
  (26 MB); the 9 heaviest images pages use are resized to display size (11.9
  MB to 6.9 MB); fonts load from a `<link>` in each head, Playfair retired for
  Cormorant; Lenis smooth scroll vendored in `js/vendor/`; the phone-only
  "Book your dates" button with an acorn, which steps aside while another
  Book button is on screen; the hero loop wired and dormant until the chosen
  clip lands in `images/hero/` (set `data-ready` on the `<video>`; poster
  stays the first paint, phones load the clip after the page finishes).
  Tested locally at 1440 and 390 wide, analytics blocked: no errors, no
  sideways scroll. `your-adventure.html` is left alone (its own fonts).
- **Ruled 2026-10-13:** the new favicon and phone icon wait for the redesign
  launch. Mick wants the acorn as a recurring motif (bullets, dividers, the
  Book button), and seasonal versions of the reel and profile picture (fall
  colour, s'mores at the fire pit, and the like) from time to time. He is
  funding a bigger redesign, inspired by the mark.
- **Baseline, Analyst 2026-10-13** (loxley-rescue
  `docs/briefs/2026-10-13-analyst-website-baseline.md`): 6 of 19 bookings came
  through the website (June to 26 September); 122 of 366 nights booked in the
  last year; Ads logged 0 conversions 29 July to 27 August; no site visits on
  record anywhere, so no conversion rate exists yet.
- **The hero, 2026-10-13:** Mick picked C and asked for the three blended.
  Built as "the crossing": A (on the bridge, 3.5 s), B (the bridge to the
  house, 4.5 s), C (arriving, 5.5 s), one-second dissolves, and C dissolving
  back into A's opening so the 11.5 s loop has no seam. One grade on all
  three, colour only (the purple cast off A's walkway, the canvas toward the
  amber of his photograph); nothing added. Files in `images/hero/`: desktop
  MP4 3.9 MB and WebM 2.5 MB at 1080p, phone MP4 2.2 MB at 720x1280, posters
  85 and 63 KB (each the loop's own first frame). Tested locally: the poster
  is the largest paint on both widths; desktop plays the WebM, phones the MP4.
  Runway is optional from here: a finer grade or slow-motion smoothing, on
  Mick's own login. More clips are welcome into the Drive folder.
- **Logo refined, 2026-10-13 (Mick and Livy):** the window is now a canvas fly
  window following the canvas lines, pointed at the top, lit, with a zipper
  line down the centre; the canvas lines carry a sketch artist's hand (pressure
  that swells and eases, occasional pen lifts, light angled cross-hatching
  where the glow is). Masters, kit, icons and all six animations rebuilt.
- **The new homepage, first draft, 2026-10-13:** mobile first, on `css/v2.css`
  and `js/v2.js` over global.css; the Gatehouse calendar on the page in
  preview mode; Canopy Club and the banner gone. Private phone preview:
  https://claude.ai/artifact/56bECy7GM5bDgq5iE3uEqg. Launch target ruled by
  Mick: live by 2026-10-17/18, Monday 2026-10-19 at the latest.
- **Ideas from Mick, 2026-10-13, for after launch:** the Romantic Atlanta Drive
  set has strong interior shots and short pizza-cutting clips; use them in the
  treehouse and experience sections. An animated, few-words guide for the
  complimentary pizza dough (today a text or email of instructions), drawn in
  the same engraved style; it is guest-facing, so its words go to Mick and it
  rides the gates.
- **The animated guidebook (Mick, 2026-10-13), replacing a Touch Stay
  subscription:** a storybook guide in the logo's engraved style, one chapter
  per stop: the drive in (the bee yard as the landmark), parking and the
  trailhead, the trail down to the rope bridge, the TreeMail box, the fire pit
  and how to light it, the treehouse and how to use everything, the pizza
  guide. Method: Mick sends 3 to 6 photographs per stop and a voice
  description; each photograph becomes an engraving drawn by
  `scripts/logo` (a photo-to-engraving renderer is the piece to build), with
  a few words per step, animated like the logo reel, as a web page and short
  reels. Facts only from Mick; his approval on the words; the link to it rides
  the pre-arrival letter, a transactional template approved by hash.
- **Ruled 2026-10-13 (evening):** no attorney before the Gatehouse launches;
  Mick approves the wording and names the entity on the agreement. Google
  reviews are 5 or 6, shown as "5.0 on Google". The Airbnb link comes tonight.
- **Hero on iPhone:** Mick saw a still. Likely Low Power Mode or Reduce
  Motion; the loop now also starts on the first touch, and a pause button
  sits in the hero corner. Confirm on his phone.
- **Unlisted preview on the live domain (Mick's request, 2026-10-13, to share
  with Livy):** `private/new-site-371cf1/` on main: the new homepage, the
  treehouse page, `logo/` with the reel. Noindex, disallowed in robots.txt,
  linked from nowhere, Tag Manager stripped. A copy, not the branch: rebuild it
  when pages change, and **delete it when the redesign goes live.**
- **Ruled 2026-10-13:** Loxley Forest LLC goes on the booking agreement.
- **Next:** Then a staff table on the redesign plan, then the treehouse
  pages. Google Ads after that.

---

# Saturday brief · 2026-09-26

**Read this first. It is the handoff from the session that ended this morning.**
Everything below was verified on disk that day, not remembered.

## The job

Three workstreams, in the order that makes them cheapest:

1. **New footage.** Drone video and R5 + gimbal video, plus better stills.
2. **Fine-tooth every line of copy** across all 16 pages.
3. **Google Ads is live again** after a two-week pause.

They are not independent. See "Why the order matters" below.

## State of the repo, verified 2026-09-26

- Working tree clean, everything pushed. Last commit `d557d67`.
- 16 hand-authored HTML pages at the repo root. No build system, no framework.
  Every page is a full document; there is no shared layout, so a site-wide
  change means editing every file or scripting it.
- **Netlify deploys on `git push origin main`.** Live in 15 to 30 seconds. The
  Netlify CLI is not installed; git is the only deploy path.
- `scripts/ensure_gtm.py` runs at deploy and guarantees GTM on every root page.
  It globs the repo root only, so nothing in a subfolder is touched.

## What is actually on the site today

- **No video. Anywhere.** Not one `.mp4`, `.webm` or `.mov` in the repo. This
  is new ground, not an upgrade to something existing.
- The homepage hero is a still: `images/EQ3A0906.webp`, 98KB, inside
  `.hero__media` at `index.html:113-116`. Hero styles live in `css/global.css`,
  not `home.css`.
- `images/` holds **60 files and 52MB**. Only **43 are referenced** by any page.
- **9 of them are `.HEIC`, totalling 26MB, referenced by nothing.** HEIC does
  not render in Chrome at all. Half the folder's weight serves no page. Deleting
  them is free and should happen before anything is added.

## Why the order matters

Google Ads Quality Score includes landing page experience, and page speed is
part of it. A heavy autoplay hero is the classic way to wreck Largest
Contentful Paint. So:

- Weight comes off **before** video goes on, or the new ads spend pays a worse
  CPC for a slower page.
- The hero **poster image** should stay the LCP element and be preloaded. The
  video layers in behind it.
- 30 of 60 images are over 500KB. Worth a pass regardless of the video.

## The first real decision: where video lives

The Forge's recommendation, for the Architect to rule on:

**Two tiers, not one.**

- **Hero loop: self-hosted in the repo.** A 6 to 12 second silent loop, H.264
  MP4 plus a WebM, hard target under 6MB total, `autoplay muted loop playsinline`
  with a `poster`. On mobile serve the poster only: it halves the bandwidth and
  iOS Low Power Mode refuses to autoplay anyway.
- **Anything longer than that does not go in the repo.** A 60 to 90 second brand
  film belongs on a real video host, lazy-loaded behind a click. Netlify
  bandwidth is the constraint, and a luxury hero should not carry YouTube's
  chrome.

`[MICK RATIFIES]` the host for tier two before any long film is embedded.

## NEEDS MICK

1. **The footage is not on this machine.** Nothing newer than August in
   Desktop, Downloads, Movies, Pictures or iCloud Drive. Say where it lives
   (SD card, phone, Frame.io, Drive) or copy it somewhere the session can
   reach.
2. **Google Ads, current state.** Which campaigns are live, what they point at,
   and what the daily budget is. A two-week pause resets the learning phase, so
   the landing pages matter more this week than usual.
3. **Copy pass scope.** Whole site in one go, or the money pages first
   (`index`, `treehouses`, `elopements`, `book`)?

## Do not disturb

`private/always-tea-time-4f9c21/` is Monica's tea invitation, sent 2026-09-19.
It carries `noindex, nofollow, noarchive`, `/private/` is disallowed in
`robots.txt`, and it is absent from the sitemap. **Do not link it from any page
and do not delete it without asking.** Three of the four guests are not
supposed to know it exists. `rebuild.py` in the session scratchpad regenerates
its three copies from one source; if that scratchpad is gone, the page itself is
still the record.

## Known, unfixed

`booking-confirmed.html` is missing the GTM snippet in its source.
`scripts/ensure_gtm.py` heals it on every deploy, so the live page is correct
and the source has drifted. Worth fixing properly, not urgent.

## Open in the other repo, so it is not lost

These belong to `~/loxley-rescue` (the Innkeeper) and are parked, not dropped:

- **Kira Lawrence's real email.** Her content release is drawn and ready. The
  Hostfully lead carries an `@mgail.com` address, which is a live typosquat of
  gmail.com. Nothing goes to it until Mick confirms the real one.
- **Spencer Job's gallery release**, to be sent in December once the elopement
  photographs land. He answered "no" to marketing in September, before the
  photographs existed. The agreement itself promises a second ask.
- **Olivia's written authorisation** to execute agreements for Loxley Forest
  LLC, and renaming the eSignatures account to her so the account and the
  signature agree.

## Private guest pages (added 2026-10-08)

`private/<slug>-<random>/index.html` is the pattern for one-off, unlisted guest pages
(the stay guide for Oct 9 to 12 lives at `private/field-guide-oct-2026-79af52/`).
`robots.txt` disallows `/private/`, each page carries `noindex`, and GTM is not
injected there (the deploy script globs the root only). Guest names never go in the
file: the page reads them from the link after the `#` (`#for=...`) so they never
touch the repo or a server log. Share the link with that fragment attached.

The template and the recipe live in `scripts/stay-guide/` (README.md there).
`python3 scripts/stay-guide/new.py <arrival> "<dates>"` starts the next one.

`your-adventure.html` is the arrival questionnaire, a DRAFT as of 2026-10-09:
noindex, linked from nowhere, posting to a Netlify form named `your-adventure`.
Its copy and the promise in its last line need Mick's yes before any guest
sees it, and the link only rides in the booking confirmation by his ruling.
