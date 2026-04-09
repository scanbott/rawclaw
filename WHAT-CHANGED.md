# What Changed: RawClaw v1 -> v2

## New Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/supabase.ts` | ~240 | Lightweight Supabase REST client (no SDK). `supabaseWrite()`, `supabaseUpdate()`, `supabaseRead()` helpers for dual-write pattern. |
| `src/budget.ts` | ~340 | Budget governance: policies, checking, enforcement, pause/resume. `estimateCost()` with Opus/Sonnet/Haiku pricing. |
| `src/heartbeat.ts` | ~385 | `executeWithHeartbeat()` wraps `runAgent()` with full telemetry. In-memory buffer + SQLite + Supabase. |
| `src/audit.ts` | ~200 | Activity audit log with `logUserAction()`, `logAgentAction()`, `logSystemAction()`. 30+ `ActionTypes`. |
| `src/health.ts` | ~310 | 5-subsystem health check. `getHealthStatus()`, `startHealthMonitor()`, `stopHealthMonitor()`. |
| `src/discord.ts` | ~230 | Discord REST adapter. `sendMessage()`, `postWebhook()`, `postEmbed()`, alert helpers. |
| `src/plugins.ts` | ~240 | Plugin loader, event dispatcher, tool router. `loadPlugins()`, `dispatchEvent()`, `callPluginTool()`. |
| `src/plugin-types.ts` | ~80 | TypeScript interfaces: `PluginManifest`, `PluginInstance`, `PluginCapability`, `PluginStateStore`. |
| `src/session-compaction.ts` | ~235 | Per-agent session tracking. `recordRun()`, `checkCompaction()`, `rotateSession()`. Thresholds: 200 runs / 2M tokens / 72h. |
| `feature_list.json` | ~93 | Feature tracking manifest (10 features, all status: complete). |
| `architecture.md` | ~200 | Architecture decisions document. |
| `CHANGELOG.md` | ~50 | Version history. |
| `WHAT-CHANGED.md` | this file | Change summary. |

## Modified Files

| File | What Changed |
|------|-------------|
| `src/db.ts` | +4 new tables (`heartbeat_runs`, `budget_policies`, `budget_incidents`, `activity_log_v2`) in `createSchema()`. +12 new query functions for v2 module registration pattern. |
| `src/index.ts` | +6 new imports (v2 modules). Registration calls after `initDatabase()`. Plugin loading + health monitor start in main process. `shutdown()` calls `stopHealthMonitor()` + `shutdownPlugins()`. |
| `src/dashboard.ts` | +15 new API endpoints for heartbeat, budget, activity, sessions, plugins, Discord, Supabase. `/health` endpoint. |
| `scripts/setup.ts` | +3 new sections: Supabase cloud sync, budget governance defaults, Discord notifications. |
| `package.json` | Version 1.x.x -> 2.0.0 |
| `README.md` | Added "What's New in v2.0" section with feature table, new files list, new tables list. |

## Files NOT Modified (v1 originals preserved)

- `src/agent.ts` -- agent spawning logic unchanged
- `src/bot.ts` -- Telegram message handling unchanged
- `src/config.ts` -- env loading unchanged
- `src/memory.ts` -- memory system unchanged
- `src/memory-consolidate.ts` -- consolidation unchanged
- `src/scheduler.ts` -- task scheduler unchanged
- `src/orchestrator.ts` -- agent orchestration unchanged
- `src/security.ts` -- PIN/kill/audit unchanged
- `src/state.ts` -- state management unchanged
- `src/dashboard-html.ts` -- HTML template unchanged (API-only dashboard upgrade)

## Architecture Decisions

1. **Zero new runtime dependencies**: Supabase uses native `fetch()`, Discord uses REST API, plugins use dynamic `import()`. The `package.json` dependencies section is unchanged from v1.

2. **Registration pattern for ESM**: All v2 modules export `registerXxxDb(fns)` functions. `index.ts` calls these after `initDatabase()` to inject database callbacks. This avoids circular imports in ESM where `require()` is unavailable.

3. **Dual-write resilience**: All Supabase writes are fire-and-forget (`.catch(() => {})`). The system works fully offline with SQLite only. Supabase is purely supplementary for cloud dashboards and cross-machine visibility.

4. **In-memory first**: Heartbeat buffer (500 runs), audit buffer (1000 entries), budget policies map, session states map. Dashboard endpoints query in-memory first, falling back to SQLite for historical data.

5. **Backward compatibility**: All v1 functionality is preserved. New tables are additive. No existing table schemas modified. No existing function signatures changed.

## Build Verification

```
npx tsc --noEmit  -->  0 errors
npm run build     -->  clean compilation
```
