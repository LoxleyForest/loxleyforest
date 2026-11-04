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
| Elopement Inquiry | [MICK RATIFIES] label | /success-elopement, page view | not yet: Mick's clicks below |

## Mick's clicks (one list; nothing here spends money; the accounts, not the site, so any day)

1. **Google Ads, the action:** Goals, Conversions, Summary, New conversion action, Website,
   loxleyforest.com, Scan, Add a conversion action manually. Goal: Submit lead form. Name:
   **Elopement Inquiry**. Value: don't use a value (as Form Inquiry). Count: One. Click-through
   window 90 days (as Form Inquiry and Widget Inquiry: a long consideration), the other windows and
   attribution at their defaults. Save and continue, Use Google Tag Manager, copy the conversion
   label (the ID is 18110631502).
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
7. **The seat:** the label into `ELOPEMENT_LABEL` in scripts/site/check_conversions.js and into the
   table above, then `node scripts/site/check_conversions.js` on the live site: it must print
   "fires Elopement Inquiry (success-elopement)" with no WRONG line. The row into loxley-rescue
   docs/site-tags.md (the Forge's file, through the Chief).
8. **The Forge:** `/success-elopement` into loxley-rescue gatehouse/funnel.py CONFIRM_PATHS and
   gatehouse/sources.py SITE_PATHS, both exact matches today, so the engine's funnel counts a visit
   that sent an elopement inquiry as confirmed and names the page (today it would read "other").
   Google Ads counts either way; this is the engine's own read.

## The giveaway form, coming (the memo's item 4)

It is not an inquiry. check_forms.py (NOT_INQUIRY) fails the deploy if a Netlify form whose name
starts with `giveaway` posts to any path holding `/success`, because Form Inquiry's trigger matches
by "contains" and an entry would count as an inquiry. Give it its own thank-you page, named without
`success`, and no gclid field is required of it.
