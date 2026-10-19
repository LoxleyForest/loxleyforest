"""Questions (faq.html) in the new design.

One list, QA, feeds both the visible answers and the FAQPage schema in the head, so the two
can never drift apart. The answers are the old page's, tightened, with the rulings of
2026-10-13 applied (pets, capacity, TreeMail, no Canopy Club). The contact form is the old
`faq-contact` Netlify form, field for field.
"""
import html
import json
import re

import build_v2 as B

# (question, answer as HTML). Plain sentences, no em or en dashes.
QA = [
    ('Is the rope bridge safe?',
     'Yes. It was engineered and built by an elite team of arborists and riggers, and Mick walks it daily. '
     'It carries over two hundred guests a year, and nobody has ever turned back. It sways, by design. '
     "It's the most photographed, most talked-about, most life-changing sixty seconds of your stay."),
    ("What if I'm afraid of heights?",
     'Some of our best reviews come from guests who were terrified. The bridge is built to feel safe: the ropes '
     'are chest-high, the planks are solid, and the sway is gentle. A thirty-foot rope bridge comes first, as a '
     'warm-up. Most guests who are nervous on the first crossing are running across it by the second. '
     "We've never had a guest who regretted coming."),
    ('How many guests can stay?',
     'The treehouse sleeps 4 comfortably, and up to 6 guests in all. Children are welcome. No smoking.'),
    ('Can I bring my dog?',
     'Yes. Well-behaved pets are welcome. Know the way in before you decide: the hundred-foot rope bridge sways, '
     "and it sits sixty feet up. If you're not sure how your dog will take it, "
     '<a href="mailto:stay@loxleyforest.com">write to us</a> before you book and we\'ll talk it through. '
     'We want every guest, two-legged and four-legged, to be safe and comfortable at sixty feet.'),
    ("What's included in my stay?",
     'Luxury linens and towels. Heat for the cold seasons, and the canopy\'s own cooling in summer. A fully '
     'equipped kitchen. A private deck. A fire pit on the forest floor. Trails across 42 acres. TreeMail: fresh '
     'morning pastries in the box where you enter the bridges, around 8:30 every morning, unless you\'ve booked '
     "the Dawn Table or Morning Moments. And silence. We don't include televisions. On purpose."),
    ('What should I bring?',
     'Comfortable shoes for the trails. Layers, because mountain weather changes. A book you\'ve been meaning to '
     'read. Groceries if you plan to cook. A willingness to do absolutely nothing.'),
    ('Is the treehouse heated and air-conditioned?',
     'Heated for the cold seasons. In summer the canopy itself is the climate system: the cove forest runs cooler '
     'than the valley floor, and the windows open to a cross-breeze sixty feet up. No compressor hum, no recycled '
     "air, just a forest that's been cooling itself for a few hundred years. You're suspended inside it."),
    ('Is there WiFi?',
     'Yes. But we encourage you not to use it.'),
    ('What about weather?',
     'Rain in the mountains is its own kind of magic. The treehouse is heated, with the canopy\'s natural cooling '
     "in summer, and the canopy gives the deck natural protection. We've hosted guests in every kind of weather, "
     'and the reviews always say the same thing: worth it.'),
    ('How do I get there?',
     "We're just over an hour north of Atlanta, in the foothills above Dahlonega. Detailed directions come with "
     "your booking confirmation. The last mile is a mountain road. That's how you know you're close."),
    ('What is your cancellation policy?',
     'Half of your stay is paid at booking and the balance 30 days before check-in. We don\'t offer cash refunds '
     'for cancellations. Instead we give you a credit for a future stay, redeemable within 6 months of your '
     "original booking date. If we rebook your dates, we'll be more flexible. The full policy is on "
     '<a href="/cancellation">our cancellation page</a>.'),
    ('Can I celebrate an anniversary or birthday here?',
     "Possibly the best place to do it. We've hosted hundreds. Add our Romance Package or Celebration Package, "
     'or ask about custom arrangements. <a href="/experiences">See the experiences</a>.'),
    ('Do you host elopements?',
     'Yes. Three packages from $4,500 to $10,500, and three ceremony spaces, the rope bridge among them. '
     '<a href="/elopements">See the elopements page</a> for details.'),
    ('Why should I book direct?',
     "Best rate guaranteed. You're booking with the family who built this place, not a platform. If you find a "
     "lower price anywhere, we'll match it and add a complimentary experience to your stay."),
]


