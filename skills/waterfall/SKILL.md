---
name: waterfall
description: Generate a full content waterfall from one source -- YouTube video, article, or concept. One input becomes posts, reels, threads, and emails.
triggers: ["waterfall", "repurpose", "content from this", "turn this into content", "multi-platform content"]
---

# Waterfall Skill

One piece of long-form content becomes a week of short-form across every platform.

## Input Options

- YouTube video URL (with transcript)
- Article or blog post URL
- Podcast episode
- Raw concept or idea (describe in 2-3 sentences)
- Call transcript or recording

## Waterfall Output (Standard)

From one input, produce:

1. **3 short-form video scripts** (30-60s each)
   - Different angles: educational, personal story, hot take
   - Each with hook, content, CTA

2. **1 LinkedIn post** (150-300 words)
   - Text-first, storytelling format
   - Hook in first line (visible before "see more")

3. **1 X/Twitter thread** (5-8 tweets)
   - Lead tweet is the hook
   - Each tweet stands alone but threads together
   - Last tweet has the CTA

4. **3 Instagram captions** (for the 3 video scripts)
   - Short, punchy, matches video energy
   - 3-5 hashtags max

5. **1 email** (200-400 words)
   - Longer form, more personal
   - Teaches something, links to longer content if available

## Process

1. Load brand voice: `cat [RAWCLAW]/knowledge/client/brand-voice.md`
2. If URL: read/transcribe the source content
3. Extract the core insight / hook / angle
4. Generate each asset using the right framework for each platform
5. Quality check: does each piece stand alone? Does each have one clear point?
6. Save to `workspace/artifacts/copy/[topic]-waterfall-[date].md`

## One Rule

Every piece should work independently. If someone only sees the reel and never sees the YouTube video, they should still get full value.
