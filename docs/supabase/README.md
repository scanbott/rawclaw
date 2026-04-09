# Rawgrowth Internal Database — Supabase

## Overview

Internal company database for Rawgrowth AI infrastructure business.
Lives on the same Supabase project as client schemas (Dineline etc).

**Supabase Project:** `nnaryjadylboqcoyvcuw`
**Dashboard:** https://supabase.com/dashboard/project/nnaryjadylboqcoyvcuw

## Tables

All tables prefixed with `rg_` to avoid collision with client schemas.

| Table | Purpose |
|-------|---------|
| `rg_clients` | Client companies (Dineline, prospects) |
| `rg_pipeline` | Sales pipeline deals and leads |
| `rg_revenue` | Monthly revenue tracking |
| `rg_team` | Team members and capacity |
| `rg_team_assignments` | Who's working on which client |
| `rg_metrics` | Weekly KPI snapshots |

## Setup

### 1. Apply Migrations

Open the Supabase SQL Editor and run each file **in order**:

```
https://supabase.com/dashboard/project/nnaryjadylboqcoyvcuw/sql
```

1. `001_rawgrowth_schema.sql` — Creates tables, types, indexes, triggers
2. `002_rawgrowth_rls.sql` — Enables RLS, creates policies
3. `003_rawgrowth_seed.sql` — Seeds team, clients, pipeline, revenue, metrics

### 2. Install Python Dependencies

```bash
pip install supabase python-dotenv
```

### 3. Verify .env

The CLI reads from the master `.env` at the repo root:

```
SUPABASE_URL=https://nnaryjadylboqcoyvcuw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## CLI Usage

```bash
cd rawclaw/supabase

# Overview dashboard
python rawgrowth_db.py dashboard

# List views
python rawgrowth_db.py clients
python rawgrowth_db.py pipeline
python rawgrowth_db.py revenue
python rawgrowth_db.py team

# Seed via Python API (alternative to SQL Editor)
python rawgrowth_db.py seed

# Add records
python rawgrowth_db.py add-client --name "Acme Corp" --industry "saas" --status lead
python rawgrowth_db.py add-deal --lead "John Doe" --stage hot --value 50000 --assigned "Chris West"
python rawgrowth_db.py add-revenue --client "Dineline" --month 2026-05-01 --type retainer --amount 10000
python rawgrowth_db.py update-deal --id <uuid> --stage closed_won
python rawgrowth_db.py log-metric --name total_mrr --value 10000 --week 2026-03-31
```

## Pipeline Stages

Mirrors Close CRM stages:
`cold` -> `warm` -> `hot` -> `demo_scheduled` -> `proposal_sent` -> `negotiation` -> `closed_won` / `closed_lost`

## Seeded Data

- **3 team members:** Chris (CEO), Alexander (CTO), Dilan (BA)
- **3 clients:** Dineline (active), E-com Brand (lead), MWNY (lead)
- **11 pipeline deals:** from pipeline.md (Tier 1 hot, Tier 2 warm, Tier 3 mass)
- **2 revenue records:** Dineline setup ($18K paid) + April retainer ($10K invoiced)
- **8 KPI metrics:** MRR, clients, pipeline value, etc.

## Architecture Notes

- Service role key bypasses RLS — used by CLI and Trigger.dev
- Authenticated users get full read/write (small trusted team)
- `rg_` prefix prevents collision with per-client tables (e.g. Dineline's `companies`, `seats`)
- Fixed UUIDs for team/client IDs enable idempotent re-seeding
