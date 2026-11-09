# The crossing, as a reel

`js/crossing.js` draws the walk; this folder films it.

```sh
cd scripts/crossing
./fonts.sh                                   # the caption faces from Google Fonts, once (not committed)
node render.js out/loxley-crossing-reel-1080x1920.mp4 23.5          # words and counter
node render.js out/loxley-crossing-reel-1080x1920-clean.mp4 23.5 clean   # the walk and the logo only
```

`reel.html` is a 540 x 960 stage filmed at 2x (1080 x 1920, 30 fps): a breath on the first
platform, the walk in 18.5 seconds, a breath at the door, the end card (the stacked mark and
loxleyforest.com). The renders are about 50 MB; for sharing they are re-encoded two-pass at
4.6 Mbps (about 14 MB). Needs the Playwright Chromium and ffmpeg named in scripts/logo/README.md.
