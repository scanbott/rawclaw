# Raw Claw v2 Synthesis — Feature Comparison, Steal List & Architecture Plan

**Date:** 2026-03-30
**Sources:** deep-dive-paperclip.md, deep-dive-claudeclaw.md, deep-dive-rawclaw.md
**Purpose:** Merge the best of all three codebases into a Raw Claw v2 architecture plan

---

## 1. Feature Comparison Matrix

| Feature | Paperclip | Claude Claw v2 | Raw Claw v1 | v2 Target |
|---------|-----------|----------------|-------------|-----------|
| **Architecture** | Express + React monorepo (20 packages) | TypeScript monolith (46 files) | Python scripts + CLAUDE.md templates | Hybrid: Claude Claw core + Paperclip patterns |
| **Database** | Drizzle ORM + Postgres (60 tables) | SQLite + better-sqlite3 (12 tables) | Supabase Postgres (19 tables) | Supabase Postgres (keep) |
| **Agent Runtime** | Heartbeat model (wake/work/exit) | Claude Agent SDK subprocess per query | Claude Code via launchd/keepalive | Heartbeat model (steal from Paperclip) |
| **Agent Count** | Unlimited (company-scoped) | 20 max (single user) | 3-5 seats per client | 10 seats max per client |
| **Multi-Tenant** | Yes (company_id on everything) | No (single user) | Per-client Supabase project | Yes (per-client isolation) |
| **Dashboard** | React + Vite (40+ pages, 162KB AgentDetail) | Hono + inline HTML (40+ API endpoints) | None running | React dashboard (steal Paperclip components) |
| **Chat Interface** | No direct chat (issue comments only) | Telegram bot (primary), WhatsApp, Slack | None (agents run headless) | Company LLM (already built, needs deploy) |
| **Memory System** | None (structural only: goals, sessions, comments) | 3-stage pipeline (extract/retrieve/consolidate) | None | Claude Claw memory system (steal entirely) |
| **Voice** | None | STT/TTS cascade (Groq/whisper, ElevenLabs) | None | Phase 3 (not priority) |
| **Scheduling** | Routines with cron/webhook triggers | 60s-polling cron scheduler | Trigger.dev tasks | Trigger.dev (keep, add heartbeat routines) |
| **Budget Control** | Multi-scope policies with hard-stop | Token tracking per turn | No budget tracking | Paperclip-style budget governance |
| **Approval Gates** | Board approval workflow with UI | None (owner has full control) | CLAUDE.md boundaries only | Slack-based approval gates |
| **Goal Hierarchy** | Company -> Team -> Agent -> Task | Hive mind (flat event log) | Tasks table (flat) | Phase 3 (goal hierarchy adds complexity) |
| **Org Chart** | Visual tree (reports_to chain) | 4 agent templates (comms/content/ops/research) | 4 role templates (CEO/COO/Technical/Employee) | Keep role templates + visual org chart |
| **Skill System** | Managed skills per company (SKILL.md + symlinks) | 5 skills + auto-discovery | 248+ Claude Code skills (separate repo) | Skill injection per seat role |
| **Plugin System** | Full JSON-RPC out-of-process SDK (~300KB) | None | None | Phase 3 (overkill for now) |
| **Adapters** | 10 (Claude, Codex, Cursor, Gemini, etc.) | Telegram, WhatsApp, Slack, Obsidian | HubSpot, Google Ads, ClickUp, Stripe, Slack | Keep integration modules + add adapters |
| **Import/Export** | Company portability (164KB service) | None | None | Client template export (steal from Paperclip) |
| **Session Management** | Per-adapter compaction (200 runs / 2M tokens / 72h) | Per-chat Claude sessions | None (fresh sessions) | Session compaction (steal thresholds) |
| **Security** | Auth + API keys + activity log | PIN lock, kill phrase, audit, env isolation, field encryption | RLS policies + role-scoped keys | RLS + env isolation + audit log |
| **Monitoring** | Heartbeat runs table | None built-in | heartbeat.py (8 checks, 15min, Discord) | Keep heartbeat.py + add dashboard view |
| **Deployment** | Docker or local (embedded Postgres) | macOS launchd / Linux systemd | Mac Mini + launchd + Tailscale | Mac Mini (keep) + Docker option |
| **Setup Flow** | Onboarding wizard (57KB React component) | Simple setup.ts script | Manual (spec written, not built) | `rawclaw setup` CLI (Python, steal wizard UX) |
| **Tests** | Vitest + Playwright + PromptFoo evals | 6 unit test files | scaffold_repo_test.py only | Integration smoke tests (priority) |
| **Documentation** | SPEC, PRODUCT, GOAL docs + plugin SDK docs | 1 RFC doc | 17 SOPs, PRDs, guides (1,836+ lines) | Keep SOPs + add technical docs |

