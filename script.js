/* ══════════════════════════════════════════════════════════════
   NAROSCO — Main Script
   - Scroll reveal animations
   - FAQ accordion
   - ROI Calculator
   - Nav behavior
   - Form submission
   - Mobile menu
   - Smooth scroll
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 1. SCROLL REVEAL (Intersection Observer) ──────────────
  function initReveal() {
    const revealSelectors = [
      '.hero-badge', '.hero-title', '.hero-sub', '.hero-ctas',
      '.hero-process-badge',
      '.task-item', '.problem-statement',
      '.transform-card', '.transform-arrow-col',
      '.cap-card',
      '.step', '.steps-timeline',
      '.agent-card',
      '.case-placeholder',
      '.tech-block',
      '.roi-card',
      '.about-story', '.methodology-grid',
      '.contact-card',
      '.faq-item'
    ];

    const revealEls = [];
    revealSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.setAttribute('data-reveal', '');
        revealEls.push(el);
      });
    });

    if (!('IntersectionObserver' in window)) {
      // Fallback: show all
      revealEls.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Stagger siblings
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
        const idx = siblings.indexOf(el);
        const delay = idx * 60;
        setTimeout(() => el.classList.add('revealed'), delay);
        observer.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  // ── 2. COUNTER ANIMATION ──────────────────────────────────
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const countersStarted = new Set();
  function checkCounters() {
    document.querySelectorAll('[data-target]').forEach(el => {
      if (countersStarted.has(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        countersStarted.add(el);
        animateCounter(el);
      }
    });
  }

  // ── 3. FAQ ACCORDION ──────────────────────────────────────
  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const answerId = btn.getAttribute('aria-controls');
        const answer = document.getElementById(answerId);

        // Close all
        document.querySelectorAll('.faq-question').forEach(b => {
          b.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.faq-answer').forEach(a => {
          a.classList.remove('open');
        });

        // Open clicked if was closed
        if (!expanded) {
          btn.setAttribute('aria-expanded', 'true');
          answer?.classList.add('open');
        }
      });
    });
  }

  // ── 4. NAV SCROLL BEHAVIOR ────────────────────────────────
  function initNav() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 80) {
            nav.classList.add('scrolled');
          } else {
            nav.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ── 5. MOBILE NAV TOGGLE ──────────────────────────────────
  function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu on link click
    nav.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── 6. FORM SUBMISSION ────────────────────────────────────
  function initForm() {
    const form = document.getElementById('lead-form');
    const modal = document.getElementById('success-modal');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('#form-submit');
      const originalText = btn.innerHTML;

      btn.disabled = true;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="animation:spin 1s linear infinite">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 8" />
        </svg>
        Enviando...`;

      try {
        const formData = new FormData(form);
        formData.append("access_key", "8b31ae2b-3b21-40bd-bf48-d7163ded65c3");
        formData.append("subject", "Novo Lead — Diagnóstico NAROSCO");
        formData.append("from_name", "NAROSCO Website");

        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        if (data.success) {
          form.reset();
          if (modal) {
            modal.hidden = false;
            modal.querySelector('#modal-close')?.focus();
          }
        } else {
          alert("Erro ao enviar (" + (data.message || 'Desconhecido') + "). Tente novamente.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro de rede. Verifique sua conexão e tente novamente.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });

    modal?.addEventListener('click', e => {
      if (e.target === modal) modal.hidden = true;
    });
  }

  // ── 7. ROI CALCULATOR ─────────────────────────────────────
  function initROI() {
    const people = document.getElementById('roi-people');
    const hours = document.getElementById('roi-hours');
    const cost = document.getElementById('roi-cost');

    if (!people || !hours || !cost) return;

    const peopleVal = document.getElementById('roi-people-val');
    const hoursVal = document.getElementById('roi-hours-val');
    const costVal = document.getElementById('roi-cost-val');

    const resHours = document.getElementById('roi-res-hours');
    const resMonthly = document.getElementById('roi-res-monthly');
    const resAnnual = document.getElementById('roi-res-annual');

    function formatCurrency(value) {
      return 'R$ ' + value.toLocaleString('pt-BR');
    }

    function calculate() {
      const p = parseInt(people.value, 10);
      const h = parseInt(hours.value, 10);
      const c = parseInt(cost.value, 10);

      const monthlyHours = p * h * 4.33; // avg weeks per month
      const monthlyCost = monthlyHours * c;
      const annualCost = monthlyCost * 12;

      if (peopleVal) peopleVal.textContent = p + (p === 1 ? ' pessoa' : ' pessoas');
      if (hoursVal) hoursVal.textContent = h + ' horas/semana';
      if (costVal) costVal.textContent = 'R$ ' + c + '/hora';

      if (resHours) resHours.textContent = Math.round(monthlyHours) + 'h';
      if (resMonthly) resMonthly.textContent = formatCurrency(Math.round(monthlyCost));
      if (resAnnual) resAnnual.textContent = formatCurrency(Math.round(annualCost));
    }

    [people, hours, cost].forEach(input => {
      input.addEventListener('input', calculate);
    });

    calculate(); // Initial calc
  }

  // ── 8. SMOOTH ANCHOR SCROLL ───────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── 9. SCROLL LISTENERS ───────────────────────────────────
  window.addEventListener('scroll', () => {
    checkCounters();
  }, { passive: true });

  // ── INIT ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initFAQ();
    initNav();
    initMobileNav();
    initForm();
    initROI();
    checkCounters();
  });

  // CSS spin keyframe
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

})();
