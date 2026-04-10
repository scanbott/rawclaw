# Skills Index

All available skills. Load a skill by telling the agent to use it, or invoke by trigger phrase.

## Core Tools

| Skill | Trigger Phrases | What It Does |
|-------|----------------|--------------|
| `gmail` | "check email", "email", "inbox" | Gmail inbox management -- list, read, reply, send, filter |
| `slack` | "slack", "post to slack", "check slack" | Slack -- read channels, send messages, search |
| `google-calendar` | "calendar", "schedule", "book", "what's on my calendar" | Google Calendar -- create, list, update, cancel events |
| `timezone` | "what time is it", "timezone", "convert time" | Current times across locations |
| `tldr` | "tldr", "summarize this", "save this conversation" | Summarize conversation and save as a note |

## Content & Copy

| Skill | Trigger Phrases | What It Does |
|-------|----------------|--------------|
| `copywriting` | "write copy", "draft", "write an email", "write a DM" | Planner-Generator-Evaluator copy pipeline |
| `content-creation` | "content", "script", "reel", "youtube", "hook" | Hook library, video scripts, content calendars |
| `waterfall` | "waterfall", "repurpose", "turn this into content" | One input becomes posts, reels, threads, emails |
| `steal` | "steal this", "extract from", "analyze this URL" | Extract frameworks from any resource |

## Research & Intelligence

| Skill | Trigger Phrases | What It Does |
|-------|----------------|--------------|
| `research` | "research", "investigate", "competitive analysis" | Structured web research with sourced insights |
| `competitor-intel` | "competitor", "spy on", "what are they running" | Scrape competitor ads, content, and positioning |
| `signal-scan` | "signal scan", "what's working", "find patterns" | Cross-domain pattern recognition -- surface opportunities |

## Operations

| Skill | Trigger Phrases | What It Does |
|-------|----------------|--------------|
| `client-onboarding` | "onboard", "new client", "client setup" | Full client onboarding SOP |
| `ship-check` | "ship check", "quality check", "before shipping" | Pre-delivery quality gate |

## Development

| Skill | Trigger Phrases | What It Does |
|-------|----------------|--------------|
| `frontend-theme` | "UI code", "dashboard", "build a page" | Design system -- load before any frontend work |
| `add-migration` | "database change", "schema change", "add table" | Versioned database migrations |
| `mcp-creator` | "build MCP", "create MCP server", "add tool" | Build new MCP servers |
| `self-install` | "install", "add this tool", "set up" | Autonomously install tools and packages |
| `skill-creator` | "create skill", "new skill", "make this repeatable" | Package a process into a reusable skill |

## How Skills Work

Skills are loaded as context into the agent. When you tell an agent to use a skill, it reads the SKILL.md file and follows the protocol inside.

Skills live in `skills/[name]/SKILL.md`. To add a new skill, use the `skill-creator` skill.
