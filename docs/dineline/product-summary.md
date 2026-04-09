# Dineline AI Department — Product Summary

**Client:** Dineline — Restaurant Marketing Agency ($500K+/mo revenue)
**Delivery:** 3 Mac Mini seats, each running Claude Code as a dedicated AI agent
**Architecture:** Supabase-backed, role-scoped, 24/7 automated with Discord/Slack reporting
**Model:** claude-sonnet-4-6 on every seat

---

## Seat Overview

| Seat | Person | Role | Location | Access Level |
|------|--------|------|----------|-------------|
| 1 | Nick Chen | Technical Operator | Los Angeles | RLS-restricted (own campaigns + shared data) |
| 2 | Brett Williams | CEO / Founder | Miami | Full company access (RLS bypassed) |
| 3 | Jace Martinez | COO / Operations | Miami | Full company access (RLS bypassed) |

---

## What Each Seat Does

### Brett (CEO) — Strategic Intelligence

**Primary value:** Brett no longer wastes 3 hours/week pulling reports. The agent delivers everything to Slack before he wakes up.

**AI Capabilities:**
- Generates weekly company performance briefings automatically (revenue vs. target, campaign ROI, pipeline health)
- Writes draft LinkedIn posts, X threads, and newsletter content in Brett's voice from real company data
- Builds meeting prep docs: HubSpot history + campaign metrics + talking points, compiled before every client call
- Runs competitive intelligence on any company or market within minutes
- Cross-references revenue data against campaign performance to surface true ROI
- Monitors all 3 agent seats and flags if anything is degraded

**Daily Outputs:**
- Passive awareness feed: recent agent activity, meeting prep items queued, open anomalies

