---
name: story-sequence
description: Create Instagram story sequences or LinkedIn carousels end-to-end. Asks 3 questions, researches what visual formats are actually working for competitors, writes copy in Chris's voice, then generates each slide as a full image using Google Gemini Imagen API. Triggers on "/story-sequence", "create story sequence", "instagram stories about [X]", "story sequence for [X]", "linkedin carousel", or any request to make IG stories or LinkedIn image posts.
user-invocable: true
---

# Social Story / Carousel Pipeline

**Flow:** Ask 3 Questions -> Research What's Working -> Write Copy -> Generate Images with Gemini Imagen -> Save

---

## Step 1: Ask 3 Questions (ALWAYS — no skipping)

Even if the user included a topic in their message, still confirm all 3 parameters.

Ask in a single message:

**1. What's the topic?**
(The angle, the moment, the insight.)

**2. How many slides?**
- 3-5 (quick hit)
- 5-7 (standard)
- 7-10 (deep sequence)
- Custom

**3. What format?**

> **1. Authority/Credibility** — Lead with a stat or result. Build trust fast.
> Example opener: "I've personally helped generate and save over $520,000 for agencies."
>
> **2. Pain Point Agitation** — Make them feel the problem. Create urgency.
> Example opener: "Revenue is decent. But you wake up thinking: how do I scale this?"
>
> **3. Story Arc** — Personal narrative. Show transformation.
> Example opener: "3 years ago I was painting curbs for $50 a pop."
>
> **4. Education/Value** — Teach the playbook. Give real frameworks away.
> Example opener: "Most people think AI replaces your team. They're wrong."
>
> **5. CTA Funnel** — Drive a specific action. Built to convert.
> Example opener: "You're spending 20 hours a week on content that gets 200 views."
> *(If CTA Funnel: also ask for keyword and link.)*

Also note: **what platform?** (Instagram Stories, LinkedIn Carousel, or both)

Wait for Chris to respond before doing anything else.

---

## Step 2: Research What's Actually Working

Before writing or designing anything, look at what's performing for competitors. This step determines the VISUAL FORMAT for image generation.

### 2a. Web Search for Top Performers
Search for top-performing content in the AI consulting / agency space on the relevant platform:

For **Instagram**:
- Search: `"AI agency" OR "AI consulting" instagram story viral 2024 2025`
- Search: `site:instagram.com AI department consulting results`
- Look for: tweet screenshot carousels, good vs bad comparisons, before/after splits, "$Xk/mo vs $Xk/mo" contrast posts, "what they think vs what it actually is" formats

For **LinkedIn**:
- Search: `AI agency consulting LinkedIn carousel high engagement 2025`
- Look for: text-heavy dark slides, bold stat openers, numbered frameworks, side-by-side comparisons, "stop doing X / start doing Y" formats

### 2b. Extract the Visual Pattern
From the research, identify which visual format fits the copy. Common high-performing patterns:

**Tweet Screenshot Style** — Fake or real tweet overlaid on dark background. Works for opinion hooks, hot takes, contrarian statements.

**Comparison Split** — Left vs right or top vs bottom. "$3M business owner vs $15M business owner." "AI agency vs traditional agency." Strong contrast colors.

**Stat/Number Hero** — One big number centered on the slide. "$520K saved." "72 hours." "14 clients." Minimal everything else.

**Text Stack** — Clean dark slide, white headline, green accent words. Pure typography. No photos. Works for frameworks and step-by-step.

**Good vs Bad** — Side-by-side panel showing the wrong way and the right way. Red/green color coding or dark/light.

**Quote Card** — Real client quote or Chris's own quote, styled like a pull quote. Attribution below.

**Before/After** — Two states separated by an arrow or divider. Works for transformation stories.

Pick the pattern that matches the content angle. State your choice before writing copy.

### 2c. Load Knowledge Vault References
- Read `marketing/brand/voice/story-bank.md` — find stories that connect to the topic
- Read `marketing/content/frameworks/hook-frameworks.md` — pick 2-3 hooks for the opening slide
- Read `marketing/brand/VOICE.md` — voice rules, internalize before writing

---

## Step 3: Write Story Copy

Generate slide-by-slide copy based on chosen format and topic.

**Voice (NON-NEGOTIABLE):**
- Contractions always
- No em dashes. Ever. Periods or "..." instead.
- 1-3 sentences max per slide
- Engineering verbs: install, deploy, build, plug in, productize
- Never: game-changer, unlock, leverage, utilize, deep dive, revolutionary, certainly
- Peer-to-peer. No vendor energy. Proof over promise. Real numbers.

**Structures by format:**

### Authority/Credibility
1. Bold stat or result (hook)
2. Context: who, what, when
3. Proof point 1
4. Proof point 2
5. What this means for them
6. (Optional CTA)

