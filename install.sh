#!/usr/bin/env bash
# ── RawClaw v2.1 Installer ───────────────────────────────────────────────────
# curl -fsSL https://raw.githubusercontent.com/scanbott/rawclaw/main/install.sh | bash
#
# v2.1 improvements:
#   - Idempotent: re-running skips completed steps safely
#   - Xcode: detects broken state, resets automatically before install
#   - Keychain: unlocks + persists across SSH sessions permanently
#   - npm: exits on failure instead of continuing silently
#   - Telegram: sends progress updates during install (optional)
#   - Clone: git pull on existing install instead of wiping

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

INSTALL_DIR="$HOME/rawclaw"
REPO_URL="https://github.com/scanbott/rawclaw.git"
VERSION="2.1.0"

echo ""
echo -e "${BOLD}${CYAN}"
echo "  ██████╗  █████╗ ██╗    ██╗  ██████╗██╗      █████╗ ██╗    ██╗"
echo "  ██╔══██╗██╔══██╗██║    ██║ ██╔════╝██║     ██╔══██╗██║    ██║"
echo "  ██████╔╝███████║██║ █╗ ██║ ██║     ██║     ███████║██║ █╗ ██║"
echo "  ██╔══██╗██╔══██║██║███╗██║ ██║     ██║     ██╔══██║██║███╗██║"
echo "  ██║  ██║██║  ██║╚███╔███╔╝ ╚██████╗███████╗██║  ██║╚███╔███╔╝"
echo "  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝"
echo -e "${RESET}"
echo -e "  ${BOLD}Your AI department in a box${RESET} -- by Raw Growth  ${CYAN}v${VERSION}${RESET}"
echo ""

fail() { echo -e "  ${RED}✗${RESET}  $1"; tg_notify "Install failed: $1"; exit 1; }
ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $1"; }
info() { echo -e "  ${CYAN}>${RESET}  $1"; }
skip() { echo -e "  ${GREEN}-${RESET}  $1 ${CYAN}(already done)${RESET}"; }

