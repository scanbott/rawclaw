---
name: comms
description: Scrapes all of Chris's inboxes (Slack, WhatsApp, Instagram DMs, Signal, Telegram via Matrix bridges), identifies every unanswered message, reports back grouped by platform, then drafts and sends replies on approval. Triggers on "/comms", "check my messages", "what have I missed", "inbox check", "reply to my messages".
user-invocable: true
---

# Comms Inbox Check

**Flow:** Pull Slack + Matrix rooms in parallel -> Filter unanswered -> Report -> Wait for GO -> Draft replies one by one -> SEND/SKIP -> Final report

Never send anything without Chris approving the draft first. Load brand voice before drafting.

---

## Key Config

| Thing | Value |
|-------|-------|
| Matrix homeserver | http://localhost:8008 |
| Matrix access token | [MATRIX_ACCESS_TOKEN] |
| Matrix bot user ID | [MATRIX_BOT_USER_ID] |
| Chris Slack user ID | [CEO_SLACK_USER_ID] |
| Alex Slack ID | [CTO_SLACK_USER_ID] |
| Dilan Slack ID | [COO_SLACK_USER_ID] |
| Slack token env vars | SLACK_USER_TOKEN (read), SLACK_BOT_TOKEN (send) |
| Brand voice file | ~/knowledge/agents/chris-voice-profile.md |

---

## Step 1: Pull Slack Unanswered DMs

```bash
source ~/.zshrc
PROJECT_ROOT=$(git -C ~/BusinessOS rev-parse --show-toplevel 2>/dev/null || echo ~/BusinessOS)
source "$PROJECT_ROOT/.env"
python3 "$PROJECT_ROOT/.claude/skills/comms/scripts/slack-unread.py"
```

Stores a JSON array of unanswered Slack DMs. Each item has: platform, channel_id, contact, last_message, ts, age_hours, context.

---

## Step 2: Pull Matrix Rooms (WhatsApp, Instagram, Signal, Telegram, iMessage)

Use direct Matrix API via curl. The bot user ([MATRIX_BOT_USER_ID]) is already joined to bridged rooms.

```bash
MATRIX_URL="http://localhost:8008"
MATRIX_TOKEN="[MATRIX_ACCESS_TOKEN]"
CUTOFF_TS=$(python3 -c "import time; print(int((time.time() - 14*86400)*1000))")

# Step 2a: Get all joined rooms
ROOMS=$(curl -s "$MATRIX_URL/_matrix/client/v3/joined_rooms" \
  -H "Authorization: Bearer $MATRIX_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(json.dumps(d.get('joined_rooms', [])))
")

# Step 2b: For each room, get last message and check if unanswered
python3 << 'EOF'
import json, urllib.request, time

URL = "http://localhost:8008"
TOKEN = "[MATRIX_ACCESS_TOKEN]"
BOT_ID = "[MATRIX_BOT_USER_ID]"
CUTOFF = int((time.time() - 14 * 86400) * 1000)

def api(path):
    req = urllib.request.Request(f"{URL}{path}", headers={"Authorization": f"Bearer {TOKEN}"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=5).read())
    except Exception as e:
        return {"error": str(e)}

rooms = api("/_matrix/client/v3/joined_rooms").get("joined_rooms", [])
unanswered = []

for room_id in rooms:
    # Get room name/state
    state = api(f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/state")
    if isinstance(state, dict) and "error" in state:
        continue

    room_name = room_id
    bridge_type = "matrix"
    for event in (state if isinstance(state, list) else []):
        if event.get("type") == "m.room.name":
            room_name = event.get("content", {}).get("name", room_id)
        if event.get("type") == "m.room.member" and event.get("state_key",""):
            sk = event["state_key"]
            if sk.startswith("@whatsappbot:"): bridge_type = "whatsapp"
            elif sk.startswith("@instagrambot:"): bridge_type = "instagram"
            elif sk.startswith("@signalbot:"): bridge_type = "signal"
            elif sk.startswith("@telegrambot:"): bridge_type = "telegram"
            elif sk.startswith("@imessagebot:"): bridge_type = "imessage"

    # Skip non-bridged rooms (internal Matrix rooms)
    if bridge_type == "matrix":
        continue

    # Get last 10 messages
    import urllib.parse
    params = urllib.parse.urlencode({"dir": "b", "limit": "10"})
    msgs_data = api(f"/_matrix/client/v3/rooms/{urllib.parse.quote(room_id)}/messages?{params}")
    messages = msgs_data.get("chunk", [])
    if not messages:
        continue

    # Find last real message (not state events)
    last = next((m for m in messages if m.get("type") == "m.room.message"), None)
    if not last:
        continue

    # Skip if bot/Chris sent the last message
    if last.get("sender") == BOT_ID:
        continue

    # Skip if older than 14 days
    if last.get("origin_server_ts", 0) < CUTOFF:
        continue

    # Build context
    context = []
    for m in reversed([m for m in messages if m.get("type") == "m.room.message"][:5]):
        sender = "Chris" if m.get("sender") == BOT_ID else room_name
        context.append({"sender": sender, "text": m.get("content", {}).get("body", "")[:200], "ts": m.get("origin_server_ts")})

    age_hours = round((time.time() - last["origin_server_ts"] / 1000) / 3600, 1)

    unanswered.append({
        "platform": bridge_type,
        "room_id": room_id,
        "contact": room_name,
        "last_message": last.get("content", {}).get("body", "")[:150],
        "age_hours": age_hours,
        "context": context
    })

print(json.dumps(unanswered, indent=2))
EOF
```

