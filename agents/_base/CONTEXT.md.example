# Shared Agent Protocols

All agents load this file. These are non-negotiable defaults.

---

## Hive Mind -- Log Everything Meaningful

After completing any significant action, log it:

```bash
sqlite3 [RAWCLAW]/store/rawclaw.db "INSERT INTO hive_mind (agent_id, chat_id, action, summary, artifacts, created_at) VALUES ('[AGENT_ID]', '[CHAT_ID]', '[ACTION]', '[SUMMARY]', NULL, strftime('%s','now'));"
```

This is how agents stay aware of each other's work. Don't skip it.

---

## Scheduling Tasks

```bash
# Create a scheduled task
node [RAWCLAW]/dist/schedule-cli.js create "PROMPT" "CRON_EXPRESSION"

# Common schedules
# Daily 9am:        0 9 * * *
# Weekdays 8am:     0 8 * * 1-5
# Every 4 hours:    0 */4 * * *
# Weekly Monday:    0 9 * * 1

# Manage tasks
node [RAWCLAW]/dist/schedule-cli.js list
node [RAWCLAW]/dist/schedule-cli.js pause <id>
node [RAWCLAW]/dist/schedule-cli.js resume <id>
node [RAWCLAW]/dist/schedule-cli.js delete <id>
```

---

## Inter-Agent Tasks -- Delegate Work

Delegate to another agent asynchronously:

```bash
# Queue a task for another agent
node [RAWCLAW]/dist/mission-cli.js create --agent [TARGET_AGENT] --title "Short label" "Full prompt with context. Definition of done: (1) ... (2) ... (3) ..."

# Check task status
node [RAWCLAW]/dist/mission-cli.js list
node [RAWCRAWL]/dist/mission-cli.js result <task-id>
```

Available agents: main, dev, ops, finance, sales, content, research, comms, support

---

## Creating New Agents

```bash
node [RAWCLAW]/dist/agent-create-cli.js \
  --id AGENT_ID \
  --name "Display Name" \
  --description "What this agent does" \
  --model claude-sonnet-4-6 \
  --template _template \
  --token "BOT_TOKEN_HERE" \
  --activate
```

---

## File Placement

| Output Type | Location |
|-------------|----------|
| Finished copy / scripts | `workspace/artifacts/copy/` |
| Research reports | `workspace/artifacts/research/` |
| Strategy docs / funnel maps | `workspace/artifacts/strategy/` |
| Client records | `clients/[name]/` |
| Competitor profiles | `knowledge/competitors/[name].md` |
| Temp / scratch | `workspace/tmp/` only |

Nothing goes at the project root. Nothing in `src/`.

---

## Ship Check -- Non-Negotiable Gate

Before marking ANY task complete, deployed, or ready:
1. Re-read the original request -- does the output actually answer it?
2. For code: test every route, form, and API endpoint on the live URL (not local)
3. For copy: read it aloud -- does it sound like a human wrote it?
4. For data tasks: spot-check 3 rows manually
5. Only then: mark complete and log to hive mind

---

## Outbound Comms Policy

NEVER send messages to clients or external parties without explicit owner approval. Drafts are fine. Sending is not. When in doubt, stage it and ask.

---

## Decision Framework

When the problem has multiple valid approaches:
1. Generate 3 solutions
2. Pick the best one
3. Present all 3 with trade-offs (1-2 sentences each)
4. Owner confirms
5. Log decision to hive mind

---

## Planner-Generator-Evaluator

For complex deliverables (copy, proposals, strategies, code features):
1. **Planner:** Spec out exactly what needs to be built (audience, goal, constraints, format)
2. **Generator:** Build it against the spec
3. **Evaluator:** Score it 1-10 against the spec criteria. If < 8, identify gaps and regenerate.
4. Repeat until score >= 8, then deliver.

Never self-approve quality-critical work.

---

## Knowledge Files

Before starting domain work, load the relevant knowledge:

```bash
# Client's business context
cat [RAWCLAW]/knowledge/client/business.md
cat [RAWCLAW]/knowledge/client/brand-voice.md
cat [RAWCLAW]/knowledge/client/offer.md

# Competitor intel
cat [RAWCLAW]/knowledge/competitors/[competitor].md

# Expert frameworks
cat [RAWCLAW]/knowledge/frameworks/[relevant-framework].md
```

Always check `knowledge/client/` before writing any client-facing copy. The brand voice file overrides your defaults.
