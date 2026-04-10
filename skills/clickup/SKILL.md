---
name: clickup
description: Fetches all ClickUp tasks assigned to Chris West, presents status and priority, identifies which ones Cleo can act on (comms/outreach), drafts the proposed action for approval, executes on APPROVE, updates task status in ClickUp. Triggers on "/clickup", "check clickup", "what are my clickup tasks", "show me my tasks", "run through my to-dos".
user-invocable: true
---

# ClickUp Task Runner

**Flow:** Fetch tasks -> Display all -> Identify actionable -> Draft proposals -> Get approval -> Execute + advance status -> Report

No pauses between steps except the approval gate. Run fully end to end.

---

## Step 1: Fetch Tasks

Load env and pull all tasks assigned to Chris West (user ID: 144069077) from Founders Kanban.

```bash
source ~/.zshrc
PROJECT_ROOT=$(git -C ~/BusinessOS rev-parse --show-toplevel 2>/dev/null || echo ~/BusinessOS)
source "$PROJECT_ROOT/.env"

curl -s -X GET "https://api.clickup.com/api/v2/list/901326628160/task?archived=false&include_closed=false&subtasks=true&assignees[]=144069077&page=0" \
  -H "Authorization: $CLICKUP_API_KEY" \
  -H "Content-Type: application/json"
```

Parse the response. For each task extract:
- `id` (needed for status updates)
- `name`
- `status.status` (backlog / next up / working / review)
- `priority.priority` (urgent / high / normal / low / none)
- `assignees[].username`
- `description` (if present, gives context for action)

---

## Step 2: Display All Tasks

Present every task grouped by status. Format:

```
YOUR CLICKUP TASKS (Founders Kanban)

[WORKING]
- Get Setters Onboarded | urgent | you

[NEXT UP]
- Company LLM Reference | urgent | Alex
- View Datasource within Dashboard | urgent | Alex
- Follow up with 55 leads | urgent | Dilan

[REVIEW]
- Rawclaw V1 Demo Video | none | you, Dilan, Alex
- Have a branded working rawclaw v1 | urgent | Alex

[BACKLOG]
- Reply to high-intent Instagram DMs | none | you
- Create offer deck | urgent | you
- Follow up with MWNY | urgent | you
- Follow up with Brandon Marsh | none | you
... (all remaining)

Total: N tasks | N assigned to you
```

Only show tasks assigned to Chris (user ID 144069077) as "you". Still list others for context but flag them as team tasks.

---

## Step 3: Identify Actionable Tasks

Analyze each task assigned to Chris. Mark as ACTIONABLE if it falls into any of these categories:

- Following up with a person or company (DM, email, Slack)
- Replying to messages or DMs
- Sending any outreach
- Drafting or sending communications
- Any task that starts with "Reply", "Follow up", "Send", "Respond", "Message", "DM", "Email", "Reach out"

Mark as NON-ACTIONABLE (needs Chris) if it involves:
- Building or creating something (code, video, deck, database)
- Giving access or permissions
- Making decisions on pricing or products
- In-person or scheduled meetings

---

## Step 4: Draft Proposed Actions (One at a Time)

For each ACTIONABLE task, in priority order (urgent first, then high, then normal):

1. Look up the contact in Obsidian knowledge vault if available: grep -r "[contact name]" /Users/scanbot/BusinessOS/clients/
2. Check recent conversation history if relevant (Gmail via gmail skill, or Beeper for DMs)
3. Draft the EXACT message/email/action you will take -- full text, no placeholders
4. Present it like this:

```
TASK: Follow up with MWNY
STATUS: Backlog -> Next Up on approve
CHANNEL: Instagram DM / Email / Slack (pick the right one)

PROPOSED ACTION:
---
[Full draft of the message here. Real sentences. Specific. No placeholders.]
---

APPROVE or REJECT?
```

Wait for response before moving to the next actionable task.

---

## Step 5: Execute on APPROVE

When Chris replies APPROVE (or just "approve" / "yes" / "do it"):

1. Execute the action using the appropriate tool:
   - Instagram DM: use Beeper MCP (mcp__beeper_desktop_mcp__execute)
   - Email: invoke gmail skill
   - Slack: use Beeper MCP or slack integration

2. Immediately update the task status in ClickUp:
```bash
source ~/.zshrc
PROJECT_ROOT=$(git -C ~/BusinessOS rev-parse --show-toplevel 2>/dev/null || echo ~/BusinessOS)
source "$PROJECT_ROOT/.env"

# Status progression: backlog -> next up -> working -> review -> complete
curl -s -X PUT "https://api.clickup.com/api/v2/task/{TASK_ID}" \
  -H "Authorization: $CLICKUP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "NEXT_STATUS"}' 
```

Status progression map:
- backlog -> next up
- next up -> working
- working -> review
- review -> complete

3. Confirm: "Done. [Task name] moved to [new status]."

When Chris replies REJECT (or "no" / "skip"):
- Skip the task, do not update status
- Move to the next actionable task

---

## Step 6: Final Report

After all actionable tasks are processed:

```
Done. Here's what happened:

Executed (N):
- Follow up with MWNY -> sent DM, moved to Next Up
- Reply to Instagram DMs -> sent 3 replies, moved to Working

Skipped (N):
- Follow up with Brandon Marsh -> rejected

Needs you (N):
- Create offer deck (build task)
- Create free training video (build task)
```

Log to hive mind:
```bash
PROJECT_ROOT=$(git -C ~/BusinessOS rev-parse --show-toplevel 2>/dev/null || echo ~/BusinessOS)
CHAT_ID=$(sqlite3 "$PROJECT_ROOT/store/businessos.db" "SELECT chat_id FROM sessions LIMIT 1;")
sqlite3 "$PROJECT_ROOT/store/businessos.db" "INSERT INTO hive_mind (agent_id, chat_id, action, summary, artifacts, created_at) VALUES ('comms', '$CHAT_ID', 'clickup_run', 'Ran /clickup. Executed N actions, skipped N, N need Chris.', NULL, strftime('%s','now'));"
```

---

## Key IDs

| Thing | Value |
|-------|-------|
| Workspace | 90131458500 |
| Space | 901313716577 |
| Founders Kanban list | 901326628160 |
| Chris West user ID | 144069077 |
| API key env var | CLICKUP_API_KEY |
| API base | https://api.clickup.com/api/v2 |

## Status Labels

| Kanban column | API value |
|---------------|-----------|
| Backlog | backlog |
| Next Up | next up |
| Working | working |
| Review | review |
| Complete | complete |
| Cancelled | cancelled |

---

## Error Handling

| Problem | Solution |
|---------|----------|
| API returns 401 | Check CLICKUP_API_KEY in .env -- re-source ~/.zshrc |
| No tasks returned | Confirm assignees[] filter -- try without filter to check list |
| Status update fails | Log the task ID and error, continue to next task |
| Contact not found in Obsidian | Draft message based on task name context alone |
| Beeper DM fails | Fall back to drafting message and telling Chris to send manually |
