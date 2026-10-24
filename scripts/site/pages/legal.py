"""The legal pages: /terms, /privacy.

/cancellation is gone (Mick, 2026-10-19: the terms live in the booking agreement, shown in full at
checkout); netlify.toml sends its old links to /book.

The words are legal content and are carried exactly as they stood on the old pages, em dashes
included (the one place the no-dash rule does not reach). Only the markup changed: the old
h3 headings are h2, the classes and inline styles are gone. Restyle here, never reword. One ruled
exception: on /terms, "pets" became "dogs" to match the stay agreement (Mick, 2026-10-19: dogs only)."""
import re

import build_v2 as B


def tidy(head):
    """head_from adds a blank line before </head> on every build when there is no preload;
    keep it at one so a rebuild writes the same file (reported to the Forge)."""
    return re.sub(r'\s*</head>\n$', '\n</head>\n', head)


TERMS = ('Terms &amp; Conditions', 'The Ground Rules', 'Written like a conversation, not a contract.', '''
      <p>Loxley Forest is our home. When you book a stay, you're a guest in it — and we treat you like one. Here's what we ask in return.</p>

      <h2>Occupancy</h2>
      <p>Each treehouse accommodates up to 6 guests. All guests must be listed at the time of booking. If your group changes, just let us know — we're flexible, not rigid.</p>

      <h2>Children</h2>
      <p>Absolutely welcome. We have two of our own. The rope bridge and elevated platforms require supervision of young children — the forest is an adventure, and we want everyone safe to enjoy it.</p>

      <h2>Dogs</h2>
      <p>Well-behaved dogs are welcome. We ask that you let us know at booking so we can prepare. Please keep dogs off the furniture and bedding, and clean up after them on the trails. If your dog has an accident, we get it — just let us know.</p>

      <h2>Smoking</h2>
      <p>No smoking in or near the treehouses. The structures are canvas and wood, suspended in a forest. We think you understand why. If you'd like to smoke, we ask that you do so at the fire pit area on the ground level, away from the structures.</p>

      <h2>Fires &amp; Safety</h2>
      <p>The fire pit is yours to enjoy. We provide firewood and s'mores kits. We ask that you never use gasoline, lighter fluid, or accelerants. Keep fires in the fire pit only — never on the decks or platforms. Extinguish completely before going to sleep.</p>

      <h2>The Property</h2>
      <p>Loxley Forest is 42 acres of working forest. Trails are natural and unimproved — wear appropriate footwear. The creek and terrain can be slippery. Please stay on marked trails and respect the forest. This land has been here a long time, and we'd like to keep it that way.</p>

      <h2>Noise</h2>
      <p>We don't have formal quiet hours — it's never been an issue. The forest does the work. We ask that you keep noise at a level that respects the natural setting, especially after dark. No amplified music outdoors.</p>

      <h2>Damage &amp; Liability</h2>
      <p>We ask that you treat the treehouses with care. If something breaks or gets damaged during your stay, please let us know — accidents happen and honesty goes a long way. Guests are responsible for damage beyond normal wear.</p>
      <p>Loxley Forest is not responsible for injury resulting from use of the property, trails, fire pit, rope bridges, or natural features. By booking, you acknowledge the inherent adventure of staying in a treehouse 60 feet in the air in a mountain forest — and you embrace it.</p>

      <h2>Check-In &amp; Check-Out</h2>
      <p>Check-in: 3:00 PM. Check-out: 11:00 AM. Early check-in or late check-out may be available — just ask. We'll accommodate when we can.</p>

      <h2>Changes to These Terms</h2>
      <p>We may update these terms as our property evolves. The current version always lives at this page.</p>

      <p>Questions about anything here? Call <a href="tel:+17065024823">706-502-4823</a> or email <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a>. We'd rather talk it through than have you guess.</p>
      <p class="lf-legal-sign">— Mick &amp; Livy</p>
''')

PRIVACY = ('Privacy', 'Your Privacy at Loxley', 'Simple, plain-spoken, and personal.', '''
      <p>We keep this simple because we believe it should be.</p>
      <p>When you book a stay, submit an inquiry, or join our email list, we collect the information you provide — your name, email, phone number, and stay preferences. That's it.</p>
      <p>If you type your email at checkout and leave before paying, we keep it with the dates you chose so we can write to you personally about them, and it never joins our email list unless you tick the box.</p>
      <p>We use this information for one purpose: to communicate with you about your stay, your experience, and occasional updates from the forest. We will never sell, rent, or share your personal information with third parties. Period.</p>
      <p>If you receive emails from us and decide you'd rather not, every email includes an unsubscribe link that works immediately. No hoops.</p>
      <p>We use cookies to understand how visitors interact with our website so we can make it better. No personal data is sold through these tools.</p>
      <p>If you have questions about your privacy or want us to remove your information entirely, email <a href="mailto:stay@loxleyforest.com">stay@loxleyforest.com</a> or call <a href="tel:+17065024823">706-502-4823</a>. We'll take care of it personally.</p>
      <p class="lf-legal-sign">— Mick &amp; Livy</p>
''')

def legal(page, text):
    eyebrow, h1, sub, words = text
    head, gtm = B.head_from(page)
    head = tidy(head)
    body = f'''
    <section class="lf-sec lf-dark lf-legal-top" aria-labelledby="lg-h">
      <div class="lf-wrap">
        <p class="lf-eyebrow">{eyebrow}</p>
        <h1 class="lf-h1" id="lg-h">{h1}</h1>
        <p class="lf-lead">{sub}</p>
      </div>
    </section>

    <section class="lf-sec lf-light lf-legal">
      <div class="lf-legal__text">
{words}      </div>
    </section>
'''
    return page, head, gtm, body, '/book', False


def page_terms():
    return legal('terms.html', TERMS)


def page_privacy():
    return legal('privacy.html', PRIVACY)



PAGES = [page_terms, page_privacy]

CSS = '''
.lf-legal-top { padding-top: calc(var(--hdr-h) + clamp(44px, 8vw, 96px)); padding-bottom: clamp(48px, 7vw, 80px); }
.lf-legal-top .lf-wrap { max-width: 40rem; }
.lf-legal-top .lf-h1 { font-size: clamp(2.6rem, 8vw, 4.2rem); }
.lf-legal { padding-top: clamp(48px, 7vw, 88px); }
.lf-legal__text { max-width: 40rem; margin: 0 auto; font-size: 1.2rem; line-height: 1.72; color: var(--bark); text-wrap: pretty; }
.lf-legal__text p { margin: 0; }
.lf-legal__text p + p { margin-top: 1em; }
.lf-legal__text h2 { margin: 2.1em 0 0.45em; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 1.8rem; line-height: 1.15; color: var(--forest-deep); text-wrap: balance; }
.lf-legal__text h2 + p { margin-top: 0; }
.lf-legal__text a { color: var(--forest-deep); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; white-space: nowrap; }
.lf-legal__text a:hover { color: var(--bark); }
.lf-legal__text .lf-legal-sign { margin-top: 1.6em; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 1.4rem; color: var(--stone); }
@media (max-width: 767px) { .lf-legal__text { font-size: 1.12rem; } .lf-legal__text h2 { font-size: 1.6rem; } }
'''
