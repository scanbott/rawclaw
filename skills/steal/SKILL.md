---
name: robber
description: Extracts everything useful from any resource (GitHub repo, YouTube video, Instagram reel, Twitter/X post, or any URL) and maps it to [COMPANY_NAME]. Code/tools -> Extract & Report. Strategy/content/frameworks -> Extract & Implement into MD files. Triggers on "/robber", "rob this", "steal from this", "extract from", or when a URL is passed with intent to analyze.
user-invocable: true
---

# Robber

**Flow:** Detect resource type -> Fetch & read -> Determine mode -> Extract -> Report or Implement -> Confirm

No pauses. Run end to end once triggered.

Parse the user's message for:
- **resource** (required) -- a URL, repo link, or pasted text to analyze
- **mode override** (optional) -- "report only" or "implement" if the user specifies

---

## Step 1: Identify the Resource Type

Classify the resource from the user's message:

| Input | Type |
|-------|------|
| `github.com/*` | GitHub repo |
| `youtube.com/*` or `youtu.be/*` | YouTube video |
| `instagram.com/*` | Instagram post/reel |
| `twitter.com/*` or `x.com/*` | Twitter/X post |
| Any other URL | Generic web resource |
| Raw pasted text | Text content |

---

## Step 2: Fetch the Resource

**GitHub repo:**
- WebFetch the repo landing page: `https://github.com/<owner>/<repo>`
- Fetch README: `https://raw.githubusercontent.com/<owner>/<repo>/main/README.md` (fallback to `/master/`)
- WebFetch the file tree to understand structure
- Use mcp__github__get_file_contents for key files: package.json, index files, /src or /lib entry points, any scripts/
- Focus on: what it does, how it works, what APIs/patterns it uses

**YouTube video:**
- WebFetch `https://www.youtube.com/watch?v=<id>` for title + description
- WebFetch `https://youtubetranscript.com/?v=<id>` for transcript
- Fallback: invoke yt-search skill with the video title to pull metadata

**Instagram reel/post:**
- Use agent-browser skill to navigate to the URL
- Screenshot and extract caption, visible text, and core concept

**Twitter/X post:**
- WebFetch the URL directly
- If blocked: replace twitter.com or x.com with nitter.net and retry
- Extract post content and any thread replies

**Generic URL:**
- WebFetch the URL
- If it fails or returns empty: use agent-browser to render and screenshot

**Raw pasted text:**
- Skip fetch, analyze the content directly

---

## Step 3: Determine Mode

If user said "report only" -> Mode 1
If user said "implement" -> Mode 2

Otherwise, classify automatically:

**Mode 1 (Extract & Report)** if resource is primarily:
- Code, scripts, repos, tools, APIs, libraries, infrastructure, MCP servers, automation patterns

**Mode 2 (Extract & Implement)** if resource is primarily:
- Strategy, marketing, sales tactics, content frameworks, positioning, copywriting, client delivery, business systems, operational SOPs

If genuinely ambiguous (e.g. a repo that also documents a full methodology), ask ONE question:
"This has both code and strategy. Report on the technical side, implement the strategy side, or both?"

---

## Step 4a: Mode 1 -- Extract & Report

Scan everything and identify what's useful for [COMPANY_NAME].

**[COMPANY_NAME] context to map findings against:**
- Core offer: install AI departments into 7-9 figure businesses. $20K install + $10K/mo retainer
- Stack: Claude Code agents, Supabase, Hono, Vercel, n8n, MCP servers, Telegram bot, cron scheduler, SQLite
- Agents: Scan (COO), Quilly (content), Larry (sales), Ovi (research), Cleo (clients), Ali (dev), Sam (finance)
- Flywheel: Signal -> Intelligence -> Expression
- Always hunting for: new MCP integrations, automation patterns, agent architecture ideas, APIs that plug into our stack, workflow tools, dashboard enhancements

