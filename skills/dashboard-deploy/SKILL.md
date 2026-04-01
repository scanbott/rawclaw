---
name: dashboard-deploy
description: Dashboard build, deploy, and troubleshooting process. Use when building or deploying the Vercel dashboard.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
user-invocable: true
---

# Dashboard Deploy — [COMPANY_NAME]

## Deploy Command
```bash
cd dashboard && vercel --prod --yes
```

## Pre-Deploy Checklist
1. Build passes locally (`npm run build` or verify HTML is valid)
2. No hardcoded API keys — all env vars set in Vercel dashboard
3. Supabase connection string verified
4. All data reads from Supabase (never from local JSON files)

## Post-Deploy Verification
1. Visit the live URL
2. Verify Supabase real-time connection is active
3. Check all dashboard sections load data
4. Test any new features

## Architecture
- **Frontend:** Next.js or single HTML file on Vercel
- **Backend:** Supabase (Postgres + pgvector + real-time subscriptions)
- **Data flow:** Dashboard reads from Supabase in real-time. Agents write to Supabase.
- **Theme:** Dark mode. Brand colors from `knowledge/brand/05-brand-voice.md`

## Supabase Schema Reference
Read `tools/supabase/supabase-inventory.md` for the current table inventory.
Read `tools/supabase/supabase-triggers.sql` for active triggers.

## Troubleshooting
- **Build fails:** Check `vercel logs` for the specific error
- **Data not loading:** Verify SUPABASE_URL and SUPABASE_KEY env vars in Vercel
- **Real-time not working:** Check Supabase real-time is enabled for the table
- **Dashboard down = P0:** Drop everything else and fix it
