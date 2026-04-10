---
name: skill-creator
description: Create a new executable skill from a repeatable process or SOP. Packages knowledge into a loadable skill file.
triggers: ["create skill", "new skill", "package this as a skill", "make this repeatable"]
---

# Skill Creator

## When to Create a Skill

Create a skill when:
- You've done the same thing 3+ times and will do it again
- The process has clear steps that don't change
- Other agents could benefit from the same knowledge
- The owner asks you to "remember how to do this"

Don't create a skill for one-off tasks.

## Skill File Structure

Every skill is a folder in `skills/` with a `SKILL.md` file:

```
skills/
  [skill-name]/
    SKILL.md          # The skill definition
    [supporting files if needed]
```

## SKILL.md Template

```markdown
---
name: skill-name
description: One sentence. What this skill does and when to use it.
triggers: ["trigger phrase", "another trigger", "what someone says to invoke this"]
---

# Skill Name

## When to Use This
[1-3 sentences: exactly when this applies]

## Process
[Step-by-step. Numbered. Each step is one action.]

## Output
[What the skill produces. Where it gets saved.]

## Rules
[Non-negotiables. What can go wrong and how to avoid it.]
```

## Naming Conventions

- Lowercase, hyphenated: `client-onboarding`, `ship-check`, `competitor-intel`
- Verb-noun when it's an action: `add-migration`, `skill-creator`
- Noun when it's a framework: `copywriting`, `research`

## After Creating

1. Test it -- invoke the skill and run through the process
2. Add it to `skills/INDEX.md`
3. Log to hive mind
