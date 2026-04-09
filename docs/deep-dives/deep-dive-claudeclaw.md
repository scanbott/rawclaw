# Claude Claw / Raw Claw v2 -- Deep Dive Report

**Date:** 2026-03-30
**Source:** `rawclaw/product/rawclaw/` (46 TypeScript source files, ~4,500 lines)
**Old v1 repo:** `rawclaw/other/old-repo/rawclaw-v1/` (shell/JS installer + compiled dist)

---

## Executive Summary

Claude Claw (rebranded Raw Claw) is a personal AI department built on the Claude Agent SDK. It wraps Claude Code in a Telegram bot with persistent memory, multi-agent orchestration, scheduled tasks, voice I/O, WhatsApp/Slack bridging, and a full web dashboard. The architecture is remarkably well-engineered for a solo project -- clean module boundaries, production-grade security, and a sophisticated memory system powered by Gemini embeddings and LLM-driven extraction.

The v2 codebase (current) is a significant rewrite from v1. V1 was a config-driven installer (wizard + template rendering + shell scripts) aimed at productized deployment. V2 is a clean TypeScript monolith with proper typing, ESM modules, and the Claude Agent SDK as its core engine.

---

## 1. Architecture -- Module Structure & Entry Points

### Entry Points

| Entry Point | File | Purpose |
|---|---|---|
| Main bot | `src/index.ts` | Primary process: bot + dashboard + scheduler + memory |
| Agent mode | `src/index.ts --agent <id>` | Sub-agent process with own Telegram bot |
| Schedule CLI | `src/schedule-cli.ts` | Create/list/delete/pause/resume cron tasks |
| Mission CLI | `src/mission-cli.ts` | Create/list/cancel one-shot async tasks |
| Agent Create CLI | `src/agent-create-cli.ts` | Non-interactive agent creation |
| Slack CLI | `src/slack-cli.ts` | List/read/send Slack messages |
| Battle Test | `src/battle-test.ts` | Multi-agent DB isolation smoke test |
| Setup | `scripts/setup.ts` | Interactive first-run wizard |
| Status | `scripts/status.ts` | System health check |
| Migrate | `scripts/migrate.ts` | Database migration runner |

### Module Dependency Graph (simplified)

```
index.ts
  ├── bot.ts          (Telegram message handling, 900+ lines -- largest file)
  ├── dashboard.ts    (Hono web server, ~750 lines)
  ├── orchestrator.ts (agent delegation)
  ├── scheduler.ts    (cron + mission task runner)
  ├── security.ts     (PIN lock, kill phrase, audit)
  ├── memory.ts       (context building, decay, relevance feedback)
  ├── memory-ingest.ts    (Gemini-powered extraction)
  ├── memory-consolidate.ts (pattern detection across memories)
  ├── db.ts           (SQLite via better-sqlite3, ~900 lines)
  ├── agent.ts        (Claude Agent SDK wrapper)
  ├── agent-config.ts (YAML config loading for sub-agents)
  ├── agent-create.ts (full agent lifecycle: create/activate/delete)
  ├── config.ts       (env config, constants)
  ├── state.ts        (SSE event bus, processing state)
  ├── voice.ts        (STT/TTS cascading providers)
  ├── slack.ts        (Slack Web API adapter)
  ├── whatsapp.ts     (whatsapp-web.js adapter)
  ├── media.ts        (Telegram file download/upload)
  ├── obsidian.ts     (vault task scanning)
  ├── embeddings.ts   (Gemini embedding-001)
  ├── gemini.ts       (Gemini Flash for extraction/consolidation)
  ├── message-queue.ts (per-chat FIFO queue)
  ├── logger.ts       (pino structured logging)
  ├── env.ts          (minimal .env parser, no process.env pollution)
  └── migrations.ts   (semver migration guard)
```

### Key Architecture Pattern

The system uses a **"bot-as-proxy" pattern**: Telegram messages flow through `bot.ts`, which builds a rich context (memory, system prompt, recent tasks, team activity, Obsidian), then delegates to the Claude Agent SDK via `agent.ts`. The SDK spawns a `claude` CLI subprocess per query. Claude executes autonomously with full tool access (`bypassPermissions`), and the result flows back through Telegram.

