# Raw Claw v1 + Dineline Infrastructure -- Comprehensive Deep Dive

**Generated:** 2026-03-30
**Purpose:** Complete technical and business audit to plan Raw Claw v2
**Files analyzed:** 90+ across `rawclaw/` and `dineline/` directories

---

## Table of Contents

1. [What Raw Claw v1 Actually Delivers](#1-what-raw-claw-v1-actually-delivers-to-a-client-today)
2. [Dineline-Specific Infrastructure](#2-dineline-specific-infrastructure)
3. [Gaps Identified in Scope Documents](#3-gaps-identified-in-scope-documents)
4. [How the Productized Deployment Works](#4-how-the-productized-deployment-works)
5. [Monitoring and Heartbeat System](#5-monitoring-and-heartbeat-system)
6. [Integrations Built](#6-integrations-built)
7. [CLAUDE.md Role Template System](#7-claudemd-role-template-system)
8. [What's Missing to Make This Sellable](#8-whats-missing-to-make-this-sellable-to-the-next-client)
9. [What Can Be Stolen from Paperclip and Claude Claw](#9-what-can-be-stolen-from-paperclip-and-claude-claw)
10. [Priority Improvements for v2](#10-priority-list-top-10-improvements)

---

## 1. What Raw Claw v1 Actually Delivers to a Client Today

### The Core Product

Raw Claw v1 is an **"AI Department in a Box"** -- a productized service that deploys Claude Code agents on Mac Minis inside a client's business. Each employee ("seat") gets a dedicated AI assistant that runs 24/7, connects to their existing tools (CRM, ad platforms, PM tools, Stripe), and reports automatically to Slack/Discord.

### What a Client Gets (Concrete Deliverables)

| Deliverable | Status | File Path |
|-------------|--------|-----------|
| **Mac Mini setup script** (idempotent, 13-step) | Built | `dineline/setup/setup.sh` |
| **Role-scoped CLAUDE.md** per seat (CEO, COO, Technical, Employee) | Built | `dineline/templates/CLAUDE-{role}.md` |
| **Supabase database** (19+ tables, RLS, pgvector) | Built | `dineline/supabase/001-005*.sql` |
| **5 integration clients** (HubSpot, Google Ads, ClickUp, Stripe, Slack) | Built | `dineline/integrations/*.py` |
| **Heartbeat monitoring** (CPU/RAM/disk/Claude/Tailscale/Supabase/Slack) | Built | `dineline/monitoring/heartbeat.py` |
| **API health checker** (7 API tests daily) | Built | `dineline/monitoring/api_health.py` |
| **Uptime reporting** (24h/7d/30d calculations) | Built | `dineline/monitoring/uptime_report.py` |
| **Environment verifier** (colored PASS/FAIL per key) | Built | `dineline/scripts/verify_env.py` |
| **Install day runbook** (5-phase, 800 lines) | Built | `dineline/onboarding/install-day-runbook.md` |
| **Visual install guide** (Vercel-deployed HTML) | Built | `dineline/install-guide/index.html` |
| **Per-seat Getting Started guides** | Built | `dineline/clients/dineline/getting-started-{name}.md` |
| **Company LLM** (chat interface querying Supabase) | Built (Next.js) | `rawclaw/product/company-llm-vercel/` |
| **Company LLM template** (duplicatable per client) | Built | `rawclaw/product/company-llm-template/` |
| **Dashboard** (Mission Control from Claude Claw v2) | Available in product repo | `rawclaw/product/rawclaw/` |
| **Setter Dashboard** (applicant pipeline + scripts) | Built (Next.js) | `rawclaw/setter-dashboard/` |
| **Skill Page** (pre-call value asset) | Built (HTML) | `rawclaw/skill-page/index.html` |
| **Rawgrowth internal DB** (pipeline, revenue, team) | Built (CLI + SQL) | `rawclaw/supabase/` |

### Automated Outputs (Day 1)

| Output | Frequency | Destination |
|--------|-----------|-------------|
| Daily scorecard (spend, leads, anomalies) | Mon-Fri 7am ET | Slack #ai-department |
| Weekly company report (revenue, pipeline, risks) | Monday 8am ET | Slack #ai-department |
| Anomaly alerts (CPL spike, revenue pacing, budget overrun) | Immediate | Slack #alerts-ops |
| HubSpot CRM sync | Every 4 hours | Supabase hubspot_contacts |
| Google Ads metrics sync | Daily 7am | Supabase campaign_metrics |
| System heartbeat | Every 15 min | Discord #heartbeat |
| API health check | Daily 6am UTC | Supabase + Discord |

### Pricing as Sold

- **Dineline deal**: $7,000 setup + $4,000/month (3 seats, early-adopter pricing)
- **Productized Starter**: $5,000 setup + $3,000/month (1 seat)
- **Productized Growth**: $10,000 setup + $5,000/month (3 seats)
- **Productized Enterprise**: $20,000 setup + $8,000/month (5+ seats)
- **Floor pricing**: Starter $3K/$2K, Growth $7K/$3.5K, Enterprise $15K/$6K
- **Monthly margins**: 69-73% after API costs and Alexander's time
- **Key file**: `rawclaw/docs/pricing-packaging.md`

---

## 2. Dineline-Specific Infrastructure

### Phase 1: Infrastructure Layer -- COMPLETE
- `dineline/setup/setup.sh` -- v2.0.0, 13-step Mac Mini installer. Handles Homebrew, Node.js, Claude Code CLI, Tailscale, launchd plists, power management. Idempotent, supports `--dry-run`, `--uninstall`, `--force`, `--no-start`. Parameterized with `--client-name`, `--seat-name`, `--seat-role`.
- `dineline/setup/generate_env.py` -- Batch .env generator from JSON config. Creates per-seat env files with role-appropriate keys.
- `dineline/setup/scaffold_repo.py` -- Creates full client vault directory structure (seats, context, monitoring, integrations).
- **Key path**: `dineline/setup/env-config-example.json`

### Phase 2: Database Layer -- COMPLETE (5 migrations)
- `001_core_schema.sql` -- 19 tables with custom types (seat_role enum, agent_status enum, knowledge_category enum, api_conn_status enum). Includes pgvector for embeddings, pg_trgm for text search. Core tables: companies, seats, agents, agent_activity, knowledge_items, api_connections. Plus 8 "rawclaw original" tables: clients, contacts, sales_calls, deliverables, content_pipeline, revenue, tasks, notifications.
- `002_dineline_tables.sql` -- Dineline-specific tables: hubspot_contacts, campaign_metrics, department_scorecards, meeting_prep, playbook_items.
- `003_rls_policies.sql` -- RLS for all 19 tables with 4-role hierarchy. Helper functions: `get_user_seat()`, `get_user_company()`, `get_user_role()`, `is_executive()`.
- `004_seed_dineline.sql` -- Dineline company row, 3 seats (Brett/Jace/Nick), 3 agents, 6 API connections.
- `005_security_fixes.sql` -- SECURITY DEFINER search_path hardening + debug view removal.
- **Supabase project**: `nnaryjadylboqcoyvcuw`

### Phase 3: Integration Layer -- COMPLETE (5 modules)
All modules share `BaseClient` pattern with retry logic, rate limiting, and error hierarchy.
- `integrations/hubspot.py` -- ~417 lines. Contacts, deals, companies, pipeline, activities.
- `integrations/google_ads.py` -- ~486 lines. OAuth2 + GAQL queries, campaigns, spend, ROAS.
- `integrations/clickup.py` -- ~404 lines. Tasks, projects, comments, pagination.
- `integrations/stripe_reader.py` -- ~395 lines. READ-ONLY: charges, MRR, churn, subscriptions.
- `integrations/slack_adapter.py` -- ~514 lines. Messaging, DMs, blocks, file uploads.
- Each module is standalone-testable: `python3 -m dineline.integrations.hubspot --test`

### Phase 4: Agent Behavior Layer -- COMPLETE (4 templates)
- `templates/CLAUDE-ceo.md` -- Full access, service role key, 6 skill areas, 3-tier reporting cadence, 8 behavior rules, 8 boundaries.
- `templates/CLAUDE-coo.md` -- Full access, operations focus, anomaly detection, KPI scorecards.
- `templates/CLAUDE-technical.md` -- RLS-scoped via anon key + SEAT_ID, data sync operator, campaign execution.
- `templates/CLAUDE-employee.md` -- Minimal scope, task execution, Q&A.

### Phase 5: Monitoring Layer -- COMPLETE
- `monitoring/heartbeat.py` -- 504 lines. 8 checks (CPU, RAM, disk, uptime, Claude process, Tailscale, Supabase, Slack). Writes to local JSONL + Supabase heartbeat_history. Posts Discord embed with color-coded status. Keeps 30 days of history (2880 lines at 15-min intervals).
- `monitoring/api_health.py` -- 379 lines. 7 API checks (HubSpot, Slack, Supabase, Discord webhook, Anthropic, Google Ads, ClickUp). Upserts results to Supabase api_connections table.
- `monitoring/uptime_report.py` -- Calculates 24h/7d/30d uptime from heartbeat history.
- `monitoring/launchd/` -- 4 plists (agent, keepalive, heartbeat, cloudflared) + `install_plists.sh`.

### Phase 6: Onboarding Layer -- COMPLETE
- `onboarding/intake-form.md` -- 7-section client info capture.
- `onboarding/pre-install-checklist.md` -- 13-point readiness gate (hard go/no-go).
- `onboarding/install-day-runbook.md` -- 5-phase install, 800 lines, per-unit checklists with rollback procedures.

### Phase 7: Remote Management -- COMPLETE
- `docs/ssh-tailscale-guide.md` -- Mesh VPN setup + SSH management.
- `docs/tailscale-acl.json` -- ACL policy: Alexander can reach all machines, Macs cannot see each other.

### Phase 8: Skill Layer -- COMPLETE
- `.claude/commands/client-deploy.md` -- 7-step deployment orchestrator skill.

### Phase 9: Visual Install Guide -- COMPLETE
- `install-guide/index.html` -- 1,677 lines, 74KB. Dark mode, sticky nav, architecture diagram, interactive checklist with localStorage. Deployed to Vercel.

### Dineline Client Vault Structure
```
dineline/clients/dineline/
  seats/brett/CLAUDE.md     -- Populated CEO template
  seats/jace/CLAUDE.md      -- Populated COO template
  seats/nick/CLAUDE.md      -- Populated Technical template
  getting-started-brett.md
  getting-started-jace.md
  getting-started-nick.md
  install-day-brief.md
  context/
    brand-voice.md          -- Dineline brand voice guide
    active-campaigns.md     -- Current campaigns
    sop-campaign-setup.md   -- Campaign launch SOP
    sync-config.md          -- API sync schedules
    tools.md                -- Internal tools reference
```

---

## 3. Gaps Identified in Scope Documents

### From `dineline/scope.md` (6 gaps)

| Gap | Severity | Status | Description |
|-----|----------|--------|-------------|
| GAP 1: Supabase 005 security fix not applied | HIGH | SQL written, not applied | 6 Security Advisor findings. Non-destructive, idempotent. |
| GAP 2: verify_env.py | HIGH | BUILT | Now exists at `dineline/scripts/verify_env.py`. Tests all keys. |
| GAP 3: Trigger.dev scheduled tasks | HIGH | Files exist, need deploy + env vars | `dineline-daily-scorecard.ts`, `dineline-crm-sync.ts` (not found), `dineline-weekly-report.ts` (not found), `dineline-sqlite-cache.ts` |
| GAP 4: Client vault scaffold | MEDIUM | Template exists, needs Dineline execution | `scaffold_repo.py` exists but not run for Dineline specifically |
| GAP 5: Getting Started guides per role | MEDIUM | BUILT | 3 guides exist (Brett, Jace, Nick) |
| GAP 6: Vercel deploy of install guide | MEDIUM | DONE | Deployed at install-guide.vercel.app |

### From `dineline/product-overview/gap-audit.md` (16 gaps)

**Blocking (4):**
1. **GAP-B1**: All .env files have blank values -- NO API KEYS POPULATED. Every integration call fails.
2. **GAP-B2**: SEAT_ID values not assigned. Nick's RLS queries silently return nothing.
3. **GAP-B3**: Service role key placeholders in CLAUDE.md (resolved by fixing B1).
4. **GAP-B4**: Supabase migrations NOT applied to production project `nnaryjadylboqcoyvcuw`.

**Pre-Install (5):**
1. **GAP-M1**: Context files referenced in CLAUDE.md but not created (brand-voice, active-campaigns, sync-config) -- NOW EXISTS in `rawclaw/clients/dineline/clients/dineline/context/`.
2. **GAP-M2**: Meta Ads integration missing -- no `integrations/meta_ads.py` in dineline/, but one exists at `rawclaw/clients/dineline/integrations/meta_ads.py`.
3. **GAP-M3**: Trigger.dev env vars not set in dashboard.
4. **GAP-M4**: No integration smoke test script.
5. **GAP-M5**: Vercel install guide deploy -- RESOLVED.

**Promise vs Build (3):**
1. **GAP-P1**: Getting-started guides promise Perplexity/Exa capabilities -- keys not in .env files (rely on global Claude Code env).
2. **GAP-P2**: Nick's guide promises Google Sheets export -- no integration exists.
3. **GAP-P3**: Jace's guide promises custom alert thresholds -- hardcoded in TypeScript.

### From `rawclaw/scope.md` (Project-Level)

| Phase | Status | Gaps |
|-------|--------|------|
| Phase 0: Foundation | Partially complete | Setup wizard not working, dashboard not running, no screen recording for Dilan |
| Phase 1: Dineline Deployment | Not started | No Supabase deploy, no per-seat config, no intake pipeline |
| Phase 2: Product Hardening | Not started | Paperclip integration, Company LLM, Fathom API, client portal |
| Phase 2.5: Productization Docs | COMPLETE | 5 deliverables, 1,836 lines total |
| Phase 3: Scale & Sell | Not started | CLI, multi-tenant dashboard, offer page, AI DM setter |

---

## 4. How the Productized Deployment Works

### Current Process (Manual)

1. **Pre-Sale**: Dilan qualifies lead using scorecard (min 15/25). ICP: $3-15M/yr, agency/SaaS/service, 10-50 employees, physical office. Hard disqualifiers: no office, <$250K revenue, no CRM, wants free trial.
2. **Scoping**: Determine seat count (1-5+ based on team size), integrations needed, timeline (1-4 weeks).
3. **Intake**: 8-section form filled by Dilan -> `rawclaw/clients/{slug}/intake-form.md`. Covers company, team, tech stack, network, quick wins, credentials, compliance, brand.
4. **Handoff to Alexander**: Structured Slack message with slug, seats, package, integration key status, hardware status, quick wins.
5. **Pre-Install**: 13-point checklist. All starred sections must be Go or install is postponed.
6. **Install Day** (6-8 hours):
   - Phase 1: Chris on-site -- hardware/OS setup, Tailscale (45 min x seats)
   - Phase 2: Alexander remote -- SSH in, clone repo, transfer .env, run migrations (30 min)
   - Phase 3: Alexander remote -- CLAUDE.md, MCP servers, integration tests (60 min)
   - Phase 4: Chris on-site -- demo each seat holder their agent + quick win (20 min x seats)
   - Phase 5: Alexander remote -- full system test, failure simulation, baseline (30 min)
7. **Post-Install**: Daily check-ins for 7 days, Week 1 review call, monthly health checks thereafter.

### Future Process (One-Command CLI -- Designed, Not Built)

Spec at `rawclaw/docs/one-command-setup-spec.md`:

```bash
rawclaw setup \
  --client "Acme Corp" --slug acme --seats 3 \
  --seat "Nick:technical" --seat "Brett:ceo" --seat "Jace:coo" \
  --integrations hubspot,meta-ads,stripe,clickup,slack \
  --supabase-url "https://xxx.supabase.co" --supabase-key "eyJ..."
```

This would auto-generate the entire `rawclaw/clients/acme/` directory: env files, SQL migrations, CLAUDE.md templates, getting-started guides, monitoring scripts, integration modules, and install commands. Estimated ~610 lines of new Python to build.

### Key SOP Documents

| Document | Lines | Path |
|----------|-------|------|
| Client Deployment SOP (for Dilan) | 496 | `rawclaw/docs/sop-client-deployment.md` |
| Pricing & Packaging | 204 | `rawclaw/docs/pricing-packaging.md` |
| Demo Script (for Chris) | 398 | `rawclaw/docs/demo-script.md` |
| One-Command Setup Spec | 364 | `rawclaw/docs/one-command-setup-spec.md` |
| Client Onboarding Template | 374 | `rawclaw/docs/client-onboarding-template.md` |

---

## 5. Monitoring and Heartbeat System

### Architecture

```
Mac Mini (per seat)
  └── heartbeat.py (launchd, every 15 min)
        ├── 8 system checks:
        │   ├── CPU usage (top, macOS)
        │   ├── RAM usage (vm_stat, macOS)
        │   ├── Disk usage (df)
        │   ├── System uptime
        │   ├── Claude Code process (pgrep)
        │   ├── Tailscale connectivity (tailscale status --json)
        │   ├── Supabase health (REST API ping)
        │   └── Slack reachability (api.test)
        ├── Write snapshot → /tmp/heartbeat-{seat}.json
        ├── Append to JSONL history → /tmp/heartbeat-history-{seat}.jsonl (30 days, 2880 lines max)
        ├── Write to Supabase heartbeat_history table
        └── Post Discord embed (green if all OK, red + @here if any fail)
```

### API Health (Daily)

`api_health.py` runs 7 API checks at 06:00 UTC:
- HubSpot (`/crm/v3/objects/contacts?limit=1`)
- Slack (`/api/auth.test`)
- Supabase (REST root)
- Discord webhook (GET metadata)
- Anthropic (`/v1/models`)
- Google Ads (listAccessibleCustomers)
- ClickUp (`/api/v2/team`)

Results upsert into `api_connections` table with: `seat_name`, `api_name`, `status`, `reachable`, `auth_valid`, `latency_ms`, `last_checked`, `error`.

### Uptime Reporting

`uptime_report.py` reads heartbeat JSONL history and calculates:
- 24-hour uptime %
- 7-day uptime %
- 30-day uptime %
- Posts summary embed to Discord

### Thresholds

| Check | Warning Threshold |
|-------|------------------|
| CPU | >90% usage |
| RAM | >90% usage |
| Disk | >85% usage |

### launchd Plists (macOS services)

4 plist files in `monitoring/launchd/`:
1. `com.rawclaw.agent.plist` -- Main Claude Code agent (keepalive)
2. `com.rawclaw.keepalive.plist` -- Agent restart watchdog
3. `com.rawclaw.heartbeat.plist` -- Heartbeat every 15 min
4. `com.rawclaw.cloudflared.plist` -- Cloudflare tunnel (permanent URL)

`install_plists.sh` installs all plists with environment variable injection.

---

## 6. Integrations Built

### Integration Modules (`dineline/integrations/`)

| Module | Lines | Capabilities | Auth Method |
|--------|-------|-------------|-------------|
| `base.py` | ~200 | Shared HTTP retry (3 attempts), rate limiting, error hierarchy (IntegrationError, AuthenticationError, NotFoundError, RateLimitError), logging | N/A |
| `hubspot.py` | ~417 | Contacts CRUD, deals CRUD, companies, pipeline management, activities, batch operations | Bearer token (`HUBSPOT_API_KEY`) |
| `google_ads.py` | ~486 | OAuth2 token refresh, GAQL queries, campaign metrics, spend tracking, ROAS calculations, search terms | Developer token + OAuth2 refresh |
| `clickup.py` | ~404 | Spaces, lists, tasks CRUD, comments, pagination, bulk operations | API token (`CLICKUP_API_KEY`) |
| `stripe_reader.py` | ~395 | READ-ONLY: balance, charges, subscriptions, MRR calculation, churn rate, invoice history | Restricted secret key |
| `slack_adapter.py` | ~514 | Send messages, DMs, blocks, file uploads, reactions, channel history, thread replies | Bot token + App token |

### Integration in CLAUDE.md Templates

Templates reference additional integrations beyond what's built:

| Integration | In Templates? | Module Built? | Notes |
|-------------|--------------|--------------|-------|
| HubSpot | Yes | Yes | Fully built |
| Google Ads | Yes | Yes | Fully built |
| ClickUp | Yes | Yes | Fully built |
| Stripe | Yes | Yes | Read-only |
| Slack | Yes | Yes | Fully built |
| Meta Ads | Yes (CEO, COO, Technical) | Partial | `meta_ads.py` exists in rawclaw/clients/dineline/ but NOT in dineline/ |
| GoHighLevel | Yes (CEO, Technical) | No | Referenced in templates, no module built |
| Notion | Yes (CEO, Technical) | No | Referenced as available via MCP |
| Airtable | Yes (CEO, Technical) | No | Referenced as available |
| Perplexity | Yes (CEO, Technical) | No | Available via MCP |
| Fal.ai | Yes (CEO, Technical) | No | Referenced for image generation |
| ElevenLabs | Yes (CEO) | No | Referenced for voice content |
| Discord | Yes (all roles) | No standalone module | Used via webhook in heartbeat/api_health |

### Trigger.dev Scheduled Tasks (Referenced)

| Task | Schedule | Status |
|------|----------|--------|
| `dineline-daily-scorecard.ts` | Mon-Fri 7am ET | File exists |
| `dineline-sqlite-cache.ts` | Every 6 hours | File exists |
| CRM sync (dineline-crm-sync.ts) | Every 4 hours | Referenced in scope, file may not exist |
| Weekly report (dineline-weekly-report.ts) | Monday 8am ET | Referenced in scope, file may not exist |

---

## 7. CLAUDE.md Role Template System

### Template Architecture

4 role templates at `dineline/templates/`:

| Template | Access Level | Key Type | RLS Behavior |
|----------|-------------|----------|-------------|
| `CLAUDE-ceo.md` | Full company (all seats, all departments) | Service role key (RLS bypassed) | Can read/write everything |
| `CLAUDE-coo.md` | Full company (operations focus) | Service role key (RLS bypassed) | Same as CEO but different personality |
| `CLAUDE-technical.md` | Seat-scoped + shared resources | Anon key + SEAT_ID | RLS filters by seat_id on private tables |
| `CLAUDE-employee.md` | Minimal (tasks + Q&A only) | Anon key + SEAT_ID | Most restrictive RLS |

### Template Structure (Each Template Has)

1. **WHO YOU ARE SERVING** -- Seat name, company description, primary job
2. **PERSONALITY & OPERATING MODE** -- 6-8 behavioral directives (anticipate needs, proactive, concise, draft-first, etc.)
3. **DATA ACCESS** -- Explicit table-by-table access matrix (what you CAN and CANNOT access)
4. **API CONNECTIONS** -- Table of all services with env var names and access levels
5. **SUPABASE CONNECTION** -- URL, key, and RLS context explanation
6. **DATABASE TABLES AVAILABLE** -- Full table listing with descriptions and access notes
7. **SLACK CHANNEL MAPPING** -- Which channels to read/write
8. **SKILLS & CAPABILITIES** -- 6 skill areas (Content, Strategy, Reporting, Meeting Prep, Brand Voice, Automation)
9. **REPORTING CADENCE** -- Daily/Weekly/Monthly auto-generated reports
10. **BOUNDARIES** -- 8 explicit "DO NOT" rules
11. **AGENT BEHAVIOR RULES** -- 7-8 session-start and operational rules
12. **CONTEXT FILES** -- Files to read at session start (brand-voice, active-campaigns, etc.)
13. **CROSS-SEAT AWARENESS** -- What to monitor about other seats (CEO only)

### Placeholder System

Templates use `{{VARIABLE}}` placeholders:

| Placeholder | Filled By |
|-------------|-----------|
| `{{CLIENT_NAME}}` | Client company name |
| `{{CLIENT_SLUG}}` | URL-safe identifier |
| `{{SEAT_NAME}}` | Person's name |
| `{{SEAT_ID}}` | UUID from Supabase seats table |
| `{{COMPANY_DESCRIPTION}}` | Filled during intake |
| `{{SUPABASE_PROJECT_ID}}` | Extracted from Supabase URL |
| `{{SUPABASE_SERVICE_KEY}}` | For CEO/COO only |
| `{{SUPABASE_ANON_KEY}}` | For Technical/Employee |
| `{{CEO_SEAT_NAME}}` | Cross-seat reference |
| `{{COO_SEAT_NAME}}` | Cross-seat reference |
| `{{TECHNICAL_SEAT_NAME}}` | Cross-seat reference |
| `{{SEAT_SLUG}}` | URL-safe seat identifier |

### Template Quality

Templates are **production-grade**. Each is ~235 lines with:
- Explicit data access matrices (not vague "you can access everything")
- Concrete reporting schedules with Slack channel destinations
- Hardcoded boundaries that prevent data leakage, unauthorized actions, and key exposure
- Session-start behavior rules (check notifications, verify data freshness)
- Escalation protocols with specific thresholds and escalation paths

---

## 8. What's Missing to Make This Sellable to the Next Client

### Critical Path (Must Have for Client #2)

1. **`rawclaw setup` CLI** -- The one-command client scaffolder. Currently every client requires manual copy-paste of Dineline files, manual search-and-replace of names, manual SQL generation, manual .env creation. Spec is written (`rawclaw/docs/one-command-setup-spec.md`), code is not.

2. **Dashboard that actually runs** -- The Claude Claw v2 dashboard exists in `rawclaw/product/rawclaw/` but scope.md says "Get dashboard running" is not checked off. Without a visual dashboard, the demo is just terminal text.

3. **Populated .env files** -- Even Dineline's env files are blank (GAP-B1). Before ANY client goes live, Alexander must manually populate keys. There's no automated key collection workflow.

4. **Supabase migrations applied** -- The SQL is written but never applied to production. This is literally the database not existing.

5. **Company LLM deployed** -- Built as Next.js app at `rawclaw/product/company-llm-vercel/` with Anthropic + Gemini support, conversation history, tool_use for SQL queries. But not deployed for Dineline.

6. **Meta Ads integration** -- Restaurant marketing agency without Meta Ads monitoring is like a car without tires. Module exists in rawclaw/clients/dineline/ but not in the canonical dineline/ package.

### High-Value Additions

7. **Fathom API integration** -- Auto-populate Close CRM with call summaries. Chris identified this as critical in the team kickoff. No module exists.

8. **Integration smoke test script** -- Run all 5 integrations with `--test` flag in sequence. Currently no automated way to verify all APIs work before install day.

9. **Client portal** -- "Drop zip file, agents auto-configure" (from Phase 2 scope). Currently Alexander manually builds everything.

10. **Demo instance** -- Chris needs a live demo to sell. The demo script (`rawclaw/docs/demo-script.md`) assumes a running Dineline dashboard + Telegram agent. Neither is confirmed working.

### Nice-to-Have but Differentiating

11. **Interactive offer page / deck** -- Dilan feedback: current rawgrowth.ai/offer is too complicated. Needs top-down thinking structure.
12. **Case study with real numbers** -- Dineline ROI projection exists ($3,200-6,150/mo value) but no actual client testimonial.
13. **Video walkthrough** -- Chris to screen-record, Alexander to record builds. Not done yet.

---

## 9. What Can Be Stolen from Paperclip and Claude Claw

### From Paperclip (`paperclip/`)

Paperclip is an **open-source orchestration platform for "zero-human companies"** with a React UI + Express API. Key things to steal:

| Feature | Paperclip Has | Raw Claw Status | Priority |
|---------|--------------|-----------------|----------|
| **Visual company management** | Full React dashboard with org charts, budgets, goals, task kanban | Raw Claw has a basic Mission Control dashboard | HIGH -- this is the visual gap Chris cares about |
| **Multi-agent coordination** | Org chart with CEO/CTO/engineers/designers/marketers, single-assignee task model | Raw Claw has role-based seats but no visual org chart | MEDIUM |
| **Budget governance** | Per-agent budgets with hard-stop auto-pause | Raw Claw tracks tokens but has no budget caps | HIGH -- clients will ask about cost control |
| **Approval gates** | Review strategy before execution, governed actions | Raw Claw has boundaries in CLAUDE.md but no approval UI | MEDIUM |
| **Goal alignment** | Top-down goal -> task -> agent assignment | Raw Claw has tasks table but no goal hierarchy | LOW (Phase 3) |
| **Activity logging** | Mutation-level audit trail | Raw Claw has agent_activity table | Already exists |
| **Company templates (Clipmart)** | Download pre-built company configs with one click | Raw Claw's `rawclaw setup` CLI aims for this | HIGH -- build this as the CLI |
| **Agent adapters** | Works with Claude Code, Codex, Cursor, Bash, HTTP | Raw Claw only uses Claude Code | LOW (single-provider is fine for now) |
| **Docker deployment** | Dockerfile + docker-compose | Raw Claw uses Mac Mini + launchd | Different deployment model |
| **PGlite for dev** | Embedded Postgres for local development | Raw Claw requires live Supabase | NICE-TO-HAVE for development speed |

**Specific steal opportunities:**
- `packages/db/` Drizzle schema pattern (company-scoped everything) -- adapt for rawclaw CLI
- `server/` REST API structure for a future management API
- `ui/` React dashboard components -- fork for Raw Claw Mission Control v2
- Budget hard-stop mechanism -- implement in Trigger.dev scheduled tasks
- Agent API keys with hashing -- implement for multi-client management

### From Claude Claw v1 (Old Repo at `rawclaw/other/old-repo/rawclaw-v1/`)

The original Claude Claw is a Node.js bot with TypeScript. Key assets:

| Asset | Path | What to Steal |
|-------|------|---------------|
| **6 named agents** (Ali, Cleo, Larry, Ovi, Quilly, Sam) | `agents/*/CLAUDE.md` + `agent.yaml` | Agent personality patterns, dispatch system |
| **124 skills** | `skills/manifest.json` + `skills/meta/` + `skills/universal/` | Entire skill library -- already carried to v2 |
| **Setup wizard** (10-stage interactive CLI) | `lib/wizard.cjs` | Wizard UX flow for `rawclaw setup` CLI |
| **Template rendering engine** | `lib/render-templates.cjs` | `{{placeholder}}` replacement system |
| **Config-driven architecture** | `rawclaw.config.json` / `rawclaw.config.example.json` | One-file configuration for entire deployment |
| **Dashboard panels** | `dist/dashboard-html.*` | Chat panel, agent status, token tracking, memory stats, scheduled tasks |
| **Dispatch system** | `agents/shared/dispatch.sh` | Agent-to-agent task routing |
| **Knowledge templates** | `knowledge-templates/` | Brand voice, company overview, ICP profile, offer templates |
| **GHL integration skill** | `skills/meta/highlevel/` | GoHighLevel references + scripts + API wrapper |
| **Campaign orchestrator** | `skills/meta/campaign-orchestrator/` | Campaign workflows (primary, secondary, re-engagement, post-demo) |
| **Skill creator** | `skills/meta/skill-creator/` | Meta-skill for creating new skills programmatically |

### From Claude Claw v2 (Product Repo at `rawclaw/product/rawclaw/`)

This is the rebranded version with proper TypeScript source:

| Improvement | Status |
|-------------|--------|
| TypeScript source (not just compiled dist/) | Available |
| `setup/` directory with proper wizard | Available |
| `migrations/` with versioned schemas | Available |
| vitest for testing | Configured |
| `.github/` templates for issues/PRs | Available |
| `launchd/` plist for macOS daemon | Available |
| Full `docs/` folder | Available |
| `assets/` with architecture diagrams | Available |

---

## 10. Priority List: Top 10 Improvements for v2

### Rank 1: Apply Supabase Migrations + Populate .env Files (1 day)
**Impact:** BLOCKING. Nothing works without this. All 22 tables are missing. All env files are blank.
**Action:** Apply 001-005 SQL on `nnaryjadylboqcoyvcuw`. Populate Brett/Jace/Nick env files from master .env. Assign SEAT_IDs.
**Files:** `dineline/supabase/001-005*.sql`, all `.env.*` files

### Rank 2: Build `rawclaw setup` CLI (2-3 days)
**Impact:** HUGE. Transforms a 15-25 hour manual process into a 10-minute command. Every future client benefits. This is the scalability bottleneck.
**Action:** Build ~610 lines of Python (cli.py, scaffold.py, sql_generator.py, template_engine.py, validator.py). Spec already written at `rawclaw/docs/one-command-setup-spec.md`.
**Files:** New files in `rawclaw/`

### Rank 3: Get Dashboard Running + Deploy Company LLM (1-2 days)
**Impact:** HIGH. Chris cannot sell without a visual demo. The Company LLM is the differentiator vs. "just use ChatGPT."
**Action:** Start the Claude Claw v2 dashboard locally, expose via Cloudflare tunnel. Deploy `rawclaw/product/company-llm-vercel/` to Vercel for Dineline.
**Files:** `rawclaw/product/rawclaw/`, `rawclaw/product/company-llm-vercel/`

### Rank 4: Build Meta Ads Integration (1 day)
**Impact:** HIGH. Dineline is a restaurant marketing agency. Meta (Facebook/Instagram) is their primary ad platform. Without this, 50% of their campaign data is invisible.
**Action:** Build `integrations/meta_ads.py` following BaseClient pattern. Sync campaign metrics to `campaign_metrics` table (platform = 'meta'). Reference: module already started at `rawclaw/clients/dineline/integrations/meta_ads.py`.
**Files:** `dineline/integrations/meta_ads.py`

### Rank 5: Deploy Trigger.dev Tasks + Set Env Vars (0.5 day)
**Impact:** HIGH. Scheduled tasks ARE the product value. Without them, agents sit idle between manual prompts.
**Action:** Deploy all dineline-* tasks. Set all env vars in Trigger.dev dashboard. Verify daily scorecard runs at 7am ET.
**Files:** `Trigger Workflows/my-workflows/trigger/dineline-*.ts`

### Rank 6: Build Integration Smoke Test Script (0.5 day)
**Impact:** MEDIUM-HIGH. Prevents first-failure-on-install-day embarrassment.
**Action:** Create `scripts/integration_smoke_test.sh` that runs all integration modules with `--test` flag in sequence and reports pass/fail summary.
**Files:** New `dineline/scripts/integration_smoke_test.sh`

### Rank 7: Steal Paperclip Budget Governance (1-2 days)
**Impact:** MEDIUM-HIGH. Clients will ask "what if the AI spends too much?" Budget caps with auto-pause remove the objection.
**Action:** Add `max_daily_tokens` and `max_daily_api_cost` to `agents.config` JSONB. Build a Trigger.dev task that checks daily token usage and pauses agents that exceed budget. Post alert to Discord.
**Files:** New Trigger.dev task, update `001_core_schema.sql` docs

### Rank 8: Build Fathom API Integration (1 day)
**Impact:** MEDIUM. Auto-populate Close CRM with call summaries. Chris identified this as a top priority in the kickoff call. Currently all sales call follow-up is manual.
**Action:** Research Fathom API, build integration module, create Trigger.dev sync task.
**Files:** New `dineline/integrations/fathom.py`, new Trigger.dev task

### Rank 9: Create Demo Instance (1 day)
**Impact:** MEDIUM. Chris needs a working demo for the $100M company prospect and all other pipeline leads. The 20-minute demo script is written but has no live system to demonstrate.
**Action:** Stand up a demo Dineline instance (dashboard + Company LLM + Telegram agent) with sample data. Create a Cloudflare tunnel URL Chris can open on any call.
**Files:** Configuration of existing systems

### Rank 10: Steal Paperclip React Dashboard Components (3-5 days)
**Impact:** MEDIUM. Transform Mission Control from a basic status page into a visual command center with org charts, task kanban, budget views, and approval gates. This is Phase 2 scope ("Paperclip-style visual agent management").
**Action:** Fork Paperclip's `ui/` React components. Adapt to Raw Claw's Supabase schema. Deploy as the new Mission Control dashboard.
**Files:** New React app in `rawclaw/product/dashboard/`

---

## Appendix A: Full File Inventory

### rawclaw/ (Top Level)
```
rawclaw/
  README.md                              -- Workspace overview
  scope.md                               -- Master phase tracker (Phase 0-3)
  prd-productize.md                      -- Product Requirements: productization
  prd-company-database.md                -- Product Requirements: Supabase schema
  prd-company-llm.md                     -- Product Requirements: chat interface
  prd-datasource-dashboard.md            -- Product Requirements: data views in dashboard
  prd-setter-dashboard.md                -- Product Requirements: setter ops dashboard
  prd-skill-page.md                      -- Product Requirements: pre-call value asset
  prd-dashboard-reference.md             -- Dashboard setup reference
  scope-productize.md                    -- Productize scope (detailed)
  scope-company-database.md              -- Company DB scope
  scope-company-llm.md                   -- Company LLM scope
  scope-datasource-dashboard.md          -- Datasource dashboard scope
  scope-setter-dashboard.md              -- Setter dashboard scope
  scope-dashboard-reference.md           -- Dashboard reference scope
  scope-skill-page.md                    -- Skill page scope
  dm-script-playbook.html               -- 82 TextBlaze DM scripts (68KB)
  applicants/                            -- 22 setter applicant Loom transcripts + ranking report
  artifacts/                             -- 17 HTML artifacts (ad copy, landing pages, pitch deck, VSL, etc.)
  clients/
    pipeline.md                          -- Sales pipeline (55 warm leads, $100M company, etc.)
    _template/README.md                  -- Template for new clients
    dineline/                            -- Full Dineline client folder (mirrors dineline/ directory)
  docs/
    sop-client-deployment.md             -- 496-line deployment SOP for Dilan
    pricing-packaging.md                 -- 3 tiers, margin analysis, discounts
    demo-script.md                       -- 20-min demo script for Chris
    one-command-setup-spec.md            -- `rawclaw setup` CLI design doc
    client-onboarding-template.md        -- Generic onboarding template
    dashboard-setup-reference.md         -- Dashboard setup guide
    + 17 more docs (ad copy, brand DNA, buyer journey, cold email, etc.)
  meetings/
    2026-03-28-team-kickoff.md           -- 190-min team kickoff notes
  other/
    offer.md                             -- Offer breakdown
    tools-stack.md                       -- All tools used
    repos-reference.md                   -- Key GitHub repos
    old-repo/rawclaw-v1/                 -- Original Claude Claw (124 skills, 6 agents)
  product/
    README.md                            -- Product overview
    company-llm-template/                -- Duplicatable Company LLM template
    company-llm-vercel/                  -- Deployed Company LLM (Next.js + Anthropic + Gemini)
  setter-dashboard/                      -- Next.js setter ops dashboard (7 pages)
  setup-guide/                           -- (empty/missing README)
  skill-page/                            -- Pre-call value asset (60KB HTML)
  supabase/                              -- Rawgrowth internal DB (3 migrations + CLI)
  team/
    team-roles.md                        -- Chris/Dilan/Alexander roles + working agreement
```

### dineline/ (Client Infrastructure)
```
dineline/
  __init__.py                            -- Package init (v1.0.0)
  scope.md                               -- 9-phase scope + 6-gap analysis
  clients/dineline/
    README.md, install-day-brief.md
    getting-started-{brett,jace,nick}.md
    seats/{brett,jace,nick}/CLAUDE.md     -- Populated role templates
  docs/
    ssh-tailscale-guide.md, tailscale-acl.json
  install-guide/
    index.html (1,677 lines), vercel.json
  integrations/
    __init__.py, base.py, hubspot.py, google_ads.py,
    clickup.py, stripe_reader.py, slack_adapter.py, requirements.txt
  monitoring/
    heartbeat.py (504 lines), api_health.py (379 lines),
    uptime_report.py, launchd/ (4 plists + installer)
  onboarding/
    intake-form.md, pre-install-checklist.md, install-day-runbook.md
  product-overview/
    product-summary.md, gap-audit.md, one-pager.md, demo-script.md
  scripts/
    verify_env.py, apply_005_fix.py
  setup/
    setup.sh (v2.0.0), generate_env.py, scaffold_repo.py,
    scaffold_repo_test.py, env-config-example.json
  supabase/
    001_core_schema.sql through 005_security_fixes.sql
  templates/
    CLAUDE-ceo.md, CLAUDE-coo.md, CLAUDE-technical.md, CLAUDE-employee.md
```

---

## Appendix B: Team Context

| Person | Role | Capacity | Key Responsibility |
|--------|------|----------|-------------------|
| Chris West | CEO | PST, packed calendar, joins calls late | Vision, sales demos, content, client relationships |
| Dilan Patel | BA | GMT, hates repetitive work | Lead follow-up (55 leads), Close CRM, setter management, client onboarding |
| Alexander Thompson | CTO | GMT+1, wants orchestrator role long-term | Everything technical: builds, deploys, maintains, fixes |

### Active Pipeline

- $100M company wants demo (highest priority)
- E-com brand: $75K + $20K/mo proposed
- 55 warm leads in Close CRM (Dilan following up)
- 17K Instagram DMs (4 setters being onboarded)
- Vienna investor: app build + 3-month stay offer

---

*End of deep dive. This report covers 90+ files across both directories. Use it to plan Raw Claw v2 sprints.*
