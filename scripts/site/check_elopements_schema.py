#!/usr/bin/env python3
"""The structured data on /elopements says only what the visible page says.

    python3 scripts/site/check_elopements_schema.py

Reads the built elopements.html (never the live site) and proves:
  - one schema.org block, in the head, valid JSON, written by scripts/site/pages/elopements.py
    schema_elopements() (a rebuild today gives the same block, so the page is not stale);
  - its type is Service with serviceType "Elopement stay"; every @type in it is on the short list
    below; the word "venue" is nowhere in it (the agreement: not a commercial or licensed wedding
    venue), and no type claims an event or a venue;
  - the offers are the cards, in the cards' order: the same names, the same prices as the cards print
    ("$6,500" is 6500 USD), each card saying "plus tax" and each offer saying tax is not included;
  - every sentence in every description, the audience line, the service's name and the town are in
    the page's visible text, word for word;
  - the Falls' availabilityStarts is the card's "From October 2027" and Firelight's availabilityEnds is
    its "through June 30, 2027".
Exit 1 on any failure. Nothing is written.
"""
import html as htmllib
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
os.chdir(ROOT)

TYPES = {'Service', 'Offer', 'UnitPriceSpecification', 'LodgingBusiness', 'PostalAddress', 'PeopleAudience',
         'City', 'State'}
fails = 0


def check(ok, what):
    global fails
    print(('  ok   ' if ok else '  FAIL ') + what)
    if not ok:
        fails += 1


def norm(s):
    return re.sub(r'\s+', ' ', htmllib.unescape(s)).strip()


def types_in(node, out):
    if isinstance(node, dict):
        if '@type' in node:
            out.add(node['@type'])
        for v in node.values():
            types_in(v, out)
    elif isinstance(node, list):
        for v in node:
            types_in(v, out)
    return out


def strings_in(node, out):
    if isinstance(node, dict):
        for v in node.values():
            strings_in(v, out)
    elif isinstance(node, list):
        for v in node:
            strings_in(v, out)
    elif isinstance(node, str):
        out.append(node)
    return out