This is not a chat wrapper -- it is a **full agentic loop** where Claude has access to all MCP servers, skills, bash, file system, etc.

---

## 2. Agent Spawning & Management

### Agent Lifecycle

Each agent is a **separate Node.js process** with its own Telegram bot token.

```
agents/
  _template/       (blank CLAUDE.md + agent.yaml.example)
  comms/            (communications agent)
  content/          (content creation agent)
  ops/              (operations agent)
  research/         (research/analysis agent)
```

**Agent creation flow** (`agent-create.ts`):
1. Validate agent ID (regex: `^[a-z][a-z0-9_-]{0,29}$`, max 20 agents)
2. Validate Telegram bot token against `api.telegram.org/bot{token}/getMe`
3. Check no token collision with existing agents
4. Create directory under `RAWCLAW_CONFIG/agents/<id>/` (external) or `agents/<id>/` (repo)
5. Copy CLAUDE.md from template, replace `[AGENT_ID]` placeholders
6. Generate `agent.yaml` (name, description, telegram_bot_token_env, model)
7. Write bot token to `.env` with `# Agent: <id>` comment
8. Generate launchd plist (macOS) or systemd unit (Linux)

**Activation** installs the service config and starts the process. Deactivation stops and uninstalls. Deletion removes everything (directory, plist, env key, log files).

### Agent Config Resolution

Agents are looked up in two locations with RAWCLAW_CONFIG taking priority:
```
RAWCLAW_CONFIG/agents/<id>/agent.yaml   (preferred -- outside repo)
PROJECT_ROOT/agents/<id>/agent.yaml     (fallback -- in repo)
```

**Agent YAML schema** (`agent-config.ts`):
```yaml
name: Research
description: Deep web research, competitive intel, trend analysis
telegram_bot_token_env: RESEARCH_BOT_TOKEN
model: claude-sonnet-4-6
obsidian:
  vault: /path/to/vault
  folders: [Tasks, Projects]
  read_only: [Reference]
```

### Multi-Agent Communication

Agents communicate via two mechanisms:

1. **Hive Mind** (`hive_mind` table): append-only event log. Each agent writes summaries of completed actions. Other agents see this in their memory context as `[Team activity]`.

2. **Inter-Agent Tasks** (`inter_agent_tasks` table): used by the orchestrator for delegation. When you send `@research: analyze competitor X`, the main bot delegates in-process (same Node process, different system prompt + cwd).

3. **Mission Tasks** (`mission_tasks` table): async one-shot tasks created via Mission CLI or dashboard. Each agent's scheduler polls for tasks assigned to it.

---

## 3. Telegram Integration

### Message Flow

```
Telegram API (grammY)
  -> bot middleware: reject non-private chats
  -> command routing (/help, /newchat, /voice, /model, etc.)
  -> handleMessage():
     1. Emergency kill check (runs even when locked)
     2. PIN lock check (try unlock if message is a PIN)
     3. Touch idle timer
     4. Audit log
     5. Delegation detection (@agent: prompt)
     6. Build memory context (5 layers)
     7. Build full message (system prompt + memory + recent tasks + user text)
     8. Run through Claude Agent SDK
     9. Handle streaming (optional, rate-limited)
     10. Extract file markers [SEND_FILE:path]
     11. Save conversation turn + fire memory ingestion
     12. Evaluate memory relevance (fire-and-forget)
     13. Send response (text, voice, files)
     14. Log token usage + context warnings
```

### Commands (18+ built-in)

| Command | What It Does |
|---|---|
| `/newchat` | Clear session + auto-commit session summary to hive mind |
| `/respin` | Pull last 20 conversation turns as context into new session |
| `/voice` | Toggle voice mode (reply with audio) |
| `/model` | Switch between opus/sonnet/haiku |
| `/memory` | View recent memories with importance scores |
| `/forget` | Clear session data |
| `/wa` | Open WhatsApp inbox (numbered list, natural language selection) |
| `/slack` | Open Slack conversations |
| `/dashboard` | Get dashboard URL |
| `/stop` | Abort current processing (AbortController) |
| `/agents` | List available agents with status |
| `/delegate` | Delegate task to specific agent |
| `/lock` / `/status` | PIN lock management |
| `/pin <id>` / `/unpin <id>` | Pin/unpin memories (permanent, never decays) |
| `convolife` | Report context window usage |
| `checkpoint` | Save session summary to memory DB |

