# Raw Claw v2 — Architecture Decisions

## Core Principle: Enhancement, Not Rewrite

Raw Claw v2 keeps the existing TypeScript monolith architecture (46 source files, Claude Agent SDK, grammy Telegram bot, SQLite, Hono dashboard). We ADD capabilities on top — never remove or restructure working code.

## Key Architecture Decisions

### 1. Dual-Database Strategy (SQLite + Supabase)

**Decision:** Keep SQLite as primary (works offline, zero-config). Add optional Supabase as secondary for cloud persistence and multi-tenant features.

**Why:** SQLite is the reason Raw Claw works on a Mac Mini with zero setup. Supabase is needed for cross-machine memory, dashboard access from anywhere, and client data isolation. Making Supabase optional means the product still works when internet is down.

**Pattern:** `supabase.ts` exports a singleton client. All write operations that touch memories, heartbeat_runs, budget, or audit go through a `dualWrite()` helper that writes to SQLite first (always), then Supabase (if configured). Reads prefer SQLite for speed, fall back to Supabase for cross-agent queries.

### 2. Budget Governance (Stolen from Paperclip)

**Decision:** Budget policies per agent with hard-stop enforcement.

**Pattern:** Before each `runAgent()` call, `checkBudget(agentId)` queries token_usage for the current window. If over threshold: warning at 80%, hard-stop at 100%. Budget incidents logged to both SQLite and Supabase. Agent auto-paused on budget breach.

**Scope:** daily and monthly windows. Metric: estimated cost in USD (calculated from token counts and model pricing).

### 3. Heartbeat Execution Model (Stolen from Paperclip)

**Decision:** Wrap every agent execution in a heartbeat_run record.

**Pattern:** `heartbeat.ts` exports `executeWithHeartbeat(agentId, prompt, options)` which:
1. Creates a heartbeat_run record (status: 'running')
2. Calls `runAgent()` from agent.ts
3. Updates the record with: tokens, cost, duration, exit code, session state
4. Returns the agent result

This gives complete visibility into every agent execution without changing the core agent.ts logic.

### 4. Activity Audit Log (Stolen from Paperclip)

**Decision:** Every mutation writes to activity_log.

**Pattern:** `audit.ts` exports `logActivity(actor, actionType, entityType, entityId, detail)`. Called from bot.ts (message handling), scheduler.ts (task execution), orchestrator.ts (delegation), dashboard.ts (API mutations).

### 5. Enhanced Dashboard (Inspired by Paperclip UI)

**Decision:** Keep the single-file inline HTML approach (dashboard-html.ts) but add substantial new pages.

**Why:** The inline HTML approach means zero build step, zero frontend tooling, zero deployment complexity. It's ugly engineering but perfect for a product that runs on Mac Minis.

**New pages:** Agent Management, Cost Overview, Memory Explorer, Activity Feed, Budget Alerts, Health Status.

### 6. Discord Adapter

**Decision:** Add Discord.js adapter following the same pattern as slack.ts.

**Why:** Many clients use Discord for team communication. The adapter follows the exact same interface as Slack (list channels, read messages, send messages).

### 7. Plugin System (Simplified from Paperclip)

**Decision:** In-process TypeScript plugins with YAML manifest. No JSON-RPC, no separate processes.

**Why:** Paperclip's plugin system is 300KB+ of code for out-of-process isolation. Overkill for Raw Claw where plugins are trusted (installed by the deployer, not end users). In-process plugins are simpler, faster, and can directly access the database.

**Pattern:** Plugins live in `plugins/<name>/` with a `plugin.yaml` manifest and `index.ts` entry point. The plugin loader discovers them at startup, validates manifests, and calls their `init()` function.

### 8. Enhanced Setup Wizard

**Decision:** Expand scripts/setup.ts to be a full interactive wizard.

**Pattern:** readline-based prompts (no dependency needed). Validates each input in real-time (e.g., Telegram bot token validated via API call). Generates .env, creates database, offers to create first agent.

### 9. Health Monitoring

**Decision:** Add /health endpoint + periodic self-check.

**Pattern:** `health.ts` exports health check functions for each subsystem. Dashboard's Hono server exposes GET /health returning JSON. A setInterval runs checks every 5 minutes and posts to Discord/Slack on failures.

### 10. Memory System Upgrade

**Decision:** Enhance existing memory system, don't replace it.

**Additions:**
- Session compaction tracking (prevent context rot after 200 runs / 2M tokens / 72h)
- Optional Supabase dual-write for memories
- Hive mind table for cross-agent activity
- Memory statistics endpoint

## File Organization

New files added to src/:
```
src/
  supabase.ts        — Supabase client + dual-write helpers
  budget.ts          — Budget policies, enforcement, incidents
  heartbeat.ts       — Heartbeat execution wrapper
  audit.ts           — Activity audit log
  health.ts          — Health check system
  discord.ts         — Discord adapter
  plugins.ts         — Plugin loader + lifecycle
  plugin-types.ts    — Plugin type definitions
  session-compaction.ts — Session rotation logic
```

Modified files:
```
src/db.ts            — New tables: heartbeat_runs, budget_policies, budget_incidents, activity_log_v2, hive_mind
src/dashboard.ts     — New API endpoints for all new features
src/dashboard-html.ts — New dashboard pages
src/bot.ts           — Integration with heartbeat, budget, audit
src/scheduler.ts     — Integration with heartbeat, budget
src/memory.ts        — Session compaction, Supabase dual-write
src/memory-ingest.ts — Supabase dual-write
src/index.ts         — Plugin loader init, health check init
scripts/setup.ts     — Enhanced interactive wizard
package.json         — New dependencies, version bump
```

## Dependencies Added

- `@supabase/supabase-js` — Supabase client (optional runtime dependency)
- `discord.js` — Discord adapter (optional)

Both are optional — the system works without them configured.
