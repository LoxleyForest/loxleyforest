/* ============================================================
   LOXLEY FOREST — GUEST REVIEWS ENGINE
   Single source of truth for every guest review on the site.
   To add a future review: add one object to LOXLEY_REVIEWS below.
   Nothing else to touch.

   Rendered by the rotator into any element marked with
   [data-review-rotator] (index, treehouses, book). The first
   review is also hard-coded in the HTML so the section renders
   without JavaScript.
   ============================================================ */

const LOXLEY_REVIEWS = [
  {
    quote: "The only sounds you hear are the birds chirping and the gentle rushing of water below. It feels very private and secluded. The perfect adventure to feel like you are camping in the woods, but with a bed and bathroom.",
    author: "Kellie · Marietta, GA"
  },
  {
    quote: "If you are on the fence about this place, don't be. Worth it again and again. We had a rainy weekend here but something about hearing the rain hit the treehouse tent while sipping wine has its perks. Hosts were hands down the best we've ever had.",
    author: "Preston · Peachtree Corners, GA"
  },
  {
    quote: "Words cannot do it justice — you need to experience it. I won't spoil the surprises that the hosts offer you, but believe me you will be very pleased with their thoughtfulness. They truly go above and beyond.",
    author: "Megan · Mobile, AL"
  },
  {
    quote: "This is my second time staying in this magical place in 1 week. I just can't get enough!! Livy and Mick go above and beyond to make this an experience you'll never forget!!",
    author: "James · Atlanta, GA"
  },
  {
    quote: "I'll start this by saying it is pricey, but well worth the cost. If you love the pictures you will be in awe when you arrive. The place is a lot bigger than what you see in the photos. Very secluded, so privacy is not an issue.",
    author: "Ti · Atlanta, GA"
  },
  {
    quote: "It made our stay feel like we were entering a magical storybook. Campfire already going, homemade pizza dough, s'mores kits, champagne for toasting, fresh pastries in the morning... Our entire crew agreed this won't be the last stay at Loxley Forest!",
    author: "Kim · Chattanooga, TN"
  },
  {
    quote: "Fresh made pizza dough for the pizza oven, outdoor movie, secluded in a private forest, fresh pastries in the morning, the sound of a rippling creek... highly recommend this adventure!",
    author: "Jerome · Cumming, GA"
  },
  {
    quote: "It's rare to come across a place and a host so special. I left feeling rested, grateful, and already looking forward to coming back. Highly, highly recommend!!",
    author: "Evgeny · Hollywood, FL"
  },
  {
    quote: "We opted for the Forest Tableau, Stargazing, and Morning Moments. All the food was very good, a lot of it homemade, and abundant! It was worth it and a once in a lifetime experience.",
    author: "Nancy · Mount Pleasant, SC"
  },
  {
    quote: "We felt like we were in a story book. Fresh pizza dough, tree mail, fresh pastries — Downtown Dahlonega was a dream! I guarantee you'll have just as beautiful a stay.",
    author: "Lyndsay · Peachtree City, GA"
  }
];

/* --- Rotator: one card at a time, ~7s auto-advance, swipe/tap on touch --- */
(function () {

  function initRotator(root) {
    var card = root.querySelector('.review-rotator__card');
    if (!card || !LOXLEY_REVIEWS.length) return;
    var quoteEl = card.querySelector('.testimonial__quote');
    var authorEl = card.querySelector('.testimonial__author');
    if (!quoteEl || !authorEl) return;

    var index = 0;
    var timer;
    var swiped = false;

    function render(i) {
      var r = LOXLEY_REVIEWS[i];
      quoteEl.textContent = '"' + r.quote + '"';
      authorEl.textContent = r.author;
    }

    function goTo(i) {
      index = (i + LOXLEY_REVIEWS.length) % LOXLEY_REVIEWS.length;
      card.classList.add('review-rotator__card--fading');
      setTimeout(function () {
        render(index);
        card.classList.remove('review-rotator__card--fading');
      }, 280);
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 7000);
    }

    /* Tap advances (suppressed right after a swipe so it doesn't double-fire) */
    card.addEventListener('click', function () {
      if (swiped) { swiped = false; return; }
      next();
      restart();
    });

    /* Swipe advances on touch: left = next, right = previous */
    var touchStartX = 0;
    card.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    card.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        swiped = true;
        if (diff > 0) { next(); } else { prev(); }
        restart();
      }
    }, { passive: true });

    restart();
  }

  function init() {
    document.querySelectorAll('[data-review-rotator]').forEach(initRotator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
