#!/usr/bin/env python3
"""
Store or update a pattern in Supabase.

Usage:
  # New pattern
  python3 store-pattern.py new \
    --type correlation \
    --domain "sales+revenue" \
    --title "Pattern title" \
    --description "Detailed description" \
    --evidence '[{"source":"sales_calls","detail":"specific evidence"}]' \
    --confidence 0.5 \
    --tags "sales,revenue" \
    --actionable true \
    --impact 0.7 \
    --scan-id "scan-20260313-0900"

  # Confirm existing pattern
  python3 store-pattern.py confirm \
    --id "uuid-of-existing-pattern" \
    --scan-id "scan-20260313-0900"

  # Invalidate pattern
  python3 store-pattern.py invalidate \
    --id "uuid-of-existing-pattern" \
    --reason "New evidence contradicts this"
"""

import os
import json
import urllib.request
import argparse
import sys
import datetime

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}


def supabase_post(data):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/patterns",
        data=json.dumps(data).encode(),
        headers=HEADERS,
        method='POST'
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())


def supabase_patch(pattern_id, data):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/patterns?id=eq.{pattern_id}",
        data=json.dumps(data).encode(),
        headers=HEADERS,
        method='PATCH'
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())


def supabase_get(pattern_id):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/patterns?id=eq.{pattern_id}&select=*",
        headers=HEADERS
    )
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    return data[0] if data else None


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='action')

    # New pattern
    new_p = sub.add_parser('new')
    new_p.add_argument('--type', required=True, choices=['correlation', 'trend', 'anomaly', 'gap', 'shift'])
    new_p.add_argument('--domain', required=True)
    new_p.add_argument('--title', required=True)
    new_p.add_argument('--description', required=True)
    new_p.add_argument('--evidence', default='[]')
    new_p.add_argument('--confidence', type=float, default=0.5)
    new_p.add_argument('--tags', default='')
    new_p.add_argument('--actionable', default='false')
    new_p.add_argument('--impact', type=float, default=0.5)
    new_p.add_argument('--scan-id', required=True)

    # Confirm pattern
    conf_p = sub.add_parser('confirm')
    conf_p.add_argument('--id', required=True)
    conf_p.add_argument('--scan-id', required=True)

    # Invalidate pattern
    inv_p = sub.add_parser('invalidate')
    inv_p.add_argument('--id', required=True)
    inv_p.add_argument('--reason', default='')

    args = parser.parse_args()

    if args.action == 'new':
        tags_list = [t.strip() for t in args.tags.split(',') if t.strip()]
        result = supabase_post({
            'pattern_type': args.type,
            'domain': args.domain,
            'title': args.title,
            'description': args.description,
            'evidence': json.loads(args.evidence) if isinstance(args.evidence, str) else args.evidence,
            'confidence': args.confidence,
            'status': 'new',
            'scan_id': args.scan_id,
            'tags': tags_list,
            'actionable': args.actionable.lower() == 'true',
            'impact_score': args.impact
        })
        print(f"Stored new pattern: {args.title}")
        print(f"  ID: {result[0]['id'] if result else 'unknown'}")

    elif args.action == 'confirm':
        existing = supabase_get(args.id)
        if not existing:
            print(f"ERROR: Pattern {args.id} not found", file=sys.stderr)
            sys.exit(1)

        new_conf = min((existing.get('confidence', 0.5) + 0.1), 1.0)
        new_count = (existing.get('times_confirmed', 1) + 1)

        result = supabase_patch(args.id, {
            'confidence': new_conf,
            'times_confirmed': new_count,
            'last_confirmed': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'status': 'confirmed',
            'scan_id': args.scan_id
        })
        print(f"Confirmed pattern: {existing['title']}")
        print(f"  Confidence: {existing.get('confidence', 0.5)} -> {new_conf}")
        print(f"  Times confirmed: {new_count}")

    elif args.action == 'invalidate':
        existing = supabase_get(args.id)
        if not existing:
            print(f"ERROR: Pattern {args.id} not found", file=sys.stderr)
            sys.exit(1)

        result = supabase_patch(args.id, {
            'status': 'invalidated',
            'action_taken': f"Invalidated: {args.reason}",
            'updated_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
        })
        print(f"Invalidated pattern: {existing['title']}")
        print(f"  Reason: {args.reason}")

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
