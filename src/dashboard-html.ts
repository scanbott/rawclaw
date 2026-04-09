export function getDashboardHtml(token: string, chatId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>RawClaw Mission Control — by Raw Growth</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  /* -- Design tokens -- */
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

  /* -- Global & Typography -- */
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
  }

  /* -- Custom scrollbar -- */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
  * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }

  /* -- Card / glass surface -- */
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
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  /* -- Pills / status badges -- */
  .pill { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .pill-active { background: rgba(6, 78, 59, 0.6); color: #6ee7b7; box-shadow: 0 0 12px rgba(52, 211, 153, 0.12); }
  .pill-running { background: rgba(10, 54, 34, 0.7); color: #34d399; animation: statusPulse 2.5s ease-in-out infinite; box-shadow: 0 0 16px rgba(52, 211, 153, 0.15); }
  .pill-paused { background: rgba(66, 32, 6, 0.6); color: #fbbf24; box-shadow: 0 0 12px rgba(251, 191, 36, 0.1); }
  .last-success { color: #6ee7b7; }
  .last-failed { color: #f87171; }
  .last-timeout { color: #fbbf24; }
  @keyframes statusPulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 16px rgba(52, 211, 153, 0.15); }
    50% { opacity: 0.7; box-shadow: 0 0 24px rgba(52, 211, 153, 0.25); }
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  .pill-connected { background: rgba(6, 78, 59, 0.5); color: #6ee7b7; box-shadow: 0 0 12px rgba(52, 211, 153, 0.1); }
  .pill-disconnected { background: rgba(59, 15, 15, 0.5); color: #f87171; box-shadow: 0 0 12px rgba(248, 113, 113, 0.1); }
  .pill-unconfigured { background: rgba(31, 31, 31, 0.5); color: #6b7280; }

  /* -- Stats -- */
  .stat-val { font-size: 24px; font-weight: 700; color: #f0f0f5; letter-spacing: -0.02em; }
  .stat-label { font-size: 11px; color: rgba(156, 163, 175, 0.8); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }

  /* -- Model picker -- */
  .model-picker { position: relative; cursor: pointer; margin-top: 2px; }
  .model-current { font-size: 11px; color: var(--accent-green); transition: color var(--transition-fast); }
  .model-current:hover { color: #a78bfa; }
  .model-menu { position: absolute; top: 22px; left: 0; z-index: 30; background: var(--bg-elevated); backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4); border: 1px solid var(--border-default); border-radius: var(--radius-sm); padding: 4px 0; min-width: 120px; box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04); }
  .model-opt { padding: 7px 14px; font-size: 12px; color: #9ca3af; cursor: pointer; transition: background var(--transition-fast), color var(--transition-fast); border-radius: 4px; margin: 1px 4px; }
  .model-opt:hover { background: rgba(255,255,255,0.06); color: #e0e0e0; }
  .model-active { color: var(--accent-green); }
  .model-active::before { content: ''; display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: var(--accent-green); margin-right: 6px; vertical-align: middle; box-shadow: 0 0 6px var(--accent-green-glow); }
  details summary { cursor: pointer; list-style: none; }
  details summary::-webkit-details-marker { display: none; }
  .fade-text { color: #f87171; }
  .top-text { color: #6ee7b7; }
  .gauge-bg { fill: rgba(255,255,255,0.06); }
  .refresh-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* -- Privacy blur -- */
  .privacy-blur { filter: blur(5px); cursor: pointer; transition: filter 0.2s; user-select: none; }
  .privacy-blur:hover { filter: blur(3px); }
  .privacy-toggle { background: none; border: none; cursor: pointer; color: rgba(136,136,136,0.7); font-size: 16px; padding: 2px 6px; margin-left: 8px; transition: color var(--transition-fast); vertical-align: middle; }
  .privacy-toggle:hover { color: #ccc; }

  /* -- Hive Mind table -- */
  .hive-table { width: 100%; border-collapse: collapse; }
  .hive-table th { text-align: left; padding: 6px 10px; font-size: 10px; color: rgba(107,114,128,0.8); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border-subtle); white-space: nowrap; }
  .hive-table td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid var(--border-subtle); vertical-align: top; }
  .hive-table .col-time { white-space: nowrap; color: #9ca3af; }
  .hive-table .col-agent { white-space: nowrap; font-weight: 600; }
  .hive-table .col-action { white-space: nowrap; color: #9ca3af; }
  .hive-table .col-summary { color: #d4d4d8; word-break: break-word; line-height: 1.5; }
  .hive-table tr { transition: background var(--transition-fast); }
  .hive-table tr:hover { background: rgba(255,255,255,0.02); }
  .hive-scroll { max-height: 300px; overflow-y: auto; }

  /* -- Summary stats bar -- */
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

  /* -- Memory expand -- */
  .mem-expand { cursor: pointer; transition: background var(--transition-fast); padding: 6px 8px; margin: 0 -8px; border-radius: var(--radius-sm); }
  .mem-expand:hover { background: rgba(255,255,255,0.03); }
  .mem-expand .mem-full { display: none; margin-top: 6px; color: #d4d4d8; white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.6; }
  .mem-expand.open .mem-full { display: block; }
  .mem-expand.open .mem-preview { display: none; }

  /* -- Task prompt & device badge -- */
  .task-prompt { transition: filter 0.2s; cursor: pointer; }
  .device-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .device-mobile { background: rgba(10,54,34,0.5); color: #34d399; }
  .device-desktop { background: rgba(4,47,26,0.5); color: #6ee7b7; }

  /* -- Drawer -- */
  .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 40; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
  .drawer-overlay.open { opacity: 1; pointer-events: auto; }
  .drawer { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: var(--bg-overlay); backdrop-filter: blur(24px) saturate(1.4); -webkit-backdrop-filter: blur(24px) saturate(1.4); border-top: 1px solid var(--border-default); border-radius: var(--radius-lg) var(--radius-lg) 0 0; max-height: 85vh; transform: translateY(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); display: flex; flex-direction: column; box-shadow: 0 -8px 40px rgba(0,0,0,0.4); }
  .drawer.open { transform: translateY(0); }
  .drawer-handle { width: 36px; height: 4px; background: rgba(255,255,255,0.12); border-radius: 2px; margin: 10px auto 0; flex-shrink: 0; }
  .drawer-body { overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px; flex: 1; }
  .mem-item {
    background: var(--bg-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-default); border-radius: var(--radius-md);
    padding: 14px; margin-bottom: 10px; cursor: pointer;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
    box-shadow: var(--shadow-card);
  }
  .mem-item:hover { border-color: var(--border-hover); transform: translateY(-1px); box-shadow: var(--shadow-card-hover); }
  .mem-item:active, .mem-item.expanded { border-color: rgba(255,255,255,0.14); }
  .mem-item .mem-content { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .mem-item.expanded .mem-content { display: block; -webkit-line-clamp: unset; }
  .salience-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }
  .clickable-card { cursor: pointer; transition: transform var(--transition-med), box-shadow var(--transition-med), border-color var(--transition-fast); }
  .clickable-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: var(--shadow-card-hover); }
  .clickable-card:active { transform: translateY(0); }

  /* -- Info tooltips -- */
  .info-tip { position: relative; display: inline-block; vertical-align: middle; margin-left: 6px; }
  .info-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: rgba(255,255,255,0.06); color: rgba(136,136,136,0.7); font-size: 11px; cursor: pointer; user-select: none; line-height: 1; transition: background var(--transition-fast), color var(--transition-fast); }
  .info-icon:hover { background: rgba(255,255,255,0.1); color: #bbb; }
  .info-tooltip { position: absolute; left: 50%; transform: translateX(-50%); top: calc(100% + 8px); background: var(--bg-elevated); backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4); border: 1px solid var(--border-default); color: #bbb; font-size: 12px; font-weight: 400; line-height: 1.5; padding: 12px 14px; border-radius: var(--radius-sm); max-width: 280px; min-width: 200px; z-index: 30; opacity: 0; pointer-events: none; transition: opacity var(--transition-fast); white-space: normal; text-transform: none; letter-spacing: normal; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .info-tooltip::before { content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid rgba(255,255,255,0.08); }
  .info-tooltip::after { content: ''; position: absolute; top: -5px; left: 50%; transform: translateX(-50%); border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 5px solid rgba(24,24,38,0.9); }
  .info-tip.active .info-tooltip { opacity: 1; pointer-events: auto; }

  /* -- Chat FAB -- */
  .chat-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 60;
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #014421 0%, #016b35 100%);
    color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(1,68,33,0.35), 0 0 24px rgba(1,68,33,0.15), 0 1px 3px rgba(0,0,0,0.3);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }
  .chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(1,68,33,0.45), 0 0 32px rgba(1,68,33,0.2), 0 2px 4px rgba(0,0,0,0.3); }
  .chat-fab:active { transform: scale(0.95); }
  .chat-fab-badge { position: absolute; top: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; display: none; align-items: center; justify-content: center; border: 2px solid var(--bg-base); box-shadow: 0 0 8px rgba(239,68,68,0.3); }

  /* -- Chat slide-over -- */
  .chat-overlay {
    position: fixed; top: 0; right: 0; bottom: 0; width: 560px; max-width: 100vw; z-index: 70;
    background: var(--bg-overlay); backdrop-filter: blur(24px) saturate(1.3); -webkit-backdrop-filter: blur(24px) saturate(1.3);
    display: flex; flex-direction: column; transform: translateX(100%);
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
    box-shadow: -8px 0 40px rgba(0,0,0,0.5); border-left: 1px solid var(--border-default);
  }
  .chat-overlay.open { transform: translateX(0); }
  .chat-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: rgba(14,14,22,0.6); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
  .chat-header-left { display: flex; align-items: center; gap: 10px; }
  .chat-header-title { font-size: 16px; font-weight: 700; color: #f0f0f5; letter-spacing: -0.01em; }
  .chat-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px currentColor; }

  /* -- Agent tabs -- */
  .chat-agent-tabs { display: flex; gap: 0; background: rgba(14,14,22,0.5); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; overflow-x: auto; padding: 0 14px; }
  .chat-agent-tab { padding: 10px 16px; font-size: 12px; font-weight: 600; color: #6b7280; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all var(--transition-fast); white-space: nowrap; display: flex; align-items: center; gap: 6px; }
  .chat-agent-tab:hover { color: #d4d4d8; }
  .chat-agent-tab.active { color: #6ee7b7; border-bottom-color: var(--accent-green); }
  .chat-agent-tab .agent-dot { width: 6px; height: 6px; border-radius: 50%; }
  .chat-agent-tab .agent-dot.live { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
  .chat-agent-tab .agent-dot.dead { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.3); }

  /* -- Session info bar -- */
  .chat-session-bar { display: flex; align-items: center; gap: 12px; padding: 7px 18px; background: rgba(14,14,22,0.4); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; font-size: 11px; color: #6b7280; }
  .chat-session-bar .session-stat { display: flex; align-items: center; gap: 4px; }
  .chat-session-bar .session-stat-val { color: #6ee7b7; font-weight: 600; }
  .chat-session-bar .session-model { background: rgba(255,255,255,0.04); padding: 3px 10px; border-radius: 6px; color: #9ca3af; font-weight: 600; border: 1px solid var(--border-subtle); }

  /* -- Quick actions -- */
  .chat-quick-actions { display: flex; gap: 6px; padding: 8px 18px; background: rgba(14,14,22,0.4); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; overflow-x: auto; }
  .chat-quick-btn {
    padding: 5px 12px; font-size: 11px; font-weight: 600; color: #9ca3af;
    background: var(--bg-surface); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--border-default); border-radius: var(--radius-sm);
    cursor: pointer; transition: all var(--transition-fast); white-space: nowrap;
  }
  .chat-quick-btn:hover { background: rgba(255,255,255,0.06); color: #e0e0e0; border-color: var(--border-hover); box-shadow: 0 0 12px rgba(255,255,255,0.03); }
  .chat-quick-btn.destructive:hover { border-color: rgba(220,38,38,0.4); color: #fca5a5; box-shadow: 0 0 12px rgba(220,38,38,0.1); }

  /* -- Chat messages -- */
  .chat-messages { flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; padding: 18px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .chat-bubble { max-width: 90%; padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.65; word-wrap: break-word; overflow-wrap: anywhere; word-break: break-word; }
  .chat-bubble-user { background: linear-gradient(135deg, rgba(4,47,26,0.7) 0%, rgba(6,78,59,0.5) 100%); color: #d1fae5; align-self: flex-end; border-bottom-right-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
  .chat-bubble-assistant { background: var(--bg-elevated); color: #d4d4d8; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid var(--border-default); min-width: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  .chat-bubble-source { font-size: 10px; color: rgba(107,114,128,0.7); margin-top: 4px; }
  .chat-bubble code { background: rgba(255,255,255,0.08); padding: 2px 5px; border-radius: 4px; font-size: 13px; }
  .chat-bubble pre { background: rgba(0,0,0,0.3); padding: 10px 12px; border-radius: var(--radius-sm); overflow-x: auto; margin: 8px 0; font-size: 12px; border: 1px solid var(--border-subtle); }
  .chat-bubble pre code { background: none; padding: 0; }
  .chat-bubble table { border-collapse: collapse; width: 100%; font-size: 11px; margin: 8px 0; display: block; overflow-x: auto; }
  .chat-bubble th, .chat-bubble td { padding: 4px 8px; border-bottom: 1px solid var(--border-subtle); text-align: left; white-space: nowrap; }
  .chat-bubble th { color: #6ee7b7; font-weight: 600; }

  /* -- Chat progress bar -- */
  .chat-progress-bar { display: none; align-items: center; gap: 10px; padding: 12px 18px; background: rgba(14,14,22,0.6); border-top: 1px solid var(--border-subtle); flex-shrink: 0; position: relative; overflow: hidden; }
  .chat-progress-bar.active { display: flex; }
  .chat-progress-pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--accent-green); flex-shrink: 0; animation: progressPulse 1.5s ease-in-out infinite; box-shadow: 0 0 10px var(--accent-green-glow); }
  @keyframes progressPulse { 0%,100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
  .chat-progress-label { font-size: 13px; color: #9ca3af; }
  .chat-stop-btn {
    margin-left: auto; background: transparent;
    border: 1px solid rgba(52,211,153,0.3); color: var(--accent-green);
    border-radius: var(--radius-sm); width: 28px; height: 28px;
    cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .chat-stop-btn:hover { background: rgba(52,211,153,0.1); border-color: var(--accent-green); box-shadow: 0 0 12px var(--accent-green-glow); color: #fff; }
  .chat-progress-shimmer { position: absolute; bottom: 0; left: 0; height: 2px; width: 100%; background: linear-gradient(90deg, transparent, var(--accent-green), transparent); animation: shimmer 2s ease-in-out infinite; }
  @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

  /* -- Chat input -- */
  .chat-input-area { display: flex; gap: 8px; padding: 14px 18px; background: rgba(14,14,22,0.6); border-top: 1px solid var(--border-subtle); flex-shrink: 0; }
  .chat-textarea {
    flex: 1; background: var(--bg-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-default); border-radius: 14px;
    color: #e0e0e0; padding: 10px 16px; font-size: 14px;
    resize: none; outline: none; max-height: 120px; font-family: inherit;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }
  .chat-textarea:focus { border-color: rgba(52,211,153,0.3); box-shadow: 0 0 16px rgba(52,211,153,0.08); }
  .chat-send-btn {
    background: linear-gradient(135deg, #014421 0%, #016b35 100%);
    color: #fff; border: none; border-radius: 14px; padding: 0 18px;
    cursor: pointer; font-size: 14px; font-weight: 600;
    transition: all var(--transition-fast); flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(1,68,33,0.25);
  }
  .chat-send-btn:hover { box-shadow: 0 4px 16px rgba(1,68,33,0.35), 0 0 20px rgba(1,68,33,0.15); }
  .chat-send-btn:disabled { background: rgba(255,255,255,0.04); color: #555; cursor: not-allowed; box-shadow: none; }

  /* -- Database Explorer -- */
  .db-nav-tabs {
    display: flex; gap: 0;
    background: var(--bg-surface); backdrop-filter: blur(var(--glass-blur)); -webkit-backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--border-default); border-bottom: 1px solid var(--border-default);
    margin-bottom: 18px; overflow-x: auto; border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
  }
  .db-nav-tab { padding: 12px 22px; font-size: 13px; font-weight: 600; color: #6b7280; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all var(--transition-fast); white-space: nowrap; }
  .db-nav-tab:hover { color: #d4d4d8; }
  .db-nav-tab.active { color: #6ee7b7; border-bottom-color: var(--accent-green); }
  .db-layout { display: grid; grid-template-columns: 220px 1fr; gap: 18px; min-height: 500px; }
  @media (max-width: 768px) { .db-layout { grid-template-columns: 1fr; } }
  .db-sidebar {
    background: var(--bg-surface); backdrop-filter: blur(var(--glass-blur)) saturate(1.3); -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
    border: 1px solid var(--border-default); border-radius: var(--radius-md);
    padding: 8px 0; max-height: 600px; overflow-y: auto; box-shadow: var(--shadow-card);
  }
  .db-sidebar-item { display: flex; justify-content: space-between; align-items: center; padding: 9px 16px; cursor: pointer; transition: background var(--transition-fast); font-size: 13px; color: #d4d4d8; }
  .db-sidebar-item:hover { background: rgba(255,255,255,0.04); }
  .db-sidebar-item.active { background: rgba(6,78,59,0.3); color: #6ee7b7; }
  .db-sidebar-count { font-size: 11px; color: #6b7280; background: rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 6px; }
  .db-sidebar-item.active .db-sidebar-count { color: #6ee7b7; background: rgba(6,95,70,0.4); }
  .db-grid-wrapper {
    background: var(--bg-surface); backdrop-filter: blur(var(--glass-blur)) saturate(1.3); -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.3);
    border: 1px solid var(--border-default); border-radius: var(--radius-md);
    overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--shadow-card);
  }
  .db-grid-scroll { overflow: auto; flex: 1; max-height: 500px; }
  .db-grid { width: 100%; border-collapse: collapse; font-size: 12px; }
  .db-grid th { position: sticky; top: 0; background: rgba(18,18,28,0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); text-align: left; padding: 10px 14px; font-size: 10px; color: rgba(107,114,128,0.8); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border-default); cursor: pointer; user-select: none; white-space: nowrap; }
  .db-grid th:hover { color: #d4d4d8; }
  .db-grid th .sort-arrow { font-size: 9px; margin-left: 4px; opacity: 0.3; }
  .db-grid th.sorted .sort-arrow { opacity: 1; color: #6ee7b7; }
  .db-grid td { padding: 8px 14px; border-bottom: 1px solid var(--border-subtle); color: #d4d4d8; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: top; }
  .db-grid tr { transition: background var(--transition-fast); }
  .db-grid tr:hover td { background: rgba(255,255,255,0.02); }
  .db-grid td.null-val { color: #555; font-style: italic; }
  .db-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: #6b7280; }
  .db-page-btn {
    background: var(--bg-surface); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    color: #d4d4d8; border: 1px solid var(--border-default);
    border-radius: var(--radius-sm); padding: 5px 14px; cursor: pointer; font-size: 12px;
    transition: all var(--transition-fast);
  }
  .db-page-btn:hover { background: rgba(255,255,255,0.06); border-color: var(--border-hover); }
  .db-page-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .db-query-area { margin-top: 18px; }
  .db-query-textarea {
    width: 100%; background: var(--bg-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-default); border-radius: var(--radius-sm);
    color: #e0e0e0; padding: 12px 16px; font-size: 13px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'JetBrains Mono', monospace;
    resize: vertical; outline: none; box-sizing: border-box;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }
  .db-query-textarea:focus { border-color: rgba(52,211,153,0.3); box-shadow: 0 0 16px rgba(52,211,153,0.08); }
  .db-query-bar { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
  .db-run-btn {
    background: linear-gradient(135deg, #014421 0%, #016b35 100%);
    color: #fff; border: none; border-radius: var(--radius-sm);
    padding: 9px 22px; font-size: 13px; font-weight: 600; cursor: pointer;
    transition: all var(--transition-fast); box-shadow: 0 2px 8px rgba(1,68,33,0.25);
  }
  .db-run-btn:hover { box-shadow: 0 4px 16px rgba(1,68,33,0.35), 0 0 16px rgba(1,68,33,0.12); }
  .db-query-error { color: #f87171; font-size: 12px; margin-top: 8px; }
  .db-query-info { color: #6b7280; font-size: 12px; }

  /* Supabase grid enhancements */
  #sb-grid tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
  #sb-grid td.sb-clickable { cursor: pointer; transition: background var(--transition-fast); }
  #sb-grid td.sb-clickable:hover { background: rgba(59,130,246,0.08); }
  .sb-row-count { display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; background: rgba(255,255,255,0.06); color: #6b7280; }
  .sb-add-row-btn {
    background: linear-gradient(135deg, #014421 0%, #016b35 100%);
    color: #fff; border: none; border-radius: var(--radius-sm);
    padding: 9px 22px; font-size: 13px; font-weight: 600; cursor: pointer;
    transition: all var(--transition-fast); box-shadow: 0 2px 8px rgba(1,68,33,0.25);
  }
  .sb-add-row-btn:hover { box-shadow: 0 4px 16px rgba(1,68,33,0.35), 0 0 16px rgba(1,68,33,0.12); }
  .sb-add-row-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .sb-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .sb-form-field label { display: block; font-size: 11px; color: #6b7280; margin-bottom: 3px; font-weight: 500; }
  .sb-form-field input, .sb-form-field textarea {
    width: 100%; background: var(--bg-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-default); border-radius: var(--radius-sm);
    color: #e0e0e0; padding: 8px 12px; font-size: 12px; outline: none; box-sizing: border-box;
    transition: border-color var(--transition-fast);
  }
  .sb-form-field input:focus, .sb-form-field textarea:focus { border-color: rgba(52,211,153,0.3); }
  .sb-insert-area { margin-top: 18px; }
  .sb-insert-status { font-size: 12px; margin-top: 8px; }
</style>
</head>
<body class="p-4 select-none">

<!-- Login overlay -->
<div id="login-overlay" style="display:none; position:fixed; inset:0; z-index:9999; background:var(--bg-base); align-items:center; justify-content:center; flex-direction:column;">
  <div style="background:var(--bg-surface); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:40px; max-width:380px; width:90%; backdrop-filter:blur(var(--glass-blur)); box-shadow:var(--shadow-card);">
    <div style="text-align:center; margin-bottom:24px;">
      <div style="font-size:28px; font-weight:700; color:#fff; letter-spacing:-0.03em;">RawClaw</div>
      <div style="font-size:13px; color:#888; margin-top:4px;">Enter your dashboard password</div>
    </div>
    <input id="login-password" type="password" placeholder="Password" autofocus
      style="width:100%; padding:12px 16px; background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:#fff; font-size:15px; outline:none; margin-bottom:12px;"
      onkeydown="if(event.key==='Enter')loginSubmit()">
    <button onclick="loginSubmit()"
      style="width:100%; padding:12px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-sm); font-size:15px; font-weight:600; cursor:pointer; transition:var(--transition-fast);"
      onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
      Sign In
    </button>
    <div id="login-error" style="color:#f87171; font-size:13px; text-align:center; margin-top:12px; display:none;">Invalid password</div>
  </div>
</div>

<!-- Outer wrapper: single column on mobile, wide 2-col on desktop -->
<div class="max-w-lg lg:max-w-6xl mx-auto">

<!-- Top bar -->
<div class="flex items-center justify-between mb-1">
  <div class="flex items-center gap-3">
    <h1 class="text-xl font-bold text-white">RawClaw <span style="font-size:13px;font-weight:400;color:#6b7280">Mission Control</span> <span style="font-size:11px;font-weight:400;color:#028a45;margin-left:8px">by Raw Growth</span></h1>
    <span id="device-badge" class="device-badge"></span>
  </div>
  <div class="flex items-center gap-3">
    <span id="last-updated" class="text-xs text-gray-500"></span>
    <button id="refresh-btn" onclick="refreshAll()" class="text-gray-400 hover:text-white transition">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
    </button>
  </div>
</div>
<div id="bot-info" class="flex items-center gap-3 mb-4 text-xs text-gray-500" style="display:none"></div>

<!-- Main Navigation Tabs -->
<div class="db-nav-tabs" style="border-radius:10px;margin-bottom:16px">
  <button class="db-nav-tab active" onclick="switchMainTab('dashboard',this)">Dashboard</button>
  <button class="db-nav-tab" onclick="switchMainTab('database',this)">Local DB</button>
  <button class="db-nav-tab" onclick="switchMainTab('supabase',this)">Supabase</button>
</div>

<!-- Dashboard View -->
<div id="main-tab-dashboard">

<!-- Summary Stats Bar -->
<div id="summary-bar" class="summary-bar" style="display:none">
  <div class="summary-stat clickable-card" onclick="document.getElementById('hive-section').scrollIntoView({behavior:'smooth'})" style="cursor:pointer">
    <span class="summary-stat-val" id="sum-messages">-</span>
    <span class="summary-stat-label">Messages</span>
  </div>
  <div class="summary-stat clickable-card" onclick="document.getElementById('agents-section').scrollIntoView({behavior:'smooth'})" style="cursor:pointer">
    <span class="summary-stat-val" id="sum-agents">-</span>
    <span class="summary-stat-label">Agents</span>
  </div>
  <div class="summary-stat clickable-card" onclick="document.getElementById('tokens-section').scrollIntoView({behavior:'smooth'})" style="cursor:pointer">
    <span class="summary-stat-val" id="sum-cost">-</span>
    <span class="summary-stat-label">Tokens Today</span>
  </div>
  <div class="summary-stat clickable-card" onclick="openMemoryDrawer()" style="cursor:pointer">
    <span class="summary-stat-val" id="sum-memories">-</span>
    <span class="summary-stat-label">Memories</span>
  </div>
</div>

<!-- Agent Status Cards -->
<div id="agents-section" class="mb-5" style="display:none">
  <div class="flex items-center justify-between mb-2">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Agents</h2>
    <div class="flex items-center gap-2">
      <button onclick="openCreateAgentWizard()" style="background:#014421;color:#fff;border:none;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer">+ New Agent</button>
      <div class="model-picker" onclick="toggleModelPicker(this)" style="display:inline-block">
        <span class="model-current" style="color:#6b7280">Set all <span style="font-size:8px;opacity:0.5">&#9662;</span></span>
        <div class="model-menu" style="display:none;right:0;left:auto">
          <div class="model-opt" data-model="claude-opus-4-6" onclick="pickGlobalModel(this)">All Opus</div>
          <div class="model-opt" data-model="claude-sonnet-4-6" onclick="pickGlobalModel(this)">All Sonnet</div>
          <div class="model-opt" data-model="claude-haiku-4-5" onclick="pickGlobalModel(this)">All Haiku</div>
        </div>
      </div>
    </div>
  </div>
  <div id="agents-container" class="flex flex-wrap gap-3"></div>
</div>

<!-- Hive Mind Feed -->
<div id="hive-section" class="mb-5" style="display:none">
  <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Hive Mind<button class="privacy-toggle" onclick="toggleSectionBlur('hive')" title="Toggle blur">&#128065;</button></h2>
  <div id="hive-container" class="card hive-scroll">
    <div class="text-gray-500 text-sm">Loading...</div>
  </div>
</div>

<!-- Tasks Inbox -->
<div id="tasks-inbox-section" class="mb-5" style="display:none">
  <div class="flex items-center justify-between mb-2">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tasks</h2>
    <div class="flex gap-2">
      <button onclick="autoAssignAll()" id="auto-assign-all-btn" style="background:#1a1a1a;color:#a78bfa;border:1px solid #2a2a2a;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer;display:none">Auto-assign All</button>
      <button onclick="openMissionModal()" style="background:#014421;color:#fff;border:none;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer">+ New</button>
    </div>
  </div>
  <div id="tasks-inbox" class="flex flex-wrap gap-3"></div>
</div>

<!-- Mission Control -->
<div id="mission-section" class="mb-5" style="display:none">
  <div class="flex items-center justify-between mb-2">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Mission Control</h2>
    <button onclick="openTaskHistory()" style="background:none;border:none;color:#6b7280;font-size:12px;cursor:pointer">History &rarr;</button>
  </div>
  <div id="mission-board" class="flex gap-3 overflow-x-auto pb-2" style="scroll-snap-type: x mandatory;">
  </div>
</div>

<!-- Mission Task Creation Modal -->
<div id="mission-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:40;opacity:0;pointer-events:none;transition:opacity 0.2s"></div>
<div id="mission-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.95);z-index:50;background:#141414;border:1px solid #2a2a2a;border-radius:12px;width:90%;max-width:440px;opacity:0;pointer-events:none;transition:transform 0.2s ease,opacity 0.2s ease">
  <div class="flex items-center justify-between px-4 pt-4 pb-2">
    <h3 class="text-sm font-bold text-white">New Task</h3>
    <button onclick="closeMissionModal()" class="text-gray-500 hover:text-white" style="background:none;border:none;cursor:pointer;font-size:16px">&times;</button>
  </div>
  <div style="padding:0 16px 16px">
    <input type="text" id="mission-title" placeholder="Title" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e0e0e0;font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box" maxlength="200">
    <textarea id="mission-prompt" rows="3" placeholder="What should the agent do?" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e0e0e0;font-size:13px;outline:none;resize:vertical;margin-bottom:8px;box-sizing:border-box" maxlength="10000"></textarea>
    <div class="flex gap-2 items-center">
      <select id="mission-priority" style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:6px 10px;color:#e0e0e0;font-size:12px;outline:none">
        <option value="0">Low</option>
        <option value="5" selected>Medium</option>
        <option value="10">High</option>
      </select>
      <button onclick="createMissionTask()" style="flex:1;background:#014421;color:#fff;border:none;border-radius:8px;padding:8px;font-size:13px;font-weight:600;cursor:pointer">Create</button>
    </div>
    <div id="mission-error" class="text-red-400 text-xs mt-2" style="display:none"></div>
  </div>
</div>

<!-- Agent Detail Modal -->
<div id="agent-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:40;opacity:0;pointer-events:none;transition:opacity 0.2s"></div>
<div id="agent-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.95);z-index:50;background:#141414;border:1px solid #2a2a2a;border-radius:12px;width:90%;max-width:500px;max-height:80vh;opacity:0;pointer-events:none;transition:transform 0.2s ease,opacity 0.2s ease;display:flex;flex-direction:column">
  <div class="flex items-center justify-between px-4 pt-4 pb-2">
    <h3 class="text-sm font-bold text-white" id="agent-modal-title">Agent</h3>
    <button onclick="closeAgentModal()" class="text-gray-500 hover:text-white" style="background:none;border:none;cursor:pointer;font-size:16px">&times;</button>
  </div>
  <div id="agent-modal-body" style="overflow-y:auto;padding:0 16px 16px;flex:1"></div>
</div>

<!-- Create Agent Wizard Modal -->
<div id="create-agent-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:40;opacity:0;pointer-events:none;transition:opacity 0.2s"></div>
<div id="create-agent-modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.95);z-index:50;background:#141414;border:1px solid #2a2a2a;border-radius:12px;width:90%;max-width:480px;max-height:85vh;opacity:0;pointer-events:none;transition:transform 0.2s ease,opacity 0.2s ease;display:flex;flex-direction:column">
  <div class="flex items-center justify-between px-4 pt-4 pb-2">
    <h3 class="text-sm font-bold text-white" id="create-agent-title">New Agent</h3>
    <button onclick="closeCreateAgentWizard()" class="text-gray-500 hover:text-white" style="background:none;border:none;cursor:pointer;font-size:16px">&times;</button>
  </div>
  <!-- Step indicators -->
  <div class="flex gap-2 px-4 mb-3">
    <div id="caw-step-1-dot" style="flex:1;height:3px;border-radius:2px;background:#014421;transition:background 0.2s"></div>
    <div id="caw-step-2-dot" style="flex:1;height:3px;border-radius:2px;background:#2a2a2a;transition:background 0.2s"></div>
    <div id="caw-step-3-dot" style="flex:1;height:3px;border-radius:2px;background:#2a2a2a;transition:background 0.2s"></div>
  </div>
  <div id="create-agent-body" style="overflow-y:auto;padding:0 16px 16px;flex:1">
    <!-- Step 1: Basics -->
    <div id="caw-step-1">
      <label class="text-xs text-gray-400 block mb-1">Agent ID <span class="text-gray-600">(lowercase, no spaces)</span></label>
      <input type="text" id="caw-id" placeholder="e.g. analytics" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e0e0e0;font-size:13px;outline:none;margin-bottom:4px;box-sizing:border-box" maxlength="30" oninput="cawIdChanged()">
      <div id="caw-id-status" class="text-xs mb-3" style="min-height:16px"></div>

      <label class="text-xs text-gray-400 block mb-1">Display Name</label>
      <input type="text" id="caw-name" placeholder="e.g. Analytics" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e0e0e0;font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box" maxlength="50" oninput="cawNameManuallyEdited=true">

      <label class="text-xs text-gray-400 block mb-1">Description</label>
      <input type="text" id="caw-desc" placeholder="What this agent does" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e0e0e0;font-size:13px;outline:none;margin-bottom:8px;box-sizing:border-box" maxlength="200">

      <div class="flex gap-2 mb-3">
        <div style="flex:1">
          <label class="text-xs text-gray-400 block mb-1">Model</label>
          <select id="caw-model" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 10px;color:#e0e0e0;font-size:12px;outline:none">
            <option value="claude-sonnet-4-6" selected>Sonnet 4.6</option>
            <option value="claude-opus-4-6">Opus 4.6</option>
            <option value="claude-haiku-4-5">Haiku 4.5</option>
          </select>
        </div>
        <div style="flex:1">
          <label class="text-xs text-gray-400 block mb-1">Template</label>
          <select id="caw-template" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 10px;color:#e0e0e0;font-size:12px;outline:none">
            <option value="_template">Blank</option>
          </select>
        </div>
      </div>

      <div id="caw-step1-error" class="text-red-400 text-xs mb-2" style="display:none"></div>
      <button onclick="cawGoStep2()" style="width:100%;background:#014421;color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer">Next: Set up Telegram bot</button>
    </div>

    <!-- Step 2: BotFather + Token -->
    <div id="caw-step-2" style="display:none">
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:14px;margin-bottom:12px">
        <div class="text-xs text-gray-400 font-semibold uppercase mb-2">Create a Telegram bot</div>
        <div class="text-xs text-gray-300 leading-relaxed">
          1. Open <a href="https://t.me/BotFather" target="_blank" rel="noopener" style="color:#34d399;text-decoration:none">@BotFather</a> in Telegram<br>
          2. Send <code style="background:#222;padding:1px 4px;border-radius:3px">/newbot</code><br>
          3. Name it: <span id="caw-suggested-name" style="color:#a78bfa;cursor:pointer" onclick="copyToClipboard(this.textContent)" title="Click to copy"></span><br>
          4. Username: <span id="caw-suggested-username" style="color:#a78bfa;cursor:pointer" onclick="copyToClipboard(this.textContent)" title="Click to copy"></span><br>
          5. Copy the token BotFather gives you
        </div>
      </div>

      <label class="text-xs text-gray-400 block mb-1">Bot Token</label>
      <div style="position:relative">
        <input type="text" id="caw-token" placeholder="Paste token from BotFather" style="width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;padding-right:70px;color:#e0e0e0;font-size:13px;outline:none;box-sizing:border-box;font-family:monospace" oninput="cawTokenChanged()">
        <div id="caw-token-status" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px"></div>
      </div>
      <div id="caw-token-info" class="text-xs mt-2" style="min-height:16px"></div>

      <div class="flex gap-2 mt-3">
        <button onclick="cawGoStep1()" style="flex:0 0 auto;background:#1a1a1a;color:#9ca3af;border:1px solid #2a2a2a;border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer">Back</button>
        <button id="caw-create-btn" onclick="cawCreate()" style="flex:1;background:#014421;color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;opacity:0.5;pointer-events:none">Create Agent</button>
      </div>
      <div id="caw-step2-error" class="text-red-400 text-xs mt-2" style="display:none"></div>
    </div>

    <!-- Step 3: Confirmation + Activate -->
    <div id="caw-step-3" style="display:none">
      <div style="text-align:center;margin-bottom:16px">
        <div style="width:48px;height:48px;border-radius:50%;background:#064e3b;margin:0 auto 8px;display:flex;align-items:center;justify-content:center">
          <svg width="24" height="24" fill="none" stroke="#6ee7b7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="text-sm font-semibold text-white">Agent Created</div>
      </div>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:14px;margin-bottom:12px">
        <div id="caw-summary" class="text-xs text-gray-300 leading-relaxed"></div>
      </div>

      <div id="caw-activate-section">
        <button id="caw-activate-btn" onclick="cawActivate()" style="width:100%;background:#064e3b;color:#6ee7b7;border:1px solid #065f46;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer">Activate (install service + start)</button>
        <div id="caw-activate-status" class="text-xs text-center mt-2" style="min-height:16px"></div>
      </div>

      <button onclick="closeCreateAgentWizard();loadAgents();loadMissionControl();" style="width:100%;background:#1a1a1a;color:#9ca3af;border:1px solid #2a2a2a;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;margin-top:8px">Done</button>
    </div>
  </div>
</div>

<!-- Desktop: 2-column grid. Mobile: stacked. -->
<div class="lg:grid lg:grid-cols-2 lg:gap-6">

<!-- LEFT COLUMN -->
<div>

<!-- Scheduled Tasks -->
<div id="tasks-section">
  <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Scheduled Tasks<span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Automated tasks scheduled by the bot (e.g. reminders, checks). Shows the schedule, status, and time until next run.</span></span><button class="privacy-toggle" onclick="toggleSectionBlur('tasks')" title="Toggle blur">&#128065;</button></h2>
  <div id="tasks-container"><div class="card text-gray-500 text-sm">Loading...</div></div>
</div>

<!-- Memory Landscape -->
<div id="memory-section" class="mt-5">
  <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Memory Landscape</h2>
  <div class="grid grid-cols-3 gap-3 mb-3">
    <div class="card clickable-card text-center" onclick="openMemoryDrawer()" style="cursor:pointer">
      <div class="stat-val" id="mem-total">-</div>
      <div class="stat-label">Memories</div>
      <div class="text-xs text-gray-600 mt-1">Tap to browse</div>
    </div>
    <div class="card clickable-card text-center" onclick="openInsightsDrawer()" style="cursor:pointer">
      <div class="stat-val" id="mem-consolidations">-</div>
      <div class="stat-label">Insights</div>
      <div class="text-xs text-gray-600 mt-1">Tap to browse</div>
    </div>
    <div class="card clickable-card text-center" onclick="openPinnedDrawer()" style="cursor:pointer">
      <div class="stat-val" id="mem-pinned" style="color:#34d399">-</div>
      <div class="stat-label">Pinned</div>
      <div class="text-xs text-gray-600 mt-1">Tap to browse</div>
    </div>
  </div>
  <div class="card">
    <div class="text-xs text-gray-400 mb-2">Importance Distribution<span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Distribution of memories by LLM-assigned importance (0-1). Higher = more critical to remember long-term.</span></span></div>
    <canvas id="importance-chart" height="120"></canvas>
  </div>
  <div class="card">
    <div class="flex items-center justify-between mb-1">
      <div class="text-xs text-gray-400">Fading Soon <span class="text-gray-600">(salience &lt; 0.5)</span><span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Memories losing salience. High-importance ones decay slower; low-importance ones fade fast.</span></span></div>
      <button class="text-xs text-gray-600 hover:text-gray-400 transition" onclick="openMemoryDrawer()">Browse all &rarr;</button>
    </div>
    <div id="fading-list" class="text-sm"></div>
  </div>
  <div class="card">
    <div class="flex items-center justify-between mb-1">
      <div class="text-xs text-gray-400">Recently Retrieved<span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">High-importance memories recently used in conversations.</span></span></div>
      <button class="text-xs text-gray-600 hover:text-gray-400 transition" onclick="openMemoryDrawer()">Browse all &rarr;</button>
    </div>
    <div id="top-accessed-list" class="text-sm"></div>
  </div>
  <div class="card">
    <div class="flex items-center justify-between mb-1">
      <div class="text-xs text-gray-400">Recent Insights<span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Patterns and connections discovered across memories by the consolidation engine.</span></span></div>
    </div>
    <div id="insights-list" class="text-sm"></div>
  </div>
  <div class="card">
    <div class="text-xs text-gray-400 mb-2">Memory Creation (30d)<span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Number of new memories created per day over the last 30 days. Only meaningful exchanges get stored.</span></span></div>
    <canvas id="memory-timeline-chart" height="140"></canvas>
  </div>
</div>

</div><!-- end LEFT COLUMN -->

<!-- RIGHT COLUMN -->
<div>

<!-- System Health -->
<div id="health-section" class="mt-5 lg:mt-0">
  <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">System Health</h2>
  <div class="card flex items-center gap-4">
    <div class="relative">
      <svg id="context-gauge" width="90" height="90" viewBox="0 0 90 90"></svg>
      <span class="info-tip" style="position:absolute;top:0;right:-4px;"><span class="info-icon">\u24D8</span><span class="info-tooltip">Percentage of the context window in use. The higher it is, the closer the bot is to its working memory limit.</span></span>
    </div>
    <div class="flex-1">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <div class="stat-val text-base" id="health-turns">-</div>
          <div class="stat-label">Turns</div>
        </div>
        <div>
          <div class="stat-val text-base" id="health-age">-</div>
          <div class="stat-label">Age</div>
        </div>
        <div>
          <div class="stat-val text-base" id="health-compactions">-</div>
          <div class="stat-label">Compactions</div>
        </div>
      </div>
      <div class="text-center mt-1"><span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Turns = number of exchanges in the session. Age = session duration. Compactions = how many times context was compressed to free up space.</span></span></div>
    </div>
  </div>
  <div class="flex gap-3 mt-1 flex-wrap">
    <span class="pill" id="tg-pill">Telegram</span>
    <span class="pill" id="wa-pill">WhatsApp</span>
    <span class="pill" id="slack-pill">Slack</span>
    <span class="pill pill-unconfigured" id="supabase-pill">Supabase</span>
    <span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Connection status for messaging platforms and cloud sync. Green = connected, Red = disconnected, Gray = not configured.</span></span>
  </div>
</div>

<!-- Token / Cost -->
<div id="token-section" class="mt-5 mb-8">
  <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2" id="tokens-section">Token Usage<span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Token consumption (text units processed by the AI). Today's totals and all-time cumulative. Included in your Max subscription.</span></span></h2>
  <div class="card">
    <div class="flex justify-between items-baseline">
      <div>
        <div class="stat-val" id="token-today-cost">-</div>
        <div class="stat-label">Tokens Today</div>
      </div>
      <div class="text-right">
        <div class="stat-val text-base" id="token-today-turns">-</div>
        <div class="stat-label">Turns today</div>
      </div>
    </div>
    <div class="mt-2 text-xs text-gray-500">All-time: <span id="token-alltime-cost">-</span> tokens across <span id="token-alltime-turns">-</span> turns</div>
  </div>
  <div class="card">
    <div class="text-xs text-gray-400 mb-2">Usage Timeline (30d)<span class="info-tip"><span class="info-icon">\u24D8</span><span class="info-tooltip">Daily token usage over the last 30 days.</span></span></div>
    <canvas id="cost-chart" height="140"></canvas>
  </div>

</div>

</div><!-- end RIGHT COLUMN -->

</div><!-- end grid -->

</div><!-- end main-tab-dashboard -->

<!-- Database View -->
<div id="main-tab-database" style="display:none">
  <div class="db-layout">
    <div class="db-sidebar" id="db-sidebar">
      <div style="padding:8px 14px;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Tables</div>
      <div id="db-table-list"><div style="padding:8px 14px;color:#555;font-size:12px">Loading...</div></div>
    </div>
    <div>
      <div class="db-grid-wrapper">
        <div class="db-grid-scroll" id="db-grid-scroll">
          <table class="db-grid" id="db-grid">
            <thead id="db-grid-head"></thead>
            <tbody id="db-grid-body"><tr><td style="padding:20px;color:#555">Select a table</td></tr></tbody>
          </table>
        </div>
        <div class="db-pagination" id="db-pagination" style="display:none">
          <span id="db-row-info"></span>
          <div class="flex items-center gap-2">
            <button class="db-page-btn" id="db-prev-btn" onclick="dbPrevPage()">&larr; Prev</button>
            <span id="db-page-info"></span>
            <button class="db-page-btn" id="db-next-btn" onclick="dbNextPage()">Next &rarr;</button>
          </div>
        </div>
      </div>
      <div class="db-query-area">
        <textarea class="db-query-textarea" id="db-query-input" rows="3" placeholder="SELECT * FROM scheduled_tasks WHERE status = 'active' LIMIT 20" onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();dbRunQuery()}"></textarea>
        <div class="db-query-bar">
          <button class="db-run-btn" onclick="dbRunQuery()">Run Query</button>
          <span id="db-query-status" class="db-query-info"></span>
        </div>
        <div id="db-query-error" class="db-query-error" style="display:none"></div>
      </div>
    </div>
  </div>
</div><!-- end main-tab-database -->

<!-- Supabase View -->
<div id="main-tab-supabase" style="display:none">
  <div class="db-layout">
    <div class="db-sidebar" id="sb-sidebar">
      <div style="padding:8px 14px;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Supabase Tables</div>
      <div id="sb-table-list"><div style="padding:8px 14px;color:#555;font-size:12px">Loading...</div></div>
    </div>
    <div>
      <div class="db-grid-wrapper">
        <div class="db-grid-scroll" id="sb-grid-scroll">
          <table class="db-grid" id="sb-grid">
            <thead id="sb-grid-head"></thead>
            <tbody id="sb-grid-body"><tr><td style="padding:20px;color:#555">Select a table</td></tr></tbody>
          </table>
        </div>
        <div class="db-pagination" id="sb-pagination" style="display:none">
          <span id="sb-row-info"></span>
          <div class="flex items-center gap-2">
            <button class="db-page-btn" id="sb-prev-btn" onclick="sbPrevPage()">&larr; Prev</button>
            <span id="sb-page-info"></span>
            <button class="db-page-btn" id="sb-next-btn" onclick="sbNextPage()">Next &rarr;</button>
          </div>
        </div>
      </div>
      <!-- Add Row section -->
      <div class="sb-insert-area" id="sb-insert-area" style="display:none">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <button class="sb-add-row-btn" id="sb-toggle-form-btn" onclick="sbToggleAddForm()">+ Add Row</button>
          <span id="sb-insert-status" class="sb-insert-status"></span>
        </div>
        <div id="sb-add-form" style="display:none">
          <div class="sb-form-grid" id="sb-form-fields"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:12px">
            <button class="sb-add-row-btn" id="sb-submit-row-btn" onclick="sbInsertRow()">Insert Row</button>
            <button class="db-page-btn" onclick="sbToggleAddForm()">Cancel</button>
          </div>
        </div>
      </div>
      <!-- JSON Insert area -->
      <div class="db-query-area" id="sb-json-area" style="display:none">
        <textarea class="db-query-textarea" id="sb-json-input" rows="3" placeholder='{"column_name": "value", "other_col": 123}' onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();sbInsertJson()}"></textarea>
        <div class="db-query-bar">
          <button class="db-run-btn" onclick="sbInsertJson()">Insert JSON</button>
          <span id="sb-json-status" class="db-query-info"></span>
        </div>
        <div id="sb-json-error" class="db-query-error" style="display:none"></div>
      </div>
    </div>
  </div>
</div><!-- end main-tab-supabase -->

</div><!-- end outer wrapper -->

<!-- Memory drill-down drawer -->
<div id="drawer-overlay" class="drawer-overlay" onclick="closeDrawer()"></div>
<div id="drawer" class="drawer">
  <div class="drawer-handle"></div>
  <div class="flex items-center justify-between px-4 pt-3 pb-1">
    <h3 class="text-base font-bold text-white" id="drawer-title">Memories</h3>
    <button onclick="closeDrawer()" class="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
  </div>
  <div class="px-4 pb-2 flex items-center gap-2">
    <span class="text-xs text-gray-500" id="drawer-count"></span>
    <span class="text-xs text-gray-600">|</span>
    <span class="text-xs text-gray-500" id="drawer-avg-salience"></span>
  </div>
  <div class="drawer-body" id="drawer-body"></div>
  <div id="drawer-load-more" class="px-4 pb-4 hidden">
    <button onclick="loadMoreMemories()" class="w-full py-2 text-sm text-gray-400 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:text-white transition">Load more</button>
  </div>
</div>

<!-- Task History Drawer -->
<div id="history-overlay" class="drawer-overlay" onclick="closeTaskHistory()"></div>
<div id="history-drawer" class="drawer">
  <div class="drawer-handle"></div>
  <div class="flex items-center justify-between px-4 pt-3 pb-1">
    <h3 class="text-base font-bold text-white">Task History</h3>
    <button onclick="closeTaskHistory()" class="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
  </div>
  <div class="px-4 pb-2"><span class="text-xs text-gray-500" id="history-count"></span></div>
  <div class="drawer-body" id="history-body"></div>
  <div id="history-load-more" class="px-4 pb-4 hidden">
    <button onclick="loadMoreHistory()" class="w-full py-2 text-sm text-gray-400 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:text-white transition">Load more</button>
  </div>
</div>

<script>
const TOKEN = ''; // No longer used — auth is cookie-based
const CHAT_ID = ${JSON.stringify(chatId)};
const BASE = location.origin;

// ── Cookie-based auth ────────────────────────────────────────────────
async function checkAuth() {
  try {
    const r = await fetch(BASE + '/api/auth-check', { credentials: 'include' });
    const d = await r.json();
    return d.authenticated === true;
  } catch { return false; }
}
async function doLogin(password) {
  const r = await fetch(BASE + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password })
  });
  return r.ok;
}
async function doLogout() {
  await fetch(BASE + '/api/logout', { method: 'POST', credentials: 'include' });
  location.reload();
}

// Override fetch globally to always include credentials (cookie auth)
const _originalFetch = window.fetch;
window.fetch = function(url, opts) {
  opts = opts || {};
  opts.credentials = opts.credentials || 'include';
  return _originalFetch.call(this, url, opts).then(r => {
    if (r.status === 401 && !url.toString().includes('/api/auth-check') && !url.toString().includes('/api/login')) {
      document.getElementById('login-overlay').style.display = 'flex';
    }
    return r;
  });
};

// Device detection
function detectDevice() {
  const ua = navigator.userAgent;
  const badge = document.getElementById('device-badge');
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
  if (isMobile) {
    badge.textContent = 'MOBILE';
    badge.className = 'device-badge device-mobile';
  } else {
    badge.textContent = 'DESKTOP';
    badge.className = 'device-badge device-desktop';
  }
}
detectDevice();
window.addEventListener('resize', detectDevice);

// Memory drawer state
let drawerOffset = 0;
let drawerTotal = 0;
const DRAWER_PAGE = 30;

function salienceColor(s) {
  if (s >= 4) return '#10b981';
  if (s >= 3) return '#22c55e';
  if (s >= 2) return '#84cc16';
  if (s >= 1) return '#eab308';
  if (s >= 0.5) return '#f97316';
  return '#ef4444';
}

function formatDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMemoryItem(m) {
  let entities = [];
  let topics = [];
  let connections = [];
  try { entities = JSON.parse(m.entities); } catch {}
  try { topics = JSON.parse(m.topics); } catch {}
  try { connections = JSON.parse(m.connections); } catch {}
  const topicTags = topics.length > 0 ? '<div class="mt-1">' + topics.map(t => '<span style="background:#1e293b;padding:1px 6px;border-radius:4px;margin-right:3px;font-size:11px;color:#94a3b8">' + escapeHtml(t) + '</span>').join('') + '</div>' : '';
  const entityLine = entities.length > 0 ? '<div class="text-xs text-gray-600 mt-1">entities: ' + escapeHtml(entities.join(', ')) + '</div>' : '';
  const connLine = connections.length > 0 ? '<div class="text-xs text-gray-600 mt-1">linked to: ' + connections.map(c => '#' + c.linked_to + ' (' + escapeHtml(c.relationship || '') + ')').join(', ') + '</div>' : '';

  return '<div class="mem-item" onclick="this.classList.toggle(&quot;expanded&quot;)">' +
    '<div class="flex items-center gap-2 mb-1">' +
      '<span class="salience-dot" style="background:' + importanceColor(m.importance) + '"></span>' +
      '<span class="text-xs font-semibold" style="color:' + importanceColor(m.importance) + '">' + m.importance.toFixed(2) + '</span>' +
      '<span class="text-xs text-gray-700 ml-1">sal ' + m.salience.toFixed(2) + '</span>' +
      '<span class="text-xs text-gray-600 ml-auto">' + formatDate(m.created_at) + '</span>' +
    '</div>' +
    '<div class="text-sm text-gray-300 mem-content">' + escapeHtml(m.summary) + '</div>' +
    topicTags +
    entityLine +
    connLine +
  '</div>';
}

async function openMemoryDrawer() {
  drawerOffset = 0;
  document.getElementById('drawer-title').textContent = 'All Memories';
  document.getElementById('drawer-body').innerHTML = '<div class="text-gray-500 text-sm text-center py-8">Loading...</div>';
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  await loadDrawerPage();
}

async function openPinnedDrawer() {
  document.getElementById('drawer-title').textContent = 'Pinned Memories';
  document.getElementById('drawer-count').textContent = '';
  document.getElementById('drawer-avg-salience').textContent = '';
  document.getElementById('drawer-body').innerHTML = '<div class="text-gray-500 text-sm text-center py-8">Loading...</div>';
  document.getElementById('drawer-load-more').classList.add('hidden');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  try {
    var data = await api('/api/memories/pinned?chatId=' + CHAT_ID);
    var mems = data.memories || [];
    document.getElementById('drawer-count').textContent = mems.length + ' pinned';
    if (mems.length === 0) {
      document.getElementById('drawer-body').innerHTML = '<div class="text-gray-500 text-sm text-center py-8">No pinned memories. Use /pin to make important memories permanent.</div>';
      return;
    }
    document.getElementById('drawer-body').innerHTML = mems.map(renderMemoryItem).join('');
  } catch(e) {
    document.getElementById('drawer-body').innerHTML = '<div class="text-red-400 text-sm text-center py-8">Failed to load pinned memories</div>';
  }
}

async function openInsightsDrawer() {
  document.getElementById('drawer-title').textContent = 'Consolidation Insights';
  document.getElementById('drawer-count').textContent = '';
  document.getElementById('drawer-avg-salience').textContent = '';
  document.getElementById('drawer-body').innerHTML = '<div class="text-gray-500 text-sm text-center py-8">Loading...</div>';
  document.getElementById('drawer-load-more').classList.add('hidden');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  try {
    var data = await api('/api/memories?chatId=' + CHAT_ID);
    var insights = data.consolidations || [];
    document.getElementById('drawer-count').textContent = insights.length + ' insights';
    if (insights.length === 0) {
      document.getElementById('drawer-body').innerHTML = '<div class="text-gray-500 text-sm text-center py-8">No insights yet. Consolidation runs every 30 minutes.</div>';
      return;
    }
    document.getElementById('drawer-body').innerHTML = insights.map(function(c) {
      var date = new Date(c.created_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return '<div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:12px;margin-bottom:8px">' +
        '<div class="text-xs text-green-400 mb-1">' + date + '</div>' +
        '<div class="text-sm text-white mb-2">' + escapeHtml(c.insight || c.summary) + '</div>' +
        (c.summary && c.insight ? '<div class="text-xs text-gray-500">' + escapeHtml(c.summary) + '</div>' : '') +
      '</div>';
    }).join('');
  } catch(e) {
    document.getElementById('drawer-body').innerHTML = '<div class="text-red-400 text-sm text-center py-8">Failed to load insights</div>';
  }
}

async function loadDrawerPage() {
  const data = await api('/api/memories/list?chatId=' + CHAT_ID + '&sort=importance&limit=' + DRAWER_PAGE + '&offset=' + drawerOffset);
  drawerTotal = data.total;
  const body = document.getElementById('drawer-body');
  if (drawerOffset === 0) body.innerHTML = '';
  body.innerHTML += data.memories.map(renderMemoryItem).join('');
  drawerOffset += data.memories.length;
  document.getElementById('drawer-count').textContent = drawerTotal + ' total';
  const avgImp = data.memories.length > 0
    ? (data.memories.reduce((s, m) => s + m.importance, 0) / data.memories.length).toFixed(2)
    : '0';
  document.getElementById('drawer-avg-salience').textContent = 'avg importance ' + avgImp;
  const btn = document.getElementById('drawer-load-more');
  if (drawerOffset < drawerTotal) btn.classList.remove('hidden');
  else btn.classList.add('hidden');
}

async function loadMoreMemories() {
  await loadDrawerPage();
}

function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  document.body.style.overflow = '';
}

function api(path) {
  return fetch(BASE + path, { credentials: 'include' }).then(r => {
    if (r.status === 401) { location.reload(); throw new Error('Session expired'); }
    return r.json();
  });
}

let salienceChart, memTimelineChart, costChart;

function cronToHuman(cron) {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  const [min, hour, dom, mon, dow] = parts;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const time = (hour !== '*' ? hour.padStart(2,'0') : '*') + ':' + (min !== '*' ? min.padStart(2,'0') : '*');
  if (dow === '*' && dom === '*') return 'Daily at ' + time;
  if (dow !== '*' && dom === '*') {
    if (dow === '1-5') return 'Weekdays at ' + time;
    const d = dow.split(',').map(n => days[parseInt(n)] || n).join(', ');
    return d + ' at ' + time;
  }
  return cron;
}

function timeAgo(ts) {
  const diff = Math.floor(Date.now()/1000) - ts;
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}

function countdown(ts) {
  const diff = ts - Math.floor(Date.now()/1000);
  if (diff <= 0) return 'now';
  if (diff < 60) return diff + 's';
  if (diff < 3600) return Math.floor(diff/60) + 'm';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ' + Math.floor((diff%3600)/60) + 'm';
  return Math.floor(diff/86400) + 'd';
}
function elapsed(ts) {
  const diff = Math.floor(Date.now()/1000) - ts;
  if (diff < 60) return diff + 's';
  if (diff < 3600) return Math.floor(diff/60) + 'm ' + (diff%60) + 's';
  return Math.floor(diff/3600) + 'h ' + Math.floor((diff%3600)/60) + 'm';
}

async function taskAction(id, action) {
  try {
    if (action === 'delete') {
      await fetch(BASE + '/api/tasks/' + id + '', { method: 'DELETE' });
    } else {
      await fetch(BASE + '/api/tasks/' + id + '/' + action + '', { method: 'POST' });
    }
    await loadTasks();
  } catch(e) { console.error('Task action failed:', e); }
}

async function loadTasks() {
  try {
    const data = await api('/api/tasks');
    const c = document.getElementById('tasks-container');
    if (!data.tasks || data.tasks.length === 0) {
      c.innerHTML = '<div class="card text-gray-500 text-sm">No scheduled tasks</div>';
      return;
    }
    c.innerHTML = data.tasks.map(t => {
      const statusCls = t.status === 'running' ? 'pill-running' : t.status === 'active' ? 'pill-active' : 'pill-paused';
      const agentBadge = t.agent_id && t.agent_id !== 'main' ? '<span class="text-xs text-gray-500 ml-2">[' + t.agent_id + ']</span>' : '';
      const lastStatusIcon = t.last_status === 'success' ? '<span class="last-success" title="Last run succeeded">&#10003;</span> ' : t.last_status === 'failed' ? '<span class="last-failed" title="Last run failed">&#10007;</span> ' : t.last_status === 'timeout' ? '<span class="last-timeout" title="Last run timed out">&#9200;</span> ' : '';
      const lastResult = t.last_result ? '<details class="mt-2"><summary class="text-xs text-gray-500">' + lastStatusIcon + 'Last result</summary><pre class="text-xs text-gray-400 mt-1 whitespace-pre-wrap break-words">' + escapeHtml(t.last_result) + '</pre></details>' : '';
      const runningInfo = t.status === 'running' && t.started_at ? '<span class="text-xs text-green-400 ml-2">running for ' + elapsed(t.started_at) + '</span>' : '';
      const pauseBtn = t.status === 'active'
        ? '<button data-task="' + t.id + '" data-action="pause" onclick="taskAction(this.dataset.task,this.dataset.action)" title="Pause" style="background:none;border:none;cursor:pointer;color:#fbbf24;font-size:14px;padding:2px 4px">&#9208;</button>'
        : t.status === 'paused' ? '<button data-task="' + t.id + '" data-action="resume" onclick="taskAction(this.dataset.task,this.dataset.action)" title="Resume" style="background:none;border:none;cursor:pointer;color:#6ee7b7;font-size:14px;padding:2px 4px">&#9654;</button>' : '';
      const deleteBtn = '<button data-task="' + t.id + '" data-action="delete" onclick="taskAction(this.dataset.task,this.dataset.action)" title="Delete" style="background:none;border:none;cursor:pointer;color:#f87171;font-size:14px;padding:2px 4px">&times;</button>';
      const taskBlurState = JSON.parse(localStorage.getItem('privacyBlur_tasks') || '{}');
      const tasksAllRevealed = localStorage.getItem('privacyBlur_tasks_all') === 'revealed';
      const taskBlurred = tasksAllRevealed ? false : (taskBlurState[t.id] !== false);
      const taskBlurClass = taskBlurred ? 'privacy-blur' : '';
      return '<div class="card"><div class="flex justify-between items-start"><div class="flex-1 mr-2"><div class="text-sm text-white task-prompt ' + taskBlurClass + '" data-section="tasks" data-idx="' + t.id + '" onclick="toggleItemBlur(this)">' + escapeHtml(t.prompt) + '</div>' + agentBadge + '<div class="text-xs text-gray-500 mt-1">' + cronToHuman(t.schedule) + ' &middot; next in <span class="countdown" data-ts="' + t.next_run + '">' + countdown(t.next_run) + '</span>' + runningInfo + '</div></div><div class="flex items-center gap-1">' + pauseBtn + deleteBtn + '<span class="pill ' + statusCls + '">' + t.status + '</span></div></div>' + lastResult + '</div>';
    }).join('');
  } catch(e) {
    document.getElementById('tasks-container').innerHTML = '<div class="card text-red-400 text-sm">Failed to load tasks</div>';
  }
}

function importanceColor(imp) {
  if (imp >= 0.8) return '#10b981';
  if (imp >= 0.6) return '#22c55e';
  if (imp >= 0.4) return '#eab308';
  if (imp >= 0.2) return '#f97316';
  return '#ef4444';
}

function renderTopics(topicsJson) {
  try {
    const topics = JSON.parse(topicsJson);
    if (!topics.length) return '';
    return '<div class="text-xs text-gray-600 mt-0.5">' + topics.map(t => '<span style="background:#1e293b;padding:1px 6px;border-radius:4px;margin-right:3px">' + escapeHtml(t) + '</span>').join('') + '</div>';
  } catch { return ''; }
}

async function loadMemories() {
  try {
    const data = await api('/api/memories?chatId=' + CHAT_ID);
    document.getElementById('mem-total').textContent = data.stats.total;
    document.getElementById('mem-consolidations').textContent = data.stats.consolidations;
    document.getElementById('mem-pinned').textContent = data.stats.pinned || '0';

    // Importance distribution chart
    const bucketLabels = ['0-0.2','0.2-0.4','0.4-0.6','0.6-0.8','0.8-1.0'];
    const bucketColors = ['#ef4444','#f97316','#eab308','#22c55e','#10b981'];
    const bucketData = bucketLabels.map(b => {
      const found = data.stats.importanceDistribution.find(d => d.bucket === b);
      return found ? found.count : 0;
    });
    if (salienceChart) salienceChart.destroy();
    salienceChart = new Chart(document.getElementById('importance-chart'), {
      type: 'bar',
      data: { labels: bucketLabels, datasets: [{ data: bucketData, backgroundColor: bucketColors, borderRadius: 4 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#666' }, grid: { color: '#222' } }, x: { ticks: { color: '#666' }, grid: { display: false } } } }
    });

    // Fading
    const fading = document.getElementById('fading-list');
    if (data.fading.length === 0) {
      fading.innerHTML = '<span class="text-gray-600">None fading</span>';
    } else {
      fading.innerHTML = data.fading.map(m => '<div class="fade-text py-0.5 mem-expand" onclick="this.classList.toggle(&quot;open&quot;)"><span class="mem-preview"><span style="color:' + importanceColor(m.importance) + '">[' + m.importance.toFixed(1) + ']</span> ' + escapeHtml(m.summary.slice(0,80)) + (m.summary.length > 80 ? '...' : '') + '</span><div class="mem-full">' + escapeHtml(m.summary) + renderTopics(m.topics) + '</div></div>').join('');
    }

    // Top accessed
    const top = document.getElementById('top-accessed-list');
    if (data.topAccessed.length === 0) {
      top.innerHTML = '<span class="text-gray-600">No memories yet</span>';
    } else {
      top.innerHTML = data.topAccessed.map(m => '<div class="top-text py-0.5 mem-expand" onclick="this.classList.toggle(&quot;open&quot;)"><span class="mem-preview"><span style="color:' + importanceColor(m.importance) + '">[' + m.importance.toFixed(1) + ']</span> ' + escapeHtml(m.summary.slice(0,80)) + (m.summary.length > 80 ? '...' : '') + '</span><div class="mem-full">' + escapeHtml(m.summary) + renderTopics(m.topics) + '</div></div>').join('');
    }

    // Insights
    const insights = document.getElementById('insights-list');
    if (!data.consolidations || data.consolidations.length === 0) {
      insights.innerHTML = '<span class="text-gray-600">No insights yet</span>';
    } else {
      insights.innerHTML = data.consolidations.map(c => '<div class="py-1 mem-expand" onclick="this.classList.toggle(&quot;open&quot;)"><span class="mem-preview" style="color:#a78bfa">' + escapeHtml(c.insight.slice(0,100)) + (c.insight.length > 100 ? '...' : '') + '</span><div class="mem-full" style="color:#d4d4d8">' + escapeHtml(c.summary) + '<div class="text-xs text-gray-600 mt-1">' + formatDate(c.created_at) + '</div></div></div>').join('');
    }

    // Timeline
    if (memTimelineChart) memTimelineChart.destroy();
    if (data.timeline.length > 0) {
      memTimelineChart = new Chart(document.getElementById('memory-timeline-chart'), {
        type: 'line',
        data: {
          labels: data.timeline.map(d => d.date.slice(5)),
          datasets: [
            { label: 'Memories', data: data.timeline.map(d => d.count), borderColor: '#028a45', backgroundColor: 'rgba(2,138,69,0.1)', fill: true, tension: 0.3 }
          ]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: '#888', boxWidth: 12 } } }, scales: { y: { ticks: { color: '#666' }, grid: { color: '#222' } }, x: { ticks: { color: '#666', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } } } }
      });
    }
  } catch(e) {
    console.error('Memory load error', e);
  }
}

function drawGauge(pct) {
  const svg = document.getElementById('context-gauge');
  const r = 36, cx = 45, cy = 45, sw = 8;
  const circ = 2 * Math.PI * r;
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  const dashOffset = circ - (circ * clampedPct / 100);
  let color = '#22c55e';
  if (clampedPct >= 75) color = '#ef4444';
  else if (clampedPct >= 50) color = '#f59e0b';
  svg.innerHTML =
    '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#2a2a2a" stroke-width="'+sw+'"/>' +
    '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+dashOffset+'" transform="rotate(-90 '+cx+' '+cy+')"/>' +
    '<text x="'+cx+'" y="'+cy+'" text-anchor="middle" dominant-baseline="central" fill="'+color+'" font-size="16" font-weight="700">'+clampedPct+'%</text>';
}

async function loadHealth() {
  try {
    const data = await api('/api/health?chatId=' + CHAT_ID);
    drawGauge(data.contextPct);
    document.getElementById('health-turns').textContent = data.turns;
    document.getElementById('health-compactions').textContent = data.compactions;
    document.getElementById('health-age').textContent = data.sessionAge;

    const tgPill = document.getElementById('tg-pill');
    tgPill.className = 'pill ' + (data.telegramConnected ? 'pill-connected' : 'pill-disconnected');
    const waPill = document.getElementById('wa-pill');
    waPill.className = 'pill ' + (data.waConnected ? 'pill-connected' : 'pill-disconnected');
    const slackPill = document.getElementById('slack-pill');
    slackPill.className = 'pill ' + (data.slackConnected ? 'pill-connected' : 'pill-disconnected');

    // Supabase status (async, non-blocking)
    loadSupabaseStatus();
  } catch(e) {
    drawGauge(0);
  }
}

async function loadSupabaseStatus() {
  var pill = document.getElementById('supabase-pill');
  try {
    var data = await api('/api/supabase/status');
    if (!data.enabled) {
      pill.className = 'pill pill-unconfigured';
      pill.textContent = 'Supabase: Not configured';
    } else if (data.connected) {
      pill.className = 'pill pill-connected';
      pill.textContent = 'Supabase: Connected';
    } else {
      pill.className = 'pill pill-disconnected';
      pill.textContent = 'Supabase: Connection failed';
    }
  } catch(e) {
    pill.className = 'pill pill-unconfigured';
    pill.textContent = 'Supabase: Unknown';
  }
}

async function loadTokens() {
  try {
    const data = await api('/api/tokens?chatId=' + CHAT_ID);
    var todayTok = (data.stats.todayInput || 0) + (data.stats.todayOutput || 0);
    document.getElementById('token-today-cost').textContent = todayTok > 1000 ? Math.round(todayTok / 1000).toLocaleString() + 'k' : todayTok.toString();
    document.getElementById('token-today-turns').textContent = data.stats.todayTurns;
    var allTok = (data.stats.allTimeInput || 0) + (data.stats.allTimeOutput || 0);
    document.getElementById('token-alltime-cost').textContent = allTok > 1000000 ? (allTok / 1000000).toFixed(1) + 'M' : allTok > 1000 ? Math.round(allTok / 1000) + 'k' : allTok.toString();
    document.getElementById('token-alltime-turns').textContent = data.stats.allTimeTurns;

    // Usage timeline (turns per day)
    if (costChart) costChart.destroy();
    if (data.costTimeline.length > 0) {
      costChart = new Chart(document.getElementById('cost-chart'), {
        type: 'line',
        data: {
          labels: data.costTimeline.map(d => d.date.slice(5)),
          datasets: [{ label: 'Turns', data: data.costTimeline.map(d => d.turns), borderColor: '#028a45', backgroundColor: 'rgba(2,138,69,0.1)', fill: true, tension: 0.3, pointRadius: 2 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#666' }, grid: { color: '#222' } }, x: { ticks: { color: '#666', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } } } }
      });
    }

    // Cache doughnut
    if (cacheChart) cacheChart.destroy();
  } catch(e) {
    console.error('Token load error', e);
  }
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadInfo() {
  try {
    const r = await fetch(BASE + '/api/info?chatId=' + CHAT_ID, { credentials: 'include' });
    const d = await r.json();
    const el = document.getElementById('bot-info');
    const parts = [];
    if (d.botName) parts.push('<span class="font-semibold text-white">' + d.botName + '</span>');
    el.innerHTML = parts.join(' <span class="text-gray-700">|</span> ');
  } catch {}
}

// Tooltip open/close \u2014 capture phase to intercept before inline onclick handlers
document.addEventListener('click', function(e) {
  const icon = e.target.closest('.info-icon');
  if (icon) {
    e.stopPropagation();
    e.preventDefault();
    const tip = icon.parentElement;
    const wasActive = tip.classList.contains('active');
    document.querySelectorAll('.info-tip.active').forEach(t => t.classList.remove('active'));
    if (!wasActive) tip.classList.add('active');
    return;
  }
  const tooltip = e.target.closest('.info-tooltip');
  if (tooltip) {
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  document.querySelectorAll('.info-tip.active').forEach(t => t.classList.remove('active'));
}, true);

// ── Agent & Hive Mind ────────────────────────────────────────────────
const AGENT_COLORS = { main: '#014421', comms: '#0ea5e9', content: '#f59e0b', ops: '#10b981', research: '#028a45' };

async function loadAgents() {
  try {
    const data = await api('/api/agents');
    const section = document.getElementById('agents-section');
    const container = document.getElementById('agents-container');
    // Always show agents section so "+ New Agent" button is accessible
    section.style.display = '';
    if (!data.agents || data.agents.length <= 1) {
      container.innerHTML = '<div class="text-xs text-gray-600 py-2">No agents yet. Click + New Agent to create one.</div>';
      return;
    }
    container.innerHTML = data.agents.map(a => {
      const color = AGENT_COLORS[a.id] || '#6b7280';
      const dot = a.running ? '<span style="color:#6ee7b7">\u25CF</span>' : '<span style="color:#666">\u25CB</span>';
      const statusText = a.running ? 'live' : 'off';
      const modelOpts = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5'];
      const modelShort = function(m) { return {'claude-opus-4-6':'Opus','claude-sonnet-4-6':'Sonnet','claude-sonnet-4-5':'Sonnet 4.5','claude-haiku-4-5':'Haiku'}[m] || m; };
      const currentModel = a.model || (a.id === 'main' ? 'claude-opus-4-6' : 'claude-sonnet-4-6');
      const modelLabel = modelShort(currentModel);
      const modelSelect = '<div class="model-picker" data-agent="' + a.id + '" onclick="event.stopPropagation();toggleModelPicker(this)">' +
        '<span class="model-current">' + modelLabel + ' <span style="font-size:8px;opacity:0.5">&#9662;</span></span>' +
        '<div class="model-menu" style="display:none">' +
          modelOpts.map(m => '<div class="model-opt' + (currentModel === m ? ' model-active' : '') + '" data-model="' + m + '" onclick="pickModel(this)">' + modelShort(m) + '</div>').join('') +
        '</div>' +
      '</div>';
      return '<div class="card clickable-card" style="min-width:130px;flex:1;max-width:220px;border-left:3px solid ' + color + '" data-agent="' + a.id + '" onclick="toggleAgentDetail(this.dataset.agent)">' +
        '<div class="font-bold text-white text-sm">' + a.name + '</div>' +
        '<div class="text-xs mt-1">' + dot + ' ' + statusText + '</div>' +
        modelSelect +
        (a.running ? '<div class="text-xs text-gray-400 mt-1">' + a.todayTurns + ' turns</div>' : '') +
      '</div>';
    }).join('');
  } catch {}
}

function toggleModelPicker(el) {
  var menu = el.querySelector('.model-menu');
  var isOpen = menu.style.display !== 'none';
  // Close all other menus first
  document.querySelectorAll('.model-menu').forEach(function(m) { m.style.display = 'none'; });
  menu.style.display = isOpen ? 'none' : '';
}

async function pickModel(optEl) {
  var model = optEl.dataset.model;
  var picker = optEl.closest('.model-picker');
  var agentId = picker.dataset.agent;
  picker.querySelector('.model-menu').style.display = 'none';
  try {
    await fetch(BASE + '/api/agents/' + agentId + '/model', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model }),
    });
    await loadAgents();
  } catch(e) { console.error('Model update failed:', e); }
}

async function pickGlobalModel(optEl) {
  var model = optEl.dataset.model;
  optEl.closest('.model-menu').style.display = 'none';
  try {
    await fetch(BASE + '/api/agents/model', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model }),
    });
    await loadAgents();
  } catch(e) { console.error('Global model update failed:', e); }
}

// Close model menus when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.model-picker')) {
    document.querySelectorAll('.model-menu').forEach(function(m) { m.style.display = 'none'; });
  }
});

async function toggleAgentDetail(agentId) {
  var overlay = document.getElementById('agent-modal-overlay');
  var modal = document.getElementById('agent-modal');
  var title = document.getElementById('agent-modal-title');
  var body = document.getElementById('agent-modal-body');

  // Find agent info
  var agent = missionAgentsList.find(function(a) { return a.id === agentId; });
  var color = AGENT_COLORS[agentId] || '#6b7280';
  title.innerHTML = '<span style="color:' + color + '">' + (agent ? agent.name : agentId) + '</span>';
  body.innerHTML = '<div class="text-gray-500 text-sm text-center py-8">Loading...</div>';

  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'auto';
  modal.style.opacity = '1';
  modal.style.pointerEvents = 'auto';
  modal.style.transform = 'translate(-50%,-50%) scale(1)';

  try {
    var results = await Promise.all([
      api('/api/agents/' + agentId + '/tasks'),
      api('/api/hive-mind?agent=' + agentId + '&limit=8'),
      api('/api/agents/' + agentId + '/conversation?chatId=' + CHAT_ID + '&limit=6'),
    ]);
    var tasks = results[0], hive = results[1], convo = results[2];
    var html = '';

    // Last conversation
    if (convo.turns && convo.turns.length > 0) {
      html += '<div class="text-xs text-gray-400 font-semibold mb-2 uppercase">Recent conversation</div>';
      var sorted = convo.turns.slice().reverse();
      html += sorted.map(function(t) {
        var role = t.role === 'user' ? '<span style="color:#34d399">You</span>' : '<span style="color:#6ee7b7">Agent</span>';
        var text = t.content.length > 200 ? t.content.slice(0, 200) + '...' : t.content;
        return '<div style="background:#1a1a1a;border-radius:6px;padding:8px;margin-bottom:4px">' +
          '<div class="text-xs" style="margin-bottom:2px">' + role + '</div>' +
          '<div class="text-xs text-gray-400">' + escapeHtml(text) + '</div></div>';
      }).join('');
    }

    // Hive mind activity
    if (hive.entries && hive.entries.length > 0) {
      html += '<div class="text-xs text-gray-400 font-semibold mt-3 mb-2 uppercase">Hive Mind activity</div>';
      html += hive.entries.map(function(e) {
        var time = new Date(e.created_at * 1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        return '<div style="background:#1a1a1a;border-radius:6px;padding:8px;margin-bottom:4px">' +
          '<span class="text-xs text-gray-500">' + time + '</span> ' +
          '<span class="text-xs text-gray-400">' + escapeHtml(e.summary) + '</span></div>';
      }).join('');
    }

    // Scheduled tasks
    if (tasks.tasks && tasks.tasks.length > 0) {
      html += '<div class="text-xs text-gray-400 font-semibold mt-3 mb-2 uppercase">Scheduled tasks (' + tasks.tasks.length + ')</div>';
      html += tasks.tasks.slice(0, 5).map(function(t) {
        return '<div style="background:#1a1a1a;border-radius:6px;padding:8px;margin-bottom:4px">' +
          '<div class="text-xs text-gray-300">' + escapeHtml(t.prompt.slice(0, 100)) + '</div>' +
          '<div class="text-xs text-gray-600 mt-1">' + t.schedule + '</div></div>';
      }).join('');
    }

    // Agent management controls (not for main)
    if (agentId !== 'main') {
      html += '<div class="flex gap-2 mt-4 pt-3" style="border-top:1px solid #2a2a2a">';
      if (agent && agent.running) {
        html += '<button data-agent="' + agentId + '" data-act="stop" onclick="agentModalAction(this.dataset.agent,this.dataset.act)" style="flex:1;background:#1a1a1a;color:#f87171;border:1px solid #7f1d1d;border-radius:8px;padding:8px;font-size:12px;font-weight:600;cursor:pointer">Stop</button>';
      } else {
        html += '<button data-agent="' + agentId + '" data-act="start" onclick="agentModalAction(this.dataset.agent,this.dataset.act)" style="flex:1;background:#064e3b;color:#6ee7b7;border:1px solid #065f46;border-radius:8px;padding:8px;font-size:12px;font-weight:600;cursor:pointer">Start</button>';
      }
      html += '<button data-agent="' + agentId + '" data-act="delete" onclick="agentModalAction(this.dataset.agent,this.dataset.act)" style="background:#1a1a1a;color:#6b7280;border:1px solid #2a2a2a;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer">Delete</button>';
      html += '</div>';
      html += '<div id="agent-action-status" class="text-xs text-center mt-2" style="min-height:16px"></div>';
    }

    if (!html) html = '<div class="text-gray-500 text-sm text-center py-8">No activity yet for this agent.</div>';
    body.innerHTML = html;
  } catch(e) { body.innerHTML = '<div class="text-red-400 text-sm text-center py-8">Failed to load agent details</div>'; }
}

async function agentModalAction(agentId, action) {
  var status = document.getElementById('agent-action-status');
  if (!status) return;

  if (action === 'delete') {
    if (!confirm('Delete agent "' + agentId + '"? This removes all config, the service, and the bot token from .env.')) return;
    status.innerHTML = '<span style="color:#fbbf24">Deleting...</span>';
    try {
      var res = await fetch(BASE + '/api/agents/' + agentId + '/full', { method: 'DELETE' });
      var data = await res.json();
      if (data.ok) {
        status.innerHTML = '<span style="color:#6ee7b7">Deleted</span>';
        setTimeout(function() { closeAgentModal(); loadAgents(); loadMissionControl(); }, 800);
      } else {
        status.innerHTML = '<span style="color:#f87171">' + escapeHtml(data.error || 'Delete failed') + '</span>';
      }
    } catch(e) { status.innerHTML = '<span style="color:#f87171">Network error</span>'; }
    return;
  }

  if (action === 'stop') {
    status.innerHTML = '<span style="color:#fbbf24">Stopping...</span>';
    try {
      await fetch(BASE + '/api/agents/' + agentId + '/deactivate', { method: 'POST' });
      status.innerHTML = '<span style="color:#6ee7b7">Stopped</span>';
      setTimeout(function() { closeAgentModal(); loadAgents(); }, 800);
    } catch(e) { status.innerHTML = '<span style="color:#f87171">Failed</span>'; }
    return;
  }

  if (action === 'start') {
    status.innerHTML = '<span style="color:#fbbf24">Starting...</span>';
    try {
      var res = await fetch(BASE + '/api/agents/' + agentId + '/activate', { method: 'POST' });
      var data = await res.json();
      if (data.ok) {
        status.innerHTML = '<span style="color:#6ee7b7">Started' + (data.pid ? ' (PID ' + data.pid + ')' : '') + '</span>';
        setTimeout(function() { closeAgentModal(); loadAgents(); }, 800);
      } else {
        status.innerHTML = '<span style="color:#f87171">' + escapeHtml(data.error || 'Start failed') + '</span>';
      }
    } catch(e) { status.innerHTML = '<span style="color:#f87171">Network error</span>'; }
  }
}

function closeAgentModal() {
  var overlay = document.getElementById('agent-modal-overlay');
  var modal = document.getElementById('agent-modal');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  modal.style.opacity = '0';
  modal.style.pointerEvents = 'none';
  modal.style.transform = 'translate(-50%,-50%) scale(0.95)';
}
document.getElementById('agent-modal-overlay').addEventListener('click', closeAgentModal);

// ── Create Agent Wizard ──────────────────────────────────────────────

let cawStep = 1;
let cawIdValid = false;
let cawTokenValid = false;
let cawBotInfo = null;
let cawCreatedId = null;
let cawIdDebounce = null;
let cawTokenDebounce = null;
let cawNameManuallyEdited = false;

function openCreateAgentWizard() {
  cawStep = 1;
  cawIdValid = false;
  cawTokenValid = false;
  cawBotInfo = null;
  cawCreatedId = null;
  cawNameManuallyEdited = false;
  document.getElementById('caw-id').value = '';
  document.getElementById('caw-name').value = '';
  document.getElementById('caw-desc').value = '';
  document.getElementById('caw-model').value = 'claude-sonnet-4-6';
  document.getElementById('caw-token').value = '';
  document.getElementById('caw-id-status').innerHTML = '';
  document.getElementById('caw-token-status').innerHTML = '';
  document.getElementById('caw-token-info').innerHTML = '';
  document.getElementById('caw-step1-error').style.display = 'none';
  document.getElementById('caw-step2-error').style.display = 'none';
  cawShowStep(1);
  loadCawTemplates();
  var o = document.getElementById('create-agent-overlay');
  var m = document.getElementById('create-agent-modal');
  o.style.opacity = '1'; o.style.pointerEvents = 'auto';
  m.style.opacity = '1'; m.style.pointerEvents = 'auto';
  m.style.transform = 'translate(-50%,-50%) scale(1)';
  setTimeout(function() { document.getElementById('caw-id').focus(); }, 200);
}

function closeCreateAgentWizard() {
  var o = document.getElementById('create-agent-overlay');
  var m = document.getElementById('create-agent-modal');
  o.style.opacity = '0'; o.style.pointerEvents = 'none';
  m.style.opacity = '0'; m.style.pointerEvents = 'none';
  m.style.transform = 'translate(-50%,-50%) scale(0.95)';
}
document.getElementById('create-agent-overlay').addEventListener('click', closeCreateAgentWizard);

function cawShowStep(n) {
  cawStep = n;
  document.getElementById('caw-step-1').style.display = n === 1 ? '' : 'none';
  document.getElementById('caw-step-2').style.display = n === 2 ? '' : 'none';
  document.getElementById('caw-step-3').style.display = n === 3 ? '' : 'none';
  for (var i = 1; i <= 3; i++) {
    document.getElementById('caw-step-' + i + '-dot').style.background = i <= n ? '#014421' : '#2a2a2a';
  }
  var titles = { 1: 'New Agent', 2: 'Connect Telegram', 3: 'Agent Created' };
  document.getElementById('create-agent-title').textContent = titles[n] || 'New Agent';
}

async function loadCawTemplates() {
  try {
    var data = await api('/api/agents/templates');
    var sel = document.getElementById('caw-template');
    sel.innerHTML = '';
    (data.templates || []).forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name + (t.id === '_template' ? '' : ' - ' + t.description.slice(0, 40));
      sel.appendChild(opt);
    });
  } catch(e) { console.error('Templates load error:', e); }
}

function cawIdChanged() {
  var id = document.getElementById('caw-id').value.trim().toLowerCase();
  document.getElementById('caw-id').value = id;
  var status = document.getElementById('caw-id-status');
  cawIdValid = false;

  if (!id) { status.innerHTML = ''; return; }

  // Auto-fill name from ID unless user has manually typed a name
  if (!cawNameManuallyEdited) {
    var nameInput = document.getElementById('caw-name');
    nameInput.value = id.replace(/[-_]/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
  }

  clearTimeout(cawIdDebounce);
  status.innerHTML = '<span style="color:#6b7280">Checking...</span>';
  cawIdDebounce = setTimeout(async function() {
    try {
      var data = await api('/api/agents/validate-id?id=' + encodeURIComponent(id));
      if (data.ok) {
        cawIdValid = true;
        status.innerHTML = '<span style="color:#6ee7b7">Available</span>';
      } else {
        status.innerHTML = '<span style="color:#f87171">' + escapeHtml(data.error) + '</span>';
      }
    } catch(e) {
      status.innerHTML = '<span style="color:#f87171">Validation error</span>';
    }
  }, 400);
}

function cawGoStep1() { cawShowStep(1); }

function cawGoStep2() {
  var id = document.getElementById('caw-id').value.trim();
  var name = document.getElementById('caw-name').value.trim();
  var desc = document.getElementById('caw-desc').value.trim();
  var errEl = document.getElementById('caw-step1-error');

  if (!id) { errEl.textContent = 'Agent ID is required'; errEl.style.display = ''; return; }
  if (!cawIdValid) { errEl.textContent = 'Agent ID is not valid or already taken'; errEl.style.display = ''; return; }
  if (!name) { errEl.textContent = 'Display name is required'; errEl.style.display = ''; return; }
  if (!desc) { errEl.textContent = 'Description is required'; errEl.style.display = ''; return; }

  errEl.style.display = 'none';

  // Set suggested bot names
  var label = id.replace(/[-_]/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
  document.getElementById('caw-suggested-name').textContent = 'RawClaw ' + label;
  document.getElementById('caw-suggested-username').textContent = 'rawclaw_' + id.replace(/-/g, '_') + '_bot';

  // Reset token state
  cawTokenValid = false;
  cawBotInfo = null;
  document.getElementById('caw-token').value = '';
  document.getElementById('caw-token-status').innerHTML = '';
  document.getElementById('caw-token-info').innerHTML = '';
  var btn = document.getElementById('caw-create-btn');
  btn.style.opacity = '0.5';
  btn.style.pointerEvents = 'none';

  cawShowStep(2);
  setTimeout(function() { document.getElementById('caw-token').focus(); }, 200);
}

function cawTokenChanged() {
  var token = document.getElementById('caw-token').value.trim();
  var status = document.getElementById('caw-token-status');
  var info = document.getElementById('caw-token-info');
  var btn = document.getElementById('caw-create-btn');
  cawTokenValid = false;
  cawBotInfo = null;
  btn.style.opacity = '0.5';
  btn.style.pointerEvents = 'none';

  if (!token || !token.includes(':')) {
    status.innerHTML = '';
    info.innerHTML = '';
    return;
  }

  clearTimeout(cawTokenDebounce);
  status.innerHTML = '<span style="color:#fbbf24">...</span>';
  info.innerHTML = '';

  cawTokenDebounce = setTimeout(async function() {
    try {
      var data = await fetch(BASE + '/api/agents/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token }),
      }).then(function(r) { return r.json(); });

      if (data.ok && data.botInfo) {
        cawTokenValid = true;
        cawBotInfo = data.botInfo;
        status.innerHTML = '<span style="color:#6ee7b7">&#10003;</span>';
        info.innerHTML = '<span style="color:#6ee7b7">Verified: @' + escapeHtml(data.botInfo.username) + '</span>';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } else {
        status.innerHTML = '<span style="color:#f87171">&#10007;</span>';
        info.innerHTML = '<span style="color:#f87171">' + escapeHtml(data.error || 'Invalid token') + '</span>';
      }
    } catch(e) {
      status.innerHTML = '<span style="color:#f87171">!</span>';
      info.innerHTML = '<span style="color:#f87171">Could not validate</span>';
    }
  }, 600);
}

async function cawCreate() {
  if (!cawTokenValid) return;

  var btn = document.getElementById('caw-create-btn');
  var errEl = document.getElementById('caw-step2-error');
  btn.textContent = 'Creating...';
  btn.style.pointerEvents = 'none';
  errEl.style.display = 'none';

  try {
    var res = await fetch(BASE + '/api/agents/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: document.getElementById('caw-id').value.trim(),
        name: document.getElementById('caw-name').value.trim(),
        description: document.getElementById('caw-desc').value.trim(),
        model: document.getElementById('caw-model').value,
        template: document.getElementById('caw-template').value,
        botToken: document.getElementById('caw-token').value.trim(),
      }),
    });
    var data = await res.json();
    if (!res.ok || data.error) {
      errEl.textContent = data.error || 'Failed to create agent';
      errEl.style.display = '';
      btn.textContent = 'Create Agent';
      btn.style.pointerEvents = 'auto';
      return;
    }

    cawCreatedId = data.agentId;

    // Build summary
    var summary = '<div style="margin-bottom:6px"><span style="color:#6b7280">Agent ID:</span> <span class="text-white">' + escapeHtml(data.agentId) + '</span></div>' +
      '<div style="margin-bottom:6px"><span style="color:#6b7280">Bot:</span> <span style="color:#6ee7b7">@' + escapeHtml(data.botInfo.username) + '</span></div>' +
      '<div style="margin-bottom:6px"><span style="color:#6b7280">Directory:</span> <span style="color:#9ca3af;font-size:11px">' + escapeHtml(data.agentDir) + '</span></div>' +
      '<div><span style="color:#6b7280">Token stored as:</span> <span style="color:#9ca3af">' + escapeHtml(data.envKey) + '</span></div>';
    document.getElementById('caw-summary').innerHTML = summary;

    // Reset activate section
    var actBtn = document.getElementById('caw-activate-btn');
    actBtn.textContent = 'Activate (install service + start)';
    actBtn.style.opacity = '1';
    actBtn.style.pointerEvents = 'auto';
    actBtn.style.background = '#064e3b';
    actBtn.style.color = '#6ee7b7';
    actBtn.style.borderColor = '#065f46';
    document.getElementById('caw-activate-status').innerHTML = '';

    cawShowStep(3);
  } catch(e) {
    errEl.textContent = 'Network error';
    errEl.style.display = '';
    btn.textContent = 'Create Agent';
    btn.style.pointerEvents = 'auto';
  }
}

async function cawActivate() {
  if (!cawCreatedId) return;
  var btn = document.getElementById('caw-activate-btn');
  var status = document.getElementById('caw-activate-status');
  btn.textContent = 'Starting...';
  btn.style.pointerEvents = 'none';
  status.innerHTML = '<span style="color:#fbbf24">Installing service and starting agent...</span>';

  try {
    var res = await fetch(BASE + '/api/agents/' + cawCreatedId + '/activate', { method: 'POST' });
    var data = await res.json();
    if (data.ok) {
      btn.textContent = 'Running';
      btn.style.background = '#064e3b';
      btn.style.color = '#6ee7b7';
      status.innerHTML = '<span style="color:#6ee7b7">Agent is live' + (data.pid ? ' (PID ' + data.pid + ')' : '') + '. Send it a message in Telegram!</span>';
    } else {
      btn.textContent = 'Retry Activation';
      btn.style.pointerEvents = 'auto';
      status.innerHTML = '<span style="color:#f87171">' + escapeHtml(data.error || 'Activation failed') + '</span>';
    }
  } catch(e) {
    btn.textContent = 'Retry Activation';
    btn.style.pointerEvents = 'auto';
    status.innerHTML = '<span style="color:#f87171">Network error</span>';
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    // Brief visual feedback
    var el = event.target;
    var orig = el.style.color;
    el.style.color = '#6ee7b7';
    setTimeout(function() { el.style.color = orig; }, 800);
  }).catch(function() {});
}

async function loadHiveMind() {
  try {
    const data = await api('/api/hive-mind?limit=15');
    const section = document.getElementById('hive-section');
    const container = document.getElementById('hive-container');
    if (!data.entries || data.entries.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';
    const blurState = JSON.parse(localStorage.getItem('privacyBlur_hive') || '{}');
    const allRevealed = localStorage.getItem('privacyBlur_hive_all') === 'revealed';
    const rows = data.entries.map((e, i) => {
      const time = new Date(e.created_at * 1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      const color = AGENT_COLORS[e.agent_id] || '#6b7280';
      const isBlurred = allRevealed ? false : (blurState[i] !== false);
      const blurClass = isBlurred ? 'privacy-blur' : '';
      return '<tr>' +
        '<td class="col-time">' + time + '</td>' +
        '<td class="col-agent" style="color:' + color + '">' + e.agent_id + '</td>' +
        '<td class="col-action">' + escapeHtml(e.action) + '</td>' +
        '<td><div class="col-summary ' + blurClass + '" data-section="hive" data-idx="' + i + '" onclick="toggleItemBlur(this)">' + escapeHtml(e.summary) + '</div></td>' +
      '</tr>';
    }).join('');
    container.innerHTML = '<table class="hive-table"><thead><tr><th class="col-time">Time</th><th class="col-agent">Agent</th><th class="col-action">Action</th><th>Summary</th></tr></thead><tbody>' + rows + '</tbody></table>';
  } catch {}
}

// ── Privacy Blur ──────────────────────────────────────────────────────
function toggleItemBlur(el) {
  const section = el.dataset.section;
  const idx = el.dataset.idx;
  const key = 'privacyBlur_' + section;
  const state = JSON.parse(localStorage.getItem(key) || '{}');
  const isCurrentlyBlurred = el.classList.contains('privacy-blur');
  if (isCurrentlyBlurred) {
    el.classList.remove('privacy-blur');
    state[idx] = false;
  } else {
    el.classList.add('privacy-blur');
    delete state[idx];
  }
  localStorage.setItem(key, JSON.stringify(state));
  // Clear the "all" override when individual items are toggled
  localStorage.removeItem('privacyBlur_' + section + '_all');
}

function toggleSectionBlur(section) {
  const selector = section === 'hive' ? '#hive-container .col-summary' : '#tasks-container .task-prompt';
  const items = document.querySelectorAll(selector);
  if (items.length === 0) return;
  // Check if majority are blurred to decide direction
  let blurredCount = 0;
  items.forEach(el => { if (el.classList.contains('privacy-blur')) blurredCount++; });
  const shouldReveal = blurredCount > 0;
  const key = 'privacyBlur_' + section;
  const state = {};
  items.forEach(el => {
    if (shouldReveal) {
      el.classList.remove('privacy-blur');
      state[el.dataset.idx] = false;
    } else {
      el.classList.add('privacy-blur');
    }
  });
  localStorage.setItem(key, JSON.stringify(shouldReveal ? state : {}));
  localStorage.setItem('privacyBlur_' + section + '_all', shouldReveal ? 'revealed' : 'blurred');
}

async function loadSummary() {
  try {
    const [tokens, agents, mems] = await Promise.all([
      api('/api/tokens?chatId=' + CHAT_ID),
      api('/api/agents'),
      api('/api/memories?chatId=' + CHAT_ID),
    ]);
    const bar = document.getElementById('summary-bar');
    bar.style.display = '';
    document.getElementById('sum-messages').textContent = tokens.stats.todayTurns || '0';
    const activeCount = agents.agents ? agents.agents.filter(a => a.running).length : 0;
    document.getElementById('sum-agents').textContent = activeCount + '/' + (agents.agents ? agents.agents.length : 0);
    var totalTokens = (tokens.stats.todayInput || 0) + (tokens.stats.todayOutput || 0);
    document.getElementById('sum-cost').textContent = totalTokens > 1000 ? Math.round(totalTokens / 1000) + 'k' : totalTokens.toString();
    document.getElementById('sum-memories').textContent = mems.stats.total || '0';
  } catch {}
}

// ── Mission Control ──────────────────────────────────────────────────

let missionAgentsList = [];

async function loadMissionControl() {
  try {
    const [taskData, agentData] = await Promise.all([
      api('/api/mission/tasks'),
      api('/api/agents'),
    ]);
    const tasks = taskData.tasks || [];
    missionAgentsList = agentData.agents || [];

    // Split: unassigned go to inbox, assigned go to agent columns
    const unassigned = tasks.filter(t => !t.assigned_agent && t.status === 'queued');
    // Only show completed tasks for 30 minutes, then they move to history only
    const now = Math.floor(Date.now() / 1000);
    const DONE_VISIBLE_SECS = 30 * 60;
    const assigned = tasks.filter(t => {
      if (!t.assigned_agent) return false;
      if (t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') {
        return t.completed_at && (now - t.completed_at) < DONE_VISIBLE_SECS;
      }
      return true;
    });

    // Tasks Inbox
    const inboxSection = document.getElementById('tasks-inbox-section');
    const inboxEl = document.getElementById('tasks-inbox');
    const autoAllBtn = document.getElementById('auto-assign-all-btn');
    inboxSection.style.display = '';
    autoAllBtn.style.display = unassigned.length > 0 ? '' : 'none';
    if (unassigned.length > 0) {
      inboxEl.innerHTML = unassigned.map(renderInboxCard).join('');
    } else {
      inboxEl.innerHTML = '<div class="text-xs text-gray-600 py-2">No unassigned tasks. Click + New to create one.</div>';
    }

    // Mission Control agent columns
    if (assigned.length === 0 && missionAgentsList.length <= 1) {
      document.getElementById('mission-section').style.display = 'none';
    } else {
      document.getElementById('mission-section').style.display = '';
      const board = document.getElementById('mission-board');
      const agentIds = missionAgentsList.map(a => a.id);
      const cols = {};
      agentIds.forEach(id => { cols[id] = []; });

      assigned.forEach(t => {
        if (cols[t.assigned_agent]) cols[t.assigned_agent].push(t);
      });

      let html = '';
      agentIds.forEach(id => {
        const agent = missionAgentsList.find(a => a.id === id);
        const color = AGENT_COLORS[id] || '#6b7280';
        const dot = agent && agent.running
          ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px"></span>'
          : '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;border:1px solid #555;margin-right:4px"></span>';
        const agentTasks = cols[id] || [];
        html += '<div class="flex-shrink-0" style="min-width:220px;scroll-snap-align:start;">' +
          '<div class="text-xs font-semibold mb-1 uppercase" style="color:' + color + '">' + dot + (agent ? agent.name : id) + '</div>' +
          '<div data-drop-agent="' + id + '" ondragover="missionDragOver(event)" ondragleave="missionDragLeave(event)" ondrop="missionDrop(event)" style="border:1px solid #2a2a2a;border-radius:10px;padding:8px;min-height:120px;background:#141414;transition:border-color 0.2s,background 0.2s">' +
          (agentTasks.length ? agentTasks.map(renderMissionCard).join('') : '<div class="text-xs text-gray-600 text-center py-4">No tasks</div>') +
          '</div></div>';
      });

      board.innerHTML = html;
    }
  } catch(e) {
    console.error('Mission load error:', e);
  }
}

function renderInboxCard(t) {
  const priorityDot = t.priority >= 8 ? '#ef4444' : t.priority >= 4 ? '#fbbf24' : '#6b7280';
  const timeAgo = elapsed(t.created_at);
  return '<div data-mid="' + t.id + '" draggable="true" ondragstart="missionDragStart(event)" ondragend="missionDragEnd(event)" style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:12px;min-width:200px;max-width:280px;cursor:grab;transition:opacity 0.15s">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<span class="text-sm font-semibold text-white" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(t.title) + '</span>' +
      '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + priorityDot + ';margin-left:6px;flex-shrink:0"></span>' +
    '</div>' +
    '<div class="text-xs text-gray-500 mb-2" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(t.prompt.slice(0, 60)) + '</div>' +
    '<div class="flex items-center justify-between">' +
      '<button data-mid="' + t.id + '" onclick="autoAssignOne(this.dataset.mid)" style="background:#1e1b4b;color:#a78bfa;border:1px solid #312e81;border-radius:6px;padding:2px 10px;font-size:11px;cursor:pointer">Auto-assign</button>' +
      '<div class="flex items-center gap-1">' +
        '<button data-mid="' + t.id + '" data-mact="cancel" onclick="missionAction(this.dataset.mid,this.dataset.mact)" title="Remove" style="background:none;border:none;cursor:pointer;color:#6b7280;font-size:12px">&times;</button>' +
        '<span class="text-xs text-gray-600">' + timeAgo + '</span>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function renderMissionCard(t) {
  const color = AGENT_COLORS[t.assigned_agent] || '#6b7280';
  const priorityDot = t.priority >= 8 ? '#ef4444' : t.priority >= 4 ? '#fbbf24' : '#6b7280';
  const statusMap = {
    queued: '<span class="pill pill-paused">queued</span>',
    running: '<span class="pill pill-running">running</span>',
    completed: '<span class="pill pill-active">done</span>',
    failed: '<span class="pill" style="background:#7f1d1d;color:#f87171">failed</span>',
    cancelled: '<span class="pill" style="background:#374151;color:#9ca3af">cancelled</span>',
  };
  const statusPill = statusMap[t.status] || '<span class="pill">' + t.status + '</span>';
  const agentBadge = t.status === 'queued' ? '<span class="text-xs" style="color:' + color + '">@' + t.assigned_agent + '</span>' : '';
  const timeAgo = elapsed(t.created_at);
  let durationStr = '';
  if (t.completed_at && t.started_at) {
    const dur = t.completed_at - t.started_at;
    durationStr = dur < 60 ? ' in ' + dur + 's' : ' in ' + Math.floor(dur/60) + 'm ' + (dur%60) + 's';
  }

  let resultHtml = '';
  if (t.status === 'completed' && t.result) {
    resultHtml = '<details class="mt-2"><summary class="text-xs text-gray-500 cursor-pointer">View result' + durationStr + '</summary><pre class="text-xs text-gray-400 mt-1 whitespace-pre-wrap break-words" style="max-height:200px;overflow-y:auto">' + escapeHtml(t.result.slice(0, 2000)) + (t.result.length > 2000 ? '...' : '') + '</pre></details>';
  } else if (t.status === 'failed' && t.error) {
    resultHtml = '<div class="text-xs text-red-400 mt-1">' + escapeHtml(t.error.slice(0, 200)) + '</div>';
  }

  const cancelBtn = (t.status === 'queued' || t.status === 'running')
    ? '<button data-mid="' + t.id + '" data-mact="cancel" onclick="missionAction(this.dataset.mid,this.dataset.mact)" title="Cancel" style="background:none;border:none;cursor:pointer;color:#f87171;font-size:12px;padding:1px 3px">&times;</button>'
    : '';
  const deleteBtn = (t.status === 'completed' || t.status === 'cancelled' || t.status === 'failed')
    ? '<button data-mid="' + t.id + '" data-mact="delete" onclick="missionAction(this.dataset.mid,this.dataset.mact)" title="Remove" style="background:none;border:none;cursor:pointer;color:#6b7280;font-size:12px;padding:1px 3px">&times;</button>'
    : '';

  const draggable = t.status === 'queued' ? ' draggable="true" ondragstart="missionDragStart(event)" ondragend="missionDragEnd(event)"' : '';
  const grabStyle = t.status === 'queued' ? 'cursor:grab;' : '';
  return '<div data-mid="' + t.id + '"' + draggable + ' style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:10px;margin-bottom:8px;' + grabStyle + 'transition:opacity 0.15s">' +
    '<div class="flex items-center justify-between mb-1">' +
      '<span class="text-xs font-semibold text-white" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(t.title) + '</span>' +
      '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + priorityDot + ';margin-left:6px;flex-shrink:0" title="Priority: ' + t.priority + '"></span>' +
    '</div>' +
    '<div class="flex items-center justify-between">' +
      '<div class="flex items-center gap-2">' + statusPill + agentBadge + '</div>' +
      '<div class="flex items-center gap-1">' + cancelBtn + deleteBtn + '<span class="text-xs text-gray-600">' + timeAgo + '</span></div>' +
    '</div>' +
    resultHtml +
  '</div>';
}

async function missionAction(id, action) {
  try {
    if (action === 'cancel') {
      await fetch(BASE + '/api/mission/tasks/' + id + '/cancel', { method: 'POST' });
    } else if (action === 'delete') {
      await fetch(BASE + '/api/mission/tasks/' + id + '', { method: 'DELETE' });
    }
    await loadMissionControl();
  } catch(e) { console.error('Mission action failed:', e); }
}

// ── Drag & Drop ──────────────────────────────────────────────────────

var missionDragId = null;

function missionDragStart(e) {
  missionDragId = e.currentTarget.dataset.mid;
  e.currentTarget.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}

function missionDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  missionDragId = null;
  document.querySelectorAll('[data-drop-agent]').forEach(function(el) {
    el.style.borderColor = '#2a2a2a';
    el.style.background = '#141414';
  });
}

function missionDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  var col = e.currentTarget.closest('[data-drop-agent]');
  if (col) {
    col.style.borderColor = '#014421';
    col.style.background = 'rgba(1,68,33,0.08)';
  }
}

function missionDragLeave(e) {
  var col = e.currentTarget.closest('[data-drop-agent]');
  if (col && !col.contains(e.relatedTarget)) {
    col.style.borderColor = '#2a2a2a';
    col.style.background = '#141414';
  }
}

async function missionDrop(e) {
  e.preventDefault();
  var col = e.currentTarget.closest('[data-drop-agent]');
  if (col) {
    col.style.borderColor = '#2a2a2a';
    col.style.background = '#141414';
  }
  if (!missionDragId || !col) return;
  var newAgent = col.dataset.dropAgent;
  try {
    await fetch(BASE + '/api/mission/tasks/' + missionDragId + '', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_agent: newAgent }),
    });
    await loadMissionControl();
  } catch(err) { console.error('Reassign failed:', err); }
  missionDragId = null;
}

async function autoAssignOne(id) {
  try {
    const res = await fetch(BASE + '/api/mission/tasks/' + id + '/auto-assign', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      await loadMissionControl();
    } else {
      console.error('Auto-assign failed:', data.error);
    }
  } catch(e) { console.error('Auto-assign error:', e); }
}

async function autoAssignAll() {
  var btn = document.getElementById('auto-assign-all-btn');
  btn.textContent = 'Assigning...';
  btn.disabled = true;
  try {
    const res = await fetch(BASE + '/api/mission/tasks/auto-assign-all', { method: 'POST' });
    const data = await res.json();
    await loadMissionControl();
  } catch(e) { console.error('Auto-assign all error:', e); }
  btn.textContent = 'Auto-assign All';
  btn.disabled = false;
}

function openMissionModal() {
  document.getElementById('mission-error').style.display = 'none';
  document.getElementById('mission-overlay').style.opacity = '1';
  document.getElementById('mission-overlay').style.pointerEvents = 'auto';
  var m = document.getElementById('mission-modal');
  m.style.opacity = '1';
  m.style.pointerEvents = 'auto';
  m.style.transform = 'translate(-50%,-50%) scale(1)';
  setTimeout(function() { document.getElementById('mission-title').focus(); }, 200);
}

function closeMissionModal() {
  document.getElementById('mission-overlay').style.opacity = '0';
  document.getElementById('mission-overlay').style.pointerEvents = 'none';
  var m = document.getElementById('mission-modal');
  m.style.opacity = '0';
  m.style.pointerEvents = 'none';
  m.style.transform = 'translate(-50%,-50%) scale(0.95)';
  document.getElementById('mission-title').value = '';
  document.getElementById('mission-prompt').value = '';
  document.getElementById('mission-priority').value = '5';
  document.getElementById('mission-error').style.display = 'none';
}
document.getElementById('mission-overlay').addEventListener('click', closeMissionModal);

async function createMissionTask() {
  const title = document.getElementById('mission-title').value.trim();
  const prompt = document.getElementById('mission-prompt').value.trim();
  const priority = parseInt(document.getElementById('mission-priority').value, 10);
  const errEl = document.getElementById('mission-error');

  if (!title) { errEl.textContent = 'Title is required'; errEl.style.display = ''; return; }
  if (!prompt) { errEl.textContent = 'Prompt is required'; errEl.style.display = ''; return; }

  try {
    const res = await fetch(BASE + '/api/mission/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title, prompt: prompt, priority: priority }),
    });
    if (!res.ok) {
      const data = await res.json();
      errEl.textContent = data.error || 'Failed to create task';
      errEl.style.display = '';
      return;
    }
    closeMissionModal();
    await loadMissionControl();
  } catch(e) {
    errEl.textContent = 'Network error';
    errEl.style.display = '';
  }
}

// ── Task History Drawer ──────────────────────────────────────────────

var historyOffset = 0;
var historyTotal = 0;
var HISTORY_PAGE = 20;

async function openTaskHistory() {
  historyOffset = 0;
  document.getElementById('history-body').innerHTML = '<div class="text-gray-500 text-sm text-center py-8">Loading...</div>';
  document.getElementById('history-overlay').classList.add('open');
  document.getElementById('history-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  await loadHistoryPage();
}

async function loadHistoryPage() {
  var data = await api('/api/mission/history?limit=' + HISTORY_PAGE + '&offset=' + historyOffset);
  historyTotal = data.total;
  document.getElementById('history-count').textContent = historyTotal + ' completed task' + (historyTotal === 1 ? '' : 's');
  var body = document.getElementById('history-body');
  if (historyOffset === 0) body.innerHTML = '';
  if (data.tasks.length === 0 && historyOffset === 0) {
    body.innerHTML = '<div class="text-gray-500 text-sm text-center py-8">No task history yet.</div>';
  } else {
    body.innerHTML += data.tasks.map(function(t) {
      var color = AGENT_COLORS[t.assigned_agent] || '#6b7280';
      var statusCls = t.status === 'completed' ? 'pill-active' : t.status === 'failed' ? '' : '';
      var statusStyle = t.status === 'failed' ? 'background:#7f1d1d;color:#f87171' : t.status === 'cancelled' ? 'background:#374151;color:#9ca3af' : '';
      var dur = '';
      if (t.completed_at && t.started_at) {
        var d = t.completed_at - t.started_at;
        dur = d < 60 ? d + 's' : Math.floor(d/60) + 'm ' + (d%60) + 's';
      }
      var date = new Date(t.completed_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      var time = new Date(t.completed_at * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      var resultHtml = t.result ? '<details class="mt-2"><summary class="text-xs text-gray-500 cursor-pointer">View result</summary><pre class="text-xs text-gray-400 mt-1 whitespace-pre-wrap break-words" style="max-height:200px;overflow-y:auto">' + escapeHtml(t.result.slice(0, 2000)) + '</pre></details>' : '';
      var errorHtml = t.error ? '<div class="text-xs text-red-400 mt-1">' + escapeHtml(t.error.slice(0, 200)) + '</div>' : '';
      return '<div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:12px;margin-bottom:8px">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-sm font-semibold text-white">' + escapeHtml(t.title) + '</span>' +
          '<span class="pill ' + statusCls + '" style="' + statusStyle + '">' + t.status + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-2 text-xs text-gray-500">' +
          '<span style="color:' + color + '">@' + (t.assigned_agent || 'unassigned') + '</span>' +
          '<span>' + date + ' ' + time + '</span>' +
          (dur ? '<span>' + dur + '</span>' : '') +
        '</div>' +
        resultHtml + errorHtml +
      '</div>';
    }).join('');
  }
  historyOffset += data.tasks.length;
  var btn = document.getElementById('history-load-more');
  if (historyOffset < historyTotal) btn.classList.remove('hidden');
  else btn.classList.add('hidden');
}

async function loadMoreHistory() { await loadHistoryPage(); }

function closeTaskHistory() {
  document.getElementById('history-overlay').classList.remove('open');
  document.getElementById('history-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

// Poll mission tasks more frequently (every 15s) for responsiveness
setInterval(loadMissionControl, 15000);

async function refreshAll() {
  const btn = document.getElementById('refresh-btn').querySelector('svg');
  btn.classList.add('refresh-spin');
  await Promise.all([loadInfo(), loadTasks(), loadMemories(), loadHealth(), loadTokens(), loadAgents(), loadHiveMind(), loadSummary(), loadMissionControl()]);
  btn.classList.remove('refresh-spin');
  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

// Live countdown tickers
setInterval(() => {
  document.querySelectorAll('.countdown').forEach(el => {
    const ts = parseInt(el.dataset.ts);
    if (ts) el.textContent = countdown(ts);
  });
}, 1000);

// Auto-refresh every 60s
setInterval(refreshAll, 60000);

// ── Auth gate — check session before loading dashboard ───────────────
async function loginSubmit() {
  const pw = document.getElementById('login-password').value;
  const ok = await doLogin(pw);
  if (ok) {
    document.getElementById('login-overlay').style.display = 'none';
    refreshAll();
  } else {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
  }
}

(async function initAuth() {
  const authed = await checkAuth();
  if (!authed) {
    document.getElementById('login-overlay').style.display = 'flex';
  } else {
    refreshAll();
  }
})();

// ── Main Tab Switching ──────────────────────────────────────────────
function switchMainTab(tab, btn) {
  document.getElementById('main-tab-dashboard').style.display = tab === 'dashboard' ? '' : 'none';
  document.getElementById('main-tab-database').style.display = tab === 'database' ? '' : 'none';
  document.getElementById('main-tab-supabase').style.display = tab === 'supabase' ? '' : 'none';
  document.querySelectorAll('.db-nav-tab').forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  if (tab === 'database' && !dbTablesLoaded) loadDbTables();
  if (tab === 'supabase' && !sbTablesLoaded) loadSbTables();
}

// ── Database Explorer ───────────────────────────────────────────────
let dbTablesLoaded = false;
let dbTables = [];
let dbActiveTable = '';
let dbCurrentPage = 1;
let dbTotalPages = 1;
let dbSortCol = '';
let dbSortOrder = 'asc';

async function loadDbTables() {
  try {
    const data = await api('/api/db/tables');
    dbTables = data.tables || [];
    dbTablesLoaded = true;
    const list = document.getElementById('db-table-list');
    if (dbTables.length === 0) {
      list.innerHTML = '<div style="padding:8px 14px;color:#555;font-size:12px">No tables found</div>';
      return;
    }
    list.innerHTML = dbTables.map(function(t) {
      return '<div class="db-sidebar-item" data-table="' + escapeHtml(t.name) + '" onclick="dbSelectTable(this.dataset.table)"><span>' + escapeHtml(t.name) + '</span><span class="db-sidebar-count">' + t.rowCount.toLocaleString() + '</span></div>';
    }).join('');
    // Auto-select first table
    dbSelectTable(dbTables[0].name);
  } catch (err) {
    document.getElementById('db-table-list').innerHTML = '<div style="padding:8px 14px;color:#f87171;font-size:12px">Error loading tables</div>';
  }
}

function dbSelectTable(name) {
  dbActiveTable = name;
  dbCurrentPage = 1;
  dbSortCol = '';
  dbSortOrder = 'asc';
  // Update sidebar active state
  document.querySelectorAll('.db-sidebar-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.table === name);
  });
  loadDbTableData();
}

async function loadDbTableData() {
  if (!dbActiveTable) return;
  var params = '?page=' + dbCurrentPage + '&limit=50';
  if (dbSortCol) params += '&sort=' + encodeURIComponent(dbSortCol) + '&order=' + dbSortOrder;
  try {
    const data = await api('/api/db/tables/' + encodeURIComponent(dbActiveTable) + params);
    dbTotalPages = data.pages || 1;
    dbCurrentPage = data.page || 1;
    renderDbGrid(data.columns, data.rows, true);
    // Update pagination
    var pag = document.getElementById('db-pagination');
    pag.style.display = '';
    document.getElementById('db-row-info').textContent = data.total.toLocaleString() + ' rows';
    document.getElementById('db-page-info').textContent = 'Page ' + dbCurrentPage + ' of ' + dbTotalPages;
    document.getElementById('db-prev-btn').disabled = dbCurrentPage <= 1;
    document.getElementById('db-next-btn').disabled = dbCurrentPage >= dbTotalPages;
  } catch (err) {
    document.getElementById('db-grid-body').innerHTML = '<tr><td style="padding:20px;color:#f87171">Error loading data</td></tr>';
  }
}

function renderDbGrid(columns, rows, sortable) {
  var head = document.getElementById('db-grid-head');
  var body = document.getElementById('db-grid-body');
  if (!columns || columns.length === 0) {
    head.innerHTML = '';
    body.innerHTML = '<tr><td style="padding:20px;color:#555">No data</td></tr>';
    return;
  }
  head.innerHTML = '<tr>' + columns.map(function(col) {
    var isSorted = sortable && dbSortCol === col;
    var arrow = isSorted ? (dbSortOrder === 'asc' ? '&#9650;' : '&#9660;') : '&#9650;';
    var cls = isSorted ? 'sorted' : '';
    var onclick = sortable ? ' data-col="' + escapeHtml(col) + '" onclick="dbToggleSort(this.dataset.col)"' : '';
    return '<th class="' + cls + '"' + onclick + '>' + escapeHtml(col) + '<span class="sort-arrow">' + arrow + '</span></th>';
  }).join('') + '</tr>';
  if (rows.length === 0) {
    body.innerHTML = '<tr><td colspan="' + columns.length + '" style="padding:20px;color:#555;text-align:center">Empty table</td></tr>';
    return;
  }
  body.innerHTML = rows.map(function(row) {
    return '<tr>' + columns.map(function(col) {
      var val = row[col];
      if (val === null || val === undefined) return '<td class="null-val">NULL</td>';
      var s = String(val);
      if (s.length > 200) s = s.substring(0, 200) + '...';
      return '<td title="' + escapeHtml(String(val)).replace(/"/g, '&quot;') + '">' + escapeHtml(s) + '</td>';
    }).join('') + '</tr>';
  }).join('');
}

function dbToggleSort(col) {
  if (dbSortCol === col) {
    dbSortOrder = dbSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    dbSortCol = col;
    dbSortOrder = 'asc';
  }
  dbCurrentPage = 1;
  loadDbTableData();
}

function dbPrevPage() {
  if (dbCurrentPage > 1) { dbCurrentPage--; loadDbTableData(); }
}

function dbNextPage() {
  if (dbCurrentPage < dbTotalPages) { dbCurrentPage++; loadDbTableData(); }
}

async function dbRunQuery() {
  var sql = document.getElementById('db-query-input').value.trim();
  if (!sql) return;
  var errEl = document.getElementById('db-query-error');
  var statusEl = document.getElementById('db-query-status');
  errEl.style.display = 'none';
  statusEl.textContent = 'Running...';
  try {
    var data = await api('/api/db/query?sql=' + encodeURIComponent(sql));
    if (data.error) {
      errEl.textContent = data.error;
      errEl.style.display = '';
      statusEl.textContent = '';
      return;
    }
    statusEl.textContent = data.rowCount + ' row' + (data.rowCount !== 1 ? 's' : '') + ' returned';
    document.getElementById('db-pagination').style.display = 'none';
    renderDbGrid(data.columns, data.rows, false);
  } catch (err) {
    errEl.textContent = 'Request failed';
    errEl.style.display = '';
    statusEl.textContent = '';
  }
}

// \u2500\u2500 Chat \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let chatOpen = false;
let chatSSE = null;
let chatHistoryLoaded = false;
let unreadCount = 0;
let chatAgents = [];
let activeAgentTab = 'all';

function openChat() {
  chatOpen = true;
  unreadCount = 0;
  updateFabBadge();
  document.getElementById('chat-overlay').classList.add('open');
  if (!chatHistoryLoaded) loadChatHistory();
  loadAgentTabs();
  loadSessionInfo();
  connectChatSSE();
  setTimeout(() => document.getElementById('chat-input').focus(), 350);
}

function closeChat() {
  chatOpen = false;
  document.getElementById('chat-overlay').classList.remove('open');
}

function updateFabBadge() {
  const badge = document.getElementById('chat-fab-badge');
  if (unreadCount > 0) {
    badge.style.display = 'flex';
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
  } else {
    badge.style.display = 'none';
  }
}

// Agent Tabs
async function loadAgentTabs() {
  try {
    const data = await api('/api/agents');
    chatAgents = data.agents || [];
    const container = document.getElementById('chat-agent-tabs');
    container.innerHTML = '';
    const allTab = document.createElement('button');
    allTab.className = 'chat-agent-tab' + (activeAgentTab === 'all' ? ' active' : '');
    allTab.textContent = 'All';
    allTab.onclick = function() { switchAgentTab('all', this); };
    container.appendChild(allTab);
    chatAgents.forEach(function(a) {
      const tab = document.createElement('button');
      tab.className = 'chat-agent-tab' + (activeAgentTab === a.id ? ' active' : '');
      const dot = document.createElement('span');
      dot.className = 'agent-dot ' + (a.running ? 'live' : 'dead');
      tab.appendChild(dot);
      tab.appendChild(document.createTextNode(a.id.charAt(0).toUpperCase() + a.id.slice(1)));
      tab.onclick = function() { switchAgentTab(a.id, this); };
      container.appendChild(tab);
    });
  } catch(e) { console.error('Agent tabs error', e); }
}

function switchAgentTab(agentId, el) {
  activeAgentTab = agentId;
  document.querySelectorAll('.chat-agent-tab').forEach(function(t) { t.classList.remove('active'); });
  if (el) el.classList.add('active');
  chatHistoryLoaded = false;
  loadChatHistory();
  loadSessionInfo();
}

// Session Info
async function loadSessionInfo() {
  try {
    const agentId = activeAgentTab === 'all' ? 'main' : activeAgentTab;
    const [health, tokens] = await Promise.all([
      api('/api/health?chatId=' + CHAT_ID),
      api('/api/agents/' + agentId + '/tokens'),
    ]);
    document.getElementById('sess-ctx').textContent = (health.contextPct || 0) + '%';
    document.getElementById('sess-turns').textContent = health.turns || tokens.todayTurns || '0';
    var sessTokens = (tokens.todayInput || 0) + (tokens.todayOutput || 0);
    document.getElementById('sess-cost').textContent = sessTokens > 1000 ? Math.round(sessTokens / 1000) + 'k' : sessTokens.toString();
    document.getElementById('sess-model').textContent = health.model || agentId;
  } catch(e) { console.error('Session info error', e); }
}

// Quick Actions
function sendQuickAction(cmd) {
  var input = document.getElementById('chat-input');
  input.value = cmd;
  sendChatMessage();
}

async function loadChatHistory() {
  if (!CHAT_ID) return;
  try {
    var url = '/api/chat/history?chatId=' + CHAT_ID + '&limit=40';
    if (activeAgentTab !== 'all') {
      url = '/api/agents/' + activeAgentTab + '/conversation?chatId=' + CHAT_ID + '&limit=40';
    }
    const data = await api(url);
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    if (data.turns && data.turns.length > 0) {
      // Reverse: API returns newest first, we want oldest first
      const turns = data.turns.slice().reverse();
      turns.forEach(t => appendChatBubble(t.role, t.content, t.source, false));
    }
    chatHistoryLoaded = true;
    scrollChatBottom();
  } catch(e) {
    console.error('Chat history load error', e);
  }
}

function connectChatSSE() {
  if (chatSSE) { chatSSE.close(); chatSSE = null; }
  const url = BASE + '/api/chat/stream';
  chatSSE = new EventSource(url);

  chatSSE.addEventListener('user_message', function(e) {
    const ev = JSON.parse(e.data);
    appendChatBubble('user', ev.content, ev.source, true);
    if (!chatOpen) { unreadCount++; updateFabBadge(); }
  });

  chatSSE.addEventListener('assistant_message', function(e) {
    const ev = JSON.parse(e.data);
    appendChatBubble('assistant', ev.content, ev.source, true);
    hideTyping();
    if (!chatOpen) { unreadCount++; updateFabBadge(); }
    if (chatOpen) loadSessionInfo();
  });

  chatSSE.addEventListener('processing', function(e) {
    const ev = JSON.parse(e.data);
    if (ev.processing) showTyping(); else hideTyping();
  });

  chatSSE.addEventListener('progress', function(e) {
    const ev = JSON.parse(e.data);
    showProgress(ev.description);
  });

  chatSSE.addEventListener('error', function(e) {
    // SSE error event
    try {
      const ev = JSON.parse(e.data);
      appendChatBubble('assistant', ev.content || 'Error', 'system', true);
    } catch {}
    hideTyping();
  });

  chatSSE.addEventListener('ping', function() { /* keepalive */ });

  chatSSE.onerror = function() {
    // Auto-reconnect handled by EventSource
    updateChatStatus(false);
    setTimeout(() => updateChatStatus(true), 3000);
  };

  chatSSE.onopen = function() { updateChatStatus(true); };
}

function updateChatStatus(connected) {
  const dot = document.getElementById('chat-status-dot');
  dot.style.background = connected ? '#22c55e' : '#ef4444';
}

function appendChatBubble(role, content, source, scroll) {
  const container = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant');
  bubble.innerHTML = role === 'assistant' ? renderMarkdown(content) : escapeHtml(content);
  if (source && source !== 'telegram' && source !== 'dashboard') {
    const srcBadge = document.createElement('div');
    srcBadge.className = 'chat-bubble-source';
    srcBadge.textContent = source.charAt(0).toUpperCase() + source.slice(1);
    bubble.appendChild(srcBadge);
  }
  container.appendChild(bubble);
  if (scroll) scrollChatBottom();
}

function showTyping() {
  const bar = document.getElementById('chat-progress-bar');
  const label = document.getElementById('chat-progress-label');
  if (bar) { bar.classList.add('active'); }
  if (label) { label.textContent = 'Thinking...'; }
  scrollChatBottom();
}

function hideTyping() {
  const bar = document.getElementById('chat-progress-bar');
  if (bar) { bar.classList.remove('active'); }
}

function showProgress(desc) {
  const bar = document.getElementById('chat-progress-bar');
  const label = document.getElementById('chat-progress-label');
  if (bar) { bar.classList.add('active'); }
  if (label) { label.textContent = desc; }
  scrollChatBottom();
}

function scrollChatBottom() {
  const container = document.getElementById('chat-messages');
  setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

function renderMarkdown(text) {
  if (!text) return '';
  var preserved = [];
  function preserve(html) { preserved.push(html); return '%%BLOCK' + (preserved.length - 1) + '%%'; }

  var s = text;

  // Code blocks: ` + '```' + `...` + '```' + `
  s = s.replace(/` + '`' + '`' + '`' + `(?:\\w*\\n)?([\\s\\S]*?)` + '`' + '`' + '`' + `/g, function(_, code) {
    return preserve('<pre><code>' + escapeHtml(code.trim()) + '<\\/code><\\/pre>');
  });

  // Tables: consecutive lines starting and ending with |
  var lines = s.split('\\n');
  var result = [];
  var tableLines = [];

  function flushTable() {
    if (tableLines.length < 2) {
      result.push.apply(result, tableLines);
      tableLines = [];
      return;
    }
    var html = '<table>';
    var headerDone = false;
    tableLines.forEach(function(row) {
      var trimmed = row.trim();
      if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) { result.push(row); return; }
      // Skip separator rows
      if (/^[\\|\\s\\-:]+$/.test(trimmed)) { headerDone = true; return; }
      var cells = trimmed.split('|').slice(1, -1);
      var tag = !headerDone ? 'th' : 'td';
      html += '<tr>';
      cells.forEach(function(c) { html += '<' + tag + '>' + escapeHtml(c.trim()) + '<\\/' + tag + '>'; });
      html += '<\\/tr>';
      if (!headerDone) headerDone = true;
    });
    html += '<\\/table>';
    result.push(preserve(html));
    tableLines = [];
  }

  lines.forEach(function(line) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      tableLines.push(line);
    } else {
      if (tableLines.length > 0) flushTable();
      result.push(line);
    }
  });
  if (tableLines.length > 0) flushTable();

  s = result.join('\\n');

  // Inline code (preserve before escaping)
  var codeBlocks = [];
  s = s.replace(/` + '`' + `([^` + '`' + `]+?)` + '`' + `/g, function(_, code) {
    codeBlocks.push('<code>' + escapeHtml(code) + '<\\/code>');
    return '%%CODE' + (codeBlocks.length - 1) + '%%';
  });
  // Bold (preserve before escaping)
  var bolds = [];
  s = s.replace(/\\*\\*([^*]+)\\*\\*/g, function(_, t) {
    bolds.push('<b>' + escapeHtml(t) + '<\\/b>');
    return '%%BOLD' + (bolds.length - 1) + '%%';
  });
  // Italic
  var italics = [];
  s = s.replace(/\\*([^*]+)\\*/g, function(_, t) {
    italics.push('<i>' + escapeHtml(t) + '<\\/i>');
    return '%%ITAL' + (italics.length - 1) + '%%';
  });
  // Escape remaining HTML
  s = escapeHtml(s);
  // Restore formatting
  s = s.replace(/%%CODE(\\d+)%%/g, function(_, i) { return codeBlocks[parseInt(i)]; });
  s = s.replace(/%%BOLD(\\d+)%%/g, function(_, i) { return bolds[parseInt(i)]; });
  s = s.replace(/%%ITAL(\\d+)%%/g, function(_, i) { return italics[parseInt(i)]; });
  // Line breaks
  s = s.replace(/\\n/g, '<br>');
  // Restore preserved blocks
  s = s.replace(/%%BLOCK(\\d+)%%/g, function(_, i) { return preserved[parseInt(i)]; });
  return s;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  autoResizeInput();
  // Disable send while processing
  document.getElementById('chat-send-btn').disabled = true;
  try {
    await fetch(BASE + '/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
  } catch(e) {
    console.error('Send error', e);
  }
  // Re-enable after a short delay (SSE will deliver the actual messages)
  setTimeout(() => { document.getElementById('chat-send-btn').disabled = false; }, 1000);
}

function autoResizeInput() {
  const el = document.getElementById('chat-input');
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function abortProcessing() {
  try {
    await fetch(BASE + '/api/chat/abort', { method: 'POST' });
  } catch(e) { console.error('Abort error', e); }
}

// ── Supabase Explorer ───────────────────────────────────────────────
var sbTablesLoaded = false;
var sbCurrentTable = '';
var sbCurrentPage = 1;
var sbTotalPages = 1;
var sbCurrentSort = '';
var sbCurrentOrder = 'asc';
var sbCurrentColumns = [];
var sbTableRowCounts = {};
var sbAddFormVisible = false;

async function loadSbTables() {
  try {
    var data = await api('/api/supabase/tables');
    if (data.error) {
      document.getElementById('sb-table-list').innerHTML = '<div style="padding:8px 14px;color:#f87171;font-size:12px">' + data.error + '</div>';
      return;
    }
    var tables = data.tables || [];
    // Fetch row counts in the background for each table
    tables.forEach(function(t) {
      api('/api/supabase/tables/' + encodeURIComponent(t.name) + '?page=1&limit=1').then(function(d) {
        if (d && typeof d.rowCount === 'number') {
          sbTableRowCounts[t.name] = d.rowCount;
          var badge = document.getElementById('sb-count-' + t.name.replace(/[^a-zA-Z0-9_]/g, '_'));
          if (badge) badge.textContent = d.rowCount;
        }
      }).catch(function(){});
    });
    var html = '';
    tables.forEach(function(t) {
      var safeId = t.name.replace(/[^a-zA-Z0-9_]/g, '_');
      html += '<div class="db-sidebar-item' + (t.name === sbCurrentTable ? ' active' : '') + '" onclick="loadSbTable(\\''+t.name+'\\')"><span>'+t.name+'</span><span class="sb-row-count" id="sb-count-'+safeId+'">&middot;</span></div>';
    });
    document.getElementById('sb-table-list').innerHTML = html || '<div style="padding:8px 14px;color:#555;font-size:12px">No tables found</div>';
    sbTablesLoaded = true;
  } catch(e) {
    document.getElementById('sb-table-list').innerHTML = '<div style="padding:8px 14px;color:#f87171;font-size:12px">Failed to connect to Supabase</div>';
  }
}

async function loadSbTable(name, page, sort, order) {
  sbCurrentTable = name;
  sbCurrentPage = page || 1;
  if (sort !== undefined) sbCurrentSort = sort;
  if (order !== undefined) sbCurrentOrder = order;

  // Highlight active table in sidebar
  document.querySelectorAll('#sb-sidebar .db-sidebar-item').forEach(function(el) {
    var elName = el.querySelector('span') ? el.querySelector('span').textContent.trim() : el.textContent.trim();
    el.classList.toggle('active', elName === name);
  });

  var qs = 'page=' + sbCurrentPage + '&limit=50';
  if (sbCurrentSort) qs += '&sort=' + sbCurrentSort + '&order=' + sbCurrentOrder;

  try {
    var data = await api('/api/supabase/tables/' + encodeURIComponent(name) + '?' + qs);
    if (data.error) {
      document.getElementById('sb-grid-body').innerHTML = '<tr><td style="padding:20px;color:#f87171">' + data.error + '</td></tr>';
      return;
    }

    // Store columns for add-row form
    var cols = data.columns || [];
    sbCurrentColumns = cols;

    // Render header
    var headHtml = '<tr>';
    cols.forEach(function(col) {
      var arrow = col === sbCurrentSort ? (sbCurrentOrder === 'asc' ? ' \\u2191' : ' \\u2193') : '';
      var sorted = col === sbCurrentSort ? ' sorted' : '';
      headHtml += '<th class="' + sorted + '" onclick="loadSbTable(\\''+name+'\\',1,\\''+col+'\\',\\''+(col===sbCurrentSort&&sbCurrentOrder==='asc'?'desc':'asc')+'\\')">'+col+'<span class="sort-arrow">'+arrow+'</span></th>';
    });
    headHtml += '</tr>';
    document.getElementById('sb-grid-head').innerHTML = headHtml;

    // Render rows with clickable cells
    var rows = data.rows || [];
    var bodyHtml = '';
    if (rows.length === 0) {
      bodyHtml = '<tr><td colspan="' + Math.max(cols.length, 1) + '" style="padding:20px;color:#555">No rows</td></tr>';
    } else {
      rows.forEach(function(row, rowIdx) {
        bodyHtml += '<tr>';
        cols.forEach(function(col) {
          var val = row[col];
          if (val === null || val === undefined) {
            bodyHtml += '<td class="null-val sb-clickable" onclick="sbShowCellDetail(\\''+col.replace(/'/g,"\\\\'")+'\\',' + rowIdx + ')">null</td>';
          } else if (typeof val === 'object') {
            var json = JSON.stringify(val);
            bodyHtml += '<td class="sb-clickable" onclick="sbShowCellDetail(\\''+col.replace(/'/g,"\\\\'")+'\\',' + rowIdx + ')">' + escHtml(json.substring(0, 200)) + (json.length > 200 ? '...' : '') + '</td>';
          } else {
            var s = String(val);
            var needsTrunc = s.length > 100;
            bodyHtml += '<td class="sb-clickable" title="' + escHtml(s) + '" onclick="sbShowCellDetail(\\''+col.replace(/'/g,"\\\\'")+'\\',' + rowIdx + ')">' + escHtml(needsTrunc ? s.substring(0, 100) + '...' : s) + '</td>';
          }
        });
        bodyHtml += '</tr>';
      });
    }
    document.getElementById('sb-grid-body').innerHTML = bodyHtml;

    // Store rows for cell detail drill-down
    window._sbRows = rows;

    // Show insert areas
    document.getElementById('sb-insert-area').style.display = '';
    document.getElementById('sb-json-area').style.display = '';

    // Update row count badge in sidebar
    if (typeof data.rowCount === 'number') {
      sbTableRowCounts[name] = data.rowCount;
      var safeId = name.replace(/[^a-zA-Z0-9_]/g, '_');
      var badge = document.getElementById('sb-count-' + safeId);
      if (badge) badge.textContent = data.rowCount;
    }

    // Pagination
    sbTotalPages = data.totalPages || 1;
    var pag = document.getElementById('sb-pagination');
    if (data.rowCount > 0) {
      pag.style.display = '';
      document.getElementById('sb-row-info').textContent = data.rowCount + ' rows';
      document.getElementById('sb-page-info').textContent = 'Page ' + sbCurrentPage + ' / ' + sbTotalPages;
      document.getElementById('sb-prev-btn').disabled = sbCurrentPage <= 1;
      document.getElementById('sb-next-btn').disabled = sbCurrentPage >= sbTotalPages;
    } else {
      pag.style.display = 'none';
    }
  } catch(e) {
    document.getElementById('sb-grid-body').innerHTML = '<tr><td style="padding:20px;color:#f87171">Error: ' + e.message + '</td></tr>';
  }
}

function sbPrevPage() { if (sbCurrentPage > 1) loadSbTable(sbCurrentTable, sbCurrentPage - 1); }
function sbNextPage() { if (sbCurrentPage < sbTotalPages) loadSbTable(sbCurrentTable, sbCurrentPage + 1); }

// Escape HTML for safe rendering
function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// Show full cell content in the drawer
function sbShowCellDetail(col, rowIdx) {
  var row = (window._sbRows || [])[rowIdx];
  if (!row) return;
  var val = row[col];
  var display = '';
  if (val === null || val === undefined) {
    display = '<span style="color:#6b7280;font-style:italic">null</span>';
  } else if (typeof val === 'object') {
    display = '<pre style="white-space:pre-wrap;word-break:break-all;font-size:12px;color:#e0e0e0;font-family:monospace;margin:0">' + escHtml(JSON.stringify(val, null, 2)) + '</pre>';
  } else {
    display = '<pre style="white-space:pre-wrap;word-break:break-all;font-size:13px;color:#e0e0e0;margin:0">' + escHtml(String(val)) + '</pre>';
  }
  document.getElementById('drawer-title').textContent = sbCurrentTable + '.' + col;
  document.getElementById('drawer-count').textContent = 'Row ' + (rowIdx + 1);
  document.getElementById('drawer-avg-salience').textContent = typeof val === 'string' ? val.length + ' chars' : typeof val;
  document.getElementById('drawer-body').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="font-size:11px;color:#6b7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Full Value</div>' +
    display +
    '</div>' +
    '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-subtle)">' +
    '<div style="font-size:11px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">All Columns in This Row</div>' +
    sbCurrentColumns.map(function(c) {
      var v = row[c];
      var preview = v === null || v === undefined ? 'null' : typeof v === 'object' ? JSON.stringify(v).substring(0,120) : String(v).substring(0,120);
      return '<div style="margin-bottom:6px"><span style="color:#3b82f6;font-size:11px;font-weight:600">' + escHtml(c) + '</span><br><span style="color:#9ca3af;font-size:12px">' + escHtml(preview) + '</span></div>';
    }).join('') +
    '</div>';
  document.getElementById('drawer-load-more').classList.add('hidden');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// Toggle add-row form
function sbToggleAddForm() {
  sbAddFormVisible = !sbAddFormVisible;
  var form = document.getElementById('sb-add-form');
  form.style.display = sbAddFormVisible ? '' : 'none';
  if (sbAddFormVisible) {
    sbBuildAddForm();
  }
}

// Build form fields from current table columns
function sbBuildAddForm() {
  var container = document.getElementById('sb-form-fields');
  if (!sbCurrentColumns.length) {
    container.innerHTML = '<div style="color:#6b7280;font-size:12px;grid-column:1/-1">Load a table first</div>';
    return;
  }
  var html = '';
  sbCurrentColumns.forEach(function(col) {
    html += '<div class="sb-form-field"><label>' + escHtml(col) + '</label><input type="text" id="sb-field-' + col.replace(/[^a-zA-Z0-9_]/g, '_') + '" placeholder="' + escHtml(col) + '"></div>';
  });
  container.innerHTML = html;
}

// Insert row from the form fields
async function sbInsertRow() {
  if (!sbCurrentTable || !sbCurrentColumns.length) return;
  var row = {};
  var hasValue = false;
  sbCurrentColumns.forEach(function(col) {
    var input = document.getElementById('sb-field-' + col.replace(/[^a-zA-Z0-9_]/g, '_'));
    if (input && input.value.trim() !== '') {
      var v = input.value.trim();
      // Try to parse numbers and booleans
      if (v === 'true') v = true;
      else if (v === 'false') v = false;
      else if (v === 'null') v = null;
      else if (!isNaN(v) && v !== '') v = Number(v);
      row[col] = v;
      hasValue = true;
    }
  });
  if (!hasValue) {
    document.getElementById('sb-insert-status').innerHTML = '<span style="color:#fbbf24">Fill at least one field</span>';
    return;
  }
  document.getElementById('sb-submit-row-btn').disabled = true;
  document.getElementById('sb-insert-status').innerHTML = '<span style="color:#6b7280">Inserting...</span>';
  try {
    var resp = await fetch(BASE + '/api/supabase/tables/' + encodeURIComponent(sbCurrentTable) + '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    var data = await resp.json();
    if (data.error) {
      document.getElementById('sb-insert-status').innerHTML = '<span style="color:#f87171">' + escHtml(data.error) + '</span>';
    } else {
      document.getElementById('sb-insert-status').innerHTML = '<span style="color:#34d399">Row inserted</span>';
      sbToggleAddForm();
      loadSbTable(sbCurrentTable, sbCurrentPage);
    }
  } catch(e) {
    document.getElementById('sb-insert-status').innerHTML = '<span style="color:#f87171">' + escHtml(e.message) + '</span>';
  }
  document.getElementById('sb-submit-row-btn').disabled = false;
}

// Insert row from raw JSON textarea
async function sbInsertJson() {
  if (!sbCurrentTable) {
    document.getElementById('sb-json-error').style.display = '';
    document.getElementById('sb-json-error').textContent = 'Select a table first';
    return;
  }
  var raw = document.getElementById('sb-json-input').value.trim();
  if (!raw) return;
  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch(e) {
    document.getElementById('sb-json-error').style.display = '';
    document.getElementById('sb-json-error').textContent = 'Invalid JSON: ' + e.message;
    return;
  }
  document.getElementById('sb-json-error').style.display = 'none';
  document.getElementById('sb-json-status').textContent = 'Inserting...';
  try {
    var resp = await fetch(BASE + '/api/supabase/tables/' + encodeURIComponent(sbCurrentTable) + '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    });
    var data = await resp.json();
    if (data.error) {
      document.getElementById('sb-json-error').style.display = '';
      document.getElementById('sb-json-error').textContent = data.error;
      document.getElementById('sb-json-status').textContent = '';
    } else {
      document.getElementById('sb-json-status').innerHTML = '<span style="color:#34d399">Row inserted</span>';
      document.getElementById('sb-json-input').value = '';
      loadSbTable(sbCurrentTable, sbCurrentPage);
      setTimeout(function() { document.getElementById('sb-json-status').textContent = ''; }, 3000);
    }
  } catch(e) {
    document.getElementById('sb-json-error').style.display = '';
    document.getElementById('sb-json-error').textContent = e.message;
    document.getElementById('sb-json-status').textContent = '';
  }
}
</script>

<!-- Chat FAB -->
<button class="chat-fab" id="chat-fab" onclick="openChat()">
  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
  <span class="chat-fab-badge" id="chat-fab-badge"></span>
</button>

<!-- Chat slide-over panel -->
<div class="chat-overlay" id="chat-overlay">
  <div class="chat-header">
    <div class="chat-header-left">
      <span class="chat-header-title">Chat</span>
      <span class="chat-status-dot" id="chat-status-dot" style="background:#6b7280"></span>
    </div>
    <button onclick="closeChat()" class="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
  </div>
  <div class="chat-agent-tabs" id="chat-agent-tabs"></div>
  <div class="chat-session-bar" id="chat-session-bar">
    <span class="session-stat"><span class="session-stat-val" id="sess-ctx">-</span> ctx</span>
    <span class="session-stat"><span class="session-stat-val" id="sess-turns">-</span> turns</span>
    <span class="session-stat"><span class="session-stat-val" id="sess-cost">-</span> tokens</span>
    <span class="session-model" id="sess-model">-</span>
  </div>
  <div class="chat-quick-actions">
    <button class="chat-quick-btn" onclick="sendQuickAction('/todo')">Todo</button>
    <button class="chat-quick-btn" onclick="sendQuickAction('/gmail')">Gmail</button>
    <button class="chat-quick-btn" onclick="sendQuickAction('/model opus')">Opus</button>
    <button class="chat-quick-btn" onclick="sendQuickAction('/model sonnet')">Sonnet</button>
    <button class="chat-quick-btn" onclick="sendQuickAction('/respin')">Respin</button>
    <button class="chat-quick-btn destructive" onclick="sendQuickAction('/newchat')">New Chat</button>
  </div>
  <div class="chat-messages" id="chat-messages"></div>
  <div class="chat-progress-bar" id="chat-progress-bar">
    <div class="chat-progress-pulse"></div>
    <span class="chat-progress-label" id="chat-progress-label">Thinking...</span>
    <button class="chat-stop-btn" id="chat-stop-btn" onclick="abortProcessing()" title="Stop">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect width="14" height="14" rx="2"/></svg>
    </button>
    <div class="chat-progress-shimmer"></div>
  </div>
  <div class="chat-input-area">
    <textarea class="chat-textarea" id="chat-input" rows="1" placeholder="Send a message..." oninput="autoResizeInput()" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChatMessage()}"></textarea>
    <button class="chat-send-btn" id="chat-send-btn" onclick="sendChatMessage()">Send</button>
  </div>
</div>

</body>
</html>`;
}
