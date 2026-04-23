// Life OS Dashboard — HTML template functions
// Uses the same dark glassmorphism design system as the rawclaw dashboard

// ─── Shared CSS & Layout ───────────────────────────────────────────────────────

function sharedStyles(): string {
  return `
  :root {
    --bg-base: #0a0a10;
    --bg-surface: rgba(18, 18, 28, 0.65);
    --bg-elevated: rgba(24, 24, 38, 0.72);
    --bg-overlay: rgba(10, 10, 18, 0.85);
    --border-subtle: rgba(255, 255, 255, 0.06);
    --border-default: rgba(255, 255, 255, 0.08);
    --border-hover: rgba(255, 255, 255, 0.14);
    --accent: #3b82f6;
    --accent-glow: rgba(59, 130, 246, 0.25);
    --accent-green: #34d399;
    --accent-green-glow: rgba(52, 211, 153, 0.2);
    --accent-orange: #f97316;
    --accent-purple: #a78bfa;
    --accent-cyan: #22d3ee;
    --glass-blur: 16px;
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --shadow-card: 0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.15);
    --shadow-card-hover: 0 2px 4px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.2);
    --shadow-glow-green: 0 0 20px rgba(52, 211, 153, 0.15), 0 0 40px rgba(52, 211, 153, 0.05);
    --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-med: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  * { box-sizing: border-box; }
  body {
    background: var(--bg-base) !important;
    background-image:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59, 50, 120, 0.25) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 50%, rgba(30, 58, 110, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse 40% 40% at 10% 90%, rgba(59, 50, 120, 0.08) 0%, transparent 50%) !important;
    color: #c8cad0;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: -0.01em;
    line-height: 1.5;
    margin: 0; padding: 0;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
  * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }

  .card {
    background: var(--bg-surface);
    backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 18px;
    margin-bottom: 14px;
    box-shadow: var(--shadow-card);
    transition: transform var(--transition-med), box-shadow var(--transition-med), border-color var(--transition-fast);
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute; inset: 0; border-radius: inherit; padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
  }
  .card-hover:hover { transform: translateY(-3px); box-shadow: var(--shadow-card-hover); border-color: var(--border-hover); }

  .summary-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .summary-stat {
    background: var(--bg-surface);
    backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 14px 18px;
    display: flex; flex-direction: column; gap: 4px;
    box-shadow: var(--shadow-card);
    transition: transform var(--transition-med), box-shadow var(--transition-med), border-color var(--transition-fast);
    position: relative; overflow: hidden;
  }
  .summary-stat::before {
    content: '';
    position: absolute; inset: 0; border-radius: inherit; padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
  }
  .summary-stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); border-color: var(--border-hover); }
  .summary-stat-val { font-size: 22px; font-weight: 700; color: #f0f0f5; line-height: 1.2; letter-spacing: -0.02em; }
  .summary-stat-label { font-size: 11px; color: rgba(107,114,128,0.8); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
  @media (max-width: 640px) { .summary-bar { grid-template-columns: repeat(2, 1fr); } }

  .pill { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .pill-active { background: rgba(6, 78, 59, 0.6); color: #6ee7b7; box-shadow: 0 0 12px rgba(52, 211, 153, 0.12); }
  .pill-soon { background: rgba(31, 31, 31, 0.5); color: #6b7280; }

  .stat-val { font-size: 24px; font-weight: 700; color: #f0f0f5; letter-spacing: -0.02em; }
  .stat-label { font-size: 11px; color: rgba(156, 163, 175, 0.8); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }

  /* Tables */
  .los-table { width: 100%; border-collapse: collapse; }
  .los-table th { text-align: left; padding: 8px 12px; font-size: 10px; color: rgba(107,114,128,0.8); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border-subtle); white-space: nowrap; }
  .los-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
  .los-table tr { transition: background var(--transition-fast); }
  .los-table tr:hover { background: rgba(255,255,255,0.02); }

  /* Progress bar */
  .progress-track { width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }

  /* Nav */
  .los-nav {
    position: sticky; top: 0; z-index: 50;
    background: rgba(10, 10, 18, 0.8);
    backdrop-filter: blur(20px) saturate(1.3);
    -webkit-backdrop-filter: blur(20px) saturate(1.3);
    border-bottom: 1px solid var(--border-subtle);
  }
  .los-nav-inner {
    max-width: 1400px; margin: 0 auto; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between; height: 56px;
  }
  .los-nav-logo { font-size: 18px; font-weight: 800; color: #f0f0f5; letter-spacing: -0.02em; text-decoration: none; display: flex; align-items: center; gap: 8px; }
  .los-nav-logo span { background: linear-gradient(135deg, var(--accent-green), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .los-nav-links { display: flex; gap: 4px; align-items: center; }
  .los-nav-link {
    padding: 6px 14px; font-size: 13px; font-weight: 500; color: #9ca3af;
    text-decoration: none; border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  .los-nav-link:hover { color: #e0e0e0; background: rgba(255,255,255,0.04); }
  .los-nav-link.active { color: #f0f0f5; background: rgba(255,255,255,0.06); }
  .los-hamburger {
    display: none; background: none; border: none; color: #9ca3af; cursor: pointer;
    width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: var(--radius-sm);
  }
  .los-hamburger:hover { background: rgba(255,255,255,0.04); color: #e0e0e0; }
  .los-mobile-menu {
    display: none; position: fixed; top: 56px; left: 0; right: 0; bottom: 0; z-index: 45;
    background: rgba(10, 10, 18, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    flex-direction: column; padding: 16px 24px; gap: 4px;
  }
  .los-mobile-menu.open { display: flex; }
  .los-mobile-menu a {
    padding: 12px 16px; font-size: 16px; font-weight: 500; color: #9ca3af;
    text-decoration: none; border-radius: var(--radius-sm); transition: all var(--transition-fast);
  }
  .los-mobile-menu a:hover, .los-mobile-menu a.active { color: #f0f0f5; background: rgba(255,255,255,0.04); }
  @media (max-width: 768px) {
    .los-nav-links { display: none; }
    .los-hamburger { display: flex; }
  }

  /* Container */
  .los-container { max-width: 1400px; margin: 0 auto; padding: 24px; }

  /* Section title */
  .section-title { font-size: 16px; font-weight: 700; color: #f0f0f5; margin-bottom: 14px; letter-spacing: -0.01em; }

  /* Sub-nav tabs */
  .sub-nav { display: flex; gap: 2px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 2px; }
  .sub-nav a {
    padding: 8px 16px; font-size: 13px; font-weight: 600; color: #6b7280;
    text-decoration: none; border-bottom: 2px solid transparent;
    transition: all var(--transition-fast); white-space: nowrap;
  }
  .sub-nav a:hover { color: #d4d4d8; }
  .sub-nav a.active { color: #f0f0f5; border-bottom-color: var(--accent-green); }

  /* Chat bubble */
  .chat-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 60;
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #014421 0%, #016b35 100%);
    color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 24px;
    box-shadow: 0 4px 16px rgba(1,68,33,0.35), 0 0 24px rgba(1,68,33,0.15), 0 1px 3px rgba(0,0,0,0.3);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }
  .chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(1,68,33,0.45), 0 0 32px rgba(1,68,33,0.2); }
  .chat-fab:active { transform: scale(0.95); }

  .chat-panel {
    position: fixed; bottom: 92px; right: 24px; z-index: 65;
    width: 380px; height: 500px; max-height: calc(100vh - 120px);
    background: var(--bg-overlay); backdrop-filter: blur(24px) saturate(1.3); -webkit-backdrop-filter: blur(24px) saturate(1.3);
    border: 1px solid var(--border-default); border-radius: var(--radius-lg);
    box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
    display: none; flex-direction: column; overflow: hidden;
  }
  .chat-panel.open { display: flex; }
  .chat-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; background: rgba(14,14,22,0.6);
    border-bottom: 1px solid var(--border-subtle); flex-shrink: 0;
  }
  .chat-panel-header-left { display: flex; align-items: center; gap: 8px; }
  .chat-panel-header-title { font-size: 15px; font-weight: 700; color: #f0f0f5; }
  .chat-panel-close { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: var(--radius-sm); transition: all var(--transition-fast); }
  .chat-panel-close:hover { color: #e0e0e0; background: rgba(255,255,255,0.06); }
  .chat-panel-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .chat-panel-input-area { display: flex; gap: 8px; padding: 12px 14px; background: rgba(14,14,22,0.6); border-top: 1px solid var(--border-subtle); flex-shrink: 0; }
  .chat-panel-input {
    flex: 1; background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-sm); padding: 8px 12px; color: #e0e0e0; font-size: 13px;
    font-family: inherit; outline: none; resize: none;
    transition: border-color var(--transition-fast);
  }
  .chat-panel-input:focus { border-color: var(--border-hover); }
  .chat-panel-send {
    background: linear-gradient(135deg, #014421 0%, #016b35 100%);
    border: none; color: #fff; border-radius: var(--radius-sm); padding: 8px 14px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all var(--transition-fast);
  }
  .chat-panel-send:hover { opacity: 0.9; }

  .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.6; word-wrap: break-word; overflow-wrap: anywhere; }
  .chat-bubble-user { background: linear-gradient(135deg, rgba(4,47,26,0.7) 0%, rgba(6,78,59,0.5) 100%); color: #d1fae5; align-self: flex-end; border-bottom-right-radius: 4px; }
  .chat-bubble-assistant { background: var(--bg-elevated); color: #d4d4d8; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid var(--border-default); }
  .chat-typing { display: flex; gap: 4px; align-items: center; padding: 10px 14px; }
  .chat-typing-dot { width: 6px; height: 6px; border-radius: 50%; background: #6b7280; animation: typingBounce 1.4s ease-in-out infinite; }
  .chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingBounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }

  @media (max-width: 640px) {
    .chat-panel { width: calc(100vw - 32px); right: 16px; bottom: 84px; height: 60vh; }
    .los-container { padding: 16px; }
  }

  /* Form elements */
  .los-input {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-sm); padding: 10px 14px; color: #e0e0e0;
    font-size: 13px; font-family: inherit; outline: none; width: 100%;
    transition: border-color var(--transition-fast);
  }
  .los-input:focus { border-color: var(--border-hover); }
  .los-select {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-sm); padding: 10px 14px; color: #e0e0e0;
    font-size: 13px; font-family: inherit; outline: none; width: 100%;
    appearance: none; cursor: pointer;
  }
  .los-btn {
    background: linear-gradient(135deg, #014421 0%, #016b35 100%);
    border: none; color: #fff; border-radius: var(--radius-sm); padding: 10px 20px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all var(--transition-fast);
  }
  .los-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .los-btn-outline {
    background: transparent; border: 1px solid var(--border-default);
    color: #9ca3af; border-radius: var(--radius-sm); padding: 10px 20px;
    cursor: pointer; font-size: 13px; font-weight: 600; transition: all var(--transition-fast);
  }
  .los-btn-outline:hover { border-color: var(--border-hover); color: #e0e0e0; background: rgba(255,255,255,0.03); }
  `;
}

