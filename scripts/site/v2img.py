#!/usr/bin/env python3
"""Prepare a photograph for the redesigned pages: images/v2/<name>-800.webp and -1600.webp.

    python3 scripts/site/v2img.py images/EQ3A0906.webp eq3a0906

The builder's pic(name, ...) then serves it at the right size. The 1600 copy is made only when
the source is wider than 1200 pixels. Pillow only; quality 74.
"""
import os
import sys

from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def main(src, name):
    im = ImageOps.exif_transpose(Image.open(os.path.join(ROOT, src) if not os.path.isabs(src) else src)).convert('RGB')
    out = os.path.join(ROOT, 'images', 'v2')
    for w in (800, 1600):
        if w == 1600 and im.width <= 1200:
            continue
        c = im.copy()
        if c.width > w:
            c = c.resize((w, round(c.height * w / c.width)), Image.LANCZOS)
        p = os.path.join(out, f'{name}-{w}.webp')
        c.save(p, quality=74, method=6)
        print('wrote', os.path.relpath(p, ROOT), c.size, os.path.getsize(p) // 1024, 'KB')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    main(sys.argv[1], sys.argv[2])
