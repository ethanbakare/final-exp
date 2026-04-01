#!/bin/bash
# PostToolUse hook (Edit|Write): Run TypeScript check on modified file
# Runs after every Edit or Write to a .ts/.tsx file.
# Shows only errors relevant to the modified file (filters out pre-existing errors).

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check TypeScript files
if ! echo "$FILE" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

BASENAME=$(basename "$FILE")
cd "$CLAUDE_PROJECT_DIR" || exit 0

# Run tsc and filter to errors in the modified file only
ERRORS=$(npx tsc --noEmit 2>&1 | grep "$BASENAME" || true)

if [ -n "$ERRORS" ]; then
  echo "TYPE ERRORS in $BASENAME:"
  echo "$ERRORS"
  echo "---"
  echo "Fix these errors before proceeding."
else
  echo "TypeScript OK: $BASENAME"
fi
