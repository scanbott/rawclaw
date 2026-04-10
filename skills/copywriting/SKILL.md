---
name: copywriting
description: "Standalone copywriting skill using Planner-Generator-Evaluator pattern. Loads brand voice, pulls copy examples from Supabase, writes copy in Chris's voice across all formats (email, DM, VSL, landing page, social, ad). Triggers on 'write copy', 'copywriting', 'draft a [email/DM/VSL/landing page/caption/ad]', or any direct copywriting request."
user-invocable: true
---

# Copywriting Skill -- Rawgrowth

Run the full Planner-Generator-Evaluator pipeline. No pauses. No shortcuts.

Parse the user's message for:
- **Copy type** (required) -- email, DM, VSL script, landing page, social caption, ad copy
- **Context** (required) -- what it's for, who it's targeting, what offer
- **Tone modifier** (optional) -- defaults to Chris's standard voice

---

## Step 0: Load Brand Voice (MANDATORY, NEVER SKIP)

Read ALL of these before writing a single word:

```bash
cat marketing/brand/identity/12-brand-positioning.md
cat marketing/brand/VOICE.md
cat ops/strategy/offer/undeniable-offer.md
cat marketing/brand/identity/02-icp.md
cat marketing/brand/identity/01-personal-profile.md
cat marketing/brand/voice/story-bank.md
cat marketing/brand/reference/
```

Also load the voice profile:
```bash
cat marketing/brand/voice/chris-voice-profile.md
```

And the copy analysis with universal laws:
```bash
cat marketing/brand/copy-examples/COPY-ANALYSIS.md 2>/dev/null || echo "No copy analysis file found, proceed with brand docs only"
```

Internalize ALL voice rules before proceeding. This is non-negotiable.

---

## Step 1: Pull Copy Examples from Supabase

Query the `copy_examples` table for relevant examples matching the requested copy type.

```bash
source /Users/scanbot/BusinessOS/.env 2>/dev/null
export $(grep -E '^(SUPABASE_URL|SUPABASE_SERVICE_KEY)=' /Users/scanbot/BusinessOS/.env | xargs)

# Pull examples matching the copy type
curl -s "${SUPABASE_URL}/rest/v1/copy_examples?select=*&type=eq.${COPY_TYPE}&order=score.desc&limit=10" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json"
```

Replace `${COPY_TYPE}` with the actual type: `email`, `dm`, `vsl`, `landing_page`, `social_caption`, `ad_copy`.

If no exact matches, broaden the query:
```bash
curl -s "${SUPABASE_URL}/rest/v1/copy_examples?select=*&order=score.desc&limit=15" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json"
```

Also pull from local copy examples if available:
```bash
ls marketing/brand/copy-examples/ 2>/dev/null && echo "Local examples found"
# Read 2-3 relevant examples from the matching subdirectory
```

---

## Step 2: PLANNER -- Expand the Brief

Take the user's request and expand it into a full creative brief. The Planner's job is to prevent scope underestimation.

**Planner output must include:**

1. **Objective:** What this copy needs to accomplish (book a call, reply to DM, watch the VSL, sign up, click)
2. **Audience:** Specific segment of ICP this targets. Pull from `marketing/brand/identity/02-icp.md`
3. **Core message:** One sentence. What's the single takeaway?
4. **Proof points:** Pull real numbers and results from `marketing/brand/reference/`. Never fabricate.
5. **Objections to preempt:** What will the reader push back on? Reference sales call data if available.
6. **Structure:** Outline the sections/flow for this copy type:
   - **Email:** Subject line, hook, body (3-5 paragraphs max), CTA
   - **DM:** Opening line, value statement, question/CTA (3-5 messages max)
   - **VSL script:** Hook (0-30s), problem (30s-2m), mechanism (2-5m), proof (5-7m), offer (7-9m), CTA (9-10m)
   - **Landing page:** Headline, subhead, problem section, mechanism, proof stack, offer breakdown, FAQ, CTA
   - **Social caption:** Hook line, body (2-4 sentences), CTA
   - **Ad copy:** Primary text, headline, description, CTA button text
7. **Length target:** Word count or time estimate appropriate for the format
8. **Reference examples:** Which pulled copy examples to model structure after (not words, patterns)

---

## Step 3: GENERATOR -- Write the Copy

Write the full copy following the Planner's brief. Apply every rule below without exception.

### Voice Rules (NON-NEGOTIABLE)

**ALWAYS:**
- Contractions everywhere (you're, don't, isn't, we'll, they're, it's)
- Start sentences with "And", "But", "So", "Because"
- Fragments for emphasis ("Crazy." "Period." "That's it." "Full stop.")
- Rhetorical questions mid-paragraph
- Casual transitions ("So here's the thing", "Let me be honest", "Look")
- Oxford commas (x, y, and z)
- Specific numbers over vague claims ($20K install, 7 days, 7-9 figure)
- Short paragraphs (1-3 sentences MAX)
- Second person throughout ("you", "your")
- Active voice only
- Peer-to-peer tone. Same energy with a $10M CEO as with a friend.
- Engineering/builder vocabulary: install, deploy, build, plug in, productize, stack, source of truth

