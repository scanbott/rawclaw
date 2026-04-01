# Knowledge Vault Setup Guide

This vault is the workspace tier of your Business OS. Agents read from here constantly.
The system tier (code, agents, skills) lives in the BusinessOS repo.

## How to Populate Your Vault

### 1. Brand Foundation (Start Here)
The `brand/` folder is the single source of truth for everything about your company.
Fill these in order:
- `brand/00-brand-foundation-v2.md` -- Positioning, ICP, offer, voice
- `brand/01-personal-profile.md` -- CEO profile
- `brand/02-icp.md` -- Ideal client profile
- `brand/03-offer.md` -- Full offer details
- `brand/05-brand-voice.md` -- Visual identity, tone, platform guidelines

### 2. Sales Intelligence
- `sales/scripts/` -- Your real DM templates and sequences
- `sales/objections/` -- How you handle every objection
- `sales/case-studies/` -- Client wins with real numbers

### 3. Operating Procedures
- `ops/` -- Your SOPs and runbooks
- Name files: `sop-[topic].md` and `runbook-[topic].md`

### 4. Client Folders
- `clients/[client-name]/` -- One folder per active client
- Include: intake form, system map, delivery blueprint, health scores
- Archive inactive clients to `_archive/clients/`

### 5. Content Frameworks
- `frameworks/` -- Your hook frameworks, scripting systems, content templates
- `content/` -- Platform-specific strategies

## Frontmatter Standard

Every doc should have:
```yaml
---
owner: [AGENT_ID]
domain: brand|sales|clients|ops|content|research|strategy|finance
last_reviewed: YYYY-MM-DD
status: active|draft|archived
---
```

## Rules
- Brand content: `brand/` only. Never duplicate across folders.
- Client data: `clients/` only. Archive when churned.
- Research: delete or archive after 90 days unless still active.
- No data with real values in files that get committed (use Supabase for that).