function navHtml(activePage: string): string {
  const links = [
    { href: '/lifeos', label: 'Hub', key: 'hub' },
    { href: '/lifeos/selling', label: 'Selling', key: 'selling' },
    { href: '/lifeos/recruiting', label: 'Recruiting', key: 'recruiting' },
    { href: '/lifeos/brand', label: 'Brand', key: 'brand' },
    { href: '/lifeos/personal', label: 'Personal', key: 'personal' },
    { href: '/lifeos/agents', label: 'Agents', key: 'agents' },
  ];
  const linkHtml = links.map(l =>
    `<a href="${l.href}" class="los-nav-link${l.key === activePage ? ' active' : ''}">${l.label}</a>`
  ).join('\n          ');
  const mobileLinkHtml = links.map(l =>
    `<a href="${l.href}" class="${l.key === activePage ? 'active' : ''}">${l.label}</a>`
  ).join('\n      ');

  return `
  <nav class="los-nav">
    <div class="los-nav-inner">
      <a href="/lifeos" class="los-nav-logo"><span>Life OS</span></a>
      <div class="los-nav-links">
        ${linkHtml}
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
    <span>💬</span>
  </button>
  <div class="chat-panel" id="chatPanel">
    <div class="chat-panel-header">
      <div class="chat-panel-header-left">
        <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,0.4);"></div>
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
  // Restore chat state
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

    // Typing indicator
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
      errBubble.style.color = '#f87171';
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
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>${title} — Life OS</title>
<script src="https://cdn.tailwindcss.com"></script>
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
  <div style="margin-bottom:32px;">
    <h1 id="greeting" style="font-size:28px;font-weight:800;color:#f0f0f5;margin:0 0 6px;letter-spacing:-0.02em;">Good morning, Jackson.</h1>
    <p style="font-size:15px;color:rgba(156,163,175,0.8);margin:0;">Everything you need in one place.</p>
  </div>
  <script>
  (function(){
    var h = new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    document.getElementById('greeting').textContent = g + ', Jackson.';
  })();
  </script>

  <!-- Domain Cards -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;">

    <a href="/lifeos/selling" style="text-decoration:none;color:inherit;">
      <div class="card card-hover" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(52,211,153,0.12);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💰</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:#f0f0f5;">Selling</div>
          </div>
        </div>
        <p style="font-size:13px;color:rgba(156,163,175,0.8);margin:0;">Commissions, carriers, policies, projected pay</p>
      </div>
    </a>

    <a href="/lifeos/recruiting" style="text-decoration:none;color:inherit;">
      <div class="card card-hover" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(59,130,246,0.12);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">👥</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:#f0f0f5;">Recruiting</div>
          </div>
        </div>
        <p style="font-size:13px;color:rgba(156,163,175,0.8);margin:0;">Pipeline, leads, conversion tracking</p>
      </div>
    </a>

    <a href="/lifeos/brand" style="text-decoration:none;color:inherit;">
      <div class="card card-hover" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(249,115,22,0.12);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🎨</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:#f0f0f5;">Brand</div>
          </div>
        </div>
        <p style="font-size:13px;color:rgba(156,163,175,0.8);margin:0;">Content, social analytics, posting</p>
      </div>
    </a>

    <a href="/lifeos/personal" style="text-decoration:none;color:inherit;">
      <div class="card card-hover" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(167,139,250,0.12);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💳</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:#f0f0f5;">Personal</div>
          </div>
        </div>
        <p style="font-size:13px;color:rgba(156,163,175,0.8);margin:0;">Net worth, spending, budgets</p>
      </div>
    </a>

    <a href="/lifeos/agents" style="text-decoration:none;color:inherit;">
      <div class="card card-hover" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:12px;background:rgba(34,211,238,0.12);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🤖</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:#f0f0f5;">Agents</div>
          </div>
        </div>
        <p style="font-size:13px;color:rgba(156,163,175,0.8);margin:0;">Your AI team — chat, delegate, orchestrate</p>
      </div>
    </a>

  </div>

  <style>
    @media (max-width: 768px) {
      div[style*="grid-template-columns:repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; }
    }
  </style>

  <!-- Quick Stats -->
  <div class="section-title">Quick Stats</div>
  <div class="summary-bar" id="hubStats">
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
  <h1 style="font-size:24px;font-weight:800;color:#f0f0f5;margin:0 0 4px;letter-spacing:-0.02em;">Selling</h1>
  <p style="font-size:14px;color:rgba(156,163,175,0.8);margin:0 0 20px;">Commissions, carriers, policies, and projections.</p>

  <!-- Sub-nav -->
  <div class="sub-nav">
    <a href="#overview" class="active">Overview</a>
    <a href="#carriers">Carriers</a>
    <a href="#policies">Policies</a>
    <a href="#links">Links</a>
    <a href="#upload">Upload</a>
  </div>

  <!-- KPI Row -->
  <div class="summary-bar" id="overview">
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent-green);">$24,300</div>
      <div class="summary-stat-label">MTD Commissions</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:#f87171;">$2,450</div>
      <div class="summary-stat-label">MTD Chargebacks</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">73%</div>
      <div class="summary-stat-label">90d Persistency</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent);">$81,200</div>
      <div class="summary-stat-label">3mo Forecast</div>
    </div>
  </div>

  <!-- Chargeback Liability -->
  <div class="card" style="margin-bottom:20px;border-color:rgba(248,113,113,0.2);">
    <div class="summary-stat-label" style="margin-bottom:8px;">Chargeback Liability</div>
    <div style="font-size:36px;font-weight:800;color:#f87171;letter-spacing:-0.03em;">$46,780</div>
    <p style="font-size:12px;color:rgba(156,163,175,0.6);margin:6px 0 0;">Outstanding liability from policies in chargeback window</p>
  </div>

  <!-- Per Carrier Breakdown -->
  <div id="carriers" class="section-title">Per Carrier Breakdown</div>
  <div class="card" style="padding:0;overflow:hidden;">
    <table class="los-table">
      <thead>
        <tr><th>Carrier</th><th>MTD Amount</th><th>Persistency</th></tr>
      </thead>
      <tbody>
        <tr><td style="font-weight:600;color:#f0f0f5;">Mutual of Omaha</td><td style="color:var(--accent-green);">$11,820</td><td>76%</td></tr>
        <tr><td style="font-weight:600;color:#f0f0f5;">Aetna</td><td style="color:var(--accent-green);">$7,640</td><td>71%</td></tr>
        <tr><td style="font-weight:600;color:#f0f0f5;">Americo</td><td style="color:var(--accent-green);">$4,840</td><td>68%</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Carrier Links -->
  <div id="links" class="section-title" style="margin-top:24px;">Carrier Links</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
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
      <div class="card card-hover" style="padding:14px 16px;margin-bottom:0;cursor:pointer;">
        <div style="font-size:14px;font-weight:600;color:#f0f0f5;">${name}</div>
        <div style="font-size:12px;color:var(--accent);margin-top:4px;">Login &rarr;</div>
      </div>
    </a>`).join('')}
  </div>
  <style>
    @media (max-width: 640px) {
      div[style*="grid-template-columns:repeat(3,1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
    }
  </style>

  <!-- 9-Month Projection -->
  <div id="policies" class="section-title" style="margin-top:24px;">9-Month Projection</div>
  <div class="card">
    ${(() => {
      const months = [
        ['May', 27500], ['Jun', 29200], ['Jul', 31000],
        ['Aug', 28800], ['Sep', 30500], ['Oct', 33000],
        ['Nov', 35200], ['Dec', 32000], ['Jan', 34500]
      ];
      const max = 35200;
      return months.map(([m, v]) => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="width:36px;font-size:12px;color:#9ca3af;font-weight:500;text-align:right;">${m}</div>
        <div style="flex:1;">
          <div class="progress-track" style="height:20px;border-radius:6px;">
            <div class="progress-fill" style="width:${Math.round(((v as number) / max) * 100)}%;background:linear-gradient(90deg,var(--accent-green),var(--accent));border-radius:6px;display:flex;align-items:center;padding-left:8px;">
              <span style="font-size:11px;font-weight:600;color:#fff;">$${(v as number).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>`).join('');
    })()}
  </div>

  <!-- Number Upload -->
  <div id="upload" class="section-title" style="margin-top:24px;">Number Upload</div>
  <div class="card">
    <form onsubmit="event.preventDefault();alert('Numbers saved (mock).');" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div style="grid-column:span 2;">
        <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Carrier</label>
        <select class="los-select">
          <option>Mutual of Omaha</option><option>Aetna</option><option>Americo</option>
          <option>Corebridge</option><option>Ethos</option><option>Transamerica</option>
          <option>American Amicable</option><option>Chubb</option><option>National Life</option>
        </select>
      </div>
      <div>
        <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Month</label>
        <input type="month" class="los-input">
      </div>
      <div>
        <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Gross Commissions</label>
        <input type="number" class="los-input" placeholder="$0.00">
      </div>
      <div>
        <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Chargebacks</label>
        <input type="number" class="los-input" placeholder="$0.00">
      </div>
      <div>
        <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Policies Written</label>
        <input type="number" class="los-input" placeholder="0">
      </div>
      <div style="grid-column:span 2;display:flex;justify-content:flex-end;margin-top:4px;">
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
    .kanban { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; min-height: 300px; }
    .kanban-col { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .kanban-col-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .kanban-col-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; }
    .kanban-col-count { font-size: 10px; font-weight: 700; color: #6b7280; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 999px; }
    .kanban-card {
      background: var(--bg-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-default); border-radius: var(--radius-sm);
      padding: 10px 12px; transition: all var(--transition-fast);
    }
    .kanban-card:hover { border-color: var(--border-hover); transform: translateY(-1px); box-shadow: var(--shadow-card-hover); }
    .kanban-card-name { font-size: 13px; font-weight: 600; color: #f0f0f5; margin-bottom: 4px; }
    .kanban-card-phone { font-size: 11px; color: #9ca3af; margin-bottom: 6px; }
    .kanban-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .source-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    .source-ad { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .source-referral { background: rgba(52,211,153,0.15); color: #6ee7b7; }
    .source-organic { background: rgba(249,115,22,0.15); color: #fb923c; }
    .days-badge { font-size: 10px; font-weight: 500; color: #6b7280; background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 999px; }
    @media (max-width: 1024px) { .kanban { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 640px) { .kanban { grid-template-columns: repeat(2, 1fr); } }

    .lead-form-overlay {
      display: none; position: fixed; inset: 0; z-index: 80;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      align-items: center; justify-content: center;
    }
    .lead-form-overlay.open { display: flex; }
    .lead-form-card {
      background: var(--bg-overlay); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border-default); border-radius: var(--radius-lg);
      padding: 28px; width: 420px; max-width: 90vw;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }
  </style>

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1 style="font-size:24px;font-weight:800;color:#f0f0f5;margin:0 0 4px;letter-spacing:-0.02em;">Recruiting</h1>
      <p style="font-size:14px;color:rgba(156,163,175,0.8);margin:0;">Pipeline, leads, and conversion tracking.</p>
    </div>
    <button class="los-btn" onclick="document.getElementById('leadForm').classList.add('open')">+ Add Lead</button>
  </div>

  <!-- KPI Row -->
  <div class="summary-bar">
    <div class="summary-stat">
      <div class="summary-stat-val">24</div>
      <div class="summary-stat-label">Total Recruits</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent);">8</div>
      <div class="summary-stat-label">In Pipeline</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent-green);">33%</div>
      <div class="summary-stat-label">Conversion Rate</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">18</div>
      <div class="summary-stat-label">Avg Days to Dial</div>
    </div>
  </div>

  <!-- Kanban -->
  <div class="section-title">Pipeline</div>
  <div class="kanban">

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

  <!-- Add Lead Form -->
  <div id="leadForm" class="lead-form-overlay" onclick="if(event.target===this)this.classList.remove('open')">
    <div class="lead-form-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h2 style="font-size:18px;font-weight:700;color:#f0f0f5;margin:0;">Add New Lead</h2>
        <button onclick="document.getElementById('leadForm').classList.remove('open')" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:20px;">&times;</button>
      </div>
      <form onsubmit="event.preventDefault();alert('Lead added (mock).');document.getElementById('leadForm').classList.remove('open');" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Name</label>
          <input type="text" class="los-input" placeholder="Full name" required>
        </div>
        <div>
          <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Phone</label>
          <input type="tel" class="los-input" placeholder="(555) 000-0000">
        </div>
        <div>
          <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Email</label>
          <input type="email" class="los-input" placeholder="email@example.com">
        </div>
        <div>
          <label style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;font-weight:500;display:block;margin-bottom:4px;">Source</label>
          <select class="los-select">
            <option>Ad</option><option>Referral</option><option>Organic</option><option>Cold Call</option><option>Social Media</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
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
  <h1 style="font-size:24px;font-weight:800;color:#f0f0f5;margin:0 0 4px;letter-spacing:-0.02em;">Brand</h1>
  <p style="font-size:14px;color:rgba(156,163,175,0.8);margin:0 0 20px;">Content, social analytics, and posting.</p>

  <!-- KPI Row -->
  <div class="summary-bar">
    <div class="summary-stat">
      <div class="summary-stat-val">12.4K</div>
      <div class="summary-stat-label">Total Followers</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent-green);">3.2%</div>
      <div class="summary-stat-label">Engagement Rate</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">5/7</div>
      <div class="summary-stat-label">Content This Week</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent);">45.2K</div>
      <div class="summary-stat-label">Monthly Reach</div>
    </div>
  </div>

  <!-- Platform Cards -->
  <div class="section-title">Platforms</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">

    <!-- Instagram -->
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:700;">IG</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#f0f0f5;">Instagram</div>
          <div style="font-size:11px;color:#9ca3af;">8.2K followers &middot; 3.8% engagement</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 22</span><br>"5 mistakes new FE agents make" — Reel, 2.4K views
        </div>
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 20</span><br>"Monday motivation — why I chose insurance" — Story
        </div>
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 18</span><br>"Client testimonial — the Davis family" — Carousel
        </div>
      </div>
    </div>

    <!-- YouTube -->
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:36px;height:36px;border-radius:10px;background:#ff0000;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:700;">YT</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#f0f0f5;">YouTube</div>
          <div style="font-size:11px;color:#9ca3af;">2.1K subs &middot; 1.2K avg views</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 21</span><br>"How I built a $500K book in 18 months" — 3.1K views
        </div>
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 14</span><br>"Day in the life of an insurance agent" — 1.8K views
        </div>
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 7</span><br>"Mutual of Omaha vs Aetna — honest review" — 980 views
        </div>
      </div>
    </div>

    <!-- LinkedIn -->
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:36px;height:36px;border-radius:10px;background:#0a66c2;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:700;">in</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#f0f0f5;">LinkedIn</div>
          <div style="font-size:11px;color:#9ca3af;">2.1K connections &middot; 890 impressions</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 22</span><br>"The truth about final expense commissions" — 340 likes
        </div>
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 19</span><br>"Why I'm bullish on recruiting in 2026" — 210 likes
        </div>
        <div style="font-size:12px;color:#d4d4d8;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);">
          <span style="color:#9ca3af;font-size:10px;">Apr 16</span><br>"3 books that changed my sales career" — 180 likes
        </div>
      </div>
    </div>

  </div>
  <style>
    @media (max-width: 768px) {
      div[style*="grid-template-columns:repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- Daily Content Ideas -->
  <div class="section-title">Daily Content Ideas</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">

    <div class="card card-hover">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span class="pill" style="background:rgba(249,115,22,0.15);color:#fb923c;">Instagram Reel</span>
      </div>
      <div style="font-size:15px;font-weight:700;color:#f0f0f5;margin-bottom:6px;">5 Things New Agents Get Wrong</div>
      <p style="font-size:12px;color:#9ca3af;margin:0;">Quick-hit reel with text overlays covering the most common mistakes you see new FE agents make. Hook: "Stop doing this if you want to survive year one."</p>
    </div>

    <div class="card card-hover">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span class="pill" style="background:rgba(239,68,68,0.15);color:#f87171;">YouTube Video</span>
      </div>
      <div style="font-size:15px;font-weight:700;color:#f0f0f5;margin-bottom:6px;">How I Built a $500K Book in 18 Months</div>
      <p style="font-size:12px;color:#9ca3af;margin:0;">Long-form breakdown of your journey. Include monthly numbers, what worked, what didn't, and actionable takeaways for viewers.</p>
    </div>

    <div class="card card-hover">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span class="pill" style="background:rgba(59,130,246,0.15);color:#60a5fa;">LinkedIn Post</span>
      </div>
      <div style="font-size:15px;font-weight:700;color:#f0f0f5;margin-bottom:6px;">The truth about FE commissions</div>
      <p style="font-size:12px;color:#9ca3af;margin:0;">Transparent post about real numbers — what you actually take home after chargebacks, taxes, and lead costs. Build trust and authority.</p>
    </div>

  </div>

  <!-- Connect Banner -->
  <div class="card" style="text-align:center;padding:24px;border-color:var(--border-subtle);opacity:0.6;">
    <div style="font-size:14px;font-weight:600;color:#9ca3af;margin-bottom:4px;">Connect Social Accounts</div>
    <p style="font-size:12px;color:#6b7280;margin:0;">Link your Instagram, YouTube, and LinkedIn for real-time analytics.</p>
  </div>`;

  return wrapPage('Brand', 'brand', body);
}

// ─── Page 5: Personal ───────────────────────────────────────────────────────────

export function getLifeOSPersonalHtml(): string {
  const body = `
  <h1 style="font-size:24px;font-weight:800;color:#f0f0f5;margin:0 0 4px;letter-spacing:-0.02em;">Personal</h1>
  <p style="font-size:14px;color:rgba(156,163,175,0.8);margin:0 0 20px;">Net worth, spending, and budgets.</p>

  <!-- KPI Row -->
  <div class="summary-bar">
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent-green);">$284,500</div>
      <div class="summary-stat-label">Net Worth</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val">$6,240</div>
      <div class="summary-stat-label">Monthly Spending</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent-green);">$18,500</div>
      <div class="summary-stat-label">Monthly Income</div>
    </div>
    <div class="summary-stat">
      <div class="summary-stat-val" style="color:var(--accent);">34%</div>
      <div class="summary-stat-label">Savings Rate</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">

    <!-- Spending by Category -->
    <div class="card">
      <div class="section-title" style="margin-bottom:16px;">Spending by Category</div>
      ${[
        ['Housing', 2100, 34, 'var(--accent)'],
        ['Food', 980, 16, 'var(--accent-green)'],
        ['Insurance', 450, 7, 'var(--accent-purple)'],
        ['Transportation', 380, 6, 'var(--accent-orange)'],
        ['Entertainment', 220, 4, 'var(--accent-cyan)'],
        ['Subscriptions', 180, 3, '#f472b6'],
        ['Other', 1930, 31, '#6b7280'],
      ].map(([cat, amt, pct, color]) => `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:13px;color:#d4d4d8;">${cat}</span>
          <span style="font-size:13px;color:#f0f0f5;font-weight:600;">$${(amt as number).toLocaleString()} <span style="color:#6b7280;font-weight:400;font-size:11px;">(${pct}%)</span></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>`).join('')}
    </div>

    <!-- Budget vs Actual -->
    <div class="card">
      <div class="section-title" style="margin-bottom:16px;">Budget vs Actual</div>
      ${[
        ['Food', 980, 800, true],
        ['Housing', 2100, 2200, false],
        ['Entertainment', 220, 300, false],
        ['Transport', 380, 400, false],
      ].map(([cat, actual, budget, over]) => {
        const pct = Math.min(Math.round(((actual as number) / (budget as number)) * 100), 100);
        const color = over ? '#f87171' : 'var(--accent-green)';
        return `
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:13px;color:#d4d4d8;">${cat}</span>
          <span style="font-size:13px;font-weight:600;color:${color};">$${(actual as number).toLocaleString()} / $${(budget as number).toLocaleString()}</span>
        </div>
        <div class="progress-track" style="height:10px;">
          <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <div style="font-size:10px;color:${over ? '#f87171' : '#6b7280'};margin-top:2px;">${over ? 'Over budget' : 'Under budget'}</div>
      </div>`;
      }).join('')}
    </div>

  </div>
  <style>
    @media (max-width: 768px) {
      div[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- Recent Transactions -->
  <div class="section-title">Recent Transactions</div>
  <div class="card" style="padding:0;overflow:hidden;overflow-x:auto;">
    <table class="los-table">
      <thead>
        <tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right;">Amount</th></tr>
      </thead>
      <tbody>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 23</td><td style="color:#f0f0f5;">Whole Foods Market</td><td>Food</td><td style="text-align:right;color:#f87171;">-$127.43</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 22</td><td style="color:#f0f0f5;">Shell Gas Station</td><td>Transportation</td><td style="text-align:right;color:#f87171;">-$58.20</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 22</td><td style="color:#f0f0f5;">Netflix</td><td>Subscriptions</td><td style="text-align:right;color:#f87171;">-$15.99</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 21</td><td style="color:#f0f0f5;">Mutual of Omaha — Commission</td><td>Income</td><td style="text-align:right;color:var(--accent-green);">+$3,240.00</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 21</td><td style="color:#f0f0f5;">Amazon</td><td>Other</td><td style="text-align:right;color:#f87171;">-$89.99</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 20</td><td style="color:#f0f0f5;">Chipotle</td><td>Food</td><td style="text-align:right;color:#f87171;">-$14.52</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 19</td><td style="color:#f0f0f5;">AT&T Wireless</td><td>Subscriptions</td><td style="text-align:right;color:#f87171;">-$85.00</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 18</td><td style="color:#f0f0f5;">State Farm — Auto Insurance</td><td>Insurance</td><td style="text-align:right;color:#f87171;">-$142.00</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 17</td><td style="color:#f0f0f5;">Aetna — Commission</td><td>Income</td><td style="text-align:right;color:var(--accent-green);">+$1,890.00</td></tr>
        <tr><td style="color:#9ca3af;white-space:nowrap;">Apr 16</td><td style="color:#f0f0f5;">Topgolf</td><td>Entertainment</td><td style="text-align:right;color:#f87171;">-$72.00</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Connect Banner -->
  <div class="card" style="text-align:center;padding:24px;border-color:var(--border-subtle);opacity:0.6;margin-top:20px;">
    <div style="font-size:14px;font-weight:600;color:#9ca3af;margin-bottom:4px;">Connect to Monarch Money</div>
    <p style="font-size:12px;color:#6b7280;margin:0;">Link your Monarch Money account for real-time transaction and budget data.</p>
  </div>`;

  return wrapPage('Personal', 'personal', body);
}

// ─── Page 6: Agents ─────────────────────────────────────────────────────────────

export function getLifeOSAgentsHtml(): string {
  const body = `
  <h1 style="font-size:24px;font-weight:800;color:#f0f0f5;margin:0 0 4px;letter-spacing:-0.02em;">Agents</h1>
  <p style="font-size:14px;color:rgba(156,163,175,0.8);margin:0 0 20px;">Your AI team — chat, delegate, orchestrate.</p>

  <!-- Agent Cards -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:32px;">

    <div class="card card-hover">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(52,211,153,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">🤖</div>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:#f0f0f5;">Gurt <span style="font-size:11px;color:#6b7280;font-weight:500;">(CEO)</span></div>
          <span class="pill pill-active" style="margin-top:2px;">Active</span>
        </div>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0 0 12px;">Your primary AI assistant</p>
      <button class="los-btn" style="width:100%;font-size:12px;padding:8px;" onclick="document.getElementById('agentChatArea').scrollIntoView({behavior:'smooth'})">Chat</button>
    </div>

    ${[
      ['🔬', 'Researcher', 'Deep research on any topic'],
      ['📈', 'Sales', 'Write copy, emails, text messages'],
      ['🎨', 'Content', 'Content ideas, posts, brand voice'],
      ['💰', 'Finance', 'Financial analysis, projections'],
      ['💡', 'Ideation', 'Identifies blind spots across all data'],
    ].map(([icon, name, desc]) => `
    <div class="card" style="opacity:0.6;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:20px;">${icon}</div>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:#f0f0f5;">${name}</div>
          <span class="pill pill-soon" style="margin-top:2px;">Coming Soon</span>
        </div>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:0;">${desc}</p>
    </div>`).join('')}

  </div>
  <style>
    @media (max-width: 768px) {
      div[style*="grid-template-columns:repeat(3,1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 480px) {
      div[style*="grid-template-columns:repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- Chat Interface -->
  <div id="agentChatArea" class="section-title">Chat with Gurt</div>
  <div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column;height:500px;">
    <!-- Chat Header -->
    <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;background:rgba(14,14,22,0.6);border-bottom:1px solid var(--border-subtle);flex-shrink:0;">
      <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,0.4);"></div>
      <div style="font-size:15px;font-weight:700;color:#f0f0f5;">Gurt</div>
      <span style="font-size:11px;color:#6b7280;">Online</span>
    </div>

    <!-- Messages -->
    <div id="agentMessages" style="flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:8px;">
      <div class="chat-bubble chat-bubble-assistant">
        Hey Jackson! I'm Gurt, your primary AI assistant. What can I help you with today? I can help with sales strategy, recruiting pipelines, content ideas, or anything else on your mind.
      </div>
    </div>

    <!-- Typing indicator (hidden by default) -->
    <div id="agentTyping" style="display:none;padding:0 18px 8px;">
      <div class="chat-bubble chat-bubble-assistant chat-typing" style="display:inline-flex;">
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
      </div>
    </div>

    <!-- Input -->
    <div style="display:flex;gap:8px;padding:14px 18px;background:rgba(14,14,22,0.6);border-top:1px solid var(--border-subtle);flex-shrink:0;">
      <input type="text" id="agentInput" class="los-input" style="flex:1;" placeholder="Message Gurt..." onkeydown="if(event.key==='Enter')sendAgentMessage()">
      <button class="los-btn" onclick="sendAgentMessage()" style="padding:10px 18px;">Send</button>
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

    // Add user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble chat-bubble-user';
    userBubble.textContent = msg;
    messages.appendChild(userBubble);
    messages.scrollTop = messages.scrollHeight;

    // Show typing
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
      errBubble.style.color = '#f87171';
      messages.appendChild(errBubble);
    }
    messages.scrollTop = messages.scrollHeight;
  }
  </script>`;

  return wrapPage('Agents', 'agents', body);
}
