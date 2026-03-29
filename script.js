/* ══════════════════════════════════════════════
   NAROSCO — JavaScript
   - Animated grid canvas
   - Agent diagram connections
   - Animated counters
   - Scroll reveal
   - FAQ accordion
   - Form submission
   ══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 1. ANIMATED GRID CANVAS ────────────────────────────────────
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');

  let W, H, dots = [];
  const DOT_COUNT = 80;
  const MOUSE = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initDots() {
    dots = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Update & draw dots
    dots.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > W) d.vx *= -1;
      if (d.y < 0 || d.y > H) d.vy *= -1;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 166, 35, 0.25)';
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.12;
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(245, 166, 35, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // Mouse proximity highlight
      const mdx = dots[i].x - MOUSE.x;
      const mdy = dots[i].y - MOUSE.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 160) {
        const alpha = (1 - mdist / 160) * 0.5;
        ctx.beginPath();
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(MOUSE.x, MOUSE.y);
        ctx.strokeStyle = `rgba(245, 166, 35, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    requestAnimationFrame(drawFrame);
  }

  window.addEventListener('resize', () => { resize(); initDots(); });
  window.addEventListener('mousemove', e => { MOUSE.x = e.clientX; MOUSE.y = e.clientY; });

  resize();
  initDots();
  drawFrame();

  // ── 2. AGENT DIAGRAM SVG CONNECTIONS ──────────────────────────
  function drawAgentConnections() {
    const diagram = document.querySelector('.agent-diagram');
    const central = document.getElementById('central-node');
    const svgEl = document.getElementById('connections-svg');
    if (!diagram || !central || !svgEl) return;

    const nodeIds = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'];
    const dRect = diagram.getBoundingClientRect();
    const cRect = central.getBoundingClientRect();
    const cx = cRect.left - dRect.left + cRect.width / 2;
    const cy = cRect.top - dRect.top + cRect.height / 2;

    let html = '';
    nodeIds.forEach((id, i) => {
      const node = document.getElementById(id);
      if (!node) return;
      const nRect = node.getBoundingClientRect();
      const nx = nRect.left - dRect.left + nRect.width / 2;
      const ny = nRect.top - dRect.top + nRect.height / 2;

      const delay = i * 0.3;
      html += `
        <line
          x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}"
          stroke="rgba(245,166,35,0.25)" stroke-width="1"
          stroke-dasharray="4 4"
          style="animation: dash-anim 2s linear ${delay}s infinite"
        />`;
    });

    svgEl.innerHTML = `<style>
      @keyframes dash-anim {
        to { stroke-dashoffset: -20; }
      }
    </style>` + html;
  }

  setTimeout(drawAgentConnections, 300);
  window.addEventListener('resize', drawAgentConnections);

  // ── 3. COUNTER ANIMATION ───────────────────────────────────────
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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

  // ── 4. SCROLL REVEAL ──────────────────────────────────────────
  function initReveal() {
    const revealEls = [];

    // Mark elements for reveal
    const selectors = [
      '.pain-card', '.step', '.testimonial', '.faq-item',
      '.use-case-item', '.contact-card', '.hero-badge',
      '.hero-title', '.hero-sub', '.hero-ctas', '.hero-stats'
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.setAttribute('data-reveal', '');
        revealEls.push(el);
      });
    });

    function checkReveal() {
      revealEls.forEach((el, i) => {
        if (el.classList.contains('revealed')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 60) {
          // Stagger sibling cards
          const delay = Array.from(el.parentElement?.children || []).indexOf(el) * 80;
          setTimeout(() => el.classList.add('revealed'), delay);
        }
      });
    }

    window.addEventListener('scroll', () => { checkReveal(); checkCounters(); }, { passive: true });
    checkReveal();
    checkCounters();
  }

  // ── 5. FAQ ACCORDION ──────────────────────────────────────────
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

  // ── 6. NAV SCROLL BEHAVIOR ────────────────────────────────────
  function initNav() {
    const nav = document.getElementById('main-nav');
    let lastY = 0;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 80) {
        nav.style.borderBottomColor = 'rgba(255,255,255,0.1)';
      } else {
        nav.style.borderBottomColor = '';
      }
      lastY = y;
    }, { passive: true });
  }

  // ── 7. FORM SUBMISSION ────────────────────────────────────────
  function initForm() {
    const form = document.getElementById('lead-form');
    const modal = document.getElementById('success-modal');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('#form-submit');
      const originalText = btn.innerHTML;

      // Loading state
      btn.disabled = true;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="animation:spin 1s linear infinite">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 8" />
        </svg>
        Enviando...`;

      // Simulate async submit (replace with real endpoint)
      await new Promise(r => setTimeout(r, 1500));

      btn.disabled = false;
      btn.innerHTML = originalText;
      form.reset();

      if (modal) {
        modal.hidden = false;
        modal.querySelector('#modal-close')?.focus();
      }

      // Close modal on backdrop click
      modal?.addEventListener('click', e => {
        if (e.target === modal) modal.hidden = true;
      });
    });
  }

  // ── 8. SMOOTH ANCHOR OFFSET (account for fixed nav) ──────────
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

  // ── INIT ─────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initFAQ();
    initNav();
    initForm();
  });

  // CSS spin keyframe for loader
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

})();
