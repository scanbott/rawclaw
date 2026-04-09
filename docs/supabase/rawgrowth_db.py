#!/usr/bin/env python3
"""
rawgrowth_db.py — CLI for Rawgrowth internal company database on Supabase.

Usage:
    python rawgrowth_db.py dashboard          # Overview: MRR, clients, pipeline
    python rawgrowth_db.py clients            # List all clients
    python rawgrowth_db.py pipeline           # List pipeline deals
    python rawgrowth_db.py revenue            # Revenue breakdown
    python rawgrowth_db.py team               # Team and assignments
    python rawgrowth_db.py seed               # Run seed data (003_rawgrowth_seed.sql)
    python rawgrowth_db.py migrate            # Run all migrations (001, 002, 003)

    python rawgrowth_db.py add-client --name "Acme" --industry "saas" --status lead
    python rawgrowth_db.py add-deal --lead "John Doe" --stage hot --value 50000 --assigned "Chris West"
    python rawgrowth_db.py add-revenue --client "Dineline" --month 2026-05-01 --type retainer --amount 10000
    python rawgrowth_db.py update-deal --id <uuid> --stage closed_won
    python rawgrowth_db.py log-metric --name total_mrr --value 10000 --week 2026-03-31

Requires: pip install supabase python-dotenv
Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from master .env)
"""

import argparse
import json
import os
import sys
from datetime import date, datetime
from pathlib import Path

from dotenv import load_dotenv

# Load master .env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fmt_money(amount, currency="USD"):
    if amount is None:
        return "—"
    sym = "$" if currency == "USD" else "€" if currency == "EUR" else currency + " "
    return f"{sym}{amount:,.2f}"


def fmt_date(d):
    if d is None:
        return "—"
    if isinstance(d, str):
        return d[:10]
    return d.strftime("%Y-%m-%d")


def print_table(headers, rows, widths=None):
    """Simple ASCII table printer."""
    if not widths:
        widths = [max(len(str(h)), max((len(str(r[i])) for r in rows), default=4)) for i, h in enumerate(headers)]
        widths = [min(w, 40) for w in widths]
    header_line = " | ".join(str(h).ljust(w) for h, w in zip(headers, widths))
    sep_line = "-+-".join("-" * w for w in widths)
    print(header_line)
    print(sep_line)
    for row in rows:
        print(" | ".join(str(row[i])[:w].ljust(w) for i, w in enumerate(widths)))


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_dashboard():
    """Show company overview: MRR, clients, pipeline summary."""
    print("\n=== RAWGROWTH DASHBOARD ===\n")

    # Active clients
    clients = sb.table("rg_clients").select("*").eq("status", "active").execute()
    active_count = len(clients.data)

    # MRR from latest metrics
    mrr_data = sb.table("rg_metrics").select("*").eq("metric_name", "total_mrr").order("week_start", desc=True).limit(1).execute()
    mrr = mrr_data.data[0]["metric_value"] if mrr_data.data else 0

    # Pipeline
    pipeline = sb.table("rg_pipeline").select("*").execute()
    hot_deals = [d for d in pipeline.data if d["stage"] in ("hot", "demo_scheduled")]
    warm_deals = [d for d in pipeline.data if d["stage"] == "warm"]
    total_pipeline_value = sum(d.get("deal_value") or 0 for d in pipeline.data)

    # Revenue
    revenue = sb.table("rg_revenue").select("*").eq("status", "paid").execute()
    total_collected = sum(r["amount"] for r in revenue.data)
    pending = sb.table("rg_revenue").select("*").eq("status", "invoiced").execute()
    total_pending = sum(r["amount"] for r in pending.data)

    # Team
    team = sb.table("rg_team").select("*").eq("status", "active").execute()

    print(f"  Active Clients:     {active_count}")
    print(f"  Monthly MRR:        {fmt_money(mrr)}")
    print(f"  Revenue Collected:  {fmt_money(total_collected)}")
    print(f"  Revenue Pending:    {fmt_money(total_pending)}")
    print(f"  Pipeline Value:     {fmt_money(total_pipeline_value)}")
    print(f"  Hot Deals:          {len(hot_deals)}")
    print(f"  Warm Deals:         {len(warm_deals)}")
    print(f"  Team Members:       {len(team.data)}")

    if hot_deals:
        print("\n--- Hot Deals ---")
        for d in hot_deals:
            val = fmt_money(d.get("deal_value"))
            print(f"  {d['lead_name']}: {val} — {d.get('next_step', '—')}")

    print()


