# Dineline AI Department — Gap Audit

**Date:** 2026-03-30
**Auditor:** Automated pre-deploy review
**Scope:** All files in `dineline/` directory

---

## Summary

| Category | Count | Severity |
|----------|-------|---------|
| Blocking (deploy halted without fix) | 4 | HIGH |
| Pre-install (must fix before install day) | 5 | MEDIUM |
| Documentation gaps | 4 | LOW |
| Gaps between promises and builds | 3 | MEDIUM |

---

## BLOCKING GAPS (Must Fix Before Going Live)

### GAP-B1: All .env files are empty — NO API KEYS POPULATED
**Files:** `clients/dineline/.env.brett`, `.env.jace`, `.env.nick`
**Finding:** Every env file has keys defined but ALL values are blank.
- `ANTHROPIC_API_KEY=` (blank)
- `SUPABASE_SERVICE_ROLE_KEY=` (blank)
- `SEAT_ID=` (blank)
- `DINELINE_HUBSPOT_API_KEY=` (blank)
- `DINELINE_GOOGLE_ADS_DEVELOPER_TOKEN=` (blank)
- `DINELINE_CLICKUP_API_TOKEN=` (blank)
- `SLACK_BOT_TOKEN=` (blank)
- `DISCORD_WEBHOOK_HEARTBEAT=` (blank)

**Impact:** Nothing works. Every integration call fails. `verify_env.py` will exit with code 1.
**Fix:** Populate all values from the master `.env` at `D:/-Alexander Thompson/Claude Code Warp/.env` before install day.
**Owner:** Alexander (pre-install)

---

### GAP-B2: SEAT_ID values not assigned
**Files:** All 3 `.env` files and all 3 `seats/*/CLAUDE.md` files
**Finding:** `SEAT_ID=` is blank everywhere. The Supabase `seats` table contains the UUIDs for Brett, Jace, and Nick — these must be copied into each respective env file.
**Impact:** RLS policies fail silently for Nick's seat (anon key queries filter by seat_id). Nick's agent can't read/write its own data.
**Fix:** After running `supabase/004_seed_dineline.sql`, query `SELECT id, name FROM seats WHERE company_id = 'dineline-company-uuid'` and populate each SEAT_ID.
**Owner:** Alexander (after Supabase migration)

---

### GAP-B3: Supabase service role key not in CLAUDE.md files
**Files:** `seats/brett/CLAUDE.md`, `seats/jace/CLAUDE.md`
**Finding:** Both CEO and COO CLAUDE.md files show `SUPABASE_SERVICE_ROLE_KEY=<from .env.brett>` as a placeholder instruction, not an actual value. These files are read directly by Claude Code — the placeholder needs to either be removed or the actual key needs to be in the env file.
**Impact:** Brett and Jace agents will not have functional Supabase access at session start without the key in the env.
**Fix:** The CLAUDE.md files are correct (they reference env vars, not hardcoded values). The fix is ensuring the env files are populated (GAP-B1). No change needed to CLAUDE.md. Confirm the CLAUDE.md format matches Claude Code's env var resolution behavior.
**Owner:** Alexander (verify behavior during Phase 3)

---

### GAP-B4: Supabase migrations NOT applied to production project
**Files:** `supabase/001_core_schema.sql` through `supabase/005_security_fixes.sql`
**Finding:** The scope.md documents that migrations must be applied manually via Supabase SQL editor on project `nnaryjadylboqcoyvcuw`. There is no evidence this has been done.
**Impact:** All 22 tables are missing. Every Supabase query fails with "relation does not exist."
**Fix:** Apply migrations in order via Supabase dashboard → SQL Editor:
1. `supabase/001_core_schema.sql`
2. `supabase/002_dineline_tables.sql`
3. `supabase/003_rls_policies.sql`
4. `supabase/004_seed_dineline.sql`
5. `supabase/005_security_fixes.sql`
**Owner:** Alexander (pre-install, T-2)

---

## PRE-INSTALL GAPS (Must Fix Before Install Day)

### GAP-M1: Context files referenced but not created
**Files:** `seats/nick/CLAUDE.md` references:
- `context/active-campaigns.md`
- `context/brand-voice.md`
- `context/sync-config.md`

`seats/brett/CLAUDE.md` references:
- `context/brand-voice.md`

**Finding:** None of these files exist in `dineline/clients/dineline/context/`. Nick's agent is instructed to "read these files at session start if they exist" — so no hard crash, but the agent won't have campaign context, voice guidelines, or sync config.
**Impact:** Nick's first-session outputs will lack campaign-specific context. Brett's content drafts won't match brand voice.
**Fix:** Create `dineline/clients/dineline/context/` directory with at minimum:
- `brand-voice.md` — Dineline's tone, writing style, content guidelines
- `active-campaigns.md` — Current running campaigns with budgets and targets
- `sync-config.md` — API endpoint notes, field mappings, special handling
**Owner:** Alexander creates templates; Dineline team populates during Phase 3

---

### GAP-M2: Meta Ads integration missing
**Finding:** Templates (`CLAUDE-ceo.md`, `CLAUDE-coo.md`, `CLAUDE-technical.md`) reference Meta Ads API access in some template versions, but no Meta Ads env vars appear in any `.env` file. There is no `integrations/meta_ads.py` module.
**Impact:** If Dineline runs Meta (Facebook/Instagram) ads — which is standard for restaurant marketing agencies — Meta campaign data is not synced, not reported, not monitored.
**Fix Options:**
1. Build `integrations/meta_ads.py` and add `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` to env files
2. Confirm with client that Google Ads is the only ad platform and document this explicitly
**Owner:** Alexander — decide before install day

