---
name: competitor-intel
description: Scrape and analyze competitor ads, content, and positioning. Saves structured profiles to knowledge/competitors/.
triggers: ["competitor", "spy on", "what are they running", "competitor research", "what ads are they running", "analyze competitor"]
---

# Competitor Intel

Pull everything worth knowing about a competitor and save it as a permanent knowledge file agents can reference.

## What This Pulls

1. **Meta Ad Library** (public, no auth) -- active ads, creative angles, offers
2. **Website** -- positioning, ICP language, offer structure, pricing (if visible)
3. **YouTube** -- content strategy, top-performing videos, hooks they use
4. **Google** -- search presence, SEO keywords they target
5. **Reviews** (G2, Capterra, Trustpilot if applicable) -- what customers love/hate

## Process

### Step 1: Meta Ad Library
Go to: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=[COMPETITOR_NAME]&search_type=keyword_unordered`

Or use the Playwright browser tool to scrape it:
```
Navigate to https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=[COMPETITOR_NAME]&search_type=keyword_unordered
Take a snapshot of the results
```

For each ad found, capture:
- Ad creative angle (what problem does it lead with?)
- Offer/CTA (what are they asking people to do?)
- How long it's been running (longer = likely converting)
- Any specific numbers or claims

### Step 2: Website Analysis
Read their homepage, pricing page, and about page. Extract:
- Headline (their primary value prop)
- Subheadline (who it's for)
- ICP language (exact words they use to describe their customer)
- Offer structure (what they sell, how it's packaged)
- Proof (testimonials, case studies, logos)
- Pricing (if visible)
- What they DON'T mention (gaps we can own)

### Step 3: YouTube
Search: `[competitor name] site:youtube.com`
Or search YouTube directly.

For their top 5 videos:
- Title (what angle/hook works for them?)
- View count and upload date (recent AND high views = currently working)
- Thumbnail concept
- Script structure if accessible via transcript

### Step 4: Review Mining
Search: `[competitor name] reviews site:reddit.com` and `[competitor name] reviews site:g2.com`

Extract:
- Top complaints (pain points we can solve better)
- Top praise (what they do well -- don't compete here directly)
- Common objections (use in our sales copy)

### Step 5: Synthesize

Answer these questions:
1. What's their core positioning?
2. What ad angle is performing best for them right now?
3. What are their customers frustrated about?
4. What gap exists that they're not filling?
5. What can we learn and apply immediately?

## Output

Save to `knowledge/competitors/[competitor-name].md`:

```markdown
# Competitor: [Name]
Website: [URL]
Last updated: YYYY-MM-DD

## Positioning
[Their core claim in one sentence]
[Who they say they're for]

## Offer
[What they sell + pricing if visible]

## Ad Strategy
[Running ads? Yes/No]
[Top angles observed]
[Most interesting ad copy / hooks]

## Content Strategy
[Platforms they're active on]
[Content themes that perform]
[Top video hooks]

## Strengths
[What they do well]

## Weaknesses / Gaps
[Customer complaints]
[What they don't address]
[Opportunities for us]

## Key Quotes (from customers/ads)
[Verbatim language worth stealing or responding to]

## Sources
[Links to what was reviewed]
```

After saving, log to hive mind:
```bash
sqlite3 [RAWCLAW]/store/rawclaw.db "INSERT INTO hive_mind (agent_id, chat_id, action, summary, artifacts, created_at) VALUES ('research', '[CHAT_ID]', 'competitor_intel', 'Built competitor profile for [NAME]', '[RAWCLAW]/knowledge/competitors/[name].md', strftime('%s','now'));"
```
