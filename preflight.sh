#!/usr/bin/env bash
# ── RawClaw v2.1 Pre-flight Check ───────────────────────────────────────────
# Run this BEFORE install.sh to fix known Mac environment issues
# Usage: curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/preflight.sh | bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

pass()  { echo -e "  ${GREEN}✓${RESET}  $1"; }
fail()  { echo -e "  ${RED}✗${RESET}  $1"; FAILED=1; }
warn()  { echo -e "  ${YELLOW}!${RESET}  $1"; }
info()  { echo -e "  ${CYAN}>${RESET}  $1"; }
FAILED=0

echo ""
echo -e "${BOLD}${CYAN}  RawClaw v2.1 — Pre-flight Check${RESET}"
echo -e "  Fixing known Mac environment issues before install..."
echo ""

# ── 1. macOS version ─────────────────────────────────────────────────────────
if [ "$(uname)" = "Darwin" ]; then
  MACOS_VERSION=$(sw_vers -productVersion)
  MACOS_MAJOR=$(echo "$MACOS_VERSION" | cut -d. -f1)
  if [ "$MACOS_MAJOR" -ge 13 ]; then
    pass "macOS $MACOS_VERSION (Ventura or later)"
  else
    warn "macOS $MACOS_VERSION — recommend upgrading to Ventura (13.0) or later"
  fi
fi

# ── 2. Internet connectivity ──────────────────────────────────────────────────
if curl -fsSL --max-time 5 https://github.com &>/dev/null; then
  pass "Internet connected (GitHub reachable)"
else
  fail "No internet connection — cannot reach GitHub. Check WiFi/ethernet."
fi

# ── 3. Disk space ─────────────────────────────────────────────────────────────
if [ "$(uname)" = "Darwin" ]; then
  FREE_GB=$(df -g / | awk 'NR==2 {print $4}')
  if [ "$FREE_GB" -ge 5 ]; then
    pass "Disk space: ${FREE_GB}GB free"
  else
    warn "Only ${FREE_GB}GB free — recommend at least 5GB for install"
  fi
fi

# ── 4. Xcode CLI tools ────────────────────────────────────────────────────────
if [ "$(uname)" = "Darwin" ]; then
  if xcode-select -p &>/dev/null 2>&1; then
    XCODE_PATH=$(xcode-select -p)
    pass "Xcode CLI tools: $XCODE_PATH"
  else
    warn "Xcode CLI tools broken or not installed — attempting fix..."
    # Reset first (fixes broken state)
    sudo xcode-select --reset 2>/dev/null || true
    # Check again after reset
    if xcode-select -p &>/dev/null 2>&1; then
      pass "Xcode CLI tools: fixed via reset"
    else
      # Need to install
      info "Installing Xcode CLI tools — a popup may appear on screen..."
      info "If a dialog appears, click Install and wait for it to finish."
      echo ""
      xcode-select --install 2>/dev/null || true
      # Wait with timeout (max 20 min)
      WAITED=0
      MAX_WAIT=1200
      while ! xcode-select -p &>/dev/null 2>&1; do
        sleep 10
        WAITED=$((WAITED + 10))
        if [ $((WAITED % 60)) -eq 0 ]; then
          info "Still waiting for Xcode CLI tools... (${WAITED}s elapsed)"
        fi
        if [ $WAITED -ge $MAX_WAIT ]; then
          fail "Xcode CLI tools install timed out after 20 minutes"
          echo ""
          echo -e "  ${YELLOW}Manual fix:${RESET}"
          echo -e "  1. Run: xcode-select --install"
          echo -e "  2. Click Install in the popup"
          echo -e "  3. Wait for completion"
          echo -e "  4. Run this preflight script again"
          echo ""
          break
        fi
      done
      if xcode-select -p &>/dev/null 2>&1; then
        pass "Xcode CLI tools installed: $(xcode-select -p)"
      fi
    fi
  fi
fi

# ── 5. Keychain unlock ────────────────────────────────────────────────────────
if [ "$(uname)" = "Darwin" ]; then
  if security unlock-keychain &>/dev/null 2>&1; then
    pass "Keychain unlocked"
  else
    warn "Keychain requires password — Claude auth may reset over SSH"
    info "To fix permanently, add to ~/.zshrc: security unlock-keychain &>/dev/null 2>&1 || true"
  fi
fi

# ── 6. Existing RawClaw install ───────────────────────────────────────────────
if [ -d "$HOME/rawclaw" ]; then
  warn "Existing RawClaw install found at ~/rawclaw"
  info "The installer will update it (git pull) rather than reinstall from scratch"
else
  pass "No existing install — fresh install will proceed"
fi

# ── 7. Add keychain unlock to shell profile (permanent fix) ───────────────────
if [ "$(uname)" = "Darwin" ]; then
  KEYCHAIN_LINE='security unlock-keychain &>/dev/null 2>&1 || true  # RawClaw: keep keychain unlocked'
  for PROFILE in "$HOME/.zshrc" "$HOME/.bash_profile"; do
    if [ -f "$PROFILE" ] && ! grep -q "RawClaw: keep keychain" "$PROFILE" 2>/dev/null; then
      echo "" >> "$PROFILE"
      echo "$KEYCHAIN_LINE" >> "$PROFILE"
      pass "Added keychain unlock to $PROFILE"
    elif ! [ -f "$PROFILE" ]; then
      echo "$KEYCHAIN_LINE" > "$PROFILE"
      pass "Created $PROFILE with keychain unlock"
    fi
  done
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [ "$FAILED" -eq 0 ]; then
  echo -e "  ${BOLD}${GREEN}All preflight checks passed.${RESET}"
  echo -e "  You're ready to run the installer:"
  echo ""
  echo -e "  ${BOLD}curl -fsSL https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2.1/main/install.sh | bash${RESET}"
else
  echo -e "  ${BOLD}${RED}Some checks failed.${RESET} Fix the issues above then re-run this script."
fi
echo ""
