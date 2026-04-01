# Setup Guide

This walks you through deploying Business OS from zero to running agents.

## Prerequisites

- macOS (Mac mini for 24/7 operation, MacBook for testing)
- Node.js 20+ (`node --version`)
- npm or pnpm
- Claude API access (Anthropic console)
- Telegram account
- Supabase account (free tier works for testing)
- Obsidian (for knowledge vault)

## Step 1: Clone and Configure

```bash
git clone https://github.com/[YOUR_ORG]/[YOUR_REPO].git businessos
cd businessos
npm install
```

## Step 2: Replace All Placeholders

Find and replace every `[PLACEHOLDER]` value throughout the repo.

Key substitutions:
```
[COMPANY_NAME]          Your company name
[CEO_NAME]              Your name (the CEO using the system)
[COO_NAME]              COO name (human team member)
[CTO_NAME]              CTO name (human team member)
[COO_EMAIL]             COO email
[CTO_EMAIL]             CTO email
[COMPANY_DOMAIN]        yourdomain.com
[ICP_DESCRIPTION]       Who you serve (e.g., "agency owners doing $3M-$15M/yr")
[INSTALL_PRICE]         Your install price (e.g., $20K)
[RETAINER_PRICE]        Your monthly retainer (e.g., $10K)
[BUILD_TURNAROUND]      Build timeline (e.g., 7-day)
[BRAND_BACKGROUND_COLOR] Dashboard background (e.g., #060B08)
[BRAND_ACCENT_COLOR]    Brand accent color (e.g., #0CBF6A)
[CRM_TOOL]              Your CRM (e.g., Close.com)
[HOME_DIR]              Your home directory (e.g., /Users/yourname)
```

Quick find-replace using sed (adjust for your system):
```bash
# Example: replace company name throughout
grep -r "\[COMPANY_NAME\]" . --include="*.md" -l
# Then manually edit each file or use sed:
# sed -i '' 's/\[COMPANY_NAME\]/YourCompany/g' CLAUDE.md
```

## Step 3: Create Your Config Directory

BusinessOS stores personal config outside the repo at `~/.businessos/` so it's never committed.

```bash
mkdir -p ~/.businessos/agents
```

Copy your customized CLAUDE.md there:
```bash
cp CLAUDE.md ~/.businessos/CLAUDE.md
```

Copy each agent's CLAUDE.md:
```bash
for agent in scan ali larry quilly cleo sam ovi; do
  mkdir -p ~/.businessos/agents/$agent
  cp agents/$agent/CLAUDE.md ~/.businessos/agents/$agent/CLAUDE.md
done
```

## Step 4: Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings -> API
3. Copy the project URL and service role key

The main tables are auto-managed by the system. For custom tables:
```sql
-- Run in Supabase SQL editor
-- content_pipeline
CREATE TABLE content_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  platform text,
  status text DEFAULT 'draft',
  content text,
  created_at timestamp DEFAULT now()
);

-- sales_calls
CREATE TABLE sales_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  prospect_name text,
  meeting_date date,
  summary text,
  objections text,
  pain_points text,
  outcome text,
  notes text,
  created_at timestamp DEFAULT now()
);

-- clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  status text DEFAULT 'onboarding',
  monthly_revenue numeric,
  created_at timestamp DEFAULT now()
);

-- knowledge_base (requires pgvector extension)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

-- Enable RLS on tables you want to protect
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

## Step 5: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in every value. The required ones:

```bash
# Minimum required to run
TELEGRAM_BOT_TOKEN=your_main_bot_token
ALLOWED_CHAT_ID=your_telegram_chat_id
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
DB_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
GOOGLE_API_KEY=your_gemini_api_key
```

## Step 6: Create Telegram Bots

You need one Telegram bot per agent (8 total: main + 7 agents).

1. Open Telegram and start a chat with `@BotFather`
2. Send `/newbot` for each agent
3. Follow prompts to name each bot
4. Copy the bot token

Name them descriptively:
- Main: `[CompanyName] OS`
- Scan: `[CompanyName] Scan`
- Ali: `[CompanyName] Ali` (Dev)
- Larry: `[CompanyName] Larry` (Sales)
- etc.

Add each token to `.env` and to each agent's `agent.yaml`:
```yaml
# agents/scan/agent.yaml (example)
name: Scan
description: Strategy agent and orchestrator
telegram_bot_token_env: SCAN_BOT_TOKEN
model: claude-opus-4-5
obsidian:
  vault: [HOME_DIR]/knowledge
  folders:
    - brand
    - strategy
    - ops
```

## Step 7: Get Your Telegram Chat ID

1. Send any message to your main bot
2. Run: `node dist/index.js` -- it will print the chat ID when you message it
3. Set `ALLOWED_CHAT_ID` in `.env`

## Step 8: Install Skills

```bash
mkdir -p ~/.claude/skills
cp -r skills/* ~/.claude/skills/
```

Verify:
```bash
ls ~/.claude/skills/
```

## Step 9: Set Up Knowledge Vault

1. Open Obsidian and create a new vault at `[HOME_DIR]/knowledge`
2. Create the folder structure:
```bash
mkdir -p ~/knowledge/{brand,sales/{scripts,objections,case-studies,crm},clients,ops,content,research,strategy,finance,frameworks,prompts,templates,_archive}
```
3. Copy the template docs from `knowledge/` into your vault:
```bash
cp knowledge/HOME.md ~/knowledge/HOME.md
cp knowledge/TEAM.md ~/knowledge/TEAM.md
cp knowledge/brand/* ~/knowledge/brand/
cp knowledge/ops/* ~/knowledge/ops/
```
4. Fill in your actual brand, ICP, and offer details

## Step 10: Build and Run

```bash
# Build TypeScript
npm run build

# Run database setup
npm run migrate

# Test run (main bot)
npm run dev

# Run a specific agent
npm run dev -- --agent ali
```

## Step 11: Test the System

Send a message to your main Telegram bot:
- "what's the status" -- should see agent respond
- "who are you" -- Scan should introduce itself
- "have Ali tell me the current time" -- tests agent routing

## Running as a Service (Production)

For 24/7 operation on Mac mini, use launchd:

```bash
# Install all agents as launchd services
bash scripts/install-launchd.sh

# Check status
bash scripts/agent-service.sh status

# View logs
tail -f ~/Library/Logs/businessos-main.log
```

Service plist files live in `launchd/`. Edit them to match your paths before installing.

## Troubleshooting

### "No CLAUDE.md found" on startup
Copy your customized CLAUDE.md to `~/.businessos/CLAUDE.md`.

### "Bot token not found"
Check that the agent's `telegram_bot_token_env` in `agent.yaml` matches the key name in `.env`.

### "DB_ENCRYPTION_KEY is missing"
Generate and add to `.env`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Agent not responding
1. Check the agent is running: `bash scripts/agent-service.sh status`
2. Check logs: `tail -f ~/Library/Logs/businessos-[agent].log`
3. Verify your `ALLOWED_CHAT_ID` matches your Telegram chat ID

## Adding a New Agent

```bash
npm run agent:create
```

This interactive script creates the agent directory, `agent.yaml`, and `CLAUDE.md` template.

## Security Notes

- Never commit `.env` to git (it's in `.gitignore`)
- All message content is encrypted at rest via `DB_ENCRYPTION_KEY`
- Set `SECURITY_PIN_HASH` to lock the bot when you're away
- Set `EMERGENCY_KILL_PHRASE` to instantly stop all agents from Telegram
- The `audit_log` table records all security-relevant events
