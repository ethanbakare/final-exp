#!/bin/bash
# Stop hook: Check for uncommitted changes after every Claude response
# Reminds Claude to commit if there are pending changes.

cd "$CLAUDE_PROJECT_DIR" || exit 0

STAGED=$(git diff --cached --stat 2>/dev/null)
UNSTAGED=$(git diff --stat HEAD 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | grep -v node_modules | head -10)

if [ -n "$STAGED" ] || [ -n "$UNSTAGED" ] || [ -n "$UNTRACKED" ]; then
  echo "UNCOMMITTED CHANGES DETECTED"
  echo "You MUST commit these changes before moving to the next task."
  echo "After committing, show the commit hash to the user."
  echo "---"
  if [ -n "$UNSTAGED" ]; then
    echo "Modified files:"
    echo "$UNSTAGED"
  fi
  if [ -n "$STAGED" ]; then
    echo "Staged files:"
    echo "$STAGED"
  fi
  if [ -n "$UNTRACKED" ]; then
    echo "Untracked files:"
    echo "$UNTRACKED"
  fi
fi