**For each finding:**
- What it is (one line)
- Why it's relevant to [COMPANY_NAME] specifically
- How to implement it (specific: which agent, which file, what it connects to)
- Effort: Quick Win (<1hr) / Medium (1 day) / Big Lift (multi-day)

**Output:**

```
ROBBER REPORT
Resource: [name + URL]
Type: [GitHub repo / tool / framework / etc.]

--- FINDINGS ---

[Finding name]
What: [one line]
Relevant because: [specific [COMPANY_NAME] context]
Implementation: [exact action -- e.g. "wrap as MCP server, add to Ali's stack" or "add pattern to skill X"]
Effort: Quick Win / Medium / Big Lift

[repeat per finding]

--- PRIORITY QUEUE ---

Quick Wins (do now):
- [item] -> [action]

Medium Lifts (schedule):
- [item] -> [action]

Big Lifts (plan):
- [item] -> [action]

Recommended next step: [single most valuable action]
```

---

## Step 4b: Mode 2 -- Extract & Implement

Pull every tactic and framework from the resource. Filter hard. Implement the relevant ones directly into the system.

**Keep anything touching:**
- How to sell, position, or price AI services
- Content strategy (YouTube, Instagram, LinkedIn)
- Client delivery, onboarding, or retention
- Business systems and operational frameworks
- Sales scripts, DM frameworks, objection handling
- Agency or consulting business models
- AI implementation approaches or mental models

**Files to consider updating:**
- `~/BusinessOS/CLAUDE.md` -- core OS config, directives, business context
- `~/BusinessOS/agents/*/CLAUDE.md` -- agent-specific context (check all agents)
- `~/.claude/skills/brand-voice/SKILL.md` -- voice, positioning, messaging
- `~/.claude/skills/sales/SKILL.md` -- sales tactics, frameworks
- `~/.claude/skills/content-creation/SKILL.md` -- content frameworks, hooks
- `~/.claude/skills/research/SKILL.md` -- research methods
- `~/knowledge/` -- Obsidian vault (add new doc or append to relevant existing doc)

**Implementation rules:**
- Read each target file before editing
- Write in Chris's voice: short sentences, no fluff, engineer vocabulary, contractions always, no em dashes
- Add tactics as concrete, actionable lines -- not summaries or paraphrases
- Fold into existing sections where they fit. Don't create bloat
- If a tactic doesn't fit any existing file cleanly, create a new doc in `~/knowledge/`
- Surgical edits only -- don't rewrite sections unless they're wrong

**Output:**

```
ROBBER REPORT -- IMPLEMENTED
Resource: [name + URL]
Type: [YouTube video / article / post / etc.]

--- TACTICS EXTRACTED ---
- [tactic 1]
- [tactic 2]
...

--- IMPLEMENTED ---
[file path]
  + [what was added or changed]
  + [what was added or changed]

[file path]
  + [what was added or changed]

--- SKIPPED (not relevant to [COMPANY_NAME]) ---
- [tactic] -- [why skipped]
```

---

## Step 5: Log to Hive Mind

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
sqlite3 "$PROJECT_ROOT/store/businessos.db" "INSERT INTO hive_mind (agent_id, chat_id, action, summary, artifacts, created_at) VALUES ('dev', 'robber', 'robber_extract', 'Robbed [RESOURCE]: [ONE LINE SUMMARY]', NULL, strftime('%s','now'));"
```

---

## Error Handling

| Problem | Solution |
|---------|----------|
| WebFetch blocked / 403 | Use agent-browser to render the page visually |
| YouTube no transcript available | Use title + description + top comments to reconstruct content |
| Instagram login wall | Screenshot whatever is visible, extract from caption and visual context |
| GitHub repo is private | Report back "repo is private -- share access or a public mirror" |
| Resource is a massive repo | Focus on README, package.json, entry points in /src, and any /docs folder |
| Content is ambiguous | Default to Mode 2 (strategy) |