### Notable Features

- **Markdown-to-Telegram HTML converter** (`formatForTelegram`): handles headings, bold, italic, code blocks, checkboxes, strikethrough, links, with proper HTML entity escaping
- **File sending markers**: Claude can include `[SEND_FILE:/path/to/file.pdf|caption]` in its response, and the bot sends it as a Telegram document
- **Smart chunking**: `splitMessage()` splits on newlines within the 4096-char Telegram limit
- **Streaming**: optional `global-throttle` strategy edits a placeholder message with progressive text (rate-limited to ~24 edits/min)
- **Auto-discovered skill commands**: scans `~/.claude/skills/*/SKILL.md` for `user_invocable: true` and registers them as Telegram commands

---

## 4. Dashboard

### Technology

- **Server**: Hono (lightweight web framework) + `@hono/node-server`
- **Auth**: query parameter token (`?token=xxx`)
- **Frontend**: single HTML file generated by `dashboard-html.ts` (inline CSS + JS)
- **Real-time**: SSE (Server-Sent Events) for live chat updates

### API Endpoints (40+)

| Category | Endpoints |
|---|---|
| Tasks | `GET/DELETE /api/tasks`, pause/resume |
| Mission Control | Full CRUD for mission tasks, auto-assign via Gemini, reassign |
| Memory | Stats, pinned, list (paginated, sortable), fading, top accessed, timeline, consolidations |
| Health | Context %, turns, compactions, session age, model, connection status |
| Tokens | Stats, cost timeline, recent usage |
| Agents | List with status/cost, create, activate/deactivate, delete, model update, conversation, tasks, tokens |
| Security | Status, audit log (paginated), blocked actions |
| Hive Mind | Feed (global or per-agent) |
| Database Explorer | List tables, paginated rows, read-only SQL queries |
| Chat | SSE stream, history (paginated), send message, abort |

### Auto-Assignment

Mission tasks can be auto-assigned using Gemini:
```typescript
async function classifyTaskAgent(prompt: string): Promise<string | null> {
  // Builds prompt with agent descriptions, asks Gemini to pick the best one
  const response = await generateContent(classificationPrompt);
  return parsed.agent; // e.g., "research"
}
```

---

## 5. Database Layer

### Technology

- **SQLite** via `better-sqlite3` (synchronous, process-embedded, WAL mode)
- **Field-level encryption**: AES-256-GCM for WhatsApp/Slack message bodies
- **FTS5**: Full-text search on memories (summary, raw_text, entities, topics)
- **Permissions**: `chmod 600` on DB files, `chmod 700` on store directory

### Schema (12 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `sessions` | Claude session IDs per chat+agent | `(chat_id, agent_id) PK, session_id` |
| `memories` | Structured memories with LLM extraction | importance, salience, embedding, pinned, superseded_by, agent_id |
| `consolidations` | Cross-memory pattern synthesis | source_ids, summary, insight, embedding |
| `memories_fts` | FTS5 virtual table on memories | summary, raw_text, entities, topics |
| `conversation_log` | Raw conversation turns | role, content, session_id, agent_id |
| `token_usage` | Per-turn token/cost tracking | input/output/cache tokens, cost_usd, did_compact, agent_id |
| `scheduled_tasks` | Cron-based recurring tasks | prompt, schedule, next_run, status, agent_id |
| `mission_tasks` | One-shot async tasks | title, prompt, assigned_agent, status, priority |
| `hive_mind` | Cross-agent activity log | agent_id, action, summary, artifacts |
| `inter_agent_tasks` | Delegation tracking | from_agent, to_agent, status, result |
| `audit_log` | Security audit trail | agent_id, action, detail, blocked |
| `wa_messages` / `wa_outbox` / `wa_message_map` / `slack_messages` | Message storage | Encrypted bodies, timestamps |

### Migration System