---

### GAP-M3: Trigger.dev env vars not confirmed deployed
**Files:** `Trigger Workflows/my-workflows/trigger/dineline-daily-scorecard.ts`, `dineline-crm-sync.ts`, `dineline-weekly-report.ts`, `dineline-sqlite-cache.ts`
**Finding:** All 4 Trigger.dev tasks exist. Per CLAUDE.md rules, they auto-deploy on creation. However, the Trigger.dev project needs the following env vars set in the Trigger.dev dashboard:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DINELINE_HUBSPOT_API_KEY`
- `DINELINE_GOOGLE_ADS_DEVELOPER_TOKEN`
- `SLACK_BOT_TOKEN`
- All other API keys
**Impact:** Trigger.dev tasks will fail silently if env vars aren't set in the Trigger.dev dashboard.
**Fix:** Set all required env vars in Trigger.dev dashboard before activate date.
**Owner:** Alexander

---

### GAP-M4: No integration tests
**Finding:** `integrations/requirements.txt` exists. All 5 integration modules are built. But there are no tests — no `test_hubspot.py`, no `test_google_ads.py`, no smoke test script that exercises all integrations before install day.
**Impact:** First failure discovered on install day in front of the client.
**Fix:** Each module has a `--test` flag documented in scope.md. Run:
```bash
python3 -m dineline.integrations.hubspot --test
python3 -m dineline.integrations.google_ads --test
python3 -m dineline.integrations.clickup --test
python3 -m dineline.integrations.slack_adapter --test
python3 -m dineline.integrations.stripe_reader --test
```
Add a `scripts/integration_smoke_test.sh` that runs all 5 in sequence.
**Owner:** Alexander (run on T-1 day before install)

---

### GAP-M5: Vercel install guide deploy — RESOLVED
**File:** `install-guide/index.html`
**Finding:** Deployed 2026-03-30.
**Live URL:** https://install-guide.vercel.app
**Status:** DONE — no action needed.

---

## DOCUMENTATION GAPS (Low Priority)

### GAP-D1: No root-level dineline/README.md
**Finding:** There is no `dineline/README.md`. First-time viewer has no entry point to understand the system.
**Impact:** Future agents and new team members (Dilan) have no orientation document.

### GAP-D2: No credential rotation procedure
**Finding:** Scope.md mentions rotating the Supabase service role key as a security step, but there's no documented procedure for rotating any credential (HubSpot, Google Ads, Anthropic, etc.).
**Impact:** If a key needs to be rotated post-install, it's unclear which files to update.

### GAP-D3: No Supabase backup procedure
**Finding:** No documentation on database backup, restore, or migration rollback.
**Impact:** If a migration fails in production, no documented recovery path.

### GAP-D4: No general employee getting-started guide
**Finding:** Three seat-specific guides exist (Brett, Jace, Nick). No general-purpose `getting-started-employee.md` using the CLAUDE-employee.md template.
**Impact:** If Dineline hires a 4th person and wants to add a seat, no template to follow.

---

## GAPS BETWEEN PROMISES AND BUILDS

### GAP-P1: Getting-started guides promise capabilities not yet fully wired
**File:** `clients/dineline/getting-started-brett.md`
**Specific gap:** Guide says "Generate a full competitive analysis on any restaurant brand" — this requires Perplexity or Exa API. Neither `PERPLEXITY_API_KEY` nor any Exa key appears in `.env.brett`. Works only if those keys are in the global Claude Code env.

### GAP-P2: Nick's guide promises "Export any report to Google Sheets" — no integration exists
**File:** `clients/dineline/getting-started-nick.md`
**Finding:** Google Sheets is listed as a capability. No `GOOGLE_SHEETS_API_KEY` or `GOOGLE_SHEETS_SPREADSHEET_ID` in `.env.nick`. No Sheets integration module in `integrations/`.
**Fix:** Either build the integration or remove the promise from the guide.

### GAP-P3: Jace's guide promises "Set a custom alert threshold for any metric" — no UI to do this
**File:** `clients/dineline/getting-started-jace.md`
**Finding:** Alert thresholds are hardcoded in `dineline-daily-scorecard.ts`. To change them, someone must edit the TypeScript file and redeploy. There's no runtime configuration mechanism.
**Fix:** Either document that threshold changes require a code edit + redeploy by Alexander, or build a `knowledge_items` record schema for dynamic thresholds that the scorecard task reads at runtime.

---

## Pre-Install Checklist

```
[ ] GAP-B1: Populate all .env files with real keys
[ ] GAP-B2: Assign SEAT_IDs after Supabase migrations
[ ] GAP-B4: Apply all 5 Supabase migrations in order
[ ] GAP-M1: Create context/ files for Nick and Brett
[ ] GAP-M2: Decide on Meta Ads (build or exclude)
[ ] GAP-M3: Set Trigger.dev env vars in dashboard
[ ] GAP-M4: Run integration smoke tests on T-1
[ ] GAP-M5: Deploy and confirm Vercel install guide URL
[ ] GAP-P2: Resolve Google Sheets gap (build or remove from guide)
[ ] GAP-P3: Document threshold change process for Jace
```

---

*Audit complete. 4 blocking, 5 medium, 4 low, 3 promise gaps. All documented above.*
