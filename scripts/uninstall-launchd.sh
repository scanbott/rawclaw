#!/bin/bash
# Uninstall all RawClaw launchd agents
set -e

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "Uninstalling RawClaw launchd agents..."
echo ""

for plist in "$LAUNCH_AGENTS_DIR"/com.rawclaw.*.plist; do
  [ -f "$plist" ] || continue
  label=$(basename "$plist" .plist)
  echo "Unloading $label..."
  launchctl unload "$plist" 2>/dev/null || true
  rm "$plist"
  echo "  Removed $plist"
done

echo ""
echo "All RawClaw agents uninstalled."
echo "Processes will stop within a few seconds."