Two layers:
1. **Inline migrations** in `db.ts/runMigrations()`: PRAGMA-based column detection + ALTER TABLE. Handles ~15 migrations including Memory V2 schema migration, multi-agent support, FTS5 trigger optimization, pinned memories, mission task schema changes.
2. **Version guard** in `migrations.ts`: semver-based migration check via `migrations/version.json` and `.applied.json`. Blocks startup if pending.

### Key Design Decision: No ORM

All queries are hand-written prepared statements. This is appropriate for the use case -- the schema is stable, queries are performance-critical, and SQLite's synchronous API maps cleanly to the synchronous call sites.

---

## 6. Memory System

This is the most sophisticated part of the codebase. Three stages:

### Stage 1: Ingestion (`memory-ingest.ts`)

After every conversation turn, a fire-and-forget Gemini call extracts structured memory:

```
User message + Claude response
  -> EXTRACTION_PROMPT (very detailed skip/extract criteria)
  -> Gemini Flash returns JSON: { summary, entities, topics, importance, skip }
  -> Hard filters: skip < 0.5 importance, skip short messages, skip commands
  -> Duplicate detection: embed new memory, compare cosine similarity > 0.85 against existing
  -> Save to `memories` table with embedding
  -> Notify user on importance >= 0.8 ("New memory #42 [0.9]: User prefers...")
```

The extraction prompt is extremely well-calibrated. It explicitly skips:
- Acknowledgments, greetings, commands
- Ephemeral task execution (send email, check calendar)
- Session summaries and task logs
- Form-filling and one-off requests

It only extracts:
- Standing preferences and habits
- Decisions and policies
- Relationship identities
- Behavior corrections
- Business rules and workflows

### Stage 2: Retrieval (`memory.ts/buildMemoryContext()`)

Five-layer retrieval builds the context prepended to every message:

| Layer | Source | Method |
|---|---|---|
| 1 | Semantic search | Gemini embedding cosine similarity (>0.3 threshold) with FTS5/LIKE fallback |
| 2 | Recent high-importance | Last 5 memories with importance >= 0.5 |
| 3 | Consolidation insights | Embedding search on consolidations, LIKE fallback |
| 4 | Team activity | Other agents' recent hive_mind entries (24h window) |
| 5 | Conversation history | FTS search on conversation_log (triggered by recall keywords) |

Plus optional Obsidian vault context (open tasks from configured folders).

### Stage 3: Consolidation (`memory-consolidate.ts`)

Every 30 minutes, unconsolidated memories (up to 20) are sent to Gemini:

```
Memories -> CONSOLIDATION_PROMPT
  -> Find patterns and connections
  -> Create synthesis summary + insight
  -> Map connections between specific memories
  -> Detect contradictions (timestamp-aware: newer = authoritative)
  -> Save consolidation with embedding
  -> Wire up connections (bidirectional, deduplicated)
  -> Supersede stale memories (reduce importance/salience, set superseded_by)
  -> Mark source memories as consolidated
```

### Memory Lifecycle

```
Creation (importance 0.5-1.0, salience 1.0)
  -> Daily decay sweep:
     - importance >= 0.8: 1% per day (~460 day half-life)
     - importance >= 0.5: 2% per day (~230 days)
     - importance < 0.5:  5% per day (~90 days)
     - pinned: never decays
  -> Relevance feedback: after each response, Gemini evaluates which surfaced memories were useful
     - Useful: salience += 0.1 (capped at 5.0), accessed_at updated
     - Not useful: salience -= 0.05
  -> Pruned when salience < 0.05
```

Key design decisions:
- **No touch on retrieval**: Surfacing a memory does NOT boost it. Only the relevance feedback loop can boost salience. This prevents noise from staying fresh forever.
- **Supersession over deletion**: Contradictions don't delete old memories; they reduce importance/salience and set `superseded_by`, creating an auditable history.
- **Pinning is user-controlled only**: No auto-pinning. The user decides what's permanent.

---

## 7. Scheduler System

### Cron Tasks (`scheduler.ts`)

- **Polling interval**: 60 seconds
- **Task timeout**: 10 minutes (with AbortController)
- **Execution**: Routes through `messageQueue` to prevent concurrent Claude sessions
- **State machine**: `active` -> `running` (locked in DB) -> `active` (with next_run updated)
- **Crash recovery**: `resetStuckTasks()` on startup resets any tasks left in `running` state
- **Task logging**: Injects task output into conversation context so user can reply to scheduled task results naturally

