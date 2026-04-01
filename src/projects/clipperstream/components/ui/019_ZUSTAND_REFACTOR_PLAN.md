# ZUSTAND STATE MANAGEMENT REFACTOR PLAN

**Date**: 2025-12-28
**Status**: READY FOR BUILDER REVIEW
**Context**: After multiple band-aid fixes (v2.5.4 - v2.5.8), we need proper architecture

---

## EXECUTIVE SUMMARY

### What We've Tried (Band-Aids)

**v2.5.4**: Fixed spinner rotation with `activeHttpClipId` ✅
**v2.5.5**: Added batching logic ❌ (never triggered)
**v2.5.6**: Fixed batching flush condition ❌ (clips never reached it)
**v2.5.7**: Added sequential processing with `waitForClipToComplete()` ✅
**v2.5.8**: Fixed `formattedText` check for batching ✅ (partially)

### Current State (v2.5.8)

**✅ What Works**:
- Sequential processing (clips process one at a time)
- Data integrity (all clips have correct content)
- Audio cleanup (blobs deleted after transcription)
- HTTP tracking (spinners show activity)

**❌ What's Broken**:
1. **UI doesn't auto-refresh** - Data exists in sessionStorage but components don't know to re-render
2. **Parent titles stay default** - "Recording 01/02" instead of AI-generated titles
3. **Flickering states** - "Transcribing" ↔ "Waiting to transcribe" visual stutter
4. **Wrong navbar animation** - Expansion animation instead of fade-in for existing clips
5. **Home screen buttons** - Copy/Structure buttons appear where they shouldn't
6. **Inefficient batching** - Each clip batches individually instead of together

### Why Band-Aids Failed

**Root Cause**: Architecture mismatch
- **SessionStorage** = Persistent data layer
- **React State** = What components think the data is
- **No sync mechanism** = Manual `getClips()` calls everywhere

**The Problem**:
```typescript
// Auto-retry updates sessionStorage
updateClip(clipId, { formattedText: "..." }); // ✅ Saves to sessionStorage

// But React components don't know it changed!
const [clips, setClips] = useState(getClips()); // ❌ Stale data

// Need to manually reload
setClips(getClips()); // 🤢 Band-aid
```

---

## THE SOLUTION: ZUSTAND STATE MANAGEMENT

### What is Zustand?

Lightweight React state management library (3kb) that:
- Replaces manual sessionStorage sync
- Auto-triggers re-renders when state changes
- Works with TypeScript
- No Provider/Context boilerplate
- Persists to sessionStorage automatically

### Architecture Change

**Before (Current)**:
```
Component → useState → Manual getClips() → SessionStorage
                          ↑
                          Manual sync required
```

**After (Zustand)**:
```
Component → useClipStore → Zustand Store → SessionStorage
                              ↓
                        Auto-sync, auto-re-render
```

---

## PRE-REFACTOR CHECKPOINT (CRITICAL SAFETY STEP)

**⚠️ DO THIS FIRST - Before installing any packages or making changes**

### Why This Matters

Once you install Zustand and modify `package.json`, it's harder to cleanly revert. Create a safe checkpoint now so you can always return to this working state (v2.5.8) if the refactor goes wrong.

### Create Git Checkpoint

```bash
# Ensure you're on main branch (or your working branch)
git status

# Stage all current changes
git add .

# Create checkpoint commit
git commit -m "chore: checkpoint before Zustand refactor (v2.5.8 baseline)

- Sequential processing working (v2.5.7)
- Batching triggers correctly (v2.5.8)
- All data correct in sessionStorage
- UI issues remain (auto-refresh, titles, flickering)
- Safe restore point before architectural changes"

# Tag this commit for easy reference
git tag -a v2.5.8-pre-zustand -m "Safe checkpoint before Zustand state management refactor"

# Optional: Create feature branch for refactor
git checkout -b feature/zustand-state-management
```

### Verification

```bash
# Confirm checkpoint exists
git log -1 --oneline
# Should show: "chore: checkpoint before Zustand refactor (v2.5.8 baseline)"

# Confirm tag exists
git tag -l "v2.5.8-pre-zustand"
# Should show: v2.5.8-pre-zustand

# Confirm you're on feature branch (if you created one)
git branch
# Should show: * feature/zustand-state-management
```

### How to Revert If Needed

If the Zustand refactor causes issues and you need to go back:

**Option A: Revert to tagged checkpoint (safest)**
```bash
# Discard all changes and return to checkpoint
git reset --hard v2.5.8-pre-zustand

# Clean up any untracked files (like node_modules changes)
git clean -fd

# Reinstall packages to original state
npm install
```

**Option B: Revert just the package.json changes**
```bash
# Only revert Zustand installation
git checkout v2.5.8-pre-zustand -- src/projects/clipperstream/package.json
npm install
```