def cmd_clients():
    """List all clients."""
    data = sb.table("rg_clients").select("*").order("created_at", desc=True).execute()
    if not data.data:
        print("No clients found.")
        return

    print(f"\n=== CLIENTS ({len(data.data)}) ===\n")
    headers = ["Name", "Status", "Industry", "Contract", "Setup", "Monthly", "Seats", "Start"]
    rows = []
    for c in data.data:
        rows.append([
            c["name"],
            c["status"],
            c.get("industry") or "—",
            c.get("contract_type") or "—",
            fmt_money(c.get("setup_fee")),
            fmt_money(c.get("monthly_retainer")),
            c.get("seats_count") or 0,
            fmt_date(c.get("start_date")),
        ])
    print_table(headers, rows)
    print()


def cmd_pipeline():
    """List pipeline deals."""
    data = sb.table("rg_pipeline").select("*").order("created_at", desc=True).execute()
    if not data.data:
        print("No pipeline deals found.")
        return

    print(f"\n=== PIPELINE ({len(data.data)} deals) ===\n")

    # Group by stage
    stages = ["hot", "demo_scheduled", "warm", "cold", "proposal_sent", "negotiation", "closed_won", "closed_lost"]
    for stage in stages:
        deals = [d for d in data.data if d["stage"] == stage]
        if not deals:
            continue
        print(f"  [{stage.upper().replace('_', ' ')}] ({len(deals)})")
        for d in deals:
            val = fmt_money(d.get("deal_value")) if d.get("deal_value") else ""
            assigned = d.get("assigned_to") or "Unassigned"
            next_s = d.get("next_step") or ""
            print(f"    - {d['lead_name']} {val} (-> {assigned})")
            if next_s:
                print(f"      Next: {next_s}")
        print()


def cmd_revenue():
    """Revenue breakdown by month."""
    data = sb.table("rg_revenue").select("*, rg_clients(name)").order("month", desc=True).execute()
    if not data.data:
        print("No revenue records found.")
        return

    print(f"\n=== REVENUE ({len(data.data)} records) ===\n")
    headers = ["Month", "Client", "Type", "Amount", "Status"]
    rows = []
    total = 0
    for r in data.data:
        client_name = r.get("rg_clients", {}).get("name", "—") if r.get("rg_clients") else "—"
        rows.append([
            fmt_date(r["month"]),
            client_name,
            r["type"],
            fmt_money(r["amount"], r.get("currency", "USD")),
            r["status"],
        ])
        total += r["amount"]
    print_table(headers, rows)
    print(f"\n  Total: {fmt_money(total)}\n")


def cmd_team():
    """List team members and their assignments."""
    team = sb.table("rg_team").select("*").order("name").execute()
    assignments = sb.table("rg_team_assignments").select("*, rg_team(name), rg_clients(name)").execute()

    if not team.data:
        print("No team members found.")
        return

    print(f"\n=== TEAM ({len(team.data)} members) ===\n")
    for m in team.data:
        member_assignments = [a for a in assignments.data if a["team_member_id"] == m["id"]]
        status_icon = "+" if m["status"] == "active" else "-"
        print(f"  [{status_icon}] {m['name']} — {m['role']} ({m.get('timezone', '—')})")
        print(f"      Email: {m.get('email', '—')} | Capacity: {m.get('weekly_capacity_hours', '—')}h/wk")
        if member_assignments:
            for a in member_assignments:
                client_name = a.get("rg_clients", {}).get("name", "—") if a.get("rg_clients") else "—"
                print(f"      -> {client_name}: {a['role_on_project']} ({a.get('hours_allocated_weekly', 0)}h/wk)")
        print()


