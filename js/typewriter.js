/**
 * Typewriter effect — hero on load; other text when section enters viewport.
 * Content is hidden (stashed) until its section scrolls into view.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function stash(el) {
    if (!el || el.dataset.twPrepared) return;

    el.dataset.twHtml = el.innerHTML;
    el.dataset.twText = el.textContent.trim();
    el.dataset.twPrepared = '1';

    const ghost = document.createElement('span');
    ghost.className = 'typewriter-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.innerHTML = el.dataset.twHtml;

    const live = document.createElement('span');
    live.className = 'typewriter-live';

    el.textContent = '';
    el.classList.add('typewriter-shell', 'typewriter-waiting');
    el.appendChild(ghost);
    el.appendChild(live);
    el.setAttribute('aria-busy', 'true');
  }

  function stashAllBelowFold() {
    document.querySelectorAll('.typewriter').forEach(function (el) {
      if (!el.closest('#hero')) {
        stash(el);
      }
    });
  }

  function getLiveTarget(el) {
    return el.querySelector('.typewriter-live') || el;
  }

  function beginTyping(el) {
    el.classList.remove('typewriter-waiting');
    el.classList.add('typewriter-active');
  }

  function finish(el) {
    if (!el || !el.dataset.twHtml) return;
    el.innerHTML = el.dataset.twHtml;
    el.classList.remove(
      'typewriter-active',
      'typewriter-waiting',
      'typewriter-shell'
    );
    el.classList.add('typewriter-done');
    el.removeAttribute('aria-busy');
  }

  function charDelay(text, base, fast) {
    if (fast || text.length > 120) return Math.max(6, base * 0.45);
    if (text.length > 60) return Math.max(10, base * 0.7);
    return base;
  }

  async function typeEl(el, baseDelay, fast) {
    if (!el.dataset.twPrepared) {
      stash(el);
    }
    beginTyping(el);

    const text = el.dataset.twText || '';
    const live = getLiveTarget(el);
    const step = charDelay(text, baseDelay, fast);

    for (let i = 1; i <= text.length; i++) {
      live.textContent = text.slice(0, i);
      await delay(step);
    }
    finish(el);
  }

  async function typeSequence(elements, baseDelay, fast) {
    for (let i = 0; i < elements.length; i++) {
      await typeEl(elements[i], baseDelay, fast);
      await delay(fast ? 40 : 80);
    }
  }

  function collectPending(root) {
    return Array.from(root.querySelectorAll('.typewriter')).filter(function (el) {
      return (
        el.dataset.twPrepared === '1' &&
        !el.classList.contains('typewriter-done') &&
        (el.classList.contains('typewriter-waiting') || el.classList.contains('typewriter-active'))
      );
    });
  }

  function collectHero(root) {
    return Array.from(root.querySelectorAll('.typewriter')).filter(function (el) {
      return !el.classList.contains('typewriter-done') && el.textContent.trim().length > 0;
    });
  }

  async function runHero() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const els = collectHero(hero);
    els.forEach(stash);
    await typeSequence(els, 32, false);

    hero.querySelectorAll('.reveal-hero-delayed').forEach(function (el) {
      el.classList.add('show');
    });
  }

  function autoMarkTypewriters() {
    const selector = [
      'main .section-title',
      'main .section-intro',
      'main .about-text',
      'main .work-title',
      'main .work-label',
      'main .work-block > p',
      'main .arch-card h3',
      'main .arch-card p',
      'main .process-card h3',
      'main .process-card p',
      'main .skill-depth-name',
      'main .skill-category',
      'main .leadership-card h3',
      'main .leadership-card p',
      'main .perf-card h3',
      'main .perf-card p',
      'main .career-item h3',
      'main .career-item p',
      'main .timeline-role',
      'main .timeline-company',
      'main .timeline-bullets li',
      'main .edu-degree',
      'main .edu-field',
      'main .edu-school',
      'main .contact-intro',
      'main .footer-cta p',
      '#metrics .metrics-label',
    ].join(',');

    document.querySelectorAll(selector).forEach(function (el) {
      if (!el.closest('a, button') && el.textContent.trim()) {
        el.classList.add('typewriter');
      }
    });
  }

  function initSectionTyping() {
    autoMarkTypewriters();

    if (prefersReducedMotion) {
      document.querySelectorAll('.typewriter').forEach(function (el) {
        el.classList.add('typewriter-done');
      });
      document.querySelectorAll('.reveal-hero-delayed').forEach(function (el) {
        el.classList.add('show');
      });
      return;
    }

    stashAllBelowFold();

    const typedSections = new WeakSet();

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || typedSections.has(entry.target)) return;
          typedSections.add(entry.target);

          const els = collectPending(entry.target);
          if (els.length) {
            typeSequence(els, 18, true);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    document.querySelectorAll('main section[id]').forEach(function (section) {
      observer.observe(section);
    });

    const metrics = document.getElementById('metrics');
    if (metrics) observer.observe(metrics);

    runHero();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSectionTyping);
  } else {
    initSectionTyping();
  }
})();
