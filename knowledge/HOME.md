---
owner: scan
domain: ops
last_reviewed: YYYY-MM-DD
status: active
---

# [COMPANY_NAME] Knowledge Vault -- Navigation Index

This is the Obsidian vault for [COMPANY_NAME]. It's the workspace tier of the Business OS.
The system tier lives at `[HOME_DIR]/BusinessOS/`.

## What's Here

| Folder | What It Contains | Primary Users |
|--------|-----------------|---------------|
| `brand/` | SINGLE SOURCE of brand truth: voice, ICP, offer, team profiles, cognitive profiles | All agents loading content |
| `sales/scripts/` | DM templates, call scripts, follow-up sequences | Larry |
| `sales/objections/` | Objection handling by category | Larry, Scan |
| `sales/case-studies/` | Client results and proof | Larry, Scan |
| `sales/crm/` | CRM setup, pipeline docs, revenue tracking | Larry, Sam |
| `sales/calls/` | Call transcripts (recent ones in Supabase) | Larry, Ovi |
| `clients/` | ACTIVE clients only | Cleo, Scan |
| `ops/` | SOPs and runbooks for all operations | All agents |
| `content/` | Content frameworks, templates, platform playbooks | Quilly |
| `research/` | Active research: competitors, market, tools | Ovi |
| `strategy/` | Active strategy docs and plans | Scan |
| `finance/` | Pricing model, unit economics | Sam |
| `frameworks/` | Hook frameworks, content systems | Quilly, Larry |
| `prompts/` | Reusable LLM prompts | All agents |
| `templates/` | Document templates | All agents |
| `_archive/` | Retired docs -- searchable but deprioritized | Reference only |

## What's NOT Here (use these instead)

| Data Type | Where It Lives |
|-----------|---------------|
| Recent call transcripts | Supabase `sales_calls` table |
| Copy examples | Supabase `copy_examples` table |
| Content performance data | Supabase `content_examples` table |
| Revenue and Stripe data | Supabase `revenue` + Stripe directly |
| Agent task queue | SQLite `mission_tasks` |
| Agent memory | SQLite `memories` |
| Agent outputs/reports | `[HOME_DIR]/BusinessOS/artifacts/` |
| Skills and workflows | `~/.claude/skills/` |

## Data Layer Rules (for agents)

Shared + needs multi-device access -> **Supabase**
Structured + needs queries -> **SQLite**
Document + agents need to read it -> **Knowledge vault (here)**
Reusable capability -> **Skill**
Agent output -> **artifacts/**

## Brand Single Source of Truth

All brand content lives in `brand/`. Do NOT maintain local copies in agent directories.
Load from here: `knowledge/brand/00-brand-foundation-v2.md`

## Active Clients

- `clients/[CLIENT_NAME]/` -- [CLIENT_DESCRIPTION]
- `clients/prospects.md` -- Pipeline overview

Churned/inactive clients -> `_archive/clients/`