Store as Matrix unanswered list.

---

## Step 3: Report All Unanswered

Merge Slack list and Matrix list. Sort by age (oldest unanswered first within each platform).

Present:

```
UNANSWERED MESSAGES -- [Today's date]

SLACK (N)
- [Name]: "[preview...]" -- X hours/days ago

WHATSAPP (N)
- [Name]: "[preview...]" -- X hours ago

INSTAGRAM DMs (N)
- [Name]: "[preview...]" -- X days ago

SIGNAL (N)
- [Name]: "[preview...]" -- X hours ago

TELEGRAM (N)
- [Name]: "[preview...]" -- X hours ago

Total: N unanswered.

Say GO to draft replies for all of them.
```

If Matrix homeserver is unreachable, note "Matrix offline -- WhatsApp/Instagram/Signal unavailable" and continue with Slack only.

Stop here. Wait for GO (or "yes", "draft them", "do it", "reply to all").

---

## Step 4: Draft Replies (One at a Time)

Load brand voice: read ~/knowledge/agents/chris-voice-profile.md

For each unanswered message in order:

1. Read the full context array (all messages in the conversation)
2. Classify the conversation:
   - Sales/prospect: pitch toward next step (booking a call)
   - Team (Alex/Dilan): direct and actionable
   - Client: warm, focused on their outcome
   - Cold outreach/unknown: friendly, peer-to-peer, short
3. Draft a reply in Chris's voice:
   - Short sentences. Real. No fluff. Contractions always.
   - No em dashes. No filler words. No corporate polish.
   - Peer-to-peer energy regardless of who they are.
4. Present:

```
[PLATFORM] -- [Name]
CONTEXT: [1-line summary of what they said/asked]

DRAFT:
---
[Full reply text -- ready to send]
---

SEND or SKIP?
```

Wait for SEND/SKIP before next.

---

## Step 5: Execute Sends

**Slack send:**
```bash
source ~/.zshrc
PROJECT_ROOT=$(git -C ~/BusinessOS rev-parse --show-toplevel 2>/dev/null || echo ~/BusinessOS)
source "$PROJECT_ROOT/.env"

curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channel": "CHANNEL_ID", "text": "MESSAGE_TEXT"}'
```

**Matrix send (WhatsApp/Instagram/Signal/Telegram):**
```bash
MATRIX_URL="http://localhost:8008"
MATRIX_TOKEN="[MATRIX_ACCESS_TOKEN]"
TXN_ID="mcp_$(date +%s)_$$"
ROOM_ID="ROOM_ID_HERE"
MSG="MESSAGE_TEXT_HERE"

curl -s -X PUT \
  "$MATRIX_URL/_matrix/client/v3/rooms/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$ROOM_ID'))")/send/m.room.message/$TXN_ID" \
  -H "Authorization: Bearer $MATRIX_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{"msgtype": "m.text", "body": "$MSG"}"
```

Confirm: "Sent to [Name] on [Platform]." then move to next draft.

---

## Step 6: Final Report + Log

```
Done.
Sent (N): [Name/Platform list]
Skipped (N): [Name/Platform list]
```

```bash
PROJECT_ROOT=$(git -C ~/BusinessOS rev-parse --show-toplevel 2>/dev/null || echo ~/BusinessOS)
CHAT_ID=$(sqlite3 "$PROJECT_ROOT/store/businessos.db" "SELECT chat_id FROM sessions LIMIT 1;")
sqlite3 "$PROJECT_ROOT/store/businessos.db" "INSERT INTO hive_mind (agent_id, chat_id, action, summary, artifacts, created_at) VALUES ('comms', '$CHAT_ID', 'comms_run', 'Ran /comms. Sent N replies across Slack/Matrix bridges. Skipped N.', NULL, strftime('%s','now'));"
```

---

## Error Handling

| Problem | Solution |
|---------|----------|
| Matrix homeserver unreachable | Note offline, run Slack only |
| Room has no bridge type | Skip it (internal Matrix room, not a real convo) |
| Matrix send fails | Surface the error, ask Chris to retry manually |
| Slack token error | Check SLACK_USER_TOKEN in .env |
| Draft seems off-tone | Re-read ~/knowledge/agents/chris-voice-profile.md and redraft |