**Option C: Keep code, remove Zustand**
```bash
# Manually uninstall Zustand
npm uninstall zustand -w @master-exp/clipperstream

# Revert code files that import Zustand
git checkout v2.5.8-pre-zustand -- src/projects/clipperstream/store/
```

### What This Checkpoint Includes

✅ v2.5.7: Sequential processing with `waitForClipToComplete()`
✅ v2.5.8: Fixed `formattedText` check for batching
✅ All current code in working state (data integrity solid)
✅ No package.json changes yet (clean dependency state)

### Builder Instructions

1. **STOP** - Don't skip this step
2. Run the checkpoint commands above
3. Verify the tag exists
4. **THEN** proceed to Installation section below

---

## INSTALLATION (MONOREPO-SPECIFIC)

### Important: Your Monorepo Structure

Based on your [README.md](../../../../../README.md), you have a **true npm workspaces monorepo**:
- Each project in `src/projects/*` has its own `package.json`
- Root `package.json` has `"workspaces": ["src/projects/*"]`
- Projects can have isolated dependencies

### Install Zustand for ClipperStream Only

```bash
cd /Users/ethan/Documents/projects/final-exp
npm install zustand -w @master-exp/clipperstream
```

**Why per-project installation**:
1. ✅ Follows your monorepo philosophy: "Each project maintains isolated dependencies" (README line 7)
2. ✅ Only ClipperStream needs Zustand right now (other 14 projects don't)
3. ✅ Easier to extract ClipperStream as standalone later
4. ✅ npm automatically deduplicates (one copy in `node_modules`, multiple `package.json` references)

**Verification**:
After installation, `src/projects/clipperstream/package.json` should have:
```json
{
  "name": "@master-exp/clipperstream",
  "dependencies": {
    "zustand": "^4.x.x"
  }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Zustand Store (1-2 hours)

**File**: `src/projects/clipperstream/store/clipStore.ts` (new file)

**What it does**:
- Centralizes ALL clip state
- Replaces `useClipState.ts` logic
- Auto-syncs to sessionStorage
- Provides actions (addClip, updateClip, deleteClip)

**Key features**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClipStore {
  clips: Clip[];

  // Actions
  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
  getClipById: (id: string) => Clip | undefined;

  // Auto-retry tracking
  activeHttpClipId: string | null;
  setActiveHttpClipId: (id: string | null) => void;

  // Formatting tracking
  activeFormattingClipId: string | null;
  setActiveFormattingClipId: (id: string | null) => void;
}

export const useClipStore = create<ClipStore>()(
  persist(
    (set, get) => ({
      clips: [],

      addClip: (clip) => set((state) => ({
        clips: [...state.clips, clip]
      })),

      updateClip: (id, updates) => set((state) => ({
        clips: state.clips.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      // ... more actions
    }),
    {
      name: 'clipstream-storage', // sessionStorage key
      version: 1
    }
  )
);
```

**Benefits**:
- ✅ Components auto-re-render when clips change
- ✅ No manual `getClips()` calls
- ✅ SessionStorage sync automatic
- ✅ TypeScript autocomplete for all actions

---

### Phase 2: Replace SessionStorage Calls (2-3 hours)

**Files to Update**:
1. `ClipMasterScreen.tsx`
2. `ClipHomeScreen.tsx`
3. `useClipRecording.ts`
4. `useTranscriptionHandler.ts`
5. `useOfflineRecording.ts`

**Pattern to replace**:

**Before**:
```typescript
// OLD: Manual sessionStorage
import { getClips, updateClip, createClip } from '../utils/clipStorage';

const [clips, setClips] = useState<Clip[]>(getClips());

// Update clip
updateClip(clipId, { formattedText: "..." });
setClips(getClips()); // Manual refresh
```

**After**:
```typescript
// NEW: Zustand store
import { useClipStore } from '../store/clipStore';

const clips = useClipStore((state) => state.clips);
const updateClip = useClipStore((state) => state.updateClip);

// Update clip
updateClip(clipId, { formattedText: "..." }); // Auto-refresh!
```

**Search/Replace checklist**:
- [ ] Replace `getClips()` → `useClipStore((state) => state.clips)`
- [ ] Replace `updateClip()` → `useClipStore((state) => state.updateClip)`
- [ ] Replace `createClip()` → `useClipStore((state) => state.addClip)`
- [ ] Replace `deleteClip()` → `useClipStore((state) => state.deleteClip)`
- [ ] Remove all `setClips(getClips())` manual refresh calls

---

### Phase 3: Remove Global Flags (1 hour)

**Move to Zustand store**:

**Files**:
- `ClipMasterScreen.tsx` line 137: `isFormatting` → Zustand
- `ClipMasterScreen.tsx` line 146: `activeHttpClipId` → Zustand (already exists)

**Before**:
```typescript
// GLOBAL flags (shared across all clips)
const [isFormatting, setIsFormatting] = useState(false);
const [activeHttpClipId, setActiveHttpClipId] = useState<string | null>(null);
```

**After**:
```typescript
// PER-CLIP tracking in Zustand
const activeFormattingClipId = useClipStore((state) => state.activeFormattingClipId);
const setActiveFormattingClipId = useClipStore((state) => state.setActiveFormattingClipId);

const activeHttpClipId = useClipStore((state) => state.activeHttpClipId);
const setActiveHttpClipId = useClipStore((state) => state.setActiveHttpClipId);
```

**Benefits**:
- ✅ No more `isFormatting` blocking all clips
- ✅ Track WHICH clip is formatting (not just "is something formatting")
- ✅ All state in one place (easier to debug)

---

### Phase 4: Add Parent Title Generation (1 hour)

**Problem**: Parents keep default names "Recording 01/02"

**Solution**: Add Zustand subscription to detect when all children complete

**File**: `ClipMasterScreen.tsx` or new `useParentTitleGenerator.ts`

```typescript
import { useEffect } from 'react';
import { useClipStore } from '../store/clipStore';

export const useParentTitleGenerator = () => {
  const clips = useClipStore((state) => state.clips);
  const updateClip = useClipStore((state) => state.updateClip);

  useEffect(() => {
    // Find parents with all children completed
    const parents = clips.filter(c => !c.parentId);

    for (const parent of parents) {
      // Skip if already has AI title (not "Recording XX")
      if (!parent.title.startsWith('Recording ')) continue;

      // Get children
      const children = clips.filter(c => c.parentId === parent.id);
      if (children.length === 0) continue;

      // Check if all children complete
      const allComplete = children.every(c => c.status === null && c.formattedText);

      if (allComplete && children.length > 0) {
        // Generate title from first child's content
        const firstChild = children[0];
        if (firstChild.rawText) {
          generateTitleInBackground(parent.id, firstChild.rawText);
        }
      }
    }
  }, [clips]); // Re-run when clips change
};
```

**Usage in ClipMasterScreen**:
```typescript
export const ClipMasterScreen = () => {
  useParentTitleGenerator(); // Auto-generates titles when children complete

  // ... rest of component
};
```

**Benefits**:
- ✅ Automatic (no manual calls)
- ✅ Runs when clips change (Zustand triggers it)
- ✅ Works for offline and online recordings

---

### Phase 5: Fix UI Issues (1-2 hours)

#### Issue 1: Flickering States

**Root cause**: Status changes trigger re-renders mid-transition

**Solution**: Add debouncing to Zustand store

```typescript
// In clipStore.ts
updateClip: (id, updates) => {
  // Debounce status changes to prevent flicker
  if (updates.status) {
    setTimeout(() => {
      set((state) => ({
        clips: state.clips.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      }));
    }, 100); // Small delay to batch updates
  } else {
    // Non-status updates apply immediately
    set((state) => ({
      clips: state.clips.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  }
}
```

#### Issue 2: Home Screen Buttons

**Find where they're rendered** (need to investigate):
- Likely in `ClipRecordHeader.tsx` or `ClipRecordScreen.tsx`
- Check if conditional uses wrong screen state

**Temporary workaround**: Add explicit screen check
```typescript
// Only show copy/structure buttons on record screen WITH content
const showButtons =
  currentScreen === 'record' &&
  clip.formattedText &&
  clip.status === null;
```

#### Issue 3: Navbar Animation Variant

**File**: `mainvarmorph.tsx` line 45

**Add detection logic**:
```typescript
// Detect if we're viewing existing clip vs new recording
const variant = clip.formattedText && clip.status === null
  ? 'fade'   // Skip expansion, just show buttons
  : 'morph'; // Normal recording flow
```

---

## TESTING CHECKLIST

After Zustand refactor, test these scenarios:

### Test 1: Online Recording
- [ ] Record new clip online
- [ ] See AI title generate automatically
- [ ] See formatted text appear without manual refresh
- [ ] No flickering states

### Test 2: Offline 4-Clip Queue
- [ ] Go offline
- [ ] Record "Recording 01" with 4 clips
- [ ] Go online
- [ ] Watch auto-retry process all 4 clips
- [ ] **Expected**:
  - Parent title updates after first child completes
  - All clips have correct content
  - UI updates automatically (no manual refresh)
  - No flickering
  - Spinner rotates continuously during queue

### Test 3: Parent Title Generation
- [ ] Create parent with multiple children offline
- [ ] Go online
- [ ] **Expected**: Parent title changes from "Recording 01" to AI title after first child completes

### Test 4: Navigation
- [ ] Home screen → Record screen → Home screen
- [ ] **Expected**: Copy/Structure buttons only on record screen, not home
- [ ] **Expected**: Navbar uses 'fade' variant when viewing existing clips

---

## ROLLBACK PLAN

If Zustand causes issues, use the checkpoint you created:

**Quick Rollback** (Using Git Tag):
```bash
# Return to v2.5.8 pre-Zustand checkpoint
git reset --hard v2.5.8-pre-zustand
git clean -fd
npm install
```

**Alternative Approaches**:
1. **Keep Zustand installed** (no harm, just stop using it)
2. **Revert specific commits** (if you made incremental commits)
3. **Uninstall and revert code** (see "PRE-REFACTOR CHECKPOINT" section)
4. **Use Option B from 016**: Event-driven refactor instead

**Zustand is low-risk because**:
- Small library (3kb)
- No breaking changes to existing code (just replacements)
- Can coexist with sessionStorage temporarily
- Easy to remove if needed
- **You have a tagged checkpoint to return to** (v2.5.8-pre-zustand)

---

## ESTIMATED TIMELINE

| Phase | Optimistic | Realistic | Pessimistic |
|-------|-----------|-----------|-------------|
| Phase 1: Create Store | 1 hour | 1.5 hours | 2 hours |
| Phase 2: Replace Calls | 1.5 hours | 2.5 hours | 4 hours |
| Phase 3: Remove Globals | 30 min | 1 hour | 1.5 hours |
| Phase 4: Title Generation | 30 min | 1 hour | 2 hours |
| Phase 5: Fix UI Issues | 1 hour | 2 hours | 3 hours |
| **TOTAL** | **4.5 hours** | **8 hours** | **12.5 hours** |

**Recommendation**: Budget 1 full day (8 hours)

---

## MIGRATION STRATEGY

### Option A: Big Bang (Recommended)

**Approach**: Implement all phases at once in a feature branch

**Pros**:
- ✅ Clean cutover
- ✅ No half-migrated state
- ✅ Test everything together

**Cons**:
- ⚠️ More work upfront
- ⚠️ Harder to debug if issues arise

**Steps**:
1. Create feature branch: `git checkout -b feature/zustand-refactor`
2. Implement all 5 phases
3. Test thoroughly
4. Merge to main when working

---

### Option B: Incremental (Safer)

**Approach**: Implement one phase at a time, test each

**Pros**:
- ✅ Easier to debug
- ✅ Can stop/rollback at any phase
- ✅ Less risky

**Cons**:
- ⚠️ Code exists in half-migrated state
- ⚠️ More commits/testing cycles

**Steps**:
1. Phase 1: Create store (test it works standalone)
2. Phase 2: Replace one file at a time (test each)
3. Phase 3: Remove globals (test)
4. Phase 4: Title generation (test)
5. Phase 5: UI fixes (test)

---

## SUCCESS CRITERIA

After Zustand refactor, we should have:

**Architecture**:
- ✅ All clip state in Zustand store
- ✅ Zero manual `getClips()` calls
- ✅ Zero `setClips(getClips())` refresh calls
- ✅ No global `isFormatting` flag
- ✅ SessionStorage sync automatic via Zustand persist

**Functionality**:
- ✅ UI auto-refreshes when clips change
- ✅ Parent titles auto-generate when children complete
- ✅ No flickering states during transitions
- ✅ Navbar uses correct animation variant
- ✅ Copy/Structure buttons only on record screen
- ✅ Sequential processing still works (v2.5.7)
- ✅ All clips have correct content (v2.5.8)

**Code Quality**:
- ✅ TypeScript autocomplete for all store actions
- ✅ Easier to test (store can be mocked)
- ✅ Cleaner component code (no manual sync logic)
- ✅ Mobile-ready (Zustand works in React Native)

---

## NEXT STEPS FOR BUILDER

1. **Create Git checkpoint** ⚠️ CRITICAL - See "PRE-REFACTOR CHECKPOINT" section above
2. **Review this plan** - Any questions/concerns?
3. **Install Zustand** - Use project-specific installation command above
4. **Choose migration strategy** - Big Bang (A) or Incremental (B)?
5. **Implement Phase 1** - Create Zustand store
6. **Test** - Verify store works before proceeding

**Questions to answer before starting**:
- Do you prefer Option A (all at once) or Option B (incremental)?
- Any concerns about Zustand vs other state libraries (Jotai, Valtio)?
- Should we keep batching logic or remove it entirely? (Sequential processing makes it redundant)

---

## REFERENCES

- **016**: Complete Transcription Flow Analysis (root cause identification)
- **017**: Complete Problem Catalog (15 problems + industry patterns)
- **018**: Action Plan Sequential Fix (Option C implementation)
- **v2.5.7**: Sequential processing with `waitForClipToComplete()`
- **v2.5.8**: Fixed `formattedText` check for batching

**Builder**: Ask any questions about this plan before starting. We can adjust the approach based on your preferences.
