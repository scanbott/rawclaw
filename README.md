# Business OS

An AI department operating system built on Claude Code. Seven specialized agents running 24/7 on a Mac mini, connected to your entire business stack.

## What It Is

Business OS installs an in-house AI department into a company. Not automations. Not chatbots. A full operating system: agents that understand your business, talk to each other, and execute work end-to-end.

The architecture: Claude Code + Telegram + SQLite + Supabase + your existing tools.

Every agent has a role, a personality, and access to a shared knowledge vault and database. They coordinate through a hive mind log and a mission task queue. The CEO (you) talks to any agent via Telegram.

## The Flywheel

```
SIGNAL -> INTELLIGENCE -> EXPRESSION
```

**Signal:** Everything flows in. Sales calls, client feedback, content performance, competitor moves, CRM data, social engagement.

**Intelligence:** Agents process the signal. Patterns emerge. Objections map to content. Client data maps to strategy. Performance data maps to the next iteration.

**Expression:** Output goes back to market. Content informed by what actually converts. Copy backed by real objection data. Strategy built from real performance numbers.

Every output creates new signal. The loop compounds. That's the product.

## Agent Architecture

Seven agents, each with a specific role:

| Agent | Role | Key Responsibilities |
|-------|------|---------------------|
| **Scan** | Orchestrator / AI COO | Routes tasks, monitors results, strategy |
| **Ali** | Developer | Dashboard, APIs, deploys, tools |
| **Quilly** | Content Director | Scripts, Reels, YouTube, content calendar |
| **Larry** | Sales & Copy | DMs, proposals, email sequences, CRM |
| **Cleo** | Client Success | Onboarding, health monitoring, comms |
| **Sam** | Finance | Revenue tracking, cost optimization |
| **Ovi** | Research | Competitor analysis, market data, intelligence |

Each agent has its own Telegram bot, its own CLAUDE.md, and its own scheduled tasks. They share SQLite (local state) and Supabase (business data). They communicate via the `inter_agent_tasks` table.

## Architecture Diagram

```
[CEO_NAME] (Telegram)
       |
   ┌───┴───┐
   │  Scan  │  -- Orchestrator
   └───┬───┘
       |
  ┌────┴────┐────────────┐────────────┐
  |         |            |            |
[Ali]    [Quilly]     [Larry]      [Ovi]
  |         |            |            |
[Cleo]    [Sam]         ...          ...
  |
  └── All agents share:
       ├── SQLite (store/businessos.db)  -- local state
       ├── Supabase                      -- business data
       └── ~/.claude/skills/            -- shared capabilities
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent runtime | Claude Code (claude-agent-sdk) |
| Messaging | Telegram (grammy) |
| Local DB | SQLite (better-sqlite3) |
| Cloud DB | Supabase (Postgres + pgvector) |
| Dashboard | Hono + Vercel |
| Automation | n8n |
| CRM | [CRM_TOOL] |
| Email | Google Workspace |
| Voice | Groq + ElevenLabs |
| Knowledge | Obsidian vault (local markdown) |

## Knowledge Vault

The Obsidian vault is the workspace tier. Agents read from it constantly.

```
knowledge/
├── brand/          # Single source of brand truth
├── sales/          # Scripts, objections, case studies
├── clients/        # Active client folders
├── ops/            # SOPs and runbooks
├── content/        # Frameworks and templates
├── research/       # Active research (<90 days)
├── strategy/       # Active strategy docs
├── finance/        # Pricing, cost reports
└── _archive/       # Retired docs
```

## Skills System

Skills are reusable workflows installed at `~/.claude/skills/`. Every agent has access to all skills.

Skills trigger automatically when relevant. Example: any request involving content automatically loads `brand-voice` before generating output.

Included skills (21):
- `agent-operating-pattern` -- Standard 6-step agent workflow
- `brand-voice` -- Load brand before any content
- `flywheel` -- Signal -> Intelligence -> Expression framework
- `ship-check` -- Mandatory E2E testing before "done"
- `skill-creator` -- Turn any SOP into a skill
- `frontend-theme` -- Enforce design system on all UI
- `ops-reference` -- System architecture reference
- `signal-scan` -- Cross-domain pattern recognition
- `content-creation` -- Content frameworks and hooks
- `sales` -- Sales playbook and objection handling
- `research` -- Research methodology
- `tech-stack` -- Tool map
- `dashboard-deploy` -- Build and deploy dashboard
- `copy-pipeline` -- End-to-end copywriting
- `comms` -- Multi-inbox check
- `ai-watch` -- Daily AI space monitor
- `steal` -- Extract and implement from any resource
- `clickup` -- ClickUp task runner
- `google-calendar` -- Calendar operations
- `mcp-creator` -- Build MCP servers
- `self-install` -- Install new capabilities

## How to Set It Up

See [SETUP.md](SETUP.md) for the full walkthrough.

Quick overview:
1. Clone this repo
2. Replace all `[PLACEHOLDER]` values
3. Set up Supabase and run migrations
4. Configure `.env`
5. Deploy skills to `~/.claude/skills/`
6. Set up your knowledge vault in Obsidian
7. Configure Telegram bots (one per agent)
8. Run `npm run setup` then `npm run dev`

## Security

- All message content is encrypted at rest (AES-256-GCM)
- API keys live in `.env` and `~/.zshrc` -- never committed
- Optional PIN lock for Telegram bot
- Emergency kill phrase to stop all agents instantly
- Full audit log in SQLite

## Requirements

- macOS (Mac mini recommended for 24/7 operation)
- Node.js 20+
- Claude API access (Anthropic)
- Telegram account (for bot creation)
- Supabase account

## License

MIT
