-- =============================================================================
-- 003_rawgrowth_seed.sql
-- Seed Data for Rawgrowth Internal Database
--
-- Sources:
--   - rawclaw/clients/pipeline.md (all pipeline leads)
--   - Team info from CLAUDE.md and memory
--   - Dineline contract details from memory
--
-- Idempotent: uses ON CONFLICT DO NOTHING where possible.
-- Run after: 001_rawgrowth_schema.sql, 002_rawgrowth_rls.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TEAM MEMBERS
-- ---------------------------------------------------------------------------

INSERT INTO rg_team (id, name, email, role, timezone, weekly_capacity_hours, status, clickup_user_id)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Chris West', 'chris@rawgrowth.ai', 'CEO', 'America/Los_Angeles', 50, 'active', 144069077),
    ('a0000000-0000-0000-0000-000000000002', 'Alexander Alberts', 'alex@rawgrowth.ai', 'CTO', 'Europe/Amsterdam', 45, 'active', 118022912),
    ('a0000000-0000-0000-0000-000000000003', 'Dilan Patel', 'dilan@rawgrowth.ai', 'BA', 'Europe/London', 40, 'active', 118018847)
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. CLIENTS
-- ---------------------------------------------------------------------------

-- Dineline — first client, active
INSERT INTO rg_clients (id, name, status, industry, contract_type, setup_fee, monthly_retainer, seats_count, start_date, primary_contact_name, notes)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Dineline', 'active', 'restaurant_marketing', 'hybrid', 18000.00, 10000.00, 3, '2026-03-20',
     'Brett Williams', 'First client. 3 Mac Mini seats (Nick/Brett/Jace). $18K setup + $10K/mo retainer. Supabase project: nnaryjadylboqcoyvcuw.')
ON CONFLICT DO NOTHING;

-- E-com brand (via white-label) — lead stage, high value
INSERT INTO rg_clients (id, name, status, industry, contract_type, setup_fee, monthly_retainer, notes)
VALUES
    ('b0000000-0000-0000-0000-000000000002', 'E-com Brand (White-Label)', 'lead', 'ecommerce', 'hybrid', 75000.00, 20000.00,
     'Year-long relationship, just re-engaged. $75K upfront + $20K/mo proposed 1 year ago. Chris calling this weekend.')
ON CONFLICT DO NOTHING;

-- MWNY — lead, wants offer
INSERT INTO rg_clients (id, name, status, industry, notes)
VALUES
    ('b0000000-0000-0000-0000-000000000003', 'MWNY', 'lead', NULL,
     'Wants offer sheet. Needs offer doc sent + follow-up.')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. PIPELINE — All leads from pipeline.md
-- ---------------------------------------------------------------------------

-- Tier 1: Hot

-- $100M company guy
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('$100M Company Guy', NULL, 'network', 'hot', 100000.00,
     'Chris West', 'Demo call — Chris + Dilan',
     'Tier 1 Hot. Sold 7 businesses, absolute killer. Very interested. Wants demo.');

-- MWNY
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, client_id, notes)
VALUES
    ('MWNY', 'MWNY', 'inbound', 'hot', NULL,
     'Chris West', 'Send offer doc + follow-up',
     'b0000000-0000-0000-0000-000000000003',
     'Tier 1 Hot. Wants offer. Needs offer sheet sent.');

-- 55 warm leads in Close
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('55 Warm Leads (Close CRM)', NULL, 'outbound', 'warm', NULL,
     'Dilan Patel', 'Fathom access -> review transcripts -> follow-up',
     'Tier 1 Hot. Booked calls but no follow-up. Dilan handling. Needs Fathom transcripts first. Bulk entry — represents 55 individual leads in Close CRM.');

-- E-com brand (via white-label guy)
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, client_id, notes)
VALUES
    ('E-com Brand Owner', 'E-com Brand (White-Label)', 'referral', 'hot', 95000.00,
     'Chris West', 'Chris call this weekend',
     'b0000000-0000-0000-0000-000000000002',
     'Tier 1 Hot. Year-long relationship, just re-engaged. $75K upfront + $20K/mo proposed. Via white-label guy.');

-- 13-business guy (via white-label)
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('13-Business Guy', NULL, 'referral', 'warm', NULL,
     'Chris West', 'Wait for referral — first project finishing',
     'Tier 1 Hot. Via white-label guy. First project finishing, may refer more businesses.');

-- Tier 2: Warm

