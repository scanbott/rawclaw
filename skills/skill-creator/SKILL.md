---
name: skill-creator
description: Create a new executable skill from a repeatable process or SOP. Use when the user says "create a skill", "make a skill", "new skill", "turn this into a skill", "automate this process", or wants to capture a workflow they run repeatedly so it executes automatically on trigger. Produces a fully installed, runnable skill.
user-invocable: true
---

# Skill Creator

**Purpose:** Turn any repeatable process into a skill that executes end-to-end when triggered.

No pauses. Gather info, build the skill, install it, confirm it works.

---

## Phase 1: Extract the Process

Ask the user (max 3 questions total, combine where possible):

1. **What does this skill do?** Get a one-sentence description and a name (kebab-case).
2. **What are the steps?** Walk through the process from trigger to completion. For each step:
   - What action happens?
   - What tools/commands/APIs are involved?
   - What inputs does it need? Where do they come from?
   - What does it output? Where does it go?
3. **When should it trigger?** What would the user say to invoke it? List 3-5 trigger phrases.

If the user already described the process in conversation, extract from context instead of asking.

---

## Phase 2: Design the Skill

Map the process to skill structure:

```
~/.claude/skills/<skill-name>/
├── SKILL.md              # Frontmatter + step-by-step execution instructions
├── references/            # (optional) Reference docs Claude needs during execution
├── scripts/               # (optional) Deterministic scripts for reliability
└── assets/                # (optional) Templates, files used in output
```

**Decision framework:**
- Step is the same every time with exact commands -> put in `scripts/`
- Step needs Claude judgment but benefits from reference material -> put in `references/`
- Step produces output from a template -> put in `assets/`
- Step is a simple tool call or bash command -> inline in SKILL.md

---

## Phase 3: Build the Skill

### 3a. Write SKILL.md

Follow this structure:

```markdown
---
name: <skill-name>
description: <What it does. 1-2 sentences. Then: Triggers on "<phrase 1>", "<phrase 2>", "<phrase 3>", or <general trigger description>.>
user-invocable: true
---

# <Skill Name>

**Flow:** Step 1 -> Step 2 -> Step 3 -> ... -> Done

No pauses. Run end to end once triggered.

Parse the user's message for:
- **<input 1>** (required/optional) -- description
- **<input 2>** (required/optional) -- description

---

## Step 1: <Action Name>

<Clear instructions for what to do, including exact commands, tool calls, or decision logic.>

## Step 2: <Action Name>

<Instructions...>

...

## Step N: Cleanup & Confirm

<Save deliverables, notify, clean up temp files.>

## Error Handling

| Problem | Solution |
|---------|----------|
| <common failure> | <fallback action> |
```

**Writing rules for SKILL.md:**
- Imperative voice ("Pull sales data", not "You should pull sales data")
- Include exact bash commands, tool calls, and file paths
- Every step has a clear input and output
- No explanations of WHY unless it affects execution
- Include error handling for anything that could fail
- Keep under 500 lines. Split to `references/` if longer.
- Add `user-invocable: true` to frontmatter so it appears as a slash command

### 3b. Create Supporting Files

Write any `scripts/`, `references/`, or `assets/` files identified in Phase 2.

For scripts: write them, make executable (`chmod +x`), and test with a dry run if possible.

### 3c. Install the Skill

The skill is installed by writing to `~/.claude/skills/<skill-name>/`. It becomes available immediately as a slash command.

---

## Phase 4: Verify

1. Confirm the skill appears in the skills list by checking the directory exists
2. Read back the SKILL.md and verify:
   - Frontmatter has `name`, `description`, and `user-invocable: true`
   - All steps are actionable (no vague instructions)
   - Commands include full paths and `source ~/.zshrc` where needed
   - Error handling covers likely failures
3. Tell the user: skill name, trigger phrases, and that they can run it with `/<skill-name>`

---

## Phase 5: Register

Update the self-install skill's "Currently Installed Skills" table:

```bash
# File: ~/.claude/skills/self-install/SKILL.md
# Add a row to the table
```

---

## Quality Checklist

Before delivering, verify:
- [ ] Every step has exact commands or clear tool call instructions
- [ ] No step says "figure out" or "determine the best way" without criteria
- [ ] Inputs are parsed from user message at the top
- [ ] Outputs are saved (Supabase, file, Google Doc, etc.)
- [ ] `source ~/.zshrc` before any API/env-dependent commands
- [ ] No em dashes in any file
- [ ] Skill works as a slash command (`/<skill-name>`)
