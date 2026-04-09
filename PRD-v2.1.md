# RawClaw v2.1 — Product Requirements Document

**Version:** 2.1.0
**Date:** 2026-04-02
**Author:** Alexander Alberts (CTO, Raw Growth)
**Status:** Active — Phase 1 in progress

---

## Background

RawClaw v2 was tested in a live client install with Dineline (Brett Linkletter, Chris West) on 2026-04-01. The install took ~3 hours due to environmental issues on the Mac Mini that the installer did not anticipate or handle. v2.1 fixes these issues so future installs are fast, reliable, and require minimal human relay.

### Root causes from the Dineline install session:
1. Xcode CLI tools were in a broken state — installer hung silently in polling loop
2. No pre-flight checks — installer assumed clean environment
3. Installer was not idempotent — re-running it from scratch was risky
4. Claude keychain auth resets over SSH — had to re-login every disconnect
5. No progress visibility — Alexander had to relay through Chris to know what was happening
6. TinyURL was dead — one-liner broke before install even started
7. npm install failures not caught — script continued with broken dependencies
8. No post-install verification — no way to confirm everything worked

---

## Goals for v2.1

- Fresh Mac Mini install completes in under 30 minutes with zero debugging
- Installer handles all known Mac environment issues automatically
- Claude auth persists across SSH sessions without manual re-login
- Alexander gets real-time progress via Telegram during install
- Post-install test suite confirms everything is working before handoff
- Re-running the installer is safe and skips completed steps

---

## Phase 1 — Installer Reliability (THIS VERSION)

### 1.1 Pre-flight Script (`preflight.sh`)

Standalone script run before the main installer. Fixes all known Mac environment issues.

**Checks and fixes:**
- Xcode CLI tools: detect broken state, run `sudo xcode-select --reset`, wait for proper install with visual progress
- Keychain: unlock default keychain silently
- macOS version: warn if below Ventura (13.0)
- Internet connectivity: verify before attempting any downloads
- Disk space: warn if under 5GB free
- Existing installation: detect and report cleanly

**Output:** Clear pass/fail for each check. Exits with instructions if something needs manual intervention.

**Usage:**
```bash
curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/preflight.sh | bash
```

---

### 1.2 Idempotent Installer

Re-running `install.sh` is safe. Each step checks if it's already complete before running.

**Step state checks:**
- Xcode: `xcode-select -p` returns valid path → skip
- Git: already installed → skip
- Homebrew: already installed → skip
- Node.js: v20+ already installed → skip
- Claude CLI: already installed → skip
- Tailscale: already installed → skip
- Cloudflared: already installed → skip
- Repo: already cloned → `git pull` instead of fresh clone
- npm deps: `node_modules` exists and is valid → skip
- Claude auth: credentials exist → skip login

---

### 1.3 Keychain Persistence Fix

During setup, add keychain unlock to shell profile so Claude auth persists across SSH sessions.

**Added to `~/.zshrc` and `~/.bash_profile`:**
```bash
# RawClaw: keep keychain unlocked for Claude CLI
security unlock-keychain &>/dev/null 2>&1 || true
```

---

### 1.4 Installer Progress → Telegram

If `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are available (from `.env` or environment), installer sends progress messages at key milestones.

**Messages sent:**
- Install started (machine name, macOS version)
- Each major step: Xcode, Node, Claude CLI, clone, deps, wizard launch
- Any errors with full context
- Install complete with summary

**Fallback:** If Telegram not configured, progress prints to terminal only. Install never blocks on Telegram.

---

### 1.5 npm Install Error Handling

Currently `install.sh` line 186 runs npm install with no exit code check. Fixed to:
```bash
npm install --loglevel=error 2>&1 || fail "npm install failed — check Node.js version and disk space"
```

---

### 1.6 Post-Install Test Suite (`scripts/verify.sh`)

Runs automatically after setup wizard completes. 5 checks, clear pass/fail.

**Tests:**
1. Claude CLI responds (`claude --version`)
2. Supabase connection valid (test query to `knowledge_items`)
3. RawClaw server starts and responds on port (`curl localhost:PORT/health`)
4. Cloudflare tunnel URL is live (if configured)
5. Keychain unlock works over SSH (simulate SSH context)

**Output:**
```
  ✓  Claude CLI v1.x.x
  ✓  Supabase connected (oeqrkrqcyiyvtjnslurb)
  ✓  RawClaw server healthy (port 3000)
  ✓  Tunnel live: https://xxx.trycloudflare.com
  ✓  Keychain auth persists

  5/5 checks passed. RawClaw is ready.
```

---

### 1.7 Updated One-Liner

TinyURL removed. One-liner now uses raw GitHub URL directly:

```bash
curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/install.sh | bash
```

Optional preflight first:
```bash
curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/preflight.sh | bash && curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/install.sh | bash
```

---

## Phase 2 — Remote Management (NEXT VERSION)

- SSH key auth (team public keys injected during install)
- Auto-restart via launchd with crash loop protection + Telegram alert
- Health dashboard (local, Cloudflare tunneled)
- Web terminal via `ttyd`

## Phase 3 — Client Experience (FUTURE)

- Welcome email auto-sent after install (Resend API)
- Client status page on Vercel
- Named machine identity

## Phase 4 — Scaling (FUTURE)

- YAML config per client (pre-filled, no manual prompts)
- Central dashboard for all client Mac Minis
- Multi-seat parallel installer

## Phase 5 — Polish (v3)

- GUI installation wizard (.pkg)
- MDM pre-configuration for headless first boot
- Apple Business Manager enrollment

---

## Success Metrics

- Next install (Jace's Mac Mini): completes in under 30 minutes
- Zero "what does it say?" relay messages during install
- Post-install test suite: 5/5 pass on first attempt
- Claude auth persists after SSH reconnect

---

## Key Files

| File | Purpose |
|------|---------|
| `preflight.sh` | Pre-install environment check and fix |
| `install.sh` | Main installer (idempotent) |
| `scripts/setup.ts` | Interactive setup wizard |
| `scripts/verify.sh` | Post-install test suite |
| `PRD-v2.1.md` | This document |
| `CHANGELOG.md` | Version history |
