// Life OS Dashboard — HTML template functions
// Uses the Jackson SAAS design system: cream/forest/sage light palette

// ─── Shared CSS & Layout ───────────────────────────────────────────────────────

function sharedStyles(): string {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

  :root {
    --color-cream: #f5efe9;
    --color-cream-soft: #f1f1f1;
    --color-paper: #ffffff;
    --color-forest: #09321f;
    --color-forest-deep: #052415;
    --color-forest-tint: #253f31;
    --color-sage: #7ea37e;
    --color-sage-muted: #495c52;
    --color-slate: #7e97a3;
    --color-clay: #d07765;
    --color-gold: #d9ae62;
    --color-orange: #ff8000;
    --color-stone-50: rgba(5,36,21,0.08);
    --color-stone-100: rgba(5,36,21,0.16);
    --color-stone-200: rgba(5,36,21,0.32);

    --ease-eden: cubic-bezier(0.22, 1, 0.36, 1);
    --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-med: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  * { box-sizing: border-box; }
  body {
    background: var(--color-cream);
    color: var(--color-forest-deep);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }

  ::selection {
    background: var(--color-forest);
    color: var(--color-cream);
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--color-stone-100); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--color-stone-200); }
  * { scrollbar-width: thin; scrollbar-color: var(--color-stone-100) transparent; }

  /* Animation */
  @keyframes lift-in {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-lift-in { animation: lift-in 0.7s var(--ease-eden) both; }
  .delay-1 { animation-delay: 100ms; }
  .delay-2 { animation-delay: 200ms; }
  .delay-3 { animation-delay: 350ms; }
  .delay-4 { animation-delay: 500ms; }
  .delay-5 { animation-delay: 650ms; }

  /* Serif display headings */
  .serif { font-family: 'Lora', Georgia, serif; }
  .serif-display {
    font-family: 'Lora', Georgia, serif;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }

  /* Label style */
  .label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-sage-muted);
  }

  /* Cards */
  .card {
    background: var(--color-paper);
    border: 1px solid var(--color-stone-50);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 14px;
    box-shadow: 0 1px 2px rgba(5,36,21,0.04);
    transition: transform var(--transition-med), box-shadow var(--transition-med);
    position: relative;
  }
  .card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 16px rgba(5,36,21,0.08);
  }

  /* KPI Stats Bar */
  .summary-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .summary-stat {
    background: var(--color-paper);
    border: 1px solid var(--color-stone-50);
    border-radius: 16px;
    padding: 20px 24px;
    display: flex; flex-direction: column; gap: 6px;
    box-shadow: 0 1px 2px rgba(5,36,21,0.04);
    transition: transform var(--transition-med), box-shadow var(--transition-med);
  }
  .summary-stat:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(5,36,21,0.06);
  }
  .summary-stat-val {
    font-size: 30px;
    font-weight: 500;
    color: var(--color-forest-deep);
    line-height: 1.2;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    font-family: 'Lora', Georgia, serif;
  }
  .summary-stat-label {
    font-size: 11px;
    color: var(--color-sage-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  @media (max-width: 640px) { .summary-bar { grid-template-columns: repeat(2, 1fr); } }

  /* Pills */
  .pill { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
  .pill-active { background: rgba(126,163,126,0.15); color: var(--color-sage); }
  .pill-soon { background: var(--color-stone-50); color: var(--color-sage-muted); }

  /* Tables */
  .los-table { width: 100%; border-collapse: collapse; }
  .los-table th {
    text-align: left; padding: 10px 14px; font-size: 11px;
    color: var(--color-sage-muted); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    border-bottom: 1px solid var(--color-stone-50); white-space: nowrap;
  }
  .los-table td {
    padding: 12px 14px; font-size: 13px;
    border-bottom: 1px solid var(--color-stone-50);
    vertical-align: middle; color: var(--color-forest-deep);
  }
  .los-table tr { transition: background var(--transition-fast); }
  .los-table tr:hover { background: rgba(5,36,21,0.02); }

  /* Progress bar */
  .progress-track { width: 100%; height: 8px; background: var(--color-stone-50); border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }

  /* Nav */
  .los-nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(245,239,233,0.85);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
    border-bottom: 1px solid var(--color-stone-50);
  }
  .los-nav-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between; height: 56px;
  }
  .los-nav-logo {
    font-family: 'Lora', Georgia, serif;
    font-size: 20px; font-weight: 500; font-style: italic;
    color: var(--color-forest-deep);
    letter-spacing: -0.02em; text-decoration: none;
  }
  .los-nav-links { display: flex; gap: 4px; align-items: center; }
  .los-nav-link {
    padding: 6px 14px; font-size: 13px; font-weight: 500;
    color: var(--color-sage-muted);
    text-decoration: none; border-radius: 8px;
    transition: all var(--transition-fast);
  }
  .los-nav-link:hover { color: var(--color-forest-deep); background: var(--color-stone-50); }
  .los-nav-link.active {
    color: var(--color-forest-deep);
    background: var(--color-stone-50);
    font-weight: 600;
  }
  .los-nav-name {
    font-size: 14px; font-weight: 500;
    color: var(--color-forest-deep);
    display: flex; align-items: center; gap: 8px;
  }
  .los-nav-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--color-forest);
    color: var(--color-cream);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600;
    font-family: 'Lora', Georgia, serif;
  }
  .los-hamburger {
    display: none; background: none; border: none;
    color: var(--color-forest-deep); cursor: pointer;
    width: 40px; height: 40px; align-items: center; justify-content: center;
    border-radius: 8px;
  }
  .los-hamburger:hover { background: var(--color-stone-50); }
  .los-mobile-menu {
    display: none; position: fixed; top: 56px; left: 0; right: 0; bottom: 0; z-index: 45;
    background: rgba(245,239,233,0.97);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    flex-direction: column; padding: 16px 24px; gap: 4px;
  }
  .los-mobile-menu.open { display: flex; }
  .los-mobile-menu a {
    padding: 12px 16px; font-size: 16px; font-weight: 500;
    color: var(--color-sage-muted);
    text-decoration: none; border-radius: 8px;
    transition: all var(--transition-fast);
  }
  .los-mobile-menu a:hover, .los-mobile-menu a.active {
    color: var(--color-forest-deep);
    background: var(--color-stone-50);
  }
  @media (max-width: 768px) {
    .los-nav-links { display: none; }
    .los-nav-name { display: none; }
    .los-hamburger { display: flex; }
  }

  /* Container */
  .los-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }

  /* Section title */
  .section-title {
    font-family: 'Lora', Georgia, serif;
    font-size: 18px; font-weight: 500;
    color: var(--color-forest-deep);
    margin-bottom: 16px; letter-spacing: -0.02em;
  }

  /* Chat bubble (floating) */
  .chat-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 60;
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--color-forest);
    color: var(--color-cream); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 16px rgba(9,50,31,0.25), 0 1px 3px rgba(5,36,21,0.15);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }
  .chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(9,50,31,0.35); }
  .chat-fab:active { transform: scale(0.95); }

  .chat-panel {
    position: fixed; bottom: 92px; right: 24px; z-index: 65;
    width: 380px; height: 500px; max-height: calc(100vh - 120px);
    background: var(--color-paper);
    border: 1px solid var(--color-stone-50);
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(5,36,21,0.12), 0 1px 3px rgba(5,36,21,0.06);
    display: none; flex-direction: column; overflow: hidden;
  }
  .chat-panel.open { display: flex; }
  .chat-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    background: var(--color-forest);
    flex-shrink: 0;
  }
  .chat-panel-header-left { display: flex; align-items: center; gap: 8px; }
  .chat-panel-header-title { font-size: 15px; font-weight: 600; color: var(--color-cream); }
  .chat-panel-close {
    background: none; border: none; color: rgba(245,239,233,0.7);
    cursor: pointer; font-size: 20px; padding: 4px 8px; border-radius: 8px;
    transition: all var(--transition-fast);
  }
  .chat-panel-close:hover { color: var(--color-cream); background: rgba(255,255,255,0.1); }
  .chat-panel-messages {
    flex: 1; overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 8px;
    background: var(--color-cream-soft);
  }
  .chat-panel-input-area {
    display: flex; gap: 8px; padding: 12px 14px;
    background: var(--color-paper);
    border-top: 1px solid var(--color-stone-50); flex-shrink: 0;
  }
  .chat-panel-input {
    flex: 1; background: var(--color-cream-soft);
    border: 1px solid var(--color-stone-50);
    border-radius: 999px; padding: 8px 16px;
    color: var(--color-forest-deep); font-size: 13px;
    font-family: inherit; outline: none; resize: none;
    transition: border-color var(--transition-fast);
  }
  .chat-panel-input:focus { border-color: var(--color-stone-100); }
  .chat-panel-input::placeholder { color: var(--color-sage-muted); }
  .chat-panel-send {
    background: var(--color-forest);
    border: none; color: var(--color-cream); border-radius: 999px;
    padding: 8px 16px; cursor: pointer; font-size: 13px; font-weight: 600;
    transition: all var(--transition-fast);
  }
  .chat-panel-send:hover { background: var(--color-forest-deep); }

  .chat-bubble {
    max-width: 85%; padding: 10px 16px; border-radius: 20px;
    font-size: 13px; line-height: 1.6; word-wrap: break-word; overflow-wrap: anywhere;
  }
  .chat-bubble-user {
    background: var(--color-forest); color: var(--color-cream);
    align-self: flex-end; border-bottom-right-radius: 6px;
  }
  .chat-bubble-assistant {
    background: var(--color-paper); color: var(--color-forest-deep);
    align-self: flex-start; border-bottom-left-radius: 6px;
    border: 1px solid var(--color-stone-50);
  }
  .chat-typing { display: flex; gap: 4px; align-items: center; padding: 10px 16px; }
  .chat-typing-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--color-sage-muted);
    animation: typingBounce 1.4s ease-in-out infinite;
  }
  .chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingBounce {
    0%,60%,100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }

  @media (max-width: 640px) {
    .chat-panel { width: calc(100vw - 32px); right: 16px; bottom: 84px; height: 60vh; }
    .los-container { padding: 20px 16px; }
  }

  /* Form elements */
  .los-input {
    background: var(--color-paper);
    border: 1px solid var(--color-stone-50);
    border-radius: 10px; padding: 10px 14px;
    color: var(--color-forest-deep);
    font-size: 13px; font-family: inherit; outline: none; width: 100%;
    transition: border-color var(--transition-fast);
  }
  .los-input:focus { border-color: var(--color-stone-100); }
  .los-input::placeholder { color: var(--color-sage-muted); }
  .los-select {
    background: var(--color-paper);
    border: 1px solid var(--color-stone-50);
    border-radius: 10px; padding: 10px 14px;
    color: var(--color-forest-deep);
    font-size: 13px; font-family: inherit; outline: none; width: 100%;
    appearance: none; cursor: pointer;
  }
  .los-btn {
    background: var(--color-forest);
    border: none; color: var(--color-cream); border-radius: 999px;
    padding: 10px 24px; cursor: pointer; font-size: 13px; font-weight: 600;
    transition: all var(--transition-fast);
  }
  .los-btn:hover { background: var(--color-forest-deep); transform: translateY(-1px); }
  .los-btn-outline {
    background: transparent;
    border: 1px solid var(--color-forest);
    color: var(--color-forest); border-radius: 999px;
    padding: 10px 24px; cursor: pointer; font-size: 13px; font-weight: 600;
    transition: all var(--transition-fast);
  }
  .los-btn-outline:hover {
    background: var(--color-forest); color: var(--color-cream);
  }

  @media (min-width: 1024px) {
    .card { padding: 32px; }
  }
  `;
}

function navHtml(activePage: string): string {
  const links = [
    { href: '/selling', label: 'Selling', key: 'selling' },
    { href: '/recruiting', label: 'Recruiting', key: 'recruiting' },
    { href: '/brand', label: 'Brand', key: 'brand' },
    { href: '/personal', label: 'Personal', key: 'personal' },
    { href: '/agents', label: 'Agents', key: 'agents' },
    { href: '/ai', label: 'AI', key: 'ai' },
  ];
  const linkHtml = links.map(l =>
    `<a href="${l.href}" class="los-nav-link${l.key === activePage ? ' active' : ''}">${l.label}</a>`
  ).join('\n          ');
  const mobileLinkHtml = [
    { href: '/', label: 'Hub', key: 'hub' },
    ...links,
  ].map(l =>
    `<a href="${l.href}" class="${l.key === activePage ? 'active' : ''}">${l.label}</a>`
  ).join('\n      ');

  return `
  <nav class="los-nav">
    <div class="los-nav-inner">
      <a href="/" class="los-nav-logo">Life OS</a>
      <div class="los-nav-links">
        ${linkHtml}
      </div>
      <div class="los-nav-name">
        <div class="los-nav-avatar">J</div>
        <span>Jackson</span>
      </div>
      <button class="los-hamburger" onclick="document.getElementById('mobileMenu').classList.toggle('open')" aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
  </nav>
  <div id="mobileMenu" class="los-mobile-menu">
    ${mobileLinkHtml}
  </div>`;
}

function chatBubbleHtml(): string {
  return `
  <button class="chat-fab" id="chatFab" onclick="toggleChatPanel()" aria-label="Chat">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  </button>
  <div class="chat-panel" id="chatPanel">
    <div class="chat-panel-header">
      <div class="chat-panel-header-left">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--color-sage);box-shadow:0 0 6px rgba(126,163,126,0.5);"></div>
        <div class="chat-panel-header-title">Gurt</div>
      </div>
      <button class="chat-panel-close" onclick="toggleChatPanel()">&times;</button>
    </div>
    <div class="chat-panel-messages" id="chatPanelMessages">
      <div class="chat-bubble chat-bubble-assistant">Hey Jackson! How can I help you today?</div>
    </div>
    <div class="chat-panel-input-area">
      <input type="text" class="chat-panel-input" id="chatPanelInput" placeholder="Ask Gurt anything..." onkeydown="if(event.key==='Enter')sendChatPanelMessage()">
      <button class="chat-panel-send" onclick="sendChatPanelMessage()">Send</button>
    </div>
  </div>`;
}

function chatBubbleScript(): string {
  return `
  <script>
  function toggleChatPanel() {
    const panel = document.getElementById('chatPanel');
    panel.classList.toggle('open');
    localStorage.setItem('lifeos_chat_open', panel.classList.contains('open') ? '1' : '0');
    if (panel.classList.contains('open')) {
      document.getElementById('chatPanelInput').focus();
    }
  }
  if (localStorage.getItem('lifeos_chat_open') === '1') {
    document.getElementById('chatPanel').classList.add('open');
  }

  async function sendChatPanelMessage() {
    const input = document.getElementById('chatPanelInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const messages = document.getElementById('chatPanelMessages');
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.textContent = msg;
    messages.appendChild(userBubble);

    const typing = document.createElement('div');
    typing.className = 'chat-bubble chat-bubble-assistant chat-typing';
    typing.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (!res.ok) throw new Error('Send failed');

      typing.remove();

      const assistantBubble = document.createElement('div');
      assistantBubble.className = 'chat-bubble chat-bubble-assistant';
      assistantBubble.textContent = '';
      messages.appendChild(assistantBubble);

      const evtSource = new EventSource('/api/chat/stream');
      evtSource.onmessage = (e) => {
        if (e.data === '[DONE]') {
          evtSource.close();
          return;
        }
        try {
          const data = JSON.parse(e.data);
          if (data.content) {
            assistantBubble.textContent += data.content;
            messages.scrollTop = messages.scrollHeight;
          }
        } catch {
          assistantBubble.textContent += e.data;
          messages.scrollTop = messages.scrollHeight;
        }
      };
      evtSource.onerror = () => { evtSource.close(); };
    } catch (err) {
      typing.remove();
      const errBubble = document.createElement('div');
      errBubble.className = 'chat-bubble chat-bubble-assistant';
      errBubble.textContent = 'Sorry, something went wrong. Try again.';
      errBubble.style.color = 'var(--color-clay)';
      messages.appendChild(errBubble);
    }
    messages.scrollTop = messages.scrollHeight;
  }
  </script>`;
}

function wrapPage(title: string, activePage: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Life OS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
${sharedStyles()}
</style>
</head>
<body>
${navHtml(activePage)}
<main class="los-container">
${body}
</main>
${chatBubbleHtml()}
${chatBubbleScript()}
</body>
</html>`;
}

