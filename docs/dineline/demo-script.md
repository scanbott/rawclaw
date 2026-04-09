# Dineline AI Department — Demo Script
## 15-Minute Sales Walkthrough for Chris West

**Purpose:** Show a prospect (restaurant marketing agency owner) what their AI department actually does — live, in their terms, with real-looking outputs.

**Audience:** Agency owners, ops leads, or founders who already understand digital marketing. Skip jargon. Show value.

**Setup before the call:**
- Have a browser tab open to a Slack workspace showing #ai-department
- Have a terminal or Claude Code window open (can be on your own machine)
- Have the daily scorecard example ready (screenshot or live from test seat)
- Know your prospect's pain points (reporting time, data silos, campaign monitoring)

---

## The Hook (0:00–1:00) — Set the Frame

> "Let me show you what your team's Mondays look like in 6 weeks."

Open Slack. Show a message that was auto-posted to #ai-department:

```
Dineline Weekly Brief — Monday, March 30 · 8:00 AM

Revenue: $487K / $500K target (97.4% — on pace)
Leads this week: 312 (↑18% WoW)
Pipeline: $94K open deals, $31K in final stages
Top campaign: Miami Restaurants Search — ROAS 4.2x
Risk: LA Metro Display CPL up 31% — see scorecard for fix

Full report in Notion → [link]
```

**Say:**
> "Your COO didn't write that. Your CEO didn't pull that data. Nobody on your team spent Sunday afternoon in a spreadsheet. That arrived automatically at 8 AM. Let me show you how it works."

---

## Seat 1: Brett (CEO) — The Overview (1:00–4:00)

**Pain to surface first:**
> "How much time does your CEO or founder spend every week pulling together a status update? Across Slack, HubSpot, Google Ads, Stripe?"

**Show:**
Open the CEO's Claude Code window (or screen-share a simulation). Type:

```
Prepare my Monday brief.
```

The agent pulls from Supabase (which has synced data from HubSpot + Google Ads) and generates:
- Revenue vs. target
- Pipeline health
- Top 3 wins, top 3 risks
- One strategic opportunity

**Say:**
> "Brett asks one question. The agent already queried live HubSpot data, live Google Ads data, checked Stripe revenue, and formatted the whole thing. This took under 30 seconds. Brett used to spend 90 minutes on this every Monday."

**Then show content creation:**

```
Draft a LinkedIn post about our Q1 client results. Use build-in-public style. Real numbers.
```

Agent drafts a post in Brett's voice, with real data, ready to review and post.

**Say:**
> "Thought leadership content. His voice. Real company wins. Drafted in 20 seconds. He reviews it in 2 minutes."

---

## Seat 2: Jace (COO) — The Scorecard (4:00–7:00)

**Pain to surface first:**
> "When something goes wrong in a campaign — when CPL spikes, when leads drop, when a client is about to churn — when does your team find out? How long does it take to figure out why?"

**Show:**
Open #alerts-ops in Slack. Show an example alert:

```
ANOMALY DETECTED — 2026-03-29 14:32 ET

Campaign: Miami Restaurants Search (Google)
Metric: Cost Per Lead
Current: $47.20 | 7-day baseline: $31.40
Deviation: +50.3%

Likely cause: Quality score drop on 3 ad groups (competitor bid increase detected)
Recommended action: Pause "Italian Restaurant" ad group, shift budget to "Seafood" cluster
Ticket created: ClickUp #8812
```

**Say:**
> "That alert fired automatically at 2:32 in the afternoon. Nobody was watching a dashboard. Nobody ran a report. The agent detected the CPL spike, diagnosed the likely cause, and created the ClickUp ticket. Jace saw it in Slack."

**Then show a scorecard query:**

```
How is our lead generation performing this week vs. last week?
```

Agent returns a structured table with WoW comparison, baseline delta, and anomaly flags.

**Key talking point:**
> "The COO seat is basically a real-time operations analyst that never sleeps. It watches every campaign, every metric, every deliverable deadline. It tells you what's wrong before your client does."

---

## Seat 3: Nick (Technical) — The Execution (7:00–10:00)

**Pain to surface first:**
> "Does your team spend time every day manually pulling data from HubSpot into spreadsheets? Exporting ad metrics? Updating task lists?"