### Mission Tasks

One-shot async tasks created via dashboard or Mission CLI. Each agent's scheduler claims tasks assigned to it:

```typescript
const mission = claimNextMissionTask(schedulerAgentId);
// Run via runAgent() with fresh session
// completeMissionTask(id, result, status)
```

### Schedule CLI

The Claude agent itself creates scheduled tasks via bash:
```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
node "$PROJECT_ROOT/dist/schedule-cli.js" create "Summarize AI news" "0 9 * * 1"
```

Agent ID auto-detected from `RAWCLAW_AGENT_ID` env var (set by `index.ts`).

---

## 8. Voice System

### Architecture: Cascading Providers

**STT (Speech-to-Text):**
1. Groq Whisper (cloud, fast, `whisper-large-v3`) -- primary
2. whisper-cpp (local, requires ffmpeg + model download) -- fallback

**TTS (Text-to-Speech):**
1. ElevenLabs (`eleven_turbo_v2_5`) -- primary, supports voice cloning
2. Gradium AI (OGG Opus output, 45k free credits/month) -- alternative
3. macOS `say` + ffmpeg (local, macOS only) -- fallback

### Voice Flow

1. User sends voice note to Telegram
2. Bot downloads .oga file via Telegram API
3. Renames .oga to .ogg (Groq requires .ogg)
4. Transcribes via cascade: Groq -> whisper-cpp
5. Prepends `[Voice transcribed]:` to message
6. Processes as normal text message
7. If voice mode enabled (`/voice`), synthesizes response audio via cascade
8. Sends OGG voice message back to Telegram

### Implementation Detail

The `voice.ts` module manually builds multipart/form-data for the Groq API using raw Buffers -- no `form-data` dependency. This is a conscious decision to minimize dependencies.

---

## 9. Channel Adapters

### Telegram (Primary)

- **Library**: grammY
- **Features**: text, voice, photos, documents, videos, file sending
- **Security**: `ALLOWED_CHAT_ID` filtering, private-chat-only middleware
- **Model switching**: per-chat in-memory override (`/model opus`)

### WhatsApp (`whatsapp.ts`)

- **Library**: whatsapp-web.js (Puppeteer-based, runs headless Chrome)
- **Auth**: QR code displayed in terminal, stored in `store/waweb/`
- **Feature set**: list chats, read messages, send messages
- **Security**: message bodies encrypted with AES-256-GCM before DB storage, 3-day auto-deletion
- **Outbox pattern**: WhatsApp sends go through `wa_outbox` table, polled every 3 seconds
- **Integration**: accessed via `/wa` command in Telegram -- shows numbered list, user picks with natural language

### Slack (`slack.ts`)

- **Library**: @slack/web-api (User OAuth token, xoxp-)
- **Feature set**: list conversations (DMs + channels), read messages, send messages, thread support
- **Security**: message bodies encrypted, 3-day auto-deletion
- **CLI**: `slack-cli.ts` for direct access via bash

### Obsidian (`obsidian.ts`)

- **Integration**: read-only scan of configured vault folders
- **Feature**: extracts open tasks (`- [ ]` items) from markdown files
- **Caching**: 5-minute TTL, scans on demand
- **Config**: per-agent `obsidian.vault` + `obsidian.folders` in agent.yaml

---

## 10. Config / Env System

### Environment Variables

The `.env` file is parsed by a custom, minimal parser (`env.ts`) that:
- Does NOT pollute `process.env` (secrets stay isolated)
- Only reads requested keys (allowlisted per-module)
- Handles quoted values (single and double quotes)
- Returns a plain `Record<string, string>`

This is a strong security decision -- secrets don't leak to Claude Code subprocesses.

### Config Resolution Order

```
1. process.env (highest priority -- for Docker/CI overrides)
2. .env file (readEnvFile)
```

### External Config Directory

Personal config lives outside the repo in `RAWCLAW_CONFIG` (default `~/.rawclaw`):
- `CLAUDE.md` (personal system prompt -- never committed)
- `agents/<id>/agent.yaml` and `agents/<id>/CLAUDE.md`

This separation means the repo stays clean and shareable.

