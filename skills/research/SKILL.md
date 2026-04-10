---
name: research
description: Deep research methodology. Web research, competitor analysis, market intelligence. Structures findings into actionable insights.
triggers: ["research", "investigate", "find out", "analyze", "competitive analysis", "market research"]
---

# Research Skill

## When to Use This

Use for any research task where you need structured, sourced findings -- not a quick lookup.

## Research Protocol

### Step 1: Define the Question
Before searching anything, write one sentence: "This research will inform [specific decision]."
If you can't write that sentence, the request isn't specific enough. Clarify first.

### Step 2: Source Priority
1. Primary sources: company website, founder interviews, SEC filings, official docs
2. Secondary sources: reputable press, industry reports, G2/Capterra reviews
3. Tertiary sources: Reddit, forums, X/Twitter conversations, YouTube comments
4. Never cite secondary sources as if they're primary

### Step 3: Structured Search
For competitor research, always check:
- Their website (homepage, pricing page, about page, blog)
- Meta Ad Library (facebook.com/ads/library) -- are they running ads?
- YouTube -- are they creating content? What's performing?
- G2/Capterra -- what are customers saying?
- LinkedIn -- how big is the team? What are they hiring for?
- Indeed reviews -- what do employees say?

### Step 4: Synthesize (Not Summarize)
Don't list facts. Find patterns. Answer:
- What's working for them and why?
- What gap exists that they're not filling?
- What are their customers frustrated about?
- What can we learn and apply?

### Step 5: Output
Save to `workspace/artifacts/research/[topic]-[YYYY-MM-DD].md`

If competitor: also save to `knowledge/competitors/[name].md`

## Output Template

```markdown
# [Research Topic]
Date: YYYY-MM-DD
Question: [The specific decision this informs]

## Key Findings
[3-5 bullet points -- the most important things]

## Detail
[Organized sections with sources]

## Implications
[What this means for us / what to do with it]

## Sources
[Linked list]
```

## Confidence Levels
- **High:** Primary source, verified
- **Medium:** Secondary source, plausible
- **Low:** Inferred or single unverified source -- flag clearly
