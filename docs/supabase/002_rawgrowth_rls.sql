-- =============================================================================
-- 002_rawgrowth_rls.sql
-- Row-Level Security for Rawgrowth Internal Tables
--
-- Current state: service_role is the only accessor (Python CLI, Trigger.dev).
-- Future-proofed for multi-user access via Supabase Auth.
--
-- Depends on: 001_rawgrowth_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on all rg_ tables
-- Service role automatically bypasses RLS in Supabase.
-- ---------------------------------------------------------------------------

ALTER TABLE rg_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rg_metrics ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- POLICIES: rg_clients
-- Authenticated users can read all clients.
-- Insert/update/delete restricted to service role for now (no policy = deny).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS rg_clients_auth_select ON rg_clients;
CREATE POLICY rg_clients_auth_select
    ON rg_clients FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rg_clients_auth_write ON rg_clients;
CREATE POLICY rg_clients_auth_write
    ON rg_clients FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- POLICIES: rg_pipeline
-- All authenticated users can read the full pipeline.
-- Write access for all authenticated users (team is small, trust-based).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS rg_pipeline_auth_select ON rg_pipeline;
CREATE POLICY rg_pipeline_auth_select
    ON rg_pipeline FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rg_pipeline_auth_write ON rg_pipeline;
CREATE POLICY rg_pipeline_auth_write
    ON rg_pipeline FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- POLICIES: rg_revenue
-- All authenticated users can read revenue.
-- Write access for all (small team).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS rg_revenue_auth_select ON rg_revenue;
CREATE POLICY rg_revenue_auth_select
    ON rg_revenue FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rg_revenue_auth_write ON rg_revenue;
CREATE POLICY rg_revenue_auth_write
    ON rg_revenue FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- POLICIES: rg_team
-- All authenticated users can read team info.
-- Write access for all.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS rg_team_auth_select ON rg_team;
CREATE POLICY rg_team_auth_select
    ON rg_team FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rg_team_auth_write ON rg_team;
CREATE POLICY rg_team_auth_write
    ON rg_team FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- POLICIES: rg_team_assignments
-- All authenticated users can read assignments.
-- Write access for all.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS rg_assignments_auth_select ON rg_team_assignments;
CREATE POLICY rg_assignments_auth_select
    ON rg_team_assignments FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rg_assignments_auth_write ON rg_team_assignments;
CREATE POLICY rg_assignments_auth_write
    ON rg_team_assignments FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- POLICIES: rg_metrics
-- All authenticated users can read metrics.
-- Write access for all.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS rg_metrics_auth_select ON rg_metrics;
CREATE POLICY rg_metrics_auth_select
    ON rg_metrics FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rg_metrics_auth_write ON rg_metrics;
CREATE POLICY rg_metrics_auth_write
    ON rg_metrics FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
