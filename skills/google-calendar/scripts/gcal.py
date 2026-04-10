#!/usr/bin/env python3
"""Google Calendar CLI for BusinessOS agents.

Usage:
  gcal.py auth                                          # Run OAuth flow
  gcal.py create --title "..." --start "..." [options]  # Create event
  gcal.py list [--days N]                               # List upcoming events
  gcal.py update --event-id "..." [options]             # Update event
  gcal.py delete --event-id "..."                       # Delete event
  gcal.py freebusy --start "..." --end "..."            # Check availability
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone

TOKEN_PATH = os.path.expanduser("~/.config/gws/calendar_token.json")
CREDS_PATH = os.path.expanduser("~/.config/gws/client_secret.json")
SCOPES = ["https://www.googleapis.com/auth/calendar"]
DEFAULT_CALENDAR = "chris@rawgrowth.ai"


def get_credentials():
    """Load or refresh OAuth credentials."""
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
    except ImportError:
        print("ERROR: google-auth not installed. Run: pip3 install google-auth google-auth-oauthlib google-api-python-client")
        sys.exit(1)

    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_PATH, "w") as f:
                f.write(creds.to_json())
        else:
            print("ERROR: No valid credentials. Run: gcal.py auth")
            sys.exit(1)

    return creds


def run_auth(args=None):
    """Run the OAuth2 flow and save token."""
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("ERROR: google-auth-oauthlib not installed. Run: pip3 install google-auth-oauthlib")
        sys.exit(1)

    # Read client config and fill in missing Google OAuth endpoints
    import json as _json
    with open(CREDS_PATH) as f:
        client_config = _json.load(f)

    if "installed" in client_config:
        client_config["installed"].setdefault("auth_uri", "https://accounts.google.com/o/oauth2/auth")
        client_config["installed"].setdefault("token_uri", "https://oauth2.googleapis.com/token")

    # Manual OAuth flow with custom redirect handler to avoid port mismatch
    from google_auth_oauthlib.flow import Flow
    import http.server
    import urllib.parse
    import webbrowser

    REDIR_PORT = 8100
    flow = Flow.from_client_config(
        client_config, SCOPES,
        redirect_uri=f"http://localhost:{REDIR_PORT}"
    )
    auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")

    auth_code = [None]

    class _Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            if "code" in params:
                auth_code[0] = params["code"][0]
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(b"<h2>Authentication successful! You can close this tab.</h2>")
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Authentication failed.")
        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("localhost", REDIR_PORT), _Handler)
    srv.timeout = 120

    webbrowser.open(auth_url)
    print(f"Browser opened. Waiting for authorization...")
    print(f"If browser didn't open, visit:\n{auth_url}")

    srv.handle_request()
    srv.server_close()

    if not auth_code[0]:
        print("ERROR: No authorization code received.")
        sys.exit(1)

    flow.fetch_token(code=auth_code[0])
    creds = flow.credentials

    os.makedirs(os.path.dirname(TOKEN_PATH), exist_ok=True)
    with open(TOKEN_PATH, "w") as f:
        f.write(creds.to_json())

    print(f"AUTH_SUCCESS: Token saved to {TOKEN_PATH}")
    print(f"Account authenticated. Calendar skill is ready.")


def get_service():
    """Build the Calendar API service."""
    from googleapiclient.discovery import build
    return build("calendar", "v3", credentials=get_credentials())


def parse_datetime(dt_str):
    """Parse flexible datetime string into ISO format with timezone."""
    from dateutil import parser as dtparser
    import pytz

    try:
        dt = dtparser.parse(dt_str)
    except Exception:
        print(f"ERROR: Could not parse datetime: {dt_str}")
        sys.exit(1)

    # If no timezone, assume Pacific
    if dt.tzinfo is None:
        pacific = pytz.timezone("America/Los_Angeles")
        dt = pacific.localize(dt)

    return dt.isoformat()


def create_event(args):
    """Create a calendar event."""
    service = get_service()

    start_dt = parse_datetime(args.start)

    if args.end:
        end_dt = parse_datetime(args.end)
    elif args.duration:
        from dateutil import parser as dtparser
        start_parsed = dtparser.parse(start_dt)
        end_parsed = start_parsed + timedelta(minutes=int(args.duration))
        end_dt = end_parsed.isoformat()
    else:
        from dateutil import parser as dtparser
        start_parsed = dtparser.parse(start_dt)
        end_parsed = start_parsed + timedelta(hours=1)
        end_dt = end_parsed.isoformat()

    event_body = {
        "summary": args.title,
        "start": {"dateTime": start_dt, "timeZone": "America/Los_Angeles"},
        "end": {"dateTime": end_dt, "timeZone": "America/Los_Angeles"},
    }

    if args.description:
        event_body["description"] = args.description
    if args.location:
        event_body["location"] = args.location

    if args.attendees:
        attendees = []
        for email in args.attendees.split(","):
            email = email.strip()
            if email:
                attendees.append({"email": email})
        event_body["attendees"] = attendees

    # conferenceData for Google Meet if requested
    if args.meet:
        event_body["conferenceData"] = {
            "createRequest": {
                "requestId": f"meet-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        }

    calendar_id = args.calendar or DEFAULT_CALENDAR
    event = service.events().insert(
        calendarId=calendar_id,
        body=event_body,
        sendUpdates="all" if args.attendees else "none",
        conferenceDataVersion=1 if args.meet else 0,
    ).execute()

    print(f"EVENT_CREATED: {event['id']}")
    print(f"Title: {event.get('summary')}")
    print(f"Start: {event['start'].get('dateTime', event['start'].get('date'))}")
    print(f"End: {event['end'].get('dateTime', event['end'].get('date'))}")
    print(f"Link: {event.get('htmlLink')}")
    if event.get("hangoutLink"):
        print(f"Meet: {event['hangoutLink']}")
    if event.get("attendees"):
        for a in event["attendees"]:
            print(f"Attendee: {a['email']} ({a.get('responseStatus', 'invited')})")


def list_events(args):
    """List upcoming events."""
    service = get_service()
    calendar_id = args.calendar or DEFAULT_CALENDAR
    days = int(args.days) if args.days else 7

    now = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()

    events_result = service.events().list(
        calendarId=calendar_id,
        timeMin=now,
        timeMax=end,
        maxResults=50,
        singleEvents=True,
        orderBy="startTime",
    ).execute()

    events = events_result.get("items", [])
    if not events:
        print(f"No events in the next {days} days.")
        return

    print(f"Events for next {days} days ({len(events)} found):\n")
    for event in events:
        start = event["start"].get("dateTime", event["start"].get("date"))
        summary = event.get("summary", "(no title)")
        event_id = event["id"]
        attendees = [a["email"] for a in event.get("attendees", [])]
        attendee_str = f" | Attendees: {', '.join(attendees)}" if attendees else ""
        print(f"  [{event_id}] {start} -- {summary}{attendee_str}")


def update_event(args):
    """Update an existing event."""
    service = get_service()
    calendar_id = args.calendar or DEFAULT_CALENDAR

    event = service.events().get(calendarId=calendar_id, eventId=args.event_id).execute()

    if args.title:
        event["summary"] = args.title
    if args.description:
        event["description"] = args.description
    if args.location:
        event["location"] = args.location
    if args.start:
        event["start"] = {"dateTime": parse_datetime(args.start), "timeZone": "America/Los_Angeles"}
    if args.end:
        event["end"] = {"dateTime": parse_datetime(args.end), "timeZone": "America/Los_Angeles"}
    if args.attendees:
        attendees = [{"email": e.strip()} for e in args.attendees.split(",") if e.strip()]
        event["attendees"] = attendees

    updated = service.events().update(
        calendarId=calendar_id,
        eventId=args.event_id,
        body=event,
        sendUpdates="all",
    ).execute()

    print(f"EVENT_UPDATED: {updated['id']}")
    print(f"Title: {updated.get('summary')}")
    print(f"Link: {updated.get('htmlLink')}")


def delete_event(args):
    """Delete/cancel an event."""
    service = get_service()
    calendar_id = args.calendar or DEFAULT_CALENDAR

    service.events().delete(
        calendarId=calendar_id,
        eventId=args.event_id,
        sendUpdates="all",
    ).execute()

    print(f"EVENT_DELETED: {args.event_id}")


def freebusy(args):
    """Check free/busy for a time range."""
    service = get_service()
    calendar_id = args.calendar or DEFAULT_CALENDAR

    body = {
        "timeMin": parse_datetime(args.start),
        "timeMax": parse_datetime(args.end),
        "items": [{"id": calendar_id}],
    }

    result = service.freebusy().query(body=body).execute()
    busy = result["calendars"][calendar_id]["busy"]

    if not busy:
        print("AVAILABLE: No conflicts in the requested time range.")
    else:
        print(f"BUSY: {len(busy)} conflict(s) found:")
        for slot in busy:
            print(f"  {slot['start']} to {slot['end']}")


def main():
    parser = argparse.ArgumentParser(description="Google Calendar CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # auth
    subparsers.add_parser("auth", help="Run OAuth flow")

    # create
    p_create = subparsers.add_parser("create", help="Create event")
    p_create.add_argument("--title", required=True)
    p_create.add_argument("--start", required=True, help="Start datetime (e.g. '2026-04-08 1:00 PM')")
    p_create.add_argument("--end", help="End datetime")
    p_create.add_argument("--duration", help="Duration in minutes (default: 60)")
    p_create.add_argument("--description", help="Event description")
    p_create.add_argument("--location", help="Event location")
    p_create.add_argument("--attendees", help="Comma-separated email addresses")
    p_create.add_argument("--calendar", help=f"Calendar ID (default: {DEFAULT_CALENDAR})")
    p_create.add_argument("--meet", action="store_true", help="Add Google Meet link")

    # list
    p_list = subparsers.add_parser("list", help="List upcoming events")
    p_list.add_argument("--days", default="7", help="Days ahead to look (default: 7)")
    p_list.add_argument("--calendar", help=f"Calendar ID (default: {DEFAULT_CALENDAR})")

    # update
    p_update = subparsers.add_parser("update", help="Update event")
    p_update.add_argument("--event-id", required=True)
    p_update.add_argument("--title")
    p_update.add_argument("--start")
    p_update.add_argument("--end")
    p_update.add_argument("--description")
    p_update.add_argument("--location")
    p_update.add_argument("--attendees")
    p_update.add_argument("--calendar", help=f"Calendar ID (default: {DEFAULT_CALENDAR})")

    # delete
    p_delete = subparsers.add_parser("delete", help="Delete event")
    p_delete.add_argument("--event-id", required=True)
    p_delete.add_argument("--calendar", help=f"Calendar ID (default: {DEFAULT_CALENDAR})")

    # freebusy
    p_free = subparsers.add_parser("freebusy", help="Check availability")
    p_free.add_argument("--start", required=True)
    p_free.add_argument("--end", required=True)
    p_free.add_argument("--calendar", help=f"Calendar ID (default: {DEFAULT_CALENDAR})")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "auth": run_auth,
        "create": create_event,
        "list": list_events,
        "update": update_event,
        "delete": delete_event,
        "freebusy": freebusy,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()