# The elopement inquiry's own conversion (2026-11-04)

The Marketer's elopements memo (chief docs/v2/elopements-to-four.md, item 3), routed by the Chief:
the elopement form gets its own thank-you page and its own Google Ads action, so the Elopements
campaign learns from elopement inquiries alone. $0. Nothing on the page speaks for Mick: its words
are /success's, unchanged.

## What the site does now (live with the push of 2026-11-04)

| | |
|---|---|
| The form | `elopement-inquiry` on /elopements and the three elopement landing pages (one Netlify form) |
| Lands on | `/success-elopement` (success-elopement.html, built by scripts/site/pages/confirmations.py; noindex, not in the sitemap) |
| Held there by | scripts/site/check_forms.py (OWN): the deploy fails if the form posts anywhere else |
| Counted today by | **Form Inquiry (success)**, label `12CKCM613eccEM6c6btD`: its Tag Manager trigger is Page Path *contains* `/success` (loxley-rescue docs/site-tags.md, 2026-08-25), and the new path holds `/success` on purpose, so no elopement inquiry goes uncounted while the new action waits on Mick |
| Proven by | `node scripts/site/check_conversions.js` (nothing real is sent): today it wants Form Inquiry to fire on /success-elopement; once the new label is in `ELOPEMENT_LABEL` it wants the new label there and Form Inquiry *not* |

| Action | Label (AW-18110631502/...) | Fires on | Since |
|---|---|---|---|
| Elopement Inquiry | `6ibiCPrZ1LIdEM6c6btD` | /success-elopement, page view | the action since 2026-11-05 08:50 ET (the Chief's clicks in Mick's Chrome, on his word; the label read from the page, proven by the check only after the publish); the tag not yet: Tag Manager steps 2 to 5 below |

## Mick's clicks (one list; nothing here spends money; the accounts, not the site, so any day)

Step 1 is done (2026-11-05). Steps 2 to 5 wait: the extension has no access to tagmanager.google.com
in Mick's Chrome; the Chief is asking him for it, else he clicks them himself.

1. **Google Ads, the action: done 2026-11-05 08:50 ET** (the Chief, in Mick's Chrome, on his word).
   Goal Submit lead form, name **Elopement Inquiry**, count One, click-through window 90 days (as
   Form Inquiry and Widget Inquiry: a long consideration), attribution data-driven. Value: this
   Google Ads flow no longer offers "don't use a value" (Form Inquiry's setting), so the action
   carries "same value for each conversion" at Google's default, $1. Google Ads shows $1 of
   conversion value per elopement inquiry where Form Inquiry shows none; it changes nothing while
   the campaigns bid for conversions, and matters only if one ever bids for value (the Marketer's
   call then). Conversion ID 18110631502, label `6ibiCPrZ1LIdEM6c6btD`, read from the page.
2. **Tag Manager, the trigger** (GTM-5N4BX66K): Triggers, New, "PV - Elopement Inquiry Success":
   Page View, Some Page Views, Page Path contains `/success-elopement`. Save.
3. **Tag Manager, the tag:** Tags, New, "Ads - Elopement Inquiry Conversion": Google Ads Conversion
   Tracking, Conversion ID 18110631502, the label from step 1, Value and Transaction ID empty,
   Conversion Linker on (as the other conversion tags), trigger PV - Elopement Inquiry Success. Save.
4. **Tag Manager, the old trigger:** Triggers, open the one the Form Inquiry tag fires on (Page Path
   contains `/success`), add a second condition: Page Path does not contain `/success-elopement`.
   Save. Without this an elopement inquiry counts twice, once in each action.
5. **Publish:** Submit, version "Elopement Inquiry conversion", Publish. Preview first if you like
   (Preview, enter https://loxleyforest.com/success-elopement, Connect: "Ads - Elopement Inquiry
   Conversion" under Tags Fired, "Ads - Form Inquiry Conversion" under Not Fired), knowing a Preview
   visit fires one real conversion, as the 2026-08-25 proof did. The seat's check fires nothing real.
6. **Google Ads, the campaign:** Campaigns, Elopements, Settings, Goals: it should use the account
   default goals, where Submit lead form now holds Elopement Inquiry as Primary. If it names its own
   goals, add Elopement Inquiry there.
7. **The seat:** the label is in the table above (2026-11-05) and in `ELOPEMENT_LABEL` in
   scripts/site/check_conversions.js on the branch `elopement-label`, with this file's rows as they
   will read after the publish. The branch merges the hour the Chief says the container is published
   (step 5), never before: from the merge the check wants the new label on /success-elopement and
   Form Inquiry not there, which is false until the publish. Proven 2026-11-05 against the live site:
   on the branch the check prints "MISSING Elopement Inquiry (success-elopement)" and "WRONG
   12CKCM613eccEM6c6btD fired on /success-elopement too", exit 1, the two lines the publish flips;
   on main it passes, every row. After the merge: `node scripts/site/check_conversions.js` on the
   live site must print "fires Elopement Inquiry (success-elopement)" with no WRONG line. The row
   into loxley-rescue docs/site-tags.md (the Forge's file, through the Chief).
8. **The Forge:** `/success-elopement` into loxley-rescue gatehouse/funnel.py CONFIRM_PATHS and
   gatehouse/sources.py SITE_PATHS, both exact matches today, so the engine's funnel counts a visit
   that sent an elopement inquiry as confirmed and names the page (today it would read "other").
   Google Ads counts either way; this is the engine's own read.

## The giveaway form, coming (the memo's item 4)

It is not an inquiry. check_forms.py (NOT_INQUIRY) fails the deploy if a Netlify form whose name
starts with `giveaway` posts to any path holding `/success`, because Form Inquiry's trigger matches
by "contains" and an entry would count as an inquiry. Give it its own thank-you page, named without
`success`, and no gclid field is required of it.
