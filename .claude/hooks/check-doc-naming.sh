#!/bin/bash
# PreToolUse hook (Write): Check MD file naming convention in 00_documentation folders
# Pattern: {PROJECT}{NUMBER}_{TYPE}_{DESCRIPTIVE_NAME}.md
# Example: VI01_IMPL_REALTIME_EVENT_SYSTEM.md
# Exit code 2 = block the command (stderr shown to Claude)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check .md files
if ! echo "$FILE_PATH" | grep -qE '\.md$'; then
  exit 0
fi

# Only check files in 00_documentation folders
if ! echo "$FILE_PATH" | grep -q '/00_documentation/'; then
  exit 0
fi

# Get just the filename
FILENAME=$(basename "$FILE_PATH")

# Allow README files (e.g., 00_DOC_README.md)
if echo "$FILENAME" | grep -qiE 'README'; then
  exit 0
fi

# Valid type prefixes (after project+number)
VALID_TYPES="IMPL|BUG|DESIGN|REF|SPEC"

# Check pattern: {LETTERS}{NUMBERS}_{TYPE}_{NAME}.md
# Examples: VI01_IMPL_NAME.md, TR02_BUG_ISSUE.md
if ! echo "$FILENAME" | grep -qE '^[A-Z]{1,3}[0-9]{1,3}_('"$VALID_TYPES"')_[A-Z0-9_]+\.md$'; then
  echo "BLOCKED: MD file in 00_documentation doesn't follow naming convention." >&2
  echo "" >&2
  echo "Expected pattern: {PROJECT}{NUMBER}_{TYPE}_{NAME}.md" >&2
  echo "  - PROJECT: 1-3 letters (e.g., VI for Voice Interface, TR for Trace)" >&2
  echo "  - NUMBER: 1-3 digits (e.g., 01, 02)" >&2
  echo "  - TYPE: IMPL, BUG, DESIGN, REF, or SPEC" >&2
  echo "  - NAME: UPPERCASE_WITH_UNDERSCORES" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  VI01_IMPL_REALTIME_EVENT_SYSTEM.md" >&2
  echo "  VI02_BUG_CONNECTION_RACE_CONDITION.md" >&2
  echo "" >&2
  echo "Got: $FILENAME" >&2
  echo "" >&2
  echo "Ask the user to confirm the correct naming for this file." >&2
  echo "Also remember to update the README file after creating new docs." >&2
  exit 2
fi

# Remind about README update
echo "REMINDER: Update the 00_DOC_README.md after creating this file." >&2
exit 0
