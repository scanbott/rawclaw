---
name: copy-pipeline
description: End-to-end copywriting pipeline backtested against real data. Given a copy task (landing page, email sequence, VSL, DM sequence, ad), pulls sales call transcripts and objections from Supabase, loads best-performing copy examples, brand voice, and relevant data into NotebookLM for grounded analysis, then writes copy informed by what actually closes deals. Triggers on "write copy for [X]", "copy pipeline [X]", "write a [landing page/email/VSL/DM/ad]", or any copywriting request.
user-invocable: true
---

# Copywriting Pipeline

**Flow:** Copy Brief -> Sales Call Intelligence -> Copy Examples -> NotebookLM Analysis -> Write Copy -> Feed Back

No pauses. Run end to end once triggered.

Parse the user's message for:
- **Copy type** (required) — landing page, email sequence, VSL, DM sequence, ad, sales page
- **Context** (required) — what it's for, who it's targeting, what offer
- **Deliverable format** (optional) — Google Doc, markdown, both

---

## Step 0: Load Swipe File & Copy Psychology (MANDATORY)

Before writing ANY copy, load the analysis and reference the real examples.

### 0a. Read the Copy Analysis
```bash
cat ~/knowledge/copy-examples/COPY-ANALYSIS.md
```
This contains the 15 Universal Laws extracted from 39+ real copy examples (Charlie Morgan, Sabri Suby, Dan Koe, KJ Rainley, Hormozi, Zarak, etc.). Every piece of copy must follow these laws.

### 0b. Load Relevant Examples by Copy Type
```bash
# For VSLs:
ls ~/knowledge/copy-examples/vsl-scripts/
# Best examples: charlie-morgan.md, sabri-suby.md, dan-koe.md, consultant.md, very-casual-vsl.md

# For Sales Pages:
ls ~/knowledge/copy-examples/sales-pages/
# Best examples: zarak-dr-files.md, eddie-cumberbatch-growth-operator.md, daniel-fazio-internet-money.md

# For Emails:
ls ~/knowledge/copy-examples/emails/
# Best examples: alex-harmozi-email.md, liam-ottley.md, plus by-person/ and by-type/ folders

# For Webinars/Presentations:
ls ~/knowledge/copy-examples/webinars/
# perfect-webinar-template.md, perfect-webinar-slides-outline.md
```

Read 2-3 of the best matching examples BEFORE writing. Match their patterns, not their words.

### 0c. Internalize the Voice Rules (NON-NEGOTIABLE)

**ALWAYS:**
- Contractions (you're, don't, isn't, we'll)
- Start sentences with "And", "But", "So", "Because"
- Fragments for emphasis ("Crazy." "Period." "That's it.")
- Rhetorical questions mid-paragraph
- Casual transitions ("So here's the thing", "Let me be honest")
- Oxford commas (x, y, and z)
- Specific numbers over vague claims
- Short paragraphs (1-3 sentences MAX)
- Second person throughout ("you", "your")

**NEVER:**
- Em dashes (use periods, commas, or "..." instead)
- "It's not X, it's Y" construction
- AI cliches ("Certainly!", "I'd be happy to", "Great question!", "game-changer", "unlock", "dive in", "leverage")
- Formal transitions ("Furthermore", "Additionally", "In conclusion")
- Passive voice
- Weak qualifiers ("somewhat", "relatively", "fairly")
- Semicolons in copy
- Paragraphs longer than 3 sentences
- Sycophancy or excessive apologies

**The Test:** Read it out loud. If it sounds like a robot, a textbook, or a LinkedIn post, rewrite it. It should sound like a smart friend explaining something over drinks.

---

## Step 1: Gather Sales Intelligence

Pull real data on what prospects say, what objections come up, and what language closes deals.

### 1a. Sales Call Transcripts & Objections

```bash
source ~/.zshrc && python3 -c "
import sys; sys.path.insert(0, '$HOME/tools')
from lib.supabase_client import supabase_select
import json

# Get all sales calls with transcripts
calls = supabase_select('sales_calls', '?select=prospect_name,title,transcript,objections,pain_points,outcome,meeting_date&order=meeting_date.desc', limit=20)
print(json.dumps(calls, indent=2, default=str))
" > /tmp/copy-pipeline-calls.json
```

### 1b. Best-Performing Copy Examples from KB

```bash
source ~/.zshrc && python3 ~/tools/knowledge_base.py search "copy examples VSL sales page email"
```

Also query for the specific copy type being written:
```bash
source ~/.zshrc && python3 ~/tools/knowledge_base.py search "<COPY_TYPE> examples"
```

### 1c. Brand Voice & Offer

Read from Obsidian vault:
- `~/knowledge/brand/05-brand-voice.md` — voice profile and rules
- `~/knowledge/brand/03-offer.md` — offer structure, pricing, positioning
- `~/knowledge/brand/02-icp.md` — who we're talking to

```bash
python3 ~/tools/scripts/vault-search.py --query "brand voice chris west"
python3 ~/tools/scripts/vault-search.py --query "offer pricing positioning"
```

## Step 2: NotebookLM Analysis

### 2a. Prepare Sources

Export the sales call data and copy examples to a Google Doc so NotebookLM can ingest it:

