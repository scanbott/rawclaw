#!/usr/bin/env python3
"""
Signal Scan Data Puller
Pulls all business data from Supabase for cross-domain pattern analysis.
Outputs JSON files to /tmp/signal-scan-*.json
"""

import os
import json
import urllib.request
import sys

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}


def fetch_table(table, select='*', order=None, limit=None):
    """Fetch data from a Supabase table via REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"
    if order:
        url += f"&order={order}"
    if limit:
        url += f"&limit={limit}"

    req = urllib.request.Request(url, headers=HEADERS)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except Exception as e:
        print(f"WARNING: Could not fetch {table}: {e}", file=sys.stderr)
        return []


def main():
    datasets = {
        'calls': fetch_table(
            'sales_calls',
            'id,title,prospect_name,meeting_date,summary,objections,pain_points,outcome,notes',
            'meeting_date.desc'
        ),
        'revenue': fetch_table(
            'revenue',
            'customer_name,customer_email,company,amount,type,description,source,utm_source,status,is_recurring,mrr_contribution,churned_at,churn_reason,transaction_date',
            'transaction_date.desc'
        ),
        'deliverables': fetch_table(
            'deliverables',
            'id,title,type,agent,status,tags,created_at',
            'created_at.desc'
        ),
        'content': fetch_table(
            'content_pipeline',
            '*',
            'created_at.desc'
        ),
        'previous_patterns': fetch_table(
            'patterns',
            '*',
            'last_confirmed.desc'
        )
    }

    # Write each dataset
    for name, data in datasets.items():
        outpath = f"/tmp/signal-scan-{name}.json"
        with open(outpath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        print(f"  {name}: {len(data)} records -> {outpath}")

    # Summary
    print(f"\nData pull complete:")
    print(f"  Sales calls:  {len(datasets['calls'])}")
    print(f"  Revenue:      {len(datasets['revenue'])}")
    print(f"  Deliverables: {len(datasets['deliverables'])}")
    print(f"  Content:      {len(datasets['content'])}")
    print(f"  Prev patterns: {len(datasets['previous_patterns'])}")


if __name__ == '__main__':
    main()
