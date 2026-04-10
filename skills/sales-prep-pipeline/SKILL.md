---
name: sales-prep-pipeline
description: Automated sales call prep pipeline. Given a prospect name or upcoming call, pulls similar past sales calls from Supabase, analyzes objection patterns and what closed, loads into NotebookLM for grounded insights, and generates a call prep brief with talking points, anticipated objections, and recommended approach. Triggers on "prep for call with [X]", "sales prep [X]", "call prep [X]", or before any booked sales call.
user-invocable: true
---

# Sales Call Prep Pipeline

**Flow:** Prospect Info -> Past Call Data -> NotebookLM Analysis -> Call Prep Brief

No pauses. Run end to end once triggered.

Parse the user's message for:
- **Prospect name or company** (required)
- **Any known context** (optional) — industry, size, how they found us

---

## Step 1: Gather Intelligence

### 1a. Prospect Data (if exists)

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

# Check if prospect exists in clients or brand_intake
clients = supabase_select('clients', '?select=*&name=ilike.*<PROSPECT>*', limit=5)
intake = supabase_select('brand_intake', '?select=*&client_name=ilike.*<PROSPECT>*', limit=5)
print('CLIENTS:', json.dumps(clients, indent=2, default=str))
print('INTAKE:', json.dumps(intake, indent=2, default=str))
"
```

### 1b. Past Sales Calls (all of them)

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

calls = supabase_select('sales_calls', '?select=prospect_name,title,transcript,objections,pain_points,outcome,summary,action_items,meeting_date&order=meeting_date.desc', limit=20)
print(json.dumps(calls, indent=2, default=str))
" > /tmp/sales-prep-calls.json
```

### 1c. Revenue Data (context on deal sizes)

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

revenue = supabase_select('revenue', '?select=*&order=transaction_date.desc', limit=10)
print(json.dumps(revenue, indent=2, default=str))
" > /tmp/sales-prep-revenue.json
```

### 1d. Sales Playbook from Vault

```bash
python3 ~/tools/scripts/vault-search.py --query "sales playbook objection handling"
python3 ~/tools/scripts/vault-search.py --query "offer pricing"
python3 ~/tools/scripts/vault-search.py --query "ICP ideal customer"
```

Read the relevant files (offer structure, ICP, objection handling scripts).

## Step 2: NotebookLM Analysis

### 2a. Prepare Sources

Export sales call data to a Google Doc for NotebookLM:

```bash
mcp__google-workspace__create_doc -> title: "Sales Prep: <PROSPECT>"
```

Write into the doc:
- All past call transcripts/summaries
- Objections and outcomes for each call
- Prospect's intake data (if available)

### 2b. Create Notebook & Add Sources

Use Playwright MCP to create a NotebookLM notebook and add the Google Doc.

### 2c. Register & Query

```bash
python ~/.claude/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "<NOTEBOOK_URL>" \
  --name "Sales Prep: <PROSPECT>" \
  --description "Sales call prep for <PROSPECT>. Past calls, objections, outcomes." \
  --topics "sales,call prep,<PROSPECT>"
```

**Q1 — Objection patterns:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What are the most common objections across all sales calls? How were they handled? Which responses led to closes vs losses?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q2 — What closes:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What patterns appear in the calls that resulted in a close? What was the approach, framing, or specific language that worked?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q3 — Prospect-specific (if data exists):**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Based on the prospect's profile and industry, which past calls are most similar? What approach would likely work best for this specific prospect?" \
  --notebook-url "<NOTEBOOK_URL>"
```

## Step 3: Generate Call Prep Brief

Combine all intelligence into a structured brief:

```
## Call Prep: [PROSPECT NAME]
**Date:** [call date]  |  **Industry:** [if known]  |  **Source:** [how they found us]

### Prospect Profile
[Everything known about them — intake data, company, size, current situation]

### Similar Past Calls
[2-3 most similar past prospects, what happened, what worked/didn't]

### Anticipated Objections (ranked by likelihood)
1. **[Objection]** — Recommended response: [based on what worked in past calls]
2. **[Objection]** — Recommended response: [...]
3. **[Objection]** — Recommended response: [...]

### Recommended Approach
- **Lead with:** [specific angle based on their likely pain points]
- **Proof points to use:** [specific client results relevant to their situation]
- **Avoid:** [approaches that failed with similar prospects]
- **Close strategy:** [what's worked with similar deals]

### Talking Points
1. [Point — tied to their specific situation]
2. [Point — addresses likely objection preemptively]
3. [Point — proof/case study relevant to them]

### Pricing Strategy
- **Recommended package:** [based on their size/needs]
- **If price objection:** [specific response from playbook]
- **If timeline objection:** [specific response]

### Post-Call Actions
- [ ] Log transcript to Supabase
- [ ] Update outcome
- [ ] Send follow-up [email/DM/proposal]
```

## Step 4: Feed Back

After the call, log the result:

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_insert, now_iso
supabase_insert('sales_calls', {
    'prospect_name': '<PROSPECT>',
    'title': '<CALL_TITLE>',
    'meeting_date': '<DATE>',
    'outcome': '<OUTCOME>',
    'objections': '<OBJECTIONS>',
    'pain_points': '<PAIN_POINTS>',
    'summary': '<SUMMARY>',
    'created_at': now_iso()
})
print('Call logged')
"
```

## Error Handling

| Problem | Solution |
|---------|----------|
| No past calls in Supabase | Use sales playbook + ICP from vault only |
| Prospect not in system | Prep based on similar industry/size prospects |
| NotebookLM fails | Analyze call JSON directly, still generate brief |
| No revenue data | Skip pricing insights, use standard offer from vault |

## Cleanup

```bash
rm -f /tmp/sales-prep-*.json
```
