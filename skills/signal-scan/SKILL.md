---
name: signal-scan
description: Biweekly cross-domain pattern recognition engine. Analyzes sales calls, revenue, content, and deliverables to find non-obvious correlations, trending shifts, and actionable insights. Stores patterns in Supabase with confidence scoring and compounding history. Reports findings to Chris via Telegram.
user-invocable: true
---

# Signal Scan -- Cross-Domain Pattern Recognition

**Flow:** Pull All Data -> Cross-Domain Analysis -> Pattern Comparison -> Store & Score -> Report Findings

No pauses. Run end to end. This is an intelligence sweep, not a report generator.

---

## Step 1: Pull All Business Data

### 1a. Sales Calls (the richest signal)

```bash
source ~/.zshrc && python3 -c "
import os, json, urllib.request

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_KEY']

req = urllib.request.Request(
    f'{url}/rest/v1/sales_calls?select=id,title,prospect_name,meeting_date,summary,objections,pain_points,outcome,notes&order=meeting_date.desc',
    headers={'apikey': key, 'Authorization': f'Bearer {key}'}
)
data = json.loads(urllib.request.urlopen(req).read())
print(json.dumps(data, indent=2, default=str))
" > /tmp/signal-scan-calls.json
```

### 1b. Revenue & Transactions

```bash
source ~/.zshrc && python3 -c "
import os, json, urllib.request

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_KEY']

req = urllib.request.Request(
    f'{url}/rest/v1/revenue?select=customer_name,customer_email,company,amount,type,description,source,utm_source,status,is_recurring,mrr_contribution,churned_at,churn_reason,transaction_date&order=transaction_date.desc',
    headers={'apikey': key, 'Authorization': f'Bearer {key}'}
)
data = json.loads(urllib.request.urlopen(req).read())
print(json.dumps(data, indent=2, default=str))
" > /tmp/signal-scan-revenue.json
```

### 1c. Deliverables (work output history)

```bash
source ~/.zshrc && python3 -c "
import os, json, urllib.request

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_KEY']

req = urllib.request.Request(
    f'{url}/rest/v1/deliverables?select=id,title,type,agent,status,tags,created_at&order=created_at.desc',
    headers={'apikey': key, 'Authorization': f'Bearer {key}'}
)
data = json.loads(urllib.request.urlopen(req).read())
print(json.dumps(data, indent=2, default=str))
" > /tmp/signal-scan-deliverables.json
```

### 1d. Content Pipeline (if populated)

```bash
source ~/.zshrc && python3 -c "
import os, json, urllib.request

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_KEY']

req = urllib.request.Request(
    f'{url}/rest/v1/content_pipeline?select=*&order=created_at.desc',
    headers={'apikey': key, 'Authorization': f'Bearer {key}'}
)
try:
    data = json.loads(urllib.request.urlopen(req).read())
    print(json.dumps(data, indent=2, default=str))
except:
    print('[]')
" > /tmp/signal-scan-content.json
```

### 1e. Previous Patterns (for comparison)

```bash
source ~/.zshrc && python3 -c "
import os, json, urllib.request

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_KEY']

req = urllib.request.Request(
    f'{url}/rest/v1/patterns?select=*&order=last_confirmed.desc',
    headers={'apikey': key, 'Authorization': f'Bearer {key}'}
)
data = json.loads(urllib.request.urlopen(req).read())
print(json.dumps(data, indent=2, default=str))
" > /tmp/signal-scan-previous.json
```

Read ALL five files. You need them all loaded to find cross-domain patterns.

---

## Step 2: Cross-Domain Analysis

With all data loaded, run these analyses. Think deeply. The value is in non-obvious connections.

### Analysis 1: Close Pattern Analysis
- What do CLOSED deals have in common that LOST deals don't?
- Look at: objections raised, pain points mentioned, prospect industry/size, meeting timing, call duration signals in summary
- What language patterns appear in successful calls vs unsuccessful?

### Analysis 2: Objection Trending
- Which objections are appearing MORE frequently over time?
- Which objections have DISAPPEARED?
- Are new objections emerging that weren't present in earlier calls?
- Map objection frequency by month/period

### Analysis 3: Revenue Pattern Detection
- Average deal size trending up or down?
- Any correlation between lead source (utm_source) and deal size?
- Recurring vs one-time ratio shifting?
- Churn patterns -- any commonalities in churned customers?
- Time between first call and close -- is it changing?

### Analysis 4: Content-to-Revenue Attribution
- Can you trace any revenue back to specific content or deliverable types?
- Which deliverable types correlate with periods of higher revenue?
- What content was produced in the weeks BEFORE closed deals?
- Agent workload distribution -- who's producing what?

### Analysis 5: Operational Velocity
- Deliverable output rate trending up or down?
- Time gaps between deliverables -- any bottlenecks?
- Which agent is most/least active?
- Are deliverable types shifting (more sales copy? more research? more content?)

### Analysis 6: Signal Gaps
- What data are we NOT collecting that would make patterns clearer?
- What questions can't you answer because the data doesn't exist?
- Recommend specific fields or tables to add

