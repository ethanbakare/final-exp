#!/bin/bash
# PreToolUse hook (Bash): Block destructive git commands unless explicitly requested
# Prevents accidental data loss from force pushes, hard resets, etc.
# Exit code 2 = block the command (stderr shown to Claude)

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Debug: Log what we received
echo "[DEBUG] CMD received: $CMD" >> /tmp/hook-debug.log

# Only check git commands
if ! echo "$CMD" | grep -q 'git '; then
  exit 0
fi

# Block: git push --force / -f (to any branch)
if echo "$CMD" | grep -qE 'git push\s+.*(-f|--force)'; then
  echo "BLOCKED: git push --force is destructive. Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Block: git reset --hard
if echo "$CMD" | grep -qE 'git reset\s+--hard'; then
  echo "BLOCKED: git reset --hard discards all uncommitted changes. Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Block: git clean -f
if echo "$CMD" | grep -qE 'git clean\s+.*-f'; then
  echo "BLOCKED: git clean -f permanently deletes untracked files. Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Block: git checkout . (discard all changes)
if echo "$CMD" | grep -qE 'git checkout\s+\.$'; then
  echo "BLOCKED: git checkout . discards all uncommitted changes. Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Block: git restore . (discard all changes)
if echo "$CMD" | grep -qE 'git restore\s+\.$'; then
  echo "BLOCKED: git restore . discards all uncommitted changes. Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Block: git branch -D (force delete)
if echo "$CMD" | grep -qE 'git branch\s+-D'; then
  echo "BLOCKED: git branch -D force-deletes a branch. Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Block: Co-Authored-By: Claude in commit messages
if echo "$CMD" | grep -qiE 'Co-Authored-By:.*Claude'; then
  echo "BLOCKED: Do not include 'Co-Authored-By: Claude' in commit messages." >&2
  exit 2
fi

# Block: Anthropic email addresses in commit messages
if echo "$CMD" | grep -qiE '@anthropic\.com'; then
  echo "BLOCKED: Do not include Anthropic email addresses in commit messages." >&2
  exit 2
fi

exit 0