### Key Config Constants

| Variable | Default | Purpose |
|---|---|---|
| `AGENT_TIMEOUT_MS` | 900000 (15 min) | Max query duration before auto-abort |
| `CONTEXT_LIMIT` | 1000000 (1M) | Model context window size |
| `DASHBOARD_PORT` | 3141 | Web dashboard port |
| `STREAM_STRATEGY` | off | Telegram streaming mode |
| `IDLE_LOCK_MINUTES` | 0 (disabled) | Auto-lock after idle |

---

## 11. Security Model

### Layers

| Layer | Mechanism | Scope |
|---|---|---|
| **Auth** | `ALLOWED_CHAT_ID` | Only one Telegram user can interact |
| **Private chat only** | grammY middleware | Rejects group chats |
| **PIN lock** | Salted SHA-256 hash | Bot starts locked, requires PIN |
| **Idle auto-lock** | Configurable timeout | Re-locks after inactivity |
| **Emergency kill** | Secret phrase | Immediately stops ALL agents + exits process |
| **Audit log** | Every action logged to SQLite | message, command, delegation, unlock, lock, kill, blocked |
| **Env isolation** | `readEnvFile()` doesn't set process.env | Secrets don't leak to subprocesses |
| **DB permissions** | `chmod 600` on DB files | Owner-only access |
| **Field encryption** | AES-256-GCM | WhatsApp/Slack message bodies encrypted at rest |
| **Retention policy** | 3-day auto-delete | WhatsApp/Slack messages pruned daily |
| **Process locks** | PID files | Prevents duplicate bot instances |

### Emergency Kill Flow

```
Message received (any bot, any state)
  -> checkKillPhrase(message)
  -> audit({ action: 'kill' })
  -> Reply "EMERGENCY KILL activated"
  -> Stop all launchd/systemd services matching com.rawclaw.*
  -> process.exit(0) (with 5s force-exit timeout)
```

---

## 12. Strongest Patterns Worth Reusing

### 1. Memory Extraction Pipeline

The `memory-ingest.ts` extraction prompt is battle-tested. Its skip/extract criteria are extremely precise. The dual-check (importance threshold + cosine similarity dedup) prevents both noise and duplication. This is the single most valuable piece of the codebase.

### 2. Five-Layer Memory Retrieval

The `buildMemoryContext()` approach of combining semantic search + recent high-importance + consolidation insights + team activity + conversation history recall gives comprehensive context without overwhelming the model.

### 3. Env Isolation Pattern

The `readEnvFile()` approach of parsing .env without polluting `process.env` is a clean security pattern. Combined with `getEncryptionKey()` lazy initialization, secrets are only loaded when needed.

### 4. Per-Chat Message Queue

```typescript
class MessageQueue {
  private chains = new Map<string, Promise<void>>();
  enqueue(chatId: string, handler: () => Promise<void>): void {
    const prev = this.chains.get(chatId) ?? Promise.resolve();
    const next = prev.then(handler);
    this.chains.set(chatId, next);
  }
}
```

Elegant FIFO queue using promise chaining. Prevents concurrent Claude sessions per chat while allowing parallel processing across different chats.

### 5. Cascading Provider Pattern (Voice)

The `synthesizeSpeech()` cascade (ElevenLabs -> Gradium -> macOS say) is clean and extensible. Each provider is a standalone function, the cascade just catches errors and falls through. Same pattern for STT.

### 6. SSE Event Bus for Dashboard

The `state.ts` EventEmitter + Hono SSE streaming gives real-time updates without WebSocket complexity. The `chatEvents` bus decouples the Telegram bot from the dashboard.

### 7. Agent Config Resolution with External Override

The two-location lookup (RAWCLAW_CONFIG/agents/ -> PROJECT_ROOT/agents/) allows personal config to override repo defaults without modifying tracked files.

### 8. Telegram Markdown-to-HTML Converter

`formatForTelegram()` handles the full gamut of Markdown -> Telegram HTML conversion with proper code block extraction, entity escaping, and restoration. This is a non-trivial piece of code that took clear iteration to get right.

### 9. Memory Relevance Feedback Loop