---

## 2. Top 20 Features to Steal/Implement in Raw Claw v2

### Tier A: Steal and Implement This Sprint (P0)

| # | Feature | Source | What to Steal | Effort | Impact |
|---|---------|--------|---------------|--------|--------|
| 1 | **`rawclaw setup` CLI** | Claude Claw v1 wizard + Paperclip onboarding | V1's 10-stage wizard UX flow + template rendering engine. Paperclip's company import pattern for generating complete client scaffolds. | 2-3 days | **CRITICAL** — bottleneck for every new client |
| 2 | **Budget governance** | Paperclip `budgets.ts` | Multi-scope budget policies: per-seat daily/monthly token caps, warning thresholds (80%), auto-pause at limit, incident logging. Implement as Trigger.dev task checking Anthropic usage API. | 1-2 days | **HIGH** — removes #1 client objection |
| 3 | **Heartbeat execution model** | Paperclip `heartbeat.ts` | Wake-on-schedule/event, do work, exit pattern. Each run creates a record with: tokens used, cost, exit code, duration, session state. Replaces always-on launchd keepalive with smarter scheduling. | 2-3 days | **HIGH** — enables cost tracking + dead agent detection |
| 4 | **Memory extraction pipeline** | Claude Claw `memory-ingest.ts` | Gemini-powered extraction after every agent turn. Skip/extract criteria, importance scoring, cosine dedup. Store in Supabase `memories` table with pgvector embedding. | 2 days | **HIGH** — agents learn from every interaction |
| 5 | **Atomic task checkout** | Paperclip `issues` table | `checkout_run_id` + `execution_locked_at` on tasks table. Prevents two agents from picking the same task. Critical when CEO and Technical seats overlap. | 0.5 days | **MEDIUM** — prevents double-work |

### Tier B: Implement Next Week (P1)

| # | Feature | Source | What to Steal | Effort | Impact |
|---|---------|--------|---------------|--------|--------|
| 6 | **React dashboard** | Paperclip `ui/` | Fork key pages: Dashboard (overview metrics), AgentDetail (runs, transcripts, budget), Costs (breakdown by agent/day), IssuesList (task kanban). Adapt to Supabase queries. | 3-5 days | **HIGH** — Chris needs visual demo |
| 7 | **Five-layer memory retrieval** | Claude Claw `memory.ts` | Semantic search + recent high-importance + consolidations + team activity + conversation history. Build as Python module called at session start. | 1-2 days | **HIGH** — completes memory system |
| 8 | **Session compaction** | Paperclip `session-compaction.ts` | Track per-seat: session run count, total input tokens, session age. Rotate sessions at thresholds (200 runs / 2M tokens / 72h). Create handoff summary for new session. | 1 day | **MEDIUM** — prevents context rot |
| 9 | **Activity audit log** | Paperclip `activity_log` table | Every agent action logged: actor, action_type, entity_type, entity_id, before/after JSONB, timestamp. Query via dashboard. | 1 day | **MEDIUM** — compliance + debugging |
| 10 | **Company LLM deployment** | Raw Claw v1 `company-llm-vercel/` | Already built. Deploy to Vercel, connect to Dineline Supabase, add SQL tool_use. Give each seat a chat URL. | 0.5 days | **HIGH** — instant demo value |
| 11 | **Integration smoke test** | New (inspired by Paperclip `testEnvironment()`) | `rawclaw test --client dineline` runs all integration modules with `--test` flag. Reports pass/fail per API. Posts summary to Discord. | 0.5 days | **MEDIUM** — install day confidence |
| 12 | **Env isolation pattern** | Claude Claw `env.ts` | Custom .env parser that does NOT set process.env. Secrets loaded per-module, never leak to Claude Code subprocesses. | 0.5 days | **MEDIUM** — security hardening |

