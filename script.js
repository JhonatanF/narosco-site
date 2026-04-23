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

  // ── 0. THEME MANAGEMENT ────────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  const iconSun = document.querySelector('.icon-sun');
  const iconMoon = document.querySelector('.icon-moon');

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
    } else {
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
    }
  }

  // Detect user preference or saved theme
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (prefersDark) {
    setTheme('dark');
  } else {
    setTheme('light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

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
      ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
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
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
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
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
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
          stroke="rgba(249,115,22,0.25)" stroke-width="1"
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

      try {
        const formData = new FormData(form);

        // --- CONFIGURAÇÃO WEB3FORMS ---
        // 1. Acesse https://web3forms.com/
        // 2. Coloque o email contato@narosco.com para gerar uma Access Key gratuita
        // 3. Substitua 'SUA_ACCESS_KEY_AQUI' pela chave recebida no email
        formData.append("access_key", "8b31ae2b-3b21-40bd-bf48-d7163ded65c3");
        formData.append("subject", "Novo Lead do Site - Narosco");
        formData.append("from_name", "Narosco Website");

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
          alert("Ocorreu um erro ao enviar (" + (data.message || 'Desconhecido') + "). Por favor, tente novamente.");
        }
      } catch (err) {
        console.error(err);
        alert("Ocorreu um erro de rede. Verifique sua conexão e tente novamente.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
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
    initChatWidget();
  });

  // CSS spin keyframe for loader
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

  // ── AI CHAT WIDGET LOGIC ─────────────────────────────────────
  function initChatWidget() {
    const chatWidget = document.getElementById('chat-widget');
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const panel = document.getElementById('chat-panel');
    const closeBtn = document.getElementById('chat-close-btn');
    const badge = document.getElementById('chat-badge');
    const messageContainer = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const inputField = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    
    // Status visual
    let isOpen = false;

    // Abrir/Fechar Widget
    function toggleChat() {
      isOpen = !isOpen;
      if (isOpen) {
        panel.hidden = false;
        badge.style.display = 'none'; // Esconde badge de "não lido"
        inputField.focus();
        scrollToBottom();
      } else {
        panel.hidden = true;
      }
    }

    toggleBtn?.addEventListener('click', toggleChat);
    closeBtn?.addEventListener('click', toggleChat);

    // Enter press
    inputField?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    // Handle Input
    inputField?.addEventListener('input', () => {
      sendBtn.disabled = inputField.value.trim() === '';
    });

    chatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = inputField.value.trim();
      if (!message) return;

      appendMessage(message, 'user');
      inputField.value = '';
      sendBtn.disabled = true;

      // Mocking typing indicator
      const typingId = appendTypingIndicator();
      
      // Async Call -> Backend Architecture
      try {
        const response = await sendToSupportBot(message);
        removeTypingIndicator(typingId);
        appendMessage(response, 'bot');
      } catch (err) {
        removeTypingIndicator(typingId);
        appendMessage("Desculpe, nossos sistemas de IA estão ocupados no momento. Poderia tentar reiniciar a conversa ou entrar em contato via e-mail?", 'bot');
      }
    });

    function appendMessage(text, senderType) {
      const div = document.createElement('div');
      div.className = `chat-message ${senderType}`;
      div.innerHTML = `<div class="message-content">${text}</div>`;
      messageContainer.appendChild(div);
      scrollToBottom();
    }

    function appendTypingIndicator() {
      const id = 'typing-' + Date.now();
      const div = document.createElement('div');
      div.id = id;
      div.className = 'chat-message bot typing-indicator';
      div.innerText = 'Digitando...'; // Placeholder, ideally dots animation
      div.style.opacity = '0.6';
      div.style.fontStyle = 'italic';
      messageContainer.appendChild(div);
      scrollToBottom();
      return id;
    }

    function removeTypingIndicator(id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }

    function scrollToBottom() {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }

  /**
   * Ponte Segura para o Backend Node.js
   * Essa função não deve conter chaves/API secrets diretamente no client.
   * Ela despacha a requisição HTTP POST pro endpoint /api/chat.
   */
  async function sendToSupportBot(userMessage) {
    // ⚠️ EM DESENVOLVIMENTO:
    // Esta requisição está roteada para o backend desenhado no arquivo de arquitetura.
    // Como ainda não temos o servidor de pé, faremos um mock inteligente (Demo).
    
    // MOCK RESPONSE
    return new Promise(resolve => {
      setTimeout(() => {
        resolve("Certo, entendi! Nossos agentes autônomos podem avaliar o escopo dessa operação por completo. Posso pedir um e-mail para que nossa equipe te faça uma proposta segura?");
      }, 1500);
    });

    /* PRODUCTION:
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });
    const data = await response.json();
    return data.reply;
    */
  }

})();
