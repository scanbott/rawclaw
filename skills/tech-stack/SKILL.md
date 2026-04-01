---
name: tech-stack
description: [COMPANY_NAME] master tech stack reference. Maps every tool, its purpose, owner, and integration point. Load when any agent needs to know which tool handles what. Triggers on "tech stack", "what tool do we use for", "our CRM", "our project management", "where do we", or any reference to a specific tool by function.
user-invocable: true
---

# [COMPANY_NAME] Tech Stack

**Rule:** When Chris (or any agent) refers to a tool by function, use this map. Never ask which tool to use -- it's already decided.

---

## Quick Reference Map

| When someone says... | They mean... |
|----------------------|--------------|
| "CRM" / "leads" / "follow up" / "pipeline" | Close.io |
| "project management" / "tasks" / "kanban" / "what Dilan manages" | ClickUp |
| "comms" / "message me" / "slack it" / "client channel" | Slack |
| "book a call" / "booking link" / "calendar link" | Calendly |
| "meeting notes" / "transcription" / "what was discussed" | Granola |
| "database" / "store this" / "source of truth" / "query" | Supabase |
| "knowledge base" / "vault" / "obsidian" | Obsidian (~/knowledge) |
| "notion" | Notion (when explicitly requested) |
| "automate" / "workflow" / "n8n" | n8n (https://n8n.[COMPANY_DOMAIN]) |
| "content" / "post" / "reel" / "YouTube" | Instagram + YouTube |
| "email" / "Google docs" / "drive" / "sheets" | Google Workspace |
| "payment" / "invoice" / "charged" | Stripe |
| "dashboard" | dashboard.[COMPANY_DOMAIN] |

---

## Full Stack

### Close.io (CRM)
- **What it is:** Primary CRM for all leads and sales activity
- **Used for:** Lead management, call booking follow-up, SMS/calls to leads, opportunity tracking, pipeline stages, daily follow-up review
- **Owner:** Scan (daily review) + Larry (copy/outreach)
- **API base:** https://api.close.com/api/v1/
- **Auth:** API key stored in .env as CLOSE_API_KEY, also in ~/.zshrc
- **Key objects:** Lead, Contact, Opportunity, Activity, Sequence
- **Integration:** n8n HTTP nodes pull Calendly bookings -> create leads in Close automatically
- **Daily use:** Every booked call creates a lead. Follow-up sequences run from here.

### Slack (All Communication)
- **What it is:** The ONLY communication channel -- internal and client
- **Used for:** All team comms, all client comms (future), agent notifications, deal alerts, system alerts
- **Owner:** Everyone -- if it's not on Slack, it doesn't exist
- **Workspace:** [COMPANY_SLACK_WORKSPACE] (Team ID: [SLACK_TEAM_ID])
- **Bot:** "biggy" (Bot User OAuth Token in .env as SLACK_BOT_TOKEN)
- **App token:** .env as SLACK_APP_LEVEL_TOKEN
- **Integration:** Agents send notifications here. n8n routes alerts here.
- **Rule:** Never route communication through email, DMs, or any other channel.

### ClickUp (Project + Ops Management)
- **What it is:** All project management, team operations, client project tracking
- **Used for:** Daily task management, client project stages, who's doing what, ops oversight
- **Owner:** [COO_NAME] (responsible for keeping everything moving)
- **Workspace:** [COMPANY_NAME] (ID: 90131458500)
- **Primary list:** Founders Kanban
- **Team:** [CEO_NAME] (owner), Alexander Alberts, [COO_NAME]
- **API key:** .env as CLICKUP_API_KEY
- **Client ID:** CCJ8DMPWJBUZCU2IN3I22C39BPKEHHVP (in .env)
- **Client Secret:** GF2TJQ56KA71HFKFB5LJDCXEMD8AJYC90R21QQ3LGLWJHWV25Q6VR74PMZU002G2 (in .env)
- **Integration:** Direct API (not MCP) for full agent control
- **Rule:** All client projects tracked here. All team tasks go here.

### Calendly (Call Booking)
- **What it is:** Inbound call scheduling software
- **Used for:** Prospects book sales calls, client onboarding calls, any scheduled meeting
- **Integration:** Webhooks fire to n8n on booking -> Slack notification + Close.io lead creation
- **Rule:** All booking links are Calendly links.

### Granola (Meeting Transcription)
- **What it is:** AI meeting note-taker and transcription tool
- **Used for:** Recording and transcribing all sales calls, client calls, team meetings
- **Replaced:** Fathom (no longer used -- do not reference Fathom)
- **Owner:** Chris
- **Rule:** All meeting transcriptions come from Granola.

### Supabase (Database)
- **What it is:** Primary cloud database and backend
- **Used for:** All business data -- agent activity, content pipeline, sales calls, clients, revenue, knowledge base
- **URL:** in .env as SUPABASE_URL
- **Service key:** in .env as SUPABASE_SERVICE_KEY and ~/.zshrc
- **Key tables:** task_queue, deliverables, agent_activity, knowledge_base, clients, sales_calls, content_pipeline, revenue, hive_mind
- **Rule:** Supabase is truth. If it's not in the database, it didn't happen.

### Obsidian (Knowledge Vault)
- **What it is:** Local markdown knowledge base
- **Used for:** Brand docs, SOPs, frameworks, reference material, agent memory
- **Location:** ~/knowledge (260+ docs)
- **Sections:** brand/, frameworks/, sops/, clients/, agents/
- **Rule:** Read with Grep/Read tools. Write new docs with Write tool.

### n8n (Workflow Automation)
- **What it is:** Self-hosted workflow automation platform
- **Used for:** Connecting tools, routing data between systems, triggering agents, automating repeatable ops
- **URL:** https://n8n.[COMPANY_DOMAIN]
- **MCP server:** https://n8n.[COMPANY_DOMAIN]/mcp-server/http
- **Key workflows:** Calendly -> Slack + Close.io, content distribution, lead routing
- **Rule:** Automation logic lives in n8n. Agents trigger or build workflows here.

### Instagram + YouTube (Marketing)
- **What it is:** Primary content distribution channels
- **Used for:** Top-of-funnel content, brand building, lead generation
- **Owner:** Quilly (content creation) + Chris (strategy)
- **Content pipeline:** Supabase content_pipeline + instagram_content + youtube_content tables

### Google Workspace
- **What it is:** Email, Docs, Sheets, Drive
- **Used for:** Email outreach, shared documents, client deliverables, spreadsheets when needed
- **Rule:** Docs and Sheets when a structured file is needed. Email for external (non-Slack) contacts only.

### Notion
- **What it is:** Docs and wiki platform
- **Used for:** Only when Chris explicitly says "use Notion" -- not a default tool
- **Rule:** Do not default to Notion. Only use if specifically requested.

### Stripe (Payments)
- **What it is:** Payment processing
- **Used for:** Client invoicing, subscription billing, payment webhooks
- **Key:** in .env as STRIPE_SECRET_KEY
- **Integration:** Payment webhooks trigger client onboarding pipeline

### Vercel + Cloudflare (Deployment)
- **What it is:** Dashboard hosting and tunnel infrastructure
- **Used for:** dashboard.[COMPANY_DOMAIN] served via Hono port 3142 -> Cloudflare tunnel
- **Local build:** ~/BusinessOS/dashboard/dist/

### Mac Mini (Hardware)
- **What it is:** Dedicated on-premise hardware running the entire BusinessOS
- **Used for:** 24/7 agent processes, local file storage, Cloudflare tunnels, launchd scheduling
- **Rule:** All agents run as persistent processes on this machine.

---

## Ownership Map

| Area | Primary Owner | Backup |
|------|--------------|--------|
| CRM + leads | Scan (daily) + Larry (outreach) | Chris |
| Project management | Dilan | Chris |
| Communication | Everyone | -- |
| Content | Quilly | Chris |
| Sales copy + DMs | Larry | Scan |
| Code + builds | Ali | -- |
| Finance | Sam | Chris |
| Research | Ovi | -- |
| Client success | Cleo | Chris |

---

## Credentials Location

All keys live in one of two places -- never anywhere else:
- ~/.zshrc -- shell environment
- PROJECT_ROOT/.env -- project-level secrets

To load: source ~/.zshrc && source $(git rev-parse --show-toplevel)/.env
