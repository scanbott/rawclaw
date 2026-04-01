---
name: ops-reference
description: [COMPANY_NAME] operational reference — workspace architecture, Supabase schema, cron schedule, API connections, agent details. Load when you need system-level context.
user-invocable: true
---

# Ops Reference — [COMPANY_NAME] System

## Agent Teams

| Agent | Folder | Role |
|-------|--------|------|
| **Ali** | `~/agents/ali/` | Developer. Dashboard, APIs, deploys, n8n, tool building. |
| **Quilly** | `~/agents/quilly/` | Content Director. YouTube scripts, Reels, Twitter. Writes AS Chris. |
| **Larry** | `~/agents/larry/` | Sales & Revenue. Copy, DMs, email sequences, VSL, CRM. |
| **Ovi** | `~/agents/ovi/` | Research & Data. Competitor analysis, market research, Supabase queries. |
| **Cleo** | `~/agents/cleo/` | Client Success. Onboarding, Discord, client health. |
| **Sam** | `~/agents/sam/` | Finance & Systems. Budget, costs, infrastructure. |

Agent registry: `~/agents/shared/agent-registry.json`

## Workspace Architecture

```
~/BusinessOS/       System engine (code, agents, skills, scheduler)
  agents/                        Agent definitions only (agent.yaml + CLAUDE.md)
  src/memory/                    Memory subsystem (index.ts, consolidate.ts, ingest.ts)
  src/integrations/              External connectors (slack.ts, slack-events.ts)
  src/worker-cli.ts              Headless worker runner (no Telegram needed)
  src/mission-watcher.ts         Auto-spawns workers for stale tasks every 5min
  dashboard/                     React frontend (dashboard.[COMPANY_DOMAIN] port 3141)
  store/businessos.db            SQLite: memories, tasks, hive_mind, token_usage
  artifacts/reports/             Generated reports and analysis
  artifacts/exports/             Files for external sharing
  artifacts/drafts/              Content drafts pending review

~/knowledge/        Workspace tier (knowledge vault, Obsidian)
  brand/                         SINGLE SOURCE of brand truth
  sales/scripts/                 DM templates, call scripts, sequences
  sales/objections/              Objection handling by category
  sales/case-studies/            Client results and proof
  sales/crm/                     Close.io setup, pipeline docs
  clients/                       ACTIVE clients only
  ops/                           SOPs and runbooks (replaces old sops/)
  ops/sales-sops/                38 setter/sales SOPs
  content/                       Content frameworks and templates
  research/                      Active research (< 90 days)
  strategy/                      Active strategy docs
  finance/                       Financial knowledge
  _archive/                      Retired docs: clients/, research/, strategy/
```

## Supabase Schema

**Credentials:** `~/.zshrc` has SUPABASE_URL and SUPABASE_SERVICE_KEY

**Core Tables:**
- `task_queue` — agent task assignments (agent, prompt, status, priority, result)
- `deliverables` — all agent output (title, type, content_url, agent, status, tags)
- `agent_activity` — agent status tracking (agent_name, action, status)
- `knowledge_base` — semantic search with pgvector (content, embedding, source, tags)
- `clients` — client records and status
- `sales_calls` — call transcripts, objections, outcomes
- `content_pipeline` — content production queue and status

**Content Tables:**
- `youtube_content` — YouTube video data and metrics
- `instagram_content` — Instagram content data
- `brand_intake` — client intake form responses

**Communication Tables:**
- `chat_messages` / `chat_sessions` — RawClaw conversation history

**Analytics Tables:**
- `revenue` — revenue tracking
- `funnel_analytics` — funnel metrics

**Reference Tables:**
- `skills`, `sops`, `org_chart`, `thoughts`, `research`, `system_config`

**RPCs:** `search_knowledge_base`, `submit_task`, `get_funnel_stats`
**Schema docs:** `~/tools/supabase/supabase-inventory.md`

## Automated Jobs (Cron)

Logs: `~/memory/cron-*.log`

**SIGNAL:**
- Twitter scraping: daily 6am
- IG competitor Reels: Wed+Sat 7am
- Meta Ad Library: daily 8am
- YouTube sync: every 6hrs

**INTELLIGENCE:**
- Competitor YouTube analysis: Wed+Sat 9am
- Objection mining: Mon 7am
- SOP writer: Sun 10pm
- YT home tab optimizer: Fri 6pm
- Monthly outlier rollup: 1st of month 6am

**EXPRESSION:**
- Daily Reel scripts: 5/day at 5am
- Livestream planner: Mon/Wed/Fri 10am
- Weekly strategy report: Mon 11am

**OPERATIONS:**
- Larry SDR: every 2hrs (9am-9pm)
- Cleo onboarding check: every 4hrs
- Cost tracking: daily midnight

## API Connections (in ~/.zshrc)

Supabase, OpenRouter, YouTube Data API, Notion, Stripe, Close.io, Telegram, Apify, Fathom, Meta, GitHub, n8n, Calendly, Slack

## ICP Quick Reference

- **Who:** Consultants/agency owners doing $3M-$15M/yr, 20-49 employees
- **Offer:** $20K install + $10K/mo retainer. In-house AI department.
- **Full details:** `~/knowledge/brand/02-icp.md` and `~/knowledge/brand/03-offer.md`

## The Flywheel

```
SIGNAL (Input)                    INTELLIGENCE (Processing)         EXPRESSION (Output)
Sales calls (Granola)         ->   Ovi analyzes patterns        ->  Quilly writes scripts
Client forms (33 questions)  ->   System finds what converts   ->  Larry writes sales copy
Social engagement            ->   Objection mining             ->  Dashboard updates
Competitor content           ->   Content performance loops    ->  Research briefs
```

Expression creates new Signal. The loop compounds. That's the product.