def _plain(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s))


def schema():
    data = {'@context': 'https://schema.org', '@type': 'FAQPage',
            'mainEntity': [{'@type': 'Question', 'name': q,
                            'acceptedAnswer': {'@type': 'Answer', 'text': _plain(a)}} for q, a in QA]}
    body = json.dumps(data, indent=2, ensure_ascii=False).replace('</', '<\\/')
    return '<script type="application/ld+json">\n' + body + '\n  </script>'


def items():
    out = []
    for i, (q, a) in enumerate(QA, 1):
        out.append(f'''          <div class="lf-faq__item">
            <h2 class="lf-faq__q"><button type="button" id="faq-q{i}" aria-expanded="true" aria-controls="faq-a{i}">{html.escape(q, quote=False)}<span class="lf-faq__icon" aria-hidden="true"></span></button></h2>
            <div class="lf-faq__a" id="faq-a{i}" role="region" aria-labelledby="faq-q{i}"><p>{a}</p></div>
          </div>''')
    return '\n'.join(out)


def page_faq():
    head, gtm = B.head_from('faq.html', '<link rel="preload" as="image" type="image/webp" href="images/v2/eq3a1665-1600.webp" media="(min-width: 768px)" fetchpriority="high">\n  <link rel="preload" as="image" type="image/webp" href="images/v2/eq3a1665-800.webp" media="(max-width: 767px)" fetchpriority="high">')
    # The schema is written from QA on every build, so it always says what the page says.
    head, n = re.subn(r'<script type="application/ld\+json">.*?</script>', lambda m: schema(), head, count=1, flags=re.S)
    assert n == 1, 'faq.html head lost its FAQPage schema'
    body = f'''
    <!-- ========== HERO ========== -->
    <section class="lf-hero lf-hero--page lf-hero--short" aria-label="Questions">
      <div class="hero__media"><picture><source media="(max-width: 767px)" srcset="images/v2/eq3a1665-800.webp" type="image/webp"><img src="images/v2/eq3a1665-1600.webp" width="1600" height="1067" alt="The cove forest in fall, gold and orange leaves above the forest floor" fetchpriority="high"></picture></div>
      <div class="lf-hero__shade"></div>
      <div class="lf-hero__inner">
        <p class="lf-eyebrow">Questions</p>
        <h1 class="lf-h1">Everything you're wondering. <em>And a few things you haven't thought of yet.</em></h1>
      </div>
    </section>

    <!-- ========== THE ANSWERS (buttons with aria-expanded; open without script) ========== -->
    <section class="lf-sec lf-light" aria-label="Questions and answers">
      <div class="lf-wrap lf-faq lf-rise" data-faq>
{items()}
      </div>
      <script>
        (function () {{
          var list = document.querySelector('[data-faq]');
          if (!list) return;
          list.querySelectorAll('.lf-faq__q button').forEach(function (b) {{
            var panel = document.getElementById(b.getAttribute('aria-controls'));
            function set(open) {{ b.setAttribute('aria-expanded', open ? 'true' : 'false'); panel.hidden = !open; }}
            set(false);
            b.addEventListener('click', function () {{ set(b.getAttribute('aria-expanded') !== 'true'); }});
          }});
        }})();
      </script>
    </section>

    <!-- ========== STILL HAVE QUESTIONS (the faq-contact Netlify form, unchanged) ========== -->
    <section class="lf-sec lf-dark" id="contact" aria-labelledby="ct-h">
      <div class="lf-wrap lf-split">
        <div>
          <p class="lf-eyebrow lf-rise">Ask us</p>
          <h2 class="lf-h2 lf-rise" id="ct-h">Still have questions? <em>Mick or Livy will answer.</em></h2>
          <p class="lf-lead lf-rise">Not a chatbot. We'll get back to you within a few hours.</p>
          <p class="lf-body lf-rise" style="margin-top:18px"><a class="lf-faq__plain" href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a><br><a class="lf-faq__plain" href="tel:+17065024823">706-502-4823</a></p>
          <div class="lf-actions lf-rise"><a href="/book" class="lf-btn">{B.ACORN}Book your dates</a></div>
        </div>
        <div class="lf-rise">
          <form class="lf-form" name="faq-contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/faq?submitted=1#contact">
            <input type="hidden" name="form-name" value="faq-contact">
            <p style="display:none;"><label>Don't fill this out: <input name="bot-field"></label></p>
            <label for="faq-name">Name</label>
            <input type="text" id="faq-name" name="name" required autocomplete="name">
            <label for="faq-email">Email</label>
            <input type="email" id="faq-email" name="email" required autocomplete="email">
            <label for="faq-message">Your question</label>
            <textarea id="faq-message" name="message" rows="5" required></textarea>
            <button type="submit" class="lf-btn lf-btn--ghost">Send your question</button>
          </form>
          <div id="faq-success" class="lf-form__done" role="status" hidden>
            <p>The forest knows you're coming. We'll be in touch soon.</p>
            <p class="lf-form__sig">Mick &amp; Livy</p>
          </div>
        </div>
      </div>
      <script>
        (function () {{
          if (location.search.indexOf('submitted=1') !== -1) {{
            var form = document.querySelector('form[name="faq-contact"]');
            var success = document.getElementById('faq-success');
            if (form) form.style.display = 'none';
            if (success) success.hidden = false;
          }}
        }})();
      </script>
    </section>
'''
    return 'faq.html', head, gtm, body, '/book', False


