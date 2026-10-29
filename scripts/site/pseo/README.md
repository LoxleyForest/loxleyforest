# The search landing pages: the data

`scripts/site/pages/pseo.py` builds one page per entry in `pages.json`, as `<slug>.html` at the repo
root, when `python3 scripts/site/build_v2.py` runs. Its docstring lists every guard. This repository
is public: these files hold only what a page prints. Evidence, ranks and notes stay in loxley-rescue.

## pages.json (a list, in the order pages are built)

| field | what |
|---|---|
| `set` | A place, B season, C occasion, D getaway, E question. Pages of one set are compared for sameness. |
| `slug` | the file and the address: `elope-in-dahlonega` is `/elope-in-dahlonega` |
| `title`, `meta` | the head's title (70 characters at most) and description (160 at most) |
| `eyebrow`, `h1`, `h1_em` | the small line over the headline, the headline, its italic end (may be empty) |
| `crumb` | the page's own word in the breadcrumb; its words are masked when siblings are compared |
| `hero` | `{"photo": "<name in images/v2>", "alt": "..."}` |
| `lead` | `{"text": "...", "sources": ["repo/path:line", ...]}`, the line under the headline |
| `hub` | the site page above it (`/elopements`, `/book`, ...) |
| `links_to` | three or more site paths or landing pages; an anchor must exist on its page |
| `blocks` | names in `blocks.json`, in order; at most two may be shared with another page |
| `facts` | ids in `facts.json` |
| `faq` | `[{"q": "...", "a": "...", "sources": [...]}]`, also the page's FAQPage schema |
| `quote` | `{"id": "A41", "text": "...", "credit": "..."}`: a guest's words, word for word from loxley-rescue `docs/reviews/all.md`, under a credit the site already shows; trims are `" ... "` |
| `form` | `elopement` (the /elopements form) or `booking` (the /book form); either carries a hidden `page` field naming the page |
| `form_intro` | optional block name: the words over the form |
| `heard` | optional; `false` holds the page until Mick has heard its words |
| `updated` | the sitemap's lastmod, `YYYY-MM-DD` |

## blocks.json (by name)

`{"eyebrow", "heading", "heading_em", "text", "sources", "photo", "alt", "shared", "heard"}`. `text` is
plain sentences, paragraphs split by a blank line, no markup. `sources` names where each claim comes
from, as `repo/path:line`. `"heard": false` holds every page that carries the block. `"shared": true`
counts a block as shared even when one page uses it.

## facts.json (by id)

`{"text", "source", "url", "quote", "checked", "recheck"}`. `quote` is the source's own words, copied
from the page at `url` on the day `checked`. A drive time or distance may appear on a page only in a
fact row whose `quote` carries the same number. `"recheck": true` holds every page that cites the row
until the row is read again live.

## Commands

    python3 scripts/site/build_v2.py                  build (held and refused pages are listed at the end)
    python3 scripts/site/check_pseo.py                the pages on disk are what the data makes
    python3 scripts/site/check_pseo.py --prove        one bad page per guard, each refused
    python3 scripts/site/check_pseo.py --preview DIR  every page, held ones too, outside the repo
    python3 scripts/site/check_reviews.py             the guests' words, these pages' included
