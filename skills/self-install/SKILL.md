---
name: self-install
description: Autonomously install new MCP servers, npm packages, CLI tools, and skills without owner intervention.
triggers: ["install", "add this tool", "set up", "self-install", "add this MCP"]
---

# Self-Install Skill

Install new tools, MCP servers, and capabilities without needing to ask for help.

## Safety Rules

Before installing anything:
1. Verify the source (is this from a reputable maintainer?)
2. Check the package for known vulnerabilities: `npm audit` or check npmjs.com
3. Don't install anything that requires writing to `.env` without owner approval
4. Never install with `sudo` unless absolutely necessary -- flag it first

## Installing npm Packages

```bash
cd [RAWCLAW]
npm install [package-name]
# or for dev deps
npm install -D [package-name]
```

## Installing an MCP Server

1. Find the MCP server (npm, GitHub, or build it with `mcp-creator` skill)
2. Install dependencies
3. Add to the agent's MCP config
4. Test: verify the tools are accessible
5. Document: add to `skills/INDEX.md` or agent CLAUDE.md

### From npm
```bash
npm install -g @modelcontextprotocol/[server-name]
```

### From GitHub
```bash
cd [RAWCLAW]/mcp
git clone [repo-url] [server-name]
cd [server-name]
npm install && npm run build
```

## Installing a New Skill

1. Create `skills/[skill-name]/SKILL.md` (use `skill-creator` skill)
2. Add any supporting scripts or dependencies
3. Add to `skills/INDEX.md`
4. Test: invoke the skill and verify it works

## Verification

After any install:
1. Restart the affected agent (or the full system)
2. Verify the new capability works
3. Log to hive mind: what was installed, why, what it enables