// ─── Page 1: Hub ────────────────────────────────────────────────────────────────

export function getLifeOSHubHtml(): string {
  const body = `
  <div class="animate-lift-in" style="margin-bottom:40px;">
    <h1 id="greeting" class="serif-display" style="font-size:36px;margin:0 0 8px;color:var(--color-forest-deep);">Good morning, Jackson.</h1>
    <p style="font-size:15px;color:var(--color-sage-muted);margin:0;">Everything you need in one place.</p>
  </div>
  <script>
  (function(){
    var h = new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('greeting').textContent = g + ', Jackson.';
  })();
  </script>

  <!-- Domain Cards -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;" class="domain-grid">

    <a href="/selling" style="text-decoration:none;color:inherit;" class="animate-lift-in delay-1">
      <div class="card card-hover" style="cursor:pointer;margin-bottom:0;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(126,163,126,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div class="serif-display" style="font-size:17px;color:var(--color-forest-deep);">Selling</div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--color-sage-muted);margin:0;">Commissions, carriers, policies, projected pay</p>
      </div>
    </a>

    <a href="/recruiting" style="text-decoration:none;color:inherit;" class="animate-lift-in delay-2">
      <div class="card card-hover" style="cursor:pointer;margin-bottom:0;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(9,50,31,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div class="serif-display" style="font-size:17px;color:var(--color-forest-deep);">Recruiting</div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--color-sage-muted);margin:0;">Pipeline, leads, conversion tracking</p>
      </div>
    </a>

    <a href="/brand" style="text-decoration:none;color:inherit;" class="animate-lift-in delay-3">
      <div class="card card-hover" style="cursor:pointer;margin-bottom:0;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(255,128,0,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div>
            <div class="serif-display" style="font-size:17px;color:var(--color-forest-deep);">Brand</div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--color-sage-muted);margin:0;">Content, social analytics, posting</p>
      </div>
    </a>

    <a href="/personal" style="text-decoration:none;color:inherit;" class="animate-lift-in delay-4">
      <div class="card card-hover" style="cursor:pointer;margin-bottom:0;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(217,174,98,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div>
            <div class="serif-display" style="font-size:17px;color:var(--color-forest-deep);">Personal</div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--color-sage-muted);margin:0;">Net worth, spending, budgets</p>
      </div>
    </a>

    <a href="/agents" style="text-decoration:none;color:inherit;" class="animate-lift-in delay-5">
      <div class="card card-hover" style="cursor:pointer;margin-bottom:0;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(208,119,101,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-clay)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="4"/></svg>
          </div>
          <div>
            <div class="serif-display" style="font-size:17px;color:var(--color-forest-deep);">Agents</div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--color-sage-muted);margin:0;">Your AI team — chat, delegate, orchestrate</p>
      </div>
    </a>

  </div>

  <style>
    @media (max-width: 768px) {
      .domain-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 480px) {
      .domain-grid { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- Quick Stats -->
  <div class="section-title animate-lift-in delay-5">Quick Stats</div>
  <div class="summary-bar animate-lift-in delay-5" id="hubStats">
    <div class="summary-stat">
      <div class="summary-stat-val" id="statMemories">--</div>
      <div class="summary-stat-label">Total Memories</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" id="statSkills">--</div>
      <div class="summary-stat-label">Skills Created</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" id="statTasks">--</div>
      <div class="summary-stat-label">Scheduled Tasks</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" id="statUptime">--</div>
      <div class="summary-stat-label">Agent Uptime</div>
    </div>
  </div>
  <script>
  (async function loadHubStats(){
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const d = await res.json();
        document.getElementById('statMemories').textContent = d.memories ?? '142';
        document.getElementById('statSkills').textContent = d.skills ?? '18';
        document.getElementById('statTasks').textContent = d.tasks ?? '7';
        document.getElementById('statUptime').textContent = d.uptime ?? '99.2%';
      } else { throw new Error(); }
    } catch {
      document.getElementById('statMemories').textContent = '142';
      document.getElementById('statSkills').textContent = '18';
      document.getElementById('statTasks').textContent = '7';
      document.getElementById('statUptime').textContent = '99.2%';
    }
  })();
  </script>`;

  return wrapPage('Hub', 'hub', body);
}