### Tier C: Implement in April (P2)

| # | Feature | Source | What to Steal | Effort | Impact |
|---|---------|--------|---------------|--------|--------|
| 13 | **Memory consolidation** | Claude Claw `memory-consolidate.ts` | Every 30 min, send unconsolidated memories to Gemini for pattern detection. Create synthesis summaries. Supersede stale memories (reduce importance, set superseded_by). | 1 day | **MEDIUM** — memory gets smarter over time |
| 14 | **Memory relevance feedback** | Claude Claw `memory.ts` | After each response, evaluate which surfaced memories were useful. Boost useful ones (salience += 0.1), penalize irrelevant (salience -= 0.05). Self-improving retrieval. | 1 day | **MEDIUM** — reduces noise over time |
| 15 | **Client template export** | Paperclip `company-portability.ts` | `rawclaw export --client dineline` creates a portable package: SQL dump, CLAUDE.md templates, integration configs, context files. `rawclaw import` creates new client from package. | 2-3 days | **MEDIUM** — enables "download a client template" |
| 16 | **Slack-based approval gates** | Paperclip `approvals` table + New | When an agent wants to do something high-risk (spend > $500, delete data, modify integrations), post to Slack #approvals with approve/reject buttons. Agent waits for approval. | 2 days | **MEDIUM** — governance without dashboard dependency |
| 17 | **Per-chat message queue** | Claude Claw `message-queue.ts` | Promise-chaining FIFO queue per seat. Prevents concurrent Claude sessions while allowing parallel across seats. Elegant 55-line implementation. | 0.5 days | **LOW** — prevents race conditions |
| 18 | **Hive mind (cross-seat activity)** | Claude Claw `hive_mind` table | Append-only log of agent actions visible to all seats. CEO sees what Technical did today. Technical sees what CEO requested. | 1 day | **MEDIUM** — cross-seat awareness |
| 19 | **Voice I/O for Telegram** | Claude Claw `voice.ts` | Cascading STT (Groq Whisper -> whisper-cpp) + TTS (ElevenLabs -> Gradium). Add as optional capability per seat. | 1-2 days | **LOW** — nice demo feature |
| 20 | **Skill injection per role** | Paperclip skill symlinks | At agent startup, symlink role-appropriate skills into `.claude/skills/`. CEO gets all skills, Employee gets task-only skills. Currently all seats share the same skill set. | 1 day | **MEDIUM** — role-appropriate capabilities |

---

## 3. Architecture Recommendations for v2

### 3.1 Keep from Raw Claw v1 (Core Identity)

These are what make Raw Claw different from Paperclip/Claude Claw. Do NOT change them:

1. **Mac Mini hardware deployment** — This is the product. Clients get a physical machine in their office. It's tangible, it's always on, it's theirs.
2. **Supabase as the database** — Already built, RLS policies working, pgvector for embeddings. Don't switch to SQLite or embedded Postgres.
3. **CLAUDE.md role templates** — Production-grade, 235 lines each, explicit data access matrices. This is better than Paperclip's agent instructions (which are filesystem-based with no access control).
4. **Tailscale mesh VPN** — Remote management without port forwarding. Alexander SSHs in, clients can't see each other.
5. **Integration modules (Python)** — 5 working modules with shared BaseClient. Clean, testable, standalone. Don't rewrite in TypeScript.
6. **Trigger.dev for scheduling** — Cloud-hosted cron is more reliable than local schedulers (Paperclip's in-process scheduler, Claude Claw's 60s polling). Keep it.
7. **Per-client Supabase project** — True multi-tenant isolation at the database level. Paperclip uses company_id column filtering; Raw Claw has separate databases per client. This is more secure.
8. **Onboarding SOPs** — 17 documents totaling 1,836+ lines. Install day runbook, demo script, pricing, deployment SOP. This is operational IP that took real client experience to build.
9. **Dineline pricing model** — $7K setup + $4K/month with 69-73% margins. Validated pricing with a real client.