```bash
# Create a Google Doc with sales call intelligence
mcp__google-workspace__create_doc -> title: "Copy Pipeline: Sales Intelligence for <COPY_TYPE>"
```

Write into the doc:
- Top objections across all sales calls (extracted from calls JSON)
- Language prospects use when describing their pain points
- What outcomes/promises resonated (from calls that closed)
- Best copy examples from KB

### 2b. Create NotebookLM Notebook

Use Playwright MCP to create a notebook and add:
1. The sales intelligence Google Doc as a source
2. Any existing landing pages or copy as website sources (if URLs available)
3. Brand voice doc (if in Google Docs)

```
mcp__playwright__browser_navigate -> url: "https://notebooklm.google.com"
mcp__playwright__browser_snapshot
```

Create notebook, add sources via the standard Playwright flow (snapshot -> click "Add source" -> add URL/doc -> submit).

### 2c. Register & Query

```bash
python ~/.claude/skills/notebooklm/scripts/run.py notebook_manager.py add \
  --url "<NOTEBOOK_URL>" \
  --name "Copy Pipeline: <COPY_TYPE>" \
  --description "Sales intelligence and copy examples for writing <COPY_TYPE>" \
  --topics "copywriting,sales,<COPY_TYPE>"
```

**Q1 — Objection patterns:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What are the top objections prospects raise? What specific language do they use? What concerns come up most frequently?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q2 — What closes:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "In the calls that resulted in a close or positive outcome, what arguments, promises, or framing worked? What language resonated?" \
  --notebook-url "<NOTEBOOK_URL>"
```

**Q3 — Copy patterns:**
```bash
python ~/.claude/skills/notebooklm/scripts/run.py ask_question.py \
  --question "What patterns appear in the best copy examples? What hooks, structures, and CTAs are used? How does the copy address objections?" \
  --notebook-url "<NOTEBOOK_URL>"
```

## Step 3: Load Writing Framework

### 3a. Brand Voice
Read `~/knowledge/brand/05-brand-voice.md` for Chris's exact voice rules:
- Direct, calm confidence
- No AI slop: never "game-changer," "unlock," "let's dive in"
- Metaphors: machine, engine, loop, stack, system
- Proof-heavy: real numbers, real clients, real results

### 3b. Copy Frameworks from KB
```bash
source ~/.zshrc && python3 ~/tools/knowledge_base.py search "copy framework structure"
```

### 3c. Sales Playbook from Vault
```bash
python3 ~/tools/scripts/vault-search.py --query "objection handling sales playbook"
```
Read the relevant files for objection-handling language and sales psychology.

## Step 4: Write the Copy

Combine:
- **Sales call intelligence** — address the REAL objections, use the REAL language
- **Copy examples** — match proven patterns and structures
- **Brand voice** — sound like Chris, not like AI
- **NotebookLM insights** — grounded analysis of what works

### Copy Type Formats

**Landing Page:**
- Headline (addresses #1 pain point from calls)
- Subheadline (the promise, using prospect language)
- Problem section (stack 3 pain points from real calls)
- Solution section (the offer, framed against objections)
- Proof section (client results, real numbers)
- FAQ (answer top 3 objections directly)
- CTA (single, clear next step)

**Email Sequence:**
- Email 1: Hook + story (pattern interrupt, personal angle)
- Email 2: Problem agitation (use real prospect language from calls)
- Email 3: Solution + proof (framework + client results)
- Email 4: Objection crusher (address #1 objection head-on)
- Email 5: CTA + urgency (soft close, not desperate)

**VSL Script:**
- Hook (first 30 seconds — pattern interrupt)
- Problem (use exact language from sales calls)
- Agitate (stack consequences, real scenarios)
- Solution (the offer, positioned against alternatives)
- Proof (client results, before/after)
- Close (CTA + risk reversal)

**DM Sequence:**
- Message 1: Observation + question (not pitch)
- Message 2: Value drop (insight, not sell)
- Message 3: Soft bridge to offer
- Message 4: Direct CTA (if engaged)

### Writing Rules
1. Every claim backed by a real number or client result
2. Address the top 3 objections from sales calls — don't dodge them
3. Use the prospect's language, not marketing jargon
4. Match Chris's voice exactly — read the past copy examples
5. Every section has a job — if it doesn't move toward the CTA, cut it

## Step 5: Feed Back

```bash
# Save to deliverables
python3 ~/tools/scripts/save-deliverable.py \
  --title "<COPY_TYPE>: <CONTEXT>" \
  --type document \
  --agent larry \
  --file /tmp/copy-pipeline-output.md \
  --tags '["copy", "<COPY_TYPE>", "pipeline"]' \
  --status completed
```

After copy goes live, track performance in Supabase to inform future pipeline runs.

## Error Handling

| Problem | Solution |
|---------|----------|
| No sales calls in Supabase | Use KB copy examples + brand voice only. Note in output. |
| NotebookLM fails | Proceed with direct analysis of sales call JSON. Still valuable. |
| No copy examples in KB | Use Obsidian vault sales docs as reference. |
| Brand voice file missing | Use `vault-search.py --tag "brand"` to find alternatives. |

## Cleanup

```bash
rm -f /tmp/copy-pipeline-*.json /tmp/copy-pipeline-*.md
```
