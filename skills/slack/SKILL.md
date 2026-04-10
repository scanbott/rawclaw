---
name: slack
description: Manage Slack from Claude Code. List conversations, read messages, send replies, search for channels and DMs. Also handles incoming Slack events (mentions, DMs).
allowed-tools: Bash(cd * && node dist/slack-cli.js *)
---

# Slack Skill

## Purpose

Interact with the Rawgrowth Slack workspace using natural language. Also receives and responds to incoming messages via the Events API.

## Auth

Uses `SLACK_BOT_TOKEN` (xoxb-) from `.env`. Falls back to `SLACK_USER_TOKEN` (xoxp-) for backward compat.

Bot identity: **biggy** in the Rawgrowth workspace (rawgrowthworkspace.slack.com).

## Incoming Messages (Events API)

Slack sends webhooks to `dashboard.rawgrowth.ai/slack/events` when:
- Someone @mentions Biggy in a channel
- Someone DMs Biggy directly

The message routes through the full agent pipeline (memory, context, agent execution) and replies in the same Slack thread.

**Slack app config required:**
1. Event Subscriptions > Enable > Request URL: `https://dashboard.rawgrowth.ai/slack/events?token=DASHBOARD_TOKEN`
2. Subscribe to bot events: `app_mention`, `message.im`
3. App Home > Messages Tab enabled + "Allow users to send messages"

## Outbound Commands (CLI)

The CLI lives at the BusinessOS project root:

```bash
cd /path/to/businessos && node dist/slack-cli.js <command>
```

### List conversations (with unread counts)

```bash
cd /path/to/businessos && node dist/slack-cli.js list
cd /path/to/businessos && node dist/slack-cli.js list --limit 10
```

Returns JSON array sorted by unread count then recency. Each object: `id`, `name`, `isIm`, `unreadCount`, `lastMessage`, `lastMessageTs`.

### Read messages from a conversation

```bash
cd /path/to/businessos && node dist/slack-cli.js read <channel_id>
cd /path/to/businessos && node dist/slack-cli.js read <channel_id> --limit 30
```

Returns JSON array of messages (oldest first): `text`, `userName`, `fromMe`, `ts`, `threadTs`.

### Send a message

```bash
cd /path/to/businessos && node dist/slack-cli.js send <channel_id> "message text"
cd /path/to/businessos && node dist/slack-cli.js send <channel_id> "reply text" --thread-ts 1234567890.123456
```

### Search conversations by name

```bash
cd /path/to/businessos && node dist/slack-cli.js search "jane"
cd /path/to/businessos && node dist/slack-cli.js search "general"
```

Fuzzy matches against conversation names. Use this to find channel IDs.

## Workflow

1. **"Check my slack"** -> Run `list` to show conversations with unread counts
2. **"Read my DMs with Jane"** -> Run `search "jane"` to find the channel ID, then `read <id>`
3. **"Message Jane on Slack saying hey"** -> Run `search "jane"` to find the channel ID, draft the message, show the user for confirmation, then `send <id> "hey"`
4. **"What's new in #general"** -> Run `search "general"` to find the channel ID, then `read <id>`

## Drafting Rules

- ALWAYS draft the message and show it to the user before sending
- Never send without confirmation
- If the user gives exact phrasing, use it verbatim
