#!/usr/bin/env bash
# Sync anyone-tasks Claude skills from GitHub.
# Runs at every Claude Code SessionStart (see scripts/install.sh).
# Prints a one-line notice if a skill changed, otherwise silent.

set -euo pipefail

REPO_URL="https://github.com/anyonesas/anyone-tasks"
TMP_DIR="$(mktemp -d -t at-sync-XXXX 2>/dev/null || mktemp -d "${TMPDIR:-/tmp}/at-sync-XXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

# Silent network failure — don't block session start.
if ! git clone --depth 1 --quiet "$REPO_URL" "$TMP_DIR" 2>/dev/null; then
  exit 0
fi

mkdir -p "$HOME/.claude/skills"
UPDATED=""

if [ -d "$TMP_DIR/skill" ]; then
  for SKILL_DIR in "$TMP_DIR/skill"/*/; do
    [ -d "$SKILL_DIR" ] || continue
    SKILL_NAME="$(basename "$SKILL_DIR")"
    DEST="$HOME/.claude/skills/$SKILL_NAME"

    if [ ! -d "$DEST" ] || ! diff -rq "$SKILL_DIR" "$DEST" >/dev/null 2>&1; then
      if command -v rsync >/dev/null 2>&1; then
        rsync -a --delete "$SKILL_DIR" "$DEST/"
      else
        rm -rf "$DEST"
        cp -R "$SKILL_DIR" "$DEST"
      fi
      UPDATED="${UPDATED} /$SKILL_NAME"
    fi
  done
fi

if [ -n "$UPDATED" ]; then
  echo "✓ anyone-tasks — skill mis à jour :${UPDATED}"
fi
