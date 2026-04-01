---
name: self-install
description: Install new MCP servers, skills, and tools autonomously. Use when you need a capability you don't have.
---

# Self-Install Skill

You can install new capabilities for yourself. Use this when you encounter a task that requires a tool, MCP server, or skill you don't currently have.

## Installing MCP Servers

### From npm (most common)
```bash
# Add to user scope so it works across all projects
npx -y @anthropic-ai/claude-code mcp add -s user <name> -- npx -y <package-name>

# With environment variables (put -e BEFORE the --)
npx -y @anthropic-ai/claude-code mcp add -s user -e KEY=value -- <name> npx -y <package-name>
```

### From a Git repo
```bash
cd ~/tools
git clone <repo-url> <dir-name>
cd <dir-name> && npm install && npm run build
npx -y @anthropic-ai/claude-code mcp add -s user -- <name> node ~/tools/<dir-name>/build/index.js
```

### From Python
```bash
pip3 install --break-system-packages <package>
npx -y @anthropic-ai/claude-code mcp add -s user -- <name> python3 -m <module>
```

### List/remove MCP servers
```bash
npx -y @anthropic-ai/claude-code mcp list
npx -y @anthropic-ai/claude-code mcp remove <name>
```

## Installing Skills

Skills are markdown files that teach you how to do specific things.

### Create a new skill
```bash
mkdir -p ~/.claude/skills/<skill-name>
```
Then write a SKILL.md file with:
```yaml
---
name: <skill-name>
description: <what it does>
---
# Instructions here
```

### Browse available skills
- Anthropic official: https://github.com/anthropics/skills
- Community curated: https://github.com/travisvn/awesome-claude-skills
- Search: `npx -y @anthropic-ai/claude-code /plugin marketplace`

## Discovery Process

When you need a new capability:

1. **Search first**: Use WebSearch to find "<capability> MCP server npm" or "<capability> Claude Code skill"
2. **Check GitHub**: Look at `github.com/modelcontextprotocol/servers` for official servers
3. **Check npm**: Search `npmjs.com` for `@modelcontextprotocol/server-*` packages
4. **Build your own**: If nothing exists, create a custom MCP server or skill in `~/tools/`

## Currently Installed MCP Servers

| Server | Command | Purpose |
|--------|---------|---------|
| playwright | `npx @playwright/mcp --headless` | Browser automation, web scraping, form filling |
| filesystem | `npx -y @modelcontextprotocol/server-filesystem` | Full filesystem access to [HOME_DIR] and /tmp |
| memory | `npx -y @modelcontextprotocol/server-memory` | Persistent knowledge graph across sessions |
| github | `npx -y @modelcontextprotocol/server-github` | GitHub repos, PRs, issues, code search |
| discord | `node ~/tools/discord-mcp/build/index.js` | Discord read/send messages (needs DISCORD_TOKEN) |

## Currently Installed Skills

| Skill | Triggers |
|-------|----------|
| brand-voice | Content, copy, client-facing material |
| content-creation | Scripts, hooks, YouTube, Reels |
| sales | DMs, emails, proposals, call prep |
| flywheel | Strategy, system design, alignment checks |
| research | Competitor analysis, market research |
| client-onboarding | New client setup |
| dashboard-deploy | Vercel dashboard builds |
| mcp-creator | Building MCP servers from scratch |
| self-install | Installing new tools (this skill) |
| signal-scan | Biweekly cross-domain pattern recognition (cron: 1st & 15th at 9am) |
| skill-creator | Turn repeatable processes/SOPs into executable skills |
| story-sequence | Instagram story sequence pipeline (examples -> copy -> ManyChat -> Canva) |
| robber | Extract & report (repos/tools) or extract & implement (strategy/content) from any URL |
| clickup | /clickup, check clickup, show my tasks, run through my to-dos |
| comms | /comms, check my messages, what have I missed, inbox check, reply to my messages |

## Rules

- Always install at user scope (`-s user`) so tools work across projects
- Store cloned repos in `~/tools/`
- After installing, update this skill's "Currently Installed" tables
- After installing, update CLAUDE.md if the tool is significant
- Test the new tool immediately after installing
- If an MCP server needs an API key, add it to `~/.zshrc` and document it
