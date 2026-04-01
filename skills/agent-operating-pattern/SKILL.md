---
name: agent-operating-pattern
description: The standardized workflow every [COMPANY_NAME] agent follows. Load this to understand how agents gather context, query data, reference examples, execute, and self-improve.
user-invocable: true
---

# Agent Operating Pattern (AOP)

Every [COMPANY_NAME] agent follows this 6-step cycle. No exceptions. This is the flywheel in action at the agent level.

## The Cycle

### Step 1: LOAD CONTEXT (Read Your Docs)
Before doing any work, read the relevant markdown files for your domain:
- Your own `CLAUDE.md` (role, rules, output formats)
- Brand voice profile: `~/knowledge/agents/chris-voice-profile.md`
- Relevant brand docs from `~/knowledge/brand/`
- Relevant frameworks from `~/knowledge/frameworks/`
- Relevant SOPs from `~/knowledge/ops/`

**Rule:** Never start a task cold. Always load the documents that scope your work.

### Step 2: QUERY SUPABASE (Check the Data)
Query Supabase for relevant company data before producing output:
- `sales_calls` — objections, winning language, prospect patterns
- `content_pipeline` — what's queued, what's performing, what's stale
- `knowledge_base` — semantic search for relevant context (use `search_knowledge_base` RPC)
- `deliverables` — past work to reference and not duplicate
- `clients` — client context if task is client-specific
- `youtube_content` / `instagram_content` — performance metrics

**Rule:** Your output is only as good as the data behind it. Check Supabase before creating.

### Step 3: REFERENCE EXAMPLES (Learn How)
Before executing, find examples of excellent work in your domain:
- Check competitor content (research stored in Supabase `research` table)
- Check past deliverables that performed well
- Check frameworks and templates in `~/knowledge/frameworks/`
- If needed, request Ovi to pull fresh competitor examples

**Rule:** Don't guess how to do something. Find an example of someone doing it well, then adapt.

### Step 4: EXECUTE (Do the Work)
Now produce the deliverable:
- Follow your domain-specific output formats
- Apply brand voice rules (no AI slop, no filler, peer-to-peer tone)
- Include real numbers from `~/knowledge/brand/09-results.md` — never fabricate
- Every piece connects back to the flywheel (Signal, Intelligence, or Expression)

**Rule:** If the output feels generic, it IS generic. Rewrite it with specific data points.

### Step 5: SAVE TO DASHBOARD (Log Everything)
Every deliverable gets saved to Supabase:
```bash
python3 ~/tools/scripts/save-deliverable.py \
  --title "Title" --type document --agent <your-name> \
  --file /path/to/output.md --tags '["tag1","tag2"]' --status completed
```
Log your activity:
```bash
# Activity is auto-logged by dispatch.sh, but manual tasks should also be recorded
```

**Rule:** If it's not in Supabase, it didn't happen. Dashboard is the source of truth.

### Step 6: FEED BACK (Self-Improve)
After execution, ask:
- What data would have made this output better? → Request that data source be added to SIGNAL
- What pattern did I notice? → Log it to `knowledge_base` for future reference
- Did this output generate new signal? → Track the engagement/response

**Rule:** Every output should make the next output better. If the system isn't learning, something is broken.

## Data Loading Rules (STRICT)

1. **Read docs FIRST, query Supabase SECOND, execute THIRD.** Never skip steps.
2. **Don't hallucinate data.** If a number isn't in the docs or Supabase, don't make one up.
3. **Don't load everything.** Load only what's relevant to THIS task. Context is expensive.
4. **Timestamp your queries.** When pulling from Supabase, sort by recency. Stale data = stale output.
5. **Check deliverables for duplicates.** Before creating something, check if it already exists.
6. **Pass context when chaining.** If you're handing off to another agent, include your findings in the prompt. Don't assume they have your context.

## Quality Gate

Before submitting output, verify:
- [ ] Loaded relevant context docs
- [ ] Queried Supabase for supporting data
- [ ] Referenced at least one example or framework
- [ ] Output uses brand voice (no AI slop)
- [ ] Real numbers used (no fabrication)
- [ ] Saved to dashboard via save-deliverable.py
- [ ] Connects to flywheel (Signal, Intelligence, or Expression)
