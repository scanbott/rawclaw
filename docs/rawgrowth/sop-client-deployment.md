# Raw Claw -- Client Deployment SOP

**Version:** 1.0 | **Date:** 2026-03-30
**Audience:** Dilan Patel (Business Associate) + Chris West (CEO/Installer)
**Purpose:** End-to-end client deployment process that Dilan can run without Alexander

---

## Overview

This SOP covers the full lifecycle of a Raw Claw client deployment -- from initial lead qualification through ongoing monthly management. Every step is designed to be executable by Dilan (or Chris) with Alexander only needed for technical deployment (Phase 5).

**Estimated timeline per client:** 2-4 weeks from signed agreement to live install.

---

## Phase 1: Pre-Sale -- Information Gathering

**Owner:** Dilan (or Chris if he ran the sales call)
**Timeline:** During or immediately after first sales conversation

### 1.1 Initial Lead Capture

Collect these minimum fields before any scoping work begins:

| Field | Required? | Where to Record |
|-------|-----------|-----------------|
| Company name | Yes | Close CRM |
| Contact name + email + phone | Yes | Close CRM |
| Website URL | Yes | Close CRM |
| Industry / vertical | Yes | Close CRM |
| Annual revenue (range) | Yes | Close CRM |
| Number of employees | Yes | Close CRM |
| How they heard about us | Yes | Close CRM |
| Current biggest pain point | Yes | Close CRM (notes) |
| Current tools they use (CRM, ads, PM) | Yes | Close CRM (notes) |

### 1.2 Discovery Questions for the Call

Chris or Dilan should ask these on the first call (or send as a pre-call questionnaire):

1. **"Walk me through a typical week for your team -- what eats up the most time?"**
   - Listen for: manual reporting, content creation, CRM updates, lead follow-up
2. **"How many people are currently doing ops/admin work?"**
   - Listen for: headcount + salary range = cost baseline for ROI pitch
3. **"What tools do you use daily?"**
   - Listen for: CRM (HubSpot/Salesforce/GHL), ad platforms (Meta/Google), PM (ClickUp/Asana), Slack/Discord
4. **"Have you tried AI tools before? What worked, what didn't?"**
   - Listen for: ChatGPT frustrations, tool fatigue, "we tried but couldn't stick with it"
5. **"If I could solve one problem in your business this week, what would it be?"**
   - This becomes the Quick Win for install day
6. **"Do you have a physical office or is your team remote?"**
   - Mac Mini installs require a physical location with ethernet
7. **"Who makes the final decision on this, and who else needs to be involved?"**
   - Qualify the decision-maker early

---

## Phase 2: Qualification -- Is This a Good Fit?

**Owner:** Dilan
**Timeline:** Within 24 hours of discovery call

### 2.1 Qualification Scorecard

Score the prospect 1-5 on each criterion. Minimum total to proceed: **15/25**.

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| **Revenue** -- $1M+/year = 5, $500K-1M = 3, <$500K = 1 | | |
| **Pain clarity** -- knows exactly what hurts = 5, vague = 1 | | |
| **Tool readiness** -- uses APIs/CRM/ad platforms = 5, spreadsheets only = 1 | | |
| **Decision speed** -- can decide this week = 5, needs board approval = 1 | | |
| **Technical environment** -- has office/ethernet/IT support = 5, fully remote = 1 | | |
| **TOTAL** | /25 | Minimum: 15 |

### 2.2 Hard Disqualifiers (Do Not Proceed)

