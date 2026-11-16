#!/usr/bin/env python3
"""The giveaway form is the engine's contract, and the giveaway pages stay in shadow until Mick says live.

    python3 scripts/site/check_giveaway.py [root]

The workshop Forge's register (loxley-rescue, 2026-11-07) reads the Netlify form named "giveaway"
by these fields exactly: first_name (required), email (required), eligible (a checkbox, value yes,
required), letters (a checkbox, value yes, NOT required, unticked), src (hidden), and the
honeypot. The form lands on /giveaway-entered, never on a path holding /success (check_forms.py
NOT_INQUIRY). Both pages are noindex and out of sitemap.xml; while the form is closed (hidden),
no other page may link /giveaway. Exit 1 names what is wrong. Standard library only.
"""
import os
import re
import sys

WANT = {  # name: (type, required, value, checked)
    'form-name': ('hidden', False, 'giveaway', None),
    'src': ('hidden', False, 'direct', None),
    'first_name': ('text', True, None, None),
    'email': ('email', True, None, None),
    'eligible': ('checkbox', True, 'yes', False),
    'letters': ('checkbox', False, 'yes', False),
    'bot-field': (None, False, None, None),
}


def attr(tag, name):
    m = re.search(r'\b%s=["\']([^"\']*)' % re.escape(name), tag, re.I)
    return m.group(1) if m else None


def has(tag, name):
    return re.search(r'(?<![\w-])%s(?=[\s>/=])' % re.escape(name), tag, re.I) is not None


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..')
    bad = []
    page = os.path.join(root, 'giveaway.html')
    entered = os.path.join(root, 'giveaway-entered.html')
    for p in (page, entered):
        if not os.path.exists(p):
            bad.append('missing %s' % os.path.basename(p))
    if bad:
        print('\n'.join(bad)); return 1
    html = open(page, encoding='utf-8').read()
    done = open(entered, encoding='utf-8').read()
    for name, text in (('giveaway.html', html), ('giveaway-entered.html', done)):
        if 'name="robots" content="noindex' not in text:
            bad.append('%s lost its noindex' % name)
        if '{{' in text:
            bad.append('%s keeps a merge token' % name)
        if re.search('[–—]', re.sub(r'<script.*?</script>|<head>.*?</head>', '', text, flags=re.S)):
            bad.append('%s has an en or em dash in its words' % name)
    forms = re.findall(r'<form\b.*?</form>', html, re.I | re.S)
    forms = [f for f in forms if attr(f[:f.index('>') + 1], 'name') == 'giveaway']
    if len(forms) != 1:
        bad.append('giveaway.html has %d forms named giveaway, want 1' % len(forms))
        print('\n'.join(bad)); return 1
    form = forms[0]
    tag = form[:form.index('>') + 1]
    if not re.search(r'data-netlify=["\']true', tag):
        bad.append('the form is not a Netlify form')
    if attr(tag, 'data-netlify-honeypot') != 'bot-field':
        bad.append('the honeypot is not bot-field')
    action = (attr(tag, 'action') or '').split('?')[0]
    if action not in ('/giveaway-entered', '/giveaway-entered.html'):
        bad.append('the form posts to %r, not /giveaway-entered' % action)
    if '/success' in action:
        bad.append('the form posts to a /success path, where Google counts an inquiry')
    seen = {}
    for inp in re.findall(r'<input\b[^>]*>', form, re.I):
        n = attr(inp, 'name')
        if n:
            seen[n] = inp
    extra = sorted(set(seen) - set(WANT))
    missing = sorted(set(WANT) - set(seen))
    if extra:
        bad.append('fields the contract does not name: %s' % ', '.join(extra))
    if missing:
        bad.append('fields missing: %s' % ', '.join(missing))
    for n, (typ, req, val, checked) in WANT.items():
        inp = seen.get(n)
        if not inp:
            continue
        if typ and (attr(inp, 'type') or 'text') != typ:
            bad.append('%s is type %r, want %r' % (n, attr(inp, 'type'), typ))
        if has(inp, 'required') != req:
            bad.append('%s %s required' % (n, 'is' if not req else 'is not'))
        if val is not None and attr(inp, 'value') != val:
            bad.append('%s has value %r, want %r' % (n, attr(inp, 'value'), val))
        if checked is not None and has(inp, 'checked') != checked:
            bad.append('%s is %s' % (n, 'ticked by default' if not checked else 'unticked'))
    if 'name="gclid"' in form:
        bad.append('the form carries the ad click fields; an entry is not an inquiry')
    if 'id="gw-src"' not in form or 'getElementById("gw-src")' not in html:
        bad.append('src is not filled from the landing URL by the page')
    # The closed state is on the wrapper (Netlify rewrites the form tag at deploy), with the
    # fields disabled; both or neither.
    wrap = re.search(r'<div id="gw-formwrap"[^>]*>', html)
    if not wrap:
        bad.append('the form has no gw-formwrap wrapper')
    closed = bool(wrap) and has(wrap.group(0), 'hidden')
    if closed != ('<fieldset class="gw-fields" disabled>' in form):
        bad.append('the form is hidden but not disabled, or disabled but not hidden')
    # Shadow: not in the sitemap; while closed, linked from no other page.
    sm = open(os.path.join(root, 'sitemap.xml'), encoding='utf-8').read()
    if 'loxleyforest.com/giveaway' in sm:
        bad.append('sitemap.xml lists /giveaway')
    links = []
    for name in sorted(os.listdir(root)):
        if name.endswith('.html') and name not in ('giveaway.html', 'giveaway-entered.html'):
            if re.search(r'href=["\'](?:https://loxleyforest\.com)?/giveaway(?:\.html)?["\'#?]', open(os.path.join(root, name), encoding='utf-8').read()):
                links.append(name)
    if closed and links:
        bad.append('the form is closed but /giveaway is linked from: %s' % ', '.join(links))
    if re.search(r'<form\b', done, re.I):
        bad.append('giveaway-entered.html carries a form')
    state = 'closed (hidden, disabled)' if closed else 'open'
    print('check_giveaway: the form %s, %d fields as the engine reads them, lands on %s; linked from %s%s'
          % (state, len(seen), action, ', '.join(links) or 'no page', '; %d wrong' % len(bad) if bad else ''))
    for b in bad:
        print('  WRONG: ' + b)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
