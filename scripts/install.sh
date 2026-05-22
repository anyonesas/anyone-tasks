#!/usr/bin/env bash
# anyone-tasks skill installer + SessionStart auto-sync hook.
# Usage: curl -fsSL https://raw.githubusercontent.com/anyonesas/anyone-tasks/main/scripts/install.sh | bash

set -euo pipefail

SCRIPT_PATH="$HOME/.claude/anyone-tasks-sync.sh"
SETTINGS_PATH="$HOME/.claude/settings.json"
CRON_TAG="anyone-tasks-sync"

# 1) Drop the sync script
mkdir -p "$HOME/.claude"
curl -fsSL https://raw.githubusercontent.com/anyonesas/anyone-tasks/main/scripts/anyone-tasks-sync.sh -o "$SCRIPT_PATH"
chmod +x "$SCRIPT_PATH"
echo "✓ Sync script installed at $SCRIPT_PATH"

# 2) First sync — pulls skills now so /ask works immediately
"$SCRIPT_PATH" || true
echo "✓ Skills synced to ~/.claude/skills/"

# 3) Register the SessionStart hook in ~/.claude/settings.json (merges with existing settings)
python3 - "$SETTINGS_PATH" "$SCRIPT_PATH" <<'PY'
import json, os, sys
settings_path, script_path = sys.argv[1], sys.argv[2]
try:
    with open(settings_path) as f:
        cfg = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    cfg = {}

hooks = cfg.setdefault("hooks", {})
events = hooks.setdefault("SessionStart", [])

# Remove any prior entry pointing at our script (idempotent).
def is_ours(group):
    for h in (group.get("hooks") or []):
        if h.get("command", "").strip() == script_path:
            return True
    return False

events[:] = [g for g in events if not is_ours(g)]

# Add a fresh entry (no matcher = runs on every SessionStart kind: startup / resume / clear / compact).
events.append({
    "hooks": [
        {"type": "command", "command": script_path}
    ]
})

os.makedirs(os.path.dirname(settings_path), exist_ok=True)
with open(settings_path, "w") as f:
    json.dump(cfg, f, indent=2)
print(f"✓ SessionStart hook registered in {settings_path}")
PY

# 4) Migration : strip any old cron entry left over from the previous installer.
if command -v crontab >/dev/null 2>&1; then
  if crontab -l 2>/dev/null | grep -q "$CRON_TAG"; then
    crontab -l 2>/dev/null | grep -v "$CRON_TAG" | crontab -
    echo "✓ Old cron entry removed (now handled by Claude Code SessionStart hook)"
  fi
fi

echo ""
echo "Setup OK. Redémarre Claude Code — à chaque lancement, si le skill a changé sur GitHub, tu verras un message en haut de la session."