-- Vienna investor
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('Vienna Investor', NULL, 'network', 'warm', NULL,
     'Alexander Alberts', 'Explore app build + 3-month stay',
     'Tier 2 Warm. Wants app built, 3-month stay offer (EUR 1.5K/mo hotel). Intro to $10M+ entrepreneur network.');

-- Marius (media buyer)
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('Marius', NULL, 'network', 'warm', NULL,
     'Chris West', 'Relationship building — keep nurturing',
     'Tier 2 Warm. Eddie/Iman/Grant Cardone''s ad guy. Intrigued by AI. Media buyer.');

-- Isaac Okoro Maduka
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('Isaac Okoro Maduka', NULL, 'network', 'warm', NULL,
     'Chris West', 'Explore training + placement model idea',
     'Tier 2 Warm. Webinar guy, wants in-house AI person. Gave idea for training + placement model.');

-- Sinan AH
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('Sinan AH', 'RemotelyX', 'network', 'warm', NULL,
     'Chris West', 'Leverage Eddie connection via weekly calls',
     'Tier 2 Warm. Chris''s mentor, CMO at RemotelyX (Eddie''s company). On calls with Eddie weekly, could intro.');

-- Justin Lalonde
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('Justin Lalonde', NULL, 'network', 'warm', NULL,
     'Dilan Patel', 'Warm intro via Dilan',
     'Tier 2 Warm. Iman Gazi''s media buyer. Dilan knows him. Potential warm intro.');

-- Tier 3: Mass / Untouched

-- 17K Instagram DMs
INSERT INTO rg_pipeline (lead_name, company_name, source, stage, deal_value, assigned_to, next_step, notes)
VALUES
    ('17K Instagram DMs', NULL, 'instagram_dm', 'cold', NULL,
     'Dilan Patel', '4 DM setters being onboarded to work these',
     'Tier 3 Mass/Untouched. ManyChat contacts, 7-day reply limit. Meta Business Suite now connected for unlimited DM access. 4 setters onboarding.');

-- ---------------------------------------------------------------------------
-- 4. TEAM ASSIGNMENTS (Dineline)
-- ---------------------------------------------------------------------------

-- Alexander: lead on Dineline (builds + orchestration)
INSERT INTO rg_team_assignments (team_member_id, client_id, role_on_project, hours_allocated_weekly, start_date)
VALUES
    ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'lead', 25, '2026-03-20');

-- Chris: advisor on Dineline (sales relationship)
INSERT INTO rg_team_assignments (team_member_id, client_id, role_on_project, hours_allocated_weekly, start_date)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'advisor', 5, '2026-03-20');

-- Dilan: support on Dineline (BA/systems)
INSERT INTO rg_team_assignments (team_member_id, client_id, role_on_project, hours_allocated_weekly, start_date)
VALUES
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'support', 10, '2026-03-25');

-- ---------------------------------------------------------------------------
-- 5. REVENUE (Dineline)
-- ---------------------------------------------------------------------------

-- March 2026: setup fee
INSERT INTO rg_revenue (month, client_id, type, amount, currency, status, notes)
VALUES
    ('2026-03-01', 'b0000000-0000-0000-0000-000000000001', 'setup', 18000.00, 'USD', 'paid',
     'Dineline setup fee. 3 Mac Mini seats + full infrastructure build.');

-- April 2026: first retainer
INSERT INTO rg_revenue (month, client_id, type, amount, currency, status, notes)
VALUES
    ('2026-04-01', 'b0000000-0000-0000-0000-000000000001', 'retainer', 10000.00, 'USD', 'invoiced',
     'Dineline monthly retainer. April 2026.');

-- ---------------------------------------------------------------------------
-- 6. METRICS (Week of 2026-03-24)
-- ---------------------------------------------------------------------------

INSERT INTO rg_metrics (week_start, metric_name, metric_value, notes)
VALUES
    ('2026-03-24', 'total_mrr', 10000.00, 'Dineline retainer only'),
    ('2026-03-24', 'total_clients', 1, 'Dineline active'),
    ('2026-03-24', 'pipeline_value', 195000.00, '$100M guy ($100K est) + E-com ($95K)'),
    ('2026-03-24', 'leads_contacted', 5, 'Tier 1 hot leads'),
    ('2026-03-24', 'demos_booked', 1, '$100M company guy demo'),
    ('2026-03-24', 'proposals_sent', 1, 'MWNY offer pending'),
    ('2026-03-24', 'close_rate', 0, 'First client was direct — no pipeline close yet'),
    ('2026-03-24', 'avg_deal_size', 28000.00, 'Based on Dineline: $18K setup + $10K/mo')
ON CONFLICT (week_start, metric_name) DO NOTHING;
