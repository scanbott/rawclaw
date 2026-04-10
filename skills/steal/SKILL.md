---
name: steal
description: Extract everything useful from any resource -- GitHub repo, YouTube video, article, URL, or concept. Structures it into actionable knowledge.
triggers: ["steal this", "extract from", "analyze this URL", "break down this", "pull everything from"]
---

# Steal Skill

"Good artists copy, great artists steal." Use this to extract the framework from anything worth studying.

## What You Can Steal From

- YouTube videos (transcript → framework)
- GitHub repos (architecture → pattern)
- Articles / blog posts (argument → distilled principles)
- Competitor websites (positioning → gap analysis)
- Sales pages / landing pages (copy structure → swipe file)
- Courses / books (system → actionable summary)
- Podcast episodes (insights → key takeaways)

## Process

### For YouTube Videos
1. Get the transcript (use browser tools or yt-dlp)
2. Extract: what's the core argument? What's the framework? What are the 3-5 actionable steps?
3. Identify the hook structure -- how did they open?
4. Note: what made this perform well? (title, thumbnail concept, pacing)
5. Save to `workspace/artifacts/research/steal-[source]-[date].md`

### For Websites / Landing Pages
1. Screenshot or read the full page
2. Extract: headline, subheadline, problem statement, mechanism, proof, offer, CTA
3. Note: what's their positioning? Who's the ICP? What objections do they address?
4. Rate the copy 1-10 with notes
5. Save swipe file to `workspace/artifacts/copy/swipe/`

### For GitHub Repos
1. Read the README and main architecture files
2. Extract: what problem does it solve? What's the core pattern? What can we reuse?
3. Note any patterns worth adopting
4. Save to `workspace/artifacts/research/`

### For Competitor Positioning
1. Read homepage, pricing page, about page
2. Extract: claim, ICP, proof points, differentiators
3. Identify gaps -- what are they NOT saying?
4. Save to `knowledge/competitors/[name].md`

## Output Format

```markdown
# Steal: [Source Name]
URL: [link]
Date: YYYY-MM-DD
Type: youtube | website | repo | article

## What This Is
[One paragraph: what it is and why it's worth studying]

## Core Framework / Structure
[The repeatable pattern extracted]

## Key Takeaways
1.
2.
3.

## What to Apply
[Specific things we can use immediately]

## Raw Notes
[Anything else worth keeping]
```
