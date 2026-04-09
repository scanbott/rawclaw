# Deep Dive: Paperclip Codebase Analysis

**Date:** 2026-03-30
**Source:** `D:/-Alexander Thompson/Claude Code Warp/paperclip/` (fork of [paperclipai/paperclip](https://github.com/paperclipai/paperclip))
**Version:** 0.3.1 (server package.json)
**License:** MIT

---

## 1. Architecture (Monorepo Structure & Package Boundaries)

### Monorepo Layout

Paperclip is a pnpm workspace monorepo with TypeScript throughout. ES2023 target, NodeNext module resolution, strict mode.

```
paperclip/
  server/              # Express REST API + orchestration engine (@paperclipai/server)
  ui/                  # React + Vite dashboard (@paperclipai/ui)
  cli/                 # CLI tool (onboard, heartbeat-run, worktree, doctor, etc.)
  packages/
    db/                # Drizzle ORM schema + migrations (@paperclipai/db)
    shared/            # Types, constants, validators, API path constants (@paperclipai/shared)
    adapter-utils/     # Shared adapter interfaces + session compaction logic
    adapters/
      claude-local/    # Claude Code adapter
      codex-local/     # OpenAI Codex adapter
      cursor-local/    # Cursor adapter
      gemini-local/    # Gemini CLI adapter
      openclaw-gateway/ # OpenClaw SSE gateway adapter
      opencode-local/  # OpenCode adapter
      pi-local/        # Pi adapter
    plugins/
      sdk/             # Plugin SDK (@paperclipai/plugin-sdk)
      create-paperclip-plugin/  # Scaffolding CLI
      examples/        # 4 example plugins (hello-world, file-browser, kitchen-sink, authoring-smoke)
  skills/              # Built-in skills injected into agent runtimes
  doc/                 # Product specs, implementation docs, plans
  evals/               # PromptFoo evals for heartbeat prompt quality
  tests/               # E2E tests (Playwright)
  scripts/             # Build, release, backup, dev-runner scripts
  docker/              # Docker support files
```

### Package Dependency Graph

```
ui --> shared
server --> shared, db, adapter-utils, all adapters, plugin-sdk
adapters/* --> adapter-utils, shared
plugin-sdk --> shared
cli --> shared (client-side only)
```

**Key design principle:** Every adapter is its own npm package with `src/server/`, `src/ui/`, and `src/cli/` entrypoints, so server/UI/CLI can import only the slice they need. The `adapter-utils` package holds the `ServerAdapterModule` interface and all shared types -- no Drizzle dependency.

### Build System

- pnpm 9.15+ with workspace protocol (`workspace:*`)
- TypeScript 5.7+ with project references (`tsconfig.json` references all packages)
- Vite for UI bundling
- esbuild for production server build
- Embedded PostgreSQL via patched `embedded-postgres` package (for zero-config dev)
- Playwright for E2E tests, Vitest for unit tests

---

## 2. Core Features

### 2.1 The Company Abstraction

Paperclip models **autonomous AI companies**. A single deployment runs multiple companies with complete data isolation. Every entity in the system is company-scoped.

A company has:
- **Goal hierarchy** -- company-level mission decomposed into team/agent/task goals
- **Org chart** -- strict tree via `reports_to` (nullable root = CEO)
- **Budget** -- monthly token budget in cents, per-agent and per-company
- **Issue prefix** -- unique prefix for human-readable issue identifiers (e.g., `PAP-123`)
- **Brand color** and logo
- **Governance settings** -- e.g., `require_board_approval_for_new_agents`

### 2.2 Agent Management

Agents are employees. Each has:
- **Adapter type + config** -- how the agent executes (Claude Code, Codex, Cursor, etc.)
- **Role and title** -- organizational position
- **Reports-to chain** -- strict tree hierarchy
- **Capabilities description** -- what the agent can do (for other agents to discover)
- **Budget** -- monthly token budget with hard-stop enforcement
- **Status lifecycle** -- `idle`, `active`, `paused`, `running`, `error`, `terminated`
- **Permissions** -- JSONB permissions map
- **Runtime config** -- JSONB for heartbeat settings, session compaction, etc.

### 2.3 Issue/Task System

Issues are the core work unit (equivalent to tickets). They have:
- **Hierarchical parent-child** relationships
- **Goal linkage** -- every task traces back to a company goal
- **Project assignment**
- **Atomic checkout** -- single assignee, `checkout_run_id` prevents double-work
- **Status workflow**: `backlog` -> `todo` -> `in_progress` -> `in_review` -> `done` (also `blocked`, `cancelled`)
- **Comments, documents, attachments, labels**
- **Work products** -- tangible outputs of work
- **Execution workspaces** -- git worktrees/directories where work happens

### 2.4 Heartbeat System

The heartbeat is the core execution loop. Agents don't run continuously -- they wake on schedule (cron) or event triggers, do work, and exit.

Each heartbeat run creates a `heartbeat_runs` record tracking:
- Invocation source (timer, assignment, on_demand, automation)
- Status (queued, running, completed, failed, cancelled)
- Process PID, exit code, signal
- Session state (before/after session IDs for resume)
- Usage (input/output/cached tokens)
- Full stdout/stderr capture with log storage
- Context snapshot (which issue, project, goal was active)

### 2.5 Routines

Routines are scheduled recurring work -- defined per project with:
- **Cron triggers** with timezone support
- **Webhook triggers** with HMAC signing
- **Concurrency policy** (coalesce_if_active, skip, queue)
- **Catch-up policy** (skip_missed, catch_up)
- **Run history** with linked issues

### 2.6 Budget & Cost Control

Multi-level budget enforcement:
- **Budget policies** scoped to company, agent, or project with configurable windows (monthly, lifetime)
- **Cost events** tracking provider, model, input/output tokens, cost in cents
- **Hard-stop enforcement** -- auto-pause agents when budget is exceeded
- **Warning thresholds** (default 80%)
- **Budget incidents** -- logged when thresholds are breached

### 2.7 Governance & Approvals

Board (human operator) has ultimate control:
- **Approval gates** for hires, strategy changes
- **Approval comments** -- discussion thread on approvals
- **Issue approvals** -- specific issue-level approval requirements
- **Agent pause/terminate** -- override any agent at any time
- **Activity log** -- immutable audit trail of all mutations

### 2.8 Multi-Tenancy

True multi-company isolation:
- Every DB table has `company_id` foreign key
- All routes enforce company-scoping
- Agent API keys are company-scoped
- WebSocket live events are company-scoped

---

## 3. Agent Lifecycle & Communication

### 3.1 Agent Creation

Agents are created via the API or UI. Key flow:
1. Select adapter type (claude_local, codex_local, cursor, openclaw_gateway, etc.)
2. Configure adapter (command, cwd, model, prompt template, env vars)
3. Set organizational position (reports_to, role, title)
4. Set budget
5. If `require_board_approval_for_new_agents` is enabled, an approval is created

### 3.2 Heartbeat Execution Flow

The heartbeat service (`server/src/services/heartbeat.ts`, 135KB -- the largest single file) orchestrates:

1. **Wakeup** -- Timer, assignment, or manual trigger creates a wakeup request
2. **Concurrency check** -- Per-agent start lock prevents parallel runs (configurable max 1-10)
3. **Budget enforcement** -- Atomic check against budget policies before execution
4. **Workspace resolution** -- Determine CWD (project workspace, task session, agent home)
5. **Session resume** -- Load previous session params for session-aware adapters (Claude, Codex)
6. **Context assembly** -- Build the prompt with goal ancestry, issue context, company skills
7. **JWT generation** -- Short-lived run JWT for agent API access
8. **Adapter execution** -- Spawn the agent process or send HTTP request
9. **Live streaming** -- stdout/stderr streamed via WebSocket to the dashboard
10. **Result processing** -- Parse exit code, usage, session state, errors
11. **Cost recording** -- Create cost_events records
12. **Session persistence** -- Save new session state for next resume
13. **Status update** -- Update heartbeat_run record

### 3.3 Agent Instructions

The `agent-instructions.ts` service (26KB) manages how agents receive their system prompts:

- **Managed mode** -- Instructions stored in `~/.paperclip/instances/default/companies/{companyId}/agents/{agentId}/instructions/`
- **External mode** -- Instructions at a path on the filesystem
- **AGENTS.md** -- Default entry file convention
- **Legacy prompt templates** -- Backward-compatible with older `promptTemplate` config

### 3.4 Communication Model

Agents communicate through **issues and comments** -- not through direct messaging:
- Agents post comments on issues they're working on
- `@`-mentions in comments trigger wakeup requests for the mentioned agent
- Issue assignment triggers wakeup
- Comments carry full context (markdown, attachments)
- No separate chat system by design

### 3.5 Delegation

Agents can delegate work by creating subtasks:
- `POST /api/companies/{companyId}/issues` with `parentId` and `assigneeAgentId`
- Subtasks inherit goal linkage
- Parent task tracks child completion

---

## 4. Database Layer

### 4.1 ORM & Connection

- **Drizzle ORM** (`drizzle-orm` 0.38.4) with PostgreSQL driver
- **Embedded PostgreSQL** (`embedded-postgres` 18.1.0-beta.16, patched) for zero-config dev
- External PostgreSQL via `DATABASE_URL` environment variable
- Supports Supabase connection pooling (disable prepared statements)
- Data directory: `~/.paperclip/instances/default/db/`

### 4.2 Complete Table Inventory (60 tables)

**Core Business Entities:**
| Table | Purpose |
|-------|---------|
| `companies` | Company registry with budget, status, issue prefix |
| `agents` | Agent registry with adapter config, org position, budget |
| `projects` | Project container linked to goals |
| `goals` | Hierarchical goal tree (company -> team -> agent -> task) |
| `issues` | Core task/ticket entity with full lifecycle |
| `issue_comments` | Comment threads on issues |
| `issue_documents` | Rich documents attached to issues |
| `document_revisions` | Version history for documents |
| `documents` | Standalone documents |
| `labels` | Issue labels |
| `issue_labels` | Issue-label junction |
| `issue_attachments` | File attachments on issues |
| `issue_work_products` | Tangible outputs (files, links, artifacts) |
| `issue_approvals` | Per-issue approval requirements |
| `issue_inbox_archives` | Archived inbox entries |
| `issue_read_states` | Per-user read tracking |
| `assets` | Uploaded files (images, etc.) |

**Agent Execution:**
| Table | Purpose |
|-------|---------|
| `heartbeat_runs` | Every agent execution with full trace |
| `heartbeat_run_events` | Sub-events within a heartbeat run |
| `agent_runtime_state` | Persisted runtime state between heartbeats |
| `agent_task_sessions` | Session params per agent/task (for resume) |
| `agent_wakeup_requests` | Queued wakeup triggers |
| `agent_config_revisions` | Config change history (rollback support) |

**Workspaces:**
| Table | Purpose |
|-------|---------|
| `project_workspaces` | Project-level workspace definitions (cwd, repo) |
| `execution_workspaces` | Per-issue execution workspaces (git worktrees) |
| `workspace_operations` | Git operations log |
| `workspace_runtime_services` | Runtime services (dev servers, etc.) per workspace |

**Financial:**
| Table | Purpose |
|-------|---------|
| `cost_events` | Per-run token usage and cost |
| `finance_events` | Revenue/expense tracking |
| `budget_policies` | Budget rules per scope (company/agent/project) |
| `budget_incidents` | Budget threshold breach records |

**Auth & Access:**
| Table | Purpose |
|-------|---------|
| `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications` | Better Auth tables |
| `agent_api_keys` | Hashed API keys for agent auth |
| `board_api_keys` | Board operator API keys |
| `company_memberships` | User-company membership |
| `instance_user_roles` | Instance-level user roles |
| `instance_settings` | Global instance configuration |
| `principal_permission_grants` | Fine-grained permission grants |
| `cli_auth_challenges` | CLI auth flow challenges |
| `invites` | User invitations |
| `join_requests` | Agent join requests (for OpenClaw gateway) |

**Governance:**
| Table | Purpose |
|-------|---------|
| `approvals` | Board approval records |
| `approval_comments` | Discussion on approvals |
| `activity_log` | Immutable audit trail |

**Secrets:**
| Table | Purpose |
|-------|---------|
| `company_secrets` | Secret metadata |
| `company_secret_versions` | Encrypted secret versions |

**Skills:**
| Table | Purpose |
|-------|---------|
| `company_skills` | Managed skill definitions per company |

**Routines:**
| Table | Purpose |
|-------|---------|
| `routines` | Scheduled recurring work definitions |
| `routine_triggers` | Cron/webhook triggers for routines |
| `routine_runs` | Routine execution history |

**Plugins:**
| Table | Purpose |
|-------|---------|
| `plugins` | Installed plugin registry |
| `plugin_config` | Per-plugin configuration |
| `plugin_company_settings` | Per-company plugin settings |
| `plugin_state` | Scoped key-value state store |
| `plugin_entities` | Plugin-managed entities |
| `plugin_jobs` / `plugin_job_runs` | Background job scheduling |
| `plugin_webhook_deliveries` | Inbound webhook logs |
| `plugin_logs` | Plugin log entries |

### 4.3 Migration Workflow

```bash
# 1. Edit packages/db/src/schema/*.ts
# 2. Ensure exports in packages/db/src/schema/index.ts
# 3. Generate migration:
pnpm db:generate
# 4. Apply migration:
pnpm db:migrate
```

Drizzle reads compiled schema from `dist/schema/*.js`. The config at `packages/db/drizzle.config.ts` handles this.

---

## 5. Plugin System

### 5.1 Architecture

The plugin system is the most substantial engineering effort in the codebase (~20 service files, ~300KB of code). It implements a full out-of-process plugin runtime:

**Host side (server):**
- `plugin-loader.ts` (70KB) -- Discovers, installs, and resolves plugin packages
- `plugin-worker-manager.ts` (40KB) -- Manages plugin worker processes via JSON-RPC over stdio
- `plugin-lifecycle.ts` (29KB) -- Init, shutdown, health checks
- `plugin-registry.ts` (20KB) -- Plugin CRUD and status management
- `plugin-host-services.ts` (41KB) -- Implements the host-side API surface plugins call
- `plugin-event-bus.ts` (15KB) -- Event routing with server-side filtering
- `plugin-job-scheduler.ts` (21KB) -- Cron-based job scheduling
- `plugin-job-coordinator.ts` (8KB) -- Job execution orchestration
- `plugin-tool-dispatcher.ts` (15KB) -- Plugin-provided tools for agent execution
- `plugin-tool-registry.ts` (15KB) -- Tool discovery and validation
- `plugin-state-store.ts` (7KB) -- Scoped key-value state persistence
- `plugin-secrets-handler.ts` (12KB) -- Secret resolution for plugins
- `plugin-capability-validator.ts` (14KB) -- Capability-based access control
- `plugin-manifest-validator.ts` (5KB) -- Manifest schema validation
- `plugin-config-validator.ts` (2KB) -- Config schema validation
- `plugin-dev-watcher.ts` (10KB) -- Hot-reload during development
- `plugin-runtime-sandbox.ts` (7KB) -- Sandboxed execution environment
- `plugin-stream-bus.ts` (2KB) -- Stream routing

**Plugin SDK (`@paperclipai/plugin-sdk`):**
- `define-plugin.ts` -- `definePlugin()` factory for plugin authors
- `worker-rpc-host.ts` (40KB) -- JSON-RPC protocol handler
- `host-client-factory.ts` (22KB) -- Client-side API wrappers
- `protocol.ts` (30KB) -- JSON-RPC message format
- `types.ts` (38KB) -- Full type definitions
- `testing.ts` (29KB) -- Test harness for plugin development
- `bundlers.ts` -- Bundler presets (esbuild, rollup)
- `dev-server.ts` -- Dev server for plugin UI development
- UI components in `sdk/src/ui/`

### 5.2 Plugin Manifest

Plugins declare their capabilities via a manifest (`PaperclipPluginManifestV1`):

```typescript
{
  id: string;                    // Unique plugin key
  name: string;                  // Display name
  version: string;               // Semver version
  apiVersion: number;            // SDK API version
  categories: PluginCategory[];  // Categorization
  capabilities: PluginCapability[]; // Required capabilities
  ui?: PluginUiDeclaration;      // UI slots and pages
  jobs?: PluginJobDeclaration[]; // Background jobs
  webhooks?: PluginWebhookDeclaration[]; // Inbound webhooks
  tools?: PluginToolDeclaration[];   // Tools for agent execution
  launchers?: PluginLauncherDeclaration[]; // UI launcher actions
  configSchema?: JsonSchema;     // Configuration schema
  companyConfigSchema?: JsonSchema; // Per-company config schema
}
```

### 5.3 Plugin Capabilities

Plugins request specific capabilities (capability-gated access):
- Event subscriptions (issue.created, agent.started, etc.)
- State management (scoped key-value store)
- HTTP fetch
- Secret resolution
- Job scheduling
- Tool registration (exposed to agents during execution)
- UI slots (sidebar, issue detail, agent detail, etc.)
- Data endpoints (custom API endpoints for UI)

### 5.4 Plugin Event Types

Core domain events plugins can subscribe to:
- `issue.created`, `issue.updated`, `issue.status_changed`, `issue.assigned`
- `agent.created`, `agent.updated`, `agent.started`, `agent.stopped`
- `project.created`, `project.updated`
- `heartbeat_run.completed`, `heartbeat_run.failed`
- `approval.created`, `approval.resolved`
- `comment.created`
- Plugin-to-plugin events: `plugin.<pluginId>.<eventName>`

### 5.5 Example Plugins

4 examples ship in `packages/plugins/examples/`:
- **hello-world** -- Minimal plugin demonstrating setup, events, and state
- **file-browser** -- Browse project files from the dashboard
- **kitchen-sink** -- Demonstrates all capabilities (jobs, webhooks, tools, UI)
- **authoring-smoke** -- CI smoke test for plugin authoring

### 5.6 Plugin Scaffolding

`create-paperclip-plugin` CLI tool generates a new plugin project:
```bash
npx create-paperclip-plugin my-plugin
```

---

## 6. Adapters

### 6.1 Adapter Interface

Every adapter implements `ServerAdapterModule` (from `packages/adapter-utils/src/types.ts`):

```typescript
interface ServerAdapterModule {
  type: string;                      // Unique adapter type identifier
  execute(ctx): Promise<Result>;     // Core execution function
  testEnvironment(ctx): Promise<Result>; // Health check
  listSkills?(ctx): Promise<Snapshot>;   // Discover available skills
  syncSkills?(ctx, desired): Promise<Snapshot>; // Sync desired skills
  sessionCodec?: AdapterSessionCodec;    // Session serialize/deserialize
  sessionManagement?: AdapterSessionManagement; // Session compaction policy
  supportsLocalAgentJwt?: boolean;   // Can accept run JWTs
  models?: AdapterModel[];           // Available models
  listModels?(): Promise<AdapterModel[]>; // Dynamic model discovery
  agentConfigurationDoc?: string;    // Configuration documentation
  onHireApproved?(payload, config): Promise<Result>; // Lifecycle hook
  getQuotaWindows?(): Promise<ProviderQuotaResult>; // Provider rate limits
  detectModel?(): Promise<{model, provider, source} | null>; // Auto-detect
}
```

### 6.2 Adapter Inventory

| Adapter | Type Key | How It Works |
|---------|----------|-------------|
| **Claude Local** | `claude_local` | Spawns `claude` CLI process with `--print`, `--output-format stream-json`, session resume via `--resume` flag. Parses streaming JSON for usage, tool calls, and results. Skills injected via temp dir symlinks to `skills/`. Supports Anthropic API key or subscription auth. |
| **Codex Local** | `codex_local` | Spawns `codex` CLI with `--quiet`, `--full-auto`. Session resume via session files. Supports `OPENAI_API_KEY` or subscription. |
| **Cursor Local** | `cursor` | Spawns `cursor` CLI. Session resume supported. |
| **Gemini Local** | `gemini_local` | Spawns `gemini` CLI. Session resume supported. |
| **OpenCode Local** | `opencode_local` | Spawns `opencode` CLI. Session resume supported. Dynamic model discovery. |
| **Pi Local** | `pi_local` | Spawns `pi` CLI. Session resume supported. Dynamic model discovery. |
| **OpenClaw Gateway** | `openclaw_gateway` | HTTP/SSE-based. Sends execution request to running OpenClaw instance. Streams responses via SSE. Used for persistent OpenClaw agents. 47KB execute.ts -- the most complex adapter. |
| **Hermes** | `hermes_local` | Via `hermes-paperclip-adapter` npm package. Third-party adapter. |
| **Process** | `process` | Generic fallback. Spawns any shell command. |
| **HTTP** | `http` | Generic fallback. Sends POST to a URL with the execution payload. |

### 6.3 Session Management

Session compaction is a critical feature (`packages/adapter-utils/src/session-compaction.ts`):

- Claude and Codex have **confirmed native context management** (they compact themselves)
- Cursor, Gemini, OpenCode, Pi have **unknown** native management
- Paperclip enforces thresholds: `maxSessionRuns` (200), `maxRawInputTokens` (2M), `maxSessionAgeHours` (72)
- When thresholds are exceeded, the session is rotated (new session started)
- Per-agent overrides available in `runtimeConfig.heartbeat.sessionCompaction`

### 6.4 Skill Injection

The Claude adapter builds a temp directory with `.claude/skills/` symlinks:
```
/tmp/paperclip-skills-xxxx/.claude/skills/
  paperclip -> skills/paperclip/SKILL.md
  para-memory-files -> skills/para-memory-files/SKILL.md
  paperclip-create-agent -> skills/paperclip-create-agent/SKILL.md
```

These are injected via `--add-dir` so Claude Code discovers them as registered skills.

---

## 7. Dashboard / UI

### 7.1 Tech Stack

- **React 19** with Vite
- No UI framework (custom CSS, no Tailwind, no Shadcn)
- Custom design system documented in `DesignGuide.tsx` (55KB)
- React Router for client-side routing
- WebSocket for real-time updates
- Responsive/mobile-ready

### 7.2 Pages (40+ pages)

| Page | File | Description |
|------|------|-------------|
| Dashboard | `Dashboard.tsx` (15KB) | Company overview with metrics |
| Agents | `Agents.tsx` (16KB) | Agent list with status |
| Agent Detail | `AgentDetail.tsx` (162KB) | **Largest UI file** -- full agent management, config, runs, transcript viewer, skills, budget, instructions |
| Issues | `Issues.tsx` (4KB) | Issue list |
| Issue Detail | `IssueDetail.tsx` (45KB) | Issue detail with comments, documents, workspace |
| Inbox | `Inbox.tsx` (49KB) | User inbox with issue assignments |
| Projects | `Projects.tsx` (2.8KB) | Project list |
| Project Detail | `ProjectDetail.tsx` (23KB) | Project detail with issues, workspaces |
| Goals | `Goals.tsx` (2KB) | Goal tree |
| Goal Detail | `GoalDetail.tsx` (6.5KB) | Goal with linked projects/issues |
| Org Chart | `OrgChart.tsx` (15KB) | Visual org chart |
| Costs | `Costs.tsx` (49KB) | Cost breakdown by agent/provider/model |
| Approvals | `Approvals.tsx` (5KB) | Approval queue |
| Approval Detail | `ApprovalDetail.tsx` (15KB) | Approval review |
| Routines | `Routines.tsx` (29KB) | Routine management |
| Routine Detail | `RoutineDetail.tsx` (41KB) | Routine config, triggers, run history |
| Company Skills | `CompanySkills.tsx` (43KB) | Skill manager |
| Company Settings | `CompanySettings.tsx` (24KB) | Company configuration |
| Company Export | `CompanyExport.tsx` (37KB) | Export company as portable package |
| Company Import | `CompanyImport.tsx` (50KB) | Import company from package |
| Plugin Manager | `PluginManager.tsx` (22KB) | Install/manage plugins |
| Plugin Settings | `PluginSettings.tsx` (35KB) | Per-plugin configuration |
| Plugin Page | `PluginPage.tsx` (5.5KB) | Plugin-provided UI pages |
| Instance Settings | `InstanceSettings.tsx` (11KB) | Global instance config |
| Onboarding Wizard | `OnboardingWizard.tsx` (57KB) | First-run setup wizard |
| Auth | `Auth.tsx` (7KB) | Login/signup |

### 7.3 Key UI Components

- `AgentConfigForm.tsx` (63KB) -- Full agent configuration form with adapter-specific fields
- `IssuesList.tsx` (38KB) -- Kanban board + list view for issues
- `KanbanBoard.tsx` (7KB) -- Drag-and-drop kanban
- `CommandPalette.tsx` (7KB) -- Cmd+K command palette
- `CompanyRail.tsx` (11KB) -- Left sidebar with company switcher
- `OnboardingWizard.tsx` (57KB) -- Multi-step guided setup
- `RunTranscriptUxLab.tsx` (14KB) -- Live agent transcript viewer
- `LiveRunWidget.tsx` (6.6KB) -- Real-time run status indicator
- `NewIssueDialog.tsx` (59KB) -- Full issue creation with rich editor

### 7.4 Real-time Updates

WebSocket connection at `/api/companies/{companyId}/events/ws`:
- Authenticated via Bearer token (agent API key or board session)
- Receives `LiveEvent` objects: `{ id, companyId, type, createdAt, payload }`
- Event types include: agent status changes, run updates, issue updates, approval changes
- Ping/pong heartbeat for connection health

---

## 8. Memory and Context

### 8.1 Current Approach

Paperclip's memory approach is **explicit and structural** rather than embedding-based:

1. **Goal ancestry** -- Every task carries its full goal chain (task -> parent -> project -> goal -> company mission). Agents always know *why* they're working.

2. **Session resume** -- `agent_task_sessions` table persists session params per agent/task/adapter. When an agent wakes up for the same task, it resumes the previous session (Claude Code `--resume`, Codex session files).

3. **Issue context** -- `GET /api/issues/{issueId}/heartbeat-context` returns compact issue state, ancestor summaries, goal/project info, and comment cursor metadata -- purpose-built for agent consumption.

4. **Comment threads** -- The persistent conversation on an issue. Agents read incrementally using cursor-based pagination (`?after={last-seen-comment-id}`).

5. **Documents** -- Rich documents attached to issues with revision history.

6. **Agent instructions** -- Managed instruction bundles stored per agent, loaded at execution time.

7. **Context snapshot** -- Each heartbeat run records a `context_snapshot` JSONB with the active issue, project, and goal IDs.

8. **Runtime state** -- `agent_runtime_state` table for per-agent persistent key-value state.

### 8.2 Memory Landscape Analysis

`doc/memory-landscape.md` (9KB) surveys 8 memory systems (mem0, MemOS, supermemory, memU, nuggets, memsearch, OpenViking, Memori) and concludes Paperclip should provide a **control-plane memory surface** that:
- Stays company-scoped
- Lets each company choose a default memory provider
- Lets agents override with their own provider
- Keeps provenance back to Paperclip entities
- Works via plugins, not built-in

The memory system is explicitly **not yet built** -- it's positioned as a plugin capability.

### 8.3 Session Compaction

For long-running agents, session compaction prevents context rot:
- Tracked via `maxSessionRuns`, `maxRawInputTokens`, `maxSessionAgeHours`
- Claude/Codex have native context management (confirmed)
- Other adapters get Paperclip-managed compaction with configurable thresholds
- Session rotation creates a handoff markdown summary for the new session

---

## 9. Strongest Patterns Worth Stealing

### 9.1 The Heartbeat Model

**The single best pattern in the codebase.** Instead of agents running continuously (expensive, hard to monitor), agents wake on schedule/events, do work, and exit. This enables:
- Clear cost tracking per execution
- Session persistence across reboots
- Parallel agents without resource contention
- Dead agent detection via heartbeat_runs status

**Key file:** `server/src/services/heartbeat.ts` (135KB)

### 9.2 Atomic Task Checkout

```sql
-- issues table has checkout_run_id + execution_locked_at
-- Only one agent can checkout at a time
POST /api/issues/{issueId}/checkout
{ "agentId": "{id}", "expectedStatuses": ["todo", "backlog"] }
-- Returns 409 Conflict if already checked out by another agent
```

This prevents double-work when multiple agents might pick the same task. Critical for multi-agent systems.

### 9.3 Company Portability (Import/Export)

`server/src/services/company-portability.ts` (164KB) implements full company serialization:
- Export: serializes agents, projects, goals, issues, routines, skills, org chart, secrets (scrubbed)
- Import: collision handling (skip, overwrite, rename), ID remapping
- Generates org chart PNG and README for the export package
- Enables "company templates" -- pre-built org structures

**This is the foundation for "ClipMart" -- downloadable company templates.**

### 9.4 Adapter Interface Pattern

The `ServerAdapterModule` interface is well-designed:
- Each adapter is a standalone package
- Clear contract: `execute`, `testEnvironment`, `listSkills`, `syncSkills`
- Session management is adapter-specific but with a shared policy layer
- Model discovery is adapter-specific
- Skills are injected at runtime, not baked in

### 9.5 Skill Injection

Skills are markdown files (`SKILL.md`) with YAML frontmatter. They're symlinked into the agent's runtime directory at execution time. The `paperclip` skill teaches agents the heartbeat procedure, API endpoints, and governance rules.

### 9.6 Budget Enforcement with Budget Policies

Multi-scoped budget policies with:
- Configurable windows (monthly, lifetime)
- Configurable metrics (billed_cents)
- Warning thresholds + hard-stop
- Automatic agent pausing
- Incident logging for audit

### 9.7 Plugin SDK with JSON-RPC

The out-of-process plugin model via JSON-RPC over stdio:
- Plugins run in separate Node.js processes
- Communication via structured JSON-RPC messages
- Capability-gated access (declare what you need in manifest)
- Event filtering server-side (filtered events never cross process boundary)
- Scoped state store (instance, company, project, issue level)
- Test harness built into the SDK

### 9.8 Activity Log as Audit Trail

Every mutation writes to `activity_log`:
- Actor (user or agent)
- Action type
- Entity type and ID
- Before/after snapshots
- Timestamp

### 9.9 Live Streaming Architecture

WebSocket per company for real-time updates:
- In-process EventEmitter for publish
- Company-scoped subscription
- Agent stdout/stderr streamed live to dashboard
- Simple but effective for single-instance deployment

---

## 10. Weaknesses and Limitations

### 10.1 Single-Instance Architecture

- No clustering support
- In-process scheduler (no external queue)
- EventEmitter-based live events (no Redis/NATS)
- Embedded PostgreSQL default limits scaling
- Not designed for horizontal scaling

### 10.2 No Real Memory System

The memory landscape survey is thoughtful but memory is purely structural (goal ancestry, comments). There's no:
- Embedding-based retrieval
- Automatic memory extraction from conversations
- Cross-task knowledge persistence
- Learning across heartbeats beyond session resume

### 10.3 Massive File Sizes

Several files are extremely large and would benefit from decomposition:
- `heartbeat.ts`: 135KB (single service file)
- `company-portability.ts`: 164KB
- `company-skills.ts`: 82KB
- `AgentDetail.tsx`: 162KB (single React component)
- `agents.ts` (routes): 93KB
- `issues.ts` (routes): 57KB
- `access.ts` (routes): 93KB
- `plugins.ts` (routes): 73KB

### 10.4 No Real-Time Agent Interaction

Agents communicate through comments on issues -- no direct agent-to-agent messaging, no shared workspace awareness, no real-time coordination. A manager agent can only delegate via subtask creation, not live conversation.

### 10.5 Security Model is Coarse

- V1 is single board operator per deployment
- Agent API keys grant full company access (no fine-grained scoping)
- No per-field permissions on entities
- Plugin sandboxing exists but is Node.js process-level (not VM-level)

### 10.6 No Cloud Agents

All adapters (except OpenClaw gateway) assume local CLI execution:
- Agents must be installed on the same machine
- No sandbox/container execution
- No cloud agent provisioning
- No Cursor-in-cloud or Claude-in-cloud

### 10.7 UI Without Design System Library

Custom CSS throughout, no Tailwind or component library. The `DesignGuide.tsx` documents the design system but components aren't extracted into reusable packages. Some pages are monolithic React components (162KB `AgentDetail.tsx`).

### 10.8 Test Coverage

- Vitest unit tests exist but coverage appears limited
- E2E tests via Playwright
- PromptFoo evals for heartbeat prompt quality (creative approach)
- No integration test suite for the full heartbeat loop

### 10.9 Deployment Complexity

For production use beyond local:
- Need external PostgreSQL
- Need storage configuration (S3 or local disk)
- Need `BETTER_AUTH_SECRET`
- Need agent runtimes installed globally
- Docker image installs Claude Code, Codex, and OpenCode globally in production layer

---

## Key File Reference

| Path | Size | Purpose |
|------|------|---------|
| `server/src/services/heartbeat.ts` | 135KB | Core execution engine |
| `server/src/services/company-portability.ts` | 164KB | Import/export companies |
| `server/src/services/company-skills.ts` | 82KB | Skill management |
| `server/src/services/budgets.ts` | 31KB | Budget enforcement |
| `server/src/services/agent-instructions.ts` | 26KB | Instruction bundles |
| `server/src/services/workspace-runtime.ts` | 51KB | Git worktree management |
| `server/src/services/routines.ts` | 47KB | Scheduled work |
| `server/src/services/plugin-loader.ts` | 70KB | Plugin discovery/install |
| `server/src/services/plugin-worker-manager.ts` | 40KB | Plugin process management |
| `server/src/services/plugin-host-services.ts` | 41KB | Plugin host API |
| `server/src/adapters/registry.ts` | 6KB | Adapter registry |
| `packages/adapter-utils/src/types.ts` | 11KB | Core adapter interfaces |
| `packages/adapter-utils/src/session-compaction.ts` | 6KB | Session management |
| `packages/adapters/claude-local/src/server/execute.ts` | 20KB | Claude Code adapter |
| `packages/adapters/openclaw-gateway/src/server/execute.ts` | 47KB | OpenClaw adapter |
| `packages/plugins/sdk/src/types.ts` | 38KB | Plugin SDK types |
| `packages/plugins/sdk/src/define-plugin.ts` | 8KB | Plugin factory |
| `packages/db/src/schema/index.ts` | 3KB | Schema exports (60 tables) |
| `packages/shared/src/index.ts` | 15KB | Shared exports |
| `ui/src/pages/AgentDetail.tsx` | 162KB | Agent detail page |
| `skills/paperclip/SKILL.md` | 23KB | Agent coordination skill |
| `doc/SPEC-implementation.md` | 27KB | V1 implementation contract |
| `doc/PRODUCT.md` | 8KB | Product definition |
| `doc/GOAL.md` | 3KB | Vision document |

---

## Summary for Raw Claw v2 Planning

**Steal these patterns:**
1. Heartbeat execution model (schedule -> wake -> work -> exit -> report)
2. Atomic task checkout preventing double-work
3. Company portability (import/export entire orgs)
4. Adapter interface with per-adapter session management
5. Skill injection via symlinked markdown files
6. Budget policies with multi-scope enforcement
7. Plugin SDK with JSON-RPC + capability-based access
8. Activity log as immutable audit trail

**Improve on these weaknesses:**
1. Add real memory/knowledge system (embeddings, RAG, cross-task learning)
2. Decompose massive files into focused modules
3. Add real-time agent-to-agent communication
4. Build cloud agent support from day one
5. Use proper UI component library (Shadcn/Tailwind)
6. Design for horizontal scaling (external queue, Redis pub/sub)
7. Add comprehensive integration tests
8. Fine-grained agent permissions
