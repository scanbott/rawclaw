---
name: yt-search
description: Search YouTube and return structured video results with engagement metrics. Use for content research, competitor analysis, or topic validation.
user-invocable: true
---

# YouTube Search Tool

Search YouTube via yt-dlp and get structured results with metadata and engagement scoring.

## Command

```bash
python3 ~/tools/scripts/yt-search.py "search query" [options]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--results`, `-n` | 20 | Number of results to return |
| `--months`, `-m` | 6 | Filter to videos from last N months |
| `--sort`, `-s` | relevance | Sort by: `relevance`, `views`, `vsr`, `date` |
| `--json` | off | Output as JSON for programmatic use |

## Examples

```bash
# Basic search (20 results, last 6 months)
python3 ~/tools/scripts/yt-search.py "AI automation agency"

# Top 10 by views, last 3 months
python3 ~/tools/scripts/yt-search.py "AI COO" -n 10 -s views -m 3

# Sort by engagement ratio (views/subscribers)
python3 ~/tools/scripts/yt-search.py "claude code tutorial" -s vsr

# JSON output for piping to other tools
python3 ~/tools/scripts/yt-search.py "AI business tools" --json
```

## Output Fields

Each result includes:
- **Title** and **URL**
- **Channel name** and **subscriber count**
- **View count** and **duration**
- **Upload date** (with days ago)
- **VSR (Views/Subs Ratio)** — engagement metric
  - 1.0x+ = outlier (flagged `<< OUTLIER`)
  - 0.5x+ = strong performer (flagged `<< strong`)

## When To Use

- **Content research:** Find what's working in a topic before scripting
- **Competitor analysis:** See what competitors are posting, view counts, engagement
- **Topic validation:** Check if a topic has audience demand
- **Outlier detection:** Sort by VSR to find videos that punched above their weight
- **Trend scanning:** Use `--months 1 --sort date` to see what just dropped
