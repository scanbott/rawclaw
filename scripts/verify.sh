#!/usr/bin/env bash
# ── RawClaw v2.1 Post-Install Verification ───────────────────────────────────
# Runs 5 checks to confirm everything is working after setup
# Called automatically at end of setup wizard, or run manually:
#   bash ~/rawclaw/scripts/verify.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

PASSED=0
FAILED=0
INSTALL_DIR="$HOME/rawclaw"
ENV_FILE="$INSTALL_DIR/.env"

pass()  { echo -e "  ${GREEN}✓${RESET}  $1"; PASSED=$((PASSED + 1)); }
fail()  { echo -e "  ${RED}✗${RESET}  $1"; FAILED=$((FAILED + 1)); }
warn()  { echo -e "  ${YELLOW}!${RESET}  $1"; }
info()  { echo -e "  ${CYAN}>${RESET}  $1"; }

echo ""
echo -e "  ${BOLD}RawClaw v2.1 — Post-Install Verification${RESET}"
echo ""

# Load .env if present
if [ -f "$ENV_FILE" ]; then
  set -a && source "$ENV_FILE" 2>/dev/null && set +a
fi

# ── Check 1: Claude CLI ───────────────────────────────────────────────────────
CLAUDE_VER=$(claude --version 2>/dev/null | head -1 || echo "")
if [ -n "$CLAUDE_VER" ]; then
  pass "Claude CLI: $CLAUDE_VER"
else
  fail "Claude CLI not found — run: npm install -g @anthropic-ai/claude-code"
fi

# ── Check 2: Keychain unlocked (Claude auth persists over SSH) ────────────────
if security unlock-keychain &>/dev/null 2>&1; then
  pass "Keychain unlocked (Claude auth will persist over SSH)"
else
  warn "Keychain needs password — Claude may ask for login after SSH reconnect"
  FAILED=$((FAILED + 1))
fi

# ── Check 3: Supabase connection ──────────────────────────────────────────────
if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_KEY:-}" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/rest/v1/knowledge_items?select=id&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    --max-time 10 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "206" ]; then
    PROJ=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d. -f1)
    pass "Supabase connected ($PROJ)"
  else
    fail "Supabase connection failed (HTTP $HTTP_CODE) — check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env"
  fi
else
  warn "Supabase not configured — skipping (set SUPABASE_URL + SUPABASE_SERVICE_KEY in .env)"
fi

# ── Check 4: RawClaw server health ────────────────────────────────────────────
PORT="${PORT:-3000}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/health" --max-time 5 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  pass "RawClaw server healthy (port $PORT)"
else
  # Try to start it briefly to check if it can start
  if [ -f "$INSTALL_DIR/dist/bot.js" ] || [ -f "$INSTALL_DIR/src/bot.ts" ]; then
    warn "RawClaw server not running (port $PORT) — start with: npm start"
  else
    fail "RawClaw server files missing — reinstall may be needed"
  fi
fi

# ── Check 5: Cloudflare tunnel ────────────────────────────────────────────────
if command -v cloudflared &>/dev/null; then
  TUNNEL_RUNNING=$(pgrep -f cloudflared | head -1 || echo "")
  if [ -n "$TUNNEL_RUNNING" ]; then
    pass "Cloudflare tunnel running (PID $TUNNEL_RUNNING)"
  else
    warn "Cloudflare tunnel not active — start with: cloudflared tunnel --config /dev/null run"
  fi
else
  warn "Cloudflared not installed — dashboard tunnel unavailable"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
TOTAL=$((PASSED + FAILED))
if [ "$FAILED" -eq 0 ]; then
  echo -e "  ${BOLD}${GREEN}${PASSED}/${TOTAL} checks passed. RawClaw is ready.${RESET}"
else
  echo -e "  ${BOLD}${YELLOW}${PASSED}/${TOTAL} checks passed.${RESET} Fix the issues above."
fi
echo ""