### 3.2 New Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT LAYER (per client)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Mac Mini 1  │ │ Mac Mini 2  │ │ Mac Mini 3  │       │
│  │ (CEO seat)  │ │ (COO seat)  │ │ (Tech seat) │       │
│  │             │ │             │ │             │       │
│  │ Claude Code │ │ Claude Code │ │ Claude Code │       │
│  │ + CLAUDE.md │ │ + CLAUDE.md │ │ + CLAUDE.md │       │
│  │ + Skills    │ │ + Skills    │ │ + Skills    │       │
│  │ + Memory    │ │ + Memory    │ │ + Memory    │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │
│  ┌──────┴───────────────┴───────────────┴──────┐        │
│  │           HEARTBEAT SERVICE                  │        │
│  │  (runs on each Mac, reports to Supabase)     │        │
│  │  - Agent status, token usage, session state  │        │
│  │  - Memory extraction (Gemini) per turn       │        │
│  │  - Budget enforcement (auto-pause)           │        │
│  │  - Activity audit log                        │        │
│  └──────────────────┬──────────────────────────┘        │
│                     │                                    │
│  ┌──────────────────┴──────────────────────────┐        │
│  │           CLIENT SUPABASE                    │        │
│  │  - 25+ tables (19 current + memory + audit)  │        │
│  │  - RLS per seat role                         │        │
│  │  - pgvector embeddings for memory            │        │
│  │  - Heartbeat history                         │        │
│  │  - Budget tracking                           │        │
│  └──────────────────┬──────────────────────────┘        │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│  RAWGROWTH LAYER    │   (shared across all clients)     │
│                     │                                    │
│  ┌──────────────────┴──────────────────────────┐        │
│  │           MANAGEMENT DASHBOARD               │        │
│  │  (React + Vite, Vercel-hosted)               │        │
│  │  - All clients overview                      │        │
│  │  - Per-client drill-down                     │        │
│  │  - Agent status, costs, memory, tasks        │        │
│  │  - Approval queue                            │        │
│  │  - Budget alerts                             │        │
│  └──────────────────┬──────────────────────────┘        │
│                     │                                    │
│  ┌──────────────────┴──────────────────────────┐        │
│  │           TRIGGER.DEV                        │        │
│  │  - Daily scorecards per client               │        │
│  │  - Weekly reports per client                 │        │
│  │  - CRM sync tasks                           │        │
│  │  - Budget check + auto-pause                │        │
│  │  - Memory consolidation                      │        │
│  └──────────────────┬──────────────────────────┘        │
│                     │                                    │
│  ┌──────────────────┴──────────────────────────┐        │
│  │           RAWGROWTH SUPABASE                 │        │
│  │  - Master client registry                    │        │
│  │  - Pipeline (55 leads)                       │        │
│  │  - Revenue tracking                          │        │
│  │  - Cross-client aggregation                  │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │           rawclaw CLI                        │        │
│  │  rawclaw setup --client "Acme" --seats 3    │        │
│  │  rawclaw test --client acme                  │        │
│  │  rawclaw export --client dineline            │        │
│  │  rawclaw status --all                        │        │
│  │  rawclaw deploy --client acme                │        │
│  └─────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### 3.3 New Database Tables (Add to Client Supabase)

| Table | Source | Purpose |
|-------|--------|---------|
| `memories` | Claude Claw | Structured memories with embeddings (pgvector), importance, salience, pinned, superseded_by |
| `memory_consolidations` | Claude Claw | Cross-memory pattern synthesis |
| `heartbeat_runs` | Paperclip | Per-agent execution records: tokens, cost, duration, exit code, session state |
| `budget_policies` | Paperclip | Per-seat/per-client budget rules: monthly cap, warning threshold, auto-pause |
| `budget_incidents` | Paperclip | Budget threshold breach records |
| `activity_log` | Paperclip | Immutable audit trail: actor, action, entity, before/after |
| `hive_mind` | Claude Claw | Cross-seat activity log: agent_id, action, summary, artifacts |
| `approval_requests` | Paperclip | Pending approvals for high-risk actions |

### 3.4 New Files to Create

