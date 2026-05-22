#!/usr/bin/env bash
# Silent auto-sync of anyone-tasks Claude skills.
# Mirrors skill/*/ from the repo to ~/.claude/skills/<name>/.
# Installed by scripts/install.sh; run every 15 min via cron.

set -euo pipefail

REPO_URL="https://github.com/anyonesas/anyone-tasks"
TMP_DIR="$(mktemp -d -t at-sync-XXXX 2>/dev/null || mktemp -d "${TMPDIR:-/tmp}/at-sync-XXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

# Shallow clone with timeout; bail silently on network failure.
if ! git clone --depth 1 --quiet "$REPO_URL" "$TMP_DIR" 2>/dev/null; then
  exit 0
fi

mkdir -p "$HOME/.claude/skills"

if [ -d "$TMP_DIR/skill" ]; then
  for SKILL_DIR in "$TMP_DIR/skill"/*/; do
    [ -d "$SKILL_DIR" ] || continue
    SKILL_NAME="$(basename "$SKILL_DIR")"
    # Use rsync if available; fall back to cp -r.
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --delete "$SKILL_DIR" "$HOME/.claude/skills/$SKILL_NAME/"
    else
      rm -rf "$HOME/.claude/skills/$SKILL_NAME"
      cp -R "$SKILL_DIR" "$HOME/.claude/skills/$SKILL_NAME"
    fi
  done
fi
