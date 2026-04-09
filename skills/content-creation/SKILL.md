---
name: content-creation
description: Load content creation frameworks, hook libraries, YouTube scripting system, and platform strategies. Use before creating any content.
user-invocable: true
---

# Content Creation -- Rawgrowth

## MANDATORY: Load Brand Foundation First
1. **Brand Foundation v2:** Read marketing/brand/identity/12-brand-positioning.md -- Positioning, voice, what we do. This is the source of truth.
2. **Voice Profile:** Read marketing/brand/voice/chris-voice-profile.md
3. **Hook Frameworks:** Read marketing/content/frameworks/hook-frameworks.md -- 23+ hook patterns

## For YouTube (ALL 4 required before scripting)
4. **YouTube Strategy:** Read marketing/content/platforms/youtube.md
5. **YT GPT System:** Read marketing/content/frameworks/yt-gpt-system.md (if exists) -- Full scripting methodology
6. **YouTube Principles:** Read marketing/content/frameworks/youtube-principles.md (if exists)
7. **7-Point Pre-Production Checklist (NON-NEGOTIABLE):** Read marketing/content/frameworks/youtube-checklist.md -- Run every check before scripting. Source: https://docs.google.com/document/d/1wUSJpv8tgAphvFbplionshNlnJF2fBj6POQDo4CgNnQ/edit

## For Instagram/Reels
8. **Instagram Strategy:** Read marketing/brand/frameworks/07-instagram.md
9. **IG Strategy KB:** Read marketing/content/platforms/instagram/instagram-strategy-kb.md
10. **Instagram Hook Patterns:** Read marketing/content/frameworks/instagram-hook-patterns.md (skip if not yet created)

## For Ideas/Research
11. **Idea Synthesis:** Read marketing/content/frameworks/idea-synthesis.md
12. **Competitor Analysis:** Read marketing/research/competitor/competitor-analysis.md

## Pull Competitor Examples From Database (Required Before Every Script)

Before writing any YouTube script or Instagram caption, pull high-performing examples from Supabase:

\`\`\`bash
source /Users/scanbot/BusinessOS/.env 2>/dev/null
# Pull top YouTube examples
curl -s "${SUPABASE_URL}/rest/v1/youtube_content?performance_tier=eq.high&select=title,creator,views,summary,why_good,framework,key_points&limit=10&order=views.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"

# Pull top Instagram examples
curl -s "${SUPABASE_URL}/rest/v1/instagram_content?performance_tier=eq.high&select=title,creator,views,hook,why_it_works,framework&limit=10&order=views.desc" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"
\`\`\`

Study why_good, framework, and key_points. Pattern-match from real data, not theory.

## Positioning for Content (Non-Negotiable)
- We help 7-9 figure agencies and consultants productize their fulfillment with AI
- The AI department is the mechanism, not the headline
- Lead with proof. The dashboard IS the demo.
- Never use "AI department" as a standalone hook. Frame around the problem we solve: productizing fulfillment, scaling with data, building systems not adding headcount.
- Never reference "failed six times" or origin failure stories. Irrelevant.

## Content Pillars
| Pillar | YouTube | Instagram |
|--------|---------|-----------|
| Dashboard Breakdowns / System | 60% | 50% |
| Installation Walkthroughs / Results | 20% | 20% |
| AI Hot Takes / Authority | 15% | 20% |
| Build in Public | 5% | 10% |

## The #1 Content Format
Screen record the dashboard. Walk through the system. Show how data flows in, intelligence comes out. Comment-trigger CTA on every Instagram post. This is what went viral. This is what books calls.

## Proof Points (Use in Every Script)
Read marketing/brand/reference/ -- never fabricate. Real numbers only.

## Paid Content Ad Strategies (Jeremy Haynes Frameworks)
Full reference: marketing/research/stolen/ (browse for frameworks)

### Venus Fly Trap (Sequential 3-Video)
Use when audience needs education before buying.
1. Education video (cold) -> 2. Proof/case study (25%+ viewers of V1) -> 3. Trust/objections (25%+ of V2) -> Direct Response
Budget at $1K/day: V1 $400, V2 $275, V3 $175, DR $150. Launch all simultaneously.

### Forester (Volume Swarm)
Non-sequential. Mass content distribution to manufacture warm audiences.
- Cycle Bin 1: 10-50+ short content pieces, 3-second exclusions, cold audiences
- Cycle Bin 2: Testimonials/case studies targeting CB1 viewers. No CTAs.
- DR runs concurrently. Expected CPM reduction: 50%+.
- Content-to-audience ratio: 1 piece per 25,000 target audience.

### Hidden VSSL (Selling Without Selling)
Our dashboard walkthroughs ARE Hidden VSSLs. Content that delivers sales arguments inside education.
- Title, participants, format determine WHO watches -- not the content
- Long-form filters for quality. Short-form attracts volume.
- For affluent: high view counts = wrong demographic signal
- Chameleon Principle: match the character your target expects. Chris already IS the character.

### Content-Demographic Matching
- Words like "skeptics," "haters," "exposed" attract angry, lower-income viewers
- Professional framing pulls higher demographics
- YouTube Shorts with debate content = exclusively wrong audience
- Same content performs fundamentally differently by format

### AI-First Visibility
- Two-thirds of Google searches end without a click
- Daily 30-60 min habit: trends (10 min), create native content (15 min), engage (10 min), adapt (10 min), check AI mentions (5 min)
- Content ranked by AI visibility: video with transcript > structured guides > original research > case studies > long-form blog
- Schema markup (FAQ, HowTo, Organization) is mandatory for AI parsing

### Proof Flywheel
Better offers -> bigger wins -> stronger proof -> better-fit customers -> even bigger wins
- Quantified results strongest ("340% revenue increase in 90 days")
- Screenshot proof from real platforms beats designed graphics
- Proof belongs everywhere, not just testimonials page
- Specific data ("2,117 clients, 0.57% refund rate") > generic ("thousands of happy clients")

## Stolen Content Hooks (Hormozi "How to Win With AI in 2026")

High-performing angles to riff on for Chris's content:

**Phase shift hook**: "Everyone's been training their whole career to swim. The change coming isn't bigger waves. The water evaporates. Doesn't matter how good of a swimmer you are -- the physics change." Use as a reel opener or LinkedIn hook.

**BYOS framing**: "The next hire at every serious company won't come with a resume. They'll come with their own agent stack. That's BYOS -- Bring Your Own Software. We install that infrastructure at the operator level."

**20-hour rule**: "It takes 20 hours to get proficient at any new skill. Most people delay the first hour by decades." Good pattern interrupt for fence-sitters. Ties into: book a call = start the 20 hours.

**Workflow vs. headcount**: "Stop thinking in roles. Start thinking in workflows. Every hire is really just 6 tasks someone does with their hands. Figure out which of those 6 tasks live in a system instead of a salary."

**Granular decomposition demo**: Show on screen -- take "I run ads" and break it into 8 sub-tasks. Then show which ones are already automated in the dashboard. This is a Hidden VSSL in one clip.

**Revenue per employee stat**: "AI-first companies from day one are doing millions in revenue per employee. Not because they fired everyone. Because they never built the bloat."
