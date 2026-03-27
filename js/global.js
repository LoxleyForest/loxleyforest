/* ============================================================
   LOXLEY FOREST — GLOBAL JAVASCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Announcement Bar --- */
  const announcementBar = document.querySelector('.announcement-bar');
  const messages = document.querySelectorAll('.announcement-bar__message');
  const closeBtn = document.querySelector('.announcement-bar__close');
  let msgIndex = 0;
  let msgInterval;

  function rotateMessages() {
    if (!messages.length) return;
    messages.forEach(m => m.classList.remove('active'));
    msgIndex = (msgIndex + 1) % messages.length;
    messages[msgIndex].classList.add('active');
  }

  if (messages.length > 1) {
    msgInterval = setInterval(rotateMessages, 5000);
  }

  if (closeBtn && announcementBar) {
    closeBtn.addEventListener('click', () => {
      announcementBar.style.opacity = '0';
      announcementBar.style.transition = 'opacity 0.3s ease, height 0.4s ease 0.2s';
      setTimeout(() => {
        announcementBar.style.height = '0';
        announcementBar.style.overflow = 'hidden';
        document.querySelector('.nav').classList.add('nav--no-bar');
      }, 100);
      clearInterval(msgInterval);
    });
  }

  /* --- Navigation: transparent → solid on scroll --- */
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');

  function handleNavScroll() {
    if (!nav) return;
    const threshold = 80;
    if (window.scrollY > threshold) {
      nav.classList.add('nav--scrolled');
      nav.classList.remove('nav--transparent');
    } else {
      nav.classList.remove('nav--scrolled');
      if (hero) nav.classList.add('nav--transparent');
    }
  }

  if (hero) {
    nav.classList.add('nav--transparent');
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* --- Mobile Menu --- */
  const hamburger = document.querySelector('.nav__hamburger');
  const overlay = document.querySelector('.nav__overlay');

  if (hamburger && overlay) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      overlay.classList.toggle('open');
      document.body.style.overflow = overlay.classList.contains('open') ? 'hidden' : '';
    });

    overlay.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* --- Scroll Reveal (Intersection Observer) --- */
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('revealed'));
  }

  /* --- Image Parallax --- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');

  function handleParallax() {
    parallaxEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const rate = parseFloat(el.dataset.parallax) || 0.2;
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const offset = (rect.top - window.innerHeight / 2) * rate;
        el.style.transform = `translateY(${offset}px)`;
      }
    });
  }

  if (parallaxEls.length) {
    window.addEventListener('scroll', handleParallax, { passive: true });
  }

  /* --- Hero Image Subtle Parallax --- */
  const heroMedia = document.querySelector('.hero__media img');
  if (heroMedia) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const heroHeight = document.querySelector('.hero')?.offsetHeight || 800;
      if (scrolled < heroHeight) {
        const translateY = scrolled * 0.15;
        heroMedia.style.transform = `scale(1.05) translateY(${translateY}px)`;
      }
    }, { passive: true });
  }

  /* --- Testimonial Carousel --- */
  const track = document.querySelector('.testimonials__track');
  const dots = document.querySelectorAll('.testimonials__dot');
  let currentSlide = 0;
  let autoAdvance;

  function getVisibleCount() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1200) return 2;
    return 3;
  }

  function updateCarousel(index) {
    if (!track) return;
    const visible = getVisibleCount();
    const slides = track.children.length;
    const maxIndex = Math.max(0, slides - visible);
    currentSlide = Math.min(index, maxIndex);
    const offset = currentSlide * (100 / visible);
    track.style.transform = `translateX(-${offset}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      updateCarousel(i);
      resetAutoAdvance();
    });
  });

  function advanceCarousel() {
    const visible = getVisibleCount();
    const slides = track ? track.children.length : 0;
    const maxIndex = Math.max(0, slides - visible);
    const next = currentSlide >= maxIndex ? 0 : currentSlide + 1;
    updateCarousel(next);
  }

  function resetAutoAdvance() {
    clearInterval(autoAdvance);
    autoAdvance = setInterval(advanceCarousel, 6000);
  }

  if (track && track.children.length) {
    resetAutoAdvance();
    window.addEventListener('resize', () => updateCarousel(currentSlide));
  }

  /* --- Carousel Touch Support --- */
  if (track) {
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left — next
          const visible = getVisibleCount();
          const slides = track.children.length;
          const maxIndex = Math.max(0, slides - visible);
          updateCarousel(Math.min(currentSlide + 1, maxIndex));
        } else {
          // Swipe right — prev
          updateCarousel(Math.max(currentSlide - 1, 0));
        }
        resetAutoAdvance();
      }
    }, { passive: true });
  }

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});
