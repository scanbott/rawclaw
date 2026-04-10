---
name: signal-scan
description: Cross-domain pattern recognition. Scans sales data, content performance, market signals, and competitor moves to surface non-obvious opportunities.
triggers: ["signal scan", "what's working", "find patterns", "what should we be doing", "market signals"]
---

# Signal Scan

Most people look at one data source. This skill looks at all of them simultaneously and finds patterns across domains.

## What It Scans

- **Sales signals:** Which offer language is converting? Which objections are increasing? Where are deals dying?
- **Content signals:** Which hooks are working? Which topics are getting engagement? What's competitors' top-performing content?
- **Market signals:** What are buyers complaining about in forums? What are people asking for that doesn't exist?
- **Competitor signals:** Who's scaling ad spend? Who's going quiet? Who's changing their positioning?

## Process

### Step 1: Data Gather
Collect from all available sources:
```bash
# Recent content performance (if tracked)
cat [RAWCLAW]/workspace/artifacts/research/content-performance-*.md

# Competitor snapshots
ls [RAWCLAW]/knowledge/competitors/

# Any recent research
ls [RAWCLAW]/workspace/artifacts/research/
```

Also: check social for last 30 days of comments, DMs, objections if accessible.

### Step 2: Pattern Recognition
For each domain, answer:
- What's working that we're not doubling down on?
- What's stopped working that we're still doing?
- What gap exists that no one is filling?
- What are the top 3 people in our space doing differently than us?

### Step 3: Confidence Scoring
Rate each signal:
- **High confidence:** Multiple data points from primary sources
- **Medium confidence:** 1-2 data points or secondary sources
- **Low confidence:** One signal, could be noise

### Step 4: Output
Produce a ranked list of opportunities:

```markdown
# Signal Scan -- [Date]

## High-Confidence Signals
1. [Signal] -- [What to do about it] -- [Confidence: High]

## Medium-Confidence Signals
1. [Signal] -- [What to explore] -- [Confidence: Medium]

## Watch List (Low Confidence)
1. [Signal] -- [Why it might matter] -- [Confidence: Low]

## Recommended Actions
1. [Specific action with owner/timeline]
```

Save to `workspace/artifacts/research/signal-scan-[YYYY-MM].md`
