#!/usr/bin/env python3
"""Copy the redesigned pages into an unlisted folder on main, for Mick to share.

    python3 scripts/site/share_preview.py <main-worktree> [slug]

Writes <main-worktree>/private/<slug>/ (default slug new-site-371cf1): the new
homepage and treehouse page with their assets, Tag Manager stripped, noindex on
every page, and the logo page from scripts/logo/out/page when it exists. Commit
and push main from the worktree afterwards. Delete the folder at launch.
"""
import os
import re
import shutil
import sys

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ROBOTS = '<meta name="robots" content="noindex, nofollow, noarchive">'
PAGES = ['index.html', 'treehouses.html', 'experiences.html', 'elopements.html', 'our-story.html', 'gallery.html',
         'faq.html', 'local-guide.html', 'book.html', 'booking-confirmed.html', 'success.html', '404.html',
         'terms.html', 'privacy.html']
CLEAN = [p[:-5] for p in PAGES if p != 'index.html']
ASSETS = ['css/global.css', 'css/gatehouse.css', 'css/v2.css', 'css/v2-pages.css', 'js/vendor/lenis.min.js', 'js/funnel.js', 'js/global.js', 'js/v2.js',
          'js/reviews.js', 'js/gatehouse.js', 'js/crossing.js', 'images/crossing/crossing-still-phone.webp',
          'images/crossing/crossing-still-desk.webp', 'images/brand/logo/loxley-wordmark-on-dark.svg',
          'favicon.svg', 'apple-touch-icon.png']


def strip(s):
    s = re.sub(r'<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->', '', s, flags=re.S)
    s = re.sub(r'<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->', '', s, flags=re.S)
    s = re.sub(r'\s*<link rel="canonical"[^>]*>', '', s)
    s = re.sub(r'\s*<link rel="icon" type="image/png"[^>]*>', '', s)
    # No page beacon from the preview: its pages carry real paths and would count as visits.
    s = re.sub(r' data-lf-api="[^"]*"', '', s)
    s = s.replace('href="/favicon.svg"', 'href="favicon.svg"').replace('href="/apple-touch-icon.png"', 'href="apple-touch-icon.png"')
    s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  ' + ROBOTS, 1)
    # clean paths point at the preview's own copies, so the whole new site can be walked
    for c in CLEAN:
        s = re.sub(r'href="/' + re.escape(c) + r'(#[^"]*)?"', lambda m: 'href="' + c + '.html' + (m.group(1) or '') + '"', s)
    s = s.replace('href="/"', 'href="./"')
    return s


def referenced(html):
    """Local files a page points at (src, href, srcset, poster, data-*, url()), relative to the site root."""
    found = set()
    for m in re.finditer(r'(?:src|href|poster|data-[a-z-]+)="([^"#?]+)"|srcset="([^"]+)"|url\(["\']?([^"\')]+)', html):
        for v in filter(None, m.groups()):
            for part in v.split(','):
                u = part.strip().split(' ')[0].lstrip('/')
                if u and not u.startswith(('http', 'mailto', 'tel', 'sms', 'data:')) and os.path.isfile(os.path.join(SRC, u)):
                    found.add(u)
    return found


def main(dest_root, slug='new-site-371cf1'):
    dst = os.path.join(dest_root, 'private', slug)
    os.makedirs(dst, exist_ok=True)
    files = ASSETS + ['images/hero/' + f for f in os.listdir(os.path.join(SRC, 'images/hero'))]
    files += ['images/v2/' + f for f in os.listdir(os.path.join(SRC, 'images/v2'))]
    for p in PAGES:
        files += sorted(referenced(open(os.path.join(SRC, p)).read()))
    files += sorted(referenced(open(os.path.join(SRC, 'css/v2.css')).read()) | referenced(open(os.path.join(SRC, 'css/v2-pages.css')).read()))
    files = sorted(set(files))
    for f in files:
        os.makedirs(os.path.dirname(os.path.join(dst, f)), exist_ok=True)
        shutil.copy2(os.path.join(SRC, f), os.path.join(dst, f))
    for p in PAGES:
        out = strip(open(os.path.join(SRC, p)).read())
        assert ROBOTS in out and 'googletagmanager' not in out, p
        open(os.path.join(dst, p), 'w').write(out)
    logo = os.path.join(SRC, 'scripts/logo/out/page')
    if os.path.exists(os.path.join(logo, 'index.html')):
        os.makedirs(os.path.join(dst, 'logo'), exist_ok=True)
        for f in os.listdir(logo):
            if f != 'index.html':
                shutil.copy2(os.path.join(logo, f), os.path.join(dst, 'logo', f))
        c = open(os.path.join(logo, 'index.html')).read()
        i = c.index('<div class="wrap">')
        open(os.path.join(dst, 'logo', 'index.html'), 'w').write(
            '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n'
            + ROBOTS + '\n<link rel="icon" href="../favicon.svg">\n' + c[:i] + '\n</head>\n<body>\n' + c[i:] + '\n</body>\n</html>\n')
    print('wrote', dst)


if __name__ == '__main__':
    main(*sys.argv[1:])
