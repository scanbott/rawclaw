---
name: yt-pipeline
description: End-to-end YouTube research pipeline. Given a topic, automatically searches YouTube (via yt-search), auto-selects the 5-8 best videos by relevance/engagement/recency/diversity, creates a NotebookLM notebook with those videos as sources (via notebooklm skill), queries for deep analysis — trends, outliers, gaps — and presents key takeaways. Optionally generates deliverables (podcast, slide deck, report, YouTube script). Triggers on "yt pipeline [topic]", "YouTube pipeline [topic]", "research [topic] on YouTube", or "YouTube deep dive on [topic]".
user-invocable: true
---

# YouTube Research Pipeline

**Flow:** Topic -> YouTube Search -> Video Selection -> NotebookLM -> Deep Analysis -> Takeaways -> Deliverables (optional)

No pauses between steps. Give it a topic, it runs end to end.

Parse the user's message for:
- **Topic** (required)
- **Deliverable** (optional) — podcast, slide deck, report, YouTube script, excalidraw

---

## Step 1: YouTube Search

Run 3 search angles for maximum coverage:

```bash
# Primary — broad topic
python3 ~/tools/scripts/yt-search.py "<TOPIC>" -n 20 -m 6 --json > /tmp/yt-pipeline-primary.json

# Angle 2 — outlier hunt (sort by engagement ratio)
python3 ~/tools/scripts/yt-search.py "<TOPIC>" -n 15 -m 6 -s vsr --json > /tmp/yt-pipeline-outliers.json

# Angle 3 — recent drops
python3 ~/tools/scripts/yt-search.py "<TOPIC>" -n 10 -m 2 -s date --json > /tmp/yt-pipeline-recent.json
```

Merge and deduplicate:

```bash
python3 -c "
import json, sys
seen, merged = set(), []
for f in sys.argv[1:]:
    for v in json.load(open(f)):
        if v['url'] not in seen:
            seen.add(v['url'])
            merged.append(v)
json.dump(merged, open('/tmp/yt-pipeline-merged.json', 'w'), indent=2)
print(f'Merged: {len(merged)} unique videos')
" /tmp/yt-pipeline-primary.json /tmp/yt-pipeline-outliers.json /tmp/yt-pipeline-recent.json
```

## Step 2: Auto-Select Top Videos

```bash
python3 ~/.claude/skills/yt-pipeline/scripts/select-videos.py \
  --file /tmp/yt-pipeline-merged.json \
  --count 7 > /tmp/yt-pipeline-selected.json
```

Scoring weights:
- **Relevance** (30%) — yt-dlp search rank position
- **Engagement** (30%) — VSR (views/subs ratio). 1.0x+ = outlier.
- **Recency** (20%) — newer content scored higher
- **Source diversity** (20%) — penalizes duplicate channels for varied perspectives

Read the output JSON. Extract URLs for NotebookLM.

## Step 3: NotebookLM — Load & Analyze

### 3a. Check Auth

```bash
python ~/.claude/skills/notebooklm/scripts/run.py auth_manager.py status
```

If not authenticated:
```bash
python ~/.claude/skills/notebooklm/scripts/run.py auth_manager.py setup
```

### 3b. Create Notebook via Playwright

Use Playwright MCP tools to create a notebook and add videos as sources.

1. **Navigate:**
   ```
   mcp__playwright__browser_navigate -> url: "https://notebooklm.google.com"
   mcp__playwright__browser_snapshot
   ```

2. **Create notebook:** Snapshot, find "New notebook" / "+" button, click it.

3. **Add sources** — for each selected video URL:
   - Snapshot -> Click "Add source" -> Snapshot -> Select "YouTube" or "Website" -> Paste URL via `browser_fill_form` -> Submit -> Wait 5s
   - If a URL is rejected, skip it and continue with the next

4. **Wait for processing:**
   ```
   mcp__playwright__browser_wait_for -> time: 15
   mcp__playwright__browser_snapshot  (verify sources loaded)
   ```

5. **Capture notebook URL** from address bar (snapshot or `browser_evaluate` with `window.location.href`).

**Resilience:** Always snapshot before each click for fresh refs. Never hardcode element references. If UI changes, adapt based on what the snapshot shows.

### 3c. Register Notebook

```bash
python ~/.claude/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "<NOTEBOOK_URL>" \
  --name "YT Pipeline: <TOPIC>" \
  --description "YouTube competitor/outlier analysis for <TOPIC>. <N> video transcripts." \
  --topics "<TOPIC>,youtube research,competitor analysis"
```

### 3d. Query for Intelligence

