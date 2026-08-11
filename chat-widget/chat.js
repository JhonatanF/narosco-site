/**
 * Narosco Clinic Chat Widget — chat.js
 * Widget de chat inteligente para clínicas
 * Conecta ao n8n AI Agent via webhook
 *
 * Configuração:
 *   window.NaroscoChatConfig = {
 *     webhookUrl: 'https://seu-n8n.com/webhook/clinic-chat',
 *     clinicName: 'Clínica Exemplo',
 *     agentName: 'Ana',
 *     agentEmoji: '👩‍⚕️',
 *     welcomeMessage: 'Olá! Como posso ajudar?',
 *     suggestions: ['Planos aceitos?', 'Preços', 'Quero agendar'],
 *     primaryColor: '#1a6bff'  // opcional
 *   };
 */

(function () {
  'use strict';

  // ── Configuração padrão ──────────────────────────────────────────────────
  const DEFAULT_CONFIG = {
    webhookUrl: '',
    clinicName: 'Clínica',
    agentName: 'Ana',
    agentEmoji: '👩‍⚕️',
    welcomeMessage: 'Olá! 😊 Eu sou a *Ana*, assistente virtual aqui da clínica.\n\nPosso te ajudar com informações sobre **planos de saúde**, **preços** e **agendamentos**. Como posso ajudar?',
    suggestions: [
      '💳 Planos aceitos?',
      '💰 Tabela de preços',
      '📅 Quero agendar',
      '⏰ Horários'
    ],
    primaryColor: '#1a6bff',
    storageKey: 'narosco_chat',
    maxHistoryItems: 50,
  };

  const cfg = Object.assign({}, DEFAULT_CONFIG, window.NaroscoChatConfig || {});

  // ── Estado ───────────────────────────────────────────────────────────────
  let sessionId = getOrCreateSession();
  let isOpen = false;
  let isLoading = false;
  let unreadCount = 0;
  let history = loadHistory();

  // ── Utilitários ──────────────────────────────────────────────────────────
  function getOrCreateSession() {
    let sid = sessionStorage.getItem('narosco_sid');
    if (!sid) {
      // [FIX A2] crypto.randomUUID() — criptograficamente seguro, não previsível
      sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'session_' + Date.now() + '_' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      sessionStorage.setItem('narosco_sid', sid);
    }
    return sid;
  }

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(cfg.storageKey + '_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveHistory() {
    try {
      const trimmed = history.slice(-cfg.maxHistoryItems);
      sessionStorage.setItem(cfg.storageKey + '_history', JSON.stringify(trimmed));
    } catch { /* ignore quota errors */ }
  }

  function now() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') str = String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // [FIX C2] Valida cor hexadecimal — impede CSS injection
  function sanitizeColor(color) {
    if (!color || typeof color !== 'string') return null;
    // Aceita apenas hex válido: #RGB ou #RRGGBB
    return /^#[0-9A-Fa-f]{3,8}$/.test(color.trim()) ? color.trim() : null;
  }

  function formatMessage(text) {
    // Markdown básico: **bold**, *italic*, \n → <br>
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // ── HTML do Widget ───────────────────────────────────────────────────────
  function buildWidget() {
    const widget = document.createElement('div');
    widget.id = 'narosco-chat-widget';
    widget.innerHTML = `
      <!-- Janela do chat -->
      <div id="narosco-chat-window" role="dialog" aria-label="Chat de atendimento" aria-hidden="true">
        <!-- Header -->
        <div id="narosco-chat-header">
          <div class="chat-header-avatar">${cfg.agentEmoji}</div>
          <div class="chat-header-info">
            <span class="chat-header-name">${escapeHtml(cfg.agentName)}</span>
            <span class="chat-header-status">Online agora</span>
          </div>
        </div>

        <!-- Mensagens -->
        <div id="narosco-chat-messages" role="log" aria-live="polite" aria-label="Histórico de mensagens"></div>

        <!-- Sugestões rápidas -->
        <div id="narosco-chat-suggestions">
          ${cfg.suggestions.map(s =>
            `<button class="chat-suggestion-btn" data-text="${escapeHtml(s)}">${escapeHtml(s)}</button>`
          ).join('')}
        </div>

        <!-- Input -->
        <div id="narosco-chat-footer">
          <textarea
            id="narosco-chat-input"
            placeholder="Digite sua mensagem..."
            rows="1"
            aria-label="Digite sua mensagem"
            autocomplete="off"
            autocorrect="on"
            spellcheck="true"
          ></textarea>
          <button id="narosco-chat-send" aria-label="Enviar mensagem" disabled>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>

        <!-- Powered by -->
        <div class="chat-powered">
          Powered by <a href="https://narosco.com.br" target="_blank" rel="noopener noreferrer">Narosco AI</a>
        </div>
      </div>

      <!-- Botão flutuante -->
      <button id="narosco-chat-bubble" aria-label="Abrir chat de atendimento" aria-expanded="false">
        <!-- Ícone chat -->
        <svg class="icon-chat" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        <!-- Ícone fechar -->
        <svg class="icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        <!-- Badge -->
        <span id="narosco-chat-badge"></span>
      </button>
    `;
    return widget;
  }

  // ── Renderização de mensagens ────────────────────────────────────────────
  function renderMessage(role, text, timestamp, isError = false) {
    const messagesEl = document.getElementById('narosco-chat-messages');
    if (!messagesEl) return;

    const isUser = role === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isUser ? 'user' : 'agent'}${isError ? ' chat-msg-error' : ''}`;

    if (isUser) {
      msgDiv.innerHTML = `
        <div class="chat-msg-bubble">${formatMessage(text)}</div>
        <span class="chat-msg-time">${timestamp || now()}</span>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="chat-msg-avatar">${cfg.agentEmoji}</div>
        <div>
          <div class="chat-msg-bubble">${formatMessage(text)}</div>
          <span class="chat-msg-time">${timestamp || now()}</span>
        </div>
      `;
    }

    messagesEl.appendChild(msgDiv);
    scrollToBottom();

    if (!isUser && !isOpen) {
      unreadCount++;
      updateBadge();
    }
  }

  function showTyping() {
    const messagesEl = document.getElementById('narosco-chat-messages');
    if (!messagesEl) return;

    const existing = messagesEl.querySelector('.chat-typing');
    if (existing) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-typing';
    typingDiv.id = 'narosco-typing';
    typingDiv.innerHTML = `
      <div class="chat-typing-avatar">${cfg.agentEmoji}</div>
      <div class="chat-typing-bubble">
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
      </div>
    `;
    messagesEl.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTyping() {
    const typing = document.getElementById('narosco-typing');
    if (typing) typing.remove();
  }

  function scrollToBottom() {
    const messagesEl = document.getElementById('narosco-chat-messages');
    if (messagesEl) {
      requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }
  }

  function updateBadge() {
    const badge = document.getElementById('narosco-chat-badge');
    if (!badge) return;
    if (unreadCount > 0 && !isOpen) {
      badge.style.display = 'flex';
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else {
      badge.style.display = 'none';
    }
  }

  function hideSuggestions() {
    const suggestions = document.getElementById('narosco-chat-suggestions');
    if (suggestions) suggestions.style.display = 'none';
  }

  // ── API — Envio de mensagem ──────────────────────────────────────────────
  const MAX_MSG_LENGTH = 1000; // [FIX M2] Limite de caracteres

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;

    // [FIX M2] Validação de tamanho
    if (text.trim().length > MAX_MSG_LENGTH) {
      renderMessage('agent', `⚠️ Mensagem muito longa (máx. ${MAX_MSG_LENGTH} caracteres). Por favor, resuma! 😊`, now(), true);
      return;
    }

    if (!cfg.webhookUrl) {
      console.warn('[NaroscoChat] webhookUrl não configurado!');
      renderMessage('agent', '⚠️ Chat temporariamente indisponível. Por favor, entre em contato pelo telefone da clínica.', now(), true);
      return;
    }

    const userText = text.trim();
    const msgTime = now();

    // Salva no histórico e renderiza
    history.push({ role: 'user', text: userText, time: msgTime });
    saveHistory();
    renderMessage('user', userText, msgTime);
    hideSuggestions();

    // Desabilita input
    setLoading(true);
    showTyping();

    try {
      // [FIX] Timeout de 15s para evitar hang infinito
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: userText,
          sessionId: sessionId,
          canal: 'website',
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      hideTyping();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const agentText = data.resposta || data.message || data.output || 'Desculpa, não consegui processar sua mensagem. Tente novamente! 😊';
      const agentTime = now();

      history.push({ role: 'agent', text: agentText, time: agentTime });
      saveHistory();
      renderMessage('agent', agentText, agentTime);

    } catch (err) {
      hideTyping();
      console.error('[NaroscoChat] Erro ao enviar mensagem:', err);
      const errMsg = 'Ops! Tive um problema técnico 😅 Tente novamente ou entre em contato pelo WhatsApp.';
      renderMessage('agent', errMsg, now(), true);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(state) {
    isLoading = state;
    const sendBtn = document.getElementById('narosco-chat-send');
    const input = document.getElementById('narosco-chat-input');
    if (sendBtn) sendBtn.disabled = state || !input?.value.trim();
    if (input) input.disabled = state;
  }

  // ── Controle de abertura/fechamento ─────────────────────────────────────
  function openChat() {
    isOpen = true;
    unreadCount = 0;
    updateBadge();

    const widget = document.getElementById('narosco-chat-widget');
    const window_ = document.getElementById('narosco-chat-window');
    const bubble = document.getElementById('narosco-chat-bubble');

    widget?.classList.add('open');
    window_?.setAttribute('aria-hidden', 'false');
    bubble?.setAttribute('aria-expanded', 'true');

    // Foca no input com pequeno delay (espera animação)
    setTimeout(() => {
      document.getElementById('narosco-chat-input')?.focus();
      scrollToBottom();
    }, 300);
  }

  function closeChat() {
    isOpen = false;

    const widget = document.getElementById('narosco-chat-widget');
    const window_ = document.getElementById('narosco-chat-window');
    const bubble = document.getElementById('narosco-chat-bubble');

    widget?.classList.remove('open');
    window_?.setAttribute('aria-hidden', 'true');
    bubble?.setAttribute('aria-expanded', 'false');
    bubble?.focus();
  }

  function toggleChat() {
    if (isOpen) closeChat();
    else openChat();
  }

  // ── Restaurar histórico da sessão ────────────────────────────────────────
  // [LGPD] Aviso de coleta de dados na primeira mensagem
  function renderLgpdNotice() {
    const messagesEl = document.getElementById('narosco-chat-messages');
    if (!messagesEl) return;
    const notice = document.createElement('div');
    notice.className = 'chat-lgpd-notice';
    notice.style.cssText = 'font-size:11px;color:#6b7280;text-align:center;padding:6px 12px;background:#f5f7fa;border-radius:8px;margin:4px 0;line-height:1.5;';
    notice.textContent = '🔒 Ao continuar, você concorda com nossa coleta de dados (nome e telefone) para fins de agendamento, conforme a LGPD.';
    messagesEl.appendChild(notice);
  }

  function restoreHistory() {
    if (history.length === 0) {
      // Primeira vez: mostrar mensagem de boas-vindas + aviso LGPD
      const welcomeTime = now();
      history.push({ role: 'agent', text: cfg.welcomeMessage, time: welcomeTime });
      saveHistory();
      renderMessage('agent', cfg.welcomeMessage, welcomeTime);
      renderLgpdNotice(); // [LGPD compliance]
    } else {
      // Restaurar histórico existente (hide suggestions if user already interacted)
      history.forEach(item => renderMessage(item.role, item.text, item.time));
      hideSuggestions();
    }
  }

  // ── Ajuste automático da altura do textarea ──────────────────────────────
  function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  // ── Event Listeners ──────────────────────────────────────────────────────
  function attachEvents() {
    const bubble = document.getElementById('narosco-chat-bubble');
    const input = document.getElementById('narosco-chat-input');
    const sendBtn = document.getElementById('narosco-chat-send');
    const suggestions = document.querySelectorAll('.chat-suggestion-btn');

    // Toggle chat
    bubble?.addEventListener('click', toggleChat);

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    // Input → habilitar/desabilitar botão
    input?.addEventListener('input', () => {
      autoResizeTextarea(input);
      if (sendBtn) sendBtn.disabled = !input.value.trim() || isLoading;
    });

    // Enter para enviar (Shift+Enter = nova linha)
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = input.value;
        if (text.trim() && !isLoading) {
          input.value = '';
          autoResizeTextarea(input);
          sendBtn.disabled = true;
          sendMessage(text);
        }
      }
    });

    // Botão enviar
    sendBtn?.addEventListener('click', () => {
      const text = input?.value || '';
      if (text.trim() && !isLoading) {
        input.value = '';
        autoResizeTextarea(input);
        sendBtn.disabled = true;
        sendMessage(text);
      }
    });

    // Sugestões rápidas
    suggestions.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.text;
        sendMessage(text);
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    // [FIX C2] Validar primaryColor antes de injetar no CSS
    const safeColor = sanitizeColor(cfg.primaryColor);
    if (safeColor && safeColor !== DEFAULT_CONFIG.primaryColor) {
      const style = document.createElement('style');
      // Usa propriedades CSS individuais (não template string com input do usuário)
      const root = document.documentElement;
      root.style.setProperty('--chat-primary', safeColor);
      root.style.setProperty('--chat-primary-dark', safeColor);
      root.style.setProperty('--chat-bubble-user', safeColor);
      document.head.appendChild(style);
    }

    // Injetar widget no DOM
    const widget = buildWidget();
    document.body.appendChild(widget);

    // Restaurar histórico
    restoreHistory();

    // Vincular eventos
    attachEvents();

    // Notificação de atenção após 5s se não abriu
    setTimeout(() => {
      if (!isOpen && unreadCount === 0) {
        unreadCount = 1;
        updateBadge();
      }
    }, 5000);
  }

  // Aguardar DOM pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expor API pública
  window.NaroscoChat = {
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
    send: sendMessage,
    clearHistory: function () {
      history = [];
      saveHistory();
      sessionStorage.removeItem('narosco_sid');
      sessionId = getOrCreateSession();
      const msgs = document.getElementById('narosco-chat-messages');
      if (msgs) msgs.innerHTML = '';
      renderMessage('agent', cfg.welcomeMessage, now());
    }
  };

})();