**Show:**
Open the agent_activity log (or a terminal showing the sync job):

```
[07:00 ET] Google Ads sync: 847 metrics rows updated (12 campaigns, 7 days)
[07:04 ET] Sync complete. 3 new campaigns detected. Added to campaign_metrics.
[11:00 ET] HubSpot sync: 234 contacts updated, 18 new, 4 stage changes
```

**Say:**
> "Nick's agent runs the data pipeline automatically. Every 4 hours, HubSpot contacts are up to date in the company database. Every morning, Google Ads metrics are fresh. Nick doesn't have to touch this — it just runs."

**Then show task work:**

```
What ClickUp tasks are overdue or due today?
```

Agent queries ClickUp, surfaces overdue deliverables, provides a prioritized list.

**Key talking point:**
> "Nick's time goes to campaign strategy and client work — not to copy-pasting data between tools."

---

## The Memory Demo (10:00–12:00)

This is the "wow moment" that separates this from a simple AI chatbot.

**Show:**
Ask the agent a contextual question:

```
Last week you flagged a CPL issue on the LA campaign. What was the outcome?
```

Agent recalls from Supabase (agent_activity + campaign_metrics):
> "The LA Metro Display CPL spike on March 22 was resolved by pausing the 'Fast Food' ad group and reallocating $2,400 to the 'Fine Dining' cluster. CPL dropped from $47 to $33 over 4 days. The campaign is now within target range."

**Say:**
> "It remembers. Not because I told it to. Because every action it takes gets logged in the company database. Every insight gets stored as a knowledge item. You build institutional memory from day one. That doesn't exist in a regular AI assistant."

---

## Objection Handlers (12:00–14:00)

Use these when they come up naturally:

**"We already have tools for this."**
> "Those tools generate data. This interprets data, writes the report, flags the problem, and takes action. It's the layer on top of your tools that no tool can replace."

**"My team doesn't use AI."**
> "They don't need to. Brett still uses Slack. Jace still uses Slack. Nick still uses ClickUp. The agent runs in the background and delivers outputs where they already work. Nobody has to learn a new tool."

**"What if it gets something wrong?"**
> "Every output is a draft for human review, not an automated action. Content doesn't get posted without approval. The agent surfaces options — your team makes the call."

**"Can it connect to [other tool]?"**
> "If there's an API, yes. We've built native integrations for HubSpot, Google Ads, ClickUp, Stripe, Slack, and Notion. Additional integrations typically take 1–2 days."

**"What's the security model?"**
> "Every seat has role-scoped database access. Nick can't see Brett's content or revenue data. Everything runs on your infrastructure — a Mac Mini you own, with your credentials. We don't have access to your client data."

---

## The Close (14:00–15:00)

> "What you're looking at is a three-person AI department that works 24/7, never misses a Monday report, never forgets what happened last month, and gets smarter about your business every week.

> The setup takes about one day — we install the hardware, we configure everything, we hand each person their getting-started guide. After that, it runs.

> Setup is $7,000. Monthly is $4,000. Most agencies see that value back in the first 30 days just from the time saved on reporting and data management alone.

> What would be the most valuable thing your team could stop doing manually?"

**[Let them answer. That's your discovery for the next conversation."]**

---

## Screen Flow Summary

| Time | What to Show | Tool |
|------|-------------|------|
| 0:00 | Weekly brief in Slack #ai-department | Slack |
| 1:00 | CEO agent generating brief in real time | Claude Code (Brett seat) |
| 3:00 | CEO agent drafting LinkedIn post | Claude Code (Brett seat) |
| 4:00 | Anomaly alert in Slack #alerts-ops | Slack |
| 5:30 | COO asking "how is lead gen performing?" | Claude Code (Jace seat) |
| 7:00 | Sync logs (HubSpot + Google Ads auto-running) | Terminal / Supabase |
| 8:00 | Nick asking for overdue tasks | Claude Code (Nick seat) |
| 10:00 | Memory recall — "what happened with LA campaign?" | Claude Code |
| 12:00 | Objection handling (conversational) | — |
| 14:00 | Close / discovery question | — |

---

*Version: 1.0 | Owner: Chris West | Updated: 2026-03-30*