**NEVER:**
- Em dashes. Ever. Use periods, commas, or "..." instead.
- "Game-changer," "unlock," "leverage," "utilize," "deep dive," "revolutionary," "cutting-edge," "synergy," "streamline," "empower"
- "Certainly!", "Great question!", "I'd be happy to", "As an AI"
- "It's not X, it's Y" / "This isn't X, it's Y" / "Not X. The actual Y." (any reframe/contrast formula)
- "Not A, not B, not C, it's [thing]" (parallel negation)
- "Stop doing X. Start doing Y." / "Forget X. Here's Y." (stop/start swaps)
- "The truth is..." / "Here's the thing..." (throat-clearing)
- "Most people [wrong]. Smart people [right]." (in-group/out-group)
- Any construction that defines something by what it's NOT before saying what it IS. Just state what it is.
- Formal transitions ("Furthermore", "Additionally", "In conclusion")
- Passive voice
- Weak qualifiers ("somewhat", "relatively", "fairly")
- Semicolons in copy
- Paragraphs longer than 3 sentences
- Hedging ("I think", "probably", "maybe")
- Origin story failure narrative ("failed six times")
- "AI department" as standalone headline. Always frame around productizing fulfillment.
- Any copy that could come from a generic AI agency account

**The Read-Aloud Test:** If it sounds like a robot, a textbook, or a LinkedIn post, rewrite it. It should sound like a smart friend explaining something over drinks.

### Format-Specific Rules

**Email:**
- Subject line under 50 characters. No clickbait. No ALL CAPS.
- First line is the hook. No "Hey [Name], hope you're doing well."
- One CTA per email. Make it obvious.
- P.S. line optional but effective for urgency or proof.

**DM:**
- 3-5 messages max. Each under 2 sentences.
- No pitch in the first message. Lead with observation or value.
- Last message has a soft CTA (question, not demand).

**VSL Script:**
- Write for spoken delivery. Include [PAUSE], [B-ROLL], [SCREEN SHARE] markers.
- Hook must earn the next 10 seconds. Problem section must make them nod.
- Proof section uses real numbers and real client references only.

**Landing Page:**
- Headline is the promise. Subhead is the mechanism.
- Every section earns its scroll. Cut anything that doesn't add signal.
- Social proof stacked, not scattered.
- FAQ handles the top 5 objections directly.

**Social Caption:**
- Hook line stops the scroll. First 7 words matter most.
- Body delivers one insight. Not three. One.
- CTA is natural, not desperate.

**Ad Copy:**
- Primary text: 3-5 lines max. Hook, proof, CTA.
- Headline: Under 40 characters.
- Description: One sentence.

---

## Step 4: EVALUATOR -- Score and Iterate

The Evaluator is a separate pass. It does NOT know the Generator's confidence level. It scores skeptically.

### Scoring Criteria (all scored 1-5)

| Criteria | What It Means | Minimum |
|----------|---------------|---------|
| **Voice Match** | Reads like Chris, not like AI. Short sentences, peer tone, builder vocabulary, contractions. No fluff. | 4/5 |
| **Specificity** | Real numbers, real examples, real proof. No vague claims. "7-figure agencies" beats "large businesses". | 4/5 |
| **Originality** | Zero AI slop patterns. Nothing that could come from any other agency account. No cliches from the banned list. | 4/5 |
| **Concision** | Every sentence earns its spot. Cut anything that doesn't add signal. | 4/5 |
| **CTA Clarity** | The reader knows exactly what to do next. One action, not three. | 4/5 |
| **Brand Alignment** | Matches Rawgrowth positioning: productize fulfillment with AI, peer-to-peer, proof-led. | 4/5 |

### Evaluation Process

1. Read the copy as if you're the target ICP (agency owner doing $5M+/yr)
2. Check EVERY sentence against the banned words list
3. Check for em dashes (the most common violation)
4. Check for passive voice constructions
5. Check that all numbers and claims reference real data from brand docs
6. Score each criterion 1-5
7. If ANY criterion scores below 4, flag the specific lines and rewrite them
8. Re-score after rewrite. Repeat until all criteria hit 4+.

### Red Flags (Auto-Fail, Rewrite Immediately)

- Any word from the banned list appears
- Em dash appears anywhere
- A paragraph exceeds 3 sentences
- Copy contains a claim not backed by brand docs or Supabase data
- Passive voice in more than 1 sentence
- Generic opener ("In today's fast-paced world...")
- CTA is unclear or there are multiple competing CTAs

---

## Step 5: Deliver

Output the final scored copy with:

1. The copy itself (clean, ready to use)
2. The scorecard (all 6 criteria with scores)
3. Format-specific notes (subject line variants for email, hook alternatives for social, etc.)

If the user asked for a specific platform, format for that platform. Otherwise deliver as clean markdown.

---

## Quick Reference: Copy Type Templates

### Email
```
SUBJECT: [Under 50 chars, specific]

[Hook line. One sentence that earns the open.]

[2-3 short paragraphs. Real numbers. One idea per paragraph.]

[CTA. One action. Make it obvious.]

[Optional P.S. with urgency or proof point.]
```

### DM Sequence
```
MSG 1: [Observation or value. No pitch.]
MSG 2: [Expand on value. Build curiosity.]
MSG 3: [Soft CTA. Question, not demand.]
```

### VSL Script
```
[HOOK - 0:00-0:30]
[PROBLEM - 0:30-2:00]
[MECHANISM - 2:00-5:00]
[PROOF - 5:00-7:00]
[OFFER - 7:00-9:00]
[CTA - 9:00-10:00]
```

### Landing Page
```
HEADLINE: [Promise]
SUBHEAD: [Mechanism]

[Problem section]
[Mechanism section]
[Proof stack]
[Offer breakdown]
[FAQ - top 5 objections]
[CTA]
```

### Social Caption
```
[Hook line - first 7 words matter most]

[Body - one insight, 2-4 sentences]

[CTA - natural, not desperate]
```

### Ad Copy
```
PRIMARY: [3-5 lines. Hook, proof, CTA.]
HEADLINE: [Under 40 chars]
DESCRIPTION: [One sentence]
CTA BUTTON: [Action verb]
```