### Pain Point Agitation
1. Pattern interrupt ("You've been told..." / "Everyone says...")
2. Stack the real pains
3. "You've tried X..."
4. "But nothing changed because..."
5. The real problem (reframe)
6. The answer (tease, don't sell)
7. (Optional CTA)

### Story Arc
1. Set the scene
2. The problem
3. The turning point
4. What happened next
5. The lesson
6. How it applies to them
7. (Optional CTA)

### Education/Value
1. "Most people think X. They're wrong."
2. The real framework
3. Element 1
4. Element 2
5. Element 3
6. "Now you know more than 95% of people"
7. (Optional CTA)

### CTA Funnel
1. Problem hook
2. Agitate (consequences of inaction)
3. Solution tease
4. Proof (result or client win)
5. The offer
6. CTA: "DM me '{KEYWORD}' and I'll send you [thing]"
7. Urgency/scarcity (optional)

---

## Step 4: Quality Gate

### 4a. Banned Construction Scan (run FIRST, before scoring)

Search every slide for these patterns. If found, rewrite the sentence from scratch — do not patch it:

- "X isn't X, it's Y" — e.g. "AI isn't software, it's a department"
- "It's not [thing], it's [better thing]"
- "Not A, not B, not C — it's [thing]"
- "You're not X, Y, Z. You are A, B, C" (parallel negation list)
- "Stop doing X. Start doing Y."
- "Less X. More Y."

These are zero-tolerance AI slop tells. Rewrite from scratch every time.

### 4b. Score

- Voice Match (1-5)
- Specificity (1-5)
- Originality (1-5)
- Concision (1-5)

Minimum 3/5 on all. Rewrite failures. Don't show scores unless asked.

---

## Step 5: Generate Slide Images with Gemini Imagen

Use Google Gemini Imagen API. Each slide = one complete image, text baked in.

### 5a. Load API Key
```bash
source /Users/scanbot/BusinessOS/.env
# GOOGLE_API_KEY
```

### 5b. Build Image Prompts

For each slide, construct a prompt that combines:
1. **The visual pattern** chosen in Step 2 (tweet style, comparison split, stat hero, etc.)
2. **The slide copy** (exact words to appear on the image)
3. **The aesthetic** — dark, high contrast, minimal, modern. Not generic. Not stock photo.

**Base aesthetic for all slides:**
```
Dark social media slide. Near-black background (#060B08). High contrast.
Clean modern sans-serif typography. No stock photos. No gradients. No corporate vibes.
White body text. Bright green (#0CBF6A) for accent words, numbers, and headlines.
Minimal. Tech-operator feel. Looks expensive.
```

**Pattern-specific additions:**

*Tweet Screenshot:*
```
Styled like a Twitter/X post screenshot. Dark mode tweet card centered on slide.
Profile photo placeholder. Bold tweet text. Like/repost counts visible at bottom.
```

*Comparison Split:*
```
Vertical split layout. Left side labeled "[BAD/LOW/OLD]" in muted red. 
Right side labeled "[GOOD/HIGH/NEW]" in bright green. Bold contrast text on each side.
```

*Stat Hero:*
```
One massive number centered. Clean. Nothing else competes with it.
Small label line below in white. Rest of slide is dark negative space.
```

*Text Stack:*
```
Pure typography layout. Headline in large bold green. Body in white below.
No images, no icons. Just words. Like a slide deck slide, not a social post.
```

*Good vs Bad:*
```
Two panels. Top half labeled "WRONG" with red accent, bottom "RIGHT" with green accent.
Or left/right split. Clear visual divider between them.
```

**Slide indicator:** bottom right corner, small white text: `[N] / [TOTAL]`

**Aspect ratio:** `9:16` for Instagram Stories, `1:1` or `4:5` for LinkedIn

### 5c. API Call
```python
import google.generativeai as genai
import os

genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.ImageGenerationModel("imagen-3.0-generate-002")

response = model.generate_images(
    prompt=PROMPT,
    number_of_images=1,
    aspect_ratio="9:16",
    safety_filter_level="block_only_high"
)

image_data = response.images[0]._image_bytes
with open(f"slide_{n}.png", "wb") as f:
    f.write(image_data)
```

Save each to:
```
/Users/scanbot/BusinessOS/workspace/content/stories/{topic-slug}-{date}/slide-{n}.png
```

### 5d. Send to Chris
After all slides generated, send in order with copy as caption:
```
[SEND_PHOTO:/Users/scanbot/BusinessOS/workspace/content/stories/{topic-slug}-{date}/slide-{n}.png|Slide N: [copy]]
```

---

## Step 6: Save Copy to File

Write to `workspace/content/stories/{topic-slug}-{YYYY-MM-DD}.md`:

```yaml
---
title: "Story Sequence: {TOPIC}"
type: story-sequence
platform: {instagram|linkedin}
format: {FORMAT_TYPE}
visual_pattern: {PATTERN_USED}
slides: {NUMBER}
cta: {true/false}
keyword: {KEYWORD or null}
images: workspace/content/stories/{topic-slug}-{date}/
date: {YYYY-MM-DD}
---
```

Full slide copy below frontmatter.

**Do NOT save to Supabase.**

---

## Error Handling

| Problem | Solution |
|---------|----------|
| Imagen API unavailable | Deliver copy + visual prompt specs as text. Flag for manual design. |
| Image generation fails on a slide | Retry once with simplified prompt. If still fails, deliver copy-only for that slide. |
| Web search returns no useful results | Use knowledge vault examples + pattern library above. |
| Brand voice file missing | Use vault-search.py --tag "brand" as fallback. |