| File | Purpose | Effort |
|------|---------|--------|
| `rawclaw/cli/setup.py` | One-command client scaffolder | 2-3 days |
| `rawclaw/cli/test.py` | Integration smoke test runner | 0.5 days |
| `rawclaw/cli/export.py` | Client template export | 2 days |
| `rawclaw/cli/status.py` | Cross-client status check | 0.5 days |
| `dineline/memory/extract.py` | Gemini-powered memory extraction | 1 day |
| `dineline/memory/retrieve.py` | 5-layer memory retrieval | 1 day |
| `dineline/memory/consolidate.py` | Memory pattern detection | 1 day |
| `dineline/budget/enforce.py` | Budget check + auto-pause | 1 day |
| `dineline/integrations/meta_ads.py` | Meta Ads integration | 1 day |
| `006_memory_tables.sql` | Memory + consolidation tables | 0.5 days |
| `007_budget_tables.sql` | Budget policies + incidents | 0.5 days |
| `008_audit_log.sql` | Activity audit log | 0.5 days |
| `009_hive_mind.sql` | Cross-seat activity log | 0.5 days |
| New Trigger.dev tasks for budget + memory | Scheduled enforcement + consolidation | 1-2 days |

---

## 4. Priority Order

### P0: This Sprint (March 31 - April 6) — Unblock Dineline + Enable Sales

| # | Task | Effort | Blocks |
|---|------|--------|--------|
| 1 | Apply Supabase migrations 001-005 to `nnaryjadylboqcoyvcuw` | 2h | Everything |
| 2 | Populate all .env files with real API keys | 2h | All integrations |
| 3 | Assign SEAT_IDs to Brett/Jace/Nick | 1h | RLS queries |
| 4 | Deploy Trigger.dev dineline-* tasks + set env vars | 2h | Scheduled outputs |
| 5 | Deploy Company LLM to Vercel for Dineline | 2h | Demo capability |
| 6 | Build Meta Ads integration module | 6h | Campaign visibility |
| 7 | Build integration smoke test script | 3h | Install day confidence |
| 8 | Get Claude Claw dashboard running for demo | 4h | Chris demo capability |

**Total P0: ~22 hours (3 days)**

### P1: Next Week (April 7-13) — v2 Foundation

| # | Task | Effort | Blocks |
|---|------|--------|--------|
| 9 | Build `rawclaw setup` CLI (scaffold + template + SQL gen) | 20h | Client #2 scalability |
| 10 | Add memory tables (006_memory_tables.sql) | 3h | Memory system |
| 11 | Build memory extraction pipeline (Gemini + pgvector) | 8h | Agent learning |
| 12 | Build 5-layer memory retrieval module | 6h | Memory at session start |
| 13 | Add budget governance tables + enforcement Trigger.dev task | 6h | Cost control |
| 14 | Add activity audit log table + logging middleware | 4h | Compliance |
| 15 | Build env isolation pattern for client deployments | 3h | Security |

**Total P1: ~50 hours (6-7 days with buffer)**

### P2: April 14-30 — Dashboard + Polish

| # | Task | Effort | Blocks |
|---|------|--------|--------|
| 16 | Fork Paperclip React dashboard, adapt to Supabase | 24h | Visual management |
| 17 | Build memory consolidation (30-min Trigger.dev task) | 6h | Memory quality |
| 18 | Build memory relevance feedback loop | 6h | Self-improving retrieval |
| 19 | Build client template export (`rawclaw export`) | 12h | Reusable client configs |
| 20 | Build Slack-based approval gates | 10h | Governance |
| 21 | Add hive mind (cross-seat activity) table + integration | 6h | Cross-seat awareness |
| 22 | Build Fathom API integration | 6h | Sales call automation |
| 23 | Create demo instance with sample data | 6h | Chris selling tool |
| 24 | Session compaction logic per seat | 4h | Context rot prevention |

**Total P2: ~80 hours**

---

## 5. What to Keep from Raw Claw v1 Unchanged (Core Identity)

These are non-negotiable — they define what Raw Claw IS:

1. **Mac Mini deployment model** — Physical hardware in client offices. Tangible, dedicated, always-on. This is the moat. Don't go cloud-only.

