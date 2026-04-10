---
name: client-onboarding
description: Complete client onboarding SOP. From signed deal to fully configured, live system.
triggers: ["onboard", "new client", "client setup", "onboarding"]
---

# Client Onboarding SOP

## Phase 1: Setup (Day 1)

### 1.1 Create Client Record
```bash
mkdir -p [RAWCLAW]/clients/[client-name]
cp [RAWCLAW]/clients/_template/profile.md [RAWCLAW]/clients/[client-name]/profile.md
cp [RAWCLAW]/clients/_template/activity-log.md [RAWCLAW]/clients/[client-name]/activity-log.md
```

Fill in `profile.md` completely before moving on.

### 1.2 Load Client Knowledge
Create these files in `knowledge/client/`:

**business.md** -- What they sell, their ICP, the transformation they deliver, current revenue, team size.

**brand-voice.md** -- Their tone (formal/casual?), words they use, words they hate, examples of copy they love, examples they hate.

**offer.md** -- Full offer stack: main offer, bonuses, guarantee, pricing, objections they hear most.

**team.md** -- Names, roles, how to reach them, who has authority to approve what.

**assets.md** -- All tools, accounts, integrations they use. Login instructions if relevant.

### 1.3 Competitor Research
Run `competitor-intel` skill on their top 3 competitors. Save each to `knowledge/competitors/[name].md`.

## Phase 2: Configuration (Day 1-2)

### 2.1 Agent Configuration
For each active agent:
1. Update `CLAUDE.md` with client-specific context (offer name, ICP language, brand voice notes)
2. Set budget policies appropriate for their usage level
3. Configure any integrations they need (Gmail, Slack, CRM)

### 2.2 Scheduled Tasks
Set up any recurring tasks they need:
```bash
# Example: daily inbox triage
node [RAWCLAW]/dist/schedule-cli.js create "Triage inbox and surface anything that needs attention today" "0 8 * * 1-5"

# Example: weekly report
node [RAWCLAW]/dist/schedule-cli.js create "Generate weekly activity summary and send to client" "0 9 * * 1"
```

## Phase 3: Verification (Day 2-3)

### 3.1 Ship Check
Before handing off to client:
- All agents respond correctly in Telegram
- Scheduled tasks are queued and running
- All integrations authenticate successfully
- Knowledge files are complete and agents are loading them

### 3.2 Owner Review
Present to owner:
- Client record created and complete
- Knowledge base loaded
- Agents configured
- Schedule set up
- Any open questions or gaps

Owner signs off before client gets access.

## Phase 4: Handoff (Day 3-5)

### 4.1 Client Welcome
- Walk client through Telegram interface
- Show them which agent to talk to for what
- Give them the agent roster (which bot = which agent)
- Set expectations on response time and capabilities

### 4.2 First Week Check-in
On day 7: check in, ask what's working and what's not. Log everything to `activity-log.md`.

## Logging

Every interaction with the client goes in `clients/[name]/activity-log.md`. Every time. If it's not logged, it didn't happen.