**Weekly Outputs (every Monday 8am ET → Slack #ai-department):**
- Full company scorecard across all departments
- Revenue vs. monthly target
- Pipeline health and forecast
- Content performance summary
- One strategic insight or opportunity

**Tools Connected:** Supabase (full), HubSpot, Google Ads, Stripe (read-only), Notion, Slack

---

### Jace (COO) — Operations & Scorecards

**Primary value:** Jace gets a live operations dashboard in natural language. She asks a question; the agent queries live data and answers with delta, baseline, and recommendation.

**AI Capabilities:**
- Generates daily scorecards: campaign spend vs. budget, lead count vs. target, any metric outside expected range
- Calculates composite KPI scores (1–10) across departments with weighted components
- Detects anomalies automatically and posts to #alerts-ops before humans notice
- Tracks revenue pacing: flags if below 80% of monthly target before the 20th
- Compares current metrics against 30-day baseline AND same period last week/month
- Monitors deliverable health: flags overdue items before they become client problems

**Daily Outputs (auto-generated Mon-Fri at 7am ET → Slack #ai-department + #ops-scorecards):**
- Campaign spend pacing (alert if >5% off budget)
- Lead count vs. daily target
- Any metric outside expected range

**Weekly Outputs:**
- Full company scorecard
- Top and bottom performing campaigns with root cause analysis
- Lead quality breakdown by source
- 3 operational risks with mitigation recommendations

**Anomaly Triggers (automatic alerts):**
| Condition | Threshold |
|-----------|-----------|
| Campaign CPL increase | >20% over 7-day rolling average |
| Lead volume drop | >30% vs. same day last week |
| Campaign ROAS drop | Falls below 1.0 for 3 consecutive days |
| Revenue pacing off | <80% of monthly target before the 20th |
| Deliverable overdue | Due date passed, status != done |
| Daily spend spike | >150% of 7-day average on any campaign |

**Tools Connected:** Supabase (full), HubSpot, Google Ads, Stripe (read-only), ClickUp, Notion, Slack

---

### Nick (Technical) — Execution & Data Sync

**Primary value:** Nick's agent handles the repetitive, error-prone technical work — keeping data fresh, running campaign analysis, tracking tasks — so Nick focuses on actual campaign strategy.

**AI Capabilities:**
- Runs HubSpot CRM sync every 4 hours: pulls contacts, deals, and pipeline data into Supabase
- Runs Google Ads metrics sync daily at 7am: imports last 7 days of campaign performance
- Analyzes campaign performance and generates weekly reports with specific optimization recommendations
- Tracks open ClickUp tasks and deliverable deadlines; surfaces overdue items
- Builds new API integration scripts when needed (saves to `scripts/`)
- Monitors sync health: checks `last_synced` timestamps and alerts on failures

**Automated Syncs:**
| Data | Source | Schedule |
|------|--------|----------|
| CRM contacts & deals | HubSpot API | Every 4 hours |
| Campaign metrics | Google Ads API | Daily 7am |
| SQLite offline cache | Supabase | Every 6 hours |

**Tools Connected:** Supabase (RLS-restricted), HubSpot, Google Ads, ClickUp, Notion, Discord

---

## Integration Map

```
                         DINELINE AI DEPARTMENT
                    ┌─────────────────────────────┐
                    │      Supabase Database        │
                    │   nnaryjadylboqcoyvcuw         │
                    │   22 tables, RLS enforced      │
                    └─────┬──────────┬──────────────┘
                          │          │
           ┌──────────────┘          └──────────────┐
           ▼                                         ▼
    BRETT (CEO)                               JACE (COO)
    Service role key                          Service role key
    Full data access                          Full data access
    Slack #ai-department                      Slack #ops-scorecards
           │                                         │
           └─────────────────┬───────────────────────┘
                             │ monitors
                             ▼
                      NICK (Technical)
                      Anon key + RLS
                      Own campaigns + shared tables
                      Discord reporting

External APIs feeding into system:
  HubSpot ──────────────► Nick syncs → shared hubspot_contacts table
  Google Ads ────────────► Nick syncs → campaign_metrics table
  ClickUp ───────────────► Nick reads → tasks table
  Stripe ────────────────► Brett/Jace reads → revenue table (read-only)

Outbound notifications:
  Slack #ai-department ──► Brett + Jace (weekly reports, daily scorecards)
  Slack #alerts-ops ──────► Jace (anomaly alerts)
  Discord (heartbeat) ────► Alexander (system health every 15 min)
```

---

## Automated Outputs Summary

| Output | Who Gets It | When | Channel |
|--------|------------|------|---------|
| Daily scorecard | Brett + Jace | Mon-Fri 7am ET | Slack #ai-department |
| Anomaly alerts | Jace | Immediate (when triggered) | Slack #alerts-ops |
| Weekly company report | Brett + Jace | Monday 8am ET | Slack #ai-department |
| HubSpot sync log | Internal | Every 4 hours | Supabase agent_activity |
| Google Ads sync | Internal | Daily 7am | Supabase campaign_metrics |
| System heartbeat | Alexander | Every 15 min | Discord #heartbeat |
| API health check | Alexander | Daily 6am UTC | Supabase + Discord |

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Claude API (3 seats, active use) | ~$150-300/mo | claude-sonnet-4-6; varies with query volume |
| Supabase | $25/mo | Pro plan, project nnaryjadylboqcoyvcuw |
| Tailscale | $0 | Free plan covers 3 machines |
| Mac Mini hardware | One-time (client owns) | M2 Mac Mini, ~$699 each |
| **Total ongoing** | **~$175-325/mo** | Scales with usage |

**Setup fee charged to client:** $7,000
**Monthly retainer:** $4,000

---

## ROI Projection

| Function Replaced/Augmented | Estimated Value |
|----------------------------|-----------------|
| Weekly reporting (3 people × 2h) | 6h/week saved → $600-1,200/mo at $100-200/hr |
| CRM data entry and sync | 5h/week saved → $500-750/mo |
| Campaign monitoring and anomaly detection | 10h/week saved → $1,000-2,000/mo |
| Meeting prep research | 3h/week saved → $300-600/mo |
| Content drafting (Brett) | 4h/week saved → $800-1,600/mo (founder time) |
| **Total estimated monthly value** | **$3,200–6,150/mo** |
| **Monthly retainer** | **$4,000/mo** |
| **ROI at mid-estimate** | **~1.2–1.5x at current rates, growing as agents learn** |

At the high end of efficiency gains (as agents learn company-specific patterns over 60–90 days), the value delivered well exceeds the retainer.

---

*Generated: 2026-03-30 | Version: 1.0 | Project: Dineline AI Department*