After every response, a fire-and-forget Gemini call evaluates which surfaced memories were actually useful. Useful ones get boosted, irrelevant ones get penalized. This creates a self-improving memory system that gets more relevant over time.

### 10. RFC-Driven Architecture Evolution

The `docs/rfc-sdk-engine.md` is a 900-line RFC for adding a direct API backend. It shows mature engineering thinking: clear motivation, current vs. proposed architecture, phased implementation plan, trade-off analysis, cost estimation. This pattern should be reused for Raw Claw v2 planning.

---

## 13. What's Broken or Missing

### Critical Gaps

1. **No Windows support**: launchd (macOS) and systemd (Linux) service generation only. PID file management uses Unix conventions. The `setup` script is a bash shebang. This blocks deployment on Windows machines.

2. **Single-user only**: The entire system assumes one `ALLOWED_CHAT_ID`. Multi-tenant support would require per-user memory, sessions, and security contexts.

3. **No test coverage for core paths**: Only 6 test files exist (`bot.test.ts`, `db.test.ts`, `env.test.ts`, `memory.test.ts`, `memory-ingest.test.ts`, `memory-consolidate.test.ts`, `scheduler.test.ts`). The main message handling flow, orchestrator, dashboard, and voice have no tests.

4. **Dashboard HTML is a 4000+ line single file**: `dashboard-html.ts` generates the entire frontend as an inline HTML string. No build step, no component system, no TypeScript for the client. This is functional but unmaintainable at scale.

### Architectural Weaknesses

5. **bot.ts is 900+ lines**: The main message handler, command definitions, WhatsApp/Slack state machines, markdown formatting, file extraction, and context warning logic are all in one file. This should be split into: commands/, adapters/, formatters/, and a thin message handler.

6. **In-memory state is lost on restart**: Voice mode (`voiceEnabledChats`), model overrides (`chatModelOverride`), WhatsApp/Slack state machines, and context baselines all reset on restart. These should be persisted to SQLite.

7. **Subprocess-per-query model**: Each message spawns a `claude` CLI subprocess. The RFC for SDK Engine addresses this, but it's not implemented. This adds 2-5 seconds of latency per turn.

8. **WhatsApp adapter uses whatsapp-web.js**: This library reverse-engineers the WhatsApp Web protocol and is notoriously fragile. It requires a full Chromium instance and breaks when WhatsApp updates their protocol.

9. **No error recovery on Gemini failures**: If `GOOGLE_API_KEY` is invalid or Gemini is down, memory ingestion and consolidation silently fail. There's no backlog/retry mechanism.

10. **Hardcoded model names**: Model strings like `'claude-opus-4-6'`, `'claude-sonnet-4-6'`, `'gemini-3-flash-preview'`, `'gemini-embedding-001'` are scattered across multiple files.

### Missing Features (for v2 productization)

11. **No onboarding flow for end users**: V1 had a comprehensive 10-stage wizard (`lib/wizard.cjs`). V2 has `scripts/setup.ts` which is much simpler.

12. **No skill manifest/installer**: V1 had `skills/manifest.json` with 124 skills and `lib/skill-installer.cjs`. V2 has 5 skills with no discovery mechanism beyond filesystem scanning.

13. **No config-driven templating**: V1's `rawclaw.config.json` + template rendering (`{{business.name}}`) system is gone. V2 requires manual CLAUDE.md editing.

14. **No Supabase/Postgres option**: V1 referenced Supabase for persistent storage. V2 is SQLite-only, which limits deployment options (no multi-server, no cloud).

15. **No Docker/container support**: No Dockerfile, no docker-compose. Deployment assumes bare metal macOS/Linux.

16. **No API rate limiting on dashboard**: The dashboard validates a token but has no rate limiting. Brute-force token guessing is possible.

17. **No backup/restore**: No export/import for memories, configurations, or conversations.

### V1 -> V2 Regression

The v1 codebase had significant productization features that v2 lacks:

| V1 Feature | V2 Status |
|---|---|
| 10-stage setup wizard | Simplified setup script |
| Config-driven agent provisioning (6 named agents) | Manual agent creation |
| Template rendering system | Manual CLAUDE.md editing |
| 124 skills with manifest + installer | 5 skills, no installer |
| Knowledge template library | Not present |
| Step-by-step API setup guides (7) | Not present |
| Shell-based dispatch system | Replaced by orchestrator (better) |
| Update script preserving config | Not present |

