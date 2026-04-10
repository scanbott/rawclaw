---
name: funnel-pipeline
description: Data-driven funnel optimization pipeline. Analyzes conversion data, sales call transcripts, content performance, and copy across funnel stages to identify the highest-leverage optimization. Pulls from Supabase (funnel_analytics, sales_calls, revenue, content_pipeline), loads into NotebookLM for grounded analysis, and outputs specific changes with predicted impact. Triggers on "optimize funnel", "funnel pipeline", "why aren't we converting", "fix [landing page/email/funnel step]", or any conversion optimization request.
user-invocable: true
---

# Funnel Optimization Pipeline

**Flow:** Funnel Data -> Sales Call Insights -> Content Attribution -> NotebookLM Analysis -> Optimization Brief

No pauses. Run end to end.

Parse the user's message for:
- **Funnel stage** (optional) — landing page, email sequence, booking page, entire funnel
- **Specific problem** (optional) — low conversion, high drop-off, unqualified leads

---

## Step 1: Gather Funnel Data

### 1a. Funnel Analytics (if data exists)

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

# Funnel events
analytics = supabase_select('funnel_analytics', '?select=*&order=created_at.desc', limit=100)
print('FUNNEL_ANALYTICS:', json.dumps(analytics, indent=2, default=str))
" > /tmp/funnel-analytics.json
```

### 1b. Revenue & Transaction Data

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

revenue = supabase_select('revenue', '?select=*&order=transaction_date.desc', limit=20)
print(json.dumps(revenue, indent=2, default=str))
" > /tmp/funnel-revenue.json
```

### 1c. Sales Calls (lead quality + source attribution)

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

calls = supabase_select('sales_calls', '?select=prospect_name,summary,objections,pain_points,outcome,meeting_date&order=meeting_date.desc', limit=18)
print(json.dumps(calls, indent=2, default=str))
" > /tmp/funnel-calls.json
```

### 1d. Content That Drives Traffic

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

content = supabase_select('content_pipeline', '?select=*&order=created_at.desc', limit=30)
print(json.dumps(content, indent=2, default=str))
" > /tmp/funnel-content.json
```

### 1e. Current Copy & Offer from Vault

```bash
python3 ~/tools/scripts/vault-search.py --query "funnel landing page conversion"
python3 ~/tools/scripts/vault-search.py --query "offer pricing structure"
python3 ~/tools/scripts/vault-search.py --query "email sequence"
```

Read the offer structure, current landing page copy, and email sequences.

## Step 2: NotebookLM Analysis

### 2a. Prepare Sources

Export to a Google Doc:

```bash
mcp__google-workspace__create_doc -> title: "Funnel Analysis: [DATE]"
```

Write into the doc:
- Funnel metrics (conversion at each stage if available)
- Sales call summaries with outcomes (closed/lost/no-show)
- Objections and pain points from calls
- Revenue data and deal sizes
- Current copy/offer summary

### 2b. Create Notebook & Add Sources

Playwright MCP flow: create notebook -> add Google Doc + any live funnel URLs (landing page, booking page).

### 2c. Query for Insights

**Q1 — Where's the leak:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Based on all available data, where is the biggest drop-off in our funnel? Where are we losing the most potential revenue? What does the data suggest about why?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q2 — Lead quality signal:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Looking at sales calls — are the leads coming in qualified? What do prospects say about how they found us and what they expected? Is there a mismatch between what the funnel promises and what prospects experience on calls?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q3 — What converts:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "In the deals that closed, what was the journey? What content did they consume? What objections did they have and how were they overcome? What's the pattern in successful conversions?" \
  --notebook-url "<NOTEBOOK_URL>"
```

## Step 3: Load Optimization Frameworks

```bash
python3 ~/tools/scripts/vault-search.py --query "conversion optimization"
source ~/.zshrc && python3 ~/tools/knowledge_base.py search "copy framework sales page"
```

## Step 4: Generate Optimization Brief

```
## Funnel Optimization Brief — [DATE]
**Data Sources:** [X] funnel events | [X] sales calls | [X] revenue records
**NotebookLM:** [notebook URL]

### Current Funnel State
| Stage | Metric | Status |
|-------|--------|--------|
| Traffic → Landing Page | [visits if known] | [healthy/concern] |
| Landing Page → Booking | [conversion % if known] | [healthy/concern] |
| Booking → Show Rate | [% if known] | [healthy/concern] |
| Call → Close | [X/Y = %] | [healthy/concern] |
| Average Deal Size | $[X] | [target comparison] |

### Biggest Leak
**Stage:** [where the biggest drop-off is]
**Evidence:** [data supporting this]
**Root Cause:** [why, based on calls + data]

### Lead Quality Assessment
- **Qualified rate:** [X% of calls are qualified based on outcomes]
- **Common disqualifiers:** [from call data]
- **Expectation mismatch:** [if funnel promises don't match call experience]

### Recommended Optimizations (ranked by impact)

1. **[Change]** — Expected impact: [X% improvement in Y]
   - What: [specific change to make]
   - Why: [data-backed reasoning]
   - Evidence: [from calls/metrics]
   - Owner: [agent]

2. **[Change]** — Expected impact: [...]
   - What: [...]
   - Why: [...]

3. **[Change]** — Expected impact: [...]
   - What: [...]
   - Why: [...]

### Copy Changes (if applicable)
For each recommended copy change, provide before/after:

**Before:** [current copy]
**After:** [recommended copy]
**Why:** [specific objection or data point this addresses]

### Tracking Plan
What to measure after implementing changes:
- [ ] [Metric] — baseline: [current] — target: [goal]
- [ ] [Metric] — baseline: [current] — target: [goal]
- [ ] Review in [X] days
```

## Step 5: Feed Back

```bash
python3 ~/tools/scripts/save-deliverable.py \
  --title "Funnel Optimization: [DATE]" \
  --type document \
  --agent scan \
  --file /tmp/funnel-optimization.md \
  --tags '["funnel", "optimization", "pipeline"]' \
  --status completed
```

## Error Handling

| Problem | Solution |
|---------|----------|
| funnel_analytics table empty | Use sales calls as proxy — close rate, objection data, lead source |
| No revenue data | Focus on qualitative analysis from calls |
| Few sales calls | Use what exists + general conversion best practices from vault |
| NotebookLM fails | Analyze data directly, still generate brief |
| No live funnel URLs | Skip competitor comparison, focus on internal data |

## Cleanup

```bash
rm -f /tmp/funnel-*.json /tmp/funnel-optimization.md
```