# ── Telegram progress notifications (optional) ───────────────────────────────
TG_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TG_CHAT="${TELEGRAM_CHAT_ID:-}"
if [ -z "$TG_TOKEN" ] && [ -f "$INSTALL_DIR/.env" ]; then
  TG_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "$INSTALL_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
  TG_CHAT=$(grep '^TELEGRAM_CHAT_ID=' "$INSTALL_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)
fi
tg_notify() {
  if [ -n "$TG_TOKEN" ] && [ -n "$TG_CHAT" ]; then
    MACHINE=$(hostname -s 2>/dev/null || echo "Mac Mini")
    curl -fsSL -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
      -d "chat_id=${TG_CHAT}" -d "text=RawClaw [${MACHINE}]: $1" &>/dev/null 2>&1 || true
  fi
}

MACHINE_NAME=$(hostname -s 2>/dev/null || echo "Mac Mini")
tg_notify "Install started on ${MACHINE_NAME}"

# ── Preflight checks ─────────────────────────────────────────────────────────

info "Checking prerequisites..."
echo ""

# Xcode CLI tools (macOS only)
if [ "$(uname)" = "Darwin" ]; then
  # Fix broken Xcode state before checking (common on fresh Mac Minis)
  if ! xcode-select -p &>/dev/null 2>&1; then
    info "Xcode CLI tools broken state detected — resetting..."
    sudo xcode-select --reset 2>/dev/null || true
    sleep 2
  fi

  if xcode-select -p &>/dev/null 2>&1; then
    skip "Xcode CLI tools ($(xcode-select -p))"
  else
    info "Installing Xcode Command Line Tools (this may take a few minutes)..."
    info "If a popup appears on screen, click Install."
    xcode-select --install 2>/dev/null || true
    WAITED=0
    MAX_WAIT=1200
    while ! xcode-select -p &>/dev/null 2>&1; do
      sleep 10
      WAITED=$((WAITED + 10))
      if [ $((WAITED % 60)) -eq 0 ]; then
        info "Waiting for Xcode CLI tools... (${WAITED}s)"
      fi
      if [ $WAITED -ge $MAX_WAIT ]; then
        fail "Xcode CLI tools timed out. Run 'xcode-select --install' manually then retry."
      fi
    done
    ok "Xcode CLI tools installed"
    tg_notify "Xcode CLI tools installed"
  fi
fi

# Git
if command -v git &>/dev/null; then
  skip "Git $(git --version | awk '{print $3}')"
else
  fail "Git not found. Install it: https://git-scm.com"
fi

# Homebrew (macOS)
if [ "$(uname)" = "Darwin" ]; then
  if command -v brew &>/dev/null; then
    skip "Homebrew $(brew --version 2>/dev/null | head -1 | awk '{print $2}')"
  else
    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/tty
    if [ -f /opt/homebrew/bin/brew ]; then eval "$(/opt/homebrew/bin/brew shellenv)"; fi
    if [ -f /usr/local/bin/brew ]; then eval "$(/usr/local/bin/brew shellenv)"; fi
    command -v brew &>/dev/null && ok "Homebrew installed" || warn "Homebrew may need a terminal restart"
  fi
fi

# Node.js
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    skip "Node.js $(node --version)"
  else
    info "Node.js $(node --version) too old — upgrading to v22..."
    if command -v brew &>/dev/null; then
      brew install node@22 2>&1 | tail -1 && brew link --overwrite node@22 2>/dev/null || true
    fi
    ok "Node.js $(node --version)"
  fi
else
  info "Installing Node.js v22..."
  if [ "$(uname)" = "Darwin" ] && command -v brew &>/dev/null; then
    brew install node@22 2>&1 | tail -1 && brew link --overwrite node@22 2>/dev/null || true
  elif [ "$(uname)" = "Darwin" ]; then
    fail "Cannot install Node.js without Homebrew. Install Homebrew first: https://brew.sh"
  else
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>&1 | tail -1
    apt-get install -y nodejs 2>&1 | tail -1
  fi
  command -v node &>/dev/null || fail "Could not install Node.js. Install manually: https://nodejs.org"
  ok "Node.js $(node --version)"
  tg_notify "Node.js $(node --version) installed"
fi

# Claude CLI
if command -v claude &>/dev/null; then
  skip "Claude CLI $(claude --version 2>/dev/null || echo '(installed)')"
else
  info "Installing Claude Code CLI..."
  npm install -g @anthropic-ai/claude-code 2>&1 | tail -1
  command -v claude &>/dev/null || fail "Could not install Claude CLI. Run: npm install -g @anthropic-ai/claude-code"
  ok "Claude CLI installed"
  tg_notify "Claude CLI installed"
fi

echo ""

# ── Keychain persistence fix (macOS) ─────────────────────────────────────────
# Unlocks keychain so Claude auth persists across SSH sessions
if [ "$(uname)" = "Darwin" ]; then
  KEYCHAIN_LINE='security unlock-keychain &>/dev/null 2>&1 || true  # RawClaw: keep keychain unlocked for Claude'
  for PROFILE in "$HOME/.zshrc" "$HOME/.bash_profile"; do
    if [ -f "$PROFILE" ] && ! grep -q "RawClaw: keep keychain" "$PROFILE" 2>/dev/null; then
      echo "" >> "$PROFILE" && echo "$KEYCHAIN_LINE" >> "$PROFILE"
    elif ! [ -f "$PROFILE" ]; then
      echo "$KEYCHAIN_LINE" > "$PROFILE"
    fi
  done
  security unlock-keychain &>/dev/null 2>&1 || true
fi

# ── Tailscale ─────────────────────────────────────────────────────────────────

if command -v tailscale &>/dev/null; then
  TS_IP=$(tailscale ip -4 2>/dev/null || echo "")
  [ -n "$TS_IP" ] && skip "Tailscale connected ($TS_IP)" || skip "Tailscale installed"
else
  info "Installing Tailscale (for remote SSH access)..."
  curl -fsSL https://tailscale.com/install.sh | sh 2>&1 | tail -3
  if command -v tailscale &>/dev/null; then
    ok "Tailscale installed — run 'sudo tailscale up --ssh' to connect"
    tg_notify "Tailscale installed"
  else
    warn "Tailscale install failed — install manually: https://tailscale.com/download"
  fi
fi

# ── Cloudflared ───────────────────────────────────────────────────────────────

if command -v cloudflared &>/dev/null; then
  skip "Cloudflared ($(cloudflared --version 2>/dev/null | head -1 | awk '{print $3}' || echo 'installed'))"
else
  info "Installing cloudflared (for dashboard tunnel)..."
  if [ "$(uname)" = "Darwin" ] && command -v brew &>/dev/null; then
    brew install cloudflare/cloudflare/cloudflared 2>&1 | tail -1
  elif [ "$(uname)" != "Darwin" ]; then
    ARCH=$(uname -m)
    CF_ARCH="amd64"
    [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ] && CF_ARCH="arm64"
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" \
      -o /tmp/cloudflared && chmod +x /tmp/cloudflared && sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
  fi
  command -v cloudflared &>/dev/null && ok "Cloudflared installed" || warn "Cloudflared install failed — dashboard localhost only"
fi

# ── Enable Screen Sharing + Prevent Sleep (macOS) ─────────────────────────────
if [ "$(uname)" = "Darwin" ]; then
  info "Enabling remote screen sharing (VNC)..."
  sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -activate -configure -access -on -allowAccessFor -allUsers -privs -all &>/dev/null 2>&1 && ok "Screen Sharing enabled (VNC)" || warn "Screen Sharing setup failed — enable manually in System Settings"
  info "Preventing Mac from sleeping..."
  sudo pmset -a disablesleep 1 &>/dev/null 2>&1
  sudo pmset -a disksleep 0 &>/dev/null 2>&1
  sudo pmset -a displaysleep 0 &>/dev/null 2>&1
  sudo pmset -a sleep 0 &>/dev/null 2>&1
  ok "Sleep disabled (Mac stays awake 24/7)"
fi

echo ""

# ── Clone or update ───────────────────────────────────────────────────────────

if [ -d "$INSTALL_DIR/.git" ]; then
  info "RawClaw already installed — pulling latest updates..."
  cd "$INSTALL_DIR" && git pull --ff-only 2>&1 | tail -1
  ok "Updated to latest"
  tg_notify "RawClaw updated"
else
  [ -d "$INSTALL_DIR" ] && { warn "Removing non-git directory at $INSTALL_DIR..."; rm -rf "$INSTALL_DIR"; }
  info "Cloning RawClaw v2.1..."
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>&1 | tail -1 || fail "Clone failed — check internet connection"
  ok "Cloned to $INSTALL_DIR"
  tg_notify "RawClaw cloned"
fi

# ── Install dependencies ──────────────────────────────────────────────────────

cd "$INSTALL_DIR"
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
  skip "npm dependencies (already installed)"
else
  info "Installing dependencies..."
  npm install --loglevel=error 2>&1 || fail "npm install failed — check Node.js version and disk space"
  ok "Dependencies installed"
  tg_notify "npm dependencies installed"
fi

echo ""

# ── Claude login ──────────────────────────────────────────────────────────────

info "Checking Claude authentication..."
security unlock-keychain &>/dev/null 2>&1 || true

CLAUDE_AUTHED=false
if [ -d "$HOME/.claude" ] && ls "$HOME/.claude/" 2>/dev/null | grep -qE 'auth|credentials|oauth|settings'; then
  CLAUDE_AUTHED=true
fi

if [ "$CLAUDE_AUTHED" = true ]; then
  skip "Claude already authenticated"
else
  echo ""
  echo -e "  ${BOLD}Claude login required.${RESET}"
  echo -e "  This opens a browser window. Log in with your Anthropic account."
  echo ""
  claude login </dev/tty
  ok "Claude authenticated"
  tg_notify "Claude authenticated"
fi

echo ""

# ── Done — launch setup wizard ────────────────────────────────────────────────

tg_notify "Launching setup wizard on ${MACHINE_NAME}..."
echo -e "  ${BOLD}${GREEN}Dependencies ready.${RESET} Launching setup wizard..."
echo ""

exec npx tsx scripts/setup.ts </dev/tty
