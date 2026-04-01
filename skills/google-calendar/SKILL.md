---
name: google-calendar
description: Create, list, update, and delete Google Calendar events. Book meetings, send invites, check availability. Triggers on "book a meeting", "schedule a call", "add to calendar", "check my calendar", "when am I free", "cancel the meeting".
user-invocable: true
---

# Google Calendar

**Flow:** Parse request -> Check auth -> Execute calendar action -> Confirm result

No pauses. Run end to end once triggered.

**Script:** `~/.claude/skills/google-calendar/scripts/gcal.py`
**Default calendar:** chris@[COMPANY_DOMAIN]
**Token:** ~/.config/gws/calendar_token.json
**Client secret:** ~/.config/gws/client_secret.json

Parse the user's message for:
- **action** (required) -- create, list, update, delete, or freebusy
- **title** (for create/update) -- event name
- **datetime** (for create/update) -- when (natural language ok, script parses it)
- **duration** (optional) -- in minutes, defaults to 60
- **attendees** (optional) -- comma-separated emails
- **description** (optional) -- event details
- **location** (optional) -- physical or virtual location
- **event_id** (for update/delete) -- Google Calendar event ID

---

## Step 0: Check Auth

```bash
python3 ~/.claude/skills/google-calendar/scripts/gcal.py list --days 1
```

If output contains "ERROR: No valid credentials", run auth flow:

```bash
python3 ~/.claude/skills/google-calendar/scripts/gcal.py auth
```

This opens a browser for Google OAuth. Tell user to sign in with chris@[COMPANY_DOMAIN] and authorize. Token saves automatically. Then retry the original action.

---

## Step 1: Create Event

When user wants to book, schedule, or add a meeting/call/event:

```bash
python3 ~/.claude/skills/google-calendar/scripts/gcal.py create \
  --title "EVENT TITLE" \
  --start "YYYY-MM-DD HH:MM PM" \
  --duration MINUTES \
  --attendees "email1@domain.com,email2@domain.com" \
  --description "Event details here" \
  --location "Zoom / address / etc"
```

- `--duration` defaults to 60 if not specified
- `--attendees` triggers automatic invite emails to all listed
- Add `--meet` flag to auto-generate a Google Meet link
- Times without timezone assume Pacific (America/Los_Angeles)

Report back: event title, date/time, attendees invited, calendar link.

---

## Step 2: List Events

When user asks what's on their calendar, upcoming meetings, schedule:

```bash
python3 ~/.claude/skills/google-calendar/scripts/gcal.py list --days N
```

Default: 7 days. Format results cleanly. Include event IDs (needed for update/delete).

---

## Step 3: Update Event

When user wants to reschedule, change attendees, update details:

```bash
python3 ~/.claude/skills/google-calendar/scripts/gcal.py update \
  --event-id "EVENT_ID" \
  --title "New title" \
  --start "New datetime" \
  --attendees "updated@emails.com"
```

Only pass the flags that need changing. Attendees get notified of changes.

If user doesn't provide event_id, list events first to find it.

---

## Step 4: Delete Event

When user wants to cancel a meeting:

```bash
python3 ~/.claude/skills/google-calendar/scripts/gcal.py delete --event-id "EVENT_ID"
```

Attendees get cancellation notice automatically.

If user doesn't provide event_id, list events first to find it.

---

## Step 5: Check Availability

When user asks "am I free", "when am I available", "any conflicts":

```bash
python3 ~/.claude/skills/google-calendar/scripts/gcal.py freebusy \
  --start "YYYY-MM-DD HH:MM" \
  --end "YYYY-MM-DD HH:MM"
```

Report back: available or busy with conflict times.

---

## Error Handling

| Problem | Solution |
|---------|----------|
| No valid credentials | Run `gcal.py auth` and have user sign in |
| Token expired | Script auto-refreshes. If it fails, re-run auth |
| Event not found | List events to find correct event_id |
| Permission denied | Verify calendar ID is correct (default: chris@[COMPANY_DOMAIN]) |
| python-dateutil missing | `pip3 install --break-system-packages python-dateutil pytz` |