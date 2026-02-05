#!/bin/bash
# PostToolUse hook (Bash): Show commit hash after git commit commands
# Ensures Claude always displays the commit hash to the user.

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only trigger for git commit commands
if ! echo "$CMD" | grep -q 'git commit'; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

HASH=$(git log --format='%h' -1 2>/dev/null)
SUBJECT=$(git log --format='%s' -1 2>/dev/null)

if [ -n "$HASH" ]; then
  echo "COMMIT: $HASH - $SUBJECT"
  echo "IMPORTANT: You MUST display this commit hash prominently to the user."
fi
