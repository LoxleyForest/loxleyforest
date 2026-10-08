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
