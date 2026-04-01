# Database Migrations

BusinessOS uses SQLite for local state (agent memory, task queue, sessions, etc.).

The schema is defined in `src/db.ts` via `createSchema()`. No separate migration files needed for a fresh install -- the schema is created automatically on first run.

## Tables

| Table | Purpose |
|-------|---------|
| `scheduled_tasks` | Cron-based scheduled agent tasks |
| `sessions` | Active Claude Code sessions per agent |
| `memories` | Extracted memory fragments with embeddings |
| `consolidations` | Consolidated memory summaries |
| `wa_message_map` | WhatsApp <-> Telegram message mapping |
| `wa_outbox` | Pending WhatsApp messages |
| `wa_messages` | WhatsApp message history (encrypted) |
| `conversation_log` | Raw conversation turns (encrypted) |
| `token_usage` | Per-session token and cost tracking |
| `slack_messages` | Slack message history (encrypted) |
| `hive_mind` | Cross-agent action log |
| `inter_agent_tasks` | Agent-to-agent task routing |
| `mission_tasks` | Mission Control task queue |
| `audit_log` | Security audit trail |

## Version Migrations

The `migrations/` directory contains version-based migration scripts. Run on startup:

```bash
npm run migrate
```

The migration runner in `src/migrations.ts` compares `migrations/version.json` against `.applied.json` and applies any pending migrations.

## Adding a Migration

See the `add-migration` skill or:
1. Create a migration file referenced in `migrations/version.json`
2. Run `npm run migrate` to test
3. The migration is applied and tracked in `migrations/.applied.json`

## Supabase (Remote Data)

Separate from SQLite. Supabase handles shared, multi-device business data.
Run Supabase migrations via the Supabase CLI or dashboard.

Key tables:
- `content_pipeline` -- Content queue and status
- `sales_calls` -- Call transcripts and analysis
- `revenue` -- Revenue tracking
- `clients` -- Client records
- `client_onboarding` -- Onboarding status
- `brand_intake` -- Client brand intake forms
- `task_queue` -- Shared task queue
- `deliverables` -- Deliverable tracking
- `agent_activity` -- Agent action log
- `knowledge_base` -- Semantic search index (pgvector)
- `health_checks` -- System health monitoring
