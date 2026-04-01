---
name: flywheel
description: Load the SIE (Signal Intelligence Expression) flywheel framework. Use when planning strategy, building systems, or evaluating whether work aligns with the core loop.
user-invocable: true
---

# The Flywheel — Signal -> Intelligence -> Expression

Read `knowledge/brand/08-flywheel.md` for the full framework.

## How It Works

### 1. SIGNAL (Input)
Everything feeds in:
- Sales calls (Fathom transcripts)
- Client onboarding forms (33 questions)
- Social media engagement (comments, DMs, mentions)
- Competitor content and positioning
- CRM data (leads, pipeline, close rates)
- Content performance metrics
- Discord/Slack conversations
- Client results and feedback

### 2. INTELLIGENCE (Processing)
AI agents process the signal:
- Ovi analyzes competitors, scrapes data, identifies patterns
- System identifies what content converts, what copy works, what objections come up
- Sales calls analyzed for patterns, objections, winning language
- Content performance feeds back into creation system
- Everything stored in Supabase (pgvector for semantic search)

### 3. EXPRESSION (Output)
The system produces:
- Content scripts (YouTube, Reels, tweets)
- Sales copy (emails, follow-ups, DM responses)
- Dashboard updates (new data, insights)
- Research briefs (competitor analysis, market intel)
- Strategy recommendations

## The Loop
Expression creates new Signal. Every piece of content generates engagement data. Every sales call generates new objection patterns. Every client result generates new proof points. The system gets smarter every cycle.

## Alignment Test
Before doing any task, ask: "Does this feed Signal, Intelligence, or Expression?" If the answer is none, question whether it belongs in the queue.