The v2 core is significantly better engineered (TypeScript, proper modules, memory system, security), but the productization layer was stripped. Raw Claw v2 needs to rebuild this layer on top of the better foundation.

---

## File Reference

### Source Files (46 .ts files)

| File | Lines (approx) | Purpose |
|---|---|---|
| `src/bot.ts` | ~900 | Telegram message handling, commands, formatters |
| `src/db.ts` | ~900 | SQLite schema, CRUD, encryption, migrations |
| `src/dashboard.ts` | ~750 | Hono web server, 40+ API endpoints |
| `src/dashboard-html.ts` | ~4000 | Inline HTML/CSS/JS dashboard |
| `src/agent.ts` | ~300 | Claude Agent SDK wrapper |
| `src/agent-create.ts` | ~560 | Agent lifecycle management |
| `src/agent-config.ts` | ~175 | YAML config loading |
| `src/agent-create-cli.ts` | ~170 | Non-interactive agent creation CLI |
| `src/orchestrator.ts` | ~240 | Delegation parsing and execution |
| `src/scheduler.ts` | ~205 | Cron scheduler + mission task runner |
| `src/schedule-cli.ts` | ~125 | Schedule management CLI |
| `src/mission-cli.ts` | ~135 | Mission task CLI |
| `src/security.ts` | ~215 | PIN lock, kill phrase, audit |
| `src/memory.ts` | ~270 | Context building, decay, relevance feedback |
| `src/memory-ingest.ts` | ~160 | Gemini-powered memory extraction |
| `src/memory-consolidate.ts` | ~185 | Cross-memory pattern detection |
| `src/voice.ts` | ~445 | STT/TTS cascading providers |
| `src/slack.ts` | ~185 | Slack Web API adapter |
| `src/slack-cli.ts` | ~90 | Slack CLI |
| `src/whatsapp.ts` | ~140 | WhatsApp Web adapter |
| `src/media.ts` | ~200 | Telegram file download/upload |
| `src/obsidian.ts` | ~110 | Vault task scanning |
| `src/embeddings.ts` | ~50 | Gemini embeddings + cosine similarity |
| `src/gemini.ts` | ~55 | Gemini Flash content generation |
| `src/config.ts` | ~170 | Environment config + constants |
| `src/env.ts` | ~40 | Minimal .env parser |
| `src/state.ts` | ~85 | SSE event bus + processing state |
| `src/message-queue.ts` | ~55 | Per-chat FIFO queue |
| `src/logger.ts` | ~10 | Pino structured logging |
| `src/migrations.ts` | ~65 | Semver migration guard |
| `src/index.ts` | ~230 | Entry point + boot sequence |
| `src/battle-test.ts` | ~95 | Multi-agent DB isolation test |
| Test files (6) | ~varies | Unit tests for db, env, memory, scheduler |

### Key Directories

| Path | Contents |
|---|---|
| `agents/` | 4 agent templates + blank template |
| `skills/` | 5 skills (gmail, google-calendar, slack, timezone, tldr) |
| `scripts/` | 21 utility scripts (setup, migrate, status, battle tests, service management) |
| `docs/` | 1 file (RFC for SDK Engine) |
| `migrations/` | version.json (empty -- all migrations are inline) |
| `store/` | Runtime data (SQLite DB, PID files) |
| `workspace/` | Working directory for Claude + uploads |
| `launchd/` | Generated plist files for macOS service management |

### Dependencies

| Package | Purpose |
|---|---|
| `@anthropic-ai/claude-agent-sdk` | Claude Code subprocess management |
| `@google/genai` | Gemini for memory extraction + embeddings |
| `@hono/node-server` + `hono` | Dashboard web server |
| `@slack/web-api` | Slack adapter |
| `better-sqlite3` | SQLite database |
| `grammy` | Telegram bot framework |
| `cron-parser` | Cron expression parsing |
| `js-yaml` | Agent config YAML parsing |
| `pino` + `pino-pretty` | Structured logging |
| `qrcode-terminal` | WhatsApp QR code display |
| `whatsapp-web.js` | WhatsApp adapter |
