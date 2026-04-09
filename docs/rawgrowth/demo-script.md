# Raw Claw -- 20-Minute Sales Demo Script

**Version:** 1.0 | **Date:** 2026-03-30
**For:** Chris West -- live sales demos, screen-share calls, and recorded walkthroughs
**Setup required:** Dineline demo instance running (dashboard + Telegram/Slack agent)

---

## Before the Demo

### Pre-Demo Checklist (5 min before call)

- [ ] Dineline demo dashboard is running and accessible
- [ ] Telegram bot is responding (send a test message)
- [ ] Slack demo workspace is open (or Discord if client uses Discord)
- [ ] Screen share ready -- close all personal tabs
- [ ] Demo data is fresh (run daily scorecard if needed)
- [ ] Prospect's company name, industry, and pain points from discovery call loaded in your notes
- [ ] Pricing tier pre-selected based on their seat count

### What to Have Open (in tab order)

1. The dashboard (localhost or Cloudflare tunnel URL)
2. Telegram (or Slack) -- the agent chat interface
3. A sample daily scorecard (screenshot or live)
4. Pricing slide (from pitch deck, Slide 13)
5. Calendar link (for booking the install planning call)

---

## The Demo Script

### MINUTE 0-2: The Hook

**DON'T start with features. Start with their problem.**

```
"Thanks for taking the time, {Name}. Before I show you anything,
let me ask you this -- how many hours per week does your team spend
on tasks that a smart assistant could handle? Things like pulling
reports, updating the CRM, writing content, following up on leads."

[Let them answer. Mirror back their number.]

"So you're looking at roughly {X} hours a week -- that's {X*50}
hours a year of human time on work that doesn't require human
judgment. What if I could show you a system that handles 80% of
that, runs 24/7, and gets better every month?"
```

**Transition:**
```
"Let me show you exactly what this looks like. I'm going to pull up
a live system we installed for a client -- a restaurant marketing
agency doing over $500K a month. Same kind of setup you'd get."
```

---

### MINUTE 2-5: The Chat Interface (Telegram/Slack)

**Show the agent responding to a natural language question.**

```
"This is the AI agent running for their COO. Watch what happens
when I ask it a business question."
```

**Live demo -- type into Telegram or Slack:**

> "What were our top 3 performing campaigns last week by ROAS?"

**While waiting for the response:**
```
"This isn't ChatGPT. This agent is connected to their actual
CRM, their ad platforms, their project management tool. It's
not guessing -- it's pulling real data from their real systems."
```

**When the response comes back:**
```
"See that? Real campaign data. Real numbers. The agent pulled
that from {HubSpot/Meta Ads/Google Ads} in about 10 seconds.
That same question used to take their ops person 20-30 minutes
to compile from three different dashboards."
```

**Second demo query -- type:**

> "Draft a follow-up email for the 5 leads that went cold last week"

```
"Now watch this. The agent knows the CRM pipeline. It identifies
the cold leads, writes personalized follow-ups in the company's
voice, and can send them on approval -- or just queue them for
review. Your team reviews for 30 seconds instead of writing for
30 minutes."
```

---

### MINUTE 5-9: The Dashboard

**Switch to the dashboard tab.**

```
"This is what the CEO sees every morning without asking anyone
for a report."
```

**Walk through each section (point and narrate):**

1. **Revenue overview:**
   ```
   "Revenue, pipeline value, cash flow -- all real-time. This
   updates automatically from Stripe and HubSpot."
   ```

2. **Agent activity feed:**
   ```
   "Here you can see what each agent has been doing. This one
   ran a daily scorecard at 7 AM. This one synced 150 contacts
   from HubSpot. This one generated 12 content pieces."
   ```

3. **Metrics and KPIs:**
   ```
   "Custom metrics for their business. Campaign CPL, pipeline
   conversion rate, content output per week. You tell us what
   matters, we build it into the dashboard."
   ```

4. **Uptime and health:**
   ```
   "And this is the system health view. Three agents, all green,
   running 24/7. If anything goes down, our team gets an alert
   within 15 minutes and fixes it remotely."
   ```

**Key selling line:**
```
"This dashboard replaces the Monday morning 'where are we at?'
meeting. The answer is always here, always current. Nobody had
to pull a single number."
```

---

### MINUTE 9-12: Automated Reports

**Show a daily scorecard (live or screenshot).**

```
"Every morning at 7 AM, the COO's agent compiles a daily
scorecard and posts it to Slack. Let me show you what that
looks like."
```

**Pull up the scorecard and walk through it:**

```
"Campaign performance, lead pipeline status, revenue snapshot,
any anomalies flagged. This used to be someone's entire Monday
morning. Now it's done before anyone wakes up."
```

**Then show the weekly report:**

```
"And every Monday at 8 AM, the full weekly report drops. Spend
vs. budget, leads generated, deals closed, pipeline health,
top 3 wins, top 3 risks. The CEO reads it with coffee and
knows exactly where the business stands."
```

---

### MINUTE 12-14: Multi-Channel Capability

```
"One thing I want to highlight -- these agents aren't stuck in
one app. They can communicate through Telegram, Slack, Discord,
WhatsApp, or email. Whatever your team already uses."
```

**Quick demo (if time allows):**
- Show the same agent responding in Telegram
- Show an alert appearing in Discord
- Show a scheduled report posted to Slack

