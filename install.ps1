# ── RawClaw v2 Installer (Windows) ───────────────────────────────────────────
# irm https://raw.githubusercontent.com/Alexthxmpson/rawclaw-v2/main/install.ps1 | iex

$ErrorActionPreference = "Stop"
$InstallDir = "$HOME\rawclaw"

Write-Host ""
Write-Host "  RawClaw v2" -ForegroundColor Cyan -NoNewline
Write-Host " -- Your AI department in a box" -ForegroundColor White
Write-Host "  by Raw Growth (rawgrowth.ai)" -ForegroundColor DarkGray
Write-Host ""

function Fail($msg) { Write-Host "  x  $msg" -ForegroundColor Red; exit 1 }
function Ok($msg)   { Write-Host "  +  $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  !  $msg" -ForegroundColor Yellow }
function Info($msg) { Write-Host "  >  $msg" -ForegroundColor Cyan }

# ── Preflight checks ────────────────────────────────────────────────────────

Info "Checking prerequisites..."
Write-Host ""

# Git
try {
    $gitVersion = (git --version) -replace 'git version ', ''
    Ok "Git $gitVersion"
} catch {
    Fail "Git not found. Install it: https://git-scm.com"
}

# Node.js
try {
    $nodeVersion = (node --version) -replace 'v', ''
    $nodeMajor = [int]($nodeVersion.Split('.')[0])
    if ($nodeMajor -ge 20) {
        Ok "Node.js v$nodeVersion"
    } else {
        Fail "Node.js v20+ required (found v$nodeVersion). Update: https://nodejs.org"
    }
} catch {
    Fail "Node.js not found. Install v20+: https://nodejs.org"
}

# Claude CLI
try {
    $claudeVersion = claude --version 2>$null
    Ok "Claude CLI $claudeVersion"
} catch {
    Warn "Claude CLI not found -- the setup wizard will help you install it"
}

Write-Host ""

# ── Clone ────────────────────────────────────────────────────────────────────

if (Test-Path $InstallDir) {
    Warn "Directory $InstallDir already exists"
    $reply = Read-Host "  Overwrite? [y/N]"
    if ($reply -match '^[Yy]$') {
        Remove-Item -Recurse -Force $InstallDir
    } else {
        Fail "Aborted. Remove or rename $InstallDir and try again."
    }
}

Info "Cloning RawClaw v2..."
git clone --depth 1 https://github.com/Alexthxmpson/rawclaw-v2.git $InstallDir
Ok "Cloned to $InstallDir"

# ── Install dependencies ────────────────────────────────────────────────────

Set-Location $InstallDir
Info "Installing dependencies (npm install)..."
npm install --loglevel=error
Ok "Dependencies installed"

# ── Launch setup wizard ─────────────────────────────────────────────────────

Write-Host ""
Write-Host "  Ready to go!" -ForegroundColor Green -NoNewline
Write-Host " Launching setup wizard..." -ForegroundColor White
Write-Host ""

npx tsx scripts/setup.ts
