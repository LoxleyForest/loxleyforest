# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the production website for **loxleyforest.com** — a luxury treehouse resort in the North Georgia mountains (Dahlonega, GA). It is a **hand-authored static multi-page site**: no build system, no framework, no template engine, no package.json.

## Structure

- `*.html` (repo root) — each file is its own page/route: `index`, `treehouses`, `experiences`, `book`, `elopements`, `canopy-club`, `gallery`, `our-story`, `local-guide`, `faq`, `success`, `terms`, `privacy`, `cancellation`, `404`.
- `css/` — stylesheets (`global.css` plus per-page sheets like `home.css`).
- `js/global.js` — the single shared script loaded on every page (announcement bar, nav scroll, mobile menu, scroll reveal, carousel, lightbox, page transitions).
- `images/` — site imagery (mostly `.webp`).
- `robots.txt`, `sitemap.xml`, `favicon.svg` — SEO/static assets.

## Key facts

- **Multi-page, not a SPA.** Every page is a full document. Page transitions in `js/global.js` navigate via `window.location.href` (clean URLs like `/treehouses` resolve to `treehouses.html`). Any per-page `<head>` snippet (e.g. analytics) therefore fires on every navigation.
- **No shared layout/template.** "Make a change site-wide" means editing every `.html` file (or `js/global.js` / `css/` if the change is behavioral/visual). For repetitive HTML edits across all pages, script the change and verify counts per file.
- **Forms use Netlify Forms** (e.g. `book.html`, `elopements.html`, `canopy-club.html`) — they post to Netlify and redirect to `success.html`. Honeypot fields and `required` attributes are in place.
- **Google Tag Manager** (`GTM-5N4BX66K`) is installed on every page: loader in `<head>`, `<noscript>` after `<body>`. Marketing tags (e.g. Meta Pixel) are managed inside the GTM container, not hardcoded.

## Deploy

Netlify is connected to this GitHub repo via continuous deployment. **`git push origin main` triggers the build/deploy automatically** (live within ~15–30s). There is no `netlify.toml` and the Netlify CLI is not installed locally — deploys are git-driven only.