- No physical location for Mac Mini (fully distributed team with no office)
- Revenue under $250K/year (cannot justify the investment)
- No CRM or ad platform (nothing to connect agents to)
- Prospect wants to "try it for free" (we don't offer trials)
- Prospect expects agents to replace ALL employees (wrong expectation)
- Legal/compliance restrictions that prevent sending data to Anthropic API

### 2.3 Ideal Client Profile (ICP)

The best Raw Claw clients look like this:
- $3M-15M/year revenue
- Agency, SaaS, or service business with 10-50 employees
- Currently spending $100K+/year on ops roles (content, sales ops, reporting)
- Uses HubSpot or Salesforce + at least one ad platform
- Has a physical office (or dedicated server room/closet)
- CEO/owner is bought in on AI and wants to move fast
- Can provide API keys and admin access within 1 week

---

## Phase 3: Scoping -- Building the Proposal

**Owner:** Dilan (with Chris for pricing decisions)
**Timeline:** 1-3 days after qualification

### 3.1 Determine Seat Count

| Team Size | Recommended Seats | Notes |
|-----------|------------------|-------|
| 1-5 people | 1 seat (Starter) | CEO/owner gets the agent |
| 5-15 people | 2-3 seats (Growth) | CEO + COO/ops + technical |
| 15-30 people | 3-5 seats (Enterprise) | Department heads + key operators |
| 30+ people | 5+ seats (Custom) | Needs discovery session with Alexander |

### 3.2 Determine Integrations

Check which integrations the client needs:

| Integration | Included in all tiers? | Notes |
|-------------|----------------------|-------|
| Supabase (database) | Yes | We provide |
| Slack or Discord | Yes | Client provides workspace access |
| Tailscale (remote access) | Yes | We provide |
| Monitoring (heartbeat + alerts) | Yes | We set up |
| HubSpot CRM | Growth + Enterprise | Client provides API key |
| Salesforce CRM | Enterprise only | Requires custom integration work |
| GoHighLevel CRM | Growth + Enterprise | Client provides API key |
| Meta Ads (Facebook/Instagram) | Growth + Enterprise | Client provides access token |
| Google Ads | Growth + Enterprise | Client provides OAuth credentials |
| TikTok Ads | Enterprise only | Custom integration |
| Stripe (read-only) | Growth + Enterprise | Client provides restricted key |
| ClickUp / Asana | Growth + Enterprise | Client provides API key |
| Notion | Growth + Enterprise | Client provides API key |
| Google Workspace | Enterprise only | Requires OAuth setup |
| Custom integration | Enterprise only | Scoped separately |

### 3.3 Estimate Timeline

| Package | Setup Time | Install Day | Total to Live |
|---------|-----------|------------|---------------|
| Starter (1 seat) | 3-5 days | Half day | 1-2 weeks |
| Growth (3 seats) | 5-7 days | Full day | 2-3 weeks |
| Enterprise (5+ seats) | 7-14 days | 1-2 days | 3-4 weeks |

### 3.4 Write the Proposal

Use this structure (can be a Google Doc, Notion page, or PDF):

```
1. Executive Summary (what they get, what it costs)
2. Their Problem (mirror back their pain points from discovery)
3. Our Solution (specific agents + integrations for their business)
4. Deliverables List (seats, dashboard, integrations, training)
5. Timeline (milestone dates)
6. Investment (setup + monthly, with ROI comparison)
7. Next Steps (sign + provide access = we begin)
```

**Pricing reference:** See `rawclaw/docs/pricing-packaging.md`

---

## Phase 4: Handoff to Alexander -- The Intake Package

**Owner:** Dilan
**Timeline:** Within 24 hours of signed agreement

### 4.1 Fill Out the Intake Form

Location: `dineline/onboarding/intake-form.md` (copy and rename per client)

Save as: `rawclaw/clients/{client-slug}/intake-form.md`

**Every section must be completed.** Blank fields become blockers on install day.

The 8 sections:
1. Company info (name, revenue, industry, slug)
2. Team & seats (one block per seat, roles, responsibilities, tools used)
3. Tech stack (CRM, ad platforms, payment processor, PM tool, email, analytics)
4. Network & hardware (Mac Mini specs, internet, IT contact)
5. Quick wins (top 3 pain points with success metrics)
6. Access & credentials (API keys, platform logins, credential handoff method)
7. Compliance & security (data classification, regulations, acceptable use)
8. Brand & content (voice, audience, style guide -- if content agents are included)

### 4.2 Collect API Keys

Use the checklist in `dineline/onboarding/pre-install-checklist.md` Section 3.

**Key rules:**
- Anthropic API key, Supabase keys, and Tailscale keys -- WE provide these
- CRM keys, ad platform tokens, Stripe keys -- CLIENT provides these
- Never accept keys via email. Use 1Password shared vault, Slack DM (then rotate), or USB transfer
- Every key must be TESTED before install day (not just "looks right")

### 4.3 Create the Handoff Document

Send Alexander a structured handoff in Slack with:

```
CLIENT HANDOFF: {Company Name}
================================
Slug: {client-slug}
Seats: {count}
Roles: {list of seat-name: role pairs}

Package: Starter / Growth / Enterprise
Setup fee: ${amount}
Monthly: ${amount}

Integrations needed:
- [ ] HubSpot (key collected: Y/N, tested: Y/N)
- [ ] Meta Ads (key collected: Y/N, tested: Y/N)
- [ ] Google Ads (key collected: Y/N, tested: Y/N)
- [ ] Stripe (key collected: Y/N, tested: Y/N)
- [ ] ClickUp (key collected: Y/N, tested: Y/N)
- [ ] Other: ___

Hardware status:
- Mac Minis on-site: Y/N
- Ethernet available: Y/N
- IT contact provided: Y/N

Quick wins identified:
1. {quick win for seat 1}
2. {quick win for seat 2}
3. {quick win for seat 3}

Install date proposed: {date}
Client POC: {name, phone, email}

Intake form: rawclaw/clients/{slug}/intake-form.md
API keys: shared via {method}
```

### 4.4 Pre-Install Checklist

Run through the full pre-install checklist (`dineline/onboarding/pre-install-checklist.md`) at least 48 hours before install day.

**13 sections must all be Go:**
1. Hardware -- Mac Minis on-site, powered, labeled
2. Network -- Ethernet, ports open, domains unblocked
3. API keys -- All collected AND tested
4. Intake form -- All 8 sections complete
5. Communication -- Slack/Discord channels created
6. GitHub -- Repo created, access granted
7. Supabase -- Project created, migrations ready
8. DNS/Domain -- (if applicable)
9. Environment files -- .env drafted and validated
10. CLAUDE.md templates -- Populated with client values
11. setup.sh arguments -- Commands prepared per seat
12. Monitoring -- Webhooks created and tested
13. Final gate -- All starred sections = Go

**If ANY starred section is No-Go, install day is postponed.**

---

## Phase 5: Install Day Coordination

**Owner:** Chris (on-site) + Alexander (remote)
**Timeline:** 1 full day (6-8 hours)

### 5.1 Dilan's Role on Install Day

Dilan does NOT need to be on-site or deeply involved. Your job:

1. **Morning:** Send the client POC a "we're starting today" message
2. **Check-ins:** Monitor the Slack DM between Chris and Alexander for status
3. **Afternoon:** When Chris confirms Phase 4 (seat handover) is done, send a welcome message to each seat holder
4. **End of day:** Confirm with Chris that all smoke tests passed

### 5.2 Install Day Phases (for reference)

| Phase | Who | What | Duration |
|-------|-----|------|----------|
| 1. Hardware & OS setup | Chris on-site | Boot Mac Minis, install dependencies, Tailscale | 45 min x seats |
| 2. Codebase deploy | Alexander remote | SSH in, clone repo, transfer .env, run migrations | 30 min |
| 3. Agent configuration | Alexander remote | CLAUDE.md, MCP servers, integration tests | 60 min |
| 4. Seat handover | Chris on-site | Demo each seat holder their agent, quick win | 20 min x seats |
| 5. Smoke tests | Alexander remote | Full system test, failure simulation, baseline | 30 min |

### 5.3 Welcome Message Template (Dilan sends to each seat holder)

```
Hi {Name},

Welcome to your new AI department! Your AI agent is now live and ready to help.

Here's what to know:
- Your agent runs 24/7 on your Mac Mini
- Talk to it via {Slack/Discord/Terminal} -- just type naturally
- It knows your business, your tools, and your role
- If it ever goes down, it restarts automatically

Your "Getting Started" guide is attached / in #{channel}.

If you have questions in the first week:
- Quick questions: message me (Dilan) directly
- Technical issues: I'll loop in Alexander
- Feature requests: note them down, we'll review at Week 1 check-in

Your Week 1 check-in is scheduled for: {date/time}

Talk soon!
Dilan
```

---

## Phase 6: Post-Install -- Week 1 Monitoring

**Owner:** Dilan (coordination) + Alexander (technical monitoring)
**Timeline:** Days 1-7 after install

### 6.1 Daily Check-In Schedule

| Day | Dilan Does | Alexander Does |
|-----|-----------|---------------|
| Day 1 | Message each seat holder: "How's it going?" | Check all heartbeats, review agent logs |
| Day 2 | Collect any questions from seat holders | Review first automated reports, check data quality |
| Day 3 | Share one tip/use case per seat holder | Check token usage, verify scheduled tasks ran |
| Day 4 | Ask: "What's the most useful thing so far?" | Review seat holder questions via Slack |
| Day 5 | Send Week 1 review agenda | Prepare technical performance report |
| Day 6-7 | Weekend -- monitor Slack for urgent issues only | Weekend -- monitor heartbeats only |

### 6.2 Week 1 Review Call

**Schedule:** End of first week (Friday or following Monday)
**Duration:** 30 minutes
**Attendees:** Client POC + seat holders + Dilan + Chris (Alexander optional)

**Agenda:**

```
1. What's working well? (5 min)
   - Capture wins -- these become case study material

2. What's not working / confusing? (10 min)
   - Log every issue -- assign to Alexander if technical
   - Adjust agent behavior if expectations are mismatched

3. Quick wins delivered? (5 min)
   - Review the 3 quick wins from intake
   - Mark each as: delivered / in progress / blocked

4. Usage stats (5 min)
   - Agent uptime %
   - Number of interactions per seat
   - Scheduled tasks running on time?

5. Next steps (5 min)
   - Any new integrations to add?
   - Any new automations requested?
   - Schedule Month 1 review
```

### 6.3 Issue Escalation Matrix

| Issue Type | First Response | Escalate To | SLA |
|-----------|---------------|-------------|-----|
| "How do I do X?" | Dilan answers or sends doc link | -- | Same day |
| "Agent gave wrong answer" | Dilan logs it, tells seat holder it's being fixed | Alexander | 24 hours |
| "Agent is down" | Dilan checks #ai-heartbeat channel | Alexander immediately | 1 hour |
| "Agent accessed wrong data" | Dilan escalates immediately | Alexander + Chris | 30 min |
| "We want to cancel" | Dilan schedules retention call with Chris | Chris | 24 hours |
| "We want more seats" | Dilan scopes and sends to Alexander | Alexander for timeline | 48 hours |

---

## Phase 7: Ongoing Management -- Monthly Cadence

**Owner:** Dilan
**Timeline:** Recurring monthly

### 7.1 Monthly Health Check (Dilan runs this)

Do this the last week of every month:

- [ ] Check agent uptime for the month (target: >99%)
- [ ] Review alert history -- any recurring issues?
- [ ] Check token/API usage -- are we within budget?
- [ ] Review any support tickets or questions from the month
- [ ] Prepare monthly summary for client

### 7.2 Monthly Check-In Call Template

**Schedule:** Last week of each month
**Duration:** 20 minutes
**Attendees:** Client POC + Dilan (Chris joins quarterly)

```
MONTHLY CHECK-IN: {Company Name}
Date: {date}
Month: {#} of engagement

1. WINS THIS MONTH
   - [list 3-5 concrete outputs the agents produced]

2. METRICS
   - Agent uptime: ___%
   - Tasks automated: ___ per week
   - Estimated hours saved: ___ hrs/month
   - Cost per automated hour: $___

3. ISSUES RESOLVED
   - [list any issues that came up and how they were fixed]

4. OPEN ITEMS
   - [anything still pending]

5. NEXT MONTH PRIORITIES
   - [what we'll focus on improving]

6. SATISFACTION (ask directly)
   - "On a scale of 1-10, how valuable is the AI department?"
   - If <7: "What would make it an 8 or 9?"
```

### 7.3 Quarterly Business Review (QBR)

Every 3 months, Chris joins the call and runs a deeper review:

- ROI calculation: hours saved x hourly rate vs. monthly fee
- Feature roadmap: what new agents/integrations are planned
- Case study opportunity: "Can we feature your results?"
- Upsell conversation: "Would additional seats help?"
- Contract review: any pricing adjustments needed

### 7.4 Renewal / Churn Prevention

**Renewal signals (good):**
- Asks about adding seats
- Refers another company
- Seat holders actively using agents daily
- Satisfaction score consistently >7

**Churn signals (bad -- act immediately):**
- Seat holders stop using agents
- Support tickets increase
- Client stops responding to check-in scheduling
- Client asks about contract terms or cancellation
- Usage metrics drop significantly

**When you see churn signals:**
1. Message Chris immediately
2. Schedule an emergency review call within 48 hours
3. Prepare a "value delivered" summary showing ROI
4. Offer a free optimization sprint (Alexander fixes top 3 pain points)
5. If they still want to cancel: graceful offboarding (they keep everything)

---

## Appendix A: Client Folder Structure

For every client, create this folder:

```
rawclaw/clients/{client-slug}/
  intake-form.md          -- Completed intake form
  pre-install-checklist.md -- Completed pre-install checklist
  proposal.md             -- The proposal they signed
  install-notes.md        -- Notes from install day
  getting-started-{seat}.md -- One per seat holder
  monthly/
    month-01-review.md
    month-02-review.md
    ...
```

---

## Appendix B: Key File Locations

| What | Path |
|------|------|
| Intake form template | `dineline/onboarding/intake-form.md` |
| Pre-install checklist | `dineline/onboarding/pre-install-checklist.md` |
| Install-day runbook | `dineline/onboarding/install-day-runbook.md` |
| Setup script | `dineline/setup/setup.sh` |
| Env generator | `dineline/setup/generate_env.py` |
| Repo scaffolder | `dineline/setup/scaffold_repo.py` |
| CLAUDE.md templates | `dineline/templates/CLAUDE-{role}.md` |
| Integration clients | `dineline/integrations/` |
| Monitoring scripts | `dineline/monitoring/` |
| Pricing & packaging | `rawclaw/docs/pricing-packaging.md` |
| Demo script | `rawclaw/docs/demo-script.md` |
| Pitch deck | `rawclaw/docs/pitch-deck-script.md` |

---

## Appendix C: SOP Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-30 | Alexander | Initial release -- full lifecycle SOP |

*Raw Claw Client Deployment SOP v1.0*