```
"Your team doesn't learn a new tool. The AI meets them where
they already work."
```

---

### MINUTE 14-17: The Business Case

**Switch to the comparison (or just talk through it).**

```
"Let me put some numbers on this. If you were to hire people
to do what these agents do -- content, sales ops, reporting,
operations -- you're looking at $280-410K a year in salary
alone. Not counting benefits, management overhead, or the
4-6 months it takes to hire and ramp someone.

With Raw Claw, your Year 1 all-in cost is ${setup + 12*monthly}.
Year 2 drops to ${12*monthly} because there's no setup fee.

That's a savings of ${traditional - rawclaw} per year. And the
agents get better over month, not more expensive."
```

**Pause for reaction. Then:**

```
"The ROI payback on this is typically 30-60 days. After that,
you're saving money every single month."
```

---

### MINUTE 17-19: Objection Handling

**Be ready for these. Address whichever comes up:**

**"What if the AI makes mistakes?"**
```
"Great question. The agents are configured with guardrails per
role. For example, a Technical seat can't access financial data.
Content goes through approval before publishing. And everything
is logged -- you can see exactly what the agent did and why.

We also set acceptable use policies during onboarding. You decide
what the agents can and can't do autonomously."
```

**"What about our data / security?"**
```
"Your data stays on your hardware and in your Supabase database.
We use Row-Level Security so each seat only sees what they should.
The AI queries go to Anthropic's API, which doesn't train on your
data. We provide a Data Processing Agreement for clients who need it.

And if you ever cancel -- you keep everything. The code, the agents,
the data. We don't hold anything hostage."
```

**"Can't we just use ChatGPT?"**
```
"You could. And that's what most companies try first. The difference
is this: ChatGPT doesn't know your CRM data. It doesn't run reports
at 7 AM. It doesn't sync your pipeline every 4 hours. It doesn't
restart itself when it crashes.

What we install is a connected, always-on system trained on YOUR
business. ChatGPT is a chatbox. This is a department."
```

**"$X is a lot of money."**
```
"It is an investment. Let me ask you this -- what's the cost of one
bad hire? $50-80K in salary, onboarding, and lost productivity
before you even know it's not working out. This investment pays for
itself in 30-60 days, and you never have a bad hire, a sick day,
or a resignation letter."
```

**"We need to think about it."**
```
"Totally understand. The one thing I want to make sure you know --
we take 8 clients per quarter. Every install gets our CTO's direct
attention, so we can't take on unlimited work. I'm not trying to
pressure you, but I want you to have that context for your timeline."
```

---

### MINUTE 19-20: The Close

```
"Here's what happens next if this makes sense for you.

Step 1: We do a 30-minute install planning call. On that call,
we scope exactly what your AI department looks like -- which agents,
which integrations, which metrics matter.

Step 2: You provide access to your tools (API keys, CRM login, etc.)
and we handle all the configuration.

Step 3: Install day. I fly out (or we do it remotely), and your AI
department is live within a day.

From signed agreement to live agents -- about 2-3 weeks.

Want to get that planning call on the calendar?"
```

**If they say yes:** Book it immediately. Send confirmation + the intake form within 1 hour.

**If they say "let me think":**
```
"Completely fair. I'll send you a summary of what we covered today
plus the case study. Take a look, talk to your team, and let me
know if any questions come up. I'll follow up {day} -- does that work?"
```

---

## Post-Demo Follow-Up

### Within 1 hour of demo:

Send via email:

```
Subject: {Name} -- your AI department walkthrough + next steps

Hi {Name},

Great talking today. Here's a quick recap:

- Your AI department: {X} seats covering {roles}
- Key integrations: {CRM}, {ad platform}, {PM tool}
- Quick win we identified: {their #1 pain point}
- Investment: ${setup} setup + ${monthly}/month

Attached: case study from a similar client in your industry.

Next step: 30-minute planning call to scope the details.
Here's my calendar: [LINK]

If any questions come up, just reply to this email.

Chris
```

### If no response after 48 hours:

```
Subject: Re: your AI department walkthrough

Quick follow-up -- did you get a chance to review the summary?

Happy to jump on a 10-minute call if anything's unclear.

Chris
```

### If no response after 5 days:

```
Subject: Should I close this out?

Hi {Name},

Haven't heard back so I want to check -- is the AI department
still something you're exploring, or should I close this out
for now?

Either way is fine. Just want to make sure I'm not following
up if the timing isn't right.

Chris
```

---

## Demo Variants

### For Screen-Share Sales Calls (most common)
- Skip the hook if rapport is already built from discovery
- Spend the most time on: chat interface, dashboard, and case study
- Always end by pulling up the live dashboard

### For Recorded Loom (async)
- Record with face cam in bottom-left corner
- Subject line: "{Name} -- your AI department walkthrough (18 min)"
- Follow up 24 hours later: "Did you get a chance to watch?"
- Keep to 15-18 minutes max

### For In-Person Meetings
- Bring a laptop with the demo pre-loaded
- If possible, set up a spare Mac Mini in the meeting room running the agent live
- Let the prospect type a question into Telegram themselves
- Physical demonstration is 3x more convincing than screen-share

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-30 | Initial release |

*Raw Claw Demo Script v1.0*
