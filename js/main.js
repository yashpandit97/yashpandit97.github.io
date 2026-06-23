/**
 * Main site interactions: nav, scroll spy, mobile menu, reveal animations.
 */
(function () {
  'use strict';

  const header = document.getElementById('site-header');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const navLinkItems = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  /* ---- Sticky header shadow on scroll ---- */
  function handleHeaderScroll() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  /* ---- Mobile menu toggle ---- */
  function toggleMobileMenu() {
    const isOpen = navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMobileMenu() {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', toggleMobileMenu);

  navLinkItems.forEach(function (link) {
    link.addEventListener('click', closeMobileMenu);
  });

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---- Scroll spy: highlight active nav link ---- */
  function updateActiveNav() {
    const scrollPos = window.scrollY + header.offsetHeight + 80;
    let currentSection = '';

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;

      if (scrollPos >= top && scrollPos < top + height) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinkItems.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === currentSection) {
        link.classList.add('active');
      }
    });
  }

  /* ---- Intersection Observer for scroll reveals ---- */
  function initRevealAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealElements = document.querySelectorAll('.reveal');

    if (prefersReducedMotion) {
      revealElements.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---- Throttled scroll handler ---- */
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        handleHeaderScroll();
        updateActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', closeMobileMenu);

  handleHeaderScroll();
  updateActiveNav();
  initRevealAnimations();
  initThemeToggle();
  initMetricsCountUp();
})();

/**
 * Animate metric values when the strip enters the viewport.
 */
function initMetricsCountUp() {
  const strip = document.getElementById('metrics');
  if (!strip) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const values = strip.querySelectorAll('.metrics-value[data-count]');

  if (prefersReducedMotion) return;

  let animated = false;

  const observer = new IntersectionObserver(
    function (entries) {
      if (!entries[0].isIntersecting || animated) return;
      animated = true;

      values.forEach(function (el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1200;
        const start = performance.now();

        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          el.textContent = current + suffix;

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        }

        requestAnimationFrame(step);
      });

      observer.disconnect();
    },
    { threshold: 0.3 }
  );

  observer.observe(strip);
}

/**
 * Theme toggle — persists preference in localStorage.
 */
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const metaTheme = document.getElementById('theme-color-meta');
  if (!toggle) return;

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    const isLight = theme === 'light';

    if (isLight) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      toggle.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      toggle.setAttribute('aria-label', 'Switch to light theme');
    }

    if (metaTheme) {
      metaTheme.setAttribute('content', isLight ? '#ffffff' : '#0a0a0a');
    }

    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }

  toggle.addEventListener('click', function () {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });

  applyTheme(getTheme());
}
