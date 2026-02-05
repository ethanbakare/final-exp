#!/bin/bash
# PreCompact hook: Inject project context before context compaction
# Preserves key information that would otherwise be lost in long sessions:
# - Recent git history (last 10 commits)
# - Current file structure of active project areas
# - Key architectural decisions
# - Any uncommitted or in-progress work

cd "$CLAUDE_PROJECT_DIR" || exit 0

echo "=== PROJECT CONTEXT SNAPSHOT (pre-compaction) ==="
echo ""

# 1. Recent git history (last 10 commits with files changed)
echo "--- RECENT COMMITS (last 10) ---"
git log --oneline --stat --no-merges -10 2>/dev/null
echo ""

# 2. Current branch and status
echo "--- CURRENT STATE ---"
echo "Branch: $(git branch --show-current 2>/dev/null)"
UNCOMMITTED=$(git diff --stat HEAD 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | grep -v node_modules | head -15)
if [ -n "$UNCOMMITTED" ]; then
  echo "Uncommitted changes:"
  echo "$UNCOMMITTED"
fi
if [ -n "$UNTRACKED" ]; then
  echo "Untracked files:"
  echo "$UNTRACKED"
fi
echo ""

# 3. Voice interface project structure (active working area)
echo "--- VOICEINTERFACE FILE STRUCTURE ---"
find src/projects/voiceinterface -type f -name '*.ts' -o -name '*.tsx' -o -name '*.css' 2>/dev/null | sort
echo ""

# 4. Key architectural notes
echo "--- KEY ARCHITECTURE NOTES ---"
echo "- OpenAI Realtime uses @openai/agents-realtime SDK with WebRTC transport"
echo "- Event system: transport_event passthrough for raw API events (VAD, audio buffer)"
echo "- Session-level audio_start/audio_stopped do NOT fire in WebRTC mode"
echo "- Use output_audio_buffer.started/stopped for AI speaking state"
echo "- Dual Web Audio API AnalyserNodes: mic input + AI audio output"
echo "- Shared mic stream (single getUserMedia) for both SDK and visualization"
echo "- Echo fix: AI analyser must NOT connect to AudioContext.destination"
echo "- VelvetOrb: CoralStoneTorusDamped torus with pulsing (goal 0/1 toggle) for ai_thinking"
echo "- See REALTIME_EVENT_SYSTEM_FIX.md for full SDK event documentation"
echo ""

# 5. Active plan files (if any)
echo "--- ACTIVE PLANS ---"
for plan in "$HOME/.claude/plans"/*.md; do
  if [ -f "$plan" ]; then
    PLANNAME=$(basename "$plan")
    FIRST_LINE=$(head -1 "$plan" 2>/dev/null)
    echo "- $PLANNAME: $FIRST_LINE"
  fi
done
echo ""

echo "=== END PROJECT CONTEXT ==="