PAGES = [page_faq]

CSS = '''
/* a shorter page hero for pages that are mostly words (questions, guides) */
@media (min-width: 900px) { .lf-hero--short, .lf-hero--short .hero__media { min-height: 64svh; } }
@media (max-width: 767px) { .lf-hero--short .hero__media { height: 40svh; min-height: 260px; } }

/* questions: one rule between each, the answer under its button */
.lf-faq { max-width: 46rem; }
.lf-faq__item { border-top: 1px solid rgba(26, 46, 26, 0.16); }
.lf-faq__item:last-child { border-bottom: 1px solid rgba(26, 46, 26, 0.16); }
.lf-faq__q { margin: 0; font: inherit; }
.lf-faq__q button {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 64px; padding: 20px 0;
  background: none; border: 0; text-align: left; cursor: pointer; color: var(--forest-deep);
  font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: clamp(1.45rem, 4.6vw, 1.8rem); line-height: 1.2;
}
.lf-faq__q button:focus-visible { outline: 2px solid var(--forest-deep); outline-offset: 4px; }
.lf-faq__icon { position: relative; flex: none; width: 16px; height: 16px; }
.lf-faq__icon::before, .lf-faq__icon::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1.5px; margin-top: -0.75px; background: var(--stone); transition: transform 0.25s var(--ease-natural); }
.lf-faq__icon::after { transform: rotate(90deg); }
.lf-faq__q button[aria-expanded="true"] .lf-faq__icon::after { transform: rotate(0deg); }
.lf-faq__a { padding: 0 0 26px; }
.lf-faq__a p { margin: 0; max-width: 40rem; font-size: 1.15rem; line-height: 1.72; color: var(--stone); }
.lf-faq__a a, .lf-faq__plain { color: inherit; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
.lf-dark .lf-faq__plain { color: var(--on-dark); }

/* the contact form, on the dark forest */
.lf-form { display: grid; gap: 8px; max-width: 30rem; }
.lf-form label { margin-top: 12px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--on-dark-muted); }
.lf-form input[type="text"], .lf-form input[type="email"], .lf-form textarea {
  width: 100%; min-height: 52px; padding: 12px 16px; border: 1px solid rgba(247, 243, 237, 0.35); border-radius: 0;
  background: rgba(247, 243, 237, 0.06); color: var(--on-dark); font: 400 1.15rem 'Cormorant Garamond', Georgia, serif;
}
.lf-form textarea { min-height: 140px; resize: vertical; }
.lf-form input:focus-visible, .lf-form textarea:focus-visible { outline: 2px solid var(--on-dark); outline-offset: 2px; }
.lf-form .lf-btn { margin-top: 18px; justify-self: start; }
.lf-form__done p { margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; line-height: 1.35; color: var(--on-dark); }
.lf-form__done .lf-form__sig { margin-top: 12px; font-style: italic; font-size: 1.25rem; color: var(--on-dark-muted); }
'''
