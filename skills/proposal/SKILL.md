---
name: proposal
description: Generate a custom proposal for a prospect. Gathers context, produces a personalized proposal document.
triggers: ["proposal", "write a proposal", "proposal for", "create proposal"]
---

# Proposal Skill

## Before Writing

Gather all context first:
```bash
cat [RAWCLAW]/knowledge/client/offer.md
cat [RAWCLAW]/knowledge/client/brand-voice.md
```

Also check for competitor intel if the prospect mentioned alternatives:
```bash
ls [RAWCLAW]/knowledge/competitors/
```

## Proposal Structure

### 1. The Situation
What's happening in their world right now? Reference specifics from the call or CRM notes.

### 2. The Problem
What is it costing them? Time, money, opportunity. Make it concrete.

### 3. The Solution
What you do. Not HOW you do it -- the outcome you deliver.

### 4. The Process
Phase 1 → Phase 2 → Phase 3. Timeline. What they can expect.

### 5. Investment
Price. Payment options. What's included.

### 6. Next Step
One clear action. "Reply yes and we'll send the agreement" or "Book your start date here."

## Quality Check

Before delivering:
- Does it reference their specific situation (not a generic template)?
- Is the problem section specific enough to make them feel understood?
- Is there exactly one CTA?
- Read it aloud -- does it sound human?

Score 1-10. Below 8: rewrite the lowest-scoring section.
