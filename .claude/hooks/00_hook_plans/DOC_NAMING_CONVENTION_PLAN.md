# Doc Naming Convention Hook - Plan (Shelved)

**Status:** Shelved for later
**Date:** 2026-02-05

## Summary

Hook to enforce MD file naming in `00_documentation` folders.

## Current Pattern (needs refinement)

```
{PROJECT}{NUMBER}_{TYPE}_{NAME}.md
```

Example: `VI01_IMPL_REALTIME_EVENT_SYSTEM.md`

## Types

- `IMPL` - Implementation details
- `BUG` - Bug documentation
- `DSGN` - Design decisions (shortened from DESIGN)
- `REF` - Reference/API docs
- `SPEC` - Specifications

## Open Question: Sorting/Grouping

**Problem:** Current pattern sorts by project+number, not by type. Files like `VI08_REF_...`, `VI09_DSGN_...`, `VI10_BUG_...` don't group by type.

**Option A - Type first:**
```
{TYPE}_{PROJECT}{NUMBER}_{NAME}.md
```
Result: `BUG_VI01_...`, `BUG_VI02_...`, `DSGN_VI01_...` - groups by type

**Option B - Project then type+number:**
```
{PROJECT}_{TYPE}{NUMBER}_{NAME}.md
```
Result: `VI_BUG01_...`, `VI_BUG02_...`, `VI_DSGN01_...`

**Decision needed:** Which sorting is more useful?

## README Requirement

- Each `00_documentation` folder should have a README
- Update README when adding new docs

## Files Already Renamed (Voice Interface)

Current state in `src/projects/voiceinterface/00_documentation/`:
- `VI08_REF_ARCHITECTURE.md`
- `VI09_DSGN_BLOB_REDESIGN.md`
- `VI10_BUG_BLOB_ISSUES.md`
- `VI11_IMPL_REALTIME_EVENT_SYSTEM.md`
- `VI12_DSGN_REACT_DOWNGRADE.md`
- `VI13_BUG_PENDING_CONNECTION_RACE_CONDITION.md`

Old files kept as-is: `A01_*`, `A02_*`, `A03_*`, `V01_*`, `V02_*`, `V03_*`, `V04_*`

## Hook File

The hook script is in this folder: `check-doc-naming.sh`

To reactivate, add to `.claude/settings.json` PreToolUse:
```json
{
  "matcher": "Write",
  "hooks": [
    {
      "type": "command",
      "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/00_hook_plans/check-doc-naming.sh\""
    }
  ]
}
```
