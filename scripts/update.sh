#!/usr/bin/env bash
# RawClaw auto-updater -- runs nightly at 2am via launchd
# Pulls latest from GitHub, rebuilds, restarts all agents

set -e

RAWCLAW_DIR="$HOME/rawclaw"
LOG_DIR="$RAWCLAW_DIR/store"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/update.log"

tg_notify() {
  if [ -n "$TG_TOKEN" ] && [ -n "$TG_CHAT" ]; then
    curl -fsSL -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
      -d "chat_id=${TG_CHAT}" -d "text=RawClaw: $1" &>/dev/null 2>&1 || true
  fi
}

# Load env for Telegram notifications
if [ -f "$RAWCLAW_DIR/.env" ]; then
  TG_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "$RAWCLAW_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
  TG_CHAT=$(grep '^ALLOWED_CHAT_ID=' "$RAWCLAW_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
fi

cd "$RAWCLAW_DIR"

CURRENT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
git fetch origin main --quiet 2>/dev/null || { echo "[$(date)] Fetch failed -- check internet" >> "$LOG"; exit 1; }
LATEST=$(git rev-parse origin/main 2>/dev/null || echo "unknown")

if [ "$CURRENT" = "$LATEST" ]; then
  echo "[$(date)] Already up to date ($CURRENT)." >> "$LOG"
  exit 0
fi

echo "[$(date)] Updating $CURRENT -> $LATEST..." >> "$LOG"
tg_notify "Updating... (this takes ~2 min)"

git pull --ff-only origin main >> "$LOG" 2>&1
npm install --loglevel=error >> "$LOG" 2>&1
npm run build >> "$LOG" 2>&1

# Restart all services
AGENTS=(main scan larry quilly cleo ovi ali sam vinny comms content ops research)
for agent in "${AGENTS[@]}"; do
  LABEL="com.rawclaw.$agent"
  launchctl kickstart -k "gui/$(id -u)/$LABEL" 2>/dev/null || true
done

VERSION=$(node -e "const p=require('./package.json');console.log(p.version)" 2>/dev/null || echo "latest")
tg_notify "Updated to v$VERSION"
echo "[$(date)] Update complete -- v$VERSION." >> "$LOG"