def main():
    page = open('elopements.html', encoding='utf-8').read()
    head, body = page.split('</head>', 1)

    blocks = re.findall(r'<!-- Schema: ([A-Za-z]+) -->\s*<script type="application/ld\+json">(.*?)</script>', page, re.S)
    check(len(blocks) == 1, f'one schema block on the page ({len(blocks)})')
    if not blocks:
        return finish()
    check(head.count('<!-- Schema: ') == 1, 'the block is in the head')
    kind, raw = blocks[0]
    try:
        data = json.loads(raw.replace('<\\/', '</'))
    except ValueError as e:
        check(False, f'the block is valid JSON ({e})')
        return finish()
    check(True, 'the block is valid JSON')

    # The same block a build writes today.
    spec = importlib.util.spec_from_file_location('build_v2', os.path.join(HERE, 'build_v2.py'))
    B = importlib.util.module_from_spec(spec)
    sys.modules['build_v2'] = B
    spec.loader.exec_module(B)
    spec = importlib.util.spec_from_file_location('lfpage_elopements', os.path.join(HERE, 'pages', 'elopements.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    check(data == mod.schema_elopements(), 'the block equals schema_elopements() today (the page is not stale)')

    # The type and the words.
    check(data.get('@type') == 'Service' and kind == 'Service', 'the type is Service')
    check(data.get('serviceType') == 'Elopement stay', 'serviceType is "Elopement stay"')
    found = types_in(data, set())
    check(found <= TYPES, f'every @type is on the list: {", ".join(sorted(found))}' + ('' if found <= TYPES else f' (not: {", ".join(sorted(found - TYPES))})'))
    text = json.dumps(data, ensure_ascii=False)
    check('venue' not in text.lower(), 'the word "venue" is nowhere in the block')
    check(not re.search(r'"@type":\s*"(Event|EventVenue|Place|CivicStructure)"', text), 'no type claims an event or a venue')

    # The visible page.
    visible = norm(re.sub(r'<(script|style)\b.*?</\1>', ' ', body, flags=re.S | re.I).replace('<', ' <').replace('>', '> '))
    visible = norm(re.sub(r'<[^>]+>', ' ', visible))
    cards = re.findall(r'<h3 class="lf-h3 lf-pkg__name"[^>]*>([^<]+)</h3>\s*<p class="lf-pkg__price">(\$[\d,]+) <span>([^<]*)</span>', page)
    offers = data.get('offers') or []
    check(len(cards) == 4 and len(offers) == 4, f'four cards and four offers ({len(cards)}, {len(offers)})')
    for (name, price, tax), o in zip(cards, offers):
        amount = int(price.replace('$', '').replace(',', ''))
        spec_ = o.get('priceSpecification') or {}
        check(o.get('name') == name, f'offer "{o.get("name")}" is the card "{name}", in the card\'s place')
        check(o.get('price') == amount and spec_.get('price') == amount, f'  its price is the card\'s {price} ({o.get("price")})')
        check(o.get('priceCurrency') == 'USD' and spec_.get('priceCurrency') == 'USD', '  in USD')
        check(tax == 'plus tax' and spec_.get('valueAddedTaxIncluded') is False, '  the card says plus tax and the offer says tax is not included')
        check(o.get('itemOffered', {}).get('name') == name and o.get('itemOffered', {}).get('serviceType') == 'Elopement stay', '  the thing offered is the package as an elopement stay')
        for sentence in re.split(r'(?<=[.:!?])\s+', norm(o.get('description', ''))):
            check(sentence and sentence in visible, f'  on the page: "{sentence[:70]}{"..." if len(sentence) > 70 else ""}"')

    for sentence in re.split(r'(?<=[.:!?])\s+', norm(data.get('description', ''))):
        check(sentence and sentence in visible, f'service description on the page: "{sentence[:70]}..."')
    aud = (data.get('audience') or {}).get('audienceType', '')
    check(aud and aud.lower() in visible.lower(), f'the audience line is the page\'s: "{aud}"')
    check(data.get('name') in visible, f'the service name is on the page: "{data.get("name")}"')
    area = data.get('areaServed') or {}
    town = f'{area.get("name")}, {(area.get("containedInPlace") or {}).get("name")}'
    check(town in visible, f'the town is on the page: "{town}"')
    prov = data.get('provider') or {}
    check(prov.get('@id') == B.SITE + '/#lodging' and prov.get('address') == B.ADDRESS, 'the provider is the home page\'s LodgingBusiness, by its @id, with its address')
    check(data.get('url') == B.SITE + '/elopements' and all(o.get('url') == B.SITE + '/elopements#packages' for o in offers), 'the urls are this page and its packages')

    by_name = {o['name']: o for o in offers}
    falls = by_name.get(mod.WATERFALL_NAME, {})
    check(str(falls.get('availabilityStarts', '')).startswith('2027-10') and 'From October 2027' in visible,
          f'{mod.WATERFALL_NAME}: availabilityStarts {falls.get("availabilityStarts")} is the card\'s "From October 2027"')
    fire = by_name.get(mod.FIRELIGHT_NAME, {})
    check(fire.get('availabilityEnds') == '2027-06-30' and 'through June 30, 2027' in visible,
          f'{mod.FIRELIGHT_NAME}: availabilityEnds {fire.get("availabilityEnds")} is the card\'s "through June 30, 2027"')
    for n, o in by_name.items():
        if n not in (mod.WATERFALL_NAME, mod.FIRELIGHT_NAME):
            check('availability' not in text or not any(k.startswith('availability') for k in o), f'{n}: no availability claim')
    check(not any(k in text for k in ('"availability"', 'PreOrder', 'InStock', 'aggregateRating', 'review')), 'no stock, pre-order, rating or review claim')
    return finish()


def finish():
    print(f'{fails} failed')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
