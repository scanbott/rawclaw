# RawClaw Dashboard — Setup & Reference Guide

> **Version:** 2.0.0 | **Author:** Raw Growth | **Last updated:** 2026-03-30

The RawClaw Mission Control Dashboard is a real-time web UI for monitoring and interacting with your AI agent fleet. It provides visibility into agent status, memory, token usage, scheduled tasks, conversation history, and the underlying SQLite database.

---

## Table of Contents

1. [What the Dashboard Shows](#1-what-the-dashboard-shows)
2. [How to Start It](#2-how-to-start-it)
3. [Environment Variables & Configuration](#3-environment-variables--configuration)
4. [Dashboard Sections Explained](#4-dashboard-sections-explained)
5. [How to Expose Externally (Cloudflare Tunnel)](#5-how-to-expose-externally-cloudflare-tunnel)
6. [Customizing Views](#6-customizing-views)
7. [Multi-Agent Setup](#7-multi-agent-setup)
8. [Security Features](#8-security-features)
9. [API Reference](#9-api-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What the Dashboard Shows

The dashboard has two main tabs:

### Dashboard Tab
- **Summary Bar** — Message count today, active agents, token usage, memory count (tap any stat to jump to that section)
- **Agents** — All configured agents with live/dead status, model picker, turn count, + New Agent wizard
- **Hive Mind Feed** — Real-time log of what every agent is doing (action + summary, timestamped)
- **Tasks Inbox** — Unassigned mission tasks awaiting routing; drag-and-drop to assign to an agent
- **Mission Control** — Per-agent kanban columns showing queued/running/completed tasks
- **Scheduled Tasks** — Cron-based automated tasks: schedule, next run, last result, pause/resume/delete controls
- **Memory Landscape** — Total memories, insights, pinned memories; importance distribution chart; fading/top-accessed lists; 30-day timeline
- **System Health** — Context window gauge (%), session turns, age, compactions; Telegram/WhatsApp/Slack connection pills
- **Token Usage** — Today's tokens, all-time totals, 30-day usage timeline chart

### Database Tab
- **Table Browser** — Sidebar listing all SQLite tables with row counts; click any table to browse its data
- **Grid View** — Paginated, sortable data grid (50 rows/page)
- **SQL Query Runner** — Read-only SELECT queries with Ctrl+Enter shortcut

### Chat Slide-Over Panel
- **Per-agent tabs** — Switch between "All" and individual agent conversations
- **Session info bar** — Context %, turns, tokens, current model
- **Quick actions** — /todo, /gmail, /model opus, /model sonnet, /respin, /new chat
- **Live SSE stream** — Real-time message delivery without polling
- **Stop button** — Abort processing mid-stream

---

## 2. How to Start It

### Prerequisites

```bash
node >= 20
npm install        # installs all dependencies
```

### Development Mode (with hot reload)

```bash
cd rawclaw/product/rawclaw
npm run dev
# or
npx tsx src/index.ts
```

### Production Mode (compiled)

```bash
npm run build      # compiles TypeScript → dist/
npm start          # runs dist/index.js
```

### Running a Sub-Agent

```bash
node dist/index.js --agent <agent-id>
# Example:
node dist/index.js --agent comms
```

### Accessing the Dashboard

After starting, the dashboard is available at:

```
http://localhost:3141/?token=YOUR_DASHBOARD_TOKEN
```

- Default port: **3141**
- Token required for every request (query param `?token=`)
- If `ALLOWED_CHAT_ID` is set, pass it as `?chatId=YOUR_CHAT_ID` to load your personal memory/health data

Full URL example:
```
http://localhost:3141/?token=abc123&chatId=123456789
```

---

## 3. Environment Variables & Configuration

All environment variables live in `.env` at the project root (`rawclaw/product/rawclaw/.env`).

### Required

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Your main bot's token from @BotFather |
| `ALLOWED_CHAT_ID` | Your Telegram chat ID — only this user can message the bot |
| `DASHBOARD_TOKEN` | Secret token for dashboard access. If empty, dashboard is disabled |

### Dashboard

| Variable | Default | Description |
|---|---|---|
| `DASHBOARD_PORT` | `3141` | Port to run the dashboard on |
| `DASHBOARD_TOKEN` | (none) | Auth token. Set a long random string |
| `DASHBOARD_URL` | (none) | Public URL if using Cloudflare tunnel (e.g. `https://rawclaw.yourdomain.com`) |

### AI Models

| Variable | Default | Description |
|---|---|---|
| `CONTEXT_LIMIT` | `1000000` | Context window size for gauge calculation. Opus 4.6 = 1M |
| `GOOGLE_API_KEY` | (none) | Gemini API key for memory extraction, consolidation, task auto-assignment |

### Security

| Variable | Default | Description |
|---|---|---|
| `SECURITY_PIN_HASH` | (none) | SHA-256 hash of your PIN. Format: `salt:hash`. Enables PIN lock |
| `IDLE_LOCK_MINUTES` | `0` | Auto-lock after N minutes idle. 0 = disabled |
| `EMERGENCY_KILL_PHRASE` | (none) | Phrase that instantly kills all agents when sent to any bot |
| `DB_ENCRYPTION_KEY` | (none) | SQLCipher key for encrypted database. Required if DB is encrypted |

### Integrations

| Variable | Default | Description |
|---|---|---|
| `WHATSAPP_ENABLED` | `false` | Show WhatsApp pill as connected in System Health |
| `SLACK_USER_TOKEN` | (none) | Show Slack pill as connected in System Health |
| `GROQ_API_KEY` | (none) | Voice transcription (Groq Whisper) |
| `ELEVENLABS_API_KEY` | (none) | Voice synthesis (ElevenLabs TTS) |
| `ELEVENLABS_VOICE_ID` | (none) | Voice ID for TTS responses |
| `AGENT_TIMEOUT_MS` | `900000` | Max time (ms) an agent query can run before auto-abort. Default = 15 min |

### External Config Directory

```
RAWCLAW_CONFIG=~/.rawclaw     # Default
```

Personal config files (CLAUDE.md, agent.yaml) live here — never in the repo. This prevents accidental commits of personal context.

Structure:
```
~/.rawclaw/
├── CLAUDE.md              # Your personal system prompt
└── agents/
    └── comms/
        ├── agent.yaml     # Agent-specific config
        └── CLAUDE.md      # Agent-specific system prompt
```

### Generating a Dashboard Token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generating a PIN Hash

```bash
node -e "const c=require('crypto'); const salt=c.randomBytes(8).toString('hex'); const hash=c.createHash('sha256').update(salt+':YOUR_PIN').digest('hex'); console.log(salt+':'+hash)"
```

---

## 4. Dashboard Sections Explained

### Summary Bar

Four quick-stat tiles at the top. Auto-hides when data isn't loaded.

| Tile | Source | Click Action |
|---|---|---|
| Messages | Today's conversation turns | Scrolls to Hive Mind |
| Agents | Running/total count | Scrolls to Agents section |
| Tokens Today | Input + output tokens today | Scrolls to Token Usage |
| Memories | Total memory count | Opens Memory drawer |

### Agents Section

Each agent card shows:
- **Name** and **live/dead** indicator (green dot = running, outline = stopped)
- **Model picker** — Per-agent dropdown (Opus 4.6, Sonnet 4.6, Sonnet 4.5, Haiku 4.5). Changes persist to `agent.yaml`
- **Today's turns** — Only shown when agent is live
- **+ New Agent** button — Opens 3-step wizard (ID → Telegram bot → Confirm)
- **Set all** dropdown — Change model for every agent simultaneously

Clicking an agent card opens a detail modal with:
- Recent conversation (last 6 turns)
- Recent Hive Mind activity
- Scheduled tasks for that agent
- Start/Stop/Delete controls

### Hive Mind Feed

Real-time log of agent actions. Columns: Time | Agent | Action | Summary.

Privacy controls:
- **Eye icon** — Toggle blur on entire section
- **Click individual row** — Toggle blur on that entry
- Blur state persists in `localStorage`

### Tasks Inbox

Unassigned mission tasks. Two assignment methods:
- **Auto-assign** (single) — Gemini classifies the task and picks the best agent
- **Auto-assign All** — Classifies and assigns all unassigned tasks in batch
- **Drag-and-drop** — Drag a card to an agent column in Mission Control

### Mission Control

Per-agent columns showing task cards. Each card shows:
- Title, priority dot (red=high, yellow=medium, gray=low)
- Status pill (queued/running/done/failed/cancelled)
- Age elapsed
- Result/error (expandable)
- Cancel (×) or Delete button

Drag queued cards between agent columns to reassign.

### Scheduled Tasks

Cron-based tasks created via `/schedule` or the scheduler API. Each card shows:
- Task prompt (blurrable)
- Human-readable schedule (e.g. "Daily at 09:00")
- Next run countdown (live ticking)
- Last run status (✓ success / ✗ failed / ⏰ timeout)
- Expandable last result
- Pause ⏸ / Resume ▶ / Delete × buttons

### Memory Landscape

Three tap-to-browse tiles:
- **Memories** → opens sorted-by-importance drawer
- **Insights** → opens consolidation insights drawer
- **Pinned** → opens pinned memories drawer

Charts:
- **Importance Distribution** — Bar chart buckets (0-0.2 through 0.8-1.0) with color coding
- **Fading Soon** — Memories with salience < 0.5; click to expand full text
- **Recently Retrieved** — High-importance memories used in recent conversations
- **Recent Insights** — Patterns discovered by the consolidation engine
- **Memory Creation (30d)** — Line chart of memories created per day

Importance colors: 🟢 0.8+ critical, 🟢 0.6+, 🟡 0.4+, 🟠 0.2+, 🔴 < 0.2

Memory drawer: 30 memories per page, sorted by importance, with entities, topics, connections, and salience displayed per item.

### System Health

- **Context Gauge** — SVG circular gauge showing % of context window used
  - Green < 50%, Amber 50-75%, Red > 75%
- **Session Stats** — Turns, session age, compactions (context window compressions)
- **Connection Pills** — Telegram / WhatsApp / Slack (green = connected, red = disconnected)

### Token Usage

- Today's total tokens (input + output combined)
- Today's turn count
- All-time totals
- 30-day usage timeline (line chart, turns per day)

---

## 5. How to Expose Externally (Cloudflare Tunnel)

Cloudflare Tunnel lets you access the dashboard from mobile or remotely without opening firewall ports.

### Step 1: Install cloudflared

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
winget install --id Cloudflare.cloudflared
```

### Step 2: Authenticate

```bash
cloudflared tunnel login
```

This opens a browser to authorize your Cloudflare account.

### Step 3: Create a Tunnel

```bash
cloudflared tunnel create rawclaw-dashboard
# Note the tunnel ID in the output
```

### Step 4: Configure DNS

```bash
cloudflared tunnel route dns rawclaw-dashboard dashboard.yourdomain.com
```

### Step 5: Create Config File

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <your-tunnel-id>
credentials-file: /root/.cloudflared/<your-tunnel-id>.json

ingress:
  - hostname: dashboard.yourdomain.com
    service: http://localhost:3141
  - service: http_status:404
```

### Step 6: Run the Tunnel

```bash
# Foreground (testing)
cloudflared tunnel run rawclaw-dashboard

# Background service (macOS launchd)
cloudflared service install
sudo launchctl start com.cloudflare.cloudflared

# Background service (Linux systemd)
sudo cloudflared service install
sudo systemctl start cloudflared
```

### Step 7: Update .env

```bash
DASHBOARD_URL=https://dashboard.yourdomain.com
```

### Quick Dev Tunnel (no account needed)

```bash
cloudflared tunnel --url http://localhost:3141
# Prints a temporary *.trycloudflare.com URL
```

### Mobile Access

Once the tunnel is running, access the dashboard from any device:

```
https://dashboard.yourdomain.com/?token=YOUR_DASHBOARD_TOKEN&chatId=YOUR_CHAT_ID
```

The dashboard is mobile-optimized with:
- Responsive 1-column layout on mobile, 2-column on desktop
- Touch-friendly swipe drawers for memories/history
- Device badge indicator (MOBILE / DESKTOP)
- `-webkit-overflow-scrolling: touch` on scroll containers

---

## 6. Customizing Views

The dashboard UI lives in a single file: `src/dashboard-html.ts`

It exports one function: `getDashboardHtml(token, chatId)` which returns the full HTML/CSS/JS as a string.

### Adding a New Metric Widget

1. Add a `<div class="card">` block inside the desired column in `dashboard-html.ts`
2. Add a `<span>` with a unique ID for the value
3. Add a fetch call in the relevant `load*()` function:

```javascript
// Example: add to loadTokens()
document.getElementById('my-metric').textContent = data.someValue;
```

4. Add an API endpoint in `dashboard.ts` if new data is needed

### Adding a Chart

The dashboard uses Chart.js 4 (loaded from CDN). Add a canvas:

```html
<canvas id="my-chart" height="140"></canvas>
```

Then in the JS, after data load:

```javascript
let myChart;
// ...inside load function:
if (myChart) myChart.destroy();
myChart = new Chart(document.getElementById('my-chart'), {
  type: 'line',
  data: { labels: [...], datasets: [{ data: [...], borderColor: '#028a45' }] },
  options: { responsive: true }
});
```

### Changing the Color Scheme

The brand colors are defined as CSS custom values throughout the styles:

| Color | Usage |
|---|---|
| `#014421` | Primary green (buttons, active states) |
| `#028a45` | Secondary green (model indicators) |
| `#6ee7b7` | Light green (success states, active pills) |
| `#0f0f0f` | Page background |
| `#1a1a1a` | Card background |
| `#2a2a2a` | Card border |
| `#e0e0e0` | Primary text |
| `#6b7280` | Muted text |

### Changing the Layout

The main layout uses CSS Grid:

```html
<!-- Desktop: 2-column, mobile: stacked -->
<div class="lg:grid lg:grid-cols-2 lg:gap-6">
  <div><!-- LEFT COLUMN --></div>
  <div><!-- RIGHT COLUMN --></div>
</div>
```

Tailwind CSS classes (loaded from CDN) control responsive behavior. The `lg:` prefix means "apply on large screens only."

### Adding a New Main Tab

1. Add a button in `.db-nav-tabs`:
```html
<button class="db-nav-tab" onclick="switchMainTab('mytab', this)">My Tab</button>
```

2. Add the content div:
```html
<div id="main-tab-mytab" style="display:none">
  <!-- content -->
</div>
```

3. Update `switchMainTab()` to handle the new tab ID.

### Changing Auto-Refresh Interval

Find in the JS section:

```javascript
// Auto-refresh every 60s
setInterval(refreshAll, 60000);

// Mission control refreshes every 15s
setInterval(loadMissionControl, 15000);
```

Adjust the millisecond values as needed.

---

## 7. Multi-Agent Setup

Each sub-agent is a separate bot process with its own Telegram token. The dashboard aggregates all agents into a single view.

### Creating an Agent via Dashboard

1. Click **+ New Agent** in the Agents section
2. **Step 1 — Basics:** Enter Agent ID (lowercase, e.g. `comms`), display name, description, model
3. **Step 2 — Connect Telegram:** Follow BotFather instructions to create a bot, paste the token
4. **Step 3 — Activate:** Click "Activate" to install the system service and start the agent

### Agent Config File Structure

Each agent needs an `agent.yaml` in `~/.rawclaw/agents/<id>/`:

```yaml
name: "Comms"
description: "Handles customer communications and outreach"
telegram_bot_token_env: TELEGRAM_BOT_TOKEN_COMMS
model: claude-sonnet-4-6   # optional, overrides default

# Optional: Obsidian vault integration
obsidian:
  vault: /Users/you/Documents/MyVault
  folders:
    - Projects
    - Notes
  read_only:
    - Archive
```

### Agent .env Keys

Each agent's token must be in `.env`:

```bash
TELEGRAM_BOT_TOKEN_COMMS=1234567890:ABCdefGHI...
TELEGRAM_BOT_TOKEN_RESEARCH=9876543210:XYZabcDEF...
```

### Starting All Agents

```bash
# Start main bot
npm start

# Start sub-agent in separate terminal/screen
node dist/index.js --agent comms
node dist/index.js --agent research
```

### Agent Color Coding

The dashboard assigns colors to agents based on their ID:

| Agent ID | Color |
|---|---|
| `main` | `#014421` (dark green) |
| `comms` | `#0ea5e9` (blue) |
| `content` | `#f59e0b` (amber) |
| `ops` | `#10b981` (green) |
| `research` | `#028a45` (green) |
| Others | `#6b7280` (gray) |

To assign a custom color, edit `AGENT_COLORS` in `dashboard-html.ts`.

### Changing Agent Models

Three ways:
1. **Per-agent dropdown** in the Agents section → change persists to `agent.yaml`
2. **"Set all" dropdown** → changes all agents at once
3. **Direct edit** of `agent.yaml`: `model: claude-haiku-4-5`

---

## 8. Security Features

### PIN Lock

When `SECURITY_PIN_HASH` is set, the bot starts locked. Users must send their PIN to unlock.

```bash
# Generate hash
node -e "
const c = require('crypto');
const pin = 'YOUR_PIN_HERE';
const salt = c.randomBytes(8).toString('hex');
const hash = c.createHash('sha256').update(salt + ':' + pin).digest('hex');
console.log(salt + ':' + hash);
"
```

Add to `.env`: `SECURITY_PIN_HASH=abc123:def456...`

### Idle Auto-Lock

```bash
IDLE_LOCK_MINUTES=30    # lock after 30 minutes of no messages
```

Requires PIN to be configured. Lock check happens on every message.

### Emergency Kill Switch

```bash
EMERGENCY_KILL_PHRASE="shutdown all systems"
```

Sending this phrase to any bot immediately kills all processes.

### Dashboard Auth

All dashboard API endpoints require `?token=YOUR_DASHBOARD_TOKEN`. Without it, all requests return 401. Set a long random token:

```bash
DASHBOARD_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Database Encryption

```bash
DB_ENCRYPTION_KEY=your-strong-key-here
```

Uses SQLCipher (via `better-sqlite3`). Once set, the database cannot be opened without the key.

---

## 9. API Reference

All endpoints require `?token=YOUR_DASHBOARD_TOKEN`.

### Dashboard & Info

| Method | Path | Description |
|---|---|---|
| GET | `/` | Serves the dashboard HTML |
| GET | `/api/info` | Bot name, username, PID, chatId |

### Agents

| Method | Path | Description |
|---|---|---|
| GET | `/api/agents` | List all agents with status, model, turn counts |
| GET | `/api/agents/:id/conversation` | Recent turns for an agent |
| GET | `/api/agents/:id/tasks` | Scheduled tasks for an agent |
| GET | `/api/agents/:id/tokens` | Token stats for an agent |
| PATCH | `/api/agents/:id/model` | Update model for one agent |
| PATCH | `/api/agents/model` | Update model for ALL agents |
| GET | `/api/agents/templates` | List available agent templates |
| GET | `/api/agents/validate-id?id=X` | Validate a new agent ID |
| POST | `/api/agents/validate-token` | Validate a bot token via Telegram API |
| POST | `/api/agents/create` | Create a new agent |
| POST | `/api/agents/:id/activate` | Install service and start agent |
| POST | `/api/agents/:id/deactivate` | Stop agent and uninstall service |
| DELETE | `/api/agents/:id/full` | Delete agent entirely (config + service + env) |
| GET | `/api/agents/:id/status` | Check if agent is running |

### Scheduled Tasks

| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks` | All scheduled tasks |
| DELETE | `/api/tasks/:id` | Delete a scheduled task |
| POST | `/api/tasks/:id/pause` | Pause a task |
| POST | `/api/tasks/:id/resume` | Resume a paused task |

### Mission Control

| Method | Path | Description |
|---|---|---|
| GET | `/api/mission/tasks` | All mission tasks |
| POST | `/api/mission/tasks` | Create a mission task |
| PATCH | `/api/mission/tasks/:id` | Reassign task to different agent |
| POST | `/api/mission/tasks/:id/cancel` | Cancel a task |
| POST | `/api/mission/tasks/:id/auto-assign` | Auto-assign via Gemini classification |
| POST | `/api/mission/tasks/auto-assign-all` | Auto-assign all unassigned tasks |
| DELETE | `/api/mission/tasks/:id` | Delete a task |
| GET | `/api/mission/history` | Completed task history (paginated) |

### Memory

| Method | Path | Description |
|---|---|---|
| GET | `/api/memories?chatId=X` | Stats, fading, top-accessed, timeline, consolidations |
| GET | `/api/memories/pinned?chatId=X` | Pinned memories |
| GET | `/api/memories/list?chatId=X&sort=importance&limit=30&offset=0` | Paginated memory list |

### System

| Method | Path | Description |
|---|---|---|
| GET | `/api/health?chatId=X` | Context %, turns, age, compactions, platform status |
| GET | `/api/tokens?chatId=X` | Token stats + 30-day cost timeline |
| GET | `/api/hive-mind?limit=20&agent=X` | Recent hive mind entries |
| GET | `/api/security/status` | Security/audit status |
| GET | `/api/audit?limit=50&offset=0&agent=X` | Audit log entries |
| GET | `/api/audit/blocked` | Recently blocked actions |

### Database Explorer

| Method | Path | Description |
|---|---|---|
| GET | `/api/db/tables` | All tables with row counts |
| GET | `/api/db/tables/:name?page=1&limit=50&sort=col&order=asc` | Paginated table data |
| GET | `/api/db/query?sql=SELECT+*+FROM+...` | Read-only SQL query |

### Chat

| Method | Path | Description |
|---|---|---|
| GET | `/api/chat/stream` | SSE stream for real-time events |
| GET | `/api/chat/history?chatId=X&limit=40` | Conversation history |
| POST | `/api/chat/send` | Send message from dashboard |
| POST | `/api/chat/abort` | Abort current processing |

### SSE Event Types

The `/api/chat/stream` endpoint emits these Server-Sent Events:

| Event | Data | Description |
|---|---|---|
| `user_message` | `{content, source}` | Incoming message from user |
| `assistant_message` | `{content, source}` | Response from agent |
| `processing` | `{processing, chatId}` | Processing state changed |
| `progress` | `{description}` | Mid-processing status update |
| `error` | `{content}` | Error during processing |
| `ping` | (empty) | Keepalive every 30s |

---

## 10. Troubleshooting

### Dashboard Not Loading

**Symptom:** Browser shows nothing or 404.

**Check:**
1. `DASHBOARD_TOKEN` is set in `.env`
2. Token is included in URL: `?token=YOUR_TOKEN`
3. Port 3141 is not in use: `lsof -i :3141`
4. Bot started without errors: check terminal output

```bash
# Check if something is using port 3141
lsof -i :3141

# Try a different port
DASHBOARD_PORT=3142 npm run dev
```

### "Unauthorized" on Every Request

Token mismatch. Verify:
```bash
grep DASHBOARD_TOKEN .env
# Token in URL must match exactly (case-sensitive, no spaces)
```

### Memory Section Shows "-"

`chatId` is not set in the URL. Add `?chatId=YOUR_TELEGRAM_CHAT_ID`:
```
http://localhost:3141/?token=abc&chatId=123456789
```

Get your chat ID by messaging your bot `/chatid`.

### Context Gauge Always Shows 0%

`CONTEXT_LIMIT` may be set wrong, or the session hasn't been initialized yet. Default is 1,000,000 (Opus 4.6 context window). If using Sonnet (200K window), set:
```bash
CONTEXT_LIMIT=200000
```

### Charts Not Rendering

The dashboard loads Chart.js from CDN (`cdn.jsdelivr.net`). Check browser console for network errors. If offline, you'll need to serve Chart.js locally.

### Google API Key / Gemini Errors

Gemini is used for:
- Memory extraction and consolidation
- Task auto-assignment classification

If `GOOGLE_API_KEY` is missing, these features degrade gracefully (auto-assign will fail, memory will still be saved without extraction).

```bash
GOOGLE_API_KEY=your-google-ai-key
```

Get a key at: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Database "Encrypted" Error

If `DB_ENCRYPTION_KEY` was set when the DB was created, it must always be provided:
```bash
DB_ENCRYPTION_KEY=your-key npm start
```

Never change the key after the database is created — you'll lose all data.

### Agent Appears "Dead" When Running

The dashboard checks for a PID file in `store/agent-<id>.pid`. If the process crashed without cleaning up the file, or was started differently, the status may be wrong.

```bash
# Check for stale PID files
ls rawclaw/product/rawclaw/store/*.pid

# Clear stale PID
rm rawclaw/product/rawclaw/store/agent-comms.pid
```

### Scheduled Tasks Stuck as "running"

If the bot crashed mid-task, tasks can get stuck in "running" state. The scheduler has a `resetStuckTasks()` function that runs on startup. You can also manually fix via the Database tab:

```sql
UPDATE scheduled_tasks SET status = 'active' WHERE status = 'running' AND agent_id = 'main'
```

### WhatsApp/Slack Showing Disconnected

The System Health pills reflect configuration:
- **WhatsApp:** requires `WHATSAPP_ENABLED=true` in `.env` AND the whatsapp-web.js session to be authenticated
- **Slack:** requires `SLACK_USER_TOKEN` to be set

### SSE Chat Stream Disconnecting

EventSource reconnects automatically. If you see frequent disconnects:
1. Check server logs for errors
2. Ensure the dashboard process stays alive (use PM2 or systemd)
3. Cloudflare Tunnel can terminate long-lived connections; consider setting `no-chunked-encoding` in your tunnel config

### Dashboard Slow on Mobile

The dashboard renders ~2000 lines of JavaScript inline. On low-end devices:
1. Reduce auto-refresh interval (change `60000` to `120000` in `setInterval(refreshAll, 60000)`)
2. Disable charts by commenting out the Chart.js canvas and init code
3. Reduce hive mind limit from `?limit=15` to `?limit=5`

---

## Appendix: File Structure

```
rawclaw/product/rawclaw/
├── src/
│   ├── index.ts           # Entry point, startup, --agent flag handling
│   ├── dashboard.ts       # Hono server, all API endpoints
│   ├── dashboard-html.ts  # Full dashboard UI (HTML/CSS/JS as a string)
│   ├── config.ts          # All environment variable handling
│   ├── db.ts              # SQLite database access layer
│   ├── agent-config.ts    # Agent YAML loading and model updates
│   ├── agent-create.ts    # Agent creation wizard backend
│   ├── security.ts        # PIN lock, audit logging, kill switch
│   ├── state.ts           # Shared state (bot info, SSE event emitter)
│   └── ...
├── store/
│   ├── rawclaw.db         # SQLite database
│   ├── rawclaw.pid        # Main bot PID file
│   └── agent-*.pid        # Sub-agent PID files
├── agents/
│   └── _template/         # Template for new agents
│       └── agent.yaml.example
└── .env                   # All configuration (never commit)
```

---

*Generated from source: `src/dashboard.ts`, `src/dashboard-html.ts`, `src/config.ts` — Raw Growth internal reference.*
