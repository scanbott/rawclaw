---
name: research
description: Load research methodology, competitor analysis frameworks, and the client research template. Use for any research or analysis task.
user-invocable: true
---

# Research -- Rawgrowth

## Step 0: Query the Knowledge Graph First
Before starting any web search or external research, query the shared knowledge graph:
```
query("what do we already know about [topic]?", mode="hybrid")
```
Use the `raganything` MCP tool. If the answer exists in the graph, skip the external search or use it to sharpen the query. Avoids redundant work and surfaces cross-agent connections.

## Step N (Final): Ingest Findings into Knowledge Graph
After completing research, always ingest the summary:
```
ingest_text("[full research summary]", metadata={"agent": "ovi", "date": "YYYY-MM-DD", "topic": "...", "task_type": "research"})
```
Every research output becomes queryable by all agents going forward.

## Workspace
Read `marketing/research/CONTEXT.md` for the workspace map and load order.

## Client Research Template
Covers:
- Instagram analysis (30 posts)
- YouTube analysis (20 videos)
- Twitter analysis (50 tweets)
- Website/funnel analysis
- Competitor analysis (5 competitors)
- Brand voice synthesis
- Content theme analysis
- Recommendations

## Competitor Scraping
- Python tools: `scripts/content-db/populate_transcripts.py`, `scripts/content-db/analyze_competitors.py`
- yt-dlp for Instagram/YouTube reel metadata

## Research Output Standards
1. Lead with conclusion, then evidence
2. Sources cited for every claim
3. Confidence level flagged: high/medium/low
4. Tables for comparisons, chronological lists for timelines
5. Actionable recommendations -- not just data dumps

## ICP Reference
Read `marketing/brand/identity/02-icp.md` to ensure research targets the right audience.