Run 3 analysis queries. Each opens a fresh browser session.

**Q1 — Content & arguments:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What are the main arguments, frameworks, and talking points across all these videos? What specific advice or systems do the creators recommend? Be comprehensive and cite which sources say what." \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q2 — Hooks & structure:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "How do these videos open? What hooks do they use? How are they structured? What retention techniques appear? Compare the approaches across sources." \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q3 — Gaps & opportunities:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What important subtopics, angles, or perspectives are missing from these videos? What would a viewer still want to know after watching all of them?" \
  --notebook-url "<NOTEBOOK_URL>"
```

Collect all 3 responses for synthesis.

## Step 4: Analysis & Takeaways

Combine video metadata (Step 2) with NotebookLM intelligence (Step 3) into a structured analysis.

### Trends
- Themes appearing across 3+ videos
- Dominant formats (tutorial, interview, listicle, case study)
- Audience level distribution (beginner, intermediate, advanced)
- Video lengths that perform best

### Outliers
- Videos with VSR >= 1.0x — what made them break out?
- Small channels outperforming large ones
- Unexpected angles or formats that overperformed

### Gaps
- Subtopics missing or underserved
- Audience segments being ignored
- Formats that haven't been tried
- Unanswered questions

### Key Takeaways
- Top 3-5 actionable insights
- Content opportunity score (1-10)
- Recommended angle for new content on this topic

## Step 5: Present Results

Output the full research report:

```
## YouTube Research: [TOPIC]
**Date:** [today]  |  **Videos Analyzed:** [count]  |  **Sources:** [channel count] channels
**NotebookLM:** [notebook URL]

### Selected Videos
| # | Title | Channel | Views | VSR | Score |
|---|-------|---------|-------|-----|-------|
[table rows with URLs below table]

### Trend Analysis
[From NotebookLM Q1 + metadata patterns]

### Outlier Analysis
[VSR breakouts + NotebookLM unique-takes data]

### Gap Analysis
[From NotebookLM Q3 + metadata gaps]

### Key Takeaways
1. [Insight]
2. [Insight]
3. [Insight]

### Content Opportunity
**Score:** X/10
**Best Angle:** [specific angle based on gaps + outlier patterns]
**Why:** [reasoning]
```

## Step 6: Deliverables (If Requested)

Only run if the user explicitly requests one.

### Podcast / Audio Overview
Use Playwright to trigger NotebookLM's Audio Overview:
1. Navigate to the notebook URL
2. Snapshot, find "Audio Overview" button, click it
3. Wait 1-2 min for generation
4. Share the notebook URL

### Report (Google Doc)
Use `mcp__google-workspace__create_doc` to create a formatted Google Doc with the full analysis from Step 5.

### Slide Deck
Create a Google Doc formatted as slides:
- Title slide: "[Topic] — YouTube Research Brief"
- One slide per section (trends, outliers, gaps)
- Takeaways slide

### YouTube Script
If asked for a script, load Chris's voice and scripting system before writing:
1. Read `marketing/content/frameworks/yt-gpt-system.md (if exists)` (scripting methodology)
2. Read `marketing/content/frameworks/youtube-principles.md (if exists)` (strategy + hooks)
3. Read `marketing/content/scripts/yt-script-full-v1.md` (past performer for voice calibration)
4. Write a full script using the gap analysis as Chris's unique angle
5. Follow the 65/35 rule (65% human/raw, 35% tactical)
6. See `references/script-writing.md` for full script format and rules

### Excalidraw Diagram
Create a `.excalidraw` JSON file visualizing the topic's framework/landscape:
```bash
cd ~/Desktop/rawclaw-main && uv run python .claude/skills/excalidraw-diagram/references/render_excalidraw.py \
  /tmp/yt-pipeline-diagram.excalidraw \
  --output ~/Desktop/yt-pipeline-<TOPIC>-diagram.png --scale 2
```

## Error Handling

| Problem | Solution |
|---------|----------|
| yt-search fails | `which yt-dlp` — install with `brew install yt-dlp` if missing |
| < 5 videos found | Widen to `--months 12`, broaden search terms |
| NotebookLM auth expired | `python ~/.claude/skills/notebooklm/scripts/run.py auth_manager.py reauth` |
| Source rejected by NotebookLM | Skip that URL, continue. Note in report. |
| NotebookLM fully fails | Proceed with metadata-only analysis. Still valuable without transcript data. |
| Excalidraw render fails | `cd ~/Desktop/rawclaw-main && uv sync && playwright install chromium` |

## Cleanup

```bash
rm -f /tmp/yt-pipeline-*.json
```