2. **CLAUDE.md role templates** — CEO/COO/Technical/Employee with explicit data access matrices, reporting cadences, and boundaries. These are better than anything in Paperclip or Claude Claw. They're production-tested with real client requirements.

3. **Supabase per client** — Separate database per client is more secure than company_id column filtering. Keep this architecture even though it's harder to manage.

4. **Python integration modules** — BaseClient with retry/rate-limit, standalone-testable modules. The pattern is clean. Don't rewrite in TypeScript.

5. **Trigger.dev for scheduling** — Cloud-hosted reliability beats local cron. Already integrated, already deployed.

6. **Tailscale mesh VPN** — Remote management without port forwarding or VPN clients. ACL policy already defined.

7. **Onboarding documentation** — 17 SOPs totaling 1,836+ lines. Install day runbook, demo script, pricing/packaging, client onboarding template. This is operational IP.

8. **Pricing structure** — $5K-$20K setup + $3K-$8K/month with 69-73% margins. Already validated.

9. **The "AI Department" positioning** — Not a chatbot, not a tool, not software. It's a department. With employees (seats), roles, reporting cadences, and boundaries.

10. **Per-seat Getting Started guides** — Personalized 1-page guides per human. Brett's guide talks about CEO concerns. Nick's guide talks about data ops. This personal touch is the difference between adoption and shelfware.

---

## 6. Estimated Complexity Per Feature

| Feature | Effort (hours) | Complexity | Dependencies | Risk |
|---------|---------------|------------|--------------|------|
| Apply Supabase migrations | 2 | Low | Supabase credentials | Low |
| Populate .env files | 2 | Low | Client API keys | Low (need keys from Dineline) |
| `rawclaw setup` CLI | 20 | High | Template engine, SQL generator | Medium (needs thorough testing) |
| Budget governance | 8 | Medium | Supabase migration, Trigger.dev task | Low |
| Heartbeat execution model | 16 | High | Redesign agent runtime, Supabase migration | Medium (breaks existing launchd flow) |
| Memory extraction pipeline | 8 | Medium | Gemini API key, pgvector extension | Low (proven pattern from Claude Claw) |
| Memory retrieval (5-layer) | 6 | Medium | Memory extraction + pgvector | Low |
| Memory consolidation | 6 | Medium | Memory extraction working | Low |
| Memory relevance feedback | 6 | Medium | Memory retrieval working | Low |
| React dashboard | 24 | High | Supabase read access, design decisions | Medium (largest single task) |
| Company LLM deploy | 2 | Low | Vercel + Supabase URL | Low |
| Meta Ads integration | 6 | Medium | Meta API credentials | Low (follows BaseClient pattern) |
| Integration smoke test | 3 | Low | All integrations with --test flag | Low |
| Activity audit log | 4 | Low | Supabase migration | Low |
| Client template export | 12 | Medium | `rawclaw setup` working first | Medium |
| Slack approval gates | 10 | Medium | Slack bot + Supabase migration | Medium (new interaction pattern) |
| Hive mind (cross-seat) | 6 | Low | Supabase migration | Low |
| Session compaction | 4 | Low | Per-seat session tracking | Low |
| Env isolation | 3 | Low | Custom .env parser | Low |
| Fathom API integration | 6 | Medium | Fathom API credentials + research | Medium (new API) |

**Grand total: ~152 hours across all phases**

---

## Summary

Raw Claw v2 should be:
- **Claude Claw's memory system** + **Paperclip's execution model** + **Raw Claw v1's deployment infrastructure**
- Keep the Mac Mini + Supabase + CLAUDE.md core unchanged
- Add memory, budget governance, audit logging, and a React dashboard
- Build the `rawclaw setup` CLI to eliminate the 15-25 hour manual client onboarding
- The memory system is the single highest-ROI steal (agents that learn = agents clients keep paying for)
- The dashboard is the single highest-ROI for sales (Chris can't sell what he can't show)

**Week 1 focus: Unblock Dineline (P0 tasks)**
**Week 2 focus: Build v2 foundation — CLI + memory + budget (P1 tasks)**
**Weeks 3-4 focus: Dashboard + polish (P2 tasks)**

*End of synthesis. Use this document to drive sprint planning with Chris and Dilan.*