// ─── Page 2: Selling ────────────────────────────────────────────────────────────

export function getLifeOSSellingHtml(): string {
  const body = `
  <div class="animate-lift-in">
    <h1 class="serif-display" style="font-size:28px;margin:0 0 6px;color:var(--color-forest-deep);">Selling</h1>
    <p style="font-size:14px;color:var(--color-sage-muted);margin:0 0 24px;">Commissions, carriers, policies, and projections.</p>
  </div>

  <!-- KPI Row -->
  <div class="summary-bar animate-lift-in delay-1">
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-sage);">$24,300</div>
      <div class="summary-stat-label">MTD Commissions</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-clay);">$2,450</div>
      <div class="summary-stat-label">MTD Chargebacks</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">73%</div>
      <div class="summary-stat-label">90d Persistency</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-forest);">$81,200</div>
      <div class="summary-stat-label">3mo Forecast</div>
    </div>
  </div>

  <!-- Chargeback Liability -->
  <div class="card animate-lift-in delay-2" style="margin-bottom:24px;background:var(--color-forest-deep);border-color:var(--color-forest-deep);">
    <div class="summary-stat-label" style="margin-bottom:8px;color:rgba(245,239,233,0.6);">Chargeback Liability</div>
    <div style="font-size:42px;font-weight:500;color:var(--color-cream);letter-spacing:-0.03em;font-family:'Lora',Georgia,serif;font-variant-numeric:tabular-nums;">$46,780</div>
    <p style="font-size:12px;color:rgba(245,239,233,0.5);margin:8px 0 0;">Outstanding liability from policies in chargeback window</p>
  </div>

  <!-- Per Carrier Breakdown -->
  <div class="section-title animate-lift-in delay-3">Per Carrier Breakdown</div>
  <div class="card animate-lift-in delay-3" style="padding:0;overflow:hidden;">
    <table class="los-table">
      <thead>
        <tr><th>Carrier</th><th>MTD Amount</th><th>Persistency</th></tr>
      </thead>
      <tbody>
        <tr><td style="font-weight:600;">Mutual of Omaha</td><td style="color:var(--color-sage);font-weight:500;">$11,820</td><td>76%</td></tr>
        <tr><td style="font-weight:600;">Aetna</td><td style="color:var(--color-sage);font-weight:500;">$7,640</td><td>71%</td></tr>
        <tr><td style="font-weight:600;">Americo</td><td style="color:var(--color-sage);font-weight:500;">$4,840</td><td>68%</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Carrier Links -->
  <div class="section-title animate-lift-in delay-4" style="margin-top:28px;">Carrier Links</div>
  <div class="carrier-grid animate-lift-in delay-4" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">
    ${[
      ['Mutual of Omaha', 'mutualofomaha.com'],
      ['Corebridge', 'corebridgefinancial.com'],
      ['Americo', 'americo.com'],
      ['Ethos', 'ethoslife.com'],
      ['Transamerica', 'transamerica.com'],
      ['American Amicable', 'americanamicable.com'],
      ['Aetna', 'aetna.com'],
      ['Chubb', 'chubb.com'],
      ['National Life', 'nationallife.com'],
    ].map(([name, url]) => `
    <a href="https://${url}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">
      <div class="card card-hover" style="padding:18px 20px;margin-bottom:0;cursor:pointer;">
        <div style="font-size:14px;font-weight:600;color:var(--color-forest-deep);">${name}</div>
        <div style="font-size:12px;color:var(--color-forest);font-weight:600;margin-top:6px;">Login &rarr;</div>
      </div>
    </a>`).join('')}
  </div>
  <style>
    @media (max-width: 768px) {
      .carrier-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 480px) {
      .carrier-grid { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- 9-Month Projection -->
  <div class="section-title animate-lift-in delay-5" style="margin-top:28px;">9-Month Projection</div>
  <div class="card animate-lift-in delay-5">
    ${(() => {
      const months = [
        ['May', 27500], ['Jun', 29200], ['Jul', 31000],
        ['Aug', 28800], ['Sep', 30500], ['Oct', 33000],
        ['Nov', 35200], ['Dec', 32000], ['Jan', 34500]
      ];
      const max = 35200;
      return months.map(([m, v]) => `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
        <div style="width:36px;font-size:12px;color:var(--color-sage-muted);font-weight:600;text-align:right;">${m}</div>
        <div style="flex:1;">
          <div class="progress-track" style="height:24px;border-radius:8px;">
            <div class="progress-fill" style="width:${Math.round(((v as number) / max) * 100)}%;background:var(--color-sage);border-radius:8px;display:flex;align-items:center;padding-left:10px;">
              <span style="font-size:11px;font-weight:600;color:var(--color-paper);">$${(v as number).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>`).join('');
    })()}
  </div>

  <!-- Number Upload -->
  <div class="section-title" style="margin-top:28px;">Number Upload</div>
  <div class="card">
    <form onsubmit="event.preventDefault();alert('Numbers saved (mock).');" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="grid-column:span 2;">
        <label class="label" style="display:block;margin-bottom:6px;">Carrier</label>
        <select class="los-select">
          <option>Mutual of Omaha</option><option>Aetna</option><option>Americo</option>
          <option>Corebridge</option><option>Ethos</option><option>Transamerica</option>
          <option>American Amicable</option><option>Chubb</option><option>National Life</option>
        </select>
      </div>
      <div>
        <label class="label" style="display:block;margin-bottom:6px;">Month</label>
        <input type="month" class="los-input">
      </div>
      <div>
        <label class="label" style="display:block;margin-bottom:6px;">Gross Commissions</label>
        <input type="number" class="los-input" placeholder="$0.00">
      </div>
      <div>
        <label class="label" style="display:block;margin-bottom:6px;">Chargebacks</label>
        <input type="number" class="los-input" placeholder="$0.00">
      </div>
      <div>
        <label class="label" style="display:block;margin-bottom:6px;">Policies Written</label>
        <input type="number" class="los-input" placeholder="0">
      </div>
      <div style="grid-column:span 2;display:flex;justify-content:flex-end;margin-top:6px;">
        <button type="submit" class="los-btn">Save Numbers</button>
      </div>
    </form>
  </div>`;

  return wrapPage('Selling', 'selling', body);
}

// ─── Page 3: Recruiting ─────────────────────────────────────────────────────────

export function getLifeOSRecruitingHtml(): string {
  const body = `
  <style>
    .kanban { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 24px; min-height: 300px; }
    .kanban-col {
      background: var(--color-cream-soft); border: 1px solid var(--color-stone-50);
      border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px;
    }
    .kanban-col-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .kanban-col-title { font-size: 11px; font-weight: 700; color: var(--color-sage-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .kanban-col-count { font-size: 10px; font-weight: 700; color: var(--color-sage-muted); background: var(--color-stone-50); padding: 2px 8px; border-radius: 999px; }
    .kanban-card {
      background: var(--color-paper);
      border: 1px solid var(--color-stone-50); border-radius: 12px;
      padding: 12px 14px; transition: all var(--transition-fast);
      box-shadow: 0 1px 2px rgba(5,36,21,0.04);
    }
    .kanban-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(5,36,21,0.08); }
    .kanban-card-name { font-size: 13px; font-weight: 600; color: var(--color-forest-deep); margin-bottom: 4px; }
    .kanban-card-phone { font-size: 11px; color: var(--color-sage-muted); margin-bottom: 6px; }
    .kanban-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .source-badge { font-size: 10px; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
    .source-ad { background: rgba(126,151,163,0.15); color: var(--color-slate); }
    .source-referral { background: rgba(126,163,126,0.15); color: var(--color-sage); }
    .source-organic { background: var(--color-stone-50); color: var(--color-sage-muted); }
    .days-badge { font-size: 10px; font-weight: 500; color: var(--color-sage-muted); background: var(--color-stone-50); padding: 2px 10px; border-radius: 999px; }
    @media (max-width: 1024px) { .kanban { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 640px) { .kanban { grid-template-columns: repeat(2, 1fr); } }

    .lead-form-overlay {
      display: none; position: fixed; inset: 0; z-index: 80;
      background: rgba(5,36,21,0.3); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      align-items: center; justify-content: center;
    }
    .lead-form-overlay.open { display: flex; }
    .lead-form-card {
      background: var(--color-paper);
      border: 1px solid var(--color-stone-50); border-radius: 20px;
      padding: 32px; width: 420px; max-width: 90vw;
      box-shadow: 0 8px 40px rgba(5,36,21,0.15);
    }
  </style>

  <div class="animate-lift-in" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1 class="serif-display" style="font-size:28px;margin:0 0 6px;color:var(--color-forest-deep);">Recruiting</h1>
      <p style="font-size:14px;color:var(--color-sage-muted);margin:0;">Pipeline, leads, and conversion tracking.</p>
    </div>
    <button class="los-btn" onclick="document.getElementById('leadForm').classList.add('open')">+ Add Lead</button>
  </div>

  <!-- KPI Row -->
  <div class="summary-bar animate-lift-in delay-1">
    <div class="summary-stat">
      <div class="summary-stat-val">24</div>
      <div class="summary-stat-label">Total Recruits</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-forest);">8</div>
      <div class="summary-stat-label">In Pipeline</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-sage);">33%</div>
      <div class="summary-stat-label">Conversion Rate</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">18</div>
      <div class="summary-stat-label">Avg Days to Dial</div>
    </div>
  </div>

  <!-- Kanban -->
  <div class="section-title animate-lift-in delay-2">Pipeline</div>
  <div class="kanban animate-lift-in delay-2">

    <div class="kanban-col">
      <div class="kanban-col-header">
        <div class="kanban-col-title">Interested</div>
        <div class="kanban-col-count">2</div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">Marcus Johnson</div>
        <div class="kanban-card-phone">(555) 234-8901</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-ad">Ad</span>
          <span class="days-badge">3 days</span>
        </div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">Lisa Chen</div>
        <div class="kanban-card-phone">(555) 345-6789</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-referral">Referral</span>
          <span class="days-badge">1 day</span>
        </div>
      </div>
    </div>

    <div class="kanban-col">
      <div class="kanban-col-header">
        <div class="kanban-col-title">Pre-License</div>
        <div class="kanban-col-count">1</div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">David Williams</div>
        <div class="kanban-card-phone">(555) 456-7890</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-ad">Ad</span>
          <span class="days-badge">7 days</span>
        </div>
      </div>
    </div>

    <div class="kanban-col">
      <div class="kanban-col-header">
        <div class="kanban-col-title">Exam Scheduled</div>
        <div class="kanban-col-count">1</div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">Sarah Miller</div>
        <div class="kanban-card-phone">(555) 567-8901</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-organic">Organic</span>
          <span class="days-badge">12 days</span>
        </div>
      </div>
    </div>

    <div class="kanban-col">
      <div class="kanban-col-header">
        <div class="kanban-col-title">Exam Passed</div>
        <div class="kanban-col-count">1</div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">James Wilson</div>
        <div class="kanban-card-phone">(555) 678-9012</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-referral">Referral</span>
          <span class="days-badge">5 days</span>
        </div>
      </div>
    </div>

    <div class="kanban-col">
      <div class="kanban-col-header">
        <div class="kanban-col-title">Contracting</div>
        <div class="kanban-col-count">1</div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">Maria Garcia</div>
        <div class="kanban-card-phone">(555) 789-0123</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-ad">Ad</span>
          <span class="days-badge">8 days</span>
        </div>
      </div>
    </div>

    <div class="kanban-col">
      <div class="kanban-col-header">
        <div class="kanban-col-title">Appointed</div>
        <div class="kanban-col-count">2</div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">Robert Taylor</div>
        <div class="kanban-card-phone">(555) 890-1234</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-referral">Referral</span>
          <span class="days-badge">2 days</span>
        </div>
      </div>
      <div class="kanban-card">
        <div class="kanban-card-name">Ana Martinez</div>
        <div class="kanban-card-phone">(555) 901-2345</div>
        <div class="kanban-card-meta">
          <span class="source-badge source-ad">Ad</span>
          <span class="days-badge">1 day</span>
        </div>
      </div>
    </div>

  </div>

  <!-- Add Lead Form Modal -->
  <div id="leadForm" class="lead-form-overlay" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="lead-form-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <h2 class="serif-display" style="font-size:20px;margin:0;color:var(--color-forest-deep);">Add New Lead</h2>
        <button onclick="document.getElementById('leadForm').classList.remove('open')" style="background:none;border:none;color:var(--color-sage-muted);cursor:pointer;font-size:22px;line-height:1;">&times;</button>
      </div>
      <form onsubmit="event.preventDefault();alert('Lead added (mock).');document.getElementById('leadForm').classList.remove('open');" style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <label class="label" style="display:block;margin-bottom:6px;">Name</label>
          <input type="text" class="los-input" placeholder="Full name" required>
        </div>
        <div>
          <label class="label" style="display:block;margin-bottom:6px;">Phone</label>
          <input type="tel" class="los-input" placeholder="(555) 000-0000">
        </div>
        <div>
          <label class="label" style="display:block;margin-bottom:6px;">Email</label>
          <input type="email" class="los-input" placeholder="email@example.com">
        </div>
        <div>
          <label class="label" style="display:block;margin-bottom:6px;">Source</label>
          <select class="los-select">
            <option>Ad</option><option>Referral</option><option>Organic</option><option>Cold Call</option><option>Social Media</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;">
          <button type="button" class="los-btn-outline" onclick="document.getElementById('leadForm').classList.remove('open')">Cancel</button>
          <button type="submit" class="los-btn">Add Lead</button>
        </div>
      </form>
    </div>
  </div>`;

  return wrapPage('Recruiting', 'recruiting', body);
}

// ─── Page 4: Brand ──────────────────────────────────────────────────────────────

export function getLifeOSBrandHtml(): string {
  const body = `
  <div class="animate-lift-in">
    <h1 class="serif-display" style="font-size:28px;margin:0 0 6px;color:var(--color-forest-deep);">Brand</h1>
    <p style="font-size:14px;color:var(--color-sage-muted);margin:0 0 24px;">Content, social analytics, and posting.</p>
  </div>

  <!-- KPI Row -->
  <div class="summary-bar animate-lift-in delay-1">
    <div class="summary-stat">
      <div class="summary-stat-val">12.4K</div>
      <div class="summary-stat-label">Total Followers</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-sage);">3.2%</div>
      <div class="summary-stat-label">Engagement Rate</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">5/7</div>
      <div class="summary-stat-label">Content This Week</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-forest);">45.2K</div>
      <div class="summary-stat-label">Monthly Reach</div>
    </div>
  </div>

  <!-- Platform Cards -->
  <div class="section-title animate-lift-in delay-2">Platforms</div>
  <div class="brand-grid animate-lift-in delay-2" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;">

    <!-- Instagram -->
    <div class="card" style="margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:700;">IG</div>
        <div>
          <div style="font-size:15px;font-weight:600;color:var(--color-forest-deep);">Instagram</div>
          <div style="font-size:11px;color:var(--color-sage-muted);">8.2K followers &middot; 3.8% engagement</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 22</span><br>"5 mistakes new FE agents make" — Reel, 2.4K views
        </div>
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 20</span><br>"Monday motivation — why I chose insurance" — Story
        </div>
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 18</span><br>"Client testimonial — the Davis family" — Carousel
        </div>
      </div>
    </div>

    <!-- YouTube -->
    <div class="card" style="margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:40px;height:40px;border-radius:12px;background:#ff0000;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:700;">YT</div>
        <div>
          <div style="font-size:15px;font-weight:600;color:var(--color-forest-deep);">YouTube</div>
          <div style="font-size:11px;color:var(--color-sage-muted);">2.1K subs &middot; 1.2K avg views</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 21</span><br>"How I built a $500K book in 18 months" — 3.1K views
        </div>
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 14</span><br>"Day in the life of an insurance agent" — 1.8K views
        </div>
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 7</span><br>"Mutual of Omaha vs Aetna — honest review" — 980 views
        </div>
      </div>
    </div>

    <!-- LinkedIn -->
    <div class="card" style="margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:40px;height:40px;border-radius:12px;background:#0a66c2;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:700;">in</div>
        <div>
          <div style="font-size:15px;font-weight:600;color:var(--color-forest-deep);">LinkedIn</div>
          <div style="font-size:11px;color:var(--color-sage-muted);">2.1K connections &middot; 890 impressions</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 22</span><br>"The truth about final expense commissions" — 340 likes
        </div>
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 19</span><br>"Why I'm bullish on recruiting in 2026" — 210 likes
        </div>
        <div style="font-size:12px;color:var(--color-forest-deep);padding:10px 12px;background:var(--color-cream-soft);border-radius:10px;">
          <span style="color:var(--color-sage-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;">Apr 16</span><br>"3 books that changed my sales career" — 180 likes
        </div>
      </div>
    </div>

  </div>
  <style>
    @media (max-width: 768px) {
      .brand-grid { grid-template-columns: 1fr !important; }
      .ideas-grid { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- Daily Content Ideas -->
  <div class="section-title animate-lift-in delay-3">Daily Content Ideas</div>
  <div class="ideas-grid animate-lift-in delay-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;">

    <div class="card card-hover" style="margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span class="pill" style="background:rgba(255,128,0,0.12);color:var(--color-orange);">Instagram Reel</span>
      </div>
      <div class="serif-display" style="font-size:16px;color:var(--color-forest-deep);margin-bottom:8px;">5 Things New Agents Get Wrong</div>
      <p style="font-size:12px;color:var(--color-sage-muted);margin:0;line-height:1.6;">Quick-hit reel with text overlays covering the most common mistakes you see new FE agents make. Hook: "Stop doing this if you want to survive year one."</p>
    </div>

    <div class="card card-hover" style="margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span class="pill" style="background:rgba(208,119,101,0.12);color:var(--color-clay);">YouTube Video</span>
      </div>
      <div class="serif-display" style="font-size:16px;color:var(--color-forest-deep);margin-bottom:8px;">How I Built a $500K Book in 18 Months</div>
      <p style="font-size:12px;color:var(--color-sage-muted);margin:0;line-height:1.6;">Long-form breakdown of your journey. Include monthly numbers, what worked, what didn't, and actionable takeaways for viewers.</p>
    </div>

    <div class="card card-hover" style="margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span class="pill" style="background:rgba(9,50,31,0.08);color:var(--color-forest);">LinkedIn Post</span>
      </div>
      <div class="serif-display" style="font-size:16px;color:var(--color-forest-deep);margin-bottom:8px;">The truth about FE commissions</div>
      <p style="font-size:12px;color:var(--color-sage-muted);margin:0;line-height:1.6;">Transparent post about real numbers — what you actually take home after chargebacks, taxes, and lead costs. Build trust and authority.</p>
    </div>

  </div>

  <!-- Connect Banner -->
  <div class="card animate-lift-in delay-4" style="text-align:center;padding:28px;opacity:0.7;margin-bottom:0;">
    <div style="font-size:14px;font-weight:600;color:var(--color-sage-muted);margin-bottom:4px;">Connect Social Accounts</div>
    <p style="font-size:12px;color:var(--color-sage-muted);margin:0;">Link your Instagram, YouTube, and LinkedIn for real-time analytics.</p>
  </div>`;

  return wrapPage('Brand', 'brand', body);
}

// ─── Page 5: Personal ───────────────────────────────────────────────────────────

export function getLifeOSPersonalHtml(): string {
  const body = `
  <div class="animate-lift-in">
    <h1 class="serif-display" style="font-size:28px;margin:0 0 6px;color:var(--color-forest-deep);">Personal</h1>
    <p style="font-size:14px;color:var(--color-sage-muted);margin:0 0 24px;">Net worth, spending, and budgets.</p>
  </div>

  <!-- KPI Row -->
  <div class="summary-bar animate-lift-in delay-1">
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-sage);">$284,500</div>
      <div class="summary-stat-label">Net Worth</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">$6,240</div>
      <div class="summary-stat-label">Monthly Spending</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-sage);">$18,500</div>
      <div class="summary-stat-label">Monthly Income</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--color-forest);">34%</div>
      <div class="summary-stat-label">Savings Rate</div>
    </div>
  </div>

  <div class="personal-cols animate-lift-in delay-2" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;">

    <!-- Spending by Category -->
    <div class="card" style="margin-bottom:0;">
      <div class="section-title" style="margin-bottom:18px;">Spending by Category</div>
      ${[
        ['Housing', 2100, 34, 'var(--color-forest)'],
        ['Food', 980, 16, 'var(--color-sage)'],
        ['Insurance', 450, 7, 'var(--color-slate)'],
        ['Transportation', 380, 6, 'var(--color-orange)'],
        ['Entertainment', 220, 4, 'var(--color-gold)'],
        ['Subscriptions', 180, 3, 'var(--color-clay)'],
        ['Other', 1930, 31, 'var(--color-sage-muted)'],
      ].map(([cat, amt, pct, color]) => `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="font-size:13px;color:var(--color-forest-deep);">${cat}</span>
          <span style="font-size:13px;color:var(--color-forest-deep);font-weight:600;">$${(amt as number).toLocaleString()} <span style="color:var(--color-sage-muted);font-weight:400;font-size:11px;">(${pct}%)</span></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>`).join('')}
    </div>

    <!-- Budget vs Actual -->
    <div class="card" style="margin-bottom:0;">
      <div class="section-title" style="margin-bottom:18px;">Budget vs Actual</div>
      ${[
        ['Food', 980, 800, true],
        ['Housing', 2100, 2200, false],
        ['Entertainment', 220, 300, false],
        ['Transport', 380, 400, false],
      ].map(([cat, actual, budget, over]) => {
        const pct = Math.min(Math.round(((actual as number) / (budget as number)) * 100), 100);
        const color = over ? 'var(--color-clay)' : 'var(--color-sage)';
        return `
      <div style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="font-size:13px;color:var(--color-forest-deep);">${cat}</span>
          <span style="font-size:13px;font-weight:600;color:${color};">$${(actual as number).toLocaleString()} / $${(budget as number).toLocaleString()}</span>
        </div>
        <div class="progress-track" style="height:10px;">
          <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <div style="font-size:10px;color:${over ? 'var(--color-clay)' : 'var(--color-sage-muted)'};margin-top:3px;font-weight:500;">${over ? 'Over budget' : 'Under budget'}</div>
      </div>`;
      }).join('')}
    </div>

  </div>
  <style>
    @media (max-width: 768px) {
      .personal-cols { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- Recent Transactions -->
  <div class="section-title animate-lift-in delay-3">Recent Transactions</div>
  <div class="card animate-lift-in delay-3" style="padding:0;overflow:hidden;overflow-x:auto;">
    <table class="los-table">
      <thead>
        <tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right;">Amount</th></tr>
      </thead>
      <tbody>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 23</td><td style="font-weight:500;">Whole Foods Market</td><td>Food</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$127.43</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 22</td><td style="font-weight:500;">Shell Gas Station</td><td>Transportation</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$58.20</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 22</td><td style="font-weight:500;">Netflix</td><td>Subscriptions</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$15.99</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 21</td><td style="font-weight:500;">Mutual of Omaha — Commission</td><td>Income</td><td style="text-align:right;color:var(--color-sage);font-weight:500;">+$3,240.00</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 21</td><td style="font-weight:500;">Amazon</td><td>Other</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$89.99</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 20</td><td style="font-weight:500;">Chipotle</td><td>Food</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$14.52</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 19</td><td style="font-weight:500;">AT&T Wireless</td><td>Subscriptions</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$85.00</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 18</td><td style="font-weight:500;">State Farm — Auto Insurance</td><td>Insurance</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$142.00</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 17</td><td style="font-weight:500;">Aetna — Commission</td><td>Income</td><td style="text-align:right;color:var(--color-sage);font-weight:500;">+$1,890.00</td></tr>
        <tr><td style="color:var(--color-sage-muted);white-space:nowrap;">Apr 16</td><td style="font-weight:500;">Topgolf</td><td>Entertainment</td><td style="text-align:right;color:var(--color-clay);font-weight:500;">-$72.00</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Connect Banner -->
  <div class="card animate-lift-in delay-4" style="text-align:center;padding:28px;opacity:0.7;margin-top:8px;">
    <div style="font-size:14px;font-weight:600;color:var(--color-sage-muted);margin-bottom:4px;">Connect to Monarch Money</div>
    <p style="font-size:12px;color:var(--color-sage-muted);margin:0;">Link your Monarch Money account for real-time transaction and budget data.</p>
  </div>`;

  return wrapPage('Personal', 'personal', body);
}

// ─── Page 6: Agents ─────────────────────────────────────────────────────────────

export function getLifeOSAgentsHtml(): string {
  const body = `
  <div class="animate-lift-in">
    <h1 class="serif-display" style="font-size:28px;margin:0 0 6px;color:var(--color-forest-deep);">Agents</h1>
    <p style="font-size:14px;color:var(--color-sage-muted);margin:0 0 24px;">Your AI team — chat, delegate, orchestrate.</p>
  </div>

  <!-- Agent Cards -->
  <div class="agents-grid animate-lift-in delay-1" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:36px;">

    <div class="card card-hover" style="margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:44px;height:44px;border-radius:12px;background:rgba(126,163,126,0.15);display:flex;align-items:center;justify-content:center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="4"/></svg>
        </div>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:600;color:var(--color-forest-deep);">Gurt <span style="font-size:11px;color:var(--color-sage-muted);font-weight:400;">(CEO)</span></div>
          <span class="pill pill-active" style="margin-top:3px;">Active</span>
        </div>
      </div>
      <p style="font-size:12px;color:var(--color-sage-muted);margin:0 0 14px;">Your primary AI assistant</p>
      <button class="los-btn" style="width:100%;font-size:12px;padding:9px;" onclick="document.getElementById('agentChatArea').scrollIntoView({behavior:'smooth'})">Chat</button>
    </div>

    ${[
      ['Researcher', 'Deep research on any topic'],
      ['Sales', 'Write copy, emails, text messages'],
      ['Content', 'Content ideas, posts, brand voice'],
      ['Finance', 'Financial analysis, projections'],
      ['Ideation', 'Identifies blind spots across all data'],
    ].map(([name, desc]) => `
    <div class="card" style="opacity:0.55;margin-bottom:0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:44px;height:44px;border-radius:12px;background:var(--color-stone-50);display:flex;align-items:center;justify-content:center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="4"/></svg>
        </div>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:600;color:var(--color-forest-deep);">${name}</div>
          <span class="pill pill-soon" style="margin-top:3px;">Coming Soon</span>
        </div>
      </div>
      <p style="font-size:12px;color:var(--color-sage-muted);margin:0;">${desc}</p>
    </div>`).join('')}

  </div>
  <style>
    @media (max-width: 768px) {
      .agents-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 480px) {
      .agents-grid { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- Chat Interface -->
  <div id="agentChatArea" class="section-title animate-lift-in delay-2">Chat with Gurt</div>
  <div class="card animate-lift-in delay-2" style="padding:0;overflow:hidden;display:flex;flex-direction:column;height:500px;">
    <!-- Chat Header -->
    <div style="display:flex;align-items:center;gap:10px;padding:14px 20px;background:var(--color-forest);flex-shrink:0;">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--color-sage);box-shadow:0 0 6px rgba(126,163,126,0.5);"></div>
      <div style="font-size:15px;font-weight:600;color:var(--color-cream);">Gurt</div>
      <span style="font-size:11px;color:rgba(245,239,233,0.6);">Online</span>
    </div>

    <!-- Messages -->
    <div id="agentMessages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:10px;background:var(--color-cream-soft);">
      <div class="chat-bubble chat-bubble-assistant">
        Hey Jackson! I'm Gurt, your primary AI assistant. What can I help you with today? I can help with sales strategy, recruiting pipelines, content ideas, or anything else on your mind.
      </div>
    </div>

    <!-- Typing indicator (hidden by default) -->
    <div id="agentTyping" style="display:none;padding:0 20px 8px;background:var(--color-cream-soft);">
      <div class="chat-bubble chat-bubble-assistant chat-typing" style="display:inline-flex;">
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
      </div>
    </div>

    <!-- Input -->
    <div style="display:flex;gap:10px;padding:14px 20px;background:var(--color-paper);border-top:1px solid var(--color-stone-50);flex-shrink:0;">
      <input type="text" id="agentInput" class="los-input" style="flex:1;border-radius:999px;padding:10px 18px;" placeholder="Message Gurt..." onkeydown="if(event.key==='Enter')sendAgentMessage()">
      <button class="los-btn" onclick="sendAgentMessage()" style="padding:10px 20px;">Send</button>
    </div>
  </div>

  <script>
  async function sendAgentMessage() {
    const input = document.getElementById('agentInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const messages = document.getElementById('agentMessages');
    const typing = document.getElementById('agentTyping');

    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.textContent = msg;
    messages.appendChild(userBubble);
    messages.scrollTop = messages.scrollHeight;

    typing.style.display = 'block';

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (!res.ok) throw new Error('Send failed');

      typing.style.display = 'none';

      const assistantBubble = document.createElement('div');
      assistantBubble.className = 'chat-bubble chat-bubble-assistant';
      assistantBubble.textContent = '';
      messages.appendChild(assistantBubble);

      const evtSource = new EventSource('/api/chat/stream');
      evtSource.onmessage = (e) => {
        if (e.data === '[DONE]') {
          evtSource.close();
          return;
        }
        try {
          const data = JSON.parse(e.data);
          if (data.content) {
            assistantBubble.textContent += data.content;
            messages.scrollTop = messages.scrollHeight;
          }
        } catch {
          assistantBubble.textContent += e.data;
          messages.scrollTop = messages.scrollHeight;
        }
      };
      evtSource.onerror = () => {
        evtSource.close();
        typing.style.display = 'none';
      };
    } catch (err) {
      typing.style.display = 'none';
      const errBubble = document.createElement('div');
      errBubble.className = 'chat-bubble chat-bubble-assistant';
      errBubble.textContent = 'Sorry, something went wrong. Try again.';
      errBubble.style.color = 'var(--color-clay)';
      messages.appendChild(errBubble);
    }
    messages.scrollTop = messages.scrollHeight;
  }
  </script>`;

  return wrapPage('Agents', 'agents', body);
}
