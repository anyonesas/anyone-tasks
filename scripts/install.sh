#!/usr/bin/env bash
# anyone-tasks skill installer + auto-sync.
# Usage: curl -fsSL https://raw.githubusercontent.com/anyonesas/anyone-tasks/main/scripts/install.sh | bash

set -euo pipefail

SCRIPT_PATH="$HOME/.claude/anyone-tasks-sync.sh"
CRON_TAG="anyone-tasks-sync"
CRON_LINE="*/15 * * * * $SCRIPT_PATH > /dev/null 2>&1"

# 1) Write the sync script
mkdir -p "$HOME/.claude"
curl -fsSL https://raw.githubusercontent.com/anyonesas/anyone-tasks/main/scripts/anyone-tasks-sync.sh -o "$SCRIPT_PATH"
chmod +x "$SCRIPT_PATH"
echo "✓ Sync script installed at $SCRIPT_PATH"

# 2) First sync — fetches skills now so /ask works immediately
"$SCRIPT_PATH"
echo "✓ Skills synced to ~/.claude/skills/"

# 3) Add cron entry (idempotent — strips any old entry first)
if command -v crontab >/dev/null 2>&1; then
  (crontab -l 2>/dev/null | grep -v "$CRON_TAG" || true; echo "$CRON_LINE") | crontab -
  echo "✓ Cron set: sync every 15 min"
else
  echo "⚠ crontab not found — auto-update won't work. Re-run this command when you want to update."
fi

echo ""
echo "Setup OK. Redémarre Claude Code (sors et relance \`claude\` ou \`t3\`) puis tape /ask."
