# The Loxley Forest mark, as code

The logo is drawn by these scripts, not by hand in an editor. Change the drawing
here and rebuild; never hand-edit the SVGs in `images/brand/logo/`.

Drawn 2026-10-12 from Mick's photograph of the twin-spire treehouse at dusk and
his notes that day:

- **Five oaks hold the house up.** Drawn as two left, two right, one behind; the
  front right oak runs up through the deck, as in the photograph. Mick ruled
  the placement close enough, 2026-10-13.
- **Every cable runs from the truss's bottom hubs** up to an oak. Nothing ties
  to the spire tops.
- **Hand drawn, not a rendering.** An engraving: every tone is a line, light
  lines on a dark arch. No gradients.
- **The arrow through the name stays** from the current logo (Mick, 2026-10-12).
- **An acorn crowns the arch** (added 2026-10-13): the five oaks, and an echo of
  the spire finials.

Mick approved the mark 2026-10-12 ("knocked it out of the park"), kept
"Dahlonega · Georgia" under the name, and accepted the oak placement as drawn.

## Files

| File | What it does |
|---|---|
| `engrave.js` | The scene: oaks, canopy, sky, spires, deck, truss, cables, bridge, lights, ferns. Geometry lives in `S` at the top. |
| `emblem2.js` | Renders the scene: `color`, `knock` (one ink, lines cut out), `lines` (one ink, lines only). |
| `wordmark.js` | The name in Cormorant SC SemiBold, outlined, with the arrow through it. |
| `outline.py` | Shapes and outlines text with HarfBuzz and fontTools (exact kerning). |
| `acorn.js` | The acorn that crowns the arch. |
| `icons2.js` | The two icons: the lean favicon (browser tab, 16 to 64 px) and the engraved app icon (phone home screen). |
| `lockups.js` | Stacked, horizontal, wordmark-only; wraps the two icons. |
| `kit.js` | Profile picture, link preview, email signature, icon PNGs into `out/kit/`. |
| `masters.js` | Writes the master SVGs to `out/masters/`. |
| `anim.js` | The animation, in the browser. `seek(t)` draws any moment; deterministic. |
| `stage.js`, `video.js` | Stage pages and the MP4 renders (reel, square, wide). |
| `boards.js`, `page.js` | The review page's plates and the page itself. |

## Rebuild

```sh
cd scripts/logo
./setup.sh                      # fonts, a Python venv, node packages (once)
node masters.js                 # out/masters/*.svg
npx svgo --config svgo.config.js -f out/masters -o out/masters-min
cp out/masters-min/*.svg ../../images/brand/logo/
node kit.js                     # out/kit/: needs out/photo.jpg; copy to ../../images/brand/logo/kit/
node stage.js                   # out/stage-{v,s,h}.html and the -url end-card versions
M=../../images/brand/logo/motion
node video.js out/stage-v.html $M/loxley-logo-reel-1080x1920.mp4 1080 1920 10.5
node video.js out/stage-v-url.html $M/loxley-logo-reel-1080x1920-end-card.mp4 1080 1920 10.5
# and the same for -s (1080 1080) and -h (1920 1080)
```

`out/photo.jpg` is Mick's dusk photograph of the twin-spire treehouse from the
July 2026 shoot (Drive, "Loxley Forest" folder); it is not committed. The root
`favicon.svg` and `apple-touch-icon.png` are copies of the kit's; every page
links both.

The renderer uses the Playwright Chromium cached on the workshop
(`~/.cache/ms-playwright/chromium-1243`) and the standalone ffmpeg in `~/bin`.

## Notes

- The MP4s in `images/brand/logo/motion/` are committed despite the `*.mp4`
  ignore rule (`git add -f`). Six cuts, a few MB in all; the rule guards the
  100 MB GitHub limit.
- Fonts are the site's own (Cormorant, Montserrat), from Google Fonts under the
  SIL Open Font License. They are downloaded by `setup.sh`, not committed.
