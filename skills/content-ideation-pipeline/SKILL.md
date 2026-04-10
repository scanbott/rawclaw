---
name: content-ideation-pipeline
description: Data-driven content ideation pipeline. Analyzes past content performance, recent sales call questions, and competitor outliers to generate ranked content ideas backtested against what actually works. Pulls from Supabase (content metrics, sales calls), YouTube (competitor data via yt-search), and Obsidian (content pillars, frameworks). Loads everything into NotebookLM for grounded analysis. Triggers on "what should I make next", "content ideas", "content ideation", "plan content", or weekly content planning.
user-invocable: true
---

# Content Ideation Pipeline

**Flow:** Performance Data -> Sales Call Signals -> Competitor Outliers -> NotebookLM Analysis -> Ranked Ideas

No pauses. Run end to end.

---

## Step 1: Gather Performance Data

### 1a. Past Content Performance

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

# Content pipeline (all platforms)
content = supabase_select('content_pipeline', '?select=*&order=created_at.desc', limit=50)
print('PIPELINE:', json.dumps(content, indent=2, default=str))

# Instagram content with metrics
ig = supabase_select('instagram_content', '?select=*&order=created_at.desc', limit=30)
print('INSTAGRAM:', json.dumps(ig, indent=2, default=str))

# YouTube content (if any)
yt = supabase_select('youtube_content', '?select=*&order=created_at.desc', limit=20)
print('YOUTUBE:', json.dumps(yt, indent=2, default=str))

# Deliverables (scripts, content pieces)
deliverables = supabase_select('deliverables', '?select=title,type,tags,status,created_at&type=eq.document&order=created_at.desc', limit=30)
print('DELIVERABLES:', json.dumps(deliverables, indent=2, default=str))
" > /tmp/ideation-content.json
```

### 1b. Sales Call Signals (what prospects are asking)

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

calls = supabase_select('sales_calls', '?select=prospect_name,pain_points,objections,summary,outcome,meeting_date&order=meeting_date.desc', limit=18)
print(json.dumps(calls, indent=2, default=str))
" > /tmp/ideation-calls.json
```

### 1c. Competitor Outliers

Run yt-search for the core topic areas:

```bash
python3 ~/tools/scripts/yt-search.py "AI automation business" -n 15 -m 3 -s vsr --json > /tmp/ideation-competitors.json
```

Optionally run additional searches for specific content pillars:
```bash
python3 ~/tools/scripts/yt-search.py "AI agents for business" -n 10 -m 2 -s vsr --json >> /tmp/ideation-competitors-2.json
```

### 1d. Content Pillars & Frameworks from Vault

```bash
python3 ~/tools/scripts/vault-search.py --query "content pillars strategy"
python3 ~/tools/scripts/vault-search.py --query "idea synthesis"
```

Read the content pillar breakdown:
- 60% dashboard breakdowns / system explanations
- 20% installation walkthroughs
- 15% AI hot takes
- 5% build-in-public

Also read: `marketing/content/frameworks/idea-synthesis.md`

## Step 2: NotebookLM Analysis

### 2a. Prepare Sources

Export data to Google Docs for NotebookLM:

1. **Content Performance Doc** — past content titles, metrics, what performed, what didn't
2. **Sales Signal Doc** — pain points, objections, questions from recent calls
3. **Competitor Doc** — top outlier videos, their titles, view counts, VSR

```bash
mcp__google-workspace__create_doc -> title: "Content Ideation: Performance + Signals"
```

### 2b. Create Notebook & Add Sources

Playwright MCP flow: create notebook -> add Google Docs as sources.

### 2c. Query for Insights

**Q1 — What works:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Looking at our past content, what topics, formats, and angles performed best? What patterns appear in our top-performing content?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q2 — Sales-to-content gaps:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What questions and pain points come up in sales calls that we haven't addressed in our content yet? What would a video answering these questions look like?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q3 — Competitor opportunities:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "Looking at competitor content that's performing well, what topics or angles are getting traction that we haven't covered? Where is there a gap we could fill?" \
  --notebook-url "<NOTEBOOK_URL>"
```

## Step 3: Generate Ranked Ideas

Combine all intelligence into ranked content ideas. Each idea must be backtested against:
- Did similar content perform well for us before?
- Does it address a real pain point from sales calls?
- Is there competitor proof that this topic has demand?
- Does it fit our content pillars?

### Output Format

```
## Content Ideas — [DATE]
**Data Sources:** [X] past content pieces | [X] sales calls | [X] competitor videos

### Tier 1: High Confidence (backtested + demand proven)
Each idea includes:
- **Title concept**
- **Platform:** YouTube / Instagram / Both
- **Pillar:** dashboard breakdown / installation walkthrough / hot take / build-in-public
- **Why now:** [what signal triggered this idea]
- **Backtest:** [similar content that worked + sales call data supporting demand]
- **Competitor proof:** [outlier video if one exists]
- **Predicted performance:** High / Medium / Low (with reasoning)
- **Sales funnel stage:** Awareness / Consideration / Decision

### Tier 2: Medium Confidence (some signal, needs validation)
[Same format, less data backing]

### Tier 3: Experimental (gaps identified, no direct proof yet)
[Same format, based on gap analysis]

### Recommended Next 5
1. [Highest priority idea with 1-sentence reasoning]
2. ...
3. ...
4. ...
5. ...
```

## Step 4: Feed Back

Log ideas to content pipeline:

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import add_content_pipeline
# Log each Tier 1 idea
add_content_pipeline(
    title='<IDEA_TITLE>',
    hook='<HOOK>',
    platform='<PLATFORM>',
    status='idea',
    pillar='<PILLAR>',
    source='content-ideation-pipeline'
)
print('Ideas logged to pipeline')
"
```

## Error Handling

| Problem | Solution |
|---------|----------|
| No content metrics in Supabase | Use deliverables table for past content titles |
| No sales calls | Skip sales signal analysis, use competitor data + vault |
| yt-search fails | Skip competitor analysis, use internal data only |
| NotebookLM fails | Analyze data directly in context |
| youtube_content table empty | Pull from content_pipeline + deliverables instead |

## Cleanup

```bash
rm -f /tmp/ideation-*.json
```
