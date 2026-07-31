(function () {
  const cfg = window.NISM_APP_CONFIG || {};
  const widgetConfig = cfg.chatWidget || {};
  if (widgetConfig.enabled === false || window.__NISM_CHAT_WIDGET_LOADED__) return;
  window.__NISM_CHAT_WIDGET_LOADED__ = true;

  const apiUrl = cfg.chatApiUrl || 'https://api.nismstudy.in/api/chat';
  const styleHref = widgetConfig.stylesheet || 'chat-widget.css';
  const quickQuestions = widgetConfig.quickQuestions || [
    'Which NISM course should I choose?',
    'How long do I get access?',
    'What is included in a mock test?',
    'How much does each exam cost?'
  ];

  function ensureStylesheet() {
    if (document.querySelector(`link[href="${styleHref}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styleHref;
    document.head.appendChild(link);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function getAccessToken() {
    try {
      if (!window.NISM_APP?.getSession) return null;
      const { session } = await window.NISM_APP.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  function getSessionId() {
    const key = 'nism_chat_session_id';
    let value = localStorage.getItem(key);
    if (!value) {
      value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, value);
    }
    return value;
  }

  function buildWidget() {
    const root = document.createElement('div');
    root.innerHTML = `
      <button class="nism-chat-launcher" type="button" aria-expanded="false" aria-controls="nismChatPanel">
        <span class="nism-chat-dot" aria-hidden="true"></span>
        <span>Ask NISMSTUDY</span>
      </button>
      <section class="nism-chat-panel" id="nismChatPanel" aria-label="NISMSTUDY chat assistant">
        <header class="nism-chat-head">
          <div>
            <h2 class="nism-chat-title">NISMSTUDY Assistant</h2>
            <p class="nism-chat-subtitle">Answers from NISMSTUDY course and support information.</p>
          </div>
          <button class="nism-chat-close" type="button" aria-label="Close chat">&times;</button>
        </header>
        <div class="nism-chat-messages" role="log" aria-live="polite"></div>
        <div class="nism-chat-chips"></div>
        <form class="nism-chat-form">
          <textarea class="nism-chat-input" rows="1" maxlength="700" placeholder="Ask about courses, access, pricing, mock tests..." aria-label="Chat message"></textarea>
          <button class="nism-chat-send" type="submit">Send</button>
          <p class="nism-chat-note">For account-specific payment or access issues, contact info@nismstudy.in.</p>
        </form>
      </section>`;
    document.body.appendChild(root);

    return {
      launcher: root.querySelector('.nism-chat-launcher'),
      panel: root.querySelector('.nism-chat-panel'),
      close: root.querySelector('.nism-chat-close'),
      messages: root.querySelector('.nism-chat-messages'),
      chips: root.querySelector('.nism-chat-chips'),
      form: root.querySelector('.nism-chat-form'),
      input: root.querySelector('.nism-chat-input'),
      send: root.querySelector('.nism-chat-send')
    };
  }

  function addMessage(ui, role, text) {
    const node = document.createElement('div');
    node.className = `nism-chat-message ${role}`;
    node.innerHTML = escapeHtml(text);
    ui.messages.appendChild(node);
    ui.messages.scrollTop = ui.messages.scrollHeight;
    return node;
  }

  function setOpen(ui, open) {
    ui.panel.classList.toggle('is-open', open);
    ui.launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      setTimeout(() => ui.input.focus(), 50);
    }
  }

  async function sendMessage(ui, state, message) {
    const clean = message.trim();
    if (!clean || state.pending) return;

    state.pending = true;
    ui.send.disabled = true;
    addMessage(ui, 'user', clean);
    ui.input.value = '';
    const pendingNode = addMessage(ui, 'bot', 'Checking NISMSTUDY information...');

    try {
      // Pass the student's Supabase session when there is one. The assistant
      // uses it to answer "how many days do I have left?" with their real
      // number instead of the general policy. Row-level security on the other
      // end means the token can only ever read that student's own rows.
      const headers = { 'Content-Type': 'application/json' };
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: clean,
          sessionId: getSessionId(),
          history: state.history.slice(-8)
        })
      });

      if (!response.ok) throw new Error(`Chat API returned ${response.status}`);
      const data = await response.json();
      const answer = String(data.answer || data.response || '').trim();
      pendingNode.innerHTML = escapeHtml(answer || 'I could not generate an answer. Please contact info@nismstudy.in.');
      state.history.push({ role: 'user', content: clean });
      state.history.push({ role: 'assistant', content: answer });
    } catch (error) {
      console.error(error);
      pendingNode.innerHTML = escapeHtml('The chat service is not available right now. Please email info@nismstudy.in for help.');
    } finally {
      state.pending = false;
      ui.send.disabled = false;
      ui.messages.scrollTop = ui.messages.scrollHeight;
    }
  }

  // The chat API lives on a separate host that is not always deployed. Showing
  // a launcher that answers every question with "the chat service is not
  // available" is worse than showing nothing, so probe first and only build the
  // widget if something actually answers.
  async function apiIsReachable() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'ping', sessionId: 'healthcheck', history: [] }),
        signal: controller.signal
      });
      clearTimeout(timer);
      return response.ok;
    } catch {
      return false;
    }
  }

  async function init() {
    if (!(await apiIsReachable())) return;
    ensureStylesheet();
    const ui = buildWidget();
    const state = { pending: false, history: [] };

    addMessage(ui, 'bot', 'Ask me about NISMSTUDY courses, pricing, access duration, free workbooks, mock tests, or exam preparation.');
    ui.chips.innerHTML = quickQuestions
      .map((question) => `<button class="nism-chat-chip" type="button">${escapeHtml(question)}</button>`)
      .join('');

    ui.launcher.addEventListener('click', () => setOpen(ui, !ui.panel.classList.contains('is-open')));
    ui.close.addEventListener('click', () => setOpen(ui, false));
    ui.form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(ui, state, ui.input.value);
    });
    ui.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        ui.form.requestSubmit();
      }
    });
    ui.chips.addEventListener('click', (event) => {
      const chip = event.target.closest('.nism-chat-chip');
      if (!chip) return;
      setOpen(ui, true);
      sendMessage(ui, state, chip.textContent || '');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
