#!/bin/bash
# PreToolUse hook (Bash): Block destructive commands unless explicitly requested
# Covers: recursive/forced `rm` (rm -rf, deleting .git), force pushes,
# hard resets, clean -f, checkout/restore discards, branch -D.
# Exit code 2 = block the command (stderr shown to Claude → it must ask you first)

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# ── Filesystem destruction (checked BEFORE the git-only early-exit) ──
# Block: recursive/forced rm (rm -rf, rm -fr, rm -r ... , rm --recursive).
# Catches combined (-rf/-fr), split (-r -f), and long (--recursive) forms.
if echo "$CMD" | grep -qiE '(^|[^[:alnum:]_])rm[[:space:]]+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|-[rf][[:space:]]+-[rf]|-[a-z]*r[a-z]*[[:space:]]|--recursive)'; then
  echo "BLOCKED: recursive/forced 'rm' permanently deletes directory trees (the repo, .git, node_modules, ...). Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Block: any rm targeting a .git directory (destroys repo history).
if echo "$CMD" | grep -qiE '(^|[^[:alnum:]_])rm[[:space:]].*\.git([/[:space:]]|$)'; then
  echo "BLOCKED: this command deletes a .git directory (destroys repo history). Ask the user for explicit confirmation first." >&2
  exit 2
fi

# Only check git commands beyond this point
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
