# The Loxley Forest mark, as code

The logo is drawn by these scripts, not by hand in an editor. Change the drawing
here and rebuild; never hand-edit the SVGs in `images/brand/logo/`.

Drawn 2026-10-12 from Mick's photograph of the twin-spire treehouse at dusk and
his notes that day:

- **Five oaks hold the house up.** Drawn as two left, two right, one behind; the
  front right oak runs up through the deck, as in the photograph. Exact
  placement of the real trees is `[MICK RATIFIES]`.
- **Every cable runs from the truss's bottom hubs** up to an oak. Nothing ties
  to the spire tops.
- **Hand drawn, not a rendering.** An engraving: every tone is a line, light
  lines on a dark arch. No gradients.
- **The arrow through the name stays** from the current logo (Mick, 2026-10-12).

## Files

| File | What it does |
|---|---|
| `engrave.js` | The scene: oaks, canopy, sky, spires, deck, truss, cables, bridge, lights, ferns. Geometry lives in `S` at the top. |
| `emblem2.js` | Renders the scene: `color`, `knock` (one ink, lines cut out), `lines` (one ink, lines only). |
| `wordmark.js` | The name in Cormorant SC SemiBold, outlined, with the arrow through it. |
| `outline.py` | Shapes and outlines text with HarfBuzz and fontTools (exact kerning). |
| `lockups.js` | Stacked, horizontal, wordmark-only, and the bold icon for small sizes. |
| `masters.js` | Writes the master SVGs to `out/masters/`. |
| `anim.js` | The animation, in the browser. `seek(t)` draws any moment; deterministic. |
| `stage.js`, `video.js` | Stage pages and the MP4 renders (reel, square, wide). |
| `boards.js`, `page.js` | The review page's plates and the page itself. |

## Rebuild

```sh
cd scripts/logo
./setup.sh                      # fonts, a Python venv, node packages (once)
node masters.js                 # out/masters/*.svg
npx svgo --config svgo.config.js -f out/masters -o ../../images/brand/logo
node stage.js                   # out/stage-{v,s,h}.html
node video.js out/stage-v.html ../../images/brand/logo/motion/loxley-logo-reel-1080x1920.mp4 1080 1920 10
node video.js out/stage-s.html ../../images/brand/logo/motion/loxley-logo-square-1080x1080.mp4 1080 1080 10
node video.js out/stage-h.html ../../images/brand/logo/motion/loxley-logo-wide-1920x1080.mp4 1920 1080 10
```

The renderer uses the Playwright Chromium cached on the workshop
(`~/.cache/ms-playwright/chromium-1243`) and the standalone ffmpeg in `~/bin`.

## Notes

- The MP4s in `images/brand/logo/motion/` are committed despite the `*.mp4`
  ignore rule (`git add -f`). They total under 2 MB; the rule guards the
  100 MB GitHub limit.
- Fonts are the site's own (Cormorant, Montserrat), from Google Fonts under the
  SIL Open Font License. They are downloaded by `setup.sh`, not committed.
