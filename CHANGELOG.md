# Changelog

All notable changes to RawClaw will be documented here.

## [v2.1.0] - 2026-04-02

### Fixed — Installer Reliability (Phase 1)

Real-world issues discovered during the Dineline client install on 2026-04-01.
Every fix targets a specific failure that occurred in production.

- **Xcode broken state**: Installer now runs `sudo xcode-select --reset` before checking if Xcode is installed. Fresh Mac Minis often have a partially-initialized Xcode state that caused the installer to hang indefinitely in a polling loop.
- **Xcode timeout**: Added 20-minute timeout with progress messages every 60 seconds instead of an infinite loop.
- **Idempotent steps**: Every install step now checks if it's already done and skips with a clear message. Re-running the installer is safe.
- **npm install error handling**: `npm install` now exits the installer on failure instead of silently continuing with broken dependencies.
- **Keychain persistence**: Installer adds `security unlock-keychain` to `~/.zshrc` and `~/.bash_profile` permanently. Claude auth no longer resets after SSH disconnect.
- **Idempotent clone**: Instead of deleting `~/rawclaw` and re-cloning, installer now runs `git pull` on existing installs.
- **Cloudflared ARM64**: Linux ARM64 now downloads the correct binary instead of always downloading `linux-amd64`.

### Added

- **`preflight.sh`**: Standalone pre-install script that fixes known Mac environment issues before the main installer runs. Checks: macOS version, internet, disk space, Xcode state, keychain. Outputs clear pass/fail.
- **`scripts/verify.sh`**: Post-install test suite. Runs 5 checks (Claude CLI, keychain, Supabase, server health, Cloudflare tunnel) and prints pass/fail summary.
- **Telegram progress notifications**: Installer sends progress updates at key milestones if `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are available. Non-blocking — install never waits on Telegram.
- **`PRD-v2.1.md`**: Full product requirements document for v2.1 and future phases.
- **`skip()` helper**: New terminal output style for steps already completed.
- **Version number** in banner.

### One-liner (updated)

```bash
# Optional: run preflight first to fix environment
curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/preflight.sh | bash

# Main installer
curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/install.sh | bash
```

---

## [v2.0.0] - 2026-03-30

### Added — New Modules (10 features)
- **Supabase dual-write** (`src/supabase.ts`): Lightweight REST client using native `fetch()`, no SDK. Fire-and-forget writes; SQLite remains primary.
- **Budget governance** (`src/budget.ts`): Per-agent spending limits (daily/monthly/lifetime). 80% warning, auto-pause on exceed. Model-aware cost estimation.
- **Heartbeat execution model** (`src/heartbeat.ts`): Every agent run tracked with tokens, cost, duration, session state. Dead agent detection and crash recovery.
- **Activity audit log** (`src/audit.ts`): Immutable trail with 30+ action types. Actor-typed, entity-scoped, JSON detail. In-memory + SQLite + Supabase.
- **Health monitoring** (`src/health.ts`): `/health` endpoint checks 5 subsystems. Periodic self-check (5 min). Status change logging.
- **Discord adapter** (`src/discord.ts`): REST API notifications. Budget alerts, health alerts, task completions. Webhook + Bot Token modes.
- **Plugin system** (`src/plugins.ts`, `src/plugin-types.ts`): YAML manifest plugins in `plugins/`. Event subscriptions, tool registration, lifecycle hooks.
- **Session compaction** (`src/session-compaction.ts`): Auto-rotation at 200 runs / 2M tokens / 72h. Prevents context rot.
- **Enhanced dashboard API** (`src/dashboard.ts`): 15+ new endpoints for heartbeat, budget, activity, sessions, plugins, status.
- **Enhanced setup wizard** (`scripts/setup.ts`): Supabase, budget, Discord configuration sections.

### Added — New SQLite Tables
- `heartbeat_runs`, `budget_policies`, `budget_incidents`, `activity_log_v2`

### Added — New db.ts Functions
- `insertHeartbeatRun`, `updateHeartbeatRun`, `getTokenSpendForBudget`, `getBudgetPolicies`, `insertBudgetPolicy`, `deleteBudgetPolicy`, `insertBudgetIncident`, `getBudgetIncidents`, `insertActivityLogV2`, `getMemoryCount`, `clearSessionForAgent`

### Changed
- `index.ts`: Imports and initializes all v2 modules via registration pattern
- `package.json`: Version 2.0.0

### Architecture
- Zero new runtime dependencies (fetch-based Supabase, REST Discord, dynamic import plugins)
- Registration pattern avoids ESM circular imports
- Dual-write resilience: system works fully offline
- In-memory first: fast queries without DB round-trips

## [v1.0.0] - 2026-03-29

### Changed
- Full Raw Growth branding (banner, README, dashboard, package metadata)
- First branded client-ready release
- Clone URL updated to scanbott/rawclaw

## [v1.1.1] - 2026-03-06

### Added
- Migration system with versioned migration files
- `add-migration` Claude skill for scaffolding new versioned migrations
