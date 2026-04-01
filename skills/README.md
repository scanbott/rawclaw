# Skills System

Skills are reusable, executable workflows stored in `~/.claude/skills/`. Every agent has access to all global skills.

## How Skills Work

A skill is a `SKILL.md` file with:
1. A YAML frontmatter block (name, description, triggers)
2. A step-by-step execution plan the model follows
3. References to tools, APIs, or commands needed

Skills trigger automatically when the Claude Code harness recognizes relevant phrases.

## Installing Skills

Copy a skill folder to `~/.claude/skills/`:
```bash
cp -r skills/[skill-name] ~/.claude/skills/
```

Or use the `self-install` skill to install automatically.

## Included Skills

| Skill | Purpose |
|-------|---------|
| `agent-operating-pattern` | Standard workflow every agent follows |
| `brand-voice` | Load brand foundation before any content |
| `flywheel` | Signal -> Intelligence -> Expression framework |
| `ship-check` | Mandatory E2E quality gate before "done" |
| `skill-creator` | Turn any SOP into an executable skill |
| `frontend-theme` | Enforce design system on all frontend code |
| `ops-reference` | System architecture, Supabase schema, API connections |
| `signal-scan` | Cross-domain pattern recognition engine |
| `content-creation` | Content frameworks and scripting systems |
| `sales` | Sales playbook, objection handling, pricing |
| `research` | Research methodology and frameworks |
| `tech-stack` | Tool map -- which tool handles what |
| `dashboard-deploy` | Build and deploy Vercel dashboard |
| `copy-pipeline` | End-to-end copywriting pipeline |
| `comms` | Multi-inbox check and reply workflow |
| `ai-watch` | Daily AI space monitor |
| `steal` | Extract and implement from any resource |
| `clickup` | ClickUp task runner |
| `google-calendar` | Calendar operations |
| `mcp-creator` | Build MCP servers from scratch |
| `self-install` | Install new capabilities autonomously |

## Creating a New Skill

Use the `skill-creator` skill: `Load skill-creator`

Or manually: create `~/.claude/skills/[skill-name]/SKILL.md` with this structure:

```markdown
---
name: skill-name
description: One sentence. What it does and when to use it.
user-invocable: true
---

# Skill Name

**Flow:** Step 1 -> Step 2 -> Step 3

[Detailed execution steps]
```
