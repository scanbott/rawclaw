#!/usr/bin/env bash
# Starts a Cloudflare quick tunnel for the dashboard and writes the URL to .env
# Called automatically by npm start/dev if cloudflared is installed

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STORE_DIR="$PROJECT_ROOT/store"
ENV_FILE="$PROJECT_ROOT/.env"
TUNNEL_LOG="$STORE_DIR/tunnel.log"
TUNNEL_PID_FILE="$STORE_DIR/tunnel.pid"

# Check if cloudflared exists first
if ! command -v cloudflared &>/dev/null; then
  exit 0
fi

mkdir -p "$STORE_DIR"

# Read dashboard port from .env (default 3141)
DASH_PORT=$(grep -E '^DASHBOARD_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2)
DASH_PORT=${DASH_PORT:-3141}

# Kill any existing tunnel
if [ -f "$TUNNEL_PID_FILE" ]; then
  OLD_PID=$(cat "$TUNNEL_PID_FILE")
  kill "$OLD_PID" 2>/dev/null || true
  rm -f "$TUNNEL_PID_FILE"
fi
pkill -f "cloudflared tunnel.*localhost:$DASH_PORT" 2>/dev/null || true

# Clear old tunnel log so we don't pick up a stale URL
rm -f "$TUNNEL_LOG"

# Start quick tunnel in background
# --config /dev/null forces cloudflared to ignore any existing ~/.cloudflared/config.yml
# (prevents named tunnels from hijacking the quick tunnel)
cloudflared tunnel --config /dev/null --url "http://localhost:$DASH_PORT" --logfile "$TUNNEL_LOG" &>/dev/null &
TUNNEL_PID=$!
echo "$TUNNEL_PID" > "$TUNNEL_PID_FILE"

# Wait for URL (up to 15s)
for i in $(seq 1 30); do
  sleep 0.5
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    # Update DASHBOARD_URL in .env
    if grep -q '^DASHBOARD_URL=' "$ENV_FILE" 2>/dev/null; then
      sed -i.bak "s|^DASHBOARD_URL=.*|DASHBOARD_URL=$URL|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    elif grep -q '^# DASHBOARD_URL=' "$ENV_FILE" 2>/dev/null; then
      sed -i.bak "s|^# DASHBOARD_URL=.*|DASHBOARD_URL=$URL|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
      echo "DASHBOARD_URL=$URL" >> "$ENV_FILE"
    fi
    echo "  Dashboard tunnel: $URL"
    exit 0
  fi
done

echo "  Warning: tunnel did not start in time"
