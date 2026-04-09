-- =============================================================================
-- 001_rawgrowth_schema.sql
-- Rawgrowth Internal Company Database
--
-- Tables for tracking clients, pipeline, revenue, team, and KPIs.
-- Lives alongside the Dineline client tables (001-005) on the same
-- Supabase project (nnaryjadylboqcoyvcuw).
--
-- All tables prefixed with rg_ to avoid collision with client schemas.
-- Idempotent: safe to run multiple times (IF NOT EXISTS / OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions (already created by 001_core_schema.sql, but safe to repeat)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Custom Types
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE rg_client_status AS ENUM (
        'lead',
        'active',
        'churned',
        'paused'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rg_contract_type AS ENUM (
        'setup_only',
        'retainer',
        'hybrid'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rg_lead_source AS ENUM (
        'instagram_dm',
        'referral',
        'inbound',
        'outbound',
        'event',
        'content',
        'network'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rg_deal_stage AS ENUM (
        'cold',
        'warm',
        'hot',
        'demo_scheduled',
        'proposal_sent',
        'negotiation',
        'closed_won',
        'closed_lost'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rg_revenue_type AS ENUM (
        'setup',
        'retainer',
        'addon'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rg_invoice_status AS ENUM (
        'invoiced',
        'paid',
        'overdue'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rg_team_status AS ENUM (
        'active',
        'on_leave',
        'departed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE rg_project_role AS ENUM (
        'lead',
        'support',
        'advisor'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- TABLE: rg_clients — Client companies
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rg_clients (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,
    status                  rg_client_status NOT NULL DEFAULT 'lead',
    industry                TEXT,
    contract_type           rg_contract_type,
    setup_fee               NUMERIC(10, 2),
    monthly_retainer        NUMERIC(10, 2),
    seats_count             INTEGER DEFAULT 0,
    start_date              DATE,
    end_date                DATE,
    primary_contact_name    TEXT,
    primary_contact_email   TEXT,
    close_crm_lead_id       TEXT,
    clickup_list_id         TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rg_clients IS 'Rawgrowth client companies. Tracks contract terms, status, and integration IDs.';

CREATE INDEX IF NOT EXISTS idx_rg_clients_status ON rg_clients(status);
CREATE INDEX IF NOT EXISTS idx_rg_clients_name ON rg_clients(name);

-- ---------------------------------------------------------------------------
-- TABLE: rg_pipeline — Sales pipeline / deals
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rg_pipeline (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id           UUID REFERENCES rg_clients(id) ON DELETE SET NULL,
    lead_name           TEXT NOT NULL,
    company_name        TEXT,
    source              rg_lead_source,
    stage               rg_deal_stage NOT NULL DEFAULT 'cold',
    deal_value          NUMERIC(12, 2),
    assigned_to         TEXT,
    last_contact_date   DATE,
    next_step           TEXT,
    next_step_date      DATE,
    close_crm_id        TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rg_pipeline IS 'Sales pipeline deals. Tracks leads from cold through close. Mirrors Close CRM stages.';

CREATE INDEX IF NOT EXISTS idx_rg_pipeline_stage ON rg_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_rg_pipeline_assigned_to ON rg_pipeline(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rg_pipeline_client_id ON rg_pipeline(client_id);

-- ---------------------------------------------------------------------------
-- TABLE: rg_revenue — Revenue tracking (monthly snapshots)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rg_revenue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month           DATE NOT NULL,             -- First of the month
    client_id       UUID REFERENCES rg_clients(id) ON DELETE SET NULL,
    type            rg_revenue_type NOT NULL,
    amount          NUMERIC(12, 2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'USD',
    status          rg_invoice_status NOT NULL DEFAULT 'invoiced',
    invoice_number  TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rg_revenue IS 'Monthly revenue records per client. One row per line item per month.';

CREATE INDEX IF NOT EXISTS idx_rg_revenue_month ON rg_revenue(month DESC);
CREATE INDEX IF NOT EXISTS idx_rg_revenue_client_id ON rg_revenue(client_id);
CREATE INDEX IF NOT EXISTS idx_rg_revenue_status ON rg_revenue(status);

-- ---------------------------------------------------------------------------
-- TABLE: rg_team — Team members and capacity
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rg_team (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,
    email                   TEXT UNIQUE,
    role                    TEXT NOT NULL,
    timezone                TEXT,
    hourly_rate             NUMERIC(8, 2),
    weekly_capacity_hours   INTEGER DEFAULT 40,
    status                  rg_team_status NOT NULL DEFAULT 'active',
    clickup_user_id         INTEGER,
    close_user_id           TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rg_team IS 'Rawgrowth team members with capacity and integration IDs.';

CREATE INDEX IF NOT EXISTS idx_rg_team_status ON rg_team(status);

-- ---------------------------------------------------------------------------
-- TABLE: rg_team_assignments — Who's working on what
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rg_team_assignments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id          UUID NOT NULL REFERENCES rg_team(id) ON DELETE CASCADE,
    client_id               UUID NOT NULL REFERENCES rg_clients(id) ON DELETE CASCADE,
    role_on_project         rg_project_role NOT NULL DEFAULT 'support',
    hours_allocated_weekly  INTEGER DEFAULT 0,
    start_date              DATE,
    end_date                DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE rg_team_assignments IS 'Maps team members to client projects with role and weekly hours.';

CREATE INDEX IF NOT EXISTS idx_rg_assignments_team ON rg_team_assignments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_rg_assignments_client ON rg_team_assignments(client_id);

-- ---------------------------------------------------------------------------
-- TABLE: rg_metrics — KPI snapshots (weekly)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rg_metrics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_start      DATE NOT NULL,
    metric_name     TEXT NOT NULL,
    metric_value    NUMERIC(14, 2) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (week_start, metric_name)
);

COMMENT ON TABLE rg_metrics IS 'Weekly KPI snapshots. Metric names: total_mrr, total_clients, pipeline_value, leads_contacted, demos_booked, proposals_sent, close_rate, avg_deal_size.';

CREATE INDEX IF NOT EXISTS idx_rg_metrics_week ON rg_metrics(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_rg_metrics_name ON rg_metrics(metric_name);

-- ---------------------------------------------------------------------------
-- Auto-update updated_at triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION rg_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rg_clients_updated_at ON rg_clients;
CREATE TRIGGER rg_clients_updated_at
    BEFORE UPDATE ON rg_clients
    FOR EACH ROW EXECUTE FUNCTION rg_update_updated_at();

DROP TRIGGER IF EXISTS rg_pipeline_updated_at ON rg_pipeline;
CREATE TRIGGER rg_pipeline_updated_at
    BEFORE UPDATE ON rg_pipeline
    FOR EACH ROW EXECUTE FUNCTION rg_update_updated_at();

DROP TRIGGER IF EXISTS rg_team_updated_at ON rg_team;
CREATE TRIGGER rg_team_updated_at
    BEFORE UPDATE ON rg_team
    FOR EACH ROW EXECUTE FUNCTION rg_update_updated_at();