def cmd_add_client(args):
    """Add a new client."""
    record = {"name": args.name, "status": args.status or "lead"}
    if args.industry:
        record["industry"] = args.industry
    if args.setup_fee:
        record["setup_fee"] = float(args.setup_fee)
    if args.retainer:
        record["monthly_retainer"] = float(args.retainer)

    result = sb.table("rg_clients").insert(record).execute()
    print(f"Created client: {result.data[0]['name']} (id: {result.data[0]['id']})")


def cmd_add_deal(args):
    """Add a pipeline deal."""
    record = {
        "lead_name": args.lead,
        "stage": args.stage or "warm",
    }
    if args.company:
        record["company_name"] = args.company
    if args.value:
        record["deal_value"] = float(args.value)
    if args.assigned:
        record["assigned_to"] = args.assigned
    if args.source:
        record["source"] = args.source
    if args.next_step:
        record["next_step"] = args.next_step
    if args.notes:
        record["notes"] = args.notes

    result = sb.table("rg_pipeline").insert(record).execute()
    print(f"Created deal: {result.data[0]['lead_name']} [{result.data[0]['stage']}] (id: {result.data[0]['id']})")


def cmd_update_deal(args):
    """Update a pipeline deal."""
    updates = {}
    if args.stage:
        updates["stage"] = args.stage
    if args.next_step:
        updates["next_step"] = args.next_step
    if args.value:
        updates["deal_value"] = float(args.value)
    if args.assigned:
        updates["assigned_to"] = args.assigned
    if args.notes:
        updates["notes"] = args.notes

    if not updates:
        print("No updates specified.")
        return

    result = sb.table("rg_pipeline").update(updates).eq("id", args.id).execute()
    if result.data:
        print(f"Updated deal {args.id}: {json.dumps(updates)}")
    else:
        print(f"Deal {args.id} not found.")


def cmd_add_revenue(args):
    """Add a revenue record."""
    # Resolve client name to ID
    client_id = None
    if args.client:
        clients = sb.table("rg_clients").select("id").ilike("name", f"%{args.client}%").execute()
        if clients.data:
            client_id = clients.data[0]["id"]
        else:
            print(f"Warning: client '{args.client}' not found. Recording without client link.")

    record = {
        "month": args.month,
        "type": args.type or "retainer",
        "amount": float(args.amount),
        "currency": args.currency or "USD",
        "status": args.status or "invoiced",
    }
    if client_id:
        record["client_id"] = client_id
    if args.notes:
        record["notes"] = args.notes

    result = sb.table("rg_revenue").insert(record).execute()
    print(f"Recorded revenue: {fmt_money(float(args.amount))} ({args.type or 'retainer'}) for {args.month}")


def cmd_log_metric(args):
    """Log a weekly KPI metric."""
    week = args.week or date.today().strftime("%Y-%m-%d")
    record = {
        "week_start": week,
        "metric_name": args.name,
        "metric_value": float(args.value),
    }
    if args.notes:
        record["notes"] = args.notes

    result = sb.table("rg_metrics").upsert(record, on_conflict="week_start,metric_name").execute()
    print(f"Logged metric: {args.name} = {args.value} (week: {week})")


def cmd_migrate():
    """Run all migration SQL files against Supabase."""
    sql_dir = Path(__file__).parent
    files = sorted(sql_dir.glob("*.sql"))
    if not files:
        print("No SQL files found.")
        return

    for f in files:
        print(f"Running {f.name}...")
        sql = f.read_text(encoding="utf-8")
        try:
            sb.postgrest.session.headers.update({"Prefer": "return=minimal"})
            # Use rpc to execute raw SQL
            sb.rpc("exec_sql", {"query": sql}).execute()
            print(f"  OK: {f.name}")
        except Exception as e:
            # Fall back to printing instructions
            print(f"  Note: Direct SQL execution via PostgREST is not supported.")
            print(f"  Run this file manually in the Supabase SQL Editor:")
            print(f"  https://supabase.com/dashboard/project/nnaryjadylboqcoyvcuw/sql")
            break

    print("\nDone. If manual execution is needed, paste each .sql file into the SQL Editor in order.")