---

## Step 3: Pattern Comparison

Compare each finding against `/tmp/signal-scan-previous.json`:

- **New pattern:** Not seen before. Store with confidence 0.5
- **Confirmed pattern:** Matches a previous pattern. Increment `times_confirmed`, bump confidence by 0.1 (max 1.0), update `last_confirmed`
- **Contradicted pattern:** Evidence now contradicts a stored pattern. Set status to `invalidated`, note why
- **Evolved pattern:** Similar to previous but shifted. Update description, reset confidence to 0.6

---

## Step 4: Store Patterns

For each pattern found, upsert to Supabase:

```bash
source ~/.zshrc && python3 -c "
import os, json, urllib.request, datetime

url = os.environ['SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_KEY']

scan_id = 'scan-' + datetime.datetime.now().strftime('%Y%m%d-%H%M')

# For NEW patterns:
pattern = {
    'pattern_type': 'correlation',  # or 'trend', 'anomaly', 'gap', 'shift'
    'domain': 'sales+revenue',      # which domains this crosses
    'title': 'PATTERN TITLE',
    'description': 'DETAILED DESCRIPTION WITH EVIDENCE',
    'evidence': json.dumps([{'source': 'sales_calls', 'detail': 'specific evidence'}]),
    'confidence': 0.5,
    'status': 'new',
    'scan_id': scan_id,
    'tags': '{sales,revenue}',
    'actionable': True,
    'impact_score': 0.7  # 0-1, how much this could move the needle
}

data = json.dumps(pattern).encode()
req = urllib.request.Request(
    f'{url}/rest/v1/patterns',
    data=data,
    headers={
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    },
    method='POST'
)
urllib.request.urlopen(req)
print('Pattern stored:', pattern['title'])

# For CONFIRMED patterns (update existing):
# Use PATCH with ?id=eq.<uuid>
# Increment times_confirmed, update last_confirmed, bump confidence
"
```

Repeat for each pattern. Use a separate Python call for each to avoid failures cascading.

### Pattern Types
- `correlation` -- two things move together across domains
- `trend` -- something is consistently increasing/decreasing over time
- `anomaly` -- something unexpected or out of normal range
- `gap` -- missing data or capability that limits insight
- `shift` -- a previous pattern has changed direction

---

## Step 5: Generate Report

Write a report in this format:

```
SIGNAL SCAN -- [DATE]
Scan ID: [scan_id]
Data: [X] sales calls | [X] revenue records | [X] deliverables | [X] content items
Previous patterns: [X] | New: [X] | Confirmed: [X] | Invalidated: [X]

== HIGH CONFIDENCE PATTERNS (>0.7) ==

[PATTERN TITLE]
Type: [correlation/trend/anomaly]
Domains: [sales + revenue]
Confidence: [X] (confirmed [N] times)
Evidence: [specific data points]
Action: [what to do about it]

== NEW PATTERNS (first detection) ==

[PATTERN TITLE]
...

== TRENDING SHIFTS ==

[what changed since last scan]

== SIGNAL GAPS ==

[what data we need but don't have]

== RECOMMENDED ACTIONS (ranked by impact) ==

1. [highest impact action] -- based on [pattern]
2. [second action] -- based on [pattern]
3. [third action] -- based on [pattern]
```

Save the report:

```bash
python3 ~/tools/scripts/save-deliverable.py \
  --title "Signal Scan: [DATE]" \
  --type document \
  --agent scan \
  --file /tmp/signal-scan-report.md \
  --tags '["signal-scan", "patterns", "intelligence"]' \
  --status completed
```

---

## Step 6: Notify Chris

Send ONLY the actionable findings. Not the full report.

```bash
bash ~/Desktop/rawclaw-main/scripts/notify.sh "SIGNAL SCAN COMPLETE

[X] new patterns | [X] confirmed | [X] invalidated

Top findings:
1. [Most important pattern - 1 sentence]
2. [Second pattern - 1 sentence]
3. [Third pattern - 1 sentence]

[X] recommended actions queued.
Full report saved to dashboard."
```

---

## Error Handling

| Problem | Solution |
|---------|----------|
| sales_calls empty | Skip close analysis, note gap |
| revenue empty | Skip revenue patterns, note gap |
| content_pipeline empty | Skip content attribution, note gap |
| No previous patterns | First scan -- everything is "new" |
| Supabase connection fails | Source ~/.zshrc and retry once |

## Cleanup

```bash
rm -f /tmp/signal-scan-*.json /tmp/signal-scan-report.md
```

---

## Cron Schedule

This skill runs every 2 weeks via RawClaw scheduler:
```bash
cd ~/Desktop/rawclaw-main && node dist/schedule-cli.js create "Load the signal-scan skill and run a full cross-domain pattern scan. Pull all data from sales_calls, revenue, deliverables, and content_pipeline. Compare against stored patterns. Store new findings. Report actionable insights." "0 9 1,15 * *"
```

1st and 15th of every month at 9am PT.