def cmd_seed():
    """Run seed data file (003)."""
    sql_file = Path(__file__).parent / "003_rawgrowth_seed.sql"
    if not sql_file.exists():
        print("Seed file not found: 003_rawgrowth_seed.sql")
        return

    print("Seeding database...")
    print(f"Note: Run {sql_file.name} in the Supabase SQL Editor:")
    print(f"https://supabase.com/dashboard/project/nnaryjadylboqcoyvcuw/sql")
    print(f"\nOr use the Python seeder below to insert via API...\n")

    # Seed via Supabase API instead of raw SQL
    _seed_via_api()


def _seed_via_api():
    """Seed data using Supabase Python client (avoids raw SQL execution issues)."""

    # Team
    team_data = [
        {"id": "a0000000-0000-0000-0000-000000000001", "name": "Chris West", "email": "chris@rawgrowth.ai", "role": "CEO", "timezone": "America/Los_Angeles", "weekly_capacity_hours": 50, "status": "active", "clickup_user_id": 144069077},
        {"id": "a0000000-0000-0000-0000-000000000002", "name": "Alexander Alberts", "email": "alex@rawgrowth.ai", "role": "CTO", "timezone": "Europe/Amsterdam", "weekly_capacity_hours": 45, "status": "active", "clickup_user_id": 118022912},
        {"id": "a0000000-0000-0000-0000-000000000003", "name": "Dilan Patel", "email": "dilan@rawgrowth.ai", "role": "BA", "timezone": "Europe/London", "weekly_capacity_hours": 40, "status": "active", "clickup_user_id": 118018847},
    ]
    print("Seeding team...")
    for t in team_data:
        try:
            sb.table("rg_team").upsert(t, on_conflict="email").execute()
            print(f"  + {t['name']}")
        except Exception as e:
            print(f"  ! {t['name']}: {e}")

    # Clients
    clients_data = [
        {"id": "b0000000-0000-0000-0000-000000000001", "name": "Dineline", "status": "active", "industry": "restaurant_marketing", "contract_type": "hybrid", "setup_fee": 18000.00, "monthly_retainer": 10000.00, "seats_count": 3, "start_date": "2026-03-20", "primary_contact_name": "Brett Williams", "notes": "First client. 3 Mac Mini seats (Nick/Brett/Jace). $18K setup + $10K/mo retainer."},
        {"id": "b0000000-0000-0000-0000-000000000002", "name": "E-com Brand (White-Label)", "status": "lead", "industry": "ecommerce", "contract_type": "hybrid", "setup_fee": 75000.00, "monthly_retainer": 20000.00, "notes": "Year-long relationship, just re-engaged. $75K upfront + $20K/mo proposed 1 year ago."},
        {"id": "b0000000-0000-0000-0000-000000000003", "name": "MWNY", "status": "lead", "notes": "Wants offer sheet. Needs offer doc sent + follow-up."},
    ]
    print("Seeding clients...")
    for c in clients_data:
        try:
            sb.table("rg_clients").upsert(c).execute()
            print(f"  + {c['name']}")
        except Exception as e:
            print(f"  ! {c['name']}: {e}")

    # Pipeline
    pipeline_data = [
        {"lead_name": "$100M Company Guy", "source": "network", "stage": "hot", "deal_value": 100000.00, "assigned_to": "Chris West", "next_step": "Demo call — Chris + Dilan", "notes": "Sold 7 businesses, absolute killer. Very interested. Wants demo."},
        {"lead_name": "MWNY", "company_name": "MWNY", "source": "inbound", "stage": "hot", "assigned_to": "Chris West", "next_step": "Send offer doc + follow-up", "client_id": "b0000000-0000-0000-0000-000000000003", "notes": "Wants offer. Needs offer sheet sent."},
        {"lead_name": "55 Warm Leads (Close CRM)", "source": "outbound", "stage": "warm", "assigned_to": "Dilan Patel", "next_step": "Fathom access -> review transcripts -> follow-up", "notes": "Booked calls but no follow-up. Dilan handling. Bulk entry — 55 individual leads in Close CRM."},
        {"lead_name": "E-com Brand Owner", "company_name": "E-com Brand (White-Label)", "source": "referral", "stage": "hot", "deal_value": 95000.00, "assigned_to": "Chris West", "next_step": "Chris call this weekend", "client_id": "b0000000-0000-0000-0000-000000000002", "notes": "Year-long relationship, just re-engaged. $75K upfront + $20K/mo proposed."},
        {"lead_name": "13-Business Guy", "source": "referral", "stage": "warm", "assigned_to": "Chris West", "next_step": "Wait for referral — first project finishing", "notes": "Via white-label guy. First project finishing, may refer more businesses."},
        {"lead_name": "Vienna Investor", "source": "network", "stage": "warm", "assigned_to": "Alexander Alberts", "next_step": "Explore app build + 3-month stay", "notes": "Wants app built, 3-month stay offer. Intro to $10M+ entrepreneur network."},
        {"lead_name": "Marius", "source": "network", "stage": "warm", "assigned_to": "Chris West", "next_step": "Relationship building — keep nurturing", "notes": "Eddie/Iman/Grant Cardone's ad guy. Intrigued by AI."},
        {"lead_name": "Isaac Okoro Maduka", "source": "network", "stage": "warm", "assigned_to": "Chris West", "next_step": "Explore training + placement model idea", "notes": "Webinar guy, wants in-house AI person."},
        {"lead_name": "Sinan AH", "company_name": "RemotelyX", "source": "network", "stage": "warm", "assigned_to": "Chris West", "next_step": "Leverage Eddie connection via weekly calls", "notes": "Chris's mentor, CMO at RemotelyX (Eddie's company)."},
        {"lead_name": "Justin Lalonde", "source": "network", "stage": "warm", "assigned_to": "Dilan Patel", "next_step": "Warm intro via Dilan", "notes": "Iman Gazi's media buyer. Dilan knows him."},
        {"lead_name": "17K Instagram DMs", "source": "instagram_dm", "stage": "cold", "assigned_to": "Dilan Patel", "next_step": "4 DM setters being onboarded to work these", "notes": "ManyChat contacts, 7-day reply limit. Meta Business Suite connected."},
    ]
    print("Seeding pipeline...")
    for p in pipeline_data:
        try:
            sb.table("rg_pipeline").insert(p).execute()
            print(f"  + {p['lead_name']}")
        except Exception as e:
            print(f"  ! {p['lead_name']}: {e}")

    # Team assignments
    assignments_data = [
        {"team_member_id": "a0000000-0000-0000-0000-000000000002", "client_id": "b0000000-0000-0000-0000-000000000001", "role_on_project": "lead", "hours_allocated_weekly": 25, "start_date": "2026-03-20"},
        {"team_member_id": "a0000000-0000-0000-0000-000000000001", "client_id": "b0000000-0000-0000-0000-000000000001", "role_on_project": "advisor", "hours_allocated_weekly": 5, "start_date": "2026-03-20"},
        {"team_member_id": "a0000000-0000-0000-0000-000000000003", "client_id": "b0000000-0000-0000-0000-000000000001", "role_on_project": "support", "hours_allocated_weekly": 10, "start_date": "2026-03-25"},
    ]
    print("Seeding team assignments...")
    for a in assignments_data:
        try:
            sb.table("rg_team_assignments").insert(a).execute()
            print(f"  + assignment")
        except Exception as e:
            print(f"  ! assignment: {e}")

    # Revenue
    revenue_data = [
        {"month": "2026-03-01", "client_id": "b0000000-0000-0000-0000-000000000001", "type": "setup", "amount": 18000.00, "currency": "USD", "status": "paid", "notes": "Dineline setup fee."},
        {"month": "2026-04-01", "client_id": "b0000000-0000-0000-0000-000000000001", "type": "retainer", "amount": 10000.00, "currency": "USD", "status": "invoiced", "notes": "Dineline monthly retainer. April 2026."},
    ]
    print("Seeding revenue...")
    for r in revenue_data:
        try:
            sb.table("rg_revenue").insert(r).execute()
            print(f"  + {r['type']} {r['month']}")
        except Exception as e:
            print(f"  ! {r['type']}: {e}")

    # Metrics
    metrics_data = [
        {"week_start": "2026-03-24", "metric_name": "total_mrr", "metric_value": 10000.00, "notes": "Dineline retainer only"},
        {"week_start": "2026-03-24", "metric_name": "total_clients", "metric_value": 1, "notes": "Dineline active"},
        {"week_start": "2026-03-24", "metric_name": "pipeline_value", "metric_value": 195000.00, "notes": "$100M guy + E-com brand"},
        {"week_start": "2026-03-24", "metric_name": "leads_contacted", "metric_value": 5},
        {"week_start": "2026-03-24", "metric_name": "demos_booked", "metric_value": 1},
        {"week_start": "2026-03-24", "metric_name": "proposals_sent", "metric_value": 1},
        {"week_start": "2026-03-24", "metric_name": "close_rate", "metric_value": 0},
        {"week_start": "2026-03-24", "metric_name": "avg_deal_size", "metric_value": 28000.00},
    ]
    print("Seeding metrics...")
    for m in metrics_data:
        try:
            sb.table("rg_metrics").upsert(m, on_conflict="week_start,metric_name").execute()
            print(f"  + {m['metric_name']} = {m['metric_value']}")
        except Exception as e:
            print(f"  ! {m['metric_name']}: {e}")

    print("\nSeed complete.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Rawgrowth Internal Database CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Read commands
    subparsers.add_parser("dashboard", help="Company overview")
    subparsers.add_parser("clients", help="List all clients")
    subparsers.add_parser("pipeline", help="List pipeline deals")
    subparsers.add_parser("revenue", help="Revenue breakdown")
    subparsers.add_parser("team", help="Team and assignments")
    subparsers.add_parser("seed", help="Seed database with initial data")
    subparsers.add_parser("migrate", help="Run SQL migrations")

    # Add client
    p_ac = subparsers.add_parser("add-client", help="Add a new client")
    p_ac.add_argument("--name", required=True)
    p_ac.add_argument("--industry")
    p_ac.add_argument("--status", default="lead")
    p_ac.add_argument("--setup-fee", dest="setup_fee")
    p_ac.add_argument("--retainer")

    # Add deal
    p_ad = subparsers.add_parser("add-deal", help="Add a pipeline deal")
    p_ad.add_argument("--lead", required=True)
    p_ad.add_argument("--company")
    p_ad.add_argument("--stage", default="warm")
    p_ad.add_argument("--value")
    p_ad.add_argument("--assigned")
    p_ad.add_argument("--source")
    p_ad.add_argument("--next-step", dest="next_step")
    p_ad.add_argument("--notes")

    # Update deal
    p_ud = subparsers.add_parser("update-deal", help="Update a pipeline deal")
    p_ud.add_argument("--id", required=True)
    p_ud.add_argument("--stage")
    p_ud.add_argument("--next-step", dest="next_step")
    p_ud.add_argument("--value")
    p_ud.add_argument("--assigned")
    p_ud.add_argument("--notes")

    # Add revenue
    p_ar = subparsers.add_parser("add-revenue", help="Add a revenue record")
    p_ar.add_argument("--client")
    p_ar.add_argument("--month", required=True, help="YYYY-MM-DD (first of month)")
    p_ar.add_argument("--type", default="retainer")
    p_ar.add_argument("--amount", required=True)
    p_ar.add_argument("--currency", default="USD")
    p_ar.add_argument("--status", default="invoiced")
    p_ar.add_argument("--notes")

    # Log metric
    p_lm = subparsers.add_parser("log-metric", help="Log a weekly KPI metric")
    p_lm.add_argument("--name", required=True)
    p_lm.add_argument("--value", required=True)
    p_lm.add_argument("--week", help="YYYY-MM-DD (Monday of the week)")
    p_lm.add_argument("--notes")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    commands = {
        "dashboard": lambda: cmd_dashboard(),
        "clients": lambda: cmd_clients(),
        "pipeline": lambda: cmd_pipeline(),
        "revenue": lambda: cmd_revenue(),
        "team": lambda: cmd_team(),
        "seed": lambda: cmd_seed(),
        "migrate": lambda: cmd_migrate(),
        "add-client": lambda: cmd_add_client(args),
        "add-deal": lambda: cmd_add_deal(args),
        "update-deal": lambda: cmd_update_deal(args),
        "add-revenue": lambda: cmd_add_revenue(args),
        "log-metric": lambda: cmd_log_metric(args),
    }

    fn = commands.get(args.command)
    if fn:
        fn()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
